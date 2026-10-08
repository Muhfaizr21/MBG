#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "⚠️ INTEGRATION TEST: SPPG INCIDENTS & TICKET RESPONSE"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f "$SCRIPT_DIR/database/seed_sppg_incidents.sql" > /dev/null 2>&1

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

# 3. SPPG 01 Incidents Bundle Fetch
echo -e "\n3. Testing GET /sppg/incidents/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/incidents/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  SAFETY_STOCK=$(echo "$BUNDLE_RES" | jq -r '.data.safetyStock')
  OPEN_TICKETS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.open')
  CRITICAL=$(echo "$BUNDLE_RES" | jq -r '.data.totals.critical')
  SLA_MINUTES=$(echo "$BUNDLE_RES" | jq -r '.data.slaMinutes')
  echo -e "${GREEN}✓ Bundle fetched successfully: Kitchen=$KITCHEN_NAME, SafetyStock=$SAFETY_STOCK, OpenTickets=$OPEN_TICKETS, Critical=$CRITICAL, SLA=$SLA_MINUTES mnt.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Multi-Tenant isolation: SPPG 01 cannot access SPPG-02 data
echo -e "\n4. Testing Multi-Tenant isolation (SPPG 01 passing ?sppgId=SPPG-02)..."
ISOLATION_RES=$(curl -s -X GET "$BASE_URL/sppg/incidents/bundle?sppgId=SPPG-02" \
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
ADMIN_SPPG2_RES=$(curl -s -X GET "$BASE_URL/sppg/incidents/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

ADMIN_SPPG2_ID=$(echo "$ADMIN_SPPG2_RES" | jq -r '.data.sppgId')
ADMIN_SPPG2_STOCK=$(echo "$ADMIN_SPPG2_RES" | jq -r '.data.safetyStock')
if [ "$ADMIN_SPPG2_ID" = "SPPG-02" ]; then
  echo -e "${GREEN}✓ Superadmin successfully inspected SPPG-02 (Safety stock=$ADMIN_SPPG2_STOCK).${NC}"
else
  echo -e "${RED}❌ Superadmin failed to inspect SPPG-02: $ADMIN_SPPG2_RES${NC}"
  exit 1
fi

# 6. Create Ticket from School / System
echo -e "\n6. Testing Create Incident Ticket on SPPG-01..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolName": "SDN Gondangdia 01",
    "batchToken": "MBG-2026-SPPG01-SDNG01-B04",
    "level": 2,
    "category": "Sayur kurang matang",
    "message": "Wortel dan buncis pada sayur sop masih terasa keras.",
    "createdAt": "08:10"
  }')

CREATE_STATUS=$(echo "$CREATE_RES" | jq -r '.data.status')
NEW_TICKET_ID=$(echo "$CREATE_RES" | jq -r '.data.id')
if [ "$CREATE_STATUS" = "baru" ] && [ -n "$NEW_TICKET_ID" ]; then
  echo -e "${GREEN}✓ Ticket created successfully: ID=$NEW_TICKET_ID, status=$CREATE_STATUS.${NC}"
else
  echo -e "${RED}❌ Create ticket failed: $CREATE_RES${NC}"
  exit 1
fi

# 7. Reply Ticket with Sample Check Findings: tkt-01-sppg01
echo -e "\n7. Testing Reply Ticket on tkt-01-sppg01..."
REPLY_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents/tkt-01-sppg01/reply" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Sampel arsip batch B02 dicek laboratorium mini dapur. Indikasi fermentasi bumbu santan, tindakan karantina disiapkan."}')

REPLY_STATUS=$(echo "$REPLY_RES" | jq -r '.data.status')
REPLY_COUNT=$(echo "$REPLY_RES" | jq -r '.data.responses | length')
if [ "$REPLY_STATUS" = "ditangani" ] && [ "$REPLY_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Reply recorded: status=$REPLY_STATUS, responsesCount=$REPLY_COUNT.${NC}"
else
  echo -e "${RED}❌ Reply ticket failed: $REPLY_RES${NC}"
  exit 1
fi

# 8. Fast Response Replacement from Kitchen Safety Stock: tkt-02-sppg01
echo -e "\n8. Testing Replacement Portions from Safety Stock on tkt-02-sppg01..."
REPLACE_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents/tkt-02-sppg01/replace" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boxes":3}')

