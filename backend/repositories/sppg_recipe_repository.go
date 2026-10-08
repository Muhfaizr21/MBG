package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// SppgRecipeRepository mendefinisikan operasi persistensi database untuk modul resep & operasional dapur.
type SppgRecipeRepository interface {
	ListPackages(ctx context.Context, sppgID string) ([]models.SppgMenuPackage, error)
	GetPackageByID(ctx context.Context, id string) (*models.SppgMenuPackage, error)
	CreatePackage(ctx context.Context, pkg *models.SppgMenuPackage) error

	GetDailyState(ctx context.Context, sppgID string) (*models.SppgRecipeDailyState, error)
	SaveDailyState(ctx context.Context, state *models.SppgRecipeDailyState) error
	SetMenuLock(ctx context.Context, sppgID string, isLocked bool, lockedBy string, packageID string) (*models.SppgRecipeDailyState, error)

	ListSubstitutions(ctx context.Context, sppgID string) ([]models.SppgRecipeSubstitution, error)
	CreateSubstitution(ctx context.Context, sub *models.SppgRecipeSubstitution) error

	ListIngredientBatches(ctx context.Context, sppgID string) ([]models.SppgIngredientBatch, error)
	CreateIngredientBatch(ctx context.Context, batch *models.SppgIngredientBatch) error

	GetKitchenName(ctx context.Context, sppgID string) (string, error)
}

type pgSppgRecipeRepository struct{}

// NewSppgRecipeRepository membuat instance repository berbasis PostgreSQL.
func NewSppgRecipeRepository() SppgRecipeRepository {
	return &pgSppgRecipeRepository{}
}

func (r *pgSppgRecipeRepository) GetKitchenName(ctx context.Context, sppgID string) (string, error) {
	var name string
	err := database.Pool().QueryRow(ctx, "SELECT name FROM sppg_kitchens WHERE id = $1", sppgID).Scan(&name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sppgID, nil
		}
		return "", err
	}
	return name, nil
}

func (r *pgSppgRecipeRepository) ListPackages(ctx context.Context, sppgID string) ([]models.SppgMenuPackage, error) {
	query := `
		SELECT id, sppg_id, code, name, tagline, day_name, cycle, description,
		       allergens, haccp_point, serving_temp_standard,
		       calories, protein, carbs, fat, fiber, iron, calcium,
		       ingredients, is_national, created_at, updated_at
		FROM sppg_menu_packages
		WHERE is_national = true OR sppg_id = $1
		ORDER BY is_national DESC, code ASC`

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list menu packages: %w", err)
	}
	defer rows.Close()

	packages := make([]models.SppgMenuPackage, 0)
	for rows.Next() {
		var p models.SppgMenuPackage
		var allergensBytes, ingredientsBytes []byte

		err := rows.Scan(
			&p.ID, &p.SppgID, &p.Code, &p.Name, &p.Tagline, &p.DayName, &p.Cycle, &p.Description,
			&allergensBytes, &p.HACCPPoint, &p.ServingTempStandard,
			&p.Nutrition.Calories, &p.Nutrition.Protein, &p.Nutrition.Carbs, &p.Nutrition.Fat,
			&p.Nutrition.Fiber, &p.Nutrition.Iron, &p.Nutrition.Calcium,
			&ingredientsBytes, &p.IsNational, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan menu package: %w", err)
		}

		p.Allergens = make([]string, 0)
		if len(allergensBytes) > 0 {
			_ = json.Unmarshal(allergensBytes, &p.Allergens)
		}

		p.Ingredients = make([]models.RecipeIngredient, 0)
		if len(ingredientsBytes) > 0 {
			_ = json.Unmarshal(ingredientsBytes, &p.Ingredients)
		}

		packages = append(packages, p)
	}

	return packages, rows.Err()
}

