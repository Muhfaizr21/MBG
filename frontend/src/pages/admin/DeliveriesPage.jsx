import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { DeliveriesPanel } from '../../components/dashboard/DeliveriesPanel'
import { toDeliveryViews, toDeliveryView } from '../../components/dashboard/deliveryView'
import { fetchDeliveries, overrideDeliveryAI, orderDeliveryLabTest } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: HASIL PENGIRIMAN & TELEMETRI YOLOV8
 * URL: /admin/deliveries
 * Arsitektur: Clean Code (AdminLayout + DeliveriesPanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function DeliveriesPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchDeliveries()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDeliveries(toDeliveryViews(data))
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat data telemetri pengiriman:', err)
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

  const handleSuperadminAction = useCallback(
    async (action, payload) => {
      const res = guardAdminAction(user, 'Deliveries', action, payload)
      if (!res.allowed) {
        setToast(res.message)
        return res
      }

      try {
        if (action === 'override_ai' && payload?.delivery?.id) {
          const updated = await overrideDeliveryAI(payload.delivery.id, {
            reason: payload.reason,
            auditorName: payload.auditorName,
          })
          if (updated) {
            const view = toDeliveryView(updated)
            setDeliveries((prev) => prev.map((d) => (d.id === view.id ? view : d)))
          }
        } else if (action === 'order_lab_test' && payload?.delivery?.id) {
          const updated = await orderDeliveryLabTest(payload.delivery.id, {
            labTarget: payload.samplingTarget,
            dinkesOffice: payload.dinkesOffice,
            notes: payload.notes,
          })
          if (updated) {
            const view = toDeliveryView(updated)
            setDeliveries((prev) => prev.map((d) => (d.id === view.id ? view : d)))
          }
        }
      } catch (err) {
        console.error('Gagal mengeksekusi aksi telemetri pengiriman:', err)
        setToast(`[GAGAL] ${err.message || 'Aksi gagal disimpan ke backend'}`)
      }

      return res
    },
    [user]
  )

  return (
    <AdminLayout
      activeMenu="results"
      title="Hasil Pengiriman"
      badge={loading ? 'MEMUAT...' : 'POSTGRESQL LIVE'}
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
        deliveries={deliveries}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default DeliveriesPage
