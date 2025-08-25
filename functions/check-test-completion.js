const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { test_type, test_id, student_id } = event.queryStringParameters || {};
    
    console.log('check-test-completion called with:', { test_type, test_id, student_id });

    // Validate input
    if (!test_type || !test_id || !student_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['test_type', 'test_id', 'student_id'],
          received: { test_type, test_id, student_id }
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('Database connection established');

    // Check if student has completed this test by looking in the appropriate results table
    let isCompleted = false;
    
    if (test_type === 'multiple_choice') {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM multiple_choice_test_results 
        WHERE test_id = ${test_id} AND student_id = ${student_id}
      `;
      isCompleted = result[0].count > 0;
    } else if (test_type === 'true_false') {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM true_false_test_results 
        WHERE test_id = ${test_id} AND student_id = ${student_id}
      `;
      isCompleted = result[0].count > 0;
    } else if (test_type === 'input') {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM input_test_results 
        WHERE test_id = ${test_id} AND student_id = ${student_id}
      `;
      isCompleted = result[0].count > 0;
    } else if (test_type === 'matching_type') {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM matching_type_test_results 
        WHERE test_id = ${test_id} AND student_id = ${student_id}
      `;
      isCompleted = result[0].count > 0;
    } else {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid test type' })
      };
    }

    console.log(`Test completion check result: ${isCompleted}`);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        isCompleted: isCompleted,
        test_type: test_type,
        test_id: test_id,
        student_id: student_id
      })
    };

  } catch (error) {
    console.error('Error checking test completion:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
