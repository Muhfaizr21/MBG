# Backend API (Golang Clean MVC & SOLID)

Struktur backend ini dirancang menggunakan konsep **MVC (Model-View/Response-Controller)** yang dikombinasikan dengan arsitektur **Clean Code & SOLID Principles**.

---

## 📁 Struktur Folder

```text
backend/
├── config/             # Konfigurasi aplikasi & environment variables
│   └── config.go
├── controllers/        # Presentation / HTTP Handler Layer
│   ├── health_controller.go
│   └── item_controller.go
├── docs/               # Swagger / OpenAPI Generated Documentation
│   ├── docs.go
│   ├── swagger.json
│   └── swagger.yaml
├── middlewares/        # HTTP Middlewares (CORS, Logger, Auth, dll)
│   ├── cors.go
│   └── logger.go
├── models/             # Domain Entities & Request/Response DTOs
│   ├── item.go
│   └── response.go
├── repositories/       # Data Access Layer & Database Contracts
│   └── item_repository.go
├── routes/             # Routing & Endpoint Mapping
│   └── routes.go
├── services/           # Business Logic Layer (Use Cases)
│   ├── item_service.go
│   └── item_service_test.go
├── utils/              # Helper Utility (JSON Responders, etc)
│   └── response.go
├── main.go             # Entry point & Dependency Injection Wiring
├── go.mod              # Go Module definition
└── .gitignore
```

---

## 📖 Swagger UI & API Documentation

Swagger digunakan untuk menghasilkan dokumentasi API interaktif secara otomatis berdasarkan deklarasi komentar kode (annotations).

- **URL Swagger UI**: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)
- **JSON Spec**: `http://localhost:8080/swagger/doc.json`

### Regenerasi Dokumentasi Swagger:
Jika Anda menambah endpoint baru atau mengubah model payload:
```bash
# Pastikan swag CLI berada pada PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Generate ulang folder docs
swag init -g main.go -o ./docs
```

---

## 🧠 Penerapan Prinsip SOLID

1. **Single Responsibility Principle (SRP)**:
   - `models`: Hanya mendefinisikan struktur data domain dan DTO.
   - `repositories`: Bertanggung jawab penuh pada persistensi data (DB / In-Memory).
   - `services`: Khusus menangani aturan bisnis dan validasi data.
   - `controllers`: Hanya mengurus decoding request HTTP dan formatting response.
   - `routes`: Hanya memetakan URL dan middleware ke controller.
   - `middlewares`: Logika terisolasi (CORS, Request Logger).

2. **Open/Closed Principle (OCP)**:
   - Lapisan repository dan service menggunakan `interface`. Jika ingin mengganti penyimpanan ke PostgreSQL, MySQL, atau Redis, cukup buat implementasi baru dari `ItemRepository` tanpa mengubah kode di `ItemService` maupun `ItemController`.

3. **Liskov Substitution Principle (LSP)**:
   - Semua struct yang mengimplementasikan `ItemRepository` dapat saling menggantikan tanpa merusak fungsionalitas service.

4. **Interface Segregation Principle (ISP)**:
   - Interface dibuat spesifik dan ringkas hanya untuk kebutuhan klien modul.

5. **Dependency Inversion Principle (DIP)**:
   - Modul tingkat tinggi (`ItemController`, `ItemService`) bergantung pada abstraksi (`interface`), bukan implementasi konkret.
   - Menggunakan teknik **Constructor Dependency Injection** di `main.go`.

---

## 🚀 Menjalankan Server

```bash
# Masuk ke folder backend
cd backend

# Jalankan server
go run main.go

# Menjalankan unit tests
go test -v ./...
```
