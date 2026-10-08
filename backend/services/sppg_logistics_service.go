package services

import (
	"backend/models"
	"backend/repositories"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

// SppgLogisticsService mendefinisikan kontrak layanan bisnis logistik rute dan armada SPPG.
type SppgLogisticsService interface {
	GetLogisticsBundle(ctx context.Context, sppgID string) (*models.SppgLogisticsBundle, error)
	ListFleets(ctx context.Context, sppgID string) ([]models.SppgFleet, error)
	CreateFleet(ctx context.Context, sppgID string, req *models.CreateFleetPayload) (*models.SppgFleet, error)
	UpdateTelemetry(ctx context.Context, id, sppgID string, req *models.UpdateFleetTelemetryPayload) error
	DispatchBackup(ctx context.Context, sppgID, troubledFleetID, actorName string) (*models.SppgFleet, error)
	SendNotification(ctx context.Context, sppgID, fleetID string, req *models.SendNotificationPayload, actorName string) (*models.SppgDeliveryNotification, error)
	SuperadminIntervention(ctx context.Context, sppgID string, req *models.SuperadminLogisticsInterventionPayload, actorID, actorRole, actorName string) error
}

type sppgLogisticsService struct {
	repo repositories.SppgLogisticsRepository
}

// NewSppgLogisticsService membuat instance layanan logistik SPPG baru (Constructor DI).
func NewSppgLogisticsService(repo repositories.SppgLogisticsRepository) SppgLogisticsService {
	return &sppgLogisticsService{repo: repo}
}

func (s *sppgLogisticsService) GetLogisticsBundle(ctx context.Context, sppgID string) (*models.SppgLogisticsBundle, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.GetBundle(ctx, sppgID)
}

func (s *sppgLogisticsService) ListFleets(ctx context.Context, sppgID string) ([]models.SppgFleet, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	return s.repo.ListFleets(ctx, sppgID)
}

func (s *sppgLogisticsService) CreateFleet(ctx context.Context, sppgID string, req *models.CreateFleetPayload) (*models.SppgFleet, error) {
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	plate := strings.TrimSpace(strings.ToUpper(req.Plate))
	if plate == "" {
		return nil, errors.New("nomor pelat kendaraan wajib diisi")
	}

	driver := strings.TrimSpace(req.Driver)
	if driver == "" {
		return nil, errors.New("nama pengemudi / sopir wajib diisi")
	}

	vehicleType := strings.TrimSpace(req.Type)
	if vehicleType == "" {
		vehicleType = "Mobil boks insulasi termal"
	}

	boxTempC := req.BoxTempC
	if boxTempC <= 0 {
		boxTempC = 64.0
	}

	now := time.Now()
	fleetID := fmt.Sprintf("fl-%d", now.UnixMilli())
	departAt := req.DepartAt
	if departAt == "" {
		departAt = now.Format("15:04")
	}

	fleet := &models.SppgFleet{
		ID:             fleetID,
		SppgID:         sppgID,
		Plate:          plate,
		Type:           vehicleType,
		Driver:         driver,
		DriverPhone:    strings.TrimSpace(req.DriverPhone),
		EmergencyPhone: strings.TrimSpace(req.EmergencyPhone),
		SchoolID:       strings.TrimSpace(req.SchoolID),
		BatchToken:     strings.TrimSpace(strings.ToUpper(req.BatchToken)),
		BoxCount:       req.BoxCount,
		DistanceKm:     req.DistanceKm,
		SpeedKph:       req.SpeedKph,
		DepartAt:       departAt,
		Progress:       0.0,
		Status:         "jalan",
		BoxTempC:       boxTempC,
		IsBackup:       req.IsBackup,
		TempSeries: []models.TempReading{
			{T: departAt, Temp: boxTempC},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if req.IsBackup {
		fleet.Status = "siaga"
		fleet.SchoolID = ""
		fleet.BatchToken = ""
		fleet.BoxCount = 0
		fleet.Progress = 0.0
	}

	if err := s.repo.CreateFleet(ctx, fleet); err != nil {
		return nil, fmt.Errorf("gagal mendaftarkan armada: %w", err)
	}

	return fleet, nil
}

func (s *sppgLogisticsService) UpdateTelemetry(ctx context.Context, id, sppgID string, req *models.UpdateFleetTelemetryPayload) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("ID armada wajib disertakan")
	}
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	if req.Progress < 0 || req.Progress > 1.0 {
		return errors.New("nilai progres pengantaran harus di antara 0.0 sampai 1.0")
	}
	if req.SpeedKph < 0 {
		return errors.New("kecepatan armada tidak boleh negatif")
	}

	status := strings.TrimSpace(strings.ToLower(req.Status))
	if status == "" {
		if req.SpeedKph == 0 {
			status = "macet"
		} else {
			status = "jalan"
		}
	}

	return s.repo.UpdateTelemetry(ctx, id, sppgID, req)
}

func (s *sppgLogisticsService) DispatchBackup(ctx context.Context, sppgID, troubledFleetID, actorName string) (*models.SppgFleet, error) {
	if strings.TrimSpace(troubledFleetID) == "" {
		return nil, errors.New("ID armada yang mengalami kendala wajib diisi")
	}
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}
	if strings.TrimSpace(actorName) == "" {
		actorName = "Koordinator Logistik SPPG"
	}

	return s.repo.DispatchBackup(ctx, sppgID, troubledFleetID, actorName)
}

