const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== get-student-test-results function called ===');
  console.log('Event:', event);
  
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
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { student_id } = event.queryStringParameters || {};
    
    console.log('Student ID:', student_id);

    if (!student_id) {
      console.log('Missing student_id parameter');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student ID is required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // First, get the current academic year information
    const currentAcademicYear = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;
    
    console.log('Current academic year query result:', currentAcademicYear);
    
    let currentPeriodId = null;
    if (currentAcademicYear.length > 0) {
      currentPeriodId = currentAcademicYear[0].id;
      console.log('Current academic period ID:', currentPeriodId);
      console.log('Current academic period:', currentAcademicYear[0]);
    } else {
      console.log('No current academic period found, will show all results');
    }

    // Get all test results for the student (filtered by current academic year if available)
    const results = [];

    // Multiple choice test results
    let mcQuery;
    if (currentPeriodId) {
      mcQuery = sql`
        SELECT 
          mctr.id,
          mctr.test_name,
          mctr.score,
          mctr.max_score,
          mctr.created_at as submitted_at,
          'multiple_choice' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM multiple_choice_test_results mctr
        LEFT JOIN academic_year ay ON mctr.academic_period_id = ay.id
        LEFT JOIN multiple_choice_tests mct ON mctr.test_id = mct.id
        LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'multiple_choice' AND ta.test_id = mctr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE mctr.student_id = ${student_id}
          AND mctr.academic_period_id = ${currentPeriodId}
        ORDER BY ay.semester, ay.term, mctr.created_at DESC
      `;
    } else {
      mcQuery = sql`
        SELECT 
          mctr.id,
          mctr.test_name,
          mctr.score,
          mctr.max_score,
          mctr.created_at as submitted_at,
          'multiple_choice' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM multiple_choice_test_results mctr
        LEFT JOIN academic_year ay ON mctr.academic_period_id = ay.id
        LEFT JOIN multiple_choice_tests mct ON mctr.test_id = mct.id
        LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'multiple_choice' AND ta.test_id = mctr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE mctr.student_id = ${student_id}
        ORDER BY ay.semester, ay.term, mctr.created_at DESC
      `;
    }
    
    const mcResults = await mcQuery;
    
    console.log('Multiple choice results found:', mcResults.length);
    if (mcResults.length > 0) {
      console.log('Sample MC result:', mcResults[0]);
    }
    
    mcResults.forEach(result => {
      results.push({
        ...result,
        score_percentage: Math.round((result.score / result.max_score) * 100)
      });
    });

    // True/false test results
    let tfQuery;
    if (currentPeriodId) {
      tfQuery = sql`
        SELECT 
          tftr.id,
          tftr.test_name,
          tftr.score,
          tftr.max_score,
          tftr.created_at as submitted_at,
          'true_false' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM true_false_test_results tftr
        LEFT JOIN academic_year ay ON tftr.academic_period_id = ay.id
        LEFT JOIN true_false_tests tft ON tftr.test_id = tft.id
        LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'true_false' AND ta.test_id = tftr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE tftr.student_id = ${student_id}
          AND tftr.academic_period_id = ${currentPeriodId}
        ORDER BY ay.semester, ay.term, tftr.created_at DESC
      `;
    } else {
      tfQuery = sql`
        SELECT 
          tftr.id,
          tftr.test_name,
          tftr.score,
          tftr.max_score,
          tftr.created_at as submitted_at,
          'true_false' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM true_false_test_results tftr
        LEFT JOIN academic_year ay ON tftr.academic_period_id = ay.id
        LEFT JOIN true_false_tests tft ON tftr.test_id = tft.id
        LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'true_false' AND ta.test_id = tftr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE tftr.student_id = ${student_id}
        ORDER BY ay.semester, ay.term, tftr.created_at DESC
      `;
    }
    
    const tfResults = await tfQuery;
    
    tfResults.forEach(result => {
      results.push({
        ...result,
        score_percentage: Math.round((result.score / result.max_score) * 100)
      });
    });

    // Input test results
    let inputQuery;
    if (currentPeriodId) {
      inputQuery = sql`
        SELECT 
          itr.id,
          itr.test_name,
          itr.score,
          itr.max_score,
          itr.created_at as submitted_at,
          'input' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM input_test_results itr
        LEFT JOIN academic_year ay ON itr.academic_period_id = ay.id
        LEFT JOIN input_tests it ON itr.test_id = it.id
        LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'input' AND ta.test_id = itr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE itr.student_id = ${student_id}
          AND itr.academic_period_id = ${currentPeriodId}
        ORDER BY ay.semester, ay.term, itr.created_at DESC
      `;
    } else {
      inputQuery = sql`
        SELECT 
          itr.id,
          itr.test_name,
          itr.score,
          itr.max_score,
          itr.created_at as submitted_at,
          'input' as test_type,
          ay.academic_year,
          ay.semester,
          ay.term,
          COALESCE(s.subject, 'Unknown Subject') as subject,
          t.username as teacher_name
        FROM input_test_results itr
        LEFT JOIN academic_year ay ON itr.academic_period_id = ay.id
        LEFT JOIN input_tests it ON itr.test_id = it.id
        LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
        LEFT JOIN test_assignments ta ON ta.test_type = 'input' AND ta.test_id = itr.test_id
        LEFT JOIN subjects s ON ta.subject_id = s.subject_id
        WHERE itr.student_id = ${student_id}
        ORDER BY ay.semester, ay.term, itr.created_at DESC
      `;
    }
    
    const inputResults = await inputQuery;
    
    inputResults.forEach(result => {
      results.push({
        ...result,
        score_percentage: Math.round((result.score / result.max_score) * 100)
      });
    });

    console.log('Found results:', results.length);
    
    // Comprehensive debugging information
    const debugInfo = {
      student_id: student_id,
      current_academic_year: currentAcademicYear.length > 0 ? currentAcademicYear[0] : null,
      academic_year_filtering: {
        current_period_id: currentPeriodId,
        filter_applied: !!currentPeriodId,
        filter_description: currentPeriodId ? 
          `Only showing results from current academic period (ID: ${currentPeriodId})` : 
          'No current academic period found, showing all results'
      },
      query_execution: {
        multiple_choice: {
          raw_count: mcResults.length,
          sample_data: mcResults.length > 0 ? mcResults[0] : null,
          query_details: 'LEFT JOIN with academic_year, multiple_choice_tests, teachers, test_assignments, subjects'
        },
        true_false: {
          raw_count: tfResults.length,
          sample_data: tfResults.length > 0 ? tfResults[0] : null,
          query_details: 'LEFT JOIN with academic_year, true_false_tests, teachers, test_assignments, subjects'
        },
        input: {
          raw_count: inputResults.length,
          sample_data: inputResults.length > 0 ? inputResults[0] : null,
          query_details: 'LEFT JOIN with academic_year, input_tests, teachers, test_assignments, subjects'
        }
      },
      database_state: {
        total_results_per_table: {
          multiple_choice: (await sql`SELECT COUNT(*) as count FROM multiple_choice_test_results`)[0].count,
          true_false: (await sql`SELECT COUNT(*) as count FROM true_false_test_results`)[0].count,
          input: (await sql`SELECT COUNT(*) as count FROM input_test_results`)[0].count
        },
        results_for_this_student: {
          multiple_choice: (await sql`SELECT COUNT(*) as count FROM multiple_choice_test_results WHERE student_id = ${student_id}`)[0].count,
          true_false: (await sql`SELECT COUNT(*) as count FROM true_false_test_results WHERE student_id = ${student_id}`)[0].count,
          input: (await sql`SELECT COUNT(*) as count FROM input_test_results WHERE student_id = ${student_id}`)[0].count
        }
      },
      subject_handling: {
        join_logic: 'LEFT JOIN test_assignments with test_id only, then JOIN with subjects table',
        test_assignments_count: (await sql`SELECT COUNT(*) as count FROM test_assignments`)[0].count,
        subjects_count: (await sql`SELECT COUNT(*) as count FROM subjects`)[0].count,
        sample_test_assignment: (await sql`SELECT * FROM test_assignments LIMIT 1`)[0] || null,
        sample_subject: (await sql`SELECT * FROM subjects LIMIT 1`)[0] || null
      },
             processing_summary: {
         final_results_count: results.length,
         academic_period_joins: 'All queries use LEFT JOIN with academic_year',
         teacher_joins: 'All queries use LEFT JOIN with teachers table',
         subject_handling: 'Using real subject names from test_assignments JOIN with subjects table',
         academic_year_filtering: currentPeriodId ? 
           `Results filtered to current academic period (ID: ${currentPeriodId})` : 
           'No academic year filtering applied - showing all results'
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
        results: results,
        current_academic_period: currentAcademicYear.length > 0 ? currentAcademicYear[0] : null,
        filtering_applied: !!currentPeriodId,
        debug_info: debugInfo
      })
    };

  } catch (error) {
    console.error('Error getting test results:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
