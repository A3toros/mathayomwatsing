const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Access denied. Teacher role required.' })
      };
    }

    const body = JSON.parse(event.body) || {};
    const { game_id } = body;

    if (!game_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'game_id is required' 
        })
      };
    }

    // Verify teacher owns this game
    const gameCheck = await sql`
      SELECT id, teacher_id FROM mini_games
      WHERE id = ${game_id}
    `;

    if (gameCheck.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Game not found' 
        })
      };
    }

    if (gameCheck[0].teacher_id !== userInfo.teacher_id) {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Access denied. You do not own this game.' 
        })
      };
    }

    // Generate unique session code
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create session in database
    const result = await sql`
      INSERT INTO mini_game_sessions (game_id, teacher_id, session_code, status)
      VALUES (${game_id}, ${userInfo.teacher_id}, ${sessionCode}, 'waiting')
      RETURNING id, session_code, created_at
    `;

    const session = result[0];

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        session: {
          id: session.id,
          session_code: session.session_code,
          created_at: session.created_at
        }
      })
    };
  } catch (error) {
    console.error('Error creating game session:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create game session',
        message: error.message
      })
    };
  }
};

