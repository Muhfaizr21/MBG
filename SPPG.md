# KAWANGIZI — PANDUAN LENGKAP & AUDIT FITUR PERSIDEBAR SPPG (DAPUR UMUM)
**Sistem Skrining Kelayakan Konsumsi & Pemindai Makronutrien Berbasis Computer Vision (YOLOv8)**  
*Dokumen Cetak Biru Fungsionalitas & Alur Operasional Dapur Sentral / Katering Rekanan MBG RI*

---

## PENDAHULUAN & PERAN SPPG DALAM EKOSISTEM MBG
Merujuk pada Bab 3.2.1 dan Bab 4.2 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md), **Satuan Pelayanan Pangan Bergizi (SPPG)** atau Dapur Umum Rekanan adalah produsen hulu yang memegang tanggung jawab kritis terhadap keamanan biologis, kimia, dan fisik makanan sebelum masuk ke rantai logistik. 

Dapur SPPG bertanggung jawab memasak ribuan porsi makanan bergizi setiap dini hari, menjaga standar takaran gizi sesuai Tabel Komposisi Pangan Indonesia (TKPI) Kemenkes, mematuhi batas waktu aman konsumsi 4 jam (*HACCP Timer*), membubuhi segel QR Code unik pada setiap boks, serta mendistribusikan armada logistik berpendingin (*cold-chain*) tepat waktu ke gerbang sekolah sebelum bel sarapan berbunyi.

---

## DAFTAR ISI MENU SIDEBAR PORTAL SPPG

| No | Ikon & Menu Sidebar | Endpoint Rute | Fokus Operasional Dapur SPPG |
|:--:|:--------------------|:--------------|:-----------------------------|
| 1 | 🏠 **Dashboard Dapur** | `/sppg/dashboard` | Pusat Kendali Produksi Harian (Status Sesi Masak, Timer 4 Jam, Target Porsi, & Live Armada) |
| 2 | 🍲 **Rencana Menu & Resep** | `/sppg/recipes` | Takaran Gramatur Baku TKPI Kemenkes RI, Rincian Kalori/Makronutrien, & Sertifikasi Bahan Baku |
| 3 | 📦 **Manajemen Batch & Cetak QR** | `/sppg/batches` | Generator Batch QR Code Berstempel Waktu, Label Kontainer Termal, & Nomor Seri Boks |
| 4 | 🌡️ **Kontrol Mutu & HACCP** | `/sppg/quality` | Pencatatan Suhu Masak Inti (>75°C), Suhu Pengemasan (>60°C), Uji Organoleptik, & Sampel Lab |
| 5 | 🚚 **Armada & Logistik Rute** | `/sppg/logistics` | Jadwal Keberangkatan, Manifest Kendaraan, Pelacak GPS Real-Time, & Telemetri Suhu IoT Boks |
| 6 | 🏫 **Sekolah Binaan & Kuota** | `/sppg/schools` | Daftar Sekolah Tanggung Jawab Suplai, Alokasi Porsi SD/SMP, Titik Drop-Point, & Kontak Guru |
| 7 | 📋 **Serah Terima & BAST** | `/sppg/handover` | Monitoring Hasil Pindai Validator Sekolah, Konfirmasi Porsi Diterima, & Terbitan BAST Digital |
| 8 | ⚠️ **Insiden & Respon Aduan** | `/sppg/incidents` | Mitigasi Cepat Laporan Makanan Rusak/Masam, Penarikan Batch Darurat, & Klarifikasi SLA Tiket |
| 9 | 💵 **Klaim & Penagihan (Invoice)** | `/sppg/billing` | Rekonsiliasi Porsi Sah BAST, Potongan Denda Porsi Basi, & Pengajuan Pencairan Dana SP2D |
| 10 | 📄 **Sertifikasi & Sanitasi Dapur** | `/sppg/compliance` | SLHS Dinkes, Sertifikat Halal BPJPH, Hasil Uji Lab Air/Bahan Baku, & Profil Tenaga Penjamah Pangan |

---

## 1. 🏠 DASHBOARD DAPUR (`/sppg/dashboard`)

