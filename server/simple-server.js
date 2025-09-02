import express from 'express';
import cors from 'cors';
import { JSONDatabase } from './lib/database.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function validateProductInput(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Name is required');
  }
  
  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('Category is required');
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Price must be a positive number');
  }
  
  if (data.originalPrice && (typeof data.originalPrice !== 'number' || data.originalPrice < data.price)) {
    errors.push('Original price must be greater than or equal to price');
  }
  
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  
  return {
    ok: true,
    value: {
      name: data.name.trim(),
      image: data.image || '',
      category: data.category.trim(),
      price: data.price,
      originalPrice: data.originalPrice,
      description: data.description || '',
      items: Array.isArray(data.items) ? data.items : [],
      itemsDetail: Array.isArray(data.itemsDetail) ? data.itemsDetail : []
    }
  };
}

// Products API
app.get('/api/products', (req, res) => {
  try {
    const products = JSONDatabase.getAllProducts();
    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const check = validateProductInput(req.body);
    if (!check.ok) {
      return res.status(400).json({ message: 'Validation failed', errors: check.errors });
    }
    
    const product = JSONDatabase.addProduct(check.value);
    if (!product) {
      return res.status(500).json({ message: 'Failed to create product' });
    }
    
    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    
    // Partial validation
    const allowed = ['name', 'price', 'originalPrice', 'image', 'discount', 'items', 'itemsDetail', 'category', 'description'];
    const updates = {};
    
    for (const key of allowed) {
      if (key in patch) {
        if (key === 'price' || key === 'originalPrice') {
          const num = Number(patch[key]);
          if (!Number.isFinite(num) || num < 0) {
            return res.status(400).json({ message: `${key} must be a non-negative number` });
          }
          updates[key] = num;
        } else if (key === 'items') {
          updates.items = Array.isArray(patch.items) ? patch.items.map(String) : [];
        } else if (key === 'itemsDetail') {
          if (patch.itemsDetail == null) {
            updates.itemsDetail = [];
          } else if (!Array.isArray(patch.itemsDetail)) {
            return res.status(400).json({ message: 'itemsDetail must be an array' });
          } else {
            updates.itemsDetail = patch.itemsDetail
              .filter((it) => it && typeof it === 'object')
              .map((it) => ({ name: String(it.name || ''), image: String(it.image || '') }))
              .filter((it) => it.name);
          }
        } else if (patch[key] != null) {
          updates[key] = String(patch[key]);
        }
      }
    }
    
    const updatedProduct = JSONDatabase.updateProduct(id, updates);
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = JSONDatabase.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GetDeals Kenya API is running' });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const stats = JSONDatabase.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GetDeals Kenya API server running on http://localhost:${PORT}`);
  console.log(`📊 Stats available at http://localhost:${PORT}/api/stats`);
  console.log(`❤️  Health check at http://localhost:${PORT}/api/health`);
});
