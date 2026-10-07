import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { FeedbackPanel } from '../../components/dashboard/FeedbackPanel'
import { INITIAL_FEEDBACK_TICKETS } from '../../data/feedbackData'
import { fetchFeedbacks } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: ADUAN & PUSAT TRIAGE INSIDEN MBG
 * URL: /admin/feedback
 * Arsitektur: Clean Code (AdminLayout + FeedbackPanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function FeedbackPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [ticketsList, setTicketsList] = useState(INITIAL_FEEDBACK_TICKETS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchFeedbacks()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((t) => ({
            ...t,
            id: t.id,
            ticketNumber: t.ticketNumber || 'INC/BGN/JKT/1007/01',
            reportedAt: t.reportedAt || '2026-10-07 07:30 WIB',
            schoolName: t.schoolName || 'SDN 01 Menteng Pagi',
            npsn: t.schoolNpsn || '33.210.130',
            sppgName: t.sppgId === 'SPPG-04' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG Sentral Menteng 01',
            sppgId: t.sppgId || 'SPPG-01',
            batchId: t.batchId || 'BTH-0842-MNT',
            menuPackage: t.menuPackage || 'Paket C',
            severity: t.severity || 'level3',
            severityLabel: t.severity === 'level1' ? 'Level 1 (Kritis)' : 'Level 3 (Rendah)',
            anomalyType: t.anomalyType || 'packaging_issue',
            affectedPortions: t.affectedPortions || 2,
            reporter: {
              name: t.reporterName || 'Ibu Siti Aminah, S.Pd',
              role: t.reporterRole || 'Validator Sekolah',
              phone: t.reporterPhone || '0812-9901-2211',
            },
            title: t.title,
            description: t.description,
            status: t.status || 'open',
            statusLabel: t.status === 'resolved' ? 'Selesai Ditangani' : 'Terbuka',
            isKillSwitchExecuted: t.isKillSwitchExecuted || false,
            evidencePhotos: Array.isArray(t.evidencePhotos) ? t.evidencePhotos : [],
            killSwitchDetails: typeof t.killSwitchDetails === 'object' && t.killSwitchDetails !== null ? t.killSwitchDetails : {},
            medicalEscalation: typeof t.medicalEscalation === 'object' && t.medicalEscalation !== null ? t.medicalEscalation : {},
          }))
          setTicketsList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal feedback:', err)
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
    const res = guardAdminAction(user, 'Feedback', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="feedback"
      title="Aduan & Feedback"
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

      <FeedbackPanel
        ticketsList={ticketsList}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default FeedbackPage
