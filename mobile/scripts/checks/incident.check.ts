import {
  buildTicketId,
  deriveSeverity,
  COLD_ARRIVAL_LIMIT_C,
  ISOLATED_PORTION_LIMIT,
  LATE_THRESHOLD_MINUTES,
  TICKET_STAGES,
} from '../../src/utils/incident.ts';

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`incident check failed: ${label}, got ${String(actual)}`);
  }
};

const base = { categories: [] as never[], affectedPortions: 1 };

assertEqual(deriveSeverity({ ...base, categories: ['kemasan_pecah'] }).severity, 'rendah', 'kemasan pecah 1 porsi rendah');
assertEqual(
  deriveSeverity({ ...base, categories: ['kemasan_pecah'], affectedPortions: ISOLATED_PORTION_LIMIT + 1 }).severity,
  'sedang',
  'di atas 2 porsi naik ke sedang',
);
assertEqual(deriveSeverity({ ...base, categories: ['aroma'] }).severity, 'tinggi', 'aroma basi darurat merah');
assertEqual(deriveSeverity({ ...base, categories: ['benda_asing'] }).severity, 'tinggi', 'benda asing darurat merah');
assertEqual(deriveSeverity({ ...base, categories: ['kematangan'] }).severity, 'tinggi', 'kematangan mentah darurat merah');
assertEqual(deriveSeverity({ ...base, categories: ['alergi'] }).severity, 'tinggi', 'reaksi alergi darurat merah');
assertEqual(
  deriveSeverity({ ...base, categories: ['suhu_drop'], arrivalTempC: COLD_ARRIVAL_LIMIT_C }).severity,
  'sedang',
  'suhu tepat 50 belum dingin',
);
assertEqual(
  deriveSeverity({ ...base, categories: ['suhu_drop'], arrivalTempC: COLD_ARRIVAL_LIMIT_C - 1 }).severity,
  'tinggi',
  'suhu di bawah 50 darurat merah',
);
assertEqual(deriveSeverity({ ...base, categories: ['suhu_drop'] }).severity, 'sedang', 'suhu tidak dicatat jadi sedang');
assertEqual(
  deriveSeverity({ ...base, categories: ['kemasan_pecah'], lateMinutes: LATE_THRESHOLD_MINUTES }).severity,
  'rendah',
  'tepat 30 menit belum menaikkan',
);
assertEqual(
  deriveSeverity({ ...base, categories: ['kemasan_pecah'], lateMinutes: LATE_THRESHOLD_MINUTES + 1 }).severity,
  'sedang',
  'di atas 30 menit menaikkan ke sedang',
);
assertEqual(deriveSeverity({ ...base, categories: ['aroma'] }).isolatesWholeBatch, true, 'derajat tinggi mengisolasi seluruh batch');
assertEqual(deriveSeverity({ ...base, categories: ['kemasan_pecah'] }).isolatesWholeBatch, false, 'derajat rendah tidak');
assertEqual(deriveSeverity({ ...base, categories: ['aroma'] }).reasons.length > 0, true, 'selalu ada alasan');
assertEqual(TICKET_STAGES.length, 4, 'empat tahap tiket');

const ticketId = buildTicketId({
  cityCode: 'JKT',
  date: new Date(2026, 8, 30),
  npsnSuffix: 'SDN01P',
  sequence: 3,
});
assertEqual(ticketId, 'INS/MBG-JKT/20260930/SDN01P-003', 'format nomor tiket');

console.log('incident check: OK');