func (r *pgSppgRecipeRepository) GetPackageByID(ctx context.Context, id string) (*models.SppgMenuPackage, error) {
	query := `
		SELECT id, sppg_id, code, name, tagline, day_name, cycle, description,
		       allergens, haccp_point, serving_temp_standard,
		       calories, protein, carbs, fat, fiber, iron, calcium,
		       ingredients, is_national, created_at, updated_at
		FROM sppg_menu_packages
		WHERE id = $1`

	var p models.SppgMenuPackage
	var allergensBytes, ingredientsBytes []byte

	err := database.Pool().QueryRow(ctx, query, id).Scan(
		&p.ID, &p.SppgID, &p.Code, &p.Name, &p.Tagline, &p.DayName, &p.Cycle, &p.Description,
		&allergensBytes, &p.HACCPPoint, &p.ServingTempStandard,
		&p.Nutrition.Calories, &p.Nutrition.Protein, &p.Nutrition.Carbs, &p.Nutrition.Fat,
		&p.Nutrition.Fiber, &p.Nutrition.Iron, &p.Nutrition.Calcium,
		&ingredientsBytes, &p.IsNational, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get package by id: %w", err)
	}

	p.Allergens = make([]string, 0)
	if len(allergensBytes) > 0 {
		_ = json.Unmarshal(allergensBytes, &p.Allergens)
	}

	p.Ingredients = make([]models.RecipeIngredient, 0)
	if len(ingredientsBytes) > 0 {
		_ = json.Unmarshal(ingredientsBytes, &p.Ingredients)
	}

	return &p, nil
}

func (r *pgSppgRecipeRepository) CreatePackage(ctx context.Context, pkg *models.SppgMenuPackage) error {
	allergensJSON, err := json.Marshal(pkg.Allergens)
	if err != nil {
		allergensJSON = []byte("[]")
	}

	ingredientsJSON, err := json.Marshal(pkg.Ingredients)
	if err != nil {
		ingredientsJSON = []byte("[]")
	}

	query := `
		INSERT INTO sppg_menu_packages (
			id, sppg_id, code, name, tagline, day_name, cycle, description,
			allergens, haccp_point, serving_temp_standard,
			calories, protein, carbs, fat, fiber, iron, calcium,
			ingredients, is_national, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11,
			$12, $13, $14, $15, $16, $17, $18,
			$19, $20, NOW(), NOW()
		)`

	_, err = database.Pool().Exec(ctx, query,
		pkg.ID, pkg.SppgID, pkg.Code, pkg.Name, pkg.Tagline, pkg.DayName, pkg.Cycle, pkg.Description,
		allergensJSON, pkg.HACCPPoint, pkg.ServingTempStandard,
		pkg.Nutrition.Calories, pkg.Nutrition.Protein, pkg.Nutrition.Carbs, pkg.Nutrition.Fat,
		pkg.Nutrition.Fiber, pkg.Nutrition.Iron, pkg.Nutrition.Calcium,
		ingredientsJSON, pkg.IsNational,
	)
	return err
}

func (r *pgSppgRecipeRepository) GetDailyState(ctx context.Context, sppgID string) (*models.SppgRecipeDailyState, error) {
	query := `
		SELECT sppg_id, date::text, selected_package_id, active_cohort, portion_count,
		       is_locked, locked_at, COALESCE(locked_by, ''), verified_by, updated_at
		FROM sppg_recipe_daily_states
		WHERE sppg_id = $1 AND date = CURRENT_DATE`

	var state models.SppgRecipeDailyState
	err := database.Pool().QueryRow(ctx, query, sppgID).Scan(
		&state.SppgID, &state.Date, &state.SelectedPackageID, &state.ActiveCohort, &state.PortionCount,
		&state.IsLocked, &state.LockedAt, &state.LockedBy, &state.VerifiedBy, &state.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Inisialisasi state default jika belum ada untuk hari ini
			now := time.Now()
			initState := &models.SppgRecipeDailyState{
				SppgID:            sppgID,
				Date:              now.Format("2006-01-02"),
				SelectedPackageID: "paket-a",
				ActiveCohort:      "sd_atas",
				PortionCount:      2500,
				IsLocked:          false,
				VerifiedBy:        "Satgas MBG Wilayah Pusat",
				UpdatedAt:         now,
			}
			_ = r.SaveDailyState(ctx, initState)
			return initState, nil
		}
		return nil, fmt.Errorf("get daily state: %w", err)
	}

	return &state, nil
}

