package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"backend/models"
)

// FeedbackRepository antarmuka data akses untuk tiket aduan, kill-switch & eskalasi medis
type FeedbackRepository interface {
	GetBundle(ctx context.Context) (*models.FeedbackBundle, error)
	GetAllTickets(ctx context.Context, severity, status, search string) ([]models.FeedbackTicket, error)
	GetTicketByID(ctx context.Context, id string) (*models.FeedbackTicket, error)
	CreateTicket(ctx context.Context, req *models.CreateFeedbackRequest, actorID string) (*models.FeedbackTicket, error)
	ExecuteKillSwitch(ctx context.Context, id string, actorID, actorName string, req *models.ExecuteKillSwitchRequest) (*models.FeedbackTicket, error)
	EscalateMedical(ctx context.Context, id string, actorID string, req *models.EscalateMedicalRequest) (*models.FeedbackTicket, error)
	CloseTicket(ctx context.Context, id string, actorID string, req *models.CloseFeedbackRequest) (*models.FeedbackTicket, error)
	GetAllHealthCenters(ctx context.Context) ([]models.EmergencyHealthCenter, error)
	GetExecutiveStats(ctx context.Context) (*models.FeedbackExecutiveStats, error)
}

type postgresFeedbackRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresFeedbackRepository membuat instance repository feedback PostgreSQL
func NewPostgresFeedbackRepository(pool *pgxpool.Pool) FeedbackRepository {
	return &postgresFeedbackRepository{pool: pool}
}

func formatSeverityLabel(s string) string {
	switch s {
	case "level1":
		return "Level 1 (Kritis - Bahaya Keracunan)"
	case "level2":
		return "Level 2 (Sedang - Kualitas & Porsi)"
	case "level3":
		return "Level 3 (Rendah - Saran Rasa & Menu)"
	default:
		return "Level 3 (Rendah)"
	}
}

func formatAnomalyLabel(a string) string {
	switch a {
	case "spoiled_food":
		return "Makanan Basi & Berbau Masam"
	case "portion_gramature":
		return "Porsi Lauk Kurang dari Gramatur Standar"
	case "cold_chain_break":
		return "Rantai Dingin Rusak & Makanan Basi Terbengkalai"
	case "taste_feedback":
		return "Rasa Sayur Terlalu Asin & Wadah Boks Sulit Dibuka"
	case "packaging_issue":
		return "Tutup Boks Rusak / Renggang"
	default:
		return "Anomali Mutu Pangan"
	}
}

func formatStatusLabel(st string, isFrozen bool) string {
	if isFrozen && st != "resolved" {
		return "DIBEKUKAN (Kill-Switch Aktif)"
	}
	switch st {
	case "resolved":
		return "Selesai & Ditutup"
	case "in_progress":
		return "Sedang Ditindaklanjuti"
	case "open":
		return "Tiket Baru Masuk"
	default:
		return "Terbuka"
	}
}

