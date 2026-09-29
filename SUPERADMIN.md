# KAWANGIZI — PANDUAN LENGKAP & AUDIT FITUR PERSIDEBAR SUPERADMIN
**Sistem Skrining Kelayakan Konsumsi & Pemindai Makronutrien Berbasis Computer Vision (YOLOv8)**  
*Dokumen Cetak Biru Fungsionalitas & Aksi Superadmin (Satgas MBG, BGN, Kemenkes, dan Dinas Kesehatan)*

---

## DAFTAR ISI MENU SIDEBAR

| No | Ikon & Menu Sidebar | Endpoint Rute | Fokus Operasional |
|:--:|:--------------------|:--------------|:------------------|
| 1 | 🏠 **Dashboard** | `/admin/dashboard` | Menara Pengawas Utama (Executive KPI, Status Distribusi Nasional, & Live Telemetry) |
| 2 | 👤 **Profil Validator** | `/admin/validators` | Manajemen Kredensial, Sertifikasi, & Audit Integritas Petugas Lapangan |
| 3 | 🍳 **Dapur SPPG** | `/admin/sppg` | Direktori Dapur Sentral, Kapasitas Produksi, Akreditasi Sanitasi, & SOP Masak |
| 4 | 📊 **Hasil Pengiriman** | `/admin/deliveries` | Audit Hasil Pindai Kamera AI YOLOv8, Suhu Cold-Chain, & Verifikasi Status Porsi |
| 5 | 📅 **Penerimaan Siswa** | `/admin/attendance` | Rekonsiliasi Jumlah Porsi Tiba vs Kehadiran Riil Siswa & Mitigasi *Food Waste* |
| 6 | 📋 **Sekolah Binaan** | `/admin/schools` | Pangkalan Data Sekolah (NPSN), Pemetaan Klaster Wilayah, & Alokasi Dapur Pengirim |
| 7 | 🕒 **Jadwal Distribusi** | `/admin/schedule` | Manajemen Jendela Waktu Kirim (06:45–07:30 WIB), Rute Armada, & Tracking ETA |
| 8 | 📢 **Papan Pengumuman** | `/admin/notices` | Pusat Siaran Arahan Nasional, Peringatan Bahaya, & Regulasi BGN Terpusat |
| 9 | 🗓️ **Kalender MBG** | `/admin/calendar` | Siklus Menu Pangan Harian, Kalender Operasional Sekolah, & Jadwal Audit Lapangan |
| 10 | 📥 **Unduh Laporan** | `/admin/reports` | Ekspor Dokumen Resmi BGN/BPK, Rekapitulasi Gizi TKPI, & Sertifikat BAST Pencairan |
| 11 | 💬 **Aduan & Feedback** | `/admin/feedback` | Pusat Krisis Insiden Makanan Rusak, Penanganan Keluhan Sekolah, & Triage Investigasi |

---

## 1. 🏠 DASHBOARD (`/admin/dashboard`)

### A. Latar Belakang & Konteks Sistem
Merujuk pada Bab 2.3 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md), Satgas MBG membutuhkan pusat komando (*Command Center*) terpusat dengan kemampuan rendering cepat (*Server-Side Rendering*) untuk memantau sebaran logistik nasional dan mendeteksi potensi anomali sebelum jam makan siang sekolah tiba.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Agregasi Metrik Nasional Real-Time**: Memantau total porsi yang telah tervalidasi hari ini terhadap target harian (misal: 542.850 dari target 550.000 porsi).
2. **Indeks Keamanan Pangan Nasional**: Menghitung rasio kepatuhan rantai dingin (*Cold-Chain Compliance Rate*) dan rata-rata suhu armada (20–25°C).
3. **Deteksi Status Operasional**: Mengklasifikasikan kondisi operasional hari ini ke dalam status *Normal (Hijau)*, *Perhatian Khusus (Kuning)*, atau *Darurat Insiden (Merah)*.
4. **Peta Sebaran Risiko Cepat**: Menampilkan ringkasan status 5 klaster sentra wilayah (DKI & Bodetabek, Bandung Raya, Jawa Tengah, Jawa Timur, dan Luar Jawa).

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Filter Periode & Wilayah**: Mengubah tampilan metrik berdasarkan klaster provinsi, kabupaten/kota, atau tanggal distribusi.
* **Sinkronisasi Manual (Force Refresh)**: Menarik data telemetri sensor IoT dan log pemindaian terbaru dari API Gateway Golang.
* **Ekspor Ringkasan Eksekutif**: Mengunduh rangkuman PDF 1 halaman untuk laporan pimpinan harian (BGN / Kantor Staf Presiden).
* **Inspeksi Anomali Cepat**: Mengklik kartu metrik bermasalah (misal: "0.8% Armada di Zona Waspada") untuk langsung diarahkan ke daftar armada yang mengalami kenaikan suhu.

