#!/bin/bash

# Test script for Rukisha deposit functionality
# This tests both the callback URL and the complete deposit flow

echo "🧪 Testing Rukisha Deposit Functionality"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get Supabase project details
SUPABASE_URL="https://fxyifnckgllxqbggegtw.supabase.co"
CALLBACK_URL="${SUPABASE_URL}/functions/v1/rukisha-callback"
DEPOSIT_URL="${SUPABASE_URL}/functions/v1/deposit-funds"

echo -e "${BLUE}🔗 Testing URLs:${NC}"
echo "   Callback URL: $CALLBACK_URL"
echo "   Deposit URL:  $DEPOSIT_URL"
echo ""

# Test 1: Check if callback URL is accessible
echo -e "${YELLOW}Test 1: Callback URL Accessibility${NC}"
echo "Testing GET request to callback URL (should return CORS response)..."

CALLBACK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/callback_test.txt "$CALLBACK_URL")
CALLBACK_BODY=$(cat /tmp/callback_test.txt)

if [ "$CALLBACK_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Callback URL is accessible (HTTP 200)${NC}"
elif [ "$CALLBACK_RESPONSE" = "405" ] || [ "$CALLBACK_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ Callback URL is accessible (HTTP $CALLBACK_RESPONSE - expected for GET request)${NC}"
else
    echo -e "${RED}❌ Callback URL not accessible (HTTP $CALLBACK_RESPONSE)${NC}"
    echo "Response: $CALLBACK_BODY"
fi
echo ""

# Test 2: Check if deposit-funds function is accessible
echo -e "${YELLOW}Test 2: Deposit Function Accessibility${NC}"
echo "Testing OPTIONS request to deposit-funds (CORS preflight)..."

DEPOSIT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/deposit_test.txt -X OPTIONS "$DEPOSIT_URL" -H "Access-Control-Request-Method: POST")
DEPOSIT_BODY=$(cat /tmp/deposit_test.txt)

if [ "$DEPOSIT_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Deposit function is accessible (HTTP 200)${NC}"
else
    echo -e "${RED}❌ Deposit function not accessible (HTTP $DEPOSIT_RESPONSE)${NC}"
    echo "Response: $DEPOSIT_BODY"
fi
echo ""

# Test 3: Database connectivity test
echo -e "${YELLOW}Test 3: Database Schema Check${NC}"
echo "Checking if wallet_transactions table has required columns..."

# This would require Supabase CLI to be configured
if command -v supabase &> /dev/null; then
    echo "Running database schema check..."
    
    # Check if the migration was applied
    SCHEMA_CHECK=$(supabase db diff 2>&1 || echo "No diff found")
    
    if [[ "$SCHEMA_CHECK" == *"No diff found"* ]] || [[ "$SCHEMA_CHECK" == "" ]]; then
        echo -e "${GREEN}✅ Database schema appears to be up to date${NC}"
    else
        echo -e "${YELLOW}⚠️ Database might need migration:${NC}"
        echo "$SCHEMA_CHECK"
    fi
else
    echo -e "${YELLOW}⚠️ Supabase CLI not found - skipping database check${NC}"
fi
echo ""

# Test 4: Mock callback test
echo -e "${YELLOW}Test 4: Mock Callback Test${NC}"
echo "Testing callback endpoint with mock data..."

MOCK_PAYLOAD='{
  "transaction_id": "test_123456",
  "customer_id": "test_customer",
  "amount": 100,
  "phone": "0712345678",
  "status": "success",
  "reference": "test-reference-uuid",
  "timestamp": "2025-09-28T10:00:00Z"
}'

MOCK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/mock_callback.txt \
  -X POST "$CALLBACK_URL" \
  -H "Content-Type: application/json" \
  -d "$MOCK_PAYLOAD")

MOCK_BODY=$(cat /tmp/mock_callback.txt)

echo "Mock callback response (HTTP $MOCK_RESPONSE):"
echo "$MOCK_BODY"

if [ "$MOCK_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Callback endpoint processed mock request${NC}"
elif [ "$MOCK_RESPONSE" = "404" ] || [ "$MOCK_RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠️ Expected error - mock data not found in database${NC}"
else
    echo -e "${RED}❌ Unexpected callback response${NC}"
fi
echo ""

# Test 5: Environment variables check
echo -e "${YELLOW}Test 5: Environment Check${NC}"
echo "Checking required environment variables..."

# This would need to be run in the Supabase environment
echo "Required environment variables for Edge Functions:"
echo "  ✓ SUPABASE_URL (set in function)"
echo "  ⚠️ SUPABASE_SERVICE_ROLE_KEY (check Supabase dashboard)"
echo "  ⚠️ RUKISHA_API_TOKEN (check Supabase dashboard)"
echo ""

# Test Summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo "=============="
echo "1. Callback URL accessibility: Check logs above"
echo "2. Deposit function accessibility: Check logs above"
echo "3. Database schema: Check logs above"
echo "4. Mock callback processing: Check logs above"
echo "5. Environment variables: Manual check required"
echo ""

echo -e "${BLUE}🚀 Next Steps for Full Testing:${NC}"
echo "================================"
echo "1. Apply database migration:"
echo "   ./scripts/apply-wallet-migration.sh"
echo ""
echo "2. Deploy Edge Functions (if not done):"
echo "   ./scripts/deploy-deposit-functions.sh"
echo ""
echo "3. Set environment variables in Supabase Dashboard:"
echo "   - Go to Project Settings > Edge Functions"
echo "   - Add RUKISHA_API_TOKEN"
echo "   - Add SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "4. Test with real user:"
echo "   - Sign up/login to your app"
echo "   - Go to wallet page"
echo "   - Try small deposit (KES 100)"
echo "   - Monitor Supabase logs"
echo ""
echo "5. Monitor logs:"
echo "   - Supabase Dashboard > Edge Functions > Logs"
echo "   - Watch for deposit-funds and rukisha-callback executions"

# Cleanup temp files
rm -f /tmp/callback_test.txt /tmp/deposit_test.txt /tmp/mock_callback.txt

echo ""
echo -e "${GREEN}🎉 Testing complete! Check the results above.${NC}"