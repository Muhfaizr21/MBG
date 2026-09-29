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
  AreaChart,
  Area,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  ShieldAlert,
  Layers,
  Award,
  TrendingDown
} from 'lucide-react'

export function SppgCharts({ sppgList = [] }) {
  // 1. Data Kapasitas vs Kuota per Dapur
  const capacityData = useMemo(() => {
    return sppgList.map((item) => {
      // Short name for chart label
      const shortName = item.name.replace('SPPG Sentral ', '').replace('Dapur Katering ', '')
      return {
        name: shortName.length > 14 ? shortName.slice(0, 13) + '…' : shortName,
        fullName: item.name,
        KapasitasMaks: item.capacity.maxDailyPortions,
        KuotaAktif: item.capacity.activeQuota,
        utilizationPct: item.capacity.utilizationPct,
        status: item.status
      }
    })
  }, [sppgList])

  // 2. Tren Kepatuhan Rata-Rata 7 Hari vs Threshold 85%
  const trendData = useMemo(() => {
    const days = ['H-6 (22 Sep)', 'H-5 (23 Sep)', 'H-4 (24 Sep)', 'H-3 (25 Sep)', 'H-2 (26 Sep)', 'H-1 (27 Sep)', 'Hari Ini (28 Sep)']
    return days.map((dayLabel, idx) => {
      // Calculate average across active kitchens
      const activeKitchens = sppgList.filter((k) => k.status !== 'suspended')
      const totalScore = activeKitchens.reduce((acc, curr) => {
        return acc + (curr.scorecard.compliance7Days[idx] || 90)
      }, 0)
      const avgNational = activeKitchens.length ? +(totalScore / activeKitchens.length).toFixed(1) : 0

      // Get flagged kitchen (Surya Boga) specific trend
      const flaggedKitchen = sppgList.find((k) => k.id === 'sppg-4')
      const flaggedScore = flaggedKitchen ? flaggedKitchen.scorecard.compliance7Days[idx] : 82.0

      // Get benchmark top kitchen (Menteng)
      const topKitchen = sppgList.find((k) => k.id === 'sppg-1')
      const topScore = topKitchen ? topKitchen.scorecard.compliance7Days[idx] : 99.2

      return {
        day: dayLabel.split(' ')[0],
        date: dayLabel,
        RataNasional: avgNational,
        SuryaBogaAnomali: flaggedScore,
        SPPGMentengPrima: topScore,
        threshold: 85
      }
    })
  }, [sppgList])

  // 3. Distribusi Status Audit SLHS Dinkes
  const slhsDistribution = useMemo(() => {
    let valid = 0
    let expiring = 0
    let expired = 0

    sppgList.forEach((k) => {
      if (k.certificates.slhs.status === 'valid') valid++
      else if (k.certificates.slhs.status === 'expiring') expiring++
      else expired++
    })

    return [
      { name: 'SLHS Aktif Valid', value: valid, color: '#047857' },
      { name: 'Segera Kedaluwarsa (<30 Hr)', value: expiring, color: '#b45309' },
      { name: 'Kedaluwarsa / Perlu Uji', value: expired, color: '#b91c1c' }
    ]
  }, [sppgList])

  // 4. Performa Rapor Scorecard Gabungan
  const scorecardSummary = useMemo(() => {
    if (!sppgList.length) return { safety: 0, cold: 0, time: 0, count: 0 }
    const active = sppgList.filter((k) => k.status !== 'suspended')
    const count = active.length || 1
    const safety = +(active.reduce((acc, k) => acc + k.scorecard.safetyScore, 0) / count).toFixed(1)
    const cold = +(active.reduce((acc, k) => acc + k.scorecard.coldChainScore, 0) / count).toFixed(1)
    const time = +(active.reduce((acc, k) => acc + k.scorecard.timelinessScore, 0) / count).toFixed(1)
    return { safety, cold, time, count }
  }, [sppgList])

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Telemetri Analitik Mutu & Kapasitas Produsen
            </h2>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600">
              7 VENDOR TERPILIH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi komparatif daya tampung kuota harian, audit suhu cold-chain, dan deteksi dini penurunan mutu pangan di bawah ambang batas legal.
          </p>
        </div>

        {/* Live Pill Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>AI QC: <strong className="text-slate-800">YOLOv8 Live</strong></span>
            <span className="text-slate-600">|</span>
            <span>Threshold: <strong className="text-rose-600 font-bold">&ge;85%</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of 3 Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 1: Kapasitas vs Kuota Harian (Col 5) */}
        <div className="lg:col-span-5 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                Alokasi Kuota vs Kapasitas Mesin
              </h4>
              <span className="text-[10px] font-semibold text-slate-500">Porsi / Hari</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Membandingkan volume porsi aktif dengan kapasitas aman peralatan masak (combi steamer & bratt pan) untuk mencegah overload operasional.
            </p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
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
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 leading-snug">{d.fullName}</p>
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Kapasitas Maksimal:</span>
                                <span className="font-mono font-bold text-slate-900">{d.KapasitasMaks.toLocaleString()} porsi</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Kuota Aktif:</span>
                                <span className="font-mono font-bold text-emerald-700">{d.KuotaAktif.toLocaleString()} porsi</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-100 pt-1">
                                <span className="text-slate-500">Rasio Utilisasi:</span>
                                <span className="font-mono font-bold text-amber-700">{d.utilizationPct}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                  />
                  <Bar dataKey="KapasitasMaks" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Kapasitas Maks" />
                  <Bar dataKey="KuotaAktif" fill="#1d4ed8" radius={[3, 3, 0, 0]} name="Kuota Aktif" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Rata-rata Utilisasi Nasional: <strong>78.4%</strong></span>
            <span className="text-blue-700 font-semibold">Tersedia Buffer 21.6%</span>
          </div>
        </div>

        {/* Visual 2: Tren Kepatuhan 7 Hari & Garis Batas SP (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                Riwayat Kepatuhan vs Ambang SP
              </h4>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 font-mono">
                AMBANG 85%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Monitoring 7 hari berturut-turut. Vendor dengan skor &lt;85% otomatis memenuhi klausul penerbitan SP-1 / SP-2.
            </p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSurya" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[210px] z-50 pointer-events-none select-none">
                            <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">{d.date}</p>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between gap-4 text-emerald-700">
                                <span>Menteng 01 (Prima):</span>
                                <span className="font-mono font-bold">{d.SPPGMentengPrima}%</span>
                              </div>
                              <div className="flex justify-between gap-4 text-blue-700">
                                <span>Rata-rata Nasional:</span>
                                <span className="font-mono font-bold">{d.RataNasional}%</span>
                              </div>
                              <div className="flex justify-between gap-4 text-rose-700 font-bold border-t border-slate-100 pt-1">
                                <span>Surya Boga (SP-1):</span>
                                <span className="font-mono">{d.SuryaBogaAnomali}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine
                    y={85}
                    stroke="#b91c1c"
                    strokeDasharray="3 3"
                    label={{ value: 'Batas Kritis SP (85%)', fill: '#b91c1c', fontSize: 10, position: 'insideBottomRight' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="RataNasional"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                    name="Rata-rata Nasional"
                  />
                  <Area
                    type="monotone"
                    dataKey="SuryaBogaAnomali"
                    stroke="#b91c1c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSurya)"
                    name="Surya Boga (Anomali)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              1 Dapur di Bawah Ambang SP-1
            </span>
            <span className="font-mono text-slate-500 text-[10px]">Pemberitahuan Aktif</span>
          </div>
        </div>

        {/* Visual 3: Rapor Sanitasi & Sertifikat SLHS (Col 3) */}
        <div className="lg:col-span-3 bg-slate-50/60 rounded-xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                Status SLHS & Scorecard
              </h4>
              <span className="text-[10px] font-semibold text-slate-500 font-mono">DINKES RI</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              Komposisi legalitas sanitasi laik hygiene dan kesehatan pangan vendor.
            </p>

            {/* Scorecard Tri-Pills */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-white rounded-lg p-2 border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">Safety AI</p>
                <p className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">{scorecardSummary.safety}%</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">Cold-chain</p>
                <p className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">{scorecardSummary.cold}%</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-medium text-slate-500">Tepat waktu</p>
                <p className="text-sm font-extrabold text-blue-700 font-mono mt-0.5">{scorecardSummary.time}%</p>
              </div>
            </div>

            {/* Donut Chart SLHS Status */}
            <div className="h-32 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slhsDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={52}
                    paddingAngle={3}
                  >
                    {slhsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[170px] z-50 pointer-events-none select-none">
                            <span className="font-bold text-slate-900 block">{d.name}:</span>
                            <span className="font-mono font-semibold text-slate-700 tabular-nums text-[11px]">{d.value} Produsen</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-slate-900 leading-none">
                  {sppgList.length}
                </span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5">Dapur</span>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="space-y-1.5 text-[10px] text-slate-600 mt-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  SLHS Valid Aktif
                </span>
                <span className="font-mono font-bold text-slate-900">{slhsDistribution[0]?.value || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Segera Kadaluarsa (&lt;30 Hr)
                </span>
                <span className="font-mono font-bold text-amber-600">{slhsDistribution[1]?.value || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Kadaluarsa / Perlu Uji
                </span>
                <span className="font-mono font-bold text-rose-600">{slhsDistribution[2]?.value || 0}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standar Audit:</span>
            <span className="font-bold text-slate-700">BPOM & Dinkes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
