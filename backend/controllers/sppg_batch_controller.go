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

// SppgBatchController menangani HTTP request untuk batch masak, kontrol suhu HACCP, pencetakan QR thermal, dan karantina Superadmin.
type SppgBatchController struct {
	batchSvc services.SppgBatchService
}

// NewSppgBatchController membuat instance controller baru via Constructor DI.
func NewSppgBatchController(batchSvc services.SppgBatchService) *SppgBatchController {
	return &SppgBatchController{batchSvc: batchSvc}
}

// resolveSppgID mengekstrak identitas SPPG dengan proteksi multi-tenant ketat.
func (c *SppgBatchController) resolveSppgID(r *http.Request) string {
	role := middlewares.Role(r.Context())
	callerSppg := middlewares.SppgID(r.Context())

	// Superadmin berwenang menginspeksi dapur mana pun via query param ?sppgId=SPPG-02
	if role == models.RoleSuperadmin {
		if querySppg := strings.TrimSpace(r.URL.Query().Get("sppgId")); querySppg != "" {
			return querySppg
		}
	}

	// Untuk staf SPPG, kunci mutlak ke SPPG miliknya (mencegah BOLA/IDOR)
	if callerSppg != "" {
		return callerSppg
	}

	if querySppg := strings.TrimSpace(r.URL.Query().Get("sppgId")); querySppg != "" {
		return querySppg
	}

	// Fallback dev default jika akun belum memiliki SPPG ID terikat
	return "SPPG-01"
}

// GetBundle godoc
// @Summary Mengambil bundle lengkap data /sppg/batches untuk dapur aktif (batches, metrik, sekolah sasaran, paket menu)
// @Produce json
// @Success 200 {object} utils.APIResponse{data=models.SppgBatchBundle}
func (c *SppgBatchController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.batchSvc.GetBatchBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle batch dapur: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle batch SPPG berhasil dimuat", bundle)
}

// List godoc
// @Summary Mengambil daftar batch masak SPPG aktif
func (c *SppgBatchController) List(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	batches, err := c.batchSvc.ListBatches(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar batch: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar batch berhasil dimuat", batches)
}

// Create godoc
// @Summary Membuat batch masak baru dan meng-generate token QR serta checksum SHA-256
func (c *SppgBatchController) Create(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateBatchPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload batch tidak valid")
		return
	}

	batch, err := c.batchSvc.CreateBatch(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Batch baru dan token QR berhasil digenerate", batch)
}

// UpdateStatus godoc
// @Summary Memperbarui status antrean atau status siap kirim batch
func (c *SppgBatchController) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID batch wajib dicantumkan")
		return
	}

	var payload models.UpdateBatchStatusPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload status tidak valid")
		return
	}

	if err := c.batchSvc.UpdateBatchStatus(r.Context(), id, sppgID, &payload); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Status batch berhasil diperbarui", map[string]string{
		"id":     id,
		"status": payload.Status,
	})
}

// VerifyToken godoc
// @Summary Uji mandiri pemindaian barcode / token QR boks atau kontainer master
func (c *SppgBatchController) VerifyToken(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.VerifyBatchTokenPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload token tidak valid")
		return
	}

	res, err := c.batchSvc.VerifyToken(r.Context(), sppgID, payload.Token)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memverifikasi token: "+err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Hasil verifikasi token QR", res)
}

// Quarantine godoc
// @Summary Tindakan darurat Superadmin: Karantina / Tarik Batch Masak yang gagal standar HACCP
func (c *SppgBatchController) Quarantine(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID batch wajib dicantumkan")
		return
	}

	var payload models.QuarantineBatchPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload alasan karantina tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	actorRole := middlewares.Role(r.Context())
	actorName := "Superadmin BGN"

	batch, err := c.batchSvc.QuarantineBatch(r.Context(), id, payload.Reason, actorID, actorRole, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Batch berhasil dikarantina dan tercatat pada audit log forensik", batch)
}

// Delete godoc
// @Summary Menghapus batch draft sebelum naik antrean
func (c *SppgBatchController) Delete(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID batch wajib dicantumkan")
		return
	}

	if err := c.batchSvc.DeleteBatch(r.Context(), id, sppgID); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Batch draft berhasil dihapus", map[string]string{"id": id})
}
