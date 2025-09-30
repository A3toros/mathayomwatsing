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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get query parameters
    const { teacher_id, grade, class: className, semester, academic_year } = event.queryStringParameters || {};
    
    if (!teacher_id || !grade || !className || !semester || !academic_year) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters: teacher_id, grade, class, semester, academic_year'
        })
      };
    }

    // Query the materialized view for semester-based class summary
    const summary = await sql`
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
        AND grade = ${parseInt(grade.replace('M', ''))}
        AND class = ${parseInt(className)}
        AND academic_year = ${academic_year}
        AND semester = ${parseInt(semester)}
    `;

    if (summary.length === 0) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          summary: null,
          message: 'No performance data available for this class and semester'
        })
      };
    }

    const classSummary = summary[0];

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        summary: {
          id: classSummary.id,
          teacher_id: classSummary.teacher_id,
          subject_id: classSummary.subject_id,
          grade: classSummary.grade,
          class: classSummary.class,
          academic_year: classSummary.academic_year,
          semester: classSummary.semester,
          total_students: classSummary.total_students,
          total_tests: classSummary.total_tests,
          completed_tests: classSummary.completed_tests,
          average_class_score: parseFloat(classSummary.average_class_score) || 0,
          highest_score: classSummary.highest_score,
          lowest_score: classSummary.lowest_score,
          pass_rate: parseFloat(classSummary.pass_rate) || 0,
          cheating_incidents: classSummary.cheating_incidents,
          high_visibility_change_students: classSummary.high_visibility_change_students,
          last_test_date: classSummary.last_test_date,
          last_updated: classSummary.last_updated,
          created_at: classSummary.created_at,
          updated_at: classSummary.updated_at
        }
      })
    };
  } catch (error) {
    console.error('Get class summary semester error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve class summary data',
        error: error.message
      })
    };
  }
};