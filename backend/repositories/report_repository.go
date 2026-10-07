package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ReportRepository mendefinisikan kontrak akses data laporan, BAST digital, invoice, dan audit forensik
type ReportRepository interface {
	GetBundle(ctx context.Context) (*models.ReportsBundle, error)
	GetReports(ctx context.Context, category, search string) ([]models.OfficialReport, error)
	GetReportByID(ctx context.Context, id string) (*models.OfficialReport, error)
	CreateReport(ctx context.Context, actorID string, req *models.CreateReportRequest) (*models.OfficialReport, error)
	GetDigitalBasts(ctx context.Context, search string) ([]models.DigitalBast, error)
	GetDigitalBastByID(ctx context.Context, id string) (*models.DigitalBast, error)
	GetVendorInvoices(ctx context.Context, search string) ([]models.VendorInvoice, error)
	GetVendorInvoiceByID(ctx context.Context, id string) (*models.VendorInvoice, error)
	AuthorizePayment(ctx context.Context, actorID, actorName, invoiceID string, req *models.AuthorizePaymentRequest) (*models.VendorInvoice, error)
	GetForensicFindings(ctx context.Context, search string) ([]models.ForensicAuditFinding, error)
	GetExecutiveStats(ctx context.Context) (*models.ReportExecutiveStats, error)
}

type postgresReportRepository struct {
	pool *pgxpool.Pool
}

func NewReportRepository(pool *pgxpool.Pool) ReportRepository {
	if pool == nil {
		pool = database.Pool()
	}
	return &postgresReportRepository{pool: pool}
}

func (r *postgresReportRepository) GetReports(ctx context.Context, category, search string) ([]models.OfficialReport, error) {
	query := `
		SELECT id, report_code, title, category, period, scope,
		       COALESCE(file_size_pdf, '2.5 MB'), COALESCE(file_size_xlsx, '1.4 MB'), COALESCE(file_size_csv, '520 KB'),
		       file_formats, total_portions, success_rate, description, signee, audit_badge,
		       author_name, status, kpi_metrics, created_at
		FROM reports
	`
	var conditions []string
	var args []any
	argIdx := 1

	if strings.TrimSpace(category) != "" && strings.TrimSpace(category) != "all" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argIdx))
		args = append(args, strings.TrimSpace(category))
		argIdx++
	}

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.TrimSpace(search) + "%"
		conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR report_code ILIKE $%d OR description ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, s)
		argIdx++
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query reports: %w", err)
	}
	defer rows.Close()

	var list []models.OfficialReport
	for rows.Next() {
		var rep models.OfficialReport
		var formatsJSON []byte
		var kpiJSON []byte

		if err := rows.Scan(
			&rep.ID, &rep.Code, &rep.Title, &rep.Category, &rep.Period, &rep.Scope,
			&rep.FileSizePdf, &rep.FileSizeXlsx, &rep.FileSizeCsv,
			&formatsJSON, &rep.TotalPortions, &rep.SuccessRate, &rep.Description,
			&rep.Signee, &rep.AuditBadge, &rep.AuthorName, &rep.Status, &kpiJSON, &rep.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan official report: %w", err)
		}

		if len(formatsJSON) > 0 {
			_ = json.Unmarshal(formatsJSON, &rep.FileFormats)
		}
		if len(rep.FileFormats) == 0 {
			rep.FileFormats = []string{"PDF", "CSV"}
		}
		if len(kpiJSON) > 0 {
			rep.KPIMetrics = kpiJSON
		}

		rep.CategoryLabel = mapReportCategoryLabel(rep.Category)
		rep.GeneratedAt = rep.CreatedAt.Format("2006-01-02 15:04 WIB")
		list = append(list, rep)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterasi rows reports: %w", err)
	}

	return list, nil
}

