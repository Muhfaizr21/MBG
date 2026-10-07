# RENCANA IMPLEMENTASI AUTH & RBAC — KawanGizi

Status: **Fase 1 (backend) & Fase 2 (frontend) SELESAI** — lihat §8.1 catatan eksekusi.

**Keputusan final (user):**
1. Database: **PostgreSQL 18 lokal** (bukan SQLite) — DB `kawangizi`, superuser `postgres`.
2. Scope eksekusi: **Fase 1 + Fase 2** (backend auth + frontend guard).
3. `/scan`: **butuh login** (validator/superadmin).
4. Satgas di portal `/sppg`: **read-only** (role diizinkan masuk, aksi tulis tetap lewat guard).

---

## 1. Sasaran & Ruang Lingkup

- Mengubah frontend dari prototipe login palsu (`LoginPage.jsx:14,21` — submit apa pun → `/admin`) menjadi autentikasi sungguhan.
- Menambahkan endpoint auth + RBAC di backend Go (saat ini hanya health + item, in-memory).
- Menjaga 3 profil utama `sistem.md` Bab 3.2.1 tetap menjadi dasar pembagian role.

**Tidak** dalam ruang lingkup tahap ini: mobile login biometrik (VALIDATOR.md Bab 6), SSO/Dapodik, pembayaran.

---

## 2. Daftar Role

| # | Role ID | Label | Profil (sistem.md 3.2.1) | Portal |
|---|---------|-------|--------------------------|--------|
| 1 | `superadmin` | Superadmin (Satgas/BGN/Kemenkes) | #2 — tier tertinggi | `/admin/*` |
| 2 | `satgas` | Satgas MBG / Dinas | #2 — pengawas | `/admin/*` |
| 3 | `sppg` | Petugas SPPG / Dapur Umum | #3 — produsen hulu | `/sppg/*` |
| 4 | `validator` | Guru & Staf Sekolah (Validator Lapangan) | #1 — garda terdepan | web `/validator/*` + mobile |
| 5 | `siswa` | Siswa Penerima Manfaat | turunan #1 | mobile (read-only) |

Aturan tier: `superadmin` ⊃ `satgas` (semua permission satgas + permission superadmin). `siswa` hanya permission baca riwayat sendiri.

---

## 3. Matriks Permission

Notasi: `RW` = baca+tulis, `R` = baca saja, `-` = tidak ada, `*` = semua milik / semua entitas.

| Permission | superadmin | satgas | sppg | validator | siswa |
|---|:--:|:--:|:--:|:--:|:--:|
| `dashboard.read` (KPI nasional) | RW | R | R (portal sendiri) | - | - |
| `validators.read` (daftar akun lapangan) | RW | R | - | R (profil sendiri) | - |
| `validators.manage` (whitelist/blacklist/reset device, SUPERADMIN.md:56-57) | **RW** | - | - | - | - |
| `sppg.read` (direktori dapur) | RW | R | R (diri sendiri) | R | - |
| `sppg.manage` (akreditasi, kapasitas) | RW | - | RW (data sendiri) | - | - |
| `deliveries.read` (hasil pindai AI) | RW | R | R (batch sendiri) | R (sekolah sendiri) | - |
| `attendance.read` (porsi vs kehadiran) | RW | R | R | R (sekolah sendiri) | R (riwayat sendiri) |
| `schools.read` | RW | R | R | R (sekolah sendiri) | R |
| `schedule.read` | RW | R | RW (rute armada) | R | - |
| `notices.read` | RW | R | R | R | R |
| `notices.publish` | **RW** | R | - | - | - |
| `calendar.read` | RW | R | R | R | R |
| `reports.download` (BAST, ekspor BGN/BPK) | **RW** | R | R (milik sendiri) | - | - |
| `feedback.triage` (investigasi aduan) | **RW** | RW | R (aduan ke dapur) | RW (buat aduan) | RW (buat aduan) |
| `ai.override` (koreksi hasil AI, SUPERADMIN.md:97) | **RW** | - | - | - | - |
| `payment.clearance` (pencairan dana, SUPERADMIN.md:213) | **RW** | - | - | - | - |
| `killswitch` (bekukan batch, SUPERADMIN.md:232) | **RW** | - | - | - | - |
| `scan.submit` (pindai YOLOv8, VALIDATOR.md Bab 2) | - | - | - | **RW** | - |
| `handover.bast` (serah terima digital, VALIDATOR.md Bab 3) | - | - | R | **RW** | - |
| `incident.submit` (panic button, VALIDATOR.md Bab 4) | RW (eskalasi) | RW (eskalasi) | R | **RW** | **RW** |
| `kitchen.ops` (resep/batch/QC/armada/billing, SPPG.md) | RW | R | **RW** | - | - |
| `users.create` (buat akun role lain) | **RW** | - | - | - | - |

