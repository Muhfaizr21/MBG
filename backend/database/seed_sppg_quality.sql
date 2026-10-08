-- Seed data awal kontrol mutu HACCP, rilis sensori, dan sampel arsip untuk SPPG-01 dan SPPG-02

-- 1. Temp Logs (Suhu Titik Kritis)
INSERT INTO sppg_quality_temp_logs (
    id, sppg_id, point_id, batch_token, value, hold_minutes, measured_at, measured_by, evidence_name, pass, verdict
) VALUES
(
    'log-01', 'SPPG-01', 'ccp-1', 'MBG-2026-SPPG01-SDN01P-B01', 78.5, 3, '05:32', 'Ahmad Fauzi (QC Dapur)', 'probe-ayamsuh-0532.jpg', true, 'LOLOS'
),
(
    'log-02', 'SPPG-01', 'ccp-2', 'MBG-2026-SPPG01-SDN01P-B01', 64.2, 0, '05:58', 'Ahmad Fauzi (QC Dapur)', 'holding-thermal-0558.jpg', true, 'LOLOS'
),
(
    'log-03', 'SPPG-01', 'ccp-3', 'MBG-2026-SPPG01-SMPN03-B02', 4.1, 0, '05:47', 'Siti Rahma (Logistik Chiller)', 'chiller-susu-0547.jpg', true, 'LOLOS'
),
(
    'log-04', 'SPPG-02', 'ccp-1', 'MBG-2026-SPPG02-SDN02-B01', 79.0, 2, '05:25', 'Budi Santoso (QC Kebayoran)', 'probe-ikan-kuning-0525.jpg', true, 'LOLOS'
)
ON CONFLICT (id) DO UPDATE SET
    value = EXCLUDED.value,
    pass = EXCLUDED.pass,
    verdict = EXCLUDED.verdict;

-- 2. Sensory Signoffs (Lembar Rilis Mutu Ahli Gizi)
INSERT INTO sppg_quality_signoffs (
    id, sppg_id, batch_token, aspects, note, signer, signed_at, layak
) VALUES
(
    'rel-01', 'SPPG-01', 'MBG-2026-SPPG01-SDN01P-B01',
    '{"rasa": "lolos", "aroma": "lolos", "tekstur": "lolos", "visual": "lolos"}'::jsonb,
    'Ayam matang sempurna hingga tulang, aroma bumbu madu segar, kemasan boks higienis tanpa benda asing.',
    'dr. Nurul Hidayati, S.Gz (STR-2024-00192)',
    '08 Okt, 05.50 WIB', true
),
(
    'rel-02', 'SPPG-02', 'MBG-2026-SPPG02-SDN02-B01',
    '{"rasa": "lolos", "aroma": "lolos", "tekstur": "lolos", "visual": "lolos"}'::jsonb,
    'Ikan kembung bumbu kuning segar, sayur asem renyah, pH kuah stabil.',
    'Dewi Astuti, S.Gz (STR-2023-00811)',
    '08 Okt, 05.40 WIB', true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Samples (Sampel Arsip Pangan 4°C, Retensi 48 Jam)
INSERT INTO sppg_quality_samples (
    id, sppg_id, batch_token, rack_no, stored_at, stored_by, status
) VALUES
(
    'smp-01', 'SPPG-01', 'MBG-2026-SPPG01-SDN01P-B01', 'RK-A1', '2026-10-08T06:10', 'Ahmad Fauzi', 'tersimpan'
),
(
    'smp-02', 'SPPG-01', 'MBG-2026-SPPG01-SMPN03-B02', 'RK-A2', '2026-10-08T06:15', 'Ahmad Fauzi', 'tersimpan'
),
(
    'smp-03', 'SPPG-02', 'MBG-2026-SPPG02-SDN02-B01', 'RK-B1', '2026-10-08T05:45', 'Budi Santoso', 'tersimpan'
)
ON CONFLICT (id) DO NOTHING;
