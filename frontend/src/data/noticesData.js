/**
 * ==============================================================================
 * DATA PAPAN PENGUMUMAN SATGAS MBG (NATIONAL COMMAND BROADCAST ENGINE)
 * Berdasarkan Bab 4.2 Spesifikasi Superadmin & Komunikasi Terpadu
 * Urgensi:
 * 1. Info Biasa (General Information / Circular)
 * 2. Penting (Priority Notice / Seasonal Advisory)
 * 3. Panggilan Darurat / Flash Alert (Mandatory Acknowledge before Scanner Opens)
 * ==============================================================================
 */

export const NOTICE_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'circular', label: 'Surat Edaran BGN' },
  { id: 'seasonal', label: 'Peringatan Higienitas Musiman' },
  { id: 'system', label: 'Pembaruan Sistem & AI' }
]

export const TARGET_AUDIENCES = [
  { id: 'all', label: 'Semua Pihak (Nasional)' },
  { id: 'validators', label: 'Hanya Guru Validator Sekolah' },
  { id: 'sppg', label: 'Hanya Dapur SPPG & Katering' }
]

export const URGENCY_LEVELS = [
  { id: 'info', label: 'Info Biasa', badgeColor: 'blue' },
  { id: 'important', label: 'Penting', badgeColor: 'amber' },
  { id: 'critical', label: 'Panggilan Darurat (Flash Alert)', badgeColor: 'rose' }
]

