/**
 * ==============================================================================
 * DATA MOCK PORTAL DAPUR SPPG (SATUAN PELAYANAN PANGAN BERGIZI)
 * Single Source of Truth untuk Operasional Harian Dapur Sentral
 * Sesuai Dokumen SPPG.md & sistem.md Bab 3.2.1
 * ==============================================================================
 */

export const SPPG_PROFILE = {
  id: 'SPPG-01-JKT',
  code: 'SPPG-01',
  name: 'SPPG 01 Menteng Jaya Mandiri',
  cluster: 'DKI Jakarta · Koridor Pusat & Selatan',
  address: 'Jl. Pegangsaan Barat No. 14, Menteng, Jakarta Pusat',
  licenseNo: 'SLHS-DKI/2026/0491-BGN',
  halalId: 'ID31110008492010926',
  headChef: '[Nama Kepala Dapur]',
  nutritionist: '[Nama Ahli Gizi]',
  dailyCapacity: 2500,
  activeSchoolsCount: 4,
  activeFleetsCount: 4,
}

// 4 Pipeline Stages (Sesuai SPPG.md Poin 1.B.1)
export const INITIAL_PIPELINE_STAGES = [
  {
    id: 'stage-1',
    stageNumber: 1,
    title: 'Bahan Baku',
    subtitle: 'Inspeksi & Timbang',
    timeWindow: '03:30 – 04:30 WIB',
    status: 'completed', // 'completed' | 'active' | 'upcoming'
    statusLabel: 'Selesai 100%',
    metricValue: '480 kg',
    metricUnit: 'terverifikasi',
    progress: 100,
    icon: 'PackageCheck',
  },
  {
    id: 'stage-2',
    stageNumber: 2,
    title: 'Pengolahan & Masak',
    subtitle: 'Suhu Inti >75°C',
    timeWindow: '04:30 – 06:00 WIB',
    status: 'active', // Currently active cooking session
    statusLabel: 'Sedang Berlangsung',
    metricValue: '2.500',
    metricUnit: 'porsi di kuali',
    progress: 78,
    icon: 'Flame',
  },
  {
    id: 'stage-3',
    stageNumber: 3,
    title: 'Pengemasan & QR',
    subtitle: 'Segel Termal >60°C',
    timeWindow: '06:00 – 06:45 WIB',
    status: 'upcoming',
    statusLabel: 'Siap Dimulai',
    metricValue: '50 Boks',
    metricUnit: 'kontainer master',
    progress: 0,
    icon: 'QrCode',
  },
  {
    id: 'stage-4',
    stageNumber: 4,
    title: 'Pengiriman Armada',
    subtitle: 'Batas Tempuh 45 Mnt',
    timeWindow: '06:45 – 07:30 WIB',
    status: 'upcoming',
    statusLabel: 'Antrean Siaga',
    metricValue: '4 Mobil',
    metricUnit: 'berinsulasi',
    progress: 0,
    icon: 'Truck',
  },
]

// Real-time Temperature & Quality Telemetry (HACCP CCP)
export const INITIAL_TELEMETRY = {
  coreCookingTemp: 78.5, // Wajib >= 75°C (Steril Salmonella/E.Coli)
  holdingTemp: 64.2, // Wajib >= 60°C sebelum disegel
  coldStorageTemp: 4.1, // Buah & susu pasteurisasi 4-8°C
  ambientKitchenHumidity: 48, // % kelembapan udara dapur
  sensoryScore: 98.4, // % uji rasa & aroma ahli gizi
}

// HACCP 4-Hour Critical Countdown Timer
export const INITIAL_HACCP_TIMER = {
  cookingFinishedAt: '06:00 WIB',
  mustConsumeBefore: '10:00 WIB',
  totalSafetyMinutes: 240, // 4 hours
  elapsedMinutes: 75,
  remainingMinutes: 165, // 2 Jam 45 Menit tersisa
  freshnessPercent: 68.8,
  status: 'SAFE', // 'SAFE' | 'WARNING' | 'EXPIRED'
}

// Hourly Production & Logistics Volume Chart
export const HOURLY_PRODUCTION_CHART = [
  { hour: '04:00', targetPorsi: 0, masakPorsi: 350, kirimPorsi: 0 },
  { hour: '05:00', targetPorsi: 600, masakPorsi: 1200, kirimPorsi: 0 },
  { hour: '06:00', targetPorsi: 1800, masakPorsi: 2450, kirimPorsi: 400 },
  { hour: '07:00', targetPorsi: 2500, masakPorsi: 2500, kirimPorsi: 1950 },
  { hour: '08:00', targetPorsi: 2500, masakPorsi: 2500, kirimPorsi: 2500 },
]

