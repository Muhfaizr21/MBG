package routes

import (
	"backend/controllers"
	"backend/middlewares"
	"backend/models"
	"backend/utils"
	"net/http"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type RouterDependencies struct {
	HealthCtrl    *controllers.HealthController
	ItemCtrl      *controllers.ItemController
	AuthCtrl      *controllers.AuthController
	ScanCtrl      *controllers.ScanController
	NutritionCtrl *controllers.NutritionController
	PortalCtrl    *controllers.PortalController
	AuthMW        func(http.Handler) http.Handler
	CORSOrigins   []string
}

// SetupRoutes registers all application routes and returns a configured handler.
// Chain: Logger -> CORS -> Auth (populates context) -> Mux (route-level guards).
func SetupRoutes(deps RouterDependencies) http.Handler {
	mux := http.NewServeMux()

	// Swagger documentation route
	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	// Root route (exact match using /{$} in Go 1.22+)
	mux.HandleFunc("GET /{$}", deps.HealthCtrl.Root)
	mux.HandleFunc("GET /api/health", deps.HealthCtrl.HealthCheck)

	// Auth routes
	mux.HandleFunc("POST /api/auth/register", deps.AuthCtrl.Register)
	mux.HandleFunc("POST /api/auth/login", deps.AuthCtrl.Login)
	mux.HandleFunc("POST /api/auth/refresh", deps.AuthCtrl.Refresh)
	mux.HandleFunc("POST /api/auth/logout", deps.AuthCtrl.Logout)
	mux.Handle("GET /api/auth/me", middlewares.RequireAuth(http.HandlerFunc(deps.AuthCtrl.Me)))

	// Item resource routes (CRUD) — read: any authenticated user, write: restricted
	mux.Handle("GET /api/items", middlewares.RequireAuth(http.HandlerFunc(deps.ItemCtrl.GetAll)))
	mux.Handle("GET /api/items/{id}", middlewares.RequireAuth(http.HandlerFunc(deps.ItemCtrl.GetByID)))
	mux.Handle("POST /api/items", middlewares.RequirePermission(models.PermKitchenOps)(http.HandlerFunc(deps.ItemCtrl.Create)))
	mux.Handle("DELETE /api/items/{id}", middlewares.RequirePermission(models.PermKillswitch)(http.HandlerFunc(deps.ItemCtrl.Delete)))

	// Scan routes — submit & history require scan.submit (role validator)
	mux.Handle("POST /api/scans", middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(deps.ScanCtrl.Submit)))
	mux.Handle("GET /api/scans/recent", middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(deps.ScanCtrl.Recent)))
	mux.Handle("PUT /api/scans/{id}", middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(deps.ScanCtrl.UpdateFeedback)))
	mux.Handle("DELETE /api/scans/all", middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(deps.ScanCtrl.DeleteAllScans)))
	mux.Handle("DELETE /api/scans/{id}", middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(deps.ScanCtrl.DeleteScan)))

	// Nutrition dataset — any authenticated user may look up item gizi
	mux.Handle("GET /api/nutrition/items", middlewares.RequireAuth(http.HandlerFunc(deps.NutritionCtrl.Items)))

	// Portal Ekosistem KawanGizi MBG (Schools, SPPG, Menu, Deliveries, Attendance, Schedules, Notices, Feedbacks, Reports, Validators)
	if deps.PortalCtrl != nil {
		mux.HandleFunc("GET /api/schools", deps.PortalCtrl.GetSchools)
		mux.HandleFunc("GET /api/schools/{npsn}", deps.PortalCtrl.GetSchoolByNPSN)
		mux.HandleFunc("GET /api/sppg", deps.PortalCtrl.GetSPPGs)
		mux.HandleFunc("GET /api/sppg/{id}", deps.PortalCtrl.GetSPPGByID)
		mux.HandleFunc("GET /api/menu-packages", deps.PortalCtrl.GetMenuPackages)
		mux.HandleFunc("GET /api/calendar", deps.PortalCtrl.GetCalendarDays)
		mux.HandleFunc("GET /api/deliveries", deps.PortalCtrl.GetDeliveries)
		mux.HandleFunc("GET /api/schedules", deps.PortalCtrl.GetSchedules)
		mux.HandleFunc("GET /api/attendance", deps.PortalCtrl.GetAttendances)
		mux.HandleFunc("GET /api/notices", deps.PortalCtrl.GetNotices)
		mux.HandleFunc("GET /api/feedback", deps.PortalCtrl.GetFeedbacks)
		mux.HandleFunc("POST /api/feedback", deps.PortalCtrl.CreateFeedback)
		mux.HandleFunc("GET /api/reports", deps.PortalCtrl.GetReports)
		mux.HandleFunc("GET /api/validators", deps.PortalCtrl.GetValidators)
		mux.HandleFunc("GET /api/admin/metrics", deps.PortalCtrl.GetAdminMetrics)
	}

	// Admin portal — superadmin only
	mux.Handle("GET /api/admin/summary", middlewares.RequireRole(models.RoleSuperadmin)(http.HandlerFunc(adminSummary)))
	mux.Handle("GET /api/admin/audit", middlewares.RequireRole(models.RoleSuperadmin)(http.HandlerFunc(adminSummary)))

	// SPPG portal — SPPG staff and superadmin
	mux.Handle("GET /api/sppg/overview", middlewares.RequireRole(models.RoleSuperadmin, models.RoleSppg)(http.HandlerFunc(sppgOverview)))

	// Static uploads — gambar scan yang disimpan server (untuk thumbnail riwayat)
	uploadDir := "uploads"
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	handler := middlewares.Logger(deps.AuthMW(middlewares.CORS(deps.CORSOrigins)(mux)))

	return handler
}

// adminSummary is a placeholder payload for the admin dashboard until Phase 3
func adminSummary(w http.ResponseWriter, r *http.Request) {
	utils.Success(w, http.StatusOK, "admin summary available", map[string]any{
		"role":  middlewares.Role(r.Context()),
		"actor": middlewares.UserID(r.Context()),
	})
}

// sppgOverview is a placeholder payload for the SPPG portal until Phase 3
func sppgOverview(w http.ResponseWriter, r *http.Request) {
	utils.Success(w, http.StatusOK, "sppg overview available", map[string]any{
		"role":  middlewares.Role(r.Context()),
		"actor": middlewares.UserID(r.Context()),
	})
}
