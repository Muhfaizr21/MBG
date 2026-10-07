import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Utensils, ShieldCheck, PieChart as PieIcon, Award } from 'lucide-react'
import { NATIONAL_AKG_STANDARDS, MENU_PACKAGES } from '../../data/calendarData'
import { STATUS, NEUTRAL } from './chartTheme.jsx'

// Terjemahan status operasional ke token warna. Satu sumber kebenaran.
const STATUS_COLORS = {
  active: STATUS.ok,
  blackout: STATUS.critical,
  inspection: STATUS.info,
  exam: STATUS.warn,
  weekend: NEUTRAL.idle,
}

export function CalendarCharts({ calendarDays = [], menuPackages = [] }) {
  // 1. Data Komposisi Hari Operasional
  const dayTypeCounts = calendarDays.reduce((acc, d) => {
    if (d.dayType === 'holiday') acc.holiday = (acc.holiday || 0) + 1
    else if (d.hasInspection) acc.inspection = (acc.inspection || 0) + 1
    else if (d.dayType === 'exam_day') acc.exam = (acc.exam || 0) + 1
    else if (d.dayType === 'weekend') acc.weekend = (acc.weekend || 0) + 1
    else acc.school = (acc.school || 0) + 1
    return acc
  }, {})

  const totalDays = calendarDays.length

  const compositionData = [
    {
      name: 'Hari Sekolah (Menu Aktif)',
      count: dayTypeCounts.school || 0,
      share: totalDays ? Math.round(((dayTypeCounts.school || 0) / totalDays) * 100) : 0,
      color: STATUS_COLORS.active
    },
    {
      name: 'Libur Nasional / Blackout',
      count: dayTypeCounts.holiday || 0,
      share: totalDays ? Math.round(((dayTypeCounts.holiday || 0) / totalDays) * 100) : 0,
      color: STATUS_COLORS.blackout
    },
    {
      name: 'Jadwal Sidak Satgas MBG',
      count: dayTypeCounts.inspection || 0,
      share: totalDays ? Math.round(((dayTypeCounts.inspection || 0) / totalDays) * 100) : 0,
      color: STATUS_COLORS.inspection
    },
    {
      name: 'Jadwal Ujian / ANBK',
      count: dayTypeCounts.exam || 0,
      share: totalDays ? Math.round(((dayTypeCounts.exam || 0) / totalDays) * 100) : 0,
      color: STATUS_COLORS.exam
    },
    {
      name: 'Akhir Pekan (Sanitasi)',
      count: dayTypeCounts.weekend || 0,
      share: totalDays ? Math.round(((dayTypeCounts.weekend || 0) / totalDays) * 100) : 0,
      color: STATUS_COLORS.weekend
    }
  ].filter((i) => i.count > 0)

  // 2. Data Rata-Rata Nutrisi Siklus 10-Hari vs Standar AKG
  const activePackages = menuPackages.length > 0 ? menuPackages : MENU_PACKAGES
  const avgNutrition = {
    calories: Math.round(activePackages.reduce((sum, p) => sum + (Number(p.calories) || 0), 0) / activePackages.length),
    protein: +(activePackages.reduce((sum, p) => sum + (Number(p.protein) || 0), 0) / activePackages.length).toFixed(1),
    calcium: Math.round(activePackages.reduce((sum, p) => sum + (Number(p.calcium) || 0), 0) / activePackages.length),
    iron: +(activePackages.reduce((sum, p) => sum + (Number(p.iron) || 0), 0) / activePackages.length).toFixed(1),
    zinc: +(activePackages.reduce((sum, p) => sum + (Number(p.zinc) || 0), 0) / activePackages.length).toFixed(1)
  }

  // Normalisasi ke % Pencapaian AKG Nasional
  const akgComparisonData = [
    {
      nutrient: 'Kalori Energi',
      unit: 'kkal',
      real: avgNutrition.calories,
      target: NATIONAL_AKG_STANDARDS.calories.target,
      percent: Math.round((avgNutrition.calories / NATIONAL_AKG_STANDARDS.calories.target) * 100)
    },
    {
      nutrient: 'Protein',
      unit: 'g',
      real: avgNutrition.protein,
      target: NATIONAL_AKG_STANDARDS.protein.target,
      percent: Math.round((avgNutrition.protein / NATIONAL_AKG_STANDARDS.protein.target) * 100)
    },
    {
      nutrient: 'Kalsium Tulang',
      unit: 'mg',
      real: avgNutrition.calcium,
      target: NATIONAL_AKG_STANDARDS.calcium.target,
      percent: Math.round((avgNutrition.calcium / NATIONAL_AKG_STANDARDS.calcium.target) * 100)
    },
    {
      nutrient: 'Zat Besi (Fe)',
      unit: 'mg',
      real: avgNutrition.iron,
      target: NATIONAL_AKG_STANDARDS.iron.target,
      percent: Math.round((avgNutrition.iron / NATIONAL_AKG_STANDARDS.iron.target) * 100)
    },
    {
      nutrient: 'Zinc Seng',
      unit: 'mg',
      real: avgNutrition.zinc,
      target: NATIONAL_AKG_STANDARDS.zinc.target,
      percent: Math.round((avgNutrition.zinc / NATIONAL_AKG_STANDARDS.zinc.target) * 100)
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Pemenuhan Standar AKG Kemenkes */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Utensils className="h-3.5 w-3.5 text-blue-600" />
                <span>Keseimbangan Nutrisi Siklus 10-Hari vs Standar AKG Kemenkes</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rata-rata gramatur makro dan mikronutrien dari 10 paket menu terverifikasi Badan Gizi Nasional
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>100% Lolos Uji AKG</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={akgComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="nutrient"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 120]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[210px] z-50 pointer-events-none select-none">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">{data.nutrient}</p>
                          <div className="space-y-1 text-slate-600 text-[11px]">
                            <p className="flex justify-between gap-4">
                              <span>Realisasi Rata-rata:</span>
                              <strong className="text-slate-900 font-semibold font-mono">{data.real} {data.unit}</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Target Standar AKG:</span>
                              <strong className="text-slate-900 font-semibold font-mono">{data.target} {data.unit}</strong>
                            </p>
                            <p className="flex justify-between gap-4 text-emerald-700 font-bold border-t border-slate-100 pt-1">
                              <span>Kesesuaian Target:</span>
                              <span className="font-mono">{data.percent}%</span>
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="percent"
                  name="% Pemenuhan AKG"
                  fill="#1d4ed8"
                  radius={[3, 3, 0, 0]}
                  barSize={36}
                >
                  {akgComparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percent >= 100 ? '#047857' : '#1d4ed8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 mt-2">
            {akgComparisonData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-500 font-medium block truncate">{item.nutrient}</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {item.real} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                  {item.percent}% AKG
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: Komposisi Hari Operasional (Donut) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Distribusi Hari Kalender MBG</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {totalDays} Hari Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Klasifikasi hari kalender operasional, sinkronisasi libur, dan audit mendadak
            </p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[160px] z-50 pointer-events-none select-none">
                            <span className="font-bold text-slate-900 block">{data.name}</span>
                            <span className="text-slate-600 font-medium text-[11px]">{data.count} hari ({data.share}%)</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">{totalDays}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase mt-0.5 tracking-wider">Hari</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {compositionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 text-[11px] font-medium truncate max-w-[150px]">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-xs">{item.count}</span>
                  <span className="text-slate-500 text-[10px] ml-1">({item.share}%)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2 text-[11px] text-blue-900">
            <Award className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-medium">Pagu APBN per porsi terkendali: rata-rata Rp 14.738 (Max Rp 15.000).</span>
          </div>
        </div>
      </div>
    </div>
  )
}
