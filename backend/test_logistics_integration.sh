#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=========================================================="
echo "🚚 INTEGRATION TEST: SPPG LOGISTICS & FLEET TELEMETRY"
echo "=========================================================="

# 0. Idempotent Database Reset
PGPASSWORD=kawangizi psql -h 127.0.0.1 -U kawangizi -d kawangizi -f database/seed_sppg_logistics.sql > /dev/null 2>&1

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

# 3. SPPG 01 Bundle Fetch
echo -e "\n3. Testing GET /sppg/logistics/bundle for SPPG 01..."
BUNDLE_RES=$(curl -s -X GET "$BASE_URL/sppg/logistics/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

SUCCESS=$(echo "$BUNDLE_RES" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  KITCHEN_NAME=$(echo "$BUNDLE_RES" | jq -r '.data.kitchenName')
  TOTAL_FLEETS=$(echo "$BUNDLE_RES" | jq -r '.data.stats.total')
  MOVING_FLEETS=$(echo "$BUNDLE_RES" | jq -r '.data.stats.moving')
  BACKUP_PLATE=$(echo "$BUNDLE_RES" | jq -r '.data.backupFleet.plate')
  echo -e "${GREEN}✓ Bundle fetched successfully: Kitchen=$KITCHEN_NAME, Total Fleets=$TOTAL_FLEETS, Moving=$MOVING_FLEETS, Backup=$BACKUP_PLATE.${NC}"
else
  echo -e "${RED}❌ Failed to fetch SPPG 01 bundle: $BUNDLE_RES${NC}"
  exit 1
fi

# 4. Multi-Tenant isolation: SPPG 01 cannot bypass tenant by passing ?sppgId=SPPG-02
echo -e "\n4. Testing Multi-Tenant isolation (SPPG staff forced to own kitchen)..."
SPOOF_RES=$(curl -s -X GET "$BASE_URL/sppg/logistics/bundle?sppgId=SPPG-02" \
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
ADMIN_SPPG02_RES=$(curl -s -X GET "$BASE_URL/sppg/logistics/bundle?sppgId=SPPG-02" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

ADMIN_DEPOT=$(echo "$ADMIN_SPPG02_RES" | jq -r '.data.sppgId')
ADMIN_KITCHEN=$(echo "$ADMIN_SPPG02_RES" | jq -r '.data.kitchenName')
if [ "$ADMIN_DEPOT" = "SPPG-02" ]; then
  echo -e "${GREEN}✓ Superadmin cross-tenant inspection verified: Inspected $ADMIN_DEPOT ($ADMIN_KITCHEN).${NC}"
else
  echo -e "${RED}❌ Superadmin inspection failed! Expected SPPG-02, got: $ADMIN_DEPOT${NC}"
  exit 1
fi

# Extract target active fleet ID from SPPG-01 bundle
FLEET_ID=$(echo "$BUNDLE_RES" | jq -r '.data.fleets[0].id')
if [ -z "$FLEET_ID" ] || [ "$FLEET_ID" = "null" ]; then
  echo -e "${RED}❌ No fleet ID found in SPPG 01 bundle.${NC}"
  exit 1
fi
echo -e "${YELLOW}Using target fleet: $FLEET_ID${NC}"

# 6. IoT Telemetry Update
echo -e "\n6. Testing PUT /sppg/logistics/fleets/$FLEET_ID/telemetry..."
TELEMETRY_RES=$(curl -s -X PUT "$BASE_URL/sppg/logistics/fleets/$FLEET_ID/telemetry" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boxTempC": 64.2,
    "speedKph": 42.5,
    "progress": 0.65,
    "lat": -6.215000,
    "lng": 106.840000
  }')

TEL_SUCCESS=$(echo "$TELEMETRY_RES" | jq -r '.success')
if [ "$TEL_SUCCESS" = "true" ]; then
  UPDATED_TEMP=$(echo "$TELEMETRY_RES" | jq -r '.data.boxTempC')
  UPDATED_PROGRESS=$(echo "$TELEMETRY_RES" | jq -r '.data.progress')
  echo -e "${GREEN}✓ Telemetry updated successfully: Temp=${UPDATED_TEMP}°C, Progress=${UPDATED_PROGRESS}.${NC}"
else
  echo -e "${RED}❌ Failed to update telemetry: $TELEMETRY_RES${NC}"
  exit 1
fi

# 7. School Delivery Notification Broadcast
echo -e "\n7. Testing POST /sppg/logistics/fleets/$FLEET_ID/notify..."
NOTIF_RES=$(curl -s -X POST "$BASE_URL/sppg/logistics/fleets/$FLEET_ID/notify" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientPhone": "+6281122334455",
    "message": "Driver mendekati gerbang sekolah dalam 5 menit."
  }')

NOTIF_SUCCESS=$(echo "$NOTIF_RES" | jq -r '.success')
if [ "$NOTIF_SUCCESS" = "true" ]; then
  NOTIF_ID=$(echo "$NOTIF_RES" | jq -r '.data.id')
  echo -e "${GREEN}✓ Notification broadcast sent successfully: ID=$NOTIF_ID.${NC}"
else
  echo -e "${RED}❌ Failed to send notification: $NOTIF_RES${NC}"
  exit 1
fi

# 8. RBAC Verification: SPPG User blocked from Superadmin Intervention
echo -e "\n8. Testing RBAC: SPPG staff blocked from Superadmin intervention..."
FORBIDDEN_RES=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/sppg/logistics/intervention" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleetId": "'"$FLEET_ID"'",
    "action": "recall",
    "reason": "Uji coba akses SPPG staff"
  }')

HTTP_CODE=$(echo "$FORBIDDEN_RES" | grep "HTTP_STATUS" | cut -d':' -f2)
if [ "$HTTP_CODE" = "403" ]; then
  echo -e "${GREEN}✓ RBAC verified: SPPG staff received 403 Forbidden as required.${NC}"
else
  echo -e "${RED}❌ RBAC failure! Expected 403 Forbidden, got: $HTTP_CODE${NC}"
  exit 1
fi

# 9. Superadmin Emergency Intervention
echo -e "\n9. Testing Superadmin emergency intervention (reroute)..."
INTERVENTION_RES=$(curl -s -X POST "$BASE_URL/sppg/logistics/intervention" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleetId": "'"$FLEET_ID"'",
    "action": "reroute",
    "reason": "Jalur utama mengalami penutupan sementara, alihkan via Jl. Gatot Subroto."
  }')

INT_SUCCESS=$(echo "$INTERVENTION_RES" | jq -r '.success')
if [ "$INT_SUCCESS" = "true" ]; then
  ACTION=$(echo "$INTERVENTION_RES" | jq -r '.data.action')
  echo -e "${GREEN}✓ Superadmin intervention executed successfully: Action=$ACTION.${NC}"
else
  echo -e "${RED}❌ Failed to execute superadmin intervention: $INTERVENTION_RES${NC}"
  exit 1
fi

# 10. Emergency Backup Fleet Dispatch (Target fleet with issue, e.g. fl-04-sppg01 which is 'mogok')
TROUBLED_FLEET_ID="fl-04-sppg01"
echo -e "\n10. Testing Emergency Backup Fleet Dispatch for troubled fleet $TROUBLED_FLEET_ID..."
DISPATCH_RES=$(curl -s -X POST "$BASE_URL/sppg/logistics/fleets/$TROUBLED_FLEET_ID/dispatch-backup" \
  -H "Authorization: Bearer $SPPG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Kendaraan utama mengalami kendala mesin mogok, luncurkan armada cadangan segera."
  }')

DISP_SUCCESS=$(echo "$DISPATCH_RES" | jq -r '.success')
if [ "$DISP_SUCCESS" = "true" ]; then
  BACKUP_PLATE=$(echo "$DISPATCH_RES" | jq -r '.data.plate')
  echo -e "${GREEN}✓ Backup fleet dispatched successfully! Assigned vehicle: $BACKUP_PLATE.${NC}"
else
  echo -e "${RED}❌ Failed to dispatch backup fleet: $DISPATCH_RES${NC}"
  exit 1
fi

# 11. Final verification: Check bundle to confirm fleet statuses updated in DB
echo -e "\n11. Final Verification: Validating updated fleet states in database..."
FINAL_BUNDLE=$(curl -s -X GET "$BASE_URL/sppg/logistics/bundle" \
  -H "Authorization: Bearer $SPPG_TOKEN")

ASSIGNED_FLEET=$(echo "$FINAL_BUNDLE" | jq -r '.data.backupFleet.plate // empty')
BACKUP_STATUS=$(echo "$FINAL_BUNDLE" | jq -r '.data.backupFleet.status // empty')
ORIGINAL_STATUS=$(echo "$FINAL_BUNDLE" | jq -r '.data.fleets[] | select(.id=="fl-04-sppg01") | .status')

if [ "$ASSIGNED_FLEET" = "B-9777-CDG" ] && [ "$BACKUP_STATUS" = "jalan" ] && [ "$ORIGINAL_STATUS" = "kembali" ]; then
  echo -e "${GREEN}✓ Database state verified: Backup vehicle $ASSIGNED_FLEET is now active ($BACKUP_STATUS), troubled vehicle status is $ORIGINAL_STATUS.${NC}"
else
  echo -e "${RED}❌ Database state verification failed. Backup: $ASSIGNED_FLEET ($BACKUP_STATUS), Troubled status: $ORIGINAL_STATUS${NC}"
  exit 1
fi

echo -e "\n=========================================================="
echo -e "${GREEN}🎉 ALL 11 SPPG LOGISTICS INTEGRATION TESTS PASSED!${NC}"
echo "=========================================================="
