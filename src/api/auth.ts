// Authentication API service - Browser Compatible Version
import { fallbackDB } from '@/lib/fallback-db';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
  error?: string;
}

// Simulate JWT token generation (in production, use proper JWT library)
function generateToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload));
}

// Validate token (in production, use proper JWT verification)
function validateToken(token: string): { userId: string; isValid: boolean } {
  try {
    const payload = JSON.parse(atob(token));
    const isValid = payload.exp > Date.now();
    return { userId: payload.userId, isValid };
  } catch {
    return { userId: '', isValid: false };
  }
}

// Hash password (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  // Simple hashing for demo (use bcrypt in production)
  return btoa(password + 'salt123');
}

// Verify password
function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

export const authAPI = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const users = await fallbackDB.getUsers();
      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // In production, verify hashed password
      const isValidPassword = user.password && verifyPassword(credentials.password, user.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const token = generateToken(user.id);
      
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'customer' | 'admin',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: authUser,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Starting registration for:', data.email);
      
      // Check if user already exists
      const existingUsers = await fallbackDB.getUsers();
      const existingUser = existingUsers.find(u => u.email === data.email);
      
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Create new user
      const hashedPassword = hashPassword(data.password);
      const newUser = await fallbackDB.createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        phone: data.phone,
        role: 'customer',
        isVerified: false
      });

      const token = generateToken(newUser.id);
      
      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role as 'customer' | 'admin',
        isVerified: newUser.isVerified || false,
        createdAt: newUser.createdAt
      };

      console.log('Registration successful for:', newUser.email);
      return {
        success: true,
        user: authUser,
        token,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error instanceof Error ? error.message : error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      };
    }
  },

  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const { userId, isValid } = validateToken(token);
      
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }

      const users = await fallbackDB.getUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'customer' | 'admin',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: authUser,
        message: 'Token valid'
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Token verification failed'
      };
    }
  },

  async updateProfile(userId: string, updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    currentPassword: string;
    newPassword: string;
  }>): Promise<AuthResponse> {
    try {
      const users = await fallbackDB.getUsers();
      const user = users.find(u => u.id === userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // If changing password, verify current password
      if (updates.newPassword && updates.currentPassword) {
        if (!user.password || !verifyPassword(updates.currentPassword, user.password)) {
          return {
            success: false,
            error: 'Current password is incorrect'
          };
        }
        updates.newPassword = hashPassword(updates.newPassword);
      }

      // Update user in memory (in a real app, this would update the database)
      if (updates.firstName) user.firstName = updates.firstName;
      if (updates.lastName) user.lastName = updates.lastName;
      if (updates.phone) user.phone = updates.phone;
      if (updates.newPassword) user.password = updates.newPassword;

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'customer' | 'admin',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt
      };

      return {
        success: true,
        user: authUser,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Profile update failed'
      };
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const users = await fallbackDB.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If an account with this email exists, you will receive password reset instructions.'
        };
      }

      // In production, send actual email with reset token
      console.log(`Password reset requested for: ${email}`);
      
      return {
        success: true,
        message: 'Password reset instructions sent to your email.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Password reset request failed'
      };
    }
  }
};

export default authAPI;
