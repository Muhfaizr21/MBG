import { useState, useMemo, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Printer,
  Plus,
  X,
  Check,
  Search,
  Thermometer,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { ASSIGNED_SCHOOLS_MANIFEST, SPPG_PROFILE } from '../../data/sppgPortalData'
import { NATIONAL_MENU_PACKAGES } from '../../data/sppgRecipesData'
import {
  SAFE_WINDOW_MINUTES,
  TOTE_CAPACITY,
  SCHOOL_CODES,
  BATCH_STATUSES,
  SEED_BATCHES,
  buildBoxToken,
  buildMasterToken,
  totesFor,
  canonicalPayload,
  sha256Hex,
  addMinutesToClock,
} from '../../data/sppgBatchesData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'

function shortHash(hash) {
  return hash ? hash.slice(0, 12).toUpperCase() : 'MENGHITUNG'
}

function StatusPill({ status }) {
  const meta = BATCH_STATUSES[status] || BATCH_STATUSES.draft
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export function SppgBatchesPanel() {
  const [batches, setBatches] = useState(SEED_BATCHES)
  const [hashReady, setHashReady] = useState(false)
  const [form, setForm] = useState({
    schoolId: 'sch-02',
    menuId: 'paket-a',
    boxCount: '',
    cookedAt: '06:00',
    cookTemp: '78.5',
  })
  const [formError, setFormError] = useState('')
  const [formOk, setFormOk] = useState('')
  const [queue, setQueue] = useState(['batch-20260929-02'])
  const [previewId, setPreviewId] = useState(null)
  const [printTargets, setPrintTargets] = useState([])
  const [toteBatchId, setToteBatchId] = useState('batch-20260929-01')
  const [checkToken, setCheckToken] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [copiedToken, setCopiedToken] = useState('')

  // Stempel checksum batch bawaan dihitung sekali saat panel dibuka.
  useEffect(() => {
    let cancelled = false
    async function stamp() {
      const stamped = await Promise.all(
        SEED_BATCHES.map(async (b) => ({
          ...b,
          checksum: b.checksum || (await sha256Hex(canonicalPayload(b))) || 'TIDAK-TERSEDIA',
        }))
      )
      if (!cancelled) {
        setBatches(stamped)
        setHashReady(true)
      }
    }
    stamp()
    return () => {
      cancelled = true
    }
  }, [])

  // Dialog label tertutup dengan Escape.
  useEffect(() => {
    if (!previewId) return
    const onKey = (e) => {
      if (e.key === 'Escape') setPreviewId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewId])

  // Mencetak berarti membuka dialog cetak sistem. Staf memilih printer
  // Bluetooth atau WiFi dapur dari dialog itu.
  useEffect(() => {
    if (printTargets.length === 0) return
    const t = setTimeout(() => window.print(), 150)
    return () => clearTimeout(t)
  }, [printTargets])

  const schoolById = useMemo(() => {
    const map = {}
    ASSIGNED_SCHOOLS_MANIFEST.forEach((s) => {
      map[s.id] = s
    })
    return map
  }, [])

  const menuById = useMemo(() => {
    const map = {}
    NATIONAL_MENU_PACKAGES.forEach((m) => {
      map[m.id] = m
    })
    return map
  }, [])

  const totals = useMemo(() => {
    const boxes = batches.reduce((sum, b) => sum + b.boxCount, 0)
    const totes = batches.reduce((sum, b) => sum + totesFor(b.boxCount).length, 0)
    return {
      boxes,
      totes,
      queued: queue.length,
      verified: batches.filter((b) => b.verified).length,
      count: batches.length,
    }
  }, [batches, queue])

  const previewBatch = batches.find((b) => b.id === previewId) || null
  const toteBatch = batches.find((b) => b.id === toteBatchId) || batches[0] || null
  const printBatches = printTargets
    .map((id) => batches.find((b) => b.id === id))
    .filter(Boolean)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setFormError('')
    setFormOk('')
  }

  async function handleGenerate(e) {
    e.preventDefault()
    const school = schoolById[form.schoolId]
    const menu = menuById[form.menuId]
    const boxCount = parseInt(form.boxCount, 10)
    const cookTemp = parseFloat(form.cookTemp)
    if (!school || !menu) {
      setFormError('Pilih sekolah sasaran dan paket menu.')
      return
    }
    if (!Number.isInteger(boxCount) || boxCount < 1 || boxCount > 2500) {
      setFormError('Jumlah boks diisi 1 sampai 2500.')
      return
    }
    if (!form.cookedAt) {
      setFormError('Isi jam selesai masak.')
      return
    }
    if (Number.isNaN(cookTemp) || cookTemp < 70 || cookTemp > 100) {
      setFormError('Suhu masak inti diisi 70 sampai 100 derajat.')
      return
    }
    const schoolCode = SCHOOL_CODES[form.schoolId] || 'SCHXX'
    const seq = batches.filter((b) => b.schoolId === form.schoolId).length + 1
    const batch = {
      id: `batch-${Date.now()}`,
      seq,
      token: buildBoxToken(schoolCode, seq),
      schoolId: form.schoolId,
      schoolCode,
      schoolName: school.name,
      menuCode: menu.code,
      menuName: menu.name,
      boxCount,
      cookedAt: form.cookedAt,
      consumeBy: addMinutesToClock(form.cookedAt, SAFE_WINDOW_MINUTES),
      cookTemp,
      allergens: menu.allergens || [],
      status: 'draft',
      verified: false,
      checksum: '',
    }
    batch.checksum = (await sha256Hex(canonicalPayload(batch))) || 'TIDAK-TERSEDIA'
    setBatches((list) => [batch, ...list])
    setToteBatchId(batch.id)
    setForm((f) => ({ ...f, boxCount: '' }))
    setFormOk(`Batch ${batch.token} terbentuk, ${boxCount} boks dalam ${totesFor(boxCount).length} kontainer.`)
  }

  function toggleQueue(id) {
    setQueue((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]))
  }

  function removeBatch(id) {
    setBatches((list) => list.filter((b) => b.id !== id))
    setQueue((q) => q.filter((x) => x !== id))
    if (previewId === id) setPreviewId(null)
  }

  async function handleSelfCheck(e) {
    e.preventDefault()
    const token = checkToken.trim().toUpperCase()
    if (!token) {
      setCheckResult({ ok: false, message: 'Tempel atau ketik token QR, lalu tekan Verifikasi.' })
      return
    }
    const batch = batches.find(
      (b) =>
        b.token === token ||
        totesFor(b.boxCount).some((t) => buildMasterToken(b.schoolCode, b.seq, t.index) === token)
    )
    if (!batch) {
      setCheckResult({ ok: false, message: `Token ${token} tidak terdaftar di sesi dapur hari ini.` })
      return
    }
    const recomputed = await sha256Hex(canonicalPayload(batch))
    if (recomputed && recomputed === batch.checksum) {
      setBatches((list) => list.map((b) => (b.id === batch.id ? { ...b, verified: true } : b)))
      setCheckResult({
        ok: true,
        message: `Token cocok dan checksum valid. ${batch.token}, ${batch.schoolName}, ${batch.boxCount} boks.`,
      })
    } else {
      setCheckResult({
        ok: false,
        message: `Token terdaftar tetapi checksum ${batch.token} tidak cocok. Tahan batch ini.`,
      })
    }
  }

  return (
    <div className="space-y-5">
      <style>{`@page{size:80mm auto;margin:3mm}.batch-print-sheet{display:none}@media print{body *{visibility:hidden}.batch-print-sheet,.batch-print-sheet *{visibility:visible}.batch-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              {SPPG_PROFILE.code} · SELASA, 29 SEPT 2026 · SHIFT 03.30-07.30
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Batch dan label QR
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Setiap boks mendapat token berformat sistem dan checksum SHA-256 yang dihitung di
              browser. Lima puluh boks dihimpun dalam satu kontainer master sebelum naik armada.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">
              BOKS BERTOKEN / TARGET 2.500
            </p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {totals.boxes.toLocaleString('id-ID')}
            </p>
            <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-white/15 lg:ml-auto">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${Math.min(100, (totals.boxes / 2500) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {totals.totes} kontainer · {totals.queued} antre cetak · {totals.verified} dari{' '}
              {totals.count} batch lolos uji mandiri
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-5">
        <form
          onSubmit={handleGenerate}
          className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5 text-xs shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)] xl:col-span-2"
        >
          <div className="pb-1">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">
              SLIP 01 · BATCH BARU
            </p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Generate QR batch baru
            </h2>
          </div>
          <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
          {formError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
              {formError}
            </p>
          )}
          {formOk && (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              {formOk}
            </p>
          )}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Sekolah sasaran</span>
              <select
                value={form.schoolId}
                onChange={set('schoolId')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 ${FOCUS}`}
              >
                {ASSIGNED_SCHOOLS_MANIFEST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.quota} porsi)
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Paket menu</span>
              <select
                value={form.menuId}
                onChange={set('menuId')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 ${FOCUS}`}
              >
                {NATIONAL_MENU_PACKAGES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Boks lolos uji masak</span>
              <input
                type="number"
                min="1"
                max="2500"
                value={form.boxCount}
                onChange={set('boxCount')}
                placeholder="misal 550"
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Jam selesai masak</span>
              <input
                type="time"
                value={form.cookedAt}
                onChange={set('cookedAt')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Suhu inti masak (C)</span>
              <input
                type="number"
                step="0.1"
                min="70"
                max="100"
                value={form.cookTemp}
                onChange={set('cookTemp')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
              Batas aman konsumsi dihitung otomatis 4 jam setelah masak selesai. Alergen diambil
              dari data resep paket terpilih.
            </div>
          </div>
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`}
          >
            <Plus className="h-4 w-4" />
            Generate batch
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)] xl:col-span-3">
          <div className="pb-1">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">
              SLIP 02 · PRINTER THERMAL 80 MM
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                Antrean cetak label
              </h2>
            <button
              type="button"
              disabled={queue.length === 0}
              onClick={() => setPrintTargets(queue)}
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1b1d7d] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${FOCUS}`}
            >
              <Printer className="h-4 w-4" />
              Cetak {queue.length} batch
            </button>
            </div>
          </div>
          <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
          {queue.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-slate-500">
              Antrean kosong. Centang batch di tabel atau pratinjau label untuk mengisi antrean.
              Tombol cetak membuka dialog cetak sistem, pilih printer dapur di sana.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.map((id) => {
                const b = batches.find((x) => x.id === id)
                if (!b) return null
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-mono text-[11px] font-bold text-slate-900">{b.token}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {b.schoolName} · {b.boxCount} boks · {totesFor(b.boxCount).length} tote
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewId(id)}
                        className={`rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
                      >
                        Pratinjau
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleQueue(id)}
                        className={`rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
                      >
                        Keluarkan
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]">
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">
            SLIP 03 · REGISTRY SESI HARI INI
          </p>
          <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
            Daftar batch
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        {batches.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-slate-500">
            Belum ada batch. Isi form generate di atas untuk membuat batch pertama.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                <tr>
                  <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                  <th scope="col" className="px-3 py-2.5">Token batch</th>
                  <th scope="col" className="px-3 py-2.5">Sekolah</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Boks</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Tote</th>
                  <th scope="col" className="px-3 py-2.5">Masak / batas</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Uji mandiri</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b, i) => (
                  <tr key={b.id} className="transition hover:bg-[#23259C]/[0.03]">
                    <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-[11px] font-bold text-slate-900">{b.token}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        SHA {shortHash(b.checksum)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">{b.schoolName}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{b.menuCode}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      {b.boxCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      {totesFor(b.boxCount).length}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                      {b.cookedAt} / {b.consumeBy} WIB
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {b.verified ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <Check className="h-3 w-3" /> Lolos
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Belum</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewId(b.id)}
                          className={`rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 ${FOCUS}`}
                        >
                          Label
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleQueue(b.id)}
                          aria-pressed={queue.includes(b.id)}
                          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${FOCUS} ${
                            queue.includes(b.id)
                              ? 'border-[#23259C]/30 bg-[#23259C]/10 text-[#23259C]'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {queue.includes(b.id) ? 'Di antrean' : 'Antrekan'}
                        </button>
                        {b.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => removeBatch(b.id)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 ${FOCUS}`}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)] xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                SLIP 04 · 50 BOKS PER TOTE
              </p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                Kontainer master
              </h2>
            </div>
            <select
              value={toteBatch ? toteBatch.id : ''}
              onChange={(e) => setToteBatchId(e.target.value)}
              aria-label="Pilih batch untuk melihat kontainer"
              className={`rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 ${FOCUS}`}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.token}
                </option>
              ))}
            </select>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          {!toteBatch ? (
            <p className="px-5 py-6 text-center text-[11px] text-slate-500">Belum ada batch.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-2.5">Tote</th>
                    <th scope="col" className="px-3 py-2.5">Token master</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Isi</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                    <th scope="col" className="px-3 py-2.5 text-center">QR</th>
                    <th scope="col" className="px-5 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {totesFor(toteBatch.boxCount).map((t) => {
                    const master = buildMasterToken(toteBatch.schoolCode, toteBatch.seq, t.index)
                    const full = t.boxes === TOTE_CAPACITY
                    return (
                      <tr key={t.index} className="transition hover:bg-[#23259C]/[0.03]">
                        <td className="px-5 py-2.5 font-mono text-[11px] font-bold tabular-nums text-slate-900">
                          M{String(t.index).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-slate-900">
                          {master}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {t.boxes}
                          <span className="font-normal text-slate-500">/{TOTE_CAPACITY}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                              full ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                            }`}
                          >
                            {full ? 'Penuh' : 'Parsial'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-center">
                            <QRCodeSVG
                              value={master}
                              size={48}
                              level="M"
                              role="img"
                              aria-label={`QR kontainer ${t.index} batch ${toteBatch.token}`}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(master)
                                setCopiedToken(master)
                              } catch {
                                setCopiedToken('')
                              }
                            }}
                            className={`rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] ${FOCUS}`}
                          >
                            {copiedToken === master ? 'Disalin' : 'Salin'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSelfCheck}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)] xl:col-span-2"
        >
          <div className="pb-1">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">
              SLIP 05 · GATE TERAKHIR
            </p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Uji mandiri sebelum naik armada
            </h2>
          </div>
          <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
          <p className="text-[11px] leading-relaxed text-slate-500">
            Pindai dengan scanner dapur atau ketik token. Sistem memeriksa token terdaftar dan
            menghitung ulang checksumnya. Batch yang lolos ditandai otomatis.
          </p>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Token QR boks atau master</span>
            <input
              type="text"
              value={checkToken}
              onChange={(e) => {
                setCheckToken(e.target.value)
                setCheckResult(null)
              }}
              placeholder="MBG-2026-SPPG01-..."
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
            />
          </label>
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`}
          >
            <Search className="h-4 w-4" />
            Verifikasi token
          </button>
          {checkResult && (
            <p
              role={checkResult.ok ? 'status' : 'alert'}
              className={`rounded-lg border px-3 py-2 text-[11px] font-medium ${
                checkResult.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {checkResult.message}
            </p>
          )}
          {!hashReady && (
            <p className="text-[11px] text-slate-500">Menghitung checksum batch, tunggu sebentar.</p>
          )}
        </form>
      </div>

      {previewBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau label ${previewBatch.token}`}
            className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-1">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">
                  HASIL CETAK · LEBAR 80 MM
                </p>
                <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                  Pratinjau label termal
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                aria-label="Tutup pratinjau"
                className={`rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 ${FOCUS}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="mx-auto w-[76mm] border border-dashed border-slate-300 bg-white p-3 text-center text-black">
                <p className="text-[11px] font-bold tracking-wide">BGN · KAWANGIZI</p>
                <p className="text-[11px]">{SPPG_PROFILE.code} · {SPPG_PROFILE.name}</p>
                <div className="my-2 flex justify-center">
                  <QRCodeSVG value={previewBatch.token} size={160} level="H" role="img" aria-label={`QR ${previewBatch.token}`} />
                </div>
                <p className="font-mono text-[11px] font-bold">{previewBatch.token}</p>
                <p className="mt-1 text-[12px] font-bold">{previewBatch.schoolName}</p>
                <p className="text-[11px]">{previewBatch.menuName}</p>
                <p className="mt-1.5 text-[13px] font-bold">
                  Masak {previewBatch.cookedAt} · Habis {previewBatch.consumeBy} WIB
                </p>
                <p className="text-[11px]">
                  Suhu {previewBatch.cookTemp}C · Alergen:{' '}
                  {previewBatch.allergens.length > 0 ? previewBatch.allergens.join(', ') : 'tidak ada'}
                </p>
                <p className="mt-1 font-mono text-[11px]">SHA {shortHash(previewBatch.checksum)}</p>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p className="flex items-start gap-1.5">
                  <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  Suhu inti {previewBatch.cookTemp}C dicatat dari probe dapur saat batch dikunci.
                </p>
                <p className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  Batas konsumsi {previewBatch.consumeBy} WIB, 4 jam setelah masak selesai.
                </p>
                <p className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  Alergen tercetak di setiap label supaya guru validator memeriksanya.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!queue.includes(previewBatch.id)) toggleQueue(previewBatch.id)
                      setPrintTargets([previewBatch.id])
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1b1d7d] ${FOCUS}`}
                  >
                    <Printer className="h-4 w-4" />
                    Cetak label ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewId(null)}
                    className={`rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="batch-print-sheet" aria-hidden="true">
        {printBatches.map((b) => (
          <div
            key={b.id}
            style={{ width: '76mm', pageBreakAfter: 'always', color: '#000', background: '#fff', textAlign: 'center', padding: '8px 4px' }}
          >
            <p style={{ fontSize: 11, fontWeight: 700 }}>BGN · KAWANGIZI</p>
            <p style={{ fontSize: 10 }}>{SPPG_PROFILE.code} · {SPPG_PROFILE.name}</p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
              <QRCodeSVG value={b.token} size={200} level="H" />
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{b.token}</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{b.schoolName}</p>
            <p style={{ fontSize: 11 }}>{b.menuName}</p>
            <p style={{ fontSize: 14, fontWeight: 700 }}>
              Masak {b.cookedAt} · Habis {b.consumeBy} WIB
            </p>
            <p style={{ fontSize: 10 }}>
              Suhu {b.cookTemp}C · Alergen: {b.allergens.length > 0 ? b.allergens.join(', ') : 'tidak ada'}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 9 }}>SHA {shortHash(b.checksum)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
