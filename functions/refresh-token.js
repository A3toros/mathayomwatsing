const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Enable CORS with Authorization header support
  const headers = {
    'Access-Control-Allow-Origin': 'https://yourdomain.com',
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
    // Extract refresh token from cookies
    const cookies = event.headers.cookie || event.headers.Cookie || '';
    const refreshTokenMatch = cookies.match(/refreshToken=([^;]+)/);
    
    if (!refreshTokenMatch) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Refresh token not found'
        })
      };
    }

    const refreshToken = refreshTokenMatch[1];

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid refresh token'
        })
      };
    }

    // Check if token is a refresh token
    if (decoded.type !== 'refresh') {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid token type'
        })
      };
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: decoded.sub,
        role: decoded.role,
        name: decoded.name,
        surname: decoded.surname,
        nickname: decoded.nickname,
        grade: decoded.grade,
        class: decoded.class,
        number: decoded.number,
        username: decoded.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
        role: decoded.role
      })
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      })
    };
  }
};