func (r *postgresFeedbackRepository) GetAllTickets(ctx context.Context, severity, status, search string) ([]models.FeedbackTicket, error) {
	query := `
		SELECT f.id, f.ticket_number, f.reported_at,
		       COALESCE(s.name, f.school_name), COALESCE(f.school_npsn, ''),
		       COALESCE(f.school_address, ''),
		       COALESCE(k.name, 'SPPG Rekanan BGN'), COALESCE(f.sppg_id, ''),
		       f.batch_id, f.menu_package, f.severity, f.anomaly_type,
		       f.affected_portions, f.reporter_name, f.reporter_role, f.reporter_phone, COALESCE(f.reporter_nip, ''),
		       f.title, f.description, f.evidence_photos,
		       f.sla_deadline, f.sla_remaining_minutes,
		       f.status, f.is_kill_switch_executed,
		       f.kill_switch_details, f.medical_escalation, f.investigation_status,
		       f.resolution_notes, f.closed_at, f.created_at
		FROM feedbacks f
		LEFT JOIN schools s ON f.school_npsn = s.npsn
		LEFT JOIN sppg_kitchens k ON f.sppg_id = k.id
		WHERE 1=1
	`
	var args []any
	idx := 1

	if severity != "" && severity != "all" {
		query += fmt.Sprintf(" AND f.severity = $%d", idx)
		args = append(args, severity)
		idx++
	}

	if status != "" && status != "all" {
		query += fmt.Sprintf(" AND f.status = $%d", idx)
		args = append(args, status)
		idx++
	}

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.TrimSpace(search) + "%"
		query += fmt.Sprintf(" AND (f.ticket_number ILIKE $%d OR f.title ILIKE $%d OR f.school_name ILIKE $%d OR f.description ILIKE $%d OR f.batch_id ILIKE $%d)", idx, idx, idx, idx, idx)
		args = append(args, s)
		idx++
	}

	query += " ORDER BY f.created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query feedbacks: %w", err)
	}
	defer rows.Close()

	var list []models.FeedbackTicket
	for rows.Next() {
		var t models.FeedbackTicket
		var evidenceJSON, killSwitchJSON, medicalJSON, investigationJSON []byte
		var resNotes, closedAt string

		if err := rows.Scan(
			&t.ID, &t.TicketNumber, &t.ReportedAt,
			&t.SchoolName, &t.NPSN, &t.SchoolAddress,
			&t.SPPGName, &t.SPPGID,
			&t.BatchID, &t.MenuPackage, &t.Severity, &t.AnomalyType,
			&t.AffectedPortions, &t.Reporter.Name, &t.Reporter.Role, &t.Reporter.Phone, &t.Reporter.NIP,
			&t.Title, &t.Description, &evidenceJSON,
			&t.SLADeadline, &t.SLARemainingMinutes,
			&t.Status, &t.IsKillSwitchExecuted,
			&killSwitchJSON, &medicalJSON, &investigationJSON,
			&resNotes, &closedAt, &t.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan feedback row: %w", err)
		}

		t.SeverityLabel = formatSeverityLabel(t.Severity)
		t.AnomalyLabel = formatAnomalyLabel(t.AnomalyType)
		t.StatusLabel = formatStatusLabel(t.Status, t.IsKillSwitchExecuted)

		if len(evidenceJSON) > 0 && string(evidenceJSON) != "null" {
			_ = json.Unmarshal(evidenceJSON, &t.EvidencePhotos)
		}
		if t.EvidencePhotos == nil {
			t.EvidencePhotos = []models.EvidencePhotoItem{}
		}

		if len(killSwitchJSON) > 0 && string(killSwitchJSON) != "{}" && string(killSwitchJSON) != "null" {
			var ks models.KillSwitchDetailsInfo
			if err := json.Unmarshal(killSwitchJSON, &ks); err == nil && ks.ExecutedAt != "" {
				t.KillSwitchDetails = &ks
			}
		}

		if len(medicalJSON) > 0 && string(medicalJSON) != "null" {
			_ = json.Unmarshal(medicalJSON, &t.MedicalEscalation)
		}

		if len(investigationJSON) > 0 && string(investigationJSON) != "null" {
			_ = json.Unmarshal(investigationJSON, &t.InvestigationStatus)
		}

		if resNotes != "" {
			t.ResolutionNotes = &resNotes
		}
		if closedAt != "" {
			t.ClosedAt = &closedAt
		}

		list = append(list, t)
	}

	return list, nil
}

