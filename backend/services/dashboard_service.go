package services

import (
	"context"

	"backend/models"
	"backend/repositories"
)

type DashboardService interface {
	GetDashboardBundle(ctx context.Context) (*models.AdminDashboardBundle, error)
	GetKPIs(ctx context.Context) (*models.DashboardKPIs, error)
}

type dashboardService struct {
	repo repositories.DashboardRepository
}

func NewDashboardService(repo repositories.DashboardRepository) DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetDashboardBundle(ctx context.Context) (*models.AdminDashboardBundle, error) {
	return s.repo.GetDashboardBundle(ctx)
}

func (s *dashboardService) GetKPIs(ctx context.Context) (*models.DashboardKPIs, error) {
	return s.repo.GetKPIs(ctx)
}
