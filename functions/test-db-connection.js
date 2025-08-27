const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    console.log('Testing database connection...');
    console.log('NEON_DATABASE_URL exists:', !!process.env.NEON_DATABASE_URL);
    
    if (!process.env.NEON_DATABASE_URL) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'NEON_DATABASE_URL environment variable not set',
          message: 'Database connection string not configured. Please set NEON_DATABASE_URL in your environment variables.',
          solution: 'For local development, create a .env file or set the environment variable before running netlify dev'
        })
      };
    }

    // Create database connection using @neondatabase/serverless
    const sql = neon(process.env.NEON_DATABASE_URL);

    console.log('Connection created, attempting query...');

    // Test simple query
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Test query result:', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Database connection successful',
        currentTime: result[0].current_time,
        databaseUrl: process.env.NEON_DATABASE_URL ? 'Set (hidden for security)' : 'Not set'
      })
    };

  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Database connection failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Check function logs for details'
      })
    };
  }
};
