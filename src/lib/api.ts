// API client for Vercel endpoints using Prisma
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  category: string;
  description?: string | null;
  featured: boolean;
  items?: string[];
  discount?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// Product API
export const productAPI = {
  // Get all products
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { data: null, error: { message: 'Failed to fetch products' } };
    }
  },

  // Get product by ID
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching product:', error);
      return { data: null, error: { message: 'Failed to fetch product' } };
    }
  },

  // Create new product
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating product:', error);
      return { data: null, error: { message: 'Failed to create product' } };
    }
  },

  // Update product
  update: async (id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      return { data: null, error: { message: 'Failed to update product' } };
    }
  },

  // Delete product
  delete: async (id: string): Promise<{ error: { message: string } | null }> => {
    try {
      const response = await fetch(`${API_BASE}/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting product:', error);
      return { error: { message: 'Failed to delete product' } };
    }
  },
};

// Category API
export const categoryAPI = {
  // Get all categories
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const categories = await response.json();
      // Transform to match expected format
      return { data: categories, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error: { message: 'Failed to fetch categories' } };
    }
  },
};
