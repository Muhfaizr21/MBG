// API client: Bearer access token (in-memory) + httpOnly refresh cookie.
// On a 401 it attempts a single silent refresh, then retries the request.

const API_BASE = 'http://localhost:8080'

let accessToken = localStorage.getItem('mbg_access_token') || null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
  if (token) {
    localStorage.setItem('mbg_access_token', token)
  } else {
    localStorage.removeItem('mbg_access_token')
  }
}

export function getAccessToken() {
  return accessToken
}

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const body = await res.json()
      if (!body.success) return null
      accessToken = body.data.accessToken
      return body.data
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// Endpoint auth yang tidak boleh memicu refresh otomatis: justru endpoint ini
// yang MEMBAWAKAN sesi kembali setelah reload. Exclude hanya endpoint yang
// memang soal token itu sendiri.
const NO_REFRESH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout']

export async function api(path, options = {}) {
  // FormData: jangan set Content-Type manual, biar browser menentukan boundary.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await doFetch()
  if (res.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      res = await doFetch()
    }
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(body?.error || body?.message || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return body
}

export async function loginRequest(email, password) {
  const body = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAccessToken(body.data.accessToken)
  return body.data
}

/** Daftar akun baru (hanya validator; email wajib unik). */
export async function registerRequest({ fullName, email, password, role = 'validator', npsn, schoolName, sppgId }) {
  return api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, role, npsn, schoolName, sppgId }),
  })
}

export async function meRequest() {
  const body = await api('/api/auth/me')
  return body.data
}

export async function logoutRequest() {
  try {
    await api('/api/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}

/**
 * Kirim pemindaian boks (multipart): foto + token QR + sinyal suhu + daftar bahan menu.
 * `items` berformat "Nama:gram,Nama2:gram" — gateway menghitung makro dari dataset gizi.
 * `durationMs` = lama inspeksi visual (ms); dipakai audit ketelitian Pasal 14.
 */
export async function scanRequest({
  image,
  qrToken = '',
  boxId = '',
  batchId = '',
  holdingTempC,
  releaseTempC,
  items = '',
  persist = true,
  rating,
  feedback,
  durationMs,
} = {}) {
  const body = new FormData()
  body.append('image', image)
  if (qrToken) body.append('qrToken', qrToken)
  if (boxId) body.append('boxId', boxId)
  if (batchId) body.append('batchId', batchId)
  if (holdingTempC !== undefined && holdingTempC !== null && holdingTempC !== '') {
    body.append('holdingTempC', String(holdingTempC))
  }
  if (releaseTempC !== undefined && releaseTempC !== null && releaseTempC !== '') {
    body.append('releaseTempC', String(releaseTempC))
  }
  if (durationMs !== undefined && durationMs !== null && durationMs !== '') {
    body.append('durationMs', String(Math.round(durationMs)))
  }
  if (items) body.append('items', items)
  if (persist === false) body.append('persist', 'false')
  if (rating) body.append('rating', String(rating))
  if (feedback) body.append('feedback', String(feedback))
  return api('/api/scans', { method: 'POST', body })
}

export async function updateScanFeedback(id, payload) {
  return api(`/api/scans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteScan(id) {
  return api(`/api/scans/${id}`, { method: 'DELETE' })
}

export async function deleteAllScans() {
  return api('/api/scans/all', { method: 'DELETE' })
}

/** Riwayat scan terbaru (butuh izin scan.submit — role validator). */
export async function fetchRecentScans(limit = 10) {
  const res = await api(`/api/scans/recent?limit=${limit}`)
  return res?.data || []
}

// Role → home portal mapping used after login and inside RequireRole.
export const ROLE_HOME = {
  superadmin: '/admin',
  sppg: '/sppg/dashboard',
  validator: '/validator',
}

export function homeForRole(role) {
  return ROLE_HOME[role] || '/'
}

// -----------------------------------------------------------------------------
// EKOSISTEM DATA MBG (REAL DATABASE QUERIES VIA POSTGRESQL & BACKEND API)
// -----------------------------------------------------------------------------

export async function fetchSchools() {
  const res = await api('/api/schools')
  return res?.data || []
}

export async function fetchSchool(npsn) {
  const res = await api(`/api/schools/${npsn}`)
  return res?.data || null
}

export async function createSchool(payload) {
  const res = await api('/api/schools', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function reassignSchoolSPPG(npsn, { targetSppgId, reason }) {
  const res = await api(`/api/schools/${npsn}/sppg`, {
    method: 'PUT',
    body: JSON.stringify({ targetSppgId, reason }),
  })
  return res?.data || null
}

export async function updateSchoolContacts(npsn, payload) {
  const res = await api(`/api/schools/${npsn}/contacts`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function toggleSchoolStatus(npsn, { status, statusReason, returnDate }) {
  const res = await api(`/api/schools/${npsn}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, statusReason, returnDate }),
  })
  return res?.data || null
}

