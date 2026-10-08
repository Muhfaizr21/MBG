-- Seed data Sekolah Binaan & Kuota Presensi untuk SPPG
-- Menjamin referensial data lengkap di tabel schools dan sppg_school_quotas

-- 1. Pastikan sekolah-sekolah terdaftar di tabel schools
INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('33.210.130', 'SCH-JKT-01', 'SDN 01 Menteng Pagi', 'SD kelas atas', 'active', 'Aktif Penuh', 'Jl. Menteng Raya No. 12, Jakarta Pusat', 'Jakarta Pusat', 'Menteng', -6.1882, 106.8291, 'Dra. Hj. Sri Wahyuni, M.Pd', '0812-3456-7801', 668, 'SPPG-01', '6 alergi kacang, 2 diet rendah gula')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('20101455', 'SCH-JKT-02', 'SDN 02 Pegangsaan Timur', 'SD kelas bawah', 'active', 'Aktif Penuh', 'Jl. Pegangsaan Timur No. 5, Jakarta Pusat', 'Jakarta Pusat', 'Menteng', -6.1998, 106.8382, 'Bapak Mulyadi, S.Pd', '0812-3456-7802', 590, 'SPPG-01', '4 alergi susu sapi')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('20101456', 'SCH-JKT-03', 'SMPN 3 Jakarta', 'SMP', 'active', 'Aktif Penuh', 'Jl. St. Senen Raya No. 30, Jakarta Pusat', 'Jakarta Pusat', 'Senen', -6.1755, 106.8452, 'Drs. H. Bambang Soeprapto', '0812-3456-7803', 771, 'SPPG-01', '9 alergi kacang, 3 vegetarian')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('20101457', 'SCH-JKT-04', 'SDN Cikini 01', 'SD kelas atas', 'active', 'Aktif Penuh', 'Jl. Cikini Raya No. 70, Jakarta Pusat', 'Jakarta Pusat', 'Menteng', -6.1905, 106.8375, 'Ibu Ratna Dewi, S.Pd', '0812-3456-7804', 558, 'SPPG-01', 'Bebas alergi')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

-- Untuk SPPG-02
INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('20104433', 'SCH-005', 'SDN Melawai 01 Pagi', 'SD kelas bawah', 'active', 'Aktif Penuh', 'Jl. Melawai X No. 5, Kebayoran Baru', 'Jakarta Selatan', 'Kebayoran Baru', -6.2445, 106.8012, 'Drs. H. Slamet Riyadi', '0813-8899-7701', 420, 'SPPG-02', '3 alergi telur')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

INSERT INTO schools (
    npsn, id, name, level, status, status_label, address, city, district, lat, lng,
    principal_name, principal_phone, total_students, sppg_id, dietary_notes
) VALUES
('20104434', 'SCH-006', 'SMPN 11 Jakarta Selatan', 'SMP', 'active', 'Aktif Penuh', 'Jl. Bumi No. 21, Kebayoran Baru', 'Jakarta Selatan', 'Kebayoran Baru', -6.2412, 106.7985, 'Dra. Endang Sulastri', '0813-8899-7702', 580, 'SPPG-02', '5 alergi seafood')
ON CONFLICT (npsn) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    address = EXCLUDED.address,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    sppg_id = EXCLUDED.sppg_id,
    principal_name = EXCLUDED.principal_name,
    total_students = EXCLUDED.total_students;

