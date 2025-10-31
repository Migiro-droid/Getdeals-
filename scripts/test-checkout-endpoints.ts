#!/usr/bin/env ts-node
/**
 * Checkout Management API Test Script
 * 
 * Test the checkout and reimbursement endpoints
 * 
 * Usage:
 *   npx ts-node scripts/test-checkout-endpoints.ts
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface TestCase {
  name: string;
  endpoint: string;
  method: string;
  body: any;
  expectedStatus?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Verify Order (get order details without checkout)',
    endpoint: '/api/quickmart/orders/checkout/',
    method: 'POST',
    body: {
      order_number: 'test-order-001',
      action: 'verify'
    },
    expectedStatus: 200
  },
  {
    name: 'Checkout Order',
    endpoint: '/api/quickmart/orders/checkout/',
    method: 'POST',
    body: {
      order_number: 'test-order-001',
      action: 'checkout',
      admin_id: 'test-admin-001',
      admin_name: 'Test Admin',
      notes: 'Test checkout'
    },
    expectedStatus: 200
  },
  {
    name: 'Verify Already Checked Out Order (should fail)',
    endpoint: '/api/quickmart/orders/checkout/',
    method: 'POST',
    body: {
      order_number: 'test-order-001',
      action: 'checkout',
      admin_id: 'test-admin-001',
      admin_name: 'Test Admin'
    },
    expectedStatus: 409
  },
  {
    name: 'Process Reimbursement',
    endpoint: '/api/quickmart/orders/reimburse/',
    method: 'POST',
    body: {
      order_number: 'test-order-002',
      reason: 'damaged_item',
      amount: 2500,
      admin_id: 'test-admin-001',
      admin_name: 'Test Admin',
      notes: 'Item was damaged'
    },
    expectedStatus: 200
  },
  {
    name: 'Invalid Reimbursement Reason (should fail)',
    endpoint: '/api/quickmart/orders/reimburse/',
    method: 'POST',
    body: {
      order_number: 'test-order-003',
      reason: 'invalid_reason',
      admin_id: 'test-admin-001',
      admin_name: 'Test Admin'
    },
    expectedStatus: 400
  },
  {
    name: 'Checkout Non-existent Order (should fail)',
    endpoint: '/api/quickmart/orders/checkout/',
    method: 'POST',
    body: {
      order_number: 'non-existent-order',
      action: 'checkout',
      admin_id: 'test-admin-001',
      admin_name: 'Test Admin'
    },
    expectedStatus: 404
  }
];

async function runTests(): Promise<void> {
  console.log('🧪 Checkout Management API Test Suite\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Endpoint: ${testCase.method} ${testCase.endpoint}`);

    try {
      const response = await fetch(`${API_BASE_URL}${testCase.endpoint}`, {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });

      const data = await response.json();

      // Check status
      if (testCase.expectedStatus && response.status === testCase.expectedStatus) {
        console.log(`   ✅ Status: ${response.status} (expected)`);
        passedTests++;
      } else if (testCase.expectedStatus) {
        console.log(`   ❌ Status: ${response.status} (expected ${testCase.expectedStatus})`);
        failedTests++;
      } else {
        console.log(`   ℹ️  Status: ${response.status}`);
        passedTests++;
      }

      // Show response
      if (data.success) {
        console.log(`   ✅ Success: ${data.success}`);
        if (data.data) {
          console.log(`   📦 Data:`, JSON.stringify(data.data, null, 6).substring(0, 200));
        }
      } else if (data.error) {
        console.log(`   ⚠️  Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%\n`);

  if (failedTests === 0) {
    console.log('🎉 All tests passed! Checkout endpoints are working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }
}

async function setupTestData(): Promise<void> {
  console.log('📦 Setting up test data...\n');

  try {
    // Create test orders if they don't exist
    const testOrders = [
      {
        order_reference: 'test-order-001',
        customer_name: 'Test Customer 1',
        customer_phone: '254712345678',
        customer_email: 'test1@example.com',
        total_amount_kes: 5000,
        subtotal_kes: 4500,
        delivery_fee_kes: 500,
        status: 'pending',
        payment_status: 'paid',
        payment_method: 'mpesa'
      },
      {
        order_reference: 'test-order-002',
        customer_name: 'Test Customer 2',
        customer_phone: '254787654321',
        customer_email: 'test2@example.com',
        total_amount_kes: 8000,
        subtotal_kes: 7500,
        delivery_fee_kes: 500,
        status: 'pending',
        payment_status: 'paid',
        payment_method: 'card'
      },
      {
        order_reference: 'test-order-003',
        customer_name: 'Test Customer 3',
        customer_phone: '254711223344',
        customer_email: 'test3@example.com',
        total_amount_kes: 3000,
        subtotal_kes: 2500,
        delivery_fee_kes: 500,
        status: 'pending',
        payment_status: 'paid',
        payment_method: 'wallet'
      }
    ];

    for (const order of testOrders) {
      const { error } = await supabase
        .from('orders')
        .insert(order)
        .eq('order_reference', order.order_reference);

      if (!error) {
        console.log(`✅ Created test order: ${order.order_reference}`);
      } else if (error.code === '23505') {
        // Unique constraint violation - order already exists
        console.log(`ℹ️  Test order already exists: ${order.order_reference}`);
      } else {
        console.log(`⚠️  Error creating test order ${order.order_reference}:`, error.message);
      }
    }

    console.log('\n');
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

async function checkAuditLogs(): Promise<void> {
  console.log('\n📋 Checking Audit Logs...\n');

  try {
    const { data, error } = await supabase
      .from('checkout_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Error fetching audit logs:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  No audit logs found yet');
      return;
    }

    console.log(`Found ${data.length} recent audit log(s):\n`);
    data.forEach((log: any, index: number) => {
      console.log(`  ${index + 1}. ${log.action.toUpperCase()}`);
      console.log(`     Order: ${log.order_reference}`);
      console.log(`     Admin: ${log.admin_name}`);
      console.log(`     Time: ${new Date(log.created_at).toLocaleString()}`);
      if (log.reason) console.log(`     Reason: ${log.reason}`);
      console.log();
    });
  } catch (error) {
    console.error('Error checking audit logs:', error);
  }
}

async function main(): Promise<void> {
  try {
    // Setup test data
    await setupTestData();

    // Run tests
    await runTests();

    // Check audit logs
    await checkAuditLogs();
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  }
}

main();
