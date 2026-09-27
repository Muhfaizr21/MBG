package services_test

import (
	"backend/models"
	"backend/repositories"
	"backend/services"
	"context"
	"testing"
)

func TestItemService_CreateAndGet(t *testing.T) {
	repo := repositories.NewInMemoryItemRepository()
	service := services.NewItemService(repo)
	ctx := context.Background()

	// Test 1: Create Item
	req := models.CreateItemRequest{
		Title:       "Paket Bergizi Sehat",
		Description: "Nasi, Telur, Sayur Sop, Pisang",
		Category:    "Paket Utama",
	}

	created, err := service.CreateItem(ctx, req)
	if err != nil {
		t.Fatalf("unexpected error creating item: %v", err)
	}

	if created.Title != req.Title {
		t.Errorf("expected title %s, got %s", req.Title, created.Title)
	}

	// Test 2: Get Item by ID
	found, err := service.GetItemByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("unexpected error finding item: %v", err)
	}

	if found.ID != created.ID {
		t.Errorf("expected id %s, got %s", created.ID, found.ID)
	}

	// Test 3: Validation on empty title
	_, err = service.CreateItem(ctx, models.CreateItemRequest{Title: ""})
	if err == nil {
		t.Error("expected error for empty title, got nil")
	}
}
