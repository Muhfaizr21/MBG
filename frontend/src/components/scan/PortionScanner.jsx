import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
  UploadCloud,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react'
import { fetchNutritionItems, scanRequest } from '../../lib/api'
import { NATIONAL_AKG_STANDARDS } from '../../data/calendarData'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const VERDICT_STYLE = {
  layak: {
    icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
    accent: 'text-emerald-700',
  },
  peringatan: {
    icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
    accent: 'text-amber-700',
  },
  tolak: {
    icon: XCircle,
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'bg-rose-500',
    accent: 'text-rose-700',
  },
}

const MACRO_ROWS = [
  { key: 'energy', label: 'Energi', unit: 'kkal', target: NATIONAL_AKG_STANDARDS.calories.target },
  { key: 'protein', label: 'Protein', unit: 'g', target: NATIONAL_AKG_STANDARDS.protein.target },
  { key: 'carbs', label: 'Karbohidrat', unit: 'g' },
  { key: 'fat', label: 'Lemak', unit: 'g' },
]

function friendlyError(err) {
  switch (err?.status) {
    case 401:
      return 'Sesi berakhir. Silakan login ulang lalu coba lagi.'
    case 403:
      return 'Akun ini tidak memiliki izin scan.submit. Gunakan akun validator (validator@sdn01menteng.sch.id).'
    case 502:
      return 'Layanan AI YOLOv8 tidak dapat dihubungi. Pastikan service ai_service berjalan di port 8083.'
    case 400:
      return err.message || 'Permintaan tidak valid.'
    default:
      return err?.message || 'Tidak bisa menghubungi server. Coba lagi nanti.'
  }
}

/**
 * ==============================================================================
 * PEMINDAI PORSI MBG (web)
 * Drag & drop / upload gambar → POST /api/scans → model AI YOLOv8
 * (klasifikasi kesegaran) + pencocokan bahan pada dataset gizi.
 * ==============================================================================
 */
