-- Seeding data batch masak dan label QR untuk SPPG-01 dan SPPG-02

INSERT INTO sppg_batches (
    id, sppg_id, token, seq, school_id, school_code, school_name, menu_code, menu_name,
    box_count, cooked_at, consume_by, cook_temp, allergens, status, verified, checksum,
    cooking_date, target_portions, actual_portions, core_temp_c, cook_lead, qc_status, haccp_status
) VALUES
(
    'batch-20261008-01', 'SPPG-01', 'MBG-2026-SPPG01-SDN01P-B01', 1,
    'sch-01', 'SDN01P', 'SDN Menteng 01 Pagi', 'PAKET-A-01',
    'Nasi Ayam Panggang Madu & Capcay Brokoli Segar', 650, '05:40', '09:40',
    78.5, '["Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"]'::jsonb,
    'ready', true, '8d89e5a872659350a4175b9f7a83d7350cb68037da30b42f6381283d5f9e2bfb',
    CURRENT_DATE, 650, 650, 78.5, 'Chef Rahmat Hidayat', 'passed', 'safe'
),
(
    'batch-20261008-02', 'SPPG-01', 'MBG-2026-SPPG01-SMPN03-B02', 2,
    'sch-03', 'SMPN03', 'SMPN 3 Jakarta', 'PAKET-A-01',
    'Nasi Ayam Panggang Madu & Capcay Brokoli Segar', 750, '05:55', '09:55',
    77.9, '["Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"]'::jsonb,
    'queued', false, '5c1825fa77317f22312b21703e33b934b17135e80dc61df40003bfa8674dcf7f',
    CURRENT_DATE, 750, 750, 77.9, 'Chef Rahmat Hidayat', 'passed', 'safe'
),
(
    'batch-20261008-03', 'SPPG-01', 'MBG-2026-SPPG01-SDN01C-B03', 3,
    'sch-04', 'SDN01C', 'SDN Cikini 01', 'PAKET-A-01',
    'Nasi Ayam Panggang Madu & Capcay Brokoli Segar', 550, '06:05', '10:05',
    78.1, '["Kedelai (Tahu/Kecap)", "Laktosa (Susu Sapi)"]'::jsonb,
    'draft', false, 'a4efb38793b593671a52b8602c66d21394a12361dc6109df1343bfa8674d89fa',
    CURRENT_DATE, 550, 550, 78.1, 'Chef Rahmat Hidayat', 'passed', 'safe'
),
(
    'batch-20261008-04', 'SPPG-02', 'MBG-2026-SPPG02-SDN02-B01', 1,
    'sch-02', 'SDN02', 'SDN Kebayoran Baru 02', 'PAKET-B-02',
    'Nasi Ikan Kembung Bumbu Kuning & Sayur Asem', 800, '05:30', '09:30',
    79.0, '["Ikan Laut"]'::jsonb,
    'ready', true, '33a871b9c8b7470f7cfd30a841209b5ca3123847a9ef3879201948381283d735',
    CURRENT_DATE, 800, 800, 79.0, 'Chef Joko Priyono', 'passed', 'safe'
)
ON CONFLICT (id) DO UPDATE SET
    token = EXCLUDED.token,
    seq = EXCLUDED.seq,
    school_id = EXCLUDED.school_id,
    school_code = EXCLUDED.school_code,
    school_name = EXCLUDED.school_name,
    menu_code = EXCLUDED.menu_code,
    menu_name = EXCLUDED.menu_name,
    box_count = EXCLUDED.box_count,
    cooked_at = EXCLUDED.cooked_at,
    consume_by = EXCLUDED.consume_by,
    cook_temp = EXCLUDED.cook_temp,
    allergens = EXCLUDED.allergens,
    status = EXCLUDED.status,
    verified = EXCLUDED.verified,
    checksum = EXCLUDED.checksum,
    cooking_date = EXCLUDED.cooking_date,
    updated_at = NOW();
