package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// SppgLogisticsRepository mendefinisikan operasi persistensi database armada & logistik pengantaran MBG.
type SppgLogisticsRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgLogisticsBundle, error)
	ListFleets(ctx context.Context, sppgID string) ([]models.SppgFleet, error)
	GetFleet(ctx context.Context, id, sppgID string) (*models.SppgFleet, error)
	CreateFleet(ctx context.Context, fleet *models.SppgFleet) error
	UpdateTelemetry(ctx context.Context, id, sppgID string, payload *models.UpdateFleetTelemetryPayload) error
	DispatchBackup(ctx context.Context, sppgID, troubledFleetID, actorName string) (*models.SppgFleet, error)
	CreateNotification(ctx context.Context, notif *models.SppgDeliveryNotification) error
	SuperadminIntervention(ctx context.Context, sppgID, fleetID, action, reason, actorID, actorName string) error
}

type pgSppgLogisticsRepository struct{}

// NewSppgLogisticsRepository membuat instance repository baru berbasis PostgreSQL.
func NewSppgLogisticsRepository() SppgLogisticsRepository {
	return &pgSppgLogisticsRepository{}
}

func (r *pgSppgLogisticsRepository) scanFleet(row pgx.Row) (*models.SppgFleet, error) {
	var f models.SppgFleet
	var tempBytes []byte
	err := row.Scan(
		&f.ID, &f.SppgID, &f.Plate, &f.Type, &f.Driver, &f.DriverPhone, &f.EmergencyPhone,
		&f.SchoolID, &f.SchoolName, &f.SchoolLat, &f.SchoolLng, &f.BatchToken, &f.BoxCount,
		&f.DistanceKm, &f.SpeedKph, &f.DepartAt, &f.Progress, &f.Status, &f.BoxTempC,
		&f.IsBackup, &f.CurrentLat, &f.CurrentLng, &tempBytes, &f.DispatchedAt, &f.DispatchedBy,
		&f.CreatedAt, &f.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if len(tempBytes) > 0 {
		_ = json.Unmarshal(tempBytes, &f.TempSeries)
	}
	if f.TempSeries == nil {
		f.TempSeries = []models.TempReading{}
	}
	return &f, nil
}

const fleetColumns = `
	id, sppg_id, plate, vehicle_type, driver_name, driver_phone, emergency_phone,
	school_id, school_name, school_lat, school_lng, batch_token, box_count,
	distance_km, speed_kph, depart_at, progress, status, box_temp_c,
	is_backup, current_lat, current_lng, temp_series, dispatched_at, dispatched_by,
	created_at, updated_at
`

func (r *pgSppgLogisticsRepository) ListFleets(ctx context.Context, sppgID string) ([]models.SppgFleet, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_fleets
		WHERE sppg_id = $1
		ORDER BY is_backup ASC, id ASC
	`, fleetColumns)

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list fleets failed: %w", err)
	}
	defer rows.Close()

	var list []models.SppgFleet
	for rows.Next() {
		var f models.SppgFleet
		var tempBytes []byte
		err := rows.Scan(
			&f.ID, &f.SppgID, &f.Plate, &f.Type, &f.Driver, &f.DriverPhone, &f.EmergencyPhone,
			&f.SchoolID, &f.SchoolName, &f.SchoolLat, &f.SchoolLng, &f.BatchToken, &f.BoxCount,
			&f.DistanceKm, &f.SpeedKph, &f.DepartAt, &f.Progress, &f.Status, &f.BoxTempC,
			&f.IsBackup, &f.CurrentLat, &f.CurrentLng, &tempBytes, &f.DispatchedAt, &f.DispatchedBy,
			&f.CreatedAt, &f.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan fleet failed: %w", err)
		}
		if len(tempBytes) > 0 {
			_ = json.Unmarshal(tempBytes, &f.TempSeries)
		}
		if f.TempSeries == nil {
			f.TempSeries = []models.TempReading{}
		}
		list = append(list, f)
	}
	if list == nil {
		list = []models.SppgFleet{}
	}
	return list, nil
}

func (r *pgSppgLogisticsRepository) GetFleet(ctx context.Context, id, sppgID string) (*models.SppgFleet, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_fleets
		WHERE id = $1 AND sppg_id = $2
	`, fleetColumns)

	row := database.Pool().QueryRow(ctx, query, id, sppgID)
	return r.scanFleet(row)
}

