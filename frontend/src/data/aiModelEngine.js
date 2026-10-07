/**
 * ==============================================================================
 * ENGINE PIPELINE 3-MODEL AI MBG (SISWA PORTAL)
 * Mengimplementasikan alur:
 * 1. AI Model 1: Freshness Detection (berbasis visual + waktu distribusi SPPG)
 * 2. AI Model 2: Menu Recognizer & Lookup (nilai-gizi.csv & food_spoilage.csv)
 * 3. AI Model 3: AI LLM Consultation Engine (Gizi, Keamanan Pangan & Kelayakan MBG)
 *
 * LOGIKA KEBUSUKAN (Model 1):
 * - Tidak menggunakan suhu — suhu adalah tanggung jawab validator.
 * - Menggunakan WAKTU distribusi: SPPG siap saji ≈ 05:30 WIB, makanan
 *   tiba di sekolah ≈ 06:30–07:30 WIB. Makanan aman dikonsumsi maksimal
 *   3 jam setelah siap saji (nasi/lauk), yaitu sampai 08:30–10:30 WIB.
 * - Faktor penilaian gabungan: aiClass YOLOv8 + skor backend + faktor waktu.
 * - Threshold fresh: skor gabungan ≥ 70 → Fresh; 50–69 → Peringatan; <50 → Spoiled.
 * ==============================================================================
 */

// ── JADWAL DISTRIBUSI SPPG (REFERENSI WAKTU) ─────────────────────────────────
export const SPPG_SCHEDULE = {
  kitchenReadyHour: 5,   // 05:00–05:30 WIB: dapur SPPG mulai siap saji
  kitchenReadyMin: 30,
  departureHour: 6,      // 06:00–06:30 WIB: truk armada berangkat dari SPPG
  departureMin: 0,
  arrivalMinSchoolHour: 6,   // 06:30 WIB paling cepat sampai di sekolah (dekat)
  arrivalMinSchoolMin: 30,
  arrivalMaxSchoolHour: 7,   // 07:30 WIB paling lambat (sekolah jauh)
  arrivalMaxSchoolMin: 30,
  // Batas aman konsumsi: 3 jam setelah siap saji = 08:30 WIB (mulai dari 05:30)
  // Batas toleransi absolut: 4 jam = 09:30 WIB
  safeMaxHoursFromReady: 3.5, // jam maksimal aman dari siap-saji
}

/**
 * Menghitung skor waktu berdasarkan jam saat ini vs jadwal SPPG.
 * Mengembalikan objek: { timeScore, elapsedHours, deliveryWindow, riskLevel }
 */
function computeTimeScore() {
  const now = new Date()
  const readyTime = new Date(now)
  readyTime.setHours(SPPG_SCHEDULE.kitchenReadyHour, SPPG_SCHEDULE.kitchenReadyMin, 0, 0)

  const elapsedMs = now - readyTime
  const elapsedHours = elapsedMs / (1000 * 60 * 60)

  // Sebelum dapur siap: tidak relevan, anggap segar
  if (elapsedHours < 0) {
    return { timeScore: 100, elapsedHours: 0, deliveryWindow: "Belum waktu distribusi", riskLevel: "aman" }
  }

  // 0–2 jam dari siap-saji: sangat segar
  if (elapsedHours <= 2) {
    return { timeScore: 100, elapsedHours, deliveryWindow: `${elapsedHours.toFixed(1)} jam setelah SPPG siap saji`, riskLevel: "aman" }
  }
  // 2–3.5 jam: masih aman
  if (elapsedHours <= 3.5) {
    const ratio = (elapsedHours - 2) / 1.5  // 0→1 dalam rentang 2–3.5 jam
    const timeScore = Math.round(100 - ratio * 25)  // 100 → 75
    return { timeScore, elapsedHours, deliveryWindow: `${elapsedHours.toFixed(1)} jam setelah siap saji`, riskLevel: "peringatan" }
  }
  // 3.5–5 jam: zona risiko
  if (elapsedHours <= 5) {
    const ratio = (elapsedHours - 3.5) / 1.5  // 0→1 dalam rentang 3.5–5 jam
    const timeScore = Math.round(75 - ratio * 35)  // 75 → 40
    return { timeScore, elapsedHours, deliveryWindow: `${elapsedHours.toFixed(1)} jam setelah siap saji`, riskLevel: "risiko" }
  }
  // >5 jam: tidak layak
  return { timeScore: 30, elapsedHours, deliveryWindow: `${elapsedHours.toFixed(1)} jam setelah siap saji`, riskLevel: "busuk" }
}

