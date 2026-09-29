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
import { ShieldAlert, Clock, PieChart as PieIcon, ShieldCheck } from 'lucide-react'
import { STATUS } from './chartTheme.jsx'

// Tingkat keparahan -> warna status. Menurun = increasingly severe.
const SEVERITY_COLORS = {
  level1: STATUS.warn,
  level2: STATUS.critical,
  level3: STATUS.ok,
}

export function FeedbackCharts({ tickets = [] }) {
  // 1. Data Breakdown Tingkat Kegawatan
  const severityCounts = tickets.reduce((acc, t) => {
    acc[t.severity] = (acc[t.severity] || 0) + 1
    return acc
  }, {})

  const totalTickets = tickets.length

  const severityDonutData = [
    {
      name: 'Level 1 (Kritis - Bahaya Keracunan)',
      count: severityCounts.level1 || 0,
      share: totalTickets ? Math.round(((severityCounts.level1 || 0) / totalTickets) * 100) : 0,
      color: SEVERITY_COLORS.level1
    },
    {
      name: 'Level 2 (Sedang - Kualitas/Porsi)',
      count: severityCounts.level2 || 0,
      share: totalTickets ? Math.round(((severityCounts.level2 || 0) / totalTickets) * 100) : 0,
      color: SEVERITY_COLORS.level2
    },
    {
      name: 'Level 3 (Rendah - Saran Menu)',
      count: severityCounts.level3 || 0,
      share: totalTickets ? Math.round(((severityCounts.level3 || 0) / totalTickets) * 100) : 0,
      color: SEVERITY_COLORS.level3
    }
  ].filter((i) => i.count > 0)

  // 2. Data SLA Response Time per Wilayah (Menit dari Maks 120 Menit)
  const slaResponseData = [
    { city: 'Bandung', responseTime: 25, maxSla: 120, status: 'Patuh SLA' },
    { city: 'Jakarta Selatan', responseTime: 38, maxSla: 120, status: 'Patuh SLA' },
    { city: 'Semarang', responseTime: 20, maxSla: 120, status: 'Patuh SLA' },
    { city: 'Surabaya', responseTime: 45, maxSla: 120, status: 'Patuh SLA' }
  ]

  // Total Siswa Terlindungi dari Makanan Basi (Kill-Switch Portions)
  const protectedPortionsTotal = tickets.reduce((sum, t) => {
    if (t.isKillSwitchExecuted && t.killSwitchDetails) {
      return sum + t.killSwitchDetails.haltedPortionsTotal
    }
    return sum
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: SLA Respons Penanganan Kasus < 2 Jam */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Kecepatan Respons Penanganan Aduan (Menit vs Batas SLA 120 Menit)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Waktu jeda sejak guru melapor hingga Koordinator Wilayah &amp; Tim Medis melakukan tindakan mitigasi
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>100% Sesuai SLA (&lt; 2 Jam)</span>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaResponseData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="city"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  unit=" mnt"
                  domain={[0, 120]}
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
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">Wilayah: {data.city}</p>
                          <div className="space-y-1 text-slate-600 text-[11px]">
                            <p className="flex justify-between gap-4">
                              <span>Waktu Respons Riil:</span>
                              <strong className="text-blue-700 font-bold font-mono">{data.responseTime} Menit</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Batas Maksimum SLA:</span>
                              <strong className="text-slate-800 font-semibold font-mono">{data.maxSla} Menit (2 Jam)</strong>
                            </p>
                            <p className="flex justify-between gap-4 text-emerald-700 font-bold border-t border-slate-100 pt-1">
                              <span>Status Kepatuhan:</span>
                              <span>{data.status}</span>
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="responseTime"
                  name="Waktu Respons"
                  fill="#1d4ed8"
                  radius={[3, 3, 0, 0]}
                  barSize={36}
                >
                  {slaResponseData.map((entry, index) => (
                    <Cell
                      key={`sla-bar-${index}`}
                      fill={entry.responseTime <= 60 ? '#047857' : '#b45309'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2 text-xs">
            <span className="text-slate-600">
              Total Porsi Diamankan via Kill-Switch (Zero Siswa Terpapar):
            </span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {protectedPortionsTotal.toLocaleString('id-ID')} Porsi Tercegah
            </span>
          </div>
        </div>

        {/* Right Chart: Tingkat Kegawatan Insiden (Donut Chart) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Kategori Tingkat Kegawatan</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {totalTickets} Tiket Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Klasifikasi insiden mutu pangan, gramatur porsi, dan feedback rasa
            </p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {severityDonutData.map((entry, index) => (
                      <Cell key={`sev-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[160px] z-50 pointer-events-none select-none">
                            <span className="font-bold text-slate-900 block">{data.name}</span>
                            <span className="text-slate-600 font-medium text-[11px]">{data.count} aduan ({data.share}%)</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">{totalTickets}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase mt-0.5 tracking-wider">Aduan</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {severityDonutData.map((item, idx) => (
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

          <div className="mt-3 p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center gap-2 text-[11px] text-rose-900">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">Insiden Level 1 langsung mentrigger Emergency Kill-Switch ke aplikasi validator.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
