/**
 * Adapter tampilan untuk kalender operasional & siklus menu MBG.
 * Memastikan transformasi data backend ke format view model yang robust dan konsisten.
 */

export function mapCalendarDayFromApi(raw) {
  if (!raw) return null

  const isLocked = raw.menuStatus === 'locked' || raw.status === 'locked' || Boolean(raw.locked)

  return {
    date: raw.date,
    packageId: raw.packageId || (raw.package?.id) || '',
    dayName: raw.dayName || '',
    dayNumber: raw.dayNumber || 1,
    monthYear: raw.monthYear || 'Oktober 2026',
    dayType: raw.dayType || 'school_day',
    dayTypeLabel: raw.dayTypeLabel || (raw.dayType === 'holiday' ? 'Libur Nasional / Blackout' : 'Hari Operasional Reguler'),
    title: raw.title || raw.theme || 'Siklus Menu Normal',
    theme: raw.theme || raw.title || 'Siklus Menu Normal',
    menuStatus: raw.menuStatus || (isLocked ? 'locked' : 'draft'),
    menuStatusLabel: raw.menuStatusLabel || (isLocked ? 'Menu Terkunci & Valid' : 'Draft Penyusunan'),
    locked: isLocked,
    isOperationalBlackout: Boolean(raw.isOperationalBlackout),
    blackoutReason: raw.blackoutReason || '',
    targetPortions: typeof raw.targetPortions === 'number' ? raw.targetPortions : 250000,
    activeKitchens: typeof raw.activeKitchens === 'number' ? raw.activeKitchens : 180,
    hasInspection: Boolean(raw.hasInspection),
    inspectionDetail: raw.inspectionDetail || null,
    hasSubstitution: Boolean(raw.hasSubstitution),
    substitutionId: raw.substitutionId || '',
    status: raw.status || (isLocked ? 'locked' : 'approved'),
    notes: raw.notes || '',
    weekNumber: raw.weekNumber || 1,
    package: raw.package ? mapMenuPackageFromApi(raw.package) : null,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

export function mapMenuPackageFromApi(raw) {
  if (!raw) return null

  let allergens = []
  if (Array.isArray(raw.allergens)) {
    allergens = raw.allergens
  } else if (typeof raw.allergens === 'string' && raw.allergens.trim() !== '') {
    allergens = raw.allergens.split(',').map(s => s.trim()).filter(Boolean)
  }

  return {
    id: raw.id,
    cycleCode: raw.cycleCode || raw.id,
    daySlot: raw.daySlot || '',
    name: raw.name || '',
    staple: raw.staple || '',
    proteinMain: raw.proteinMain || '',
    sideVeggie: raw.sideVeggie || '',
    fruit: raw.fruit || '',
    dairyDrink: raw.dairyDrink || '',
    calories: Number(raw.calories) || 0,
    protein: Number(raw.protein) || 0,
    carbs: Number(raw.carbs) || 0,
    fat: Number(raw.fat) || 0,
    calcium: Number(raw.calcium) || 0,
    iron: Number(raw.iron) || 0,
    zinc: Number(raw.zinc) || 0,
    costPerServing: Number(raw.costPerServing) || 0,
    allergens: allergens,
    halalCert: raw.halalCert || '',
    slhsCert: raw.slhsCert || '',
    description: raw.description || '',
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export function mapSubstitutionFromApi(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    date: raw.date,
    cycleCode: raw.cycleCode || '',
    region: raw.region || 'Nasional',
    originalIngredient: raw.originalIngredient || '',
    substituteIngredient: raw.substituteIngredient || '',
    reason: raw.reason || '',
    nutritionComparison: raw.nutritionComparison || {
      proteinOriginal: '28.5g',
      proteinSubstitute: '28.0g',
      caloriesOriginal: '580 kkal',
      caloriesSubstitute: '580 kkal',
      costOriginal: 'Rp 14.850',
      costSubstitute: 'Rp 14.850',
    },
    nutritionistReview: raw.nutritionistReview || '',
    status: raw.status || 'pending',
    statusLabel: raw.statusLabel || (raw.status === 'approved' ? 'Disetujui Superadmin BGN' : 'Menunggu Otorisasi Superadmin'),
    approvedAt: raw.approvedAt || null,
    approvedBy: raw.approvedBy || null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}
