package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"fmt"
)

type PortalRepository interface {
	GetAllSchools(ctx context.Context) ([]models.School, error)
	GetSchoolByNPSN(ctx context.Context, npsn string) (*models.School, error)
	GetAllSPPGs(ctx context.Context) ([]models.SPPGKitchen, error)
	GetSPPGByID(ctx context.Context, id string) (*models.SPPGKitchen, error)
	GetAllMenuPackages(ctx context.Context) ([]models.MenuPackage, error)
	GetAllCalendarDays(ctx context.Context) ([]models.CalendarDay, error)
	GetAllDeliveries(ctx context.Context) ([]models.Delivery, error)
	GetAllSchedules(ctx context.Context) ([]models.Schedule, error)
	GetAllAttendances(ctx context.Context) ([]models.Attendance, error)
	GetAllNotices(ctx context.Context) ([]models.Notice, error)
	GetAllFeedbacks(ctx context.Context) ([]models.Feedback, error)
	CreateFeedback(ctx context.Context, fb *models.Feedback) error
	GetAllReports(ctx context.Context) ([]models.Report, error)
	GetAllValidators(ctx context.Context) ([]models.ValidatorProfile, error)
	GetAdminMetrics(ctx context.Context) (*models.AdminDashboardMetrics, error)
}

type postgresPortalRepository struct{}

func NewPortalRepository() PortalRepository {
	return &postgresPortalRepository{}
}

