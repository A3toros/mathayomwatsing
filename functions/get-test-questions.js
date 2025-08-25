const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== get-test-questions function called ===');
  console.log('Event:', event);
  console.log('Query params:', event.queryStringParameters);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { test_type, test_id } = event.queryStringParameters || {};
    
    console.log('Extracted params - test_type:', test_type, 'test_id:', test_id);

    if (!test_type || !test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test type and test ID are required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    let questions = [];
    let testInfo = {};

    switch (test_type) {
      case 'multiple_choice':
        console.log('Processing multiple choice test...');
        // Get test info
        const mcTestInfo = await sql`
          SELECT test_name, num_questions, num_options, created_at FROM multiple_choice_tests WHERE id = ${test_id}
        `;
        console.log('Multiple choice test info query result:', mcTestInfo);
        if (mcTestInfo.length > 0) {
          testInfo = mcTestInfo[0];
        }

        // Get questions
        questions = await sql`
          SELECT 
            question_id,
            question,
            correct_answer,
            option_a,
            option_b,
            option_c,
            option_d,
            option_e,
            option_f
          FROM multiple_choice_test_questions 
          WHERE test_id = ${test_id}
          ORDER BY question_id
        `;
        console.log('Multiple choice questions query result:', questions);
        break;

      case 'true_false':
        // Get test info
        const tfTestInfo = await sql`
          SELECT test_name, num_questions, created_at FROM true_false_tests WHERE id = ${test_id}
        `;
        if (tfTestInfo.length > 0) {
          testInfo = tfTestInfo[0];
        }

        // Get questions
        questions = await sql`
          SELECT 
            question_id,
            question,
            correct_answer
          FROM true_false_test_questions 
          WHERE test_id = ${test_id}
          ORDER BY question_id
        `;
        break;

      case 'input':
        // Get test info
        const inputTestInfo = await sql`
          SELECT test_name, num_questions, created_at FROM input_tests WHERE id = ${test_id}
        `;
        if (inputTestInfo.length > 0) {
          testInfo = inputTestInfo[0];
        }

        // Get questions
        questions = await sql`
          SELECT 
            question_id,
            question,
            correct_answer
          FROM input_test_questions 
          WHERE test_id = ${test_id}
          ORDER BY question_id
        `;
        break;

      case 'matching_type':
        // Get test info
        const mtInfo = await sql`
          SELECT test_name, num_blocks, created_at, image_url FROM matching_type_tests WHERE id = ${test_id}
        `;
        if (mtInfo.length > 0) {
          testInfo = mtInfo[0];
        }

        // Get questions with coordinates/word
        const rows = await sql`
          SELECT question_id, word, block_coordinates, has_arrow FROM matching_type_test_questions WHERE test_id = ${test_id} ORDER BY question_id
        `;
        // For each question, attach arrow if exists
        questions = [];
        for (const r of rows) {
          const q = {
            question_id: r.question_id,
            word: r.word,
            block_coordinates: r.block_coordinates,
            has_arrow: r.has_arrow,
          };
          if (r.has_arrow) {
            const arr = await sql`
              SELECT start_x, start_y, end_x, end_y, arrow_style FROM matching_type_test_arrows
              WHERE question_id = (SELECT id FROM matching_type_test_questions WHERE test_id = ${test_id} AND question_id = ${r.question_id} LIMIT 1)
              LIMIT 1
            `;
            if (arr.length > 0) {
              q.arrow = {
                start_x: arr[0].start_x,
                start_y: arr[0].start_y,
                end_x: arr[0].end_x,
                end_y: arr[0].end_y,
                style: arr[0].arrow_style || {}
              };
            }
          }
          questions.push(q);
        }
        break;

      default:
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid test type' })
        };
    }

    console.log('Final response data:');
    console.log('- testInfo:', testInfo);
    console.log('- questions count:', questions.length);
    console.log('- test_type:', test_type);
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        test_info: testInfo,
        questions: questions,
        test_type: test_type
      })
    };

  } catch (error) {
    console.error('Error getting test questions:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
