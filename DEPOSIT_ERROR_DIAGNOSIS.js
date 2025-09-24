// Quick Deposit Error Diagnosis
// Run this in browser console while on wallet page to diagnose deposit issues

console.log('🔍 DEPOSIT ERROR DIAGNOSIS TOOL');
console.log('Make sure you are on the Wallet page and logged in');

// Function to test deposit and capture detailed error info
async function diagnoseDeposit() {
  try {
    console.log('📊 Checking user authentication...');
    
    // Check if supabase is available in various locations
    let supabaseClient = null;
    
    if (typeof window.supabase !== 'undefined') {
      supabaseClient = window.supabase;
      console.log('✅ Found Supabase in window.supabase');
    } else if (typeof supabase !== 'undefined') {
      supabaseClient = supabase;
      console.log('✅ Found Supabase in global scope');
    } else {
      // Try to import from the module if available
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabaseUrl = 'https://your-project.supabase.co'; // Replace with actual URL
        const supabaseKey = 'your-anon-key'; // Replace with actual key
        console.log('❌ Supabase client not found in window or global scope');
        console.log('💡 Please run this script on the wallet page where Supabase is loaded');
        console.log('🔧 Alternative: Check browser Network tab for failed requests during deposit');
        return;
      } catch (e) {
        console.log('❌ Cannot access Supabase client');
        console.log('💡 Make sure you are on the wallet page of your application');
        console.log('🔧 Alternative: Check browser Network tab and Console for errors during deposit attempt');
        return;
      }
    }
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session Error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session - please log in first');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Check profile
    console.log('📊 Checking user profile...');
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (profileError) {
      console.log('❌ Profile Error:', profileError);
      if (profileError.message.includes('organization')) {
        console.log('🚨 ORGANIZATION COLUMN ERROR DETECTED!');
        console.log('📋 FIX: Run the database migration for organization column');
      }
      return;
    }
    
    console.log('✅ Profile found:', { 
      customer_id: profile.customer_id, 
      first_name: profile.first_name,
      has_organization: 'organization' in profile 
    });
    
    if (!profile.customer_id) {
      console.log('⚠️ Missing customer_id - KYC may not be complete');
    }
    
    // Test deposit function call
    console.log('📊 Testing deposit function...');
    const testAmount = 100;
    const testPhone = '+254700000000';
    
    const { data: depositResult, error: depositError } = await supabaseClient.functions.invoke('deposit-funds', {
      body: { amount: testAmount, phone: testPhone }
    });
    
    if (depositError) {
      console.log('❌ Deposit Function Error:', depositError);
      if (depositError.message.includes('organization')) {
        console.log('🚨 ORGANIZATION COLUMN ERROR IN DEPOSIT FUNCTION!');
        console.log('📋 FIX: Run the database migration for organization column');
      } else if (depositError.message.includes('customer_id')) {
        console.log('🚨 CUSTOMER_ID MISSING ERROR!');
        console.log('📋 FIX: Complete KYC verification or run user setup script');
      } else if (depositError.message.includes('auth')) {
        console.log('🚨 AUTHENTICATION ERROR!');
        console.log('📋 FIX: Try logging out and back in');
      }
      return;
    }
    
    console.log('✅ Deposit function response:', depositResult);
    
    if (!depositResult.success) {
      console.log('❌ Deposit failed with message:', depositResult.error);
      if (depositResult.error.includes('KYC')) {
        console.log('📋 FIX: Complete KYC verification');
      } else if (depositResult.error.includes('customer_id')) {
        console.log('📋 FIX: Profile missing customer_id - may need admin account setup');
      }
    } else {
      console.log('✅ Deposit test successful!');
    }
    
  } catch (error) {
    console.log('❌ Diagnosis Error:', error);
  }
}

// Auto-run the diagnosis
diagnoseDeposit();

console.log('');
console.log('📋 MANUAL TESTING:');
console.log('1. Copy and paste this entire script in browser console on wallet page');
console.log('2. Check the output above for specific errors');
console.log('3. Follow the FIX instructions for each error found');
console.log('');
console.log('🔧 COMMON FIXES:');
console.log('• Organization Error → Run database migration in Supabase Dashboard');
console.log('• Missing customer_id → Complete KYC verification or run admin setup');
console.log('• Auth Error → Log out and back in');
console.log('• Network Error → Check internet connection');