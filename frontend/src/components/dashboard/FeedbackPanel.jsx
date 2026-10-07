import { useState, useMemo } from 'react'
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Printer,
  Plus,
  Eye,
  Check,
  X,
  PhoneCall,
  Activity,
  Flame,
  Ban
} from 'lucide-react'
import { FeedbackCharts } from './FeedbackCharts'
import {
  INITIAL_FEEDBACK_TICKETS,
  EMERGENCY_HEALTH_CENTERS,
  SEVERITY_LEVEL_OPTIONS,
  TICKET_STATUS_OPTIONS
} from '../../data/feedbackData'

export function FeedbackPanel({
  onSuperadminAction = () => {},
  showToast = () => {}
}) {
  // Main Data States
  const [tickets, setTickets] = useState(INITIAL_FEEDBACK_TICKETS)
  const [healthCenters] = useState(EMERGENCY_HEALTH_CENTERS)

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState('triage') // 'triage' | 'killswitch' | 'medical' | 'audit'
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [density, setDensity] = useState('normal') // 'normal' | 'compact'

  // Modals
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null)
  const [killSwitchModalData, setKillSwitchModalData] = useState(null) // { ticket }
  const [medicalModalData, setMedicalModalData] = useState(null) // { ticket }
  const [closeTicketModalData, setCloseTicketModalData] = useState(null) // { ticket }
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false)

  // Form State: Buat Tiket Aduan Baru
  const [newTicketForm, setNewTicketForm] = useState({
    schoolName: '',
    npsn: '',
    schoolAddress: '',
    sppgName: 'SPPG Sentral Sukajadi Bandung',
    sppgId: 'SPPG-BDG-01',
    batchId: 'BATCH-BDG-0928-02',
    menuPackage: 'Paket F (Nasi Uduk Rolade Sapi)',
    severity: 'level1',
    anomalyType: 'spoiled_food',
    affectedPortions: 150,
    reporterName: '',
    reporterRole: 'Guru Validator Sekolah',
    reporterPhone: '',
    title: '',
    description: ''
  })

  // Form State: Investigasi & Tutup Tiket
  const [closeForm, setCloseForm] = useState({
    labResult: 'Negatif Cemaran Bakteri Berbahaya (Hasil Uji Labkesda Terbit)',
    compensationStatus: 'Kompensasi 100% Porsi Pengganti Telah Diterima Siswa',
    resolutionNotes: 'Dapur SPPG telah dilakukan sanitasi menyeluruh dan tagihan dipotong secara resmi.'
  })

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.schoolName.toLowerCase().includes(search.toLowerCase()) ||
        t.sppgName.toLowerCase().includes(search.toLowerCase()) ||
        t.batchId.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())

      const matchSeverity = severityFilter === 'all' || t.severity === severityFilter
      const matchStatus = statusFilter === 'all' || t.status === statusFilter

      return matchSearch && matchSeverity && matchStatus
    })
  }, [tickets, search, severityFilter, statusFilter])

  // Active Kill-Switch Batches
  const frozenBatches = useMemo(() => {
    return tickets.filter((t) => t.isKillSwitchExecuted && t.killSwitchDetails)
  }, [tickets])

  // KPIs
  const kpiData = useMemo(() => {
    const totalActive = tickets.filter((t) => t.status !== 'resolved').length
    const level1Critical = tickets.filter((t) => t.severity === 'level1').length
    const frozenCount = frozenBatches.length
    const totalProtectedPortions = frozenBatches.reduce(
      (sum, t) => sum + t.killSwitchDetails.haltedPortionsTotal,
      0
    )

    return {
      totalActive,
      level1Critical,
      frozenCount,
      totalProtectedPortions
    }
  }, [tickets, frozenBatches])

  // Export CSV
  const exportCsv = () => {
    const headers = [
      'No. Tiket',
      'Tanggal & Jam',
      'Sekolah Sasaran',
      'NPSN',
      'Dapur SPPG',
      'Batch ID',
      'Tingkat Kegawatan',
      'Jenis Anomali',
      'Porsi Terdampak',
      'Status Kill-Switch',
      'Status Penanganan'
    ]

    const rows = filteredTickets.map((t) => [
      `"${t.ticketNumber}"`,
      `"${t.reportedAt}"`,
      `"${t.schoolName}"`,
      `"${t.npsn}"`,
      `"${t.sppgName}"`,
      `"${t.batchId}"`,
      `"${t.severityLabel}"`,
      `"${t.anomalyLabel}"`,
      t.affectedPortions,
      t.isKillSwitchExecuted ? 'DIBEKUKAN (Kill-Switch)' : 'Normal',
      `"${t.statusLabel}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Aduan_Insiden_MBG_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Rekapitulasi aduan & insiden berhasil diekspor dalam format CSV!')
  }

  // Handle Execute Emergency Kill-Switch
  const handleExecuteKillSwitch = (ticket) => {
    if (onSuperadminAction?.('EXECUTE_KILL_SWITCH')?.allowed === false) return
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticket.id) {
          return {
            ...t,
            isKillSwitchExecuted: true,
            status: 'in_progress',
            statusLabel: 'DIBEKUKAN (Kill-Switch Aktif)',
            killSwitchDetails: {
              executedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('id-ID').slice(0, 5)} WIB`,
              executedBy: 'Bambang Soediro (Superadmin Satgas MBG)',
              haltedSchoolsCount: 3,
              haltedPortionsTotal: 1250,
              haltedSchools: [
                `${t.schoolName} (${t.affectedPortions} porsi)`,
                'SDN Sukagalih 02 (400 porsi)',
                'SMPN 11 Bandung (430 porsi)'
              ]
            }
          }
        }
        return t
      })
    )

    setKillSwitchModalData(null)
    showToast(`EMERGENCY KILL-SWITCH DIAKTIFKAN! Seluruh sekolah penerima batch ${ticket.batchId} DILARANG MEMBAGIKAN PORSI!`)
  }

  // Handle Create Ticket Submit
  const handleCreateTicketSubmit = (e) => {
    e.preventDefault()
    if (onSuperadminAction?.('CREATE_TICKET')?.allowed === false) return
    if (!newTicketForm.title || !newTicketForm.schoolName) {
      showToast('Mohon lengkapi judul dan nama sekolah!')
      return
    }

    const sevLabel =
      newTicketForm.severity === 'level1'
        ? 'Level 1 (Kritis - Bahaya Keracunan)'
        : newTicketForm.severity === 'level2'
        ? 'Level 2 (Sedang - Kualitas & Porsi)'
        : 'Level 3 (Rendah - Saran Rasa & Menu)'

    const newTicket = {
      id: `TKT-2026-09-${Date.now().toString().slice(-3)}`,
      ticketNumber: `INC/BGN/${Date.now().toString().slice(-4)}`,
      reportedAt: 'Baru saja',
      schoolName: newTicketForm.schoolName,
      npsn: newTicketForm.npsn || '20210099',
      schoolAddress: newTicketForm.schoolAddress || 'Alamat Sekolah Terdaftar',
      sppgName: newTicketForm.sppgName,
      sppgId: newTicketForm.sppgId,
      batchId: newTicketForm.batchId,
      menuPackage: newTicketForm.menuPackage,
      severity: newTicketForm.severity,
      severityLabel: sevLabel,
      anomalyType: newTicketForm.anomalyType,
      anomalyLabel: newTicketForm.anomalyType === 'spoiled_food' ? 'Makanan Basi & Berbau Masam' : 'Ketidaksesuaian Gramatur',
      affectedPortions: Number(newTicketForm.affectedPortions) || 100,
      reporter: {
        name: newTicketForm.reporterName || 'Validator Lapangan',
        role: newTicketForm.reporterRole,
        phone: newTicketForm.reporterPhone || '0812-0000-0000',
        nip: '198501012010011002'
      },
      title: newTicketForm.title,
      description: newTicketForm.description,
      evidencePhotos: [],
      slaDeadline: '2 Jam dari Sekarang',
      slaRemainingMinutes: 120,
      status: 'in_progress',
      statusLabel: 'Tiket Baru Masuk',
      isKillSwitchExecuted: newTicketForm.severity === 'level1',
      killSwitchDetails: newTicketForm.severity === 'level1' ? {
        executedAt: 'Baru saja',
        executedBy: 'Superadmin Satgas MBG',
        haltedSchoolsCount: 1,
        haltedPortionsTotal: Number(newTicketForm.affectedPortions) || 100,
        haltedSchools: [`${newTicketForm.schoolName} (${newTicketForm.affectedPortions} porsi)`]
      } : null,
      medicalEscalation: {
        escalated: newTicketForm.severity === 'level1',
        healthCenter: 'Puskesmas Terdekat',
        doctorInCharge: 'Tim Siaga Medis',
        doctorPhone: 'Hotline 119',
        dispatchStatus: newTicketForm.severity === 'level1' ? 'Puskesmas Bersiaga' : 'Tidak Diperlukan'
      },
      investigationStatus: {
        assignedInspector: 'Satgas Mutu Pangan BGN',
        auditTime: 'Segera',
        focus: 'Pemeriksaan sampel makanan & kebersihan dapur SPPG',
        labSampleTaken: false
      },
      resolutionNotes: null,
      closedAt: null
    }

    setTickets([newTicket, ...tickets])
    setCreateTicketModalOpen(false)
    showToast(`Tiket aduan darurat ${newTicket.ticketNumber} berhasil didaftarkan ke Pusat Triage!`)
  }

  // Handle Close Ticket Submit
  const handleCloseTicketSubmit = (e) => {
    if (onSuperadminAction?.('CLOSE_TICKET')?.allowed === false) return
    e.preventDefault()
    if (!closeTicketModalData) return

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === closeTicketModalData.id) {
          return {
            ...t,
            status: 'resolved',
            statusLabel: 'Selesai & Ditutup',
            resolutionNotes: closeForm.resolutionNotes,
            closedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString('id-ID').slice(0, 5)} WIB`
          }
        }
        return t
      })
    )

    const tNum = closeTicketModalData.ticketNumber
    setCloseTicketModalData(null)
    showToast(`Tiket aduan ${tNum} resmi DITUTUP setelah verifikasi kompensasi dan Berita Acara Uji Lab!`)
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT TOP UTILITY & ACTION BAR (NO BLOATED CARDS, NO COUNTDOWN)
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Pusat Triage Insiden Mutu Makanan, Protokol Tanggap Darurat &amp; Kill-Switch Nasional
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCsv}
            disabled={filteredTickets.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor Aduan (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak Berkas Insiden</span>
          </button>

          <button
            onClick={() => setCreateTicketModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Tiket Aduan Cepat</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. EXECUTIVE KPI COMMAND RIBBON (4 METRICS)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tiket Insiden Aktif */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Tiket Insiden Aktif</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.totalActive}
            </span>
            <span className="text-xs text-blue-800 font-semibold">Triage Terbuka</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Triage 24/7</span>
            <span>pantauan langsung sekolah</span>
          </div>
        </div>

        {/* KPI 2: Level 1 Kritis (Bahaya Keracunan) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Level 1 Kritis</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              {kpiData.level1Critical}
            </span>
            <span className="text-xs text-rose-800 font-semibold">Makanan Basi / Suhu Drop</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-rose-700">Respons Instan</span>
            <span>Emergency Kill-Switch siaga</span>
          </div>
        </div>

        {/* KPI 3: Kepatuhan SLA < 2 Jam */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Kepatuhan SLA &lt; 2 Jam</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              100%
            </span>
            <span className="text-xs text-emerald-800 font-semibold">Rata-rata 32 mnt</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">Korwil Bergerak</span>
            <span>langsung ke lokasi sekolah</span>
          </div>
        </div>

        {/* KPI 4: Batch Dibekukan (Kill-Switch) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Batch Dibekukan (Kill-Switch)</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              {kpiData.frozenCount}
            </span>
            <span className="text-xs text-rose-800 font-semibold">{kpiData.totalProtectedPortions} Porsi Dicegah</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">Zero Korban</span>
            <span>seluruh porsi tertahan aman</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. VISUALIZATIONS & CHARTS
          ==================================================================== */}
      <FeedbackCharts tickets={tickets} />

      {/* ====================================================================
          4. MAIN VIEW TABS & FILTER BAR
          ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'triage'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Pusat Triage Insiden ({tickets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('killswitch')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'killswitch'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Radar Batch Dibekukan ({frozenBatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('medical')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'medical'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Eskalasi Medis Puskesmas ({healthCenters.length})</span>
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
              placeholder="Cari nomor tiket, nama sekolah, SPPG, atau kata kunci keluhan..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {SEVERITY_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {TICKET_STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ====================================================================
            TAB 1: PUSAT TRIAGE INSIDEN & PENGADUAN
            ==================================================================== */}
        {activeTab === 'triage' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full table-fixed min-w-[1050px] text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="w-44 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">No. Tiket &amp; Waktu</th>
                  <th className="w-56 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Sekolah &amp; Pelapor</th>
                  <th className="w-52 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Dapur SPPG &amp; Batch</th>
                  <th className="w-48 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tingkat Kegawatan</th>
                  <th className="w-64 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Uraian Temuan Anomali</th>
                  <th className="w-36 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">SLA 2 Jam</th>
                  <th className="w-40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status Kill-Switch</th>
                  <th className="w-28 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada tiket aduan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        t.severity === 'level1' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {t.ticketNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block">{t.reportedAt}</span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {t.schoolName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {t.reporter.name} ({t.reporter.role.split(' ')[0]})
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span className="font-bold text-slate-900 block truncate">
                          {t.sppgName}
                        </span>
                        <span className="text-[11px] font-mono text-blue-700 block">
                          {t.batchId}
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            t.severity === 'level1'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : t.severity === 'level2'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {t.severity === 'level1' && <Flame className="h-3 w-3 text-rose-800" />}
                          {t.severity === 'level2' && <AlertTriangle className="h-3 w-3 text-amber-800" />}
                          {t.severity === 'level3' && <MessageSquare className="h-3 w-3 text-blue-800" />}
                          <span className="truncate">{t.severityLabel.split(' ')[0]} {t.severityLabel.split(' ')[1]}</span>
                        </span>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        <p className="font-semibold text-slate-900 truncate">
                          {t.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {t.description}
                        </p>
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        {t.status === 'resolved' ? (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-800" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-blue-700 block text-xs">
                              {t.slaRemainingMinutes} mnt tersisa
                            </span>
                            <span className="text-[11px] text-slate-500">Target &lt; 2 Jam</span>
                          </div>
                        )}
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                        {t.isKillSwitchExecuted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-600 text-white shadow-2xs">
                            <Ban className="h-3 w-3" />
                            <span>DIBEKUKAN</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Normal</span>
                        )}
                      </td>

                      <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTicketDetail(t)}
                            className="p-1.5 text-blue-800 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Lihat Detail Triage"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {t.severity === 'level1' && !t.isKillSwitchExecuted && (
                            <button
                              onClick={() => setKillSwitchModalData(t)}
                              className="p-1.5 text-rose-800 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eksekusi Kill-Switch Darurat"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================================
            TAB 2: RADAR EMERGENCY KILL-SWITCH (BATCH DIBEKUKAN)
            ==================================================================== */}
        {activeTab === 'killswitch' && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <Ban className="h-4.5 w-4.5 text-rose-800" />
                <span>Protokol Penghentian Distribusi Instan (Emergency Batch Kill-Switch)</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Saat tombol Kill-Switch dieksekusi, sinyal push darurat seketika dikirim ke aplikasi mobile guru validator di seluruh sekolah yang terdaftar dalam nomor batch yang sama. Kamera validator seketika memblokir pemindaian porsi dan melarang pembagian makanan ke murid.
              </p>
            </div>

            <div className="space-y-3">
              {frozenBatches.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Tidak ada batch pengiriman yang sedang dibekukan. Seluruh distribusi berjalan normal.
                </div>
              ) : (
                frozenBatches.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border-2 border-rose-300 bg-white p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-rose-600 text-white">
                            BATCH DIBEKUKAN
                          </span>
                          <strong className="text-slate-900 text-sm font-mono">{t.batchId}</strong>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Produsen: <strong>{t.sppgName}</strong> ({t.sppgId}) Ã¢â‚¬Â¢ Menu: {t.menuPackage}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Waktu Eksekusi</span>
                        <strong className="text-xs text-rose-700 font-bold">
                          {t.killSwitchDetails.executedAt}
                        </strong>
                      </div>
                    </div>

                    {/* Halted Schools Grid */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                        <span>Daftar Sekolah Terdampak Penghentian Distribusi:</span>
                        <span className="text-rose-700 font-extrabold">
                          {t.killSwitchDetails.haltedPortionsTotal} Porsi Tertahan Aman
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {t.killSwitchDetails.haltedSchools.map((sch, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{sch}</span>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              DILARANG SANTAP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action & Eskalasi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Status Investigasi:</span>
                        <strong className="text-slate-700 font-semibold">
                          {t.investigationStatus.focus}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMedicalModalData(t)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Eskalasi Medis</span>
                        </button>
                        <button
                          onClick={() => setCloseTicketModalData(t)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Tutup &amp; Konfirmasi Kompensasi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: ESKALASI MEDIS PUSKESMAS & DINKES
            ==================================================================== */}
        {activeTab === 'medical' && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <Activity className="h-4 w-4 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Integrasi Sistem Tanggap Medis Darurat Terpadu:</strong>
                <p className="leading-relaxed text-[11px] text-blue-800">
                  Data koordinat GPS sekolah langsung terhubung dengan unit ambulans dan dokter jaga Puskesmas terdekat dalam radius &lt; 2 km untuk memastikan pertolongan pertama siaga jika terjadi indikasi keracunan pangan massal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthCenters.map((pusk) => (
                <div
                  key={pusk.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">
                        {pusk.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{pusk.address}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pusk.distanceKm}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Dokter Penanggung Jawab:</span>
                      <strong className="text-slate-900">{pusk.doctorInCharge}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Hotline Darurat:</span>
                      <strong className="text-blue-700 font-mono">{pusk.emergencyHotline}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Armada Ambulans:</span>
                      <strong className="text-emerald-700">Tersedia Siaga (24/7)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Tim Reaksi:</span>
                      <strong className="text-slate-800">{pusk.standbyTeam}</strong>
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <a
                      href={`tel:${pusk.emergencyHotline.replace(/\s/g, '')}`}
                      className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>Hubungi Tim Siaga Medis</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL 1: EMERGENCY BATCH KILL-SWITCH EXECUTION
          ==================================================================== */}
      {killSwitchModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-900">
                  EKSEKUSI EMERGENCY KILL-SWITCH
                </h3>
                <p className="text-xs text-rose-700 font-mono">
                  Batch ID: {killSwitchModalData.batchId}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-bold">
                PERINGATAN TINGKAT TINGGI SATGAS PANGAN:
              </p>
              <p className="leading-relaxed">
                Tindakan ini akan <strong>SEKETIKA MEMBEKUKAN DISTRIBUSI</strong> untuk seluruh sekolah yang menerima makanan dari batch ini. Notifikasi darurat akan langsung muncul di HP seluruh guru validator agar tidak membagikan makanan ke murid.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>Sekolah Pelapor: <strong>{killSwitchModalData.schoolName}</strong></p>
              <p>Dapur SPPG: <strong>{killSwitchModalData.sppgName}</strong></p>
              <p>Uraian: <strong>{killSwitchModalData.title}</strong></p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setKillSwitchModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteKillSwitch(killSwitchModalData)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="h-4 w-4" />
                <span>BEKUKAN DISTRIBUSI SEKARANG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL ESKALASI MEDIS PUSKESMAS & DINKES
          ==================================================================== */}
      {medicalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Eskalasi Medis Darurat Puskesmas
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">{medicalModalData.ticketNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setMedicalModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-500">Sekolah Sasaran:</span>
                  <strong className="text-slate-900">{medicalModalData.schoolName}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Puskesmas Siaga:</span>
                  <strong className="text-blue-700">{medicalModalData.medicalEscalation.healthCenter}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Dokter Penanggung Jawab:</span>
                  <strong className="text-slate-900">{medicalModalData.medicalEscalation.doctorInCharge || 'Dokter Jaga UGD'}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Kontak Dokter / Hotline:</span>
                  <strong className="text-emerald-700 font-mono">{medicalModalData.medicalEscalation.doctorPhone || '119'}</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                <strong>Protokol Siaga Medis KLB:</strong> Tim medis Puskesmas terdekat telah disiagakan dengan ambulans dan obat-obatan gastrointestinal untuk pencegahan dini keracunan makanan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMedicalModalData(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Notifikasi darurat berhasil dikirim ke ${medicalModalData.medicalEscalation.healthCenter}! Tim medis meluncur ke lokasi.`)
                  setMedicalModalData(null)
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Kirim Dispatch Medis Siaga</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: DETAIL TIKET & LOG INVESTIGASI
          ==================================================================== */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-blue-700 font-bold">
                  {selectedTicketDetail.ticketNumber}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {selectedTicketDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-500">Sekolah:</span>
                  <strong className="text-slate-900">{selectedTicketDetail.schoolName}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Pelapor:</span>
                  <strong className="text-slate-900">{selectedTicketDetail.reporter.name} ({selectedTicketDetail.reporter.phone})</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Dapur SPPG:</span>
                  <strong className="text-slate-900">{selectedTicketDetail.sppgName} (Batch: {selectedTicketDetail.batchId})</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Kegawatan:</span>
                  <strong className="text-rose-700">{selectedTicketDetail.severityLabel}</strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Kronologi Temuan Lapangan:</h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedTicketDetail.description}
                </p>
              </div>

              {selectedTicketDetail.medicalEscalation.escalated && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                  <strong className="block font-bold">Status Siaga Medis:</strong>
                  <p>{selectedTicketDetail.medicalEscalation.healthCenter} Ã¢â‚¬Â¢ {selectedTicketDetail.medicalEscalation.doctorInCharge}</p>
                  <p className="text-[11px] font-semibold text-blue-700">Status: {selectedTicketDetail.medicalEscalation.dispatchStatus}</p>
                </div>
              )}

              {selectedTicketDetail.investigationStatus && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 space-y-1">
                  <strong className="block font-bold">Audit &amp; Investigasi Lapangan:</strong>
                  <p>Inspektur: {selectedTicketDetail.investigationStatus.assignedInspector}</p>
                  <p className="text-[11px]">Fokus: {selectedTicketDetail.investigationStatus.focus}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTicketDetail(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: TUTUP TIKET ADUAN & KOMPENSASI
          ==================================================================== */}
      {closeTicketModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Tutup Tiket Aduan &amp; Berita Acara
                  </h3>
                  <p className="text-[11px] text-slate-500">{closeTicketModalData.ticketNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setCloseTicketModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCloseTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hasil Uji Laboratorium (Labkesda)</label>
                <input
                  type="text"
                  required
                  value={closeForm.labResult}
                  onChange={(e) => setCloseForm({ ...closeForm, labResult: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kompensasi Siswa</label>
                <input
                  type="text"
                  required
                  value={closeForm.compensationStatus}
                  onChange={(e) => setCloseForm({ ...closeForm, compensationStatus: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Penyelesaian Kasus</label>
                <textarea
                  rows={2}
                  required
                  value={closeForm.resolutionNotes}
                  onChange={(e) => setCloseForm({ ...closeForm, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseTicketModalData(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Tutup Tiket Secara Sah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: BUAT TIKET ADUAN BARU
          ==================================================================== */}
      {createTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Buat Tiket Aduan Cepat
                  </h3>
                  <p className="text-[11px] text-slate-500">Pusat Komando Tanggap Insiden MBG</p>
                </div>
              </div>
              <button
                onClick={() => setCreateTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    required
                    value={newTicketForm.schoolName}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, schoolName: e.target.value })}
                    placeholder="Contoh: SDN Sukajadi 01 Bandung"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPSN</label>
                  <input
                    type="text"
                    value={newTicketForm.npsn}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, npsn: e.target.value })}
                    placeholder="20219401"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tingkat Kegawatan</label>
                  <select
                    value={newTicketForm.severity}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, severity: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold"
                  >
                    <option value="level1">Level 1 (Kritis - Bahaya Keracunan)</option>
                    <option value="level2">Level 2 (Sedang - Kualitas/Porsi)</option>
                    <option value="level3">Level 3 (Rendah - Saran Menu/Rasa)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Perkiraan Porsi Terdampak</label>
                  <input
                    type="number"
                    value={newTicketForm.affectedPortions}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, affectedPortions: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Ringkas Keluhan</label>
                <input
                  type="text"
                  required
                  value={newTicketForm.title}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  placeholder="Contoh: Sayur berbau masam dan boks kurang hangat"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Uraian Detail Temuan</label>
                <textarea
                  rows={2}
                  required
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  placeholder="Jelaskan kondisi porsi saat dibuka, bau, tekstur, atau keluhan siswa..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Guru Pelapor</label>
                  <input
                    type="text"
                    value={newTicketForm.reporterName}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, reporterName: e.target.value })}
                    placeholder="Nama guru/validator"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Kontak WhatsApp</label>
                  <input
                    type="text"
                    value={newTicketForm.reporterPhone}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, reporterPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateTicketModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Daftarkan Tiket Aduan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
