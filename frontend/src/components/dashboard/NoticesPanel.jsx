import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Megaphone,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Search,
  Download,
  Printer,
  Plus,
  MoreVertical,
  Send,
  Archive,
  Trash2,
  Lock,
  Eye,
  Paperclip,
  Users
} from 'lucide-react'
import { NoticesCharts } from './NoticesCharts'
import { StatusDot } from './tableKit'
import {
  NOTICE_CATEGORIES,
  TARGET_AUDIENCES,
  URGENCY_LEVELS
} from '../../data/noticesData'

export function NoticesPanel({
  noticesList = [],
  onSuperadminAction = () => {},
  showToast = () => {}
}) {
  const [notices, setNotices] = useState(noticesList)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'archived'
  const [density, setDensity] = useState('normal') // 'normal' | 'compact'

  // Modals & Drawer State
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Superadmin Action Modals
  const [composeModalOpen, setComposeModalOpen] = useState(false)
  const [flashAlertModalData, setFlashAlertModalData] = useState(null) // { notice }
  const [archiveModalData, setArchiveModalData] = useState(null) // { notice, isArchiving }
  const [deleteModalData, setDeleteModalData] = useState(null) // { notice }

  // Form State for Composing Notice
  const [composeForm, setComposeForm] = useState({
    title: '',
    refNumber: 'BGN/SE/095/IX/2026',
    category: 'circular',
    urgency: 'important',
    targetAudience: 'all',
    scopeRegion: 'Nasional (Seluruh Indonesia)',
    authorName: 'Badan Gizi Nasional (BGN)',
    authorRole: 'Direktorat Pengawasan Mutu & Higienitas',
    content: '',
    effectiveDate: 'Berlaku Segera',
    isFlashAlert: false,
    requiresAcknowledgement: true,
    attachmentName: 'Surat_Edaran_Resmi_BGN.pdf'
  })

  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered notices
  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.refNumber.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        n.author.name.toLowerCase().includes(search.toLowerCase()) ||
        n.scopeRegion.toLowerCase().includes(search.toLowerCase())

      const matchCategory = categoryFilter === 'all' || n.category === categoryFilter
      const matchUrgency = urgencyFilter === 'all' || n.urgency === urgencyFilter
      const matchAudience = audienceFilter === 'all' || n.targetAudience === audienceFilter
      const matchStatus = statusFilter === 'all' || n.status === statusFilter

      return matchSearch && matchCategory && matchUrgency && matchAudience && matchStatus
    })
  }, [notices, search, categoryFilter, urgencyFilter, audienceFilter, statusFilter])

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const total = notices.length
    const activeCount = notices.filter((n) => n.status === 'active').length
    const archivedCount = notices.filter((n) => n.status === 'archived').length
    const flashAlertCount = notices.filter((n) => n.status === 'active' && n.isFlashAlert).length

    const activeList = notices.filter((n) => n.status === 'active')
    const totalAcks = activeList.reduce((acc, n) => acc + n.acknowledgementStats.acknowledgedCount, 0)
    const totalRecips = activeList.reduce((acc, n) => acc + n.acknowledgementStats.totalRecipients, 0)
    const avgCompliance = totalRecips ? Math.round((totalAcks / totalRecips) * 100) : 100

    const attachmentCount = notices.filter((n) => n.attachments.length > 0).length

    return {
      total,
      activeCount,
      archivedCount,
      flashAlertCount,
      avgCompliance,
      attachmentCount
    }
  }, [notices])

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      'Nomor Referensi',
      'Judul Pengumuman',
      'Kategori',
      'Urgensi',
      'Sasaran Penerima',
      'Wilayah Cakupan',
      'Penulis / Penerbit',
      'Tanggal Tayang',
      'Status Tayang',
      'Wajib Konfirmasi',
      'Penerima Total',
      'Dikonfirmasi',
      'Tingkat Kepatuhan (%)'
    ]

    const rows = filtered.map((n) => [
      `"${n.refNumber}"`,
      `"${n.title}"`,
      `"${n.categoryLabel}"`,
      `"${n.urgencyLabel}"`,
      `"${n.targetAudienceLabel}"`,
      `"${n.scopeRegion}"`,
      `"${n.author.name}"`,
      `"${n.publishedAt}"`,
      `"${n.statusLabel}"`,
      n.requiresAcknowledgement ? 'Ya' : 'Tidak',
      n.acknowledgementStats.totalRecipients,
      n.acknowledgementStats.acknowledgedCount,
      `${n.acknowledgementStats.complianceRate}%`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Papan_Pengumuman_Satgas_MBG_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Daftar maklumat resmi berhasil diekspor dalam format CSV!')
  }

  // Handle Compose Notice Submit
  const handleComposeSubmit = (e) => {
    e.preventDefault()
    if (!composeForm.title || !composeForm.content) {
      showToast('Judul dan isi maklumat wajib diisi!')
      return
    }

    const catObj = NOTICE_CATEGORIES.find((c) => c.id === composeForm.category) || NOTICE_CATEGORIES[1]
    const urgObj = URGENCY_LEVELS.find((u) => u.id === composeForm.urgency) || URGENCY_LEVELS[0]
    const audObj = TARGET_AUDIENCES.find((a) => a.id === composeForm.targetAudience) || TARGET_AUDIENCES[0]

    const newNoticeItem = {
      id: `NOT-${Date.now().toString().slice(-4)}`,
      refNumber: composeForm.refNumber,
      title: composeForm.title,
      category: composeForm.category,
      categoryLabel: catObj.label,
      urgency: composeForm.urgency,
      urgencyLabel: urgObj.label,
      targetAudience: composeForm.targetAudience,
      targetAudienceLabel: audObj.label,
      scopeRegion: composeForm.scopeRegion,
      publishedAt: 'Baru saja',
      effectiveDate: composeForm.effectiveDate,
      author: {
        name: composeForm.authorName,
        role: composeForm.authorRole
      },
      content: composeForm.content,
      isFlashAlert: composeForm.urgency === 'critical' || composeForm.isFlashAlert,
      requiresAcknowledgement: composeForm.requiresAcknowledgement,
      acknowledgementStats: {
        totalRecipients: composeForm.targetAudience === 'sppg' ? 180 : composeForm.targetAudience === 'validators' ? 1250 : 1850,
        acknowledgedCount: 0,
        complianceRate: 0.0
      },
      attachments: composeForm.attachmentName
        ? [
            {
              fileName: composeForm.attachmentName,
              fileSize: '1.2 MB',
              verifiedSignature: 'Belum diverifikasi'
            }
          ]
        : [],
      status: 'active',
      statusLabel: 'Tayang Publik'
    }

    setNotices([newNoticeItem, ...notices])
    setComposeModalOpen(false)
    showToast(`Maklumat resmi "${newNoticeItem.title}" berhasil dipublikasikan ke jaringan MBG!`)
    onSuperadminAction('CREATE_NOTICE', newNoticeItem)
  }

  // Handle Trigger Flash Alert
  const handleTriggerFlashAlert = (e) => {
    e.preventDefault()
    if (!flashAlertModalData) return

    const { notice } = flashAlertModalData

    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === notice.id) {
          return {
            ...n,
            urgency: 'critical',
            urgencyLabel: 'Panggilan Darurat (Flash Alert)',
            isFlashAlert: true,
            requiresAcknowledgement: true,
            statusReason: 'Siaran Flash Alert Aktif. Aplikasi validator terkunci hingga konfirmasi diterima.'
          }
        }
        return s
      })
    )

    setFlashAlertModalData(null)
    showToast(`Penyiaran Darurat (Flash Alert) aktif! Semua aplikasi validator diwajibkan melakukan konfirmasi sebelum kamera pemindai dapat digunakan.`)
    onSuperadminAction('BROADCAST_FLASH_ALERT', { noticeId: notice.id })
  }

  // Handle Archive / Restore Notice
  const handleArchiveSubmit = (e) => {
    e.preventDefault()
    if (!archiveModalData) return

    const { notice, isArchiving } = archiveModalData

    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === notice.id) {
          return {
            ...n,
            status: isArchiving ? 'archived' : 'active',
            statusLabel: isArchiving ? 'Diarsipkan' : 'Tayang Publik'
          }
        }
        return n
      })
    )

    setArchiveModalData(null)
    const actText = isArchiving ? 'diarsipkan dari papan publik' : 'diaktifkan kembali'
    showToast(`Pengumuman "${notice.title}" berhasil ${actText}!`)
    onSuperadminAction('TOGGLE_ARCHIVE_NOTICE', { noticeId: notice.id, isArchiving })
  }

  // Handle Delete Notice
  const handleDeleteSubmit = (e) => {
    e.preventDefault()
    if (!deleteModalData) return

    const { notice } = deleteModalData
    setNotices((prev) => prev.filter((n) => n.id !== notice.id))
    setDeleteModalData(null)
    showToast(`Pengumuman "${notice.title}" berhasil dihapus permanen!`)
    onSuperadminAction('DELETE_NOTICE', { noticeId: notice.id })
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT TOP UTILITY & ACTION BAR (NO BLOATED CARDS, NO COUNTDOWN)
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Pusat Komando Siaran Terpadu Satgas MBG &amp; Badan Gizi Nasional (BGN)
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor Maklumat (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak Rekap</span>
          </button>

          <button
            onClick={() => setComposeModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Pengumuman Baru</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. EXECUTIVE KPI COMMAND RIBBON (4 METRICS)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Maklumat Tayang Aktif */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Maklumat Aktif</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{kpiStats.activeCount}</span>
            <span className="text-xs font-medium text-slate-500">Tayang Publik</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">Tersinkronisasi ke Seluler</span>
            <span>&bull;</span>
            <span className="text-slate-500">{kpiStats.archivedCount} Arsip</span>
          </div>
        </div>

        {/* KPI 2: Panggilan Darurat (Flash Alert) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Siaran Flash Alert</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{kpiStats.flashAlertCount}</span>
            <span className="text-xs font-medium text-slate-500">Kunci Kamera Aktif</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {kpiStats.flashAlertCount > 0 ? (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Wajib Konfirmasi (Penarikan Menu)</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">Tidak ada kedaruratan aktif</span>
            )}
          </div>
        </div>

        {/* KPI 3: Kepatuhan Konfirmasi Sasaran */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Tingkat Keterbacaan</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{kpiStats.avgCompliance}%</span>
            <span className="text-xs font-medium text-slate-500">Telah Acknowledge</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">Guru &amp; Dapur Terverifikasi</span>
          </div>
        </div>

        {/* KPI 4: Dokumen Resmi Terlampir */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Dokumen Resmi</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{kpiStats.attachmentCount}</span>
            <span className="text-xs font-medium text-slate-500">Berkas PDF BGN</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] border-t border-slate-100 pt-2">
            <span className="text-slate-600 font-medium">Belum ditandatangani secara elektronik</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. VISUALIZATION CHARTS: URGENSI & KETERBACAAN
          ==================================================================== */}
      <NoticesCharts notices={notices} />

      {/* ====================================================================
          4. SEARCH, FILTER & DENSITY TOOLBAR
          ==================================================================== */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul maklumat, nomor surat BGN, isi arahan, penerbit, atau wilayah..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Select: Sasaran Penerima & Status */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {TARGET_AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">Semua Status Publikasi</option>
              <option value="active">Tayang Publik</option>
              <option value="archived">Diarsipkan</option>
            </select>

            {/* Density Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50 p-0.5 text-xs">
              <button
                onClick={() => setDensity('normal')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  density === 'normal'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Normal"
              >
                Normal
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Rapat"
              >
                Rapat
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips: Category & Urgency */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Kategori:
            </span>
            {NOTICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Urgensi:
            </span>
            {[
              { id: 'all', label: 'Semua Urgensi' },
              { id: 'critical', label: 'Panggilan Darurat' },
              { id: 'important', label: 'Penting' },
              { id: 'info', label: 'Info Biasa' }
            ].map((urg) => (
              <button
                key={urg.id}
                onClick={() => setUrgencyFilter(urg.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                  urgencyFilter === urg.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {urg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. MASTER NOTICES TABLE (TABLE-FIXED)
          ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed min-w-[1050px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2.5 px-4 w-[32%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Judul Maklumat &amp; Nomor Surat</th>
                <th className="py-2.5 px-4 w-[18%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Kategori &amp; Urgensi</th>
                <th className="py-2.5 px-4 w-[18%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Sasaran Penerima &amp; Wilayah</th>
                <th className="py-2.5 px-4 w-[16%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Kepatuhan Konfirmasi</th>
                <th className="py-2.5 px-4 w-[10%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Lampiran &amp; Status</th>
                <th className="py-2.5 px-4 w-[6%] text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Megaphone className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Tidak ada pengumuman yang cocok dengan filter</p>
                    <p className="text-[11px] text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isMenuOpen = openMenuId === item.id
                  const isCompact = density === 'compact'
                  const padClass = isCompact ? 'py-2.5 px-4' : 'py-3.5 px-4'

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => setSelectedNotice(item)}
                    >
                      {/* Col 1: Judul & No Surat */}
                      <td className={padClass}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {item.isFlashAlert && (
                              <span className="shrink-0 flex h-2 w-2 relative">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-sm group-hover:text-blue-800 transition truncate leading-snug">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span>Ref: <strong className="text-slate-700">{item.refNumber}</strong></span>
                            <span>&bull;</span>
                            <span>{item.publishedAt}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate" title={item.author.name}>
                            Penerbit: {item.author.name} ({item.author.role})
                          </p>
                        </div>
                      </td>

                      {/* Col 2: Kategori & Urgensi */}
                      <td className={padClass}>
                        <div className="space-y-1.5">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.categoryLabel}
                            </span>
                          </div>

                          <div>
                            {item.urgency === 'critical' && (
                              <StatusDot tone="critical">Panggilan Darurat</StatusDot>
                            )}
                            {item.urgency === 'important' && (
                              <StatusDot tone="warn">Penting</StatusDot>
                            )}
                            {item.urgency === 'info' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                                <span>Info Biasa</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Sasaran Penerima & Wilayah */}
                      <td className={padClass}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                            <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{item.targetAudienceLabel}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 truncate" title={item.scopeRegion}>
                            Cakupan: {item.scopeRegion}
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.effectiveDate}
                          </div>
                        </div>
                      </td>

                      {/* Col 4: Kepatuhan Konfirmasi */}
                      <td className={padClass}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono">
                              {item.acknowledgementStats.acknowledgedCount} / {item.acknowledgementStats.totalRecipients}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {item.acknowledgementStats.complianceRate}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.acknowledgementStats.complianceRate >= 90
                                  ? 'bg-emerald-500'
                                  : item.acknowledgementStats.complianceRate >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.acknowledgementStats.complianceRate}%` }}
                            />
                          </div>

                          {item.requiresAcknowledgement ? (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" />
                              <span>Wajib Konfirmasi</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Siaran Informasi Umum</span>
                          )}
                        </div>
                      </td>

                      {/* Col 5: Lampiran & Status */}
                      <td className={padClass}>
                        <div className="space-y-1.5">
                          {item.attachments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Paperclip className="h-3 w-3" />
                              <span>PDF Resmi</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">-</span>
                          )}

                          <div>
                            {item.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Tayang</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                <span>Diarsipkan</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Col 6: Aksi */}
                      <td className={`${padClass} text-right`} onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left" ref={isMenuOpen ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Menu Aksi Superadmin"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-30 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                              <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
                                Aksi Maklumat
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedNotice(item)
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-800" />
                                <span>Lihat Isi Lengkap &amp; Berkas</span>
                              </button>

                              {!item.isFlashAlert && item.status === 'active' && (
                                <button
                                  onClick={() => {
                                    setFlashAlertModalData({ notice: item })
                                    setOpenMenuId(null)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-700 cursor-pointer font-medium"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-800" />
                                  <span>Siarkan Flash Alert (Kunci Kamera)</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setArchiveModalData({
                                    notice: item,
                                    isArchiving: item.status === 'active'
                                  })
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                              >
                                <Archive className="h-3.5 w-3.5 text-slate-500" />
                                <span>{item.status === 'active' ? 'Arsipkan Maklumat' : 'Aktifkan Kembali'}</span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                onClick={() => {
                                  setDeleteModalData({ notice: item })
                                  setOpenMenuId(null)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-800" />
                                <span>Hapus Permanen</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-900">{filtered.length}</strong> dari{' '}
            <strong className="text-slate-900">{notices.length}</strong> maklumat pusat komando
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            SINGLE SOURCE OF TRUTH &bull; BGN SATGAS MBG
          </span>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: BUAT PENGUMUMAN BARU (COMPOSE NOTICE)
          ==================================================================== */}
      {composeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Penerbitan Maklumat / Surat Edaran Resmi</h3>
                  <p className="text-xs text-slate-500">Siarkan arahan kebijakan BGN &amp; Satgas MBG nasional</p>
                </div>
              </div>
              <button
                onClick={() => setComposeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Row 1: Nomor Ref & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Referensi Surat Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BGN/SE/095/IX/2026"
                    value={composeForm.refNumber}
                    onChange={(e) => setComposeForm({ ...composeForm, refNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Maklumat</label>
                  <select
                    value={composeForm.category}
                    onChange={(e) => setComposeForm({ ...composeForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="circular">Surat Edaran BGN</option>
                    <option value="seasonal">Peringatan Higienitas Musiman</option>
                    <option value="system">Pembaruan Sistem &amp; AI</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Judul Maklumat */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Peringatan Peningkatan Standar Filtrasi Air Dapur Menjelang Musim Hujan"
                  value={composeForm.title}
                  onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Row 3: Sasaran Penerima & Urgensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sasaran Penerima (*Audience*)</label>
                  <select
                    value={composeForm.targetAudience}
                    onChange={(e) => setComposeForm({ ...composeForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="all">Semua Pihak (Nasional)</option>
                    <option value="validators">Hanya Guru Validator Sekolah</option>
                    <option value="sppg">Hanya Dapur SPPG &amp; Katering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Urgensi</label>
                  <select
                    value={composeForm.urgency}
                    onChange={(e) => setComposeForm({ ...composeForm, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="info">Info Biasa (General)</option>
                    <option value="important">Penting (Advis Operasional)</option>
                    <option value="critical">Panggilan Darurat (Flash Alert - Kunci Kamera)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Wilayah & Masa Berlaku */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wilayah Cakupan</label>
                  <input
                    type="text"
                    placeholder="Nasional (Seluruh Indonesia) / Jawa Timur..."
                    value={composeForm.scopeRegion}
                    onChange={(e) => setComposeForm({ ...composeForm, scopeRegion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Masa Berlaku Arahan</label>
                  <input
                    type="text"
                    placeholder="Berlaku Segera / s.d 15 Okt 2026"
                    value={composeForm.effectiveDate}
                    onChange={(e) => setComposeForm({ ...composeForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 5: Isi Maklumat Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Isi Pesan Arahan Resmi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan arahan resmi, dasar hukum, dan instruksi tindakan yang wajib diambil..."
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed font-sans"
                />
              </div>

              {/* Row 6: Lampiran Berkas PDF & Wajib Konfirmasi */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="reqAck"
                      checked={composeForm.requiresAcknowledgement}
                      onChange={(e) => setComposeForm({ ...composeForm, requiresAcknowledgement: e.target.checked })}
                      className="rounded border-slate-300 text-blue-800 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="reqAck" className="font-semibold text-slate-800 cursor-pointer">
                      Wajibkan Konfirmasi Digital (*Tap to Acknowledge*)
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500">Merekam audit trail pembacaan</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">
                    Nama Lampiran Dokumen PDF
                  </label>
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Surat_Edaran_Resmi_BGN.pdf"
                      value={composeForm.attachmentName}
                      onChange={(e) => setComposeForm({ ...composeForm, attachmentName: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComposeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Siarkan Pengumuman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: PENYIARAN DARURAT (BROADCAST FLASH ALERT)
          ==================================================================== */}
      {flashAlertModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Konfirmasi Penyiaran Flash Alert</h3>
                  <p className="text-xs text-rose-700">Protokol Kedaruratan &amp; Penguncian Kamera Pemindai</p>
                </div>
              </div>
              <button
                onClick={() => setFlashAlertModalData(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTriggerFlashAlert} className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Simulasi Tampilan HP Validator</span>
                  </span>
                  <span>LAYAR TERKUNCI</span>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-100 space-y-1.5">
                  <div className="font-bold text-xs text-rose-200">{flashAlertModalData.notice.title}</div>
                  <p className="text-[11px] text-rose-300 leading-relaxed line-clamp-3">
                    {flashAlertModalData.notice.content}
                  </p>
                  <div className="pt-2">
                    <div className="w-full py-2 bg-rose-600 text-white font-bold rounded-lg text-center text-xs shadow-sm">
                      [ Saya Mengerti &amp; Konfirmasi Arahan ]
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Guru tidak dapat membuka kamera pemeriksa sebelum menekan tombol konfirmasi di atas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-1">
                <span className="font-bold">Konsekuensi Penyiaran Flash Alert:</span>
                <p>
                  Semua guru validator di wilayah sasaran ({flashAlertModalData.notice.scopeRegion}) akan langsung menerima alarm popup berbunyi keras di aplikasi seluler mereka.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFlashAlertModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Aktifkan Flash Alert Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: ARSIPKAN / RESTORE PENGUMUMAN
          ==================================================================== */}
      {archiveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Archive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {archiveModalData.isArchiving ? 'Arsipkan Maklumat' : 'Aktifkan Kembali Maklumat'}
                  </h3>
                  <p className="text-xs text-slate-500">Papan Pengumuman Resmi</p>
                </div>
              </div>
              <button
                onClick={() => setArchiveModalData(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleArchiveSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin {archiveModalData.isArchiving ? 'mengarsipkan' : 'mengaktifkan kembali'}{' '}
                maklumat <strong>"{archiveModalData.notice.title}"</strong>?
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                {archiveModalData.isArchiving
                  ? 'Maklumat yang diarsipkan tidak akan tampil di feed utama aplikasi mobile guru dan katering, namun tetap tersimpan pada rekam audit historis.'
                  : 'Maklumat akan ditayangkan kembali di papan pengumuman publik.'}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Archive className="h-4 w-4" />
                  <span>{archiveModalData.isArchiving ? 'Ya, Arsipkan' : 'Aktifkan Kembali'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: HAPUS PERMANEN
          ==================================================================== */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Hapus Maklumat Permanen</h3>
                  <p className="text-xs text-rose-700">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalData(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus permanen maklumat <strong>"{deleteModalData.notice.title}"</strong>?
              </p>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px]">
                Seluruh log pembacaan dan rekaman konfirmasi digital dari pengumuman ini akan dihapus dari sistem.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Permanen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          DRAWER: DETAIL PENGUMUMAN LENGKAP & BERKAS RESMI
          ==================================================================== */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm font-mono">{selectedNotice.refNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {selectedNotice.categoryLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedNotice.publishedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Urgency Alert Badge */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  selectedNotice.urgency === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : selectedNotice.urgency === 'important'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
              >
                {selectedNotice.urgency === 'critical' ? (
                  <ShieldAlert className="h-5 w-5 text-rose-800 shrink-0 mt-0.5" />
                ) : selectedNotice.urgency === 'important' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-800 shrink-0 mt-0.5" />
                ) : (
                  <Megaphone className="h-5 w-5 text-blue-800 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold text-xs">{selectedNotice.urgencyLabel}</div>
                  <p className="text-[11px] opacity-90">
                    Sasaran: <strong>{selectedNotice.targetAudienceLabel}</strong> &bull; Cakupan: {selectedNotice.scopeRegion}
                  </p>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedNotice.title}
                </h2>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div>
                    Penerbit Resmi: <strong className="text-slate-800">{selectedNotice.author.name}</strong>
                  </div>
                  <div>Jabatan / Instansi: {selectedNotice.author.role}</div>
                  <div className="font-mono text-slate-500">Masa Berlaku: {selectedNotice.effectiveDate}</div>
                </div>
              </div>

              {/* Full Content */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="font-bold text-slate-900 text-xs block">
                  Isi Surat Edaran &amp; Arahan Kebijakan:
                </span>
                <div className="text-slate-700 leading-relaxed whitespace-pre-line text-xs font-sans">
                  {selectedNotice.content}
                </div>
              </div>

              {/* Attachments */}
              {selectedNotice.attachments.length > 0 && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                  <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-blue-800" />
                    <span>Lampiran Berkas PDF Resmi</span>
                  </span>
                  {selectedNotice.attachments.map((att, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white border border-blue-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-rose-800" />
                        <div>
                          <span className="font-semibold text-slate-900 block font-mono text-[11px]">{att.fileName}</span>
                          <span className="text-[10px] text-emerald-700 font-medium">{att.verifiedSignature} ({att.fileSize})</span>
                        </div>
                      </div>
                        <button
                          onClick={() => showToast(`Berkas ${att.fileName} hanya nama berkas pada prototipe. Unduhan belum tersedia.`)}
                          className="px-2.5 py-1.5 rounded-md bg-slate-50 text-slate-600 font-medium text-[11px] hover:bg-slate-100 flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Belum ada berkas</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Acknowledgment Stats */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-600" />
                    <span>Statistik Pembacaan &amp; Konfirmasi Lapangan</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {selectedNotice.acknowledgementStats.complianceRate}% Selesai
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Telah Konfirmasi</span>
                    <span className="text-base font-bold font-mono text-emerald-800">
                      {selectedNotice.acknowledgementStats.acknowledgedCount}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Pengguna</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-500 block uppercase font-medium">Belum Konfirmasi</span>
                    <span className="text-base font-bold font-mono text-slate-700">
                      {selectedNotice.acknowledgementStats.totalRecipients - selectedNotice.acknowledgementStats.acknowledgedCount}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Pengguna</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  setArchiveModalData({
                    notice: selectedNotice,
                    isArchiving: selectedNotice.status === 'active'
                  })
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                {selectedNotice.status === 'active' ? 'Arsipkan Maklumat' : 'Aktifkan Kembali'}
              </button>

              {!selectedNotice.isFlashAlert && selectedNotice.status === 'active' && (
                <button
                  onClick={() => {
                    setFlashAlertModalData({ notice: selectedNotice })
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Siarkan Flash Alert</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
