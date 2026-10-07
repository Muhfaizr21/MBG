-- Seed Menu Packages PKG-A through PKG-J
INSERT INTO menu_packages (id, cycle_code, day_slot, name, staple, protein_main, side_veggie, fruit, dairy_drink, calories, protein, carbs, fat, calcium, iron, zinc, cost_per_serving, allergens, halal_cert, slhs_cert, description)
VALUES 
('PKG-A', 'Paket A', 'Senin (Hari Ke-1)', 'Nasi Ayam Panggang Madu & Capcay Brokoli Organik', 'Nasi Putih Pandan Wangi (150g)', 'Ayam Panggang Madu Bumbu Kuning (85g)', 'Capcay Brokoli, Wortel & Jamur Kuping (90g)', 'Pisang Barangan Medan (1 buah - 100g)', 'Susu Sapi Segar Pasteurisasi (200ml)', 580, 28.5, 72.0, 14.5, 420, 5.8, 4.2, 14850, 'Laktosa (Susu Sapi)', 'ID00410000129381023', 'SLHS-BGN-2026-A1', 'Menu favorit siswa dengan kombinasi protein tinggi dari ayam panggang tanpa minyak jenuh berlebih dan sayuran kaya vitamin C.'),
('PKG-B', 'Paket B', 'Selasa (Hari Ke-2)', 'Nasi Kuning Cakalang Asap & Sayur Urap Kelapa Sangrai', 'Nasi Kuning Gurih Rempah Alami (150g)', 'Suwir Ikan Cakalang Asap Bumbu Rica Lembut (90g)', 'Sayur Urap Daun Singkong & Kacang Panjang (85g)', 'Jeruk Manis Pontianak (1 buah - 110g)', 'Air Mineral Higienis + Susu Kedelai Fortifikasi (200ml)', 565, 29.0, 68.5, 15.0, 390, 6.2, 4.4, 14700, 'Kedelai, Ikan Laut', 'ID00410000129381024', 'SLHS-BGN-2026-B2', 'Kaya asam lemak Omega-3 untuk perkembangan kognitif otak anak dengan serat tinggi dari sayur urap tradisional nusantara.'),
('PKG-C', 'Paket C', 'Rabu (Hari Ke-3)', 'Nasi Merah Daging Sapi Teriyaki & Tumis Buncis Tahu', 'Nasi Merah Pulen Organik (140g)', 'Daging Sapi Iris Saus Teriyaki Rendah Garam (80g)', 'Tumis Buncis Baby & Tahu Sutra Gurih (85g)', 'Apel Fuji Malang Segar (1 buah - 95g)', 'Susu Sapi Segar Pasteurisasi (200ml)', 595, 30.5, 70.0, 16.0, 440, 6.5, 4.8, 14950, 'Laktosa, Kedelai', 'ID00410000129381025', 'SLHS-BGN-2026-C3', 'Tinggi zat besi heme dan zinc untuk pencegahan anemia pada anak usia sekolah dasar dan menengah.'),
('PKG-D', 'Paket D', 'Kamis (Hari Ke-4)', 'Nasi Gurame Fillet Asam Manis & Sup Jagung Wortel', 'Nasi Putih Pandan Wangi (150g)', 'Fillet Ikan Gurame Crispy Saus Nanas Alami (85g)', 'Sup Bening Jagung Manis & Wortel Dadu (90g)', 'Pepaya California Potong (1 porsi - 120g)', 'Susu Kedelai Fortifikasi Kalsium (200ml)', 550, 26.5, 74.0, 12.5, 380, 4.9, 3.9, 14600, 'Ikan Air Tawar, Kedelai', 'ID00410000129381026', 'SLHS-BGN-2026-D4', 'Asupan beta-karoten tinggi untuk kesehatan retina mata anak serta tekstur sup hangat yang disukai siswa.'),
('PKG-E', 'Paket E', 'Jumat (Hari Ke-5)', 'Nasi Liwet Telur Balado Daun Kelor & Tempe Bacem', 'Nasi Liwet Gurih Daun Salam Serai (150g)', 'Telur Ayam Utuh Bumbu Balado Manis Ringan (60g)', 'Tumis Daun Kelor & Labu Siam Pipih (85g)', 'Semangka Merah Segar Tanpa Biji (1 potong - 130g)', 'Susu Sapi Segar UHT Full Cream (200ml)', 540, 24.8, 69.0, 14.0, 460, 5.6, 3.8, 14200, 'Telur, Laktosa, Kedelai', 'ID00410000129381027', 'SLHS-BGN-2026-E5', 'Pemanfaatan superfood lokal daun kelor kaya mikronutrien dipadukan dengan telur omega-3 dan protein nabati tempe.'),
('PKG-F', 'Paket F', 'Senin W2 (Hari Ke-6)', 'Nasi Uduk Rolade Daging Sapi & Orek Tempe Manis', 'Nasi Uduk Santan Ringan (150g)', 'Rolade Daging Sapi & Telur Kukus (85g)', 'Tumis Buncis Jagung Manis Pipil (85g)', 'Melon Madu Hijau Segar (1 potong - 120g)', 'Susu Sapi Segar Pasteurisasi (200ml)', 590, 27.8, 73.5, 15.5, 410, 5.9, 4.5, 14900, 'Laktosa, Kedelai, Telur', 'ID00410000129381028', 'SLHS-BGN-2026-F6', 'Kombinasi klasik favorit anak dengan rolade daging kukus yang empuk, aman dari risiko tersedak bagi siswa kelas bawah.'),
('PKG-G', 'Paket G', 'Selasa W2 (Hari Ke-7)', 'Nasi Ayam Woku Belanga & Sayur Bening Bayam Jagung', 'Nasi Putih Pandan Wangi (150g)', 'Ayam Fillet Woku Belanga Tanpa Cabe Pedas (85g)', 'Sayur Bening Daun Bayam & Jagung Pipil (90g)', 'Jeruk Manis Medan (1 buah - 105g)', 'Susu Kedelai Alami (200ml)', 560, 28.0, 71.0, 13.0, 395, 6.4, 4.1, 14750, 'Kedelai', 'ID00410000129381029', 'SLHS-BGN-2026-G7', 'Rempah aromatik woku khas Sulawesi yang diracik non-pedas untuk menumbuhkan apresiasi keragaman kuliner nusantara.'),
('PKG-H', 'Paket H', 'Rabu W2 (Hari Ke-8)', 'Nasi Merah Ikan Bandeng Presto & Sayur Asem Segar', 'Nasi Merah Pulen (140g)', 'Ikan Bandeng Presto Tanpa Duri Balut Telur (85g)', 'Sayur Asem Jakarta Kacang Panjang & Labu (90g)', 'Pisang Raja Sereh (1 buah - 95g)', 'Susu Sapi Segar UHT (200ml)', 575, 29.5, 69.0, 14.8, 450, 5.7, 4.3, 14650, 'Ikan, Telur, Laktosa', 'ID00410000129381030', 'SLHS-BGN-2026-H8', 'Bandeng presto duri lunak memastikan keamanan santap siswa sekaligus memberikan asupan kalsium organik tulang yang tinggi.'),
('PKG-I', 'Paket I', 'Kamis W2 (Hari Ke-9)', 'Nasi Semur Daging Telur Puyuh & Tumis Buncis Tahu', 'Nasi Putih Pulen (150g)', 'Semur Daging Sapi Cincang & 2 Btr Telur Puyuh (85g)', 'Tumis Kangkung & Tahu Sutra Lembut (85g)', 'Salak Pondoh Manis Kupas (2 buah - 90g)', 'Susu Sapi Segar Pasteurisasi (200ml)', 610, 31.0, 72.0, 16.5, 430, 6.8, 4.9, 14980, 'Laktosa, Kedelai, Telur', 'ID00410000129381031', 'SLHS-BGN-2026-I9', 'Kombinasi zat besi ganda dari daging sapi dan telur puyuh untuk stamina dan konsentrasi belajar optimal.'),
('PKG-J', 'Paket J', 'Jumat W2 (Hari Ke-10)', 'Nasi Kuning Tuna Suwir Gurih & Tumis Buncis Wortel', 'Nasi Kuning Alami Kunyit (150g)', 'Ikan Tuna Sirip Kuning Suwir Gurih Manis (90g)', 'Tumis Buncis, Jagung & Wortel Pelangi (85g)', 'Jeruk Manis Pontianak (1 buah - 110g)', 'Susu Pasteurisasi Cokelat Ringan (200ml)', 570, 30.0, 70.0, 13.5, 415, 5.4, 4.2, 14800, 'Ikan Laut, Laktosa', 'ID00410000129381032', 'SLHS-BGN-2026-J10', 'Penutup siklus 10 hari dengan sajian tuna tinggi protein dan vitamin D untuk imunitas tubuh anak menjelang akhir pekan.')
ON CONFLICT (id) DO UPDATE SET
	cycle_code = EXCLUDED.cycle_code,
	day_slot = EXCLUDED.day_slot,
	name = EXCLUDED.name,
	staple = EXCLUDED.staple,
	protein_main = EXCLUDED.protein_main,
	side_veggie = EXCLUDED.side_veggie,
	fruit = EXCLUDED.fruit,
	dairy_drink = EXCLUDED.dairy_drink,
	calories = EXCLUDED.calories,
	protein = EXCLUDED.protein,
	carbs = EXCLUDED.carbs,
	fat = EXCLUDED.fat,
	calcium = EXCLUDED.calcium,
	iron = EXCLUDED.iron,
	zinc = EXCLUDED.zinc,
	cost_per_serving = EXCLUDED.cost_per_serving,
	allergens = EXCLUDED.allergens,
	halal_cert = EXCLUDED.halal_cert,
	slhs_cert = EXCLUDED.slhs_cert,
	description = EXCLUDED.description;

