package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"strings"
)

// SppgComplianceService antarmuka logika bisnis sertifikasi akreditasi & sanitasi dapur SPPG.
type SppgComplianceService interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgComplianceBundle, error)
	ListDocs(ctx context.Context, sppgID string) ([]models.SppgComplianceDoc, error)
	RenewDoc(ctx context.Context, sppgID string, docID string, expiry string, fileName string) (*models.SppgComplianceDoc, error)
	ListHandlers(ctx context.Context, sppgID string) ([]models.SppgComplianceHandler, error)
	CreateHandler(ctx context.Context, sppgID string, payload *models.CreateComplianceHandlerPayload) (*models.SppgComplianceHandler, error)
	ListLabs(ctx context.Context, sppgID string) ([]models.SppgComplianceLab, error)
	CreateLab(ctx context.Context, sppgID string, payload *models.CreateComplianceLabPayload) (*models.SppgComplianceLab, error)
	ListAudits(ctx context.Context, sppgID string) ([]models.SppgComplianceAudit, error)
	RequestAudit(ctx context.Context, sppgID string, payload *models.RequestComplianceAuditPayload) (*models.SppgComplianceAudit, error)
}

type sppgComplianceService struct {
	repo repositories.SppgComplianceRepository
}

// NewSppgComplianceService membuat instance service compliance baru dengan Constructor Dependency Injection.
func NewSppgComplianceService(repo repositories.SppgComplianceRepository) SppgComplianceService {
	return &sppgComplianceService{repo: repo}
}

func (s *sppgComplianceService) GetBundle(ctx context.Context, sppgID string) (*models.SppgComplianceBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgComplianceService) ListDocs(ctx context.Context, sppgID string) ([]models.SppgComplianceDoc, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListDocs(ctx, sppgID)
}

func (s *sppgComplianceService) RenewDoc(ctx context.Context, sppgID string, docID string, expiry string, fileName string) (*models.SppgComplianceDoc, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if strings.TrimSpace(docID) == "" {
		return nil, errors.New("docId wajib diisi")
	}
	if strings.TrimSpace(expiry) == "" {
		return nil, errors.New("tanggal kedaluwarsa baru wajib diisi")
	}
	return s.repo.RenewDoc(ctx, sppgID, docID, expiry, fileName)
}

func (s *sppgComplianceService) ListHandlers(ctx context.Context, sppgID string) ([]models.SppgComplianceHandler, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListHandlers(ctx, sppgID)
}

func (s *sppgComplianceService) CreateHandler(ctx context.Context, sppgID string, payload *models.CreateComplianceHandlerPayload) (*models.SppgComplianceHandler, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if payload == nil {
		return nil, errors.New("payload staf tidak boleh kosong")
	}
	return s.repo.CreateHandler(ctx, sppgID, payload)
}

func (s *sppgComplianceService) ListLabs(ctx context.Context, sppgID string) ([]models.SppgComplianceLab, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListLabs(ctx, sppgID)
}

func (s *sppgComplianceService) CreateLab(ctx context.Context, sppgID string, payload *models.CreateComplianceLabPayload) (*models.SppgComplianceLab, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if payload == nil {
		return nil, errors.New("payload uji lab tidak boleh kosong")
	}
	return s.repo.CreateLab(ctx, sppgID, payload)
}

func (s *sppgComplianceService) ListAudits(ctx context.Context, sppgID string) ([]models.SppgComplianceAudit, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListAudits(ctx, sppgID)
}

func (s *sppgComplianceService) RequestAudit(ctx context.Context, sppgID string, payload *models.RequestComplianceAuditPayload) (*models.SppgComplianceAudit, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if payload == nil {
		return nil, errors.New("payload permohonan audit tidak boleh kosong")
	}
	return s.repo.RequestAudit(ctx, sppgID, payload)
}
