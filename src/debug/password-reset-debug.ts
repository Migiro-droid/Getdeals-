import { supabase } from '../../lib/supabase';

/**
 * Test script to debug password reset email issues
 * Run this in browser console to test different scenarios
 */

// Test 1: Basic password reset functionality
async function testPasswordReset(email: string) {
  console.log('🧪 Testing password reset for:', email);
  
  try {
    // Test with different redirect URLs
    const testConfigs = [
      {
        name: 'Production URL',
        config: {
          redirectTo: 'https://getdeals.co.ke/auth/reset-password'
        }
      },
      {
        name: 'Localhost URL',
        config: {
          redirectTo: 'http://localhost:3000/auth/reset-password'
        }
      },
      {
        name: 'No redirect URL',
        config: {}
      }
    ];

    for (const test of testConfigs) {
      console.log(`\n📧 Testing: ${test.name}`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, test.config);
      
      if (error) {
        console.error(`❌ ${test.name} failed:`, error);
      } else {
        console.log(`✅ ${test.name} succeeded:`, data);
      }
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Test 2: Check Supabase configuration
async function checkSupabaseConfig() {
  console.log('🔧 Checking Supabase configuration...');
  
  // Check if we can connect to Supabase
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection:', { data: !!data, error });
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
  
  // Check environment variables
  console.log('🌍 Environment check:', {
    isProd: import.meta.env.PROD,
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    mode: import.meta.env.MODE
  });
}

// Test 3: Check email settings in Supabase
function checkEmailSettings() {
  console.log('📧 Email settings check:');
  console.log('1. Go to Supabase Dashboard');
  console.log('2. Navigate to Authentication > Settings');
  console.log('3. Check if SMTP is configured or if you are using Supabase built-in email');
  console.log('4. Verify email templates are enabled');
  console.log('5. Check if emails are being rate-limited');
}

// Test 4: Manual password reset with detailed logging
async function detailedPasswordReset(email: string) {
  console.log('🔍 Detailed password reset test for:', email);
  
  // Check if email exists first
  try {
    console.log('1️⃣ Checking if user exists...');
    // Note: This is just for testing - in production you wouldn't expose this
    
    console.log('2️⃣ Attempting password reset...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    const endTime = Date.now();
    console.log(`⏱️ Request took: ${endTime - startTime}ms`);
    
    if (error) {
      console.error('❌ Password reset failed:', {
        message: error.message,
        status: error.status,
        details: error
      });
      return false;
    } else {
      console.log('✅ Password reset request successful:', data);
      console.log('📬 Check your email inbox and spam folder');
      return true;
    }
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return false;
  }
}

// Usage instructions
console.log(`
🧪 Password Reset Debug Tools Loaded!

Usage:
1. testPasswordReset('your-email@example.com') - Test different redirect URLs
2. checkSupabaseConfig() - Check basic configuration  
3. checkEmailSettings() - Get checklist for email settings
4. detailedPasswordReset('your-email@example.com') - Detailed test with logging

Run these in your browser console to debug the password reset issue.
`);

// Make functions globally available for console use
(window as any).testPasswordReset = testPasswordReset;
(window as any).checkSupabaseConfig = checkSupabaseConfig;
(window as any).checkEmailSettings = checkEmailSettings;
(window as any).detailedPasswordReset = detailedPasswordReset;