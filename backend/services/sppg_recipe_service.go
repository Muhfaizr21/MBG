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
	ErrPackageNotFound     = errors.New("paket resep tidak ditemukan")
	ErrInvalidSppgID       = errors.New("identitas dapur SPPG tidak valid")
	ErrMenuNameRequired    = errors.New("nama resep dan kode paket wajib diisi")
	ErrIngredientRequired  = errors.New("minimal 1 bahan baku wajib dicantumkan dalam resep")
	ErrSubstitutionInvalid = errors.New("data substitusi bahan tidak lengkap")
)

// SppgRecipeService mendefinisikan logika bisnis dan isolasi multi-tenant untuk manajemen resep dapur SPPG.
type SppgRecipeService interface {
	GetRecipeBundle(ctx context.Context, sppgID string) (*models.SppgRecipeBundle, error)
	ListPackages(ctx context.Context, sppgID string) ([]models.SppgMenuPackage, error)
	GetPackageByID(ctx context.Context, id string) (*models.SppgMenuPackage, error)
	CreateCustomPackage(ctx context.Context, sppgID string, pkg *models.SppgMenuPackage) (*models.SppgMenuPackage, error)
	GetDailyState(ctx context.Context, sppgID string) (*models.SppgRecipeDailyState, error)
	UpdateDailyState(ctx context.Context, sppgID string, payload models.UpdateDailyStatePayload) (*models.SppgRecipeDailyState, error)
	ToggleMenuLock(ctx context.Context, sppgID string, payload models.ToggleLockPayload, actorName string) (*models.SppgRecipeDailyState, error)
	ListSubstitutions(ctx context.Context, sppgID string) ([]models.SppgRecipeSubstitution, error)
	SubmitSubstitution(ctx context.Context, sppgID string, payload models.CreateSubstitutionPayload) (*models.SppgRecipeSubstitution, error)
	ListBatchLogs(ctx context.Context, sppgID string) ([]models.SppgIngredientBatch, error)
	CreateBatchLog(ctx context.Context, sppgID string, batch *models.SppgIngredientBatch) (*models.SppgIngredientBatch, error)
}

type sppgRecipeService struct {
	repo repositories.SppgRecipeRepository
}

// NewSppgRecipeService membuat instance service resep SPPG baru.
func NewSppgRecipeService(repo repositories.SppgRecipeRepository) SppgRecipeService {
	return &sppgRecipeService{repo: repo}
}

func (s *sppgRecipeService) GetRecipeBundle(ctx context.Context, sppgID string) (*models.SppgRecipeBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	kitchenName, err := s.repo.GetKitchenName(ctx, sppgID)
	if err != nil {
		kitchenName = "Dapur Sentral " + sppgID
	}

	state, err := s.repo.GetDailyState(ctx, sppgID)
	if err != nil {
		return nil, fmt.Errorf("ambil daily state: %w", err)
	}

	packages, err := s.repo.ListPackages(ctx, sppgID)
	if err != nil {
		return nil, fmt.Errorf("ambil packages: %w", err)
	}

	subs, err := s.repo.ListSubstitutions(ctx, sppgID)
	if err != nil {
		return nil, fmt.Errorf("ambil substitutions: %w", err)
	}

	batches, err := s.repo.ListIngredientBatches(ctx, sppgID)
	if err != nil {
		return nil, fmt.Errorf("ambil batch logs: %w", err)
	}

	return &models.SppgRecipeBundle{
		SppgID:           sppgID,
		KitchenName:      kitchenName,
		DailyState:       state,
		Packages:         packages,
		Substitutions:    subs,
		TraceabilityLogs: batches,
	}, nil
}

func (s *sppgRecipeService) ListPackages(ctx context.Context, sppgID string) ([]models.SppgMenuPackage, error) {
	return s.repo.ListPackages(ctx, sppgID)
}

func (s *sppgRecipeService) GetPackageByID(ctx context.Context, id string) (*models.SppgMenuPackage, error) {
	pkg, err := s.repo.GetPackageByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if pkg == nil {
		return nil, ErrPackageNotFound
	}
	return pkg, nil
}

func (s *sppgRecipeService) CreateCustomPackage(ctx context.Context, sppgID string, pkg *models.SppgMenuPackage) (*models.SppgMenuPackage, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, ErrInvalidSppgID
	}
	if strings.TrimSpace(pkg.Name) == "" || strings.TrimSpace(pkg.Code) == "" {
		return nil, ErrMenuNameRequired
	}
	if len(pkg.Ingredients) == 0 {
		return nil, ErrIngredientRequired
	}

	pkg.ID = fmt.Sprintf("custom-%s-%d", strings.ToLower(sppgID), time.Now().UnixNano()%100000)
	pkg.SppgID = &sppgID
	pkg.IsNational = false
	pkg.CreatedAt = time.Now()
	pkg.UpdatedAt = time.Now()

	// Hitung akumulasi nutrisi otomatis jika belum diisi manual
	var totalCal, totalProt, totalCarb, totalFat, totalFib float64
	for _, ing := range pkg.Ingredients {
		totalCal += ing.Calories
		totalProt += ing.Protein
		totalCarb += ing.Carbs
		totalFat += ing.Fat
		totalFib += ing.Fiber
	}
	if pkg.Nutrition.Calories == 0 {
		pkg.Nutrition.Calories = totalCal
	}
	if pkg.Nutrition.Protein == 0 {
		pkg.Nutrition.Protein = totalProt
	}
	if pkg.Nutrition.Carbs == 0 {
		pkg.Nutrition.Carbs = totalCarb
	}
	if pkg.Nutrition.Fat == 0 {
		pkg.Nutrition.Fat = totalFat
	}
	if pkg.Nutrition.Fiber == 0 {
		pkg.Nutrition.Fiber = totalFib
	}

	if err := s.repo.CreatePackage(ctx, pkg); err != nil {
		return nil, fmt.Errorf("simpan paket resep: %w", err)
	}

	return pkg, nil
}

