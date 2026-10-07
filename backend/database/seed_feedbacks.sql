-- ==============================================================================
-- SEED & SCHEMA EXTENSION FOR FEEDBACK & EMERGENCY KILL-SWITCH MODULE
-- ==============================================================================

-- 1. Extend feedbacks table with extra structured columns
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS school_address VARCHAR(255) DEFAULT '';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS sla_deadline VARCHAR(100) DEFAULT '';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS sla_remaining_minutes INT DEFAULT 120;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS investigation_status JSONB DEFAULT '{}';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT '';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS closed_at VARCHAR(100) DEFAULT '';
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS reporter_nip VARCHAR(50) DEFAULT '';

-- 2. Ensure referenced SPPGs exist
INSERT INTO sppg_kitchens (id, code, name, legal_entity, city, province)
VALUES
('SPPG-BDG-01', 'SPPG-BDG-01', 'SPPG Sentral Sukajadi Bandung', 'PT Boga Sehat Sejahtera', 'Kota Bandung', 'Jawa Barat'),
('SPPG-JKT-03', 'SPPG-JKT-03', 'SPPG Kebayoran Baru Sehat', 'PT Nutrisi Anak Nusantara', 'Kota Jakarta Selatan', 'DKI Jakarta'),
('SPPG-SBY-02', 'SPPG-SBY-02', 'SPPG Rungkut Makmur Surabaya', 'Koperasi Pangan Sehat Jawa Timur', 'Kota Surabaya', 'Jawa Timur'),
('SPPG-SMG-01', 'SPPG-SMG-01', 'SPPG Ungaran Berkah Gizi', 'CV Ungaran Kuliner Mandiri', 'Kabupaten Semarang', 'Jawa Tengah')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure referenced schools exist
INSERT INTO schools (npsn, id, name, level, city, district, address, sppg_id)
VALUES
('20219401', 'SCH-BDG-0928', 'SDN Sukajadi 01 Bandung', 'SD', 'Kota Bandung', 'Sukajadi', 'Jl. Sukajadi No. 120, Kota Bandung, Jawa Barat', 'SPPG-BDG-01'),
('20101904', 'SCH-JKT-1904', 'SMPN 19 Jakarta Selatan', 'SMP', 'Kota Jakarta Selatan', 'Kebayoran Baru', 'Jl. Bumi No. 21, Kebayoran Baru, Jakarta Selatan', 'SPPG-JKT-03'),
('20531203', 'SCH-SBY-1203', 'SDN Tegalsari 03 Surabaya', 'SD', 'Kota Surabaya', 'Tegalsari', 'Jl. Tegalsari No. 45, Kota Surabaya, Jawa Timur', 'SPPG-SBY-02'),
('20328905', 'SCH-SMG-8905', 'SDN Candisari 01 Semarang', 'SD', 'Kota Semarang', 'Candisari', 'Jl. Teuku Umar No. 88, Semarang, Jawa Tengah', 'SPPG-SMG-01')
ON CONFLICT (npsn) DO NOTHING;

-- 4. Create Emergency Health Centers table
CREATE TABLE IF NOT EXISTS emergency_health_centers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    distance_km VARCHAR(64) NOT NULL DEFAULT '',
    emergency_hotline VARCHAR(64) NOT NULL DEFAULT '',
    doctor_in_charge VARCHAR(150) NOT NULL DEFAULT '',
    ambulance_ready BOOLEAN NOT NULL DEFAULT TRUE,
    standby_team VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Emergency Health Centers
