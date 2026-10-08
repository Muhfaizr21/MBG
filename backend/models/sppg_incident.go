package models

import (
	"time"
)

// SppgIncidentResponse pesan tanggapan dan tindakan mitigasi dapur.
type SppgIncidentResponse struct {
	At   string `json:"at"`
	By   string `json:"by"`
	Text string `json:"text"`
}

// SppgIncidentTicket entitas tiket aduan / laporan kendala makanan dari sekolah.
type SppgIncidentTicket struct {
	ID             string                 `json:"id"`
	SppgID         string                 `json:"sppgId"`
	SchoolID       string                 `json:"schoolId"`
	SchoolName     string                 `json:"schoolName"`
	BatchToken     string                 `json:"batchToken"`
	Level          int                    `json:"level"` // 1: Kritis, 2: Sedang, 3: Rendah
	Category       string                 `json:"category"`
	Message        string                 `json:"message"`
	CreatedAtClock string                 `json:"createdAt"` // misal "07:40"
	Status         string                 `json:"status"`    // "baru", "ditangani", "selesai"
	Responses      []SppgIncidentResponse `json:"responses"`
	Resolution     string                 `json:"resolution"`
	CreatedAt      time.Time              `json:"systemCreatedAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
}

// SppgIncidentRecall entitas karantina darurat batch makanan.
type SppgIncidentRecall struct {
	ID         string    `json:"id"`
	SppgID     string    `json:"sppgId"`
	BatchToken string    `json:"batchToken"`
	Reason     string    `json:"reason"`
	RecalledBy string    `json:"recalledBy"`
	RecalledAt time.Time `json:"recalledAt"`
	Status     string    `json:"status"`
}

// SppgIncidentTotals ringkasan metrik SLA dan insiden dapur.
type SppgIncidentTotals struct {
	Open     int `json:"open"`
	Breached int `json:"breached"`
	Critical int `json:"critical"`
	Recalled int `json:"recalled"`
}

// SppgIncidentBundle paket lengkap data tiket aduan, karantina batch, dan stok cadangan.
type SppgIncidentBundle struct {
	SppgID         string               `json:"sppgId"`
	KitchenName    string               `json:"kitchenName"`
	KitchenCode    string               `json:"kitchenCode"`
	SafetyStock    int                  `json:"safetyStock"`
	SlaMinutes     int                  `json:"slaMinutes"`
	Totals         SppgIncidentTotals   `json:"totals"`
	RecalledTokens []string             `json:"recalledTokens"`
	Tickets        []SppgIncidentTicket `json:"tickets"`
}

// ReplyTicketPayload tanggapan tertulis dan hasil uji sampel dapur.
type ReplyTicketPayload struct {
	Text string `json:"text"`
}

// ReplaceTicketPortionsPayload pengiriman boks pengganti kilat dari stok cadangan dapur.
type ReplaceTicketPortionsPayload struct {
	Boxes int `json:"boxes"`
}

// RecallBatchPayload isolasi/karantina seluruh sekolah penerima batch token darurat.
type RecallBatchPayload struct {
	BatchToken string `json:"batchToken,omitempty"`
	Reason     string `json:"reason,omitempty"`
}

// CloseTicketPayload penutupan tiket bersama Satgas MBG dengan bukti penyelesaian.
type CloseTicketPayload struct {
	Resolution string `json:"resolution"`
}

// CreateIncidentTicketPayload pelaporan insiden baru oleh guru validator atau sistem.
type CreateIncidentTicketPayload struct {
	SchoolID       string `json:"schoolId,omitempty"`
	SchoolName     string `json:"schoolName"`
	BatchToken     string `json:"batchToken"`
	Level          int    `json:"level"`
	Category       string `json:"category"`
	Message        string `json:"message"`
	CreatedAtClock string `json:"createdAt,omitempty"`
}