func (r *pgSppgLogisticsRepository) CreateFleet(ctx context.Context, f *models.SppgFleet) error {
	if f.ID == "" {
		f.ID = fmt.Sprintf("fl-%d", time.Now().UnixMilli())
	}
	tempJSON, err := json.Marshal(f.TempSeries)
	if err != nil {
		tempJSON = []byte("[]")
	}

	query := `
		INSERT INTO sppg_fleets (
			id, sppg_id, plate, vehicle_type, driver_name, driver_phone, emergency_phone,
			school_id, school_name, school_lat, school_lng, batch_token, box_count,
			distance_km, speed_kph, depart_at, progress, status, box_temp_c,
			is_backup, current_lat, current_lng, temp_series, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW()
		)
	`
	_, err = database.Pool().Exec(
		ctx, query,
		f.ID, f.SppgID, f.Plate, f.Type, f.Driver, f.DriverPhone, f.EmergencyPhone,
		f.SchoolID, f.SchoolName, f.SchoolLat, f.SchoolLng, f.BatchToken, f.BoxCount,
		f.DistanceKm, f.SpeedKph, f.DepartAt, f.Progress, f.Status, f.BoxTempC,
		f.IsBackup, f.CurrentLat, f.CurrentLng, tempJSON,
	)
	return err
}

func (r *pgSppgLogisticsRepository) UpdateTelemetry(ctx context.Context, id, sppgID string, payload *models.UpdateFleetTelemetryPayload) error {
	f, err := r.GetFleet(ctx, id, sppgID)
	if err != nil {
		return err
	}

	// Tambahkan time series titik baru jika ada timeTick
	series := f.TempSeries
	if payload.TimeTick != "" {
		series = append(series, models.TempReading{
			T:    payload.TimeTick,
			Temp: payload.BoxTempC,
		})
		if len(series) > 10 {
			series = series[len(series)-10:]
		}
	}
	seriesJSON, _ := json.Marshal(series)

	newStatus := payload.Status
	if newStatus == "" {
		newStatus = f.Status
	}

	query := `
		UPDATE sppg_fleets
		SET speed_kph = $1,
		    progress = $2,
		    status = $3,
		    box_temp_c = $4,
		    temp_series = $5,
		    updated_at = NOW()
		WHERE id = $6 AND sppg_id = $7
	`
	res, err := database.Pool().Exec(
		ctx, query,
		int(payload.SpeedKph), payload.Progress, newStatus, payload.BoxTempC,
		seriesJSON, id, sppgID,
	)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("armada tidak ditemukan")
	}
	return nil
}

