-- Seed Data untuk Modul Insiden & Respon Aduan SPPG (SPPG.md Bab 8)
-- Idempoten: Dibuat agar dapat dijalankan berulang kali tanpa duplikasi.

CREATE TABLE IF NOT EXISTS sppg_incident_tickets (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	school_id VARCHAR(64) NOT NULL DEFAULT '',
	school_name VARCHAR(255) NOT NULL,
	batch_token VARCHAR(100) NOT NULL,
	level INT NOT NULL DEFAULT 1,
	category VARCHAR(100) NOT NULL,
	message TEXT NOT NULL,
	created_at_clock VARCHAR(20) NOT NULL DEFAULT '07:00',
	status VARCHAR(32) NOT NULL DEFAULT 'baru',
	responses JSONB NOT NULL DEFAULT '[]'::jsonb,
	resolution TEXT NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_inc_tickets_sppg ON sppg_incident_tickets(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_inc_tickets_status ON sppg_incident_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sppg_inc_tickets_token ON sppg_incident_tickets(batch_token);

CREATE TABLE IF NOT EXISTS sppg_incident_recalls (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	batch_token VARCHAR(100) NOT NULL,
	reason TEXT NOT NULL DEFAULT '',
	recalled_by VARCHAR(150) NOT NULL DEFAULT '',
	recalled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	status VARCHAR(32) NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_sppg_inc_recalls_sppg ON sppg_incident_recalls(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_inc_recalls_token ON sppg_incident_recalls(batch_token);

CREATE TABLE IF NOT EXISTS sppg_handover_settings (
	sppg_id VARCHAR(64) PRIMARY KEY REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	safety_stock INT NOT NULL DEFAULT 40,
	bast_seq INT NOT NULL DEFAULT 1,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reset tiket dan karantina untuk SPPG-01 dan SPPG-02
DELETE FROM sppg_incident_recalls WHERE sppg_id IN ('SPPG-01', 'SPPG-02');
DELETE FROM sppg_incident_tickets WHERE sppg_id IN ('SPPG-01', 'SPPG-02');

-- Pastikan setting stok cadangan tersedia
INSERT INTO sppg_handover_settings (sppg_id, safety_stock, bast_seq, updated_at)
VALUES 
  ('SPPG-01', 40, 1, NOW()),
  ('SPPG-02', 50, 1, NOW())
ON CONFLICT (sppg_id) DO UPDATE 
SET safety_stock = EXCLUDED.safety_stock, updated_at = NOW();

-- Tiket Aduan SPPG-01
INSERT INTO sppg_incident_tickets (
  id, sppg_id, school_id, school_name, batch_token, level, category, message, created_at_clock, status, responses, resolution, created_at, updated_at
) VALUES
(
  'tkt-01-sppg01',
  'SPPG-01',
  'sch-03',
  'SMPN 3 Jakarta',
  'MBG-2026-SPPG01-SMPN03-B02',
  1,
  'Bau masam',
  'Lima boks tercium bau masam saat dibuka. Minta penarikan sebelum dibagikan.',
  '07:40',
  'baru',
  '[]'::jsonb,
  '',
  NOW() - INTERVAL '35 minutes',
  NOW() - INTERVAL '35 minutes'
),
(
  'tkt-02-sppg01',
  'SPPG-01',
  'sch-02',
  'SDN Pegangsaan 02',
  'MBG-2026-SPPG01-SDN02-B01',
  2,
  'Kemasan bocor',
  'Tiga boks kuah merembes di sudut. Isi masih panas dan segar.',
  '07:25',
  'ditangani',
  '[{"at": "07:38", "by": "Ahmad Fauzi (SPPG)", "text": "Sampel arsip batch dicek, suhu dan aroma normal. Tiga boks diganti dari stok cadangan."}]'::jsonb,
  '',
  NOW() - INTERVAL '50 minutes',
  NOW() - INTERVAL '37 minutes'
),
(
  'tkt-03-sppg01',
  'SPPG-01',
  'sch-01',
  'SDN Menteng 01 Pagi',
  'MBG-2026-SPPG01-SDN01P-B01',
  3,
  'Masukan rasa',
  'Sayur sedikit kurang garam menurut guru piket. Anak-anak tetap habis makan.',
  '07:55',
  'baru',
  '[]'::jsonb,
  '',
  NOW() - INTERVAL '20 minutes',
  NOW() - INTERVAL '20 minutes'
);

-- Tiket Aduan SPPG-02
INSERT INTO sppg_incident_tickets (
  id, sppg_id, school_id, school_name, batch_token, level, category, message, created_at_clock, status, responses, resolution, created_at, updated_at
) VALUES
(
  'tkt-01-sppg02',
  'SPPG-02',
  'sch-05',
  'SDN Kebon Sirih 01',
  'MBG-2026-SPPG02-KS01-B01',
  2,
  'Keterlambatan armada',
  'Mobil boks terlambat 15 menit akibat kemacetan. Makanan dicek suhu masih aman 63C.',
  '07:15',
  'ditangani',
  '[{"at": "07:20", "by": "Budi Santoso (SPPG 02)", "text": "Armada dipantau via telemetri GPS, supir telah tiba dan boks diserahterimakan."}]'::jsonb,
  '',
  NOW() - INTERVAL '60 minutes',
  NOW() - INTERVAL '55 minutes'
),
(
  'tkt-02-sppg02',
  'SPPG-02',
  'sch-06',
  'SMPN 1 Jakarta',
  'MBG-2026-SPPG02-SMPN01-B02',
  3,
  'Alergi khusus',
  'Siswa alergi telur telah menerima boks pengganti lauk tempe bacem secara aman.',
  '07:30',
  'selesai',
  '[{"at": "07:35", "by": "Budi Santoso (SPPG 02)", "text": "Boks diet khusus alergen telah diverifikasi oleh tim gizi."}]'::jsonb,
  'Telah terverifikasi porsi pengganti non-alergen diterima guru BK.',
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '40 minutes'
);
