-- Populate test results for all students
-- This script will generate test results for every student across all grades

-- First, let's check what we have
SELECT 'Current table counts:' as info;
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tests' as table_name, COUNT(*) as count FROM tests
UNION ALL
SELECT 'test_results' as table_name, COUNT(*) as count FROM test_results;

-- Clear existing test results to avoid duplicates
DELETE FROM test_results;

-- Generate test results for all students
INSERT INTO test_results (user_id, test_id, grade_level, score, max_score, answers, submitted_at, completed)
SELECT 
    u.id, 
    t.id, 
    u.grade_level, 
    CASE 
        WHEN t.test_number <= 4 THEN (6 + (RANDOM() * 4)::int)
        ELSE (14 + (RANDOM() * 6)::int)
    END,
    t.max_score,
    ('{"test_score": ' || 
        CASE 
            WHEN t.test_number <= 4 THEN (6 + (RANDOM() * 4)::int)
            ELSE (14 + (RANDOM() * 6)::int)
        END || 
        ', "time_taken": ' || (20 + (RANDOM() * 30)::int) || '}')::jsonb,
    (CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')),
    true
FROM users u
JOIN tests t ON t.grade_level = u.grade_level
WHERE u.grade_level IS NOT NULL;

-- Check final counts
SELECT 'Final table counts:' as info;
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tests' as table_name, COUNT(*) as count FROM tests
UNION ALL
SELECT 'test_results' as table_name, COUNT(*) as count FROM test_results;

-- Show sample test results
SELECT 'Sample test results:' as info;
SELECT 
    u.nickname,
    u.grade_level,
    u.class_name,
    t.test_number,
    tr.score,
    tr.max_score
FROM test_results tr
JOIN users u ON tr.user_id = u.id
JOIN tests t ON tr.test_id = t.id
ORDER BY u.grade_level, u.class_name, u.nickname, t.test_number
LIMIT 20;
