const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();



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
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin
    if (userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin role required.' })
      };
    }

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
        UNION ALL
        SELECT 
          'matching_type_tests' as table_name,
          COUNT(*) as count
        FROM matching_type_tests
        UNION ALL
        SELECT 
          'word_matching_tests' as table_name,
          COUNT(*) as count
        FROM word_matching_tests
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
        UNION ALL
        SELECT 
          'matching_type_test_results' as table_name,
          COUNT(*) as count
        FROM matching_type_test_results
        UNION ALL
        SELECT 
          'word_matching_test_results' as table_name,
          COUNT(*) as count
        FROM word_matching_test_results
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
        UNION ALL
        SELECT 
          'matching_type_tests' as table_name,
          COUNT(*) as count
        FROM matching_type_tests
        UNION ALL
        SELECT 
          'word_matching_tests' as table_name,
          COUNT(*) as count
        FROM word_matching_tests
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
        
        // Check matching type tests
        if (simpleCounts.find(row => row.table_name === 'matching_type_tests')?.count > 0) {
          const sample = await sql`SELECT id, test_name, num_blocks, created_at FROM matching_type_tests LIMIT 2`;
          console.log('🔍 Sample matching type tests:', sample);
        }
        
        // Check word matching tests
        if (simpleCounts.find(row => row.table_name === 'word_matching_tests')?.count > 0) {
          const sample = await sql`SELECT id, test_name, num_questions, interaction_type, created_at FROM word_matching_tests LIMIT 2`;
          console.log('🔍 Sample word matching tests:', sample);
        }
      }
    } catch (error) {
      console.log('⚠️ Simple count query failed:', error.message);
    }
    
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM multiple_choice_tests`;
      console.log('🔍 Multiple choice tests table count:', tableCheck[0]?.count);
      
      // Group tests by test_id and aggregate classes
      try {
        multipleChoiceTests = await sql`
          SELECT 
            'multiple_choice' as test_type,
            mct.id as test_id,
            mct.test_name,
            mct.num_questions,
            mct.created_at,
            mct.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM multiple_choice_tests mct
          LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = mct.id AND ta.test_type = 'multiple_choice'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY mct.id, mct.test_name, mct.num_questions, mct.created_at, mct.teacher_id, t.username
          ORDER BY mct.created_at DESC
        `;
        console.log('🔍 Grouped query successful, found:', multipleChoiceTests.length);
      } catch (error) {
        console.log('⚠️ Grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        multipleChoiceTests = await sql`
          SELECT 
            'multiple_choice' as test_type,
            mct.id as test_id,
            mct.test_name,
            mct.num_questions,
            mct.created_at,
            mct.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM multiple_choice_tests mct
          LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
          ORDER BY mct.created_at DESC
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
      
      // Group tests by test_id and aggregate classes
      try {
        trueFalseTests = await sql`
          SELECT 
            'true_false' as test_type,
            tft.id as test_id,
            tft.test_name,
            tft.num_questions,
            tft.created_at,
            tft.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM true_false_tests tft
          LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = tft.id AND ta.test_type = 'true_false'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY tft.id, tft.test_name, tft.num_questions, tft.created_at, tft.teacher_id, t.username
          ORDER BY tft.created_at DESC
        `;
        console.log('🔍 Grouped query successful, found:', trueFalseTests.length);
      } catch (error) {
        console.log('⚠️ Grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        trueFalseTests = await sql`
          SELECT 
            'true_false' as test_type,
            tft.id as test_id,
            tft.test_name,
            tft.num_questions,
            tft.created_at,
            tft.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM true_false_tests tft
          LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
          ORDER BY tft.created_at DESC
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
      
      // Group tests by test_id and aggregate classes
      try {
        inputTests = await sql`
          SELECT 
            'input' as test_type,
            it.id as test_id,
            it.test_name,
            it.num_questions,
            it.created_at,
            it.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM input_tests it
          LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = it.id AND ta.test_type = 'input'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY it.id, it.test_name, it.num_questions, it.created_at, it.teacher_id, t.username
          ORDER BY it.created_at DESC
        `;
        console.log('🔍 Grouped query successful, found:', inputTests.length);
      } catch (error) {
        console.log('⚠️ Grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        inputTests = await sql`
          SELECT 
            'input' as test_type,
            it.id as test_id,
            it.test_name,
            it.num_questions,
            it.created_at,
            it.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM input_tests it
          LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
          ORDER BY it.created_at DESC
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

    // Add matching type tests
    let matchingTypeTests = [];
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM matching_type_tests`;
      console.log('🔍 Matching type tests table count:', tableCheck[0]?.count);
      
      // Group tests by test_id and aggregate classes
      try {
        matchingTypeTests = await sql`
          SELECT 
            'matching_type' as test_type,
            mtt.id as test_id,
            mtt.test_name,
            mtt.num_blocks as num_questions,
            mtt.created_at,
            mtt.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM matching_type_tests mtt
          LEFT JOIN teachers t ON mtt.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = mtt.id AND ta.test_type = 'matching_type'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY mtt.id, mtt.test_name, mtt.num_blocks, mtt.created_at, mtt.teacher_id, t.username
          ORDER BY mtt.created_at DESC
        `;
        console.log('🔍 Grouped query successful, found:', matchingTypeTests.length);
      } catch (error) {
        console.log('⚠️ Grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        matchingTypeTests = await sql`
          SELECT 
            'matching_type' as test_type,
            mtt.id as test_id,
            mtt.test_name,
            mtt.num_blocks as num_questions,
            mtt.created_at,
            mtt.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM matching_type_tests mtt
          LEFT JOIN teachers t ON mtt.teacher_id = t.teacher_id
          ORDER BY mtt.created_at DESC
        `;
        console.log('🔍 Simple query successful, found:', matchingTypeTests.length);
      }
      console.log('🔍 Matching type tests found:', matchingTypeTests.length);
      if (matchingTypeTests.length > 0) {
        console.log('🔍 Sample test:', matchingTypeTests[0]);
      }
    } catch (error) {
      console.log('⚠️ Matching type tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      matchingTypeTests = [];
    }

    // Add word matching tests
    let wordMatchingTests = [];
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM word_matching_tests`;
      console.log('🔍 Word matching tests table count:', tableCheck[0]?.count);
      
      // Group tests by test_id and aggregate classes
      try {
        wordMatchingTests = await sql`
          SELECT 
            'word_matching' as test_type,
            wmt.id as test_id,
            wmt.test_name,
            wmt.num_questions,
            wmt.interaction_type,
            wmt.created_at,
            wmt.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM word_matching_tests wmt
          LEFT JOIN teachers t ON wmt.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = wmt.id AND ta.test_type = 'word_matching'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY wmt.id, wmt.test_name, wmt.num_questions, wmt.interaction_type, wmt.created_at, wmt.teacher_id, t.username
          ORDER BY wmt.created_at DESC
        `;
        console.log('🔍 Word matching grouped query successful, found:', wordMatchingTests.length);
      } catch (error) {
        console.log('⚠️ Word matching grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        wordMatchingTests = await sql`
          SELECT 
            'word_matching' as test_type,
            wmt.id as test_id,
            wmt.test_name,
            wmt.num_questions,
            wmt.interaction_type,
            wmt.created_at,
            wmt.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM word_matching_tests wmt
          LEFT JOIN teachers t ON wmt.teacher_id = t.teacher_id
          ORDER BY wmt.created_at DESC
        `;
        console.log('🔍 Word matching simple query successful, found:', wordMatchingTests.length);
      }
      console.log('🔍 Word matching tests found:', wordMatchingTests.length);
      if (wordMatchingTests.length > 0) {
        console.log('🔍 Sample word matching test:', wordMatchingTests[0]);
      }
    } catch (error) {
      console.log('⚠️ Word matching tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      wordMatchingTests = [];
    }

    // Get drawing tests
    let drawingTests = [];
    try {
      const tableCheck = await sql`SELECT COUNT(*) as count FROM drawing_tests`;
      console.log('🔍 Drawing tests table count:', tableCheck[0]?.count);
      
      // Group tests by test_id and aggregate classes
      try {
        drawingTests = await sql`
          SELECT 
            'drawing' as test_type,
            dt.id as test_id,
            dt.test_name,
            dt.num_questions,
            dt.created_at,
            dt.teacher_id,
            t.username as teacher_name,
            STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', ') as classes,
            STRING_AGG(DISTINCT s.subject, ', ') as subjects
          FROM drawing_tests dt
          LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id
          LEFT JOIN test_assignments ta ON ta.test_id = dt.id AND ta.test_type = 'drawing'
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          GROUP BY dt.id, dt.test_name, dt.num_questions, dt.created_at, dt.teacher_id, t.username
          ORDER BY dt.created_at DESC
        `;
        console.log('🔍 Drawing grouped query successful, found:', drawingTests.length);
      } catch (error) {
        console.log('⚠️ Drawing grouped query failed, trying simple query...');
        // Fallback to simple query without joins
        drawingTests = await sql`
          SELECT 
            'drawing' as test_type,
            dt.id as test_id,
            dt.test_name,
            dt.num_questions,
            dt.created_at,
            dt.teacher_id,
            t.username as teacher_name,
            'Not Assigned' as classes,
            'Not Assigned' as subjects
          FROM drawing_tests dt
          LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id
          ORDER BY dt.created_at DESC
        `;
        console.log('🔍 Drawing simple query successful, found:', drawingTests.length);
      }
      console.log('🔍 Drawing tests found:', drawingTests.length);
      if (drawingTests.length > 0) {
        console.log('🔍 Sample drawing test:', drawingTests[0]);
      }
    } catch (error) {
      console.log('⚠️ Drawing tests query failed:', error.message);
      console.log('⚠️ Error details:', error);
      drawingTests = [];
    }

    // Combine all tests
    const allTests = [
      ...multipleChoiceTests,
      ...trueFalseTests,
      ...inputTests,
      ...matchingTypeTests,
      ...wordMatchingTests,
      ...drawingTests
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
          input: inputTests.length,
          matching_type: matchingTypeTests.length,
          word_matching: wordMatchingTests.length,
          drawing: drawingTests.length
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
