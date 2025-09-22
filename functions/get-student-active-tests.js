const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== UPDATED FUNCTION RUNNING ===');
  console.log('=== CLASS FORMAT CONVERSION FIX IS ACTIVE ===');
  console.log('=== TIMESTAMP: ' + new Date().toISOString() + ' ===');
  console.log('=== THIS IS A TEST - IF YOU SEE THIS, THE FUNCTION IS RUNNING ===');
  
  // CORS headers with Authorization support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Extract student_id from JWT token
    const student_id = decoded.sub;
    
    console.log('get-student-active-tests called with student_id (from JWT):', student_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('Database connection established');

    // Get student's grade and class
    console.log('Looking up student info for student_id:', student_id);
    
    const studentInfo = await sql`
      SELECT grade, class FROM users WHERE student_id = ${student_id}
    `;
    
    console.log('Student info query result:', studentInfo);

    if (studentInfo.length === 0) {
      console.log('Student not found in database');
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student not found' })
      };
    }

    const { grade, class: className } = studentInfo[0];
    console.log('Student grade:', grade, 'type:', typeof grade, 'class:', className, 'type:', typeof className);

    // In new schema, grade and class are already integers, no conversion needed
    const assignmentGrade = grade;
    const assignmentClass = className;
    
    console.log('Using assignment format - grade:', assignmentGrade, 'type:', typeof assignmentGrade, 'class:', assignmentClass, 'type:', typeof assignmentClass);

    // Get ALL tests assigned to this grade/class (including completed ones)
    console.log('Looking for test assignments for grade:', assignmentGrade, 'class:', assignmentClass);
    
    // Get all test assignments for this student's grade/class
    const assignments = await sql`
      SELECT 
        ta.id as assignment_id,
        ta.test_type,
        ta.test_id,
        ta.teacher_id,
        ta.subject_id,
        ta.academic_period_id,
        ta.assigned_at,
        ta.due_date,
        ta.is_active,
        s.subject as subject_name
      FROM test_assignments ta
      LEFT JOIN subjects s ON ta.subject_id = s.subject_id
      WHERE ta.grade = ${assignmentGrade} 
      AND ta.class = ${assignmentClass}
      AND ta.is_active = true
      ORDER BY ta.assigned_at DESC
    `;
    
    console.log('Found assignments for grade', assignmentGrade, 'class', assignmentClass, ':', assignments);

    // Then, get detailed information for each test
    const activeTests = [];
    
    for (const assignment of assignments) {
      try {
        console.log('Processing assignment:', assignment);
        
        let testInfo = {};
        let teacherName = '';
        let subjectName = '';
        
        if (assignment.test_type === 'multiple_choice') {
          const mcTest = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, created_at, updated_at
            FROM multiple_choice_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('Multiple choice test query result:', mcTest);
          if (mcTest.length > 0) {
            testInfo = mcTest[0];
          }
        } else if (assignment.test_type === 'true_false') {
          const tfTest = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, created_at, updated_at
            FROM true_false_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('True/false test query result:', tfTest);
          if (tfTest.length > 0) {
            testInfo = tfTest[0];
          }
        } else if (assignment.test_type === 'input') {
          const inputTest = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, created_at, updated_at
            FROM input_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('Input test query result:', inputTest);
          if (inputTest.length > 0) {
            testInfo = inputTest[0];
          }
        } else if (assignment.test_type === 'matching_type') {
          const matchingTest = await sql`
            SELECT test_name, num_blocks as num_questions, teacher_id, subject_id, created_at, updated_at
            FROM matching_type_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('Matching type test query result:', matchingTest);
          if (matchingTest.length > 0) {
            testInfo = matchingTest[0];
          }
        } else if (assignment.test_type === 'word_matching') {
          const wordMatchingTest = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, interaction_type, created_at, updated_at
            FROM word_matching_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('Word matching test query result:', wordMatchingTest);
          if (wordMatchingTest.length > 0) {
            testInfo = wordMatchingTest[0];
          }
        } else if (assignment.test_type === 'drawing') {
          const drawingTest = await sql`
            SELECT test_name, num_questions, teacher_id, subject_id, created_at, updated_at
            FROM drawing_tests 
            WHERE id = ${assignment.test_id}
          `;
          console.log('Drawing test query result:', drawingTest);
          if (drawingTest.length > 0) {
            testInfo = drawingTest[0];
          }
        }
        
        console.log('Test info:', testInfo);
        
        // Get teacher name
        if (testInfo.teacher_id) {
          const teacher = await sql`
            SELECT username FROM teachers WHERE teacher_id = ${testInfo.teacher_id}
          `;
          console.log('Teacher query result:', teacher);
          if (teacher.length > 0) {
            teacherName = teacher[0].username;
          }
        }
        
        // Get subject name using the specific subject_id from the assignment
        if (assignment.subject_id) {
          console.log('Looking for subject using assignment subject_id:', assignment.subject_id);
          
          const subject = await sql`
            SELECT subject FROM subjects WHERE subject_id = ${assignment.subject_id}
          `;
          console.log('Subject query result using assignment subject_id:', subject);
          
          if (subject.length > 0) {
            subjectName = subject[0].subject;
          } else {
            console.log('No subject found for subject_id:', assignment.subject_id);
          }
        } else {
          // Fallback: Get subject name from teacher_subjects (for backward compatibility)
          if (testInfo.teacher_id) {
            console.log('No subject_id in assignment, falling back to teacher_subjects lookup');
            
            const subject = await sql`
              SELECT s.subject 
              FROM teacher_subjects ts
              JOIN subjects s ON ts.subject_id = s.subject_id
              WHERE ts.teacher_id = ${testInfo.teacher_id} 
              AND ts.grade = ${assignmentGrade} 
              AND ts.class = ${assignmentClass}
            `;
            console.log('Fallback subject query result:', subject);
            
            if (subject.length > 0) {
              subjectName = subject[0].subject;
            } else {
              console.log('No subject found for teacher:', testInfo.teacher_id, 'grade:', assignmentGrade, 'class:', assignmentClass);
            }
          }
        }
        
        activeTests.push({
          test_id: assignment.test_id,
          test_name: testInfo.test_name || 'Unknown Test',
          test_type: assignment.test_type,
          num_questions: testInfo.num_questions || 0,
          created_at: assignment.assigned_at,
          assigned_at: assignment.assigned_at,
          subject_name: subjectName || 'Unknown Subject',
          grade: assignmentGrade,
          class: assignmentClass,
          teacher_name: teacherName || 'Unknown Teacher',
          assignment_id: assignment.assignment_id
        });
        
        console.log('Added test to activeTests:', activeTests[activeTests.length - 1]);
        
      } catch (error) {
        console.error('Error processing assignment:', assignment, error);
        // Continue with other assignments
      }
    }

    console.log('Final activeTests array:', activeTests);
    
    // Comprehensive debugging information
    const debugInfo = {
      request_parameters: {
        student_id: student_id,
        original_grade: grade,
        original_class: className
      },
      data_conversion: {
        converted_grade: assignmentGrade,
        converted_class: assignmentClass,
        conversion_logic: {
          grade: 'M1 -> 1, M2 -> 2, etc.',
          class: '1/15 -> 15, 2/16 -> 16, etc.'
        }
      },
      database_queries: {
        assignments_query: {
          table: 'test_assignments',
          filters: `grade = ${assignmentGrade}, class = ${assignmentClass}`,
          found_count: assignments.length,
          sample_assignment: assignments.length > 0 ? assignments[0] : null
        },
        test_info_queries: {
          multiple_choice: 'Query multiple_choice_tests by test_id',
          true_false: 'Query true_false_tests by test_id',
          input: 'Query input_tests by test_id'
        }
      },
      processing_results: {
        total_assignments_processed: assignments.length,
        successful_processing: activeTests.length,
        failed_processing: assignments.length - activeTests.length,
        test_type_breakdown: {
          multiple_choice: activeTests.filter(t => t.test_type === 'multiple_choice').length,
          true_false: activeTests.filter(t => t.test_type === 'true_false').length,
          input: activeTests.filter(t => t.test_type === 'input').length,
          matching_type: activeTests.filter(t => t.test_type === 'matching_type').length,
          word_matching: activeTests.filter(t => t.test_type === 'word_matching').length
        }
      },
      final_output: {
        tests_returned: activeTests.length,
        student_grade: grade,
        student_class: className,
        sample_test: activeTests.length > 0 ? activeTests[0] : null
      }
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('=== END DEBUG INFO ===');
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tests: activeTests,
        student_grade: grade,
        student_class: className,
        debug_message: "FUNCTION IS RUNNING WITH UPDATED CODE - CLASS FORMAT CONVERSION FIX IS ACTIVE",
        debug_info: debugInfo
      })
    };

  } catch (error) {
    console.error('Error getting student active tests:', error);
    
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
