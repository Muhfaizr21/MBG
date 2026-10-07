package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
)

// CalendarService mendefinisikan kontrak business logic operasional kalender & siklus menu BGN.
type CalendarService interface {
	ListDays(ctx context.Context, monthYear string) ([]models.CalendarDay, error)
	GetDayByDate(ctx context.Context, date string) (*models.CalendarDay, error)
	LockMonth(ctx context.Context, req models.LockMonthRequest, actor models.User) error
	ToggleDayLock(ctx context.Context, date string, actor models.User) (*models.CalendarDay, error)
	SetBlackoutDate(ctx context.Context, date string, req models.BlackoutDateRequest, actor models.User) (*models.CalendarDay, error)
	ListSubstitutions(ctx context.Context) ([]models.MenuSubstitution, error)
	GetSubstitutionByID(ctx context.Context, id string) (*models.MenuSubstitution, error)
	CreateSubstitution(ctx context.Context, req models.CreateSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error)
	ReviewSubstitution(ctx context.Context, id string, req models.ReviewSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error)
	ScheduleInspection(ctx context.Context, date string, req models.ScheduleInspectionRequest, actor models.User) (*models.CalendarDay, error)
	ListMenuPackages(ctx context.Context) ([]models.MenuPackage, error)
}

type calendarService struct {
	repo repositories.CalendarRepository
}

// NewCalendarService membuat instance CalendarService baru dengan dependency injection repository.
func NewCalendarService(repo repositories.CalendarRepository) CalendarService {
	return &calendarService{repo: repo}
}

func (s *calendarService) ListDays(ctx context.Context, monthYear string) ([]models.CalendarDay, error) {
	return s.repo.ListDays(ctx, monthYear)
}

func (s *calendarService) GetDayByDate(ctx context.Context, date string) (*models.CalendarDay, error) {
	date = strings.TrimSpace(date)
	if date == "" {
		return nil, errors.New("parameter tanggal tidak boleh kosong")
	}
	return s.repo.GetDayByDate(ctx, date)
}

func (s *calendarService) LockMonth(ctx context.Context, req models.LockMonthRequest, actor models.User) error {
	monthYear := strings.TrimSpace(req.MonthYear)
	if monthYear == "" {
		return errors.New("periode bulan dan tahun wajib diisi")
	}
	return s.repo.LockMonth(ctx, monthYear, actor)
}

func (s *calendarService) ToggleDayLock(ctx context.Context, date string, actor models.User) (*models.CalendarDay, error) {
	date = strings.TrimSpace(date)
	if date == "" {
		return nil, errors.New("parameter tanggal tidak boleh kosong")
	}
	return s.repo.ToggleDayLock(ctx, date, actor)
}

func (s *calendarService) SetBlackoutDate(ctx context.Context, date string, req models.BlackoutDateRequest, actor models.User) (*models.CalendarDay, error) {
	date = strings.TrimSpace(date)
	if date == "" {
		return nil, errors.New("parameter tanggal tidak boleh kosong")
	}
	if req.IsSettingBlackout && strings.TrimSpace(req.Reason) == "" {
		req.Reason = "Libur Operasional Ditetapkan Superadmin MBG"
	}
	return s.repo.SetBlackoutDate(ctx, date, req, actor)
}

func (s *calendarService) ListSubstitutions(ctx context.Context) ([]models.MenuSubstitution, error) {
	return s.repo.ListSubstitutions(ctx)
}

func (s *calendarService) GetSubstitutionByID(ctx context.Context, id string) (*models.MenuSubstitution, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID substitusi tidak boleh kosong")
	}
	return s.repo.GetSubstitutionByID(ctx, id)
}

func (s *calendarService) CreateSubstitution(ctx context.Context, req models.CreateSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error) {
	req.Date = strings.TrimSpace(req.Date)
	if req.Date == "" {
		return nil, errors.New("tanggal substitusi tidak boleh kosong")
	}
	req.CycleCode = strings.TrimSpace(req.CycleCode)
	if req.CycleCode == "" {
		return nil, errors.New("kode paket siklus menu tidak boleh kosong")
	}
	req.OriginalIngredient = strings.TrimSpace(req.OriginalIngredient)
	if req.OriginalIngredient == "" {
		return nil, errors.New("bahan baku asli tidak boleh kosong")
	}
	req.SubstituteIngredient = strings.TrimSpace(req.SubstituteIngredient)
	if req.SubstituteIngredient == "" {
		return nil, errors.New("bahan baku pengganti tidak boleh kosong")
	}
	if strings.TrimSpace(req.Region) == "" {
		req.Region = "Nasional (Seluruh Wilayah)"
	}
	if strings.TrimSpace(req.NutritionistReview) == "" {
		req.NutritionistReview = "dr. Dian Lestari, Sp.GK (BGN) - Disetujui karena deviasi gizi memenuhi standar AKG."
	}

	return s.repo.CreateSubstitution(ctx, req, actor)
}

func (s *calendarService) ReviewSubstitution(ctx context.Context, id string, req models.ReviewSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, errors.New("ID substitusi tidak boleh kosong")
	}
	action := strings.ToLower(strings.TrimSpace(req.Action))
	if action != "approve" && action != "reject" {
		return nil, fmt.Errorf("aksi review tidak valid: %s (gunakan 'approve' atau 'reject')", req.Action)
	}
	return s.repo.ReviewSubstitution(ctx, id, action, actor)
}

func (s *calendarService) ScheduleInspection(ctx context.Context, date string, req models.ScheduleInspectionRequest, actor models.User) (*models.CalendarDay, error) {
	date = strings.TrimSpace(date)
	if date == "" {
		return nil, errors.New("tanggal sidak tidak boleh kosong")
	}
	req.TargetSppgName = strings.TrimSpace(req.TargetSppgName)
	if req.TargetSppgName == "" {
		return nil, errors.New("nama SPPG target sidak tidak boleh kosong")
	}
	if strings.TrimSpace(req.LeadInspector) == "" {
		req.LeadInspector = "dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)"
	}
	if strings.TrimSpace(req.Team) == "" {
		req.Team = "Satgas Khusus Kelaikan Pangan & Balai POM"
	}
	if strings.TrimSpace(req.AuditTime) == "" {
		req.AuditTime = "04:30 - 07:00 WIB"
	}
	if strings.TrimSpace(req.AuditFocus) == "" {
		req.AuditFocus = "Sterilisasi Wadah Boks, Suhu Termal Pengiriman & Gramatur Porsi"
	}

	return s.repo.ScheduleInspection(ctx, date, req, actor)
}

func (s *calendarService) ListMenuPackages(ctx context.Context) ([]models.MenuPackage, error) {
	return s.repo.ListMenuPackages(ctx)
}
