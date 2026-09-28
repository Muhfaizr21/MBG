export function OverviewSection() {
  return (
    <section id="overview" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight text-gray-900">
              Dirancang untuk Menjaga Kualitas{' '}
              <em className="font-serif italic font-normal text-gray-700">Makanan Bergizi</em>
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="text-base sm:text-lg leading-relaxed text-gray-500">
              KawanGizi hadir sebagai platform cerdas untuk memastikan setiap siswa mendapatkan asupan makanan bergizi berkualitas tinggi dengan transparansi nutrisi harian, pelacakan bahan baku, dan pengawasan mutu berbasis kecerdasan buatan.
            </p>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="mt-16 grid gap-10 border-t border-gray-100 pt-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-sm italic text-gray-400">01 / Validasi Cepat</p>
            <h3 className="mt-2 text-lg font-bold text-gray-900">Scan QR Code Unik</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Pindai label QR unik per porsi kemasan makanan untuk memverifikasi keaslian porsi, dapur SPPG, dan waktu selesai produksi.
            </p>
          </div>
          <div>
            <p className="font-serif text-sm italic text-gray-400">02 / Presisi Nutrisi</p>
            <h3 className="mt-2 text-lg font-bold text-gray-900">Nutrition Engine</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Kalkulasi deterministik otomatis untuk kalori, makronutrisi (protein, karbohidrat, lemak), serta serat dari takaran bahan baku resep.
            </p>
          </div>
          <div>
            <p className="font-serif text-sm italic text-gray-400">03 / Keamanan Pangan</p>
            <h3 className="mt-2 text-lg font-bold text-gray-900">Freshness & AI Analysis</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Sensor suhu, kelembapan, dan waktu diproses oleh model AI untuk menghasilkan freshness score dan rekomendasi kelayakan konsumsi.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
