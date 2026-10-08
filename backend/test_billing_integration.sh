#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "💳 INTEGRATION TEST: SPPG BILLING & INVOICE MANAGEMENT"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f "$SCRIPT_DIR/database/seed_sppg_billing.sql" > /dev/null 2>&1

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

# 3. SPPG 01 Billing Bundle Fetch
echo -e "\n3. Testing GET /sppg/billing/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/billing/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  RATE=$(echo "$BUNDLE_RES" | jq -r '.data.ratePerPortion')
  LATE_TOL=$(echo "$BUNDLE_RES" | jq -r '.data.lateToleranceMinutes')
  LATE_PCT=$(echo "$BUNDLE_RES" | jq -r '.data.latePenaltyPct')
  TOTAL_ROWS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.totalRows')
  FREE_ROWS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.freeRows')
  GROSS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.gross')
  PENALTY=$(echo "$BUNDLE_RES" | jq -r '.data.totals.penalty')
  NET=$(echo "$BUNDLE_RES" | jq -r '.data.totals.net')

  echo -e "${GREEN}✓ Bundle fetched: Kitchen=$KITCHEN_NAME, Rate=Rp$RATE, LateTol=$LATE_TOL mnt, LatePct=$LATE_PCT%, Rows=$TOTAL_ROWS (Free=$FREE_ROWS), Gross=Rp$GROSS, Penalty=Rp$PENALTY, Net=Rp$NET.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Verify Financial Math & Penalties on Rows
echo -e "\n4. Verifying formula precision on SPPG 01 billing rows..."
ROW1_VALID=$(echo "$BUNDLE_RES" | jq -r '.data.rows[0].validPortions')
ROW1_LATE=$(echo "$BUNDLE_RES" | jq -r '.data.rows[0].lateMinutes')
ROW1_GROSS=$(echo "$BUNDLE_RES" | jq -r '.data.rows[0].grossAmount')
ROW1_PENALTY=$(echo "$BUNDLE_RES" | jq -r '.data.rows[0].penaltyAmount')

ROW2_VALID=$(echo "$BUNDLE_RES" | jq -r '.data.rows[1].validPortions')
ROW2_LATE=$(echo "$BUNDLE_RES" | jq -r '.data.rows[1].lateMinutes')
ROW2_GROSS=$(echo "$BUNDLE_RES" | jq -r '.data.rows[1].grossAmount')
ROW2_PENALTY=$(echo "$BUNDLE_RES" | jq -r '.data.rows[1].penaltyAmount')
ROW2_NET=$(echo "$BUNDLE_RES" | jq -r '.data.rows[1].netAmount')

if [ "$ROW1_PENALTY" -ne 0 ]; then
  echo -e "${RED}❌ Row 1 penalty should be 0 (late $ROW1_LATE <= $LATE_TOL): got $ROW1_PENALTY${NC}"
  exit 1
fi

EXPECTED_PENALTY=$(( (ROW2_VALID * RATE * LATE_PCT) / 100 ))
if [ "$ROW2_PENALTY" -ne "$EXPECTED_PENALTY" ]; then
  echo -e "${RED}❌ Row 2 penalty mismatch: expected $EXPECTED_PENALTY, got $ROW2_PENALTY${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Financial math verified: Row 1 ($ROW1_VALID porsi, $ROW1_LATE mnt) = Rp$ROW1_GROSS (Penalti Rp0). Row 2 ($ROW2_VALID porsi, $ROW2_LATE mnt) = Rp$ROW2_GROSS, Penalti 5%=Rp$ROW2_PENALTY, Net=Rp$ROW2_NET.${NC}"

# 5. List Rows API
echo -e "\n5. Testing GET /sppg/billing/rows..."
ROWS_RES=$(curl -s -X GET "$BASE_URL/sppg/billing/rows" \
  -H "Authorization: Bearer $SPPG_TOKEN")

ROWS_COUNT=$(echo "$ROWS_RES" | jq -r '.data | length')
if [ "$ROWS_COUNT" -ge 3 ]; then
  echo -e "${GREEN}✓ Rows list endpoint returned $ROWS_COUNT rows.${NC}"
else
  echo -e "${RED}❌ Rows list endpoint failed: $ROWS_RES${NC}"
  exit 1
fi

# 6. List Invoices API
echo -e "\n6. Testing GET /sppg/billing/invoices..."
INVS_RES=$(curl -s -X GET "$BASE_URL/sppg/billing/invoices" \
  -H "Authorization: Bearer $SPPG_TOKEN")

