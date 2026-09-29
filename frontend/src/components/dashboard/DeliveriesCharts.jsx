import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts'
import {
  ShieldCheck,
  Thermometer,
  Layers
} from 'lucide-react'

export function DeliveriesCharts({ deliveries = [] }) {
  // 1. Data Status Verifikasi YOLOv8 (Donut Chart)
  const statusPieData = useMemo(() => {
    let verified = 0
    let flagged = 0
    let overridden = 0
    let labPending = 0

    deliveries.forEach((d) => {
      if (d.yolo.status === 'verified') verified++
      else if (d.yolo.status === 'flagged') flagged++
      else if (d.yolo.status === 'overridden') overridden++
      else if (d.yolo.status === 'lab_pending') labPending++
    })

    return [
      { name: 'Lolos AI (Optimal)', value: verified, color: '#047857' },
      { name: 'Anomali Terdeteksi', value: flagged, color: '#b91c1c' },
      { name: 'Override Ahli Gizi', value: overridden, color: '#1d4ed8' },
      { name: 'Uji Petik Dinkes', value: labPending, color: '#b45309' }
    ].filter((item) => item.value > 0)
  }, [deliveries])

  // 2. Kurva Telemetri Suhu Tiba Armada vs Ambang Batas 25°C
  const thermalTrendData = useMemo(() => {
    return deliveries.map((d) => {
      const shortSchool = d.school.replace('SDN ', 'SD ').replace('SMPN ', 'SMP ')
      return {
        school: shortSchool.length > 14 ? shortSchool.slice(0, 13) + '…' : shortSchool,
        fullSchool: d.school,
        time: d.scannedAt.split(' ')[0],
        temp: d.thermal.temp,
        freshness: d.yolo.freshnessIndex,
        status: d.thermal.status,
        safeThreshold: 25.0
      }
    })
  }, [deliveries])

  // 3. Komparasi Rata-rata Makronutrien terhadap Angka Kecukupan Gizi (AKG Kemenkes)
  const nutritionComparisonData = useMemo(() => {
    return [
      { component: 'Energi (kkal)', real: 518, target: 520, unit: 'kkal' },
      { component: 'Protein (g)', real: 30.5, target: 28, unit: 'g' },
      { component: 'Karbohidrat (g)', real: 64.2, target: 65, unit: 'g' },
      { component: 'Serat Pangan (g)', real: 5.9, target: 6.0, unit: 'g' },
      { component: 'Lemak Sehat (g)', real: 13.4, target: 14, unit: 'g' }
    ]
  }, [])

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-6">
      {/* Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Hasil deteksi porsi dan kesegaran makanan
            </h2>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600">
              REAL-TIME INGESTION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi klasifikasi visi komputer multi-objek, kontrol termal rantai dingin (*cold-chain*), dan akurasi gramatur nutrisi TKPI Kemenkes RI.
          </p>
        </div>

        {/* Live Pill Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Model: <strong className="text-slate-800">YOLOv8x-Food-v2.4</strong></span>
            <span className="text-slate-600">|</span>
            <span>Latency: <strong className="text-emerald-700 font-bold">18ms</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 1: Distribusi Status Verifikasi (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Rasio Hasil Verifikasi AI
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {deliveries.length} Pengiriman
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Proporsi boks yang lolos otomatis vs boks yang tertahan anomali visual atau memerlukan audit laboratorium.
            </p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
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
                              Total: <strong className="text-slate-900 font-mono font-bold tabular-nums">{d.value} Pengiriman</strong>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Pass Rate:</span>
            <span className="font-bold text-emerald-700">
              {deliveries.length > 0
                ? Math.round(
                    ((deliveries.filter((d) => d.yolo.status === 'verified' || d.yolo.status === 'overridden').length) /
                      deliveries.length) *
                      100
                  )
                : 0}
              % Layak Konsumsi
            </span>
          </div>
        </div>

        {/* Visual 2: Suhu Saat Tiba vs Threshold Cold-Chain (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="h-4 w-4 text-blue-600" />
                Telemetri Suhu Saat Tiba
              </h4>
              <span className="text-[10px] font-semibold text-rose-600 font-mono">
                Maks 25.0°C
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Monitoring suhu termal sensor IR armada boks pada detik serah terima porsi di gerbang sekolah penerima.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={thermalTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="school"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis domain={[20, 30]} tick={{ fontSize: 10, fill: '#64748b' }} unit="°" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[210px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 leading-snug">{d.fullSchool}</p>
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Waktu Scan:</span>
                                <span className="font-mono font-semibold text-slate-900 tabular-nums">{d.time}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Suhu Termal:</span>
                                <span className={`font-mono font-bold ${d.temp > 25 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                  {d.temp}°C
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Skor Kesegaran:</span>
                                <span className="font-mono font-bold text-blue-700">{d.freshness}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine
                    y={25.0}
                    stroke="#b91c1c"
                    strokeDasharray="3 3"
                    label={{ value: 'Batas Kemenkes (25°C)', fill: '#b91c1c', fontSize: 9, position: 'insideTopLeft' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#1d4ed8' }}
                    activeDot={{ r: 6 }}
                    name="Suhu Termal Tiba (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Rata-Rata Suhu Nasional:</span>
            <span className="font-bold text-slate-800">
              {deliveries.length
                ? (deliveries.reduce((acc, d) => acc + d.thermal.temp, 0) / deliveries.length).toFixed(1)
                : 0}
              °C (Stabil)
            </span>
          </div>
        </div>

        {/* Visual 3: Akurasi Standar Gizi TKPI Kemenkes (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-700" />
                Kepatuhan Makronutrien TKPI
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                100% STANDAR
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Komparasi estimasi gramatur dari model segmentasi YOLOv8 terhadap target AKG harian anak sekolah.
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nutritionComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="component"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    interval={0}
                    angle={-20}
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
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 leading-snug">{d.component}</p>
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Realisasi AI:</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {d.real} {d.unit}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Target Kemenkes:</span>
                                <span className="font-mono font-semibold text-slate-700">
                                  {d.target} {d.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="target" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Target AKG" />
                  <Bar dataKey="real" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Realisasi AI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Indeks Kepatuhan TKPI:</span>
            <span className="font-bold text-blue-700">99.6% Terpenuhi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DeliveriesCharts
