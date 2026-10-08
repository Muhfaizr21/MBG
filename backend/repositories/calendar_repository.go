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
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CalendarRepository menyediakan antarmuka akses database untuk siklus kalender menu nasional,
// hari operasional MBG, pengajuan substitusi darurat, dan penjadwalan sidak mendadak.
type CalendarRepository interface {
	ListDays(ctx context.Context, monthYear string) ([]models.CalendarDay, error)
	GetDayByDate(ctx context.Context, date string) (*models.CalendarDay, error)
	LockMonth(ctx context.Context, monthYear string, actor models.User) error
	ToggleDayLock(ctx context.Context, date string, actor models.User) (*models.CalendarDay, error)
	SetBlackoutDate(ctx context.Context, date string, req models.BlackoutDateRequest, actor models.User) (*models.CalendarDay, error)
	ListSubstitutions(ctx context.Context) ([]models.MenuSubstitution, error)
	GetSubstitutionByID(ctx context.Context, id string) (*models.MenuSubstitution, error)
	CreateSubstitution(ctx context.Context, req models.CreateSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error)
	ReviewSubstitution(ctx context.Context, id string, action string, actor models.User) (*models.MenuSubstitution, error)
	ScheduleInspection(ctx context.Context, date string, req models.ScheduleInspectionRequest, actor models.User) (*models.CalendarDay, error)
	ListMenuPackages(ctx context.Context) ([]models.MenuPackage, error)
}

type postgresCalendarRepository struct {
	pool *pgxpool.Pool
}

// NewCalendarRepository menginisialisasi repository kalender berbasis PostgreSQL.
func NewCalendarRepository(pool *pgxpool.Pool) CalendarRepository {
	if pool == nil {
		pool = database.Pool()
	}
	return &postgresCalendarRepository{pool: pool}
}

const baseCalendarDaySelect = `
	SELECT 
		c.date, COALESCE(c.package_id, ''), c.day_name, c.day_number, c.month_year,
		c.day_type, c.day_type_label, c.title, c.menu_status, c.menu_status_label,
		c.is_operational_blackout, COALESCE(c.blackout_reason, ''),
		c.target_portions, c.active_kitchens, c.has_inspection,
		COALESCE(c.inspection_detail, '{}'::jsonb),
		c.has_substitution, COALESCE(c.substitution_id, ''),
		c.status, c.theme, c.notes, c.week_number,
		c.updated_at,
		COALESCE(p.id, ''), COALESCE(p.cycle_code, ''), COALESCE(p.day_slot, ''), COALESCE(p.name, ''),
		COALESCE(p.staple, ''), COALESCE(p.protein_main, ''), COALESCE(p.side_veggie, ''),
		COALESCE(p.fruit, ''), COALESCE(p.dairy_drink, ''),
		COALESCE(p.calories, 0), COALESCE(p.protein, 0), COALESCE(p.carbs, 0), COALESCE(p.fat, 0),
		COALESCE(p.calcium, 0), COALESCE(p.iron, 0), COALESCE(p.zinc, 0),
		COALESCE(p.cost_per_serving, 0), COALESCE(p.allergens, ''),
		COALESCE(p.halal_cert, ''), COALESCE(p.slhs_cert, ''), COALESCE(p.description, '')
	FROM calendar_days c
	LEFT JOIN menu_packages p ON c.package_id = p.id
`

