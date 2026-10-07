import { useState, useCallback } from 'react'
import {
  ClipboardCheck,
  Thermometer,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PenLine,
  Trash2,
  FileSignature,
  Package,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { MASTER_TOTES, QUOTA_BOARD, FLEET_STATUS } from '../../data/validatorData'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: SERAH TERIMA & BAST DIGITAL
 * URL: /validator/handover
 * VALIDATOR.md Bab 3: scan Master QR kontainer (13× untuk 650 porsi),
 * input suhu holding (≥60°C), rekonsiliasi porsi, tanda tangan digital 2 pihak.
 * ==============================================================================
 */

const TEMP_MIN_WARM = 60
const TEMP_DANGER = 55

// Kanvas tanda tangan ringan berbasis SVG (stroke disimpan sebagai state).
function SignaturePad({ label, sublabel, strokes, onChange, accent }) {
  const [drawing, setDrawing] = useState(false)

  const pointFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Number(((e.clientX - rect.left) / rect.width).toFixed(4)),
      y: Number(((e.clientY - rect.top) / rect.height).toFixed(4)),
    }
  }

  const handleDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrawing(true)
    onChange([...strokes, [pointFromEvent(e)]])
  }

  const handleMove = (e) => {
    if (!drawing) return
    const p = pointFromEvent(e)
    onChange(
      strokes.map((stroke, i) =>
        i === strokes.length - 1 ? [...stroke, p] : stroke,
      ),
    )
  }

  const handleUp = () => setDrawing(false)

  const toPath = (stroke) =>
    stroke.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${p.y * 100}`).join(' ')

  const hasInk = strokes.some((s) => s.length > 1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800">{label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={!hasInk}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-transparent transition cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          Hapus
        </button>
      </div>

      <div
        role="presentation"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        className={`mt-3 h-32 rounded-xl border-2 border-dashed touch-none cursor-crosshair relative overflow-hidden ${
          hasInk ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {strokes.map((stroke, i) =>
            stroke.length > 1 ? (
              <path
                key={i}
                d={toPath(stroke)}
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )}
        </svg>

        {!hasInk && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PenLine className="h-5 w-5 text-slate-300" />
            <p className="mt-1 text-[10px] font-semibold text-slate-400">Tanda tangan di sini</p>
          </div>
        )}

        <div className="absolute bottom-2 left-3 right-3 border-t border-dashed border-slate-300 pointer-events-none" />
      </div>
    </div>
  )
}

