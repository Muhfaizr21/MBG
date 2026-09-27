package routes

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type RouterDependencies struct {
	HealthCtrl *controllers.HealthController
	ItemCtrl   *controllers.ItemController
}

// SetupRoutes registers all application routes and returns a configured handler
func SetupRoutes(deps RouterDependencies) http.Handler {
	mux := http.NewServeMux()

	// Swagger documentation route
	mux.Handle("/swagger/", httpSwagger.WrapHandler)

	// Root route (exact match using /{$} in Go 1.22+)
	mux.HandleFunc("GET /{$}", deps.HealthCtrl.Root)
	mux.HandleFunc("GET /api/health", deps.HealthCtrl.HealthCheck)

	// Item resource routes (CRUD)
	mux.HandleFunc("GET /api/items", deps.ItemCtrl.GetAll)
	mux.HandleFunc("GET /api/items/{id}", deps.ItemCtrl.GetByID)
	mux.HandleFunc("POST /api/items", deps.ItemCtrl.Create)
	mux.HandleFunc("DELETE /api/items/{id}", deps.ItemCtrl.Delete)

	// Apply Middlewares (Chain: Logger -> CORS -> Mux)
	handler := middlewares.Logger(middlewares.CORS(mux))

	return handler
}
