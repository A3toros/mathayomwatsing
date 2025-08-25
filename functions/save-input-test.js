const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  // Function to clean answer text according to specified rules
  function cleanAnswerText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()                           // Remove leading/trailing spaces
      .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
      .toLowerCase()                    // Convert to lowercase
      .replace(/[.,]/g, '')            // Remove dots and commas
      .replace(/-/g, ' ')              // Replace hyphens with spaces
      .replace(/\s+/g, ' ')            // Clean up any double spaces created
      .trim();                          // Final trim
  }

  try {
    const { teacher_id, test_name, num_questions, questions } = JSON.parse(event.body);

    if (!teacher_id || !test_name || !num_questions || !questions || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required: teacher_id, test_name, num_questions, questions'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Begin transaction
    await sql`BEGIN`;
    
    try {
      // Insert the test
      const testResult = await sql`
        INSERT INTO input_tests (teacher_id, test_name, num_questions)
        VALUES (${teacher_id}, ${test_name}, ${num_questions})
        RETURNING id
      `;
      
      const testId = testResult[0].id;
      
      // Insert questions with multiple answers
      for (const question of questions) {
        // Clean the question text
        const cleanedQuestion = cleanAnswerText(question.question);
        
        // Insert each answer as a separate row
        for (const answer of question.correct_answers) {
          const cleanedAnswer = cleanAnswerText(answer);
          
          await sql`
            INSERT INTO input_test_questions (
              test_id, question_id, question, correct_answer
            )
            VALUES (
              ${testId}, ${question.question_id}, ${cleanedQuestion}, ${cleanedAnswer}
            )
          `;
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Input test saved successfully',
          test_id: testId
        })
      };
    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Save input test error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save input test',
        error: error.message
      })
    };
  }
};
