package models

import (
	"time"
)

// SppgBatch merepresentasikan 1 batch masak makanan bergizi gratis dengan stempel keamanan pangan HACCP dan token QR.
type SppgBatch struct {
	ID               string     `json:"id"`
	SppgID           string     `json:"sppgId"`
	Token            string     `json:"token"`
	Seq              int        `json:"seq"`
	SchoolID         string     `json:"schoolId"`
	SchoolCode       string     `json:"schoolCode"`
	SchoolName       string     `json:"schoolName"`
	MenuCode         string     `json:"menuCode"`
	MenuName         string     `json:"menuName"`
	BoxCount         int        `json:"boxCount"`
	CookedAt         string     `json:"cookedAt"`
	ConsumeBy        string     `json:"consumeBy"`
	CookTemp         float64    `json:"cookTemp"`
	Allergens        []string   `json:"allergens"`
	Status           string     `json:"status"` // 'draft', 'queued', 'ready', 'quarantined', 'recalled'
	Verified         bool       `json:"verified"`
	Checksum         string     `json:"checksum"`
	CookingDate      string     `json:"cookingDate"`
	TargetPortions   int        `json:"targetPortions"`
	ActualPortions   int        `json:"actualPortions"`
	CoreTempC        float64    `json:"coreTempC"`
	CookLead         string     `json:"cookLead"`
	QCStatus         string     `json:"qcStatus"`
	HACCPStatus      string     `json:"haccpStatus"`
	QuarantineReason string     `json:"quarantineReason,omitempty"`
	QuarantinedBy    string     `json:"quarantinedBy,omitempty"`
	QuarantinedAt    *time.Time `json:"quarantinedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// AssignedSchoolSummary ringkasan data sekolah binaan untuk dropdown slip batch.
type AssignedSchoolSummary struct {
	ID         string `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	Quota      int    `json:"quota"`
	Address    string `json:"address"`
	City       string `json:"city"`
	Level      string `json:"level"`
}

// MenuPackageSummary ringkasan paket menu untuk dropdown slip batch.
type MenuPackageSummary struct {
	ID        string   `json:"id"`
	Code      string   `json:"code"`
	Name      string   `json:"name"`
	Allergens []string `json:"allergens"`
}

// SppgBatchBundle data terintegrasi yang disajikan untuk halaman /sppg/batches.
type SppgBatchBundle struct {
	Batches          []SppgBatch             `json:"batches"`
	SppgID           string                  `json:"sppgId"`
	KitchenName      string                  `json:"kitchenName"`
	KitchenCode      string                  `json:"kitchenCode"`
	CookingDate      string                  `json:"cookingDate"`
	TargetBoxes      int                     `json:"targetBoxes"`
	TotalBoxes       int                     `json:"totalBoxes"`
	TotalTotes       int                     `json:"totalTotes"`
	QueuedCount      int                     `json:"queuedCount"`
	VerifiedCount    int                     `json:"verifiedCount"`
	AvailableSchools []AssignedSchoolSummary `json:"availableSchools"`
	AvailableMenus   []MenuPackageSummary    `json:"availableMenus"`
}

// CreateBatchPayload payload untuk membuat batch baru dari slip form.
type CreateBatchPayload struct {
	SchoolID string  `json:"schoolId"`
	MenuCode string  `json:"menuCode"`
	MenuID   string  `json:"menuId,omitempty"`
	BoxCount int     `json:"boxCount"`
	CookedAt string  `json:"cookedAt"`
	CookTemp float64 `json:"cookTemp"`
	CookLead string  `json:"cookLead,omitempty"`
}

// UpdateBatchStatusPayload payload untuk mengubah status antrean cetak / siap kirim.
type UpdateBatchStatusPayload struct {
	Status string `json:"status"` // 'draft', 'queued', 'ready'
}

// QuarantineBatchPayload payload bagi Superadmin untuk karantina atau penarikan batch darurat (HACCP failure).
type QuarantineBatchPayload struct {
	Reason string `json:"reason"`
}

// VerifyBatchTokenPayload payload uji mandiri pemindaian barcode/token QR.
type VerifyBatchTokenPayload struct {
	Token string `json:"token"`
}

// VerifyBatchTokenResult output hasil verifikasi keaslian token dan stempel SHA-256.
type VerifyBatchTokenResult struct {
	OK          bool       `json:"ok"`
	Message     string     `json:"message"`
	Batch       *SppgBatch `json:"batch,omitempty"`
	MatchedType string     `json:"matchedType,omitempty"` // 'box' atau 'master_tote'
	ToteIndex   int        `json:"toteIndex,omitempty"`
}
