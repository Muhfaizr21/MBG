package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// SppgQualityRepository mendefinisikan operasi persistensi database untuk log kontrol mutu HACCP, uji sensori, dan sampel arsip.
type SppgQualityRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgQualityBundle, error)
	ListTempLogs(ctx context.Context, sppgID string) ([]models.SppgQualityTempLog, error)
	CreateTempLog(ctx context.Context, log *models.SppgQualityTempLog) error
	ListSignoffs(ctx context.Context, sppgID string) ([]models.SppgQualitySignoff, error)
	CreateSignoff(ctx context.Context, signoff *models.SppgQualitySignoff) error
	ListSamples(ctx context.Context, sppgID string) ([]models.SppgQualitySample, error)
	CreateSample(ctx context.Context, sample *models.SppgQualitySample) error
	UpdateSampleStatus(ctx context.Context, id, sppgID, status string) error
	SuperadminIntervention(ctx context.Context, batchToken, action, reason, actorID, actorName string) error
}

type pgSppgQualityRepository struct{}

// NewSppgQualityRepository membuat instance repository baru berbasis PostgreSQL.
func NewSppgQualityRepository() SppgQualityRepository {
	return &pgSppgQualityRepository{}
}

func (r *pgSppgQualityRepository) ListTempLogs(ctx context.Context, sppgID string) ([]models.SppgQualityTempLog, error) {
	query := `
		SELECT id, sppg_id, point_id, batch_token, value, hold_minutes,
		       measured_at, measured_by, evidence_name, pass, verdict, created_at
		FROM sppg_quality_temp_logs
		WHERE sppg_id = $1
		ORDER BY created_at DESC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list temp logs failed: %w", err)
	}
	defer rows.Close()

	var logs []models.SppgQualityTempLog
	for rows.Next() {
		var l models.SppgQualityTempLog
		err := rows.Scan(
			&l.ID, &l.SppgID, &l.PointID, &l.BatchToken, &l.Value, &l.HoldMinutes,
			&l.MeasuredAt, &l.MeasuredBy, &l.EvidenceName, &l.Pass, &l.Verdict, &l.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan temp log failed: %w", err)
		}
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.SppgQualityTempLog{}
	}
	return logs, nil
}

func (r *pgSppgQualityRepository) CreateTempLog(ctx context.Context, l *models.SppgQualityTempLog) error {
	if l.ID == "" {
		l.ID = fmt.Sprintf("log-%d", time.Now().UnixMilli())
	}
	query := `
		INSERT INTO sppg_quality_temp_logs (
			id, sppg_id, point_id, batch_token, value, hold_minutes,
			measured_at, measured_by, evidence_name, pass, verdict, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
		)
	`
	_, err := database.Pool().Exec(
		ctx, query,
		l.ID, l.SppgID, l.PointID, l.BatchToken, l.Value, l.HoldMinutes,
		l.MeasuredAt, l.MeasuredBy, l.EvidenceName, l.Pass, l.Verdict,
	)
	return err
}

func (r *pgSppgQualityRepository) ListSignoffs(ctx context.Context, sppgID string) ([]models.SppgQualitySignoff, error) {
	query := `
		SELECT id, sppg_id, batch_token, aspects, note, signer, signed_at, layak, created_at
		FROM sppg_quality_signoffs
		WHERE sppg_id = $1
		ORDER BY created_at DESC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list signoffs failed: %w", err)
	}
	defer rows.Close()

	var list []models.SppgQualitySignoff
	for rows.Next() {
		var s models.SppgQualitySignoff
		var aspectsBytes []byte
		err := rows.Scan(
			&s.ID, &s.SppgID, &s.BatchToken, &aspectsBytes, &s.Note, &s.Signer, &s.SignedAt, &s.Layak, &s.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan signoff failed: %w", err)
		}
		if len(aspectsBytes) > 0 {
			_ = json.Unmarshal(aspectsBytes, &s.Aspects)
		}
		if s.Aspects == nil {
			s.Aspects = make(map[string]string)
		}
		list = append(list, s)
	}
	if list == nil {
		list = []models.SppgQualitySignoff{}
	}
	return list, nil
}

func (r *pgSppgQualityRepository) CreateSignoff(ctx context.Context, s *models.SppgQualitySignoff) error {
	if s.ID == "" {
		s.ID = fmt.Sprintf("rel-%d", time.Now().UnixMilli())
	}
	aspectsJSON, err := json.Marshal(s.Aspects)
	if err != nil {
		aspectsJSON = []byte("{}")
	}

	query := `
		INSERT INTO sppg_quality_signoffs (
			id, sppg_id, batch_token, aspects, note, signer, signed_at, layak, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, NOW()
		)
	`
	_, err = database.Pool().Exec(
		ctx, query,
		s.ID, s.SppgID, s.BatchToken, aspectsJSON, s.Note, s.Signer, s.SignedAt, s.Layak,
	)
	return err
}

