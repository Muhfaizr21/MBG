import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { SppgPanel } from '../../components/dashboard/SppgPanel'
import { INITIAL_SPPG_LIST } from '../../data/sppgData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: DIREKTORI & EVALUASI KEPATUHAN DAPUR SPPG
 * URL: /admin/sppg
 * Arsitektur: Clean Code (AdminLayout + SppgPanel)
 * Regulasi: Perpres No. 83/2024 & Bab 4.2 Poin 8 Sistem Pengawasan MBG
 * ==============================================================================
 */

export function SppgPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin SPPG Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="sppg"
      title="Dapur SPPG"
      badge="VENDOR RESMI"
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

      <SppgPanel
        sppgList={INITIAL_SPPG_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default SppgPage
