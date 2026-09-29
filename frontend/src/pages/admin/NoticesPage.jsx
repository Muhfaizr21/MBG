import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { NoticesPanel } from '../../components/dashboard/NoticesPanel'
import { INITIAL_NOTICES_LIST } from '../../data/noticesData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PAPAN PENGUMUMAN & SALURAN SIARAN TERPADU BGN
 * URL: /admin/notices
 * Arsitektur: Clean Code (AdminLayout + NoticesPanel)
 * Regulasi: Bab 4.2 Spesifikasi Komunikasi Terverifikasi Satgas MBG
 * ==============================================================================
 */

export function NoticesPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Notices Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="notices"
      title="Papan Pengumuman"
      badge="BGN DISPATCH"
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

      <NoticesPanel
        noticesList={INITIAL_NOTICES_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default NoticesPage
