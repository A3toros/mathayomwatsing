const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== get-matching-type-test-questions function called ===');
  console.log('Event:', event);
  
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { test_id } = event.queryStringParameters || {};
    
    console.log('Query parameters:', event.queryStringParameters);
    console.log('Test ID:', test_id);

    if (!test_id) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'test_id parameter is required'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Get test information
    console.log('Fetching test information...');
    const testInfo = await sql`
      SELECT id, test_name, image_url, num_blocks, teacher_id
      FROM matching_type_tests 
      WHERE id = ${test_id}
    `;

    if (testInfo.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Test not found'
        })
      };
    }

    const test = testInfo[0];
    console.log('Test found:', test);

    // Get questions with block coordinates and arrows
    console.log('Fetching test questions and arrows...');
    const questions = await sql`
      SELECT 
        q.id, 
        q.question_id, 
        q.word, 
        q.block_coordinates, 
        q.has_arrow,
        a.start_x as arrow_start_x,
        a.start_y as arrow_start_y,
        a.end_x as arrow_end_x,
        a.end_y as arrow_end_y,
        a.arrow_style
      FROM matching_type_test_questions q
      LEFT JOIN matching_type_test_arrows a ON q.id = a.question_id
      WHERE q.test_id = ${test_id}
      ORDER BY q.question_id
    `;

    console.log(`Found ${questions.length} questions`);

    // Group questions and arrows
    const questionsMap = new Map();
    questions.forEach(row => {
      if (!questionsMap.has(row.question_id)) {
        questionsMap.set(row.question_id, {
          id: row.id,
          question_id: row.question_id,
          word: row.word,
          block_coordinates: row.block_coordinates,
          has_arrow: row.has_arrow,
          arrow: null
        });
      }
      
      // Add arrow data if it exists
      if (row.has_arrow && row.arrow_start_x !== null) {
        questionsMap.get(row.question_id).arrow = {
          start_x: row.arrow_start_x,
          start_y: row.arrow_start_y,
          end_x: row.arrow_end_x,
          end_y: row.arrow_end_y,
          style: row.arrow_style || {}
        };
      }
    });

    const questionsArray = Array.from(questionsMap.values());

    // Format the response
    const response = {
      success: true,
      test: {
        id: test.id,
        test_name: test.test_name,
        image_url: test.image_url,
        num_blocks: test.num_blocks,
        teacher_id: test.teacher_id
      },
      questions: questionsArray
    };

    console.log('Response prepared successfully');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Get matching type test questions error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to get matching type test questions',
        error: error.message
      })
    };
  }
};
