package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// SppgBatchRepository mengelola operasi database untuk batch masak, kontrol suhu HACCP, dan label QR thermal.
type SppgBatchRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgBatchBundle, error)
	List(ctx context.Context, sppgID string) ([]models.SppgBatch, error)
	GetByID(ctx context.Context, id string) (*models.SppgBatch, error)
	GetByToken(ctx context.Context, token string) (*models.SppgBatch, error)
	Create(ctx context.Context, batch *models.SppgBatch) error
	UpdateStatus(ctx context.Context, id, sppgID, status string) error
	SetVerified(ctx context.Context, id, sppgID string, verified bool) error
	Quarantine(ctx context.Context, id string, reason string, actorID, actorName string) (*models.SppgBatch, error)
	Delete(ctx context.Context, id, sppgID string) error
	NextSeqForSchool(ctx context.Context, sppgID, schoolID string) (int, error)
}

type pgSppgBatchRepository struct{}

// NewSppgBatchRepository membuat instance repository batch berbasis PostgreSQL.
func NewSppgBatchRepository() SppgBatchRepository {
	return &pgSppgBatchRepository{}
}

func (r *pgSppgBatchRepository) List(ctx context.Context, sppgID string) ([]models.SppgBatch, error) {
	query := `
		SELECT id, sppg_id, token, seq, school_id, school_code, school_name,
		       menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
		       allergens, status, verified, checksum,
		       cooking_date::text, target_portions, actual_portions, core_temp_c,
		       cook_lead, qc_status, haccp_status,
		       COALESCE(quarantine_reason, ''), COALESCE(quarantined_by, ''), quarantined_at,
		       created_at, updated_at
		FROM sppg_batches
		WHERE sppg_id = $1
		ORDER BY seq DESC, created_at DESC
	`

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("query batches failed: %w", err)
	}
	defer rows.Close()

	var batches []models.SppgBatch
	for rows.Next() {
		var b models.SppgBatch
		var allergensBytes []byte

		err := rows.Scan(
			&b.ID, &b.SppgID, &b.Token, &b.Seq, &b.SchoolID, &b.SchoolCode, &b.SchoolName,
			&b.MenuCode, &b.MenuName, &b.BoxCount, &b.CookedAt, &b.ConsumeBy, &b.CookTemp,
			&allergensBytes, &b.Status, &b.Verified, &b.Checksum,
			&b.CookingDate, &b.TargetPortions, &b.ActualPortions, &b.CoreTempC,
			&b.CookLead, &b.QCStatus, &b.HACCPStatus,
			&b.QuarantineReason, &b.QuarantinedBy, &b.QuarantinedAt,
			&b.CreatedAt, &b.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan batch failed: %w", err)
		}

		if len(allergensBytes) > 0 {
			_ = json.Unmarshal(allergensBytes, &b.Allergens)
		}
		if b.Allergens == nil {
			b.Allergens = []string{}
		}

		batches = append(batches, b)
	}

	if batches == nil {
		batches = []models.SppgBatch{}
	}
	return batches, nil
}

func (r *pgSppgBatchRepository) GetByID(ctx context.Context, id string) (*models.SppgBatch, error) {
	query := `
		SELECT id, sppg_id, token, seq, school_id, school_code, school_name,
		       menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
		       allergens, status, verified, checksum,
		       cooking_date::text, target_portions, actual_portions, core_temp_c,
		       cook_lead, qc_status, haccp_status,
		       COALESCE(quarantine_reason, ''), COALESCE(quarantined_by, ''), quarantined_at,
		       created_at, updated_at
		FROM sppg_batches
		WHERE id = $1
	`
	var b models.SppgBatch
	var allergensBytes []byte

	err := database.Pool().QueryRow(ctx, query, id).Scan(
		&b.ID, &b.SppgID, &b.Token, &b.Seq, &b.SchoolID, &b.SchoolCode, &b.SchoolName,
		&b.MenuCode, &b.MenuName, &b.BoxCount, &b.CookedAt, &b.ConsumeBy, &b.CookTemp,
		&allergensBytes, &b.Status, &b.Verified, &b.Checksum,
		&b.CookingDate, &b.TargetPortions, &b.ActualPortions, &b.CoreTempC,
		&b.CookLead, &b.QCStatus, &b.HACCPStatus,
		&b.QuarantineReason, &b.QuarantinedBy, &b.QuarantinedAt,
		&b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get batch by id failed: %w", err)
	}

	if len(allergensBytes) > 0 {
		_ = json.Unmarshal(allergensBytes, &b.Allergens)
	}
	if b.Allergens == nil {
		b.Allergens = []string{}
	}

	return &b, nil
}

