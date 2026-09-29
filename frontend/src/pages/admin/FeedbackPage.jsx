import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { FeedbackPanel } from '../../components/dashboard/FeedbackPanel'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: PUSAT ADUAN, TRIAGE INSIDEN & EMERGENCY KILL-SWITCH MBG
 * URL: /admin/feedback
 * Arsitektur: Clean Code (AdminLayout + FeedbackPanel)
 * Regulasi: Bab 4.2 Poin 3 & Bab 11 SUPERADMIN.md - Saluran Darurat & Food Safety
 * ==============================================================================
 */

export function FeedbackPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Feedback Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="feedback"
      title="Aduan & Feedback"
      badge="FOOD SAFETY TRIAGE"
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

      <FeedbackPanel
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default FeedbackPage
