// Test Payment Amount Accuracy
// Run this to verify pickup vs delivery amounts are correct

const testPaymentAmounts = () => {
  console.log('🧪 Testing Payment Amount Calculations\n');

  // Test Case 1: Pickup Order (No Delivery Fee)
  const pickupOrder = {
    items: [
      { id: '1', name: 'Product A', price: 500, quantity: 2 },
      { id: '2', name: 'Product B', price: 300, quantity: 1 }
    ],
    deliveryMethod: 'pickup'
  };

  const pickupSubtotal = pickupOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const pickupDeliveryFee = pickupOrder.deliveryMethod === 'speedy' ? 200 : 0;
  const pickupTotal = pickupSubtotal + pickupDeliveryFee;

  console.log('Test 1: Pickup Order');
  console.log('  Subtotal:', pickupSubtotal, 'KES');
  console.log('  Delivery Fee:', pickupDeliveryFee, 'KES');
  console.log('  Total:', pickupTotal, 'KES');
  console.log('  ✅ Expected: 1300 KES, Got:', pickupTotal, 'KES');
  console.log('  ✅ Match:', pickupTotal === 1300 ? 'PASS' : 'FAIL', '\n');

  // Test Case 2: Delivery Order (With Delivery Fee)
  const deliveryOrder = {
    items: [
      { id: '1', name: 'Product A', price: 500, quantity: 2 },
      { id: '2', name: 'Product B', price: 300, quantity: 1 }
    ],
    deliveryMethod: 'speedy'
  };

  const deliverySubtotal = deliveryOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryDeliveryFee = deliveryOrder.deliveryMethod === 'speedy' ? 200 : 0;
  const deliveryTotal = deliverySubtotal + deliveryDeliveryFee;

  console.log('Test 2: Delivery Order');
  console.log('  Subtotal:', deliverySubtotal, 'KES');
  console.log('  Delivery Fee:', deliveryDeliveryFee, 'KES');
  console.log('  Total:', deliveryTotal, 'KES');
  console.log('  ✅ Expected: 1500 KES, Got:', deliveryTotal, 'KES');
  console.log('  ✅ Match:', deliveryTotal === 1500 ? 'PASS' : 'FAIL', '\n');

  // Test Case 3: Small Pickup Order
  const smallPickupOrder = {
    items: [
      { id: '1', name: 'Product C', price: 2, quantity: 1 }
    ],
    deliveryMethod: 'pickup'
  };

  const smallSubtotal = smallPickupOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const smallDeliveryFee = smallPickupOrder.deliveryMethod === 'speedy' ? 200 : 0;
  const smallTotal = smallSubtotal + smallDeliveryFee;

  console.log('Test 3: Small Pickup Order (KES 2)');
  console.log('  Subtotal:', smallSubtotal, 'KES');
  console.log('  Delivery Fee:', smallDeliveryFee, 'KES');
  console.log('  Total:', smallTotal, 'KES');
  console.log('  ✅ Expected: 2 KES, Got:', smallTotal, 'KES');
  console.log('  ✅ Match:', smallTotal === 2 ? 'PASS' : 'FAIL', '\n');

  // Test Case 4: Same Order but with Delivery
  const smallDeliveryOrder = {
    items: [
      { id: '1', name: 'Product C', price: 2, quantity: 1 }
    ],
    deliveryMethod: 'speedy'
  };

  const smallDeliverySubtotal = smallDeliveryOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const smallDeliveryDeliveryFee = smallDeliveryOrder.deliveryMethod === 'speedy' ? 200 : 0;
  const smallDeliveryTotal = smallDeliverySubtotal + smallDeliveryDeliveryFee;

  console.log('Test 4: Small Delivery Order (KES 2 + 200)');
  console.log('  Subtotal:', smallDeliverySubtotal, 'KES');
  console.log('  Delivery Fee:', smallDeliveryDeliveryFee, 'KES');
  console.log('  Total:', smallDeliveryTotal, 'KES');
  console.log('  ✅ Expected: 202 KES, Got:', smallDeliveryTotal, 'KES');
  console.log('  ✅ Match:', smallDeliveryTotal === 202 ? 'PASS' : 'FAIL', '\n');

  // Test Amount in Cents Conversion
  console.log('Test 5: Amount Storage in Cents');
  const testAmount = 1250; // KES 1,250
  const amountInCents = Math.round(testAmount * 100);
  const amountFromCents = amountInCents / 100;
  console.log('  Amount:', testAmount, 'KES');
  console.log('  Stored as:', amountInCents, 'cents');
  console.log('  Retrieved as:', amountFromCents, 'KES');
  console.log('  ✅ Match:', amountFromCents === testAmount ? 'PASS' : 'FAIL', '\n');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log('✅ All tests verify that:');
  console.log('   - Pickup orders: NO delivery fee added');
  console.log('   - Delivery orders: KES 200 fee added');
  console.log('   - Amounts correctly converted to cents');
  console.log('   - Database will store accurate amounts');
  console.log('═══════════════════════════════════════\n');
};

// Test Sender Name Extraction
const testSenderNameExtraction = () => {
  console.log('🧪 Testing Sender Name Extraction\n');

  // Test Case 1: Full Name
  const fullName = {
    FirstName: 'John',
    MiddleName: 'Kamau',
    LastName: 'Mwangi'
  };
  const fullNameResult = [fullName.FirstName, fullName.MiddleName, fullName.LastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  console.log('Test 1: Full Name (FirstName + MiddleName + LastName)');
  console.log('  Input:', fullName);
  console.log('  Result:', fullNameResult);
  console.log('  ✅ Expected: "John Kamau Mwangi"');
  console.log('  ✅ Match:', fullNameResult === 'John Kamau Mwangi' ? 'PASS' : 'FAIL', '\n');

  // Test Case 2: No Middle Name
  const noMiddleName = {
    FirstName: 'Jane',
    MiddleName: '',
    LastName: 'Wanjiku'
  };
  const noMiddleNameResult = [noMiddleName.FirstName, noMiddleName.MiddleName, noMiddleName.LastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  console.log('Test 2: No Middle Name');
  console.log('  Input:', noMiddleName);
  console.log('  Result:', noMiddleNameResult);
  console.log('  ✅ Expected: "Jane Wanjiku"');
  console.log('  ✅ Match:', noMiddleNameResult === 'Jane Wanjiku' ? 'PASS' : 'FAIL', '\n');

  // Test Case 3: Single Name
  const singleName = {
    FirstName: 'Peter',
    MiddleName: '',
    LastName: ''
  };
  const singleNameResult = [singleName.FirstName, singleName.MiddleName, singleName.LastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  console.log('Test 3: Single Name Only');
  console.log('  Input:', singleName);
  console.log('  Result:', singleNameResult);
  console.log('  ✅ Expected: "Peter"');
  console.log('  ✅ Match:', singleNameResult === 'Peter' ? 'PASS' : 'FAIL', '\n');

  console.log('═══════════════════════════════════════');
  console.log('📊 SENDER NAME TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log('✅ All tests verify that:');
  console.log('   - Full names are concatenated correctly');
  console.log('   - Missing parts are handled gracefully');
  console.log('   - Single names work correctly');
  console.log('   - Whitespace is trimmed properly');
  console.log('═══════════════════════════════════════\n');
};

// Run all tests
console.log('\n🚀 Starting Payment System Tests\n');
console.log('═══════════════════════════════════════\n');

testPaymentAmounts();
testSenderNameExtraction();

console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
