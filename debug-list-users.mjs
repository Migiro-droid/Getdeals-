import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

try {
  const res = await supabase.auth.admin.listUsers({ per_page: 20 })
  if (res.error) {
    console.error('Error listing users:', res.error)
    process.exit(1)
  }
  const users = res.data?.users || []
  console.log(`Found ${users.length} users`)
  users.forEach(u => {
    console.log(`${u.id} | ${u.email} | created_at: ${u.created_at}`)
  })
} catch (err) {
  console.error('Unexpected error:', err)
}
