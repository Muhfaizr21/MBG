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
import { Users, ShieldAlert, CheckCircle2 } from 'lucide-react'

const URGENCY_COLORS = {
  critical: STATUS.critical,
  important: STATUS.warn,
  info: STATUS.info,
}

import { STATUS } from './chartTheme.jsx'
export function NoticesCharts({ notices = [] }) {
  // 1. Urgency Breakdown for Donut Chart
  const urgencyCounts = notices.reduce((acc, n) => {
    if (n.status === 'active') {
      acc[n.urgency] = (acc[n.urgency] || 0) + 1
    }
    return acc
  }, {})

  const activeTotal = notices.filter((n) => n.status === 'active').length

  const urgencyDonutData = [
    {
      name: 'Panggilan Darurat (Flash Alert)',
      count: urgencyCounts.critical || 0,
      share: activeTotal ? Math.round(((urgencyCounts.critical || 0) / activeTotal) * 100) : 0,
      color: URGENCY_COLORS.critical
    },
    {
      name: 'Penting (Advis Musiman)',
      count: urgencyCounts.important || 0,
      share: activeTotal ? Math.round(((urgencyCounts.important || 0) / activeTotal) * 100) : 0,
      color: URGENCY_COLORS.important
    },
    {
      name: 'Info Biasa (Surat Edaran/Sistem)',
      count: urgencyCounts.info || 0,
      share: activeTotal ? Math.round(((urgencyCounts.info || 0) / activeTotal) * 100) : 0,
      color: URGENCY_COLORS.info
    }
  ].filter((item) => item.count > 0)

  // 3. Acknowledgement & Readership stats per notice
  const readershipData = notices
    .filter((n) => n.status === 'active')
    .map((n) => ({
      title: n.title.length > 22 ? n.title.substring(0, 20) + '..' : n.title,
      fullTitle: n.title,
      acknowledged: n.acknowledgementStats.acknowledgedCount,
      pending: n.acknowledgementStats.totalRecipients - n.acknowledgementStats.acknowledgedCount,
      rate: n.acknowledgementStats.complianceRate,
      urgency: n.urgency
    }))

  return (
    <div className="space-y-4">
      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Readership & Acknowledgment Rates */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Tingkat Keterbacaan &amp; Konfirmasi Sasaran (*Tap to Acknowledge*)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Konfirmasi digital resmi dari guru validator &amp; operator Dapur SPPG di lapangan
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Telah Dikonfirmasi</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span>Belum Dibaca</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readershipData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
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
                          {data.fullTitle}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Dikonfirmasi:</span>
                            <strong className="text-emerald-700 font-mono font-bold">{data.acknowledged} user</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Belum Dibaca:</span>
                            <strong className="text-slate-600 font-mono font-semibold">{data.pending} user</strong>
                          </div>
                        </div>
                        <div className="pt-1.5 mt-1 border-t border-slate-100 text-[11px] flex items-center justify-between">
                          <span className="text-slate-500">Tingkat Kepatuhan:</span>
                          <strong className="text-amber-700 font-mono font-bold">{data.rate}%</strong>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="acknowledged" stackId="a" fill="#047857" radius={[3, 3, 0, 0]} name="Dikonfirmasi" />
                <Bar dataKey="pending" stackId="a" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Belum Dibaca" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Urgency Donut Breakdown */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Komposisi Urgensi Maklumat</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total {activeTotal} maklumat aktif dalam pengawasan
            </p>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyDonutData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {urgencyDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs shadow-xl min-w-[160px] z-50 pointer-events-none select-none">
                          <p className="font-bold text-slate-900">{d.name}</p>
                          <p className="text-emerald-700 font-mono font-semibold mt-0.5">{d.count} maklumat ({d.share}%)</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {urgencyDonutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium truncate max-w-[160px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 font-semibold">{item.count}</span>
                  <span className="text-[11px] text-slate-500">({item.share}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
