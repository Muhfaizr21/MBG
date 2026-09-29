/**
 * ==============================================================================
 * DATA JADWAL DISTRIBUSI & FLEET DISPATCH OPERATIONAL MBG
 * Berdasarkan Spesifikasi Bab 3.3.2 & Bab 4.2 Dokumen Juknis MBG
 * Jendela Waktu Baku:
 * 1. Sesi Masak Dapur: 04:30 – 06:15 WIB
 * 2. Pemberangkatan Armada: 06:30 WIB
 * 3. Jendela Kedatangan Wajib: 06:45 – 07:30 WIB (sebelum sarapan/bel masuk)
 * ==============================================================================
 */

export const DELIVERY_WINDOWS = {
  cooking: { label: 'Sesi Masak Dapur', start: '04:30', end: '06:15' },
  departure: { label: 'Pemberangkatan Armada', target: '06:30' },
  mandatoryArrival: { label: 'Jendela Kedatangan Wajib', start: '06:45', end: '07:30' },
  maxSafetyDeadline: '08:00' // Batas akhir sebelum penyesuaian jam belajar
}

export const INITIAL_SCHEDULE_LIST = [
  {
    id: 'SCHED-001',
    schoolId: 'SCH-JKT-01',
    schoolName: 'SDN 01 Menteng Pagi',
    npsn: '20101456',
    city: 'Jakarta Pusat',
    portions: 450,
    sppgSupplier: {
      id: 'SPPG-001',
      name: 'SPPG Sentral Menteng Sejahtera',
      address: 'Jl. Teuku Umar No. 18, Menteng'
    },
    fleet: {
      vehicleId: 'FLT-JKT-01',
      plateNumber: 'B 9842 SXZ',
      driverName: 'Hendra Setiawan',
      driverPhone: '0812-7711-2233',
      vehicleType: 'Van Pendingin Berinsulasi (Cold Chain)',
      status: 'moving', // 'moving' | 'stuck' | 'breakdown' | 'delivered'
      currentSpeed: '28 km/h',
      cargoTempCelsius: 64.2, // Hot insulated box
      lastGpsPing: '1 menit yang lalu',
      gpsLocation: 'Jl. Cikini Raya (800m menuju gerbang sekolah)'
    },
    timestamps: {
      cookingStart: '04:45 WIB',
      cookingDone: '06:10 WIB',
      departedAt: '06:28 WIB',
      targetArrival: '06:55 WIB',
      currentEta: '06:56 WIB',
      actualArrival: null,
      delayMinutes: 1, // On time
      rescheduledReason: null
    },
    status: 'on_time', // 'on_time' | 'arrived' | 'delayed_traffic' | 'fleet_breakdown' | 'rescheduled'
    statusLabel: 'Tepat Waktu',
    statusReason: 'Perjalanan lancar melalui Koridor Menteng - Cikini.',
    corridorName: 'Koridor Menteng - Cikini via Jl. Teuku Umar',
    distanceRemainingKm: 0.8,
    validatorContact: {
      name: 'Siti Rahmawati, S.Pd',
      phone: '0813-2287-9914'
    }
  },
  {
    id: 'SCHED-002',
    schoolId: 'SCH-BDG-02',
    schoolName: 'SMPN 2 Bandung Wetan',
    npsn: '20219876',
    city: 'Bandung',
    portions: 620,
    sppgSupplier: {
      id: 'SPPG-002',
      name: 'SPPG Katering Priangan Barokah',
      address: 'Jl. R.E. Martadinata No. 85, Cihapit'
    },
    fleet: {
      vehicleId: 'FLT-BDG-03',
      plateNumber: 'D 8124 AC',
      driverName: 'Asep Ridwan',
      driverPhone: '0819-3322-1144',
      vehicleType: 'Box Thermo Hybrid',
      status: 'delivered',
      currentSpeed: '0 km/h (Parkir)',
      cargoTempCelsius: 63.8,
      lastGpsPing: 'Telah Tiba',
      gpsLocation: 'Halaman Belakang UKS SMPN 2 Bandung'
    },
    timestamps: {
      cookingStart: '04:30 WIB',
      cookingDone: '06:05 WIB',
      departedAt: '06:25 WIB',
      targetArrival: '07:05 WIB',
      currentEta: '06:58 WIB',
      actualArrival: '06:58 WIB',
      delayMinutes: 0,
      rescheduledReason: null
    },
    status: 'arrived',
    statusLabel: 'Tiba di Sekolah',
    statusReason: 'Tiba 7 menit lebih cepat dari jadwal wajib. Telah serah terima validator.',
    corridorName: 'Koridor Cihapit - Dago via Jl. Riau',
    distanceRemainingKm: 0.0,
    validatorContact: {
      name: 'Rina Kusuma Dewi, S.Pd',
      phone: '0857-9912-3341'
    }
  },
  {
    id: 'SCHED-003',
    schoolId: 'SCH-SBY-03',
    schoolName: 'SMPN 1 Surabaya Pusat',
    npsn: '20532109',
    city: 'Surabaya',
    portions: 710,
    sppgSupplier: {
      id: 'SPPG-003',
      name: 'SPPG Sentral Pahlawan Nutrisi',
      address: 'Jl. Wonokromo No. 112, Surabaya'
    },
    fleet: {
      vehicleId: 'FLT-SBY-02',
      plateNumber: 'L 9012 XP',
      driverName: 'Bambang Sugiono',
      driverPhone: '0813-8899-7711',
      vehicleType: 'Box Cargo Termal Berinsulasi',
      status: 'stuck',
      currentSpeed: '6 km/h (Macet Padat)',
      cargoTempCelsius: 61.5,
      lastGpsPing: '2 menit yang lalu',
      gpsLocation: 'Pertigaan Darmo - Wonokromo (Antrean Padat)'
    },
    timestamps: {
      cookingStart: '04:35 WIB',
      cookingDone: '06:12 WIB',
      departedAt: '06:34 WIB',
      targetArrival: '07:15 WIB',
      currentEta: '07:44 WIB',
      actualArrival: null,
      delayMinutes: 29, // > 20 menit delay trigger
      rescheduledReason: null
    },
    status: 'delayed_traffic',
    statusLabel: 'Peringatan Macet (+29m)',
    statusReason: 'Tertahan proyek perbaikan jalur trem Wonokromo. Prediksi terlambat 29 menit melampaui jam 07:30 WIB.',
    corridorName: 'Koridor Wonokromo - Genteng via Jl. Darmo',
    distanceRemainingKm: 3.4,
    validatorContact: {
      name: 'Agus Subekti, S.Pd.Jas',
      phone: '0812-7765-4321'
    }
  },
  {
    id: 'SCHED-004',
    schoolId: 'SCH-YGY-04',
    schoolName: 'SDN Percobaan 1 Sleman',
    npsn: '20401122',
    city: 'Sleman',
    portions: 380,
    sppgSupplier: {
      id: 'SPPG-004',
      name: 'SPPG Agro Mandiri Sleman',
      address: 'Jl. Kaliurang Km 9.5, Sleman'
    },
    fleet: {
      vehicleId: 'FLT-YGY-01',
      plateNumber: 'AB 1290 KZ',
      driverName: 'Sigit Purnomo',
      driverPhone: '0878-1122-3344',
      vehicleType: 'Blind Van Insulated Eco',
      status: 'delivered',
      currentSpeed: '0 km/h (Selesai)',
      cargoTempCelsius: 65.0,
      lastGpsPing: 'Telah Tiba',
      gpsLocation: 'Lobby UKS SDN Percobaan 1 Sleman'
    },
    timestamps: {
      cookingStart: '04:30 WIB',
      cookingDone: '06:00 WIB',
      departedAt: '06:20 WIB',
      targetArrival: '06:45 WIB',
      currentEta: '06:42 WIB',
      actualArrival: '06:42 WIB',
      delayMinutes: 0,
      rescheduledReason: null
    },
    status: 'arrived',
    statusLabel: 'Tiba di Sekolah',
    statusReason: 'Tiba tepat waktu pada gelombang pertama kedatangan.',
    corridorName: 'Koridor Kaliurang - Ring Road Utara',
    distanceRemainingKm: 0.0,
    validatorContact: {
      name: 'Rahmat Hidayat, S.Pd',
      phone: '0877-3890-1122'
    }
  },
  {
    id: 'SCHED-005',
    schoolId: 'SCH-MKS-06',
    schoolName: 'SMPN 5 Makassar',
    npsn: '40305678',
    city: 'Makassar',
    portions: 580,
    sppgSupplier: {
      id: 'SPPG-006',
      name: 'SPPG Mariso Berkah Bahari',
      address: 'Jl. Cendrawasih No. 56, Mariso'
    },
    fleet: {
      vehicleId: 'FLT-MKS-04',
      plateNumber: 'DD 8841 XX',
      driverName: 'Daeng Rahmat',
      driverPhone: '0852-4411-2299',
      vehicleType: 'Box Termal Logistik',
      status: 'breakdown',
      currentSpeed: '0 km/h (Mogok)',
      cargoTempCelsius: 59.8,
      lastGpsPing: '3 menit yang lalu',
      gpsLocation: 'Jl. Haji Bau (Depan Rumah Jabatan Wagub) - Mesin Mati'
    },
    timestamps: {
      cookingStart: '04:40 WIB',
      cookingDone: '06:14 WIB',
      departedAt: '06:32 WIB',
      targetArrival: '07:00 WIB',
      currentEta: '07:55 WIB (Darurat)',
      actualArrival: null,
      delayMinutes: 55,
      rescheduledReason: null
    },
    status: 'fleet_breakdown',
    statusLabel: 'Armada Mogok (Re-route)',
    statusReason: 'Kendaraan katering mengalami kerusakan radiator mendadak di Jl. Haji Bau. Butuh pengiriman armada cadangan.',
    corridorName: 'Koridor Mariso - Ujung Pandang via Jl. Sudirman',
    distanceRemainingKm: 2.1,
    validatorContact: {
      name: 'Faisal Basri, S.Pd',
      phone: '0852-9901-4478'
    }
  },
  {
    id: 'SCHED-006',
    schoolId: 'SCH-MDN-07',
    schoolName: 'MIN 2 Medan Petisah',
    npsn: '10204567',
    city: 'Medan',
    portions: 400,
    sppgSupplier: {
      id: 'SPPG-007',
      name: 'SPPG Deli Serdang Sentral',
      address: 'Jl. Medan - Lubuk Pakam Km 14.5'
    },
    fleet: {
      vehicleId: 'FLT-MDN-02',
      plateNumber: 'BK 7721 DS',
      driverName: 'Zulkifli Nasution',
      driverPhone: '0821-5588-9900',
      vehicleType: 'Van Pendingin Berinsulasi',
      status: 'moving',
      currentSpeed: '36 km/h',
      cargoTempCelsius: 63.4,
      lastGpsPing: '1 menit yang lalu',
      gpsLocation: 'Jl. S. Parman (1.2 km menuju sekolah)'
    },
    timestamps: {
      cookingStart: '04:30 WIB',
      cookingDone: '06:08 WIB',
      departedAt: '06:30 WIB',
      targetArrival: '07:08 WIB',
      currentEta: '07:10 WIB',
      actualArrival: null,
      delayMinutes: 2,
      rescheduledReason: null
    },
    status: 'on_time',
    statusLabel: 'Tepat Waktu',
    statusReason: 'Perjalanan stabil dalam koridor utama kota Medan.',
    corridorName: 'Koridor Medan - Petisah via Jl. S. Parman',
    distanceRemainingKm: 1.2,
    validatorContact: {
      name: 'Aisyah Putri, S.Ag',
      phone: '0821-6644-3321'
    }
  },
  {
    id: 'SCHED-007',
    schoolId: 'SCH-JKT-08',
    schoolName: 'SDN 05 Tebet Timur',
    npsn: '20108871',
    city: 'Jakarta Selatan',
    portions: 420,
    sppgSupplier: {
      id: 'SPPG-001',
      name: 'SPPG Sentral Menteng Sejahtera',
      address: 'Jl. Teuku Umar No. 18, Menteng'
    },
    fleet: {
      vehicleId: 'FLT-JKT-05',
      plateNumber: 'B 9133 TKQ',
      driverName: 'Wahyu Hidayat',
      driverPhone: '0812-9900-4455',
      vehicleType: 'Box Thermo Hybrid',
      status: 'moving',
      currentSpeed: '32 km/h',
      cargoTempCelsius: 64.8,
      lastGpsPing: 'Baru saja',
      gpsLocation: 'Jl. Tebet Timur Dalam Raya'
    },
    timestamps: {
      cookingStart: '05:00 WIB',
      cookingDone: '06:30 WIB',
      departedAt: '06:45 WIB',
      targetArrival: '07:45 WIB',
      currentEta: '07:40 WIB',
      actualArrival: null,
      delayMinutes: 0,
      rescheduledReason: 'Penyesuaian Jadwal Hari Jumat (Senam Pagi Bersama 06:30 - 07:30 WIB)'
    },
    status: 'rescheduled',
    statusLabel: 'Jadwal Khusus (07:45)',
    statusReason: 'Jadwal dimundurkan resmi ke 07:45 WIB karena kegiatan senam kesegaran jasmani Jumat pagi.',
    corridorName: 'Koridor Menteng - Tebet via Manggarai',
    distanceRemainingKm: 1.5,
    validatorContact: {
      name: 'Dewi Lestari, S.Pd',
      phone: '0813-8899-0011'
    }
  }
]

