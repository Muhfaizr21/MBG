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

// ScheduleController menangani antarmuka HTTP untuk jadwal distribusi & armada cold-chain MBG.
type ScheduleController struct {
	svc services.ScheduleService
}

// NewScheduleController constructor untuk dependency injection.
func NewScheduleController(svc services.ScheduleService) *ScheduleController {
	return &ScheduleController{svc: svc}
}

// List mengembalikan daftar jadwal distribusi sesuai kriteria filter pencarian.
func (c *ScheduleController) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.ScheduleFilter{
		Search: q.Get("search"),
		Status: q.Get("status"),
		City:   q.Get("city"),
		SPPGID: q.Get("sppgId"),
	}

	list, err := c.svc.List(r.Context(), filter)
	if err != nil {
		log.Printf("[ERROR] Failed to list schedules: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat jadwal distribusi")
		return
	}
	utils.Success(w, http.StatusOK, "Jadwal distribusi berhasil dimuat", list)
}

// GetByID mengembalikan detail rute distribusi spesifik berdasarkan ID.
func (c *ScheduleController) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sched, err := c.svc.GetByID(r.Context(), id)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Detail rute pengantaran berhasil dimuat", sched)
}

// Reschedule menyesuaikan jadwal jam target kedatangan makanan siap saji ke sekolah.
func (c *ScheduleController) Reschedule(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.RescheduleRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload penyesuaian jadwal tidak valid: "+err.Error())
		return
	}

	actor := extractScheduleActor(r)
	updated, err := c.svc.Reschedule(r.Context(), id, req, actor)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Jadwal pengiriman berhasil disesuaikan", updated)
}

// SendDelayAlert menyiarkan alert keterlambatan ke pihak sekolah via WhatsApp / push.
func (c *ScheduleController) SendDelayAlert(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.DelayAlertRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload peringatan keterlambatan tidak valid: "+err.Error())
		return
	}

	actor := extractScheduleActor(r)
	updated, err := c.svc.SendDelayAlert(r.Context(), id, req, actor)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Peringatan keterlambatan berhasil disiarkan ke pihak sekolah penerima", updated)
}

// RerouteBackupFleet menginstruksikan armada cadangan untuk evakuasi muatan atau alih rute darurat.
func (c *ScheduleController) RerouteBackupFleet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.RerouteRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload penugasan armada cadangan tidak valid: "+err.Error())
		return
	}

	actor := extractScheduleActor(r)
	updated, err := c.svc.RerouteBackupFleet(r.Context(), id, req, actor)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Armada cadangan berhasil ditugaskan untuk re-routing", updated)
}

// GetBackupFleets mengembalikan daftar armada cadangan yang siaga di pool wilayah.
func (c *ScheduleController) GetBackupFleets(w http.ResponseWriter, r *http.Request) {
	fleets, err := c.svc.GetBackupFleets(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get backup fleets: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat armada cadangan")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar armada cadangan berhasil dimuat", fleets)
}

func extractScheduleActor(r *http.Request) models.User {
	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "superadmin-01"
	}
	role := middlewares.Role(r.Context())
	if role == "" {
		role = models.RoleSuperadmin
	}
	return models.User{
		ID:       actorID,
		FullName: "Administrator Pengendali Jadwal",
		Role:     role,
	}
}

func writeScheduleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrScheduleIDRequired),
		errors.Is(err, services.ErrNewTimeRequired),
		errors.Is(err, services.ErrInvalidTimeFormat),
		errors.Is(err, services.ErrRescheduleReasonEmpty),
		errors.Is(err, services.ErrDelayMinutesPositive),
		errors.Is(err, services.ErrBackupFleetIDRequired),
		errors.Is(err, services.ErrRerouteNotesRequired):
		utils.Error(w, http.StatusBadRequest, err.Error())
	default:
		log.Printf("[ERROR] Schedule action failed: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memproses tindakan jadwal distribusi")
	}
}
