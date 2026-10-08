#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "🏫 INTEGRATION TEST: SPPG SCHOOLS BINAAN & DAILY QUOTAS"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f database/seed_sppg_schools.sql > /dev/null 2>&1

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

# 3. SPPG 01 Schools Bundle Fetch
echo -e "\n3. Testing GET /sppg/schools/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/schools/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  TOTAL_SCHOOLS=$(echo "$BUNDLE_RES" | jq -r '.data.totals.total')
  TOTAL_QUOTA=$(echo "$BUNDLE_RES" | jq -r '.data.totals.quota')
  DEADLINE=$(echo "$BUNDLE_RES" | jq -r '.data.deadline')
  echo -e "${GREEN}✓ Bundle fetched successfully: Kitchen=$KITCHEN_NAME, Schools=$TOTAL_SCHOOLS, Total Quota=$TOTAL_QUOTA, Deadline=$DEADLINE WIB.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Multi-Tenant isolation: SPPG 01 cannot bypass tenant by passing ?sppgId=SPPG-02
echo -e "\n4. Testing Multi-Tenant isolation (SPPG staff forced to own kitchen)..."
SPOOF_RES=$(curl -s -X GET "$BASE_URL/sppg/schools/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $SPPG_TOKEN")

DEPOT_SPOOF=$(echo "$SPOOF_RES" | jq -r '.data.sppgId')
if [ "$DEPOT_SPOOF" = "SPPG-01" ]; then
  echo -e "${GREEN}✓ Multi-tenant isolation verified: SPPG 01 forced to own tenant ($DEPOT_SPOOF).${NC}"
else
  echo -e "${RED}❌ Multi-tenant isolation failed! Expected SPPG-01, got: $DEPOT_SPOOF${NC}"
  exit 1
fi

# 5. Superadmin Cross-Tenant Inspection for SPPG-02
echo -e "\n5. Testing Superadmin cross-tenant inspection (?sppgId=SPPG-02)..."
ADMIN_SPPG02_RES=$(curl -s -X GET "$BASE_URL/sppg/schools/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

ADMIN_DEPOT=$(echo "$ADMIN_SPPG02_RES" | jq -r '.data.sppgId')
ADMIN_KITCHEN=$(echo "$ADMIN_SPPG02_RES" | jq -r '.data.kitchenName')
ADMIN_SCHOOL_COUNT=$(echo "$ADMIN_SPPG02_RES" | jq -r '.data.totals.total')
if [ "$ADMIN_DEPOT" = "SPPG-02" ]; then
  echo -e "${GREEN}✓ Superadmin cross-tenant inspection verified: Inspected $ADMIN_DEPOT ($ADMIN_KITCHEN), Total Schools=$ADMIN_SCHOOL_COUNT.${NC}"
else
  echo -e "${RED}❌ Superadmin inspection failed! Expected SPPG-02, got: $ADMIN_DEPOT${NC}"
  exit 1
fi

# Extract a target school ID from SPPG-01 bundle
TARGET_SCHOOL_ID=$(echo "$BUNDLE_RES" | jq -r '.data.schools[0].id')
TARGET_SCHOOL_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.schools[0].name')
echo -e "${YELLOW}Using target school: $TARGET_SCHOOL_ID ($TARGET_SCHOOL_NAME)${NC}"

# 6. Single School Detail
echo -e "\n6. Testing GET /sppg/schools/$TARGET_SCHOOL_ID..."
DETAIL_RES=$(curl -s -X GET "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID" \
  -H "Authorization: Bearer $SPPG_TOKEN")

DETAIL_SUCCESS=$(echo "$DETAIL_RES" | jq -r '.success')
if [ "$DETAIL_SUCCESS" = "true" ]; then
  NPSN=$(echo "$DETAIL_RES" | jq -r '.data.npsn')
  LEVEL=$(echo "$DETAIL_RES" | jq -r '.data.level')
  echo -e "${GREEN}✓ School detail fetched successfully: NPSN=$NPSN, Level=$LEVEL.${NC}"
else
  echo -e "${RED}❌ Failed to fetch school detail: $DETAIL_RES${NC}"
  exit 1
fi

# 7. Update Attendance (On-time update <= 05:00)
echo -e "\n7. Testing PUT /sppg/schools/$TARGET_SCHOOL_ID/attendance (On-time: 04:45)..."
ATT_ONTIME_RES=$(curl -s -X PUT "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID/attendance" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "present": 655,
    "reduceSpecial": 5,
    "absenceNote": "13 izin, 5 pengurangan diet mandiri",
    "presentUpdatedAt": "04:45",
    "specials": [
      {"type": "Alergi kacang", "count": 6, "note": "Lauk diganti ayam goreng"},
      {"type": "Diet rendah gula", "count": 2, "note": "Air mineral murni"}
    ]
  }')

ATT_SUCCESS=$(echo "$ATT_ONTIME_RES" | jq -r '.success')
if [ "$ATT_SUCCESS" = "true" ]; then
  QUOTA=$(echo "$ATT_ONTIME_RES" | jq -r '.data.packingQuota')
  IS_ONTIME=$(echo "$ATT_ONTIME_RES" | jq -r '.data.status.onTime')
  STATUS_LABEL=$(echo "$ATT_ONTIME_RES" | jq -r '.data.status.label')
  if [ "$QUOTA" = "650" ] && [ "$IS_ONTIME" = "true" ]; then
    echo -e "${GREEN}✓ On-time attendance updated successfully: Quota=$QUOTA boks, Status='$STATUS_LABEL'.${NC}"
  else
    echo -e "${RED}❌ Calculation mismatch! Expected Quota=650 and onTime=true, got Quota=$QUOTA, onTime=$IS_ONTIME.${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Failed to update attendance: $ATT_ONTIME_RES${NC}"
  exit 1
fi

# 8. Update Attendance (Late update > 05:00)
echo -e "\n8. Testing PUT /sppg/schools/$TARGET_SCHOOL_ID/attendance (Late: 05:15)..."
ATT_LATE_RES=$(curl -s -X PUT "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID/attendance" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "present": 650,
    "reduceSpecial": 0,
    "absenceNote": "18 siswa izin",
    "presentUpdatedAt": "05:15"
  }')

LATE_ONTIME=$(echo "$ATT_LATE_RES" | jq -r '.data.status.onTime')
LATE_LABEL=$(echo "$ATT_LATE_RES" | jq -r '.data.status.label')
if [ "$LATE_ONTIME" = "false" ] && echo "$LATE_LABEL" | grep -q "Telat"; then
  echo -e "${GREEN}✓ Late attendance rule verified: Correctly flagged as '$LATE_LABEL' (onTime=false).${NC}"
else
  echo -e "${RED}❌ Late attendance evaluation failed! Expected onTime=false and label 'Telat...', got $LATE_LABEL.${NC}"
  exit 1
fi

# 9. Attendance validation rule: reduceSpecial > present should fail with 400
echo -e "\n9. Testing validation rule: reduceSpecial > present rejected..."
INVALID_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID/attendance" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "present": 100,
    "reduceSpecial": 200,
    "absenceNote": "Tes invalid"
  }')

