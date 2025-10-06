const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Build query based on whether academic_period_id is provided
    let results;
    if (academic_period_id) {
      results = await sql`
        SELECT * FROM student_results_view 
        WHERE student_id = ${student_id}
        AND academic_period_id = ${academic_period_id}
        ORDER BY test_name, created_at DESC
      `;
    } else {
      // Get academic period ID from frontend (no database query needed)
      const { academic_period_id } = event.queryStringParameters;
      
      if (academic_period_id) {
        results = await sql`
          SELECT * FROM student_results_view 
          WHERE student_id = ${student_id}
          AND academic_period_id = ${academic_period_id}
          ORDER BY test_name, created_at DESC
        `;
      } else {
        // If no current period, get all results for the student
        results = await sql`
          SELECT * FROM student_results_view 
          WHERE student_id = ${student_id}
          ORDER BY test_name, created_at DESC
        `;
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results })
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
