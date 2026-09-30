/**
 * Target AKG per kelompok umur, dipakai membandingkan estimasi porsi.
 * Sumber: SPPG.md Bab 5 (SD bawah 450-500 kkal, SD atas 550 kkal, SMP 650 kkal)
 * dan SUPERADMIN.md Bab 10 (target protein, karbohidrat, lemak, serat).
 * Angka estimasi dan targetnya berasal dari SUPERADMIN.md: "Energi (545/550 kkal),
 * Protein (34/30g), Karbohidrat (68/70g), Lemak (14/15g), Serat (7.1/6g)".
 * Protein, karbohidrat, lemak, dan serat di bawah memakai kelompok SD atas.
 */
export type GradeBand = 'sd_bawah' | 'sd_atas' | 'smp';

export interface MacroTarget {
  key: 'energi' | 'protein' | 'karbohidrat' | 'lemak' | 'serat';
  label: string;
  unit: string;
  target: number;
}

export const AKG_TARGETS: Record<GradeBand, MacroTarget[]> = {
  sd_bawah: [
    { key: 'energi', label: 'Energi', unit: 'kkal', target: 475 },
    { key: 'protein', label: 'Protein', unit: 'g', target: 24 },
    { key: 'karbohidrat', label: 'Karbohidrat', unit: 'g', target: 60 },
    { key: 'lemak', label: 'Lemak', unit: 'g', target: 14 },
    { key: 'serat', label: 'Serat', unit: 'g', target: 5 },
  ],
  sd_atas: [
    { key: 'energi', label: 'Energi', unit: 'kkal', target: 550 },
    { key: 'protein', label: 'Protein', unit: 'g', target: 30 },
    { key: 'karbohidrat', label: 'Karbohidrat', unit: 'g', target: 70 },
    { key: 'lemak', label: 'Lemak', unit: 'g', target: 15 },
    { key: 'serat', label: 'Serat', unit: 'g', target: 6 },
  ],
  smp: [
    { key: 'energi', label: 'Energi', unit: 'kkal', target: 650 },
    { key: 'protein', label: 'Protein', unit: 'g', target: 35 },
    { key: 'karbohidrat', label: 'Karbohidrat', unit: 'g', target: 90 },
    { key: 'lemak', label: 'Lemak', unit: 'g', target: 18 },
    { key: 'serat', label: 'Serat', unit: 'g', target: 7 },
  ],
};

export interface MacroReading extends MacroTarget {
  estimated: number;
  /** Persentase dari target AKG, 0-100 untuk lebar bar. */
  ratio: number;
  /** Persentase apa adanya, bisa di atas 100. */
  percentage: number;
}

export const readMacros = (band: GradeBand, estimated: Record<string, number>): MacroReading[] =>
  AKG_TARGETS[band].map((target) => {
    const value = estimated[target.key] ?? 0;
    const percentage = target.target ? Math.round((value / target.target) * 100) : 0;
    return { ...target, estimated: value, percentage, ratio: Math.min(percentage, 100) };
  });
