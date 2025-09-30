const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔄 Starting materialized view refresh...');
    
    // Refresh the materialized view to update with latest data
    await sql`REFRESH MATERIALIZED VIEW class_summary_view`;
    
    console.log('✅ Materialized view refreshed successfully');
    
    // Get current semester info for confirmation
    const currentSemester = await sql`
      SELECT 
        academic_year,
        semester,
        start_date,
        end_date
      FROM academic_year 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      LIMIT 1
    `;
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Materialized view refreshed successfully',
        current_semester: currentSemester.length > 0 ? currentSemester[0] : null,
        refreshed_at: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Refresh materialized view error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to refresh materialized view',
        error: error.message
      })
    };
  }
};