---

## 4. Peta Route Guard

### Frontend web (`frontend/src/App.jsx`)

| Route prefix | Izinkan | Catatan |
|---|---|---|
| `/`, `/fitur`, `/tentang-kami`, `/scan`, `/login`, `/register` | publik | `/scan` butuh login validator/superadmin |
| `/admin` + `/admin/*` (11 halaman, `AdminLayout.jsx:68-78`) | `superadmin`, `satgas` | halaman `/admin/validators` aksi kelola = superadmin saja |
| `/sppg` + `/sppg/*` (10 halaman) | `sppg`, `superadmin`, `satgas` (read-only mode) | |
| `/siswa` + `/siswa/*` (`scans`, `menu`, `presensi`, `notices`, `aduan`) | `siswa`, `superadmin` (preview) | portal siswa `components/layout/SiswaLayout.jsx`; aksi buat aduan pakai `guardAdminAction(..., ['feedback.triage','incident.submit'])` |
| `/validator` + `/validator/*` (`scan`, `handover`, `incidents`, `history`) | `validator`, `superadmin` (preview) | portal validator `components/layout/ValidatorLayout.jsx`; aksi pakai `guardAdminAction(..., ['scan.submit'])` di scan, `[...'handover.bast']` di BAST, `[...'incident.submit']` di insiden |
| selain itu | redirect `/login` | role beda portal → redirect ke portal masing-masing |

### Mobile (`mobile/src/app/`)

| Route | Izinkan |
|---|---|
| `app/index.tsx` (beranda, scanner, handover, incidents, history) | `validator` (mode guru), `siswa` (mode siswa) — gate: belum login → `<Redirect href="/login" />` |
| `app/login.tsx` | publik — email + password ke `POST /api/auth/login`; role selain `validator`/`siswa` ditolak (akun web: superadmin/satgas/sppg) |

Session: access token in-memory (`src/lib/api.ts`, auto-refresh 401 sekali via cookie `kawangizi_refresh`) + hydrate `GET /api/auth/me` saat mount (`context/AuthContext.tsx`). Token tidak persisten (tanpa secure store) — sesi berakhir saat aplikasi ditutup. `context/RoleContext.tsx` memetakan role backend → role tampilan: `validator` → `guru`, `siswa` → `siswa`; profil diambil dari API (fallback mock saat mode pratinjau toggle).

### Backend (`backend/routes/routes.go`)

| Endpoint | Method | Permission |
|---|---|---|
| `/api/auth/login` | POST | publik |
| `/api/auth/logout` | POST | login |
| `/api/auth/refresh` | POST | cookie refresh |
| `/api/auth/me` | GET | login |
| `/api/admin/validators*` | GET/PATCH/POST | `validators.read` / `validators.manage` |
| `/api/admin/sppg*`, `/api/admin/deliveries*`, dst. | GET | permission `*.read` sesuai tabel |
| `/api/sppg/*` (kitchen ops) | GET/POST | `kitchen.ops` |
| `/api/scans` | POST | `scan.submit` (multipart: `image`, `qrToken`, `holdingTempC`, `releaseTempC`, `items`) |
| `/api/scans/recent` | GET | `scan.submit` — riwayat 10 scan terbaru (validator) |
| `/api/nutrition/items` | GET | `auth` — cari bahan di dataset gizi (`q`, `limit`) |
| `/api/items/*` (yang sudah ada) | GET/POST/DELETE | pertahankan, bungkus `auth` + `items.write` |

---

## 5. Desain Backend

### 5.1 Pilihan database: **PostgreSQL 18 (lokal, diputuskan)**