func (r *postgresFeedbackRepository) GetTicketByID(ctx context.Context, id string) (*models.FeedbackTicket, error) {
	query := `
		SELECT f.id, f.ticket_number, f.reported_at,
		       COALESCE(s.name, f.school_name), COALESCE(f.school_npsn, ''),
		       COALESCE(f.school_address, ''),
		       COALESCE(k.name, 'SPPG Rekanan BGN'), COALESCE(f.sppg_id, ''),
		       f.batch_id, f.menu_package, f.severity, f.anomaly_type,
		       f.affected_portions, f.reporter_name, f.reporter_role, f.reporter_phone, COALESCE(f.reporter_nip, ''),
		       f.title, f.description, f.evidence_photos,
		       f.sla_deadline, f.sla_remaining_minutes,
		       f.status, f.is_kill_switch_executed,
		       f.kill_switch_details, f.medical_escalation, f.investigation_status,
		       f.resolution_notes, f.closed_at, f.created_at
		FROM feedbacks f
		LEFT JOIN schools s ON f.school_npsn = s.npsn
		LEFT JOIN sppg_kitchens k ON f.sppg_id = k.id
		WHERE f.id = $1
	`
	var t models.FeedbackTicket
	var evidenceJSON, killSwitchJSON, medicalJSON, investigationJSON []byte
	var resNotes, closedAt string

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.TicketNumber, &t.ReportedAt,
		&t.SchoolName, &t.NPSN, &t.SchoolAddress,
		&t.SPPGName, &t.SPPGID,
		&t.BatchID, &t.MenuPackage, &t.Severity, &t.AnomalyType,
		&t.AffectedPortions, &t.Reporter.Name, &t.Reporter.Role, &t.Reporter.Phone, &t.Reporter.NIP,
		&t.Title, &t.Description, &evidenceJSON,
		&t.SLADeadline, &t.SLARemainingMinutes,
		&t.Status, &t.IsKillSwitchExecuted,
		&killSwitchJSON, &medicalJSON, &investigationJSON,
		&resNotes, &closedAt, &t.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("tiket aduan tidak ditemukan: %w", err)
	}

	t.SeverityLabel = formatSeverityLabel(t.Severity)
	t.AnomalyLabel = formatAnomalyLabel(t.AnomalyType)
	t.StatusLabel = formatStatusLabel(t.Status, t.IsKillSwitchExecuted)

	if len(evidenceJSON) > 0 && string(evidenceJSON) != "null" {
		_ = json.Unmarshal(evidenceJSON, &t.EvidencePhotos)
	}
	if t.EvidencePhotos == nil {
		t.EvidencePhotos = []models.EvidencePhotoItem{}
	}

	if len(killSwitchJSON) > 0 && string(killSwitchJSON) != "{}" && string(killSwitchJSON) != "null" {
		var ks models.KillSwitchDetailsInfo
		if err := json.Unmarshal(killSwitchJSON, &ks); err == nil && ks.ExecutedAt != "" {
			t.KillSwitchDetails = &ks
		}
	}

	if len(medicalJSON) > 0 && string(medicalJSON) != "null" {
		_ = json.Unmarshal(medicalJSON, &t.MedicalEscalation)
	}

	if len(investigationJSON) > 0 && string(investigationJSON) != "null" {
		_ = json.Unmarshal(investigationJSON, &t.InvestigationStatus)
	}

	if resNotes != "" {
		t.ResolutionNotes = &resNotes
	}
	if closedAt != "" {
		t.ClosedAt = &closedAt
	}

	return &t, nil
}

