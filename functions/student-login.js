const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Enable CORS with Authorization header support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { studentId, password } = JSON.parse(event.body);

    if (!studentId || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student ID and password are required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for the student
    const students = await sql`
      SELECT student_id, name, surname, nickname, grade, class, number, password
      FROM users 
      WHERE student_id = ${studentId} AND password = ${password}
    `;

    if (students.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid student ID or password'
        })
      };
    }

    const student = students[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: student.student_id,
        role: 'student',
        name: student.name,
        surname: student.surname,
        nickname: student.nickname,
        grade: student.grade,
        class: student.class,
        number: student.number
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: student.student_id,
        role: 'student',
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        role: 'student',
        accessToken: accessToken,
        refreshToken: refreshToken,
        student: {
          student_id: student.student_id,
          name: student.name,
          surname: student.surname,
          nickname: student.nickname,
          grade: student.grade,
          class: student.class,
          number: student.number
        }
      })
    };
  } catch (error) {
    console.error('Student login error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Login failed',
        error: error.message
      })
    };
  }
};
