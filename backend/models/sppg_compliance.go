package models

import (
	"time"
)

// SppgComplianceDoc entitas sertifikat akreditasi resmi dapur SPPG (SLHS, Halal, NKV).
type SppgComplianceDoc struct {
	ID          string    `json:"id"`
	SppgID      string    `json:"sppgId"`
	Name        string    `json:"name"`
	Issuer      string    `json:"issuer"`
	Number      string    `json:"number"`
	Expiry      string    `json:"expiry"` // YYYY-MM-DD
	FileName    string    `json:"fileName"`
	DaysLeft    int       `json:"daysLeft"`
	StatusLabel string    `json:"statusLabel"`
	StatusTone  string    `json:"statusTone"`
	IsOk        bool      `json:"isOk"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// SppgComplianceHandler profil tenaga penjamah makanan (koki, asisten, petugas kemas).
type SppgComplianceHandler struct {
	ID               string    `json:"id"`
	SppgID           string    `json:"sppgId"`
	Name             string    `json:"name"`
	Role             string    `json:"role"`
	HealthExpiry     string    `json:"healthExpiry"` // YYYY-MM-DD
	HealthFile       string    `json:"healthFile"`
	Trained          bool      `json:"trained"`
	DaysLeft         int       `json:"daysLeft"`
	StatusLabel      string    `json:"statusLabel"`
	StatusTone       string    `json:"statusTone"`
	IsHealthOk       bool      `json:"isHealthOk"`
	IsFullyQualified bool      `json:"isFullyQualified"` // Sehat & Bersertifikat
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// SppgComplianceLab hasil uji laboratorium mikrobiologi dan kualitas air dapur.
type SppgComplianceLab struct {
	ID           string    `json:"id"`
	SppgID       string    `json:"sppgId"`
	TestDate     string    `json:"testDate"` // YYYY-MM-DD
	Date         string    `json:"date"`     // Alias kompatibilitas frontend
	Kind         string    `json:"kind"`     // "swab", "air", "fisika"
	Target       string    `json:"target"`
	Param        string    `json:"param"`
	Value        float64   `json:"value"`
	Unit         string    `json:"unit"`
	VerdictLabel string    `json:"verdictLabel"`
	Pass         bool      `json:"pass"`
	CreatedAt    time.Time `json:"createdAt"`
}

// SppgComplianceAudit pengajuan permohonan audit dan sidak sanitasi ke Dinkes setempat.
type SppgComplianceAudit struct {
	ID            string    `json:"id"`
	SppgID        string    `json:"sppgId"`
	Purpose       string    `json:"purpose"`
	PreferredDate string    `json:"preferredDate"` // YYYY-MM-DD
	Note          string    `json:"note"`
	Status        string    `json:"status"` // "Diajukan", "Terjadwal", "Selesai"
	FiledAt       string    `json:"filedAt"`
	CreatedAt     time.Time `json:"createdAt"`
}

// SppgComplianceTotals ringkasan angka kepatuhan sanitasi dapur.
type SppgComplianceTotals struct {
	Docs       int `json:"docs"`
	Expired    int `json:"expired"`
	Handlers   int `json:"handlers"`
	HandlersOk int `json:"handlersOk"`
	Labs       int `json:"labs"`
	LabsPass   int `json:"labsPass"`
	Audits     int `json:"audits"`
}

// SppgComplianceBundle paket lengkap legalitas, penjamah, uji lab, dan permohonan audit Dinkes.
type SppgComplianceBundle struct {
	SppgID      string                  `json:"sppgId"`
	KitchenName string                  `json:"kitchenName"`
	KitchenCode string                  `json:"kitchenCode"`
	SessionDate string                  `json:"sessionDate"`
	Totals      SppgComplianceTotals    `json:"totals"`
	Docs        []SppgComplianceDoc     `json:"docs"`
	Handlers    []SppgComplianceHandler `json:"handlers"`
	Labs        []SppgComplianceLab     `json:"labs"`
	Audits      []SppgComplianceAudit   `json:"audits"`
}

// RenewComplianceDocPayload request pembaruan masa berlaku dokumen sertifikasi.
type RenewComplianceDocPayload struct {
	DocID    string `json:"docId"`
	Expiry   string `json:"expiry"`
	FileName string `json:"fileName,omitempty"`
}

// CreateComplianceHandlerPayload request pendaftaran penjamah makanan baru.
type CreateComplianceHandlerPayload struct {
	Name         string `json:"name"`
	Role         string `json:"role"`
	HealthExpiry string `json:"healthExpiry"`
	HealthFile   string `json:"healthFile,omitempty"`
	Trained      bool   `json:"trained"`
}

// CreateComplianceLabPayload request pencatatan hasil uji lab baru.
type CreateComplianceLabPayload struct {
	Kind   string  `json:"kind"`
	Target string  `json:"target"`
	Param  string  `json:"param"`
	Value  float64 `json:"value"`
	Unit   string  `json:"unit"`
	Date   string  `json:"date,omitempty"`
}

// RequestComplianceAuditPayload request permohonan audit berkala ke Dinkes.
type RequestComplianceAuditPayload struct {
	Purpose       string `json:"purpose"`
	PreferredDate string `json:"preferredDate"`
	Note          string `json:"note,omitempty"`
}
