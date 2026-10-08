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
)

// SppgIncidentRepository mendefinisikan kontrak akses data untuk penanganan aduan, SLA, dan karantina batch SPPG.
type SppgIncidentRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgIncidentBundle, error)
	ListTickets(ctx context.Context, sppgID string) ([]models.SppgIncidentTicket, error)
	GetTicket(ctx context.Context, id, sppgID string) (*models.SppgIncidentTicket, error)
	CreateTicket(ctx context.Context, sppgID string, payload *models.CreateIncidentTicketPayload) (*models.SppgIncidentTicket, error)
	ReplyTicket(ctx context.Context, id, sppgID, actorName, replyText string) (*models.SppgIncidentTicket, error)
	ReplacePortions(ctx context.Context, id, sppgID, actorName string, boxes int) (*models.SppgIncidentTicket, int, error)
	RecallBatch(ctx context.Context, sppgID, batchToken, reason, actorName string) (*models.SppgIncidentRecall, []string, error)
	CloseTicket(ctx context.Context, id, sppgID, actorName, resolution string) (*models.SppgIncidentTicket, error)
	ListRecalledTokens(ctx context.Context, sppgID string) ([]string, error)
}

type pgSppgIncidentRepository struct{}

// NewSppgIncidentRepository membuat instance repositori insiden baru.
func NewSppgIncidentRepository() SppgIncidentRepository {
	return &pgSppgIncidentRepository{}
}

const incidentTicketColumns = `
	id, sppg_id, school_id, school_name, batch_token,
	level, category, message, created_at_clock, status,
	responses, resolution, created_at, updated_at
`

func (r *pgSppgIncidentRepository) ListTickets(ctx context.Context, sppgID string) ([]models.SppgIncidentTicket, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_incident_tickets
		WHERE sppg_id = $1
		ORDER BY 
			CASE WHEN status = 'selesai' THEN 2 ELSE 1 END,
			level ASC,
			created_at DESC
	`, incidentTicketColumns)

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list tickets failed: %w", err)
	}
	defer rows.Close()

	var list []models.SppgIncidentTicket
	for rows.Next() {
		var t models.SppgIncidentTicket
		var respBytes []byte
		err := rows.Scan(
			&t.ID, &t.SppgID, &t.SchoolID, &t.SchoolName, &t.BatchToken,
			&t.Level, &t.Category, &t.Message, &t.CreatedAtClock, &t.Status,
			&respBytes, &t.Resolution, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan ticket failed: %w", err)
		}
		if len(respBytes) > 0 {
			_ = json.Unmarshal(respBytes, &t.Responses)
		}
		if t.Responses == nil {
			t.Responses = []models.SppgIncidentResponse{}
		}
		list = append(list, t)
	}
	if list == nil {
		list = []models.SppgIncidentTicket{}
	}
	return list, nil
}

func (r *pgSppgIncidentRepository) GetTicket(ctx context.Context, id, sppgID string) (*models.SppgIncidentTicket, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_incident_tickets
		WHERE sppg_id = $1 AND (id = $2 OR batch_token = $2)
		LIMIT 1
	`, incidentTicketColumns)

	var t models.SppgIncidentTicket
	var respBytes []byte
	err := database.Pool().QueryRow(ctx, query, sppgID, id).Scan(
		&t.ID, &t.SppgID, &t.SchoolID, &t.SchoolName, &t.BatchToken,
		&t.Level, &t.Category, &t.Message, &t.CreatedAtClock, &t.Status,
		&respBytes, &t.Resolution, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, errors.New("tiket aduan insiden tidak ditemukan")
	}
	if len(respBytes) > 0 {
		_ = json.Unmarshal(respBytes, &t.Responses)
	}
	if t.Responses == nil {
		t.Responses = []models.SppgIncidentResponse{}
	}
	return &t, nil
}

