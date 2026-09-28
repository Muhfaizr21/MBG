import { MenuSimulator } from '../components/home/MenuSimulator'

export function ScanPage() {
  return (
    <div className="pt-6 pb-16">
      <div className="mx-auto max-w-5xl px-6 text-center pt-8 pb-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-950">
          Simulator Pemindai <em className="font-serif italic font-normal text-emerald-800">QR Porsi</em>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
          Uji langsung bagaimana kamera ponsel membaca identitas nutrisi, gramatur TKPI Kemenkes, dan batas waktu konsumsi 4 jam per boks makanan.
        </p>
      </div>
      <MenuSimulator />
    </div>
  )
}