func (r *pgSppgRecipeRepository) SaveDailyState(ctx context.Context, state *models.SppgRecipeDailyState) error {
	query := `
		INSERT INTO sppg_recipe_daily_states (
			sppg_id, date, selected_package_id, active_cohort, portion_count,
			is_locked, locked_at, locked_by, verified_by, updated_at
		) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, NOW())
		ON CONFLICT (sppg_id, date) DO UPDATE SET
			selected_package_id = EXCLUDED.selected_package_id,
			active_cohort = EXCLUDED.active_cohort,
			portion_count = EXCLUDED.portion_count,
			updated_at = NOW()`

	_, err := database.Pool().Exec(ctx, query,
		state.SppgID, state.SelectedPackageID, state.ActiveCohort, state.PortionCount,
		state.IsLocked, state.LockedAt, state.LockedBy, state.VerifiedBy,
	)
	return err
}

func (r *pgSppgRecipeRepository) SetMenuLock(ctx context.Context, sppgID string, isLocked bool, lockedBy string, packageID string) (*models.SppgRecipeDailyState, error) {
	var lockedAt *time.Time
	if isLocked {
		now := time.Now()
		lockedAt = &now
	}

	query := `
		INSERT INTO sppg_recipe_daily_states (
			sppg_id, date, selected_package_id, active_cohort, portion_count,
			is_locked, locked_at, locked_by, verified_by, updated_at
		) VALUES ($1, CURRENT_DATE, $2, 'sd_atas', 2500, $3, $4, $5, 'Satgas MBG Wilayah Pusat', NOW())
		ON CONFLICT (sppg_id, date) DO UPDATE SET
			is_locked = EXCLUDED.is_locked,
			locked_at = EXCLUDED.locked_at,
			locked_by = EXCLUDED.locked_by,
			selected_package_id = CASE WHEN $2 <> '' THEN $2 ELSE sppg_recipe_daily_states.selected_package_id END,
			updated_at = NOW()
		RETURNING sppg_id, date::text, selected_package_id, active_cohort, portion_count,
		          is_locked, locked_at, COALESCE(locked_by, ''), verified_by, updated_at`

	var state models.SppgRecipeDailyState
	err := database.Pool().QueryRow(ctx, query, sppgID, packageID, isLocked, lockedAt, lockedBy).Scan(
		&state.SppgID, &state.Date, &state.SelectedPackageID, &state.ActiveCohort, &state.PortionCount,
		&state.IsLocked, &state.LockedAt, &state.LockedBy, &state.VerifiedBy, &state.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("set menu lock: %w", err)
	}

	return &state, nil
}

func (r *pgSppgRecipeRepository) ListSubstitutions(ctx context.Context, sppgID string) ([]models.SppgRecipeSubstitution, error) {
	query := `
		SELECT id, COALESCE(sppg_id, ''), date::text, cycle_code, region, menu_code,
		       original_ingredient, substitute_ingredient, reason, nutrition_comparison,
		       nutritionist_review, status, status_label,
		       evidence_photo_url, evidence_file_name, approved_at, approved_by, created_at
		FROM menu_substitutions
		WHERE sppg_id = $1 OR sppg_id IS NULL
		ORDER BY created_at DESC`

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list substitutions: %w", err)
	}
	defer rows.Close()

	subs := make([]models.SppgRecipeSubstitution, 0)
	for rows.Next() {
		var s models.SppgRecipeSubstitution
		var compBytes []byte

		err := rows.Scan(
			&s.ID, &s.SppgID, &s.Date, &s.CycleCode, &s.Region, &s.MenuCode,
			&s.OriginalIngredient, &s.SubstituteIngredient, &s.Reason, &compBytes,
			&s.NutritionistReview, &s.Status, &s.StatusLabel,
			&s.EvidencePhotoURL, &s.EvidenceFileName, &s.ApprovedAt, &s.ApprovedBy, &s.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan substitution: %w", err)
		}

		s.NutritionComparison = make(map[string]any)
		if len(compBytes) > 0 {
			_ = json.Unmarshal(compBytes, &s.NutritionComparison)
		}
		s.TicketNo = fmt.Sprintf("DSP/MBG-JKP/2026/%03d", (s.CreatedAt.UnixNano()/1000)%1000)

		subs = append(subs, s)
	}

	return subs, rows.Err()
}

