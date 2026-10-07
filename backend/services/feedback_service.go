package services

import (
	"context"
	"errors"
	"strings"

	"backend/models"
	"backend/repositories"
)

// FeedbackService mendefinisikan antarmuka logika bisnis aduan & penanganan darurat
type FeedbackService interface {
	GetBundle(ctx context.Context) (*models.FeedbackBundle, error)
	GetAllTickets(ctx context.Context, severity, status, search string) ([]models.FeedbackTicket, error)
	GetTicketByID(ctx context.Context, id string) (*models.FeedbackTicket, error)
	CreateTicket(ctx context.Context, req *models.CreateFeedbackRequest, actorID string) (*models.FeedbackTicket, error)
	ExecuteKillSwitch(ctx context.Context, id string, actorID, actorName string, req *models.ExecuteKillSwitchRequest) (*models.FeedbackTicket, error)
	EscalateMedical(ctx context.Context, id string, actorID string, req *models.EscalateMedicalRequest) (*models.FeedbackTicket, error)
	CloseTicket(ctx context.Context, id string, actorID string, req *models.CloseFeedbackRequest) (*models.FeedbackTicket, error)
	GetExecutiveStats(ctx context.Context) (*models.FeedbackExecutiveStats, error)
}

type feedbackService struct {
	repo repositories.FeedbackRepository
}

// NewFeedbackService menginisialisasi service aduan dan kill-switch
func NewFeedbackService(repo repositories.FeedbackRepository) FeedbackService {
	return &feedbackService{repo: repo}
}

func (s *feedbackService) GetBundle(ctx context.Context) (*models.FeedbackBundle, error) {
	return s.repo.GetBundle(ctx)
}

func (s *feedbackService) GetAllTickets(ctx context.Context, severity, status, search string) ([]models.FeedbackTicket, error) {
	return s.repo.GetAllTickets(ctx, severity, status, search)
}

func (s *feedbackService) GetTicketByID(ctx context.Context, id string) (*models.FeedbackTicket, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id tiket tidak boleh kosong")
	}
	return s.repo.GetTicketByID(ctx, id)
}

func (s *feedbackService) CreateTicket(ctx context.Context, req *models.CreateFeedbackRequest, actorID string) (*models.FeedbackTicket, error) {
	if req == nil {
		return nil, errors.New("payload create ticket tidak boleh kosong")
	}
	if strings.TrimSpace(req.Title) == "" {
		return nil, errors.New("judul aduan wajib diisi")
	}
	if strings.TrimSpace(req.SchoolName) == "" {
		return nil, errors.New("nama sekolah wajib diisi")
	}
	if req.AffectedPortions < 0 {
		return nil, errors.New("jumlah porsi terdampak tidak boleh negatif")
	}
	if req.Severity == "" {
		req.Severity = "level3"
	}
	if req.AnomalyType == "" {
		req.AnomalyType = "other"
	}
	return s.repo.CreateTicket(ctx, req, actorID)
}

func (s *feedbackService) ExecuteKillSwitch(ctx context.Context, id string, actorID, actorName string, req *models.ExecuteKillSwitchRequest) (*models.FeedbackTicket, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id tiket tidak boleh kosong")
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Superadmin Satgas MBG"
	}
	if req == nil {
		req = &models.ExecuteKillSwitchRequest{}
	}
	return s.repo.ExecuteKillSwitch(ctx, id, actorID, actorName, req)
}

func (s *feedbackService) EscalateMedical(ctx context.Context, id string, actorID string, req *models.EscalateMedicalRequest) (*models.FeedbackTicket, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id tiket tidak boleh kosong")
	}
	if req == nil {
		req = &models.EscalateMedicalRequest{}
	}
	return s.repo.EscalateMedical(ctx, id, actorID, req)
}

func (s *feedbackService) CloseTicket(ctx context.Context, id string, actorID string, req *models.CloseFeedbackRequest) (*models.FeedbackTicket, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id tiket tidak boleh kosong")
	}
	if req == nil {
		req = &models.CloseFeedbackRequest{}
	}
	if strings.TrimSpace(req.ResolutionNotes) == "" {
		req.ResolutionNotes = "Tiket ditutup setelah verifikasi lapangan dan pemenuhan kompensasi."
	}
	return s.repo.CloseTicket(ctx, id, actorID, req)
}

func (s *feedbackService) GetExecutiveStats(ctx context.Context) (*models.FeedbackExecutiveStats, error) {
	return s.repo.GetExecutiveStats(ctx)
}
