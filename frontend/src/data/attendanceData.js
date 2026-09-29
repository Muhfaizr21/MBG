/**
 * ==============================================================================
 * REKONSILIASI PENERIMAAN SISWA & EVALUASI KONSUMSI PORSI MBG
 * Sesuai Regulasi: Bab 4.2 Poin 8 & Bab 3.3.2 Sistem Pengawasan KawanGizi
 * Integrasi: Data Pokok Pendidikan (Dapodik) & Presensi Fisik Jam Makan Siang
 * ==============================================================================
 */

export const INITIAL_ATTENDANCE_LIST = [
  {
    id: 'att-1',
    npsn: '33.210.130',
    school: 'SDN 01 Menteng Pagi',
    level: 'SD / MI (Kelas 1–6)',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    sppg: 'SPPG 01 Menteng Sentral',
    sppgCode: 'BGN-SPPG-001',
    principal: 'Dra. Hj. Sri Wahyuni, M.Pd',
    headValidator: 'Dr. Hendra Prasetyo',
    registeredStudents: 480,
    presentStudents: 462,
    absentDetails: {
      sick: 12,
      permission: 6,
      unexplained: 0
    },
    attendanceRate: 96.25, // %
    deliveredPortions: 480,
    consumedPortions: 462,
    surplusPortions: 18, // Porsi berlebih yang masih utuh
    surplusStatus: 'available_for_redistribution', // available_for_redistribution | redistributed | disposed | none
    goldenWindow: {
      cookedAt: '06:15 WIB',
      deliveredAt: '07:12 WIB',
      lunchTime: '09:45 WIB',
      safeUntil: '10:15 WIB', // 4 jam dari masak
      minutesLeft: 30, // hitung mundur menit aman
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 97.4, // % siswa yang menghabiskan seluruh makanan
      riceWastePct: 1.5,
      proteinWastePct: 0.5,
      veggieWastePct: 3.2,
      feedbackNotes: 'Ayam panggang madu disukai 100% siswa. Sayur capcay brokoli menyisakan sedikit batang.'
    },
    reconciliationStatus: 'surplus_safe', // matched | surplus_safe | surplus_redistributed | discrepancy_flagged
    discrepancyCount: 0,
    targetTomorrowQuota: 465, // Rekomendasi otomatis porsi esok hari
    redistributionLog: null
  },
  {
    id: 'att-2',
    npsn: '33.210.131',
    school: 'SMPN 2 Bandung Wetan',
    level: 'SMP / MTs (Kelas 7–9)',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    sppg: 'SPPG 04 Bandung Wetan',
    sppgCode: 'BGN-SPPG-004',
    principal: 'Drs. H. Maman Suratman, M.M',
    headValidator: 'Siti Nurhaliza, S.Pd',
    registeredStudents: 620,
    presentStudents: 615,
    absentDetails: {
      sick: 3,
      permission: 2,
      unexplained: 0
    },
    attendanceRate: 99.19,
    deliveredPortions: 620,
    consumedPortions: 615,
    surplusPortions: 5,
    surplusStatus: 'available_for_redistribution',
    goldenWindow: {
      cookedAt: '06:30 WIB',
      deliveredAt: '07:18 WIB',
      lunchTime: '10:00 WIB',
      safeUntil: '10:30 WIB',
      minutesLeft: 45,
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 98.8,
      riceWastePct: 0.8,
      proteinWastePct: 0.2,
      veggieWastePct: 1.5,
      feedbackNotes: 'Ikan cakalang asap suwir habis tuntas tanpa sisa. Siswa menyukai tingkat kepedasan rendah.'
    },
    reconciliationStatus: 'matched',
    discrepancyCount: 0,
    targetTomorrowQuota: 618,
    redistributionLog: null
  },
  {
    id: 'att-3',
    npsn: '33.210.133',
    school: 'SMPN 1 Surabaya Pusat',
    level: 'SMP / MTs (Kelas 7–9)',
    city: 'Kota Surabaya',
    province: 'Jawa Timur',
    sppg: 'Dapur Katering Surya Boga Nusantara',
    sppgCode: 'BGN-SPPG-007',
    principal: 'Drs. Joko Suwito, M.Pd',
    headValidator: 'Bambang Irawan, S.Kom',
    registeredStudents: 550,
    presentStudents: 505,
    absentDetails: {
      sick: 35, // Kejadian flu musiman
      permission: 10,
      unexplained: 0
    },
    attendanceRate: 91.82,
    deliveredPortions: 550,
    consumedPortions: 505,
    surplusPortions: 45, // Surplus signifikan (45 porsi utuh)
    surplusStatus: 'available_for_redistribution',
    goldenWindow: {
      cookedAt: '06:00 WIB',
      deliveredAt: '07:35 WIB',
      lunchTime: '09:30 WIB',
      safeUntil: '10:00 WIB',
      minutesLeft: 15, // Kritis sisa 15 menit!
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 88.5,
      riceWastePct: 4.2,
      proteinWastePct: 1.8,
      veggieWastePct: 8.5, // Sayur buncis banyak tersisa (evaluasi resep)
      feedbackNotes: 'Sayur buncis oseng jagung terasa hambar dan serat agak liat. Banyak siswa menyisakan sayur.'
    },
    reconciliationStatus: 'surplus_safe',
    discrepancyCount: 0,
    targetTomorrowQuota: 510, // Hemat 40 porsi anggaran negara esok hari
    redistributionLog: null
  },
  {
    id: 'att-4',
    npsn: '33.210.135',
    school: 'SD Inpres Kotaraja',
    level: 'SD / MI (Kelas 1–6)',
    city: 'Kota Jayapura',
    province: 'Papua',
    sppg: 'Dapur Katering Mitra Sejahtera Sentosa',
    sppgCode: 'BGN-SPPG-015',
    principal: 'Lukas Enumbi, S.Pd',
    headValidator: 'Yulius Wenda, S.Pd',
    registeredStudents: 320,
    presentStudents: 298,
    absentDetails: {
      sick: 14,
      permission: 8,
      unexplained: 0
    },
    attendanceRate: 93.12,
    deliveredPortions: 320,
    consumedPortions: 0, // Makanan dikarantina karena anomali YOLOv8
    surplusPortions: 0,
    surplusStatus: 'disposed',
    goldenWindow: {
      cookedAt: '05:30 WIT',
      deliveredAt: '07:45 WIT',
      lunchTime: '09:30 WIT',
      safeUntil: '09:30 WIT',
      minutesLeft: 0,
      isSafeToRedistribute: false
    },
    consumptionEvaluation: {
      finishRate: 0,
      riceWastePct: 0,
      proteinWastePct: 0,
      veggieWastePct: 0,
      feedbackNotes: 'Distribusi dibatalkan oleh Superadmin karena indikasi lendir kuah dan suhu armada 27.8°C.'
    },
    reconciliationStatus: 'discrepancy_flagged',
    discrepancyCount: 22,
    targetTomorrowQuota: 300,
    redistributionLog: null
  },
  {
    id: 'att-5',
    npsn: '33.210.132',
    school: 'SDN Percobaan 1 Sleman',
    level: 'SD / MI (Kelas 1–6)',
    city: 'D.I. Yogyakarta',
    province: 'D.I. Yogyakarta',
    sppg: 'SPPG 02 Sleman Sentral',
    sppgCode: 'BGN-SPPG-002',
    principal: 'Sri Hartati, S.Pd., M.Hum',
    headValidator: 'Ahmad Fauzi, M.Pd',
    registeredStudents: 410,
    presentStudents: 395,
    absentDetails: {
      sick: 10,
      permission: 5,
      unexplained: 0
    },
    attendanceRate: 96.34,
    deliveredPortions: 410,
    consumedPortions: 395,
    surplusPortions: 15,
    surplusStatus: 'redistributed',
    goldenWindow: {
      cookedAt: '06:10 WIB',
      deliveredAt: '07:25 WIB',
      lunchTime: '09:40 WIB',
      safeUntil: '10:10 WIB',
      minutesLeft: 25,
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 99.1,
      riceWastePct: 0.5,
      proteinWastePct: 0.1,
      veggieWastePct: 0.8,
      feedbackNotes: 'Daging sapi teriyaki dan nasi merah sangat disukai. Tingkat penerimaan gizi anak 99%.'
    },
    reconciliationStatus: 'surplus_redistributed',
    discrepancyCount: 0,
    targetTomorrowQuota: 400,
    redistributionLog: {
      dispatchId: 'REDIST-YGY-2026-012',
      authorizedBy: 'Dr. Hendra Prasetyo (Satgas MBG Pusat)',
      targetFacility: 'Panti Asuhan Yatim Piatu Al-Ikhlas Sleman (Radius 1.8 km)',
      portionsAllocated: 15,
      courierName: 'Budi Santoso (Armada Motor Roda Tiga MBG)',
      dispatchedAt: '09:45 WIB',
      arrivedAt: '09:58 WIB',
      recipientSignature: 'H. Suwardi (Ketua Panti)'
    }
  },
  {
    id: 'att-6',
    npsn: '33.210.134',
    school: 'SDN Kompleks IKIP Makassar',
    level: 'SD / MI (Kelas 1–6)',
    city: 'Kota Makassar',
    province: 'Sulawesi Selatan',
    sppg: 'SPPG 01 Tamalate Bahari',
    sppgCode: 'BGN-SPPG-010',
    principal: 'Drs. H. Syamsuddin, M.Pd',
    headValidator: 'Dra. Syamsuddin Dg. Rewa',
    registeredStudents: 390,
    presentStudents: 382,
    absentDetails: {
      sick: 6,
      permission: 2,
      unexplained: 0
    },
    attendanceRate: 97.95,
    deliveredPortions: 390,
    consumedPortions: 382,
    surplusPortions: 8,
    surplusStatus: 'available_for_redistribution',
    goldenWindow: {
      cookedAt: '06:15 WITA',
      deliveredAt: '07:40 WITA',
      lunchTime: '10:00 WITA',
      safeUntil: '10:15 WITA',
      minutesLeft: 35,
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 96.5,
      riceWastePct: 1.2,
      proteinWastePct: 0.4,
      veggieWastePct: 2.1,
      feedbackNotes: 'Ayam lengkuas gurih dan sup jagung manis tandas. Siswa sangat antusias.'
    },
    reconciliationStatus: 'surplus_safe',
    discrepancyCount: 0,
    targetTomorrowQuota: 385,
    redistributionLog: null
  },
  {
    id: 'att-7',
    npsn: '33.210.138',
    school: 'SDN 05 Tebet Timur',
    level: 'SD / MI (Kelas 1–6)',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    sppg: 'SPPG 01 Menteng Sentral',
    sppgCode: 'BGN-SPPG-001',
    principal: 'H. Sudrajat, M.Si',
    headValidator: 'Rahmat Hidayat, S.Pd',
    registeredStudents: 450,
    presentStudents: 430,
    absentDetails: {
      sick: 15,
      permission: 5,
      unexplained: 0
    },
    attendanceRate: 95.56,
    deliveredPortions: 480, // Selisih! Kurir bawa 480 tapi catatan sekolah 450 (selisih 30 boks tak bertuan)
    consumedPortions: 430,
    surplusPortions: 50,
    surplusStatus: 'available_for_redistribution',
    goldenWindow: {
      cookedAt: '06:15 WIB',
      deliveredAt: '08:02 WIB',
      lunchTime: '10:00 WIB',
      safeUntil: '10:15 WIB',
      minutesLeft: 13,
      isSafeToRedistribute: true
    },
    consumptionEvaluation: {
      finishRate: 95.0,
      riceWastePct: 2.0,
      proteinWastePct: 0.8,
      veggieWastePct: 2.5,
      feedbackNotes: 'Porsi dimakan tertib. Namun ada perbedaan 30 boks lebih dari data Dapodik.'
    },
    reconciliationStatus: 'discrepancy_flagged', // Selisih mencurigakan!
    discrepancyCount: 30,
    targetTomorrowQuota: 435,
    redistributionLog: null
  }
]