### A. Latar Belakang & Konteks Sistem
Sebagai penanggung jawab operasional di lapangan, Manajer Dapur dan Ahli Gizi SPPG membutuhkan menara pengawas (*monitoring cockpit*) yang memperlihatkan progres lini masak secara real-time sejak pukul 03.30 WIB hingga serah terima di sekolah selesai pada pukul 08.00 WIB.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Status Alur Kerja Produksi (*Live Production Pipeline*)**:
   * *Tahap 1: Persiapan Bahan Baku* (03:30 – 04:30 WIB) — Selesai.
   * *Tahap 2: Pengolahan & Memasak* (04:30 – 06:00 WIB) — Berlangsung.
   * *Tahap 3: Pengemasan & Segel QR* (06:00 – 06:45 WIB) — Siap.
   * *Tahap 4: Pengiriman Armada Logistik* (06:45 – 07:30 WIB) — Menunggu keberangkatan.
2. **Hitung Mundur Batas Waktu Aman 4 Jam (*HACCP 4-Hour Critical Timer*)**:
   * Menghitung mundur batas kadaluwarsa mikrobiologis makanan siap saji sejak kompor dimatikan (misal: Selesai masak 06.00 WIB → Wajib habis dikonsumsi sebelum 10.00 WIB).
   * Memberikan sinyal visual *Amber xWarning* jika sisa waktu < 60 menit dan *Red Lockout* jika melewati batas 4 jam.
3. **Papan Metrik Porsi Harian**:
   * Total Target Produksi: Misal 2.500 Porsi.
   * Porsi Berhasil Dimasak & Dikemas: 2.500 Porsi (100%).
   * Porsi Telah Terverifikasi Guru di Sekolah: 1.850 Porsi (74%).
   * Porsi Ditolak / Anomali: 0 Porsi (0%).
4. **Widget Cepat Status Armada Pengantar**:
   * Menampilkan ringkasan armada logistik milik dapur: 4 Armada Beroperasi, 1 Cadangan Siaga, rata-rata suhu termal boks 63.4°C (Stabil).

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Ganti Status Sesi Masak**: Mengklik tombol transisi tahapan (misal: "Selesaikan Tahap Memasak → Buka Sesi Pengemasan").
* **Pemicu Peringatan Darurat Dapur**: Mengaktifkan sinyal peringatan jika ada kompor rusak, pasokan gas terganggu, atau keterlambatan masak > 15 menit agar sekolah dan Satgas mendapat notifikasi awal.
* **Cetak Lembar Kontrol Dapur (Kitchen Run-Sheet)**: Mengunduh ringkasan instruksi menu dan alokasi boks per sekolah untuk ditempel di papan fisik dapur.

---

## 2. 🍲 RENCANA MENU & RESEP (`/sppg/recipes`)

### A. Latar Belakang & Konteks Sistem
Merujuk Bab 4.2 Poin 8 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md), SPPG wajib memasak sesuai siklus menu nasional yang telah ditetapkan oleh Satgas MBG dan Kemenkes RI. Setiap resep memiliki takaran gramatur baku dan tidak boleh dikurangi porsinya oleh pihak dapur demi menjaga kecukupan gizi anak.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Buku Resep Standar TKPI Kemenkes**:
   * Rincian gramatur bahan mentah per porsi:
     * *Nasi Putih / Beras Organik*: 150 gram (Karbohidrat).
     * *Daging Ayam Fillet / Ikan Laut*: 80 gram (Protein Hewani ber-NKV).
     * *Tahu / Tempe Segar*: 50 gram (Protein Nabati).
     * *Sayur Brokoli / Wortel*: 75 gram (Serat & Vitamin).
     * *Buah Pisang Cavendish / Jeruk*: 1 buah (100 gram).
     * *Susu Pasteurisasi UHT*: 1 kotak (125 ml).
2. **Kalkulator Makronutrien Deterministik**:
   * Menghitung total kalori otomatis (misal: 545 kkal, Protein: 34g, Karbo: 68g, Lemak: 14g, Serat: 6.2g).
   * Validasi kesesuaian target AKG kelompok umur: Porsi SD Bawah (450–500 kkal), SD Atas (550 kkal), SMP (650 kkal).
3. **Manajemen Bahan Pengganti (Substitusi Komoditas)**:
   * Form pengajuan substitusi resmi jika terjadi kelangkaan bahan lokal di pasar (misal: Ikan Cakalang diganti Ikan Kembung segar dengan kandungan protein setara) yang langsung terhubung ke persetujuan Satgas MBG.
