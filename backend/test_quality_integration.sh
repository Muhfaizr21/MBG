#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================================="
echo "🧪 INTEGRATION TEST: SPPG QUALITY & HACCP CONTROLS"
echo "=========================================================="

# 1. Login SPPG 01
echo -e "\n1. Authenticating as SPPG 01 (dapur@sppg01.id)..."
SPPG_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dapur@sppg01.id","password":"Sppg123!"}')

SPPG_TOKEN=$(echo "$SPPG_LOGIN_RES" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
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

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RES" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get Admin token: $ADMIN_LOGIN_RES${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin Token obtained.${NC}"

# 3. SPPG Bundle Fetch
echo -e "\n3. Testing GET /sppg/quality/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/quality/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

if echo "$BUNDLE_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Bundle fetched successfully.${NC}"
else
  echo -e "${RED}❌ Failed to fetch bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Record CCP-1 Temp Log (PASS test: 78.5C >= 75C, hold 2 mins)
echo -e "\n4. Testing POST /sppg/quality/temp-logs (CCP-1 Normal/Pass)..."
LOG_PASS_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/temp-logs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointId": "ccp-1",
    "batchToken": "BATCH-20261008-01",
    "value": 78.5,
    "holdMinutes": 2,
    "measuredAt": "09:30",
    "measuredBy": "Chef Haryo",
    "evidenceName": "probe-test-pass.jpg"
  }')

if echo "$LOG_PASS_RES" | grep -q '"pass":true'; then
  echo -e "${GREEN}✓ CCP-1 probe passed automatic HACCP rule evaluation.${NC}"
else
  echo -e "${RED}❌ CCP-1 probe did not pass as expected: $LOG_PASS_RES${NC}"
  exit 1
fi

# 5. Record CCP-1 Temp Log (FAIL test: 67.0C < 75C)
echo -e "\n5. Testing POST /sppg/quality/temp-logs (CCP-1 Low Temp/Fail)..."
LOG_FAIL_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/temp-logs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointId": "ccp-1",
    "batchToken": "BATCH-20261008-01",
    "value": 67.0,
    "holdMinutes": 1,
    "measuredAt": "09:35",
    "measuredBy": "Chef Haryo",
    "evidenceName": "probe-test-fail.jpg"
  }')

if echo "$LOG_FAIL_RES" | grep -q '"pass":false'; then
  echo -e "${GREEN}✓ CCP-1 low temperature correctly flagged as FAIL by system rule.${NC}"
else
  echo -e "${RED}❌ CCP-1 low temperature was not flagged as fail: $LOG_FAIL_RES${NC}"
  exit 1
fi

# 6. Record Sensory Organoleptic Signoff (PASS: all 4 aspects 'lolos')
echo -e "\n6. Testing POST /sppg/quality/signoffs (All aspects pass -> LAYAK)..."
SIGNOFF_PASS_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/signoffs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "BATCH-20261008-01",
    "aspects": {
      "rasa": "lolos",
      "aroma": "lolos",
      "tekstur": "lolos",
      "visual": "lolos"
    },
    "note": "Rasa seimbang, aroma harum segar gurih.",
    "signer": "Nurul Hidayah, S.Gz",
    "agree": true
  }')

if echo "$SIGNOFF_PASS_RES" | grep -q '"layak":true'; then
  echo -e "${GREEN}✓ Sensory signoff marked as LAYAK KONSUMSI.${NC}"
else
  echo -e "${RED}❌ Sensory signoff failed: $SIGNOFF_PASS_RES${NC}"
  exit 1
fi

# 7. Record Sensory Organoleptic Signoff (FAIL: 1 aspect 'tidak_lolos' -> TIDAK LAYAK)
echo -e "\n7. Testing POST /sppg/quality/signoffs (1 aspect fail -> TIDAK LAYAK)..."
SIGNOFF_FAIL_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/signoffs" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "BATCH-20261008-01",
    "aspects": {
      "rasa": "tidak_lolos",
      "aroma": "lolos",
      "tekstur": "lolos",
      "visual": "lolos"
    },
    "note": "Rasa terlalu asin melebihi standar AKG.",
    "signer": "Nurul Hidayah, S.Gz",
    "agree": true
  }')

