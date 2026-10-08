package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
)

// SppgHandoverService mendefinisikan kontrak logika bisnis serah terima boks makanan & BAST digital SPPG.
type SppgHandoverService interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgHandoverBundle, error)
	ListHandovers(ctx context.Context, sppgID string) ([]models.SppgHandover, error)
	GetHandover(ctx context.Context, id, sppgID string) (*models.SppgHandover, error)
	AdvanceStage(ctx context.Context, id, sppgID string, payload *models.AdvanceStagePayload) (*models.SppgHandover, error)
	FinishScan(ctx context.Context, id, sppgID string, perfect bool) (*models.SppgHandover, error)
	RejectBoxes(ctx context.Context, id, sppgID string, payload *models.RejectBoxesPayload) (*models.SppgHandover, error)
	ReplaceRejected(ctx context.Context, id, sppgID string, req *models.ReplaceRejectedPayload, actorName string) (*models.SppgHandover, int, error)
	SignBast(ctx context.Context, id, sppgID string, req *models.SignBastPayload, actorName string) (*models.SppgHandover, error)
}

type sppgHandoverService struct {
	repo repositories.SppgHandoverRepository
}

// NewSppgHandoverService membuat instance service serah terima baru (Constructor DI).
func NewSppgHandoverService(repo repositories.SppgHandoverRepository) SppgHandoverService {
	return &sppgHandoverService{repo: repo}
}

func (s *sppgHandoverService) GetBundle(ctx context.Context, sppgID string) (*models.SppgHandoverBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgHandoverService) ListHandovers(ctx context.Context, sppgID string) ([]models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListHandovers(ctx, sppgID)
}

func (s *sppgHandoverService) GetHandover(ctx context.Context, id, sppgID string) (*models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID sesi serah terima tidak boleh kosong")
	}
	return s.repo.GetHandover(ctx, id, sppgID)
}

func (s *sppgHandoverService) AdvanceStage(ctx context.Context, id, sppgID string, payload *models.AdvanceStagePayload) (*models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID sesi serah terima tidak boleh kosong")
	}

	if payload != nil && payload.Stage != "" {
		validStages := map[string]bool{
			"menunggu": true,
			"tiba":     true,
			"memindai": true,
			"lolos":    true,
			"hold":     true,
		}
		if !validStages[payload.Stage] {
			return nil, fmt.Errorf("tahap '%s' tidak valid dalam alur serah terima", payload.Stage)
		}
	}

	return s.repo.AdvanceStage(ctx, id, sppgID, payload)
}

func (s *sppgHandoverService) FinishScan(ctx context.Context, id, sppgID string, perfect bool) (*models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID sesi serah terima tidak boleh kosong")
	}
	return s.repo.FinishScan(ctx, id, sppgID, perfect)
}

func (s *sppgHandoverService) RejectBoxes(ctx context.Context, id, sppgID string, payload *models.RejectBoxesPayload) (*models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID sesi serah terima tidak boleh kosong")
	}
	if payload == nil || payload.Boxes <= 0 {
		return nil, errors.New("jumlah boks yang ditolak harus lebih besar dari 0")
	}
	if strings.TrimSpace(payload.Reason) == "" {
		return nil, errors.New("alasan penolakan / anomali boks makanan wajib diisi")
	}

	return s.repo.RejectBoxes(ctx, id, sppgID, payload)
}

func (s *sppgHandoverService) ReplaceRejected(ctx context.Context, id, sppgID string, req *models.ReplaceRejectedPayload, actorName string) (*models.SppgHandover, int, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, 0, errors.New("ID sesi serah terima tidak boleh kosong")
	}
	if req == nil || req.RejectIndex < 0 {
		return nil, 0, errors.New("indeks item penolakan tidak valid")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG"
	}

	return s.repo.ReplaceRejected(ctx, id, sppgID, req.RejectIndex, actorName)
}

func (s *sppgHandoverService) SignBast(ctx context.Context, id, sppgID string, req *models.SignBastPayload, actorName string) (*models.SppgHandover, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID sesi serah terima tidak boleh kosong")
	}
	if req == nil {
		return nil, errors.New("payload tanda tangan BAST tidak boleh kosong")
	}
	courier := strings.TrimSpace(req.Courier)
	teacher := strings.TrimSpace(req.Teacher)
	if courier == "" {
		return nil, errors.New("tanda tangan kurir pengantar wajib diisi")
	}
	if teacher == "" {
		return nil, errors.New("tanda tangan guru penerima / validator wajib diisi")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Petugas SPPG"
	}

	return s.repo.SignBast(ctx, id, sppgID, courier, teacher, actorName)
}
