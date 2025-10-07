import 'dotenv/config';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const baseUrl = 'https://api.brevo.com/v3';

async function makeRequest(endpoint) {
  const url = `${baseUrl}${endpoint}`;
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'api-key': BREVO_API_KEY
    }
  };

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Brevo API error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

async function getDomainAuthentication() {
  console.log('🔐 Checking Domain Authentication Status\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const senders = await makeRequest('/senders');
    
    if (!senders.senders || senders.senders.length === 0) {
      console.log('❌ No senders found');
      return;
    }

    for (const sender of senders.senders) {
      console.log(`📧 Sender: ${sender.email} (${sender.name})`);
      console.log(`   Status: ${sender.active ? '✅ Active' : '❌ Inactive'}`);
      
      // Extract domain from email
      const domain = sender.email.split('@')[1];
      console.log(`   Domain: ${domain}`);
      
      // Check domain authentication
      try {
        const domainInfo = await makeRequest(`/senders/domains/${domain}`);
        
        console.log('\n   🔒 Domain Authentication Status:');
        console.log(`   SPF: ${domainInfo.authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}`);
        console.log(`   DKIM: ${domainInfo.dkim ? '✅ Configured' : '❌ Not Configured'}`);
        
        if (!domainInfo.authenticated || !domainInfo.dkim) {
          console.log('\n   ⚠️  Your domain is NOT fully authenticated!');
          console.log('   This is why emails show "brevosend.com" in the sender address.\n');
          
          console.log('   📋 TO FIX THIS:');
          console.log('   ═══════════════════════════════════════════════════\n');
          console.log('   1. Go to Brevo Dashboard > Senders');
          console.log(`   2. Click on "${sender.email}"`);
          console.log('   3. Click "Authenticate this domain"');
          console.log('   4. Copy the DNS records shown');
          console.log('   5. Add them to your domain registrar (where you bought getdeals.co.ke)');
          console.log('   6. Wait 24-48 hours for DNS propagation');
          console.log('   7. Return to Brevo and click "Verify authentication"\n');
          
          console.log('   📝 DNS Records Needed:');
          console.log('   ─────────────────────────────────────────────────\n');
          console.log('   SPF Record:');
          console.log('   Type: TXT');
          console.log('   Name: @ (or your domain name)');
          console.log('   Value: v=spf1 include:spf.brevo.com ~all\n');
          
          console.log('   DKIM Record:');
          console.log('   Type: CNAME or TXT (Brevo will tell you)');
          console.log('   Name: mail._domainkey (Brevo will provide exact value)');
          console.log('   Value: (Get from Brevo dashboard)\n');
          
          console.log('   DMARC Record (Optional but recommended):');
          console.log('   Type: TXT');
          console.log('   Name: _dmarc');
          console.log('   Value: v=DMARC1; p=none; rua=mailto:info@getdeals.co.ke\n');
        } else {
          console.log('\n   ✅ Your domain is fully authenticated!');
          console.log('   Emails should show your actual sender address.\n');
        }
        
      } catch (error) {
        console.log(`\n   ⚠️  Could not fetch domain info: ${error.message}`);
        console.log('   You may need to authenticate your domain in Brevo dashboard.\n');
      }
      
      console.log('═══════════════════════════════════════════════════════\n');
    }

    console.log('🎯 QUICK SUMMARY:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Problem: Emails show "brevosend.com" address');
    console.log('Solution: Authenticate your domain in Brevo');
    console.log('Steps: Brevo Dashboard > Senders > Authenticate Domain');
    console.log('Time: DNS changes take 24-48 hours to propagate');
    console.log('\n💡 Once authenticated, emails will show: info@getdeals.co.ke');
    console.log('   Instead of: info@9978700.brevosend.com\n');

  } catch (error) {
    console.error('❌ Error checking domain authentication:', error.message);
  }
}

getDomainAuthentication();
