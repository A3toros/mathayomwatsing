const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== get-matching-type-test function called ===');
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
    
    console.log('Requested test ID:', test_id);

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
    console.log('Fetching test data...');
    const testResult = await sql`
      SELECT id, teacher_id, test_name, image_url, num_blocks, created_at
      FROM matching_type_tests
      WHERE id = ${test_id}
    `;
    
    if (testResult.length === 0) {
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
    
    const testData = testResult[0];
    console.log('Test data retrieved:', testData);
    
    // Get questions with block coordinates
    console.log('Fetching questions...');
    const questionsResult = await sql`
      SELECT id, question_id, word, block_coordinates, has_arrow
      FROM matching_type_test_questions
      WHERE test_id = ${test_id}
      ORDER BY question_id
    `;
    
    console.log('Questions retrieved:', questionsResult.length);
    
    // ✅ ENHANCED: Get arrows with ALL coordinate systems
    console.log('Fetching enhanced arrows...');
    const arrowsResult = await sql`
      SELECT 
        a.id,
        a.question_id,
        a.start_x,
        a.start_y,
        a.end_x,
        a.end_y,
        a.rel_start_x,
        a.rel_start_y,
        a.rel_end_x,
        a.rel_end_y,
        a.image_width,
        a.image_height,
        a.arrow_style,
        q.question_id as block_id
      FROM matching_type_test_arrows a
      JOIN matching_type_test_questions q ON a.question_id = q.id
      WHERE q.test_id = ${test_id}
    `;
    
    console.log('Arrows retrieved:', arrowsResult.length);
    
    // Process questions and associate arrows
    const questions = questionsResult.map(q => {
      const question = {
        question_id: q.question_id,
        word: q.word,
        block_coordinates: q.block_coordinates,
        has_arrow: q.has_arrow,
        arrow: null
      };
      
      // Find associated arrow - use q.id (database primary key) to match with arrow.question_id
      if (q.has_arrow) {
        const arrow = arrowsResult.find(a => a.question_id === q.id);
        if (arrow) {
          question.arrow = {
            start_x: arrow.start_x,
            start_y: arrow.start_y,
            end_x: arrow.end_x,
            end_y: arrow.end_y,
            style: arrow.arrow_style || {}
          };
          console.log(`🎯 Associated arrow for question ${q.question_id}:`, question.arrow);
        } else {
          console.log(`⚠️ Question ${q.question_id} has_arrow=true but no arrow found in arrowsResult`);
          console.log(`🔍 Available arrows:`, arrowsResult.map(a => ({ question_id: a.question_id, block_id: a.block_id })));
        }
      }
      
      return question;
    });
    
    // ✅ ENHANCED: Include all coordinate systems in response
    const responseData = {
      test_id: testData.id,
      test_name: testData.test_name,
      image_url: testData.image_url,
      num_blocks: testData.num_blocks,
      created_at: testData.created_at,
      questions: questions,
      arrows: arrowsResult.map(a => ({
        id: a.id,
        question_id: a.question_id,
        block_id: a.block_id,
        start_x: a.start_x,
        start_y: a.start_y,
        end_x: a.end_x,
        end_y: a.end_y,
        // ✅ NEW: Include relative coordinates
        rel_start_x: a.rel_start_x,
        rel_start_y: a.rel_start_y,
        rel_end_x: a.rel_end_x,
        rel_end_y: a.rel_end_y,
        // ✅ NEW: Include image dimensions
        image_width: a.image_width,
        image_height: a.image_height,
        style: a.arrow_style || {}
      }))
    };
    
    console.log('Response data prepared successfully');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: responseData
      })
    };
    
  } catch (error) {
    console.error('Get matching type test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve matching type test',
        error: error.message
      })
    };
  }
};
