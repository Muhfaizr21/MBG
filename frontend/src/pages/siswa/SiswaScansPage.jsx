import { useState, useMemo } from 'react'
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Search,
  Thermometer,
  QrCode,
  Star,
  X,
  Clock,
  UserCheck,
} from 'lucide-react'
import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { SCAN_HISTORY, SISWA_STATS } from '../../data/siswaData'
import { MENU_PACKAGES } from '../../data/calendarData'

/**
 * ==============================================================================
 * PORTAL SISWA: RIWAYAT SCANNING PORSI MAKANAN
 * URL: /siswa/scans
 * Log scan validator per boks: suhu serah-terima, status verifikasi,
 * batch traceability, penilaian rasa, dan catatan konsumsi.
 * ==============================================================================
 */

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Scan' },
  { id: 'verified', label: 'Terverifikasi' },
  { id: 'rejected', label: 'Boks Diganti' },
]

function pkgOf(id) {
  return MENU_PACKAGES.find((p) => p.id === id)
}

function ScanDetailModal({ scan, onClose }) {
  const pkg = pkgOf(scan.packageId)
  if (!scan) return null
  const verified = scan.status === 'verified'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-5 py-4 flex items-center justify-between text-white ${
            verified ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-rose-600 to-orange-500'
          }`}
        >
          <div className="flex items-center gap-3">
            {verified ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
            <div>
              <p className="font-extrabold text-sm">{scan.statusLabel}</p>
              <p className="text-[11px] opacity-85 font-mono">{scan.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <QrCode className="h-14 w-14 text-slate-700" strokeWidth={1.3} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Menu Porsi</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">{pkg?.name || '-'}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {scan.boxId} &bull; {scan.batchId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, label: 'Diterima', value: scan.deliveredAt },
              {
                icon: Thermometer,
                label: 'Suhu Serah-terima',
                value: `${scan.temperature}°C`,
                danger: scan.temperature < 60,
              },
              { icon: UserCheck, label: 'Validator', value: scan.validator },
              { icon: Clock, label: 'Batas Aman', value: scan.safeUntil },
            ].map((row) => (
              <div
                key={row.label}
                className={`rounded-xl border p-3 ${
                  row.danger ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <row.icon className={`h-3.5 w-3.5 ${row.danger ? 'text-rose-500' : 'text-slate-400'}`} />
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {row.label}
                  </p>
                </div>
                <p
                  className={`text-xs font-bold mt-1 ${
                    row.danger ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Catatan Scan
            </p>
            <p className="text-xs text-slate-700 leading-relaxed mt-1.5">{scan.feedback}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-2.5">
              <p className="text-sm font-extrabold text-emerald-700">{scan.calories} kkal</p>
              <p className="text-[10px] font-semibold text-emerald-600/80">Kalori</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-2.5">
              <p className="text-sm font-extrabold text-emerald-700">{scan.protein} g</p>
              <p className="text-[10px] font-semibold text-emerald-600/80">Protein</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-2.5">
              <p className="text-sm font-extrabold text-emerald-700">{scan.finish}</p>
              <p className="text-[10px] font-semibold text-emerald-600/80">Konsumsi</p>
            </div>
          </div>

          {scan.rating != null && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
              <span className="text-xs font-bold text-amber-800">Penilaianmu</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= scan.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SiswaScansPage() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const scans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SCAN_HISTORY.filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false
      if (!q) return true
      const pkg = pkgOf(s.packageId)
      return (
        (pkg?.name || '').toLowerCase().includes(q) ||
        s.boxId.toLowerCase().includes(q) ||
        s.batchId.toLowerCase().includes(q) ||
        s.dayName.toLowerCase().includes(q)
      )
    })
  }, [filter, query])

  return (
    <SiswaLayout activeMenu="scans" title="Riwayat Scan Porsi" badge="TRACEABILITY">
      {/* Summary strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Scan Tercatat', value: SCAN_HISTORY.length, sub: '10 hari terakhir' },
          { label: 'Terverifikasi', value: `${SISWA_STATS.verifiedRate}%`, sub: 'lolos suhu & mutu' },
          { label: 'Rata-rata Suhu', value: `${SISWA_STATS.avgTemperature}°C`, sub: 'standar min 60°C' },
          { label: 'Boks Diganti', value: SCAN_HISTORY.filter((s) => s.status === 'rejected').length, sub: 'dikirim ulang aman' },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p
              className={`text-xl font-extrabold mt-1 ${
                i === 3 ? 'text-rose-600' : i === 0 ? 'text-slate-900' : 'text-emerald-700'
              }`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 w-fit">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-bold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                filter === f.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
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
            placeholder="Cari menu, ID boks, atau batch..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
      </section>

      {/* Scan timeline */}
      <section className="space-y-3">
        {scans.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <ScanLine className="h-9 w-9 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-500 mt-3">Tidak ada scan yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci atau filter status.</p>
          </div>
        )}

        {scans.map((scan) => {
          const pkg = pkgOf(scan.packageId)
          const verified = scan.status === 'verified'
          return (
            <button
              key={scan.id}
              onClick={() => setSelected(scan)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Status icon */}
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    verified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {verified ? <CheckCircle2 className="h-5.5 w-5.5" /> : <AlertTriangle className="h-5.5 w-5.5" />}
                </div>

                {/* Date + menu */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-slate-900">{pkg?.name || 'Menu'}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        verified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {scan.statusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {scan.dayName}, {scan.date} &bull; scan {scan.time} oleh {scan.validator}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {scan.boxId} &bull; {scan.batchId}
                  </p>
                </div>

                {/* Right meta */}
                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                  <div className="text-center">
                    <p
                      className={`text-sm font-extrabold flex items-center gap-1 ${
                        scan.temperature >= 60 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      <Thermometer className="h-3.5 w-3.5" />
                      {scan.temperature}°C
                    </p>
                    <p className="text-[10px] text-slate-400">suhu boks</p>
                  </div>
                  {scan.rating != null && (
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-amber-500 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {scan.rating}
                      </p>
                      <p className="text-[10px] text-slate-400">ratingmu</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </section>

      {selected && <ScanDetailModal scan={selected} onClose={() => setSelected(null)} />}
    </SiswaLayout>
  )
}

export default SiswaScansPage
