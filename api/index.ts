import { VercelRequest, VercelResponse } from '@vercel/node';
// Using Supabase-backed DB helpers from ../lib/db (server-side service role)

// Validate product input
function validateProductInput(data: any) {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Product name is required and must be a non-empty string');
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Product price is required and must be a positive number');
  }
  
  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('Product category is required and must be a non-empty string');
  }
  
  if (!data.image || typeof data.image !== 'string' || !data.image.trim()) {
    errors.push('Product image URL is required and must be a non-empty string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      name: data.name?.trim(),
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : data.price,
      image: data.image?.trim(),
      category: data.category?.trim(),
      description: data.description?.trim() || '',
      items: Array.isArray(data.items) ? data.items : [],
      items_detail: Array.isArray(data.itemsDetail) ? data.itemsDetail : []
    }
  };
}

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
        database: 'supabase'
      });
    }

    // Database seeding endpoint
    if (method === 'POST' && path === '/api/seed') {
      const { seedDatabase } = await import('../lib/db');
      await seedDatabase();
      return res.status(200).json({ message: 'Database seeded successfully' });
    }

    // Individual product operations (handled by api/products/[id].ts)
    if (path.startsWith('/api/products/')) {
      const { getProducts, updateProduct, deleteProduct } = await import('../lib/db');
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
      const { getUsers } = await import('../lib/db');
      const users = await getUsers();
      return res.status(200).json(users);
    }

    // Orders endpoints  
    if (path === '/api/orders' && method === 'GET') {
      const { getOrders } = await import('../lib/db');
      const orders = await getOrders();
      return res.status(200).json(orders);
    }

    // M-Pesa payment endpoints - Basic implementation for demo
    if (path === '/api/payments/mpesa/stk-push' && method === 'POST') {
      try {
        // For demo purposes, simulate a successful STK push
        const { amount, phoneNumber, orderReference } = req.body;
        
        console.log('M-Pesa STK Push request:', { amount, phoneNumber, orderReference });
        
        // Basic validation
        if (!amount || !phoneNumber || !orderReference) {
          return res.status(400).json({ 
            success: false, 
            error: 'Amount, phone number, and order reference are required' 
          });
        }

        // Simulate STK push response
        const mockResponse = {
          success: true,
          CheckoutRequestID: `ws_CO_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          MerchantRequestID: `mr_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Success. Request accepted for processing"
        };

        console.log('M-Pesa STK Push response:', mockResponse);
        return res.status(200).json(mockResponse);
      } catch (error) {
        console.error('M-Pesa STK Push error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Internal server error during payment initiation' 
        });
      }
    }

    // M-Pesa payment status query
    if (path.startsWith('/api/payments/mpesa/query/') && method === 'GET') {
      try {
        const checkoutRequestId = path.split('/')[5];
        
        console.log('M-Pesa status query for:', checkoutRequestId);
        
        if (!checkoutRequestId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Checkout request ID is required' 
          });
        }

        // For demo purposes, simulate payment completion after a short delay
        // In production, this would query the actual M-Pesa API
        const mockStatusResponse = {
          success: true,
          status: 'completed',
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CheckoutRequestID: checkoutRequestId
        };

        console.log('M-Pesa status response:', mockStatusResponse);
        return res.status(200).json(mockStatusResponse);
      } catch (error) {
        console.error('M-Pesa status query error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Internal server error during status check' 
        });
      }
    }

    // Orders creation endpoint
    if (path === '/api/orders' && method === 'POST') {
      try {
        // Basic order creation for demo
        const orderData = req.body;
        
        console.log('Order creation request:', orderData);
        
        const newOrder = {
          id: `order_${Date.now()}`,
          ...orderData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          orderNumber: `GD${Date.now().toString().slice(-8)}`
        };

        console.log('Order created:', newOrder);
        return res.status(201).json({ 
          success: true, 
          order: newOrder 
        });
      } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Internal server error during order creation' 
        });
      }
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
