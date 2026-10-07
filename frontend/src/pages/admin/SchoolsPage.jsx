import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { SchoolsPanel } from '../../components/dashboard/SchoolsPanel'
import { INITIAL_SCHOOLS_LIST } from '../../data/schoolsData'
import { fetchSchools } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: SEKOLAH BINAAN (PANGKALAN DATA MASTER NPSN & LAST-MILE)
 * URL: /admin/schools
 * Arsitektur: Clean Code (AdminLayout + SchoolsPanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function SchoolsPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [schools, setSchools] = useState(INITIAL_SCHOOLS_LIST)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchSchools()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            ...s,
            id: s.id || `SCH-${s.npsn}`,
            coordinates: { lat: s.lat || -6.198, lng: s.lng || 106.832 },
            principal: {
              name: s.principalName || 'Kepala Sekolah',
              nip: s.principalNip || '-',
              phone: s.principalPhone || '-',
              email: s.principalEmail || '-',
            },
            demographics: {
              totalStudents: s.totalStudents || 450,
              totalCalorieTarget: s.totalCalorieTarget || 232800,
              dietaryNotes: s.dietaryNotes || 'Standar gizi terpenuhi',
            },
            sppgSupplier: {
              id: s.sppgId || 'SPPG-01',
              name: s.sppgId === 'SPPG-04' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG Sentral Menteng 01',
              transitStatus: 'safe',
            },
          }))
          setSchools(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal sekolah:', err)
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
    const res = guardAdminAction(user, 'Schools', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="schools"
      title="Sekolah Binaan"
      badge={loading ? 'MEMUAT...' : 'POSTGRESQL LIVE'}
      showSearch={false}
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 animate-in fade-in"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <p className="leading-relaxed font-medium">{toast}</p>
        </div>
      )}

      <SchoolsPanel
        schoolsList={schools}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default SchoolsPage