if echo "$SIGNOFF_FAIL_RES" | grep -q '"layak":false'; then
  echo -e "${GREEN}✓ Flawed sensory evaluation correctly marked as TIDAK LAYAK.${NC}"
else
  echo -e "${RED}❌ Flawed sensory evaluation was not marked false: $SIGNOFF_FAIL_RES${NC}"
  exit 1
fi

# 8. Record Retention Sample (48 hours storage)
echo -e "\n8. Testing POST /sppg/quality/samples (Archiving 2x24h sample)..."
SAMPLE_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/samples" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "BATCH-20261008-01",
    "rackNo": "RK-A9",
    "storedBy": "Chef Haryo"
  }')

SAMPLE_ID=$(echo "$SAMPLE_RES" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)
if [ -n "$SAMPLE_ID" ] && echo "$SAMPLE_RES" | grep -q '"status":"tersimpan"'; then
  echo -e "${GREEN}✓ Retention sample archived in rack RK-A9 (ID: $SAMPLE_ID).${NC}"
else
  echo -e "${RED}❌ Failed to create retention sample: $SAMPLE_RES${NC}"
  exit 1
fi

# 9. Toggle Retention Sample Status to destroyed/dimusnahkan
echo -e "\n9. Testing PUT /sppg/quality/samples/$SAMPLE_ID/status..."
UPDATE_SAMPLE_RES=$(curl -s -X PUT "$BASE_URL/sppg/quality/samples/$SAMPLE_ID/status" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"dimusnahkan"}')

if echo "$UPDATE_SAMPLE_RES" | grep -q '"status":"dimusnahkan"'; then
  echo -e "${GREEN}✓ Retention sample marked as dimusnahkan after retention period.${NC}"
else
  echo -e "${RED}❌ Failed to update sample status: $UPDATE_SAMPLE_RES${NC}"
  exit 1
fi

# 10. Superadmin Cross-Inspection on SPPG-02
echo -e "\n10. Testing Superadmin Inspection on SPPG-02 (GET /sppg/quality/bundle?sppgId=SPPG-02)..."
ADMIN_BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/quality/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ADMIN_BUNDLE_RES" | grep -q '"sppgId":"SPPG-02"'; then
  echo -e "${GREEN}✓ Superadmin successfully inspected SPPG-02 workspace.${NC}"
else
  echo -e "${RED}❌ Superadmin inspection failed: $ADMIN_BUNDLE_RES${NC}"
  exit 1
fi

# 11. RBAC Test: SPPG User tries Superadmin Quality Intervention (Must be 403 Forbidden)
echo -e "\n11. Testing RBAC enforcement (SPPG User executing intervention)..."
RBAC_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/sppg/quality/intervention" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "BATCH-20261008-01",
    "action": "quarantine",
    "reason": "Unauthorized attempt"
  }')

HTTP_CODE=$(echo "$RBAC_RES" | tail -n1)
if [ "$HTTP_CODE" -eq 403 ]; then
  echo -e "${GREEN}✓ RBAC strictly enforced: SPPG user blocked with 403 Forbidden.${NC}"
else
  echo -e "${RED}❌ RBAC check failed, expected 403 but got $HTTP_CODE: $RBAC_RES${NC}"
  exit 1
fi

# 12. Superadmin Quality Intervention (quarantine batch with audit logging)
echo -e "\n12. Testing Superadmin Food Safety Intervention (Emergency Quarantine)..."
INTERVENE_RES=$(curl -s -X POST "$BASE_URL/sppg/quality/intervention" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchToken": "BATCH-20261008-01",
    "action": "quarantine",
    "reason": "Anomali suhu holding dan risiko mikrobiologis terdeteksi saat uji silang."
  }')

if echo "$INTERVENE_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Superadmin intervention executed and logged to audit_logs.${NC}"
else
  echo -e "${RED}❌ Superadmin intervention failed: $INTERVENE_RES${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12 INTEGRATION TESTS PASSED SUCCESSFULLY!${NC}"
echo "=========================================================="
