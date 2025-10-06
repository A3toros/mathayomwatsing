const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
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
    const {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      answers, // Array of drawing data
      score = null, // NULL for ungraded drawing tests
      maxScore = null, // NULL for ungraded drawing tests
      time_taken,
      started_at,
      submitted_at,
      caught_cheating = false,
      visibility_change_times = 0,
      is_completed,
      retest_assignment_id,
      parent_test_id
    } = JSON.parse(event.body);
    
    // Debug: Log answers for drawing tests
    console.log('🎨 Backend received answers:', answers);
    console.log('🎨 Backend answers type:', typeof answers);
    console.log('🎨 Backend answers content:', answers);
    console.log('🎨 Backend retest_assignment_id:', retest_assignment_id);
    console.log('🎨 Backend retest_assignment_id type:', typeof retest_assignment_id);
    console.log('🎨 Backend retest_assignment_id null check:', retest_assignment_id === null);
    
    console.log('Parsed submission data:', {
      test_id,
      test_name,
      student_id: userInfo.student_id,
      score,
      maxScore,
      answers_count: Array.isArray(answers) ? answers.length : 0,
      time_taken: time_taken,
      started_at: started_at,
      submitted_at: submitted_at
    });

    // Validate input
    if (!test_id || !test_name || !answers) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: test_id, test_name, answers'
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
      // Get academic period ID from frontend (no database query needed)
      const { academic_period_id } = JSON.parse(event.body);
      const academicPeriodId = academic_period_id;
      console.log('Academic period ID from frontend:', academicPeriodId);

      // Retest handling: for drawing, score may be null at submission. We'll still record attempt as IN_PROGRESS.
      let attemptNumber = null;
      let effectiveParentTestId = parent_test_id || test_id;
      if (retest_assignment_id) {
        const target = await sql`
          SELECT tgt.attempt_count, ra.max_attempts, ra.window_start, ra.window_end
          FROM retest_targets tgt
          JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
          WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${userInfo.student_id}
        `;
        if (target.length === 0) {
          throw new Error('Retest not found or not assigned to this student');
        }
        const row = target[0];
        console.log('🎨 Retest validation - attempt_count:', row.attempt_count, 'max_attempts:', row.max_attempts);
        console.log('🎨 Retest validation - window_start:', row.window_start, 'window_end:', row.window_end);
        const nowTs = new Date();
        if (!(new Date(row.window_start) <= nowTs && nowTs <= new Date(row.window_end))) {
          throw new Error('Retest window is not active');
        }
        if (row.attempt_count >= row.max_attempts) {
          console.log('🎨 ERROR: Maximum retest attempts reached - attempt_count:', row.attempt_count, 'max_attempts:', row.max_attempts);
          throw new Error('Maximum retest attempts reached');
        }
        attemptNumber = Number(row.attempt_count || 0) + 1;
      }

      // Insert drawing test result (avoid dynamic column interpolation)
      let result;
      if (retest_assignment_id) {
        result = await sql`
          INSERT INTO drawing_test_results (
            test_id, test_name, teacher_id, subject_id, grade, class, number,
            student_id, name, surname, nickname, score, max_score,
            answers, time_taken, started_at, submitted_at, caught_cheating,
            visibility_change_times, is_completed, created_at, academic_period_id,
            retest_assignment_id, attempt_number
          ) VALUES (
            ${test_id}, ${test_name}, ${teacher_id}, ${subject_id},
            ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
            ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
            ${score}, ${maxScore},
            ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null},
            ${submitted_at || new Date().toISOString()}, ${caught_cheating || false},
            ${visibility_change_times || 0}, ${is_completed || true}, NOW(),
            ${academicPeriodId}, ${retest_assignment_id}, ${attemptNumber || 1}
          )
          RETURNING id, percentage, is_completed
        `;
      } else {
        result = await sql`
          INSERT INTO drawing_test_results (
            test_id, test_name, teacher_id, subject_id, grade, class, number,
            student_id, name, surname, nickname, score, max_score,
            answers, time_taken, started_at, submitted_at, caught_cheating,
            visibility_change_times, is_completed, created_at, academic_period_id
          ) VALUES (
            ${test_id}, ${test_name}, ${teacher_id}, ${subject_id},
            ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
            ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
            ${score}, ${maxScore},
            ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null},
            ${submitted_at || new Date().toISOString()}, ${caught_cheating || false},
            ${visibility_change_times || 0}, ${is_completed || true}, NOW(),
            ${academicPeriodId}
          )
          RETURNING id, percentage, is_completed
        `;
      }
      
      const resultId = result[0].id;
      const insertedPercentage = result[0].percentage;
      const insertedIsCompleted = result[0].is_completed;
      console.log(`Drawing test result inserted successfully with ID: ${resultId}`);
      console.log(`Inserted percentage: ${insertedPercentage}, is_completed: ${insertedIsCompleted}`);

      // Insert individual drawing images if provided
      if (answers && Array.isArray(answers)) {
        for (let i = 0; i < answers.length; i++) {
          const drawingData = answers[i];
          if (drawingData && typeof drawingData === 'string') {
            try {
              const parsedDrawing = JSON.parse(drawingData);
              if (Array.isArray(parsedDrawing)) {
                await sql`
                  INSERT INTO drawing_test_images (result_id, question_id, drawing_url, drawing_data)
                  VALUES (${resultId}, ${i + 1}, 'data:image/png;base64,placeholder', ${drawingData})
                `;
              }
            } catch (e) {
              console.log(`Skipping invalid drawing data for question ${i + 1}:`, e.message);
            }
          }
        }
      }

      // Upsert attempt and update retest target: if no score yet, mark IN_PROGRESS
      if (retest_assignment_id) {
        await sql`
          UPDATE retest_targets SET attempt_count = ${attemptNumber}, last_attempt_at = NOW(), status = 'IN_PROGRESS'
          WHERE retest_assignment_id = ${retest_assignment_id} AND student_id = ${userInfo.student_id}
        `;
      }

      // If this is a retest, always record in test_attempts (regardless of score)
      // Drawing tests are ungraded by default, so only check for retest_assignment_id
      if (retest_assignment_id) {
        const percentageVal = (score !== null && maxScore !== null && Number(maxScore) > 0) 
          ? Math.round((Number(score) / Number(maxScore)) * 10000) / 100 
          : null;
        const attemptNumForAttempts = attemptNumber || 1;
        if (retest_assignment_id) {
          // Determine safe attempt number
          const target = await sql`
            SELECT tgt.attempt_count, ra.max_attempts 
            FROM retest_targets tgt
            JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
            WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${userInfo.student_id}
          `;
          const row = target?.[0] || {};
          const maxAttempts = Number(row.max_attempts || 1);
          const nextFromTarget = Number(row.attempt_count || 0) + 1;
          const existingAttempts = await sql`
            SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt
            FROM test_attempts
            WHERE student_id = ${userInfo.student_id} AND test_id = ${effectiveParentTestId}
          `;
          const nextFromDb = Number(existingAttempts?.[0]?.max_attempt || 0) + 1;
          let attemptNumberToWrite = (percentageVal !== null && percentageVal >= 50) ? maxAttempts : Math.max(nextFromDb, nextFromTarget);

          // Debug: Log what we're about to write to test_attempts
          console.log('🎨 About to write to test_attempts:');
          console.log('🎨 answers:', answers);
          console.log('🎨 answers type:', typeof answers);
          console.log('🎨 answers length:', answers ? Object.keys(answers).length : 'null/undefined');
          console.log('🎨 JSON.stringify(answers):', JSON.stringify(answers));
          console.log('🎨 JSON.stringify(answers) length:', JSON.stringify(answers).length);
          console.log('🎨 retest_assignment_id:', retest_assignment_id);
          console.log('🎨 effectiveParentTestId:', effectiveParentTestId);
          console.log('🎨 attemptNumberToWrite:', attemptNumberToWrite);
          
          // Special debugging for drawing test answers
          if (answers && typeof answers === 'object') {
            console.log('🎨 Drawing answers structure:');
            Object.keys(answers).forEach(key => {
              const answer = answers[key];
              console.log(`🎨 Answer ${key}:`, typeof answer, Array.isArray(answer) ? `Array(${answer.length})` : 'Not array');
              if (Array.isArray(answer) && answer.length > 0) {
                console.log(`🎨 First stroke points:`, answer[0]?.length || 'No strokes');
                if (answer[0] && answer[0].length > 0) {
                  console.log(`🎨 First point:`, answer[0][0]);
                }
              }
            });
          }
          
          // Reuse existing row if attempt number exists
          const existingSame = await sql`
            SELECT id FROM test_attempts
            WHERE student_id = ${userInfo.student_id} AND test_id = ${effectiveParentTestId} AND attempt_number = ${attemptNumberToWrite}
            LIMIT 1
          `;
          if (existingSame.length > 0) {
            await sql`
              UPDATE test_attempts
              SET score = ${score}, max_score = ${maxScore}, percentage = ${percentageVal},
                  time_taken = ${time_taken || null}, started_at = ${started_at || null}, submitted_at = ${submitted_at || new Date().toISOString()},
                  is_completed = ${is_completed || true},
                  retest_assignment_id = ${retest_assignment_id},
                  answers = ${JSON.stringify(answers)},
                  answers_by_id = ${JSON.stringify({})},
                  question_order = ${JSON.stringify([])},
                  caught_cheating = ${caught_cheating || false},
                  visibility_change_times = ${visibility_change_times || 0},
                  test_name = ${test_name},
                  teacher_id = ${teacher_id},
                  subject_id = ${subject_id}
              WHERE id = ${existingSame[0].id}
            `;
            console.log('🎨 Successfully wrote to test_attempts (UPDATE)');
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
                ${userInfo.student_id}, ${effectiveParentTestId}, ${attemptNumberToWrite}, ${score}, ${maxScore}, ${percentageVal},
                ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, ${is_completed || true},
                ${JSON.stringify(answers)}, ${JSON.stringify({})}, ${JSON.stringify([])}, ${caught_cheating || false}, ${visibility_change_times || 0},
                ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
                ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname}, ${academicPeriodId}
              )
            `;
            console.log('🎨 Successfully wrote to test_attempts (INSERT)');
          }

          console.log('🎨 Database write completed for test_attempts');
          
          // Verify the answers were written by querying the database
          const verifyAnswers = await sql`
            SELECT answers FROM test_attempts 
            WHERE student_id = ${userInfo.student_id} 
              AND test_id = ${effectiveParentTestId} 
              AND attempt_number = ${attemptNumberToWrite}
            LIMIT 1
          `;
          
          if (verifyAnswers.length > 0) {
            console.log('🎨 Verified answers in database:', verifyAnswers[0].answers);
            console.log('🎨 Verified answers length:', verifyAnswers[0].answers?.length || 'null');
          } else {
            console.log('🎨 ERROR: No answers found in database after write!');
          }

          // Update retest_targets with special handling for drawing tests
          if (percentageVal !== null && percentageVal >= 50) {
            // Graded tests: Mark as PASSED if score >= 50%
            await sql`
              UPDATE retest_targets tgt
              SET attempt_count = ra.max_attempts,
                  last_attempt_at = NOW(),
                  status = 'PASSED'
              FROM retest_assignments ra
              WHERE tgt.retest_assignment_id = ra.id
                AND tgt.retest_assignment_id = ${retest_assignment_id} 
                AND student_id = ${userInfo.student_id}
            `;
          } else if (percentageVal === null) {
            // Drawing tests: Mark as PASSED (ungraded, manually graded)
            // Set attempt_count to max_attempts to prevent further retests
            console.log('🎨 Updating retest_targets for drawing test - setting attempt_count to max_attempts');
            const updateResult = await sql`
              UPDATE retest_targets tgt
              SET attempt_count = ra.max_attempts,
                  last_attempt_at = NOW(),
                  status = 'PASSED'
              FROM retest_assignments ra
              WHERE tgt.retest_assignment_id = ra.id
                AND tgt.retest_assignment_id = ${retest_assignment_id} 
                AND tgt.student_id = ${userInfo.student_id}
            `;
            console.log('🎨 Retest targets update result:', updateResult);
          } else {
            // Graded tests: Mark as FAILED if score < 50%
            await sql`
              UPDATE retest_targets 
              SET attempt_count = GREATEST(attempt_count + 1, ${attemptNumberToWrite}),
                  last_attempt_at = NOW(),
                  status = 'FAILED'
              WHERE retest_assignment_id = ${retest_assignment_id} 
                AND student_id = ${userInfo.student_id}
            `;
          }

          // Persist best retest values
          await sql`SELECT update_best_retest_values(${userInfo.student_id}, ${effectiveParentTestId})`;
        } else {
          // For regular tests, use upsert to handle retakes
          await sql`
            INSERT INTO test_attempts (student_id, test_id, attempt_number, score, max_score, percentage, time_taken, started_at, submitted_at, is_completed)
            VALUES (${userInfo.student_id}, ${effectiveParentTestId}, ${attemptNumForAttempts}, ${score}, ${maxScore}, ${percentageVal}, ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, ${is_completed || true})
            ON CONFLICT (student_id, test_id, attempt_number)
            DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, percentage = EXCLUDED.percentage, submitted_at = EXCLUDED.submitted_at, is_completed = EXCLUDED.is_completed
          `;
        }
      }

      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Drawing test submitted successfully',
          result_id: resultId,
          score: score,
          max_score: maxScore,
          percentage: (score !== null && maxScore !== null && maxScore > 0) ? Math.round((score / maxScore) * 100) : null
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
    console.error('Error submitting drawing test:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
