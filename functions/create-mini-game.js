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
    const { subject_id, grade, class: classNum, topic, game_type, game_name } = body;

    // Validation
    if (!subject_id || !grade || !game_name) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: subject_id, grade, game_name' 
        })
      };
    }

    // Use class from body or default to 0 (all classes)
    const finalClass = classNum !== undefined ? classNum : 0;

    if (grade < 7 || grade > 12) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'Grade must be between 7 and 12' 
        })
      };
    }

    // Create game (no teacher access check - teachers can create games for any subject/grade)
    const result = await sql`
      INSERT INTO mini_games (
        teacher_id,
        subject_id,
        grade,
        class,
        topic,
        game_type,
        game_name,
        is_active
      )
      VALUES (
        ${userInfo.teacher_id},
        ${subject_id},
        ${grade},
        ${finalClass},
        ${topic || null},
        ${game_type || 'spell_duel'},
        ${game_name},
        true
      )
      RETURNING id, teacher_id, subject_id, grade, class, topic, game_type, game_name, is_active, created_at
    `;

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
    console.error('Error creating mini game:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create mini game',
        message: error.message
      })
    };
  }
};

