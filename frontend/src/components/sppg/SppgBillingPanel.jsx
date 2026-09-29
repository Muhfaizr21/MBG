import { useState, useMemo } from 'react'
import {
  Receipt,
  Plus,
  Printer,
  Paperclip,
  Landmark,
  CircleAlert,
} from 'lucide-react'
import {
  RATE_PER_PORTION,
  LATE_TOLERANCE_MINUTES,
  LATE_PENALTY_PCT,
  STAGE_ORDER,
  SEED_BILL_ROWS,
  SEED_INVOICES,
  stageMeta,
  formatRp,
  penaltyFor,
  rowGross,
  rowNet,
  buildInvoiceNo,
} from '../../data/sppgBillingData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'

export function SppgBillingPanel() {
  const [rows, setRows] = useState(SEED_BILL_ROWS)
  const [invoices, setInvoices] = useState(SEED_INVOICES)
  const [invSeq, setInvSeq] = useState(2)
  const [activeInv, setActiveInv] = useState('inv-01')
  const [genError, setGenError] = useState('')
  const [printInv, setPrintInv] = useState(null)

  const invoice = invoices.find((i) => i.id === activeInv) || invoices[0]

  const totals = useMemo(() => {
    const gross = rows.reduce((s, r) => s + rowGross(r), 0)
    const penalty = rows.reduce((s, r) => s + penaltyFor(r), 0)
    const disbursed = invoices
      .filter((i) => i.stage === 'sp2d')
      .reduce((s, i) => s + rows.filter((r) => r.invoiceId === i.id).reduce((a, r) => a + rowNet(r), 0), 0)
    return { gross, penalty, net: gross - penalty, disbursed }
  }, [rows, invoices])

  function invoiceRows(id) {
    return rows.filter((r) => r.invoiceId === id)
  }

  function invoiceNet(id) {
    return invoiceRows(id).reduce((s, r) => s + rowNet(r), 0)
  }

  function handleGenerate(e) {
    e.preventDefault()
    const free = rows.filter((r) => !r.invoiceId)
    if (free.length === 0) {
      setGenError('Semua baris sudah masuk invoice. Tidak ada yang bisa dikelompokkan.')
      return
    }
    const id = `inv-${Date.now()}`
    setInvoices((list) => [
      ...list,
      { id, no: buildInvoiceNo(invSeq), period: '29 September 2026', stage: 'draft', notes: [], taxSlip: '' },
    ])
    setRows((list) => list.map((r) => (r.invoiceId ? r : { ...r, invoiceId: id })))
    setActiveInv(id)
    setInvSeq((n) => n + 1)
    setGenError('')
  }

  function advanceInvoice(id) {
    setInvoices((list) =>
      list.map((i) => {
        if (i.id !== id) return i
        const idx = STAGE_ORDER.indexOf(i.stage)
        if (idx < 0 || idx >= STAGE_ORDER.length - 1) return i
        return { ...i, stage: STAGE_ORDER[idx + 1] }
      })
    )
  }

  function handleNotes(id, files) {
    if (!files || files.length === 0) return
    const names = Array.from(files).map((f) => f.name)
    setInvoices((list) =>
      list.map((i) => (i.id === id ? { ...i, notes: [...i.notes, ...names] } : i))
    )
  }

  const printed = invoices.find((i) => i.id === printInv) || null

  return (
    <div className="space-y-5">
      <style>{`@page{size:A5;margin:8mm}.inv-print-sheet{display:none}@media print{body *{visibility:hidden}.inv-print-sheet,.inv-print-sheet *{visibility:visible}.inv-print-sheet{display:block !important;position:absolute;inset:0}}`}</style>

      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · TARIF {formatRp(RATE_PER_PORTION)}/PORSI · TOLERANSI TELAT {LATE_TOLERANCE_MINUTES} MNT
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Klaim dan penagihan invoice
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Porsi sah dikali tarif kontrak. Keterlambatan di atas {LATE_TOLERANCE_MINUTES} menit
              memotong {LATE_PENALTY_PCT} persen nilai barisnya.
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

      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · PORSI SAH VS TAGIHAN</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Rekonsiliasi per sekolah
            </h2>
          </div>
          <form onSubmit={handleGenerate} className="flex items-center gap-2">
            {genError && (
              <p role="alert" className="text-[11px] font-medium text-rose-700">{genError}</p>
            )}
            <button type="submit" className={BTN}>
              <Plus className="h-4 w-4" />
              Buat invoice dari baris bebas
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
                <th scope="col" className="px-3 py-2.5 text-right">Penalti</th>
                <th scope="col" className="px-3 py-2.5 text-right">Bersih</th>
                <th scope="col" className="px-4 py-2.5 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
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
                    {r.valid.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {r.lateMinutes}
                    <span className="font-normal text-slate-500"> mnt</span>
                    {r.lateMinutes > LATE_TOLERANCE_MINUTES && (
                      <span className="block text-[11px] font-semibold text-rose-700">
                        Lewat toleransi
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                    {formatRp(rowGross(r))}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-rose-700">
                    {penaltyFor(r) > 0 ? `-${formatRp(penaltyFor(r))}` : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-[#23259C]">
                    {formatRp(rowNet(r))}
                  </td>
                  <td className="px-4 py-3 text-center text-[11px] font-semibold text-slate-600">
                    {r.invoiceId
                      ? invoices.find((x) => x.id === r.invoiceId)?.no || '-'
                      : 'Bebas'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className={`p-5 text-xs xl:col-span-2 ${CARD}`}>
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · BERKAS TAGIHAN</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
            <Receipt className="h-4 w-4 text-[#23259C]" />
            Daftar invoice
          </h2>
          <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => setActiveInv(inv.id)}
                  aria-current={invoice && invoice.id === inv.id}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${FOCUS} ${
                    invoice && invoice.id === inv.id
                      ? 'border-[#23259C]/40 bg-[#23259C]/[0.05]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] font-bold text-slate-900">{inv.no}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${stageMeta(inv.stage).tone}`}>
                      {stageMeta(inv.stage).label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {inv.period} · {invoiceRows(inv.id).length} baris · {formatRp(invoiceNet(inv.id))}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto py-1" aria-label="Alur pencairan">
            {STAGE_ORDER.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${
                    invoice && STAGE_ORDER.indexOf(invoice.stage) >= i
                      ? 'bg-[#23259C] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {stageMeta(s).label}
                </span>
                {i < STAGE_ORDER.length - 1 && <span aria-hidden="true" className="text-slate-300">·</span>}
              </span>
            ))}
          </div>
        </div>

        {invoice && (
          <div className={`space-y-4 p-5 text-xs xl:col-span-3 ${CARD}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · {invoice.no}</p>
                <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                  <Landmark className="h-4 w-4 text-[#23259C]" />
                  {formatRp(invoiceNet(invoice.id))} · {stageMeta(invoice.stage).label}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {STAGE_ORDER.indexOf(invoice.stage) < STAGE_ORDER.length - 1 && (
                  <button type="button" onClick={() => advanceInvoice(invoice.id)} className={BTN}>
                    Maju ke {stageMeta(STAGE_ORDER[STAGE_ORDER.indexOf(invoice.stage) + 1]).label}
                  </button>
                )}
                <button type="button" onClick={() => setPrintInv(invoice.id)} className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] ${FOCUS}`}>
                  <Printer className="h-4 w-4" />
                  {invoice.stage === 'sp2d' ? 'Unduh SP2D' : 'Unduh draf'}
                </button>
              </div>
            </div>
            <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
            <div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-700">
                  Lampirkan nota belanja bahan
                </span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleNotes(invoice.id, e.target.files)}
                  className="sr-only"
                />
              </label>
              {invoice.notes.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  Belum ada nota. Klik boks di atas untuk melampirkan file dari perangkat.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {invoice.notes.map((n) => (
                    <li key={n} className="font-mono text-[11px] text-slate-600">{n}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                Nama file tercatat lokal sesi ini sebagai syarat transparansi.
              </p>
            </div>
            {invoice.stage !== 'sp2d' ? (
              <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Bukti potong pajak dan salinan SP2D terbit setelah status mencapai SP2D cair.
                Tombol unduh di atas mencetak draf untuk arsip sementara.
              </p>
            ) : (
              <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900">
                Dana cair. Tombol unduh mencetak salinan SP2D beserta potongan pajak untuk arsip.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="inv-print-sheet" aria-hidden="true">
        {printed && (
          <div style={{ color: '#000', background: '#fff', padding: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>
              {printed.stage === 'sp2d' ? 'SALINAN SP2D' : 'DRAF INVOICE'} · {printed.no}
            </p>
            <p style={{ fontSize: 12 }}>Dapur SPPG-01 Menteng · {printed.period}</p>
            <hr />
            {invoiceRows(printed.id).map((r) => (
              <p key={r.id} style={{ fontSize: 13 }}>
                {r.schoolName}: {r.valid} porsi x {formatRp(RATE_PER_PORTION)} = {formatRp(rowGross(r))}
                {penaltyFor(r) > 0 ? `, penalti telat -${formatRp(penaltyFor(r))}` : ''} = {formatRp(rowNet(r))}
              </p>
            ))}
            <p style={{ fontSize: 14, fontWeight: 800 }}>Total bersih {formatRp(invoiceNet(printed.id))}</p>
            <p style={{ fontSize: 12 }}>Status: {stageMeta(printed.stage).label}</p>
          </div>
        )}
      </div>
    </div>
  )
}
