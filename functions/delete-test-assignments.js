const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { startDate, endDate, teacherId, grades, classes, subjectId } = JSON.parse(event.body);

    if (!startDate || !endDate || !teacherId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Start date, end date, and teacher ID are required' 
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Build WHERE clause dynamically
    let whereConditions = ['ta.assigned_at BETWEEN ${startDate} AND ${endDate}'];
    let params = { startDate, endDate };

    if (teacherId) {
      whereConditions.push(`(
        (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
        OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
        OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
        OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
      )`);
    }

    if (grades && grades.length > 0) {
      whereConditions.push(`ta.grade = ANY(${grades})`);
    }

    if (classes && classes.length > 0) {
      whereConditions.push(`ta.class = ANY(${classes})`);
    }

    if (subjectId) {
      whereConditions.push(`ta.subject_id = ${subjectId}`);
    }

    const query = `
      DELETE FROM test_assignments ta
      WHERE ${whereConditions.join(' AND ')}
    `;

    const result = await sql.unsafe(query, params);
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Deleted ${result.rowCount} test assignments`,
        deletedCount: result.rowCount
      })
    };
  } catch (error) {
    console.error('Delete test assignments error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete test assignments',
        error: error.message
      })
    };
  }
};
