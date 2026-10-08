-- =====================================================================
-- SEED SPPG LOGISTICS & FLEET MANAGEMENT
-- Clean & Multi-tenant data structure for /sppg/logistics
-- =====================================================================

CREATE TABLE IF NOT EXISTS sppg_fleets (
    id VARCHAR(64) PRIMARY KEY,
    sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
    plate VARCHAR(32) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_phone VARCHAR(50) NOT NULL DEFAULT '',
    emergency_phone VARCHAR(50) NOT NULL DEFAULT '',
    school_id VARCHAR(64) NOT NULL DEFAULT '',
    school_name VARCHAR(255) NOT NULL DEFAULT '',
    school_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    school_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    batch_token VARCHAR(120) NOT NULL DEFAULT '',
    box_count INT NOT NULL DEFAULT 0,
    distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    speed_kph INT NOT NULL DEFAULT 0,
    depart_at VARCHAR(20) NOT NULL DEFAULT '',
    progress DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'jalan',
    box_temp_c DOUBLE PRECISION NOT NULL DEFAULT 63.5,
    is_backup BOOLEAN NOT NULL DEFAULT FALSE,
    current_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    temp_series JSONB NOT NULL DEFAULT '[]',
    dispatched_at TIMESTAMPTZ,
    dispatched_by VARCHAR(150) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sppg_fleets_sppg ON sppg_fleets(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_fleets_status ON sppg_fleets(status);

CREATE TABLE IF NOT EXISTS sppg_delivery_notifications (
    id VARCHAR(64) PRIMARY KEY,
    sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
    fleet_id VARCHAR(64) NOT NULL REFERENCES sppg_fleets(id) ON DELETE CASCADE,
    school_id VARCHAR(64) NOT NULL DEFAULT '',
    school_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    sent_by VARCHAR(150) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sppg_deliv_notif_sppg ON sppg_delivery_notifications(sppg_id);

-- Bersihkan data lama jika re-seed
DELETE FROM sppg_delivery_notifications;
DELETE FROM sppg_fleets WHERE sppg_id IN ('SPPG-01', 'SPPG-02');

-- Seed Armada SPPG-01 (Menteng)
INSERT INTO sppg_fleets (
    id, sppg_id, plate, vehicle_type, driver_name, driver_phone, emergency_phone,
    school_id, school_name, school_lat, school_lng, batch_token, box_count,
    distance_km, speed_kph, depart_at, progress, status, box_temp_c, is_backup,
    temp_series
) VALUES
(
    'fl-01-sppg01', 'SPPG-01', 'B-9281-KBA', 'Mobil boks insulasi termal', 'Agus Santoso', '0812-9876-5431', '0811-2233-0001',
    'SCH-JKT-01', 'SDN 01 Menteng Pagi', -6.1882, 106.8291, 'MBG-2026-SPPG01-SDN01P-B01', 650,
    2.8, 28, '06:45', 0.62, 'jalan', 63.8, false,
    '[{"t":"06:45","temp":64.2},{"t":"06:50","temp":64.0},{"t":"06:55","temp":63.9},{"t":"07:00","temp":63.8}]'
),
(
    'fl-02-sppg01', 'SPPG-01', 'B-9412-UBC', 'Mobil boks insulasi termal', 'Bambang Irawan', '0812-9876-5432', '0811-2233-0002',
    'SCH-JKT-03', 'SDN Gondangdia 01', -6.1998, 106.8382, 'MBG-2026-SPPG01-SDN02-B01', 550,
    3.4, 8, '06:45', 0.30, 'macet', 62.4, false,
    '[{"t":"06:45","temp":64.1},{"t":"06:50","temp":63.5},{"t":"06:55","temp":62.9},{"t":"07:00","temp":62.4}]'
),
(
    'fl-03-sppg01', 'SPPG-01', 'B-9033-TKA', 'Mobil boks insulasi termal', 'Dedi Mulyadi', '0812-9876-5433', '0811-2233-0003',
    'sch-03', 'SMPN 3 Jakarta', -6.1755, 106.8452, 'MBG-2026-SPPG01-SMPN03-B02', 750,
    4.1, 32, '06:47', 0.55, 'jalan', 63.1, false,
    '[{"t":"06:47","temp":64.0},{"t":"06:52","temp":63.7},{"t":"06:57","temp":63.4},{"t":"07:02","temp":63.1}]'
),
(
    'fl-04-sppg01', 'SPPG-01', 'B-9102-PKM', 'Motor roda tiga boks termal', 'Eko Prasetyo', '0812-9876-5434', '0811-2233-0004',
    'sch-04', 'SDN Cikini 01', -6.1905, 106.8375, 'MBG-2026-SPPG01-SDN01C-B03', 120,
    4.8, 0, '06:45', 0.12, 'mogok', 61.2, false,
    '[{"t":"06:45","temp":63.9},{"t":"06:50","temp":63.0},{"t":"06:55","temp":62.1},{"t":"07:00","temp":61.2}]'
),
(
    'fl-backup-sppg01', 'SPPG-01', 'B-9777-CDG', 'Mobil boks insulasi termal cadangan', 'Hendra Gunawan', '0812-9876-5435', '0811-2233-0005',
    '', '', 0, 0, '', 0,
    0, 0, '', 0, 'siaga', 65.0, true,
    '[]'
);

-- Seed Armada SPPG-02 (Kebayoran Baru)
INSERT INTO sppg_fleets (
    id, sppg_id, plate, vehicle_type, driver_name, driver_phone, emergency_phone,
    school_id, school_name, school_lat, school_lng, batch_token, box_count,
    distance_km, speed_kph, depart_at, progress, status, box_temp_c, is_backup,
    temp_series
) VALUES
(
    'fl-01-sppg02', 'SPPG-02', 'B-8112-SLM', 'Mobil boks insulasi termal', 'Fajar Ramadhan', '0813-1122-3344', '0811-4455-6677',
    'SCH-005', 'SDN Melawai 01 Pagi', -6.2425, 106.7981, 'MBG-2026-SPPG02-SDN02-B01', 480,
    2.2, 26, '06:40', 0.80, 'jalan', 64.5, false,
    '[{"t":"06:40","temp":65.0},{"t":"06:45","temp":64.8},{"t":"06:50","temp":64.6},{"t":"06:55","temp":64.5}]'
),
(
    'fl-backup-sppg02', 'SPPG-02', 'B-8999-CAD', 'Mobil boks insulasi termal cadangan', 'Rian Hidayat', '0813-1122-3399', '0811-4455-6699',
    '', '', 0, 0, '', 0,
    0, 0, '', 0, 'siaga', 65.0, true,
    '[]'
);
