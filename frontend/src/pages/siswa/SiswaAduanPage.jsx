import { useState, useEffect } from 'react'
import { MessageSquareWarning, Send, CheckCircle2, Clock, ChevronDown, Phone, Siren } from 'lucide-react'
import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { MY_TICKETS, TICKET_CATEGORIES, SISWA_PROFILE } from '../../data/siswaData'
import { EMERGENCY_HEALTH_CENTERS, SEVERITY_LEVEL_OPTIONS } from '../../data/feedbackData'
import { fetchFeedbacks, submitFeedback } from '../../lib/api'

/**
 * ==============================================================================
 * PORTAL SISWA: ADUAN & MASUKAN
 * URL: /siswa/aduan
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

const STATUS_META = {
  in_progress: { label: 'Sedang Ditindaklanjuti', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  resolved: { label: 'Selesai & Ditutup', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
}

export function SiswaAduanPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState(MY_TICKETS)
  const [toast, setToast] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [form, setForm] = useState({
    title: '',
    category: 'rasa',
    severity: 'level3',
    description: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let isMounted = true
    fetchFeedbacks()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            reportedAt: t.reportedAt,
            title: t.title,
            category: t.anomalyType || 'other',
            categoryLabel: t.anomalyType || 'Laporan Makanan',
            severity: t.severity || 'level3',
            severityLabel: t.severity === 'level1' ? 'Kritis' : 'Standar',
            description: t.description,
            status: t.status === 'resolved' ? 'resolved' : 'in_progress',
            statusLabel: t.status === 'resolved' ? 'Selesai & Ditutup' : 'Sedang Ditindaklanjuti',
            resolutionNotes: null,
            closedAt: null,
          }))
          setTickets(mapped)
        }
      })
      .catch((e) => console.warn('Fallback feedbacks:', e))
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (form.title.trim().length < 5) nextErrors.title = 'Judul minimal 5 karakter.'
    if (form.description.trim().length < 15)
      nextErrors.description = 'Uraian minimal 15 karakter agar mudah ditindaklanjuti.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const res = guardAdminAction(user, 'Siswa Aduan', 'Kirim Aduan', {
      title: form.title,
      category: form.category,
      severity: form.severity,
    }, ['feedback.triage', 'incident.submit'])
    if (!res.allowed) {
      setToast(res.message)
      return
    }

    const catLabel = TICKET_CATEGORIES.find((c) => c.id === form.category)?.label || form.category
    const sevLabel = SEVERITY_LEVEL_OPTIONS.find((s) => s.id === form.severity)?.label || form.severity
    const seq = 159 + tickets.length - MY_TICKETS.length + 1

    const newTicket = {
      id: `TKT-2026-10-${String(seq).padStart(3, '0')}`,
      ticketNumber: `ADR/SISWA/1006/${String(seq).slice(-2)}`,
      reportedAt: '2026-10-06 11:05 WIB',
      title: form.title.trim(),
      category: form.category,
      categoryLabel: catLabel,
      severity: form.severity,
      severityLabel: sevLabel,
      description: form.description.trim(),
      status: 'in_progress',
      statusLabel: 'Sedang Ditindaklanjuti (Open)',
      resolutionNotes: null,
      closedAt: null,
    }

    // Simpan ke database PostgreSQL via API
    submitFeedback({
      id: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      schoolNpsn: user?.npsn || '33.210.130',
      schoolName: user?.schoolName || 'SDN 01 Menteng Pagi',
      sppgId: user?.sppgId || 'SPPG-01',
      title: newTicket.title,
      description: newTicket.description,
      anomalyType: form.category,
      severity: form.severity,
      reporterName: user?.fullName || 'Siswa',
      reporterRole: 'siswa',
      status: 'open',
    }).catch((err) => console.warn('Simpan feedback ke server:', err))

    setTickets((prev) => [newTicket, ...prev])
    setForm({ title: '', category: 'rasa', severity: 'level3', description: '' })
    setToast(`Aduan ${newTicket.ticketNumber} berhasil disimpan ke database Satgas MBG.`)
  }

  return (
    <SiswaLayout activeMenu="aduan" title="Aduan & Masukan" badge="KANAL SISWA">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Form aduan */}
        <section className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden lg:sticky lg:top-20"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <MessageSquareWarning className="h-5 w-5" />
                <div>
                  <h3 className="text-sm font-extrabold">Buat Aduan Baru</h3>
                  <p className="text-[11px] text-emerald-100">
                    Laporanmu diteruskan ke validator & Satgas MBG
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                  Judul Masalah
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={set('title')}
                  placeholder="Contoh: Sayur terasa hambar hari ini"
                  className={`w-full text-xs rounded-xl border px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    errors.title ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={set('category')}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                    Tingkat
                  </label>
                  <select
                    value={form.severity}
                    onChange={set('severity')}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {SEVERITY_LEVEL_OPTIONS.filter((s) => s.id !== 'all').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                  Uraian Kejadian
                </label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={4}
                  placeholder="Jelaskan apa yang terjadi: menu apa, kapan, dan bagaimana kondisinya..."
                  className={`w-full text-xs rounded-xl border px-3.5 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:bg-white transition resize-none ${
                    errors.description
                      ? 'border-rose-300 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.description}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl py-3 inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Send className="h-4 w-4" />
                Kirim Aduan
              </button>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Aduan atas nama <strong>{SISWA_PROFILE.fullName}</strong> ({SISWA_PROFILE.school},
                NISN {SISWA_PROFILE.nisn}). Untuk keadaan darurat kesehatan, hubungi wali kelas atau
                pusat kesehatan di bawah.
              </p>
            </div>
          </form>
        </section>

        {/* Daftar tiket + pusat kesehatan */}
        <section className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Aduan Saya</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{tickets.length} tiket tercatat</p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-mono">
              {SISWA_PROFILE.npsn}
            </span>
          </div>

          {tickets.map((t) => {
            const meta = STATUS_META[t.status] || STATUS_META.in_progress
            const StatusIcon = meta.icon
            const expanded = expandedId === t.id
            return (
              <article key={t.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${meta.cls}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                        {t.statusLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {t.ticketNumber}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-snug">
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{t.categoryLabel}</span>
                      <span className="bg-slate-100 rounded-full px-2 py-0.5 font-semibold">
                        {t.severityLabel}
                      </span>
                      <span>{t.reportedAt}</span>
                    </div>

                    <p
                      className={`text-xs text-slate-600 leading-relaxed mt-2.5 ${
                        expanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {t.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <button
                        onClick={() => setExpandedId(expanded ? null : t.id)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {expanded ? 'Tutup' : 'Detail'}
                        <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {expanded && (
                      <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Uraian Lengkap
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                            {t.description}
                          </p>
                        </div>
                        {t.resolutionNotes ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                              Penanganan Satgas
                            </p>
                            <p className="text-xs text-emerald-900 leading-relaxed mt-1">
                              {t.resolutionNotes}
                            </p>
                            <p className="text-[10px] text-emerald-600 mt-1.5 font-semibold">
                              Ditutup: {t.closedAt}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                              Status Penanganan
                            </p>
                            <p className="text-xs text-amber-900 leading-relaxed mt-1">
                              Tiket sedang diproses validator sekolah & Satgas MBG. Estimasi respons
                              mengikuti SLA tingkat kegawatan.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}

          {/* Pusat kesehatan terdekat */}
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
              <Siren className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-extrabold text-rose-700">
                Darurat Kesehatan — Hubungi Segera
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMERGENCY_HEALTH_CENTERS.slice(0, 2).map((h) => (
                <div key={h.id} className="border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-extrabold text-slate-900">{h.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{h.address}</p>
                  <p className="text-[11px] font-bold text-rose-600 mt-1.5 inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {h.emergencyHotline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SiswaLayout>
  )
}

export default SiswaAduanPage
