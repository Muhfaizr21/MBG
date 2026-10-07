package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"strings"
)

var (
	ErrDeliveryNotFound = errors.New("data pengiriman tidak ditemukan")
	ErrDeliveryInvalid  = errors.New("permintaan tidak valid")
)

const minDeliveryReasonLen = 15

// DeliveryService menegakkan aturan bisnis atas telemetri hasil pengiriman
type DeliveryService interface {
	List(ctx context.Context) ([]models.Delivery, error)
	Get(ctx context.Context, id string) (*models.Delivery, error)
	OverrideAI(ctx context.Context, actorID, id string, req models.OverrideDeliveryAIRequest) (*models.Delivery, error)
	OrderLabTest(ctx context.Context, actorID, id string, req models.OrderDeliveryLabTestRequest) (*models.Delivery, error)
}

type deliveryService struct {
	repo repositories.DeliveryRepository
}

// NewDeliveryService constructor DeliveryService (Constructor DI)
func NewDeliveryService(repo repositories.DeliveryRepository) DeliveryService {
	return &deliveryService{repo: repo}
}

func (s *deliveryService) List(ctx context.Context) ([]models.Delivery, error) {
	list, err := s.repo.List(ctx)
	return list, mapDeliveryErr(err)
}

func (s *deliveryService) Get(ctx context.Context, id string) (*models.Delivery, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrDeliveryInvalid
	}
	d, err := s.repo.Get(ctx, id)
	return d, mapDeliveryErr(err)
}

func (s *deliveryService) OverrideAI(ctx context.Context, actorID, id string, req models.OverrideDeliveryAIRequest) (*models.Delivery, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrDeliveryInvalid
	}
	_, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, mapDeliveryErr(err)
	}

	reason := strings.TrimSpace(req.Reason)
	if len([]rune(reason)) < minDeliveryReasonLen {
		return nil, ErrDeliveryInvalid
	}

	auditor := strings.TrimSpace(req.AuditorName)
	if auditor == "" {
		auditor = "Superadmin BGN"
	}

	updated, err := s.repo.OverrideAI(ctx, id, auditor, reason, actorID)
	return updated, mapDeliveryErr(err)
}

func (s *deliveryService) OrderLabTest(ctx context.Context, actorID, id string, req models.OrderDeliveryLabTestRequest) (*models.Delivery, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrDeliveryInvalid
	}
	_, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, mapDeliveryErr(err)
	}

	labTarget := strings.TrimSpace(req.LabTarget)
	if labTarget == "" {
		return nil, ErrDeliveryInvalid
	}

	notes := strings.TrimSpace(req.Notes)
	if len([]rune(notes)) < 10 {
		return nil, ErrDeliveryInvalid
	}

	updated, err := s.repo.OrderLabTest(ctx, id, labTarget, strings.TrimSpace(req.DinkesOffice), notes, actorID)
	return updated, mapDeliveryErr(err)
}

func mapDeliveryErr(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, repositories.ErrNotFound):
		return ErrDeliveryNotFound
	default:
		return err
	}
}
