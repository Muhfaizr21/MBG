package repositories

import (
	"backend/database"
	"backend/models"
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

// SppgComplianceRepository antarmuka abstraksi data sertifikasi, penjamah, uji lab, dan audit sanitasi.
type SppgComplianceRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgComplianceBundle, error)
	ListDocs(ctx context.Context, sppgID string) ([]models.SppgComplianceDoc, error)
	RenewDoc(ctx context.Context, sppgID string, docID string, expiry string, fileName string) (*models.SppgComplianceDoc, error)
	ListHandlers(ctx context.Context, sppgID string) ([]models.SppgComplianceHandler, error)
	CreateHandler(ctx context.Context, sppgID string, payload *models.CreateComplianceHandlerPayload) (*models.SppgComplianceHandler, error)
	ListLabs(ctx context.Context, sppgID string) ([]models.SppgComplianceLab, error)
	CreateLab(ctx context.Context, sppgID string, payload *models.CreateComplianceLabPayload) (*models.SppgComplianceLab, error)
	ListAudits(ctx context.Context, sppgID string) ([]models.SppgComplianceAudit, error)
	RequestAudit(ctx context.Context, sppgID string, payload *models.RequestComplianceAuditPayload) (*models.SppgComplianceAudit, error)
}

type pgSppgComplianceRepository struct{}

// NewSppgComplianceRepository membuat instance repository compliance PostgreSQL baru.
func NewSppgComplianceRepository() SppgComplianceRepository {
	return &pgSppgComplianceRepository{}
}

const complianceSessionDateStr = "2026-09-29"

func getSessionDate() time.Time {
	t, _ := time.Parse("2006-01-02", complianceSessionDateStr)
	return t
}

func calculateDocStatus(expiry time.Time) (daysLeft int, label string, tone string, isOk bool) {
	session := getSessionDate()
	days := int(math.Round(expiry.Sub(session).Hours() / 24))
	if days < 0 {
		return days, fmt.Sprintf("Kedaluwarsa %d hari", -days), "bg-rose-50 text-rose-800", false
	}
	if days <= 60 {
		return days, fmt.Sprintf("Sisa %d hari", days), "bg-amber-50 text-amber-900", true
	}
	return days, fmt.Sprintf("Berlaku, sisa %d hari", days), "bg-emerald-50 text-emerald-800", true
}

func calculateHandlerStatus(healthExpiry time.Time, trained bool) (daysLeft int, label string, tone string, isHealthOk bool, isFullyQualified bool) {
	session := getSessionDate()
	days := int(math.Round(healthExpiry.Sub(session).Hours() / 24))
	isHealthOk = days >= 0
	isFullyQualified = isHealthOk && trained

	if isFullyQualified {
		return days, "Lengkap", "bg-emerald-50 text-emerald-800", isHealthOk, isFullyQualified
	}
	if isHealthOk && !trained {
		return days, "Pelatihan kurang", "bg-rose-50 text-rose-800", isHealthOk, false
	}
	return days, fmt.Sprintf("Kedaluwarsa %d hari", -days), "bg-rose-50 text-rose-800", isHealthOk, false
}

func calculateLabVerdict(kind string, value float64) (label string, pass bool) {
	if value < 0 {
		return "TIDAK VALID", false
	}
	if kind == "fisika" {
		if value <= 5.0 {
			return "LOLOS", true
		}
		return "GAGAL", false
	}
	// Usap alat (swab) & air: mikroorganisme ALT/E. coli harus 0
	if value == 0 {
		return "LOLOS", true
	}
	return "GAGAL", false
}

func (r *pgSppgComplianceRepository) getKitchenInfo(ctx context.Context, sppgID string) (name string, code string) {
	name = "Dapur SPPG " + sppgID
	code = sppgID
	query := `SELECT name, code FROM sppg_kitchens WHERE id = $1`
	_ = database.Pool().QueryRow(ctx, query, sppgID).Scan(&name, &code)
	return name, code
}

