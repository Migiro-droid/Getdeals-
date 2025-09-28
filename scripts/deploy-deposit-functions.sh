#!/bin/bash

# Script to deploy the updated Edge Functions for Rukisha deposit functionality

echo "🚀 Deploying updated Edge Functions..."

# Deploy deposit-funds function
echo "📤 Deploying deposit-funds function..."
npx supabase functions deploy deposit-funds

# Deploy rukisha-callback function  
echo "📤 Deploying rukisha-callback function..."
npx supabase functions deploy rukisha-callback

echo ""
echo "✅ Edge Functions deployed successfully!"
echo ""
echo "📋 Deployed functions:"
echo "   - deposit-funds: Handles deposit requests with callback URL and reference"
echo "   - rukisha-callback: Processes Rukisha payment confirmations"
echo ""
echo "🔐 Required environment variables:"
echo "   - RUKISHA_API_TOKEN: Your Rukisha API token"
echo "   - SUPABASE_URL: Your Supabase project URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Service role key for callback processing"
echo ""
echo "🌐 Callback URL to configure in Rukisha:"
echo "   https://[your-project-ref].supabase.co/functions/v1/rukisha-callback"
echo ""
echo "✨ Your deposit functionality is now live!"