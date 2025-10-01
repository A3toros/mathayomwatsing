const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: result.error })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher or admin role required.' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const { teacher_id, grade, class: className, semester, academic_period_id } = event.queryStringParameters;
    
    // Validate required parameters
    if (!grade || !className || !semester || !academic_period_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters: grade, class, semester, academic_period_id' })
      };
    }

    // Extract class number from className (e.g., "1/15" -> 15)
    const classNumber = className.split('/')[1];
    if (!classNumber || isNaN(parseInt(classNumber))) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid class format. Expected format: grade/class (e.g., 1/15)' })
      };
    }

    // Extract grade number from grade (e.g., "M1" -> 1)
    const gradeNumber = grade.replace('M', '');
    if (!gradeNumber || isNaN(parseInt(gradeNumber))) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid grade format. Expected format: M1, M2, etc.' })
      };
    }

    // Handle admin vs regular teacher
    let actualTeacherId;
    if (userInfo.role === 'admin') {
      // Admin can access any teacher's data if teacher_id is provided
      actualTeacherId = teacher_id || userInfo.teacher_id;
    } else {
      // Regular teacher uses their own ID
      actualTeacherId = userInfo.teacher_id;
    }

    if (!actualTeacherId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    console.log('Fetching teacher student results:', {
      teacher_id: actualTeacherId,
      grade,
      class: className,
      semester,
      academic_period_id
    });

    // Get all students in this grade and class
    const students = await sql`
      SELECT student_id, name, surname, nickname, number
      FROM users 
      WHERE grade = ${parseInt(gradeNumber)} AND class = ${parseInt(classNumber)}
      ORDER BY CAST(number AS INTEGER)
    `;
    
    console.log(`Found ${students.length} students in grade ${grade} class ${className}`);

    // Get all academic periods for the requested semester
    const requestedSemester = parseInt(semester);
    
    // Find all academic periods that match the requested semester
    const academicPeriods = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE semester = ${requestedSemester}
      ORDER BY academic_year, term
    `;
    
    if (academicPeriods.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `No academic periods found for semester ${requestedSemester}` })
      };
    }
    
    console.log('Academic periods for semester', requestedSemester, ':', academicPeriods);
    
    // Extract academic period IDs for the query
    const academicPeriodIds = academicPeriods.map(period => period.id);
    console.log('Academic period IDs to query:', academicPeriodIds);
    
    // Query all test result tables with UNION to get comprehensive results
    const results = await sql`
      -- Matching Type Test Results (best retest coalesced into score/max_score)
      SELECT 
        'matching_type' as test_type,
        m.id,
        m.test_id,
        m.test_name,
        m.teacher_id,
        m.subject_id,
        m.grade,
        m.class,
        m.number,
        m.student_id,
        m.name,
        m.surname,
        m.nickname,
        COALESCE(m_best.best_score, m.score)       AS score,
        COALESCE(m_best.best_max,   m.max_score)   AS max_score,
        m.percentage,
        m.answers,
        m.time_taken,
        m.started_at,
        m.submitted_at,
        m.caught_cheating,
        m.visibility_change_times,
        m.is_completed,
        m.retest_offered,
        m.created_at,
        m.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM matching_type_test_results m
      LEFT JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = m.student_id
          AND ta.test_id = m.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) m_best ON TRUE
      WHERE m.teacher_id = ${actualTeacherId}
        AND m.grade = ${parseInt(gradeNumber)}
        AND m.class = ${parseInt(classNumber)}
        AND m.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- Multiple Choice Test Results (best retest coalesced into score/max_score)
      SELECT 
        'multiple_choice' as test_type,
        mc.id,
        mc.test_id,
        mc.test_name,
        mc.teacher_id,
        mc.subject_id,
        mc.grade,
        mc.class,
        mc.number,
        mc.student_id,
        mc.name,
        mc.surname,
        mc.nickname,
        COALESCE(mc_best.best_score, mc.score)     AS score,
        COALESCE(mc_best.best_max,   mc.max_score) AS max_score,
        mc.percentage,
        mc.answers,
        mc.time_taken,
        mc.started_at,
        mc.submitted_at,
        mc.caught_cheating,
        mc.visibility_change_times,
        mc.is_completed,
        mc.retest_offered,
        mc.created_at,
        mc.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM multiple_choice_test_results mc
      LEFT JOIN subjects s ON mc.subject_id = s.subject_id
      LEFT JOIN teachers t ON mc.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = mc.student_id 
          AND ta.test_id = mc.test_id 
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) mc_best ON TRUE
      WHERE mc.teacher_id = ${actualTeacherId}
        AND mc.grade = ${parseInt(gradeNumber)}
        AND mc.class = ${parseInt(classNumber)}
        AND mc.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- True/False Test Results (best retest coalesced into score/max_score)
      SELECT 
        'true_false' as test_type,
        tf.id,
        tf.test_id,
        tf.test_name,
        tf.teacher_id,
        tf.subject_id,
        tf.grade,
        tf.class,
        tf.number,
        tf.student_id,
        tf.name,
        tf.surname,
        tf.nickname,
        COALESCE(tf_best.best_score, tf.score)     AS score,
        COALESCE(tf_best.best_max,   tf.max_score) AS max_score,
        tf.percentage,
        tf.answers,
        tf.time_taken,
        tf.started_at,
        tf.submitted_at,
        tf.caught_cheating,
        tf.visibility_change_times,
        tf.is_completed,
        tf.retest_offered,
        tf.created_at,
        tf.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM true_false_test_results tf
      LEFT JOIN subjects s ON tf.subject_id = s.subject_id
      LEFT JOIN teachers t ON tf.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = tf.student_id
          AND ta.test_id = tf.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) tf_best ON TRUE
      WHERE tf.teacher_id = ${actualTeacherId}
        AND tf.grade = ${parseInt(gradeNumber)}
        AND tf.class = ${parseInt(classNumber)}
        AND tf.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- Input Test Results (best retest coalesced into score/max_score)
      SELECT 
        'input' as test_type,
        i.id,
        i.test_id,
        i.test_name,
        i.teacher_id,
        i.subject_id,
        i.grade,
        i.class,
        i.number,
        i.student_id,
        i.name,
        i.surname,
        i.nickname,
        COALESCE(i_best.best_score, i.score)       AS score,
        COALESCE(i_best.best_max,   i.max_score)   AS max_score,
        i.percentage,
        i.answers,
        i.time_taken,
        i.started_at,
        i.submitted_at,
        i.caught_cheating,
        i.visibility_change_times,
        i.is_completed,
        i.retest_offered,
        i.created_at,
        i.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM input_test_results i
      LEFT JOIN subjects s ON i.subject_id = s.subject_id
      LEFT JOIN teachers t ON i.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = i.student_id
          AND ta.test_id = i.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) i_best ON TRUE
      WHERE i.teacher_id = ${actualTeacherId}
        AND i.grade = ${parseInt(gradeNumber)}
        AND i.class = ${parseInt(classNumber)}
        AND i.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- Word Matching Test Results (best retest coalesced into score/max_score)
      SELECT 
        'word_matching' as test_type,
        w.id,
        w.test_id,
        w.test_name,
        w.teacher_id,
        w.subject_id,
        w.grade,
        w.class,
        w.number,
        w.student_id,
        w.name,
        w.surname,
        w.nickname,
        COALESCE(w_best.best_score, w.score)       AS score,
        COALESCE(w_best.best_max,   w.max_score)   AS max_score,
        w.percentage,
        w.answers,
        w.time_taken,
        w.started_at,
        w.submitted_at,
        w.caught_cheating,
        w.visibility_change_times,
        w.is_completed,
        w.retest_offered,
        w.created_at,
        w.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM word_matching_test_results w
      LEFT JOIN subjects s ON w.subject_id = s.subject_id
      LEFT JOIN teachers t ON w.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = w.student_id
          AND ta.test_id = w.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) w_best ON TRUE
      WHERE w.teacher_id = ${actualTeacherId}
        AND w.grade = ${parseInt(gradeNumber)}
        AND w.class = ${parseInt(classNumber)}
        AND w.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- Drawing Test Results (best retest coalesced into score/max_score, drawing data from retests)
      SELECT 
        'drawing' as test_type,
        d.id,
        d.test_id,
        d.test_name,
        d.teacher_id,
        d.subject_id,
        d.grade,
        d.class,
        d.number,
        d.student_id,
        d.name,
        d.surname,
        d.nickname,
        COALESCE(d_best.best_score, d.score)       AS score,
        COALESCE(d_best.best_max,   d.max_score)   AS max_score,
        d.percentage,
        -- Use retest drawing data if available, otherwise use original
        COALESCE(d_best.best_answers, d.answers)   AS answers,
        d.time_taken,
        d.started_at,
        d.submitted_at,
        d.caught_cheating,
        d.visibility_change_times,
        d.is_completed,
        d.retest_offered,
        d.created_at,
        d.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM drawing_test_results d
      LEFT JOIN subjects s ON d.subject_id = s.subject_id
      LEFT JOIN teachers t ON d.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max, ta.answers AS best_answers
        FROM test_attempts ta
        WHERE ta.student_id = d.student_id
          AND ta.test_id = d.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) d_best ON TRUE
      WHERE d.teacher_id = ${actualTeacherId}
        AND d.grade = ${parseInt(gradeNumber)}
        AND d.class = ${parseInt(classNumber)}
        AND d.academic_period_id = ANY(${academicPeriodIds})
      
      UNION ALL
      
      -- Fill Blanks Test Results (best retest coalesced into score/max_score)
      SELECT 
        'fill_blanks' as test_type,
        fb.id,
        fb.test_id,
        fb.test_name,
        fb.teacher_id,
        fb.subject_id,
        fb.grade,
        fb.class,
        fb.number,
        fb.student_id,
        fb.name,
        fb.surname,
        fb.nickname,
        COALESCE(fb_best.best_score, fb.score)     AS score,
        COALESCE(fb_best.best_max,   fb.max_score) AS max_score,
        fb.percentage,
        fb.answers,
        fb.time_taken,
        fb.started_at,
        fb.submitted_at,
        fb.caught_cheating,
        fb.visibility_change_times,
        fb.is_completed,
        fb.retest_offered,
        fb.created_at,
        fb.academic_period_id,
        s.subject,
        CONCAT(t.first_name, ' ', t.last_name) as teacher_name
      FROM fill_blanks_test_results fb
      LEFT JOIN subjects s ON fb.subject_id = s.subject_id
      LEFT JOIN teachers t ON fb.teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT ta.score AS best_score, ta.max_score AS best_max
        FROM test_attempts ta
        WHERE ta.student_id = fb.student_id
          AND ta.test_id = fb.test_id
          AND ta.retest_assignment_id IS NOT NULL
        ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
        LIMIT 1
      ) fb_best ON TRUE
      WHERE fb.teacher_id = ${actualTeacherId}
        AND fb.grade = ${parseInt(gradeNumber)}
        AND fb.class = ${parseInt(classNumber)}
        AND fb.academic_period_id = ANY(${academicPeriodIds})
      
      ORDER BY student_id, test_name, created_at DESC
    `;
    
    console.log(`Found ${results.length} test results for teacher ${actualTeacherId} in semester ${requestedSemester}`);
    
    // Debug: Check if there are any results at all for this teacher
    if (results.length === 0) {
      console.log('🔍 Debugging: No results found, checking if teacher has any results...');
      
      // Check for any results for this teacher across all academic periods
      const debugResults = await sql`
        SELECT 
          'matching_type' as test_type,
          m.test_id,
          m.test_name,
          m.academic_period_id,
          m.grade,
          m.class,
          COUNT(*) as result_count
        FROM matching_type_test_results m
        WHERE m.teacher_id = ${actualTeacherId}
        GROUP BY m.test_id, m.test_name, m.academic_period_id, m.grade, m.class
        
        UNION ALL
        
        SELECT 
          'multiple_choice' as test_type,
          mc.test_id,
          mc.test_name,
          mc.academic_period_id,
          mc.grade,
          mc.class,
          COUNT(*) as result_count
        FROM multiple_choice_test_results mc
        WHERE mc.teacher_id = ${actualTeacherId}
        GROUP BY mc.test_id, mc.test_name, mc.academic_period_id, mc.grade, mc.class
        
        UNION ALL
        
        SELECT 
          'true_false' as test_type,
          tf.test_id,
          tf.test_name,
          tf.academic_period_id,
          tf.grade,
          tf.class,
          COUNT(*) as result_count
        FROM true_false_test_results tf
        WHERE tf.teacher_id = ${actualTeacherId}
        GROUP BY tf.test_id, tf.test_name, tf.academic_period_id, tf.grade, tf.class
        
        UNION ALL
        
        SELECT 
          'input' as test_type,
          i.test_id,
          i.test_name,
          i.academic_period_id,
          i.grade,
          i.class,
          COUNT(*) as result_count
        FROM input_test_results i
        WHERE i.teacher_id = ${actualTeacherId}
        GROUP BY i.test_id, i.test_name, i.academic_period_id, i.grade, i.class
        
        UNION ALL
        
        SELECT 
          'word_matching' as test_type,
          w.test_id,
          w.test_name,
          w.academic_period_id,
          w.grade,
          w.class,
          COUNT(*) as result_count
        FROM word_matching_test_results w
        WHERE w.teacher_id = ${actualTeacherId}
        GROUP BY w.test_id, w.test_name, w.academic_period_id, w.grade, w.class
        
        UNION ALL
        
        SELECT 
          'drawing' as test_type,
          d.test_id,
          d.test_name,
          d.academic_period_id,
          d.grade,
          d.class,
          COUNT(*) as result_count
        FROM drawing_test_results d
        WHERE d.teacher_id = ${actualTeacherId}
        GROUP BY d.test_id, d.test_name, d.academic_period_id, d.grade, d.class
        
        UNION ALL
        
        SELECT 
          'fill_blanks' as test_type,
          fb.test_id,
          fb.test_name,
          fb.academic_period_id,
          fb.grade,
          fb.class,
          COUNT(*) as result_count
        FROM fill_blanks_test_results fb
        WHERE fb.teacher_id = ${actualTeacherId}
        GROUP BY fb.test_id, fb.test_name, fb.academic_period_id, fb.grade, fb.class
        
        ORDER BY test_type, test_id
      `;
      
      console.log('🔍 Debug: All results for this teacher:', debugResults);
    }
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        results,
        students,
        count: results.length,
        student_count: students.length,
        teacher_id: actualTeacherId,
        grade,
        class: className,
        semester,
        academic_period_id
      })
    };
  } catch (error) {
    console.error('Error fetching teacher student results:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