// ListDocs mengambil seluruh dokumen sertifikasi akreditasi dapur
func (r *pgSppgComplianceRepository) ListDocs(ctx context.Context, sppgID string) ([]models.SppgComplianceDoc, error) {
	query := `
		SELECT id, sppg_id, name, issuer, number, expiry, file_name, created_at, updated_at
		FROM sppg_compliance_docs
		WHERE sppg_id = $1
		ORDER BY id ASC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list compliance docs failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgComplianceDoc
	for rows.Next() {
		var doc models.SppgComplianceDoc
		var exp time.Time
		err := rows.Scan(
			&doc.ID, &doc.SppgID, &doc.Name, &doc.Issuer, &doc.Number,
			&exp, &doc.FileName, &doc.CreatedAt, &doc.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan compliance doc failed: %w", err)
		}
		doc.Expiry = exp.Format("2006-01-02")
		doc.DaysLeft, doc.StatusLabel, doc.StatusTone, doc.IsOk = calculateDocStatus(exp)
		result = append(result, doc)
	}
	if result == nil {
		result = []models.SppgComplianceDoc{}
	}
	return result, nil
}

// RenewDoc memperbarui tanggal kedaluwarsa dan berkas sertifikasi baru
func (r *pgSppgComplianceRepository) RenewDoc(ctx context.Context, sppgID string, docID string, expiry string, fileName string) (*models.SppgComplianceDoc, error) {
	parsedDate, err := time.Parse("2006-01-02", expiry)
	if err != nil {
		return nil, fmt.Errorf("format tanggal kedaluwarsa tidak valid (gunakan YYYY-MM-DD): %w", err)
	}

	tx, err := database.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction failed: %w", err)
	}
	defer tx.Rollback(ctx)

	var currentFileName string
	err = tx.QueryRow(ctx, `
		SELECT file_name FROM sppg_compliance_docs WHERE id = $1 AND sppg_id = $2 FOR UPDATE
	`, docID, sppgID).Scan(&currentFileName)
	if err != nil {
		return nil, errors.New("Dokumen sertifikasi tidak ditemukan")
	}

	newFileName := strings.TrimSpace(fileName)
	if newFileName == "" {
		newFileName = currentFileName
	}

	_, err = tx.Exec(ctx, `
		UPDATE sppg_compliance_docs
		SET expiry = $1, file_name = $2, updated_at = NOW()
		WHERE id = $3 AND sppg_id = $4
	`, parsedDate, newFileName, docID, sppgID)
	if err != nil {
		return nil, fmt.Errorf("update compliance doc failed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit renew doc failed: %w", err)
	}

	docs, err := r.ListDocs(ctx, sppgID)
	if err != nil {
		return nil, err
	}
	for _, d := range docs {
		if d.ID == docID {
			return &d, nil
		}
	}
	return nil, errors.New("Dokumen tidak ditemukan setelah diperbarui")
}

// ListHandlers mengambil seluruh daftar staf juru masak & penjamah makanan
func (r *pgSppgComplianceRepository) ListHandlers(ctx context.Context, sppgID string) ([]models.SppgComplianceHandler, error) {
	query := `
		SELECT id, sppg_id, name, role, health_expiry, health_file, trained, created_at, updated_at
		FROM sppg_compliance_handlers
		WHERE sppg_id = $1
		ORDER BY created_at DESC, id ASC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list compliance handlers failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgComplianceHandler
	for rows.Next() {
		var h models.SppgComplianceHandler
		var exp time.Time
		err := rows.Scan(
			&h.ID, &h.SppgID, &h.Name, &h.Role, &exp,
			&h.HealthFile, &h.Trained, &h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan compliance handler failed: %w", err)
		}
		h.HealthExpiry = exp.Format("2006-01-02")
		h.DaysLeft, h.StatusLabel, h.StatusTone, h.IsHealthOk, h.IsFullyQualified = calculateHandlerStatus(exp, h.Trained)
		result = append(result, h)
	}
	if result == nil {
		result = []models.SppgComplianceHandler{}
	}
	return result, nil
}

