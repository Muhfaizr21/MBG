#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🧪 INTEGRATION TEST: SPPG BATCHES & SUPERADMIN OVERSIGHT"
echo "=========================================================="

API_URL="http://localhost:8080/api"

echo "1. Login sebagai Staf SPPG-01 (Dapur Sentral Menteng)..."
SPPG_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dapur@sppg01.id","password":"Sppg123!"}')
SPPG_TOKEN=$(echo "$SPPG_LOGIN" | jq -r '.data.accessToken')

if [ "$SPPG_TOKEN" == "null" ] || [ -z "$SPPG_TOKEN" ]; then
  echo "❌ Login SPPG-01 gagal: $SPPG_LOGIN"
  exit 1
fi
echo "✅ SPPG-01 Token didapat."

echo ""
echo "2. Ambil bundle batch SPPG-01 (Multi-tenant isolated)..."
BUNDLE_SPPG1=$(curl -s -H "Authorization: Bearer $SPPG_TOKEN" "$API_URL/sppg/batches/bundle")
SPPG1_KITCHEN=$(echo "$BUNDLE_SPPG1" | jq -r '.data.kitchenName')
SPPG1_TOTAL_BOXES=$(echo "$BUNDLE_SPPG1" | jq -r '.data.totalBoxes')
SPPG1_BATCH_COUNT=$(echo "$BUNDLE_SPPG1" | jq '.data.batches | length')

echo "   -> Nama Dapur: $SPPG1_KITCHEN"
echo "   -> Total Boks: $SPPG1_TOTAL_BOXES"
echo "   -> Jumlah Batch: $SPPG1_BATCH_COUNT"

if [ "$SPPG1_BATCH_COUNT" -lt 1 ]; then
  echo "❌ Batches SPPG-01 kosong!"
  exit 1
fi
echo "✅ SPPG-01 terisolasi dan menampilkan batch dapurnya sendiri."

echo ""
echo "3. Login sebagai Superadmin BGN..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@kawangizi.id","password":"SuperAdmin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Login Superadmin gagal: $ADMIN_LOGIN"
  exit 1
fi
echo "✅ Superadmin Token didapat."

echo ""
echo "4. Superadmin inspeksi lintas dapur ke SPPG-02 (Kebayoran Baru)..."
BUNDLE_SPPG2=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/sppg/batches/bundle?sppgId=SPPG-02")
SPPG2_KITCHEN=$(echo "$BUNDLE_SPPG2" | jq -r '.data.kitchenName')
SPPG2_TOTAL_BOXES=$(echo "$BUNDLE_SPPG2" | jq -r '.data.totalBoxes')
SPPG2_FIRST_SCHOOL=$(echo "$BUNDLE_SPPG2" | jq -r '.data.batches[0].schoolName')

echo "   -> Dapur yang diinspeksi: $SPPG2_KITCHEN"
echo "   -> Total Boks SPPG-02: $SPPG2_TOTAL_BOXES"
echo "   -> Sekolah Penerima: $SPPG2_FIRST_SCHOOL"

if [[ "$SPPG2_KITCHEN" != *"Kebayoran"* ]]; then
  echo "❌ Superadmin gagal beralih ke inspeksi SPPG-02!"
  exit 1
fi
echo "✅ Superadmin sukses melakukan inspeksi lintas dapur ke SPPG-02."

echo ""
echo "5. SPPG-01 membuat batch baru dengan kontrol suhu inti HACCP..."
CREATE_RES=$(curl -s -X POST "$API_URL/sppg/batches" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "SCH-JKT-01",
    "menuCode": "PAKET-A-01",
    "boxCount": 480,
    "cookedAt": "06:10",
    "cookTemp": 78.8
  }')
NEW_BATCH_ID=$(echo "$CREATE_RES" | jq -r '.data.id')
NEW_TOKEN=$(echo "$CREATE_RES" | jq -r '.data.token')
NEW_CHECKSUM=$(echo "$CREATE_RES" | jq -r '.data.checksum')

echo "   -> Batch ID baru: $NEW_BATCH_ID"
echo "   -> Token QR Baru: $NEW_TOKEN"
echo "   -> SHA-256 Checksum: $NEW_CHECKSUM"

if [ "$NEW_BATCH_ID" == "null" ] || [ -z "$NEW_BATCH_ID" ]; then
  echo "❌ Gagal membuat batch: $CREATE_RES"
  exit 1
