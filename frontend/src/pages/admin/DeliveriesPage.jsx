import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { DeliveriesPanel } from '../../components/dashboard/DeliveriesPanel'
import { INITIAL_DELIVERIES_LIST } from '../../data/deliveriesData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: HASIL PENGIRIMAN & TELEMETRI YOLOV8
 * URL: /admin/deliveries
 * Arsitektur: Clean Code (AdminLayout + DeliveriesPanel)
 * Regulasi: Bab 3.3.2 & Bab 4.2 Poin 8 Sistem Pengawasan KawanGizi MBG
 * ==============================================================================
 */

export function DeliveriesPage() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSuperadminAction = (action, payload) => {
    console.log(`[Superadmin Deliveries Action] ${action}:`, payload)
  }

  return (
    <AdminLayout
      activeMenu="results"
      title="Hasil Pengiriman"
      badge="YOLOv8 LIVE"
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

      <DeliveriesPanel
        deliveries={INITIAL_DELIVERIES_LIST}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default DeliveriesPage
