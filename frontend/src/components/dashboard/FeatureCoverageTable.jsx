/*
 * Ringkasan Cakupan Fitur, diturunkan langsung dari Panduan Superadmin KawanGizi.
 * Satu angka per menu, jadi koordinator bisa lihat di mana perhatian Fallout-nya
 * tanpa membuka sebelas halaman terpisah. Sumber: blueprint sidebar, bukan
 * tebakan, sehingga label di sini sama dengan label di navigasi.
 *
 * Keputusan yang ditulis turun (R-31):
 * - tabel, bukan kartu: sebelas domain dengan metrik sebanding dibaca lebih cepat
 *   sebagai baris_ALIGNED daripada sebelas kotak yang harus dipindai satu per satu
 * - baris berstatus merah diberi tanda titik, bukan warna saja: warna sendirian
 *   tidak bisa dibaca pengguna buta warna (R-25)
 * - panjang baris proporsional terhadap nilai, bukan angka dekoratif
 * - urutan kerja domain diringkas jadi satu kalimat di kaki tabel, bukan
 *   digambar ulang: bacaan prosa lebih cepat daripada diagram tambahan
 */

const FEATURE_COVERAGE = [
  {
    menu: 'Dashboard',
    href: '/admin/dashboard',
    fungsi: 'Menara Pengawas Utama',
    fokus: 'KPI eksekutif, status distribusi nasional, telemetri langsung',
    metrik: 542850,
    metrikLabel: 'porsi tervalidasi',
    satuan: '550.000',
    status: 'normal',
  },
  {
    menu: 'Profil Validator',
    href: '/admin/validators',
    fungsi: 'Kredensial dan integritas petugas',
    fokus: 'Sertifikasi, jam kerja pindai, deteksi pindai terlalu cepat',
    metrik: 1284,
    metrikLabel: 'validator terverifikasi',
    satuan: '1.310',
    status: 'normal',
  },
  {
    menu: 'Dapur SPPG',
    href: '/admin/sppg',
    fungsi: 'Akreditasi produsen',
    fokus: 'Kapasitas produksi, skor sanitasi,audit SLHS dan HACCP',
    metrik: 128,
    metrikLabel: 'dapur aktif',
    satuan: '140',
    status: 'perhatian',
  },
  {
    menu: 'Hasil Pengiriman',
    href: '/admin/deliveries',
    fungsi: 'Audit hasil pindai YOLOv8',
    fokus: 'Bounding box anomali, telemetri suhu, anti-scan ganda',
    metrik: 542850,
    metrikLabel: 'porsi lolos validasi',
    satuan: '550.000',
    status: 'normal',
  },
  {
    menu: 'Penerimaan Siswa',
    href: '/admin/attendance',
    fungsi: 'Rekonsiliasi porsi dan presensi',
    fokus: 'Mitigasi food waste, pengalihan porsi berlimpah',
    metrik: 38620,
    metrikLabel: 'porsi tak terpakai',
    satuan: '550.000',
    status: 'perhatian',
  },
  {
    menu: 'Sekolah Binaan',
    href: '/admin/schools',
    fungsi: 'Data master penerima',
    fokus: 'NPSN, koordinat, radius amanjourney dapur',
    metrik: 1248,
    metrikLabel: 'titik sekolah',
    satuan: '1.300',
    status: 'normal',
  },
  {
    menu: 'Jadwal Distribusi',
    href: '/admin/schedule',
    fungsi: 'Manajemen jendela kirim',
    fokus: 'ETA armada, peringatan macet, rute alternatif',
    metrik: 99.4,
    metrikLabel: 'persen tiba tepat waktu',
    satuan: '100',
    status: 'normal',
    suffix: '%',
  },
  {
    menu: 'Papan Pengumuman',
    href: '/admin/notices',
    fungsi: 'Satu sumber arahan nasional',
    fokus: 'Siaran resmi, peringatan musim, darurat wajib konfirmasi',
    metrik: 12,
    metrikLabel: 'siaran aktif',
    satuan: '20',
    status: 'normal',
  },
  {
    menu: 'Kalender MBG',
    href: '/admin/calendar',
    fungsi: 'Siklus menu dan kalender sekolah',
    fokus: 'Penguncian menu bulanan, pengganti bahan, hari libur',
    metrik: 10,
    metrikLabel: 'hari siklus menu',
    satuan: '20',
    status: 'normal',
  },
  {
    menu: 'Unduh Laporan',
    href: '/admin/reports',
    fungsi: 'Pertanggungjawbeyanan anggaran',
    fokus: 'Ekspor CSV, XLSX, PDF, penerbitan BAST digital',
    metrik: 100,
    metrikLabel: 'persen BAST terverifikasi',
    satuan: '100',
    status: 'normal',
    suffix: '%',
  },
  {
    menu: 'Aduan dan Feedback',
    href: '/admin/feedback',
    fungsi: 'Triage insiden danotonekill-switch',
    fokus: 'Level 1 sampai 3, SLA dua jam, pembekuan batch',
    metrik: 3,
    metrikLabel: 'tiket Level 1 terbuka',
    satuan: '0',
    status: 'darurat',
  },
]

