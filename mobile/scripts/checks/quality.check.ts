import {
  decideQuality,
  verifyQrPayload,
  MIN_CORE_TEMP_C,
} from '../../src/utils/quality.ts';
import type { QrPayload } from '../../src/utils/quality.ts';

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`quality check failed: ${label}, got ${String(actual)}`);
  }
};

const SCHOOL = 'SDN Menteng 01 Pagi';
const validPayload: QrPayload = {
  code: 'MBG-2026-SPPG04-SDN01P-B05',
  producer: 'SPPG Menteng Jaya (Dapur #04)',
  slhs: 'SLHS-48210',
  school: SCHOOL,
  cookFinishedAt: '06:00 WIB',
  coreTempC: 78,
};

const qr = verifyQrPayload(validPayload, SCHOOL);
assertEqual(qr.valid, true, 'payload lengkap lolos verifikasi');
assertEqual(qr.checks.length, 5, 'lima butir verifikasi');
assertEqual(verifyQrPayload({ ...validPayload, slhs: 'SLHS-1234' }, SCHOOL).valid, false, 'SLHS format salah ditolak');
assertEqual(verifyQrPayload({ ...validPayload, school: 'SDN Lain 02' }, SCHOOL).valid, false, 'salah rute ditolak');
assertEqual(verifyQrPayload({ ...validPayload, coreTempC: MIN_CORE_TEMP_C - 1 }, SCHOOL).valid, false, 'suhu inti di bawah 75 ditolak');
assertEqual(verifyQrPayload({ ...validPayload, coreTempC: MIN_CORE_TEMP_C }, SCHOOL).valid, true, 'suhu tepat 75 lolos');

const base = { score: 97, holdingTempC: 65, minutesToDeadline: 150, qrValid: true };
assertEqual(decideQuality(base).verdict, 'layak', 'skor 97 aman');
assertEqual(decideQuality({ ...base, score: 85 }).verdict, 'waspada', 'skor 85 waspada');
assertEqual(decideQuality({ ...base, score: 70 }).verdict, 'ditolak', 'skor 70 ditolak');
assertEqual(decideQuality({ ...base, holdingTempC: 59 }).verdict, 'ditolak', 'holding di bawah 60 ditolak');
assertEqual(decideQuality({ ...base, minutesToDeadline: 44 }).verdict, 'ditolak', 'sisa waktu 44 menit ditolak');
assertEqual(decideQuality({ ...base, minutesToDeadline: 0 }).verdict, 'ditolak', 'waktu habis ditolak');
assertEqual(decideQuality({ ...base, qrValid: false }).verdict, 'ditolak', 'QR invalid ditolak walau skor tinggi');
assertEqual(decideQuality({ ...base, score: 85 }).reasons.length, 1, 'waspada menyebut alasannya');
assertEqual(decideQuality({ ...base, score: 85 }).action.includes('jangan ditahan'), true, 'waspada memberi tindakan');

console.log('quality check: OK');
