/**
 * PILIHAN REGISTRASI DAPUR SPPG — mobile
 * Diturunkan dari data yang sudah ada di frontend (sppgData.js & schoolsData.js).
 * Struktur berantai: SPPG -> Kecamatan -> Sekolah.
 */

export interface RegisterSchool {
  id: string;
  npsn: string;
  name: string;
  level: string;
}

export interface RegisterKecamatan {
  id: string;
  name: string;
  schools: RegisterSchool[];
}

export interface RegisterSppg {
  id: string;
  name: string;
  city: string;
  address: string;
  kecamatanOptions: RegisterKecamatan[];
}

export const REGISTER_SPPG_OPTIONS: RegisterSppg[] = [
  {
    id: 'SPPG-001',
    name: 'SPPG Sentral Menteng Sejahtera',
    city: 'Jakarta Pusat',
    address: 'Jl. Teuku Umar No. 18, Menteng',
    kecamatanOptions: [
      {
        id: 'kec-menteng',
        name: 'Kec. Menteng',
        schools: [
          { id: 'SCH-JKT-01', npsn: '20101456', name: 'SDN 01 Menteng Pagi', level: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-002',
    name: 'SPPG Katering Priangan Barokah',
    city: 'Bandung',
    address: 'Jl. R.E. Martadinata No. 85, Cihapit',
    kecamatanOptions: [
      {
        id: 'kec-bandung-wetan',
        name: 'Kec. Bandung Wetan',
        schools: [
          { id: 'SCH-BDG-02', npsn: '20219876', name: 'SMPN 2 Bandung Wetan', level: 'SMP' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-003',
    name: 'SPPG Sentral Pahlawan Nutrisi',
    city: 'Surabaya',
    address: 'Jl. Wonokromo No. 112, Surabaya',
    kecamatanOptions: [
      {
        id: 'kec-genteng',
        name: 'Kec. Genteng',
        schools: [
          { id: 'SCH-SBY-03', npsn: '20532109', name: 'SMPN 1 Surabaya Pusat', level: 'SMP' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-004',
    name: 'SPPG Agro Mandiri Sleman',
    city: 'Sleman',
    address: 'Jl. Kaliurang Km 9.5, Sleman',
    kecamatanOptions: [
      {
        id: 'kec-depok',
        name: 'Kec. Depok',
        schools: [
          { id: 'SCH-YGY-04', npsn: '20401122', name: 'SDN Percobaan 1 Sleman', level: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-005',
    name: 'SPPG Cenderawasih Abepura',
    city: 'Jayapura',
    address: 'Jl. Raya Sentani No. 45, Abepura',
    kecamatanOptions: [
      {
        id: 'distrik-abepura',
        name: 'Distrik Abepura',
        schools: [
          { id: 'SCH-JYP-05', npsn: '60300188', name: 'SD Inpres Kotaraja', level: 'SD' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-006',
    name: 'SPPG Mariso Berkah Bahari',
    city: 'Makassar',
    address: 'Jl. Cendrawasih No. 56, Mariso',
    kecamatanOptions: [
      {
        id: 'kec-ujung-pandang',
        name: 'Kec. Ujung Pandang',
        schools: [
          { id: 'SCH-MKS-06', npsn: '40305678', name: 'SMPN 5 Makassar', level: 'SMP' },
        ],
      },
    ],
  },
  {
    id: 'SPPG-007',
    name: 'SPPG Deli Serdang Sentral',
    city: 'Medan',
    address: 'Jl. Medan - Lubuk Pakam Km 14.5',
    kecamatanOptions: [
      {
        id: 'kec-medan-petisah',
        name: 'Kec. Medan Petisah',
        schools: [
          { id: 'SCH-MDN-07', npsn: '10204567', name: 'MIN 2 Medan Petisah', level: 'MI' },
        ],
      },
    ],
  },
];

export function findRegisterSppg(id: string): RegisterSppg | null {
  return REGISTER_SPPG_OPTIONS.find((s) => s.id === id) ?? null;
}