export async function fetchSppgList() {
  const res = await api('/api/sppg')
  return res?.data || []
}

export async function fetchSppg(id) {
  const res = await api(`/api/sppg/${id}`)
  return res?.data || null
}

/**
 * Aksi superadmin terhadap dapur SPPG.
 *
 * Surat teguran & pembekuan hanya superadmin (kitchen tidak boleh menegur
 * dirinya sendiri); kuota & audit resep memakai izin sppg.manage sehingga
 * dapur juga bisa mengisi datanya sendiri.
 */
export async function issueSppgWarning(id, { letterType, letterNumber, reason, deadlineLabel }) {
  const res = await api(`/api/sppg/${id}/warnings`, {
    method: 'POST',
    body: JSON.stringify({ letterType, letterNumber, reason, deadlineLabel }),
  })
  return res?.data || null
}

export async function suspendSppgKitchen(id, { reason, alternativeSppgId }) {
  const res = await api(`/api/sppg/${id}/suspension`, {
    method: 'POST',
    body: JSON.stringify({ reason, alternativeSppgId }),
  })
  return res?.data || null
}

export async function reinstateSppgKitchen(id, { reason, initialQuota }) {
  const res = await api(`/api/sppg/${id}/reinstate`, {
    method: 'POST',
    body: JSON.stringify({ reason, initialQuota }),
  })
  return res?.data || null
}

export async function updateSppgQuota(id, quota, reason) {
  const res = await api(`/api/sppg/${id}/quota`, {
    method: 'PUT',
    body: JSON.stringify({ quota, reason }),
  })
  return res?.data || null
}

export async function recordSppgRecipeAudit(id, { tkpiStatus, avgDeviationPct, auditor, notes }) {
  const res = await api(`/api/sppg/${id}/recipe-audit`, {
    method: 'POST',
    body: JSON.stringify({ tkpiStatus, avgDeviationPct, auditor, notes }),
  })
  return res?.data || null
}

export async function fetchDeliveries() {
  const res = await api('/api/deliveries')
  return res?.data || []
}

export async function fetchDelivery(id) {
  const res = await api(`/api/deliveries/${id}`)
  return res?.data || null
}

export async function overrideDeliveryAI(id, { reason, auditorName }) {
  const res = await api(`/api/deliveries/${id}/override`, {
    method: 'POST',
    body: JSON.stringify({ reason, auditorName }),
  })
  return res?.data || null
}

export async function orderDeliveryLabTest(id, { labTarget, dinkesOffice, notes }) {
  const res = await api(`/api/deliveries/${id}/lab-audit`, {
    method: 'POST',
    body: JSON.stringify({ labTarget, dinkesOffice, notes }),
  })
  return res?.data || null
}

export async function fetchCalendarDays(monthYear = '') {
  const qs = monthYear ? `?monthYear=${encodeURIComponent(monthYear)}` : ''
  const res = await api(`/api/calendar${qs}`)
  return res?.data || []
}

export async function fetchMenuPackages() {
  const res = await api('/api/menu-packages')
  return res?.data || []
}

export async function fetchSubstitutions() {
  const res = await api('/api/calendar/substitutions')
  return res?.data || []
}

