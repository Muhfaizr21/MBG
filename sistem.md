FLOWCHART SISTEM MBG BERBASIS QR CODE & AI

Sistem Informasi Makan Bergizi Gratis (MBG) dengan Analisis Nutrisi dan Kesegaran Makanan

1. Gambaran Umum Sistem
Sistem dirancang untuk menghubungkan Admin, SPPG, dan User dalam pengelolaan serta pemantauan makanan MBG. Setiap produksi makanan memiliki QR Code yang dapat dipindai untuk menampilkan informasi menu, bahan, nutrisi, waktu produksi, dan hasil analisis AI.

2. Flowchart Sistem Utama
No.

Tahapan Flowchart

Proses / Keterangan

1

START

Sistem dimulai.

2

Login / Akses Sistem

Pengguna masuk sebagai Admin, Petugas SPPG, atau User.

3

Admin / SPPG

Admin mengelola SPPG. Petugas SPPG mengelola produksi makanan.

4

Input Menu MBG

Petugas memasukkan nama menu, tanggal, waktu produksi, foto, dan jumlah porsi.

5

Input Bahan

Masukkan bahan, jumlah, satuan, serta data kandungan nutrisi.

6

Nutrition Engine

Sistem menghitung kalori, protein, karbohidrat, lemak, serat, dan nutrisi lain.

7

Freshness / Risk Engine

Sistem menganalisis waktu produksi, suhu, kelembapan, penyimpanan, dan data pendukung.

8

AI Analysis

AI menggabungkan hasil perhitungan dan memberikan analisis/penjelasan.

9

Generate QR Code

Sistem membuat QR unik untuk setiap produksi/menu.

10

Distribusi MBG

QR ditempel pada kemasan atau media informasi makanan.

11

User Scan QR

User memindai QR menggunakan kamera/perangkat.

12

Validasi QR

Sistem memeriksa token dan status QR.

13

Tampilkan Informasi

Sistem menampilkan menu, bahan, nutrisi, waktu produksi, dan analisis AI.

14

Monitoring

Data dapat dipantau oleh Admin/SPPG untuk evaluasi.

15

END

Proses selesai.

Alur ringkas: START → Login → Input Menu & Bahan → Hitung Nutrisi → Analisis Kesegaran → AI → Generate QR → Distribusi → Scan QR → Validasi → Tampilkan Informasi → Monitoring → END.

3. Flowchart Berdasarkan Aktor
Aktor

Flow

ADMIN

Login → Kelola SPPG → Kelola Petugas → Monitoring Menu → Monitoring Analisis AI → Laporan

PETUGAS SPPG

Login → Dashboard SPPG → Input Produksi → Input Menu → Input Bahan → Analisis → Generate QR → Distribusi

USER

Buka aplikasi/website → Scan QR → Validasi QR → Lihat Menu → Lihat Bahan → Lihat Nutrisi → Lihat Status Kesegaran & Analisis AI

AI ENGINE

Terima data menu + bahan + nutrisi + waktu + suhu/kelembapan → Analisis → Freshness Score/Risk Level → Penjelasan AI

4. Flowchart Proses SPPG
No.

Tahap

Keterangan

1

Login Petugas SPPG

Autentikasi petugas.

2

Buat Produksi MBG

Menentukan tanggal, waktu, menu, dan jumlah porsi.

3

Input Bahan

Mencatat bahan dan kuantitas yang digunakan.

4

Perhitungan Nutrisi

Sistem menghitung nilai gizi berdasarkan data bahan.

5

Analisis AI

AI membaca data nutrisi dan parameter kesegaran.

6

Generate QR

QR unik dibuat berdasarkan ID/token produksi.

7

Cetak/Distribusi

QR ditempel pada kemasan atau media yang sesuai.

5. Flowchart User / Scan QR
No.

Tahap

Keterangan

1

Scan QR Code

User mengarahkan kamera ke QR.

2

Validasi QR

Sistem mengecek token, menu, SPPG, dan status QR.

3

Data Ditemukan?

Jika tidak valid, tampilkan pesan QR tidak ditemukan/tidak aktif.

4

Informasi Menu

Tampilkan nama menu, foto, SPPG, tanggal, dan waktu produksi.

5

Informasi Bahan

Tampilkan daftar bahan dan informasi alergen bila tersedia.

6

Informasi Nutrisi

Tampilkan kalori, protein, karbohidrat, lemak, serat, dan nutrisi lainnya.

7

Analisis Kesegaran

Tampilkan freshness score dan level risiko berdasarkan model/sistem.

8

Penjelasan AI

AI memberikan penjelasan ringkas mengenai hasil analisis.

6. Flowchart Analisis AI
Komponen

Proses

Input Data

Menu + bahan + jumlah + waktu produksi + waktu scan + suhu + kelembapan + penyimpanan + foto (opsional)

Nutrition Engine

Menghitung nilai nutrisi secara deterministik dari data bahan.

Freshness Engine

Mengolah parameter waktu, suhu, kelembapan, dan parameter keamanan yang ditentukan.

Machine Learning

Model dapat menghasilkan freshness score / risk level berdasarkan dataset terlatih.

Computer Vision

Jika foto tersedia, model dapat menganalisis indikator visual yang relevan.

AI Explanation

LLM menjelaskan hasil model dalam bahasa yang mudah dipahami.

Output

Nutrition Summary + Freshness Score + Risk Level + Explanation

7. Struktur Data Utama
Tabel

Fungsi

users

Data akun dan role pengguna

sppgs

Data SPPG dan penanggung jawab

menus

Data menu dan produksi makanan

ingredients

Master data bahan dan kandungan nutrisi

menu_ingredients

Relasi menu dengan bahan dan jumlahnya

nutrition_results

Hasil perhitungan nutrisi

qr_codes

Token dan status QR setiap produksi

temperature_logs

Riwayat suhu/kelembapan jika tersedia

ai_analyses

Hasil analisis freshness, risiko, dan penjelasan AI

8. Catatan Implementasi AI
AI sebaiknya tidak menjadi satu-satunya penentu keamanan pangan. Perhitungan nutrisi dapat menggunakan data bahan dan formula yang terukur, sedangkan analisis kesegaran dapat menggabungkan rule engine, machine learning, data suhu/waktu penyimpanan, dan computer vision. LLM digunakan terutama untuk memberikan penjelasan hasil analisis kepada pengguna.

Flowchart Sistem MBG — QR Code, Nutrisi, dan AI
