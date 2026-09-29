import { useState, useMemo } from 'react'
import {
  Thermometer,
  Plus,
  ClipboardCheck,
  FileText,
  Camera,
  Package,
} from 'lucide-react'
import {
  CCP_POINTS,
  SENSORY_ASPECTS,
  SEED_TEMP_LOGS,
  SEED_SAMPLES,
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
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
        pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
      }`}
    >
      {label}
    </span>
  )
}

function pointById(id) {
  return CCP_POINTS.find((p) => p.id === id) || CCP_POINTS[0]
}

export function SppgQualityPanel() {
  const [logs, setLogs] = useState(SEED_TEMP_LOGS)
  const [samples, setSamples] = useState(SEED_SAMPLES)
  const [signoffs, setSignoffs] = useState([])

  const [tempForm, setTempForm] = useState({
    pointId: 'ccp-1',
    batchToken: '',
    value: '',
    holdMinutes: '3',
    measuredAt: '06:00',
    measuredBy: '',
  })
  const [evidence, setEvidence] = useState(null)
  const [tempError, setTempError] = useState('')
  const [tempOk, setTempOk] = useState('')

  const [sensory, setSensory] = useState({ rasa: '', aroma: '', tekstur: '', visual: '' })
  const [releaseForm, setReleaseForm] = useState({ batchToken: '', note: '', signer: '', agree: false })
  const [releaseError, setReleaseError] = useState('')

  const [sampleForm, setSampleForm] = useState({ batchToken: '', rackNo: '', storedBy: '' })
  const [sampleError, setSampleError] = useState('')
  const [sampleOk, setSampleOk] = useState('')

  const summary = useMemo(() => {
    const judged = logs.map((l) =>
      checkTemp(pointById(l.pointId), l.value, l.holdMinutes).pass
    )
    return {
      pass: judged.filter(Boolean).length,
      total: judged.length,
      stored: samples.filter((s) => s.status === 'tersimpan').length,
      signed: signoffs.length,
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

  function handleAddTemp(e) {
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
    const log = {
      id: `log-${Date.now()}`,
      pointId: point.id,
      batchToken: tempForm.batchToken.trim().toUpperCase(),
      value,
      holdMinutes: hold,
      measuredAt: tempForm.measuredAt,
      measuredBy: tempForm.measuredBy.trim(),
      evidenceName: evidence ? evidence.name : 'tanpa foto',
    }
    setLogs((list) => [log, ...list])
    const verdict = checkTemp(point, value, hold)
    setTempOk(`${point.code} ${value}C dicatat: ${verdict.verdict}.`)
  }

  function handleSignoff(e) {
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
    const allPass = SENSORY_ASPECTS.every((a) => sensory[a.id] === 'lolos')
    setSignoffs((list) => [
      {
        id: `rel-${Date.now()}`,
        batchToken: releaseForm.batchToken.trim().toUpperCase(),
        aspects: { ...sensory },
        note: releaseForm.note.trim(),
        signer: releaseForm.signer.trim(),
        signedAt: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        layak: allPass,
      },
      ...list,
    ])
    setSensory({ rasa: '', aroma: '', tekstur: '', visual: '' })
    setReleaseForm({ batchToken: '', note: '', signer: '', agree: false })
    setReleaseError('')
  }

  function handleAddSample(e) {
    e.preventDefault()
    if (!sampleForm.batchToken.trim() || !sampleForm.rackNo.trim() || !sampleForm.storedBy.trim()) {
      setSampleError('Isi token batch, nomor rak, dan nama penyimpan.')
      return
    }
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    setSamples((list) => [
      {
        id: `smp-${Date.now()}`,
        batchToken: sampleForm.batchToken.trim().toUpperCase(),
        rackNo: sampleForm.rackNo.trim().toUpperCase(),
        storedAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
        storedBy: sampleForm.storedBy.trim(),
        status: 'tersimpan',
      },
      ...list,
    ])
    setSampleForm({ batchToken: '', rackNo: '', storedBy: '' })
    setSampleError('')
    setSampleOk('Sampel arsip dicatat. Batas simpan 2x24 jam dihitung otomatis.')
  }

  const activePoint = pointById(tempForm.pointId)

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#1B1D7D] text-white shadow-[0_18px_40px_-20px_rgba(27,29,125,0.65)]">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-amber-300">
              SPPG-01 · SELASA, 29 SEPT 2026 · SHIFT 03.30-07.30
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Kontrol mutu HACCP
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/70">
              Suhu titik kritis, uji sensori ahli gizi, dan sampel arsip dicatat per batch.
              Status lolos atau gagal selalu dihitung dari ambang, bukan ditulis manual.
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
              {summary.stored} sampel tersimpan · {summary.signed} rilis ditandatangani
            </p>
          </div>
        </div>
      </section>

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
              <input
                type="text"
                value={tempForm.batchToken}
                onChange={setT('batchToken')}
                placeholder="MBG-2026-SPPG01-..."
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 ${FOCUS}`}
              />
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
                placeholder="Nama staf"
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
                Pratinjau tersimpan lokal di sesi ini, bukan diunggah ke server.
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
                          {l.value}C
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
              placeholder="Temuan sensori bila ada"
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
              placeholder="Nama penandatangan"
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
              Batch ini memenuhi standar mutu dan layak konsumsi berdasarkan hasil ukur dan uji
              sensori di atas.
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
                        {s.storedBy} · musnah maks {retentionDeadline(s.storedAt)}
                      </p>
                    </div>
                    {s.status === 'tersimpan' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSamples((list) =>
                            list.map((x) => (x.id === s.id ? { ...x, status: 'dimusnahkan' } : x))
                          )
                        }
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

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <Thermometer className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Ambang CCP-1 75C, CCP-2 60C, dan CCP-3 4-8C mengikuti prinsip HACCP pada dokumen sistem.
        Foto bukti hanya pratinjau lokal dan ikut terhapus saat halaman dimuat ulang.
      </p>
    </div>
  )
}
