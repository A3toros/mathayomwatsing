const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
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
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role - only admin can refresh materialized views
    if (decoded.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Admin role required.'
        })
      };
    }

    console.log('🔄 Starting materialized view refresh...');
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Refresh the materialized view
    await sql`REFRESH MATERIALIZED VIEW class_summary_view`;
    
    console.log('✅ Materialized view refreshed successfully');
    
    // Get refresh statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT teacher_id) as unique_teachers,
        COUNT(DISTINCT academic_year) as unique_years,
        COUNT(DISTINCT semester) as unique_semesters
      FROM class_summary_view
    `;
    
    const statsData = stats[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Materialized view refreshed successfully',
        statistics: {
          total_records: statsData.total_records,
          unique_teachers: statsData.unique_teachers,
          unique_years: statsData.unique_years,
          unique_semesters: statsData.unique_semesters,
          refreshed_at: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Error refreshing materialized view:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to refresh materialized view',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
