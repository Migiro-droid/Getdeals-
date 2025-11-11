#!/usr/bin/env tsx
/**
 * Quick email configuration check
 * Run with: tsx scripts/check-email-config.ts
 */

import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('\n📋 Email Configuration Check\n');

  // 1. Check API Key
  const apiKey = process.env.BREVO_API_KEY;
  console.log('1. BREVO_API_KEY:', apiKey ? `✅ Set (${apiKey.substring(0, 20)}...)` : '❌ NOT SET');

  // 2. Check Sender Email
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  console.log('2. BREVO_SENDER_EMAIL:', senderEmail ? `✅ ${senderEmail}` : '❌ NOT SET');

  // 3. Check Template ID
  const templateId = process.env.BREVO_WELCOME_TEMPLATE_ID;
  console.log('3. BREVO_WELCOME_TEMPLATE_ID:', templateId ? `✅ ${templateId}` : '❌ NOT SET');

  // 4. Check Frontend URL
  const frontendUrl = process.env.FRONTEND_URL;
  console.log('4. FRONTEND_URL:', frontendUrl ? `✅ ${frontendUrl}` : '❌ NOT SET');

  // 5. Test Brevo API
  if (!apiKey) {
    console.log('\n❌ Cannot test Brevo API - BREVO_API_KEY not set');
    process.exit(1);
  }

  console.log('\n5. Testing Brevo API connection...');
  
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey
      }
    });

    if (response.ok) {
      const data = await response.json() as any;
      console.log(`   ✅ Connected to Brevo`);
      console.log(`   📧 Account: ${data.email}`);
      console.log(`   📦 Plan: ${data.plan}`);
    } else {
      const error = await response.json() as any;
      console.log(`   ❌ Failed (${response.status}): ${error.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  console.log('\n✅ Email configuration looks good!\n');
  process.exit(0);
}

main();
