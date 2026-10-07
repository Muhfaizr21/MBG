package controllers

import (
	"log"
	"net/http"

	"backend/services"
	"backend/utils"
)

type DashboardController struct {
	svc services.DashboardService
}

func NewDashboardController(svc services.DashboardService) *DashboardController {
	return &DashboardController{svc: svc}
}

func (c *DashboardController) GetDashboardBundle(w http.ResponseWriter, r *http.Request) {
	bundle, err := c.svc.GetDashboardBundle(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get dashboard bundle: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat rangkuman analitika dashboard")
		return
	}
	utils.Success(w, http.StatusOK, "Bundel analitika dashboard berhasil dimuat", bundle)
}

func (c *DashboardController) GetMetrics(w http.ResponseWriter, r *http.Request) {
	kpis, err := c.svc.GetKPIs(r.Context())
	if err != nil {
		log.Printf("[ERROR] Failed to get dashboard metrics: %v", err)
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat KPI dashboard")
		return
	}
	utils.Success(w, http.StatusOK, "KPI dashboard berhasil dimuat", kpis)
}