REPLACE_SUCCESS=$(echo "$REPLACE_RES" | jq -r '.success')
REPLACE_STOCK=$(echo "$REPLACE_RES" | jq -r '.data.safetyStock')
REPLACE_STATUS=$(echo "$REPLACE_RES" | jq -r '.data.ticket.status')
if [ "$REPLACE_SUCCESS" = "true" ] && [ "$REPLACE_STOCK" -eq 37 ]; then
  echo -e "${GREEN}✓ Replacement success: Sisa safety stock=$REPLACE_STOCK boks (potong 3 boks), ticket status=$REPLACE_STATUS.${NC}"
else
  echo -e "${RED}❌ Replacement failed: $REPLACE_RES${NC}"
  exit 1
fi

# 9. Safety Stock Depletion Guard
echo -e "\n9. Testing Safety Stock Depletion Guard (asking 999 boxes)..."
OVER_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents/tkt-02-sppg01/replace" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boxes":999}')

OVER_SUCCESS=$(echo "$OVER_RES" | jq -r '.success')
if [ "$OVER_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✓ Depletion guard passed: Request with excessive boxes properly rejected.${NC}"
else
  echo -e "${RED}❌ Depletion guard failed: $OVER_RES${NC}"
  exit 1
fi

# 10. Emergency Batch Recall (Karantina Darurat Batch): tkt-01-sppg01
echo -e "\n10. Testing Emergency Batch Recall for MBG-2026-SPPG01-SMPN03-B02..."
RECALL_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents/recall" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "MBG-2026-SPPG01-SMPN03-B02",
    "reason": "Laporan bau masam menyengat pada lima boks. Seluruh sekolah penerima batch dilarang membagikan porsi."
  }')

RECALL_SUCCESS=$(echo "$RECALL_RES" | jq -r '.success')
RECALLED_COUNT=$(echo "$RECALL_RES" | jq -r '.data.recalledTokens | length')
if [ "$RECALL_SUCCESS" = "true" ] && [ "$RECALLED_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✓ Emergency batch recall executed: Active quarantined batches=$RECALLED_COUNT.${NC}"
else
  echo -e "${RED}❌ Batch recall failed: $RECALL_RES${NC}"
  exit 1
fi

# 11. Close Ticket with Satgas Resolution Proof: tkt-02-sppg01
echo -e "\n11. Testing Close Ticket with Satgas Resolution Proof on tkt-02-sppg01..."
CLOSE_RES=$(curl -s -X POST "$BASE_URL/sppg/incidents/tkt-02-sppg01/close" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"3 boks kemasan bocor telah diganti porsi baru, siswa telah selesai makan dengan aman, disaksikan Kepala Sekolah dan Satgas MBG."}')

CLOSE_STATUS=$(echo "$CLOSE_RES" | jq -r '.data.status')
CLOSE_RES_TEXT=$(echo "$CLOSE_RES" | jq -r '.data.resolution')
if [ "$CLOSE_STATUS" = "selesai" ] && [ -n "$CLOSE_RES_TEXT" ]; then
  echo -e "${GREEN}✓ Ticket closed successfully: status=$CLOSE_STATUS, resolution verified.${NC}"
else
  echo -e "${RED}❌ Close ticket failed: $CLOSE_RES${NC}"
  exit 1
fi

# 12. Verify Audit Trail in Database
echo -e "\n12. Verifying audit trail in database..."
AUDIT_COUNT=$(PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -t -A -c \
  "SELECT COUNT(*) FROM audit_logs WHERE action IN ('incident.replace_portions', 'incident.batch_recall', 'incident.close_ticket');")

if [ "$AUDIT_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✓ Audit trail verified: $AUDIT_COUNT incident records present in audit_logs.${NC}"
else
  echo -e "${RED}❌ Missing audit log records (found: $AUDIT_COUNT)${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12 INCIDENTS & TICKET RESPONSE TESTS PASSED!${NC}"
echo "=========================================================="
