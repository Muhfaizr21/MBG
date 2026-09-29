KAWANGIZI – SISTEM SKRINING KELAYAKAN KONSUMSI
DAN PEMINDAI MAKRONUTRIEN BERBASIS COMPUTER
VISION UNTUK MITIGASI KERACUNAN PADA
PROGRAM MAKAN BERGIZI GRATIS
Disusun oleh:
UNSIL KAMI DATANG
Anggota:
Ayip Muhammad (2305059)
Muhammad Faiz Ramadhan (2305072)
Muhammad Ihya ‘Ulumuddin (2305073)
SOFTWARE DEVELOPMENT COMPETITION
ICONFEST
2026
KATA PENGANTAR
Puji dan syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa karena atas
rahmat dan karunia-Nya, penyusunan laporan karya berjudul "KawanGizi – Sistem
Skrining Kelayakan Konsumsi dan Pemindai Makronutrien Berbasis Computer
Vision untuk Mitigasi Keracunan pada Program Makan Bergizi Gratis" ini dapat
diselesaikan dengan baik untuk diikutsertakan dalam ajang ICONFEST 2026 pada
cabang Software Development Competition.
Proposal ini merumuskan perancangan dan implementasi sistem KawanGizi,
sebuah ekosistem perangkat lunak yang memadukan pemrosesan citra digital
Computer Vision dan arsitektur sistem yang tangguh untuk menghadirkan instrumen
validasi proaktif demi menjamin keamanan rantai pasok pangan masyarakat,
khususnya anak usia sekolah.
Kami menyampaikan terima kasih yang sebesar-besarnya kepada seluruh pihak
yang telah memberikan dukungan, arahan, dan masukan konstruktif selama proses
perancangan proyek ini, khususnya:
1. Panitia pelaksana ICONFEST 2026 Himpunan Mahasiswa Informatika (HMIF)
Universitas Siliwangi yang telah memfasilitasi ruang kompetisi inovasi
teknologi bagi mahasiswa.
2. Dosen pembimbing atas bimbingan serta validasi teknis yang diberikan.
3. Rekan-rekan tim yang telah bekerja sama secara solid dalam merancang
arsitektur sistem perangkat lunak ini.
Kami menyadari bahwa proposal ini masih memiliki ruang untuk pengembangan
lebih lanjut. Oleh karena itu, kritik dan saran yang membangun sangat kami harapkan
guna menyempurnakan implementasi sistem KawanGizi agar dapat memberikan
dampak nyata bagi kesehatan anak-anak dan keamanan pangan nasional.
Indramayu, September 2026
Tim Pengusul
DAFTAR ISI
*Buat daftar isi sesuai dengan heading yang sudah dibuat. Format sub-heading dibebaskan
kepada peserta, dan dibebaskan untuk menambahkan bagian-bagian seperti sub-heading baru
dan lampiran lainnya apabila diperlukan. (gunakan penomoran halaman pada setiap
halaman).
ABSTRAK
Program Makan Bergizi Gratis (MBG) menghadapi krisis keamanan pangan
berupa tingginya angka keracunan siswa akibat ketiadaan mekanisme validasi tahap
akhir yang objektif sebelum makanan didistribusikan. Selama ini, pengecekan
kelayakan makanan hanya mengandalkan observasi visual manual yang sangat
subjektif dan rawan akan kesalahan manusia. Penelitian ini bertujuan untuk
mengembangkan KawanGizi, yakni sebuah ekosistem perangkat lunak berbasis
kecerdasan buatan sebagai instrumen mitigasi proaktif untuk menskrining kelayakan
fisik makanan dan mengestimasi kandungan makronutrien secara instan.
Pengembangan sistem ini mengadopsi rancangan decoupled architecture yang
membagi beban komputasi secara efisien. Sisi antarmuka dibangun menggunakan
React Native untuk aplikasi seluler dan Next.js untuk dasbor web, lalu lintas data
dikelola oleh API Gateway berbasis Golang, sementara pemrosesan citra digital
diisolasi pada backend Python menggunakan algoritma YOLOv8. Hasil penelitian
menunjukkan bahwa purwarupa Minimum Viable Product (MVP) KawanGizi berhasil
mengintegrasikan proses pemindaian visual di lokasi sekolah hingga sinkronisasi data
secara seketika ke pusat komando Satgas MBG. Algoritma YOLOv8 sukses
mengidentifikasi indikasi pembusukan serta estimasi gizi dengan latensi yang sangat
rendah, dan arsitektur sistem terbukti mampu mengorkestrasi transmisi data secara
lancar tanpa hambatan kinerja. Inovasi ini membuktikan kelayakan KawanGizi sebagai
solusi perlindungan proaktif dalam menjamin keamanan rantai pasok pangan berskala
nasional.
Kata Kunci: Keamanan Pangan, Makan Bergizi Gratis, Computer Vision, YOLOv8,
Decoupled Architecture.
BAB I
PENDAHULUAN
1.1 Latar Belakang
Program Makan Bergizi Gratis (MBG) merupakan inisiatif strategis berskala
nasional yang dirancang untuk mengatasi masalah gizi dan meningkatkan kualitas
kesehatan anak usia sekolah. Meskipun memiliki urgensi yang vital, implementasi
distribusi makanan ini di lapangan menghadapi krisis keamanan pangan yang
mengkhawatirkan. Pelaksanaan program ini masih jauh dari kata ideal karena
lemahnya pengawasan standar gizi yang berujung pada tingginya angka keracunan
siswa (Kusuma & Pratama, 2026). Temuan akademis ini sejalan dengan rentetan kasus
aktual di lapangan. Tercatat 276 warga dan siswa di Kabupaten Batang diduga
mengalami keracunan usai menyantap porsi MBG yang memicu mual, muntah, hingga
diare (Tribun Jateng, 2026). Pada bulan yang sama, insiden serupa juga menimpa
puluhan siswa di SDN 1 Sumberagung, Kabupaten Bantul pasca mengonsumsi menu
MBG (Kompas, 2026).
Tingginya frekuensi insiden keracunan ini mengekspos celah kritis dalam rantai
distribusi MBG, yakni ketiadaan proses validasi gizi dan kelayakan fisik makanan di
tahap akhir sebelum dibagikan kepada siswa. Selama ini, pengecekan hanya
mengandalkan observasi visual secara manual yang sangat subjektif, tidak terukur, dan
rawan kesalahan manusia. Masalah ini tidak hanya menuntut penanganan dari segi
regulasi, tetapi juga intervensi inovasi teknologi yang mampu memberikan solusi nyata
dan berdampak sosial secara langsung bagi kesehatan masyarakat.
Sebagai solusi mitigasi proaktif, diusulkanlah "KawanGizi", yakni sebuah
ekosistem perangkat lunak untuk skrining kelayakan konsumsi dan estimasi
makronutrien berbasis kecerdasan buatan. Intervensi Computer Vision dalam inspeksi
makanan telah terbukti secara saintifik sangat efisien dan andal dalam mendeteksi
anomali objek untuk keperluan keamanan pangan (Rahman et al., 2026). Oleh karena
itu, mesin pemindai visual KawanGizi mengadopsi algoritma YOLOv8 dan
menyingkirkan R-CNN konvensional. Pendekatan ini dipilih karena kemampuannya
memberikan keseimbangan terbaik antara kecepatan inferensi real-time di mobile dan
akurasi tinggi dalam mengenali ciri fisik makanan yang mulai tidak layak konsumsi.
Perpaduan arsitektur ini menjadikan KawanGizi sebagai instrumen perlindungan lapis
pertama yang canggih untuk mencegah risiko keracunan massal pada siswa.
1.2 Rumusan Masalah
Berdasarkan pemaparan pada latar belakang, rumusan masalah dalam
pengembangan proyek ini adalah sebagai berikut:
1. Bagaimana merancang sistem skrining kelayakan konsumsi dan pemindai
makronutrien secara real-time untuk mencegah kasus keracunan pada program
Makan Bergizi Gratis (MBG)?
2. Bagaimana mengimplementasikan model Computer Vision berbasis algoritma
YOLOv8 pada perangkat mobile untuk mendapatkan keseimbangan terbaik
antara kecepatan inferensi dan akurasi tinggi dalam mendeteksi anomali fisik
makanan?
3. Bagaimana membangun ekosistem perangkat lunak yang andal dan scalable
menggunakan pendekatan decoupled architecture agar mampu memproses
ribuan data pemindaian dan pelaporan dari validator lapangan secara serentak?
1.3 Tujuan Project
Berdasarkan rumusan masalah tersebut, tujuan dari penelitian ini adalah:
1. Mengembangkan KawanGizi sebagai sistem mitigasi proaktif yang mampu
memvalidasi kandungan makronutrien dan mendeteksi kelayakan fisik
makanan sebelum didistribusikan kepada para siswa.
2. Mengimplementasikan dan mengoptimalkan algoritma pemrosesan citra
YOLOv8 ke dalam aplikasi mobile validator untuk mengenali ciri-ciri makanan
yang mulai membusuk atau tidak layak konsumsi secara instan.
3. Membangun ekosistem perangkat lunak terintegrasi yang memisahkan beban
kerja komputasi menggunakan kombinasi teknologi React Native, Next.js,
Golang sebagai API Gateway, dan Python guna menunjang kelancaran
pelaporan serta pemantauan data distribusi tanpa bottleneck.
1.4 Manfaat Project
berbagai pihak, di antaranya:
Proyek KawanGizi diharapkan dapat memberikan manfaat yang signifikan bagi
1. Bagi Siswa dan Masyarakat: Memberikan informasi keamanan pangan dan
nutrisi yang optimal sehingga siswa terhindar dari risiko keracunan massal
akibat kualitas makanan yang buruk.
2. Bagi Satgas MBG dan Pemerintah: Menyediakan dasbor pemantauan
berbasis web yang transparan dan real-time untuk melacak peta distribusi,
mengawasi kualitas gizi, serta merespons laporan anomali makanan secara
cepat dan tepat sasaran.
3. Bagi Petugas Validator di Lapangan: Memberikan alat bantu digital yang
praktis, cepat, dan objektif untuk menyingkirkan ketergantungan pada
pengecekan visual manual yang rawan akan kesalahan manusia.
4. Bagi Perkembangan Teknologi Informasi: Menjadi rujukan implementasi
nyata terkait penggabungan arsitektur microservices dan Computer Vision pada
perangkat mobile untuk menyelesaikan problematika kesehatan masyarakat.
BAB II
DESKRIPSI PROJECT
2.1 Deskripsi Project
KawanGizi adalah sebuah ekosistem digital terpadu yang dirancang untuk
melakukan skrining kelayakan konsumsi dan pemindaian makronutrien pada program
Makan Bergizi Gratis (MBG). Proyek ini hadir sebagai instrumen perlindungan lapis
pertama yang menjembatani kesenjangan pengawasan keamanan pangan antara pihak
penyedia makanan dan siswa penerima manfaat. Melalui perpaduan teknologi
Computer Vision dan arsitektur perangkat lunak modern, KawanGizi mendigitalisasi
proses inspeksi makanan yang sebelumnya dilakukan secara manual dan subjektif
menjadi sebuah sistem yang terukur, objektif, dan instan.
Secara operasional, ekosistem ini memfasilitasi dua sisi pengguna utama. Di
lapangan, para validator atau guru dibekali dengan aplikasi mobile untuk memindai
porsi makanan menggunakan kamera ponsel sebelum makanan didistribusikan. Di
pusat komando, Satgas MBG dan pemangku kebijakan mendapatkan akses ke dasbor
pemantauan berbasis web yang menampilkan peta distribusi, status kelayakan gizi, dan
peringatan dini anomali secara real-time. Keseluruhan proses ini berjalan mulus di
balik layar melalui infrastruktur sistem terpisah (decoupled architecture) yang
dirancang untuk menangani beban kerja tinggi secara bersamaan.
2.2 Permasalahan dan Urgensi Project
Skala distribusi program MBG yang mencakup ribuan titik sekolah setiap harinya
membawa tantangan logistik dan keamanan yang masif. KawanGizi dikembangkan
untuk menyelesaikan tiga celah fundamental pada sistem pengawasan saat ini.
1. etiadaan mekanisme validasi tahap akhir atau last-mile validation membuat
penurunan kualitas makanan sulit terdeteksi. Makanan yang dikirim dari dapur
umum seringkali mengalami penurunan kualitas selama perjalanan akibat suhu,
durasi pengiriman, atau wadah yang kurang steril sehingga tiba di sekolah
dalam kondisi ambang batas kelayakan.
2. Keterbatasan kapasitas tenaga di lapangan menjadi kendala besar karena
validator tidak memiliki waktu, alat ukur yang memadai, maupun keilmuan gizi
untuk mengecek ribuan kotak makan satu per satu secara manual saat jam
istirahat tiba.
3. Ketergantungan pada observasi mata telanjang membuat pengecekan menjadi
sangat subjektif dan rawan akan kesalahan manusia. Indikasi awal pembusukan
atau kontaminasi sangat rentan terlewat sehingga berisiko tinggi
membahayakan pencernaan anak-anak.
2.3 Solusi yang Ditawarkan
Untuk menjawab urgensi tersebut, KawanGizi menawarkan solusi berupa
validasi visual instan yang digerakkan oleh kecerdasan buatan dan didukung oleh
arsitektur perangkat lunak yang tangguh. Solusi ini diwujudkan melalui serangkaian
pemetaan berikut.
1. Menjawab ketiadaan mekanisme validasi tahap akhir dengan menghadirkan
pemindai visual berbasis algoritma YOLOv8. Fitur ini memungkinkan aplikasi
mendeteksi anomali fisik yang mengindikasikan ketidaklayakan konsumsi
secara seketika hanya melalui sorotan kamera ponsel.
2. Menjawab keterbatasan keilmuan gizi validator di lapangan melalui fitur
estimasi makronutrien. Sistem secara otomatis mengkalkulasi kandungan
karbohidrat, protein, dan lemak bersamaan dengan proses pemindaian gambar
kelayakan makanan.
3. Menjawab tantangan performa antarmuka dengan membangun aplikasi mobile
validator menggunakan React Native guna memastikan akses kamera berjalan
responsif dan ringan di berbagai perangkat pintar,
4. Menjawab risiko kepadatan lalu lintas data saat jam makan siang serentak
melalui implementasi Golang sebagai API Gateway. Dukungan concurrency
bawaan pada sistem ini dirancang khusus untuk menangani ribuan permintaan
pemindaian dari berbagai wilayah tanpa mengalami penumpukan proses.
5. Menjawab kebutuhan pengawasan jarak jauh bagi Satgas MBG dengan
mengembangkan web dashboard menggunakan Next.js. Dukungan server-side
rendering memampukan pemerintah memonitor peta distribusi dan merespons
potensi keracunan di lapangan secara instan.
Melalui integrasi seluruh solusi teknologi tersebut, KawanGizi memastikan
pengawasan program Makan Bergizi Gratis tidak lagi sekadar rutinitas pengecekan
visual yang rawan keliru, melainkan bertransformasi menjadi tameng perlindungan
proaktif yang menjamin setiap porsi makanan benar-benar aman dan bergizi sebelum
sampai ke tangan para siswa.
2.4 Keunggulan dan Nilai Inovasi
KawanGizi memiliki serangkaian keunggulan kompetitif dan nilai inovasi yang
membedakannya dari sistem pelaporan konvensional:
1. 2. 3. Implementasi YOLOv8 untuk Kecepatan dan Akurasi Tinggi
Inovasi kecerdasan buatan pada KawanGizi secara spesifik menggunakan
arsitektur Convolutional Neural Network (CNN) berbasis YOLOv8,
menyingkirkan model R-CNN konvensional. Pemilihan ini memberikan
keseimbangan terbaik antara kecepatan inferensi real-time dan akurasi deteksi
anomali fisik makanan, sehingga validator tidak perlu menunggu lama untuk
mendapatkan hasil screening di perangkat mobile mereka.
Infrastruktur Decoupled Architecture yang Tangguh
Pemisahan ekosistem menjadi layanan-layanan independen menjamin sistem
tidak akan mengalami bottleneck atau gangguan sistemik saat digunakan
massal. Komputasi AI pada Python tidak akan membebani antarmuka React
Native, sementara lalu lintas data secara tangguh diorkestrasi oleh concurrency
bawaan dari Golang.
Pemetaan Real-Time dengan Server-Side Rendering (SSR)
Dasbor administrator yang dibangun menggunakan Next.js memanfaatkan
kapabilitas SSR untuk merender visualisasi data pemetaan distribusi secara
instan. Jika model AI mendeteksi anomali atau indikasi keracunan di satu titik,
dasbor akan memetakan asal dapur penyuplai tanpa mengorbankan performa
halaman, memungkinkan Satgas MBG untuk segera membekukan distribusi
dari penyuplai tersebut ke sekolah lainnya secara seketika.
Dengan memadukan kecepatan deteksi kecerdasan buatan dan ketangguhan
arsitektur sistem, KawanGizi hadir tidak sekadar sebagai alat pemindai gizi biasa.
Inovasi ini menawarkan sebuah ekosistem pengawasan mutakhir yang siap
diimplementasikan dalam skala masif, sekaligus menetapkan standar baru dalam
menjaga keamanan rantai pasok pangan masyarakat melalui pendekatan teknologi yang
tepat guna.
BAB III
PERANCANGAN DAN IMPLEMENTASI PROJECT
3.1 Konsep dan Alur Project
Kehadiran KawanGizi dirancang sebagai jembatan digital yang menghubungkan
pengawasan lapangan dengan pusat komando secara seketika. Gagasan utamanya
adalah mendigitalisasi proses inspeksi makanan harian melalui pemindaian visual
cerdas. Dengan pendekatan ini, setiap porsi menu yang tiba di sekolah dapat divalidasi
kandungan gizi dan kelayakan fisiknya secara objektif tepat sebelum dibagikan kepada
anak-anak.
Agar seluruh proses operasional harian tersebut berjalan mulus tanpa hambatan
teknis, pengembangan ekosistem perangkat lunak ini dibangun di atas fondasi
decoupled architecture. Pemisahan beban kerja dari sisi pengguna hingga ke pusat
komputasi analitik dapat diilustrasikan melalui rancangan berikut.
[disini diisi gambar diagram arsitektur sistemnya]
Mengacu pada rancangan tersebut, ekosistem KawanGizi membagi tugas
komputasinya ke dalam beberapa lingkungan mandiri. Titik interaksi paling depan
dipegang oleh aplikasi mobile yang dikembangkan menggunakan React Native.
Platform ini berfokus penuh untuk memberikan pengalaman akses kamera yang cepat
dan antarmuka pelaporan yang ringan bagi para validator di sekolah. Bersamaan
dengan itu, pihak Satgas MBG dibekali dengan dasbor pemantauan web berbasis
Next.js. Pemanfaatan Server-Side Rendering (SSR) pada web ini memungkinkan
visualisasi data distribusi harian dimuat secara instan tanpa membuat peramban
administrator menjadi lambat.
Seluruh lalu lintas data antara aplikasi mobile dan dasbor web tersebut diatur oleh
sebuah API Gateway tersentralisasi yang dibangun dengan Golang. Peran Golang di
sini sangat krusial karena dukungan concurrency bawaannya mampu menangani ribuan
pengiriman gambar secara bersamaan saat jam makan siang tanpa memicu kendala
server. Sementara itu, beban kerja yang paling berat yakni pemrosesan citra digital,
kalkulasi makronutrien, dan deteksi indikasi pembusukan menggunakan YOLOv8
dijalankan sepenuhnya pada lingkungan backend Python. Pemisahan komputasi ini
menjamin proses kecerdasan buatan tidak akan pernah mengganggu kestabilan
antarmuka layanan yang sedang digunakan oleh para validator.
3.2 Target Pengguna dan Potensi Pasar
3.2.1 Profil Target Pengguna
Ekosistem KawanGizi dirancang untuk menjembatani berbagai pihak yang
terlibat secara langsung dalam rantai pasok dan pengawasan program Makan Bergizi
Gratis. Berikut adalah profil pengguna utama dari sistem ini.
1. Guru dan Staf Sekolah (Validator Lapangan) bertindak sebagai garda
terdepan yang berinteraksi dengan porsi makanan sesaat sebelum dibagikan
kepada para siswa. Mereka adalah pengguna utama aplikasi mobile yang sangat
membutuhkan instrumen pemindai praktis dan responsif untuk menentukan
kelayakan makanan, tanpa harus memiliki pemahaman mendalam terkait ilmu
gizi kesehatan Masyarakat.
2. Satuan Tugas MBG dan Dinas Kesehatan ini berperan sebagai pengawas
pusat yang memonitor ribuan titik distribusi setiap harinya. Mereka
mengandalkan antarmuka dasbor web untuk mendapatkan visualisasi data
pemetaan keamanan pangan harian, serta membutuhkan peringatan dini yang
akurat apabila sistem mendeteksi lonjakan anomali kelayakan makanan dari
mitra penyuplai tertentu.
3. Mitra Penyedia Makanan (Dapur Umum) tidak bertindak sebagai operator
pemindai secara langsung, namun kelompok ini merupakan bagian tak
terpisahkan dari ekosistem. Laporan analitik gizi dan deteksi kelayakan yang
dihasilkan oleh KawanGizi menjadi tolok ukur transparansi yang objektif
terkait kualitas dan kepatuhan standar produksi mereka.
3.2.2 Estimasi Potensi Pasar
Mengingat KawanGizi lahir sebagai solusi mitigasi keamanan pangan,
pengukuran potensi pasarnya difokuskan pada skala adopsi institusional melalui
pendekatan Business-to-Government (B2G) dan Business-to-Business (B2B), yang
dibagi ke dalam tiga ruang lingkup berikut.
1. Skala Nasional Program Pemerintah (Sektor B2G). Potensi serapan terbesar
dan paling krusial bertumpu pada program Makan Bergizi Gratis itu sendiri.
Mengingat program ini menargetkan jangkauan distribusi ke puluhan juta anak
usia sekolah di puluhan ribu institusi pendidikan se-Indonesia, KawanGizi
memiliki ruang implementasi yang sangat masif sebagai instrumen
standardisasi wajib (quality control) pendamping program pemerintah pusat.
2. Ekosistem Pendidikan Swasta dan Katering Komersial (Sektor B2B). Di
luar program pemerintah, teknologi pemindai visual gizi ini memiliki daya jual
yang sangat relevan untuk diadopsi oleh yayasan pendidikan swasta bertaraf
internasional, panti asuhan, hingga vendor katering rumah sakit. Entitas bisnis
ini memiliki urgensi tinggi untuk memberikan jaminan mutu gizi berlapis
sebelum menyajikan makanan kepada klien maupun pasien mereka.
3. Lembaga Swadaya Masyarakat dan Sektor Kemanusiaan. Fleksibilitas
model deteksi pembusukan makanan pada KawanGizi membuka peluang
kemitraan dengan organisasi kemanusiaan atau badan tanggap darurat. Saat
terjadi krisis bencana alam, sistem ini sangat potensial dialihfungsikan untuk
memvalidasi kelayakan bantuan pangan siap saji yang dikirimkan ke posko
pengungsian guna mencegah risiko penyakit pencernaan lanjutan.
3.3 Perancangan Project
Tahap perancangan ini berfungsi sebagai cetak biru yang memetakan bagaimana
para pengguna berinteraksi dengan berbagai layanan di dalam ekosistem KawanGizi.
Untuk memberikan gambaran teknis yang komprehensif, perancangan sistem dibagi ke
dalam tiga cakupan utama yang meliputi pemodelan interaksi, alur kerja proses, dan
pendekatan antarmuka.
3.3.1 Pemodelan Interaksi Pengguna (Use Case)
[Di sini diisi gambar Use Case Diagram KawanGizi]
Berdasarkan rancangan pemodelan di atas, sistem membatasi wewenang
operasional ke dalam dua aktor utama. Aktor pertama adalah Validator di lapangan
yang berinteraksi secara eksklusif melalui aplikasi mobile. Hak akses yang dimiliki
oleh validator mencakup fitur pengambilan citra makanan melalui kamera, peninjauan
hasil estimasi makronutrien dan status kelayakan konsumsi secara instan, serta
pemantauan riwayat validasi yang telah mereka lakukan pada hari tersebut.
Aktor kedua adalah Administrator atau Satgas MBG yang beroperasi di balik
layar melalui dasbor web. Berbeda dengan validator, Satgas memiliki akses
pengawasan berskala makro. Mereka berwenang untuk memantau agregasi data gizi
harian, melacak peta sebaran distribusi, melihat daftar sekolah yang melaporkan
temuan anomali makanan, serta mengelola data dasar dari setiap mitra dapur umum.
3.3.2 Alur Kerja Validasi (System Flow)
[Di sini diisi gambar Activity Diagram / Flowchart pemindaian makanan]
Denyut nadi utama dari KawanGizi terletak pada kelancaran alur validasi
visualnya. Proses ini dimulai ketika validator mengaktifkan fitur pemindai pada
aplikasi React Native dan menyorot porsi makanan. Aplikasi kemudian menangkap
citra digital tersebut dan mengirimkannya melalui API Gateway Golang. Gerbang ini
bertugas memastikan kelancaran antrean data sebelum meneruskannya ke peladen
backend Python.
Di dalam lingkungan Python inilah model YOLOv8 mengambil alih untuk
membedah piksel gambar, mendeteksi ada tidaknya ciri-ciri fisik pembusukan, dan
mengalkulasi rentang kalori serta makronutrien porsi tersebut. Setelah komputasi
selesai, hasil akhirnya dikembalikan ke layar ponsel validator dalam bentuk kartu
informasi yang lugas (misalnya indikator hijau untuk aman dan merah untuk tidak
layak). Secara bersamaan, hasil keputusan ini direkam ke dalam basis data utama agar
dasbor Next.js milik Satgas MBG dapat langsung memutakhirkan visualisasi petanya
secara seketika.
3.3.3 Pendekatan Desain Antarmuka (UI/UX)
Mengingat aplikasi ini digunakan dalam ritme kerja yang serba cepat menjelang
jam istirahat sekolah, pendekatan antarmuka KawanGizi sangat mengedepankan
prinsip fungsionalitas dan kemudahan akses. Aplikasi mobile bagi validator dirancang
tanpa banyak cabang menu yang membingungkan. Tata letaknya dibuat sebersih
mungkin sehingga layar utama langsung berfokus pada akses kamera, memungkinkan
guru atau staf sekolah mengoperasikannya tanpa perlu masa adaptasi teknis yang
panjang.
Di sisi lain, dasbor web dirancang layaknya pusat komando analitik. Pendekatan
visual diatur sedemikian rupa agar metrik kesehatan pangan tidak terlihat seperti
deretan tabel yang membosankan. Data disajikan melalui grafik interaktif dan
pemetaan warna spasial, di mana titik sekolah dengan laporan indikasi makanan rusak
akan langsung menyala sebagai sinyal peringatan, memampukan Satgas MBG untuk
mengambil keputusan mitigasi hanya dalam sekali pandang.
3.4 Teknologi yang Digunakan
Untuk merealisasikan arsitektur sistem KawanGizi secara menyeluruh, teknologi
yang digunakan pada setiap lapisan komponen mencakup:
1. React Native diimplementasikan pada aplikasi mobile validator untuk
memastikan fitur akses kamera pemindai dan pelaporan status kelayakan
makanan berjalan sangat responsif secara lintas platform melalui satu basis
kode.
2. Next.js digunakan dalam membangun web dashboard administratif Satgas
MBG dengan memanfaatkan kemampuan Server-Side Rendering (SSR) guna
merender visualisasi data pemetaan distribusi harian secara instan tanpa
membebani peramban.
3. Golang difungsikan sebagai API Gateway sentral yang memanfaatkan
mekanisme concurrency bawaannya untuk menangani lonjakan ribuan
permintaan pemindaian gambar secara serentak dari berbagai sekolah saat jam
istirahat tiba.
4. 5. Python diisolasi secara khusus pada peladen komputasi mandiri agar dapat
memproses beban kerja kecerdasan buatan yang berat, meliputi pemrosesan
citra digital dan kalkulasi estimasi makronutrien, tanpa mengganggu kinerja
layanan utama.
YOLOv8 dipilih sebagai model kecerdasan buatan utama, menyingkirkan R-
CNN konvensional, karena terbukti memberikan keseimbangan terbaik antara
kecepatan inferensi real-time di perangkat genggam dan tingkat akurasi tinggi
dalam mengenali anomali fisik pembusukan makanan.
3.5 Prototype dan Implementasi
Deskripsi visualisasi hasil coding dan tampilan dasbor/aplikasi yang sudah setengah jadi
(MVP).
BAB IV
HASIL DAN PEMBAHASAN
4.1 Hasil Project
Pengembangan KawanGizi pada tahap ini telah membuahkan purwarupa
(prototype) berskala Minimum Viable Product (MVP). Purwarupa ini merealisasikan
gagasan utama sistem validasi keamanan pangan secara terpadu, mencakup proses
pemindaian visual di lokasi sekolah hingga sinkronisasi data ke pusat komando Satgas
MBG. Rincian pencapaian teknis yang berhasil diwujudkan dalam iterasi
pengembangan ini meliputi tiga aspek utama.
4.1.1 Capaian Arsitektur dan Infrastruktur
Penerapan decoupled architecture telah berhasil dieksekusi dengan matang,
memastikan setiap lapisan teknologi menjalankan perannya secara independen tanpa
menimbulkan hambatan kinerja sistem secara keseluruhan.
1. Aplikasi mobile berbasis React Native telah beroperasi stabil pada perangkat
genggam, memberikan antarmuka akses kamera yang ringan dan minim jeda
bagi validator lapangan.
2. Dasbor web administratif Next.js sukses merender visualisasi pemantauan
harian dan status kelayakan melalui implementasi Server-Side Rendering
(SSR) yang responsif.
3. API Gateway Golang berfungsi penuh dalam mengorkestrasi lalu lintas
komunikasi data, memastikan transmisi pengiriman gambar dari banyak klien
menuju peladen terpusat berjalan lancar tanpa indikasi bottleneck.
4. Peladen backend Python berhasil diisolasi sebagai ruang komputasi mandiri,
menjalankan beban kerja kecerdasan buatan secara terpisah agar tidak
mengintervensi kecepatan antarmuka aplikasi.
4.1.2 Capaian Fungsional
Dari aspek operasional, purwarupa ini mampu mendemonstrasikan kelancaran
alur validasi gizi secara utuh dari awal hingga akhir, dengan capaian fitur kunci sebagai
berikut:
1. Modul kamera pada aplikasi berhasil menangkap citra porsi makanan secara
tajam dan mengirimkannya secara aman ke server backend untuk dianalisis.
2. Algoritma YOLOv8 sukses mengidentifikasi gambar masukan guna
mendeteksi indikasi pembusukan atau anomali fisik objek dengan latensi yang
sangat rendah.
3. Mesin analitik berhasil mengekstraksi dan mengalkulasi estimasi kandungan
makronutrien utama (karbohidrat, protein, lemak) dari porsi yang dipindai.
4. Hasil keputusan sistem terkait kelayakan konsumsi sukses dirender kembali ke
layar ponsel validator dalam bentuk indikator visual yang intuitif.
5. Pembaruan data spasial sekolah dan laporan anomali berhasil disinkronkan
seketika ke dalam peta interaktif pada dasbor Satgas MBG untuk keperluan
pemantauan jarak jauh.
4.1.3 Capaian Antarmuka
Seluruh alur interaksi yang disusun pada fase perancangan kini telah memiliki
representasi antarmuka fungsional. Tampilan aplikasi mobile telah disesuaikan agar
berpusat pada kepraktisan fitur pemindai, sementara dasbor web berhasil menyajikan
metrik keamanan pangan melalui grafik serta pemetaan yang mudah dicerna secara
visual. Realisasi antarmuka ini memungkinkan keseluruhan pengalaman pengguna,
mulai dari tahapan inspeksi kotak makan oleh guru hingga pengawasan makro oleh
administrator dan dapat didemonstrasikan secara komprehensif.
Keberhasilan implementasi purwarupa ini membuktikan bahwa perpaduan
teknologi Computer Vision dan arsitektur microservices sangat layak diwujudkan
sebagai instrumen mitigasi keracunan pada program Makan Bergizi Gratis, sekaligus
menjadi fondasi teknis yang solid sebelum melangkah pada fase pengujian lanjutan.
4.2 Fitur dan Fungsionalitas
KawanGizi dikembangkan sebagai ekosistem digital yang komprehensif untuk
mengawal keamanan pangan program Makan Bergizi Gratis dari hulu ke hilir. Dari
sekian banyak kapabilitas operasional dan administratif yang dirancang di dalam
sistem, berikut adalah fitur-fitur utama yang menjadi motor penggerak ekosistem
KawanGizi:
1. Fitur Pemindai Visual Kelayakan
[Screenshot Antarmuka: Layar Kamera Pemindai dan Panduan Bingkai pada
Aplikasi Mobile]
Modul ini menyajikan antarmuka kamera utama bagi validator untuk menyorot
porsi makanan secara langsung. Pengguna mengarahkan lensa ponsel pada kotak
makan mengikuti garis panduan, lalu sistem akan menangkap citra tersebut dan
mengirimkannya ke mesin kecerdasan buatan untuk proses ekstraksi visual dalam
hitungan detik.
2. Fitur Indikator Gizi dan Keamanan
[Screenshot Antarmuka: Kartu Hasil Deteksi Kelayakan dan Estimasi
Makronutrien pada Aplikasi Mobile]
Modul ini memberikan keputusan instan terkait status makanan kepada validator
di lapangan. Sistem menerjemahkan keluaran algoritma YOLOv8 menjadi
peringatan warna yang tegas mengenai kelayakan fisik makanan, sekaligus
menyajikan rincian estimasi kandungan karbohidrat, protein, dan lemak secara
berdampingan.
3. Fitur Pelaporan Insiden Cepat
[Screenshot Antarmuka: Formulir Pelaporan Temuan Anomali Makanan pada
Aplikasi Mobile]
Modul ini memfasilitasi validator untuk mengambil tindakan langsung apabila
temuan fisik di lapangan membutuhkan eskalasi manual. Pengguna dapat
melampirkan foto tambahan, catatan kondisi kemasan, dan kategori temuan untuk
langsung dikirimkan ke antrean peninjauan Satgas MBG.
4. Fitur Riwayat Validasi
[Screenshot Antarmuka: Daftar Rekam Jejak Pemindaian Harian pada Aplikasi
Mobile]
Modul ini berfungsi sebagai buku catatan digital bagi guru atau staf sekolah yang
bertugas. Interaksi perekaman berjalan otomatis setiap kali sesi pemindaian
selesai, menyimpan rekam jejak jumlah porsi yang telah lolos uji beserta status
kelayakannya agar mudah dicocokkan dengan presensi harian siswa.
5. Fitur Pemetaan Distribusi Spasial
[Screenshot Antarmuka: Peta Interaktif Sebaran Sekolah dan Status Kelayakan
pada Web Dashboard]
Modul ini memfasilitasi Satgas MBG untuk memantau keamanan rantai pasok
secara terpusat dari peramban web. Pengguna disajikan peta digital yang
memanfaatkan indikator pewarnaan spasial guna membedakan titik sekolah
dengan pasokan makanan yang terkendali dan area yang memerlukan intervensi
mendesak.
6. Fitur Peringatan Dini Anomali
[Screenshot Antarmuka: Panel Notifikasi Darurat dan Pelacakan Dapur Umum
pada Web Dashboard]
Modul ini memastikan pihak berwenang dapat merespons potensi keracunan
massal sebelum terjadi. Sistem secara proaktif memicu notifikasi peringatan saat
mendeteksi lonjakan temuan makanan rusak di suatu sekolah, memampukan
Satgas untuk langsung melacak dan membekukan sementara pengiriman dari mitra
katering terkait.
7. Fitur Agregasi Analitik Gizi
[Screenshot Antarmuka: Grafik Statistik Pemenuhan Makronutrien Harian pada
Web Dashboard]
Modul ini menyajikan ringkasan performa operasional program distribusi
makanan dalam bentuk representasi visual interaktif. Sistem mengumpulkan
seluruh data estimasi gizi dari lapangan dan mengubahnya menjadi grafik statistik
yang memudahkan pemerintah dalam mengevaluasi tingkat kepatuhan standar
makronutrien secara makro.
8. Fitur Manajemen Katering (Mitra Dapur Umum)
[Screenshot Antarmuka: Tabel Profil Vendor dan Rapor Kepatuhan Gizi pada Web
Dashboard]
Modul ini digunakan oleh administrator untuk mengelola pangkalan data penyedia
makanan yang terlibat dalam ekosistem MBG. Petugas dapat meninjau rekam jejak
insiden, metrik kelayakan harian, serta memberikan rapor evaluasi otomatis bagi
setiap dapur umum berdasarkan hasil akumulasi pemindaian dari lapangan.
4.3 Pengujian
4.3.1 Pengujian Akurasi Model Kecerdasan Buatan (AI Evaluation)
* diisi nanti[]
4.3.2 Pengujian Fungsionalitas (Black Box Testing)
(Tabel skenario uji tombol/alur fitur, input data, hasil yang diharapkan, dan status
lolos/gagal)
4.3.3 Pengujian Beban dan Konkurensi (Stress Testing)
(Metrik teknis: response time API, latency, uji beban ringan, atau akurasi modul
cerdas jika ada)
BAB V
PENUTUP
5.1 Kesimpulan
Pelaksanaan program Makan Bergizi Gratis (MBG) memiliki visi yang sangat
esensial bagi kesehatan anak bangsa, namun pelaksanaannya di lapangan terbukti
rentan terhadap krisis keamanan pangan akibat ketiadaan proses validasi tahap akhir.
KawanGizi hadir menawarkan terobosan teknologi proaktif untuk menjembatani celah
pengawasan tersebut. Melalui perpaduan algoritma kecerdasan buatan YOLOv8 dan
infrastruktur perangkat lunak berbasis decoupled architecture, sistem ini sukses
mendigitalisasi proses inspeksi kelayakan fisik dan estimasi makronutrien menjadi jauh
lebih cepat, objektif, dan terukur secara nyata.
Implementasi ekosistem terpadu ini mencakup kepraktisan aplikasi mobile bagi
para guru selaku validator di sekolah serta keandalan dasbor web pemantauan bagi
Satgas MBG. Keduanya terbukti mumpuni untuk mencegah distribusi makanan basi
atau terkontaminasi. Pada akhirnya, KawanGizi tidak hanya sekadar menekan angka
kasus keracunan massal pada siswa, tetapi juga menetapkan standardisasi dan
transparansi baru yang berbasis data bagi penyelenggaraan program gizi berskala
nasional.
5.2 Rencana Pengembangan Lanjutan
Sebagai sebuah purwarupa inovasi teknologi, ekosistem KawanGizi memiliki
ruang eskalasi yang sangat luas untuk disempurnakan di masa mendatang. Beberapa
rencana pengembangan strategis yang akan menjadi fokus pada fase selanjutnya
meliputi:
1. Pengayaan Dataset Kuliner Nusantara
Memperluas pustaka data latih untuk model kecerdasan buatan agar mencakup
lebih banyak ragam visual menu makanan lokal dari berbagai daerah di
Indonesia. Hal ini akan semakin menajamkan akurasi deteksi YOLOv8 dalam
mengenali berbagai jenis bahan pangan spesifik.
2. Integrasi Perangkat IoT Portabel
Melakukan riset pengembangan untuk mengintegrasikan aplikasi dengan
perangkat Internet of Things sederhana seperti sensor suhu portabel. Penambahan
parameter termal ini akan membuat hasil keputusan kelayakan makanan menjadi
jauh lebih holistik di luar sekadar deteksi visual.
3. Ekspansi Uji Coba Lapangan
Menginisiasi program percontohan secara langsung dengan menggandeng
pemerintah daerah, dinas kesehatan, serta panti asuhan lokal untuk mengukur
ketahanan infrastruktur sistem secara nyata dalam ritme distribusi harian berskala
besar.
4. Penerapan Fitur Aksesibilitas Luar Jaringan
Menambahkan kapabilitas penyimpanan lokal sementara pada aplikasi mobile
validator agar fitur pemindaian tetap dapat berfungsi di wilayah sekolah yang
memiliki keterbatasan sinyal internet. Data pemindaian tersebut nantinya akan
disinkronkan ke peladen pusat saat koneksi kembali stabil.