func (r *pgSppgBatchRepository) GetByToken(ctx context.Context, token string) (*models.SppgBatch, error) {
	query := `
		SELECT id, sppg_id, token, seq, school_id, school_code, school_name,
		       menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
		       allergens, status, verified, checksum,
		       cooking_date::text, target_portions, actual_portions, core_temp_c,
		       cook_lead, qc_status, haccp_status,
		       COALESCE(quarantine_reason, ''), COALESCE(quarantined_by, ''), quarantined_at,
		       created_at, updated_at
		FROM sppg_batches
		WHERE token = $1
	`
	var b models.SppgBatch
	var allergensBytes []byte

	err := database.Pool().QueryRow(ctx, query, token).Scan(
		&b.ID, &b.SppgID, &b.Token, &b.Seq, &b.SchoolID, &b.SchoolCode, &b.SchoolName,
		&b.MenuCode, &b.MenuName, &b.BoxCount, &b.CookedAt, &b.ConsumeBy, &b.CookTemp,
		&allergensBytes, &b.Status, &b.Verified, &b.Checksum,
		&b.CookingDate, &b.TargetPortions, &b.ActualPortions, &b.CoreTempC,
		&b.CookLead, &b.QCStatus, &b.HACCPStatus,
		&b.QuarantineReason, &b.QuarantinedBy, &b.QuarantinedAt,
		&b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get batch by token failed: %w", err)
	}

	if len(allergensBytes) > 0 {
		_ = json.Unmarshal(allergensBytes, &b.Allergens)
	}
	if b.Allergens == nil {
		b.Allergens = []string{}
	}

	return &b, nil
}

func (r *pgSppgBatchRepository) NextSeqForSchool(ctx context.Context, sppgID, schoolID string) (int, error) {
	var maxSeq int
	err := database.Pool().QueryRow(ctx, `
		SELECT COALESCE(MAX(seq), 0)
		FROM sppg_batches
		WHERE sppg_id = $1 AND (school_id = $2 OR cooking_date = CURRENT_DATE)
	`, sppgID, schoolID).Scan(&maxSeq)
	if err != nil {
		return 1, nil
	}
	return maxSeq + 1, nil
}

func (r *pgSppgBatchRepository) Create(ctx context.Context, b *models.SppgBatch) error {
	allergensJSON, err := json.Marshal(b.Allergens)
	if err != nil {
		allergensJSON = []byte("[]")
	}

	if b.ID == "" {
		b.ID = fmt.Sprintf("batch-%d", time.Now().UnixMilli())
	}
	if b.Status == "" {
		b.Status = "draft"
	}
	if b.QCStatus == "" {
		b.QCStatus = "passed"
	}
	if b.HACCPStatus == "" {
		b.HACCPStatus = "safe"
	}

	query := `
		INSERT INTO sppg_batches (
			id, sppg_id, token, seq, school_id, school_code, school_name,
			menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
			allergens, status, verified, checksum,
			cooking_date, target_portions, actual_portions, core_temp_c,
			cook_lead, qc_status, haccp_status,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17,
			CURRENT_DATE, $18, $19, $20,
			$21, $22, $23,
			NOW(), NOW()
		)
	`

	_, err = database.Pool().Exec(
		ctx, query,
		b.ID, b.SppgID, b.Token, b.Seq, b.SchoolID, b.SchoolCode, b.SchoolName,
		b.MenuCode, b.MenuName, b.BoxCount, b.CookedAt, b.ConsumeBy, b.CookTemp,
		allergensJSON, b.Status, b.Verified, b.Checksum,
		b.BoxCount, b.BoxCount, b.CookTemp,
		b.CookLead, b.QCStatus, b.HACCPStatus,
	)
	if err != nil {
		return fmt.Errorf("insert batch failed: %w", err)
	}

	return nil
}

