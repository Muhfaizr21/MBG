package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// SppgBatchService mengelola logika bisnis kontrol keamanan HACCP, penomoran token, dan audit karantina.
type SppgBatchService interface {
	GetBatchBundle(ctx context.Context, sppgID string) (*models.SppgBatchBundle, error)
	ListBatches(ctx context.Context, sppgID string) ([]models.SppgBatch, error)
	CreateBatch(ctx context.Context, sppgID string, req *models.CreateBatchPayload) (*models.SppgBatch, error)
	UpdateBatchStatus(ctx context.Context, id, sppgID string, req *models.UpdateBatchStatusPayload) error
	VerifyToken(ctx context.Context, sppgID string, token string) (*models.VerifyBatchTokenResult, error)
	QuarantineBatch(ctx context.Context, id string, reason string, actorID, actorRole, actorName string) (*models.SppgBatch, error)
	DeleteBatch(ctx context.Context, id, sppgID string) error
}

type sppgBatchService struct {
	repo repositories.SppgBatchRepository
}

// NewSppgBatchService membuat instance service baru dengan Dependency Injection.
func NewSppgBatchService(repo repositories.SppgBatchRepository) SppgBatchService {
	return &sppgBatchService{repo: repo}
}

func (s *sppgBatchService) GetBatchBundle(ctx context.Context, sppgID string) (*models.SppgBatchBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgBatchService) ListBatches(ctx context.Context, sppgID string) ([]models.SppgBatch, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.List(ctx, sppgID)
}

func (s *sppgBatchService) CreateBatch(ctx context.Context, sppgID string, req *models.CreateBatchPayload) (*models.SppgBatch, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	// 1. Validasi Input
	schoolID := strings.TrimSpace(req.SchoolID)
	if schoolID == "" {
		return nil, errors.New("sekolah sasaran wajib dipilih")
	}

	if req.BoxCount < 1 || req.BoxCount > 2500 {
		return nil, errors.New("jumlah boks per batch harus antara 1 sampai 2.500 porsi")
	}

	cookedAt := strings.TrimSpace(req.CookedAt)
	if cookedAt == "" {
		return nil, errors.New("jam selesai masak wajib diisi")
	}

	// Kontrol Suhu Inti HACCP: Minimal 70.0 C dan Maksimal 100.0 C
	if req.CookTemp < 70.0 || req.CookTemp > 100.0 {
		return nil, errors.New("suhu masak inti tidak memenuhi standar HACCP (harus 70.0C s/d 100.0C)")
	}

	// 2. Dapatkan Bundle untuk Referensi Metadata Sekolah & Menu
	bundle, err := s.repo.GetBundle(ctx, sppgID)
	if err != nil {
		return nil, fmt.Errorf("gagal membaca metadata dapur: %w", err)
	}

	// Resolve School Metadata
	var matchedSchool *models.AssignedSchoolSummary
	for _, sc := range bundle.AvailableSchools {
		if sc.ID == schoolID || sc.Code == schoolID {
			matchedSchool = &sc
			break
		}
	}
	schoolCode := "SCHXX"
	schoolName := "Sekolah Penerima MBG"
	if matchedSchool != nil {
		schoolCode = matchedSchool.Code
		schoolName = matchedSchool.Name
	}

	// Resolve Menu Metadata
	var matchedMenu *models.MenuPackageSummary
	menuCode := strings.TrimSpace(req.MenuCode)
	menuID := strings.TrimSpace(req.MenuID)
	for _, m := range bundle.AvailableMenus {
		if (menuCode != "" && m.Code == menuCode) || (menuID != "" && m.ID == menuID) {
			matchedMenu = &m
			break
		}
	}

	menuName := "Paket Menu Sehat BGN"
	allergens := []string{}
	if matchedMenu != nil {
		menuCode = matchedMenu.Code
		menuName = matchedMenu.Name
		allergens = matchedMenu.Allergens
	} else if menuCode == "" {
		menuCode = "PAKET-A-01"
		menuName = "Nasi Ayam Panggang Madu & Capcay Brokoli Segar"
		allergens = []string{"Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"}
	}

	// 3. Generate Sequence & Format Token
	seq, err := s.repo.NextSeqForSchool(ctx, sppgID, schoolID)
	if err != nil {
		seq = 1
	}

	cleanKitchenCode := strings.ReplaceAll(bundle.KitchenCode, "-", "")
	if cleanKitchenCode == "" {
		cleanKitchenCode = strings.ReplaceAll(sppgID, "-", "")
	}

	token := fmt.Sprintf("MBG-2026-%s-%s-B%02d", cleanKitchenCode, schoolCode, seq)

	// Batas aman konsumsi: 4 jam (240 menit) setelah waktu masak selesai
	consumeBy := addMinutesToClock(cookedAt, 240)

	batch := &models.SppgBatch{
		ID:             fmt.Sprintf("batch-%d", time.Now().UnixMilli()),
		SppgID:         sppgID,
		Token:          token,
		Seq:            seq,
		SchoolID:       schoolID,
		SchoolCode:     schoolCode,
		SchoolName:     schoolName,
		MenuCode:       menuCode,
		MenuName:       menuName,
		BoxCount:       req.BoxCount,
		CookedAt:       cookedAt,
		ConsumeBy:      consumeBy,
		CookTemp:       req.CookTemp,
		Allergens:      allergens,
		Status:         "draft",
		Verified:       false,
		CookingDate:    time.Now().Format("2006-01-02"),
		TargetPortions: req.BoxCount,
		ActualPortions: req.BoxCount,
		CoreTempC:      req.CookTemp,
		CookLead:       req.CookLead,
		QCStatus:       "passed",
		HACCPStatus:    "safe",
	}

	// Hitung Checksum SHA-256
	batch.Checksum = ComputeBatchChecksum(batch)

	// Simpan ke database
	if err := s.repo.Create(ctx, batch); err != nil {
		return nil, fmt.Errorf("gagal menyimpan batch ke database: %w", err)
	}

	return batch, nil
}

