// Simple fallback database for browser environment with localStorage persistence
import { storage } from './storage';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  firstName: string;
  lastName: string;
  password?: string;
  isVerified: boolean;
  createdAt: Date;
}

// Default admin user
const defaultUsers: User[] = [
  {
    id: '1',
    name: 'GetDeals Admin',
    email: 'admin@getdeals.co.ke',
    phone: '+254728322355',
    role: 'admin',
    firstName: 'GetDeals',
    lastName: 'Admin',
    password: 'YWRtaW4xMjNzYWx0MTIz', // admin123 hashed
    isVerified: true,
    createdAt: new Date()
  }
];

// Get users from localStorage or use defaults
function getStoredUsers(): User[] {
  try {
    const stored = storage.getItem('getdeals_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));
    }
  } catch (error) {
    console.warn('Failed to load users from localStorage:', error);
  }
  return [...defaultUsers];
}

// Save users to localStorage
function saveUsers(users: User[]) {
  try {
    storage.setItem('getdeals_users', JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save users to localStorage:', error);
  }
}

export const fallbackDB = {
  async getUsers(): Promise<User[]> {
    return getStoredUsers();
  },
  
  async createUser(data: any): Promise<User> {
    const users = getStoredUsers();
    
    // Check for existing email
    if (users.find(u => u.email === data.email)) {
      throw new Error('An account with this email already exists');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone || '',
      role: data.role || 'customer',
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      isVerified: false,
      createdAt: new Date()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return newUser;
  },
  
  async updateUser(userId: string, updates: any): Promise<User> {
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update user
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    return users[userIndex];
  }
};
