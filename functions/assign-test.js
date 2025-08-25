const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
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
    const { teacher_id, test_type, test_id, assignments } = JSON.parse(event.body);

    // Validate input
    if (!teacher_id || !test_type || !test_id || !assignments || !Array.isArray(assignments)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (assignments.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'At least one assignment is required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Begin transaction
    await sql`BEGIN`;

    try {
      // Get test information based on test type
      let testInfo;
      let testName;
      
      switch (test_type) {
        case 'multiple_choice':
          testInfo = await sql`SELECT test_name FROM multiple_choice_tests WHERE id = ${test_id}`;
          break;
        case 'true_false':
          testInfo = await sql`SELECT test_name FROM true_false_tests WHERE id = ${test_id}`;
          break;
        case 'input':
          testInfo = await sql`SELECT test_name FROM input_tests WHERE id = ${test_id}`;
          break;
        case 'matching_type':
          testInfo = await sql`SELECT test_name FROM matching_type_tests WHERE id = ${test_id}`;
          break;
        default:
          throw new Error('Invalid test type');
      }

      if (!testInfo || testInfo.length === 0) {
        throw new Error('Test not found');
      }

      testName = testInfo[0].test_name;

      // Insert assignments for each grade/class/subject combination
      for (const assignment of assignments) {
        const { grade, class: className, subject_id: assignmentSubjectId } = assignment;
        
        // If subject_id is provided in the assignment, use it directly
        // Otherwise, fall back to looking it up from teacher_subjects
        let subjectId;
        
        if (assignmentSubjectId) {
          // Verify teacher has access to this specific subject for this grade/class
          const teacherAccess = await sql`
            SELECT subject_id FROM teacher_subjects 
            WHERE teacher_id = ${teacher_id} 
            AND grade = ${grade} 
            AND class = ${className}
            AND subject_id = ${assignmentSubjectId}
          `;

          if (teacherAccess.length === 0) {
            throw new Error(`Teacher does not have access to subject ${assignmentSubjectId} for ${grade} ${className}`);
          }
          
          subjectId = assignmentSubjectId;
        } else {
          // Fallback: Verify teacher has access to this grade/class and get subject_id
          const teacherAccess = await sql`
            SELECT subject_id FROM teacher_subjects 
            WHERE teacher_id = ${teacher_id} 
            AND grade = ${grade} 
            AND class = ${className}
          `;

          if (teacherAccess.length === 0) {
            throw new Error(`Teacher does not have access to ${grade} ${className}`);
          }

          // Get the subject_id for this grade/class combination
          subjectId = teacherAccess[0].subject_id;
        }

        // Insert test assignment with subject_id
        await sql`
          INSERT INTO test_assignments (test_type, test_id, grade, class, subject_id, assigned_at)
          VALUES (${test_type}, ${test_id}, ${grade}, ${className}, ${subjectId}, CURRENT_TIMESTAMP)
        `;
      }

      // Commit transaction
      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: `Test "${testName}" assigned to ${assignments.length} class(es) successfully`,
          assignments_count: assignments.length
        })
      };

    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error assigning test:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
