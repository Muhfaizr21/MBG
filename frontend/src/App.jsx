import { useState } from 'react'
import heroImg from './assets/hero.png'

const NAV_LINKS = [
  { label: 'Home', href: '#home', soon: false },
  { label: 'Services', href: '#services', soon: false },
  { label: 'Features', href: '#features', soon: false },
  { label: 'Blog', href: '#get-started', soon: true },
  { label: 'Pricing', href: '#get-started', soon: true },
]

const FEATURES = [
  {
    no: '01',
    title: 'Smart Task Management',
    desc: 'Capture, prioritize, and clear tasks in one calm list. No noise, just the next action.',
  },
  {
    no: '02',
    title: 'Integrated Calendar & Deadlines',
    desc: 'Deadlines sit beside your day, not on top of it. See what actually matters this week.',
  },
  {
    no: '03',
    title: 'Focus Mode',
    desc: 'One task, full screen, timer on. Distractions stay out until the work is done.',
  },
]

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8h11M9 3.5 13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <nav aria-label="Utama" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#home" className="text-lg font-extrabold tracking-tight text-gray-900">
          Enblox
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
              >
                {link.label}
                {link.soon && (
                  <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Segera
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <CtaButton href="#get-started">Try it for free</CtaButton>
        </div>
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
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  {link.label}
                  {link.soon && (
                    <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Segera
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4" onClick={() => setOpen(false)}>
            <CtaButton href="#get-started">Try it for free</CtaButton>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section id="home" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-8 pt-16 text-center md:pt-24">
      <p className="font-serif text-xl italic text-gray-900 md:text-2xl">Your Day, in Perfect Rhythm.</p>
      <h1 className="mx-auto mt-4 max-w-2xl text-5xl font-extrabold leading-[1.05] tracking-tight text-gray-900 md:text-7xl">
        Work Smarter,
        <br />
        Not Harder
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500">
        Enblox keeps tasks, deadlines, and focus time in one calm place, so modern professionals stay
        organized without the stress.
      </p>
      <div className="mt-8">
        <CtaButton href="#get-started">Try it for free</CtaButton>
      </div>
      <div className="relative mx-auto mt-14 max-w-3xl">
        <div className="hero-aura absolute inset-0 -z-0 scale-110 blur-3xl" aria-hidden="true" />
        <img
          src={heroImg}
          alt="Tangan memegang iPhone menampilkan aplikasi Enblox"
          className="relative z-10 mx-auto w-full rounded-[2rem] object-cover shadow-2xl"
          loading="eager"
        />
      </div>
    </section>
  )
}

function FeatureIntro() {
  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
      <div className="grid gap-8 md:grid-cols-5 md:items-end">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:col-span-3 md:text-5xl">
          Designed to Help You Do More{' '}
          <em className="font-serif font-medium italic">With Less</em> Stress
        </h2>
        <p className="text-base leading-relaxed text-gray-500 md:col-span-2">
          Our productivity app is built for modern professionals who want to stay organized, focused,
          and in control.
        </p>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section id="features" aria-label="Fitur" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16 md:pb-24">
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
  )
}

function GetStarted() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  function submit(e) {
    e.preventDefault()
    if (!email.includes('@') || email.length < 5) {
      setStatus('error')
      return
    }
    setStatus('done')
  }

  return (
    <section id="get-started" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16 md:pb-24">
      <div className="bottom-face overflow-hidden rounded-[2rem] px-8 py-14 text-white md:px-14 md:py-20">
        <div className="max-w-xl">
          <p className="font-serif text-lg italic opacity-90">Focus sounds better here.</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Put on your headphones.
            <br />
            Get to work.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-80">
            Prototype — email tidak dikirim ke mana pun. Daftar untuk diberi tahu saat Enblox rilis.
          </p>
          {status === 'done' ? (
            <p role="status" className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900">
              Tercatat. Cek inbox {email} saat rilis.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
              <label htmlFor="cta-email" className="sr-only">
                Alamat email
              </label>
              <input
                id="cta-email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setStatus('idle')
                }}
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'cta-error' : undefined}
                className="w-full rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm text-white placeholder:text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Notify me
                <ArrowIcon />
              </button>
            </form>
          )}
          {status === 'error' && (
            <p id="cta-error" role="alert" className="mt-3 text-sm font-medium text-white">
              Masukkan email valid.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 md:flex-row">
        <p className="font-extrabold tracking-tight text-gray-900">Enblox</p>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-6">
            <li>
              <a href="#home" className="hover:text-gray-900">
                Home
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-gray-900">
                Features
              </a>
            </li>
            <li>
              <a href="#get-started" className="hover:text-gray-900">
                Get started
              </a>
            </li>
          </ul>
        </nav>
        <p>© 2026 Enblox · Syarat & Privasi — Segera</p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <FeatureIntro />
        <FeatureGrid />
        <GetStarted />
      </main>
      <SiteFooter />
    </>
  )
}
