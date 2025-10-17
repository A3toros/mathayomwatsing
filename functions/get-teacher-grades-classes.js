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

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "grade,class")
    let cursorGrade, cursorClass;
    if (cursor) {
      const [gradeStr, classStr] = cursor.split(',');
      cursorGrade = parseInt(gradeStr);
      cursorClass = parseInt(classStr);
    }
    
    // Use optimized view for teacher grades and classes with keyset pagination
    let teacherGradesClasses;
    if (userInfo.role === 'admin' && teacherId === null) {
      // Admin gets all grades/classes from all teachers
      if (cursor) {
        teacherGradesClasses = await sql`
          SELECT DISTINCT grade, class, subject_id, teacher_id, subject_name
          FROM teacher_classes_summary_view
          WHERE (grade, class) > (${cursorGrade}, ${cursorClass})
          ORDER BY grade, class
          LIMIT ${limit}
        `;
      } else {
        teacherGradesClasses = await sql`
          SELECT DISTINCT grade, class, subject_id, teacher_id, subject_name
          FROM teacher_classes_summary_view
          ORDER BY grade, class
          LIMIT ${limit}
        `;
      }
    } else {
      // Teacher gets only their grades/classes
      if (cursor) {
        teacherGradesClasses = await sql`
          SELECT DISTINCT grade, class, subject_id, subject_name
          FROM teacher_classes_summary_view
          WHERE teacher_id = ${teacherId}
            AND (grade, class) > (${cursorGrade}, ${cursorClass})
          ORDER BY grade, class
          LIMIT ${limit}
        `;
      } else {
        teacherGradesClasses = await sql`
          SELECT DISTINCT grade, class, subject_id, subject_name
          FROM teacher_classes_summary_view
          WHERE teacher_id = ${teacherId} 
          ORDER BY grade, class
          LIMIT ${limit}
        `;
      }
    }
    
    // Generate next cursor for pagination
    let nextCursor = null;
    if (teacherGradesClasses.length === limit && teacherGradesClasses.length > 0) {
      const lastItem = teacherGradesClasses[teacherGradesClasses.length - 1];
      nextCursor = `${lastItem.grade},${lastItem.class}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ data: teacherGradesClasses });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: { 
        ...headers, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 minutes + 10 minute stale
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({
        success: true,
        data: teacherGradesClasses,
        pagination: {
          limit,
          has_more: teacherGradesClasses.length === limit,
          next_cursor: nextCursor
        }
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
