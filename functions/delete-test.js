const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== delete-test function called ===');
  console.log('Event:', event);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { teacher_id, test_type, test_id } = JSON.parse(event.body) || {};
    
    console.log('Extracted params - teacher_id:', teacher_id, 'test_type:', test_type, 'test_id:', test_id);

    if (!teacher_id || !test_type || !test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID, test type, and test ID are required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Verify teacher owns this test
    let testOwnership = false;
    switch (test_type) {
      case 'multiple_choice':
        const mcTest = await sql`
          SELECT id FROM multiple_choice_tests 
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
        testOwnership = mcTest.length > 0;
        break;

      case 'true_false':
        const tfTest = await sql`
          SELECT id FROM true_false_tests 
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
        testOwnership = tfTest.length > 0;
        break;

      case 'input':
        const inputTest = await sql`
          SELECT id FROM input_tests 
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
        testOwnership = inputTest.length > 0;
        break;

      default:
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid test type' })
        };
    }

    if (!testOwnership) {
      console.log('Teacher does not own this test');
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to delete this test' })
      };
    }

    console.log('Starting test deletion process...');

    // Begin transaction
    await sql`BEGIN`;

    try {
      // For all test types, just remove assignments
      // This makes the test invisible to students while preserving all data
      await sql`DELETE FROM test_assignments WHERE test_id = ${test_id} AND test_type = ${test_type}`;

      // Commit transaction
      await sql`COMMIT`;
      
      console.log('Test assignments removed successfully - test is now hidden from students');

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test assignments removed successfully - test is now hidden from students',
          test_type: test_type,
          test_id: test_id
        })
      };

    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error deleting test:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
