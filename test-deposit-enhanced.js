/**
 * Enhanced test script for wallet deposit functionality
 * Extracts detailed error information from responses
 */

async function testDepositWithDetails() {
  console.log('🧪 Testing Wallet Deposit Functionality (Enhanced)');
  console.log('=================================================');
  
  const baseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds';
  
  // Helper function to extract response details
  async function makeRequest(description, payload, headers = {}) {
    console.log(`\n${description}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      
      console.log('Status:', response.status);
      console.log('Response:', responseText);
      
      // Try to parse as JSON
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Parsed JSON:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('Response is not valid JSON');
      }
      
      return { status: response.status, body: responseText };
      
    } catch (error) {
      console.error('Request failed:', error.message);
      return { error: error.message };
    }
  }
  
  // Test 1: No authentication
  await makeRequest(
    '1. Testing without authentication',
    { amount: 100, phone: '0712345678' }
  );
  
  // Test 2: Invalid authentication
  await makeRequest(
    '2. Testing with invalid authentication',
    { amount: 100, phone: '0712345678' },
    { 'Authorization': 'Bearer invalid-token' }
  );
  
  // Test 3: Missing required fields
  await makeRequest(
    '3. Testing with missing amount',
    { phone: '0712345678' }
  );
  
  // Test 4: Missing phone
  await makeRequest(
    '4. Testing with missing phone',
    { amount: 100 }
  );
  
  // Test 5: Invalid amount (too low)
  await makeRequest(
    '5. Testing with amount below minimum',
    { amount: 50, phone: '0712345678' }
  );
  
  // Test 6: Invalid phone format
  await makeRequest(
    '6. Testing with invalid phone format',
    { amount: 100, phone: '123' }
  );
  
  // Test 7: Valid payload format but no auth (to see validation)
  await makeRequest(
    '7. Testing with valid payload but no auth',
    { amount: 1000, phone: '0712345678' }
  );
  
  console.log('\n✅ Enhanced testing completed!');
}

// Run the enhanced test
testDepositWithDetails();