func (r *pgSppgRecipeRepository) CreateSubstitution(ctx context.Context, sub *models.SppgRecipeSubstitution) error {
	compJSON, err := json.Marshal(sub.NutritionComparison)
	if err != nil {
		compJSON = []byte("{}")
	}

	query := `
		INSERT INTO menu_substitutions (
			id, sppg_id, date, cycle_code, region, menu_code,
			original_ingredient, substitute_ingredient, reason, nutrition_comparison,
			nutritionist_review, status, status_label,
			evidence_photo_url, evidence_file_name, created_at, updated_at
		) VALUES (
			$1, $2, CURRENT_DATE, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12,
			$13, $14, NOW(), NOW()
		)`

	_, err = database.Pool().Exec(ctx, query,
		sub.ID, sub.SppgID, sub.CycleCode, sub.Region, sub.MenuCode,
		sub.OriginalIngredient, sub.SubstituteIngredient, sub.Reason, compJSON,
		sub.NutritionistReview, sub.Status, sub.StatusLabel,
		sub.EvidencePhotoURL, sub.EvidenceFileName,
	)
	return err
}

func (r *pgSppgRecipeRepository) ListIngredientBatches(ctx context.Context, sppgID string) ([]models.SppgIngredientBatch, error) {
	query := `
		SELECT id, sppg_id, commodity, batch_no, supplier, nkv_number, halal_cert_no,
		       incoming_date, expiry_date, storage_temp, qc_inspector, qc_result, qc_status,
		       quantity_received, created_at
		FROM sppg_ingredient_batches
		WHERE sppg_id = $1
		ORDER BY incoming_date DESC, created_at DESC`

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list ingredient batches: %w", err)
	}
	defer rows.Close()

	batches := make([]models.SppgIngredientBatch, 0)
	for rows.Next() {
		var b models.SppgIngredientBatch
		err := rows.Scan(
			&b.ID, &b.SppgID, &b.Commodity, &b.BatchNo, &b.Supplier, &b.NKVNumber, &b.HalalCertNo,
			&b.IncomingDate, &b.ExpiryDate, &b.StorageTemp, &b.QCInspector, &b.QCResult, &b.QCStatus,
			&b.QuantityReceived, &b.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan ingredient batch: %w", err)
		}
		batches = append(batches, b)
	}

	return batches, rows.Err()
}

func (r *pgSppgRecipeRepository) CreateIngredientBatch(ctx context.Context, batch *models.SppgIngredientBatch) error {
	query := `
		INSERT INTO sppg_ingredient_batches (
			id, sppg_id, commodity, batch_no, supplier, nkv_number, halal_cert_no,
			incoming_date, expiry_date, storage_temp, qc_inspector, qc_result, qc_status,
			quantity_received, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13,
			$14, NOW()
		)`

	_, err := database.Pool().Exec(ctx, query,
		batch.ID, batch.SppgID, batch.Commodity, batch.BatchNo, batch.Supplier, batch.NKVNumber, batch.HalalCertNo,
		batch.IncomingDate, batch.ExpiryDate, batch.StorageTemp, batch.QCInspector, batch.QCResult, batch.QCStatus,
		batch.QuantityReceived,
	)
	return err
}
