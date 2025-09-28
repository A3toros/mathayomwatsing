const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== get-student-test-results function called ===');
  
  // CORS headers with Authorization support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
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
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Extract student_id from JWT token
    const student_id = decoded.sub;
    
    console.log('Student ID (from JWT):', student_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Get current academic period
    const currentAcademicYear = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;
    
    let currentPeriodId = null;
    if (currentAcademicYear.length > 0) {
      currentPeriodId = currentAcademicYear[0].id;
      console.log('Current academic period ID:', currentPeriodId);
    } else {
      console.log('No current academic period found, will show all results');
    }

    // Also check what academic periods exist
    const allPeriods = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      ORDER BY start_date DESC
    `;
    console.log('All academic periods:', allPeriods);

    // Query actual test results tables directly
    let results = [];
    try {
      console.log('Querying test results tables directly for student:', student_id);
      
      // Query all test result tables and combine results
      const [multipleChoiceResults, trueFalseResults, inputResults, matchingResults, wordMatchingResults, drawingResults, fillBlanksResults] = await Promise.all([
        currentPeriodId 
          ? sql`
              SELECT 
                m.id,
                m.test_id,
                'multiple_choice' as test_type,
                m.test_name,
                m.score,
                m.max_score,
                m.percentage,
                m.caught_cheating,
                m.visibility_change_times,
                m.is_completed,
                m.created_at as submitted_at,
                m.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM multiple_choice_test_results m
              LEFT JOIN subjects s ON m.subject_id = s.subject_id
              LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
              WHERE m.student_id = ${student_id}
              AND m.academic_period_id = ${currentPeriodId}
            `
          : sql`
              SELECT 
                m.id,
                m.test_id,
                'multiple_choice' as test_type,
                m.test_name,
                m.score,
                m.max_score,
                m.percentage,
                m.caught_cheating,
                m.visibility_change_times,
                m.is_completed,
                m.created_at as submitted_at,
                m.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM multiple_choice_test_results m
              LEFT JOIN subjects s ON m.subject_id = s.subject_id
              LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
              WHERE m.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                t.id,
                t.test_id,
                'true_false' as test_type,
                t.test_name,
                t.score,
                t.max_score,
                t.percentage,
                t.caught_cheating,
                t.visibility_change_times,
                t.is_completed,
                t.created_at as submitted_at,
                t.academic_period_id,
                s.subject,
                CONCAT(te.first_name, ' ', te.last_name) as teacher_name
              FROM true_false_test_results t
              LEFT JOIN subjects s ON t.subject_id = s.subject_id
              LEFT JOIN teachers te ON t.teacher_id = te.teacher_id
              WHERE t.student_id = ${student_id}
              AND t.academic_period_id = ${currentPeriodId}
            `
          : sql`
              SELECT 
                t.id,
                t.test_id,
                'true_false' as test_type,
                t.test_name,
                t.score,
                t.max_score,
                t.percentage,
                t.caught_cheating,
                t.visibility_change_times,
                t.is_completed,
                t.created_at as submitted_at,
                t.academic_period_id,
                s.subject,
                CONCAT(te.first_name, ' ', te.last_name) as teacher_name
              FROM true_false_test_results t
              LEFT JOIN subjects s ON t.subject_id = s.subject_id
              LEFT JOIN teachers te ON t.teacher_id = te.teacher_id
              WHERE t.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                i.id,
                i.test_id,
                'input' as test_type,
                i.test_name,
                i.score,
                i.max_score,
                i.percentage,
                i.caught_cheating,
                i.visibility_change_times,
                i.is_completed,
                i.created_at as submitted_at,
                i.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM input_test_results i
              LEFT JOIN subjects s ON i.subject_id = s.subject_id
              LEFT JOIN teachers t ON i.teacher_id = t.teacher_id
              WHERE i.student_id = ${student_id}
              AND i.academic_period_id = ${currentPeriodId}
            `
          : sql`
              SELECT 
                i.id,
                i.test_id,
                'input' as test_type,
                i.test_name,
                i.score,
                i.max_score,
                i.percentage,
                i.caught_cheating,
                i.visibility_change_times,
                i.is_completed,
                i.created_at as submitted_at,
                i.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM input_test_results i
              LEFT JOIN subjects s ON i.subject_id = s.subject_id
              LEFT JOIN teachers t ON i.teacher_id = t.teacher_id
              WHERE i.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                m.id,
                m.test_id,
                'matching_type' as test_type,
                m.test_name,
                m.score,
                m.max_score,
                m.percentage,
                m.caught_cheating,
                m.visibility_change_times,
                m.is_completed,
                m.created_at as submitted_at,
                m.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM matching_type_test_results m
              LEFT JOIN subjects s ON m.subject_id = s.subject_id
              LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
              WHERE m.student_id = ${student_id}
              AND m.academic_period_id = ${currentPeriodId}
            `
          : sql`
          SELECT 
                m.id,
                m.test_id,
                'matching_type' as test_type,
                m.test_name,
                m.score,
                m.max_score,
                m.percentage,
                m.caught_cheating,
                m.visibility_change_times,
                m.is_completed,
                m.created_at as submitted_at,
                m.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM matching_type_test_results m
              LEFT JOIN subjects s ON m.subject_id = s.subject_id
              LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
              WHERE m.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                w.id,
                w.test_id,
                'word_matching' as test_type,
                w.test_name,
                w.score,
                w.max_score,
                w.percentage,
                w.caught_cheating,
                w.visibility_change_times,
                w.is_completed,
                w.created_at as submitted_at,
                w.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM word_matching_test_results w
              LEFT JOIN subjects s ON w.subject_id = s.subject_id
              LEFT JOIN teachers t ON w.teacher_id = t.teacher_id
              WHERE w.student_id = ${student_id}
              AND w.academic_period_id = ${currentPeriodId}
            `
          : sql`
              SELECT 
                w.id,
                w.test_id,
                'word_matching' as test_type,
                w.test_name,
                w.score,
                w.max_score,
                w.percentage,
                w.caught_cheating,
                w.visibility_change_times,
                w.is_completed,
                w.created_at as submitted_at,
                w.academic_period_id,
                s.subject,
                t.first_name as teacher_name
              FROM word_matching_test_results w
              LEFT JOIN subjects s ON w.subject_id = s.subject_id
              LEFT JOIN teachers t ON w.teacher_id = t.teacher_id
              WHERE w.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                d.id,
                d.test_id,
                'drawing' as test_type,
                d.test_name,
                d.score,
                d.max_score,
                d.percentage,
                d.caught_cheating,
                d.visibility_change_times,
                d.is_completed,
                d.created_at as submitted_at,
                d.academic_period_id,
                s.subject,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name
              FROM drawing_test_results d
              LEFT JOIN subjects s ON d.subject_id = s.subject_id
              LEFT JOIN teachers t ON d.teacher_id = t.teacher_id
              WHERE d.student_id = ${student_id}
              AND d.academic_period_id = ${currentPeriodId}
            `
          : sql`
              SELECT 
                d.id,
                d.test_id,
                'drawing' as test_type,
                d.test_name,
                d.score,
                d.max_score,
                d.percentage,
                d.caught_cheating,
                d.visibility_change_times,
                d.is_completed,
                d.created_at as submitted_at,
                d.academic_period_id,
                s.subject,
                CONCAT(t.first_name, ' ', t.last_name) as teacher_name
              FROM drawing_test_results d
              LEFT JOIN subjects s ON d.subject_id = s.subject_id
              LEFT JOIN teachers t ON d.teacher_id = t.teacher_id
              WHERE d.student_id = ${student_id}
            `,
        currentPeriodId 
          ? sql`
              SELECT 
                f.id,
                f.test_id,
                'fill_blanks' as test_type,
                f.test_name,
                f.score,
                f.max_score,
                f.percentage_score as percentage,
                f.caught_cheating,
                f.visibility_change_times,
                true as is_completed,
                f.created_at as submitted_at,
                ${currentPeriodId} as academic_period_id,
                s.subject,
                CONCAT(te.first_name, ' ', te.last_name) as teacher_name
              FROM fill_blanks_test_results f
              LEFT JOIN subjects s ON f.subject_id = s.subject_id
              LEFT JOIN teachers te ON f.teacher_id = te.teacher_id
              WHERE f.student_id = ${student_id}
            `
          : sql`
              SELECT 
                f.id,
                f.test_id,
                'fill_blanks' as test_type,
                f.test_name,
                f.score,
                f.max_score,
                f.percentage_score as percentage,
                f.caught_cheating,
                f.visibility_change_times,
                true as is_completed,
                f.created_at as submitted_at,
                s.subject,
                CONCAT(te.first_name, ' ', te.last_name) as teacher_name
              FROM fill_blanks_test_results f
              LEFT JOIN subjects s ON f.subject_id = s.subject_id
              LEFT JOIN teachers te ON f.teacher_id = te.teacher_id
              WHERE f.student_id = ${student_id}
            `
      ]);
      
      // Combine all results
      results = [
        ...multipleChoiceResults,
        ...trueFalseResults,
        ...inputResults,
        ...matchingResults,
        ...wordMatchingResults,
        ...drawingResults,
        ...fillBlanksResults
      ].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      
      console.log('Student results query successful, found:', results.length, 'results');
      console.log('Matching type results found:', matchingResults.length);
      console.log('Current period ID being filtered by:', currentPeriodId);
      
      // Debug: Check if there are any matching type results at all
      const allMatchingResults = await sql`
        SELECT COUNT(*) as count FROM matching_type_test_results
      `;
      console.log('Total matching type test results in database:', allMatchingResults[0].count);
      
      // Debug: Check what's actually in the database for this student
      const studentResults = await sql`
        SELECT id, test_id, test_name, score, max_score, percentage, is_completed, academic_period_id, created_at
        FROM matching_type_test_results 
          WHERE student_id = ${student_id}
          ORDER BY created_at DESC
        `;
      console.log('All matching results for student (with percentage and is_completed):', studentResults);
      
      // Debug: Check what the actual query returns
      console.log('Matching results from main query:', matchingResults);
      
      // Debug: Check teacher_id values in matching type test results
      const teacherIdDebug = await sql`
        SELECT teacher_id, COUNT(*) as count 
        FROM matching_type_test_results 
        WHERE student_id = ${student_id}
        GROUP BY teacher_id
      `;
      console.log('Teacher IDs in matching type test results:', teacherIdDebug);
      
      // Debug: Check what teachers exist
      const teachersCheck = await sql`
        SELECT teacher_id, first_name, last_name 
        FROM teachers 
        LIMIT 5
      `;
      console.log('Sample teachers in database:', teachersCheck);
      
    } catch (error) {
      console.log('Test results query failed:', error.message);
      // Return empty array if no results found
      results = [];
    }

    console.log('Student results found:', results.length);

    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.id,
      test_id: result.test_id,
      test_name: result.test_name,
      test_type: result.test_type,
      score: result.score,
      max_score: result.max_score,
      percentage: result.percentage,
      improvement_from_last: result.improvement_from_last,
      caught_cheating: result.caught_cheating,
      visibility_change_times: result.visibility_change_times,
      is_completed: result.is_completed,
      submitted_at: result.submitted_at,
      academic_period_id: result.academic_period_id,
      subject: result.subject,
      teacher_name: result.teacher_name
    }));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        results: formattedResults,
        count: formattedResults.length
      })
    };

  } catch (error) {
    console.error('Error in get-student-test-results:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};