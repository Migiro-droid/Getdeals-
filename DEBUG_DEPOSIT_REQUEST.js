// Debug Deposit Request - Run in Browser Console
// This will help us see exactly what's being sent and what error we get back

async function debugDeposit() {
  try {
    console.log('🔍 DEBUGGING DEPOSIT REQUEST');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ Auth Error:', userError);
      return;
    }
    console.log('✅ User authenticated:', user.email);
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (profileError) {
      console.log('❌ Profile Error:', profileError);
      return;
    }
    console.log('✅ Profile found:', profile);
    
    // Test deposit request with your actual data
    const testDeposit = {
      amount: 100, // Test amount
      phone: profile.phone || '+254715362548' // Use your phone or default
    };
    
    console.log('📤 Sending deposit request:', testDeposit);
    
    // Make the actual deposit request
    const { data: result, error: depositError } = await supabase.functions.invoke('deposit-funds', {
      body: testDeposit
    });
    
    console.log('📥 Deposit response:');
    console.log('- Error:', depositError);
    console.log('- Result:', result);
    
    if (depositError) {
      console.log('🚨 DEPOSIT ERROR DETAILS:');
      console.log('- Message:', depositError.message);
      console.log('- Code:', depositError.code);
      console.log('- Details:', depositError.details);
      console.log('- Hint:', depositError.hint);
      
      if (depositError.message.includes('not found')) {
        console.log('💡 FIX: Edge function not deployed');
      } else if (depositError.message.includes('auth')) {
        console.log('💡 FIX: Authentication issue');
      } else if (depositError.message.includes('customer_id')) {
        console.log('💡 FIX: Customer ID missing');
      }
    }
    
    if (result && !result.success) {
      console.log('🚨 DEPOSIT FAILED WITH MESSAGE:', result.error);
      
      if (result.error.includes('KYC')) {
        console.log('💡 FIX: KYC verification needed');
      } else if (result.error.includes('customer_id')) {
        console.log('💡 FIX: Customer ID issue in profile');
      } else if (result.error.includes('minimum')) {
        console.log('💡 FIX: Amount too low');
      } else if (result.error.includes('not configured')) {
        console.log('💡 This is normal in dev mode - Rukisha API not configured');
      }
    }
    
    if (result && result.success) {
      console.log('✅ DEPOSIT SUCCESS:', result);
    }
    
  } catch (error) {
    console.log('❌ Debug Error:', error);
  }
}

// Run the debug
debugDeposit();

console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('1. Copy and paste this entire script in your browser console');
console.log('2. Make sure you are on the wallet page and logged in');
console.log('3. Check the output above for the specific error');
console.log('4. Report the exact error message you see');