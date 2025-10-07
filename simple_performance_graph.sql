

-- 1. Simple view for test performance data
CREATE OR REPLACE VIEW test_performance_by_test AS
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM multiple_choice_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- True/False Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM true_false_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Input Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM input_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Matching Type Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM matching_type_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Word Matching Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM word_matching_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Drawing Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM drawing_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Fill Blanks Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM fill_blanks_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    -- Speaking Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class
    FROM speaking_test_results 
    WHERE is_completed = true
)
SELECT 
    teacher_id,
    test_id,
    test_name,
    AVG(percentage) as average_score,
    COUNT(*) as total_students,
    submitted_at,
    academic_period_id,
    grade,
    class
FROM all_test_results
GROUP BY teacher_id, test_id, test_name, submitted_at, academic_period_id, grade, class
ORDER BY submitted_at ASC;

-- 2. Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_period ON multiple_choice_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_period ON true_false_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_period ON input_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_period ON matching_type_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_period ON word_matching_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_period ON drawing_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_period ON fill_blanks_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_period ON speaking_test_results(teacher_id, academic_period_id, submitted_at);

-- 3. Simple query to use in API
-- SELECT test_id, test_name, average_score, total_students, submitted_at
-- FROM test_performance_by_test
-- WHERE teacher_id = $1 AND academic_period_id = $2
-- ORDER BY submitted_at ASC;

-- That's it! No overengineering, just what we need for the graph.
