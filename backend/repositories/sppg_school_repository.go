package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"

	"github.com/google/uuid"
)

type SppgSchoolRepository interface {
	GetBundle(ctx context.Context, sppgID string) (*models.SppgSchoolBundle, error)
	ListSchools(ctx context.Context, sppgID string) ([]models.SppgSchoolQuota, error)
	GetSchool(ctx context.Context, idOrSchoolID, sppgID string) (*models.SppgSchoolQuota, error)
	UpdateAttendance(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateAttendancePayload) (*models.SppgSchoolQuota, error)
	UpdateDroppoint(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateDroppointPayload) (*models.SppgSchoolQuota, error)
	CreateReminder(ctx context.Context, sppgID, schoolID, message, actorName string) error
}

type pgSppgSchoolRepository struct{}

func NewSppgSchoolRepository() SppgSchoolRepository {
	return &pgSppgSchoolRepository{}
}

const schoolQuotaColumns = `
	id, sppg_id, school_id, npsn, school_name, address, level, lat, lng,
	enrolled, present, reduce_special, absence_note, present_updated_at,
	specials, principal_name, validator_name, validator_phone, droppoint,
	fleet_assigned, date, created_at, updated_at
`

func (r *pgSppgSchoolRepository) ListSchools(ctx context.Context, sppgID string) ([]models.SppgSchoolQuota, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_school_quotas
		WHERE sppg_id = $1
		ORDER BY id ASC
	`, schoolQuotaColumns)

	rows, err := database.Pool().Query(ctx, query, sppgID)
	if err != nil {
		return nil, fmt.Errorf("list schools failed: %w", err)
	}
	defer rows.Close()

	var list []models.SppgSchoolQuota
	for rows.Next() {
		var s models.SppgSchoolQuota
		var specBytes []byte
		var d time.Time
		err := rows.Scan(
			&s.ID, &s.SppgID, &s.SchoolID, &s.Npsn, &s.Name, &s.Address, &s.Level, &s.Lat, &s.Lng,
			&s.Enrolled, &s.Present, &s.ReduceSpecial, &s.AbsenceNote, &s.PresentUpdatedAt,
			&specBytes, &s.Principal, &s.Validator, &s.ValidatorPhone, &s.Droppoint,
			&s.Fleet, &d, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan school quota failed: %w", err)
		}
		s.Date = d.Format("2006-01-02")
		if len(specBytes) > 0 {
			_ = json.Unmarshal(specBytes, &s.Specials)
		}
		if s.Specials == nil {
			s.Specials = []models.SpecialDietary{}
		}

		// Hitung kuota cetak & status presensi
		s.PackingQuota = calculatePackingQuota(s.Enrolled, s.Present, s.ReduceSpecial, s.PresentUpdatedAt)
		s.Status = calculateAttendanceStatus(s.PresentUpdatedAt)

		list = append(list, s)
	}
	if list == nil {
		list = []models.SppgSchoolQuota{}
	}
	return list, nil
}

func (r *pgSppgSchoolRepository) GetSchool(ctx context.Context, idOrSchoolID, sppgID string) (*models.SppgSchoolQuota, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM sppg_school_quotas
		WHERE sppg_id = $1 AND (id = $2 OR school_id = $2 OR npsn = $2)
		LIMIT 1
	`, schoolQuotaColumns)

	var s models.SppgSchoolQuota
	var specBytes []byte
	var d time.Time
	err := database.Pool().QueryRow(ctx, query, sppgID, idOrSchoolID).Scan(
		&s.ID, &s.SppgID, &s.SchoolID, &s.Npsn, &s.Name, &s.Address, &s.Level, &s.Lat, &s.Lng,
		&s.Enrolled, &s.Present, &s.ReduceSpecial, &s.AbsenceNote, &s.PresentUpdatedAt,
		&specBytes, &s.Principal, &s.Validator, &s.ValidatorPhone, &s.Droppoint,
		&s.Fleet, &d, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, errors.New("sekolah binaan tidak ditemukan")
	}
	s.Date = d.Format("2006-01-02")
	if len(specBytes) > 0 {
		_ = json.Unmarshal(specBytes, &s.Specials)
	}
	if s.Specials == nil {
		s.Specials = []models.SpecialDietary{}
	}
	s.PackingQuota = calculatePackingQuota(s.Enrolled, s.Present, s.ReduceSpecial, s.PresentUpdatedAt)
	s.Status = calculateAttendanceStatus(s.PresentUpdatedAt)
	return &s, nil
}

