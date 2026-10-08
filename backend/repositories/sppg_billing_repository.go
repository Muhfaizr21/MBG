package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"
)

// SppgBillingRepository antarmuka abstraksi data klaim & penagihan invoice SPPG.
type SppgBillingRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgBillingBundle, error)
	ListRows(ctx context.Context, sppgID string) ([]models.SppgBillingRow, error)
	ListInvoices(ctx context.Context, sppgID string) ([]models.SppgInvoice, error)
	GetInvoice(ctx context.Context, sppgID string, invoiceID string) (*models.SppgInvoice, []models.SppgBillingRow, error)
	GenerateInvoice(ctx context.Context, sppgID string, period string) (*models.SppgInvoice, error)
	AdvanceInvoice(ctx context.Context, sppgID string, invoiceID string, targetStage string) (*models.SppgInvoice, error)
	AttachNotes(ctx context.Context, sppgID string, invoiceID string, filenames []string) (*models.SppgInvoice, error)
}

type pgSppgBillingRepository struct{}

// NewSppgBillingRepository membuat instance repository penagihan PostgreSQL baru.
func NewSppgBillingRepository() SppgBillingRepository {
	return &pgSppgBillingRepository{}
}

// ensureSettings mengambil atau menginisialisasi parameter penagihan dapur.
func (r *pgSppgBillingRepository) ensureSettings(ctx context.Context, sppgID string) (rate int, lateTol int, latePct int, invSeq int, err error) {
	query := `
		SELECT rate_per_portion, late_tolerance_minutes, late_penalty_pct, inv_seq
		FROM sppg_billing_settings
		WHERE sppg_id = $1
	`
	err = database.Pool().QueryRow(ctx, query, sppgID).Scan(&rate, &lateTol, &latePct, &invSeq)
	if err != nil {
		// Inisialisasi default jika belum ada
		initQuery := `
			INSERT INTO sppg_billing_settings (sppg_id, rate_per_portion, late_tolerance_minutes, late_penalty_pct, inv_seq, updated_at)
			VALUES ($1, 15000, 30, 5, 2, NOW())
			ON CONFLICT (sppg_id) DO UPDATE SET updated_at = NOW()
			RETURNING rate_per_portion, late_tolerance_minutes, late_penalty_pct, inv_seq
		`
		err = database.Pool().QueryRow(ctx, initQuery, sppgID).Scan(&rate, &lateTol, &latePct, &invSeq)
		if err != nil {
			return 15000, 30, 5, 2, fmt.Errorf("ensure billing settings failed: %w", err)
		}
	}
	return rate, lateTol, latePct, invSeq, nil
}

// getKitchenInfo mengambil nama dan kode dapur
func (r *pgSppgBillingRepository) getKitchenInfo(ctx context.Context, sppgID string) (name string, code string) {
	name = "Dapur SPPG " + sppgID
	code = sppgID
	query := `SELECT name, code FROM sppg_kitchens WHERE id = $1`
	_ = database.Pool().QueryRow(ctx, query, sppgID).Scan(&name, &code)
	return name, code
}

// computeRowAmounts menghitung nilai bruto, penalti telat > toleransi, dan tagihan bersih
func computeRowAmounts(row *models.SppgBillingRow, rate int, lateTol int, latePct int) {
	row.Valid = row.ValidPortions
	gross := int64(row.ValidPortions) * int64(rate)
	row.GrossAmount = gross

	if row.LateMinutes > lateTol {
		row.IsLate = true
		// Penalti 5% dari nilai kotor baris
		penalty := int64(float64(gross)*float64(latePct)/100.0 + 0.5)
		row.PenaltyAmount = penalty
	} else {
		row.IsLate = false
		row.PenaltyAmount = 0
	}

	row.NetAmount = row.GrossAmount - row.PenaltyAmount
}

