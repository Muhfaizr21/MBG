import { useState, useEffect, useCallback } from 'react'
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ScanLine,
  FlaskConical,
  ShieldCheck,
  Siren,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import { navigate } from '../../App'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { scanRequest } from '../../lib/api'
import { SCAN_STAGES } from '../../data/validatorData'
import { ImageCapturePanel } from '../../components/shared/ImageCapturePanel'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: PEMINDAI AI & DETEKSI MUTU (DUAL-STAGE)
 * URL: /validator/scan
 * VALIDATOR.md Bab 2: pemeriksaan format token, classifier fresh/stale hasil AI,
 * dan keputusan suhu. Analisis gizi memakai dataset di halaman Analisis Gizi.
 * ==============================================================================
 */

const VERDICT_STYLE = {
  layak: {
    gradient: 'from-amber-600 to-orange-600',
    icon: CheckCircle2,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
  },
  peringatan: {
    gradient: 'from-amber-500 to-orange-500',
    icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
  },
    tolak: {
    gradient: 'from-rose-600 to-red-600',
    icon: XCircle,
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'bg-rose-500',
  },
}

const MACRO_ROWS = [
  { key: 'energy', label: 'Energi Total', unit: 'kkal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Karbohidrat', unit: 'g' },
  { key: 'fat', label: 'Lemak Sehat', unit: 'g' },
]

const normalizeScanResult = (data) => ({
  ...data,
  releaseTemp: data.releaseTemp ?? 0,
  holdTemp: data.holdTemp ?? 0,
  checks: Array.isArray(data.checks) ? data.checks : [],
  macros: data.macros || null,
})