func (r *postgresReportRepository) GetReportByID(ctx context.Context, id string) (*models.OfficialReport, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, report_code, title, category, period, scope,
		       COALESCE(file_size_pdf, '2.5 MB'), COALESCE(file_size_xlsx, '1.4 MB'), COALESCE(file_size_csv, '520 KB'),
		       file_formats, total_portions, success_rate, description, signee, audit_badge,
		       author_name, status, kpi_metrics, created_at
		FROM reports WHERE id = $1
	`, id)

	var rep models.OfficialReport
	var formatsJSON []byte
	var kpiJSON []byte

	if err := row.Scan(
		&rep.ID, &rep.Code, &rep.Title, &rep.Category, &rep.Period, &rep.Scope,
		&rep.FileSizePdf, &rep.FileSizeXlsx, &rep.FileSizeCsv,
		&formatsJSON, &rep.TotalPortions, &rep.SuccessRate, &rep.Description,
		&rep.Signee, &rep.AuditBadge, &rep.AuthorName, &rep.Status, &kpiJSON, &rep.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("laporan dengan id %s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal ambil report %s: %w", id, err)
	}

	if len(formatsJSON) > 0 {
		_ = json.Unmarshal(formatsJSON, &rep.FileFormats)
	}
	if len(rep.FileFormats) == 0 {
		rep.FileFormats = []string{"PDF", "CSV"}
	}
	if len(kpiJSON) > 0 {
		rep.KPIMetrics = kpiJSON
	}

	rep.CategoryLabel = mapReportCategoryLabel(rep.Category)
	rep.GeneratedAt = rep.CreatedAt.Format("2006-01-02 15:04 WIB")
	return &rep, nil
}

func (r *postgresReportRepository) CreateReport(ctx context.Context, actorID string, req *models.CreateReportRequest) (*models.OfficialReport, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal mulai transaksi create report: %w", err)
	}
	defer tx.Rollback(ctx)

	newID := fmt.Sprintf("REP-BGN-2026-%03d", time.Now().Unix()%1000)
	catPrefix := "CUS"
	if len(req.Category) >= 3 {
		catPrefix = strings.ToUpper(req.Category[:3])
	}
	newCode := fmt.Sprintf("%s-GEN-%04d", catPrefix, time.Now().Unix()%10000)

	desc := fmt.Sprintf("Laporan resmi kustom hasil ekstraksi basis data terpadu BGN untuk periode %s.", req.Period)
	formats := []string{req.Format, "CSV"}
	formatsBytes, _ := json.Marshal(formats)

	scope := req.Scope
	if strings.TrimSpace(scope) == "" {
		scope = "Nasional (38 Provinsi)"
	}
	signee := req.Signee
	if strings.TrimSpace(signee) == "" {
		signee = "Satgas MBG Pusat & BGN"
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO reports (
			id, report_code, title, period, category, author_name, status,
			file_size, file_format, kpi_metrics, scope, total_portions, success_rate,
			file_formats, file_size_pdf, file_size_xlsx, file_size_csv, description, signee, audit_badge, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, 'verified',
			'2.5 MB', $7, '{}'::jsonb, $8, 251400, 99.5,
			$9, '2.5 MB', '1.4 MB', '520 KB', $10, $11, 'BPK Ready', NOW()
		)
	`, newID, newCode, req.Title, req.Period, req.Category, signee, req.Format, scope, formatsBytes, desc, signee)
	if err != nil {
		return nil, fmt.Errorf("gagal insert reports: %w", err)
	}

	// Audit Log
	detail := fmt.Sprintf("Generate Laporan Resmi Baru: [%s] %s (%s)", newCode, req.Title, req.Period)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'GENERATE_REPORT', $3, $4, NOW())
	`, uuid.New().String(), actorID, newID, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log generate report: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit generate report: %w", err)
	}

	return r.GetReportByID(ctx, newID)
}

func (r *postgresReportRepository) GetDigitalBasts(ctx context.Context, search string) ([]models.DigitalBast, error) {
	query := `
		SELECT id, ref_number, date, delivery_time, school_name, npsn, sppg_name, sppg_id,
		       menu_package, ordered_portions, verified_ai_portions, rejected_portions,
		       thermal_temp_arrive, lead_validator, driver_name, sha256_hash, qr_token_verified,
		       bsre_status, payment_clearance_status, payment_clearance_label, subtotal_amount,
		       approval_notes, created_at
		FROM digital_basts
	`
	var args []any
	if strings.TrimSpace(search) != "" {
		s := "%" + strings.TrimSpace(search) + "%"
		query += " WHERE ref_number ILIKE $1 OR school_name ILIKE $1 OR npsn ILIKE $1 OR sppg_name ILIKE $1"
		args = append(args, s)
	}
	query += " ORDER BY date DESC, delivery_time DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query digital_basts: %w", err)
	}
	defer rows.Close()

	var list []models.DigitalBast
	for rows.Next() {
		var b models.DigitalBast
		if err := rows.Scan(
			&b.ID, &b.RefNumber, &b.Date, &b.DeliveryTime, &b.SchoolName, &b.NPSN, &b.SPPGName, &b.SPPGID,
			&b.MenuPackage, &b.OrderedPortions, &b.VerifiedAiPortions, &b.RejectedPortions,
			&b.ThermalTempArrive, &b.LeadValidator, &b.DriverName, &b.Sha256Hash, &b.QrTokenVerified,
			&b.BsreStatus, &b.PaymentClearanceStatus, &b.PaymentClearanceLabel, &b.SubtotalAmount,
			&b.ApprovalNotes, &b.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan digital_bast: %w", err)
		}
		list = append(list, b)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterasi digital_basts: %w", err)
	}

	return list, nil
}

func (r *postgresReportRepository) GetDigitalBastByID(ctx context.Context, id string) (*models.DigitalBast, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, ref_number, date, delivery_time, school_name, npsn, sppg_name, sppg_id,
		       menu_package, ordered_portions, verified_ai_portions, rejected_portions,
		       thermal_temp_arrive, lead_validator, driver_name, sha256_hash, qr_token_verified,
		       bsre_status, payment_clearance_status, payment_clearance_label, subtotal_amount,
		       approval_notes, created_at
		FROM digital_basts WHERE id = $1
	`, id)

	var b models.DigitalBast
	if err := row.Scan(
		&b.ID, &b.RefNumber, &b.Date, &b.DeliveryTime, &b.SchoolName, &b.NPSN, &b.SPPGName, &b.SPPGID,
		&b.MenuPackage, &b.OrderedPortions, &b.VerifiedAiPortions, &b.RejectedPortions,
		&b.ThermalTempArrive, &b.LeadValidator, &b.DriverName, &b.Sha256Hash, &b.QrTokenVerified,
		&b.BsreStatus, &b.PaymentClearanceStatus, &b.PaymentClearanceLabel, &b.SubtotalAmount,
		&b.ApprovalNotes, &b.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("BAST dengan id %s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal ambil digital_bast %s: %w", id, err)
	}
	return &b, nil
}