func (s *sppgLogisticsService) SendNotification(ctx context.Context, sppgID, fleetID string, req *models.SendNotificationPayload, actorName string) (*models.SppgDeliveryNotification, error) {
	if strings.TrimSpace(fleetID) == "" {
		return nil, errors.New("ID armada wajib diisi")
	}
	if strings.TrimSpace(sppgID) == "" {
		sppgID = "SPPG-01"
	}

	msg := strings.TrimSpace(req.Message)
	if len(msg) < 5 {
		return nil, errors.New("isi pesan notifikasi estimasi tiba wajib minimal 5 karakter")
	}

	fleet, err := s.repo.GetFleet(ctx, fleetID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("armada tidak ditemukan: %w", err)
	}

	notif := &models.SppgDeliveryNotification{
		ID:             fmt.Sprintf("notif-%d", time.Now().UnixMilli()),
		SppgID:         sppgID,
		FleetID:        fleetID,
		SchoolID:       fleet.SchoolID,
		SchoolName:     fleet.SchoolName,
		RecipientPhone: strings.TrimSpace(req.RecipientPhone),
		Message:        msg,
		SentBy:         actorName,
		SentAt:         time.Now(),
	}

	if err := s.repo.CreateNotification(ctx, notif); err != nil {
		return nil, fmt.Errorf("gagal menyimpan siar notifikasi: %w", err)
	}

	return notif, nil
}

func (s *sppgLogisticsService) SuperadminIntervention(ctx context.Context, sppgID string, req *models.SuperadminLogisticsInterventionPayload, actorID, actorRole, actorName string) error {
	if actorRole != models.RoleSuperadmin {
		return errors.New("hanya Superadmin BGN yang berwenang melakukan tindakan intervensi logistik")
	}

	fleetID := strings.TrimSpace(req.FleetID)
	if fleetID == "" {
		return errors.New("ID armada sasaran intervensi wajib dicantumkan")
	}

	reason := strings.TrimSpace(req.Reason)
	if len(reason) < 5 {
		return errors.New("alasan tindakan intervensi logistik wajib diisi minimal 5 karakter")
	}

	action := strings.TrimSpace(strings.ToLower(req.Action))
	if action != "recall" && action != "reroute" && action != "cooling_check" {
		return errors.New("aksi intervensi logistik harus 'recall', 'reroute', atau 'cooling_check'")
	}

	return s.repo.SuperadminIntervention(ctx, sppgID, fleetID, action, reason, actorID, actorName)
}