// CreateHandler mendaftarkan staf penjamah makanan baru ke dapur
func (r *pgSppgComplianceRepository) CreateHandler(ctx context.Context, sppgID string, payload *models.CreateComplianceHandlerPayload) (*models.SppgComplianceHandler, error) {
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		return nil, errors.New("Nama staf penjamah makanan wajib diisi")
	}
	role := strings.TrimSpace(payload.Role)
	if role == "" {
		return nil, errors.New("Peran staf wajib diisi")
	}
	healthExpiryDate, err := time.Parse("2006-01-02", payload.HealthExpiry)
	if err != nil {
		return nil, fmt.Errorf("format tanggal surat sehat tidak valid (gunakan YYYY-MM-DD): %w", err)
	}

	newID := fmt.Sprintf("fh-%d-%s", time.Now().UnixNano(), strings.ToLower(sppgID))
	healthFile := strings.TrimSpace(payload.HealthFile)
	if healthFile == "" {
		healthFile = "menunggu berkas"
	}

	query := `
		INSERT INTO sppg_compliance_handlers (id, sppg_id, name, role, health_expiry, health_file, trained, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
	`
	_, err = database.Pool().Exec(ctx, query, newID, sppgID, name, role, healthExpiryDate, healthFile, payload.Trained)
	if err != nil {
		return nil, fmt.Errorf("insert compliance handler failed: %w", err)
	}

	handlers, err := r.ListHandlers(ctx, sppgID)
	if err != nil {
		return nil, err
	}
	for _, h := range handlers {
		if h.ID == newID {
			return &h, nil
		}
	}
	return nil, errors.New("Staf tidak ditemukan setelah disimpan")
}

