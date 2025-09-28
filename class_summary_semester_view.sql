-- ========================================
-- SEMESTER-LEVEL CLASS SUMMARY MATERIALIZED VIEW
-- ========================================

-- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS class_summary_view CASCADE;

-- Create the new semester-based materialized view
CREATE MATERIALIZED VIEW class_summary_view AS
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM multiple_choice_test_results
    WHERE is_completed = true

    UNION ALL

    -- True/False Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM true_false_test_results
    WHERE is_completed = true

    UNION ALL

    -- Input Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM input_test_results
    WHERE is_completed = true

    UNION ALL

    -- Matching Type Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM matching_type_test_results
    WHERE is_completed = true

    UNION ALL

    -- Word Matching Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM word_matching_test_results
    WHERE is_completed = true

    UNION ALL

    -- Drawing Test Results
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_period_id,
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        is_completed
    FROM drawing_test_results
    WHERE is_completed = true

    UNION ALL

    -- Fill Blanks Test Results
    SELECT 
        teacher_id,
        subject_id,
        student_grade as grade,
        student_class as class,
        NULL as academic_period_id, -- Fill blanks tests don't have academic_period_id yet
        test_id,
        test_name,
        student_id,
        score,
        max_score,
        percentage_score as percentage,
        submitted_at,
        caught_cheating,
        visibility_change_times,
        true as is_completed -- Fill blanks tests are always completed when submitted
    FROM fill_blanks_test_results
),
semester_mapping AS (
    -- Map academic_period_id to semester and academic_year
    SELECT 
        ay.id as academic_period_id,
        ay.academic_year,
        ay.semester,
        ay.start_date,
        ay.end_date
    FROM academic_year ay
),
semester_results AS (
    -- Join test results with semester mapping
    SELECT 
        atr.*,
        sm.academic_year,
        sm.semester,
        sm.start_date as semester_start,
        sm.end_date as semester_end
    FROM all_test_results atr
    JOIN semester_mapping sm ON atr.academic_period_id = sm.academic_period_id
),
class_stats AS (
    SELECT 
        teacher_id,
        subject_id,
        grade,
        class,
        academic_year,
        semester,
        
        -- Student counts
        COUNT(DISTINCT student_id) as total_students,
        
        -- Test counts  
        COUNT(DISTINCT test_id) as total_tests,
        COUNT(*) as completed_tests,
        
        -- Score statistics
        ROUND(AVG(percentage), 2) as average_class_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        
        -- Performance metrics
        ROUND(
            (COUNT(CASE WHEN percentage >= 60 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
        ) as pass_rate,
        
        -- Cheating incidents
        COUNT(CASE WHEN caught_cheating = true THEN 1 END) as cheating_incidents,
        COUNT(CASE WHEN visibility_change_times > 5 THEN 1 END) as high_visibility_change_students,
        
        -- Recent activity
        MAX(submitted_at) as last_test_date,
        CURRENT_TIMESTAMP as last_updated
        
    FROM semester_results
    GROUP BY teacher_id, subject_id, grade, class, academic_year, semester
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY teacher_id, subject_id, grade, class, academic_year, semester) as id,
    teacher_id,
    subject_id,
    grade,
    class,
    academic_year,
    semester,
    total_students,
    total_tests,
    completed_tests,
    average_class_score,
    highest_score,
    lowest_score,
    pass_rate,
    cheating_incidents,
    high_visibility_change_students,
    last_test_date,
    last_updated,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM class_stats;

-- Create indexes for performance on underlying tables
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class_period 
ON multiple_choice_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class_period 
ON true_false_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class_period 
ON input_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class_period 
ON matching_type_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class_period 
ON word_matching_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class_period 
ON drawing_test_results(teacher_id, grade, class, academic_period_id);

CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_grade_class 
ON fill_blanks_test_results(teacher_id, student_grade, student_class);

-- Add indexes for completion status and cheating detection
CREATE INDEX IF NOT EXISTS idx_mc_results_completed_cheating 
ON multiple_choice_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_tf_results_completed_cheating 
ON true_false_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_input_results_completed_cheating 
ON input_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_matching_results_completed_cheating 
ON matching_type_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_completed_cheating 
ON word_matching_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_drawing_results_completed_cheating 
ON drawing_test_results(is_completed, caught_cheating, visibility_change_times);

CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_completed_cheating 
ON fill_blanks_test_results(caught_cheating, visibility_change_times);

-- Create indexes on the materialized view for fast queries
CREATE INDEX IF NOT EXISTS idx_class_summary_teacher ON class_summary_view(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_subject ON class_summary_view(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_class ON class_summary_view(grade, class);
CREATE INDEX IF NOT EXISTS idx_class_summary_semester ON class_summary_view(academic_year, semester);

-- Refresh the materialized view (run this after creating)
REFRESH MATERIALIZED VIEW class_summary_view;
