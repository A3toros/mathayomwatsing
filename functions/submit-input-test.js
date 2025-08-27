const { neon } = require('@neondatabase/serverless');

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { test_id, test_name, studentId, grade, class: className, number, name, surname, nickname, score, maxScore, answers } = JSON.parse(event.body);

    // Validate required fields
    if (!test_id || !test_name || !studentId || !grade || !className || !number || !name || !surname || !nickname || !score || !maxScore || !answers) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, studentId, grade, class, number, name, surname, nickname, score, maxScore, answers' 
        })
      };
    }

    // Connect to database using @neondatabase/serverless
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Get current academic period
    const currentPeriod = await sql`
      SELECT id FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date 
      ORDER BY start_date DESC LIMIT 1
    `;
    
    const academicPeriodId = currentPeriod.length > 0 ? currentPeriod[0].id : null;

    // Insert test result - FIXED: Use correct table name for input tests
    const result = await sql`
      INSERT INTO input_test_results 
      (test_id, test_name, student_id, grade, class, number, name, surname, nickname, score, max_score, answers, academic_period_id)
      VALUES (${test_id}, ${test_name}, ${studentId}, ${grade}, ${className}, ${number}, ${name}, ${surname}, ${nickname}, ${score}, ${maxScore}, ${JSON.stringify(answers)}, ${academicPeriodId})
      RETURNING id
    `;

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: true, 
        id: result[0].id,
        message: 'Input test result saved successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error' 
      })
    };
  }
};
