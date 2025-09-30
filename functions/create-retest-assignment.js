const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const result = validateToken(event);
    if (!result.success) {
      return { statusCode: result.statusCode || 401, headers, body: JSON.stringify({ success: false, error: result.error }) };
    }
    const user = result.user;
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
    }

    const payload = JSON.parse(event.body || '{}');
    const {
      test_type,
      original_test_id: test_id,
      teacher_id,
      subject_id,
      grade,
      class: className,
      student_ids,
      passing_threshold = 50.0,
      scoring_policy = 'BEST',
      max_attempts = 1,
      window_start,
      window_end
    } = payload;

    if (!test_type || !test_id || !subject_id || !grade || !className || !Array.isArray(student_ids) || student_ids.length === 0 || !window_start || !window_end) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing required fields' }) };
    }

    const effectiveTeacherId = user.role === 'admin' ? (teacher_id || user.teacher_id) : user.teacher_id;
    if (!effectiveTeacherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'teacher_id is required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    await sql`BEGIN`;
    const insertAssignment = await sql`
      INSERT INTO retest_assignments(
        test_type, test_id, teacher_id, subject_id, grade, class, passing_threshold, scoring_policy, max_attempts, window_start, window_end
      ) VALUES (
        ${test_type}, ${test_id}, ${effectiveTeacherId}, ${subject_id}, ${grade}, ${className}, ${passing_threshold}, ${scoring_policy}, ${max_attempts}, ${window_start}, ${window_end}
      ) RETURNING id
    `;
    const retestId = insertAssignment[0].id;

    for (const sid of student_ids) {
      await sql`
        INSERT INTO retest_targets(retest_assignment_id, student_id)
        VALUES(${retestId}, ${sid})
        ON CONFLICT (retest_assignment_id, student_id) DO NOTHING
      `;
      // Mark retest offered in the student's original result row(s)
      await sql`SELECT set_retest_offered(${sid}, ${test_id}, true)`;
    }

    // Clear completion keys for students who will get retests
    // This allows them to retake the test even if they previously completed it
    console.log('Clearing completion keys for retest students:', student_ids);
    for (const sid of student_ids) {
      // We can't directly clear localStorage from backend, but we can:
      // 1. Set a flag in the database that the frontend can check
      // 2. Or rely on the retest_available flag to override completion status
      // For now, we'll rely on the retest_available flag approach
      console.log(`Retest created for student ${sid} on test ${test_type}_${test_id}`);
    }

    await sql`COMMIT`;

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, retest_id: retestId }) };
  } catch (error) {
    try { const sql = neon(process.env.NEON_DATABASE_URL); await sql`ROLLBACK`; } catch (e) {}
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


