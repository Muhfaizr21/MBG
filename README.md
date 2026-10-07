# MBG

Full-stack application project consisting of a Golang backend (MVC, Clean Code, SOLID, Swagger), a Python AI service (FastAPI + YOLOv8), a React frontend (Vite, Tailwind CSS v4), and an Expo mobile app.

## Project Structure

- **[backend/](backend)**: Golang REST API server built with MVC architecture, Clean Code & SOLID principles, documented with Swagger UI.
- **[backend/ai_service/](backend/ai_service)**: FastAPI AI service for food freshness classification (YOLOv8n-cls `best.pt`, classes `Fresh`/`Spoiled`).
- **[backend/data/](backend/data)**: Dataset files (CSV/JSON/XLSX) downloaded from Google Drive.
- **[frontend/](frontend)**: React + Vite web client styled with Tailwind CSS v4.
- **[mobile/](mobile)**: Expo (React Native) mobile client.

## Quick Start

### Backend
```bash
cd backend
go run main.go
```
- Server: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger/index.html`

### AI Service (required for food scan)
```bash
cd backend
pip install -r requirements.txt
cd ai_service
uvicorn app.main:app --host 127.0.0.1 --port 8083
```
- Health: `http://127.0.0.1:8083/health`
- The gateway reads `AI_BACKEND_URL` (default `http://127.0.0.1:8083`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Dev Client: `http://localhost:5173`

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Food Scan API

`POST /api/scans` (permission `scan.submit`, role `validator`) — multipart: `image` (≤8MB), `qrToken`, optional `holdingTempC`/`releaseTempC`, and `items` (`"Nama:gram,Nama2:gram"`) for nutrition. The Go gateway forwards the image to the AI service, builds a decision card (`layak`/`peringatan`/`tolak`), enriches `macros`/`nutrition[]` from the seeded cuisine dataset (`data/dataset_nutrisi_kasar.csv`), and persists a row in `scan_logs`. `GET /api/scans/recent` returns the latest scan logs; `GET /api/nutrition/items?q=…` searches the dataset (any authenticated user).
