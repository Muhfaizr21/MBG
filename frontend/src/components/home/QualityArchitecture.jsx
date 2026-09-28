import { SAFETY_STEPS } from '../../data/mbgData'

export function QualityArchitecture() {
  return (
    <section aria-label="Arsitektur Keamanan" className="border-t border-gray-100 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="font-serif text-sm italic text-gray-500">Arsitektur Mutu KawanGizi</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-gray-900 leading-[1.1]">
              Perpaduan Sains Pangan Deterministik &{' '}
              <em className="font-serif italic font-normal text-gray-700">Kecerdasan Buatan</em>
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="text-sm sm:text-base leading-relaxed text-gray-500">
              AI tidak dibiarkan berspekulasi sendirian. Nilai gizi dihitung secara eksak matematis, sementara sensor IoT dan algoritma AI mengawal kesegaran suhu dan batas waktu aman.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SAFETY_STEPS.map((step) => (
            <div key={step.no} className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">{step.no}</span>
                <h4 className="mt-3 text-base font-bold text-gray-900">{step.title}</h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
              <div className="mt-6 border-t border-gray-200/50 pt-3">
                <span className="text-[11px] font-semibold text-emerald-700">Standard Operasional &bull; Terverifikasi</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
