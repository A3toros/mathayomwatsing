import { Client } from "pg";

export async function handler(event) {
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
    
    // Get comprehensive personal cabinet data
    const result = await client.query(`
      SELECT 
        u.id as user_id,
        u.nickname,
        u.student_id,
        u.grade_level,
        u.class_name,
        s.id as semester_id,
        s.name as semester_name,
        s.academic_year,
        s.is_active as semester_active,
        t.id as term_id,
        t.name as term_name,
        t.term_number,
        t.is_active as term_active,
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
        tr.score,
        tr.completed,
        tr.submitted_at,
        tr.answers
      FROM users u
      JOIN test_assignments ta ON u.id = ta.user_id
      JOIN tests test ON ta.test_id = test.id
      JOIN terms t ON test.term_id = t.id
      JOIN semesters s ON t.semester_id = s.id
      LEFT JOIN test_results tr ON u.id = tr.user_id AND test.id = tr.test_id
      WHERE u.id = $1
      ORDER BY s.id, t.term_number, test.start_date
    `, [userId]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: "User not found" })
      };
    }

    // Get current active test (most recent upcoming or current test)
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
        s.name as semester_name,
        t.name as term_name
      FROM tests test
      JOIN terms t ON test.term_id = t.id
      JOIN semesters s ON t.semester_id = s.id
      JOIN test_assignments ta ON test.id = ta.test_id
      WHERE ta.user_id = $1 
        AND test.is_active = true
        AND test.start_date <= NOW()
        AND test.end_date >= NOW()
        AND test.id NOT IN (
          SELECT test_id FROM test_results WHERE user_id = $1 AND completed = true
        )
      ORDER BY test.start_date ASC
      LIMIT 1
    `, [userId]);

    // Organize data by semester and term
    const personalCabinet = {
      user: {
        id: result.rows[0].user_id,
        nickname: result.rows[0].nickname,
        student_id: result.rows[0].student_id,
        grade_level: result.rows[0].grade_level,
        class_name: result.rows[0].class_name
      },
      current_test: currentTestResult.rows[0] || null,
      semesters: {}
    };

    // Process results and organize by semester/term
    result.rows.forEach(row => {
      const semesterKey = `semester_${row.semester_id}`;
      const termKey = `term_${row.term_id}`;
      
      if (!personalCabinet.semesters[semesterKey]) {
        personalCabinet.semesters[semesterKey] = {
          id: row.semester_id,
          name: row.semester_name,
          academic_year: row.academic_year,
          is_active: row.semester_active,
          terms: {}
        };
      }
      
      if (!personalCabinet.semesters[semesterKey].terms[termKey]) {
        personalCabinet.semesters[semesterKey].terms[termKey] = {
          id: row.term_id,
          name: row.term_name,
          term_number: row.term_number,
          is_active: row.term_active,
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
      
      personalCabinet.semesters[semesterKey].terms[termKey].tests.push(testData);
    });

    // Convert to array format for easier frontend handling
    const semestersArray = Object.values(personalCabinet.semesters).map(semester => ({
      ...semester,
      terms: Object.values(semester.terms).map(term => ({
        ...term,
        tests: term.tests.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      })).sort((a, b) => a.term_number - b.term_number)
    })).sort((a, b) => a.id - b.id);

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
