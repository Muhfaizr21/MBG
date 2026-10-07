package services

import (
	"backend/models"
	"backend/repositories"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"regexp"
	"strings"
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

// ScanService defines business logic for the scan endpoint.
type ScanService interface {
	Predict(ctx context.Context, image []byte, fileName string) (*Prediction, error)
	SubmitScan(ctx context.Context, actorID string, image []byte, fileName, qrToken, boxID, batchID, items string, holdingTempC, releaseTempC *float64) (*models.ScanResult, error)
	ListRecent(ctx context.Context, limit int) ([]models.ScanLog, error)
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
func (s *scanService) SubmitScan(
	ctx context.Context,
	actorID string,
	image []byte,
	fileName, qrToken, boxID, batchID, items string,
	holdingTempC, releaseTempC *float64,
) (*models.ScanResult, error) {
	qrToken = strings.TrimSpace(qrToken)
	if len(image) == 0 {
		return nil, ErrImageRequired
	}
	if fileName == "" {
		fileName = "capture.jpg"
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

	// 1. Verifikasi QR (Tahap 1).
	qrNote := "Token " + qrToken + " valid"
	if qrToken == "" {
		qrNote = "Token QR tidak disertai pada permintaan"
	}
	if !qrValid && qrToken != "" {
		qrNote = "Token " + qrToken + " tidak cocok format MBG-..."
	}
	checks = append(checks, models.ScanCheck{Label: "Verifikasi token QR boks", OK: qrValid, Note: qrNote})
	if !qrValid {
		reasons = append(reasons, "QR boks gagal verifikasi")
	}

	// 2. Suhu lepas dapur (opsional).
	if releaseTempC != nil {
		ok := *releaseTempC >= minReleaseTempC
		note := fmt.Sprintf("%.1f°C — di atas ambang %.0f°C", *releaseTempC, minReleaseTempC)
		if !ok {
			note = fmt.Sprintf("%.1f°C — di bawah ambang %.0f°C", *releaseTempC, minReleaseTempC)
			reasons = append(reasons, fmt.Sprintf("suhu lepas dapur %.1f°C di bawah %.0f°C", *releaseTempC, minReleaseTempC))
		}
		checks = append(checks, models.ScanCheck{Label: "Suhu masak inti saat lepas dapur", OK: ok, Note: note})
	}

	// 3. Suhu holding (opsional).
	if holdingTempC != nil {
		ok := *holdingTempC >= minHoldingTempC
		note := fmt.Sprintf("%.1f°C — di atas ambang %.0f°C", *holdingTempC, minHoldingTempC)
		if !ok {
			note = fmt.Sprintf("%.1f°C — di bawah ambang %.0f°C", *holdingTempC, minHoldingTempC)
			reasons = append(reasons, fmt.Sprintf("suhu holding %.1f°C di bawah %.0f°C", *holdingTempC, minHoldingTempC))
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
	if boxID = strings.TrimSpace(boxID); boxID == "" && qrToken != "" {
		segments := strings.Split(qrToken, "-")
		boxID = "BOK-" + segments[len(segments)-1]
	}
	if boxID == "" {
		boxID = "BOK-TANPA-QR"
	}

	scanID, err := s.nextScanID(ctx)
	if err != nil {
		return nil, fmt.Errorf("membuat id scan: %w", err)
	}

	now := time.Now()
	entry := &models.ScanLog{
		ID:           scanID,
		BoxID:        boxID,
		QRToken:      qrToken,
		BatchID:      strings.TrimSpace(batchID),
		ImageRef:     fileName,
		AIClass:      pred.ClassName,
		AIConfidence: pred.Confidence,
		VisualScore:  score,
		HoldingTempC: holdingTempC,
		ReleaseTempC: releaseTempC,
		Verdict:      verdict,
		Reason:       note,
		ActorID:      actorID,
		CreatedAt:    now,
	}
	if err := s.repo.InsertScan(ctx, entry); err != nil {
		return nil, fmt.Errorf("menyimpan scan log: %w", err)
	}

	result := &models.ScanResult{
		ID:           entry.ID,
		BoxID:        entry.BoxID,
		QRToken:      entry.QRToken,
		BatchID:      entry.BatchID,
		ScannedAt:    now.In(wib).Format("15:04") + " WIB",
		Score:        score,
		Verdict:      verdict,
		VerdictLabel: verdictLabel,
		ReleaseTemp:  derefFloat(releaseTempC),
		HoldTemp:     derefFloat(holdingTempC),
		Checks:       checks,
		Note:         note,
		AIClass:      pred.ClassName,
		AIConfidence: pred.Confidence,
		AILatencyMS:  pred.LatencyMS,
	}

	// Makronutrien dari dataset gizi (opsional): bila client mengirim `items`
	// dan bahan cocok, macros terisi; jika tidak, tetap nil → frontend fallback.
	if s.nutrition != nil && strings.TrimSpace(items) != "" {
		matches, macros, nutritionNote, matchErr := s.nutrition.MatchItems(ctx, ParseItems(items))
		if matchErr != nil {
			return nil, matchErr
		}
		if macros != nil {
			result.Macros = macros
			result.Nutrition = matches
			result.NutritionNote = nutritionNote
		}
	}

	return result, nil
}

// ListRecent returns the newest scan logs for the validator history view.
func (s *scanService) ListRecent(ctx context.Context, limit int) ([]models.ScanLog, error) {
	return s.repo.ListRecentScans(ctx, limit)
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
