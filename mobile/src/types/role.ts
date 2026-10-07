export type UserRole = 'guru';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  schoolName: string;
  npsn: string;
  assignedSPPG: string;
}

export interface DayItem {
  id: string;
  dayName: string; // "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
  dayNumber: number; // 7, 8, 9, 10, ...
  hasDelivery: boolean; // Menandai hari yang punya jadwal pengantaran
}

export type ArmadaStatus = 'en_route' | 'arrived' | 'delayed';

export interface HeroMealStatus {
  id: string;
  sessionTitle: string; // "Sesi Makan Pagi Bergizi"
  greeting: string; // "Menyambut hari dengan gizi terbaik."
  menuName: string; // "Paket A: Nasi Ayam Panggang Madu"
  sideDish: string; // "Tahu Organik & Capcay Brokoli Wortel"
  fruitAndDrink: string; // "Pisang Cavendish & Susu UHT 125ml"
  allergens: string[]; // Rincian alergen menu hari ini
  totalPortions: number; // 650
  masterTotes: number; // 13 master tote @ 50 porsi
  armadaStatus: ArmadaStatus; // Status logistik armada menuju sekolah
  etaDelivery: string; // "07:10 WIB"
  fleetPlate: string; // "Armada B-9281-KBA"
  driverName: string; // "Bpk. Mulyono"
  driverPhone: string | null; // null = nomor belum terdaftar dari Dapur SPPG
  haccpRemainingMinutes: number; // 165 menit
}

export type Tone = 'neutral' | 'urgent' | 'safe' | 'warning';

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  tagLeft: string;
  tagRight: string;
  tone: Tone; // Warna tag mengikuti status nyata, bukan warna dekoratif
  flow: string[]; // Alur kerja nyata dari VALIDATOR.md, dipakai di modal detail
  /** Halaman yang dibuka ketika diketuk. Absent = cukup buka alur di modal. */
  targetScreen?: 'scanner' | 'handover' | 'incident';
}

export interface NutrientCapsuleItem {
  id: string;
  name: string; // "Protein", "Karbo", "Serat", "Lemak"
  amount: string; // "34g"
  percentage: number; // Persentase dari batas AKG Kemenkes
  status: 'optimal' | 'warning' | 'alert';
}

export interface DashboardMetricSummary {
  totalTarget: number;
  juniorTarget: number; // Kuota SD kelas bawah
  seniorTarget: number; // Kuota SD kelas atas
  completedCount: number;
  rejectedCount: number; // Porsi ditolak atau disisihkan karena bermasalah
}
