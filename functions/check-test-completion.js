const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // CORS headers with Authorization support
  const headers = {
    'Access-Control-Allow-Origin': 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
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
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Extract student_id from JWT token
    const student_id = decoded.sub;
    
    // Extract test_type and test_id from query parameters
    const { test_type, test_id } = event.queryStringParameters || {};
    
    console.log('check-test-completion called with:', { test_type, test_id, student_id: 'from JWT' });

    // Validate input
    if (!test_type || !test_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['test_type', 'test_id'],
          received: { test_type, test_id }
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