export async function lockMonthCycle(monthYear) {
  const res = await api('/api/calendar/lock-month', {
    method: 'POST',
    body: JSON.stringify({ monthYear }),
  })
  return res?.data || null
}

export async function toggleDayLock(date) {
  const res = await api(`/api/calendar/days/${date}/lock`, {
    method: 'PUT',
  })
  return res?.data || null
}

export async function setBlackoutDate(date, { title, reason, isSettingBlackout }) {
  const res = await api(`/api/calendar/days/${date}/blackout`, {
    method: 'POST',
    body: JSON.stringify({ title, reason, isSettingBlackout }),
  })
  return res?.data || null
}

export async function createSubstitution(data) {
  const res = await api('/api/calendar/substitutions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res?.data || null
}

export async function reviewSubstitution(id, action) {
  const res = await api(`/api/calendar/substitutions/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ action }),
  })
  return res?.data || null
}

export async function scheduleInspection(date, data) {
  const res = await api(`/api/calendar/days/${date}/inspection`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res?.data || null
}

export async function fetchSchedules(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.city && params.city !== 'all') query.set('city', params.city)
  if (params.sppgId) query.set('sppgId', params.sppgId)

  const qs = query.toString() ? `?${query.toString()}` : ''
  const res = await api(`/api/schedules${qs}`)
  return res?.data || []
}

export async function fetchBackupFleets() {
  const res = await api('/api/schedules/backup-fleets')
  return res?.data || []
}

export async function rescheduleDelivery(id, { newTime, reason, effectiveDate }) {
  const res = await api(`/api/schedules/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ newTime, reason, effectiveDate }),
  })
  return res?.data || null
}

export async function sendDelayAlert(id, { delayMinutes, customMessage }) {
  const res = await api(`/api/schedules/${id}/delay-alert`, {
    method: 'POST',
    body: JSON.stringify({ delayMinutes, customMessage }),
  })
  return res?.data || null
}

export async function rerouteBackupFleet(id, { backupFleetId, notes }) {
  const res = await api(`/api/schedules/${id}/reroute`, {
    method: 'POST',
    body: JSON.stringify({ backupFleetId, notes }),
  })
  return res?.data || null
}

export async function fetchAttendances() {
  const res = await api('/api/attendance')
  return res?.data || []
}

export async function adjustAttendanceQuota(id, { newQuota, reason }) {
  const res = await api(`/api/attendance/${id}/quota`, {
    method: 'PUT',
    body: JSON.stringify({ newQuota, reason }),
  })
  return res?.data || null
}

export async function redistributeAttendanceSurplus(id, { targetFacility, portionsAllocated, courierName, authorizedBy }) {
  const res = await api(`/api/attendance/${id}/redistribute`, {
    method: 'POST',
    body: JSON.stringify({ targetFacility, portionsAllocated, courierName, authorizedBy }),
  })
  return res?.data || null
}

export async function auditAttendanceDiscrepancy(id, { investigator, notes }) {
  const res = await api(`/api/attendance/${id}/audit`, {
    method: 'POST',
    body: JSON.stringify({ investigator, notes }),
  })
  return res?.data || null
}

export async function fetchNotices(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category && params.category !== 'all') query.set('category', params.category)
  if (params.urgency && params.urgency !== 'all') query.set('urgency', params.urgency)
  if (params.targetAudience && params.targetAudience !== 'all') query.set('targetAudience', params.targetAudience)
  if (params.status && params.status !== 'all') query.set('status', params.status)

  const qs = query.toString() ? `?${query.toString()}` : ''
  const res = await api(`/api/notices${qs}`)
  return res?.data || []
}