func (r *pgSppgSchoolRepository) UpdateAttendance(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateAttendancePayload) (*models.SppgSchoolQuota, error) {
	target, err := r.GetSchool(ctx, idOrSchoolID, sppgID)
	if err != nil {
		return nil, err
	}

	presentTime := payload.PresentUpdatedAt
	if presentTime == "" {
		presentTime = time.Now().Format("15:04")
	}

	specials := payload.Specials
	if specials == nil {
		specials = target.Specials
	}
	specJSON, _ := json.Marshal(specials)

	query := `
		UPDATE sppg_school_quotas
		SET present = $1,
		    reduce_special = $2,
		    absence_note = $3,
		    present_updated_at = $4,
		    specials = $5,
		    updated_at = NOW()
		WHERE id = $6 AND sppg_id = $7
	`
	_, err = database.Pool().Exec(
		ctx, query,
		payload.Present, payload.ReduceSpecial, payload.AbsenceNote,
		presentTime, specJSON, target.ID, sppgID,
	)
	if err != nil {
		return nil, fmt.Errorf("update attendance failed: %w", err)
	}

	// Update juga riwayat kehadiran di tabel attendances bila ada record
	_ = updateLinkedAttendanceRecord(ctx, target.Npsn, payload.Present, target.Enrolled, payload.AbsenceNote)

	return r.GetSchool(ctx, target.ID, sppgID)
}

func (r *pgSppgSchoolRepository) UpdateDroppoint(ctx context.Context, idOrSchoolID, sppgID string, payload *models.UpdateDroppointPayload) (*models.SppgSchoolQuota, error) {
	target, err := r.GetSchool(ctx, idOrSchoolID, sppgID)
	if err != nil {
		return nil, err
	}

	principal := payload.Principal
	if principal == "" {
		principal = target.Principal
	}

	query := `
		UPDATE sppg_school_quotas
		SET droppoint = $1,
		    validator_name = $2,
		    validator_phone = $3,
		    principal_name = $4,
		    updated_at = NOW()
		WHERE id = $5 AND sppg_id = $6
	`
	_, err = database.Pool().Exec(
		ctx, query,
		payload.Droppoint, payload.Validator, payload.ValidatorPhone,
		principal, target.ID, sppgID,
	)
	if err != nil {
		return nil, fmt.Errorf("update droppoint failed: %w", err)
	}

	return r.GetSchool(ctx, target.ID, sppgID)
}

