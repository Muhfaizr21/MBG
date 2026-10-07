package models

import (
	"encoding/json"
	"time"
)

// OfficialReport merepresentasikan berkas dokumen resmi akuntabilitas MBG
type OfficialReport struct {
	ID           string          `json:"id"`
	Code         string          `json:"code"`
	Title        string          `json:"title"`
	Category     string          `json:"category"`
	CategoryLabel string         `json:"categoryLabel"`
	Period       string          `json:"period"`
	Scope        string          `json:"scope"`
	GeneratedAt  string          `json:"generatedAt"`
	TotalPortions int            `json:"totalPortions"`
	SuccessRate  float64         `json:"successRate"`
	FileFormats  []string        `json:"fileFormats"`
	FileSizePdf  string          `json:"fileSizePdf"`
	FileSizeXlsx string          `json:"fileSizeXlsx"`
	FileSizeCsv  string          `json:"fileSizeCsv"`
	Description  string          `json:"description"`
	Signee       string          `json:"signee"`
	AuditBadge   string          `json:"auditBadge"`
	AuthorName   string          `json:"authorName"`
	Status       string          `json:"status"`
	KPIMetrics   json.RawMessage `json:"kpiMetrics,omitempty"`
	CreatedAt    time.Time       `json:"createdAt"`
}

// DigitalBast merepresentasikan Berita Acara Serah Terima digital
type DigitalBast struct {
	ID                     string    `json:"id"`
	RefNumber              string    `json:"refNumber"`
	Date                   string    `json:"date"`
	DeliveryTime           string    `json:"deliveryTime"`
	SchoolName             string    `json:"schoolName"`
	NPSN                   string    `json:"npsn"`
	SPPGName               string    `json:"sppgName"`
	SPPGID                 string    `json:"sppgId"`
	MenuPackage            string    `json:"menuPackage"`
	OrderedPortions        int       `json:"orderedPortions"`
	VerifiedAiPortions     int       `json:"verifiedAiPortions"`
	RejectedPortions       int       `json:"rejectedPortions"`
	ThermalTempArrive      string    `json:"thermalTempArrive"`
	LeadValidator          string    `json:"leadValidator"`
	DriverName             string    `json:"driverName"`
	Sha256Hash             string    `json:"sha256Hash"`
	QrTokenVerified        bool      `json:"qrTokenVerified"`
	BsreStatus             string    `json:"bsreStatus"`
	PaymentClearanceStatus string    `json:"paymentClearanceStatus"`
	PaymentClearanceLabel  string    `json:"paymentClearanceLabel"`
	SubtotalAmount         int64     `json:"subtotalAmount"`
	ApprovalNotes          string    `json:"approvalNotes"`
	CreatedAt              time.Time `json:"createdAt"`
}

// VendorInvoice merepresentasikan rekapitulasi klaim tagihan katering SPPG
type VendorInvoice struct {
	ID                       string    `json:"id"`
	InvoiceNumber            string    `json:"invoiceNumber"`
	SPPGName                 string    `json:"sppgName"`
	SPPGID                   string    `json:"sppgId"`
	VendorCompany            string    `json:"vendorCompany"`
	BankAccount              string    `json:"bankAccount"`
	Period                   string    `json:"period"`
	TotalClaimedPortions     int       `json:"totalClaimedPortions"`
	TotalClaimedAmount       int64     `json:"totalClaimedAmount"`
	VerifiedBastPortions     int       `json:"verifiedBastPortions"`
	RejectedDeductionPortions int      `json:"rejectedDeductionPortions"`
	PenaltyDeductionAmount   int64     `json:"penaltyDeductionAmount"`
	ApprovedPaymentAmount    int64     `json:"approvedPaymentAmount"`
	BastCompletenessRate     float64   `json:"bastCompletenessRate"`
	Status                   string    `json:"status"`
	StatusLabel              string    `json:"statusLabel"`
	Sp2dNumber               *string   `json:"sp2dNumber"`
	Notes                    string    `json:"notes"`
	SignedAt                 *string   `json:"signedAt"`
	SignedBy                 *string   `json:"signedBy"`
	CreatedAt                time.Time `json:"createdAt"`
}

// ForensicAuditFinding merepresentasikan temuan anomali audit forensik anggaran
type ForensicAuditFinding struct {
	ID                  string    `json:"id"`
	InvoiceRef          string    `json:"invoiceRef"`
	SPPGName            string    `json:"sppgName"`
	DateLogged          string    `json:"dateLogged"`
	FindingType         string    `json:"findingType"`
	FindingTypeLabel    string    `json:"findingTypeLabel"`
	ClaimedPortions     int       `json:"claimedPortions"`
	AiValidPortions     int       `json:"aiValidPortions"`
	DiscrepancyCount    int       `json:"discrepancyCount"`
	PotentialLossAmount int64     `json:"potentialLossAmount"`
	Severity            string    `json:"severity"`
	SeverityLabel       string    `json:"severityLabel"`
	Explanation         string    `json:"explanation"`
	ActionTaken         string    `json:"actionTaken"`
	Status              string    `json:"status"`
	StatusLabel         string    `json:"statusLabel"`
	CreatedAt           time.Time `json:"createdAt"`
}

// ReportExecutiveStats merepresentasikan ringkasan eksekutif KPI laporan
type ReportExecutiveStats struct {
	TotalReportsCount     int     `json:"totalReportsCount"`
	ValidBastCount        int     `json:"validBastCount"`
	TotalApprovedMoney    float64 `json:"totalApprovedMoney"`    // Dalam Miliar Rupiah
	TotalSafeguardedMoney float64 `json:"totalSafeguardedMoney"` // Dalam Juta Rupiah
	TotalApprovedExact    int64   `json:"totalApprovedExact"`
	TotalSafeguardedExact int64   `json:"totalSafeguardedExact"`
}

// ReportsBundle merepresentasikan seluruh set data laporan untuk dashboard
type ReportsBundle struct {
	Reports          []OfficialReport       `json:"reports"`
	BastList         []DigitalBast          `json:"bastList"`
	Invoices         []VendorInvoice        `json:"invoices"`
	ForensicFindings []ForensicAuditFinding `json:"forensicFindings"`
	Stats            ReportExecutiveStats   `json:"stats"`
}

// CreateReportRequest payload untuk generate laporan kustom baru
type CreateReportRequest struct {
	Title    string `json:"title"`
	Category string `json:"category"`
	Period   string `json:"period"`
	Scope    string `json:"scope"`
	Format   string `json:"format"`
	Signee   string `json:"signee"`
}

// AuthorizePaymentRequest payload untuk otorisasi dan penerbitan SP2D
type AuthorizePaymentRequest struct {
	Sp2dNumber string `json:"sp2dNumber"`
	Notes      string `json:"notes"`
	SignerRole string `json:"signerRole"`
}
