import scanImg from '../assets/scan.png'
import overviewImg from '../assets/overview.png'
import { useState } from 'react'
import { SAMPLE_MENUS, ROLES_DATA, SAFETY_STEPS, FLOW_STEPS, STATS, FAQS, REGIONAL_DEMOGRAPHICS } from '../data/mbgData'
import { ArrowIcon } from '../components/ui/Icons'

const CORE_PILLARS = [
  {
    num: '01',
    code: 'DETERMINISTIC ENGINE',
    title: 'Kalkulasi Gizi Deterministik Tanpa Halusinasi',
    lead: 'AI tidak menghitung gramatur atau kalori. Perhitungan nutrisi dijalankan oleh mesin formula murni berbasis laboratorium resmi.',
    body: 'Setiap resep dihitung dari Tabel Komposisi Pangan Indonesia (TKPI) Kemenkes RI. Ketika petugas dapur SPPG menimbang 120g dada ayam fillet, sistem langsung memetakan 35.8g protein, 3.2g lemak, dan 198 kkal secara deterministik dengan presisi dua desimal.',
    specs: [
      { label: 'Basis Rujukan', val: 'TKPI Kemenkes RI 2020' },
      { label: 'Toleransi Hitung', val: '0.00% deviasi formula' },
      { label: 'Metrik Terpantau', val: 'Kalori, Protein, Karbohidrat, Lemak, Serat, Besi, Kalsium' },
      { label: 'Validasi Input', val: 'Integrasi timbangan digital via SPPG gateway' }
    ]
  },
  {
    num: '02',
    code: 'IoT COLD-CHAIN & TIME',
    title: 'Siklus Audit Waktu & Sensor Termal Terpadu',
    lead: 'Batas aman konsumsi makanan bergizi adalah fungsi waktu dan suhu. KawanGizi mengunci jendela konsumsi maksimal 4 jam pasca-masak.',
    body: 'Begitu wajan selesai dan makanan diporsi, sensor termal pada wadah isolasi mencatat suhu awal penyajian (rata-rata 65°C saat dikemas, turun stabil di 23-25°C selama pengiriman). Token QR porsi merekam timestamp masak detik demi detik.',
    specs: [
      { label: 'Jendela Konsumsi', val: 'Maksimal 4 jam sejak matang' },
      { label: 'Threshold Suhu', val: 'Rentang aman 20°C - 25°C (ruang sejuk)' },
      { label: 'Status Peringatan', val: 'Kuning (3 jam) • Merah / Ditolak (> 4 jam)' },
      { label: 'Logistik Terpantau', val: 'Trans-Jawa, Bodetabek, dan koridor kepulauan' }
    ]
  },
  {
    num: '03',
    code: 'NEURAL FRESHNESS GUARD',
    title: 'Model Prediktif Kesegaran & Penjelasan Bahasa Alami',
    lead: 'Machine learning mengevaluasi multivariat risiko mikrobiologis dan menyajikan rekomendasinya dalam bahasa yang dimengerti orang tua murid.',
    body: 'Model menggabungkan data bahan mudah rusak (santan, telur, ikan basah), suhu sekitar pengantaran, kelembapan relatif, dan delta waktu. LLM hanya bertugas sebagai presentation layer untuk menerjemahkan matriks risiko menjadi panduan santap yang jernih.',
    specs: [
      { label: 'Variabel Analisis', val: 'Profil bahan + Suhu logistik + Waktu tempuh' },
      { label: 'Format Penjelasan', val: 'Rangkuman bahasa manusia non-teknis' },
      { label: 'Transparansi Model', val: 'Peringatan alergen otomatis & saran konsumsi' },
      { label: 'Fail-Safe', val: 'Rekomendasi tolak porsi otomatis jika skor < 70%' }
    ]
  },
  {
    num: '04',
    code: 'CRYPTOGRAPHIC TOKEN',
    title: 'Satu Kemasan, Satu Token Kriptografis Unik',
    lead: 'Mencegah duplikasi data, klaim ganda, dan distribusi fiktif melalui token serial yang diverifikasi seketika di edge.',
    body: 'Setiap stiker QR memuat signature unik berbasis batch, ID dapur SPPG, nomor wadah, dan kode sekolah penerima. Siswa atau orang tua cukup memindai dengan kamera bawaan tanpa instal aplikasi rumit untuk memverifikasi keaslian porsi.',
    specs: [
      { label: 'Struktur Token', val: 'MBG-TAHUN-KOTA-KODE (hash unik)' },
      { label: 'Akses Pengguna', val: 'Zero-install (kamera bawaan HP)' },
      { label: 'Audit Trail', val: 'Timestamp scan pertama kali tercatat di ledger' },
      { label: 'Anti-Pemalsuan', val: 'Token langsung berstatus Terpakai setelah porsi disajikan' }
    ]
  }
]

