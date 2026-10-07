package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"log"
	"net/http"
)

// FeedbackController menangani request HTTP untuk tiket aduan, kill-switch, dan eskalasi medis.
type FeedbackController struct {
	svc services.FeedbackService
}

// NewFeedbackController membuat instance baru FeedbackController
func NewFeedbackController(svc services.FeedbackService) *FeedbackController {
	return &FeedbackController{svc: svc}
}

// GetBundle mengembalikan seluruh bundel data tiket aduan, puskesmas terdekat, dan metrik KPI
func (c *FeedbackController) GetBundle(w http.ResponseWriter, r *http.Request) {
	bundle, err := c.svc.GetBundle(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get feedback bundle: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundel aduan & triage")
		return
	}
	utils.Success(w, http.StatusOK, "Bundel aduan berhasil dimuat", bundle)
}

// ListTickets mengembalikan daftar tiket aduan dengan filter tingkat kegawatan, status, dan pencarian
func (c *FeedbackController) ListTickets(w http.ResponseWriter, r *http.Request) {
	severity := r.URL.Query().Get("severity")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	list, err := c.svc.GetAllTickets(r.Context(), severity, status, search)
	if err != nil {
		log.Printf("[ERROR] Failed to list tickets: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar aduan")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar tiket aduan berhasil dimuat", list)
}

// GetTicketByID mengembalikan rincian satu tiket aduan berdasarkan ID
func (c *FeedbackController) GetTicketByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ticket, err := c.svc.GetTicketByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Rincian tiket berhasil dimuat", ticket)
}

// CreateTicket mendaftarkan tiket aduan darurat / mutu makanan baru
func (c *FeedbackController) CreateTicket(w http.ResponseWriter, r *http.Request) {
	var req models.CreateFeedbackRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload aduan tidak valid: "+err.Error())
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}

	ticket, err := c.svc.CreateTicket(r.Context(), &req, actorID)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusCreated, "Tiket aduan darurat berhasil didaftarkan", ticket)
}

// ExecuteKillSwitch mengaktifkan protokol pembekuan darurat batch makanan
func (c *FeedbackController) ExecuteKillSwitch(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.ExecuteKillSwitchRequest
	_ = decodeJSON(r, &req)

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}

	actorName := "Bambang Soediro (Superadmin Satgas MBG)"

	ticket, err := c.svc.ExecuteKillSwitch(r.Context(), id, actorID, actorName, &req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal mengaktifkan kill-switch: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "EMERGENCY KILL-SWITCH BERHASIL DIAKTIFKAN!", ticket)
}

// EscalateMedical melakukan eskalasi darurat ke Puskesmas rujukan
func (c *FeedbackController) EscalateMedical(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.EscalateMedicalRequest
	_ = decodeJSON(r, &req)

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}

	ticket, err := c.svc.EscalateMedical(r.Context(), id, actorID, &req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal eskalasi medis: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Eskalasi darurat medis berhasil dikirim ke Puskesmas", ticket)
}

// CloseTicket menutup tiket insiden setelah verifikasi lapangan dan hasil lab
func (c *FeedbackController) CloseTicket(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.CloseFeedbackRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload penutupan tiket tidak valid: "+err.Error())
		return
	}

	actorID := middlewares.UserID(r.Context())
	if actorID == "" {
		actorID = "system-superadmin"
	}

	ticket, err := c.svc.CloseTicket(r.Context(), id, actorID, &req)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, "Gagal menutup tiket: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Tiket aduan resmi DITUTUP", ticket)
}

// GetStats mengembalikan ringkasan statistik dan metrik eksekutif
func (c *FeedbackController) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := c.svc.GetExecutiveStats(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get feedback stats: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat statistik aduan")
		return
	}
	utils.Success(w, http.StatusOK, "Statistik aduan berhasil dimuat", stats)
}
