/**
 * Data sesi sertifikasi dan sanitasi dapur SPPG.
 * Merujuk SPPG.md Bab 10: status dokumen dihitung dari tanggal kedaluwarsa
 * terhadap tanggal sesi, dan vonis lab dihitung dari ambang. Hari sesi
 * dikunci 29 September 2026 supaya status konsisten dengan modul lain.
 */

export const SESSION_DATE = '2026-09-29'
export const WARN_DAYS = 60

function toDay(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.getTime()
}

export function daysUntil(expiryISO) {
  return Math.round((toDay(expiryISO) - toDay(SESSION_DATE)) / 86400000)
}

export function docStatus(expiryISO) {
  const left = daysUntil(expiryISO)
  if (left < 0) return { label: `Kedaluwarsa ${-left} hari`, tone: 'bg-rose-50 text-rose-800', ok: false }
  if (left <= WARN_DAYS) return { label: `Sisa ${left} hari`, tone: 'bg-amber-50 text-amber-900', ok: true }
  return { label: `Berlaku, sisa ${left} hari`, tone: 'bg-emerald-50 text-emerald-800', ok: true }
}

// Ambang uji lab dapur: ALT dan E. coli harus nol.
export function labVerdict(kind, value) {
  if (Number.isNaN(value) || value < 0) return { label: 'TIDAK VALID', pass: false }
  if (kind === 'fisika') return value <= 5 ? { label: 'LOLOS', pass: true } : { label: 'GAGAL', pass: false }
  return value === 0 ? { label: 'LOLOS', pass: true } : { label: 'GAGAL', pass: false }
}

export const SEED_DOCS = [
  {
    id: 'doc-01',
    name: 'Sertifikat Laik Higiene Sanitasi',
    issuer: 'Dinkes DKI Jakarta',
    number: 'SLHS-DKI/2026/0491-BGN',
    expiry: '2027-03-14',
    fileName: 'slhs-2026.pdf',
  },
  {
    id: 'doc-02',
    name: 'Sertifikat Halal',
    issuer: 'BPJPH Kemenag',
    number: 'ID31110008492010926',
    expiry: '2026-11-20',
    fileName: 'halal-2024.pdf',
  },
  {
    id: 'doc-03',
    name: 'Nomor Kontrol Veteriner RPHU',
    issuer: 'Dinas KPKP DKI',
    number: 'NKV RPHU-3171-004',
    expiry: '2027-01-05',
    fileName: 'nkv-rphu.pdf',
  },
]

export const SEED_HANDLERS = [
  {
    id: 'fh-01',
    name: '[Nama Penjamah]',
    role: 'Kepala dapur',
    healthExpiry: '2026-12-01',
    healthFile: 'sehat-ka-dapur.pdf',
    trained: true,
  },
  {
    id: 'fh-02',
    name: '[Nama Penjamah]',
    role: 'Asisten masak',
    healthExpiry: '2026-10-09',
    healthFile: 'sehat-asisten.pdf',
    trained: true,
  },
  {
    id: 'fh-03',
    name: '[Nama Penjamah]',
    role: 'Petugas kemas',
    healthExpiry: '2027-02-15',
    healthFile: 'sehat-kemas.pdf',
    trained: false,
  },
]

export const SEED_LABS = [
  {
    id: 'lab-01',
    date: '2026-09-22',
    kind: 'swab',
    target: 'Talenan sayur',
    param: 'Angka kuman (ALT)',
    value: 0,
    unit: 'koloni/cm2',
  },
  {
    id: 'lab-02',
    date: '2026-09-22',
    kind: 'swab',
    target: 'Pisau daging',
    param: 'E. coli',
    value: 0,
    unit: 'koloni/cm2',
  },
  {
    id: 'lab-03',
    date: '2026-09-15',
    kind: 'air',
    target: 'Kran pencuci bahan',
    param: 'E. coli air',
    value: 0,
    unit: 'APM/100ml',
  },
  {
    id: 'lab-04',
    date: '2026-09-15',
    kind: 'air',
    target: 'Kran pencuci bahan',
    param: 'Kekeruhan',
    value: 2.1,
    unit: 'NTU',
  },
]

export const LAB_KINDS = [
  { id: 'swab', label: 'Usap alat (ALT/E. coli harus nol)' },
  { id: 'air', label: 'Air bersih (E. coli nol, keruh maks 5 NTU)' },
  { id: 'fisika', label: 'Fisika lain (batas maks 5)' },
]

export const SEED_AUDITS = [
  {
    id: 'aud-01',
    purpose: 'Inspeksi berkala triwulan III',
    preferredDate: '2026-10-14',
    note: 'Verifikasi ulang SLHS sebelum Halal habis November.',
    status: 'Diajukan',
    filedAt: '28 Sept 2026',
  },
]