-- 2. Pastikan tabel sppg_school_quotas dibuat
CREATE TABLE IF NOT EXISTS sppg_school_quotas (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	school_id VARCHAR(64) NOT NULL,
	npsn VARCHAR(32) NOT NULL,
	school_name VARCHAR(255) NOT NULL,
	address TEXT NOT NULL DEFAULT '',
	level VARCHAR(64) NOT NULL DEFAULT 'SD',
	lat DOUBLE PRECISION NOT NULL DEFAULT 0,
	lng DOUBLE PRECISION NOT NULL DEFAULT 0,
	enrolled INT NOT NULL DEFAULT 0,
	present INT NOT NULL DEFAULT 0,
	reduce_special INT NOT NULL DEFAULT 0,
	absence_note TEXT NOT NULL DEFAULT '',
	present_updated_at VARCHAR(10) NOT NULL DEFAULT '',
	specials JSONB NOT NULL DEFAULT '[]'::jsonb,
	principal_name VARCHAR(150) NOT NULL DEFAULT '',
	validator_name VARCHAR(150) NOT NULL DEFAULT '',
	validator_phone VARCHAR(50) NOT NULL DEFAULT '',
	droppoint TEXT NOT NULL DEFAULT '',
	fleet_assigned VARCHAR(64) NOT NULL DEFAULT '',
	date DATE NOT NULL DEFAULT CURRENT_DATE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Hapus data hari ini sebelum re-seed
DELETE FROM sppg_school_quotas WHERE sppg_id IN ('SPPG-01', 'SPPG-02') AND date = CURRENT_DATE;

-- 4. Seed Quota Sekolah untuk SPPG-01
INSERT INTO sppg_school_quotas (
    id, sppg_id, school_id, npsn, school_name, address, level, lat, lng,
    enrolled, present, reduce_special, absence_note, present_updated_at,
    specials, principal_name, validator_name, validator_phone, droppoint, fleet_assigned, date
) VALUES
(
    'sq-01-sppg01', 'SPPG-01', 'SCH-JKT-01', '33.210.130', 'SDN 01 Menteng Pagi',
    'Jl. Menteng Raya No. 12, Jakarta Pusat', 'SD kelas atas', -6.1882, 106.8291,
    668, 650, 0, '18 siswa izin sakit dan dinas luar', '04:42',
    '[{"type": "Alergi kacang", "count": 6, "note": "Lauk diganti ayam tanpa bumbu kacang"}, {"type": "Diet rendah gula", "count": 2, "note": "Susu diganti air mineral"}]'::jsonb,
    'Dra. Hj. Sri Wahyuni, M.Pd', 'Ahmad Fauzi, S.Pd', '0812-3456-7801',
    'Gerbang belakang, ruang UKS lantai 1. Kurir lapor satpam pos 2.', 'B-9281-KBA', CURRENT_DATE
),
(
    'sq-02-sppg01', 'SPPG-01', 'SCH-JKT-02', '20101455', 'SDN 02 Pegangsaan Timur',
    'Jl. Pegangsaan Timur No. 5, Jakarta Pusat', 'SD kelas bawah', -6.1998, 106.8382,
    590, 550, 40, '40 siswa kelas 2 study tour ke Ragunan, porsi dikurangi agar tidak terbuang', '04:55',
    '[{"type": "Alergi susu sapi", "count": 4, "note": "Susu diganti sari kedelai"}]'::jsonb,
    'Bapak Mulyadi, S.Pd', 'Siti Nurhaliza, S.Pd', '0812-3456-7802',
    'Gerbang utama, aula serbaguna. Parkir armada di bahu jalan depan pos.', 'B-9412-UBC', CURRENT_DATE
),
(
    'sq-03-sppg01', 'SPPG-01', 'SCH-JKT-03', '20101456', 'SMPN 3 Jakarta',
    'Jl. St. Senen Raya No. 30, Jakarta Pusat', 'SMP', -6.1755, 106.8452,
    771, 750, 0, '21 siswa absen biasa', '05:12',
    '[{"type": "Alergi kacang", "count": 9, "note": "Lauk diganti ayam tanpa bumbu kacang"}, {"type": "Vegetarian", "count": 3, "note": "Ayam diganti tahu tempe ganda"}]'::jsonb,
    'Drs. H. Bambang Soeprapto', 'Rian Hidayat, M.Pd', '0812-3456-7803',
    'Gerbang samping kantin, meja serah terima lorong B.', 'B-9033-TKA', CURRENT_DATE
),
(
    'sq-04-sppg01', 'SPPG-01', 'SCH-JKT-04', '20101457', 'SDN Cikini 01',
    'Jl. Cikini Raya No. 70, Jakarta Pusat', 'SD kelas atas', -6.1905, 106.8375,
    558, 550, 0, '8 siswa izin', '',
    '[]'::jsonb,
    'Ibu Ratna Dewi, S.Pd', 'Dedi Kurniawan, S.Pd', '0812-3456-7804',
    'Gerbang belakang dekat masjid, ruang kelas 6A sebagai transit.', 'B-9102-PKM', CURRENT_DATE
);

-- 5. Seed Quota Sekolah untuk SPPG-02
INSERT INTO sppg_school_quotas (
    id, sppg_id, school_id, npsn, school_name, address, level, lat, lng,
    enrolled, present, reduce_special, absence_note, present_updated_at,
    specials, principal_name, validator_name, validator_phone, droppoint, fleet_assigned, date
) VALUES
(
    'sq-01-sppg02', 'SPPG-02', 'SCH-005', '20104433', 'SDN Melawai 01 Pagi',
    'Jl. Melawai X No. 5, Kebayoran Baru', 'SD kelas bawah', -6.2445, 106.8012,
    420, 410, 0, '10 siswa sakit flu', '04:38',
    '[{"type": "Alergi telur", "count": 3, "note": "Telur diganti tahu tempe"}]'::jsonb,
    'Drs. H. Slamet Riyadi', 'Budi Santoso, S.Pd', '0813-8899-7701',
    'Pintu gerbang timur samping pos satpam, meja serah terima beratap.', 'B-9811-UYT', CURRENT_DATE
),
(
    'sq-02-sppg02', 'SPPG-02', 'SCH-006', '20104434', 'SMPN 11 Jakarta Selatan',
    'Jl. Bumi No. 21, Kebayoran Baru', 'SMP', -6.2412, 106.7985,
    580, 570, 0, '10 siswa izin ekskul', '04:49',
    '[{"type": "Alergi seafood", "count": 5, "note": "Menu ikan diganti ayam fillet"}]'::jsonb,
    'Dra. Endang Sulastri', 'Maya Anggraini, S.Pd', '0813-8899-7702',
    'Lobi utama gedung B depan ruang kurikulum.', 'B-9822-XYZ', CURRENT_DATE
);