INSERT INTO emergency_health_centers (id, name, address, distance_km, emergency_hotline, doctor_in_charge, ambulance_ready, standby_team)
VALUES
('PUSK-BDG-01', 'Puskesmas Sukajadi Kota Bandung', 'Jl. Sukagalih No. 24, Sukajadi, Bandung', '1.2 km dari sekolah', '(022) 203-1188', 'dr. Nabila Hapsari', TRUE, 'Tim Reaksi Cepat KLB Gizi'),
('PUSK-JKT-03', 'Puskesmas Kebayoran Baru Jakarta Selatan', 'Jl. Barito II No. 15, Kebayoran Baru, Jakarta', '0.8 km dari sekolah', '(021) 722-4411', 'dr. Fajar Hidayat, Sp.A', TRUE, 'Satgas Siaga Medis Sekolah'),
('PUSK-SMG-01', 'Puskesmas Candisari Kota Semarang', 'Jl. Kagok No. 12, Candisari, Semarang', '1.5 km dari sekolah', '(024) 831-2299', 'dr. Agus Wijaya', TRUE, 'Unit Gawat Darurat Puskesmas'),
('PUSK-SBY-02', 'Puskesmas Tegalsari Kota Surabaya', 'Jl. Dinoyo No. 89, Tegalsari, Surabaya', '0.9 km dari sekolah', '(031) 567-9912', 'dr. Maya Kartika', TRUE, 'Tim Surveilans Pangan Dinkes')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    distance_km = EXCLUDED.distance_km,
    emergency_hotline = EXCLUDED.emergency_hotline,
    doctor_in_charge = EXCLUDED.doctor_in_charge,
    ambulance_ready = EXCLUDED.ambulance_ready,
    standby_team = EXCLUDED.standby_team;

