import { useState } from 'react'
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
import { Users, Flame, Navigation, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'

// Color palette
const COLORS = {
  lowerGrade: '#059669', // emerald-600
  upperGrade: '#2563eb', // blue-600
  smpGrade: '#6366f1',   // indigo-500
  safeTransit: '#059669',
  warningTransit: '#d97706',
  dangerTransit: '#dc2626'
}

export function SchoolsCharts({ schools = [] }) {
  const [activeTab, setActiveTab] = useState('demographics') // 'demographics' | 'transit'

  // Data 1: Demographics per school (Siswa per kelompok usia & kalori)
  const demographicBarData = schools.map((sch) => ({
    name: sch.name.length > 18 ? sch.name.substring(0, 16) + '..' : sch.name,
    fullName: sch.name,
    lowerGrade: sch.demographics.lowerGrade,
    upperGrade: sch.demographics.upperGrade,
    smpGrade: sch.demographics.smpGrade,
    totalStudents: sch.demographics.totalStudents,
    totalCaloriesKkal: sch.demographics.totalCalorieTarget,
    avgPortionKkal: sch.demographics.avgCaloriePerPortion
  }))

  // Data 2: Aggregated breakdown by Age Group
  const totalLower = schools.reduce((acc, s) => acc + s.demographics.lowerGrade, 0)
  const totalUpper = schools.reduce((acc, s) => acc + s.demographics.upperGrade, 0)
  const totalSmp = schools.reduce((acc, s) => acc + s.demographics.smpGrade, 0)
  const totalAllStudents = totalLower + totalUpper + totalSmp

  const ageGroupDonutData = [
    {
      name: 'SD Bawah (7–9 thn)',
      students: totalLower,
      portionKkal: '450–500 kkal',
      share: totalAllStudents ? Math.round((totalLower / totalAllStudents) * 100) : 0,
      color: COLORS.lowerGrade
    },
    {
      name: 'SD Atas (10–12 thn)',
      students: totalUpper,
      portionKkal: '550 kkal',
      share: totalAllStudents ? Math.round((totalUpper / totalAllStudents) * 100) : 0,
      color: COLORS.upperGrade
    },
    {
      name: 'SMP (13–15 thn)',
      students: totalSmp,
      portionKkal: '650 kkal (High Protein)',
      share: totalAllStudents ? Math.round((totalSmp / totalAllStudents) * 100) : 0,
      color: COLORS.smpGrade
    }
  ]

  // Data 3: Transit Time & Logistics Radius from SPPG to Schools
  const transitRadiusData = schools.map((sch) => {
    const minutes = sch.sppgSupplier.transitMinutes
    return {
      schoolName: sch.name.length > 18 ? sch.name.substring(0, 16) + '..' : sch.name,
      fullName: sch.name,
      sppgName: sch.sppgSupplier.name,
      distanceKm: sch.sppgSupplier.distanceKm,
      transitMinutes: minutes,
      safeLimit: 30,
      maxLimit: 45,
      isWarning: minutes >= 35
    }
  })

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="h-4 w-4 text-emerald-600" />
            <span>Analitik Demografi Gizi &amp; Radius Logistik MBG</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kalkulasi kebutuhan kalori per jenjang usia &amp; evaluasi batas aman tempuh 30–45 menit
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('demographics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'demographics'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demografi &amp; Kalori
          </button>
          <button
            onClick={() => setActiveTab('transit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'transit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Radius Tempuh SPPG
          </button>
        </div>
      </div>

      {/* Tab 1: Demographics & Calorie Breakdown */}
      {activeTab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bar Chart: Student count per age bracket */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  <span>Komposisi Siswa per Jenjang Usia</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Distribusi sasaran SD Bawah (480 kkal), SD Atas (550 kkal), dan SMP (650 kkal)
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-slate-600 font-medium">7–9 Thn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  <span className="text-slate-600 font-medium">10–12 Thn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  <span className="text-slate-600 font-medium">13–15 Thn</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicBarData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[240px] max-w-xs z-50 pointer-events-none select-none">
                          <p className="font-bold border-b border-slate-100 pb-1.5 text-slate-900 leading-snug">
                            {data.fullName}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5">
                            <div>
                              <span className="text-slate-500 block text-[10px]">SD Bawah (7–9 thn):</span>
                              <strong className="text-emerald-700 font-mono font-bold">{data.lowerGrade} siswa</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">SD Atas (10–12 thn):</span>
                              <strong className="text-blue-700 font-mono font-bold">{data.upperGrade} siswa</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">SMP (13–15 thn):</span>
                              <strong className="text-indigo-700 font-mono font-bold">{data.smpGrade} siswa</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Total Sasaran:</span>
                              <strong className="text-slate-900 font-mono font-bold">{data.totalStudents} siswa</strong>
                            </div>
                          </div>
                          <div className="pt-1.5 mt-1 border-t border-slate-100 text-[10px] text-slate-500">
                            Total Alokasi: <strong className="text-amber-700 font-mono font-semibold">{data.totalCaloriesKkal.toLocaleString()} kkal/hari</strong> (rata-rata {data.avgPortionKkal} kkal/porsi)
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="lowerGrade" stackId="a" fill={COLORS.lowerGrade} radius={[3, 3, 0, 0]} name="SD Bawah" />
                  <Bar dataKey="upperGrade" stackId="a" fill={COLORS.upperGrade} radius={[3, 3, 0, 0]} name="SD Atas" />
                  <Bar dataKey="smpGrade" stackId="a" fill={COLORS.smpGrade} radius={[3, 3, 0, 0]} name="SMP Remaja" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Overall Demographic Distribution */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>Proporsi Sasaran MBG</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total {totalAllStudents.toLocaleString()} siswa terdaftar di pangkalan data
              </p>

              <div className="h-44 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageGroupDonutData}
                      dataKey="students"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={4}
                      isAnimationActive={false}
                    >
                      {ageGroupDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[170px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900">{d.name}</p>
                            <p className="text-emerald-700 font-mono font-semibold mt-0.5">{d.students} siswa ({d.share}%)</p>
                            <p className="text-[10px] text-slate-500 mt-1">Standar: {d.portionKkal}</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              {ageGroupDonutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 font-semibold">{item.students}</span>
                    <span className="text-[11px] text-slate-500">({item.share}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SPPG Transit Radius & Transit Time */}
      {activeTab === 'transit' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-blue-600" />
                <span>Radius Waktu Tempuh Dapur SPPG ke Sekolah Binaan</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Batas aman optimal maksimal <strong>30 menit</strong>, ambang batas kritis maksimal <strong>45 menit</strong> perjalanan
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Aman (&lt;30m)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Waspada (30–45m)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transitRadiusData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="schoolName"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  unit="m"
                  domain={[0, 50]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[220px] max-w-xs z-50 pointer-events-none select-none">
                        <p className="font-bold border-b border-slate-100 pb-1.5 text-slate-900 leading-snug">
                          {data.fullName}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Penyuplai: <strong className="text-slate-900 font-semibold">{data.sppgName}</strong>
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1 border-t border-slate-100">
                          <span className="text-slate-500">Jarak Tempuh:</span>
                          <span className="font-mono font-bold text-slate-900">{data.distanceKm} km</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-slate-500">Durasi Perjalanan:</span>
                          <span className={`font-mono font-bold ${data.transitMinutes >= 35 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {data.transitMinutes} menit
                          </span>
                        </div>
                        {data.transitMinutes >= 35 && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2 font-medium">
                            Peringatan: Mendekati batas kritis logistik 45 menit. Pertimbangkan relokasi alokasi dapur.
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="transitMinutes"
                  name="Waktu Tempuh (menit)"
                  radius={[3, 3, 0, 0]}
                >
                  {transitRadiusData.map((entry, index) => (
                    <Cell
                      key={`transit-cell-${index}`}
                      fill={entry.transitMinutes >= 35 ? COLORS.warningTransit : COLORS.safeTransit}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Standar Logistik MBG: Makanan siap santap wajib tiba di meja siswa maksimal 45 menit dari waktu selesai masak di dapur SPPG.</span>
            </span>
            <span className="font-semibold text-slate-700 hidden md:inline">Juknis Distribusi Bab 3.2.1</span>
          </div>
        </div>
      )}
    </div>
  )
}
