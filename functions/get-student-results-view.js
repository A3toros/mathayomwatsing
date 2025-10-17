const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // CORS headers
  const allowedOrigins = [
    'https://mathayomwatsing.netlify.app',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:19000'
  ];
  
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const { student_id, academic_period_id } = event.queryStringParameters;
    
    if (!student_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: student_id' 
        })
      };
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "created_at,id")
    let cursorCreatedAt, cursorId;
    if (cursor) {
      const [createdAtStr, idStr] = cursor.split(',');
      cursorCreatedAt = new Date(createdAtStr);
      cursorId = parseInt(idStr);
    }

    // Build query based on whether academic_period_id is provided with keyset pagination
    let results;
    if (academic_period_id) {
      if (cursor) {
        results = await sql`
          SELECT * FROM student_results_view 
          WHERE student_id = ${student_id}
          AND academic_period_id = ${academic_period_id}
          AND (created_at, id) < (${cursorCreatedAt}, ${cursorId})
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit}
        `;
      } else {
        results = await sql`
          SELECT * FROM student_results_view 
          WHERE student_id = ${student_id}
          AND academic_period_id = ${academic_period_id}
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit}
        `;
      }
    } else {
      // Get academic period ID from frontend (no database query needed)
      const { academic_period_id } = event.queryStringParameters;
      
      if (academic_period_id) {
        if (cursor) {
          results = await sql`
            SELECT * FROM student_results_view 
            WHERE student_id = ${student_id}
            AND academic_period_id = ${academic_period_id}
            AND (created_at, id) < (${cursorCreatedAt}, ${cursorId})
            ORDER BY created_at DESC, id DESC
            LIMIT ${limit}
          `;
        } else {
          results = await sql`
            SELECT * FROM student_results_view 
            WHERE student_id = ${student_id}
            AND academic_period_id = ${academic_period_id}
            ORDER BY created_at DESC, id DESC
            LIMIT ${limit}
          `;
        }
      } else {
        // If no current period, get all results for the student
        if (cursor) {
          results = await sql`
            SELECT * FROM student_results_view 
            WHERE student_id = ${student_id}
            AND (created_at, id) < (${cursorCreatedAt}, ${cursorId})
            ORDER BY created_at DESC, id DESC
            LIMIT ${limit}
          `;
        } else {
          results = await sql`
            SELECT * FROM student_results_view 
            WHERE student_id = ${student_id}
            ORDER BY created_at DESC, id DESC
            LIMIT ${limit}
          `;
        }
      }
    }
    
    // Generate next cursor for pagination
    let nextCursor = null;
    if (results.length === limit && results.length > 0) {
      const lastResult = results[results.length - 1];
      nextCursor = `${lastResult.created_at.toISOString()},${lastResult.id}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ results });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({ 
        success: true, 
        results,
        pagination: {
          limit,
          has_more: results.length === limit,
          next_cursor: nextCursor
        }
      })
    };
  } catch (error) {
    console.error('Error fetching student results view:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
