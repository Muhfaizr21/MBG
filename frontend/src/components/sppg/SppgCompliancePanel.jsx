import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  Plus,
  Paperclip,
  Users,
  FlaskConical,
  CalendarClock,
} from 'lucide-react'
import {
  SESSION_DATE,
  SEED_DOCS,
  SEED_HANDLERS,
  SEED_LABS,
  SEED_AUDITS,
  LAB_KINDS,
  docStatus,
  labVerdict,
} from '../../data/sppgComplianceData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

export function SppgCompliancePanel() {
  const [docs, setDocs] = useState(SEED_DOCS)
  const [handlers, setHandlers] = useState(SEED_HANDLERS)
  const [labs, setLabs] = useState(SEED_LABS)
  const [audits, setAudits] = useState(SEED_AUDITS)

  const [renew, setRenew] = useState({ docId: '', expiry: '', fileName: '' })
  const [renewMsg, setRenewMsg] = useState('')
  const [staff, setStaff] = useState({ name: '', role: '', healthExpiry: '', trained: false })
  const [staffError, setStaffError] = useState('')
  const [lab, setLab] = useState({ kind: 'swab', target: '', param: '', value: '', unit: '' })
  const [labError, setLabError] = useState('')
  const [audit, setAudit] = useState({ purpose: '', preferredDate: '', note: '' })
  const [auditError, setAuditError] = useState('')

  const totals = useMemo(() => {
    const expired = docs.filter((d) => !docStatus(d.expiry).ok).length
    const handlersOk = handlers.filter((h) => docStatus(h.healthExpiry).ok && h.trained).length
    const labsPass = labs.filter((l) => labVerdict(l.kind, l.value).pass).length
    return { docs: docs.length, expired, handlersOk, handlers: handlers.length, labsPass, labs: labs.length, audits: audits.length }
  }, [docs, handlers, labs, audits])

  function handleRenew(e) {
    e.preventDefault()
    const doc = docs.find((d) => d.id === renew.docId)
    if (!doc || !renew.expiry) {
      setRenewMsg('Pilih dokumen dan tanggal kedaluwarsa sertifikat baru.')
      return
    }
    setDocs((list) =>
      list.map((d) =>
        d.id === doc.id
          ? { ...d, expiry: renew.expiry, fileName: renew.fileName || d.fileName }
          : d
      )
    )
    setRenew({ docId: '', expiry: '', fileName: '' })
    setRenewMsg(`${doc.name} diperpanjang sampai ${renew.expiry}.`)
  }

  function handleStaff(e) {
    e.preventDefault()
    if (!staff.name.trim() || !staff.role.trim() || !staff.healthExpiry) {
      setStaffError('Isi nama, peran, dan tanggal surat keterangan sehat.')
      return
    }
    setHandlers((list) => [
      {
        id: `fh-${Date.now()}`,
        name: staff.name.trim(),
        role: staff.role.trim(),
        healthExpiry: staff.healthExpiry,
        healthFile: 'menunggu berkas',
        trained: staff.trained,
      },
      ...list,
    ])
    setStaff({ name: '', role: '', healthExpiry: '', trained: false })
    setStaffError('')
  }

  function handleLab(e) {
    e.preventDefault()
    const value = parseFloat(String(lab.value).replace(',', '.'))
    if (!lab.target.trim() || !lab.param.trim() || Number.isNaN(value)) {
      setLabError('Isi titik uji, parameter, dan hasil angka.')
      return
    }
    setLabs((list) => [
      {
        id: `lab-${Date.now()}`,
        date: SESSION_DATE,
        kind: lab.kind,
        target: lab.target.trim(),
        param: lab.param.trim(),
        value,
        unit: lab.unit.trim() || '-',
      },
      ...list,
    ])
    setLab({ kind: 'swab', target: '', param: '', value: '', unit: '' })
    setLabError('')
  }

  function handleAudit(e) {
    e.preventDefault()
    if (!audit.purpose.trim() || !audit.preferredDate) {
      setAuditError('Isi tujuan audit dan tanggal yang diminta.')
      return
    }
    setAudits((list) => [
      {
        id: `aud-${Date.now()}`,
        purpose: audit.purpose.trim(),
        preferredDate: audit.preferredDate,
        note: audit.note.trim(),
        status: 'Diajukan',
        filedAt: '29 Sept 2026',
      },
      ...list,
    ])
    setAudit({ purpose: '', preferredDate: '', note: '' })
    setAuditError('')
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · SESI 29 SEPT 2026 · SLHS · HALAL · NKV
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Sertifikasi dan sanitasi dapur
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Dapur beroperasi bila dokumen berlaku. Status dihitung dari tanggal
              kedaluwarsa, vonis lab dihitung dari ambang.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">DOKUMEN BERMASALAH</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {totals.expired}
              <span className="text-2xl text-white/50">/{totals.docs}</span>
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {totals.handlersOk} dari {totals.handlers} penjamah lengkap · {totals.labsPass} dari{' '}
              {totals.labs} uji lolos · {totals.audits} audit diajukan
            </p>
          </div>
        </div>
      </section>

      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · LEGALITAS DAPUR</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
            <ShieldCheck className="h-4 w-4 text-[#23259C]" />
            Dokumen akreditasi
          </h2>
        </div>
        <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className={THEAD}>
              <tr>
                <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                <th scope="col" className="px-3 py-2.5">Dokumen</th>
                <th scope="col" className="px-3 py-2.5">Nomor</th>
                <th scope="col" className="px-3 py-2.5">Kedaluwarsa</th>
                <th scope="col" className="px-3 py-2.5">Berkas</th>
                <th scope="col" className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d, i) => {
                const st = docStatus(d.expiry)
                return (
                  <tr key={d.id} className="transition hover:bg-[#23259C]/[0.03]">
                    <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-800">{d.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{d.issuer}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] font-bold text-slate-900">{d.number}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">{d.expiry}</td>
                    <td className="max-w-[160px] truncate px-3 py-3 font-mono text-[11px] text-slate-500">{d.fileName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.tone}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleRenew} className="flex flex-wrap items-end gap-2.5 border-t border-dashed border-slate-300 px-5 py-4">
          <label className="block min-w-52 flex-1">
            <span className="mb-1 block text-[11px] font-semibold text-slate-700">Perpanjang dokumen</span>
            <select
              value={renew.docId}
              onChange={(e) => {
                setRenew((f) => ({ ...f, docId: e.target.value }))
                setRenewMsg('')
              }}
              className={INPUT}
            >
              <option value="">Pilih dokumen</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-700">Kedaluwarsa baru</span>
            <input
              type="date"
              value={renew.expiry}
              onChange={(e) => {
                setRenew((f) => ({ ...f, expiry: e.target.value }))
                setRenewMsg('')
              }}
              className={INPUT}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="max-w-40 truncate text-[11px] font-semibold text-slate-700">
              {renew.fileName || 'Pilih PDF'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0]
                setRenew((f) => ({ ...f, fileName: file ? file.name : '' }))
                setRenewMsg('')
              }}
              className="sr-only"
            />
          </label>
          <button type="submit" className={BTN}>
            Simpan perpanjangan
          </button>
          {renewMsg && (
            <p role="status" className="w-full text-[11px] font-medium text-emerald-800">{renewMsg}</p>
          )}
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className={`overflow-hidden text-xs xl:col-span-3 ${CARD}`}>
          <div className="px-5 pt-5">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · PENJAMAH MAKANAN</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <Users className="h-4 w-4 text-[#23259C]" />
              Sertifikasi staf dapur
            </h2>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className={THEAD}>
                <tr>
                  <th scope="col" className="px-5 py-2.5">Nama dan peran</th>
                  <th scope="col" className="px-3 py-2.5">Sehat sampai</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Pelatihan</th>
                  <th scope="col" className="px-5 py-2.5 text-center">Vonis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handlers.map((h) => {
                  const st = docStatus(h.healthExpiry)
                  const ok = st.ok && h.trained
                  return (
                    <tr key={h.id} className="transition hover:bg-[#23259C]/[0.03]">
                      <td className="px-5 py-2.5">
                        <p className="font-bold text-slate-800">{h.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{h.role} · {h.healthFile}</p>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{h.healthExpiry}</td>
                      <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600">
                        {h.trained ? 'Bersertifikat' : 'Belum'}
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                          {ok ? 'Lengkap' : st.ok ? 'Pelatihan kurang' : st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <form onSubmit={handleStaff} className="space-y-2.5 border-t border-dashed border-slate-300 px-5 py-4">
            {staffError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                {staffError}
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Nama staf</span>
                <input type="text" value={staff.name} onChange={(e) => setStaff((f) => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Peran</span>
                <input type="text" value={staff.role} onChange={(e) => setStaff((f) => ({ ...f, role: e.target.value }))} placeholder="Asisten masak" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Sehat sampai</span>
                <input type="date" value={staff.healthExpiry} onChange={(e) => setStaff((f) => ({ ...f, healthExpiry: e.target.value }))} className={INPUT} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-700">
                <input type="checkbox" checked={staff.trained} onChange={(e) => setStaff((f) => ({ ...f, trained: e.target.checked }))} className={`h-4 w-4 accent-[#23259C] ${FOCUS}`} />
                Bersertifikat pelatihan penjamah
              </label>
              <button type="submit" className={BTN}>
                <Plus className="h-4 w-4" />
                Daftarkan staf
              </button>
            </div>
          </form>
        </div>

        <div className={`overflow-hidden text-xs xl:col-span-2 ${CARD}`}>
          <div className="px-5 pt-5">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · UJI LAB RUTIN</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <FlaskConical className="h-4 w-4 text-[#23259C]" />
              Usap alat dan air
            </h2>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          <ul className="divide-y divide-slate-100 px-5">
            {labs.map((l) => {
              const v = labVerdict(l.kind, l.value)
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-bold text-slate-800">{l.target} · {l.param}</p>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500">
                      {l.value} {l.unit} · {l.date}
                    </p>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${v.pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                    {v.label}
                  </span>
                </li>
              )
            })}
          </ul>
          <form onSubmit={handleLab} className="space-y-2.5 border-t border-dashed border-slate-300 px-5 py-4">
            {labError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                {labError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block col-span-2">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Jenis uji</span>
                <select value={lab.kind} onChange={(e) => setLab((f) => ({ ...f, kind: e.target.value }))} className={INPUT}>
                  {LAB_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Titik uji</span>
                <input type="text" value={lab.target} onChange={(e) => setLab((f) => ({ ...f, target: e.target.value }))} placeholder="Talenan buah" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Parameter</span>
                <input type="text" value={lab.param} onChange={(e) => setLab((f) => ({ ...f, param: e.target.value }))} placeholder="E. coli" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Hasil angka</span>
                <input type="number" step="0.1" min="0" value={lab.value} onChange={(e) => setLab((f) => ({ ...f, value: e.target.value }))} placeholder="0" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Satuan</span>
                <input type="text" value={lab.unit} onChange={(e) => setLab((f) => ({ ...f, unit: e.target.value }))} placeholder="koloni/cm2" className={INPUT} />
              </label>
            </div>
            <button type="submit" className={BTN}>
              <Plus className="h-4 w-4" />
              Catat hasil lab
            </button>
          </form>
        </div>
      </div>

      <div className={`p-5 text-xs ${CARD}`}>
        <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 04 · DINKES SETEMPAT</p>
        <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
          <CalendarClock className="h-4 w-4 text-[#23259C]" />
          Permohonan audit ulang
        </h2>
        <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={handleAudit} className="space-y-2.5">
            {auditError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                {auditError}
              </p>
            )}
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Tujuan audit</span>
              <input type="text" value={audit.purpose} onChange={(e) => setAudit((f) => ({ ...f, purpose: e.target.value }))} placeholder="Inspeksi berkala triwulan IV" className={INPUT} />
            </label>
            <label className="block max-w-52">
              <span className="mb-1 block font-semibold text-slate-700">Tanggal diminta</span>
              <input type="date" value={audit.preferredDate} onChange={(e) => setAudit((f) => ({ ...f, preferredDate: e.target.value }))} className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Catatan untuk Dinkes</span>
              <textarea value={audit.note} onChange={(e) => setAudit((f) => ({ ...f, note: e.target.value }))} rows={2} placeholder="Fokus pemeriksaan yang diminta" className={INPUT} />
            </label>
            <button type="submit" className={BTN}>
              Ajukan ke Dinkes
            </button>
          </form>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
            {audits.map((a) => (
              <li key={a.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-800">{a.purpose}</p>
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">{a.status}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Minta {a.preferredDate} · diajukan {a.filedAt}{a.note ? ` · ${a.note}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
