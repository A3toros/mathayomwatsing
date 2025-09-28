const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

// ⚠️ CRITICAL REMINDER: We reference subjects from test_assignments table, NOT from test tables!
// The relationship is: test_assignments.subject_id → subjects.subject_id
// NOT: multiple_choice_tests.subject_id → subjects.subject_id
// ⚠️ CRITICAL REMINDER: The subjects table has a 'subject' column, NOT 'subject_name'!

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
    
    console.log('🔍 Starting to fetch test assignments...');
    
    // Let's also check what's in the test_assignments table
    try {
      const tableCheck = await sql`SELECT COUNT(*) as count FROM test_assignments`;
      console.log('🔍 Test assignments table count:', tableCheck[0]?.count);
      
      if (tableCheck[0]?.count > 0) {
        // Let's see a sample of what's in the table
        const sampleData = await sql`
          SELECT * FROM test_assignments LIMIT 3
        `;
        console.log('🔍 Sample test assignments data:', sampleData);
        
        // Let's also check the structure of the table
        const tableStructure = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'test_assignments'
          ORDER BY ordinal_position
        `;
        console.log('🔍 Test assignments table structure:', tableStructure);
        
        // Let's also try a very simple query to see if we can get basic data
        const simpleData = await sql`
          SELECT id, test_type, test_id, grade, class FROM test_assignments LIMIT 3
        `;
        console.log('🔍 Simple query result:', simpleData);
      } else {
        console.log('🔍 Test assignments table is empty');
      }
    } catch (error) {
      console.log('⚠️ Could not check test_assignments table:', error.message);
      console.log('⚠️ Error details:', error);
    }
    
    // Get all test assignments with related information
    let assignments = [];
    
    try {
      // First, let's check if the table has any data at all
      const tableCheck = await sql`SELECT COUNT(*) as count FROM test_assignments`;
      console.log('🔍 Test assignments table count:', tableCheck[0]?.count);
      
      if (tableCheck[0]?.count > 0) {
        // Let's see what's actually in the test_assignments table
        const rawAssignments = await sql`
          SELECT * FROM test_assignments LIMIT 5
        `;
        console.log('🔍 Raw test assignments data:', rawAssignments);
        
        // Let's also check what test names exist in each test table
        const mcTestNames = await sql`SELECT id, test_name FROM multiple_choice_tests LIMIT 5`;
        const tfTestNames = await sql`SELECT id, test_name FROM true_false_tests LIMIT 5`;
        const inputTestNames = await sql`SELECT id, test_name FROM input_tests LIMIT 5`;
        
        console.log('🔍 Sample multiple choice test names:', mcTestNames);
        console.log('🔍 Sample true/false test names:', tfTestNames);
        console.log('🔍 Sample input test names:', inputTestNames);
        
        // Let's check what columns the subjects table actually has
        const subjectsTableStructure = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'subjects'
          ORDER BY ordinal_position
        `;
        console.log('🔍 Subjects table structure:', subjectsTableStructure);
        
        // Let's also check what's actually in the subjects table
        const subjectsData = await sql`SELECT * FROM subjects LIMIT 5`;
        console.log('🔍 Subjects table data:', subjectsData);
        
        // Let's check the data types and see if there's a mismatch
        const assignmentDataTypeCheck = await sql`
          SELECT 
            ta.id as assignment_id,
            ta.test_type,
            ta.test_id,
            pg_typeof(ta.test_id) as test_id_type,
            ta.subject_id,
            pg_typeof(ta.subject_id) as subject_id_type
          FROM test_assignments ta
          LIMIT 3
        `;
        console.log('🔍 Data type check for assignments:', assignmentDataTypeCheck);
        
        // Let's check if the referenced tests actually exist
        const testReferences = await sql`
          SELECT 
            ta.test_type,
            ta.test_id,
            CASE 
              WHEN ta.test_type = 'multiple_choice' THEN (SELECT COUNT(*) FROM multiple_choice_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'true_false' THEN (SELECT COUNT(*) FROM true_false_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'input' THEN (SELECT COUNT(*) FROM input_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'matching_type' THEN (SELECT COUNT(*) FROM matching_type_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'word_matching' THEN (SELECT COUNT(*) FROM word_matching_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'fill_blanks' THEN (SELECT COUNT(*) FROM fill_blanks_tests WHERE id = ta.test_id)
              WHEN ta.test_type = 'drawing' THEN (SELECT COUNT(*) FROM drawing_tests WHERE id = ta.test_id)
            END as test_exists
          FROM test_assignments ta
          LIMIT 10
        `;
        console.log('🔍 Test reference validation:', testReferences);
        
        // Let's check if the referenced subjects exist
        const subjectReferences = await sql`
          SELECT 
            ta.subject_id,
            s.subject,
            CASE WHEN s.subject_id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as subject_status
          FROM test_assignments ta
          LEFT JOIN subjects s ON ta.subject_id = s.subject_id
          LIMIT 10
        `;
        console.log('🔍 Subject reference validation:', subjectReferences);
        
        // Test names will now be retrieved directly in the main query
        
        // Let's also check the data types to see if there are any mismatches
        const dataTypeCheck = await sql`
          SELECT 
            ta.id as assignment_id,
            ta.test_type,
            ta.test_id,
            pg_typeof(ta.test_id) as test_id_type,
            CASE 
              WHEN ta.test_type = 'multiple_choice' THEN (SELECT pg_typeof(id) FROM multiple_choice_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'true_false' THEN (SELECT pg_typeof(id) FROM true_false_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'input' THEN (SELECT pg_typeof(id) FROM input_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'matching_type' THEN (SELECT pg_typeof(id) FROM matching_type_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'word_matching' THEN (SELECT pg_typeof(id) FROM word_matching_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'fill_blanks' THEN (SELECT pg_typeof(id) FROM fill_blanks_tests WHERE id = ta.test_id LIMIT 1)
              WHEN ta.test_type = 'drawing' THEN (SELECT pg_typeof(id) FROM drawing_tests WHERE id = ta.test_id LIMIT 1)
            END as test_table_id_type
          FROM test_assignments ta
          LIMIT 3
        `;
        console.log('🔍 Data type check:', dataTypeCheck);
      }
      
      // Now try the main query with proper test names - REMEMBER: subjects come from test_assignments, not test tables!
      // Using UNION approach for better reliability
      console.log('🔍 Starting multiple choice query...');
      const multipleChoiceAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(mct.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN multiple_choice_tests mct ON ta.test_id = mct.id AND ta.test_type = 'multiple_choice'
        WHERE ta.test_type = 'multiple_choice'
      `;
      console.log('🔍 Multiple choice query result:', multipleChoiceAssignments);
      
      console.log('🔍 Starting true/false query...');
      const trueFalseAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(tft.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN true_false_tests tft ON ta.test_id = tft.id AND ta.test_type = 'true_false'
        WHERE ta.test_type = 'true_false'
      `;
      console.log('🔍 True/false query result:', trueFalseAssignments);
      
      console.log('🔍 Starting input query...');
      const inputAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(it.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN input_tests it ON ta.test_id = it.id AND ta.test_type = 'input'
        WHERE ta.test_type = 'input'
      `;
      console.log('🔍 Input query result:', inputAssignments);
      
      console.log('🔍 Starting matching type query...');
      const matchingTypeAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(mtt.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN matching_type_tests mtt ON ta.test_id = mtt.id AND ta.test_type = 'matching_type'
        WHERE ta.test_type = 'matching_type'
      `;
      console.log('🔍 Matching type query result:', matchingTypeAssignments);
      
      console.log('🔍 Starting word matching query...');
      const wordMatchingAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.subject_id,
          ta.grade,
          ta.class,
          ta.assigned_at,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(wmt.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN word_matching_tests wmt ON ta.test_id = wmt.id AND ta.test_type = 'word_matching'
        WHERE ta.test_type = 'word_matching'
      `;
      console.log('🔍 Word matching query result:', wordMatchingAssignments);
      
      console.log('🔍 Starting fill blanks query...');
      const fillBlanksAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(fbt.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN fill_blanks_tests fbt ON ta.test_id = fbt.id AND ta.test_type = 'fill_blanks'
        WHERE ta.test_type = 'fill_blanks'
      `;
      console.log('🔍 Fill blanks query result:', fillBlanksAssignments);
      
      console.log('🔍 Starting drawing query...');
      const drawingAssignments = await sql`
        SELECT 
          ta.id as assignment_id,
          ta.test_type,
          ta.test_id,
          ta.teacher_id,
          ta.grade,
          ta.class,
          ta.subject_id,
          ta.academic_period_id,
          ta.assigned_at,
          ta.due_date,
          ta.is_active,
          ta.created_at,
          ta.updated_at,
          COALESCE(s.subject, 'Unknown Subject') as subject_name,
          COALESCE(dt.test_name, 'Unknown Test') as test_name
        FROM test_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        LEFT JOIN drawing_tests dt ON ta.test_id = dt.id AND ta.test_type = 'drawing'
        WHERE ta.test_type = 'drawing'
      `;
      console.log('🔍 Drawing query result:', drawingAssignments);
      
      // Combine all assignments
      assignments = [
        ...multipleChoiceAssignments,
        ...trueFalseAssignments,
        ...inputAssignments,
        ...matchingTypeAssignments,
        ...wordMatchingAssignments,
        ...fillBlanksAssignments,
        ...drawingAssignments
      ].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
      
      console.log('🔍 Test assignments found:', assignments.length);
      console.log('🔍 Multiple choice assignments:', multipleChoiceAssignments.length);
      console.log('🔍 True/false assignments:', trueFalseAssignments.length);
      console.log('🔍 Input assignments:', inputAssignments.length);
      console.log('🔍 Matching type assignments:', matchingTypeAssignments.length);
      console.log('🔍 Word matching assignments:', wordMatchingAssignments.length);
      console.log('🔍 Fill blanks assignments:', fillBlanksAssignments.length);
      console.log('🔍 Drawing assignments:', drawingAssignments.length);
      
      if (assignments.length > 0) {
        console.log('🔍 Sample assignment:', assignments[0]);
        console.log('🔍 Test names retrieved directly from SQL query - no enrichment needed!');
        
        // Let's also check what we got from each query
        if (multipleChoiceAssignments.length > 0) {
          console.log('🔍 Sample multiple choice assignment:', multipleChoiceAssignments[0]);
        }
        if (trueFalseAssignments.length > 0) {
          console.log('🔍 Sample true/false assignment:', trueFalseAssignments[0]);
        }
        if (inputAssignments.length > 0) {
          console.log('🔍 Sample input assignment:', inputAssignments[0]);
        }
        
        // Let's debug the JOIN issue by checking what test_ids we have vs what exists in test tables
        const testIdsInAssignments = assignments.map(a => ({ type: a.test_type, id: a.test_id }));
        console.log('🔍 Test IDs from assignments:', testIdsInAssignments);
        
        // Check if these test IDs actually exist in their respective tables
        if (multipleChoiceAssignments.length > 0) {
          const mcIds = multipleChoiceAssignments.map(a => a.test_id);
          const mcExists = await sql`SELECT id, test_name FROM multiple_choice_tests WHERE id = ANY(${mcIds})`;
          console.log('🔍 Multiple choice tests that exist:', mcExists);
        }
        
        if (trueFalseAssignments.length > 0) {
          const tfIds = trueFalseAssignments.map(a => a.test_id);
          const tfExists = await sql`SELECT id, test_name FROM true_false_tests WHERE id = ANY(${tfIds})`;
          console.log('🔍 True/false tests that exist:', tfExists);
        }
        
        if (inputAssignments.length > 0) {
          const inputIds = inputAssignments.map(a => a.test_id);
          const inputExists = await sql`SELECT id, test_name FROM input_tests WHERE id = ANY(${inputIds})`;
          console.log('🔍 Input tests that exist:', inputExists);
        }
        
        if (matchingTypeAssignments.length > 0) {
          const matchingIds = matchingTypeAssignments.map(a => a.test_id);
          const matchingExists = await sql`SELECT id, test_name FROM matching_type_tests WHERE id = ANY(${matchingIds})`;
          console.log('🔍 Matching type tests that exist:', matchingExists);
        }
        
        if (wordMatchingAssignments.length > 0) {
          const wordMatchingIds = wordMatchingAssignments.map(a => a.test_id);
          const wordMatchingExists = await sql`SELECT id, test_name FROM word_matching_tests WHERE id = ANY(${wordMatchingIds})`;
          console.log('🔍 Word matching tests that exist:', wordMatchingExists);
        }
        
        if (fillBlanksAssignments.length > 0) {
          const fillBlanksIds = fillBlanksAssignments.map(a => a.test_id);
          const fillBlanksExists = await sql`SELECT id, test_name FROM fill_blanks_tests WHERE id = ANY(${fillBlanksIds})`;
          console.log('🔍 Fill blanks tests that exist:', fillBlanksExists);
        }
        
        if (drawingAssignments.length > 0) {
          const drawingIds = drawingAssignments.map(a => a.test_id);
          const drawingExists = await sql`SELECT id, test_name FROM drawing_tests WHERE id = ANY(${drawingIds})`;
          console.log('🔍 Drawing tests that exist:', drawingExists);
        }
      }
    } catch (error) {
      console.log('⚠️ Test assignments query failed:', error.message);
      console.log('⚠️ Error details:', error);
      
      // Try a simpler query as fallback
      try {
        console.log('🔧 Trying simple fallback query...');
        assignments = await sql`
          SELECT 
            id as assignment_id,
            test_type,
            test_id,
            grade,
            class,
            assigned_at,
            subject_id,
            'Unknown Subject' as subject_name,
            'Unknown Test' as test_name
          FROM test_assignments
          ORDER BY assigned_at DESC
        `;
        console.log('🔍 Fallback query successful, found:', assignments.length);
      } catch (fallbackError) {
        console.log('⚠️ Fallback query also failed:', fallbackError.message);
        assignments = [];
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        assignments: assignments,
        total: assignments.length,
        by_subject: assignments.reduce((acc, a) => {
          const subject = a.subject_name || 'Unknown';
          acc[subject] = (acc[subject] || 0) + 1;
          return acc;
        }, {}),
        by_test_type: assignments.reduce((acc, a) => {
          acc[a.test_type] = (acc[a.test_type] || 0) + 1;
          return acc;
        }, {})
      })
    };
  } catch (error) {
    console.error('Get test assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve test assignments',
        error: error.message
      })
    };
  }
};