-- Seed Substitutions
INSERT INTO menu_substitutions (id, date, cycle_code, region, original_ingredient, substitute_ingredient, reason, nutrition_comparison, nutritionist_review, status, status_label, approved_at, approved_by)
VALUES 
('SUB-2026-001', '2026-09-30', 'Paket C', 'Jawa Barat (Wilayah Bandung & Sekitarnya)', 'Daging Sapi Iris Teriyaki (80g)', 'Rolade Daging Sapi & Telur Ayam Organik (85g)', 'Kenaikan mendadak harga daging sapi segar lokal Bandung (>42%) akibat pembatasan distribusi ternak regional.', '{"proteinOriginal": "30.5g", "proteinSubstitute": "29.8g (-0.7g - Terpenuhi)", "caloriesOriginal": "595 kkal", "caloriesSubstitute": "585 kkal (-10 kkal - Ideal)", "costOriginal": "Rp 14.950", "costSubstitute": "Rp 14.500 (Efisien)"}'::jsonb, 'dr. Dian Lestari, Sp.GK (BGN) - Disetujui karena deviasi protein <3% dan nilai kalsium tetap terjaga.', 'approved', 'Disetujui Superadmin BGN', '2026-09-27 14:15 WIB', 'Bambang Soediro (Superadmin Satgas MBG)'),
('SUB-2026-002', '2026-10-02', 'Paket E', 'Jawa Tengah (Semarang & Surakarta)', 'Sayur Daun Kelor Segar (85g)', 'Daun Bayam Hijau Organik & Wortel (90g)', 'Pasokan daun kelor perkebunan mitra lokal basah terendam banjir luapan sungai Bengawan Solo.', '{"proteinOriginal": "24.8g", "proteinSubstitute": "25.2g (+0.4g)", "caloriesOriginal": "540 kkal", "caloriesSubstitute": "545 kkal (+5 kkal)", "costOriginal": "Rp 14.200", "costSubstitute": "Rp 14.200 (Imbang)"}'::jsonb, 'Nurul Hidayati, S.Gz (Nutrisionis Wilayah) - Bayam memiliki kandungan zat besi dan serat seimbang.', 'pending', 'Menunggu Otorisasi Superadmin', NULL, NULL),
('SUB-2026-003', '2026-10-08', 'Paket H', 'DI Yogyakarta (Sleman & Bantul)', 'Ikan Bandeng Presto (85g)', 'Ikan Kembung Banjar Kukus Bumbu Kuning (90g)', 'Sentra presto tambak Juwana mengalami keterlambatan logistik kapal pendingin.', '{"proteinOriginal": "29.5g", "proteinSubstitute": "30.2g (+0.7g - Unggul Omega 3)", "caloriesOriginal": "575 kkal", "caloriesSubstitute": "570 kkal (-5 kkal)", "costOriginal": "Rp 14.650", "costSubstitute": "Rp 14.600 (Imbang)"}'::jsonb, 'dr. Fajar Kusuma, Sp.A (BGN DIY) - Ikan kembung lokal sangat kaya asam lemak DHA & kalsium.', 'approved', 'Disetujui Superadmin BGN', '2026-09-28 09:30 WIB', 'Bambang Soediro (Superadmin Satgas MBG)')
ON CONFLICT (id) DO UPDATE SET
	status = EXCLUDED.status,
	status_label = EXCLUDED.status_label,
	approved_at = EXCLUDED.approved_at,
	approved_by = EXCLUDED.approved_by;

