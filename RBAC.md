# RENCANA IMPLEMENTASI AUTH & RBAC — KawanGizi

**Status:** Fase 1 (Backend) & Fase 2 (Frontend) **SELESAI**
**Kebijakan Aktif:** Sistem hanya menggunakan **3 role aktif**, yaitu `superadmin`, `sppg`, dan `validator`.
**Database:** PostgreSQL 18 Lokal
**Database Name:** `kawangizi`
**Database User:** `postgres`

> **Catatan:** Seluruh route, permission, dan logika untuk role `satgas` dan `siswa` yang sebelumnya tersedia telah dihapus.

---

## 1. Sasaran & Ruang Lingkup

Implementasi Auth & RBAC KawanGizi bertujuan mengubah sistem dari prototipe login dummy menjadi sistem autentikasi dan otorisasi yang terintegrasi penuh antara backend, frontend web, dan mobile.

### Ruang Lingkup Implementasi

1. Mengubah frontend dari sistem login dummy menjadi autentikasi JWT sungguhan.
2. Menggunakan **refresh token berbasis cookie** untuk mempertahankan sesi pengguna.
3. Menerapkan **Role-Based Access Control (RBAC)** berdasarkan role yang ditentukan oleh backend.
4. Mengunci route terproteksi pada frontend menggunakan route guard.
5. Menyesuaikan UI berdasarkan role pengguna.
6. Menghapus seluruh dukungan terhadap role lama `satgas` dan `siswa`.
7. Memastikan akun lama bertipe `satgas` atau `siswa` ditolak oleh server saat login.
8. Memastikan session token lama tidak dapat digunakan untuk memperpanjang sesi.
9. Menjadikan tiga role berikut sebagai fondasi utama sistem:

   * `superadmin`
   * `sppg`
   * `validator`

### Prinsip Utama

**Superadmin**
Pengawasan nasional, audit, kill-switch, dan pengelolaan akun.

**SPPG**
Operasional dapur umum, pengelolaan stok bahan, perencanaan gizi berdasarkan AKG, dan penerbitan BAST.

**Validator**
Verifikasi mutu makanan menggunakan AI, input suhu release, penerimaan BAST, dan pelaporan insiden.

---

# 2. Role Aktif

| Role ID      | Label Tampilan            | Portal Utama            | Deskripsi Hak Akses                                                                                 |
| ------------ | ------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `superadmin` | Superadmin / Satgas BGN   | `/admin/*`              | Akses penuh terhadap seluruh permission dan dapat membuka serta mengaudit portal SPPG dan Validator |
| `sppg`       | Petugas SPPG / Dapur      | `/sppg/*`               | Operasional dapur, stok bahan, penyusunan menu berdasarkan AKG, dan pengiriman BAST                 |
| `validator`  | Validator Lapangan / Guru | `/validator/*` & Mobile | Pemindaian mutu AI, input suhu release, penerimaan BAST, dan pelaporan insiden                      |

### Ketentuan

* Hanya tiga role di atas yang dianggap valid oleh sistem.
* Role `satgas` dan `siswa` sudah tidak digunakan.
* Backend menjadi sumber utama kebenaran role dan permission.
* Frontend tidak boleh menentukan atau memanipulasi role pengguna secara manual.

---

# 3. Matriks Permission Server

Permission ditentukan secara eksplisit di backend, khususnya pada:

`backend/models/user.go`

| Modul / Permission  | Superadmin | SPPG | Validator |
| ------------------- | :--------: | :--: | :-------: |
| `validators.manage` |     RW     |   -  |     -     |
| `validators.read`   |     RW     |   -  |     -     |
| `sppg.manage`       |     RW     |  RW  |     -     |
| `sppg.read`         |     RW     |   R  |     -     |
| `kitchen.ops`       |     RW     |  RW  |     -     |
| `scan.submit`       |     RW     |   -  |     RW    |
| `handover.bast`     |     RW     |  RW  |     RW    |
| `incident.submit`   |     RW     |   -  |     RW    |
| `feedback.triage`   |     RW     |   -  |     RW    |
| `killswitch`        |     RW     |   -  |     -     |

**Keterangan:**

* `R` = Read
* `W` = Write
* `RW` = Read & Write
* `-` = Tidak memiliki akses

---

# 4. Peta Route Guard

## 4.1 Frontend Web

File utama:

`frontend/src/App.jsx`

| Route Prefix    | Role yang Diizinkan       | Perilaku Guard                                                 |
| --------------- | ------------------------- | -------------------------------------------------------------- |
| `/`             | Publik                    | Bebas diakses tanpa login                                      |
| `/fitur`        | Publik                    | Bebas diakses tanpa login                                      |
| `/tentang-kami` | Publik                    | Bebas diakses tanpa login                                      |
| `/login`        | Publik                    | Halaman login                                                  |
| `/register`     | Publik                    | Halaman registrasi                                             |
| `/scan`         | `validator`, `superadmin` | Membutuhkan login; redirect ke `/login` jika belum login       |
| `/admin/*`      | `superadmin`              | SPPG diarahkan ke `/sppg`, Validator diarahkan ke `/validator` |
| `/sppg/*`       | `sppg`, `superadmin`      | Validator diarahkan ke `/validator`                            |
| `/validator/*`  | `validator`, `superadmin` | SPPG diarahkan ke `/sppg`                                      |

