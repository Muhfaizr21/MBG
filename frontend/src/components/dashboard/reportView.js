/**
 * Adapter presentasi untuk Modul Laporan Resmi, BAST Digital, Payment Clearance & Audit Forensik.
 * Menjamin keseragaman tipe data antara PostgreSQL backend dan komponen React UI.
 */

export function mapReportFromApi(r) {
  if (!r) return null
  return {
    id: r.id,
    code: r.code || r.reportCode || 'REP-BGN-00',
    title: r.title || 'Dokumen Laporan Resmi MBG',
    category: r.category || 'distribution',
    categoryLabel: r.categoryLabel || mapReportCategoryLabel(r.category),
    period: r.period || 'September 2026',
    scope: r.scope || '38 Provinsi (514 Kab/Kota)',
    generatedAt: r.generatedAt || 'Baru saja',
    totalPortions: Number(r.totalPortions) || 250000,
    successRate: Number(r.successRate) || 99.4,
    fileFormats: Array.isArray(r.fileFormats) ? r.fileFormats : ['PDF', 'CSV'],
    fileSizePdf: r.fileSizePdf || '3.4 MB',
    fileSizeXlsx: r.fileSizeXlsx || '1.8 MB',
    fileSizeCsv: r.fileSizeCsv || '620 KB',
    description: r.description || '',
    signee: r.signee || 'Satgas MBG Pusat & BGN',
    auditBadge: r.auditBadge || 'BPK Ready',
    authorName: r.authorName || 'Satgas MBG Pusat',
    status: r.status || 'verified',
    kpiMetrics: r.kpiMetrics || {},
    createdAt: r.createdAt || new Date().toISOString(),
  }
}

export function mapBastFromApi(b) {
  if (!b) return null
  return {
    id: b.id,
    refNumber: b.refNumber || 'BAST/MBG-BGN/0000',
    date: b.date || '',
    deliveryTime: b.deliveryTime || '07:00 WIB',
    schoolName: b.schoolName || '',
    npsn: b.npsn || '',
    sppgName: b.sppgName || '',
    sppgId: b.sppgId || '',
    menuPackage: b.menuPackage || '',
    orderedPortions: Number(b.orderedPortions) || 0,
    verifiedAiPortions: Number(b.verifiedAiPortions) || 0,
    rejectedPortions: Number(b.rejectedPortions) || 0,
    thermalTempArrive: b.thermalTempArrive || '60°C (Aman)',
    leadValidator: b.leadValidator || '',
    driverName: b.driverName || '',
    sha256Hash: b.sha256Hash || '',
    qrTokenVerified: Boolean(b.qrTokenVerified),
    bsreStatus: b.bsreStatus || 'Tersertifikasi Digital BSrE BSSN',
    paymentClearanceStatus: b.paymentClearanceStatus || 'cleared',
    paymentClearanceLabel: b.paymentClearanceLabel || (b.paymentClearanceStatus === 'cleared' ? 'Disetujui Cair (100% Valid)' : 'Disetujui dg Pemotongan'),
    subtotalAmount: Number(b.subtotalAmount) || 0,
    approvalNotes: b.approvalNotes || '',
    createdAt: b.createdAt || new Date().toISOString(),
  }
}

export function mapInvoiceFromApi(inv) {
  if (!inv) return null
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || 'INV/SPPG/0000',
    sppgName: inv.sppgName || '',
    sppgId: inv.sppgId || '',
    vendorCompany: inv.vendorCompany || '',
    bankAccount: inv.bankAccount || '',
    period: inv.period || '',
    totalClaimedPortions: Number(inv.totalClaimedPortions) || 0,
    totalClaimedAmount: Number(inv.totalClaimedAmount) || 0,
    verifiedBastPortions: Number(inv.verifiedBastPortions) || 0,
    rejectedDeductionPortions: Number(inv.rejectedDeductionPortions) || 0,
    penaltyDeductionAmount: Number(inv.penaltyDeductionAmount) || 0,
    approvedPaymentAmount: Number(inv.approvedPaymentAmount) || 0,
    bastCompletenessRate: Number(inv.bastCompletenessRate) || 100.0,
    status: inv.status || 'ready_to_sign',
    statusLabel: inv.statusLabel || (inv.status === 'approved_cleared' ? 'Telah Ditandatangani (SP2D Terbit)' : 'Siap Otorisasi Superadmin'),
    sp2dNumber: inv.sp2dNumber || null,
    notes: inv.notes || '',
    signedAt: inv.signedAt || null,
    signedBy: inv.signedBy || null,
    createdAt: inv.createdAt || new Date().toISOString(),
  }
}

export function mapForensicFromApi(f) {
  if (!f) return null
  return {
    id: f.id,
    invoiceRef: f.invoiceRef || '',
    sppgName: f.sppgName || '',
    dateLogged: f.dateLogged || '',
    findingType: f.findingType || 'anomaly',
    findingTypeLabel: f.findingTypeLabel || 'Temuan Anomali',
    claimedPortions: Number(f.claimedPortions) || 0,
    aiValidPortions: Number(f.aiValidPortions) || 0,
    discrepancyCount: Number(f.discrepancyCount) || 0,
    potentialLossAmount: Number(f.potentialLossAmount) || 0,
    severity: f.severity || 'warning',
    severityLabel: f.severityLabel || 'Peringatan',
    explanation: f.explanation || '',
    actionTaken: f.actionTaken || '',
    status: f.status || 'safeguarded',
    statusLabel: f.statusLabel || 'Anggaran Terselamatkan',
    createdAt: f.createdAt || new Date().toISOString(),
  }
}

export function mapReportCategoryLabel(cat) {
  switch (String(cat).toLowerCase()) {
    case 'distribution':
      return 'Distribusi & Logistik'
    case 'nutrition':
      return 'Kepatuhan Gizi & AKG'
    case 'incidents':
      return 'Logistik & Insiden'
    case 'financial':
      return 'Keuangan & APBN'
    case 'attendance':
      return 'Presensi & Efisiensi'
    default:
      return 'Laporan Resmi Terpadu'
  }
}
