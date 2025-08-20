import { Client } from "pg";

function isAuthorized(headers) {
  const auth = headers["authorization"] || headers["Authorization"] || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);
  // Token format is base64("admin:<password>")
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [, pwd] = decoded.split(":");
    const envPassword = process.env.ADMIN_PASSWORD || "BigusDickus";
    return Boolean(pwd) && (pwd === envPassword);
  } catch {
    return false;
  }
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  if (!isAuthorized(event.headers || {})) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Try unified schema first
    let rows = [];
    try {
      const res = await client.query(`
        SELECT 
          u.id,
          u.nickname,
          u.student_id,
          u.class_name,
          u.grade_level,
          COALESCE(tr.score, 0) AS score,
          COALESCE(tr.completed, false) AS completed,
          tr.submitted_at
        FROM users u
        LEFT JOIN test_results tr ON tr.user_id = u.id
        ORDER BY u.grade_level, u.class_name, u.nickname
      `);
      rows = res.rows;
    } catch (e) {
      rows = [];
    }

    // If unified table not available, aggregate from grade tables
    if (rows.length === 0) {
      const gradeTables = [1,2,3,4,5,6];
      const aggregated = [];
      for (const g of gradeTables) {
        try {
          const res = await client.query(`
            SELECT id, nickname, student_id, class_name, ${g} as grade_level
            FROM grade_${g}
            ORDER BY class_name, nickname
          `);
          for (const r of res.rows) {
            aggregated.push({
              id: r.id,
              nickname: r.nickname,
              student_id: r.student_id,
              class_name: r.class_name,
              grade_level: g,
              score: null,
              completed: false,
              submitted_at: null
            });
          }
        } catch (e) {
          // ignore missing table
        }
      }
      rows = aggregated;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, students: rows })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: "Server error" }) };
  } finally {
    try { await client.end(); } catch {}
  }
}


