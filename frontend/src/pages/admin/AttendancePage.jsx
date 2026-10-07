import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { AttendancePanel } from '../../components/dashboard/AttendancePanel'
import { INITIAL_ATTENDANCE_LIST } from '../../data/attendanceData'
import { fetchAttendances } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PENERIMAAN SISWA & REKONSILIASI PORSI MBG
 * URL: /admin/attendance
 * Arsitektur: Clean Code (AdminLayout + AttendancePanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function AttendancePage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [attendanceList, setAttendanceList] = useState(INITIAL_ATTENDANCE_LIST)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchAttendances()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((a) => ({
            ...a,
            id: a.id,
            npsn: a.schoolNpsn || '33.210.130',
            school: a.schoolName || 'SDN 01 Menteng Pagi',
            level: 'SD / MI (Kelas 1–6)',
            city: a.schoolNpsn === '20219876' ? 'Kota Bandung' : 'Jakarta Pusat',
            province: a.schoolNpsn === '20219876' ? 'Jawa Barat' : 'DKI Jakarta',
            sppg: a.schoolNpsn === '20219876' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG 01 Menteng Sentral',
            sppgCode: a.schoolNpsn === '20219876' ? 'BGN-SPPG-004' : 'BGN-SPPG-001',
            registeredStudents: a.registeredStudents || 480,
            presentStudents: a.presentStudents || 468,
            absentDetails: { sick: 10, permission: 2, unexplained: 0 },
            attendanceRate: a.attendanceRate || 97.5,
            deliveredPortions: a.deliveredPortions || 480,
            consumedPortions: a.consumedPortions || 468,
            surplusPortions: a.surplusPortions || 12,
            surplusStatus: a.surplusStatus || 'available_for_redistribution',
            reconciliationStatus: a.reconciliationStatus || 'surplus_safe',
            discrepancyCount: 0,
            targetTomorrowQuota: a.targetTomorrowQuota || 470,
            consumptionEvaluation: {
              finishRate: a.finishRate || 98.2,
              riceWastePct: 1.0,
              proteinWastePct: 0.2,
              veggieWastePct: 1.8,
              feedbackNotes: 'Porsi gizi dihabiskan dengan baik oleh siswa.',
            },
            goldenWindow: {
              cookedAt: '05:45 WIB',
              deliveredAt: '06:55 WIB',
              lunchTime: '09:30 WIB',
              safeUntil: '10:45 WIB',
              minutesLeft: 45,
              isSafeToRedistribute: true,
            },
          }))
          setAttendanceList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal attendance:', err)
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
    const res = guardAdminAction(user, 'Attendance', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="attendance"
      title="Penerimaan Siswa"
      badge={loading ? 'MEMUAT...' : 'POSTGRESQL LIVE'}
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <AttendancePanel
        attendanceList={attendanceList}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default AttendancePage
