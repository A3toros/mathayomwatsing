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
    console.log('Delete test data function called with event:', JSON.stringify(event, null, 2));
    
    const { startDate, endDate, teacherId, grades, classes, subjectId } = JSON.parse(event.body);
    console.log('Parsed request data:', { startDate, endDate, teacherId, grades, classes, subjectId });

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

    // Check if database URL is available
    if (!process.env.NEON_DATABASE_URL) {
      console.error('NEON_DATABASE_URL environment variable is not set');
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Database configuration error',
          error: 'NEON_DATABASE_URL not configured'
        })
      };
    }

    console.log('Initializing database connection...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection initialized');

    // Test database connection
    try {
      await sql`SELECT 1 as test`;
      console.log('Database connection test successful');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Database connection failed',
          error: dbError.message
        })
      };
    }

    // Start transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started');

    try {
      let totalDeleted = 0;
      let deletionSummary = {};

      // Helper function to delete from a table with teacher filtering
      const deleteFromTableWithTeacher = async (tableName, dateColumn, teacherTableName) => {
        console.log(`Deleting from ${tableName} with teacher filter...`);
        const query = `
          DELETE FROM ${tableName} 
          WHERE ${dateColumn} BETWEEN ${startDate} AND ${endDate}
          AND test_id IN (
            SELECT id FROM ${teacherTableName} 
            WHERE teacher_id = ${teacherId}
          )
        `;
        
        console.log(`Executing query: ${query}`);
        const result = await sql.unsafe(query);
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
        return result.rowCount;
      };

      // Helper function to delete from results tables with grade/class filtering
      // Note: Only matching_type_test_results has test_id, others don't
      const deleteFromResultsTable = async (tableName, dateColumn, teacherTableName, hasTestId = false) => {
        console.log(`Deleting from ${tableName} (hasTestId: ${hasTestId})...`);
        let whereConditions = [`${dateColumn} BETWEEN ${startDate} AND ${endDate}`];

        if (hasTestId) {
          // For matching_type_test_results, filter by test_id
          whereConditions.push(`test_id IN (
            SELECT id FROM ${teacherTableName} 
            WHERE teacher_id = ${teacherId}
          )`);
        } else {
          // For other results tables, we can't filter by teacher directly
          // We'll delete based on date and grade/class only
          console.log(`Warning: ${tableName} has no test_id, cannot filter by teacher`);
        }

        if (grades && grades.length > 0) {
          whereConditions.push(`grade = ANY(${grades})`);
        }

        if (classes && classes.length > 0) {
          whereConditions.push(`class = ANY(${classes})`);
        }

        const query = `
          DELETE FROM ${tableName} 
          WHERE ${whereConditions.join(' AND ')}
        `;

        console.log(`Executing query: ${query}`);
        const result = await sql.unsafe(query);
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
        return result.rowCount;
      };

      // Helper function to delete test assignments
      const deleteTestAssignments = async () => {
        console.log('Deleting test assignments...');
        let whereConditions = [`ta.assigned_at BETWEEN ${startDate} AND ${endDate}`];

        // Filter by teacher through the test tables
        whereConditions.push(`(
          (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
          OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
          OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
          OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
        )`);

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

        console.log(`Executing query: ${query}`);
        const result = await sql.unsafe(query);
        console.log(`Deleted ${result.rowCount} test assignments`);
        return result.rowCount;
      };

      // 1. DELETE MULTIPLE CHOICE TEST DATA
      console.log('=== Starting Multiple Choice Test Deletion ===');
      deletionSummary.multipleChoice = {};
      
      // Delete questions
      deletionSummary.multipleChoice.questions = await deleteFromTableWithTeacher(
        'multiple_choice_test_questions', 
        'created_at', 
        'multiple_choice_tests'
      );
      
      // Delete results (no test_id, so no teacher filtering)
      deletionSummary.multipleChoice.results = await deleteFromResultsTable(
        'multiple_choice_test_results', 
        'created_at', 
        'multiple_choice_tests',
        false // hasTestId = false
      );
      
      totalDeleted += deletionSummary.multipleChoice.questions + deletionSummary.multipleChoice.results;

      // 2. DELETE TRUE/FALSE TEST DATA
      console.log('=== Starting True/False Test Deletion ===');
      deletionSummary.trueFalse = {};
      
      // Delete questions
      deletionSummary.trueFalse.questions = await deleteFromTableWithTeacher(
        'true_false_test_questions', 
        'created_at', 
        'true_false_tests'
      );
      
      // Delete results (no test_id, so no teacher filtering)
      deletionSummary.trueFalse.results = await deleteFromResultsTable(
        'true_false_test_results', 
        'created_at', 
        'true_false_tests',
        false // hasTestId = false
      );
      
      totalDeleted += deletionSummary.trueFalse.questions + deletionSummary.trueFalse.results;

      // 3. DELETE INPUT TEST DATA
      console.log('=== Starting Input Test Deletion ===');
      deletionSummary.input = {};
      
      // Delete questions
      deletionSummary.input.questions = await deleteFromTableWithTeacher(
        'input_test_questions', 
        'created_at', 
        'input_tests'
      );
      
      // Delete results (no test_id, so no teacher filtering)
      deletionSummary.input.results = await deleteFromResultsTable(
        'input_test_results', 
        'created_at', 
        'input_tests',
        false // hasTestId = false
      );
      
      totalDeleted += deletionSummary.input.questions + deletionSummary.input.results;

      // 4. DELETE MATCHING TYPE TEST DATA
      console.log('=== Starting Matching Type Test Deletion ===');
      deletionSummary.matching = {};
      
      // Delete arrows first (due to foreign key constraints)
      deletionSummary.matching.arrows = await deleteFromTableWithTeacher(
        'matching_type_test_arrows', 
        'created_at', 
        'matching_type_tests'
      );
      
      // Delete questions
      deletionSummary.matching.questions = await deleteFromTableWithTeacher(
        'matching_type_test_questions', 
        'created_at', 
        'matching_type_tests'
      );
      
      // Delete results (has test_id, so can filter by teacher)
      deletionSummary.matching.results = await deleteFromResultsTable(
        'matching_type_test_results', 
        'created_at', 
        'matching_type_tests',
        true // hasTestId = true
      );
      
      totalDeleted += deletionSummary.matching.arrows + deletionSummary.matching.questions + deletionSummary.matching.results;

      // Delete test assignments
      console.log('=== Starting Test Assignment Deletion ===');
      deletionSummary.testAssignments = await deleteTestAssignments();
      totalDeleted += deletionSummary.testAssignments;

      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      console.log('Deletion summary:', deletionSummary);
      console.log('Total deleted:', totalDeleted);
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Successfully deleted ${totalDeleted} test records and assignments`,
          deletedCount: totalDeleted,
          summary: deletionSummary
        })
      };
    } catch (error) {
      // Rollback on error
      console.error('Error during deletion, rolling back transaction:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
  } catch (error) {
    console.error('Delete test data error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete test data',
        error: error.message
      })
    };
  }
};
