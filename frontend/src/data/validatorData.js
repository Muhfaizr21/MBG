/**
 * ==============================================================================
 * DATA MASTER: PORTAL VALIDATOR (GURU & STAF SEKOLAH — VALIDATOR LAPANGAN)
 * Berdasarkan VALIDATOR.md (6 modul) & sistem.md Bab 3.2.1 Profil #1.
 * Fitur: beranda armada/HACCP/kuota, pemindai AI dual-stage, serah terima BAST,
 * lapor insiden, riwayat pindai + rekonsiliasi kelas.
 * ==============================================================================
 */

export const VALIDATOR_SCHOOL = {
  school: 'SDN 01 Menteng Pagi',
  npsn: '33.210.130',
  city: 'Jakarta Pusat',
  sppg: 'SPPG 01 Menteng Sentral',
  sppgCode: 'BGN-SPPG-001',
  principal: 'Dra. Hj. Sri Wahyuni, M.Pd',
  headValidator: 'Dr. Hendra Prasetyo',
  satgasId: 'BGN-VLD-0042',
  gateWindow: '06:45 – 07:15 WIB',
}

// Pelacak armada logistik dapur SPPG menuju sekolah (VALIDATOR.md Bab 1.B.1)
export const FLEET_STATUS = {
  status: 'menuju', // menuju | tiba | tertunda
  statusLabel: 'Menuju Sekolah',
  plate: 'B-9281-KBA',
  unit: 'Armada B-9281-KBA',
  driver: 'Bpk. Mulyono',
  driverPhone: '+62 812-1100-4477',
  courier: 'Ekspedisi Dapur SPPG 01',
  eta: '07:10 WIB',
  departedAt: '06:22 WIB',
  route: 'Dapur SPPG Menteng → Gerbang SDN 01 Menteng Pagi',
  masterTotes: 13,
  portions: 650,
}

// HACCP 4-Hour Countdown (VALIDATOR.md Bab 1.B.2)
// Sisa detik disimpan sebagai angka tetap agar demo tidak tergantung jam sistem.
export const HACCP_TIMER = {
  cookedAt: '06:15 WIB',
  safeUntil: '10:15 WIB',
  windowMinutes: 240,
  secondsLeftSeed: 128 * 60 + 42, // 128 menit 42 detik tersisa pada saat demo dibuka
}

// Papan kuota porsi sekolah (VALIDATOR.md Bab 1.B.3)
export const QUOTA_BOARD = {
  targetPortions: 650, // 300 SD Bawah + 350 SD Atas
  validatedPortions: 410,
  rejectedPortions: 5,
  masterTotesTotal: 13,
  masterTotesReceived: 8,
  toteCapacity: 50,
  studentBreakdown: [
    { label: 'SD Bawah (Kelas 1–3)', value: 300 },
    { label: 'SD Atas (Kelas 4–6)', value: 350 },
  ],
}

// Daftar master tote kontainer termal (1 kontainer = 50 porsi)
export const MASTER_TOTES = Array.from({ length: 13 }, (_, i) => ({
  id: `TOT-${String(i + 1).padStart(2, '0')}`,
  qr: `MBG-2026-SPPG01-SDN01P-T${String(i + 1).padStart(2, '0')}`,
  portions: 50,
  tempCelsius: [64.5, 63.8, 65.1, 62.9, 64.2, 61.7, 63.4, 60.9][i] ?? null,
  status: i < 8 ? 'received' : 'pending', // received | pending | rejected
}))

// Tahapan pemindai dual-stage (VALIDATOR.md Bab 2)
export const SCAN_STAGES = [
  {
    id: 'qr',
    title: 'Tahap 1 · Pindai QR Kriptografis Boks',
    desc: 'Verifikasi asal SPPG, kesesuaian sekolah tujuan, stempel masak & suhu pelepasan (≥75°C).',
  },
  {
    id: 'visual',
    title: 'Tahap 2 · Inspeksi Visual AI (YOLOv8)',
    desc: 'Deteksi anomali fisik pembusukan, kematangan, dan benda asing pada konten piring.',
  },
]

