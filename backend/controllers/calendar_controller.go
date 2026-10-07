package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"log"
	"net/http"
)

// CalendarController menangani request HTTP untuk operasional kalender & siklus menu MBG.
type CalendarController struct {
	svc services.CalendarService
}

// NewCalendarController membuat instance CalendarController.
func NewCalendarController(svc services.CalendarService) *CalendarController {
	return &CalendarController{svc: svc}
}

// ListDays mengembalikan daftar hari operasional kalender dan paket menu.
func (c *CalendarController) ListDays(w http.ResponseWriter, r *http.Request) {
	monthYear := r.URL.Query().Get("monthYear")
	days, err := c.svc.ListDays(r.Context(), monthYear)
	if err != nil {
		log.Printf("[ERROR] Failed to list calendar days: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat kalender MBG")
		return
	}
	utils.Success(w, http.StatusOK, "Kalender MBG berhasil dimuat", days)
}

// GetDayByDate mengembalikan detail hari kalender berdasarkan tanggal (YYYY-MM-DD).
func (c *CalendarController) GetDayByDate(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	day, err := c.svc.GetDayByDate(r.Context(), date)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Hari kalender tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Detail kalender berhasil dimuat", day)
}

// LockMonth mengunci seluruh siklus menu aktif untuk periode bulan tertentu secara nasional.
func (c *CalendarController) LockMonth(w http.ResponseWriter, r *http.Request) {
	var req models.LockMonthRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload lock month tidak valid: "+err.Error())
		return
	}

	actor := extractCalendarActor(r)
	if err := c.svc.LockMonth(r.Context(), req, actor); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Seluruh siklus menu periode "+req.MonthYear+" telah berhasil dikunci secara nasional", nil)
}

// ToggleDayLock mengubah status kunci menu tanggal tertentu antara 'locked' dan 'draft'.
func (c *CalendarController) ToggleDayLock(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	actor := extractCalendarActor(r)

	day, err := c.svc.ToggleDayLock(r.Context(), date, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Status penguncian menu tanggal "+date+" berhasil diperbarui", day)
}

// SetBlackoutDate menetapkan atau mencabut status libur operasional / blackout.
func (c *CalendarController) SetBlackoutDate(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	var req models.BlackoutDateRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload blackout tidak valid: "+err.Error())
		return
	}

	actor := extractCalendarActor(r)
	day, err := c.svc.SetBlackoutDate(r.Context(), date, req, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	msg := "Hari operasional dibuka kembali"
	if req.IsSettingBlackout {
		msg = "Tanggal " + date + " berhasil ditetapkan sebagai Libur Operasional Blackout"
	}
	utils.Success(w, http.StatusOK, msg, day)
}

// ListSubstitutions mengembalikan daftar pengajuan substitusi menu darurat.
func (c *CalendarController) ListSubstitutions(w http.ResponseWriter, r *http.Request) {
	subs, err := c.svc.ListSubstitutions(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to list menu substitutions: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat substitusi menu")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar substitusi menu berhasil dimuat", subs)
}

// GetSubstitutionByID mengembalikan detail pengajuan substitusi menu.
func (c *CalendarController) GetSubstitutionByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sub, err := c.svc.GetSubstitutionByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Substitusi menu tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Detail substitusi menu berhasil dimuat", sub)
}

// CreateSubstitution mengusulkan sekaligus menyetujui substitusi darurat bahan baku menu.
func (c *CalendarController) CreateSubstitution(w http.ResponseWriter, r *http.Request) {
	var req models.CreateSubstitutionRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload substitusi tidak valid: "+err.Error())
		return
	}

	actor := extractCalendarActor(r)
	sub, err := c.svc.CreateSubstitution(r.Context(), req, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusCreated, "Pengajuan substitusi menu berhasil dibuat & disetujui", sub)
}

// ReviewSubstitution menyetujui atau menolak usulan substitusi bahan baku menu.
func (c *CalendarController) ReviewSubstitution(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.ReviewSubstitutionRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload review substitusi tidak valid: "+err.Error())
		return
	}

	actor := extractCalendarActor(r)
	sub, err := c.svc.ReviewSubstitution(r.Context(), id, req, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	msg := "Pengajuan substitusi " + id + " berhasil disetujui"
	if req.Action == "reject" {
		msg = "Pengajuan substitusi " + id + " ditolak (tetap memakai menu asli)"
	}
	utils.Success(w, http.StatusOK, msg, sub)
}

// ScheduleInspection menjadwalkan sidak mendadak dan audit kelaikan sanitasi dapur SPPG.
func (c *CalendarController) ScheduleInspection(w http.ResponseWriter, r *http.Request) {
	date := r.PathValue("date")
	var req models.ScheduleInspectionRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload jadwal sidak tidak valid: "+err.Error())
		return
	}

	actor := extractCalendarActor(r)
	day, err := c.svc.ScheduleInspection(r.Context(), date, req, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Jadwal sidak mendadak berhasil didaftarkan secara rahasia", day)
}

// ListMenuPackages mengembalikan daftar 10 paket siklus menu standar BGN.
func (c *CalendarController) ListMenuPackages(w http.ResponseWriter, r *http.Request) {
	packages, err := c.svc.ListMenuPackages(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to list menu packages: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat paket menu")
		return
	}
	utils.Success(w, http.StatusOK, "Paket menu standar BGN berhasil dimuat", packages)
}

func extractCalendarActor(r *http.Request) models.User {
	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "usr-superadmin-01"
	}
	role := middlewares.Role(r.Context())
	if role == "" {
		role = models.RoleSuperadmin
	}
	return models.User{
		ID:       actorID,
		FullName: "Bambang Soediro (Superadmin Satgas MBG)",
		Email:    "superadmin@kawangizi.id",
		Role:     role,
	}
}
