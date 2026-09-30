import {
  buildRegistrationNumber,
  checkBastReadiness,
  evaluateTemperature,
  reconcile,
  COLD_TEMP_MAX_C,
  DANGER_ZONE_C,
  MIN_WARM_TEMP_C,
  PORTIONS_PER_TOTE,
} from '../../src/utils/handover.ts';

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`handover check failed: ${label}, got ${String(actual)}`);
  }
};

assertEqual(evaluateTemperature(65, 'hangat').status, 'aman', '65 aman');
assertEqual(evaluateTemperature(MIN_WARM_TEMP_C, 'hangat').status, 'aman', 'tepat 60 aman');
assertEqual(evaluateTemperature(58, 'hangat').status, 'waspada', '58 waspada');
assertEqual(evaluateTemperature(54, 'hangat').status, 'bahaya', '54 masuk zona bahaya');
assertEqual(evaluateTemperature(DANGER_ZONE_C - 1, 'hangat').requiresOrganoleptic, true, 'wajib organoleptik');
assertEqual(evaluateTemperature(65, 'hangat').requiresOrganoleptic, false, 'aman tidak wajib organoleptik');
assertEqual(evaluateTemperature(Number.NaN, 'hangat').status, 'bahaya', 'suhu kosong belum diukur');
assertEqual(evaluateTemperature(6, 'dingin').status, 'aman', 'dingin 6 aman');
assertEqual(evaluateTemperature(COLD_TEMP_MAX_C, 'dingin').status, 'aman', 'dingin 8 batas atas aman');
assertEqual(evaluateTemperature(12, 'dingin').status, 'waspada', 'dingin 12 di luar rentang');

const balanced = reconcile({ orderedPortions: 650, totesReceived: 13, damagedPortions: 0 });
assertEqual(balanced.receivedPortions, 13 * PORTIONS_PER_TOTE, '650 porsi dari 13 tote');
assertEqual(balanced.balanced, true, '13 tote balance');
assertEqual(reconcile({ orderedPortions: 650, totesReceived: 12, damagedPortions: 0 }).discrepancy, -50, '12 tote kurang 50');
assertEqual(reconcile({ orderedPortions: 650, totesReceived: 13, damagedPortions: 20 }).discrepancy, -20, 'rusak 20 jadi selisih');

const ready = {
  totesExpected: 13,
  totesReceived: 13,
  hasUnsafeTemperature: false,
  organolepticDone: false,
  damagedBalanced: true,
  driverSigned: true,
  teacherSigned: true,
};
assertEqual(checkBastReadiness(ready).ready, true, 'lengkap bisa terbit');
assertEqual(checkBastReadiness({ ...ready, totesReceived: 0 }).blockers.length, 1, 'nol tote otomatis belum siap');
assertEqual(checkBastReadiness({ ...ready, totesReceived: 12 }).blockers.length, 1, 'tote kurang satu');
assertEqual(checkBastReadiness({ ...ready, teacherSigned: false }).ready, false, 'tanpa tanda tangan guru belum siap');
assertEqual(
  checkBastReadiness({ ...ready, hasUnsafeTemperature: true, organolepticDone: false }).ready,
  false,
  'suhu bahaya tanpa organoleptik belum siap',
);
assertEqual(
  checkBastReadiness({ ...ready, hasUnsafeTemperature: true, organolepticDone: true }).ready,
  true,
  'suhu bahaya dengan organoleptik boleh terbit',
);

const number = buildRegistrationNumber({
  cityCode: 'JKT',
  date: new Date(2026, 8, 30),
  npsnSuffix: 'SDN01P',
  sequence: 42,
});
assertEqual(number, 'BAST/MBG-JKT/20260930/SDN01P-042', 'format nomor registrasi');

console.log('handover check: OK');
