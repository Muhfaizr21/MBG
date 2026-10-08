import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Plus,
  Paperclip,
  Users,
  FlaskConical,
  CalendarClock,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  FileCheck2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgComplianceBundle,
  renewSppgComplianceDoc,
  createSppgComplianceHandler,
  createSppgComplianceLab,
  requestSppgComplianceAudit,
  fetchSppgList,
} from '../../lib/api'
import {
  SESSION_DATE,
  LAB_KINDS,
  docStatus,
  labVerdict,
} from '../../data/sppgComplianceData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'
const INPUT = `w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`

export function SppgCompliancePanel() {
  const { user, isSuperadmin } = useAuth()
  const [kitchens, setKitchens] = useState([])
  const [activeSppgId, setActiveSppgId] = useState(user?.sppgId || 'SPPG-01')

  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Form states
  const [renew, setRenew] = useState({ docId: '', expiry: '', fileName: '' })
  const [renewMsg, setRenewMsg] = useState('')
  const [submittingRenew, setSubmittingRenew] = useState(false)

  const [staff, setStaff] = useState({ name: '', role: '', healthExpiry: '', trained: false })
  const [staffError, setStaffError] = useState('')
  const [submittingStaff, setSubmittingStaff] = useState(false)

  const [lab, setLab] = useState({ kind: 'swab', target: '', param: '', value: '', unit: '' })
  const [labError, setLabError] = useState('')
  const [submittingLab, setSubmittingLab] = useState(false)

  const [audit, setAudit] = useState({ purpose: '', preferredDate: '', note: '' })
  const [auditError, setAuditError] = useState('')
  const [submittingAudit, setSubmittingAudit] = useState(false)

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
        console.warn('Gagal memuat daftar dapur SPPG:', err)
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

  // 2. Muat data bundle kepatuhan sanitasi dari database
  const loadComplianceData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      try {
        const data = await fetchSppgComplianceBundle(activeSppgId)
        if (data) {
          setBundle(data)
        }
      } catch (err) {
        console.error('Gagal memuat data sertifikasi dan sanitasi:', err)
        setError(err.message || 'Gagal memuat data kepatuhan dapur dari database.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [activeSppgId]
  )

  useEffect(() => {
    loadComplianceData()
  }, [loadComplianceData])

  const docs = bundle?.docs || []
  const handlers = bundle?.handlers || []
  const labs = bundle?.labs || []
  const audits = bundle?.audits || []

  // Ringkasan metrik kepatuhan
  const totals = useMemo(() => {
    if (bundle?.totals) {
      return bundle.totals
    }
    const expired = docs.filter((d) => !docStatus(d.expiry).ok).length
    const handlersOk = handlers.filter((h) => docStatus(h.healthExpiry).ok && h.trained).length
    const labsPass = labs.filter((l) => labVerdict(l.kind, l.value).pass).length
    return {
      docs: docs.length,
      expired,
      handlersOk,
      handlers: handlers.length,
      labsPass,
      labs: labs.length,
      audits: audits.length,
    }
  }, [bundle, docs, handlers, labs, audits])

  // Action: Perpanjang Dokumen Akreditasi
  async function handleRenew(e) {
    e.preventDefault()
    const doc = docs.find((d) => d.id === renew.docId)
    if (!doc || !renew.expiry) {
      setRenewMsg('Pilih dokumen dan tanggal kedaluwarsa sertifikat baru.')
      return
    }

    setSubmittingRenew(true)
    setRenewMsg('')
    try {
      const updated = await renewSppgComplianceDoc(
        {
          docId: renew.docId,
          expiry: renew.expiry,
          fileName: renew.fileName || doc.fileName,
        },
        activeSppgId
      )
      setNotice(`Dokumen "${doc.name}" berhasil diperpanjang hingga ${renew.expiry}.`)
      setRenew({ docId: '', expiry: '', fileName: '' })
      await loadComplianceData(true)
    } catch (err) {
      setRenewMsg(err.message || 'Gagal memperbarui masa berlaku dokumen.')
    } finally {
      setSubmittingRenew(false)
    }
  }

  // Action: Daftarkan Tenaga Penjamah Makanan Baru
  async function handleStaff(e) {
    e.preventDefault()
    if (!staff.name.trim() || !staff.role.trim() || !staff.healthExpiry) {
      setStaffError('Isi nama, peran, dan tanggal surat keterangan sehat.')
      return
    }

    setSubmittingStaff(true)
    setStaffError('')
    try {
      await createSppgComplianceHandler(
        {
          name: staff.name.trim(),
          role: staff.role.trim(),
          healthExpiry: staff.healthExpiry,
          trained: staff.trained,
          healthFile: 'surat-sehat-' + staff.name.trim().toLowerCase().replace(/\s+/g, '-') + '.pdf',
        },
        activeSppgId
      )
      setNotice(`Tenaga penjamah makanan "${staff.name.trim()}" berhasil didaftarkan ke sistem dapur.`)
      setStaff({ name: '', role: '', healthExpiry: '', trained: false })
      await loadComplianceData(true)
    } catch (err) {
      setStaffError(err.message || 'Gagal mendaftarkan tenaga penjamah makanan.')
    } finally {
      setSubmittingStaff(false)
    }
  }

  // Action: Catat Hasil Uji Lab Rutin
  async function handleLab(e) {
    e.preventDefault()
    const value = parseFloat(String(lab.value).replace(',', '.'))
    if (!lab.target.trim() || !lab.param.trim() || Number.isNaN(value)) {
      setLabError('Isi titik uji, parameter, dan hasil angka.')
      return
    }

    setSubmittingLab(true)
    setLabError('')
    try {
      const recorded = await createSppgComplianceLab(
        {
          kind: lab.kind,
          target: lab.target.trim(),
          param: lab.param.trim(),
          value,
          unit: lab.unit.trim() || '-',
          date: SESSION_DATE,
        },
        activeSppgId
      )
      const verdict = labVerdict(lab.kind, value)
      setNotice(
        `Hasil uji laboratorium "${lab.target}" (${lab.param}: ${value} ${lab.unit}) berhasil dicatat. Vonis: ${verdict.label}.`
      )
      setLab({ kind: 'swab', target: '', param: '', value: '', unit: '' })
      await loadComplianceData(true)
    } catch (err) {
      setLabError(err.message || 'Gagal mencatat hasil uji laboratorium.')
    } finally {
      setSubmittingLab(false)
    }
  }

  // Action: Ajukan Permohonan Audit Dinkes
  async function handleAudit(e) {
    e.preventDefault()
    if (!audit.purpose.trim() || !audit.preferredDate) {
      setAuditError('Isi tujuan audit dan tanggal yang diminta.')
      return
    }

    setSubmittingAudit(true)
    setAuditError('')
    try {
      await requestSppgComplianceAudit(
        {
          purpose: audit.purpose.trim(),
          preferredDate: audit.preferredDate,
          note: audit.note.trim(),
        },
        activeSppgId
      )
      setNotice(
        `Permohonan audit Dinkes untuk "${audit.purpose.trim()}" pada ${audit.preferredDate} berhasil diajukan.`
      )
      setAudit({ purpose: '', preferredDate: '', note: '' })
      await loadComplianceData(true)
    } catch (err) {
      setAuditError(err.message || 'Gagal mengajukan permohonan audit.')
    } finally {
      setSubmittingAudit(false)
    }
  }

  if (loading && !bundle) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <RefreshCw className="h-8 w-8 animate-spin text-[#23259C]" />
        <p className="text-sm font-semibold text-slate-700">Memuat data sertifikasi & kepatuhan sanitasi...</p>
        <p className="text-xs text-slate-500">Menghubungkan ke basis data PostgreSQL Kawangizi</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toast Notice */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
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

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
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

      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-amber-300">
              <span>{bundle?.kitchenCode || activeSppgId}</span>
              <span>·</span>
              <span>SESI 29 SEPT 2026</span>
              <span>·</span>
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-200">
                SLHS · HALAL · NKV
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {bundle?.kitchenName || 'Sertifikasi dan Sanitasi Dapur'}
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Dapur beroperasi bila seluruh sertifikat resmi berlaku. Status dihitung dari tanggal
              kedaluwarsa, vonis uji lab alat dan air dihitung dari ambang batas resmi.
            </p>

            {/* Superadmin Multi-Kitchen Switcher */}
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
              onClick={() => loadComplianceData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>

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
        </div>
      </section>

      {/* SLIP 01 · Legalitas Dapur (Dokumen Akreditasi) */}
      <div className={`overflow-hidden text-xs ${CARD}`}>
        <div className="px-5 pt-5">
          <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · LEGALITAS DAPUR</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
            <ShieldCheck className="h-4 w-4 text-[#23259C]" />
            Dokumen Akreditasi & Sertifikasi
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
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                    Belum ada dokumen sertifikasi yang tercatat untuk dapur ini.
                  </td>
                </tr>
              ) : (
                docs.map((d, i) => {
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
                      <td className="max-w-[160px] truncate px-3 py-3 font-mono text-[11px] text-slate-500">
                        {d.fileName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${st.tone}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Form Perpanjang Dokumen */}
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
              <option value="">Pilih dokumen akreditasi</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.number})
                </option>
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
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 hover:bg-slate-100 transition">
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
          <button type="submit" disabled={submittingRenew} className={BTN}>
            {submittingRenew ? 'Menyimpan...' : 'Simpan perpanjangan'}
          </button>
          {renewMsg && (
            <p role="status" className="w-full text-[11px] font-medium text-rose-700">
              {renewMsg}
            </p>
          )}
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* SLIP 02 · Penjamah Makanan (Food Handlers) */}
        <div className={`overflow-hidden text-xs xl:col-span-3 ${CARD}`}>
          <div className="px-5 pt-5">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · PENJAMAH MAKANAN</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <Users className="h-4 w-4 text-[#23259C]" />
              Sertifikasi Staf Dapur (Food Handlers)
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
                {handlers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500">
                      Belum ada tenaga penjamah makanan terdaftar.
                    </td>
                  </tr>
                ) : (
                  handlers.map((h) => {
                    const st = docStatus(h.healthExpiry)
                    const ok = st.ok && h.trained
                    return (
                      <tr key={h.id} className="transition hover:bg-[#23259C]/[0.03]">
                        <td className="px-5 py-2.5">
                          <p className="font-bold text-slate-800">{h.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {h.role} · {h.healthFile}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-slate-600">{h.healthExpiry}</td>
                        <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600">
                          {h.trained ? 'Bersertifikat' : 'Belum'}
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                              ok
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {ok ? 'Lengkap' : st.ok ? 'Pelatihan kurang' : st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Form Registrasi Staf Dapur */}
          <form onSubmit={handleStaff} className="space-y-2.5 border-t border-dashed border-slate-300 px-5 py-4">
            {staffError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800"
              >
                {staffError}
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Nama staf</span>
                <input
                  type="text"
                  value={staff.name}
                  onChange={(e) => setStaff((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nama lengkap penjamah"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Peran di dapur</span>
                <input
                  type="text"
                  value={staff.role}
                  onChange={(e) => setStaff((f) => ({ ...f, role: e.target.value }))}
                  placeholder="Koki / Asisten / Kemas"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Surat sehat sampai</span>
                <input
                  type="date"
                  value={staff.healthExpiry}
                  onChange={(e) => setStaff((f) => ({ ...f, healthExpiry: e.target.value }))}
                  className={INPUT}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={staff.trained}
                  onChange={(e) => setStaff((f) => ({ ...f, trained: e.target.checked }))}
                  className={`h-4 w-4 rounded accent-[#23259C] ${FOCUS}`}
                />
                Bersertifikat pelatihan higiene penjamah makanan
              </label>
              <button type="submit" disabled={submittingStaff} className={BTN}>
                <Plus className="h-4 w-4" />
                {submittingStaff ? 'Mendaftarkan...' : 'Daftarkan staf'}
              </button>
            </div>
          </form>
        </div>

        {/* SLIP 03 · Uji Lab Rutin (Swab & Air) */}
        <div className={`overflow-hidden text-xs xl:col-span-2 ${CARD}`}>
          <div className="px-5 pt-5">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · UJI LAB RUTIN</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
              <FlaskConical className="h-4 w-4 text-[#23259C]" />
              Usap Alat & Kualitas Air
            </h2>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          <ul className="divide-y divide-slate-100 px-5 max-h-[300px] overflow-y-auto">
            {labs.length === 0 ? (
              <li className="py-8 text-center text-xs text-slate-500">Belum ada catatan uji laboratorium.</li>
            ) : (
              labs.map((l) => {
                const v = labVerdict(l.kind, l.value)
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-bold text-slate-800">
                        {l.target} · {l.param}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500">
                        {l.value} {l.unit} · {l.date || l.testDate}
                      </p>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        v.pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {v.label}
                    </span>
                  </li>
                )
              })
            )}
          </ul>

          {/* Form Pencatatan Uji Lab */}
          <form onSubmit={handleLab} className="space-y-2.5 border-t border-dashed border-slate-300 px-5 py-4">
            {labError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800"
              >
                {labError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block col-span-2">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Jenis uji</span>
                <select
                  value={lab.kind}
                  onChange={(e) => setLab((f) => ({ ...f, kind: e.target.value }))}
                  className={INPUT}
                >
                  {LAB_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Titik uji</span>
                <input
                  type="text"
                  value={lab.target}
                  onChange={(e) => setLab((f) => ({ ...f, target: e.target.value }))}
                  placeholder="Talenan buah / kran air"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Parameter</span>
                <input
                  type="text"
                  value={lab.param}
                  onChange={(e) => setLab((f) => ({ ...f, param: e.target.value }))}
                  placeholder="E. coli / ALT"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Hasil angka</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={lab.value}
                  onChange={(e) => setLab((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-700">Satuan</span>
                <input
                  type="text"
                  value={lab.unit}
                  onChange={(e) => setLab((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="koloni/cm2 / NTU"
                  className={INPUT}
                />
              </label>
            </div>
            <button type="submit" disabled={submittingLab} className={BTN}>
              <Plus className="h-4 w-4" />
              {submittingLab ? 'Mencatat...' : 'Catat hasil lab'}
            </button>
          </form>
        </div>
      </div>

      {/* SLIP 04 · Dinkes Setempat (Permohonan Jadwal Audit) */}
      <div className={`p-5 text-xs ${CARD}`}>
        <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 04 · DINAS KESEHATAN SETEMPAT</p>
        <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
          <CalendarClock className="h-4 w-4 text-[#23259C]" />
          Permohonan Jadwal Audit & Inspeksi Higiene
        </h2>
        <div aria-hidden="true" className="my-3 border-t border-dashed border-slate-300" />
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Form Permohonan Audit */}
          <form onSubmit={handleAudit} className="space-y-2.5">
            {auditError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800"
              >
                {auditError}
              </p>
            )}
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Tujuan audit / inspeksi</span>
              <input
                type="text"
                value={audit.purpose}
                onChange={(e) => setAudit((f) => ({ ...f, purpose: e.target.value }))}
                placeholder="Inspeksi berkala triwulan IV"
                className={INPUT}
              />
            </label>
            <label className="block max-w-52">
              <span className="mb-1 block font-semibold text-slate-700">Tanggal yang diminta</span>
              <input
                type="date"
                value={audit.preferredDate}
                onChange={(e) => setAudit((f) => ({ ...f, preferredDate: e.target.value }))}
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Catatan khusus untuk Dinkes</span>
              <textarea
                value={audit.note}
                onChange={(e) => setAudit((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Fokus pemeriksaan yang diminta atau persiapan khusus"
                className={INPUT}
              />
            </label>
            <button type="submit" disabled={submittingAudit} className={BTN}>
              {submittingAudit ? 'Mengirim permohonan...' : 'Ajukan ke Dinkes'}
            </button>
          </form>

          {/* Daftar Riwayat Permohonan Audit */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-600">Riwayat Pengajuan ke Dinkes:</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 max-h-[260px] overflow-y-auto">
              {audits.length === 0 ? (
                <li className="py-6 text-center text-xs text-slate-500">Belum ada permohonan audit diajukan.</li>
              ) : (
                audits.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-800">{a.purpose}</p>
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tanggal diminta: <strong className="text-slate-700">{a.preferredDate}</strong> · Diajukan:{' '}
                      {a.filedAt}
                      {a.note ? ` · Catatan: "${a.note}"` : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
