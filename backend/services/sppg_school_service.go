package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/models"
	"backend/repositories"
)

type SppgSchoolService interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgSchoolBundle, error)
	ListSchools(ctx context.Context, sppgID string) ([]models.SppgSchoolQuota, error)
	GetSchool(ctx context.Context, idOrSchoolID, sppgID string) (*models.SppgSchoolQuota, error)
	UpdateAttendance(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateAttendancePayload) (*models.SppgSchoolQuota, error)
	UpdateDroppoint(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateDroppointPayload) (*models.SppgSchoolQuota, error)
	RemindAttendance(ctx context.Context, idOrSchoolID, sppgID string, customMessage, actorName string) error
}

type sppgSchoolService struct {
	repo repositories.SppgSchoolRepository
}

func NewSppgSchoolService(repo repositories.SppgSchoolRepository) SppgSchoolService {
	return &sppgSchoolService{repo: repo}
}

func (s *sppgSchoolService) GetBundle(ctx context.Context, sppgID string) (*models.SppgSchoolBundle, error) {
	if sppgID == "" {
		return nil, errors.New("sppgId wajib ditentukan")
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgSchoolService) ListSchools(ctx context.Context, sppgID string) ([]models.SppgSchoolQuota, error) {
	if sppgID == "" {
		return nil, errors.New("sppgId wajib ditentukan")
	}
	return s.repo.ListSchools(ctx, sppgID)
}

func (s *sppgSchoolService) GetSchool(ctx context.Context, idOrSchoolID, sppgID string) (*models.SppgSchoolQuota, error) {
	if idOrSchoolID == "" {
		return nil, errors.New("id sekolah wajib ditentukan")
	}
	return s.repo.GetSchool(ctx, idOrSchoolID, sppgID)
}

func (s *sppgSchoolService) UpdateAttendance(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateAttendancePayload) (*models.SppgSchoolQuota, error) {
	if payload == nil {
		return nil, errors.New("payload mutasi presensi kosong")
	}
	if payload.Present < 0 {
		return nil, errors.New("jumlah siswa hadir tidak boleh bernilai negatif")
	}
	if payload.ReduceSpecial < 0 {
		return nil, errors.New("jumlah pengurangan porsi khusus tidak boleh bernilai negatif")
	}
	if payload.ReduceSpecial > payload.Present {
		return nil, errors.New("pengurangan porsi khusus tidak boleh melebihi jumlah siswa hadir")
	}

	target, err := s.repo.GetSchool(ctx, idOrSchoolID, sppgID)
	if err != nil {
		return nil, err
	}

	if payload.Present > target.Enrolled+50 {
		return nil, fmt.Errorf("jumlah siswa hadir (%d) melebihi batas toleransi kapasitas terdaftar (%d)", payload.Present, target.Enrolled)
	}

	if payload.PresentUpdatedAt == "" {
		payload.PresentUpdatedAt = time.Now().Format("15:04")
	}

	return s.repo.UpdateAttendance(ctx, idOrSchoolID, sppgID, payload)
}

func (s *sppgSchoolService) UpdateDroppoint(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateDroppointPayload) (*models.SppgSchoolQuota, error) {
	if payload == nil {
		return nil, errors.New("payload panduan drop-point kosong")
	}
	if strings.TrimSpace(payload.Droppoint) == "" {
		return nil, errors.New("panduan lokasi titik drop-point wajib diisi")
	}
	if strings.TrimSpace(payload.Validator) == "" {
		return nil, errors.New("nama guru validator / PIC wajib diisi")
	}
	cleanPhone := strings.ReplaceAll(strings.ReplaceAll(payload.ValidatorPhone, "-", ""), " ", "")
	if len(cleanPhone) < 8 {
		return nil, errors.New("nomor telepon kontak validator minimal 8 digit")
	}

	return s.repo.UpdateDroppoint(ctx, idOrSchoolID, sppgID, payload)
}

func (s *sppgSchoolService) RemindAttendance(ctx context.Context, idOrSchoolID, sppgID string, customMessage, actorName string) error {
	school, err := s.repo.GetSchool(ctx, idOrSchoolID, sppgID)
	if err != nil {
		return err
	}

	msg := customMessage
	if strings.TrimSpace(msg) == "" {
		msg = fmt.Sprintf("Halo %s, mohon segera mutakhirkan data presensi kehadiran siswa %s sebelum batas waktu 05:00 WIB agar kuota boks MBG dapur tepat jumlah.", school.Validator, school.Name)
	}

	return s.repo.CreateReminder(ctx, sppgID, school.ID, msg, actorName)
}
