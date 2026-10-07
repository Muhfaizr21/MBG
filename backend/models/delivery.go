package models

import "time"

// Delivery merepresentasikan telemetri pengiriman makanan, porsi, suhu, dan verifikasi AI YOLOv8.
type Delivery struct {
	ID             string     `json:"id"`
	BatchID        string     `json:"batchId"`
	SPPGID         string     `json:"sppgId"`
	SPPGName       string     `json:"sppgName,omitempty"`
	SPPGCode       string     `json:"sppgCode,omitempty"`
	SchoolNPSN     string     `json:"schoolNpsn"`
	SchoolName     string     `json:"schoolName,omitempty"`
	City           string     `json:"city,omitempty"`
	District       string     `json:"district,omitempty"`
	ValidatorName  string     `json:"validatorName"`
	ScannedAt      string     `json:"scannedAt"`
	ScanDate       string     `json:"scanDate"`
	Portions       int        `json:"portions"`
	TargetPortions int        `json:"targetPortions"`
	TempC          float64    `json:"tempC"`
	TempStatus     string     `json:"tempStatus"`
	QRToken        string     `json:"qrToken"`
	QRStatus       string     `json:"qrStatus"`
	CryptoHash     string     `json:"cryptoHash"`
	MenuName       string     `json:"menuName"`
	AIVerdict      string     `json:"aiVerdict"`
	AIScore        float64    `json:"aiScore"`
	ImageURL       string     `json:"imageUrl"`
	Status         string     `json:"status"`
	OverrideBy     string     `json:"overrideBy,omitempty"`
	OverrideReason string     `json:"overrideReason,omitempty"`
	OverriddenAt   *time.Time `json:"overriddenAt,omitempty"`
	LabTarget      string     `json:"labTarget,omitempty"`
	LabNotes       string     `json:"labNotes,omitempty"`
	LabOrderedAt   *time.Time `json:"labOrderedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// OverrideDeliveryAIRequest permintaan superadmin untuk mengesahkan hidangan secara manual.
type OverrideDeliveryAIRequest struct {
	Reason      string `json:"reason"`
	AuditorName string `json:"auditorName"`
}

// OrderDeliveryLabTestRequest permintaan uji petik sampel makanan ke laboratorium Dinkes.
type OrderDeliveryLabTestRequest struct {
	LabTarget    string `json:"labTarget"`
	DinkesOffice string `json:"dinkesOffice"`
	Notes        string `json:"notes"`
}
