import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Send,
  OctagonX,
  PackageCheck,
  CheckCheck,
} from 'lucide-react'
import {
  SLA_MINUTES,
  LEVELS,
  TICKET_STATUS,
  SEED_TICKETS,
  SEED_REPLACEMENT_STOCK,
  slaState,
} from '../../data/sppgIncidentsData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

function toMinutes(clock) {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

export function SppgIncidentsPanel() {
  const [tickets, setTickets] = useState(SEED_TICKETS)
  const [stock, setStock] = useState(SEED_REPLACEMENT_STOCK)
  const [recalled, setRecalled] = useState([])
  const [activeId, setActiveId] = useState('tkt-01')
  const [sessionClock, setSessionClock] = useState('08:05')
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replaceBoxes, setReplaceBoxes] = useState('')
  const [replaceError, setReplaceError] = useState('')
  const [replaceOk, setReplaceOk] = useState('')
  const [resolution, setResolution] = useState('')
  const [closeError, setCloseError] = useState('')

  const nowMinutes = toMinutes(sessionClock)
  const active = tickets.find((t) => t.id === activeId) || tickets[0]

  const totals = useMemo(() => {
    const open = tickets.filter((t) => t.status !== 'selesai')
    const breached = open.filter((t) => slaState(t.createdAt, nowMinutes, t.status).label.startsWith('Lewat'))
    return {
      open: open.length,
      breached: breached.length,
      critical: open.filter((t) => t.level === 1).length,
      recalled: recalled.length,
    }
  }, [tickets, recalled, nowMinutes])

  function patch(id, fn) {
    setTickets((list) => list.map((t) => (t.id === id ? fn(t) : t)))
  }

  function handleReply(e) {
    e.preventDefault()
    if (!active || !reply.trim()) {
      setReplyError('Tulis tanggapan dan hasil cek sampel arsip.')
      return
    }
    patch(active.id, (t) => ({
      ...t,
      status: 'ditangani',
      responses: [...t.responses, { at: sessionClock, by: '[Nama Penanggung]', text: reply.trim() }],
    }))
    setReply('')
    setReplyError('')
  }

  function handleReplace(e) {
    e.preventDefault()
    if (!active) return
    const boxes = parseInt(replaceBoxes, 10)
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > stock) {
      setReplaceError(`Jumlah 1 sampai ${stock} boks stok cadangan.`)
      return
    }
    setStock((s) => s - boxes)
    patch(active.id, (t) => ({
      ...t,
      status: 'ditangani',
      responses: [
        ...t.responses,
        { at: sessionClock, by: '[Nama Penanggung]', text: `${boxes} porsi pengganti kilat dikirim dari stok cadangan.` },
      ],
    }))
    setReplaceBoxes('')
    setReplaceError('')
    setReplaceOk(`${boxes} porsi pengganti dialokasikan. Sisa stok ${stock - boxes}.`)
  }

  function handleRecall() {
    if (!active || recalled.includes(active.batchToken)) return
    setRecalled((list) => [...list, active.batchToken])
    patch(active.id, (t) => ({
      ...t,
      status: 'ditangani',
      responses: [
        ...t.responses,
        { at: sessionClock, by: '[Nama Penanggung]', text: `Batch ${t.batchToken} dikarantina. Seluruh sekolah penerima dilarang membagikan.` },
      ],
    }))
  }

  function handleClose(e) {
    e.preventDefault()
    if (!active) return
    if (!resolution.trim()) {
      setCloseError('Tulis bukti penyelesaian untuk Satgas.')
      return
    }
    patch(active.id, (t) => ({ ...t, status: 'selesai', resolution: resolution.trim() }))
    setResolution('')
    setCloseError('')
  }

  const sorted = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        if (a.status === 'selesai' && b.status !== 'selesai') return 1
        if (b.status === 'selesai' && a.status !== 'selesai') return -1
        if (a.level !== b.level) return a.level - b.level
        return toMinutes(a.createdAt) - toMinutes(b.createdAt)
      }),
    [tickets]
  )

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · SELASA, 29 SEPT 2026 · SLA {SLA_MINUTES} MENIT
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Insiden dan respon aduan
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Aduan kritis ditangani menit ini juga. Karantina batch mengunci semua sekolah
              penerima token yang sama.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">TIKET TERBUKA</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {totals.open}
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {totals.critical} kritis · {totals.breached} lewat SLA · {totals.recalled} batch dikarantina
            </p>
          </div>
        </div>
      </section>

      {recalled.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3.5 text-xs">
          <p className="flex items-center gap-2 font-bold text-rose-900">
            <OctagonX className="h-4 w-4" />
            Karantina aktif: {recalled.join(', ')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-800">
            Seluruh sekolah yang menerima batch ini dilarang membagikan porsi sampai karantina
            dicabut Satgas. Batch yang tidak tercantum tetap berjalan normal.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-5">
        <div className={`overflow-hidden text-xs xl:col-span-2 ${CARD}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · INBOX ADUAN</p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                Tiket masuk
              </h2>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              Jam sesi
              <input
                type="time"
                value={sessionClock}
                onChange={(e) => setSessionClock(e.target.value)}
                className={`rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          <ul className="divide-y divide-slate-100 px-3 pb-3">
            {sorted.map((t) => {
              const sla = slaState(t.createdAt, nowMinutes, t.status)
              const selected = active && active.id === t.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    aria-current={selected}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${FOCUS} ${
                      selected ? 'bg-[#23259C]/[0.06]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${LEVELS[t.level].tone}`}>
                        L{t.level} {LEVELS[t.level].label}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${TICKET_STATUS[t.status].tone}`}>
                        {TICKET_STATUS[t.status].label}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${sla.tone}`}>
                        {sla.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-slate-900">
                      {t.schoolName} · {t.category}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {t.message} · masuk {t.createdAt}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {active && (
          <div className="space-y-5 xl:col-span-3">
            <div className={`p-5 text-xs ${CARD}`}>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · TANGGAPAN DAPUR</p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                {active.schoolName} · {active.category}
              </h2>
              <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 leading-relaxed text-slate-700">
                {active.message}
                <span className="mt-1 block font-mono text-[11px] text-slate-500">
                  {active.batchToken} · masuk {active.createdAt} WIB
                </span>
              </p>
              {active.responses.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {active.responses.map((r, i) => (
                    <li key={i} className="rounded-xl border border-slate-200 px-3 py-2.5">
                      <p className="text-xs leading-relaxed text-slate-700">{r.text}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{r.by} · {r.at} WIB</p>
                    </li>
                  ))}
                </ul>
              )}
              {active.status !== 'selesai' && (
                <form onSubmit={handleReply} className="mt-3 space-y-2.5">
                  {replyError && (
                    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                      {replyError}
                    </p>
                  )}
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">
                      Tanggapan dan hasil cek sampel arsip
                    </span>
                    <textarea
                      value={reply}
                      onChange={(e) => {
                        setReply(e.target.value)
                        setReplyError('')
                      }}
                      rows={2}
                      placeholder="Hasil pengecekan sampel dan tindakan mitigasi"
                      className={INPUT}
                    />
                  </label>
                  <button type="submit" className={BTN}>
                    <Send className="h-4 w-4" />
                    Kirim tanggapan
                  </button>
                </form>
              )}
            </div>

            {active.status !== 'selesai' && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className={`space-y-2.5 p-5 text-xs ${CARD}`}>
                  <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · KILAT</p>
                  <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                    <PackageCheck className="h-4 w-4 text-[#23259C]" />
                    Porsi pengganti
                  </h2>
                  <p className="text-[11px] text-slate-500">Stok cadangan tersisa {stock} boks.</p>
                  {replaceError && (
                    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                      {replaceError}
                    </p>
                  )}
                  {replaceOk && (
                    <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                      {replaceOk}
                    </p>
                  )}
                  <form onSubmit={handleReplace} className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={replaceBoxes}
                      onChange={(e) => {
                        setReplaceBoxes(e.target.value)
                        setReplaceError('')
                        setReplaceOk('')
                      }}
                      placeholder="Boks"
                      aria-label="Jumlah porsi pengganti"
                      className={`w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
                    />
                    <button type="submit" className={BTN}>
                      Alokasikan
                    </button>
                  </form>
                  {!recalled.includes(active.batchToken) && active.level === 1 && (
                    <button
                      type="button"
                      onClick={handleRecall}
                      className={`inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 active:scale-[0.98] ${FOCUS}`}
                    >
                      <OctagonX className="h-4 w-4" />
                      Karantina batch ini
                    </button>
                  )}
                  {recalled.includes(active.batchToken) && (
                    <p className="text-[11px] font-semibold text-rose-800">
                      Batch ini dalam karantina.
                    </p>
                  )}
                </div>

                <form onSubmit={handleClose} className={`space-y-2.5 p-5 text-xs ${CARD}`}>
                  <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 04 · SATGAS</p>
                  <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                    <CheckCheck className="h-4 w-4 text-[#23259C]" />
                    Tutup tiket
                  </h2>
                  {closeError && (
                    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                      {closeError}
                    </p>
                  )}
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">Bukti penyelesaian</span>
                    <textarea
                      value={resolution}
                      onChange={(e) => {
                        setResolution(e.target.value)
                        setCloseError('')
                      }}
                      rows={2}
                      placeholder="Diselenggarakan apa, diverifikasi siapa"
                      className={INPUT}
                    />
                  </label>
                  <button type="submit" className={BTN}>
                    Tutup bersama Satgas
                  </button>
                </form>
              </div>
            )}

            {active.status === 'selesai' && (
              <div className={`p-5 text-xs ${CARD}`}>
                <p className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCheck className="h-4 w-4" />
                  Tiket selesai
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{active.resolution}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        SLA {SLA_MINUTES} menit dihitung dari jam aduan terhadap jam sesi. Karantina batch
        berlaku sesi ini dan dicabut Satgas setelah investigasi.
      </p>
    </div>
  )
}
