package models

import (
	"encoding/json"
	"time"
)

// School struct moved to models/school.go for dedicated school domain.

// MenuPackage merepresentasikan paket menu standar gizi BGN
type MenuPackage struct {
	ID             string    `json:"id"`
	CycleCode      string    `json:"cycleCode"`
	DaySlot        string    `json:"daySlot"`
	Name           string    `json:"name"`
	Staple         string    `json:"staple"`
	ProteinMain    string    `json:"proteinMain"`
	SideVeggie     string    `json:"sideVeggie"`
	Fruit          string    `json:"fruit"`
	DairyDrink     string    `json:"dairyDrink"`
	Calories       float64   `json:"calories"`
	Protein        float64   `json:"protein"`
	Carbs          float64   `json:"carbs"`
	Fat            float64   `json:"fat"`
	Calcium        float64   `json:"calcium"`
	Iron           float64   `json:"iron"`
	Zinc           float64   `json:"zinc"`
	CostPerServing float64   `json:"costPerServing"`
	Allergens      string    `json:"allergens"`
	HalalCert      string    `json:"halalCert"`
	SLHSCert       string    `json:"slhsCert"`
	Description    string    `json:"description"`
	CreatedAt      time.Time `json:"createdAt"`
}

// CalendarDay struct moved to models/calendar.go for dedicated calendar & menu cycle domain.
// Delivery didefinisikan dalam models/delivery.go

// Schedule struct moved to models/schedule.go for dedicated schedule & cold-chain fleet domain.

// Attendance struct moved to models/attendance.go for dedicated attendance domain.

// Notice struct moved to models/notice.go for dedicated notice & broadcast domain.

// Feedback merepresentasikan aduan atau insiden dari sekolah/siswa
type Feedback struct {
	ID                   string          `json:"id"`
	TicketNumber         string          `json:"ticketNumber"`
	ReportedAt           string          `json:"reportedAt"`
	SchoolNPSN           string          `json:"schoolNpsn"`
	SchoolName           string          `json:"schoolName"`
	SPPGID               string          `json:"sppgId"`
	BatchID              string          `json:"batchId"`
	MenuPackage          string          `json:"menuPackage"`
	Severity             string          `json:"severity"`
	AnomalyType          string          `json:"anomalyType"`
	AffectedPortions     int             `json:"affectedPortions"`
	ReporterName         string          `json:"reporterName"`
	ReporterRole         string          `json:"reporterRole"`
	ReporterPhone        string          `json:"reporterPhone"`
	Title                string          `json:"title"`
	Description          string          `json:"description"`
	Status               string          `json:"status"`
	IsKillSwitchExecuted bool            `json:"isKillSwitchExecuted"`
	EvidencePhotos       json.RawMessage `json:"evidencePhotos"`
	KillSwitchDetails    json.RawMessage `json:"killSwitchDetails"`
	MedicalEscalation    json.RawMessage `json:"medicalEscalation"`
	CreatedAt            time.Time       `json:"createdAt"`
}

// Report merepresentasikan dokumen resmi BAST dan audit
type Report struct {
	ID         string          `json:"id"`
	ReportCode string          `json:"reportCode"`
	Title      string          `json:"title"`
	Period     string          `json:"period"`
	Category   string          `json:"category"`
	AuthorName string          `json:"authorName"`
	Status     string          `json:"status"`
	FileSize   string          `json:"fileSize"`
	FileFormat string          `json:"fileFormat"`
	KPIMetrics json.RawMessage `json:"kpiMetrics"`
	CreatedAt  time.Time       `json:"createdAt"`
}

// AdminDashboardMetrics merepresentasikan rangkuman telemetri dan KPI nasional
type AdminDashboardMetrics struct {
	TotalPortionsToday  int     `json:"totalPortionsToday"`
	TargetPortionsToday int     `json:"targetPortionsToday"`
	SchoolsServedCount  int     `json:"schoolsServedCount"`
	ActiveKitchensCount int     `json:"activeKitchensCount"`
	OnTimeRate          float64 `json:"onTimeRate"`
	SafetyPassRate      float64 `json:"safetyPassRate"`
	ColdChainSafeRate   float64 `json:"coldChainSafeRate"`
	AvgTempC            float64 `json:"avgTempC"`
	IncidentCount       int     `json:"incidentCount"`
}
