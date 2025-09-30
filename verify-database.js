// Database verification script
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fxyifnckgllxqbggegtw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWlmbmNrZ2xseHFiZ2dlZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3Mzc2NSwiZXhwIjoyMDcxODQ5NzY1fQ.O37uiOPHKQoFOCUY4aor3wxYsYEUn10m0fH9h0uHoAU'
);

async function verifyDatabase() {
  console.log('🔍 Verifying M-Pesa database integration...');
  
  try {
    // Check recent M-Pesa payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('method', 'mpesa')
      .order('createdAt', { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error('❌ Payments table error:', paymentsError);
    } else {
      console.log('✅ Recent M-Pesa Payments:');
      if (payments.length > 0) {
        payments.forEach(payment => {
          console.log(`📄 Payment ${payment.id}:`);
          console.log(`   Order ID: ${payment.order_id}`);
          console.log(`   Amount: KES ${payment.amount / 100}`);
          console.log(`   Status: ${payment.status}`);
          console.log(`   Transaction ID: ${payment.transaction_id}`);
          console.log(`   Created: ${payment.createdAt}`);
          console.log('   ---');
        });
      } else {
        console.log('   No M-Pesa payments found yet');
      }
    }

    // Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, paymentStatus, total, createdAt')
      .order('createdAt', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Orders table error:', ordersError);
    } else {
      console.log('✅ Recent Orders:');
      if (orders.length > 0) {
        orders.forEach(order => {
          console.log(`📦 Order ${order.id}:`);
          console.log(`   Status: ${order.status}`);
          console.log(`   Payment Status: ${order.paymentStatus}`);
          console.log(`   Total: ${order.total}`);
          console.log(`   Created: ${order.createdAt}`);
          console.log('   ---');
        });
      } else {
        console.log('   No orders found yet');
      }
    }

    console.log('🎯 Database verification completed!');

  } catch (error) {
    console.error('🚨 Database verification failed:', error);
  }
}

verifyDatabase();