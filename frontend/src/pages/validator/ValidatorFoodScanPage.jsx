import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import {
  deleteAllScans,
  deleteScan,
  fetchDeliveries,
  fetchRecentScans,
  scanRequest,
  uploadUrl,
} from '../../lib/api'
import { ImageCapturePanel } from '../../components/shared/ImageCapturePanel'

const MAX_IMAGE_BYTES = 8 << 20

const COMPARTMENT_STYLE = {
  match: { stroke: '#059669', fill: 'rgba(5,150,105,0.20)', label: 'Cocok', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  review: { stroke: '#d97706', fill: 'rgba(217,119,6,0.20)', label: 'Perlu verifikasi', badge: 'border-amber-200 bg-amber-50 text-amber-700' },
  mismatch: { stroke: '#e11d48', fill: 'rgba(225,29,72,0.20)', label: 'Tidak cocok', badge: 'border-rose-200 bg-rose-50 text-rose-700' },
  empty: { stroke: '#94a3b8', fill: 'rgba(148,163,184,0.16)', label: 'Kosong', badge: 'border-slate-200 bg-slate-100 text-slate-600' },
}

function clampUnit(value) {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 0
  return Math.max(0, Math.min(1, numeric))
}

// bboxQuadNorm dipakai agar kotak sekat mengikuti sudut nampan hasil warp
// perspektif; bboxNorm hanya berlaku bila nampan tidak terdeteksi.
function compartmentQuad(compartment) {
  const quad = compartment?.bboxQuadNorm
  if (Array.isArray(quad) && quad.length === 4) return quad
  const box = compartment?.bboxNorm
  if (Array.isArray(box) && box.length === 4) {
    const [x1, y1, x2, y2] = box
    return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
  }
  return null
}

function TrayOverlay({ src, compartments }) {
  if (!src || !compartments?.length) return null
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
      <img src={src} alt="Foto hidangan dengan analisis sekat nampan" className="block w-full h-auto" />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {compartments.map((compartment) => {
          const quad = compartmentQuad(compartment)
          if (!quad) return null
          const style = COMPARTMENT_STYLE[compartment.status] || COMPARTMENT_STYLE.review
          const points = quad.map(([x, y]) => `${clampUnit(x) * 1000},${clampUnit(y) * 1000}`).join(' ')
          return (
            <polygon
              key={compartment.cell}
              points={points}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {compartments.map((compartment) => {
          const quad = compartmentQuad(compartment)
          if (!quad) return null
          const center = quad.reduce((sum, [x, y]) => [sum[0] + x / 4, sum[1] + y / 4], [0, 0])
          const style = COMPARTMENT_STYLE[compartment.status] || COMPARTMENT_STYLE.review
          return (
            <span
              key={`label-${compartment.cell}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white/95 px-1.5 py-0.5 font-mono text-[9px] font-extrabold shadow-sm"
              style={{ left: `${clampUnit(center[0]) * 100}%`, top: `${clampUnit(center[1]) * 100}%`, borderColor: style.stroke, color: style.stroke }}
            >
              {compartment.cell}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CompartmentList({ compartments }) {
  if (!compartments?.length) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
        Layanan AI belum mengirim hasil per sekat. Jalankan ai_service dari source terbaru agar pemotongan nampan aktif.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {compartments.map((compartment) => {
        const style = COMPARTMENT_STYLE[compartment.status] || COMPARTMENT_STYLE.review
        const predicted = String(compartment.predictedDisplay || compartment.predicted || '').replaceAll('_', ' ')
        return (
          <li key={compartment.cell} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5">
            <span className="mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-extrabold" style={{ borderColor: style.stroke, color: style.stroke }}>
              {compartment.cell}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${style.badge}`}>{style.label}</span>
                {predicted && <span className="truncate text-[11px] font-bold text-slate-800">{predicted}</span>}
                {predicted && compartment.confidence > 0 && (
                  <span className="font-mono text-[10px] text-slate-400">{Math.round(compartment.confidence * 100)}%</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                {compartment.note}
                {compartment.component ? ` · komponen: ${compartment.component}` : ''}
                {compartment.mixed ? ' · komponen tercampur' : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const VERDICT_STYLE = {
  layak: {
    gradient: 'from-emerald-600 to-teal-600',
    icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  peringatan: {
    gradient: 'from-amber-500 to-orange-500',
    icon: AlertTriangle,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  tolak: {
    gradient: 'from-rose-600 to-red-600',
    icon: XCircle,
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

const MACROS = [
  { key: 'energy', label: 'Energi', unit: 'kkal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Karbohidrat', unit: 'g' },
  { key: 'fat', label: 'Lemak', unit: 'g' },
]

function buildBoxId() {
  const date = new Date()
  const day = [date.getFullYear().toString().slice(-2), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('')
  return `BOK-FOTO-${day}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function errorMessage(error) {
  if (error?.status === 502) return 'Layanan AI belum aktif. Nyalakan ai_service lalu coba lagi.'
  if (error?.status === 403) return 'Akun ini tidak memiliki izin untuk mengirim scan.'
  if (error?.status === 401) return 'Sesi berakhir. Silakan login ulang.'
  if (error?.status === 400) return error.message || 'Gambar tidak valid. Gunakan JPG/PNG/WebP maksimal 8MB.'
  if (error?.status === 500) return 'Backend gagal memproses pemindaian. Coba lagi.'
  return error?.message || 'Tidak bisa terhubung ke server.'
}

function freshnessLabel(value, confidence = 1) {
  if (confidence < 0.7) return 'Perlu pemeriksaan petugas'
  const label = String(value || '').trim().toLowerCase()
  if (['fresh', 'segar'].includes(label)) return 'Segar secara visual'
  if (['spoiled', 'stale', 'rotten', 'busuk'].some((word) => label.includes(word))) return 'Terindikasi tidak segar'
  return 'Perlu pemeriksaan petugas'
}

function displayDate(value) {
  if (!value) return 'Belum tercatat'
  const parts = String(value).split('-')
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value
}

function displayDateTime(value) {
  if (!value) return 'Belum tercatat'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayTemp(value) {
  return value == null || value === 0 ? 'Belum diukur' : `${value}°C`
}

export function ValidatorFoodScanPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [identifierType, setIdentifierType] = useState('batch')
  const [batchOrQr, setBatchOrQr] = useState('')
  const [holdingTemp, setHoldingTemp] = useState('')
  const [releaseTemp, setReleaseTemp] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [recent, setRecent] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('')
  const [detail, setDetail] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const refreshRecent = useCallback(() => {
    fetchRecentScans(8)
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshRecent()
    fetchDeliveries().then((rows) => setDeliveries(Array.isArray(rows) ? rows : [])).catch(() => {})
  }, [refreshRecent])

  const handleDeleteScan = useCallback(async (row) => {
    const ok = window.confirm(`Hapus scan ${row.id} beserta foto hidangannya? Tindakan ini tidak dapat dibatalkan.`)
    if (!ok) return
    setDeletingId(row.id)
    setActionError('')
    try {
      await deleteScan(row.id)
      refreshRecent()
      setDetail((current) => (current?.id === row.id ? null : current))
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }, [refreshRecent])

  const handleDeleteAllScans = useCallback(async () => {
    const ok = window.confirm(`Hapus SEMUA ${recent.length} riwayat scan beserta foto hidangannya? Tindakan ini tidak dapat dibatalkan.`)
    if (!ok) return
    setDeletingId('all')
    setActionError('')
    try {
      await deleteAllScans()
      setDetail(null)
      refreshRecent()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }, [recent.length, refreshRecent])

  const acceptFile = useCallback((blob, previewUrl) => {
    if (!blob) {
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setResult(null)
      setFormError('')
      return
    }
    setFile(new File([blob], 'meal-scan.webp', { type: 'image/webp' }))
    setPreview(previewUrl)
    setResult(null)
    setFormError('')
    setActionError('')
  }, [preview])

  const handleAnalyze = async () => {
    if (!file) {
      setFormError('Ambil atau pilih foto hidangan matang terlebih dahulu.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError('Ukuran foto maksimal 8MB.')
      return
    }
    setFormError('')
    setActionError('')
    setAnalyzing(true)
    const identifier = batchOrQr.trim()
    const isQr = identifierType === 'qr'
    try {
      const response = await scanRequest({
        image: file,
        boxId: buildBoxId(),
        batchId: isQr ? '' : identifier,
        qrToken: isQr ? identifier : '',
        holdingTempC: holdingTemp,
        releaseTempC: releaseTemp,
      })
      setResult(response.data)
      refreshRecent()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setAnalyzing(false)
    }
  }

  const style = result ? (VERDICT_STYLE[result.verdict] || VERDICT_STYLE.peringatan) : null
  const VerdictIcon = style?.icon || ShieldCheck
  const batch = result?.batchInfo
  const selectedDelivery = deliveries.find((delivery) => delivery.id === selectedDeliveryId)
  const menuTitle = batch?.menuName || result?.menuName || selectedDelivery?.menuName || 'Menu belum tercatat'
  const freshnessClass = result?.freshnessClass || result?.aiClass || ''
  const freshnessConfidence = result?.freshnessConfidence ?? result?.aiConfidence
  const freshnessScore = freshnessClass && freshnessConfidence > 0
    ? (['fresh', 'segar'].includes(String(freshnessClass).toLowerCase())
        ? freshnessConfidence * 100
        : ['spoiled', 'stale', 'rotten', 'busuk'].some((word) => String(freshnessClass).toLowerCase().includes(word))
          ? (1 - freshnessConfidence) * 100
          : result?.score)
    : result?.score
  const freshness = result && freshnessClass
    ? freshnessLabel(freshnessClass, freshnessConfidence ?? 0)
    : 'Prediksi kesegaran belum tersedia'
  const ingredients = batch?.ingredients || []
  const macros = result?.macros || batch?.macros

  return (
    <ValidatorLayout activeMenu="foodscan" title="Scan Hidangan AI" badge="PENGENAL MENU + KESEGARAN MASAKAN">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-3">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">Pindai hidangan matang</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Foto dianalisis oleh model pengenal menu dan model kesegaran makanan matang.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-700">Identitas produksi</span>
            {deliveries.length > 0 && (
              <select
                value={selectedDeliveryId}
                onChange={(event) => {
                  const delivery = deliveries.find((row) => row.id === event.target.value)
                  setSelectedDeliveryId(delivery?.id || '')
                  setBatchOrQr(delivery ? (identifierType === 'qr' ? delivery.qrToken : delivery.batchId) : '')
                  setResult(null)
                }}
                className="mt-1.5 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              >
                <option value="">Pilih data distribusi SPPG (opsional)</option>
                {deliveries.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.batchId} · {delivery.schoolName || delivery.schoolNpsn} · {delivery.menuName}
                  </option>
                ))}
              </select>
            )}
            <select
              value={identifierType}
              onChange={(event) => {
                const type = event.target.value
                setIdentifierType(type)
                if (selectedDelivery) setBatchOrQr(type === 'qr' ? selectedDelivery.qrToken : selectedDelivery.batchId)
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            >
              <option value="batch">ID batch</option>
              <option value="qr">Token QR boks</option>
            </select>
            <input
              value={batchOrQr}
              onChange={(event) => {
                setBatchOrQr(event.target.value)
                setSelectedDeliveryId('')
              }}
              placeholder={identifierType === 'qr' ? 'Contoh: MBG-QR-...' : 'Contoh: MBG-20261007-001'}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
            <span className="mt-1 block text-[10px] text-slate-400">
              Pilih data distribusi agar batch, menu, dan resep yang sudah dicatat SPPG ikut tampil. Tanpa batch, AI tetap menganalisis foto.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Suhu lepas dapur</span>
              <input
                type="number"
                min="0"
                max="150"
                step="0.1"
                value={releaseTemp}
                onChange={(event) => setReleaseTemp(event.target.value)}
                placeholder="Suhu inti terukur, mis. 75"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Suhu holding boks</span>
              <input
                type="number"
                min="0"
                max="150"
                step="0.1"
                value={holdingTemp}
                onChange={(event) => setHoldingTemp(event.target.value)}
                placeholder="Suhu boks terukur, mis. 60"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </label>
          </div>

          <div>
            <ImageCapturePanel
              onCapture={acceptFile}
              disabled={analyzing}
              label=""
              hint="Ambil foto makanan matang. Foto dikirim ke server untuk dianalisis; hasil AI tetap perlu diverifikasi petugas."
            />
          </div>

          {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{formError}</p>}
          {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{actionError}</p>}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !file}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold shadow-sm transition ${analyzing || !file ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'cursor-pointer bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" />Menganalisis dua model…</> : <><Sparkles className="h-4 w-4" />Analisis hidangan</>}
          </button>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Prediksi visual tidak menggantikan pemeriksaan suhu, kebersihan, dan verifikasi validator.
          </p>
        </section>

        <section className="self-start overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs lg:col-span-2">
          <div className={`px-5 py-4 text-white ${result ? `bg-gradient-to-r ${style.gradient}` : 'bg-gradient-to-r from-slate-700 to-slate-800'}`}>
            <div className="flex items-center gap-3">
              <VerdictIcon className="h-7 w-7 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">{result?.verdictLabel || 'Hasil Analisis Hidangan'}</p>
                <p className="truncate font-mono text-[11px] opacity-85">{result ? `${result.id} · ${result.boxId}` : 'Menunggu foto hidangan matang'}</p>
              </div>
            </div>
            {result && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Probabilitas visual kelas segar</span>
                  <b>{freshnessScore == null || (freshnessScore === 0 && !freshnessClass) ? '—' : `${Math.round(freshnessScore * 10) / 10}%`}</b>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, freshnessScore || 0))}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 p-5">
            {!result ? (
              <div className="py-8 text-center">
                <ScanLine className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">Belum ada hasil</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">Masukkan batch bila tersedia, ambil foto hidangan matang, lalu jalankan analisis.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analisis per sekat nampan</p>
                    <span className="font-mono text-[10px] text-slate-400">{result.compartments?.length || 0} sekat</span>
                  </div>
                  <TrayOverlay src={preview} compartments={result.compartments} />
                  <CompartmentList compartments={result.compartments} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">{menuTitle}</p>
                {batch?.sppgName && <p className="mt-1 text-[11px] font-semibold text-emerald-700">Data produksi dari {batch.sppgName}</p>}
                {result.menuClass ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Prediksi foto: {result.menuDisplay || result.menuClass.replaceAll('_', ' ')} · keyakinan {Math.round((result.menuConfidence || 0) * 100)}%
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-amber-700">
                      {batch?.menuName || result.menuName || selectedDelivery?.menuName
                        ? 'Nama menu berasal dari data SPPG; model visual belum memberi kategori menu yang meyakinkan.'
                        : 'Menu belum tercatat pada batch dan model visual belum mengenali kategorinya.'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Metadata label="SPPG" value={batch?.sppgName || selectedDelivery?.sppgId || 'Belum tercatat'} />
                  <Metadata label="Batch" value={batch?.batchId || result.batchId || selectedDelivery?.batchId || 'Belum ditautkan'} />
                <Metadata label="Produksi" value={displayDate(batch?.productionDate || selectedDelivery?.scanDate)} icon={<CalendarDays className="h-3.5 w-3.5" />} />
                <Metadata label="Suhu holding" value={result.holdTemp ? `${result.holdTemp}°C` : 'Belum diukur'} />
                </div>
                {selectedDelivery && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-3 text-[11px] text-sky-900">
                    <p className="font-bold">Catatan distribusi dari sistem SPPG</p>
                    <p className="mt-1">Tujuan: {selectedDelivery.schoolName || selectedDelivery.schoolNpsn} · Status: {selectedDelivery.status || 'tercatat'} · QR: {selectedDelivery.qrStatus || 'belum diverifikasi'}</p>
                  </div>
                )}
                {batch?.note && <p className="text-[10px] leading-relaxed text-slate-500">{batch.note}</p>}

                <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${freshness.includes('tidak') ? 'border-rose-200 bg-rose-50' : freshness.includes('Segar') ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kesegaran hidangan matang</p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">{freshness}</p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${style.badge}`}>
                    {freshnessConfidence == null || freshnessConfidence === 0 ? '—' : `${Math.round(freshnessConfidence * 100)}%`}
                  </span>
                </div>
                {!freshnessClass && !result.menuClass && (
                  <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
                    Backend belum mengirim detail prediksi model untuk scan ini. Hasil tidak ditampilkan sebagai 0% agar tidak menyesatkan; jalankan ulang backend dari source terbaru.
                  </p>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bahan & takaran resep</p>
                  {ingredients.length ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {ingredients.map((ingredient, index) => (
                        <li key={`${ingredient.name}-${index}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900">
                          {ingredient.name}{ingredient.weightG > 0 ? ` · ${ingredient.weightG} g` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-500">Takaran bahan belum tercatat pada batch ini.</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rincian gizi per bahan</p>
                  {result.nutrition?.length ? (
                    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full min-w-[420px] text-left text-[10px]">
                        <thead className="bg-slate-50 font-bold uppercase text-slate-400">
                          <tr><th className="px-2.5 py-2">Bahan resep</th><th className="px-2.5 py-2">Berat</th><th className="px-2.5 py-2 text-right">kkal</th><th className="px-2.5 py-2 text-right">Protein</th><th className="px-2.5 py-2 text-right">Karbo</th><th className="px-2.5 py-2 text-right">Lemak</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.nutrition.map((item, index) => (
                            <tr key={`${item.name}-${index}`}>
                              <td className="px-2.5 py-2 font-semibold text-slate-800">{item.name}{item.matchedTo && item.matchedTo !== item.name && <span className="block text-[9px] font-normal text-slate-400">Dataset: {item.matchedTo}</span>}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap">{item.weightG} g</td>
                              <td className="px-2.5 py-2 text-right">{item.energy}</td>
                              <td className="px-2.5 py-2 text-right">{item.protein} g</td>
                              <td className="px-2.5 py-2 text-right">{item.carbs} g</td>
                              <td className="px-2.5 py-2 text-right">{item.fat} g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-500">Rincian gizi per bahan akan muncul jika resep batch memiliki takaran yang cocok dengan dataset.</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total gizi per porsi</p>
                  {macros ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {MACROS.map((macro) => (
                        <div key={macro.key} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-semibold text-slate-500">{macro.label}</p>
                          <p className="font-mono text-sm font-extrabold">{macros[macro.key] ?? 0}<span className="ml-1 text-[10px] font-semibold text-slate-400">{macro.unit}</span></p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-500">{batch?.note || result.nutritionNote || 'Data gizi belum tersedia di resep/menu batch.'}</p>
                  )}
                  {(result.nutritionNote || (batch?.macros && 'Total gizi berasal dari paket menu yang dicatat SPPG.')) && macros && <p className="mt-1.5 text-[10px] text-slate-400">{result.nutritionNote || 'Total gizi berasal dari paket menu yang dicatat SPPG.'}</p>}
                </div>

                <div className="space-y-2">
                  {result.checks?.map((check) => (
                    <div key={check.label} className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${check.ok ? 'border-slate-100 bg-slate-50' : 'border-amber-100 bg-amber-50'}`}>
                      {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                      <div><p className="text-xs font-bold text-slate-800">{check.label}</p><p className="text-[11px] text-slate-600">{check.note}</p></div>
                    </div>
                  ))}
                </div>

                <p className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${result.verdict === 'tolak' ? 'border-rose-100 bg-rose-50 text-rose-800' : 'border-amber-100 bg-amber-50 text-amber-900'}`}>
                  {result.note || 'Hasil AI adalah skrining visual. Validator tetap perlu memeriksa hidangan sesuai SOP.'}
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">Riwayat scan terbaru</h2>
          <div className="flex items-center gap-2">
            {recent.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllScans}
                disabled={deletingId === 'all'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
              >
                {deletingId === 'all' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Hapus semua
              </button>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{recent.length} entri</span>
          </div>
        </div>
        {!recent.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <ScanLine className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-500">Belum ada riwayat pemindaian</p>
            <p className="mt-1 text-[11px] text-slate-400">Scan yang berhasil dianalisis otomatis tersimpan di sini beserta fotonya.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((row) => (
              <ScanHistoryCard
                key={row.id}
                row={row}
                deleting={deletingId === row.id}
                onOpen={() => setDetail(row)}
                onDelete={() => handleDeleteScan(row)}
              />
            ))}
          </div>
        )}
      </section>

      {detail && (
        <ScanDetailModal
          row={detail}
          deleting={deletingId === detail.id}
          onClose={() => setDetail(null)}
          onDelete={() => handleDeleteScan(detail)}
        />
      )}
    </ValidatorLayout>
  )
}

function Metadata({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">{icon}{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-800" title={value}>{value}</p>
    </div>
  )
}

function ScanHistoryCard({ row, onOpen, onDelete, deleting }) {
  const verdict = VERDICT_STYLE[row.verdict] || VERDICT_STYLE.peringatan
  const VerdictIcon = verdict.icon
  const imageSrc = uploadUrl(row.imageRef)
  const title = row.menuName || String(row.menuClass || '').replaceAll('_', ' ') || 'Menu belum dikenali'
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <button type="button" onClick={onOpen} className="block w-full cursor-pointer text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {imageSrc ? (
            <img src={imageSrc} alt={title} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-300">
              <ScanLine className="h-8 w-8" />
              <span className="text-[10px] font-semibold">Foto tidak tersimpan</span>
            </div>
          )}
          <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${verdict.badge}`}>
            <VerdictIcon className="h-3 w-3" />
            {verdict.label}
          </span>
        </div>
        <div className="space-y-2 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-slate-900">{title}</p>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">{row.id} · {row.boxId}</p>
            </div>
            <span className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {Math.round((row.aiConfidence || 0) * 100)}%
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="h-3 w-3 shrink-0 text-slate-400" />
            {displayDateTime(row.createdAt)} · {freshnessLabel(row.aiClass, row.aiConfidence || 0)}
          </p>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3.5 py-2">
        <button
          type="button"
          onClick={onOpen}
          className="text-[11px] font-bold text-emerald-700 transition hover:text-emerald-900 cursor-pointer"
        >
          Lihat detail
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Hapus
        </button>
      </div>
    </article>
  )
}

function ScanDetailModal({ row, onClose, onDelete, deleting }) {
  const verdict = VERDICT_STYLE[row.verdict] || VERDICT_STYLE.peringatan
  const VerdictIcon = verdict.icon
  const imageSrc = uploadUrl(row.imageRef)
  const title = row.menuName || String(row.menuClass || '').replaceAll('_', ' ') || 'Menu belum dikenali'
  const freshness = freshnessLabel(row.aiClass, row.aiConfidence || 0)
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-5 py-4 text-white ${verdict.gradient}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <VerdictIcon className="h-6 w-6 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold">{verdict.label}</p>
                <p className="truncate font-mono text-[11px] opacity-85">{row.id} · {row.boxId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              className="shrink-0 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            {imageSrc ? (
              <img src={imageSrc} alt={title} className="block w-full h-auto" />
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-1 text-slate-400">
                <ScanLine className="h-8 w-8" />
                <span className="text-[11px] font-semibold">Foto hidangan tidak tersimpan</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">{title}</p>
            {row.menuClass && (
              <p className="mt-1 text-[11px] text-slate-500">
                Prediksi foto: {row.menuDisplay || String(row.menuClass).replaceAll('_', ' ')} · keyakinan {Math.round((row.menuConfidence || 0) * 100)}%
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metadata label="Boks" value={row.boxId || 'Belum tercatat'} />
            <Metadata label="Batch" value={row.batchId || 'Belum ditautkan'} />
            <Metadata label="Token QR" value={row.qrToken || 'Tidak disertakan'} />
            <Metadata label="Waktu scan" value={displayDateTime(row.createdAt)} icon={<Clock className="h-3.5 w-3.5" />} />
            <Metadata label="Suhu holding" value={displayTemp(row.holdingTempC)} />
            <Metadata label="Suhu lepas dapur" value={displayTemp(row.releaseTempC)} />
          </div>

          <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${freshness.includes('tidak') ? 'border-rose-200 bg-rose-50' : freshness.includes('Segar') ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kesegaran hidangan matang</p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900">{freshness}</p>
            </div>
            <span className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${verdict.badge}`}>
              {row.aiConfidence == null || row.aiConfidence === 0 ? '—' : `${Math.round(row.aiConfidence * 100)}%`}
            </span>
          </div>

          {row.reason && (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
              {row.reason}
            </p>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus scan beserta foto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ValidatorFoodScanPage
