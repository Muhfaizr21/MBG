/**
 * ==============================================================================
 * DATA REPOSITORI SEKOLAH BINAAN MBG (PANGKALAN DATA MASTER NPSN)
 * Berdasarkan Bab 3.2.1 Dokumen Spesifikasi Sistem MBG (Last-Mile Distribution)
 * ==============================================================================
 */

export const INITIAL_SCHOOLS_LIST = [
  {
    id: 'SCH-JKT-01',
    npsn: '20101456',
    name: 'SDN 01 Menteng Pagi',
    level: 'SD', // 'SD' | 'MI' | 'SMP' | 'MTs'
    status: 'active', // 'active' | 'temp_inactive' | 'radius_warning'
    statusLabel: 'Aktif Penuh',
    statusReason: 'Operasional normal, penerimaan porsi lancar setiap 06:55 WIB.',
    address: 'Jl. Besuki No. 4, RT.3/RW.5, Menteng, Jakarta Pusat, DKI Jakarta 10310',
    city: 'Jakarta Pusat',
    district: 'Kec. Menteng',
    coordinates: {
      lat: -6.198321,
      lng: 106.832742
    },
    principal: {
      name: 'Dra. Hj. Sri Wahyuni, M.Pd',
      nip: '19680412 199203 2 004',
      phone: '0812-9843-1102',
      email: 'sri.wahyuni@sdn01menteng.sch.id'
    },
    demographics: {
      lowerGrade: 210, // Kelas 1-3 (7-9 thn), standar 480 kkal
      upperGrade: 240, // Kelas 4-6 (10-12 thn), standar 550 kkal
      smpGrade: 0,     // Kelas 7-9 (13-15 thn), standar 650 kkal
      totalStudents: 450,
      totalCalorieTarget: 232800, // (210 * 480) + (240 * 550) = 100,800 + 132,000
      avgCaloriePerPortion: 517,
      allergiesCount: 6, // Alergi seafood / kacang
      dietaryNotes: '6 siswa bebas kacang & telur'
    },
    sppgSupplier: {
      id: 'SPPG-001',
      name: 'SPPG Sentral Menteng Sejahtera',
      type: 'Dapur Sentral Mandiri',
      address: 'Jl. Teuku Umar No. 18, Menteng',
      distanceKm: 3.4,
      transitMinutes: 18, // maks aman 30-45 menit
      transitStatus: 'safe', // 'safe' (<30) | 'moderate' (30-40) | 'critical' (>40)
      corridorRoute: 'Koridor Menteng - Cikini via Jl. Teuku Umar'
    },
    emergencyContacts: {
      principalPhone: '0812-9843-1102',
      uksCoordinatorName: 'Siti Rahmawati, S.Pd',
      uksPhone: '0813-2287-9914',
      referralClinic: 'Puskesmas Kecamatan Menteng',
      clinicAddress: 'Jl. Pegangsaan Barat No. 14, Menteng',
      clinicPhone: '021-3140523',
      ambulanceHotline: '119 / 021-3907722'
    },
    lastAuditDate: '26 Sep 2026',
    acceptanceRate: 99.4,
    avgArrivalTime: '06:55 WIB'
  },
  {
    id: 'SCH-BDG-02',
    npsn: '20219876',
    name: 'SMPN 2 Bandung Wetan',
    level: 'SMP',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    statusReason: 'Operasional normal jenjang SMP dengan porsi protein tinggi.',
    address: 'Jl. Citarum No. 12, Cihapit, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40114',
    city: 'Bandung',
    district: 'Kec. Bandung Wetan',
    coordinates: {
      lat: -6.907412,
      lng: 107.621987
    },
    principal: {
      name: 'Dr. H. Bambang Suherman, M.Si',
      nip: '19710315 199702 1 002',
      phone: '0811-2244-8891',
      email: 'bambang.suherman@smpn2bdg.sch.id'
    },
    demographics: {
      lowerGrade: 0,
      upperGrade: 0,
      smpGrade: 620, // 13-15 thn, standar 650 kkal, protein min 22g
      totalStudents: 620,
      totalCalorieTarget: 403000, // 620 * 650
      avgCaloriePerPortion: 650,
      allergiesCount: 11,
      dietaryNotes: '11 siswa bebas olahan susu & gluten'
    },
    sppgSupplier: {
      id: 'SPPG-002',
      name: 'SPPG Katering Priangan Barokah',
      type: 'Katering Rekanan Resmi',
      address: 'Jl. R.E. Martadinata No. 85, Cihapit',
      distanceKm: 5.1,
      transitMinutes: 24,
      transitStatus: 'safe',
      corridorRoute: 'Koridor Cihapit - Dago via Jl. Riau'
    },
    emergencyContacts: {
      principalPhone: '0811-2244-8891',
      uksCoordinatorName: 'Rina Kusuma Dewi, S.Pd',
      uksPhone: '0857-9912-3341',
      referralClinic: 'Puskesmas Garuda Bandung Wetan',
      clinicAddress: 'Jl. Cisangkuy No. 8, Bandung',
      clinicPhone: '022-7201944',
      ambulanceHotline: '119 / 022-4203333'
    },
    lastAuditDate: '25 Sep 2026',
    acceptanceRate: 98.7,
    avgArrivalTime: '07:05 WIB'
  },
  {
    id: 'SCH-SBY-03',
    npsn: '20532109',
    name: 'SMPN 1 Surabaya Pusat',
    level: 'SMP',
    status: 'radius_warning',
    statusLabel: 'Radius Waspada (38m)',
    statusReason: 'Waktu tempuh dari SPPG 38 menit akibat perbaikan jalur trem Wonokromo. Mendekati batas kritis 45 menit.',
    address: 'Jl. Pacar No. 4–6, Ketabang, Kec. Genteng, Kota Surabaya, Jawa Timur 60272',
    city: 'Surabaya',
    district: 'Kec. Genteng',
    coordinates: {
      lat: -7.258931,
      lng: 112.748312
    },
    principal: {
      name: 'Drs. Tri Joko Santoso, M.Pd',
      nip: '19671108 199301 1 003',
      phone: '0813-3398-1209',
      email: 'trijoko@smpn1surabaya.sch.id'
    },
    demographics: {
      lowerGrade: 0,
      upperGrade: 0,
      smpGrade: 710,
      totalStudents: 710,
      totalCalorieTarget: 461500, // 710 * 650
      avgCaloriePerPortion: 650,
      allergiesCount: 14,
      dietaryNotes: '14 siswa vegetarian & intoleransi laktosa'
    },
    sppgSupplier: {
      id: 'SPPG-003',
      name: 'SPPG Sentral Pahlawan Nutrisi',
      type: 'Dapur Sentral Mandiri',
      address: 'Jl. Wonokromo No. 112, Surabaya',
      distanceKm: 8.7,
      transitMinutes: 38,
      transitStatus: 'moderate',
      corridorRoute: 'Koridor Wonokromo - Genteng via Jl. Darmo'
    },
    emergencyContacts: {
      principalPhone: '0813-3398-1209',
      uksCoordinatorName: 'Agus Subekti, S.Pd.Jas',
      uksPhone: '0812-7765-4321',
      referralClinic: 'Puskesmas Ketabang Surabaya',
      clinicAddress: 'Jl. Jaksa Agung Suprapto No. 39, Surabaya',
      clinicPhone: '031-5341298',
      ambulanceHotline: '119 / 031-5034555'
    },
    lastAuditDate: '27 Sep 2026',
    acceptanceRate: 97.2,
    avgArrivalTime: '07:22 WIB'
  },
  {
    id: 'SCH-YGY-04',
    npsn: '20401122',
    name: 'SDN Percobaan 1 Sleman',
    level: 'SD',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    statusReason: 'Percontohan integrasi menu lokal daun kelor & susu pasteurisasi Merapi.',
    address: 'Jl. Gejayan, Condongcatur, Kec. Depok, Kabupaten Sleman, D.I. Yogyakarta 55283',
    city: 'Sleman',
    district: 'Kec. Depok',
    coordinates: {
      lat: -7.768124,
      lng: 110.392015
    },
    principal: {
      name: 'Siti Nurhaliza, S.Pd., M.Hum',
      nip: '19750520 199903 2 001',
      phone: '0818-0433-2211',
      email: 'siti.nurhaliza@sdnpercobaan1.sch.id'
    },
    demographics: {
      lowerGrade: 180,
      upperGrade: 200,
      smpGrade: 0,
      totalStudents: 380,
      totalCalorieTarget: 196400, // (180 * 480) + (200 * 550) = 86,400 + 110,000
      avgCaloriePerPortion: 517,
      allergiesCount: 4,
      dietaryNotes: '4 siswa alergi telur ayam ras'
    },
    sppgSupplier: {
      id: 'SPPG-004',
      name: 'SPPG Agro Mandiri Sleman',
      type: 'Dapur Sentral Mandiri',
      address: 'Jl. Kaliurang Km 9.5, Sleman',
      distanceKm: 4.8,
      transitMinutes: 19,
      transitStatus: 'safe',
      corridorRoute: 'Koridor Kaliurang - Ring Road Utara'
    },
    emergencyContacts: {
      principalPhone: '0818-0433-2211',
      uksCoordinatorName: 'Rahmat Hidayat, S.Pd',
      uksPhone: '0877-3890-1122',
      referralClinic: 'Puskesmas Depok III Sleman',
      clinicAddress: 'Jl. Ring Road Utara, Condongcatur, Sleman',
      clinicPhone: '0274-884102',
      ambulanceHotline: '119 / 0274-868437'
    },
    lastAuditDate: '24 Sep 2026',
    acceptanceRate: 99.8,
    avgArrivalTime: '06:48 WIB'
  },
  {
    id: 'SCH-JYP-05',
    npsn: '60300188',
    name: 'SD Inpres Kotaraja',
    level: 'SD',
    status: 'temp_inactive',
    statusLabel: 'Nonaktif Sementara',
    statusReason: 'Penonaktifan sementara alokasi MBG karena masa Ujian Tengah Semester Daring & renovasi UKS sekolah.',
    address: 'Jl. Raya Abepura, Kotaraja, Distrik Abepura, Kota Jayapura, Papua 99225',
    city: 'Jayapura',
    district: 'Distrik Abepura',
    coordinates: {
      lat: -2.597143,
      lng: 140.671822
    },
    principal: {
      name: 'Yohanes Kogoya, S.Pd',
      nip: '19790814 200501 1 007',
      phone: '0821-9877-6655',
      email: 'yohanes.k@sdinpreskotaraja.sch.id'
    },
    demographics: {
      lowerGrade: 140,
      upperGrade: 150,
      smpGrade: 0,
      totalStudents: 290,
      totalCalorieTarget: 149700, // (140 * 480) + (150 * 550) = 67,200 + 82,500
      avgCaloriePerPortion: 516,
      allergiesCount: 2,
      dietaryNotes: '2 siswa diet bebas gluten'
    },
    sppgSupplier: {
      id: 'SPPG-005',
      name: 'SPPG Cenderawasih Abepura',
      type: 'Dapur Sentral Mandiri',
      address: 'Jl. Raya Sentani No. 45, Abepura',
      distanceKm: 4.0,
      transitMinutes: 20,
      transitStatus: 'safe',
      corridorRoute: 'Koridor Sentani - Abepura Raya'
    },
    emergencyContacts: {
      principalPhone: '0821-9877-6655',
      uksCoordinatorName: 'Maria Wenda, A.Md.Keb',
      uksPhone: '0812-4889-0021',
      referralClinic: 'Puskesmas Kotaraja Abepura',
      clinicAddress: 'Jl. Gerilyawan No. 3, Kotaraja, Jayapura',
      clinicPhone: '0967-581290',
      ambulanceHotline: '119 / 0967-581118'
    },
    lastAuditDate: '20 Sep 2026',
    acceptanceRate: 98.1,
    avgArrivalTime: '07:10 WIB'
  },
  {
    id: 'SCH-MKS-06',
    npsn: '40305678',
    name: 'SMPN 5 Makassar',
    level: 'SMP',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    statusReason: 'Suplai protein ikan laut segar lokal dengan skor penerimaan gizi tinggi.',
    address: 'Jl. Sudirman No. 24, Sawerigading, Kec. Ujung Pandang, Kota Makassar, Sulawesi Selatan 90115',
    city: 'Makassar',
    district: 'Kec. Ujung Pandang',
    coordinates: {
      lat: -5.142875,
      lng: 119.412498
    },
    principal: {
      name: 'Hj. Nurhaeda, S.Pd., M.M',
      nip: '19700201 199412 2 001',
      phone: '0812-4211-9088',
      email: 'nurhaeda@smpn5mks.sch.id'
    },
    demographics: {
      lowerGrade: 0,
      upperGrade: 0,
      smpGrade: 580,
      totalStudents: 580,
      totalCalorieTarget: 377000, // 580 * 650
      avgCaloriePerPortion: 650,
      allergiesCount: 8,
      dietaryNotes: '8 siswa intoleransi cumi/udang'
    },
    sppgSupplier: {
      id: 'SPPG-006',
      name: 'SPPG Mariso Berkah Bahari',
      type: 'Katering Rekanan Resmi',
      address: 'Jl. Cendrawasih No. 56, Mariso',
      distanceKm: 3.8,
      transitMinutes: 21,
      transitStatus: 'safe',
      corridorRoute: 'Koridor Mariso - Ujung Pandang via Jl. Sudirman'
    },
    emergencyContacts: {
      principalPhone: '0812-4211-9088',
      uksCoordinatorName: 'Faisal Basri, S.Pd',
      uksPhone: '0852-9901-4478',
      referralClinic: 'Puskesmas Mappedeceng Makassar',
      clinicAddress: 'Jl. Mappedeceng No. 10, Makassar',
      clinicPhone: '0411-362145',
      ambulanceHotline: '119 / 0411-365111'
    },
    lastAuditDate: '26 Sep 2026',
    acceptanceRate: 99.1,
    avgArrivalTime: '07:00 WIB'
  },
  {
    id: 'SCH-MDN-07',
    npsn: '10204567',
    name: 'MIN 2 Medan Petisah',
    level: 'MI',
    status: 'active',
    statusLabel: 'Aktif Penuh',
    statusReason: 'Madrasah Ibtidaiyah binaan Kemenag terintegrasi skema MBG penuh.',
    address: 'Jl. Gajah Mada No. 18, Petisah Hulu, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20153',
    city: 'Medan',
    district: 'Kec. Medan Petisah',
    coordinates: {
      lat: 3.585214,
      lng: 98.665129
    },
    principal: {
      name: 'Drs. H. Syarifuddin Lubis, M.A',
      nip: '19690618 199503 1 002',
      phone: '0813-7055-6612',
      email: 'syarifuddin@min2medan.sch.id'
    },
    demographics: {
      lowerGrade: 190,
      upperGrade: 210,
      smpGrade: 0,
      totalStudents: 400,
      totalCalorieTarget: 206700, // (190 * 480) + (210 * 550) = 91,200 + 115,500
      avgCaloriePerPortion: 517,
      allergiesCount: 5,
      dietaryNotes: '5 siswa bebas udang & pewarna sintetis'
    },
    sppgSupplier: {
      id: 'SPPG-007',
      name: 'SPPG Deli Serdang Sentral',
      type: 'Dapur Sentral Mandiri',
      address: 'Jl. Medan - Lubuk Pakam Km 14.5',
      distanceKm: 6.2,
      transitMinutes: 28,
      transitStatus: 'safe',
      corridorRoute: 'Koridor Medan - Petisah via Jl. S. Parman'
    },
    emergencyContacts: {
      principalPhone: '0813-7055-6612',
      uksCoordinatorName: 'Aisyah Putri, S.Ag',
      uksPhone: '0821-6644-3321',
      referralClinic: 'Puskesmas Bestari Medan Petisah',
      clinicAddress: 'Jl. Rotan No. 2, Petisah Hulu, Medan',
      clinicPhone: '061-4512998',
      ambulanceHotline: '119 / 061-4531119'
    },
    lastAuditDate: '25 Sep 2026',
    acceptanceRate: 98.9,
    avgArrivalTime: '07:08 WIB'
  }
]

