const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// ⚠️ CRITICAL REMINDER: We get teacher_id from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.teacher_id
// - input_test_results.input_test → input_tests.id → input_tests.teacher_id  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.teacher_id

// ⚠️ CRITICAL REMINDER: We get test_name from the _tests tables, NOT from test_results tables!
// The relationship is: 
// - multiple_choice_test_results.test_id → multiple_choice_tests.id → multiple_choice_tests.test_name
// - input_test_results.test_id → input_tests.id → input_tests.test_name  
// - true_false_test_results.test_id → true_false_tests.id → true_false_tests.test_name

// ⚠️ CRITICAL REMINDER: The test_results tables have test_id that references the _tests tables.
// We need to JOIN with the _tests tables to get the actual test names.

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
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔍 Starting to fetch test results...');
    
    // Let's check what's actually in the test results tables
    try {
      const mcResultsCheck = await sql`SELECT COUNT(*) as count FROM multiple_choice_test_results`;
      const tfResultsCheck = await sql`SELECT COUNT(*) as count FROM true_false_test_results`;
      const inputResultsCheck = await sql`SELECT COUNT(*) as count FROM input_test_results`;
      
      console.log('🔍 Test results counts:', {
        multiple_choice: mcResultsCheck[0]?.count,
        true_false: tfResultsCheck[0]?.count,
        input: inputResultsCheck[0]?.count
      });
      
      if (mcResultsCheck[0]?.count > 0) {
        const sampleMC = await sql`SELECT test_name, test_id FROM multiple_choice_test_results LIMIT 2`;
        console.log('🔍 Sample multiple choice results:', sampleMC);
      }
      
      if (tfResultsCheck[0]?.count > 0) {
        const sampleTF = await sql`SELECT test_name, test_id FROM true_false_test_results LIMIT 2`;
        console.log('🔍 Sample true/false results:', sampleTF);
      }
      
      if (inputResultsCheck[0]?.count > 0) {
        const sampleInput = await sql`SELECT test_name, test_id FROM input_test_results LIMIT 2`;
        console.log('🔍 Sample input results:', sampleInput);
      }
      
    } catch (error) {
      console.log('⚠️ Could not check test results tables:', error.message);
    }
    
    // Get all test results from different result tables
    let multipleChoiceResults = [];
    let trueFalseResults = [];
    let inputResults = [];
    
    try {
      multipleChoiceResults = await sql`
        SELECT 
          'multiple_choice' as test_type,
          tr.id,
          tr.test_id,
          tr.student_id,
          tr.score,
          tr.max_score,
          tr.created_at as submitted_at,
          u.name as student_name,
          u.surname as student_surname,
          u.grade as student_grade,
          u.class as student_class,
          u.number as student_number,
          mct.test_name
        FROM multiple_choice_test_results tr
        LEFT JOIN users u ON tr.student_id = u.student_id
        LEFT JOIN multiple_choice_tests mct ON tr.test_id = mct.id
        ORDER BY tr.created_at DESC
      `;
      console.log('🔍 Multiple choice results found:', multipleChoiceResults.length);
    } catch (error) {
      console.log('⚠️ Multiple choice results query failed:', error.message);
      multipleChoiceResults = [];
    }
    
    try {
      trueFalseResults = await sql`
        SELECT 
          'true_false' as test_type,
          tr.id,
          tr.test_id,
          tr.student_id,
          tr.score,
          tr.max_score,
          tr.created_at as submitted_at,
          u.name as student_name,
          u.surname as student_surname,
          u.grade as student_grade,
          u.class as student_class,
          u.number as student_number,
          tft.test_name
        FROM true_false_test_results tr
        LEFT JOIN users u ON tr.student_id = u.student_id
        LEFT JOIN true_false_tests tft ON tr.test_id = tft.id
        ORDER BY tr.created_at DESC
      `;
      console.log('🔍 True/false results found:', trueFalseResults.length);
    } catch (error) {
      console.log('⚠️ True/false results query failed:', error.message);
      trueFalseResults = [];
    }
    
    try {
      inputResults = await sql`
        SELECT 
          'input' as test_type,
          tr.id,
          tr.test_id,
          tr.student_id,
          tr.score,
          tr.max_score,
          tr.created_at as submitted_at,
          u.name as student_name,
          u.surname as student_surname,
          u.grade as student_grade,
          u.class as student_class,
          u.number as student_number,
          it.test_name
        FROM input_test_results tr
        LEFT JOIN users u ON tr.student_id = u.student_id
        LEFT JOIN input_tests it ON tr.test_id = it.id
        ORDER BY tr.created_at DESC
      `;
      console.log('🔍 Input results found:', inputResults.length);
    } catch (error) {
      console.log('⚠️ Input results query failed:', error.message);
      inputResults = [];
    }

    // Combine all results
    const results = [
      ...multipleChoiceResults,
      ...trueFalseResults,
      ...inputResults
    ];
    
    // Debug: Log sample results to see what we're getting
    console.log('🔍 Sample multiple choice result:', multipleChoiceResults[0]);
    console.log('🔍 Sample true/false result:', trueFalseResults[0]);
    console.log('🔍 Sample input result:', inputResults[0]);
    console.log('🔍 Combined results sample:', results[0]);

    // Sort by submission date (newest first)
    results.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        results: results,
        total: results.length,
        average_score: results.length > 0 ? 
          (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(2) : 0,
        score_distribution: {
          perfect: results.filter(r => r.score === r.max_score).length,
          high: results.filter(r => r.score >= (r.max_score * 0.8)).length,
          medium: results.filter(r => r.score >= (r.max_score * 0.6) && r.score < (r.max_score * 0.8)).length,
          low: results.filter(r => r.score < (r.max_score * 0.6)).length
        }
      })
    };
  } catch (error) {
    console.error('Get test results error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve test results',
        error: error.message
      })
    };
  }
};