export function ValidatorScanPage() {
  const { user } = useAuth()

  const [stage, setStage] = useState('qr') // qr | visual | result
  const [activeResult, setActiveResult] = useState(null)
  const [sessionLog, setSessionLog] = useState([])
  const [toast, setToast] = useState(null)
  const [qrToken, setQrToken] = useState('')
  const [holdingTemp, setHoldingTemp] = useState('')
  const [releaseTemp, setReleaseTemp] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const runGuard = useCallback(
    (action, payload) => {
      const res = guardAdminAction(user, 'ValidatorScan', action, payload, ['scan.submit'])
      if (!res.allowed) setToast(res.message)
      return res
    },
    [user],
  )

  // Tahap awal: masukkan token sebelum mengambil foto dan mengirim scan.
  const startScan = () => {
    const res = runGuard('pindai boks (token + visual AI)')
    if (!res.allowed) return
    setStage('qr')
    setActiveResult(null)
    setQrToken('')
    setCapturedBlob(null)
    setHoldingTemp('')
    setReleaseTemp('')
  }

  const finishWithResult = (result) => {
    setActiveResult(result)
    setStage('result')
    setSessionLog((prev) => [
      { id: result.id, time: result.scannedAt, boxId: result.boxId, verdict: result.verdict, score: result.score },
      ...prev,
    ])
  }

  // Callback dari ImageCapturePanel: simpan blob WebP yang sudah siap dikirim.
  const handleCapture = (blob, previewUrl) => {
    setCapturedBlob(blob)
  }

  // Kirim foto (WebP) ke POST /api/scans (AI service Go → Python).
  const submitVisualScan = async () => {
    if (!capturedBlob) {
      setToast('Ambil atau unggah foto buah atau sayur terlebih dahulu.')
      return
    }
    if (!qrToken.trim()) {
      setToast('Masukkan token QR boks terlebih dahulu.')
      return
    }
    if (holdingTemp === '' || releaseTemp === '') {
      setToast('Masukkan suhu holding dan suhu lepas dapur hasil pengukuran.')
      return
    }
    const webpFile = new File([capturedBlob], 'scan.webp', { type: 'image/webp' })
    setIsAnalyzing(true)
    try {
      const body = await scanRequest({
        image: webpFile,
        qrToken: qrToken.trim(),
        holdingTempC: holdingTemp,
        releaseTempC: releaseTemp,
      })
      finishWithResult(normalizeScanResult(body.data))
      setCapturedBlob(null)
    } catch (err) {
      setToast(`Analisis AI gagal (${err.message}). Hasil tidak dibuat; periksa koneksi/model lalu coba lagi.`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const advance = () => {
    if (stage === 'qr') {
      if (!qrToken.trim()) {
        setToast('Token QR boks wajib diisi pada tahap 1.')
        return
      }
      setStage('visual')
      return
    }
  }

  const decide = (decision) => {
    if (!activeResult) return
    const action = decision === 'approve' ? 'setujui porsi (lolos uji)' : 'tolak & amankan sampel'
    const res = runGuard(action, {
      scanId: activeResult.id,
      boxId: activeResult.boxId,
      score: activeResult.score,
      decision,
    })
    if (!res.allowed) return

    if (decision === 'reject') {
      setToast(`${activeResult.boxId} ditandai TIDAK LAYAK — sampel diamankan. Buka Lapor Insiden.`)
    } else {
      setToast(`${activeResult.boxId} ditandai untuk pemeriksaan petugas. Hasil classifier bukan persetujuan distribusi.`)
    }
    setStage('qr')
    setActiveResult(null)
  }

  const stageIdx = stage === 'qr' ? 0 : 1
  const result = activeResult
  const style = result ? VERDICT_STYLE[result.verdict] : null
  const VerdictIcon = style?.icon || ShieldCheck

  return (
    <ValidatorLayout activeMenu="scan" title="Pemindai AI & Deteksi Mutu" badge="CLASSIFIER BUAH & SAYUR">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/validator/foodscan')}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100"
      >
        <span>
          <span className="block text-xs font-bold text-amber-950">Butuh rincian kandungan gizi?</span>
          <span className="mt-0.5 block text-[11px] text-amber-800">Buka analisis foto dan hitung makro berdasarkan bahan makanan.</span>
        </span>
        <span className="shrink-0 text-xs font-bold text-amber-900">Analisis gizi →</span>
      </button>

      {/* Status strip: HACCP and service scope */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-500">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jendela HACCP</p>
            <p className="font-mono font-extrabold text-sm text-slate-700">Belum tersambung</p>
            <p className="mt-1 text-[10px] text-slate-400">Timer HACCP perlu data waktu masak dari server.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Batas aman konsumsi</p>
            <p className="font-mono font-extrabold text-sm">Belum tersedia</p>
            <p className="mt-1 text-[10px] text-slate-400">Waktu masak belum tersimpan pada data scan.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Model terhubung</p>
            <p className="font-mono font-extrabold text-sm text-slate-700">Classifier fresh/stale buah & sayur</p>
            <p className="mt-1 text-[10px] text-slate-400">Bukan pemeriksaan lauk matang, benda asing, alergen, atau keamanan mikrobiologis.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scanner utama */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">Proses pemindaian dua tahap</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {`tahap ${stage === 'result' ? 'selesai' : stageIdx + 1}/2`}
            </span>
          </div>

          {/* Stepper */}
          <ol className="mt-4 space-y-2">
            {SCAN_STAGES.map((s, i) => {
              const isDone = stage === 'result' || (stage === 'visual' && i === 0) || (stage === 'qr' && i < 0)
              const isCurrent = stage === s.id
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                    isCurrent
                      ? 'border-amber-300 bg-amber-50/60'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <span
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-extrabold font-mono ${
                      isCurrent
                        ? 'bg-amber-600 text-white'
                        : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone && !isCurrent ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800">{s.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</span>
                  </span>
                </li>
              )
            })}
          </ol>

          {/* Viewfinder simulasi */}
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 relative overflow-hidden aspect-[16/9] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)]" />
            <div
              className={`absolute inset-6 sm:inset-10 border-2 border-dashed rounded-xl transition-colors ${
                stage === 'result'
                    ? 'border-emerald-400/80'
                    : 'border-amber-400/80 animate-pulse'
              }`}
            >
              <span className="absolute -top-3 left-3 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono font-bold text-amber-300">
                {stage === 'qr'
                    ? 'MASUKKAN TOKEN QR BOKS'
                  : stage === 'visual'
                    ? 'FOTO BUAH ATAU SAYUR'
                    : 'HASIL CLASSIFIER SERVER'}
              </span>
            </div>

            <div className="relative text-center px-6">
            {stage === 'qr' ? (
                <QrCode className="h-14 w-14 mx-auto text-amber-300/90" strokeWidth={1.3} />
              ) : stage === 'visual' ? (
                <ScanLine className="h-14 w-14 mx-auto text-amber-300/90" strokeWidth={1.3} />
              ) : (
                <ScanLine className="h-14 w-14 mx-auto text-emerald-300" strokeWidth={1.3} />
              )}
              <p className="mt-3 text-[11px] font-mono text-slate-400">
                {stage === 'qr'
                      ? 'Memeriksa format token boks di API…'
                    : stage === 'visual'
                      ? isAnalyzing
                        ? 'Klasifikasi buah/sayur berjalan di AI service…'
                        : 'Ambil foto buah/sayur — klasifikasi di server…'
                      : `${result?.id} · ${result?.boxId}`}
              </p>
            </div>
          </div>

          {/* Input tahap 1: token QR boks */}
          {stage === 'qr' && (
            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Token QR boks (pemeriksaan format)
              </span>
              <input
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="MBG-2026-SPPG01-SDN01P-B17"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:border-amber-400 focus:bg-white focus:outline-none"
              />
            </label>
          )}

          {/* Input tahap 2: kamera/upload foto + sinyal suhu */}
          {stage === 'visual' && (
            <div className="mt-4 space-y-4">
              {/* Panel kamera & upload WebP */}
              <ImageCapturePanel
                onCapture={handleCapture}
                disabled={isAnalyzing}
                label="Foto bahan buah atau sayur"
                hint="Classifier hanya dilatih untuk kelas buah/sayur fresh/stale; bukan makanan matang."
              />
              {/* Sinyal suhu dari termometer lapangan */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Suhu lepas dapur (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={releaseTemp}
                    onChange={(e) => setReleaseTemp(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:border-amber-400 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Suhu holding boks (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={holdingTemp}
                    onChange={(e) => setHoldingTemp(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:border-amber-400 focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Kontrol tahap */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {stage === 'result' ? (
              <>
                <button
                  type="button"
                  onClick={() => decide('approve')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Setujui Porsi (Lolos Uji)
                </button>
                <button
                  type="button"
                  onClick={() => decide('reject')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white px-4 py-3 text-xs font-bold hover:bg-rose-700 transition shadow-sm cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak & Amankan Sampel
                </button>
                {result?.verdict === 'tolak' && (
                  <button
                    type="button"
                    onClick={() => navigate('/validator/incidents')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 px-4 py-3 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Siren className="h-4 w-4" />
                    Lapor Insiden
                  </button>
                )}
              </>
            ) : (
              <>
                {stage === 'qr' ? (
                  <button
                    type="button"
                    onClick={startScan}
                    disabled={isAnalyzing}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition shadow-sm ${
                      'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    Lanjut ke Foto dan Suhu
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitVisualScan}
                    disabled={isAnalyzing || !capturedBlob}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition shadow-sm ${
                      isAnalyzing || !capturedBlob
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer'
                    }`}
                  >
                    <ScanLine className="h-4 w-4" />
                    {isAnalyzing
                      ? 'Menjalankan classifier server...'
                      : !capturedBlob
                        ? 'Foto belum diambil'
                        : 'Analisis AI — Kirim ke Backend'}
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Kartu keputusan mutu */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden self-start">
          <div
            className={`px-5 py-4 text-white bg-gradient-to-r ${
              result ? style.gradient : 'from-slate-700 to-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <VerdictIcon className="h-7 w-7" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm tracking-tight">
                  {result ? result.verdictLabel : 'Kartu Keputusan Mutu'}
                </p>
                <p className="text-[11px] font-mono opacity-85">
                  {result ? `${result.id} · ${result.boxId}` : 'menunggu hasil pemindaian'}
                </p>
              </div>
            </div>
            {result && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-mono opacity-90">
                  <span>Keyakinan kelas teratas</span>
                  <span className="font-extrabold">{result.score}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {!result ? (
              <div className="py-8 text-center">
                <ScanLine className="h-9 w-9 mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">Belum ada hasil</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Masukkan token, suhu terukur, lalu ambil foto buah atau sayur untuk melihat hasil classifier server.
                </p>
              </div>
            ) : (
              <>
                {/* Hasil checklist */}
                <div className="space-y-2">
                  {result.checks.map((c) => (
                    <div
                      key={c.label}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${
                        c.ok ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'
                      }`}
                    >
                      {c.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{c.label}</p>
                        <p className={`text-[11px] ${c.ok ? 'text-slate-500' : 'text-rose-600 font-semibold'}`}>
                          {c.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suhu */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 py-2.5">
                    <p className="font-mono font-extrabold text-sm">{result.releaseTemp}°C</p>
                    <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">
                      Suhu lepas dapur
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border py-2.5 ${
                      result.holdTemp >= 60
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-rose-50 border-rose-100'
                    }`}
                  >
                    <p
                      className={`font-mono font-extrabold text-sm ${
                        result.holdTemp >= 60 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {result.holdTemp}°C
                    </p>
                    <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">
                      Suhu holding boks
                    </p>
                  </div>
                </div>

                {/* Makronutrien */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Makronutrien (bila bahan dan berat diberikan)
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {MACRO_ROWS.map((m) => (
                      <div key={m.key} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-500">{m.label}</p>
                        <p className="font-mono font-extrabold text-sm">
              {result.macros?.[m.key] ?? '—'}
                          <span className="text-[10px] font-semibold text-slate-400"> {m.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  {result.nutritionNote && (
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Makro dari dataset gizi · {result.nutritionNote}
                    </p>
                  )}
                </div>

                <p
                  className={`text-xs rounded-xl border px-3 py-2.5 leading-relaxed ${
                    result.verdict === 'layak'
                      ? 'bg-amber-50 border-amber-100 text-amber-800'
                      : result.verdict === 'peringatan'
                        ? 'bg-amber-50 border-amber-100 text-amber-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}
                >
                  {result.note}
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Log sesi */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">Riwayat hasil pemindaian</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {sessionLog.length} hasil · sesi ini
          </span>
        </div>

        {sessionLog.length === 0 ? (
          <div className="mt-4 py-8 text-center border border-dashed border-slate-200 rounded-xl">
            <QrCode className="h-8 w-8 mx-auto text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-500">Belum ada boks dipindai pada sesi ini</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sessionLog.map((log) => {
              const v = VERDICT_STYLE[log.verdict]
              return (
                <li key={log.id + log.time} className="py-2.5 flex items-center gap-3">
                  <span
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.verdict === 'layak'
                        ? 'bg-emerald-50 text-emerald-600'
                        : log.verdict === 'peringatan'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    <v.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      {log.boxId}{' '}
                      <span className="font-mono font-normal text-slate-400">· {log.id}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {log.time} · keyakinan classifier {log.score}%
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </ValidatorLayout>
  )
}

export default ValidatorScanPage