---

## 2. 👤 PROFIL VALIDATOR (`/admin/validators`)

### A. Latar Belakang & Konteks Sistem
Bab 3.2.1 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) menegaskan bahwa **Guru dan Staf Sekolah adalah garda terdepan (Validator Lapangan)**. Karena mereka memegang kewenangan meloloskan atau menolak makanan sebelum dimakan siswa, akun dan kredensial validator harus diawasi dengan ketat agar tidak disalahgunakan atau dimanipulasi oleh oknum katering.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Basis Data Validator Terverifikasi**: Menyimpan data guru/staf validator resmi yang terikat pada Nomor Pokok Sekolah Nasional (NPSN) tertentu.
2. **Audit Integritas & Jam Kerja Pemindaian**: Melacak jam berapa validator mulai menyalakan kamera, berapa lama durasi inspeksi per boks, dan konsistensi hasil pemindaian.
3. **Pendeteksi Anomali Pemindaian**: Menandai validator yang memindai terlalu cepat (misal: < 0.2 detik per porsi tanpa mengarahkan kamera dengan benar) yang mengindikasikan kelalaian SOP.
4. **Status Sertifikasi Keamanan Pangan**: Mencatat apakah guru/staf telah menyelesaikan modul pelatihan dasar higienitas dan pemindaian KawanGizi.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Aktivasi & Penonaktifan Akun (Whitelist/Blacklist)**: Menyetujui pendaftaran validator baru atau membekukan akun validator yang terindikasi manipulasi.
* **Reset Perangkat (Device Binding Reset)**: Memutus tautan akun validator dari smartphone lama jika guru berganti ponsel atau mutasi tugas.
* **Pemberian Surat Peringatan / Notifikasi Teguran**: Mengirimkan peringatan langsung ke aplikasi mobile validator yang sering terlambat melakukan skrining porsi.
* **Penugasan Validator Cadangan**: Mengalihkan otoritas pemindaian kepada guru piket cadangan jika validator utama berhalangan hadir.

---

## 3. 🍳 DAPUR SPPG (`/admin/sppg`)

### A. Latar Belakang & Konteks Sistem
Dapur Sentral Satuan Pelayanan Pangan Bergizi (SPPG) atau katering rekanan adalah produsen makanan. Bab 4.2 Poin 8 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) menyatakan Superadmin memerlukan fitur evaluasi kepatuhan vendor agar dapat mendeteksi dapur yang memproduksi makanan tidak higienis atau mengurangi porsi.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Direktori Lengkap Produsen**: Profil Dapur SPPG, penanggung jawab produksi, alamat dapur, kapasitas harian (misal: 2.500 porsi/hari), dan daftar sekolah yang menjadi tanggung jawab suplai.
2. **Rapor Akreditasi Sanitasi (Scorecard)**: Penilaian otomatis berbasis riwayat mutu:
   * *Safety Score*: Persentase makanan yang lolos skrining kamera AI.
   * *Cold-Chain Score*: Kepatuhan menjaga suhu makanan di armada pengantar.
   * *Timeliness Score*: Ketepatan pengiriman tiba di sekolah sebelum jam 07:30 WIB.
