package controllers

import (
	"backend/middlewares"
	"backend/models"
	"backend/services"
	"backend/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

// SppgRecipeController mengelola request HTTP untuk rencana menu, kalkulator pengadaan, dan log batch SPPG.
type SppgRecipeController struct {
	recipeSvc services.SppgRecipeService
}

// NewSppgRecipeController membuat instance controller baru via Constructor DI.
func NewSppgRecipeController(recipeSvc services.SppgRecipeService) *SppgRecipeController {
	return &SppgRecipeController{recipeSvc: recipeSvc}
}

// resolveSppgID mengekstrak identitas SPPG dengan proteksi multi-tenant ketat.
func (c *SppgRecipeController) resolveSppgID(r *http.Request) string {
	role := middlewares.Role(r.Context())
	callerSppg := middlewares.SppgID(r.Context())

	// Superadmin berwenang menginspeksi dapur mana pun via query param ?sppgId=SPPG-02
	if role == models.RoleSuperadmin {
		if querySppg := strings.TrimSpace(r.URL.Query().Get("sppgId")); querySppg != "" {
			return querySppg
		}
	}

	// Untuk staf SPPG, kunci mutlak ke SPPG miliknya (mencegah BOLA/IDOR)
	if callerSppg != "" {
		return callerSppg
	}

	// Fallback dev default jika akun belum memiliki SPPG ID terikat
	return "SPPG-01"
}

// GetBundle godoc
// @Summary Mengambil bundle lengkap data /sppg/recipes untuk dapur aktif (paket menu, daily state, substitusi, batch logs)
// @Produce json
// @Success 200 {object} utils.APIResponse{data=models.SppgRecipeBundle}
func (c *SppgRecipeController) GetBundle(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	bundle, err := c.recipeSvc.GetRecipeBundle(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat bundle resep dapur")
		return
	}
	utils.Success(w, http.StatusOK, "Bundle resep SPPG berhasil dimuat", bundle)
}

// ListPackages godoc
// @Summary Mengambil daftar paket menu (Nasional BGN + kustom dapur)
func (c *SppgRecipeController) ListPackages(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	pkgs, err := c.recipeSvc.ListPackages(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat paket menu")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar paket menu berhasil dimuat", pkgs)
}

// GetPackageByID godoc
// @Summary Mengambil detail 1 paket resep
func (c *SppgRecipeController) GetPackageByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if strings.TrimSpace(id) == "" {
		utils.Error(w, http.StatusBadRequest, "ID paket resep wajib disertakan")
		return
	}

	pkg, err := c.recipeSvc.GetPackageByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, services.ErrPackageNotFound) {
			utils.Error(w, http.StatusNotFound, "Paket resep tidak ditemukan")
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat detail resep")
		return
	}

	utils.Success(w, http.StatusOK, "Detail paket resep berhasil dimuat", pkg)
}

// CreatePackage godoc
// @Summary Membuat paket menu kustom khusus dapur pemanggil
func (c *SppgRecipeController) CreatePackage(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var pkg models.SppgMenuPackage
	if err := json.NewDecoder(r.Body).Decode(&pkg); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format JSON request tidak valid")
		return
	}

	created, err := c.recipeSvc.CreateCustomPackage(r.Context(), sppgID, &pkg)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrMenuNameRequired), errors.Is(err, services.ErrIngredientRequired):
			utils.Error(w, http.StatusBadRequest, err.Error())
		default:
			utils.Error(w, http.StatusInternalServerError, "Gagal menyimpan resep kustom")
		}
		return
	}

	utils.Success(w, http.StatusCreated, "Paket resep kustom berhasil didaftarkan ke dapur", created)
}

// GetDailyState godoc
// @Summary Mengambil state operasional harian dapur aktif
func (c *SppgRecipeController) GetDailyState(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	state, err := c.recipeSvc.GetDailyState(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat state harian dapur")
		return
	}
	utils.Success(w, http.StatusOK, "State harian dapur berhasil dimuat", state)
}

// UpdateDailyState godoc
// @Summary Memperbarui konfigurasi porsi target dan cohort aktif
func (c *SppgRecipeController) UpdateDailyState(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.UpdateDailyStatePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format payload tidak valid")
		return
	}

	updated, err := c.recipeSvc.UpdateDailyState(r.Context(), sppgID, payload)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memperbarui konfigurasi dapur")
		return
	}

	utils.Success(w, http.StatusOK, "Konfigurasi operasional dapur berhasil diperbarui", updated)
}

// ToggleLock godoc
// @Summary Mengunci / membuka kunci menu hari ini untuk dapur pemanggil
func (c *SppgRecipeController) ToggleLock(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.ToggleLockPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format payload tidak valid")
		return
	}

	actorID := middlewares.UserID(r.Context())
	actorRole := middlewares.Role(r.Context())
	actorName := "Kepala Dapur " + sppgID
	if actorRole == models.RoleSuperadmin {
		actorName = "Superadmin BGN (" + actorID + ")"
	}

	updated, err := c.recipeSvc.ToggleMenuLock(r.Context(), sppgID, payload, actorName)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal mengubah status kunci menu")
		return
	}

	actionStr := "dikunci untuk persiapan masak"
	if !updated.IsLocked {
		actionStr = "dibuka kembali untuk revisi"
	}

	utils.Success(w, http.StatusOK, "Status menu dapur berhasil "+actionStr, updated)
}

// ListSubstitutions godoc
// @Summary Mengambil riwayat pengajuan substitusi bahan darurat dapur aktif
func (c *SppgRecipeController) ListSubstitutions(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	subs, err := c.recipeSvc.ListSubstitutions(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat daftar substitusi bahan")
		return
	}
	utils.Success(w, http.StatusOK, "Daftar substitusi bahan berhasil dimuat", subs)
}

// CreateSubstitution godoc
// @Summary Mengajukan permohonan substitusi bahan darurat
func (c *SppgRecipeController) CreateSubstitution(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var payload models.CreateSubstitutionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format form substitusi tidak valid")
		return
	}

	created, err := c.recipeSvc.SubmitSubstitution(r.Context(), sppgID, payload)
	if err != nil {
		if errors.Is(err, services.ErrSubstitutionInvalid) {
			utils.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		utils.Error(w, http.StatusInternalServerError, "Gagal mengajukan substitusi bahan darurat")
		return
	}

	utils.Success(w, http.StatusCreated, "Permohonan substitusi bahan darurat berhasil dikirim ke Satgas BGN", created)
}

// ListBatches godoc
// @Summary Mengambil log penerimaan batch bahan baku gudang dapur
func (c *SppgRecipeController) ListBatches(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)
	batches, err := c.recipeSvc.ListBatchLogs(r.Context(), sppgID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal memuat log batch bahan baku")
		return
	}
	utils.Success(w, http.StatusOK, "Log batch bahan baku berhasil dimuat", batches)
}

// CreateBatch godoc
// @Summary Mendaftarkan batch bahan baku baru ke gudang dapur
func (c *SppgRecipeController) CreateBatch(w http.ResponseWriter, r *http.Request) {
	sppgID := c.resolveSppgID(r)

	var batch models.SppgIngredientBatch
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		utils.Error(w, http.StatusBadRequest, "Format batch tidak valid")
		return
	}

	created, err := c.recipeSvc.CreateBatchLog(r.Context(), sppgID, &batch)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Gagal mendaftarkan batch bahan baku")
		return
	}

	utils.Success(w, http.StatusCreated, "Batch bahan baku berhasil dicatat di gudang", created)
}
