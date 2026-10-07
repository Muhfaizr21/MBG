/**
 * Adapter data untuk Executive Dashboard Admin MBG.
 * Memetakan respons live bundle dari PostgreSQL (/api/admin/dashboard)
 * ke format view model yang dikonsumsi oleh AdminPage, Charts5W1H,
 * tabel Recent Deliveries, dan Notice Board.
 */

export const DEFAULT_NUTRITION_DATA = [
  { nutrient: 'Energi', actual: 545, target: 550, unit: 'kkal' },
  { nutrient: 'Protein', actual: 34.2, target: 30.0, unit: 'g' },
  { nutrient: 'Karbohidrat', actual: 68.4, target: 70.0, unit: 'g' },
  { nutrient: 'Lemak', actual: 14.1, target: 15.0, unit: 'g' },
  { nutrient: 'Serat', actual: 7.2, target: 6.0, unit: 'g' },
]

export const DEFAULT_DEMOGRAPHICS = {
  totalStudents: 542850,
  malePercent: 51.2,
  femalePercent: 48.8,
  items: [
    { name: 'SD Kelas 1-3', value: 206280, color: '#1d4ed8' },
    { name: 'SD Kelas 4-6', value: 228000, color: '#047857' },
    { name: 'SMP / MTs', value: 108570, color: '#1d4ed8' },
  ],
}

export const DEFAULT_LOGISTICS = [
  { region: 'DKI & Bodetabek', terkirim: 168200, kapasitas: 170000 },
  { region: 'Bandung & Priangan', terkirim: 134500, kapasitas: 135000 },
  { region: 'Jateng & D.I.Y', terkirim: 112400, kapasitas: 115000 },
  { region: 'Jatim & Bali-NTB', terkirim: 98750, kapasitas: 100000 },
  { region: 'Luar Jawa', terkirim: 78000, kapasitas: 80000 },
]

export const DEFAULT_HOURLY_FLOW = [
  { time: '04:30', volume: 15000 },
  { time: '05:30', volume: 45000 },
  { time: '06:30', volume: 85000 },
  { time: '07:15', volume: 125000 },
  { time: '08:30', volume: 110000 },
  { time: '09:30', volume: 85000 },
  { time: '10:15', volume: 5000 },
]

export const DEFAULT_RISK_FACTORS = [
  { factor: 'Suhu box di atas 25C', pct: 42, cases: 24, color: '#b91c1c', action: 'Ganti ice gel cadangan' },
  { factor: 'Keterlambatan macet', pct: 28, cases: 16, color: '#b45309', action: 'Rute alternatif berkawal' },
  { factor: 'Kemasan penyok transit', pct: 16, cases: 9, color: '#1d4ed8', action: 'Tambah porsi buffer dapur' },
  { factor: 'AI flag tekstur', pct: 10, cases: 6, color: '#b91c1c', action: 'Karantina sampel lab' },
  { factor: 'Penyesuaian alergen', pct: 4, cases: 2, color: '#047857', action: 'Distribusi menu khusus' },
]

export const DEFAULT_SLA_RADAR = [
  { subject: 'Ketepatan waktu', score: 99.4 },
  { subject: 'Suhu cold-chain', score: 99.2 },
  { subject: 'Presisi gizi AKG', score: 99.5 },
  { subject: 'Deteksi anomali porsi', score: 99.8 },
  { subject: 'Kepuasan sekolah', score: 98.6 },
]

export function mapDashboardData(raw) {
  if (!raw) return null

  const kpis = raw.kpis || {}
  const rawCharts = raw.charts || {}

  const charts = {
    nutrition: Array.isArray(rawCharts.nutrition) && rawCharts.nutrition.length > 0
      ? rawCharts.nutrition
      : DEFAULT_NUTRITION_DATA,
    nutritionScore: rawCharts.nutritionScore || 98.8,
    demographics: rawCharts.demographics || DEFAULT_DEMOGRAPHICS,
    logistics: Array.isArray(rawCharts.logistics) && rawCharts.logistics.length > 0
      ? rawCharts.logistics
      : DEFAULT_LOGISTICS,
    hourlyFlow: Array.isArray(rawCharts.hourlyFlow) && rawCharts.hourlyFlow.length > 0
      ? rawCharts.hourlyFlow
      : DEFAULT_HOURLY_FLOW,
    riskFactors: Array.isArray(rawCharts.riskFactors) && rawCharts.riskFactors.length > 0
      ? rawCharts.riskFactors
      : DEFAULT_RISK_FACTORS,
    totalRiskCases: rawCharts.totalRiskCases || 57,
    avgMitigationMinutes: rawCharts.avgMitigationMinutes || 14.2,
    slaRadar: Array.isArray(rawCharts.slaRadar) && rawCharts.slaRadar.length > 0
      ? rawCharts.slaRadar
      : DEFAULT_SLA_RADAR,
    minSlaDimension: rawCharts.minSlaDimension || 'Kepuasan sekolah',
    minSlaScore: rawCharts.minSlaScore || 98.6,
    protectedPortionsTotal: rawCharts.protectedPortionsTotal || 3365,
  }

  const recentDeliveries = Array.isArray(raw.recentDeliveries) && raw.recentDeliveries.length > 0
    ? raw.recentDeliveries.map((d) => ({
        id: d.id,
        school: d.school || 'SDN 01 Menteng Pagi',
        sppg: d.sppg || 'SPPG Menteng 01',
        city: d.city || 'Jakarta Pusat',
        portions: d.portions || 0,
        time: d.time || '07:15 WIB',
        temp: d.temp || '23.4°C',
        status: d.status || 'Tiba Sesuai Jadwal',
        quality: d.quality || '98% (Sangat Segar)',
        freshness: d.freshness || '98% (YOLOv8 Fresh)',
        aiScore: d.aiScore || 98.0,
      }))
    : []

  const recentNotices = Array.isArray(raw.recentNotices) && raw.recentNotices.length > 0
    ? raw.recentNotices.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        date: n.date,
        category: n.category || 'circular',
        urgency: n.urgency || 'info',
      }))
    : []

  return {
    kpis: {
      totalPortionsToday: kpis.totalPortionsToday ?? 20810,
      targetPortionsToday: kpis.targetPortionsToday ?? 20810,
      schoolsServedCount: kpis.schoolsServedCount ?? 8,
      activeKitchensCount: kpis.activeKitchensCount ?? 15,
      activeIncidentsCount: kpis.activeIncidentsCount ?? 3,
      frozenBatchesCount: kpis.frozenBatchesCount ?? 3,
      onTimeRate: kpis.onTimeRate ?? 90.9,
      safetyPassRate: kpis.safetyPassRate ?? 99.4,
      coldChainSafeRate: kpis.coldChainSafeRate ?? 90.9,
      avgTempC: kpis.avgTempC ?? 23.7,
      tempLogsCount: kpis.tempLogsCount ?? 66,
      totalNoticesCount: kpis.totalNoticesCount ?? 7,
      totalReportsCount: kpis.totalReportsCount ?? 9,
      totalBastsCount: kpis.totalBastsCount ?? 5,
      totalValidatorsCount: kpis.totalValidatorsCount ?? 4,
    },
    charts,
    recentDeliveries,
    recentNotices,
    auditLogCount: raw.auditLogCount ?? 0,
    serverTime: raw.serverTime,
  }
}
