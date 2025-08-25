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
    const { student_id } = event.queryStringParameters || {};

    if (!student_id) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student ID is required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get student info
    const students = await sql`
      SELECT grade, class
      FROM users 
      WHERE student_id = ${student_id}
    `;

    if (students.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student not found'
        })
      };
    }

    const student = students[0];
    
    // Get subjects assigned to teachers for this student's grade and class
    const subjects = await sql`
      SELECT DISTINCT s.subject_id, s.subject
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.subject_id
      WHERE ts.grade = ${student.grade} AND ts.class = ${student.class}
      ORDER BY s.subject
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        subjects: subjects
      })
    };
  } catch (error) {
    console.error('Get student subjects error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve student subjects',
        error: error.message
      })
    };
  }
};
