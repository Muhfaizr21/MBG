import { useState, useEffect } from 'react'
import heroImg from './assets/hero.png'
import scanImg from './assets/scan.png'
import overviewImg from './assets/overview.png'

const ACTORS = [
  {
    name: 'Admin',
    flow: 'Login → Kelola SPPG → Kelola Petugas → Monitoring Menu → Monitoring AI → Laporan',
    color: 'gray-900',
  },
  {
    name: 'Petugas SPPG',
    flow: 'Login → Dashboard → Input Produksi → Input Bahan → Analisis → QR → Distribusi',
    color: 'gray-900',
  },
  {
    name: 'User',
    flow: 'Buka aplikasi → Scan QR → Validasi → Lihat Menu → Lihat Bahan → Lihat Nutrisi & Kesegaran AI',
    color: 'gray-900',
  },
]

const FLOW_STEPS = [
  { no: '01', title: 'Input Produksi', desc: 'Petugas memasukkan menu, tanggal, waktu, jumlah porsi, dan data bahan.' },
  { no: '02', title: 'Nutrition Engine', desc: 'Sistem menghitung kalori, protein, karbohidrat, lemak, serat secara deterministik.' },
  { no: '03', title: 'Freshness & AI', desc: 'Analisis kesegaran berdasarkan suhu, kelembapan, waktu. AI memberikan penjelasan hasil.' },
  { no: '04', title: 'Generate QR Code', desc: 'Setiap porsi mendapat QR unik yang berisi seluruh informasi produksi.' },
  { no: '05', title: 'Scan & Validasi', desc: 'User memindai QR via kamera. Sistem validasi token, status, dan menampilkan informasi lengkap.' },
]

