-- Seed Data untuk Modul Sertifikasi & Sanitasi Dapur SPPG (SPPG.md Bab 10)
-- Idempoten: Dibuat agar dapat dijalankan berulang kali tanpa duplikasi data.

CREATE TABLE IF NOT EXISTS sppg_compliance_docs (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	issuer VARCHAR(255) NOT NULL DEFAULT '',
	number VARCHAR(100) NOT NULL DEFAULT '',
	expiry DATE NOT NULL,
	file_name VARCHAR(255) NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_docs_sppg ON sppg_compliance_docs(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_docs_expiry ON sppg_compliance_docs(expiry);

CREATE TABLE IF NOT EXISTS sppg_compliance_handlers (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	role VARCHAR(100) NOT NULL DEFAULT '',
	health_expiry DATE NOT NULL,
	health_file VARCHAR(255) NOT NULL DEFAULT '',
	trained BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_handlers_sppg ON sppg_compliance_handlers(sppg_id);

CREATE TABLE IF NOT EXISTS sppg_compliance_labs (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	test_date DATE NOT NULL DEFAULT CURRENT_DATE,
	kind VARCHAR(32) NOT NULL DEFAULT 'swab',
	target VARCHAR(255) NOT NULL,
	param VARCHAR(100) NOT NULL,
	value DOUBLE PRECISION NOT NULL DEFAULT 0,
	unit VARCHAR(50) NOT NULL DEFAULT 'koloni/cm2',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_labs_sppg ON sppg_compliance_labs(sppg_id);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_labs_date ON sppg_compliance_labs(test_date);

CREATE TABLE IF NOT EXISTS sppg_compliance_audits (
	id VARCHAR(64) PRIMARY KEY,
	sppg_id VARCHAR(64) NOT NULL REFERENCES sppg_kitchens(id) ON DELETE CASCADE,
	purpose VARCHAR(255) NOT NULL,
	preferred_date DATE NOT NULL,
	note TEXT NOT NULL DEFAULT '',
	status VARCHAR(50) NOT NULL DEFAULT 'Diajukan',
	filed_at VARCHAR(50) NOT NULL DEFAULT '28 Sept 2026',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sppg_compliance_audits_sppg ON sppg_compliance_audits(sppg_id);

-- Reset data compliance untuk SPPG-01 dan SPPG-02
DELETE FROM sppg_compliance_docs WHERE sppg_id IN ('SPPG-01', 'SPPG-02');
DELETE FROM sppg_compliance_handlers WHERE sppg_id IN ('SPPG-01', 'SPPG-02');
DELETE FROM sppg_compliance_labs WHERE sppg_id IN ('SPPG-01', 'SPPG-02');
DELETE FROM sppg_compliance_audits WHERE sppg_id IN ('SPPG-01', 'SPPG-02');

-- 1. Dokumen Akreditasi SPPG-01
INSERT INTO sppg_compliance_docs (id, sppg_id, name, issuer, number, expiry, file_name, created_at, updated_at)
VALUES
(
  'doc-01-sppg01',
  'SPPG-01',
  'Sertifikat Laik Higiene Sanitasi',
  'Dinkes DKI Jakarta',
  'SLHS-DKI/2026/0491-BGN',
  '2027-03-14',
  'slhs-2026.pdf',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),
(
  'doc-02-sppg01',
  'SPPG-01',
  'Sertifikat Halal',
  'BPJPH Kemenag',
  'ID31110008492010926',
  '2026-11-20',
  'halal-2024.pdf',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),
(
  'doc-03-sppg01',
  'SPPG-01',
  'Nomor Kontrol Veteriner RPHU',
  'Dinas KPKP DKI',
  'NKV RPHU-3171-004',
  '2027-01-05',
  'nkv-rphu.pdf',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- 2. Staf Penjamah Makanan SPPG-01
INSERT INTO sppg_compliance_handlers (id, sppg_id, name, role, health_expiry, health_file, trained, created_at, updated_at)
VALUES
(
  'fh-01-sppg01',
  'SPPG-01',
  'Chef Bambang Sutrisno',
  'Kepala dapur',
  '2026-12-01',
  'sehat-ka-dapur.pdf',
  true,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'fh-02-sppg01',
  'SPPG-01',
  'Siti Rahmawati',
  'Asisten masak',
  '2026-10-09',
  'sehat-asisten.pdf',
  true,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'fh-03-sppg01',
  'SPPG-01',
  'Dedi Irawan',
  'Petugas kemas',
  '2027-02-15',
  'sehat-kemas.pdf',
  false,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);

-- 3. Riwayat Uji Lab SPPG-01
INSERT INTO sppg_compliance_labs (id, sppg_id, test_date, kind, target, param, value, unit, created_at)
VALUES
(
  'lab-01-sppg01',
  'SPPG-01',
  '2026-09-22',
  'swab',
  'Talenan sayur',
  'Angka kuman (ALT)',
  0,
  'koloni/cm2',
  NOW() - INTERVAL '7 days'
),
(
  'lab-02-sppg01',
  'SPPG-01',
  '2026-09-22',
  'swab',
  'Pisau daging',
  'E. coli',
  0,
  'koloni/cm2',
  NOW() - INTERVAL '7 days'
),
(
  'lab-03-sppg01',
  'SPPG-01',
  '2026-09-15',
  'air',
  'Kran pencuci bahan',
  'E. coli air',
  0,
  'APM/100ml',
  NOW() - INTERVAL '14 days'
),
(
  'lab-04-sppg01',
  'SPPG-01',
  '2026-09-15',
  'air',
  'Kran pencuci bahan',
  'Kekeruhan',
  2.1,
  'NTU',
  NOW() - INTERVAL '14 days'
);

-- 4. Permohonan Audit Dinkes SPPG-01
INSERT INTO sppg_compliance_audits (id, sppg_id, purpose, preferred_date, note, status, filed_at, created_at)
VALUES
(
  'aud-01-sppg01',
  'SPPG-01',
  'Inspeksi berkala triwulan III',
  '2026-10-14',
  'Verifikasi ulang SLHS sebelum Halal habis November.',
  'Diajukan',
  '28 Sept 2026',
  NOW() - INTERVAL '10 days'
);

-- Dokumen Akreditasi SPPG-02
INSERT INTO sppg_compliance_docs (id, sppg_id, name, issuer, number, expiry, file_name, created_at, updated_at)
VALUES
(
  'doc-01-sppg02',
  'SPPG-02',
  'Sertifikat Laik Higiene Sanitasi',
  'Dinkes Kota Jakarta Selatan',
  'SLHS-JS/2026/0122-BGN',
  '2027-05-18',
  'slhs-sppg02.pdf',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),
(
  'doc-02-sppg02',
  'SPPG-02',
  'Sertifikat Halal',
  'BPJPH Kemenag',
  'ID31110009988220199',
  '2027-08-30',
  'halal-sppg02.pdf',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
),
(
  'doc-03-sppg02',
  'SPPG-02',
  'Nomor Kontrol Veteriner RPHU',
  'Dinas KPKP DKI',
  'NKV RPHU-3174-009',
  '2027-04-10',
  'nkv-sppg02.pdf',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
);

-- Staf Penjamah Makanan SPPG-02
INSERT INTO sppg_compliance_handlers (id, sppg_id, name, role, health_expiry, health_file, trained, created_at, updated_at)
VALUES
(
  'fh-01-sppg02',
  'SPPG-02',
  'Chef Hendra Gunawan',
  'Kepala dapur',
  '2027-01-20',
  'sehat-hendra.pdf',
  true,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
),
(
  'fh-02-sppg02',
  'SPPG-02',
  'Dewi Lestari',
  'Asisten masak',
  '2027-03-11',
  'sehat-dewi.pdf',
  true,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
);

-- Riwayat Uji Lab SPPG-02
INSERT INTO sppg_compliance_labs (id, sppg_id, test_date, kind, target, param, value, unit, created_at)
VALUES
(
  'lab-01-sppg02',
  'SPPG-02',
  '2026-09-25',
  'swab',
  'Wadah saji stainless',
  'E. coli',
  0,
  'koloni/cm2',
  NOW() - INTERVAL '4 days'
),
(
  'lab-02-sppg02',
  'SPPG-02',
  '2026-09-25',
  'air',
  'Filtrasi reverse osmosis',
  'Kekeruhan',
  0.8,
  'NTU',
  NOW() - INTERVAL '4 days'
);

-- Permohonan Audit SPPG-02
INSERT INTO sppg_compliance_audits (id, sppg_id, purpose, preferred_date, note, status, filed_at, created_at)
VALUES
(
  'aud-01-sppg02',
  'SPPG-02',
  'Audit sertifikasi penambahan kapasitas dapur',
  '2026-11-05',
  'Perluasan area pemotongan daging unggas',
  'Terjadwal',
  '25 Sept 2026',
  NOW() - INTERVAL '4 days'
);
