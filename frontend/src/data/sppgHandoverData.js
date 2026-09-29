/**
 * Data sesi serah terima dan BAST digital.
 * Merujuk SPPG.md Bab 7: status verifikasi berjalan manual lewat aksi kurir
 * dan guru di halaman ini. BAST terbit hanya setelah kedua tanda tangan ada,
 * dan jumlah sah tidak pernah melebihi boks terkirim.
 */

export const HANDOVER_STAGES = [
  { id: 'menunggu', label: 'Menunggu pindai', tone: 'bg-slate-100 text-slate-600' },
  { id: 'tiba', label: 'Tiba di sekolah', tone: 'bg-sky-50 text-sky-800' },
  { id: 'memindai', label: 'Proses pemindaian', tone: 'bg-amber-50 text-amber-900' },
  { id: 'lolos', label: 'Lolos sempurna', tone: 'bg-emerald-50 text-emerald-800' },
  { id: 'hold', label: 'Hold parsial', tone: 'bg-rose-50 text-rose-800' },
]

export const STAGE_ORDER = ['menunggu', 'tiba', 'memindai']

export function stageMeta(id) {
  return HANDOVER_STAGES.find((s) => s.id === id) || HANDOVER_STAGES[0]
}

export function acceptedCount(h) {
  return Math.max(0, h.scanned - h.rejected.reduce((s, r) => s + r.boxes, 0))
}

export function buildBastNo(seq) {
  return `BAST/MBG/2026/${String(seq).padStart(4, '0')}`
}

export const SEED_HANDOVERS = [
  {
    id: 'ho-01',
    schoolId: 'sch-01',
    schoolName: 'SDN Menteng 01 Pagi',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    sent: 650,
    scanned: 650,
    stage: 'lolos',
    rejected: [],
    courierSign: '[Nama Kurir]',
    teacherSign: '[Nama Guru]',
    bastNo: 'BAST/MBG/2026/0001',
    bastAt: '07:18',
    bastHash: '',
  },
  {
    id: 'ho-02',
    schoolId: 'sch-02',
    schoolName: 'SDN Pegangsaan 02',
    batchToken: 'MBG-2026-SPPG01-SDN02-B01',
    sent: 510,
    scanned: 310,
    stage: 'memindai',
    rejected: [],
    courierSign: '',
    teacherSign: '',
    bastNo: '',
    bastAt: '',
    bastHash: '',
  },
  {
    id: 'ho-03',
    schoolId: 'sch-03',
    schoolName: 'SMPN 3 Jakarta',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    sent: 750,
    scanned: 750,
    stage: 'hold',
    rejected: [{ boxes: 5, reason: 'Kemasan penyok, segel terbuka', evidenceName: 'tolak-segel-0755.jpg' }],
    courierSign: '[Nama Kurir]',
    teacherSign: '',
    bastNo: '',
    bastAt: '',
    bastHash: '',
  },
  {
    id: 'ho-04',
    schoolId: 'sch-04',
    schoolName: 'SDN Cikini 01',
    batchToken: 'MBG-2026-SPPG01-SDN01C-B03',
    sent: 120,
    scanned: 0,
    stage: 'menunggu',
    rejected: [],
    courierSign: '',
    teacherSign: '',
    bastNo: '',
    bastAt: '',
    bastHash: '',
  },
]

export const SEED_SAFETY_STOCK = 40
