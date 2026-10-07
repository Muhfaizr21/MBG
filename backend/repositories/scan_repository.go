package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

// ScanRepository defines persistence operations for scan audit logs.
type ScanRepository interface {
	InsertScan(ctx context.Context, log *models.ScanLog) error
	CountToday(ctx context.Context) (int, error)
	ListRecentScans(ctx context.Context, limit int) ([]models.ScanLog, error)
	UpdateScanFeedback(ctx context.Context, id string, rating int, feedback string, tempC *float64) error
	DeleteScan(ctx context.Context, id string) (string, error)
	DeleteAllScans(ctx context.Context) ([]string, error)
}

type pgScanRepository struct{}

// NewScanRepository returns the PostgreSQL-backed ScanRepository.
func NewScanRepository() ScanRepository {
	return &pgScanRepository{}
}

const scanColumns = `id, box_id, qr_token, batch_id, image_ref, ai_class, ai_confidence,
	visual_score, holding_temp_c, release_temp_c, duration_ms, verdict, reason, actor_id, created_at, rating, feedback`

func (r *pgScanRepository) scanLog(row pgx.Row) (*models.ScanLog, error) {
	s := &models.ScanLog{}
	err := row.Scan(&s.ID, &s.BoxID, &s.QRToken, &s.BatchID, &s.ImageRef,
		&s.AIClass, &s.AIConfidence, &s.VisualScore, &s.HoldingTempC, &s.ReleaseTempC,
		&s.DurationMS, &s.Verdict, &s.Reason, &s.ActorID, &s.CreatedAt, &s.Rating, &s.Feedback)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return s, nil
}

func (r *pgScanRepository) InsertScan(ctx context.Context, log *models.ScanLog) error {
	createdAt := log.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Now()
	}
	_, err := database.Pool().Exec(ctx, `
		INSERT INTO scan_logs (id, box_id, qr_token, batch_id, image_ref, ai_class,
			ai_confidence, visual_score, holding_temp_c, release_temp_c, duration_ms,
			verdict, reason, actor_id, created_at, rating, feedback)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
		log.ID, log.BoxID, log.QRToken, log.BatchID, log.ImageRef, log.AIClass,
		log.AIConfidence, log.VisualScore, log.HoldingTempC, log.ReleaseTempC,
		log.DurationMS, log.Verdict, log.Reason, log.ActorID, createdAt, log.Rating, log.Feedback)
	return err
}

func (r *pgScanRepository) CountToday(ctx context.Context) (int, error) {
	var count int
	err := database.Pool().QueryRow(ctx,
		`SELECT COUNT(*) FROM scan_logs WHERE created_at::date = CURRENT_DATE`).Scan(&count)
	return count, err
}

func (r *pgScanRepository) ListRecentScans(ctx context.Context, limit int) ([]models.ScanLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := database.Pool().Query(ctx,
		"SELECT "+scanColumns+" FROM scan_logs ORDER BY created_at DESC LIMIT $1", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []models.ScanLog
	for rows.Next() {
		entry := models.ScanLog{}
		var created time.Time
		if err := rows.Scan(&entry.ID, &entry.BoxID, &entry.QRToken, &entry.BatchID,
			&entry.ImageRef, &entry.AIClass, &entry.AIConfidence, &entry.VisualScore,
			&entry.HoldingTempC, &entry.ReleaseTempC, &entry.Verdict, &entry.Reason,
			&entry.ActorID, &created, &entry.Rating, &entry.Feedback); err != nil {
			return nil, err
		}
		entry.CreatedAt = created
		out = append(out, entry)
	}
	return out, rows.Err()
}

func (r *pgScanRepository) UpdateScanFeedback(ctx context.Context, id string, rating int, feedback string, tempC *float64) error {
	var err error
	if tempC != nil {
		_, err = database.Pool().Exec(ctx,
			"UPDATE scan_logs SET rating = $1, feedback = $2, holding_temp_c = COALESCE(holding_temp_c, $3) WHERE id = $4",
			rating, feedback, *tempC, id)
	} else {
		_, err = database.Pool().Exec(ctx,
			"UPDATE scan_logs SET rating = $1, feedback = $2 WHERE id = $3",
			rating, feedback, id)
	}
	return err
}

func (r *pgScanRepository) DeleteScan(ctx context.Context, id string) (string, error) {
	var imageRef string
	err := database.Pool().QueryRow(ctx,
		"DELETE FROM scan_logs WHERE id = $1 RETURNING image_ref",
		id).Scan(&imageRef)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return imageRef, nil
}

func (r *pgScanRepository) DeleteAllScans(ctx context.Context) ([]string, error) {
	rows, err := database.Pool().Query(ctx, "DELETE FROM scan_logs RETURNING image_ref")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var imageRefs []string
	for rows.Next() {
		var ref string
		if err := rows.Scan(&ref); err == nil && ref != "" {
			imageRefs = append(imageRefs, ref)
		}
	}
	return imageRefs, rows.Err()
}
