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

// SppgIncidentController menangani seluruh request HTTP untuk insiden, respons SLA, dan karantina batch SPPG.
type SppgIncidentController struct {
	incidentSvc services.SppgIncidentService
}

// NewSppgIncidentController membuat instance controller insiden baru (Constructor DI).
func NewSppgIncidentController(incidentSvc services.SppgIncidentService) *SppgIncidentController {
	return &SppgIncidentController{incidentSvc: incidentSvc}
}

func (c *SppgIncidentController) resolveSppgID(r *http.Request) string {
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

// GetBundle mengambil bundle lengkap data tiket aduan, karantina batch, stok cadangan, dan metrik SLA
func (c *SppgIncidentController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.incidentSvc.GetBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle insiden: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle insiden berhasil dimuat", bundle)
}

// ListTickets mengambil daftar seluruh tiket aduan insiden SPPG
func (c *SppgIncidentController) ListTickets(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	tickets, err := c.incidentSvc.ListTickets(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar tiket: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar tiket berhasil dimuat", tickets)
}

// GetTicket mengambil detail satu tiket aduan insiden
func (c *SppgIncidentController) GetTicket(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	ticket, err := c.incidentSvc.GetTicket(r.Context(), id, sppgID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Detail tiket berhasil dimuat", ticket)
}

// CreateTicket mencatat tiket aduan insiden baru (dapat dipanggil oleh validator sekolah / sistem)
func (c *SppgIncidentController) CreateTicket(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateIncidentTicketPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON tiket aduan tidak valid")
		return
	}

	ticket, err := c.incidentSvc.CreateTicket(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusCreated, "Tiket aduan insiden berhasil dibuat", ticket)
}

// ReplyTicket mengirimkan tanggapan tertulis dan hasil uji sampel dapur
func (c *SppgIncidentController) ReplyTicket(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	actorName := middlewares.UserID(r.Context())

	var payload models.ReplyTicketPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON tanggapan tidak valid")
		return
	}

	updated, err := c.incidentSvc.ReplyTicket(r.Context(), id, sppgID, &payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Tanggapan dapur berhasil dikirimkan", updated)
}

// ReplacePortions mengalokasikan boks pengganti kilat dari stok cadangan dapur
func (c *SppgIncidentController) ReplacePortions(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	actorName := middlewares.UserID(r.Context())

	var payload models.ReplaceTicketPortionsPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON alokasi boks tidak valid")
		return
	}

	updated, remainStock, err := c.incidentSvc.ReplacePortions(r.Context(), id, sppgID, &payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Porsi pengganti kilat berhasil dialokasikan dari stok cadangan", map[string]any{
		"ticket":      updated,
		"safetyStock": remainStock,
	})
}

// RecallBatch mengunci dan mengkarantina seketika batch makanan yang bermasalah
func (c *SppgIncidentController) RecallBatch(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	actorName := middlewares.UserID(r.Context())

	var payload models.RecallBatchPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON karantina batch tidak valid")
		return
	}

	recall, activeTokens, err := c.incidentSvc.RecallBatch(r.Context(), sppgID, &payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Batch makanan berhasil dikarantina darurat", map[string]any{
		"recall":         recall,
		"recalledTokens": activeTokens,
	})
}

// CloseTicket menutup tiket aduan bersama Satgas dengan bukti penyelesaian
func (c *SppgIncidentController) CloseTicket(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	actorName := middlewares.UserID(r.Context())

	var payload models.CloseTicketPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON penutupan tiket tidak valid")
		return
	}

	updated, err := c.incidentSvc.CloseTicket(r.Context(), id, sppgID, &payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Tiket insiden berhasil diselesaikan dan ditutup", updated)
}
