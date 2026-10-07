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
import { Clock, Truck, ShieldCheck, Flame } from 'lucide-react'
import { STATUS, NEUTRAL } from './chartTheme.jsx'

const STATUS_COLORS = {
  arrived: STATUS.ok,
  on_time: STATUS.info,
  delayed_traffic: STATUS.warn,
  fleet_breakdown: STATUS.critical,
  rescheduled: NEUTRAL.idle,
}

export function ScheduleCharts({ schedules = [] }) {
  // ETA vs Target arrival comparison data (convert time strings like "06:55 WIB" to minutes from 06:00)
  const timeToMinutesFrom6Am = (timeStr) => {
    if (!timeStr) return 0
    const match = timeStr.match(/(\d{2}):(\d{2})/)
    if (!match) return 0
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    return (hours - 6) * 60 + minutes // 06:00 is 0, 07:00 is 60, 07:30 is 90
  }

  const etaComparisonData = schedules.map((s) => {
    const targetMin = timeToMinutesFrom6Am(s?.timestamps?.targetArrival)
    const etaMin = timeToMinutesFrom6Am(s?.timestamps?.currentEta)
    const isLate = etaMin > 90 // Later than 07:30 WIB
    const sName = s?.schoolName || 'Sekolah'
    return {
      schoolName: sName.length > 18 ? sName.substring(0, 16) + '..' : sName,
      fullName: sName,
      plateNumber: s?.fleet?.plateNumber || '-',
      driverName: s?.fleet?.driverName || '-',
      targetTime: s?.timestamps?.targetArrival || '-',
      etaTime: s?.timestamps?.currentEta || '-',
      targetMin,
      etaMin,
      isLate,
      status: s?.status || 'on_time',
      delayMinutes: s?.timestamps?.delayMinutes || 0
    }
  })

  // Status donut data
  const statusCounts = schedules.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  const totalSchedules = schedules.length
  const statusDonutData = [
    {
      name: 'Tiba di Sekolah',
      count: statusCounts.arrived || 0,
      share: totalSchedules ? Math.round(((statusCounts.arrived || 0) / totalSchedules) * 100) : 0,
      color: STATUS_COLORS.arrived
    },
    {
      name: 'Tepat Waktu',
      count: statusCounts.on_time || 0,
      share: totalSchedules ? Math.round(((statusCounts.on_time || 0) / totalSchedules) * 100) : 0,
      color: STATUS_COLORS.on_time
    },
    {
      name: 'Peringatan Macet (>20m)',
      count: statusCounts.delayed_traffic || 0,
      share: totalSchedules ? Math.round(((statusCounts.delayed_traffic || 0) / totalSchedules) * 100) : 0,
      color: STATUS_COLORS.delayed_traffic
    },
    {
      name: 'Armada Mogok / Re-route',
      count: statusCounts.fleet_breakdown || 0,
      share: totalSchedules ? Math.round(((statusCounts.fleet_breakdown || 0) / totalSchedules) * 100) : 0,
      color: STATUS_COLORS.fleet_breakdown
    },
    {
      name: 'Jadwal Khusus',
      count: statusCounts.rescheduled || 0,
      share: totalSchedules ? Math.round(((statusCounts.rescheduled || 0) / totalSchedules) * 100) : 0,
      color: STATUS_COLORS.rescheduled
    }
  ].filter((item) => item.count > 0)

  return (
    <div className="space-y-4">
      {/* 3 Core Delivery Windows Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Standar Protokol Jendela Waktu Kirim (*Delivery Window*) MBG</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencegahan penurunan mutu organoleptik makanan siap saji sebelum bel masuk sekolah
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start md:self-auto">
            Juknis Operasional Bab 3.3.2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Window 1: Sesi Masak Dapur */}
          <div className="p-3.5 rounded-xl border border-amber-200/90 bg-amber-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                <span>1. Sesi Masak Dapur</span>
              </span>
              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                04:30 – 06:15 WIB
              </span>
            </div>
            <p className="text-[11px] text-amber-950/80 leading-relaxed">
              Memasak serentak di SPPG &amp; pengemasan boks berinsulasi termal higienis (suhu inti min 60°C).
            </p>
          </div>

          {/* Window 2: Pemberangkatan Armada */}
          <div className="p-3.5 rounded-xl border border-blue-200/90 bg-blue-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-blue-600" />
                <span>2. Pemberangkatan Armada</span>
              </span>
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded">
                Maksimal 06:30 WIB
              </span>
            </div>
            <p className="text-[11px] text-blue-950/80 leading-relaxed">
              Semua van pendingin &amp; box thermo meninggalkan loading dock SPPG menuju koridor sekolah tujuan.
            </p>
          </div>

          {/* Window 3: Jendela Kedatangan Wajib */}
          <div className="p-3.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>3. Jendela Kedatangan Wajib</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                06:45 – 07:30 WIB
              </span>
            </div>
            <p className="text-[11px] text-emerald-950/80 leading-relaxed">
              Wajib tiba di gerbang sekolah sebelum siswa masuk kelas untuk sarapan pagi &amp; verifikasi validator.
            </p>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Target Arrival vs Live ETA */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Komparasi Target Jam Tiba vs Estimasi Real-Time (ETA)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ambang batas batas akhir sarapan siswa: <strong>07:30 WIB</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Jadwal Target</span>
              </span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Live ETA (Lancar)</span>
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Macet (&gt;20m)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={etaComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
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
                  domain={[30, 120]}
                  tickFormatter={(val) => {
                    const h = 6 + Math.floor(val / 60)
                    const m = val % 60
                    return `0${h}:${m < 10 ? '0' : ''}${m}`
                  }}
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
                          {data.fullName}
                        </p>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Armada: <strong className="text-slate-900 font-mono tabular-nums font-bold">{data.plateNumber}</strong> ({data.driverName})
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1 border-t border-slate-100">
                          <span className="text-slate-500">Jadwal Target:</span>
                          <strong className="text-slate-700 font-mono">{data.targetTime}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-slate-500">Estimasi Tiba (ETA):</span>
                          <strong
                            className={`font-mono font-bold ${
                              data.delayMinutes > 20
                                ? 'text-amber-700'
                                : data.status === 'fleet_breakdown'
                                ? 'text-rose-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {data.etaTime}
                          </strong>
                        </div>
                        {data.delayMinutes > 0 && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2 font-medium">
                            Terlambat {data.delayMinutes} menit dari jadwal rencana
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <Bar dataKey="targetMin" fill="#94a3b8" radius={[3, 3, 0, 0]} name="Target" />
                <Bar
                  dataKey="etaMin"
                  name="Live ETA"
                  radius={[3, 3, 0, 0]}
                >
                  {etaComparisonData.map((entry, index) => {
                    let fill = STATUS_COLORS.on_time
                    if (entry.status === 'arrived') fill = STATUS_COLORS.arrived
                    else if (entry.status === 'delayed_traffic') fill = STATUS_COLORS.delayed_traffic
                    else if (entry.status === 'fleet_breakdown') fill = STATUS_COLORS.fleet_breakdown
                    else if (entry.status === 'rescheduled') fill = STATUS_COLORS.rescheduled
                    return <Cell key={`bar-${index}`} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Fleet Status Donut */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-blue-700" />
              <span>Status Distribusi Armada Hari Ini</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total {totalSchedules} armada logistik dalam pengawasan
            </p>

            <div className="h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDonutData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {statusDonutData.map((entry, index) => (
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
                          <p className="text-emerald-700 font-mono font-semibold mt-0.5">{d.count} armada ({d.share}%)</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {statusDonutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium truncate max-w-[150px]">{item.name}</span>
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
