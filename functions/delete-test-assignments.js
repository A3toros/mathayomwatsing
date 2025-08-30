const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    console.log('=== DELETE TEST ASSIGNMENTS FUNCTION STARTED ===');
    console.log('Event method:', event.httpMethod);
    console.log('Event body:', event.body);
    
    const { startDate, endDate, teacherId, grades, classes, subjectId } = JSON.parse(event.body);
    console.log('Parsed request data:', { startDate, endDate, teacherId, grades, classes, subjectId });

    if (!startDate || !endDate || !teacherId) {
      console.log('Validation failed: missing required fields');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Start date, end date, and teacher ID are required' 
        })
      };
    }

    // Check if database URL is available
    if (!process.env.NEON_DATABASE_URL) {
      console.error('NEON_DATABASE_URL environment variable is not set');
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Database configuration error',
          error: 'NEON_DATABASE_URL not configured'
        })
      };
    }

    console.log('Database URL available, length:', process.env.NEON_DATABASE_URL.length);
    console.log('Initializing database connection...');
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection initialized');

    // Test database connection
    try {
      console.log('Testing database connection...');
      const testResult = await sql`SELECT 1 as test`;
      console.log('Database connection test successful:', testResult);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Database connection failed',
          error: dbError.message,
          stack: dbError.stack
        })
      };
    }

    console.log('Executing query with neon template literals...');
    const result = await sql`
      DELETE FROM test_assignments ta
      WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
      AND (
        (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
        OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
        OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
        OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
      )
      ${grades && grades.length > 0 ? sql`AND ta.grade = ANY(${grades})` : sql``}
      ${classes && classes.length > 0 ? sql`AND ta.class = ANY(${classes})` : sql``}
      ${subjectId ? sql`AND ta.subject_id = ${subjectId}` : sql``}
    `;
    console.log(`Deleted ${result.rowCount} test assignments`);
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Deleted ${result.rowCount} test assignments`,
        deletedCount: result.rowCount
      })
    };
  } catch (error) {
    console.error('Delete test assignments error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete test assignments',
        error: error.message,
        errorType: error.name,
        stack: error.stack
      })
    };
  }
};
