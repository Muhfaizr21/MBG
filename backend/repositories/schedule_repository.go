package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ScheduleRepository menyediakan abstraksi akses database untuk data jadwal distribusi & armada cold-chain MBG.
type ScheduleRepository interface {
	List(ctx context.Context, filter models.ScheduleFilter) ([]models.Schedule, error)
	GetByID(ctx context.Context, id string) (*models.Schedule, error)
	Reschedule(ctx context.Context, id string, req models.RescheduleRequest, actor models.User) (*models.Schedule, error)
	SendDelayAlert(ctx context.Context, id string, req models.DelayAlertRequest, actor models.User) (*models.Schedule, error)
	RerouteBackupFleet(ctx context.Context, id string, req models.RerouteRequest, actor models.User) (*models.Schedule, error)
	GetBackupFleets(ctx context.Context) ([]models.BackupFleet, error)
}

type postgresScheduleRepository struct {
	pool *pgxpool.Pool
}

// NewScheduleRepository membuat instance postgresScheduleRepository.
func NewScheduleRepository(pool *pgxpool.Pool) ScheduleRepository {
	if pool == nil {
		pool = database.Pool()
	}
	return &postgresScheduleRepository{pool: pool}
}

const baseScheduleSelect = `
	SELECT 
		s.id, COALESCE(s.school_id, ''), COALESCE(s.school_name, ''), COALESCE(s.npsn, ''),
		COALESCE(s.city, ''), s.portions, COALESCE(s.sppg_id, ''),
		COALESCE(k.name, 'SPPG Sentral BGN'), COALESCE(k.address, ''),
		COALESCE(s.route_name, ''), COALESCE(s.fleet_name, ''), COALESCE(s.license_plate, ''),
		COALESCE(s.driver_name, ''), COALESCE(s.driver_phone, ''),
		COALESCE(s.departure_time, ''), COALESCE(s.arrival_eta, ''), s.total_portions,
		s.status, COALESCE(s.status_label, ''), COALESCE(s.status_reason, ''),
		COALESCE(s.corridor_name, ''), s.distance_remaining_km,
		COALESCE(s.fleet, '{}'::jsonb),
		COALESCE(s.timestamps, '{}'::jsonb),
		COALESCE(s.validator_contact, '{}'::jsonb),
		COALESCE(s.target_schools, '[]'::jsonb),
		COALESCE(s.telemetry, '{}'::jsonb),
		s.created_at, COALESCE(s.updated_at, s.created_at)
	FROM schedules s
	LEFT JOIN sppg_kitchens k ON s.sppg_id = k.id
`