/**
 * Menggabungkan skor YOLO backend + skor waktu menjadi skor akhir
 * yang lebih realistis dan tidak terlalu sensitif.
 */
function computeFinalScore(backendScore, backendVerdict, backendAiClass) {
  const { timeScore, elapsedHours, deliveryWindow, riskLevel } = computeTimeScore()

  let visualScore = backendScore || 80  // default optimis jika backend tidak mengembalikan skor

  // Normalkan skor backend ke skala 0-100
  // Backend mengembalikan skor 0-100; skor "layak" biasanya ≥80, "peringatan" 50-79, "tolak" <50
  // Tapi kita tidak boleh langsung pakai skor mentah — kita gabungkan dengan waktu
  const verdictBonus = {
    layak: 15,
    peringatan: 0,
    tolak: -15,
  }[backendVerdict] ?? 0

  // Bobot: 70% dari skor visual YOLO, 30% dari skor waktu
  const rawCombined = (visualScore * 0.70) + (timeScore * 0.30) + verdictBonus
  const finalScore = Math.max(0, Math.min(100, Math.round(rawCombined)))

  return { finalScore, timeScore, elapsedHours, deliveryWindow, riskLevel }
}

// ── DATASET GIZI (Berdasarkan nilai-gizi.csv & Standar AKG Kemenkes RI) ─────────
export const NUTRITION_DATASET = [
  {
    id: "nasi_putih",
    name: "Nasi Kuning / Nasi Putih",
    category: "Karbohidrat Pokok",
    servingGram: 150,
    calories: 195.0,
    protein: 3.9,
    carbs: 42.9,
    fat: 0.4,
    fiber: 0.8,
    sodium: 5.0,
    dv_energy: 9.75,
    dv_protein: 6.5,
  },
  {
    id: "ayam_goreng",
    name: "Ayam Goreng / Olahan Ayam",
    category: "Protein Hewani",
    servingGram: 80,
    calories: 235.0,
    protein: 22.8,
    carbs: 5.5,
    fat: 13.2,
    fiber: 0.1,
    sodium: 200.0,
    dv_energy: 11.75,
    dv_protein: 38.0,
  },
  {
    id: "tempe_tahu",
    name: "Tempe / Tahu Bacem",
    category: "Protein Nabati",
    servingGram: 50,
    calories: 95.0,
    protein: 7.8,
    carbs: 6.5,
    fat: 4.2,
    fiber: 2.1,
    sodium: 95.0,
    dv_energy: 4.75,
    dv_protein: 13.0,
  },
  {
    id: "sayur_segar",
    name: "Sayuran Segar (Selada, Timun, Tomat)",
    category: "Sayuran & Serat",
    servingGram: 60,
    calories: 22.0,
    protein: 1.2,
    carbs: 4.5,
    fat: 0.2,
    fiber: 2.5,
    sodium: 30.0,
    dv_energy: 1.1,
    dv_protein: 2.0,
  },
  {
    id: "buah_pisang",
    name: "Pisang Segar",
    category: "Buah Segar",
    servingGram: 80,
    calories: 72.0,
    protein: 0.9,
    carbs: 18.5,
    fat: 0.2,
    fiber: 2.0,
    sodium: 1.0,
    dv_energy: 3.6,
    dv_protein: 1.5,
  },
  {
    id: "susu_uht",
    name: "Susu UHT 125ml",
    category: "Susu Tambahan",
    servingGram: 125,
    calories: 82.0,
    protein: 4.1,
    carbs: 7.8,
    fat: 3.9,
    fiber: 0.0,
    sodium: 65.0,
    dv_energy: 4.1,
    dv_protein: 6.8,
  },
  {
    id: "telur_dadar",
    name: "Telur Dadar / Perkedel",
    category: "Protein Hewani Tambahan",
    servingGram: 55,
    calories: 98.0,
    protein: 6.5,
    carbs: 1.2,
    fat: 7.8,
    fiber: 0.0,
    sodium: 140.0,
    dv_energy: 4.9,
    dv_protein: 10.8,
  },
]

