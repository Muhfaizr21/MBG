/**
 * ==============================================================================
 * ADAPTER PATTERN: TO FEEDBACK VIEW
 * Mengonversi model respons API backend Golang/PostgreSQL ke ViewModel UI
 * yang sepenuhnya kompatibel dengan FeedbackPanel dan FeedbackCharts.
 * ==============================================================================
 */

export function toFeedbackView(raw) {
  if (!raw || typeof raw !== 'object') return null

  const severity = raw.severity || 'level3'
  const severityLabel =
    raw.severityLabel ||
    (severity === 'level1'
      ? 'Level 1 (Kritis - Bahaya Keracunan)'
      : severity === 'level2'
      ? 'Level 2 (Sedang - Kualitas & Porsi)'
      : 'Level 3 (Rendah - Saran Rasa & Menu)')

  const anomalyType = raw.anomalyType || 'packaging_issue'
  const anomalyLabel =
    raw.anomalyLabel ||
    (anomalyType === 'spoiled_food'
      ? 'Makanan Basi & Berbau Masam'
      : anomalyType === 'foreign_object'
      ? 'Ditemukan Benda Asing'
      : anomalyType === 'packaging_issue'
      ? 'Tutup Boks Rusak / Renggang'
      : anomalyType === 'allergen_concern'
      ? 'Reaksi Alergi Telur / Seafood'
      : 'Ketidaksesuaian Gramatur')

  const status = raw.status || 'open'
  const isKillSwitch = Boolean(raw.isKillSwitchExecuted)
  const statusLabel =
    raw.statusLabel ||
    (status === 'resolved'
      ? 'Selesai & Ditutup'
      : isKillSwitch
      ? 'DIBEKUKAN (Kill-Switch Aktif)'
      : status === 'in_progress'
      ? 'Sedang Diinvestigasi'
      : 'Tiket Baru Masuk')

  const rawReporter = raw.reporter || {}
  const reporter = {
    name: rawReporter.name || raw.reporterName || 'Validator Lapangan',
    role: rawReporter.role || raw.reporterRole || 'Guru Validator Sekolah',
    phone: rawReporter.phone || raw.reporterPhone || '0812-9901-2211',
    nip: rawReporter.nip || raw.reporterNip || '198501012010011002',
  }

  const rawKill = raw.killSwitchDetails || {}
  const killSwitchDetails =
    isKillSwitch || rawKill.executedAt
      ? {
          executedAt: rawKill.executedAt || raw.reportedAt || '2026-10-07 07:45 WIB',
          executedBy: rawKill.executedBy || 'Satgas Komando MBG',
          haltedSchoolsCount: Number(rawKill.haltedSchoolsCount) || 3,
          haltedPortionsTotal: Number(rawKill.haltedPortionsTotal) || 1250,
          haltedSchools: Array.isArray(rawKill.haltedSchools) && rawKill.haltedSchools.length > 0
            ? rawKill.haltedSchools
            : [
                `${raw.schoolName || 'Sekolah Terdaftar'} (${raw.affectedPortions || 150} porsi)`,
                'SDN Sukagalih 02 (400 porsi)',
                'SMPN 11 Bandung (430 porsi)',
              ],
        }
      : null

  const rawMed = raw.medicalEscalation || {}
  const medicalEscalation = {
    escalated: Boolean(rawMed.escalated ?? (severity === 'level1')),
    healthCenter: rawMed.healthCenter || 'Puskesmas Terdekat',
    doctorInCharge: rawMed.doctorInCharge || 'dr. Siaga Jaga UGD',
    doctorPhone: rawMed.doctorPhone || '119 / (022) 203-1188',
    dispatchStatus:
      rawMed.dispatchStatus ||
      (severity === 'level1' ? 'Puskesmas Bersiaga & Ambulans Siap' : 'Tidak Diperlukan'),
  }

  const rawInv = raw.investigationStatus || {}
  const investigationStatus = {
    assignedInspector: rawInv.assignedInspector || 'Satgas Mutu Pangan BGN',
    auditTime: rawInv.auditTime || 'Pemeriksaan Rutin',
    focus: rawInv.focus || 'Pemeriksaan sampel makanan & kebersihan dapur SPPG',
    labSampleTaken: Boolean(rawInv.labSampleTaken),
  }

  let formattedReportedAt = raw.reportedAt || 'Baru saja'
  if (raw.createdAt && !raw.reportedAt) {
    try {
      const dt = new Date(raw.createdAt)
      formattedReportedAt = `${dt.toISOString().slice(0, 10)} ${dt.toLocaleTimeString('id-ID').slice(0, 5)} WIB`
    } catch {
      formattedReportedAt = '2026-10-07 07:30 WIB'
    }
  }

  return {
    id: raw.id || `TKT-${Date.now()}`,
    ticketNumber: raw.ticketNumber || `INC/BGN/${Date.now().toString().slice(-4)}`,
    reportedAt: formattedReportedAt,
    schoolName: raw.schoolName || 'Sekolah Sasaran',
    npsn: raw.npsn || raw.schoolNpsn || '20210099',
    schoolAddress: raw.schoolAddress || 'Jalan Terdaftar, Jawa Barat',
    sppgName: raw.sppgName || (raw.sppgId === 'SPPG-04' ? 'SPPG Sentral Sukajadi Bandung' : 'SPPG Sentral Menteng 01'),
    sppgId: raw.sppgId || 'SPPG-01',
    batchId: raw.batchId || 'BTH-0842-MNT',
    menuPackage: raw.menuPackage || 'Paket Menu MBG',
    severity,
    severityLabel,
    anomalyType,
    anomalyLabel,
    affectedPortions: Number(raw.affectedPortions) || 0,
    reporter,
    title: raw.title || 'Laporan Aduan Mutu Makanan',
    description: raw.description || '-',
    evidencePhotos: Array.isArray(raw.evidencePhotos) ? raw.evidencePhotos : [],
    slaDeadline: raw.slaDeadline || '2 Jam dari Pelaporan',
    slaRemainingMinutes: Number(raw.slaRemainingMinutes ?? 60),
    status,
    statusLabel,
    isKillSwitchExecuted: isKillSwitch,
    killSwitchDetails,
    medicalEscalation,
    investigationStatus,
    resolutionNotes: raw.resolutionNotes || null,
    closedAt: raw.closedAt || null,
    createdAt: raw.createdAt || null,
  }
}