// ListLabs mengambil riwayat uji laboratorium mikrobiologi dan kualitas air
func (r *pgSppgComplianceRepository) ListLabs(ctx context.Context, sppgID string) ([]models.SppgComplianceLab, error) {
	query := `
		SELECT id, sppg_id, test_date, kind, target, param, value, unit, created_at
		FROM sppg_compliance_labs
		WHERE sppg_id = $1
		ORDER BY test_date DESC, id DESC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list compliance labs failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgComplianceLab
	for rows.Next() {
		var l models.SppgComplianceLab
		var d time.Time
		err := rows.Scan(
			&l.ID, &l.SppgID, &d, &l.Kind, &l.Target, &l.Param,
			&l.Value, &l.Unit, &l.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan compliance lab failed: %w", err)
		}
		l.TestDate = d.Format("2006-01-02")
		l.Date = l.TestDate
		l.VerdictLabel, l.Pass = calculateLabVerdict(l.Kind, l.Value)
		result = append(result, l)
	}
	if result == nil {
		result = []models.SppgComplianceLab{}
	}
	return result, nil
}

// CreateLab mencatat hasil pengujian laboratorium mikrobiologi / air baru
func (r *pgSppgComplianceRepository) CreateLab(ctx context.Context, sppgID string, payload *models.CreateComplianceLabPayload) (*models.SppgComplianceLab, error) {
	target := strings.TrimSpace(payload.Target)
	if target == "" {
		return nil, errors.New("Titik uji laboratorium wajib diisi")
	}
	param := strings.TrimSpace(payload.Param)
	if param == "" {
		return nil, errors.New("Parameter pengujian wajib diisi")
	}
	kind := strings.TrimSpace(payload.Kind)
	if kind == "" {
		kind = "swab"
	}
	unit := strings.TrimSpace(payload.Unit)
	if unit == "" {
		unit = "-"
	}

	testDate := getSessionDate()
	if strings.TrimSpace(payload.Date) != "" {
		if parsed, err := time.Parse("2006-01-02", payload.Date); err == nil {
			testDate = parsed
		}
	}

	newID := fmt.Sprintf("lab-%d-%s", time.Now().UnixNano(), strings.ToLower(sppgID))
	query := `
		INSERT INTO sppg_compliance_labs (id, sppg_id, test_date, kind, target, param, value, unit, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`
	_, err := database.Pool().Exec(ctx, query, newID, sppgID, testDate, kind, target, param, payload.Value, unit)
	if err != nil {
		return nil, fmt.Errorf("insert compliance lab failed: %w", err)
	}

	labs, err := r.ListLabs(ctx, sppgID)
	if err != nil {
		return nil, err
	}
	for _, l := range labs {
		if l.ID == newID {
			return &l, nil
		}
	}
	return nil, errors.New("Uji lab tidak ditemukan setelah disimpan")
}

// ListAudits mengambil riwayat permohonan audit dan sidak Dinkes
func (r *pgSppgComplianceRepository) ListAudits(ctx context.Context, sppgID string) ([]models.SppgComplianceAudit, error) {
	query := `
		SELECT id, sppg_id, purpose, preferred_date, note, status, filed_at, created_at
		FROM sppg_compliance_audits
		WHERE sppg_id = $1
		ORDER BY created_at DESC, id DESC
	`
	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list compliance audits failed: %w", err)
	}
	defer rows.Close()

	var result []models.SppgComplianceAudit
	for rows.Next() {
		var a models.SppgComplianceAudit
		var pref time.Time
		err := rows.Scan(
			&a.ID, &a.SppgID, &a.Purpose, &pref,
			&a.Note, &a.Status, &a.FiledAt, &a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan compliance audit failed: %w", err)
		}
		a.PreferredDate = pref.Format("2006-01-02")
		result = append(result, a)
	}
	if result == nil {
		result = []models.SppgComplianceAudit{}
	}
	return result, nil
}

// RequestAudit mengajukan permohonan jadwal audit ulang ke Dinkes
func (r *pgSppgComplianceRepository) RequestAudit(ctx context.Context, sppgID string, payload *models.RequestComplianceAuditPayload) (*models.SppgComplianceAudit, error) {
	purpose := strings.TrimSpace(payload.Purpose)
	if purpose == "" {
		return nil, errors.New("Tujuan audit wajib diisi")
	}
	prefDate, err := time.Parse("2006-01-02", payload.PreferredDate)
	if err != nil {
		return nil, fmt.Errorf("format tanggal audit yang diminta tidak valid: %w", err)
	}

	newID := fmt.Sprintf("aud-%d-%s", time.Now().UnixNano(), strings.ToLower(sppgID))
	filedAt := "29 Sept 2026"
	note := strings.TrimSpace(payload.Note)

	query := `
		INSERT INTO sppg_compliance_audits (id, sppg_id, purpose, preferred_date, note, status, filed_at, created_at)
		VALUES ($1, $2, $3, $4, $5, 'Diajukan', $6, NOW())
	`
	_, err = database.Pool().Exec(ctx, query, newID, sppgID, purpose, prefDate, note, filedAt)
	if err != nil {
		return nil, fmt.Errorf("insert compliance audit failed: %w", err)
	}

	audits, err := r.ListAudits(ctx, sppgID)
	if err != nil {
		return nil, err
	}
	for _, a := range audits {
		if a.ID == newID {
			return &a, nil
		}
	}
	return nil, errors.New("Audit tidak ditemukan setelah diajukan")
}

// GetBundle mengambil bundle terpadu legalitas, penjamah makanan, uji lab, dan audit
func (r *pgSppgComplianceRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgComplianceBundle, error) {
	kName, kCode := r.getKitchenInfo(ctx, sppgID)

	docs, err := r.ListDocs(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	handlers, err := r.ListHandlers(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	labs, err := r.ListLabs(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	audits, err := r.ListAudits(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	var totals models.SppgComplianceTotals
	totals.Docs = len(docs)
	for _, d := range docs {
		if !d.IsOk {
			totals.Expired++
		}
	}

	totals.Handlers = len(handlers)
	for _, h := range handlers {
		if h.IsFullyQualified {
			totals.HandlersOk++
		}
	}

	totals.Labs = len(labs)
	for _, l := range labs {
		if l.Pass {
			totals.LabsPass++
		}
	}

	totals.Audits = len(audits)

	return &models.SppgComplianceBundle{
		SppgID:      sppgID,
		KitchenName: kName,
		KitchenCode: kCode,
		SessionDate: complianceSessionDateStr,
		Totals:      totals,
		Docs:        docs,
		Handlers:    handlers,
		Labs:        labs,
		Audits:      audits,
	}, nil
}
