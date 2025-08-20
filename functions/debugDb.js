const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check if tables exist and have data
    const tables = ['users', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'test_results'];
    const results = {};

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        results[table] = result.rows[0].count;
      } catch (e) {
        results[table] = `Error: ${e.message}`;
      }
    }

    // Check specific student data
    let sampleStudents = [];
    try {
      const studentResult = await client.query(`
        SELECT username, nickname, student_id, grade_level, class_name 
        FROM users 
        LIMIT 5
      `);
      sampleStudents = studentResult.rows;
    } catch (e) {
      sampleStudents = `Error: ${e.message}`;
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tableCounts: results,
        sampleStudents: sampleStudents,
        message: "Database debug information"
      })
    };

  } catch (error) {
    console.error('Database debug error:', error);
    try { await client.end(); } catch {}
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};


