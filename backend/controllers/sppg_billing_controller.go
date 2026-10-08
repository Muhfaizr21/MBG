package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"encoding/json"
	"net/http"
	"strings"
)

// SppgBillingController menangani seluruh request HTTP klaim & penagihan invoice SPPG ke BGN.
type SppgBillingController struct {
	billingSvc services.SppgBillingService
}

// NewSppgBillingController membuat instance controller penagihan baru (Constructor DI).
func NewSppgBillingController(billingSvc services.SppgBillingService) *SppgBillingController {
	return &SppgBillingController{billingSvc: billingSvc}
}

func (c *SppgBillingController) resolveSppgID(r *http.Request) string {
	role := middlewares.Role(r.Context())
	callerSppg := middlewares.SppgID(r.Context())

	// Staf SPPG dikunci hanya ke dapurnya sendiri sesuai database
	if role == models.RoleSppg && callerSppg != "" {
		return callerSppg
	}

	// Superadmin dapat menginspeksi dapur manapun via query parameter ?sppgId=SPPG-XX
	if role == models.RoleSuperadmin {
		if querySppg := strings.TrimSpace(r.URL.Query().Get("sppgId")); querySppg != "" {
			return querySppg
		}
		if callerSppg != "" {
			return callerSppg
		}
		return "SPPG-01"
	}

	if callerSppg != "" {
		return callerSppg
	}

	if querySppg := strings.TrimSpace(r.URL.Query().Get("sppgId")); querySppg != "" {
		return querySppg
	}

	return "SPPG-01"
}

// GetBundle mengambil bundle lengkap data penagihan, total finansial, dan seluruh invoice
func (c *SppgBillingController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.billingSvc.GetBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle penagihan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle penagihan berhasil dimuat", bundle)
}

// ListRows mengambil seluruh baris rekonsiliasi porsi dan penalti keterlambatan
func (c *SppgBillingController) ListRows(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	rows, err := c.billingSvc.ListRows(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat baris penagihan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Baris penagihan berhasil dimuat", rows)
}

// ListInvoices mengambil daftar berkas invoice SPPG
func (c *SppgBillingController) ListInvoices(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	invoices, err := c.billingSvc.ListInvoices(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar invoice: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar invoice berhasil dimuat", invoices)
}

// GetInvoice mengambil detail spesifik satu invoice beserta rincian barisnya
func (c *SppgBillingController) GetInvoice(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID invoice wajib diisi")
		return
	}

	invoice, rows, err := c.billingSvc.GetInvoice(r.Context(), sppgID, id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Detail invoice berhasil dimuat", map[string]interface{}{
		"invoice": invoice,
		"rows":    rows,
	})
}

// GenerateInvoice membuat invoice baru secara atomik dari baris-baris bebas
func (c *SppgBillingController) GenerateInvoice(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.GenerateInvoicePayload
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&payload)
	}

	invoice, err := c.billingSvc.GenerateInvoice(r.Context(), sppgID, payload.Period)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Invoice berhasil dibuat dari baris bebas", invoice)
}

// AdvanceInvoice memajukan alur status invoice (draft -> verifikasi -> spm -> sp2d)
func (c *SppgBillingController) AdvanceInvoice(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID invoice wajib diisi")
		return
	}

	var payload models.AdvanceInvoicePayload
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&payload)
	}

	invoice, err := c.billingSvc.AdvanceInvoice(r.Context(), sppgID, id, payload.Stage)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Tahap invoice berhasil dimajukan", invoice)
}

// AttachNotes melampirkan berkas nota belanja bahan baku ke invoice
func (c *SppgBillingController) AttachNotes(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID invoice wajib diisi")
		return
	}

	var payload models.AttachInvoiceNotesPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload nota tidak valid: "+err.Error())
		return
	}

	invoice, err := c.billingSvc.AttachNotes(r.Context(), sppgID, id, payload.Files)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Lampiran nota belanja berhasil diperbarui", invoice)
}
