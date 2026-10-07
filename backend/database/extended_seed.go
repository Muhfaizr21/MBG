package database

import (
	"context"
	"fmt"
	"log"
)

// SeedExtended mengisikan data master dan operasional jika tabel masih kosong.
func SeedExtended(ctx context.Context) error {
	var count int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM sppg_kitchens").Scan(&count); err != nil {
		return fmt.Errorf("cek sppg_kitchens: %w", err)
	}
	if count > 0 {
		return nil
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("memulai transaksi extended seed: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Seed SPPG Kitchens
	sppgQueries := []string{
		`INSERT INTO sppg_kitchens (id, code, name, legal_entity, type, type_label, address, subdistrict, city, province, cluster, coordinates, manager_name, manager_nip, manager_phone, nutritionist_name, nutritionist_str, staff_count, kitchen_area, fleet_count, fleet_type, max_daily_portions, active_quota, safety_score, cold_chain_score, timeliness_score, composite_score, grade, status)
		VALUES 
		('SPPG-01', 'BGN-SPPG-001', 'SPPG Sentral Menteng 01', 'Satuan Pelayanan Pangan Mandiri BGN', 'sentral', 'Dapur Sentral BGN', 'Jl. Pegangsaan Barat No. 14, Menteng', 'Menteng', 'Jakarta Pusat', 'DKI Jakarta', 'Kluster Sentral DKI-01', '-6.1983, 106.8450', 'Chef Aris Munandar, A.Md.Par', '19820514 200801 1 002', '+62 812-8821-4401', 'Nur Aini, S.Gz', 'STR-GZ/2024/09881', 38, '520 m²', 6, 'Mobil Box Berpendingin (IoT Chiller 2-4°C)', 3500, 2800, 99.4, 98.7, 99.6, 99.2, 'A+', 'active'),
		('SPPG-04', 'BGN-SPPG-004', 'SPPG Sentral Sukajadi Bandung', 'PT Pangan Madani Parahyangan', 'sentral', 'Dapur Sentral Mandiri', 'Jl. Sukajadi No. 182, Pasteur', 'Sukajadi', 'Kota Bandung', 'Jawa Barat', 'Kluster Bandung Raya-01', '-6.8842, 107.5961', 'Chef Dicky Suherman, S.ST', '19851120 201102 1 005', '+62 813-2209-1823', 'Rina Wulandari, S.Tr.Gz', 'STR-GZ/2023/11204', 32, '480 m²', 5, 'Mobil Chiller IoT Isuzu Traga (Box PU Foam 10cm)', 3000, 2450, 98.8, 97.9, 98.5, 98.4, 'A', 'active'),
		('SPPG-02', 'BGN-SPPG-002', 'SPPG Kebayoran Baru Mandiri', 'Koperasi Pegawai Pangan Selatan', 'rekanan', 'Dapur Rekanan Terakreditasi', 'Jl. Wijaya IX No. 22, Melawai', 'Kebayoran Baru', 'Jakarta Selatan', 'DKI Jakarta', 'Kluster Selatan DKI-02', '-6.2415, 106.7992', 'Budi Santoso, S.Par', '19800315 200501 1 001', '+62 811-9988-213', 'Maya Indriani, S.Gz', 'STR-GZ/2022/04512', 28, '410 m²', 4, 'Mobil Thermoking IoT -20°C s/d +10°C', 2500, 2100, 97.5, 98.1, 96.8, 97.5, 'A', 'active'),
		('SPPG-07', 'BGN-SPPG-007', 'SPPG Banyumanik Sejahtera Semarang', 'CV Berkah Boga Nusantara', 'sentral', 'Dapur Sentral Wilayah', 'Jl. Setiabudi No. 104, Srondol', 'Banyumanik', 'Kota Semarang', 'Jawa Tengah', 'Kluster Semarang Selatan-01', '-7.0621, 110.4189', 'Siti Rahmawati, S.Pd', '19870912 201403 2 004', '+62 815-7788-990', 'Farhan Maulana, S.Gz', 'STR-GZ/2024/15609', 24, '390 m²', 4, 'Armada Box Insulasi Thermo-Guard', 2200, 1950, 98.1, 96.9, 99.0, 98.0, 'A', 'active'),
		('SPPG-10', 'BGN-SPPG-010', 'SPPG Wonokromo Sehat Surabaya', 'PT Boga Jatim Mandiri', 'rekanan', 'Dapur Rekanan BGN', 'Jl. Raya Darmo No. 88, Wonokromo', 'Wonokromo', 'Kota Surabaya', 'Jawa Timur', 'Kluster Surabaya Selatan-01', '-7.2981, 112.7381', 'Ir. H. Gunawan Wibisono', '19750421 200112 1 003', '+62 812-3344-5566', 'Dr. dr. Anisa Putri, M.Gizi', 'STR-GZ/2021/08123', 35, '510 m²', 6, 'Armada Chiller Double Cabin IoT GPS', 3200, 2700, 96.5, 95.8, 97.2, 96.5, 'B+', 'active')
		ON CONFLICT (id) DO NOTHING;`,
	}
	for _, q := range sppgQueries {
		if _, err := tx.Exec(ctx, q); err != nil {
			return fmt.Errorf("seed sppg: %w", err)
		}
	}

	// 2. Seed Schools
	schoolQuery := `INSERT INTO schools (npsn, id, name, level, status, status_label, status_reason, address, city, district, lat, lng, principal_name, principal_nip, principal_phone, principal_email, total_students, total_calorie_target, dietary_notes, sppg_id, acceptance_rate, avg_arrival_time)
	VALUES 
	('33.210.130', 'SCH-JKT-01', 'SDN 01 Menteng Pagi', 'SD', 'active', 'Aktif Penuh', 'Operasional normal, penerimaan porsi lancar setiap 06:55 WIB.', 'Jl. Besuki No. 4, Menteng, Jakarta Pusat', 'Jakarta Pusat', 'Kec. Menteng', -6.198321, 106.832742, 'Dra. Hj. Sri Wahyuni, M.Pd', '19680412 199203 2 004', '0812-9843-1102', 'sri.wahyuni@sdn01menteng.sch.id', 480, 248000, '6 siswa bebas kacang & telur', 'SPPG-01', 99.4, '06:55 WIB'),
	('20219876', 'SCH-BDG-02', 'SMPN 2 Bandung Wetan', 'SMP', 'active', 'Aktif Penuh', 'Operasional normal jenjang SMP dengan porsi protein tinggi.', 'Jl. Sumatera No. 40, Citarum, Bandung Wetan', 'Kota Bandung', 'Kec. Bandung Wetan', -6.911245, 107.614892, 'Drs. H. Agus Mulyana, M.M.', '19710815 199702 1 003', '0813-2210-9941', 'agus.mulyana@smpn2bdg.sch.id', 650, 422500, 'Standar AKG Remaja 650 kkal terpenuhi', 'SPPG-04', 98.9, '07:05 WIB'),
	('20101456', 'SCH-JKT-03', 'SDN Gondangdia 01', 'SD', 'active', 'Aktif Penuh', 'Penerimaan porsi reguler setiap pagi.', 'Jl. Gondangdia Lama No. 12, Menteng', 'Jakarta Pusat', 'Kec. Menteng', -6.191200, 106.834100, 'Bapak Mulyadi, S.Pd', '19750312 200003 1 002', '0812-7788-9911', 'mulyadi@sdngondangdia.sch.id', 530, 274000, 'Semua menu lolos uji alergi', 'SPPG-01', 99.1, '07:15 WIB'),
	('20532109', 'SCH-SBY-04', 'SDN Wonokromo 1 Surabaya', 'SD', 'active', 'Aktif Penuh', 'Jadwal makan siang tepat pukul 09:30 WIB.', 'Jl. Wonokromo No. 45, Wonokromo', 'Kota Surabaya', 'Kec. Wonokromo', -7.299500, 112.739000, 'Ibu Hj. Retno Palupi, M.Pd', '19800214 200501 2 006', '0812-3321-4455', 'retno@sdnwonokromo1.sch.id', 520, 269000, '3 siswa intoleransi laktosa', 'SPPG-10', 98.5, '07:10 WIB'),
	('20401122', 'SCH-SMG-05', 'SDN Srondol Wetan 02 Semarang', 'SD', 'active', 'Aktif Penuh', 'Fasilitas UKS dan wastafel cuci tangan memadai.', 'Jl. Karangrejo No. 8, Banyumanik', 'Kota Semarang', 'Kec. Banyumanik', -7.065400, 110.419800, 'Drs. Bambang Sudarsono', '19730519 199803 1 004', '0815-4433-2211', 'bambang@sdnsrondol02.sch.id', 440, 227000, 'Menu non-pedas untuk kelas bawah', 'SPPG-07', 99.0, '06:50 WIB')
	ON CONFLICT (npsn) DO NOTHING;`
	if _, err := tx.Exec(ctx, schoolQuery); err != nil {
		return fmt.Errorf("seed schools: %w", err)
	}

	// 3. Seed Menu Packages (10 Siklus Nasional Paket A - J)
	menuQuery := `INSERT INTO menu_packages (id, cycle_code, day_slot, name, staple, protein_main, side_veggie, fruit, dairy_drink, calories, protein, carbs, fat, calcium, iron, zinc, cost_per_serving, allergens, halal_cert, slhs_cert, description)
	VALUES 
	('PKG-A', 'Paket A', 'Senin (Hari Ke-1)', 'Nasi Ayam Panggang Madu & Capcay Brokoli Organik', 'Nasi Putih Pandan Wangi (150g)', 'Ayam Panggang Madu Bumbu Kuning (85g)', 'Capcay Brokoli, Wortel & Jamur Kuping (90g)', 'Pisang Barangan Medan (1 buah - 100g)', 'Susu Sapi Segar Pasteurisasi (200ml)', 580, 28.5, 72.0, 14.5, 420, 5.8, 4.2, 14850, 'Laktosa (Susu Sapi)', 'ID00410000129381023', 'SLHS-BGN-2026-A1', 'Menu favorit siswa dengan kombinasi protein tinggi dari ayam panggang tanpa minyak jenuh berlebih dan sayuran kaya vitamin C.'),
	('PKG-B', 'Paket B', 'Selasa (Hari Ke-2)', 'Nasi Kuning Cakalang Asap & Sayur Urap Kelapa Sangrai', 'Nasi Kuning Gurih Rempah Alami (150g)', 'Suwir Ikan Cakalang Asap Bumbu Rica Lembut (90g)', 'Sayur Urap Daun Singkong & Kacang Panjang (85g)', 'Jeruk Manis Pontianak (1 buah - 110g)', 'Air Mineral Higienis + Susu Kedelai Fortifikasi (200ml)', 565, 29.0, 68.5, 15.0, 390, 6.2, 4.4, 14700, 'Kedelai, Ikan Laut', 'ID00410000129381024', 'SLHS-BGN-2026-A2', 'Kandungan asam lemak Omega-3 melimpah untuk menunjang daya konsentrasi belajar siswa usia pertumbuhan.'),
	('PKG-C', 'Paket C', 'Rabu (Hari Ke-3)', 'Nasi Ulen Empal Daging Suwir & Sayur Lodeh Labu Siam', 'Nasi Putih Organik Beras Cianjur (150g)', 'Empal Daging Sapi Suwir Lengkuas Gurih (75g)', 'Sayur Lodeh Labu Siam & Jagung Manis Pipil (95g)', 'Semangka Merah Potong Dingin (120g)', 'Susu Sapi Pasteurisasi Rasa Cokelat Ringan (200ml)', 590, 27.8, 74.0, 15.2, 410, 6.5, 4.8, 14950, 'Laktosa, Sapi', 'ID00410000129381025', 'SLHS-BGN-2026-A3', 'Zat besi heme yang tinggi dari daging sapi lokal untuk mencegah gejala anemia dan kelesuan pada anak di jam belajar.'),
	('PKG-D', 'Paket D', 'Kamis (Hari Ke-4)', 'Nasi Liwet Ikan Nila Bakar Madu & Tumis Buncis Jagung', 'Nasi Liwet Gurih Daun Salam Serai (150g)', 'Fillet Ikan Nila Bakar Madu Rendah Garam (85g)', 'Tumis Buncis Muda & Jagung Pipil Manis (85g)', 'Melon Madu Iris Segar (110g)', 'Yogurt Minum Probiotik Stroberi Alami (180ml)', 575, 28.2, 70.0, 13.8, 430, 5.2, 4.1, 14600, 'Laktosa, Ikan Air Tawar', 'ID00410000129381026', 'SLHS-BGN-2026-A4', 'Probiotik alami untuk menjaga kesehatan mikrobioma usus dan daya tahan tubuh anak sekolah.'),
	('PKG-E', 'Paket E', 'Jumat (Hari Ke-5)', 'Nasi Merah Rolade Ayam Sayur & Sup Bening Bayam Jagung', 'Nasi Merah Campur Beras Putih Pulen (150g)', 'Rolade Ayam Cincang Isi Wortel & Telur Puyuh (90g)', 'Sup Bening Bayam Hijau & Jagung Manis (100g)', 'Pepaya California Iris (120g)', 'Susu Pasteurisasi Full Cream Fortifikasi Vitamin D (200ml)', 555, 26.5, 73.0, 12.5, 450, 5.9, 4.0, 14400, 'Telur, Laktosa', 'ID00410000129381027', 'SLHS-BGN-2026-A5', 'Serat pangan tinggi dan antioksidan untuk stamina optimal menjelang akhir pekan.')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, menuQuery); err != nil {
		return fmt.Errorf("seed menu_packages: %w", err)
	}

	// 4. Seed Calendar Days
	calQuery := `INSERT INTO calendar_days (date, package_id, day_name, week_number, day_type, status, theme, notes, target_portions)
	VALUES 
	('2026-10-05', 'PKG-A', 'Senin', 1, 'regular', 'approved', 'Senin Berenergi - Protein Unggas Segar', 'Distribusi porsi serentak jam 06:45 WIB.', 550000),
	('2026-10-06', 'PKG-B', 'Selasa', 1, 'regular', 'approved', 'Selasa Cerdas - Omega 3 Ikan Laut', 'Pengawasan suhu cold-chain armada diperketat.', 550000),
	('2026-10-07', 'PKG-C', 'Rabu', 1, 'regular', 'approved', 'Rabu Kuat - Zat Besi Daging Sapi Pilihan', 'Hari ini berlangsung monitoring dashboard real-time.', 550000),
	('2026-10-08', 'PKG-D', 'Kamis', 1, 'regular', 'approved', 'Kamis Sehat - Ikan Air Tawar & Probiotik', 'Verifikasi gizi dan kepatuhan SOP dapur SPPG.', 550000),
	('2026-10-09', 'PKG-E', 'Jumat', 1, 'regular', 'approved', 'Jumat Berkah Serat - Sayur Bayam & Nasi Merah', 'Evaluasi mingguan penerimaan siswa dan audit BAST.', 550000)
	ON CONFLICT (date) DO NOTHING;`
	if _, err := tx.Exec(ctx, calQuery); err != nil {
		return fmt.Errorf("seed calendar_days: %w", err)
	}

	// 5. Seed SPPG Batches
	batchQuery := `INSERT INTO sppg_batches (id, sppg_id, package_id, cooking_date, cooking_start, cooking_end, target_portions, actual_portions, core_temp_c, cook_lead, qc_status, haccp_status, notes)
	VALUES 
	('BTH-0842-MNT', 'SPPG-01', 'PKG-C', '2026-10-07', '04:15 WIB', '05:45 WIB', 2800, 2800, 78.5, 'Chef Aris Munandar', 'passed', 'safe', 'Suhu inti daging sapi 78.5°C melampaui batas aman HACCP 74°C.'),
	('BTH-0843-BDG', 'SPPG-04', 'PKG-C', '2026-10-07', '04:30 WIB', '06:00 WIB', 2450, 2450, 79.2, 'Chef Dicky Suherman', 'passed', 'safe', 'QC organoleptik lulus sempurna.'),
	('BTH-0844-SMG', 'SPPG-07', 'PKG-C', '2026-10-07', '04:00 WIB', '05:30 WIB', 1950, 1950, 81.0, 'Siti Rahmawati', 'passed', 'safe', 'Packing box termo selesai tepat waktu.')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, batchQuery); err != nil {
		return fmt.Errorf("seed sppg_batches: %w", err)
	}

	// 6. Seed Deliveries
	delQuery := `INSERT INTO deliveries (id, batch_id, sppg_id, school_npsn, validator_name, scanned_at, scan_date, portions, target_portions, temp_c, temp_status, qr_token, qr_status, crypto_hash, menu_name, ai_verdict, ai_score, image_url, status)
	VALUES 
	('DEL-2026-JKT-0982', 'BTH-0842-MNT', 'SPPG-01', '33.210.130', 'Dr. Hendra Prasetyo', '07:12:45 WIB', '2026-10-07', 480, 480, 23.4, 'safe', 'MBG-QR-7719-X89A-001', 'verified', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Nasi Ulen Empal Daging Suwir & Sayur Lodeh', 'layak', 99.4, '/img/samples/meal_sdn01.jpg', 'Tiba Sesuai Jadwal'),
	('DEL-2026-BDG-0412', 'BTH-0843-BDG', 'SPPG-04', '20219876', 'Ibu Siti Maryam', '07:05:12 WIB', '2026-10-07', 650, 650, 22.8, 'safe', 'MBG-QR-8820-Y12B-002', 'verified', 'b2a1c998e11849a99f123a41c9983de47ae41e4649b934ca495991b7852b855a', 'Nasi Ulen Empal Daging Suwir & Sayur Lodeh', 'layak', 98.9, '/img/samples/meal_smpn2.jpg', 'Tiba Sesuai Jadwal'),
	('DEL-2026-JKT-0985', 'BTH-0842-MNT', 'SPPG-01', '20101456', 'Bapak Mulyadi', '07:18:30 WIB', '2026-10-07', 530, 530, 24.1, 'safe', 'MBG-QR-7720-X89A-003', 'verified', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'Nasi Ulen Empal Daging Suwir & Sayur Lodeh', 'layak', 99.1, '/img/samples/meal_gondangdia.jpg', 'Tiba Sesuai Jadwal')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, delQuery); err != nil {
		return fmt.Errorf("seed deliveries: %w", err)
	}

	// 7. Seed Schedules
	schedQuery := `INSERT INTO schedules (id, sppg_id, route_name, fleet_name, license_plate, driver_name, driver_phone, departure_time, arrival_eta, total_portions, status, target_schools, telemetry)
	VALUES 
	('SCHED-JKT-001', 'SPPG-01', 'Koridor Menteng - Cikini', 'Armada Chiller Box #01', 'B 9102 BGN', 'Sulaeman Fauzi', '0812-9988-7711', '06:30 WIB', '06:55 WIB', 910, 'on_time', 
	'[{"npsn":"33.210.130","name":"SDN 01 Menteng Pagi","portions":480,"eta":"06:55 WIB"},{"npsn":"20101456","name":"SDN Gondangdia 01","portions":430,"eta":"07:15 WIB"}]',
	'{"speedKmh":36,"tempC":22.5,"status":"normal"}'),
	('SCHED-BDG-002', 'SPPG-04', 'Koridor Bandung Wetan - Riau', 'Armada Chiller Box #02', 'D 8044 BGN', 'Asep Saepudin', '0813-2211-4455', '06:20 WIB', '07:05 WIB', 650, 'on_time',
	'[{"npsn":"20219876","name":"SMPN 2 Bandung Wetan","portions":650,"eta":"07:05 WIB"}]',
	'{"speedKmh":32,"tempC":23.1,"status":"normal"}')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, schedQuery); err != nil {
		return fmt.Errorf("seed schedules: %w", err)
	}

	// 8. Seed Attendances
	attQuery := `INSERT INTO attendances (id, school_npsn, date, registered_students, present_students, delivered_portions, consumed_portions, surplus_portions, surplus_status, attendance_rate, finish_rate, reconciliation_status, target_tomorrow_quota, notes)
	VALUES 
	('ATT-20261007-01', '33.210.130', '2026-10-07', 480, 468, 480, 468, 12, 'available_for_redistribution', 97.5, 98.2, 'surplus_safe', 470, '12 siswa izin sakit. Porsi sisa utuh disimpan di suhu dingin untuk redistribusi aman.'),
	('ATT-20261007-02', '20219876', '2026-10-07', 650, 642, 650, 642, 8, 'available_for_redistribution', 98.8, 99.0, 'surplus_safe', 645, 'Konsumsi siswa jenjang SMP habis bersih.'),
	('ATT-20261007-03', '20101456', '2026-10-07', 530, 521, 530, 521, 9, 'available_for_redistribution', 98.3, 97.9, 'surplus_safe', 525, 'Penerimaan tepat waktu tanpa insiden.')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, attQuery); err != nil {
		return fmt.Errorf("seed attendances: %w", err)
	}

	// 9. Seed Notices
	notQuery := `INSERT INTO notices (id, ref_number, title, category, urgency, target_audience, scope_region, published_at, effective_date, author_name, author_role, content, is_flash_alert, requires_acknowledgement, attachments)
	VALUES 
	('NOT-2026-001', 'BGN/SE/084/X/2026', 'Peringatan Higienitas: Standar Penyimpanan Daging dan Suhu Rantai Dingin', 'seasonal', 'important', 'all', 'Nasional', '07 Okt 2026, 06:00 WIB', 'Berlaku Selama Oktober 2026', 'Dr. Hendra Gunawan, M.Epid', 'Direktur Kepatuhan Mutu BGN', 'Seluruh SPPG wajib memastikan suhu boks pengiriman terjaga pada rentang aman 20-25°C untuk makanan hangat dan 2-4°C untuk produk olahan susu sebelum tiba di sekolah penerima.', false, false, '[]'),
	('NOT-2026-002', 'BGN/EDR/102/X/2026', 'Instruksi Khusus: Integrasi Pemindai Kamera YOLOv8 untuk Seluruh Guru Validator', 'system', 'info', 'validators', 'Nasional', '06 Okt 2026, 14:00 WIB', 'Berlaku Permanen', 'Tim Pengembang KawanGizi', 'Satgas Digitalisasi MBG', 'Aplikasi mobile pemindai versi v2.4.1 telah mengaktifkan deteksi anomali fisik otomatis dan kalkulasi makronutrien instan. Pastikan izin kamera aktif.', false, false, '[]')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, notQuery); err != nil {
		return fmt.Errorf("seed notices: %w", err)
	}

	// 10. Seed Feedbacks
	fbQuery := `INSERT INTO feedbacks (id, ticket_number, reported_at, school_npsn, school_name, sppg_id, batch_id, menu_package, severity, anomaly_type, affected_portions, reporter_name, reporter_role, reporter_phone, title, description, status, is_kill_switch_executed, evidence_photos, kill_switch_details, medical_escalation)
	VALUES 
	('TKT-2026-10-001', 'INC/BGN/JKT/1007/01', '2026-10-07 07:30 WIB', '33.210.130', 'SDN 01 Menteng Pagi', 'SPPG-01', 'BTH-0842-MNT', 'Paket C', 'level3', 'packaging_issue', 2, 'Ibu Siti Aminah, S.Pd', 'Validator Sekolah', '0812-9901-2211', 'Tutup Boks Sedikit Renggang pada 2 Porsi Kelas 1', 'Ditemukan dua boks makanan kemasan penutupnya sedikit bergeser saat transit. Makanan di dalamnya tetap segar, porsi diganti boks cadangan.', 'resolved', false, '[]', '{}', '{}')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, fbQuery); err != nil {
		return fmt.Errorf("seed feedbacks: %w", err)
	}

	// 11. Seed Reports
	repQuery := `INSERT INTO reports (id, report_code, title, period, category, author_name, status, file_size, file_format, kpi_metrics)
	VALUES 
	('REP-2026-10-01', 'BAST/BGN/OKT/2026/01', 'Berita Acara Rekapitulasi Penyaluran MBG Pekan I Oktober 2026', '01 - 07 Oktober 2026', 'BAST Keuangan & Penyaluran', 'Badan Gizi Nasional RI', 'verified', '2.4 MB', 'PDF', '{"totalPortions":3850000,"complianceRate":99.4,"fundDisbursed":57750000000}'),
	('REP-2026-09-02', 'AUDIT/GIZI/SEP/2026/04', 'Laporan Audit Kepatuhan Makronutrien dan Angka Kecukupan Gizi (AKG) September 2026', 'September 2026', 'Audit Gizi & Higienitas', 'Kemenkes RI & BGN', 'verified', '4.1 MB', 'PDF', '{"schoolsAudited":1250,"avgCalorie":578,"deficiencyRate":0.2}')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, repQuery); err != nil {
		return fmt.Errorf("seed reports: %w", err)
	}

	// 12. Seed Validator Profiles
	valQuery := `INSERT INTO validator_profiles (id, user_id, satgas_id, name, nip, npsn, role, device, device_id, certification, status, scans_today, quota_today, scan_logs)
	VALUES 
	('VAL-001', 'usr-validator-001', 'BGN-VLD-0042', 'Ibu Siti Aminah, S.Pd.', '19840312 200801 2 003', '33.210.130', 'Penanggung Jawab MBG Sekolah', 'Samsung Galaxy A54 5G', 'dev-samsung-001', 'Sertifikasi Higienitas Dasar (BNSP)', 'active', 48, 48, '[]')
	ON CONFLICT (id) DO NOTHING;`
	if _, err := tx.Exec(ctx, valQuery); err != nil {
		return fmt.Errorf("seed validator_profiles: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit extended seed: %w", err)
	}

	log.Println("✅ Extended seed tabel ekosistem MBG berhasil dimasukkan ke PostgreSQL")
	return nil
}