3. **Audit Sertifikat SLHS & HACCP**: Pemantauan masa berlaku Sertifikat Laik Higiene Sanitasi dari Dinas Kesehatan setempat.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Penerbitan Surat Peringatan (SP-1 / SP-2)**: Diterbitkan secara digital jika dapur mencatatkan skor kepatuhan < 85% dalam 7 hari berturut-turut.
* **Penangguhan Izin Distribusi (Suspension)**: Membekukan hak suplai dapur jika ditemukan indikasi bakteri patogen atau pemalsuan bahan baku.
* **Audit Gramatur Resep**: Memeriksa apakah dapur memasukkan takaran bahan baku sesuai standar Tabel Komposisi Pangan Kemenkes (TKPI).
* **Penetapan Kuota Produksi**: Menambah atau membatasi alokasi porsi harian yang boleh dimasak oleh dapur tertentu berdasarkan kapasitas peralatan dan kebersihan dapurnya.

---

## 4. 📊 HASIL PENGIRIMAN (`/admin/deliveries`)

### A. Latar Belakang & Konteks Sistem
Ini adalah denyut nadi operasional sistem KawanGizi sesuai Bab 3.3.2 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md). Setiap boks makanan yang dipindai kamera HP validator diproses oleh algoritma YOLOv8 di backend Python untuk mendeteksi tanda pembusukan dan estimasi gizi secara instan.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Rekam Jejak Validasi Digital**: Menyimpan log setiap porsi yang tiba di sekolah lengkap dengan foto resolusi tinggi hasil tangkapan kamera validator.
2. **Inspeksi Hasil YOLOv8**: Menampilkan *Bounding Box* deteksi objek (misal: ayam segar, sayur brokoli, atau deteksi anomali seperti lendir/jamur/perubahan warna).
3. **Telemetri Suhu Saat Tiba**: Mencatat suhu termal boks pengiriman pada detik serah terima dilakukan.
4. **Verifikasi Token QR Unik**: Memastikan token porsi asli, belum pernah dipindai sebelumnya (*anti-duplicate scan*), dan belum melewati batas aman konsumsi.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Inspeksi Sertifikat Digital Porsi**: Mengklik baris pengiriman untuk melihat sertifikat kriptografis (SHA-256 Hash), foto porsi, dan rincian makronutrien.
* **Override Hasil AI (Penetapan Manual)**: Jika model AI mendeteksi anomali palsu (*false positive*), Superadmin bersama tim ahli gizi dapat mengesahkan kelayakan porsi secara manual dengan membubuhkan catatan audit resmi.
* **Perintah Uji Petik Laboratorium**: Mengirimkan perintah ke Dinas Kesehatan terdekat untuk mengambil sampel porsi di sekolah tersebut guna uji kultur mikroba (E. coli / Salmonella).
* **Unduh Bukti Verifikasi**: Mengunduh berkas foto dan data telemetri sebagai alat bukti legal serah terima makanan.

---

## 5. 📅 PENERIMAAN SISWA (`/admin/attendance`)

### A. Latar Belakang & Konteks Sistem
Salah satu celah operasional MBG adalah ketidakcocokan antara porsi yang dikirim dari dapur umum dengan jumlah siswa yang masuk sekolah pada hari itu. Hal ini rentan memicu porsi terbuang sia-sia (*food waste*) atau porsi dibiarkan terlalu lama di meja hingga basi.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Rekonsiliasi Porsi vs Presensi**: Membandingkan jumlah porsi makanan yang lolos validasi dengan presensi fisik siswa di kelas pada jam makan siang.
2. **Pelacak Sisa Porsi Aman**: Mengidentifikasi sekolah-sekolah yang memiliki kelebihan porsi (misal: 20 siswa tidak masuk karena sakit) agar porsi berlebih yang masih sangat higienis dapat dialihkan secara aman sebelum batas 4 jam habis.
3. **Tren Konsumsi & Tingkat Kehabisan Porsi**: Memantau apakah porsi makanan habis disantap siswa atau menyisakan banyak sisa sayuran/lauk (sebagai bahan evaluasi resep rasa makanan).

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Penyesuaian Alokasi Harian Otomatis**: Menyesuaikan pesanan porsi untuk hari esok berdasarkan tren kehadiran siswa sekolah tersebut agar menghemat anggaran negara.
* **Otorisasi Distribusi Porsi Berlebih**: Menyetujui pengalihan sisa porsi yang belum tersentuh ke panti asuhan atau posko sosial terdekat dengan batasan waktu yang ketat.
* **Audit Selisih Data**: Menginvestigasi sekolah yang mencatatkan selisih porsi mencurigakan antara tanda terima kurir dan catatan guru.

