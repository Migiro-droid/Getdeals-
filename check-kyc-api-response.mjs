#!/usr/bin/env node

/**
 * Check KYC API Response Flow
 * This script analyzes the current KYC implementation to see if it's returning Rukisha customer IDs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyFpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function checkExistingKycData() {
  console.log('🔍 Checking existing KYC submissions...\n')
  
  try {
    // Get recent KYC submissions
    const { data: kycData, error: kycError } = await supabase
      .from('wallet_kyc')
      .select('id, user_id, full_name, status, verified_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (kycError) {
      console.log('❌ Error fetching KYC data:', kycError.message)
      return
    }
    
    console.log(`📋 Found ${kycData.length} recent KYC submissions:`)
    console.table(kycData.map(kyc => ({
      id: kyc.id.substring(0, 8) + '...',
      name: kyc.full_name,
      status: kyc.status,
      verified: kyc.verified_at ? 'Yes' : 'No',
      created: new Date(kyc.created_at).toLocaleString()
    })))
    
    // Check profiles for customer_ids
    if (kycData.length > 0) {
      const userIds = kycData.map(kyc => kyc.user_id)
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, customer_id, first_name, last_name, phone')
        .in('user_id', userIds)
      
      if (profileError) {
        console.log('❌ Error fetching profiles:', profileError.message)
        return
      }
      
      console.log('\n👤 Corresponding profiles:')
      console.table(profiles.map(profile => ({
        user_id: profile.user_id.substring(0, 8) + '...',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        phone: profile.phone,
        customer_id: profile.customer_id || 'NOT SET',
        has_rukisha_id: profile.customer_id ? 'YES' : 'NO'
      })))
      
      // Count how many have customer_ids
      const withCustomerId = profiles.filter(p => p.customer_id).length
      const total = profiles.length
      
      console.log(`\n📊 Analysis:`)
      console.log(`   • ${withCustomerId}/${total} profiles have customer_id set`)
      console.log(`   • ${total - withCustomerId}/${total} profiles missing customer_id`)
      
      if (withCustomerId === 0) {
        console.log('\n❌ ISSUE: No profiles have customer_id from Rukisha')
        console.log('   This suggests the KYC API is not returning Rukisha customer IDs')
      } else if (withCustomerId < total) {
        console.log('\n⚠️  PARTIAL: Some profiles have customer_id, others don\'t')
        console.log('   This suggests intermittent issues with Rukisha API integration')
      } else {
        console.log('\n✅ GOOD: All profiles have customer_id')
        console.log('   KYC API appears to be working correctly')
      }
    } else {
      console.log('\n❌ No KYC submissions found to analyze')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function checkEdgeFunctionExists() {
  console.log('\n🔧 Checking edge function deployment...')
  
  try {
    // Try to get edge function info (this will fail if not deployed)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-customer`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    })
    
    if (response.ok || response.status === 405) { // 405 = Method Not Allowed is expected for OPTIONS
      console.log('✅ Edge function "register-customer" is deployed')
      return true
    } else {
      console.log('❌ Edge function "register-customer" not found or not accessible')
      return false
    }
  } catch (error) {
    console.log('❌ Error checking edge function:', error.message)
    return false
  }
}

async function analyzeFrontendImplementation() {
  console.log('\n💻 Analyzing frontend KYC implementation...')
  
  // This would analyze the source code, but since we can't read files in this context,
  // we'll provide guidance on what to check
  
  console.log(`
📝 Manual checks needed in source code:

1. Check src/services/wallet-kyc.ts:
   - Does submitKyc() call supabase.functions.invoke('register-customer')?
   - Does it handle the response customer_id properly?
   - Is there error handling for Rukisha API failures?

2. Check supabase/functions/register-customer/index.ts:
   - Is the function deployed to Supabase?
   - Does it call the correct Rukisha API endpoint?
   - Does it return customer_id in the response?
   - Are environment variables set correctly?

3. Check environment variables:
   - RUKISHA_API_URL
   - RUKISHA_API_TOKEN  
   - RUKISHA_AGENT_ID

Key indicators to look for:
   ✅ Edge function calls Rukisha API
   ✅ Rukisha API returns customer object with ID
   ✅ Edge function stores customer_id in profiles table
   ✅ Edge function returns customer_id to frontend
   ✅ Frontend handles the customer_id response
`)
}

async function main() {
  console.log('🕵️  KYC API Response Analysis\n')
  console.log('=' * 50)
  
  // Check existing data
  await checkExistingKycData()
  
  // Check edge function
  await checkEdgeFunctionExists()
  
  // Provide manual analysis guidance
  await analyzeFrontendImplementation()
  
  console.log('\n' + '=' * 50)
  console.log('🎯 RECOMMENDATIONS:')
  console.log('=' * 50)
  
  console.log(`
1. If no customer_ids are found:
   • Verify the register-customer edge function is deployed
   • Check Rukisha API credentials in edge function environment
   • Test the edge function directly with sample data

2. If some customer_ids are missing:
   • Check edge function logs for errors
   • Verify Rukisha API rate limits or authentication issues
   • Test with different KYC data to see if it's data-specific

3. If customer_ids are present:
   • The KYC API is working correctly
   • Monitor for any recent failures or changes

4. To test manually:
   • Run: node test-kyc-rukisha-response.mjs
   • Or submit KYC through the UI and check the database
`)
}

main().catch(console.error)