func scanCalendarDay(row pgx.Row) (*models.CalendarDay, error) {
	var (
		dateRaw        time.Time
		pkgID          string
		dayName        string
		dayNumber      int
		monthYear      string
		dayType        string
		dayTypeLabel   string
		title          string
		menuStatus     string
		menuStatusLbl  string
		isBlackout     bool
		blackoutReason string
		portions       int
		kitchens       int
		hasInspection  bool
		inspDetailJSON []byte
		hasSub         bool
		subID          string
		statusCompat   string
		themeCompat    string
		notesCompat    string
		weekNumber     int
		updatedAt      time.Time

		// Package fields
		pID, pCycle, pDaySlot, pName string
		pStaple, pProtein, pVeggie, pFruit, pDairy string
		pCal, pProt, pCarb, pFat, pCalc, pIron, pZinc, pCost float64
		pAllergens, pHalal, pSLHS, pDesc string
	)

	err := row.Scan(
		&dateRaw, &pkgID, &dayName, &dayNumber, &monthYear,
		&dayType, &dayTypeLabel, &title, &menuStatus, &menuStatusLbl,
		&isBlackout, &blackoutReason,
		&portions, &kitchens, &hasInspection,
		&inspDetailJSON,
		&hasSub, &subID,
		&statusCompat, &themeCompat, &notesCompat, &weekNumber,
		&updatedAt,
		&pID, &pCycle, &pDaySlot, &pName,
		&pStaple, &pProtein, &pVeggie, &pFruit, &pDairy,
		&pCal, &pProt, &pCarb, &pFat, &pCalc, &pIron, &pZinc,
		&pCost, &pAllergens, &pHalal, &pSLHS, &pDesc,
	)
	if err != nil {
		return nil, err
	}

	dateStr := dateRaw.Format("2006-01-02")
	d := &models.CalendarDay{
		Date:                  dateStr,
		PackageID:             pkgID,
		DayName:               dayName,
		DayNumber:             dayNumber,
		MonthYear:             monthYear,
		DayType:               dayType,
		DayTypeLabel:          dayTypeLabel,
		Title:                 title,
		MenuStatus:            menuStatus,
		MenuStatusLabel:       menuStatusLbl,
		IsOperationalBlackout: isBlackout,
		BlackoutReason:        blackoutReason,
		TargetPortions:        portions,
		ActiveKitchens:        kitchens,
		HasInspection:         hasInspection,
		HasSubstitution:       hasSub,
		SubstitutionID:        subID,
		Status:                statusCompat,
		Theme:                 themeCompat,
		Notes:                 notesCompat,
		WeekNumber:            weekNumber,
		UpdatedAt:             updatedAt,
	}

	if len(inspDetailJSON) > 0 && string(inspDetailJSON) != "{}" && string(inspDetailJSON) != "null" {
		var detail models.InspectionDetail
		if err := json.Unmarshal(inspDetailJSON, &detail); err == nil && detail.ID != "" {
			d.InspectionDetail = &detail
		}
	}

	if pID != "" {
		d.Package = &models.MenuPackage{
			ID:             pID,
			CycleCode:      pCycle,
			DaySlot:        pDaySlot,
			Name:           pName,
			Staple:         pStaple,
			ProteinMain:    pProtein,
			SideVeggie:     pVeggie,
			Fruit:          pFruit,
			DairyDrink:     pDairy,
			Calories:       pCal,
			Protein:        pProt,
			Carbs:          pCarb,
			Fat:            pFat,
			Calcium:        pCalc,
			Iron:           pIron,
			Zinc:           pZinc,
			CostPerServing: pCost,
			Allergens:      pAllergens,
			HalalCert:      pHalal,
			SLHSCert:       pSLHS,
			Description:    pDesc,
		}
	}

	return d, nil
}

func (r *postgresCalendarRepository) ListDays(ctx context.Context, monthYear string) ([]models.CalendarDay, error) {
	query := baseCalendarDaySelect
	var args []any
	if strings.TrimSpace(monthYear) != "" {
		query += " WHERE c.month_year ILIKE $1"
		args = append(args, "%"+strings.TrimSpace(monthYear)+"%")
	}
	query += " ORDER BY c.date ASC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("gagal query calendar_days: %w", err)
	}
	defer rows.Close()

	var result []models.CalendarDay
	for rows.Next() {
		d, err := scanCalendarDay(rows)
		if err != nil {
			return nil, fmt.Errorf("gagal scan calendar_days: %w", err)
		}
		result = append(result, *d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterasi rows calendar_days: %w", err)
	}
	return result, nil
}

