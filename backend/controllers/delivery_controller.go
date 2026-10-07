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

// DeliveryController menangani rute HTTP untuk telemetri hasil pengiriman MBG.
type DeliveryController struct {
	svc services.DeliveryService
}

// NewDeliveryController constructor (Constructor DI)
func NewDeliveryController(svc services.DeliveryService) *DeliveryController {
	return &DeliveryController{svc: svc}
}

// List mengembalikan seluruh riwayat pengiriman makanan MBG.
func (c *DeliveryController) List(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.List(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to list deliveries: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat hasil pengiriman")
		return
	}
	utils.Success(w, http.StatusOK, "Data hasil pengiriman berhasil dimuat", list)
}

// Get mengembalikan satu hasil pengiriman spesifik berdasarkan ID.
func (c *DeliveryController) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	item, err := c.svc.Get(r.Context(), id)
	if err != nil {
		writeDeliveryError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Detail pengiriman berhasil dimuat", item)
}

// OverrideAI mengesahkan hidangan secara manual jika terjadi anomali deteksi AI.
func (c *DeliveryController) OverrideAI(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.OverrideDeliveryAIRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	updated, err := c.svc.OverrideAI(r.Context(), actorID, id, req)
	if err != nil {
		writeDeliveryError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Hasil deteksi AI berhasil disahkan secara manual oleh Superadmin", updated)
}

// OrderLabTest memerintahkan pengujian petik sampel makanan ke laboratorium Dinkes.
func (c *DeliveryController) OrderLabTest(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.OrderDeliveryLabTestRequest
	if err := decodeJSON(r, &req); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	updated, err := c.svc.OrderLabTest(r.Context(), actorID, id, req)
	if err != nil {
		writeDeliveryError(w, err)
		return
	}
	utils.Success(w, http.StatusOK, "Perintah uji petik laboratorium Dinkes berhasil diterbitkan", updated)
}

func writeDeliveryError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrDeliveryInvalid):
		utils.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, services.ErrDeliveryNotFound):
		utils.Error(w, http.StatusNotFound, "Data pengiriman tidak ditemukan")
	default:
		log.Printf("[ERROR] Delivery operation failed: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memproses telemetri pengiriman")
	}
}