const STATUS_META = {
  normal: { label: 'Normal', bar: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  perhatian: { label: 'Perlu perhatian', bar: 'bg-amber-500', text: 'text-amber-800', ring: 'ring-amber-200' },
  darurat: { label: 'Insiden terbuka', bar: 'bg-rose-600', text: 'text-rose-700', ring: 'ring-rose-200' },
}

const fmt = (n) => Number(n).toLocaleString('id-ID')

export function FeatureCoverageTable({ onNavigate }) {
  const kritis = FEATURE_COVERAGE.filter((f) => f.status !== 'normal').length

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Cakupan Fitur Pengawasan</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Sebelas domain dari perencanaan sampai pertanggungjawaban anggaran, dengan posisi
            tiap domain terhadap kapasitas hari ini.
          </p>
        </div>
        <p className="shrink-0 text-[11px] text-slate-500">
          {kritis} domain butuh perhatian, sisanya pada status normal.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <caption className="sr-only">
            Ringkasan sebelas domain pengawasan KawanGizi beserta fungsi, fokus, dan posisi
            terukur terhadap kapasitas
          </caption>
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Domain
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Fungsi dan fokus
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                Realisasi
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Posisi terhadap kapasitas
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {FEATURE_COVERAGE.map((row) => {
              const meta = STATUS_META[row.status]
              const load = Math.min(100, Math.round((row.metrik / row.satuan) * 100))
              return (
                <tr key={row.menu} className="transition-colors hover:bg-slate-50/70">
                  <th scope="row" className="px-5 py-3 text-left align-top font-semibold">
                    <button
                      onClick={() => onNavigate?.(row.href)}
                      className="rounded text-slate-900 hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      {row.menu}
                    </button>
                    <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                      {row.fungsi}
                    </span>
                  </th>
                  <td className="px-3 py-3 align-top text-[11px] leading-relaxed text-slate-600">
                    {row.fokus}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <span className="tabular-nums font-semibold text-slate-900">
                      {fmt(row.metrik)}
                      {row.suffix ?? ''}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{row.metrikLabel}</span>
                  </td>
                  <td className="w-48 px-3 py-3 align-top">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                      role="meter"
                      aria-valuenow={load}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.menu}: ${load} persen dari ${fmt(row.satuan)}`}
                    >
                      <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${load}%` }} />
                    </div>
                    <span className="tabular-nums mt-1 block text-[10px] text-slate-500">
                      {load} persen dari {fmt(row.satuan)}
                      {row.suffix ?? ''}
                    </span>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.text} ${meta.ring}`}
                    >
                      {row.status === 'darurat' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" aria-hidden="true" />
                      )}
                      {meta.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
        Rantai pengawasan: perencanaan (sekolah, dapur, kalender, jadwal), eksekusi lapangan
        (validator, penerimaan siswa, pengumuman), pengawasan cerdas (dashboard, pengiriman, aduan),
        akuntabilitas negara (laporan dan BAST). Data simulasi prototipe, belum disambung ke API.
      </footer>
    </section>
  )
}
