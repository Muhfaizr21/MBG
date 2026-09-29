import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { ReportsPanel } from '../../components/dashboard/ReportsPanel'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PUSAT UNDUHAN LAPORAN RESMI, BAST DIGITAL & AUDIT APBN
 * URL: /admin/reports
 * Arsitektur: Clean Code (AdminLayout + ReportsPanel)
 * Regulasi: Bab 4.2 & Bab 10 SUPERADMIN.md - Pertanggungjawaban APBN Terverifikasi BPK/BPKP
 * ==============================================================================
 */

export function ReportsPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Reports Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="downloads"
      title="Unduh Laporan"
      badge="AUDIT BPK READY"
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

      <ReportsPanel
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default ReportsPage
