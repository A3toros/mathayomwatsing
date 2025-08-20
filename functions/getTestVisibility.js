const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const client = await pool.connect();
    
    // Check if test_visibility table exists, if not create it with default values
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_visibility (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(50) UNIQUE NOT NULL,
        is_visible BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default test visibility settings if table is empty
    const countResult = await client.query('SELECT COUNT(*) FROM test_visibility');
    if (parseInt(countResult.rows[0].count) === 0) {
      const defaultTests = [
        'grade1-listening',
        'grade2-listening', 'grade2-vocabulary',
        'grade3-listening', 'grade3-vocabulary',
        'grade4-vocabulary',
        'grade5-vocabulary',
        'grade6-vocabulary', 'grade6-grammar', 'grade6-reading', 'grade6-writing', 'grade6-final'
      ];
      
      for (const testId of defaultTests) {
        await client.query(`
          INSERT INTO test_visibility (test_id, is_visible) 
          VALUES ($1, false) 
          ON CONFLICT (test_id) DO NOTHING
        `, [testId]);
      }
    }

    // Get all test visibility settings
    const result = await client.query('SELECT test_id, is_visible FROM test_visibility');
    
    const visibility = {};
    result.rows.forEach(row => {
      visibility[row.test_id] = row.is_visible;
    });

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
        visibility
      })
    };

  } catch (error) {
    console.error('Error in getTestVisibility:', error);
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
