#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "🛡️ INTEGRATION TEST: SPPG SANITATION & COMPLIANCE"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f "$SCRIPT_DIR/database/seed_sppg_compliance.sql" > /dev/null 2>&1

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

# 3. SPPG 01 Compliance Bundle Fetch
echo -e "\n3. Testing GET /sppg/compliance/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/compliance/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  TOTAL_DOCS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.docs')
  EXPIRED_DOCS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.expired')
  TOTAL_HANDLERS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.handlers')
  HANDLERS_OK=$(echo "$BUNDLE_RES" | jq -r '.data.totals.handlersOk')
  TOTAL_LABS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.labs')
  LABS_PASS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.labsPass')
  TOTAL_AUDITS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.audits')

  echo -e "${GREEN}✓ Bundle fetched: Kitchen=$KITCHEN_NAME, Docs=$TOTAL_DOCS (Expired=$EXPIRED_DOCS), Handlers=$TOTAL_HANDLERS (Qualified=$HANDLERS_OK), Labs=$TOTAL_LABS (Pass=$LABS_PASS), Audits=$TOTAL_AUDITS.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. List Documents API
echo -e "\n4. Testing GET /sppg/compliance/docs..."
DOCS_RES=$(curl -s -X GET "$BASE_URL/sppg/compliance/docs" \
  -H "Authorization: Bearer $SPPG_TOKEN")

DOC1_NAME=$(echo "$DOCS_RES" | jq -r '.data[0].name')
DOC1_STATUS=$(echo "$DOCS_RES" | jq -r '.data[0].statusLabel')
DOC2_NAME=$(echo "$DOCS_RES" | jq -r '.data[1].name')
DOC2_DAYS=$(echo "$DOCS_RES" | jq -r '.data[1].daysLeft')
if [ "$DOC1_NAME" = "Sertifikat Laik Higiene Sanitasi" ] && [ -n "$DOC1_STATUS" ]; then
  echo -e "${GREEN}✓ Docs list verified: $DOC1_NAME (Status: $DOC1_STATUS), $DOC2_NAME (Sisa $DOC2_DAYS hari).${NC}"
else
  echo -e "${RED}❌ Docs list unexpected data: $DOCS_RES${NC}"
  exit 1
fi

