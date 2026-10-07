import { CommunityPost, COMMUNITY_TAG_CONFIGS } from '../types/community';

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Ibu Ratna Dewi, S.Pd.',
    school: 'SDN Pegangsaan 01',
    authorId: 'auth-ratna-dewi',
    timeAgo: '15 menit lalu',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    tag: 'SOP Suhu',
    tagColor: COMMUNITY_TAG_CONFIGS['SOP Suhu'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['SOP Suhu'].bg,
    title: 'Protokol penanganan tote boks saat suhu mendekati batas minimum 60°C',
    content:
      'Rekan guru validator, jika pembacaan termometer boks tiba di 60.5°C, pastikan porsi dibagikan dalam rentang 30 menit sesuai SOP keamanan pangan BGN.\n\nJangan biarkan boks terbuka lama di selasar sekolah saat cuaca dingin berangin. Segera distribusikan ke ketua kelas atau simpan sementara di ruang berpenghangat jika distribusi mundur dari jadwal biasanya.',
    likesCount: 28,
    isLiked: false,
    isPinned: true,
    comments: [
      {
        id: 'c-101',
        author: 'Pak Budi Santoso, M.Pd.',
        school: 'SDN Cikini 02',
        authorId: 'auth-budi-santoso',
        timeAgo: '10 menit lalu',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        content:
          'Terima kasih pengingatnya Bu Ratna. Kemarin di Cikini 02 sempat tiba di 61°C dan kami langsung percepat pembagian agar makanan tetap hangat dan higienis.',
        likesCount: 5,
        isLiked: false,
        replies: [
          {
            id: 'r-101-1',
            author: 'Ibu Ratna Dewi, S.Pd.',
            school: 'SDN Pegangsaan 01',
            authorId: 'auth-ratna-dewi',
            timeAgo: '6 menit lalu',
            createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
            content:
              'Sangat tepat Pak Budi! Prioritas keselamatan siswa adalah nomor satu sebelum batas 4 jam tercapai.',
            likesCount: 2,
            isLiked: false,
          },
        ],
      },
      {
        id: 'c-102',
        author: 'Ibu Siti Aminah, S.Pd.',
        school: 'SDN Menteng 01 Pagi',
        authorId: 'validator-guru',
        timeAgo: '3 menit lalu',
        createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        content:
          'SOP ini sangat krusial, terutama saat armada SPPG tiba agak siang menjelang jam istirahat kedua.',
        likesCount: 3,
        isLiked: true,
        replies: [],
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Pak Budi Santoso, M.Pd.',
    school: 'SDN Cikini 02',
    authorId: 'auth-budi-santoso',
    timeAgo: '1 jam lalu',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    tag: 'Rekap Presensi',
    tagColor: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].bg,
    title: 'Format ekspor BAST digital & integrasi absensi kehadiran kelas',
    content:
      'Fitur validasi presensi sangat mempercepat serah terima harian. Rekap porsi sisa dari siswa yang izin atau sakit langsung sinkron tanpa perlu pencatatan manual di kertas.\n\nApakah sekolah lain sudah menerapkan alokasi porsi sisa ke staf piket atau dibawa pulang dengan persetujuan orang tua?',
    likesCount: 19,
    isLiked: false,
    comments: [
      {
        id: 'c-201',
        author: 'Pak Hendra Wijaya, S.Pd.',
        school: 'SDN Johar Baru 05',
        authorId: 'auth-hendra-wijaya',
        timeAgo: '45 menit lalu',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        content:
          'Di Johar Baru 05 kami alokasikan untuk penjaga sekolah dan guru pendamping ekstrakurikuler setelah dicatat resmi di BAST digital.',
        likesCount: 4,
        isLiked: false,
        replies: [],
      },
    ],
  },
  {
    id: 'post-3',
    author: 'Ibu Nurul Hidayah, S.Pd.',
    school: 'SDN Menteng 03',
    authorId: 'auth-nurul-hidayah',
    timeAgo: '3 jam lalu',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    tag: 'Menu Alergi',
    tagColor: COMMUNITY_TAG_CONFIGS['Menu Alergi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Menu Alergi'].bg,
    title: 'Penanganan porsi khusus bagi siswa intoleransi laktosa & kacang',
    content:
      'Mulai hari ini SPPG Menteng menyediakan label kuning untuk porsi diet khusus anak yang memiliki riwayat alergi. Jangan lupa memeriksa kode batch saat serah terima dengan kurir armada agar tidak tertukar saat disalurkan ke wali kelas.',
    likesCount: 35,
    isLiked: false,
    comments: [
      {
        id: 'c-301',
        author: 'Ibu Ratna Dewi, S.Pd.',
        school: 'SDN Pegangsaan 01',
        authorId: 'auth-ratna-dewi',
        timeAgo: '2 jam lalu',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content:
          'Label kuning sangat membantu membedakan boks biasa dengan diet khusus. Siswa kami aman tanpa kekhawatiran kontaminasi silang.',
        likesCount: 7,
        isLiked: false,
        replies: [],
      },
    ],
  },
  {
    id: 'post-4',
    author: 'Pak Hendra Wijaya, S.Pd.',
    school: 'SDN Johar Baru 05',
    authorId: 'auth-hendra-wijaya',
    timeAgo: '5 jam lalu',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tag: 'Pindai AI',
    tagColor: COMMUNITY_TAG_CONFIGS['Pindai AI'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Pindai AI'].bg,
    title: 'Tips pencahayaan ruang kelas saat memindai boks dengan kamera AI',
    content:
      'Gunakan sudut 45 derajat saat memotret porsi makanan agar permukaan wadah tidak memantulkan lampu neon ruangan. Hasil deteksi makronutrien karbohidrat dan protein menjadi jauh lebih presisi di layar evaluasi mutu.',
    mediaUri:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
    mediaType: 'image',
    likesCount: 16,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-5',
    author: 'Ibu Siti Aminah, S.Pd.',
    school: 'SDN Menteng 01 Pagi',
    authorId: 'validator-guru',
    timeAgo: '7 jam lalu',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    tag: 'Distribusi',
    tagColor: COMMUNITY_TAG_CONFIGS['Distribusi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Distribusi'].bg,
    title: 'Manajemen alur pembagian 350 porsi dalam 20 menit sebelum jam istirahat',
    content:
      'Kami membagi tim validator menjadi 3 pos: pos serah terima gerbang, pos verifikasi barcode kelas, dan pos sampling organoleptik. Alur ini memangkas waktu tunggu siswa secara signifikan.',
    likesCount: 22,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-6',
    author: 'Pak Ahmad Fauzi, S.Pd.',
    school: 'SDN Rawamangun 12',
    authorId: 'auth-ahmad-fauzi',
    timeAgo: '9 jam lalu',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    tag: 'Kebersihan',
    tagColor: COMMUNITY_TAG_CONFIGS['Kebersihan'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Kebersihan'].bg,
    title: 'SOP sanitasi meja serah terima dan pemilahan sisa kemasan organik',
    content:
      'Sebelum tote boks diturunkan dari mobil van SPPG, meja kayu serah terima disemprot disinfektan food-grade dan dilap kering. Sisa kemasan dipilah langsung ke bak kuning daur ulang.',
    likesCount: 14,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-7',
    author: 'Ibu Rina Kusuma, S.Pd.',
    school: 'SDN Kebon Sirih 03',
    authorId: 'auth-rina-kusuma',
    timeAgo: '12 jam lalu',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    tag: 'SOP Suhu',
    tagColor: COMMUNITY_TAG_CONFIGS['SOP Suhu'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['SOP Suhu'].bg,
    title: 'Kalibrasi termometer inframerah vs termometer probe jarum',
    content:
      'Pengalaman kami di Kebon Sirih 03, termometer inframerah hanya membaca kulit luar wadah. Untuk sup atau kuah sayur bening, selalu gunakan probe sensor yang steril sedalam 3cm.',
    likesCount: 31,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-8',
    author: 'Pak Dedi Supriyadi, M.Pd.',
    school: 'SDN Senen 01 Pagi',
    authorId: 'auth-dedi-supriyadi',
    timeAgo: '14 jam lalu',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    tag: 'Rekap Presensi',
    tagColor: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].bg,
    title: 'Penanganan selisih 2 porsi antara manifes SPPG dan siswa hadir',
    content:
      'Jika manifes armada mencatat 240 boks namun presensi riil hanya 238 anak, tombol klaim selisih langsung ditekan saat tanda tangan digital bersama kurir armada.',
    likesCount: 18,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-9',
    author: 'Ibu Tri Wahyuni, S.Pd.',
    school: 'SDN Pasar Baru 05',
    authorId: 'auth-tri-wahyuni',
    timeAgo: '16 jam lalu',
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    tag: 'Menu Alergi',
    tagColor: COMMUNITY_TAG_CONFIGS['Menu Alergi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Menu Alergi'].bg,
    title: 'Daftar riwayat medis alergi telur puyuh & udang anak kelas 1-3',
    content:
      'Kami membuat kartu kendali gizi yang ditempel di map presensi wali kelas. Kurir SPPG diberi salinan agar tidak memasukkan lauk udang ke rombel terkait.',
    likesCount: 27,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-10',
    author: 'Pak Bambang Irawan, S.Pd.',
    school: 'SDN Cempaka Putih 01',
    authorId: 'auth-bambang-irawan',
    timeAgo: '18 jam lalu',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    tag: 'Pindai AI',
    tagColor: COMMUNITY_TAG_CONFIGS['Pindai AI'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Pindai AI'].bg,
    title: 'Deteksi kematangan buah pisang & pepaya pada menu penutup MBG',
    content:
      'Kamera AI YOLOv8 mendeteksi bintik getah atau memar pada pisang cavendish. Jika indeks kelayakan di bawah 75%, aplikasi otomatis memberi rekomendasi penggantian buah segar.',
    likesCount: 20,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-11',
    author: 'Ibu Sri Mulyani, S.Pd.',
    school: 'SDN Tanah Abang 02',
    authorId: 'auth-sri-mulyani',
    timeAgo: '1 hari lalu',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tag: 'Distribusi',
    tagColor: COMMUNITY_TAG_CONFIGS['Distribusi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Distribusi'].bg,
    title: 'Tips armada logistik yang terhambat genangan air saat musim hujan',
    content:
      'Bila kurir terlambat akibat banjir, koordinasi via hotline SPPG sangat penting agar jadwal makan siang siswa dimajukan atau disesuaikan dengan snack darurat.',
    likesCount: 15,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-12',
    author: 'Pak Wahyu Hidayat, S.Pd.',
    school: 'SDN Kemayoran 07',
    authorId: 'auth-wahyu-hidayat',
    timeAgo: '1 hari lalu',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    tag: 'Kebersihan',
    tagColor: COMMUNITY_TAG_CONFIGS['Kebersihan'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Kebersihan'].bg,
    title: 'Pemeriksaan segel stiker tamper-evident pada tote boks termal',
    content:
      'Pastikan segel hologram pada boks tidak robek sebelum dibuka. Ini bukti otentik bahwa boks tidak dibuka di tengah jalan oleh pihak tidak berwenang.',
    likesCount: 29,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-13',
    author: 'Ibu Dewi Sartika, S.Pd.',
    school: 'SDN Gambir 01 Pagi',
    authorId: 'auth-dewi-sartika',
    timeAgo: '1 hari lalu',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    tag: 'SOP Suhu',
    tagColor: COMMUNITY_TAG_CONFIGS['SOP Suhu'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['SOP Suhu'].bg,
    title: 'Tindakan karantina bila suhu lauk hewani berada di 54°C',
    content:
      'Sesuai panduan teknis BGN, lauk berkuah di bawah 55°C tidak boleh dibagikan. Hubungi penanggung jawab gizi SPPG untuk pengiriman boks pengganti kilat.',
    likesCount: 38,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-14',
    author: 'Pak Joko Susilo, M.Pd.',
    school: 'SDN Gondangdia 03',
    authorId: 'auth-joko-susilo',
    timeAgo: '2 hari lalu',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    tag: 'Rekap Presensi',
    tagColor: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].bg,
    title: 'Tanda tangan kurir armada menggunakan stylus pen vs sidik jari digital',
    content:
      'Memakai stylus pen pada layar smartphone sekolah membuat tanda tangan digital BAST jauh lebih terbaca dan valid di arsip audit BPKP.',
    likesCount: 17,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-15',
    author: 'Ibu Endang Rahayu, S.Pd.',
    school: 'SDN Kramat 05',
    authorId: 'auth-endang-rahayu',
    timeAgo: '2 hari lalu',
    createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
    tag: 'Menu Alergi',
    tagColor: COMMUNITY_TAG_CONFIGS['Menu Alergi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Menu Alergi'].bg,
    title: 'Alternatif protein pengganti tahu bagi siswa dengan alergi kedelai',
    content:
      'SPPG menyediakan menu alternatif berupa telur ayam rebus dan fillet ikan kakap kukus untuk 4 siswa kami yang alergi produk turunan kedelai.',
    likesCount: 24,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-16',
    author: 'Pak Rudi Hermawan, S.Pd.',
    school: 'SDN Petojo Selatan 01',
    authorId: 'auth-rudi-hermawan',
    timeAgo: '3 hari lalu',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    tag: 'Pindai AI',
    tagColor: COMMUNITY_TAG_CONFIGS['Pindai AI'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Pindai AI'].bg,
    title: 'Mendeteksi aroma dan lendir pada sayur bayam yang telah lewat 3 jam',
    content:
      'Bayam yang mulai berlendir tampak memiliki kilau anomali di lensa kamera AI. Fitur deteksi basi dini langsung memberikan peringatan warna oranye.',
    likesCount: 33,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-17',
    author: 'Ibu Yuliana Mansyur, S.Pd.',
    school: 'SDN Kampung Bali 03',
    authorId: 'auth-yuliana-mansyur',
    timeAgo: '3 hari lalu',
    createdAt: new Date(Date.now() - 76 * 60 * 60 * 1000).toISOString(),
    tag: 'Distribusi',
    tagColor: COMMUNITY_TAG_CONFIGS['Distribusi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Distribusi'].bg,
    title: 'Peran dokter kecil UKS dalam membantu tertib antrean makan siang',
    content:
      'Dokter kecil bertugas membagikan tisu basah dan memastikan siswa mencuci tangan dengan sabun mengalir sebelum membuka wadah makan bergizi.',
    likesCount: 26,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-18',
    author: 'Pak Gunawan Wibowo, S.Pd.',
    school: 'SDN Kenari 08 Pagi',
    authorId: 'auth-gunawan-wibowo',
    timeAgo: '4 hari lalu',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    tag: 'Kebersihan',
    tagColor: COMMUNITY_TAG_CONFIGS['Kebersihan'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Kebersihan'].bg,
    title: 'Pengembalian wadah stainless steel bersekat ke armada SPPG',
    content:
      'Wadah makan dicuci bilas awal oleh piket siswa, ditumpuk rapi di tote boks kering, dan dihitung jumlahnya saat armada kembali pukul 14:00 WIB.',
    likesCount: 19,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-19',
    author: 'Ibu Farida Hanum, S.Pd.',
    school: 'SDN Kwitang 01',
    authorId: 'auth-farida-hanum',
    timeAgo: '4 hari lalu',
    createdAt: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(),
    tag: 'SOP Suhu',
    tagColor: COMMUNITY_TAG_CONFIGS['SOP Suhu'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['SOP Suhu'].bg,
    title: 'Insulasi tote boks pada kendaraan roda dua vs mobil boks pendingin',
    content:
      'Tote boks dengan busa poliuretan 4cm mampu menahan panas hingga 4 jam dengan penurunan suhu hanya 2.5°C per jam pada kondisi jalanan terik.',
    likesCount: 21,
    isLiked: false,
    comments: [],
  },
  {
    id: 'post-20',
    author: 'Pak Taufik Hidayat, M.Pd.',
    school: 'SDN Cikini 01',
    authorId: 'auth-taufik-hidayat',
    timeAgo: '5 hari lalu',
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    tag: 'Rekap Presensi',
    tagColor: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].color,
    tagBg: COMMUNITY_TAG_CONFIGS['Rekap Presensi'].bg,
    title: 'Rekap mingguan konsumsi porsi makanan untuk laporan kepala sekolah',
    content:
      'Fitur riwayat BAST memudahkan kami mencetak laporan bulanan untuk diserahkan ke Dinas Pendidikan dan Fasilitator Satgas MBG Provinsi.',
    likesCount: 30,
    isLiked: false,
    comments: [],
  },
];

export interface FetchCommunityParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}

export interface PaginatedCommunityResponse {
  data: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Mock API fetcher function supporting chunked pagination (default limit: 10).
 * Simulates realistic network latency for infinite scroll demonstration.
 */
export const fetchMockCommunityPosts = async (
  allPosts: CommunityPost[],
  params: FetchCommunityParams = {}
): Promise<PaginatedCommunityResponse> => {
  const { page = 1, limit = 10, tag = 'Semua', search = '' } = params;

  // Simulate network latency (400ms) for realistic UX and spinner demonstration
  await new Promise((resolve) => setTimeout(resolve, 400));

  let filtered = [...allPosts];
  if (tag && tag !== 'Semua') {
    filtered = filtered.filter((p) => p.tag === tag);
  }
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.school.toLowerCase().includes(q),
    );
  }

  const offset = (page - 1) * limit;
  const pageData = filtered.slice(offset, offset + limit);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const hasMore = offset + pageData.length < total;

  return {
    data: pageData,
    total,
    page,
    limit,
    totalPages,
    hasMore,
  };
};
