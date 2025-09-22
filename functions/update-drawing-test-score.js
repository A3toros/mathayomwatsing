const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    const { resultId, score, maxScore } = parsedBody;
    
    if (!resultId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'resultId is required' })
      };
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get current values first
    const currentResult = await sql`
      SELECT score, max_score FROM drawing_test_results WHERE id = ${resultId}
    `;
    
    if (currentResult.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Result not found' })
      };
    }
    
    const currentScore = currentResult[0].score;
    const currentMaxScore = currentResult[0].max_score;
    
    // Use provided values or keep current ones
    const newScore = score !== undefined ? score : currentScore;
    const newMaxScore = maxScore !== undefined ? maxScore : currentMaxScore;
    
    // Validate score input - only check for negative values
    if (newScore < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Score cannot be negative' })
      };
    }
    
    // Update drawing test result with new values
    await sql`
      UPDATE drawing_test_results 
      SET score = ${newScore}, 
          max_score = ${newMaxScore}
      WHERE id = ${resultId}
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        score: newScore,
        maxScore: newMaxScore
      })
    };
  } catch (error) {
    console.error('Error updating drawing test score:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