func (r *pgSppgSchoolRepository) CreateReminder(ctx context.Context, sppgID, schoolID, message, actorName string) error {
	school, err := r.GetSchool(ctx, schoolID, sppgID)
	if err != nil {
		return err
	}

	auditID := "aud-" + uuid.NewString()[:12]
	detailJSON, _ := json.Marshal(map[string]any{
		"module":     "schools_attendance",
		"action":     "attendance.remind",
		"schoolId":   school.SchoolID,
		"schoolName": school.Name,
		"validator":  school.Validator,
		"phone":      school.ValidatorPhone,
		"message":    message,
		"sentBy":     actorName,
	})

	_, err = database.Pool().Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'schools.remind_attendance', $3, $4, NOW())
	`, auditID, sppgID, school.Name, string(detailJSON))

	return err
}

func (r *pgSppgSchoolRepository) GetBundle(ctx context.Context, sppgID string) (*models.SppgSchoolBundle, error) {
	// 1. Info Dapur SPPG & Titik Depot
	var kitchenCode, kitchenName, coordinates string
	err := database.Pool().QueryRow(ctx, `
		SELECT code, name, coordinates FROM sppg_kitchens WHERE id = $1
	`, sppgID).Scan(&kitchenCode, &kitchenName, &coordinates)
	if err != nil {
		kitchenCode = sppgID
		kitchenName = "Dapur Sentral " + sppgID
		coordinates = "-6.1955, 106.8305"
	}

	depotLat := -6.1955
	depotLng := 106.8305
	coordsParts := strings.Split(coordinates, ",")
	if len(coordsParts) == 2 {
		if lat, err := strconv.ParseFloat(strings.TrimSpace(coordsParts[0]), 64); err == nil {
			depotLat = lat
		}
		if lng, err := strconv.ParseFloat(strings.TrimSpace(coordsParts[1]), 64); err == nil {
			depotLng = lng
		}
	}

	depot := models.DepotInfo{
		ID:   sppgID,
		Name: kitchenName,
		Lat:  depotLat,
		Lng:  depotLng,
	}

	// 2. Daftar Sekolah Binaan Dapur Ini
	schools, err := r.ListSchools(ctx, sppgID)
	if err != nil {
		return nil, err
	}

	// 3. Hitung Agregasi Totals
	totalPresent := 0
	totalQuota := 0
	updatedCount := 0
	totalSpecials := 0

	for _, s := range schools {
		totalQuota += s.PackingQuota
		if s.PresentUpdatedAt != "" {
			totalPresent += s.Present
			updatedCount++
		}
		for _, sp := range s.Specials {
			totalSpecials += sp.Count
		}
	}

	totals := models.SppgSchoolTotals{
		Quota:    totalQuota,
		Present:  totalPresent,
		Updated:  updatedCount,
		Total:    len(schools),
		Specials: totalSpecials,
	}

	return &models.SppgSchoolBundle{
		SppgID:      sppgID,
		KitchenName: kitchenName,
		KitchenCode: kitchenCode,
		Depot:       depot,
		Deadline:    "05:00",
		Totals:      totals,
		Schools:     schools,
	}, nil
}

// Helpers
func calculatePackingQuota(enrolled, present, reduceSpecial int, updatedAt string) int {
	if updatedAt == "" {
		return enrolled
	}
	q := present - reduceSpecial
	if q < 0 {
		return 0
	}
	return q
}

func calculateAttendanceStatus(updatedAt string) models.AttendanceStatusInfo {
	if updatedAt == "" {
		return models.AttendanceStatusInfo{
			Label:  "Belum update",
			Tone:   "bg-slate-100 text-slate-600",
			OnTime: false,
		}
	}

	// Format "HH:MM"
	parts := strings.Split(updatedAt, ":")
	if len(parts) == 2 {
		h, _ := strconv.Atoi(parts[0])
		m, _ := strconv.Atoi(parts[1])
		if (h < 5) || (h == 5 && m == 0) {
			return models.AttendanceStatusInfo{
				Label:  fmt.Sprintf("Update %s", updatedAt),
				Tone:   "bg-emerald-50 text-emerald-800",
				OnTime: true,
			}
		}
	}

	return models.AttendanceStatusInfo{
		Label:  fmt.Sprintf("Telat %s", updatedAt),
		Tone:   "bg-amber-50 text-amber-900",
		OnTime: false,
	}
}

func updateLinkedAttendanceRecord(ctx context.Context, npsn string, present, registered int, notes string) error {
	_, err := database.Pool().Exec(ctx, `
		UPDATE attendances
		SET present_students = $1,
		    registered_students = $2,
		    notes = $3
		WHERE school_npsn = $4 AND date = CURRENT_DATE
	`, present, registered, notes, npsn)
	return err
}
