import { FLOW_STEPS } from '../../data/mbgData'
import overviewImg from '../../assets/overview.png'

export function FlowSection() {
  return (
    <section id="flow" aria-label="Alur Kerja" className="border-t border-gray-100 bg-gray-50/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-serif text-sm italic text-gray-500">Satu Alur Berkelanjutan</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              Dari Dapur Masak Hingga <em className="font-serif italic font-normal text-gray-700">Meja Siswa</em>
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-500">
              Setiap porsi makanan memiliki identitas digital unik. Data nutrisi dan parameter kesegaran dicatat secara berurutan dan tidak dapat dimanipulasi.
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
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-sm">
            <img
              src={overviewImg}
              alt="Petugas SPPG bekerja di dapur sementara siswa memindai QR Code dengan ponsel"
              className="w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