func (r *postgresCalendarRepository) GetDayByDate(ctx context.Context, date string) (*models.CalendarDay, error) {
	query := baseCalendarDaySelect + " WHERE c.date = $1"
	row := r.pool.QueryRow(ctx, query, date)
	d, err := scanCalendarDay(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("hari kalender tanggal %s tidak ditemukan", date)
		}
		return nil, fmt.Errorf("gagal ambil calendar_day tanggal %s: %w", date, err)
	}
	return d, nil
}

func (r *postgresCalendarRepository) LockMonth(ctx context.Context, monthYear string, actor models.User) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("gagal memulai transaksi lock month: %w", err)
	}
	defer tx.Rollback(ctx)

	// Kunci hari sekolah / hari ujian pada bulan tersebut
	res, err := tx.Exec(ctx, `
		UPDATE calendar_days
		SET menu_status = 'locked',
		    menu_status_label = 'Menu Terkunci & Valid',
		    updated_at = NOW()
		WHERE month_year ILIKE $1
		  AND day_type IN ('school_day', 'exam_day')
	`, "%"+strings.TrimSpace(monthYear)+"%")
	if err != nil {
		return fmt.Errorf("gagal mengunci hari kalender bulan %s: %w", monthYear, err)
	}

	detail := fmt.Sprintf("Mengunci %d hari siklus menu aktif periode %s", res.RowsAffected(), monthYear)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'LOCK_MONTH_CYCLE', $3, $4, NOW())
	`, uuid.New().String(), actor.ID, monthYear, detail)
	if err != nil {
		return fmt.Errorf("gagal mencatat audit log lock month: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *postgresCalendarRepository) ToggleDayLock(ctx context.Context, date string, actor models.User) (*models.CalendarDay, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi toggle lock: %w", err)
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	err = tx.QueryRow(ctx, "SELECT menu_status FROM calendar_days WHERE date = $1", date).Scan(&currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("tanggal %s tidak ditemukan dalam kalender", date)
		}
		return nil, fmt.Errorf("gagal membaca status kalender: %w", err)
	}

	newStatus := "locked"
	newStatusLabel := "Menu Terkunci & Valid"
	if currentStatus == "locked" {
		newStatus = "draft"
		newStatusLabel = "Draft Penyusunan"
	}

	_, err = tx.Exec(ctx, `
		UPDATE calendar_days
		SET menu_status = $1, menu_status_label = $2, updated_at = NOW()
		WHERE date = $3
	`, newStatus, newStatusLabel, date)
	if err != nil {
		return nil, fmt.Errorf("gagal update status kunci tanggal %s: %w", date, err)
	}

	detail := fmt.Sprintf("Mengubah status penguncian tanggal %s dari %s menjadi %s", date, currentStatus, newStatus)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'TOGGLE_DAY_LOCK', $3, $4, NOW())
	`, uuid.New().String(), actor.ID, date, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log toggle lock: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit transaksi: %w", err)
	}

	return r.GetDayByDate(ctx, date)
}

