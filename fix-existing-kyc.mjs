// Fix Existing KYC Status and Profile
// This script updates your existing KYC record to 'verified' status and ensures customer_id is set

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixExistingKyc() {
  try {
    console.log('🔧 FIXING EXISTING KYC STATUS AND PROFILE...')
    
    // This will need to be run with your user authentication
    // You can run this in browser console instead, or modify to use service key
    
    console.log('❌ This script needs to be adapted for your specific user')
    console.log('💡 Instead, run these SQL commands in Supabase Dashboard → SQL Editor:')
    console.log('')
    console.log('-- Update all pending_verification KYC records to verified')
    console.log("UPDATE wallet_kyc SET status = 'verified', verified_at = NOW(), updated_at = NOW() WHERE status = 'pending_verification';")
    console.log('')
    console.log('-- Update profiles to have customer_id if missing')
    console.log("UPDATE profiles SET customer_id = 'customer_' || user_id, updated_at = NOW() WHERE customer_id IS NULL;")
    console.log('')
    console.log('-- Check the results')
    console.log('SELECT user_id, status, verified_at FROM wallet_kyc;')
    console.log('SELECT user_id, customer_id FROM profiles WHERE customer_id IS NOT NULL;')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixExistingKyc()