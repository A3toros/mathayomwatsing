const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
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

    // Get game_id from query parameters
    const { game_id } = event.queryStringParameters || {};

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
      WHERE id = ${parseInt(game_id)}
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

    // Check if there are active sessions for this game
    const activeSessions = await sql`
      SELECT id FROM mini_game_sessions
      WHERE game_id = ${parseInt(game_id)}
        AND status IN ('waiting', 'active')
    `;

    if (activeSessions.length > 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Cannot delete game with active sessions. Please end all sessions first.' 
        })
      };
    }

    // Delete game (cascade will delete questions automatically)
    await sql`
      DELETE FROM mini_games
      WHERE id = ${parseInt(game_id)}
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Game deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting mini game:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete mini game',
        message: error.message
      })
    };
  }
};

