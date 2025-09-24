import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjgwmmafqppzkiprqvdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZ3dtbWFmcXBwemtpcHJxdmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MTc5NjMsImV4cCI6MjA0MjQ5Mzk2M30.FMPeEOt2UrvjjVKJ1LYbIzK5VKdHa4mPmjkI0LQcGV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKycData() {
  try {
    console.log('🔍 Checking KYC data...');
    
    // Get all wallet_kyc records to see what's there
    const { data: allKycData, error: kycError } = await supabase
      .from('wallet_kyc')
      .select('*');
    
    if (kycError) {
      console.error('❌ Error fetching KYC data:', kycError);
      return;
    }
    
    console.log('📊 All KYC Data:', allKycData);
    
    if (allKycData && allKycData.length > 0) {
      const latestKyc = allKycData[allKycData.length - 1];
      console.log('📋 Latest KYC record:', latestKyc);
      console.log('📞 Phone number field:', latestKyc.phone_number || latestKyc.phoneNumber);
      console.log('👤 Full name field:', latestKyc.full_name || latestKyc.fullName);
      console.log('🆔 ID number field:', latestKyc.id_number || latestKyc.idNumber);
      console.log('✅ Status:', latestKyc.status);
    }
    
    // Also check profiles table for phone number
    const { data: allProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
    } else {
      console.log('👥 All Profiles:', allProfiles);
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

debugKycData();