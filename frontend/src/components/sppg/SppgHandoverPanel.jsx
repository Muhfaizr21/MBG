import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ClipboardCheck,
  Printer,
  Camera,
  PenLine,
  PackageCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Building2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgHandoverBundle,
  advanceSppgHandoverStage,
  finishSppgHandoverScan,
  rejectSppgHandoverBoxes,
  replaceSppgHandoverRejected,
  signSppgHandoverBast,
  fetchSppgList,
} from '../../lib/api'
import {
  STAGE_ORDER,
  stageMeta,
  acceptedCount,
} from '../../data/sppgHandoverData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

function StagePill({ stage }) {
  const meta = stageMeta(stage)
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export function SppgHandoverPanel() {
  const { user, isSuperadmin } = useAuth()
  const [kitchens, setKitchens] = useState([])
  const [activeSppgId, setActiveSppgId] = useState(user?.sppgId || 'SPPG-01')

  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [activeId, setActiveId] = useState('')
  const [rejectForm, setRejectForm] = useState({ boxes: '', reason: '' })
  const [rejectError, setRejectError] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [signForm, setSignForm] = useState({ courier: '', teacher: '' })
  const [signError, setSignError] = useState('')
  const [printBast, setPrintBast] = useState(null)
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

  // 2. Load Handover Bundle from Database
  const loadBundle = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      try {
        const data = await fetchSppgHandoverBundle(activeSppgId)
        if (data) {
          setBundle(data)
          // Set default active handover if not already set or not found
          if (!activeId || !data.handovers.some((h) => h.id === activeId)) {
            const firstActive = data.handovers.find((h) => h.stage === 'memindai' || h.stage === 'hold') || data.handovers[0]
            if (firstActive) setActiveId(firstActive.id)
          }
        }
      } catch (err) {
        console.error('Gagal memuat data serah terima:', err)
        setError(err.message || 'Gagal memuat data serah terima dari database.')
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

  // Print BAST effect
  useEffect(() => {
    if (!printBast) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printBast])

  const handovers = bundle?.handovers || []
  const stock = bundle?.safetyStock ?? 40
  const totals = bundle?.totals || {
    sent: handovers.reduce((s, h) => s + h.sent, 0),
    accepted: handovers.reduce((s, h) => s + acceptedCount(h), 0),
    issued: handovers.filter((h) => h.bastNo).length,
    count: handovers.length,
  }

  const active = handovers.find((h) => h.id === activeId) || handovers[0] || null

  // Action: Advance Stage (menunggu -> tiba -> memindai)
  async function handleAdvance(id) {
    const target = handovers.find((h) => h.id === id)
    if (!target) return
    let nextStage = 'tiba'
    if (target.stage === 'tiba') nextStage = 'memindai'

    setSubmittingAction(`advance-${id}`)
    setError('')
    try {
      await advanceSppgHandoverStage(id, { stage: nextStage }, activeSppgId)
      setNotice(`Status ${target.schoolName} berhasil dimajukan ke '${nextStage}'.`)
      await loadBundle(true)
    } catch (err) {
      setError('Gagal memajukan status: ' + err.message)
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Finish Scan (Sahkan Penuh)
  async function handleFinishScan(id) {
    const target = handovers.find((h) => h.id === id)
    if (!target) return

    setSubmittingAction(`finish-${id}`)
    setError('')
    try {
      await finishSppgHandoverScan(id, { perfect: true }, activeSppgId)
      setNotice(`Pemindaian ${target.schoolName} disahkan penuh (${target.sent} porsi sah).`)
      await loadBundle(true)
    } catch (err) {
      setError('Gagal mengesahkan pemindaian: ' + err.message)
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Reject Boxes Form
  async function handleReject(e) {
    e.preventDefault()
    if (!active) return
    const boxes = parseInt(rejectForm.boxes, 10)
    const currentRej = active.rejected.reduce((s, r) => s + r.boxes, 0)
    const remaining = active.scanned - currentRej

    if (!Number.isInteger(boxes) || boxes < 1 || boxes > remaining) {
      setRejectError(`Jumlah boks harus antara 1 sampai ${remaining} (tersisa dari terpindai).`)
      return
    }
    if (!rejectForm.reason.trim()) {
      setRejectError('Alasan penolakan / kerusakan boks wajib diisi.')
      return
    }

    setSubmittingAction('reject')
    setRejectError('')
    try {
      await rejectSppgHandoverBoxes(
        active.id,
        {
          boxes,
          reason: rejectForm.reason.trim(),
          evidenceName: evidence ? evidence.name : 'bukti_guru.jpg',
        },
        activeSppgId
      )
      setNotice(`Penolakan ${boxes} boks pada ${active.schoolName} berhasil dicatat. Status ditahan (Hold).`)
      setRejectForm({ boxes: '', reason: '' })
      setEvidence(null)
      await loadBundle(true)
    } catch (err) {
      setRejectError(err.message || 'Gagal mencatat penolakan boks.')
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Replace Rejected from Safety Stock
  async function handleReplace(rejectIndex) {
    if (!active) return
    const item = active.rejected[rejectIndex]
    if (!item || item.boxes > stock) return

    setSubmittingAction(`replace-${rejectIndex}`)
    setError('')
    try {
      const res = await replaceSppgHandoverRejected(active.id, rejectIndex, activeSppgId)
      setNotice(
        `Berhasil mengirim ${item.boxes} boks pengganti dari stok cadangan dapur. Sisa cadangan: ${res?.safetyStock ?? (stock - item.boxes)} boks.`
      )
      await loadBundle(true)
    } catch (err) {
      setError('Gagal mengirim boks pengganti: ' + err.message)
    } finally {
      setSubmittingAction('')
    }
  }

  // Action: Sign BAST Dual-Signature
  async function handleSign(e) {
    e.preventDefault()
    if (!active) return
    const courier = signForm.courier.trim()
    const teacher = signForm.teacher.trim()

    if (!courier || !teacher) {
      setSignError('Isi nama lengkap kurir penyerah dan guru penerima.')
      return
    }
    if (active.stage !== 'lolos') {
      setSignError('BAST hanya dapat diterbitkan setelah status verifikasi berstatus Lolos sempurna.')
      return
    }

    setSubmittingAction('sign-bast')
    setSignError('')
    try {
      const signed = await signSppgHandoverBast(
        active.id,
        {
          courier,
          teacher,
        },
        activeSppgId
      )
      setNotice(
        `BAST resmi ${signed.bastNo} berhasil diterbitkan dan distempel SHA-256 (${signed.bastHash.slice(0, 12)}...).`
      )
      setSignForm({ courier: '', teacher: '' })
      await loadBundle(true)
    } catch (err) {
      setSignError(err.message || 'Gagal menerbitkan BAST digital.')
    } finally {
      setSubmittingAction('')
    }
  }

  const printed = handovers.find((h) => h.id === printBast) || null

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.bast-print-sheet{display:none}@media print{body *{visibility:hidden}.bast-print-sheet,.bast-print-sheet *{visibility:visible}.bast-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-amber-300">
              <span>{bundle?.kitchenCode || 'SPPG-01'}</span>
              <span>·</span>
              <span>{bundle?.kitchenName || 'Dapur Sentral'}</span>
              <span>·</span>
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-200">
                STOK CADANGAN: {stock} BOKS
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Serah Terima & BAST Digital
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Porsi sah tersinkronisasi langsung dengan pangkalan data PostgreSQL. BAST resmi
              diterbitkan dengan tanda tangan ganda dan stempel SHA-256 otomatis.
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
              <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">PORSI SAH / TERKIRIM</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                {totals.accepted.toLocaleString('id-ID')}
                <span className="text-xl text-white/50 sm:text-2xl">/{totals.sent.toLocaleString('id-ID')}</span>
              </p>
              <p className="mt-1 text-[11px] font-medium text-white/70">
                {totals.issued} dari {totals.count} BAST terbit resmi
              </p>
            </div>
          </div>
        </div>
      </section>

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
          <p className="font-semibold">Memuat data serah terima & BAST dari database...</p>
        </div>
      )}

      {/* Slip 01: Status per Sekolah */}
      {!loading && (
        <div className={`overflow-hidden text-xs ${CARD}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · MONITOR VERIFIKASI LAPANGAN</p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                Status Verifikasi & Kontrol Porsi per Sekolah
              </h2>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              Total {handovers.length} Sesi Terjadwal
            </span>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                <tr>
                  <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                  <th scope="col" className="px-3 py-2.5">Sekolah Penerima</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Terkirim</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Terpindai</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Porsi Sah</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handovers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                      Belum ada sesi serah terima untuk dapur SPPG ini.
                    </td>
                  </tr>
                ) : (
                  handovers.map((h, i) => (
                    <tr
                      key={h.id}
                      onClick={() => setActiveId(h.id)}
                      className={`cursor-pointer transition hover:bg-[#23259C]/[0.03] ${active && active.id === h.id ? 'bg-[#23259C]/[0.05] ring-1 ring-inset ring-[#23259C]/20' : ''}`}
                    >
                      <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{h.schoolName}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">{h.batchToken}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {h.sent.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {h.scanned.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-[#23259C]">
                        {h.accepted.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StagePill stage={h.stage} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {h.stage === 'menunggu' && (
                            <button
                              type="button"
                              disabled={submittingAction === `advance-${h.id}`}
                              onClick={() => handleAdvance(h.id)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
                            >
                              {submittingAction === `advance-${h.id}` ? 'Memproses...' : 'Tandai tiba'}
                            </button>
                          )}
                          {h.stage === 'tiba' && (
                            <button
                              type="button"
                              disabled={submittingAction === `advance-${h.id}`}
                              onClick={() => handleAdvance(h.id)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
                            >
                              {submittingAction === `advance-${h.id}` ? 'Memproses...' : 'Mulai pindai'}
                            </button>
                          )}
                          {h.stage === 'memindai' && (
                            <button
                              type="button"
                              disabled={submittingAction === `finish-${h.id}`}
                              onClick={() => handleFinishScan(h.id)}
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.97]"
                            >
                              {submittingAction === `finish-${h.id}` ? 'Menyahkan...' : 'Sahkan penuh'}
                            </button>
                          )}
                          {h.bastNo ? (
                            <button
                              type="button"
                              onClick={() => setPrintBast(h.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97]"
                            >
                              <Printer className="h-3 w-3" />
                              Unduh
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip 02 & Slip 03 Details */}
      {!loading && active && (
        <div className="grid gap-5 xl:grid-cols-5">
          {/* Slip 02: Penolakan dan Pengganti */}
          <div className={`space-y-4 p-5 text-xs xl:col-span-3 ${CARD}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">
                  SLIP 02 · PENOLAKAN DAN PENGGANTI DARI STOK CADANGAN
                </p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                  {active.schoolName}
                </h2>
              </div>
              <StagePill stage={active.stage} />
            </div>
            <div aria-hidden="true" className="border-t border-dashed border-slate-300" />

            {active.rejected.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-slate-600">
                ✓ Belum ada boks yang ditolak. Jika guru validator lapangan menemukan boks rusak, basi,
                atau segel retak, catat di bawah beserta foto bukti. Tiap catatan otomatis menahan status batch (Hold)
                dan mengurangi porsi sah.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {active.rejected.map((r, idx) => (
                  <li key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <p className="font-bold tabular-nums text-rose-700">{r.boxes} boks ditolak</p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        {r.reason} · <span className="font-mono text-slate-500">{r.evidenceName}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={r.boxes > stock || submittingAction === `replace-${idx}`}
                      onClick={() => handleReplace(idx)}
                      title={r.boxes > stock ? 'Stok cadangan dapur tidak mencukupi' : 'Kirim pengganti dari stok cadangan'}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition active:scale-[0.97] ${FOCUS} ${
                        r.boxes > stock
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-[#23259C]/30 bg-[#23259C]/10 text-[#23259C] hover:bg-[#23259C]/20'
                      }`}
                    >
                      {submittingAction === `replace-${idx}`
                        ? 'Mengirim...'
                        : r.boxes > stock
                        ? `Stok kurang (sisa: ${stock})`
                        : `Kirim Pengganti (${r.boxes} boks)`}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Form Catat Penolakan Baru */}
            <form onSubmit={handleReject} className="space-y-3 rounded-xl bg-slate-50/80 p-4">
              <p className="text-[11px] font-bold text-slate-800">Catat Penolakan / Anomali Boks Baru</p>
              {rejectError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                  {rejectError}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-semibold text-slate-700">Jumlah Boks Ditolak</span>
                  <input
                    type="number"
                    min="1"
                    value={rejectForm.boxes}
                    onChange={(e) => {
                      setRejectForm((f) => ({ ...f, boxes: e.target.value }))
                      setRejectError('')
                    }}
                    placeholder="Contoh: 3"
                    className={INPUT}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-semibold text-slate-700">Foto Bukti Guru Validator</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0]
                      setEvidence(file ? { name: file.name, url: URL.createObjectURL(file) } : null)
                    }}
                    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-[11px] file:font-semibold file:text-slate-700 ${FOCUS}`}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Alasan Penolakan</span>
                <input
                  type="text"
                  value={rejectForm.reason}
                  onChange={(e) => {
                    setRejectForm((f) => ({ ...f, reason: e.target.value }))
                    setRejectError('')
                  }}
                  placeholder="Misal: Segel tutup retak, lauk berbau masam"
                  className={INPUT}
                />
              </label>
              {evidence && (
                <div className="flex items-center gap-3">
                  <img src={evidence.url} alt={`Bukti ${evidence.name}`} className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
                  <p className="font-mono text-[11px] text-slate-600">{evidence.name}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={submittingAction === 'reject'}
                className={BTN}
              >
                <Camera className="h-4 w-4" />
                {submittingAction === 'reject' ? 'Mencatat...' : 'Catat Penolakan'}
              </button>
            </form>
          </div>

          {/* Slip 03: Dua Tangan - Terbitkan BAST & Rekonsiliasi */}
          <div className="space-y-5 xl:col-span-2">
            <form onSubmit={handleSign} className={`space-y-3 p-5 text-xs ${CARD}`}>
              <div className="pb-1">
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · DUA TANGAN (DUAL-SIGNATURE)</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                  <PenLine className="h-4 w-4 text-[#23259C]" />
                  Terbitkan BAST Digital
                </h2>
              </div>
              <div aria-hidden="true" className="border-t border-dashed border-slate-300" />

              {signError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                  {signError}
                </p>
              )}

              {active.bastNo ? (
                <div className="space-y-2 rounded-xl bg-emerald-50 p-4 text-[11px] leading-relaxed text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-emerald-800">{active.bastNo}</span>
                    <span className="rounded bg-emerald-200/60 px-2 py-0.5 font-bold text-emerald-900">RESMI</span>
                  </div>
                  <p className="text-slate-700">
                    <span className="font-semibold">Kurir:</span> {active.courierSign} <br />
                    <span className="font-semibold">Guru Validator:</span> {active.teacherSign} <br />
                    <span className="font-semibold">Pukul:</span> {active.bastAt} WIB · {active.accepted} Porsi Sah
                  </p>
                  {active.bastHash && (
                    <div className="mt-2 rounded bg-white/60 p-2 font-mono text-[10px] text-slate-600">
                      <p className="font-bold text-slate-700">SHA-256 Seal:</p>
                      <p className="break-all">{active.bastHash}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">Kurir Penyerah SPPG</span>
                    <input
                      type="text"
                      value={signForm.courier}
                      onChange={(e) => {
                        setSignForm((f) => ({ ...f, courier: e.target.value }))
                        setSignError('')
                      }}
                      placeholder="Nama lengkap kurir"
                      className={INPUT}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">Guru Penerima / Validator Sekolah</span>
                    <input
                      type="text"
                      value={signForm.teacher}
                      onChange={(e) => {
                        setSignForm((f) => ({ ...f, teacher: e.target.value }))
                        setSignError('')
                      }}
                      placeholder="Nama lengkap guru validator"
                      className={INPUT}
                    />
                  </label>
                  {active.stage !== 'lolos' && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                      ⚠️ BAST hanya dapat ditandatangani setelah verifikasi lolos sempurna dan tidak ada penolakan tertahan.
                    </p>
                  )}
                </>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {!active.bastNo && (
                  <button
                    type="submit"
                    disabled={active.stage !== 'lolos' || submittingAction === 'sign-bast'}
                    className={`${BTN} ${active.stage !== 'lolos' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    {submittingAction === 'sign-bast' ? 'Menandatangani...' : 'Tanda Tangani BAST'}
                  </button>
                )}
                {active.bastNo && (
                  <button
                    type="button"
                    onClick={() => setPrintBast(active.id)}
                    className={BTN}
                  >
                    <Printer className="h-4 w-4" />
                    Cetak / Unduh PDF BAST
                  </button>
                )}
              </div>
            </form>

            {/* Rekonsiliasi Porsi Card */}
            <div className={`p-5 text-xs ${CARD}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-wide text-slate-500">REKONSILIASI KONTROL PORSI</p>
                <ShieldCheck className="h-4 w-4 text-[#23259C]" />
              </div>
              <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
              <dl className="space-y-2.5">
                {[
                  ['Terkirim dari Dapur', active.sent],
                  ['Terpindai oleh Guru', active.scanned],
                  ['Ditolak / Rusak', active.rejected.reduce((s, r) => s + r.boxes, 0)],
                  ['Porsi Sah Final', active.accepted],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="font-mono text-[11px] font-bold tabular-nums text-slate-900">
                      {v.toLocaleString('id-ID')}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#23259C]" />
                Porsi sah tidak pernah melebihi terkirim. Pengiriman boks pengganti menambah keduanya secara atomik di database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BAST Print Sheet (A5 System Native Print) */}
      <div className="bast-print-sheet" aria-hidden="true">
        {printed && (
          <div style={{ color: '#000', background: '#fff', padding: 24, fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>BERITA ACARA SERAH TERIMA (BAST)</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '4px 0' }}>PROGRAM MAKAN BERGIZI GRATIS (MBG)</p>
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Nomor Dokumen Resmi: {printed.bastNo}</p>
            </div>
            <hr style={{ borderTop: '2px solid #000', margin: '12px 0' }} />
            <table style={{ width: '100%', fontSize: 12, lineHeight: 1.6 }}>
              <tbody>
                <tr>
                  <td style={{ width: '35%', fontWeight: 'bold' }}>Dapur Pengirim (SPPG)</td>
                  <td>: {bundle?.kitchenName || 'Dapur Sentral SPPG'} ({bundle?.kitchenCode || printed.sppgId})</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Sekolah Penerima</td>
                  <td>: {printed.schoolName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Batch Token</td>
                  <td>: <code style={{ fontFamily: 'monospace' }}>{printed.batchToken}</code></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Waktu Serah Terima</td>
                  <td>: {printed.bastAt} WIB</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Rincian Porsi</td>
                  <td>
                    : Terkirim: <b>{printed.sent}</b> | Terpindai: <b>{printed.scanned}</b> | <b>Porsi Sah: {printed.accepted}</b>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Stempel Kriptografis</td>
                  <td>: <code style={{ fontSize: 10, fontFamily: 'monospace' }}>{printed.bastHash || 'N/A'}</code></td>
                </tr>
              </tbody>
            </table>
            <br />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, textAlign: 'center', fontSize: 12 }}>
              <div style={{ width: '45%' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Kurir Penyerah SPPG,</p>
                <div style={{ height: 60 }} />
                <p style={{ margin: 0, textDecoration: 'underline', fontWeight: 'bold' }}>{printed.courierSign || '(........................)'}</p>
              </div>
              <div style={{ width: '45%' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Guru Penerima / Validator,</p>
                <div style={{ height: 60 }} />
                <p style={{ margin: 0, textDecoration: 'underline', fontWeight: 'bold' }}>{printed.teacherSign || '(........................)'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
