/**
 * Database Configuration for Supabase Migration
 * 
 * This file centralizes database configuration to easily switch between:
 * - Supabase (Primary)
 * - Neon/Prisma (Legacy)
 * - File-based (Fallback)
 */

export const DATABASE_CONFIG = {
  // Primary database system
  PRIMARY: 'supabase' as const, // Changed from 'prisma' to 'supabase'
  
  // Available database systems
  SYSTEMS: {
    SUPABASE: 'supabase',
    PRISMA: 'prisma', 
    FALLBACK: 'fallback'
  } as const,
  
  // Feature flags
  FEATURES: {
    USE_SUPABASE_AUTH: true,
    USE_SUPABASE_STORAGE: true,
    USE_SUPABASE_REALTIME: true,
    ENABLE_OFFLINE_MODE: true,
    MIGRATE_DATA: false // Set to true when ready to migrate existing data
  }
};

export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL || 'https://wrlouoongmdtritwojaw.supabase.co',
  ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybG91b29uZ21kdHJpdHdvamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDU2MTMsImV4cCI6MjA3MDkyMTYxM30._zo2qW9SFpYSV9jz-wedjOuB2Gp4BFxqsBKwaUQSnlE'
};

// Migration utilities
export const MIGRATION_STATUS = {
  SCHEMA_CREATED: false,
  DATA_MIGRATED: false,
  AUTH_MIGRATED: false,
  STORAGE_MIGRATED: false
};
