const { Client } = require("pg");

exports.handler = async (event) => {
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

    // Ensure users table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        nickname VARCHAR(50),
        student_id VARCHAR(20),
        grade_level INTEGER,
        class_name VARCHAR(20),
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

    // Discover existing columns to build a compatible INSERT
    const columnsRes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    const existingColumns = new Set(columnsRes.rows.map(r => r.column_name));

    // Base columns always included
    const baseColumns = ['username', 'password'];
    const optionalColumns = ['nickname', 'student_id', 'grade_level', 'class_name', 'number', 'submitted', 'score', 'answers'];
    const insertColumns = [...baseColumns, ...optionalColumns.filter(c => existingColumns.has(c))];

    const rowsToInsert = [
      { username: 'Munich', password: '48457', nickname: 'Munich', student_id: '48457', grade_level: 6, class_name: '6/14', number: 1, submitted: false, score: null, answers: null },
      { username: 'Bright', password: '48458', nickname: 'Bright', student_id: '48458', grade_level: 6, class_name: '6/14', number: 2, submitted: false, score: null, answers: null },
      { username: 'Don',    password: '48461', nickname: 'Don',    student_id: '48461', grade_level: 6, class_name: '6/14', number: 3, submitted: false, score: null, answers: null }
    ];

    const valuesPlaceholders = (idxOffset, numCols) => '(' + Array.from({ length: numCols }, (_, i) => `$${idxOffset + i + 1}`).join(', ') + ')';

    const allValues = [];
    const valueTuples = rowsToInsert.map((row, rowIdx) => {
      const vals = insertColumns.map(col => row[col]);
      allValues.push(...vals);
      return valuesPlaceholders(rowIdx * insertColumns.length, insertColumns.length);
    });

    const onConflictSet = insertColumns
      .filter(c => c !== 'username' && c !== 'password')
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(', ');

    const insertSql = `
      INSERT INTO users (${insertColumns.join(', ')}) VALUES
      ${valueTuples.join(', ')}
      ON CONFLICT (username) DO UPDATE SET ${onConflictSet || 'username = EXCLUDED.username'}
    `;

    await client.query(insertSql, allValues);

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


