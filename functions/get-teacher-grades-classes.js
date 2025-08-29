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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { teacherId } = event.queryStringParameters || {};
    
    if (!teacherId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Teacher ID is required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for teacher's grades and classes
    const teacherGradesClasses = await sql`
      SELECT DISTINCT grade, class, subject_id 
      FROM teacher_subjects 
      WHERE teacher_id = ${teacherId} 
      ORDER BY grade, class
    `;
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: teacherGradesClasses
      })
    };
  } catch (error) {
    console.error('Get teacher grades/classes error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve teacher grades and classes',
        error: error.message
      })
    };
  }
};