/**
 * Armada Logistik Cadangan yang Siaga untuk Re-routing
 */
export const AVAILABLE_BACKUP_FLEETS = [
  {
    vehicleId: 'FLT-BCK-01',
    plateNumber: 'B 9901 RES',
    driverName: 'Teguh Prasetyo',
    phone: '0812-1188-7766',
    depotLocation: 'Pool Sentral Jakarta Pusat',
    standbyCity: 'Jakarta Pusat',
    capacityPortions: 800,
    etaToScene: '12 menit'
  },
  {
    vehicleId: 'FLT-BCK-02',
    plateNumber: 'D 8802 CAD',
    driverName: 'Ujang Sujana',
    phone: '0818-4455-6677',
    depotLocation: 'Pool Rekanan Priangan Bandung',
    standbyCity: 'Bandung',
    capacityPortions: 650,
    etaToScene: '15 menit'
  },
  {
    vehicleId: 'FLT-BCK-03',
    plateNumber: 'L 9903 SBY',
    driverName: 'Slamet Riyadi',
    phone: '0813-2211-9988',
    depotLocation: 'Pool Siaga Darmo Surabaya',
    standbyCity: 'Surabaya',
    capacityPortions: 900,
    etaToScene: '10 menit'
  },
  {
    vehicleId: 'FLT-BCK-04',
    plateNumber: 'DD 8804 MKS',
    driverName: 'Syamsul Bahri',
    phone: '0852-7788-9900',
    depotLocation: 'Pool Siaga Sudirman Makassar',
    standbyCity: 'Makassar',
    capacityPortions: 750,
    etaToScene: '8 menit'
  }
]
