package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrAttendanceNotFound   = errors.New("data rekonsiliasi presensi tidak ditemukan")
	ErrInvalidQuota         = errors.New("kuota rekomendasi esok hari harus bernilai lebih dari 0")
	ErrInvalidReason        = errors.New("alasan penyesuaian kuota wajib diisi minimal 5 karakter")
	ErrZeroSurplus          = errors.New("tidak ada sisa porsi utuh yang dapat dialihkan")
	ErrExcessSurplus        = errors.New("alokasi pengalihan melebihi jumlah porsi surplus yang tersedia")
	ErrGoldenWindowExpired  = errors.New("batas waktu aman konsumsi (golden window) telah habis; porsi tidak boleh dialihkan")
	ErrAlreadyRedistributed = errors.New("porsi surplus sekolah ini telah dialihkan sebelumnya")
	ErrInvalidInvestigator  = errors.New("nama petugas pemeriksa audit wajib diisi")
	ErrInvalidAuditNotes    = errors.New("catatan instruksi investigasi audit wajib diisi minimal 5 karakter")
	ErrMissingFacility      = errors.New("lembaga atau panti sosial penerima wajib diisi")
	ErrMissingCourier       = errors.New("armada kurir pengantar wajib diisi")
)

// AttendanceService mengatur aturan bisnis dan validasi domain rekonsiliasi presensi & porsi MBG.
type AttendanceService interface {
	List(ctx context.Context, filter models.AttendanceFilter) ([]models.Attendance, error)
	GetByID(ctx context.Context, id string) (*models.Attendance, error)
	AdjustTomorrowQuota(ctx context.Context, id string, req models.AdjustQuotaRequest, actor models.User) (*models.Attendance, error)
	RedistributeSurplus(ctx context.Context, id string, req models.RedistributeSurplusRequest, actor models.User) (*models.Attendance, error)
	AuditDiscrepancy(ctx context.Context, id string, req models.AuditDiscrepancyRequest, actor models.User) (*models.Attendance, error)
}

type attendanceService struct {
	repo repositories.AttendanceRepository
}

func NewAttendanceService(repo repositories.AttendanceRepository) AttendanceService {
	return &attendanceService{repo: repo}
}

func (s *attendanceService) List(ctx context.Context, filter models.AttendanceFilter) ([]models.Attendance, error) {
	return s.repo.List(ctx, filter)
}

func (s *attendanceService) GetByID(ctx context.Context, id string) (*models.Attendance, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrAttendanceNotFound
	}
	att, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, err
	}
	return att, nil
}

func (s *attendanceService) AdjustTomorrowQuota(ctx context.Context, id string, req models.AdjustQuotaRequest, actor models.User) (*models.Attendance, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrAttendanceNotFound
	}
	if req.NewQuota <= 0 {
		return nil, ErrInvalidQuota
	}
	if len(strings.TrimSpace(req.Reason)) < 5 {
		return nil, ErrInvalidReason
	}

	att, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Validasi batas logis kuota (tidak boleh melebihi 200% siswa terdaftar)
	if att.RegisteredStudents > 0 && req.NewQuota > att.RegisteredStudents*2 {
		return nil, fmt.Errorf("kuota baru (%d) melampaui batas wajar kapasitas siswa (%d siswa)", req.NewQuota, att.RegisteredStudents)
	}

	return s.repo.AdjustTomorrowQuota(ctx, id, req, actor)
}

func (s *attendanceService) RedistributeSurplus(ctx context.Context, id string, req models.RedistributeSurplusRequest, actor models.User) (*models.Attendance, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrAttendanceNotFound
	}

	att, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if att.SurplusPortions <= 0 {
		return nil, ErrZeroSurplus
	}
	if att.SurplusStatus == "redistributed" || att.ReconciliationStatus == "surplus_redistributed" {
		return nil, ErrAlreadyRedistributed
	}
	if req.PortionsAllocated <= 0 {
		return nil, errors.New("jumlah boks yang dialihkan harus lebih dari 0")
	}
	if req.PortionsAllocated > att.SurplusPortions {
		return nil, ErrExcessSurplus
	}
	if strings.TrimSpace(req.TargetFacility) == "" {
		return nil, ErrMissingFacility
	}
	if strings.TrimSpace(req.CourierName) == "" {
		return nil, ErrMissingCourier
	}

	// Food safety: cek Golden Window
	if att.GoldenWindow.MinutesLeft <= 0 && !att.GoldenWindow.IsSafeToRedistribute {
		return nil, ErrGoldenWindowExpired
	}

	if strings.TrimSpace(req.AuthorizedBy) == "" {
		req.AuthorizedBy = actor.FullName
		if req.AuthorizedBy == "" {
			req.AuthorizedBy = "Superadmin Satgas MBG"
		}
	}

	return s.repo.RedistributeSurplus(ctx, id, req, actor)
}

func (s *attendanceService) AuditDiscrepancy(ctx context.Context, id string, req models.AuditDiscrepancyRequest, actor models.User) (*models.Attendance, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrAttendanceNotFound
	}
	if strings.TrimSpace(req.Investigator) == "" {
		return nil, ErrInvalidInvestigator
	}
	if len(strings.TrimSpace(req.Notes)) < 5 {
		return nil, ErrInvalidAuditNotes
	}

	_, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.repo.AuditDiscrepancy(ctx, id, req, actor)
}