# 5. Renew Document Expiry API
echo -e "\n5. Testing POST /sppg/compliance/docs/renew..."
RENEW_RES=$(curl -s -X POST "$BASE_URL/sppg/compliance/docs/renew" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docId":"doc-02-sppg01","expiry":"2027-11-20","fileName":"halal-2026-terbaru.pdf"}')

RENEW_NAME=$(echo "$RENEW_RES" | jq -r '.data.name')
RENEW_EXPIRY=$(echo "$RENEW_RES" | jq -r '.data.expiry')
RENEW_FILE=$(echo "$RENEW_RES" | jq -r '.data.fileName')
RENEW_DAYS=$(echo "$RENEW_RES" | jq -r '.data.daysLeft')

if [ "$RENEW_EXPIRY" = "2027-11-20" ] && [ "$RENEW_FILE" = "halal-2026-terbaru.pdf" ] && [ "$RENEW_DAYS" -gt 60 ]; then
  echo -e "${GREEN}✓ Document renewed successfully: $RENEW_NAME renewed until $RENEW_EXPIRY (File: $RENEW_FILE, Sisa: $RENEW_DAYS hari).${NC}"
else
  echo -e "${RED}❌ Renew document failed: $RENEW_RES${NC}"
  exit 1
fi

# 6. List Handlers API
echo -e "\n6. Testing GET /sppg/compliance/handlers..."
HANDLERS_RES=$(curl -s -X GET "$BASE_URL/sppg/compliance/handlers" \
  -H "Authorization: Bearer $SPPG_TOKEN")

H1_NAME=$(echo "$HANDLERS_RES" | jq -r '.data[0].name')
H1_ROLE=$(echo "$HANDLERS_RES" | jq -r '.data[0].role')
H1_STATUS=$(echo "$HANDLERS_RES" | jq -r '.data[0].statusLabel')
HANDLERS_LEN=$(echo "$HANDLERS_RES" | jq -r '.data | length')

if [ "$HANDLERS_LEN" -ge 3 ]; then
  echo -e "${GREEN}✓ Handlers list verified: Total $HANDLERS_LEN penjamah, Lead=$H1_NAME ($H1_ROLE, Status: $H1_STATUS).${NC}"
else
  echo -e "${RED}❌ Handlers list unexpected data: $HANDLERS_RES${NC}"
  exit 1
fi

# 7. Register New Food Handler API
echo -e "\n7. Testing POST /sppg/compliance/handlers..."
CREATE_H_RES=$(curl -s -X POST "$BASE_URL/sppg/compliance/handlers" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahmat Subagyo","role":"Koki Utama","healthExpiry":"2027-04-01","trained":true,"healthFile":"sehat-rahmat.pdf"}')

NEW_H_NAME=$(echo "$CREATE_H_RES" | jq -r '.data.name')
NEW_H_ROLE=$(echo "$CREATE_H_RES" | jq -r '.data.role')
NEW_H_QUALIFIED=$(echo "$CREATE_H_RES" | jq -r '.data.isFullyQualified')
NEW_H_STATUS=$(echo "$CREATE_H_RES" | jq -r '.data.statusLabel')

if [ "$NEW_H_NAME" = "Rahmat Subagyo" ] && [ "$NEW_H_QUALIFIED" = "true" ] && [ "$NEW_H_STATUS" = "Lengkap" ]; then
  echo -e "${GREEN}✓ New food handler registered: $NEW_H_NAME ($NEW_H_ROLE, Status: $NEW_H_STATUS, Qualified=$NEW_H_QUALIFIED).${NC}"
else
  echo -e "${RED}❌ Create handler failed: $CREATE_H_RES${NC}"
  exit 1
fi

# 8. List Labs API
echo -e "\n8. Testing GET /sppg/compliance/labs..."
LABS_RES=$(curl -s -X GET "$BASE_URL/sppg/compliance/labs" \
  -H "Authorization: Bearer $SPPG_TOKEN")

LAB1_TARGET=$(echo "$LABS_RES" | jq -r '.data[0].target')
LAB1_PARAM=$(echo "$LABS_RES" | jq -r '.data[0].param')
LAB1_VERDICT=$(echo "$LABS_RES" | jq -r '.data[0].verdictLabel')
LABS_COUNT=$(echo "$LABS_RES" | jq -r '.data | length')

if [ "$LABS_COUNT" -ge 4 ]; then
  echo -e "${GREEN}✓ Labs list verified: Total $LABS_COUNT uji lab, Sample 1: $LAB1_TARGET - $LAB1_PARAM (Vonis: $LAB1_VERDICT).${NC}"
else
  echo -e "${RED}❌ Labs list unexpected data: $LABS_RES${NC}"
  exit 1
fi

# 9. Record New Lab Test (Passing result)
echo -e "\n9. Testing POST /sppg/compliance/labs (Passing test: Salmonella = 0)..."
CREATE_LAB_RES=$(curl -s -X POST "$BASE_URL/sppg/compliance/labs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"swab","target":"Wajan Penggorengan","param":"Salmonella","value":0,"unit":"koloni/cm2"}')

NEW_LAB_TARGET=$(echo "$CREATE_LAB_RES" | jq -r '.data.target')
NEW_LAB_VERDICT=$(echo "$CREATE_LAB_RES" | jq -r '.data.verdictLabel')
NEW_LAB_PASS=$(echo "$CREATE_LAB_RES" | jq -r '.data.pass')

if [ "$NEW_LAB_TARGET" = "Wajan Penggorengan" ] && [ "$NEW_LAB_VERDICT" = "LOLOS" ] && [ "$NEW_LAB_PASS" = "true" ]; then
  echo -e "${GREEN}✓ Lab test recorded (Passing): $NEW_LAB_TARGET -> $NEW_LAB_VERDICT (Pass=$NEW_LAB_PASS).${NC}"
else
  echo -e "${RED}❌ Record lab test failed: $CREATE_LAB_RES${NC}"
  exit 1
fi

# 10. Record Lab Test (Failing result: E. coli > 0)
echo -e "\n10. Testing POST /sppg/compliance/labs (Failing test: E. coli = 2.5 > 0)..."
FAIL_LAB_RES=$(curl -s -X POST "$BASE_URL/sppg/compliance/labs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"swab","target":"Meja Persiapan","param":"E. coli","value":2.5,"unit":"koloni/cm2"}')

FAIL_LAB_VERDICT=$(echo "$FAIL_LAB_RES" | jq -r '.data.verdictLabel')
FAIL_LAB_PASS=$(echo "$FAIL_LAB_RES" | jq -r '.data.pass')

if [ "$FAIL_LAB_VERDICT" = "GAGAL" ] && [ "$FAIL_LAB_PASS" = "false" ]; then
  echo -e "${GREEN}✓ Lab threshold logic verified (Failing): Value 2.5 koloni/cm2 -> $FAIL_LAB_VERDICT (Pass=$FAIL_LAB_PASS).${NC}"
else
  echo -e "${RED}❌ Failing lab test logic failed: $FAIL_LAB_RES${NC}"
  exit 1
fi

# 11. Request Dinkes Inspection Audit API
echo -e "\n11. Testing POST /sppg/compliance/audits..."
AUDIT_RES=$(curl -s -X POST "$BASE_URL/sppg/compliance/audits" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purpose":"Inspeksi Berkala Triwulan IV","preferredDate":"2026-11-25","note":"Fokus sterilisasi cold-chain & sanitasi wadah saji"}')

AUDIT_PURPOSE=$(echo "$AUDIT_RES" | jq -r '.data.purpose')
AUDIT_STATUS=$(echo "$AUDIT_RES" | jq -r '.data.status')
AUDIT_DATE=$(echo "$AUDIT_RES" | jq -r '.data.preferredDate')

if [ "$AUDIT_PURPOSE" = "Inspeksi Berkala Triwulan IV" ] && [ "$AUDIT_STATUS" = "Diajukan" ] && [ "$AUDIT_DATE" = "2026-11-25" ]; then
  echo -e "${GREEN}✓ Audit requested successfully: Purpose='$AUDIT_PURPOSE', Status=$AUDIT_STATUS, PreferredDate=$AUDIT_DATE.${NC}"
else
  echo -e "${RED}❌ Request audit failed: $AUDIT_RES${NC}"
  exit 1
fi

# 12. Multi-Tenancy & Superadmin Inspection for SPPG 02
echo -e "\n12. Testing Multi-Tenant & Superadmin inspection for SPPG 02..."
SPPG2_BUNDLE=$(curl -s -X GET "$BASE_URL/sppg/compliance/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

SPPG2_KITCHEN=$(echo "$SPPG2_BUNDLE" | jq -r '.data.kitchenName')
SPPG2_DOCS=$(echo "$SPPG2_BUNDLE" | jq -r '.data.totals.docs')
SPPG2_HANDLERS=$(echo "$SPPG2_BUNDLE" | jq -r '.data.totals.handlers')
SPPG2_LEAD_CHEF=$(echo "$SPPG2_BUNDLE" | jq -r '.data.handlers[0].name')

if [[ "$SPPG2_KITCHEN" == *"Kebayoran"* || "$SPPG2_KITCHEN" == *"SPPG-02"* ]] && [ "$SPPG2_DOCS" -ge 3 ] && [ "$SPPG2_HANDLERS" -ge 2 ]; then
  echo -e "${GREEN}✓ Multi-tenancy verified: Superadmin inspected SPPG-02 ($SPPG2_KITCHEN). Docs=$SPPG2_DOCS, Handlers=$SPPG2_HANDLERS, LeadChef=$SPPG2_LEAD_CHEF.${NC}"
else
  echo -e "${RED}❌ Multi-tenancy verification failed: $SPPG2_BUNDLE${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12/12 COMPLIANCE INTEGRATION TESTS PASSED!${NC}"
echo "=========================================================="
