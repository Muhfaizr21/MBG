import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { navigate } from '../../App'
import {
  INITIAL_ATTENDANCE_LIST,
} from '../../data/attendanceData'
import {
  MENU_PACKAGES,
  INITIAL_CALENDAR_DAYS,
  NATIONAL_AKG_STANDARDS,
} from '../../data/calendarData'
import { INITIAL_NOTICES_LIST } from '../../data/noticesData'
import { TODAY_PACKAGE_ID } from '../../data/siswaData'
import { fetchMenuPackages, fetchCalendarDays, fetchNotices, fetchAttendances } from '../../lib/api'
import {
  ChefHat,
  Truck,
  Utensils,
  ShieldCheck,
  Flame,
  Beef,
  Coins,
  BadgeCheck,
  Megaphone,
  ArrowRight,
} from 'lucide-react'

// Selaras dengan halaman /siswa/menu (TODAY_PACKAGE_ID di siswaData).
export function getTodayPackage() {
  const pkg = MENU_PACKAGES.find((p) => p.id === TODAY_PACKAGE_ID) || null
  const day = INITIAL_CALENDAR_DAYS.find((d) => d.packageId === TODAY_PACKAGE_ID) || null
  return { day, pkg }
}

const RIBBON = [
  { key: 'calories', label: 'Kalori', unit: 'kkal', icon: Flame },
  { key: 'protein', label: 'Protein', unit: 'g', icon: Beef },
]

function Greeting() {
  const hour = new Date().getHours()
  const part = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : 'Selamat sore'
  const date = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return { part, date }
}