// Connected Kitchen IoT & Smart Devices
export const KITCHEN_DEVICES = [
  {
    id: 'dev-1',
    name: 'Probe Termometer IoT',
    type: 'Sensor Suhu Inti',
    status: 'online',
    reading: '78.5°C',
    color: 'emerald',
    icon: 'Thermometer',
  },
  {
    id: 'dev-2',
    name: 'Printer Label QR',
    type: 'Thermal 80mm BT',
    status: 'online',
    reading: 'Kertas 92%',
    color: 'blue',
    icon: 'Printer',
  },
  {
    id: 'dev-3',
    name: 'Segel Boks Termal',
    type: 'Smart Totes RFID',
    status: 'online',
    reading: '4/4 Terkunci',
    color: 'indigo',
    icon: 'ShieldCheck',
  },
  {
    id: 'dev-4',
    name: 'GPS Telemetri Armada',
    type: '4 Armada Mobil',
    status: 'online',
    reading: '4 Siap Jalan',
    color: 'amber',
    icon: 'Radio',
  },
]

// Today's 4 Assigned Schools & Delivery Manifest
export const ASSIGNED_SCHOOLS_MANIFEST = [
  {
    id: 'sch-01',
    name: 'SDN Menteng 01 Pagi',
    npsn: '20108901',
    distance: '2.8 km (12 mnt)',
    quota: 650,
    status: 'Memasak',
    badgeColor: 'amber',
    fleet: 'Armada B-9281-KBA',
    driver: '[Nama Sopir] (0000-0000-0000)',
    picTeacher: '[Nama Guru PIC]',
  },
  {
    id: 'sch-02',
    name: 'SDN Pegangsaan 02',
    npsn: '20108902',
    distance: '3.4 km (15 mnt)',
    quota: 550,
    status: 'Memasak',
    badgeColor: 'amber',
    fleet: 'Armada B-9412-UBC',
    driver: '[Nama Sopir] (0000-0000-0000)',
    picTeacher: '[Nama Guru PIC]',
  },
  {
    id: 'sch-03',
    name: 'SMPN 3 Jakarta',
    npsn: '20108903',
    distance: '4.1 km (18 mnt)',
    quota: 750,
    status: 'Memasak',
    badgeColor: 'amber',
    fleet: 'Armada B-9033-TKA',
    driver: '[Nama Sopir] (0000-0000-0000)',
    picTeacher: '[Nama Guru PIC]',
  },
  {
    id: 'sch-04',
    name: 'SDN Cikini 01',
    npsn: '20108904',
    distance: '4.8 km (21 mnt)',
    quota: 550,
    status: 'Memasak',
    badgeColor: 'amber',
    fleet: 'Armada B-9102-PKM',
    driver: '[Nama Sopir] (0000-0000-0000)',
    picTeacher: '[Nama Guru PIC]',
  },
]

// Today's Menu Recipe (Siklus BGN Paket A)
export const TODAY_MENU_RECIPE = {
  code: 'PAKET-A-01',
  name: 'Nasi Ayam Panggang Madu & Capcay Brokoli Segar',
  calories: 545,
  protein: 34,
  carbs: 68,
  fat: 14,
  fiber: 6.2,
  items: [
    { ingredient: 'Beras Pulen Organik Lokal', qty: '375 kg', perPortion: '150 g' },
    { ingredient: 'Ayam Potong Segar Ber-NKV', qty: '200 kg', perPortion: '80 g' },
    { ingredient: 'Brokoli & Wortel Petani Mitra', qty: '187.5 kg', perPortion: '75 g' },
    { ingredient: 'Tahu Kedelai Non-GMO', qty: '125 kg', perPortion: '50 g' },
    { ingredient: 'Pisang Cavendish Masak Pohon', qty: '2.500 buah', perPortion: '1 buah' },
    { ingredient: 'Susu UHT Pasteurisasi 125ml', qty: '2.500 kotak', perPortion: '1 kotak' },
  ],
}

// ==============================================================================
// MULTI-DIMENSIONAL OPERATIONAL ANALYTICS DATASETS (SPPG KITCHEN COCKPIT)
// ==============================================================================

// 1. Dimensi Waktu & Aliran Masak (Flow Timeline & HACCP 4-Hour Limit)
export const SPPG_FLOW_TIMELINE_DATA = [
  { time: '03:30', porsiMasak: 0, porsiKemas: 0, porsiKirim: 0, stage: 'Persiapan Bahan' },
  { time: '04:30', porsiMasak: 450, porsiKemas: 0, porsiKirim: 0, stage: 'Mulai Masak Kuali' },
  { time: '05:15', porsiMasak: 1450, porsiKemas: 250, porsiKirim: 0, stage: 'Pengolahan Lanjut' },
  { time: '06:00', porsiMasak: 2500, porsiKemas: 1250, porsiKirim: 0, stage: 'Masak Selesai (Timer Awal)' },
  { time: '06:45', porsiMasak: 2500, porsiKemas: 2500, porsiKirim: 1200, stage: 'Armada Berangkat' },
  { time: '07:15', porsiMasak: 2500, porsiKemas: 2500, porsiKirim: 2500, stage: 'Tiba & Pindai BAST' },
  { time: '08:00', porsiMasak: 2500, porsiKemas: 2500, porsiKirim: 2500, stage: 'Sarapan Siswa' },
  { time: '10:00', porsiMasak: 2500, porsiKemas: 2500, porsiKirim: 2500, stage: 'Batas Kritis 4 Jam' },
]

