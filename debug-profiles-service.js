const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU';

async function run() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id,user_id,customer_id,first_name,last_name,phone,updated_at', { count: 'exact' })
      .not('customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }

    console.log(`Found ${data.length} profiles with customer_id (count=${count})`);
    console.table(data.slice(0, 20));
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
