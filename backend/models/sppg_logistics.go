package models

import "time"

// TempReading merepresentasikan titik pembacaan suhu boks pada waktu tertentu.
type TempReading struct {
	T    string  `json:"t"`
	Temp float64 `json:"temp"`
}

// SppgFleet merepresentasikan entitas armada logistik pengantaran MBG.
type SppgFleet struct {
	ID             string        `json:"id"`
	SppgID         string        `json:"sppgId"`
	Plate          string        `json:"plate"`
	Type           string        `json:"type"` // e.g. "Mobil boks insulasi termal"
	Driver         string        `json:"driver"`
	DriverPhone    string        `json:"driverPhone"`
	EmergencyPhone string        `json:"emergencyPhone"`
	SchoolID       string        `json:"schoolId"`
	SchoolName     string        `json:"schoolName"`
	SchoolLat      float64       `json:"schoolLat"`
	SchoolLng      float64       `json:"schoolLng"`
	BatchToken     string        `json:"batchToken"`
	BoxCount       int           `json:"boxCount"`
	DistanceKm     float64       `json:"distanceKm"`
	SpeedKph       int           `json:"speedKph"`
	DepartAt       string        `json:"departAt"` // e.g. "06:45"
	Progress       float64       `json:"progress"` // 0.0 - 1.0
	Status         string        `json:"status"`   // "jalan", "macet", "mogok", "kembali", "siaga", "selesai"
	BoxTempC       float64       `json:"boxTempC"`
	IsBackup       bool          `json:"isBackup"`
	CurrentLat     float64       `json:"currentLat"`
	CurrentLng     float64       `json:"currentLng"`
	TempSeries     []TempReading `json:"tempSeries"`
	DispatchedAt   *time.Time    `json:"dispatchedAt,omitempty"`
	DispatchedBy   string        `json:"dispatchedBy,omitempty"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}

// SppgDeliveryNotification entitas pencatatan pesan/siar estimasi tiba ke sekolah.
type SppgDeliveryNotification struct {
	ID             string    `json:"id"`
	SppgID         string    `json:"sppgId"`
	FleetID        string    `json:"fleetId"`
	SchoolID       string    `json:"schoolId"`
	SchoolName     string    `json:"schoolName"`
	RecipientPhone string    `json:"recipientPhone"`
	Message        string    `json:"message"`
	SentBy         string    `json:"sentBy"`
	SentAt         time.Time `json:"sentAt"`
}

// SppgLogisticsStats metrik ringkasan armada hari ini.
type SppgLogisticsStats struct {
	Moving int `json:"moving"`
	Total  int `json:"total"`
	OnTime int `json:"onTime"`
	Issues int `json:"issues"`
	Cold   int `json:"cold"`
}

// DepotInfo titik koordinat dapur SPPG pengirim.
type DepotInfo struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

// SchoolCoord koordinat sekolah binaan.
type SchoolCoord struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

// SppgLogisticsBundle muatan terpadu untuk tampilan /sppg/logistics.
type SppgLogisticsBundle struct {
	SppgID          string              `json:"sppgId"`
	KitchenName     string              `json:"kitchenName"`
	KitchenCode     string              `json:"kitchenCode"`
	Depot           DepotInfo           `json:"depot"`
	LatestArrival   string              `json:"latestArrival"` // "07:15"
	TempFloor       float64             `json:"tempFloor"`     // 60.0
	SessionClock    string              `json:"sessionClock"`  // e.g. "07:02"
	Stats           SppgLogisticsStats  `json:"stats"`
	Fleets          []SppgFleet         `json:"fleets"`
	BackupFleet     *SppgFleet          `json:"backupFleet"`
	SchoolCoords    map[string]SchoolCoord `json:"schoolCoords"`
	ActiveBatches   []string            `json:"activeBatches"`
}

// CreateFleetPayload payload pembuatan armada baru.
type CreateFleetPayload struct {
	Plate          string  `json:"plate"`
	Type           string  `json:"type"`
	Driver         string  `json:"driver"`
	DriverPhone    string  `json:"driverPhone"`
	EmergencyPhone string  `json:"emergencyPhone"`
	SchoolID       string  `json:"schoolId"`
	BatchToken     string  `json:"batchToken"`
	BoxCount       int     `json:"boxCount"`
	DistanceKm     float64 `json:"distanceKm"`
	SpeedKph       int     `json:"speedKph"`
	DepartAt       string  `json:"departAt"`
	BoxTempC       float64 `json:"boxTempC"`
	IsBackup       bool    `json:"isBackup"`
}

// UpdateFleetTelemetryPayload pembaruan live laju, progres, dan suhu boks armada.
type UpdateFleetTelemetryPayload struct {
	SpeedKph float64 `json:"speedKph"`
	Progress float64 `json:"progress"`
	Status   string  `json:"status"`
	BoxTempC float64 `json:"boxTempC"`
	TimeTick string  `json:"timeTick"` // e.g. "07:05"
}

// DispatchBackupPayload aksi terjun armada cadangan saat armada utama mogok/macet.
type DispatchBackupPayload struct {
	Reason string `json:"reason,omitempty"`
}

// SendNotificationPayload siar info estimasi tiba ke guru validator.
type SendNotificationPayload struct {
	RecipientPhone string `json:"recipientPhone"`
	Message        string `json:"message"`
}

// SuperadminLogisticsInterventionPayload intervensi darurat rute logistik oleh Superadmin.
type SuperadminLogisticsInterventionPayload struct {
	FleetID string `json:"fleetId"`
	Action  string `json:"action"` // "reroute", "recall", "cooling_check"
	Reason  string `json:"reason"`
}
