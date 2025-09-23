import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function debugSchemaIssue() {
  try {
    console.log('🔍 Debugging schema issue...')
    
    // Check if profiles table exists and its columns
    console.log('\n📋 Checking profiles table schema:')
    const { data: profilesSchema, error: profilesError } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position;
      `
    })
    
    if (profilesError) {
      console.error('❌ Error checking profiles schema:', profilesError)
    } else {
      console.log('✅ Profiles table columns:', profilesSchema)
    }

    // Check if users table exists
    console.log('\n📋 Checking if users table exists:')
    const { data: usersSchema, error: usersError } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `
    })
    
    if (usersError) {
      console.log('ℹ️ No users table found (expected if using profiles)')
    } else {
      console.log('⚠️ Users table exists:', usersSchema)
    }

    // Check current triggers
    console.log('\n🔧 Checking triggers:')
    const { data: triggers, error: triggersError } = await supabase.rpc('sql', {
      query: `
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
        ORDER BY trigger_name;
      `
    })
    
    if (triggersError) {
      console.error('❌ Error checking triggers:', triggersError)
    } else {
      console.log('✅ Current triggers:', triggers)
    }

    // Test a simple profiles query
    console.log('\n🧪 Testing profiles query:')
    const { data: testQuery, error: testError } = await supabase
      .from('profiles')
      .select('id, user_id, customer_id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error querying profiles:', testError)
    } else {
      console.log('✅ Profiles query successful:', testQuery)
    }

  } catch (error) {
    console.error('💥 Debug script error:', error)
  }
}

debugSchemaIssue()