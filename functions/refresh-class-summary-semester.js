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
    
    // No DB-based period detection here; frontend provides term context when needed
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Materialized view refreshed successfully',
        current_semester: null,
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