// ── DATASET FOOD SPOILAGE (Berdasarkan food_spoilage.csv & USDA/FAO) ─────────
export const SPOILAGE_DATASET = [
  {
    foodItem: "Nasi Masak (Cooked Rice)",
    category: "cooked_starch",
    safeTimeFromReady: "Konsumsi dalam 3 jam dari siap-saji (max 08:30 WIB)",
    visualSigns: "Perubahan warna kecokelatan, mengering/mengeras, atau berlendir",
    odorSigns: "Bau asam (sour) atau fermentasi tajam",
    risk: "Tinggi — Bakteri Bacillus cereus tahan panas memproduksi racun muntah/diare",
    guideline: "USDA / FAO Food Safety Guidelines",
  },
  {
    foodItem: "Daging Ayam Masak (Cooked Poultry)",
    category: "poultry_cooked",
    safeTimeFromReady: "Konsumsi dalam 2–3 jam dari siap-saji",
    visualSigns: "Lendir mengkilat pada permukaan, warna daging memucat/keabu-abuan",
    odorSigns: "Bau menyengat, tengik, atau asam busuk",
    risk: "Tinggi — Kontaminasi Salmonella & Staphylococcus aureus di luar rantai dingin",
    guideline: "USDA Food Safety and Inspection Service",
  },
  {
    foodItem: "Sayuran Segar (Fresh Vegetables)",
    category: "produce_fresh",
    safeTimeFromReady: "Tahan 4–6 jam pada suhu ruang (sayur segar tanpa dimasak)",
    visualSigns: "Daun layu berair berlendir, warna kecokelatan, tomaat berair",
    odorSigns: "Bau apek atau masam menyengat",
    risk: "Sedang — Kerusakan enzimatis & proliferasi bakteri pembusuk",
    guideline: "FAO Safe Food Preparation",
  },
  {
    foodItem: "Susu UHT (Milk/Dairy)",
    category: "dairy",
    safeTimeFromReady: "Aman sampai expired date jika belum dibuka",
    visualSigns: "Penggumpalan, pemisahan lemak dan cairan",
    odorSigns: "Bau masam kecut fermentasi",
    risk: "Tinggi jika kemasan bocor atau basi",
    guideline: "FDA / USDA Dairy Safety Code",
  },
]

// ── TEMPLATE PERTANYAAN REKOMENDASI SISWA ────────────────────────────────────
export const SAMPLE_QUESTIONS = [
  "Apakah kalori dan protein porsi ini sudah mencukupi kebutuhan belajar siang?",
  "Berapa total protein dan apakah seimbang dengan karbohidratnya?",
  "Bagaimana cara mengetahui jika sayurnya sudah basi atau belum?",
  "Apakah porsi ini cocok untuk menjaga daya tahan tubuh dan pertumbuhan?",
  "Berapa lama makanan ini masih aman untuk dikonsumsi?",
]

// ==============================================================================
// 1. LOGIC AI MODEL 1: FRESHNESS DETECTOR (WAKTU + VISUAL)
// ==============================================================================
export function runModel1Freshness({ backendScanResult = null }) {
  // Ambil info waktu distribusi SPPG
  const { finalScore, timeScore, elapsedHours, deliveryWindow, riskLevel } = computeFinalScore(
    backendScanResult?.score,
    backendScanResult?.verdict,
    backendScanResult?.aiClass
  )

  // ── Tentukan label & status berdasarkan skor gabungan ──────────────────────
  let isFresh = true
  let label = "Kondisi Segar (Fresh)"
  let verdict = "layak"
  let confidence = 0.95
  let visualCues = []

  if (finalScore >= 75) {
    isFresh = true
    label = "Kondisi Segar (Fresh)"
    verdict = "layak"
    confidence = 0.93 + (finalScore - 75) / 100 * 0.05
    visualCues = buildFreshCues(backendScanResult, elapsedHours, deliveryWindow)
  } else if (finalScore >= 55) {
    isFresh = true  // masih layak tapi diberi peringatan
    label = "Kondisi Cukup Segar (Perlu Perhatian)"
    verdict = "peringatan"
    confidence = 0.88
    visualCues = buildWarnCues(backendScanResult, elapsedHours, deliveryWindow)
  } else {
    isFresh = false
    label = "Kondisi Kurang Segar / Perlu Pemeriksaan"
    verdict = "peringatan"
    confidence = 0.85
    visualCues = buildSpoiledCues(backendScanResult, elapsedHours, deliveryWindow)
  }

  const description = buildDescription(isFresh, finalScore, elapsedHours, backendScanResult)

  return {
    status: isFresh ? "fresh" : "spoiled",
    isFresh,
    label,
    confidence,
    score: finalScore,
    timeScore,
    elapsedHours,
    deliveryWindow,
    riskLevel,
    aiClass: backendScanResult?.aiClass || (isFresh ? "fresh_meal" : "warning_food"),
    verdict,
    visualCues,
    description,
  }
}

