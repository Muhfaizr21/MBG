/**
 * Data sekolah binaan dapur SPPG-01.
 * Merujuk SPPG.md Bab 6: kuota cetak mengikuti presensi yang dimutakhirkan
 * sekolah sebelum 05:00. Status presensi dihitung dari jam update, dan kuota
 * cetak dihitung dari siswa hadir, bukan ditulis manual.
 */

export const ATTENDANCE_DEADLINE = '05:00'

function toMinutes(clock) {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

export function attendanceStatus(updatedAt) {
  if (!updatedAt) return { label: 'Belum update', tone: 'bg-slate-100 text-slate-600', onTime: false }
  const onTime = toMinutes(updatedAt) <= toMinutes(ATTENDANCE_DEADLINE)
  return onTime
    ? { label: `Update ${updatedAt}`, tone: 'bg-emerald-50 text-emerald-800', onTime: true }
    : { label: `Telat ${updatedAt}`, tone: 'bg-amber-50 text-amber-900', onTime: false }
}

// Tanpa update presensi, kuota memakai data terdaftar kemarin supaya
// dapur tidak berhenti. Sekolahnya ditandai Belum update di tabel.
export function packingQuota(profile) {
  if (!profile.presentUpdatedAt) return profile.enrolled
  return Math.max(0, profile.present - profile.reduceSpecial)
}

export const SCHOOL_PROFILES = [
  {
    id: 'sch-01',
    address: 'Jl. Menteng Raya No. 12, Jakarta Pusat',
    level: 'SD kelas atas',
    enrolled: 668,
    present: 650,
    reduceSpecial: 0,
    absenceNote: '18 siswa izin sakit dan dinas luar',
    presentUpdatedAt: '04:42',
    specials: [
      { type: 'Alergi kacang', count: 6, note: 'Lauk diganti ayam tanpa bumbu kacang' },
      { type: 'Diet rendah gula', count: 2, note: 'Susu diganti air mineral' },
    ],
    principal: '[Nama Kepala Sekolah]',
    validator: '[Nama Guru Validator]',
    validatorPhone: '0000-0000-0000',
    droppoint: 'Gerbang belakang, ruang UKS lantai 1. Kurir lapor satpam pos 2.',
  },
  {
    id: 'sch-02',
    address: 'Jl. Pegangsaan Timur No. 5, Jakarta Pusat',
    level: 'SD kelas bawah',
    enrolled: 590,
    present: 550,
    reduceSpecial: 40,
    absenceNote: '40 siswa kelas 2 study tour ke Ragunan, porsi dikurangi agar tidak terbuang',
    presentUpdatedAt: '04:55',
    specials: [{ type: 'Alergi susu sapi', count: 4, note: 'Susu diganti sari kedelai' }],
    principal: '[Nama Kepala Sekolah]',
    validator: '[Nama Guru Validator]',
    validatorPhone: '0000-0000-0000',
    droppoint: 'Gerbang utama, aula serbaguna. Parkir armada di bahu jalan depan pos.',
  },
  {
    id: 'sch-03',
    address: 'Jl. St. Senen Raya No. 30, Jakarta Pusat',
    level: 'SMP',
    enrolled: 771,
    present: 750,
    reduceSpecial: 0,
    absenceNote: '21 siswa absen biasa',
    presentUpdatedAt: '05:12',
    specials: [
      { type: 'Alergi kacang', count: 9, note: 'Lauk diganti ayam tanpa bumbu kacang' },
      { type: 'Vegetarian', count: 3, note: 'Ayam diganti tahu tempe ganda' },
    ],
    principal: '[Nama Kepala Sekolah]',
    validator: '[Nama Guru Validator]',
    validatorPhone: '0000-0000-0000',
    droppoint: 'Gerbang samping kantin, meja serah terima lorong B.',
  },
  {
    id: 'sch-04',
    address: 'Jl. Cikini Raya No. 70, Jakarta Pusat',
    level: 'SD kelas atas',
    enrolled: 558,
    present: 550,
    reduceSpecial: 0,
    absenceNote: '8 siswa izin',
    presentUpdatedAt: '',
    specials: [],
    principal: '[Nama Kepala Sekolah]',
    validator: '[Nama Guru Validator]',
    validatorPhone: '0000-0000-0000',
    droppoint: 'Gerbang belakang dekat masjid, ruang kelas 6A sebagai transit.',
  },
]
