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
    const { testResultId, score, maxScore } = JSON.parse(event.body);
    
    if (!testResultId || score === undefined || !maxScore) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    await client.connect();

    // Update the test result
    const result = await client.query(`
      UPDATE test_results 
      SET score = $1, max_score = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, score, max_score
    `, [score, maxScore, testResultId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Test result not found' })
      };
    }

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
        message: 'Test result updated successfully',
        testResult: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error updating test result:', error);
    
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
