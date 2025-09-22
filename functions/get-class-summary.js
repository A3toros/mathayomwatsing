const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: result.error })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher or admin role required.' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const { teacher_id, grade, class: className, academic_period_id } = event.queryStringParameters;
    
    // Validate required parameters
    if (!teacher_id || !grade || !className || !academic_period_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters: teacher_id, grade, class, academic_period_id' })
      };
    }

    // Handle admin vs regular teacher
    let actualTeacherId;
    if (userInfo.role === 'admin') {
      // Admin can access any teacher's data if teacher_id is provided
      actualTeacherId = teacher_id || userInfo.teacher_id;
    } else {
      // Regular teacher uses their own ID
      actualTeacherId = userInfo.teacher_id;
    }

    if (!actualTeacherId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    const summary = await sql`
      SELECT * FROM class_summary_view 
      WHERE teacher_id = ${actualTeacherId}
      AND grade = ${parseInt(grade)}
      AND class = ${parseInt(className)}
      AND academic_period_id = ${academic_period_id}
    `;
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        summary: summary[0] || null 
      })
    };
  } catch (error) {
    console.error('Error fetching class summary:', error);
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
