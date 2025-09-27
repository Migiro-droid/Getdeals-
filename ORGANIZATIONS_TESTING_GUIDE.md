# Organizations Module - Testing Guide

## Overview
This guide covers comprehensive testing for the Organizations Module implementation, including database schema, API endpoints, form validation, and user registration flows.

## Prerequisites
Before running tests, ensure:
- ✅ Database migration has been applied (`migrations/20250927_add_organization_number.sql`)
- ✅ Environment variables are configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- ✅ Application is running in development mode

## 1. Automated Testing

### Database and API Tests
Run the comprehensive test script:
```bash
node test-organizations-module.mjs
```

**Expected Results:**
- ✅ Organization number column exists in database
- ✅ Database schema has both `organization` and `organization_number` fields
- ✅ Unique constraint exists for organization numbers
- ✅ CRUD operations work correctly
- ✅ Auth trigger function handles organization data

### What the Script Tests:
1. **Schema Validation**: Checks if organization_number column exists
2. **Database Structure**: Verifies column types and constraints
3. **Uniqueness Constraint**: Tests organization number uniqueness
4. **CRUD Operations**: Create, Read, Update, Delete operations
5. **Validation**: Database-level validation rules
6. **Trigger Function**: Auth trigger includes organization fields

## 2. Manual Testing

### 2.1 Registration Form Testing

#### Standard Registration (AuthModals)
1. **Open registration modal**
   - Navigate to any page
   - Click "Sign Up" or authentication button
   - Select "Sign Up" tab

2. **Test organization fields**
   - Fill in basic information (name, email, phone, password)
   - **Organization Name**: Enter "Test Company Ltd"
   - **Organization Number**: Enter "REG123456789"
   - Submit form

3. **Expected Results**:
   - ✅ Form accepts valid organization data
   - ✅ Account is created successfully
   - ✅ Organization data is saved to database

#### Ecosystem Registration Form
1. **Access ecosystem registration**
   - Navigate to ecosystem registration page
   - Or use the `EcosystemRegistrationForm` component

2. **Test required fields**
   - Try submitting with empty organization fields
   - **Expected**: Form shows validation errors

3. **Test validation rules**
   - **Invalid org number**: Enter "123" (too short)
   - **Expected**: "Organization number must be between 6 and 15 characters"
   - **Invalid format**: Enter "ABC" 
   - **Expected**: Format validation error
   - **Valid formats**: Test "REG123456789", "KRA987654321", "VAT555666777"

### 2.2 Account Profile Testing

#### View Organization Data
1. **Navigate to Account page** (`/account`)
2. **Check Profile tab**
   - **Expected**: Organization and Organization Number fields are visible
   - **Expected**: Current values are displayed (if any)

#### Edit Organization Data
1. **Click "Edit" button**
2. **Modify organization fields**
   - Change organization name
   - Update organization number
3. **Save changes**
   - **Expected**: Changes are saved successfully
   - **Expected**: Updated data persists after page refresh

### 2.3 Validation Testing

#### Organization Number Validation
Test these scenarios in registration forms:

**Valid Organization Numbers:**
- ✅ `REG123456789`
- ✅ `KRA987654321`
- ✅ `VAT555666777`
- ✅ `ABC123456789`
- ✅ `123456789` (numeric only)

**Invalid Organization Numbers:**
- ❌ `123` (too short)
- ❌ `VERYLONGORGANIZATIONNUMBER123456789` (too long)
- ❌ `REG@123` (invalid characters)
- ❌ Empty string when organization name is provided

**Organization Name Validation:**
- ✅ `Test Company Ltd`
- ✅ `ABC Corp & Associates`
- ✅ `Company-Name 123`
- ❌ `A` (too short)
- ❌ `Company@#$%` (invalid characters)
- ❌ Empty when organization number is provided

### 2.4 Database Integration Testing

#### Test Unique Constraint
1. **Create first account** with organization number "TEST123456"
2. **Try creating second account** with same organization number
3. **Expected**: Second registration should fail with uniqueness error

