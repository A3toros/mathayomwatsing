const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== save-multiple-choice-test function called ===');
  console.log('Event:', event);
  console.log('Event body:', event.body);
  
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

  try {
    const { teacher_id, test_name, num_questions, num_options, questions } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      teacher_id,
      test_name,
      num_questions,
      num_options,
      questions_count: questions ? questions.length : 0
    });

    if (!teacher_id || !test_name || !num_questions || !num_options || !questions || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required: teacher_id, test_name, num_questions, num_options, questions'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Begin transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started successfully');
    
    try {
      // Insert the test with the selected number of options
      console.log('Inserting test into multiple_choice_tests table...');
      const testResult = await sql`
        INSERT INTO multiple_choice_tests (teacher_id, test_name, num_questions, num_options)
        VALUES (${teacher_id}, ${test_name}, ${num_questions}, ${num_options})
        RETURNING id
      `;
      
      const testId = testResult[0].id;
      console.log('Test inserted successfully with ID:', testId);
      
      // Insert questions
      console.log('Inserting questions into multiple_choice_test_questions table...');
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`Inserting question ${i + 1}:`, {
          test_id: testId,
          question_id: question.question_id,
          question: question.question,
          correct_answer: question.correct_answer,
          options: question.options
        });
        
        await sql`
          INSERT INTO multiple_choice_test_questions (
            test_id, question_id, question, correct_answer,
            option_a, option_b, option_c, option_d, option_e, option_f
          )
          VALUES (
            ${testId}, ${question.question_id}, ${question.question}, ${question.correct_answer},
            ${question.options.option_a || null}, ${question.options.option_b || null},
            ${question.options.option_c || null}, ${question.options.option_d || null},
            ${question.options.option_e || null}, ${question.options.option_f || null}
          )
        `;
        console.log(`Question ${i + 1} inserted successfully`);
      }
      console.log('All questions inserted successfully');
      
      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Multiple choice test saved successfully',
          test_id: testId
        })
      };
    } catch (error) {
      // Rollback transaction on error
      console.error('Error during database operations, rolling back transaction...');
      console.error('Error details:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
  } catch (error) {
    console.error('Save multiple choice test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save multiple choice test',
        error: error.message
      })
    };
  }
};
