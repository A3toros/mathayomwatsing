const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// ⚠️ CRITICAL REMINDER: We reference subjects from test_assignments table, NOT from test tables!
// The relationship is: test_assignments.subject_id → subjects.subject_id
// NOT: multiple_choice_tests.subject_id → subjects.subject_id

// ⚠️ CRITICAL REMINDER: We get teacher_id from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.teacher_id
// - input_test_results.input_test → input_tests.id → input_tests.teacher_id  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.teacher_id

// ⚠️ CRITICAL REMINDER: We get test_name from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.test_name
// - input_test_results.input_test → input_tests.id → input_tests.test_name  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.test_name

// ⚠️ CRITICAL REMINDER: The expandable columns in test_results tables are:
// - multiple_choice_test_results.multiple_choice_test (expandable)
// - input_test_results.input_test (expandable)  
// - true_false_test_results.true_false_test (expandable)

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔍 Starting to fetch tests...');
    
    // Let's also check what tables exist and their basic structure
    try {
      const tableInfo = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%test%'
        ORDER BY table_name
      `;
      console.log('🔍 Available test-related tables:', tableInfo.map(t => t.table_name));
      
      // Let's also check if there are any tests at all in any table
      const allTestsCheck = await sql`
        SELECT 
          'multiple_choice_tests' as table_name,
          COUNT(*) as count
        FROM multiple_choice_tests
        UNION ALL
        SELECT 
          'true_false_tests' as table_name,
          COUNT(*) as count
        FROM true_false_tests
        UNION ALL
        SELECT 
          'input_tests' as table_name,
          COUNT(*) as count
        FROM input_tests
      `;
      console.log('🔍 All test tables count:', allTestsCheck);
      
      // Let's also check test_assignments
      const assignmentsCheck = await sql`
        SELECT COUNT(*) as count FROM test_assignments
      `;
      console.log('🔍 Test assignments count:', assignmentsCheck[0]?.count);
      
      // Let's check if there are any test results
      const resultsCheck = await sql`
        SELECT 
          'multiple_choice_test_results' as table_name,
          COUNT(*) as count
        FROM multiple_choice_test_results
        UNION ALL
        SELECT 
          'true_false_test_results' as table_name,
          COUNT(*) as count
        FROM true_false_test_results
        UNION ALL
        SELECT 
          'input_test_results' as table_name,
          COUNT(*) as count
        FROM input_test_results
      `;
      console.log('🔍 All test results count:', resultsCheck);
      
    } catch (error) {
      console.log('⚠️ Could not get table info:', error.message);
    }
    
    // Get all tests from different test tables
    let multipleChoiceTests = [];
    let trueFalseTests = [];
    let inputTests = [];
    
    // First, let's get a simple count of all tests without joins to see what exists
    try {
      const simpleCounts = await sql`
        SELECT 
          'multiple_choice_tests' as table_name,
          COUNT(*) as count
        FROM multiple_choice_tests
        UNION ALL
        SELECT 
          'true_false_tests' as table_name,
          COUNT(*) as count
        FROM true_false_tests
        UNION ALL
        SELECT 
          'input_tests' as table_name,
          COUNT(*) as count
        FROM input_tests
      `;
      console.log('🔍 Simple test counts (no joins):', simpleCounts);
      
      // Let's also check if there are any tests at all by looking at the actual data
      if (simpleCounts.some(row => row.count > 0)) {
        console.log('🔍 Found tests in some tables, checking sample data...');
        
        // Check multiple choice tests
        if (simpleCounts.find(row => row.table_name === 'multiple_choice_tests')?.count > 0) {
          const sample = await sql`SELECT id, test_name, num_questions, created_at FROM multiple_choice_tests LIMIT 2`;
          console.log('🔍 Sample multiple choice tests:', sample);
        }
        
        // Check true/false tests
        if (simpleCounts.find(row => row.table_name === 'true_false_tests')?.count > 0) {
          const sample = await sql`SELECT id, test_name, num_questions, created_at FROM true_false_tests LIMIT 2`;
          console.log('🔍 Sample true/false tests:', sample);
        }
        
        // Check input tests
        if (simpleCounts.find(row => row.table_name === 'input_tests')?.count > 0) {
          const sample = await sql`SELECT id, test_name, num_questions, created_at FROM input_tests LIMIT 2`;
          console.log('🔍 Sample input tests:', sample);
        }
      }
    } catch (error) {
      console.log('⚠️ Simple count query failed:', error.message);
    }
    
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM multiple_choice_tests`;
      console.log('🔍 Multiple choice tests table count:', tableCheck[0]?.count);
      
      // Try the complex query first (with assignments and subjects)
      try {
        multipleChoiceTests = await sql`
          SELECT 
            'multiple_choice' as test_type,
            mct.id as test_id,
            mct.test_name,
            mct.num_questions,
            mct.created_at,
            COALESCE(s.subject, 'Not Assigned') as subject_name,
            COALESCE(ta.grade::text, 'Not Assigned') as grade,
            COALESCE(ta.class::text, 'Not Assigned') as class
          FROM multiple_choice_tests mct
          LEFT JOIN test_assignments ta ON ta.test_id = mct.id AND ta.test_type = 'multiple_choice'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          ORDER BY mct.created_at DESC
        `;
        console.log('🔍 Complex query successful, found:', multipleChoiceTests.length);
      } catch (error) {
        console.log('⚠️ Complex query failed, trying simple query...');
        // Fallback to simple query without joins
        multipleChoiceTests = await sql`
          SELECT 
            'multiple_choice' as test_type,
            id as test_id,
            test_name,
            num_questions,
            created_at,
            'Not Assigned' as subject_name,
            'Not Assigned' as grade,
            'Not Assigned' as class
          FROM multiple_choice_tests
          ORDER BY created_at DESC
        `;
        console.log('🔍 Simple query successful, found:', multipleChoiceTests.length);
      }
      console.log('🔍 Multiple choice tests found:', multipleChoiceTests.length);
      if (multipleChoiceTests.length > 0) {
        console.log('🔍 Sample test:', multipleChoiceTests[0]);
      }
    } catch (error) {
      console.log('⚠️ Multiple choice tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      multipleChoiceTests = [];
    }
    
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM true_false_tests`;
      console.log('🔍 True/false tests table count:', tableCheck[0]?.count);
      
      // Try the complex query first (with assignments and subjects)
      try {
        trueFalseTests = await sql`
          SELECT 
            'true_false' as test_type,
            tft.id as test_id,
            tft.test_name,
            tft.num_questions,
            tft.created_at,
            COALESCE(s.subject, 'Not Assigned') as subject_name,
            COALESCE(ta.grade::text, 'Not Assigned') as grade,
            COALESCE(ta.class::text, 'Not Assigned') as class
          FROM true_false_tests tft
          LEFT JOIN test_assignments ta ON ta.test_id = tft.id AND ta.test_type = 'true_false'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          ORDER BY tft.created_at DESC
        `;
        console.log('🔍 Complex query successful, found:', trueFalseTests.length);
      } catch (error) {
        console.log('⚠️ Complex query failed, trying simple query...');
        // Fallback to simple query without joins
        trueFalseTests = await sql`
          SELECT 
            'true_false' as test_type,
            id as test_id,
            test_name,
            num_questions,
            created_at,
            'Not Assigned' as subject_name,
            'Not Assigned' as grade,
            'Not Assigned' as class
          FROM true_false_tests
          ORDER BY created_at DESC
        `;
        console.log('🔍 Simple query successful, found:', trueFalseTests.length);
      }
      console.log('🔍 True/false tests found:', trueFalseTests.length);
      if (trueFalseTests.length > 0) {
        console.log('🔍 Sample test:', trueFalseTests[0]);
      }
    } catch (error) {
      console.log('⚠️ True/false tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      trueFalseTests = [];
    }
    
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM input_tests`;
      console.log('🔍 Input tests table count:', tableCheck[0]?.count);
      
      // Try the complex query first (with assignments and subjects)
      try {
        inputTests = await sql`
          SELECT 
            'input' as test_type,
            it.id as test_id,
            it.test_name,
            it.num_questions,
            it.created_at,
            COALESCE(s.subject, 'Not Assigned') as subject_name,
            COALESCE(ta.grade::text, 'Not Assigned') as grade,
            COALESCE(ta.class::text, 'Not Assigned') as class
          FROM input_tests it
          LEFT JOIN test_assignments ta ON ta.test_id = it.id AND ta.test_type = 'input'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          ORDER BY it.created_at DESC
        `;
        console.log('🔍 Complex query successful, found:', inputTests.length);
      } catch (error) {
        console.log('⚠️ Complex query failed, trying simple query...');
        // Fallback to simple query without joins
        inputTests = await sql`
          SELECT 
            'input' as test_type,
            id as test_id,
            test_name,
            num_questions,
            created_at,
            'Not Assigned' as subject_name,
            'Not Assigned' as grade,
            'Not Assigned' as class
          FROM input_tests
        `;
        console.log('🔍 Simple query successful, found:', inputTests.length);
      }
      console.log('🔍 Input tests found:', inputTests.length);
      if (inputTests.length > 0) {
        console.log('🔍 Sample test:', inputTests[0]);
      }
    } catch (error) {
      console.log('⚠️ Input tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      inputTests = [];
    }

    // Combine all tests
    const allTests = [
      ...multipleChoiceTests,
      ...trueFalseTests,
      ...inputTests
    ];

    // Sort by creation date (newest first)
    allTests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        tests: allTests,
        total: allTests.length,
        breakdown: {
          multiple_choice: multipleChoiceTests.length,
          true_false: trueFalseTests.length,
          input: inputTests.length
        }
      })
    };
  } catch (error) {
    console.error('❌ Get all tests error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve tests',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
