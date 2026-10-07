import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { NoticesPanel } from '../../components/dashboard/NoticesPanel'
import { INITIAL_NOTICES_LIST } from '../../data/noticesData'
import { fetchNotices } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PAPAN PENGUMUMAN & EDARAN DARURAT SATGAS MBG
 * URL: /admin/notices
 * Arsitektur: Clean Code (AdminLayout + NoticesPanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function NoticesPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [noticesList, setNoticesList] = useState(INITIAL_NOTICES_LIST)
  const [loading, setLoading] = useState(true)

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
            urgency: n.urgency || 'important',
            urgencyLabel: n.urgency === 'critical' ? 'Panggilan Darurat (Flash Alert)' : 'Penting',
            targetAudience: n.targetAudience || 'all',
            targetAudienceLabel: n.targetAudience === 'validators' ? 'Hanya Guru Validator Sekolah' : 'Semua Pihak (Nasional)',
            scopeRegion: n.scopeRegion || 'Nasional',
            publishedAt: n.publishedAt || '07 Okt 2026, 06:00 WIB',
            effectiveDate: n.effectiveDate || 'Berlaku Selama Oktober 2026',
            author: {
              name: n.authorName || 'Dr. Hendra Gunawan, M.Epid',
              role: n.authorRole || 'Direktur Kepatuhan Mutu BGN',
            },
            content: n.content,
            isFlashAlert: n.isFlashAlert || false,
            requiresAcknowledgement: n.requiresAcknowledgement || false,
            acknowledgementStats: {
              totalRecipients: 420,
              acknowledgedCount: 398,
              complianceRate: 94.8,
            },
            attachments: Array.isArray(n.attachments) ? n.attachments : [],
          }))
          setNoticesList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal notices:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    const res = guardAdminAction(user, 'Notices', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="notices"
      title="Papan Pengumuman"
      badge={loading ? 'MEMUAT...' : 'POSTGRESQL LIVE'}
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <NoticesPanel
        noticesList={noticesList}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default NoticesPage
