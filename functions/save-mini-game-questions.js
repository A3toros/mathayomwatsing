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
    const { game_id, questions } = body;

    if (!game_id || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'game_id and questions array are required' 
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

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_id || !q.option_a || !q.option_b || !q.correct_answer) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: `Question ${i + 1} is missing required fields: question_id, option_a, option_b, correct_answer` 
          })
        };
      }

      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: `Question ${i + 1} has invalid correct_answer. Must be A, B, C, or D.` 
          })
        };
      }

      // If correct_answer is C or D, ensure option_c or option_d exists
      if ((q.correct_answer === 'C' || q.correct_answer === 'D') && !q.option_c) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: `Question ${i + 1} has correct_answer ${q.correct_answer} but option_c is missing` 
          })
        };
      }

      if (q.correct_answer === 'D' && !q.option_d) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            error: `Question ${i + 1} has correct_answer D but option_d is missing` 
          })
        };
      }
    }

    // Delete existing questions for this game
    await sql`
      DELETE FROM mini_game_questions
      WHERE game_id = ${game_id}
    `;

    // Insert new questions
    const insertedQuestions = [];
    for (const q of questions) {
      const result = await sql`
        INSERT INTO mini_game_questions (
          game_id,
          question_id,
          question_text,
          question_image_url,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer
        )
        VALUES (
          ${game_id},
          ${q.question_id},
          ${q.question_text || null},
          ${q.question_image_url || null},
          ${q.option_a},
          ${q.option_b},
          ${q.option_c || null},
          ${q.option_d || null},
          ${q.correct_answer}
        )
        RETURNING id, game_id, question_id, question_text, question_image_url, 
                  option_a, option_b, option_c, option_d, correct_answer, created_at
      `;
      insertedQuestions.push(result[0]);
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        questions: insertedQuestions,
        count: insertedQuestions.length
      })
    };
  } catch (error) {
    console.error('Error saving mini game questions:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to save questions',
        message: error.message
      })
    };
  }
};

