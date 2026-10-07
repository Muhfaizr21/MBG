/**
 * ==============================================================================
 * ADAPTER PATTERN: TO NOTICE VIEW
 * Mengonversi model respons API backend Golang/PostgreSQL ke ViewModel UI
 * yang sepenuhnya kompatibel dengan NoticesPanel, NoticesCharts, dan SiswaNotices.
 * ==============================================================================
 */

export function toNoticeView(raw) {
  if (!raw || typeof raw !== 'object') return null

  const category = raw.category || 'circular'
  const urgency = raw.urgency || 'info'
  const targetAudience = raw.targetAudience || 'all'
  const status = raw.status || 'active'

  const categoryLabel =
    raw.categoryLabel ||
    (category === 'seasonal'
      ? 'Peringatan Higienitas Musiman'
      : category === 'system'
      ? 'Pembaruan Sistem & AI'
      : 'Surat Edaran BGN')

  const urgencyLabel =
    raw.urgencyLabel ||
    (urgency === 'critical'
      ? 'Panggilan Darurat (Flash Alert)'
      : urgency === 'important'
      ? 'Penting'
      : 'Info Biasa')

  const targetAudienceLabel =
    raw.targetAudienceLabel ||
    (targetAudience === 'validators'
      ? 'Hanya Guru Validator Sekolah'
      : targetAudience === 'sppg'
      ? 'Hanya Dapur SPPG & Katering'
      : 'Semua Pihak (Nasional)')

  const statusLabel =
    raw.statusLabel || (status === 'archived' ? 'Diarsipkan' : 'Tayang Publik')

  const rawAuthor = raw.author || {}
  const author = {
    name: rawAuthor.name || raw.authorName || 'Badan Gizi Nasional (BGN)',
    role: rawAuthor.role || raw.authorRole || 'Pusat Komando Satgas MBG'
  }

  const rawStats = raw.acknowledgementStats || {}
  const totalRecipients = Number(rawStats.totalRecipients) || (targetAudience === 'sppg' ? 180 : targetAudience === 'validators' ? 1250 : 1850)
  const acknowledgedCount = Number(rawStats.acknowledgedCount) || 0
  const complianceRate =
    typeof rawStats.complianceRate === 'number'
      ? Math.round(rawStats.complianceRate * 10) / 10
      : totalRecipients > 0
      ? Math.round((acknowledgedCount / totalRecipients) * 1000) / 10
      : 0

  const acknowledgementStats = {
    totalRecipients,
    acknowledgedCount,
    complianceRate
  }

  let attachments = []
  if (Array.isArray(raw.attachments)) {
    attachments = raw.attachments.map((att) => ({
      fileName: att.fileName || 'Dokumen_Resmi_BGN.pdf',
      fileSize: att.fileSize || '1.2 MB',
      verifiedSignature: att.verifiedSignature || 'Terverifikasi Digital BSrE'
    }))
  }

  const isFlashAlert = Boolean(raw.isFlashAlert || urgency === 'critical')
  const requiresAcknowledgement = Boolean(raw.requiresAcknowledgement || isFlashAlert)

  return {
    id: raw.id || `NOT-${Date.now().toString().slice(-4)}`,
    refNumber: raw.refNumber || 'BGN/SE/001/X/2026',
    title: raw.title || 'Maklumat Resmi Satgas MBG',
    category,
    categoryLabel,
    urgency,
    urgencyLabel,
    targetAudience,
    targetAudienceLabel,
    scopeRegion: raw.scopeRegion || 'Nasional',
    publishedAt: raw.publishedAt || '07 Okt 2026, 06:00 WIB',
    effectiveDate: raw.effectiveDate || 'Berlaku Segera',
    author,
    content: raw.content || '',
    isFlashAlert,
    requiresAcknowledgement,
    status,
    statusLabel,
    statusReason: raw.statusReason || '',
    acknowledgementStats,
    attachments,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
  }
}
