const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== submit-fill-blanks-test function called ===');
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Student role required.' })
      };
    }

    // Parse request body
    const { 
      test_id, 
      test_name, 
      teacher_id, 
      subject_id, 
      student_id, 
      answers, 
      score, 
      maxScore, 
      time_taken, 
      started_at, 
      submitted_at, 
      caught_cheating, 
      visibility_change_times,
      retest_assignment_id,
      parent_test_id
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      student_id,
      answers_count: answers ? Object.keys(answers).length : 0,
      score,
      maxScore,
      time_taken,
      caught_cheating,
      visibility_change_times
    });

    // Validate required fields
    if (!test_id || !test_name || !teacher_id || !subject_id || !student_id || 
        score === undefined || maxScore === undefined || !answers) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, teacher_id, subject_id, student_id, score, maxScore, answers' 
        })
      };
    }

    // Connect to database
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Get current academic period (like other tests)
    const currentPeriod = await sql`
      SELECT id FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date 
      ORDER BY start_date DESC LIMIT 1
    `;
    
    const academicPeriodId = currentPeriod.length > 0 ? currentPeriod[0].id : null;

    // Extract student info from JWT token (like other tests do)
    const studentId = userInfo.sub || userInfo.student_id;
    const grade = userInfo.grade;
    const className = userInfo.class;
    const number = userInfo.number;
    const name = userInfo.name;
    const surname = userInfo.surname;
    const nickname = userInfo.nickname;

    // Convert class to integer (match multiple-choice logic: "1/15" -> 15)
    let convertedClass;
    const classNameStr = String(className || '');
    if (classNameStr && classNameStr.includes('/')) {
      convertedClass = parseInt(classNameStr.split('/')[1]);
    } else {
      convertedClass = parseInt(classNameStr) || null;
    }

    // Debug: Log student_id value
    console.log('🔍 Student ID from JWT:', studentId);
    console.log('🔍 User info:', userInfo);

    // Begin transaction for atomicity
    await sql`BEGIN`;
    let resultId = null;
    let insertedPercentage = null;
    let insertedIsCompleted = null;

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

    // Regular vs Retest split: regular -> insert to results; retest -> write only test_attempts
    if (!retest_assignment_id) {
      const result = await sql`
        INSERT INTO fill_blanks_test_results (
          test_id, test_name, teacher_id, subject_id, grade, class, number,
          student_id, name, surname, nickname, score, max_score,
          answers, time_taken, started_at, submitted_at, caught_cheating,
          visibility_change_times, is_completed, academic_period_id, created_at
        )
        VALUES (
          ${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number},
          ${studentId}, ${name}, ${surname}, ${nickname}, ${score}, ${maxScore},
          ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false},
          ${visibility_change_times || 0}, ${true}, ${academicPeriodId}, NOW()
        )
        RETURNING id, percentage, is_completed
      `;
      resultId = result[0].id;
      insertedPercentage = result[0].percentage;
      insertedIsCompleted = result[0].is_completed;
      console.log('Fill blanks test result inserted:', resultId);
    }

    // Calculate percentage for response and upsert test_attempts
    const percentageScore = Math.round((Number(score) / Number(maxScore)) * 100);
    const attemptNumForAttempts = attemptNumber || 1;
    // For retests, create separate records for each attempt and do not insert into results
    if (retest_assignment_id) {
      // Determine safe attempt number (use larger of DB and target counters; force last on pass)
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
      let attemptNumberToWrite = (percentageScore >= 50) ? maxAttempts : Math.max(nextFromDb, nextFromTarget);

      // Reuse existing row if attempt number exists
      const existingSame = await sql`
        SELECT id FROM test_attempts
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId} AND attempt_number = ${attemptNumberToWrite}
        LIMIT 1
      `;
      if (existingSame.length > 0) {
        await sql`
          UPDATE test_attempts
          SET score = ${score}, max_score = ${maxScore}, percentage = ${percentageScore},
              time_taken = ${time_taken || null}, started_at = ${started_at || null}, submitted_at = ${submitted_at || new Date().toISOString()},
              is_completed = ${true},
              retest_assignment_id = ${retest_assignment_id},
              answers = ${JSON.stringify(answers)},
              answers_by_id = ${JSON.stringify({})},
              question_order = ${JSON.stringify([])},
              caught_cheating = ${caught_cheating || false},
              visibility_change_times = ${visibility_change_times || 0},
              test_name = ${test_name},
              teacher_id = ${teacher_id},
              subject_id = ${subject_id},
              grade = ${grade},
              class = ${convertedClass},
              number = ${number},
              name = ${name},
              surname = ${surname},
              nickname = ${nickname},
              academic_period_id = ${academicPeriodId}
          WHERE id = ${existingSame[0].id}
        `;
      } else {
        await sql`
          INSERT INTO test_attempts (
            student_id, test_id, attempt_number, score, max_score, percentage,
            time_taken, started_at, submitted_at, is_completed,
            answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
            retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
            name, surname, nickname, academic_period_id
          )
          VALUES (
            ${studentId}, ${effectiveParentTestId}, ${attemptNumberToWrite}, ${score}, ${maxScore}, ${percentageScore},
            ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, ${true},
            ${JSON.stringify(answers)}, ${JSON.stringify({})}, ${JSON.stringify([])}, ${caught_cheating || false}, ${visibility_change_times || 0},
            ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number},
            ${name}, ${surname}, ${nickname}, ${academicPeriodId}
          )
        `;
      }

      // Update retest_targets with early-pass behavior
      if (percentageScore >= 50) {
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
      // Regular tests no longer write a summary row into test_attempts
    }

    // Commit transaction
    await sql`COMMIT`;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        result_id: resultId,
        score: score,
        max_score: maxScore,
        percentage_score: percentageScore,
        message: 'Fill blanks test submitted successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    try { const sql = neon(process.env.NEON_DATABASE_URL); await sql`ROLLBACK`; } catch (e) { /* ignore */ }
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error',
        constraint: error.constraint,
        code: error.code
      })
    };
  }
};