### Ketentuan Akses Hub / Scan

Route:

`/scan`

Hanya dapat diakses oleh:

* `validator`
* `superadmin`

Pengguna yang belum login akan diarahkan ke:

`/login`

---

## 4.2 Mobile App

Lokasi:

`mobile/src/app/`

### Route Utama

| Route           | Akses       | Perilaku                                  |
| --------------- | ----------- | ----------------------------------------- |
| `app/index.tsx` | `validator` | Jika belum login → redirect ke `/login`   |
| `app/login.tsx` | Publik      | Form login menggunakan email dan password |

### Ketentuan Mobile

* Mobile App difokuskan untuk role `validator`.
* Login hanya menerima akun dengan role `validator`.
* Session pengguna divalidasi berdasarkan Auth Context.
* Validator yang belum login tidak dapat mengakses fitur utama aplikasi.

---

# 4.3 Backend Endpoints

File utama:

`backend/routes/routes.go`

| Endpoint               | Method             | Permission                                       |
| ---------------------- | ------------------ | ------------------------------------------------ |
| `/api/auth/login`      | POST               | Publik                                           |
| `/api/auth/refresh`    | POST               | Publik / Refresh Token                           |
| `/api/auth/logout`     | POST               | Authenticated                                    |
| `/api/auth/me`         | GET                | Authenticated                                    |
| `/api/admin/*`         | GET / POST / PATCH | `validators.manage`, `sppg.manage`, `killswitch` |
| `/api/sppg/*`          | GET / POST         | `kitchen.ops`                                    |
| `/api/scans`           | POST               | `scan.submit`                                    |
| `/api/scans/recent`    | GET                | `scan.submit`                                    |
| `/api/nutrition/items` | GET                | Authenticated                                    |

---

# 5. Desain Backend & Database

## 5.1 Database

**DBMS:** PostgreSQL 18
**Database:** `kawangizi`
**User:** `postgres`

Database digunakan sebagai sumber data utama untuk:

* User dan role
* Refresh token
* Audit log
* Relasi SPPG
* Data validator
* Data autentikasi dan otorisasi

---

## 5.2 Skema Database

```sql
CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    full_name     TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (
        role IN ('superadmin', 'sppg', 'validator')
    ),
    npsn          TEXT,
    school_name   TEXT,
    sppg_id       TEXT,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'blacklisted', 'pending')
    ),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE
);

CREATE TABLE audit_logs (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT NOT NULL,
    action      TEXT NOT NULL,
    target      TEXT,
    detail      TEXT,
    at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Contoh Action pada Audit Log

```text
validator.blacklist
ai.override
killswitch.trigger
```

---

# 6. Seed Akun Demo

Tersedia tiga akun demo aktif yang mewakili seluruh role sistem.

| Email                           | Password         | Role         | Entitas                              |
| ------------------------------- | ---------------- | ------------ | ------------------------------------ |
| `superadmin@kawangizi.id`       | `SuperAdmin123!` | `superadmin` | Satgas BGN Pusat                     |
| `dapur@sppg01.id`               | `Sppg123!`       | `sppg`       | SPPG 01 Menteng Jaya                 |
| `validator@sdn01menteng.sch.id` | `Validator123!`  | `validator`  | SDN Menteng 01 Pagi (NPSN: 33210130) |

### Ketentuan Login

Akun hanya dapat login apabila:

1. Email dan password valid.
2. Role termasuk salah satu dari:

   * `superadmin`
   * `sppg`
   * `validator`
3. Status akun valid dan tidak diblokir.
4. Token/session yang digunakan masih valid.

Akun lama dengan role `satgas` atau `siswa` akan ditolak oleh server dengan:

```text
401 Unauthorized
```

Session token lama dari role tersebut juga tidak dapat digunakan untuk melakukan refresh session.

---

# 7. Penyesuaian Komponen Frontend

## 7.1 AuthContext.jsx

File:

`frontend/src/AuthContext.jsx`

Fungsi utama:

* Mengambil profil pengguna dari:

```text
GET /api/auth/me
```

* Menyimpan informasi:

  * `id`
  * `name`
  * `role`
  * `permissions[]`
* Menyediakan state autentikasi kepada seluruh komponen frontend.
* Menangani kondisi authenticated / unauthenticated.

---

## 7.2 RequireRole.jsx

Komponen:

`RequireRole.jsx`

Fungsi:

* Melindungi route tertentu.
* Memeriksa status autentikasi.
* Memeriksa role pengguna.
* Menolak akses apabila role tidak sesuai.
* Mengarahkan pengguna ke portal yang sesuai.

Contoh:

```text
superadmin → /admin
sppg       → /sppg
validator  → /validator
```

---

## 7.3 LoginPage.jsx

Fungsi:

* Mengirim email dan password ke backend.
* Melakukan autentikasi melalui endpoint login.
* Menerima session/token dari backend.
* Mengambil profil pengguna.
* Mengarahkan pengguna berdasarkan role.

Redirect:

```text
superadmin → /admin
sppg       → /sppg
validator  → /validator
```

---

## 7.4 AdminLayout.jsx

Fungsi:

* Mengambil informasi pengguna secara dinamis dari `AuthContext`.
* Menampilkan profil pengguna.
* Menampilkan informasi role.
* Menyediakan tombol **Keluar**.
* Melakukan logout melalui:

```text
POST /api/auth/logout
```

---

## 7.5 lib/adminActions.js

Menyediakan helper:

```text
guardAdminAction(...)
```

Fungsi helper:

* Memastikan tindakan administratif memiliki permission yang sesuai.
* Mencegah pengguna non-superadmin menjalankan tindakan berisiko.
* Digunakan untuk operasi seperti:

  * Blacklist validator
  * Kill-switch
  * Tindakan administratif lainnya

---

# 8. Kebijakan Keamanan Auth & RBAC

## 8.1 Login Enforcement

Backend menjadi sumber utama validasi role.

Akun dengan role berikut:

```text
satgas
siswa
```

tidak lagi dianggap valid.

Apabila akun lama mencoba login:

```text
HTTP 403 Forbidden
```

Session token lama juga tidak dapat digunakan untuk memperpanjang sesi.

---

## 8.2 JWT & Refresh Token

Sistem menggunakan:

```text
Access Token  → JWT
Refresh Token → Cookie
```

Alur autentikasi:

```text
Login
   ↓