func (r *pgSppgQualityRepository) ListSamples(ctx context.Context, sppgID string) ([]models.SppgQualitySample, error) {
	query := `
		SELECT id, sppg_id, batch_token, rack_no, stored_at, stored_by, status, destroyed_at, created_at
		FROM sppg_quality_samples
		WHERE sppg_id = $1
		ORDER BY created_at DESC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list samples failed: %w", err)
	}
	defer rows.Close()

	var samples []models.SppgQualitySample
	for rows.Next() {
		var sm models.SppgQualitySample
		err := rows.Scan(
			&sm.ID, &sm.SppgID, &sm.BatchToken, &sm.RackNo, &sm.StoredAt, &sm.StoredBy,
			&sm.Status, &sm.DestroyedAt, &sm.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan sample failed: %w", err)
		}
		sm.RetentionDeadline = formatRetentionDeadline(sm.StoredAt)
		samples = append(samples, sm)
	}
	if samples == nil {
		samples = []models.SppgQualitySample{}
	}
	return samples, nil
}

func (r *pgSppgQualityRepository) CreateSample(ctx context.Context, sm *models.SppgQualitySample) error {
	if sm.ID == "" {
		sm.ID = fmt.Sprintf("smp-%d", time.Now().UnixMilli())
	}
	if sm.Status == "" {
		sm.Status = "tersimpan"
	}
	query := `
		INSERT INTO sppg_quality_samples (
			id, sppg_id, batch_token, rack_no, stored_at, stored_by, status, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW()
		)
	`
	_, err := database.Pool().Exec(
		ctx, query,
		sm.ID, sm.SppgID, sm.BatchToken, sm.RackNo, sm.StoredAt, sm.StoredBy, sm.Status,
	)
	return err
}

func (r *pgSppgQualityRepository) UpdateSampleStatus(ctx context.Context, id, sppgID, status string) error {
	res, err := database.Pool().Exec(ctx, `
		UPDATE sppg_quality_samples
		SET status = $1::text, destroyed_at = CASE WHEN $1::text = 'dimusnahkan' THEN NOW() ELSE destroyed_at END
		WHERE id = $2 AND sppg_id = $3
	`, status, id, sppgID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("sampel arsip tidak ditemukan")
	}
	return nil
}

// SuperadminIntervention mengeksekusi karantina darurat atau surat peringatan bahaya HACCP oleh Superadmin.
func (r *pgSppgQualityRepository) SuperadminIntervention(ctx context.Context, batchToken, action, reason, actorID, actorName string) error {
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"module":      "haccp_quality",
		"action":      action,
		"reason":      reason,
		"intervenedBy": actorName,
		"timestamp":   time.Now().Format(time.RFC3339),
	})

	// 1. Tulis jejak audit forensik
	_, err := database.Pool().Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, auditID, actorID, "haccp."+action, batchToken, string(detailJSON))
	if err != nil {
		return fmt.Errorf("audit log failed: %w", err)
	}

	// 2. Jika aksi adalah karantina, update status batch di tabel sppg_batches
	if action == "quarantine" {
		_, err = database.Pool().Exec(ctx, `
			UPDATE sppg_batches
			SET status = 'quarantined',
			    quarantine_reason = $1,
			    quarantined_by = $2,
			    quarantined_at = NOW(),
			    updated_at = NOW()
			WHERE token = $3
		`, reason, actorName, batchToken)
		if err != nil {
			return fmt.Errorf("update batch quarantine failed: %w", err)
		}
	}

	return nil
}

func (r *pgSppgQualityRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgQualityBundle, error) {
	// 1. Profil Dapur
	var kitchenCode, kitchenName string
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name FROM sppg_kitchens WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
	}

	// 2. Log Suhu
	tempLogs, err := r.ListTempLogs(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 3. Rilis Mutu Sensori
	signoffs, err := r.ListSignoffs(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 4. Sampel Arsip
	samples, err := r.ListSamples(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 5. Active Batch Tokens untuk Dapur Ini
	batchRows, err := database.Pool().Query(ctx, `
		SELECT token FROM sppg_batches WHERE sppg_id = $1 ORDER BY seq DESC LIMIT 20
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
	if len(activeBatches) == 0 {
		activeBatches = []string{
			fmt.Sprintf("MBG-2026-%s-SDN01P-B01", strings.ReplaceAll(sppgID, "-", "")),
			fmt.Sprintf("MBG-2026-%s-SMPN03-B02", strings.ReplaceAll(sppgID, "-", "")),
		}
	}

	// 6. Hitung Metrik Ringkasan
	passCount := 0
	for _, l := range tempLogs {
		if l.Pass {
			passCount++
		}
	}
	storedSamplesCount := 0
	for _, sm := range samples {
		if sm.Status == "tersimpan" {
			storedSamplesCount++
		}
	}

	complianceRate := 100.0
	if len(tempLogs) > 0 {
		complianceRate = float64(passCount) / float64(len(tempLogs)) * 100.0
	}

	summary := models.SppgQualitySummary{
		PassCount:           passCount,
		TotalCount:          len(tempLogs),
		StoredSamplesCount:  storedSamplesCount,
		SignedReleasesCount: len(signoffs),
		ComplianceRate:      complianceRate,
	}

	bundle := &models.SppgQualityBundle{
		SppgID:        sppgID,
		KitchenName:   kitchenName,
		KitchenCode:   kitchenCode,
		ShiftLabel:    "SHIFT 03.30-07.30",
		Summary:       summary,
		TempLogs:      tempLogs,
		Signoffs:      signoffs,
		Samples:       samples,
		ActiveBatches: activeBatches,
	}

	return bundle, nil
}

func formatRetentionDeadline(storedAt string) string {
	t, err := time.Parse("2006-01-02T15:04", storedAt)
	if err != nil {
		t, err = time.Parse(time.RFC3339, storedAt)
		if err != nil {
			return "-"
		}
	}
	deadline := t.Add(48 * time.Hour)
	return deadline.Format("02 Jan, 15:04 WIB")
}
