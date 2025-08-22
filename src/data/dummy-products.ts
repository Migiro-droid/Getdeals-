export const products = [
  {
    id: 'dummy-1',
    name: 'Essential Basket - Starter',
    price: 1500,
    originalPrice: 1800,
    image: 'src/assets/essential-basket.jpg',
    items: ['1kg Rice', '500g Sugar', '250ml Cooking Oil'],
    itemsDetail: [{ name: 'Rice 1kg', image: '/src/assets/products/rice.jpg' }],
    category: 'essential',
    description: 'Starter essentials basket',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dummy-2',
    name: 'Family Basket - Standard',
    price: 5000,
    originalPrice: 6200,
    image: 'src/assets/family-basket.jpg',
    items: ['5kg Rice', '2kg Flour', '1L Oil'],
    itemsDetail: [{ name: 'Rice 5kg', image: '/src/assets/products/rice.jpg' }],
    category: 'family',
    description: 'Standard family basket',
    createdAt: new Date().toISOString(),
  }
];
