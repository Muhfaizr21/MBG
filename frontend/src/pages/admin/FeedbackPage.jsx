import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { FeedbackPanel } from '../../components/dashboard/FeedbackPanel'
import { fetchFeedbackBundle } from '../../lib/api'
import {
  toFeedbackListView,
  toHealthCenterListView,
  toFeedbackKPIView,
} from '../../components/dashboard/feedbackView'
import {
  INITIAL_FEEDBACK_TICKETS,
  EMERGENCY_HEALTH_CENTERS,
} from '../../data/feedbackData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: ADUAN & PUSAT TRIAGE INSIDEN MBG
 * URL: /admin/feedback
 * Arsitektur: Clean Architecture (AdminLayout + FeedbackPanel + PostgreSQL Live)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function FeedbackPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [ticketsList, setTicketsList] = useState(INITIAL_FEEDBACK_TICKETS)
  const [healthCenters, setHealthCenters] = useState(EMERGENCY_HEALTH_CENTERS)
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchFeedbackBundle()
      if (data) {
        if (Array.isArray(data.tickets) && data.tickets.length > 0) {
          setTicketsList(toFeedbackListView(data.tickets))
        }
        if (Array.isArray(data.healthCenters) && data.healthCenters.length > 0) {
          setHealthCenters(toHealthCenterListView(data.healthCenters))
        }
        if (data.kpi) {
          setKpi(toFeedbackKPIView(data.kpi, data.tickets))
        }
      }
    } catch (err) {
      console.warn('Gagal memuat feedback bundle PostgreSQL, menggunakan cadangan lokal:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
        initialTickets={ticketsList}
        initialHealthCenters={healthCenters}
        initialKpi={kpi}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
        onRefresh={loadData}
      />
    </AdminLayout>
  )
}

export default FeedbackPage

