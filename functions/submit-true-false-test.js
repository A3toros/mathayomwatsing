const { Pool } = require('pg');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let client;
  try {
    // Parse request body
    const { studentId, grade, class: className, number, nickname, score, maxScore, answers } = JSON.parse(event.body);

    // Validate required fields
    if (!studentId || !nickname || !score || !maxScore || !answers) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Connect to database
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    client = await pool.connect();

    // Insert test result
    const result = await client.query(`
      INSERT INTO true_false_test_results 
      (student_id, grade, class, number, nickname, score, max_score, answers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [studentId, grade, className, number, nickname, score, maxScore, JSON.stringify(answers)]);

    client.release();

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: true, 
        id: result.rows[0].id,
        message: 'True/False test result saved successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    if (client) client.release();
    
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
