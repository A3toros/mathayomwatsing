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

// Helper function to delete Cloudinary image
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
  console.log('=== delete-test function called ===');
  console.log('Event:', event);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

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

    const { teacher_id, test_type, test_id } = JSON.parse(event.body) || {};
    
    console.log('Extracted params - teacher_id:', teacher_id, 'test_type:', test_type, 'test_id:', test_id);

    if (!test_type || !test_id) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test type and test ID are required' })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // For admin users, skip teacher ownership verification entirely
    // For non-admin users, verify teacher owns this test
    if (userInfo.role !== 'admin') {
      if (!teacher_id) {
        console.log('Teacher ID required for non-admin users');
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Teacher ID is required for non-admin users' })
        };
      }

      let testOwnership = false;
      switch (test_type) {
        case 'multiple_choice':
          const mcTest = await sql`
            SELECT id FROM multiple_choice_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = mcTest.length > 0;
          break;

        case 'true_false':
          const tfTest = await sql`
            SELECT id FROM true_false_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = tfTest.length > 0;
          break;

        case 'input':
          const inputTest = await sql`
            SELECT id FROM input_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = inputTest.length > 0;
          break;

        case 'matching_type':
          const matchingTest = await sql`
            SELECT id FROM matching_type_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = matchingTest.length > 0;
          break;

        case 'word_matching':
          const wordMatchingTest = await sql`
            SELECT id FROM word_matching_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = wordMatchingTest.length > 0;
          break;

        case 'drawing':
          const drawingTest = await sql`
            SELECT id FROM drawing_tests 
            WHERE id = ${test_id} AND teacher_id = ${teacher_id}
          `;
          testOwnership = drawingTest.length > 0;
          break;

        default:
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid test type' })
          };
      }

      if (!testOwnership) {
        console.log('Teacher does not own this test');
        return {
          statusCode: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'You do not have permission to delete this test' })
        };
      }
    }

    console.log('Starting test deletion process...');

    // First, get and delete Cloudinary images before deleting database records
    let cloudinaryDeletionSummary = { total: 0, deleted: 0, failed: 0 };
    
    try {
      console.log('=== Starting Cloudinary Image Deletion ===');
      
      // Get image URLs for this specific test
      let imageUrls = [];
      if (test_type === 'matching_type') {
        const imageResult = await sql`
          SELECT image_url FROM matching_type_tests 
          WHERE id = ${test_id}
        `;
        imageUrls = imageResult.map(row => row.image_url).filter(url => url);
      } else if (test_type === 'word_matching') {
        // Word matching tests don't have images, so no URLs to delete
        imageUrls = [];
      } else if (test_type === 'drawing') {
        // Get drawing test images
        const drawingImageResult = await sql`
          SELECT dim.drawing_url
          FROM drawing_test_images dim
          JOIN drawing_test_results dtr ON dim.result_id = dtr.id
          WHERE dtr.test_id = ${test_id}
        `;
        imageUrls = drawingImageResult.map(row => row.drawing_url).filter(url => url);
      }
      
      console.log(`Found ${imageUrls.length} images to delete for test ${test_id}`);
      
      // Delete each image
      for (const imageUrl of imageUrls) {
        if (imageUrl) {
          cloudinaryDeletionSummary.total++;
          const deleteResult = await deleteCloudinaryImage(imageUrl);
          if (deleteResult.success) {
            cloudinaryDeletionSummary.deleted++;
            console.log('✅ Successfully deleted Cloudinary image:', imageUrl);
          } else {
            cloudinaryDeletionSummary.failed++;
            console.log('❌ Failed to delete Cloudinary image:', imageUrl, deleteResult.reason || deleteResult.error);
          }
        }
      }
      
      console.log(`Cloudinary image deletion complete: ${cloudinaryDeletionSummary.deleted} deleted, ${cloudinaryDeletionSummary.failed} failed`);
    } catch (cloudinaryError) {
      console.error('Error during Cloudinary image deletion:', cloudinaryError);
      // Don't fail the entire operation if Cloudinary deletion fails
    }

    // Begin transaction
    await sql`BEGIN`;

    try {
      // 1. DELETE ASSIGNMENTS FIRST (makes test invisible to students immediately)
      await sql`DELETE FROM test_assignments WHERE test_id = ${test_id} AND test_type = ${test_type}`;
      
      // 2. DELETE TEST RESULTS
      if (test_type === 'multiple_choice') {
        await sql`DELETE FROM multiple_choice_test_results WHERE test_id = ${test_id}`;
      } else if (test_type === 'true_false') {
        await sql`DELETE FROM true_false_test_results WHERE test_id = ${test_id}`;
      } else if (test_type === 'input') {
        await sql`DELETE FROM input_test_results WHERE test_id = ${test_id}`;
      } else if (test_type === 'matching_type') {
        await sql`DELETE FROM matching_type_test_results WHERE test_id = ${test_id}`;
      } else if (test_type === 'word_matching') {
        await sql`DELETE FROM word_matching_test_results WHERE test_id = ${test_id}`;
      } else if (test_type === 'drawing') {
        // Delete drawing test images first due to foreign key constraint
        await sql`DELETE FROM drawing_test_images WHERE result_id IN (SELECT id FROM drawing_test_results WHERE test_id = ${test_id})`;
        await sql`DELETE FROM drawing_test_results WHERE test_id = ${test_id}`;
      }
      
      // 3. DELETE TEST QUESTIONS
      if (test_type === 'multiple_choice') {
        await sql`DELETE FROM multiple_choice_test_questions WHERE test_id = ${test_id}`;
      } else if (test_type === 'true_false') {
        await sql`DELETE FROM true_false_test_questions WHERE test_id = ${test_id}`;
      } else if (test_type === 'input') {
        await sql`DELETE FROM input_test_questions WHERE test_id = ${test_id}`;
      } else if (test_type === 'matching_type') {
        // Delete arrows first due to foreign key constraint
        await sql`DELETE FROM matching_type_test_arrows WHERE question_id IN (SELECT id FROM matching_type_test_questions WHERE test_id = ${test_id})`;
        await sql`DELETE FROM matching_type_test_questions WHERE test_id = ${test_id}`;
      } else if (test_type === 'word_matching') {
        await sql`DELETE FROM word_matching_questions WHERE test_id = ${test_id}`;
      } else if (test_type === 'drawing') {
        await sql`DELETE FROM drawing_test_questions WHERE test_id = ${test_id}`;
      }
      
      // 4. DELETE MAIN TEST RECORD LAST
      if (test_type === 'multiple_choice') {
        await sql`DELETE FROM multiple_choice_tests WHERE id = ${test_id}`;
      } else if (test_type === 'true_false') {
        await sql`DELETE FROM true_false_tests WHERE id = ${test_id}`;
      } else if (test_type === 'input') {
        await sql`DELETE FROM input_tests WHERE id = ${test_id}`;
      } else if (test_type === 'matching_type') {
        await sql`DELETE FROM matching_type_tests WHERE id = ${test_id}`;
      } else if (test_type === 'word_matching') {
        await sql`DELETE FROM word_matching_tests WHERE id = ${test_id}`;
      } else if (test_type === 'drawing') {
        await sql`DELETE FROM drawing_tests WHERE id = ${test_id}`;
      }

      // Commit transaction
      await sql`COMMIT`;
      
      console.log('Test and all related data deleted successfully');

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test and all related data deleted successfully',
          test_type: test_type,
          test_id: test_id,
          cloudinary_deletion: cloudinaryDeletionSummary
        })
      };

    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error deleting test:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
