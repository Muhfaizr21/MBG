# Rencana: Backend Scan Makanan (AI YOLOv8n-cls dari Google Drive)

## Tujuan
Menghadirkan endpoint scan makanan backend yang memakai **model yang sudah ditraining**:
YOLOv8n-cls `weights/best.pt` dari folder Drive `freshness_cls_model-12`
(folder publik, download tanpa login via `uc?export=download&id=...`).

Keputusan user:
1. Model: **YOLOv8n-cls `best.pt` dari Drive** (file id `18550uQwWRlhGaZtfag-oLOH-7svotjKa`).
2. Scope: **Backend API + integrasi web + mobile**.
3. Pemetaan: **kelas `fresh_*` → layak, kelas `stale_*` → ditolak** (skor = confidence → 0–100).

## Fakta kunci (hasil investigasi)
- Run training: `task: classify`, `model: yolov8n-cls.pt`, `imgsz: 224`, `epochs: 20`,
  `device: cpu`, nama run `freshness_cls_model-12`, data `dataset_yolo_fix`.
- Python 3.14.4. **TensorFlow tidak punya wheel cp314** → `.keras` lokal tidak bisa diload
  di mesin ini. **torch 2.14.1 + torchvision 0.29.1 punya wheel `cp314` win_amd64**.
  `ultralytics` 8.4.173 pure-python. `onnxruntime` cp314 ada (tidak dipakai).
- Backend Go belum punya endpoint scan. Ada `middlewares.RequirePermission(models.PermScanSubmit)`
  dan `PermScanSubmit` sudah ada di RBAC (role validator). Rute terdaftar di `routes/routes.go`.
- Database memakai pgx, skema di `database/database.go` (users, refresh_tokens, audit_logs).
- Web `ValidatorScanPage.jsx` memakai data mock `SCAN_SAMPLE_RESULTS`; `lib/api.js` memaksa
  `Content-Type: application/json` (perlu dukungan FormData). Mobile `ScannerScreen.tsx` memakai
  mock `scenario` + `decideQuality`; `api.ts` sama-sama JSON-only.
- Risiko kecil: daftar nama kelas YOLO belum terlihat; diadaptasi saat `best.pt` diload
  (`model.names`). Asumsi konsisten dengan dataset 12 kelas fresh/stale (apple, banana,
  bitter_gourd, capsicum, orange, tomato). Pemetaan disentralisasi di scan_service.go agar
  mudah disesuaikan.

## Arsitektur (selaras sistem.md: Golang gateway + Python AI service)
`POST /api/scans` (Go, RBAC) → meneruskan gambar ke FastAPI AI service (`:8083`) →
Go menyusun kartu keputusan mutu → simpan `scan_logs` → balas frontend/mobile.

Port: Go 8080, mobile dev 8081, tes 8082, **AI service 8083** (internal).

## Langkah 0 — Unduh data Drive (CSV/JSON/XLSX/TXT) ke `backend/data/`
Folder sumber (publik): `https://drive.google.com/drive/folders/1x5ZEu2BoLQYk6WdzbfpOOx6CuU0IcWJP` (DATASET_KAWANGIZI).
Hanya **file data** (bukan sub-folder dataset gambar). ID sudah diekstrak dari HTML publik folder:

| File | Drive ID |
|---|---|
| dataset_kesimpulan_train.json | `1IspGtM6dlHgMZHbGXJpceGZvlcBfKZOZ` |
| dataset_nutrisi_kasar.csv | `1qJd8dgWLwyB60Co5tzhpGtQCVDEnAfe9` |
| dataset_nutrisi_train.json | `1-xTvIG7ZqANh-FOMOC_Tbq-u865OtI3V` |
| food_spoilage.csv | `1GMkM-xrEFdz0aZ-gomHLR0wUrnMFUr4i` |
| Jumlah Siswa SMA-MA-SMK ... MBG Kab Pati 2025.json | `1iysBeV1tyk-46eAW7HL1k4UddRZYnfHI` |
| jumlah Siswa SMP-MTs ... MBG Kab Pati 2025.json | `1cRBz2Y9gRq76weY5K8b2XoYotixSPhJx` |
| jumlah-siswa-sd-mi-sederajat-...-pati-2025.xlsx | `1Si-_O2c4N07tNHVmpgtGQiL1B4gFfcOH` |
| nilai-gizi.csv | `1prIAVNfoSy50Uy3xLyPUf_G_SBvuK_rR` |
| sppg_operasional.csv (4,2 MB) | `1oNBSy5Nj9Q6lR6kPv9iAiZeYLKbP0Dzf` |

- Skrip `backend/data/download_datasets.py`: map ID→nama di-hardcode; GET
  `https://drive.google.com/uc?export=download&id=<id>` (handle redirect
  `drive.usercontent.google.com` + confirm token, sama seperti unduh `best.pt`); simpan ke
  `backend/data/`; skip jika sudah ada dan ukuran > 0.
- Fallback deteksi file baru: parse HTML folder publik (`data-id` + `data-tooltip`),
  filter ekstensi `.csv/.json/.xlsx/.txt` — tanpa OAuth (folder terbuka untuk siapa saja).
- Tidak mengunduh sub-folder (dataset_food101_fix, mbg_food_dataset, runs_yolo, dll).

## Langkah 1 — AI Service Python (`backend/ai_service/`)
- Perbarui `backend/requirements.txt`: hapus `tensorflow==2.20.0`; tambah
  `torch==2.14.1`, `torchvision==0.29.1`, `ultralytics==8.4.173`, `httpx`, `pytest`.