export function SiswaBerandaTab() {
  const { user } = useAuth()
  const { part, date } = Greeting()
  const firstName = (user?.fullName || '').split(' ')[0]

  const [liveMenu, setLiveMenu] = useState(null)
  const [liveNotices, setLiveNotices] = useState(INITIAL_NOTICES_LIST)
  const [schoolData, setSchoolData] = useState(INITIAL_ATTENDANCE_LIST[0])

  useEffect(() => {
    let isMounted = true
    Promise.all([fetchMenuPackages(), fetchCalendarDays(), fetchNotices(), fetchAttendances()])
      .then(([pkgs, days, nots, atts]) => {
        if (!isMounted) return
        if (Array.isArray(pkgs) && pkgs.length > 0) {
          const found = pkgs.find((p) => p.id === TODAY_PACKAGE_ID) || pkgs[0]
          setLiveMenu(found)
        }
        if (Array.isArray(nots) && nots.length > 0) {
          setLiveNotices(nots)
        }
        if (Array.isArray(atts) && atts.length > 0) {
          const foundSch = atts.find((a) => a.schoolNpsn === user?.npsn) || atts[0]
          if (foundSch) {
            setSchoolData({
              school: foundSch.schoolName || 'SDN 01 Menteng Pagi',
              goldenWindow: {
                cookedAt: '05:45 WIB',
                deliveredAt: '06:55 WIB',
                lunchTime: '09:30 WIB',
                safeUntil: '10:45 WIB',
              },
            })
          }
        }
      })
      .catch((err) => console.warn('Fallback siswa beranda:', err))

    return () => {
      isMounted = false
    }
  }, [user])

  const school = schoolData || INITIAL_ATTENDANCE_LIST[0]
  const todayPkg = liveMenu || getTodayPackage().pkg
  const pkg = todayPkg
  const day = getTodayPackage().day

  const flashNotice = liveNotices.find(
    (n) => n.urgency === 'critical' && n.targetAudience === 'all',
  )

  const timeline = [
    { icon: ChefHat, label: 'Dimasak', time: school?.goldenWindow?.cookedAt },
    { icon: Truck, label: 'Tiba di sekolah', time: school?.goldenWindow?.deliveredAt },
    { icon: Utensils, label: 'Jam makan', time: school?.goldenWindow?.lunchTime },
    { icon: ShieldCheck, label: 'Aman dikonsumsi s.d', time: school?.goldenWindow?.safeUntil },
  ]

  return (
    <div className="space-y-5">
      {/* Sapaan */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700">
          {date}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
          {part}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user?.schoolName} · NPSN {user?.npsn}
        </p>
      </div>

      {/* Flash alert */}
      {flashNotice && (
        <button
          type="button"
          onClick={() => navigate('/siswa/notices')}
          className="w-full text-left rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 hover:bg-rose-100 transition-colors"
        >
          <Megaphone size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-rose-600 font-bold">
              Pengumuman Darurat BGN
            </span>
            <span className="block text-sm font-semibold text-rose-950 mt-0.5 line-clamp-2">
              {flashNotice.title}
            </span>
          </span>
          <ArrowRight size={16} className="mt-1 shrink-0 text-rose-500" />
        </button>
      )}

      {/* Status porsi + menu hari ini */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Porsi hari ini */}
        <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">Porsi kamu hari ini</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tiba tepat waktu
            </span>
          </div>

          <ol className="mt-4 space-y-3 flex-1">
            {timeline.map((step, i) => (
              <li key={step.label} className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <step.icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-slate-500">{step.label}</span>
                  <span className="block text-sm font-bold font-mono">
                    {step.time || '—'}
                  </span>
                </span>
                {i < timeline.length - 1 && (
                  <span className="font-mono text-[10px] text-slate-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-extrabold font-mono text-emerald-700">
                {school?.deliveredPortions?.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Porsi ke sekolah
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold font-mono text-emerald-700">
                {school?.consumptionEvaluation?.finishRate}%
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                Habis dimakan
              </p>
            </div>
          </div>
        </section>

        {/* Menu hari ini */}
        <section className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">Menu hari ini</h2>
            {pkg && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                {day?.title}
              </span>
            )}
          </div>

          {pkg ? (
            <>
              <p className="mt-2 text-base sm:text-lg font-bold leading-snug">
                {pkg.name}
              </p>

              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {[
                  ['Nasi', pkg.staple],
                  ['Lauk utama', pkg.proteinMain],
                  ['Sayur', pkg.sideVeggie],
                  ['Buah', pkg.fruit],
                  ['Minuman', pkg.dairyDrink],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 min-w-0">
                    <dt className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-slate-400 pt-1">
                      {k}
                    </dt>
                    <dd className="text-slate-700 truncate" title={v}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Gizi hari ini */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RIBBON.map((r) => {
                  const std = NATIONAL_AKG_STANDARDS[r.key]
                  const val = pkg[r.key]
                  const pct = Math.min(100, Math.round((val / std.target) * 100))
                  return (
                    <div key={r.key} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <r.icon size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {r.label}
                        </span>
                      </div>
                      <p className="mt-1 font-mono font-extrabold text-lg leading-none">
                        {val}
                        <span className="text-xs font-semibold text-slate-400"> {r.unit}</span>
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-[9px] text-slate-400">
                        {pct}% target AKG ({std.target})
                      </p>
                    </div>
                  )
                })}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Coins size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Biaya</span>
                  </div>
                  <p className="mt-1 font-mono font-extrabold text-lg leading-none">
                    {pkg.costPerServing.toLocaleString('id-ID')}
                    <span className="text-xs font-semibold text-slate-400"> /porsi</span>
                  </p>
                  <p className="mt-2 font-mono text-[9px] text-slate-400">
                    APBN · maks {NATIONAL_AKG_STANDARDS.budgetLimitPerPortion.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <BadgeCheck size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Sertifikat</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-emerald-700">Halal & SLHS</p>
                  <p className="mt-2 font-mono text-[9px] text-slate-400 truncate" title={pkg.halalCert}>
                    {pkg.halalCert}
                  </p>
                </div>
              </div>

              {pkg.allergens?.length > 0 && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <strong>Perhatian alergi:</strong> {pkg.allergens.join(', ')}
                </p>
              )}
            </>
          ) : (
            <div className="mt-6 py-10 text-center">
              <p className="text-4xl">🌤️</p>
              <p className="mt-2 text-sm font-bold">Hari libur sekolah</p>
              <p className="text-xs text-slate-500">
                Tidak ada jam makan siang hari ini. Sampai jumpa di hari sekolah berikutnya!
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Catatan evaluasi */}
      {school?.consumptionEvaluation?.feedbackNotes && (
        <section className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-sm font-extrabold tracking-tight">
            Catatan evaluasi makan siang sekolah
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            “{school.consumptionEvaluation.feedbackNotes}”
          </p>
          <button
            type="button"
            onClick={() => navigate('/siswa/aduan')}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Ada masalah dengan porsi? Sampaikan laporan
            <ArrowRight size={14} />
          </button>
        </section>
      )}
    </div>
  )
}
