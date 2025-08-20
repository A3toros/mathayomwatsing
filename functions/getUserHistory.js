import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { userId } = data;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: "User ID required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Get user's test history
    const result = await client.query(
      "SELECT id, username, nickname, number, submitted, score, answers, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "User not found" })
      };
    }

    const user = result.rows[0];
    
    // Format the test data
    const tests = [];
    if (user.submitted) {
      tests.push({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        number: user.number,
        submitted: user.submitted,
        score: user.score,
        answers: user.answers,
        submitted_at: user.created_at
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tests: tests,
        user: {
          id: user.id,
          nickname: user.nickname,
          number: user.number
        }
      })
    };

  } catch (error) {
    console.error("Database error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Failed to fetch user history" }) };
  } finally {
    await client.end();
  }
}
