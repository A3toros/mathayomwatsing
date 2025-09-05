const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
    api_key: process.env.CLOUDINARY_URL.split('://')[1].split(':')[0],
    api_secret: process.env.CLOUDINARY_URL.split(':')[1].split('@')[0]
  });
}

// Helper function to delete Cloudinary images
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!process.env.CLOUDINARY_URL) {
      console.log('Cloudinary not configured, skipping image deletion:', imageUrl);
      return { success: false, reason: 'Cloudinary not configured' };
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_name.jpg
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      console.log('Invalid Cloudinary URL format, skipping:', imageUrl);
      return { success: false, reason: 'Invalid URL format' };
    }

    // Extract the public_id (everything after upload/version/folder/image)
    const publicIdParts = urlParts.slice(uploadIndex + 2);
    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
    
    console.log('Deleting Cloudinary image with public_id:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion result:', result);
    
    return { success: true, publicId, result };
  } catch (error) {
    console.error('Error deleting Cloudinary image:', error);
    return { success: false, error: error.message };
  }
};

exports.handler = async function(event, context) {
  console.log('=== DELETE TEST DATA FUNCTION CALLED ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event body:', event.body);
  console.log('DEBUG - Function entry point reached');
  
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

  // Add a test endpoint for debugging
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Function is working - this is a test response',
        method: event.httpMethod,
        timestamp: new Date().toISOString()
      })
    };
  }

  console.log('DEBUG - Checking HTTP method:', event.httpMethod);
  
  if (event.httpMethod !== 'DELETE') {
    console.log('DEBUG - Method not DELETE, returning 405');
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }
  
  console.log('DEBUG - Method is DELETE, proceeding with deletion');

  try {
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin
    if (userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin role required.' })
      };
    }

    console.log('=== DELETE TEST DATA FUNCTION STARTED ===');
    console.log('Event method:', event.httpMethod);
    console.log('Event body:', event.body);
    console.log('Event headers:', event.headers);
    console.log('Context:', JSON.stringify(context, null, 2));
    
    // Validate event.body exists
    if (!event.body) {
      console.error('No event.body received');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'No request body received',
          error: 'event.body is undefined'
        })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
      console.log('Successfully parsed JSON:', requestData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw event.body:', event.body);
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
          error: parseError.message,
          rawBody: event.body
        })
      };
    }
    
    const { startDate, endDate, teacherId, grades, classes, subjectId } = requestData;
    console.log('Parsed request data:', { startDate, endDate, teacherId, grades, classes, subjectId });
    console.log('DEBUG - Teacher ID details:');
    console.log('  - teacherId value:', teacherId);
    console.log('  - teacherId type:', typeof teacherId);
    console.log('  - teacherId length:', teacherId ? teacherId.length : 'null/undefined');
    console.log('  - teacherId === "":', teacherId === "");
    console.log('  - teacherId === null:', teacherId === null);
    console.log('  - teacherId === undefined:', teacherId === undefined);

    if (!startDate || !endDate || !teacherId) {
      console.log('Validation failed: missing required fields');
      console.log('DEBUG - Validation details:');
      console.log('  - startDate valid:', !!startDate);
      console.log('  - endDate valid:', !!endDate);
      console.log('  - teacherId valid:', !!teacherId);
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Start date, end date, and teacher ID are required',
          received: { startDate, endDate, teacherId, grades, classes, subjectId }
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

    console.log('Database URL available, length:', process.env.NEON_DATABASE_URL.length);
    console.log('Initializing database connection...');
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection initialized');

    // Test database connection
    try {
      console.log('Testing database connection...');
      const testResult = await sql`SELECT 1 as test`;
      console.log('Database connection test successful:', testResult);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Database connection failed',
          error: dbError.message,
          stack: dbError.stack
        })
      };
    }

    // Start transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started');
    
    // Debug: Check what tests exist for this teacher and date range
    console.log('=== DEBUG: Checking existing tests ===');
    console.log('DEBUG - About to run debug queries with:', { teacherId, startDate, endDate });
    console.log('DEBUG - Date types:', { 
      startDateType: typeof startDate, 
      endDateType: typeof endDate,
      startDateValue: startDate,
      endDateValue: endDate
    });
    try {
      const multipleChoiceTests = await sql`
        SELECT id, title, created_at, teacher_id 
        FROM multiple_choice_tests 
        WHERE teacher_id = ${teacherId} 
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `;
      console.log('Multiple Choice Tests found:', multipleChoiceTests.length, multipleChoiceTests);
      
      const trueFalseTests = await sql`
        SELECT id, title, created_at, teacher_id 
        FROM true_false_tests 
        WHERE teacher_id = ${teacherId} 
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `;
      console.log('True/False Tests found:', trueFalseTests.length, trueFalseTests);
      
      const inputTests = await sql`
        SELECT id, title, created_at, teacher_id 
        FROM input_tests 
        WHERE teacher_id = ${teacherId} 
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `;
      console.log('Input Tests found:', inputTests.length, inputTests);
      
      const matchingTests = await sql`
        SELECT id, title, created_at, teacher_id 
        FROM matching_type_tests 
        WHERE teacher_id = ${teacherId} 
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `;
      console.log('Matching Tests found:', matchingTests.length, matchingTests);
      
      // Check if teacher exists at all
      const teacherCheck = await sql`
        SELECT teacher_id, username 
        FROM teachers 
        WHERE teacher_id = ${teacherId}
      `;
      console.log('Teacher exists:', teacherCheck.length > 0, teacherCheck);
      
      // Check all tests for this teacher (any date)
      const allTestsForTeacher = await sql`
        SELECT 'multiple_choice' as type, id, title, created_at 
        FROM multiple_choice_tests 
        WHERE teacher_id = ${teacherId}
        UNION ALL
        SELECT 'true_false' as type, id, title, created_at 
        FROM true_false_tests 
        WHERE teacher_id = ${teacherId}
        UNION ALL
        SELECT 'input' as type, id, title, created_at 
        FROM input_tests 
        WHERE teacher_id = ${teacherId}
        UNION ALL
        SELECT 'matching' as type, id, title, created_at 
        FROM matching_type_tests 
        WHERE teacher_id = ${teacherId}
        ORDER BY created_at DESC
      `;
      console.log('All tests for teacher (any date):', allTestsForTeacher.length, allTestsForTeacher);
      
    } catch (debugError) {
      console.error('Debug query error:', debugError);
      console.error('Debug error stack:', debugError.stack);
    }
    console.log('=== DEBUG: Debug queries completed ===');

    try {
      let totalDeleted = 0;
      let deletionSummary = {};

      // Helper function to delete from a table with teacher filtering
      // Note: Question tables don't have created_at, so we'll use a different approach
      const deleteFromTableWithTeacher = async (tableName, teacherTableName) => {
        console.log(`Deleting from ${tableName} with teacher filter...`);
        
        // Since question tables don't have created_at, we'll delete all records for the teacher
        // This is safer than deleting without date filtering
        // Use conditional SQL building for dynamic table names
        let result;
        
        if (tableName === 'multiple_choice_test_questions') {
          result = await sql`
            DELETE FROM multiple_choice_test_questions 
            WHERE test_id IN (
              SELECT id FROM multiple_choice_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else if (tableName === 'true_false_test_questions') {
          result = await sql`
            DELETE FROM true_false_test_questions 
            WHERE test_id IN (
              SELECT id FROM true_false_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else if (tableName === 'input_test_questions') {
          result = await sql`
            DELETE FROM input_test_questions 
            WHERE test_id IN (
              SELECT id FROM input_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else {
          throw new Error(`Unsupported table name: ${tableName}`);
        }
        
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };

      // Helper function to delete from results tables with date filtering
      // Note: Results tables DO have created_at columns AND test_id columns
      const deleteFromResultsTable = async (tableName, teacherTableName) => {
        console.log(`Deleting from ${tableName}...`);
        
        // ALL results tables now have test_id columns (added via ALTER TABLE)
        // So we can filter by teacher for ALL test types
        // Use conditional SQL building for dynamic table names
        let result;
        
        if (tableName === 'multiple_choice_test_results') {
          result = await sql`
            DELETE FROM multiple_choice_test_results 
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
            AND test_id IN (
              SELECT id FROM multiple_choice_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else if (tableName === 'true_false_test_results') {
          result = await sql`
            DELETE FROM true_false_test_results 
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
            AND test_id IN (
              SELECT id FROM true_false_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else if (tableName === 'input_test_results') {
          result = await sql`
            DELETE FROM input_test_results 
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
            AND test_id IN (
              SELECT id FROM input_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else if (tableName === 'matching_type_test_results') {
          result = await sql`
            DELETE FROM matching_type_test_results 
            WHERE test_id IN (
              SELECT id FROM matching_type_tests 
              WHERE teacher_id = ${teacherId}
              AND created_at BETWEEN ${startDate} AND ${endDate}
            )
          `;
        } else {
          throw new Error(`Unsupported results table name: ${tableName}`);
        }
        
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };

      // Helper function to delete test assignments with date filtering
      const deleteTestAssignments = async () => {
        console.log('Deleting test assignments...');
        
        // Build the query with proper parameter binding
        let result;
        
        if (grades && grades.length > 0 && classes && classes.length > 0 && subjectId) {
          // All filters applied
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.grade = ANY(${grades})
            AND ta.class = ANY(${classes})
            AND ta.subject_id = ${subjectId}
          `;
        } else if (grades && grades.length > 0 && classes && classes.length > 0) {
          // Grades and classes filters
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.grade = ANY(${grades})
            AND ta.class = ANY(${classes})
          `;
        } else if (grades && grades.length > 0 && subjectId) {
          // Grades and subject filters
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.grade = ANY(${grades})
            AND ta.subject_id = ${subjectId}
          `;
        } else if (classes && classes.length > 0 && subjectId) {
          // Classes and subject filters
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.class = ANY(${classes})
            AND ta.subject_id = ${subjectId}
          `;
        } else if (grades && grades.length > 0) {
          // Only grades filter
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.grade = ANY(${grades})
          `;
        } else if (classes && classes.length > 0) {
          // Only classes filter
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.class = ANY(${classes})
          `;
        } else if (subjectId) {
          // Only subject filter
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
            AND ta.subject_id = ${subjectId}
          `;
        } else {
          // No additional filters
          result = await sql`
            DELETE FROM test_assignments ta
            WHERE ta.assigned_at BETWEEN ${startDate} AND ${endDate}
            AND (
              (ta.test_type = 'multiple_choice' AND EXISTS (SELECT 1 FROM multiple_choice_tests mct WHERE mct.id = ta.test_id AND mct.teacher_id = ${teacherId}))
              OR (ta.test_type = 'true_false' AND EXISTS (SELECT 1 FROM true_false_tests tft WHERE tft.id = ta.test_id AND tft.teacher_id = ${teacherId}))
              OR (ta.test_type = 'input' AND EXISTS (SELECT 1 FROM input_tests it WHERE it.id = ta.test_id AND it.teacher_id = ${teacherId}))
              OR (ta.test_type = 'matching_type' AND EXISTS (SELECT 1 FROM matching_type_tests mtt WHERE mtt.id = ta.test_id AND mtt.teacher_id = ${teacherId}))
            )
          `;
        }

        console.log(`Deleted ${result.rowCount} test assignments`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };

      // Helper function to delete from main test tables with date and teacher filtering
      const deleteFromMainTestTable = async (tableName) => {
        console.log(`Deleting from ${tableName} with date and teacher filter...`);
        let result;
        
        if (tableName === 'multiple_choice_tests') {
          result = await sql`
            DELETE FROM multiple_choice_tests 
            WHERE teacher_id = ${teacherId}
            AND created_at BETWEEN ${startDate} AND ${endDate}
          `;
        } else if (tableName === 'true_false_tests') {
          result = await sql`
            DELETE FROM true_false_tests 
            WHERE teacher_id = ${teacherId}
            AND created_at BETWEEN ${startDate} AND ${endDate}
          `;
        } else if (tableName === 'input_tests') {
          result = await sql`
            DELETE FROM input_tests 
            WHERE teacher_id = ${teacherId}
            AND created_at BETWEEN ${startDate} AND ${endDate}
          `;
        } else if (tableName === 'matching_type_tests') {
          result = await sql`
            DELETE FROM matching_type_tests 
            WHERE teacher_id = ${teacherId}
            AND created_at BETWEEN ${startDate} AND ${endDate}
          `;
        } else {
          throw new Error(`Unsupported table name: ${tableName}`);
        }
        
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };

      // 1. DELETE MULTIPLE CHOICE TEST DATA
      console.log('=== Starting Multiple Choice Test Deletion ===');
      deletionSummary.multipleChoice = {};
      
      // Delete results FIRST (has created_at column AND test_id column, so can filter by date AND teacher)
      // This must be done before deleting main tests to avoid foreign key constraint violations
      deletionSummary.multipleChoice.results = await deleteFromResultsTable(
        'multiple_choice_test_results', 
        'multiple_choice_tests'
      );
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.multipleChoice.questions = await deleteFromTableWithTeacher(
        'multiple_choice_test_questions', 
        'multiple_choice_tests'
      );
      
      // Delete main test records LAST (after all dependent records are deleted)
      deletionSummary.multipleChoice.tests = await deleteFromMainTestTable('multiple_choice_tests');
      
      totalDeleted += deletionSummary.multipleChoice.questions + deletionSummary.multipleChoice.results + deletionSummary.multipleChoice.tests;

      // 2. DELETE TRUE/FALSE TEST DATA
      console.log('=== Starting True/False Test Deletion ===');
      deletionSummary.trueFalse = {};
      
      // Delete results FIRST (has created_at column AND test_id column, so can filter by date AND teacher)
      // This must be done before deleting main tests to avoid foreign key constraint violations
      deletionSummary.trueFalse.results = await deleteFromResultsTable(
        'true_false_test_results', 
        'true_false_tests'
      );
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.trueFalse.questions = await deleteFromTableWithTeacher(
        'true_false_test_questions', 
        'true_false_tests'
      );
      
      // Delete main test records LAST (after all dependent records are deleted)
      deletionSummary.trueFalse.tests = await deleteFromMainTestTable('true_false_tests');
      
      totalDeleted += deletionSummary.trueFalse.questions + deletionSummary.trueFalse.results + deletionSummary.trueFalse.tests;

      // 3. DELETE INPUT TEST DATA
      console.log('=== Starting Input Test Deletion ===');
      deletionSummary.input = {};
      
      // Delete results FIRST (has created_at column AND test_id column, so can filter by date AND teacher)
      // This must be done before deleting main tests to avoid foreign key constraint violations
      deletionSummary.input.results = await deleteFromResultsTable(
        'input_test_results', 
        'input_tests'
      );
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.input.questions = await deleteFromTableWithTeacher(
        'input_test_questions', 
        'input_tests'
      );
      
      // Delete main test records LAST (after all dependent records are deleted)
      deletionSummary.input.tests = await deleteFromMainTestTable('input_tests');
      
      totalDeleted += deletionSummary.input.questions + deletionSummary.input.results + deletionSummary.input.tests;

      // 4. DELETE MATCHING TYPE TEST DATA
      console.log('=== Starting Matching Type Test Deletion ===');
      deletionSummary.matching = {};
      
      // Delete results FIRST (has test_id AND created_at, so can filter by both)
      // This must be done before deleting main tests to avoid foreign key constraint violations
      deletionSummary.matching.results = await deleteFromResultsTable(
        'matching_type_test_results', 
        'matching_type_tests'
      );
      
      // Delete arrows (due to foreign key constraints, has created_at column)
      // Since arrows have created_at, we can filter by date AND teacher
      const deleteMatchingArrows = async () => {
        console.log('Deleting matching type test arrows with date and teacher filter...');
        // Use neon's template literal syntax for safe SQL execution
        const result = await sql`
          DELETE FROM matching_type_test_arrows mta
          WHERE mta.question_id IN (
            SELECT mtq.id FROM matching_type_test_questions mtq
            WHERE mtq.test_id IN (
              SELECT id FROM matching_type_tests 
              WHERE teacher_id = ${teacherId}
              AND created_at BETWEEN ${startDate} AND ${endDate}
            )
          )
        `;
        console.log(`Deleted ${result.rowCount} matching type test arrows`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };
      
      deletionSummary.matching.arrows = await deleteMatchingArrows();
      
      // Delete questions (filter by test creation date, not question creation date)
      const deleteMatchingQuestions = async () => {
        console.log('Deleting matching type test questions with date and teacher filter...');
        // Use neon's template literal syntax for safe SQL execution
        const result = await sql`
          DELETE FROM matching_type_test_questions mtq
          WHERE mtq.test_id IN (
            SELECT id FROM matching_type_tests 
            WHERE teacher_id = ${teacherId}
            AND created_at BETWEEN ${startDate} AND ${endDate}
          )
        `;
        console.log(`Deleted ${result.rowCount} matching type test questions`);
        console.log('DEBUG - Full result object:', JSON.stringify(result, null, 2));
        console.log('DEBUG - Result keys:', Object.keys(result));
        console.log('DEBUG - Result type:', typeof result);
        return result.rowCount;
      };
      
      deletionSummary.matching.questions = await deleteMatchingQuestions();
      
      // Delete main test records LAST (after all dependent records are deleted)
      deletionSummary.matching.tests = await deleteFromMainTestTable('matching_type_tests');
      
      totalDeleted += deletionSummary.matching.arrows + deletionSummary.matching.questions + deletionSummary.matching.results + deletionSummary.matching.tests;

      // Delete Cloudinary images for matching type tests before deleting the tests themselves
      console.log('=== Starting Cloudinary Image Deletion ===');
      deletionSummary.cloudinaryImages = {};
      
      try {
        // Get all matching type test image URLs for this teacher and date range
        const imageUrlsResult = await sql`
          SELECT image_url FROM matching_type_tests 
          WHERE teacher_id = ${teacherId}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        `;
        
        console.log(`Found ${imageUrlsResult.length} matching type tests with images to delete`);
        
        let deletedImages = 0;
        let failedImages = 0;
        
        for (const row of imageUrlsResult) {
          const imageUrl = row.image_url;
          console.log('Processing image for deletion:', imageUrl);
          
          const deleteResult = await deleteCloudinaryImage(imageUrl);
          if (deleteResult.success) {
            deletedImages++;
            console.log('✅ Successfully deleted Cloudinary image:', deleteResult.publicId);
          } else {
            failedImages++;
            console.log('❌ Failed to delete Cloudinary image:', imageUrl, deleteResult.reason || deleteResult.error);
          }
        }
        
        deletionSummary.cloudinaryImages = {
          total: imageUrlsResult.length,
          deleted: deletedImages,
          failed: failedImages
        };
        
        console.log(`Cloudinary image deletion complete: ${deletedImages} deleted, ${failedImages} failed`);
      } catch (cloudinaryError) {
        console.error('Error during Cloudinary image deletion:', cloudinaryError);
        deletionSummary.cloudinaryImages = {
          error: cloudinaryError.message,
          total: 0,
          deleted: 0,
          failed: 0
        };
        // Don't fail the entire operation if Cloudinary deletion fails
      }

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
          message: `Successfully deleted ${totalDeleted} test records, questions, results, and assignments`,
          deletedCount: totalDeleted,
          summary: deletionSummary
        })
      };
    } catch (error) {
      // Rollback on error
      console.error('Error during deletion, rolling back transaction:', error);
      console.error('Error stack:', error.stack);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
  } catch (error) {
    console.error('Delete test data error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete test data',
        error: error.message,
        errorType: error.name,
        stack: error.stack
      })
    };
  }
};
