import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { NoticesPanel } from '../../components/dashboard/NoticesPanel'
import { INITIAL_NOTICES_LIST } from '../../data/noticesData'
import { toNoticeView } from '../../components/dashboard/noticeView'
import {
  fetchNotices,
  createNotice,
  broadcastFlashAlert,
  toggleArchiveNotice,
  deleteNotice
} from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PAPAN PENGUMUMAN & EDARAN DARURAT SATGAS MBG
 * URL: /admin/notices
 * Arsitektur: Clean Code (AdminLayout + NoticesPanel + Adapter toNoticeView)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function NoticesPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [noticesList, setNoticesList] = useState(() =>
    INITIAL_NOTICES_LIST.map((n) => toNoticeView(n))
  )
  const [loading, setLoading] = useState(true)

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchNotices()
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((n) => toNoticeView(n)).filter(Boolean)
        setNoticesList(mapped)
      }
    } catch (err) {
      console.warn('Menggunakan data awal notices:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotices()
  }, [loadNotices])

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

  // Superadmin action handlers calling real backend endpoints
  const handleCreateNotice = async (formData) => {
    const res = await createNotice(formData)
    await loadNotices()
    return res
  }

  const handleBroadcastFlashAlert = async (id) => {
    const res = await broadcastFlashAlert(id)
    await loadNotices()
    return res
  }

  const handleToggleArchive = async (id, isArchiving) => {
    const res = await toggleArchiveNotice(id, isArchiving)
    await loadNotices()
    return res
  }

  const handleDeleteNotice = async (id) => {
    const res = await deleteNotice(id)
    await loadNotices()
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
        onCreateNotice={handleCreateNotice}
        onBroadcastFlashAlert={handleBroadcastFlashAlert}
        onToggleArchive={handleToggleArchive}
        onDeleteNotice={handleDeleteNotice}
        onReload={loadNotices}
      />
    </AdminLayout>
  )
}

export default NoticesPage
