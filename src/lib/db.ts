// Database service using Prisma
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with proper configuration
const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  role?: string;
  isVerified?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
}

// User model interface matching Prisma schema
export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash?: string | null;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  firstName: string; // Derived from name
  lastName: string;  // Derived from name
  password?: string; // Alias for passwordHash
  isVerified: boolean; // Alias for emailVerified
}

export const db = {
  async getUsers(): Promise<DbUser[]> {
    try {
      const users = await prisma.user.findMany();
      return users.map(user => ({
        ...user,
        phone: user.phone || '',
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        password: user.passwordHash,
        isVerified: user.emailVerified
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getUserById(id: string): Promise<DbUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) return null;
      
      return {
        ...user,
        phone: user.phone || '',
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        password: user.passwordHash,
        isVerified: user.emailVerified
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  async createUser(data: CreateUserData): Promise<DbUser> {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      
      const user = await prisma.user.create({
        data: {
          name: fullName,
          email: data.email,
          phone: data.phone || null,
          passwordHash: data.password,
          role: data.role || 'customer',
          emailVerified: data.isVerified || false
        }
      });

      return {
        ...user,
        phone: user.phone || '',
        firstName: data.firstName,
        lastName: data.lastName,
        password: user.passwordHash,
        isVerified: user.emailVerified
      };
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Check for specific database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          if (error.message.includes('email')) {
            throw new Error('An account with this email already exists');
          } else if (error.message.includes('phone')) {
            throw new Error('An account with this phone number already exists');
          }
        }
      }
      
      throw new Error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },

  async updateUser(id: string, data: UpdateUserData): Promise<DbUser> {
    try {
      const updateData: any = {};
      
      if (data.firstName || data.lastName) {
        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (currentUser) {
          const currentFirstName = currentUser.name.split(' ')[0] || '';
          const currentLastName = currentUser.name.split(' ').slice(1).join(' ') || '';
          
          const firstName = data.firstName || currentFirstName;
          const lastName = data.lastName || currentLastName;
          updateData.name = `${firstName} ${lastName}`.trim();
        }
      }
      
      if (data.phone !== undefined) {
        updateData.phone = data.phone;
      }
      
      if (data.password) {
        updateData.passwordHash = data.password;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });

      return {
        ...user,
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        password: user.passwordHash,
        isVerified: user.emailVerified
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  async getProducts(): Promise<any[]> {
    try {
      return await prisma.product.findMany();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getOrders(): Promise<any[]> {
    try {
      return await prisma.order.findMany({
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  async createOrder(orderData: any): Promise<any> {
    try {
      return await prisma.order.create({
        data: orderData,
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }
};

export default db;