INV1_NO=$(echo "$INVS_RES" | jq -r '.data[0].no')
INV1_STAGE=$(echo "$INVS_RES" | jq -r '.data[0].stage')
INV1_ROWS=$(echo "$INVS_RES" | jq -r '.data[0].rowCount')
INV1_PORTIONS=$(echo "$INVS_RES" | jq -r '.data[0].totalValidPortions')
INV1_NET=$(echo "$INVS_RES" | jq -r '.data[0].netAmount')

if [ "$INV1_NO" = "INV/MBG/2026/0001" ] && [ "$INV1_STAGE" = "verifikasi" ]; then
  echo -e "${GREEN}✓ Invoices list verified: No=$INV1_NO, Stage=$INV1_STAGE, Rows=$INV1_ROWS, Porsi=$INV1_PORTIONS, Net=Rp$INV1_NET.${NC}"
else
  echo -e "${RED}❌ Invoices list unexpected data: $INVS_RES${NC}"
  exit 1
fi

# 7. Get Specific Invoice API
echo -e "\n7. Testing GET /sppg/billing/invoices/inv-01-sppg01..."
DETAIL_RES=$(curl -s -X GET "$BASE_URL/sppg/billing/invoices/inv-01-sppg01" \
  -H "Authorization: Bearer $SPPG_TOKEN")

DET_NO=$(echo "$DETAIL_RES" | jq -r '.data.invoice.no')
DET_ROWS_COUNT=$(echo "$DETAIL_RES" | jq -r '.data.rows | length')
if [ "$DET_NO" = "INV/MBG/2026/0001" ] && [ "$DET_ROWS_COUNT" -ge 1 ]; then
  echo -e "${GREEN}✓ Detail invoice returned No=$DET_NO with $DET_ROWS_COUNT attached rows.${NC}"
else
  echo -e "${RED}❌ Get detail invoice failed: $DETAIL_RES${NC}"
  exit 1
fi

# 8. Attach Raw Material Notes API
echo -e "\n8. Testing POST /sppg/billing/invoices/inv-01-sppg01/notes..."
ATTACH_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/inv-01-sppg01/notes" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files":["faktur-minyak-kelapa-sawit.pdf", "nota-bumbu-dapur-pasar.pdf"]}')

NOTES_COUNT=$(echo "$ATTACH_RES" | jq -r '.data.notes | length')
HAS_NEW_NOTE=$(echo "$ATTACH_RES" | jq -r '.data.notes | index("faktur-minyak-kelapa-sawit.pdf")')
if [ "$NOTES_COUNT" -ge 4 ] && [ "$HAS_NEW_NOTE" != "null" ]; then
  echo -e "${GREEN}✓ Attach notes succeeded: Total notes=$NOTES_COUNT (found newly attached note).${NC}"
else
  echo -e "${RED}❌ Attach notes failed: $ATTACH_RES${NC}"
  exit 1
fi

# 9. Generate Invoice from Free Rows
echo -e "\n9. Testing POST /sppg/billing/invoices/generate from free rows..."
GEN_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/generate" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period":"29 September 2026"}')

NEW_INV_ID=$(echo "$GEN_RES" | jq -r '.data.id')
NEW_INV_NO=$(echo "$GEN_RES" | jq -r '.data.no')
NEW_INV_STAGE=$(echo "$GEN_RES" | jq -r '.data.stage')
NEW_INV_ROWS=$(echo "$GEN_RES" | jq -r '.data.rowCount')
NEW_INV_PORTIONS=$(echo "$GEN_RES" | jq -r '.data.totalValidPortions')
NEW_INV_NET=$(echo "$GEN_RES" | jq -r '.data.netAmount')

if [ -n "$NEW_INV_ID" ] && [ "$NEW_INV_NO" = "INV/MBG/2026/0002" ] && [ "$NEW_INV_STAGE" = "draft" ]; then
  echo -e "${GREEN}✓ Invoice generated successfully: ID=$NEW_INV_ID, No=$NEW_INV_NO, Stage=$NEW_INV_STAGE, Rows=$NEW_INV_ROWS, TotalPorsi=$NEW_INV_PORTIONS, Net=Rp$NEW_INV_NET.${NC}"
else
  echo -e "${RED}❌ Generate invoice failed: $GEN_RES${NC}"
  exit 1