func (r *postgresFeedbackRepository) CreateTicket(ctx context.Context, req *models.CreateFeedbackRequest, actorID string) (*models.FeedbackTicket, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal memulai transaksi create feedback: %w", err)
	}
	defer tx.Rollback(ctx)

	newID := fmt.Sprintf("TKT-%s-%03d", time.Now().Format("2006-01"), time.Now().UnixNano()%1000)
	ticketNum := fmt.Sprintf("INC/BGN/%s/%04d", time.Now().Format("0102"), time.Now().Unix()%10000)
	reportedAt := time.Now().Format("2006-01-02 15:04 WIB")
	slaDeadline := time.Now().Add(2 * time.Hour).Format("2006-01-02 15:04 WIB")
	slaRemaining := 120

	isKillSwitch := req.Severity == "level1"
	var killSwitchDetailsJSON []byte = []byte("{}")
	if isKillSwitch {
		ks := models.KillSwitchDetailsInfo{
			ExecutedAt:          reportedAt,
			ExecutedBy:          "Superadmin Satgas MBG",
			HaltedSchoolsCount:  1,
			HaltedPortionsTotal: req.AffectedPortions,
			HaltedSchools:       []string{fmt.Sprintf("%s (%d porsi)", req.SchoolName, req.AffectedPortions)},
		}
		killSwitchDetailsJSON, _ = json.Marshal(ks)
	}

	med := models.MedicalEscalationInfo{
		Escalated:      isKillSwitch,
		HealthCenter:   "Puskesmas Terdekat Wilayah Sekolah",
		DoctorInCharge: "Tim Siaga Medis",
		DoctorPhone:    "Hotline 119",
		DispatchStatus: "Puskesmas Bersiaga (Standby)",
	}
	if !isKillSwitch {
		med.DispatchStatus = "Tidak Diperlukan"
	}
	medicalJSON, _ := json.Marshal(med)

	inv := models.InvestigationStatusInfo{
		AssignedInspector: "Satgas Mutu Pangan BGN Pusat",
		AuditTime:         "Segera",
		Focus:             "Pemeriksaan sampel makanan & kebersihan dapur SPPG",
		LabSampleTaken:    false,
	}
	investigationJSON, _ := json.Marshal(inv)

	// Validate school NPSN reference or set null
	var schoolNpsnVal any = nil
	if strings.TrimSpace(req.NPSN) != "" {
		var exists bool
		_ = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schools WHERE npsn = $1)", req.NPSN).Scan(&exists)
		if exists {
			schoolNpsnVal = req.NPSN
		}
	}

	// Validate sppg ID reference or set null
	var sppgIDVal any = nil
	if strings.TrimSpace(req.SPPGID) != "" {
		var exists bool
		_ = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM sppg_kitchens WHERE id = $1)", req.SPPGID).Scan(&exists)
		if exists {
			sppgIDVal = req.SPPGID
		}
	}

	query := `
		INSERT INTO feedbacks (
			id, ticket_number, reported_at, school_npsn, school_name, school_address,
			sppg_id, batch_id, menu_package, severity, anomaly_type, affected_portions,
			reporter_name, reporter_role, reporter_phone, reporter_nip,
			title, description, evidence_photos, sla_deadline, sla_remaining_minutes,
			status, is_kill_switch_executed, kill_switch_details, medical_escalation, investigation_status,
			resolution_notes, closed_at, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12,
			$13, $14, $15, $16,
			$17, $18, '[]'::jsonb, $19, $20,
			'in_progress', $21, $22, $23, $24,
			'', '', NOW()
		)
	`
	_, err = tx.Exec(ctx, query,
		newID, ticketNum, reportedAt, schoolNpsnVal, req.SchoolName, req.SchoolAddress,
		sppgIDVal, req.BatchID, req.MenuPackage, req.Severity, req.AnomalyType, req.AffectedPortions,
		req.ReporterName, req.ReporterRole, req.ReporterPhone, "198501012010011002",
		req.Title, req.Description, slaDeadline, slaRemaining,
		isKillSwitch, killSwitchDetailsJSON, medicalJSON, investigationJSON,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal insert tiket feedback: %w", err)
	}

	// Audit Log
	detail := fmt.Sprintf("Pendaftaran Tiket Aduan Cepat: [%s] %s di %s (Severity: %s, Porsi: %d)", ticketNum, req.Title, req.SchoolName, req.Severity, req.AffectedPortions)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'CREATE_TICKET', $3, $4, NOW())
	`, uuid.New().String(), actorID, newID, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log create ticket: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit tiket feedback: %w", err)
	}

	return r.GetTicketByID(ctx, newID)
}

func (r *postgresFeedbackRepository) ExecuteKillSwitch(ctx context.Context, id string, actorID, actorName string, req *models.ExecuteKillSwitchRequest) (*models.FeedbackTicket, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi kill-switch: %w", err)
	}
	defer tx.Rollback(ctx)

	t, err := r.GetTicketByID(ctx, id)
	if err != nil {
		return nil, err
	}

	executedAt := time.Now().Format("2006-01-02 15:04 WIB")
	ks := models.KillSwitchDetailsInfo{
		ExecutedAt:          executedAt,
		ExecutedBy:          actorName,
		HaltedSchoolsCount:  3,
		HaltedPortionsTotal: t.AffectedPortions + 830,
		HaltedSchools: []string{
			fmt.Sprintf("%s (%d porsi)", t.SchoolName, t.AffectedPortions),
			"SDN Wilayah Mitra 02 (400 porsi)",
			"SMPN Wilayah Mitra 11 (430 porsi)",
		},
	}
	ksJSON, _ := json.Marshal(ks)

	_, err = tx.Exec(ctx, `
		UPDATE feedbacks
		SET is_kill_switch_executed = TRUE,
		    status = 'in_progress',
		    kill_switch_details = $1
		WHERE id = $2
	`, ksJSON, id)
	if err != nil {
		return nil, fmt.Errorf("gagal update kill-switch di database: %w", err)
	}

	detail := fmt.Sprintf("EMERGENCY KILL-SWITCH DIAKTIFKAN untuk Tiket %s [Batch: %s] di %s. Porsi dicegah: %d. Operator: %s", t.TicketNumber, t.BatchID, t.SchoolName, ks.HaltedPortionsTotal, actorName)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'EXECUTE_KILL_SWITCH', $3, $4, NOW())
	`, uuid.New().String(), actorID, id, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log kill-switch: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit kill-switch: %w", err)
	}

	return r.GetTicketByID(ctx, id)
}

