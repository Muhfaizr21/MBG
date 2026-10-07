package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"errors"
	"log"
	"net/http"
)

// AttendanceController menangani rute HTTP untuk penerimaan siswa dan rekonsiliasi porsi MBG.
type AttendanceController struct {
	svc services.AttendanceService
}

// NewAttendanceController constructor (Constructor DI)
func NewAttendanceController(svc services.AttendanceService) *AttendanceController {
	return &AttendanceController{svc: svc}
}

// List mengembalikan daftar rekonsiliasi presensi & porsi MBG.
func (c *AttendanceController) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.AttendanceFilter{
		Search: q.Get("search"),
		Status: q.Get("status"),
		City:   q.Get("city"),
	}

	list, err := c.svc.List(r.Context(), filter)
	if err != nil {
		log.Printf("[ERROR] Failed to list attendance records: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat data rekonsiliasi presensi")
		return
	}
	utils.Success(w, http.StatusOK, "Data rekonsiliasi presensi berhasil dimuat", list)
}

// GetByID mengembalikan detail rekonsiliasi spesifik berdasarkan ID.
func (c *AttendanceController) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	item, err := c.svc.GetByID(r.Context(), id)
	if err != nil {
		writeAttendanceError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Detail presensi berhasil dimuat", item)
}

// AdjustQuota melakukan penetapan kuota porsi esok hari (H+1) berdasarkan analisis presensi riil.
func (c *AttendanceController) AdjustQuota(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.AdjustQuotaRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload penyesuaian kuota tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "superadmin-01"
	}
	actor := models.User{
		ID:       actorID,
		FullName: "Dr. Hendra Prasetyo (Satgas MBG Pusat)",
		Role:     models.RoleSuperadmin,
	}

	updated, err := c.svc.AdjustTomorrowQuota(r.Context(), id, req, actor)
	if err != nil {
		writeAttendanceError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Alokasi kuota porsi esok hari berhasil diperbarui", updated)
}

// RedistributeSurplus mengesahkan surat jalan pengalihan sisa porsi utuh ke lembaga sosial/panti.
func (c *AttendanceController) RedistributeSurplus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.RedistributeSurplusRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload pengalihan porsi sisa tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "superadmin-01"
	}
	actor := models.User{
		ID:       actorID,
		FullName: "Dr. Hendra Prasetyo (Satgas MBG Pusat)",
		Role:     models.RoleSuperadmin,
	}

	updated, err := c.svc.RedistributeSurplus(r.Context(), id, req, actor)
	if err != nil {
		writeAttendanceError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Otorisasi pengalihan porsi surplus berhasil disahkan", updated)
}

// AuditDiscrepancy menerbitkan berita acara investigasi selisih serah terima porsi MBG.
func (c *AttendanceController) AuditDiscrepancy(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.AuditDiscrepancyRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload berita acara audit selisih tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "superadmin-01"
	}
	actor := models.User{
		ID:       actorID,
		FullName: "Dr. Hendra Prasetyo (Satgas MBG Pusat)",
		Role:     models.RoleSuperadmin,
	}

	updated, err := c.svc.AuditDiscrepancy(r.Context(), id, req, actor)
	if err != nil {
		writeAttendanceError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Berita acara investigasi selisih porsi berhasil diterbitkan", updated)
}

func writeAttendanceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrAttendanceNotFound):
		utils.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, services.ErrInvalidQuota),
		errors.Is(err, services.ErrInvalidReason),
		errors.Is(err, services.ErrZeroSurplus),
		errors.Is(err, services.ErrExcessSurplus),
		errors.Is(err, services.ErrGoldenWindowExpired),
		errors.Is(err, services.ErrAlreadyRedistributed),
		errors.Is(err, services.ErrInvalidInvestigator),
		errors.Is(err, services.ErrInvalidAuditNotes),
		errors.Is(err, services.ErrMissingFacility),
		errors.Is(err, services.ErrMissingCourier):
		utils.Error(w, http.StatusBadRequest, err.Error())
	default:
		log.Printf("[ERROR] Attendance operation failed: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memproses data rekonsiliasi")
	}
}
