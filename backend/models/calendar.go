package models

import "time"

// InspectionDetail merepresentasikan jadwal sidak & audit mendadak oleh satgas
type InspectionDetail struct {
	ID             string `json:"id"`
	LeadInspector  string `json:"leadInspector"`
	Team           string `json:"team"`
	TargetSppgName string `json:"targetSppgName"`
	SppgID         string `json:"sppgId"`
	AuditTime      string `json:"auditTime"`
	AuditFocus     string `json:"auditFocus"`
	Result         string `json:"result"`
}

// NutritionComparison merepresentasikan komparasi gizi antara bahan asli dan bahan pengganti
type NutritionComparison struct {
	ProteinOriginal    string `json:"proteinOriginal"`
	ProteinSubstitute  string `json:"proteinSubstitute"`
	CaloriesOriginal   string `json:"caloriesOriginal"`
	CaloriesSubstitute string `json:"caloriesSubstitute"`
	CostOriginal       string `json:"costOriginal"`
	CostSubstitute     string `json:"costSubstitute"`
}

// MenuSubstitution merepresentasikan usulan penggantian menu darurat
type MenuSubstitution struct {
	ID                  string              `json:"id"`
	Date                string              `json:"date"`
	CycleCode           string              `json:"cycleCode"`
	Region              string              `json:"region"`
	OriginalIngredient  string              `json:"originalIngredient"`
	SubstituteIngredient string              `json:"substituteIngredient"`
	Reason              string              `json:"reason"`
	NutritionComparison NutritionComparison `json:"nutritionComparison"`
	NutritionistReview  string              `json:"nutritionistReview"`
	Status              string              `json:"status"` // 'approved', 'pending', 'rejected'
	StatusLabel         string              `json:"statusLabel"`
	ApprovedAt          *string             `json:"approvedAt,omitempty"`
	ApprovedBy          *string             `json:"approvedBy,omitempty"`
	CreatedAt           time.Time           `json:"createdAt"`
	UpdatedAt           time.Time           `json:"updatedAt"`
}

// CalendarDay merepresentasikan kalender operasional menu harian MBG
type CalendarDay struct {
	Date                  string            `json:"date"`
	PackageID             string            `json:"packageId"`
	DayName               string            `json:"dayName"`
	DayNumber             int               `json:"dayNumber"`
	MonthYear             string            `json:"monthYear"`
	DayType               string            `json:"dayType"` // 'school_day', 'exam_day', 'weekend', 'holiday'
	DayTypeLabel          string            `json:"dayTypeLabel"`
	Title                 string            `json:"title"`
	MenuStatus            string            `json:"menuStatus"` // 'locked', 'draft', 'substitution_approved', 'blackout'
	MenuStatusLabel       string            `json:"menuStatusLabel"`
	IsOperationalBlackout bool              `json:"isOperationalBlackout"`
	BlackoutReason        string            `json:"blackoutReason,omitempty"`
	TargetPortions        int               `json:"targetPortions"`
	ActiveKitchens        int               `json:"activeKitchens"`
	HasInspection         bool              `json:"hasInspection"`
	InspectionDetail      *InspectionDetail `json:"inspectionDetail,omitempty"`
	HasSubstitution       bool              `json:"hasSubstitution"`
	SubstitutionID        string            `json:"substitutionId,omitempty"`
	Status                string            `json:"status"` // backward compatibility
	Theme                 string            `json:"theme"`  // backward compatibility
	Notes                 string            `json:"notes"`  // backward compatibility
	WeekNumber            int               `json:"weekNumber"`
	Package               *MenuPackage      `json:"package,omitempty"`
	UpdatedAt             time.Time         `json:"updatedAt"`
}

// Request DTOs

type LockMonthRequest struct {
	MonthYear string `json:"monthYear"`
}

type BlackoutDateRequest struct {
	Title              string `json:"title"`
	Reason             string `json:"reason"`
	IsSettingBlackout  bool   `json:"isSettingBlackout"`
}

type CreateSubstitutionRequest struct {
	Date                string              `json:"date"`
	CycleCode           string              `json:"cycleCode"`
	Region              string              `json:"region"`
	OriginalIngredient  string              `json:"originalIngredient"`
	SubstituteIngredient string              `json:"substituteIngredient"`
	Reason              string              `json:"reason"`
	NutritionComparison NutritionComparison `json:"nutritionComparison"`
	NutritionistReview  string              `json:"nutritionistReview"`
}

type ReviewSubstitutionRequest struct {
	Action string `json:"action"` // 'approve' | 'reject'
}

type ScheduleInspectionRequest struct {
	LeadInspector  string `json:"leadInspector"`
	Team           string `json:"team"`
	TargetSppgName string `json:"targetSppgName"`
	SppgID         string `json:"sppgId"`
	AuditTime      string `json:"auditTime"`
	AuditFocus     string `json:"auditFocus"`
}
