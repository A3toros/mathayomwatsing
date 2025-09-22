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
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Access denied. Teacher or admin role required.' })
      };
    }

    // Handle admin vs regular teacher
    let teacherId;
    if (userInfo.role === 'admin') {
      // Admin can access all grades/classes - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacherId = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacherId = userInfo.teacher_id;
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for teacher's grades and classes with subject names
    let teacherGradesClasses;
    if (userInfo.role === 'admin' && teacherId === null) {
      // Admin gets all grades/classes from all teachers
      teacherGradesClasses = await sql`
        SELECT DISTINCT ts.grade, ts.class, ts.subject_id, ts.teacher_id, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        ORDER BY ts.grade, ts.class
      `;
    } else {
      // Teacher gets only their grades/classes
      teacherGradesClasses = await sql`
        SELECT DISTINCT ts.grade, ts.class, ts.subject_id, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        WHERE ts.teacher_id = ${teacherId} 
        ORDER BY ts.grade, ts.class
      `;
    }
    
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
