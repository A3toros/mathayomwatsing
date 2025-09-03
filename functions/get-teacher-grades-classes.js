const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

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
    // Validate JWT token and extract teacher information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: result.error })
      };
    }

    const userInfo = result.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Access denied. Teacher role required.' })
      };
    }

    const teacherId = userInfo.teacher_id;

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
