import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, getProducts, createProduct, updateProduct, deleteProduct, getUsers, getOrders, seedDatabase } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;
  const path = url?.split('?')[0] || '';

  try {
    // Health check
    if (method === 'GET' && path === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        database: 'neon-postgres'
      });
    }

    // Database seeding endpoint
    if (method === 'POST' && path === '/api/seed') {
      await seedDatabase();
      return res.status(200).json({ message: 'Database seeded successfully' });
    }

    // Products endpoints
    if (path === '/api/products') {
      if (method === 'GET') {
        const products = await getProducts();
        return res.status(200).json(products);
      }
      
      if (method === 'POST') {
        const newProduct = await createProduct(req.body);
        return res.status(201).json(newProduct);
      }
    }

    // Individual product operations
    if (path.startsWith('/api/products/')) {
      const productId = path.split('/')[3];

      if (method === 'GET') {
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json(product);
      }

      if (method === 'PUT') {
        const updatedProduct = await updateProduct(productId, req.body);
        if (!updatedProduct) {
          return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json(updatedProduct);
      }

      if (method === 'DELETE') {
        const deleted = await deleteProduct(productId);
        if (!deleted) {
          return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json({ message: 'Product deleted successfully' });
      }
    }

    // Users endpoints
    if (path === '/api/users' && method === 'GET') {
      const users = await getUsers();
      return res.status(200).json(users);
    }

    // Orders endpoints  
    if (path === '/api/orders' && method === 'GET') {
      const orders = await getOrders();
      return res.status(200).json(orders);
    }

    // Route not found
    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