-- 6. Seed Comprehensive Initial Feedback & Incident Tickets
INSERT INTO feedbacks (
    id, ticket_number, reported_at, school_npsn, school_name, school_address, sppg_id,
    batch_id, menu_package, severity, anomaly_type, affected_portions,
    reporter_name, reporter_role, reporter_phone, reporter_nip,
    title, description, evidence_photos, sla_deadline, sla_remaining_minutes,
    status, is_kill_switch_executed, kill_switch_details, medical_escalation, investigation_status,
    resolution_notes, closed_at, created_at
)
VALUES
(
    'TKT-2026-09-088',
    'INC/BGN/BDG/0928/01',
    '2026-09-28 07:12 WIB',
    '20219401',
    'SDN Sukajadi 01 Bandung',
    'Jl. Sukajadi No. 120, Kota Bandung, Jawa Barat',
    'SPPG-BDG-01',
    'BATCH-BDG-0928-02',
    'Paket F (Nasi Uduk Rolade Sapi & Orek Tempe)',
    'level1',
    'spoiled_food',
    420,
    'Dra. Hj. Siti Maryam',
    'Guru Validator Sekolah (Ketua Tim Gizi)',
    '0812-2291-8812',
    '197805121999032001',
    'Aroma Masam Menyengat & Lendir Halus pada Sayur Orek Tempe',
    'Saat guru validator membuka acak 5 boks sampel porsi sebelum dibagikan ke siswa kelas 1 & 2, tercium aroma masam pekat dan permukaan tempe sedikit berlendir. Suhu boks 48°C (di bawah standar 60°C). Pembagian ke siswa langsung ditahan.',
    '[{"id": "EV-1", "label": "Foto Sayur Berlendir", "confidenceAi": "94% YOLOv8 Anomaly Detection", "verified": true}]'::jsonb,
    '2026-09-28 09:12 WIB',
    48,
    'in_progress',
    true,
    '{"executedAt": "2026-09-28 07:25 WIB", "executedBy": "Bambang Soediro (Superadmin Satgas MBG)", "haltedSchoolsCount": 4, "haltedPortionsTotal": 1850, "haltedSchools": ["SDN Sukajadi 01 Bandung (420 porsi)", "SDN Sukajadi 03 Bandung (380 porsi)", "SMPN 2 Bandung (680 porsi)", "SMPN 9 Bandung (370 porsi)"]}'::jsonb,
    '{"escalated": true, "healthCenter": "Puskesmas Sukajadi Kota Bandung", "doctorInCharge": "dr. Nabila Hapsari", "doctorPhone": "0811-2391-4401", "dispatchStatus": "Tim Medis Bersiaga di Lokasi Sekolah"}'::jsonb,
    '{"assignedInspector": "dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)", "auditTime": "08:00 WIB", "focus": "Pemeriksaan sanitasi wajan penggorengan & uji mikrobiologi sampel tempe di Labkesda Jabar", "labSampleTaken": true}'::jsonb,
    '',
    '',
    '2026-09-28 07:12:00+07'
),
(
    'TKT-2026-09-089',
    'INC/BGN/JKT/0928/02',
    '2026-09-28 07:22 WIB',
    '20101904',
    'SMPN 19 Jakarta Selatan',
    'Jl. Bumi No. 21, Kebayoran Baru, Jakarta Selatan',
    'SPPG-JKT-03',
    'BATCH-JKT-0928-05',
    'Paket F (Nasi Uduk Rolade Sapi)',
    'level2',
    'portion_gramature',
    35,
    'H. Ahmad Fauzi, S.Si',
    'Guru Validator Sekolah',
    '0813-8821-9011',
    '198003112005011004',
    'Gramatur Rolade Sapi Hanya 45g (Standar Wajib 85g)',
    'Uji timbang acak pada 10 boks menunjukkan rolade daging hanya berukuran 45-50 gram, tidak sesuai standar spesifikasi 85 gram. Porsi karbohidrat dan buah lengkap dan aman.',
    '[{"id": "EV-2", "label": "Hasil Timbangan Digital Porsi", "confidenceAi": "100% Terverifikasi Timbangan", "verified": true}]'::jsonb,
    '2026-09-28 09:22 WIB',
    62,
    'in_progress',
    false,
    '{}'::jsonb,
    '{"escalated": false, "healthCenter": "Puskesmas Kebayoran Baru", "doctorInCharge": "", "doctorPhone": "", "dispatchStatus": "Tidak Diperlukan (Bukan Bahaya Medis)"}'::jsonb,
    '{"assignedInspector": "Korwil Logistik MBG Jakarta Selatan", "auditTime": "08:30 WIB", "focus": "Klaim pemotongan tagihan vendor sebesar 35 porsi dan surat teguran pemenuhan gramatur", "labSampleTaken": false}'::jsonb,
    'Vendor katering telah menyetujui pemotongan tagihan dan mengirimkan 35 porsi tambahan komplementer telur rebus.',
    '',
    '2026-09-28 07:22:00+07'
),
(
    'TKT-2026-09-090',
    'INC/BGN/SBY/0927/03',
    '2026-09-27 07:40 WIB',
    '20531203',
    'SDN Tegalsari 03 Surabaya',
    'Jl. Tegalsari No. 45, Kota Surabaya, Jawa Timur',
    'SPPG-SBY-02',
    'BATCH-SBY-0927-01',
    'Paket E (Nasi Liwet Telur Balado Kelor)',
    'level3',
    'taste_feedback',
    12,
    'Endang Wahyuni, M.Pd',
    'Kepala Sekolah & Penanggung Jawab MBG',
    '0812-9901-2291',
    '197509141998022003',
    'Siswa Kelas 1 Mengeluhkan Sayur Daun Kelor Agak Asin',
    'Secara umum makanan higienis dan habis dimakan, namun terdapat masukan dari 3 wali kelas bahwa kadar garam sayur agak tinggi untuk lidah siswa usia 7 tahun. Tutup boks nomor 1-12 juga agak keras dibuka siswa tanpa bantuan guru.',
    '[]'::jsonb,
    '2026-09-27 10:40 WIB',
    0,
    'resolved',
    false,
    '{}'::jsonb,
    '{"escalated": false, "healthCenter": "Puskesmas Tegalsari", "doctorInCharge": "", "doctorPhone": "", "dispatchStatus": "Tidak Ada Keluhan Sakit"}'::jsonb,
    '{"assignedInspector": "Nutrisionis Wilayah Surabaya", "auditTime": "2026-09-27 11:00 WIB", "focus": "Edukasi tim juru masak dapur SPPG untuk mengurangi 15% takaran garam pada masakan anak SD", "labSampleTaken": false}'::jsonb,
    'Dapur SPPG Rungkut Makmur telah menyesuaikan resep rendah garam untuk batch selanjutnya dan mengganti jenis perekat tutup wadah boks agar mudah dibuka anak.',
    '2026-09-27 13:15 WIB',
    '2026-09-27 07:40:00+07'
),
(
    'TKT-2026-09-091',
    'INC/BGN/SMG/0928/04',
    '2026-09-28 07:35 WIB',
    '20328905',
    'SDN Candisari 01 Semarang',
    'Jl. Teuku Umar No. 88, Semarang, Jawa Tengah',
    'SPPG-SMG-01',
    'BATCH-SMG-0928-09',
    'Paket F (Nasi Uduk Rolade Sapi)',
    'level1',
    'cold_chain_break',
    310,
    'Tri Lestari, S.Pd',
    'Guru Validator Sekolah',
    '0812-4401-8892',
    '198307222008012011',
    'Suhu Serah Terima 48.2°C Karena Mobil Mogok >45 Menit',
    'Armada pengantar tiba terlambat di sekolah pukul 07:35 WIB (jadwal maks 07:00 WIB). Pemeriksaan sensor termal inframerah mencatat suhu 48.2°C. Seluruh boks langsung ditolak validator dan diamankan di pos jaga agar tidak tersentuh siswa.',
    '[{"id": "EV-3", "label": "Foto Display Sensor Suhu 48.2°C", "confidenceAi": "Lolos Validasi Termal", "verified": true}]'::jsonb,
    '2026-09-28 09:35 WIB',
    72,
    'in_progress',
    true,
    '{"executedAt": "2026-09-28 07:42 WIB", "executedBy": "Bambang Soediro (Superadmin Satgas MBG)", "haltedSchoolsCount": 2, "haltedPortionsTotal": 650, "haltedSchools": ["SDN Candisari 01 Semarang (310 porsi)", "SMPN 5 Semarang (340 porsi)"]}'::jsonb,
    '{"escalated": true, "healthCenter": "Puskesmas Candisari Kota Semarang", "doctorInCharge": "dr. Agus Wijaya", "doctorPhone": "0811-9921-4403", "dispatchStatus": "Puskesmas Siaga (Zero Anak Terpapar)"}'::jsonb,
    '{"assignedInspector": "Inspektorat Logistik BGN Jateng", "auditTime": "08:15 WIB", "focus": "Pemeriksaan armada logistik pendingin & pemanggilan pimpinan vendor SPPG Ungaran", "labSampleTaken": true}'::jsonb,
    '',
    '',
    '2026-09-28 07:35:00+07'
)
ON CONFLICT (id) DO UPDATE SET
    ticket_number = EXCLUDED.ticket_number,
    reported_at = EXCLUDED.reported_at,
    school_name = EXCLUDED.school_name,
    school_address = EXCLUDED.school_address,
    sppg_id = EXCLUDED.sppg_id,
    batch_id = EXCLUDED.batch_id,
    menu_package = EXCLUDED.menu_package,
    severity = EXCLUDED.severity,
    anomaly_type = EXCLUDED.anomaly_type,
    affected_portions = EXCLUDED.affected_portions,
    reporter_name = EXCLUDED.reporter_name,
    reporter_role = EXCLUDED.reporter_role,
    reporter_phone = EXCLUDED.reporter_phone,
    reporter_nip = EXCLUDED.reporter_nip,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    evidence_photos = EXCLUDED.evidence_photos,
    sla_deadline = EXCLUDED.sla_deadline,
    sla_remaining_minutes = EXCLUDED.sla_remaining_minutes,
    status = EXCLUDED.status,
    is_kill_switch_executed = EXCLUDED.is_kill_switch_executed,
    kill_switch_details = EXCLUDED.kill_switch_details,
    medical_escalation = EXCLUDED.medical_escalation,
    investigation_status = EXCLUDED.investigation_status,
    resolution_notes = EXCLUDED.resolution_notes,
    closed_at = EXCLUDED.closed_at;
