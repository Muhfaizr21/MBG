-- Seed Data untuk Katalog Laporan Resmi, BAST Digital & Audit Forensik MBG

-- 1. Katalog Laporan Resmi (Official Reports)
INSERT INTO reports (
    id, report_code, title, period, category, author_name, status,
    file_size, file_format, kpi_metrics, scope, total_portions, success_rate,
    file_formats, file_size_pdf, file_size_xlsx, file_size_csv, description, signee, audit_badge, created_at
) VALUES
(
    'REP-BGN-2026-091', 'DLR-NAS-0926', 'Laporan Rekapitulasi Harian Distribusi MBG Nasional', '28 September 2026', 'distribution', 'Satgas MBG Pusat', 'verified',
    '3.4 MB', 'PDF', '{"portions": 251400, "successRate": 99.4}'::jsonb, '38 Provinsi (514 Kab/Kota)', 251400, 99.4,
    '["PDF", "XLSX", "CSV"]'::jsonb, '3.4 MB', '1.8 MB', '620 KB',
    'Rekapitulasi lengkap jumlah porsi yang sukses dikirim dari 180 Dapur SPPG dan dikonsumsi siswa di 1.250 sekolah binaan.',
    'Satgas MBG Pusat & Direktorat Logistik Pangan BGN', 'BPK Ready', NOW() - INTERVAL '10 days'
),
(
    'REP-BGN-2026-092', 'AKG-AUD-0926', 'Laporan Audit Kepatuhan Gizi & Standar AKG Kemenkes', 'September 2026 (Siklus 10-Hari)', 'nutrition', 'dr. Dian Lestari, Sp.GK', 'verified',
    '4.2 MB', 'PDF', '{"portions": 2514000, "successRate": 98.9}'::jsonb, 'Nasional (Sampel Laboratorium & AI)', 2514000, 98.9,
    '["PDF", "XLSX"]'::jsonb, '4.2 MB', '2.1 MB', '850 KB',
    'Hasil audit kepatuhan kalori (rata-rata 575 kkal), protein hewani/nabati (28.2g), kalsium, zat besi Fe, dan batas toleransi natrium.',
    'dr. Dian Lestari, Sp.GK (Direktorat Standarisasi Gizi BGN)', 'Kemenkes Certified', NOW() - INTERVAL '9 days'
),
(
    'REP-BGN-2026-093', 'LOG-INC-0926', 'Laporan Insiden Logistik, Rantai Dingin & Food Safety', '21 - 28 September 2026', 'incidents', 'Inspektorat Jenderal Pengawasan BGN', 'verified',
    '2.8 MB', 'PDF', '{"portions": 1759800, "successRate": 99.8}'::jsonb, 'Seluruh Armada Pengangkut & Dapur SPPG', 1759800, 99.8,
    '["PDF", "CSV"]'::jsonb, '2.8 MB', '1.2 MB', '410 KB',
    'Log telemetri suhu termal saat serah terima, riwayat boks makanan ditolak AI YOLOv8 (anomali bau/lendir), dan penanganan insiden.',
    'Inspektorat Jenderal Pengawasan Pangan BGN', 'Audit Internal', NOW() - INTERVAL '8 days'
),
(
    'REP-BGN-2026-094', 'FIN-CLR-0926', 'Laporan Rekonsiliasi Realisasi Porsi vs Pembayaran Vendor', 'Termin I (1 - 15 September 2026)', 'financial', 'Pejabat Pembuat Komitmen (PPK)', 'verified',
    '5.1 MB', 'PDF', '{"portions": 3720000, "successRate": 100.0}'::jsonb, '180 Vendor Katering & SPPG Sentral', 3720000, 100.0,
    '["PDF", "XLSX", "CSV"]'::jsonb, '5.1 MB', '3.6 MB', '1.4 MB',
    'Kompilasi tagihan katering yang telah melalui pencocokan forensik dengan BAST digital dan pemindaian QR unik AI validator.',
    'Pejabat Pembuat Komitmen (PPK) Satgas MBG & Kemenkeu RI', 'BPKP Verified', NOW() - INTERVAL '7 days'
),
(
    'REP-BGN-2026-095', 'DAP-REC-0926', 'Laporan Rekonsiliasi Presensi Siswa Dapodik vs Porsi Tiba', 'September 2026', 'attendance', 'Pusdatin Kemendikbudristek', 'verified',
    '3.9 MB', 'PDF', '{"portions": 248900, "successRate": 99.1}'::jsonb, '1.250 Sekolah Sasaran (SD & SMP)', 248900, 99.1,
    '["PDF", "XLSX"]'::jsonb, '3.9 MB', '2.4 MB', '780 KB',
    'Analisis gap antara presensi fisik siswa di kelas dengan alokasi porsi yang dikirim, mitigasi kelebihan porsi, dan pemanfaatan porsi sisa aman.',
    'Pusdatin Kemendikbudristek & Satgas MBG', 'Dapodik Sinkron', NOW() - INTERVAL '6 days'
)
ON CONFLICT (id) DO UPDATE SET
    report_code = EXCLUDED.report_code,
    title = EXCLUDED.title,
    period = EXCLUDED.period,
    category = EXCLUDED.category,
    author_name = EXCLUDED.author_name,
    status = EXCLUDED.status,
    file_size = EXCLUDED.file_size,
    file_format = EXCLUDED.file_format,
    kpi_metrics = EXCLUDED.kpi_metrics,
    scope = EXCLUDED.scope,
    total_portions = EXCLUDED.total_portions,
    success_rate = EXCLUDED.success_rate,
    file_formats = EXCLUDED.file_formats,
    file_size_pdf = EXCLUDED.file_size_pdf,
    file_size_xlsx = EXCLUDED.file_size_xlsx,
    file_size_csv = EXCLUDED.file_size_csv,
    description = EXCLUDED.description,
    signee = EXCLUDED.signee,
    audit_badge = EXCLUDED.audit_badge;

