/**
 * Direct Supabase Product Creation Test
 * Tests product creation directly against Supabase database
 * This bypasses frontend dependencies and tests the core database functionality
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test product data (exclude timestamp fields - let database handle them)
const testProduct = {
  name: `Test Product ${Date.now()}`,
  description: 'This is a test product created by the automated test script',
  price: 1500,
  originalPrice: 2000,
  category: 'essential',
  image: 'https://example.com/test-product.jpg',
  items: ['Test Item 1', 'Test Item 2', 'Test Item 3'],
  itemsDetail: [
    { name: 'Test Item 1', image: 'https://example.com/item1.jpg' },
    { name: 'Test Item 2', image: 'https://example.com/item2.jpg' }
  ],
  discount: 25,
  inStock: true,
  featured: false
};

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const testResults: TestResult[] = [];

function logTest(testName: string, passed: boolean, message: string, details?: any) {
  const result: TestResult = { testName, passed, message, details };
  testResults.push(result);
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error) {
      logTest('Database Connection', false, `Connection failed: ${error.message}`);
      return false;
    }
    
    logTest('Database Connection', true, 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    logTest('Database Connection', false, `Exception: ${error}`);
    return false;
  }
}

async function testProductCount() {
  console.log('\n📊 Testing product count query...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category');
    
    if (error) {
      logTest('Product Count', false, `Query failed: ${error.message}`);
      return false;
    }
    
    logTest('Product Count', true, `Found ${data?.length || 0} existing products`);
    
    if (data && data.length > 0) {
      console.log('   Sample products:');
      data.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
      });
    }
    
    return true;
  } catch (error) {
    logTest('Product Count', false, `Exception: ${error}`);
    return false;
  }
}

async function testProductCreation() {
  console.log('\n🛠️ Testing product creation...');
  
  try {
    // Add the required updatedAt field explicitly
    const productWithTimestamp = {
      ...testProduct,
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('products')
      .insert([productWithTimestamp])
      .select()
      .single();
    
    if (error) {
      logTest('Product Creation', false, `Insert failed: ${error.message}`, error);
      return null;
    }
    
    if (!data) {
      logTest('Product Creation', false, 'Insert returned no data');
      return null;
    }
    
    logTest('Product Creation', true, `Product created with ID: ${data.id}`);
    
    // Verify the created product has correct data
    const dataMatches = (
      data.name === testProduct.name &&
      data.price === testProduct.price &&
      data.category === testProduct.category &&
      data.description === testProduct.description
    );
    
    if (dataMatches) {
      logTest('Product Data Verification', true, 'Created product data matches input');
    } else {
      logTest('Product Data Verification', false, 'Created product data differs from input', {
        expected: testProduct,
        actual: data
      });
    }
    
    return data;
  } catch (error) {
    logTest('Product Creation', false, `Exception: ${error}`);
    return null;
  }
}

async function testProductRetrieval(productId: string) {
  console.log('\n🔍 Testing product retrieval...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      logTest('Product Retrieval', false, `Query failed: ${error.message}`);
      return false;
    }
    
    if (!data) {
      logTest('Product Retrieval', false, 'Product not found');
      return false;
    }
    
    logTest('Product Retrieval', true, `Successfully retrieved product: ${data.name}`);
    return true;
  } catch (error) {
    logTest('Product Retrieval', false, `Exception: ${error}`);
    return false;
  }
}

async function testProductUpdate(productId: string) {
  console.log('\n✏️ Testing product update...');
  
  const updateData = {
    name: `Updated Test Product ${Date.now()}`,
    price: 1800,
    description: 'This product has been updated by the test script'
  };
  
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      logTest('Product Update', false, `Update failed: ${error.message}`);
      return false;
    }
    
    if (!data) {
      logTest('Product Update', false, 'Update returned no data');
      return false;
    }
    
    // Verify the update
    const updateMatches = (
      data.name === updateData.name &&
      data.price === updateData.price &&
      data.description === updateData.description
    );
    
    if (updateMatches) {
      logTest('Product Update', true, 'Product successfully updated');
    } else {
      logTest('Product Update', false, 'Update data doesn\'t match', {
        expected: updateData,
        actual: { name: data.name, price: data.price, description: data.description }
      });
    }
    
    return updateMatches;
  } catch (error) {
    logTest('Product Update', false, `Exception: ${error}`);
    return false;
  }
}

async function testProductDeletion(productId: string) {
  console.log('\n🗑️ Testing product deletion...');
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      logTest('Product Deletion', false, `Delete failed: ${error.message}`);
      return false;
    }
    
    // Verify deletion by trying to retrieve the product
    const { data: deletedProduct, error: getError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (getError && getError.code === 'PGRST116') {
      // No rows returned - expected for successful deletion
      logTest('Product Deletion', true, 'Product successfully deleted');
      return true;
    } else if (!getError && deletedProduct) {
      logTest('Product Deletion', false, 'Product still exists after deletion');
      return false;
    } else {
      logTest('Product Deletion', false, `Unexpected error during deletion verification: ${getError?.message}`);
      return false;
    }
  } catch (error) {
    logTest('Product Deletion', false, `Exception: ${error}`);
    return false;
  }
}

async function testInvalidProductCreation() {
  console.log('\n🚫 Testing invalid product creation...');
  
  // Test 1: Missing required fields
  try {
    const { error } = await supabase
      .from('products')
      .insert([{ name: 'Incomplete Product' }]) // Missing price, category
      .select();
    
    if (error) {
      logTest('Invalid Product Rejection', true, 'Correctly rejected incomplete product');
    } else {
      logTest('Invalid Product Rejection', false, 'Should have rejected incomplete product');
    }
  } catch (error) {
    logTest('Invalid Product Rejection', true, 'Correctly rejected incomplete product with exception');
  }
  
  // Test 2: Invalid data types
  try {
    const { error } = await supabase
      .from('products')
      .insert([{ 
        name: 'Invalid Product',
        price: 'not-a-number', // Invalid price type
        category: 'essential'
      }])
      .select();
    
    if (error) {
      logTest('Invalid Data Type Rejection', true, 'Correctly rejected invalid data types');
    } else {
      logTest('Invalid Data Type Rejection', false, 'Should have rejected invalid data types');
    }
  } catch (error) {
    logTest('Invalid Data Type Rejection', true, 'Correctly rejected invalid data types with exception');
  }
}

async function testBulkProductCreation() {
  console.log('\n📦 Testing bulk product creation...');
  
  const bulkProducts = [
    { ...testProduct, name: `Bulk Product 1 ${Date.now()}`, updatedAt: new Date().toISOString() },
    { ...testProduct, name: `Bulk Product 2 ${Date.now()}`, updatedAt: new Date().toISOString() },
    { ...testProduct, name: `Bulk Product 3 ${Date.now()}`, updatedAt: new Date().toISOString() }
  ];
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(bulkProducts)
      .select();
    
    if (error) {
      logTest('Bulk Product Creation', false, `Bulk insert failed: ${error.message}`);
      return [];
    }
    
    if (!data || data.length !== bulkProducts.length) {
      logTest('Bulk Product Creation', false, `Expected ${bulkProducts.length} products, got ${data?.length || 0}`);
      return data || [];
    }
    
    logTest('Bulk Product Creation', true, `Successfully created ${data.length} products in bulk`);
    
    // Clean up bulk products
    const productIds = data.map(p => p.id);
    await supabase.from('products').delete().in('id', productIds);
    console.log('   Cleaned up bulk test products');
    
    return data;
  } catch (error) {
    logTest('Bulk Product Creation', false, `Exception: ${error}`);
    return [];
  }
}

async function runTests() {
  console.log('🚀 Starting direct Supabase product creation tests...\n');
  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using service role authentication\n`);
  
  // Test 1: Database connection
  const connected = await testDatabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot connect to database. Stopping tests.');
    return;
  }
  
  // Test 2: Product count query
  await testProductCount();
  
  // Test 3: Product creation
  const createdProduct = await testProductCreation();
  if (!createdProduct) {
    console.log('\n❌ Product creation failed. Skipping dependent tests.');
  } else {
    // Test 4: Product retrieval
    await testProductRetrieval(createdProduct.id);
    
    // Test 5: Product update
    await testProductUpdate(createdProduct.id);
    
    // Test 6: Product deletion
    await testProductDeletion(createdProduct.id);
  }
  
  // Test 7: Invalid product creation
  await testInvalidProductCreation();
  
  // Test 8: Bulk product creation
  await testBulkProductCreation();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.message}`);
  });
  
  console.log('='.repeat(60));
  console.log(`Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Product creation is working correctly with Supabase.');
    console.log('\n✅ CONCLUSION: New products ARE being saved to the Supabase database successfully.');
  } else {
    console.log(`\n⚠️ ${total - passed} test(s) failed. There may be issues with product creation.`);
    
    // Check if critical tests passed
    const criticalTests = testResults.filter(r => 
      r.testName.includes('Database Connection') || 
      r.testName.includes('Product Creation') ||
      r.testName.includes('Product Data Verification')
    );
    const criticalPassed = criticalTests.filter(r => r.passed).length;
    
    if (criticalPassed === criticalTests.length) {
      console.log('\n✅ CONCLUSION: Core product creation functionality is working.');
      console.log('   New products ARE being saved to the Supabase database.');
    } else {
      console.log('\n❌ CONCLUSION: There are issues with product creation.');
      console.log('   New products may NOT be saving to the database correctly.');
    }
  }
  
  return {
    passed,
    total,
    success: passed === total,
    results: testResults
  };
}

// Run tests when executed directly
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

export { runTests };
