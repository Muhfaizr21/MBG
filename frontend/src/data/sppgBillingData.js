/**
 * Data sesi klaim dan penagihan dapur SPPG.
 * Merujuk SPPG.md Bab 9: nilai tagihan dihitung dari porsi sah dikali tarif
 * kontrak, penalti dihitung dari aturan di bawah. Tidak ada angka yang
 * ditulis manual di layar, semua dari fungsi di file ini.
 */

export const RATE_PER_PORTION = 15000
export const LATE_TOLERANCE_MINUTES = 30
export const LATE_PENALTY_PCT = 5

export const INVOICE_STAGES = [
  { id: 'draft', label: 'Draf dapur', tone: 'bg-slate-100 text-slate-600' },
  { id: 'verifikasi', label: 'Verifikasi Satgas', tone: 'bg-amber-50 text-amber-900' },
  { id: 'spm', label: 'SPM terbit', tone: 'bg-sky-50 text-sky-800' },
  { id: 'sp2d', label: 'SP2D cair', tone: 'bg-emerald-50 text-emerald-800' },
]

export const STAGE_ORDER = ['draft', 'verifikasi', 'spm', 'sp2d']

export function stageMeta(id) {
  return INVOICE_STAGES.find((s) => s.id === id) || INVOICE_STAGES[0]
}

export function formatRp(n) {
  return `Rp${n.toLocaleString('id-ID')}`
}

// Keterlambatan di atas toleransi 30 menit memotong 5 persen nilai baris.
export function penaltyFor(row) {
  if (row.lateMinutes > LATE_TOLERANCE_MINUTES) {
    return Math.round(row.valid * RATE_PER_PORTION * (LATE_PENALTY_PCT / 100))
  }
  return 0
}

export function rowGross(row) {
  return row.valid * RATE_PER_PORTION
}

export function rowNet(row) {
  return rowGross(row) - penaltyFor(row)
}

export function buildInvoiceNo(seq) {
  return `INV/MBG/2026/${String(seq).padStart(4, '0')}`
}

// Baris eligible diambil dari BAST yang sudah terbit di sesi serah terima.
export const SEED_BILL_ROWS = [
  {
    id: 'bl-01',
    schoolName: 'SDN Menteng 01 Pagi',
    bastNo: 'BAST/MBG/2026/0001',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    valid: 650,
    lateMinutes: 3,
    invoiceId: 'inv-01',
  },
  {
    id: 'bl-02',
    schoolName: 'SMPN 3 Jakarta',
    bastNo: '',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    valid: 745,
    lateMinutes: 42,
    invoiceId: null,
  },
  {
    id: 'bl-03',
    schoolName: 'SDN Pegangsaan 02',
    bastNo: '',
    batchToken: 'MBG-2026-SPPG01-SDN02-B01',
    valid: 310,
    lateMinutes: 0,
    invoiceId: null,
  },
]

export const SEED_INVOICES = [
  {
    id: 'inv-01',
    no: 'INV/MBG/2026/0001',
    period: '29 September 2026',
    stage: 'verifikasi',
    notes: ['nota-beras-gapoktan.pdf', 'nota-ayam-rphu.pdf'],
    taxSlip: '',
  },
]
