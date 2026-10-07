import { useState } from 'react'
import {
  Siren,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Send,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import { ValidatorLayout } from '../../components/layout/ValidatorLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import {
  INCIDENT_CATEGORIES,
  SEVERITY_LEVELS,
  PROTOCOL_STEPS,
  INCIDENT_TICKETS,
} from '../../data/validatorData'

/**
 * ==============================================================================
 * PORTAL VALIDATOR: LAPOR INSIDEN CEPAT (PANIC BUTTON)
 * URL: /validator/incidents
 * VALIDATOR.md Bab 4: kategori terstruktur, foto bukti watermark, severity,
 * protokol tindakan pertama, pelacak status tiket real-time.
 * ==============================================================================
 */

const SEVERITY_CHIP = {
  low: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-orange-50 text-orange-700 border-orange-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
}

const SEVERITY_DOT = {
  low: 'bg-amber-500',
  medium: 'bg-orange-500',
  high: 'bg-rose-600',
}

const EVIDENCE_SLOTS = [
  { id: 1, watermark: 'Foto 1 · kondisi utama' },
  { id: 2, watermark: 'Foto 2 · detail kontaminasi' },
  { id: 3, watermark: 'Foto 3 · kemasan / label batch' },
]

export function ValidatorIncidentsPage() {
  const { user } = useAuth()

  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('low')
  const [photos, setPhotos] = useState([])
  const [description, setDescription] = useState('')
  const [tickets, setTickets] = useState(INCIDENT_TICKETS)
  const [toast, setToast] = useState(null)
  const [showProtocol, setShowProtocol] = useState(true)

  const showToast = (message, tone = 'info') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 4500)
  }

  const tones = {
    info: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
  }

  const togglePhoto = (slotId) => {
    setPhotos((prev) =>
      prev.includes(slotId) ? prev.filter((p) => p !== slotId) : [...prev, slotId],
    )
  }

  const submitReport = () => {
    const res = guardAdminAction(
      user,
      'ValidatorIncidents',
      'kirim laporan insiden siaga',
      { category, severity, photos: photos.length, desc: description.slice(0, 60) },
      ['incident.submit'],
    )
    if (!res.allowed) {
      showToast(res.message, 'error')
      return
    }
    if (!category) {
      showToast('Pilih kategori insiden terlebih dahulu.', 'error')
      return
    }

    const cat = INCIDENT_CATEGORIES.find((c) => c.id === category)
    const sev = SEVERITY_LEVELS.find((s) => s.id === severity)
    const nextNo = String(tickets.length + 5).padStart(2, '0')
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

    const newTicket = {
      id: `INS/JKT/1006/${nextNo}`,
      category: cat.label,
      severity,
      severityLabel: sev.label,
      openedAt: now,
      status: 'in_progress',
      statusLabel: 'Sedang Ditindaklanjuti',
      handler: severity === 'high' ? 'Satgas MBG Pusat (Push Siren)' : 'Manajer Dapur SPPG 01 Menteng Sentral',
      timeline: [
        { label: 'Terkirim', time: now, done: true },
        { label: 'Diinvestigasi Tim Medis', time: '—', done: false },
        { label: 'Pasokan Pengganti Dikirim', time: '—', done: false },
        { label: 'Selesai', time: '—', done: false },
      ],
      note: description || cat.desc,
      fresh: true,
    }

    setTickets((prev) => [newTicket, ...prev])
    setCategory('')
    setPhotos([])
    setDescription('')
    showToast(
      severity === 'high'
        ? `Tiket ${newTicket.id} terbit — sirene Satgas MBG & Manajer Dapur berbunyi, seluruh boks diisolasi.`
        : `Laporan ${newTicket.id} terkirim ke Satgas MBG.`,
      'success',
    )
  }

  const selectedCat = INCIDENT_CATEGORIES.find((c) => c.id === category)
  const selectedSev = SEVERITY_LEVELS.find((s) => s.id === severity)

  return (
    <ValidatorLayout activeMenu="incidents" title="Lapor Insiden Cepat" badge="PANIC BUTTON">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs animate-in fade-in ${tones[toast.tone]}`}
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
          <p className="leading-relaxed font-medium">{toast.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form laporan */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Siren className="h-4 w-4 text-rose-600" />
              <h2 className="text-sm font-extrabold tracking-tight">Formulir eskalasi darurat makanan</h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Laporkan tanda-tanda makanan basi, benda asing, atau siswa yang mengeluh sakit agar Satgas MBG
              dapat segera menghentikan distribusi batch di sekolah-sekolah lain.
            </p>
          </div>

          {/* Kategori */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              1 · Kategori insiden
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INCIDENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                    category === c.id
                      ? 'border-rose-300 bg-rose-50/70 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{c.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Foto bukti */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              2 · Foto bukti (maks. 3, otomatis ter-watermark)
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EVIDENCE_SLOTS.map((slot) => {
                const filled = photos.includes(slot.id)
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => togglePhoto(slot.id)}
                    className={`relative rounded-xl border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      filled
                        ? 'border-amber-400 bg-amber-50/70'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {filled ? (
                      <ImageIcon className="h-6 w-6 text-amber-600" />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    <span className="text-[10px] font-semibold text-slate-500">
                      {filled ? 'Foto tersimpan' : 'Ambil foto'}
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 font-mono text-[8px] text-slate-500 bg-white/80 rounded px-1 py-0.5 truncate">
                      {slot.watermark} · 06 Okt 2026 · NPSN 33.210.130
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              3 · Derajat keparahan
            </p>
            <div className="mt-2 space-y-2">
              {SEVERITY_LEVELS.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    severity === s.id
                      ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={s.id}
                    checked={severity === s.id}
                    onChange={() => setSeverity(s.id)}
                    className="mt-1 accent-rose-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[s.id]}`} />
                      <span className="text-xs font-bold text-slate-800">{s.label}</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{s.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              4 · Kronologi singkat
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Contoh: ditemukan 2 boks dengan aroma asam di Kelas 3B pukul 07:26, siswa sempat mencicipi 1 sendok…"
              className="mt-2 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition resize-y"
            />
          </div>

          <button
            type="button"
            onClick={submitReport}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white px-4 py-3.5 text-sm font-extrabold hover:bg-rose-700 transition shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <Radio className="h-4 w-4" />
            Kirim Laporan Siaga ke Satgas MBG
          </button>

          {selectedSev?.id === 'high' && (
            <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 leading-relaxed">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
              Tingkat <strong>Darurat Merah</strong>: push sirene akan berbunyi di dasbor Satgas MBG dan
              Manajer Dapur SPPG. Isolasi seluruh boks makanan di sekolah sekarang juga.
            </p>
          )}
        </section>

        {/* Protokol + kontak */}
        <section className="space-y-5 self-start">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <button
              type="button"
              onClick={() => setShowProtocol((v) => !v)}
              className="w-full flex items-center justify-between gap-2 cursor-pointer"
            >
              <h2 className="text-sm font-extrabold tracking-tight text-left">
                Protokol tindakan pertama
              </h2>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform ${showProtocol ? 'rotate-90' : ''}`}
              />
            </button>

            {showProtocol && (
              <ol className="mt-3 space-y-3">
                {PROTOCOL_STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 text-[11px] font-extrabold font-mono">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h2 className="text-sm font-extrabold tracking-tight">Kategori terpilih</h2>
            {selectedCat ? (
              <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs font-bold text-slate-800">{selectedCat.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{selectedCat.desc}</p>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-wide text-slate-400">
                  severity: {selectedSev?.label}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">Belum ada kategori dipilih.</p>
            )}
          </div>
        </section>
      </div>

      {/* Pelacak status tiket */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold tracking-tight">Pelacak status tiket insiden</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {tickets.length} tiket
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {tickets.map((t) => (
            <article
              key={t.id}
              className={`rounded-2xl border p-4 ${
                t.fresh ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-xs font-extrabold text-slate-800">{t.id}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_CHIP[t.severity]}`}
                    >
                      {t.severityLabel}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.statusLabel}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{t.category}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.note}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dibuka {t.openedAt} · penanganan: {t.handler}
                  </p>
                </div>
              </div>

              <ol className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {t.timeline.map((step) => (
                  <li
                    key={step.label}
                    className={`rounded-xl border px-2.5 py-2 ${
                      step.done
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-white border-dashed border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <p
                        className={`text-[10px] font-bold leading-tight ${
                          step.done ? 'text-emerald-800' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                    <p className="font-mono text-[9px] text-slate-400 mt-0.5">{step.time}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            showToast('Ekspor tiket insiden (PDF) — fitur berkas arsip sekolah.', 'info')
          }
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          Kirim tembusan laporan ke Kepala Sekolah & Komite
        </button>
      </section>
    </ValidatorLayout>
  )
}

export default ValidatorIncidentsPage
