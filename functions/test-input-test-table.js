const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== test-input-test-table function called ===');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Test 1: Check if input_test_results table exists
    console.log('Testing 1: Checking if input_test_results table exists...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'input_test_results'
      );
    `;
    
    console.log('Table exists check result:', tableExists);

    if (!tableExists[0].exists) {
      console.log('input_test_results table does not exist!');
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'input_test_results table does not exist',
          message: 'The table input_test_results is missing from the database'
        })
      };
    }

    // Test 2: Check table structure
    console.log('Testing 2: Checking table structure...');
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'input_test_results'
      ORDER BY ordinal_position;
    `;
    
    console.log('Table structure:', tableStructure);

    // Test 3: Count existing records
    console.log('Testing 3: Counting existing records...');
    const recordCount = await sql`
      SELECT COUNT(*) as count FROM input_test_results;
    `;
    
    console.log('Record count:', recordCount);

    // Test 4: Try to insert a test record and then delete it
    console.log('Testing 4: Testing insert/delete operations...');
    const testRecord = {
      test_id: 1,
      test_name: 'Test Input Test',
      teacher_id: 1,
      subject_id: 1,
      student_id: 'TEST123',
      grade: 1,
      class: 15,
      number: 1,
      name: 'Test',
      surname: 'Student',
      nickname: 'Test Student',
      score: 0,
      max_score: 10,
      answers: JSON.stringify({ test: 'data' }),
      time_taken: 300,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      caught_cheating: false,
      visibility_change_times: 0,
      is_completed: true,
      academic_period_id: 1
    };

    const insertResult = await sql`
      INSERT INTO input_test_results 
      (test_id, test_name, teacher_id, subject_id, student_id, grade, class, number, name, surname, nickname, score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, academic_period_id, created_at)
      VALUES (${testRecord.test_id}, ${testRecord.test_name}, ${testRecord.teacher_id}, ${testRecord.subject_id}, ${testRecord.student_id}, ${testRecord.grade}, ${testRecord.class}, 
              ${testRecord.number}, ${testRecord.name}, ${testRecord.surname}, ${testRecord.nickname}, ${testRecord.score}, 
              ${testRecord.max_score}, ${testRecord.answers}, ${testRecord.time_taken}, ${testRecord.started_at}, ${testRecord.submitted_at}, 
              ${testRecord.caught_cheating}, ${testRecord.visibility_change_times}, ${testRecord.is_completed}, ${testRecord.academic_period_id}, NOW())
      RETURNING id;
    `;
    
    console.log('Insert test result:', insertResult);
    const insertedId = insertResult[0].id;

    // Delete the test record
    const deleteResult = await sql`
      DELETE FROM input_test_results WHERE id = ${insertedId};
    `;
    
    console.log('Delete test result:', deleteResult);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'input_test_results table is working correctly',
        table_exists: true,
        table_structure: tableStructure,
        record_count: recordCount[0].count,
        insert_test_passed: true,
        delete_test_passed: true
      })
    };

  } catch (error) {
    console.error('Error testing input_test_results table:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false,
        error: 'Database error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
