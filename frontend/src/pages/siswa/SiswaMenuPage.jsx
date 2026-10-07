import { useState, useEffect } from 'react'
import { UtensilsCrossed, Flame, Beef, Milk, Apple, Droplets, ShieldCheck, AlertTriangle } from 'lucide-react'
import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { TODAY_PACKAGE_ID } from '../../data/siswaData'
import { MENU_PACKAGES, NATIONAL_AKG_STANDARDS } from '../../data/calendarData'
import { fetchMenuPackages } from '../../lib/api'

/**
 * ==============================================================================
 * PORTAL SISWA: MENU HARI INI & SIKLUS MENU NASIONAL
 * URL: /siswa/menu
 * Data: siklus 10 hari kerja Paket A–J + standar AKG Kemenkes.
 * ==============================================================================
 */

function NutriBar({ label, value, target, min, max, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const inRange = value >= min && value <= max
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className={`font-extrabold ${inRange ? 'text-emerald-700' : 'text-amber-600'}`}>
          {value} {unit}
          <span className="text-slate-400 font-medium"> / target {target} {unit}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
        <div
          className={`h-full rounded-full ${inRange ? 'bg-emerald-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
        {/* target marker */}
        <span
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500/60"
          style={{ left: `${Math.min(100, Math.round((target / max) * 100))}%` }}
          title={`Target ${target} ${unit}`}
        />
      </div>
    </div>
  )
}

export function SiswaMenuPage() {
  const [activeId, setActiveId] = useState(TODAY_PACKAGE_ID)
  const [packages, setPackages] = useState(MENU_PACKAGES)

  useEffect(() => {
    let isMounted = true
    fetchMenuPackages()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p) => ({
            ...p,
            id: p.id,
            cycleCode: p.cycleCode,
            daySlot: p.daySlot,
            name: p.name,
            staple: p.staple,
            proteinMain: p.proteinMain,
            sideVeggie: p.sideVeggie,
            fruit: p.fruit,
            dairyDrink: p.dairyDrink,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
            calcium: p.calcium,
            iron: p.iron,
            zinc: p.zinc,
            costPerServing: p.costPerServing,
            allergens: p.allergens ? [p.allergens] : [],
            halalCert: p.halalCert,
            slhsCert: p.slhsCert,
            description: p.description,
          }))
          setPackages(mapped)
        }
      })
      .catch((err) => console.warn('Fallback menu packages:', err))

    return () => {
      isMounted = false
    }
  }, [])

  const pkg = packages.find((p) => p.id === activeId) || packages[0]
  const isToday = pkg.id === TODAY_PACKAGE_ID
  const { calories, protein, calcium, iron, zinc } = NATIONAL_AKG_STANDARDS

  return (
    <SiswaLayout activeMenu="menu" title="Menu Hari Ini" badge={isToday ? 'HARI INI' : 'SIKLUS'}>
      {/* Cycle selector */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Siklus Menu Nasional (10 Hari Kerja)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Paket A–J, dikunci BGN & dirotasi setiap hari sekolah
            </p>
          </div>
          <UtensilsCrossed className="h-5 w-5 text-slate-300" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MENU_PACKAGES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={`shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                m.id === activeId
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300'
              }`}
            >
              {m.cycleCode}
              {m.id === TODAY_PACKAGE_ID && (
                <span
                  className={`ml-1.5 text-[9px] font-extrabold ${
                    m.id === activeId ? 'text-emerald-100' : 'text-emerald-600'
                  }`}
                >
                  ● HARI INI
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Menu detail */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
              {pkg.cycleCode} &bull; {pkg.daySlot}
            </p>
            <h3 className="text-lg font-extrabold leading-snug mt-1">{pkg.name}</h3>
          </div>
          <div className="p-5 space-y-2.5">
            {[
              { icon: UtensilsCrossed, label: 'Nasi / Staple', value: pkg.staple },
              { icon: Beef, label: 'Protein Utama', value: pkg.proteinMain },
              { icon: Droplets, label: 'Sayur Pendamping', value: pkg.sideVeggie },
              { icon: Apple, label: 'Buah', value: pkg.fruit },
              { icon: Milk, label: 'Susu / Minuman', value: pkg.dairyDrink },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="bg-white border border-slate-200 rounded-lg p-1.5 shrink-0">
                  <row.icon className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">{row.value}</p>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Info Alergen</p>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">
                  {pkg.allergens.join(', ') || 'Tidak ada alergen utama'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pt-1">{pkg.description}</p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-1">
                <ShieldCheck className="h-3 w-3" /> Halal {pkg.halalCert}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1">
                SLHS {pkg.slhsCert}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1">
                Rp {pkg.costPerServing.toLocaleString('id-ID')} / porsi
              </span>
            </div>
          </div>
        </section>

        {/* Nutrition vs AKG */}
        <section className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Nilai Gizi vs Standar AKG</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Target Kemenkes RI usia 7–12 tahun</p>
              </div>
              <Flame className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="space-y-4">
              <NutriBar label={calories.label} value={pkg.calories} target={calories.target} min={calories.min} max={calories.max} unit="kkal" />
              <NutriBar label={protein.label} value={pkg.protein} target={protein.target} min={protein.min} max={protein.max} unit="g" />
              <NutriBar label={calcium.label} value={pkg.calcium} target={calcium.target} min={calcium.min} max={calcium.max} unit="mg" />
              <NutriBar label={iron.label} value={pkg.iron} target={iron.target} min={iron.min} max={iron.max} unit="mg" />
              <NutriBar label={zinc.label} value={pkg.zinc} target={zinc.target} min={zinc.min} max={zinc.max} unit="mg" />
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
              Garis vertikal = target AKG. Porsi di dalam rentang min–max dinyatakan sesuai standar
              komposisi menu MBG.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Jadwal Penerimaan</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Boks tiba di sekolah', value: '07:00 – 07:20 WIB' },
                { label: 'Scan & serah-terima validator', value: '07:05 – 07:30 WIB' },
                { label: 'Jam makan siswa', value: '09:45 WIB (istirahat ke-2)' },
                { label: 'Batas konsumsi aman', value: '4 jam sejak selesai masak' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-medium">{r.label}</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SiswaLayout>
  )
}

export default SiswaMenuPage