func (r *postgresCalendarRepository) SetBlackoutDate(ctx context.Context, date string, req models.BlackoutDateRequest, actor models.User) (*models.CalendarDay, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi blackout date: %w", err)
	}
	defer tx.Rollback(ctx)

	var (
		actionName string
		detail     string
	)

	if req.IsSettingBlackout {
		title := req.Title
		if strings.TrimSpace(title) == "" {
			title = "Libur Operasional Khusus"
		}
		reason := req.Reason
		if strings.TrimSpace(reason) == "" {
			reason = "Libur Operasional Ditetapkan Superadmin MBG"
		}

		_, err = tx.Exec(ctx, `
			UPDATE calendar_days
			SET day_type = 'holiday',
			    day_type_label = 'Libur Nasional / Blackout',
			    title = $1,
			    menu_status = 'blackout',
			    menu_status_label = 'Libur Operasional Terkunci',
			    is_operational_blackout = TRUE,
			    blackout_reason = $2,
			    target_portions = 0,
			    active_kitchens = 0,
			    updated_at = NOW()
			WHERE date = $3
		`, title, reason, date)
		if err != nil {
			return nil, fmt.Errorf("gagal menetapkan blackout date %s: %w", date, err)
		}
		actionName = "SET_BLACKOUT_DATE"
		detail = fmt.Sprintf("Menetapkan tanggal %s sebagai Libur Operasional Blackout: %s", date, reason)
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE calendar_days
			SET day_type = 'school_day',
			    day_type_label = 'Hari Operasional Reguler',
			    title = 'Siklus Menu Normal',
			    menu_status = 'locked',
			    menu_status_label = 'Menu Terkunci & Valid',
			    is_operational_blackout = FALSE,
			    blackout_reason = NULL,
			    target_portions = 251000,
			    active_kitchens = 180,
			    updated_at = NOW()
			WHERE date = $1
		`, date)
		if err != nil {
			return nil, fmt.Errorf("gagal melepas blackout date %s: %w", date, err)
		}
		actionName = "RELEASE_BLACKOUT_DATE"
		detail = fmt.Sprintf("Membuka kembali operasional katering pada tanggal %s", date)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, uuid.New().String(), actor.ID, actionName, date, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log blackout: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit transaksi blackout: %w", err)
	}

	return r.GetDayByDate(ctx, date)
}

const baseSubstitutionSelect = `
	SELECT 
		id, date, cycle_code, region, original_ingredient, substitute_ingredient,
		reason, COALESCE(nutrition_comparison, '{}'::jsonb), nutritionist_review,
		status, status_label, approved_at, approved_by, created_at, updated_at
	FROM menu_substitutions
`

func scanSubstitution(row pgx.Row) (*models.MenuSubstitution, error) {
	var (
		id, cycleCode, region, origIng, subIng, reason string
		dateRaw                                        time.Time
		nutriJSON                                      []byte
		review, status, statusLbl                      string
		appAt, appBy                                   *string
		createdAt, updatedAt                           time.Time
	)

	err := row.Scan(
		&id, &dateRaw, &cycleCode, &region, &origIng, &subIng,
		&reason, &nutriJSON, &review,
		&status, &statusLbl, &appAt, &appBy, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}

	s := &models.MenuSubstitution{
		ID:                   id,
		Date:                 dateRaw.Format("2006-01-02"),
		CycleCode:            cycleCode,
		Region:               region,
		OriginalIngredient:   origIng,
		SubstituteIngredient: subIng,
		Reason:               reason,
		NutritionistReview:   review,
		Status:               status,
		StatusLabel:          statusLbl,
		ApprovedAt:           appAt,
		ApprovedBy:           appBy,
		CreatedAt:            createdAt,
		UpdatedAt:            updatedAt,
	}

	if len(nutriJSON) > 0 && string(nutriJSON) != "{}" && string(nutriJSON) != "null" {
		_ = json.Unmarshal(nutriJSON, &s.NutritionComparison)
	}

	return s, nil
}

func (r *postgresCalendarRepository) ListSubstitutions(ctx context.Context) ([]models.MenuSubstitution, error) {
	query := baseSubstitutionSelect + " ORDER BY date DESC, created_at DESC"
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("gagal query menu_substitutions: %w", err)
	}
	defer rows.Close()

	var result []models.MenuSubstitution
	for rows.Next() {
		s, err := scanSubstitution(rows)
		if err != nil {
			return nil, fmt.Errorf("gagal scan menu_substitutions: %w", err)
		}
		result = append(result, *s)
	}
	return result, rows.Err()
}

func (r *postgresCalendarRepository) GetSubstitutionByID(ctx context.Context, id string) (*models.MenuSubstitution, error) {
	query := baseSubstitutionSelect + " WHERE id = $1"
	row := r.pool.QueryRow(ctx, query, id)
	s, err := scanSubstitution(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("substitusi menu %s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal ambil substitusi %s: %w", id, err)
	}
	return s, nil
}

func (r *postgresCalendarRepository) CreateSubstitution(ctx context.Context, req models.CreateSubstitutionRequest, actor models.User) (*models.MenuSubstitution, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal memulai transaksi substitusi: %w", err)
	}
	defer tx.Rollback(ctx)

	subID := fmt.Sprintf("SUB-2026-%d", time.Now().UnixNano()%10000)
	nowStr := time.Now().Format("2006-01-02 15:04 WIB")
	actorName := actor.FullName
	if actorName == "" {
		actorName = "Superadmin Satgas MBG"
	}

	nutriJSON, _ := json.Marshal(req.NutritionComparison)

	_, err = tx.Exec(ctx, `
		INSERT INTO menu_substitutions (
			id, date, cycle_code, region, original_ingredient, substitute_ingredient,
			reason, nutrition_comparison, nutritionist_review, status, status_label,
			approved_at, approved_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, 'approved', 'Disetujui Superadmin BGN',
			$10, $11, NOW(), NOW()
		)
	`, subID, req.Date, req.CycleCode, req.Region, req.OriginalIngredient, req.SubstituteIngredient,
		req.Reason, nutriJSON, req.NutritionistReview, nowStr, actorName)
	if err != nil {
		return nil, fmt.Errorf("gagal insert menu_substitution: %w", err)
	}

	// Perbarui calendar_days terkait
	_, err = tx.Exec(ctx, `
		UPDATE calendar_days
		SET menu_status = 'substitution_approved',
		    menu_status_label = 'Substitusi Disetujui BGN',
		    has_substitution = TRUE,
		    substitution_id = $1,
		    updated_at = NOW()
		WHERE date = $2
	`, subID, req.Date)
	if err != nil {
		return nil, fmt.Errorf("gagal perbarui calendar_day setelah substitusi: %w", err)
	}

	detail := fmt.Sprintf("Mengusulkan & menyetujui substitusi menu %s tanggal %s: %s -> %s",
		req.CycleCode, req.Date, req.OriginalIngredient, req.SubstituteIngredient)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'CREATE_SUBSTITUTION', $3, $4, NOW())
	`, uuid.New().String(), actor.ID, subID, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal audit log substitusi: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit transaksi substitusi: %w", err)
	}

	return r.GetSubstitutionByID(ctx, subID)
}