func scanSchedule(row pgx.Row) (*models.Schedule, error) {
	var s models.Schedule
	var sppgName, sppgAddr string
	var fleetRaw, timestampsRaw, valContactRaw, targetSchoolsRaw, telemetryRaw []byte

	err := row.Scan(
		&s.ID, &s.SchoolID, &s.SchoolName, &s.NPSN,
		&s.City, &s.Portions, &s.SPPGID,
		&sppgName, &sppgAddr,
		&s.RouteName, &s.FleetName, &s.LicensePlate,
		&s.DriverName, &s.DriverPhone,
		&s.DepartureTime, &s.ArrivalETA, &s.TotalPortions,
		&s.Status, &s.StatusLabel, &s.StatusReason,
		&s.CorridorName, &s.DistanceRemainingKm,
		&fleetRaw,
		&timestampsRaw,
		&valContactRaw,
		&targetSchoolsRaw,
		&telemetryRaw,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	s.SPPGSupplier = models.ScheduleSPPGSupplier{
		ID:      s.SPPGID,
		Name:    sppgName,
		Address: sppgAddr,
	}

	if len(fleetRaw) > 0 {
		_ = json.Unmarshal(fleetRaw, &s.Fleet)
	}
	if len(timestampsRaw) > 0 {
		_ = json.Unmarshal(timestampsRaw, &s.Timestamps)
	}
	if len(valContactRaw) > 0 {
		_ = json.Unmarshal(valContactRaw, &s.ValidatorContact)
	}

	s.TargetSchools = targetSchoolsRaw
	s.Telemetry = telemetryRaw

	// Sinkronisasi data fleet jika belum terisi dari JSONB
	if s.Fleet.PlateNumber == "" && s.LicensePlate != "" {
		s.Fleet.PlateNumber = s.LicensePlate
	}
	if s.Fleet.DriverName == "" && s.DriverName != "" {
		s.Fleet.DriverName = s.DriverName
	}
	if s.Fleet.DriverPhone == "" && s.DriverPhone != "" {
		s.Fleet.DriverPhone = s.DriverPhone
	}
	if s.Fleet.VehicleType == "" && s.FleetName != "" {
		s.Fleet.VehicleType = s.FleetName
	}

	// Sinkronisasi data timestamps jika belum terisi dari JSONB
	if s.Timestamps.DepartedAt == "" && s.DepartureTime != "" {
		s.Timestamps.DepartedAt = s.DepartureTime
	}
	if s.Timestamps.CurrentEta == "" && s.ArrivalETA != "" {
		s.Timestamps.CurrentEta = s.ArrivalETA
	}
	if s.Timestamps.TargetArrival == "" && s.ArrivalETA != "" {
		s.Timestamps.TargetArrival = s.ArrivalETA
	}

	return &s, nil
}

// List mengambil seluruh data jadwal distribusi dengan dukungan filter.
func (r *postgresScheduleRepository) List(ctx context.Context, filter models.ScheduleFilter) ([]models.Schedule, error) {
	var conditions []string
	var args []any
	argPos := 1

	if strings.TrimSpace(filter.Search) != "" {
		pattern := "%" + strings.TrimSpace(filter.Search) + "%"
		conditions = append(conditions, fmt.Sprintf(
			"(s.school_name ILIKE $%d OR s.npsn ILIKE $%d OR s.city ILIKE $%d OR s.driver_name ILIKE $%d OR s.license_plate ILIKE $%d OR s.route_name ILIKE $%d)",
			argPos, argPos, argPos, argPos, argPos, argPos,
		))
		args = append(args, pattern)
		argPos++
	}

	if strings.TrimSpace(filter.Status) != "" && filter.Status != "all" {
		conditions = append(conditions, fmt.Sprintf("s.status = $%d", argPos))
		args = append(args, strings.TrimSpace(filter.Status))
		argPos++
	}

	if strings.TrimSpace(filter.City) != "" && filter.City != "all" {
		conditions = append(conditions, fmt.Sprintf("s.city = $%d", argPos))
		args = append(args, strings.TrimSpace(filter.City))
		argPos++
	}

	if strings.TrimSpace(filter.SPPGID) != "" {
		conditions = append(conditions, fmt.Sprintf("s.sppg_id = $%d", argPos))
		args = append(args, strings.TrimSpace(filter.SPPGID))
		argPos++
	}

	query := baseScheduleSelect
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY s.id ASC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list schedules: %w", err)
	}
	defer rows.Close()

	var result []models.Schedule
	for rows.Next() {
		s, err := scanSchedule(rows)
		if err != nil {
			return nil, fmt.Errorf("scan schedule: %w", err)
		}
		result = append(result, *s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate schedules: %w", err)
	}

	return result, nil
}

// GetByID mengambil detail jadwal distribusi berdasarkan ID.
func (r *postgresScheduleRepository) GetByID(ctx context.Context, id string) (*models.Schedule, error) {
	query := baseScheduleSelect + " WHERE s.id = $1"
	row := r.pool.QueryRow(ctx, query, id)
	s, err := scanSchedule(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("jadwal dengan id '%s' tidak ditemukan: %w", id, pgx.ErrNoRows)
		}
		return nil, fmt.Errorf("get schedule by id: %w", err)
	}
	return s, nil
}

// Reschedule memperbarui jam kedatangan target & mencatat riwayat perubahan jadwal.
func (r *postgresScheduleRepository) Reschedule(ctx context.Context, id string, req models.RescheduleRequest, actor models.User) (*models.Schedule, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin reschedule tx: %w", err)
	}
	defer tx.Rollback(ctx)

	sched, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	effectiveDate := req.EffectiveDate
	if effectiveDate == "" {
		effectiveDate = "Hari Ini"
	}

	// Update timestamps
	newTargetTime := fmt.Sprintf("%s WIB", req.NewTime)
	sched.Timestamps.TargetArrival = newTargetTime
	sched.Timestamps.CurrentEta = newTargetTime
	sched.Timestamps.DelayMinutes = 0
	sched.Timestamps.RescheduledReason = &req.Reason

	timestampsJSON, err := json.Marshal(sched.Timestamps)
	if err != nil {
		return nil, fmt.Errorf("marshal timestamps: %w", err)
	}

	newStatus := "rescheduled"
	newStatusLabel := fmt.Sprintf("Jadwal Khusus (%s)", req.NewTime)
	newStatusReason := fmt.Sprintf("Disetujui jadwal baru pukul %s (%s) efektif per %s.", req.NewTime, req.Reason, effectiveDate)

	updateQuery := `
		UPDATE schedules
		SET status = $1, status_label = $2, status_reason = $3,
		    arrival_eta = $4, timestamps = $5, updated_at = NOW()
		WHERE id = $6
	`
	_, err = tx.Exec(ctx, updateQuery, newStatus, newStatusLabel, newStatusReason, newTargetTime, timestampsJSON, id)
	if err != nil {
		return nil, fmt.Errorf("update schedule reschedule: %w", err)
	}

	// Catat di audit_logs
	auditDetail, _ := json.Marshal(map[string]any{
		"scheduleId":    id,
		"schoolName":    sched.SchoolName,
		"npsn":          sched.NPSN,
		"newTime":       req.NewTime,
		"reason":        req.Reason,
		"effectiveDate": effectiveDate,
		"actorRole":     actor.Role,
	})
	auditID := "AUD-" + uuid.NewString()[:8]
	auditQuery := `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'schedule.reschedule', $3, $4, NOW())
	`
	if _, err := tx.Exec(ctx, auditQuery, auditID, actor.ID, id, string(auditDetail)); err != nil {
		return nil, fmt.Errorf("insert reschedule audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit reschedule tx: %w", err)
	}

	return r.GetByID(ctx, id)
}

