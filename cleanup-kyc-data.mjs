import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjgwmmafqppzkiprqvdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZ3dtbWFmcXBwemtpcHJxdmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY5MTc5NjMsImV4cCI6MjA0MjQ5Mzk2M30.FMPeEOt2UrvjjVKJ1LYbIzK5VKdHa4mPmjkI0LQcGV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupKycData() {
  try {
    console.log('🧹 Starting KYC data cleanup...');
    
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
    
    // Delete KYC data for users with Eric or Greg in their names
    console.log('\n🗑️ Deleting KYC data...');
    const { data: deletedKyc, error: deleteKycError } = await supabase
      .from('wallet_kyc')
      .delete()
      .or(`full_name.ilike.%eric%,full_name.ilike.%greg%`);
    
    if (deleteKycError) {
      console.error('❌ Error deleting KYC data:', deleteKycError);
    } else {
      console.log('✅ Deleted KYC records:', deletedKyc);
    }
    
    // Reset customer_id in profiles
    console.log('\n🔄 Resetting customer_id in profiles...');
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        customer_id: null,
        updated_at: new Date().toISOString()
      })
      .or(`first_name.ilike.%eric%,first_name.ilike.%greg%`);
    
    if (updateError) {
      console.error('❌ Error updating profiles:', updateError);
    } else {
      console.log('✅ Updated profiles:', updatedProfiles);
    }
    
    // Deactivate wallets
    console.log('\n💰 Deactivating wallets...');
    const { data: deactivatedWallets, error: walletError } = await supabase
      .from('wallets')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in('user_id', currentProfiles
        ?.filter(p => p.first_name?.toLowerCase().includes('eric') || p.first_name?.toLowerCase().includes('greg'))
        ?.map(p => p.user_id) || []
      );
    
    if (walletError) {
      console.error('❌ Error deactivating wallets:', walletError);
    } else {
      console.log('✅ Deactivated wallets:', deactivatedWallets);
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
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('💥 Cleanup error:', error);
  }
}

cleanupKycData();