// ListRows mengambil seluruh baris rekonsiliasi porsi untuk dapur tertentu
func (r *pgSppgBillingRepository) ListRows(ctx context.Context, sppgID string) ([]models.SppgBillingRow, error) {
	rate, lateTol, latePct, _, err := r.ensureSettings(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT b.id, b.sppg_id, b.school_id, b.school_name, b.bast_no, b.batch_token,
		       b.valid_portions, b.late_minutes, b.invoice_id, COALESCE(i.invoice_no, ''),
		       b.created_at, b.updated_at
		FROM sppg_billing_rows b
		LEFT JOIN sppg_invoices i ON b.invoice_id = i.id
		WHERE b.sppg_id = $1
		ORDER BY b.created_at ASC
	`

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list billing rows failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgBillingRow
	for rows.Next() {
		var row models.SppgBillingRow
		err := rows.Scan(
			&row.ID, &row.SppgID, &row.SchoolID, &row.SchoolName, &row.BastNo, &row.BatchToken,
			&row.ValidPortions, &row.LateMinutes, &row.InvoiceID, &row.InvoiceNo,
			&row.CreatedAt, &row.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan billing row failed: %w", err)
		}
		computeRowAmounts(&row, rate, lateTol, latePct)
		result = append(result, row)
	}
	if result == nil {
		result = []models.SppgBillingRow{}
	}
	return result, nil
}

// ListInvoices mengambil daftar berkas invoice beserta agregasi nilai tagihan
func (r *pgSppgBillingRepository) ListInvoices(ctx context.Context, sppgID string) ([]models.SppgInvoice, error) {
	rate, lateTol, latePct, _, err := r.ensureSettings(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 1. Ambil seluruh rows untuk perhitungan agregasi per invoice
	allRows, err := r.ListRows(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	rowsByInv := make(map[string][]models.SppgBillingRow)
	for _, row := range allRows {
		if row.InvoiceID != nil && *row.InvoiceID != "" {
			rowsByInv[*row.InvoiceID] = append(rowsByInv[*row.InvoiceID], row)
		}
	}

	// 2. Ambil seluruh invoice dapur
	query := `
		SELECT id, sppg_id, invoice_no, period_label, stage, notes, tax_slip, sp2d_number,
		       created_at, updated_at
		FROM sppg_invoices
		WHERE sppg_id = $1
		ORDER BY created_at ASC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list invoices failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgInvoice
	for rows.Next() {
		var inv models.SppgInvoice
		var notesBytes []byte
		err := rows.Scan(
			&inv.ID, &inv.SppgID, &inv.InvoiceNo, &inv.PeriodLabel, &inv.Stage,
			&notesBytes, &inv.TaxSlip, &inv.SP2DNumber,
			&inv.CreatedAt, &inv.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan invoice failed: %w", err)
		}

		inv.No = inv.InvoiceNo
		inv.Period = inv.PeriodLabel
		if len(notesBytes) > 0 {
			_ = json.Unmarshal(notesBytes, &inv.Notes)
		}
		if inv.Notes == nil {
			inv.Notes = []string{}
		}

		// Agregasi dari baris invoice
		invRows := rowsByInv[inv.ID]
		inv.RowCount = len(invRows)
		for _, r := range invRows {
			inv.TotalValidPortions += r.ValidPortions
			inv.GrossAmount += r.GrossAmount
			inv.PenaltyAmount += r.PenaltyAmount
			inv.NetAmount += r.NetAmount
		}

		result = append(result, inv)
	}

	// Sinkronisasi jika argumen unused
	_ = rate
	_ = lateTol
	_ = latePct

	if result == nil {
		result = []models.SppgInvoice{}
	}
	return result, nil
}

// GetInvoice mengambil detail invoice spesifik beserta rincian barisnya
func (r *pgSppgBillingRepository) GetInvoice(ctx context.Context, sppgID string, invoiceID string) (*models.SppgInvoice, []models.SppgBillingRow, error) {
	invoices, err := r.ListInvoices(ctx, sppgID)
	if err != nil {
		return nil, nil, err
	}

	var found *models.SppgInvoice
	for _, inv := range invoices {
		if inv.ID == invoiceID {
			invCopy := inv
			found = &invCopy
			break
		}
	}

	if found == nil {
		return nil, nil, errors.New("Invoice tidak ditemukan")
	}

	allRows, err := r.ListRows(ctx, sppgID)
	if err != nil {
		return nil, nil, err
	}

	var invRows []models.SppgBillingRow
	for _, row := range allRows {
		if row.InvoiceID != nil && *row.InvoiceID == invoiceID {
			invRows = append(invRows, row)
		}
	}

	return found, invRows, nil
}

// GetBundle mengambil bundle lengkap data klaim, total finansial, dan seluruh invoice
func (r *pgSppgBillingRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgBillingBundle, error) {
	rate, lateTol, latePct, invSeq, err := r.ensureSettings(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	kName, kCode := r.getKitchenInfo(ctx, sppgID)
	rows, err := r.ListRows(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	invoices, err := r.ListInvoices(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	var totals models.SppgBillingTotals
	totals.TotalRows = len(rows)
	totals.InvoiceCount = len(invoices)

	invMap := make(map[string]models.SppgInvoice)
	for _, inv := range invoices {
		invMap[inv.ID] = inv
	}

	for _, row := range rows {
		totals.Gross += row.GrossAmount
		totals.Penalty += row.PenaltyAmount
		totals.Net += row.NetAmount

		if row.InvoiceID == nil || *row.InvoiceID == "" {
			totals.FreeRows++
		} else if inv, ok := invMap[*row.InvoiceID]; ok && inv.Stage == "sp2d" {
			totals.Disbursed += row.NetAmount
		}
	}

	return &models.SppgBillingBundle{
		SppgID:               sppgID,
		KitchenName:          kName,
		KitchenCode:          kCode,
		RatePerPortion:       rate,
		LateToleranceMinutes: lateTol,
		LatePenaltyPct:       latePct,
		InvSeq:               invSeq,
		Totals:               totals,
		Rows:                 rows,
		Invoices:             invoices,
	}, nil
}

// GenerateInvoice membuat invoice baru secara atomik dari baris-baris yang masih bebas
func (r *pgSppgBillingRepository) GenerateInvoice(ctx context.Context, sppgID string, period string) (*models.SppgInvoice, error) {
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction failed: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Kunci dan baca nomor sekuens invoice
	var invSeq int
	err = tx.QueryRow(ctx, `
		SELECT inv_seq
		FROM sppg_billing_settings
		WHERE sppg_id = $1
		FOR UPDATE
	`, sppgID).Scan(&invSeq)
	if err != nil {
		// Inisialisasi jika belum ada
		invSeq = 2
		_, _ = tx.Exec(ctx, `
			INSERT INTO sppg_billing_settings (sppg_id, rate_per_portion, late_tolerance_minutes, late_penalty_pct, inv_seq, updated_at)
			VALUES ($1, 15000, 30, 5, 2, NOW())
			ON CONFLICT (sppg_id) DO NOTHING
		`, sppgID)
	}

	// 2. Kunci dan pastikan ada baris bebas
	var freeCount int
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM sppg_billing_rows
		WHERE sppg_id = $1 AND invoice_id IS NULL
	`, sppgID).Scan(&freeCount)
	if err != nil {
		return nil, fmt.Errorf("count free rows failed: %w", err)
	}

	if freeCount == 0 {
		return nil, errors.New("Semua baris sudah masuk invoice. Tidak ada yang bisa dikelompokkan.")
	}

	// 3. Format nomor invoice dan ID baru
	invoiceNo := fmt.Sprintf("INV/MBG/2026/%04d", invSeq)
	invoiceID := fmt.Sprintf("inv-%d-%s", time.Now().UnixNano(), strings.ToLower(sppgID))

	periodLabel := strings.TrimSpace(period)
	if periodLabel == "" {
		periodLabel = "29 September 2026"
	}

	// 4. Masukkan invoice baru dengan stage "draft"
	insertInvQuery := `
		INSERT INTO sppg_invoices (id, sppg_id, invoice_no, period_label, stage, notes, tax_slip, sp2d_number, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'draft', '[]'::jsonb, '', '', NOW(), NOW())
	`
	_, err = tx.Exec(ctx, insertInvQuery, invoiceID, sppgID, invoiceNo, periodLabel)
	if err != nil {
		return nil, fmt.Errorf("insert invoice failed: %w", err)
	}

	// 5. Update seluruh baris bebas agar terafiliasi dengan invoice baru
	updateRowsQuery := `
		UPDATE sppg_billing_rows
		SET invoice_id = $1, updated_at = NOW()
		WHERE sppg_id = $2 AND invoice_id IS NULL
	`
	_, err = tx.Exec(ctx, updateRowsQuery, invoiceID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("assign invoice to free rows failed: %w", err)
	}

	// 6. Inkrementasi nomor sekuens invoice
	_, err = tx.Exec(ctx, `
		UPDATE sppg_billing_settings
		SET inv_seq = inv_seq + 1, updated_at = NOW()
		WHERE sppg_id = $1
	`, sppgID)
	if err != nil {
		return nil, fmt.Errorf("increment inv_seq failed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit generate invoice failed: %w", err)
	}

	// Ambil data invoice terhitung
	inv, _, err := r.GetInvoice(ctx, sppgID, invoiceID)
	return inv, err
}

// AdvanceInvoice memajukan alur status invoice (draft -> verifikasi -> spm -> sp2d)
func (r *pgSppgBillingRepository) AdvanceInvoice(ctx context.Context, sppgID string, invoiceID string, targetStage string) (*models.SppgInvoice, error) {
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction failed: %w", err)
	}
	defer tx.Rollback(ctx)

	var currentStage, sp2dNumber, taxSlip string
	err = tx.QueryRow(ctx, `
		SELECT stage, sp2d_number, tax_slip
		FROM sppg_invoices
		WHERE id = $1 AND sppg_id = $2
		FOR UPDATE
	`, invoiceID, sppgID).Scan(&currentStage, &sp2dNumber, &taxSlip)
	if err != nil {
		return nil, errors.New("Invoice tidak ditemukan")
	}

	stageOrder := []string{"draft", "verifikasi", "spm", "sp2d"}
	currentIndex := -1
	for i, s := range stageOrder {
		if s == currentStage {
			currentIndex = i
			break
		}
	}

	if currentIndex < 0 {
		return nil, fmt.Errorf("Tahap invoice tidak valid: %s", currentStage)
	}
	if currentIndex >= len(stageOrder)-1 {
		return nil, errors.New("Invoice sudah mencapai tahap pencairan akhir (SP2D)")
	}

	nextStage := stageOrder[currentIndex+1]
	if targetStage != "" && targetStage != nextStage {
		// Validasi jika user mengirimkan target eksplisit
		isValid := false
		for _, s := range stageOrder[currentIndex+1:] {
			if s == targetStage {
				isValid = true
				nextStage = targetStage
				break
			}
		}
		if !isValid {
			return nil, fmt.Errorf("Transisi tahap dari %s ke %s tidak diizinkan", currentStage, targetStage)
		}
	}

	// Jika mencapai tahap SP2D, terbitkan nomor SP2D dan bukti potong pajak jika belum ada
	if nextStage == "sp2d" {
		if sp2dNumber == "" {
			sp2dNumber = fmt.Sprintf("SP2D/KPPN/2026/%04d", rand.Intn(9000)+1000)
		}
		if taxSlip == "" {
			taxSlip = fmt.Sprintf("BPN-PAJAK-2026-%04d", rand.Intn(9000)+1000)
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE sppg_invoices
		SET stage = $1, sp2d_number = $2, tax_slip = $3, updated_at = NOW()
		WHERE id = $4 AND sppg_id = $5
	`, nextStage, sp2dNumber, taxSlip, invoiceID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("update invoice stage failed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit advance invoice failed: %w", err)
	}

	inv, _, err := r.GetInvoice(ctx, sppgID, invoiceID)
	return inv, err
}

// AttachNotes melampirkan berkas nota belanja bahan baku ke dalam invoice untuk transparansi audit
func (r *pgSppgBillingRepository) AttachNotes(ctx context.Context, sppgID string, invoiceID string, filenames []string) (*models.SppgInvoice, error) {
	if len(filenames) == 0 {
		return nil, errors.New("Daftar nama berkas nota tidak boleh kosong")
	}

	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction failed: %w", err)
	}
	defer tx.Rollback(ctx)

	var notesBytes []byte
	err = tx.QueryRow(ctx, `
		SELECT notes
		FROM sppg_invoices
		WHERE id = $1 AND sppg_id = $2
		FOR UPDATE
	`, invoiceID, sppgID).Scan(&notesBytes)
	if err != nil {
		return nil, errors.New("Invoice tidak ditemukan")
	}

	var currentNotes []string
	if len(notesBytes) > 0 {
		_ = json.Unmarshal(notesBytes, &currentNotes)
	}

	existingMap := make(map[string]bool)
	for _, n := range currentNotes {
		existingMap[n] = true
	}

	for _, f := range filenames {
		clean := strings.TrimSpace(f)
		if clean != "" && !existingMap[clean] {
			currentNotes = append(currentNotes, clean)
			existingMap[clean] = true
		}
	}

	newBytes, err := json.Marshal(currentNotes)
	if err != nil {
		return nil, fmt.Errorf("marshal notes failed: %w", err)
	}

	_, err = tx.Exec(ctx, `
		UPDATE sppg_invoices
		SET notes = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`, newBytes, invoiceID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("update invoice notes failed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit attach notes failed: %w", err)
	}

	inv, _, err := r.GetInvoice(ctx, sppgID, invoiceID)
	return inv, err
}
