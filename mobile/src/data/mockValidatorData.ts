// Data prototipe. Semua angka di bawah adalah CONTOH, bukan data operasional.
// Layar memakai label "data contoh" agar tidak terbaca sebagai fakta (R-17, R-38).
// Sumber nilai: VALIDATOR.md Bab 1-4 dan SUPERADMIN.md Bab 10.
import {
  UserProfile,
  DayItem,
  HeroMealStatus,
  QuickActionItem,
  NutrientCapsuleItem,
  DashboardMetricSummary,
} from '../types/role';
import { readMacros } from '../utils/nutrition';

export const MOCK_GURU_USER: UserProfile = {
  id: 'usr-guru-001',
  name: 'Ibu Siti Aminah',
  role: 'guru',
  roleTitle: 'Koordinator Validasi & Gizi',
  schoolName: 'SDN Menteng 01 Pagi',
  npsn: '20101234',
  assignedSPPG: 'SPPG Menteng Jaya (Dapur #04)',
};

export const MOCK_SISWA_USER: UserProfile = {
  id: 'usr-siswa-001',
  name: 'Budi Pratama',
  role: 'siswa',
  roleTitle: 'Siswa Penerima Manfaat',
  schoolName: 'SDN Menteng 01 Pagi',
  npsn: '20101234',
  className: 'Kelas 4A (No. Absen 12)',
  assignedSPPG: 'SPPG Menteng Jaya (Dapur #04)',
};

export const MOCK_WEEKLY_DAYS: DayItem[] = [
  { id: 'd-1', dayName: 'Sen', dayNumber: 7, hasDelivery: true },
  { id: 'd-2', dayName: 'Sel', dayNumber: 8, hasDelivery: true },
  { id: 'd-3', dayName: 'Rab', dayNumber: 9, hasDelivery: true },
  { id: 'd-4', dayName: 'Kam', dayNumber: 10, hasDelivery: true },
  { id: 'd-5', dayName: 'Jum', dayNumber: 11, hasDelivery: true },
  { id: 'd-6', dayName: 'Sab', dayNumber: 12, hasDelivery: false },
  { id: 'd-7', dayName: 'Min', dayNumber: 13, hasDelivery: false },
];

export const MOCK_HERO_MEAL_GURU: HeroMealStatus = {
  id: 'meal-today-001',
  sessionTitle: 'Sesi Makan Pagi Bergizi',
  greeting: 'Menyambut hari dengan gizi terbaik.',
  menuName: 'Paket A: Nasi Ayam Panggang Madu',
  sideDish: 'Tahu Organik & Capcay Brokoli Wortel',
  fruitAndDrink: 'Pisang Cavendish & Susu UHT 125ml',
  allergens: ['Susu sapi (laktosa)', 'Kedelai', 'Telur'],
  totalPortions: 650,
  masterTotes: 13,
  armadaStatus: 'arrived',
  etaDelivery: '07:10 WIB',
  fleetPlate: 'Armada B-9281-KBA',
  driverName: 'Bpk. Mulyono',
  driverPhone: null,
  haccpRemainingMinutes: 165,
};

// Tiga modul sesuai VALIDATOR.md Tabel Struktur Fitur (baris 2, 3, 4).
// "Uji Organoleptik" dan "Pantau Alergi" bukan modul mandiri di spec:
// organoleptik menyatu di alur Scan/BAST, alergen adalah bagian kartu menu.
export const MOCK_QUICK_ACTIONS_GURU: QuickActionItem[] = [
  {
    id: 'qa-1',
    title: 'Scan Boks AI',
    subtitle: 'Pindai QR boks dan deteksi mutu visual',
    tagLeft: 'Gerbang sekolah',
    tagRight: '13 master tote',
    tone: 'urgent',
    targetScreen: 'scanner',
    flow: [
      'Pindai Master QR kontainer termal, 1 scan untuk 50 porsi.',
      'Verifikasi asal SPPG, nomor SLHS, dan jam aman konsumsi.',
      'Deteksi visual YOLOv8 membuka sampel: warna, lendir, benda asing.',
      'Setujui porsi, atau tolak dan amankan sampel.',
    ],
  },
  {
    id: 'qa-2',
    title: 'Serah Terima BAST',
    subtitle: 'Suhu holding, rekonsiliasi porsi, tanda tangan digital',
    tagLeft: 'Sesudah tiba',
    tagRight: 'Tanda tangan digital',
    tone: 'safe',
    targetScreen: 'handover',
    flow: [
      'Pindai Master QR kontainer yang diturunkan dari armada.',
      'Catat suhu holding boks, minimal 60°C untuk hidangan hangat.',
      'Rekonsiliasi kuota 650 porsi dengan porsi yang benar-benar diterima.',
      'Tandatangani BAST digital bersama sopir pengantar.',
    ],
  },
  {
    id: 'qa-3',
    title: 'Lapor Insiden',
    subtitle: 'Eskalasi makanan basi atau benda asing',
    tagLeft: 'Darurat',
    tagRight: 'Eskalasi Satgas',
    tone: 'warning',
    targetScreen: 'incident',
    flow: [
      'Pisahkan dan amankan boks yang bermasalah.',
      'Unggah foto bukti pada modul insiden.',
      'Kirim eskalasi ke Satuan Tugas MBG untuk penghentian batch.',
    ],
  },
];

// Persentase tidak diketik tangan: dihitung dari target AKG di utils/nutrition.ts
// supaya tidak ada angka gigs yang tidak bisa ditelusuri asalnya (R-17).
const GURU_MACRO_ESTIMATE: Record<string, number> = {
  energi: 545,
  protein: 34,
  karbohidrat: 68,
  lemak: 14,
  serat: 7.1,
};

export const MOCK_NUTRIENT_CAPSULES_GURU: NutrientCapsuleItem[] = readMacros(
  'sd_atas',
  GURU_MACRO_ESTIMATE,
).map((macro) => ({
  id: `nut-${macro.key}`,
  name: macro.label,
  amount: `${macro.estimated} / ${macro.target} ${macro.unit}`,
  percentage: macro.ratio,
  status: macro.percentage >= 85 ? 'optimal' : macro.percentage >= 60 ? 'warning' : 'alert',
}));

export const MOCK_DASHBOARD_METRICS: DashboardMetricSummary = {
  totalTarget: 650,
  juniorTarget: 300,
  seniorTarget: 350,
  completedCount: 420,
  rejectedCount: 18,
};
