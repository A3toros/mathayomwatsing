const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { userId } = data;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: "User ID required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Get comprehensive personal cabinet data - simplified to match actual schema
    const result = await client.query(`
      SELECT 
        u.id as user_id,
        u.nickname,
        u.student_id,
        u.grade_level,
        u.class_name,
        test.id as test_id,
        test.name as test_name,
        test.description as test_description,
        test.test_type,
        test.test_url,
        test.max_score,
        test.duration_minutes,
        test.start_date as test_start,
        test.end_date as test_end,
        test.is_active as test_active,
        test.term as term_number,
        tr.score,
        tr.completed,
        tr.submitted_at,
        tr.answers
      FROM users u
      JOIN tests test ON test.grade_level = u.grade_level
      LEFT JOIN test_results tr ON u.id = tr.user_id AND test.id = tr.test_id
      WHERE u.id = $1
      ORDER BY test.term, test.test_number
    `, [userId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "User not found" })
      };
    }

    // Get current active test (most recent upcoming or current test) - simplified
    const currentTestResult = await client.query(`
      SELECT 
        test.id,
        test.name,
        test.description,
        test.test_url,
        test.max_score,
        test.duration_minutes,
        test.start_date,
        test.end_date,
        'Term ' || test.term as term_name,
        'Semester 1' as semester_name
      FROM tests test
      WHERE test.grade_level = (SELECT grade_level FROM users WHERE id = $1)
        AND test.is_active = true
        AND test.start_date <= NOW()
        AND test.end_date >= NOW()
        AND test.id NOT IN (
          SELECT test_id FROM test_results WHERE user_id = $1 AND completed = true
        )
      ORDER BY test.start_date ASC
      LIMIT 1
    `, [userId]);

    // Organize data by term (simplified structure)
    const personalCabinet = {
      user: {
        id: result.rows[0].user_id,
        nickname: result.rows[0].nickname,
        student_id: result.rows[0].student_id,
        grade_level: result.rows[0].grade_level,
        class_name: result.rows[0].class_name
      },
      current_test: currentTestResult.rows[0] || null,
      semesters: [{
        id: 1,
        name: 'Semester 1',
        academic_year: '2024-2025',
        is_active: true,
        terms: {}
      }]
    };

    // Process results and organize by term
    result.rows.forEach(row => {
      const termKey = `term_${row.term_number}`;
      
      if (!personalCabinet.semesters[0].terms[termKey]) {
        personalCabinet.semesters[0].terms[termKey] = {
          id: row.term_number,
          name: `Term ${row.term_number}`,
          term_number: row.term_number,
          is_active: true,
          tests: []
        };
      }
      
      // Add test to term
      const testData = {
        id: row.test_id,
        name: row.test_name,
        description: row.test_description,
        test_type: row.test_type,
        test_url: row.test_url,
        max_score: row.max_score,
        duration_minutes: row.duration_minutes,
        start_date: row.test_start,
        end_date: row.test_end,
        is_active: row.test_active,
        status: row.completed ? 'completed' : 
                (row.test_start <= new Date() && row.test_end >= new Date()) ? 'current' : 'upcoming',
        score: row.score || null,
        completed: row.completed || false,
        submitted_at: row.submitted_at,
        answers: row.answers
      };
      
      personalCabinet.semesters[0].terms[termKey].tests.push(testData);
    });

    // Convert to array format for easier frontend handling
    const semestersArray = personalCabinet.semesters.map(semester => ({
      ...semester,
      terms: Object.values(semester.terms).map(term => ({
        ...term,
        tests: term.tests.sort((a, b) => a.test_number - b.test_number)
      })).sort((a, b) => a.term_number - b.term_number)
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        personal_cabinet: {
          ...personalCabinet,
          semesters: semestersArray
        }
      })
    };

  } catch (error) {
    console.error("Database error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Failed to fetch personal cabinet" }) };
  } finally {
    await client.end();
  }
}
