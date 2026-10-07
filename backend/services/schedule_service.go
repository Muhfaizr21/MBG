package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
)

var (
	ErrScheduleIDRequired     = errors.New("id jadwal wajib diisi")
	ErrNewTimeRequired        = errors.New("jam target kedatangan baru wajib diisi (format: HH:MM)")
	ErrInvalidTimeFormat      = errors.New("format jam tidak valid, gunakan format 24 jam (misal: 07:45)")
	ErrRescheduleReasonEmpty  = errors.New("alasan penyesuaian jadwal wajib dicantumkan untuk jejak audit")
	ErrDelayMinutesPositive   = errors.New("estimasi menit keterlambatan harus lebih dari 0 menit")
	ErrBackupFleetIDRequired  = errors.New("id armada cadangan wajib dipilih untuk penugasan re-route")
	ErrRerouteNotesRequired   = errors.New("catatan pengalihan armada & evakuasi muatan wajib dicantumkan")
)

var timeRegex = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d$`)

// ScheduleService mendefinisikan interface logika bisnis untuk pengelolaan jadwal distribusi MBG.
type ScheduleService interface {
	List(ctx context.Context, filter models.ScheduleFilter) ([]models.Schedule, error)
	GetByID(ctx context.Context, id string) (*models.Schedule, error)
	Reschedule(ctx context.Context, id string, req models.RescheduleRequest, actor models.User) (*models.Schedule, error)
	SendDelayAlert(ctx context.Context, id string, req models.DelayAlertRequest, actor models.User) (*models.Schedule, error)
	RerouteBackupFleet(ctx context.Context, id string, req models.RerouteRequest, actor models.User) (*models.Schedule, error)
	GetBackupFleets(ctx context.Context) ([]models.BackupFleet, error)
}

type scheduleService struct {
	repo repositories.ScheduleRepository
}

// NewScheduleService membuat instance baru ScheduleService.
func NewScheduleService(repo repositories.ScheduleRepository) ScheduleService {
	return &scheduleService{repo: repo}
}

func (s *scheduleService) List(ctx context.Context, filter models.ScheduleFilter) ([]models.Schedule, error) {
	return s.repo.List(ctx, filter)
}

func (s *scheduleService) GetByID(ctx context.Context, id string) (*models.Schedule, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrScheduleIDRequired
	}
	return s.repo.GetByID(ctx, id)
}

func (s *scheduleService) Reschedule(ctx context.Context, id string, req models.RescheduleRequest, actor models.User) (*models.Schedule, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrScheduleIDRequired
	}

	req.NewTime = strings.TrimSpace(req.NewTime)
	if req.NewTime == "" {
		return nil, ErrNewTimeRequired
	}
	if !timeRegex.MatchString(req.NewTime) {
		return nil, ErrInvalidTimeFormat
	}

	req.Reason = strings.TrimSpace(req.Reason)
	if req.Reason == "" {
		return nil, ErrRescheduleReasonEmpty
	}

	if strings.TrimSpace(req.EffectiveDate) == "" {
		req.EffectiveDate = "Hari Ini"
	}

	return s.repo.Reschedule(ctx, id, req, actor)
}

func (s *scheduleService) SendDelayAlert(ctx context.Context, id string, req models.DelayAlertRequest, actor models.User) (*models.Schedule, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrScheduleIDRequired
	}

	if req.DelayMinutes <= 0 {
		return nil, ErrDelayMinutesPositive
	}

	req.CustomMessage = strings.TrimSpace(req.CustomMessage)
	if req.CustomMessage == "" {
		req.CustomMessage = fmt.Sprintf("Peringatan keterlambatan diperkirakan +%d menit menuju sekolah penerima.", req.DelayMinutes)
	}

	return s.repo.SendDelayAlert(ctx, id, req, actor)
}

func (s *scheduleService) RerouteBackupFleet(ctx context.Context, id string, req models.RerouteRequest, actor models.User) (*models.Schedule, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrScheduleIDRequired
	}

	req.BackupFleetID = strings.TrimSpace(req.BackupFleetID)
	if req.BackupFleetID == "" {
		return nil, ErrBackupFleetIDRequired
	}

	req.Notes = strings.TrimSpace(req.Notes)
	if req.Notes == "" {
		return nil, ErrRerouteNotesRequired
	}

	return s.repo.RerouteBackupFleet(ctx, id, req, actor)
}

func (s *scheduleService) GetBackupFleets(ctx context.Context) ([]models.BackupFleet, error) {
	return s.repo.GetBackupFleets(ctx)
}