-- 2. Berkas Berita Acara Serah Terima Digital (Digital BAST)
INSERT INTO digital_basts (
    id, ref_number, date, delivery_time, school_name, npsn, sppg_name, sppg_id,
    menu_package, ordered_portions, verified_ai_portions, rejected_portions, thermal_temp_arrive,
    lead_validator, driver_name, sha256_hash, qr_token_verified, bsre_status,
    payment_clearance_status, payment_clearance_label, subtotal_amount, approval_notes
) VALUES
(
    'BAST-2026-09-001', 'BAST/MBG-BGN/BDG/0928/01', '2026-09-28', '06:55 WIB', 'SDN Sukajadi 01 Bandung', '20219401', 'SPPG Sentral Sukajadi Bandung', 'SPPG-BDG-01',
    'Paket F (Nasi Uduk Rolade Sapi)', 420, 420, 0, '64.5°C (Aman)',
    'Dra. Hj. Siti Maryam (NIP. 197805121999032001)', 'Asep Saepudin (Armada Logistik #03)', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', true, 'Simulasi: stempel tidak diverifikasi',
    'cleared', 'Disetujui Cair (100% Valid)', 6258000,
    'Seluruh porsi lolos pemindaian kamera YOLOv8 tanpa kontaminasi. Suhu tiba prima di atas batas aman 60°C.'
),
(
    'BAST-2026-09-002', 'BAST/MBG-BGN/BDG/0928/02', '2026-09-28', '07:05 WIB', 'SMPN 2 Bandung', '20219502', 'SPPG Sentral Sukajadi Bandung', 'SPPG-BDG-01',
    'Paket F (Nasi Uduk Rolade Sapi)', 680, 676, 4, '63.2°C (Aman)',
    'Budi Santoso, S.Pd (NIP. 198204152006041008)', 'Dedi Kurniawan (Armada Logistik #05)', 'a7c189b2756d1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c912', true, 'Simulasi: stempel tidak diverifikasi',
    'adjusted', 'Disetujui dengan Pemotongan (4 Porsi Rusak)', 10072400,
    'Terdapat 4 boks makanan tertekan rusak kemasannya di mobil boks pendingin. Otomatis dipotong dari klaim tagihan vendor.'
),
(
    'BAST-2026-09-003', 'BAST/MBG-BGN/SBY/0928/03', '2026-09-28', '07:10 WIB', 'SDN Tegalsari 03 Surabaya', '20531203', 'SPPG Rungkut Makmur Surabaya', 'SPPG-SBY-02',
    'Paket F (Nasi Uduk Rolade Sapi)', 390, 390, 0, '65.8°C (Aman)',
    'Endang Wahyuni, M.Pd (NIP. 197509141998022003)', 'Slamet Riyadi (Armada Logistik #09)', 'f4d298b1856d1c149afbf4c8996fb92427ae41e4649b934ca495991b7852a441', true, 'Simulasi: stempel tidak diverifikasi',
    'cleared', 'Disetujui Cair (100% Valid)', 5811000,
    'Kualitas pengemasan sangat rapi, token QR valid, tidak ada temuan anomali.'
),
(
    'BAST-2026-09-004', 'BAST/MBG-BGN/JKT/0928/04', '2026-09-28', '07:18 WIB', 'SMPN 19 Jakarta Selatan', '20101904', 'SPPG Kebayoran Baru Sehat', 'SPPG-JKT-03',
    'Paket F (Nasi Uduk Rolade Sapi)', 750, 742, 8, '61.8°C (Aman)',
    'H. Ahmad Fauzi, S.Si (NIP. 198003112005011004)', 'Wahyu Hidayat (Armada Logistik #02)', 'c9b389a4456d1c149afbf4c8996fb92427ae41e4649b934ca495991b7852f883', true, 'Simulasi: stempel tidak diverifikasi',
    'adjusted', 'Disetujui dengan Pemotongan (8 Porsi Ditolak)', 11055800,
    '8 boks terdeteksi aroma masam pada sayur buncis oleh validator saat unboxing acak. AI memvalidasi status reject.'
),
(
    'BAST-2026-09-005', 'BAST/MBG-BGN/SMG/0928/05', '2026-09-28', '07:35 WIB', 'SDN Candisari 01 Semarang', '20328905', 'SPPG Ungaran Berkah Gizi', 'SPPG-SMG-01',
    'Paket F (Nasi Uduk Rolade Sapi)', 310, 0, 310, '48.2°C (BAHAYA - Cold Chain Pecah)',
    'Tri Lestari, S.Pd (NIP. 198307222008012011)', 'Bambang Supriyadi (Armada Logistik #07)', 'b5e199d3256d1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e119', false, 'Ditolak: BAST belum terbit',
    'blocked', 'DIBLOKIR TOTAL (Kena Sanksi & Denda)', 0,
    'Suhu tiba jatuh di bawah 50°C karena keterlambatan armada >45 menit akibat mogok. Seluruh batch ditolak sekolah demi keselamatan anak.'
)
ON CONFLICT (id) DO UPDATE SET
    ref_number = EXCLUDED.ref_number,
    date = EXCLUDED.date,
    delivery_time = EXCLUDED.delivery_time,
    school_name = EXCLUDED.school_name,
    npsn = EXCLUDED.npsn,
    sppg_name = EXCLUDED.sppg_name,
    sppg_id = EXCLUDED.sppg_id,
    menu_package = EXCLUDED.menu_package,
    ordered_portions = EXCLUDED.ordered_portions,
    verified_ai_portions = EXCLUDED.verified_ai_portions,
    rejected_portions = EXCLUDED.rejected_portions,
    thermal_temp_arrive = EXCLUDED.thermal_temp_arrive,
    lead_validator = EXCLUDED.lead_validator,
    driver_name = EXCLUDED.driver_name,
    sha256_hash = EXCLUDED.sha256_hash,
    qr_token_verified = EXCLUDED.qr_token_verified,
    bsre_status = EXCLUDED.bsre_status,
    payment_clearance_status = EXCLUDED.payment_clearance_status,
    payment_clearance_label = EXCLUDED.payment_clearance_label,
    subtotal_amount = EXCLUDED.subtotal_amount,
    approval_notes = EXCLUDED.approval_notes;