// 2. Dimensi Nutrisi & Porsi Hidangan (Macro & Nutrient Compliance vs AKG)
export const SPPG_NUTRITION_ACCURACY_DATA = [
  { nutrient: 'Energi', actual: 545, target: 550, unit: 'kkal', compliance: 99.1 },
  { nutrient: 'Protein', actual: 34.2, target: 30.0, unit: 'g', compliance: 114.0 },
  { nutrient: 'Karbohidrat', actual: 68.4, target: 70.0, unit: 'g', compliance: 97.7 },
  { nutrient: 'Lemak', actual: 14.1, target: 15.0, unit: 'g', compliance: 94.0 },
  { nutrient: 'Serat Pangan', actual: 7.2, target: 6.0, unit: 'g', compliance: 120.0 },
]

// 3. Dimensi Sebaran Sekolah & Rute (School Distribution & Fleet Fulfillment)
export const SPPG_SCHOOL_DISTRIBUTION_DATA = [
  { school: 'SDN Menteng 01', quota: 650, capacity: 650, distanceKm: 2.8, estMins: 12, fleet: 'Armada 01', status: 'Tiba & BAST' },
  { school: 'SDN Pegangsaan 02', quota: 550, capacity: 550, distanceKm: 3.4, estMins: 15, fleet: 'Armada 02', status: 'Tiba & BAST' },
  { school: 'SMPN 3 Jakarta', quota: 750, capacity: 750, distanceKm: 4.1, estMins: 18, fleet: 'Armada 03', status: 'Tiba & BAST' },
  { school: 'SDN Cikini 01', quota: 550, capacity: 550, distanceKm: 4.8, estMins: 21, fleet: 'Armada 04', status: 'Transit Terakhir' },
]

// 4. Dimensi Personil Dapur & Penanggung Jawab (Team Allocation & Workload)
export const SPPG_TEAM_ALLOCATION_DATA = [
  { name: 'Pengolahan & Masak', count: 8, pct: 28.6, lead: '[Nama Penanggung]', task: 'Kuali Masak & Suhu Inti', color: '#23259C' },
  { name: 'Pengemasan & QR', count: 12, pct: 42.8, lead: '[Nama Penanggung]', task: 'Segel RFID & Master Totes', color: '#10B981' },
  { name: 'Logistik & Supir', count: 4, pct: 14.3, lead: '[Nama Penanggung]', task: 'Armada Berinsulasi & Rute', color: '#3B82F6' },
  { name: 'Koordinator Sekolah', count: 4, pct: 14.3, lead: 'Guru Koordinator BAST', task: 'Pindai QR & Organoleptik', color: '#F59E0B' },
]

// 5. Dimensi Kendali Mutu & Titik Kritis (Critical Control Points Compliance)
export const SPPG_QUALITY_CONTROL_DATA = [
  { ccp: 'Suhu Inti Masak (>75°C)', score: 100.0, threshold: 95.0, status: 'Lolos Steril', riskCategory: 'Mikrobiologis' },
  { ccp: 'Suhu Holding Boks (>60°C)', score: 99.4, threshold: 95.0, status: 'Termal Terjaga', riskCategory: 'Suhu Lingkungan' },
  { ccp: 'Integritas Segel & QR', score: 100.0, threshold: 95.0, status: 'Terkunci 100%', riskCategory: 'Kontaminasi Fisik' },
  { ccp: 'Ketepatan Waktu Transit', score: 98.8, threshold: 95.0, status: 'On-Time Terkendali', riskCategory: 'Keterlambatan' },
  { ccp: 'Uji Organoleptik & Rasa', score: 100.0, threshold: 95.0, status: 'Disetujui Ahli Gizi', riskCategory: 'Mutu Sensorik' },
]

// 6. Dimensi Indeks Kepatuhan SLA Dapur (Radar SLA & Performance Evaluation)
export const SPPG_SLA_RADAR_DATA = [
  { metric: 'Ketepatan Waktu', score: 99.4, fullMark: 100 },
  { metric: 'Integritas Suhu', score: 99.2, fullMark: 100 },
  { metric: 'Presisi AKG', score: 99.6, fullMark: 100 },
  { metric: 'Segel & QR', score: 100.0, fullMark: 100 },
  { metric: 'Sanitasi Dapur', score: 99.1, fullMark: 100 },
  { metric: 'Kepuasan Sekolah', score: 98.8, fullMark: 100 },
]


// Ringkasan CCP, diturunkan dari SPPG_QUALITY_CONTROL_DATA di atas.
// Dipakai supaya label tidak lagi menulis klaim absolut seperti
// "Zero Defect" yang tidak punya sumber.
export const SPPG_CCP_SUMMARY = (() => {
  const rows = SPPG_QUALITY_CONTROL_DATA
  const passing = rows.filter((r) => r.score >= r.threshold)
  return {
    total: rows.length,
    passing: passing.length,
    failing: rows.length - passing.length,
    lowest: rows.reduce((min, r) => (r.score < min ? r.score : min), 100),
  }
})()
