import { createProduct } from './lib/db.js';

async function testProductCreation() {
  console.log('🧪 Testing product creation...');

  const testProduct = {
    name: 'Test Product',
    price: 100,
    originalPrice: 120,
    image: 'https://example.com/test.jpg',
    discount: 0,
    items: ['test', 'product'],
    itemsDetail: { inStock: true },
    category: 'test',
    description: 'This is a test product'
  };

  try {
    const result = await createProduct(testProduct);
    if (result) {
      console.log('✅ Product created successfully!');
      console.log('Product ID:', result.id);
      console.log('Product Name:', result.name);
    } else {
      console.log('❌ Failed to create product');
    }
  } catch (error) {
    console.error('❌ Error creating product:', error);
  }
}

testProductCreation();