// Hasil inspeksi sampel boks untuk kartu keputusan mutu (VALIDATOR.md Bab 2.B.3-4)
export const SCAN_SAMPLE_RESULTS = [
  {
    id: 'SCN-VLD-1006-014',
    boxId: 'BOK-01-4417',
    qrToken: 'MBG-2026-SPPG01-SDN01P-B17',
    batchId: 'BATCH-JKT-1006-05',
    scannedAt: '07:18 WIB',
    score: 97.6,
    verdict: 'layak', // layak | peringatan | tolak
    verdictLabel: 'LAYAK KONSUMSI',
    releaseTemp: 76.4,
    holdTemp: 63.2,
    checks: [
      { label: 'Nasi — warna & tekstur', ok: true, note: 'Pulen, tanpa titik jamur' },
      { label: 'Protein — warna & lendir', ok: true, note: 'Ayam matang merata, segar' },
      { label: 'Sayur — kekeruhan & layu', ok: true, note: 'Urap segar, kuah bening' },
      { label: 'Benda asing', ok: true, note: 'Tidak terdeteksi' },
    ],
    macros: { energy: 545, protein: 34, carbs: 68, fat: 14, fiber: 6.2 },
    note: 'Sampel lolos dua tahap verifikasi. Aman dibagikan ke kelas.',
  },
  {
    id: 'SCN-VLD-1006-015',
    boxId: 'BOK-01-4418',
    qrToken: 'MBG-2026-SPPG01-SDN01P-B18',
    batchId: 'BATCH-JKT-1006-05',
    scannedAt: '07:21 WIB',
    score: 88.2,
    verdict: 'peringatan', // layak | peringatan | tolak
    verdictLabel: 'KONSUMSI SEGERA',
    releaseTemp: 75.9,
    holdTemp: 58.4,
    checks: [
      { label: 'Nasi — warna & tekstur', ok: true, note: 'Normal' },
      { label: 'Protein — warna & lendir', ok: true, note: 'Normal' },
      { label: 'Suhu holding boks', ok: false, note: '58.4°C — di bawah ambang 60°C' },
      { label: 'Benda asing', ok: true, note: 'Tidak terdeteksi' },
    ],
    macros: { energy: 545, protein: 34, carbs: 68, fat: 14, fiber: 6.2 },
    note: 'Suhu boks mendekati batas kritis. Instruksikan pembagian segera ke kelas.',
  },
  {
    id: 'SCN-VLD-1006-016',
    boxId: 'BOK-01-4419',
    qrToken: 'MBG-2026-SPPG01-SDN01P-B19',
    batchId: 'BATCH-JKT-1006-05',
    scannedAt: '07:24 WIB',
    score: 72.5,
    verdict: 'tolak', // layak | peringatan | tolak
    verdictLabel: 'TIDAK LAYAK KONSUMSI',
    releaseTemp: 74.2,
    holdTemp: 49.8,
    checks: [
      { label: 'Nasi — warna & tekstur', ok: false, note: 'Titik kekuningan diduga jamur' },
      { label: 'Protein — warna & lendir', ok: true, note: 'Normal' },
      { label: 'Suhu holding boks', ok: false, note: '49.8°C — zona bahaya < 55°C' },
      { label: 'Benda asing', ok: false, note: 'Serpihan plastik terdeteksi' },
    ],
    macros: { energy: 545, protein: 34, carbs: 68, fat: 14, fiber: 6.2 },
    note: 'Boks dikunci otomatis. Amankan sampel & ajukan laporan insiden.',
  },
]

