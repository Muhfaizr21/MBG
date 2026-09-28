import { STATS } from '../../data/mbgData'

export function StatsRibbon() {
  return (
    <section aria-label="Statistik MBG" className="border-y border-gray-100 bg-gray-50/50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-left">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">{s.value}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{s.label}</p>
              <p className="mt-1 text-xs text-gray-500 leading-normal">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
