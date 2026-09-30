/**
 * ==============================================================================
 * TYPE DEFINITIONS & CONTRACTS (SOLID: Interface Segregation Principle)
 * Mendukung Multi-Role: Guru (Validator Lapangan) & Siswa (Penerima Manfaat)
 * ==============================================================================
 */

export type UserRole = 'guru' | 'siswa';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl: string;
  schoolName: string;
  npsn: string;
  className?: string; // Khusus siswa (misal: "Kelas 4A")
  assignedSPPG: string;
}

export interface DayItem {
  id: string;
  dayName: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  dayNumber: number; // 7, 8, 9, 10, ...
  dateString: string;
  isToday: boolean;
  isActive: boolean;
  hasDelivery: boolean;
}

export interface HeroMealStatus {
  id: string;
  sessionTitle: string; // "Sesi Sarapan Pagi Siaga"
  greeting: string; // "Mari sambut hari dengan gizi terbaik"
  menuName: string; // "Paket A: Nasi Ayam Panggang Madu"
  sideDish: string; // "Tahu Segar & Capcay Brokoli"
  fruitAndDrink: string; // "Pisang Cavendish & Susu UHT 125ml"
  totalPortions: number; // 650
  portionsValidated: number; // 420
  portionsPending: number; // 230
  etaDelivery: string; // "07:10 WIB"
  fleetPlate: string; // "Armada B-9281-KBA"
  driverName: string; // "Bpk. Mulyono"
  haccpRemainingMinutes: number; // 165 menit
  statusColor: string; // "#F59E0B"
  illustrationType: 'morning' | 'afternoon' | 'completed';
}

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  tagLeft: string;
  tagRight: string;
  iconName: string;
  backgroundColor: string; // Pastel color
  accentColor: string;
  route: string;
  badgeCount?: number;
}

export interface NutrientCapsuleItem {
  id: string;
  name: string; // "Protein", "Karbo", "Serat", "Lemak"
  amount: string; // "34g"
  percentage: number; // 98
  color: string; // Bar color
  bgColor: string; // Pill track background
  status: 'optimal' | 'warning' | 'alert';
}

export interface DashboardMetricSummary {
  totalTarget: number;
  completedCount: number;
  complianceRate: number; // 96.8%
  activeHaccpCountdown: string; // "02:45:00"
  isHaccpSafe: boolean;
}
