// Simple test to check if the deposit-funds edge function is deployed and accessible

async function checkEdgeFunction() {
  const functionUrl = 'https://fxyifnckgllxqbggegtw.supabase.co/functions/v1/deposit-funds';
  
  console.log('🔍 Checking if deposit-funds edge function is deployed...');
  console.log('URL:', functionUrl);
  
  try {
    // Make a simple OPTIONS request to check if the function exists
    const response = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ Edge function is deployed and accessible');
      
      // Try a POST request without auth to see the error response
      console.log('\n🧪 Testing POST request without auth...');
      const postResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100,
          phone: '0712345678'
        })
      });
      
      const postResult = await postResponse.text();
      console.log('POST response status:', postResponse.status);
      console.log('POST response:', postResult);
      
      if (postResponse.status === 401) {
        console.log('✅ Function correctly requires authentication');
      }
      
    } else {
      console.log('❌ Edge function not accessible. Status:', response.status);
      
      if (response.status === 404) {
        console.log('💡 The function might not be deployed. Check your Supabase dashboard.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking edge function:');
    console.error(error);
    console.log('\n💡 Possible issues:');
    console.log('1. Edge function not deployed');
    console.log('2. Network connectivity issues');
    console.log('3. Supabase project configuration issues');
  }
}

checkEdgeFunction();