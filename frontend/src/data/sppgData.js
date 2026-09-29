/**
 * ==============================================================================
 * REPOSITORI MASTER DATA DAPUR SPPG (SATUAN PELAYANAN PANGAN BERGIZI)
 * Standar: Perpres No. 83/2024, Juknis Pengawasan MBG RI, Standar SLHS Kemenkes
 * ==============================================================================
 */

export const INITIAL_SPPG_LIST = [
  {
    id: 'sppg-1',
    code: 'BGN-SPPG-001',
    name: 'SPPG Sentral Menteng 01',
    legalEntity: 'Satuan Pelayanan Pangan Mandiri BGN',
    type: 'sentral', // 'sentral' | 'rekanan'
    typeLabel: 'Dapur Sentral BGN',
    address: 'Jl. Pegangsaan Barat No. 14, Menteng',
    subdistrict: 'Menteng',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    cluster: 'Kluster Sentral DKI-01',
    coordinates: '-6.1983, 106.8450',
    manager: 'Chef Aris Munandar, A.Md.Par',
    managerNip: '19820514 200801 1 002',
    managerPhone: '+62 812-8821-4401',
    nutritionist: 'Nur Aini, S.Gz (Nutrisionis Terdaftar)',
    nutritionistStr: 'STR-GZ/2024/09881',
    staffCount: 38,
    kitchenArea: '520 m²',
    establishedYear: 2024,
    equipmentList: [
      '3x Combi Steamer Rational iCombi 20-Tray',
      '2x Tilting Bratt Pan 120L Stainless 316',
      '4x Blast Chiller / Freezer -35°C',
      '1x Automated Continuous Dishwasher Ozone',
      '1x Water Purification RO System 2.000 L/jam'
    ],
    fleetCount: 6,
    fleetType: 'Mobil Box Berpendingin (IoT Chiller 2-4°C / Food Warmer 65°C)',
    capacity: {
      maxDailyPortions: 3500,
      activeQuota: 2800,
      requestedQuota: 2800,
      utilizationPct: 80,
      safetyBufferPct: 20
    },
    assignedSchools: [
      { id: 'sch-1', name: 'SDN 01 Menteng Pagi', npsn: '33.210.130', portions: 480, distanceKm: 1.2, estMinutes: 12, dropTargetTime: '06:45 WIB', contactPerson: 'Dr. Hendra Prasetyo (0812-9901-2211)' },
      { id: 'sch-2', name: 'SDN 03 Cikini Pagi', npsn: '33.210.135', portions: 420, distanceKm: 2.1, estMinutes: 15, dropTargetTime: '06:55 WIB', contactPerson: 'Ibu Ratna Juwita, S.Pd' },
      { id: 'sch-3', name: 'SMPN 1 Jakarta Pusat', npsn: '33.210.142', portions: 650, distanceKm: 3.4, estMinutes: 20, dropTargetTime: '07:10 WIB', contactPerson: 'Drs. Supriyanto, M.Pd' },
      { id: 'sch-4', name: 'SDN Gondangdia 01', npsn: '33.210.148', portions: 530, distanceKm: 2.8, estMinutes: 18, dropTargetTime: '07:15 WIB', contactPerson: 'Bapak Mulyadi, S.Pd' },
      { id: 'sch-5', name: 'SMPN 8 Jakarta Pusat', npsn: '33.210.150', portions: 720, distanceKm: 4.1, estMinutes: 22, dropTargetTime: '07:22 WIB', contactPerson: 'Ibu Endang Sri Rahayu, M.Si' }
    ],
    scorecard: {
      safetyScore: 99.4, // % lolos skrining visual AI YOLOv8
      coldChainScore: 98.7, // % kepatuhan suhu armada
      timelinessScore: 99.6, // % ketepatan tiba < 07:30 WIB
      compositeScore: 99.2,
      grade: 'A+',
      compliance7Days: [99.2, 98.9, 99.5, 99.1, 99.6, 99.3, 99.2],
      weeklyTrend: '+0.4%'
    },
    certificates: {
      slhs: {
        status: 'valid', // 'valid' | 'expiring' | 'expired' | 'pending'
        number: 'SLHS-DKI/DINKES/2025/0842',
        issuer: 'Dinas Kesehatan Prov. DKI Jakarta',
        validUntil: '2027-11-20',
        daysLeft: 418,
        inspectionScore: 96,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'valid',
        number: 'HACCP-BGN-CERT/2025/1109',
        grade: 'Grade A (Sangat Baik)',
        issuer: 'Komite Akreditasi Nasional (KAN)',
        validUntil: '2026-12-15',
        daysLeft: 78
      },
      halal: {
        status: 'valid',
        number: 'ID0041000192837',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Liwet Rempah, Ayam Panggang Madu, Tempe Bacem, Sayur Bening Bayam, Buah Jeruk Manis',
      tkpiStatus: 'COMPLIANT', // 'COMPLIANT' | 'WARNING' | 'VIOLATION'
      avgDeviationPct: 1.2,
      targetCalories: 645,
      actualCalories: 641,
      targetProteinG: 34,
      actualProteinG: 34.6,
      targetCarbsG: 68,
      actualCarbsG: 67.2,
      targetFatG: 14,
      actualFatG: 13.8,
      items: [
        { name: 'Nasi Beras Pulen (Karbohidrat)', targetGram: 150, actualGram: 148, devPct: -1.3, standardCode: 'TKPI A-01', status: 'optimal' },
        { name: 'Ayam Fillet Madu (Protein Hewani)', targetGram: 75, actualGram: 76, devPct: +1.3, standardCode: 'TKPI B-04', status: 'optimal' },
        { name: 'Tempe Bacem Tradisional (Protein Nabati)', targetGram: 50, actualGram: 50, devPct: 0.0, standardCode: 'TKPI C-02', status: 'optimal' },
        { name: 'Sayur Bayam & Jagung Manis (Serat & Vit)', targetGram: 100, actualGram: 98, devPct: -2.0, standardCode: 'TKPI D-08', status: 'optimal' },
        { name: 'Jeruk Manis Segar Lokal (Vit C & Antioksidan)', targetGram: 100, actualGram: 102, devPct: +2.0, standardCode: 'TKPI E-03', status: 'optimal' }
      ]
    },
    status: 'active', // 'active' | 'warning' | 'suspended' | 'quota_restricted'
    statusNote: 'Operasional Prima • Terverifikasi Sertifikasi Penuh',
    warningLetters: [],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '20 Sep 2026',
      salmonella: 'Negatif / 25g (Lolos)',
      ecoli: '< 3 APM/g (Lolos Standar BPOM)',
      laboratory: 'Balai Besar Laboratorium Kesehatan (BBLK) Jakarta'
    },
    recentDispatchLogs: [
      { time: '06:30', armada: 'ARM-01 (B-9021-PQU)', temp: '62.4°C', route: 'Rute Menteng 1', status: 'Tiba Tepat Waktu (06:45)' },
      { time: '06:40', armada: 'ARM-02 (B-9022-PQU)', temp: '61.8°C', route: 'Rute Cikini', status: 'Tiba Tepat Waktu (06:55)' },
      { time: '06:50', armada: 'ARM-03 (B-9023-PQU)', temp: '63.0°C', route: 'Rute SMPN 1', status: 'Tiba Tepat Waktu (07:10)' }
    ]
  },
  {
    id: 'sppg-2',
    code: 'BGN-SPPG-004',
    name: 'Dapur Katering Berkah Gizi Mandiri',
    legalEntity: 'PT Berkah Gizi Mandiri Nusantara (Mitra Rekanan)',
    type: 'rekanan',
    typeLabel: 'Katering Rekanan Swasta',
    address: 'Jl. R.E. Martadinata No. 88, Cihapit',
    subdistrict: 'Bandung Wetan',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    cluster: 'Kluster Bandung Raya B-02',
    coordinates: '-6.9110, 107.6189',
    manager: 'Hj. Dewi Sulistiawati, S.T',
    managerNip: 'MITRA-BDG-2024-041',
    managerPhone: '+62 813-2210-9904',
    nutritionist: 'Siti Sarah Fitriani, S.Gz',
    nutritionistStr: 'STR-GZ/2023/11029',
    staffCount: 26,
    kitchenArea: '380 m²',
    establishedYear: 2023,
    equipmentList: [
      '2x Rational Combi Steamer 20-Tray',
      '2x Wok Cooker Gas High-Pressure 100L',
      '3x Chiller Box Multi-Compartment 4°C',
      '1x Sanitizer UVC Box Peralatan Makan',
      '1x Water Filtration Multi-Stage'
    ],
    fleetCount: 4,
    fleetType: 'Mobil Box Isothermal dengan Data Logger Suhu Digital',
    capacity: {
      maxDailyPortions: 2200,
      activeQuota: 1750,
      requestedQuota: 1750,
      utilizationPct: 80,
      safetyBufferPct: 20
    },
    assignedSchools: [
      { id: 'sch-6', name: 'SMPN 2 Bandung Wetan', npsn: '33.210.131', portions: 580, distanceKm: 1.8, estMinutes: 14, dropTargetTime: '06:50 WIB', contactPerson: 'Siti Nurhaliza, S.Pd (0813-8812-4411)' },
      { id: 'sch-7', name: 'SDN Ciujung 01', npsn: '33.210.160', portions: 490, distanceKm: 2.4, estMinutes: 16, dropTargetTime: '07:05 WIB', contactPerson: 'Ibu Nenden Kurniawati, S.Pd' },
      { id: 'sch-8', name: 'SMPN 5 Bandung', npsn: '33.210.164', portions: 680, distanceKm: 3.1, estMinutes: 19, dropTargetTime: '07:18 WIB', contactPerson: 'Bapak Ahmad Sobari, M.M' }
    ],
    scorecard: {
      safetyScore: 98.8,
      coldChainScore: 97.4,
      timelinessScore: 99.1,
      compositeScore: 98.4,
      grade: 'A',
      compliance7Days: [98.5, 98.2, 98.9, 98.0, 98.6, 98.4, 98.4],
      weeklyTrend: '+0.2%'
    },
    certificates: {
      slhs: {
        status: 'valid',
        number: 'SLHS-JBR/DINKES-BDG/2025/0411',
        issuer: 'Dinas Kesehatan Kota Bandung',
        validUntil: '2027-08-14',
        daysLeft: 320,
        inspectionScore: 94,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'valid',
        number: 'HACCP-BGN-CERT/2025/1190',
        grade: 'Grade A',
        issuer: 'Sucofindo International Certification',
        validUntil: '2027-01-10',
        daysLeft: 104
      },
      halal: {
        status: 'valid',
        number: 'ID3211000881923',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Kuning Harum, Ikan Kembung Bakar Kunyit, Sayur Urap Kelapa, Tahu Bacem, Buah Semangka Merah',
      tkpiStatus: 'COMPLIANT',
      avgDeviationPct: 1.8,
      targetCalories: 630,
      actualCalories: 625,
      targetProteinG: 32,
      actualProteinG: 32.8,
      targetCarbsG: 66,
      actualCarbsG: 65.1,
      targetFatG: 13,
      actualFatG: 12.9,
      items: [
        { name: 'Nasi Kuning Santan Encer (Karbohidrat)', targetGram: 150, actualGram: 147, devPct: -2.0, standardCode: 'TKPI A-02', status: 'optimal' },
        { name: 'Ikan Kembung Bakar (Protein Hewani Omega-3)', targetGram: 80, actualGram: 81, devPct: +1.2, standardCode: 'TKPI B-08', status: 'optimal' },
        { name: 'Tahu Kuning Ungkep (Protein Nabati)', targetGram: 50, actualGram: 49, devPct: -2.0, standardCode: 'TKPI C-01', status: 'optimal' },
        { name: 'Sayur Urap Daun Singkong & Tauge (Serat)', targetGram: 100, actualGram: 97, devPct: -3.0, standardCode: 'TKPI D-12', status: 'optimal' },
        { name: 'Semangka Manis Iris (Hidrasi & Vitamin)', targetGram: 100, actualGram: 101, devPct: +1.0, standardCode: 'TKPI E-07', status: 'optimal' }
      ]
    },
    status: 'active',
    statusNote: 'Kepatuhan Operasional Terpenuhi',
    warningLetters: [],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '18 Sep 2026',
      salmonella: 'Negatif / 25g',
      ecoli: '< 3 APM/g',
      laboratory: 'Labkesda Jawa Barat'
    },
    recentDispatchLogs: [
      { time: '06:35', armada: 'ARM-01 (D-8120-GH)', temp: '61.2°C', route: 'Rute SMPN 2', status: 'Tiba Tepat Waktu (06:50)' },
      { time: '06:48', armada: 'ARM-02 (D-8121-GH)', temp: '60.5°C', route: 'Rute Ciujung', status: 'Tiba Tepat Waktu (07:05)' }
    ]
  },
  {
    id: 'sppg-3',
    code: 'BGN-SPPG-002',
    name: 'SPPG Sentral Sleman Madani',
    legalEntity: 'Satuan Pelayanan Pangan Mandiri BGN Sleman',
    type: 'sentral',
    typeLabel: 'Dapur Sentral BGN',
    address: 'Jl. Magelang Km 9.5, Tridadi',
    subdistrict: 'Sleman',
    city: 'D.I. Yogyakarta',
    province: 'D.I. Yogyakarta',
    cluster: 'Kluster Sleman-Yogyakarta',
    coordinates: '-7.7123, 110.3541',
    manager: 'Bambang Sugeng, S.T., M.Sc',
    managerNip: '19780819 200501 1 004',
    managerPhone: '+62 811-2541-002',
    nutritionist: 'Dra. Anisa Kusuma, M.Gizi',
    nutritionistStr: 'STR-GZ/2021/00492',
    staffCount: 34,
    kitchenArea: '490 m²',
    establishedYear: 2024,
    equipmentList: [
      '3x Industrial Combi Steamer 20-Tray',
      '2x Automated Continuous Rice Washer & Cooker',
      '4x Quick-Chiller Compartment',
      '1x Reverse Osmosis Water Plant',
      '1x Thermal Tunnel Dish Sanitizer'
    ],
    fleetCount: 5,
    fleetType: 'Truk Box Berpendingin Sensor IoT LoRaWAN',
    capacity: {
      maxDailyPortions: 3000,
      activeQuota: 2600,
      requestedQuota: 2600,
      utilizationPct: 87,
      safetyBufferPct: 13
    },
    assignedSchools: [
      { id: 'sch-9', name: 'SDN Percobaan 1 Sleman', npsn: '33.210.132', portions: 350, distanceKm: 2.3, estMinutes: 12, dropTargetTime: '06:45 WIB', contactPerson: 'Ahmad Fauzi, M.Pd (0812-4412-8899)' },
      { id: 'sch-10', name: 'SMPN 1 Sleman', npsn: '33.210.170', portions: 720, distanceKm: 3.2, estMinutes: 16, dropTargetTime: '07:00 WIB', contactPerson: 'Ibu Sri Handayani, M.Pd' },
      { id: 'sch-11', name: 'SDN Tridadi 02', npsn: '33.210.172', portions: 410, distanceKm: 1.5, estMinutes: 10, dropTargetTime: '07:10 WIB', contactPerson: 'Bapak Triyono, S.Pd' },
      { id: 'sch-12', name: 'SMPN 2 Mlati', npsn: '33.210.175', portions: 680, distanceKm: 4.8, estMinutes: 20, dropTargetTime: '07:20 WIB', contactPerson: 'Drs. Subagyo' },
      { id: 'sch-13', name: 'SDN Denggung', npsn: '33.210.178', portions: 440, distanceKm: 2.7, estMinutes: 14, dropTargetTime: '07:25 WIB', contactPerson: 'Ibu Wahyuni, S.Pd' }
    ],
    scorecard: {
      safetyScore: 99.6,
      coldChainScore: 99.2,
      timelinessScore: 99.8,
      compositeScore: 99.5,
      grade: 'A+',
      compliance7Days: [99.6, 99.5, 99.8, 99.2, 99.7, 99.4, 99.5],
      weeklyTrend: '+0.1%'
    },
    certificates: {
      slhs: {
        status: 'valid',
        number: 'SLHS-DIY/DINKES-SLM/2025/0199',
        issuer: 'Dinas Kesehatan Kab. Sleman',
        validUntil: '2028-02-10',
        daysLeft: 500,
        inspectionScore: 98,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'valid',
        number: 'HACCP-BGN-CERT/2025/1042',
        grade: 'Grade A+ (Unggul)',
        issuer: 'TÜV Rheinland Indonesia',
        validUntil: '2027-04-18',
        daysLeft: 202
      },
      halal: {
        status: 'valid',
        number: 'ID3411000291044',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Merah Organik, Empal Daging Gepuk, Buncis Wortel Jagung, Tahu Goreng Gurih, Buah Pisang Mas',
      tkpiStatus: 'COMPLIANT',
      avgDeviationPct: 0.9,
      targetCalories: 650,
      actualCalories: 648,
      targetProteinG: 36,
      actualProteinG: 36.2,
      targetCarbsG: 66,
      actualCarbsG: 65.8,
      targetFatG: 15,
      actualFatG: 14.7,
      items: [
        { name: 'Nasi Beras Merah Lokal (Karbohidrat Kompleks)', targetGram: 150, actualGram: 149, devPct: -0.7, standardCode: 'TKPI A-03', status: 'optimal' },
        { name: 'Empal Daging Sapi Lulur (Protein Hewani Fe)', targetGram: 70, actualGram: 71, devPct: +1.4, standardCode: 'TKPI B-01', status: 'optimal' },
        { name: 'Tahu Sutra Kedelai Lokal (Protein Nabati)', targetGram: 50, actualGram: 50, devPct: 0.0, standardCode: 'TKPI C-01', status: 'optimal' },
        { name: 'Tumis Buncis, Wortel, & Jagung Manis', targetGram: 100, actualGram: 100, devPct: 0.0, standardCode: 'TKPI D-05', status: 'optimal' },
        { name: 'Pisang Mas Matang Pohon (Kalium & Energi)', targetGram: 100, actualGram: 101, devPct: +1.0, standardCode: 'TKPI E-01', status: 'optimal' }
      ]
    },
    status: 'active',
    statusNote: 'Dapur Model Percontohan Nasional MBG',
    warningLetters: [],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '22 Sep 2026',
      salmonella: 'Negatif / 25g',
      ecoli: '< 3 APM/g',
      laboratory: 'Balai Laboratorium Kesehatan Yogyakarta'
    },
    recentDispatchLogs: [
      { time: '06:30', armada: 'ARM-01 (AB-1102-XY)', temp: '63.5°C', route: 'Rute SDN Percobaan 1', status: 'Tiba Tepat Waktu (06:45)' },
      { time: '06:42', armada: 'ARM-02 (AB-1103-XY)', temp: '62.8°C', route: 'Rute SMPN 1 Sleman', status: 'Tiba Tepat Waktu (07:00)' }
    ]
  },
  {
    id: 'sppg-4',
    code: 'BGN-SPPG-007',
    name: 'Dapur Katering Surya Boga Nusantara',
    legalEntity: 'CV Surya Boga Nusantara (Mitra Rekanan)',
    type: 'rekanan',
    typeLabel: 'Katering Rekanan Swasta',
    address: 'Jl. Kusuma Bangsa No. 112, Tambaksari',
    subdistrict: 'Tambaksari',
    city: 'Kota Surabaya',
    province: 'Jawa Timur',
    cluster: 'Kluster Surabaya Sentral C-01',
    coordinates: '-7.2512, 112.7533',
    manager: 'Ir. Hendro Wicaksono',
    managerNip: 'MITRA-SBY-2024-088',
    managerPhone: '+62 812-3091-8844',
    nutritionist: 'Bagus Prasetya, A.Md.Gz (Nutrisionis)',
    nutritionistStr: 'STR-GZ/2023/07718',
    staffCount: 22,
    kitchenArea: '310 m²',
    establishedYear: 2024,
    equipmentList: [
      '1x Combi Steamer 20-Tray',
      '3x Wok Gas Standar',
      '2x Chiller Standar (Sering Fluktuasi)',
      '1x Dishwasher Manual 3 Sink'
    ],
    fleetCount: 3,
    fleetType: 'Mobil Box Standar (Tanpa Unit Pendingin Aktif - Menggunakan Insulated Box)',
    capacity: {
      maxDailyPortions: 2000,
      activeQuota: 1850,
      requestedQuota: 1850,
      utilizationPct: 92,
      safetyBufferPct: 8
    },
    assignedSchools: [
      { id: 'sch-14', name: 'SMPN 1 Surabaya Pusat', npsn: '33.210.133', portions: 650, distanceKm: 4.2, estMinutes: 24, dropTargetTime: '07:15 WIB', contactPerson: 'Dewi Lestari, S.Kom (0812-7711-2299)' },
      { id: 'sch-15', name: 'SDN Ketabang 01', npsn: '33.210.180', portions: 520, distanceKm: 3.5, estMinutes: 20, dropTargetTime: '07:20 WIB', contactPerson: 'Bapak Hariyanto, S.Pd' },
      { id: 'sch-16', name: 'SDN Tambaksari 03', npsn: '33.210.182', portions: 680, distanceKm: 2.1, estMinutes: 14, dropTargetTime: '07:28 WIB', contactPerson: 'Ibu Kusuma Wardani, S.Pd' }
    ],
    scorecard: {
      safetyScore: 81.2, // Rapor Merah: <85%
      coldChainScore: 78.4, // Suhu armada drop 3x di bawah 50°C
      timelinessScore: 84.8, // 3x tiba terlambat > 07:35 WIB
      compositeScore: 81.4, // < 85% dalam 7 hari berturut-turut!
      grade: 'SP-1',
      compliance7Days: [82.0, 80.5, 83.1, 79.8, 81.2, 84.0, 81.4],
      weeklyTrend: '-4.6%'
    },
    certificates: {
      slhs: {
        status: 'valid',
        number: 'SLHS-JTM/DINKES-SBY/2024/0912',
        issuer: 'Dinas Kesehatan Kota Surabaya',
        validUntil: '2026-10-25',
        daysLeft: 27, // Segera Kadaluarsa!
        inspectionScore: 81,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'audit_pending',
        number: 'HACCP-PROV/REV-2026/044',
        grade: 'Audit Perbaikan (C)',
        issuer: 'Lembaga Sertifikasi Pangan Jatim',
        validUntil: '2026-11-01',
        daysLeft: 34
      },
      halal: {
        status: 'valid',
        number: 'ID3511000912833',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Putih Pulen, Opor Ayam Kampung, Tahu Tempe Bacem, Sayur Labu Siam, Buah Semangka',
      tkpiStatus: 'VIOLATION', // Ditemukan pengurangan porsi gramatur!
      avgDeviationPct: -8.4,
      targetCalories: 640,
      actualCalories: 585, // Defisit 55 kkal!
      targetProteinG: 34,
      actualProteinG: 27.2, // Ayam dipotong terlalu kecil!
      targetCarbsG: 68,
      actualCarbsG: 64.0,
      targetFatG: 14,
      actualFatG: 12.0,
      items: [
        { name: 'Nasi Putih Pulen (Karbohidrat)', targetGram: 150, actualGram: 142, devPct: -5.3, standardCode: 'TKPI A-01', status: 'warning' },
        { name: 'Ayam Potong Opor (Protein Hewani)', targetGram: 75, actualGram: 58, devPct: -22.7, standardCode: 'TKPI B-04', status: 'violation' },
        { name: 'Tahu Tempe Bacem (Protein Nabati)', targetGram: 50, actualGram: 46, devPct: -8.0, standardCode: 'TKPI C-02', status: 'warning' },
        { name: 'Sayur Labu Siam Kuah (Serat)', targetGram: 100, actualGram: 88, devPct: -12.0, standardCode: 'TKPI D-03', status: 'violation' },
        { name: 'Semangka Potong (Vitamin C)', targetGram: 100, actualGram: 90, devPct: -10.0, standardCode: 'TKPI E-07', status: 'warning' }
      ]
    },
    status: 'warning', // Memenuhi syarat penerbitan SP-1
    statusNote: 'Kepatuhan < 85% dalam 7 Hari Berturut-turut • Anomali Gramatur Daging Ayam',
    warningLetters: [
      {
        id: 'sp-doc-01',
        type: 'SP-1',
        letterNumber: 'BGN/SP-1/MBG/IX/2026/014',
        issuedDate: '26 Sep 2026',
        reason: 'Pelanggaran batas kepatuhan rata-rata 7 hari (<85%), anomali gramatur protein hewani -22.7%, dan fluktuasi suhu cold-chain.',
        deadlineDate: '29 Sep 2026 (3 Hari Kerja)',
        status: 'Menunggu Tanggapan / Rencana Aksi Korektif',
        signedBy: 'Dr. Hendra Prasetyo (Satgas MBG Pusat)'
      }
    ],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '15 Sep 2026',
      salmonella: 'Negatif / 25g',
      ecoli: '11 APM/g (Batas Ambang Atas)',
      laboratory: 'BBLK Surabaya'
    },
    recentDispatchLogs: [
      { time: '06:50', armada: 'ARM-01 (L-9114-AB)', temp: '48.2°C (Waspada)', route: 'Rute SMPN 1', status: 'Terlambat (07:38 WIB)' },
      { time: '07:05', armada: 'ARM-02 (L-9115-AB)', temp: '47.5°C (Waspada)', route: 'Rute Ketabang', status: 'Tepat Waktu (07:25 WIB)' }
    ]
  },
  {
    id: 'sppg-5',
    code: 'BGN-SPPG-010',
    name: 'SPPG Sentral Tamalate Bahari',
    legalEntity: 'Satuan Pelayanan Pangan Mandiri BGN Makassar',
    type: 'sentral',
    typeLabel: 'Dapur Sentral BGN',
    address: 'Jl. Sultan Alauddin No. 240, Pa\'baeng-baeng',
    subdistrict: 'Tamalate',
    city: 'Kota Makassar',
    province: 'Sulawesi Selatan',
    cluster: 'Kluster Makassar Selatan',
    coordinates: '-5.1782, 119.4290',
    manager: 'Drs. Syamsuddin Dg. Rewa',
    managerNip: '19810411 200701 1 005',
    managerPhone: '+62 852-4411-9011',
    nutritionist: 'Fatimah Az-Zahra, S.Gz',
    nutritionistStr: 'STR-GZ/2022/04119',
    staffCount: 30,
    kitchenArea: '440 m²',
    establishedYear: 2024,
    equipmentList: [
      '2x Rational Combi Steamer 20-Tray',
      '2x Tilting Boiling Pan 150L',
      '3x Blast Chiller Sanitized',
      '1x Automated Water Treatment Unit'
    ],
    fleetCount: 4,
    fleetType: 'Mobil Box Berpendingin Termal IoT 4G',
    capacity: {
      maxDailyPortions: 2500,
      activeQuota: 1800,
      requestedQuota: 1800,
      utilizationPct: 72,
      safetyBufferPct: 28
    },
    assignedSchools: [
      { id: 'sch-17', name: 'SDN Kompleks IKIP Makassar', npsn: '33.210.134', portions: 320, distanceKm: 2.1, estMinutes: 14, dropTargetTime: '06:50 WITA', contactPerson: 'Budi Santoso, S.Pd (0811-4402-9911)' },
      { id: 'sch-18', name: 'SMPN 3 Makassar', npsn: '33.210.190', portions: 740, distanceKm: 3.8, estMinutes: 20, dropTargetTime: '07:10 WITA', contactPerson: 'Hj. Syamsiah, M.Pd' },
      { id: 'sch-19', name: 'SD Inpres Jongaya', npsn: '33.210.192', portions: 440, distanceKm: 1.9, estMinutes: 12, dropTargetTime: '07:18 WITA', contactPerson: 'Bapak Mansyur, S.Pd' },
      { id: 'sch-20', name: 'SDN Pa\'baeng-baeng 01', npsn: '33.210.194', portions: 300, distanceKm: 1.1, estMinutes: 8, dropTargetTime: '07:25 WITA', contactPerson: 'Ibu Mardiana, S.Pd' }
    ],
    scorecard: {
      safetyScore: 97.2,
      coldChainScore: 96.5,
      timelinessScore: 98.4,
      compositeScore: 97.4,
      grade: 'B+',
      compliance7Days: [97.0, 97.5, 96.8, 97.9, 97.1, 98.0, 97.4],
      weeklyTrend: '+0.5%'
    },
    certificates: {
      slhs: {
        status: 'expiring', // Segera berakhir dalam 18 hari!
        number: 'SLHS-SLS/DINKES-MKS/2024/0201',
        issuer: 'Dinas Kesehatan Kota Makassar',
        validUntil: '2026-10-16',
        daysLeft: 18,
        inspectionScore: 89,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'valid',
        number: 'HACCP-BGN-CERT/2025/1240',
        grade: 'Grade B (Baik)',
        issuer: 'KAN Lembaga Akreditasi Mutu',
        validUntil: '2027-03-20',
        daysLeft: 173
      },
      halal: {
        status: 'valid',
        number: 'ID7311000184491',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Putih Pulen, Coto Daging Sapi Makassar (Kuah Terpisah), Tempe Mendoan, Sayur Buncis Wortel, Buah Semangka',
      tkpiStatus: 'COMPLIANT',
      avgDeviationPct: 1.6,
      targetCalories: 640,
      actualCalories: 635,
      targetProteinG: 35,
      actualProteinG: 34.8,
      targetCarbsG: 65,
      actualCarbsG: 64.5,
      targetFatG: 15,
      actualFatG: 14.8,
      items: [
        { name: 'Nasi Putih Pulen (Karbohidrat)', targetGram: 150, actualGram: 148, devPct: -1.3, standardCode: 'TKPI A-01', status: 'optimal' },
        { name: 'Daging Sapi Olah Coto (Protein Hewani)', targetGram: 75, actualGram: 74, devPct: -1.3, standardCode: 'TKPI B-01', status: 'optimal' },
        { name: 'Tempe Goreng Tepung (Protein Nabati)', targetGram: 50, actualGram: 51, devPct: +2.0, standardCode: 'TKPI C-02', status: 'optimal' },
        { name: 'Sayur Buncis & Wortel Rebus (Serat)', targetGram: 100, actualGram: 98, devPct: -2.0, standardCode: 'TKPI D-05', status: 'optimal' },
        { name: 'Semangka Merah Segar (Vitamin C)', targetGram: 100, actualGram: 103, devPct: +3.0, standardCode: 'TKPI E-07', status: 'optimal' }
      ]
    },
    status: 'active',
    statusNote: 'Perhatian: Sertifikat SLHS Dinkes Berakhir dalam 18 Hari',
    warningLetters: [],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '12 Sep 2026',
      salmonella: 'Negatif / 25g',
      ecoli: '< 3 APM/g',
      laboratory: 'BBLK Makassar'
    },
    recentDispatchLogs: [
      { time: '06:30', armada: 'ARM-01 (DD-8190-KL)', temp: '62.0°C', route: 'Rute SDN IKIP', status: 'Tiba Tepat Waktu (06:48 WITA)' },
      { time: '06:45', armada: 'ARM-02 (DD-8191-KL)', temp: '61.5°C', route: 'Rute SMPN 3', status: 'Tiba Tepat Waktu (07:05 WITA)' }
    ]
  },
  {
    id: 'sppg-6',
    code: 'BGN-SPPG-015',
    name: 'Dapur Katering Mitra Sejahtera Sentosa',
    legalEntity: 'PT Mitra Sejahtera Sentosa Papua (Mitra Rekanan)',
    type: 'rekanan',
    typeLabel: 'Katering Rekanan Swasta',
    address: 'Jl. Raya Abepura - Kotaraja No. 45',
    subdistrict: 'Abepura',
    city: 'Kota Jayapura',
    province: 'Papua',
    cluster: 'Kluster Jayapura Wilayah 1',
    coordinates: '-2.5991, 140.6720',
    manager: 'Kornelis Wenda, S.E',
    managerNip: 'MITRA-JYP-2024-019',
    managerPhone: '+62 821-9988-1122',
    nutritionist: 'Debora Tabuni, S.Gz',
    nutritionistStr: 'STR-GZ/2023/09914',
    staffCount: 18,
    kitchenArea: '280 m²',
    establishedYear: 2024,
    equipmentList: [
      '1x Combi Steamer 10-Tray',
      '2x Wok Cooker Gas',
      '1x Chiller Standar',
      'Unit Filtrasi Air Rusak (Pipa Sumur Tercemar)'
    ],
    fleetCount: 2,
    fleetType: 'Mobil Pick-up Tertutup Kanvas (Non-Refrigerated)',
    capacity: {
      maxDailyPortions: 1500,
      activeQuota: 0, // DIBEKUKAN / SUSPENDED
      requestedQuota: 1200,
      utilizationPct: 0,
      safetyBufferPct: 100
    },
    assignedSchools: [
      { id: 'sch-21', name: 'SD Inpres Kotaraja', npsn: '33.210.135', portions: 290, distanceKm: 2.2, estMinutes: 12, dropTargetTime: '06:45 WIT', contactPerson: 'Rina Wulandari, S.Gz (0821-4402-1100)', contingencySPPG: 'SPPG Sentral Jayapura Abepura' },
      { id: 'sch-22', name: 'SMPN 2 Jayapura Selatan', npsn: '33.210.201', portions: 480, distanceKm: 4.5, estMinutes: 22, dropTargetTime: '07:10 WIT', contactPerson: 'Bapak Frans Kaisiepo, S.Pd', contingencySPPG: 'SPPG Sentral Jayapura Abepura' },
      { id: 'sch-23', name: 'SD YPK Kotaraja', npsn: '33.210.205', portions: 330, distanceKm: 1.8, estMinutes: 10, dropTargetTime: '07:20 WIT', contactPerson: 'Ibu Martha Ohee, S.Pd', contingencySPPG: 'SPPG Sentral Jayapura Abepura' }
    ],
    scorecard: {
      safetyScore: 54.0, // Anomali kritis AI: kontaminan & sanitasi buruk
      coldChainScore: 42.0, // Tanpa pendingin, suhu makanan drop 32°C
      timelinessScore: 71.0,
      compositeScore: 55.6,
      grade: 'SUSPENDED',
      compliance7Days: [78.0, 72.0, 68.0, 60.0, 52.0, 55.0, 55.6],
      weeklyTrend: '-22.4%'
    },
    certificates: {
      slhs: {
        status: 'expired',
        number: 'SLHS-PAP/DINKES-JYP/2024/0088',
        issuer: 'Dinas Kesehatan Kota Jayapura',
        validUntil: '2026-09-01',
        daysLeft: -27, // Kadaluarsa
        inspectionScore: 58,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'audit_pending',
        number: 'HACCP-PENDING/2026/091',
        grade: 'Gagal Akreditasi (Tidak Lolos)',
        issuer: 'Balai Sertifikasi Mutu Pangan',
        validUntil: '2026-09-15',
        daysLeft: -13
      },
      halal: {
        status: 'valid',
        number: 'ID9111000492811',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Kuning Ikan Mujair Bakar, Sayur Kangkung Bawang, Buah Pisang',
      tkpiStatus: 'VIOLATION',
      avgDeviationPct: -14.2,
      targetCalories: 620,
      actualCalories: 510,
      targetProteinG: 32,
      actualProteinG: 22.0,
      targetCarbsG: 65,
      actualCarbsG: 60.0,
      targetFatG: 13,
      actualFatG: 9.0,
      items: [
        { name: 'Nasi Kuning (Karbohidrat)', targetGram: 150, actualGram: 138, devPct: -8.0, standardCode: 'TKPI A-02', status: 'violation' },
        { name: 'Ikan Mujair Bakar (Protein Hewani)', targetGram: 75, actualGram: 52, devPct: -30.7, standardCode: 'TKPI B-06', status: 'violation' },
        { name: 'Tahu Goreng (Protein Nabati)', targetGram: 50, actualGram: 40, devPct: -20.0, standardCode: 'TKPI C-01', status: 'violation' },
        { name: 'Tumis Sayur Kangkung (Serat)', targetGram: 100, actualGram: 75, devPct: -25.0, standardCode: 'TKPI D-14', status: 'violation' },
        { name: 'Pisang Lokal (Vitamin)', targetGram: 100, actualGram: 85, devPct: -15.0, standardCode: 'TKPI E-01', status: 'violation' }
      ]
    },
    status: 'suspended',
    statusNote: 'IZIN DISTRIBUSI DITANGGUHKAN: Indikasi Kontaminasi Salmonella & Pipa Filtrasi Air Tercemar',
    warningLetters: [
      {
        id: 'sp-doc-02',
        type: 'SURAT PENANGGUHAN OPERASIONAL (SUSPENSION)',
        letterNumber: 'BGN/SUSP/MBG/IX/2026/003',
        issuedDate: '24 Sep 2026',
        reason: 'Uji swab kultur laboratorium Dinkes Jayapura menunjukkan positif cemaran Salmonella sp. dan SLHS kadaluarsa. Seluruh suplai dialihkan ke SPPG Sentral Jayapura Abepura.',
        deadlineDate: 'Masa Pembekuan s/d Uji Swab Ulang Negatif & SLHS Baru Terbit',
        status: 'Distribusi Dibekukan Penuh',
        signedBy: 'Dr. Hendra Prasetyo (Satgas MBG Pusat) & Kadinkes Kota Jayapura'
      }
    ],
    pathogenAudit: {
      status: 'danger',
      lastTestDate: '24 Sep 2026',
      salmonella: 'POSITIF / 25g (BAHAYA TINGGI)',
      ecoli: '140 APM/g (Melebihi Ambang Batas 3 APM/g)',
      laboratory: 'Balai Laboratorium Kesehatan Papua (BBLK Jayapura)'
    },
    recentDispatchLogs: [
      { time: '00:00', armada: 'ARMADA DIBEKUKAN', temp: '-', route: 'ALOKASI SUPLAI DIALIHKAN KE SPPG ABEPURA', status: 'PENANGGUHAN HAK DISTRIBUSI' }
    ]
  },
  {
    id: 'sppg-7',
    code: 'BGN-SPPG-006',
    name: 'SPPG Sentral Semarang Barat',
    legalEntity: 'Satuan Pelayanan Pangan Mandiri BGN Semarang',
    type: 'sentral',
    typeLabel: 'Dapur Sentral BGN',
    address: 'Jl. Pamularsih Raya No. 90, Bojongsalaman',
    subdistrict: 'Semarang Barat',
    city: 'Kota Semarang',
    province: 'Jawa Tengah',
    cluster: 'Kluster Semarang Raya',
    coordinates: '-6.9920, 110.3951',
    manager: 'Agus Purnomo, S.T',
    managerNip: '19850620 201001 1 008',
    managerPhone: '+62 813-2900-3344',
    nutritionist: 'Tri Wahyuni, S.Gz',
    nutritionistStr: 'STR-GZ/2022/08819',
    staffCount: 32,
    kitchenArea: '470 m²',
    establishedYear: 2024,
    equipmentList: [
      '3x Combi Steamer Rational 20-Tray',
      '2x Tilting Bratt Pan 120L Stainless',
      '3x Chiller Cold Storage 2°C',
      '1x Unit Reverse Osmosis 1.500 L/jam'
    ],
    fleetCount: 5,
    fleetType: 'Mobil Box Berpendingin Sensor IoT Suhu',
    capacity: {
      maxDailyPortions: 3200,
      activeQuota: 2400,
      requestedQuota: 2800, // Meminta Tambah Kuota 400 porsi
      utilizationPct: 75,
      safetyBufferPct: 25
    },
    assignedSchools: [
      { id: 'sch-24', name: 'SDN Bojongsalaman 01', npsn: '33.210.210', portions: 460, distanceKm: 1.5, estMinutes: 10, dropTargetTime: '06:45 WIB', contactPerson: 'Ibu Sri Mulyani, S.Pd' },
      { id: 'sch-25', name: 'SMPN 1 Semarang', npsn: '33.210.212', portions: 780, distanceKm: 3.2, estMinutes: 18, dropTargetTime: '07:05 WIB', contactPerson: 'Drs. H. Sugito, M.Si' },
      { id: 'sch-26', name: 'SDN Manyaran 02', npsn: '33.210.215', portions: 520, distanceKm: 2.8, estMinutes: 15, dropTargetTime: '07:15 WIB', contactPerson: 'Bapak Hartono, S.Pd' },
      { id: 'sch-27', name: 'SMPN 13 Semarang', npsn: '33.210.218', portions: 640, distanceKm: 4.0, estMinutes: 20, dropTargetTime: '07:22 WIB', contactPerson: 'Ibu Nurhayati, M.Pd' }
    ],
    scorecard: {
      safetyScore: 99.1,
      coldChainScore: 98.2,
      timelinessScore: 99.4,
      compositeScore: 98.9,
      grade: 'A',
      compliance7Days: [98.8, 99.0, 99.2, 98.5, 99.1, 98.9, 98.9],
      weeklyTrend: '+0.3%'
    },
    certificates: {
      slhs: {
        status: 'valid',
        number: 'SLHS-JTG/DINKES-SMG/2025/0312',
        issuer: 'Dinas Kesehatan Kota Semarang',
        validUntil: '2027-10-15',
        daysLeft: 382,
        inspectionScore: 95,
        certDocumentUrl: '#'
      },
      haccp: {
        status: 'valid',
        number: 'HACCP-BGN-CERT/2025/1155',
        grade: 'Grade A',
        issuer: 'KAN Lembaga Akreditasi',
        validUntil: '2026-11-20',
        daysLeft: 53
      },
      halal: {
        status: 'valid',
        number: 'ID3311000491022',
        issuer: 'BPJPH Kementerian Agama RI'
      }
    },
    recipeAudit: {
      menuToday: 'Nasi Liwet Solo, Ayam Suwir Opor, Tahu Bacem Bumbu Manis, Sayur Labu Siam Wortel, Buah Pisang Cavendish',
      tkpiStatus: 'COMPLIANT',
      avgDeviationPct: 1.1,
      targetCalories: 640,
      actualCalories: 638,
      targetProteinG: 34,
      actualProteinG: 34.2,
      targetCarbsG: 68,
      actualCarbsG: 67.5,
      targetFatG: 14,
      actualFatG: 13.9,
      items: [
        { name: 'Nasi Liwet Gurih (Karbohidrat)', targetGram: 150, actualGram: 149, devPct: -0.7, standardCode: 'TKPI A-01', status: 'optimal' },
        { name: 'Ayam Suwir Opor (Protein Hewani)', targetGram: 75, actualGram: 75, devPct: 0.0, standardCode: 'TKPI B-04', status: 'optimal' },
        { name: 'Tahu Bacem (Protein Nabati)', targetGram: 50, actualGram: 50, devPct: 0.0, standardCode: 'TKPI C-01', status: 'optimal' },
        { name: 'Sayur Labu Siam & Wortel (Serat)', targetGram: 100, actualGram: 99, devPct: -1.0, standardCode: 'TKPI D-05', status: 'optimal' },
        { name: 'Pisang Cavendish (Kalium & Vit)', targetGram: 100, actualGram: 101, devPct: +1.0, standardCode: 'TKPI E-01', status: 'optimal' }
      ]
    },
    status: 'active',
    statusNote: 'Pengajuan Penambahan Kuota: 2.400 -> 2.800 Porsi/Hari (Menunggu Persetujuan Superadmin)',
    warningLetters: [],
    pathogenAudit: {
      status: 'safe',
      lastTestDate: '19 Sep 2026',
      salmonella: 'Negatif / 25g',
      ecoli: '< 3 APM/g',
      laboratory: 'BBLK Semarang'
    },
    recentDispatchLogs: [
      { time: '06:35', armada: 'ARM-01 (H-9011-ZA)', temp: '62.5°C', route: 'Rute Bojongsalaman', status: 'Tiba Tepat Waktu (06:45 WIB)' },
      { time: '06:48', armada: 'ARM-02 (H-9012-ZA)', temp: '61.8°C', route: 'Rute SMPN 1 SMG', status: 'Tiba Tepat Waktu (07:05 WIB)' }
    ]
  }
]
