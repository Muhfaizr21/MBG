import { useState, useMemo, useEffect } from 'react'
import { Megaphone, AlertTriangle, Info, CalendarDays, Paperclip, Search, CheckCircle2 } from 'lucide-react'
import { SiswaLayout } from '../../components/layout/SiswaLayout'
import { INITIAL_NOTICES_LIST, NOTICE_CATEGORIES } from '../../data/noticesData'
import { fetchNotices } from '../../lib/api'

/**
 * ==============================================================================
 * PORTAL SISWA: PENGUMUMAN SEKOLAH
 * URL: /siswa/notices
 * Read-only (permission notices.read). Audiens: 'all' & 'validators'
 * tidak ditampilkan bila khusus sppg.
 * ==============================================================================
 */

const URGENCY_STYLE = {
  critical: { badge: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle, iconCls: 'text-rose-600' },
  important: { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, iconCls: 'text-amber-600' },
  info: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info, iconCls: 'text-blue-600' },
}

export function SiswaNoticesPage() {
  const [categoryId, setCategoryId] = useState('all')
  const [query, setQuery] = useState('')
  const [ackIds, setAckIds] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [notices, setNotices] = useState(INITIAL_NOTICES_LIST)

  useEffect(() => {
    let isMounted = true
    fetchNotices()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((n) => ({
            ...n,
            id: n.id,
            refNumber: n.refNumber || 'BGN/SE/084/X/2026',
            title: n.title,
            category: n.category || 'seasonal',
            categoryLabel: n.category === 'system' ? 'Pembaruan Sistem & AI' : 'Peringatan Higienitas Musiman',
            urgency: n.urgency || 'info',
            urgencyLabel: n.urgency === 'critical' ? 'Panggilan Darurat' : 'Penting',
            targetAudience: n.targetAudience || 'all',
            publishedAt: n.publishedAt || '07 Okt 2026, 06:00 WIB',
            author: { name: n.authorName || 'Satgas MBG', role: n.authorRole || 'Pusat Mutu' },
            content: n.content,
            attachments: Array.isArray(n.attachments) ? n.attachments : [],
          }))
          setNotices(mapped)
        }
      })
      .catch((err) => console.warn('Fallback siswa notices:', err))

    return () => {
      isMounted = false
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notices.filter((n) => {
      // Audiens siswa: terima pengumuman nasional; abaikan khusus sppg
      if (n.targetAudience === 'sppg') return false
      if (categoryId !== 'all' && n.category !== categoryId) return false
      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.refNumber.toLowerCase().includes(q)
      )
    })
  }, [categoryId, query, notices])

  const handleAck = (id) => {
    setAckIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  return (
    <SiswaLayout activeMenu="notices" title="Pengumuman Sekolah" badge="BGN DISPATCH">
      {/* Filter bar */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {NOTICE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 text-xs font-bold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                categoryId === c.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pengumuman..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
      </section>

      {/* Notices */}
      <section className="space-y-3">
        {visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Megaphone className="h-9 w-9 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-500 mt-3">Tidak ada pengumuman</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci.</p>
          </div>
        )}

        {visible.map((notice) => {
          const style = URGENCY_STYLE[notice.urgency] || URGENCY_STYLE.info
          const Icon = style.icon
          const expanded = expandedId === notice.id
          const acked = ackIds.includes(notice.id)
          return (
            <article
              key={notice.id}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition ${
                notice.urgency === 'critical' ? 'border-rose-200' : 'border-slate-200/80'
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${style.badge}`}>
                    <Icon className={`h-5 w-5 ${style.iconCls}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {notice.urgencyLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {notice.refNumber}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1.5 leading-snug">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {notice.publishedAt}
                      </span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="hidden sm:inline">{notice.author.name}</span>
                    </div>

                    {/* Preview / expanded content */}
                    <p
                      className={`text-xs text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line ${
                        expanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {notice.content}
                    </p>

                    <button
                      onClick={() => setExpandedId(expanded ? null : notice.id)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 mt-2 cursor-pointer"
                    >
                      {expanded ? 'Tutup' : 'Baca selengkapnya'}
                    </button>

                    {expanded && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="bg-slate-100 text-slate-600 font-bold rounded-full px-2.5 py-1">
                            {notice.categoryLabel}
                          </span>
                          <span className="bg-slate-100 text-slate-600 font-bold rounded-full px-2.5 py-1">
                            {notice.scopeRegion}
                          </span>
                          <span className="bg-slate-100 text-slate-600 font-bold rounded-full px-2.5 py-1">
                            {notice.effectiveDate}
                          </span>
                        </div>
                        {notice.attachments?.length > 0 && (
                          <div className="space-y-1.5">
                            {notice.attachments.map((a) => (
                              <div
                                key={a.fileName}
                                className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 mr-2"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="font-mono">{a.fileName}</span>
                                <span className="text-slate-400">({a.fileSize})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {notice.requiresAcknowledgement && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500">
                          Dikonfirmasi {notice.acknowledgementStats.acknowledgedCount}/
                          {notice.acknowledgementStats.totalRecipients} penerima (
                          {notice.acknowledgementStats.complianceRate}%)
                        </p>
                        <button
                          onClick={() => handleAck(notice.id)}
                          disabled={acked}
                          className={`text-[11px] font-extrabold rounded-xl px-3.5 py-2 transition cursor-pointer inline-flex items-center gap-1.5 ${
                            acked
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {acked ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Sudah Dibaca
                            </>
                          ) : (
                            'Konfirmasi Dibaca'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </SiswaLayout>
  )
}

export default SiswaNoticesPage
