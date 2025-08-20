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

    // Get all students from the users table
    const result = await client.query(`
      SELECT id, username, nickname, student_id, grade_level, class_name, first_name, last_name
      FROM users 
      ORDER BY grade_level, class_name, nickname
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        students: result.rows
      })
    };

  } catch (error) {
    console.error('Error fetching students:', error);
    try { await client.end(); } catch {}
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Failed to fetch students"
      })
    };
  }
};