4. **Log Nomor Batch Bahan Baku**:
   * Mencatat nomor batch daging ayam, nomor registrasi NKV rumah potong hewan, dan tanggal kedaluwarsa susu untuk kemudahan penelusuran jika terjadi insiden (*traceability*).

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Pilih & Kunci Menu Hari Ini**: Membuka resep dari Kalender Siklus MBG dan mengonfirmasi kesiapan bahan baku.
* **Kalkulasi Kebutuhan Belanja Bahan**: Mengalikan gramatur per porsi dengan jumlah total siswa binaan (misal: 2.500 porsi x 80g ayam = 200 kg ayam potong).
* **Ajukan Dispensasi Substitusi Bahan**: Mengisi form alasan kelangkaan, melampirkan foto bahan alternatif dan nilai gizi pengganti untuk di-approve Satgas MBG.

---

## 3. 📦 MANAJEMEN BATCH & CETAK QR (`/sppg/batches`)

### A. Latar Belakang & Konteks Sistem
Bab 4.2 Poin 1 & 4 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) merumuskan bahwa setiap boks makanan wajib memiliki identitas digital berupa **QR Code unik berstempel kriptografis**. Kode QR inilah yang nantinya dipindai oleh kamera ponsel guru validator di sekolah untuk memvalidasi porsi, asal dapur, menu, dan batas waktu kelayakan.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Generator Batch QR Code Otomatis**:
   * Menghasilkan token digital terenkripsi per batch masak:
     * Format: `MBG-[TAHUN]-[KODE_DAPUR]-[KODE_SEKOLAH]-[NOMOR_BATCH]` (contoh: `MBG-2026-SPPG01-SDN01P-B01`).
   * Menyematkan metadata tak terhapuskan: Nama Menu, Jam Selesai Masak, Batas Jam Aman Konsumsi, Suhu Masak, dan Indikasi Alergen.
2. **Cetak Label Termal Siap Tempel**:
   * Tata letak cetak stiker standar industri (*thermal barcode printer 80mm*):
     * Logo BGN & KawanGizi.
     * Kode QR resolusi tinggi.
     * Nama Sekolah Tujuan & Nama Paket Menu.
     * Waktu Selesai Masak & Batas Konsumsi (tebal & kontras).
3. **Pengelompokan Wadah Kontainer Besar (*Master Container Totes*)**:
   * Mengelompokkan 50 porsi boks kecil ke dalam 1 boks kontainer termal besar dengan 1 Master QR untuk kepraktisan serah terima logistik.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Generate QR Batch Baru**: Memasukkan jumlah boks yang telah lolos uji masak, memilih sekolah sasaran, dan menekan tombol *Generate*.
* **Cetak Stiker Label Massal**: Mengirim antrean cetak langsung ke printer Bluetooth/WiFi dapur.
* **Scan Uji Mandiri (*Self-Check QC*)**: Menggunakan kamera web/scanner dapur untuk memastikan QR terbaca 100% sebelum boks dimasukkan ke armada.

---

## 4. 🌡️ KONTROL MUTU & HACCP (`/sppg/quality`)

### A. Latar Belakang & Konteks Sistem
Sesuai prinsip *Hazard Analysis and Critical Control Points* (HACCP), bahaya keracunan makanan dapat dicegah secara sistemik jika temperatur kritis pada tahap memasak (*Critical Control Point 1*) dan tahap pengemasan (*CCP 2*) tercatat secara ketat dan tidak dimanipulasi.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Log Pencatatan Suhu Titik Kritis**:
   * *Suhu Masak Inti Hidangan (Cooking Core Temp)*: Wajib minimal **≥ 75°C** selama 2 menit untuk sterilisasi mikroba.
   * *Suhu Wadah Penyajian / Holding*: Wajib dijaga minimal **≥ 60°C** sebelum dimasukkan ke dalam boks termal tertutup.
   * *Suhu Komponen Dingin (Buah & Susu)*: Wajib berada pada rentang **4°C – 8°C**.
2. **Checklist Uji Sensori / Organoleptik Ahli Gizi**:
   * Lembar penilaian kepatuhan sebelum boks disegel:
     * *Rasa*: Tidak asam, tidak ada rasa tengik/pahit aneh.
     * *Aroma*: Aroma khas bumbu segar, tidak ada bau kecut/basi.
     * *Tekstur*: Sayur renyah tidak berlendir, daging matang sempurna hingga ke tulang.
     * *Visual*: Tidak ada benda asing (rambut, serangga, stapler, plastik).
