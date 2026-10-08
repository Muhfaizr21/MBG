import { useState, useMemo, useEffect } from 'react'
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Download,
  PackageCheck,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { fetchRecentScans } from '../../lib/api'
import {
  CLASS_RECAP,
  SURPLUS_OPTIONS,
  HISTORY_FILTERS,
} from '../../data/validatorData'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: RIWAYAT PINDAI & PRESENSI MAKAN
 * URL: /validator/history
 * VALIDATOR.md Bab 5: log pindai harian, rekonsiliasi distribusi kelas,
 * pengelolaan porsi sisa, filter & pencarian, ekspor laporan harian.
 * ==============================================================================
 */

const STATUS_ICON = {
  verified: { Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
  warning: { Icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600' },
  rejected: { Icon: XCircle, cls: 'bg-rose-50 text-rose-600' },
}

export function ValidatorHistoryPage() {
  const { user } = useAuth()

  const [filter, setFilter] = useState('today')
  const [query, setQuery] = useState('')
  const [surplusSelections, setSurplusSelections] = useState({})
  const [toast, setToast] = useState(null)
  const [scanRows, setScanRows] = useState([])
  const [scanLoadError, setScanLoadError] = useState(null)

  useEffect(() => {
    let active = true
    fetchRecentScans(100)
      .then((rows) => { if (active) setScanRows(Array.isArray(rows) ? rows : []) })
      .catch((err) => { if (active) setScanLoadError(err.message || 'Gagal memuat riwayat scan.') })
    return () => { active = false }
  }, [])

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 4500)
  }

  const scans = useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startYesterday = new Date(startToday)
    startYesterday.setDate(startYesterday.getDate() - 1)
    const startWeek = new Date(startToday)
    startWeek.setDate(startWeek.getDate() - 6)
    return scanRows.map((row) => {
      const created = new Date(row.createdAt)
      const status = row.verdict === 'tolak' ? 'rejected' : 'warning'
      return {
        ...row,
        time: created.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        classTarget: '—',
        temp: row.holdingTempC,
        score: row.aiConfidence == null ? null : Math.round(row.aiConfidence * 100),
        status,
        statusLabel: status === 'rejected' ? 'Ditahan untuk pemeriksaan' : 'Perlu verifikasi petugas',
        created,
      }
    }).filter((row) => {
      const day = new Date(row.created.getFullYear(), row.created.getMonth(), row.created.getDate())
      const matchesFilter = filter === 'today' ? day >= startToday
        : filter === 'yesterday' ? day >= startYesterday && day < startToday
          : filter === '7d' ? day >= startWeek
            : row.created.getMonth() === now.getMonth() && row.created.getFullYear() === now.getFullYear()
      const matchesQuery = !q || [row.boxId, row.batchId, row.statusLabel].some((value) => String(value || '').toLowerCase().includes(q))
      return matchesFilter && matchesQuery
    })
  }, [filter, query, scanRows])

  const totals = useMemo(() => {
    const quota = CLASS_RECAP.reduce((s, c) => s + c.quota, 0)
    const present = CLASS_RECAP.reduce((s, c) => s + c.present, 0)
    const handed = CLASS_RECAP.reduce((s, c) => s + c.handed, 0)
    const leftover = CLASS_RECAP.reduce((s, c) => s + c.leftover, 0)
    const today = new Date()
    const todayRows = scanRows.filter((row) => {
      const date = new Date(row.createdAt)
      return date.toDateString() === today.toDateString()
    })
    const needsReview = todayRows.filter((row) => row.verdict === 'peringatan').length
    const reviewRate = todayRows.length ? Math.round((needsReview / todayRows.length) * 100) : 0
    return { quota, present, handed, leftover, boxesScanned: todayRows.length, reviewRate }
  }, [scanRows])

  const setSurplus = (className, optionId) => {
    const res = guardAdminAction(
      user,
      'ValidatorHistory',
      'alokasikan porsi sisa',
      { className, option: optionId },
      ['attendance.read'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    setSurplusSelections((prev) => ({ ...prev, [className]: optionId }))
    const opt = SURPLUS_OPTIONS.find((o) => o.id === optionId)
    showToast(`Porsi sisa ${className} dialokasikan: ${opt?.label}.`, 'success')
  }

  const exportReport = () => {
    const res = guardAdminAction(
      user,
      'ValidatorHistory',
      'ekspor laporan harian (PDF/CSV)',
      { date: '2026-10-06', classes: CLASS_RECAP.length },
      ['attendance.read'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    showToast('Laporan harian sekolah diekspor — siap untuk arsip & tembusan Komite Sekolah.', 'success')
  }

  const tones = {
    info: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
  }

  return (
    <ValidatorLayout activeMenu="history" title="Riwayat & Presensi Makan" badge="REKONSILIASI">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs animate-in fade-in ${tones[toast.tone]}`}
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
          <p className="leading-relaxed font-medium">{toast.message}</p>
        </div>
      )}

      {/* Ringkasan */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Hasil Scan Hari Ini', value: totals.boxesScanned, sub: `${totals.reviewRate}% perlu verifikasi petugas`, tone: 'text-slate-900' },
          { label: 'Siswa Hadir · contoh', value: totals.present, sub: `dari ${totals.quota} terdaftar`, tone: 'text-emerald-700' },
          { label: 'Porsi Diserahkan · contoh', value: totals.handed, sub: 'sesuai presensi kelas', tone: 'text-emerald-700' },
          { label: 'Porsi Sisa · contoh', value: totals.leftover, sub: 'perlu alokasi resmi', tone: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`text-xl font-extrabold mt-1 font-mono ${s.tone}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* Filter + pencarian */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 w-fit overflow-x-auto">
          {HISTORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-bold px-3.5 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                filter === f.id ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ID boks atau batch..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
          />
        </div>
        <button
          type="button"
          onClick={exportReport}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white px-3.5 py-2.5 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Ekspor Laporan
        </button>
      </section>

      {/* Log pindai harian */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">Buku log hasil classifier</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {scans.length} catatan
          </span>
        </div>

        {scanLoadError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">Riwayat scan belum dapat dimuat: {scanLoadError}</p>}

        {scans.length === 0 ? (
          <div className="mt-4 py-10 text-center border border-dashed border-slate-200 rounded-xl">
            <History className="h-9 w-9 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">Tidak ada catatan yang cocok</p>
            <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci atau rentang tanggal.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto -mx-1 px-1">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Waktu', 'Boks / Batch', 'Kelas', 'Suhu', 'Skor model', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-3 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((s) => {
                  const { Icon, cls } = STATUS_ICON[s.status] || STATUS_ICON.verified
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold text-slate-700">{s.time}</td>
                      <td className="py-2.5 pr-3">
                        <p className="font-mono text-xs font-bold text-slate-800">{s.boxId}</p>
                        <p className="font-mono text-[10px] text-slate-400">{s.batchId}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-slate-600">{s.classTarget}</td>
                      <td
                        className={`py-2.5 pr-3 font-mono text-xs font-bold ${
                          s.temp >= 60 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {s.temp != null ? `${s.temp}°C` : '—'}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
                        {s.score != null ? `${s.score}%` : '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                          <span className={`h-6 w-6 rounded-lg flex items-center justify-center ${cls}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span
                            className={
                              s.status === 'rejected'
                                ? 'text-rose-600'
                                : s.status === 'warning'
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                            }
                          >
                            {s.statusLabel}
                          </span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rekonsiliasi per kelas */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">
            Papan rekonsiliasi distribusi kelas
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {CLASS_RECAP.length} kelas
          </span>
        </div>

        <div className="mt-3 overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200">
                {['Kelas', 'Kuota', 'Hadir', 'Sakit/Izin', 'Porsi Diserahkan', 'Sisa', 'Alokasi Porsi Sisa'].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-2 pr-3 text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CLASS_RECAP.map((c) => (
                <tr key={c.className} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 pr-3 text-xs font-extrabold text-slate-800">{c.className}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">{c.quota}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs font-bold text-slate-700">{c.present}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">
                    {c.sick} / {c.permit}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs font-bold text-emerald-700">{c.handed}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        c.leftover > 0 ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      {c.leftover}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {c.leftover > 0 ? (
                      <select
                        value={surplusSelections[c.className] || ''}
                        onChange={(e) => setSurplus(c.className, e.target.value)}
                        className="text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[240px]"
                      >
                        <option value="">Pilih alokasi…</option>
                        {SURPLUS_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <PackageCheck className="h-3.5 w-3.5" />
                        Tidak ada sisa
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                <td className="py-2.5 pr-3 text-[11px] font-extrabold text-slate-700">Total</td>
                <td className="py-2.5 pr-3 font-mono text-xs font-extrabold">{totals.quota}</td>
                <td className="py-2.5 pr-3 font-mono text-xs font-extrabold">{totals.present}</td>
                <td className="py-2.5 pr-3" />
                <td className="py-2.5 pr-3 font-mono text-xs font-extrabold text-emerald-700">
                  {totals.handed}
                </td>
                <td className="py-2.5 pr-3 font-mono text-xs font-extrabold text-amber-600">
                  {totals.leftover}
                </td>
                <td className="py-2.5 pr-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
          <Users className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
          Porsi sisa dicatat resmi agar tidak disalahgunakan — alokasi mengikuti regulasi BGN: diserahkan
          kepada staf, disimpan untuk program sore hari, dialokasikan kembali, atau dimusnahkan bila tidak
          layak simpan.
        </p>
      </section>
    </ValidatorLayout>
  )
}

export default ValidatorHistoryPage
