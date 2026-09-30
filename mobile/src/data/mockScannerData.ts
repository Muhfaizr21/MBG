// Data prototipe untuk halaman pemindai. Tidak ada kamera, tidak ada model
// YOLOv8, tidak ada API gateway di repo ini, jadi semua payload dan skor di bawah
// adalah skenario yang dipilih guru, bukan hasil pengukuran (R-17, R-38).
import { QrPayload } from '../utils/quality';
import { GradeBand } from '../utils/nutrition';

export type ScenarioKey = 'layak' | 'waspada' | 'ditolak';

export interface AnomalySignal {
  key: string;
  label: string;
  /** Deteksi spesik yang ditemukan model, dalam bahasa guru. */
  finding: string;
  severity: 'none' | 'warning' | 'critical';
}

export interface ScanScenario {
  key: ScenarioKey;
  label: string;
  description: string;
  payload: QrPayload;
  holdingTempC: number;
  minutesToDeadline: number;
  score: number;
  portions: number;
  signals: AnomalySignal[];
}

export const SCAN_SCHOOL = 'SDN Menteng 01 Pagi';

export const MOCK_MACRO_ESTIMATE: Record<string, number> = {
  energi: 545,
  protein: 34,
  karbohidrat: 68,
  lemak: 14,
  serat: 7.1,
};

export const SCAN_GRADE_BAND: GradeBand = 'sd_atas';

const NO_ANOMALY: AnomalySignal[] = [
  { key: 'protein', label: 'Daging & ikan', finding: 'Warna dan tekstur normal', severity: 'none' },
  { key: 'sayur', label: 'Sayuran', finding: 'Daun segar, kuah tidak berbusa', severity: 'none' },
  { key: 'nasi', label: 'Nasi', finding: 'Tidak ada titik jamur', severity: 'none' },
  { key: 'asing', label: 'Benda asing', finding: 'Tidak ditemukan', severity: 'none' },
];

export const MOCK_SCAN_SCENARIOS: ScanScenario[] = [
  {
    key: 'layak',
    label: 'Aman',
    description: 'QR valid, semua komponen segar',
    payload: {
      code: 'MBG-2026-SPPG04-SDN01P-B05',
      producer: 'SPPG Menteng Jaya (Dapur #04)',
      slhs: 'SLHS-48210',
      school: SCAN_SCHOOL,
      cookFinishedAt: '06:00 WIB',
      coreTempC: 78,
    },
    holdingTempC: 65,
    minutesToDeadline: 150,
    score: 97,
    portions: 50,
    signals: NO_ANOMALY,
  },
  {
    key: 'waspada',
    label: 'Waspada',
    description: 'Suhu boks mendekati batas, Sayur mulai layu',
    payload: {
      code: 'MBG-2026-SPPG04-SDN01P-B05',
      producer: 'SPPG Menteng Jaya (Dapur #04)',
      slhs: 'SLHS-48210',
      school: SCAN_SCHOOL,
      cookFinishedAt: '06:00 WIB',
      coreTempC: 76,
    },
    holdingTempC: 58,
    minutesToDeadline: 40,
    score: 88,
    portions: 50,
    signals: [
      { key: 'protein', label: 'Daging & ikan', finding: 'Warna dan tekstur normal', severity: 'none' },
      {
        key: 'sayur',
        label: 'Sayuran',
        finding: 'Daun brokoli mulai layu di tepi',
        severity: 'warning',
      },
      { key: 'nasi', label: 'Nasi', finding: 'Tekstur sedikit lembek', severity: 'warning' },
      { key: 'asing', label: 'Benda asing', finding: 'Tidak ditemukan', severity: 'none' },
    ],
  },
  {
    key: 'ditolak',
    label: 'Ditolak',
    description: 'QR salah rute, nasi berjamur, benda asing',
    payload: {
      code: 'MBG-2026-SPPG07-SDN02P-B11',
      producer: 'SPPG Pasar Minggu (Dapur #07)',
      slhs: 'SLHS-91337',
      school: 'SDN Pegangsaan 02',
      cookFinishedAt: '05:40 WIB',
      coreTempC: 71,
    },
    holdingTempC: 48,
    minutesToDeadline: 20,
    score: 62,
    portions: 50,
    signals: [
      {
        key: 'protein',
        label: 'Daging & ikan',
        finding: 'Ayam pucat dengan lendir permukaan',
        severity: 'critical',
      },
      {
        key: 'sayur',
        label: 'Sayuran',
        finding: 'Kuah keruh berbusa',
        severity: 'critical',
      },
      {
        key: 'nasi',
        label: 'Nasi',
        finding: 'Titik jamur cokelat terlihat pada butiran',
        severity: 'critical',
      },
      {
        key: 'asing',
        label: 'Benda asing',
        finding: 'Serpihan plastik ditemukan',
        severity: 'critical',
      },
    ],
  },
];
