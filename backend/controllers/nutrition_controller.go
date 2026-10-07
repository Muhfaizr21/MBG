package controllers

import (
	"backend/services"
	"backend/utils"
	"net/http"
	"strconv"
)

// NutritionController handles nutrition dataset lookups.
type NutritionController struct {
	nutritionSvc services.NutritionService
}

// NewNutritionController wires the nutrition controller with its service (Constructor DI).
func NewNutritionController(nutritionSvc services.NutritionService) *NutritionController {
	return &NutritionController{nutritionSvc: nutritionSvc}
}

// Items godoc
// @Summary Search nutrition items from the cuisine dataset
// @Produce json
// @Param q query string false "kata kunci nama bahan"
// @Param limit query int false "batas hasil (default 20, maks 100)"
// @Success 200 {object} models.APIResponse
// @Router /api/nutrition/items [get]
func (c *NutritionController) Items(w http.ResponseWriter, r *http.Request) {
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil {
		limit = 20
	}

	items, err := c.nutritionSvc.Search(r.Context(), r.URL.Query().Get("q"), limit)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "gagal mengambil data gizi")
		return
	}
	utils.Success(w, http.StatusOK, "item gizi", items)
}
