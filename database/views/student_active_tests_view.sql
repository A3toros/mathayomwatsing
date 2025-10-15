-- ========================================
-- STUDENT ACTIVE TESTS VIEW
-- Comprehensive view for get-student-active-tests.js function
-- Combines test assignments with detailed test information for students
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-student-active-tests.js SQL queries exactly
-- ========================================

DROP VIEW IF EXISTS student_active_tests_view;
CREATE VIEW student_active_tests_view AS
WITH latest_assignments AS (
  SELECT
    ta.*,
    ROW_NUMBER() OVER (
      PARTITION BY ta.test_type, ta.test_id, ta.grade, ta.class
      ORDER BY ta.assigned_at DESC, ta.due_date DESC, ta.id DESC
    ) AS rn
  FROM test_assignments ta
  WHERE ta.is_active = true
)
-- Multiple Choice Tests with Assignments
SELECT 
    'multiple_choice' as test_type,
    mct.id as test_id,
    mct.test_name,
    mct.num_questions,
    mct.created_at,
    mct.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM multiple_choice_tests mct
INNER JOIN latest_assignments la ON mct.id = la.test_id AND la.test_type = 'multiple_choice' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id

UNION ALL

-- True/False Tests with Assignments
SELECT 
    'true_false' as test_type,
    tft.id as test_id,
    tft.test_name,
    tft.num_questions,
    tft.created_at,
    tft.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM true_false_tests tft
INNER JOIN latest_assignments la ON tft.id = la.test_id AND la.test_type = 'true_false' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id

UNION ALL

-- Input Tests with Assignments
SELECT 
    'input' as test_type,
    it.id as test_id,
    it.test_name,
    it.num_questions,
    it.created_at,
    it.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM input_tests it
INNER JOIN latest_assignments la ON it.id = la.test_id AND la.test_type = 'input' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON it.teacher_id = t.teacher_id

UNION ALL

-- Matching Type Tests with Assignments
SELECT 
    'matching_type' as test_type,
    mtt.id as test_id,
    mtt.test_name,
    mtt.num_blocks as num_questions,
    mtt.created_at,
    mtt.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM matching_type_tests mtt
INNER JOIN latest_assignments la ON mtt.id = la.test_id AND la.test_type = 'matching_type' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON mtt.teacher_id = t.teacher_id

UNION ALL

-- Word Matching Tests with Assignments
SELECT 
    'word_matching' as test_type,
    wmt.id as test_id,
    wmt.test_name,
    wmt.num_questions,
    wmt.created_at,
    wmt.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM word_matching_tests wmt
INNER JOIN latest_assignments la ON wmt.id = la.test_id AND la.test_type = 'word_matching' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON wmt.teacher_id = t.teacher_id

UNION ALL

-- Drawing Tests with Assignments
SELECT 
    'drawing' as test_type,
    dt.id as test_id,
    dt.test_name,
    dt.num_questions,
    dt.created_at,
    dt.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM drawing_tests dt
INNER JOIN latest_assignments la ON dt.id = la.test_id AND la.test_type = 'drawing' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id

UNION ALL

-- Fill Blanks Tests with Assignments
SELECT 
    'fill_blanks' as test_type,
    fbt.id as test_id,
    fbt.test_name,
    fbt.num_blanks as num_questions,
    fbt.created_at,
    fbt.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM fill_blanks_tests fbt
INNER JOIN latest_assignments la ON fbt.id = la.test_id AND la.test_type = 'fill_blanks' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON fbt.teacher_id = t.teacher_id

UNION ALL

-- Speaking Tests with Assignments
SELECT 
    'speaking' as test_type,
    st.id as test_id,
    st.test_name,
    st.min_words as num_questions,
    st.created_at,
    st.updated_at,
    la.id as assignment_id,
    la.teacher_id,
    la.subject_id,
    la.grade,
    la.class,
    la.academic_period_id,
    la.assigned_at,
    la.due_date,
    la.is_active,
    u.student_id,
    s.subject as subject_name,
    t.username as teacher_name
FROM speaking_tests st
INNER JOIN latest_assignments la ON st.id = la.test_id AND la.test_type = 'speaking' AND la.rn = 1
LEFT JOIN subjects s ON la.subject_id = s.subject_id
LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
LEFT JOIN teachers t ON st.teacher_id = t.teacher_id

ORDER BY assigned_at DESC;
