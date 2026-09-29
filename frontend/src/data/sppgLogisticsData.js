/**
 * Data sesi armada & logistik dapur SPPG.
 * Merujuk SPPG.md Bab 5 dan sistem.md Bab 3.2.1: radius 45 menit,
 * suhu boks di atas 60C, tiba sebelum 07:15.
 *
 * Status armada, ETA, dan peringatan semuanya dihitung dari angka di bawah,
 * bukan ditulis manual.
 */

export const DEPOT = { lat: -6.1955, lng: 106.8305, name: 'Dapur SPPG-01 Menteng' }
export const LATEST_ARRIVAL = '07:15'
export const TEMP_FLOOR = 60
export const SLOW_KPH = 12

export const SCHOOL_COORDS = {
  'sch-01': { lat: -6.1882, lng: 106.8291 },
  'sch-02': { lat: -6.1998, lng: 106.8382 },
  'sch-03': { lat: -6.1755, lng: 106.8452 },
  'sch-04': { lat: -6.1905, lng: 106.8375 },
}

export const FLEETS = [
  {
    id: 'fl-01',
    plate: 'B-9281-KBA',
    type: 'Mobil boks insulasi termal',
    driver: '[Nama Sopir]',
    emergencyPhone: '0000-0000-0000',
    schoolId: 'sch-01',
    batchToken: 'MBG-2026-SPPG01-SDN01P-B01',
    boxCount: 650,
    distanceKm: 2.8,
    speedKph: 28,
    departAt: '06:45',
    progress: 0.62,
    status: 'jalan',
    boxTempC: 63.8,
    tempSeries: [
      { t: '06:45', temp: 64.2 },
      { t: '06:50', temp: 64.0 },
      { t: '06:55', temp: 63.9 },
      { t: '07:00', temp: 63.8 },
    ],
  },
  {
    id: 'fl-02',
    plate: 'B-9412-UBC',
    type: 'Mobil boks insulasi termal',
    driver: '[Nama Sopir]',
    emergencyPhone: '0000-0000-0000',
    schoolId: 'sch-02',
    batchToken: 'MBG-2026-SPPG01-SDN02-B01',
    boxCount: 550,
    distanceKm: 3.4,
    speedKph: 8,
    departAt: '06:45',
    progress: 0.3,
    status: 'macet',
    boxTempC: 62.4,
    tempSeries: [
      { t: '06:45', temp: 64.1 },
      { t: '06:50', temp: 63.5 },
      { t: '06:55', temp: 62.9 },
      { t: '07:00', temp: 62.4 },
    ],
  },
  {
    id: 'fl-03',
    plate: 'B-9033-TKA',
    type: 'Mobil boks insulasi termal',
    driver: '[Nama Sopir]',
    emergencyPhone: '0000-0000-0000',
    schoolId: 'sch-03',
    batchToken: 'MBG-2026-SPPG01-SMPN03-B02',
    boxCount: 750,
    distanceKm: 4.1,
    speedKph: 32,
    departAt: '06:47',
    progress: 0.55,
    status: 'jalan',
    boxTempC: 63.1,
    tempSeries: [
      { t: '06:47', temp: 64.0 },
      { t: '06:52', temp: 63.7 },
      { t: '06:57', temp: 63.4 },
      { t: '07:02', temp: 63.1 },
    ],
  },
  {
    id: 'fl-04',
    plate: 'B-9102-PKM',
    type: 'Motor roda tiga boks termal',
    driver: '[Nama Sopir]',
    emergencyPhone: '0000-0000-0000',
    schoolId: 'sch-04',
    batchToken: 'MBG-2026-SPPG01-SDN01C-B03',
    boxCount: 120,
    distanceKm: 4.8,
    speedKph: 0,
    departAt: '06:45',
    progress: 0.12,
    status: 'mogok',
    boxTempC: 61.2,
    tempSeries: [
      { t: '06:45', temp: 63.9 },
      { t: '06:50', temp: 63.0 },
      { t: '06:55', temp: 62.1 },
      { t: '07:00', temp: 61.2 },
    ],
  },
]

export const BACKUP_FLEET = {
  id: 'fl-99',
  plate: 'B-9777-CDG',
  type: 'Mobil boks insulasi termal cadangan',
  driver: '[Nama Sopir]',
  emergencyPhone: '0000-0000-0000',
  status: 'siaga',
}

function toMinutes(clock) {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

function toClock(minutes) {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

export function etaMinutes(fleet) {
  if (fleet.speedKph <= 0) return null
  const remaining = fleet.distanceKm * (1 - fleet.progress)
  return Math.round((remaining / fleet.speedKph) * 60)
}

export function arrivalClock(fleet, nowMinutes) {
  const eta = etaMinutes(fleet)
  if (eta === null) return 'belum bisa dihitung'
  return toClock(nowMinutes + eta)
}

export function isOnTime(fleet, nowMinutes) {
  const eta = etaMinutes(fleet)
  if (eta === null) return false
  return nowMinutes + eta <= toMinutes(LATEST_ARRIVAL)
}

export function tempOk(fleet) {
  return fleet.boxTempC > TEMP_FLOOR
}

export function fleetIssue(fleet) {
  if (fleet.status === 'mogok') return 'Mogok, tidak bergerak'
  if (fleet.status === 'macet' || fleet.speedKph < SLOW_KPH) return 'Melambat di bawah 12 km/jam'
  if (!tempOk(fleet)) return 'Suhu boks menyentuh batas 60C'
  return null
}

export function fleetPosition(fleet) {
  const dest = SCHOOL_COORDS[fleet.schoolId]
  if (!dest) return { lat: DEPOT.lat, lng: DEPOT.lng }
  return {
    lat: DEPOT.lat + (dest.lat - DEPOT.lat) * fleet.progress,
    lng: DEPOT.lng + (dest.lng - DEPOT.lng) * fleet.progress,
  }
}

export function notifyText(fleet, schoolName, nowMinutes) {
  return (
    `Armada ${fleet.plate} sedang menuju ${schoolName}, ` +
    `ETA tiba ${arrivalClock(fleet, nowMinutes)} WIB. ` +
    `Muatan ${fleet.boxCount} boks ${fleet.batchToken}, suhu boks ${fleet.boxTempC}C.`
  )
}
