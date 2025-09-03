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

        // Get questions and restructure for consistency
        const mcQuestions = await sql`
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
        
        // Restructure to consistent format with options array
        questions = mcQuestions.map(q => ({
          question_id: q.question_id,
          question: q.question,
          correct_answer: q.correct_answer,
          options: [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.option_f].filter(Boolean)
        }));
        
        console.log('Multiple choice questions restructured:', questions);
        break;

      case 'true_false':
        // Get test info
        const tfTestInfo = await sql`
          SELECT test_name, num_questions, created_at FROM true_false_tests WHERE id = ${test_id}
        `;
        if (tfTestInfo.length > 0) {
          testInfo = tfTestInfo[0];
        }

        // Get questions - no restructuring needed, already consistent
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

        // Get raw questions with multiple rows per question_id
        const rawInputQuestions = await sql`
          SELECT 
            question_id,
            question,
            correct_answer
          FROM input_test_questions 
          WHERE test_id = ${test_id}
          ORDER BY question_id
        `;
        
        // Group questions by question_id and create correct_answers arrays
        const inputGrouped = new Map();
        rawInputQuestions.forEach(row => {
          if (!inputGrouped.has(row.question_id)) {
            inputGrouped.set(row.question_id, {
              question_id: row.question_id,
              question: row.question,
              correct_answers: []
            });
          }
          inputGrouped.get(row.question_id).correct_answers.push(row.correct_answer);
        });
        
        // Convert to ordered array
        questions = Array.from(inputGrouped.values()).sort((a, b) => a.question_id - b.question_id);
        console.log('Input questions grouped:', questions);
        break;

      case 'matching_type':
        // Get test info
        const mtInfo = await sql`
          SELECT test_name, num_blocks, created_at, image_url FROM matching_type_tests WHERE id = ${test_id}
        `;
        if (mtInfo.length > 0) {
          testInfo = mtInfo[0];
        }

        // Get questions with coordinates/word and arrows
        const rows = await sql`
          SELECT 
            q.question_id, 
            q.word, 
            q.block_coordinates, 
            q.has_arrow,
            a.start_x,
            a.start_y,
            a.end_x,
            a.end_y,
            a.arrow_style
          FROM matching_type_test_questions q
          LEFT JOIN matching_type_test_arrows a ON q.question_id = a.question_id
          WHERE q.test_id = ${test_id} 
          ORDER BY q.question_id
        `;
        
        // Restructure data for frontend - create one question object with all the data
        if (rows.length > 0 && testInfo.image_url) {
          // Extract words and blocks from the questions
          const words = rows.map(r => r.word);
          const blocks = rows.map((r, index) => ({
            block_id: r.question_id,
            word: r.word,
            x: r.block_coordinates.x,
            y: r.block_coordinates.y
          }));
          
          // Extract arrows data
          const arrows = rows
            .filter(r => r.start_x !== null && r.start_y !== null && r.end_x !== null && r.end_y !== null)
            .map((r, index) => ({
              id: index + 1,
              question_id: r.question_id,
              block_id: r.question_id,
              start_x: r.start_x,
              start_y: r.start_y,
              end_x: r.end_x,
              end_y: r.end_y,
              style: r.arrow_style || { color: '#dc3545', thickness: 3 }
            }));
          
          // Create a single question object with all the data
          questions = [{
            question_id: 1,
            image_url: testInfo.image_url,
            words: words,
            blocks: blocks,
            arrows: arrows
          }];
        } else {
          questions = [];
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
