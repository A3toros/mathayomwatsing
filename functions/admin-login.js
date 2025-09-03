const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
    
    // Query the database for the admin
    const admins = await sql`
      SELECT username
      FROM admin 
      WHERE username = ${username} AND password = ${password}
    `;

    if (admins.length === 0) {
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

    const admin = admins[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: admin.username, // Using username as admin ID
        role: 'admin',
        username: admin.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: admin.username,
        role: 'admin',
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
        role: 'admin',
        accessToken: accessToken,
        admin: {
          username: admin.username
        }
      })
    };
  } catch (error) {
    console.error('Admin login error:', error);
    
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
