const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Username and password are required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for the teacher
    const teachers = await sql`
      SELECT teacher_id, username
      FROM teachers 
      WHERE username = ${username} AND password = ${password}
    `;

    if (teachers.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid username or password'
        })
      };
    }

    const teacher = teachers[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: teacher.teacher_id,
        role: 'teacher',
        username: teacher.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: teacher.teacher_id,
        role: 'teacher',
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set refresh token as httpOnly cookie
    const cookieHeader = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800; Domain=${process.env.COOKIE_DOMAIN}`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader
      },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        role: 'teacher',
        accessToken: accessToken,
        teacher: {
          teacher_id: teacher.teacher_id,
          username: teacher.username
        }
      })
    };
  } catch (error) {
    console.error('Teacher login error:', error);
    
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
