package services

import (
	"context"
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

var (
	ErrReportTitleRequired   = errors.New("judul dokumen laporan wajib diisi")
	ErrReportPeriodRequired  = errors.New("periode waktu laporan wajib diisi")
	ErrReportCategoryInvalid = errors.New("kategori laporan tidak valid")
	ErrSp2dNumberRequired    = errors.New("nomor surat perintah pencairan dana (SP2D) wajib diisi")
	ErrClearanceNotesRequired = errors.New("catatan verifikasi superadmin wajib diisi")
)

// ReportService mendefinisikan logika bisnis operasional laporan, BAST, invoice, dan audit forensik
type ReportService interface {
	GetBundle(ctx context.Context) (*models.ReportsBundle, error)
	GetReports(ctx context.Context, category, search string) ([]models.OfficialReport, error)
	GetReportByID(ctx context.Context, id string) (*models.OfficialReport, error)
	CreateReport(ctx context.Context, actorID string, req *models.CreateReportRequest) (*models.OfficialReport, error)
	GetDigitalBasts(ctx context.Context, search string) ([]models.DigitalBast, error)
	GetDigitalBastByID(ctx context.Context, id string) (*models.DigitalBast, error)
	GetVendorInvoices(ctx context.Context, search string) ([]models.VendorInvoice, error)
	GetVendorInvoiceByID(ctx context.Context, id string) (*models.VendorInvoice, error)
	AuthorizePayment(ctx context.Context, actorID, actorName, invoiceID string, req *models.AuthorizePaymentRequest) (*models.VendorInvoice, error)
	GetForensicFindings(ctx context.Context, search string) ([]models.ForensicAuditFinding, error)
	GetExecutiveStats(ctx context.Context) (*models.ReportExecutiveStats, error)
}

type reportService struct {
	repo repositories.ReportRepository
}

func NewReportService(repo repositories.ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func (s *reportService) GetBundle(ctx context.Context) (*models.ReportsBundle, error) {
	return s.repo.GetBundle(ctx)
}

func (s *reportService) GetReports(ctx context.Context, category, search string) ([]models.OfficialReport, error) {
	return s.repo.GetReports(ctx, category, search)
}

func (s *reportService) GetReportByID(ctx context.Context, id string) (*models.OfficialReport, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id laporan tidak boleh kosong")
	}
	return s.repo.GetReportByID(ctx, id)
}

func (s *reportService) CreateReport(ctx context.Context, actorID string, req *models.CreateReportRequest) (*models.OfficialReport, error) {
	if req == nil {
		return nil, errors.New("payload create report tidak boleh kosong")
	}
	if strings.TrimSpace(req.Title) == "" {
		return nil, ErrReportTitleRequired
	}
	if strings.TrimSpace(req.Period) == "" {
		return nil, ErrReportPeriodRequired
	}

	validCategories := map[string]bool{
		"distribution": true,
		"nutrition":    true,
		"incidents":    true,
		"financial":    true,
		"attendance":   true,
	}
	cat := strings.ToLower(strings.TrimSpace(req.Category))
	if cat != "" && !validCategories[cat] {
		return nil, ErrReportCategoryInvalid
	}
	if cat == "" {
		req.Category = "distribution"
	}

	format := strings.ToUpper(strings.TrimSpace(req.Format))
	if format != "PDF" && format != "XLSX" && format != "CSV" {
		req.Format = "PDF"
	}

	return s.repo.CreateReport(ctx, actorID, req)
}

func (s *reportService) GetDigitalBasts(ctx context.Context, search string) ([]models.DigitalBast, error) {
	return s.repo.GetDigitalBasts(ctx, search)
}

func (s *reportService) GetDigitalBastByID(ctx context.Context, id string) (*models.DigitalBast, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id BAST tidak boleh kosong")
	}
	return s.repo.GetDigitalBastByID(ctx, id)
}

func (s *reportService) GetVendorInvoices(ctx context.Context, search string) ([]models.VendorInvoice, error) {
	return s.repo.GetVendorInvoices(ctx, search)
}

func (s *reportService) GetVendorInvoiceByID(ctx context.Context, id string) (*models.VendorInvoice, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id invoice tidak boleh kosong")
	}
	return s.repo.GetVendorInvoiceByID(ctx, id)
}

func (s *reportService) AuthorizePayment(ctx context.Context, actorID, actorName, invoiceID string, req *models.AuthorizePaymentRequest) (*models.VendorInvoice, error) {
	if strings.TrimSpace(invoiceID) == "" {
		return nil, errors.New("id invoice tidak boleh kosong")
	}
	if req == nil {
		return nil, errors.New("payload otorisasi pembayaran tidak boleh kosong")
	}
	if strings.TrimSpace(req.Sp2dNumber) == "" {
		return nil, ErrSp2dNumberRequired
	}
	if strings.TrimSpace(req.Notes) == "" {
		return nil, ErrClearanceNotesRequired
	}

	return s.repo.AuthorizePayment(ctx, actorID, actorName, invoiceID, req)
}

func (s *reportService) GetForensicFindings(ctx context.Context, search string) ([]models.ForensicAuditFinding, error) {
	return s.repo.GetForensicFindings(ctx, search)
}

func (s *reportService) GetExecutiveStats(ctx context.Context) (*models.ReportExecutiveStats, error) {
	return s.repo.GetExecutiveStats(ctx)
}
