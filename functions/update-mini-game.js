const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
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
    const { game_id, game_name, topic, is_active } = body;

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

    // Build update query using template literals
    let updateQuery = sql`
      UPDATE mini_games
      SET updated_at = CURRENT_TIMESTAMP
    `;

    if (game_name !== undefined) {
      updateQuery = sql`
        UPDATE mini_games
        SET game_name = ${game_name}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${game_id}
      `;
    }

    if (topic !== undefined) {
      updateQuery = sql`
        UPDATE mini_games
        SET topic = ${topic}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${game_id}
      `;
    }

    if (is_active !== undefined) {
      updateQuery = sql`
        UPDATE mini_games
        SET is_active = ${is_active}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${game_id}
      `;
    }

    // Handle multiple updates
    if (game_name !== undefined || topic !== undefined || is_active !== undefined) {
      const setParts = [];
      if (game_name !== undefined) setParts.push(sql`game_name = ${game_name}`);
      if (topic !== undefined) setParts.push(sql`topic = ${topic}`);
      if (is_active !== undefined) setParts.push(sql`is_active = ${is_active}`);
      setParts.push(sql`updated_at = CURRENT_TIMESTAMP`);

      // Build final query
      updateQuery = sql`
        UPDATE mini_games
        SET ${sql.join(setParts, sql`, `)}
        WHERE id = ${game_id}
        RETURNING id, teacher_id, subject_id, grade, class, topic, game_type, game_name, is_active, created_at, updated_at
      `;
    } else {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'No fields to update' 
        })
      };
    }

    const result = await updateQuery;
    const game = result[0];

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        game: game
      })
    };
  } catch (error) {
    console.error('Error updating mini game:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update mini game',
        message: error.message
      })
    };
  }
};

