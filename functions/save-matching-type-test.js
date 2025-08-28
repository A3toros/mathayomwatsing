const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== save-matching-type-test function called ===');
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
    const { teacher_id, test_name, image_url, num_blocks, questions } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      teacher_id,
      test_name,
      image_url,
      num_blocks,
      questions_count: questions ? questions.length : 0
    });

    // Debug: Log questions structure for arrows
    if (questions && questions.length > 0) {
      console.log('🔍 Questions structure for arrow debugging:');
      questions.forEach((q, index) => {
        console.log(`  Question ${index + 1}:`, {
          question_id: q.question_id,
          word: q.word,
          has_arrow: q.has_arrow,
          arrow: q.arrow,
          block_coordinates: q.block_coordinates
        });
      });
    }

    if (!teacher_id || !test_name || !image_url || !num_blocks || !questions || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required: teacher_id, test_name, image_url, num_blocks, questions'
        })
      };
    }

    if (questions.length !== num_blocks) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Number of questions must match the number of blocks'
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
      // Insert the test
      console.log('Inserting test into matching_type_tests table...');
      const testResult = await sql`
        INSERT INTO matching_type_tests (teacher_id, test_name, image_url, num_blocks)
        VALUES (${teacher_id}, ${test_name}, ${image_url}, ${num_blocks})
        RETURNING id
      `;
      
      const testId = testResult[0].id;
      console.log('Test inserted successfully with ID:', testId);
      
      // Insert questions with block coordinates
      console.log('Inserting questions into matching_type_test_questions table...');
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`Inserting question ${i + 1}:`, {
          test_id: testId,
          question_id: question.question_id,
          word: question.word,
          block_coordinates: question.block_coordinates,
          has_arrow: question.has_arrow || false
        });
        
        const questionResult = await sql`
          INSERT INTO matching_type_test_questions (
            test_id, question_id, word, block_coordinates, has_arrow
          )
          VALUES (
            ${testId}, ${question.question_id}, ${question.word}, ${JSON.stringify(question.block_coordinates)}, ${question.has_arrow || false}
          )
          RETURNING id
        `;
        
        const questionId = questionResult[0].id;
        console.log(`Question ${i + 1} inserted successfully with ID:`, questionId);
        
        // Insert arrow if it exists
        if (question.arrow && question.has_arrow) {
          console.log(`➡️ Inserting arrow for question ${i + 1}:`, question.arrow);
          console.log(`➡️ Arrow data:`, {
            questionId,
            start_x: question.arrow.start_x,
            start_y: question.arrow.start_y,
            end_x: question.arrow.end_x,
            end_y: question.arrow.end_y,
            style: question.arrow.style
          });
          
          try {
            await sql`
              INSERT INTO matching_type_test_arrows (
                question_id, start_x, start_y, end_x, end_y, arrow_style
              )
              VALUES (
                ${questionId}, 
                ${question.arrow.start_x}, 
                ${question.arrow.start_y}, 
                ${question.arrow.end_x}, 
                ${question.arrow.end_y}, 
                ${JSON.stringify(question.arrow.style || {})}
              )
            `;
            console.log(`✅ Arrow for question ${i + 1} inserted successfully`);
          } catch (arrowError) {
            console.error(`❌ Failed to insert arrow for question ${i + 1}:`, arrowError);
            console.error(`❌ Arrow data that failed:`, question.arrow);
            // Continue with other questions instead of failing the entire test
          }
        } else {
          console.log(`ℹ️ No arrow for question ${i + 1} (has_arrow: ${question.has_arrow})`);
        }
      }
      console.log('All questions and arrows inserted successfully');
      
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
          message: 'Matching type test saved successfully',
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
    console.error('Save matching type test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save matching type test',
        error: error.message
      })
    };
  }
};