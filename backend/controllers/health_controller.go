package controllers

import (
	"backend/models"
	"backend/utils"
	"net/http"
	"time"
)

type HealthController struct{}

func NewHealthController() *HealthController {
	return &HealthController{}
}

// HealthCheck godoc
// @Summary      Check service health
// @Description  Returns status and timestamp of the backend service
// @Tags         health
// @Produce      json
// @Success      200  {object}  models.APIResponse{data=models.HealthResponse}
// @Router       /api/health [get]
func (c *HealthController) HealthCheck(w http.ResponseWriter, r *http.Request) {
	resp := models.HealthResponse{
		Status:    "ok",
		Service:   "MBG Backend API (Golang Clean MVC)",
		Version:   "1.0.0",
		Timestamp: time.Now().Format(time.RFC3339),
	}
	utils.Success(w, http.StatusOK, "Service is healthy", resp)
}

func (c *HealthController) Root(w http.ResponseWriter, r *http.Request) {
	utils.Success(w, http.StatusOK, "Welcome to MBG Clean Code & SOLID API", map[string]string{
		"docs": "/swagger/index.html",
	})
}