export const INITIAL_NOTICES_LIST = [
  {
    id: 'NOT-2026-001',
    refNumber: 'BGN/SE/084/IX/2026',
    title: 'Peringatan Darurat: Penarikan Sementara Menu Olahan Kerang & Telur Puyuh SPPG Surabaya',
    category: 'seasonal',
    categoryLabel: 'Peringatan Higienitas Musiman',
    urgency: 'critical',
    urgencyLabel: 'Panggilan Darurat (Flash Alert)',
    targetAudience: 'all',
    targetAudienceLabel: 'Semua Pihak (Nasional)',
    scopeRegion: 'Jawa Timur & Koridor Surabaya',
    publishedAt: '28 Sep 2026, 06:15 WIB',
    effectiveDate: 'Berlaku Segera s.d 30 Sep 2026',
    author: {
      name: 'Dr. apt. Hendra Gunawan, M.Epid',
      role: 'Direktur Kepatuhan Mutu & Keamanan Pangan BGN'
    },
    content: `Ditemukan indikasi kontaminasi cemaran mikrobiologis pada pasokan bahan baku kerang air tawar dan telur puyuh di klaster Jawa Timur. Seluruh Dapur SPPG diinstruksikan MENIADAKAN menu olahan tersebut dan menggantinya dengan daging ayam potong segar terakreditasi NKV.

Seluruh Guru Validator diwajibkan memeriksa boks makanan yang tiba. Jika ditemukan olahan kerang/puyuh, segera tolak boks makanan pada aplikasi dan berikan label *HOLD - UJI LAB*. Notifikasi ini wajib dikonfirmasi (*tap to acknowledge*) sebelum kamera pemindai dapat digunakan.`,
    isFlashAlert: true,
    requiresAcknowledgement: true,
    acknowledgementStats: {
      totalRecipients: 420,
      acknowledgedCount: 398,
      complianceRate: 94.8
    },
    attachments: [
      {
        fileName: 'Surat_Edaran_Darurat_BGN_084_Penarikan_Bahan.pdf',
        fileSize: '1.4 MB',
        verifiedSignature: 'Belum diverifikasi'
      }
    ],
    status: 'active',
    statusLabel: 'Tayang Publik'
  },
  {
    id: 'NOT-2026-002',
    refNumber: 'BGN/SE/079/IX/2026',
    title: 'Surat Edaran BGN: Protokol Uji Suhu Termal Inti Makanan Min 60°C Saat Serah Terima',
    category: 'circular',
    categoryLabel: 'Surat Edaran BGN',
    urgency: 'important',
    urgencyLabel: 'Penting',
    targetAudience: 'validators',
    targetAudienceLabel: 'Hanya Guru Validator Sekolah',
    scopeRegion: 'Nasional (Seluruh Satuan Pendidikan)',
    publishedAt: '26 Sep 2026, 14:00 WIB',
    effectiveDate: 'Berlaku Permanen',
    author: {
      name: 'Prof. Dr. Ir. Siti Nurjanah, M.Sc',
      role: 'Kepala Badan Gizi Nasional (BGN)'
    },
    content: `Berdasarkan evaluasi mingguan Satgas MBG, ditemukan potensi penurunan suhu makanan jika boks didiamkan lebih dari 45 menit tanpa tutup berinsulasi. 

Validator diinstruksikan memastikan termometer infrared menembus uap makanan dengan suhu inti minimal 60°C. Makanan di bawah 50°C wajib dipisahkan dan diuji organoleptik lanjutan untuk mencegah pertumbuhan spora Bacillus cereus.`,
    isFlashAlert: false,
    requiresAcknowledgement: true,
    acknowledgementStats: {
      totalRecipients: 1250,
      acknowledgedCount: 1195,
      complianceRate: 95.6
    },
    attachments: [
      {
        fileName: 'Pedoman_Suhu_Termal_Inti_MBG_Rev3.pdf',
        fileSize: '2.8 MB',
        verifiedSignature: 'Belum diverifikasi'
      }
    ],
    status: 'active',
    statusLabel: 'Tayang Publik'
  },
  {
    id: 'NOT-2026-003',
    refNumber: 'MBG/SYS/042/IX/2026',
    title: 'Pembaruan Sistem: Rilis AI Vision YOLOv8x v2.4 & Jadwal Pemeliharaan Server Tengah Malam',
    category: 'system',
    categoryLabel: 'Pembaruan Sistem & AI',
    urgency: 'info',
    urgencyLabel: 'Info Biasa',
    targetAudience: 'all',
    targetAudienceLabel: 'Semua Pihak (Nasional)',
    scopeRegion: 'Seluruh Indonesia',
    publishedAt: '25 Sep 2026, 10:30 WIB',
    effectiveDate: '29 Sep 2026, 01:00 – 03:00 WIB',
    author: {
      name: 'Tim Arsitektur Komputasi KawanGizi',
      role: 'Pusat Operasi TI & AI Satgas MBG'
    },
    content: `Kami akan melakukan pemeliharaan server database terdistribusi pada hari Selasa, 29 September 2026 pukul 01:00 – 03:00 WIB (dini hari).

Pembaruan ini mencakup:
1. Peningkatan akurasi inferensi AI YOLOv8x pada kondisi pencahayaan rendah di ruang UKS sekolah.
2. Sinkronisasi token QR asimetris ECDSA yang 40% lebih cepat saat jaringan seluler 3G/Edge.
3. Seluruh sesi masak dan pengiriman subuh jam 04:30 WIB dipastikan berjalan normal tanpa gangguan.`,
    isFlashAlert: false,
    requiresAcknowledgement: false,
    acknowledgementStats: {
      totalRecipients: 3400,
      acknowledgedCount: 2980,
      complianceRate: 87.6
    },
    attachments: [
      {
        fileName: 'Changelog_YOLOv8x_MBG_v2.4_ReleaseNotes.pdf',
        fileSize: '820 KB',
        verifiedSignature: 'Belum diverifikasi'
      }
    ],
    status: 'active',
    statusLabel: 'Tayang Publik'
  },
  {
    id: 'NOT-2026-004',
    refNumber: 'BGN/ADV/018/IX/2026',
    title: 'Advis Musim Pancaroba: Peningkatan Standar Filtrasi Air & Sanitasi Talenan Dapur SPPG',
    category: 'seasonal',
    categoryLabel: 'Peringatan Higienitas Musiman',
    urgency: 'important',
    urgencyLabel: 'Penting',
    targetAudience: 'sppg',
    targetAudienceLabel: 'Hanya Dapur SPPG & Katering',
    scopeRegion: 'Wilayah Barat & Tengah Indonesia',
    publishedAt: '24 Sep 2026, 09:15 WIB',
    effectiveDate: '24 Sep – 15 Okt 2026',
    author: {
      name: 'dr. Yudhi Prasetiyo, Sp.Ok',
      role: 'Ketua Tim Audit SLHS & Sanitasi Dapur BGN'
    },
    content: `Memasuki masa peralihan musim hujan, tingkat kekeruhan air tanah dan risiko cemaran coliform meningkat hingga 35%. 

Semua Dapur SPPG wajib menerapkan:
1. Pengecekan lampu UV sterilizer air minum dan filter karbon aktif setiap 3 hari sekali.
2. Pemisahan ketat talenan warna merah (daging mentah), kuning (unggas), hijau (sayuran), dan putih (makanan matang).
3. Pengujian mikrobiologi mandiri mingguan dengan swab test swab kit resmi Dinkes setempat.`,
    isFlashAlert: false,
    requiresAcknowledgement: true,
    acknowledgementStats: {
      totalRecipients: 180,
      acknowledgedCount: 172,
      complianceRate: 95.5
    },
    attachments: [
      {
        fileName: 'Instruksi_Audit_Sanitasi_Pancaroba_Dapur_SPPG.pdf',
        fileSize: '3.1 MB',
        verifiedSignature: 'Belum diverifikasi'
      }
    ],
    status: 'active',
    statusLabel: 'Tayang Publik'
  },
  {
    id: 'NOT-2026-005',
    refNumber: 'KEMENDIKBUD/SE/312/2026',
    title: 'Surat Edaran Kemendikbud: Integrasi Data Presensi Siswa Dapodik dengan Kuota Makan MBG',
    category: 'circular',
    categoryLabel: 'Surat Edaran BGN',
    urgency: 'info',
    urgencyLabel: 'Info Biasa',
    targetAudience: 'validators',
    targetAudienceLabel: 'Hanya Guru Validator Sekolah',
    scopeRegion: 'Nasional',
    publishedAt: '22 Sep 2026, 11:00 WIB',
    effectiveDate: 'Berlaku Semester Genap 2026',
    author: {
      name: 'Direktorat Jenderal PAUD Dikdasmen',
      role: 'Kemendikbudristek RI'
    },
    content: `Pemberitahuan kepada seluruh satuan pendidikan jenjang SD dan SMP penerima MBG agar menyinkronkan data presensi siswa di kelas sebelum jam 10:00 WIB setiap harinya. 

Data presensi riil ini langsung terhubung dengan sistem MBG untuk kalkulasi porsi harian otomatis H+1, guna menjamin efisiensi APBN dan meminimalkan sisa porsi yang tidak termakan.`,
    isFlashAlert: false,
    requiresAcknowledgement: false,
    acknowledgementStats: {
      totalRecipients: 1250,
      acknowledgedCount: 1180,
      complianceRate: 94.4
    },
    attachments: [
      {
        fileName: 'Juknis_Sinkronisasi_Dapodik_MBG_2026.pdf',
        fileSize: '1.9 MB',
        verifiedSignature: 'Belum diverifikasi'
      }
    ],
    status: 'active',
    statusLabel: 'Tayang Publik'
  },
  {
    id: 'NOT-2026-006',
    refNumber: 'BGN/SE/066/VIII/2026',
    title: 'Maklumat Kedaluwarsa: Pedoman Menu Khusus Uji Coba Katering Wilayah 3T Tahap 1',
    category: 'circular',
    categoryLabel: 'Surat Edaran BGN',
    urgency: 'info',
    urgencyLabel: 'Info Biasa',
    targetAudience: 'all',
    targetAudienceLabel: 'Semua Pihak (Nasional)',
    scopeRegion: 'Wilayah Tertinggal, Terdepan, dan Terluar (3T)',
    publishedAt: '15 Agu 2026, 08:00 WIB',
    effectiveDate: 'Berakhir 31 Agu 2026',
    author: {
      name: 'Sekretariat Satgas MBG Pusat',
      role: 'Satuan Pelayanan Pangan Bergizi'
    },
    content: `Pedoman alokasi menu sementara pada masa uji coba rantai pasok daerah kepulauan dan pedalaman telah resmi digantikan oleh Pedoman Standar Porsi Nasional MBG Rev 3. Arsip ini disimpan sebagai rekaman kepatuhan historis.`,
    isFlashAlert: false,
    requiresAcknowledgement: false,
    acknowledgementStats: {
      totalRecipients: 800,
      acknowledgedCount: 760,
      complianceRate: 95.0
    },
    attachments: [],
    status: 'archived',
    statusLabel: 'Diarsipkan'
  }
]
