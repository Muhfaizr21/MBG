import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { SchoolsPanel } from '../../components/dashboard/SchoolsPanel'
import { INITIAL_SCHOOLS_LIST } from '../../data/schoolsData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: SEKOLAH BINAAN (PANGKALAN DATA MASTER NPSN & LAST-MILE)
 * URL: /admin/schools
 * Arsitektur: Clean Code (AdminLayout + SchoolsPanel)
 * Regulasi: Bab 3.2.1 Titik Serah Terima Akhir Distribusi MBG
 * ==============================================================================
 */

export function SchoolsPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Schools Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="schools"
      title="Sekolah Binaan"
      badge="NPSN REGISTRY"
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
        schoolsList={INITIAL_SCHOOLS_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default SchoolsPage