func (r *pgSppgIncidentRepository) CreateTicket(ctx context.Context, sppgID string, payload *models.CreateIncidentTicketPayload) (*models.SppgIncidentTicket, error) {
	clock := payload.CreatedAtClock
	if clock == "" {
		clock = time.Now().Format("15:04")
	}
	ticketID := "tkt-" + uuid.NewString()[:8]

	query := `
		INSERT INTO sppg_incident_tickets (
			id, sppg_id, school_id, school_name, batch_token,
			level, category, message, created_at_clock, status,
			responses, resolution, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, 'baru',
			'[]'::jsonb, '', NOW(), NOW()
		)
	`
	_, err := database.Pool().Exec(ctx, query,
		ticketID, sppgID, payload.SchoolID, payload.SchoolName, payload.BatchToken,
		payload.Level, payload.Category, payload.Message, clock,
	)
	if err != nil {
		return nil, fmt.Errorf("create ticket failed: %w", err)
	}

	return r.GetTicket(ctx, ticketID, sppgID)
}

func (r *pgSppgIncidentRepository) ReplyTicket(ctx context.Context, id, sppgID, actorName, replyText string) (*models.SppgIncidentTicket, error) {
	t, err := r.GetTicket(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	if t.Status == "selesai" {
		return nil, errors.New("tiket sudah berstatus selesai, tidak dapat ditambah tanggapan")
	}

	nowClock := time.Now().Format("15:04")
	newResponses := append(t.Responses, models.SppgIncidentResponse{
		At:   nowClock,
		By:   actorName,
		Text: strings.TrimSpace(replyText),
	})
	respJSON, _ := json.Marshal(newResponses)

	query := `
		UPDATE sppg_incident_tickets
		SET status = 'ditangani', responses = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`
	_, err = database.Pool().Exec(ctx, query, respJSON, t.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("reply ticket failed: %w", err)
	}

	return r.GetTicket(ctx, t.ID, sppgID)
}

func (r *pgSppgIncidentRepository) ReplacePortions(ctx context.Context, id, sppgID, actorName string, boxes int) (*models.SppgIncidentTicket, int, error) {
	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, 0, err
	}
	defer tx.Rollback(ctx)

	// 1. Ambil tiket untuk update
	var t models.SppgIncidentTicket
	var respBytes []byte
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_incident_tickets
		WHERE sppg_id = $1 AND id = $2
		FOR UPDATE
	`, incidentTicketColumns)
	err = tx.QueryRow(ctx, query, sppgID, id).Scan(
		&t.ID, &t.SppgID, &t.SchoolID, &t.SchoolName, &t.BatchToken,
		&t.Level, &t.Category, &t.Message, &t.CreatedAtClock, &t.Status,
		&respBytes, &t.Resolution, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, 0, errors.New("tiket aduan insiden tidak ditemukan")
	}
	if len(respBytes) > 0 {
		_ = json.Unmarshal(respBytes, &t.Responses)
	}

	// 2. Cek ketersediaan stok cadangan dapur
	var safetyStock int
	err = tx.QueryRow(ctx, `
		SELECT safety_stock FROM sppg_handover_settings WHERE sppg_id = $1 FOR UPDATE
	`, sppgID).Scan(&safetyStock)
	if err != nil {
		safetyStock = 40
		_, _ = tx.Exec(ctx, `
			INSERT INTO sppg_handover_settings (sppg_id, safety_stock) VALUES ($1, $2)
			ON CONFLICT (sppg_id) DO NOTHING
		`, sppgID, safetyStock)
	}

	if boxes > safetyStock {
		return nil, safetyStock, fmt.Errorf("stok boks cadangan dapur tidak mencukupi (sisa: %d boks, butuh: %d boks)", safetyStock, boxes)
	}

	// 3. Potong stok cadangan
	newSafetyStock := safetyStock - boxes
	_, err = tx.Exec(ctx, `
		UPDATE sppg_handover_settings SET safety_stock = $1, updated_at = NOW() WHERE sppg_id = $2
	`, newSafetyStock, sppgID)
	if err != nil {
		return nil, 0, fmt.Errorf("update stok cadangan gagal: %w", err)
	}

	// 4. Tambah respons tiket
	nowClock := time.Now().Format("15:04")
	t.Responses = append(t.Responses, models.SppgIncidentResponse{
		At:   nowClock,
		By:   actorName,
		Text: fmt.Sprintf("%d porsi pengganti kilat dikirim dari stok cadangan dapur.", boxes),
	})
	respJSON, _ := json.Marshal(t.Responses)

	_, err = tx.Exec(ctx, `
		UPDATE sppg_incident_tickets
		SET status = 'ditangani', responses = $1, updated_at = NOW()
		WHERE id = $2 AND sppg_id = $3
	`, respJSON, t.ID, sppgID)
	if err != nil {
		return nil, 0, fmt.Errorf("update status tiket gagal: %w", err)
	}

	// 5. Catat jejak audit
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":      "incident.replace_portions",
		"ticketId":    t.ID,
		"schoolName":  t.SchoolName,
		"batchToken":  t.BatchToken,
		"boxes":       boxes,
		"remainStock": newSafetyStock,
		"dispatchedBy": actorName,
	})
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'incident.replace_portions', $3, $4, NOW())
	`, auditID, sppgID, t.SchoolName, string(detailJSON))

	if err := tx.Commit(ctx); err != nil {
		return nil, 0, err
	}

	updated, err := r.GetTicket(ctx, t.ID, sppgID)
	return updated, newSafetyStock, err
}

