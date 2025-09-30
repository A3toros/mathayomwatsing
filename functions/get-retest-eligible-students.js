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
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
    }

    const qs = event.queryStringParameters || {};
    const { test_type, original_test_id, threshold = 50 } = qs;
    if (!test_type || !original_test_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing test_type or original_test_id' }) };
    }

    // For MVP, compute eligibility using test_attempts (best score per student for that test)
    const sql = neon(process.env.NEON_DATABASE_URL);
    const rows = await sql`
      WITH best AS (
        SELECT student_id, MAX(percentage) AS best_percentage
        FROM test_attempts
        WHERE test_id = ${parseInt(original_test_id)}
        GROUP BY student_id
      )
      SELECT b.student_id, u.name, u.surname, u.nickname, b.best_percentage
      FROM best b
      JOIN users u ON u.student_id = b.student_id
      WHERE b.best_percentage < ${Number(threshold)}
      ORDER BY b.best_percentage ASC
    `;

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, students: rows }) };
  } catch (error) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


