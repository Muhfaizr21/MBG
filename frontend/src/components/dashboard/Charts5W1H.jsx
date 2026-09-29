import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

/*
 * Pusat Analitika Pengawasan Mutu & Logistik MBG.
 *
 * Design read: console pengawasan pangan untuk koordinator Satgas yang
 * membaca anomali dalam hitungan detik, bahasa visual panel instrumen
 * (angka rapat, tanpa hiasan). Dial ENERGY 1 / RHYTHM 1 / MOTION 1.
 *
 * Keputusan yang ditulis turun (R-31):
 * - angka memakai tabular/mono: kolom angka harus sejajar saat dibanding
 * - label memakai sans: mono untuk label teks bukan fungsi, hanya meniru
 *   gaya "enterprise"
 * - satu kartu satu legenda ringkas, tanpa kotak legenda dan tanpa badge
 *   kapsul: enam badge seragam itu capping-kosmetik, bukan informasi
 * - grid chart solid, bukan putus-putus: putus-putus dibaca sebagai
 *   blueprint dekoratif, solid sebagai alat baca nilai
 * - satu titik denyut pada penanda data langsung: memberi tahu data还在 mengalir
 * - dataset prototipe, dilabeli sebagai simulasi karena belum tersambung API
 */

const NUTRITION_DATA = [
  { nutrient: 'Energi', actual: 545, target: 550, unit: 'kkal' },
  { nutrient: 'Protein', actual: 34.2, target: 30.0, unit: 'g' },
  { nutrient: 'Karbohidrat', actual: 68.4, target: 70.0, unit: 'g' },
  { nutrient: 'Lemak', actual: 14.1, target: 15.0, unit: 'g' },
  { nutrient: 'Serat', actual: 7.2, target: 6.0, unit: 'g' },
]

const DEMOGRAPHICS_DATA = [
  { name: 'SD Kelas 1-3', value: 206280, color: '#1d4ed8' },
  { name: 'SD Kelas 4-6', value: 228000, color: '#047857' },
  { name: 'SMP / MTs', value: 108570, color: '#1d4ed8' },
]

const LOGISTICS_DATA = [
  { region: 'DKI & Bodetabek', terkirim: 168200, kapasitas: 170000 },
  { region: 'Bandung & Priangan', terkirim: 134500, kapasitas: 135000 },
  { region: 'Jateng & D.I.Y', terkirim: 112400, kapasitas: 115000 },
  { region: 'Jatim & Bali-NTB', terkirim: 98750, kapasitas: 100000 },
  { region: 'Luar Jawa', terkirim: 78000, kapasitas: 80000 },
]

const HOURLY_FLOW_DATA = [
  { time: '04:30', volume: 15000 },
  { time: '05:30', volume: 45000 },
  { time: '06:30', volume: 85000 },
  { time: '07:15', volume: 125000 },
  { time: '08:30', volume: 110000 },
  { time: '09:30', volume: 85000 },
  { time: '10:15', volume: 5000 },
]

const RISK_FACTORS_DATA = [
  { factor: 'Suhu box di atas 25C', pct: 42, cases: 24, color: '#b91c1c', action: 'Ganti ice gel cadangan' },
  { factor: 'Keterlambatan macet', pct: 28, cases: 16, color: '#b45309', action: 'Rute alternatif berkawal' },
  { factor: 'Kemasan penyok transit', pct: 16, cases: 9, color: '#1d4ed8', action: 'Tambah porsi buffer dapur' },
  { factor: 'AI flag tekstur', pct: 10, cases: 6, color: '#b91c1c', action: 'Karantina sampel lab' },
  { factor: 'Penyesuaian alergen', pct: 4, cases: 2, color: '#047857', action: 'Distribusi menu khusus' },
]

const SLA_RADAR_DATA = [
  { subject: 'Ketepatan waktu', score: 99.4 },
  { subject: 'Suhu cold-chain', score: 99.2 },
  { subject: 'Presisi gizi AKG', score: 99.5 },
  { subject: 'Deteksi anomali porsi', score: 99.8 },
  { subject: 'Kepuasan sekolah', score: 98.6 },
]