const COMPARISON_MATRIX = [
  {
    capability: 'Kalkulasi Nilai Gizi Harian',
    traditional: 'Estimasi manual di buku resep, rentan salah hitung gramatur',
    mbg: 'Deterministik otomatis dari Tabel Komposisi Pangan resmi Kemenkes',
    impact: '100% akuntabilitas asupan AKG siswa'
  },
  {
    capability: 'Pengawasan Keamanan & Basi',
    traditional: 'Hanya penciuman manual saat makanan tiba di sekolah',
    mbg: 'Sensor suhu cold-chain + batas konsumsi 4 jam terkunci di QR',
    impact: 'Deteksi risiko sebelum makanan sampai ke piring anak'
  },
  {
    capability: 'Transparansi untuk Orang Tua',
    traditional: 'Tidak ada akses informasi; orang tua tidak tahu komposisi gizi',
    mbg: 'Scan kamera instan menampilkan rincian kalori, protein & alergen',
    impact: 'Kepercayaan publik dan ketenangan keluarga penerima'
  },
  {
    capability: 'Pelacakan Dapur & Bahan Baku',
    traditional: 'Laporan kertas bulanan bertingkat yang lambat diverifikasi',
    mbg: 'Token per porsi terhubung langsung ke ID dapur SPPG dan nomor wadah',
    impact: 'Audit investigasi anomali rampung dalam hitungan detik'
  },
  {
    capability: 'Peringatan Dini Keracunan / Alergen',
    traditional: 'Reaktif setelah ada gejala klinis di lapangan',
    mbg: 'Peringatan alergen eksplisit dan fail-safe tolak porsi otomatis',
    impact: 'Pencegahan proaktif skala kabupaten/kota'
  }
]

const INTEGRATION_STANDARDS = [
  { name: 'Kemenkes RI TKPI', desc: 'Standar baku komposisi nutrisi pangan 2020', badge: 'Standar Gizi' },
  { name: 'HACCP & GMP', desc: 'Prosedur higienitas pengolahan dapur SPPG', badge: 'Keamanan Mutu' },
  { name: 'ISO/IEC 27001', desc: 'Prinsip tata kelola integritas data & audit trail', badge: 'Keamanan Data' },
  { name: 'Dapodik Kemendikbud', desc: 'Sinkronisasi data sekolah dan jenjang pendidikan', badge: 'Interoperabilitas' }
]

