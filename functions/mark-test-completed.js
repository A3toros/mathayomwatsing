const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== mark-test-completed function called ===');
  console.log('Event:', event);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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
    
    // Check if user is teacher
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { test_type, test_id } = JSON.parse(event.body) || {};
    
    console.log('Extracted params - test_type:', test_type, 'test_id:', test_id);

    if (!test_type || !test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test type and test ID are required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Mark all assignments for this test as inactive (completed)
    const teacher_id = userInfo.teacher_id;
    
    // Update all test assignments for this test to set is_active = false
    const updateResult = await sql`
      UPDATE test_assignments 
      SET is_active = false, updated_at = NOW()
      WHERE test_type = ${test_type} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
      RETURNING id, test_type, test_id, grade, class
    `;

    if (updateResult.length === 0) {
      console.log('No assignments found for this test or teacher does not own this test');
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No assignments found for this test or you do not have permission to modify this test' })
      };
    }

    console.log('Test assignments marked as completed successfully:', updateResult);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Test assignments marked as completed successfully',
        test_id: test_id,
        test_type: test_type,
        assignments_completed: updateResult.length,
        assignments: updateResult
      })
    };

  } catch (error) {
    console.error('Error marking test as completed:', error);
    console.error('Error stack:', error.stack);
    
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
