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
import { ShieldCheck, TrendingUp, PieChart as PieIcon } from 'lucide-react'

const PIE_COLORS = {
  cleared: STATUS.ok,
  adjusted: STATUS.info,
  blocked: STATUS.critical,
}

import { STATUS } from './chartTheme.jsx'
export function ReportsCharts({
  bastList = [],
  invoicesList = []
}) {
  // 1. Data Rekonsiliasi Forensik Tagihan Vendor (Bar Chart)
  const reconciliationData = invoicesList.map((inv) => ({
    name: inv.sppgId.replace('SPPG-', ''),
    fullName: inv.sppgName,
    claimed: Math.round(inv.totalClaimedAmount / 1000000), // Dalam Juta Rupiah
    approved: Math.round(inv.approvedPaymentAmount / 1000000),
    deduction: Math.round(inv.penaltyDeductionAmount / 1000000),
    deductionExact: inv.penaltyDeductionAmount
  }))

  // 2. Data Status BAST Digital (Donut Chart)
  const bastStatusCounts = bastList.reduce((acc, b) => {
    if (b.paymentClearanceStatus === 'cleared') acc.cleared = (acc.cleared || 0) + 1
    else if (b.paymentClearanceStatus === 'adjusted') acc.adjusted = (acc.adjusted || 0) + 1
    else acc.blocked = (acc.blocked || 0) + 1
    return acc
  }, {})

  const totalBast = bastList.length

  const bastDonutData = [
    {
      name: '100% Valid & Lolos AI',
      count: bastStatusCounts.cleared || 0,
      share: totalBast ? Math.round(((bastStatusCounts.cleared || 0) / totalBast) * 100) : 0,
      color: PIE_COLORS.cleared
    },
    {
      name: 'Disetujui dg Pemotongan',
      count: bastStatusCounts.adjusted || 0,
      share: totalBast ? Math.round(((bastStatusCounts.adjusted || 0) / totalBast) * 100) : 0,
      color: PIE_COLORS.adjusted
    },
    {
      name: 'Diblokir Total (Insiden)',
      count: bastStatusCounts.blocked || 0,
      share: totalBast ? Math.round(((bastStatusCounts.blocked || 0) / totalBast) * 100) : 0,
      color: PIE_COLORS.blocked
    }
  ].filter((i) => i.count > 0)

  // Total Safeguarded Rupiah
  const totalSafeguarded = invoicesList.reduce((sum, inv) => sum + inv.penaltyDeductionAmount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Audit Forensik Tagihan Vendor vs Realisasi AI */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span>Audit Forensik: Klaim Vendor vs Realisasi Porsi Sah (Juta Rp)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Membandingkan tagihan bruto invoice vendor dengan hasil verifikasi riil kamera AI &amp; telemetri suhu validator
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Klaim Vendor</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Otorisasi Sah</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reconciliationData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  unit=" Jt"
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
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[220px] z-50 pointer-events-none select-none">
                          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">{data.fullName}</p>
                          <div className="space-y-1 text-slate-600 text-[11px]">
                            <p className="flex justify-between gap-4">
                              <span>Klaim Tagihan Vendor:</span>
                              <strong className="text-slate-900 font-semibold font-mono">Rp {data.claimed} Jt</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Otorisasi BAST Valid:</span>
                              <strong className="text-emerald-700 font-bold font-mono">Rp {data.approved} Jt</strong>
                            </p>
                            {data.deductionExact > 0 && (
                              <p className="flex justify-between gap-4 text-rose-700 font-bold border-t border-slate-100 pt-1">
                                <span>Potongan Basi / Rusak:</span>
                                <span className="font-mono">-Rp {(data.deductionExact).toLocaleString('id-ID')}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="claimed"
                  name="Klaim Tagihan"
                  fill="#94a3b8"
                  radius={[3, 3, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="approved"
                  name="Otorisasi Cair"
                  fill="#047857"
                  radius={[3, 3, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2 text-xs">
            <span className="text-slate-600">
              Total Penyelamatan Anggaran dari Anomali/Basi:
            </span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Rp {totalSafeguarded.toLocaleString('id-ID')} Terselamatkan
            </span>
          </div>
        </div>

        {/* Right Chart: Status BAST Digital (Donut Chart) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Kelaikan BAST Digital</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {totalBast} Berkas BAST
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-2">
              Distribusi kelaikan serah terima makanan per status
            </p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bastDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {bastDonutData.map((entry, index) => (
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
                            <span className="text-slate-600 font-medium text-[11px]">{data.count} dokumen ({data.share}%)</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">{totalBast}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase mt-0.5 tracking-wider">BAST</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {bastDonutData.map((item, idx) => (
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

          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px] text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="font-medium">Prototipe belum terhubung ke sistem penandatanganan atau audit eksternal.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
