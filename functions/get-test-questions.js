const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

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
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user has admin or student role
    if (userInfo.role !== 'admin' && userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin or student role required.' })
      };
    }

    const { test_id } = event.queryStringParameters || {};
    
    console.log('Extracted params - test_id:', test_id);

    if (!test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test ID is required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');


    let questions = [];
    let testInfo = {};
    let test_type = '';

    // Check which table contains the test_id
    const mcTest = await sql`SELECT id FROM multiple_choice_tests WHERE id = ${test_id}`;
    if (mcTest.length > 0) {
      test_type = 'multiple_choice';
      console.log('Processing multiple choice test...');
      // Get test info
      const mcTestInfo = await sql`
        SELECT test_name, num_questions, num_options, teacher_id, subject_id, created_at FROM multiple_choice_tests WHERE id = ${test_id}
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
    } else {
      const tfTest = await sql`SELECT id FROM true_false_tests WHERE id = ${test_id}`;
      if (tfTest.length > 0) {
        test_type = 'true_false';
        // Get test info
        const tfTestInfo = await sql`
          SELECT test_name, num_questions, teacher_id, subject_id, created_at FROM true_false_tests WHERE id = ${test_id}
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
      } else {
        const inputTest = await sql`SELECT id FROM input_tests WHERE id = ${test_id}`;
        if (inputTest.length > 0) {
          test_type = 'input';
          // Get test info
          const inputTestInfo = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, created_at FROM input_tests WHERE id = ${test_id}
          `;
          if (inputTestInfo.length > 0) {
            testInfo = inputTestInfo[0];
          }

          // Get questions with correct_answers array
          const inputQuestions = await sql`
            SELECT 
              question_id,
              question,
              correct_answers
            FROM input_test_questions 
            WHERE test_id = ${test_id}
            ORDER BY question_id
          `;
          
          // Process questions and ensure correct_answers is an array
          questions = inputQuestions.map(row => ({
            question_id: row.question_id,
            question: row.question,
            correct_answers: row.correct_answers || []
          }));
          console.log('Input questions grouped:', questions);
        } else {
          const matchingTest = await sql`SELECT id FROM matching_type_tests WHERE id = ${test_id}`;
          if (matchingTest.length > 0) {
            test_type = 'matching_type';
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
              const blocks = rows.map((r, index) => {
                let coords = r.block_coordinates;
                try {
                  if (typeof coords === 'string') coords = JSON.parse(coords);
                } catch (e) {
                  coords = null;
                }
                if (!coords || typeof coords !== 'object') {
                  coords = { x: 0, y: 0, width: 100, height: 100 };
                }
                return {
                  block_id: r.question_id,
                  question_id: r.question_id,
                  word: r.word,
                  block_coordinates: {
                    x: Number(coords.x) || 0,
                    y: Number(coords.y) || 0,
                    width: Number(coords.width) || 100,
                    height: Number(coords.height) || 100
                  }
                };
              });
              
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
          } else {
            const wordMatchingTest = await sql`SELECT id FROM word_matching_tests WHERE id = ${test_id}`;
            if (wordMatchingTest.length > 0) {
              test_type = 'word_matching';
              // Get test info
              const wmtInfo = await sql`
                SELECT test_name, num_questions, interaction_type, created_at FROM word_matching_tests WHERE id = ${test_id}
              `;
              if (wmtInfo.length > 0) {
                testInfo = wmtInfo[0];
              }

              // Get word pairs
              const wordMatchingQuestions = await sql`
                SELECT 
                  question_id,
                  left_word,
                  right_word
                FROM word_matching_questions 
                WHERE test_id = ${test_id}
                ORDER BY question_id
              `;
              
              // Process word pairs
              questions = wordMatchingQuestions.map(row => ({
                question_id: row.question_id,
                left_word: row.left_word,
                right_word: row.right_word
              }));
              
              console.log('Word matching questions processed:', questions);
            } else {
              const drawingTest = await sql`SELECT id FROM drawing_tests WHERE id = ${test_id}`;
              if (drawingTest.length > 0) {
                test_type = 'drawing';
                // Get test info
                const drawingTestInfo = await sql`
                  SELECT test_name, num_questions, passing_score, created_at, teacher_id, subject_id FROM drawing_tests WHERE id = ${test_id}
                `;
                if (drawingTestInfo.length > 0) {
                  testInfo = drawingTestInfo[0];
                }

                // Get drawing questions
                const drawingQuestions = await sql`
                  SELECT 
                    question_id,
                    question_json,
                    canvas_width,
                    canvas_height,
                    max_canvas_width,
                    max_canvas_height
                  FROM drawing_test_questions 
                  WHERE test_id = ${test_id}
                  ORDER BY question_id
                `;
                
                // Process drawing questions
                questions = drawingQuestions.map(row => ({
                  question_id: row.question_id,
                  question_json: row.question_json,
                  canvas_width: row.canvas_width,
                  canvas_height: row.canvas_height,
                  max_canvas_width: row.max_canvas_width,
                  max_canvas_height: row.max_canvas_height
                }));
                
                console.log('Drawing questions processed:', questions);
              } else {
                return {
                  statusCode: 404,
                  headers: { ...headers, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'Test not found' })
                };
              }
            }
          }
        }
      }
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