const pct = (n) => `${n}%`

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs shadow-xl min-w-[180px] z-50 pointer-events-none select-none">
      {label && <p className="mb-1.5 border-b border-slate-100 pb-1.5 font-bold text-slate-900 leading-snug">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey || entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 text-[11px]">
              <span className="h-2 w-2 rounded-xs shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}
            </span>
            <span className="tabular-nums font-bold text-slate-900 font-mono text-[11px]">
              {Number(entry.value).toLocaleString('id-ID')}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * Satu kerangka kartu untuk keenam grafik. Alasannya wrote-down (R-14):
 * kartu dasbor memang harus seragam supaya mata membandingkan angka antar
 * panel, bukan supaya Six Different Cards Decorative.
 */
function ChartCard({ title, note, meta, legend, footer, children }) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <header className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-snug text-slate-900">{title}</h3>
          {note && <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{note}</p>}
        </div>
        {meta && <p className="shrink-0 pt-0.5 text-right text-[11px] font-semibold text-slate-500">{meta}</p>}
      </header>

      <div className="flex-1">
        {children}
        {legend}
      </div>

      {footer && (
        <footer className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">{footer}</footer>
      )}
    </section>
  )
}

export function Charts5W1H() {
  const [activeTab, setActiveTab] = useState('all')
  const [timeFilter, setTimeFilter] = useState('today')
  const [toast, setToast] = useState(null)

  const triggerToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const TABS = [
    { id: 'all', label: 'Semua domain' },
    { id: 'nutrition', label: 'Nutrisi & AKG' },
    { id: 'demographics', label: 'Demografi siswa' },
    { id: 'logistics', label: 'Sebaran logistik' },
    { id: 'hourly', label: 'Aliran jam HACCP' },
    { id: 'risks', label: 'Mitigasi risiko' },
    { id: 'sla', label: 'Radar SLA' },
  ]

  const TIME_FILTERS = [
    { id: 'today', label: 'Hari ini' },
    { id: '7d', label: '7 hari' },
    { id: '30d', label: '30 hari' },
    { id: 'q1', label: 'Kuartal I 2026' },
  ]

  const studentTotal = DEMOGRAPHICS_DATA.reduce((sum, d) => sum + d.value, 0)
  const maxUtilization = Math.max(
    ...LOGISTICS_DATA.map((r) => Math.round((r.terkirim / r.kapasitas) * 100))
  )

  return (
    <section className="space-y-4">
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-md"
        >
          {toast}
        </div>
      )}

      {/* Bar kendali: satu Accelerator untuk satuutter filter, satu aksi ekspor */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Telemetri分布 nasional
              <span className="font-normal text-slate-500">Baku AKG Kemenkes RI</span>
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Pusat Analitika Pengawasan Mutu
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Realisasi gizi per porsi, pelacakan suhu cold-chain, dan utilisasi kapasitas dapur
              SPPG per klaster wilayah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Rentang waktu"
              className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            >
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.id}
                  aria-pressed={timeFilter === f.id}
                  onClick={() => {
                    setTimeFilter(f.id)
                    triggerToast(`Rentang analitika: ${f.label}`)
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    timeFilter === f.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => triggerToast('Ekspor PDF belum terhubung ke backend.')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Unduh BAST
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Domain analitika"
          className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 no-scrollbar"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(activeTab === 'all' || activeTab === 'nutrition') && (
          <ChartCard
            title="Kepatuhan Nutrisi vs Baku AKG"
            note="Rata-rata porsi tervalidasi per hari"
            meta="Toleransi plus minus 5 persen"
            legend={
              <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-600" />
                  Realisasi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-slate-300" />
                  Target AKG
                </span>
              </div>
            }
            footer={<p className="tabular-nums">Skor kepatuhan 98,8 persen</p>}
          >
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={NUTRITION_DATA} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="nutrient"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="target" name="Target AKG" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={11} />
                  <Bar dataKey="actual" name="Realisasi" fill="#1d4ed8" radius={[3, 3, 0, 0]} barSize={11} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {(activeTab === 'all' || activeTab === 'demographics') && (
          <ChartCard
            title="Stratifikasi Kohort Siswa"
            note="Siswa terdaftar per jenjang sekolah"
            meta={`${studentTotal.toLocaleString('id-ID')} siswa`}
            footer={<p className="tabular-nums">Rasiogender 51,2 persen laki-laki</p>}
          >
            <div className="relative flex h-48 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<ChartTooltip />}
                    formatter={(v) => `${Number(v).toLocaleString('id-ID')} siswa`}
                  />
                  <Pie
                    data={DEMOGRAPHICS_DATA}
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                    dataKey="value"
                  >
                    {DEMOGRAPHICS_DATA.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular-nums text-lg font-bold leading-none text-slate-900">
                  {Math.round(studentTotal / 1000)}k
                </span>
                <span className="mt-1 text-[10px] text-slate-500">siswa aktif</span>
              </div>
            </div>

            <ul className="mt-2 space-y-1.5">
              {DEMOGRAPHICS_DATA.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {pct(Math.round((d.value / studentTotal) * 100))}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        )}

        {(activeTab === 'all' || activeTab === 'logistics') && (
          <ChartCard
            title="Utilisasi Kapasitas Dapur SPPG"
            note="Porsi terkirim dibanding kapasitas harian"
            meta="128 dapur aktif"
            legend={
              <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-blue-600" />
                  Porsi terkirim
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-slate-200" />
                  Kapasitas
                </span>
              </div>
            }
            footer={<p className="tabular-nums">Tertinggi {maxUtilization} persen di DKI dan Bodetabek</p>}
          >
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={LOGISTICS_DATA}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <YAxis
                    dataKey="region"
                    type="category"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={92}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="kapasitas"
                    name="Kapasitas"
                    fill="#e2e8f0"
                    radius={[3, 3, 0, 0]}
                    barSize={9}
                  />
                  <Bar
                    dataKey="terkirim"
                    name="Terkirim"
                    fill="#1d4ed8"
                    radius={[3, 3, 0, 0]}
                    barSize={9}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {(activeTab === 'all' || activeTab === 'hourly') && (
          <ChartCard
            title="Aliran Porsi per Jam"
            note="Volume distribusi sepanjang siklus投递 pagi"
            meta="Batas aman 4 jam"
            footer={<p className="tabular-nums">Puncak 125.000 porsi pukul 07.15</p>}
          >
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_FLOW_DATA} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mbgFlowFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1' }} />
                  <ReferenceLine x="10:15" stroke="#b91c1c" strokeWidth={1} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Porsi"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    fill="url(#mbgFlowFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {(activeTab === 'all' || activeTab === 'risks') && (
          <ChartCard
            title="Faktor Deviasi dan Tindak Lanjut"
            note="Proporsi anomali yang tercatat hari ini"
            meta="Rata-rata penyelesaian 14,2 menit"
            footer={<p className="tabular-nums">57 kasus, seluruhnya sudah ditindaklanjuti</p>}
          >
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={RISK_FACTORS_DATA}
                  margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis
                    dataKey="factor"
                    type="category"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={108}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        unit=" persen"
                        renderExtra={(row) => (
                          <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-500">
                            {row.payload.cases} kasus. Tindak lanjut: {row.payload.action}
                          </p>
                        )}
                      />
                    }
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="pct" name="Proporsi kasus" radius={[3, 3, 0, 0]} barSize={11}>
                    {RISK_FACTORS_DATA.map((d) => (
                      <Cell key={d.factor} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {(activeTab === 'all' || activeTab === 'sla') && (
          <ChartCard
            title="Kepatuhan SLA Mitra SPPG"
            note="Lima dimensi syarat pencairan BAST"
            meta="Indeks gabungan 99,3 persen"
            footer={<p className="tabular-nums">Nilai terendah: kepuasan sekolah 98,6</p>}
          >
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={SLA_RADAR_DATA} outerRadius="72%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#475569' }} />
                  <PolarRadiusAxis
                    domain={[80, 100]}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                  />
                  <Radar
                    name="Skor kepatuhan"
                    dataKey="score"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    fill="#1d4ed8"
                    fillOpacity={0.14}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Seluruh angka pada panel ini adalah data simulasi prototipe, belum disambung ke API produksi.
      </p>
    </section>
  )
}
