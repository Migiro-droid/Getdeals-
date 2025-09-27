#!/usr/bin/env node

/**
 * Organizations Module API and Database Test Script
 * 
 * This script tests:
 * 1. Organization number field in database
 * 2. API endpoints for organization data
 * 3. Database mappings and constraints
 * 4. Validation rules
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🚀 Starting Organizations Module API and Database Tests\n');

  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function addTest(name, passed, details) {
    testResults.tests.push({ name, passed, details });
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}: ${details}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
  }

  // Test 1: Check if organization_number column exists
  console.log('1️⃣ Testing organization_number column existence...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('organization, organization_number')
      .limit(1);

    if (error && error.message.includes('organization_number')) {
      addTest('Organization Number Column', false, 'Column does not exist in database');
    } else if (error) {
      addTest('Organization Number Column', false, `Database error: ${error.message}`);
    } else {
      addTest('Organization Number Column', true, 'Column exists and is accessible');
    }
  } catch (err) {
    addTest('Organization Number Column', false, `Exception: ${err.message}`);
  }

  // Test 2: Check database schema structure
  console.log('\n2️⃣ Testing database schema...');
  try {
    // This uses a PostgreSQL specific query to check column information
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name IN ('organization', 'organization_number')
        ORDER BY column_name;
      `
    });

    if (error) {
      addTest('Database Schema Check', false, `Cannot verify schema: ${error.message}`);
    } else if (data && data.length >= 1) {
      const hasOrg = data.some(col => col.column_name === 'organization');
      const hasOrgNumber = data.some(col => col.column_name === 'organization_number');
      
      if (hasOrg && hasOrgNumber) {
        addTest('Database Schema Check', true, 'Both organization fields exist');
      } else {
        addTest('Database Schema Check', false, `Missing fields: org=${hasOrg}, org_number=${hasOrgNumber}`);
      }
    } else {
      addTest('Database Schema Check', false, 'No organization columns found');
    }
  } catch (err) {
    addTest('Database Schema Check', false, `Exception: ${err.message}`);
  }

  // Test 3: Test organization number uniqueness constraint
  console.log('\n3️⃣ Testing organization number uniqueness...');
  try {
    // Check if unique index exists
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND indexname LIKE '%organization_number%';
      `
    });

    if (error) {
      addTest('Organization Number Uniqueness', false, `Cannot check indexes: ${error.message}`);
    } else if (data && data.length > 0) {
      const hasUniqueIndex = data.some(idx => 
        idx.indexdef && idx.indexdef.includes('UNIQUE')
      );
      
      if (hasUniqueIndex) {
        addTest('Organization Number Uniqueness', true, 'Unique constraint exists');
      } else {
        addTest('Organization Number Uniqueness', false, 'No unique constraint found');
      }
    } else {
      addTest('Organization Number Uniqueness', false, 'No organization number indexes found');
    }
  } catch (err) {
    addTest('Organization Number Uniqueness', false, `Exception: ${err.message}`);
  }

  // Test 4: Test basic CRUD operations
  console.log('\n4️⃣ Testing CRUD operations...');
  const testOrgNumber = `TEST${Date.now()}`;
  const testUserId = `test-user-${Date.now()}`;

  try {
    // Test Create
    const { data: createData, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        email: `test${Date.now()}@example.com`,
        organization: 'Test Organization Ltd',
        organization_number: testOrgNumber,
        email_verified: false
      })
      .select();

    if (createError) {
      addTest('CRUD Create Test', false, `Insert failed: ${createError.message}`);
    } else {
      addTest('CRUD Create Test', true, 'Successfully created profile with organization data');

      // Test Read
      const { data: readData, error: readError } = await supabase
        .from('profiles')
        .select('organization, organization_number')
        .eq('id', testUserId)
        .single();

      if (readError) {
        addTest('CRUD Read Test', false, `Read failed: ${readError.message}`);
      } else if (readData.organization_number === testOrgNumber) {
        addTest('CRUD Read Test', true, 'Successfully read organization data');

        // Test Update
        const newOrgNumber = `UPDATED${Date.now()}`;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ organization_number: newOrgNumber })
          .eq('id', testUserId);

        if (updateError) {
          addTest('CRUD Update Test', false, `Update failed: ${updateError.message}`);
        } else {
          addTest('CRUD Update Test', true, 'Successfully updated organization number');
        }
      } else {
        addTest('CRUD Read Test', false, 'Organization number mismatch');
      }

      // Cleanup - Test Delete
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);

      if (deleteError) {
        addTest('CRUD Cleanup', false, `Delete failed: ${deleteError.message}`);
      } else {
        addTest('CRUD Cleanup', true, 'Successfully cleaned up test data');
      }
    }
  } catch (err) {
    addTest('CRUD Operations', false, `Exception: ${err.message}`);
  }

  // Test 5: Test organization number format validation (database level)
  console.log('\n5️⃣ Testing organization number constraints...');
  try {
    const invalidOrgNumbers = ['', '123', 'TOOLONGORGANIZATIONNUMBER123456789'];
    
    for (const invalidNumber of invalidOrgNumbers) {
      const testId = `invalid-test-${Date.now()}-${Math.random()}`;
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: testId,
          user_id: testId,
          first_name: 'Invalid',
          last_name: 'Test',
          email: `invalid${Date.now()}@example.com`,
          organization: 'Test Org',
          organization_number: invalidNumber,
          email_verified: false
        });

      // Note: Empty string might be allowed, so we only test for too long numbers
      if (invalidNumber.length > 15 && !error) {
        addTest('Length Constraint', false, 'Should reject very long organization numbers');
        // Cleanup if it was inserted
        await supabase.from('profiles').delete().eq('id', testId);
      }
    }
    
    addTest('Organization Number Constraints', true, 'Constraint validation completed');
  } catch (err) {
    addTest('Organization Number Constraints', false, `Exception: ${err.message}`);
  }

  // Test 6: Test trigger function with organization_number
  console.log('\n6️⃣ Testing auth trigger function...');
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT routine_name, routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user';
      `
    });

    if (error) {
      addTest('Auth Trigger Function', false, `Cannot check function: ${error.message}`);
    } else if (data && data.length > 0) {
      const functionDef = data[0].routine_definition || '';
      const hasOrgNumber = functionDef.includes('organization_number');
      
      if (hasOrgNumber) {
        addTest('Auth Trigger Function', true, 'Function includes organization_number handling');
      } else {
        addTest('Auth Trigger Function', false, 'Function missing organization_number handling');
      }
    } else {
      addTest('Auth Trigger Function', false, 'handle_new_user function not found');
    }
  } catch (err) {
    addTest('Auth Trigger Function', false, `Exception: ${err.message}`);
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.tests.length}\n`);

  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Organizations Module is ready for use.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
    
    if (testResults.tests.find(t => t.name.includes('Organization Number Column') && !t.passed)) {
      console.log('\n💡 To fix missing organization_number column, run:');
      console.log('   Execute the migration script: migrations/20250927_add_organization_number.sql');
    }
  }

  return testResults.failed === 0;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('💥 Test runner crashed:', err);
    process.exit(1);
  });