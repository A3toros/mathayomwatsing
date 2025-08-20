const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { userId, testId, score, answers, adminKey } = data;
  
  // Basic admin authentication (you might want to implement proper admin auth)
  const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'Ar2epach';
  if (adminKey !== ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  
  if (!userId || !testId || score === undefined) {
    return { statusCode: 400, body: JSON.stringify({ error: "User ID, Test ID, and Score required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Check if user and test exist
    const userCheck = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
    const testCheck = await client.query("SELECT id, test_type FROM tests WHERE id = $2", [testId]);

    if (userCheck.rows.length === 0) {
      throw new Error("User not found");
    }

    if (testCheck.rows.length === 0) {
      throw new Error("Test not found");
    }

    // Check if result already exists
    const existingResult = await client.query(
      "SELECT id FROM test_results WHERE user_id = $1 AND test_id = $2",
      [userId, testId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing result
      await client.query(
        "UPDATE test_results SET score = $1, answers = $2, completed = TRUE, submitted_at = NOW() WHERE user_id = $3 AND test_id = $4",
        [score, answers || null, userId, testId]
      );
    } else {
      // Insert new result
      await client.query(
        "INSERT INTO test_results (user_id, test_id, score, answers, completed, submitted_at) VALUES ($1, $2, $3, $4, TRUE, NOW())",
        [userId, testId, score, answers || null]
      );
    }

    await client.query('COMMIT');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Offline test result added successfully",
        result: {
          user_id: userId,
          test_id: testId,
          score: score,
          completed: true
        }
      })
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Database error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Failed to add offline result" }) };
  } finally {
    await client.end();
  }
}
