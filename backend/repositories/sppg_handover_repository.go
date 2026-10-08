package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type SppgHandoverRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgHandoverBundle, error)
	ListHandovers(ctx context.Context, sppgID string) ([]models.SppgHandover, error)
	GetHandover(ctx context.Context, id, sppgID string) (*models.SppgHandover, error)
	AdvanceStage(ctx context.Context, id, sppgID string, payload *models.AdvanceStagePayload) (*models.SppgHandover, error)
	FinishScan(ctx context.Context, id, sppgID string, perfect bool) (*models.SppgHandover, error)
	RejectBoxes(ctx context.Context, id, sppgID string, payload *models.RejectBoxesPayload) (*models.SppgHandover, error)
	ReplaceRejected(ctx context.Context, id, sppgID string, rejectIndex int, actorName string) (*models.SppgHandover, int, error)
	SignBast(ctx context.Context, id, sppgID, courier, teacher, actorName string) (*models.SppgHandover, error)
}

type pgSppgHandoverRepository struct{}

func NewSppgHandoverRepository() SppgHandoverRepository {
	return &pgSppgHandoverRepository{}
}

const handoverColumns = `
	id, sppg_id, school_id, school_npsn, school_name, batch_token,
	sent, scanned, stage, rejected, courier_sign, teacher_sign,
	bast_no, bast_at, bast_hash, date, created_at, updated_at
`

func (r *pgSppgHandoverRepository) ListHandovers(ctx context.Context, sppgID string) ([]models.SppgHandover, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_handovers
		WHERE sppg_id = $1
		ORDER BY id ASC
	`, handoverColumns)

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list handovers failed: %w", err)
	}
	defer rows.Close()

	var list []models.SppgHandover
	for rows.Next() {
		var h models.SppgHandover
		var rejBytes []byte
		var d time.Time
		err := rows.Scan(
			&h.ID, &h.SppgID, &h.SchoolID, &h.SchoolNpsn, &h.SchoolName, &h.BatchToken,
			&h.Sent, &h.Scanned, &h.Stage, &rejBytes, &h.CourierSign, &h.TeacherSign,
			&h.BastNo, &h.BastAt, &h.BastHash, &d, &h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan handover failed: %w", err)
		}
		h.Date = d.Format("2006-01-02")
		if len(rejBytes) > 0 {
			_ = json.Unmarshal(rejBytes, &h.Rejected)
		}
		if h.Rejected == nil {
			h.Rejected = []models.RejectedBoxItem{}
		}
		h.Accepted = calculateAccepted(h.Scanned, h.Rejected)
		list = append(list, h)
	}
	if list == nil {
		list = []models.SppgHandover{}
	}
	return list, nil
}

func (r *pgSppgHandoverRepository) GetHandover(ctx context.Context, id, sppgID string) (*models.SppgHandover, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_handovers
		WHERE sppg_id = $1 AND (id = $2 OR school_id = $2 OR batch_token = $2)
		LIMIT 1
	`, handoverColumns)

	var h models.SppgHandover
	var rejBytes []byte
	var d time.Time
	err := database.Pool().QueryRow(ctx, query, sppgID, id).Scan(
		&h.ID, &h.SppgID, &h.SchoolID, &h.SchoolNpsn, &h.SchoolName, &h.BatchToken,
		&h.Sent, &h.Scanned, &h.Stage, &rejBytes, &h.CourierSign, &h.TeacherSign,
		&h.BastNo, &h.BastAt, &h.BastHash, &d, &h.CreatedAt, &h.UpdatedAt,
	)
	if err != nil {
		return nil, errors.New("sesi serah terima tidak ditemukan")
	}
	h.Date = d.Format("2006-01-02")
	if len(rejBytes) > 0 {
		_ = json.Unmarshal(rejBytes, &h.Rejected)
	}
	if h.Rejected == nil {
		h.Rejected = []models.RejectedBoxItem{}
	}
	h.Accepted = calculateAccepted(h.Scanned, h.Rejected)
	return &h, nil
}