3. **Penyimpanan Sampel Arsip Pangan (*Retained Lab Samples*)**:
   * SPPG diwajibkan menyisihkan 1 porsi sampel steril dari setiap batch dan menyimpannya di kulkas khusus bersuhu 4°C selama 2x24 jam untuk keperluan uji lab darurat jika di kemudian hari sekolah melaporkan keluhan siswa sakit.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Input Suhu Termometer Digital**: Memasukkan angka derajat Celcius hasil pengukuran termometer tusuk (*probe thermometer*) dengan foto bukti digital.
* **Tandatangani Lembar Rilis Mutu (*Quality Release Sign-off*)**: Ahli Gizi SPPG menandatangani digital bahwa batch hidangan telah memenuhi standar mutu dan layak konsumsi.
* **Catat Log Sampel Arsip**: Menginput nomor rak penyimpanan sampel arsip makanan di kulkas laboratorium dapur.

---

## 5. 🚚 ARMADA & LOGISTIK RUTE (`/sppg/logistics`)

### A. Latar Belakang & Konteks Sistem
Bab 3.2.1 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) menekankan bahwa waktu tempuh pengantaran makanan dari dapur ke sekolah binaan **tidak boleh melebihi radius 45 menit**. Kemacetan jalan raya atau kerusakan armada berisiko menurunkan suhu makanan ke zona bahaya (*temperature danger zone 5°C - 60°C*).

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Manajemen Armada & Penugasan Pengemudi**:
   * Data kendaraan dapur: Nomor Polisi, Jenis Kendaraan (Mobil Boks Berinsulasi Termal / Sepeda Motor Roda Tiga), Nama Sopir, dan Nomor HP Darurat.
2. **Telemetri Suhu IoT Boks Armada Real-Time**:
   * Menampilkan grafik suhu yang dipancarkan sensor IoT di dalam boks mobil selama perjalanan (memastikan suhu boks tetap hangat > 60°C).
3. **Peta Pelacak GPS & Estimasi Tiba (ETA)**:
   * Melacak posisi kendaraan di jalan raya, rute yang ditempuh, kecepatan laju, dan perkiraan waktu tiba di gerbang sekolah sebelum jam 07:15 WIB.
4. **Pemberitahuan Peringatan Hambatan Logistik**:
   * Sinyal otomatis jika kendaraan terdeteksi berhenti lama akibat mogok atau macet total, dengan rekomendasi dispatch armada cadangan terdekat.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Terbitkan Surat Jalan Armada**: Mengaitkan batch boks makanan dengan armada tertentu dan mencetak surat jalan jalan resmi.
* **Ganti Rute / Dispatch Cadangan**: Mengalihkan muatan ke kendaraan cadangan jika terjadi kendala teknis di jalan raya.
* **Kirim Notifikasi Estimasi Kedatangan**: Menekan tombol siar SMS/WhatsApp otomatis ke guru validator sekolah: *"Armada B-9281-KBA sedang menuju sekolah Anda, ETA tiba: 07:10 WIB"*.

---

## 6. 🏫 SEKOLAH BINAAN & KUOTA (`/sppg/schools`)

### A. Latar Belakang & Konteks Sistem
Dapur SPPG memiliki wilayah tanggung jawab binaan tetap yang telah diklasterkan oleh BGN. Dapur harus mengetahui demografi kebutuhan porsi tiap sekolah dan titik koordinat drop-point agar distribusi tertib tanpa tertukar.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Daftar Sekolah Rekanan Tanggung Jawab Suplai**:
   * Profil sekolah: Nama Sekolah, NPSN, Alamat Lengkap, Jenjang (SD Kelas Bawah, SD Kelas Atas, SMP), dan Titik Koordinat GPS.
2. **Rekapitulasi Kebutuhan Kuota Porsi**:
   * Jumlah siswa terdaftar vs data kehadiran siswa yang telah dimutakhirkan sekolah sebelum pukul 05:00 WIB.
   * Rincian porsi khusus (misal: siswa dengan alergi kacang atau siswa diet tertentu).
3. **Direktori Kontak Guru Validator**:
   * Nama Kepala Sekolah, Nama Guru Validator Utama, dan Nomor WhatsApp PIC Piket Distribusi.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Lihat Pembaruan Presensi Pagi**: Mengecek apakah ada pengurangan kuota dari sekolah (misal: ada kelas yang sedang study tour sehingga porsi dikurangi agar tidak terbuang sia-sia).
* **Unduh Panduan Rute Lokasi Drop-Point**: Melihat titik gerbang belakang atau ruang serah terima makanan yang telah disepakati dengan pihak sekolah.
* **Panggil PIC Validator**: Tombol hubungi langsung via WhatsApp atau telepon ke guru piket sekolah jika kurir tiba di gerbang namun belum ada yang menyambut.

