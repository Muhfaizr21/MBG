import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Download,
  Printer,
  AlertTriangle,
  X,
  Building2,
  ChevronDown,
  Thermometer,
  QrCode,
  Scan,
  FlaskConical,
  Eye,
  FileText,
  BadgeCheck
} from 'lucide-react'
import { DeliveriesCharts } from './DeliveriesCharts'
import { Bar, Key, KpiCard, RowAction, StatusDot } from './tableKit'

/**
 * ==============================================================================
 * BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
 * KONSOL HASIL PENGIRIMAN & TELEMETRI YOLOV8 MBG (SUPERADMIN)
 * Standar: Enterprise 10-Year UI/UX Ã¢â‚¬Â¢ Zero-Glitch Ã¢â‚¬Â¢ Clean Code
 * Dasar Regulasi: Bab 3.3.2 & Bab 4.2 Poin 8 Sistem Pengawasan MBG
 * ==============================================================================
 */

export function DeliveriesPanel({
  deliveries: initialDeliveries,
  onSuperadminAction,
  showToast
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries || [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'verified' | 'flagged' | 'overridden' | 'lab_pending' | 'thermal_warn'
  const [cityFilter, setCityFilter] = useState('all')
  const [density, setDensity] = useState('normal') // 'normal' | 'compact'

  // Drawer & Modals State
  const [inspectModalData, setInspectModalData] = useState(null) // { delivery, activeTab: 'yolo' | 'crypto' | 'nutrition' }
  const [overrideModalData, setOverrideModalData] = useState(null) // { delivery, reason, auditorName }
  const [labModalData, setLabModalData] = useState(null) // { delivery, labTarget, dinkesOffice, notes }
  const [proofModalData, setProofModalData] = useState(null) // { delivery }
  const [openMenuId, setOpenMenuId] = useState(null)

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

  // Close modals on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInspectModalData(null)
        setOverrideModalData(null)
        setLabModalData(null)
        setProofModalData(null)
        setOpenMenuId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Distinct cities for filter dropdown
  const cities = useMemo(() => {
    const set = new Set(deliveries.map((d) => d.city).filter(Boolean))
    return Array.from(set)
  }, [deliveries])

  // Advanced Filtering
  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        d.id.toLowerCase().includes(q) ||
        d.batchId.toLowerCase().includes(q) ||
        d.school.toLowerCase().includes(q) ||
        d.sppg.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.qrToken.code.toLowerCase().includes(q) ||
        d.menu.name.toLowerCase().includes(q) ||
        d.validator.name.toLowerCase().includes(q)

      let matchStatus = true
      if (statusFilter === 'verified') matchStatus = d.yolo.status === 'verified'
      else if (statusFilter === 'flagged') matchStatus = d.yolo.status === 'flagged'
      else if (statusFilter === 'overridden') matchStatus = d.yolo.status === 'overridden'
      else if (statusFilter === 'lab_pending') matchStatus = d.yolo.status === 'lab_pending'
      else if (statusFilter === 'thermal_warn') matchStatus = d.thermal.status !== 'safe'

      const matchCity = cityFilter === 'all' || d.city === cityFilter

      return matchSearch && matchStatus && matchCity
    })
  }, [search, statusFilter, cityFilter, deliveries])

  // Executive KPI Calculations
  const stats = useMemo(() => {
    const total = deliveries.length
    const verified = deliveries.filter((d) => d.yolo.status === 'verified' || d.yolo.status === 'overridden').length
    const flagged = deliveries.filter((d) => d.yolo.status === 'flagged').length
    const labPending = deliveries.filter((d) => d.yolo.status === 'lab_pending').length
    const totalPortions = deliveries.reduce((acc, d) => acc + (d.portions || 0), 0)
    const duplicateAttempts = deliveries.filter((d) => d.qrToken.status === 'duplicate_attempt').length
    const thermalIssues = deliveries.filter((d) => d.thermal.status !== 'safe').length

    const avgFreshness =
      total > 0
        ? (deliveries.reduce((acc, d) => acc + (d.yolo.freshnessIndex || 0), 0) / total).toFixed(1)
        : '0.0'

    const avgTemp =
      total > 0
        ? (deliveries.reduce((acc, d) => acc + (d.thermal.temp || 0), 0) / total).toFixed(1)
        : '0.0'

    return {
      total,
      verified,
      flagged,
      labPending,
      totalPortions,
      duplicateAttempts,
      thermalIssues,
      avgFreshness,
      avgTemp
    }
  }, [deliveries])

  // Export CSV Handler
  const exportCsv = () => {
    const headers = [
      'delivery_id',
      'batch_id',
      'sekolah',
      'npsn',
      'dapur_sppg',
      'kota',
      'waktu_scan',
      'porsi',
      'suhu_termal_c',
      'status_suhu',
      'token_qr',
      'status_qr',
      'yolo_status',
      'freshness_score',
      'yolo_confidence',
      'sha256_hash',
      'validator_nama',
      'validator_satgas_id'
    ]

    const rows = filtered.map((d) => [
      d.id,
      d.batchId,
      d.school,
      d.npsn,
      d.sppg,
      d.city,
      d.scannedAt,
      d.portions,
      d.thermal.temp,
      d.thermal.status,
      d.qrToken.code,
      d.qrToken.status,
      d.yolo.status,
      d.yolo.freshnessIndex,
      d.yolo.confidenceScore,
      d.cryptoProof.sha256,
      d.validator.name,
      d.validator.satgasId
    ])

    const escape = (cell) => {
      const s = cell == null ? '' : String(cell)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csvContent = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kawangizi_hasil_pengiriman_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast?.(`[EKSPOR BERHASIL] ${filtered.length} rekam telemetri pengiriman berhasil diunduh.`)
  }

  // 1. ACTION: Override Hasil AI (Penetapan Manual)
  const handleOpenOverrideModal = (delivery) => {
    setOpenMenuId(null)
    setOverrideModalData({
      delivery,
      auditorName: 'Dr. Hendra Prasetyo (Satgas MBG Pusat)',
      reason: 'Pemeriksaan fisik organoleptik validator lapangan menyatakan hidangan segar dan layak konsumsi. Anomali AI terjadi akibat refleksi pencahayaan lampu kamera.'
    })
  }

  const executeOverrideAi = () => {
    if (onSuperadminAction?.('override_ai')?.allowed === false) return
    if (!overrideModalData) return
    const { delivery, auditorName, reason } = overrideModalData

    setDeliveries((prev) =>
      prev.map((item) => {
        if (item.id === delivery.id) {
          return {
            ...item,
            yolo: {
              ...item.yolo,
              status: 'overridden',
              freshnessIndex: 98.0,
              aiNotes: `OVERRIDE RESMI OLEH SUPERADMIN: ${reason}`
            },
            overrideRecord: {
              overriddenBy: auditorName,
              timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
              reason,
              signatureHash: `SIG-OVR-${Math.floor(Math.random() * 9000 + 1000)}-MBG`
            }
          }
        }
        return item
      })
    )

    showToast?.(`[OVERRIDE SAH] Hasil deteksi AI untuk ${delivery.school} berhasil disahkan layak konsumsi secara manual.`)
    setOverrideModalData(null)
  }

  // 2. ACTION: Perintah Uji Petik Laboratorium (Dinkes)
  const handleOpenLabModal = (delivery) => {
    setOpenMenuId(null)
    setLabModalData({
      delivery,
      dinkesOffice: `Dinas Kesehatan ${delivery.city}`,
      labFacility: `Balai Labkesmas Regional - ${delivery.province}`,
      samplingTarget: '3 Sampel Boks Acak (Uji Mikrobiologi Rutin)',
      pathogens: ['Escherichia coli', 'Salmonella sp.', 'Staphylococcus aureus'],
      notes: 'Pemeriksaan mikrobiologi darurat untuk mendeteksi potensi pembusukan dini dan cemaran bakteri patogen.'
    })
  }

  const executeOrderLabTest = () => {
    if (onSuperadminAction?.('order_lab_test')?.allowed === false) return
    if (!labModalData) return
    const { delivery, dinkesOffice, labFacility, samplingTarget, pathogens, notes } = labModalData
    const orderId = `LAB-${delivery.city.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`

    setDeliveries((prev) =>
      prev.map((item) => {
        if (item.id === delivery.id) {
          return {
            ...item,
            yolo: {
              ...item.yolo,
              status: 'lab_pending'
            },
            labAudit: {
              orderId,
              dinkesOffice,
              labFacility,
              samplingTarget,
              pathogens,
              status: 'sampel_diambil',
              orderTimestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
              notes
            }
          }
        }
        return item
      })
    )

    showToast?.(`[UJI PETIK LAB DIKIRIM] Perintah uji kultur mikroba ${orderId} telah diteruskan ke ${dinkesOffice}.`)
    setLabModalData(null)
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT TOP UTILITY & LIVE TELEMETRY BAR (NO HEAVY CARD)
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Log Inspeksi Kamera AI (YOLOv8) &amp; Telemetri Suhu Pengiriman
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor Data (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:shadow-xs focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Printer className="h-3.5 w-3.5 text-slate-300" />
            <span>Cetak Log</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. EXECUTIVE KPI COMMAND RIBBON (4 METRIC CARDS)
          ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Porsi terkirim hari ini"
          value={stats.totalPortions.toLocaleString('id-ID')}
          unit="porsi"
          hint={`${stats.total} pengiriman`}
        >
          <Bar
            className="mt-3"
            segments={[
              { value: stats.total ? (stats.verified / stats.total) * 100 : 0, color: 'bg-emerald-600', title: `${stats.verified} lolos verifikasi` },
              { value: stats.total ? (stats.flagged / stats.total) * 100 : 0, color: 'bg-rose-600', title: `${stats.flagged} tertahan` },
            ]}
          />
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <Key tone="ok">{stats.verified} lolos AI</Key>
            <Key tone="critical">{stats.flagged} anomali</Key>
            <Key tone="warn">{stats.labPending} uji lab</Key>
          </div>
        </KpiCard>

        <KpiCard
          label="Kelayakan deteksi YOLOv8"
          value={`${stats.total ? Math.round((stats.verified / stats.total) * 100) : 0}%`}
          tone={stats.flagged > 0 ? 'warn' : 'ok'}
          hint={`${stats.flagged} kiriman tertahan anomali`}
        >
          <Bar
            className="mt-3"
            segments={[
              { value: stats.total ? (stats.verified / stats.total) * 100 : 0, color: 'bg-emerald-600', title: 'lolos' },
              { value: stats.total ? (stats.flagged / stats.total) * 100 : 0, color: 'bg-rose-600', title: 'tertahan' },
            ]}
          />
          <p className="mt-2 text-[11px] text-slate-500">
            {stats.duplicateAttempts > 0
              ? `${stats.duplicateAttempts} percobaan pindai duplikat`
              : 'Tidak ada pindai duplikat'}
          </p>
        </KpiCard>

        <KpiCard
          label="Indeks kesegaran rata-rata"
          value={stats.avgFreshness}
          unit="/ 100"
          tone={Number(stats.avgFreshness) >= 90 ? 'ok' : 'warn'}
          hint="Indeks freshness tiap porsi"
        >
          <Bar
            className="mt-3"
            segments={[{ value: Number(stats.avgFreshness), color: 'bg-blue-600', title: 'indeks kesegaran' }]}
          />
        </KpiCard>

        <KpiCard
          label="Suhu rantai dingin"
          value={stats.avgTemp}
          unit="&deg;C rata-rata"
          tone={stats.thermalIssues > 0 ? 'critical' : 'ok'}
          hint={
            stats.thermalIssues > 0
              ? `${stats.thermalIssues} kiriman di luar rentang aman`
              : 'Semua kiriman dalam rentang aman'
          }
        />
      </div>

      {/* ====================================================================
          3. INTEGRATED ANALYTICAL CHARTS (RECHARTS TELEMETRY)
          ==================================================================== */}
      <DeliveriesCharts deliveries={deliveries} />

      {/* ====================================================================
          4. FILTER CONTROLS & SEARCH TOOLBAR
          ==================================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID pengiriman, boks, token QR, sekolah, SPPG, menu, atau kota..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-600 p-0.5"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Lolos AI ({stats.verified})
            </button>
            <button
              onClick={() => setStatusFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'flagged'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Anomali ({stats.flagged})
            </button>
            <button
              onClick={() => setStatusFilter('overridden')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'overridden'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Override Ahli Gizi ({deliveries.filter((d) => d.yolo.status === 'overridden').length})
            </button>
            <button
              onClick={() => setStatusFilter('lab_pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'lab_pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Uji Petik Dinkes ({stats.labPending})
            </button>
          </div>

          {/* Secondary Dropdown Selectors */}
          <div className="flex items-center gap-2 shrink-0">
            {/* City Selector */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Kota ({cities.length})</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* View Density Toggle */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setDensity('normal')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  density === 'normal' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                  density === 'compact' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Rapat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. ENTERPRISE DELIVERIES DATA TABLE
          ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px] table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-2.5 w-[26%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Porsi &amp; Token QR</th>
                <th className="px-4 py-2.5 w-[22%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Sekolah &amp; SPPG Asal</th>
                <th className="px-4 py-2.5 w-[21%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Inspeksi YOLOv8 &amp; Nutrisi</th>
                <th className="px-4 py-2.5 w-[14%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Telemetri Suhu</th>
                <th className="px-4 py-2.5 text-left w-[11%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status</th>
                <th className="px-5 py-2.5 text-right w-[6%] text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">Tidak ada data pengiriman yang sesuai dengan kriteria filter.</p>
                    <button
                      onClick={() => {
                        setSearch('')
                        setStatusFilter('all')
                        setCityFilter('all')
                      }}
                      className="mt-2 text-xs font-semibold text-blue-800 hover:underline cursor-pointer"
                    >
                      Reset Semua Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((delivery) => {
                  const isFlagged = delivery.yolo.status === 'flagged'
                  const isOverridden = delivery.yolo.status === 'overridden'
                  const isLabPending = delivery.yolo.status === 'lab_pending'
                  const paddingY = density === 'compact' ? 'py-3' : 'py-3.5'

                  return (
                    <tr
                      key={delivery.id}
                      onClick={() => setInspectModalData({ delivery, activeTab: 'yolo' })}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors group border-l-2 ${
                        isFlagged
                          ? 'border-l-rose-500 bg-rose-50/20'
                          : isLabPending
                          ? 'border-l-amber-500 bg-amber-50/15'
                          : isOverridden
                          ? 'border-l-blue-500 bg-blue-50/10'
                          : 'border-l-transparent'
                      }`}
                    >
                      {/* Col 1: Porsi, Token QR & Thumbnail */}
                      <td className={`px-5 ${paddingY}`}>
                        <div className="flex items-center gap-3">
                          {/* Mini QR Icon Badge */}
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isFlagged
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : isOverridden
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <QrCode className="h-4.5 w-4.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-xs truncate">
                                {delivery.qrToken.code}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded-sm">
                                {delivery.batchId}
                              </span>
                            </div>

                            <p className="text-[11px] font-medium text-slate-700 truncate mt-0.5">
                              {delivery.menu.name}
                            </p>

                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Pindai: <span className="text-slate-600">{delivery.scannedAt}</span>
                              <span className="mx-1 text-slate-300">Ã‚Â·</span>
                              <span>{delivery.portions} Porsi</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Sekolah & SPPG Asal */}
                      <td className={`px-4 ${paddingY}`}>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {delivery.school}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>{delivery.sppg}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {delivery.city} &bull; Validator:{' '}
                            <span className="text-slate-600 font-medium">
                              {delivery.validator.name.split(',')[0]}
                            </span>
                          </p>
                        </div>
                      </td>

                      {/* Col 3: Inspeksi YOLOv8 & Nutrisi */}
                      <td className={`px-4 ${paddingY}`}>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isFlagged
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isOverridden
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isFlagged
                                ? 'ANOMALI'
                                : isOverridden
                                ? 'OVERRIDE'
                                : `${delivery.yolo.freshnessIndex}% SEGAR`}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Conf: {delivery.yolo.confidenceScore}%
                            </span>
                          </div>

                          {/* Detected Bounding Box tags preview */}
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 flex-wrap">
                            <span className="text-slate-600 font-medium">
                              {delivery.yolo.macronutrients.calories} kkal
                            </span>
                            <span className="text-slate-300">Ã‚Â·</span>
                            <span className="text-slate-600">
                              P: {delivery.yolo.macronutrients.proteinG}g
                            </span>
                            <span className="text-slate-300">Ã‚Â·</span>
                            <span className="text-slate-600">
                              K: {delivery.yolo.macronutrients.carbsG}g
                            </span>
                          </div>

                          {delivery.yolo.anomaly && (
                            <p className="text-[10px] text-rose-800 font-semibold truncate flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{delivery.yolo.anomaly.type}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Col 4: Telemetri Suhu Saat Tiba */}
                      <td className={`px-4 ${paddingY}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Thermometer
                              className={`h-3.5 w-3.5 shrink-0 ${
                                delivery.thermal.status === 'safe'
                                  ? 'text-emerald-800'
                                  : delivery.thermal.status === 'warning'
                                  ? 'text-amber-500'
                                  : 'text-rose-800'
                              }`}
                            />
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {delivery.thermal.temp}Ã‚Â°C
                            </span>
                            <span
                              className={`text-[11px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                delivery.thermal.status === 'safe'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : delivery.thermal.status === 'warning'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {delivery.thermal.status === 'safe'
                                ? 'Aman'
                                : delivery.thermal.status === 'warning'
                                ? 'Hangat'
                                : 'Bahaya'}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 font-mono">
                            Target: {delivery.thermal.targetRange}
                          </p>
                        </div>
                      </td>

                      {/* Col 5: Status. Titik + label, bukan pil. */}
                      <td className={`px-4 ${paddingY}`}>
                        {isFlagged ? (
                          <StatusDot tone="critical">Tertahan</StatusDot>
                        ) : isOverridden ? (
                          <StatusDot tone="info">Disahkan</StatusDot>
                        ) : isLabPending ? (
                          <StatusDot tone="warn">Uji lab</StatusDot>
                        ) : (
                          <StatusDot tone="ok">Lolos AI</StatusDot>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {delivery.qrToken.status === 'duplicate_attempt' ? 'QR duplikat' : 'QR valid'}
                        </p>
                      </td>

                      {/* Col 6: Aksi Superadmin Buttons */}
                      <td className={`px-5 ${paddingY} text-right`}>
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <RowAction onClick={() => setInspectModalData({ delivery, activeTab: 'yolo' })}>Detail</RowAction>

                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === delivery.id ? null : delivery.id)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs transition cursor-pointer hover:border-slate-300"
                              aria-label="Menu Aksi Superadmin"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>

                            {/* Dropdown Actions */}
                            {openMenuId === delivery.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in"
                              >
                                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                                  OTORITAS SUPERADMIN
                                </div>

                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    setInspectModalData({ delivery, activeTab: 'yolo' })
                                  }}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-blue-800" />
                                  <span>Inspeksi YOLOv8 &amp; Bounding Box</span>
                                </button>

                                <button
                                  onClick={() => handleOpenOverrideModal(delivery)}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-blue-700 hover:bg-blue-50 font-medium transition cursor-pointer"
                                >
                                  <BadgeCheck className="h-3.5 w-3.5 text-blue-800" />
                                  <span>Override Hasil AI (Manual)</span>
                                </button>

                                <button
                                  onClick={() => handleOpenLabModal(delivery)}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-amber-700 hover:bg-amber-50 font-medium transition cursor-pointer"
                                >
                                  <FlaskConical className="h-3.5 w-3.5 text-amber-800" />
                                  <span>Perintah Uji Petik Lab</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    setProofModalData({ delivery })
                                  }}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                                >
                                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Unduh Bukti Verifikasi (BAST)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-slate-50/70 border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{stats.total}</strong> pengiriman terpantau</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-emerald-700 font-semibold">Tersinkronisasi dengan Database Satgas MBG</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[10px]">
            <span>TOTAL TERVERIFIKASI: <strong>{stats.totalPortions.toLocaleString()} PORSI</strong></span>
            <span>&bull;</span>
            <span>STANDAR BPKP &amp; KEMENKES RI</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: INSPEKSI SERTIFIKAT DIGITAL & BOUNDING BOX YOLOV8
          ==================================================================== */}
      {inspectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {inspectModalData.delivery.id}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Batch: {inspectModalData.delivery.batchId}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Inspeksi Sertifikat Digital &amp; Segmentasi YOLOv8
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectModalData.delivery.school} &bull; {inspectModalData.delivery.city} &bull; {inspectModalData.delivery.scannedAt}
                </p>
              </div>

              <button
                onClick={() => setInspectModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive YOLOv8 Bounding Box Canvas Simulation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Scan className="h-4 w-4 text-blue-800" />
                  Visualisasi Deteksi Objek Kamera Validator (YOLOv8x)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Latency: {inspectModalData.delivery.yolo.inferenceLatencyMs}ms &bull; Conf: {inspectModalData.delivery.yolo.confidenceScore}%
                </span>
              </div>

              {/* Bounding Box Visual Container */}
              <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {/* Simulated Tray Graphic */}
                <div className="absolute inset-4 rounded-lg border-2 border-dashed border-slate-700/60 bg-slate-800/40 flex flex-col justify-between p-3 pointer-events-none">
                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>FRAME: TRAY-INSPECTION-STD</span>
                    <span>1080x1080 RGB</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>TIMESTAMP: {inspectModalData.delivery.scannedAt}</span>
                    <span>SIMULASI DETEKSI</span>
                  </div>
                </div>

                {/* Simulated Bounding Boxes */}
                {inspectModalData.delivery.yolo.detectedObjects.map((obj, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${obj.box.x}%`,
                      top: `${obj.box.y}%`,
                      width: `${obj.box.w}%`,
                      height: `${obj.box.h}%`,
                      borderColor: obj.color
                    }}
                    className="absolute border-2 rounded-sm bg-black/20 flex flex-col justify-between p-1 transition-transform hover:scale-105"
                  >
                    <span
                      style={{ backgroundColor: obj.color }}
                      className="text-[11px] font-mono font-bold text-white px-1.5 py-0.5 rounded shadow-xs self-start"
                    >
                      {obj.label} ({Math.round(obj.confidence * 100)}%)
                    </span>
                  </div>
                ))}

                {inspectModalData.delivery.yolo.anomaly && (
                  <div className="absolute bottom-4 left-4 right-4 bg-rose-950/90 border border-rose-500/80 p-2.5 rounded-lg text-rose-200 text-xs flex items-center gap-2 shadow-lg">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold text-rose-300">
                        {inspectModalData.delivery.yolo.anomaly.type} ({inspectModalData.delivery.yolo.anomaly.confidence}%)
                      </p>
                      <p className="text-[11px] text-rose-200/90 leading-tight">
                        {inspectModalData.delivery.yolo.anomaly.riskDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nutritional & Cryptographic Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Makronutrien TKPI */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Komposisi Gizi (TKPI Kemenkes)</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Score: {inspectModalData.delivery.yolo.macronutrients.tkpiScore}/100
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Total Energi:</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {inspectModalData.delivery.yolo.macronutrients.calories} kkal
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Protein:</span>
                    <p className="font-mono font-bold text-emerald-700 text-sm">
                      {inspectModalData.delivery.yolo.macronutrients.proteinG} gram
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Karbohidrat:</span>
                    <p className="font-mono font-bold text-blue-700 text-sm">
                      {inspectModalData.delivery.yolo.macronutrients.carbsG} gram
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">Serat Pangan:</span>
                    <p className="font-mono font-bold text-blue-700 text-sm">
                      {inspectModalData.delivery.yolo.macronutrients.fiberG} gram
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Token QR & status anti-duplikasi.
                  R-38: nilai di bawah ini data simulasi, bukan hash kriptografis nyata. */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Token Porsi</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    Data simulasi
                  </span>
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500">Token QR:</span>
                    <p className="font-mono text-[10px] text-slate-800 break-all bg-white p-1.5 rounded border border-slate-200 mt-0.5 select-all">
                      {inspectModalData.delivery.cryptoProof.sha256}
                    </p>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>ID Pengembangan:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {inspectModalData.delivery.cryptoProof.signedBy}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Status anti-duplikasi:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {inspectModalData.delivery.qrToken.status === 'duplicate_attempt'
                        ? 'Duplikat terdeteksi'
                        : 'Sekali pindai'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: OVERRIDE HASIL AI (PENETAPAN MANUAL SUPERADMIN)
          ==================================================================== */}
      {overrideModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold font-mono">
                  <BadgeCheck className="h-4 w-4" />
                  <span>OVERRIDE OTORITAS RESMI SUPERADMIN</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Pengesahan Kelayakan Porsi Secara Manual
                </h3>
                <p className="text-xs text-slate-500">
                  {overrideModalData.delivery.school} &bull; {overrideModalData.delivery.menu.name}
                </p>
              </div>
              <button
                onClick={() => setOverrideModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info notice */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1 leading-relaxed">
              <p className="font-semibold text-blue-800">Dasar Kewenangan:</p>
              <p>
                Sesuai Bab 4.2 Poin 8 Sistem Pengawasan MBG, Superadmin bersama Auditor Gizi memiliki wewenang membatalkan deteksi anomali palsu (*false positive*) dari model YOLOv8 berdasarkan verifikasi fisik organoleptik validator lapangan.
              </p>
            </div>

            {/* Input fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pejabat / Auditor Pengesah:
                </label>
                <input
                  type="text"
                  value={overrideModalData.auditorName}
                  onChange={(e) =>
                    setOverrideModalData({ ...overrideModalData, auditorName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Audit Resmi (Alasan Override):
                </label>
                <textarea
                  rows={3}
                  value={overrideModalData.reason}
                  onChange={(e) =>
                    setOverrideModalData({ ...overrideModalData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan hasil inspeksi fisik makanan..."
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setOverrideModalData(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeOverrideAi}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <BadgeCheck className="h-4 w-4" />
                <span>Sahkan Kelayakan Porsi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: PERINTAH UJI PETIK LABORATORIUM (DINKES SETEMPAT)
          ==================================================================== */}
      {labModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold font-mono">
                  <FlaskConical className="h-4 w-4" />
                  <span>INSTRUKSI SURVEILANS MIKROBIOLOGI DINKES</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Perintah Uji Petik Laboratorium Pangan
                </h3>
                <p className="text-xs text-slate-500">
                  {labModalData.delivery.school} &bull; {labModalData.delivery.sppg}
                </p>
              </div>
              <button
                onClick={() => setLabModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lab details */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instansi Dinas Kesehatan Penerima Perintah:
                </label>
                <input
                  type="text"
                  value={labModalData.dinkesOffice}
                  onChange={(e) =>
                    setLabModalData({ ...labModalData, dinkesOffice: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fasilitas Uji Laboratorium Rujukan:
                </label>
                <input
                  type="text"
                  value={labModalData.labFacility}
                  onChange={(e) =>
                    setLabModalData({ ...labModalData, labFacility: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Pengujian Patogen Mikroba:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Escherichia coli (Batas Kemenkes: 0 CFU/g)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Salmonella sp. (Batas Kemenkes: Negatif/25g)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Total Plate Count (TPC) &amp; Angka Jamur</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setLabModalData(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeOrderLabTest}
                className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FlaskConical className="h-4 w-4" />
                <span>Terbitkan Instruksi Uji Petik</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: BUKTI VERIFIKASI RESMI (BERITA ACARA SERAH TERIMA - BAST)
          ==================================================================== */}
      {proofModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold font-mono">
                  <FileText className="h-4 w-4 text-blue-800" />
                  <span>BERKAS LEGALITAS RESMI MBG RI</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Berita Acara Serah Terima &amp; Verifikasi Telemetri (BAST)
                </h3>
                <p className="text-xs text-slate-500">
                  ID: {proofModalData.delivery.id} &bull; dokumen simulasi
                </p>
              </div>
              <button
                onClick={() => setProofModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BAST Printable Paper Preview */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 text-xs leading-relaxed">
              <div className="text-center pb-2 border-b border-slate-200">
                <p className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">
                  Badan Gizi Nasional Republik Indonesia
                </p>
                <p className="text-[10px] text-slate-500">
                  Bukti Digital Serah Terima Makanan Bergizi Gratis (Pasal 14 Juknis Operasional)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500">Titik Serah Terima:</span>
                  <p className="font-bold text-slate-900">{proofModalData.delivery.school}</p>
                  <p className="text-slate-500">{proofModalData.delivery.city}</p>
                </div>
                <div>
                  <span className="text-slate-500">Produsen Penyedia:</span>
                  <p className="font-bold text-slate-900">{proofModalData.delivery.sppg}</p>
                  <p className="text-slate-500">Kode: {proofModalData.delivery.sppgCode}</p>
                </div>
                <div>
                  <span className="text-slate-500">Waktu &amp; Durasi Pindai:</span>
                  <p className="font-mono font-semibold text-slate-900">
                    {proofModalData.delivery.scannedAt} ({proofModalData.delivery.scanDurationSec}s)
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Suhu Termal Saat Tiba:</span>
                  <p className="font-mono font-bold text-emerald-700">
                    {proofModalData.delivery.thermal.temp}Ã‚Â°C ({proofModalData.delivery.thermal.probeDevice})
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 font-mono text-[10px]">
                <p className="text-slate-500 uppercase">Cryptographic Integrity Hash:</p>
                <p className="text-slate-800 break-all">{proofModalData.delivery.cryptoProof.sha256}</p>
              </div>

              <div className="flex justify-between items-end pt-2 text-[10px] text-slate-500 border-t border-slate-200">
                <div>
                  <p>Petugas Validator:</p>
                  <p className="font-bold text-slate-800 mt-1">{proofModalData.delivery.validator.name}</p>
                  <p className="font-mono">{proofModalData.delivery.validator.satgasId}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600 font-semibold">Simulasi skrining</p>
                  <p className="font-mono text-slate-500">Data prototipe</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setProofModalData(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print()
                  showToast?.(`[UNDUH BERHASIL] Berkas BAST porsi ${proofModalData.delivery.id} siap dicetak.`)
                }}
                className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4 text-slate-300" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default DeliveriesPanel
