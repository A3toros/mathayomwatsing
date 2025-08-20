import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  // Simple admin gate using ADMIN_SECRET_KEY (default Ar2epach)
  const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'Ar2epach';
  const provided = (event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'] || '');
  if (provided !== ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        nickname VARCHAR(50) NOT NULL,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        grade_level INTEGER NOT NULL,
        class_name VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

    // Insert sample users directly into unified users table
    await client.query(`
      INSERT INTO users (username, password, nickname, student_id, grade_level, class_name) VALUES
      ('Munich', '48457', 'Munich', '48457', 6, '6/14'),
      ('Bright', '48458', 'Bright', '48458', 6, '6/14'),
      ('Don', '48461', 'Don', '48461', 6, '6/14')
      ON CONFLICT (username) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        student_id = EXCLUDED.student_id,
        grade_level = EXCLUDED.grade_level,
        class_name = EXCLUDED.class_name
    `);

    await client.query('COMMIT');

    const count = await client.query('SELECT COUNT(*)::int AS count FROM users');
    return { statusCode: 200, body: JSON.stringify({ success: true, users_count: count.rows[0].count }) };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) };
  } finally {
    try { await client.end(); } catch {}
  }
}


