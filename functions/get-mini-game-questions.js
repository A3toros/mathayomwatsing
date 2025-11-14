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

    // For teachers: verify ownership
    if (userInfo.role === 'teacher') {
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
    }

    // For students: verify they have access to this class
    if (userInfo.role === 'student') {
      const gameCheck = await sql`
        SELECT mg.id, mg.grade, mg.class, mg.subject_id
        FROM mini_games mg
        WHERE mg.id = ${parseInt(game_id)}
          AND mg.is_active = true
      `;

      if (gameCheck.length === 0) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: 'Game not found or not active' 
          })
        };
      }

      const game = gameCheck[0];
      if (game.grade !== userInfo.grade || game.class !== userInfo.class) {
        return {
          statusCode: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: 'Access denied. You do not have access to this game.' 
          })
        };
      }
    }

    // Get questions (without correct_answer for students)
    const questions = await sql`
      SELECT 
        id,
        game_id,
        question_id,
        question_text,
        question_image_url,
        option_a,
        option_b,
        option_c,
        option_d,
        ${userInfo.role === 'teacher' ? sql`correct_answer` : sql`NULL as correct_answer`},
        created_at
      FROM mini_game_questions
      WHERE game_id = ${parseInt(game_id)}
      ORDER BY question_id ASC
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        questions: questions,
        count: questions.length
      })
    };
  } catch (error) {
    console.error('Error getting mini game questions:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get questions',
        message: error.message
      })
    };
  }
};

