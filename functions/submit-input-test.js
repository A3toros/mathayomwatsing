const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Enable CORS with Authorization header support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
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
      headers: { 'Content-Type': 'application/json' },
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

    // Parse request body (only test_id, test_name, score, maxScore, answers needed)
    const { test_id, test_name, teacher_id, subject_id, score, maxScore, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, answers_by_id, question_order, retest_assignment_id, parent_test_id } = JSON.parse(event.body);

    // Validate required fields (handle 0 values properly)
    if (test_id === undefined || test_id === null || 
        !test_name || 
        !teacher_id || !subject_id ||
        score === undefined || score === null || 
        maxScore === undefined || maxScore === null || 
        !answers) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, teacher_id, subject_id, score, maxScore, answers' 
        })
      };
    }

    // Extract student info from JWT token
    const studentId = decoded.sub;
    const grade = decoded.grade;
    const className = decoded.class;
    const number = decoded.number;
    const name = decoded.name;
    const surname = decoded.surname;
    const nickname = decoded.nickname;

    // Convert class format for database (1/15 -> 15)
    let convertedClass;
    if (className && String(className).includes('/')) {
      convertedClass = parseInt(String(className).split('/')[1]);
    } else {
      convertedClass = parseInt(className) || null;
    }

    // Connect to database using @neondatabase/serverless
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Get current academic period
    const currentPeriod = await sql`
      SELECT id FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date 
      ORDER BY start_date DESC LIMIT 1
    `;
    
    const academicPeriodId = currentPeriod.length > 0 ? currentPeriod[0].id : null;

    // Use frontend calculated score directly - frontend calculation is correct
    const actualScore = score;
    const totalQuestions = maxScore;
    
    // Store answers as-is from frontend (already validated)
    const validatedAnswers = answers_by_id ? { answers_by_id, question_order: question_order || [] } : answers;

    // Determine completion: finalized if submitted_at present or client marks completed
    const completedFlag = Boolean(submitted_at) || is_completed === true;

    // Insert test result with frontend calculated score and new fields
    // Retest handling
    let attemptNumber = null;
    let effectiveParentTestId = parent_test_id || test_id;
    if (retest_assignment_id) {
      const target = await sql`
        SELECT tgt.attempt_count, ra.max_attempts, ra.window_start, ra.window_end
        FROM retest_targets tgt
        JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
        WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${studentId}
      `;
      if (target.length === 0) {
        return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Retest not found or not assigned to this student' }) };
      }
      const row = target[0];
      const nowTs = new Date();
      if (!(new Date(row.window_start) <= nowTs && nowTs <= new Date(row.window_end))) {
        return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Retest window is not active' }) };
      }
      if (row.attempt_count >= row.max_attempts) {
        return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Maximum retest attempts reached' }) };
      }
      attemptNumber = Number(row.attempt_count || 0) + 1;
    }

    let result;

    // Upsert into test_attempts
    const percentage = Math.round((Number(actualScore) / Number(totalQuestions)) * 10000) / 100;
    const attemptNumForAttempts = attemptNumber || 1;

    // Retests write detailed data to test_attempts only
    if (retest_assignment_id) {
      console.log('🔍 Writing to test_attempts only (retest) - input test');

      // Determine safe attempt number
      const target = await sql`
        SELECT tgt.attempt_count, ra.max_attempts 
        FROM retest_targets tgt
        JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
        WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${studentId}
      `;
      const row = target?.[0] || {};
      const maxAttempts = Number(row.max_attempts || 1);
      const nextFromTarget = Number(row.attempt_count || 0) + 1;
      const existingAttempts = await sql`
        SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt
        FROM test_attempts
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
      `;
      const nextFromDb = Number(existingAttempts?.[0]?.max_attempt || 0) + 1;
      let attemptNumberToWrite = (percentage >= 50) ? maxAttempts : Math.max(nextFromDb, nextFromTarget);

      // If that attempt already exists, reuse it (avoid 23505)
      const existingSame = await sql`
        SELECT id FROM test_attempts 
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId} AND attempt_number = ${attemptNumberToWrite}
        LIMIT 1
      `;

      if (existingSame.length > 0) {
        await sql`
          UPDATE test_attempts
          SET score = ${actualScore}, max_score = ${totalQuestions}, percentage = ${percentage},
              time_taken = ${time_taken || null}, started_at = ${started_at || null}, submitted_at = ${submitted_at || null},
              is_completed = ${completedFlag}, answers = ${JSON.stringify(validatedAnswers)}, answers_by_id = ${JSON.stringify(answers_by_id || {})},
              question_order = ${JSON.stringify(question_order || [])}, caught_cheating = ${caught_cheating || false},
              visibility_change_times = ${visibility_change_times || 0}, retest_assignment_id = ${retest_assignment_id},
              test_name = ${test_name}, teacher_id = ${teacher_id}, subject_id = ${subject_id}, grade = ${grade}, class = ${convertedClass}, number = ${number},
              name = ${name}, surname = ${surname}, nickname = ${nickname}, academic_period_id = ${academicPeriodId}
          WHERE id = ${existingSame[0].id}
        `;
        result = existingSame;
      } else {
        result = await sql`
          INSERT INTO test_attempts (
            student_id, test_id, attempt_number, score, max_score, percentage,
            time_taken, started_at, submitted_at, is_completed,
            answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
            retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
            name, surname, nickname, academic_period_id
          ) VALUES (
            ${studentId}, ${effectiveParentTestId}, ${attemptNumberToWrite}, ${actualScore}, ${totalQuestions}, ${percentage},
            ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${completedFlag},
            ${JSON.stringify(validatedAnswers)}, ${JSON.stringify(answers_by_id || {})}, ${JSON.stringify(question_order || [])},
            ${caught_cheating || false}, ${visibility_change_times || 0}, ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id},
            ${grade}, ${convertedClass}, ${number}, ${name}, ${surname}, ${nickname}, ${academicPeriodId}
          )
          RETURNING id
        `;
      }

      // Update retest_targets with early-pass behavior
      if (percentage >= 50) {
        await sql`
          UPDATE retest_targets tgt
          SET attempt_count = ra.max_attempts,
              last_attempt_at = NOW(),
              status = 'PASSED'
          FROM retest_assignments ra
          WHERE tgt.retest_assignment_id = ra.id
            AND tgt.retest_assignment_id = ${retest_assignment_id}
            AND tgt.student_id = ${studentId}
        `;
      } else {
        await sql`
          UPDATE retest_targets 
          SET attempt_count = GREATEST(attempt_count + 1, ${attemptNumberToWrite}),
              last_attempt_at = NOW(),
              status = 'FAILED'
          WHERE retest_assignment_id = ${retest_assignment_id} 
            AND student_id = ${studentId}
        `;
      }

      // Persist best retest values
      await sql`SELECT update_best_retest_values(${studentId}, ${effectiveParentTestId})`;
    } else {
      console.log('🔍 Writing to input_test_results (regular test)');
      result = await sql`
        INSERT INTO input_test_results 
        (test_id, test_name, teacher_id, subject_id, grade, class, number, student_id, name, surname, nickname, score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, academic_period_id, created_at)
        VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number}, ${studentId}, ${name}, ${surname}, ${nickname}, ${actualScore}, ${totalQuestions}, ${JSON.stringify(validatedAnswers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, ${completedFlag}, ${academicPeriodId}, NOW())
        RETURNING id
      `;
      // Regular tests no longer write a summary row into test_attempts
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        result_id: result[0].id,
        score: actualScore,
        max_score: totalQuestions,
        percentage_score: Math.round((actualScore / totalQuestions) * 100),
        message: 'Input test submitted successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error' 
      })
    };
  }
};
