import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Thermometer,
  Plus,
  ClipboardCheck,
  FileText,
  Camera,
  Package,
  Building2,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSppgQualityBundle,
  fetchSppgList,
  createSppgTempLog,
  createSppgSignoff,
  createSppgSample,
  updateSppgSampleStatus,
  submitSppgQualityIntervention,
} from '../../lib/api'
import {
  CCP_POINTS,
  SENSORY_ASPECTS,
  checkTemp,
  retentionDeadline,
} from '../../data/sppgQualityData'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#23259C]'
const BTN = `inline-flex items-center gap-1.5 rounded-xl bg-[#23259C] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_20px_-10px_rgba(27,29,125,0.7)] transition hover:bg-[#1b1d7d] active:scale-[0.98] ${FOCUS}`
const CARD = 'rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(27,29,125,0.4)]'
const THEAD = 'border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600'

function Verdict({ pass, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
        pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
      }`}
    >
      {pass ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  )
}

function pointById(id) {
  return CCP_POINTS.find((p) => p.id === id) || CCP_POINTS[0]
}

export function SppgQualityPanel() {
  const { user, isSuperadmin } = useAuth()

  // Ruang dapur aktif (multi-tenant per SPPG)
  const [activeSppgId, setActiveSppgId] = useState(() => {
    if (user?.sppgId) return user.sppgId
    return 'SPPG-01'
  })

  const [isLoadingBundle, setIsLoadingBundle] = useState(false)
  const [kitchenName, setKitchenName] = useState('Memuat Dapur...')
  const [kitchenCode, setKitchenCode] = useState('SPPG')
  const [shiftLabel, setShiftLabel] = useState('SHIFT 03.30-07.30')
  const [activeBatches, setActiveBatches] = useState([])

  const [logs, setLogs] = useState([])
  const [samples, setSamples] = useState([])
  const [signoffs, setSignoffs] = useState([])

  const [kitchenOptions, setKitchenOptions] = useState([
    { id: 'SPPG-01', name: 'SPPG Sentral Menteng 01' },
    { id: 'SPPG-02', name: 'SPPG Kebayoran Baru Mandiri' },
  ])

  useEffect(() => {
    if (!isSuperadmin && user?.sppgId) {
      setActiveSppgId(user.sppgId)
    }
  }, [user?.sppgId, isSuperadmin])

  useEffect(() => {
    if (isSuperadmin) {
      fetchSppgList()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setKitchenOptions(
              data.map((k) => ({
                id: k.id,
                name: k.name || k.id,
                code: k.code || k.id,
              }))
            )
          }
        })
        .catch((err) => console.warn('Gagal memuat daftar SPPG:', err))
    }
  }, [isSuperadmin])

  const [tempForm, setTempForm] = useState({
    pointId: 'ccp-1',
    batchToken: '',
    value: '',
    holdMinutes: '3',
    measuredAt: '06:00',
    measuredBy: user?.fullName || 'Ahmad Fauzi (QC Dapur)',
  })
  const [evidence, setEvidence] = useState(null)
  const [tempError, setTempError] = useState('')
  const [tempOk, setTempOk] = useState('')

  const [sensory, setSensory] = useState({ rasa: '', aroma: '', tekstur: '', visual: '' })
  const [releaseForm, setReleaseForm] = useState({
    batchToken: '',
    note: '',
    signer: user?.fullName || 'dr. Nurul Hidayati, S.Gz (STR-2024-00192)',
    agree: false,
  })
  const [releaseError, setReleaseError] = useState('')
  const [releaseOk, setReleaseOk] = useState('')

  const [sampleForm, setSampleForm] = useState({
    batchToken: '',
    rackNo: '',
    storedBy: user?.fullName || 'Ahmad Fauzi',
  })
  const [sampleError, setSampleError] = useState('')
  const [sampleOk, setSampleOk] = useState('')

  // State untuk Intervensi Keamanan Pangan Superadmin
  const [interventionModalToken, setInterventionModalToken] = useState(null)
  const [interventionAction, setInterventionAction] = useState('quarantine')
  const [interventionReason, setInterventionReason] = useState('')
  const [interventionError, setInterventionError] = useState('')
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false)

  // Memuat data bundle lengkap dari backend sesuai dapur yang dipilih
  const loadBundle = useCallback(async (sppgIdToFetch) => {
    setIsLoadingBundle(true)
    try {
      const data = await fetchSppgQualityBundle(sppgIdToFetch)
      if (data) {
        if (data.kitchenName) setKitchenName(data.kitchenName)
        if (data.kitchenCode) setKitchenCode(data.kitchenCode)
        if (data.shiftLabel) setShiftLabel(data.shiftLabel)
        if (data.tempLogs && Array.isArray(data.tempLogs)) {
          setLogs(data.tempLogs)
        }
        if (data.signoffs && Array.isArray(data.signoffs)) {
          setSignoffs(data.signoffs)
        }
        if (data.samples && Array.isArray(data.samples)) {
          setSamples(data.samples)
        }
        if (data.activeBatches && Array.isArray(data.activeBatches)) {
          setActiveBatches(data.activeBatches)
          if (data.activeBatches.length > 0) {
            setTempForm((f) => ({ ...f, batchToken: f.batchToken || data.activeBatches[0] }))
            setReleaseForm((f) => ({ ...f, batchToken: f.batchToken || data.activeBatches[0] }))
            setSampleForm((f) => ({ ...f, batchToken: f.batchToken || data.activeBatches[0] }))
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat bundle mutu dari server, gunakan data lokal:', err)
    } finally {
      setIsLoadingBundle(false)
    }
  }, [])

  useEffect(() => {
    loadBundle(activeSppgId)
  }, [activeSppgId, loadBundle])

  const summary = useMemo(() => {
    const judged = logs.map((l) =>
      checkTemp(pointById(l.pointId), l.value, l.holdMinutes).pass
    )
    const passCount = judged.filter(Boolean).length
    const totalCount = judged.length
    return {
      pass: passCount,
      total: totalCount,
      stored: samples.filter((s) => s.status === 'tersimpan').length,
      signed: signoffs.length,
      complianceRate: totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(0) : '100',
    }
  }, [logs, samples, signoffs])

  const setT = (key) => (e) => {
    setTempForm((f) => ({ ...f, [key]: e.target.value }))
    setTempError('')
    setTempOk('')
  }

  function handleEvidence(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) {
      setEvidence(null)
      return
    }
    setEvidence({ name: file.name, url: URL.createObjectURL(file) })
  }

  async function handleAddTemp(e) {
    e.preventDefault()
    const point = pointById(tempForm.pointId)
    const value = parseFloat(String(tempForm.value).replace(',', '.'))
    const hold = parseInt(tempForm.holdMinutes, 10) || 0
    if (!tempForm.batchToken.trim()) {
      setTempError('Isi token batch yang diukur.')
      return
    }
    if (Number.isNaN(value)) {
      setTempError('Isi hasil pengukuran suhu dalam angka.')
      return
    }
    if (!tempForm.measuredAt || !tempForm.measuredBy.trim()) {
      setTempError('Isi jam ukur dan nama pengukur.')
      return
    }

    try {
      const payload = {
        pointId: point.id,
        batchToken: tempForm.batchToken.trim().toUpperCase(),
        value,
        holdMinutes: hold,
        measuredAt: tempForm.measuredAt,
        measuredBy: tempForm.measuredBy.trim(),
        evidenceName: evidence ? evidence.name : 'tanpa foto',
      }

      const res = await createSppgTempLog(payload, activeSppgId)
      if (res) {
        setLogs((list) => [res, ...list])
        const verdict = checkTemp(point, value, hold)
        setTempOk(`${point.code} ${value}°C dicatat ke database: ${verdict.verdict}.`)
        setTempForm((f) => ({ ...f, value: '' }))
      }
    } catch (err) {
      setTempError(err.message || 'Gagal menyimpan hasil pengukuran ke server.')
    }
  }

  async function handleSignoff(e) {
    e.preventDefault()
    const missing = SENSORY_ASPECTS.filter((a) => !sensory[a.id])
    if (!releaseForm.batchToken.trim()) {
      setReleaseError('Isi token batch yang dirilis.')
      return
    }
    if (missing.length > 0) {
      setReleaseError(`Nilai aspek sensori yang belum dipilih: ${missing.map((a) => a.name).join(', ')}.`)
      return
    }
    if (!releaseForm.signer.trim()) {
      setReleaseError('Isi nama ahli gizi penandatangan.')
      return
    }
    if (!releaseForm.agree) {
      setReleaseError('Centang pernyataan kelayakan sebelum menandatangani.')
      return
    }

    try {
      const payload = {
        batchToken: releaseForm.batchToken.trim().toUpperCase(),
        aspects: { ...sensory },
        note: releaseForm.note.trim(),
        signer: releaseForm.signer.trim(),
        agree: releaseForm.agree,
      }

      const res = await createSppgSignoff(payload, activeSppgId)
      if (res) {
        setSignoffs((list) => [res, ...list])
        setSensory({ rasa: '', aroma: '', tekstur: '', visual: '' })
        setReleaseForm((f) => ({ ...f, note: '', agree: false }))
        setReleaseError('')
        setReleaseOk(`Lembar rilis mutu untuk ${res.batchToken} berhasil ditandatangani dan tersimpan.`)
      }
    } catch (err) {
      setReleaseError(err.message || 'Gagal menyimpan lembar rilis ke server.')
    }
  }

  async function handleAddSample(e) {
    e.preventDefault()
    if (!sampleForm.batchToken.trim() || !sampleForm.rackNo.trim() || !sampleForm.storedBy.trim()) {
      setSampleError('Isi token batch, nomor rak, dan nama penyimpan.')
      return
    }

    try {
      const payload = {
        batchToken: sampleForm.batchToken.trim().toUpperCase(),
        rackNo: sampleForm.rackNo.trim().toUpperCase(),
        storedBy: sampleForm.storedBy.trim(),
      }

      const res = await createSppgSample(payload, activeSppgId)
      if (res) {
        setSamples((list) => [res, ...list])
        setSampleForm((f) => ({ ...f, rackNo: '' }))
        setSampleError('')
        setSampleOk(`Sampel arsip ${res.batchToken} (Rak ${res.rackNo}) tersimpan di lemari pendingin. Retensi 48 jam aktif.`)
      }
    } catch (err) {
      setSampleError(err.message || 'Gagal menyimpan sampel arsip ke server.')
    }
  }

  async function handleDestroySample(sampleId) {
    try {
      await updateSppgSampleStatus(sampleId, 'dimusnahkan', activeSppgId)
      setSamples((list) =>
        list.map((s) => (s.id === sampleId ? { ...s, status: 'dimusnahkan' } : s))
      )
    } catch (err) {
      console.warn('Gagal update status sampel di server:', err)
    }
  }

  async function handleInterventionSubmit(e) {
    e.preventDefault()
    if (!interventionModalToken) return
    if (!interventionReason || interventionReason.trim().length < 5) {
      setInterventionError('Alasan intervensi wajib diisi minimal 5 karakter untuk jejak audit forensik.')
      return
    }

    setIsSubmittingIntervention(true)
    setInterventionError('')
    try {
      await submitSppgQualityIntervention({
        batchToken: interventionModalToken,
        action: interventionAction,
        reason: interventionReason.trim(),
      })
      setInterventionModalToken(null)
      setInterventionReason('')
      setTempOk(`Tindakan ${interventionAction === 'quarantine' ? 'KARANTINA' : 'TEGURAN MUTU'} untuk token ${interventionModalToken} berhasil dicatat pada audit forensik.`)
    } catch (err) {
      setInterventionError(err.message || 'Gagal mengeksekusi tindakan intervensi.')
    } finally {
      setIsSubmittingIntervention(false)
    }
  }

  const activePoint = pointById(tempForm.pointId)

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* MULTI-TENANT WORKSPACE & SUPERADMIN INSPECTION HEADER */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-amber-400 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-indigo-400/30 bg-[#23259C] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  {activeSppgId}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                  Ruang Kontrol Mutu HACCP
                </span>
                {isSuperadmin && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Inspeksi Mutu Superadmin
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 flex items-center gap-2 text-base font-bold tracking-tight text-white">
                <span>{kitchenName}</span>
                <span className="text-xs font-normal text-slate-300">
                  · Kepatuhan HACCP: <strong className="font-bold text-emerald-400">{summary.complianceRate}%</strong>
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuperadmin ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-1.5 text-xs">
                <span className="pl-1 font-semibold text-[11px] text-slate-300">
                  Inspeksi Dapur:
                </span>
                <select
                  value={activeSppgId}
                  onChange={(e) => setActiveSppgId(e.target.value)}
                  className="cursor-pointer rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {kitchenOptions.map((k) => (
                    <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                      {k.id} · {k.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300">
                Unit Terisolasi: <strong className="text-white">{user?.fullName || kitchenName}</strong>
              </div>
            )}

            <button
              onClick={() => loadBundle(activeSppgId)}
              disabled={isLoadingBundle}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
              title="Sinkronisasi data mutu dari server"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBundle ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO BANNER & KPI METRICS */}
      {/* ========================================================================= */}
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              {kitchenCode} · {shiftLabel}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Kontrol mutu HACCP
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Suhu titik kritis, uji sensori ahli gizi ber-STR, dan sampel arsip pangan 4°C dicatat per batch.
              Status lolos atau gagal selalu dihitung otomatis berdasarkan ambang batas ilmiah, bukan manual.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-bold tracking-[0.18em] text-white/60">
              TITIK CCP LOLOS
            </p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {summary.pass}
              <span className="text-2xl text-white/50">/{summary.total}</span>
            </p>
            <p className="mt-2 text-[11px] font-medium text-white/70">
              {summary.stored} sampel tersimpan · {summary.signed} rilis ditandatangani · {summary.complianceRate}% kepatuhan
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIP 01 & SLIP 02: PENGUKURAN SUHU CCP & LOG SUHU HARI INI */}
      {/* ========================================================================= */}
      <div className="grid gap-5 xl:grid-cols-5">
        <form onSubmit={handleAddTemp} className={`space-y-3.5 p-5 text-xs xl:col-span-2 ${CARD}`}>
          <div className="pb-1">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 01 · TERMOMETER TUSUK</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Catat suhu titik kritis
            </h2>
          </div>
          <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
          {tempError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
              {tempError}
            </p>
          )}
          {tempOk && (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              {tempOk}
            </p>
          )}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-semibold text-slate-700">Titik kritis</span>
              <select
                value={tempForm.pointId}
                onChange={setT('pointId')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 ${FOCUS}`}
              >
                {CCP_POINTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name} ({p.rule})
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-semibold text-slate-700">Token batch</span>
              <div className="relative">
                <input
                  type="text"
                  value={tempForm.batchToken}
                  onChange={setT('batchToken')}
                  placeholder="MBG-2026-SPPG01-..."
                  list="batch-tokens-list"
                  autoComplete="off"
                  spellCheck={false}
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
                />
                <datalist id="batch-tokens-list">
                  {activeBatches.map((tok) => (
                    <option key={tok} value={tok} />
                  ))}
                </datalist>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Hasil ukur (C)</span>
              <input
                type="number"
                step="0.1"
                value={tempForm.value}
                onChange={setT('value')}
                placeholder={activePoint.id === 'ccp-3' ? 'misal 4,1' : 'misal 78,5'}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
            {activePoint.needsHold ? (
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Tahan suhu (menit)</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={tempForm.holdMinutes}
                  onChange={setT('holdMinutes')}
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
                />
              </label>
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                Syarat {activePoint.code}: {activePoint.rule}.
              </div>
            )}
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Jam ukur</span>
              <input
                type="time"
                value={tempForm.measuredAt}
                onChange={setT('measuredAt')}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums text-slate-800 ${FOCUS}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Nama pengukur</span>
              <input
                type="text"
                value={tempForm.measuredBy}
                onChange={setT('measuredBy')}
                placeholder="Nama staf QC"
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-semibold text-slate-700">Foto bukti termometer</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleEvidence}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-slate-700 ${FOCUS}`}
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Dokumentasi foto kalibrasi & penunjuk suhu digital/probe.
              </span>
            </label>
            {evidence && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <img src={evidence.url} alt={`Bukti ${evidence.name}`} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                <p className="font-mono text-[11px] text-slate-600">{evidence.name}</p>
              </div>
            )}
          </div>
          <button type="submit" className={BTN}>
            <Plus className="h-4 w-4" />
            Catat pengukuran
          </button>
        </form>

        <div className={`overflow-hidden text-xs xl:col-span-3 ${CARD}`}>
          <div className="px-5 pt-5">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 02 · LOG SUHU HARI INI</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Hasil pengukuran titik kritis
            </h2>
          </div>
          <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
          {logs.length === 0 ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-500">
              Belum ada pengukuran. Catat suhu pertama lewat form di samping.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-xs">
                <thead className={THEAD}>
                  <tr>
                    <th scope="col" className="w-10 px-4 py-2.5 text-right">No</th>
                    <th scope="col" className="px-3 py-2.5">Titik</th>
                    <th scope="col" className="px-3 py-2.5">Batch</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Hasil</th>
                    <th scope="col" className="px-3 py-2.5">Jam</th>
                    <th scope="col" className="px-3 py-2.5">Bukti</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Vonis</th>
                    {isSuperadmin && <th scope="col" className="px-3 py-2.5 text-center">Intervensi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((l, i) => {
                    const point = pointById(l.pointId)
                    const verdict = checkTemp(point, l.value, l.holdMinutes)
                    return (
                      <tr key={l.id} className="transition hover:bg-[#23259C]/[0.03]">
                        <td className="px-4 py-3 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-800">{point.code}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{point.name}</p>
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] font-bold text-slate-900">
                          {l.batchToken}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[11px] font-bold tabular-nums text-slate-900">
                          {l.value}°C
                          {point.needsHold && (
                            <span className="block font-sans text-[11px] font-normal text-slate-500">
                              tahan {l.holdMinutes} mnt
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-slate-600">
                          {l.measuredAt}
                          <span className="block text-[11px] text-slate-500">{l.measuredBy}</span>
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-3 font-mono text-[11px] text-slate-500">
                          {l.evidenceName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Verdict pass={verdict.pass} label={verdict.verdict} />
                        </td>
                        {isSuperadmin && (
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setInterventionModalToken(l.batchToken)
                                setInterventionAction('quarantine')
                                setInterventionReason('')
                                setInterventionError('')
                              }}
                              className={`rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 ${FOCUS}`}
                              title="Tindakan Intervensi Keamanan Pangan Superadmin"
                            >
                              <ShieldAlert className="inline mr-1 h-3 w-3 text-rose-600" />
                              Intervensi
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIP 03 & SLIP 04: LEMBAR RILIS SENSORI & ARSIP SAMPEL PANGAN */}
      {/* ========================================================================= */}
      <div className="grid gap-5 xl:grid-cols-5">
        <form onSubmit={handleSignoff} className={`space-y-3.5 p-5 text-xs xl:col-span-3 ${CARD}`}>
          <div className="pb-1">
            <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 03 · UJI SENSORI AHLI GIZI</p>
            <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
              Lembar rilis mutu
            </h2>
          </div>
          <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
          {releaseError && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
              {releaseError}
            </p>
          )}
          {releaseOk && (
            <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
              {releaseOk}
            </p>
          )}
          <label className="block max-w-xs">
            <span className="mb-1 block font-semibold text-slate-700">Token batch</span>
            <input
              type="text"
              value={releaseForm.batchToken}
              onChange={(e) => {
                setReleaseForm((f) => ({ ...f, batchToken: e.target.value }))
                setReleaseError('')
              }}
              placeholder="MBG-2026-SPPG01-..."
              list="batch-tokens-list"
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {SENSORY_ASPECTS.map((a) => (
              <fieldset key={a.id} className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-[11px] font-bold text-slate-800">{a.name}</legend>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{a.passHint}</p>
                <div className="flex gap-2">
                  {[
                    { v: 'lolos', label: 'Lolos' },
                    { v: 'gagal', label: 'Gagal' },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      className={`flex-1 cursor-pointer rounded-lg border px-3 py-1.5 text-center text-[11px] font-bold transition ${FOCUS} ${
                        sensory[a.id] === opt.v
                          ? opt.v === 'lolos'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-rose-300 bg-rose-50 text-rose-800'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`sensory-${a.id}`}
                        value={opt.v}
                        checked={sensory[a.id] === opt.v}
                        onChange={() => {
                          setSensory((s) => ({ ...s, [a.id]: opt.v }))
                          setReleaseError('')
                        }}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Catatan ahli gizi</span>
            <textarea
              value={releaseForm.note}
              onChange={(e) => setReleaseForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="Temuan sensori organoleptik atau instruksi penanganan"
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
            />
          </label>
          <label className="block max-w-xs">
            <span className="mb-1 block font-semibold text-slate-700">Nama ahli gizi</span>
            <input
              type="text"
              value={releaseForm.signer}
              onChange={(e) => {
                setReleaseForm((f) => ({ ...f, signer: e.target.value }))
                setReleaseError('')
              }}
              placeholder="Nama penandatangan ber-STR"
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={releaseForm.agree}
              onChange={(e) => {
                setReleaseForm((f) => ({ ...f, agree: e.target.checked }))
                setReleaseError('')
              }}
              className={`mt-0.5 h-4 w-4 accent-[#23259C] ${FOCUS}`}
            />
            <span className="text-[11px] leading-relaxed text-slate-600">
              Batch ini memenuhi standar mutu dan layak konsumsi berdasarkan hasil ukur suhu dan uji sensori di atas.
            </span>
          </label>
          <button type="submit" className={BTN}>
            <ClipboardCheck className="h-4 w-4" />
            Tandatangani rilis
          </button>
          {signoffs.length > 0 && (
            <ul className="divide-y divide-slate-100 border-t border-dashed border-slate-300 pt-2">
              {signoffs.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-slate-900">{s.batchToken}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {s.signer} · {s.signedAt}
                      {s.note ? ` · ${s.note}` : ''}
                    </p>
                  </div>
                  <Verdict pass={s.layak} label={s.layak ? 'LAYAK KONSUMSI' : 'DITAHAN'} />
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="space-y-5 xl:col-span-2">
          <form onSubmit={handleAddSample} className={`space-y-3 p-5 text-xs ${CARD}`}>
            <div className="pb-1">
              <p className="text-[11px] font-bold tracking-wide text-slate-500">SLIP 04 · KULKAS 4C</p>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-slate-900">
                Sampel arsip pangan
              </h2>
            </div>
            <div aria-hidden="true" className="border-t border-dashed border-slate-300" />
            {sampleError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
                {sampleError}
              </p>
            )}
            {sampleOk && (
              <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                {sampleOk}
              </p>
            )}
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Token batch</span>
              <input
                type="text"
                value={sampleForm.batchToken}
                onChange={(e) => {
                  setSampleForm((f) => ({ ...f, batchToken: e.target.value }))
                  setSampleError('')
                  setSampleOk('')
                }}
                placeholder="MBG-2026-SPPG01-..."
                list="batch-tokens-list"
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Nomor rak</span>
                <input
                  type="text"
                  value={sampleForm.rackNo}
                  onChange={(e) => {
                    setSampleForm((f) => ({ ...f, rackNo: e.target.value }))
                    setSampleError('')
                    setSampleOk('')
                  }}
                  placeholder="RK-A3"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Penyimpan</span>
                <input
                  type="text"
                  value={sampleForm.storedBy}
                  onChange={(e) => {
                    setSampleForm((f) => ({ ...f, storedBy: e.target.value }))
                    setSampleError('')
                    setSampleOk('')
                  }}
                  placeholder="Nama staf"
                  className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 ${FOCUS}`}
                />
              </label>
            </div>
            <button type="submit" className={BTN}>
              <Package className="h-4 w-4" />
              Catat sampel
            </button>
          </form>

          <div className={`overflow-hidden text-xs ${CARD}`}>
            <div className="px-5 pt-5">
              <p className="text-[11px] font-bold tracking-wide text-slate-500">LEMARI SAMPEL · 2X24 JAM</p>
              <h2 className="mt-1 flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
                <FileText className="h-4 w-4 text-[#23259C]" />
                Arsip tersimpan
              </h2>
            </div>
            <div aria-hidden="true" className="mx-5 my-3 border-t border-dashed border-slate-300" />
            {samples.length === 0 ? (
              <p className="px-5 py-6 text-center text-[11px] text-slate-500">
                Lemari kosong. Catat sampel pertama lewat form di atas.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 px-5 pb-4">
                {samples.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="font-mono text-[11px] font-bold text-slate-900">
                        {s.rackNo} · {s.batchToken}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <Camera className="h-3 w-3" />
                        {s.storedBy} · musnah maks {s.retentionDeadline || retentionDeadline(s.storedAt)}
                      </p>
                    </div>
                    {s.status === 'tersimpan' ? (
                      <button
                        type="button"
                        onClick={() => handleDestroySample(s.id)}
                        className={`rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.97] ${FOCUS}`}
                      >
                        Tandai dimusnahkan
                      </button>
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        Dimusnahkan
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUPERADMIN HACCP INTERVENTION MODAL */}
      {/* ========================================================================= */}
      {interventionModalToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Intervensi Keamanan Pangan HACCP"
            className="w-full max-w-lg rounded-2xl border border-rose-300 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-extrabold tracking-tight">
                  Intervensi Keamanan Pangan Superadmin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInterventionModalToken(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInterventionSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                <p className="font-bold">Protokol Intervensi Kedaruratan HACCP:</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Tindakan ini diperuntukkan jika ditemukan penyimpangan batas kritis CCP yang membahayakan
                  kesehatan siswa, dan akan dicatat secara permanen di <code>audit_logs</code>.
                </p>
                <div className="mt-2 text-[11px]">
                  Target Token: <span className="font-mono font-bold">{interventionModalToken}</span>
                </div>
              </div>

              {interventionError && (
                <p role="alert" className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-[11px] font-bold text-rose-800">
                  {interventionError}
                </p>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Tindakan Intervensi:
                </label>
                <select
                  value={interventionAction}
                  onChange={(e) => setInterventionAction(e.target.value)}
                  className={`w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 ${FOCUS}`}
                >
                  <option value="quarantine">Karantina &amp; Tarik Batch Darurat (Blokir Pengiriman)</option>
                  <option value="warning">Terbitkan Teguran Resmi Mutu HACCP</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justifikasi Forensik / Temuan Bahaya:
                </label>
                <textarea
                  rows="3"
                  value={interventionReason}
                  onChange={(e) => setInterventionReason(e.target.value)}
                  placeholder="Misal: Suhu holding drop di bawah 60C atau uji sensori terdeteksi bau kecut basi..."
                  className={`w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 ${FOCUS}`}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInterventionModalToken(null)}
                  disabled={isSubmittingIntervention}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-md hover:bg-rose-700 disabled:bg-slate-300"
                >
                  <AlertOctagon className="h-4 w-4" />
                  {isSubmittingIntervention ? 'Memproses...' : 'Eksekusi Tindakan BGN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Ambang CCP-1 75°C, CCP-2 60°C, dan CCP-3 4-8°C mengikuti standar kebersihan &amp; keamanan pangan BGN.
        Seluruh log pengukuran dan rilis tersimpan permanen pada basis data pusat untuk kebutuhan audit BPK &amp; Dinkes.
      </p>
    </div>
  )
}
