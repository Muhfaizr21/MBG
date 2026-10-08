package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"strings"
)

// SppgBillingService antarmuka logika bisnis klaim & penagihan invoice SPPG.
type SppgBillingService interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgBillingBundle, error)
	ListRows(ctx context.Context, sppgID string) ([]models.SppgBillingRow, error)
	ListInvoices(ctx context.Context, sppgID string) ([]models.SppgInvoice, error)
	GetInvoice(ctx context.Context, sppgID string, invoiceID string) (*models.SppgInvoice, []models.SppgBillingRow, error)
	GenerateInvoice(ctx context.Context, sppgID string, period string) (*models.SppgInvoice, error)
	AdvanceInvoice(ctx context.Context, sppgID string, invoiceID string, targetStage string) (*models.SppgInvoice, error)
	AttachNotes(ctx context.Context, sppgID string, invoiceID string, filenames []string) (*models.SppgInvoice, error)
}

type sppgBillingService struct {
	repo repositories.SppgBillingRepository
}

// NewSppgBillingService membuat instance service penagihan baru dengan Constructor Dependency Injection.
func NewSppgBillingService(repo repositories.SppgBillingRepository) SppgBillingService {
	return &sppgBillingService{repo: repo}
}

func (s *sppgBillingService) GetBundle(ctx context.Context, sppgID string) (*models.SppgBillingBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgBillingService) ListRows(ctx context.Context, sppgID string) ([]models.SppgBillingRow, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListRows(ctx, sppgID)
}

func (s *sppgBillingService) ListInvoices(ctx context.Context, sppgID string) ([]models.SppgInvoice, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.ListInvoices(ctx, sppgID)
}

func (s *sppgBillingService) GetInvoice(ctx context.Context, sppgID string, invoiceID string) (*models.SppgInvoice, []models.SppgBillingRow, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, nil, errors.New("sppgId wajib diisi")
	}
	if strings.TrimSpace(invoiceID) == "" {
		return nil, nil, errors.New("invoiceId wajib diisi")
	}
	return s.repo.GetInvoice(ctx, sppgID, invoiceID)
}

func (s *sppgBillingService) GenerateInvoice(ctx context.Context, sppgID string, period string) (*models.SppgInvoice, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	return s.repo.GenerateInvoice(ctx, sppgID, period)
}

func (s *sppgBillingService) AdvanceInvoice(ctx context.Context, sppgID string, invoiceID string, targetStage string) (*models.SppgInvoice, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if strings.TrimSpace(invoiceID) == "" {
		return nil, errors.New("invoiceId wajib diisi")
	}
	return s.repo.AdvanceInvoice(ctx, sppgID, invoiceID, targetStage)
}

func (s *sppgBillingService) AttachNotes(ctx context.Context, sppgID string, invoiceID string, filenames []string) (*models.SppgInvoice, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, errors.New("sppgId wajib diisi")
	}
	if strings.TrimSpace(invoiceID) == "" {
		return nil, errors.New("invoiceId wajib diisi")
	}
	var clean []string
	for _, f := range filenames {
		t := strings.TrimSpace(f)
		if t != "" {
			clean = append(clean, t)
		}
	}
	if len(clean) == 0 {
		return nil, errors.New("Minimal satu nama berkas nota wajib disertakan")
	}
	return s.repo.AttachNotes(ctx, sppgID, invoiceID, clean)
}
