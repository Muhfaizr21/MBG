package models

import (
	"time"
)

// FeedbackReporter mencatat identitas pelapor aduan mutu makanan
type FeedbackReporter struct {
	Name  string `json:"name"`
	Role  string `json:"role"`
	Phone string `json:"phone"`
	NIP   string `json:"nip,omitempty"`
}

// EvidencePhotoItem bukti visual hasil pindaian / foto fisik insiden
type EvidencePhotoItem struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	ConfidenceAI string `json:"confidenceAi"`
	Verified     bool   `json:"verified"`
}

// KillSwitchDetailsInfo rincian eksekusi pembekuan distribusi batch nasional
type KillSwitchDetailsInfo struct {
	ExecutedAt          string   `json:"executedAt"`
	ExecutedBy          string   `json:"executedBy"`
	HaltedSchoolsCount  int      `json:"haltedSchoolsCount"`
	HaltedPortionsTotal int      `json:"haltedPortionsTotal"`
	HaltedSchools       []string `json:"haltedSchools"`
}

// MedicalEscalationInfo rincian eskalasi darurat ke Puskesmas/RS terdekat
type MedicalEscalationInfo struct {
	Escalated      bool   `json:"escalated"`
	HealthCenter   string `json:"healthCenter"`
	DoctorInCharge string `json:"doctorInCharge,omitempty"`
	DoctorPhone    string `json:"doctorPhone,omitempty"`
	DispatchStatus string `json:"dispatchStatus"`
}

// InvestigationStatusInfo status penyelidikan tim auditor mutu BGN
type InvestigationStatusInfo struct {
	AssignedInspector string `json:"assignedInspector,omitempty"`
	AuditTime         string `json:"auditTime,omitempty"`
	Focus             string `json:"focus,omitempty"`
	LabSampleTaken    bool   `json:"labSampleTaken"`
}

// FeedbackTicket merepresentasikan tiket aduan / insiden mutu MBG
type FeedbackTicket struct {
	ID                   string                  `json:"id"`
	TicketNumber         string                  `json:"ticketNumber"`
	ReportedAt           string                  `json:"reportedAt"`
	SchoolName           string                  `json:"schoolName"`
	NPSN                 string                  `json:"npsn"`
	SchoolAddress        string                  `json:"schoolAddress"`
	SPPGName             string                  `json:"sppgName"`
	SPPGID               string                  `json:"sppgId"`
	BatchID              string                  `json:"batchId"`
	MenuPackage          string                  `json:"menuPackage"`
	Severity             string                  `json:"severity"`
	SeverityLabel        string                  `json:"severityLabel"`
	AnomalyType          string                  `json:"anomalyType"`
	AnomalyLabel         string                  `json:"anomalyLabel"`
	AffectedPortions     int                     `json:"affectedPortions"`
	Reporter             FeedbackReporter        `json:"reporter"`
	Title                string                  `json:"title"`
	Description          string                  `json:"description"`
	EvidencePhotos       []EvidencePhotoItem     `json:"evidencePhotos"`
	SLADeadline          string                  `json:"slaDeadline"`
	SLARemainingMinutes  int                     `json:"slaRemainingMinutes"`
	Status               string                  `json:"status"`
	StatusLabel          string                  `json:"statusLabel"`
	IsKillSwitchExecuted bool                    `json:"isKillSwitchExecuted"`
	KillSwitchDetails    *KillSwitchDetailsInfo  `json:"killSwitchDetails,omitempty"`
	MedicalEscalation    MedicalEscalationInfo   `json:"medicalEscalation"`
	InvestigationStatus  InvestigationStatusInfo `json:"investigationStatus"`
	ResolutionNotes      *string                 `json:"resolutionNotes,omitempty"`
	ClosedAt             *string                 `json:"closedAt,omitempty"`
	CreatedAt            time.Time               `json:"createdAt"`
}

// EmergencyHealthCenter fasilitas kesehatan rujukan terdekat
type EmergencyHealthCenter struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Address          string    `json:"address"`
	DistanceKm       string    `json:"distanceKm"`
	EmergencyHotline string    `json:"emergencyHotline"`
	DoctorInCharge   string    `json:"doctorInCharge"`
	AmbulanceReady   bool      `json:"ambulanceReady"`
	StandbyTeam      string    `json:"standbyTeam"`
	CreatedAt        time.Time `json:"createdAt"`
}

// FeedbackExecutiveStats metrik eksekutif aduan dan kill-switch
type FeedbackExecutiveStats struct {
	TotalActive            int     `json:"totalActive"`
	Level1Critical         int     `json:"level1Critical"`
	SlaCompliancePercent   float64 `json:"slaCompliancePercent"`
	AvgResponseMinutes     int     `json:"avgResponseMinutes"`
	FrozenCount            int     `json:"frozenCount"`
	TotalProtectedPortions int     `json:"totalProtectedPortions"`
}

// FeedbackBundle paket gabungan untuk inisialisasi halaman aduan
type FeedbackBundle struct {
	Tickets       []FeedbackTicket        `json:"tickets"`
	HealthCenters []EmergencyHealthCenter `json:"healthCenters"`
	KPI           FeedbackExecutiveStats  `json:"kpi"`
}

// CreateFeedbackRequest payload pendaftaran tiket baru
type CreateFeedbackRequest struct {
	SchoolName       string `json:"schoolName"`
	NPSN             string `json:"npsn"`
	SchoolAddress    string `json:"schoolAddress"`
	SPPGName         string `json:"sppgName"`
	SPPGID           string `json:"sppgId"`
	BatchID          string `json:"batchId"`
	MenuPackage      string `json:"menuPackage"`
	Severity         string `json:"severity"`
	AnomalyType      string `json:"anomalyType"`
	AffectedPortions int    `json:"affectedPortions"`
	ReporterName     string `json:"reporterName"`
	ReporterRole     string `json:"reporterRole"`
	ReporterPhone    string `json:"reporterPhone"`
	Title            string `json:"title"`
	Description      string `json:"description"`
}

// ExecuteKillSwitchRequest payload aktivasi protokol darurat
type ExecuteKillSwitchRequest struct {
	Notes string `json:"notes,omitempty"`
}

// EscalateMedicalRequest payload eskalasi tim medis Puskesmas
type EscalateMedicalRequest struct {
	HealthCenterID string `json:"healthCenterId"`
	Notes          string `json:"notes,omitempty"`
}

// CloseFeedbackRequest payload penutupan tiket pasca investigasi & uji lab
type CloseFeedbackRequest struct {
	LabResult          string `json:"labResult,omitempty"`
	CompensationStatus string `json:"compensationStatus,omitempty"`
	ResolutionNotes    string `json:"resolutionNotes"`
}
