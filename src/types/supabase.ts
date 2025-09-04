export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          price: number
          originalPrice: number | null
          image: string
          discount: number | null
          items: string[]
          itemsDetail: Json | null
          category: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          originalPrice?: number | null
          image: string
          discount?: number | null
          items: string[]
          itemsDetail?: Json | null
          category: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          originalPrice?: number | null
          image?: string
          discount?: number | null
          items?: string[]
          itemsDetail?: Json | null
          category?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          passwordHash: string | null
          role: string
          twoFactorEnabled: boolean
          twoFactorSecret: string | null
          emailVerified: boolean
          phoneVerified: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          passwordHash?: string | null
          role?: string
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          emailVerified?: boolean
          phoneVerified?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          passwordHash?: string | null
          role?: string
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          emailVerified?: boolean
          phoneVerified?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      orders: {
        Row: {
          id: string
          userId: string
          total: number
          subtotal: number
          deliveryFee: number
          status: string
          paymentStatus: string
          paymentMethod: string | null
          deliveryMethod: string
          deliveryDate: string | null
          notes: string | null
          createdAt: string
          updatedAt: string
          addressId: string | null
        }
        Insert: {
          id?: string
          userId: string
          total: number
          subtotal: number
          deliveryFee: number
          status?: string
          paymentStatus?: string
          paymentMethod?: string | null
          deliveryMethod?: string
          deliveryDate?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          addressId?: string | null
        }
        Update: {
          id?: string
          userId?: string
          total?: number
          subtotal?: number
          deliveryFee?: number
          status?: string
          paymentStatus?: string
          paymentMethod?: string | null
          deliveryMethod?: string
          deliveryDate?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          addressId?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          orderId: string
          productId: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          orderId: string
          productId: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          orderId?: string
          productId?: string
          quantity?: number
          price?: number
        }
      }
      payments: {
        Row: {
          id: string
          orderId: string
          amount: number
          method: string
          status: string
          transactionId: string | null
          phoneNumber: string | null
          reference: string | null
          failureReason: string | null
          processedAt: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          orderId: string
          amount: number
          method: string
          status?: string
          transactionId?: string | null
          phoneNumber?: string | null
          reference?: string | null
          failureReason?: string | null
          processedAt?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          orderId?: string
          amount?: number
          method?: string
          status?: string
          transactionId?: string | null
          phoneNumber?: string | null
          reference?: string | null
          failureReason?: string | null
          processedAt?: string | null
          createdAt?: string
        }
      }
      addresses: {
        Row: {
          id: string
          userId: string
          name: string
          street: string
          city: string
          county: string
          postalCode: string | null
          landmark: string | null
          phoneNumber: string
          isDefault: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          name: string
          street: string
          city: string
          county: string
          postalCode?: string | null
          landmark?: string | null
          phoneNumber: string
          isDefault?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          name?: string
          street?: string
          city?: string
          county?: string
          postalCode?: string | null
          landmark?: string | null
          phoneNumber?: string
          isDefault?: boolean
          createdAt?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          userId: string
          type: string
          phoneNumber: string | null
          cardLast4: string | null
          cardBrand: string | null
          isDefault: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          type: string
          phoneNumber?: string | null
          cardLast4?: string | null
          cardBrand?: string | null
          isDefault?: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          type?: string
          phoneNumber?: string | null
          cardLast4?: string | null
          cardBrand?: string | null
          isDefault?: boolean
          createdAt?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image: string | null
          isActive: boolean
          sortOrder: number
          createdAt: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image?: string | null
          isActive?: boolean
          sortOrder?: number
          createdAt?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image?: string | null
          isActive?: boolean
          sortOrder?: number
          createdAt?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          type: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          type?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          type?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
