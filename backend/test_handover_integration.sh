#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "📦 INTEGRATION TEST: SPPG HANDOVER & BAST DIGITAL"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f "$SCRIPT_DIR/database/seed_sppg_handover.sql" > /dev/null 2>&1

# 1. Login SPPG 01
echo -e "\n1. Authenticating as SPPG 01 (dapur@sppg01.id)..."
SPPG_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dapur@sppg01.id","password":"Sppg123!"}')

SPPG_TOKEN=$(echo "$SPPG_LOGIN_RES" | jq -r '.data.accessToken // empty')
if [ -z "$SPPG_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get SPPG token: $SPPG_LOGIN_RES${NC}"
  exit 1
fi
echo -e "${GREEN}✓ SPPG Token obtained.${NC}"

# 2. Login Superadmin
echo -e "\n2. Authenticating as Superadmin (superadmin@kawangizi.id)..."
ADMIN_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@kawangizi.id","password":"SuperAdmin123!"}')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RES" | jq -r '.data.accessToken // empty')
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get Admin token: $ADMIN_LOGIN_RES${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin Token obtained.${NC}"

# 3. SPPG 01 Handover Bundle Fetch
echo -e "\n3. Testing GET /sppg/handover/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/handover/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  SAFETY_STOCK=$(echo "$BUNDLE_RES" | jq -r '.data.safetyStock')
  TOTAL_SENT=$(echo "$BUNDLE_RES" | jq -r '.data.totals.sent')
  TOTAL_ACCEPTED=$(echo "$BUNDLE_RES" | jq -r '.data.totals.accepted')
  TOTAL_ISSUED=$(echo "$BUNDLE_RES" | jq -r '.data.totals.issued')
  COUNT=$(echo "$BUNDLE_RES" | jq -r '.data.totals.count')
  echo -e "${GREEN}✓ Bundle fetched successfully: Kitchen=$KITCHEN_NAME, SafetyStock=$SAFETY_STOCK, Sent=$TOTAL_SENT, Accepted=$TOTAL_ACCEPTED, BAST Issued=$TOTAL_ISSUED, Count=$COUNT.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Multi-Tenant isolation: SPPG 01 cannot access SPPG-02 data
echo -e "\n4. Testing Multi-Tenant isolation (SPPG 01 passing ?sppgId=SPPG-02)..."
ISOLATION_RES=$(curl -s -X GET "$BASE_URL/sppg/handover/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $SPPG_TOKEN")

FETCHED_SPPG=$(echo "$ISOLATION_RES" | jq -r '.data.sppgId')
if [ "$FETCHED_SPPG" = "SPPG-01" ]; then
  echo -e "${GREEN}✓ Multi-tenancy locked: SPPG 01 cannot bypass tenant (got $FETCHED_SPPG).${NC}"
else
  echo -e "${RED}❌ Tenant leak detected: SPPG 01 received $FETCHED_SPPG${NC}"
  exit 1
fi

# 5. Superadmin Cross-Kitchen Inspection
echo -e "\n5. Testing Superadmin inspection for SPPG-02..."
ADMIN_SPPG2_RES=$(curl -s -X GET "$BASE_URL/sppg/handover/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

ADMIN_SPPG2_ID=$(echo "$ADMIN_SPPG2_RES" | jq -r '.data.sppgId')
ADMIN_SPPG2_STOCK=$(echo "$ADMIN_SPPG2_RES" | jq -r '.data.safetyStock')
if [ "$ADMIN_SPPG2_ID" = "SPPG-02" ]; then
  echo -e "${GREEN}✓ Superadmin successfully inspected SPPG-02 (Safety stock=$ADMIN_SPPG2_STOCK).${NC}"
else
  echo -e "${RED}❌ Superadmin failed to inspect SPPG-02: $ADMIN_SPPG2_RES${NC}"
  exit 1
fi

# 6. Advance Stage: menunggu -> tiba -> memindai
echo -e "\n6. Testing Stage Transition on ho-04-sppg01 (menunggu -> tiba -> memindai)..."
TIBA_RES=$(curl -s -X PATCH "$BASE_URL/sppg/handover/ho-04-sppg01/stage" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"tiba"}')

TIBA_STAGE=$(echo "$TIBA_RES" | jq -r '.data.stage')
if [ "$TIBA_STAGE" = "tiba" ]; then
  echo -e "${GREEN}✓ Advance to tiba passed.${NC}"
else
  echo -e "${RED}❌ Advance to tiba failed: $TIBA_RES${NC}"
  exit 1
fi

MEMINDAI_RES=$(curl -s -X PATCH "$BASE_URL/sppg/handover/ho-04-sppg01/stage" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"memindai","scanned":50}')

MEMINDAI_STAGE=$(echo "$MEMINDAI_RES" | jq -r '.data.stage')
MEMINDAI_SCANNED=$(echo "$MEMINDAI_RES" | jq -r '.data.scanned')
if [ "$MEMINDAI_STAGE" = "memindai" ] && [ "$MEMINDAI_SCANNED" -eq 50 ]; then
  echo -e "${GREEN}✓ Advance to memindai passed (scanned=$MEMINDAI_SCANNED).${NC}"
else
  echo -e "${RED}❌ Advance to memindai failed: $MEMINDAI_RES${NC}"
  exit 1
fi

# 7. Finish Scan (Sahkan Penuh): ho-02-sppg01
echo -e "\n7. Testing Finish Scan (Sahkan Penuh) on ho-02-sppg01..."
FINISH_RES=$(curl -s -X POST "$BASE_URL/sppg/handover/ho-02-sppg01/finish-scan" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"perfect":true}')

FINISH_STAGE=$(echo "$FINISH_RES" | jq -r '.data.stage')
FINISH_SCANNED=$(echo "$FINISH_RES" | jq -r '.data.scanned')
FINISH_SENT=$(echo "$FINISH_RES" | jq -r '.data.sent')
if [ "$FINISH_STAGE" = "lolos" ] && [ "$FINISH_SCANNED" -eq "$FINISH_SENT" ]; then
  echo -e "${GREEN}✓ Finish scan passed: stage=$FINISH_STAGE, scanned=$FINISH_SCANNED/$FINISH_SENT.${NC}"
else
  echo -e "${RED}❌ Finish scan failed: $FINISH_RES${NC}"
  exit 1
fi

# 8. Reject Boxes Reporting: ho-04-sppg01
echo -e "\n8. Testing Reject Boxes reporting on ho-04-sppg01..."
REJECT_RES=$(curl -s -X POST "$BASE_URL/sppg/handover/ho-04-sppg01/reject" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boxes":3,"reason":"Segel boks rusak dan tutup retak saat pengiriman","evidenceName":"foto_segel_rusak.jpg"}')

REJECT_STAGE=$(echo "$REJECT_RES" | jq -r '.data.stage')
REJECT_COUNT=$(echo "$REJECT_RES" | jq -r '.data.rejected | length')
REJECT_BOXES=$(echo "$REJECT_RES" | jq -r '.data.rejected[0].boxes')
if [ "$REJECT_STAGE" = "hold" ] && [ "$REJECT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Reject recorded: stage=$REJECT_STAGE, rejectedItems=$REJECT_COUNT, boxes=$REJECT_BOXES.${NC}"
else
  echo -e "${RED}❌ Reject reporting failed: $REJECT_RES${NC}"
  exit 1
fi

# 9. Fast Response Replacement from Kitchen Safety Stock: ho-03-sppg01
echo -e "\n9. Testing Replacement from Kitchen Safety Stock on ho-03-sppg01..."
# ho-03-sppg01 has 1 rejected item of 4 boxes in seed data
REPLACE_RES=$(curl -s -X POST "$BASE_URL/sppg/handover/ho-03-sppg01/replace" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejectIndex":0}')

REPLACE_SUCCESS=$(echo "$REPLACE_RES" | jq -r '.success')
REPLACE_STOCK=$(echo "$REPLACE_RES" | jq -r '.data.safetyStock')
REPLACE_STAGE=$(echo "$REPLACE_RES" | jq -r '.data.handover.stage')
REPLACE_REJ_LEN=$(echo "$REPLACE_RES" | jq -r '.data.handover.rejected | length')

if [ "$REPLACE_SUCCESS" = "true" ] && [ "$REPLACE_STAGE" = "lolos" ] && [ "$REPLACE_REJ_LEN" -eq 0 ]; then
  echo -e "${GREEN}✓ Replacement success: Stage cleared to lolos, remaining safety stock=$REPLACE_STOCK.${NC}"
else
  echo -e "${RED}❌ Replacement failed: $REPLACE_RES${NC}"
  exit 1
fi

# 10. Digital BAST Dual-Signature & SHA-256 Stamping: ho-03-sppg01
echo -e "\n10. Testing BAST Digital Dual-Signature on ho-03-sppg01..."
BAST_RES=$(curl -s -X POST "$BASE_URL/sppg/handover/ho-03-sppg01/sign-bast" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courier":"Ahmad Fauzi (Kurir)","teacher":"Dra. Hj. Nurul Khotimah (Validator)"}')

BAST_SUCCESS=$(echo "$BAST_RES" | jq -r '.success')
BAST_NO=$(echo "$BAST_RES" | jq -r '.data.bastNo')
BAST_AT=$(echo "$BAST_RES" | jq -r '.data.bastAt')
BAST_HASH=$(echo "$BAST_RES" | jq -r '.data.bastHash')

if [ "$BAST_SUCCESS" = "true" ] && [ -n "$BAST_NO" ] && [ -n "$BAST_HASH" ]; then
  echo -e "${GREEN}✓ BAST Signed Successfully: No=$BAST_NO, Time=$BAST_AT, SHA256=$BAST_HASH.${NC}"
else
  echo -e "${RED}❌ BAST signing failed: $BAST_RES${NC}"
  exit 1
fi

# 11. BAST Sign Precondition Guard: Cannot sign twice
echo -e "\n11. Testing BAST Duplicate Sign Guard..."
DUP_BAST_RES=$(curl -s -X POST "$BASE_URL/sppg/handover/ho-03-sppg01/sign-bast" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courier":"Ahmad Fauzi","teacher":"Dra. Nurul"}')

DUP_SUCCESS=$(echo "$DUP_BAST_RES" | jq -r '.success')
if [ "$DUP_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✓ Duplicate BAST sign properly rejected.${NC}"
else
  echo -e "${RED}❌ Duplicate sign guard failed: $DUP_BAST_RES${NC}"
  exit 1
fi

# 12. Audit Logs Check
echo -e "\n12. Verifying cryptographic audit trail in database..."
AUDIT_COUNT=$(PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -t -A -c \
  "SELECT COUNT(*) FROM audit_logs WHERE action IN ('handover.replace_rejected', 'handover.sign_bast');")

if [ "$AUDIT_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✓ Audit trail verified in database: $AUDIT_COUNT handover records present.${NC}"
else
  echo -e "${RED}❌ Missing audit log records (found: $AUDIT_COUNT)${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12 HANDOVER & BAST INTEGRATION TESTS PASSED!${NC}"
echo "=========================================================="
