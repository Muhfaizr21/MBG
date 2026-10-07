package models

import (
	"encoding/json"
	"time"
)

// FleetInfo telemetri dan status operasional armada pengantaran logistik MBG.
type FleetInfo struct {
	VehicleID        string  `json:"vehicleId"`
	PlateNumber      string  `json:"plateNumber"`
	DriverName       string  `json:"driverName"`
	DriverPhone      string  `json:"driverPhone"`
	VehicleType      string  `json:"vehicleType"`
	Status           string  `json:"status"` // moving | stuck | breakdown | delivered
	CurrentSpeed     string  `json:"currentSpeed"`
	CargoTempCelsius float64 `json:"cargoTempCelsius"`
	LastGpsPing      string  `json:"lastGpsPing"`
	GpsLocation      string  `json:"gpsLocation"`
}

// ScheduleTimestamps riwayat waktu proses memasak hingga kedatangan di gerbang sekolah.
type ScheduleTimestamps struct {
	CookingStart      string  `json:"cookingStart"`
	CookingDone       string  `json:"cookingDone"`
	DepartedAt        string  `json:"departedAt"`
	TargetArrival     string  `json:"targetArrival"`
	CurrentEta        string  `json:"currentEta"`
	ActualArrival     *string `json:"actualArrival"`
	DelayMinutes      int     `json:"delayMinutes"`
	RescheduledReason *string `json:"rescheduledReason"`
}

// ScheduleSPPGSupplier profil dapur SPPG penyuplai untuk jadwal rute ini.
type ScheduleSPPGSupplier struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Address string `json:"address"`
}

// ScheduleValidatorContact narahubung guru validator penerima di sekolah.
type ScheduleValidatorContact struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

// Schedule merepresentasikan data jadwal distribusi makanan bergizi gratis dan armada cold-chain.
type Schedule struct {
	ID                  string                   `json:"id"`
	SchoolID            string                   `json:"schoolId"`
	SchoolName          string                   `json:"schoolName"`
	NPSN                string                   `json:"npsn"`
	City                string                   `json:"city"`
	Portions            int                      `json:"portions"`
	SPPGID              string                   `json:"sppgId"`
	SPPGSupplier        ScheduleSPPGSupplier     `json:"sppgSupplier"`
	Fleet               FleetInfo                `json:"fleet"`
	Timestamps          ScheduleTimestamps       `json:"timestamps"`
	Status              string                   `json:"status"` // on_time | arrived | delayed_traffic | fleet_breakdown | rescheduled
	StatusLabel         string                   `json:"statusLabel"`
	StatusReason        string                   `json:"statusReason"`
	CorridorName        string                   `json:"corridorName"`
	DistanceRemainingKm float64                  `json:"distanceRemainingKm"`
	ValidatorContact    ScheduleValidatorContact `json:"validatorContact"`
	CreatedAt           time.Time                `json:"createdAt"`
	UpdatedAt           time.Time                `json:"updatedAt"`

	// Backward compatibility fields with legacy portal models
	RouteName     string          `json:"routeName,omitempty"`
	FleetName     string          `json:"fleetName,omitempty"`
	LicensePlate  string          `json:"licensePlate,omitempty"`
	DriverName    string          `json:"driverName,omitempty"`
	DriverPhone   string          `json:"driverPhone,omitempty"`
	DepartureTime string          `json:"departureTime,omitempty"`
	ArrivalETA    string          `json:"arrivalEta,omitempty"`
	TotalPortions int             `json:"totalPortions,omitempty"`
	TargetSchools json.RawMessage `json:"targetSchools,omitempty"`
	Telemetry     json.RawMessage `json:"telemetry,omitempty"`
}

// BackupFleet merepresentasikan armada cadangan yang siaga di pool wilayah.
type BackupFleet struct {
	VehicleID        string `json:"vehicleId"`
	PlateNumber      string `json:"plateNumber"`
	DriverName       string `json:"driverName"`
	Phone            string `json:"phone"`
	DepotLocation    string `json:"depotLocation"`
	StandbyCity      string `json:"standbyCity"`
	CapacityPortions int    `json:"capacityPortions"`
	EtaToScene       string `json:"etaToScene"`
}

// RescheduleRequest payload pengajuan / persetujuan jadwal khusus kedatangan.
type RescheduleRequest struct {
	NewTime       string `json:"newTime"`                 // Format: "07:45"
	Reason        string `json:"reason"`                  // Alasan penyesuaian jadwal
	EffectiveDate string `json:"effectiveDate,omitempty"` // Tanggal berlakunya jadwal khusus
}

// DelayAlertRequest payload siaran peringatan keterlambatan ke sekolah & orang tua.
type DelayAlertRequest struct {
	DelayMinutes  int    `json:"delayMinutes"`
	CustomMessage string `json:"customMessage,omitempty"`
}

// RerouteRequest payload penugasan armada cadangan saat terjadi kendala darurat / mogok.
type RerouteRequest struct {
	BackupFleetID string `json:"backupFleetId"`
	Notes         string `json:"notes"`
}

// ScheduleFilter kriteria filter pencarian rute distribusi.
type ScheduleFilter struct {
	Search string `json:"search"`
	Status string `json:"status"`
	City   string `json:"city"`
	SPPGID string `json:"sppgId"`
}