func (r *pgSppgIncidentRepository) RecallBatch(ctx context.Context, sppgID, batchToken, reason, actorName string) (*models.SppgIncidentRecall, []string, error) {
	batchToken = strings.TrimSpace(batchToken)
	if batchToken == "" {
		return nil, nil, errors.New("nomor batch token wajib diisi untuk karantina darurat")
	}

	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Simpan atau pastikan record karantina
	recallID := "rcl-" + uuid.NewString()[:12]
	now := time.Now()
	nowClock := now.Format("15:04")

	_, err = tx.Exec(ctx, `
		INSERT INTO sppg_incident_recalls (id, sppg_id, batch_token, reason, recalled_by, recalled_at, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'active')
	`, recallID, sppgID, batchToken, reason, actorName, now)
	if err != nil {
		return nil, nil, fmt.Errorf("insert recall failed: %w", err)
	}

	// 2. Karantina batch di tabel sppg_batches jika ada
	_, _ = tx.Exec(ctx, `
		UPDATE sppg_batches
		SET status = 'quarantined',
		    quarantine_reason = $1,
		    quarantined_by = $2,
		    quarantined_at = NOW()
		WHERE token = $3 AND sppg_id = $4
	`, reason, actorName, batchToken, sppgID)

	// 3. Update pesan respons otomatis di seluruh tiket yang membawa batch ini
	var ticketRows []struct {
		ID        string
		Responses []models.SppgIncidentResponse
	}
	rows, err := tx.Query(ctx, `
		SELECT id, responses
		FROM sppg_incident_tickets
		WHERE sppg_id = $1 AND batch_token = $2 AND status != 'selesai'
	`, sppgID, batchToken)
	if err == nil {
		for rows.Next() {
			var row struct {
				ID        string
				Responses []models.SppgIncidentResponse
			}
			var b []byte
			if scanErr := rows.Scan(&row.ID, &b); scanErr == nil {
				if len(b) > 0 {
					_ = json.Unmarshal(b, &row.Responses)
				}
				ticketRows = append(ticketRows, row)
			}
		}
		rows.Close()

		recallMsg := fmt.Sprintf("Batch %s dikarantina. Seluruh sekolah penerima dilarang membagikan.", batchToken)
		for _, tr := range ticketRows {
			tr.Responses = append(tr.Responses, models.SppgIncidentResponse{
				At:   nowClock,
				By:   actorName,
				Text: recallMsg,
			})
			newBytes, _ := json.Marshal(tr.Responses)
			_, _ = tx.Exec(ctx, `
				UPDATE sppg_incident_tickets
				SET status = 'ditangani', responses = $1, updated_at = NOW()
				WHERE id = $2
			`, newBytes, tr.ID)
		}
	}

	// 4. Catat jejak audit Satgas
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":      "incident.batch_recall",
		"batchToken":  batchToken,
		"reason":      reason,
		"recalledBy":  actorName,
		"recalledAt":  now,
	})
	_, _ = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'incident.batch_recall', $3, $4, NOW())
	`, auditID, sppgID, batchToken, string(detailJSON))

	if err := tx.Commit(ctx); err != nil {
		return nil, nil, err
	}

	// Ambil seluruh daftar token yang sedang aktif dikarantina
	activeTokens, _ := r.ListRecalledTokens(ctx, sppgID)

	recallObj := &models.SppgIncidentRecall{
		ID:         recallID,
		SppgID:     sppgID,
		BatchToken: batchToken,
		Reason:     reason,
		RecalledBy: actorName,
		RecalledAt: now,
		Status:     "active",
	}

	return recallObj, activeTokens, nil
}

func (r *pgSppgIncidentRepository) CloseTicket(ctx context.Context, id, sppgID, actorName, resolution string) (*models.SppgIncidentTicket, error) {
	t, err := r.GetTicket(ctx, id, sppgID)
	if err != nil {
		return nil, err
	}

	resolution = strings.TrimSpace(resolution)
	if resolution == "" {
		return nil, errors.New("bukti dan catatan penyelesaian bersama Satgas wajib diisi")
	}

	nowClock := time.Now().Format("15:04")
	t.Responses = append(t.Responses, models.SppgIncidentResponse{
		At:   nowClock,
		By:   actorName,
		Text: "Tiket diselesaikan dan ditutup bersama Satgas: " + resolution,
	})
	respJSON, _ := json.Marshal(t.Responses)

	query := `
		UPDATE sppg_incident_tickets
		SET status = 'selesai', resolution = $1, responses = $2, updated_at = NOW()
		WHERE id = $3 AND sppg_id = $4
	`
	_, err = database.Pool().Exec(ctx, query, resolution, respJSON, t.ID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("close ticket failed: %w", err)
	}

	// Jejak audit
	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"action":     "incident.close_ticket",
		"ticketId":   t.ID,
		"schoolName": t.SchoolName,
		"batchToken": t.BatchToken,
		"resolution": resolution,
		"closedBy":   actorName,
	})
	_, _ = database.Pool().Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'incident.close_ticket', $3, $4, NOW())
	`, auditID, sppgID, t.SchoolName, string(detailJSON))

	return r.GetTicket(ctx, t.ID, sppgID)
}

