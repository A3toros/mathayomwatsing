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

  if (event.httpMethod !== 'GET') {
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

    // Validate role - only teachers and admins can access class summaries
    if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Teacher or admin role required.'
        })
      };
    }

    const { teacher_id, grade, class: className, semester, academic_year } = event.queryStringParameters;

    // Validate required parameters
    if (!teacher_id || !grade || !className || !semester || !academic_year) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: teacher_id, grade, class, semester, academic_year'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Query the semester-based materialized view
    const result = await sql`
      SELECT 
        id,
        teacher_id,
        subject_id,
        grade,
        class,
        academic_year,
        semester,
        total_students,
        total_tests,
        completed_tests,
        average_class_score,
        highest_score,
        lowest_score,
        pass_rate,
        cheating_incidents,
        high_visibility_change_students,
        last_test_date,
        last_updated,
        created_at,
        updated_at
      FROM class_summary_view 
      WHERE teacher_id = ${teacher_id}
      AND grade = ${grade}
      AND class = ${className}
      AND academic_year = ${academic_year}
      AND semester = ${parseInt(semester)}
    `;

    if (result.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          summary: null,
          message: 'No performance data available for this class and semester'
        })
      };
    }

    const summary = result[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        summary: {
          id: summary.id,
          teacher_id: summary.teacher_id,
          subject_id: summary.subject_id,
          grade: summary.grade,
          class: summary.class,
          academic_year: summary.academic_year,
          semester: summary.semester,
          total_students: summary.total_students,
          total_tests: summary.total_tests,
          completed_tests: summary.completed_tests,
          average_class_score: summary.average_class_score,
          highest_score: summary.highest_score,
          lowest_score: summary.lowest_score,
          pass_rate: summary.pass_rate,
          cheating_incidents: summary.cheating_incidents,
          high_visibility_change_students: summary.high_visibility_change_students,
          last_test_date: summary.last_test_date,
          last_updated: summary.last_updated
        }
      })
    };

  } catch (error) {
    console.error('Error fetching class summary:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
