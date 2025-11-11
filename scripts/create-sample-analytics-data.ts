/**
 * Create Sample Analytics Data
 * 
 * This script creates realistic sample orders across different dates
 * to populate the admin Performance Analytics dashboard with meaningful data.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Sample product data
const SAMPLE_PRODUCTS = [
  { id: 'prod-1', name: 'Premium Coffee Beans 1kg', price: 1500, sku: 'COF-001' },
  { id: 'prod-2', name: 'Organic Green Tea 500g', price: 800, sku: 'TEA-001' },
  { id: 'prod-3', name: 'Honey Natural 500ml', price: 600, sku: 'HON-001' },
  { id: 'prod-4', name: 'Cooking Oil 2L', price: 450, sku: 'OIL-001' },
  { id: 'prod-5', name: 'Rice 5kg', price: 950, sku: 'RIC-001' },
  { id: 'prod-6', name: 'Milk 1L', price: 120, sku: 'MLK-001' },
];

// Sample customer data
const SAMPLE_CUSTOMERS = [
  { name: 'John Mwangi', email: 'john.mwangi@gmail.com', phone: '+254712345678' },
  { name: 'Mary Akinyi', email: 'mary.akinyi@gmail.com', phone: '+254723456789' },
  { name: 'David Kamau', email: 'david.kamau@gmail.com', phone: '+254734567890' },
  { name: 'Grace Wanjiru', email: 'grace.wanjiru@gmail.com', phone: '+254745678901' },
  { name: 'Peter Ochieng', email: 'peter.ochieng@gmail.com', phone: '+254756789012' },
];

// Order statuses weighted by probability
const ORDER_STATUSES = [
  { status: 'delivered', weight: 60 },
  { status: 'in_transit', weight: 20 },
  { status: 'confirmed', weight: 15 },
  { status: 'cancelled', weight: 5 },
];

function getWeightedRandomStatus(): string {
  const total = ORDER_STATUSES.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * total;
  
  for (const statusObj of ORDER_STATUSES) {
    random -= statusObj.weight;
    if (random <= 0) return statusObj.status;
  }
  
  return 'delivered';
}

function getRandomItems(): { productId: string; name: string; price: number; quantity: number }[] {
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const items: any[] = [];
  const selectedProducts = new Set<number>();
  
  for (let i = 0; i < numItems; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * SAMPLE_PRODUCTS.length);
    } while (selectedProducts.has(idx));
    
    selectedProducts.add(idx);
    const product = SAMPLE_PRODUCTS[idx];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
    
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      sku: product.sku,
    });
  }
  
  return items;
}

function getRandomCustomer() {
  return SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
}

function generateDateInPast(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  // Random hour between 8 AM and 8 PM
  date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
}

async function createSampleOrder(daysAgo: number) {
  const items = getRandomItems();
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 1000 ? 0 : 150; // Free delivery over KES 1000
  const total = subtotal + deliveryFee;
  
  const customer = getRandomCustomer();
  const status = getWeightedRandomStatus();
  const createdAt = generateDateInPast(daysAgo);
  
  const orderData = {
    // Store total in cents (database schema requirement)
    total_amount: total * 100,
    status: status,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    order_items: items,
    delivery_fee: deliveryFee * 100, // in cents
    delivery_address: {
      street: 'Sample Street',
      city: 'Nairobi',
      coordinates: {
        lat: -1.2921,
        lng: 36.8219,
      }
    },
    payment_method: Math.random() > 0.5 ? 'mpesa' : 'card',
    created_at: createdAt,
    updated_at: createdAt,
  };
  
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) {
    console.error(`❌ Error creating order for ${daysAgo} days ago:`, error);
    return null;
  }
  
  return data;
}

async function main() {
  console.log('🚀 Creating sample analytics data...\n');
  
  const DAYS_TO_POPULATE = 90; // Create orders for last 90 days
  const ORDERS_PER_DAY_MIN = 2;
  const ORDERS_PER_DAY_MAX = 8;
  
  let totalOrders = 0;
  let successCount = 0;
  
  for (let daysAgo = 0; daysAgo < DAYS_TO_POPULATE; daysAgo++) {
    const ordersForDay = Math.floor(Math.random() * (ORDERS_PER_DAY_MAX - ORDERS_PER_DAY_MIN + 1)) + ORDERS_PER_DAY_MIN;
    
    process.stdout.write(`Creating orders for ${daysAgo} days ago (${ordersForDay} orders)... `);
    
    for (let i = 0; i < ordersForDay; i++) {
      totalOrders++;
      const order = await createSampleOrder(daysAgo);
      if (order) {
        successCount++;
      }
    }
    
    console.log(`✅ ${ordersForDay} orders created`);
  }
  
  console.log(`\n✨ Sample data creation complete!`);
  console.log(`📊 Total orders attempted: ${totalOrders}`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${totalOrders - successCount}`);
  console.log(`\n🎉 You can now check the Admin Performance Analytics dashboard!`);
}

main().catch(console.error);