func (r *postgresCalendarRepository) ReviewSubstitution(ctx context.Context, id string, action string, actor models.User) (*models.MenuSubstitution, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal memulai transaksi review substitusi: %w", err)
	}
	defer tx.Rollback(ctx)

	var subDate string
	err = tx.QueryRow(ctx, "SELECT date::text FROM menu_substitutions WHERE id = $1", id).Scan(&subDate)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("substitusi %s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal cek substitusi: %w", err)
	}

	nowStr := time.Now().Format("2006-01-02 15:04 WIB")
	actorName := actor.FullName
	if actorName == "" {
		actorName = "Bambang Soediro (Superadmin Satgas MBG)"
	}

	var (
		statusVal        string
		statusLbl        string
		dayMenuStatus    string
		dayMenuStatusLbl string
		auditAction      string
	)

	if action == "approve" {
		statusVal = "approved"
		statusLbl = "Disetujui Superadmin BGN"
		dayMenuStatus = "substitution_approved"
		dayMenuStatusLbl = "Substitusi Disetujui BGN"
		auditAction = "APPROVE_SUBSTITUTION"
	} else {
		statusVal = "rejected"
		statusLbl = "Ditolak (Tetap Menu Asli)"
		dayMenuStatus = "locked"
		dayMenuStatusLbl = "Menu Terkunci (Substitusi Ditolak)"
		auditAction = "REJECT_SUBSTITUTION"
	}

	_, err = tx.Exec(ctx, `
		UPDATE menu_substitutions
		SET status = $1, status_label = $2, approved_at = $3, approved_by = $4, updated_at = NOW()
		WHERE id = $5
	`, statusVal, statusLbl, nowStr, actorName, id)
	if err != nil {
		return nil, fmt.Errorf("gagal update status review substitusi %s: %w", id, err)
	}

	_, err = tx.Exec(ctx, `
		UPDATE calendar_days
		SET menu_status = $1, menu_status_label = $2, updated_at = NOW()
		WHERE date = $3
	`, dayMenuStatus, dayMenuStatusLbl, subDate)
	if err != nil {
		return nil, fmt.Errorf("gagal update calendar_days review substitusi: %w", err)
	}

	detail := fmt.Sprintf("Melakukan review (%s) pada pengajuan substitusi menu %s", action, id)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, uuid.New().String(), actor.ID, auditAction, id, detail)
	if err != nil {
		return nil, fmt.Errorf("gagal mencatat audit log review substitusi: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit transaksi review substitusi: %w", err)
	}

	return r.GetSubstitutionByID(ctx, id)
}