func (r *pgSppgHandoverRepository) AdvanceStage(ctx context.Context, id, sppgID string, payload *models.AdvanceStagePayload) (*models.SppgHandover, error) {
	h, err := r.GetHandover(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	nextStage := h.Stage
	if payload != nil && payload.Stage != "" {
		nextStage = payload.Stage
	} else {
		// Alur standar: menunggu -> tiba -> memindai
		switch h.Stage {
		case "menunggu":
			nextStage = "tiba"
		case "tiba":
			nextStage = "memindai"
		}
	}

	scanned := h.Scanned
	if nextStage == "memindai" && scanned == 0 {
		scanned = min(h.Sent, 100)
	}
	if payload != nil && payload.Scanned > 0 {
		scanned = min(h.Sent, payload.Scanned)
	}

	query := `
		UPDATE sppg_handovers
		SET stage = $1, scanned = $2, updated_at = NOW()
		WHERE id = $3 AND sppg_id = $4
	`
	_, err = database.Pool().Exec(ctx, query, nextStage, scanned, h.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("advance stage failed: %w", err)
	}

	return r.GetHandover(ctx, h.ID, sppgID)
}

func (r *pgSppgHandoverRepository) FinishScan(ctx context.Context, id, sppgID string, perfect bool) (*models.SppgHandover, error) {
	h, err := r.GetHandover(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	stage := h.Stage
	if perfect && len(h.Rejected) == 0 {
		stage = "lolos"
	} else if len(h.Rejected) > 0 {
		stage = "hold"
	}

	query := `
		UPDATE sppg_handovers
		SET stage = $1, scanned = sent, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`
	_, err = database.Pool().Exec(ctx, query, stage, h.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("finish scan failed: %w", err)
	}

	return r.GetHandover(ctx, h.ID, sppgID)
}

func (r *pgSppgHandoverRepository) RejectBoxes(ctx context.Context, id, sppgID string, payload *models.RejectBoxesPayload) (*models.SppgHandover, error) {
	h, err := r.GetHandover(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	rejected := append(h.Rejected, models.RejectedBoxItem{
		Boxes:        payload.Boxes,
		Reason:       payload.Reason,
		EvidenceName: payload.EvidenceName,
		EvidenceURL:  payload.EvidenceURL,
	})
	rejJSON, _ := json.Marshal(rejected)

	query := `
		UPDATE sppg_handovers
		SET stage = 'hold', rejected = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`
	_, err = database.Pool().Exec(ctx, query, rejJSON, h.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("reject boxes failed: %w", err)
	}

	return r.GetHandover(ctx, h.ID, sppgID)
}

func (r *pgSppgHandoverRepository) ReplaceRejected(ctx context.Context, id, sppgID string, rejectIndex int, actorName string) (*models.SppgHandover, int, error) {
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, 0, err
	}
	defer tx.Rollback(ctx)

	// 1. Ambil sesi serah terima
	var h models.SppgHandover
	var rejBytes []byte
	var d time.Time
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_handovers
		WHERE sppg_id = $1 AND id = $2
		FOR UPDATE
	`, handoverColumns)
	err = tx.QueryRow(ctx, query, sppgID, id).Scan(
		&h.ID, &h.SppgID, &h.SchoolID, &h.SchoolNpsn, &h.SchoolName, &h.BatchToken,
		&h.Sent, &h.Scanned, &h.Stage, &rejBytes, &h.CourierSign, &h.TeacherSign,
		&h.BastNo, &h.BastAt, &h.BastHash, &d, &h.CreatedAt, &h.UpdatedAt,
	)
	if err != nil {
		return nil, 0, errors.New("sesi serah terima tidak ditemukan")
	}
	_ = json.Unmarshal(rejBytes, &h.Rejected)

	if rejectIndex < 0 || rejectIndex >= len(h.Rejected) {
		return nil, 0, errors.New("indeks data penolakan tidak valid")
	}

	targetItem := h.Rejected[rejectIndex]

	// 2. Cek ketersediaan Safety Stock dapur
	var safetyStock int
	err = tx.QueryRow(ctx, `
		SELECT safety_stock FROM sppg_handover_settings WHERE sppg_id = $1 FOR UPDATE
	`, sppgID).Scan(&safetyStock)
	if err != nil {
		safetyStock = 40 // fallback default
		_, _ = tx.Exec(ctx, `
			INSERT INTO sppg_handover_settings (sppg_id, safety_stock) VALUES ($1, $2)
			ON CONFLICT (sppg_id) DO NOTHING
		`, sppgID, safetyStock)
	}

	if targetItem.Boxes > safetyStock {
		return nil, safetyStock, fmt.Errorf("stok boks cadangan dapur tidak mencukupi (sisa: %d boks, butuh: %d boks)", safetyStock, targetItem.Boxes)
	}

	// 3. Potong Safety Stock dan tambah porsi terkirim/terpindai
	newSafetyStock := safetyStock - targetItem.Boxes
	_, err = tx.Exec(ctx, `
		UPDATE sppg_handover_settings SET safety_stock = $1, updated_at = NOW() WHERE sppg_id = $2
	`, newSafetyStock, sppgID)
	if err != nil {
		return nil, 0, fmt.Errorf("potong stok cadangan gagal: %w", err)
	}

	// Buang item dari array rejected
	newRejected := append(h.Rejected[:rejectIndex], h.Rejected[rejectIndex+1:]...)
	newRejJSON, _ := json.Marshal(newRejected)

	newSent := h.Sent + targetItem.Boxes
	newScanned := h.Scanned + targetItem.Boxes
	newStage := h.Stage
	if len(newRejected) == 0 {
		newStage = "lolos"
	}

	_, err = tx.Exec(ctx, `
		UPDATE sppg_handovers
		SET sent = $1, scanned = $2, stage = $3, rejected = $4, updated_at = NOW()
		WHERE id = $5 AND sppg_id = $6
	`, newSent, newScanned, newStage, newRejJSON, h.ID, sppgID)
	if err != nil {
		return nil, 0, fmt.Errorf("update serah terima pengganti gagal: %w", err)
	}

	// 4. Catat jejak audit penggantian porsi
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":      "handover.replace_rejected",
		"schoolName":  h.SchoolName,
		"batchToken":  h.BatchToken,
		"boxes":       targetItem.Boxes,
		"reason":      targetItem.Reason,
		"remainStock": newSafetyStock,
		"replacedBy":  actorName,
	})
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'handover.replace_rejected', $3, $4, NOW())
	`, auditID, sppgID, h.SchoolName, string(detailJSON))

	if err := tx.Commit(ctx); err != nil {
		return nil, 0, err
	}

	updated, err := r.GetHandover(ctx, h.ID, sppgID)
	return updated, newSafetyStock, err
}

func (r *pgSppgHandoverRepository) SignBast(ctx context.Context, id, sppgID, courier, teacher, actorName string) (*models.SppgHandover, error) {
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Ambil data serah terima
	h, err := r.GetHandover(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	if h.Stage != "lolos" {
		return nil, errors.New("BAST hanya dapat diterbitkan setelah serah terima berstatus 'lolos' sempurna")
	}
	if h.BastNo != "" {
		return nil, fmt.Errorf("BAST telah diterbitkan sebelumnya dengan nomor %s", h.BastNo)
	}

	// 2. Ambil sequence nomor BAST per dapur
	var bastSeq int
	err = tx.QueryRow(ctx, `
		SELECT bast_seq FROM sppg_handover_settings WHERE sppg_id = $1 FOR UPDATE
	`, sppgID).Scan(&bastSeq)
	if err != nil {
		bastSeq = 1
		_, _ = tx.Exec(ctx, `
			INSERT INTO sppg_handover_settings (sppg_id, bast_seq) VALUES ($1, 2)
			ON CONFLICT (sppg_id) DO UPDATE SET bast_seq = sppg_handover_settings.bast_seq + 1
		`, sppgID)
	} else {
		_, _ = tx.Exec(ctx, `
			UPDATE sppg_handover_settings SET bast_seq = bast_seq + 1, updated_at = NOW() WHERE sppg_id = $1
		`, sppgID)
	}

	bastNo := fmt.Sprintf("BAST/MBG/2026/%04d", bastSeq)
	bastAt := time.Now().Format("15:04")
	accepted := h.Accepted

	// 3. Stempel Kriptografis SHA-256
	hashRaw := fmt.Sprintf("%s#%s#%d#%s", bastNo, h.BatchToken, accepted, bastAt)
	hashSum := sha256.Sum256([]byte(hashRaw))
	bastHash := hex.EncodeToString(hashSum[:])

	// 4. Update status serah terima
	_, err = tx.Exec(ctx, `
		UPDATE sppg_handovers
		SET courier_sign = $1,
		    teacher_sign = $2,
		    bast_no = $3,
		    bast_at = $4,
		    bast_hash = $5,
		    updated_at = NOW()
		WHERE id = $6 AND sppg_id = $7
	`, courier, teacher, bastNo, bastAt, bastHash, h.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("tandatangani BAST gagal: %w", err)
	}

	// 5. Tulis jejak audit legal BAST
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":      "handover.sign_bast",
		"bastNo":      bastNo,
		"schoolName":  h.SchoolName,
		"batchToken":  h.BatchToken,
		"accepted":    accepted,
		"courierSign": courier,
		"teacherSign": teacher,
		"bastHash":    bastHash,
		"signedBy":    actorName,
	})
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'handover.sign_bast', $3, $4, NOW())
	`, auditID, sppgID, bastNo, string(detailJSON))

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetHandover(ctx, h.ID, sppgID)
}

func (r *pgSppgHandoverRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgHandoverBundle, error) {
	// 1. Info Dapur SPPG
	var kitchenCode, kitchenName string
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name FROM sppg_kitchens WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
	}

	// 2. Safety stock
	safetyStock := 40
	_ = database.Pool().QueryRow(ctx, `
		SELECT safety_stock FROM sppg_handover_settings WHERE sppg_id = $1
	`, sppgID).Scan(&safetyStock)

	// 3. Daftar Handovers
	handovers, err := r.ListHandovers(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 4. Hitung Totals
	totalSent := 0
	totalAccepted := 0
	totalIssued := 0

	for _, h := range handovers {
		totalSent += h.Sent
		totalAccepted += h.Accepted
		if h.BastNo != "" {
			totalIssued++
		}
	}

	totals := models.SppgHandoverTotals{
		Sent:     totalSent,
		Accepted: totalAccepted,
		Issued:   totalIssued,
		Count:    len(handovers),
	}

	return &models.SppgHandoverBundle{
		SppgID:      sppgID,
		KitchenName: kitchenName,
		KitchenCode: kitchenCode,
		SafetyStock: safetyStock,
		Totals:      totals,
		Handovers:   handovers,
	}, nil
}

// Helper
func calculateAccepted(scanned int, rejected []models.RejectedBoxItem) int {
	rejTotal := 0
	for _, r := range rejected {
		rejTotal += r.Boxes
	}
	acc := scanned - rejTotal
	if acc < 0 {
		return 0
	}
	return acc
}
