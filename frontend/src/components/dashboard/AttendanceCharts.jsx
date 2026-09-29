import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts'
import {
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react'

export function AttendanceCharts({ attendanceList = [] }) {
  // 1. Data Porsi Dikirim vs Siswa Hadir
  const reconciliationData = useMemo(() => {
    return attendanceList.map((item) => {
      const shortSchool = item.school.replace('SDN ', 'SD ').replace('SMPN ', 'SMP ')
      return {
        name: shortSchool.length > 13 ? shortSchool.slice(0, 12) + '…' : shortSchool,
        fullSchool: item.school,
        PorsiDikirim: item.deliveredPortions,
        SiswaHadir: item.presentStudents,
        Surplus: item.surplusPortions,
        rate: item.attendanceRate
      }
    })
  }, [attendanceList])

  // 2. Evaluasi Sisa Makanan Piring Siswa (Plate Waste Breakdown)
  const plateWasteData = useMemo(() => {
    return [
      { name: 'Habis Bersih (Tuntas)', value: 95.8, color: '#047857' },
      { name: 'Sisa Sayuran Hijau', value: 2.6, color: '#b45309' },
      { name: 'Sisa Nasi / Karbo', value: 1.1, color: '#1d4ed8' },
      { name: 'Sisa Lauk Protein', value: 0.5, color: '#1d4ed8' }
    ]
  }, [])

  // 3. Tren Presensi Siswa 7 Hari (Komparasi Target APBN 95%)
  const attendanceTrendData = useMemo(() => {
    const days = [
      { day: 'H-6 (22 Sep)', rate: 97.1 },
      { day: 'H-5 (23 Sep)', rate: 96.8 },
      { day: 'H-4 (24 Sep)', rate: 96.4 },
      { day: 'H-3 (25 Sep)', rate: 95.9 },
      { day: 'H-2 (26 Sep)', rate: 97.4 },
      { day: 'H-1 (27 Sep)', rate: 96.0 },
      { day: 'Hari Ini (28 Sep)', rate: 96.3 }
    ]
    return days.map((d) => ({
      day: d.day.split(' ')[0],
      date: d.day,
      PresensiNasional: d.rate,
      threshold: 95.0
    }))
  }, [])

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-6">
      {/* Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Kehadiran siswa dan sisa porsi per sekolah
            </h2>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600">
              REKONSILIASI DAPODIK MBG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mencegah pemborosan anggaran negara (*food waste*) dengan membandingkan pesanan boks terhadap kehadiran riil siswa di ruang kelas.
          </p>
        </div>

        {/* Live Pill Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Sinkronisasi: <strong className="text-slate-800">Dapodik Kelas</strong></span>
            <span className="text-slate-600">|</span>
            <span>Target: <strong className="text-blue-700 font-bold">&ge;95%</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 1: Porsi Dikirim vs Siswa Hadir (Col 5) */}
        <div className="lg:col-span-5 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                Porsi Dikirim vs Presensi Hadir
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-500">Porsi / Siswa</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Selisih antara porsi kurir dan siswa hadir menunjukkan porsi aman yang dapat diredistribusikan sebelum batas 4 jam habis.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reconciliationData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[210px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 leading-snug">{d.fullSchool}</p>
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Porsi Dikirim:</span>
                                <span className="font-mono font-semibold text-slate-900 tabular-nums">{d.PorsiDikirim} porsi</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Siswa Hadir:</span>
                                <span className="font-mono font-bold text-emerald-700">{d.SiswaHadir} siswa</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-100 pt-1">
                                <span className="text-slate-500">Surplus Aman:</span>
                                <span className="font-mono font-bold text-amber-700">{d.Surplus} boks</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
                  <Bar dataKey="PorsiDikirim" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Porsi Dikirim" />
                  <Bar dataKey="SiswaHadir" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Siswa Hadir" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Rata-Rata Kehadiran:</span>
            <span className="font-bold text-blue-700">96.3% Siswa Aktif</span>
          </div>
        </div>

        {/* Visual 2: Evaluasi Sisa Makanan Piring Siswa (Col 3.5) */}
        <div className="lg:col-span-3 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Indeks Piring Bersih
              </h4>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                95.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Persentase porsi yang habis tuntas dikonsumsi siswa sebagai indikator keberhasilan rasa dan nutrisi.
            </p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={plateWasteData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {plateWasteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[160px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900">{d.name}</p>
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              Rasio Sisa: <strong className="text-slate-900 font-mono font-bold tabular-nums">{d.value}%</strong>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Sisa Tertinggi:</span>
            <span className="font-bold text-amber-700">Sayur (2.6%)</span>
          </div>
        </div>

        {/* Visual 3: Tren Presensi Siswa 7 Hari (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-600" />
                Tren Kehadiran Siswa 7 Hari
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                MINGGUAN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Memantau fluktuasi absensi untuk penyesuaian otomatis kuota produksi dapur pada H+1.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <defs>
                    <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[160px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">{d.date}</p>
                            <p className="text-slate-600 text-[11px]">
                              Presensi: <strong className="text-blue-700 font-mono font-bold tabular-nums">{d.PresensiNasional}%</strong>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine
                    y={95.0}
                    stroke="#b91c1c"
                    strokeDasharray="3 3"
                    label={{ value: 'Target 95%', fill: '#b91c1c', fontSize: 9, position: 'insideTopLeft' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="PresensiNasional"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#attendanceColor)"
                    name="Tingkat Presensi"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Stabilitas Presensi:</span>
            <span className="font-bold text-emerald-700">Konsisten Prima</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AttendanceCharts
