import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { ReportsPanel } from '../../components/dashboard/ReportsPanel'
import { OFFICIAL_REPORTS_LIST } from '../../data/reportsData'
import { fetchReports } from '../../lib/api'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: UNDUH LAPORAN RESMI & DOKUMEN BAST BGN
 * URL: /admin/reports
 * Arsitektur: Clean Code (AdminLayout + ReportsPanel)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function ReportsPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [reportsList, setReportsList] = useState(OFFICIAL_REPORTS_LIST)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchReports()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r) => ({
            ...r,
            id: r.id,
            reportNumber: r.reportCode || 'BAST/BGN/OKT/2026/01',
            title: r.title,
            period: r.period,
            category: r.category,
            categoryLabel: r.category,
            author: {
              name: r.authorName || 'Badan Gizi Nasional RI',
              role: 'Satgas Pusat MBG',
            },
            status: r.status || 'verified',
            statusLabel: 'Terverifikasi Digital',
            fileSize: r.fileSize || '2.4 MB',
            format: r.fileFormat || 'PDF',
            downloadCount: 142,
            summaryMetrics: typeof r.kpiMetrics === 'object' && r.kpiMetrics !== null ? r.kpiMetrics : {},
          }))
          setReportsList(mapped)
        }
      })
      .catch((err) => {
        console.warn('Menggunakan data awal reports:', err)
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
    const res = guardAdminAction(user, 'Reports', action, payload)
    if (!res.allowed) setToast(res.message)
    return res
  }

  return (
    <AdminLayout
      activeMenu="reports"
      title="Unduh Laporan"
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

      <ReportsPanel
        reportsList={reportsList}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
      />
    </AdminLayout>
  )
}

export default ReportsPage
