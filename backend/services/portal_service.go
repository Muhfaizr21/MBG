package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"fmt"
	"time"
)

type PortalService interface {
	GetSchools(ctx context.Context) ([]models.School, error)
	GetSchool(ctx context.Context, npsn string) (*models.School, error)
	GetMenuPackages(ctx context.Context) ([]models.MenuPackage, error)
	GetCalendarDays(ctx context.Context) ([]models.CalendarDay, error)
	GetDeliveries(ctx context.Context) ([]models.Delivery, error)
	GetSchedules(ctx context.Context) ([]models.Schedule, error)
	GetAttendances(ctx context.Context) ([]models.Attendance, error)
	GetNotices(ctx context.Context) ([]models.Notice, error)
	GetFeedbacks(ctx context.Context) ([]models.Feedback, error)
	SubmitFeedback(ctx context.Context, fb *models.Feedback) error
	GetReports(ctx context.Context) ([]models.Report, error)
	GetAdminMetrics(ctx context.Context) (*models.AdminDashboardMetrics, error)
}

type portalService struct {
	repo repositories.PortalRepository
}

func NewPortalService(repo repositories.PortalRepository) PortalService {
	return &portalService{repo: repo}
}

func (s *portalService) GetSchools(ctx context.Context) ([]models.School, error) {
	return s.repo.GetAllSchools(ctx)
}

func (s *portalService) GetSchool(ctx context.Context, npsn string) (*models.School, error) {
	return s.repo.GetSchoolByNPSN(ctx, npsn)
}

func (s *portalService) GetMenuPackages(ctx context.Context) ([]models.MenuPackage, error) {
	return s.repo.GetAllMenuPackages(ctx)
}

func (s *portalService) GetCalendarDays(ctx context.Context) ([]models.CalendarDay, error) {
	return s.repo.GetAllCalendarDays(ctx)
}

func (s *portalService) GetDeliveries(ctx context.Context) ([]models.Delivery, error) {
	return s.repo.GetAllDeliveries(ctx)
}

func (s *portalService) GetSchedules(ctx context.Context) ([]models.Schedule, error) {
	return s.repo.GetAllSchedules(ctx)
}

func (s *portalService) GetAttendances(ctx context.Context) ([]models.Attendance, error) {
	return s.repo.GetAllAttendances(ctx)
}

func (s *portalService) GetNotices(ctx context.Context) ([]models.Notice, error) {
	return s.repo.GetAllNotices(ctx)
}

func (s *portalService) GetFeedbacks(ctx context.Context) ([]models.Feedback, error) {
	return s.repo.GetAllFeedbacks(ctx)
}

func (s *portalService) SubmitFeedback(ctx context.Context, fb *models.Feedback) error {
	if fb.ID == "" {
		fb.ID = fmt.Sprintf("FB-%d", time.Now().UnixNano())
	}
	if fb.TicketNumber == "" {
		fb.TicketNumber = fmt.Sprintf("INC/BGN/%d", time.Now().Unix())
	}
	if fb.ReportedAt == "" {
		fb.ReportedAt = time.Now().Format("2006-01-02 15:04 WIB")
	}
	if fb.Status == "" {
		fb.Status = "open"
	}
	return s.repo.CreateFeedback(ctx, fb)
}

func (s *portalService) GetReports(ctx context.Context) ([]models.Report, error) {
	return s.repo.GetAllReports(ctx)
}

func (s *portalService) GetAdminMetrics(ctx context.Context) (*models.AdminDashboardMetrics, error) {
	return s.repo.GetAdminMetrics(ctx)
}
