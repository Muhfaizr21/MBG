package models

import (
	"time"
)

// SppgBillingRow entitas baris penagihan porsi per sekolah/BAST (SPPG.md Bab 9).
type SppgBillingRow struct {
	ID            string    `json:"id"`
	SppgID        string    `json:"sppgId"`
	SchoolID      string    `json:"schoolId"`
	SchoolName    string    `json:"schoolName"`
	BastNo        string    `json:"bastNo"`
	BatchToken    string    `json:"batchToken"`
	ValidPortions int       `json:"validPortions"`
	Valid         int       `json:"valid"` // Alias kompatibilitas frontend
	LateMinutes   int       `json:"lateMinutes"`
	InvoiceID     *string   `json:"invoiceId"`
	InvoiceNo     string    `json:"invoiceNo"`
	GrossAmount   int64     `json:"grossAmount"`
	PenaltyAmount int64     `json:"penaltyAmount"`
	NetAmount     int64     `json:"netAmount"`
	IsLate        bool      `json:"isLate"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// SppgInvoice entitas berkas tagihan invoice ke BGN dengan tahapan pencairan SP2D.
type SppgInvoice struct {
	ID                 string    `json:"id"`
	SppgID             string    `json:"sppgId"`
	InvoiceNo          string    `json:"invoiceNo"`
	No                 string    `json:"no"` // Alias kompatibilitas frontend
	PeriodLabel        string    `json:"periodLabel"`
	Period             string    `json:"period"` // Alias kompatibilitas frontend
	Stage              string    `json:"stage"`  // "draft", "verifikasi", "spm", "sp2d"
	Notes              []string  `json:"notes"`
	TaxSlip            string    `json:"taxSlip"`
	SP2DNumber         string    `json:"sp2dNumber"`
	RowCount           int       `json:"rowCount"`
	TotalValidPortions int       `json:"totalValidPortions"`
	GrossAmount        int64     `json:"grossAmount"`
	PenaltyAmount      int64     `json:"penaltyAmount"`
	NetAmount          int64     `json:"netAmount"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// SppgBillingTotals ringkasan kalkulasi keuangan klaim dapur.
type SppgBillingTotals struct {
	Gross        int64 `json:"gross"`
	Penalty      int64 `json:"penalty"`
	Net          int64 `json:"net"`
	Disbursed    int64 `json:"disbursed"`
	TotalRows    int   `json:"totalRows"`
	FreeRows     int   `json:"freeRows"`
	InvoiceCount int   `json:"invoiceCount"`
}

// SppgBillingBundle paket lengkap data klaim penagihan, konfigurasi tarif, dan daftar invoice.
type SppgBillingBundle struct {
	SppgID               string            `json:"sppgId"`
	KitchenName          string            `json:"kitchenName"`
	KitchenCode          string            `json:"kitchenCode"`
	RatePerPortion       int               `json:"ratePerPortion"`
	LateToleranceMinutes int               `json:"lateToleranceMinutes"`
	LatePenaltyPct       int               `json:"latePenaltyPct"`
	InvSeq               int               `json:"invSeq"`
	Totals               SppgBillingTotals `json:"totals"`
	Rows                 []SppgBillingRow  `json:"rows"`
	Invoices             []SppgInvoice     `json:"invoices"`
}

// GenerateInvoicePayload request pembuatan invoice baru dari baris-baris bebas.
type GenerateInvoicePayload struct {
	Period string `json:"period,omitempty"`
}

// AdvanceInvoicePayload request pemajuan tahap invoice.
type AdvanceInvoicePayload struct {
	Stage string `json:"stage,omitempty"`
}

// AttachInvoiceNotesPayload request penambahan lampiran nota belanja bahan baku.
type AttachInvoiceNotesPayload struct {
	Files []string `json:"files"`
}
