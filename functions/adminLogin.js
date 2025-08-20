const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const username = (body.username || "admin").trim();
  const password = String(body.password || "").trim();

  const envUsername = process.env.ADMIN_USERNAME || "admin";
  const envPassword = process.env.ADMIN_PASSWORD || "BigusDickus";

  // Build a stateless token derived from the effective password
  const buildToken = (pwd) => Buffer.from(`admin:${pwd}`).toString("base64");

  // First try database-backed admin if table exists; fallback to env credentials
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    try {
      const res = await client.query(
        "SELECT id FROM admins WHERE username=$1 AND password=$2 LIMIT 1",
        [username, password]
      );
      if (res.rows.length > 0) {
        const token = buildToken(password);
        return { statusCode: 200, body: JSON.stringify({ success: true, token }) };
      }
    } catch (e) {
      // admins table may not exist; ignore and fallback to env values
    }

    // Fallback to environment-based admin
    if (username === envUsername && password === envPassword) {
      const token = buildToken(envPassword);
      return { statusCode: 200, body: JSON.stringify({ success: true, token }) };
    }

    return { statusCode: 401, body: JSON.stringify({ success: false, error: "Invalid admin credentials" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: "Server error" }) };
  } finally {
    try { await client.end(); } catch {} 
  }
};


