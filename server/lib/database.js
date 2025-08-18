import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../src/data/database.json');

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    products: [],
    users: [],
    orders: [],
    settings: {
      lastProductId: 0,
      lastOrderId: 0,
      lastUserId: 0
    }
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

export class JSONDatabase {
  static readData() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return {
        products: [],
        users: [],
        orders: [],
        settings: { lastProductId: 0, lastOrderId: 0, lastUserId: 0 }
      };
    }
  }

  static writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing database:', error);
      return false;
    }
  }

  // Product operations
  static getAllProducts() {
    const data = this.readData();
    return data.products || [];
  }

  static getProductById(id) {
    const products = this.getAllProducts();
    return products.find(p => p.id === id);
  }

  static addProduct(product) {
    const data = this.readData();
    const newId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProduct = {
      ...product,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    data.products.push(newProduct);
    data.settings.lastProductId++;
    
    if (this.writeData(data)) {
      return newProduct;
    }
    return null;
  }

  static updateProduct(id, updates) {
    const data = this.readData();
    const productIndex = data.products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return null;
    }
    
    data.products[productIndex] = {
      ...data.products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (this.writeData(data)) {
      return data.products[productIndex];
    }
    return null;
  }

  static deleteProduct(id) {
    const data = this.readData();
    const productIndex = data.products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return false;
    }
    
    data.products.splice(productIndex, 1);
    return this.writeData(data);
  }

  // User operations
  static getAllUsers() {
    const data = this.readData();
    return data.users || [];
  }

  static getUserById(id) {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  }

  static getUserByEmail(email) {
    const users = this.getAllUsers();
    return users.find(u => u.email === email);
  }

  static addUser(user) {
    const data = this.readData();
    const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      ...user,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    data.settings.lastUserId++;
    
    if (this.writeData(data)) {
      return newUser;
    }
    return null;
  }

  static updateUser(id, updates) {
    const data = this.readData();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return null;
    }
    
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (this.writeData(data)) {
      return data.users[userIndex];
    }
    return null;
  }

  // Order operations
  static getAllOrders() {
    const data = this.readData();
    return data.orders || [];
  }

  static getOrderById(id) {
    const orders = this.getAllOrders();
    return orders.find(o => o.id === id);
  }

  static addOrder(order) {
    const data = this.readData();
    const newId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newOrder = {
      ...order,
      id: newId,
      createdAt: new Date().toISOString(),
      status: order.status || 'pending'
    };
    
    data.orders.push(newOrder);
    data.settings.lastOrderId++;
    
    if (this.writeData(data)) {
      return newOrder;
    }
    return null;
  }

  static updateOrder(id, updates) {
    const data = this.readData();
    const orderIndex = data.orders.findIndex(o => o.id === id);
    
    if (orderIndex === -1) {
      return null;
    }
    
    data.orders[orderIndex] = {
      ...data.orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (this.writeData(data)) {
      return data.orders[orderIndex];
    }
    return null;
  }

  // Utility methods
  static getStats() {
    const data = this.readData();
    return {
      totalProducts: data.products.length,
      totalUsers: data.users.length,
      totalOrders: data.orders.length,
      basketProducts: data.products.filter(p => p.category === 'basket').length,
      essentialProducts: data.products.filter(p => p.category === 'essential').length,
      familyProducts: data.products.filter(p => p.category === 'family').length
    };
  }
}