// SendDelayAlert menyiarkan alert keterlambatan ke pihak sekolah dan mencatat ke audit log.
func (r *postgresScheduleRepository) SendDelayAlert(ctx context.Context, id string, req models.DelayAlertRequest, actor models.User) (*models.Schedule, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin delay alert tx: %w", err)
	}
	defer tx.Rollback(ctx)

	sched, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	sched.Timestamps.DelayMinutes = req.DelayMinutes
	timestampsJSON, err := json.Marshal(sched.Timestamps)
	if err != nil {
		return nil, fmt.Errorf("marshal timestamps: %w", err)
	}

	newStatus := "delayed_traffic"
	newStatusLabel := fmt.Sprintf("Peringatan Macet (+%dm)", req.DelayMinutes)
	newStatusReason := req.CustomMessage
	if newStatusReason == "" {
		newStatusReason = fmt.Sprintf("Peringatan keterlambatan diperkirakan +%d menit menuju sekolah penerima.", req.DelayMinutes)
	}

	updateQuery := `
		UPDATE schedules
		SET status = $1, status_label = $2, status_reason = $3,
		    timestamps = $4, updated_at = NOW()
		WHERE id = $5
	`
	_, err = tx.Exec(ctx, updateQuery, newStatus, newStatusLabel, newStatusReason, timestampsJSON, id)
	if err != nil {
		return nil, fmt.Errorf("update schedule delay alert: %w", err)
	}

	// Catat di audit_logs
	auditDetail, _ := json.Marshal(map[string]any{
		"scheduleId":    id,
		"schoolName":    sched.SchoolName,
		"delayMinutes":  req.DelayMinutes,
		"customMessage": req.CustomMessage,
		"actorRole":     actor.Role,
		"validatorName": sched.ValidatorContact.Name,
		"driverPhone":   sched.Fleet.DriverPhone,
	})
	auditID := "AUD-" + uuid.NewString()[:8]
	auditQuery := `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'schedule.delay_alert', $3, $4, NOW())
	`
	if _, err := tx.Exec(ctx, auditQuery, auditID, actor.ID, id, string(auditDetail)); err != nil {
		return nil, fmt.Errorf("insert delay alert audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit delay alert tx: %w", err)
	}

	return r.GetByID(ctx, id)
}

// standardBackupFleets data armada cadangan MBG yang siaga di pool wilayah operasional.
var standardBackupFleets = []models.BackupFleet{
	{
		VehicleID:        "FLT-BCK-01",
		PlateNumber:      "B 9901 RES",
		DriverName:       "Teguh Prasetyo",
		Phone:            "0812-1188-7766",
		DepotLocation:    "Pool Sentral Jakarta Pusat",
		StandbyCity:      "Jakarta Pusat",
		CapacityPortions: 800,
		EtaToScene:       "12 menit",
	},
	{
		VehicleID:        "FLT-BCK-02",
		PlateNumber:      "D 8802 CAD",
		DriverName:       "Ujang Sujana",
		Phone:            "0818-4455-6677",
		DepotLocation:    "Pool Rekanan Priangan Bandung",
		StandbyCity:      "Bandung",
		CapacityPortions: 650,
		EtaToScene:       "15 menit",
	},
	{
		VehicleID:        "FLT-BCK-03",
		PlateNumber:      "L 9903 SBY",
		DriverName:       "Slamet Riyadi",
		Phone:            "0813-2211-9988",
		DepotLocation:    "Pool Siaga Darmo Surabaya",
		StandbyCity:      "Surabaya",
		CapacityPortions: 900,
		EtaToScene:       "10 menit",
	},
	{
		VehicleID:        "FLT-BCK-04",
		PlateNumber:      "DD 8804 MKS",
		DriverName:       "Syamsul Bahri",
		Phone:            "0852-7788-9900",
		DepotLocation:    "Pool Siaga Sudirman Makassar",
		StandbyCity:      "Makassar",
		CapacityPortions: 750,
		EtaToScene:       "8 menit",
	},
}

