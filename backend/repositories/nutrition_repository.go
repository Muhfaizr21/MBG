package repositories

import (
	"backend/database"
	"backend/models"
	"context"
)

// NutritionRepository defines persistence operations for nutrition items.
type NutritionRepository interface {
	// All returns every nutrition item (dataset gizi, ~1.3 ribu baris).
	All(ctx context.Context) ([]models.NutritionItem, error)
}

type pgNutritionRepository struct{}

// NewNutritionRepository returns the PostgreSQL-backed NutritionRepository.
func NewNutritionRepository() NutritionRepository {
	return &pgNutritionRepository{}
}

func (r *pgNutritionRepository) All(ctx context.Context) ([]models.NutritionItem, error) {
	rows, err := database.Pool().Query(ctx,
		"SELECT name, calories, protein, fat, carbohydrate FROM nutrition_items")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.NutritionItem
	for rows.Next() {
		var item models.NutritionItem
		if err := rows.Scan(&item.Name, &item.Calories, &item.Protein, &item.Fat, &item.Carbohydrate); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}
