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
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
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

export async function fetchSppgList() {
  const res = await api('/api/sppg')
  return res?.data || []
}

export async function fetchSppg(id) {
  const res = await api(`/api/sppg/${id}`)
  return res?.data || null
}

export async function fetchDeliveries() {
  const res = await api('/api/deliveries')
  return res?.data || []
}

export async function fetchCalendarDays() {
  const res = await api('/api/calendar')
  return res?.data || []
}

export async function fetchMenuPackages() {
  const res = await api('/api/menu-packages')
  return res?.data || []
}

export async function fetchSchedules() {
  const res = await api('/api/schedules')
  return res?.data || []
}

export async function fetchAttendances() {
  const res = await api('/api/attendance')
  return res?.data || []
}

export async function fetchNotices() {
  const res = await api('/api/notices')
  return res?.data || []
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

export async function fetchReports() {
  const res = await api('/api/reports')
  return res?.data || []
}

export async function fetchValidators() {
  const res = await api('/api/validators')
  return res?.data || []
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
