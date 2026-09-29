/**
 * ==============================================================================
 * DATA MASTER: PUSAT ADUAN, TRIAGE INSIDEN & EMERGENCY KILL-SWITCH MBG
 * Sumber Data: Satgas MBG Pusat, Tim Triage BGN & Validator Sekolah
 * Regulasi: Bab 4.2 Poin 3 & Bab 11 SUPERADMIN.md - Pelaporan Insiden Cepat & Food Safety
 * ==============================================================================
 */

// 1. Data Tiket Aduan & Insiden Masuk
export const INITIAL_FEEDBACK_TICKETS = [
  {
    id: 'TKT-2026-09-088',
    ticketNumber: 'INC/BGN/BDG/0928/01',
    reportedAt: '2026-09-28 07:12 WIB',
    schoolName: 'SDN Sukajadi 01 Bandung',
    npsn: '20219401',
    schoolAddress: 'Jl. Sukajadi No. 120, Kota Bandung, Jawa Barat',
    sppgName: 'SPPG Sentral Sukajadi Bandung',
    sppgId: 'SPPG-BDG-01',
    batchId: 'BATCH-BDG-0928-02',
    menuPackage: 'Paket F (Nasi Uduk Rolade Sapi & Orek Tempe)',
    severity: 'level1',
    severityLabel: 'Level 1 (Kritis - Bahaya Keracunan)',
    anomalyType: 'spoiled_food',
    anomalyLabel: 'Makanan Basi & Berbau Masam',
    affectedPortions: 420,
    reporter: {
      name: 'Dra. Hj. Siti Maryam',
      role: 'Guru Validator Sekolah (Ketua Tim Gizi)',
      phone: '0812-2291-8812',
      nip: '197805121999032001'
    },
    title: 'Aroma Masam Menyengat & Lendir Halus pada Sayur Orek Tempe',
    description: 'Saat guru validator membuka acak 5 boks sampel porsi sebelum dibagikan ke siswa kelas 1 & 2, tercium aroma masam pekat dan permukaan tempe sedikit berlendir. Suhu boks 48°C (di bawah standar 60°C). Pembagian ke siswa langsung ditahan.',
    evidencePhotos: [
      { id: 'EV-1', label: 'Foto Sayur Berlendir', confidenceAi: '94% YOLOv8 Anomaly Detection', verified: true }
    ],
    slaDeadline: '2026-09-28 09:12 WIB', // 2 Jam SLA
    slaRemainingMinutes: 48,
    status: 'in_progress',
    statusLabel: 'Sedang Ditindaklanjuti',
    isKillSwitchExecuted: true,
    killSwitchDetails: {
      executedAt: '2026-09-28 07:25 WIB',
      executedBy: 'Bambang Soediro (Superadmin Satgas MBG)',
      haltedSchoolsCount: 4,
      haltedPortionsTotal: 1850,
      haltedSchools: [
        'SDN Sukajadi 01 Bandung (420 porsi)',
        'SDN Sukajadi 03 Bandung (380 porsi)',
        'SMPN 2 Bandung (680 porsi)',
        'SMPN 9 Bandung (370 porsi)'
      ]
    },
    medicalEscalation: {
      escalated: true,
      healthCenter: 'Puskesmas Sukajadi Kota Bandung',
      doctorInCharge: 'dr. Nabila Hapsari',
      doctorPhone: '0811-2391-4401',
      dispatchStatus: 'Tim Medis Bersiaga di Lokasi Sekolah'
    },
    investigationStatus: {
      assignedInspector: 'dr. Raden Arya Pratama, M.Sc (Satgas BGN Pusat)',
      auditTime: '08:00 WIB',
      focus: 'Pemeriksaan sanitasi wajan penggorengan & uji mikrobiologi sampel tempe di Labkesda Jabar',
      labSampleTaken: true
    },
    resolutionNotes: null,
    closedAt: null
  },
  {
    id: 'TKT-2026-09-089',
    ticketNumber: 'INC/BGN/JKT/0928/02',
    reportedAt: '2026-09-28 07:22 WIB',
    schoolName: 'SMPN 19 Jakarta Selatan',
    npsn: '20101904',
    schoolAddress: 'Jl. Bumi No. 21, Kebayoran Baru, Jakarta Selatan',
    sppgName: 'SPPG Kebayoran Baru Sehat',
    sppgId: 'SPPG-JKT-03',
    batchId: 'BATCH-JKT-0928-05',
    menuPackage: 'Paket F (Nasi Uduk Rolade Sapi)',
    severity: 'level2',
    severityLabel: 'Level 2 (Sedang - Kualitas & Porsi)',
    anomalyType: 'portion_gramature',
    anomalyLabel: 'Porsi Lauk Kurang dari Gramatur Standar',
    affectedPortions: 35,
    reporter: {
      name: 'H. Ahmad Fauzi, S.Si',
      role: 'Guru Validator Sekolah',
      phone: '0813-8821-9011',
      nip: '198003112005011004'
    },
    title: 'Gramatur Rolade Sapi Hanya 45g (Standar Wajib 85g)',
    description: 'Uji timbang acak pada 10 boks menunjukkan rolade daging hanya berukuran 45-50 gram, tidak sesuai standar spesifikasi 85 gram. Porsi karbohidrat dan buah lengkap dan aman.',
    evidencePhotos: [
      { id: 'EV-2', label: 'Hasil Timbangan Digital Porsi', confidenceAi: '100% Terverifikasi Timbangan', verified: true }
    ],
    slaDeadline: '2026-09-28 09:22 WIB',
    slaRemainingMinutes: 62,
    status: 'in_progress',
    statusLabel: 'Menunggu Penggantian Vendor',
    isKillSwitchExecuted: false,
    killSwitchDetails: null,
    medicalEscalation: {
      escalated: false,
      healthCenter: 'Puskesmas Kebayoran Baru',
      doctorInCharge: null,
      doctorPhone: null,
      dispatchStatus: 'Tidak Diperlukan (Bukan Bahaya Medis)'
    },
    investigationStatus: {
      assignedInspector: 'Korwil Logistik MBG Jakarta Selatan',
      auditTime: '08:30 WIB',
      focus: 'Klaim pemotongan tagihan vendor sebesar 35 porsi dan surat teguran pemenuhan gramatur',
      labSampleTaken: false
    },
    resolutionNotes: 'Vendor katering telah menyetujui pemotongan tagihan dan mengirimkan 35 porsi tambahan komplementer telur rebus.',
    closedAt: null
  },
  {
    id: 'TKT-2026-09-090',
    ticketNumber: 'INC/BGN/SBY/0927/03',
    reportedAt: '2026-09-27 07:40 WIB',
    schoolName: 'SDN Tegalsari 03 Surabaya',
    npsn: '20531203',
    schoolAddress: 'Jl. Tegalsari No. 45, Kota Surabaya, Jawa Timur',
    sppgName: 'SPPG Rungkut Makmur Surabaya',
    sppgId: 'SPPG-SBY-02',
    batchId: 'BATCH-SBY-0927-01',
    menuPackage: 'Paket E (Nasi Liwet Telur Balado Kelor)',
    severity: 'level3',
    severityLabel: 'Level 3 (Rendah - Saran Rasa & Menu)',
    anomalyType: 'taste_feedback',
    anomalyLabel: 'Rasa Sayur Terlalu Asin & Wadah Boks Sulit Dibuka',
    affectedPortions: 12,
    reporter: {
      name: 'Endang Wahyuni, M.Pd',
      role: 'Kepala Sekolah & Penanggung Jawab MBG',
      phone: '0812-9901-2291',
      nip: '197509141998022003'
    },
    title: 'Siswa Kelas 1 Mengeluhkan Sayur Daun Kelor Agak Asin',
    description: 'Secara umum makanan higienis dan habis dimakan, namun terdapat masukan dari 3 wali kelas bahwa kadar garam sayur agak tinggi untuk lidah siswa usia 7 tahun. Tutup boks nomor 1-12 juga agak keras dibuka siswa tanpa bantuan guru.',
    evidencePhotos: [],
    slaDeadline: '2026-09-27 10:40 WIB',
    slaRemainingMinutes: 0,
    status: 'resolved',
    statusLabel: 'Selesai & Ditutup',
    isKillSwitchExecuted: false,
    killSwitchDetails: null,
    medicalEscalation: {
      escalated: false,
      healthCenter: 'Puskesmas Tegalsari',
      doctorInCharge: null,
      doctorPhone: null,
      dispatchStatus: 'Tidak Ada Keluhan Sakit'
    },
    investigationStatus: {
      assignedInspector: 'Nutrisionis Wilayah Surabaya',
      auditTime: '2026-09-27 11:00 WIB',
      focus: 'Edukasi tim juru masak dapur SPPG untuk mengurangi 15% takaran garam pada masakan anak SD',
      labSampleTaken: false
    },
    resolutionNotes: 'Dapur SPPG Rungkut Makmur telah menyesuaikan resep rendah garam untuk batch selanjutnya dan mengganti jenis perekat tutup wadah boks agar mudah dibuka anak.',
    closedAt: '2026-09-27 13:15 WIB'
  },
  {
    id: 'TKT-2026-09-091',
    ticketNumber: 'INC/BGN/SMG/0928/04',
    reportedAt: '2026-09-28 07:35 WIB',
    schoolName: 'SDN Candisari 01 Semarang',
    npsn: '20328905',
    schoolAddress: 'Jl. Teuku Umar No. 88, Semarang, Jawa Tengah',
    sppgName: 'SPPG Ungaran Berkah Gizi',
    sppgId: 'SPPG-SMG-01',
    batchId: 'BATCH-SMG-0928-09',
    menuPackage: 'Paket F (Nasi Uduk Rolade Sapi)',
    severity: 'level1',
    severityLabel: 'Level 1 (Kritis - Bahaya Keracunan)',
    anomalyType: 'cold_chain_break',
    anomalyLabel: 'Rantai Dingin Rusak & Makanan Basi Terbengkalai',
    affectedPortions: 310,
    reporter: {
      name: 'Tri Lestari, S.Pd',
      role: 'Guru Validator Sekolah',
      phone: '0812-4401-8892',
      nip: '198307222008012011'
    },
    title: 'Suhu Serah Terima 48.2°C Karena Mobil Mogok >45 Menit',
    description: 'Armada pengantar tiba terlambat di sekolah pukul 07:35 WIB (jadwal maks 07:00 WIB). Pemeriksaan sensor termal inframerah mencatat suhu 48.2°C. Seluruh boks langsung ditolak validator dan diamankan di pos jaga agar tidak tersentuh siswa.',
    evidencePhotos: [
      { id: 'EV-3', label: 'Foto Display Sensor Suhu 48.2°C', confidenceAi: 'Lolos Validasi Termal', verified: true }
    ],
    slaDeadline: '2026-09-28 09:35 WIB',
    slaRemainingMinutes: 72,
    status: 'in_progress',
    statusLabel: 'Investigasi & Kompensasi Dapur',
    isKillSwitchExecuted: true,
    killSwitchDetails: {
      executedAt: '2026-09-28 07:42 WIB',
      executedBy: 'Bambang Soediro (Superadmin Satgas MBG)',
      haltedSchoolsCount: 2,
      haltedPortionsTotal: 650,
      haltedSchools: [
        'SDN Candisari 01 Semarang (310 porsi)',
        'SMPN 5 Semarang (340 porsi)'
      ]
    },
    medicalEscalation: {
      escalated: true,
      healthCenter: 'Puskesmas Candisari Kota Semarang',
      doctorInCharge: 'dr. Agus Wijaya',
      doctorPhone: '0811-9921-4403',
      dispatchStatus: 'Puskesmas Siaga (Zero Anak Terpapar)'
    },
    investigationStatus: {
      assignedInspector: 'Inspektorat Logistik BGN Jateng',
      auditTime: '08:15 WIB',
      focus: 'Pemeriksaan armada logistik pendingin & pemanggilan pimpinan vendor SPPG Ungaran',
      labSampleTaken: true
    },
    resolutionNotes: null,
    closedAt: null
  }
]