func (r *pgSppgBatchRepository) UpdateStatus(ctx context.Context, id, sppgID, status string) error {
	res, err := database.Pool().Exec(ctx, `
		UPDATE sppg_batches
		SET status = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`, status, id, sppgID)
	if err != nil {
		return fmt.Errorf("update status failed: %w", err)
	}
	if res.RowsAffected() == 0 {
		return errors.New("batch tidak ditemukan")
	}
	return nil
}

func (r *pgSppgBatchRepository) SetVerified(ctx context.Context, id, sppgID string, verified bool) error {
	_, err := database.Pool().Exec(ctx, `
		UPDATE sppg_batches
		SET verified = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`, verified, id, sppgID)
	return err
}

// Quarantine mengeksekusi karantina/recall batch oleh Superadmin dan mencatat audit_logs secara atomik.
func (r *pgSppgBatchRepository) Quarantine(ctx context.Context, id string, reason string, actorID, actorName string) (*models.SppgBatch, error) {
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":        "quarantine",
		"reason":        reason,
		"quarantinedBy": actorName,
		"timestamp":     time.Now().Format(time.RFC3339),
	})

	query := `
		WITH upd AS (
			UPDATE sppg_batches
			SET status = 'quarantined',
			    quarantine_reason = $1,
			    quarantined_by = $2,
			    quarantined_at = NOW(),
			    updated_at = NOW()
			WHERE id = $3
			RETURNING id, sppg_id, token, seq, school_id, school_code, school_name,
			          menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
			          allergens, status, verified, checksum,
			          cooking_date::text, target_portions, actual_portions, core_temp_c,
			          cook_lead, qc_status, haccp_status,
			          quarantine_reason, quarantined_by, quarantined_at,
			          created_at, updated_at
		), aud AS (
			INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
			SELECT $4, $5, 'batch.quarantine', upd.token, $6, NOW()
			FROM upd
		)
		SELECT id, sppg_id, token, seq, school_id, school_code, school_name,
		       menu_code, menu_name, box_count, cooked_at, consume_by, cook_temp,
		       allergens, status, verified, checksum,
		       cooking_date, target_portions, actual_portions, core_temp_c,
		       cook_lead, qc_status, haccp_status,
		       quarantine_reason, quarantined_by, quarantined_at,
		       created_at, updated_at
		FROM upd
	`

	var b models.SppgBatch
	var allergensBytes []byte

	err := database.Pool().QueryRow(
		ctx, query,
		reason, actorName, id,
		auditID, actorID, string(detailJSON),
	).Scan(
		&b.ID, &b.SppgID, &b.Token, &b.Seq, &b.SchoolID, &b.SchoolCode, &b.SchoolName,
		&b.MenuCode, &b.MenuName, &b.BoxCount, &b.CookedAt, &b.ConsumeBy, &b.CookTemp,
		&allergensBytes, &b.Status, &b.Verified, &b.Checksum,
		&b.CookingDate, &b.TargetPortions, &b.ActualPortions, &b.CoreTempC,
		&b.CookLead, &b.QCStatus, &b.HACCPStatus,
		&b.QuarantineReason, &b.QuarantinedBy, &b.QuarantinedAt,
		&b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("batch tidak ditemukan")
		}
		return nil, fmt.Errorf("quarantine batch failed: %w", err)
	}

	if len(allergensBytes) > 0 {
		_ = json.Unmarshal(allergensBytes, &b.Allergens)
	}
	if b.Allergens == nil {
		b.Allergens = []string{}
	}

	return &b, nil
}

func (r *pgSppgBatchRepository) Delete(ctx context.Context, id, sppgID string) error {
	res, err := database.Pool().Exec(ctx, `
		DELETE FROM sppg_batches
		WHERE id = $1 AND sppg_id = $2 AND status = 'draft'
	`, id, sppgID)
	if err != nil {
		return fmt.Errorf("delete batch failed: %w", err)
	}
	if res.RowsAffected() == 0 {
		return errors.New("hanya batch berstatus draft yang dapat dihapus")
	}
	return nil
}

