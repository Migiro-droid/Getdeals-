// Simple test to verify production API
async function testProductionAPI() {
  const baseUrl = 'https://your-vercel-url.vercel.app'; // Replace with your actual URL
  
  try {
    console.log('🔍 Testing production API...');
    
    // Test GET /api/products
    const response = await fetch(`${baseUrl}/api/products`);
    console.log('GET /api/products status:', response.status);
    
    if (response.ok) {
      const products = await response.json();
      console.log('✅ Products fetched successfully:', products.length, 'products');
    } else {
      const error = await response.text();
      console.log('❌ Failed to fetch products:', error);
    }
    
    // Test POST /api/products
    console.log('🧪 Testing product creation...');
    const testProduct = {
      name: 'Test Product',
      price: 1000,
      category: 'test',
      description: 'This is a test product',
      image: '/placeholder.svg'
    };
    
    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    
    console.log('POST /api/products status:', createResponse.status);
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Product created successfully:', created);
    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create product:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testProductionAPI = testProductionAPI;
}

export { testProductionAPI };
