import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fxyifnckgllxqbggegtw.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'
);

async function analyzeKycData() {
  console.log('📊 KYC + Profile Analysis\n');

  // Get KYC data
  const { data: kycData, error: kycError } = await supabase
    .from('wallet_kyc')
    .select('user_id, full_name, status, verified_at, created_at')
    .order('created_at', { ascending: false });

  if (kycError) {
    console.error('Error:', kycError);
    return;
  }

  // Get profiles
  const userIds = kycData.map(d => d.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, customer_id, first_name, last_name, phone')
    .in('user_id', userIds);

  if (profileError) {
    console.error('Error:', profileError);
    return;
  }

  // Combine data
  const combined = kycData.map(kyc => {
    const profile = profiles.find(p => p.user_id === kyc.user_id);
    return { ...kyc, profile };
  });

  console.log('KYC Records and Customer IDs:');
  console.table(combined.map(d => ({
    name: d.full_name,
    customer_id: d.profile?.customer_id || 'NOT SET',
    is_rukisha: d.profile?.customer_id && !d.profile.customer_id.startsWith('customer_') ? '✅ YES' : '❌ NO',
    phone: d.profile?.phone || 'Not set'
  })));

  // Analysis
  const withRukisha = combined.filter(d => 
    d.profile?.customer_id && !d.profile.customer_id.startsWith('customer_')
  );
  const withSimulated = combined.filter(d => 
    d.profile?.customer_id && d.profile.customer_id.startsWith('customer_')
  );
  const withoutId = combined.filter(d => !d.profile?.customer_id);

  console.log('\n📈 ANALYSIS:');
  console.log(`   • ${withRukisha.length} profiles have REAL Rukisha customer IDs`);
  console.log(`   • ${withSimulated.length} profiles have simulated customer IDs (dev mode)`);
  console.log(`   • ${withoutId.length} profiles have no customer ID`);

  if (withRukisha.length > 0) {
    console.log('\n✅ SUCCESS: The KYC API IS returning Rukisha customer IDs!');
    const rukishaIds = withRukisha.map(d => d.profile.customer_id);
    console.log('   Real Rukisha customer IDs:', rukishaIds);
    
    console.log('\n🎯 CONCLUSION:');
    console.log('   The wallet KYC API is working correctly and returning customer IDs from Rukisha.');
    console.log('   These customer IDs are being stored in the profiles table.');
  } else {
    console.log('\n❌ ISSUE: No real Rukisha customer IDs found');
    console.log('   All customer IDs are simulated (development mode)');
  }
}

analyzeKycData().catch(console.error);