---

## 7. 📋 SERAH TERIMA & BAST DIGITAL (`/sppg/handover`)

### A. Latar Belakang & Konteks Sistem
Titik temu akuntabilitas antara Dapur SPPG dan Sekolah terjadi saat serah terima boks makanan. Guru memindai QR boks dengan kamera ponsel, dan hasil verifikasi tersebut langsung disinkronkan ke layar portal SPPG.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Pemantau Hasil Verifikasi Guru Secara Langsung**:
   * Kolom status per sekolah:
     * *Menunggu Pindai*: Boks makanan telah tiba di sekolah namun belum dibuka guru.
     * *Proses Pemindaian*: Guru sedang memindai boks makanan dengan kamera AI YOLOv8.
     * *Lolos Sempurna (100% Valid)*: Seluruh boks diterima, suhu dinyatakan aman, visual segar.
     * *Ditolak Parsial / HOLD*: Jika ditemukan anomali porsi (misal 5 boks kemasan rusak).
2. **Penerbitan Berita Acara Serah Terima (BAST) Digital**:
   * Lembar hukum BAST otomatis dengan nomor registrasi unik, stempel waktu kriptografis, dan tanda tangan digital guru penerima serta kurir penyerah.
3. **Penyelarasan Porsi Diterima Riil**:
   * Mencatat secara sah jumlah porsi yang berhasil lolos untuk menjadi dasar perhitungan pembayaran termin tanpa ada selisih fiktif.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Konfirmasi Penyerahan Porsi**: Kurir dapur menandatangani digital serah terima setelah boks dihitung bersama guru.
* **Unduh Salinan BAST Digital (PDF)**: Mengunduh berkas BAST bertanda tangan sah untuk arsip administrasi dapur.
* **Respon Cepat Penolakan Porsi**: Jika ada boks ditolak, dapur langsung menerima rincian foto bukti penolakan guru dan dapat segera mengirimkan porsi pengganti dari stok cadangan aman.

---

## 8. ⚠️ INSIDEN & RESPON ADUAN (`/sppg/incidents`)

