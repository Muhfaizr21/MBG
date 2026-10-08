package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

// SppgQualityService mengelola logika bisnis kontrol mutu HACCP, evaluasi titik kritis, dan lembar rilis ahli gizi.
type SppgQualityService interface {
	GetQualityBundle(ctx context.Context, sppgID string) (*models.SppgQualityBundle, error)
	ListTempLogs(ctx context.Context, sppgID string) ([]models.SppgQualityTempLog, error)
	CreateTempLog(ctx context.Context, sppgID string, req *models.CreateTempLogPayload) (*models.SppgQualityTempLog, error)
	ListSignoffs(ctx context.Context, sppgID string) ([]models.SppgQualitySignoff, error)
	CreateSignoff(ctx context.Context, sppgID string, req *models.CreateSignoffPayload) (*models.SppgQualitySignoff, error)
	ListSamples(ctx context.Context, sppgID string) ([]models.SppgQualitySample, error)
	CreateSample(ctx context.Context, sppgID string, req *models.CreateSamplePayload) (*models.SppgQualitySample, error)
	UpdateSampleStatus(ctx context.Context, id, sppgID, status string) error
	SuperadminIntervention(ctx context.Context, req *models.SuperadminQualityInterventionPayload, actorID, actorRole, actorName string) error
}

type sppgQualityService struct {
	repo repositories.SppgQualityRepository
}

// NewSppgQualityService membuat instance service baru via Constructor DI.
func NewSppgQualityService(repo repositories.SppgQualityRepository) SppgQualityService {
	return &sppgQualityService{repo: repo}
}

func (s *sppgQualityService) GetQualityBundle(ctx context.Context, sppgID string) (*models.SppgQualityBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgQualityService) ListTempLogs(ctx context.Context, sppgID string) ([]models.SppgQualityTempLog, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListTempLogs(ctx, sppgID)
}

