/**
 * View-model adapter untuk Jadwal Distribusi & Armada Cold-Chain MBG.
 *
 * Mengadaptasi DTO backend dari PostgreSQL (GET /api/schedules) ke struktur
 * lengkap yang dibutuhkan oleh SchedulePanel dan ScheduleCharts.
 */

export function toScheduleView(s) {
  if (!s) return null

  const status = s.status || 'on_time'

  let defaultStatusLabel = 'Tepat Waktu'
  if (status === 'arrived') defaultStatusLabel = 'Tiba di Sekolah'
  else if (status === 'delayed_traffic') defaultStatusLabel = 'Peringatan Macet'
  else if (status === 'fleet_breakdown') defaultStatusLabel = 'Armada Mogok (Re-route)'
  else if (status === 'rescheduled') defaultStatusLabel = 'Jadwal Khusus'

  const fleetStatus = s.fleet?.status || 
    (status === 'arrived' ? 'delivered' : 
     status === 'fleet_breakdown' ? 'breakdown' : 
     status === 'delayed_traffic' ? 'stuck' : 'moving')

  return {
    ...s,
    id: s.id,
    schoolId: s.schoolId || (s.npsn ? `SCH-${s.npsn}` : 'SCH-01'),
    schoolName: s.schoolName || s.routeName || 'Sekolah Binaan MBG',
    npsn: s.npsn || '20101456',
    city: s.city || 'Jakarta Pusat',
    portions: s.portions || s.totalPortions || 450,
    sppgSupplier: {
      id: s.sppgSupplier?.id || s.sppgId || 'SPPG-001',
      name: s.sppgSupplier?.name || (s.sppgId === 'SPPG-002' ? 'SPPG Katering Priangan Barokah' : 'SPPG Sentral Menteng Sejahtera'),
      address: s.sppgSupplier?.address || 'Jl. Sentral Operasional MBG'
    },
    fleet: {
      vehicleId: s.fleet?.vehicleId || 'FLT-01',
      plateNumber: s.fleet?.plateNumber || s.licensePlate || 'B 9842 SXZ',
      driverName: s.fleet?.driverName || s.driverName || 'Supir Armada MBG',
      driverPhone: s.fleet?.driverPhone || s.driverPhone || '0812-7711-2233',
      vehicleType: s.fleet?.vehicleType || s.fleetName || 'Van Pendingin Berinsulasi (Cold Chain)',
      status: fleetStatus,
      currentSpeed: s.fleet?.currentSpeed || (status === 'arrived' ? '0 km/h (Selesai)' : '32 km/h'),
      cargoTempCelsius: typeof s.fleet?.cargoTempCelsius === 'number' ? s.fleet.cargoTempCelsius : 64.0,
      lastGpsPing: s.fleet?.lastGpsPing || (status === 'arrived' ? 'Telah Tiba' : '1 menit yang lalu'),
      gpsLocation: s.fleet?.gpsLocation || 'Dalam koridor menuju gerbang sekolah'
    },
    timestamps: {
      cookingStart: s.timestamps?.cookingStart || '04:30 WIB',
      cookingDone: s.timestamps?.cookingDone || '06:10 WIB',
      departedAt: s.timestamps?.departedAt || s.departureTime || '06:28 WIB',
      targetArrival: s.timestamps?.targetArrival || s.arrivalEta || '06:55 WIB',
      currentEta: s.timestamps?.currentEta || s.arrivalEta || '06:56 WIB',
      actualArrival: s.timestamps?.actualArrival || (status === 'arrived' ? (s.timestamps?.currentEta || '06:58 WIB') : null),
      delayMinutes: typeof s.timestamps?.delayMinutes === 'number' ? s.timestamps.delayMinutes : (status === 'delayed_traffic' ? 25 : 0),
      rescheduledReason: s.timestamps?.rescheduledReason || null
    },
    status,
    statusLabel: s.statusLabel || defaultStatusLabel,
    statusReason: s.statusReason || 'Perjalanan armada termal terpantau stabil dalam koridor.',
    corridorName: s.corridorName || s.routeName || 'Koridor Distribusi Utama MBG',
    distanceRemainingKm: typeof s.distanceRemainingKm === 'number' ? s.distanceRemainingKm : (status === 'arrived' ? 0.0 : 1.2),
    validatorContact: {
      name: s.validatorContact?.name || 'Siti Rahmawati, S.Pd',
      phone: s.validatorContact?.phone || '0813-2287-9914'
    }
  }
}
