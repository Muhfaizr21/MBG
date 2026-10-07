package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
)

// NoticeService mendefinisikan kontrak logika bisnis untuk modul Papan Pengumuman & Edaran Darurat Satgas MBG.
type NoticeService interface {
	List(ctx context.Context, filter models.NoticeFilter) ([]models.Notice, error)
	GetByID(ctx context.Context, id string) (*models.Notice, error)
	Create(ctx context.Context, req models.CreateNoticeRequest, actor models.User) (*models.Notice, error)
	BroadcastFlashAlert(ctx context.Context, id string, actor models.User) (*models.Notice, error)
	ToggleArchive(ctx context.Context, id string, isArchiving bool, actor models.User) (*models.Notice, error)
	Delete(ctx context.Context, id string, actor models.User) error
	Acknowledge(ctx context.Context, id string, validatorID string) error
}

type noticeService struct {
	repo repositories.NoticeRepository
}

// NewNoticeService membuat instance noticeService baru.
func NewNoticeService(repo repositories.NoticeRepository) NoticeService {
	return &noticeService{repo: repo}
}

func (s *noticeService) List(ctx context.Context, filter models.NoticeFilter) ([]models.Notice, error) {
	return s.repo.List(ctx, filter)
}

func (s *noticeService) GetByID(ctx context.Context, id string) (*models.Notice, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("notice ID is required")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *noticeService) Create(ctx context.Context, req models.CreateNoticeRequest, actor models.User) (*models.Notice, error) {
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return nil, errors.New("judul maklumat wajib diisi")
	}
	if len(req.Title) < 5 {
		return nil, errors.New("judul maklumat minimal 5 karakter")
	}
	if len(req.Title) > 255 {
		return nil, errors.New("judul maklumat maksimal 255 karakter")
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		return nil, errors.New("isi pengumuman wajib diisi")
	}
	if len(req.Content) < 10 {
		return nil, errors.New("isi pengumuman minimal 10 karakter")
	}

	if req.Category == "" {
		req.Category = "circular"
	} else if req.Category != "circular" && req.Category != "seasonal" && req.Category != "system" {
		return nil, fmt.Errorf("kategori '%s' tidak valid (pilihan: circular, seasonal, system)", req.Category)
	}

	if req.Urgency == "" {
		req.Urgency = "info"
	} else if req.Urgency != "info" && req.Urgency != "important" && req.Urgency != "critical" {
		return nil, fmt.Errorf("tingkat urgensi '%s' tidak valid (pilihan: info, important, critical)", req.Urgency)
	}

	if req.TargetAudience == "" {
		req.TargetAudience = "all"
	} else if req.TargetAudience != "all" && req.TargetAudience != "validators" && req.TargetAudience != "sppg" {
		return nil, fmt.Errorf("sasaran audiens '%s' tidak valid (pilihan: all, validators, sppg)", req.TargetAudience)
	}

	return s.repo.Create(ctx, req, actor)
}

func (s *noticeService) BroadcastFlashAlert(ctx context.Context, id string, actor models.User) (*models.Notice, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("notice ID is required")
	}
	return s.repo.BroadcastFlashAlert(ctx, id, actor)
}

func (s *noticeService) ToggleArchive(ctx context.Context, id string, isArchiving bool, actor models.User) (*models.Notice, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("notice ID is required")
	}
	return s.repo.ToggleArchive(ctx, id, isArchiving, actor)
}

func (s *noticeService) Delete(ctx context.Context, id string, actor models.User) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("notice ID is required")
	}
	return s.repo.Delete(ctx, id, actor)
}

func (s *noticeService) Acknowledge(ctx context.Context, id string, validatorID string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("notice ID is required")
	}
	return s.repo.Acknowledge(ctx, id, validatorID)
}
