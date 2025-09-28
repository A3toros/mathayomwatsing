const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== submit-fill-blanks-test function called ===');
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Student role required.' })
      };
    }

    // Parse request body
    const { 
      test_id, 
      test_name, 
      teacher_id, 
      subject_id, 
      student_id, 
      answers, 
      score, 
      maxScore, 
      time_taken, 
      started_at, 
      submitted_at, 
      caught_cheating, 
      visibility_change_times 
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      student_id,
      answers_count: answers ? Object.keys(answers).length : 0,
      score,
      maxScore,
      time_taken,
      caught_cheating,
      visibility_change_times
    });

    // Validate required fields
    if (!test_id || !test_name || !teacher_id || !subject_id || !student_id || 
        score === undefined || maxScore === undefined || !answers) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, teacher_id, subject_id, student_id, score, maxScore, answers' 
        })
      };
    }

    // Connect to database
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Get current academic period (like other tests)
    const currentPeriod = await sql`
      SELECT id FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date 
      ORDER BY start_date DESC LIMIT 1
    `;
    
    const academicPeriodId = currentPeriod.length > 0 ? currentPeriod[0].id : null;

    // Extract student info from JWT token (like other tests do)
    const studentId = userInfo.sub || userInfo.student_id;
    const grade = userInfo.grade;
    const className = userInfo.class;
    const number = userInfo.number;
    const name = userInfo.name;
    const surname = userInfo.surname;
    const nickname = userInfo.nickname;

    // Convert class to integer (like other tests)
    const convertedClass = parseInt(className);

    // Debug: Log student_id value
    console.log('🔍 Student ID from JWT:', studentId);
    console.log('🔍 User info:', userInfo);

    // Insert test result with standard field names (matching other test types)
    const result = await sql`
      INSERT INTO fill_blanks_test_results 
      (test_id, test_name, teacher_id, subject_id, grade, class, number, student_id, name, surname, nickname, score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, academic_period_id, created_at)
      VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number}, ${studentId}, ${name}, ${surname}, ${nickname}, ${score}, ${maxScore}, ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, ${true}, ${academicPeriodId}, NOW())
      RETURNING id
    `;

    console.log('Fill blanks test result inserted:', result[0].id);

    // Calculate percentage for response
    const percentageScore = Math.round((score / maxScore) * 100);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        result_id: result[0].id,
        score: score,
        max_score: maxScore,
        percentage_score: percentageScore,
        message: 'Fill blanks test submitted successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error',
        constraint: error.constraint,
        code: error.code
      })
    };
  }
};
