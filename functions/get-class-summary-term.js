/**
 * Get Class Summary by Term
 * 
 * Replaces semester-based class summary with term-based version.
 * Uses term_id instead of semester and academic_year parameters.
 * 
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} Response with class summary data for specific term
 */

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
    
    // Get query parameters - now using term_id instead of semester and academic_year
    const { teacher_id, grade, class: className, term_id } = event.queryStringParameters || {};
    
    if (!teacher_id || !grade || !className || !term_id) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters: teacher_id, grade, class, term_id'
        })
      };
    }

    // Get academic period information for the term
    const academicPeriod = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE id = ${parseInt(term_id)}
    `;

    if (academicPeriod.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Academic period not found'
        })
      };
    }

    const period = academicPeriod[0];

    // Query the materialized view for term-based class summary
    const summary = await sql`
      SELECT 
        id,
        teacher_id,
        subject_id,
        grade,
        class,
        academic_year,
        semester,
        term,
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
        AND academic_year = ${period.academic_year}
        AND semester = ${period.semester}
        AND term = ${period.term}
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
          message: 'No performance data available for this class and term',
          term_info: {
            id: period.id,
            academic_year: period.academic_year,
            semester: period.semester,
            term: period.term,
            start_date: period.start_date,
            end_date: period.end_date
          }
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
          term: classSummary.term,
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
        },
        term_info: {
          id: period.id,
          academic_year: period.academic_year,
          semester: period.semester,
          term: period.term,
          start_date: period.start_date,
          end_date: period.end_date
        }
      })
    };
  } catch (error) {
    console.error('Get class summary term error:', error);
    
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