func (r *pgSppgLogisticsRepository) DispatchBackup(ctx context.Context, sppgID, troubledFleetID, actorName string) (*models.SppgFleet, error) {
	// Ambil data armada bermasalah
	troubled, err := r.GetFleet(ctx, troubledFleetID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("armada bermasalah tidak ditemukan: %w", err)
	}

	// Cari armada cadangan aktif yang bersatus 'siaga'
	var backupID string
	err = database.Pool().QueryRow(ctx, `
		SELECT id FROM sppg_fleets
		WHERE sppg_id = $1 AND is_backup = true AND status = 'siaga'
		LIMIT 1
	`, sppgID).Scan(&backupID)
	if err != nil {
		return nil, errors.New("tidak ada armada cadangan yang berstatus 'siaga' di dapur ini")
	}

	// Mulai Transaksi Atomic
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Ubah armada bermasalah menjadi 'kembali' ke dapur
	_, err = tx.Exec(ctx, `
		UPDATE sppg_fleets
		SET status = 'kembali', speed_kph = 0, updated_at = NOW()
		WHERE id = $1 AND sppg_id = $2
	`, troubledFleetID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("update troubled fleet failed: %w", err)
	}

	// 2. Terjunkan armada cadangan mengambil alih sekolah tujuan dan muatan
	now := time.Now()
	departClock := now.Format("15:04")
	_, err = tx.Exec(ctx, `
		UPDATE sppg_fleets
		SET status = 'jalan',
		    school_id = $1,
		    school_name = $2,
		    school_lat = $3,
		    school_lng = $4,
		    batch_token = $5,
		    box_count = $6,
		    distance_km = $7,
		    speed_kph = 30,
		    depart_at = $8,
		    progress = 0.05,
		    box_temp_c = $9,
		    dispatched_at = NOW(),
		    dispatched_by = $10,
		    updated_at = NOW()
		WHERE id = $11 AND sppg_id = $12
	`, troubled.SchoolID, troubled.SchoolName, troubled.SchoolLat, troubled.SchoolLng,
		troubled.BatchToken, troubled.BoxCount, troubled.DistanceKm,
		departClock, troubled.BoxTempC, actorName, backupID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("dispatch backup fleet failed: %w", err)
	}

	// 3. Tulis Jejak Audit Forensik
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":          "fleet.dispatch_backup",
		"troubledFleetId": troubledFleetID,
		"backupFleetId":   backupID,
		"schoolName":      troubled.SchoolName,
		"batchToken":      troubled.BatchToken,
		"dispatchedBy":    actorName,
	})
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'logistics.dispatch_backup', $3, $4, NOW())
	`, auditID, sppgID, troubled.Plate, string(detailJSON))

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetFleet(ctx, backupID, sppgID)
}

func (r *pgSppgLogisticsRepository) CreateNotification(ctx context.Context, notif *models.SppgDeliveryNotification) error {
	if notif.ID == "" {
		notif.ID = fmt.Sprintf("notif-%d", time.Now().UnixMilli())
	}
	query := `
		INSERT INTO sppg_delivery_notifications (
			id, sppg_id, fleet_id, school_id, school_name, recipient_phone, message, sent_by, sent_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, NOW()
		)
	`
	_, err := database.Pool().Exec(
		ctx, query,
		notif.ID, notif.SppgID, notif.FleetID, notif.SchoolID, notif.SchoolName,
		notif.RecipientPhone, notif.Message, notif.SentBy,
	)
	return err
}

func (r *pgSppgLogisticsRepository) SuperadminIntervention(ctx context.Context, sppgID, fleetID, action, reason, actorID, actorName string) error {
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"module":       "logistics_control",
		"action":       action,
		"fleetId":      fleetID,
		"reason":       reason,
		"intervenedBy": actorName,
		"timestamp":    time.Now().Format(time.RFC3339),
	})

	// 1. Tulis audit forensik
	_, err := database.Pool().Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, auditID, actorID, "logistics."+action, fleetID, string(detailJSON))
	if err != nil {
		return fmt.Errorf("audit log failed: %w", err)
	}

	// 2. Jika aksi adalah recall, putar balik armada ke dapur
	if action == "recall" {
		_, err = database.Pool().Exec(ctx, `
			UPDATE sppg_fleets
			SET status = 'kembali', speed_kph = 0, updated_at = NOW()
			WHERE id = $1 AND sppg_id = $2
		`, fleetID, sppgID)
		if err != nil {
			return fmt.Errorf("recall fleet failed: %w", err)
		}
	}
	return nil
}

func (r *pgSppgLogisticsRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgLogisticsBundle, error) {
	// 1. Info Dapur & Titik Koordinat Depot
	var kitchenCode, kitchenName, coordinates string
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name, coordinates FROM sppg_kitchens WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName, &coordinates)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
		coordinates = "-6.1955, 106.8305"
	}

	depotLat := -6.1955
	depotLng := 106.8305
	coordsParts := strings.Split(coordinates, ",")
	if len(coordsParts) == 2 {
		if lat, err := strconv.ParseFloat(strings.TrimSpace(coordsParts[0]), 64); err == nil {
			depotLat = lat
		}
		if lng, err := strconv.ParseFloat(strings.TrimSpace(coordsParts[1]), 64); err == nil {
			depotLng = lng
		}
	}

	depot := models.DepotInfo{
		ID:   sppgID,
		Name: kitchenName,
		Lat:  depotLat,
		Lng:  depotLng,
	}

	// 2. Daftar Armada Aktif & Cadangan
	allFleets, err := r.ListFleets(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	var activeFleets []models.SppgFleet
	var backupFleet *models.SppgFleet

	for _, f := range allFleets {
		if f.IsBackup {
			cp := f
			backupFleet = &cp
		} else {
			activeFleets = append(activeFleets, f)
		}
	}
	if activeFleets == nil {
		activeFleets = []models.SppgFleet{}
	}

	// 3. Sekolah Binaan Dapur Ini
	schoolCoords := make(map[string]models.SchoolCoord)
	schoolRows, err := database.Pool().Query(ctx, `
		SELECT id, name, lat, lng FROM schools WHERE sppg_id = $1
	`, sppgID)
	if err == nil {
		defer schoolRows.Close()
		for schoolRows.Next() {
			var sc models.SchoolCoord
			if err := schoolRows.Scan(&sc.ID, &sc.Name, &sc.Lat, &sc.Lng); err == nil {
				schoolCoords[sc.ID] = sc
			}
		}
	}

	// 4. Hitung Metrik Ringkasan (Moving, OnTime, Issues, Cold)
	sessionClock := time.Now().Format("15:04")
	if sessionClock < "06:00" || sessionClock > "14:00" {
		sessionClock = "07:02"
	}

	nowMinutes := toMinutes(sessionClock)
	latestArrivalMinutes := toMinutes("07:15")

	movingCount := 0
	onTimeCount := 0
	issuesCount := 0
	coldCount := 0

	for _, f := range activeFleets {
		if f.Status == "jalan" {
			movingCount++
		}
		if f.BoxTempC < 60.0 {
			coldCount++
		}

		// Hitung ETA & Tepat Waktu
		hasIssue := false
		if f.Status == "mogok" || f.Status == "macet" || f.BoxTempC < 60.0 {
			hasIssue = true
		}
		if f.SpeedKph > 0 {
			remainingKm := f.DistanceKm * (1.0 - f.Progress)
			etaMins := int((remainingKm / float64(f.SpeedKph)) * 60.0)
			arrivalMin := nowMinutes + etaMins
			if arrivalMin <= latestArrivalMinutes {
				onTimeCount++
			} else {
				hasIssue = true
			}
		} else {
			hasIssue = true
		}

		if hasIssue {
			issuesCount++
		}
	}

	stats := models.SppgLogisticsStats{
		Moving: movingCount,
		Total:  len(activeFleets),
		OnTime: onTimeCount,
		Issues: issuesCount,
		Cold:   coldCount,
	}

	// 5. Active Batches dari tabel sppg_batches
	batchRows, err := database.Pool().Query(ctx, `
		SELECT token FROM sppg_batches WHERE sppg_id = $1 ORDER BY seq DESC LIMIT 15
	`, sppgID)
	var activeBatches []string
	if err == nil {
		defer batchRows.Close()
		for batchRows.Next() {
			var tok string
			if err := batchRows.Scan(&tok); err == nil && tok != "" {
				activeBatches = append(activeBatches, tok)
			}
		}
	}

	return &models.SppgLogisticsBundle{
		SppgID:        sppgID,
		KitchenName:   kitchenName,
		KitchenCode:   kitchenCode,
		Depot:         depot,
		LatestArrival: "07:15",
		TempFloor:     60.0,
		SessionClock:  sessionClock,
		Stats:         stats,
		Fleets:        activeFleets,
		BackupFleet:   backupFleet,
		SchoolCoords:  schoolCoords,
		ActiveBatches: activeBatches,
	}, nil
}

func toMinutes(clock string) int {
	parts := strings.Split(clock, ":")
	if len(parts) != 2 {
		return 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h*60 + m
}