export function PortionScanner() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [formError, setFormError] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [items, setItems] = useState([])
  const [grams, setGrams] = useState('100')

  const [qrToken, setQrToken] = useState('')
  const [holdingTemp, setHoldingTemp] = useState('')
  const [releaseTemp, setReleaseTemp] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const t = setTimeout(() => {
      fetchNutritionItems(q, 8)
        .then((list) => {
          if (!cancelled) setSuggestions(list)
        })
        .catch(() => {
          if (!cancelled) setSuggestions([])
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  const acceptFile = (next) => {
    setFormError(null)
    setServerError(null)
    if (!next) return
    if (!next.type?.startsWith('image/')) {
      setFormError('File harus berupa gambar (JPG, PNG, atau WEBP).')
      return
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setFormError('Ukuran gambar maksimal 8MB.')
      return
    }
    setFile(next)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(next)
    })
  }

  const clearFile = () => {
    setFile(null)
    setFormError(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const addItem = (name) => {
    const clean = (name || '').trim()
    const g = Number(grams)
    if (!clean) return
    if (!Number.isFinite(g) || g <= 0) {
      setFormError('Gramatur bahan harus berupa angka lebih dari 0.')
      return
    }
    setFormError(null)
    setItems((prev) => [...prev.filter((i) => i.name.toLowerCase() !== clean.toLowerCase()), { name: clean, grams: String(g) }])
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const setItemGrams = (idx, value) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, grams: value } : it)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isAnalyzing) return
    if (!file) {
      setFormError('Pilih atau tarik gambar porsi terlebih dahulu.')
      return
    }
    if (items.some((it) => !Number.isFinite(Number(it.grams)) || Number(it.grams) <= 0)) {
      setFormError('Gramatur setiap bahan harus berupa angka lebih dari 0.')
      return
    }
    setFormError(null)
    setServerError(null)
    setIsAnalyzing(true)
    try {
      const body = await scanRequest({
        image: file,
        qrToken: qrToken.trim(),
        holdingTempC: holdingTemp.trim(),
        releaseTempC: releaseTemp.trim(),
        items: items.map((it) => `${it.name}:${it.grams}`).join(','),
      })
      setResult(body?.data || null)
    } catch (err) {
      setServerError(friendlyError(err))
      setResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const style = result ? VERDICT_STYLE[result.verdict] || VERDICT_STYLE.layak : null
  const VerdictIcon = style?.icon || ShieldCheck
  const suggestionsOpen = showSuggestions && query.trim().length > 0

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ---------------------------------------------------------------- */}
        {/* Kolom kiri: upload + parameter analisis                          */}
        {/* ---------------------------------------------------------------- */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold tracking-tight text-gray-900">
                Foto porsi makanan
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                maks 8MB
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Unggah gambar porsi"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className={`mt-4 relative rounded-2xl border-2 border-dashed transition overflow-hidden cursor-pointer ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-300 bg-gray-50/60 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Pratinjau porsi"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-gray-900/85 to-transparent px-3 py-2.5">
                    <span className="min-w-0 truncate font-mono text-[11px] text-white">
                      {file?.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFile()
                      }}
                      className="shrink-0 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/25 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-5 py-10 text-center">
                  <span
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isDragOver ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    <UploadCloud className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-gray-900">
                    Tarik &amp; lepas gambar ke sini
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    atau klik untuk memilih dari perangkat
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    JPG · PNG · WEBP
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                acceptFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              Gambar dianalisis model <strong className="text-gray-700">YOLOv8</strong> untuk
              klasifikasi kesegaran, lalu dicocokkan dengan dataset gizi nasional.
            </p>
          </div>

          {/* Bahan makanan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold tracking-tight text-gray-900">
                Nama bahan makanan
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                dataset gizi
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const v = e.target.value
                  setQuery(v)
                  if (!v.trim()) setSuggestions([])
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Cari bahan, mis. nasi, ayam goreng, pisang…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition"
              />
              {suggestionsOpen && suggestions.length > 0 && (
                <ul className="absolute z-30 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                  {suggestions.map((s) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addItem(s.name)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 transition"
                      >
                        <span className="min-w-0 truncate text-gray-800">{s.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-gray-400">
                          {s.calories} kkal/100g
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <label className="flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  Gramatur (gram)
                </span>
                <input
                  type="number"
                  min="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-mono text-gray-900 focus:border-gray-900 focus:outline-none transition"
                />
              </label>
              <button
                type="button"
                onClick={() => addItem(query)}
                className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </div>

            {items.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {items.map((it, i) => (
                  <li
                    key={`${it.name}-${i}`}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">
                      {it.name}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={it.grams}
                      onChange={(e) => setItemGrams(i, e.target.value)}
                      aria-label={`Gramatur ${it.name}`}
                      className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right font-mono text-xs text-gray-900 focus:border-gray-900 focus:outline-none"
                    />
                    <span className="font-mono text-[10px] text-gray-400">g</span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label={`Hapus ${it.name}`}
                      className="text-gray-400 hover:text-rose-600 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-3 text-center text-[11px] text-gray-500">
                Belum ada bahan. Tanpa bahan, hasil analisis tetap jalan tetapi data gizi
                tidak ditampilkan.
              </p>
            )}
          </div>

          {/* Parameter boks (opsional) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold tracking-tight text-gray-900">
                Parameter boks <span className="font-normal text-gray-400">(opsional)</span>
              </h2>
              <Clock className="h-4 w-4 text-gray-300" />
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  Token QR boks
                </span>
                <input
                  type="text"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="MBG-2026-SPPG01-SDN01P-B17"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                    Suhu lepas dapur °C
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={releaseTemp}
                    onChange={(e) => setReleaseTemp(e.target.value)}
                    placeholder="78"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition"
                  />
                </label>
                <label className="block">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                    Suhu holding °C
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={holdingTemp}
                    onChange={(e) => setHoldingTemp(e.target.value)}
                    placeholder="65"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition"
                  />
                </label>
              </div>
            </div>
          </div>

          {(formError || serverError) && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError || serverError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3.5 text-sm font-mono font-medium text-white hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-70"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menganalisis porsi…
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                Pindai &amp; Analisis Porsi
              </>
            )}
          </button>
        </form>

        {/* ---------------------------------------------------------------- */}
        {/* Kolom kanan: hasil analisis                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4">
          {isAnalyzing && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300" />
              <p className="mt-4 text-sm font-bold text-gray-900">Menganalisis gambar…</p>
              <p className="mt-1 text-xs text-gray-500">
                Model YOLOv8 memeriksa kesegaran porsi dan mencocokkan bahan dengan dataset gizi.
              </p>
            </div>
          )}

          {!isAnalyzing && !result && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border border-gray-200">
                <ImagePlus className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-gray-900">Belum ada hasil analisis</p>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                Unggah foto porsi, isi bahan makanan, lalu tekan tombol pindai untuk melihat
                penilaian kelayakan, nama bahan, dan data gizinya.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-left">
                {[
                  { icon: ShieldCheck, label: 'Skor kelayakan', hint: '0–100' },
                  { icon: Flame, label: 'Kesegaran AI', hint: 'Fresh/Spoiled' },
                  { icon: UtensilsCrossed, label: 'Data gizi', hint: 'per porsi' },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                    <c.icon className="h-4 w-4 text-gray-400" />
                    <p className="mt-2 text-[11px] font-bold text-gray-800">{c.label}</p>
                    <p className="font-mono text-[10px] text-gray-400">{c.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAnalyzing && result && (
            <>
              {/* Kartu keputusan */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-stretch">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Porsi yang dianalisis"
                      className="hidden sm:block w-40 object-cover border-r border-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide ${style.chip}`}
                      >
                        <VerdictIcon className="h-3.5 w-3.5" />
                        {result.verdictLabel}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                        {result.id}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end gap-4">
                      <div>
                        <p className={`text-5xl font-black leading-none font-mono ${style.accent}`}>
                          {Math.round(result.score)}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                          skor kelayakan
                        </p>
                      </div>
                      <div className="pb-1 text-xs text-gray-500 leading-relaxed">
                        <p className="flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-gray-400" />
                          <strong className="text-gray-800">{result.aiClass}</strong> ·
                          keyakinan {(Number(result.aiConfidence) * 100).toFixed(1)}%
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-gray-400">
                          {result.scannedAt}
                          {result.aiLatencyMs ? ` · ${Math.round(result.aiLatencyMs)}ms` : ''}
                        </p>
                      </div>
                    </div>

                    {result.note && (
                      <p className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
                        {result.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Checklist pemeriksaan */}
                {Array.isArray(result.checks) && result.checks.length > 0 && (
                  <ul className="border-t border-gray-100 divide-y divide-gray-100">
                    {result.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-3 px-5 py-3">
                        {c.ok ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800">{c.label}</p>
                          <p className="text-[11px] text-gray-500">{c.note}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Makronutrien */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold tracking-tight text-gray-900">
                    Estimasi makronutrien per porsi
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    hitung backend
                  </span>
                </div>

                {result.macros ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MACRO_ROWS.map((row) => {
                      const value = Number(result.macros[row.key] ?? 0)
                      const pct = row.target
                        ? Math.min(100, Math.round((value / row.target) * 100))
                        : null
                      return (
                        <div key={row.key} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                            {row.label}
                          </p>
                          <p className="mt-1 font-mono text-lg font-extrabold text-gray-900 leading-none">
                            {value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                            <span className="text-xs font-semibold text-gray-400"> {row.unit}</span>
                          </p>
                          {pct !== null && (
                            <>
                              <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${style.bar}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="mt-1 font-mono text-[9px] text-gray-400">
                                {pct}% AKG ({row.target} {row.unit})
                              </p>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">
                    Data makronutrien tidak tersedia. Tambahkan bahan makanan lalu pindai ulang.
                  </p>
                )}
              </section>

              {/* Nama bahan + data gizi */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold tracking-tight text-gray-900">
                    Nama makanan &amp; data gizi
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    {result.nutrition?.length || 0} bahan cocok
                  </span>
                </div>

                {Array.isArray(result.nutrition) && result.nutrition.length > 0 ? (
                  <>
                    <div className="mt-3 overflow-x-auto -mx-1 px-1">
                      <table className="w-full min-w-[520px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                            <th className="py-2 pr-3 font-semibold">Bahan</th>
                            <th className="py-2 pr-3 font-semibold">Cocok dengan</th>
                            <th className="py-2 pr-3 text-right font-semibold">Porsi</th>
                            <th className="py-2 pr-3 text-right font-semibold">Energi</th>
                            <th className="py-2 pr-3 text-right font-semibold">Protein</th>
                            <th className="py-2 pr-3 text-right font-semibold">Lemak</th>
                            <th className="py-2 text-right font-semibold">Karbo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {result.nutrition.map((n, i) => (
                            <tr key={`${n.name}-${i}`}>
                              <td className="py-2 pr-3 font-semibold text-gray-900">{n.name}</td>
                              <td className="py-2 pr-3 text-gray-500">{n.matchedTo}</td>
                              <td className="py-2 pr-3 text-right font-mono text-gray-700">
                                {n.weightG} g
                              </td>
                              <td className="py-2 pr-3 text-right font-mono text-gray-700">
                                {n.energy}
                              </td>
                              <td className="py-2 pr-3 text-right font-mono text-gray-700">
                                {n.protein}
                              </td>
                              <td className="py-2 pr-3 text-right font-mono text-gray-700">
                                {n.fat}
                              </td>
                              <td className="py-2 text-right font-mono text-gray-700">
                                {n.carbs}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {result.nutritionNote && (
                      <p className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                        <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
                        {result.nutritionNote}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-[11px] text-gray-500">
                    Belum ada bahan yang dicocokkan. Tambahkan nama bahan makanan di kolom kiri,
                    lalu pindai ulang untuk menampilkan data gizi per bahan.
                  </p>
                )}
              </section>

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-500 px-1">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
                Hasil pemindaian tersimpan pada log scan sebagai bukti audit boks.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
