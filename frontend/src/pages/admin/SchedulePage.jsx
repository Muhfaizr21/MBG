import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { SchedulePanel } from '../../components/dashboard/SchedulePanel'
import { INITIAL_SCHEDULE_LIST } from '../../data/scheduleData'
import { fetchSchedules } from '../../lib/api'

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

  useEffect(() => {
    let isMounted = true
    fetchSchedules()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            ...s,
            id: s.id,
            sppgId: s.sppgId || 'SPPG-01',
            sppgName: s.sppgId === 'SPPG-04' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG 01 Menteng Sentral',
            routeName: s.routeName,
            fleetName: s.fleetName,
            licensePlate: s.licensePlate,
            driverName: s.driverName,
            driverPhone: s.driverPhone,
            departureTime: s.departureTime,
            arrivalEta: s.arrivalEta,
            totalPortions: s.totalPortions,
            status: s.status || 'on_time',
            statusLabel: s.status === 'on_time' ? 'Tepat Waktu' : 'Sedang Pengantaran',
            targetSchools: Array.isArray(s.targetSchools) ? s.targetSchools : [],
            telemetry: typeof s.telemetry === 'object' && s.telemetry !== null ? s.telemetry : { speedKmh: 35, tempC: 22.8 },
          }))
          setSchedulesList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal schedules:', err)
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
      />
    </AdminLayout>
  )
}

export default SchedulePage