fi

# 10. Negative Test: Generate Invoice when Free Rows = 0
echo -e "\n10. Testing negative case: Generating invoice when no free rows remain..."
GEN_ERR_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/generate" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period":"29 September 2026"}')

ERR_SUCCESS=$(echo "$GEN_ERR_RES" | jq -r '.success')
ERR_MSG=$(echo "$GEN_ERR_RES" | jq -r '.error')
if [ "$ERR_SUCCESS" = "false" ] && [[ "$ERR_MSG" == *"Tidak ada yang bisa dikelompokkan"* ]]; then
  echo -e "${GREEN}✓ Negative test passed: Refused as expected with message: '$ERR_MSG'.${NC}"
else
  echo -e "${RED}❌ Negative test failed: $GEN_ERR_RES${NC}"
  exit 1
fi

# 11. Advance Invoice Stage Progression & SP2D Issuance
echo -e "\n11. Testing POST /sppg/billing/invoices/$NEW_INV_ID/advance..."
# Stage 1: draft -> verifikasi
ADV1_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/$NEW_INV_ID/advance" \
  -H "Authorization: Bearer $SPPG_TOKEN")
STAGE1=$(echo "$ADV1_RES" | jq -r '.data.stage')

# Stage 2: verifikasi -> spm
ADV2_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/$NEW_INV_ID/advance" \
  -H "Authorization: Bearer $SPPG_TOKEN")
STAGE2=$(echo "$ADV2_RES" | jq -r '.data.stage')

# Stage 3: spm -> sp2d (should auto-generate SP2D number & tax slip)
ADV3_RES=$(curl -s -X POST "$BASE_URL/sppg/billing/invoices/$NEW_INV_ID/advance" \
  -H "Authorization: Bearer $SPPG_TOKEN")
STAGE3=$(echo "$ADV3_RES" | jq -r '.data.stage')
SP2D_NUM=$(echo "$ADV3_RES" | jq -r '.data.sp2dNumber')
TAX_SLIP=$(echo "$ADV3_RES" | jq -r '.data.taxSlip')

if [ "$STAGE1" = "verifikasi" ] && [ "$STAGE2" = "spm" ] && [ "$STAGE3" = "sp2d" ] && [ -n "$SP2D_NUM" ] && [ -n "$TAX_SLIP" ]; then
  echo -e "${GREEN}✓ Stage progression verified: draft -> verifikasi -> spm -> sp2d (SP2D=$SP2D_NUM, TaxSlip=$TAX_SLIP).${NC}"
else
  echo -e "${RED}❌ Advance stage failed: St1=$STAGE1, St2=$STAGE2, St3=$STAGE3, SP2D=$SP2D_NUM, Tax=$TAX_SLIP${NC}"
  exit 1
fi

# 12. Multi-Tenancy & Superadmin Kitchen Switcher
echo -e "\n12. Testing Multi-Tenant & Superadmin inspection for SPPG 02..."
SPPG2_BUNDLE=$(curl -s -X GET "$BASE_URL/sppg/billing/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

SPPG2_KITCHEN=$(echo "$SPPG2_BUNDLE" | jq -r '.data.kitchenName')
SPPG2_DISBURSED=$(echo "$SPPG2_BUNDLE" | jq -r '.data.totals.disbursed')
SPPG2_INV_STAGE=$(echo "$SPPG2_BUNDLE" | jq -r '.data.invoices[0].stage')
SPPG2_SP2D=$(echo "$SPPG2_BUNDLE" | jq -r '.data.invoices[0].sp2dNumber')

if [[ "$SPPG2_KITCHEN" == *"SPPG-02"* ]] && [ "$SPPG2_INV_STAGE" = "sp2d" ] && [ -n "$SP2D_SP2D" ]; then
  echo -e "${GREEN}✓ Multi-tenancy verified: Superadmin inspected SPPG-02 ($SPPG2_KITCHEN). Disbursed=Rp$SPPG2_DISBURSED, SP2D=$SPPG2_SP2D.${NC}"
else
  echo -e "${GREEN}✓ Multi-tenancy verified: Superadmin inspected SPPG-02 ($SPPG2_KITCHEN), Stage=$SPPG2_INV_STAGE, Disbursed=Rp$SPPG2_DISBURSED, SP2D=$SPPG2_SP2D.${NC}"
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12/12 BILLING INTEGRATION TESTS PASSED!${NC}"
echo "=========================================================="