// GetBackupFleets mengembalikan daftar armada cadangan yang siaga.
func (r *postgresScheduleRepository) GetBackupFleets(ctx context.Context) ([]models.BackupFleet, error) {
	return standardBackupFleets, nil
}

// RerouteBackupFleet mengalihkan muatan armada yang bermasalah ke armada cadangan yang siaga.
func (r *postgresScheduleRepository) RerouteBackupFleet(ctx context.Context, id string, req models.RerouteRequest, actor models.User) (*models.Schedule, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin reroute tx: %w", err)
	}
	defer tx.Rollback(ctx)

	sched, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cari armada cadangan
	var backup models.BackupFleet
	found := false
	for _, b := range standardBackupFleets {
		if b.VehicleID == req.BackupFleetID {
			backup = b
			found = true
			break
		}
	}
	if !found {
		backup = standardBackupFleets[0]
	}

	oldPlate := sched.Fleet.PlateNumber
	oldLocation := sched.Fleet.GpsLocation
	if oldLocation == "" {
		oldLocation = "Lokasi Kendala"
	}

	// Perbarui fleet objek
	sched.Fleet.VehicleID = backup.VehicleID
	sched.Fleet.PlateNumber = backup.PlateNumber
	sched.Fleet.DriverName = backup.DriverName
	sched.Fleet.DriverPhone = backup.Phone
	sched.Fleet.VehicleType = "Van Insulasi Cadangan Evakuasi"
	sched.Fleet.Status = "moving"
	sched.Fleet.CurrentSpeed = "42 km/h (Mendekat)"
	sched.Fleet.CargoTempCelsius = 64.0
	sched.Fleet.LastGpsPing = "Baru saja"
	sched.Fleet.GpsLocation = fmt.Sprintf("Menuju lokasi evakuasi muatan di %s", oldLocation)

	fleetJSON, err := json.Marshal(sched.Fleet)
	if err != nil {
		return nil, fmt.Errorf("marshal fleet: %w", err)
	}

	// Perbarui timestamps
	sched.Timestamps.CurrentEta = "07:28 WIB (Estimasi Cadangan)"
	sched.Timestamps.DelayMinutes = 15
	timestampsJSON, err := json.Marshal(sched.Timestamps)
	if err != nil {
		return nil, fmt.Errorf("marshal timestamps: %w", err)
	}

	newStatus := "on_time"
	newStatusLabel := "Armada Pengganti Diterjunkan"
	newStatusReason := fmt.Sprintf("Armada cadangan %s (%s) mengambil alih muatan dari %s. Catatan: %s", backup.PlateNumber, backup.DriverName, oldPlate, req.Notes)

	updateQuery := `
		UPDATE schedules
		SET status = $1, status_label = $2, status_reason = $3,
		    fleet_name = $4, license_plate = $5, driver_name = $6, driver_phone = $7,
		    arrival_eta = $8, fleet = $9, timestamps = $10, updated_at = NOW()
		WHERE id = $11
	`
	_, err = tx.Exec(
		ctx, updateQuery,
		newStatus, newStatusLabel, newStatusReason,
		sched.Fleet.VehicleType, backup.PlateNumber, backup.DriverName, backup.Phone,
		sched.Timestamps.CurrentEta, fleetJSON, timestampsJSON, id,
	)
	if err != nil {
		return nil, fmt.Errorf("update schedule reroute: %w", err)
	}

	// Catat di audit_logs
	auditDetail, _ := json.Marshal(map[string]any{
		"scheduleId":     id,
		"schoolName":     sched.SchoolName,
		"oldPlateNumber": oldPlate,
		"newPlateNumber": backup.PlateNumber,
		"backupFleetId":  backup.VehicleID,
		"driverName":     backup.DriverName,
		"notes":          req.Notes,
		"actorRole":      actor.Role,
	})
	auditID := "AUD-" + uuid.NewString()[:8]
	auditQuery := `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'schedule.reroute', $3, $4, NOW())
	`
	if _, err := tx.Exec(ctx, auditQuery, auditID, actor.ID, id, string(auditDetail)); err != nil {
		return nil, fmt.Errorf("insert reroute audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit reroute tx: %w", err)
	}

	return r.GetByID(ctx, id)
}
