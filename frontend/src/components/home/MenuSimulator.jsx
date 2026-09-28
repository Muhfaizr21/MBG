import { useState } from 'react'
import { SAMPLE_MENUS } from '../../data/mbgData'
import { SparkleIcon } from '../ui/Icons'

export function MenuSimulator() {
  const [activeMenuId, setActiveMenuId] = useState('menu-1')
  const [verifiedToken, setVerifiedToken] = useState(false)

  const activeMenu = SAMPLE_MENUS.find((m) => m.id === activeMenuId) || SAMPLE_MENUS[0]

  return (
    <section id="simulator" aria-label="Simulasi Hasil Scan" className="border-t border-gray-100 bg-gray-50/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-serif text-sm italic text-gray-500">Simulasi Interaktif Pindai KawanGizi</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
            Lihat Apa yang Terbaca di <em className="font-serif italic font-normal text-gray-700">QR Code</em>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed">
            Pilih salah satu menu standar KawanGizi di bawah untuk melihat rincian nutrisi deterministik, sensor suhu cold-chain, dan hasil analisis AI secara langsung.
          </p>
        </div>

        {/* Menu Selector Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {SAMPLE_MENUS.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => {
                setActiveMenuId(menu.id)
                setVerifiedToken(false)
              }}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                activeMenuId === menu.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {menu.name.split('&')[0]}
            </button>
          ))}
        </div>

        {/* Interactive Card Presentation */}
        <div className="mt-8 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-sm">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Menu Details & Nutrition Badges */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  {activeMenu.badge}
                </div>
                <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{activeMenu.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{activeMenu.sppg}</span>
                  <span>&bull;</span>
                  <span>Dimasak: {activeMenu.cookTime}</span>
                  <span>&bull;</span>
                  <span className="font-semibold text-gray-700">{activeMenu.portion}</span>
                </div>
              </div>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Energi</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{activeMenu.calories} <span className="text-xs font-normal text-gray-500">kkal</span></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">&asymp; 28% AKG Harian</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Protein</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{activeMenu.protein} <span className="text-xs font-normal text-gray-500">g</span></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">&asymp; 55% AKG Harian</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Karbohidrat</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{activeMenu.carbs} <span className="text-xs font-normal text-gray-500">g</span></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">&asymp; 22% AKG Harian</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Serat Pangan</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{activeMenu.fiber} <span className="text-xs font-normal text-gray-500">g</span></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">&asymp; 24% AKG Harian</p>
                </div>
              </div>

              {/* Allergen Info */}
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 text-xs text-amber-900 flex items-start gap-3">
                <span className="font-bold shrink-0 mt-0.5 text-amber-700">Peringatan Alergen:</span>
                <span>{activeMenu.allergen}</span>
              </div>
            </div>

            {/* Right Column: AI Freshness, IoT Sensor & QR Token Verification */}
            <div className="lg:col-span-5 rounded-2xl border border-gray-100 bg-gray-50/80 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Freshness Score AI</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-emerald-600">{activeMenu.freshness}%</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">{activeMenu.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Sensor Suhu</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{activeMenu.temp}</p>
                  <p className="text-xs text-gray-500">{activeMenu.shelfLife}</p>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div className="rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <SparkleIcon />
                  Evaluasi AI KawanGizi
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-700 font-medium">
                  {activeMenu.aiNotes}
                </p>
              </div>

              {/* Simulated QR Token Box */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white font-mono text-[10px] font-bold">
                    QR
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Token Produksi</p>
                    <p className="font-mono text-xs font-bold text-gray-900">{activeMenu.token}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifiedToken(true)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${
                    verifiedToken
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900'
                  }`}
                >
                  {verifiedToken ? '✓ Terverifikasi' : 'Cek Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
