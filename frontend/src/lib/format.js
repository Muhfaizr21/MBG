// Normalisasi field allergens: API mengirim string ("Laktosa (Susu Sapi)"),
// seed lokal memakai array. Keduanya dikembalikan jadi array of string agar
// aman dipakai .length / .join() di seluruh komponen.
export function toAllergenList(allergens) {
  if (Array.isArray(allergens)) return allergens.filter(Boolean)
  if (typeof allergens === 'string' && allergens.trim()) {
    return allergens
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}