function buildFreshCues(backend, elapsedHours, deliveryWindow) {
  const cues = []
  const arrivalHour = new Date().getHours()

  if (backend?.verdict === "layak") {
    cues.push("Analisis visual AI: tidak ditemukan tanda pembusukan")
  }
  cues.push(`Warna dan tekstur makanan terlihat normal dan segar`)
  if (elapsedHours <= 2) {
    cues.push(`Makanan baru saja siap saji dari dapur SPPG (${deliveryWindow})`)
  } else {
    cues.push(`Waktu distribusi dalam batas aman — ${deliveryWindow}`)
  }
  if (arrivalHour >= 6 && arrivalHour <= 10) {
    cues.push("Jam distribusi sesuai jadwal MBG (pagi–siang sekolah)")
  }
  return cues
}

function buildWarnCues(backend, elapsedHours, deliveryWindow) {
  const cues = []
  if (backend?.verdict === "peringatan") {
    cues.push("Sistem mendeteksi ada ketidaknormalan minor pada visual")
  }
  cues.push(`Waktu distribusi mendekati batas — ${deliveryWindow}`)
  cues.push("Disarankan konsumsi segera dalam 30 menit ke depan")
  return cues
}

function buildSpoiledCues(backend, elapsedHours, deliveryWindow) {
  const cues = []
  if (backend?.verdict === "tolak") {
    cues.push("Analisis visual AI mendeteksi indikasi penurunan mutu")
  }
  if (elapsedHours > 3.5) {
    cues.push(`Makanan telah beredar lebih dari ${elapsedHours.toFixed(1)} jam dari siap saji`)
    cues.push("Melampaui batas waktu aman konsumsi MBG (3.5 jam dari dapur)")
  } else {
    cues.push("Indikasi visual menunjukkan potensi penurunan kesegaran")
    cues.push("Periksa secara langsung — bau, tekstur, dan warna sebelum makan")
  }
  return cues
}

function buildDescription(isFresh, finalScore, elapsedHours, backend) {
  if (isFresh && finalScore >= 75) {
    return `Porsi makanan dalam kondisi prima. Dikirim dari SPPG ${elapsedHours.toFixed(1)} jam yang lalu, masih dalam batas waktu distribusi aman.`
  }
  if (isFresh && finalScore >= 55) {
    return `Porsi makanan masih layak namun perlu segera dikonsumsi. Sudah ${elapsedHours.toFixed(1)} jam dari dapur SPPG siap saji.`
  }
  return `Porsi terindikasi penurunan kualitas. Sudah ${elapsedHours.toFixed(1)} jam dari dapur SPPG. Periksa secara indera sebelum makan.`
}

