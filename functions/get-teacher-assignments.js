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
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: result.error
        })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Teacher or admin role required.'
        })
      };
    }

    // Handle admin vs regular teacher
    let teacher_id;
    if (userInfo.role === 'admin') {
      // Admin can access all assignments - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacher_id = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacher_id = userInfo.teacher_id;
    }

    console.log('get-teacher-assignments called with teacher_id:', teacher_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get all grades and classes where this teacher has subjects assigned
    let assignments;
    if (userInfo.role === 'admin' && teacher_id === null) {
      // Admin gets all grades/classes from all teachers
      assignments = await sql`
        SELECT DISTINCT ts.grade, ts.class, ts.teacher_id
        FROM teacher_subjects ts
      `;
    } else {
      // Teacher gets only their grades/classes
      assignments = await sql`
        SELECT DISTINCT ts.grade, ts.class
        FROM teacher_subjects ts
        WHERE ts.teacher_id = ${teacher_id}
      `;
    }
    
    console.log('Raw assignments from DB:', assignments);
    
    // Transform the data to match the frontend expectations
    const transformedAssignments = assignments.map(assignment => ({
      grade: assignment.grade,           // "1", "2", "3"
      class: assignment.class,           // "15", "16"
      gradeDisplay: `M${assignment.grade}`,  // "M1", "M2", "M3"
      classDisplay: `${assignment.grade}/${assignment.class}`  // "1/15", "2/16"
    }));
    
    console.log('Transformed assignments:', transformedAssignments);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        assignments: transformedAssignments
      })
    };
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve teacher assignments',
        error: error.message
      })
    };
  }
};
