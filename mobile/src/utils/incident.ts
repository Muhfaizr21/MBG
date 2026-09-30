/**
 * Kategori insiden dan penentuan derajat keparahan.
 * Sumber: VALIDATOR.md Bab 4.B.1-3.
 *
 * Aroma, benda asing, kematangan, dan reaksi alergi adalah kontaminasi yang
 * berhenti di makanan. Kemasan pecah dan suhu drop adalah masalah logistik.
 * Pemisahan inilah yang menentukan berat masalah, bukan pilihan tampilan.
 */

export const INCIDENT_CATEGORIES = [
  {
    key: 'aroma',
    label: 'Aroma asam atau basi',
    hint: 'Bau menyengat, berbusa, atau rasa asam',
    class: 'kontaminasi' as const,
  },
  {
    key: 'benda_asing',
    label: 'Benda asing',
    hint: 'Serangga, rambut, kawat cuci, serpihan plastik',
    class: 'kontaminasi' as const,
  },
  {
    key: 'kematangan',
    label: 'Kematangan tidak sempurna',
    hint: 'Daging masih berdarah atau mentah di bagian dalam',
    class: 'kontaminasi' as const,
  },
  {
    key: 'alergi',
    label: 'Reaksi alergi atau siswa mengeluh sakit',
    hint: 'Gatal, pusing, atau mual pasca mencicipi',
    class: 'kontaminasi' as const,
  },
  {
    key: 'suhu_drop',
    label: 'Suhu drop dan basi logistik',
    hint: 'Boks sampai sekolah di bawah 50°C',
    class: 'logistik' as const,
  },
  {
    key: 'kemasan_pecah',
    label: 'Kemasan pecah atau bocor',
    hint: 'Segel terbuka dan makanan tercemar debu jalan',
    class: 'logistik' as const,
  },
] as const;

export type IncidentCategoryKey = (typeof INCIDENT_CATEGORIES)[number]['key'];
export type IncidentClass = (typeof INCIDENT_CATEGORIES)[number]['class'];

export type Severity = 'rendah' | 'sedang' | 'tinggi';

export interface SeverityInfo {
  severity: Severity;
  label: string;
  color: string;
  instruction: string;
  /** Derajat tinggi berarti seluruh batch diisolasi, bukan satu boks. */
  isolatesWholeBatch: boolean;
  reasons: string[];
}

const SEVERITY_BY_LEVEL: Record<Severity, { label: string; color: string }> = {
  rendah: { label: 'Rendah', color: '#B45309' },
  sedang: { label: 'Sedang', color: '#C2410C' },
  tinggi: { label: 'Tinggi, darurat merah', color: '#B91C1C' },
};

const RANK: Record<Severity, number> = { rendah: 1, sedang: 2, tinggi: 3 };
const highest = (a: Severity, b: Severity): Severity => (RANK[a] >= RANK[b] ? a : b);

/** Batas "cukup disisihkan 1-2 boks" dari VALIDATOR.md Bab 4.B.3. */
export const ISOLATED_PORTION_LIMIT = 2;
/** Batas suhu yang membuat boks masuk kategori basi logistik. */
export const COLD_ARRIVAL_LIMIT_C = 50;
/** Keterlambatan yang menaikkan derajat jadi sedang. */
export const LATE_THRESHOLD_MINUTES = 30;

export interface SeverityInput {
  categories: IncidentCategoryKey[];
  affectedPortions: number;
  arrivalTempC?: number;
  lateMinutes?: number;
}

export const deriveSeverity = (input: SeverityInput): SeverityInfo => {
  const reasons: string[] = [];
  let level: Severity = 'rendah';

  const selected = INCIDENT_CATEGORIES.filter((category) =>
    input.categories.includes(category.key),
  );
  const contamination = selected.filter((category) => category.class === 'kontaminasi');

  if (contamination.length > 0) {
    level = 'tinggi';
    reasons.push(
      `kontaminasi pada ${contamination
        .map((category) => category.label.toLowerCase())
        .join(', ')}`,
    );
  }

  if (selected.some((category) => category.key === 'suhu_drop')) {
    const temp = input.arrivalTempC;
    if (temp === undefined) {
      level = highest(level, 'sedang');
      reasons.push('suhu boks saat tiba belum dicatat');
    } else {
      const isCold = temp < COLD_ARRIVAL_LIMIT_C;
      level = highest(level, isCold ? 'tinggi' : 'sedang');
      reasons.push(`suhu tiba ${temp}°C, batas basi ${COLD_ARRIVAL_LIMIT_C}°C`);
    }
  }

  if (selected.some((category) => category.key === 'kemasan_pecah')) {
    reasons.push('kemasan pecah, bisa diselesaikan dengan menyisihkan porsi');
  }

  if ((input.lateMinutes ?? 0) > LATE_THRESHOLD_MINUTES) {
    level = highest(level, 'sedang');
    reasons.push(`keterlambatan kiriman ${input.lateMinutes} menit`);
  }

  if (level === 'rendah' && input.affectedPortions > ISOLATED_PORTION_LIMIT) {
    level = 'sedang';
    reasons.push(
      `${input.affectedPortions} porsi terdampak, di atas batas ${ISOLATED_PORTION_LIMIT} porsi yang boleh disisihkan`,
    );
  }

  const copy = SEVERITY_BY_LEVEL[level];
  const instruction =
    level === 'tinggi'
      ? 'Isolasi seluruh boks yang ada di sekolah ini.'
      : level === 'sedang'
        ? 'Sisihkan porsi terdampak, minta penggantinya, dan catat nomor boksnya.'
        : `Sisihkan 1 sampai ${ISOLATED_PORTION_LIMIT} boks dan ganti dengan porsi cadangan sekolah.`;

  return {
    severity: level,
    label: copy.label,
    color: copy.color,
    instruction,
    isolatesWholeBatch: level === 'tinggi',
    reasons,
  };
};

export const TICKET_STAGES = [
  'Terkirim',
  'Sedang diinvestigasi tim medis',
  'Pengganti sedang dikirim',
  'Selesai',
] as const;

export type TicketStage = (typeof TICKET_STAGES)[number];

export interface IncidentTicket {
  id: string;
  createdAt: Date;
  categories: IncidentCategoryKey[];
  affectedPortions: number;
  severity: Severity;
  /** Selalu false di prototipe: tidak ada server Satuan Tugas MBG. */
  sentToCommandCenter: boolean;
}

/** Nomor tiket mengikuti format INS/JKT/20260930/SDN01P-003. */
export const buildTicketId = (params: {
  cityCode: string;
  date: Date;
  npsnSuffix: string;
  sequence: number;
}): string => {
  const { cityCode, date, npsnSuffix, sequence } = params;
  const ymd = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
    .join('');

  return `INS/MBG-${cityCode}/${ymd}/${npsnSuffix}-${String(sequence).padStart(3, '0')}`;
};

export interface WatermarkMeta {
  capturedAt: string;
  schoolName: string;
  gps: string;
  batchId: string;
}
