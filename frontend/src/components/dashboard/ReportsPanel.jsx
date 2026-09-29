import { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Search,
  Plus,
  Check,
  X,
  FileCheck,
  DollarSign,
  Clock,
  Ban
} from 'lucide-react'
import { ReportsCharts } from './ReportsCharts'
import {
  OFFICIAL_REPORTS_LIST,
  DIGITAL_BAST_LIST,
  VENDOR_INVOICES_LIST,
  FORENSIC_AUDIT_FINDINGS
} from '../../data/reportsData'

export function ReportsPanel({
  onSuperadminAction = () => {},
  showToast = () => {}
}) {
  // Main Data States
  const [reports, setReports] = useState(OFFICIAL_REPORTS_LIST)
  const [bastList] = useState(DIGITAL_BAST_LIST)
  const [invoices, setInvoices] = useState(VENDOR_INVOICES_LIST)
  const [forensicFindings] = useState(FORENSIC_AUDIT_FINDINGS)

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState('reports') // 'reports' | 'bast' | 'invoices' | 'forensic'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [density, setDensity] = useState('normal') // 'normal' | 'compact'

  // Modals & Drawers
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [selectedBast, setSelectedBast] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // Form State for Generator
  const [generateForm, setGenerateForm] = useState({
    title: '',
    category: 'distribution',
    period: 'September 2026',
    scope: 'Nasional (38 Provinsi)',
    format: 'PDF',
    signee: 'Satgas MBG Pusat & BGN'
  })

  // Form State for Payment Clearance
  const [clearanceForm, setClearanceForm] = useState({
    sp2dNumber: 'SP2D/BGN-KEMENKEU/2026/09/8899',
    notes: 'Klaim diperiksa terhadap catatan serah terima harian pada prototipe. Belum ada audit eksternal.',
    signerRole: 'Pejabat Pembuat Komitmen (PPK) Satgas MBG'
  })

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [reports, search, categoryFilter])

  // Filtered BAST
  const filteredBast = useMemo(() => {
    return bastList.filter((b) => {
      return (
        b.refNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.schoolName.toLowerCase().includes(search.toLowerCase()) ||
        b.npsn.includes(search) ||
        b.sppgName.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [bastList, search])

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      return (
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.sppgName.toLowerCase().includes(search.toLowerCase()) ||
        inv.vendorCompany.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [invoices, search])

  // Filtered Forensic
  const filteredForensic = useMemo(() => {
    return forensicFindings.filter((f) => {
      return (
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.sppgName.toLowerCase().includes(search.toLowerCase()) ||
        f.explanation.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [forensicFindings, search])

  // Executive KPIs
  const kpiData = useMemo(() => {
    const totalReportsCount = reports.length
    const validBastCount = bastList.filter((b) => b.paymentClearanceStatus !== 'blocked').length
    const totalApprovedMoney = invoices.reduce((sum, i) => sum + i.approvedPaymentAmount, 0)
    const totalSafeguardedMoney = invoices.reduce((sum, i) => sum + i.penaltyDeductionAmount, 0)

    return {
      totalReportsCount,
      validBastCount,
      totalApprovedMoney: (totalApprovedMoney / 1000000000).toFixed(2), // Miliar
      totalSafeguardedMoney: (totalSafeguardedMoney / 1000000).toFixed(1) // Juta
    }
  }, [reports, bastList, invoices])

  // Download a real file rather than showing a success toast for nothing (R-26).
  const downloadFile = (fileName, mimeType, contents) => {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const csvCell = (cell) => {
    const s = cell == null ? '' : String(cell)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  // TODO(backend): replace the hand-rolled CSV with a real library once the
  // server returns the authoritative rows.
  const exportOneReportCsv = (report) => {
    const rows = [
      ['Kode', report.code],
      ['Judul', report.title],
      ['Kategori', report.categoryLabel],
      ['Periode', report.period],
      ['Cakupan', report.scope],
      ['Ukuran PDF', report.fileSizePdf],
      ['Status', report.auditBadge],
    ]
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
    downloadFile(`${report.code}.csv`, 'text/csv;charset=utf-8', '﻿' + csv)
    showToast(`${report.title} diekspor ke CSV.`)
  }

  // Handle Export CSV
  const exportMasterCsv = () => {
    let headers = []
    let rows = []

    if (activeTab === 'reports') {
      headers = ['Kode Laporan', 'Judul Dokumen', 'Kategori', 'Periode', 'Cakupan', 'Ukuran Berkas PDF', 'Status Kelaikan']
      rows = filteredReports.map((r) => [
        `"${r.code}"`,
        `"${r.title}"`,
        `"${r.categoryLabel}"`,
        `"${r.period}"`,
        `"${r.scope}"`,
        `"${r.fileSizePdf}"`,
        `"${r.auditBadge}"`
      ])
    } else if (activeTab === 'bast') {
      headers = ['No. BAST', 'Tanggal', 'Sekolah', 'NPSN', 'Dapur SPPG', 'Porsi Dipesan', 'Porsi Lolos AI', 'Porsi Ditolak', 'Suhu Tiba', 'Nilai Subtotal (Rp)', 'Status BAST']
      rows = filteredBast.map((b) => [
        `"${b.refNumber}"`,
        `"${b.date}"`,
        `"${b.schoolName}"`,
        `"${b.npsn}"`,
        `"${b.sppgName}"`,
        b.orderedPortions,
        b.verifiedAiPortions,
        b.rejectedPortions,
        `"${b.thermalTempArrive}"`,
        b.subtotalAmount,
        `"${b.paymentClearanceLabel}"`
      ])
    } else {
      headers = ['No. Invoice', 'Dapur SPPG', 'Perusahaan Vendor', 'Porsi Diklaim', 'Porsi Sah AI', 'Potongan Basi / Denda (Rp)', 'Otorisasi Bayar (Rp)', 'Status SP2D']
      rows = filteredInvoices.map((i) => [
        `"${i.invoiceNumber}"`,
        `"${i.sppgName}"`,
        `"${i.vendorCompany}"`,
        i.totalClaimedPortions,
        i.verifiedBastPortions,
        i.penaltyDeductionAmount,
        i.approvedPaymentAmount,
        `"${i.statusLabel}"`
      ])
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Rekapitulasi_Laporan_MBG_${activeTab.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Data ${activeTab.toUpperCase()} berhasil diekspor dalam format CSV!`)
  }

  // Handle Generate Custom Report Submit
  const handleGenerateReportSubmit = (e) => {
    e.preventDefault()
    if (!generateForm.title) {
      showToast('Judul dokumen laporan wajib diisi!')
      return
    }

    const newReport = {
      id: `REP-BGN-2026-${Date.now().toString().slice(-3)}`,
      code: `CUS-${generateForm.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      title: generateForm.title,
      category: generateForm.category,
      categoryLabel: generateForm.category === 'distribution' ? 'Distribusi & Logistik' : generateForm.category === 'nutrition' ? 'Kepatuhan Gizi' : 'Keuangan & APBN',
      period: generateForm.period,
      scope: generateForm.scope,
      generatedAt: 'Baru saja',
      totalPortions: 251400,
      successRate: 99.5,
      fileFormats: [generateForm.format, 'CSV'],
      fileSizePdf: '2.5 MB',
      fileSizeXlsx: '1.4 MB',
      fileSizeCsv: '520 KB',
      description: `Laporan resmi kustom hasil ekstraksi basis data terpadu BGN untuk periode ${generateForm.period}.`,
      signee: generateForm.signee,
      auditBadge: 'BPK Ready'
    }

    setReports([newReport, ...reports])
    setGenerateModalOpen(false)
    showToast(`Dokumen laporan "${newReport.title}" berhasil di-generate secara resmi!`)
    onSuperadminAction('GENERATE_REPORT', newReport)
  }

  // Handle Authorize Payment (Payment Clearance)
  const handleAuthorizePayment = (e) => {
    e.preventDefault()
    if (!selectedInvoice) return

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === selectedInvoice.id) {
          return {
            ...inv,
            status: 'approved_cleared',
            statusLabel: 'Telah Ditandatangani (SP2D Terbit)',
            sp2dNumber: clearanceForm.sp2dNumber,
            signedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('id-ID').slice(0, 5)} WIB`,
            signedBy: 'Bambang Soediro (Superadmin Satgas MBG)'
          }
        }
        return inv
      })
    )

    const authorizedName = selectedInvoice.invoiceNumber
    setSelectedInvoice(null)
    showToast(`Otorisasi pembayaran termin ${authorizedName} BERHASIL ditandatangani secara digital! Dokumen SP2D diterbitkan ke Kemenkeu.`)
    onSuperadminAction('CLEAR_PAYMENT', { invoiceId: selectedInvoice.id, sp2d: clearanceForm.sp2dNumber })
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT TOP UTILITY & ACTION BAR (NO BLOATED CARDS, NO COUNTDOWN)
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Pusat Akuntabilitas Laporan Resmi, Penerbitan BAST Digital &amp; Audit Forensik APBN
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportMasterCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor Rekap (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak Berkas</span>
          </button>

          <button
            onClick={() => {
              setGenerateForm({
                title: '',
                category: 'distribution',
                period: 'September 2026',
                scope: 'Nasional (38 Provinsi)',
                format: 'PDF',
                signee: 'Satgas MBG Pusat & BGN'
              })
              setGenerateModalOpen(true)
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Laporan Resmi Baru</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. EXECUTIVE KPI COMMAND RIBBON (4 METRICS)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Dokumen Laporan Resmi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Dokumen Laporan Resmi</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.totalReportsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Berkas Otomatis</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Format unggah</span>
            <span>PDF dan CSV</span>
          </div>
        </div>

        {/* KPI 2: BAST Digital Sah BSSN */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>BAST Digital Valid</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.validBastCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">berstempel</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Kolom stempel</span>
            <span>diisi manual pada prototipe</span>
          </div>
        </div>

        {/* KPI 3: Anggaran Diotorisasi Cair */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Payment Clearance</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Rp {kpiData.totalApprovedMoney} M
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-blue-700">Rekomendasi SP2D</span>
            <span>Hanya atas porsi lolos AI</span>
          </div>
        </div>

        {/* KPI 4: Audit Forensik & Penyelamatan Kas Negara */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Anggaran Terselamatkan</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              Rp {kpiData.totalSafeguardedMoney} Jt
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">Zero Kebocoran</span>
            <span>Klaim basi &amp; rusak dipotong</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. VISUALIZATIONS & CHARTS
          ==================================================================== */}
      <ReportsCharts bastList={bastList} invoicesList={invoices} />

      {/* ====================================================================
          4. MAIN VIEW TABS & FILTER BAR
          ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Katalog Laporan Resmi ({reports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bast')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'bast'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Penerbitan BAST Digital ({bastList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Otorisasi Pencairan Katering ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('forensic')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'forensic'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Audit Forensik Anggaran ({forensicFindings.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tampilan:</span>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => setDensity('normal')}
                className={`px-2.5 py-1 font-medium transition cursor-pointer ${
                  density === 'normal'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1 font-medium transition cursor-pointer ${
                  density === 'compact'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode laporan, nomor BAST, nama sekolah, atau SPPG..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {activeTab === 'reports' && (
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori Laporan</option>
                <option value="distribution">Distribusi &amp; Logistik</option>
                <option value="nutrition">Kepatuhan Gizi &amp; AKG</option>
                <option value="incidents">Logistik &amp; Insiden</option>
                <option value="financial">Keuangan &amp; APBN</option>
                <option value="attendance">Presensi &amp; Efisiensi</option>
              </select>
            </div>
          )}
        </div>

        {/* ====================================================================
            TAB 1: KATALOG LAPORAN RESMI (OFFICIAL REPORTS)
            ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800">
                      {report.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {report.auditBadge}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug mb-1">
                    {report.title}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600 mb-3">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Periode:</span>
                      <strong className="text-slate-800">{report.period}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Cakupan Wilayah:</span>
                      <strong className="text-slate-800">{report.scope}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Total Porsi Terlaporkan:</span>
                      <strong className="text-slate-800">{report.totalPortions.toLocaleString('id-ID')} Porsi</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Tingkat Kesuksesan:</span>
                      <strong className="text-emerald-700">{report.successRate}%</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {report.generatedAt}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportOneReportCsv(report)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition cursor-pointer flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>CSV</span>
                    </button>

                    {/* TODO(backend): PDF/XLSX need a real generator. Not shipped in the
                        prototype, so they are shown as text rather than as dead buttons. */}
                    <span className="text-[11px] text-slate-500">
                      {report.fileFormats
                        .filter((f) => f !== 'CSV')
                        .join(', ') || 'PDF'} belum tersedia
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====================================================================
            TAB 2: PENERBITAN BAST DIGITAL (DIGITAL ACCEPTANCE CERTIFICATES)
            ==================================================================== */}
        {activeTab === 'bast' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full table-fixed min-w-[1050px] text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="w-48 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">No. BAST &amp; Tanggal</th>
                  <th className="w-56 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Sekolah Sasaran (NPSN)</th>
                  <th className="w-52 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Dapur SPPG Rekanan</th>
                  <th className="w-40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Porsi Dipesan vs AI</th>
                  <th className="w-36 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Suhu Tiba &amp; Waktu</th>
                  <th className="w-40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nilai Subtotal</th>
                  <th className="w-44 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status Kriptografis</th>
                  <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBast.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada dokumen BAST yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBast.map((bast) => (
                    <tr key={bast.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {bast.refNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {bast.date} • {bast.deliveryTime}
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {bast.schoolName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          NPSN: {bast.npsn}
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {bast.sppgName}
                        </span>
                        <span className="text-[11px] text-blue-700 block font-medium">
                          {bast.menuPackage}
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {bast.verifiedAiPortions}
                          </span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-500">{bast.orderedPortions} porsi</span>
                        </div>
                        {bast.rejectedPortions > 0 && (
                          <span className="text-[10px] font-bold text-rose-800 block">
                            Ditolak AI: {bast.rejectedPortions} boks
                          </span>
                        )}
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span
                          className={`font-semibold block ${
                            bast.thermalTempArrive.includes('BAHAYA')
                              ? 'text-rose-800'
                              : 'text-slate-900'
                          }`}
                        >
                          {bast.thermalTempArrive.split(' ')[0]}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {bast.driverName.split(' ')[0]}
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block">
                          Rp {bast.subtotalAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          @ Rp 14.900/porsi
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                            bast.paymentClearanceStatus === 'cleared'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bast.paymentClearanceStatus === 'adjusted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {bast.paymentClearanceStatus !== 'blocked' ? (
                            <ShieldCheck className="h-3 w-3 text-emerald-800 shrink-0" />
                          ) : (
                            <Ban className="h-3 w-3 text-rose-800 shrink-0" />
                          )}
                          <span className="truncate">
                            {bast.paymentClearanceStatus === 'blocked' ? 'Belum terbit' : 'Data simulasi'}
                          </span>
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'} text-right`}>
                        <button
                          onClick={() => setSelectedBast(bast)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-800 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          Preview &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================================
            TAB 3: OTORISASI PENCAIRAN DANA KATERING (PAYMENT CLEARANCE)
            ==================================================================== */}
        {activeTab === 'invoices' && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <DollarSign className="h-4 w-4 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Protokol Otorisasi Pembayaran Termin APBN MBG:</strong>
                <p className="leading-relaxed text-[11px] text-blue-800">
                  Sesuai Peraturan Presiden dan juknis BGN, Superadmin menandatangani dokumen rekomendasi pencairan (SP2D) hanya jika BAST digital valid 100%. Porsi yang rusak atau berbau basi otomatis dipotong dari tagihan bruto katering.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-xs font-black bg-blue-100 text-blue-800">
                          {inv.invoiceNumber}
                        </span>
                        <strong className="text-slate-900 text-xs">{inv.sppgName}</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {inv.vendorCompany} • {inv.bankAccount}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        inv.status === 'approved_cleared'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'ready_to_sign'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inv.status === 'approved_cleared' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800" />
                      ) : inv.status === 'ready_to_sign' ? (
                        <Clock className="h-3.5 w-3.5 text-blue-800" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-800" />
                      )}
                      <span>{inv.statusLabel}</span>
                    </span>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Klaim Tagihan Vendor</span>
                      <strong className="text-slate-900 font-bold text-xs block mt-0.5">
                        Rp {inv.totalClaimedAmount.toLocaleString('id-ID')}
                      </strong>
                      <span className="text-[11px] text-slate-500">{inv.totalClaimedPortions.toLocaleString('id-ID')} Porsi</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Porsi Sah Lolos AI</span>
                      <strong className="text-emerald-700 font-bold text-xs block mt-0.5">
                        {inv.verifiedBastPortions.toLocaleString('id-ID')} Porsi
                      </strong>
                      <span className="text-[10px] text-emerald-800 font-medium">Valid BAST 100%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                      <span className="text-[10px] text-rose-800 block">Potongan Porsi Rusak/Denda</span>
                      <strong className="text-rose-700 font-bold text-xs block mt-0.5">
                        -Rp {inv.penaltyDeductionAmount.toLocaleString('id-ID')}
                      </strong>
                      <span className="text-[10px] text-rose-800">
                        {inv.rejectedDeductionPortions} porsi ditolak
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 block font-semibold">Total Nilai Otorisasi Cair</span>
                      <strong className="text-emerald-900 font-black text-sm block mt-0.5">
                        Rp {inv.approvedPaymentAmount.toLocaleString('id-ID')}
                      </strong>
                      <span className="text-[10px] text-emerald-700">Pagu APBN Sesuai</span>
                    </div>
                  </div>

                  {/* Actions / Sign-off info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                    {inv.status === 'approved_cleared' ? (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                        <span>SP2D No: <strong>{inv.sp2dNumber}</strong> ditandatangani pada {inv.signedAt} oleh {inv.signedBy}</span>
                      </p>
                    ) : inv.status === 'ready_to_sign' ? (
                      <p className="text-[11px] text-blue-800 font-medium">
                        BAST digital lengkap. Menunggu tanda tangan otorisasi Superadmin Satgas MBG.
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-700 font-medium">
                        Klaim dibekukan karena terdapat temuan anomali suhu dingin / makanan basi. Menunggu audit BPKP.
                      </p>
                    )}

                    {inv.status === 'ready_to_sign' && (
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Tandatangani &amp; Otorisasi SP2D</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: AUDIT FORENSIK ANGGARAN (FORENSIC AUDIT ENGINE)
            ==================================================================== */}
        {activeTab === 'forensic' && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Mesin Audit Forensik Otomatis (Budget Safeguard Engine):</strong>
                <p className="leading-relaxed text-[11px] text-emerald-800">
                  Algoritma backend secara mandiri mencocokkan setiap token QR yang dipindai kamera AI validator dengan klaim tagihan vendor. Menjamin uang negara tidak pernah dibayarkan untuk porsi yang basi, tidak terkirim, atau porsi siluman.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredForensic.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 text-rose-800">
                        {item.id}
                      </span>
                      <strong className="text-slate-900 text-xs">{item.findingTypeLabel}</strong>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                      <span>{item.statusLabel}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[10px]">Vendor &amp; Invoice</span>
                      <strong className="text-slate-900 font-semibold block mt-0.5">{item.sppgName}</strong>
                      <span className="text-slate-500 text-[10px]">{item.invoiceRef}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[10px]">Selisih Porsi Anomali</span>
                      <strong className="text-rose-700 font-bold block mt-0.5">{item.discrepancyCount} Porsi Bermasalah</strong>
                      <span className="text-slate-500 text-[10px]">Ditolak AI Kamera Validator</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-emerald-800 font-semibold block text-[10px]">Potensi Kerugian Dicegah</span>
                      <strong className="text-emerald-900 font-black text-sm block mt-0.5">
                        Rp {item.potentialLossAmount.toLocaleString('id-ID')}
                      </strong>
                      <span className="text-emerald-700 text-[10px]">Dipotong dari Tagihan</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Uraian Temuan Forensik:</strong> {item.explanation}
                    </p>
                    <p className="text-emerald-800 font-medium">
                      <strong>Tindakan Superadmin:</strong> {item.actionTaken}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL 1: GENERATE BERKAS LAPORAN RESMI
          ==================================================================== */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Buat Laporan Resmi Satgas MBG
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Generator Berkas Siap Audit BPK &amp; BPKP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Dokumen Laporan</label>
                <input
                  type="text"
                  required
                  value={generateForm.title}
                  onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                  placeholder="Contoh: Laporan Akuntabilitas Porsi MBG Wilayah Jawa Barat Tahap III"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Laporan</label>
                  <select
                    value={generateForm.category}
                    onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                  >
                    <option value="distribution">Distribusi &amp; Logistik</option>
                    <option value="nutrition">Kepatuhan Gizi &amp; AKG</option>
                    <option value="incidents">Logistik &amp; Insiden</option>
                    <option value="financial">Keuangan &amp; APBN</option>
                    <option value="attendance">Presensi &amp; Efisiensi</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Format Utama</label>
                  <select
                    value={generateForm.format}
                    onChange={(e) => setGenerateForm({ ...generateForm, format: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                  >
                    <option value="PDF">PDF (Kop Surat Resmi Satgas MBG)</option>
                    <option value="XLSX">XLSX (Excel Workbook Audit)</option>
                    <option value="CSV">CSV (Raw Data Analitik)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Periode Waktu</label>
                  <input
                    type="text"
                    required
                    value={generateForm.period}
                    onChange={(e) => setGenerateForm({ ...generateForm, period: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cakupan Wilayah</label>
                  <input
                    type="text"
                    required
                    value={generateForm.scope}
                    onChange={(e) => setGenerateForm({ ...generateForm, scope: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Otoritas Penandatangan</label>
                <input
                  type="text"
                  required
                  value={generateForm.signee}
                  onChange={(e) => setGenerateForm({ ...generateForm, signee: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Generate Laporan Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: OTORISASI PENCAIRAN TERMIN (PAYMENT CLEARANCE MODAL)
          ==================================================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Otorisasi Pencairan Termin (SP2D Clearance)
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAuthorizePayment} className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Vendor:</span>
                  <strong className="text-slate-900">{selectedInvoice.vendorCompany}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dapur SPPG:</span>
                  <strong className="text-slate-900">{selectedInvoice.sppgName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Porsi Sah BAST:</span>
                  <strong className="text-emerald-700">{selectedInvoice.verifiedBastPortions.toLocaleString('id-ID')} Porsi (100% Lolos AI)</strong>
                </div>
                {selectedInvoice.penaltyDeductionAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Potongan Basi / Rusak:</span>
                    <span>-Rp {selectedInvoice.penaltyDeductionAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-emerald-800">
                  <span>Nilai Bersih SP2D:</span>
                  <span>Rp {selectedInvoice.approvedPaymentAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Surat Perintah Pencairan Dana (SP2D)</label>
                <input
                  type="text"
                  required
                  value={clearanceForm.sp2dNumber}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, sp2dNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Verifikasi Superadmin</label>
                <textarea
                  rows={2}
                  required
                  value={clearanceForm.notes}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                <strong>Catatan prototipe:</strong> persetujuan pada prototipe ini dicatat di memori peramban saja. Belum ada penandatanganan elektronik, verifikasi hashing, atau keterkaitan ke sistem pembayaran mana pun.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Tandatangani &amp; Terbitkan SP2D</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: PREVIEW DOKUMEN BAST DIGITAL RESMI
          ==================================================================== */}
      {selectedBast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase block">
                  Badan Gizi Nasional (BGN) Republik Indonesia
                </span>
                <h3 className="font-black text-slate-900 text-sm">
                  BERITA ACARA SERAH TERIMA (BAST) DIGITAL
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedBast.refNumber}</p>
              </div>
              <button
                onClick={() => setSelectedBast(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-500">Sekolah Penerima:</span>
                  <strong className="text-slate-900">{selectedBast.schoolName} (NPSN: {selectedBast.npsn})</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Dapur Penyedia (SPPG):</span>
                  <strong className="text-slate-900">{selectedBast.sppgName} ({selectedBast.sppgId})</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Paket Menu MBG:</span>
                  <strong className="text-blue-700">{selectedBast.menuPackage}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Waktu &amp; Suhu Serah Terima:</span>
                  <strong className="text-slate-900">{selectedBast.deliveryTime} • {selectedBast.thermalTempArrive}</strong>
                </p>
              </div>

              {/* Portion Verification Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Porsi Dipesan</span>
                  <strong className="text-slate-800 text-sm">{selectedBast.orderedPortions}</strong>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-700 block text-[10px]">Lolos AI Kamera</span>
                  <strong className="text-emerald-800 text-sm">{selectedBast.verifiedAiPortions}</strong>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="text-rose-700 block text-[10px]">Ditolak AI / Basi</span>
                  <strong className="text-rose-800 text-sm">{selectedBast.rejectedPortions}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-slate-600">
                  <strong>Catatan Hasil Pemindaian:</strong> {selectedBast.approvalNotes}
                </p>
                <p className="text-slate-600">
                  <strong>Guru Validator:</strong> {selectedBast.leadValidator}
                </p>
                <p className="text-slate-600">
                  <strong>Pengemudi Armada:</strong> {selectedBast.driverName}
                </p>
              </div>

              {/* Cryptographic Proof */}
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1">
                <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{selectedBast.bsreStatus}</span>
                </p>
                <p className="text-slate-500 truncate">
                  Token: {selectedBast.sha256Hash}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="font-extrabold text-slate-900">
                Nilai Tagihan BAST: Rp {selectedBast.subtotalAmount.toLocaleString('id-ID')}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadFile(
                      `BAST_${selectedBast.refNumber.replace(/\//g, '_')}.csv`,
                      'text/csv;charset=utf-8',
                      '﻿' + [
                        ['Nomor BAST', selectedBast.refNumber],
                        ['Tanggal', selectedBast.date],
                        ['Sekolah', selectedBast.schoolName],
                        ['Dapur SPPG', selectedBast.sppgName],
                        ['Porsi dipesan', selectedBast.orderedPortions],
                        ['Porsi lolos AI', selectedBast.aiApprovedPortions],
                        ['Porsi ditolak', selectedBast.aiRejectedPortions],
                        ['Suhu saat tiba', selectedBast.arrivalTemp],
                        ['Subtotal (Rp)', selectedBast.subtotalAmount],
                      ].map((r) => r.map(csvCell).join(',')).join('\n')
                    )
                    showToast(`Rekap BAST ${selectedBast.refNumber} diunduh.`)
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Rekap BAST</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBast(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