// Log pindai hari ini (untuk halaman pemindai & riwayat)
export const TODAY_SCAN_LOG = [
  {
    id: 'SCN-VLD-1006-011',
    time: '07:05 WIB',
    boxId: 'BOK-01-4414',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR + Visual',
    status: 'verified',
    statusLabel: 'Lolos Verifikasi',
    temp: 64.1,
    score: 96.8,
    classTarget: 'Kelas 1A',
  },
  {
    id: 'SCN-VLD-1006-012',
    time: '07:12 WIB',
    boxId: 'BOK-01-4415',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR + Visual',
    status: 'verified',
    statusLabel: 'Lolos Verifikasi',
    temp: 63.5,
    score: 95.2,
    classTarget: 'Kelas 1B',
  },
  {
    id: 'SCN-VLD-1006-013',
    time: '07:16 WIB',
    boxId: 'BOK-01-4416',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR',
    status: 'verified',
    statusLabel: 'Lolos Verifikasi',
    temp: 62.8,
    score: null,
    classTarget: 'Kelas 2A',
  },
  {
    id: 'SCN-VLD-1006-014',
    time: '07:18 WIB',
    boxId: 'BOK-01-4417',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR + Visual',
    status: 'verified',
    statusLabel: 'Lolos Verifikasi',
    temp: 63.2,
    score: 97.6,
    classTarget: 'Kelas 2B',
  },
  {
    id: 'SCN-VLD-1006-015',
    time: '07:21 WIB',
    boxId: 'BOK-01-4418',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR + Visual',
    status: 'warning',
    statusLabel: 'Peringatan Suhu',
    temp: 58.4,
    score: 88.2,
    classTarget: 'Kelas 3A',
  },
  {
    id: 'SCN-VLD-1006-016',
    time: '07:24 WIB',
    boxId: 'BOK-01-4419',
    batchId: 'BATCH-JKT-1006-05',
    stage: 'QR + Visual',
    status: 'rejected',
    statusLabel: 'Ditolak Sistem',
    temp: 49.8,
    score: 72.5,
    classTarget: 'Kelas 3B',
  },
]

// Rekonsiliasi distribusi per kelas (VALIDATOR.md Bab 5.B.2)
export const CLASS_RECAP = [
  { className: 'Kelas 1A', quota: 28, present: 27, sick: 1, permit: 0, handed: 27, leftover: 1 },
  { className: 'Kelas 1B', quota: 30, present: 30, sick: 0, permit: 0, handed: 30, leftover: 0 },
  { className: 'Kelas 2A', quota: 29, present: 29, sick: 0, permit: 0, handed: 29, leftover: 0 },
  { className: 'Kelas 2B', quota: 30, present: 28, sick: 2, permit: 0, handed: 28, leftover: 2 },
  { className: 'Kelas 3A', quota: 29, present: 29, sick: 0, permit: 0, handed: 29, leftover: 0 },
  { className: 'Kelas 3B', quota: 30, present: 27, sick: 2, permit: 1, handed: 27, leftover: 3 },
  { className: 'Kelas 4A', quota: 32, present: 32, sick: 0, permit: 0, handed: 32, leftover: 0 },
  { className: 'Kelas 4B', quota: 31, present: 30, sick: 1, permit: 0, handed: 30, leftover: 1 },
  { className: 'Kelas 5A', quota: 30, present: 29, sick: 1, permit: 0, handed: 29, leftover: 1 },
  { className: 'Kelas 5B', quota: 31, present: 31, sick: 0, permit: 0, handed: 31, leftover: 0 },
  { className: 'Kelas 6A', quota: 28, present: 28, sick: 0, permit: 0, handed: 28, leftover: 0 },
  { className: 'Kelas 6B', quota: 29, present: 27, sick: 1, permit: 1, handed: 27, leftover: 2 },
]

// Opsi alokasi porsi sisa sesuai regulasi BGN (VALIDATOR.md Bab 5.B.3)
export const SURPLUS_OPTIONS = [
  { id: 'staff', label: 'Diserahkan kepada staf kebersihan / penjaga sekolah' },
  { id: 'afternoon', label: 'Disimpan SOP untuk program makanan tambahan sore hari' },
  { id: 'redistribute', label: 'Dialokasikan ke kelas dengan siswa berkebutuhan khusus' },
  { id: 'dispose', label: 'Dimusnahkan (porsi tidak layak simpan)' },
]

// Filter riwayat (VALIDATOR.md Bab 5.B.4)
export const HISTORY_FILTERS = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: '7d', label: '7 Hari Lalu' },
  { id: 'month', label: 'Bulan Ini' },
]

// Kategori insiden terstruktur (VALIDATOR.md Bab 4.B.1)
export const INCIDENT_CATEGORIES = [
  { id: 'sour', label: 'Aroma Asam / Basi', desc: 'Makanan mengeluarkan bau menyengat atau berbusa.' },
  { id: 'foreign', label: 'Benda Asing', desc: 'Serangga, rambut, kawat, serpihan plastik, krikil.' },
  { id: 'undercooked', label: 'Kematangan Tidak Sempurna', desc: 'Daging/ayam masih berdarah atau mentah di bagian dalam.' },
  { id: 'temp_drop', label: 'Suhu Drop & Basi Logistik', desc: 'Suhu boks dingin saat tiba di sekolah (< 50°C).' },
  { id: 'packaging', label: 'Kemasan Pecah / Bocor', desc: 'Segel terbuka dan makanan tumpah tercemar.' },
  { id: 'allergy', label: 'Reaksi Alergi / Siswa Mengeluh Sakit', desc: 'Siswa mengeluh gatal, pusing, mual pasca mencicipi.' },
]

