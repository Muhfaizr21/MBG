import {
  describeAllocation,
  reconcileClass,
  sumDistribution,
} from '../../src/utils/distribution.ts';

const assertEqual = (actual: unknown, expected: unknown, label: string) => {
  if (actual !== expected) {
    throw new Error(`distribution check failed: ${label}, got ${String(actual)}`);
  }
};

const kelas1A = reconcileClass({ id: '1A', name: 'Kelas 1A', quota: 28, hadir: 27, sakit: 1 });
assertEqual(kelas1A.porsiDiterahkan, 27, 'porsi diserahkan sama dengan hadir');
assertEqual(kelas1A.porsiSisa, 1, 'sisa 1 porsi');
assertEqual(kelas1A.inconsistent, false, 'absensi 27+1 konsisten dengan kuota 28');

const kelas1B = reconcileClass({ id: '1B', name: 'Kelas 1B', quota: 30, hadir: 30, sakit: 0 });
assertEqual(kelas1B.porsiSisa, 0, 'penuh Hadir, tidak ada sisa');
assertEqual(kelas1B.inconsistent, false, 'absensi penuh konsisten');

const lebih = reconcileClass({ id: '2A', name: 'Kelas 2A', quota: 29, hadir: 30, sakit: 1 });
assertEqual(lebih.inconsistent, true, 'hadir dan sakit melebihi kuota');
assertEqual(lebih.porsiSisa, -1, 'sisa negatif terdeteksi');

const nol = reconcileClass({ id: '3A', name: 'Kelas 3A', quota: 20, hadir: 0, sakit: 0 });
assertEqual(nol.porsiSisa, 20, 'seluruh kuota jadi sisa');
assertEqual(nol.inconsistent, false, 'tidak hadir bukan ketidaksesuaian');

const totals = sumDistribution([kelas1A, kelas1B, nol]);
assertEqual(totals.quota, 78, 'total kuota');
assertEqual(totals.hadir, 57, 'total hadir');
assertEqual(totals.porsiDiterahkan, 57, 'total porsi diserahkan');
assertEqual(totals.porsiSisa, 21, 'total sisa');
assertEqual(totals.incompleteClasses.length, 2, 'dua kelas belum genap');
assertEqual(sumDistribution([]).porsiSisa, 0, 'daftar kosong nol');

assertEqual(describeAllocation({ portions: 3, allocation: 'staf' }), '3 porsi diserahkan ke staf sekolah', 'alokasi staf');
assertEqual(
  describeAllocation({ portions: 3, allocation: 'snack_sore' }),
  '3 porsi disimpan untuk makanan tambahan sore',
  'alokasi snack sore',
);
assertEqual(describeAllocation({ portions: 3, allocation: 'belum' }), '3 porsi sisa belum dialokasikan', 'belum dialokasikan');

console.log('distribution check: OK');
