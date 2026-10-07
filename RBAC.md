RENCANA IMPLEMENTASI AUTH & RBAC — KawanGizi (Penyederhanaan 3 Role)Status: Fase 1 (backend) & Fase 2 (frontend) SELESAI — lihat §8.1 catatan eksekusi.Kebijakan Aktif: Konfigurasi sistem hanya menggunakan 3 role aktif: superadmin, sppg, dan validator. Seluruh rute, permission, dan logika penanganan untuk role satgas dan siswa yang sebelumnya ada telah dihapus.Prinsip Utama:Database: PostgreSQL 18 lokal — DB kawangizi, superuser postgres.Scope Eksekusi: Fase 1 (backend auth + RBAC) + Fase 2 (frontend guard + UI penyesuaian role).Akses Hub / Scan: /scan butuh login (validator atau superadmin).Login Enforcement: Akun bertipe Satgas/Siswa lama ditolak oleh server saat login (401 Unauthorized), dan session token lama tidak dapat diperpanjang.1. Sasaran & Ruang LingkupMengubah frontend dari prototipe login dummy ke autentikasi JWT sungguhan dengan cookie refresh token.Mengunci rute-rute terproteksi di frontend (AdminLayout, SppgLayout, ValidatorDashboard) menggunakan route guard berbasis role backend.Menjaga 3 profil utama sebagai fondasi sistem:Superadmin: Pengawasan nasional, audit, kill-switch, & kelola akun.SPPG: Operasional dapur umum, perencanaan gizi AKG, & penerbitan BAST.Validator: Verifikasi AI mutu makanan, input suhu, & serah terima BAST lapangan.2. Daftar Role AktifRole IDLabel TampilanPortal UtamaDeskripsi Hak AksessuperadminSuperadmin / Satgas BGN/admin/*Penuh (all permissions). Dapat membuka & mengaudit portal /sppg/* dan /validator/*.sppgPetugas SPPG / Dapur/sppg/*Operasional dapur, stok bahan, penyusunan menu AKG, & pengiriman BAST.validatorValidator Lapangan / Guru/validator/* & MobilePemindaian mutu AI, input suhu release, BAST penerimaan, & lapor insiden.3. Matriks Permission Server (backend/models/user.go)Hak akses ditetapkan secara eksplisit di server berdasarkan skema berikut:Modul / Permissionsuperadminsppgvalidatorvalidators.manage / validators.readRW--sppg.manage / sppg.readRWR-kitchen.ops (Dapur & Stok)RWRW-scan.submit (Scan AI & Suhu)RW-RWhandover.bast (BAST Serah Terima)RWRWRWincident.submit / feedback.triageRW-RWkillswitch (Tanggap Darurat)RW--4. Peta Route Guard4.1 Frontend Web (frontend/src/App.jsx)Route PrefixAkses RolePerilaku Guard / Catatan/, /fitur, /tentang-kami, /login, /registerPublikBebas diakses tanpa login./scanvalidator, superadminMembutuhkan login; meredirect ke /login jika unauthenticated./admin/*superadminMeredirect sppg ke /sppg & validator ke /validator./sppg/*sppg, superadminMeredirect validator ke portal /validator./validator/*validator, superadminMeredirect sppg ke portal /sppg.4.2 Mobile App (mobile/src/app/)RouteAkses RolePerilaku Guardapp/index.tsxvalidatorBelum login → <Redirect href="/login"/>.app/login.tsxPublikForm login email + password. Hanya menerima role validator.4.3 Backend Endpoints (backend/routes/routes.go)EndpointMethodPermission Required/api/auth/login, /refreshPOSTPublik/api/auth/logout, /mePOST/GETAuthenticated (auth)/api/admin/*GET/POST/PATCHvalidators.manage, sppg.manage, killswitch/api/sppg/*GET/POSTkitchen.ops/api/scansPOSTscan.submit/api/scans/recentGETscan.submit/api/nutrition/itemsGETauth5. Desain Backend & Skema Database5.1 Skema Migrasi (PostgreSQL 18)SQL-- PostgreSQL 18 Schema
CREATE TABLE users (
    id            TEXT PRIMARY KEY,              -- usr-xxxx
    full_name     TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,          -- dipakai login web/mobile
    password_hash TEXT NOT NULL,                 -- bcrypt
    role          TEXT NOT NULL CHECK (role IN ('superadmin', 'sppg', 'validator')),
    npsn          TEXT,                          -- ID Sekolah untuk validator
    school_name   TEXT,
    sppg_id       TEXT,                          -- ID Dapur relasi
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blacklisted', 'pending')),
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
    action      TEXT NOT NULL,                  -- 'validator.blacklist', 'ai.override', 'killswitch.trigger'
    target      TEXT,
    detail      TEXT,
    at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
6. Seed Akun Demo (3 Akun Aktif)EmailPasswordRoleEntitassuperadmin@kawangizi.idSuperAdmin123!superadminSatgas BGN Pusatdapur@sppg01.idSppg123!sppgSPPG 01 Menteng Jayavalidator@sdn01menteng.sch.idValidator123!validatorSDN Menteng 01 Pagi (NPSN: 33210130)7. Penyesuaian Komponen Frontend (frontend/src/)AuthContext.jsx: Memuat profil pengguna (id, name, role, permissions[]) dari GET /api/auth/me.RequireRole.jsx: Komponen pembungkus rute terproteksi. Memeriksa keberadaan token dan kecocokan role.LoginPage.jsx: Mengirim permintaan login ke backend, lalu mengarahkan ke dashboard yang sesuai (/admin, /sppg, atau /validator).AdminLayout.jsx: Mengambil data pengguna secara dinamis dari AuthContext dan menyediakan fungsionalitas tombol Keluar (POST /api/auth/logout).lib/adminActions.js: Fungsi pembantu guardAdminAction(...) untuk memastikan pemanggilan tindakan berisiko (seperti blacklist atau kill-switch) divalidasi oleh hak akses superadmin.8. Ringkasan Status Eksploitasi & Eksekusi┌─────────────────────────────────────────────────────────────────────────┐
│                      RINGKASAN STATUS SPRINT                            │
├──────────────────────────┬──────────────────────────────────────────────┤
│ Modul Backend (Go)       │ ✅ Selesai (Auth, RBAC, Scan AI, Nutrition) │
│ Modul Web Frontend (Vite)│ ✅ Selesai (Guard 3 Role, Cleaned Old Roles) │
│ Modul Mobile (Expo)      │ ✅ Selesai (Auth Context, Validator Sync)    │
│ Database                 │ ✅ Selesai (PostgreSQL 18 Migrated)          │
│ Scoping & Audit Log      │ ⏳ Fase 3 (Dalam Pengerjaan)                 │
└──────────────────────────┴──────────────────────────────────────────────┘