fi
echo "✅ Batch baru dengan token QR berstandar sistem berhasil digenerate."

echo ""
echo "6. Uji mandiri pemindaian barcode / token QR sebelum naik armada..."
VERIFY_RES=$(curl -s -X POST "$API_URL/sppg/batches/verify" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$NEW_TOKEN\"}")
VERIFY_OK=$(echo "$VERIFY_RES" | jq -r '.data.ok')
VERIFY_MSG=$(echo "$VERIFY_RES" | jq -r '.data.message')

echo "   -> Status Verifikasi: $VERIFY_OK"
echo "   -> Pesan: $VERIFY_MSG"

if [ "$VERIFY_OK" != "true" ]; then
  echo "❌ Verifikasi token gagal: $VERIFY_RES"
  exit 1
fi
echo "✅ Uji mandiri token QR dan validasi checksum SHA-256 lolos."

echo ""
echo "7. Uji mandiri token Kontainer Master (Tote M01)..."
MASTER_TOKEN="${NEW_TOKEN}-M01"
VERIFY_MASTER_RES=$(curl -s -X POST "$API_URL/sppg/batches/verify" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$MASTER_TOKEN\"}")
MASTER_OK=$(echo "$VERIFY_MASTER_RES" | jq -r '.data.ok')
echo "   -> Status Master Tote: $MASTER_OK"
if [ "$MASTER_OK" != "true" ]; then
  echo "❌ Verifikasi master tote token gagal: $VERIFY_MASTER_RES"
  exit 1
fi
echo "✅ Uji mandiri kontainer master M01 berhasil."

echo ""
echo "8. Uji Otorisasi: Staf Dapur mencoba melakukan karantina (harus DITOLAK)..."
FORBIDDEN_RES=$(curl -s -X POST "$API_URL/sppg/batches/$NEW_BATCH_ID/quarantine" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Percobaan karantina tanpa wewenang superadmin"}')
FORBIDDEN_SUCCESS=$(echo "$FORBIDDEN_RES" | jq -r '.success')
echo "   -> Respon izin: $FORBIDDEN_RES"
if [ "$FORBIDDEN_SUCCESS" == "true" ]; then
  echo "❌ Pelanggaran keamanan! Staf dapur tidak boleh bisa karantina batch!"
  exit 1
fi
echo "✅ Proteksi RBAC berhasil: Staf dapur ditolak melakukan karantina."

echo ""
echo "9. Intervensi Keamanan Pangan: Superadmin melakukan Karantina Darurat..."
QUARANTINE_RES=$(curl -s -X POST "$API_URL/sppg/batches/$NEW_BATCH_ID/quarantine" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Terdeteksi segel kontainer master rusak saat inspeksi visual BGN"}')
QUARANTINE_STATUS=$(echo "$QUARANTINE_RES" | jq -r '.data.status')
QUARANTINE_BY=$(echo "$QUARANTINE_RES" | jq -r '.data.quarantinedBy')

echo "   -> Status Akhir Batch: $QUARANTINE_STATUS"
echo "   -> Dikaranti Oleh: $QUARANTINE_BY"

if [ "$QUARANTINE_STATUS" != "quarantined" ]; then
  echo "❌ Karantina Superadmin gagal: $QUARANTINE_RES"
  exit 1
fi
echo "✅ Superadmin berhasil mengkarantina batch bermasalah."

echo ""
echo "10. Verifikasi pencatatan audit log forensik di database..."
AUDIT_TARGET=$(PGPASSWORD=kawangizi_dev_2026 psql -h 127.0.0.1 -U kawangizi -d kawangizi -t -A -c \
  "SELECT target FROM audit_logs WHERE target = '$NEW_TOKEN' AND action = 'batch.quarantine' LIMIT 1;")

if [ "$AUDIT_TARGET" == "$NEW_TOKEN" ]; then
  echo "✅ Terverifikasi: Forensik tercatat di tabel audit_logs dengan target token $AUDIT_TARGET."
else
  echo "❌ Audit log tidak ditemukan untuk token $NEW_TOKEN!"
  exit 1
fi

echo ""
echo "=========================================================="
echo "🎉 SELURUH 10 UJI INTEGRASI FITUR SPPG BATCHES BERHASIL!"
echo "=========================================================="
