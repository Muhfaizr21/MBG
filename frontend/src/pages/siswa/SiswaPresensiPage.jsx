import { useState } from 'react'
import { CalendarDays, CheckCircle2, XCircle, Coffee, Star, TrendingUp } from 'lucide-react'
import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { MEAL_LOG, SISWA_PROFILE } from '../../data/siswaData'
import { MENU_PACKAGES } from '../../data/calendarData'

/**
 * ==============================================================================
 * PORTAL SISWA: PRESENSI PENERIMAAN PORSI
 * URL: /siswa/presensi
 * Riwayat harian: kehadiran, penerimaan porsi, status scan & penilaian.
 * ==============================================================================
 */

const ATTENDANCE_META = {
  hadir: { label: 'Hadir', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  sakit: { label: 'Sakit', icon: Coffee, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  izin: { label: 'Izin', icon: XCircle, cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  libur: { label: 'Libur', icon: CalendarDays, cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

const SCAN_META = {
  verified: { label: 'Porsi Terverifikasi', cls: 'bg-emerald-50 text-emerald-700' },
  rejected_replaced: { label: 'Boks Diganti (Aman)', cls: 'bg-rose-50 text-rose-600' },
  null: { label: '-', cls: 'bg-slate-50 text-slate-400' },
}

export function SiswaPresensiPage() {
  const [onlyReceived, setOnlyReceived] = useState(false)

  const rows = onlyReceived ? MEAL_LOG.filter((r) => r.portionReceived) : MEAL_LOG
  const hadirCount = MEAL_LOG.filter((r) => r.attendance === 'hadir').length
  const receivedCount = MEAL_LOG.filter((r) => r.portionReceived).length
  const rated = MEAL_LOG.filter((r) => r.rating != null)
  const avgRating = rated.length
    ? (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1)
    : '-'

  return (
    <SiswaLayout activeMenu="presensi" title="Presensi Makan" badge="24 HARI TERAKHIR">
      {/* Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: CheckCircle2, label: 'Hadir', value: `${hadirCount} hari`, tone: 'text-emerald-600 bg-emerald-50' },
          { icon: CalendarDays, label: 'Porsi Diterima', value: `${receivedCount} porsi`, tone: 'text-blue-600 bg-blue-50' },
          { icon: TrendingUp, label: 'Tingkat Penerimaan', value: `${Math.round((receivedCount / hadirCount) * 100)}%`, tone: 'text-violet-600 bg-violet-50' },
          { icon: Star, label: 'Rating Rata-rata', value: `${avgRating} / 5`, tone: 'text-amber-500 bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className={`inline-flex p-2 rounded-xl ${s.tone}`}>
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mt-2.5">{s.value}</p>
            <p className="text-[11px] font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Filter */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">
            {SISWA_PROFILE.fullName} &bull; {SISWA_PROFILE.className}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            NISN {SISWA_PROFILE.nisn} &bull; {SISWA_PROFILE.school} (NPSN {SISWA_PROFILE.npsn})
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={onlyReceived}
            onChange={(e) => setOnlyReceived(e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-600"
          />
          Hanya yang menerima porsi
        </label>
      </section>

      {/* Log table */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wide">
                <th className="text-left font-bold px-4 py-3">Tanggal</th>
                <th className="text-left font-bold px-4 py-3">Menu</th>
                <th className="text-left font-bold px-4 py-3">Kehadiran</th>
                <th className="text-left font-bold px-4 py-3">Porsi</th>
                <th className="text-left font-bold px-4 py-3">Status Scan</th>
                <th className="text-left font-bold px-4 py-3">Konsumsi</th>
                <th className="text-center font-bold px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const att = ATTENDANCE_META[row.attendance]
                const scan = SCAN_META[row.scanStatus] || SCAN_META.null
                const pkg = MENU_PACKAGES.find((p) => p.id === row.packageId)
                const AttIcon = att.icon
                return (
                  <tr key={row.date} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{row.date}</p>
                      <p className="text-[10px] text-slate-400">{row.dayName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium max-w-[200px]">
                      {pkg ? (
                        <span className="line-clamp-2 leading-snug">{pkg.name}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[10px] font-bold ${att.cls}`}>
                        <AttIcon className="h-3 w-3" />
                        {att.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.portionReceived ? (
                        <span className="font-bold text-emerald-700">Diterima</span>
                      ) : (
                        <span className="text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${scan.cls}`}>
                        {scan.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{row.finish}</td>
                    <td className="px-4 py-3">
                      {row.rating != null ? (
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= row.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-center block">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </SiswaLayout>
  )
}

export default SiswaPresensiPage
