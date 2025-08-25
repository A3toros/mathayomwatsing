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
    const { teacher_id } = event.queryStringParameters || {};

    if (!teacher_id) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Teacher ID is required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for teacher subjects
    const teacherSubjects = await sql`
      SELECT ts.subject_id, ts.grade, ts.class, s.subject
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.subject_id
      WHERE ts.teacher_id = ${teacher_id}
      ORDER BY s.subject, ts.grade, ts.class
    `;

    // Group subjects by subject_id
    const subjectsMap = new Map();
    teacherSubjects.forEach(row => {
      if (!subjectsMap.has(row.subject_id)) {
        subjectsMap.set(row.subject_id, {
          subject_id: row.subject_id,
          subject: row.subject,
          classes: []
        });
      }
      subjectsMap.get(row.subject_id).classes.push({
        grade: row.grade,
        class: row.class
      });
    });

    const subjects = Array.from(subjectsMap.values());

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
    console.error('Get teacher subjects error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve teacher subjects',
        error: error.message
      })
    };
  }
};
