const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== submit-test-results function called ===');
  console.log('Event:', event);
  
  // CORS headers with Authorization support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
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
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
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

    console.log('=== PARSING REQUEST ===');
    console.log('Raw event.body:', event.body);
    console.log('Event body type:', typeof event.body);
    
    const requestBody = JSON.parse(event.body);
    console.log('Parsed request body:', requestBody);
    
    const { 
      test_type, 
      test_id, 
      student_answers, 
      score, 
      max_score
    } = requestBody;

    // Extract student_id from JWT token
    const student_id = decoded.sub;
    
    console.log('Extracted values:');
    console.log('- student_id:', student_id, 'type:', typeof student_id);
    console.log('- test_type:', test_type, 'type:', typeof test_type);
    console.log('- test_id:', test_id, 'type:', typeof test_id);
    console.log('- student_answers:', student_answers, 'type:', typeof student_answers);
    console.log('- score:', score, 'type:', typeof score);
    console.log('- max_score:', max_score, 'type:', typeof max_score);

    console.log('=== VALIDATING PARAMETERS ===');
    console.log('student_id (from JWT):', student_id);
    console.log('test_type exists:', !!test_type);
    console.log('test_id exists:', !!test_id);
    console.log('student_answers exists:', !!student_answers);
    console.log('score is defined:', score !== undefined);
    console.log('max_score exists:', !!max_score);
    
    if (!test_type || !test_id || !student_answers || score === undefined || !max_score) {
      console.log('❌ Missing required parameters');
      console.log('Missing fields:');
      if (!test_type) console.log('- test_type');
      if (!test_id) console.log('- test_id');
      if (!student_answers) console.log('- student_answers');
      if (score === undefined) console.log('- score');
      if (!max_score) console.log('- max_score');
      
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          missing: {
            test_type: !test_type,
            test_id: !test_id,
            student_answers: !student_answers,
            score: score === undefined,
            max_score: !max_score
          }
        })
      };
    }
    
    console.log('✅ All parameters validated successfully');

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Begin transaction
    await sql`BEGIN`;

    // Determine current academic period based on today's date
    console.log('=== DETERMINING ACADEMIC PERIOD ===');
    const today = new Date();
    console.log('Today\'s date:', today.toISOString());
    
    const academicPeriodQuery = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE ${today}::date BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `;
    
    let academicPeriodId = null;
    if (academicPeriodQuery.length > 0) {
      const period = academicPeriodQuery[0];
      academicPeriodId = period.id;
      console.log('Current academic period found:', {
        id: period.id,
        academic_year: period.academic_year,
        semester: period.semester,
        term: period.term,
        start_date: period.start_date,
        end_date: period.end_date
      });
    } else {
      console.log('⚠️ No current academic period found for today\'s date');
      console.log('Will use NULL for academic_period_id');
    }

    try {
      let resultId;
      
      // Insert into appropriate results table based on test type
      switch (test_type) {
        case 'multiple_choice':
          // Get student info from users table
          console.log('Getting student info for student_id:', student_id);
          const studentInfo = await sql`
            SELECT grade, class, number, name, surname, nickname
            FROM users 
            WHERE student_id = ${student_id}
          `;
          
          if (studentInfo.length === 0) {
            throw new Error('Student not found');
          }
          
          const student = studentInfo[0];
          console.log('Student info retrieved:', student);
          
          // Get test info to get test_name
          console.log('Getting test info for test_id:', test_id);
          const testInfo = await sql`
            SELECT test_name 
            FROM multiple_choice_tests 
            WHERE id = ${test_id}
          `;
          
          if (testInfo.length === 0) {
            throw new Error('Test not found');
          }
          
          const testName = testInfo[0].test_name;
          console.log('Test name retrieved:', testName);
          
          // Insert into existing multiple_choice_test_results table
          console.log('Inserting into multiple_choice_test_results table...');
          console.log('Using academic_period_id:', academicPeriodId);
          const mcResult = await sql`
            INSERT INTO multiple_choice_test_results 
            (test_id, test_name, grade, class, number, student_id, name, surname, nickname, 
             score, max_score, answers, created_at, academic_period_id)
            VALUES (${test_id}, ${testName}, ${student.grade}, ${student.class}, ${student.number}, 
                   ${student_id}, ${student.name}, ${student.surname}, ${student.nickname},
                   ${score}, ${max_score}, ${JSON.stringify(student_answers)}, CURRENT_TIMESTAMP, ${academicPeriodId})
            RETURNING id
          `;
          resultId = mcResult[0].id;
          console.log('Multiple choice test result saved with ID:', resultId);
          break;
          
        case 'true_false':
          // Similar approach for true/false tests
          const tfStudentInfo = await sql`
            SELECT grade, class, number, name, surname, nickname
            FROM users 
            WHERE student_id = ${student_id}
          `;
          
          if (tfStudentInfo.length === 0) {
            throw new Error('Student not found');
          }
          
          const tfStudent = tfStudentInfo[0];
          
          const tfTestInfo = await sql`
            SELECT test_name 
            FROM true_false_tests 
            WHERE id = ${test_id}
          `;
          
          if (tfTestInfo.length === 0) {
            throw new Error('Test not found');
          }
          
          const tfTestName = tfTestInfo[0].test_name;
          
          const tfResult = await sql`
            INSERT INTO true_false_test_results 
            (test_id, test_name, grade, class, number, student_id, name, surname, nickname, 
             score, max_score, answers, created_at, academic_period_id)
            VALUES (${test_id}, ${tfTestName}, ${tfStudent.grade}, ${tfStudent.class}, ${tfStudent.number}, 
                   ${student_id}, ${tfStudent.name}, ${tfStudent.surname}, ${tfStudent.nickname},
                   ${score}, ${max_score}, ${JSON.stringify(student_answers)}, CURRENT_TIMESTAMP, ${academicPeriodId})
            RETURNING id
          `;
          resultId = tfResult[0].id;
          break;
          
        case 'input':
          // Similar approach for input tests
          const inputStudentInfo = await sql`
            SELECT grade, class, number, name, surname, nickname
            FROM users 
            WHERE student_id = ${student_id}
          `;
          
          if (inputStudentInfo.length === 0) {
            throw new Error('Student not found');
          }
          
          const inputStudent = inputStudentInfo[0];
          
          const inputTestInfo = await sql`
            SELECT test_name 
            FROM input_tests 
            WHERE id = ${test_id}
          `;
          
          if (inputTestInfo.length === 0) {
            throw new Error('Test not found');
          }
          
          const inputTestName = inputTestInfo[0].test_name;
          
          const inputResult = await sql`
            INSERT INTO input_test_results 
            (test_id, test_name, grade, class, number, student_id, name, surname, nickname, 
             score, max_score, answers, created_at, academic_period_id)
            VALUES (${test_id}, ${inputTestName}, ${inputStudent.grade}, ${inputStudent.class}, ${inputStudent.number}, 
                   ${student_id}, ${inputStudent.name}, ${inputStudent.surname}, ${inputStudent.nickname},
                   ${score}, ${max_score}, ${JSON.stringify(student_answers)}, CURRENT_TIMESTAMP, ${academicPeriodId})
            RETURNING id
          `;
          resultId = inputResult[0].id;
          break;
          
        case 'matching_type':
          // Similar approach for matching type tests
          const matchingStudentInfo = await sql`
            SELECT grade, class, number, name, surname, nickname
            FROM users 
            WHERE student_id = ${student_id}
          `;
          
          if (matchingStudentInfo.length === 0) {
            throw new Error('Student not found');
          }
          
          const matchingStudent = matchingStudentInfo[0];
          
          const matchingTestInfo = await sql`
            SELECT test_name 
            FROM matching_type_tests 
            WHERE id = ${test_id}
          `;
          
          if (matchingTestInfo.length === 0) {
            throw new Error('Test not found');
          }
          
          const matchingTestName = matchingTestInfo[0].test_name;
          
          const matchingResult = await sql`
            INSERT INTO matching_type_test_results 
            (test_id, test_name, grade, class, number, student_id, name, surname, nickname, 
             score, max_score, answers, created_at, academic_period_id)
            VALUES (${test_id}, ${matchingTestName}, ${matchingStudent.grade}, ${matchingStudent.class}, ${matchingStudent.number}, 
                   ${student_id}, ${matchingStudent.name}, ${matchingStudent.surname}, ${matchingStudent.nickname},
                   ${score}, ${max_score}, ${JSON.stringify(student_answers)}, CURRENT_TIMESTAMP, ${academicPeriodId})
            RETURNING id
          `;
          resultId = matchingResult[0].id;
          break;
          
        default:
          throw new Error('Invalid test type');
      }

      // Commit transaction
      await sql`COMMIT`;
      
      console.log('Test results saved successfully. Result ID:', resultId);
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test results saved successfully',
          result_id: resultId
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
    console.error('Error saving test results:', error);
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
