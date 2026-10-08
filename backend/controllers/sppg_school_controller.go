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

// SppgSchoolController menangani request HTTP untuk modul sekolah binaan dan kuota presensi SPPG.
type SppgSchoolController struct {
	schoolSvc services.SppgSchoolService
}

// NewSppgSchoolController membuat instance controller baru (Constructor DI).
func NewSppgSchoolController(schoolSvc services.SppgSchoolService) *SppgSchoolController {
	return &SppgSchoolController{schoolSvc: schoolSvc}
}

func (c *SppgSchoolController) resolveSppgID(r *http.Request) string {
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

// GetBundle godoc
// @Summary Ambil bundle sekolah binaan & kuota presensi dapur SPPG
func (c *SppgSchoolController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.schoolSvc.GetBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle sekolah binaan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle sekolah binaan dan kuota berhasil dimuat", bundle)
}

// ListSchools godoc
// @Summary Ambil daftar sekolah binaan dapur SPPG
func (c *SppgSchoolController) ListSchools(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	schools, err := c.schoolSvc.ListSchools(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar sekolah: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar sekolah binaan berhasil dimuat", schools)
}

// GetSchool godoc
// @Summary Ambil detail sekolah binaan spesifik
func (c *SppgSchoolController) GetSchool(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "ID sekolah wajib disertakan")
		return
	}

	school, err := c.schoolSvc.GetSchool(r.Context(), id, sppgID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Sekolah tidak ditemukan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Data sekolah binaan berhasil dimuat", school)
}

// UpdateAttendance godoc
// @Summary Mutakhirkan presensi pagi & kuota porsi sekolah binaan
func (c *SppgSchoolController) UpdateAttendance(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "ID sekolah wajib disertakan")
		return
	}

	var payload models.UpdateAttendancePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON mutasi presensi tidak valid: "+err.Error())
		return
	}

	updated, err := c.schoolSvc.UpdateAttendance(r.Context(), id, sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal memperbarui presensi sekolah: "+err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Data presensi dan kuota cetak sekolah binaan berhasil diperbarui", updated)
}

// UpdateDroppoint godoc
// @Summary Perbarui panduan drop-point dan kontak validator
func (c *SppgSchoolController) UpdateDroppoint(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "ID sekolah wajib disertakan")
		return
	}

	var payload models.UpdateDroppointPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON panduan drop-point tidak valid: "+err.Error())
		return
	}

	updated, err := c.schoolSvc.UpdateDroppoint(r.Context(), id, sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal memperbarui panduan drop-point: "+err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Panduan drop-point dan kontak validator berhasil diperbarui", updated)
}

// RemindAttendance godoc
// @Summary Kirim peringatan penagihan presensi pagi ke guru validator
func (c *SppgSchoolController) RemindAttendance(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "ID sekolah wajib disertakan")
		return
	}

	var payload models.RemindAttendancePayload
	_ = json.NewDecoder(r.Body).Decode(&payload)

	actorName := middlewares.UserID(r.Context())
	if actorName == "" {
		actorName = "Staf Administrasi SPPG"
	}

	err := c.schoolSvc.RemindAttendance(r.Context(), id, sppgID, payload.CustomMessage, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal mengirim peringatan presensi: "+err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Peringatan presensi pagi berhasil dicatat dan dikirim ke guru validator", nil)
}
