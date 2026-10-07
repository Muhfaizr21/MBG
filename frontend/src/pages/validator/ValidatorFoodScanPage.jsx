import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ScanLine,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import {
  scanRequest,
  fetchNutritionItems,
  fetchRecentScans,
} from '../../lib/api'
import { ImageCapturePanel } from '../../components/shared/ImageCapturePanel'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: SCAN MAKANAN (drag & drop foto → AI + dataset gizi)
 * URL: /validator/foodscan — guard roles ['validator','superadmin'].
 * Foto dianalisis model AI kesegaran (YOLOv8-cls) lewat POST /api/scans,
 * lalu bahan yang dipetik dari dataset gizi dihitung jadi nama makanan + data
 * gizi per bahan dan total makronutrien.
 * ==============================================================================
 */

const MAX_IMAGE_BYTES = 8 << 20 // 8 MB — sama dengan batas backend

const VERDICT_STYLE = {
  layak: {
    gradient: 'from-emerald-600 to-teal-600',
    icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  peringatan: {
    gradient: 'from-amber-500 to-orange-500',
    icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  tolak: {
    gradient: 'from-rose-600 to-red-600',
    icon: XCircle,
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

const MACRO_ROWS = [
  { key: 'energy', label: 'Energi', unit: 'kkal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Karbohidrat', unit: 'g' },
  { key: 'fat', label: 'Lemak', unit: 'g' },
]

const FRESH_LABEL = {
  Fresh: 'Segar / Layak',
  Spoiled: 'Busuk / Tidak Layak',
}

function buildBoxId() {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BOK-FOTO-${y}${m}${day}-${rand}`
}

function errMessage(err) {
  if (err?.status === 502) return 'Layanan AI belum aktif di server (port 8083). Nyalakan ai_service lalu coba lagi.'
  if (err?.status === 403) return 'Akun ini tidak memiliki izin scan.submit — gunakan akun validator.'
  if (err?.status === 401) return 'Sesi berakhir. Silakan login ulang.'
  if (err?.status === 400) return err.message || 'Gambar tidak valid. Gunakan foto JPG/PNG maksimal 8MB.'
  if (err?.status === 500) return 'Backend gagal memproses pemindaian. Coba foto lain.'
  return err?.message || 'Tidak bisa terhubung ke server.'
}

export function ValidatorFoodScanPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [formError, setFormError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [items, setItems] = useState([])
  const [recent, setRecent] = useState([])


  // Riwayat scan terbaru (diamankan bila izin tidak ada).
  useEffect(() => {
    let alive = true
    fetchRecentScans(8)
      .then((rows) => {
        if (alive) setRecent(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Saran bahan dari dataset gizi (debounce 300ms).
  useEffect(() => {
    const q = query.trim()
    const t = setTimeout(() => {
      fetchNutritionItems(q)
        .then((rows) => setSuggestions(Array.isArray(rows) ? rows.slice(0, 8) : []))
        .catch(() => setSuggestions([]))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Callback dari ImageCapturePanel: blob sudah dalam format WebP
  const acceptFile = useCallback((blob, previewUrl) => {
    if (!blob) {
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setResult(null)
      setFormError(null)
      return
    }
    setFormError(null)
    setActionError(null)
    setResult(null)
    setFile(new File([blob], 'scan.webp', { type: 'image/webp' }))
    setPreview(previewUrl)
  }, [preview])

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFile(null)
    setResult(null)
    setFormError(null)
  }

  const addItem = (row) => {
    if (!row?.name) return
    setItems((prev) =>
      prev.some((i) => i.name === row.name) ? prev : [...prev, { name: row.name, weightG: 100 }],
    )
    setQuery('')
    setSuggestions([])
  }

  const setWeight = (name, value) => {
    const grams = Number(value)
    setItems((prev) =>
      prev.map((i) =>
        i.name === name ? { ...i, weightG: Number.isFinite(grams) && grams > 0 ? grams : 0 } : i,
      ),
    )
  }

  const removeItem = (name) => setItems((prev) => prev.filter((i) => i.name !== name))

  const handleAnalyze = async () => {
    if (!file) {
      setFormError('Tarik atau pilih foto makanan terlebih dahulu.')
      return
    }
    const usable = items.filter((i) => i.name && i.weightG > 0)
    if (usable.length === 0) {
      setFormError('Pilih minimal satu bahan makanan agar data gizi bisa dihitung.')
      return
    }
    setFormError(null)
    setActionError(null)
    setAnalyzing(true)
    try {
      const body = await scanRequest({
        image: file,
        boxId: buildBoxId(),
        items: usable.map((i) => `${i.name}:${i.weightG}`).join(','),
      })
      setResult(body.data)
      fetchRecentScans(8)
        .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
        .catch(() => {})
    } catch (err) {
      setActionError(errMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const style = result ? VERDICT_STYLE[result.verdict] : null
  const VerdictIcon = style?.icon || ShieldCheck
  const aiLabel = result ? FRESH_LABEL[result.aiClass] || result.aiClass : null

  return (
    <ValidatorLayout
      activeMenu="foodscan"
      title="Scan Makanan AI"
      badge="YOLOv8 + DATASET GIZI"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ============ Kolom kiri: unggah & bahan ============ */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">Foto makanan untuk dianalisis</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              Auto WebP · maks 8MB
            </span>
          </div>

          {/* Panel kamera & upload — konversi otomatis ke WebP */}
          <div className="mt-4">
            <ImageCapturePanel
              onCapture={acceptFile}
              disabled={analyzing}
              label=""
              hint="Foto piring atau boks makanan — kamera atau upload. Otomatis WebP sebelum dikirim ke AI."
            />
          </div>

          {formError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
              {formError}
            </p>
          )}

          {/* Pemilih bahan → sumber "nama makanan" + data gizi */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Bahan makanan pada foto
              </span>
              <span className="font-mono text-[10px] text-slate-400">{items.length} dipilih</span>
            </div>

            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari bahan, mis. nasi, ayam goreng, pisang…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
              {query.trim() && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {suggestions.map((s) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        onClick={() => addItem(s)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {s.calories} kkal · P {s.protein}g · L {s.fat}g · K {s.carbohydrate}g
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Belum ada bahan. Cari nama makanan yang terlihat pada foto — data gizi dihitung dari
                dataset gizi nasional per 100 gram.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {items.map((it) => (
                  <li
                    key={it.name}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-bold text-emerald-900">{it.name}</span>
                    <input
                      type="number"
                      min="1"
                      value={it.weightG}
                      onChange={(e) => setWeight(it.name, e.target.value)}
                      className="w-14 rounded-md border border-emerald-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 focus:outline-none"
                      aria-label={`Gramatur ${it.name}`}
                    />
                    <span className="font-mono text-[10px] text-emerald-700">g</span>
                    <button
                      type="button"
                      onClick={() => removeItem(it.name)}
                      className="text-emerald-700 hover:text-rose-600 cursor-pointer"
                      aria-label={`Hapus ${it.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {actionError && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
              {actionError}
            </p>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold transition shadow-sm ${
              analyzing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
            }`}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menganalisis dengan model AI…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisis Makanan (AI + Gizi)
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
            Foto dikirim ke <span className="font-mono">POST /api/scans</span> → model YOLOv8-cls
            menilai kesegaran, dataset gizi menghitung nama bahan &amp; makronutriennya.
          </p>
        </section>

        {/* ============ Kolom kanan: hasil ============ */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden self-start">
          <div
            className={`px-5 py-4 text-white bg-gradient-to-r ${
              result ? style.gradient : 'from-slate-700 to-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <VerdictIcon className="h-7 w-7" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm tracking-tight">
                  {result ? result.verdictLabel : 'Hasil Analisis Makanan'}
                </p>
                <p className="text-[11px] font-mono opacity-85">
                  {result ? `${result.id} · ${result.boxId}` : 'menunggu unggahan foto'}
                </p>
              </div>
            </div>
            {result && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-mono opacity-90">
                  <span>Skor kesegaran</span>
                  <span className="font-extrabold">{result.score}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, result.score))}%` }}
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
                  Unggah foto makanan, pilih bahan yang terlihat, lalu tekan tombol analisis untuk
                  memunculkan verdict AI, nama makanan, dan data gizinya.
                </p>
              </div>
            ) : (
              <>
                {/* Kesegaran menurut model AI */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Model AI (YOLOv8-cls)
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">{aiLabel}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${
                      result.aiClass === 'Fresh'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {Math.round((result.aiConfidence || 0) * 100)}% keyakinan
                  </span>
                </div>

                {/* Nama makanan + data gizi per bahan */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Nama makanan &amp; data gizi
                  </p>
                  {result.nutrition?.length > 0 ? (
                    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-2.5 py-2 font-bold">Bahan</th>
                            <th className="px-2.5 py-2 font-bold">Berat</th>
                            <th className="px-2.5 py-2 font-bold text-right">kkal</th>
                            <th className="px-2.5 py-2 font-bold text-right">P</th>
                            <th className="px-2.5 py-2 font-bold text-right">K</th>
                            <th className="px-2.5 py-2 font-bold text-right">L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.nutrition.map((n) => (
                            <tr key={n.name}>
                              <td className="px-2.5 py-2">
                                <span className="block font-bold text-slate-800">{n.name}</span>
                                {n.matchedTo && n.matchedTo !== n.name && (
                                  <span className="block font-mono text-[9px] text-slate-400">
                                    cocok: {n.matchedTo}
                                  </span>
                                )}
                              </td>
                              <td className="px-2.5 py-2 font-mono text-slate-500">
                                {n.weightG}g
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono font-bold text-slate-800">
                                {n.energy}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono text-slate-600">
                                {n.protein}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono text-slate-600">
                                {n.carbs}
                              </td>
                              <td className="px-2.5 py-2 text-right font-mono text-slate-600">
                                {n.fat}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {result.nutritionNote || 'Tidak ada bahan yang cocok dengan dataset gizi.'}
                    </p>
                  )}
                  {result.nutritionNote && result.nutrition?.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-400">{result.nutritionNote}</p>
                  )}
                </div>

                {/* Total makronutrien */}
                {result.macros && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Total gizi porsi
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {MACRO_ROWS.map((m) => (
                        <div key={m.key} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                          <p className="text-[10px] font-semibold text-slate-500">{m.label}</p>
                          <p className="font-mono font-extrabold text-sm">
                            {result.macros[m.key] ?? 0}
                            <span className="text-[10px] font-semibold text-slate-400"> {m.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist pemeriksaan */}
                <div className="space-y-2">
                  {result.checks?.map((c) => (
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

      {/* Riwayat scan terbaru */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">Riwayat scan terbaru</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {recent.length} entri
          </span>
        </div>

        {recent.length === 0 ? (
          <div className="mt-4 py-8 text-center border border-dashed border-slate-200 rounded-xl">
            <ScanLine className="h-8 w-8 mx-auto text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-500">Belum ada riwayat pemindaian</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((row) => {
              const v = VERDICT_STYLE[row.verdict] || VERDICT_STYLE.tolak
              const RowIcon = v.icon
              return (
                <li key={row.id} className="py-2.5 flex items-center gap-3">
                  <span
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      row.verdict === 'layak'
                        ? 'bg-emerald-50 text-emerald-600'
                        : row.verdict === 'peringatan'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    <RowIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      {row.boxId}{' '}
                      <span className="font-mono font-normal text-slate-400">· {row.id}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {row.aiClass || '—'} · skor {Math.round(row.visualScore || 0)}%
                      {row.imageRef ? ` · ${row.imageRef}` : ''}
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

export default ValidatorFoodScanPage
