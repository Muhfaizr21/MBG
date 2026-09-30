import {
  UserProfile,
  DayItem,
  HeroMealStatus,
  QuickActionItem,
  NutrientCapsuleItem,
  DashboardMetricSummary,
} from '../types/role';

export const MOCK_GURU_USER: UserProfile = {
  id: 'usr-guru-001',
  name: 'Ibu Siti Aminah',
  role: 'guru',
  roleTitle: 'Koordinator Validasi & Gizi',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  schoolName: 'SDN Menteng 01 Pagi',
  npsn: '20101234',
  assignedSPPG: 'SPPG Menteng Jaya (Dapur #04)',
};

export const MOCK_SISWA_USER: UserProfile = {
  id: 'usr-siswa-001',
  name: 'Budi Pratama',
  role: 'siswa',
  roleTitle: 'Siswa Penerima Manfaat',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  schoolName: 'SDN Menteng 01 Pagi',
  npsn: '20101234',
  className: 'Kelas 4A (No. Absen 12)',
  assignedSPPG: 'SPPG Menteng Jaya (Dapur #04)',
};

export const MOCK_WEEKLY_DAYS: DayItem[] = [
  { id: 'd-1', dayName: 'Sen', dayNumber: 7, dateString: '2026-10-07', isToday: false, isActive: false, hasDelivery: true },
  { id: 'd-2', dayName: 'Sel', dayNumber: 8, dateString: '2026-10-08', isToday: false, isActive: false, hasDelivery: true },
  { id: 'd-3', dayName: 'Rab', dayNumber: 9, dateString: '2026-10-09', isToday: false, isActive: false, hasDelivery: true },
  { id: 'd-4', dayName: 'Kam', dayNumber: 10, dateString: '2026-10-10', isToday: true, isActive: true, hasDelivery: true },
  { id: 'd-5', dayName: 'Jum', dayNumber: 11, dateString: '2026-10-11', isToday: false, isActive: false, hasDelivery: true },
  { id: 'd-6', dayName: 'Sab', dayNumber: 12, dateString: '2026-10-12', isToday: false, isActive: false, hasDelivery: false },
  { id: 'd-7', dayName: 'Min', dayNumber: 13, dateString: '2026-10-13', isToday: false, isActive: false, hasDelivery: false },
];

export const MOCK_HERO_MEAL_GURU: HeroMealStatus = {
  id: 'meal-today-001',
  sessionTitle: 'Sesi Makan Pagi Bergizi',
  greeting: 'Mari sambut hari dengan gizi terbaik.',
  menuName: 'Paket A: Nasi Ayam Panggang Madu',
  sideDish: 'Tahu Organik & Capcay Brokoli Wortel',
  fruitAndDrink: 'Pisang Cavendish & Susu UHT 125ml',
  totalPortions: 650,
  portionsValidated: 420,
  portionsPending: 230,
  etaDelivery: '07:10 WIB',
  fleetPlate: 'Armada B-9281-KBA',
  driverName: 'Bpk. Mulyono',
  haccpRemainingMinutes: 165,
  statusColor: '#EBA338',
  illustrationType: 'morning',
};

export const MOCK_QUICK_ACTIONS_GURU: QuickActionItem[] = [
  {
    id: 'qa-1',
    title: 'Pindai Boks AI 📦',
    subtitle: 'Scan QR & verifikasi isi boks otomatis',
    tagLeft: 'Hari ini',
    tagRight: '13 Boks Wajib',
    iconName: 'scan',
    backgroundColor: '#FEE2E2', // Soft peach/pink
    accentColor: '#EF4444',
    route: '/validation',
    badgeCount: 13,
  },
  {
    id: 'qa-2',
    title: 'Terima BAST ✍️',
    subtitle: 'Tanda tangan serah terima Dapur SPPG',
    tagLeft: 'Kurir Tiba',
    tagRight: 'Digital Sign',
    iconName: 'file-text',
    backgroundColor: '#EDE9FE', // Soft lavender
    accentColor: '#8B5CF6',
    route: '/bast',
  },
  {
    id: 'qa-3',
    title: 'Uji Organoleptik 🍲',
    subtitle: 'Cek rasa, aroma, suhu & tekstur sampel',
    tagLeft: 'HACCP Safe',
    tagRight: 'Suhu 65°C',
    iconName: 'thermometer',
    backgroundColor: '#DCFCE7', // Soft mint
    accentColor: '#10B981',
    route: '/organoleptic',
  },
  {
    id: 'qa-4',
    title: 'Pantau Alergi Siswa 🛡️',
    subtitle: 'Cek 3 siswa dengan substitusi menu telur',
    tagLeft: '3 Siswa',
    tagRight: 'Alergen Telur',
    iconName: 'shield-alert',
    backgroundColor: '#FEF3C7', // Soft amber
    accentColor: '#F59E0B',
    route: '/allergy',
  },
];

export const MOCK_NUTRIENT_CAPSULES_GURU: NutrientCapsuleItem[] = [
  {
    id: 'nut-1',
    name: 'Protein',
    amount: '34g',
    percentage: 48,
    color: '#EBA338', // Amber
    bgColor: '#F4E8D6',
    status: 'optimal',
  },
  {
    id: 'nut-2',
    name: 'Karbo',
    amount: '68g',
    percentage: 33,
    color: '#883A2D', // Terracotta brown
    bgColor: '#EADCD9',
    status: 'optimal',
  },
  {
    id: 'nut-3',
    name: 'Serat',
    amount: '12g',
    percentage: 27,
    color: '#7A9A38', // Olive green
    bgColor: '#E6ECCE',
    status: 'optimal',
  },
  {
    id: 'nut-4',
    name: 'Lemak',
    amount: '14g',
    percentage: 40,
    color: '#707567', // Slate olive
    bgColor: '#E4E5E1',
    status: 'optimal',
  },
];

export const MOCK_DASHBOARD_METRICS: DashboardMetricSummary = {
  totalTarget: 650,
  completedCount: 420,
  complianceRate: 96.8,
  activeHaccpCountdown: '02:45:00',
  isHaccpSafe: true,
};
