package models

import (
	"time"
)

// RejectedBoxItem rincian boks makanan yang ditolak oleh guru validator lapangan.
type RejectedBoxItem struct {
	Boxes        int    `json:"boxes"`
	Reason       string `json:"reason"`
	EvidenceName string `json:"evidenceName"`
	EvidenceURL  string `json:"evidenceUrl,omitempty"`
}

// SppgHandover entitas sesi serah terima boks makanan per sekolah binaan.
type SppgHandover struct {
	ID          string            `json:"id"`
	SppgID      string            `json:"sppgId"`
	SchoolID    string            `json:"schoolId"`
	SchoolNpsn  string            `json:"schoolNpsn"`
	SchoolName  string            `json:"schoolName"`
	BatchToken  string            `json:"batchToken"`
	Sent        int               `json:"sent"`
	Scanned     int               `json:"scanned"`
	Accepted    int               `json:"accepted"`
	Stage       string            `json:"stage"` // "menunggu", "tiba", "memindai", "lolos", "hold"
	Rejected    []RejectedBoxItem `json:"rejected"`
	CourierSign string            `json:"courierSign"`
	TeacherSign string            `json:"teacherSign"`
	BastNo      string            `json:"bastNo"`
	BastAt      string            `json:"bastAt"`
	BastHash    string            `json:"bastHash"`
	Date        string            `json:"date"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// SppgHandoverTotals ringkasan statistik serah terima harian.
type SppgHandoverTotals struct {
	Sent     int `json:"sent"`
	Accepted int `json:"accepted"`
	Issued   int `json:"issued"`
	Count    int `json:"count"`
}

// SppgHandoverBundle paket lengkap data serah terima dan stok cadangan dapur.
type SppgHandoverBundle struct {
	SppgID      string             `json:"sppgId"`
	KitchenName string             `json:"kitchenName"`
	KitchenCode string             `json:"kitchenCode"`
	SafetyStock int                `json:"safetyStock"`
	Totals      SppgHandoverTotals `json:"totals"`
	Handovers   []SppgHandover     `json:"handovers"`
}

// AdvanceStagePayload transisi alur serah terima (menunggu -> tiba -> memindai).
type AdvanceStagePayload struct {
	Stage   string `json:"stage,omitempty"`
	Scanned int    `json:"scanned,omitempty"`
}

// FinishScanPayload penyelesaian pemindaian guru.
type FinishScanPayload struct {
	Perfect bool `json:"perfect"`
}

// RejectBoxesPayload pencatatan boks rusak/anomali oleh guru validator.
type RejectBoxesPayload struct {
	Boxes        int    `json:"boxes"`
	Reason       string `json:"reason"`
	EvidenceName string `json:"evidenceName,omitempty"`
	EvidenceURL  string `json:"evidenceUrl,omitempty"`
}

// ReplaceRejectedPayload pengiriman porsi pengganti dari stok cadangan dapur.
type ReplaceRejectedPayload struct {
	RejectIndex int `json:"rejectIndex"`
}

// SignBastPayload penerbitan BAST dengan tanda tangan kurir dan guru validator.
type SignBastPayload struct {
	Courier string `json:"courier"`
	Teacher string `json:"teacher"`
}