func (r *postgresCalendarRepository) ScheduleInspection(ctx context.Context, date string, req models.ScheduleInspectionRequest, actor models.User) (*models.CalendarDay, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal transaksi jadwal inspeksi: %w", err)
	}
	defer tx.Rollback(ctx)

	inspID := fmt.Sprintf("SDK-2026-%d", time.Now().UnixNano()%10000)
	detailObj := models.InspectionDetail{
		ID:             inspID,
		LeadInspector:  req.LeadInspector,
		Team:           req.Team,
		TargetSppgName: req.TargetSppgName,
		SppgID:         req.SppgID,
		AuditTime:      req.AuditTime,
		AuditFocus:     req.AuditFocus,
		Result:         "Terjadwal Rahasia (Siap Inspeksi)",
	}

	detailJSON, err := json.Marshal(detailObj)
	if err != nil {
		return nil, fmt.Errorf("gagal serialisasi inspeksi: %w", err)
	}

	res, err := tx.Exec(ctx, `
		UPDATE calendar_days
		SET has_inspection = TRUE,
		    inspection_detail = $1,
		    updated_at = NOW()
		WHERE date = $2
	`, detailJSON, date)
	if err != nil {
		return nil, fmt.Errorf("gagal update calendar_days untuk inspeksi %s: %w", date, err)
	}
	if res.RowsAffected() == 0 {
		return nil, fmt.Errorf("tanggal %s tidak ditemukan dalam kalender", date)
	}

	detailLog := fmt.Sprintf("Menjadwalkan sidak mendadak rahasia ke %s (%s) pada tanggal %s", req.TargetSppgName, req.SppgID, date)
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target, detail, at)
		VALUES ($1, $2, 'SCHEDULE_INSPECTION', $3, $4, NOW())
	`, uuid.New().String(), actor.ID, date, detailLog)
	if err != nil {
		return nil, fmt.Errorf("gagal audit log inspeksi: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("gagal commit transaksi inspeksi: %w", err)
	}

	return r.GetDayByDate(ctx, date)
}

func (r *postgresCalendarRepository) ListMenuPackages(ctx context.Context) ([]models.MenuPackage, error) {
	query := `
		SELECT 
			id, cycle_code, day_slot, name, staple, protein_main, side_veggie, fruit, dairy_drink,
			calories, protein, carbs, fat, calcium, iron, zinc, cost_per_serving,
			allergens, halal_cert, slhs_cert, description, created_at
		FROM menu_packages
		ORDER BY id ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("gagal query menu_packages: %w", err)
	}
	defer rows.Close()

	var result []models.MenuPackage
	for rows.Next() {
		var p models.MenuPackage
		err := rows.Scan(
			&p.ID, &p.CycleCode, &p.DaySlot, &p.Name, &p.Staple, &p.ProteinMain,
			&p.SideVeggie, &p.Fruit, &p.DairyDrink, &p.Calories, &p.Protein,
			&p.Carbs, &p.Fat, &p.Calcium, &p.Iron, &p.Zinc, &p.CostPerServing,
			&p.Allergens, &p.HalalCert, &p.SLHSCert, &p.Description, &p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("gagal scan menu_package: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}