func (r *postgresReportRepository) GetVendorInvoices(ctx context.Context, search string) ([]models.VendorInvoice, error) {
	query := `
		SELECT id, invoice_number, sppg_name, sppg_id, vendor_company, bank_account, period,
		       total_claimed_portions, total_claimed_amount, verified_bast_portions, rejected_deduction_portions,
		       penalty_deduction_amount, approved_payment_amount, bast_completeness_rate, status, status_label,
		       sp2d_number, notes, signed_at, signed_by, created_at
		FROM vendor_invoices
	`
	var args []any
	if strings.TrimSpace(search) != "" {
		s := "%" + strings.TrimSpace(search) + "%"
		query += " WHERE invoice_number ILIKE $1 OR sppg_name ILIKE $1 OR vendor_company ILIKE $1"
		args = append(args, s)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query vendor_invoices: %w", err)
	}
	defer rows.Close()

	var list []models.VendorInvoice
	for rows.Next() {
		var inv models.VendorInvoice
		if err := rows.Scan(
			&inv.ID, &inv.InvoiceNumber, &inv.SPPGName, &inv.SPPGID, &inv.VendorCompany, &inv.BankAccount, &inv.Period,
			&inv.TotalClaimedPortions, &inv.TotalClaimedAmount, &inv.VerifiedBastPortions, &inv.RejectedDeductionPortions,
			&inv.PenaltyDeductionAmount, &inv.ApprovedPaymentAmount, &inv.BastCompletenessRate, &inv.Status, &inv.StatusLabel,
			&inv.Sp2dNumber, &inv.Notes, &inv.SignedAt, &inv.SignedBy, &inv.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan vendor_invoice: %w", err)
		}
		list = append(list, inv)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterasi vendor_invoices: %w", err)
	}

	return list, nil
}

