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

    // Calculate percentage manually (not generated column)
    const percentageScore = Math.round((score / maxScore) * 100);

    // Insert test result with correct field names
    const result = await sql`
      INSERT INTO fill_blanks_test_results 
      (test_id, test_name, teacher_id, subject_id, student_id, student_name, student_surname, student_nickname, student_grade, student_class, student_number, score, max_score, percentage_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, created_at)
      VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${student_id}, ${userInfo.name || null}, ${userInfo.surname || null}, ${userInfo.nickname || null}, ${userInfo.grade || null}, ${userInfo.class || null}, ${userInfo.number || null}, ${score}, ${maxScore}, ${percentageScore}, ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, NOW())
      RETURNING id
    `;

    console.log('Fill blanks test result inserted:', result[0].id);

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
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error' 
      })
    };
  }
};
