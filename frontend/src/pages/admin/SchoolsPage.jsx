import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { SchoolsPanel } from '../../components/dashboard/SchoolsPanel'
import { INITIAL_SCHOOLS_LIST } from '../../data/schoolsData'
import { fetchSchools } from '../../lib/api'
import { toSchoolView } from '../../components/dashboard/schoolView'

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
  const [schools, setSchools] = useState(() => INITIAL_SCHOOLS_LIST.map(toSchoolView))
  const [loading, setLoading] = useState(true)

  const loadSchools = useCallback(async () => {
    try {
      const data = await fetchSchools()
      if (Array.isArray(data) && data.length > 0) {
        setSchools(data.map(toSchoolView))
      }
    } catch (err) {
      console.warn('Menggunakan data awal sekolah (fallback):', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchools()
  }, [loadSchools])

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
        onReload={loadSchools}
      />
    </AdminLayout>
  )
}

export default SchoolsPage