func (r *pgSppgIncidentRepository) ListRecalledTokens(ctx context.Context, sppgID string) ([]string, error) {
	rows, err := database.Pool().Query(ctx, `
		SELECT DISTINCT batch_token
		FROM sppg_incident_recalls
		WHERE sppg_id = $1 AND status = 'active'
		ORDER BY batch_token ASC
	`, sppgID)
	if err != nil {
		return []string{}, err
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var tok string
		if err := rows.Scan(&tok); err == nil {
			tokens = append(tokens, tok)
		}
	}
	if tokens == nil {
		tokens = []string{}
	}
	return tokens, nil
}

func (r *pgSppgIncidentRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgIncidentBundle, error) {
	// 1. Info Dapur SPPG
	var kitchenCode, kitchenName string
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name FROM sppg_kitchens WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
	}

	// 2. Stok Cadangan Dapur
	safetyStock := 40
	_ = database.Pool().QueryRow(ctx, `
		SELECT safety_stock FROM sppg_handover_settings WHERE sppg_id = $1
	`, sppgID).Scan(&safetyStock)

	// 3. Daftar Tiket
	tickets, err := r.ListTickets(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 4. Batch Terkarantina
	recalledTokens, err := r.ListRecalledTokens(ctx, sppgID)
	if err != nil {
		recalledTokens = []string{}
	}

	// 5. Hitung SLA Totals
	now := time.Now()
	currentMinutes := now.Hour()*60 + now.Minute()

	openCount := 0
	breachedCount := 0
	criticalCount := 0

	for _, t := range tickets {
		if t.Status != "selesai" {
			openCount++
			if t.Level == 1 {
				criticalCount++
			}
			// SLA Breached jika elapsed > 60 menit
			createdMin := parseClockMinutes(t.CreatedAtClock)
			if (currentMinutes - createdMin) > 60 {
				breachedCount++
			}
		}
	}

	totals := models.SppgIncidentTotals{
		Open:     openCount,
		Breached: breachedCount,
		Critical: criticalCount,
		Recalled: len(recalledTokens),
	}

	return &models.SppgIncidentBundle{
		SppgID:         sppgID,
		KitchenName:    kitchenName,
		KitchenCode:    kitchenCode,
		SafetyStock:    safetyStock,
		SlaMinutes:     60,
		Totals:         totals,
		RecalledTokens: recalledTokens,
		Tickets:        tickets,
	}, nil
}

func parseClockMinutes(clock string) int {
	parts := strings.Split(clock, ":")
	if len(parts) != 2 {
		return 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h*60 + m
}
