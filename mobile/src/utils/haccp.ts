/**
 * Status kelayakan pangan HACCP 4 jam.
 * Sumber: VALIDATOR.md Bab 1.B.2 (hijau > 90 menit, kuning 30-90 menit,
 * merah 0 menit / kedaluwarsa).
 */
export const HACCP_TOTAL_MINUTES = 240;
export const HACCP_WARNING_MINUTES = 90;
export const HACCP_CRITICAL_MINUTES = 0;

export type HaccpState = 'safe' | 'warning' | 'critical';

export interface HaccpView {
  state: HaccpState;
  label: string;
  guidance: string;
  color: string;
  /** Persentase sisa waktu terhadap 240 menit, 0-100 untuk arc ring. */
  ratio: number;
  minutes: number;
}

export const getHaccpState = (minutes: number): HaccpState => {
  if (minutes <= HACCP_CRITICAL_MINUTES) return 'critical';
  if (minutes <= HACCP_WARNING_MINUTES) return 'warning';
  return 'safe';
};

export const getHaccpView = (minutes: number): HaccpView => {
  const state = getHaccpState(minutes);
  const clamped = Math.min(Math.max(minutes, 0), HACCP_TOTAL_MINUTES);

  if (state === 'critical') {
    return {
      state,
      label: 'Kedaluwarsa',
      guidance: 'Jangan bagikan makanan. Kunci scan aktif sampai batch ditarik.',
      color: '#B91C1C',
      ratio: 0,
      minutes: clamped,
    };
  }

  if (state === 'warning') {
    return {
      state,
      label: 'Waspada',
      guidance: 'Segera instruksikan pembagian ke kelas sebelum jam aman habis.',
      color: '#B45309',
      ratio: (clamped / HACCP_TOTAL_MINUTES) * 100,
      minutes: clamped,
    };
  }

  return {
    state,
    label: 'Aman',
    guidance: 'Jam aman konsumsi masih longgar, boleh menunggu proses serah terima.',
    color: '#15803D',
    ratio: (clamped / HACCP_TOTAL_MINUTES) * 100,
    minutes: clamped,
  };
};
