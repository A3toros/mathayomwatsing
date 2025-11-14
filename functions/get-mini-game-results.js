const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
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
    
    // Get query parameters
    const { session_id, game_id, student_id } = event.queryStringParameters || {};

    // Teachers can view all results for their games
    if (userInfo.role === 'teacher') {
      let query = sql`
        SELECT 
          mgr.id,
          mgr.session_id,
          mgr.game_id,
          mg.game_name,
          mgr.student_id,
          mgr.name,
          mgr.surname,
          mgr.nickname,
          mgr.grade,
          mgr.class,
          mgr.number,
          mgr.correct_cards,
          mgr.xp_earned,
          mgr.damage_dealt,
          mgr.damage_received,
          mgr.final_place,
          mgr.final_hp,
          mgr.joined_at,
          mgr.completed_at,
          mgr.created_at,
          mgs.session_code,
          mgs.status as session_status
        FROM mini_game_results mgr
        LEFT JOIN mini_games mg ON mgr.game_id = mg.id
        LEFT JOIN mini_game_sessions mgs ON mgr.session_id = mgs.id
        WHERE mg.teacher_id = ${userInfo.teacher_id}
      `;

      if (session_id) {
        query = sql`${query} AND mgr.session_id = ${parseInt(session_id)}`;
      }

      if (game_id) {
        query = sql`${query} AND mgr.game_id = ${parseInt(game_id)}`;
      }

      query = sql`
        ${query}
        ORDER BY 
          mgr.final_place ASC NULLS LAST,
          mgr.damage_dealt DESC,
          mgr.correct_cards DESC
      `;

      const results = await query;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          results: results,
          count: results.length
        })
      };
    }

    // Students can only view their own results
    if (userInfo.role === 'student') {
      let query = sql`
        SELECT 
          mgr.id,
          mgr.session_id,
          mgr.game_id,
          mg.game_name,
          mgr.student_id,
          mgr.name,
          mgr.surname,
          mgr.nickname,
          mgr.grade,
          mgr.class,
          mgr.number,
          mgr.correct_cards,
          mgr.xp_earned,
          mgr.damage_dealt,
          mgr.damage_received,
          mgr.final_place,
          mgr.final_hp,
          mgr.joined_at,
          mgr.completed_at,
          mgr.created_at,
          mgs.session_code
        FROM mini_game_results mgr
        LEFT JOIN mini_games mg ON mgr.game_id = mg.id
        LEFT JOIN mini_game_sessions mgs ON mgr.session_id = mgs.id
        WHERE mgr.student_id = ${userInfo.student_id}
      `;

      if (session_id) {
        query = sql`${query} AND mgr.session_id = ${parseInt(session_id)}`;
      }

      if (game_id) {
        query = sql`${query} AND mgr.game_id = ${parseInt(game_id)}`;
      }

      query = sql`
        ${query}
        ORDER BY mgr.created_at DESC
      `;

      const results = await query;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          results: results,
          count: results.length
        })
      };
    }

    return {
      statusCode: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Access denied'
      })
    };
  } catch (error) {
    console.error('Error getting mini game results:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get results',
        message: error.message
      })
    };
  }
};

