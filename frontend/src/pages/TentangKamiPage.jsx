import { useState } from 'react'
import { ArrowIcon, CheckIcon } from '../components/ui/Icons'

export function TentangKamiPage() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    role: 'Pengelola SPPG',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.includes('@') || !formData.message.trim()) {
      setError('Harap lengkapi nama, email valid, dan pesan Anda.')
      return
    }
    setError('')
    setSubmitted(true)
  }

  return (
    <div className="bg-white text-gray-900">
      <section className="border-b border-gray-100 bg-white px-6 pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Tentang KawanGizi &amp; Program MBG
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl md:text-6xl leading-[1.1]">
            Data yang{' '}
            <em className="font-serif italic font-normal text-gray-600">Jujur</em> Tentang
            <br className="hidden sm:block" /> Setiap Porsi MBG.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
            KawanGizi adalah jembatan transparansi antara dapur pengolah SPPG, guru sekolah, dan orang tua murid.
            Setiap boks makan dilengkapi stiker QR unik yang menyimpan rincian nutrisi aktual dan hitung mundur keamanan konsumsi.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { val: 'TKPI 2020', label: 'Acuannya Jelas', desc: 'Semua nilai gizi mengacu pada Tabel Komposisi Pangan resmi pemerintah.' },
              { val: '≤ 4 Jam', label: 'Batas Konsumsi Terkunci', desc: 'Waktu aman pangan tidak dapat disunting setelah label tercetak.' },
              { val: '0 Unduhan', label: 'Akses Segera', desc: 'Cukup kamera HP bawaan. Tidak ada keharusan instal aplikasi.' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-2xl font-black tracking-tight text-gray-900">{s.val}</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{s.label}</p>
                <p className="mt-1 text-xs leading-normal text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Mengapa Dibangun</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Masalah Nyata di Balik Program Skala Besar.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Program Makan Bergizi Gratis (MBG) menyentuh ratusan ribu porsi harian. Volume sebesar itu membutuhkan
              kejernihan data yang sama besar agar kepercayaan penerima manfaat terjaga.
            </p>
          </div>

          <div className="space-y-4 lg:col-span-7">
            {[
              {
                n: '01',
                t: 'Waktu Masak vs Waktu Saji',
                d: 'Dapur SPPG memasak 04.30 WIB lalu mengirim ke sekolah. Saat tiba 10.30–11.30 WIB, penerima tidak lagi memiliki jejak berapa lama makanan telah berada di suhu ruang. KawanGizi mencatat jam penutupan wadah detik demi detik sebagai satu-satunya kebenaran.',
              },
              {
                n: '02',
                t: 'Gramatur Berubah, Gizi Berbeda',
                d: 'Substitusi bahan harian (ayam ↔ ikan lokal, buncis ↔ daun kelor) membuat nutrisi aktual menyimpang dari rencana. Tanpa penimbang digital yang terhubung, angka gizi di poster menu hanya menjadi perkiraan yang meleset.',
              },
              {
                n: '03',
                t: 'Orang Tua Perlu Hak untuk Tahu',
                d: 'Alergen telur, udang, atau kedelai bisa fatal bagi anak dengan alergi. Wali murid berhak memindai langsung apa yang dimakan anaknya di kelas tanpa harus menunggu laporan berkala atau meminta penjelasan guru.',
              },
            ].map((c) => (
              <div key={c.n} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-[11px] font-bold text-white">
                    {c.n}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{c.t}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Prinsip Rekayasa</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Dibuat agar Andalan di Lapangan, Bukan Sekadar Demo.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
            Setiap keputusan teknis diambil dengan satu pertanyaan: apakah perangkat ini masih berguna saat juru masak bercelemek bekerja di dapur basah?
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              { title: 'Kalkulasi Deterministik TKPI', copy: 'Tabel Komposisi Pangan Indonesia (Kemenkes RI) menjadi satu-satunya rujukan nilai gizi. Petugas menimbang mentah, sistem menulis energi dan makronutrisi per porsi secara eksak tanpa rekaan.' },
              { title: 'Penguncian Waktu Masak (HACCP)', copy: 'Prinsip keamanan makanan basah siap santap membatasi konsumsi ≤ 4 jam sejak wadah tertutup. Lewat dari itu, laman QR menyatakan peringatan tegas — tidak dapat di-override oleh dapur.' },
              { title: 'Web Ringan 100% Tanpa Unduhan', copy: 'Halaman QR dimuat di browser bawaan dalam hitungan detik. Uji coba kami di jaringan 3G perkotaan membuktikan akses stabil bahkan tanpa ruang penyimpanan kosong di ponsel siswa.' },
              { title: 'Nomor Batch yang Dapat Diaudit', copy: 'Stiker QR memuat ID batch, dapur asal, juru masak penanggung jawab, dan waktu cetak. Temuan anomali di lapangan bisa dirunut balik ke shift masak dalam hitungan menit.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Perbandingan</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Menggantikan Pencatatan Kertas yang Tidak Terhubung
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Buku laporan harian memecah tanggung jawab. Token porsi menyatukannya — dari piring siswa hingga meja pengawas.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-700">
              <tr>
                <th className="px-5 py-3">Aspek</th>
                <th className="px-5 py-3 text-gray-500">Cara Konvensional</th>
                <th className="bg-emerald-50 px-5 py-3 text-emerald-900">KawanGizi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Perhitungan Gizi', 'Estimasi kasar pada proposal', 'Dihitung otomatis per gramatur TKPI pada setiap batch'],
                ['Informasi Jam Masak', 'Jarang tertera di wadah', 'Tercatat saat segel wadah, hitung mundur 4 jam tampil di QR'],
                ['Alergen & Bahan', 'Tidak dicantumkan di kemasan', 'Daftar alergen dan komposisi tampil saat dipindai'],
                ['Akses Orang Tua', 'Menunggu laporan berkala', 'Terbuka untuk siapa pun yang memindai boks anaknya'],
                ['Audit Jika Ada Keluhan', 'Sulit lacak shift & batch', 'Token menaut ke batch, juru masak, dan waktu kirim'],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-gray-900">{a}</td>
                  <td className="px-5 py-3 text-gray-600">{b}</td>
                  <td className="bg-emerald-50/40 px-5 py-3 font-medium text-gray-900">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Etika Kami</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                Batas yang Tidak Kami Tawar.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Platform pangan publik menuntut kehati-hatian berlipat. Tiga ketentuan di bawah ini tidak diperdebatkan saat sistem dirancang.
              </p>
            </div>

            <div className="space-y-4 lg:col-span-7">
              {[
                { t: 'Keselamatan Anak di Atas Citra Laporan', d: 'Sistem tidak mempercantik data agar dashboard terlihat hijau. Jika wadah telah melewati batas aman, status berubah menjadi peringatan yang tidak dapat diabaikan oleh dapur pengirim.' },
                { t: 'Harus Masuk Akal untuk Petugas Jam 04.30', d: 'Generator stiker bekerja dalam dua-tiga ketukan, tanpa birokrasi berlebih. Juru masak tidak dipaksa memahami istilah teknis — hanya menimbang dan mencetak.' },
                { t: 'Keterbukaan Tanpa Sekat Akses', d: 'Pemindaian tetap gratis selayaknya makanan yang didistribusikan. Tidak ada paywall, tidak ada registrasi wajib bagi siswa untuk mengetahui apa yang mereka makan.' },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">✓</span>
                    <h3 className="text-sm font-bold text-gray-900">{c.t}</h3>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-600">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="kontak" className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div className="grid lg:grid-cols-12">
            <div className="flex flex-col justify-between bg-gray-900 p-8 text-white md:p-10 lg:col-span-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Kolaborasi</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Hubungi KawanGizi</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  Membuka integrasi untuk pengelola SPPG, pengelola sekolah, dan dinas terkait yang ingin menerapkan
                  verifikasi QR yang sama pada program pangan mereka.
                </p>

                <div className="mt-8 space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-white">Surel Kemitraan</p>
                    <p className="text-sm text-gray-400">kemitraan@kawangizi.id</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Lokasi Uji Coba</p>
                    <p className="text-sm text-gray-400">Jakarta Selatan &amp; Bandung, Indonesia</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Jam Operasional</p>
                    <p className="text-sm text-gray-400">Senin–Jumat, 08.00–17.00 WIB</p>
                  </div>
                </div>
              </div>

              <p className="mt-10 border-t border-gray-800 pt-4 text-xs text-gray-500">
                Platform pemantauan kualitas dan transparansi gizi untuk sekolah Indonesia.
              </p>
            </div>

            <div className="p-8 md:p-10 lg:col-span-7">
              {submitted ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white">
                    <CheckIcon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-xl font-bold text-gray-900">Pesan Terkirim</h4>
                  <p className="mt-2 max-w-md text-sm text-gray-600">
                    Terima kasih. Pesan dari <strong>{formData.name}</strong> ({formData.email}) tercatat. Tim
                    operasional membalas dalam 1–2 hari kerja.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', organization: '', email: '', role: 'Pengelola SPPG', message: '' })
                    }}
                    className="mt-6 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-black"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h4 className="text-lg font-bold text-gray-900">Kirim Pesan</h4>
                  <p className="mt-1 text-xs text-gray-500">Isi formulir untuk menjadwalkan diskusi integrasi wilayah.</p>

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-gray-700">
                          Nama Lengkap *
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Budi Setiawan"
                          className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="organization" className="block text-xs font-semibold text-gray-700">
                          Instansi / SPPG
                        </label>
                        <input
                          id="organization"
                          type="text"
                          value={formData.organization}
                          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          placeholder="SPPG Menteng 01"
                          className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-gray-700">
                          Email *
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="budi@instansi.id"
                          className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-xs font-semibold text-gray-700">
                          Peran
                        </label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                        >
                          <option value="Pengelola SPPG">Pengelola SPPG</option>
                          <option value="Pihak Sekolah / Guru">Pihak Sekolah / Guru</option>
                          <option value="Komite / Orang Tua">Komite / Orang Tua</option>
                          <option value="Dinas Terkait">Dinas Terkait</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-xs font-semibold text-gray-700">
                        Pesan *
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Contoh: Kami mengelola 1.200 porsi per hari di Jakarta Timur, ingin memahami integrasi QR KawanGizi..."
                        className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-black sm:w-auto"
                    >
                      Kirim Formulir <ArrowIcon />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
