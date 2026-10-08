-- ============================================================================
-- SEED DATA: SPPG RECIPES, DAILY OPERATIONAL STATE & BATCH TRACEABILITY
-- ============================================================================

-- 1. National Menu Packages (is_national = true, sppg_id = NULL)
INSERT INTO sppg_menu_packages (
    id, sppg_id, code, name, tagline, day_name, cycle, description,
    allergens, haccp_point, serving_temp_standard,
    calories, protein, carbs, fat, fiber, iron, calcium,
    ingredients, is_national
) VALUES 
(
    'paket-a', NULL, 'PAKET-A-01', 'Nasi Ayam Panggang Madu & Capcay Brokoli Segar',
    'Menu Terkunci Siklus BGN · Hari Ke-1', 'Senin, 29 September 2026', 'Siklus Menu Nasional Minggu I',
    'Kombinasi seimbang karbohidrat beras organik lokal, protein hewani ayam fillet segar bersertifikat NKV, protein nabati tahu kedelai non-GMO, serat mikro sayuran brokoli-wortel, pisang cavendish, dan susu pasteurisasi UHT 125ml.',
    '["Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"]'::jsonb,
    'CCP-1: Suhu inti masak ayam fillet wajib ≥ 75°C selama 2 menit.',
    'Penyajian hangat wadah termal ≥ 60°C, susu dingin 4°–8°C',
    545, 34.0, 68.0, 14.0, 6.2, 2.8, 280,
    '[
      {"id":"ing-1","name":"Nasi Putih / Beras Organik Lokal","category":"Karbohidrat Pokok","tkpiCode":"TKPI-A-01","perPortionGram":150,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.15,"calories":195,"protein":4.2,"carbs":43.5,"fat":0.5,"fiber":0.8,"supplier":"Gapoktan Subur Menteng Mandiri","nkvOrCert":"SNI 6729:2016 · KEMTAN RI PD 31.71","currentBatch":"LOT-BRS-2609-041","batchExpiry":"28 Des 2026","qcStatus":"PASS","qcNote":"Kadar air 13.2% (SNI <14%), bebas kutu"},
      {"id":"ing-2","name":"Daging Ayam Fillet Dada Segar","category":"Protein Hewani","tkpiCode":"TKPI-B-12","perPortionGram":80,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.08,"calories":180,"protein":23.8,"carbs":0.0,"fat":8.4,"fiber":0.0,"supplier":"PT Sumber Unggas Prima","nkvOrCert":"NKV RPHU-3171-004 · HALAL ID3121000049102","currentBatch":"LOT-AYM-20260929-082","batchExpiry":"30 Sept 2026, 12:00 WIB (Chilled 2°C)","qcStatus":"PASS","qcNote":"Uji strip formalin negatif, pH daging 5.8 segar"},
      {"id":"ing-3","name":"Tahu Putih Kedelai Segar Non-GMO","category":"Protein Nabati","tkpiCode":"TKPI-C-05","perPortionGram":50,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.05,"calories":40,"protein":4.8,"carbs":1.2,"fat":2.2,"fiber":0.6,"supplier":"Koperasi Tempe Tahu Menteng Mandiri","nkvOrCert":"SPP-IRT 2153171010023 · HALAL ID311100084","currentBatch":"LOT-THU-260929-19","batchExpiry":"30 Sept 2026, 20:00 WIB","qcStatus":"PASS","qcNote":"Tekstur kenyal alami, strip boraks & formalin 0 ppm"},
      {"id":"ing-4","name":"Sayur Brokoli & Wortel Segar","category":"Serat & Vitamin","tkpiCode":"TKPI-D-18","perPortionGram":75,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.075,"calories":35,"protein":1.8,"carbs":6.8,"fat":0.4,"fiber":3.8,"supplier":"Petani Mitra Sayur Dataran Cianjur","nkvOrCert":"Sertifikasi GAP Prima-3 No. P3-3203-019","currentBatch":"LOT-VEG-260929-55","batchExpiry":"01 Okt 2026 (Chilled 4°C)","qcStatus":"PASS","qcNote":"Pencucian ozone rinse, residu pestisida negatif"},
      {"id":"ing-5","name":"Buah Pisang Cavendish Segar","category":"Buah Segar","tkpiCode":"TKPI-E-02","perPortionGram":100,"unit":"buah (100g)","procurementUnit":"buah","multiplierPerPortion":1,"calories":89,"protein":1.1,"carbs":22.8,"fat":0.3,"fiber":2.6,"supplier":"Koperasi Buah Nusantara Sejahtera","nkvOrCert":"Sertifikat Mutu KEMTAN Prima-2 / GAP-ID","currentBatch":"LOT-FRT-260928-14","batchExpiry":"02 Okt 2026 (Suhu Ruang 22°C)","qcStatus":"PASS","qcNote":"Tingkat kematangan indeks 5, kulit mulus bebas memar"},
      {"id":"ing-6","name":"Susu Pasteurisasi UHT Segar 125ml","category":"Minuman Gizi Tambahan","tkpiCode":"TKPI-F-01","perPortionGram":125,"unit":"kotak (125ml)","procurementUnit":"kotak","multiplierPerPortion":1,"calories":80,"protein":4.2,"carbs":6.2,"fat":4.0,"fiber":0.0,"supplier":"PT Greenfields Dairy Indonesia","nkvOrCert":"NKV UHT-3507-009 · BPOM RI MD 400813011007","currentBatch":"MILK-UHT-2609A-11","batchExpiry":"15 Maret 2027","qcStatus":"PASS","qcNote":"Segel tetra pack utuh steril, uji pH 6.7 normal"}
    ]'::jsonb,
    true
),
(
    'paket-b', NULL, 'PAKET-B-02', 'Nasi Ikan Kembung Bumbu Kuning & Bayam Jagung Manis',
    'Siklus BGN · Menu Nasional Hari Ke-2', 'Selasa, 30 September 2026', 'Siklus Menu Nasional Minggu I',
    'Ikan kembung lokal kaya Omega-3 dan protein berkualitas tinggi disajikan dengan sup bayam bening jagung manis pipil kaya antioksidan dan tempe goreng renyah bumbu rempah nusantara.',
    '["Ikan Laut", "Kedelai (Tempe)"]'::jsonb,
    'CCP-1: Ikan dimasak dengan kematangan daging terpisah dari tulang (inti ≥ 75°C).',
    'Penyajian sup bening hangat ≥ 65°C',
    538, 33.5, 66.0, 13.5, 5.8, 3.1, 295,
    '[
      {"id":"ing-b1","name":"Nasi Putih / Beras Organik Lokal","category":"Karbohidrat Pokok","tkpiCode":"TKPI-A-01","perPortionGram":150,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.15,"calories":195,"protein":4.2,"carbs":43.5,"fat":0.5,"fiber":0.8,"supplier":"Gapoktan Subur Menteng Mandiri","nkvOrCert":"SNI 6729:2016 · KEMTAN RI PD 31.71","currentBatch":"LOT-BRS-2609-041","batchExpiry":"28 Des 2026","qcStatus":"PASS","qcNote":"Kadar air 13.2% (SNI <14%), bebas kutu"},
      {"id":"ing-b2","name":"Ikan Kembung Segar Laut Jawa","category":"Protein Hewani","tkpiCode":"TKPI-B-04","perPortionGram":85,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.085,"calories":165,"protein":24.5,"carbs":0.0,"fat":7.5,"fiber":0.0,"supplier":"Koperasi Nelayan Muara Angke","nkvOrCert":"SKP-KKP No. 2891 · Sertifikat Mutu HACCP","currentBatch":"LOT-IKN-20260930-011","batchExpiry":"01 Okt 2026 (Chilled 0°C - 2°C)","qcStatus":"PASS","qcNote":"Insang merah cerah, mata jernih, bebas formalin & histamin"},
      {"id":"ing-b3","name":"Tempe Kedelai Tradisional Non-GMO","category":"Protein Nabati","tkpiCode":"TKPI-C-02","perPortionGram":50,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.05,"calories":45,"protein":5.2,"carbs":2.5,"fat":2.1,"fiber":1.2,"supplier":"Koperasi Tempe Tahu Menteng Mandiri","nkvOrCert":"SPP-IRT 2153171010023-28","currentBatch":"LOT-TMP-260930-08","batchExpiry":"01 Okt 2026","qcStatus":"PASS","qcNote":"Hifa kapang putih merata, aroma fermentasi segar"},
      {"id":"ing-b4","name":"Sayur Bening Bayam & Jagung Pipil","category":"Serat & Vitamin","tkpiCode":"TKPI-D-09","perPortionGram":80,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.08,"calories":30,"protein":1.5,"carbs":6.2,"fat":0.2,"fiber":3.2,"supplier":"Petani Mitra Sayur Dataran Cianjur","nkvOrCert":"Sertifikasi GAP Prima-3 No. P3-3203-019","currentBatch":"LOT-VEG-260930-12","batchExpiry":"01 Okt 2026","qcStatus":"PASS","qcNote":"Bebas residu nitrat, daun segar tanpa lubang hama"},
      {"id":"ing-b5","name":"Buah Pepaya California Potong","category":"Buah Segar","tkpiCode":"TKPI-E-05","perPortionGram":110,"unit":"potong (110g)","procurementUnit":"kg","multiplierPerPortion":0.11,"calories":46,"protein":0.8,"carbs":11.5,"fat":0.1,"fiber":2.4,"supplier":"Koperasi Buah Nusantara Sejahtera","nkvOrCert":"Sertifikat Mutu KEMTAN Prima-2","currentBatch":"LOT-FRT-260929-21","batchExpiry":"03 Okt 2026","qcStatus":"PASS","qcNote":"Daging buah oranye ranum, manis brix 12%"},
      {"id":"ing-b6","name":"Susu Kedelai Fortifikasi Kalsium 125ml","category":"Minuman Gizi Tambahan","tkpiCode":"TKPI-F-04","perPortionGram":125,"unit":"kotak (125ml)","procurementUnit":"kotak","multiplierPerPortion":1,"calories":75,"protein":4.0,"carbs":6.0,"fat":2.8,"fiber":0.0,"supplier":"PT Soya Nusantara Sehat","nkvOrCert":"BPOM RI MD 203810012019 · Halal ID3211","currentBatch":"SOY-FORT-2609B-03","batchExpiry":"20 April 2027","qcStatus":"PASS","qcNote":"Segel rapat utuh, fortifikasi kalsium 150mg/serving"}
    ]'::jsonb,
    true
),
(
    'paket-c', NULL, 'PAKET-C-03', 'Nasi Rolade Daging Sapi & Tumis Buncis Jagung',
    'Siklus BGN · Menu Nasional Hari Ke-3', 'Rabu, 01 Oktober 2026', 'Siklus Menu Nasional Minggu I',
    'Daging sapi giling pilihan bersertifikasi Halal & NKV RPH, dipadukan dengan telur dadar gulung lembut, tumis sayuran buncis manis, buah jeruk, dan susu segar.',
    '["Daging Sapi", "Telur", "Laktosa"]'::jsonb,
    'CCP-1: Perebusan rolade daging suhu inti wajib mencapai ≥ 80°C selama 5 menit.',
    'Penyajian hangat wadah termal ≥ 60°C',
    552, 35.2, 65.5, 15.0, 5.5, 3.8, 275,
    '[
      {"id":"ing-c1","name":"Nasi Putih / Beras Organik Lokal","category":"Karbohidrat Pokok","tkpiCode":"TKPI-A-01","perPortionGram":150,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.15,"calories":195,"protein":4.2,"carbs":43.5,"fat":0.5,"fiber":0.8,"supplier":"Gapoktan Subur Menteng Mandiri","nkvOrCert":"SNI 6729:2016 · KEMTAN RI PD 31.71","currentBatch":"LOT-BRS-2609-041","batchExpiry":"28 Des 2026","qcStatus":"PASS","qcNote":"Kadar air 13.2% (SNI <14%), bebas kutu"},
      {"id":"ing-c2","name":"Rolade Daging Sapi Olahan Segar","category":"Protein Hewani","tkpiCode":"TKPI-B-08","perPortionGram":85,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.085,"calories":190,"protein":22.5,"carbs":4.0,"fat":9.2,"fiber":0.2,"supplier":"PT Berkah Ternak Nusantara","nkvOrCert":"NKV RPHR-3201-018 · Halal ID3211000018902","currentBatch":"LOT-RLD-261001-44","batchExpiry":"02 Okt 2026 (Chilled 2°C)","qcStatus":"PASS","qcNote":"Komposisi daging sapi 70%, bebas pengawet berbahaya"},
      {"id":"ing-c3","name":"Telur Puyuh & Tahu Sutra","category":"Protein Tambahan","tkpiCode":"TKPI-B-20","perPortionGram":40,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.04,"calories":50,"protein":4.5,"carbs":1.0,"fat":2.8,"fiber":0.1,"supplier":"Peternakan Unggas Sejahtera Bogor","nkvOrCert":"NKV UPTU-3201-009","currentBatch":"LOT-TLR-261001-12","batchExpiry":"10 Okt 2026","qcStatus":"PASS","qcNote":"Cangkang bersih disinfeksi food grade, kuning telur padat"},
      {"id":"ing-c4","name":"Tumis Buncis & Jagung Pipil Manis","category":"Serat & Vitamin","tkpiCode":"TKPI-D-12","perPortionGram":75,"unit":"gram","procurementUnit":"kg","multiplierPerPortion":0.075,"calories":32,"protein":1.6,"carbs":6.2,"fat":0.3,"fiber":3.4,"supplier":"Petani Mitra Sayur Dataran Cianjur","nkvOrCert":"Sertifikasi GAP Prima-3 No. P3-3203-019","currentBatch":"LOT-VEG-261001-77","batchExpiry":"02 Okt 2026","qcStatus":"PASS","qcNote":"Tekstur renyah, pencucian higienis ozone water"},
      {"id":"ing-c5","name":"Buah Jeruk Manis Medan","category":"Buah Segar","tkpiCode":"TKPI-E-01","perPortionGram":100,"unit":"buah (100g)","procurementUnit":"buah","multiplierPerPortion":1,"calories":45,"protein":0.9,"carbs":11.2,"fat":0.2,"fiber":2.2,"supplier":"Koperasi Buah Nusantara Sejahtera","nkvOrCert":"Sertifikat Mutu KEMTAN Prima-2","currentBatch":"LOT-JRK-260930-88","batchExpiry":"05 Okt 2026","qcStatus":"PASS","qcNote":"Kulit segar mengkilap, air perasan melimpah manis"},
      {"id":"ing-c6","name":"Susu Pasteurisasi UHT Segar 125ml","category":"Minuman Gizi Tambahan","tkpiCode":"TKPI-F-01","perPortionGram":125,"unit":"kotak (125ml)","procurementUnit":"kotak","multiplierPerPortion":1,"calories":80,"protein":4.2,"carbs":6.2,"fat":4.0,"fiber":0.0,"supplier":"PT Greenfields Dairy Indonesia","nkvOrCert":"NKV UHT-3507-009 · BPOM RI MD 400813011007","currentBatch":"MILK-UHT-2609A-11","batchExpiry":"15 Maret 2027","qcStatus":"PASS","qcNote":"Segel tetra pack utuh steril, uji pH 6.7 normal"}
    ]'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    ingredients = EXCLUDED.ingredients,
    calories = EXCLUDED.calories,
    protein = EXCLUDED.protein,
    carbs = EXCLUDED.carbs,
    fat = EXCLUDED.fat,
    fiber = EXCLUDED.fiber,
    iron = EXCLUDED.iron,
    calcium = EXCLUDED.calcium,
    haccp_point = EXCLUDED.haccp_point,
    is_national = true;

