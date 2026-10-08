package models

import "time"

// NutritionSummary merangkum estimasi gizi per porsi standar.
type NutritionSummary struct {
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
	Fiber    float64 `json:"fiber"`
	Iron     float64 `json:"iron"`
	Calcium  float64 `json:"calcium"`
}

// RecipeIngredient mendefinisikan rincian bahan baku, gramatur, nutrisi, dan traceability LOT.
type RecipeIngredient struct {
	ID                   string  `json:"id"`
	Name                 string  `json:"name"`
	Category             string  `json:"category"`
	TKPICode             string  `json:"tkpiCode"`
	PerPortionGram       float64 `json:"perPortionGram"`
	Unit                 string  `json:"unit"`
	ProcurementUnit      string  `json:"procurementUnit"`
	MultiplierPerPortion float64 `json:"multiplierPerPortion"`
	Calories             float64 `json:"calories"`
	Protein              float64 `json:"protein"`
	Carbs                float64 `json:"carbs"`
	Fat                  float64 `json:"fat"`
	Fiber                float64 `json:"fiber"`
	Supplier             string  `json:"supplier"`
	NKVOrCert            string  `json:"nkvOrCert"`
	CurrentBatch         string  `json:"currentBatch"`
	BatchExpiry          string  `json:"batchExpiry"`
	QCStatus             string  `json:"qcStatus"`
	QCNote               string  `json:"qcNote"`
}

// SppgMenuPackage merepresentasikan resep lengkap (paket siklus harian BGN / kustom SPPG).
type SppgMenuPackage struct {
	ID                  string             `json:"id"`
	SppgID              *string            `json:"sppgId,omitempty"` // nil bila Template Nasional BGN
	Code                string             `json:"code"`
	Name                string             `json:"name"`
	Tagline             string             `json:"tagline"`
	DayName             string             `json:"dayName"`
	Cycle               string             `json:"cycle"`
	Description         string             `json:"description"`
	Allergens           []string           `json:"allergens"`
	HACCPPoint          string             `json:"haccpPoint"`
	ServingTempStandard string             `json:"servingStandardTemp"`
	Nutrition           NutritionSummary   `json:"nutrition"`
	Ingredients         []RecipeIngredient `json:"ingredients"`
	IsNational          bool               `json:"isNational"`
	CreatedAt           time.Time          `json:"createdAt"`
	UpdatedAt           time.Time          `json:"updatedAt"`
}

// SppgRecipeDailyState melacak state operasional harian dapur per-SPPG.
type SppgRecipeDailyState struct {
	SppgID            string     `json:"sppgId"`
	Date              string     `json:"date"`
	SelectedPackageID string     `json:"selectedPackageId"`
	ActiveCohort      string     `json:"activeCohort"`
	PortionCount      int        `json:"portionCount"`
	IsLocked          bool       `json:"isLocked"`
	LockedAt          *time.Time `json:"lockedAt,omitempty"`
	LockedBy          string     `json:"lockedBy,omitempty"`
	VerifiedBy        string     `json:"verifiedBy"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// SppgIngredientBatch merepresentasikan log penerimaan bahan baku & pengawasan cold-chain.
type SppgIngredientBatch struct {
	ID               string    `json:"id"`
	SppgID           string    `json:"sppgId"`
	Commodity        string    `json:"commodity"`
	BatchNo          string    `json:"batchNo"`
	Supplier         string    `json:"supplier"`
	NKVNumber        string    `json:"nkvNumber"`
	HalalCertNo      string    `json:"halalCertNo"`
	IncomingDate     time.Time `json:"incomingDate"`
	ExpiryDate       string    `json:"expiryDate"`
	StorageTemp      string    `json:"storageTemp"`
	QCInspector      string    `json:"qcInspector"`
	QCResult         string    `json:"qcResult"`
	QCStatus         string    `json:"qcStatus"`
	QuantityReceived string    `json:"quantityReceived"`
	CreatedAt        time.Time `json:"createdAt"`
}

// SppgRecipeSubstitution merepresentasikan pengajuan substitusi bahan darurat di dapur SPPG.
type SppgRecipeSubstitution struct {
	ID                   string         `json:"id"`
	TicketNo             string         `json:"ticketNo"`
	SppgID               string         `json:"sppgId"`
	Date                 string         `json:"date"`
	CycleCode            string         `json:"cycleCode"`
	Region               string         `json:"region"`
	MenuCode             string         `json:"menuCode"`
	OriginalIngredient   string         `json:"originalItem"`
	SubstituteIngredient string         `json:"substituteItem"`
	Reason               string         `json:"reason"`
	NutritionComparison  map[string]any `json:"nutritionComparison"`
	NutritionistReview   string         `json:"nutritionistReview"`
	Status               string         `json:"status"`
	StatusLabel          string         `json:"statusLabel"`
	EvidencePhotoURL     string         `json:"evidencePhotoUrl"`
	EvidenceFileName     string         `json:"evidenceFileName"`
	ApprovedAt           *string        `json:"approvedAt,omitempty"`
	ApprovedBy           *string        `json:"approvedBy,omitempty"`
	CreatedAt            time.Time      `json:"createdAt"`
}

// SppgRecipeBundle menggabungkan data inisialisasi halaman /sppg/recipes dalam 1 roundtrip.
type SppgRecipeBundle struct {
	SppgID           string                   `json:"sppgId"`
	KitchenName      string                   `json:"kitchenName"`
	DailyState       *SppgRecipeDailyState    `json:"dailyState"`
	Packages         []SppgMenuPackage        `json:"packages"`
	Substitutions    []SppgRecipeSubstitution `json:"substitutions"`
	TraceabilityLogs []SppgIngredientBatch    `json:"traceabilityLogs"`
}

// ToggleLockPayload adalah request untuk mengunci/membuka kunci menu hari ini.
type ToggleLockPayload struct {
	SppgID    string `json:"sppgId"`
	IsLocked  bool   `json:"isLocked"`
	PackageID string `json:"packageId"`
}

// UpdateDailyStatePayload adalah request untuk memperbarui konfigurasi porsi / cohort.
type UpdateDailyStatePayload struct {
	SppgID            string `json:"sppgId"`
	SelectedPackageID string `json:"selectedPackageId"`
	ActiveCohort      string `json:"activeCohort"`
	PortionCount      int    `json:"portionCount"`
}

// CreateSubstitutionPayload adalah request form pengajuan substitusi bahan.
type CreateSubstitutionPayload struct {
	SppgID           string  `json:"sppgId"`
	MenuCode         string  `json:"menuCode"`
	OriginalItem     string  `json:"originalItem"`
	SubstituteItem   string  `json:"substituteItem"`
	Supplier         string  `json:"supplier"`
	Reason           string  `json:"reason"`
	ProteinVal       float64 `json:"proteinVal"`
	CalorieVal       float64 `json:"calorieVal"`
	EvidenceFileName string  `json:"evidenceFileName"`
	EvidencePhotoURL string  `json:"evidencePhotoUrl"`
}