func (r *pgSppgBatchRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgBatchBundle, error) {
	// 1. Profil Dapur
	var kitchenCode, kitchenName string
	var maxPortions int
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name, COALESCE(max_daily_portions, 2500)
		FROM sppg_kitchens
		WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName, &maxPortions)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
		maxPortions = 2500
	}

	// 2. Daftar Batch
	batches, err := r.List(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 3. Sekolah Terkait
	schoolRows, err := database.Pool().Query(ctx, `
		SELECT id, COALESCE(npsn, id), name, COALESCE(total_students, 500),
		       COALESCE(address, ''), COALESCE(city, 'Jakarta'), COALESCE(level, 'SD')
		FROM schools
		WHERE sppg_id = $1 OR sppg_id IS NULL OR sppg_id = ''
		ORDER BY name ASC
	`, sppgID)
	var availableSchools []models.AssignedSchoolSummary
	if err == nil {
		defer schoolRows.Close()
		for schoolRows.Next() {
			var s models.AssignedSchoolSummary
			if err := schoolRows.Scan(&s.ID, &s.Code, &s.Name, &s.Quota, &s.Address, &s.City, &s.Level); err == nil {
				availableSchools = append(availableSchools, s)
			}
		}
	}
	if len(availableSchools) == 0 {
		// Fallback data sekolah standar bila query kosong
		availableSchools = []models.AssignedSchoolSummary{
			{ID: "sch-01", Code: "SDN01P", Name: "SDN Menteng 01 Pagi", Quota: 650, Level: "SD"},
			{ID: "sch-02", Code: "SDN02", Name: "SDN Kebayoran Baru 02", Quota: 800, Level: "SD"},
			{ID: "sch-03", Code: "SMPN03", Name: "SMPN 3 Jakarta", Quota: 750, Level: "SMP"},
			{ID: "sch-04", Code: "SDN01C", Name: "SDN Cikini 01", Quota: 550, Level: "SD"},
		}
	}

	// 4. Menu Terkait
	menuRows, err := database.Pool().Query(ctx, `
		SELECT id, code, name, allergens
		FROM sppg_menu_packages
		WHERE is_national = true OR sppg_id = $1
		ORDER BY code ASC
	`, sppgID)
	var availableMenus []models.MenuPackageSummary
	if err == nil {
		defer menuRows.Close()
		for menuRows.Next() {
			var m models.MenuPackageSummary
			var allergensBytes []byte
			if err := menuRows.Scan(&m.ID, &m.Code, &m.Name, &allergensBytes); err == nil {
				if len(allergensBytes) > 0 {
					_ = json.Unmarshal(allergensBytes, &m.Allergens)
				}
				if m.Allergens == nil {
					m.Allergens = []string{}
				}
				availableMenus = append(availableMenus, m)
			}
		}
	}
	if len(availableMenus) == 0 {
		availableMenus = []models.MenuPackageSummary{
			{ID: "paket-a", Code: "PAKET-A-01", Name: "Nasi Ayam Panggang Madu & Capcay Brokoli Segar", Allergens: []string{"Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"}},
			{ID: "paket-b", Code: "PAKET-B-02", Name: "Nasi Ikan Kembung Bumbu Kuning & Sayur Asem", Allergens: []string{"Ikan Laut"}},
			{ID: "paket-c", Code: "PAKET-C-03", Name: "Nasi Semur Daging Sapi & Tumis Buncis Jagung", Allergens: []string{"Kedelai (Kecap)"}},
		}
	}

	// Hitung Totals
	totalBoxes := 0
	totalTotes := 0
	queuedCount := 0
	verifiedCount := 0
	for _, b := range batches {
		totalBoxes += b.BoxCount
		// 50 boks per tote
		totes := b.BoxCount / 50
		if b.BoxCount%50 != 0 {
			totes++
		}
		totalTotes += totes
		if b.Status == "queued" {
			queuedCount++
		}
		if b.Verified {
			verifiedCount++
		}
	}

	bundle := &models.SppgBatchBundle{
		Batches:          batches,
		SppgID:           sppgID,
		KitchenName:      kitchenName,
		KitchenCode:      kitchenCode,
		CookingDate:      time.Now().Format("2006-01-02"),
		TargetBoxes:      maxPortions,
		TotalBoxes:       totalBoxes,
		TotalTotes:       totalTotes,
		QueuedCount:      queuedCount,
		VerifiedCount:    verifiedCount,
		AvailableSchools: availableSchools,
		AvailableMenus:   availableMenus,
	}

	return bundle, nil
}