// Derajat keparahan (VALIDATOR.md Bab 4.B.3)
export const SEVERITY_LEVELS = [
  { id: 'low', label: 'Rendah', color: 'amber', desc: 'Porsi terisolasi / kemasan pecah — sisihkan 1–2 boks, ganti porsi cadangan.' },
  { id: 'medium', label: 'Sedang', color: 'orange', desc: 'Kekurangan porsi / keterlambatan pengiriman > 30 menit.' },
  { id: 'high', label: 'Tinggi / Darurat Merah', color: 'rose', desc: 'Kontaminasi sistemik / bau basi massal — push sirene Satgas & isolasi seluruh boks.' },
]

// Protokol tindakan pertama bagi guru (VALIDATOR.md Bab 4.B.4)
export const PROTOCOL_STEPS = [
  'Amankan dan pisahkan boks bermasalah dari jangkauan anak-anak.',
  'Masukkan 1 sampel ke dalam plastik steril untuk uji laboratorium.',
  'Berikan air putih matang kepada siswa jika sempat mencicipi dan bawa ke ruang UKS.',
]

// Pelacak status tiket insiden (VALIDATOR.md Bab 4.B.5)
export const INCIDENT_TICKETS = [
  {
    id: 'INS/JKT/1006/03',
    category: 'Kemasan Pecah / Bocor',
    severity: 'low',
    severityLabel: 'Rendah',
    openedAt: '06:58 WIB',
    status: 'resolved',
    statusLabel: 'Selesai',
    handler: 'Satgas MBG Wilayah Jakarta Pusat',
    timeline: [
      { label: 'Terkirim', time: '06:58 WIB', done: true },
      { label: 'Diinvestigasi Tim Medis', time: '07:05 WIB', done: true },
      { label: 'Pasokan Pengganti Dikirim', time: '07:19 WIB', done: true },
      { label: 'Selesai', time: '07:41 WIB', done: true },
    ],
    note: 'Dua boks rusak fisik saat pengangkutan, diganti porsi cadangan dari dapur.',
  },
  {
    id: 'INS/JKT/1006/04',
    category: 'Suhu Drop & Basi Logistik',
    severity: 'medium',
    severityLabel: 'Sedang',
    openedAt: '07:26 WIB',
    status: 'in_progress',
    statusLabel: 'Sedang Ditindaklanjuti',
    handler: 'Manajer Dapur SPPG 01 Menteng Sentral',
    timeline: [
      { label: 'Terkirim', time: '07:26 WIB', done: true },
      { label: 'Diinvestigasi Tim Medis', time: '07:31 WIB', done: true },
      { label: 'Pasokan Pengganti Dikirim', time: '07:44 WIB', done: false },
      { label: 'Selesai', time: '—', done: false },
    ],
    note: 'BOK-01-4419 ditahan (skor 72.5). Menunggu pengiriman 50 porsi cadangan.',
  },
]

// Kontak darurat (VALIDATOR.md Bab 6.B.3)
export const EMERGENCY_CONTACTS = [
  { id: 'callcenter', label: 'Call Center Satgas MBG Wilayah', detail: '24 Jam', phone: '0800-123-4567' },
  { id: 'kitchen', label: 'Kepala Dapur SPPG 01 Menteng Sentral', detail: 'Bpk. Agus Setiawan', phone: '+62 811-9001-220' },
  { id: 'puskesmas', label: 'Puskesmas Menteng (Rujukan Gawat Darurat)', detail: 'IGD 24 Jam', phone: '(021) 392-1111' },
]

// Ringkasan hari untuk kartu cepat
export const VALIDATOR_STATS = {
  boxesScanned: TODAY_SCAN_LOG.length,
  verifiedRate: 83.3,
  avgScore: 88.1,
  avgTemp: 60.3,
  rejectedBoxes: 1,
  surplusPortions: CLASS_RECAP.reduce((sum, c) => sum + c.leftover, 0),
}
