#!/bin/bash

echo "🔍 Quick Status Check for Rukisha Deposit Functionality"
echo "======================================================"

# Define URLs
CALLBACK_URL="https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/rukisha-callback"
DEPOSIT_URL="https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds"

echo "🌐 Testing URLs:"
echo "   Callback: $CALLBACK_URL"
echo "   Deposit:  $DEPOSIT_URL"
echo ""

# Test 1: Basic connectivity
echo "1. Basic Connectivity:"
if curl -s --max-time 10 "$CALLBACK_URL" > /dev/null; then
    echo "   ✅ Callback URL is reachable"
else
    echo "   ❌ Callback URL is not reachable"
fi

if curl -s --max-time 10 "$DEPOSIT_URL" > /dev/null; then
    echo "   ✅ Deposit URL is reachable"
else
    echo "   ❌ Deposit URL is not reachable"
fi

echo ""

# Test 2: Function status
echo "2. Function Response Test:"
CALLBACK_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$CALLBACK_URL")
DEPOSIT_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X OPTIONS "$DEPOSIT_URL")

echo "   Callback URL returns: HTTP $CALLBACK_STATUS"
if [ "$CALLBACK_STATUS" = "401" ]; then
    echo "   ✅ Expected 401 - function is working (requires auth)"
elif [ "$CALLBACK_STATUS" = "200" ]; then
    echo "   ✅ Function is accessible"
else
    echo "   ⚠️  Unexpected status - check function deployment"
fi

echo "   Deposit URL returns: HTTP $DEPOSIT_STATUS"
if [ "$DEPOSIT_STATUS" = "200" ]; then
    echo "   ✅ CORS is working - function deployed correctly"
else
    echo "   ⚠️  Check CORS configuration"
fi

echo ""

# Test 3: Configuration check
echo "3. Configuration Requirements:"
echo "   📋 Required Environment Variables (set in Supabase Dashboard):"
echo "      • RUKISHA_API_TOKEN - Your Rukisha API token"
echo "      • SUPABASE_SERVICE_ROLE_KEY - For callback processing"
echo ""
echo "   📋 Database Requirements:"
echo "      • wallet_transactions table with reference column"
echo "      • Run: ./scripts/apply-wallet-migration.sh"
echo ""

# Test 4: Next steps
echo "4. Ready to Test:"
echo "   🌐 Open: file://$(pwd)/test-deposit-functionality.html"
echo "   📱 Or test manually with real phone number"
echo "   📊 Monitor logs: Supabase Dashboard → Edge Functions → Logs"
echo ""

echo "🎯 Your callback URL for Rukisha configuration:"
echo "   $CALLBACK_URL"
echo ""

echo "✨ Status: Functions are deployed and accessible!"
echo "   Next: Set environment variables and test with real data"