Backend validasi email + password
   ↓
Validasi role
   ↓
Generate JWT
   ↓
Generate Refresh Token
   ↓
Refresh Token disimpan sebagai cookie
   ↓
User mengakses sistem
   ↓
JWT digunakan untuk authorization
   ↓
JWT expired
   ↓
Refresh Token digunakan
   ↓
Generate session/token baru
```

---

# 9. Status Implementasi

```text
┌───────────────────────────────────────────────────────────────────────┐
│                         STATUS IMPLEMENTASI                            │
├──────────────────────────────┬────────────────────────────────────────┤
│ Modul Backend (Go)           │ ✅ SELESAI                             │
│                              │ Auth, RBAC, Scan AI, Nutrition          │
├──────────────────────────────┼────────────────────────────────────────┤
│ Modul Web Frontend (Vite)    │ ✅ SELESAI                             │
│                              │ Guard 3 Role & Cleanup Role Lama       │
├──────────────────────────────┼────────────────────────────────────────┤
│ Modul Mobile (Expo)          │ ✅ SELESAI                             │
│                              │ Auth Context & Validator Sync           │
├──────────────────────────────┼────────────────────────────────────────┤
│ Database                     │ ✅ SELESAI                             │
│                              │ PostgreSQL 18 Migration                 │
├──────────────────────────────┼────────────────────────────────────────┤
│ Scoping & Audit Log          │ ⏳ FASE 3 — DALAM PENGERJAAN           │
└──────────────────────────────┴────────────────────────────────────────┘
```

---

# 10. Ringkasan Arsitektur

KawanGizi saat ini menggunakan arsitektur **3-role RBAC**:

```text
                         ┌─────────────────┐
                         │   SUPERADMIN    │
                         │   /admin/*      │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌──────────────┐           ┌──────────────┐
             │     SPPG     │           │  VALIDATOR   │
             │   /sppg/*    │           │ /validator/* │
             └──────┬───────┘           └──────┬───────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                         ┌─────────────────┐
                         │  BACKEND GO     │
                         │   JWT + RBAC    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  PostgreSQL 18  │
                         │    kawangizi    │
                         └─────────────────┘
```

### Role yang Dipertahankan


superadmin
sppg
validator


### Role yang Dihapus


satgas
siswa




# 11. Kesimpulan

Implementasi Fase 1 dan Fase 2 Auth & RBAC KawanGizi telah selesai.

Sistem telah menggunakan autentikasi backend yang nyata, JWT, refresh token, PostgreSQL 18, serta route guard berbasis role. Seluruh akses frontend dan backend kini mengikuti tiga role aktif, yaitu `superadmin`, `sppg`, dan `validator`.

Role `superadmin` memiliki akses penuh terhadap sistem, role `sppg` berfokus pada operasional dapur dan pengelolaan SPPG, sedangkan role `validator` berfokus pada validasi lapangan, scan AI, input suhu, BAST, dan pelaporan insiden.

Dukungan terhadap role `satgas` dan `siswa` telah dihapus dari konfigurasi aktif, route, permission, dan mekanisme login.

**Status keseluruhan:**

> **FASE 1 — BACKEND AUTH + RBAC: ✅ SELESAI**
> **FASE 2 — FRONTEND GUARD + ROLE UI: ✅ SELESAI**
> **FASE 3 — SCOPING & AUDIT LOG: ⏳ DALAM PENGERJAAN**
