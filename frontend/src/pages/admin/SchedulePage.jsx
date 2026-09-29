import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { SchedulePanel } from '../../components/dashboard/SchedulePanel'
import { INITIAL_SCHEDULE_LIST } from '../../data/scheduleData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: JADWAL DISTRIBUSI & FLEET TRACKING MBG
 * URL: /admin/schedule
 * Arsitektur: Clean Code (AdminLayout + SchedulePanel)
 * Regulasi: Bab 3.3.2 & Bab 4.2 Juknis Operasional Distribusi MBG
 * ==============================================================================
 */

export function SchedulePage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Schedule Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="schedule"
      title="Jadwal Distribusi"
      badge="FLEET DISPATCH"
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <SchedulePanel
        schedulesList={INITIAL_SCHEDULE_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default SchedulePage
