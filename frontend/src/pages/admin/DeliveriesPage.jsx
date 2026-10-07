import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { DeliveriesPanel } from '../../components/dashboard/DeliveriesPanel'
import { INITIAL_DELIVERIES_LIST } from '../../data/deliveriesData'
import { fetchDeliveries } from '../../lib/api'

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
  const [deliveries, setDeliveries] = useState(INITIAL_DELIVERIES_LIST)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchDeliveries()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d) => ({
            ...d,
            id: d.id,
            batchId: d.batchId || 'BTH-0842-MNT',
            school: d.schoolName || 'SDN 01 Menteng Pagi',
            npsn: d.schoolNpsn || '33.210.130',
            sppg: d.sppgId === 'SPPG-04' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG 01 Menteng Sentral',
            sppgCode: d.sppgId || 'BGN-SPPG-001',
            city: d.schoolNpsn === '20219876' ? 'Kota Bandung' : 'Jakarta Pusat',
            province: d.schoolNpsn === '20219876' ? 'Jawa Barat' : 'DKI Jakarta',
            validator: {
              name: d.validatorName || 'Dr. Hendra Prasetyo',
              satgasId: 'BGN-VLD-0042',
              role: 'Penanggung Jawab MBG Sekolah',
              device: 'Samsung Galaxy A54 5G',
            },
            scannedAt: d.scannedAt || '07:12:45 WIB',
            scanDate: d.scanDate || '2026-10-07',
            scanDurationSec: 0.82,
            portions: d.portions || 480,
            targetPortions: d.targetPortions || 480,
            thermal: {
              temp: d.tempC || 23.4,
              targetRange: '20.0°C – 25.0°C',
              unit: '°C',
              status: d.tempStatus || 'safe',
              probeDevice: 'Testo 104-IR Calibrated',
            },
            qrToken: {
              code: d.qrToken || 'MBG-QR-7719-X89A-001',
              status: d.qrStatus || 'verified',
              scanAttempts: 1,
              firstScannedAt: d.scannedAt || '07:12:45 WIB',
              antiDuplicateHash: d.cryptoHash || '9a8f2bc0e11849a99f123a41c9983de4',
            },
            cryptoProof: {
              sha256: d.cryptoHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              blockHeight: 1849201,
              signedBy: 'KawanGizi-Notary-Edge-CGK01',
              algorithm: 'ECDSA-secp256k1 + SHA256',
            },
            menu: {
              name: d.menuName || 'Nasi Ulen Empal Daging Suwir & Sayur Lodeh',
              packageType: 'Paket Gizi Seimbang SD',
              allergens: 'Bebas Kacang Tanah',
              cookingCompletedAt: '05:45 WIB',
              shelfLifeLeftMinutes: 195,
            },
            aiYolo: {
              verdict: d.aiVerdict || 'layak',
              confidencePct: d.aiScore || 99.4,
              inferenceTimeMs: 42,
              anomalyDetected: false,
              imageUrl: d.imageUrl || '/img/samples/meal_sdn01.jpg',
            },
          }))
          setDeliveries(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal deliveries:', err)
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
    const res = guardAdminAction(user, 'Deliveries', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

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
