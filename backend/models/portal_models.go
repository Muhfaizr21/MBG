package models

import (
	"encoding/json"
	"time"
)

// SPPGKitchen merepresentasikan entitas dapur sentral atau rekanan MBG
type SPPGKitchen struct {
	ID               string    `json:"id"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	LegalEntity      string    `json:"legalEntity"`
	Type             string    `json:"type"`
	TypeLabel        string    `json:"typeLabel"`
	Address          string    `json:"address"`
	Subdistrict      string    `json:"subdistrict"`
	City             string    `json:"city"`
	Province         string    `json:"province"`
	Cluster          string    `json:"cluster"`
	Coordinates      string    `json:"coordinates"`
	ManagerName      string    `json:"managerName"`
	ManagerNIP       string    `json:"managerNip"`
	ManagerPhone     string    `json:"managerPhone"`
	NutritionistName string    `json:"nutritionistName"`
	NutritionistSTR  string    `json:"nutritionistStr"`
	StaffCount       int       `json:"staffCount"`
	KitchenArea      string    `json:"kitchenArea"`
	FleetCount       int       `json:"fleetCount"`
	FleetType        string    `json:"fleetType"`
	MaxDailyPortions int       `json:"maxDailyPortions"`
	ActiveQuota      int       `json:"activeQuota"`
	SafetyScore      float64   `json:"safetyScore"`
	ColdChainScore   float64   `json:"coldChainScore"`
	TimelinessScore  float64   `json:"timelinessScore"`
	CompositeScore   float64   `json:"compositeScore"`
	Grade            string    `json:"grade"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// School merepresentasikan data sekolah binaan penerima MBG
type School struct {
	NPSN               string    `json:"npsn"`
	ID                 string    `json:"id"`
	Name               string    `json:"name"`
	Level              string    `json:"level"`
	Status             string    `json:"status"`
	StatusLabel        string    `json:"statusLabel"`
	StatusReason       string    `json:"statusReason"`
	Address            string    `json:"address"`
	City               string    `json:"city"`
	District           string    `json:"district"`
	Lat                float64   `json:"lat"`
	Lng                float64   `json:"lng"`
	PrincipalName      string    `json:"principalName"`
	PrincipalNIP       string    `json:"principalNip"`
	PrincipalPhone     string    `json:"principalPhone"`
	PrincipalEmail     string    `json:"principalEmail"`
	TotalStudents      int       `json:"totalStudents"`
	TotalCalorieTarget int       `json:"totalCalorieTarget"`
	DietaryNotes       string    `json:"dietaryNotes"`
	SPPGID             string    `json:"sppgId"`
	AcceptanceRate     float64   `json:"acceptanceRate"`
	AvgArrivalTime     string    `json:"avgArrivalTime"`
	CreatedAt          time.Time `json:"createdAt"`
}

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

// CalendarDay merepresentasikan kalender operasional menu harian
type CalendarDay struct {
	Date           string       `json:"date"`
	PackageID      string       `json:"packageId"`
	DayName        string       `json:"dayName"`
	WeekNumber     int          `json:"weekNumber"`
	DayType        string       `json:"dayType"`
	Status         string       `json:"status"`
	Theme          string       `json:"theme"`
	Notes          string       `json:"notes"`
	TargetPortions int          `json:"targetPortions"`
	Package        *MenuPackage `json:"package,omitempty"`
}

// Delivery merepresentasikan hasil pengiriman boks makanan & hasil YOLOv8
type Delivery struct {
	ID             string    `json:"id"`
	BatchID        string    `json:"batchId"`
	SPPGID         string    `json:"sppgId"`
	SchoolNPSN     string    `json:"schoolNpsn"`
	SchoolName     string    `json:"schoolName,omitempty"`
	ValidatorName  string    `json:"validatorName"`
	ScannedAt      string    `json:"scannedAt"`
	ScanDate       string    `json:"scanDate"`
	Portions       int       `json:"portions"`
	TargetPortions int       `json:"targetPortions"`
	TempC          float64   `json:"tempC"`
	TempStatus     string    `json:"tempStatus"`
	QRToken        string    `json:"qrToken"`
	QRStatus       string    `json:"qrStatus"`
	CryptoHash     string    `json:"cryptoHash"`
	MenuName       string    `json:"menuName"`
	AIVerdict      string    `json:"aiVerdict"`
	AIScore        float64   `json:"aiScore"`
	ImageURL       string    `json:"imageUrl"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Schedule merepresentasikan jadwal dan armada rute distribusi
type Schedule struct {
	ID             string          `json:"id"`
	SPPGID         string          `json:"sppgId"`
	RouteName      string          `json:"routeName"`
	FleetName      string          `json:"fleetName"`
	LicensePlate   string          `json:"licensePlate"`
	DriverName     string          `json:"driverName"`
	DriverPhone    string          `json:"driverPhone"`
	DepartureTime  string          `json:"departureTime"`
	ArrivalETA     string          `json:"arrivalEta"`
	TotalPortions  int             `json:"totalPortions"`
	Status         string          `json:"status"`
	TargetSchools  json.RawMessage `json:"targetSchools"`
	Telemetry      json.RawMessage `json:"telemetry"`
	CreatedAt      time.Time       `json:"createdAt"`
}

// Attendance merepresentasikan rekonsiliasi kehadiran siswa dan porsi
type Attendance struct {
	ID                   string    `json:"id"`
	SchoolNPSN           string    `json:"schoolNpsn"`
	SchoolName           string    `json:"schoolName,omitempty"`
	Date                 string    `json:"date"`
	RegisteredStudents   int       `json:"registeredStudents"`
	PresentStudents      int       `json:"presentStudents"`
	DeliveredPortions    int       `json:"deliveredPortions"`
	ConsumedPortions     int       `json:"consumedPortions"`
	SurplusPortions      int       `json:"surplusPortions"`
	SurplusStatus        string    `json:"surplusStatus"`
	AttendanceRate       float64   `json:"attendanceRate"`
	FinishRate           float64   `json:"finishRate"`
	ReconciliationStatus string    `json:"reconciliationStatus"`
	TargetTomorrowQuota  int       `json:"targetTomorrowQuota"`
	Notes                string    `json:"notes"`
	CreatedAt            time.Time `json:"createdAt"`
}

// Notice merepresentasikan surat edaran dan pengumuman Satgas MBG
type Notice struct {
	ID                     string          `json:"id"`
	RefNumber              string          `json:"refNumber"`
	Title                  string          `json:"title"`
	Category               string          `json:"category"`
	Urgency                string          `json:"urgency"`
	TargetAudience         string          `json:"targetAudience"`
	ScopeRegion            string          `json:"scopeRegion"`
	PublishedAt            string          `json:"publishedAt"`
	EffectiveDate          string          `json:"effectiveDate"`
	AuthorName             string          `json:"authorName"`
	AuthorRole             string          `json:"authorRole"`
	Content                string          `json:"content"`
	IsFlashAlert           bool            `json:"isFlashAlert"`
	RequiresAcknowledgement bool            `json:"requiresAcknowledgement"`
	Attachments            json.RawMessage `json:"attachments"`
	CreatedAt              time.Time       `json:"createdAt"`
}

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

// ValidatorProfile merepresentasikan audit profil validator sekolah
type ValidatorProfile struct {
	ID            string          `json:"id"`
	UserID        string          `json:"userId"`
	SatgasID      string          `json:"satgasId"`
	Name          string          `json:"name"`
	NIP           string          `json:"nip"`
	NPSN          string          `json:"npsn"`
	SchoolName    string          `json:"schoolName,omitempty"`
	Role          string          `json:"role"`
	Device        string          `json:"device"`
	DeviceID      string          `json:"deviceId"`
	Certification string          `json:"certification"`
	Status        string          `json:"status"`
	ScansToday    int             `json:"scansToday"`
	QuotaToday    int             `json:"quotaToday"`
	ScanLogs      json.RawMessage `json:"scanLogs"`
	CreatedAt     time.Time       `json:"createdAt"`
}

// AdminDashboardMetrics merepresentasikan rangkuman telemetri dan KPI nasional
type AdminDashboardMetrics struct {
	TotalPortionsToday int     `json:"totalPortionsToday"`
	TargetPortionsToday int    `json:"targetPortionsToday"`
	SchoolsServedCount int     `json:"schoolsServedCount"`
	ActiveKitchensCount int    `json:"activeKitchensCount"`
	OnTimeRate         float64 `json:"onTimeRate"`
	SafetyPassRate     float64 `json:"safetyPassRate"`
	ColdChainSafeRate  float64 `json:"coldChainSafeRate"`
	AvgTempC           float64 `json:"avgTempC"`
	IncidentCount      int     `json:"incidentCount"`
}
