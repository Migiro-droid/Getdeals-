import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Target user id - reasonable assumption it's your dev account
const TARGET_USER_ID = '6e925ee3-dc85-415a-b40c-f36b8c982f90'
const phone = '0712345678'

async function run() {
  try {
    const simulatedCustomerId = `test_customer_${Date.now()}`

    // Upsert profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: TARGET_USER_ID,
        user_id: TARGET_USER_ID,
        first_name: 'Dev',
        last_name: 'User',
        phone,
        customer_id: simulatedCustomerId,
        email_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      process.exit(1)
    }

    console.log('Profile upserted:', profileData)

    // Upsert wallet (activate)
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .upsert({
        user_id: TARGET_USER_ID,
        is_active: true,
        balance: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()

    if (walletError) {
      console.error('Wallet upsert error:', walletError)
      process.exit(1)
    }

    console.log('Wallet upserted:', walletData)

    // Update wallet_kyc status to verified
    // The wallet_kyc table requires several NOT NULL fields (full_name, id_number, phone_number, email, kra_pin).
    // Provide sensible test values so the upsert won't violate constraints during dev/testing.
    const simulatedFullName = 'Dev User'
    const simulatedIdNumber = '12345678'
    const simulatedEmail = `dev+${Date.now()}@example.com`
    const simulatedKraPin = 'A000000000K'
    const simulatedIdType = 'national_id'

    const { error: kycError } = await supabase
      .from('wallet_kyc')
      .upsert({
        user_id: TARGET_USER_ID,
        full_name: simulatedFullName,
        id_number: simulatedIdNumber,
        phone_number: phone,
        email: simulatedEmail,
        kra_pin: simulatedKraPin,
        id_type: simulatedIdType,
        status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (kycError) {
      console.error('KYC upsert error:', kycError)
      // continue
    } else {
      console.log('KYC upserted/verified for user')
    }

    // Confirm profile
    const { data: profileCheck, error: checkError } = await supabase
      .from('profiles')
      .select('id,user_id,customer_id,phone,first_name,last_name')
      .eq('user_id', TARGET_USER_ID)
      .single()

    console.log('Profile check:', { profileCheck, checkError })

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

run()
