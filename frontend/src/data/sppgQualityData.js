/**
 * Data sesi kontrol mutu HACCP dapur SPPG.
 * Merujuk SPPG.md Bab 4 dan prinsip HACCP: ambang CCP dinilai dari angka
 * yang diinput, bukan dari label. Status LOLOS/GAGAL selalu hasil hitung.
 */

export const CCP_POINTS = [
  {
    id: 'ccp-1',
    code: 'CCP-1',
    name: 'Suhu inti masak',
    rule: 'Minimal 75C selama 2 menit',
    unit: 'C',
    min: 75,
    max: 100,
    minHoldMinutes: 2,
    needsHold: true,
  },
  {
    id: 'ccp-2',
    code: 'CCP-2',
    name: 'Suhu holding boks',
    rule: 'Minimal 60C sebelum segel',
    unit: 'C',
    min: 60,
    max: 100,
    minHoldMinutes: 0,
    needsHold: false,
  },
  {
    id: 'ccp-3',
    code: 'CCP-3',
    name: 'Komponen dingin',
    rule: 'Rentang 4C sampai 8C',
    unit: 'C',
    min: 4,
    max: 8,
    minHoldMinutes: 0,
    needsHold: false,
  },
]

export const SENSORY_ASPECTS = [
  {
    id: 'rasa',
    name: 'Rasa',
    passHint: 'Tidak asam, tidak tengik atau pahit aneh',
  },
  {
    id: 'aroma',
    name: 'Aroma',
    passHint: 'Aroma bumbu segar, tidak kecut atau basi',
  },
  {
    id: 'tekstur',
    name: 'Tekstur',
    passHint: 'Sayur renyah tidak berlendir, daging matang sampai tulang',
  },
  {
    id: 'visual',
    name: 'Visual',
    passHint: 'Tidak ada benda asing: rambut, serangga, stapler, plastik',
  },
]

export const SAMPLE_RETENTION_HOURS = 48

export function checkTemp(point, value, holdMinutes) {
  if (Number.isNaN(value)) return { verdict: 'TIDAK VALID', pass: false }
  if (value < point.min || value > point.max) return { verdict: 'GAGAL', pass: false }
  if (point.needsHold && holdMinutes < point.minHoldMinutes) {
    return { verdict: 'GAGAL', pass: false }
  }
  return { verdict: 'LOLOS', pass: true }
}

export function retentionDeadline(storedAtISO) {
  const d = new Date(storedAtISO)
  if (Number.isNaN(d.getTime())) return '-'
  d.setHours(d.getHours() + SAMPLE_RETENTION_HOURS)
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const SEED_TEMP_LOGS = [
  {
    id: 'log-01',
    pointId: 'ccp-1',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    value: 78.5,
    holdMinutes: 3,
    measuredAt: '05:32',
    measuredBy: '[Nama Penanggung]',
    evidenceName: 'probe-ayamsuh-0532.jpg',
  },
  {
    id: 'log-02',
    pointId: 'ccp-2',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    value: 64.2,
    holdMinutes: 0,
    measuredAt: '05:58',
    measuredBy: '[Nama Penanggung]',
    evidenceName: 'holding-thermal-0558.jpg',
  },
  {
    id: 'log-03',
    pointId: 'ccp-3',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    value: 4.1,
    holdMinutes: 0,
    measuredAt: '05:47',
    measuredBy: '[Nama Penanggung]',
    evidenceName: 'chiller-susu-0547.jpg',
  },
]

export const SEED_SAMPLES = [
  {
    id: 'smp-01',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    rackNo: 'RK-A1',
    storedAt: '2026-09-29T06:10',
    storedBy: '[Nama Penanggung]',
    status: 'tersimpan',
  },
  {
    id: 'smp-02',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    rackNo: 'RK-A2',
    storedAt: '2026-09-29T06:15',
    storedBy: '[Nama Penanggung]',
    status: 'tersimpan',
  },
]
