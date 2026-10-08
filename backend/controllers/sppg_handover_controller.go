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

// SppgHandoverController menangani seluruh request HTTP serah terima boks makanan & BAST digital SPPG.
type SppgHandoverController struct {
	handoverSvc services.SppgHandoverService
}

// NewSppgHandoverController membuat instance controller serah terima baru (Constructor DI).
func NewSppgHandoverController(handoverSvc services.SppgHandoverService) *SppgHandoverController {
	return &SppgHandoverController{handoverSvc: handoverSvc}
}

func (c *SppgHandoverController) resolveSppgID(r *http.Request) string {
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

// GetBundle mengambil bundle lengkap data serah terima, total porsi, dan stok cadangan dapur
func (c *SppgHandoverController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.handoverSvc.GetBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle serah terima: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle serah terima berhasil dimuat", bundle)
}

// ListHandovers mengambil daftar seluruh sesi serah terima boks makanan SPPG
func (c *SppgHandoverController) ListHandovers(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	handovers, err := c.handoverSvc.ListHandovers(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar serah terima: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar serah terima berhasil dimuat", handovers)
}

// GetHandover mengambil detail satu sesi serah terima boks makanan
func (c *SppgHandoverController) GetHandover(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	handover, err := c.handoverSvc.GetHandover(r.Context(), id, sppgID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Detail serah terima berhasil dimuat", handover)
}

// AdvanceStage memperbarui status alur serah terima (misal: tiba, memindai)
func (c *SppgHandoverController) AdvanceStage(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")

	var payload models.AdvanceStagePayload
	if r.Body != nil && r.ContentLength > 0 {
		_ = json.NewDecoder(r.Body).Decode(&payload)
	}

	updated, err := c.handoverSvc.AdvanceStage(r.Context(), id, sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Tahap serah terima berhasil dimajukan", updated)
}

// FinishScan menyelesaikan pemindaian boks oleh guru validator
func (c *SppgHandoverController) FinishScan(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")

	var payload models.FinishScanPayload
	if r.Body != nil && r.ContentLength > 0 {
		_ = json.NewDecoder(r.Body).Decode(&payload)
	}

	updated, err := c.handoverSvc.FinishScan(r.Context(), id, sppgID, payload.Perfect)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Pemindaian boks makanan selesai", updated)
}

// RejectBoxes mencatat boks rusak atau anomali oleh guru validator
func (c *SppgHandoverController) RejectBoxes(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")

	var payload models.RejectBoxesPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON boks ditolak tidak valid")
		return
	}

	updated, err := c.handoverSvc.RejectBoxes(r.Context(), id, sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Penolakan boks makanan berhasil dicatat", updated)
}

// ReplaceRejected mengirim boks pengganti langsung dari safety stock dapur
func (c *SppgHandoverController) ReplaceRejected(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	actorName := middlewares.UserID(r.Context())

	var req models.ReplaceRejectedPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON penggantian tidak valid")
		return
	}

	updated, remainStock, err := c.handoverSvc.ReplaceRejected(r.Context(), id, sppgID, &req, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Boks makanan pengganti berhasil dikirim dari stok cadangan", map[string]any{
		"handover":    updated,
		"safetyStock": remainStock,
	})
}

// SignBast menerbitkan BAST dengan tanda tangan kurir dan validator guru serta stempel SHA-256
func (c *SppgHandoverController) SignBast(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	actorName := middlewares.UserID(r.Context())

	var req models.SignBastPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON tanda tangan BAST tidak valid")
		return
	}

	signed, err := c.handoverSvc.SignBast(r.Context(), id, sppgID, &req, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "BAST digital resmi berhasil ditandatangani dan distempel kriptografis", signed)
}
