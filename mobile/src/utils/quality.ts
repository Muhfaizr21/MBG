/**
 * Aturan keputusan mutu lapangan.
 * Sumber: VALIDATOR.md Bab 2.B.1-3 (verifikasi QR, deteksi visual, kartu keputusan).
 */

export const MIN_CORE_TEMP_C = 75; // Suhu masak inti saat pelepasan dari dapur
export const MIN_HOLDING_TEMP_C = 60; // Suhu holding saat serah terima
export const WARN_CONSUMPTION_MINUTES = 45; // Sisa waktu di bawah ini jadi peringatan
export const SCORE_WASPADA = 80;
export const SCORE_LAYAK = 95;

export type Verdict = 'layak' | 'waspada' | 'ditolak';

export interface QrPayload {
  code: string;
  producer: string; // SPPG dapur produsen
  slhs: string; // Nomor Sertifikasi Laik Higiene Sanitasi
  school: string; // Sekolah tujuan
  cookFinishedAt: string; // "06:00 WIB"
  coreTempC: number;
}

export interface QrCheck {
  key: string;
  label: string;
  value: string;
  passed: boolean;
  requirement: string;
}

export interface QrVerdict {
  valid: boolean;
  checks: QrCheck[];
  failures: string[];
}

export const verifyQrPayload = (payload: QrPayload, expectedSchool: string): QrVerdict => {
  const checks: QrCheck[] = [
    {
      key: 'producer',
      label: 'Asal dapur',
      value: payload.producer,
      passed: payload.producer.length > 0,
      requirement: 'Wajib mencantumkan SPPG penghasil',
    },
    {
      key: 'slhs',
      label: 'Sertifikasi SLHS',
      value: payload.slhs,
      passed: /^SLHS-\d{5}$/.test(payload.slhs),
      requirement: 'Format SLHS-00000 dan masih berlaku',
    },
    {
      key: 'school',
      label: 'Sekolah tujuan',
      value: payload.school,
      passed: payload.school === expectedSchool,
      requirement: `Harus sama dengan sekolah ini, ${expectedSchool}`,
    },
    {
      key: 'cook-time',
      label: 'Selesai masak',
      value: payload.cookFinishedAt,
      passed: Boolean(payload.cookFinishedAt),
      requirement: 'Wajib ada, batas aman konsumsi 4 jam dari waktu ini',
    },
    {
      key: 'core-temp',
      label: 'Suhu masak inti',
      value: `${payload.coreTempC}°C`,
      passed: payload.coreTempC >= MIN_CORE_TEMP_C,
      requirement: `Minimal ${MIN_CORE_TEMP_C}°C saat keluar dari dapur`,
    },
  ];

  const failures = checks.filter((check) => !check.passed).map((check) => check.label);

  return { valid: failures.length === 0, checks, failures };
}

export interface QualitySignals {
  /** Skor keamanan 0-100 dari deteksi visual. */
  score: number;
  holdingTempC: number;
  minutesToDeadline: number;
  qrValid: boolean;
}

export interface QualityVerdict {
  verdict: Verdict;
  label: string;
  color: string;
  action: string;
  reasons: string[];
}

const VERDICT_COPY: Record<Verdict, Omit<QualityVerdict, 'reasons'>> = {
  layak: {
    verdict: 'layak',
    label: 'Layak konsumsi',
    color: '#15803D',
    action: 'Setujui porsi dan lanjutkan ke kelas.',
  },
  waspada: {
    verdict: 'waspada',
    label: 'Konsumsi segera',
    color: '#B45309',
    action: 'Bagikan ke kelas lebih dulu, jangan ditahan.',
  },
  ditolak: {
    verdict: 'ditolak',
    label: 'Tidak layak konsumsi',
    color: '#B91C1C',
    action: 'Kunci boks, amankan sampel, lalu ajukan penarikan batch.',
  },
};

export const decideQuality = (signals: QualitySignals): QualityVerdict => {
  const reasons: string[] = [];

  if (!signals.qrValid) {
    reasons.push('QR boks gagal verifikasi');
  }
  if (signals.holdingTempC < MIN_HOLDING_TEMP_C) {
    reasons.push(`Suhu holding ${signals.holdingTempC}°C di bawah ${MIN_HOLDING_TEMP_C}°C`);
  }
  if (signals.minutesToDeadline <= 0) {
    reasons.push('Jam aman konsumsi sudah habis');
  } else if (signals.minutesToDeadline < WARN_CONSUMPTION_MINUTES) {
    reasons.push(`Sisa waktu ${signals.minutesToDeadline} menit, di bawah ${WARN_CONSUMPTION_MINUTES} menit`);
  }

  // Ditolak begitu QR tidak valid atau syarat kritisnya gagal. Skor hanya
  // membedakan "layak" dari "waspada", tidak boleh menoleransi kegagalan kritis.
  const blocked = !signals.qrValid || reasons.length > 0;
  const verdict: Verdict = blocked
    ? 'ditolak'
    : signals.score >= SCORE_LAYAK
      ? 'layak'
      : signals.score >= SCORE_WASPADA
        ? 'waspada'
        : 'ditolak';

  if (verdict === 'waspada') {
    reasons.push(`Skor keamanan ${signals.score}, di bawah ${SCORE_LAYAK}`);
  } else if (verdict === 'ditolak' && reasons.length === 0) {
    reasons.push(`Skor keamanan ${signals.score}, di bawah ${SCORE_WASPADA}`);
  }

  return { ...VERDICT_COPY[verdict], reasons };
};
