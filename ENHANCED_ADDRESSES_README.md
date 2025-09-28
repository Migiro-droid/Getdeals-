# Enhanced Address Management System

This document describes the new enhanced address management functionality for the GetDeals Kenya application.

## Overview

The address management system has been completely redesigned to provide a comprehensive solution for users to manage their delivery addresses with GPS precision and enhanced location tracking.

## Key Features

### 🗺️ **Geolocation Support**
- **GPS Coordinates**: Store precise latitude and longitude for each address
- **Current Location Detection**: Use browser geolocation API to automatically detect user's location
- **Map Integration**: Visual map interface for selecting locations (via LocationPicker component)
- **Address Validation**: Ensure coordinate accuracy and address completeness

### 📍 **Enhanced Address Data**
- **Structured Fields**: Separate fields for street, city, county, postal code
- **Landmarks**: Additional landmark references for easier navigation
- **Contact Information**: Phone numbers associated with specific addresses
- **Address Types**: Categorize addresses as Home, Work, or Other
- **Formatted Display**: Multiple display formats for different contexts

### 🎯 **Smart Address Management**
- **Default Address Logic**: Automatic default address management
- **Address Validation**: Client and server-side validation
- **Duplicate Prevention**: Smart handling of similar addresses
- **Easy Editing**: Inline editing with form validation

## Components

### AddressForm Component
**Location**: `src/components/AddressForm.tsx`

A comprehensive form component for creating and editing addresses:

```typescript
interface AddressFormProps {
  address?: Address;
  onSave: (address: Omit<Address, 'id'>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}
```

**Features**:
- LocationPicker integration for GPS coordinates
- Current location detection
- Address type selection (Home/Work/Other)
- Comprehensive form validation
- Responsive design

### AddressCard Component
**Location**: `src/components/AddressCard.tsx`

A display component for showing address information:

```typescript
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}
```

**Features**:
- Visual address type indicators
- GPS coordinates display with copy functionality
- Direct map integration (opens in Google Maps)
- Default address management
- Quick action buttons

### AddressService
**Location**: `src/services/address.ts`

A service layer for managing address data with Supabase:

```typescript
export class AddressService {
  static async getUserAddresses(): Promise<{data: UserAddress[] | null; error: string | null}>
  static async createAddress(data: CreateAddressData): Promise<{data: UserAddress | null; error: string | null}>
  static async updateAddress(id: string, data: UpdateAddressData): Promise<{data: UserAddress | null; error: string | null}>
  static async deleteAddress(id: string): Promise<{error: string | null}>
  static async setDefaultAddress(id: string): Promise<{data: UserAddress | null; error: string | null}>
  static async getNearbyAddresses(lat: number, lng: number, radius?: number): Promise<{data: UserAddress[] | null; error: string | null}>
  static validateAddressData(data: CreateAddressData): {isValid: boolean; errors: string[]}
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number
}
```

## Database Schema

### Enhanced Addresses Table
**Migration**: `migrations/20250928_enhanced_addresses_table.sql`

```sql
CREATE TABLE public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    county TEXT,
    postal_code TEXT,
    landmark TEXT,
    phone_number TEXT,
    latitude DECIMAL(10, 8),  -- High precision GPS coordinates
    longitude DECIMAL(11, 8), -- High precision GPS coordinates
    formatted_address TEXT,
    is_default BOOLEAN DEFAULT false,
    address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Key Features**:
- High-precision GPS coordinates (up to ~1cm accuracy)
- Automatic default address management via triggers
- Row Level Security (RLS) for user privacy
- Performance-optimized indexes
- Comprehensive audit trail

## Type Definitions

### UserAddress Interface
**Location**: `src/types/user-profile.ts`

```typescript
export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  city: string;
  county?: string;
  postal_code?: string;
  landmark?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
  created_at: string;
  updated_at: string;
}
```

## Integration Points

### AccountPage Integration
The addresses tab in the account page (`src/pages/AccountPage.tsx`) now includes:

- **Grid Layout**: Responsive card-based display of addresses
- **Empty State**: Helpful empty state when no addresses exist
- **Modal Integration**: Full-screen address form in modal
- **Real-time Updates**: Immediate UI updates after address operations

### LocationPicker Integration
The existing LocationPicker component is integrated for:

- **Address Search**: Type-ahead address search
- **Map Selection**: Click-to-select on map
- **Current Location**: Automatic GPS detection
- **Reverse Geocoding**: Convert coordinates to addresses

## Usage Examples

### Creating a New Address
```typescript
const newAddress = {
  label: "Home",
  street_address: "123 Moi Avenue",
  city: "Nairobi",
  county: "Nairobi County",
  latitude: -1.2921,
  longitude: 36.8219,
  is_default: true,
  address_type: 'home' as const
};

const { data, error } = await AddressService.createAddress(newAddress);
```

### Getting User's Addresses
```typescript
const { data: addresses, error } = await AddressService.getUserAddresses();
if (!error && addresses) {
  console.log(`Found ${addresses.length} addresses`);
}
```

### Finding Nearby Addresses
```typescript
const { data: nearby, error } = await AddressService.getNearbyAddresses(
  -1.2921, // latitude
  36.8219, // longitude
  10       // radius in km
);
```

## Security Features

### Row Level Security (RLS)
- Users can only access their own addresses
- Automatic user_id filtering on all operations
- Secure default address management

### Data Validation
- Client-side form validation
- Server-side data validation
- GPS coordinate range validation
- Required field enforcement

## Performance Optimizations

### Database Indexes
- User ID index for fast user-specific queries
- Location index for geospatial queries
- Default address index for quick default lookups

### Query Optimization
- Single queries for address operations
- Batch operations for default management
- Efficient coordinate-based searches

## Future Enhancements

### Planned Features
1. **Address Suggestions**: AI-powered address completion
2. **Delivery Zones**: Integration with delivery area management
3. **Address History**: Track address usage patterns
4. **Bulk Import**: Import addresses from external sources
5. **Address Sharing**: Share addresses with family members

### Integration Opportunities
1. **Checkout Flow**: Direct address selection during checkout
2. **Order Tracking**: Enhanced delivery tracking with GPS
3. **Delivery Optimization**: Route optimization for delivery partners
4. **Analytics**: Address-based delivery analytics

## Migration Guide

### Running the Migration
```bash
# Apply the database migration
psql -f migrations/20250928_enhanced_addresses_table.sql

# Verify migration
# Check that the addresses table exists with all fields
# Verify RLS policies are active
# Confirm indexes are created
```

### Data Migration
The migration script automatically:
- Backs up existing address data
- Migrates compatible fields to new structure
- Preserves user relationships
- Maintains default address settings

### Code Updates Required
1. Update any direct address table queries to use AddressService
2. Replace legacy Address type with UserAddress type
3. Update address display components to use AddressCard
4. Replace address forms with AddressForm component

## Troubleshooting

### Common Issues
1. **GPS Not Working**: Check browser permissions and HTTPS requirement
2. **Address Not Saving**: Verify required fields are filled
3. **Map Not Loading**: Check internet connection and LocationPicker setup
4. **Permission Errors**: Ensure RLS policies are properly configured

### Debug Tools
- Browser console for GPS errors
- Network tab for API call issues
- Database logs for RLS policy problems
- Address validation feedback in UI

---

## Summary

The enhanced address management system provides a comprehensive, GPS-enabled solution for managing user delivery addresses. With features like current location detection, map integration, and smart address management, users can now easily maintain accurate delivery information while the system ensures data security and performance.

The modular architecture allows for easy extension and integration with other parts of the application, making it a solid foundation for future delivery and logistics features.