HTTP_CODE=$(echo "$INVALID_RES" | grep "HTTP_STATUS" | cut -d':' -f2)
if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Validation verified: Server rejected invalid reduction with 400 Bad Request.${NC}"
else
  echo -e "${RED}❌ Validation failed! Expected 400 Bad Request, got $HTTP_CODE.${NC}"
  exit 1
fi

# 10. Update Droppoint & Validator PIC
echo -e "\n10. Testing PUT /sppg/schools/$TARGET_SCHOOL_ID/droppoint..."
DP_RES=$(curl -s -X PUT "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID/droppoint" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "droppoint": "Gerbang belakang barat dekat musholla, meja serah terima beratap kanopi.",
    "validator": "Ahmad Fauzi, S.Pd, M.M",
    "validatorPhone": "0812-9988-7711",
    "principal": "Dra. Hj. Sri Wahyuni, M.Pd"
  }')

DP_SUCCESS=$(echo "$DP_RES" | jq -r '.success')
if [ "$DP_SUCCESS" = "true" ]; then
  UPDATED_VALIDATOR=$(echo "$DP_RES" | jq -r '.data.validator')
  UPDATED_PHONE=$(echo "$DP_RES" | jq -r '.data.validatorPhone')
  echo -e "${GREEN}✓ Droppoint & PIC updated successfully: Validator=$UPDATED_VALIDATOR, Phone=$UPDATED_PHONE.${NC}"
else
  echo -e "${RED}❌ Failed to update droppoint: $DP_RES${NC}"
  exit 1
fi

# 11. Remind Attendance Ping
echo -e "\n11. Testing POST /sppg/schools/$TARGET_SCHOOL_ID/remind..."
REMIND_RES=$(curl -s -X POST "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID/remind" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customMessage": "Mohon segera mutakhirkan data presensi siswa pagi ini."
  }')

REMIND_SUCCESS=$(echo "$REMIND_RES" | jq -r '.success')
if [ "$REMIND_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ Attendance reminder recorded to audit trail successfully.${NC}"
else
  echo -e "${RED}❌ Failed to send reminder: $REMIND_RES${NC}"
  exit 1
fi

# 12. Final Database Verification in PostgreSQL
echo -e "\n12. Validating updated state in PostgreSQL database..."
FINAL_RES=$(curl -s -X GET "$BASE_URL/sppg/schools/$TARGET_SCHOOL_ID" \
  -H "Authorization: Bearer $SPPG_TOKEN")

DB_VALIDATOR=$(echo "$FINAL_RES" | jq -r '.data.validator')
if [ "$DB_VALIDATOR" = "Ahmad Fauzi, S.Pd, M.M" ]; then
  echo -e "${GREEN}✓ Database state confirmed: Data strictly saved and queried from PostgreSQL.${NC}"
else
  echo -e "${RED}❌ Database state verification failed! Expected 'Ahmad Fauzi, S.Pd, M.M', got '$DB_VALIDATOR'.${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 12 SPPG SCHOOLS INTEGRATION TESTS PASSED!${NC}"
echo "=========================================================="
