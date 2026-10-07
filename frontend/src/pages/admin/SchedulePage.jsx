import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { SchedulePanel } from '../../components/dashboard/SchedulePanel'
import { INITIAL_SCHEDULE_LIST } from '../../data/scheduleData'
import { fetchSchedules } from '../../lib/api'
import { toScheduleView } from '../../components/dashboard/scheduleView'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: JADWAL DISTRIBUSI & ARMADA COLD-CHAIN MBG
 * URL: /admin/schedule
 * Arsitektur: Clean Code (AdminLayout + SchedulePanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function SchedulePage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [schedulesList, setSchedulesList] = useState(INITIAL_SCHEDULE_LIST)
  const [loading, setLoading] = useState(true)

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSchedules()
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(toScheduleView).filter(Boolean)
        setSchedulesList(mapped)
      }
    } catch (err) {
      console.warn('Menggunakan data awal schedules:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    const res = guardAdminAction(user, 'Schedule', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="schedule"
      title="Jadwal Distribusi"
      badge={loading ? 'MEMUAT...' : 'POSTGRESQL LIVE'}
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <SchedulePanel
        schedulesList={schedulesList}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
        onReload={loadSchedules}
      />
    </AdminLayout>
  )
}

export default SchedulePage
