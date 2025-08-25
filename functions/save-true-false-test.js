const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { teacher_id, test_name, num_questions, questions } = JSON.parse(event.body);

    // Validate input
    if (!teacher_id || !test_name || !num_questions || !questions) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (num_questions < 1 || num_questions > 100) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Number of questions must be between 1 and 100' })
      };
    }

    if (questions.length !== num_questions) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Number of questions does not match the provided questions array' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Begin transaction
    await sql`BEGIN`;

    try {
      // Insert the test
      const testResult = await sql`
        INSERT INTO true_false_tests (teacher_id, test_name, num_questions) 
        VALUES (${teacher_id}, ${test_name}, ${num_questions}) 
        RETURNING id
      `;
      
      const testId = testResult[0].id;

      // Insert each question
      for (const question of questions) {
        await sql`
          INSERT INTO true_false_test_questions (test_id, question_id, question, correct_answer) 
          VALUES (${testId}, ${question.question_id}, ${question.question}, ${question.correct_answer})
        `;
      }

      // Commit transaction
      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: 'True-false test saved successfully',
          test_id: testId
        })
      };

    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error saving true-false test:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
