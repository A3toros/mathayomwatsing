const { neon } = require('@neondatabase/serverless');
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

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
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

    if (!startDate || !endDate || !teacherId) {
      console.log('Validation failed: missing required fields');
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
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
            AND test_id IN (
              SELECT id FROM matching_type_tests 
              WHERE teacher_id = ${teacherId}
            )
          `;
        } else {
          throw new Error(`Unsupported results table name: ${tableName}`);
        }
        
        console.log(`Deleted ${result.rowCount} rows from ${tableName}`);
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
        return result.rowCount;
      };

      // 1. DELETE MULTIPLE CHOICE TEST DATA
      console.log('=== Starting Multiple Choice Test Deletion ===');
      deletionSummary.multipleChoice = {};
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.multipleChoice.questions = await deleteFromTableWithTeacher(
        'multiple_choice_test_questions', 
        'multiple_choice_tests'
      );
      
      // Delete results (has created_at column AND test_id column, so can filter by date AND teacher)
      deletionSummary.multipleChoice.results = await deleteFromResultsTable(
        'multiple_choice_test_results', 
        'multiple_choice_tests'
      );
      
      totalDeleted += deletionSummary.multipleChoice.questions + deletionSummary.multipleChoice.results;

      // 2. DELETE TRUE/FALSE TEST DATA
      console.log('=== Starting True/False Test Deletion ===');
      deletionSummary.trueFalse = {};
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.trueFalse.questions = await deleteFromTableWithTeacher(
        'true_false_test_questions', 
        'true_false_tests'
      );
      
      // Delete results (has created_at column AND test_id column, so can filter by date AND teacher)
      deletionSummary.trueFalse.results = await deleteFromResultsTable(
        'true_false_test_results', 
        'true_false_tests'
      );
      
      totalDeleted += deletionSummary.trueFalse.questions + deletionSummary.trueFalse.results;

      // 3. DELETE INPUT TEST DATA
      console.log('=== Starting Input Test Deletion ===');
      deletionSummary.input = {};
      
      // Delete questions (no created_at column, so no date filtering)
      deletionSummary.input.questions = await deleteFromTableWithTeacher(
        'input_test_questions', 
        'input_tests'
      );
      
      // Delete results (has created_at column AND test_id column, so can filter by date AND teacher)
      deletionSummary.input.results = await deleteFromResultsTable(
        'input_test_results', 
        'input_tests'
      );
      
      totalDeleted += deletionSummary.input.questions + deletionSummary.input.results;

      // 4. DELETE MATCHING TYPE TEST DATA
      console.log('=== Starting Matching Type Test Deletion ===');
      deletionSummary.matching = {};
      
      // Delete arrows first (due to foreign key constraints, has created_at column)
      // Since arrows have created_at, we can filter by date AND teacher
      const deleteMatchingArrows = async () => {
        console.log('Deleting matching type test arrows with date and teacher filter...');
        // Use neon's template literal syntax for safe SQL execution
        const result = await sql`
          DELETE FROM matching_type_test_arrows mta
          WHERE mta.created_at BETWEEN ${startDate} AND ${endDate}
          AND mta.question_id IN (
            SELECT mtq.id FROM matching_type_test_questions mtq
            WHERE mtq.test_id IN (
              SELECT id FROM matching_type_tests 
              WHERE teacher_id = ${teacherId}
            )
          )
        `;
        console.log(`Deleted ${result.rowCount} matching type test arrows`);
        return result.rowCount;
      };
      
      deletionSummary.matching.arrows = await deleteMatchingArrows();
      
      // Delete questions (has created_at column, so can filter by date)
      const deleteMatchingQuestions = async () => {
        console.log('Deleting matching type test questions with date and teacher filter...');
        // Use neon's template literal syntax for safe SQL execution
        const result = await sql`
          DELETE FROM matching_type_test_questions mtq
          WHERE mtq.created_at BETWEEN ${startDate} AND ${endDate}
          AND mtq.test_id IN (
            SELECT id FROM matching_type_tests 
            WHERE teacher_id = ${teacherId}
          )
        `;
        console.log(`Deleted ${result.rowCount} matching type test questions`);
        return result.rowCount;
      };
      
      deletionSummary.matching.questions = await deleteMatchingQuestions();
      
      // Delete results (has test_id AND created_at, so can filter by both)
      deletionSummary.matching.results = await deleteFromResultsTable(
        'matching_type_test_results', 
        'matching_type_tests'
      );
      
      totalDeleted += deletionSummary.matching.arrows + deletionSummary.matching.questions + deletionSummary.matching.results;

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
          message: `Successfully deleted ${totalDeleted} test records and assignments`,
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
