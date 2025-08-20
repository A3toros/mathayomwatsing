const { Client } = require("pg");

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const client = new Client({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Check all tables
        const tables = ['users', 'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6', 'test_results', 'tests'];
        const results = {};
        
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                results[table] = parseInt(result.rows[0].count);
            } catch (error) {
                results[table] = `Error: ${error.message}`;
            }
        }
        
        // Check sample data from users table
        let sampleUsers = [];
        try {
            const userResult = await client.query('SELECT username, student_id, grade_level, class_name FROM users LIMIT 5');
            sampleUsers = userResult.rows;
        } catch (error) {
            sampleUsers = `Error: ${error.message}`;
        }
        
        // Check sample test results
        let sampleResults = [];
        try {
            const resultResult = await client.query('SELECT user_id, test_id, score, grade_level FROM test_results LIMIT 5');
            sampleResults = resultResult.rows;
        } catch (error) {
            sampleResults = `Error: ${error.message}`;
        }
        
        await client.end();
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_counts: results,
                sample_users: sampleUsers,
                sample_test_results: sampleResults
            })
        };
        
    } catch (error) {
        if (client) await client.end();
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