---

## 6. 📋 SEKOLAH BINAAN (`/admin/schools`)

### A. Latar Belakang & Konteks Sistem
Bab 3.2.1 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) mengidentifikasi institusi pendidikan sebagai titik serah terima akhir (*last-mile distribution*). Data master sekolah harus terdata rapi mencakup jenjang usia dan lokasi geografisnya.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Pangkalan Data Master Sekolah (NPSN)**: Menyimpan profil sekolah sasaran (SD/MI, SMP/MTs), nama kepala sekolah, alamat lengkap, dan titik koordinat lintang/bujur (Latitude/Longitude).
2. **Demografi Kebutuhan Gizi**: Menghitung kebutuhan gizi siswa per jenjang:
   * *Siswa SD Kelas Bawah (7–9 tahun)*: Porsi kalori 450–500 kkal.
   * *Siswa SD Kelas Atas (10–12 tahun)*: Porsi kalori 550 kkal.
   * *Siswa SMP (13–15 tahun)*: Porsi kalori 650 kkal dengan protein lebih tinggi.
3. **Pemetaan Radius Dapur Penyuplai**: Memastikan jarak tempuh antara dapur SPPG dan sekolah tidak melebihi radius aman perjalanan logistik (maksimal 30–45 menit perjalanan).

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Pendaftaran Sekolah Baru (Onboarding NPSN)**: Menambahkan sekolah penerima baru ke dalam klaster distribusi program MBG.
* **Pemindahan Alokasi Dapur SPPG**: Memindahkan penyuplai sekolah ke dapur umum lain jika dapur lama bermasalah atau jarak tempuhnya terlalu macet.
* **Pembaruan Data Kontak Darurat**: Memperbarui nomor telepon Kepala Sekolah, Guru Pembina UKS, dan Puskesmas rujukan setempat.
* **Penonaktifan Sementara Sekolah**: Menghentikan sementara alokasi pengiriman saat masa libur semester atau ujian daring.

---

## 7. 🕒 JADWAL DISTRIBUSI (`/admin/schedule`)

### A. Latar Belakang & Konteks Sistem
Waktu adalah musuh utama keamanan pangan siap saji. Makanan yang dimasak subuh rentan basi jika proses pengiriman molor di jalan akibat macet atau kerusakan armada.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Manajemen Jendela Waktu Kirim (*Delivery Window*)**:
   * *Sesi Masak Dapur*: 04:30 – 06:15 WIB.
   * *Pemberangkatan Armada*: 06:30 WIB.
   * *Jendela Kedatangan Wajib*: 06:45 – 07:30 WIB (sebelum bel masuk atau sarapan pagi).
2. **Pelacak Armada Real-Time (GPS & ETA)**: Memantau estimasi waktu tiba armada pendingin di gerbang sekolah.
3. **Peringatan Kemacetan & Keterlambatan**: Memberikan sinyal kuning otomatis jika kendaraan logistik tertahan macet dan diprediksi terlambat > 20 menit dari jadwal kedatangan.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Pengaturan Ulang Jadwal (Rescheduling)**: Mengubah jam tiba sekolah untuk hari tertentu (misal: saat hari Jumat atau ada kegiatan senam pagi bersama).
* **Pemberitahuan Keterlambatan Armada**: Mengirimkan SMS/Push Notification otomatis ke guru validator bahwa kurir terlambat karena kendala jalan raya.
* **Perutean Ulang Armada (Re-routing)**: Menugaskan armada pengganti jika ada kendaraan katering yang mengalami mogok di jalan.

---

## 8. 📢 PAPAN PENGUMUMAN (`/admin/notices`)

