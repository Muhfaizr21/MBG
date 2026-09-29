import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Target, Users, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import {
  ACCENT,
  AREA_FILL,
  STATUS,
  STROKE_WIDTH,
  axisTick,
  barCursor,
  gridHorizontal,
  sequential,
  tooltipCursor,
  tooltipStyle,
} from './chartTheme.jsx'

/** Judul chart: satu ikon, satu warna, untuk semua chart. */
function ChartTitle({ icon: Icon, children }) {
  return (
    <h3 className="text-xs font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      {children}
    </h3>
  )
}

export function ValidatorCharts({ validators }) {
  // 1. Komposisi peran validator
  const whoData = useMemo(() => {
    const roles = {}
    validators.forEach((v) => {
      const mainRole = v.role.split(' ')[0] || 'Lainnya'
      roles[mainRole] = (roles[mainRole] || 0) + 1
    })
    return Object.keys(roles).map((key) => ({ name: key, count: roles[key] }))
  }, [validators])

  // 2. Distribusi per wilayah
  const whereData = useMemo(() => {
    const cities = {}
    validators.forEach((v) => {
      cities[v.city] = (cities[v.city] || 0) + 1
    })
    return Object.keys(cities)
      .map((key) => ({ name: key, count: cities[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [validators])

  // 3. Distribusi pemindaian per jam
  const whenData = useMemo(() => {
    const timeBuckets = { '07:00': 0, '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0 }
    validators.forEach((v) => {
      v.scanLogs?.forEach((log) => {
        const hour = log.time.substring(0, 2) + ':00'
        if (timeBuckets[hour] !== undefined) timeBuckets[hour]++
      })
    })
    return Object.keys(timeBuckets).map((key) => ({ time: key, scans: timeBuckets[key] }))
  }, [validators])

  // 4. Kepatuhan terhadap ambang durasi. Hue di sini=status, bukan kategori.
  const whatWhyData = useMemo(() => {
    const fast = validators.filter((v) => v.avgDuration < 0.2).length
    const ok = validators.filter((v) => v.avgDuration >= 0.5).length
    const between = validators.filter((v) => v.avgDuration >= 0.2 && v.avgDuration < 0.5).length
    return [
      { name: 'Sesuai SOP', value: ok, color: STATUS.ok },
      { name: 'Perlu perhatian', value: between, color: STATUS.warn },
      { name: 'Pindai kilat', value: fast, color: STATUS.critical },
    ].filter((d) => d.value > 0)
  }, [validators])

  // 5. Sebaran durasi inspeksi. Data ini TERURUT, jadi pakai ramp satu hue.
  const howData = useMemo(
    () => [
      { name: '< 0,2s', count: validators.filter((v) => v.avgDuration < 0.2).length },
      { name: '0,2-0,5s', count: validators.filter((v) => v.avgDuration >= 0.2 && v.avgDuration < 0.5).length },
      { name: '0,5-1s', count: validators.filter((v) => v.avgDuration >= 0.5 && v.avgDuration <= 1).length },
      { name: '> 1s', count: validators.filter((v) => v.avgDuration > 1).length },
    ],
    [validators]
  )

  return (
    <section aria-label="Telemetri audit validator" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      <header className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-4.5 w-4.5 text-slate-500" />
            Telemetri audit validator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Distribusi, waktu, dan kepatuhan ambang durasi inspeksi
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pemindaian per jam */}
        <div>
          <ChartTitle icon={Clock}>Pemindaian per jam</ChartTitle>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={whenData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridHorizontal} />
                <XAxis dataKey="time" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke={ACCENT}
                  strokeWidth={STROKE_WIDTH}
                  fill={AREA_FILL}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Validator per wilayah */}
        <div>
          <ChartTitle icon={MapPin}>Validator per wilayah</ChartTitle>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={whereData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={88}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={barCursor} />
                <Bar dataKey="count" fill={ACCENT} radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Komposisi peran */}
        <div>
          <ChartTitle icon={Users}>Komposisi peran</ChartTitle>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={whoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={1}
                  dataKey="count"
                  stroke="#fff"
                  strokeWidth={1}
                >
                  {/* Kategori bebas tanpa makna urutan: satu ramp, bukan rainbow. */}
                  {whoData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={sequential(i, whoData.length)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            {whoData.map((d) => `${d.name}: ${d.count}`).join(' · ')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-100">
        {/* Kepatuhan ambang durasi */}
        <div>
          <ChartTitle icon={AlertTriangle}>Kepatuhan ambang durasi</ChartTitle>
          {whatWhyData.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">Belum ada data durasi inspeksi.</p>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={whatWhyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={1}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    {whatWhyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="text-[11px] text-slate-600 mt-2 space-y-0.5">
            {whatWhyData.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-slate-900">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sebaran durasi */}
        <div>
          <ChartTitle icon={ShieldCheck}>Sebaran durasi per porsi</ChartTitle>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={howData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridHorizontal} />
                <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={barCursor} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={34}>
                  {howData.map((entry, i) => (
                    <Cell key={entry.name} fill={sequential(i, howData.length)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ambang minimum 0,50 detik. Warna makin gelap ke arah durasi lebih panjang.
          </p>
        </div>
      </div>
    </section>
  )
}
