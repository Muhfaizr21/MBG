package database

import (
	"context"
	"fmt"
)

const extendedSchema = `
-- 1. SPPG Kitchens (Dapur Sentral & Rekanan BGN)
CREATE TABLE IF NOT EXISTS sppg_kitchens (
	id VARCHAR(64) PRIMARY KEY,
	code VARCHAR(64) NOT NULL DEFAULT '',
	name VARCHAR(255) NOT NULL,
	legal_entity VARCHAR(255) NOT NULL DEFAULT '',
	type VARCHAR(32) NOT NULL DEFAULT 'sentral',
	type_label VARCHAR(64) NOT NULL DEFAULT '',
	address TEXT NOT NULL DEFAULT '',
	subdistrict VARCHAR(100) NOT NULL DEFAULT '',
	city VARCHAR(100) NOT NULL DEFAULT '',
	province VARCHAR(100) NOT NULL DEFAULT '',
	cluster VARCHAR(100) NOT NULL DEFAULT '',
	coordinates VARCHAR(100) NOT NULL DEFAULT '',
	manager_name VARCHAR(150) NOT NULL DEFAULT '',
	manager_nip VARCHAR(50) NOT NULL DEFAULT '',
	manager_phone VARCHAR(50) NOT NULL DEFAULT '',
	nutritionist_name VARCHAR(150) NOT NULL DEFAULT '',
	nutritionist_str VARCHAR(100) NOT NULL DEFAULT '',
	staff_count INT NOT NULL DEFAULT 0,
	kitchen_area VARCHAR(50) NOT NULL DEFAULT '',
	fleet_count INT NOT NULL DEFAULT 0,
	fleet_type TEXT NOT NULL DEFAULT '',
	max_daily_portions INT NOT NULL DEFAULT 0,
	active_quota INT NOT NULL DEFAULT 0,
	safety_score DOUBLE PRECISION NOT NULL DEFAULT 100,
	cold_chain_score DOUBLE PRECISION NOT NULL DEFAULT 100,
	timeliness_score DOUBLE PRECISION NOT NULL DEFAULT 100,
	composite_score DOUBLE PRECISION NOT NULL DEFAULT 100,
	grade VARCHAR(10) NOT NULL DEFAULT 'A',
	status VARCHAR(32) NOT NULL DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Schools (Sekolah Binaan Penerima MBG)
CREATE TABLE IF NOT EXISTS schools (
	npsn VARCHAR(32) PRIMARY KEY,
	id VARCHAR(64) NOT NULL UNIQUE,
	name VARCHAR(255) NOT NULL,
	level VARCHAR(32) NOT NULL DEFAULT 'SD',
	status VARCHAR(32) NOT NULL DEFAULT 'active',
	status_label VARCHAR(64) NOT NULL DEFAULT 'Aktif Penuh',
	status_reason TEXT NOT NULL DEFAULT '',
	address TEXT NOT NULL DEFAULT '',
	city VARCHAR(100) NOT NULL DEFAULT '',
	district VARCHAR(100) NOT NULL DEFAULT '',
	lat DOUBLE PRECISION NOT NULL DEFAULT 0,
	lng DOUBLE PRECISION NOT NULL DEFAULT 0,
	principal_name VARCHAR(150) NOT NULL DEFAULT '',
	principal_nip VARCHAR(50) NOT NULL DEFAULT '',
	principal_phone VARCHAR(50) NOT NULL DEFAULT '',
	principal_email VARCHAR(150) NOT NULL DEFAULT '',
	total_students INT NOT NULL DEFAULT 0,
	total_calorie_target INT NOT NULL DEFAULT 0,
	dietary_notes TEXT NOT NULL DEFAULT '',
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE SET NULL,
	acceptance_rate DOUBLE PRECISION NOT NULL DEFAULT 100,
	avg_arrival_time VARCHAR(50) NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Menu Packages (Paket Siklus Menu Standar BGN)
CREATE TABLE IF NOT EXISTS menu_packages (
	id VARCHAR(64) PRIMARY KEY,
	cycle_code VARCHAR(50) NOT NULL DEFAULT '',
	day_slot VARCHAR(100) NOT NULL DEFAULT '',
	name VARCHAR(255) NOT NULL,
	staple VARCHAR(255) NOT NULL DEFAULT '',
	protein_main VARCHAR(255) NOT NULL DEFAULT '',
	side_veggie VARCHAR(255) NOT NULL DEFAULT '',
	fruit VARCHAR(255) NOT NULL DEFAULT '',
	dairy_drink VARCHAR(255) NOT NULL DEFAULT '',
	calories DOUBLE PRECISION NOT NULL DEFAULT 0,
	protein DOUBLE PRECISION NOT NULL DEFAULT 0,
	carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
	fat DOUBLE PRECISION NOT NULL DEFAULT 0,
	calcium DOUBLE PRECISION NOT NULL DEFAULT 0,
	iron DOUBLE PRECISION NOT NULL DEFAULT 0,
	zinc DOUBLE PRECISION NOT NULL DEFAULT 0,
	cost_per_serving DOUBLE PRECISION NOT NULL DEFAULT 0,
	allergens TEXT NOT NULL DEFAULT '',
	halal_cert VARCHAR(100) NOT NULL DEFAULT '',
	slhs_cert VARCHAR(100) NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Calendar Days (Kalender MBG Operasional & Siklus Harian)
CREATE TABLE IF NOT EXISTS calendar_days (
	date DATE PRIMARY KEY,
	package_id VARCHAR(64) REFERENCES menu_packages(id) ON DELETE SET NULL,
	day_name VARCHAR(50) NOT NULL DEFAULT '',
	week_number INT NOT NULL DEFAULT 1,
	day_type VARCHAR(32) NOT NULL DEFAULT 'regular',
	status VARCHAR(32) NOT NULL DEFAULT 'approved',
	theme VARCHAR(255) NOT NULL DEFAULT '',
	notes TEXT NOT NULL DEFAULT '',
	target_portions INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SPPG Recipes (Resep Masakan & SOP TKPI)
CREATE TABLE IF NOT EXISTS sppg_recipes (
	id VARCHAR(64) PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	category VARCHAR(100) NOT NULL DEFAULT '',
	portion_size_g INT NOT NULL DEFAULT 0,
	prep_time_minutes INT NOT NULL DEFAULT 0,
	cooking_temp_c DOUBLE PRECISION NOT NULL DEFAULT 0,
	sop_haccp TEXT NOT NULL DEFAULT '',
	ingredients JSONB NOT NULL DEFAULT '[]',
	nutrients JSONB NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SPPG Batches (Batch Masak Dapur & Kontrol Suhu)
CREATE TABLE IF NOT EXISTS sppg_batches (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	package_id VARCHAR(64) REFERENCES menu_packages(id) ON DELETE SET NULL,
	cooking_date DATE NOT NULL DEFAULT CURRENT_DATE,
	cooking_start VARCHAR(50) NOT NULL DEFAULT '',
	cooking_end VARCHAR(50) NOT NULL DEFAULT '',
	target_portions INT NOT NULL DEFAULT 0,
	actual_portions INT NOT NULL DEFAULT 0,
	core_temp_c DOUBLE PRECISION NOT NULL DEFAULT 0,
	cook_lead VARCHAR(150) NOT NULL DEFAULT '',
	qc_status VARCHAR(32) NOT NULL DEFAULT 'passed',
	haccp_status VARCHAR(32) NOT NULL DEFAULT 'safe',
	notes TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Deliveries (Telemetri Pengiriman & Hasil YOLOv8)
CREATE TABLE IF NOT EXISTS deliveries (
	id VARCHAR(64) PRIMARY KEY,
	batch_id VARCHAR(64) REFERENCES sppg_batches(id) ON DELETE SET NULL,
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE SET NULL,
	school_npsn VARCHAR(32) REFERENCES schools(npsn) ON DELETE CASCADE,
	validator_name VARCHAR(150) NOT NULL DEFAULT '',
	scanned_at VARCHAR(50) NOT NULL DEFAULT '',
	scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
	portions INT NOT NULL DEFAULT 0,
	target_portions INT NOT NULL DEFAULT 0,
	temp_c DOUBLE PRECISION NOT NULL DEFAULT 0,
	temp_status VARCHAR(32) NOT NULL DEFAULT 'safe',
	qr_token VARCHAR(255) NOT NULL DEFAULT '',
	qr_status VARCHAR(32) NOT NULL DEFAULT 'verified',
	crypto_hash VARCHAR(255) NOT NULL DEFAULT '',
	menu_name VARCHAR(255) NOT NULL DEFAULT '',
	ai_verdict VARCHAR(32) NOT NULL DEFAULT 'layak',
	ai_score DOUBLE PRECISION NOT NULL DEFAULT 0,
	image_url TEXT NOT NULL DEFAULT '',
	status VARCHAR(64) NOT NULL DEFAULT 'Tiba Sesuai Jadwal',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Schedules (Jadwal Rute & Armada Pengantaran)
CREATE TABLE IF NOT EXISTS schedules (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	route_name VARCHAR(255) NOT NULL DEFAULT '',
	fleet_name VARCHAR(100) NOT NULL DEFAULT '',
	license_plate VARCHAR(50) NOT NULL DEFAULT '',
	driver_name VARCHAR(150) NOT NULL DEFAULT '',
	driver_phone VARCHAR(50) NOT NULL DEFAULT '',
	departure_time VARCHAR(50) NOT NULL DEFAULT '',
	arrival_eta VARCHAR(50) NOT NULL DEFAULT '',
	total_portions INT NOT NULL DEFAULT 0,
	status VARCHAR(50) NOT NULL DEFAULT 'on_time',
	target_schools JSONB NOT NULL DEFAULT '[]',
	telemetry JSONB NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Attendances (Rekonsiliasi Kehadiran Siswa & Porsi Tiba)
CREATE TABLE IF NOT EXISTS attendances (
	id VARCHAR(64) PRIMARY KEY,
	school_npsn VARCHAR(32) REFERENCES schools(npsn) ON DELETE CASCADE,
	date DATE NOT NULL DEFAULT CURRENT_DATE,
	registered_students INT NOT NULL DEFAULT 0,
	present_students INT NOT NULL DEFAULT 0,
	delivered_portions INT NOT NULL DEFAULT 0,
	consumed_portions INT NOT NULL DEFAULT 0,
	surplus_portions INT NOT NULL DEFAULT 0,
	surplus_status VARCHAR(64) NOT NULL DEFAULT 'available_for_redistribution',
	attendance_rate DOUBLE PRECISION NOT NULL DEFAULT 100,
	finish_rate DOUBLE PRECISION NOT NULL DEFAULT 100,
	reconciliation_status VARCHAR(64) NOT NULL DEFAULT 'surplus_safe',
	target_tomorrow_quota INT NOT NULL DEFAULT 0,
	notes TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Notices (Papan Pengumuman & Edaran Darurat Satgas MBG)
CREATE TABLE IF NOT EXISTS notices (
	id VARCHAR(64) PRIMARY KEY,
	ref_number VARCHAR(100) NOT NULL DEFAULT '',
	title VARCHAR(255) NOT NULL,
	category VARCHAR(50) NOT NULL DEFAULT 'circular',
	urgency VARCHAR(32) NOT NULL DEFAULT 'info',
	target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
	scope_region VARCHAR(150) NOT NULL DEFAULT 'Nasional',
	published_at VARCHAR(100) NOT NULL DEFAULT '',
	effective_date VARCHAR(100) NOT NULL DEFAULT '',
	author_name VARCHAR(150) NOT NULL DEFAULT '',
	author_role VARCHAR(150) NOT NULL DEFAULT '',
	content TEXT NOT NULL DEFAULT '',
	is_flash_alert BOOLEAN NOT NULL DEFAULT FALSE,
	requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
	attachments JSONB NOT NULL DEFAULT '[]',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Feedbacks (Pusat Aduan & Triage Insiden)
CREATE TABLE IF NOT EXISTS feedbacks (
	id VARCHAR(64) PRIMARY KEY,
	ticket_number VARCHAR(100) NOT NULL DEFAULT '',
	reported_at VARCHAR(100) NOT NULL DEFAULT '',
	school_npsn VARCHAR(32) REFERENCES schools(npsn) ON DELETE SET NULL,
	school_name VARCHAR(255) NOT NULL DEFAULT '',
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE SET NULL,
	batch_id VARCHAR(64) NOT NULL DEFAULT '',
	menu_package VARCHAR(255) NOT NULL DEFAULT '',
	severity VARCHAR(32) NOT NULL DEFAULT 'level3',
	anomaly_type VARCHAR(64) NOT NULL DEFAULT 'other',
	affected_portions INT NOT NULL DEFAULT 0,
	reporter_name VARCHAR(150) NOT NULL DEFAULT '',
	reporter_role VARCHAR(100) NOT NULL DEFAULT '',
	reporter_phone VARCHAR(50) NOT NULL DEFAULT '',
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	status VARCHAR(32) NOT NULL DEFAULT 'open',
	is_kill_switch_executed BOOLEAN NOT NULL DEFAULT FALSE,
	evidence_photos JSONB NOT NULL DEFAULT '[]',
	kill_switch_details JSONB NOT NULL DEFAULT '{}',
	medical_escalation JSONB NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Reports (Arsip Laporan BAST & Audit BGN)
CREATE TABLE IF NOT EXISTS reports (
	id VARCHAR(64) PRIMARY KEY,
	report_code VARCHAR(100) NOT NULL DEFAULT '',
	title VARCHAR(255) NOT NULL,
	period VARCHAR(100) NOT NULL DEFAULT '',
	category VARCHAR(100) NOT NULL DEFAULT '',
	author_name VARCHAR(150) NOT NULL DEFAULT '',
	status VARCHAR(50) NOT NULL DEFAULT 'verified',
	file_size VARCHAR(50) NOT NULL DEFAULT '',
	file_format VARCHAR(20) NOT NULL DEFAULT 'PDF',
	kpi_metrics JSONB NOT NULL DEFAULT '{}',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SPPG Billings (Klaim Invoice BAST ke BGN)
CREATE TABLE IF NOT EXISTS sppg_billings (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	invoice_number VARCHAR(100) NOT NULL UNIQUE,
	period_label VARCHAR(100) NOT NULL DEFAULT '',
	total_portions INT NOT NULL DEFAULT 0,
	rate_per_portion INT NOT NULL DEFAULT 15000,
	total_amount BIGINT NOT NULL DEFAULT 0,
	status VARCHAR(50) NOT NULL DEFAULT 'pending',
	due_date VARCHAR(50) NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. SPPG Incidents (Log Kendala Teknis Dapur)
CREATE TABLE IF NOT EXISTS sppg_incidents (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	title VARCHAR(255) NOT NULL,
	incident_type VARCHAR(100) NOT NULL DEFAULT '',
	severity VARCHAR(32) NOT NULL DEFAULT 'medium',
	occurred_at VARCHAR(100) NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	resolution TEXT NOT NULL DEFAULT '',
	status VARCHAR(32) NOT NULL DEFAULT 'resolved',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Validator Profiles (Kredensial & Audit Validator Sekolah)
CREATE TABLE IF NOT EXISTS validator_profiles (
	id VARCHAR(64) PRIMARY KEY,
	user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
	satgas_id VARCHAR(100) NOT NULL DEFAULT '',
	name VARCHAR(150) NOT NULL,
	nip VARCHAR(50) NOT NULL DEFAULT '',
	npsn VARCHAR(32) REFERENCES schools(npsn) ON DELETE CASCADE,
	role VARCHAR(100) NOT NULL DEFAULT '',
	device VARCHAR(100) NOT NULL DEFAULT '',
	device_id VARCHAR(100) NOT NULL DEFAULT '',
	certification VARCHAR(255) NOT NULL DEFAULT '',
	status VARCHAR(32) NOT NULL DEFAULT 'active',
	scans_today INT NOT NULL DEFAULT 0,
	quota_today INT NOT NULL DEFAULT 0,
	scan_logs JSONB NOT NULL DEFAULT '[]',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relasi dan Indeks Pendukung
CREATE INDEX IF NOT EXISTS idx_schools_sppg ON schools(sppg_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_school ON deliveries(school_npsn);
CREATE INDEX IF NOT EXISTS idx_deliveries_batch ON deliveries(batch_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_sppg ON deliveries(sppg_id);
CREATE INDEX IF NOT EXISTS idx_attendances_school ON attendances(school_npsn);
CREATE INDEX IF NOT EXISTS idx_feedbacks_school ON feedbacks(school_npsn);
CREATE INDEX IF NOT EXISTS idx_feedbacks_sppg ON feedbacks(sppg_id);
CREATE INDEX IF NOT EXISTS idx_schedules_sppg ON schedules(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_batches_sppg ON sppg_batches(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_billings_sppg ON sppg_billings(sppg_id);
CREATE INDEX IF NOT EXISTS idx_validator_profiles_npsn ON validator_profiles(npsn);
`

// MigrateExtended menjalankan migrasi untuk seluruh tabel ekosistem KawanGizi MBG.
func MigrateExtended(ctx context.Context) error {
	_, err := pool.Exec(ctx, extendedSchema)
	if err != nil {
		return fmt.Errorf("migrasi skema extended gagal: %w", err)
	}
	return nil
}