### A. Latar Belakang & Konteks Sistem
Sebagai pusat komando nasional, Satgas MBG membutuhkan saluran komunikasi terverifikasi satu arah (*single source of truth*) yang langsung menjangkau aplikasi mobile ribuan guru di sekolah dan operator dapur di seluruh Indonesia tanpa distorsi informasi.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Penerbitan Surat Edaran & Arahan Resmi**: Mengumumkan kebijakan baru dari Badan Gizi Nasional (BGN), Kementerian Pendidikan, atau Kemenkes.
2. **Peringatan Dini Musim & Higienitas (Seasonal Advisory)**: Misalnya peringatan peningkatan standar sanitasi air bersih saat musim pancaroba / banjir lokal.
3. **Pemberitahuan Pembaruan Sistem (System Update)**: Info jadwal pemeliharaan server (*maintenance*) atau rilis model AI YOLOv8 versi baru.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Buat Pengumuman Baru**: Menulis judul, isi pesan, tingkat urgensi (*Info Biasa*, *Penting*, *Panggilan Darurat*), dan lampiran dokumen PDF resmi.
* **Penargetan Siaran (*Target Audience*)**: Memilih siapa penerima pengumuman: *Semua Pihak*, *Hanya Dapur SPPG*, atau *Hanya Guru Validator Sekolah*.
* **Penyiaran Darurat (*Broadcast Flash Alert*)**: Menampilkan notifikasi popup mendesak yang wajib dibaca dan dikonfirmasi (*tap to acknowledge*) sebelum validator bisa menggunakan kamera.
* **Arsipkan / Hapus Pengumuman**: Menghapus maklumat kedaluwarsa dari papan pengumuman publik.

---

## 9. 🗓️ KALENDER MBG (`/admin/calendar`)

### A. Latar Belakang & Konteks Sistem
Menu makanan bergizi gratis harus berganti setiap hari dalam siklus 10 hingga 20 hari kerja untuk mencegah kebosanan siswa dan menjamin keragaman asupan mikronutrien (vitamin, zinc, zat besi, kalsium).

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Kalender Siklus Menu Nasional**: Memetakan paket menu harian yang wajib dimasak oleh seluruh Dapur SPPG pada tanggal tertentu:
   * *Senin*: Paket A (Nasi Ayam Panggang Madu, Capcay Brokoli, Pisang, Susu).
   * *Selasa*: Paket B (Nasi Kuning Cakalang Asap, Sayur Urap Kelapa, Jeruk).
   * *Rabu*: Paket C (Nasi Merah Daging Sapi Teriyaki, Tumis Buncis Tahu, Apel).
2. **Sinkronisasi Kalender Pendidikan**: Menyesuaikan hari libur nasional, libur puasa, hari libur daerah, dan jadwal ujian sekolah.
3. **Jadwal Audit Mendadak (*Inspection Calendar*)**: Mengagendakan kunjungan inspeksi mendadak (*sidak*) tim Satgas MBG ke dapur-dapur umum rekanan.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Penyusunan Jadwal Siklus Menu**: Mengatur dan mengunci daftar menu untuk 1 bulan ke depan.
* **Penggantian Menu Darurat (Menu Substitution Approval)**: Menyetujui pergantian bahan jika komoditas lokal langka (misal: harga ayam melonjak drastis diganti ikan kembung segar dengan nilai protein setara).
* **Penetapan Hari Libur Operasional**: Mengunci sistem pemesanan pada hari libur nasional agar katering tidak memasak.

---

## 10. 📥 UNDUH LAPORAN (`/admin/reports`)

### A. Latar Belakang & Konteks Sistem
Program MBG didanai oleh Anggaran Pendapatan dan Belanja Negara (APBN) berskala triliunan rupiah. Setiap sen anggaran harus dapat dipertanggungjawabkan di hadapan Badan Pemeriksa Keuangan (BPK) dan Badan Pengawasan Keuangan dan Pembangunan (BPKP).

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Generator Berkas Laporan Resmi Otomatis**:
   * *Laporan Harian Distribusi MBG*: Rekapitulasi jumlah porsi yang sukses dikonsumsi siswa di 38 provinsi.
   * *Laporan Kepatuhan Gizi & AKG*: Audit pemenuhan standar kalori dan gramatur bahan makanan Kemenkes.
   * *Laporan Logistik & Insiden*: Data telemetri suhu dan catatan insiden penolakan makanan basi di lapangan.
