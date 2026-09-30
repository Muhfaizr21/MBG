/**
 * Aturan serah terima dan penerbitan BAST.
 * Sumber: VALIDATOR.md Bab 3.B (Master Tote, suhu holding, rekonsiliasi, tanda
 * tangan) dan SPPG.md Bab 7.
 */

export const PORTIONS_PER_TOTE = 50;
export const MIN_WARM_TEMP_C = 60;
export const COLD_TEMP_MIN_C = 4;
export const COLD_TEMP_MAX_C = 8;
export const DANGER_ZONE_C = 55;

export type ContainerKind = 'hangat' | 'dingin';
export type TempStatus = 'aman' | 'waspada' | 'bahaya';

export interface TemperatureReading {
  status: TempStatus;
  label: string;
  message: string;
  requiresOrganoleptic: boolean;
  color: string;
}

export const evaluateTemperature = (tempC: number, kind: ContainerKind): TemperatureReading => {
  if (!Number.isFinite(tempC)) {
    return {
      status: 'bahaya',
      label: 'Belum diukur',
      message: 'Masukkan angka suhu termometer boks.',
      requiresOrganoleptic: false,
      color: '#64748B',
    };
  }

  if (kind === 'dingin') {
    const inRange = tempC >= COLD_TEMP_MIN_C && tempC <= COLD_TEMP_MAX_C;
    return {
      status: inRange ? 'aman' : 'waspada',
      label: inRange ? 'Aman' : 'Di luar rentang',
      message: inRange
        ? `Rentang dingin ${COLD_TEMP_MIN_C}-${COLD_TEMP_MAX_C}°C terpenuhi.`
        : `Buah dan susu dingin harus ${COLD_TEMP_MIN_C}-${COLD_TEMP_MAX_C}°C.`,
      requiresOrganoleptic: !inRange,
      color: inRange ? '#15803D' : '#B45309',
    };
  }

  if (tempC >= MIN_WARM_TEMP_C) {
    return {
      status: 'aman',
      label: 'Aman',
      message: `Holding di atas ${MIN_WARM_TEMP_C}°C.`,
      requiresOrganoleptic: false,
      color: '#15803D',
    };
  }

  if (tempC < DANGER_ZONE_C) {
    return {
      status: 'bahaya',
      label: 'Zona bahaya',
      message: `Di bawah ${DANGER_ZONE_C}°C, makanan berisiko dingin dan wajib diuji organoleptik.`,
      requiresOrganoleptic: true,
      color: '#B91C1C',
    };
  }

  return {
    status: 'waspada',
    label: 'Di bawah standar',
    message: `Di bawah ${MIN_WARM_TEMP_C}°C, di atas zona bahaya.`,
    requiresOrganoleptic: true,
    color: '#B45309',
  };
};

export interface ReconciliationInput {
  orderedPortions: number;
  totesReceived: number;
  damagedPortions: number;
  portionsPerTote?: number;
}

export interface Reconciliation {
  receivedPortions: number;
  damagedPortions: number;
  /** Selisih antara porsi diterima dan porsi pesanan. */
  discrepancy: number;
  balanced: boolean;
  message: string;
}

export const reconcile = (input: ReconciliationInput): Reconciliation => {
  const perTote = input.portionsPerTote ?? PORTIONS_PER_TOTE;
  const receivedPortions = input.totesReceived * perTote;
  const discrepancy = receivedPortions - input.damagedPortions - input.orderedPortions;

  return {
    receivedPortions,
    damagedPortions: input.damagedPortions,
    discrepancy,
    balanced: discrepancy === 0,
    message:
      discrepancy === 0
        ? 'Porsi diterima, dikurangi kerusakan, sama dengan kuota pesanan.'
        : discrepancy > 0
          ? `${discrepancy} porsi lebih banyak dari pesanan.`
          : `${Math.abs(discrepancy)} porsi kurang dari pesanan.`,
  };
};

export interface BastIssuanceInput {
  totesExpected: number;
  totesReceived: number;
  hasUnsafeTemperature: boolean;
  organolepticDone: boolean;
  damagedBalanced: boolean;
  driverSigned: boolean;
  teacherSigned: boolean;
}

export interface BastReadiness {
  ready: boolean;
  blockers: string[];
}

export const checkBastReadiness = (input: BastIssuanceInput): BastReadiness => {
  const blockers: string[] = [];

  if (input.totesReceived === 0) {
    blockers.push('Belum ada tote yang diterima.');
  } else if (input.totesReceived < input.totesExpected) {
    blockers.push(
      `${input.totesExpected - input.totesReceived} tote belum diterima, catatan serah terima belum lengkap.`,
    );
  }
  if (input.hasUnsafeTemperature && !input.organolepticDone) {
    blockers.push('Masih ada suhu di bawah standar yang belum diuji organoleptik.');
  }
  if (!input.damagedBalanced) {
    blockers.push('Rekonsiliasi porsi belum balance.');
  }
  if (!input.driverSigned) {
    blockers.push('Tanda tangan petugas pengantar belum ada.');
  }
  if (!input.teacherSigned) {
    blockers.push('Tanda tangan guru validator belum ada.');
  }

  return { ready: blockers.length === 0, blockers };
};

/** Nomor registrasi mengikuti format BAST/MBG-JKT/20260930/SDN01P-042. */
export const buildRegistrationNumber = (params: {
  cityCode: string;
  date: Date;
  npsnSuffix: string;
  sequence: number;
}): string => {
  const { cityCode, date, npsnSuffix, sequence } = params;
  const ymd = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('');
  const seq = String(sequence).padStart(3, '0');

  return `BAST/MBG-${cityCode}/${ymd}/${npsnSuffix}-${seq}`;
};
