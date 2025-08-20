const { Pool } = require('pg');

const pool = new Pool({
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

  // Check admin authentication
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    };
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify admin token (simple check for now)
    if (token !== process.env.ADMIN_SECRET_KEY) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid admin token' })
      };
    }

    const { visibility } = JSON.parse(event.body);
    
    if (!visibility || typeof visibility !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Invalid visibility data' })
      };
    }

    const client = await pool.connect();
    
    // Ensure test_visibility table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_visibility (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(50) UNIQUE NOT NULL,
        is_visible BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update visibility for each test
    for (const [testId, isVisible] of Object.entries(visibility)) {
      await client.query(`
        INSERT INTO test_visibility (test_id, is_visible, updated_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (test_id) 
        DO UPDATE SET 
          is_visible = EXCLUDED.is_visible,
          updated_at = CURRENT_TIMESTAMP
      `, [testId, isVisible]);
    }

    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        success: true,
        message: 'Test visibility updated successfully'
      })
    };

  } catch (error) {
    console.error('Error in updateTestVisibility:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
