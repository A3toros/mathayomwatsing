const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { teacher_id, test_name, image_url, num_blocks, questions } = JSON.parse(event.body || '{}');

    if (!teacher_id || !test_name || !image_url || !num_blocks || !questions || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Missing required fields' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    await sql`BEGIN`;
    try {
      // Insert main test row
      const testRes = await sql`
        INSERT INTO matching_type_tests (teacher_id, test_name, image_url, num_blocks)
        VALUES (${teacher_id}, ${test_name}, ${image_url}, ${num_blocks})
        RETURNING id
      `;
      const testId = testRes[0].id;

      // Insert question rows and optional arrows
      for (const q of questions) {
        const hasArrow = !!q.has_arrow;
        const blockCoords = q.block_coordinates || { x: 0, y: 0, width: 0, height: 0 };

        const questionRes = await sql`
          INSERT INTO matching_type_test_questions (test_id, question_id, word, block_coordinates, has_arrow)
          VALUES (${testId}, ${q.question_id}, ${q.word || ''}, ${blockCoords}, ${hasArrow})
          RETURNING id
        `;
        const questionRowId = questionRes[0].id;

        if (hasArrow && q.arrow) {
          await sql`
            INSERT INTO matching_type_test_arrows (question_id, start_x, start_y, end_x, end_y, arrow_style)
            VALUES (${questionRowId}, ${q.arrow.start_x}, ${q.arrow.start_y}, ${q.arrow.end_x}, ${q.arrow.end_y}, ${q.arrow.style || {}})
          `;
        }
      }

      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, test_id: testId })
      };
    } catch (err) {
      await sql`ROLLBACK`;
      throw err;
    }
  } catch (error) {
    console.error('Error saving matching test:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Failed to save matching test', error: error.message })
    };
  }
};


