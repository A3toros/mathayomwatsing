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
    const retestId = parseInt(qs.retest_id);
    if (!retestId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'retest_id is required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const rows = await sql`
      SELECT rt.*, u.name, u.surname, u.nickname
      FROM retest_targets rt
      JOIN users u ON u.student_id = rt.student_id
      WHERE rt.retest_assignment_id = ${retestId}
      ORDER BY u.surname, u.name
    `;

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, targets: rows }) };
  } catch (error) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


