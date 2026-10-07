package services

import (
	"backend/models"
	"context"
	"testing"
)

type stubNutritionRepo struct {
	items []models.NutritionItem
}

func (s *stubNutritionRepo) All(ctx context.Context) ([]models.NutritionItem, error) {
	return s.items, nil
}

func testItems() []models.NutritionItem {
	return []models.NutritionItem{
		{Name: "Nasi", Calories: 180, Protein: 3.0, Fat: 0.3, Carbohydrate: 39.8},
		{Name: "Beras Giling masak (nasi)", Calories: 178, Protein: 2.1, Fat: 0.1, Carbohydrate: 40.6},
		{Name: "Telur Ayam dadar", Calories: 251, Protein: 16.3, Fat: 19.4, Carbohydrate: 1.4},
		{Name: "Ketimun", Calories: 12, Protein: 0.7, Fat: 0.1, Carbohydrate: 2.7},
		{Name: "Selada", Calories: 15, Protein: 1.2, Fat: 0.2, Carbohydrate: 2.9},
		{Name: "Ayam goreng paha", Calories: 287, Protein: 31.0, Fat: 15.7, Carbohydrate: 1.7},
		{Name: "Pisang Ambon", Calories: 99, Protein: 1.2, Fat: 0.2, Carbohydrate: 25.8},
		{Name: "Susu Sapi", Calories: 61, Protein: 3.2, Fat: 3.5, Carbohydrate: 4.3},
	}
}

func TestParseItems(t *testing.T) {
	items := ParseItems("Nasi:120, Telur Ayam dadar:50, ,Ketimun")
	if len(items) != 3 {
		t.Fatalf("expected 3 items, got %d", len(items))
	}
	if items[0].Name != "Nasi" || items[0].WeightG != 120 {
		t.Errorf("bad first item: %+v", items[0])
	}
	if items[2].Name != "Ketimun" || items[2].WeightG != 100 {
		t.Errorf("bad default-weight item: %+v", items[2])
	}
}

func TestMatchItemsAliasAndScaling(t *testing.T) {
	svc := NewNutritionService(&stubNutritionRepo{items: testItems()})

	matches, macros, note, err := svc.MatchItems(context.Background(), ParseItems("Nasi Kuning:100,Ayam Goreng:100"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if macros == nil {
		t.Fatal("expected macros to be computed")
	}
	if len(matches) != 2 {
		t.Fatalf("expected 2 matches, got %d (%s)", len(matches), note)
	}
	// Nasi Kuning -> Nasi (180 kcal); Ayam Goreng -> Ayam goreng paha (287 kcal).
	if macros.Energy != 467 {
		t.Errorf("expected energy 467, got %.1f", macros.Energy)
	}
	if matches[0].MatchedTo != "Nasi" {
		t.Errorf("bad alias resolve: %q", matches[0].MatchedTo)
	}
}

func TestMatchItemsCompoundName(t *testing.T) {
	svc := NewNutritionService(&stubNutritionRepo{items: testItems()})

	matches, macros, note, err := svc.MatchItems(context.Background(), ParseItems("Timun & Selada:100"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if macros == nil || len(matches) != 1 {
		t.Fatalf("expected 1 match, got %d (%s)", len(matches), note)
	}
	// Ketimun 12 + Selada 15 = 27 kcal.
	if macros.Energy != 27 {
		t.Errorf("expected energy 27, got %.1f", macros.Energy)
	}
}

func TestMatchItemsWeightScaling(t *testing.T) {
	svc := NewNutritionService(&stubNutritionRepo{items: testItems()})

	// 200 g nasi = 2x nilai per 100 g.
	matches, macros, _, err := svc.MatchItems(context.Background(), ParseItems("Nasi:200"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(matches) != 1 {
		t.Fatalf("expected 1 match, got %d", len(matches))
	}
	if macros.Energy != 360 {
		t.Errorf("expected energy 360 (2x180), got %.1f", macros.Energy)
	}
}

func TestMatchItemsUnmatched(t *testing.T) {
	svc := NewNutritionService(&stubNutritionRepo{items: testItems()})

	matches, macros, note, err := svc.MatchItems(context.Background(), ParseItems("Tidak Ada Bahan:100"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(matches) != 0 || macros != nil {
		t.Fatalf("expected no matches and nil macros, got %d matches / %v", len(matches), macros)
	}
	if note == "" {
		t.Error("expected a nutrition note explaining no match")
	}
}