/**
 * View-model roster validator.
 * Backend (GET /api/validators) mengembalikan DTO yang jujur: hanya data yang
 * benar-benar ada di database. PanelValidator sudah punya UI yang lengkap, jadi
 * adaptor ini menerjemahkan DTO ke bentuk yang dipakai panel — dan mengisi
 * `null` untuk hal yang belum punya sumber data, supaya panel menampilkan
 * "tidak tercatat" alih-alih mengarang angka.
 *
 * Dipisah dari panel agar jelas mana data nyata dan mana placeholder.
 */

// Ambang durasi inspeksi visual (Juknis MBG Pasal 14), dalam detik.
export const MIN_INSPECTION_SEC = 0.2

const EMPTY = '—'

function text(value) {
  return value == null || value === '' ? EMPTY : String(value)
}

/** "08:15 WIB" dari timestamp ISO; dipakai baris riwayat pindai. */
function toWibTime(iso) {
  if (!iso) return EMPTY
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return EMPTY
  return (
    parsed.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }) + ' WIB'
  )
}

function toScanLogView(scan) {
  const seconds = scan.durationMs == null ? null : scan.durationMs / 1000
  const anomalous = seconds != null && seconds < MIN_INSPECTION_SEC
  return {
    id: scan.id,
    time: toWibTime(scan.createdAt),
    boxId: text(scan.boxId),
    menu: text(scan.reason),
    temp: scan.holdingTempC == null ? EMPTY : `${scan.holdingTempC.toFixed(1)}°C`,
    duration: seconds == null ? EMPTY : `${seconds.toFixed(2)}s`,
    status: anomalous ? 'anomalous' : 'valid',
    note: text(scan.verdict),
  }
}

/**
 * Menyesuaikan satu profil validator dari API ke bentuk yang dirender panel.
 * @param {object} profile DTO dari backend
 */
export function toValidatorView(profile) {
  const hasScans = profile.scansToday > 0
  return {
    ...profile,

    // Alias nama field supaya panel tidak perlu tahu nama kolom database.
    avgDuration: hasScans ? profile.avgDurationSec : 0,
    school: text(profile.schoolName),
    city: text(profile.schoolCity),
    lastScan: toWibTime(profile.lastScanAt),
    scanLogs: (profile.scanLogs || []).map(toScanLogView),

    // Platform perangkat diturunkan dari nama perangkat yang tercatat.
    hardware: /iphone|ipad|mac/i.test(profile.device)
      ? 'ios'
      : /pixel|android/i.test(profile.device)
        ? 'android'
        : 'lainnya',

    // Field berikut belum punya sumber data di backend — sengaja null agar
    // panel menampilkan "tidak tercatat", bukan angka hasil karangan.
    degree: null,
    osVersion: null,
    appVersion: null,
    battery: null,
    network: null,
    gpsCoords: null,
    geoDistance: null,
    geoStatus: null,
    attestationStatus: profile.deviceBound ? 'Perangkat terikat (device binding aktif)' : 'Belum terikat',
    dapodikVerified: null,
    studentBeneficiaries: null,
    schoolAccreditation: null,
    anomalyNotice: profile.warningCount
      ? `Teguran resmi: ${text(profile.lastWarningNote)}`
      : null,
  }
}

/** Menyesuaikan seluruh roster. */
export function toValidatorViews(profiles) {
  return (profiles || []).map(toValidatorView)
}