-- 3. Rekapitulasi Tagihan Katering & Payment Clearance (Vendor Invoices)
INSERT INTO vendor_invoices (
    id, invoice_number, sppg_name, sppg_id, vendor_company, bank_account, period,
    total_claimed_portions, total_claimed_amount, verified_bast_portions, rejected_deduction_portions,
    penalty_deduction_amount, approved_payment_amount, bast_completeness_rate, status, status_label,
    sp2d_number, notes, signed_at, signed_by
) VALUES
(
    'INV-2026-IX-01', 'INV/SPPG-BDG01/IX/2026', 'SPPG Sentral Sukajadi Bandung', 'SPPG-BDG-01', 'PT Boga Sehat Sejahtera Mitra BGN',
    'Bank Mandiri (Persero) Tbk - Rek: 131-00-9821832-1', '21 - 28 September 2026',
    35000, 521500000, 34972, 28, 417200, 521082800, 100.0, 'ready_to_sign', 'Siap Otorisasi Superadmin',
    NULL, '', NULL, NULL
),
(
    'INV-2026-IX-02', 'INV/SPPG-SBY02/IX/2026', 'SPPG Rungkut Makmur Surabaya', 'SPPG-SBY-02', 'Koperasi Pangan Sehat Jawa Timur',
    'Bank Jatim Tbk - Rek: 011-20-449102-3', '21 - 28 September 2026',
    42000, 625800000, 42000, 0, 0, 625800000, 100.0, 'approved_cleared', 'Telah Ditandatangani (SP2D Terbit)',
    'SP2D/BGN-KEMENKEU/2026/09/8821', 'Klaim disetujui penuh berdasarkan BAST digital 100% lolos AI.', '2026-09-28 09:15 WIB', 'Bambang Soediro (Superadmin Satgas MBG)'
),
(
    'INV-2026-IX-03', 'INV/SPPG-JKT03/IX/2026', 'SPPG Kebayoran Baru Sehat', 'SPPG-JKT-03', 'PT Nutrisi Anak Nusantara',
    'Bank DKI - Rek: 301-12-882190-8', '21 - 28 September 2026',
    50000, 745000000, 49880, 120, 1788000, 743212000, 100.0, 'ready_to_sign', 'Siap Otorisasi Superadmin',
    NULL, '', NULL, NULL
),
(
    'INV-2026-IX-04', 'INV/SPPG-SMG01/IX/2026', 'SPPG Ungaran Berkah Gizi', 'SPPG-SMG-01', 'CV Ungaran Kuliner Mandiri',
    'Bank Jateng - Rek: 201-44-102938-4', '21 - 28 September 2026',
    28000, 417200000, 25890, 2110, 31439000, 385761000, 88.5, 'under_forensic_audit', 'Tertahan Audit Forensik (Ada Klaim Basi)',
    NULL, '', NULL, NULL
)
ON CONFLICT (id) DO UPDATE SET
    invoice_number = EXCLUDED.invoice_number,
    sppg_name = EXCLUDED.sppg_name,
    sppg_id = EXCLUDED.sppg_id,
    vendor_company = EXCLUDED.vendor_company,
    bank_account = EXCLUDED.bank_account,
    period = EXCLUDED.period,
    total_claimed_portions = EXCLUDED.total_claimed_portions,
    total_claimed_amount = EXCLUDED.total_claimed_amount,
    verified_bast_portions = EXCLUDED.verified_bast_portions,
    rejected_deduction_portions = EXCLUDED.rejected_deduction_portions,
    penalty_deduction_amount = EXCLUDED.penalty_deduction_amount,
    approved_payment_amount = EXCLUDED.approved_payment_amount,
    bast_completeness_rate = EXCLUDED.bast_completeness_rate,
    status = EXCLUDED.status,
    status_label = EXCLUDED.status_label,
    sp2d_number = EXCLUDED.sp2d_number,
    notes = EXCLUDED.notes,
    signed_at = EXCLUDED.signed_at,
    signed_by = EXCLUDED.signed_by;

