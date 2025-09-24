// Run this in your browser's console while on the GetDeals app
// This will clean up KYC data for Eric and Greg

async function cleanupKycData() {
  try {
    console.log('🧹 Starting KYC data cleanup...');
    
    // Get the supabase client from your app
    const { supabase } = await import('/src/lib/supabase.js');
    
    // First, let's see what data exists
    console.log('\n📊 Current KYC data:');
    const { data: currentKyc, error: kycError } = await supabase
      .from('wallet_kyc')
      .select('*');
    
    if (kycError) {
      console.error('❌ Error fetching current KYC data:', kycError);
      return;
    }
    
    console.log('Current KYC records:', currentKyc);
    
    // Check profiles
    const { data: currentProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error fetching current profiles:', profileError);
      return;
    }
    
    console.log('Current profiles:', currentProfiles);
    
    // Delete all KYC data (since we want a fresh start)
    console.log('\n🗑️ Deleting all KYC data...');
    const { error: deleteKycError } = await supabase
      .from('wallet_kyc')
      .delete()
      .neq('id', ''); // Delete all records
    
    if (deleteKycError) {
      console.error('❌ Error deleting KYC data:', deleteKycError);
    } else {
      console.log('✅ Deleted all KYC records');
    }
    
    // Reset customer_id in all profiles
    console.log('\n🔄 Resetting customer_id in all profiles...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        customer_id: null,
        updated_at: new Date().toISOString()
      })
      .neq('id', ''); // Update all records
    
    if (updateError) {
      console.error('❌ Error updating profiles:', updateError);
    } else {
      console.log('✅ Reset customer_id in all profiles');
    }
    
    // Deactivate all wallets
    console.log('\n💰 Deactivating all wallets...');
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .neq('id', ''); // Update all records
    
    if (walletError) {
      console.error('❌ Error deactivating wallets:', walletError);
    } else {
      console.log('✅ Deactivated all wallets');
    }
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remainingKyc } = await supabase
      .from('wallet_kyc')
      .select('*');
    
    const { data: remainingProfiles } = await supabase
      .from('profiles')
      .select('*')
      .not('customer_id', 'is', null);
    
    console.log('Remaining KYC records:', remainingKyc?.length || 0);
    console.log('Remaining profiles with customer_id:', remainingProfiles?.length || 0);
    
    console.log('\n✅ Cleanup completed! You can now test KYC flow fresh.');
    console.log('💡 Refresh the page to see the changes.');
    
  } catch (error) {
    console.error('💥 Cleanup error:', error);
  }
}

// Run the cleanup
cleanupKycData();