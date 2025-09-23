import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwowymjgzjlbblnfiqmf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b3d5bWpnempsYmJsbmZpcW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY3MjI2OSwiZXhwIjoyMDQ5MjQ4MjY5fQ.I7RCFGRdUZUjmwJHhWgcGDGYUKtEOLEFGpDYBkxe0Yo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function quickConnectivityTest() {
  console.log('🔗 Testing Supabase connectivity...')

  try {
    // Simple connectivity test
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      if (error.message.includes('organization')) {
        console.log('🎯 Confirmed: PGRST204 organization column error present')
        console.log('\n📋 Manual Fix Required:')
        console.log('1. Go to Supabase Dashboard > SQL Editor')
        console.log('2. Run the complete-organization-fix.sql script')
        console.log('3. This will add the missing organization column and fix the trigger')
        console.log('\nAlternatively, run this single command in SQL Editor:')
        console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT;')
      }
    } else {
      console.log('✅ Connection successful, no organization column error')
    }
  } catch (err) {
    console.log('💥 Network error:', err.message)
    console.log('\n🔧 Since we cannot connect programmatically:')
    console.log('1. Open Supabase Dashboard manually')
    console.log('2. Go to SQL Editor')
    console.log('3. Run: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT;')
    console.log('4. Run: SELECT column_name FROM information_schema.columns WHERE table_name = \'profiles\' AND column_name = \'organization\';')
  }
}

quickConnectivityTest()