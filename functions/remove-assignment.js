const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== remove-assignment function called ===');
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
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin or teacher
    if (userInfo.role !== 'admin' && userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin or teacher role required.' })
      };
    }

    const { teacher_id, assignment_id, test_type, test_id } = JSON.parse(event.body) || {};
    
    console.log('Extracted params - teacher_id:', teacher_id, 'assignment_id:', assignment_id, 'test_type:', test_type, 'test_id:', test_id);

    if (!teacher_id || !assignment_id || !test_type || !test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID, assignment ID, test type, and test ID are required' })
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

      case 'matching_type':
        const matchingTest = await sql`
          SELECT id FROM matching_type_tests 
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
        testOwnership = matchingTest.length > 0;
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
        body: JSON.stringify({ error: 'You do not have permission to modify this test' })
      };
    }

    // Verify the assignment exists and belongs to this test
    const assignment = await sql`
      SELECT id, grade, class FROM test_assignments 
      WHERE id = ${assignment_id} AND test_id = ${test_id} AND test_type = ${test_type}
    `;

    if (assignment.length === 0) {
      console.log('Assignment not found or does not belong to this test');
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Assignment not found' })
      };
    }

    console.log('Starting assignment removal process...');

    // Begin transaction
    await sql`BEGIN`;

    try {
      // Remove the specific assignment
      // OLD: await sql`DELETE FROM test_assignments WHERE id = ${assignment_id}`;
      
      // NEW: Hide the test by updating assigned_at to expired date
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 8); // 8 days ago to ensure expired
      
      await sql`
        UPDATE test_assignments 
        SET assigned_at = ${expiredDate.toISOString()}
        WHERE id = ${assignment_id}
      `;

      // Commit transaction
      await sql`COMMIT`;
      
      console.log('Test hidden successfully');

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test hidden successfully - students can no longer see this test',
          assignment_id: assignment_id,
          test_type: test_type,
          test_id: test_id,
          grade: assignment[0].grade,
          class: assignment[0].class
        })
      };

    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error removing assignment:', error);
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
