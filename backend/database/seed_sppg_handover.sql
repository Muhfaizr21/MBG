-- Seed data Serah Terima BAST Digital & Safety Stock untuk SPPG

CREATE TABLE IF NOT EXISTS sppg_handovers (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	school_id VARCHAR(64) NOT NULL,
	school_npsn VARCHAR(32) NOT NULL,
	school_name VARCHAR(255) NOT NULL,
	batch_token VARCHAR(100) NOT NULL,
	sent INT NOT NULL DEFAULT 0,
	scanned INT NOT NULL DEFAULT 0,
	stage VARCHAR(32) NOT NULL DEFAULT 'menunggu',
	rejected JSONB NOT NULL DEFAULT '[]'::jsonb,
	courier_sign VARCHAR(150) NOT NULL DEFAULT '',
	teacher_sign VARCHAR(150) NOT NULL DEFAULT '',
	bast_no VARCHAR(100) NOT NULL DEFAULT '',
	bast_at VARCHAR(20) NOT NULL DEFAULT '',
	bast_hash VARCHAR(255) NOT NULL DEFAULT '',
	date DATE NOT NULL DEFAULT CURRENT_DATE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sppg_handover_settings (
	sppg_id VARCHAR(64) PRIMARY KEY REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	safety_stock INT NOT NULL DEFAULT 40,
	bast_seq INT NOT NULL DEFAULT 1,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Inisialisasi Settings Safety Stock & Sequence
INSERT INTO sppg_handover_settings (sppg_id, safety_stock, bast_seq, updated_at)
VALUES
('SPPG-01', 40, 2, NOW()),
('SPPG-02', 50, 2, NOW())
ON CONFLICT (sppg_id) DO UPDATE SET
    safety_stock = EXCLUDED.safety_stock,
    bast_seq = EXCLUDED.bast_seq,
    updated_at = NOW();

-- 2. Hapus data hari ini sebelum re-seed
DELETE FROM sppg_handovers WHERE sppg_id IN ('SPPG-01', 'SPPG-02') AND date = CURRENT_DATE;

-- 3. Seed data serah terima SPPG-01
INSERT INTO sppg_handovers (
    id, sppg_id, school_id, school_npsn, school_name, batch_token,
    sent, scanned, stage, rejected,
    courier_sign, teacher_sign, bast_no, bast_at, bast_hash, date
) VALUES
(
    'ho-01-sppg01', 'SPPG-01', 'SCH-JKT-01', '33.210.130', 'SDN 01 Menteng Pagi', 'MBG-2026-SPPG01-SDN01P-B01',
    650, 650, 'lolos', '[]'::jsonb,
    'Agus Santoso', 'Ahmad Fauzi, S.Pd', 'BAST/MBG/2026/0001', '07:18',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', CURRENT_DATE
),
(
    'ho-02-sppg01', 'SPPG-01', 'SCH-JKT-02', '20101455', 'SDN 02 Pegangsaan Timur', 'MBG-2026-SPPG01-SDN02-B01',
    510, 310, 'memindai', '[]'::jsonb,
    '', '', '', '', '', CURRENT_DATE
),
(
    'ho-03-sppg01', 'SPPG-01', 'SCH-JKT-03', '20101456', 'SMPN 3 Jakarta', 'MBG-2026-SPPG01-SMPN03-B02',
    750, 750, 'hold', '[{"boxes": 5, "reason": "Kemasan penyok, segel terbuka", "evidenceName": "tolak-segel-0755.jpg"}]'::jsonb,
    'Dedi Mulyadi', '', '', '', '', CURRENT_DATE
),
(
    'ho-04-sppg01', 'SPPG-01', 'SCH-JKT-04', '20101457', 'SDN Cikini 01', 'MBG-2026-SPPG01-SDN01C-B03',
    120, 0, 'menunggu', '[]'::jsonb,
    '', '', '', '', '', CURRENT_DATE
);

-- 4. Seed data serah terima SPPG-02
INSERT INTO sppg_handovers (
    id, sppg_id, school_id, school_npsn, school_name, batch_token,
    sent, scanned, stage, rejected,
    courier_sign, teacher_sign, bast_no, bast_at, bast_hash, date
) VALUES
(
    'ho-01-sppg02', 'SPPG-02', 'SCH-005', '20104433', 'SDN Melawai 01 Pagi', 'MBG-2026-SPPG02-SDN01M-B01',
    410, 410, 'lolos', '[]'::jsonb,
    'Joko Susilo', 'Budi Santoso, S.Pd', 'BAST/MBG/2026/0001', '07:15',
    'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2', CURRENT_DATE
),
(
    'ho-02-sppg02', 'SPPG-02', 'SCH-006', '20104434', 'SMPN 11 Jakarta Selatan', 'MBG-2026-SPPG02-SMPN11-B02',
    570, 120, 'memindai', '[]'::jsonb,
    '', '', '', '', '', CURRENT_DATE
);
