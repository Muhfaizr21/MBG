package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// Aksi audit telemetri pengiriman makanan MBG
const (
	AuditDeliveryOverride = "delivery.override"
	AuditDeliveryLabTest  = "delivery.lab.test"
)

// DeliveryRepository persistence layer untuk telemetri pengiriman makanan
type DeliveryRepository interface {
	List(ctx context.Context) ([]models.Delivery, error)
	Get(ctx context.Context, id string) (*models.Delivery, error)
	OverrideAI(ctx context.Context, id, auditorName, reason, actorID string) (*models.Delivery, error)
	OrderLabTest(ctx context.Context, id, labTarget, dinkesOffice, notes, actorID string) (*models.Delivery, error)
}

type pgDeliveryRepository struct{}

// NewDeliveryRepository constructor persistence delivery
func NewDeliveryRepository() DeliveryRepository {
	return &pgDeliveryRepository{}
}

const deliveryColumns = `
	d.id, COALESCE(d.batch_id, ''), COALESCE(d.sppg_id, ''),
	COALESCE(k.name, ''), COALESCE(k.code, ''),
	d.school_npsn, COALESCE(s.name, ''), COALESCE(s.city, ''), COALESCE(s.district, ''),
	d.validator_name, d.scanned_at, d.scan_date::TEXT,
	d.portions, d.target_portions, d.temp_c, d.temp_status,
	d.qr_token, d.qr_status, d.crypto_hash, d.menu_name,
	d.ai_verdict, d.ai_score, d.image_url, d.status,
	COALESCE(d.override_by, ''), COALESCE(d.override_reason, ''), d.overridden_at,
	COALESCE(d.lab_target, ''), COALESCE(d.lab_notes, ''), d.lab_ordered_at,
	d.created_at`

func scanDelivery(row interface{ Scan(...any) error }) (*models.Delivery, error) {
	d := &models.Delivery{}
	if err := row.Scan(
		&d.ID, &d.BatchID, &d.SPPGID,
		&d.SPPGName, &d.SPPGCode,
		&d.SchoolNPSN, &d.SchoolName, &d.City, &d.District,
		&d.ValidatorName, &d.ScannedAt, &d.ScanDate,
		&d.Portions, &d.TargetPortions, &d.TempC, &d.TempStatus,
		&d.QRToken, &d.QRStatus, &d.CryptoHash, &d.MenuName,
		&d.AIVerdict, &d.AIScore, &d.ImageURL, &d.Status,
		&d.OverrideBy, &d.OverrideReason, &d.OverriddenAt,
		&d.LabTarget, &d.LabNotes, &d.LabOrderedAt,
		&d.CreatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *pgDeliveryRepository) List(ctx context.Context) ([]models.Delivery, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT `+deliveryColumns+`
		FROM deliveries d
		LEFT JOIN schools s ON d.school_npsn = s.npsn
		LEFT JOIN sppg_kitchens k ON d.sppg_id = k.id
		ORDER BY d.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query deliveries: %w", err)
	}
	defer rows.Close()

	var list []models.Delivery
	for rows.Next() {
		item, err := scanDelivery(rows)
		if err != nil {
			return nil, fmt.Errorf("scan delivery: %w", err)
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *pgDeliveryRepository) Get(ctx context.Context, id string) (*models.Delivery, error) {
	row := database.Pool().QueryRow(ctx, `
		SELECT `+deliveryColumns+`
		FROM deliveries d
		LEFT JOIN schools s ON d.school_npsn = s.npsn
		LEFT JOIN sppg_kitchens k ON d.sppg_id = k.id
		WHERE d.id = $1`, id)
	return scanDelivery(row)
}

func (r *pgDeliveryRepository) OverrideAI(ctx context.Context, id, auditorName, reason, actorID string) (*models.Delivery, error) {
	m := mutation{
		actorID: actorID,
		action:  AuditDeliveryOverride,
		target:  id,
		detail:  auditDetail("auditor", auditorName, reason),
		args:    []any{id, auditorName, reason},
		statement: `
			UPDATE deliveries
			SET ai_verdict = 'overridden',
			    status = 'Disahkan Manual (Superadmin)',
			    override_by = $7,
			    override_reason = $8,
			    overridden_at = NOW()
			WHERE id = $6
			RETURNING id`,
	}
	got, err := runAudited(ctx, auditTemplate, m, func(ctx context.Context, id string) (any, error) {
		return r.Get(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return got.(*models.Delivery), nil
}

func (r *pgDeliveryRepository) OrderLabTest(ctx context.Context, id, labTarget, dinkesOffice, notes, actorID string) (*models.Delivery, error) {
	combinedNotes := notes
	if dinkesOffice != "" {
		combinedNotes = fmt.Sprintf("[%s] %s", dinkesOffice, notes)
	}
	m := mutation{
		actorID: actorID,
		action:  AuditDeliveryLabTest,
		target:  id,
		detail:  auditDetail("target", labTarget, combinedNotes),
		args:    []any{id, labTarget, combinedNotes},
		statement: `
			UPDATE deliveries
			SET status = 'Uji Petik Laboratorium Dinkes',
			    lab_target = $7,
			    lab_notes = $8,
			    lab_ordered_at = NOW()
			WHERE id = $6
			RETURNING id`,
	}
	got, err := runAudited(ctx, auditTemplate, m, func(ctx context.Context, id string) (any, error) {
		return r.Get(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return got.(*models.Delivery), nil
}
