/**
 * ==============================================================================
 * REKAM JEJAK TELEMETRI PENGIRIMAN & INSPEKSI YOLOV8 MBG
 * Sesuai Regulasi: Bab 3.3.2 & Bab 4.2 Poin 8 Sistem Pengawasan KawanGizi
 * Token: `cryptoProof` holds a plain identifier and a sequence number used to
 * show an anti-duplication flow. It is NOT a cryptographic proof, and no
 * signing or ledger exists yet.
 * ==============================================================================
 */

export const INITIAL_DELIVERIES_LIST = [
  {
    id: 'DEL-2026-JKT-0982',
    batchId: 'BTH-0842-MNT',
    school: 'SDN 01 Menteng Pagi',
    npsn: '33.210.130',
    sppg: 'SPPG 01 Menteng Sentral',
    sppgCode: 'BGN-SPPG-001',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    validator: {
      name: 'Dr. Hendra Prasetyo',
      satgasId: 'BGN-VLD-0042',
      role: 'Penanggung Jawab MBG Sekolah',
      device: 'iPhone 15 Pro (Secure Enclave)'
    },
    scannedAt: '07:12:45 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.82,
    portions: 480,
    targetPortions: 480,
    thermal: {
      temp: 23.4,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'safe', // safe | warning | critical
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '27.1°C'
    },
    qrToken: {
      code: 'MBG-QR-7719-X89A-001',
      status: 'verified', // verified | duplicate_attempt | expired_window
      scanAttempts: 1,
      firstScannedAt: '07:12:45 WIB',
      expiryWindow: '10:30 WIB (3 Jam Pasca Masak)',
      antiDuplicateHash: '9a8f2bc0e11849a99f123a41c9983de4'
    },
    cryptoProof: {
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      blockHeight: 1849201,
      signedBy: 'KawanGizi-Notary-Edge-CGK01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Pulen, Ayam Panggang Madu, Capcay Brokoli & Pisang Ambon',
      packageType: 'Paket Gizi Seimbang SD (Kelas 1-6)',
      allergens: 'Bebas Kacang Tanah · Mengandung Wijen Alami',
      cookingCompletedAt: '06:15 WIB',
      shelfLifeLeftMinutes: 195
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 18,
      status: 'verified', // verified | flagged | overridden | lab_pending
      freshnessIndex: 98.4,
      confidenceScore: 99.1,
      detectedObjects: [
        { label: 'Ayam Panggang Madu', confidence: 0.98, color: '#10B981', box: { x: 18, y: 15, w: 38, h: 42 } },
        { label: 'Capcay Brokoli & Wortel', confidence: 0.96, color: '#10B981', box: { x: 58, y: 18, w: 32, h: 36 } },
        { label: 'Nasi Pulen Organik', confidence: 0.99, color: '#3B82F6', box: { x: 18, y: 58, w: 36, h: 32 } },
        { label: 'Pisang Ambon Segar', confidence: 0.97, color: '#F59E0B', box: { x: 58, y: 58, w: 28, h: 28 } }
      ],
      anomaly: null,
      macronutrients: {
        calories: 545,
        proteinG: 34,
        carbsG: 68,
        fatG: 14,
        fiberG: 6.2,
        tkpiScore: 100
      },
      aiNotes: 'Seluruh komponen porsi dalam kondisi segar optimal. Tidak terdeteksi perubahan warna atau dekomposisi.'
    },
    overrideRecord: null,
    labAudit: null
  },
  {
    id: 'DEL-2026-BDG-4412',
    batchId: 'BTH-0843-BDG',
    school: 'SMPN 2 Bandung Wetan',
    npsn: '33.210.131',
    sppg: 'SPPG 04 Bandung Wetan',
    sppgCode: 'BGN-SPPG-004',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
    validator: {
      name: 'Siti Nurhaliza, S.Pd',
      satgasId: 'BGN-VLD-0056',
      role: 'Staf Administrasi & Operator Gizi',
      device: 'iPhone 15'
    },
    scannedAt: '07:18:20 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.50,
    portions: 620,
    targetPortions: 620,
    thermal: {
      temp: 23.8,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'safe',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '25.6°C'
    },
    qrToken: {
      code: 'MBG-QR-4412-BDG-002',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:18:20 WIB',
      expiryWindow: '10:45 WIB',
      antiDuplicateHash: '4f29a0c1e8471182390a149bde716142'
    },
    cryptoProof: {
      sha256: '4a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
      blockHeight: 1849208,
      signedBy: 'KawanGizi-Notary-Edge-BDO01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Kuning Cakalang Asap, Sayur Urap Kelapa & Jeruk Manis',
      packageType: 'Paket Omega-3 SMP (Tinggi Protein)',
      allergens: 'Ikan Laut Segar · Bebas Gluten & Susu',
      cookingCompletedAt: '06:30 WIB',
      shelfLifeLeftMinutes: 205
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 16,
      status: 'verified',
      freshnessIndex: 97.2,
      confidenceScore: 98.6,
      detectedObjects: [
        { label: 'Cakalang Asap Suwir', confidence: 0.97, color: '#10B981', box: { x: 20, y: 18, w: 35, h: 38 } },
        { label: 'Sayur Urap Daun Singkong', confidence: 0.95, color: '#10B981', box: { x: 60, y: 18, w: 30, h: 35 } },
        { label: 'Nasi Kuning Rempah', confidence: 0.98, color: '#F59E0B', box: { x: 20, y: 60, w: 35, h: 30 } },
        { label: 'Jeruk Manis Medan', confidence: 0.99, color: '#3B82F6', box: { x: 60, y: 60, w: 25, h: 25 } }
      ],
      anomaly: null,
      macronutrients: {
        calories: 510,
        proteinG: 31,
        carbsG: 64,
        fatG: 13,
        fiberG: 7.1,
        tkpiScore: 99
      },
      aiNotes: 'Kualitas protein cakalang dan rempah kunyit memenuhi standar nutrisi anak SMP.'
    },
    overrideRecord: null,
    labAudit: null
  },
  {
    id: 'DEL-2026-SBY-8821',
    batchId: 'BTH-0844-SBY',
    school: 'SMPN 1 Surabaya Pusat',
    npsn: '33.210.133',
    sppg: 'Dapur Katering Surya Boga Nusantara',
    sppgCode: 'BGN-SPPG-007',
    city: 'Kota Surabaya',
    province: 'Jawa Timur',
    validator: {
      name: 'Bambang Irawan, S.Kom',
      satgasId: 'BGN-VLD-0112',
      role: 'Koordinator Verifikasi MBG',
      device: 'Samsung Galaxy S24'
    },
    scannedAt: '07:35:12 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.65,
    portions: 550,
    targetPortions: 550,
    thermal: {
      temp: 24.6,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'warning',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '31.2°C'
    },
    qrToken: {
      code: 'MBG-QR-8821-SBY-003',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:35:12 WIB',
      expiryWindow: '10:15 WIB',
      antiDuplicateHash: '7a12b9c4d3e841289a0f4419de827156'
    },
    cryptoProof: {
      sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      blockHeight: 1849215,
      signedBy: 'KawanGizi-Notary-Edge-SUB01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Putih, Telur Balado, Oseng Buncis Jagung & Semangka',
      packageType: 'Paket Ekonomis Rekanan',
      allergens: 'Telur Ayam Ras · Bebas Kacang',
      cookingCompletedAt: '06:00 WIB',
      shelfLifeLeftMinutes: 160
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 22,
      status: 'flagged',
      freshnessIndex: 81.4,
      confidenceScore: 74.5,
      detectedObjects: [
        { label: 'Telur Balado', confidence: 0.89, color: '#10B981', box: { x: 18, y: 16, w: 32, h: 36 } },
        { label: 'Oseng Buncis Jagung', confidence: 0.74, color: '#F59E0B', box: { x: 55, y: 16, w: 36, h: 36 } },
        { label: 'Nasi Putih', confidence: 0.94, color: '#3B82F6', box: { x: 18, y: 56, w: 36, h: 34 } },
        { label: 'Semangka Potong', confidence: 0.91, color: '#10B981', box: { x: 58, y: 56, w: 26, h: 28 } }
      ],
      anomaly: {
        code: 'ANOM-COLOR-OXIDATION',
        type: 'Perubahan Warna Oksidatif Sayuran',
        severity: 'medium',
        confidence: 74.5,
        riskDescription: 'Model mendeteksi sayur buncis berwarna kekuningan/kusam. Kemungkinan paparan suhu panas armada atau degradasi klorofil alami.',
        actionNeeded: 'Perlu Verifikasi Visual Manual Superadmin / Ahli Gizi'
      },
      macronutrients: {
        calories: 470,
        proteinG: 22,
        carbsG: 62,
        fatG: 12,
        fiberG: 4.8,
        tkpiScore: 82
      },
      aiNotes: 'Terdeteksi diskolorasi buncis. Disarankan Superadmin melakukan inspeksi visual untuk memastikan tidak terjadi fermentasi asam.'
    },
    overrideRecord: null,
    labAudit: null
  },
  {
    id: 'DEL-2026-DJJ-7710',
    batchId: 'BTH-0845-DJJ',
    school: 'SD Inpres Kotaraja',
    npsn: '33.210.135',
    sppg: 'Dapur Katering Mitra Sejahtera Sentosa',
    sppgCode: 'BGN-SPPG-015',
    city: 'Kota Jayapura',
    province: 'Papua',
    validator: {
      name: 'Yulius Wenda, S.Pd',
      satgasId: 'BGN-VLD-0145',
      role: 'Guru Kelas 4 & Validator Lapangan',
      device: 'Xiaomi Redmi Note 13'
    },
    scannedAt: '07:45:10 WIT',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.92,
    portions: 320,
    targetPortions: 320,
    thermal: {
      temp: 27.8,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'critical',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '32.5°C'
    },
    qrToken: {
      code: 'MBG-QR-7710-DJJ-004',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:45:10 WIT',
      expiryWindow: '09:30 WIT',
      antiDuplicateHash: '1a982bc4e9081239aa0f4419de821102'
    },
    cryptoProof: {
      sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      blockHeight: 1849221,
      signedBy: 'KawanGizi-Notary-Edge-DJJ01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Putih, Ikan Kuah Kuning Papeda & Tumis Kangkung',
      packageType: 'Paket Gizi Lokal Papua',
      allergens: 'Ikan Air Tawar · Bebas Pengawet',
      cookingCompletedAt: '05:30 WIT',
      shelfLifeLeftMinutes: 45
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 25,
      status: 'flagged',
      freshnessIndex: 55.6,
      confidenceScore: 91.2,
      detectedObjects: [
        { label: 'Ikan Kuah Kuning', confidence: 0.91, color: '#EF4444', box: { x: 18, y: 15, w: 40, h: 42 } },
        { label: 'Tumis Kangkung', confidence: 0.82, color: '#F59E0B', box: { x: 62, y: 15, w: 28, h: 35 } },
        { label: 'Nasi Putih', confidence: 0.92, color: '#3B82F6', box: { x: 20, y: 60, w: 35, h: 32 } }
      ],
      anomaly: {
        code: 'ANOM-SLIME-TEXTURE',
        type: 'Dugaan Lendir Permukaan & Suhu Kritis',
        severity: 'critical',
        confidence: 91.2,
        riskDescription: 'Kamera mendeteksi kilauan cairan berlendir abnormal pada kuah ikan, ditambah suhu boks tiba pada 27.8°C (ambang batas bahaya mikroba). Berpotensi cemaran Salmonella.',
        actionNeeded: 'Karantina Boks Segera & Perintahkan Uji Petik Laboratorium Dinkes'
      },
      macronutrients: {
        calories: 420,
        proteinG: 20,
        carbsG: 55,
        fatG: 9,
        fiberG: 3.5,
        tkpiScore: 71
      },
      aiNotes: 'BAHAYA: Kondisi fisik porsi berisiko tinggi memicu keracunan massal. Distribusi wajib dihentikan.'
    },
    overrideRecord: null,
    labAudit: null
  },
  {
    id: 'DEL-2026-YGY-3319',
    batchId: 'BTH-0846-YGY',
    school: 'SDN Percobaan 1 Sleman',
    npsn: '33.210.132',
    sppg: 'SPPG 02 Sleman Sentral',
    sppgCode: 'BGN-SPPG-002',
    city: 'D.I. Yogyakarta',
    province: 'D.I. Yogyakarta',
    validator: {
      name: 'Ahmad Fauzi, M.Pd',
      satgasId: 'BGN-VLD-0089',
      role: 'Wali Kelas VI & Tim MBG',
      device: 'Google Pixel 8'
    },
    scannedAt: '07:25:30 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.72,
    portions: 410,
    targetPortions: 410,
    thermal: {
      temp: 24.1,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'safe',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '26.8°C'
    },
    qrToken: {
      code: 'MBG-QR-3319-YGY-005',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:25:30 WIB',
      expiryWindow: '10:45 WIB',
      antiDuplicateHash: '3a8819bc2e119830f0a4419de8119283'
    },
    cryptoProof: {
      sha256: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      blockHeight: 1849228,
      signedBy: 'KawanGizi-Notary-Edge-YOG01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Merah Organik, Daging Sapi Teriyaki & Tumis Buncis Tahu',
      packageType: 'Paket Kaya Zat Besi',
      allergens: 'Kedelai Alami · Bebas Pengawet',
      cookingCompletedAt: '06:10 WIB',
      shelfLifeLeftMinutes: 190
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 19,
      status: 'overridden',
      freshnessIndex: 99.5,
      confidenceScore: 99.2,
      detectedObjects: [
        { label: 'Daging Sapi Teriyaki', confidence: 0.99, color: '#10B981', box: { x: 18, y: 18, w: 36, h: 38 } },
        { label: 'Tumis Buncis Tahu', confidence: 0.96, color: '#10B981', box: { x: 58, y: 18, w: 32, h: 36 } },
        { label: 'Nasi Merah', confidence: 0.99, color: '#3B82F6', box: { x: 18, y: 58, w: 36, h: 32 } }
      ],
      anomaly: null,
      macronutrients: {
        calories: 530,
        proteinG: 32,
        carbsG: 66,
        fatG: 13,
        fiberG: 8.4,
        tkpiScore: 100
      },
      aiNotes: 'Terverifikasi secara manual oleh Superadmin setelah verifikasi fisik pencahayaan lampu kamera validator.'
    },
    overrideRecord: {
      overriddenBy: 'Dr. Hendra Prasetyo (Satgas MBG Pusat)',
      auditorTitle: 'Auditor Utama Gizi & Keamanan Pangan',
      timestamp: '07:31:04 WIB',
      reason: 'Pemeriksaan fisik validator menunjukkan saus teriyaki pekat terbaca sebagai bayangan abnormal oleh model AI versi beta. Uji organoleptik boks nomor 1-5 dinyatakan segar dan layak konsumsi.',
      signatureHash: 'SIG-VER-0982-HPR'
    },
    labAudit: null
  },
  {
    id: 'DEL-2026-MKS-5510',
    batchId: 'BTH-0847-MKS',
    school: 'SDN Kompleks IKIP Makassar',
    npsn: '33.210.134',
    sppg: 'SPPG 01 Tamalate Bahari',
    sppgCode: 'BGN-SPPG-010',
    city: 'Kota Makassar',
    province: 'Sulawesi Selatan',
    validator: {
      name: 'Dra. Syamsuddin Dg. Rewa',
      satgasId: 'BGN-VLD-0167',
      role: 'Kepala Sekolah & Penanggung Jawab MBG',
      device: 'OPPO Reno 11 5G'
    },
    scannedAt: '07:40:15 WITA',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.78,
    portions: 390,
    targetPortions: 390,
    thermal: {
      temp: 24.0,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'safe',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '28.4°C'
    },
    qrToken: {
      code: 'MBG-QR-5510-MKS-006',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:40:15 WITA',
      expiryWindow: '10:30 WITA',
      antiDuplicateHash: '5b1198ac3e001928af0e4419de771891'
    },
    cryptoProof: {
      sha256: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      blockHeight: 1849234,
      signedBy: 'KawanGizi-Notary-Edge-UPG01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Putih, Ayam Goreng Lengkuas, Sup Jagung Manis & Pepaya',
      packageType: 'Paket Bergizi Makassar',
      allergens: 'Bebas Kacang · Halal BPJPH',
      cookingCompletedAt: '06:15 WITA',
      shelfLifeLeftMinutes: 170
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 17,
      status: 'lab_pending',
      freshnessIndex: 97.4,
      confidenceScore: 98.1,
      detectedObjects: [
        { label: 'Ayam Goreng Lengkuas', confidence: 0.98, color: '#10B981', box: { x: 18, y: 18, w: 35, h: 40 } },
        { label: 'Sup Jagung Manis', confidence: 0.94, color: '#10B981', box: { x: 58, y: 18, w: 32, h: 35 } },
        { label: 'Nasi Putih', confidence: 0.97, color: '#3B82F6', box: { x: 20, y: 60, w: 35, h: 32 } }
      ],
      anomaly: null,
      macronutrients: {
        calories: 525,
        proteinG: 33,
        carbsG: 65,
        fatG: 14,
        fiberG: 5.6,
        tkpiScore: 98
      },
      aiNotes: 'Porsi tampak prima. Sedang dilakukan uji petik acak berkala kepatuhan SLHS Dinkes Makassar.'
    },
    overrideRecord: null,
    labAudit: {
      orderId: 'LAB-MKS-2026-081',
      dinkesOffice: 'Dinas Kesehatan Kota Makassar',
      labFacility: 'BBLKM Makassar (Labkesmas Regional 7)',
      samplingTarget: '3 Sampel Boks Acak (Uji Mikrobiologi Rutin)',
      status: 'sampel_diambil',
      pathogens: ['Escherichia coli', 'Salmonella sp.', 'Coliform Total'],
      orderTimestamp: '07:44:00 WITA',
      estimatedResult: '29 Sep 2026 (24 Jam Kultur)'
    }
  },
  {
    id: 'DEL-2026-JKT-1102',
    batchId: 'BTH-0848-TBT',
    school: 'SDN 05 Tebet Timur',
    npsn: '33.210.138',
    sppg: 'SPPG 01 Menteng Sentral',
    sppgCode: 'BGN-SPPG-001',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    validator: {
      name: 'Rahmat Hidayat, S.Pd',
      satgasId: 'BGN-VLD-0189',
      role: 'Operator Gizi Sekolah',
      device: 'iPhone 13 Pro'
    },
    scannedAt: '08:02:11 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.42,
    portions: 450,
    targetPortions: 450,
    thermal: {
      temp: 23.9,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'safe',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '28.0°C'
    },
    qrToken: {
      code: 'MBG-QR-7719-X89A-001', // Identical QR collision intentional
      status: 'duplicate_attempt',
      scanAttempts: 2,
      firstScannedAt: '07:12:45 WIB (di SDN 01 Menteng Pagi)',
      expiryWindow: '10:30 WIB',
      antiDuplicateHash: '9a8f2bc0e11849a99f123a41c9983de4'
    },
    cryptoProof: {
      sha256: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      blockHeight: 1849240,
      signedBy: 'KawanGizi-Notary-Edge-CGK01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Pulen, Ayam Panggang Madu, Capcay Brokoli & Pisang Ambon',
      packageType: 'Paket Gizi Seimbang SD',
      allergens: 'Bebas Kacang Tanah · Mengandung Wijen Alami',
      cookingCompletedAt: '06:15 WIB',
      shelfLifeLeftMinutes: 145
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 18,
      status: 'flagged',
      freshnessIndex: 96.0,
      confidenceScore: 98.4,
      detectedObjects: [
        { label: 'Ayam Panggang Madu', confidence: 0.98, color: '#10B981', box: { x: 18, y: 15, w: 38, h: 42 } },
        { label: 'Nasi Pulen', confidence: 0.99, color: '#3B82F6', box: { x: 18, y: 58, w: 36, h: 32 } }
      ],
      anomaly: {
        code: 'ANOM-DUPLICATE-QR',
        type: 'Pelanggaran Token Ganda (Anti-Duplicate QR Collision)',
        severity: 'critical',
        confidence: 100,
        riskDescription: 'Token QR ini terdeteksi telah dipindai sebelumnya pada jam 07:12 WIB di SDN 01 Menteng Pagi. Sistem mendeteksi upaya duplikasi boks atau pelabelan ganda.',
        actionNeeded: 'Tolak Penerimaan & Lakukan Investigasi Armada Ekspedisi'
      },
      macronutrients: {
        calories: 545,
        proteinG: 34,
        carbsG: 68,
        fatG: 14,
        fiberG: 6.2,
        tkpiScore: 100
      },
      aiNotes: 'SISTEM MENGUNCI PENERIMAAN: Token QR terdaftar sebagai duplikat aktif.'
    },
    overrideRecord: null,
    labAudit: null
  },
  {
    id: 'DEL-2026-SMG-9901',
    batchId: 'BTH-0849-SMG',
    school: 'SMPN 3 Semarang Barat',
    npsn: '33.210.136',
    sppg: 'SPPG Sentral Semarang Barat',
    sppgCode: 'BGN-SPPG-005',
    city: 'Kota Semarang',
    province: 'Jawa Tengah',
    validator: {
      name: 'Agus Purnomo, S.T',
      satgasId: 'BGN-VLD-0201',
      role: 'Tim Pengendalian Mutu MBG',
      device: 'Google Pixel 7a'
    },
    scannedAt: '07:22:15 WIB',
    scanDate: '28 Sep 2026',
    scanDurationSec: 0.68,
    portions: 510,
    targetPortions: 510,
    thermal: {
      temp: 26.2,
      targetRange: '20.0°C – 25.0°C',
      unit: '°C',
      status: 'warning',
      probeDevice: 'Testo 104-IR Calibrated',
      ambientTemp: '30.1°C'
    },
    qrToken: {
      code: 'MBG-QR-9901-SMG-007',
      status: 'verified',
      scanAttempts: 1,
      firstScannedAt: '07:22:15 WIB',
      expiryWindow: '10:15 WIB',
      antiDuplicateHash: '8c2299bc4e112830f0a4419de8112345'
    },
    cryptoProof: {
      sha256: '8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      blockHeight: 1849246,
      signedBy: 'KawanGizi-Notary-Edge-SRG01',
      algorithm: 'ECDSA-secp256k1 + SHA256'
    },
    menu: {
      name: 'Nasi Liwet Solo, Ayam Suwir Opor, Sambal Goreng Labu & Jeruk',
      packageType: 'Paket Tradisional Jawa Tengah',
      allergens: 'Santan Kelapa · Bebas Gluten',
      cookingCompletedAt: '06:05 WIB',
      shelfLifeLeftMinutes: 175
    },
    yolo: {
      modelVersion: 'YOLOv8x-FoodQuality-v2.4.1',
      inferenceLatencyMs: 16,
      status: 'verified',
      freshnessIndex: 98.9,
      confidenceScore: 99.4,
      detectedObjects: [
        { label: 'Ayam Suwir Opor', confidence: 0.99, color: '#10B981', box: { x: 20, y: 18, w: 35, h: 38 } },
        { label: 'Sambal Goreng Labu', confidence: 0.97, color: '#10B981', box: { x: 60, y: 18, w: 32, h: 36 } },
        { label: 'Nasi Liwet', confidence: 0.99, color: '#3B82F6', box: { x: 20, y: 60, w: 35, h: 32 } }
      ],
      anomaly: null,
      macronutrients: {
        calories: 520,
        proteinG: 30,
        carbsG: 64,
        fatG: 14,
        fiberG: 5.8,
        tkpiScore: 99
      },
      aiNotes: 'Kualitas hidangan opor dan labu siam sangat baik. Suhu armada agak hangat (+1.2°C di atas batas cold-chain).'
    },
    overrideRecord: null,
    labAudit: null
  }
]
