package services

import (
	"backend/models"
	"backend/repositories"
	"bytes"
	"context"
	"crypto/md5"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

var (
	// ErrAIUnavailable dipakai controller untuk membalas 502.
	ErrAIUnavailable = errors.New("layanan AI tidak tersedia")
	// ErrImageRequired dipakai controller untuk membalas 400.
	ErrImageRequired = errors.New("file gambar wajib diunggah")
)

const (
	// Ambang skor (setara mobile src/utils/quality.ts).
	scoreLayak   = 95.0
	scoreWaspada = 80.0

	// Ambang suhu (setara VALIDATOR.md / quality.ts).
	minReleaseTempC = 75.0
	minHoldingTempC = 60.0

	maxImageBytes = 8 << 20 // 8 MB
	aiTimeout     = 30 * time.Second
)

// qrTokenPattern: token QR boks berformat MBG-... (mis. MBG-2026-SPPG01-SDN01P-B17).
var qrTokenPattern = regexp.MustCompile(`^MBG-[A-Za-z0-9-]+$`)

// wib adalah zona waktu Indonesia Barat untuk tampilan scannedAt.
var wib = time.FixedZone("WIB", 7*3600)

// Prediction is the JSON contract of POST {AI_BACKEND_URL}/predict.
type Prediction struct {
	ClassName          string             `json:"class_name"`
	ClassID            int                `json:"class_id"`
	Confidence         float64            `json:"confidence"`
	ClassProbabilities map[string]float64 `json:"class_probabilities"`
	LatencyMS          float64            `json:"latency_ms"`
}

// ScanSubmission adalah input tervalidasi untuk satu pemindaian boks.
//
// Dipakai struct (bukan daftar parameter) karenaSubmitScan sudah punya banyak
// input opsional; satu perubahan field tidak boleh menggeser posisi argumen.
type ScanSubmission struct {
	ActorID      string
	Image        []byte
	FileName     string
	QRToken      string
	BoxID        string
	BatchID      string
	Items        string
	HoldingTempC *float64
	ReleaseTempC *float64

	// DurationMS adalah lama inspeksi visual yang diukur klien, dalam
	// milidetik. Dipakai audit superadmin untuk menandai pindai "kilat"
	// (Juknis MBG Pasal 14). Nil bila klien tidak mengirimkannya.
	DurationMS *int

	Persist  bool
	Rating   int
	Feedback string
}

// ScanService defines business logic for the scan endpoint.
type ScanService interface {
	Predict(ctx context.Context, image []byte, fileName string) (*Prediction, error)
	SubmitScan(ctx context.Context, in ScanSubmission) (*models.ScanResult, error)
	ListRecent(ctx context.Context, limit int) ([]models.ScanLog, error)
	UpdateFeedback(ctx context.Context, id string, rating int, feedback string, tempC *float64) error
	DeleteScan(ctx context.Context, actorID, id string) error
	DeleteAllScans(ctx context.Context, actorID string) error
}

type scanService struct {
	repo      repositories.ScanRepository
	aiURL     string
	nutrition NutritionService
	client    *http.Client
}

// NewScanService injects the repository, AI service URL, and nutrition service (Dependency Injection).
func NewScanService(repo repositories.ScanRepository, aiURL string, nutrition NutritionService) ScanService {
	return &scanService{
		repo:      repo,
		aiURL:     strings.TrimRight(aiURL, "/"),
		nutrition: nutrition,
		client:    &http.Client{Timeout: aiTimeout},
	}
}

// Predict forwards the image to the Python AI service (multipart field "image").
func (s *scanService) Predict(ctx context.Context, image []byte, fileName string) (*Prediction, error) {
	if len(image) == 0 {
		return nil, ErrImageRequired
	}
	if len(image) > maxImageBytes {
		return nil, fmt.Errorf("%w: ukuran gambar maksimal %d byte", ErrImageRequired, maxImageBytes)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("image", fileName)
	if err != nil {
		return nil, fmt.Errorf("menyiapkan multipart: %w", err)
	}
	if _, err := part.Write(image); err != nil {
		return nil, fmt.Errorf("menulis gambar: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("menutup multipart: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.aiURL+"/predict", &body)
	if err != nil {
		return nil, fmt.Errorf("membuat request AI: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("memanggil AI service: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("membaca respons AI: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service membalas HTTP %d", resp.StatusCode)
	}

	pred := &Prediction{}
	if err := json.Unmarshal(raw, pred); err != nil {
		return nil, fmt.Errorf("respons AI tidak valid: %w", err)
	}
	return pred, nil
}

// SubmitScan runs the two-stage verification (QR + visual AI), persists scan_logs,
// enriches the decision card with macros from the nutrition dataset, and returns it.
func (s *scanService) SubmitScan(ctx context.Context, in ScanSubmission) (*models.ScanResult, error) {
	actorID := in.ActorID
	image := in.Image
	fileName := in.FileName
	qrToken := strings.TrimSpace(in.QRToken)
	if len(image) == 0 {
		return nil, ErrImageRequired
	}
	if fileName == "" {
		fileName = "capture.jpg"
	}

	// Cek deduplikasi: jika scan identik dikirim dalam 5 detik, jangan duplikasi database
	dedupKey := fmt.Sprintf("%s:%x", actorID, md5.Sum(image))
	if cached := getCachedScan(dedupKey); cached != nil {
		return cached, nil
	}

	pred, err := s.Predict(ctx, image, fileName)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrAIUnavailable, err)
	}

	score := math.Round(freshnessScore(pred)*10) / 10
	qrValid := qrTokenPattern.MatchString(qrToken)
	freshClass := isFreshClass(pred.ClassName)

	var reasons []string
	checks := []models.ScanCheck{}

	// 1. Verifikasi QR (Tahap 1) — hanya dijalankan bila token disertai.
	// Pemindaian foto makanan (tanpa boks) tidak menyertakan QR, sehingga
	// keputusan diambil dari hasil AI + suhu saja (konsisten dengan cek suhu opsional).
	if qrToken != "" {
		qrNote := "Token " + qrToken + " valid"
		if !qrValid {
			qrNote = "Token " + qrToken + " tidak cocok format MBG-..."
		}
		checks = append(checks, models.ScanCheck{Label: "Verifikasi token QR boks", OK: qrValid, Note: qrNote})
		if !qrValid {
			reasons = append(reasons, "QR boks gagal verifikasi")
		}
	}

	// 2. Suhu lepas dapur (opsional).
	if in.ReleaseTempC != nil {
		ok := *in.ReleaseTempC >= minReleaseTempC
		note := fmt.Sprintf("%.1f°C — di atas ambang %.0f°C", *in.ReleaseTempC, minReleaseTempC)
		if !ok {
			note = fmt.Sprintf("%.1f°C — di bawah ambang %.0f°C", *in.ReleaseTempC, minReleaseTempC)
			reasons = append(reasons, fmt.Sprintf("suhu lepas dapur %.1f°C di bawah %.0f°C", *in.ReleaseTempC, minReleaseTempC))
		}
		checks = append(checks, models.ScanCheck{Label: "Suhu masak inti saat lepas dapur", OK: ok, Note: note})
	}

	// 3. Suhu holding (opsional).
	if in.HoldingTempC != nil {
		ok := *in.HoldingTempC >= minHoldingTempC
		note := fmt.Sprintf("%.1f°C — di atas ambang %.0f°C", *in.HoldingTempC, minHoldingTempC)
		if !ok {
			note = fmt.Sprintf("%.1f°C — di bawah ambang %.0f°C", *in.HoldingTempC, minHoldingTempC)
			reasons = append(reasons, fmt.Sprintf("suhu holding %.1f°C di bawah %.0f°C", *in.HoldingTempC, minHoldingTempC))
		}
		checks = append(checks, models.ScanCheck{Label: "Suhu holding boks", OK: ok, Note: note})
	}

	// 4. Deteksi visual AI (Tahap 2).
	visualNote := fmt.Sprintf("%s · keyakinan %.0f%%", pred.ClassName, pred.Confidence*100)
	checks = append(checks, models.ScanCheck{Label: "Deteksi visual AI (YOLOv8)", OK: freshClass, Note: visualNote})
	if !freshClass {
		reasons = append(reasons, "AI mendeteksi "+pred.ClassName)
	}

	// Keputusan: kegagalan kritis menutup pintu; skor hanya membedakan layak/peringatan.
	blocked := false
	for _, c := range checks {
		if !c.OK {
			blocked = true
			break
		}
	}

	var verdict, verdictLabel string
	switch {
	case blocked:
		verdict, verdictLabel = models.VerdictTolak, "TIDAK LAYAK KONSUMSI"
	case score >= scoreLayak:
		verdict, verdictLabel = models.VerdictLayak, "LAYAK KONSUMSI"
	case score >= scoreWaspada:
		verdict, verdictLabel = models.VerdictPeringatan, "KONSUMSI SEGERA"
	default:
		verdict, verdictLabel = models.VerdictTolak, "TIDAK LAYAK KONSUMSI"
	}

	switch verdict {
	case models.VerdictLayak:
		reasons = []string{"Sampel lolos dua tahap verifikasi. Aman dibagikan ke kelas."}
	case models.VerdictPeringatan:
		reasons = []string{fmt.Sprintf("Skor keamanan %.1f, di bawah ambang layak %.0f. Bagikan segera ke kelas.", score, scoreLayak)}
	default:
		if len(reasons) == 0 {
			reasons = []string{fmt.Sprintf("Skor keamanan %.1f, di bawah ambang %.0f.", score, scoreWaspada)}
		}
	}
	note := strings.Join(reasons, "; ")

	// Identitas boks: dari client, atau diturunkan dari token QR.
	boxID := strings.TrimSpace(in.BoxID)
	if boxID == "" && qrToken != "" {
		segments := strings.Split(qrToken, "-")
		boxID = "BOK-" + segments[len(segments)-1]
	}
	if boxID == "" {
		boxID = "BOK-TANPA-QR"
	}

	now := time.Now().In(wib)
	scanID := "TEMP-PREVIEW"
	savedFileName := ""

	batchID := strings.TrimSpace(in.BatchID)
	if in.Persist {
		var err error
		scanID, err = s.nextScanID(ctx)
		if err != nil {
			return nil, fmt.Errorf("membuat id scan: %w", err)
		}

		// Simpan gambar ke folder uploads/
		savedFileName = scanID + ".webp"
		if err := saveUploadedImage(image, savedFileName); err != nil {
			// Tidak fatal — lanjutkan meski gagal simpan file
			savedFileName = fileName
		}

		entry := &models.ScanLog{
			ID:           scanID,
			BoxID:        boxID,
			QRToken:      qrToken,
			BatchID:      batchID,
			ImageRef:     savedFileName,
			AIClass:      pred.ClassName,
			AIConfidence: pred.Confidence,
			VisualScore:  score,
			HoldingTempC: in.HoldingTempC,
			ReleaseTempC: in.ReleaseTempC,
			DurationMS:   in.DurationMS,
			Verdict:      verdict,
			Reason:       note,
			ActorID:      actorID,
			CreatedAt:    now,
			Rating:       in.Rating,
			Feedback:     in.Feedback,
		}
		if err := s.repo.InsertScan(ctx, entry); err != nil {
			return nil, fmt.Errorf("menyimpan scan log: %w", err)
		}
	}

	result := &models.ScanResult{
		ID:           scanID,
		BoxID:        boxID,
		QRToken:      qrToken,
		BatchID:      batchID,
		ScannedAt:    now.In(wib).Format("15:04") + " WIB",
		Score:        score,
		Verdict:      verdict,
		VerdictLabel: verdictLabel,
		ReleaseTemp:  derefFloat(in.ReleaseTempC),
		HoldTemp:     derefFloat(in.HoldingTempC),
		Checks:       checks,
		Note:         note,
		AIClass:      pred.ClassName,
		AIConfidence: pred.Confidence,
		AILatencyMS:  pred.LatencyMS,
	}

	// Makronutrien dari dataset gizi (opsional): bila client mengirim `items`
	// dan bahan cocok, macros terisi; jika tidak, tetap nil → frontend fallback.
	if s.nutrition != nil && strings.TrimSpace(in.Items) != "" {
		matches, macros, nutritionNote, matchErr := s.nutrition.MatchItems(ctx, ParseItems(in.Items))
		if matchErr != nil {
			return nil, matchErr
		}
		if macros != nil {
			result.Macros = macros
			result.Nutrition = matches
			result.NutritionNote = nutritionNote
		}
	}

	if in.Persist {
		setCachedScan(dedupKey, result)
	}
	return result, nil
}

// ListRecent returns the newest scan logs for the validator history view.
func (s *scanService) ListRecent(ctx context.Context, limit int) ([]models.ScanLog, error) {
	return s.repo.ListRecentScans(ctx, limit)
}

func (s *scanService) UpdateFeedback(ctx context.Context, id string, rating int, feedback string, tempC *float64) error {
	return s.repo.UpdateScanFeedback(ctx, id, rating, feedback, tempC)
}

func (s *scanService) nextScanID(ctx context.Context) (string, error) {
	count, err := s.repo.CountToday(ctx)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("SCN-VLD-%s-%03d", time.Now().In(wib).Format("060102"), count+1), nil
}

// freshnessScore menghitung skor kesegaran 0-100 dari probabilitas kelas model.
// Mendukung binary Fresh/Spoiled maupun pola multi-kelas fresh_*/stale_*.
func freshnessScore(pred *Prediction) float64 {
	probs := pred.ClassProbabilities
	var freshSum, spoiledSum float64
	for name, p := range probs {
		switch n := strings.ToLower(name); {
		case strings.HasPrefix(n, "fresh"), n == "segar":
			freshSum += p
		case strings.HasPrefix(n, "stale"), strings.HasPrefix(n, "spoiled"),
			strings.HasPrefix(n, "rotten"), strings.HasPrefix(n, "bad"), n == "busuk":
			spoiledSum += p
		}
	}
	switch {
	case freshSum > 0:
		return clampScore(freshSum * 100)
	case spoiledSum > 0:
		return clampScore((1 - spoiledSum) * 100)
	case isFreshClass(pred.ClassName):
		return clampScore(pred.Confidence * 100)
	default:
		return clampScore((1 - pred.Confidence) * 100)
	}
}

// isFreshClass reports whether the top prediction means the food is fit to serve.
func isFreshClass(className string) bool {
	n := strings.ToLower(strings.TrimSpace(className))
	if n == "" {
		return false
	}
	if strings.HasPrefix(n, "stale") || strings.HasPrefix(n, "spoiled") ||
		strings.HasPrefix(n, "rotten") || strings.HasPrefix(n, "bad") || n == "busuk" {
		return false
	}
	return strings.HasPrefix(n, "fresh") || n == "segar"
}

func clampScore(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return v
}

func derefFloat(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

func (s *scanService) DeleteScan(ctx context.Context, actorID, id string) error {
	imageRef, err := s.repo.DeleteScan(ctx, id)
	if err != nil {
		return err
	}
	if imageRef != "" {
		deleteUploadedImage(imageRef)
	}
	return nil
}

func (s *scanService) DeleteAllScans(ctx context.Context, actorID string) error {
	imageRefs, err := s.repo.DeleteAllScans(ctx)
	if err != nil {
		return err
	}
	for _, ref := range imageRefs {
		deleteUploadedImage(ref)
	}
	cleanUploadsDir()
	return nil
}

// saveUploadedImage menyimpan bytes gambar ke folder uploads/ di direktori kerja.
func saveUploadedImage(data []byte, fileName string) error {
	const uploadDir = "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return fmt.Errorf("membuat folder uploads: %w", err)
	}
	dest := filepath.Join(uploadDir, fileName)
	return os.WriteFile(dest, data, 0644)
}

func deleteUploadedImage(fileName string) {
	if fileName == "" {
		return
	}
	cleanName := filepath.Base(fileName)
	_ = os.Remove(filepath.Join("uploads", cleanName))
}

func cleanUploadsDir() {
	entries, err := os.ReadDir("uploads")
	if err != nil {
		return
	}
	for _, e := range entries {
		if !e.IsDir() {
			_ = os.Remove(filepath.Join("uploads", e.Name()))
		}
	}
}

type scanDedupEntry struct {
	result    *models.ScanResult
	createdAt time.Time
}

var (
	dedupMu    sync.Mutex
	dedupCache = make(map[string]scanDedupEntry)
)

func getCachedScan(key string) *models.ScanResult {
	dedupMu.Lock()
	defer dedupMu.Unlock()
	entry, ok := dedupCache[key]
	if !ok {
		return nil
	}
	if time.Since(entry.createdAt) > 5*time.Second {
		delete(dedupCache, key)
		return nil
	}
	return entry.result
}

func setCachedScan(key string, res *models.ScanResult) {
	dedupMu.Lock()
	defer dedupMu.Unlock()
	now := time.Now()
	for k, v := range dedupCache {
		if now.Sub(v.createdAt) > time.Minute {
			delete(dedupCache, k)
		}
	}
	dedupCache[key] = scanDedupEntry{
		result:    res,
		createdAt: now,
	}
}
