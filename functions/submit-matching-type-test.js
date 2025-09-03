const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== submit-matching-type-test function called ===');
  console.log('Event:', event);
  console.log('Event body:', event.body);
  
  // Enable CORS with Authorization header support
  const headers = {
    'Access-Control-Allow-Origin': 'https://yourdomain.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
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
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    const { 
      test_id, 
      answers
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      test_id,
      answers_count: answers ? answers.length : 0,
      student_id: decoded.sub,
      role: decoded.role
    });

    if (!test_id || !answers || !Array.isArray(answers)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required: test_id, answers'
        })
      };
    }

    // Extract student info from JWT token
    const student_data = {
      student_id: decoded.sub,
      name: decoded.name,
      surname: decoded.surname,
      nickname: decoded.nickname,
      grade: decoded.grade,
      class: decoded.class,
      number: decoded.number
    };

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Get test information and correct answers
    console.log('Fetching test data for validation...');
    const testResult = await sql`
      SELECT id, test_name, num_blocks
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
    
    // Get correct answers
    console.log('Fetching correct answers...');
    const correctAnswersResult = await sql`
      SELECT question_id, word, block_coordinates, has_arrow
      FROM matching_type_test_questions
      WHERE test_id = ${test_id}
      ORDER BY question_id
    `;
    
    console.log('Correct answers retrieved:', correctAnswersResult.length);
    
    // Get arrows for validation
    console.log('Fetching arrows for validation...');
    const arrowsResult = await sql`
      SELECT 
        a.question_id,
        a.start_x,
        a.start_y,
        a.end_x,
        a.end_y,
        a.arrow_style,
        q.question_id as block_id
      FROM matching_type_test_arrows a
      JOIN matching_type_test_questions q ON a.question_id = q.id
      WHERE q.test_id = ${test_id}
    `;
    
    console.log('Arrows retrieved:', arrowsResult.length);
    
    // Determine current academic period
    console.log('Determining current academic period...');
    const currentAcademicYear = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;
    
    if (currentAcademicYear.length === 0) {
      console.log('No current academic period found, using most recent period');
      // If no current period found, use the most recent one
      const mostRecentPeriod = await sql`
        SELECT id, academic_year, semester, term, start_date, end_date
        FROM academic_year 
        ORDER BY start_date DESC
        LIMIT 1
      `;
      academic_period_id = mostRecentPeriod[0].id;
      console.log('Using most recent academic period ID:', academic_period_id);
      console.log('Most recent academic period:', mostRecentPeriod[0]);
    } else {
      academic_period_id = currentAcademicYear[0].id;
      console.log('Current academic period ID:', academic_period_id);
      console.log('Current academic period:', currentAcademicYear[0]);
    }
    
    // Calculate score
    console.log('Calculating score...');
    let correctMatches = 0;
    // Arrow compliance removed - arrows are visual only
    const totalQuestions = correctAnswersResult.length;
    
    console.log('🔍 Student answers:', answers);
    console.log('🔍 Correct answers from DB:', correctAnswersResult);
    
    const answerValidation = answers.map(studentAnswer => {
      const correctAnswer = correctAnswersResult.find(ca => ca.question_id === studentAnswer.question_id);
      if (!correctAnswer) {
        console.log(`❌ Question ${studentAnswer.question_id} not found in correct answers`);
        return {
          question_id: studentAnswer.question_id,
          correct: false,
          reason: 'Question not found'
        };
      }
      
      console.log(`🔍 Validating answer for question ${studentAnswer.question_id}:`);
      console.log(`  - Student placed word "${studentAnswer.word}" on block ${studentAnswer.block_id}`);
      console.log(`  - Correct answer: word "${correctAnswer.word}" should be on block ${correctAnswer.question_id}`);
      console.log(`  - Student coordinates: (${studentAnswer.block_x}, ${studentAnswer.block_y})`);
      console.log(`  - Expected coordinates: (${correctAnswer.block_coordinates.x}, ${correctAnswer.block_coordinates.y})`);
      
      // Check if word matches the expected word for this question
      const wordCorrect = studentAnswer.word === correctAnswer.word;
      
      // Check if block ID matches the expected block ID
      const blockCorrect = studentAnswer.block_id === correctAnswer.question_id;
      
      // Check if coordinates match (within tolerance)
      const tolerance = 50; // Increased tolerance for better matching
      const coordsCorrect = Math.abs(studentAnswer.block_x - correctAnswer.block_coordinates.x) <= tolerance &&
                           Math.abs(studentAnswer.block_y - correctAnswer.block_coordinates.y) <= tolerance;
      
      // A match is correct if the word is placed on the right block
      const isCorrect = wordCorrect && blockCorrect;
      
      if (isCorrect) {
        correctMatches++;
        console.log(`✅ Question ${studentAnswer.question_id} is CORRECT`);
      } else {
        console.log(`❌ Question ${studentAnswer.question_id} is INCORRECT:`);
        if (!wordCorrect) console.log(`  - Word mismatch: got "${studentAnswer.word}", expected "${correctAnswer.word}"`);
        if (!blockCorrect) console.log(`  - Block mismatch: got block ${studentAnswer.block_id}, expected block ${correctAnswer.question_id}`);
        if (!coordsCorrect) console.log(`  - Coordinate mismatch: got (${studentAnswer.block_x}, ${studentAnswer.block_y}), expected (${correctAnswer.block_coordinates.x}, ${correctAnswer.block_coordinates.y})`);
      }
      
      // Arrow compliance removed - arrows are visual guidance only
      
      return {
        question_id: studentAnswer.question_id,
        correct: isCorrect,
        word_correct: wordCorrect,
        block_correct: blockCorrect,
        coords_correct: coordsCorrect,
        // arrow_followed removed - arrows are visual only
        reason: isCorrect ? 'Correct' : 
                !wordCorrect ? 'Wrong word' : 
                !blockCorrect ? 'Wrong block' :
                !coordsCorrect ? 'Wrong position' : 'Unknown error'
      };
    });
    
    console.log('🔍 Answer validation results:', answerValidation);
    console.log('🔍 Score breakdown:', {
      correctMatches,
      totalQuestions
    });
    
    // Calculate final score - simple scoring without arrow weighting
    const score = Math.round((correctMatches / totalQuestions) * 100);
    const finalScore = score;
    
    console.log('🔍 Score calculation details:');
    console.log('  - correctMatches:', correctMatches);
    console.log('  - totalQuestions:', totalQuestions);
    console.log('  - Final score (correctMatches/totalQuestions):', finalScore);
    console.log('  - Simple scoring - no arrow weighting');
    
    // Store results in database
    console.log('Storing results in database...');
    const resultData = {
      test_id: test_id,
      test_name: testData.test_name,
      grade: student_data.grade,
      class: student_data.class,
      number: student_data.number,
      student_id: student_data.student_id,
      name: student_data.name,
      surname: student_data.surname,
      nickname: student_data.nickname,
      score: correctMatches, // Store raw score (number of correct matches)
      max_score: totalQuestions, // Store total questions as max score
      answers: JSON.stringify(answerValidation),
      academic_period_id: academic_period_id
    };
    
    const insertResult = await sql`
      INSERT INTO matching_type_test_results (
        test_id, test_name, grade, class, number, student_id, 
        name, surname, nickname, score, max_score, answers, academic_period_id
      )
      VALUES (
        ${resultData.test_id}, ${resultData.test_name}, ${resultData.grade}, 
        ${resultData.class}, ${resultData.number}, ${resultData.student_id},
        ${resultData.name}, ${resultData.surname}, ${resultData.nickname},
        ${resultData.score}, ${resultData.max_score}, ${resultData.answers}, 
        ${resultData.academic_period_id}
      )
      RETURNING id
    `;
    
    const resultId = insertResult[0].id;
    console.log('Results stored successfully with ID:', resultId);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Matching type test submitted successfully',
        result_id: resultId,
        score: correctMatches, // Raw score (correct matches)
        max_score: totalQuestions, // Total questions
        percentage_score: finalScore, // Percentage score for frontend display
        correct_matches: correctMatches,
        total_questions: totalQuestions,
        // Arrow compliance data removed
        details: answerValidation
      })
    };
    
  } catch (error) {
    console.error('Submit matching type test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to submit matching type test',
        error: error.message
      })
    };
  }
};

// Arrow compliance function removed - arrows are visual only