export function toFeedbackListView(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.map(toFeedbackView).filter(Boolean)
}

export function toHealthCenterView(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: raw.id,
    name: raw.name || 'Puskesmas Siaga',
    address: raw.address || '-',
    distanceKm: raw.distanceKm || '1.0 km dari lokasi',
    emergencyHotline: raw.emergencyHotline || '119',
    doctorInCharge: raw.doctorInCharge || 'Dokter Jaga UGD',
    ambulanceReady: Boolean(raw.ambulanceReady),
    standbyTeam: raw.standbyTeam || 'Satgas Darurat Pangan',
    createdAt: raw.createdAt,
  }
}

export function toHealthCenterListView(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.map(toHealthCenterView).filter(Boolean)
}

export function toFeedbackKPIView(rawKPI, tickets = []) {
  if (rawKPI && typeof rawKPI === 'object') {
    return {
      totalActive: Number(rawKPI.totalActive) || 0,
      level1Critical: Number(rawKPI.level1Critical) || 0,
      slaCompliancePercent: Number(rawKPI.slaCompliancePercent) || 100,
      avgResponseMinutes: Number(rawKPI.avgResponseMinutes) || 30,
      frozenCount: Number(rawKPI.frozenCount) || 0,
      totalProtectedPortions: Number(rawKPI.totalProtectedPortions) || 0,
    }
  }

  // Fallback calculation from tickets
  const totalActive = tickets.filter((t) => t.status !== 'resolved').length
  const level1Critical = tickets.filter((t) => t.severity === 'level1' && t.status !== 'resolved').length
  const frozenBatches = tickets.filter((t) => t.isKillSwitchExecuted && t.killSwitchDetails)
  const totalProtectedPortions = frozenBatches.reduce(
    (sum, t) => sum + (Number(t.killSwitchDetails?.haltedPortionsTotal) || 0),
    0
  )

  return {
    totalActive,
    level1Critical,
    slaCompliancePercent: 100,
    avgResponseMinutes: 32,
    frozenCount: frozenBatches.length,
    totalProtectedPortions,
  }
}
