import { useState, useEffect, useCallback, useRef } from 'react'
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  Lock,
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
import { HACCP_TIMER, SCAN_STAGES, SCAN_SAMPLE_RESULTS } from '../../data/validatorData'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: PEMINDAI AI & DETEKSI MUTU (DUAL-STAGE)
 * URL: /validator/scan
 * VALIDATOR.md Bab 2: Tahap 1 QR kriptografis, Tahap 2 inspeksi visual YOLOv8,
 * kartu keputusan mutu instan, estimasi makronutrien, mode offline-first.
 * ==============================================================================
 */

const VERDICT_STYLE = {
  layak: {
    gradient: 'from-emerald-600 to-teal-600',
    icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
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

// Estimasi makronutrien default ketika backend tidak mengembalikan data gizi
// (AI service offline / bahan tidak cocok). Web hanya memuat 4 makro (tanpa serat).
const DEFAULT_MACROS = { energy: 545, protein: 34, carbs: 68, fat: 14 }

// Menu demo MBG dikirim sebagai `items` ke POST /api/scans agar makro
// dihitung backend dari dataset gizi (nama:Ngram dipisah koma).
const SCAN_MENU_ITEMS =
  'Beras Giling masak (nasi):120,Ayam goreng paha:60,Ketimun:40,Selada:40,Pisang Ambon:70'

// Token QR demo untuk tahap 1; validator dapat menggantinya dengan token boks asli.
const DEMO_QR_TOKEN = 'MBG-2026-SPPG01-SDN01P-B17'

// Samakan bentuk hasil backend dengan mock SCAN_SAMPLE_RESULTS.
const normalizeScanResult = (data) => ({
  ...data,
  releaseTemp: data.releaseTemp ?? 0,
  holdTemp: data.holdTemp ?? 0,
  checks: Array.isArray(data.checks) ? data.checks : [],
  macros: data.macros || DEFAULT_MACROS,
})

export function ValidatorScanPage() {
  const { user } = useAuth()

  const [secondsLeft, setSecondsLeft] = useState(HACCP_TIMER.secondsLeftSeed)
  const [isOffline, setIsOffline] = useState(false)
  const [stage, setStage] = useState('qr') // qr | visual | result
  const [activeResult, setActiveResult] = useState(null)
  const [pendingIdx, setPendingIdx] = useState(0)
  const [sessionLog, setSessionLog] = useState([])
  const [toast, setToast] = useState(null)
  const [qrToken, setQrToken] = useState(DEMO_QR_TOKEN)
  const [holdingTemp, setHoldingTemp] = useState('63.2')
  const [releaseTemp, setReleaseTemp] = useState('76.4')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef(null)

  const locked = secondsLeft <= 0

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])

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

  // Simulasi pemindaian: tahap 1 → tahap 2 → kartu keputusan
  const startScan = () => {
    if (locked) {
      setToast('Jendela HACCP 4 jam berakhir. Pemindaian dikunci sampai boks baru tiba.')
      return
    }
    const res = runGuard('pindai boks (QR + visual)', { offline: isOffline })
    if (!res.allowed) return
    setStage('qr')
    setActiveResult(null)
  }

  const finishWithResult = (result, offline) => {
    setPendingIdx((i) => i + 1)
    setActiveResult(result)
    setStage('result')
    setSessionLog((prev) => [
      {
        id: result.id,
        time: result.scannedAt,
        boxId: result.boxId,
        verdict: result.verdict,
        score: result.score,
        offline,
      },
      ...prev,
    ])
  }

  const nextMockResult = () => SCAN_SAMPLE_RESULTS[pendingIdx % SCAN_SAMPLE_RESULTS.length]

  // Tahap visual: pilih/pambil foto, kirim ke POST /api/scans (AI service Go → Python).
  // Fallback ke mock bila offline atau AI service tidak terjangkau (demo tetap jalan).
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (locked) {
      setToast('Jendela HACCP 4 jam berakhir. Pemindaian dikunci sampai boks baru tiba.')
      return
    }

    setIsAnalyzing(true)
    try {
      if (isOffline) {
        setToast('Mode offline aktif — hasil analisis memakai simulasi lokal di perangkat.')
        finishWithResult(nextMockResult(), true)
        return
      }
      try {
        const body = await scanRequest({
          image: file,
          qrToken: qrToken.trim(),
          holdingTempC: holdingTemp,
          releaseTempC: releaseTemp,
          items: SCAN_MENU_ITEMS,
        })
        finishWithResult(normalizeScanResult(body.data), false)
      } catch (err) {
        setToast(`AI service tidak terhubung (${err.message}) — menampilkan hasil simulasi.`)
        finishWithResult(nextMockResult(), false)
      }
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
    // Tahap visual: buka pemilih foto (analisis dijalankan di handleFileChange).
    fileInputRef.current?.click()
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
      setToast(`${activeResult.boxId} disetujui — porsi dialokasikan ke ${activeResult.verdict === 'peringatan' ? 'konsumsi segera' : 'kelas'}.`)
    }
    setStage('qr')
    setActiveResult(null)
  }

  const stageIdx = stage === 'qr' ? 0 : 1
  const result = activeResult
  const style = result ? VERDICT_STYLE[result.verdict] : null
  const VerdictIcon = style?.icon || ShieldCheck

  return (
    <ValidatorLayout activeMenu="scan" title="Pemindai AI & Deteksi Mutu" badge="YOLOv8 DUAL-STAGE">
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

      {/* Status strip: HACCP + mode offline */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <span
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              locked ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jendela HACCP</p>
            <p className={`font-mono font-extrabold text-sm ${locked ? 'text-rose-600' : 'text-emerald-700'}`}>
              {Math.floor(secondsLeft / 60)} menit {secondsLeft % 60} detik
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Batas aman konsumsi</p>
            <p className="font-mono font-extrabold text-sm">{HACCP_TIMER.safeUntil}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOffline((v) => !v)
            setToast(
              isOffline
                ? 'Kembali ONLINE — antrian pindaian akan segera disinkronkan.'
                : 'Mode OFFLINE aktif — QR diverifikasi dengan public key lokal, log disimpan di perangkat.',
            )
          }}
          className={`bg-white rounded-2xl border shadow-xs p-4 flex items-center gap-3 text-left cursor-pointer hover:shadow-md transition ${
            isOffline ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
          }`}
          aria-pressed={isOffline}
        >
          <span
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOffline ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Koneksi inferensi
            </span>
            <span
              className={`block font-mono font-extrabold text-sm ${
                isOffline ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {isOffline ? 'Offline (lokal)' : 'Online (tersinkron)'}
            </span>
          </span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scanner utama */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">Proses pemindaian dua tahap</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {locked ? 'terkunci' : `tahap ${stage === 'result' ? 'selesai' : stageIdx + 1}/2`}
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
                locked
                  ? 'border-rose-500/70'
                  : stage === 'result'
                    ? 'border-emerald-400/80'
                    : 'border-amber-400/80 animate-pulse'
              }`}
            >
              <span className="absolute -top-3 left-3 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono font-bold text-amber-300">
                {stage === 'qr'
                  ? 'ARAHKAN KE QR BOKS (80mm)'
                  : stage === 'visual'
                    ? 'BUKA TUTUP BOKS — SOROT PIRING'
                    : 'ANALISIS SELESAI'}
              </span>
            </div>

            <div className="relative text-center px-6">
              {stage === 'qr' ? (
                <QrCode className="h-14 w-14 mx-auto text-amber-300/90" strokeWidth={1.3} />
              ) : stage === 'visual' ? (
                <Camera className="h-14 w-14 mx-auto text-amber-300/90" strokeWidth={1.3} />
              ) : (
                <ScanLine className="h-14 w-14 mx-auto text-emerald-300" strokeWidth={1.3} />
              )}
              <p className="mt-3 text-[11px] font-mono text-slate-400">
                {locked
                  ? 'SCAN TERKUNCI — jendela HACCP berakhir'
                  : stage === 'qr'
                    ? 'Memverifikasi token kriptografis ke API Gateway…'
                    : stage === 'visual'
                      ? isAnalyzing
                        ? 'Inferensi YOLOv8 berjalan di AI service…'
                        : 'Pilih foto isi boks — inferensi YOLOv8 di server…'
                      : `${result?.id} · ${result?.boxId}`}
              </p>
            </div>
          </div>

          {/* Input tahap 1: token QR boks */}
          {stage === 'qr' && (
            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Token QR boks
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

          {/* Input tahap 2: sinyal suhu (dari termometer lapangan) */}
          {stage === 'visual' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={stage === 'qr' ? startScan : advance}
                  disabled={locked || isAnalyzing}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition shadow-sm ${
                    locked || isAnalyzing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : stage === 'qr'
                        ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
                        : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  {locked
                    ? 'Pemindaian Terkunci (HACCP berakhir)'
                    : isAnalyzing
                      ? 'Menganalisis dengan AI…'
                      : stage === 'qr'
                        ? 'Mulai Pindai Boks Berikutnya'
                        : 'Pilih Foto & Analisis AI'}
                </button>
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
                  <span>Skor keamanan</span>
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
                  Jalankan pemindaian QR lalu inspeksi visual untuk memunculkan skor, hasil deteksi, dan estimasi makronutrien.
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
                    Estimasi makronutrien (dataset gizi)
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {MACRO_ROWS.map((m) => (
                      <div key={m.key} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <p className="text-[10px] font-semibold text-slate-500">{m.label}</p>
                        <p className="font-mono font-extrabold text-sm">
                          {result.macros[m.key]}
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
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
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
          <h2 className="text-sm font-extrabold tracking-tight">Log sesi pemindaian</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {sessionLog.length} boks · sesi ini
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
                      {log.time} · skor {log.score}%
                      {log.offline && ' · antrean offline'}
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
