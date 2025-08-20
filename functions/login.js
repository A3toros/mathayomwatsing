import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body || "{}");

  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing username or password" }) };
  }

  // New login policy:
  // - username is the student's Nickname
  // - password is the Student ID
  const nicknameInput = String(username).trim();
  const studentIdInput = String(password).trim();

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Try grade-specific tables first
    const gradeTablesQuery = `
      SELECT id, nickname, student_id, class_name, 1 AS grade_level, 'grade_1' AS table_name FROM grade_1 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      UNION ALL
      SELECT id, nickname, student_id, class_name, 2 AS grade_level, 'grade_2' AS table_name FROM grade_2 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      UNION ALL
      SELECT id, nickname, student_id, class_name, 3 AS grade_level, 'grade_3' AS table_name FROM grade_3 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      UNION ALL
      SELECT id, nickname, student_id, class_name, 4 AS grade_level, 'grade_4' AS table_name FROM grade_4 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      UNION ALL
      SELECT id, nickname, student_id, class_name, 5 AS grade_level, 'grade_5' AS table_name FROM grade_5 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      UNION ALL
      SELECT id, nickname, student_id, class_name, 6 AS grade_level, 'grade_6' AS table_name FROM grade_6 WHERE LOWER(nickname)=LOWER($1) AND student_id=$2
      LIMIT 1
    `;

    let result;
    try {
      result = await client.query(gradeTablesQuery, [nicknameInput, studentIdInput]);
    } catch (e) {
      // If grade tables are not present, fall back to unified users table only
      result = { rows: [] };
    }

    if (result.rows.length === 0) {
      // Fall back to unified users table that supports nickname + student_id
      // This does NOT accept legacy username/pass like pass1, pass2
      try {
        const resUsers = await client.query(
          `SELECT id, nickname, student_id, class_name, grade_level FROM users WHERE LOWER(nickname)=LOWER($1) AND student_id=$2 LIMIT 1`,
          [nicknameInput, studentIdInput]
        );
        result = resUsers;
      } catch (e) {
        // If unified users table not compatible/missing columns, treat as not found
        result = { rows: [] };
      }
    }

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Invalid nickname or student ID" })
      };
    }

    const row = result.rows[0];

    // Best-effort upsert into unified users table when login succeeded via grade tables
    // This helps keep the unified users table populated for admin dashboards and joins
    try {
      const usernameUnified = row.nickname; // using nickname as username per policy
      const passwordUnified = row.student_id; // using student ID as password per policy
      const gradeLevelUnified = row.grade_level || null;
      const classNameUnified = row.class_name || null;

      await client.query(
        `INSERT INTO users (username, password, nickname, student_id, grade_level, class_name)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET
           nickname = EXCLUDED.nickname,
           student_id = EXCLUDED.student_id,
           grade_level = EXCLUDED.grade_level,
           class_name = EXCLUDED.class_name`,
        [usernameUnified, passwordUnified, row.nickname, row.student_id, gradeLevelUnified, classNameUnified]
      );
    } catch (e) {
      // Ignore if unified users table doesn't exist or has incompatible schema
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: row.id,
          nickname: row.nickname,
          number: null,
          submitted: false,
          answers: null,
          score: null,
          student_id: row.student_id,
          class_name: row.class_name || null,
          grade_level: row.grade_level || null
        }
      })
    };

  } catch (err) {
    console.error(err);
    try { await client.end(); } catch {}
    return { statusCode: 500, body: JSON.stringify({ success: false, error: "Server error" }) };
  }
}