- Script unduh model `backend/model_ai/download_yolov8.py`:
  GET `https://drive.google.com/uc?export=download&id=18550uQwWRlhGaZtfag-oLOH-7svotjKa`
  → simpan `backend/model_ai/yolov8_cls_best.pt` (2,964,808 byte). Handle redirect
  `drive.usercontent.google.com` (sudah dipastikan jalan, Keep-Alive + UA).
- `backend/ai_service/app/main.py` (FastAPI):
  - Startup: `YOLO(model_path)` + `model.names` di-cache.
  - `POST /predict` (multipart `image`): decode `np.frombuffer`/`cv2.imdecode`,
    `model.predict(img, imgsz=224)`; respon JSON:
    `{ class_name, class_id, confidence, class_probabilities: {label: prob}, latency_ms }`.
  - Jalankan `uvicorn app.main:app --port 8083`.
- Instal: `pip install -r backend/requirements.txt` (py3.14, torch wheel tersedia).

## Langkah 2 — Backend Go
- `config/config.go`: tambah `AIBackendURL` dari env `AI_BACKEND_URL`, default
  `http://127.0.0.1:8083`.
- `models/scan.go` (baru): `ScanLog`, `ScanResult`, `ScanSubmitRequest` (parsed di controller).
- `database/database.go`: tambah tabel `scan_logs`
  (id, box_id, qr_token, batch_id, image_ref, ai_class, ai_confidence, visual_score,
  holding_temp_c, release_temp_c, verdict, reason, actor_id, created_at).
- `repositories/scan_repository.go` (baru): `InsertScan`, `ListRecentScans` (pgx).
- `services/scan_service.go` (baru):
  - `Predict(ctx, imageBytes, fileName) (Prediction, error)` — POST `/predict` ke AI service.
  - `SubmitScan(ctx, actorID, imageBytes, fileName, qrToken, holdingTempC, releaseTempC)`:
    - Qr check format `MBG-...` & konsistensi token → `qrValid`.
    - Map kelas: `fresh_*`/`stale_*` → `visualScore` (0–100).
    - Verdict: QR invalid → `ditolak`; score ≥95 `layak`; ≥80 `waspada`; else `ditolak`
      (setara `utils/quality.ts` mobile).
    - Insert `scan_logs`, return `ScanResult`.
- `controllers/scan_controller.go` (baru): `POST /api/scans` — `r.ParseMultipartForm`,
  ambil file `image` (wajib) + field `qrToken`,`holdingTempC`,`releaseTempC` opsional,
  `middlewares.UserID(r.Context())` sebagai actor, `utils.Success` dengan `ScanResult`.
- `routes/routes.go`: `mux.Handle("POST /api/scans",
  middlewares.RequirePermission(models.PermScanSubmit)(http.HandlerFunc(scanCtrl.Submit)))`
  + `GET /api/scans/recent` (opsional, validator).
- `main.go`: wire ScanService + ScanController; tambah AI config pass.

## Langkah 3 — Integrasi Frontend web
- `frontend/src/lib/api.js`: support body FormData (kalau `body instanceof FormData`,
  JANGAN set `Content-Type: application/json`; biar browser set boundary). Tambah
  `scanRequest(imageFile, { qrToken, holdingTempC })` → `api('/api/scans', {method:'POST', body}, {multipart})`.
- `ValidatorScanPage.jsx`: ganti simulasi `SCAN_SAMPLE_RESULTS` dengan pemanggilan nyata
  saat tahap scan; render `ScanResult` (id, boxId, score, verdict `layak|peringatan|tolak`,
  verdictLabel, checks, note, macros). Fallback ke mock lama jika AI service unreachable
  (demo tetap jalan).

## Langkah 4 — Integrasi Mobile
- `mobile/src/lib/api.ts`: tambah `scanRequest(uri)` → FormData
  (`{ uri, name, type: 'image/jpeg' }`), header Auth saja (jangan JSON). Cabang multipart di `api()`.
- `ScannerScreen.tsx`: setelah kamera menghasilkan `capturedPhoto.uri`, panggil `scanRequest`
  → pakai hasil backend untuk `detectionResult`/`score`/`verdict` pada `decideQuality`.
  Fallback ke mock `scenario` saat error/offline.

## Langkah 5 — Verifikasi
0. `python backend/data/download_datasets.py` → 9 file ada di `backend/data/`, ukuran > 0,
   `dataset_nutrisi_train.json` valid JSON, `nilai-gizi.csv` terbaca pandas.
1. `pip install -r backend/requirements.txt` sukses (torch cp314 terinstall).
2. Jalankan AI service `:8083`; uji `curl -F image=@sample.jpg :8083/predict` → JSON valid,
   `class_name` salah satu dari `model.names`.
3. `go vet`, `go test ./...`.
4. Jalankan Go `:8080`; login validator (`validator@sdn01menteng.sch.id`);
   `curl -H "Authorization: Bearer ..." -F image=@sample.jpg -F qrToken=MBG-... :8080/api/scans`
   → 200 `ScanResult`; cek baris `scan_logs` terisi.
5. `npm run lint` frontend; `npx expo lint` + `npx tsc --noEmit` mobile.
6. Uji web scan (port 5173) & mobile scan (8081) secara fungsional.

## Dokumentasi
- Perbarui `RBAC.md` (endpoint scan), Swagger comment di controller, `backend/requirements.txt`.
- Catatan: `.keras`/`list_drive_folders.py`/credentials biarkan tidak digunakan (keterangan di
  README/rencana).

## Risiko / catatan
- Beyond-cadence: memuat model penuh pertama kali di `:8083` ± detik; hasil pertama lambat
  hanya saat startup.
- Jika `model.names` tidak 12 kelas fresh/stale, sesuaikan fungsi mapping di
  `scan_service.go` (satu titik).
- Torch → RAM terpakai ± 100–300MB di proses Python; tidak mengganggu Go.