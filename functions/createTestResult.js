const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { userId, testId, score, maxScore } = JSON.parse(event.body);
    
    if (!userId || !testId || score === undefined || !maxScore) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    await client.connect();

    // Get user's grade level
    const userResult = await client.query(`
      SELECT grade_level FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'User not found' })
      };
    }

    const gradeLevel = userResult.rows[0].grade_level;

    // Create new test result
    const result = await client.query(`
      INSERT INTO test_results (user_id, test_id, grade_level, score, max_score, answers, submitted_at, completed)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, true)
      RETURNING id, score, max_score
    `, [userId, testId, gradeLevel, score, maxScore, JSON.stringify({ score, maxScore, created_at: new Date().toISOString() })]);

    await client.end();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: true,
        message: 'Test result created successfully',
        testResultId: result.rows[0].id,
        testResult: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error creating test result:', error);
    
    if (client.connected) {
      await client.end();
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
