package models

import "time"

// CCPPointDef mendefinisikan aturan dan ambang batas Critical Control Point HACCP.
type CCPPointDef struct {
	ID             string  `json:"id"`
	Code           string  `json:"code"`
	Name           string  `json:"name"`
	Rule           string  `json:"rule"`
	Unit           string  `json:"unit"`
	Min            float64 `json:"min"`
	Max            float64 `json:"max"`
	MinHoldMinutes int     `json:"minHoldMinutes"`
	NeedsHold      bool    `json:"needsHold"`
}

// Standar Ambang CCP Resmi BGN Sesuai Dokumen Sistem & HACCP
var StandardCCPPoints = map[string]CCPPointDef{
	"ccp-1": {
		ID:             "ccp-1",
		Code:           "CCP-1",
		Name:           "Suhu inti masak",
		Rule:           "Minimal 75C selama 2 menit",
		Unit:           "C",
		Min:            75.0,
		Max:            100.0,
		MinHoldMinutes: 2,
		NeedsHold:      true,
	},
	"ccp-2": {
		ID:             "ccp-2",
		Code:           "CCP-2",
		Name:           "Suhu holding boks",
		Rule:           "Minimal 60C sebelum segel",
		Unit:           "C",
		Min:            60.0,
		Max:            100.0,
		MinHoldMinutes: 0,
		NeedsHold:      false,
	},
	"ccp-3": {
		ID:             "ccp-3",
		Code:           "CCP-3",
		Name:           "Komponen dingin",
		Rule:           "Rentang 4C sampai 8C",
		Unit:           "C",
		Min:            4.0,
		Max:            8.0,
		MinHoldMinutes: 0,
		NeedsHold:      false,
	},
}

// SppgQualityTempLog merepresentasikan log pengukuran suhu titik kritis CCP.
type SppgQualityTempLog struct {
	ID           string    `json:"id"`
	SppgID       string    `json:"sppgId"`
	PointID      string    `json:"pointId"`
	BatchToken   string    `json:"batchToken"`
	Value        float64   `json:"value"`
	HoldMinutes  int       `json:"holdMinutes"`
	MeasuredAt   string    `json:"measuredAt"`
	MeasuredBy   string    `json:"measuredBy"`
	EvidenceName string    `json:"evidenceName"`
	Pass         bool      `json:"pass"`
	Verdict      string    `json:"verdict"` // 'LOLOS' atau 'GAGAL'
	CreatedAt    time.Time `json:"createdAt"`
}

// SppgQualitySignoff lembar rilis mutu dan pengujian organoleptik/sensori oleh Ahli Gizi.
type SppgQualitySignoff struct {
	ID         string            `json:"id"`
	SppgID     string            `json:"sppgId"`
	BatchToken string            `json:"batchToken"`
	Aspects    map[string]string `json:"aspects"` // rasa, aroma, tekstur, visual
	Note       string            `json:"note"`
	Signer     string            `json:"signer"`
	SignedAt   string            `json:"signedAt"`
	Layak      bool              `json:"layak"` // true = LAYAK KONSUMSI, false = DITAHAN
	CreatedAt  time.Time         `json:"createdAt"`
}

// SppgQualitySample catatan sampel arsip makanan pada lemari pendingin (retensi 2x24 jam).
type SppgQualitySample struct {
	ID                string     `json:"id"`
	SppgID            string     `json:"sppgId"`
	BatchToken        string     `json:"batchToken"`
	RackNo            string     `json:"rackNo"`
	StoredAt          string     `json:"storedAt"`
	StoredBy          string     `json:"storedBy"`
	Status            string     `json:"status"` // 'tersimpan' atau 'dimusnahkan'
	RetentionDeadline string     `json:"retentionDeadline"`
	DestroyedAt       *time.Time `json:"destroyedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// SppgQualitySummary metrik ringkasan HACCP untuk dashboard kontrol mutu.
type SppgQualitySummary struct {
	PassCount           int     `json:"pass"`
	TotalCount          int     `json:"total"`
	StoredSamplesCount  int     `json:"stored"`
	SignedReleasesCount int     `json:"signed"`
	ComplianceRate      float64 `json:"complianceRate"`
}

// SppgQualityBundle data terpadu untuk halaman /sppg/quality.
type SppgQualityBundle struct {
	SppgID        string               `json:"sppgId"`
	KitchenName   string               `json:"kitchenName"`
	KitchenCode   string               `json:"kitchenCode"`
	ShiftLabel    string               `json:"shiftLabel"`
	Summary       SppgQualitySummary   `json:"summary"`
	TempLogs      []SppgQualityTempLog `json:"tempLogs"`
	Signoffs      []SppgQualitySignoff `json:"signoffs"`
	Samples       []SppgQualitySample  `json:"samples"`
	ActiveBatches []string             `json:"activeBatches"`
}

// CreateTempLogPayload payload input pengukuran suhu probe / chiller.
type CreateTempLogPayload struct {
	PointID      string  `json:"pointId"`
	BatchToken   string  `json:"batchToken"`
	Value        float64 `json:"value"`
	HoldMinutes  int     `json:"holdMinutes"`
	MeasuredAt   string  `json:"measuredAt"`
	MeasuredBy   string  `json:"measuredBy"`
	EvidenceName string  `json:"evidenceName,omitempty"`
}

// CreateSignoffPayload payload lembar rilis organoleptik ahli gizi.
type CreateSignoffPayload struct {
	BatchToken string            `json:"batchToken"`
	Aspects    map[string]string `json:"aspects"`
	Note       string            `json:"note"`
	Signer     string            `json:"signer"`
	Agree      bool              `json:"agree"`
}

// CreateSamplePayload payload pencatatan sampel arsip pangan.
type CreateSamplePayload struct {
	BatchToken string `json:"batchToken"`
	RackNo     string `json:"rackNo"`
	StoredBy   string `json:"storedBy"`
}

// UpdateSampleStatusPayload payload pemusnahan sampel setelah lewat 48 jam.
type UpdateSampleStatusPayload struct {
	Status string `json:"status"` // 'dimusnahkan'
}

// SuperadminQualityInterventionPayload tindakan darurat Superadmin jika ada batch gagal HACCP berulang.
type SuperadminQualityInterventionPayload struct {
	BatchToken string `json:"batchToken"`
	Action     string `json:"action"` // 'quarantine' atau 'warning'
	Reason     string `json:"reason"`
}