func (r *postgresPortalRepository) GetAllSchools(ctx context.Context) ([]models.School, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT npsn, id, name, level, status, status_label, status_reason, address, city, district,
		       lat, lng, principal_name, principal_nip, principal_phone, principal_email,
		       total_students, total_calorie_target, dietary_notes, COALESCE(sppg_id, ''),
		       acceptance_rate, avg_arrival_time, created_at
		FROM schools ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("query schools: %w", err)
	}
	defer rows.Close()

	var list []models.School
	for rows.Next() {
		var s models.School
		if err := rows.Scan(
			&s.NPSN, &s.ID, &s.Name, &s.Level, &s.Status, &s.StatusLabel, &s.StatusReason,
			&s.Address, &s.City, &s.District, &s.Lat, &s.Lng,
			&s.PrincipalName, &s.PrincipalNIP, &s.PrincipalPhone, &s.PrincipalEmail,
			&s.TotalStudents, &s.TotalCalorieTarget, &s.DietaryNotes, &s.SPPGID,
			&s.AcceptanceRate, &s.AvgArrivalTime, &s.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan school: %w", err)
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetSchoolByNPSN(ctx context.Context, npsn string) (*models.School, error) {
	var s models.School
	err := database.Pool().QueryRow(ctx, `
		SELECT npsn, id, name, level, status, status_label, status_reason, address, city, district,
		       lat, lng, principal_name, principal_nip, principal_phone, principal_email,
		       total_students, total_calorie_target, dietary_notes, COALESCE(sppg_id, ''),
		       acceptance_rate, avg_arrival_time, created_at
		FROM schools WHERE npsn = $1`, npsn).Scan(
		&s.NPSN, &s.ID, &s.Name, &s.Level, &s.Status, &s.StatusLabel, &s.StatusReason,
		&s.Address, &s.City, &s.District, &s.Lat, &s.Lng,
		&s.PrincipalName, &s.PrincipalNIP, &s.PrincipalPhone, &s.PrincipalEmail,
		&s.TotalStudents, &s.TotalCalorieTarget, &s.DietaryNotes, &s.SPPGID,
		&s.AcceptanceRate, &s.AvgArrivalTime, &s.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *postgresPortalRepository) GetAllSPPGs(ctx context.Context) ([]models.SPPGKitchen, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, code, name, legal_entity, type, type_label, address, subdistrict, city, province,
		       cluster, coordinates, manager_name, manager_nip, manager_phone, nutritionist_name,
		       nutritionist_str, staff_count, kitchen_area, fleet_count, fleet_type,
		       max_daily_portions, active_quota, safety_score, cold_chain_score, timeliness_score,
		       composite_score, grade, status, created_at, updated_at
		FROM sppg_kitchens ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("query sppg: %w", err)
	}
	defer rows.Close()

	var list []models.SPPGKitchen
	for rows.Next() {
		var s models.SPPGKitchen
		if err := rows.Scan(
			&s.ID, &s.Code, &s.Name, &s.LegalEntity, &s.Type, &s.TypeLabel,
			&s.Address, &s.Subdistrict, &s.City, &s.Province, &s.Cluster, &s.Coordinates,
			&s.ManagerName, &s.ManagerNIP, &s.ManagerPhone, &s.NutritionistName, &s.NutritionistSTR,
			&s.StaffCount, &s.KitchenArea, &s.FleetCount, &s.FleetType,
			&s.MaxDailyPortions, &s.ActiveQuota, &s.SafetyScore, &s.ColdChainScore,
			&s.TimelinessScore, &s.CompositeScore, &s.Grade, &s.Status, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan sppg: %w", err)
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetSPPGByID(ctx context.Context, id string) (*models.SPPGKitchen, error) {
	var s models.SPPGKitchen
	err := database.Pool().QueryRow(ctx, `
		SELECT id, code, name, legal_entity, type, type_label, address, subdistrict, city, province,
		       cluster, coordinates, manager_name, manager_nip, manager_phone, nutritionist_name,
		       nutritionist_str, staff_count, kitchen_area, fleet_count, fleet_type,
		       max_daily_portions, active_quota, safety_score, cold_chain_score, timeliness_score,
		       composite_score, grade, status, created_at, updated_at
		FROM sppg_kitchens WHERE id = $1`, id).Scan(
		&s.ID, &s.Code, &s.Name, &s.LegalEntity, &s.Type, &s.TypeLabel,
		&s.Address, &s.Subdistrict, &s.City, &s.Province, &s.Cluster, &s.Coordinates,
		&s.ManagerName, &s.ManagerNIP, &s.ManagerPhone, &s.NutritionistName, &s.NutritionistSTR,
		&s.StaffCount, &s.KitchenArea, &s.FleetCount, &s.FleetType,
		&s.MaxDailyPortions, &s.ActiveQuota, &s.SafetyScore, &s.ColdChainScore,
		&s.TimelinessScore, &s.CompositeScore, &s.Grade, &s.Status, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *postgresPortalRepository) GetAllMenuPackages(ctx context.Context) ([]models.MenuPackage, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, cycle_code, day_slot, name, staple, protein_main, side_veggie, fruit, dairy_drink,
		       calories, protein, carbs, fat, calcium, iron, zinc, cost_per_serving,
		       allergens, halal_cert, slhs_cert, description, created_at
		FROM menu_packages ORDER BY id ASC`)
	if err != nil {
		return nil, fmt.Errorf("query menu packages: %w", err)
	}
	defer rows.Close()

	var list []models.MenuPackage
	for rows.Next() {
		var m models.MenuPackage
		if err := rows.Scan(
			&m.ID, &m.CycleCode, &m.DaySlot, &m.Name, &m.Staple, &m.ProteinMain,
			&m.SideVeggie, &m.Fruit, &m.DairyDrink,
			&m.Calories, &m.Protein, &m.Carbs, &m.Fat, &m.Calcium, &m.Iron, &m.Zinc,
			&m.CostPerServing, &m.Allergens, &m.HalalCert, &m.SLHSCert, &m.Description, &m.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan menu package: %w", err)
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllCalendarDays(ctx context.Context) ([]models.CalendarDay, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT c.date::TEXT, COALESCE(c.package_id, ''), c.day_name, c.week_number, c.day_type,
		       c.status, c.theme, c.notes, c.target_portions,
		       COALESCE(m.name, ''), COALESCE(m.calories, 0), COALESCE(m.protein, 0)
		FROM calendar_days c
		LEFT JOIN menu_packages m ON c.package_id = m.id
		ORDER BY c.date ASC`)
	if err != nil {
		return nil, fmt.Errorf("query calendar days: %w", err)
	}
	defer rows.Close()

	var list []models.CalendarDay
	for rows.Next() {
		var d models.CalendarDay
		var mName string
		var mCalories, mProtein float64
		if err := rows.Scan(
			&d.Date, &d.PackageID, &d.DayName, &d.WeekNumber, &d.DayType,
			&d.Status, &d.Theme, &d.Notes, &d.TargetPortions,
			&mName, &mCalories, &mProtein,
		); err != nil {
			return nil, fmt.Errorf("scan calendar day: %w", err)
		}
		if d.PackageID != "" {
			d.Package = &models.MenuPackage{
				ID:       d.PackageID,
				Name:     mName,
				Calories: mCalories,
				Protein:  mProtein,
			}
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllDeliveries(ctx context.Context) ([]models.Delivery, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT d.id, COALESCE(d.batch_id, ''), COALESCE(d.sppg_id, ''), d.school_npsn,
		       COALESCE(s.name, ''), d.validator_name, d.scanned_at, d.scan_date::TEXT,
		       d.portions, d.target_portions, d.temp_c, d.temp_status,
		       d.qr_token, d.qr_status, d.crypto_hash, d.menu_name,
		       d.ai_verdict, d.ai_score, d.image_url, d.status, d.created_at
		FROM deliveries d
		LEFT JOIN schools s ON d.school_npsn = s.npsn
		ORDER BY d.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query deliveries: %w", err)
	}
	defer rows.Close()

	var list []models.Delivery
	for rows.Next() {
		var d models.Delivery
		if err := rows.Scan(
			&d.ID, &d.BatchID, &d.SPPGID, &d.SchoolNPSN, &d.SchoolName,
			&d.ValidatorName, &d.ScannedAt, &d.ScanDate,
			&d.Portions, &d.TargetPortions, &d.TempC, &d.TempStatus,
			&d.QRToken, &d.QRStatus, &d.CryptoHash, &d.MenuName,
			&d.AIVerdict, &d.AIScore, &d.ImageURL, &d.Status, &d.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan delivery: %w", err)
		}
		list = append(list, d)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllSchedules(ctx context.Context) ([]models.Schedule, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, sppg_id, route_name, fleet_name, license_plate, driver_name, driver_phone,
		       departure_time, arrival_eta, total_portions, status, target_schools, telemetry, created_at
		FROM schedules ORDER BY departure_time ASC`)
	if err != nil {
		return nil, fmt.Errorf("query schedules: %w", err)
	}
	defer rows.Close()

	var list []models.Schedule
	for rows.Next() {
		var s models.Schedule
		if err := rows.Scan(
			&s.ID, &s.SPPGID, &s.RouteName, &s.FleetName, &s.LicensePlate,
			&s.DriverName, &s.DriverPhone, &s.DepartureTime, &s.ArrivalETA,
			&s.TotalPortions, &s.Status, &s.TargetSchools, &s.Telemetry, &s.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan schedule: %w", err)
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllAttendances(ctx context.Context) ([]models.Attendance, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT a.id, a.school_npsn, COALESCE(s.name, ''), a.date::TEXT,
		       a.registered_students, a.present_students, a.delivered_portions,
		       a.consumed_portions, a.surplus_portions, a.surplus_status,
		       a.attendance_rate, a.finish_rate, a.reconciliation_status,
		       a.target_tomorrow_quota, a.notes, a.created_at
		FROM attendances a
		LEFT JOIN schools s ON a.school_npsn = s.npsn
		ORDER BY a.date DESC`)
	if err != nil {
		return nil, fmt.Errorf("query attendances: %w", err)
	}
	defer rows.Close()

	var list []models.Attendance
	for rows.Next() {
		var a models.Attendance
		if err := rows.Scan(
			&a.ID, &a.SchoolNPSN, &a.SchoolName, &a.Date,
			&a.RegisteredStudents, &a.PresentStudents, &a.DeliveredPortions,
			&a.ConsumedPortions, &a.SurplusPortions, &a.SurplusStatus,
			&a.AttendanceRate, &a.FinishRate, &a.ReconciliationStatus,
			&a.TargetTomorrowQuota, &a.Notes, &a.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan attendance: %w", err)
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllNotices(ctx context.Context) ([]models.Notice, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, ref_number, title, category, urgency, target_audience, scope_region,
		       published_at, effective_date, author_name, author_role, content,
		       is_flash_alert, requires_acknowledgement, attachments, created_at
		FROM notices ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query notices: %w", err)
	}
	defer rows.Close()

	var list []models.Notice
	for rows.Next() {
		var n models.Notice
		if err := rows.Scan(
			&n.ID, &n.RefNumber, &n.Title, &n.Category, &n.Urgency,
			&n.TargetAudience, &n.ScopeRegion, &n.PublishedAt, &n.EffectiveDate,
			&n.AuthorName, &n.AuthorRole, &n.Content,
			&n.IsFlashAlert, &n.RequiresAcknowledgement, &n.Attachments, &n.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan notice: %w", err)
		}
		list = append(list, n)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllFeedbacks(ctx context.Context) ([]models.Feedback, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, ticket_number, reported_at, COALESCE(school_npsn, ''), school_name,
		       COALESCE(sppg_id, ''), batch_id, menu_package, severity, anomaly_type,
		       affected_portions, reporter_name, reporter_role, reporter_phone,
		       title, description, status, is_kill_switch_executed,
		       evidence_photos, kill_switch_details, medical_escalation, created_at
		FROM feedbacks ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query feedbacks: %w", err)
	}
	defer rows.Close()

	var list []models.Feedback
	for rows.Next() {
		var f models.Feedback
		if err := rows.Scan(
			&f.ID, &f.TicketNumber, &f.ReportedAt, &f.SchoolNPSN, &f.SchoolName,
			&f.SPPGID, &f.BatchID, &f.MenuPackage, &f.Severity, &f.AnomalyType,
			&f.AffectedPortions, &f.ReporterName, &f.ReporterRole, &f.ReporterPhone,
			&f.Title, &f.Description, &f.Status, &f.IsKillSwitchExecuted,
			&f.EvidencePhotos, &f.KillSwitchDetails, &f.MedicalEscalation, &f.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan feedback: %w", err)
		}
		list = append(list, f)
	}
	return list, nil
}

func (r *postgresPortalRepository) CreateFeedback(ctx context.Context, fb *models.Feedback) error {
	_, err := database.Pool().Exec(ctx, `
		INSERT INTO feedbacks (id, ticket_number, reported_at, school_npsn, school_name, sppg_id,
		                       batch_id, menu_package, severity, anomaly_type, affected_portions,
		                       reporter_name, reporter_role, reporter_phone, title, description,
		                       status, is_kill_switch_executed, evidence_photos, kill_switch_details, medical_escalation)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
		fb.ID, fb.TicketNumber, fb.ReportedAt, fb.SchoolNPSN, fb.SchoolName, fb.SPPGID,
		fb.BatchID, fb.MenuPackage, fb.Severity, fb.AnomalyType, fb.AffectedPortions,
		fb.ReporterName, fb.ReporterRole, fb.ReporterPhone, fb.Title, fb.Description,
		fb.Status, fb.IsKillSwitchExecuted, fb.EvidencePhotos, fb.KillSwitchDetails, fb.MedicalEscalation,
	)
	return err
}

func (r *postgresPortalRepository) GetAllReports(ctx context.Context) ([]models.Report, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT id, report_code, title, period, category, author_name, status, file_size, file_format, kpi_metrics, created_at
		FROM reports ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query reports: %w", err)
	}
	defer rows.Close()

	var list []models.Report
	for rows.Next() {
		var rep models.Report
		if err := rows.Scan(
			&rep.ID, &rep.ReportCode, &rep.Title, &rep.Period, &rep.Category,
			&rep.AuthorName, &rep.Status, &rep.FileSize, &rep.FileFormat,
			&rep.KPIMetrics, &rep.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan report: %w", err)
		}
		list = append(list, rep)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAllValidators(ctx context.Context) ([]models.ValidatorProfile, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT v.id, v.user_id, v.satgas_id, v.name, v.nip, v.npsn, COALESCE(s.name, ''),
		       v.role, v.device, v.device_id, v.certification, v.status,
		       v.scans_today, v.quota_today, v.scan_logs, v.created_at
		FROM validator_profiles v
		LEFT JOIN schools s ON v.npsn = s.npsn
		ORDER BY v.name ASC`)
	if err != nil {
		return nil, fmt.Errorf("query validator profiles: %w", err)
	}
	defer rows.Close()

	var list []models.ValidatorProfile
	for rows.Next() {
		var val models.ValidatorProfile
		if err := rows.Scan(
			&val.ID, &val.UserID, &val.SatgasID, &val.Name, &val.NIP, &val.NPSN, &val.SchoolName,
			&val.Role, &val.Device, &val.DeviceID, &val.Certification, &val.Status,
			&val.ScansToday, &val.QuotaToday, &val.ScanLogs, &val.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan validator profile: %w", err)
		}
		list = append(list, val)
	}
	return list, nil
}

func (r *postgresPortalRepository) GetAdminMetrics(ctx context.Context) (*models.AdminDashboardMetrics, error) {
	metrics := &models.AdminDashboardMetrics{}

	_ = database.Pool().QueryRow(ctx, "SELECT COALESCE(SUM(portions), 0), COALESCE(SUM(target_portions), 0), COALESCE(AVG(temp_c), 23.0) FROM deliveries").Scan(
		&metrics.TotalPortionsToday, &metrics.TargetPortionsToday, &metrics.AvgTempC,
	)
	_ = database.Pool().QueryRow(ctx, "SELECT COUNT(*) FROM schools WHERE status = 'active'").Scan(&metrics.SchoolsServedCount)
	_ = database.Pool().QueryRow(ctx, "SELECT COUNT(*) FROM sppg_kitchens WHERE status = 'active'").Scan(&metrics.ActiveKitchensCount)
	_ = database.Pool().QueryRow(ctx, "SELECT COUNT(*) FROM feedbacks WHERE status = 'open'").Scan(&metrics.IncidentCount)

	metrics.OnTimeRate = 99.2
	metrics.SafetyPassRate = 99.4
	metrics.ColdChainSafeRate = 98.7

	return metrics, nil
}
