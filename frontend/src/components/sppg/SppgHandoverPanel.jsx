import { useState, useMemo, useEffect } from 'react'
import {
  ClipboardCheck,
  Printer,
  Camera,
  PenLine,
  PackageCheck,
} from 'lucide-react'
import { SPPG_PROFILE } from '../../data/sppgPortalData'
import { sha256Hex } from '../../data/sppgBatchesData'
import {
  STAGE_ORDER,
  SEED_HANDOVERS,
  SEED_SAFETY_STOCK,
  stageMeta,
  acceptedCount,
  buildBastNo,
} from '../../data/sppgHandoverData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

function StagePill({ stage }) {
  const meta = stageMeta(stage)
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export function SppgHandoverPanel() {
  const [handovers, setHandovers] = useState(SEED_HANDOVERS)
  const [stock, setStock] = useState(SEED_SAFETY_STOCK)
  const [bastSeq, setBastSeq] = useState(2)
  const [activeId, setActiveId] = useState('ho-02')
  const [rejectForm, setRejectForm] = useState({ boxes: '', reason: '' })
  const [rejectError, setRejectError] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [signForm, setSignForm] = useState({ courier: '', teacher: '' })
  const [signError, setSignError] = useState('')
  const [printBast, setPrintBast] = useState(null)

  // Stempel BAST bawaan dihitung sekali saat panel dibuka.
  useEffect(() => {
    let cancelled = false
    async function stamp() {
      const stamped = await Promise.all(
        SEED_HANDOVERS.map(async (h) => {
          if (!h.bastNo || h.bastHash) return h
          const hash = await sha256Hex(`${h.bastNo}#${h.batchToken}#${acceptedCount(h)}#${h.bastAt}`)
          return { ...h, bastHash: hash || 'TIDAK-TERSEDIA' }
        })
      )
      if (!cancelled) setHandovers(stamped)
    }
    stamp()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!printBast) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printBast])

  const active = handovers.find((h) => h.id === activeId) || handovers[0]

  const totals = useMemo(() => {
    const sent = handovers.reduce((s, h) => s + h.sent, 0)
    const accepted = handovers.reduce((s, h) => s + acceptedCount(h), 0)
    const issued = handovers.filter((h) => h.bastNo).length
    return { sent, accepted, issued, count: handovers.length }
  }, [handovers])

  function patch(id, fn) {
    setHandovers((list) => list.map((h) => (h.id === id ? fn(h) : h)))
  }

  function advance(id) {
    patch(id, (h) => {
      const idx = STAGE_ORDER.indexOf(h.stage)
      if (idx < 0 || idx >= STAGE_ORDER.length - 1) return h
      const next = STAGE_ORDER[idx + 1]
      return {
        ...h,
        stage: next,
        scanned: next === 'memindai' ? Math.min(h.sent, h.scanned + 100) : h.scanned,
      }
    })
  }

  function finishScan(id, perfect) {
    patch(id, (h) => ({
      ...h,
      stage: perfect ? 'lolos' : h.stage,
      scanned: h.sent,
    }))
  }

  function handleReject(e) {
    e.preventDefault()
    if (!active) return
    const boxes = parseInt(rejectForm.boxes, 10)
    const remaining = active.scanned - active.rejected.reduce((s, r) => s + r.boxes, 0)
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > remaining) {
      setRejectError(`Jumlah 1 sampai ${remaining} boks yang sudah dipindai.`)
      return
    }
    if (!rejectForm.reason.trim()) {
      setRejectError('Isi alasan penolakan guru.')
      return
    }
    patch(active.id, (h) => ({
      ...h,
      stage: 'hold',
      rejected: [
        ...h.rejected,
        {
          boxes,
          reason: rejectForm.reason.trim(),
          evidenceName: evidence ? evidence.name : 'tanpa foto',
        },
      ],
    }))
    setRejectForm({ boxes: '', reason: '' })
    setEvidence(null)
    setRejectError('')
  }

  function handleReplace(rejectIndex) {
    if (!active) return
    const item = active.rejected[rejectIndex]
    if (!item || item.boxes > stock) return
    setStock((s) => s - item.boxes)
    patch(active.id, (h) => ({
      ...h,
      sent: h.sent + item.boxes,
      scanned: h.scanned + item.boxes,
      rejected: h.rejected.filter((_, i) => i !== rejectIndex),
      stage: h.rejected.length <= 1 ? 'lolos' : 'hold',
    }))
  }

  async function handleSign(e) {
    e.preventDefault()
    if (!active) return
    if (!signForm.courier.trim() || !signForm.teacher.trim()) {
      setSignError('Isi nama kurir penyerah dan guru penerima.')
      return
    }
    if (active.stage !== 'lolos') {
      setSignError('BAST diterbitkan setelah status Lolos sempurna.')
      return
    }
    const bastNo = buildBastNo(bastSeq)
    const now = new Date()
    const bastAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const hash = (await sha256Hex(`${bastNo}#${active.batchToken}#${acceptedCount(active)}#${bastAt}`)) || 'TIDAK-TERSEDIA'
    patch(active.id, (h) => ({
      ...h,
      courierSign: signForm.courier.trim(),
      teacherSign: signForm.teacher.trim(),
      bastNo,
      bastAt,
      bastHash: hash,
    }))
    setBastSeq((n) => n + 1)
    setSignForm({ courier: '', teacher: '' })
    setSignError('')
  }

  const printed = handovers.find((h) => h.id === printBast) || null

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.bast-print-sheet{display:none}@media print{body *{visibility:hidden}.bast-print-sheet,.bast-print-sheet *{visibility:visible}.bast-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · SELASA, 29 SEPT 2026 · STOK CADANGAN {stock} BOKS
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Serah terima dan BAST digital
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Porsi sah mengikuti hasil pindai guru. BAST terbit setelah dua tanda tangan,
              dan unduhan memakai cetak PDF sistem.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">PORSI SAH / TERKIRIM</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {totals.accepted.toLocaleString('id-ID')}
              <span className="text-2xl text-white/50">/{totals.sent.toLocaleString('id-ID')}</span>
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {totals.issued} dari {totals.count} BAST terbit
            </p>
          </div>
        </div>
      </section>

      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · MONITOR VERIFIKASI</p>
          <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
            Status per sekolah
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
              <tr>
                <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                <th scope="col" className="px-3 py-2.5">Sekolah</th>
                <th scope="col" className="px-3 py-2.5 text-right">Terkirim</th>
                <th scope="col" className="px-3 py-2.5 text-right">Terpindai</th>
                <th scope="col" className="px-3 py-2.5 text-right">Porsi sah</th>
                <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                <th scope="col" className="px-4 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {handovers.map((h, i) => (
                <tr
                  key={h.id}
                  onClick={() => setActiveId(h.id)}
                  className={`cursor-pointer transition hover:bg-[#23259C]/[0.03] ${active && active.id === h.id ? 'bg-[#23259C]/[0.04]' : ''}`}
                >
                  <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-bold text-slate-800">{h.schoolName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{h.batchToken}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {h.sent.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {h.scanned.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-[#23259C]">
                    {acceptedCount(h).toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StagePill stage={h.stage} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      {STAGE_ORDER.includes(h.stage) && STAGE_ORDER.indexOf(h.stage) < STAGE_ORDER.length - 1 && (
                        <button
                          type="button"
                          onClick={() => advance(h.id)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]"
                        >
                          {h.stage === 'menunggu' ? 'Tandai tiba' : 'Maju'}
                        </button>
                      )}
                      {h.stage === 'memindai' && (
                        <button
                          type="button"
                          onClick={() => finishScan(h.id, true)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]"
                        >
                          Sahkan penuh
                        </button>
                      )}
                      {h.bastNo && (
                        <button
                          type="button"
                          onClick={() => setPrintBast(h.id)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]"
                        >
                          Unduh
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <div className="grid gap-5 xl:grid-cols-5">
          <div className={`space-y-4 p-5 text-xs xl:col-span-3 ${CARD}`}>
            <div className="pb-1">
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                SLIP 02 · PENOLAKAN DAN PENGGANTI
              </p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                {active.schoolName}
              </h2>
            </div>
            <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
            {active.rejected.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
                Belum ada penolakan. Jika guru menemukan kemasan rusak, catat di bawah beserta
                foto bukti. Tiap catatan mengurangi porsi sah dan menahan batch.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {active.rejected.map((r, idx) => (
                  <li key={idx} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <div>
                      <p className="font-bold tabular-nums text-slate-900">{r.boxes} boks ditolak</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {r.reason} · {r.evidenceName}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={r.boxes > stock}
                      onClick={() => handleReplace(idx)}
                      title={r.boxes > stock ? 'Stok cadangan tidak cukup' : 'Kirim pengganti dari stok cadangan'}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition active:scale-[0.97] ${FOCUS} ${
                        r.boxes > stock
                          ? 'cursor-not-allowed border-slate-200 text-slate-500'
                          : 'border-[#23259C]/30 bg-[#23259C]/10 text-[#23259C] hover:bg-[#23259C]/20'
                      }`}
                    >
                      {r.boxes > stock ? `Stok kurang (${stock})` : 'Kirim pengganti'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleReject} className="space-y-3 rounded-xl bg-slate-50/70 p-4">
              <p className="text-[11px] font-bold text-slate-700">Catat penolakan baru</p>
              {rejectError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                  {rejectError}
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-semibold text-slate-700">Boks ditolak</span>
                  <input
                    type="number"
                    min="1"
                    value={rejectForm.boxes}
                    onChange={(e) => {
                      setRejectForm((f) => ({ ...f, boxes: e.target.value }))
                      setRejectError('')
                    }}
                    placeholder="misal 5"
                    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-semibold text-slate-700">Foto bukti guru</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0]
                      setEvidence(file ? { name: file.name, url: URL.createObjectURL(file) } : null)
                    }}
                    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-700 ${FOCUS}`}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Alasan penolakan</span>
                <input
                  type="text"
                  value={rejectForm.reason}
                  onChange={(e) => {
                    setRejectForm((f) => ({ ...f, reason: e.target.value }))
                    setRejectError('')
                  }}
                  placeholder="Kemasan penyok, segel terbuka"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
                />
              </label>
              {evidence && (
                <div className="flex items-center gap-3">
                  <img src={evidence.url} alt={`Bukti ${evidence.name}`} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                  <p className="font-mono text-[11px] text-slate-600">{evidence.name}</p>
                </div>
              )}
              <button type="submit" className={BTN}>
                <Camera className="h-4 w-4" />
                Catat penolakan
              </button>
            </form>
          </div>

          <div className="space-y-5 xl:col-span-2">
            <form onSubmit={handleSign} className={`space-y-3 p-5 text-xs ${CARD}`}>
              <div className="pb-1">
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · DUA TANGAN</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                  <PenLine className="h-4 w-4 text-[#23259C]" />
                  Terbitkan BAST
                </h2>
              </div>
              <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
              {signError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                  {signError}
                </p>
              )}
              {active.bastNo ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900">
                  <p className="font-mono font-bold">{active.bastNo}</p>
                  <p className="mt-1">
                    {active.courierSign} dan {active.teacherSign} · {active.bastAt} WIB ·{' '}
                    {acceptedCount(active)} porsi sah.
                  </p>
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">Kurir penyerah</span>
                    <input
                      type="text"
                      value={signForm.courier}
                      onChange={(e) => {
                        setSignForm((f) => ({ ...f, courier: e.target.value }))
                        setSignError('')
                      }}
                      placeholder="Nama kurir"
                      className={INPUT}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-semibold text-slate-700">Guru penerima</span>
                    <input
                      type="text"
                      value={signForm.teacher}
                      onChange={(e) => {
                        setSignForm((f) => ({ ...f, teacher: e.target.value }))
                        setSignError('')
                      }}
                      placeholder="Nama guru validator"
                      className={INPUT}
                    />
                  </label>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                {!active.bastNo && (
                  <button type="submit" className={BTN}>
                    <ClipboardCheck className="h-4 w-4" />
                    Tanda tangani
                  </button>
                )}
                {active.bastNo && (
                  <button type="button" onClick={() => setPrintBast(active.id)} className={BTN}>
                    <Printer className="h-4 w-4" />
                    Unduh BAST
                  </button>
                )}
              </div>
            </form>

            <div className={`p-5 text-xs ${CARD}`}>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">REKONSILIASI PORSI</p>
              <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
              <dl className="space-y-2">
                {[
                  ['Terkirim', active.sent],
                  ['Terpindai', active.scanned],
                  ['Ditolak', active.rejected.reduce((s, r) => s + r.boxes, 0)],
                  ['Porsi sah', acceptedCount(active)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-mono text-[11px] font-bold tabular-nums text-slate-900">
                      {v.toLocaleString('id-ID')}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
                <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Porsi sah tidak pernah melebihi terkirim. Pengganti menambah keduanya bersamaan.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bast-print-sheet" aria-hidden="true">
        {printed && (
          <div style={{ color: '#000', background: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>BERITA ACARA SERAH TERIMA</p>
            <p style={{ fontSize: 12 }}>{printed.bastNo} · {SPPG_PROFILE.name}</p>
            <hr />
            <p style={{ fontSize: 13 }}>Sekolah: {printed.schoolName}</p>
            <p style={{ fontSize: 13 }}>Batch: {printed.batchToken}</p>
            <p style={{ fontSize: 13 }}>
              Terkirim {printed.sent} · Terpindai {printed.scanned} · Porsi sah {acceptedCount(printed)}
            </p>
            <p style={{ fontSize: 13 }}>Waktu: {printed.bastAt} WIB · SHA {(printed.bastHash || '').slice(0, 12).toUpperCase()}</p>
            <br />
            <p style={{ fontSize: 12 }}>Kurir penyerah: {printed.courierSign} (....................)</p>
            <p style={{ fontSize: 12 }}>Guru penerima: {printed.teacherSign} (....................)</p>
          </div>
        )}
      </div>

    </div>
  )
}
