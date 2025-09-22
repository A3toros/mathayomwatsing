const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== submit-matching-type-test function called ===');
  
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

    const { 
      test_id, 
      test_name, 
      teacher_id, 
      subject_id, 
      answers, 
      score, 
      maxScore, 
      time_taken, 
      started_at, 
      submitted_at, 
      caught_cheating, 
      visibility_change_times, 
      is_completed 
    } = JSON.parse(event.body);
    
    console.log('Parsed submission data:', {
      test_id,
      test_name,
      student_id: userInfo.student_id,
      score,
      maxScore,
      answers_count: Object.keys(answers || {}).length,
      time_taken: time_taken,
      started_at: started_at,
      submitted_at: submitted_at
    });

    // Validate input
    if (!test_id || !test_name || !answers || score === undefined || maxScore === undefined) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: test_id, test_name, answers, score, maxScore'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Begin transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started successfully');
    
    try {
      // Get current academic period ID
      const academicPeriod = await sql`
        SELECT id FROM academic_year 
        WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE 
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const academicPeriodId = academicPeriod.length > 0 ? academicPeriod[0].id : null;
      console.log('Academic period ID:', academicPeriodId);
      
      // Insert test result (percentage is a generated column, so we don't include it)
      const result = await sql`
        INSERT INTO matching_type_test_results (
          test_id, test_name, teacher_id, subject_id, grade, class, number,
          student_id, name, surname, nickname, score, max_score,
          answers, time_taken, started_at, submitted_at, caught_cheating,
          visibility_change_times, is_completed, created_at, academic_period_id
        )
        VALUES (
          ${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, 
          ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
          ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
          ${score}, ${maxScore},
          ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, 
          ${submitted_at || new Date().toISOString()}, ${caught_cheating || false},
          ${visibility_change_times || 0}, ${is_completed || true}, NOW(), 
          ${academicPeriodId}
        )
        RETURNING id, percentage, is_completed
      `;
      
      const resultId = result[0].id;
      const insertedPercentage = result[0].percentage;
      const insertedIsCompleted = result[0].is_completed;
      console.log(`Test result inserted successfully with ID: ${resultId}`);
      console.log(`Inserted percentage: ${insertedPercentage}, is_completed: ${insertedIsCompleted}`);
      
      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test submitted successfully',
          result_id: resultId,
          score: score,
          max_score: maxScore,
          percentage: Math.round((score / maxScore) * 100)
        })
      };
      
    } catch (error) {
      // Rollback transaction on error
      console.error('Error during database operations, rolling back transaction...');
      console.error('Error details:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
    
  } catch (error) {
    console.error('Submit matching type test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to submit test',
        error: error.message
      })
    };
  }
};