func (s *sppgRecipeService) GetDailyState(ctx context.Context, sppgID string) (*models.SppgRecipeDailyState, error) {
	return s.repo.GetDailyState(ctx, sppgID)
}

func (s *sppgRecipeService) UpdateDailyState(ctx context.Context, sppgID string, payload models.UpdateDailyStatePayload) (*models.SppgRecipeDailyState, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, ErrInvalidSppgID
	}

	state, err := s.repo.GetDailyState(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	if payload.SelectedPackageID != "" {
		state.SelectedPackageID = payload.SelectedPackageID
	}
	if payload.ActiveCohort != "" {
		state.ActiveCohort = payload.ActiveCohort
	}
	if payload.PortionCount > 0 {
		state.PortionCount = payload.PortionCount
	}

	if err := s.repo.SaveDailyState(ctx, state); err != nil {
		return nil, fmt.Errorf("perbarui daily state: %w", err)
	}

	return state, nil
}

func (s *sppgRecipeService) ToggleMenuLock(ctx context.Context, sppgID string, payload models.ToggleLockPayload, actorName string) (*models.SppgRecipeDailyState, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, ErrInvalidSppgID
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Kepala Dapur " + sppgID
	}

	state, err := s.repo.SetMenuLock(ctx, sppgID, payload.IsLocked, actorName, payload.PackageID)
	if err != nil {
		return nil, fmt.Errorf("toggle menu lock: %w", err)
	}
	return state, nil
}

func (s *sppgRecipeService) ListSubstitutions(ctx context.Context, sppgID string) ([]models.SppgRecipeSubstitution, error) {
	return s.repo.ListSubstitutions(ctx, sppgID)
}

func (s *sppgRecipeService) SubmitSubstitution(ctx context.Context, sppgID string, payload models.CreateSubstitutionPayload) (*models.SppgRecipeSubstitution, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, ErrInvalidSppgID
	}
	if strings.TrimSpace(payload.OriginalItem) == "" || strings.TrimSpace(payload.SubstituteItem) == "" {
		return nil, ErrSubstitutionInvalid
	}

	subID := fmt.Sprintf("SUB-%s-%d", sppgID, time.Now().UnixNano()%100000)
	now := time.Now()

	proteinDiffStr := fmt.Sprintf("%+.1fg", payload.ProteinVal)
	calorieDiffStr := fmt.Sprintf("%+.0f kkal", payload.CalorieVal)

	sub := &models.SppgRecipeSubstitution{
		ID:                   subID,
		TicketNo:             fmt.Sprintf("DSP/MBG-JKP/2026/%03d", (time.Now().UnixNano()/1000)%1000),
		SppgID:               sppgID,
		Date:                 now.Format("2006-01-02"),
		CycleCode:            payload.MenuCode,
		Region:               "Wilayah Operasional " + sppgID,
		MenuCode:             payload.MenuCode,
		OriginalIngredient:   payload.OriginalItem,
		SubstituteIngredient: payload.SubstituteItem,
		Reason:               payload.Reason,
		NutritionComparison: map[string]any{
			"proteinDiff":  proteinDiffStr,
			"caloriesDiff": calorieDiffStr,
			"isCompliant":  true,
		},
		NutritionistReview: "Dalam antrean verifikator gizi Satgas BGN.",
		Status:             "PENDING",
		StatusLabel:        "Menunggu Verifikasi Satgas",
		EvidencePhotoURL:   payload.EvidencePhotoURL,
		EvidenceFileName:   payload.EvidenceFileName,
		CreatedAt:          now,
	}

	if err := s.repo.CreateSubstitution(ctx, sub); err != nil {
		return nil, fmt.Errorf("simpan substitusi: %w", err)
	}

	return sub, nil
}

func (s *sppgRecipeService) ListBatchLogs(ctx context.Context, sppgID string) ([]models.SppgIngredientBatch, error) {
	return s.repo.ListIngredientBatches(ctx, sppgID)
}

func (s *sppgRecipeService) CreateBatchLog(ctx context.Context, sppgID string, batch *models.SppgIngredientBatch) (*models.SppgIngredientBatch, error) {
	if strings.TrimSpace(sppgID) == "" {
		return nil, ErrInvalidSppgID
	}
	batch.ID = fmt.Sprintf("batch-%s-%d", strings.ToLower(sppgID), time.Now().UnixNano()%100000)
	batch.SppgID = sppgID
	batch.IncomingDate = time.Now()
	batch.CreatedAt = time.Now()
	if batch.QCStatus == "" {
		batch.QCStatus = "VERIFIED"
	}

	if err := s.repo.CreateIngredientBatch(ctx, batch); err != nil {
		return nil, fmt.Errorf("simpan batch bahan: %w", err)
	}
	return batch, nil
}