-- 2. Daily Operational State untuk SPPG-01 (Menteng) & SPPG-02 (Kebayoran)
INSERT INTO sppg_recipe_daily_states (
    sppg_id, date, selected_package_id, active_cohort, portion_count,
    is_locked, locked_at, locked_by, verified_by
) VALUES
(
    'SPPG-01', CURRENT_DATE, 'paket-a', 'sd_atas', 2500,
    true, NOW() - INTERVAL '12 hours', 'Kepala Dapur Sentral SPPG-01', 'Satgas MBG Wilayah Pusat · dr. Sp.GK Hendrawan'
),
(
    'SPPG-02', CURRENT_DATE, 'paket-b', 'sd_atas', 2300,
    false, NULL, NULL, 'Satgas MBG Wilayah Selatan'
)
ON CONFLICT (sppg_id, date) DO UPDATE SET
    selected_package_id = EXCLUDED.selected_package_id,
    portion_count = EXCLUDED.portion_count,
    active_cohort = EXCLUDED.active_cohort;

-- 3. Batch Traceability Logs untuk SPPG-01 & SPPG-02
INSERT INTO sppg_ingredient_batches (
    id, sppg_id, commodity, batch_no, supplier, nkv_number, halal_cert_no,
    incoming_date, expiry_date, storage_temp, qc_inspector, qc_result, qc_status, quantity_received
) VALUES
(
    'batch-01', 'SPPG-01', 'Daging Ayam Fillet Dada Segar', 'LOT-AYM-20260929-082',
    'PT Sumber Unggas Prima', 'NKV RPHU-3171-004 (Level 1 Prima)', 'ID31210000491020224',
    NOW() - INTERVAL '1 day', '30 Sept 2026 · 12:00 WIB', '2.1°C (Chiller Daging)',
    'drh. Ratna Dewi (QC Pangan Dapur)', 'Lolos Formalin, Uji pH 5.8, Suhu Dingin Terjaga', 'VERIFIED', '200 kg (10 krat berinsulasi)'
),
(
    'batch-02', 'SPPG-01', 'Susu Pasteurisasi UHT 125ml', 'MILK-UHT-2609A-11',
    'PT Greenfields Dairy Indonesia', 'NKV UHT-3507-009', 'ID00410000129840321',
    NOW() - INTERVAL '2 days', '15 Maret 2027', '5.2°C (Cold Room Susu)',
    'Ahmad Fauzi, S.T.P. (Quality Release)', 'Segel Tetra Pack Utuh, Uji Mikrobiologi Negatif', 'VERIFIED', '2.500 kotak (104 karton)'
),
(
    'batch-03', 'SPPG-01', 'Beras Pulen Organik Menteng', 'LOT-BRS-2609-041',
    'Gapoktan Subur Menteng Mandiri', 'KEMTAN RI PD 31.71-A.I.000-01-0021-04/24', 'ID31110008492010926',
    NOW() - INTERVAL '3 days', '28 Des 2026', '24°C / RH 52% (Dry Storage)',
    'Rahmat Hidayat (Logistik Bahan Kering)', 'Kadar Air 13.2%, Derajat Sosoh 98%, Bebas Kutu', 'VERIFIED', '375 kg (15 karung @25kg)'
),
(
    'batch-04', 'SPPG-02', 'Ikan Kembung Segar Muara Angke', 'LOT-IKN-20260930-011',
    'Koperasi Nelayan Muara Angke', 'SKP-KKP No. 2891', 'Halal ID3121009',
    NOW() - INTERVAL '1 day', '01 Okt 2026 · Chilled', '0.5°C (Chiller Ikan)',
    'drh. Maya Lestari (QC Dapur SPPG-02)', 'Mata Jernih, Insang Merah, Negatif Formalin', 'VERIFIED', '195.5 kg (8 box coolpack)'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Substitusi Bahan Darurat untuk SPPG-01
INSERT INTO menu_substitutions (
    id, sppg_id, date, cycle_code, region, original_ingredient, substitute_ingredient,
    reason, nutrition_comparison, nutritionist_review, status, status_label,
    menu_code, evidence_photo_url, evidence_file_name
) VALUES
(
    'SUB-2026-0929-01', 'SPPG-01', CURRENT_DATE, 'PAKET-A-01', 'DKI Jakarta - Menteng',
    'Daging Ayam Fillet Dada Segar', 'Ikan Kembung Segar Laut Jawa',
    'Pasokan ayam potong lokal tertunda pengiriman akibat kendala rantai dingin supplier.',
    '{"proteinDiff": "-0.3g", "caloriesDiff": "-5 kkal", "isCompliant": true}'::jsonb,
    'Kandungan asam lemak Omega-3 ikan kembung melimpah dan aman sebagai substitusi setara protein hewani.',
    'APPROVED', 'Disetujui Ahli Gizi BGN',
    'PAKET-A-01', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
    'Dokumen_Berita_Acara_Pasar_29Sept.pdf'
),
(
    'SUB-2026-0929-03', 'SPPG-01', CURRENT_DATE, 'PAKET-A-01', 'DKI Jakarta - Menteng',
    'Brokoli Hijau Dataran Tinggi', 'Buncis Baby & Wortel Manis Organik',
    'Hujan lebat di sentra perkebunan menyebabkan keterlambatan truk suplai brokoli 3 jam. Buncis baby organik segar siap di chiller dapur dengan gramatur dan serat setara.',
    '{"proteinDiff": "+0.1g", "caloriesDiff": "+1 kkal", "isCompliant": true}'::jsonb,
    'Menunggu tanda tangan digital Ahli Gizi BGN.',
    'PENDING', 'Menunggu Verifikasi Satgas',
    'PAKET-A-01', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    'Berita_Acara_Keterlambatan_Truk_29Sept.jpg'
)
ON CONFLICT (id) DO NOTHING;