/**
 * Daftar opsi Dapur SPPG penyuplai untuk aksi pemindahan alokasi
 */
export const AVAILABLE_SPPG_ALTERNATIVES = [
  {
    id: 'SPPG-001',
    name: 'SPPG Sentral Menteng Sejahtera',
    city: 'Jakarta Pusat',
    remainingCapacity: 1200,
    address: 'Jl. Teuku Umar No. 18, Menteng'
  },
  {
    id: 'SPPG-002',
    name: 'SPPG Katering Priangan Barokah',
    city: 'Bandung',
    remainingCapacity: 850,
    address: 'Jl. R.E. Martadinata No. 85, Cihapit'
  },
  {
    id: 'SPPG-003',
    name: 'SPPG Sentral Pahlawan Nutrisi',
    city: 'Surabaya',
    remainingCapacity: 1400,
    address: 'Jl. Wonokromo No. 112, Surabaya'
  },
  {
    id: 'SPPG-004',
    name: 'SPPG Agro Mandiri Sleman',
    city: 'Sleman',
    remainingCapacity: 950,
    address: 'Jl. Kaliurang Km 9.5, Sleman'
  },
  {
    id: 'SPPG-005',
    name: 'SPPG Cenderawasih Abepura',
    city: 'Jayapura',
    remainingCapacity: 600,
    address: 'Jl. Raya Sentani No. 45, Abepura'
  },
  {
    id: 'SPPG-006',
    name: 'SPPG Mariso Berkah Bahari',
    city: 'Makassar',
    remainingCapacity: 1100,
    address: 'Jl. Cendrawasih No. 56, Mariso'
  },
  {
    id: 'SPPG-007',
    name: 'SPPG Deli Serdang Sentral',
    city: 'Medan',
    remainingCapacity: 1300,
    address: 'Jl. Medan - Lubuk Pakam Km 14.5'
  }
]

