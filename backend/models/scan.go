package models

import "time"

// Verdict categories returned by scan checks; passing inputs remain pending staff review.
const (
	VerdictLayak      = "layak"
	VerdictPeringatan = "peringatan"
	VerdictTolak      = "tolak"
)

// Status pencocokan satu sekat nampan terhadap komponen menu batch.
const (
	// CompartmentStatusMatch: keyakinan memadai dan kelas AI cocok dengan komponen menu.
	CompartmentStatusMatch = "match"
	// CompartmentStatusReview: keyakinan rendah, komponen tercampur, atau menu batch tidak tersedia.
	CompartmentStatusReview = "review"
	// CompartmentStatusMismatch: keyakinan memadai tetapi hasil tidak sesuai menu batch.
	CompartmentStatusMismatch = "mismatch"
	// CompartmentStatusEmpty: sekat tidak berisi makanan.
	CompartmentStatusEmpty = "empty"
)

// ScanLog is a persisted row in scan_logs (audit trail pemindaian boks).
type ScanLog struct {
	ID           string    `json:"id"`
	BoxID        string    `json:"boxId"`
	QRToken      string    `json:"qrToken"`
	BatchID      string    `json:"batchId"`
	ImageRef     string    `json:"imageRef"`
	AIClass      string    `json:"aiClass"`
	AIConfidence float64   `json:"aiConfidence"`
	VisualScore  float64   `json:"visualScore"`
	HoldingTempC *float64  `json:"holdingTempC,omitempty"`
	ReleaseTempC *float64  `json:"releaseTempC,omitempty"`
	Verdict      string    `json:"verdict"`
	Reason       string    `json:"reason"`
	ActorID      string    `json:"actorId"`
	CreatedAt    time.Time `json:"createdAt"`
	Rating       int       `json:"rating,omitempty"`
	Feedback     string    `json:"feedback,omitempty"`
}

// ScanCheck is one row on the decision card checklist.
type ScanCheck struct {
	Label string `json:"label"`
	OK    bool   `json:"ok"`
	Note  string `json:"note"`
}

// Macros is the visual macro estimate shown on the decision card.
// Optional: nil saat mesin nutrisi belum terhubung.
type Macros struct {
	Energy  float64 `json:"energy"`
	Protein float64 `json:"protein"`
	Carbs   float64 `json:"carbs"`
	Fat     float64 `json:"fat"`
	Fiber   float64 `json:"fiber"`
}

// CompartmentMatch is the verdict of one tray compartment against the batch menu.
type CompartmentMatch struct {
	Index      int         `json:"index"`
	Cell       string      `json:"cell"`
	BBoxNorm   []float64   `json:"bboxNorm,omitempty"`
	BBoxQuad   [][]float64 `json:"bboxQuadNorm,omitempty"`
	Empty      bool        `json:"empty"`
	Predicted  string      `json:"predicted,omitempty"`
	Component  string      `json:"component,omitempty"`
	Confidence float64     `json:"confidence"`
	Mixed      bool        `json:"mixed,omitempty"`
	Status     string      `json:"status"`
	Note       string      `json:"note"`
}

// ScanResult is the classifier and measurement summary returned to web/mobile.
type ScanResult struct {
	ID                  string             `json:"id"`
	BoxID               string             `json:"boxId"`
	QRToken             string             `json:"qrToken"`
	BatchID             string             `json:"batchId,omitempty"`
	MenuName            string             `json:"menuName,omitempty"`
	MenuClass           string             `json:"menuClass,omitempty"`
	MenuConfidence      float64            `json:"menuConfidence,omitempty"`
	FreshnessClass      string             `json:"freshnessClass,omitempty"`
	FreshnessConfidence float64            `json:"freshnessConfidence,omitempty"`
	BatchInfo           *ScanBatchInfo     `json:"batchInfo,omitempty"`
	ScannedAt           string             `json:"scannedAt"`
	Score               float64            `json:"score"`
	Verdict             string             `json:"verdict"`
	VerdictLabel        string             `json:"verdictLabel"`
	ReleaseTemp         float64            `json:"releaseTemp"`
	HoldTemp            float64            `json:"holdTemp"`
	Checks              []ScanCheck        `json:"checks"`
	Compartments        []CompartmentMatch `json:"compartments,omitempty"`
	Macros              *Macros            `json:"macros,omitempty"`
	Nutrition           []NutritionMatch   `json:"nutrition,omitempty"`
	NutritionNote       string             `json:"nutritionNote,omitempty"`
	Rating              int                `json:"rating,omitempty"`
	Feedback            string             `json:"feedback,omitempty"`
	Note                string             `json:"note"`
	AIClass             string             `json:"aiClass"`
	AIConfidence        float64            `json:"aiConfidence"`
	AILatencyMS         float64            `json:"aiLatencyMs,omitempty"`
}
