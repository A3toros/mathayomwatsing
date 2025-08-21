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
    const tables = ['users', 'tests', 'test_results', 'test_visibility'];
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

    // Check sample test results
    let sampleTestResults = [];
    try {
      const testResultQuery = await client.query(`
        SELECT 
          u.nickname,
          u.grade_level,
          t.test_number,
          tr.score,
          tr.max_score,
          tr.completed
        FROM test_results tr
        JOIN users u ON tr.user_id = u.id
        JOIN tests t ON tr.test_id = t.id
        ORDER BY u.grade_level, u.nickname, t.test_number
        LIMIT 10
      `);
      sampleTestResults = testResultQuery.rows;
    } catch (e) {
      sampleTestResults = `Error: ${e.message}`;
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tableCounts: results,
        sampleStudents: sampleStudents,
        sampleTestResults: sampleTestResults,
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


