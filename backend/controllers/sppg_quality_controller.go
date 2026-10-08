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

// SppgQualityController mengelola HTTP request untuk kontrol mutu HACCP, log suhu probe/chiller, rilis organoleptik, dan sampel arsip.
type SppgQualityController struct {
	qualitySvc services.SppgQualityService
}

// NewSppgQualityController membuat instance controller baru via Constructor DI.
func NewSppgQualityController(qualitySvc services.SppgQualityService) *SppgQualityController {
	return &SppgQualityController{qualitySvc: qualitySvc}
}

func (c *SppgQualityController) resolveSppgID(r *http.Request) string {
	role := middlewares.Role(r.Context())
	callerSppg := middlewares.SppgID(r.Context())

	// Jika role adalah SPPG dapur, SELALU gunakan sppg_id resmi dari database akun mereka (isolasi multi-tenant ketat)
	if role == models.RoleSppg && callerSppg != "" {
		return callerSppg
	}

	// Superadmin berwenang menginspeksi kontrol mutu dapur mana pun via query ?sppgId=SPPG-XX
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

// GetBundle godoc
// @Summary Mengambil bundle lengkap data /sppg/quality (log suhu, rilis sensori, sampel arsip, metrik ringkasan)
func (c *SppgQualityController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.qualitySvc.GetQualityBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle mutu HACCP: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle mutu HACCP berhasil dimuat", bundle)
}

// ListTempLogs godoc
// @Summary Mengambil daftar log pengukuran suhu titik kritis CCP
func (c *SppgQualityController) ListTempLogs(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	logs, err := c.qualitySvc.ListTempLogs(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat log suhu: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar log suhu berhasil dimuat", logs)
}

// CreateTempLog godoc
// @Summary Mencatat hasil pengukuran suhu titik kritis CCP (HACCP threshold evaluation)
func (c *SppgQualityController) CreateTempLog(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateTempLogPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload pengukuran tidak valid")
		return
	}

	log, err := c.qualitySvc.CreateTempLog(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Hasil pengukuran titik kritis CCP berhasil dicatat", log)
}

// ListSignoffs godoc
// @Summary Mengambil riwayat lembar rilis mutu uji sensori
func (c *SppgQualityController) ListSignoffs(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	signoffs, err := c.qualitySvc.ListSignoffs(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat lembar rilis: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar rilis sensori berhasil dimuat", signoffs)
}

// CreateSignoff godoc
// @Summary Menandatangani lembar rilis mutu dan uji organoleptik oleh Ahli Gizi
func (c *SppgQualityController) CreateSignoff(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateSignoffPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload rilis sensori tidak valid")
		return
	}

	signoff, err := c.qualitySvc.CreateSignoff(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Lembar rilis mutu sensori berhasil ditandatangani", signoff)
}

// ListSamples godoc
// @Summary Mengambil daftar sampel arsip pangan di lemari pendingin (retensi 2x24 jam)
func (c *SppgQualityController) ListSamples(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	samples, err := c.qualitySvc.ListSamples(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat sampel arsip: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar sampel arsip pangan berhasil dimuat", samples)
}

// CreateSample godoc
// @Summary Mencatat sampel arsip pangan baru
func (c *SppgQualityController) CreateSample(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateSamplePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload sampel tidak valid")
		return
	}

	sample, err := c.qualitySvc.CreateSample(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Sampel arsip pangan berhasil disimpan di lemari pendingin", sample)
}

// UpdateSampleStatus godoc
// @Summary Memperbarui status sampel (misal: dimusnahkan setelah 48 jam)
func (c *SppgQualityController) UpdateSampleStatus(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID sampel wajib dicantumkan")
		return
	}

	var payload models.UpdateSampleStatusPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload status tidak valid")
		return
	}

	if err := c.qualitySvc.UpdateSampleStatus(r.Context(), id, sppgID, payload.Status); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Status sampel arsip pangan berhasil diperbarui", map[string]string{
		"id":     id,
		"status": payload.Status,
	})
}

// SuperadminIntervention godoc
// @Summary Intervensi Keamanan Pangan Superadmin atas anomali hasil kontrol mutu HACCP
func (c *SppgQualityController) SuperadminIntervention(w http.ResponseWriter, r *http.Request) {
	var payload models.SuperadminQualityInterventionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload intervensi tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	actorRole := middlewares.Role(r.Context())
	actorName := "Superadmin BGN"

	if err := c.qualitySvc.SuperadminIntervention(r.Context(), &payload, actorID, actorRole, actorName); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Tindakan intervensi mutu Superadmin berhasil dieksekusi dan tercatat pada audit forensik", map[string]string{
		"batchToken": payload.BatchToken,
		"action":     payload.Action,
	})
}