func (s *sppgBatchService) UpdateBatchStatus(ctx context.Context, id, sppgID string, req *models.UpdateBatchStatusPayload) error {
	status := strings.TrimSpace(req.Status)
	if status != "draft" && status != "queued" && status != "ready" {
		return errors.New("status batch tidak valid (harus draft, queued, atau ready)")
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("batch tidak ditemukan")
	}
	if existing.Status == "quarantined" {
		return errors.New("batch sedang dalam status karantina keamanan pangan dan tidak dapat diubah sembarangan")
	}

	return s.repo.UpdateStatus(ctx, id, sppgID, status)
}

func (s *sppgBatchService) VerifyToken(ctx context.Context, sppgID string, rawToken string) (*models.VerifyBatchTokenResult, error) {
	token := strings.TrimSpace(strings.ToUpper(rawToken))
	if token == "" {
		return &models.VerifyBatchTokenResult{
			OK:      false,
			Message: "Tempel atau ketik token QR, lalu tekan Verifikasi.",
		}, nil
	}

	// Cek apakah token merupakan token master tote: contoh MBG-2026-SPPG01-SDN01P-B01-M02
	matchedType := "box"
	toteIndex := 0
	baseToken := token

	if idx := strings.Index(token, "-M"); idx != -1 {
		matchedType = "master_tote"
		baseToken = token[:idx]
		toteStr := token[idx+2:]
		if val, err := strconv.Atoi(toteStr); err == nil {
			toteIndex = val
		}
	}

	batch, err := s.repo.GetByToken(ctx, baseToken)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return &models.VerifyBatchTokenResult{
			OK:      false,
			Message: fmt.Sprintf("Token %s tidak terdaftar di sesi dapur hari ini.", token),
		}, nil
	}

	// Verifikasi Checksum SHA-256
	expectedChecksum := ComputeBatchChecksum(batch)
	if expectedChecksum != batch.Checksum && batch.Checksum != "" {
		return &models.VerifyBatchTokenResult{
			OK:      false,
			Message: fmt.Sprintf("Token terdaftar tetapi stempel checksum %s tidak cocok. Tahan batch ini.", batch.Token),
			Batch:   batch,
		}, nil
	}

	// Tandai status terverifikasi lolos uji mandiri
	_ = s.repo.SetVerified(ctx, batch.ID, batch.SppgID, true)
	batch.Verified = true

	var msg string
	if matchedType == "master_tote" {
		msg = fmt.Sprintf("Token kontainer master M%02d cocok dan valid. %s (%s, %d boks).",
			toteIndex, batch.Token, batch.SchoolName, batch.BoxCount)
	} else {
		msg = fmt.Sprintf("Token cocok dan checksum valid. %s, %s, %d boks.",
			batch.Token, batch.SchoolName, batch.BoxCount)
	}

	return &models.VerifyBatchTokenResult{
		OK:          true,
		Message:     msg,
		Batch:       batch,
		MatchedType: matchedType,
		ToteIndex:   toteIndex,
	}, nil
}

func (s *sppgBatchService) QuarantineBatch(ctx context.Context, id string, reason string, actorID, actorRole, actorName string) (*models.SppgBatch, error) {
	// Superadmin Authorization Check
	if actorRole != models.RoleSuperadmin {
		return nil, errors.New("hanya Superadmin BGN yang berwenang melakukan karantina atau penarikan batch darurat")
	}

	trimmedReason := strings.TrimSpace(reason)
	if len(trimmedReason) < 5 {
		return nil, errors.New("alasan karantina / penarikan batch darurat wajib diisi minimal 5 karakter")
	}

	if actorName == "" {
		actorName = "Superadmin BGN"
	}

	quarantinedBatch, err := s.repo.Quarantine(ctx, id, trimmedReason, actorID, actorName)
	if err != nil {
		return nil, err
	}

	return quarantinedBatch, nil
}

func (s *sppgBatchService) DeleteBatch(ctx context.Context, id, sppgID string) error {
	return s.repo.Delete(ctx, id, sppgID)
}

// ComputeBatchChecksum menghitung representasi SHA-256 canonical dari batch.
func ComputeBatchChecksum(b *models.SppgBatch) string {
	payload := fmt.Sprintf("%s#%s#%s#%s#%.1f#%s#%d",
		b.Token,
		b.MenuCode,
		b.CookedAt,
		b.ConsumeBy,
		b.CookTemp,
		strings.Join(b.Allergens, "|"),
		b.BoxCount,
	)

	hasher := sha256.New()
	hasher.Write([]byte(payload))
	return hex.EncodeToString(hasher.Sum(nil))
}

func addMinutesToClock(clock string, minutes int) string {
	parts := strings.Split(clock, ":")
	if len(parts) != 2 {
		return clock
	}
	h, err1 := strconv.Atoi(parts[0])
	m, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil {
		return clock
	}
	total := (h*60 + m + minutes) % 1440
	if total < 0 {
		total += 1440
	}
	return fmt.Sprintf("%02d:%02d", total/60, total%60)
}