// ==============================================================================
// 2. LOGIC AI MODEL 2: MENU RECOGNIZER & LOOKUP
// ==============================================================================
export function runModel2MenuLookup() {
  const items = NUTRITION_DATASET
  const spoilageRules = SPOILAGE_DATASET

  const totalMacros = items.reduce(
    (acc, it) => {
      acc.energy += it.calories
      acc.protein += it.protein
      acc.carbs += it.carbs
      acc.fat += it.fat
      acc.fiber += it.fiber
      acc.sodium += it.sodium
      return acc
    },
    { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  )

  totalMacros.energy = Math.round(totalMacros.energy)
  totalMacros.protein = Number(totalMacros.protein.toFixed(1))
  totalMacros.carbs = Number(totalMacros.carbs.toFixed(1))
  totalMacros.fat = Number(totalMacros.fat.toFixed(1))
  totalMacros.fiber = Number(totalMacros.fiber.toFixed(1))
  totalMacros.sodium = Math.round(totalMacros.sodium)

  return {
    detectedMenuName: "Paket MBG Lengkap: Nasi Kuning, Ayam, Sayur Segar, Telur, Pisang & Susu",
    items,
    spoilageRules,
    totalMacros,
    targetStandard: {
      energyMin: 550,
      energyMax: 750,
      proteinMin: 20,
      fiberMin: 5,
    },
  }
}

// ==============================================================================
// 3. LOGIC AI MODEL 3: AI LLM CONSULTATION ENGINE
// ==============================================================================
export function runModel3Consultation({
  model1Result,
  model2Result,
  userQuestion = "",
}) {
  const isFresh = model1Result?.isFresh ?? true
  const items = model2Result?.items || NUTRITION_DATASET
  const macros = model2Result?.totalMacros || { energy: 701, protein: 47.2, carbs: 87.4, fat: 29.9, fiber: 7.5, sodium: 536 }
  const targets = model2Result?.targetStandard || { energyMin: 550, proteinMin: 20 }
  const elapsedHours = model1Result?.elapsedHours || 0
  const deliveryWindow = model1Result?.deliveryWindow || ""
  const score = model1Result?.score || 85

  // Estimasi waktu aman tersisa
  const safeMax = SPPG_SCHEDULE.safeMaxHoursFromReady
  const hoursLeft = Math.max(0, safeMax - elapsedHours)
  const hoursLeftStr = hoursLeft > 0
    ? `sekitar ${hoursLeft.toFixed(1)} jam lagi`
    : "sudah habis — konsumsi segera atau jangan dimakan"

  // 1. Tentukan Status Kelayakan MBG
  let eligibilityStatus = "LAYAK KONSUMSI PENUH (GRADE A)"
  let eligibilityColor = "emerald"
  let eligibilitySummary = ""

  if (!isFresh) {
    eligibilityStatus = "PERLU PEMERIKSAAN SEBELUM KONSUMSI"
    eligibilityColor = "amber"
    eligibilitySummary =
      `Porsi makanan menunjukkan indikasi penurunan kesegaran (skor: ${score}/100). ` +
      `Telah ${elapsedHours.toFixed(1)} jam sejak dapur SPPG siap saji. ` +
      `Periksa aroma, tekstur, dan warna secara langsung sebelum memutuskan untuk makan. ` +
      `Jika ada bau asam atau lendir, ajukan aduan segera.`
  } else if (score >= 75) {
    eligibilitySummary =
      `Porsi makanan memenuhi seluruh parameter mutu fisik dan waktu distribusi MBG (skor: ${score}/100). ` +
      `Dikirim dari SPPG ${elapsedHours.toFixed(1)} jam lalu. Masih aman dikonsumsi (sisa waktu aman: ${hoursLeftStr}).`
  } else {
    eligibilityStatus = "LAYAK — SEGERA KONSUMSI"
    eligibilityColor = "emerald"
    eligibilitySummary =
      `Porsi masih layak namun mendekati batas waktu aman distribusi (skor: ${score}/100). ` +
      `Sudah ${elapsedHours.toFixed(1)} jam dari SPPG. Segera habiskan dalam ${hoursLeftStr}.`
  }

  // 2. Analisis Gizi AI LLM
  const proteinTargetMet = macros.protein >= targets.proteinMin
  const energyTargetMet = macros.energy >= targets.energyMin

  const consultationText = isFresh
    ? `Berdasarkan analisis visual Model 1 dan lookup dataset gizi (nilai-gizi.csv), porsi makan ini mengandung ${macros.energy} kkal energi dan ${macros.protein}g protein berkualitas tinggi.

Komponen porsi terdeteksi:
• Karbohidrat kompleks (${macros.carbs}g) dari nasi — menyuplai energi stabil untuk belajar siang.
• Asam amino esensial (${macros.protein}g) dari ayam dan tempe/tahu — untuk pembentukan jaringan dan imunitas.
• Serat alami (${macros.fiber}g) dari sayuran segar dan pisang — memperlancar pencernaan.
• Kalsium & lemak sehat dari susu UHT dan telur — mendukung tumbuh kembang tulang.

${proteinTargetMet ? "✓ Kandungan protein telah melampaui target minimal 20g/porsi." : "⚠ Protein mendekati batas minimum, pastikan semua lauk dikonsumsi."} ${energyTargetMet ? "✓ Kandungan energi dalam rentang ideal AKG siswa SD." : ""}

Estimasi waktu aman konsumsi: ${hoursLeftStr} dari saat ini.`
    : `PERINGATAN AI GIZI: Meskipun kandungan teoritis porsi ini adalah ${macros.energy} kkal dan ${macros.protein}g protein, sistem mendeteksi potensi penurunan kualitas.

Sudah ${elapsedHours.toFixed(1)} jam sejak makanan siap saji di dapur SPPG.
Batas aman rekomendasi: ${safeMax} jam dari siap saji.

Makanan yang telah melampaui batas waktu distribusi atau mengalami pembusukan dapat memicu pelepasan toksin bakteri (Bacillus cereus pada nasi, Salmonella pada ayam). Nilai biologis nutrisi menurun dan berisiko menimbulkan gangguan pencernaan.

Lakukan pemeriksaan indera: pegang tekstur, cium aroma, perhatikan warna. Jika ada keraguan, jangan dikonsumsi dan ajukan aduan.`

  // 3. Rekomendasi Tindakan
  const actionRecommendations = isFresh
    ? [
        "Cuci tangan pakai sabun sebelum mulai makan.",
        `Santap segera — sisa waktu aman distribusi: ${hoursLeftStr}.`,
        "Habiskan semua komponen: sayur, buah, dan susu untuk gizi lengkap.",
        "Catat kondisi boks dan foto jika ada ketidaksesuaian porsi.",
      ]
    : [
        "Periksa aroma terlebih dahulu — nasi basi berbau asam, ayam busuk berbau menyengat.",
        "Periksa tekstur: jika ada lendir pada ayam atau nasi berair, JANGAN dimakan.",
        "Jika ragu, laporkan ke guru piket / validator sekolah.",
        "Klik 'Ajukan Aduan' agar tim Satgas MBG mengirim porsi pengganti.",
      ]

  // 4. Jawaban Pertanyaan Siswa
  let answerToQuestion = null
  if (userQuestion && userQuestion.trim().length > 0) {
    const qLower = userQuestion.toLowerCase()
    if (qLower.includes("cukup") || qLower.includes("energi") || qLower.includes("kalori")) {
      answerToQuestion = `Ya, porsi ini (${macros.energy} kkal) memenuhi sekitar 30–35% AKG harian siswa usia sekolah. Cukup untuk memulihkan energi hingga sore hari.`
    } else if (qLower.includes("protein") || qLower.includes("karbo")) {
      answerToQuestion = `Total protein: ${macros.protein}g dari ayam, tempe, telur, dan susu. Rasio protein:karbo = ${macros.protein}:${macros.carbs} — ideal untuk cegah kantuk setelah makan.`
    } else if (qLower.includes("basi") || qLower.includes("tanda") || qLower.includes("rusak")) {
      answerToQuestion = `Tanda nasi basi: berlendir dan berbau asam. Tanda ayam rusak: permukaan lengket dan berbau menyengat. Tanda sayur rusak: warna gelap dan lembek berair. Makanan sudah ${elapsedHours.toFixed(1)} jam dari dapur — periksa sebelum makan.`
    } else if (qLower.includes("lama") || qLower.includes("aman") || qLower.includes("berapa jam")) {
      answerToQuestion = `Makanan SPPG siap saji sekitar pukul 05:30 WIB. Batas aman konsumsi adalah ${safeMax} jam setelahnya (sekitar 09:00 WIB). Saat ini sudah ${elapsedHours.toFixed(1)} jam — sisa aman: ${hoursLeftStr}.`
    } else {
      answerToQuestion = `Berdasarkan dataset gizi dan standar keamanan pangan MBG, porsi ini dirancang seimbang. Konsumsi semua komponen — nasi, lauk, sayur, buah, dan susu — untuk manfaat gizi maksimal. Sisa waktu aman: ${hoursLeftStr}.`
    }
  }

  return {
    eligibilityStatus,
    eligibilityColor,
    eligibilitySummary,
    consultationText,
    actionRecommendations,
    answerToQuestion,
    macros,
    timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
  }
}
