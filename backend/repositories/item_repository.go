package repositories

import (
	"backend/models"
	"context"
	"errors"
	"sync"
	"time"
)

var (
	ErrItemNotFound = errors.New("item not found")
)

// ItemRepository defines interface contract for item data persistence (Interface Segregation & DIP)
type ItemRepository interface {
	FindAll(ctx context.Context) ([]models.Item, error)
	FindByID(ctx context.Context, id string) (*models.Item, error)
	Create(ctx context.Context, item *models.Item) error
	Delete(ctx context.Context, id string) error
}

// inMemoryItemRepository implements ItemRepository using thread-safe memory storage
type inMemoryItemRepository struct {
	mu    sync.RWMutex
	items map[string]models.Item
}

// NewInMemoryItemRepository creates a new instance of in-memory ItemRepository
func NewInMemoryItemRepository() ItemRepository {
	repo := &inMemoryItemRepository{
		items: make(map[string]models.Item),
	}

	// Seed with initial sample data
	now := time.Now()
	sample := models.Item{
		ID:          "1",
		Title:       "Menu Bergizi A",
		Description: "Nasi merah, ayam panggang, tumis brokoli, dan buah apel",
		Category:    "Makanan Pokok",
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	repo.items[sample.ID] = sample

	return repo
}

func (r *inMemoryItemRepository) FindAll(ctx context.Context) ([]models.Item, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]models.Item, 0, len(r.items))
	for _, item := range r.items {
		result = append(result, item)
	}
	return result, nil
}

func (r *inMemoryItemRepository) FindByID(ctx context.Context, id string) (*models.Item, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	item, exists := r.items[id]
	if !exists {
		return nil, ErrItemNotFound
	}
	return &item, nil
}

func (r *inMemoryItemRepository) Create(ctx context.Context, item *models.Item) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.items[item.ID] = *item
	return nil
}

func (r *inMemoryItemRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.items[id]; !exists {
		return ErrItemNotFound
	}
	delete(r.items, id)
	return nil
}