export async function createNotice(payload) {
  const res = await api('/api/notices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function broadcastFlashAlert(id) {
  const res = await api(`/api/notices/${id}/flash-alert`, {
    method: 'POST',
  })
  return res?.data || null
}

export async function toggleArchiveNotice(id, isArchiving = true) {
  const res = await api(`/api/notices/${id}/archive`, {
    method: 'PUT',
    body: JSON.stringify({ isArchiving }),
  })
  return res?.data || null
}

export async function deleteNotice(id) {
  const res = await api(`/api/notices/${id}`, {
    method: 'DELETE',
  })
  return res?.data || null
}

export async function acknowledgeNotice(id) {
  const res = await api(`/api/notices/${id}/ack`, {
    method: 'POST',
  })
  return res?.data || null
}

export async function fetchFeedbacks() {
  const res = await api('/api/feedback')
  return res?.data || []
}

export async function submitFeedback(payload) {
  const res = await api('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function fetchFeedbackBundle() {
  const res = await api('/api/feedback/bundle')
  return res?.data || null
}

export async function fetchFeedbackStats() {
  const res = await api('/api/feedback/stats')
  return res?.data || null
}

export async function executeEmergencyKillSwitch(id, payload = {}) {
  const res = await api(`/api/feedback/${id}/kill-switch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function escalateMedicalClinic(id, payload = {}) {
  const res = await api(`/api/feedback/${id}/medical`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function closeFeedbackTicket(id, payload = {}) {
  const res = await api(`/api/feedback/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function createFeedbackTicket(payload) {
  const res = await api('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function fetchReportsBundle() {
  const res = await api('/api/reports/bundle')
  return res?.data || null
}

export async function fetchReports(params = {}) {
  const q = new URLSearchParams()
  if (params.category && params.category !== 'all') q.set('category', params.category)
  if (params.search) q.set('search', params.search)
  const qs = q.toString()
  const res = await api(`/api/reports${qs ? `?${qs}` : ''}`)
  return res?.data || []
}

export async function createReport(payload) {
  const res = await api('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function fetchDigitalBasts(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  const qs = q.toString()
  const res = await api(`/api/reports/basts${qs ? `?${qs}` : ''}`)
  return res?.data || []
}

export async function fetchDigitalBast(id) {
  const res = await api(`/api/reports/basts/${id}`)
  return res?.data || null
}

export async function fetchVendorInvoices(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  const qs = q.toString()
  const res = await api(`/api/reports/invoices${qs ? `?${qs}` : ''}`)
  return res?.data || []
}

export async function authorizePayment(id, payload) {
  const res = await api(`/api/reports/invoices/${id}/clearance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res?.data || null
}

export async function fetchForensicFindings(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  const qs = q.toString()
  const res = await api(`/api/reports/forensic${qs ? `?${qs}` : ''}`)
  return res?.data || []
}

export async function fetchReportStats() {
  const res = await api('/api/reports/stats')
  return res?.data || null
}

export async function fetchValidators() {
  const res = await api('/api/validators')
  return res?.data || []
}

export async function fetchValidator(id) {
  const res = await api(`/api/validators/${id}`)
  return res?.data || null
}

/**
 * Aksi superadmin atas validator lapangan (RBAC: validators.manage, superadmin).
 * Setiap aksi menulis jejak audit di backend — yang dikembalikan adalah profil
 * terbaru, jadi UI bisa menggantikan baris lama dengan hasil yang benar.
 */
export async function setValidatorStatus(id, status, reason = '') {
  const res = await api(`/api/validators/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
  return res?.data || null
}

export async function resetValidatorDevice(id, reason = '') {
  const res = await api(`/api/validators/${id}/device/reset`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  return res?.data || null
}

export async function warnValidator(id, note) {
  const res = await api(`/api/validators/${id}/warnings`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
  return res?.data || null
}

export async function assignBackupValidator(id, backupValidatorId, reason = '') {
  const res = await api(`/api/validators/${id}/backup`, {
    method: 'PUT',
    body: JSON.stringify({ backupValidatorId, reason }),
  })
  return res?.data || null
}

export async function fetchAdminMetrics() {
  const res = await api('/api/admin/metrics')
  return res?.data || null
}

/** Cari bahan makanan pada dataset gizi (dipakai pemindai porsi). */
export async function fetchNutritionItems(q = '', limit = 20) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  const res = await api(`/api/nutrition/items${qs ? `?${qs}` : ''}`)
  return res?.data || []
}

export async function fetchAdminDashboard() {
  const res = await api('/api/admin/dashboard')
  return res?.data || null
}
