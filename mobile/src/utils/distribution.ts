/**
 * Rekonsiliasi distribusi per kelas dan penanganan porsi sisa.
 * Sumber: VALIDATOR.md Bab 5.B.2-3.
 */

export interface ClassInput {
  id: string;
  name: string;
  /** Kuota porsi resmi sekolah untuk kelas ini. */
  quota: number;
  /** Siswa yang hadir dan menerima porsi. */
  hadir: number;
  /** Siswa tidak masuk sekolah. */
  sakit: number;
}

export interface ClassReconciliation {
  id: string;
  name: string;
  quota: number;
  hadir: number;
  sakit: number;
  /** Porsi yang benar-benar diserahkan, sama dengan jumlah hadir. */
  porsiDiterahkan: number;
  /** Porsi tersisa di sekolah karena siswa tidak hadir. */
  porsiSisa: number;
  /** Absensi tidak logis: hadir dan sakit melebihi kuota. */
  inconsistent: boolean;
  note: string;
}

export const reconcileClass = (input: ClassInput): ClassReconciliation => {
  const porsiSisa = input.quota - input.hadir;
  const inconsistent = input.hadir + input.sakit > input.quota || porsiSisa < 0;

  return {
    ...input,
    porsiDiterahkan: input.hadir,
    porsiSisa,
    inconsistent,
    note: inconsistent
      ? 'Jumlah hadir dan sakit melebihi kuota. Periksa absensi.'
      : porsiSisa > 0
        ? `${porsiSisa} porsi sisa menunggu alokasi`
        : 'Porsi terbagi semua',
  };
};

export interface DistributionTotals {
  quota: number;
  hadir: number;
  sakit: number;
  porsiDiterahkan: number;
  porsiSisa: number;
  incompleteClasses: string[];
}

export const sumDistribution = (classes: ClassReconciliation[]): DistributionTotals =>
  classes.reduce<DistributionTotals>(
    (total, item) => ({
      quota: total.quota + item.quota,
      hadir: total.hadir + item.hadir,
      sakit: total.sakit + item.sakit,
      porsiDiterahkan: total.porsiDiterahkan + item.porsiDiterahkan,
      porsiSisa: total.porsiSisa + item.porsiSisa,
      incompleteClasses:
      item.porsiSisa > 0 ? [...total.incompleteClasses, item.name] : total.incompleteClasses,
    }),
    { quota: 0, hadir: 0, sakit: 0, porsiDiterahkan: 0, porsiSisa: 0, incompleteClasses: [] },
  );

export type SurplusAllocation = 'staf' | 'snack_sore' | 'belum';

export const SURPLUS_OPTIONS: { key: SurplusAllocation; label: string; hint: string }[] = [
  {
    key: 'staf',
    label: 'Diserahkan ke staf sekolah',
    hint: 'Penjaga atau petugas kebersihan sekolah menerima porsi sisa',
  },
  {
    key: 'snack_sore',
    label: 'Disimpan untuk makanan tambahan sore',
    hint: 'Disimpan di lemari pendingin sekolah sesuai SOP',
  },
  {
    key: 'belum',
    label: 'Belum dialokasikan',
    hint: 'Porsi sisa menunggu keputusan guru',
  },
];

export interface SurplusRecord {
  portions: number;
  allocation: SurplusAllocation;
}

export const describeAllocation = (record: SurplusRecord): string => {
  if (record.allocation === 'staf') {
    return `${record.portions} porsi diserahkan ke staf sekolah`;
  }
  if (record.allocation === 'snack_sore') {
    return `${record.portions} porsi disimpan untuk makanan tambahan sore`;
  }
  return `${record.portions} porsi sisa belum dialokasikan`;
};
