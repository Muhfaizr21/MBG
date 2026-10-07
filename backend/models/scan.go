package models

import "time"

// Verdict values for a scan decision card.
// Diselaraskan dengan frontend web (ValidatorScanPage: layak | peringatan | tolak).
const (
	VerdictLayak      = "layak"
	VerdictPeringatan = "peringatan"
	VerdictTolak      = "tolak"
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

// ScanResult is the decision card returned to web/mobile after POST /api/scans.
// Bentuknya selaras dengan SCAN_SAMPLE_RESULTS di frontend.
type ScanResult struct {
	ID            string           `json:"id"`
	BoxID         string           `json:"boxId"`
	QRToken       string           `json:"qrToken"`
	BatchID       string           `json:"batchId,omitempty"`
	ScannedAt     string           `json:"scannedAt"`
	Score         float64          `json:"score"`
	Verdict       string           `json:"verdict"`
	VerdictLabel  string           `json:"verdictLabel"`
	ReleaseTemp   float64          `json:"releaseTemp"`
	HoldTemp      float64          `json:"holdTemp"`
	Checks        []ScanCheck      `json:"checks"`
	Macros        *Macros          `json:"macros,omitempty"`
	Nutrition     []NutritionMatch `json:"nutrition,omitempty"`
	NutritionNote string           `json:"nutritionNote,omitempty"`
	Rating        int              `json:"rating,omitempty"`
	Feedback      string           `json:"feedback,omitempty"`
	Note          string           `json:"note"`
	AIClass       string           `json:"aiClass"`
	AIConfidence  float64          `json:"aiConfidence"`
	AILatencyMS   float64          `json:"aiLatencyMs,omitempty"`
}
