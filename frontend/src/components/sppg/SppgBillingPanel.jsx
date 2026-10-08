import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Receipt,
  Plus,
  Printer,
  Paperclip,
  Landmark,
  CircleAlert,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronDown,
  X,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgBillingBundle,
  generateSppgInvoice,
  advanceSppgInvoiceStage,
  attachSppgInvoiceNotes,
  fetchSppgList,
} from '../../lib/api'
import {
  RATE_PER_PORTION,
  LATE_TOLERANCE_MINUTES,
  LATE_PENALTY_PCT,
  STAGE_ORDER,
  stageMeta,
  formatRp,
} from '../../data/sppgBillingData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'

export function SppgBillingPanel() {
  const { user, isSuperadmin } = useAuth()
  const [kitchens, setKitchens] = useState([])
  const [activeSppgId, setActiveSppgId] = useState(user?.sppgId || 'SPPG-01')

  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [activeInv, setActiveInv] = useState('')
  const [genError, setGenError] = useState('')
  const [submittingAction, setSubmittingAction] = useState('')
  const [printInv, setPrintInv] = useState(null)

  // 1. Muat daftar dapur untuk Superadmin switcher
  useEffect(() => {
    let mounted = true
    async function loadKitchens() {
      try {
        const list = await fetchSppgList()
        if (mounted && Array.isArray(list) && list.length > 0) {
          setKitchens(list)
        }
      } catch (err) {
        console.warn('Gagal memuat daftar dapur:', err)
      }
    }
    if (isSuperadmin) {
      loadKitchens()
    }
    return () => {
      mounted = false
    }
  }, [isSuperadmin])

  // Sinkronisasi dengan user profile
  useEffect(() => {
    if (user?.sppgId && !isSuperadmin) {
      setActiveSppgId(user.sppgId)
    }
  }, [user, isSuperadmin])

  // 2. Muat data bundle penagihan dari database
  const loadBillingData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const data = await fetchSppgBillingBundle(activeSppgId)
      if (data) {
        setBundle(data)
        // Pilih invoice pertama secara default jika belum ada yang dipilih
        if (data.invoices && data.invoices.length > 0) {
          setActiveInv((prev) => {
            const exists = data.invoices.some((i) => i.id === prev)
            return exists ? prev : data.invoices[0].id
          })
        } else {
          setActiveInv('')
        }
      }
    } catch (err) {
      console.error('Error load billing bundle:', err)
      setError(err.message || 'Gagal mengambil data penagihan dari server')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeSppgId])

  useEffect(() => {
    loadBillingData()
  }, [loadBillingData])

  const rows = useMemo(() => bundle?.rows || [], [bundle])
  const invoices = useMemo(() => bundle?.invoices || [], [bundle])
  const totals = useMemo(() => bundle?.totals || {
    gross: 0,
    penalty: 0,
    net: 0,
    disbursed: 0,
    totalRows: 0,
    freeRows: 0,
    invoiceCount: 0,
  }, [bundle])

  const invoice = useMemo(() => {
    return invoices.find((i) => i.id === activeInv) || invoices[0] || null
  }, [invoices, activeInv])

  const invoiceRowsList = useMemo(() => {
    if (!invoice) return []
    return rows.filter((r) => r.invoiceId === invoice.id)
  }, [rows, invoice])

  // 3. Aksi: Buat Invoice dari Baris Bebas
  async function handleGenerate(e) {
    e.preventDefault()
    setGenError('')
    const free = rows.filter((r) => !r.invoiceId)
    if (free.length === 0) {
      setGenError('Semua baris sudah masuk invoice. Tidak ada yang bisa dikelompokkan.')
      return
    }

    setSubmittingAction('generate')
    try {
      const newInv = await generateSppgInvoice({ period: '29 September 2026' }, activeSppgId)
      setNotice(`Invoice ${newInv?.invoiceNo || 'baru'} berhasil dibuat dari ${free.length} baris rekonsiliasi.`)
      await loadBillingData(true)
      if (newInv?.id) {
        setActiveInv(newInv.id)
      }
    } catch (err) {
      setGenError(err.message || 'Gagal membuat invoice baru')
    } finally {
      setSubmittingAction('')
    }
  }

  // 4. Aksi: Majukan Tahap Invoice (draft -> verifikasi -> spm -> sp2d)
  async function advanceInvoice(id) {
    if (!id) return
    setSubmittingAction('advance')
    try {
      const updated = await advanceSppgInvoiceStage(id, {}, activeSppgId)
      setNotice(`Tahap invoice ${updated.invoiceNo} berhasil dimajukan ke ${stageMeta(updated.stage).label}.`)
      await loadBillingData(true)
    } catch (err) {
      setError(err.message || 'Gagal memajukan status invoice')
    } finally {
      setSubmittingAction('')
    }
  }

  // 5. Aksi: Lampirkan Nota Belanja Bahan Baku
  async function handleNotes(id, fileList) {
    if (!fileList || fileList.length === 0) return
    const names = Array.from(fileList).map((f) => f.name)
    setSubmittingAction('notes')
    try {
      const updated = await attachSppgInvoiceNotes(id, names, activeSppgId)
      setNotice(`${names.length} nota belanja berhasil dilampirkan ke invoice ${updated.invoiceNo}.`)
      await loadBillingData(true)
    } catch (err) {
      setError(err.message || 'Gagal melampirkan nota belanja')
    } finally {
      setSubmittingAction('')
    }
  }

  const printed = useMemo(() => {
    return invoices.find((i) => i.id === printInv) || null
  }, [invoices, printInv])

  const printedRows = useMemo(() => {
    if (!printed) return []
    return rows.filter((r) => r.invoiceId === printed.id)
  }, [rows, printed])

  const ratePerPortion = bundle?.ratePerPortion || RATE_PER_PORTION
  const lateToleranceMinutes = bundle?.lateToleranceMinutes || LATE_TOLERANCE_MINUTES
  const latePenaltyPct = bundle?.latePenaltyPct || LATE_PENALTY_PCT

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.inv-print-sheet{display:none}@media print{body *{visibility:hidden}.inv-print-sheet,.inv-print-sheet *{visibility:visible}.inv-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      {/* SUPERADMIN KITCHEN SWITCHER */}
      {isSuperadmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#23259C] text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-indigo-900 uppercase">
                  Inspeksi Superadmin
                </span>
                <span className="rounded-full bg-indigo-200/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-900">
                  Akses Multi-Dapur
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Pilih dapur SPPG untuk memverifikasi tagihan, potongan denda, dan otorisasi SP2D BGN.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="kitchen-select" className="sr-only">
              Pilih Dapur SPPG
            </label>
            <div className="relative">
              <select
                id="kitchen-select"
                value={activeSppgId}
                onChange={(e) => setActiveSppgId(e.target.value)}
                className={`appearance-none rounded-xl border border-indigo-200 bg-white py-2 pr-9 pl-3 text-xs font-bold text-indigo-950 shadow-sm transition hover:border-indigo-400 focus:border-[#23259C] ${FOCUS}`}
              >
                {kitchens.length > 0 ? (
                  kitchens.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.id})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="SPPG-01">SPPG Sentral Menteng 01 (SPPG-01)</option>
                    <option value="SPPG-02">SPPG Kebayoran Baru Mandiri (SPPG-02)</option>
                    <option value="SPPG-03">SPPG Tebet Harmoni Sejahtera (SPPG-03)</option>
                  </>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-indigo-500" />
            </div>

            <button
              type="button"
              onClick={() => loadBillingData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50"
              title="Segarkan data dari database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#23259C]' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>
      )}

      {/* NOTIFIKASI SUKSES / ERROR */}
      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="rounded p-1 text-rose-700 hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HERO SECTION BANNER */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.16em] text-amber-300 uppercase">
                {bundle?.kitchenName || activeSppgId}
              </span>
              <span className="text-[11px] font-bold tracking-[0.14em] text-amber-300/80">
                TARIF {formatRp(ratePerPortion)}/PORSI · TOLERANSI TELAT {lateToleranceMinutes} MNT
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Klaim dan penagihan invoice
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Porsi sah dikali tarif kontrak BGN. Keterlambatan distribusi di atas {lateToleranceMinutes} menit
              memotong {latePenaltyPct}% nilai barisnya sesuai SPPG.md Bab 9.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">TAGIHAN BERSIH</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
              {formatRp(totals.net)}
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              Kotor {formatRp(totals.gross)} · Penalti {formatRp(totals.penalty)} · Cair {formatRp(totals.disbursed)}
            </p>
          </div>
        </div>
      </section>

      {/* LOADING STATE */}
      {loading && !bundle && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-[#23259C]" />
          <p className="mt-3 text-xs font-semibold text-slate-700">Memuat kalkulasi tagihan dan data invoice...</p>
        </div>
      )}

      {/* SLIP 01: REKONSILIASI PER SEKOLAH */}
      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · PORSI SAH VS TAGIHAN</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Rekonsiliasi per sekolah ({rows.length} baris)
            </h2>
          </div>
          <form onSubmit={handleGenerate} className="flex items-center gap-2">
            {genError && (
              <p role="alert" className="text-[11px] font-medium text-rose-700">
                {genError}
              </p>
            )}
            <button
              type="submit"
              disabled={submittingAction === 'generate'}
              className={`${BTN} ${totals.freeRows === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submittingAction === 'generate' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Buat invoice dari baris bebas {totals.freeRows > 0 ? `(${totals.freeRows})` : ''}
            </button>
          </form>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className={THEAD}>
              <tr>
                <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                <th scope="col" className="px-3 py-2.5">Sekolah</th>
                <th scope="col" className="px-3 py-2.5 text-right">Porsi sah</th>
                <th scope="col" className="px-3 py-2.5 text-right">Telat</th>
                <th scope="col" className="px-3 py-2.5 text-right">Kotor</th>
                <th scope="col" className="px-3 py-2.5 text-right">Penalti ({latePenaltyPct}%)</th>
                <th scope="col" className="px-3 py-2.5 text-right">Bersih</th>
                <th scope="col" className="px-4 py-2.5 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada baris rekonsiliasi porsi yang tercatat di database dapur ini.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="transition hover:bg-[#23259C]/[0.03]">
                    <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-800">{r.schoolName}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {r.bastNo || 'BAST belum terbit'} · {r.batchToken}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {(r.validPortions || r.valid || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {r.lateMinutes}
                      <span className="font-normal text-slate-500"> mnt</span>
                      {r.lateMinutes > lateToleranceMinutes && (
                        <span className="block text-[11px] font-semibold text-rose-700">
                          Lewat toleransi
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {formatRp(r.grossAmount || 0)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-rose-700">
                      {r.penaltyAmount > 0 ? `-${formatRp(r.penaltyAmount)}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-[#23259C]">
                      {formatRp(r.netAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-[11px] font-semibold text-slate-600">
                      {r.invoiceId ? (
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          {r.invoiceNo || invoices.find((x) => x.id === r.invoiceId)?.invoiceNo || r.invoiceId}
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          Bebas
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIP 02 & SLIP 03: DAFTAR INVOICE & DETAIL PROSES */}
      <div className="grid gap-5 xl:grid-cols-5">
        {/* SLIP 02: DAFTAR INVOICE */}
        <div className={`p-5 text-xs xl:col-span-2 ${CARD}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · BERKAS TAGIHAN</p>
              <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                <Receipt className="h-4 w-4 text-[#23259C]" />
                Daftar invoice ({invoices.length})
              </h2>
            </div>
            {refreshing && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>
          <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
          
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              Belum ada invoice yang terbit. Klik &quot;Buat invoice dari baris bebas&quot; di atas untuk menerbitkan draf baru.
            </p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => {
                const isActive = invoice && invoice.id === inv.id
                return (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => setActiveInv(inv.id)}
                      aria-current={isActive}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${FOCUS} ${
                        isActive
                          ? 'border-[#23259C]/40 bg-[#23259C]/[0.05]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-[11px] font-bold text-slate-900">
                          {inv.invoiceNo || inv.no}
                        </p>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${stageMeta(inv.stage).tone}`}>
                          {stageMeta(inv.stage).label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {inv.periodLabel || inv.period} · {inv.rowCount || 0} baris · {formatRp(inv.netAmount || 0)}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto py-1" aria-label="Alur pencairan">
            {STAGE_ORDER.map((s, i) => {
              const currentIdx = invoice ? STAGE_ORDER.indexOf(invoice.stage) : -1
              const isPassedOrCurrent = currentIdx >= i
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${
                      isPassedOrCurrent
                        ? 'bg-[#23259C] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {stageMeta(s).label}
                  </span>
                  {i < STAGE_ORDER.length - 1 && <span aria-hidden="true" className="text-slate-300">·</span>}
                </span>
              )
            })}
          </div>
        </div>

        {/* SLIP 03: DETAIL INVOICE AKTIF */}
        {invoice ? (
          <div className={`space-y-4 p-5 text-xs xl:col-span-3 ${CARD}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">
                  SLIP 03 · {invoice.invoiceNo || invoice.no}
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                  <Landmark className="h-4 w-4 text-[#23259C]" />
                  {formatRp(invoice.netAmount || 0)} · {stageMeta(invoice.stage).label}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {STAGE_ORDER.indexOf(invoice.stage) < STAGE_ORDER.length - 1 && (
                  <button
                    type="button"
                    onClick={() => advanceInvoice(invoice.id)}
                    disabled={submittingAction === 'advance'}
                    className={BTN}
                  >
                    {submittingAction === 'advance' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="h-4 w-4" />
                    )}
                    Maju ke {stageMeta(STAGE_ORDER[STAGE_ORDER.indexOf(invoice.stage) + 1]).label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPrintInv(invoice.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] ${FOCUS}`}
                >
                  <Printer className="h-4 w-4" />
                  {invoice.stage === 'sp2d' ? 'Unduh SP2D' : 'Unduh draf'}
                </button>
              </div>
            </div>

            <div aria-hidden="true" className="border-t border-dashed border-slate-300" />

            {/* RINCIAN SP2D JIKA CAIR */}
            {invoice.stage === 'sp2d' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                    Nomor Otorisasi SP2D
                  </span>
                  <p className="font-mono text-xs font-bold text-emerald-950 mt-0.5">
                    {invoice.sp2dNumber || 'SP2D/KPPN/2026/9912'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                    Bukti Potong Pajak (BPN)
                  </span>
                  <p className="font-mono text-xs font-bold text-emerald-950 mt-0.5">
                    {invoice.taxSlip || 'BPN-PAJAK-2026-0929'}
                  </p>
                </div>
              </div>
            )}

            {/* LAMPIRAN NOTA BELANJA */}
            <div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-700">
                  Lampirkan nota belanja bahan baku
                </span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleNotes(invoice.id, e.target.files)}
                  className="sr-only"
                />
              </label>

              {(!invoice.notes || invoice.notes.length === 0) ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  Belum ada nota. Klik boks di atas untuk melampirkan file dari perangkat Anda.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-1.5">
                  {invoice.notes.map((n) => (
                    <li
                      key={n}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] text-slate-700 shadow-xs"
                    >
                      <span className="truncate">{n}</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                Berkas nota tersimpan permanen di database sebagai bukti transaksi akuntabilitas BGN & BPK.
              </p>
            </div>

            {/* STATUS ALERT */}
            {invoice.stage !== 'sp2d' ? (
              <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Bukti potong pajak dan salinan SP2D terbit setelah status mencapai SP2D cair.
                Tombol unduh di atas mencetak draf untuk arsip sementara.
              </p>
            ) : (
              <p className="flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Dana resmi cair ke rekening dapur SPPG. Tombol unduh mencetak salinan resmi SP2D beserta rincian potongan pajak.
              </p>
            )}
          </div>
        ) : (
          <div className={`p-8 text-center text-xs text-slate-500 xl:col-span-3 ${CARD}`}>
            Pilih atau buat invoice untuk melihat rincian proses pencairan.
          </div>
        )}
      </div>

      {/* MODAL PRINT PREVIEW / UNDUH SLIP */}
      {printed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pratinjau Dokumen Cetak
                </p>
                <h3 className="text-base font-extrabold text-slate-900">
                  {printed.stage === 'sp2d' ? 'SALINAN RESMI SP2D CAIR' : 'DRAF INVOICE TAGIHAN MBG'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintInv(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-sans text-xs text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <p className="font-bold text-slate-900">{bundle?.kitchenName || activeSppgId}</p>
                  <p className="text-[11px] text-slate-500">Periode: {printed.periodLabel || printed.period}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-indigo-900">{printed.invoiceNo || printed.no}</p>
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${stageMeta(printed.stage).tone}`}>
                    {stageMeta(printed.stage).label}
                  </span>
                </div>
              </div>

              {printed.stage === 'sp2d' && (
                <div className="rounded-lg bg-emerald-100/50 p-2.5 text-[11px] text-emerald-950 font-mono">
                  <p>No. SP2D : {printed.sp2dNumber || 'SP2D/KPPN/2026/9912'}</p>
                  <p>Bukti Pajak: {printed.taxSlip || 'BPN-PAJAK-2026-0929'}</p>
                </div>
              )}

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {printedRows.map((r) => (
                  <div key={r.id} className="flex justify-between items-center border-b border-slate-100 py-1 text-[11px]">
                    <div>
                      <p className="font-semibold text-slate-900">{r.schoolName}</p>
                      <p className="text-[10px] text-slate-500">
                        {r.validPortions} porsi x {formatRp(ratePerPortion)}
                        {r.penaltyAmount > 0 && ` (Denda -${formatRp(r.penaltyAmount)})`}
                      </p>
                    </div>
                    <p className="font-mono font-bold text-slate-800">
                      {formatRp(r.netAmount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-300 pt-2 text-xs font-extrabold text-slate-900">
                <span>Total Bersih Tagihan:</span>
                <span className="text-base text-[#23259C]">{formatRp(printed.netAmount || 0)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintInv(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print()
                }}
                className={BTN}
              >
                <Printer className="h-4 w-4" />
                Cetak Dokumen Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT SHEET UNTUK CETAK FISIK (A5) */}
      <div className="inv-print-sheet" aria-hidden="true">
        {printed && (
          <div style={{ color: '#000', background: '#fff', padding: 20, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>
              {printed.stage === 'sp2d' ? 'SALINAN RESMI SP2D BGN' : 'DRAF INVOICE TAGIHAN SPPG'} · {printed.invoiceNo || printed.no}
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              {bundle?.kitchenName || activeSppgId} · {printed.periodLabel || printed.period}
            </p>
            {printed.stage === 'sp2d' && (
              <p style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                No. SP2D: {printed.sp2dNumber} | Bukti Potong Pajak: {printed.taxSlip}
              </p>
            )}
            <hr style={{ margin: '12px 0' }} />
            {printedRows.map((r) => (
              <p key={r.id} style={{ fontSize: 12, margin: '6px 0' }}>
                {r.schoolName}: {r.validPortions} porsi x {formatRp(ratePerPortion)} = {formatRp(r.grossAmount)}
                {r.penaltyAmount > 0 ? `, penalti telat -${formatRp(r.penaltyAmount)}` : ''} = {formatRp(r.netAmount)}
              </p>
            ))}
            <hr style={{ margin: '12px 0' }} />
            <p style={{ fontSize: 14, fontWeight: 800 }}>
              Total bersih dibayarkan: {formatRp(printed.netAmount || 0)}
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Status: {stageMeta(printed.stage).label}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
