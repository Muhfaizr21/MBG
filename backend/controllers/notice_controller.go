package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"log"
	"net/http"
)

// NoticeController menangani antarmuka HTTP untuk papan pengumuman & edaran darurat Satgas MBG.
type NoticeController struct {
	svc services.NoticeService
}

// NewNoticeController constructor untuk dependency injection NoticeController.
func NewNoticeController(svc services.NoticeService) *NoticeController {
	return &NoticeController{svc: svc}
}

// List mengembalikan daftar maklumat resmi berdasarkan kriteria filter.
func (c *NoticeController) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.NoticeFilter{
		Search:         q.Get("search"),
		Category:       q.Get("category"),
		Urgency:        q.Get("urgency"),
		TargetAudience: q.Get("targetAudience"),
		Status:         q.Get("status"),
	}

	list, err := c.svc.List(r.Context(), filter)
	if err != nil {
		log.Printf("[ERROR] Failed to list notices: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat papan pengumuman")
		return
	}
	utils.Success(w, http.StatusOK, "Papan pengumuman berhasil dimuat", list)
}

// GetByID mengembalikan detail pengumuman spesifik berdasarkan ID.
func (c *NoticeController) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	notice, err := c.svc.GetByID(r.Context(), id)
	if err != nil {
		log.Printf("[ERROR] Failed to get notice: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat detail maklumat")
		return
	}
	if notice == nil {
		utils.Error(w, http.StatusNotFound, "Maklumat tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Detail maklumat berhasil dimuat", notice)
}

// Create mempublikasikan maklumat baru ke jaringan komunikasi MBG.
func (c *NoticeController) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateNoticeRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload pengumuman tidak valid: "+err.Error())
		return
	}

	actor := extractNoticeActor(r)
	notice, err := c.svc.Create(r.Context(), req, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusCreated, "Maklumat resmi berhasil dipublikasikan", notice)
}

// BroadcastFlashAlert mengaktifkan penyiaran darurat dan mengunci aplikasi sebelum konfirmasi.
func (c *NoticeController) BroadcastFlashAlert(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	actor := extractNoticeActor(r)

	notice, err := c.svc.BroadcastFlashAlert(r.Context(), id, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Penyiaran darurat (Flash Alert) berhasil diaktifkan", notice)
}

// ToggleArchive mengarsipkan atau mengaktifkan kembali maklumat dari papan publik.
func (c *NoticeController) ToggleArchive(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	actor := extractNoticeActor(r)

	var payload struct {
		IsArchiving bool `json:"isArchiving"`
	}
	// default true if not provided
	payload.IsArchiving = true
	_ = decodeJSON(r, &payload)

	notice, err := c.svc.ToggleArchive(r.Context(), id, payload.IsArchiving, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	msg := "Maklumat berhasil diaktifkan kembali"
	if payload.IsArchiving {
		msg = "Maklumat berhasil diarsipkan dari papan publik"
	}
	utils.Success(w, http.StatusOK, msg, notice)
}

// Delete menghapus pengumuman secara permanen dari database.
func (c *NoticeController) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	actor := extractNoticeActor(r)

	err := c.svc.Delete(r.Context(), id, actor)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Pengumuman berhasil dihapus secara permanen", nil)
}

// Acknowledge menangani konfirmasi keterbacaan dari guru validator di sekolah.
func (c *NoticeController) Acknowledge(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	validatorID := middlewares.UserID(r.Context())
	if validatorID == "" {
		validatorID = "anonymous-validator"
	}

	err := c.svc.Acknowledge(r.Context(), id, validatorID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Konfirmasi pembacaan maklumat berhasil dicatat", nil)
}

func extractNoticeActor(r *http.Request) models.User {
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
		FullName: "Satgas BGN Pusat",
		Email:    "superadmin@kawangizi.id",
		Role:     role,
	}
}
