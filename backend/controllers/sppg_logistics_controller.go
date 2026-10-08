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

// SppgLogisticsController menangani seluruh request HTTP untuk modul logistik rute dan armada SPPG.
type SppgLogisticsController struct {
	logisticsSvc services.SppgLogisticsService
}

// NewSppgLogisticsController membuat instance controller logistik baru (Constructor DI).
func NewSppgLogisticsController(logisticsSvc services.SppgLogisticsService) *SppgLogisticsController {
	return &SppgLogisticsController{logisticsSvc: logisticsSvc}
}

func (c *SppgLogisticsController) resolveSppgID(r *http.Request) string {
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
// @Summary Mengambil bundle lengkap data armada, peta, telemetri suhu boks, dan status logistik
func (c *SppgLogisticsController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.logisticsSvc.GetLogisticsBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle logistik armada: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Bundle logistik armada berhasil dimuat", bundle)
}

// ListFleets godoc
// @Summary Mengambil daftar seluruh armada logistik dapur SPPG
func (c *SppgLogisticsController) ListFleets(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	fleets, err := c.logisticsSvc.ListFleets(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar armada: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar armada berhasil dimuat", fleets)
}

// CreateFleet godoc
// @Summary Mendaftarkan armada logistik pengantaran baru
func (c *SppgLogisticsController) CreateFleet(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateFleetPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload armada tidak valid")
		return
	}

	fleet, err := c.logisticsSvc.CreateFleet(r.Context(), sppgID, &payload)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Armada logistik baru berhasil didaftarkan", fleet)
}

// UpdateTelemetry godoc
// @Summary Memperbarui telemetri live armada (kecepatan, progres, suhu boks, status perjalanan)
func (c *SppgLogisticsController) UpdateTelemetry(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	id := r.PathValue("id")
	if id == "" {
		utils.Error(w, http.StatusBadRequest, "ID armada diperlukan")
		return
	}

	var payload models.UpdateFleetTelemetryPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload telemetri tidak valid")
		return
	}

	if err := c.logisticsSvc.UpdateTelemetry(r.Context(), id, sppgID, &payload); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Telemetri armada berhasil diperbarui", map[string]any{
		"id":       id,
		"speedKph": payload.SpeedKph,
		"progress": payload.Progress,
		"boxTempC": payload.BoxTempC,
		"status":   payload.Status,
	})
}

// DispatchBackup godoc
// @Summary Menerjunkan armada cadangan saat armada pengantar utama mengalami kendala teknis / mogok
func (c *SppgLogisticsController) DispatchBackup(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	troubledFleetID := r.PathValue("id")
	if troubledFleetID == "" {
		utils.Error(w, http.StatusBadRequest, "ID armada bermasalah diperlukan")
		return
	}

	actorName := "Koordinator Logistik SPPG"
	backupFleet, err := c.logisticsSvc.DispatchBackup(r.Context(), sppgID, troubledFleetID, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Armada cadangan berhasil diterjunkan untuk mengambil alih rute pengantaran", backupFleet)
}

// SendNotification godoc
// @Summary Mencatat siaran pesan notifikasi estimasi tiba ke pihak sekolah binaan
func (c *SppgLogisticsController) SendNotification(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	fleetID := r.PathValue("id")
	if fleetID == "" {
		utils.Error(w, http.StatusBadRequest, "ID armada diperlukan")
		return
	}

	var payload models.SendNotificationPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload notifikasi tidak valid")
		return
	}

	actorName := "Admin Logistik SPPG"
	notif, err := c.logisticsSvc.SendNotification(r.Context(), sppgID, fleetID, &payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusCreated, "Pesan notifikasi berhasil disiarkan", notif)
}

// SuperadminIntervention godoc
// @Summary Intervensi rute logistik darurat oleh Superadmin BGN (reroute, recall, pemeriksaan rantai dingin)
func (c *SppgLogisticsController) SuperadminIntervention(w http.ResponseWriter, r *http.Request) {
	var payload models.SuperadminLogisticsInterventionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON payload intervensi logistik tidak valid")
		return
	}

	sppgID := strings.TrimSpace(r.URL.Query().Get("sppgId"))
	if sppgID == "" {
		sppgID = "SPPG-01"
	}

	actorID := middlewares.UserID(r.Context())
	actorRole := middlewares.Role(r.Context())
	actorName := "Superadmin Logistik BGN"

	if err := c.logisticsSvc.SuperadminIntervention(r.Context(), sppgID, &payload, actorID, actorRole, actorName); err != nil {
		utils.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.Success(w, http.StatusOK, "Tindakan intervensi logistik Superadmin berhasil dieksekusi", map[string]string{
		"fleetId": payload.FleetID,
		"action":  payload.Action,
	})
}
