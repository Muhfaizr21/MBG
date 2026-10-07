package database

import (
	"backend/config"
	"backend/models"
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var pool *pgxpool.Pool

// Connect opens the PostgreSQL connection pool using the given configuration.
func Connect(ctx context.Context, cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	p, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return fmt.Errorf("membuat connection pool: %w", err)
	}
	if err := p.Ping(ctx); err != nil {
		return fmt.Errorf("koneksi database gagal: %w", err)
	}

	pool = p
	return nil
}

// Pool exposes the shared connection pool.
func Pool() *pgxpool.Pool {
	return pool
}

// Close shuts down the connection pool.
func Close() {
	if pool != nil {
		pool.Close()
	}
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
	id            TEXT PRIMARY KEY,
	full_name     TEXT NOT NULL,
	email         TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	role          TEXT NOT NULL CHECK (role IN ('superadmin','satgas','sppg','validator','siswa')),
	npsn          TEXT NOT NULL DEFAULT '',
	school_name   TEXT NOT NULL DEFAULT '',
	sppg_id       TEXT NOT NULL DEFAULT '',
	status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','blacklisted')),
	created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
	id         TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ NOT NULL,
	revoked    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS audit_logs (
	id       TEXT PRIMARY KEY,
	actor_id TEXT NOT NULL,
	action   TEXT NOT NULL,
	target   TEXT,
	detail   TEXT,
	at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_logs (
	id             TEXT PRIMARY KEY,
	box_id         TEXT NOT NULL DEFAULT '',
	qr_token       TEXT NOT NULL DEFAULT '',
	batch_id       TEXT NOT NULL DEFAULT '',
	image_ref      TEXT NOT NULL DEFAULT '',
	ai_class       TEXT NOT NULL DEFAULT '',
	ai_confidence  DOUBLE PRECISION NOT NULL DEFAULT 0,
	visual_score   DOUBLE PRECISION NOT NULL DEFAULT 0,
	holding_temp_c DOUBLE PRECISION,
	release_temp_c DOUBLE PRECISION,
	verdict        TEXT NOT NULL CHECK (verdict IN ('layak','peringatan','tolak')),
	reason         TEXT NOT NULL DEFAULT '',
	actor_id       TEXT NOT NULL,
	created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_items (
	name         TEXT PRIMARY KEY,
	calories     DOUBLE PRECISION NOT NULL DEFAULT 0,
	protein      DOUBLE PRECISION NOT NULL DEFAULT 0,
	fat          DOUBLE PRECISION NOT NULL DEFAULT 0,
	carbohydrate DOUBLE PRECISION NOT NULL DEFAULT 0
);
`

// Migrate creates the schema (idempotent).
func Migrate(ctx context.Context) error {
	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("migrasi schema gagal: %w", err)
	}
	return nil
}

type seedUser struct {
	ID, FullName, Email, Password, Role, NPSN, SchoolName, SppgID string
}

// Seed inserts the demo accounts when the users table is empty.
func Seed(ctx context.Context) error {
	var count int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		return fmt.Errorf("menghitung users: %w", err)
	}
	if count > 0 {
		return nil
	}

	seeds := []seedUser{
		{ID: "usr-superadmin-001", FullName: "Bambang Soediro", Email: "superadmin@kawangizi.id", Password: "SuperAdmin123!", Role: models.RoleSuperadmin},
		{ID: "usr-satgas-001", FullName: "Dr. Hendra Prasetyo", Email: "satgas@kawangizi.id", Password: "Satgas123!", Role: models.RoleSatgas},
		{ID: "usr-sppg-001", FullName: "SPPG 01 Menteng Jaya Mandiri", Email: "dapur@sppg01.id", Password: "Sppg123!", Role: models.RoleSppg, SppgID: "SPPG-01"},
		{ID: "usr-validator-001", FullName: "Ibu Siti Aminah, S.Pd.", Email: "validator@sdn01menteng.sch.id", Password: "Validator123!", Role: models.RoleValidator, NPSN: "33.210.130", SchoolName: "SDN Menteng 01 Pagi", SppgID: "SPPG-01"},
		{ID: "usr-siswa-001", FullName: "Budi Pratama", Email: "siswa@sdn01menteng.sch.id", Password: "Siswa123!", Role: models.RoleSiswa, NPSN: "33.210.130", SchoolName: "SDN Menteng 01 Pagi", SppgID: "SPPG-01"},
	}

	for _, s := range seeds {
		hash, err := bcrypt.GenerateFromPassword([]byte(s.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password %s: %w", s.Email, err)
		}
		_, err = pool.Exec(ctx, `
			INSERT INTO users (id, full_name, email, password_hash, role, npsn, school_name, sppg_id, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
			s.ID, s.FullName, s.Email, string(hash), s.Role, s.NPSN, s.SchoolName, s.SppgID,
		)
		if err != nil {
			return fmt.Errorf("seed user %s: %w", s.Email, err)
		}
	}

	log.Printf("✅ Seed %d akun demo selesai\n", len(seeds))
	return nil
}

// SeedNutrition mengisi nutrition_items dari CSV dataset gizi (idempoten).
// Data hanya di-seed bila tabel masih kosong; file yang tidak ada dilewati
// dengan peringatan agar backend tetap bisa berjalan tanpa dataset.
func SeedNutrition(ctx context.Context, path string) error {
	var count int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM nutrition_items").Scan(&count); err != nil {
		return fmt.Errorf("menghitung nutrition_items: %w", err)
	}
	if count > 0 {
		return nil
	}

	file, err := os.Open(path)
	if err != nil {
		log.Printf("⚠️ Dataset gizi %q tidak ditemukan — tabel nutrition_items kosong\n", path)
		return nil
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("membaca %s: %w", path, err)
	}

	// Baris pertama adalah header (Calories,Proteins,Fat,Carbohydrate,Name).
	var items []models.NutritionItem
	skipped := 0
	for i, row := range records {
		if i == 0 {
			continue
		}
		if len(row) < 5 {
			skipped++
			continue
		}
		item := models.NutritionItem{Name: strings.TrimSpace(row[4])}
		item.Calories, err = strconv.ParseFloat(strings.TrimSpace(row[0]), 64)
		if err != nil {
			skipped++
			continue
		}
		item.Protein, err = strconv.ParseFloat(strings.TrimSpace(row[1]), 64)
		if err != nil {
			skipped++
			continue
		}
		item.Fat, err = strconv.ParseFloat(strings.TrimSpace(row[2]), 64)
		if err != nil {
			skipped++
			continue
		}
		item.Carbohydrate, err = strconv.ParseFloat(strings.TrimSpace(row[3]), 64)
		if err != nil {
			skipped++
			continue
		}
		if item.Name == "" {
			skipped++
			continue
		}
		items = append(items, item)
	}

	if len(items) == 0 {
		log.Printf("⚠️ Tidak ada baris valid di %s — tabel nutrition_items kosong\n", path)
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("memulai transaksi seed gizi: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, item := range items {
		if _, err := tx.Exec(ctx, `
			INSERT INTO nutrition_items (name, calories, protein, fat, carbohydrate)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (name) DO NOTHING`,
			item.Name, item.Calories, item.Protein, item.Fat, item.Carbohydrate); err != nil {
			return fmt.Errorf("seed gizi %q: %w", item.Name, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("menutup transaksi seed gizi: %w", err)
	}
	log.Printf("✅ Seed %d item gizi dari %s (%d baris dilewati)\n", len(items), path, skipped)
	return nil
}
