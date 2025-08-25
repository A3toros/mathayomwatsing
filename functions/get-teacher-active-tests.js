const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { teacher_id } = event.queryStringParameters || {};

    if (!teacher_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Get all tests created by this teacher with their assignments
    const activeTests = await sql`
      SELECT 
        'multiple_choice' as test_type,
        mct.id as test_id,
        mct.test_name,
        mct.num_questions,
        mct.created_at,
        COUNT(ta.id) as assignment_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '30 days') - CURRENT_TIMESTAMP)
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as assignments
      FROM multiple_choice_tests mct
      INNER JOIN test_assignments ta ON mct.id = ta.test_id AND ta.test_type = 'multiple_choice'
      WHERE mct.teacher_id = ${teacher_id}
      GROUP BY mct.id, mct.test_name, mct.num_questions, mct.created_at
      
      UNION ALL
      
      SELECT 
        'true_false' as test_type,
        tft.id as test_id,
        tft.test_name,
        tft.num_questions,
        tft.created_at,
        COUNT(ta.id) as assignment_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '30 days') - CURRENT_TIMESTAMP)
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as assignments
      FROM true_false_tests tft
      INNER JOIN test_assignments ta ON tft.id = ta.test_id AND ta.test_type = 'true_false'
      WHERE tft.teacher_id = ${teacher_id}
      GROUP BY tft.id, tft.test_name, tft.num_questions, tft.created_at
      
      UNION ALL
      
      SELECT 
        'input' as test_type,
        it.id as test_id,
        it.test_name,
        it.num_questions,
        it.created_at,
        COUNT(ta.id) as assignment_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '30 days') - CURRENT_TIMESTAMP)
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as assignments
      FROM input_tests it
      INNER JOIN test_assignments ta ON it.id = ta.test_id AND ta.test_type = 'input'
      WHERE it.teacher_id = ${teacher_id}
      GROUP BY it.id, it.test_name, it.num_questions, it.created_at
      
      ORDER BY created_at DESC
    `;

    // Comprehensive debugging information
    const debugInfo = {
      request_parameters: {
        teacher_id: teacher_id
      },
      query_execution: {
        query_type: 'UNION ALL of 3 test types with INNER JOIN test_assignments',
        test_types: ['multiple_choice', 'true_false', 'input'],
        join_strategy: 'INNER JOIN ensures only tests with assignments are returned'
      },
      results_analysis: {
        total_tests_found: activeTests.length,
        test_type_breakdown: {
          multiple_choice: activeTests.filter(t => t.test_type === 'multiple_choice').length,
          true_false: activeTests.filter(t => t.test_type === 'true_false').length,
          input: activeTests.filter(t => t.test_type === 'input').length
        },
        assignment_statistics: {
          total_assignments: activeTests.reduce((sum, test) => sum + test.assignment_count, 0),
          average_assignments_per_test: activeTests.length > 0 ? 
            (activeTests.reduce((sum, test) => sum + test.assignment_count, 0) / activeTests.length).toFixed(2) : 0
        }
      },
      sample_data: {
        first_test: activeTests.length > 0 ? activeTests[0] : null,
        test_with_most_assignments: activeTests.length > 0 ? 
          activeTests.reduce((max, test) => test.assignment_count > max.assignment_count ? test : max) : null
      },
      query_details: {
        multiple_choice: 'INNER JOIN test_assignments, filtered by teacher_id',
        true_false: 'INNER JOIN test_assignments, filtered by teacher_id',
        input: 'INNER JOIN test_assignments, filtered by teacher_id',
        ordering: 'ORDER BY created_at DESC'
      }
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('=== END DEBUG INFO ===');

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tests: activeTests,
        debug_info: debugInfo
      })
    };

  } catch (error) {
    console.error('Error getting teacher active tests:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