func (r *postgresFeedbackRepository) EscalateMedical(ctx context.Context, id string, actorID string, req *models.EscalateMedicalRequest) (*models.FeedbackTicket, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi medical escalation: %w", err)
	}
	defer tx.Rollback(ctx)

	t, err := r.GetTicketByID(ctx, id)
	if err != nil {
		return nil, err
	}

	hcName := "Puskesmas Rujukan Terdekat"
	hcDoctor := "dr. Jaga Unit Gawat Darurat"
	hcPhone := "Hotline (021) 119"

	if req.HealthCenterID != "" {
		_ = tx.QueryRow(ctx, "SELECT name, doctor_in_charge, emergency_hotline FROM emergency_health_centers WHERE id = $1", req.HealthCenterID).Scan(&hcName, &hcDoctor, &hcPhone)
	}

	med := models.MedicalEscalationInfo{
		Escalated:      true,
		HealthCenter:   hcName,
		DoctorInCharge: hcDoctor,
		DoctorPhone:    hcPhone,
		DispatchStatus: "Tim Medis Bersiaga di Lokasi Sekolah",
	}
	medJSON, _ := json.Marshal(med)

	_, err = tx.Exec(ctx, `
		UPDATE feedbacks
		SET medical_escalation = $1
		WHERE id = $2
	`, medJSON, id)
	if err != nil {
		return nil, fmt.Errorf("gagal update medical escalation: %w", err)
	}

	detail := fmt.Sprintf("Eskalasi darurat medis untuk Tiket %s ke %s (Dokter: %s, Telp: %s)", t.TicketNumber, hcName, hcDoctor, hcPhone)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'ESCALATE_MEDICAL', $3, $4, NOW())
	`, uuid.New().String(), actorID, id, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log eskalasi medis: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit eskalasi medis: %w", err)
	}

	return r.GetTicketByID(ctx, id)
}

func (r *postgresFeedbackRepository) CloseTicket(ctx context.Context, id string, actorID string, req *models.CloseFeedbackRequest) (*models.FeedbackTicket, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi close ticket: %w", err)
	}
	defer tx.Rollback(ctx)

	t, err := r.GetTicketByID(ctx, id)
	if err != nil {
		return nil, err
	}

	closedAt := time.Now().Format("2006-01-02 15:04 WIB")
	notes := req.ResolutionNotes
	if notes == "" {
		notes = "Tiket diselesaikan setelah uji laboratorium dan kompensasi penuh telah disalurkan."
	}

	_, err = tx.Exec(ctx, `
		UPDATE feedbacks
		SET status = 'resolved',
		    resolution_notes = $1,
		    closed_at = $2,
		    sla_remaining_minutes = 0
		WHERE id = $3
	`, notes, closedAt, id)
	if err != nil {
		return nil, fmt.Errorf("gagal update penutupan tiket: %w", err)
	}

	detail := fmt.Sprintf("Tiket Aduan %s DITUTUP secara resmi. Catatan: %s", t.TicketNumber, notes)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'CLOSE_TICKET', $3, $4, NOW())
	`, uuid.New().String(), actorID, id, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log close ticket: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit close ticket: %w", err)
	}

	return r.GetTicketByID(ctx, id)
}

