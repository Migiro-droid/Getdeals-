/**
 * Comprehensive Product Creation Test
 * Tests the complete flow from frontend to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import SupabaseProductService from './src/services/SupabaseProductService';
import type { Product } from './src/data/products';

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client for verification
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test product data
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
  discount: 25
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
    console.log('   Details:', details);
  }
}

async function testDatabaseConnectivity() {
  console.log('\n🔍 Testing database connectivity...');
  
  try {
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('products')
      .select('count')
      .limit(1);
    
    if (healthError) {
      logTest('Database Connection', false, `Cannot connect to products table: ${healthError.message}`);
      return false;
    }
    
    logTest('Database Connection', true, 'Successfully connected to Supabase products table');
    
    // Get current product count
    const { data: products, error: countError } = await supabaseAdmin
      .from('products')
      .select('id');
    
    if (countError) {
      logTest('Product Count Query', false, `Cannot query products: ${countError.message}`);
      return false;
    }
    
    logTest('Product Count Query', true, `Found ${products?.length || 0} existing products in database`);
    return true;
    
  } catch (error) {
    logTest('Database Connection', false, `Connection failed: ${error}`);
    return false;
  }
}

async function testSupabaseProductService() {
  console.log('\n🧪 Testing SupabaseProductService...');
  
  try {
    // Test getAllProducts method
    const allProducts = await SupabaseProductService.getAllProducts();
    logTest('SupabaseProductService.getAllProducts', true, `Retrieved ${allProducts.length} products`);
    
    // Test addProduct method
    console.log('   Adding test product...');
    const createdProduct = await SupabaseProductService.addProduct(testProduct);
    
    if (!createdProduct) {
      logTest('SupabaseProductService.addProduct', false, 'addProduct returned null');
      return null;
    }
    
    if (!createdProduct.id) {
      logTest('SupabaseProductService.addProduct', false, 'Created product missing ID');
      return null;
    }
    
    logTest('SupabaseProductService.addProduct', true, `Product created with ID: ${createdProduct.id}`);
    
    // Verify the product was actually saved to database
    const { data: savedProduct, error: getError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', createdProduct.id)
      .single();
    
    if (getError) {
      logTest('Database Verification', false, `Cannot retrieve saved product: ${getError.message}`);
      return createdProduct;
    }
    
    if (!savedProduct) {
      logTest('Database Verification', false, 'Product not found in database after creation');
      return createdProduct;
    }
    
    // Verify product data matches
    const dataMatches = (
      savedProduct.name === testProduct.name &&
      savedProduct.price === testProduct.price &&
      savedProduct.category === testProduct.category &&
      savedProduct.description === testProduct.description
    );
    
    if (dataMatches) {
      logTest('Database Verification', true, 'Product data correctly saved to database');
    } else {
      logTest('Database Verification', false, 'Product data in database does not match input', {
        expected: testProduct,
        actual: savedProduct
      });
    }
    
    return createdProduct;
    
  } catch (error) {
    logTest('SupabaseProductService.addProduct', false, `Error: ${error}`);
    return null;
  }
}

async function testProductUpdate(productId: string) {
  console.log('\n🔄 Testing product update...');
  
  try {
    const updateData = {
      name: `Updated Test Product ${Date.now()}`,
      price: 1800,
      description: 'This product has been updated by the test script'
    };
    
    const updatedProduct = await SupabaseProductService.updateProduct(productId, updateData);
    
    if (!updatedProduct) {
      logTest('SupabaseProductService.updateProduct', false, 'updateProduct returned null');
      return false;
    }
    
    // Verify update in database
    const { data: savedProduct, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      logTest('Update Verification', false, `Cannot retrieve updated product: ${error.message}`);
      return false;
    }
    
    const updateMatches = (
      savedProduct.name === updateData.name &&
      savedProduct.price === updateData.price &&
      savedProduct.description === updateData.description
    );
    
    if (updateMatches) {
      logTest('Product Update', true, 'Product successfully updated in database');
    } else {
      logTest('Product Update', false, 'Update data does not match database', {
        expected: updateData,
        actual: { name: savedProduct.name, price: savedProduct.price, description: savedProduct.description }
      });
    }
    
    return updateMatches;
    
  } catch (error) {
    logTest('SupabaseProductService.updateProduct', false, `Error: ${error}`);
    return false;
  }
}

async function testProductDeletion(productId: string) {
  console.log('\n🗑️ Testing product deletion...');
  
  try {
    const deleteSuccess = await SupabaseProductService.deleteProduct(productId);
    
    if (!deleteSuccess) {
      logTest('SupabaseProductService.deleteProduct', false, 'deleteProduct returned false');
      return false;
    }
    
    // Verify deletion in database
    const { data: deletedProduct, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    // We expect an error here because the product should not exist
    if (!error) {
      logTest('Delete Verification', false, 'Product still exists in database after deletion');
      return false;
    }
    
    if (error.code === 'PGRST116') { // No rows returned
      logTest('Product Deletion', true, 'Product successfully deleted from database');
      return true;
    } else {
      logTest('Delete Verification', false, `Unexpected error: ${error.message}`);
      return false;
    }
    
  } catch (error) {
    logTest('SupabaseProductService.deleteProduct', false, `Error: ${error}`);
    return false;
  }
}

async function testRealTimeSubscription() {
  console.log('\n📡 Testing real-time subscription...');
  
  return new Promise<boolean>((resolve) => {
    let subscriptionReceived = false;
    let timeoutId: NodeJS.Timeout;
    
    // Set up subscription
    const subscription = supabaseAdmin
      .channel('test_products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          subscriptionReceived = true;
          logTest('Real-time Subscription', true, 'Received real-time update notification');
          supabaseAdmin.removeChannel(subscription);
          clearTimeout(timeoutId);
          resolve(true);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   Subscription active, creating test product...');
          
          // Create a test product to trigger the subscription
          const testRealTimeProduct = {
            ...testProduct,
            name: `Real-time Test Product ${Date.now()}`
          };
          
          try {
            const created = await SupabaseProductService.addProduct(testRealTimeProduct);
            if (created) {
              console.log('   Test product created, waiting for real-time notification...');
              
              // Clean up the test product after a short delay
              setTimeout(async () => {
                try {
                  await SupabaseProductService.deleteProduct(created.id);
                } catch (e) {
                  console.log('   Note: Could not clean up real-time test product');
                }
              }, 5000);
            }
          } catch (error) {
            console.log('   Error creating real-time test product:', error);
          }
        }
      });
    
    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      if (!subscriptionReceived) {
        logTest('Real-time Subscription', false, 'No real-time notification received within 10 seconds');
        supabaseAdmin.removeChannel(subscription);
        resolve(false);
      }
    }, 10000);
  });
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing data integrity and constraints...');
  
  try {
    // Test with invalid category
    const invalidProduct = {
      ...testProduct,
      name: `Invalid Category Test ${Date.now()}`,
      category: 'invalid_category_that_should_not_exist'
    };
    
    try {
      await SupabaseProductService.addProduct(invalidProduct);
      logTest('Invalid Category Test', false, 'Should have rejected invalid category');
    } catch (error) {
      // This is expected - invalid category should be rejected
      logTest('Invalid Category Test', true, 'Correctly rejected invalid category');
    }
    
    // Test with missing required fields
    const incompleteProduct = {
      name: `Incomplete Product ${Date.now()}`,
      // Missing required fields like price, category
    };
    
    try {
      await SupabaseProductService.addProduct(incompleteProduct as any);
      logTest('Required Fields Test', false, 'Should have rejected product with missing required fields');
    } catch (error) {
      logTest('Required Fields Test', true, 'Correctly rejected product with missing required fields');
    }
    
  } catch (error) {
    logTest('Data Integrity Test', false, `Unexpected error: ${error}`);
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive product creation tests...\n');
  
  // Test 1: Database connectivity
  const dbConnected = await testDatabaseConnectivity();
  if (!dbConnected) {
    console.log('\n❌ Database connectivity failed. Cannot proceed with further tests.');
    return;
  }
  
  // Test 2: SupabaseProductService
  const createdProduct = await testSupabaseProductService();
  if (!createdProduct) {
    console.log('\n❌ Product creation failed. Skipping update and delete tests.');
  } else {
    // Test 3: Product update
    await testProductUpdate(createdProduct.id);
    
    // Test 4: Product deletion
    await testProductDeletion(createdProduct.id);
  }
  
  // Test 5: Real-time subscription
  await testRealTimeSubscription();
  
  // Test 6: Data integrity
  await testDataIntegrity();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.message}`);
  });
  
  console.log('='.repeat(50));
  console.log(`Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Product creation is working correctly end-to-end.');
  } else {
    console.log(`\n⚠️ ${total - passed} test(s) failed. Product creation may have issues.`);
  }
  
  // Return summary for programmatic use
  return {
    passed,
    total,
    success: passed === total,
    results: testResults
  };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runTests, testResults };
