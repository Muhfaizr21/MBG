import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AttendancePanel } from '../../components/dashboard/AttendancePanel'
import { INITIAL_ATTENDANCE_LIST } from '../../data/attendanceData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PENERIMAAN SISWA & REKONSILIASI PRESENSI MBG
 * URL: /admin/attendance
 * Arsitektur: Clean Code (AdminLayout + AttendancePanel)
 * Regulasi: Bab 4.2 Poin 8 & Bab 3.3.2 Sistem Pengawasan KawanGizi MBG
 * ==============================================================================
 */

export function AttendancePage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Attendance Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="attendance"
      title="Penerimaan Siswa"
      badge="DAPODIK SYNC"
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <AttendancePanel
        attendanceList={INITIAL_ATTENDANCE_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default AttendancePage