#### Test Data Persistence
1. **Register new user** with organization data
2. **Check database directly** (Supabase dashboard)
3. **Verify**: Organization and organization_number fields are populated
4. **Login and check profile**: Data should be available in frontend

### 2.5 API Integration Testing

#### Auth Context Testing
1. **Register with organization data**
2. **Check console logs** for signup process
3. **Verify**: `organization_number` is included in auth metadata
4. **Check user state**: After login, user object should include `organizationNumber`

#### Profile Sync Testing
1. **Login with existing user** that has organization data
2. **Check AuthContext syncUserProfile function**
3. **Verify**: Organization data is properly synced from database
4. **Check**: User state includes both `organization` and `organizationNumber`

## 3. Edge Cases and Error Handling

### 3.1 Database Errors
- **Test**: Attempt registration when database is unavailable
- **Expected**: Graceful error handling, user sees meaningful error message

### 3.2 Validation Errors
- **Test**: Submit forms with various invalid data combinations
- **Expected**: Specific, helpful error messages for each validation rule

### 3.3 Network Errors
- **Test**: Registration with poor network connection
- **Expected**: Loading states, retry mechanisms, timeout handling

## 4. Browser Testing

### 4.1 Cross-Browser Compatibility
Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### 4.2 Mobile Responsiveness
Test forms on:
- ✅ Mobile phones (various sizes)
- ✅ Tablets
- ✅ Desktop (various resolutions)

## 5. Performance Testing

### 5.1 Form Performance
- **Organization number validation**: Should respond instantly
- **Form submission**: Should complete within 3-5 seconds
- **Database queries**: Should be optimized with proper indexes

### 5.2 Database Performance
- **Organization number lookups**: Should use unique index
- **Profile queries**: Should include organization fields efficiently

## 6. Security Testing

### 6.1 Input Sanitization
- **Test**: SQL injection attempts in organization fields
- **Expected**: Proper sanitization, no database corruption

### 6.2 Data Validation
- **Test**: Bypass frontend validation with direct API calls
- **Expected**: Backend validation catches invalid data

## 7. Troubleshooting Common Issues

### Issue: "organization_number column not found"
**Solution**: Run the migration script:
```sql
-- Execute in Supabase SQL Editor
-- Content from: migrations/20250927_add_organization_number.sql
```

### Issue: Validation not working
**Solution**: Check import of validation utilities:
```typescript
import { validateOrganizationFields } from '@/utils/organizationValidation';
```

### Issue: Data not persisting
**Solution**: Verify trigger function includes organization_number:
1. Check Supabase database
2. Look for `handle_new_user` function
3. Ensure it includes organization_number in INSERT statement

### Issue: Unique constraint violations
**Solution**: 
1. Check if organization number already exists
2. Use different organization number
3. Verify unique index is properly configured

## 8. Success Criteria

### ✅ All Tests Pass When:
1. **Database**: Migration applied successfully, schema validated
2. **Registration**: Both forms accept and save organization data
3. **Validation**: All validation rules work correctly
4. **Profile**: Organization data displays and updates properly
5. **API**: All CRUD operations work with organization fields
6. **Security**: Input validation prevents malicious data
7. **Performance**: Forms and database queries perform well
8. **Compatibility**: Works across browsers and devices

### 📊 Test Coverage:
- **Unit Tests**: Validation functions
- **Integration Tests**: Database operations
- **UI Tests**: Form interactions
- **E2E Tests**: Complete user flows
- **Performance Tests**: Load and response times
- **Security Tests**: Input validation and sanitization

## 9. Reporting Issues

When reporting issues, include:
1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Browser and version**
4. **Console errors (if any)**
5. **Database state (relevant records)**
6. **Network requests (if API related)**

## 10. Next Steps

After successful testing:
1. **Deploy to staging environment**
2. **Run full test suite in staging**
3. **User acceptance testing**
4. **Performance monitoring setup**
5. **Production deployment**
6. **Post-deployment verification**

---

**Note**: This testing guide should be updated as new features are added or requirements change. Always test thoroughly before deploying to production.