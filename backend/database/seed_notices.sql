-- ==============================================================================
-- SEED NOTICES (Papan Pengumuman & Edaran Darurat Satgas MBG)
-- 6 Real World Broadcasts matching INITIAL_NOTICES_LIST
-- ==============================================================================

INSERT INTO notices (
    id, ref_number, title, category, urgency, target_audience, scope_region,
    published_at, effective_date, author_name, author_role, content,
    is_flash_alert, requires_acknowledgement, status, status_label, status_reason,
    acknowledgement_stats, attachments, created_at, updated_at
)
VALUES
(
    'NOT-2026-001',
    'BGN/SE/084/IX/2026',
    'Peringatan Darurat: Penarikan Sementara Menu Olahan Kerang & Telur Puyuh SPPG Surabaya',
    'seasonal',
    'critical',
    'all',
    'Jawa Timur & Koridor Surabaya',
    '28 Sep 2026, 06:15 WIB',
    'Berlaku Segera s.d 30 Sep 2026',
    'Dr. apt. Hendra Gunawan, M.Epid',
    'Direktur Kepatuhan Mutu & Keamanan Pangan BGN',
    'Ditemukan indikasi kontaminasi cemaran mikrobiologis pada pasokan bahan baku kerang air tawar dan telur puyuh di klaster Jawa Timur. Seluruh Dapur SPPG diinstruksikan MENIADAKAN menu olahan tersebut dan menggantinya dengan daging ayam potong segar terakreditasi NKV.

Seluruh Guru Validator diwajibkan memeriksa boks makanan yang tiba. Jika ditemukan olahan kerang/puyuh, segera tolak boks makanan pada aplikasi dan berikan label *HOLD - UJI LAB*. Notifikasi ini wajib dikonfirmasi (*tap to acknowledge*) sebelum kamera pemindai dapat digunakan.',
    true,
    true,
    'active',
    'Tayang Publik',
    'Siaran Flash Alert Aktif. Aplikasi validator terkunci hingga konfirmasi diterima.',
    '{"totalRecipients": 420, "acknowledgedCount": 398, "complianceRate": 94.8}',
    '[{"fileName": "Surat_Edaran_Darurat_BGN_084_Penarikan_Bahan.pdf", "fileSize": "1.4 MB", "verifiedSignature": "Terverifikasi BSrE BSSN"}]',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
),
(
    'NOT-2026-002',
    'BGN/SE/079/IX/2026',
    'Surat Edaran BGN: Protokol Uji Suhu Termal Inti Makanan Min 60°C Saat Serah Terima',
    'circular',
    'important',
    'validators',
    'Nasional (Seluruh Satuan Pendidikan)',
    '26 Sep 2026, 14:00 WIB',
    'Berlaku Permanen',
    'Prof. Dr. Ir. Siti Nurjanah, M.Sc',
    'Kepala Badan Gizi Nasional (BGN)',
    'Berdasarkan evaluasi mingguan Satgas MBG, ditemukan potensi penurunan suhu makanan jika boks didiamkan lebih dari 45 menit tanpa tutup berinsulasi. 

Validator diinstruksikan memastikan termometer infrared menembus uap makanan dengan suhu inti minimal 60°C. Makanan di bawah 50°C wajib dipisahkan dan diuji organoleptik lanjutan untuk mencegah pertumbuhan spora Bacillus cereus.',
    false,
    true,
    'active',
    'Tayang Publik',
    '',
    '{"totalRecipients": 1250, "acknowledgedCount": 1195, "complianceRate": 95.6}',
    '[{"fileName": "Pedoman_Suhu_Termal_Inti_MBG_Rev3.pdf", "fileSize": "2.8 MB", "verifiedSignature": "Terverifikasi BSrE BSSN"}]',
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '11 days'
),
(
    'NOT-2026-003',
    'MBG/SYS/042/IX/2026',
    'Pembaruan Sistem: Rilis AI Vision YOLOv8x v2.4 & Jadwal Pemeliharaan Server Tengah Malam',
    'system',
    'info',
    'all',
    'Seluruh Indonesia',
    '25 Sep 2026, 10:30 WIB',
    '29 Sep 2026, 01:00 – 03:00 WIB',
    'Tim Arsitektur Komputasi KawanGizi',
    'Pusat Operasi TI & AI Satgas MBG',
    'Kami akan melakukan pemeliharaan server database terdistribusi pada hari Selasa, 29 September 2026 pukul 01:00 – 03:00 WIB (dini hari).

Pembaruan ini mencakup:
1. Peningkatan akurasi inferensi AI YOLOv8x pada kondisi pencahayaan rendah di ruang UKS sekolah.
2. Sinkronisasi token QR asimetris ECDSA yang 40% lebih cepat saat jaringan seluler 3G/Edge.
3. Seluruh sesi masak dan pengiriman subuh jam 04:30 WIB dipastikan berjalan normal tanpa gangguan.',
    false,
    false,
    'active',
    'Tayang Publik',
    '',
    '{"totalRecipients": 3400, "acknowledgedCount": 2980, "complianceRate": 87.6}',
    '[{"fileName": "Changelog_YOLOv8x_MBG_v2.4_ReleaseNotes.pdf", "fileSize": "820 KB", "verifiedSignature": "Terverifikasi SHA-256"}]',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
),
(
    'NOT-2026-004',
    'BGN/ADV/018/IX/2026',
    'Advis Musim Pancaroba: Peningkatan Standar Filtrasi Air & Sanitasi Talenan Dapur SPPG',
    'seasonal',
    'important',
    'sppg',
    'Wilayah Barat & Tengah Indonesia',
    '24 Sep 2026, 09:15 WIB',
    '24 Sep – 15 Okt 2026',
    'dr. Yudhi Prasetiyo, Sp.Ok',
    'Ketua Tim Audit SLHS & Sanitasi Dapur BGN',
    'Memasuki masa peralihan musim hujan, tingkat kekeruhan air tanah dan risiko cemaran coliform meningkat hingga 35%. 

Semua Dapur SPPG wajib menerapkan:
1. Pengecekan lampu UV sterilizer air minum dan filter karbon aktif setiap 3 hari sekali.
2. Pemisahan ketat talenan warna merah (daging mentah), kuning (unggas), hijau (sayuran), dan putih (makanan matang).
3. Pengujian mikrobiologi mandiri mingguan dengan swab test swab kit resmi Dinkes setempat.',
    false,
    true,
    'active',
    'Tayang Publik',
    '',
    '{"totalRecipients": 180, "acknowledgedCount": 172, "complianceRate": 95.5}',
    '[{"fileName": "Instruksi_Audit_Sanitasi_Pancaroba_Dapur_SPPG.pdf", "fileSize": "3.1 MB", "verifiedSignature": "Terverifikasi BSrE BSSN"}]',
    NOW() - INTERVAL '13 days',
    NOW() - INTERVAL '13 days'
),
(
    'NOT-2026-005',
    'KEMENDIKBUD/SE/312/2026',
    'Surat Edaran Kemendikbud: Integrasi Data Presensi Siswa Dapodik dengan Kuota Makan MBG',
    'circular',
    'info',
    'validators',
    'Nasional',
    '22 Sep 2026, 11:00 WIB',
    'Berlaku Semester Genap 2026',
    'Direktorat Jenderal PAUD Dikdasmen',
    'Kemendikbudristek RI',
    'Pemberitahuan kepada seluruh satuan pendidikan jenjang SD dan SMP penerima MBG agar menyinkronkan data presensi siswa di kelas sebelum jam 10:00 WIB setiap harinya. 

Data presensi riil ini langsung terhubung dengan sistem MBG untuk kalkulasi porsi harian otomatis H+1, guna menjamin efisiensi APBN dan meminimalkan sisa porsi yang tidak termakan.',
    false,
    false,
    'active',
    'Tayang Publik',
    '',
    '{"totalRecipients": 1250, "acknowledgedCount": 1180, "complianceRate": 94.4}',
    '[{"fileName": "Juknis_Sinkronisasi_Dapodik_MBG_2026.pdf", "fileSize": "1.9 MB", "verifiedSignature": "Terverifikasi BSrE BSSN"}]',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
),
(
    'NOT-2026-006',
    'BGN/SE/066/VIII/2026',
    'Maklumat Kedaluwarsa: Pedoman Menu Khusus Uji Coba Katering Wilayah 3T Tahap 1',
    'circular',
    'info',
    'all',
    'Wilayah Tertinggal, Terdepan, dan Terluar (3T)',
    '15 Agu 2026, 08:00 WIB',
    'Berakhir 31 Agu 2026',
    'Sekretariat Satgas MBG Pusat',
    'Satuan Pelayanan Pangan Bergizi',
    'Pedoman alokasi menu sementara pada masa uji coba rantai pasok daerah kepulauan dan pedalaman telah resmi digantikan oleh Pedoman Standar Porsi Nasional MBG Rev 3. Arsip ini disimpan sebagai rekaman kepatuhan historis.',
    false,
    false,
    'archived',
    'Diarsipkan',
    'Telah digantikan oleh Pedoman Standar Porsi Nasional MBG Rev 3.',
    '{"totalRecipients": 800, "acknowledgedCount": 760, "complianceRate": 95.0}',
    '[]',
    NOW() - INTERVAL '53 days',
    NOW() - INTERVAL '37 days'
)
ON CONFLICT (id) DO UPDATE SET
    ref_number = EXCLUDED.ref_number,
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    urgency = EXCLUDED.urgency,
    target_audience = EXCLUDED.target_audience,
    scope_region = EXCLUDED.scope_region,
    published_at = EXCLUDED.published_at,
    effective_date = EXCLUDED.effective_date,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    content = EXCLUDED.content,
    is_flash_alert = EXCLUDED.is_flash_alert,
    requires_acknowledgement = EXCLUDED.requires_acknowledgement,
    status = EXCLUDED.status,
    status_label = EXCLUDED.status_label,
    status_reason = EXCLUDED.status_reason,
    acknowledgement_stats = EXCLUDED.acknowledgement_stats,
    attachments = EXCLUDED.attachments,
    updated_at = NOW();