func (r *postgresReportRepository) GetVendorInvoiceByID(ctx context.Context, id string) (*models.VendorInvoice, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, invoice_number, sppg_name, sppg_id, vendor_company, bank_account, period,
		       total_claimed_portions, total_claimed_amount, verified_bast_portions, rejected_deduction_portions,
		       penalty_deduction_amount, approved_payment_amount, bast_completeness_rate, status, status_label,
		       sp2d_number, notes, signed_at, signed_by, created_at
		FROM vendor_invoices WHERE id = $1
	`, id)

	var inv models.VendorInvoice
	if err := row.Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.SPPGName, &inv.SPPGID, &inv.VendorCompany, &inv.BankAccount, &inv.Period,
		&inv.TotalClaimedPortions, &inv.TotalClaimedAmount, &inv.VerifiedBastPortions, &inv.RejectedDeductionPortions,
		&inv.PenaltyDeductionAmount, &inv.ApprovedPaymentAmount, &inv.BastCompletenessRate, &inv.Status, &inv.StatusLabel,
		&inv.Sp2dNumber, &inv.Notes, &inv.SignedAt, &inv.SignedBy, &inv.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("invoice dengan id %s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal ambil vendor_invoice %s: %w", id, err)
	}
	return &inv, nil
}

func (r *postgresReportRepository) AuthorizePayment(ctx context.Context, actorID, actorName, invoiceID string, req *models.AuthorizePaymentRequest) (*models.VendorInvoice, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal mulai transaksi otorisasi pembayaran: %w", err)
	}
	defer tx.Rollback(ctx)

	signedAt := time.Now().Format("2006-01-02 15:04 WIB")
	signedBy := actorName
	if strings.TrimSpace(signedBy) == "" {
		signedBy = "Superadmin Satgas MBG"
	}
	if strings.TrimSpace(req.SignerRole) != "" {
		signedBy = fmt.Sprintf("%s (%s)", signedBy, req.SignerRole)
	}

	result, err := tx.Exec(ctx, `
		UPDATE vendor_invoices
		SET status = 'approved_cleared',
		    status_label = 'Telah Ditandatangani (SP2D Terbit)',
		    sp2d_number = $1,
		    notes = $2,
		    signed_at = $3,
		    signed_by = $4
		WHERE id = $5
	`, req.Sp2dNumber, req.Notes, signedAt, signedBy, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("gagal update status invoice %s: %w", invoiceID, err)
	}
	if result.RowsAffected() == 0 {
		return nil, fmt.Errorf("invoice dengan id %s tidak ditemukan", invoiceID)
	}

	// Audit Log
	detail := fmt.Sprintf("Otorisasi Pencairan SP2D [%s] untuk Invoice %s. Ditandatangani oleh %s", req.Sp2dNumber, invoiceID, signedBy)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'CLEAR_PAYMENT', $3, $4, NOW())
	`, uuid.New().String(), actorID, invoiceID, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log pembayaran: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit otorisasi pembayaran: %w", err)
	}

	return r.GetVendorInvoiceByID(ctx, invoiceID)
}

