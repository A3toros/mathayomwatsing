const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

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
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Access denied. Teacher role required.' })
      };
    }

    // Get query parameters for filtering
    const qs = event.queryStringParameters || {};
    const grade = qs.grade ? parseInt(qs.grade, 10) : null;
    const classNum = qs.class ? parseInt(qs.class, 10) : null;
    const subject_id = qs.subject_id ? parseInt(qs.subject_id, 10) : null;
    const game_type = qs.game_type || null;
    const is_active = qs.is_active !== undefined ? qs.is_active === 'true' : null;

    console.log('Query parameters:', { grade, classNum, subject_id, game_type, is_active });

    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Build query - simple query without filters for now (like get-student-test-results pattern)
    const games = await sql`
      SELECT 
        mg.id,
        mg.teacher_id,
        mg.subject_id,
        mg.grade,
        mg.class,
        mg.topic,
        mg.game_type,
        mg.game_name,
        mg.is_active,
        mg.created_at,
        mg.updated_at,
        COUNT(DISTINCT mgq.id) as question_count
      FROM mini_games mg
      LEFT JOIN mini_game_questions mgq ON mg.id = mgq.game_id
      WHERE mg.teacher_id = ${userInfo.teacher_id}
      GROUP BY 
        mg.id,
        mg.teacher_id,
        mg.subject_id,
        mg.grade,
        mg.class,
        mg.topic,
        mg.game_type,
        mg.game_name,
        mg.is_active,
        mg.created_at,
        mg.updated_at
      ORDER BY mg.created_at DESC
    `;

    console.log('Games query successful, found:', games.length, 'games');

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        games: games
      })
    };
  } catch (error) {
    console.error('Error getting mini games:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get mini games',
        message: error.message
      })
    };
  }
};