-- Seed Calendar Days
INSERT INTO calendar_days (date, package_id, day_name, day_number, month_year, day_type, day_type_label, title, menu_status, menu_status_label, is_operational_blackout, blackout_reason, target_portions, active_kitchens, has_inspection, inspection_detail, has_substitution, substitution_id)
VALUES
('2026-09-21', 'PKG-A', 'Senin', 21, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-1', 'locked', 'Menu Terkunci & Valid', false, NULL, 248500, 180, false, NULL, false, NULL),
('2026-09-22', 'PKG-B', 'Selasa', 22, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-2', 'locked', 'Menu Terkunci & Valid', false, NULL, 249200, 180, false, NULL, false, NULL),
('2026-09-23', 'PKG-C', 'Rabu', 23, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-3', 'locked', 'Menu Terkunci & Valid', false, NULL, 247800, 180, true, '{"id": "SDK-2026-041", "leadInspector": "dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)", "team": "Tim Audit Gabungan BGN & Dinkes Kota Bandung", "targetSppgName": "SPPG Sentral Sukajadi Bandung", "sppgId": "SPPG-BDG-01", "auditTime": "04:30 - 07:00 WIB", "auditFocus": "Pemeriksaan Sterilisasi Wadah Boks & Suhu Logistik Termal", "result": "Lulus Akreditasi A (Skor Sanitasi: 98/100)"}'::jsonb, false, NULL),
('2026-09-24', 'PKG-D', 'Kamis', 24, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-4', 'locked', 'Menu Terkunci & Valid', false, NULL, 248900, 180, false, NULL, false, NULL),
('2026-09-25', 'PKG-E', 'Jumat', 25, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-5', 'locked', 'Menu Terkunci & Valid', false, NULL, 248100, 180, false, NULL, false, NULL),
('2026-09-26', NULL, 'Sabtu', 26, 'September 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Pemeliharaan Dapur SPPG', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Pemeliharaan & Deep Sanitasi Rutin Fasilitas Dapur SPPG', 0, 0, false, NULL, false, NULL),
('2026-09-27', NULL, 'Minggu', 27, 'September 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Persiapan Bahan Baku Mingguan', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Penerimaan Bahan Baku Kering & Dingin dari Petani Lokal', 0, 0, false, NULL, false, NULL),
('2026-09-28', 'PKG-F', 'Senin', 28, 'September 2026', 'school_day', 'Hari Operasional Reguler (Hari Ini)', 'Siklus Menu Hari Ke-6', 'locked', 'Menu Terkunci & Valid', false, NULL, 251400, 180, true, '{"id": "SDK-2026-042", "leadInspector": "Ir. Hendra Gunawan, M.T (Inspektorat Logistik BGN)", "team": "Satgas Wilayah III Jawa Barat", "targetSppgName": "SPPG Cibiru Mandiri Sehat", "sppgId": "SPPG-BDG-04", "auditTime": "05:00 - 07:15 WIB", "auditFocus": "Pemeriksaan Kalibrasi Thermometer Digital & Sensor IoT Armada", "result": "Dalam Pelaksanaan (Sedang Berlangsung)"}'::jsonb, false, NULL),
('2026-09-29', 'PKG-G', 'Selasa', 29, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-7', 'locked', 'Menu Terkunci & Valid', false, NULL, 250800, 180, false, NULL, false, NULL),
('2026-09-30', 'PKG-C', 'Rabu', 30, 'September 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-8 (Substitusi Sapi->Rolade)', 'substitution_approved', 'Substitusi Disetujui BGN', false, NULL, 252100, 180, false, NULL, true, 'SUB-2026-001'),
('2026-10-01', 'PKG-I', 'Kamis', 1, 'Oktober 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-9', 'locked', 'Menu Terkunci & Valid', false, NULL, 250500, 180, false, NULL, false, NULL),
('2026-10-02', 'PKG-E', 'Jumat', 2, 'Oktober 2026', 'school_day', 'Hari Operasional Reguler', 'Siklus Menu Hari Ke-10 (Review Kelor->Bayam)', 'draft', 'Draft Penyusunan', false, NULL, 249800, 180, false, NULL, true, 'SUB-2026-002'),
('2026-10-03', NULL, 'Sabtu', 3, 'Oktober 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Pemeliharaan Fasilitas Dapur', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Pembersihan Chiller & Kalibrasi Timbangan', 0, 0, false, NULL, false, NULL),
('2026-10-04', NULL, 'Minggu', 4, 'Oktober 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Logistik Bahan Masuk', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Penerimaan Sayur Segar Dataran Tinggi', 0, 0, false, NULL, false, NULL),
('2026-10-05', 'PKG-A', 'Senin', 5, 'Oktober 2026', 'exam_day', 'Pekan Ujian Tengah Semester (PTS)', 'Siklus Menu Paket A (Pekan Ujian)', 'locked', 'Menu Terkunci & Valid', false, NULL, 253000, 180, false, NULL, false, NULL),
('2026-10-06', 'PKG-B', 'Selasa', 6, 'Oktober 2026', 'exam_day', 'Pekan Ujian Tengah Semester (PTS)', 'Siklus Menu Paket B (Pekan Ujian)', 'locked', 'Menu Terkunci & Valid', false, NULL, 253200, 180, false, NULL, false, NULL),
('2026-10-07', 'PKG-C', 'Rabu', 7, 'Oktober 2026', 'exam_day', 'Pekan Ujian Tengah Semester (PTS)', 'Siklus Menu Paket C (Hari Ini)', 'locked', 'Menu Terkunci & Valid', false, NULL, 252800, 180, true, '{"id": "SDK-2026-043", "leadInspector": "dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)", "team": "Satgas Khusus Kelaikan Pangan & Balai POM", "targetSppgName": "SPPG Sentral Sukajadi Bandung", "sppgId": "SPPG-BDG-01", "auditTime": "04:30 - 07:00 WIB", "auditFocus": "Sterilisasi Wadah Boks, Suhu Termal Pengiriman & Gramatur Porsi", "result": "Terjadwal Rahasia (Siap Inspeksi)"}'::jsonb, false, NULL),
('2026-10-08', 'PKG-H', 'Kamis', 8, 'Oktober 2026', 'exam_day', 'Pekan Ujian Tengah Semester (PTS)', 'Siklus Menu Paket H (Substitusi Bandeng->Kembung)', 'substitution_approved', 'Substitusi Disetujui BGN', false, NULL, 251900, 180, false, NULL, true, 'SUB-2026-003'),
('2026-10-09', 'PKG-J', 'Jumat', 9, 'Oktober 2026', 'exam_day', 'Pekan Ujian Tengah Semester (PTS)', 'Siklus Menu Paket J (Pekan Ujian)', 'locked', 'Menu Terkunci & Valid', false, NULL, 251200, 180, false, NULL, false, NULL),
('2026-10-10', NULL, 'Sabtu', 10, 'Oktober 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Audit Mingguan Dapur', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Rekapitulasi BAST & Audit Residu Siswa', 0, 0, false, NULL, false, NULL),
('2026-10-11', NULL, 'Minggu', 11, 'Oktober 2026', 'weekend', 'Akhir Pekan (Dapur Libur)', 'Persiapan Distribusi Pekan Ke-3', 'blackout', 'Libur Operasional Terkunci', true, 'Akhir Pekan - Persiapan Bahan Baku Dingin', 0, 0, false, NULL, false, NULL)
ON CONFLICT (date) DO UPDATE SET
	package_id = EXCLUDED.package_id,
	day_name = EXCLUDED.day_name,
	day_number = EXCLUDED.day_number,
	month_year = EXCLUDED.month_year,
	day_type = EXCLUDED.day_type,
	day_type_label = EXCLUDED.day_type_label,
	title = EXCLUDED.title,
	menu_status = EXCLUDED.menu_status,
	menu_status_label = EXCLUDED.menu_status_label,
	is_operational_blackout = EXCLUDED.is_operational_blackout,
	blackout_reason = EXCLUDED.blackout_reason,
	target_portions = EXCLUDED.target_portions,
	active_kitchens = EXCLUDED.active_kitchens,
	has_inspection = EXCLUDED.has_inspection,
	inspection_detail = EXCLUDED.inspection_detail,
	has_substitution = EXCLUDED.has_substitution,
	substitution_id = EXCLUDED.substitution_id,
	updated_at = NOW();