func (r *postgresReportRepository) GetForensicFindings(ctx context.Context, search string) ([]models.ForensicAuditFinding, error) {
	query := `
		SELECT id, invoice_ref, sppg_name, date_logged, finding_type, finding_type_label,
		       claimed_portions, ai_valid_portions, discrepancy_count, potential_loss_amount,
		       severity, severity_label, explanation, action_taken, status, status_label, created_at
		FROM forensic_audit_findings
	`
	var args []any
	if strings.TrimSpace(search) != "" {
		s := "%" + strings.TrimSpace(search) + "%"
		query += " WHERE id ILIKE $1 OR sppg_name ILIKE $1 OR explanation ILIKE $1"
		args = append(args, s)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query forensic_audit_findings: %w", err)
	}
	defer rows.Close()

	var list []models.ForensicAuditFinding
	for rows.Next() {
		var f models.ForensicAuditFinding
		if err := rows.Scan(
			&f.ID, &f.InvoiceRef, &f.SPPGName, &f.DateLogged, &f.FindingType, &f.FindingTypeLabel,
			&f.ClaimedPortions, &f.AiValidPortions, &f.DiscrepancyCount, &f.PotentialLossAmount,
			&f.Severity, &f.SeverityLabel, &f.Explanation, &f.ActionTaken, &f.Status, &f.StatusLabel,
			&f.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("gagal scan forensic finding: %w", err)
		}
		list = append(list, f)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterasi forensic findings: %w", err)
	}

	return list, nil
}

func (r *postgresReportRepository) GetExecutiveStats(ctx context.Context) (*models.ReportExecutiveStats, error) {
	stats := &models.ReportExecutiveStats{}

	// 1. Total Reports Count
	_ = r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM reports").Scan(&stats.TotalReportsCount)

	// 2. Valid BAST Count (not blocked)
	_ = r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM digital_basts WHERE payment_clearance_status != 'blocked'").Scan(&stats.ValidBastCount)

	// 3. Approved Money & Safeguarded Money from Invoices
	_ = r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(approved_payment_amount), 0), COALESCE(SUM(penalty_deduction_amount), 0)
		FROM vendor_invoices
	`).Scan(&stats.TotalApprovedExact, &stats.TotalSafeguardedExact)

	stats.TotalApprovedMoney = float64(stats.TotalApprovedExact) / 1000000000.0 // Miliar
	stats.TotalSafeguardedMoney = float64(stats.TotalSafeguardedExact) / 1000000.0 // Juta

	return stats, nil
}

func (r *postgresReportRepository) GetBundle(ctx context.Context) (*models.ReportsBundle, error) {
	reports, err := r.GetReports(ctx, "", "")
	if err != nil {
		return nil, err
	}
	basts, err := r.GetDigitalBasts(ctx, "")
	if err != nil {
		return nil, err
	}
	invoices, err := r.GetVendorInvoices(ctx, "")
	if err != nil {
		return nil, err
	}
	findings, err := r.GetForensicFindings(ctx, "")
	if err != nil {
		return nil, err
	}
	stats, err := r.GetExecutiveStats(ctx)
	if err != nil {
		return nil, err
	}

	return &models.ReportsBundle{
		Reports:          reports,
		BastList:         basts,
		Invoices:         invoices,
		ForensicFindings: findings,
		Stats:            *stats,
	}, nil
}

func mapReportCategoryLabel(cat string) string {
	switch strings.ToLower(cat) {
	case "distribution":
		return "Distribusi & Logistik"
	case "nutrition":
		return "Kepatuhan Gizi & AKG"
	case "incidents":
		return "Logistik & Insiden"
	case "financial":
		return "Keuangan & APBN"
	case "attendance":
		return "Presensi & Efisiensi"
	default:
		return "Laporan Resmi Terpadu"
	}
}
