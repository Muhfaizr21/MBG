package main

import (
	"backend/config"
	"backend/controllers"
	"backend/database"
	_ "backend/docs"
	"backend/middlewares"
	"backend/repositories"
	"backend/routes"
	"backend/services"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// @title           MBG Backend API
// @version         1.0
// @description     RESTful API Service built with Golang, Clean Code, and SOLID principles.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://localhost:8080
// @contact.email  support@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /
func main() {
	// 1. Load Configurations
	cfg := config.LoadConfig()

	bootCtx, bootCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer bootCancel()

	// 2. Connect database (PostgreSQL) + migrate + seed demo accounts
	if err := database.Connect(bootCtx, cfg); err != nil {
		log.Fatalf("Database connection failed: %v\n", err)
	}
	defer database.Close()

	if err := database.Migrate(bootCtx); err != nil {
		log.Fatalf("Migration failed: %v\n", err)
	}
	if err := database.MigrateExtended(bootCtx); err != nil {
		log.Fatalf("Extended migration failed: %v\n", err)
	}
	if err := database.Seed(bootCtx); err != nil {
		log.Fatalf("Seed failed: %v\n", err)
	}
	if err := database.SeedExtended(bootCtx); err != nil {
		log.Fatalf("Extended seed failed: %v\n", err)
	}
	if err := database.SeedNutrition(bootCtx, cfg.NutritionDataPath); err != nil {
		log.Fatalf("Seed nutrition failed: %v\n", err)
	}

	// 3. Initialize Repositories (Data Access Layer)
	itemRepo := repositories.NewInMemoryItemRepository()
	userRepo := repositories.NewUserRepository()
	scanRepo := repositories.NewScanRepository()
	nutritionRepo := repositories.NewNutritionRepository()
	portalRepo := repositories.NewPortalRepository()

	// 4. Initialize Services (Business Logic Layer - Dependency Inversion)
	itemService := services.NewItemService(itemRepo)
	authService := services.NewAuthService(
		userRepo,
		cfg.JWTSecret,
		time.Duration(cfg.JWTAccessTTLMinutes)*time.Minute,
		time.Duration(cfg.JWTRefreshTTLHours)*time.Hour,
	)
	nutritionService := services.NewNutritionService(nutritionRepo)
	scanService := services.NewScanService(scanRepo, cfg.AIBackendURL, nutritionService)
	portalService := services.NewPortalService(portalRepo)

	// 5. Initialize Controllers (Presentation / HTTP Layer)
	healthCtrl := controllers.NewHealthController()
	itemCtrl := controllers.NewItemController(itemService)
	authCtrl := controllers.NewAuthController(authService)
	scanCtrl := controllers.NewScanController(scanService)
	nutritionCtrl := controllers.NewNutritionController(nutritionService)
	portalCtrl := controllers.NewPortalController(portalService)

	// 6. Initialize Routes & Middlewares
	routerDeps := routes.RouterDependencies{
		HealthCtrl:    healthCtrl,
		ItemCtrl:      itemCtrl,
		AuthCtrl:      authCtrl,
		ScanCtrl:      scanCtrl,
		NutritionCtrl: nutritionCtrl,
		PortalCtrl:    portalCtrl,
		AuthMW:        middlewares.Auth(authService),
		CORSOrigins:   cfg.CORSOrigins,
	}
	handler := routes.SetupRoutes(routerDeps)

	// 7. Setup HTTP Server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 8. Start Server in Goroutine
	go func() {
		fmt.Printf("🚀 Backend running at http://localhost:%s (env: %s)\n", cfg.Port, cfg.AppEnv)
		fmt.Printf("📖 Swagger UI available at http://localhost:%s/swagger/index.html\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server startup failed: %v\n", err)
		}
	}()

	// 9. Graceful Shutdown on SIGINT / SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server exited successfully.")
}
