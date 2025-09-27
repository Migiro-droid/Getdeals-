#!/usr/bin/env node

/**
 * Test script to check if wallet KYC API returns Rukisha customer ID
 * This script will:
 * 1. Check the edge function deployment status
 * 2. Test a KYC submission and verify the response includes customer_id
 * 3. Check the database to confirm customer_id is stored
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.WMU8gNTcMKhNdKcjjcr4W7ePgE_rDfVq7zfGAqrGb7w'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'

// Test credentials
const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'testpassword123'
const KYC_TEST_DATA = {
  fullName: 'John Doe Test',
  idNumber: '12345678',
  phoneNumber: '0712345678', 
  email: TEST_EMAIL,
  kraPin: 'A123456789B',
  idType: 'national_id'
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function checkEdgeFunctionStatus() {
  console.log('\n🔍 Checking Edge Function Status...')
  
  try {
    // Try to call the register-customer function to see if it's deployed
    const { data, error } = await supabase.functions.invoke('register-customer', {
      body: { test: true }
    })
    
    if (error) {
      console.log('❌ Edge function error:', error.message)
      if (error.message.includes('Function not found')) {
        console.log('⚠️  Edge function "register-customer" is not deployed')
        return false
      }
    } else {
      console.log('✅ Edge function is deployed and accessible')
      return true
    }
  } catch (err) {
    console.log('❌ Error checking edge function:', err.message)
    return false
  }
}

async function createTestUser() {
  console.log('\n👤 Creating test user...')
  
  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
  const existing = existingUser.users?.find(u => u.email === TEST_EMAIL)
  
  if (existing) {
    console.log('✅ Test user already exists:', existing.id)
    return existing
  }
  
  // Create new test user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true
  })
  
  if (error) {
    console.error('❌ Error creating test user:', error)
    return null
  }
  
  console.log('✅ Test user created:', data.user.id)
  return data.user
}

async function signInTestUser() {
  console.log('\n🔑 Signing in test user...')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })
  
  if (error) {
    console.error('❌ Error signing in:', error)
    return null
  }
  
  console.log('✅ Signed in as:', data.user.email)
  return data.user
}

async function testKycSubmission() {
  console.log('\n🧪 Testing KYC submission...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ No active session')
      return null
    }
    
    console.log('📝 Submitting KYC data:', { 
      ...KYC_TEST_DATA, 
      kraPin: '[REDACTED]',
      idNumber: '[REDACTED]'
    })
    
    // Call the register-customer edge function directly
    const { data, error } = await supabase.functions.invoke('register-customer', {
      body: {
        first_name: KYC_TEST_DATA.fullName.split(' ')[0],
        last_name: KYC_TEST_DATA.fullName.split(' ').slice(1).join(' '),
        phone: KYC_TEST_DATA.phoneNumber,
        id_number: KYC_TEST_DATA.idNumber,
        email: KYC_TEST_DATA.email,
        kra_pin: KYC_TEST_DATA.kraPin
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    })
    
    if (error) {
      console.error('❌ KYC submission error:', error)
      return null
    }
    
    console.log('✅ KYC submission response:', data)
    
    // Check if customer_id is present in response
    if (data && data.customer_id) {
      console.log('🎉 SUCCESS: Customer ID returned from Rukisha:', data.customer_id)
      return data
    } else {
      console.log('❌ FAILED: No customer_id in response')
      console.log('Response data:', JSON.stringify(data, null, 2))
      return null
    }
    
  } catch (err) {
    console.error('❌ Error testing KYC submission:', err)
    return null
  }
}

async function checkDatabaseForCustomerId(userId) {
  console.log('\n💾 Checking database for customer_id...')
  
  try {
    // Check profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, customer_id, first_name, last_name, phone')
      .eq('user_id', userId)
      .single()
    
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message)
    } else {
      console.log('👤 Profile data:', {
        ...profile,
        customer_id: profile.customer_id || 'NOT SET'
      })
      
      if (profile.customer_id) {
        console.log('✅ Customer ID found in profile:', profile.customer_id)
      } else {
        console.log('❌ No customer_id in profile')
      }
    }
    
    // Check wallet_kyc table
    const { data: kyc, error: kycError } = await supabaseAdmin
      .from('wallet_kyc')
      .select('id, user_id, status, verified_at, created_at')
      .eq('user_id', userId)
      .single()
    
    if (kycError) {
      console.log('❌ Error fetching KYC:', kycError.message)
    } else {
      console.log('📋 KYC data:', kyc)
      
      if (kyc.status === 'verified') {
        console.log('✅ KYC status is verified')
      } else {
        console.log('❌ KYC status is not verified:', kyc.status)
      }
    }
    
    // Check wallets table
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('user_id, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .single()
    
    if (walletError) {
      console.log('❌ Error fetching wallet:', walletError.message)
    } else {
      console.log('💰 Wallet data:', wallet)
      
      if (wallet.is_active) {
        console.log('✅ Wallet is active')
      } else {
        console.log('❌ Wallet is not active')
      }
    }
    
    return {
      profile,
      kyc,
      wallet
    }
    
  } catch (err) {
    console.error('❌ Error checking database:', err)
    return null
  }
}

async function cleanup(userId) {
  console.log('\n🧹 Cleaning up test data...')
  
  try {
    // Delete test records
    await supabaseAdmin.from('wallet_kyc').delete().eq('user_id', userId)
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId)
    
    // Delete test user
    await supabaseAdmin.auth.admin.deleteUser(userId)
    
    console.log('✅ Cleanup completed')
  } catch (err) {
    console.log('⚠️  Cleanup error (non-critical):', err.message)
  }
}

async function main() {
  console.log('🚀 Testing Wallet KYC API - Rukisha Customer ID Response\n')
  console.log('=' * 60)
  
  let testUser = null
  
  try {
    // Step 1: Check edge function status
    const edgeFunctionReady = await checkEdgeFunctionStatus()
    
    if (!edgeFunctionReady) {
      console.log('\n❌ RESULT: Edge function is not ready')
      console.log('Please deploy the register-customer edge function first.')
      process.exit(1)
    }
    
    // Step 2: Create and sign in test user
    testUser = await createTestUser()
    if (!testUser) {
      console.log('❌ Failed to create test user')
      process.exit(1)
    }
    
    const signedInUser = await signInTestUser()
    if (!signedInUser) {
      console.log('❌ Failed to sign in test user')
      process.exit(1)
    }
    
    // Step 3: Test KYC submission
    const kycResult = await testKycSubmission()
    
    // Step 4: Check database
    const dbData = await checkDatabaseForCustomerId(testUser.id)
    
    // Step 5: Results summary
    console.log('\n' + '=' * 60)
    console.log('📊 TEST RESULTS SUMMARY')
    console.log('=' * 60)
    
    if (kycResult && kycResult.customer_id) {
      console.log('✅ PASS: Rukisha API returned customer_id:', kycResult.customer_id)
    } else {
      console.log('❌ FAIL: No customer_id returned from Rukisha API')
    }
    
    if (dbData?.profile?.customer_id) {
      console.log('✅ PASS: customer_id stored in database:', dbData.profile.customer_id)
    } else {
      console.log('❌ FAIL: customer_id not found in database')
    }
    
    if (dbData?.kyc?.status === 'verified') {
      console.log('✅ PASS: KYC status is verified')
    } else {
      console.log('❌ FAIL: KYC status is not verified')
    }
    
    if (dbData?.wallet?.is_active) {
      console.log('✅ PASS: Wallet is activated')
    } else {
      console.log('❌ FAIL: Wallet is not activated')
    }
    
    // Overall result
    const allPassed = kycResult?.customer_id && 
                     dbData?.profile?.customer_id && 
                     dbData?.kyc?.status === 'verified' && 
                     dbData?.wallet?.is_active
    
    if (allPassed) {
      console.log('\n🎉 OVERALL RESULT: ALL TESTS PASSED!')
      console.log('The wallet KYC API is correctly returning and storing the Rukisha customer ID.')
    } else {
      console.log('\n❌ OVERALL RESULT: SOME TESTS FAILED')
      console.log('There are issues with the KYC flow that need to be addressed.')
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error)
  } finally {
    // Step 6: Cleanup
    if (testUser) {
      await cleanup(testUser.id)
    }
  }
}

// Run the test
main().catch(console.error)