export function FiturPage() {
  const [activeMenuId, setActiveMenuId] = useState('menu-1')
  const [activeRoleId, setActiveRoleId] = useState('sppg')
  const [openFaq, setOpenFaq] = useState(null)

  const activeMenu = SAMPLE_MENUS.find((m) => m.id === activeMenuId) || SAMPLE_MENUS[0]
  const activeRole = ROLES_DATA.find((r) => r.id === activeRoleId) || ROLES_DATA[0]

  return (
    <div className="bg-white">
      {/* 1. Hero Overview Enterprise Header */}
      <section className="border-b border-gray-100 bg-gray-50/40 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-semibold text-gray-700">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            Spesifikasi Arsitektur Platform KawanGizi
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.08]">
            Infrastruktur Data Nutrisi, Ketertelusuran, dan{' '}
            <em className="font-serif italic font-normal text-gray-600">Keamanan Pangan</em>
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600">
            Sistem terintegrasi yang menghubungkan dapur produksi SPPG, armada logistik, pihak sekolah, dan dinas pengawas gizi melalui satu standar QR Code tervalidasi.
          </p>

          {/* KPI Ribbon */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-200/80 pt-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{s.value}</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-800">{s.label}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Deep-Dive: 4 Pilar Utama Rekayasa Sistem */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="font-serif text-sm italic text-gray-500">Prinsip Rekayasa Perangkat Lunak</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
              Empat Pilar Penjaga <em className="font-serif italic font-normal text-gray-600">Mutu Porsi</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-600">
              Setiap komponen dirancang dengan batasan tanggung jawab yang ketat. Perhitungan matematis berdiri sendiri, sensor fisik menjaga waktu, dan model AI menyederhanakan komunikasi.
            </p>
          </div>

          <div className="mt-14 space-y-12">
            {CORE_PILLARS.map((p) => (
              <div
                key={p.num}
                className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-10 "
              >
                <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                        {p.code}
                      </span>
                      <span className="font-mono text-xs font-semibold text-gray-400">Modul #{p.num}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                      {p.title}
                    </h3>
                    <p className="text-sm sm:text-base font-medium leading-relaxed text-gray-700">
                      {p.lead}
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                      {p.body}
                    </p>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl border border-gray-200/90 bg-gray-50/70 p-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Spesifikasi &amp; Batasan Teknis</p>
                    <div className="space-y-2.5 pt-1">
                      {p.specs.map((spec) => (
                        <div key={spec.label} className="flex flex-col border-b border-gray-200/50 pb-2 text-xs last:border-none last:pb-0">
                          <span className="font-medium text-gray-500">{spec.label}</span>
                          <span className="mt-0.5 font-semibold text-gray-900">{spec.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Interactive Component Showcase: Simulasi Hasil Pembacaan QR */}
      <section className="border-t border-gray-100 bg-gray-50/40 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="font-serif text-sm italic text-gray-500">Antarmuka Pemindaian Nyata</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
              Transparansi Porsi di <em className="font-serif italic font-normal text-gray-600">Genggaman Pengguna</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Pilih salah satu menu standar KawanGizi untuk melihat manifest data yang diterima siswa saat memindai label wadah makanan.
            </p>
          </div>

          {/* Menu Selector Buttons */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {SAMPLE_MENUS.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveMenuId(menu.id)}
                className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  activeMenuId === menu.id
                    ? 'bg-gray-900 text-white '
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {menu.name.split('&')[0]}
              </button>
            ))}
          </div>

          {/* Interactive Card */}
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60">
                    {activeMenu.badge}
                  </span>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    {activeMenu.name}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {activeMenu.sppg} &bull; Jam Masak: {activeMenu.cookTime} &bull; {activeMenu.portion}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Kalori Total', val: `${activeMenu.calories} kkal`, note: 'Standar AKG Anak' },
                    { label: 'Protein Murni', val: `${activeMenu.protein} g`, note: 'Pemulihan Jaringan' },
                    { label: 'Karbohidrat', val: `${activeMenu.carbs} g`, note: 'Energi Belajar' },
                    { label: 'Serat Pangan', val: `${activeMenu.fiber} g`, note: 'Kesehatan Cerna' },
                  ].map((nutri) => (
                    <div key={nutri.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{nutri.label}</p>
                      <p className="mt-1 text-2xl font-black text-gray-900">{nutri.val}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-emerald-700">{nutri.note}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-950">
                  <span className="font-bold text-amber-800">Peringatan Alergen Resmi: </span>
                  {activeMenu.allergen}
                </div>
              </div>

              {/* Right Details */}
              <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-gray-50/80 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Skor Kesegaran Terukur</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-emerald-600">{activeMenu.freshness}%</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{activeMenu.status}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-gray-500">Sensor Termal</p>
                    <p className="font-bold text-gray-900 mt-0.5">{activeMenu.temp}</p>
                    <p className="text-gray-600 font-medium">{activeMenu.shelfLife}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-900 text-white font-mono text-[10px]">AI</span>
                    Analisis Kondisi &amp; Saran Konsumsi
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-gray-700">
                    {activeMenu.aiNotes}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white font-mono text-[10px] font-bold">QR</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Token Registri KawanGizi</p>
                      <p className="font-mono text-xs font-bold text-gray-900">{activeMenu.token}</p>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Comparative Matrix: Tradisional vs Platform MBG */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="font-serif text-sm italic text-gray-500">Tolok Ukur Transformasi</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
              Metode Tradisional vs <em className="font-serif italic font-normal text-gray-600">Platform KawanGizi</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Mengapa pencatatan manual di buku logistik tidak lagi memadai untuk program pangan berskala ratusan ribu siswa harian.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-gray-200 bg-white ">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700">
                  <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-[11px] text-gray-500">Aspek Operasional</th>
                  <th className="p-4 sm:p-5 font-semibold text-gray-600">Model Pengawasan Konvensional</th>
                  <th className="p-4 sm:p-5 font-bold text-emerald-800 bg-emerald-50/50">Standar Platform KawanGizi</th>
                  <th className="p-4 sm:p-5 font-semibold text-gray-700">Dampak Nyata Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON_MATRIX.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-900 whitespace-nowrap">{row.capability}</td>
                    <td className="p-4 sm:p-5 text-gray-500 leading-relaxed">{row.traditional}</td>
                    <td className="p-4 sm:p-5 font-medium text-gray-900 bg-emerald-50/20 leading-relaxed">{row.mbg}</td>
                    <td className="p-4 sm:p-5 font-semibold text-gray-700 leading-relaxed">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Role & Workflow Synchronization */}
      <section className="border-t border-gray-100 bg-gray-50/40 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-serif text-sm italic text-gray-500">Tiga Peran, Satu Keutuhan Data</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
              Sinkronisasi Peran <em className="font-serif italic font-normal text-gray-600">Aktor Lapangan</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              Setiap pemangku kepentingan memiliki konsol kerja yang disesuaikan dengan tanggung jawab operasional masing-masing.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 ">
              {ROLES_DATA.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRoleId(r.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all ${
                    activeRoleId === r.id
                      ? 'bg-gray-900 text-white '
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {r.role}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7 sm:p-12 shadow-sm">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7 space-y-4">
                <span className="inline-flex rounded-full bg-gray-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  {activeRole.tag}
                </span>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                  {activeRole.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                  {activeRole.desc}
                </p>
                <ul className="mt-5 space-y-2.5 pt-1">
                  {activeRole.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-800">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 mt-0.5">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ringkasan Nilai Operasional</p>
                <p className="text-base sm:text-lg font-medium leading-relaxed text-gray-900">
                  &ldquo;{activeRole.highlight}&rdquo;
                </p>
                <div className="border-t border-gray-200/80 pt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>Audit Kepatuhan KawanGizi</span>
                  <span className="font-bold text-emerald-700">Tervalidasi Digital</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Five Steps Flowchart Alignment */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-serif text-sm italic text-gray-500">Alur Kerja Sistem (sistem.md)</p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                Satu Siklus Tertutup: <em className="font-serif italic font-normal text-gray-600">Dapur ke Meja</em>
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-600">
                Data tidak dapat dimanipulasi di tengah jalan. Setiap porsi bergerak dari satu tahap ke tahap berikutnya dengan stempel waktu terverifikasi.
              </p>

              <div className="mt-8 space-y-4">
                {FLOW_STEPS.map((s) => (
                  <div key={s.no} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold font-mono text-white">
                      {s.no}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{s.title}</h4>
                      <p className="mt-0.5 text-xs sm:text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 ">
                <img
                  src={overviewImg}
                  alt="Petugas SPPG mengolah menu dan mencetak label QR"
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 ">
                <img
                  src={scanImg}
                  alt="Siswa memindai QR Code porsi dengan kamera smartphone"
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Standar & Kepatuhan Regulasi */}
      <section className="border-t border-gray-100 bg-gray-50/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center font-serif text-xs uppercase tracking-widest text-gray-400">Kerangka Kepatuhan &amp; Interoperabilitas</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATION_STANDARDS.map((std) => (
              <div key={std.name} className="rounded-2xl border border-gray-200 bg-white p-5">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  {std.badge}
                </span>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{std.name}</h4>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{std.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Accordion Teknis */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="font-serif text-sm italic text-gray-500">Tanya Jawab Teknis</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900">
              Pertanyaan yang Kerap <em className="font-serif italic font-normal text-gray-600">Diajukan</em>
            </h2>
          </div>

          <div className="mt-10 divide-y divide-gray-200 rounded-3xl border border-gray-200 bg-white ">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left text-sm sm:text-base font-bold text-gray-900 focus-visible:outline-none"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className="shrink-0 text-gray-400 font-mono text-base">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-gray-600">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Bottom CTA - Enterprise Action */}
      <section className="border-t border-gray-100 bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bottom-face px-8 py-16 text-white sm:px-14 md:py-20 shadow-xl">
          <div className="max-w-2xl">
            <p className="font-serif text-base italic text-white/80 sm:text-lg">Standarisasi Nasional Dimulai dari Dapur Anda.</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Siap Menerapkan Platform KawanGizi di SPPG atau Sekolah Anda?
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/80">
              Uji coba langsung antarmuka pemindaian kamera siswa melalui simulator interaktif atau hubungi tim integrasi BGN untuk integrasi dapur wilayah.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/mulai"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-900 shadow-md transition-all hover:bg-gray-100"
              >
                Mulai Sekarang <ArrowIcon />
              </a>
              <a
                href="/tentang-kami"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/20"
              >
                Pelajari Tentang Kami
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