Koneksi via `pgx/v5` pool di `backend/database/database.go`, DSN dari env (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`). Repository pattern mempertahankan OCP: ganti implementasi `UserRepository` untuk pindah ke DB lain. Config juga membaca file `.env` opsional (tanpa override env yang sudah ada).

### 5.2 Skema (migrasi awal)

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- usr-xxxx
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,      -- dipakai login web
  password_hash TEXT NOT NULL,             -- bcrypt
  role          TEXT NOT NULL CHECK (role IN
                ('superadmin','satgas','sppg','validator','siswa')),
  npsn          TEXT,                      -- wajib untuk validator/siswa
  school_name   TEXT,
  sppg_id       TEXT,                      -- relasi ke dapur (validator/sppg)
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','blacklisted','pending')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked    INTEGER DEFAULT 0
);

CREATE TABLE audit_logs (
  id        TEXT PRIMARY KEY,
  actor_id  TEXT NOT NULL,
  action    TEXT NOT NULL,      -- 'validator.blacklist', 'ai.override', ...
  target    TEXT,
  detail    TEXT,
  at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

`audit_logs` wajib untuk aksi superadmin (whitelist/blacklist, override AI, kill-switch) — jejak audit disebut di SUPERADMIN.md.

### 5.3 Endpoint & alur token

- `POST /api/auth/login` → verifikasi bcrypt → **access JWT 15 menit** (header `Authorization: Bearer`) + **refresh token 7 hari** (httpOnly cookie, `SameSite=Lax`, hash disimpan di DB).
- `GET /api/auth/me` → profil + daftar permission (permission di-resolve dari role di server, bukan dikirim dari klien).
- Middleware baru: `middlewares/auth.go` (validasi JWT, inject `userID/role` ke context) dan `middlewares/rbac.go` ( `RequireRole(...)`, `RequirePermission(...)`).
- CORS (`middlewares/cors.go`) harus diubah: `AllowOrigins: http://localhost:5173`, `AllowCredentials: true`.
- Seed 5 akun demo saat DB kosong (lihat §6).

### 5.4 Struktur file backend yang ditambah

```
backend/
├── config/config.go          # + DB_PATH, JWT_SECRET (env)
├── database/database.go      # open SQLite + auto-migrate + seed
├── models/user.go            # User, RefreshToken, AuditLog + Permission
├── repositories/user_repository.go   # interface + sqlite impl
├── services/auth_service.go          # Login/Refresh/Logout/Me + bcrypt
├── services/auth_service_test.go
├── middlewares/auth.go               # JWT parse
├── middlewares/rbac.go               # RequireRole/RequirePermission
├── controllers/auth_controller.go
└── routes/routes.go                  # daftarkan route auth + bungkus RBAC
```

---

## 6. Seed Akun Demo (5 akun)

| Email | Password | Role | NPSN / SPPG |
|---|---|---|---|
| `superadmin@kawangizi.id` | `SuperAdmin123!` | superadmin | — |
| `satgas@kawangizi.id` | `Satgas123!` | satgas | — |
| `dapur@sppg01.id` | `Sppg123!` | sppg | SPPG 01 Menteng Jaya Mandiri |
| `validator@sdn01menteng.sch.id` | `Validator123!` | validator | 33.210.130 — SDN Menteng 01 Pagi |
| `siswa@sdn01menteng.sch.id` | `Siswa123!` | siswa | 33.210.130 — Budi Pratama |

Password seed hanya untuk demo; produksi wajib ganti + pakai `bcrypt` cost ≥ 12.

---

## 7. Desain Frontend

| File (baru/ubah) | Isi |
|---|---|
| `frontend/src/context/AuthContext.jsx` (baru) | state `user {id, name, role, permissions[]}`, `login()`, `logout()`, hydrate dari `GET /api/auth/me` saat mount |
| `frontend/src/lib/api.js` (baru) | fetch wrapper + `credentials: 'include'` + auto-refresh 401 sekali |
| `frontend/src/components/RequireRole.jsx` (baru) | guard: belum login → `/login`, role salah → redirect portal sendiri |
| `frontend/src/App.jsx` (ubah) | bungkus blok `/admin/*` dan `/sppg/*` dengan `RequireRole` |
| `frontend/src/pages/LoginPage.jsx` (ubah) | hapus `setTimeout(() => navigate('/admin'))` (baris 21) → panggil API, redirect per role: `superadmin`/`satgas` → `/admin`, `sppg` → `/sppg/dashboard` |
| `frontend/src/pages/admin/*` | sembunyikan aksi superadmin-only (mis. toggle blacklist di `ValidatorsPage`) jika `role !== 'superadmin'` |
| `frontend/src/components/layout/AdminLayout.jsx` (ubah) | user card hardcoded (baris 552-561) → ambil dari `AuthContext`; tombol logout → `POST /api/auth/logout` |

Mobile (fase lanjutan): ~~`RoleContext.tsx` yang sekarang toggle tanpa login → ganti dengan hasil `GET /api/auth/me`~~ → **selesai** (`mobile/src/context/RoleContext.tsx` derive dari `AuthContext`). ~~Login NPSN + Kode Akses di `app/auth/login.tsx`~~ → **login email + password** ke backend (`mobile/src/app/login.tsx`), karena backend hanya menyediakan `POST /api/auth/login`.

---

## 8. Fase Pengerjaan

### 8.1 Status eksekusi

**Fase 1 — Backend auth core ✅ SELESAI**
1. Dependency: `pgx/v5`, `golang-jwt/jwt/v5`, `golang.org/x/crypto/bcrypt`, `google/uuid`.
2. `database/database.go` — connect + auto-migrate 3 tabel + seed 5 akun (idempoten).
3. `models/user.go` (role → permission matrix), `repositories/user_repository.go` (interface + pgx impl), `services/auth_service.go` (bcrypt + JWT + rotasi refresh token) + unit test di `auth_service_test.go`.
4. `controllers/auth_controller.go` — login/refresh/logout/me + cookie httpOnly `kawangizi_refresh`.
5. `middlewares/auth.go` (JWT → context), `middlewares/rbac.go` (`RequireAuth`, `RequirePermission`, `RequireRole`), `middlewares/cors.go` (credentials, origin whitelist dari `CORS_ORIGINS`).
6. Route: auth publik/terproteksi; `/api/items` baca = login saja, tulis = `kitchen.ops`/`killswitch`.
7. Verifikasi: `go build`, `go vet`, `go test ./...` lulus; uji live — 5 akun login OK (19/12/14/12/6 permissions), tanpa token → 401, kredensial salah → 401, satgas POST/DELETE items → 403, CORS preflight 204 dengan `Allow-Credentials: true`.

**Fase 2 — Frontend auth ✅ SELESAI**
1. `frontend/src/lib/api.js` (fetch wrapper, auto-refresh 401 sekali, `ROLE_HOME`), `context/AuthContext.jsx` (hydrate `/api/auth/me`, `login/logout/can`).
2. `pages/LoginPage.jsx` → API sungguhan, redirect per role, pesan error nyata.
3. `components/RequireRole.jsx` + guard di `App.jsx`: `/admin/*` (superadmin|satgas), `/sppg/*` (sppg|superadmin|satgas), `/scan` (validator|superadmin).
4. `AdminLayout.jsx`: user card dari context, tombol **Keluar** → `POST /api/auth/logout`.
5. Aksi superadmin-only: `lib/adminActions.js` (`guardAdminAction(user, label, action, payload, anyOfPerms)`) — superadmin lolos, role lain lolos hanya bila memegang salah satu permission di `anyOf`; dipakai di 10 halaman `/admin/*`. Tiap handler panel (`components/dashboard/*Panel.jsx`) memanggil guard di **awal** handler dan `return` bila `allowed === false`, sehingga efek mock dibatalkan (toast sukses palsu & mutasi state tidak terjadi).
6. Satgas read-only di `/sppg`: `SppgLayout.jsx` mendeteksi `user.role === 'satgas'`, menampilkan banner Mode Read-Only dan membungkus konten dengan `pointer-events-none select-none` — aksi tulis panel SPPG nonaktif.
7. `feedback.triage` dimiliki satgas → di `FeedbackPage` guard mengizinkan `CREATE_TICKET`/`CLOSE_TICKET` untuk satgas; `EXECUTE_KILL_SWITCH` tetap superadmin (`killswitch`).
8. Verifikasi: `npm run lint` (tanpa error), `npm run build` sukses; smoke live login satgas (13 perms) & sppg (14 perms) OK.
9. **Portal siswa** (`/siswa/*`, SELESAI): 6 halaman — beranda (`components/siswa/SiswaBerandaTab.jsx`), riwayat scan porsi (`pages/siswa/SiswaScansPage.jsx`), menu & gizi AKG, presensi makan, pengumuman (read-only `notices.read`), aduan (`feedback.triage`+`incident.submit` via `guardAdminAction`). Data mock di `data/siswaData.js` (10 catatan scan termasuk 1 boks ditaham diganti, MEAL_LOG, MY_TICKETS). `ROLE_HOME.siswa = '/siswa'`.
10. **Portal validator web** (`/validator/*`, SELESAI): 5 halaman — beranda armada/HACCP countdown/kuota/menu+alergen (`pages/validator/ValidatorDashboardPage.jsx`), pemindai AI dual-stage + kartu keputusan mutu (`ValidatorScanPage.jsx`), serah terima BAST: 13 master tote + suhu holding + 2 tanda tangan SVG (`ValidatorHandoverPage.jsx`), lapor insiden cepat + protokol + pelacak tiket (`ValidatorIncidentsPage.jsx`), riwayat pindai + rekonsiliasi kelas + alokasi surplus + ekspor (`ValidatorHistoryPage.jsx`). Guard `['validator','superadmin']` di `App.jsx`; aksi tulis via `guardAdminAction(..., ['scan.submit'])`, `['handover.bast']`, `['incident.submit']`, `['attendance.read']`. Data mock di `data/validatorData.js`. `ROLE_HOME.validator = '/validator'` (sebelumnya `/scan`).

**Fase 3 — Data pendukung (BELUM)**
1. Endpoint baca per portal (`/api/admin/*`, `/api/sppg/*`) dengan filter scope (satgas lihat semua, sppg/validator lihat miliknya — klausa `WHERE sppg_id = ...` / `npsn = ...`).
2. Tabel `audit_logs` sudah dibuat di migrasi, tetapi penulisan log aksi superadmin belum diimplementasi.

**Fase 4 — Mobile login ✅ SELESAI (login akun; fitur mobile existing tetap mock)**
1. `src/lib/api.ts` — API client: `API_BASE` dari `Constants.expoConfig.hostUri` (emulator `10.0.2.2`/LAN/web), access token in-memory, auto-refresh 401 sekali, `loginRequest/meRequest/logoutRequest/bootstrapSession`.
2. `src/context/AuthContext.tsx` — `AuthProvider` + `useAuth` (`user`, `permissions`, `loading`, `login`, `logout`); mount → `bootstrapSession()`; hanya role `validator`/`siswa` yang diterima, selain itu login ditolak + cookie dibersihkan.
3. `src/app/login.tsx` — layar email + password (amber `#EBA338`), pesan error, tombol isi-otomatis 2 akun demo; sudah login → `<Redirect href="/" />`.
4. Gate `src/app/index.tsx` — `loading` → spinner, `!user` → `<Redirect href="/login" />`; `AuthProvider` membungkus `RoleProvider` di `_layout.tsx`.
5. `src/context/RoleContext.tsx` — role backend `validator` → mode `guru`, `siswa` → `siswa`; profil (nama/NPSN/sekolah/SPPG) dari API, mock hanya untuk pratinjau toggle (state disimpan bersama `ownerId` sesi — reset otomatis saat ganti akun, tanpa effect).
6. Header dashboard (`GuruDashboardView`, `SiswaDashboardView`) memakai `useAuthRole().user`; `ProfileTabContent` menampilkan email akun + tombol **Keluar** → `POST /api/auth/logout`.
7. CORS default backend kini menyertakan `http://localhost:8081` & `http://127.0.0.1:8081` (Expo web).
8. Verifikasi: `npx tsc --noEmit` lulus, `npx expo lint` 0 error, `npm run check` 5 OK, `npx expo export --platform android` sukses (Hermes 6.2MB); uji live login `validator@sdn01menteng.sch.id` → 200 (12 permissions) & `GET /api/auth/me` → 200.

**Fitur scan backend (YOLOv8) ✅ SELESAI**
1. AI service Python (FastAPI, `:8083`) di `backend/ai_service/` — model `backend/model_ai/yolov8_cls_best.pt` (klasifikasi biner `Fresh`/`Spoiled`), endpoint `/health` + `/predict`.
2. Backend Go: `POST /api/scans` (multipart `image` 8MB + `qrToken` + suhu) → gateway memanggil AI service → kartu keputusan mutu (`layak`/`peringatan`/`tolak`, ambang 95/80, suhu 75°C/60°C) → simpan `scan_logs`; `GET /api/scans/recent` riwayat validator. Kedua route dibungkus `scan.submit` (superadmin tidak punya — sesuai matriks §3).
3. Frontend `ValidatorScanPage.jsx` & mobile `ScannerScreen.tsx` terhubung API (multipart via `scanRequest`), fallback ke data simulasi bila AI service offline.
4. Verifikasi: `go vet`/`go test` lulus, `npm run lint` + `npx tsc --noEmit` + `npx expo lint` lulus, uji live E2E (login validator → POST `/api/scans` → 200 + baris `scan_logs` terisi; siswa 403; tanpa token 401).

**Fitur makronutrien dari dataset gizi ✅ SELESAI**
1. Dataset `backend/data/dataset_nutrisi_kasar.csv` (~1,3 ribu baris: `Calories, Proteins, Fat, Carbohydrate, Name`) di-seed ke tabel `nutrition_items` saat boot (idempoten, `NUTRITION_DATA_PATH`).
2. `POST /api/scans` menerima `items` ("Nama:gram,Nama2:gram"). Gateway cocokkan tiap bahan ke dataset (token overlap + alias + pecah nama majemuk seperti "Timun & Selada"), hitung makro per bobot, dan menambah `macros` (energy/protein/carbs/fat — tanpa serat), `nutrition[]` (nama → matchedTo + berat, dapat dikunci ke kelas menu), serta `nutritionNote` di kartu keputusan bila ≥1 bahan cocok. Tidak tersimpan di `scan_logs` (response-only).
3. `GET /api/nutrition/items?q=…` untuk pencarian bahan (dipakai frontend; route `auth`).
4. UI: kartu makro web & mobile memakai `macros` dari backend (fallback ke perkiraan lokal saat offline); baris serat dihapus dari tampilan makro (dataset tidak punya kolom serat).
5. Verifikasi: `go test ./services` (12 test, termasuk `ParseItems`/`MatchItems` alias+skala+bahan tak cocok) + E2E live: scan dgn `items` → `macros` terisi, `nutrition` 5/5 cocok, skor/verdict tetap (`layak` 99.6).

**Fase 5 — Mobile fitur dari API (BELUM, opsional)**
1. Fitur mobile (BAST/insiden/riwayat) masih data mock; endpoint `/api/scans` **sudah tersedia** — `ScannerScreen` sudah memanggilnya (fallback skenario simulasi saat error/offline); masih butuh `/api/handover/*`, `/api/incidents/*` + offline queue.
2. Persistensi sesi via secure store (`expo-secure-store`) agar tidak login ulang tiap aplikasi dibuka.

### 8.2 Cara menjalankan

```bash
# Backend (butuh PostgreSQL jalan + DB kawangizi)
cd backend
go run .                      # http://localhost:8080

# Frontend
cd frontend
npm run dev                   # http://localhost:5173
```

Env opsional backend: `PORT`, `APP_ENV`, `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME/DB_SSLMODE`, `JWT_SECRET`, `JWT_ACCESS_TTL_MINUTES`, `JWT_REFRESH_TTL_HOURS`, `CORS_ORIGINS` — bisa juga lewat file `backend/.env` (gitignored).

---

## 9. Risiko & Follow-up

1. ~~**DB**: SQLite vs PostgreSQL~~ → **PostgreSQL** (diputuskan & diimplementasi).
2. ~~**Scope fase**~~ → **Fase 1+2** (diselesaikan).
3. ~~**`/scan` web**~~ → **butuh login validator** (diterapkan di `App.jsx`).
4. ~~**Satgas di portal SPPG**~~ → **read-only diizinkan** (guard role masuk; aksi tulis frontend tetap superadmin/sppg via `guardAdminAction`).
5. Sisa: implementasi Fase 3 (data scope per portal + audit log) dan Fase 5 (fitur mobile dari API).
6. `JWT_SECRET` masih default dev — ganti via env sebelum demo produksi.
