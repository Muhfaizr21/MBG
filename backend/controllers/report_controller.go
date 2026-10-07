package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"log"
	"net/http"
)

// ReportController menangani request HTTP untuk katalog laporan resmi, BAST digital, invoice katering, dan audit forensik.
type ReportController struct {
	svc services.ReportService
}

func NewReportController(svc services.ReportService) *ReportController {
	return &ReportController{svc: svc}
}

// GetBundle mengembalikan seluruh bundel data laporan, BAST, invoice, temuan forensik, dan ringkasan eksekutif.
func (c *ReportController) GetBundle(w http.ResponseWriter, r *http.Request) {
	bundle, err := c.svc.GetBundle(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get report bundle: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundel laporan")
		return
	}
	utils.Success(w, http.StatusOK, "Bundel laporan berhasil dimuat", bundle)
}

// ListReports mengembalikan daftar katalog dokumen laporan resmi.
func (c *ReportController) ListReports(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	list, err := c.svc.GetReports(r.Context(), category, search)
	if err != nil {
		log.Printf("[ERROR] Failed to list reports: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat katalog laporan resmi")
		return
	}
	utils.Success(w, http.StatusOK, "Katalog laporan resmi berhasil dimuat", list)
}

// GetReportByID mengembalikan satu dokumen laporan resmi berdasarkan ID.
func (c *ReportController) GetReportByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	report, err := c.svc.GetReportByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Detail laporan resmi berhasil dimuat", report)
}

// CreateReport membuat atau meng-generate laporan resmi baru siap audit.
func (c *ReportController) CreateReport(w http.ResponseWriter, r *http.Request) {
	var req models.CreateReportRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload create report tidak valid: "+err.Error())
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}
	if req.Signee == "" {
		req.Signee = "Satgas MBG Pusat & BGN"
	}

	report, err := c.svc.CreateReport(r.Context(), actorID, &req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Dokumen laporan resmi berhasil di-generate", report)
}

// ListDigitalBasts mengembalikan daftar Berita Acara Serah Terima digital.
func (c *ReportController) ListDigitalBasts(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	basts, err := c.svc.GetDigitalBasts(r.Context(), search)
	if err != nil {
		log.Printf("[ERROR] Failed to list digital BASTs: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar BAST digital")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar BAST digital berhasil dimuat", basts)
}

// GetDigitalBastByID mengembalikan satu Berita Acara Serah Terima digital.
func (c *ReportController) GetDigitalBastByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	bast, err := c.svc.GetDigitalBastByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "BAST digital tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Detail BAST digital berhasil dimuat", bast)
}

// ListVendorInvoices mengembalikan daftar rekapitulasi klaim invoice katering.
func (c *ReportController) ListVendorInvoices(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	invoices, err := c.svc.GetVendorInvoices(r.Context(), search)
	if err != nil {
		log.Printf("[ERROR] Failed to list vendor invoices: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat tagihan vendor")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar tagihan vendor berhasil dimuat", invoices)
}

// GetVendorInvoiceByID mengembalikan satu invoice katering berdasarkan ID.
func (c *ReportController) GetVendorInvoiceByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	inv, err := c.svc.GetVendorInvoiceByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Tagihan vendor tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Detail tagihan vendor berhasil dimuat", inv)
}

// AuthorizePayment memproses otorisasi pembayaran digital dan penerbitan nomor SP2D oleh superadmin.
func (c *ReportController) AuthorizePayment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.AuthorizePaymentRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload otorisasi pembayaran tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}
	actorName := "Bambang Soediro (Superadmin Satgas MBG)"

	inv, err := c.svc.AuthorizePayment(r.Context(), actorID, actorName, id, &req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Otorisasi pembayaran termin berhasil ditandatangani secara digital", inv)
}

// ListForensicFindings mengembalikan daftar temuan audit forensik anggaran.
func (c *ReportController) ListForensicFindings(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	findings, err := c.svc.GetForensicFindings(r.Context(), search)
	if err != nil {
		log.Printf("[ERROR] Failed to list forensic findings: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat temuan audit forensik")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar temuan audit forensik berhasil dimuat", findings)
}

// GetExecutiveStats mengembalikan ringkasan KPI eksekutif laporan & audit.
func (c *ReportController) GetExecutiveStats(w http.ResponseWriter, r *http.Request) {
	stats, err := c.svc.GetExecutiveStats(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get executive stats: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat statistik eksekutif")
		return
	}
	utils.Success(w, http.StatusOK, "Statistik eksekutif berhasil dimuat", stats)
}
