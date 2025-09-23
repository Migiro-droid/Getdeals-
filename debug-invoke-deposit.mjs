import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fxyifnckgllxqbggegtw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM3NjUsImV4cCI6MjA3MTg0OTc2NX0.GzVS2exQP8pGnbJNnkLwBZ_w52ioE6j18ibqpoA4slE'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)

async function run() {
  try {
    const email = `debug-user-${Date.now()}@example.com`
    const password = 'Test1234!'
    console.log('Creating test user', email)
    const createRes = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (createRes.error) {
      console.error('Create user error:', createRes.error)
      return
    }
    const user = createRes.data.user
    console.log('Created user id:', user.id)

    // Sign in with anon key to get session token
    const signIn = await anon.auth.signInWithPassword({ email, password })
    if (signIn.error) {
      console.error('Sign-in error:', signIn.error)
      return
    }
    const token = signIn.data.session.access_token
    console.log('Obtained access token (truncated):', token?.slice(0, 40) + '...')

    // Call function endpoint
    const url = `${SUPABASE_URL}/functions/v1/deposit-funds`
    const body = { amount: 500, phone: '0712345678' }
    console.log('Calling function', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const text = await res.text()
    console.log('Function status:', res.status)
    try {
      console.log('Function response JSON:', JSON.parse(text))
    } catch (e) {
      console.log('Function response text:', text)
    }

    // Clean up: delete user
    const del = await admin.auth.admin.deleteUser(user.id)
    if (del.error) {
      console.error('Error deleting test user:', del.error)
    } else {
      console.log('Deleted test user')
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

run()
