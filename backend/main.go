package main

import (
	"backend/config"
	"backend/controllers"
	_ "backend/docs"
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

	// 2. Initialize Repositories (Data Access Layer)
	itemRepo := repositories.NewInMemoryItemRepository()

	// 3. Initialize Services (Business Logic Layer - Dependency Inversion)
	itemService := services.NewItemService(itemRepo)

	// 4. Initialize Controllers (Presentation / HTTP Layer)
	healthCtrl := controllers.NewHealthController()
	itemCtrl := controllers.NewItemController(itemService)

	// 5. Initialize Routes & Middlewares
	routerDeps := routes.RouterDependencies{
		HealthCtrl: healthCtrl,
		ItemCtrl:   itemCtrl,
	}
	handler := routes.SetupRoutes(routerDeps)

	// 6. Setup HTTP Server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 7. Start Server in Goroutine
	go func() {
		fmt.Printf("🚀 Backend running at http://localhost:%s (env: %s)\n", cfg.Port, cfg.AppEnv)
		fmt.Printf("📖 Swagger UI available at http://localhost:%s/swagger/index.html\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server startup failed: %v\n", err)
		}
	}()

	// 8. Graceful Shutdown on SIGINT / SIGTERM
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
