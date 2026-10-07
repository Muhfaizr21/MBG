import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { guardAdminAction } from '../../lib/adminActions'
import { ReportsPanel } from '../../components/dashboard/ReportsPanel'
import { fetchReportsBundle } from '../../lib/api'
import {
  mapReportFromApi,
  mapBastFromApi,
  mapInvoiceFromApi,
  mapForensicFromApi
} from '../../components/dashboard/reportView'
import {
  OFFICIAL_REPORTS_LIST,
  DIGITAL_BAST_LIST,
  VENDOR_INVOICES_LIST,
  FORENSIC_AUDIT_FINDINGS
} from '../../data/reportsData'

/**
 * ==============================================================================
 * HALAMAN SUPERADMIN: UNDUH LAPORAN RESMI & DOKUMEN BAST BGN
 * URL: /admin/reports
 * Arsitektur: Clean Architecture (AdminLayout + ReportsPanel + PostgreSQL Live)
 * Sumber Data: Database PostgreSQL via REST API Gateway Golang
 * ==============================================================================
 */

export function ReportsPage() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [reports, setReports] = useState(OFFICIAL_REPORTS_LIST)
  const [bastList, setBastList] = useState(DIGITAL_BAST_LIST)
  const [invoices, setInvoices] = useState(VENDOR_INVOICES_LIST)
  const [forensicFindings, setForensicFindings] = useState(FORENSIC_AUDIT_FINDINGS)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchReportsBundle()
      if (data) {
        if (Array.isArray(data.reports) && data.reports.length > 0) {
          setReports(data.reports.map(mapReportFromApi))
        }
        if (Array.isArray(data.bastList) && data.bastList.length > 0) {
          setBastList(data.bastList.map(mapBastFromApi))
        }
        if (Array.isArray(data.invoices) && data.invoices.length > 0) {
          setInvoices(data.invoices.map(mapInvoiceFromApi))
        }
        if (Array.isArray(data.forensicFindings) && data.forensicFindings.length > 0) {
          setForensicFindings(data.forensicFindings.map(mapForensicFromApi))
        }
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.warn('Gagal memuat bundel laporan PostgreSQL, menggunakan data cadangan:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
        initialReports={reports}
        initialBastList={bastList}
        initialInvoices={invoices}
        initialForensicFindings={forensicFindings}
        initialStats={stats}
        onSuperadminAction={handleSuperadminAction}
        showToast={setToast}
        onRefresh={loadData}
      />
    </AdminLayout>
  )
}

export default ReportsPage
