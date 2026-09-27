package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidInput = errors.New("title is required")
)

// ItemService defines business logic contract
type ItemService interface {
	GetAllItems(ctx context.Context) ([]models.Item, error)
	GetItemByID(ctx context.Context, id string) (*models.Item, error)
	CreateItem(ctx context.Context, req models.CreateItemRequest) (*models.Item, error)
	DeleteItem(ctx context.Context, id string) error
}

type itemService struct {
	repo repositories.ItemRepository
}

// NewItemService injects ItemRepository into ItemService (Dependency Injection)
func NewItemService(repo repositories.ItemRepository) ItemService {
	return &itemService{
		repo: repo,
	}
}

func (s *itemService) GetAllItems(ctx context.Context) ([]models.Item, error) {
	return s.repo.FindAll(ctx)
}

func (s *itemService) GetItemByID(ctx context.Context, id string) (*models.Item, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	return s.repo.FindByID(ctx, id)
}

func (s *itemService) CreateItem(ctx context.Context, req models.CreateItemRequest) (*models.Item, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, ErrInvalidInput
	}

	now := time.Now()
	id := fmt.Sprintf("%d", now.UnixNano())

	item := &models.Item{
		ID:          id,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Category:    strings.TrimSpace(req.Category),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}

	return item, nil
}

func (s *itemService) DeleteItem(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("id is required")
	}
	return s.repo.Delete(ctx, id)
}
