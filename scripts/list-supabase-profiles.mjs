import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wrlouoongmdtritwojaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybG91b29uZ21kdHJpdHdvamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU2MTMsImV4cCI6MjA3MDkyMTYxM30._zo2qW9SFpYSV9jz-wedjOuB2Gp4BFxqsBKwaUQSnlE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Supabase query error:', error);
    process.exit(1);
  }

  console.log(JSON.stringify(data || [], null, 2));
} catch (err) {
  console.error('Unexpected error querying Supabase:', err);
  process.exit(1);
}