function Toast({ message, tone = 'info' }) {
  const tones = {
    info: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
  }
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs animate-in fade-in ${tones[tone]}`}
    >
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      <p className="leading-relaxed font-medium">{message}</p>
    </div>
  )
}

export function ValidatorHandoverPage() {
  const { user } = useAuth()

  const [received, setReceived] = useState(
    () => MASTER_TOTES.filter((t) => t.status === 'received'),
  )
  const [tempInput, setTempInput] = useState('')
  const [tempLogs, setTempLogs] = useState(() =>
    MASTER_TOTES.filter((t) => t.status === 'received').map((t) => ({
      toteId: t.id,
      temp: t.tempCelsius,
    })),
  )
  const [driverStrokes, setDriverStrokes] = useState([])
  const [validatorStrokes, setValidatorStrokes] = useState([])
  const [issued, setIssued] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 4500)
  }

  const scanNextTote = () => {
    const res = guardAdminAction(
      user,
      'ValidatorHandover',
      'pindai master tote',
      { next: MASTER_TOTES.length },
      ['handover.bast'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    const next = MASTER_TOTES.find((t) => !received.some((r) => r.id === t.id))
    if (!next) {
      showToast('Seluruh 13 master tote sudah dipindai.', 'success')
      return
    }
    setReceived((prev) => [...prev, next])
    if (next.tempCelsius != null) {
      setTempLogs((prev) => [...prev, { toteId: next.id, temp: next.tempCelsius }])
    }
    showToast(`Master tote ${next.id} diterima (${next.portions} porsi).`, 'success')
  }

  const addTemp = () => {
    const value = parseFloat(String(tempInput).replace(',', '.'))
    if (Number.isNaN(value)) {
      showToast('Masukkan angka suhu yang valid (contoh: 63.5).', 'error')
      return
    }
    const res = guardAdminAction(
      user,
      'ValidatorHandover',
      'input suhu holding',
      { temp: value },
      ['handover.bast'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    if (value < TEMP_DANGER) {
      showToast(
        `${value}°C masuk zona bahaya (< ${TEMP_DANGER}°C). Makanan berisiko dingin — wajib uji organoleptik sebelum distribusi.`,
        'error',
      )
      return
    }
    if (value < TEMP_MIN_WARM) {
      showToast(
        `${value}°C di bawah ambang aman ${TEMP_MIN_WARM}°C — konsumsi segera & instruksikan pembagian cepat ke kelas.`,
        'info',
      )
    } else {
      showToast(`${value}°C — sesuai standar holding ≥ ${TEMP_MIN_WARM}°C.`, 'success')
    }
    setTempLogs((prev) => [...prev, { toteId: 'Manual', temp: value }])
    setTempInput('')
  }

  const issuedNumber = `BAST/MBG-JKT/20261006/SDN01P-042`
  const receivedPortions = received.reduce((sum, t) => sum + t.portions, 0)
  const orderedPortions = QUOTA_BOARD.targetPortions
  const damagedPortions = orderedPortions - receivedPortions

  const tempValues = tempLogs.map((l) => l.temp).filter((v) => v != null)
  const avgTemp = tempValues.length
    ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1)
    : null
  const belowStandard = tempValues.filter((v) => v < TEMP_MIN_WARM).length

  const canIssue =
    received.length === MASTER_TOTES.length &&
    driverStrokes.some((s) => s.length > 1) &&
    validatorStrokes.some((s) => s.length > 1) &&
    !issued

  const issueBast = () => {
    const res = guardAdminAction(
      user,
      'ValidatorHandover',
      'terbitkan BAST',
      { refNumber: issuedNumber, totes: received.length, portions: receivedPortions },
      ['handover.bast'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    if (!canIssue) {
      const reasons = []
      if (received.length < MASTER_TOTES.length)
        reasons.push(`master tote belum lengkap (${received.length}/${MASTER_TOTES.length})`)
      if (!driverStrokes.some((s) => s.length > 1)) reasons.push('tanda tangan sopir belum ada')
      if (!validatorStrokes.some((s) => s.length > 1)) reasons.push('tanda tangan validator belum ada')
      showToast(`Belum dapat diterbitkan: ${reasons.join('; ')}.`, 'error')
      return
    }
    setIssued({
      refNumber: issuedNumber,
      at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      totes: received.length,
      portions: receivedPortions,
    })
    showToast('BAST terbit & salinan dikirim ke SPPG Dapur dan Satgas MBG.', 'success')
  }

  const stageDone = useCallback(() => received.length === MASTER_TOTES.length, [received.length])

  return (
    <ValidatorLayout activeMenu="handover" title="Serah Terima & BAST Digital" badge="BERITA ACARA">
      {toast && <Toast message={toast.message} tone={toast.tone} />}

      {/* Header ringkas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Master Tote Diterima', value: `${received.length}/${MASTER_TOTES.length}`, sub: `@${QUOTA_BOARD.toteCapacity} porsi`, tone: 'text-slate-900' },
          { label: 'Porsi Diterima', value: receivedPortions, sub: `dari ${orderedPortions} dipesan`, tone: 'text-emerald-700' },
          { label: 'Selisih / Rusak', value: damagedPortions, sub: damagedPortions > 0 ? 'perlu rekonsiliasi' : 'sesuai pesanan', tone: damagedPortions > 0 ? 'text-rose-600' : 'text-emerald-700' },
          { label: 'Rata-rata Suhu Holding', value: avgTemp ? `${avgTemp}°C` : '—', sub: `${belowStandard} di bawah 60°C`, tone: belowStandard > 0 ? 'text-amber-600' : 'text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`text-xl font-extrabold mt-1 font-mono ${s.tone}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tahap 1: scan master tote */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">
              1 · Pindai Master QR Kontainer
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {received.length}/{MASTER_TOTES.length} scan
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Cukup {MASTER_TOTES.length} scan kontainer termal (1 = 50 porsi) — tanpa memindai{' '}
            {orderedPortions} boks kecil satu per satu di gerbang sekolah.
          </p>

          <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
            {MASTER_TOTES.map((t) => {
              const isReceived = received.some((r) => r.id === t.id)
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-2 text-center ${
                    isReceived
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-dashed border-slate-300'
                  }`}
                  title={t.qr}
                >
                  <QrCode
                    className={`h-5 w-5 mx-auto ${isReceived ? 'text-emerald-600' : 'text-slate-300'}`}
                    strokeWidth={1.6}
                  />
                  <p
                    className={`mt-1 font-mono text-[9px] font-bold ${
                      isReceived ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {t.id}
                  </p>
                  <p className="font-mono text-[9px] text-slate-400">{t.portions}p</p>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={scanNextTote}
            disabled={stageDone()}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition shadow-sm ${
              stageDone()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'
            }`}
          >
            <Package className="h-4 w-4" />
            {stageDone()
              ? 'Semua Master Tote Diterima'
              : `Pindai Master Tote Berikutnya (${MASTER_TOTES.length - received.length} lagi)`}
          </button>
        </section>

        {/* Tahap 2: suhu holding */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold tracking-tight">
              2 · Catat Suhu Fisik Penerimaan
            </h2>
            <Thermometer className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Standar hidangan hangat <strong>≥ {TEMP_MIN_WARM}°C</strong>; susu UHT / buah dingin 4–8°C.
            Di bawah {TEMP_DANGER}°C (zona bahaya) sistem mewajibkan uji organoleptik.
          </p>

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                inputMode="decimal"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTemp()
                }}
                placeholder="contoh: 63.5"
                className="w-full pl-9 pr-4 py-3 text-sm font-mono rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
            <button
              type="button"
              onClick={addTemp}
              className="rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Catat
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 max-h-44 overflow-y-auto divide-y divide-slate-100">
            {tempLogs.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] text-slate-400">
                Belum ada suhu tercatat.
              </p>
            ) : (
              tempLogs.map((log, i) => {
                const ok = log.temp >= TEMP_MIN_WARM
                const danger = log.temp < TEMP_DANGER
                return (
                  <div key={`${log.toteId}-${i}`} className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-600">{log.toteId}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-extrabold ${
                        danger ? 'text-rose-600' : ok ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {danger ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {log.temp}°C
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Rekonsiliasi */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 border border-slate-100 py-2.5">
              <p className="font-mono font-extrabold text-sm">{orderedPortions}</p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Dipesan</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-2.5">
              <p className="font-mono font-extrabold text-sm text-emerald-700">{receivedPortions}</p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Diterima utuh</p>
            </div>
            <div
              className={`rounded-xl border py-2.5 ${
                damagedPortions > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <p
                className={`font-mono font-extrabold text-sm ${
                  damagedPortions > 0 ? 'text-rose-600' : ''
                }`}
              >
                {damagedPortions}
              </p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">Bocor / Rusak</p>
            </div>
          </div>
        </section>
      </div>

      {/* Tahap 3: tanda tangan + terbitkan */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">
            3 · Lembar Tanda Tangan Digital BAST
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {issuedNumber}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignaturePad
            label="Pihak Pertama — Sopir / Petugas Pengantar SPPG"
            sublabel={`${FLEET_STATUS.driver} · ${FLEET_STATUS.unit}`}
            strokes={driverStrokes}
            onChange={setDriverStrokes}
            accent="#b45309"
          />
          <SignaturePad
            label="Pihak Kedua — Guru Validator / PIC Sekolah"
            sublabel={`${user?.fullName || 'Validator Sekolah'} · ${user?.schoolName || 'SDN 01 Menteng Pagi'}`}
            strokes={validatorStrokes}
            onChange={setValidatorStrokes}
            accent="#0f766e"
          />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Nomor Registrasi BAST (otomatis)
            </p>
            <p className="font-mono font-extrabold text-sm text-slate-800 truncate">{issuedNumber}</p>
          </div>
          <button
            type="button"
            onClick={issueBast}
            disabled={!!issued}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition shadow-sm ${
              issued
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : canIssue
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {issued ? <CheckCircle2 className="h-4 w-4" /> : <FileSignature className="h-4 w-4" />}
            {issued ? 'BAST Terbit & Terkirim' : 'Terbitkan & Kirim Salinan BAST'}
          </button>
        </div>

        {issued ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
            <p className="font-extrabold">
              <ClipboardCheck className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              {issued.refNumber} resmi terbit pukul {issued.at}.
            </p>
            <p className="mt-1 leading-relaxed">
              {issued.totes} master tote · {issued.portions} porsi. Salinan dikirim ke sistem SPPG Dapur
              01 Menteng Sentral dan Satgas MBG (dokumen berkekuatan hukum — penerimaan dianggap sah).
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
            Syarat terbit: seluruh {MASTER_TOTES.length} master tote dipindai, suhu holding tercatat, dan
            kedua tanda tangan digital diisi. Salinan otomatis dikirim ke SPPG Dapur & Satgas MBG.
          </p>
        )}
      </section>
    </ValidatorLayout>
  )
}

export default ValidatorHandoverPage
