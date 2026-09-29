/**
 * Data sesi pengemasan batch & QR dapur SPPG.
 * Merujuk SPPG.md Bab 3 dan sistem.md Bab 4.2 Poin 1 & 4.
 *
 * Checksum SHA-256 dihitung di browser lewat Web Crypto, jadi angka
 * "stempel" di layar selalu hasil hitung nyata, bukan teks pajangan.
 */

export const BATCH_YEAR = 2026
export const KITCHEN_CODE = 'SPPG01'
export const TOTE_CAPACITY = 50
export const SAFE_WINDOW_MINUTES = 240

export const SCHOOL_CODES = {
  'sch-01': 'SDN01P',
  'sch-02': 'SDN02',
  'sch-03': 'SMPN03',
  'sch-04': 'SDN01C',
}

export const BATCH_STATUSES = {
  draft: { label: 'Draf', tone: 'bg-slate-100 text-slate-600' },
  queued: { label: 'Antre cetak', tone: 'bg-amber-50 text-amber-900' },
  ready: { label: 'Siap kirim', tone: 'bg-emerald-50 text-emerald-800' },
}

const pad2 = (n) => String(n).padStart(2, '0')

export function buildBoxToken(schoolCode, seq) {
  return `MBG-${BATCH_YEAR}-${KITCHEN_CODE}-${schoolCode}-B${pad2(seq)}`
}

export function buildMasterToken(schoolCode, seq, toteIndex) {
  return `MBG-${BATCH_YEAR}-${KITCHEN_CODE}-${schoolCode}-B${pad2(seq)}-M${pad2(toteIndex)}`
}

export function totesFor(boxCount) {
  if (!boxCount || boxCount <= 0) return []
  const full = Math.floor(boxCount / TOTE_CAPACITY)
  const rest = boxCount % TOTE_CAPACITY
  const totes = []
  for (let i = 0; i < full; i += 1) totes.push({ index: i + 1, boxes: TOTE_CAPACITY })
  if (rest > 0) totes.push({ index: full + 1, boxes: rest })
  return totes
}

export function canonicalPayload(batch) {
  return [
    batch.token,
    batch.menuCode,
    batch.cookedAt,
    batch.consumeBy,
    String(batch.cookTemp),
    (batch.allergens || []).join('|'),
    String(batch.boxCount),
  ].join('#')
}

export async function sha256Hex(text) {
  const subtle = window.crypto && window.crypto.subtle
  if (!subtle) return null
  const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function addMinutesToClock(clock, minutes) {
  const [h, m] = clock.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return clock
  const total = h * 60 + m + minutes
  const wrapped = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

// Batch sesi masak hari ini. Status awal: satu siap kirim, satu antre cetak,
// satu draf, supaya alur generate, cetak, dan verifikasi semuanya terlihat.
export const SEED_BATCHES = [
  {
    id: 'batch-20260929-01',
    seq: 1,
    token: buildBoxToken(SCHOOL_CODES['sch-01'], 1),
    schoolId: 'sch-01',
    schoolCode: SCHOOL_CODES['sch-01'],
    schoolName: 'SDN Menteng 01 Pagi',
    menuCode: 'PAKET-A-01',
    menuName: 'Nasi Ayam Panggang Madu & Capcay Brokoli Segar',
    boxCount: 650,
    cookedAt: '05:40',
    consumeBy: '09:40',
    cookTemp: 78.5,
    allergens: ['Kedelai (Tahu/Kecap)', 'Laktosa (Susu Sapi)'],
    status: 'ready',
    verified: true,
    checksum: '',
  },
  {
    id: 'batch-20260929-02',
    seq: 2,
    token: buildBoxToken(SCHOOL_CODES['sch-03'], 2),
    schoolId: 'sch-03',
    schoolCode: SCHOOL_CODES['sch-03'],
    schoolName: 'SMPN 3 Jakarta',
    menuCode: 'PAKET-A-01',
    menuName: 'Nasi Ayam Panggang Madu & Capcay Brokoli Segar',
    boxCount: 750,
    cookedAt: '05:55',
    consumeBy: '09:55',
    cookTemp: 77.9,
    allergens: ['Kedelai (Tahu/Kecap)', 'Laktosa (Susu Sapi)'],
    status: 'queued',
    verified: false,
    checksum: '',
  },
  {
    id: 'batch-20260929-03',
    seq: 3,
    token: buildBoxToken(SCHOOL_CODES['sch-04'], 3),
    schoolId: 'sch-04',
    schoolCode: SCHOOL_CODES['sch-04'],
    schoolName: 'SDN Cikini 01',
    menuCode: 'PAKET-A-01',
    menuName: 'Nasi Ayam Panggang Madu & Capcay Brokoli Segar',
    boxCount: 120,
    cookedAt: '06:00',
    consumeBy: '10:00',
    cookTemp: 78.1,
    allergens: ['Kedelai (Tahu/Kecap)', 'Laktosa (Susu Sapi)'],
    status: 'draft',
    verified: false,
    checksum: '',
  },
]
