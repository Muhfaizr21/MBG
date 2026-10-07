import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Utensils,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Printer,
  MoreVertical,
  Eye,
  RefreshCw,
  Ban,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  Award
} from 'lucide-react'
import { CalendarCharts } from './CalendarCharts'
import {
  MENU_PACKAGES,
  INITIAL_CALENDAR_DAYS,
  INITIAL_SUBSTITUTIONS,
  DAY_TYPE_OPTIONS,
  MENU_STATUS_OPTIONS
} from '../../data/calendarData'
import { fetchCalendarDays, fetchMenuPackages } from '../../lib/api'

export function CalendarPanel({
  onSuperadminAction = () => {},
  showToast = () => {}
}) {
  // Main Data States
  const [calendarDays, setCalendarDays] = useState(INITIAL_CALENDAR_DAYS)
  const [substitutions, setSubstitutions] = useState(INITIAL_SUBSTITUTIONS)
  const [menuPackages, setMenuPackages] = useState(MENU_PACKAGES)

  useEffect(() => {
    let isMounted = true
    Promise.all([fetchCalendarDays(), fetchMenuPackages()])
      .then(([days, packages]) => {
        if (!isMounted) return
        if (Array.isArray(packages) && packages.length > 0) {
          const mappedPackages = packages.map(p => ({
            ...p,
            id: p.id,
            cycleCode: p.cycleCode,
            name: p.name,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
            calcium: p.calcium,
            iron: p.iron,
            zinc: p.zinc,
            costPerServing: p.costPerServing,
            allergens: p.allergens ? [p.allergens] : [],
            description: p.description,
          }))
          setMenuPackages(mappedPackages)
        }
        if (Array.isArray(days) && days.length > 0) {
          const mappedDays = days.map(d => ({
            ...d,
            date: d.date,
            packageId: d.packageId,
            dayName: d.dayName,
            status: d.status || 'approved',
            dayType: d.dayType || 'regular',
            theme: d.theme,
            targetPortions: d.targetPortions,
            locked: d.status === 'locked',
          }))
          setCalendarDays(mappedDays)
        }
      })
      .catch(err => console.warn('Calendar fallback:', err))

    return () => {
      isMounted = false
    }
  }, [])

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('grid') // 'grid' | 'table' | 'packages' | 'substitutions'
  const [search, setSearch] = useState('')
  const [dayTypeFilter, setDayTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [density, setDensity] = useState('normal') // 'normal' | 'compact'
  const [selectedMonth, setSelectedMonth] = useState('September 2026')

  // Modals & Drawers
  const [selectedDayDetail, setSelectedDayDetail] = useState(null)
  const [selectedPackageDetail, setSelectedPackageDetail] = useState(null)
  const [openMenuDate, setOpenMenuDate] = useState(null)

  // Superadmin Action Modals
  const [lockMonthModalOpen, setLockMonthModalOpen] = useState(false)
  const [substitutionModalData, setSubstitutionModalData] = useState(null) // { mode: 'create' | 'review', item?: ... }
  const [blackoutModalData, setBlackoutModalData] = useState(null) // { date, currentStatus }
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)

  // Forms
  const [substitutionForm, setSubstitutionForm] = useState({
    date: '2026-10-02',
    cycleCode: 'Paket E',
    region: 'Nasional (Seluruh Wilayah)',
    originalIngredient: '',
    substituteIngredient: '',
    reason: '',
    proteinCompare: 'Setara (28g)',
    calorieCompare: 'Setara (580 kkal)',
    costCompare: 'Sesuai Pagu (Rp 14.800)',
    nutritionistReview: 'dr. Dian Lestari, Sp.GK (BGN) - Layak & Memenuhi AKG',
    status: 'approved'
  })

  const [blackoutForm, setBlackoutForm] = useState({
    date: '',
    title: 'Libur Operasional Khusus',
    reason: 'Hari Libur Nasional / Cuti Bersama Resmi SKB 3 Menteri',
    lockOrders: true
  })

  const [inspectionForm, setInspectionForm] = useState({
    date: '2026-10-07',
    leadInspector: 'dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)',
    team: 'Satgas Khusus Kelaikan Pangan & Balai POM',
    targetSppgName: 'SPPG Sentral Sukajadi Bandung',
    sppgId: 'SPPG-BDG-01',
    auditTime: '04:30 - 07:00 WIB',
    auditFocus: 'Sterilisasi Wadah Boks, Suhu Termal Pengiriman & Gramatur Porsi'
  })

  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenMenuDate(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtered Calendar Days
  const filteredDays = useMemo(() => {
    return calendarDays.filter((d) => {
      const matchSearch =
        d.date.includes(search) ||
        d.dayName.toLowerCase().includes(search.toLowerCase()) ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.blackoutReason && d.blackoutReason.toLowerCase().includes(search.toLowerCase())) ||
        (d.inspectionDetail && d.inspectionDetail.targetSppgName.toLowerCase().includes(search.toLowerCase()))

      const matchType =
        dayTypeFilter === 'all'
          ? true
          : dayTypeFilter === 'inspection'
          ? d.hasInspection
          : d.dayType === dayTypeFilter

      const matchStatus = statusFilter === 'all' || d.menuStatus === statusFilter

      return matchSearch && matchType && matchStatus
    })
  }, [calendarDays, search, dayTypeFilter, statusFilter])

  // KPIs
  const kpiData = useMemo(() => {
    const activeSchoolDays = calendarDays.filter((d) => d.dayType === 'school_day' || d.dayType === 'exam_day').length
    const lockedDays = calendarDays.filter((d) => d.menuStatus === 'locked' || d.menuStatus === 'substitution_approved').length
    const blackoutDays = calendarDays.filter((d) => d.isOperationalBlackout).length
    const inspectionCount = calendarDays.filter((d) => d.hasInspection).length
    const pendingSubsCount = substitutions.filter((s) => s.status === 'pending').length

    return {
      activeSchoolDays,
      lockedDays,
      blackoutDays,
      inspectionCount,
      pendingSubsCount,
      lockRate: Math.round((lockedDays / (activeSchoolDays || 1)) * 100)
    }
  }, [calendarDays, substitutions])

  // Export CSV
  const exportCsv = () => {
    const headers = [
      'Tanggal',
      'Hari',
      'Tipe Hari',
      'Paket Menu',
      'Nama Menu',
      'Status Menu',
      'Blackout Operasional',
      'Target Porsi',
      'Dapur SPPG Aktif',
      'Ada Sidak Satgas',
      'Keterangan / Alasan'
    ]

    const rows = filteredDays.map((d) => {
      const pkg = menuPackages.find((p) => p.id === d.packageId)
      return [
        `"${d.date}"`,
        `"${d.dayName}"`,
        `"${d.dayTypeLabel}"`,
        `"${pkg ? pkg.cycleCode : '-'}"`,
        `"${pkg ? pkg.name : d.title}"`,
        `"${d.menuStatusLabel}"`,
        d.isOperationalBlackout ? 'Ya' : 'Tidak',
        d.targetPortions,
        d.activeKitchens,
        d.hasInspection ? 'Ya' : 'Tidak',
        `"${d.blackoutReason || (d.hasInspection ? d.inspectionDetail.targetSppgName : '-')}"`
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Kalender_Operasional_MBG_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Kalender operasional berhasil diekspor dalam format CSV!')
  }

  // Handle Lock Entire Month
  const handleLockEntireMonth = () => {
    if (onSuperadminAction?.('LOCK_MONTH_CYCLE')?.allowed === false) return
    setCalendarDays((prev) =>
      prev.map((d) => {
        if (d.dayType === 'school_day' || d.dayType === 'exam_day') {
          return {
            ...d,
            menuStatus: 'locked',
            menuStatusLabel: 'Menu Terkunci & Valid'
          }
        }
        return d
      })
    )
    setLockMonthModalOpen(false)
    showToast(`Seluruh siklus menu untuk periode ${selectedMonth} telah DIKUNCI secara nasional!`)
  }

  // Handle Toggle Single Day Lock
  const handleToggleDayLock = (targetDate) => {
    if (onSuperadminAction?.('TOGGLE_DAY_LOCK')?.allowed === false) return
    setCalendarDays((prev) =>
      prev.map((d) => {
        if (d.date === targetDate) {
          const isCurrentlyLocked = d.menuStatus === 'locked'
          const newStatus = isCurrentlyLocked ? 'draft' : 'locked'
          const newStatusLabel = isCurrentlyLocked ? 'Draft Penyusunan' : 'Menu Terkunci & Valid'
          return {
            ...d,
            menuStatus: newStatus,
            menuStatusLabel: newStatusLabel
          }
        }
        return d
      })
    )
    setOpenMenuDate(null)
    showToast(`Status penguncian menu tanggal ${targetDate} berhasil diperbarui!`)
  }

  // Handle Submit Operational Blackout (Set / Release)
  const handleSubmitBlackout = (e) => {
    if (onSuperadminAction?.('SET_BLACKOUT_DATE')?.allowed === false) return
    e.preventDefault()
    if (!blackoutModalData) return

    const { date, isSettingBlackout } = blackoutModalData

    setCalendarDays((prev) =>
      prev.map((d) => {
        if (d.date === date) {
          if (isSettingBlackout) {
            return {
              ...d,
              dayType: 'holiday',
              dayTypeLabel: 'Libur Nasional / Blackout',
              title: blackoutForm.title || 'Libur Operasional Khusus',
              menuStatus: 'blackout',
              menuStatusLabel: 'Libur Operasional Terkunci',
              isOperationalBlackout: true,
              blackoutReason: blackoutForm.reason || 'Libur Operasional Ditetapkan Superadmin MBG',
              targetPortions: 0,
              activeKitchens: 0
            }
          } else {
            return {
              ...d,
              dayType: 'school_day',
              dayTypeLabel: 'Hari Operasional Reguler',
              title: 'Siklus Menu Normal',
              menuStatus: 'locked',
              menuStatusLabel: 'Menu Terkunci & Valid',
              isOperationalBlackout: false,
              blackoutReason: null,
              targetPortions: 251000,
              activeKitchens: 180
            }
          }
        }
        return d
      })
    )

    setBlackoutModalData(null)
    const act = isSettingBlackout ? 'ditetapkan sebagai Libur Blackout (Pemesanan Dikunci)' : 'dibuka kembali untuk operasional katering'
    showToast(`Tanggal ${date} berhasil ${act}!`)
  }

  // Handle Substitution Approval / Creation
  const handleSubmitSubstitution = (e) => {
    if (onSuperadminAction?.('CREATE_SUBSTITUTION')?.allowed === false) return
    if (onSuperadminAction?.('REVIEW_SUBSTITUTION')?.allowed === false) return
    e.preventDefault()
    if (!substitutionModalData) return

    if (substitutionModalData.mode === 'create') {
      const newSub = {
        id: `SUB-2026-${Date.now().toString().slice(-3)}`,
        date: substitutionForm.date,
        cycleCode: substitutionForm.cycleCode,
        region: substitutionForm.region,
        originalIngredient: substitutionForm.originalIngredient || 'Daging Ayam Broiler Segar (85g)',
        substituteIngredient: substitutionForm.substituteIngredient || 'Ikan Kembung Segar Banjar (90g)',
        reason: substitutionForm.reason || 'Kenaikan harga atau kelangkaan bahan baku lokal regional.',
        nutritionComparison: {
          proteinOriginal: '28.5g',
          proteinSubstitute: substitutionForm.proteinCompare,
          caloriesOriginal: '580 kkal',
          caloriesSubstitute: substitutionForm.calorieCompare,
          costOriginal: 'Rp 14.850',
          costSubstitute: substitutionForm.costCompare
        },
        nutritionistReview: substitutionForm.nutritionistReview,
        status: 'approved',
        statusLabel: 'Disetujui Superadmin BGN',
        approvedAt: `${new Date().toISOString().slice(0, 10)} 10:00 WIB`,
        approvedBy: 'Bambang Soediro (Superadmin Satgas MBG)'
      }

      setSubstitutions([newSub, ...substitutions])

      // Update calendar day status
      setCalendarDays((prev) =>
        prev.map((d) => {
          if (d.date === substitutionForm.date) {
            return {
              ...d,
              menuStatus: 'substitution_approved',
              menuStatusLabel: 'Substitusi Disetujui BGN',
              hasSubstitution: true,
              substitutionId: newSub.id
            }
          }
          return d
        })
      )

      showToast(`Penggantian menu darurat untuk ${newSub.date} (${newSub.cycleCode}) berhasil disetujui & dipublikasikan!`)
    } else if (substitutionModalData.mode === 'review') {
      const subItem = substitutionModalData.item
      const isApproved = substitutionModalData.action === 'approve'

      setSubstitutions((prev) =>
        prev.map((s) => {
          if (s.id === subItem.id) {
            return {
              ...s,
              status: isApproved ? 'approved' : 'rejected',
              statusLabel: isApproved ? 'Disetujui Superadmin BGN' : 'Ditolak (Tetap Menu Asli)',
              approvedAt: `${new Date().toISOString().slice(0, 10)} 10:00 WIB`,
              approvedBy: 'Bambang Soediro (Superadmin Satgas MBG)'
            }
          }
          return s
        })
      )

      // Update day status
      setCalendarDays((prev) =>
        prev.map((d) => {
          if (d.date === subItem.date) {
            return {
              ...d,
              menuStatus: isApproved ? 'substitution_approved' : 'locked',
              menuStatusLabel: isApproved ? 'Substitusi Disetujui BGN' : 'Menu Terkunci (Substitusi Ditolak)'
            }
          }
          return d
        })
      )

      showToast(`Pengajuan substitusi ${subItem.id} berhasil ${isApproved ? 'DISETUJUI' : 'DITOLAK'}!`)
    }

    setSubstitutionModalData(null)
  }

  // Handle Schedule Inspection (Sidak)
  const handleScheduleInspection = (e) => {
    if (onSuperadminAction?.('SCHEDULE_INSPECTION')?.allowed === false) return
    e.preventDefault()
    if (!inspectionForm.targetSppgName || !inspectionForm.date) {
      showToast('Mohon lengkapi dapur target dan tanggal sidak!')
      return
    }

    const newInspection = {
      id: `SDK-2026-${Date.now().toString().slice(-3)}`,
      leadInspector: inspectionForm.leadInspector,
      team: inspectionForm.team,
      targetSppgName: inspectionForm.targetSppgName,
      sppgId: inspectionForm.sppgId,
      auditTime: inspectionForm.auditTime,
      auditFocus: inspectionForm.auditFocus,
      result: 'Terjadwal Rahasia (Siap Inspeksi)'
    }

    setCalendarDays((prev) =>
      prev.map((d) => {
        if (d.date === inspectionForm.date) {
          return {
            ...d,
            hasInspection: true,
            inspectionDetail: newInspection
          }
        }
        return d
      })
    )

    setInspectionModalOpen(false)
    showToast(`Jadwal sidak mendadak ke ${inspectionForm.targetSppgName} berhasil didaftarkan secara rahasia!`)
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          1. COMPACT TOP UTILITY & ACTION BAR (NO BLOATED CARDS, NO COUNTDOWN)
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Pusat Pengaturan Siklus Menu Nasional &amp; Sinkronisasi Kalender Pendidikan BGN
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCsv}
            disabled={filteredDays.length === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Ekspor Kalender (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak Rekap</span>
          </button>

          <button
            onClick={() => setLockMonthModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span>Kunci Siklus Menu 1 Bulan</span>
          </button>

          <button
            onClick={() => {
              setSubstitutionForm({
                date: '2026-10-02',
                cycleCode: 'Paket E',
                region: 'Nasional (Seluruh Wilayah)',
                originalIngredient: 'Daging Ayam Broiler Karkas (85g)',
                substituteIngredient: 'Ikan Kembung Banjar Segar (90g)',
                reason: 'Kenaikan mendadak harga ayam lokal akibat gejolak pakan unggas.',
                proteinCompare: 'Setara 28.5g -> 29.0g (+0.5g)',
                calorieCompare: 'Setara 580 kkal -> 575 kkal',
                costCompare: 'Stabil Rp 14.850 / porsi',
                nutritionistReview: 'dr. Dian Lestari, Sp.GK (BGN) - Disetujui karena protein & zat besi seimbang',
                status: 'approved'
              })
              setSubstitutionModalData({ mode: 'create' })
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Substitusi Menu Darurat</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. EXECUTIVE KPI COMMAND RIBBON (4 METRICS)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Hari Sekolah Aktif */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Hari Operasional Aktif</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.activeSchoolDays}
            </span>
            <span className="text-xs text-slate-500 font-medium">Hari Belajar</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-blue-800">Siklus 10-20 Hari</span>
            <span>berotasi mencegah kebosanan</span>
          </div>
        </div>

        {/* KPI 2: Kunci Menu Nasional */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Kesiapan Menu Terkunci</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.lockRate}%
            </span>
            <span className="text-xs text-emerald-800 font-semibold">{kpiData.lockedDays} Hari Locked</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">100% Sesuai AKG</span>
            <span>Kemenkes RI &amp; Halal MUI</span>
          </div>
        </div>

        {/* KPI 3: Libur Operasional (Blackout) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Hari Libur Operasional</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.blackoutDays}
            </span>
            <span className="text-xs text-rose-800 font-semibold">Hari Blackout</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-semibold text-rose-800">Sistem Dikunci</span>
            <span>Mencegah porsi terbuang sia-sia</span>
          </div>
        </div>

        {/* KPI 4: Jadwal Sidak Satgas MBG */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Jadwal Sidak &amp; Audit</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {kpiData.inspectionCount}
            </span>
            <span className="text-xs text-slate-600 font-semibold">Sidak Terjadwal</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sidak Dapur SPPG Terpadu</span>
            <button
              onClick={() => setInspectionModalOpen(true)}
              className="text-slate-600 hover:text-slate-800 font-bold underline cursor-pointer"
            >
              + Jadwalkan
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. VISUALIZATIONS & CHARTS
          ==================================================================== */}
      <CalendarCharts calendarDays={calendarDays} />

      {/* ====================================================================
          4. MAIN VIEW TABS & FILTER BAR
          ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Grid Kalender Bulanan</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Tabel Daftar Hari Operasional</span>
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>Katalog 10 Siklus Menu Nasional</span>
            </button>

            <button
              onClick={() => setActiveTab('substitutions')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'substitutions'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Substitusi Menu Darurat ({substitutions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Bulan:</span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-xs font-bold text-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMonth('September 2026')}
                className={`p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer ${
                  selectedMonth === 'September 2026' ? 'text-blue-800 font-black' : 'text-slate-500'
                }`}
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5">{selectedMonth}</span>
              <button
                type="button"
                onClick={() => setSelectedMonth('Oktober 2026')}
                className={`p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer ${
                  selectedMonth === 'Oktober 2026' ? 'text-blue-800 font-black' : 'text-slate-500'
                }`}
                title="Bulan Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Select Filters (Active for Grid & Table) */}
        {(activeTab === 'grid' || activeTab === 'table') && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tanggal, paket menu, nama SPPG, atau alasan libur..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={dayTypeFilter}
                  onChange={(e) => setDayTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  {DAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  {MENU_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'table' && (
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
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 1: GRID KALENDER BULANAN (MONTH VIEW MATRIX)
            ==================================================================== */}
        {activeTab === 'grid' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-7 gap-2.5">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-[11px] uppercase tracking-wider text-slate-500 py-1.5 bg-slate-50 rounded-lg border border-slate-100"
                >
                  {day}
                </div>
              ))}

              {filteredDays.map((d) => {
                const pkg = menuPackages.find((p) => p.id === d.packageId)
                const isToday = d.date === '2026-09-28'

                return (
                  <div
                    key={d.date}
                    onClick={() => setSelectedDayDetail(d)}
                    className={`min-h-[120px] rounded-xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer hover:border-slate-300 relative ${
                      isToday
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                        : d.isOperationalBlackout
                        ? 'border-rose-200 bg-rose-50/30'
                        : d.dayType === 'exam_day'
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200/90 bg-white hover:border-blue-300'
                    }`}
                  >
                    {/* Top Row: Date & Status Icons */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-6 w-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : d.isOperationalBlackout
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-700">
                            Hari Ini
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {d.isOperationalBlackout && (
                          <span title="Libur Blackout (Pemesanan Dikunci)">
                            <Ban className="h-3.5 w-3.5 text-rose-500" />
                          </span>
                        )}
                        {d.hasInspection && (
                          <span title="Jadwal Sidak Satgas MBG">
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
                          </span>
                        )}
                        {d.hasSubstitution && (
                          <span title="Ada Substitusi Menu">
                            <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                        {d.menuStatus === 'locked' && (
                          <span title="Menu Terkunci & Valid">
                            <Lock className="h-3 w-3 text-emerald-800" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Content & Menu Summary */}
                    <div className="flex-1 my-1">
                      {d.isOperationalBlackout ? (
                        <div className="rounded-lg bg-rose-100/70 p-1.5 border border-rose-200">
                          <p className="text-[10px] font-bold text-rose-900 leading-tight truncate">
                            {d.title}
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5 line-clamp-2">
                            {d.blackoutReason || 'Dapur Libur'}
                          </p>
                        </div>
                      ) : pkg ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                              {pkg.cycleCode}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-800 truncate">
                              {pkg.name.split('&')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pkg.proteinMain}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{pkg.calories} kkal</span>
                            <span>Ã¢â‚¬Â¢</span>
                            <span className="font-semibold text-emerald-700">{pkg.protein}g Prot</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-medium">{d.title}</p>
                      )}
                    </div>

                    {/* Bottom: Portions or Special Alert */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      {d.isOperationalBlackout ? (
                        <span className="text-rose-800 font-bold text-[11px]">0 Porsi (Lock)</span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {(d.targetPortions / 1000).toFixed(0)}k porsi
                        </span>
                      )}
                      <span className="text-blue-800 font-semibold hover:underline flex items-center gap-0.5 text-[11px]">
                        Detail &rarr;
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: TABEL DAFTAR HARI OPERASIONAL (LIST VIEW)
            ==================================================================== */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full table-fixed min-w-[1050px] text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="w-36 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal &amp; Hari</th>
                  <th className="w-48 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tipe Hari</th>
                  <th className="w-72 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Siklus Menu MBG</th>
                  <th className="w-40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Standar Gizi (AKG)</th>
                  <th className="w-40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Porsi &amp; SPPG</th>
                  <th className="w-44 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status Penguncian</th>
                  <th className="w-48 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Agenda &amp; Catatan</th>
                  <th className="w-24 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada jadwal operasional yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredDays.map((d) => {
                    const pkg = menuPackages.find((p) => p.id === d.packageId)
                    const isToday = d.date === '2026-09-28'

                    return (
                      <tr
                        key={d.date}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isToday ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* 1. Tanggal & Hari */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{d.dayName}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-blue-100 text-blue-700">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">{d.date}</span>
                        </td>

                        {/* 2. Tipe Hari */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                              d.isOperationalBlackout
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : d.dayType === 'exam_day'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {d.isOperationalBlackout ? (
                              <Ban className="h-3 w-3 text-rose-800" />
                            ) : (
                              <CalendarDays className="h-3 w-3 text-blue-800" />
                            )}
                            <span className="truncate">{d.dayTypeLabel}</span>
                          </span>
                        </td>

                        {/* 3. Siklus Menu MBG */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          {pkg ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 shrink-0">
                                  {pkg.cycleCode}
                                </span>
                                <span className="font-bold text-slate-900 truncate">
                                  {pkg.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {pkg.proteinMain} Ã¢â‚¬Â¢ {pkg.fruit}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">
                              {d.blackoutReason || 'Tidak Ada Menu (Dapur Libur)'}
                            </span>
                          )}
                        </td>

                        {/* 4. Standar Gizi AKG */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          {pkg ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Kalori:</span>
                                <strong className="text-slate-900 font-semibold">{pkg.calories} kkal</strong>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Protein:</span>
                                <strong className="text-emerald-700 font-semibold">{pkg.protein}g</strong>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* 5. Target Porsi & SPPG */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          {d.isOperationalBlackout ? (
                            <span className="text-rose-800 font-bold text-[11px]">0 Porsi (Kunci Total)</span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {d.targetPortions.toLocaleString('id-ID')} Porsi
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {d.activeKitchens} Dapur SPPG
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 6. Status Penguncian Menu */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                              d.menuStatus === 'locked'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : d.menuStatus === 'substitution_approved'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : d.menuStatus === 'substitution_pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : d.menuStatus === 'draft'
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {d.menuStatus === 'locked' ? (
                              <Lock className="h-3 w-3 text-emerald-800" />
                            ) : d.menuStatus === 'substitution_approved' ? (
                              <CheckCircle2 className="h-3 w-3 text-blue-800" />
                            ) : d.menuStatus === 'substitution_pending' ? (
                              <RefreshCw className="h-3 w-3 text-amber-800" />
                            ) : (
                              <Ban className="h-3 w-3 text-rose-800" />
                            )}
                            <span className="truncate">{d.menuStatusLabel}</span>
                          </span>
                        </td>

                        {/* 7. Agenda & Catatan */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                          {d.hasInspection ? (
                            <div className="rounded-lg bg-slate-100 p-1.5 border border-slate-200 text-slate-900">
                              <span className="font-bold flex items-center gap-1 text-[10px]">
                                <ShieldAlert className="h-3 w-3 text-slate-600" />
                                <span>Sidak: {d.inspectionDetail.sppgId}</span>
                              </span>
                              <span className="text-[10px] text-slate-700 block truncate">
                                {d.inspectionDetail.targetSppgName}
                              </span>
                            </div>
                          ) : d.hasSubstitution ? (
                            <span className="text-amber-700 font-semibold text-[11px] flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 text-amber-800" />
                              <span>Substitusi Bahan Aktif</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>

                        {/* 8. Aksi */}
                        <td className={`px-4 ${density === 'compact' ? 'py-2' : 'py-3'} text-right relative`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedDayDetail(d)}
                              title="Lihat Detail Hari & Menu"
                              className="p-1.5 text-slate-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setOpenMenuDate(openMenuDate === d.date ? null : d.date)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Row Context Menu */}
                          {openMenuDate === d.date && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-4 top-10 z-30 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-left text-xs"
                            >
                              <button
                                onClick={() => {
                                  setSelectedDayDetail(d)
                                  setOpenMenuDate(null)
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Eye className="h-3.5 w-3.5 text-blue-800" />
                                <span>Detail Menu &amp; Gramatur</span>
                              </button>

                              <button
                                onClick={() => handleToggleDayLock(d.date)}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                {d.menuStatus === 'locked' ? (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 text-amber-800" />
                                    <span>Buka Kunci Menu (Draft)</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3.5 w-3.5 text-emerald-800" />
                                    <span>Kunci Menu Hari Ini</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setBlackoutModalData({
                                    date: d.date,
                                    isSettingBlackout: !d.isOperationalBlackout
                                  })
                                  setOpenMenuDate(null)
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Ban className="h-3.5 w-3.5 text-rose-800" />
                                <span>
                                  {d.isOperationalBlackout
                                    ? 'Buka Hari Operasional'
                                    : 'Tetapkan Libur Blackout'}
                                </span>
                              </button>

                              <button
                                onClick={() => {
                                  setInspectionForm((prev) => ({ ...prev, date: d.date }))
                                  setInspectionModalOpen(true)
                                  setOpenMenuDate(null)
                                }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
                                <span>Jadwalkan Sidak Satgas MBG</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================================
            TAB 3: KATALOG 10 SIKLUS MENU NASIONAL (PAKET A - J)
            ==================================================================== */}
        {activeTab === 'packages' && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4 text-blue-800 shrink-0" />
                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                  <strong>Siklus Rotasi 10 Hari Kerja:</strong> Dirancang oleh Tim Ahli Gizi BGN &amp; Kemenkes RI untuk memenuhi 30-35% Angka Kecukupan Gizi (AKG) harian anak sekolah dengan pagu anggaran maksimal Rp 15.000/porsi.
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 shrink-0">
                10 Paket Standar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Package Badge & Slot */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white shadow-2xs">
                          {pkg.cycleCode}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {pkg.daySlot}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        Rp {pkg.costPerServing.toLocaleString('id-ID')} / porsi
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug mb-2">
                      {pkg.name}
                    </h4>

                    {/* Component Items */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 rounded-xl p-3 border border-slate-100 mb-3">
                      <p className="flex items-start gap-2">
                        <span className="text-slate-500 font-medium w-24 shrink-0">Makanan Pokok:</span>
                        <strong className="text-slate-800 font-semibold">{pkg.staple}</strong>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-500 font-medium w-24 shrink-0">Lauk Utama:</span>
                        <strong className="text-slate-800 font-semibold">{pkg.proteinMain}</strong>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-500 font-medium w-24 shrink-0">Sayur Mayur:</span>
                        <strong className="text-slate-800 font-semibold">{pkg.sideVeggie}</strong>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-500 font-medium w-24 shrink-0">Buah Segar:</span>
                        <strong className="text-slate-800 font-semibold">{pkg.fruit}</strong>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-500 font-medium w-24 shrink-0">Minuman:</span>
                        <strong className="text-slate-800 font-semibold">{pkg.dairyDrink}</strong>
                      </p>
                    </div>

                    {/* Nutrition Matrix */}
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] mb-3">
                      <div className="p-1.5 rounded-lg bg-blue-50/60 border border-blue-100">
                        <span className="text-slate-500 block">Kalori</span>
                        <strong className="font-bold text-blue-900 text-xs">{pkg.calories}</strong>
                        <span className="text-[11px] text-slate-500">kkal</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="text-slate-500 block">Protein</span>
                        <strong className="font-bold text-emerald-900 text-xs">{pkg.protein}g</strong>
                        <span className="text-[11px] text-emerald-800">Unggul</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Kalsium</span>
                        <strong className="font-bold text-slate-800 text-xs">{pkg.calcium}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Zat Besi</span>
                        <strong className="font-bold text-slate-800 text-xs">{pkg.iron}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Zinc</span>
                        <strong className="font-bold text-slate-800 text-xs">{pkg.zinc}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                      <span>Sertifikasi SLHS: <strong>{pkg.slhsCert}</strong></span>
                    </div>

                    <button
                      onClick={() => setSelectedPackageDetail(pkg)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-800 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      Resep Lengkap &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: PENGGANTIAN MENU DARURAT (SUBSTITUSI BAHAN KOMODITAS)
            ==================================================================== */}
        {activeTab === 'substitutions' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Prosedur Penggantian Bahan Darurat (Menu Substitution Protocol)
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Penggantian bahan baku diizinkan jika terjadi kelangkaan komoditas lokal atau lonjakan harga drastis, dengan syarat nilai protein dan kalori harus setara serta telah diverifikasi Ahli Gizi BGN.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSubstitutionForm({
                    date: '2026-10-02',
                    cycleCode: 'Paket E',
                    region: 'Nasional (Seluruh Wilayah)',
                    originalIngredient: '',
                    substituteIngredient: '',
                    reason: '',
                    proteinCompare: 'Setara (28g)',
                    calorieCompare: 'Setara (580 kkal)',
                    costCompare: 'Sesuai Pagu (Rp 14.800)',
                    nutritionistReview: 'dr. Dian Lestari, Sp.GK (BGN) - Disetujui',
                    status: 'approved'
                  })
                  setSubstitutionModalData({ mode: 'create' })
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition shadow-2xs cursor-pointer"
              >
                + Ajukan Substitusi Bahan
              </button>
            </div>

            <div className="space-y-3">
              {substitutions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-blue-100 text-blue-800">
                        {sub.cycleCode}
                      </span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {sub.id} Ã¢â‚¬Â¢ Tanggal: {sub.date}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">({sub.region})</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        sub.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {sub.status === 'approved' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-800" />
                      )}
                      <span>{sub.statusLabel}</span>
                    </span>
                  </div>

                  {/* Substitution Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                        Bahan Baku Asli (Terganggu)
                      </span>
                      <strong className="text-slate-900 text-xs block mb-1">
                        {sub.originalIngredient}
                      </strong>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600">
                        <span>Protein: {sub.nutritionComparison.proteinOriginal}</span>
                        <span>Ã¢â‚¬Â¢</span>
                        <span>Kalori: {sub.nutritionComparison.caloriesOriginal}</span>
                        <span>Ã¢â‚¬Â¢</span>
                        <span>Biaya: {sub.nutritionComparison.costOriginal}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Bahan Substitusi Rekomendasi
                      </span>
                      <strong className="text-slate-900 text-xs block mb-1">
                        {sub.substituteIngredient}
                      </strong>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600">
                        <span className="font-semibold text-emerald-700">
                          {sub.nutritionComparison.proteinSubstitute}
                        </span>
                        <span>Ã¢â‚¬Â¢</span>
                        <span>{sub.nutritionComparison.caloriesSubstitute}</span>
                        <span>Ã¢â‚¬Â¢</span>
                        <span className="font-semibold text-emerald-700">
                          {sub.nutritionComparison.costSubstitute}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Justification & Nutritionist Note */}
                  <div className="text-xs space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Alasan Kelangkaan:</strong> {sub.reason}
                    </p>
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Telaah Nutrisionis BGN:</strong> {sub.nutritionistReview}
                    </p>
                    {sub.approvedAt && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 mt-1">
                        Disetujui pada {sub.approvedAt} oleh <strong>{sub.approvedBy}</strong>
                      </p>
                    )}
                  </div>

                  {/* Review Actions if Pending */}
                  {sub.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSubstitutionModalData({
                            mode: 'review',
                            item: sub,
                            action: 'reject'
                          })
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                      >
                        Tolak Substitusi
                      </button>
                      <button
                        onClick={() => {
                          setSubstitutionModalData({
                            mode: 'review',
                            item: sub,
                            action: 'approve'
                          })
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Otorisasi &amp; Kunci Menu Pengganti</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODAL 1: KUNCI SIKLUS MENU 1 BULAN (LOCK MONTH CYCLE)
          ==================================================================== */}
      {lockMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-100">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Kunci Siklus Menu Nasional</h3>
                <p className="text-xs text-slate-500">Periode Kalender {selectedMonth}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-800" />
                <span>Otoritas Penguncian Spesifikasi Menu BGN</span>
              </p>
              <p className="leading-relaxed">
                Tindakan ini akan mengunci seluruh resep, gramatur bahan makanan, dan pagu HPP per porsi untuk 180 Dapur SPPG di seluruh Indonesia. Dapur SPPG tidak dapat mengubah resep tanpa pengajuan dispensasi resmi.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Hari Sekolah Terkunci:</span>
                <strong className="text-slate-900 font-bold">{kpiData.activeSchoolDays} Hari</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Rata-rata Kalori:</span>
                <strong className="text-slate-900 font-bold">575 kkal / porsi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Rata-rata Protein:</span>
                <strong className="text-slate-900 font-bold">28.2 gram / porsi</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Kepatuhan Standar AKG:</span>
                <strong className="text-emerald-800 font-bold">100% Lulus Uji Kemenkes</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLockMonthModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLockEntireMonth}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span>Konfirmasi Kunci Menu 1 Bulan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: FORM PENGGANTIAN MENU DARURAT (SUBSTITUTION MODAL)
          ==================================================================== */}
      {substitutionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                  <RefreshCw className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {substitutionModalData.mode === 'create'
                      ? 'Penggantian Menu Darurat (Substitusi Bahan)'
                      : `Otorisasi Pengajuan Substitusi: ${substitutionModalData.item.id}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Standar Kesetaraan Nutrisi &amp; Pagu Anggaran BGN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubstitutionModalData(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {substitutionModalData.mode === 'create' ? (
              <form onSubmit={handleSubmitSubstitution} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Berlaku</label>
                    <input
                      type="date"
                      required
                      value={substitutionForm.date}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, date: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Paket Menu Target</label>
                    <select
                      value={substitutionForm.cycleCode}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, cycleCode: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                    >
                      {menuPackages.map((p) => (
                        <option key={p.id} value={p.cycleCode}>
                          {p.cycleCode} - {p.name.split('&')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wilayah / Dapur Terdampak</label>
                  <input
                    type="text"
                    required
                    value={substitutionForm.region}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, region: e.target.value })}
                    placeholder="Contoh: Jawa Barat (Wilayah Bandung & sekitarnya)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-rose-700 block mb-1">Bahan Baku Asli</label>
                    <input
                      type="text"
                      required
                      value={substitutionForm.originalIngredient}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, originalIngredient: e.target.value })}
                      placeholder="Contoh: Ayam Broiler Karkas (85g)"
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/40 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-emerald-700 block mb-1">Bahan Pengganti Setara</label>
                    <input
                      type="text"
                      required
                      value={substitutionForm.substituteIngredient}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, substituteIngredient: e.target.value })}
                      placeholder="Contoh: Ikan Kembung Segar Banjar (90g)"
                      className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Alasan Kelangkaan / Kedaruratan Komoditas
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={substitutionForm.reason}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, reason: e.target.value })}
                    placeholder="Jelaskan alasan harga melonjak, pasokan banjir, atau gangguan distribusi peternak/petani lokal..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Delta Protein</label>
                    <input
                      type="text"
                      value={substitutionForm.proteinCompare}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, proteinCompare: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Delta Kalori</label>
                    <input
                      type="text"
                      value={substitutionForm.calorieCompare}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, calorieCompare: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Estimasi Biaya HPP</label>
                    <input
                      type="text"
                      value={substitutionForm.costCompare}
                      onChange={(e) => setSubstitutionForm({ ...substitutionForm, costCompare: e.target.value })}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rekomendasi Ahli Gizi BGN</label>
                  <input
                    type="text"
                    value={substitutionForm.nutritionistReview}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, nutritionistReview: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSubstitutionModalData(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Setujui &amp; Terbitkan Substitusi</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-slate-800">
                    <strong>Alasan Pengajuan SPPG:</strong> {substitutionModalData.item.reason}
                  </p>
                  <p className="text-slate-800">
                    <strong>Bahan Asli:</strong> {substitutionModalData.item.originalIngredient} &rarr; <strong>Pengganti:</strong> {substitutionModalData.item.substituteIngredient}
                  </p>
                  <p className="text-emerald-700 font-bold">
                    Telaah Nutrisionis: {substitutionModalData.item.nutritionistReview}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSubstitutionModalData(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitSubstitution}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Konfirmasi Otorisasi Penggantian</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: PENETAPAN HARI LIBUR OPERASIONAL (OPERATIONAL BLACKOUT DATE)
          ==================================================================== */}
      {blackoutModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  blackoutModalData.isSettingBlackout
                    ? 'bg-rose-50 text-rose-800 border-rose-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                }`}
              >
                {blackoutModalData.isSettingBlackout ? (
                  <Ban className="h-5 w-5" />
                ) : (
                  <CalendarDays className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {blackoutModalData.isSettingBlackout
                    ? 'Tetapkan Hari Libur Operasional (Blackout)'
                    : 'Buka Kembali Hari Operasional Katering'}
                </h3>
                <p className="text-xs text-slate-500">Tanggal Target: {blackoutModalData.date}</p>
              </div>
            </div>

            {blackoutModalData.isSettingBlackout ? (
              <form onSubmit={handleSubmitBlackout} className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-900 text-[11px] leading-relaxed">
                  <strong>Pencegahan Makanan Terbuang (Zero Food Waste):</strong> Mengunci sistem pemesanan pada hari libur nasional / cuti bersama memastikan seluruh Dapur SPPG tidak memasak porsi yang tidak akan dimakan siswa.
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Judul / Alasan Libur</label>
                  <input
                    type="text"
                    required
                    value={blackoutForm.title}
                    onChange={(e) => setBlackoutForm({ ...blackoutForm, title: e.target.value })}
                    placeholder="Contoh: Libur Nasional Maulid Nabi Muhammad SAW"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dasar Ketetapan / Keterangan</label>
                  <textarea
                    rows={2}
                    value={blackoutForm.reason}
                    onChange={(e) => setBlackoutForm({ ...blackoutForm, reason: e.target.value })}
                    placeholder="Contoh: SKB 3 Menteri No. 855/2026 tentang Hari Libur Nasional & Cuti Bersama"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBlackoutModalData(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Kunci Hari Libur Operasional</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin membuka kembali tanggal <strong>{blackoutModalData.date}</strong> sebagai hari sekolah aktif reguler? Dapur SPPG akan menerima penugasan memasak sesuai paket siklus menu.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBlackoutModalData(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitBlackout}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    Buka Hari Operasional
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: JADWALKAN SIDAK & AUDIT MENDADAK (INSPECTION MODAL)
          ==================================================================== */}
      {inspectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Jadwal Inspeksi Mendadak (Sidak) Satgas MBG
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Protokol Pengawasan Lapangan Terpadu BGN
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectionModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleInspection} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-900 text-[11px] leading-relaxed">
                <strong>Kerahasiaan Tingkat Tinggi:</strong> Jadwal sidak ini hanya dapat dilihat oleh tim pimpinan Satgas MBG Pusat dan tidak akan disiarkan ke aplikasi operator Dapur SPPG demi menjaga orisinalitas audit kebersihan.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Sidak</label>
                  <input
                    type="date"
                    required
                    value={inspectionForm.date}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Audit Subuh</label>
                  <input
                    type="text"
                    required
                    value={inspectionForm.auditTime}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, auditTime: e.target.value })}
                    placeholder="04:30 - 07:00 WIB"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dapur SPPG Sasaran Audit</label>
                <input
                  type="text"
                  required
                  value={inspectionForm.targetSppgName}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, targetSppgName: e.target.value })}
                  placeholder="Contoh: SPPG Sentral Sukajadi Bandung"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ketua Tim Inspektorat BGN</label>
                <input
                  type="text"
                  required
                  value={inspectionForm.leadInspector}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, leadInspector: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fokus Audit Lapangan</label>
                <textarea
                  rows={2}
                  required
                  value={inspectionForm.auditFocus}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, auditFocus: e.target.value })}
                  placeholder="Contoh: Uji sterilisasi air bersih, gramatur porsi ayam & kepatuhan rantai dingin armada logistik..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectionModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Daftarkan Jadwal Sidak Rahasia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 5: DETAIL HARI OPERASIONAL & MENU
          ==================================================================== */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tabular-nums text-slate-900">
                    {selectedDayDetail.dayName}, {selectedDayDetail.date}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      selectedDayDetail.isOperationalBlackout
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedDayDetail.dayTypeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedDayDetail.title}</p>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedDayDetail.isOperationalBlackout ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-900">
                <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                  <Ban className="h-4 w-4" />
                  <span>Hari Libur Operasional (Blackout)</span>
                </div>
                <p className="leading-relaxed">
                  {selectedDayDetail.blackoutReason || 'Hari libur resmi. Sistem pemesanan katering dikunci total untuk menjamin efisiensi APBN dan zero food waste.'}
                </p>
                <p className="text-[11px] text-rose-700 pt-2 border-t border-rose-200">
                  Target Porsi: <strong>0 Porsi</strong> Ã¢â‚¬Â¢ Dapur SPPG Aktif: <strong>0 Dapur</strong>
                </p>
              </div>
            ) : (
              (() => {
                const pkg = menuPackages.find((p) => p.id === selectedDayDetail.packageId)
                if (!pkg) return <p className="text-xs text-slate-500">Tidak ada rincian menu pada hari ini.</p>

                return (
                  <div className="space-y-3.5 text-xs">
                    {/* Menu Header Card */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-600 text-white">
                            {pkg.cycleCode}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs">
                            {pkg.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Porsi Pangan Aman Teruji SLHS Kemenkes
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Pagu Biaya</span>
                        <strong className="text-emerald-700 font-bold text-xs">
                          Rp {pkg.costPerServing.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    {/* Meal Composition */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <h4 className="font-bold text-slate-900 text-xs mb-1">
                        Komposisi Bahan Makanan (Gramatur Bersih)
                      </h4>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Makanan Pokok:</span>
                        <strong className="text-slate-800">{pkg.staple}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Lauk Hewani / Protein:</span>
                        <strong className="text-slate-800">{pkg.proteinMain}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Sayuran Hijau / Serat:</span>
                        <strong className="text-slate-800">{pkg.sideVeggie}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Buah Segar Pencuci Mulut:</span>
                        <strong className="text-slate-800">{pkg.fruit}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Minuman Bernutrisi:</span>
                        <strong className="text-slate-800">{pkg.dairyDrink}</strong>
                      </p>
                    </div>

                    {/* Nutrition Matrix */}
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                        <span className="text-slate-500 block">Energi</span>
                        <strong className="font-extrabold text-blue-900 text-xs">{pkg.calories}</strong>
                        <span className="text-[11px] text-slate-500">kkal</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <span className="text-slate-500 block">Protein</span>
                        <strong className="font-extrabold text-emerald-900 text-xs">{pkg.protein}g</strong>
                        <span className="text-[11px] text-emerald-800 font-semibold">Tinggi</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Kalsium</span>
                        <strong className="font-extrabold text-slate-800 text-xs">{pkg.calcium}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Zat Besi</span>
                        <strong className="font-extrabold text-slate-800 text-xs">{pkg.iron}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 block">Zinc</span>
                        <strong className="font-extrabold text-slate-800 text-xs">{pkg.zinc}</strong>
                        <span className="text-[11px] text-slate-500">mg</span>
                      </div>
                    </div>

                    {/* Inspection Note if any */}
                    {selectedDayDetail.hasInspection && (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Agenda Sidak: {selectedDayDetail.inspectionDetail.targetSppgName}</span>
                        </div>
                        <p className="text-[11px]">
                          Ketua Tim: {selectedDayDetail.inspectionDetail.leadInspector} ({selectedDayDetail.inspectionDetail.auditTime})
                        </p>
                        <p className="text-[11px] font-semibold text-slate-700">
                          Fokus: {selectedDayDetail.inspectionDetail.auditFocus}
                        </p>
                      </div>
                    )}

                    {/* Operational Portions */}
                    <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 text-slate-600">
                      <span>Proyeksi Konsumsi Siswa:</span>
                      <strong className="text-slate-900 font-bold">
                        {selectedDayDetail.targetPortions.toLocaleString('id-ID')} Porsi
                      </strong>
                    </div>
                  </div>
                )
              })()
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 6: DETAIL RESEP PAKET LENGKAP (PACKAGE RECIPE MODAL)
          ==================================================================== */}
      {selectedPackageDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-600 text-white shadow-2xs">
                  {selectedPackageDetail.cycleCode}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {selectedPackageDetail.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedPackageDetail.daySlot}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPackageDetail(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{selectedPackageDetail.description}"
            </p>

            {/* Menu Items */}
            <div className="space-y-2 text-xs p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                Spesifikasi Bahan Masakan Dapur SPPG
              </h4>
              <p className="flex justify-between">
                <span className="text-slate-500">Makanan Pokok:</span>
                <strong className="text-slate-800">{selectedPackageDetail.staple}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Lauk Utama:</span>
                <strong className="text-slate-800">{selectedPackageDetail.proteinMain}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Sayuran Hijau:</span>
                <strong className="text-slate-800">{selectedPackageDetail.sideVeggie}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Buah Segar:</span>
                <strong className="text-slate-800">{selectedPackageDetail.fruit}</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-500">Minuman Tambahan:</span>
                <strong className="text-slate-800">{selectedPackageDetail.dairyDrink}</strong>
              </p>
            </div>

            {/* Nutrition & Certification */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 block text-xs">Profil Nutrisi AKG</span>
                <p className="text-slate-600">Kalori: <strong>{selectedPackageDetail.calories} kkal</strong></p>
                <p className="text-slate-600">Protein: <strong>{selectedPackageDetail.protein} gram</strong></p>
                <p className="text-slate-600">Kalsium: <strong>{selectedPackageDetail.calcium} mg</strong></p>
                <p className="text-slate-600">Zat Besi: <strong>{selectedPackageDetail.iron} mg</strong></p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block text-xs">Akreditasi &amp; Pagu</span>
                <p className="text-slate-600">HPP Porsi: <strong>Rp {selectedPackageDetail.costPerServing.toLocaleString('id-ID')}</strong></p>
                <p className="text-slate-600">SLHS: <strong>{selectedPackageDetail.slhsCert}</strong></p>
                <p className="text-slate-600">Halal: <strong>Tersertifikasi</strong></p>
                <p className="text-slate-600">Alergen: <strong>{selectedPackageDetail.allergens.join(', ')}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPackageDetail(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