/**
 * Standar Acuan Gizi MBG per Jenjang Usia
 * Bab 3.2.1 Pedoman Gizi Nasional
 */
export const NUTRITION_STANDARDS = [
  {
    bracket: 'SD Kelas Bawah (7–9 Tahun)',
    gradeLevel: 'Kelas 1, 2, 3 SD / MI',
    calorieRange: '450 – 500 kkal',
    referenceCalorie: 480,
    proteinTarget: '15 – 18 gram',
    carbTarget: '65 – 70 gram',
    fatTarget: '15 – 18 gram',
    colorBadge: 'emerald'
  },
  {
    bracket: 'SD Kelas Atas (10–12 Tahun)',
    gradeLevel: 'Kelas 4, 5, 6 SD / MI',
    calorieRange: '550 kkal',
    referenceCalorie: 550,
    proteinTarget: '18 – 22 gram',
    carbTarget: '75 – 80 gram',
    fatTarget: '18 – 20 gram',
    colorBadge: 'blue'
  },
  {
    bracket: 'SMP / Remaja (13–15 Tahun)',
    gradeLevel: 'Kelas 7, 8, 9 SMP / MTs',
    calorieRange: '650 kkal',
    referenceCalorie: 650,
    proteinTarget: '22 – 26 gram',
    carbTarget: '85 – 95 gram',
    fatTarget: '20 – 24 gram',
    colorBadge: 'indigo'
  }
]
