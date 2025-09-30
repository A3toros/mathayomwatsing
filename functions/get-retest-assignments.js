const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const result = validateToken(event);
    if (!result.success) {
      return { statusCode: result.statusCode || 401, headers, body: JSON.stringify({ success: false, error: result.error }) };
    }
    const user = result.user;
    const teacherId = (user.role === 'admin' ? (event.queryStringParameters?.teacher_id || user.teacher_id) : user.teacher_id);
    if (!teacherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'teacher_id required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const rows = await sql`
      SELECT ra.*, 
             COALESCE(SUM(CASE WHEN rt.status = 'PENDING' THEN 1 ELSE 0 END),0) AS pending_count,
             COALESCE(SUM(CASE WHEN rt.status = 'IN_PROGRESS' THEN 1 ELSE 0 END),0) AS in_progress_count,
             COALESCE(SUM(CASE WHEN rt.status = 'PASSED' THEN 1 ELSE 0 END),0) AS passed_count,
             COALESCE(SUM(CASE WHEN rt.status = 'FAILED' THEN 1 ELSE 0 END),0) AS failed_count,
             COALESCE(SUM(CASE WHEN rt.status = 'EXPIRED' THEN 1 ELSE 0 END),0) AS expired_count
      FROM retest_assignments ra
      LEFT JOIN retest_targets rt ON rt.retest_assignment_id = ra.id
      WHERE ra.teacher_id = ${teacherId}
      GROUP BY ra.id
      ORDER BY ra.created_at DESC
    `;

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, retests: rows }) };
  } catch (error) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


