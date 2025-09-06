const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract teacher information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: result.error
        })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Teacher or admin role required.'
        })
      };
    }

    const { grade, class: className, semester } = event.queryStringParameters || {};
    
    // Handle admin vs regular teacher
    let teacher_id;
    if (userInfo.role === 'admin') {
      // Admin can access all data - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacher_id = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacher_id = userInfo.teacher_id;
    }

    if (!grade || !className || !semester) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Grade, class, and semester are required'
        })
      };
    }

    console.log('get-class-results called with:', { grade, className, semester, teacher_id });

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Convert grade format: M1 -> 1, M2 -> 2, etc.
    let assignmentGrade = grade;
    if (grade.startsWith('M')) {
        assignmentGrade = grade.substring(1);
    }
    
    // Convert class format: 1/15 -> 15, 2/16 -> 16, etc.
    let assignmentClass = className;
    if (className.includes('/')) {
        assignmentClass = className.split('/')[1];
    }
    
    console.log('Converted to assignment format:', { assignmentGrade, assignmentClass });
    
    // Get academic period based on semester parameter - dynamically determine current academic year
    // First, get the current academic year based on current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // January = 0, so add 1
    
    // Determine academic year: if we're in first half of year (Jan-June), it's previous year-current year
    // If we're in second half (July-Dec), it's current year-next year
    let academicYear;
    if (currentMonth >= 7) { // July onwards
      academicYear = `${currentYear}-${currentYear + 1}`;
    } else {
      academicYear = `${currentYear - 1}-${currentYear}`;
    }
    
    console.log(`Current date: ${currentDate.toISOString()}, determined academic year: ${academicYear}`);
    
    const academicPeriods = await sql`
      SELECT id, semester, term, academic_year
      FROM academic_year 
      WHERE semester = ${parseInt(semester)}
      AND academic_year = ${academicYear}
      ORDER BY term DESC
      LIMIT 1
    `;
    
    // Debug: Check what academic period IDs exist in test results for this grade/class
    console.log('Checking what academic_period_id values exist in test results...');
    const mcPeriodIds = await sql`
      SELECT DISTINCT academic_period_id FROM multiple_choice_test_results 
      WHERE grade = ${grade} AND class = ${className}
    `;
    const tfPeriodIds = await sql`
      SELECT DISTINCT academic_period_id FROM true_false_test_results 
      WHERE grade = ${grade} AND class = ${className}
    `;
    const inputPeriodIds = await sql`
      SELECT DISTINCT academic_period_id FROM input_test_results 
      WHERE grade = ${grade} AND class = ${className}
    `;
    
    console.log('Academic period IDs found in test results:', {
      multiple_choice: mcPeriodIds.map(p => p.academic_period_id),
      true_false: tfPeriodIds.map(p => p.academic_period_id),
      input: inputPeriodIds.map(p => p.academic_period_id)
    });

    console.log('Found academic periods:', academicPeriods);
    
    // Debug: Show all available academic periods for comparison
    const allAcademicPeriods = await sql`
      SELECT id, semester, term, academic_year, start_date, end_date
      FROM academic_year 
      ORDER BY academic_year DESC, semester DESC, term DESC
    `;
    console.log('All available academic periods in database:', allAcademicPeriods);
    
    if (academicPeriods.length === 0) {
      console.log(`No academic periods found for semester ${semester} and academic year ${academicYear}`);
      console.log('Trying to find any available academic period for this semester...');
      
      // Try to find any academic period for this semester, regardless of year
      const fallbackPeriods = await sql`
        SELECT id, semester, term, academic_year
        FROM academic_year 
        WHERE semester = ${parseInt(semester)}
        ORDER BY academic_year DESC, term DESC
        LIMIT 1
      `;
      
      if (fallbackPeriods.length === 0) {
        console.log('No academic periods found for this semester at all');
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            results: {},
            subjects: [],
            message: 'No academic periods found for this semester'
          })
        };
      }
      
      console.log(`Using fallback academic period:`, fallbackPeriods[0]);
      academicPeriods = fallbackPeriods;
    }

    const academicPeriodId = academicPeriods[0].id;
    console.log('Using academic period ID:', academicPeriodId);
    console.log('Selected academic period details:', academicPeriods[0]);
    
    // Get teacher subjects for this grade and class
    console.log('Looking for teacher subjects with:', {
      teacher_id,
      assignmentGrade,
      assignmentClass,
      originalGrade: grade,
      originalClass: className
    });
    
    // Try converted format first (1, 15)
    let teacherSubjects;
    if (userInfo.role === 'admin' && teacher_id === null) {
      // Admin gets all subjects for this grade/class
      teacherSubjects = await sql`
        SELECT ts.subject_id, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        WHERE ts.grade = ${assignmentGrade}
        AND ts.class = ${assignmentClass}
      `;
    } else {
      // Teacher gets only their subjects
      teacherSubjects = await sql`
        SELECT ts.subject_id, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        WHERE ts.teacher_id = ${teacher_id}
        AND ts.grade = ${assignmentGrade}
        AND ts.class = ${assignmentClass}
      `;
    }

    console.log('Found teacher subjects with converted format:', teacherSubjects);
    
    // If no results, try original format (M1, 1/15)
    if (teacherSubjects.length === 0) {
      console.log('No results with converted format, trying original format...');
      if (userInfo.role === 'admin' && teacher_id === null) {
        // Admin gets all subjects for this grade/class
        teacherSubjects = await sql`
          SELECT ts.subject_id, s.subject
          FROM teacher_subjects ts
          JOIN subjects s ON ts.subject_id = s.subject_id
          WHERE ts.grade = ${grade}
          AND ts.class = ${className}
        `;
      } else {
        // Teacher gets only their subjects
        teacherSubjects = await sql`
          SELECT ts.subject_id, s.subject
          FROM teacher_subjects ts
          JOIN subjects s ON ts.subject_id = s.subject_id
          WHERE ts.teacher_id = ${teacher_id}
          AND ts.grade = ${grade}
          AND ts.class = ${className}
        `;
      }
      
      console.log('Found teacher subjects with original format:', teacherSubjects);
      
      // If we found results with original format, we need to use original format for assignments too
      if (teacherSubjects.length > 0) {
        assignmentGrade = grade;
        assignmentClass = className;
        console.log('Using original format for assignments:', { assignmentGrade, assignmentClass });
      }
    }
    
    // Debug: Check all teacher subjects for this teacher
    let allTeacherSubjects;
    if (userInfo.role === 'admin' && teacher_id === null) {
      // Admin gets all subjects
      allTeacherSubjects = await sql`
        SELECT ts.teacher_id, ts.subject_id, ts.grade, ts.class, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
      `;
    } else {
      // Teacher gets only their subjects
      allTeacherSubjects = await sql`
        SELECT ts.teacher_id, ts.subject_id, ts.grade, ts.class, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        WHERE ts.teacher_id = ${teacher_id}
      `;
    }
    console.log('All subjects for this teacher:', allTeacherSubjects);
    
    if (teacherSubjects.length === 0) {
      console.log('No teacher subjects found for grade:', assignmentGrade, 'class:', assignmentClass);
      console.log('Falling back to show ALL test results for this grade/class (simplified view)');
      
      // Fallback: Show all test results for this grade/class regardless of subject assignments
      const allStudents = await sql`
        SELECT student_id, name, surname, nickname, number
        FROM users 
        WHERE grade = ${grade} AND class = ${className}
        ORDER BY CAST(number AS INTEGER)
      `;
      
      // Get all test results for this grade/class
      const fallbackMcResults = await sql`
        SELECT mctr.student_id, mctr.name, mctr.surname, mctr.nickname, mctr.score, mctr.max_score, mctr.test_name, mctr.number, 'multiple_choice' as test_type
        FROM multiple_choice_test_results mctr
        WHERE mctr.grade = ${grade} AND mctr.class = ${className}
        AND mctr.academic_period_id = ${academicPeriods[0].id}
        ORDER BY mctr.number
      `;
      
      const fallbackTfResults = await sql`
        SELECT tftr.student_id, tftr.name, tftr.surname, tftr.nickname, tftr.score, tftr.max_score, tftr.test_name, tftr.number, 'true_false' as test_type
        FROM true_false_test_results tftr
        WHERE tftr.grade = ${grade} AND tftr.class = ${className}
        AND tftr.academic_period_id = ${academicPeriods[0].id}
        ORDER BY tftr.number
      `;
      
      const fallbackInputResults = await sql`
        SELECT itr.student_id, itr.name, itr.surname, itr.nickname, itr.score, itr.max_score, itr.test_name, itr.number, 'input' as test_type
        FROM input_test_results itr
        WHERE itr.grade = ${grade} AND itr.class = ${className}
        AND itr.academic_period_id = ${academicPeriods[0].id}
        ORDER BY itr.number
      `;
      
      const fallbackMatchingResults = await sql`
        SELECT mtr.student_id, mtr.name, mtr.surname, mtr.nickname, mtr.score, mtr.max_score, mtr.test_name, mtr.number, 'matching_type' as test_type
        FROM matching_type_test_results mtr
        WHERE mtr.grade = ${grade} AND mtr.class = ${className}
        AND mtr.academic_period_id = ${academicPeriods[0].id}
        ORDER BY mtr.number
      `;
      
      const allFallbackResults = [
        ...fallbackMcResults,
        ...fallbackTfResults,
        ...fallbackInputResults,
        ...fallbackMatchingResults
      ];
      
      console.log(`Fallback found ${allFallbackResults.length} test results total`);
      
      if (allFallbackResults.length > 0) {
        // Create a simple results structure
        const fallbackResults = {
          class: allStudents.map(student => {
            const studentResults = allFallbackResults.filter(r => r.student_id === student.student_id);
            const studentData = {
              ...student,
              has_results: studentResults.length > 0
            };
            
            // Add test results as properties
            studentResults.forEach((result, index) => {
              studentData[`test_${index + 1}`] = `${result.score}/${result.max_score}`;
            });
            
            return studentData;
          })
        };
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            results: fallbackResults,
            subjects: [{ subject: 'All Tests' }],
            message: `Found ${allFallbackResults.length} test results (fallback mode - no subject assignments)`
          })
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          results: {},
          subjects: [],
          message: 'No teacher subjects found and no test results available for this grade and class'
        })
      };
    }

    // Get all students in this grade and class
    const students = await sql`
      SELECT student_id, name, surname, nickname, number
      FROM users 
      WHERE grade = ${grade} AND class = ${className}
      ORDER BY CAST(number AS INTEGER)
    `;
    
    console.log('Found students:', students);

         // Debug: Check what test results exist for this grade/class
     console.log('Checking for existing test results...');
     
     const mcResultsCount = await sql`
       SELECT COUNT(*) as count FROM multiple_choice_test_results 
       WHERE grade = ${grade} AND class = ${className}
     `;
     const tfResultsCount = await sql`
       SELECT COUNT(*) as count FROM true_false_test_results 
       WHERE grade = ${grade} AND class = ${className}
     `;
     const inputResultsCount = await sql`
       SELECT COUNT(*) as count FROM input_test_results 
       WHERE grade = ${grade} AND class = ${className}
     `;
     
     const matchingResultsCount = await sql`
       SELECT COUNT(*) as count FROM matching_type_test_results 
       WHERE grade = ${grade} AND class = ${className}
     `;
     
     console.log('Total test results found:', {
       multiple_choice: mcResultsCount[0].count,
       true_false: tfResultsCount[0].count,
       input: inputResultsCount[0].count,
       matching_type: matchingResultsCount[0].count
     });

     // Initialize variables for both code paths
     let allMcResults = [];
     let allTfResults = [];
     let allInputResults = [];
     let allMatchingResults = [];
     let allResults = [];

    // Get results for ALL subjects combined into one table
    const results = {};
    const subjects = [];

    // Collect all subjects
    for (const subject of teacherSubjects) {
      subjects.push({
        subject_id: subject.subject_id,
        subject: subject.subject
      });
    }

    // If teacher has only one subject, create combined table (backward compatibility)
    if (teacherSubjects.length === 1) {
      console.log('Teacher has only one subject, creating combined table for backward compatibility');
      
      const singleSubject = teacherSubjects[0];
      
      // Get all test assignments for this class to see what tests exist
      const allTestAssignments = await sql`
        SELECT ta.test_type, ta.test_id, ta.subject_id
        FROM test_assignments ta
        WHERE ta.grade = ${assignmentGrade}
        AND ta.class = ${assignmentClass}
      `;
      
      console.log(`Found ${allTestAssignments.length} total test assignments for class ${assignmentGrade}/${assignmentClass}:`, allTestAssignments);
      
      // Debug: Check ALL test assignments in the system
      const allSystemAssignments = await sql`
        SELECT ta.test_type, ta.test_id, ta.subject_id, ta.grade, ta.class
        FROM test_assignments ta
        ORDER BY ta.grade, ta.class
      `;
      console.log('All test assignments in system:', allSystemAssignments);
      
      // Filter assignments for this specific subject
      const subjectTestAssignments = allTestAssignments.filter(ta => ta.subject_id === singleSubject.subject_id);
      console.log(`Found ${subjectTestAssignments.length} test assignments for subject ${singleSubject.subject}:`, subjectTestAssignments);
      
      // Extract test IDs by type
      const mcTestIds = subjectTestAssignments
        .filter(ta => ta.test_type === 'multiple_choice')
        .map(ta => ta.test_id);
      const tfTestIds = subjectTestAssignments
        .filter(ta => ta.test_type === 'true_false')
        .map(ta => ta.test_id);
      const inputTestIds = subjectTestAssignments
        .filter(ta => ta.test_type === 'input')
        .map(ta => ta.test_id);
      const matchingTestIds = subjectTestAssignments
        .filter(ta => ta.test_type === 'matching_type')
        .map(ta => ta.test_id);
      
      console.log(`Test IDs for subject ${singleSubject.subject}:`, {
        multiple_choice: mcTestIds,
        true_false: tfTestIds,
        input: inputTestIds,
        matching_type: matchingTestIds
      });
      
      // Get test results for tests assigned to this subject
      if (mcTestIds.length > 0) {
        allMcResults = await sql`
          SELECT mctr.student_id, mctr.name, mctr.surname, mctr.nickname, mctr.score, mctr.max_score, mctr.test_name, mctr.created_at, mctr.number, 'multiple_choice' as test_type
          FROM multiple_choice_test_results mctr
          WHERE mctr.grade = ${grade} 
          AND mctr.class = ${className}
          AND mctr.academic_period_id = ${academicPeriodId}
          AND mctr.test_id = ANY(${mcTestIds})
          ORDER BY mctr.number
        `;
      }

      if (tfTestIds.length > 0) {
        allTfResults = await sql`
          SELECT tftr.student_id, tftr.name, tftr.surname, tftr.nickname, tftr.score, tftr.max_score, tftr.test_name, tftr.created_at, tftr.number, 'true_false' as test_type
          FROM true_false_test_results tftr
          WHERE tftr.grade = ${grade} 
          AND tftr.class = ${className}
          AND tftr.academic_period_id = ${academicPeriodId}
          AND tftr.test_id = ANY(${tfTestIds})
          ORDER BY tftr.number
        `;
      }

      if (inputTestIds.length > 0) {
        allInputResults = await sql`
          SELECT itr.student_id, itr.name, itr.surname, itr.nickname, itr.score, itr.max_score, itr.test_name, itr.created_at, itr.number, 'input' as test_type
          FROM input_test_results itr
          WHERE itr.grade = ${grade} 
          AND itr.class = ${className}
          AND itr.academic_period_id = ${academicPeriodId}
          AND itr.test_id = ANY(${inputTestIds})
          ORDER BY itr.number
        `;
      }

      if (matchingTestIds.length > 0) {
        allMatchingResults = await sql`
          SELECT mttr.student_id, mttr.name, mttr.surname, mttr.nickname, mttr.score, mttr.max_score, mttr.test_name, mttr.created_at, mttr.number, 'matching_type' as test_type
          FROM matching_type_test_results mttr
          WHERE mttr.grade = ${grade} 
          AND mttr.class = ${className}
          AND mttr.academic_period_id = ${academicPeriodId}
          AND mttr.test_id = ANY(${matchingTestIds})
          ORDER BY mttr.number
        `;
      }

      console.log(`Total results for all subjects:`, {
        mcResults: allMcResults.length,
        tfResults: allTfResults.length,
        inputResults: allInputResults.length,
        matchingResults: allMatchingResults ? allMatchingResults.length : 0
      });
      
      // Debug: Log individual test results
      console.log('Multiple choice results:', allMcResults);
      console.log('True/false results:', allTfResults);
      console.log('Input results:', allInputResults);
      
      // Combine all results from all subjects
      allResults = [...allMcResults, ...allTfResults, ...allInputResults];
      if (allMatchingResults) {
        allResults = [...allResults, ...allMatchingResults];
      }
      console.log('Total combined results count:', allResults.length);
      
      // Get unique tests for column headers
      const uniqueTests = [];
      const seenTests = new Set();
      
      console.log('Processing allResults for unique tests:', allResults);
      
      if (allResults.length > 0) {
        allResults.forEach(result => {
          // Use only test_name, not test_name_test_type
          const testKey = result.test_name;
          console.log(`Processing result: ${result.test_name} (${result.test_type}) -> key: ${testKey}`);
          if (!seenTests.has(testKey)) {
            seenTests.add(testKey);
            uniqueTests.push({
              test_name: result.test_name,
              test_type: result.test_type,
              key: testKey
            });
            console.log(`Added new unique test: ${testKey}`);
          } else {
            console.log(`Test already seen: ${testKey}`);
          }
        });
      }
      
      console.log('Unique tests found:', uniqueTests);
      
      // Create ONE complete student table for the entire class with individual test results
      const completeStudentTable = students.map(student => {
        // Find test results for this student (from any subject)
        const studentResults = allResults.filter(result => result.student_id === student.student_id);
        
        console.log(`Student ${student.student_id} (${student.name}): found ${studentResults.length} test results:`, studentResults);
        
        // Create base student object
        const studentObj = {
          student_id: student.student_id,
          name: student.name,
          surname: student.surname,
          nickname: student.nickname,
          number: student.number,
          has_results: studentResults.length > 0,
          subject: 'All Subjects' // Combined subject label
        };
        
        // Add individual test results
        studentResults.forEach(result => {
          // Use only test_name, not test_name_test_type
          const testKey = result.test_name;
          studentObj[testKey] = `${result.score}/${result.max_score}`;
          console.log(`Added test result for student ${student.student_id}: ${testKey} = ${result.score}/${result.max_score}`);
        });
        
        return studentObj;
      });
      
      // Sort by student number to maintain proper class order (ensure numeric sorting)
      completeStudentTable.sort((a, b) => parseInt(a.number) - parseInt(b.number));
      
      // Store under the subject name for consistency with multiple-subject logic
      results[singleSubject.subject] = completeStudentTable;
      results['unique_tests'] = uniqueTests;
      results['subjects'] = teacherSubjects; // Add subjects array for consistency
      
      // Also store under 'class' for backward compatibility
      results['class'] = completeStudentTable;
      
      console.log(`Complete student table for class ${grade} ${className} (subject: ${singleSubject.subject}):`, completeStudentTable);
      console.log('Unique tests for columns:', uniqueTests);
      
    } else {
      // Teacher has multiple subjects - create separate tables per subject
      console.log(`Teacher has ${teacherSubjects.length} subjects, creating separate tables per subject`);
      
      for (const subject of teacherSubjects) {
        console.log(`Processing subject: ${subject.subject}`);
        
        // Initialize variables for this subject
        let subjectMcResults = [];
        let subjectTfResults = [];
        let subjectInputResults = [];
        let subjectMatchingResults = [];
        
        // Get all test assignments for this class to see what tests exist
        const allTestAssignments = await sql`
          SELECT ta.test_type, ta.test_id, ta.subject_id
          FROM test_assignments ta
          WHERE ta.grade = ${assignmentGrade}
          AND ta.class = ${assignmentClass}
        `;
        
        console.log(`Found ${allTestAssignments.length} total test assignments for class ${assignmentGrade}/${assignmentClass}:`, allTestAssignments);
        
        // Debug: Check ALL test assignments in the system (for multi-subject case too)
        if (allTestAssignments.length === 0) {
          const allSystemAssignments = await sql`
            SELECT ta.test_type, ta.test_id, ta.subject_id, ta.grade, ta.class
            FROM test_assignments ta
            ORDER BY ta.grade, ta.class
          `;
          console.log('All test assignments in system (multi-subject debug):', allSystemAssignments);
        }
        
        // Filter assignments for this specific subject
        const subjectTestAssignments = allTestAssignments.filter(ta => ta.subject_id === subject.subject_id);
        console.log(`Found ${subjectTestAssignments.length} test assignments for subject ${subject.subject}:`, subjectTestAssignments);
        
        // Extract test IDs by type
        const mcTestIds = subjectTestAssignments
          .filter(ta => ta.test_type === 'multiple_choice')
          .map(ta => ta.test_id);
        const tfTestIds = subjectTestAssignments
          .filter(ta => ta.test_type === 'true_false')
          .map(ta => ta.test_id);
        const inputTestIds = subjectTestAssignments
          .filter(ta => ta.test_type === 'input')
          .map(ta => ta.test_id);
        const matchingTestIds = subjectTestAssignments
          .filter(ta => ta.test_type === 'matching_type')
          .map(ta => ta.test_id);
        
        console.log(`Test IDs for subject ${subject.subject}:`, {
          multiple_choice: mcTestIds,
          true_false: tfTestIds,
          input: inputTestIds,
          matching_type: matchingTestIds
        });
        
        // Get test results for tests assigned to this subject
        if (mcTestIds.length > 0) {
          subjectMcResults = await sql`
            SELECT mctr.student_id, mctr.name, mctr.surname, mctr.nickname, mctr.score, mctr.max_score, mctr.test_name, mctr.created_at, mctr.number, 'multiple_choice' as test_type
            FROM multiple_choice_test_results mctr
            WHERE mctr.grade = ${grade} 
            AND mctr.class = ${className}
            AND mctr.academic_period_id = ${academicPeriodId}
            AND mctr.test_id = ANY(${mcTestIds})
            ORDER BY mctr.number
          `;
        }

        if (tfTestIds.length > 0) {
          subjectTfResults = await sql`
            SELECT tftr.student_id, tftr.name, tftr.surname, tftr.nickname, tftr.score, tftr.max_score, tftr.test_name, tftr.created_at, tftr.number, 'true_false' as test_type
            FROM true_false_test_results tftr
            WHERE tftr.grade = ${grade} 
            AND tftr.class = ${className}
            AND tftr.academic_period_id = ${academicPeriodId}
            AND tftr.test_id = ANY(${tfTestIds})
            ORDER BY tftr.number
          `;
        }

        if (inputTestIds.length > 0) {
          subjectInputResults = await sql`
            SELECT itr.student_id, itr.name, itr.surname, itr.nickname, itr.score, itr.max_score, itr.test_name, itr.created_at, itr.number, 'input' as test_type
            FROM input_test_results itr
            WHERE itr.grade = ${grade} 
            AND itr.class = ${className}
            AND itr.academic_period_id = ${academicPeriodId}
            AND itr.test_id = ANY(${inputTestIds})
            ORDER BY itr.number
          `;
        }

        if (matchingTestIds.length > 0) {
          subjectMatchingResults = await sql`
            SELECT mttr.student_id, mttr.name, mttr.surname, mttr.nickname, mttr.score, mttr.max_score, mttr.test_name, mttr.created_at, mttr.number, 'matching_type' as test_type
            FROM matching_type_test_results mttr
            WHERE mttr.grade = ${grade} 
            AND mttr.class = ${className}
            AND mttr.academic_period_id = ${academicPeriodId}
            AND mttr.test_id = ANY(${matchingTestIds})
            ORDER BY mttr.number
          `;
        }

        // Combine results for this subject
        const subjectResults = [...subjectMcResults, ...subjectTfResults, ...subjectInputResults];
        if (subjectMatchingResults) {
          subjectResults.push(...subjectMatchingResults);
        }
        console.log(`Subject ${subject.subject}: found ${subjectResults.length} test results`);
        console.log(`Subject ${subject.subject} - MC: ${subjectMcResults.length}, TF: ${subjectTfResults.length}, Input: ${subjectInputResults.length}, Matching: ${subjectMatchingResults ? subjectMatchingResults.length : 0}`);
        if (subjectResults.length > 0) {
          console.log(`Sample result for ${subject.subject}:`, subjectResults[0]);
        }

        // Get unique tests for this subject
        const subjectUniqueTests = [];
        const subjectSeenTests = new Set();
        
        if (subjectResults.length > 0) {
          subjectResults.forEach(result => {
            // Use only test_name, not test_name_test_type
            const testKey = result.test_name;
            console.log(`Processing result for ${subject.subject}: test_name="${result.test_name}", test_type="${result.test_type}"`);
            if (!subjectSeenTests.has(testKey)) {
              subjectSeenTests.add(testKey);
              subjectUniqueTests.push({
                test_name: result.test_name,
                test_type: result.test_type,
                key: testKey
              });
              console.log(`Added new unique test for ${subject.subject}: ${testKey}`);
            } else {
              console.log(`Test already seen for ${subject.subject}: ${testKey}`);
            }
          });
        }
        
        console.log(`Final unique tests for ${subject.subject}:`, subjectUniqueTests);

        // Create student table for this subject
        const subjectStudentTable = students.map(student => {
          const studentResults = subjectResults.filter(result => result.student_id === student.student_id);
          
          const studentObj = {
            student_id: student.student_id,
            name: student.name,
            surname: student.surname,
            nickname: student.nickname,
            number: student.number,
            has_results: studentResults.length > 0,
            subject: subject.subject
          };
          
          // Add individual test results using only test_name as key
          studentResults.forEach(result => {
            const testKey = result.test_name; // Remove test_type suffix
            studentObj[testKey] = `${result.score}/${result.max_score}`;
            console.log(`Added test result for student ${student.student_id}: ${testKey} = ${result.score}/${result.max_score}`);
          });
          
          return studentObj;
        });

        // Sort by student number
        subjectStudentTable.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        
        // Store subject-specific table
        results[subject.subject] = subjectStudentTable;
        console.log(`Created table for subject ${subject.subject} with ${subjectStudentTable.length} students`);
        console.log(`Subject ${subject.subject} unique tests:`, subjectUniqueTests);
        console.log(`Subject ${subject.subject} test results count:`, subjectResults.length);
      }
      
      // Also store unique tests for all subjects combined
      const allUniqueTests = [];
      const allSeenTests = new Set();
      
      console.log('=== Calculating combined unique tests ===');
      for (const subject of teacherSubjects) {
        console.log(`Processing subject: ${subject.subject}`);
        if (results[subject.subject]) {
          console.log(`Found results for ${subject.subject}:`, results[subject.subject].length, 'students');
          results[subject.subject].forEach(student => {
            Object.keys(student).forEach(key => {
              if (!['student_id', 'name', 'surname', 'nickname', 'number', 'has_results', 'subject'].includes(key)) {
                console.log(`Found test key: ${key} for student ${student.student_id}`);
                if (!allSeenTests.has(key)) {
                  allSeenTests.add(key);
                  allUniqueTests.push({
                    test_name: key, // key is already just the test_name
                    test_type: 'unknown', // We don't have test_type in the key anymore
                    key: key
                  });
                  console.log(`Added new combined unique test: ${key}`);
                } else {
                  console.log(`Test already seen in combined list: ${key}`);
                }
              }
            });
          });
        } else {
          console.log(`No results found for subject: ${subject.subject}`);
        }
      }
      
             results['unique_tests'] = allUniqueTests;
       results['subjects'] = teacherSubjects; // Add subjects array for frontend
       console.log('Combined unique tests for all subjects:', allUniqueTests);
       console.log('Added subjects array to results:', teacherSubjects);
     }

    // Debug: Check first student object structure
    if (results.class && results.class.length > 0) {
      const firstStudent = results.class[0];
      console.log('First student object structure:', firstStudent);
      console.log('First student object keys:', Object.keys(firstStudent));
      console.log('Test-related keys:', Object.keys(firstStudent).filter(key => !['student_id', 'name', 'surname', 'nickname', 'number', 'has_results', 'subject'].includes(key)));
    }

    console.log('Final results object:', results);
    console.log('Final subjects array:', subjects);
    
    // Comprehensive debugging information
    const debugInfo = {
      request_parameters: {
        grade: grade,
        class: className,
        semester: semester,
        teacher_id: teacher_id
      },
      data_conversion: {
        original_grade: grade,
        converted_grade: assignmentGrade,
        original_class: className,
        converted_class: assignmentClass
      },
      academic_period: {
        requested_semester: semester,
        found_periods: academicPeriods,
        selected_period_id: academicPeriodId
      },
      teacher_subjects: {
        found_subjects: teacherSubjects,
        subject_count: teacherSubjects.length
      },
      student_data: {
        total_students: students.length,
        sample_student: students.length > 0 ? students[0] : null
      },
             test_results_analysis: {
         multiple_choice: {
           raw_count: mcResultsCount[0].count,
           filtered_count: allMcResults ? allMcResults.length : 0,
           sample_result: allMcResults && allMcResults.length > 0 ? allMcResults[0] : null
         },
         true_false: {
           raw_count: tfResultsCount[0].count,
           filtered_count: allTfResults ? allTfResults.length : 0,
           sample_result: allTfResults && allTfResults.length > 0 ? allTfResults[0] : null
         },
         input: {
           raw_count: inputResultsCount[0].count,
           filtered_count: allInputResults ? allInputResults.length : 0,
           sample_result: allInputResults && allInputResults.length > 0 ? allInputResults[0] : null
         }
       },
      final_output: {
        total_combined_results: teacherSubjects.length === 1 ? (allResults ? allResults.length : 0) : 'Multiple subject tables created',
        complete_student_table_count: teacherSubjects.length === 1 ? (results.class ? results.class.length : 0) : Object.keys(results).filter(key => key !== 'unique_tests').length,
        students_with_results: teacherSubjects.length === 1 ? (results.class ? results.class.filter(s => s.has_results).length : 0) : 'Multiple subject tables',
        students_without_results: teacherSubjects.length === 1 ? (results.class ? results.class.filter(s => !s.has_results).length : 0) : 'Multiple subject tables'
      },
      query_details: {
        multiple_choice: 'INNER JOIN with multiple_choice_tests, filtered by teacher_id',
        true_false: 'INNER JOIN with true_false_tests, filtered by teacher_id',
        input: 'INNER JOIN with input_tests, filtered by teacher_id',
        matching_type: 'INNER JOIN with matching_type_tests, filtered by teacher_id'
      }
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('=== END DEBUG INFO ===');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        results: results,
        subjects: subjects,
        debug_info: debugInfo
      })
    };
  } catch (error) {
    console.error('Get class results error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve class results',
        error: error.message
      })
    };
  }
};