func (s *sppgQualityService) CreateTempLog(ctx context.Context, sppgID string, req *models.CreateTempLogPayload) (*models.SppgQualityTempLog, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	pointID := strings.ToLower(strings.TrimSpace(req.PointID))
	pointDef, ok := models.StandardCCPPoints[pointID]
	if !ok {
		return nil, errors.New("titik kritis CCP tidak dikenal (pilih ccp-1, ccp-2, atau ccp-3)")
	}
	req.PointID = pointID

	batchToken := strings.TrimSpace(strings.ToUpper(req.BatchToken))
	if batchToken == "" {
		return nil, errors.New("token batch wajib diisi")
	}

	measuredBy := strings.TrimSpace(req.MeasuredBy)
	if measuredBy == "" {
		return nil, errors.New("nama pengukur wajib diisi")
	}

	measuredAt := strings.TrimSpace(req.MeasuredAt)
	if measuredAt == "" {
		measuredAt = time.Now().Format("15:04")
	}

	// Evaluasi Vonis Berdasarkan Kaidah HACCP
	pass := true
	verdict := "LOLOS"

	if req.Value < pointDef.Min || req.Value > pointDef.Max {
		pass = false
		verdict = "GAGAL"
	} else if pointDef.NeedsHold && req.HoldMinutes < pointDef.MinHoldMinutes {
		pass = false
		verdict = "GAGAL"
	}

	evidenceName := strings.TrimSpace(req.EvidenceName)
	if evidenceName == "" {
		evidenceName = "tanpa foto"
	}

	log := &models.SppgQualityTempLog{
		ID:           fmt.Sprintf("log-%d", time.Now().UnixMilli()),
		SppgID:       sppgID,
		PointID:      pointDef.ID,
		BatchToken:   batchToken,
		Value:        req.Value,
		HoldMinutes:  req.HoldMinutes,
		MeasuredAt:   measuredAt,
		MeasuredBy:   measuredBy,
		EvidenceName: evidenceName,
		Pass:         pass,
		Verdict:      verdict,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateTempLog(ctx, log); err != nil {
		return nil, fmt.Errorf("gagal mencatat log suhu CCP: %w", err)
	}

	return log, nil
}

func (s *sppgQualityService) ListSignoffs(ctx context.Context, sppgID string) ([]models.SppgQualitySignoff, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListSignoffs(ctx, sppgID)
}

func (s *sppgQualityService) CreateSignoff(ctx context.Context, sppgID string, req *models.CreateSignoffPayload) (*models.SppgQualitySignoff, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	batchToken := strings.TrimSpace(strings.ToUpper(req.BatchToken))
	if batchToken == "" {
		return nil, errors.New("token batch yang dirilis wajib diisi")
	}

	signer := strings.TrimSpace(req.Signer)
	if signer == "" {
		return nil, errors.New("nama ahli gizi penandatangan wajib diisi")
	}

	if !req.Agree {
		return nil, errors.New("centang pernyataan kelayakan sebelum menandatangani lembar rilis")
	}

	// Pastikan 4 aspek terisi: rasa, aroma, tekstur, visual
	requiredAspects := []string{"rasa", "aroma", "tekstur", "visual"}
	allPass := true
	for _, a := range requiredAspects {
		val := strings.ToLower(strings.TrimSpace(req.Aspects[a]))
		if val == "" {
			return nil, fmt.Errorf("aspek sensori %s belum dinilai", a)
		}
		if val != "lolos" {
			allPass = false
		}
	}

	now := time.Now()
	signedAt := now.Format("02 Jan, 15:04 WIB")

	signoff := &models.SppgQualitySignoff{
		ID:         fmt.Sprintf("rel-%d", time.Now().UnixMilli()),
		SppgID:     sppgID,
		BatchToken: batchToken,
		Aspects:    req.Aspects,
		Note:       strings.TrimSpace(req.Note),
		Signer:     signer,
		SignedAt:   signedAt,
		Layak:      allPass,
		CreatedAt:  now,
	}

	if err := s.repo.CreateSignoff(ctx, signoff); err != nil {
		return nil, fmt.Errorf("gagal menyimpan lembar rilis mutu: %w", err)
	}

	return signoff, nil
}

func (s *sppgQualityService) ListSamples(ctx context.Context, sppgID string) ([]models.SppgQualitySample, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListSamples(ctx, sppgID)
}

func (s *sppgQualityService) CreateSample(ctx context.Context, sppgID string, req *models.CreateSamplePayload) (*models.SppgQualitySample, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	batchToken := strings.TrimSpace(strings.ToUpper(req.BatchToken))
	if batchToken == "" {
		return nil, errors.New("token batch sampel wajib diisi")
	}

	rackNo := strings.TrimSpace(strings.ToUpper(req.RackNo))
	if rackNo == "" {
		return nil, errors.New("nomor rak lemari pendingin wajib diisi")
	}

	storedBy := strings.TrimSpace(req.StoredBy)
	if storedBy == "" {
		return nil, errors.New("nama staf penyimpan sampel wajib diisi")
	}

	now := time.Now()
	storedAt := now.Format("2006-01-02T15:04")
	deadline := now.Add(48 * time.Hour).Format("02 Jan, 15:04 WIB")

	sample := &models.SppgQualitySample{
		ID:                fmt.Sprintf("smp-%d", time.Now().UnixMilli()),
		SppgID:            sppgID,
		BatchToken:        batchToken,
		RackNo:            rackNo,
		StoredAt:          storedAt,
		StoredBy:          storedBy,
		Status:            "tersimpan",
		RetentionDeadline: deadline,
		CreatedAt:         now,
	}

	if err := s.repo.CreateSample(ctx, sample); err != nil {
		return nil, fmt.Errorf("gagal mencatat sampel arsip pangan: %w", err)
	}

	return sample, nil
}

func (s *sppgQualityService) UpdateSampleStatus(ctx context.Context, id, sppgID, status string) error {
	trimmedStatus := strings.TrimSpace(strings.ToLower(status))
	if trimmedStatus != "dimusnahkan" && trimmedStatus != "tersimpan" {
		return errors.New("status sampel hanya boleh 'tersimpan' atau 'dimusnahkan'")
	}
	return s.repo.UpdateSampleStatus(ctx, id, sppgID, trimmedStatus)
}

func (s *sppgQualityService) SuperadminIntervention(ctx context.Context, req *models.SuperadminQualityInterventionPayload, actorID, actorRole, actorName string) error {
	if actorRole != models.RoleSuperadmin {
		return errors.New("hanya Superadmin BGN yang berwenang melakukan intervensi bahaya mutu/HACCP")
	}

	batchToken := strings.TrimSpace(strings.ToUpper(req.BatchToken))
	if batchToken == "" {
		return errors.New("token batch sasaran intervensi wajib dicantumkan")
	}

	reason := strings.TrimSpace(req.Reason)
	if len(reason) < 5 {
		return errors.New("alasan tindakan intervensi mutu wajib diisi minimal 5 karakter")
	}

	action := strings.TrimSpace(strings.ToLower(req.Action))
	if action != "quarantine" && action != "warning" {
		action = "warning"
	}

	if actorName == "" {
		actorName = "Superadmin BGN"
	}

	return s.repo.SuperadminIntervention(ctx, batchToken, action, reason, actorID, actorName)
}
