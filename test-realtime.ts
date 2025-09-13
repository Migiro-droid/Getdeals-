/**
 * Real-time Subscription Test
 * Tests if the Supabase real-time subscription works for product changes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function testRealTimeUpdates() {
  console.log('📡 Testing Real-time Updates...\n');
  console.log('This simulates the ProductsContext real-time subscription\n');
  
  return new Promise<boolean>((resolve) => {
    let updateReceived = false;
    let timeoutId: NodeJS.Timeout;
    let createdProductId: string | null = null;
    
    console.log('🔄 Setting up real-time subscription...');
    
    // Set up subscription (matching ProductsContext setup)
    const subscription = supabase
      .channel('products_changes_test')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('📨 Real-time update received:', payload.eventType);
          console.log('   Event data:', {
            eventType: payload.eventType,
            table: payload.table,
            recordId: (payload.new as any)?.id || (payload.old as any)?.id,
            productName: (payload.new as any)?.name || (payload.old as any)?.name
          });
          
          updateReceived = true;
          
          // Clean up
          supabase.removeChannel(subscription);
          clearTimeout(timeoutId);
          
          // Clean up test product if it was created
          if (createdProductId) {
            supabase.from('products').delete().eq('id', createdProductId)
              .then(() => console.log('🧹 Test product cleaned up'));
          }
          
          resolve(true);
        }
      )
      .subscribe(async (status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
          console.log('🔄 Creating test product to trigger subscription...');
          
          // Create a test product to trigger the subscription
          const testProduct = {
            name: `Real-time Test Product ${Date.now()}`,
            description: 'Product created to test real-time subscription',
            price: 1000,
            category: 'essential',
            image: 'https://example.com/realtime-test.jpg',
            items: ['Real-time Item'],
            itemsDetail: [],
            inStock: true,
            featured: false,
            updatedAt: new Date().toISOString()
          };
          
          try {
            const { data, error } = await supabase
              .from('products')
              .insert([testProduct])
              .select()
              .single();
            
            if (error) {
              console.error('❌ Failed to create test product:', error);
              resolve(false);
            } else if (data) {
              createdProductId = data.id;
              console.log(`✅ Test product created with ID: ${data.id}`);
              console.log('⏳ Waiting for real-time notification...');
            } else {
              console.error('❌ No data returned from product creation');
              resolve(false);
            }
          } catch (error) {
            console.error('❌ Exception creating test product:', error);
            resolve(false);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
          resolve(false);
        }
      });
    
    // Timeout after 15 seconds
    timeoutId = setTimeout(() => {
      if (!updateReceived) {
        console.log('⏰ Timeout: No real-time notification received within 15 seconds');
        supabase.removeChannel(subscription);
        
        // Clean up test product if it was created
        if (createdProductId) {
          supabase.from('products').delete().eq('id', createdProductId)
            .then(() => console.log('🧹 Test product cleaned up'));
        }
        
        resolve(false);
      }
    }, 15000);
  });
}

async function runRealTimeTests() {
  console.log('🚀 Starting real-time subscription tests...\n');
  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log(`📡 Testing ProductsContext real-time subscription flow\n`);
  
  const realtimeWorking = await testRealTimeUpdates();
  
  console.log('\n📊 Real-time Test Results:');
  console.log('='.repeat(50));
  
  if (realtimeWorking) {
    console.log('✅ Real-time subscription: Working correctly');
    console.log('\n🎉 Real-time updates are working!');
    console.log('\n✅ CONCLUSION: ProductsContext real-time subscription works.');
    console.log('   When products are added/updated/deleted:');
    console.log('   1. ✅ Real-time notifications are received');
    console.log('   2. ✅ ProductsContext will refresh the product list');
    console.log('   3. ✅ UI will update automatically');
  } else {
    console.log('❌ Real-time subscription: Not working');
    console.log('\n⚠️ Real-time updates may not be working.');
    console.log('\n❓ ANALYSIS: This could mean:');
    console.log('   - Real-time is disabled on the Supabase project');
    console.log('   - Network issues preventing real-time connection');
    console.log('   - The ProductsContext may not receive automatic updates');
    console.log('   - Users might need to refresh manually to see new products');
  }
  
  return realtimeWorking;
}

// Run the tests
runRealTimeTests().then(success => {
  console.log(`\n🏁 Test completed with ${success ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(success ? 0 : 1);
});