/**
 * Data sesi insiden dan aduan sekolah.
 * Merujuk SPPG.md Bab 8 dan sistem.md Bab 4.2 Poin 3: SLA respons 60 menit
 * dihitung dari jam aduan, dan karantina batch mengunci semua sekolah yang
 * menerima token batch yang sama.
 */

export const SLA_MINUTES = 60

export const LEVELS = {
  1: { label: 'Kritis', tone: 'bg-rose-50 text-rose-800' },
  2: { label: 'Sedang', tone: 'bg-amber-50 text-amber-900' },
  3: { label: 'Rendah', tone: 'bg-slate-100 text-slate-600' },
}

export const TICKET_STATUS = {
  baru: { label: 'Baru masuk', tone: 'bg-rose-50 text-rose-800' },
  ditangani: { label: 'Ditangani', tone: 'bg-amber-50 text-amber-900' },
  selesai: { label: 'Selesai', tone: 'bg-emerald-50 text-emerald-800' },
}

function toMinutes(clock) {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

export function slaRemaining(createdAt, nowMinutes) {
  return SLA_MINUTES - (nowMinutes - toMinutes(createdAt))
}

export function slaState(createdAt, nowMinutes, status) {
  if (status === 'selesai') return { label: 'Selesai', tone: 'bg-emerald-50 text-emerald-800' }
  const left = slaRemaining(createdAt, nowMinutes)
  if (left < 0) return { label: `Lewat ${-left} mnt`, tone: 'bg-rose-50 text-rose-800' }
  if (left <= 15) return { label: `Sisa ${left} mnt`, tone: 'bg-amber-50 text-amber-900' }
  return { label: `Sisa ${left} mnt`, tone: 'bg-slate-100 text-slate-600' }
}

export const SEED_TICKETS = [
  {
    id: 'tkt-01',
    schoolName: 'SMPN 3 Jakarta',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    level: 1,
    category: 'Bau masam',
    message: 'Lima boks tercium bau masam saat dibuka. Minta penarikan sebelum dibagikan.',
    createdAt: '07:40',
    status: 'baru',
    responses: [],
    resolution: '',
  },
  {
    id: 'tkt-02',
    schoolName: 'SDN Pegangsaan 02',
    batchToken: 'MBG-2026-SPPG01-SDN02-B01',
    level: 2,
    category: 'Kemasan bocor',
    message: 'Tiga boks kuah merembes di sudut. Isi masih panas dan segar.',
    createdAt: '07:25',
    status: 'ditangani',
    responses: [
      { at: '07:38', by: '[Nama Penanggung]', text: 'Sampel arsip batch dicek, suhu dan aroma normal. Tiga boks diganti dari stok cadangan.' },
    ],
    resolution: '',
  },
  {
    id: 'tkt-03',
    schoolName: 'SDN Menteng 01 Pagi',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    level: 3,
    category: 'Masukan rasa',
    message: 'Sayur sedikit kurang garam menurut guru piket. Anak-anak tetap habis makan.',
    createdAt: '07:55',
    status: 'baru',
    responses: [],
    resolution: '',
  },
]

export const SEED_REPLACEMENT_STOCK = 40
