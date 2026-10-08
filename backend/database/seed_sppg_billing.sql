-- Seed Data untuk Modul Klaim & Penagihan Invoice SPPG (SPPG.md Bab 9)
-- Idempoten: Dibuat agar dapat dijalankan berulang kali tanpa duplikasi.

CREATE TABLE IF NOT EXISTS sppg_invoices (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	invoice_no VARCHAR(100) NOT NULL,
	period_label VARCHAR(100) NOT NULL DEFAULT '',
	stage VARCHAR(32) NOT NULL DEFAULT 'draft',
	notes JSONB NOT NULL DEFAULT '[]'::jsonb,
	tax_slip VARCHAR(255) NOT NULL DEFAULT '',
	sp2d_number VARCHAR(100) NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_invoices_sppg ON sppg_invoices(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_invoices_stage ON sppg_invoices(stage);

CREATE TABLE IF NOT EXISTS sppg_billing_rows (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	school_id VARCHAR(64) NOT NULL DEFAULT '',
	school_name VARCHAR(255) NOT NULL,
	bast_no VARCHAR(100) NOT NULL DEFAULT '',
	batch_token VARCHAR(100) NOT NULL,
	valid_portions INT NOT NULL DEFAULT 0,
	late_minutes INT NOT NULL DEFAULT 0,
	invoice_id VARCHAR(64) REFERENCES sppg_invoices(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_billing_rows_sppg ON sppg_billing_rows(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_billing_rows_invoice ON sppg_billing_rows(invoice_id);

CREATE TABLE IF NOT EXISTS sppg_billing_settings (
	sppg_id VARCHAR(64) PRIMARY KEY REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	rate_per_portion INT NOT NULL DEFAULT 15000,
	late_tolerance_minutes INT NOT NULL DEFAULT 30,
	late_penalty_pct INT NOT NULL DEFAULT 5,
	inv_seq INT NOT NULL DEFAULT 2,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reset data billing untuk SPPG-01 dan SPPG-02
DELETE FROM sppg_billing_rows WHERE sppg_id IN ('SPPG-01', 'SPPG-02');
DELETE FROM sppg_invoices WHERE sppg_id IN ('SPPG-01', 'SPPG-02');

-- Inisialisasi Settings
INSERT INTO sppg_billing_settings (sppg_id, rate_per_portion, late_tolerance_minutes, late_penalty_pct, inv_seq, updated_at)
VALUES 
  ('SPPG-01', 15000, 30, 5, 2, NOW()),
  ('SPPG-02', 15000, 30, 5, 2, NOW())
ON CONFLICT (sppg_id) DO UPDATE 
SET rate_per_portion = EXCLUDED.rate_per_portion,
    late_tolerance_minutes = EXCLUDED.late_tolerance_minutes,
    late_penalty_pct = EXCLUDED.late_penalty_pct,
    inv_seq = EXCLUDED.inv_seq,
    updated_at = NOW();

-- Invoices SPPG-01
INSERT INTO sppg_invoices (id, sppg_id, invoice_no, period_label, stage, notes, tax_slip, sp2d_number, created_at, updated_at)
VALUES (
  'inv-01-sppg01',
  'SPPG-01',
  'INV/MBG/2026/0001',
  '29 September 2026',
  'verifikasi',
  '["nota-beras-gapoktan.pdf", "nota-ayam-rphu.pdf"]'::jsonb,
  '',
  '',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hours'
);

-- Billing Rows SPPG-01
INSERT INTO sppg_billing_rows (id, sppg_id, school_id, school_name, bast_no, batch_token, valid_portions, late_minutes, invoice_id, created_at, updated_at)
VALUES
(
  'bl-01-sppg01',
  'SPPG-01',
  'sch-01',
  'SDN Menteng 01 Pagi',
  'BAST/MBG/2026/0001',
  'MBG-2026-SPPG01-SDN01P-B01',
  650,
  3,
  'inv-01-sppg01',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
(
  'bl-02-sppg01',
  'SPPG-01',
  'sch-03',
  'SMPN 3 Jakarta',
  'BAST/MBG/2026/0002',
  'MBG-2026-SPPG01-SMPN03-B02',
  745,
  42,
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
(
  'bl-03-sppg01',
  'SPPG-01',
  'sch-02',
  'SDN Pegangsaan 02',
  '',
  'MBG-2026-SPPG01-SDN02-B01',
  310,
  0,
  NULL,
  NOW() - INTERVAL '1 hours',
  NOW() - INTERVAL '1 hours'
);

-- Invoices SPPG-02
INSERT INTO sppg_invoices (id, sppg_id, invoice_no, period_label, stage, notes, tax_slip, sp2d_number, created_at, updated_at)
VALUES (
  'inv-01-sppg02',
  'SPPG-02',
  'INV/MBG/2026/0001',
  '29 September 2026',
  'sp2d',
  '["faktur-telur-blitar.pdf", "nota-sayur-puncak.pdf"]'::jsonb,
  'BPN-PAJAK-2026-0929',
  'SP2D/KPPN/2026/9912',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '30 minutes'
);

-- Billing Rows SPPG-02
INSERT INTO sppg_billing_rows (id, sppg_id, school_id, school_name, bast_no, batch_token, valid_portions, late_minutes, invoice_id, created_at, updated_at)
VALUES
(
  'bl-01-sppg02',
  'SPPG-02',
  'sch-05',
  'SDN Kebon Sirih 01',
  'BAST/MBG/2026/0001',
  'MBG-2026-SPPG02-KS01-B01',
  480,
  0,
  'inv-01-sppg02',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
(
  'bl-02-sppg02',
  'SPPG-02',
  'sch-06',
  'SMPN 1 Jakarta',
  'BAST/MBG/2026/0002',
  'MBG-2026-SPPG02-SMPN01-B02',
  520,
  12,
  'inv-01-sppg02',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
);