### A. Latar Belakang & Konteks Sistem
Merujuk Bab 4.2 Poin 3 [sistem.md](file:///Users/muhfaiizr/Documents/Web%20Project/MBG/sistem.md) mengenai *Fitur Pelaporan Insiden Cepat*, Dapur SPPG harus memiliki sistem tanggap darurat (*Emergency Incident Response*) untuk merespons komplain sekolah dalam hitungan menit agar potensi keracunan massal dapat dicegah seketika.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Pusat Masuk Tiket Aduan Sekolah**:
   * Menampilkan keluhan dari guru validator berdasarkan derajat keparahan:
     * *Kritis (Level 1)*: Indikasi makanan basi, bau masam menyengat, atau siswa mual.
     * *Sedang (Level 2)*: Sayur kurang matang, porsi lauk kurang dari gramatur, kemasan bocor.
     * *Rendah (Level 3)*: Masukan cita rasa (kurang garam, menu kurang disukai anak).
2. **Status Penerapan SLA Perbaikan (Maksimal 60 Menit)**:
   * Timer batas waktu respons dapur untuk memberikan klarifikasi dan tindakan mitigasi.
3. **Mekanisme Karantina & Penarikan Batch Darurat (Batch Recall)**:
   * Tombol isolasi seketika jika dapur mendeteksi adanya kesalahan bumbu atau pasokan tercemar pada batch tertentu, sehingga seluruh sekolah yang menerima batch tersebut otomatis terkunci dan tidak membagikannya.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Beri Tanggapan & Klarifikasi Tiket**: Mengunggah hasil pengecekan sampel arsip dapur dan catatan penanganan masalah.
* **Kirim Porsi Pengganti Darurat**: Mengalokasikan pengiriman kilat porsi cadangan jika makanan di satu sekolah ditarik.
* **Tutup Tiket Kasus Bersama Satgas**: Melaporkan bukti penyelesaian insiden agar reputasi dan skor akreditasi dapur tidak dibekukan.

---

## 9. 💵 KLAIM & PENAGIHAN INVOICE (`/sppg/billing`)

### A. Latar Belakang & Konteks Sistem
Dapur SPPG beroperasi dengan modal kerja besar untuk belanja bahan pangan setiap hari. Penagihan termin ke kas negara (APBN/APBD melalui BGN) didasarkan pada Berita Acara Serah Terima (BAST) digital yang telah tervalidasi 100% oleh AI dan guru sekolah.

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Rekonsiliasi Porsi Sah vs Tagihan**:
   * Menghitung nilai rupiah otomatis: `Jumlah Porsi Sah Lolos AI x Tarif Porsi MBG Resmi (misal: Rp 15.000 / porsi)`.
2. **Kalkulasi Potongan Denda / Penalti**:
   * Jika ada porsi basi atau keterlambatan pengiriman > 30 menit yang menyebabkan porsi tidak termakan, sistem secara transparan menghitung pemotongan nilai tagihan sesuai klausul kontrak BGN.
3. **Pelacak Status Pencairan Dana (SP2D Tracking)**:
   * Melacak perjalanan berkas penagihan:
     * *Draft Diajukan Dapur* → *Verifikasi BAST Satgas MBG* → *Penerbitan SPM (Surat Perintah Membayar)* → *Pencairan SP2D oleh KPPN/Bank Penyalur*.

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Buat Pengajuan Tagihan Termin (Invoice Generator)**: Mengelompokkan BAST harian/mingguan menjadi satu berkas penagihan resmi.
* **Lampirkan Rekapitulasi Pembelian Bahan Baku**: Mengunggah bukti nota belanja bahan pangan lokal dari petani/peternak sebagai syarat transparansi dana MBG.
* **Unduh Bukti Potong Pajak & Salinan SP2D**: Mengunduh berkas tanda transfer resmi dari kas negara.

---

## 10. 📄 SERTIFIKASI & SANITASI DAPUR (`/sppg/compliance`)

### A. Latar Belakang & Konteks Sistem
Dapur SPPG hanya diizinkan beroperasi jika memenuhi kualifikasi ketat standar higienitas pangan dari Kementerian Kesehatan, Dinas Kesehatan, dan Badan Penyelenggara Jaminan Produk Halal (BPJPH).

### B. Fungsi Utama (Apa Fungsinya Nanti?)
1. **Pangkalan Data Dokumen Legalitas & Akreditasi**:
   * Sertifikat Laik Higiene Sanitasi (SLHS) dari Dinkes setempat (dengan tanggal kedaluwarsa).
   * Sertifikat Halal Resmi (ID Halal BPJPH Kemenag).
   * Sertifikat Nomor Kontrol Veteriner (NKV) untuk pasokan daging unggas/sapi.
2. **Daftar Sertifikasi Penjamah Makanan (*Food Handlers Certification*)**:
   * Data seluruh koki, asisten dapur, dan petugas kemas: Surat Keterangan Sehat (bebas TBC, Tifoid, Hepatitis A) dan sertifikat pelatihan penjamah makanan.
3. **Riwayat Uji Laboratorium Rutin**:
   * Hasil uji usap alat masak (*swab test* mikrobiologi angka kuman dan E. coli).
   * Hasil uji kualitas air bersih dapur (parameter fisika, kimia, dan bakteriologis).

### C. Aksi Pengguna SPPG (Aksinya Ngapain Aja?)
* **Unggah Perpanjangan Dokumen Izin**: Mengunggah berkas PDF sertifikat baru sebelum masa berlaku habis.
* **Perbarui Data Personel Juru Masak**: Mendaftarkan staf dapur baru dan mengunggah hasil tes kesehatan berkala.
* **Permohonan Jadwal Audit Ulang**: Mengajukan permintaan inspeksi berkala ke Dinas Kesehatan setempat melalui sistem KawanGizi.

---

## RINGKASAN KEUNGGULAN ARSITEKTUR PORTAL SPPG

1. **Anti-Manipulasi (*Cryptographic QR Batch*)**: Porsi yang dikirim terlindungi kode digital, mencegah oknum katering menukar porsi dengan makanan sisa kemarin.
2. **Pencegahan Proaktif (*HACCP 4-Hour Timer*)**: Dapur diingatkan secara visual jika makanan mendekati batas waktu basi, mencegah makanan rusak tiba di sekolah.
3. **Transparansi Keuangan (*Evidence-Based Billing*)**: Penagihan dana APBN didasarkan pada bukti nyata boks yang berhasil dipindai dan dimakan siswa, bukan klaim sepihak katering.
4. **Terintegrasi Penuh ke Superadmin**: Seluruh data suhu, armada, dan penolakan porsi dari dapur SPPG langsung tersinkronisasi ke Dashboard Nasional Satgas MBG secara real-time.