// 2. Data Daftar Puskesmas Terdekat untuk Eskalasi Medis Cepat
export const EMERGENCY_HEALTH_CENTERS = [
  {
    id: 'PUSK-BDG-01',
    name: 'Puskesmas Sukajadi Kota Bandung',
    address: 'Jl. Sukagalih No. 24, Sukajadi, Bandung',
    distanceKm: '1.2 km dari sekolah',
    emergencyHotline: '(022) 203-1188',
    doctorInCharge: 'dr. Nabila Hapsari',
    ambulanceReady: true,
    standbyTeam: 'Tim Reaksi Cepat KLB Gizi'
  },
  {
    id: 'PUSK-JKT-03',
    name: 'Puskesmas Kebayoran Baru Jakarta Selatan',
    address: 'Jl. Barito II No. 15, Kebayoran Baru, Jakarta',
    distanceKm: '0.8 km dari sekolah',
    emergencyHotline: '(021) 722-4411',
    doctorInCharge: 'dr. Fajar Hidayat, Sp.A',
    ambulanceReady: true,
    standbyTeam: 'Satgas Siaga Medis Sekolah'
  },
  {
    id: 'PUSK-SMG-01',
    name: 'Puskesmas Candisari Kota Semarang',
    address: 'Jl. Kagok No. 12, Candisari, Semarang',
    distanceKm: '1.5 km dari sekolah',
    emergencyHotline: '(024) 831-2299',
    doctorInCharge: 'dr. Agus Wijaya',
    ambulanceReady: true,
    standbyTeam: 'Unit Gawat Darurat Puskesmas'
  },
  {
    id: 'PUSK-SBY-02',
    name: 'Puskesmas Tegalsari Kota Surabaya',
    address: 'Jl. Dinoyo No. 89, Tegalsari, Surabaya',
    distanceKm: '0.9 km dari sekolah',
    emergencyHotline: '(031) 567-9912',
    doctorInCharge: 'dr. Maya Kartika',
    ambulanceReady: true,
    standbyTeam: 'Tim Surveilans Pangan Dinkes'
  }
]

// 3. Status Opsi Tingkat Kegawatan & Filter
export const SEVERITY_LEVEL_OPTIONS = [
  { id: 'all', label: 'Semua Tingkat Kegawatan' },
  { id: 'level1', label: 'Level 1 (Kritis - Bahaya Keracunan)' },
  { id: 'level2', label: 'Level 2 (Sedang - Kualitas & Porsi)' },
  { id: 'level3', label: 'Level 3 (Rendah - Saran Rasa & Menu)' }
]

export const TICKET_STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status Penanganan' },
  { id: 'in_progress', label: 'Sedang Ditindaklanjuti (Open)' },
  { id: 'resolved', label: 'Selesai & Ditutup (Resolved)' }
]