-- 4. Temuan Audit Forensik Anggaran (Forensic Audit Findings)
INSERT INTO forensic_audit_findings (
    id, invoice_ref, sppg_name, date_logged, finding_type, finding_type_label,
    claimed_portions, ai_valid_portions, discrepancy_count, potential_loss_amount,
    severity, severity_label, explanation, action_taken, status, status_label
) VALUES
(
    'FAD-2026-001', 'INV/SPPG-SMG01/IX/2026', 'SPPG Ungaran Berkah Gizi (Semarang)', '2026-09-28 08:45 WIB',
    'unverified_batch_claim', 'Klaim Porsi Basi / Ditolak Validator',
    310, 0, 310, 4619000, 'critical', 'Kritis (Potensi Kerugian Negara Dicegah)',
    'Vendor menagihkan 310 porsi untuk SDN Candisari 01, padahal validator menolak seluruh kiriman karena suhu tiba 48.2°C dan makanan berlendir.',
    'Tagihan otomatis dipotong 100% (Rp 4.619.000) dan vendor dikenakan sanksi Peringatan Pertama (SP-1).',
    'safeguarded', 'Anggaran Terselamatkan'
),
(
    'FAD-2026-002', 'INV/SPPG-JKT03/IX/2026', 'SPPG Kebayoran Baru Sehat (Jakarta)', '2026-09-27 15:20 WIB',
    'duplicate_scan_attempt', 'Percobaan Pindai Ganda QR Token',
    12, 0, 12, 178800, 'warning', 'Peringatan (Duplikasi Terdeteksi AI)',
    'Sistem kriptografis mendeteksi 12 token QR boks porsi yang telah dipindai di sekolah A dicoba dipindai ulang di sekolah B.',
    'Token QR ganda langsung di-blacklist oleh sistem server backend.',
    'safeguarded', 'Anggaran Terselamatkan'
),
(
    'FAD-2026-003', 'INV/SPPG-BDG01/IX/2026', 'SPPG Sentral Sukajadi Bandung', '2026-09-26 14:10 WIB',
    'packaging_damage_deduction', 'Potongan Porsi Rusak Pengemasan',
    28, 0, 28, 417200, 'info', 'Normal (Potongan Standar Mutu)',
    '28 boks makanan pecah penutup wadah dan sayuran tumpah di dalam armada pengantar.',
    'Dipotong dari tagihan termin katering secara transparan dan disetujui vendor.',
    'safeguarded', 'Dipotong Proporsional'
)
ON CONFLICT (id) DO UPDATE SET
    invoice_ref = EXCLUDED.invoice_ref,
    sppg_name = EXCLUDED.sppg_name,
    date_logged = EXCLUDED.date_logged,
    finding_type = EXCLUDED.finding_type,
    finding_type_label = EXCLUDED.finding_type_label,
    claimed_portions = EXCLUDED.claimed_portions,
    ai_valid_portions = EXCLUDED.ai_valid_portions,
    discrepancy_count = EXCLUDED.discrepancy_count,
    potential_loss_amount = EXCLUDED.potential_loss_amount,
    severity = EXCLUDED.severity,
    severity_label = EXCLUDED.severity_label,
    explanation = EXCLUDED.explanation,
    action_taken = EXCLUDED.action_taken,
    status = EXCLUDED.status,
    status_label = EXCLUDED.status_label;