2. **Penerbitan BAST Digital (Berita Acara Serah Terima)**: Dokumen hukum berstempel waktu dan verifikasi kriptografis digital yang membuktikan porsi makanan benar-benar telah lolos verifikasi AI dan diterima sekolah.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **Ekspor Berkas Multi-Format**: Mengunduh berkas laporan dalam format `.CSV` (untuk analisis data mentah), `.XLSX` (Excel), dan `.PDF` resmi lengkap dengan kop surat Satgas MBG.
* **Otorisasi Pencairan Dana Katering (Payment Clearance)**: Superadmin menandatangani dokumen rekomendasi pencairan termin ke Kementerian Keuangan / Kas Daerah hanya jika BAST digital valid 100%.
* **Audit Forensik Anggaran**: Membandingkan tagihan vendor katering dengan jumlah porsi riil yang lolos pemindaian kamera validator di sekolah.

---

## 11. 💬 ADUAN & FEEDBACK (`/admin/feedback`)

### A. Latar Belakang & Konteks Sistem
Merujuk Bab 4.2 Poin 3 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) mengenai *Fitur Pelaporan Insiden Cepat*, sekolah harus memiliki saluran darurat langsung jika menemukan makanan yang berbau masam, berlendir, kemasan rusak, atau siswa yang mengeluh sakit perut.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Pusat Triage Insiden & Pengaduan**: Menerima laporan temuan anomali makanan dari validator sekolah secara real-time.
2. **Kategorisasi Tingkat Kegawatan**:
   * *Level 1 (Kritis - Bahaya Keracunan)*: Makanan basi, bau menyengat, perubahan rasa, atau siswa mual/diare.
   * *Level 2 (Sedang - Kualitas & Porsi)*: Sayur kurang matang, porsi lauk kurang dari gramatur, kemasan bocor.
   * *Level 3 (Rendah - Saran Rasa & Menu)*: Makanan kurang asin, menu tidak disukai anak, wadah sulit dibuka.
3. **Pelacakan Penanganan Keluhan (SLA Ticket)**: Memantau apakah keluhan sekolah sudah ditindaklanjuti oleh koordinator wilayah dalam waktu maksimal 2 jam.

### C. Aksi Superadmin (Aksinya Ngapain Aja?)
* **EKSEKUSI TOMBOL DARURAT (EMERGENCY BATCH KILL-SWITCH)**: Jika aduan Level 1 masuk dengan bukti foto kuat, Superadmin langsung menekan tombol **"BEKUKAN BATCH PENGIRIMAN"**. Seketika seluruh sekolah lain yang menerima makanan dari batch yang sama dilarang membagikan porsi tersebut.
* **Eskalasi Kasus ke Dinas Kesehatan & Puskesmas**: Mengirimkan notifikasi darurat ke tim medis Puskesmas terdekat sekolah untuk bersiaga di lokasi.
* **Investigasi Dapur SPPG Terlapor**: Menugaskan pengawas lapangan untuk memeriksa kebersihan panci, sterilisasi wadah boks, dan kualitas bahan baku di dapur katering terlapor.
* **Tutup Tiket Aduan**: Menyelesaikan tiket aduan setelah ada Berita Acara hasil uji sampel laboratorium dan kompensasi penggantian porsi aman untuk para siswa.

---

## 12. 🚪 KELUAR KE WEB (BOTTOM LOGOUT)
* **Fungsi**: Mengakhiri sesi enkripsi Superadmin (*clear session token & cookie*) dan mengembalikan navigasi secara aman ke halaman portal publik (`/`).

---

## 13. 📊 FRAMEWORK ANALITIK EKSEKUTIF 5W1H (DASHBOARD CHARTS)

Untuk memberikan analisis tingkat tinggi bagi pengambil kebijakan (Kemenkes, BGN, dan Satgas MBG), halaman Dashboard dilengkapi dengan **6 Grafik Analitik Terpadu Berbasis Framework 5W1H**:

| Elemen 5W1H | Judul & Visualisasi Grafik | Pertanyaan Kunci Pengawasan | Sumber Data & Formula |
|:---:|:---|:---|:---|
| **WHAT** | **Komposisi Makronutrien Deterministik** *(Grouped Bar Chart)* | *Apa kandungan porsi yang dibagikan? Apakah kalorinya sesuai standar Kemenkes?* | Tabel Komposisi Pangan Indonesia (TKPI): Energi (545/550 kkal), Protein (34/30g), Karbohidrat (68/70g), Lemak (14/15g), Serat (7.1/6g). |
| **WHO** | **Demografi Penerima Manfaat** *(Segmented Progress & Badge)* | *Siapa saja 542.850 siswa yang menerima asupan MBG hari ini?* | Dapodik Kemendikbud: SD Kelas Bawah (38%), SD Kelas Atas (42%), SMP/MTs (20%), serta pemantauan siswa dengan riwayat alergi khusus (1.6%). |
| **WHERE** | **Sebaran Volume Lintas Sentra** *(Horizontal Comparative Bar)* | *Di mana saja sebaran porsi dan utilisasi kapasitas Dapur SPPG?* | Matriks Geospasial: DKI (168k porsi, 42 SPPG), Jabar (134k porsi, 32 SPPG), Jateng-DIY (112k porsi), Jatim (98k porsi), Luar Jawa (78k porsi). |
| **WHEN** | **Kurva Aliran Waktu & HACCP** *(Hourly Timeline Flow Curve)* | *Kapan makanan dimasak, dikirim, dan kapan batas kadaluarsa 4 jam berakhir?* | Sensor IoT & Stempel Masak: 04:30 Olah SPPG &rarr; 06:45 Armada Berangkat &rarr; 07:15 Tiba di Sekolah &rarr; **10:15 Batas Kritis 4 Jam Konsumsi**. |
| **WHY** | **Analisis Akar Masalah / Pareto** *(Root-Cause Anomaly Bar)* | *Mengapa terjadi deviasi 0.6% di lapangan dan bagaimana mitigasinya?* | Log Insiden Lapangan: Suhu armada naik >25°C (42%), Keterlambatan macet (28%), Kemasan bocor (16%), AI deteksi tekstur (10%), Alergen (4%). |
| **HOW** | **Indeks Kepatuhan SLA SPPG** *(Multi-Metric Scorecard)* | *Bagaimana efisiensi dan mutu operasional vendor katering dinilai?* | Evaluasi Kontrak Vendor: Ketepatan waktu (99.4%), Rantai dingin (99.2%), AI Pass rate (99.8%), Kepuasan sekolah (98.6%) &rarr; **Overall 99.3% (Grade A)**. |

### Prinsip Clean Code & Kesiapan Masa Depan (*Future-Proofing*)
Komponen visual ini diisolasi secara modular di file [frontend/src/components/dashboard/Charts5W1H.jsx](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/frontend/src/components/dashboard/Charts5W1H.jsx):
1. **Decoupled State**: Menggunakan objek `DATA_5W1H` yang siap langsung dihubungkan ke endpoint API Backend Golang (`/api/v1/admin/analytics/5w1h`).
2. **Zero-Dependency SVG Graphics**: Menggunakan render murni React + Tailwind CSS tanpa pustaka chart eksternal usang, menjamin kecepatan rendering instan, bebas konflik dependensi React 19, dan responsif di seluruh resolusi layar.
3. **Interactive Filtering**: Dilengkapi tab filter dinamis (*Semua 5W1H*, *WHAT*, *WHO*, *WHERE*, *WHEN*, *WHY*, *HOW*) untuk memfokuskan pandangan eksekutif.

---

## KESIMPULAN ARSITEKTUR SIDEBAR
Ke-11 menu pada sidebar ini mencerminkan rantai pengawasan tertutup (*closed-loop governance*):
1. **Perencanaan**: *Sekolah Binaan*, *Dapur SPPG*, *Kalender MBG*, dan *Jadwal Distribusi*.
2. **Eksekusi Lapangan**: *Profil Validator*, *Penerimaan Siswa*, dan *Papan Pengumuman*.
3. **Pengawasan Cerdas**: *Dashboard (dilengkapi Analitik 5W1H)*, *Hasil Pengiriman (YOLOv8 & IoT)*, dan *Aduan & Feedback*.
4. **Akuntabilitas Negara**: *Unduh Laporan* dan *Verifikasi BAST Pencairan Dana*.

Dengan alur terintegrasi ini, sistem KawanGizi secara proaktif memotong rantai risiko keracunan pangan sebelum makanan masuk ke mulut siswa.
