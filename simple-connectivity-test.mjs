// Simple connectivity test for Supabase
import dns from 'dns'
import https from 'https'
import { promisify } from 'util'

console.log('🌐 Testing basic connectivity to Supabase...\n')

const supabaseUrl = 'https://lwowymjgzjlbblnfiqmf.supabase.co'

async function testConnectivity() {
  try {
    console.log('1️⃣ Testing DNS resolution...')
    const lookup = promisify(dns.lookup)
    
    const address = await lookup('lwowymjgzjlbblnfiqmf.supabase.co')
    console.log('✅ DNS resolution successful:', address.address)
    
    console.log('\n2️⃣ Testing HTTPS connection...')
    
    return new Promise((resolve, reject) => {
      const req = https.get(supabaseUrl + '/rest/v1/', (res) => {
        console.log('✅ HTTPS connection successful, status:', res.statusCode)
        resolve(true)
      })
      
      req.on('error', (err) => {
        console.log('❌ HTTPS connection failed:', err.message)
        reject(err)
      })
      
      req.setTimeout(10000, () => {
        console.log('❌ Connection timeout')
        req.destroy()
        reject(new Error('Timeout'))
      })
    })
    
  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message)
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 NETWORK TROUBLESHOOTING:')
      console.log('1. Check your internet connection')
      console.log('2. Try accessing https://lwowymjgzjlbblnfiqmf.supabase.co in your browser')
      console.log('3. Check if you have any VPN or firewall blocking the connection')
      console.log('4. Try running: ping lwowymjgzjlbblnfiqmf.supabase.co')
    }
    
    return false
  }
}

// Manual migration instructions
console.log('\n📋 SINCE NETWORK CONNECTIVITY IS UNAVAILABLE:')
console.log('Apply the migration manually through Supabase Dashboard:\n')
console.log('1. Open https://supabase.com/dashboard in your browser')
console.log('2. Select your project: getdeals-kenya-showcase')
console.log('3. Navigate to SQL Editor')
console.log('4. Copy and paste the migration from: migrations/20250923_add_organization_column.sql')
console.log('5. Click "RUN" to execute the migration\n')

console.log('📝 Expected output after running migration:')
console.log('✅ Migration completed successfully: organization column added and trigger updated\n')

testConnectivity().then(() => {
  console.log('🎉 Network connectivity is working')
  console.log('You can now run: node bulletproof-test.mjs')
}).catch(() => {
  console.log('\n💡 ALTERNATIVE APPROACH:')
  console.log('Since network connectivity is limited, apply the migration manually:')
  console.log('- Use Supabase Dashboard web interface')
  console.log('- Copy migration content from migrations/20250923_add_organization_column.sql')
  console.log('- Execute in SQL Editor')
  console.log('- Test your application directly')
})