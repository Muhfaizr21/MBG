import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AlertTriangle,
  Send,
  OctagonX,
  PackageCheck,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Building2,
  Clock,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgIncidentsBundle,
  replySppgIncidentTicket,
  replaceSppgIncidentPortions,
  recallSppgIncidentBatch,
  closeSppgIncidentTicket,
  fetchSppgList,
} from '../../lib/api'
import {
  SLA_MINUTES,
  LEVELS,
  TICKET_STATUS,
  slaState,
} from '../../data/sppgIncidentsData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

function toMinutes(clock) {
  if (!clock) return 0
  const [h, m] = clock.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function getSystemClock() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function SppgIncidentsPanel() {
  const { user, isSuperadmin } = useAuth()
  const [kitchens, setKitchens] = useState([])
  const [activeSppgId, setActiveSppgId] = useState(user?.sppgId || 'SPPG-01')

  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [activeId, setActiveId] = useState('')
  const [sessionClock, setSessionClock] = useState(getSystemClock())
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replaceBoxes, setReplaceBoxes] = useState('')
  const [replaceError, setReplaceError] = useState('')
  const [replaceOk, setReplaceOk] = useState('')
  const [resolution, setResolution] = useState('')
  const [closeError, setCloseError] = useState('')
  const [submittingAction, setSubmittingAction] = useState('')

  // 1. Load Kitchen list for Superadmin switcher
  useEffect(() => {
    let mounted = true
    async function loadKitchens() {
      try {
        const list = await fetchSppgList()
        if (mounted && Array.isArray(list) && list.length > 0) {
          setKitchens(list)
        }
      } catch (err) {
        console.warn('Gagal memuat daftar dapur SPPG:', err)
      }
    }
    loadKitchens()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Load Incidents Bundle from Database
  const loadBundle = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      try {
        const data = await fetchSppgIncidentsBundle(activeSppgId)
        if (data) {
          setBundle(data)
          // Default active ticket
          if (!activeId || !data.tickets.some((t) => t.id === activeId)) {
            const firstOpen = data.tickets.find((t) => t.status !== 'selesai') || data.tickets[0]
            if (firstOpen) setActiveId(firstOpen.id)
          }
        }
      } catch (err) {
        console.error('Gagal memuat data insiden:', err)
        setError(err.message || 'Gagal memuat data insiden dari database.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [activeSppgId, activeId]
  )

  useEffect(() => {
    loadBundle()
  }, [loadBundle])

  const tickets = bundle?.tickets || []
  const stock = bundle?.safetyStock ?? 40
  const recalled = bundle?.recalledTokens || []
  const nowMinutes = toMinutes(sessionClock)
  const active = tickets.find((t) => t.id === activeId) || tickets[0] || null

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

  // Action: Kirim Tanggapan Dapur
  async function handleReply(e) {
    e.preventDefault()
    if (!active) return
    if (!reply.trim()) {
      setReplyError('Tulis tanggapan dan hasil pengecekan sampel arsip.')
      return
    }

    setSubmittingAction('reply')
    setReplyError('')
    try {
      await replySppgIncidentTicket(active.id, { text: reply.trim() }, activeSppgId)
      setNotice(`Tanggapan untuk ${active.schoolName} berhasil dicatat di database. Status beralih ke 'Ditangani'.`)
      setReply('')
      await loadBundle(true)
    } catch (err) {
      setReplyError(err.message || 'Gagal mengirim tanggapan.')
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Kirim Porsi Pengganti Kilat
  async function handleReplace(e) {
    e.preventDefault()
    if (!active) return
    const boxes = parseInt(replaceBoxes, 10)
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > stock) {
      setReplaceError(`Jumlah boks harus 1 sampai ${stock} (stok cadangan dapur tersedia).`)
      return
    }

    setSubmittingAction('replace')
    setReplaceError('')
    setReplaceOk('')
    try {
      const res = await replaceSppgIncidentPortions(active.id, { boxes }, activeSppgId)
      const remain = res?.safetyStock ?? (stock - boxes)
      setReplaceOk(`${boxes} porsi pengganti kilat dikirim. Sisa stok cadangan: ${remain} boks.`)
      setNotice(`Berhasil mengirim ${boxes} porsi pengganti dari stok cadangan dapur.`)
      setReplaceBoxes('')
      await loadBundle(true)
    } catch (err) {
      setReplaceError(err.message || 'Gagal mengalokasikan porsi pengganti.')
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Karantina Darurat Batch (Batch Recall)
  async function handleRecall() {
    if (!active || recalled.includes(active.batchToken)) return

    setSubmittingAction('recall')
    setError('')
    try {
      await recallSppgIncidentBatch(
        {
          batchToken: active.batchToken,
          reason: `Karantina darurat atas laporan ${active.category}: ${active.message}`,
        },
        activeSppgId
      )
      setNotice(
        `PERINGATAN: Batch ${active.batchToken} resmi DIKARANTINA. Seluruh sekolah penerima otomatis dilarang membagikan porsi.`
      )
      await loadBundle(true)
    } catch (err) {
      setError('Gagal mengeksekusi karantina batch: ' + err.message)
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Tutup Tiket Bersama Satgas
  async function handleClose(e) {
    e.preventDefault()
    if (!active) return
    if (!resolution.trim()) {
      setCloseError('Tuliskan bukti dan catatan penyelesaian resmi untuk Satgas.')
      return
    }

    setSubmittingAction('close')
    setCloseError('')
    try {
      await closeSppgIncidentTicket(active.id, { resolution: resolution.trim() }, activeSppgId)
      setNotice(`Tiket ${active.id} (${active.schoolName}) berhasil diselesaikan dan ditutup bersama Satgas.`)
      setResolution('')
      await loadBundle(true)
    } catch (err) {
      setCloseError(err.message || 'Gagal menutup tiket.')
    } finally {
      setSubmittingAction('')
    }
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
      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-amber-300">
              <span>{bundle?.kitchenCode || 'SPPG-01'}</span>
              <span>·</span>
              <span>{bundle?.kitchenName || 'Dapur Sentral'}</span>
              <span>·</span>
              <span>SLA {SLA_MINUTES} MENIT</span>
              <span>·</span>
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-200">
                CADANGAN: {stock} BOKS
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Insiden & Respon Aduan
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Aduan kritis ditangani seketika. Karantina darurat mengunci seluruh sekolah penerima
              token batch yang sama, dan penyelesaian diaudit bersama Satgas MBG.
            </p>

            {/* Superadmin Kitchen Switcher */}
            {isSuperadmin && kitchens.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-white/70">Pilih Dapur SPPG:</span>
                <div className="relative inline-block">
                  <select
                    value={activeSppgId}
                    onChange={(e) => setActiveSppgId(e.target.value)}
                    className="appearance-none rounded-xl border border-white/20 bg-white/10 py-1.5 pl-3 pr-8 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    {kitchens.map((k) => (
                      <option key={k.id} value={k.id} className="text-slate-900">
                        {k.name} ({k.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() => loadBundle(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Segarkan
            </button>

            <div className="shrink-0 lg:text-right">
              <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">TIKET TERBUKA</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                {totals.open}
              </p>
              <p className="mt-1 text-[11px] font-medium text-white/70">
                {totals.critical} kritis · {totals.breached} lewat SLA · {totals.recalled} batch dikarantina
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recalled Batches Active Warning */}
      {recalled.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3.5 text-xs shadow-sm">
          <p className="flex items-center gap-2 font-bold text-rose-900">
            <OctagonX className="h-4 w-4 shrink-0 text-rose-600" />
            Karantina Darurat Aktif: {recalled.join(', ')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-800">
            Seluruh sekolah penerima batch token ini dilarang mendistribusikan porsi kepada siswa.
            Penguncian berlangsung sampai hasil uji laboratorium mikrobiologi dan investigasi Satgas selesai.
          </p>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-700 hover:text-rose-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className={`p-8 text-center text-xs text-slate-500 ${CARD}`}>
          <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[#23259C]" />
          <p className="font-semibold">Menghubungkan ke basis data tiket aduan & insiden SPPG...</p>
        </div>
      )}

      {/* Main Grid: Inbox Tickets + Detail Actions */}
      {!loading && (
        <div className="grid gap-5 xl:grid-cols-5">
          {/* Slip 01: Inbox Aduan */}
          <div className={`overflow-hidden text-xs xl:col-span-2 ${CARD}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · INBOX ADUAN SEKOLAH</p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                  Tiket Masuk ({tickets.length})
                </h2>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Jam Sesi:
                <input
                  type="time"
                  value={sessionClock}
                  onChange={(e) => setSessionClock(e.target.value)}
                  className={`rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs tabular-nums text-slate-800 ${FOCUS}`}
                />
              </label>
            </div>
            <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />

            {sorted.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-500">
                Tidak ada tiket insiden atau aduan untuk dapur SPPG ini.
              </p>
            ) : (
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
                          selected ? 'bg-[#23259C]/[0.06] ring-1 ring-inset ring-[#23259C]/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${LEVELS[t.level]?.tone || 'bg-slate-100'}`}>
                            L{t.level} {LEVELS[t.level]?.label || 'Level ' + t.level}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${TICKET_STATUS[t.status]?.tone || 'bg-slate-100'}`}>
                            {TICKET_STATUS[t.status]?.label || t.status}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${sla.tone}`}>
                            {sla.label}
                          </span>
                          {recalled.includes(t.batchToken) && (
                            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                              DIKARANTINA
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs font-bold text-slate-900">
                          {t.schoolName} · <span className="text-slate-600">{t.category}</span>
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {t.message} · masuk {t.createdAt} WIB
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Slip 02, 03, 04: Detail Tiket & Aksi Respons */}
          {active && (
            <div className="space-y-5 xl:col-span-3">
              {/* Slip 02: Tanggapan Dapur */}
              <div className={`p-5 text-xs ${CARD}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · TANGGAPAN & INVESTIGASI DAPUR</p>
                    <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                      {active.schoolName} · {active.category}
                    </h2>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${LEVELS[active.level]?.tone}`}>
                    Tingkat: L{active.level} {LEVELS[active.level]?.label}
                  </span>
                </div>
                <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />

                <div className="rounded-xl bg-slate-50 p-3.5 text-slate-700">
                  <p className="leading-relaxed">{active.message}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                    Token: <span className="font-bold text-slate-700">{active.batchToken}</span> · Masuk: {active.createdAt} WIB
                  </p>
                </div>

                {active.responses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-600">Riwayat Tanggapan & Tindakan:</p>
                    <ul className="space-y-2">
                      {active.responses.map((r, i) => (
                        <li key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                          <p className="leading-relaxed text-slate-800">{r.text}</p>
                          <p className="mt-1.5 text-[11px] font-semibold text-slate-500">
                            {r.by} · {r.at} WIB
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {active.status !== 'selesai' && (
                  <form onSubmit={handleReply} className="mt-4 space-y-2.5">
                    {replyError && (
                      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                        {replyError}
                      </p>
                    )}
                    <label className="block">
                      <span className="mb-1 block font-semibold text-slate-700">
                        Tanggapan Dapur & Hasil Cek Sampel Arsip HACCP
                      </span>
                      <textarea
                        value={reply}
                        onChange={(e) => {
                          setReply(e.target.value)
                          setReplyError('')
                        }}
                        rows={2}
                        placeholder="Contoh: Sampel arsip batch dicek, suhu 64C dan aroma normal. Tindakan penggantian disiapkan..."
                        className={INPUT}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={submittingAction === 'reply'}
                      className={BTN}
                    >
                      <Send className="h-4 w-4" />
                      {submittingAction === 'reply' ? 'Mengirim...' : 'Kirim Tanggapan'}
                    </button>
                  </form>
                )}
              </div>

              {/* Slip 03 & Slip 04 */}
              {active.status !== 'selesai' && (
                <div className="grid gap-5 md:grid-cols-2">
                  {/* Slip 03: Porsi Pengganti & Karantina */}
                  <div className={`space-y-3 p-5 text-xs ${CARD}`}>
                    <div className="pb-1">
                      <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · KILAT / EMERGENCY</p>
                      <h2 className="mt-0.5 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                        <PackageCheck className="h-4 w-4 text-[#23259C]" />
                        Porsi Pengganti Darurat
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Stok cadangan dapur tersedia: <span className="font-bold text-[#23259C]">{stock} boks</span>.
                    </p>

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
                        max={stock}
                        value={replaceBoxes}
                        onChange={(e) => {
                          setReplaceBoxes(e.target.value)
                          setReplaceError('')
                          setReplaceOk('')
                        }}
                        placeholder="Jumlah boks"
                        aria-label="Jumlah porsi pengganti"
                        className={`w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
                      />
                      <button
                        type="submit"
                        disabled={submittingAction === 'replace' || stock === 0}
                        className={BTN}
                      >
                        {submittingAction === 'replace' ? 'Mengirim...' : 'Alokasikan'}
                      </button>
                    </form>

                    <div className="pt-2">
                      {!recalled.includes(active.batchToken) && active.level === 1 && (
                        <button
                          type="button"
                          disabled={submittingAction === 'recall'}
                          onClick={handleRecall}
                          className={`inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 active:scale-[0.98] ${FOCUS}`}
                        >
                          <OctagonX className="h-4 w-4" />
                          {submittingAction === 'recall' ? 'Mengeksekusi...' : 'Karantina Batch Ini (Level 1)'}
                        </button>
                      )}
                      {recalled.includes(active.batchToken) && (
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800">
                          <OctagonX className="h-3.5 w-3.5 shrink-0" />
                          Batch {active.batchToken} berada dalam karantina darurat.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Slip 04: Satgas - Tutup Tiket */}
                  <form onSubmit={handleClose} className={`space-y-3 p-5 text-xs ${CARD}`}>
                    <div className="pb-1">
                      <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 04 · PENYELESAIAN SATGAS</p>
                      <h2 className="mt-0.5 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                        <CheckCheck className="h-4 w-4 text-[#23259C]" />
                        Tutup Tiket Kasus
                      </h2>
                    </div>

                    {closeError && (
                      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                        {closeError}
                      </p>
                    )}

                    <label className="block">
                      <span className="mb-1 block font-semibold text-slate-700">
                        Bukti & Berita Acara Penyelesaian Satgas
                      </span>
                      <textarea
                        value={resolution}
                        onChange={(e) => {
                          setResolution(e.target.value)
                          setCloseError('')
                        }}
                        rows={2}
                        placeholder="Uraian tindakan: diganti apa, disaksikan siapa, kondisi siswa aman..."
                        className={INPUT}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submittingAction === 'close'}
                      className={BTN}
                    >
                      {submittingAction === 'close' ? 'Menutup...' : 'Tutup Bersama Satgas'}
                    </button>
                  </form>
                </div>
              )}

              {/* Status Selesai Badge */}
              {active.status === 'selesai' && (
                <div className={`p-5 text-xs ${CARD}`}>
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                    Kasus Tiket Selesai & Ditutup
                  </p>
                  <div className="mt-2 rounded-xl bg-emerald-50/60 p-3">
                    <p className="font-semibold text-slate-700">Bukti Penyelesaian:</p>
                    <p className="mt-0.5 leading-relaxed text-slate-600">{active.resolution}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#23259C]" />
        SLA {SLA_MINUTES} menit dihitung dari jam aduan terhadap jam operasional sesi. Seluruh karantina batch
        dan alokasi porsi pengganti diaudit langsung oleh Satgas MBG dan tersimpan di basis data terdistribusi.
      </p>
    </div>
  )
}
