import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const dbInfo = await client.query("select current_database() as db, current_user as user");
    const usersCount = await client.query("SELECT COUNT(*)::int AS count FROM users");
    let grade6Count = { rows: [{ count: 0 }] };
    try {
      grade6Count = await client.query("SELECT COUNT(*)::int AS count FROM grade_6");
    } catch (e) {}

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        database: dbInfo.rows[0].db,
        db_user: dbInfo.rows[0].user,
        counts: {
          users: usersCount.rows[0].count,
          grade_6: grade6Count.rows[0].count
        }
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) };
  } finally {
    try { await client.end(); } catch {}
  }
}


