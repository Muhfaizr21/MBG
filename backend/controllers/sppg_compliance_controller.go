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

// SppgComplianceController menangani seluruh request HTTP sertifikasi akreditasi, sanitasi, dan uji lab SPPG.
type SppgComplianceController struct {
	complianceSvc services.SppgComplianceService
}

// NewSppgComplianceController membuat instance controller compliance baru (Constructor DI).
func NewSppgComplianceController(complianceSvc services.SppgComplianceService) *SppgComplianceController {
	return &SppgComplianceController{complianceSvc: complianceSvc}
}

func (c *SppgComplianceController) resolveSppgID(r *http.Request) string {
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

// GetBundle mengambil bundle terpadu legalitas dokumen, penjamah makanan, uji lab, dan permohonan audit
func (c *SppgComplianceController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.complianceSvc.GetBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle sertifikasi & sanitasi: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle sertifikasi & sanitasi berhasil dimuat", bundle)
}

// ListDocs mengambil daftar dokumen akreditasi dapur
func (c *SppgComplianceController) ListDocs(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	docs, err := c.complianceSvc.ListDocs(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat dokumen akreditasi: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar dokumen akreditasi berhasil dimuat", docs)
}

// RenewDoc memperbarui masa berlaku dokumen sertifikasi akreditasi
func (c *SppgComplianceController) RenewDoc(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.RenewComplianceDocPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload perpanjangan tidak valid: "+err.Error())
		return
	}

	doc, err := c.complianceSvc.RenewDoc(r.Context(), sppgID, payload.DocID, payload.Expiry, payload.FileName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Dokumen akreditasi berhasil diperpanjang", doc)
}

// ListHandlers mengambil daftar tenaga penjamah makanan
func (c *SppgComplianceController) ListHandlers(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	handlers, err := c.complianceSvc.ListHandlers(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat staf penjamah makanan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar penjamah makanan berhasil dimuat", handlers)
}

// CreateHandler mendaftarkan staf penjamah makanan baru
func (c *SppgComplianceController) CreateHandler(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateComplianceHandlerPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload staf tidak valid: "+err.Error())
		return
	}

	handler, err := c.complianceSvc.CreateHandler(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Staf penjamah makanan berhasil didaftarkan", handler)
}

// ListLabs mengambil riwayat pengujian laboratorium mikrobiologi dan air
func (c *SppgComplianceController) ListLabs(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	labs, err := c.complianceSvc.ListLabs(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat riwayat uji lab: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar hasil uji lab berhasil dimuat", labs)
}

// CreateLab mencatat hasil pengujian laboratorium baru
func (c *SppgComplianceController) CreateLab(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateComplianceLabPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload uji lab tidak valid: "+err.Error())
		return
	}

	lab, err := c.complianceSvc.CreateLab(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Hasil uji lab berhasil dicatat", lab)
}

// ListAudits mengambil daftar permohonan audit dan sidak Dinkes
func (c *SppgComplianceController) ListAudits(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	audits, err := c.complianceSvc.ListAudits(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat permohonan audit: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar permohonan audit berhasil dimuat", audits)
}

// RequestAudit mengajukan permohonan audit berkala ke Dinkes setempat
func (c *SppgComplianceController) RequestAudit(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.RequestComplianceAuditPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload permohonan audit tidak valid: "+err.Error())
		return
	}

	audit, err := c.complianceSvc.RequestAudit(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Permohonan audit berhasil diajukan ke Dinkes", audit)
}