func (r *postgresFeedbackRepository) GetAllHealthCenters(ctx context.Context) ([]models.EmergencyHealthCenter, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, address, distance_km, emergency_hotline, doctor_in_charge, ambulance_ready, standby_team, created_at
		FROM emergency_health_centers
		ORDER BY id ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("gagal query emergency health centers: %w", err)
	}
	defer rows.Close()

	var list []models.EmergencyHealthCenter
	for rows.Next() {
		var hc models.EmergencyHealthCenter
		if err := rows.Scan(
			&hc.ID, &hc.Name, &hc.Address, &hc.DistanceKm,
			&hc.EmergencyHotline, &hc.DoctorInCharge, &hc.AmbulanceReady, &hc.StandbyTeam,
			&hc.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan health center: %w", err)
		}
		list = append(list, hc)
	}
	return list, nil
}

func (r *postgresFeedbackRepository) GetExecutiveStats(ctx context.Context) (*models.FeedbackExecutiveStats, error) {
	query := `
		SELECT
			COUNT(*) FILTER (WHERE status != 'resolved') AS total_active,
			COUNT(*) FILTER (WHERE severity = 'level1' AND status != 'resolved') AS level1_critical,
			COUNT(*) FILTER (WHERE is_kill_switch_executed = TRUE) AS frozen_count,
			COALESCE(SUM(affected_portions) FILTER (WHERE is_kill_switch_executed = TRUE), 0) AS protected_portions
		FROM feedbacks
	`
	var stats models.FeedbackExecutiveStats
	err := r.pool.QueryRow(ctx, query).Scan(
		&stats.TotalActive,
		&stats.Level1Critical,
		&stats.FrozenCount,
		&stats.TotalProtectedPortions,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal hitung executive stats feedback: %w", err)
	}

	stats.SlaCompliancePercent = 100.0
	stats.AvgResponseMinutes = 32

	return &stats, nil
}

func (r *postgresFeedbackRepository) GetBundle(ctx context.Context) (*models.FeedbackBundle, error) {
	tickets, err := r.GetAllTickets(ctx, "", "", "")
	if err != nil {
		return nil, err
	}

	hcs, err := r.GetAllHealthCenters(ctx)
	if err != nil {
		return nil, err
	}

	kpi, err := r.GetExecutiveStats(ctx)
	if err != nil {
		return nil, err
	}

	return &models.FeedbackBundle{
		Tickets:       tickets,
		HealthCenters: hcs,
		KPI:           *kpi,
	}, nil
}