const FEATURES = [
  {
    no: '01',
    title: 'Scan QR Code',
    desc: 'Pindai QR pada kemasan makanan. Validasi token dan status QR secara instan.',
  },
  {
    no: '02',
    title: 'Nutrition Engine',
    desc: 'Hitung kalori, protein, karbohidrat, lemak, serat, dan nutrisi dari data bahan secara deterministik.',
  },
  {
    no: '03',
    title: 'Freshness & AI Analysis',
    desc: 'Analisis kesegaran berdasarkan waktu produksi, suhu, dan kelembapan. AI memberikan penjelasan ringkas hasil analisis.',
  },
]

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CtaButton({ href, children, solid = false }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
        solid
          ? 'bg-gray-900 text-white hover:bg-gray-700'
          : 'border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
      }`}
    >
      {children}
      <ArrowIcon />
    </a>
  )
}

/* ── Routing ───────────────────────────────────────────── */

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

const ROUTES = [
  { href: '#/', label: 'Home' },
  { href: '#/fitur', label: 'Fitur' },
  { href: '#/mulai', label: 'Mulai' },
]

function isActive(href, hash) {
  if (href === '#/') return hash === '' || hash === '#/' || hash === '#/home'
  return hash.startsWith(href)
}

/* ── Pages ─────────────────────────────────────────────── */

function HomePage() {
  return (
    <>
      <section id="home" className="scroll-mt-24 pt-16 text-center md:pt-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-serif text-xl italic text-gray-900 md:text-2xl">Makan Bergizi Gratis.</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-5xl font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
            Scan QR.
            <br />
            Ketahui Kesegaran.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500">
            Sistem MBG menghubungkan Admin, SPPG, dan User untuk memproduksi makanan, menghitung nutrisi, analisis kesegaran berbasis AI, lalu menghasilkan QR Code unik per porsi. Users memindai QR untuk melihat menu, bahan, nutrisi, waktu produksi, dan hasil analisis AI.
          </p>
          <div className="mt-8">
            <CtaButton href="#/scan">Scan QR Sekarang</CtaButton>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="relative opacity-50 grayscale transition-opacity hover:opacity-70">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play — Segera"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
              <span className="absolute -right-2 -top-2 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Segera</span>
            </div>
            <div className="relative opacity-50 grayscale transition-opacity hover:opacity-70">
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store — Segera"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
              <span className="absolute -right-2 -top-2 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Segera</span>
            </div>
          </div>
        </div>

        {/* Full-width edge-to-edge gradient banner */}
        <div className="relative mt-12 w-full overflow-hidden">
          {/* Edge-to-edge gradient backdrop extending across the whole screen */}
          <div
            className="absolute inset-0 -z-10 w-full"
            style={{
              background: 'linear-gradient(90deg, #f43f5e 0%, #ec4899 22%, #c084fc 50%, #fb923c 78%, #facc15 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center">
            <img
              src={heroImg}
              alt="Tangan memegang iPhone menampilkan antarmuka scan QR dan nutrisi makanan MBG"
              className="w-full object-cover select-none md:max-h-[640px]"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
              }}
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section id="overview" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">
                Satu QR untuk <em className="font-serif italic font-medium">seluruh</em> alur.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Dari input produksi oleh Petugas SPPG hingga pemindaian oleh User — semua data mengalir melalui satu sistem terpadu. Setiap QR Code menyimpan menu, bahan, nutrisi, waktu produksi, dan penjelasan AI.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-900">
                  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">01</span>
                  <span>Setiap produksi mendapat QR unik yang diverifikasi token dan statusnya.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-900">
                  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">02</span>
                  <span>Nutrition Engine menghitung nutrisi secara deterministik dari data bahan.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-900">
                  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">03</span>
                  <span>Freshness Engine & AI memberikan score, risk level, dan penjelasan ringkas.</span>
                </li>
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-[2rem]">
              <img src={overviewImg} alt="Petugas SPPG bekerja di kantin sementara user memindai QR Code dengan ponsel" className="w-full object-cover shadow-xl" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section id="actors" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Tiga Aktor, Satu Sistem</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
          Setiap peran punya alur kerja sendiri, namun terhubung melalui QR Code dan data nutrisi yang sama.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {ACTORS.map((a) => (
            <div key={a.name} className="border-t border-gray-100 pt-6">
              <p className="font-serif text-sm italic text-gray-400">{a.name}</p>
              <h3 className="mt-2 text-base font-bold text-gray-900">{a.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{a.flow}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="flow" aria-label="Alur Kerja" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Alur Kerja</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
            Dari input bahan hingga user melihat hasil analisis — enam tahap terhubung dalam satu alur.
          </p>
          <div className="mt-10 space-y-6">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.no} className="flex gap-4 md:gap-6">
                <p className="flex shrink-0 items-center justify-center rounded-full border border-gray-200 px-3 py-1 font-serif text-sm italic text-gray-500 md:px-4">{s.no}</p>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Monitoring" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">Evaluasi &amp; Monitoring</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Admin dapat memantau performa menu, akurasi AI, dan tren kesegaran melalui dashboard. Setiap QR mendapat log timestamp dan status untuk analisis lanjutan.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Dashboard utama menampilkan ringkasan stok dan performa</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Log suhu/kelembapan untuk validasi kualitas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Laporan keamanan pangan berdasarkan hasil AI</span>
                </li>
              </ul>
            </div>
            <div className="rounded-[2rem] border-2 border-dashed border-gray-200 p-6 text-center text-gray-400">
              <p className="text-sm font-medium">Grafik performa nutrisi AI</p>
              <p className="mt-2 text-xs">Dashboard admin akan menampilkan visualisasi data nutrisi, freshness score, dan tren waktu</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Unduh Aplikasi" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 text-center md:py-24">
          <p className="font-serif text-xl italic text-gray-900 md:text-2xl">MBG di saku Anda.</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Unduh Aplikasi <em className="font-serif italic font-medium">MBG</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
            Scan QR, lihat nutrisi dan kesegaran makanan langsung dari ponsel. Gratis untuk Android dan iOS.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="relative opacity-50 grayscale transition-opacity hover:opacity-70">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play — Segera"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
              <span className="absolute -right-2 -top-2 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Segera</span>
            </div>
            <div className="relative opacity-50 grayscale transition-opacity hover:opacity-70">
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store — Segera"
                className="h-10 w-auto object-contain"
                loading="lazy"
              />
              <span className="absolute -right-2 -top-2 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Segera</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400">Badge resmi — link aktif saat aplikasi rilis. Saat ini prototype.</p>
        </div>
      </section>

      <section aria-label="Fitur" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16 md:pb-24">
        <div className="grid gap-10 border-t border-gray-100 pt-12 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.no}>
              <p className="font-serif text-sm italic text-gray-400">{f.no}</p>
              <h3 className="mt-2 text-base font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function FiturPage() {
  return (
    <section className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
        Fitur <em className="font-serif italic font-medium">MBG</em>
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
        Sistem MBG menghubungkan Admin, SPPG, dan User melalui QR Code, Nutrition Engine, dan AI Analysis — semuanya dari satu pindai.
      </p>

      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <div>
          <p className="font-serif text-sm italic text-gray-400">01</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">Scan QR Code</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Pindai QR pada kemasan makanan. Sistem memvalidasi token, menu, SPPG, dan status QR — lalu menampilkan informasi lengkap.
          </p>
        </div>
        <div>
          <p className="font-serif text-sm italic text-gray-400">02</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">Nutrition Engine</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Hitung kalori, protein, karbohidrat, lemak, serat, dan nutrisi lainnya secara deterministik dari data bahan.
          </p>
        </div>
        <div>
          <p className="font-serif text-sm italic text-gray-400">03</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">Freshness & Risk Engine</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Analisis waktu produksi, suhu, kelembapan, dan kondisi penyimpanan menghasilkan freshness score dan risk level.
          </p>
        </div>
        <div>
          <p className="font-serif text-sm italic text-gray-400">04</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">AI Explanation</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            LLM menjelaskan hasil analisis nutrisi dan kesegaran dalam bahasa yang mudah dipahami pengguna.
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-[2rem]">
        <img
          src={scanImg}
          alt="Seseorang memindai QR Code pada kemasan makanan untuk melihat informasi nutrisi MBG"
          className="w-full object-cover shadow-xl"
          loading="lazy"
        />
      </div>
    </section>
  )
}

function MulaiPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  function submit(e) {
    e.preventDefault()
    if (!email.includes('@') || email.length < 5) { setStatus('error'); return }
    setStatus('done')
  }

  return (
    <section className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
        Mulai <em className="font-serif italic font-medium">MBG</em>
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
        Daftarkan email untuk mendapat notifikasi saat MBG rilis. Prototype — email tidak dikirim ke mana pun.
      </p>

      <div className="bottom-face mt-10 overflow-hidden rounded-[2rem] px-8 py-14 text-white md:px-14 md:py-20">
        <div className="max-w-xl">
          <p className="font-serif text-lg italic opacity-90">Setiap makanan punya cerita.</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Ketahui apa yang Anda<br />konsumsi.
          </h2>
          {status === 'done' ? (
            <p role="status" className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900">
              Tercatat. Cek inbox {email} saat rilis.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
              <label htmlFor="cta-email" className="sr-only">Alamat email</label>
              <input
                id="cta-email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'cta-error' : undefined}
                className="w-full rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm text-white placeholder:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Daftar Sekarang <ArrowIcon />
              </button>
            </form>
          )}
          {status === 'error' && (
            <p id="cta-error" role="alert" className="mt-3 text-sm font-medium text-white">Masukkan email valid.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function ScanPage() {
  return (
    <section className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 text-center md:py-24">
      <p className="font-serif text-xl italic text-gray-900 md:text-2xl">Masih dalam pengembangan.</p>
      <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 md:text-6xl">
        Scan QR
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500">
        Fitur scan QR Code akan tersedia di mobile app MBG. Daftarkan email untuk mendapat notifikasi saat rilis.
      </p>
      <div className="mt-8">
        <CtaButton href="#/mulai">Daftar Notifikasi</CtaButton>
      </div>
    </section>
  )
}

/* ── Layout ────────────────────────────────────────────── */

function SiteHeader({ hash }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <nav aria-label="Utama" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#/" className="text-lg font-extrabold tracking-tight text-gray-900">MBG</a>
        <ul className="hidden items-center gap-8 md:flex">
          {ROUTES.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                className={`text-sm transition-colors hover:text-gray-900 ${isActive(r.href, hash) ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
              >
                {r.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#/scan"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Scan QR <ArrowIcon />
            </a>
          </li>
        </ul>
        <button
          type="button"
          className="rounded p-2 text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {ROUTES.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm hover:text-gray-900 ${isActive(r.href, hash) ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4" onClick={() => setOpen(false)}>
            <CtaButton href="#/scan">Scan QR</CtaButton>
          </div>
        </div>
      )}
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 md:flex-row">
        <p className="font-extrabold tracking-tight text-gray-900">MBG — Makan Bergizi Gratis</p>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-6">
            {ROUTES.map((r) => (
              <li key={r.href}><a href={r.href} className="hover:text-gray-900">{r.label}</a></li>
            ))}
          </ul>
        </nav>
        <p>&copy; 2026 MBG</p>
      </div>
    </footer>
  )
}

function Page({ hash }) {
  if (hash === '#/fitur') return <FiturPage />
  if (hash === '#/mulai') return <MulaiPage />
  if (hash === '#/scan') return <ScanPage />
  return <HomePage />
}

export default function App() {
  const hash = useHash()
  return (
    <>
      <SiteHeader hash={hash} />
      <main>
        <Page hash={hash} />
      </main>
      <SiteFooter />
    </>
  )
}
