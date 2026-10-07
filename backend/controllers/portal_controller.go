package controllers

import (
	"backend/models"
	"backend/services"
	"backend/utils"
	"encoding/json"
	"net/http"
)

type PortalController struct {
	svc services.PortalService
}

func NewPortalController(svc services.PortalService) *PortalController {
	return &PortalController{svc: svc}
}

func (c *PortalController) GetSchools(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetSchools(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat data sekolah: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar sekolah binaan berhasil dimuat", list)
}

func (c *PortalController) GetSchoolByNPSN(w http.ResponseWriter, r *http.Request) {
	npsn := r.PathValue("npsn")
	school, err := c.svc.GetSchool(r.Context(), npsn)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Sekolah tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Data sekolah berhasil dimuat", school)
}

func (c *PortalController) GetSPPGs(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetSPPGs(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat data dapur SPPG: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar dapur SPPG berhasil dimuat", list)
}

func (c *PortalController) GetSPPGByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sppg, err := c.svc.GetSPPG(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Dapur SPPG tidak ditemukan")
		return
	}
	utils.Success(w, http.StatusOK, "Data dapur SPPG berhasil dimuat", sppg)
}

func (c *PortalController) GetMenuPackages(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetMenuPackages(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat paket menu: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar paket menu nasional berhasil dimuat", list)
}

func (c *PortalController) GetCalendarDays(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetCalendarDays(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat kalender MBG: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Kalender operasional MBG berhasil dimuat", list)
}

func (c *PortalController) GetDeliveries(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetDeliveries(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat riwayat pengiriman: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Data hasil pengiriman berhasil dimuat", list)
}

func (c *PortalController) GetSchedules(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetSchedules(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat jadwal distribusi: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Jadwal distribusi berhasil dimuat", list)
}

func (c *PortalController) GetAttendances(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetAttendances(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat data penerimaan siswa: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Data penerimaan siswa berhasil dimuat", list)
}

func (c *PortalController) GetNotices(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetNotices(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat papan pengumuman: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar pengumuman berhasil dimuat", list)
}

func (c *PortalController) GetFeedbacks(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetFeedbacks(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat aduan & feedback: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar aduan berhasil dimuat", list)
}

func (c *PortalController) CreateFeedback(w http.ResponseWriter, r *http.Request) {
	var fb models.Feedback
	if err := json.NewDecoder(r.Body).Decode(&fb); err != nil {
		utils.Error(w, http.StatusBadRequest, "Payload aduan tidak valid")
		return
	}
	if err := c.svc.SubmitFeedback(r.Context(), &fb); err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal menyimpan aduan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusCreated, "Aduan berhasil dilaporkan dan masuk ke pusat triage", fb)
}

func (c *PortalController) GetReports(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetReports(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat arsip laporan: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar laporan BAST & audit berhasil dimuat", list)
}

func (c *PortalController) GetValidators(w http.ResponseWriter, r *http.Request) {
	list, err := c.svc.GetValidators(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat data validator: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Daftar validator lapangan berhasil dimuat", list)
}

func (c *PortalController) GetAdminMetrics(w http.ResponseWriter, r *http.Request) {
	metrics, err := c.svc.GetAdminMetrics(r.Context())
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat KPI metrik: "+err.Error())
		return
	}
	utils.Success(w, http.StatusOK, "Metrik dashboard eksekutif berhasil dimuat", metrics)
}
