const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  // Check admin authentication
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const token = authHeader.substring(7);
  const adminPassword = process.env.ADMIN_PASSWORD || "BigusDickus";
  
  // Simple token validation (admin:password in base64)
  const expectedToken = Buffer.from(`admin:${adminPassword}`).toString("base64");
  if (token !== expectedToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Get all test results with user and test information
    const result = await client.query(`
      SELECT 
        tr.id,
        tr.user_id,
        tr.test_id,
        tr.grade_level,
        tr.score,
        tr.completed,
        tr.submitted_at,
        t.name as test_name,
        t.max_score,
        u.nickname,
        u.class_name
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      JOIN users u ON tr.user_id = u.id
      ORDER BY tr.grade_level, u.class_name, u.nickname, t.name
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results: result.rows
      })
    };

  } catch (error) {
    console.error('Error fetching test results:', error);
    try { await client.end(); } catch {}
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch test results"
      })
    };
  }
};
