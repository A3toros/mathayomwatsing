-- ========================================
-- TEACHER STUDENT RESULTS VIEW
-- Comprehensive view for get-teacher-student-results.js function
-- Combines all test result types with retest logic and best scores
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-teacher-student-results.js SQL queries exactly
-- ========================================

CREATE OR REPLACE VIEW teacher_student_results_view AS
-- Matching Type Test Results (best retest coalesced into score/max_score)
SELECT 
    'matching_type' as test_type,
    m.id,
    m.test_id,
    m.test_name,
    m.teacher_id,
    m.subject_id,
    m.grade,
    m.class,
    m.number,
    m.student_id,
    m.name,
    m.surname,
    m.nickname,
    COALESCE(m_best.best_score, m.score)       AS score,
    COALESCE(m_best.best_max,   m.max_score)   AS max_score,
    m.percentage,
    m.answers,
    m.time_taken,
    m.started_at,
    m.submitted_at,
    NULL::text as transcript,
    COALESCE(m_best.best_caught_cheating, m.caught_cheating) AS caught_cheating,
    COALESCE(m_best.best_visibility_change_times, m.visibility_change_times) AS visibility_change_times,
    m.is_completed,
    m.retest_offered,
    m.created_at,
    m.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM matching_type_test_results m
LEFT JOIN subjects s ON m.subject_id = s.subject_id
LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = m.student_id
      AND ta.test_id = m.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) m_best ON TRUE

UNION ALL

-- Multiple Choice Test Results (best retest coalesced into score/max_score)
SELECT 
    'multiple_choice' as test_type,
    mc.id,
    mc.test_id,
    mc.test_name,
    mc.teacher_id,
    mc.subject_id,
    mc.grade,
    mc.class,
    mc.number,
    mc.student_id,
    mc.name,
    mc.surname,
    mc.nickname,
    COALESCE(mc_best.best_score, mc.score)     AS score,
    COALESCE(mc_best.best_max,   mc.max_score) AS max_score,
    mc.percentage,
    mc.answers,
    mc.time_taken,
    mc.started_at,
    mc.submitted_at,
    NULL::text as transcript,
    COALESCE(mc_best.best_caught_cheating, mc.caught_cheating) AS caught_cheating,
    COALESCE(mc_best.best_visibility_change_times, mc.visibility_change_times) AS visibility_change_times,
    mc.is_completed,
    mc.retest_offered,
    mc.created_at,
    mc.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM multiple_choice_test_results mc
LEFT JOIN subjects s ON mc.subject_id = s.subject_id
LEFT JOIN teachers t ON mc.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = mc.student_id 
      AND ta.test_id = mc.test_id 
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) mc_best ON TRUE

UNION ALL

-- True/False Test Results (best retest coalesced into score/max_score)
SELECT 
    'true_false' as test_type,
    tf.id,
    tf.test_id,
    tf.test_name,
    tf.teacher_id,
    tf.subject_id,
    tf.grade,
    tf.class,
    tf.number,
    tf.student_id,
    tf.name,
    tf.surname,
    tf.nickname,
    COALESCE(tf_best.best_score, tf.score)     AS score,
    COALESCE(tf_best.best_max,   tf.max_score) AS max_score,
    tf.percentage,
    tf.answers,
    tf.time_taken,
    tf.started_at,
    tf.submitted_at,
    NULL::text as transcript,
    COALESCE(tf_best.best_caught_cheating, tf.caught_cheating) AS caught_cheating,
    COALESCE(tf_best.best_visibility_change_times, tf.visibility_change_times) AS visibility_change_times,
    tf.is_completed,
    tf.retest_offered,
    tf.created_at,
    tf.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM true_false_test_results tf
LEFT JOIN subjects s ON tf.subject_id = s.subject_id
LEFT JOIN teachers t ON tf.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = tf.student_id
      AND ta.test_id = tf.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) tf_best ON TRUE

UNION ALL

-- Input Test Results (best retest coalesced into score/max_score)
SELECT 
    'input' as test_type,
    i.id,
    i.test_id,
    i.test_name,
    i.teacher_id,
    i.subject_id,
    i.grade,
    i.class,
    i.number,
    i.student_id,
    i.name,
    i.surname,
    i.nickname,
    COALESCE(i_best.best_score, i.score)       AS score,
    COALESCE(i_best.best_max,   i.max_score)   AS max_score,
    i.percentage,
    i.answers,
    i.time_taken,
    i.started_at,
    i.submitted_at,
    NULL::text as transcript,
    COALESCE(i_best.best_caught_cheating, i.caught_cheating) AS caught_cheating,
    COALESCE(i_best.best_visibility_change_times, i.visibility_change_times) AS visibility_change_times,
    i.is_completed,
    i.retest_offered,
    i.created_at,
    i.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM input_test_results i
LEFT JOIN subjects s ON i.subject_id = s.subject_id
LEFT JOIN teachers t ON i.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = i.student_id
      AND ta.test_id = i.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) i_best ON TRUE

UNION ALL

-- Word Matching Test Results (best retest coalesced into score/max_score)
SELECT 
    'word_matching' as test_type,
    w.id,
    w.test_id,
    w.test_name,
    w.teacher_id,
    w.subject_id,
    w.grade,
    w.class,
    w.number,
    w.student_id,
    w.name,
    w.surname,
    w.nickname,
    COALESCE(w_best.best_score, w.score)       AS score,
    COALESCE(w_best.best_max,   w.max_score)   AS max_score,
    w.percentage,
    w.answers,
    w.time_taken,
    w.started_at,
    w.submitted_at,
    NULL::text as transcript,
    COALESCE(w_best.best_caught_cheating, w.caught_cheating) AS caught_cheating,
    COALESCE(w_best.best_visibility_change_times, w.visibility_change_times) AS visibility_change_times,
    w.is_completed,
    w.retest_offered,
    w.created_at,
    w.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM word_matching_test_results w
LEFT JOIN subjects s ON w.subject_id = s.subject_id
LEFT JOIN teachers t ON w.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = w.student_id
      AND ta.test_id = w.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) w_best ON TRUE

UNION ALL

-- Drawing Test Results (best retest coalesced into score/max_score, drawing data from retests)
SELECT 
    'drawing' as test_type,
    d.id,
    d.test_id,
    d.test_name,
    d.teacher_id,
    d.subject_id,
    d.grade,
    d.class,
    d.number,
    d.student_id,
    d.name,
    d.surname,
    d.nickname,
    COALESCE(d_best.best_score, d.score)       AS score,
    COALESCE(d_best.best_max,   d.max_score)   AS max_score,
    d.percentage,
    -- Use retest drawing data if available, otherwise use original
    COALESCE(d_best.best_answers, d.answers)   AS answers,
    d.time_taken,
    d.started_at,
    d.submitted_at,
    NULL::text as transcript,
    COALESCE(d_best.best_caught_cheating, d.caught_cheating) AS caught_cheating,
    COALESCE(d_best.best_visibility_change_times, d.visibility_change_times) AS visibility_change_times,
    d.is_completed,
    d.retest_offered,
    d.created_at,
    d.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM drawing_test_results d
LEFT JOIN subjects s ON d.subject_id = s.subject_id
LEFT JOIN teachers t ON d.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.answers AS best_answers, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = d.student_id
      AND ta.test_id = d.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) d_best ON TRUE

UNION ALL

-- Fill Blanks Test Results (best retest coalesced into score/max_score)
SELECT 
    'fill_blanks' as test_type,
    fb.id,
    fb.test_id,
    fb.test_name,
    fb.teacher_id,
    fb.subject_id,
    fb.grade,
    fb.class,
    fb.number,
    fb.student_id,
    fb.name,
    fb.surname,
    fb.nickname,
    COALESCE(fb_best.best_score, fb.score)     AS score,
    COALESCE(fb_best.best_max,   fb.max_score) AS max_score,
    fb.percentage,
    fb.answers,
    fb.time_taken,
    fb.started_at,
    fb.submitted_at,
    NULL::text as transcript,
    COALESCE(fb_best.best_caught_cheating, fb.caught_cheating) AS caught_cheating,
    COALESCE(fb_best.best_visibility_change_times, fb.visibility_change_times) AS visibility_change_times,
    fb.is_completed,
    fb.retest_offered,
    fb.created_at,
    fb.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    t.first_name as teacher_name,
    NULL::text as audio_url
FROM fill_blanks_test_results fb
LEFT JOIN subjects s ON fb.subject_id = s.subject_id
LEFT JOIN teachers t ON fb.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = fb.student_id
      AND ta.test_id = fb.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) fb_best ON TRUE

UNION ALL

-- Speaking Test Results (best retest coalesced into score/max_score)
SELECT 
    'speaking' as test_type,
    s.id, s.test_id, s.test_name, s.teacher_id, s.subject_id,
    s.grade, s.class, s.number, s.student_id, s.name, s.surname, s.nickname,
    COALESCE(s_best.best_score, s.score) AS score,
    COALESCE(s_best.best_max, s.max_score) AS max_score,
    s.percentage,
    COALESCE(s_best.best_answers, json_build_object('audio_url', s.audio_url)::jsonb) as answers,
    s.time_taken, s.started_at, s.submitted_at,
    COALESCE(s.transcript, (s_best.best_answers->>'transcript')) as transcript,
    COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
    COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times,
    s.is_completed, s.retest_offered, s.created_at, s.academic_period_id,
    COALESCE(
        s.ai_feedback,
        jsonb_build_object(
            'overall_score', s.overall_score,
            'word_count', s.word_count,
            'grammar_mistakes', s.grammar_mistakes,
            'vocabulary_mistakes', s.vocabulary_mistakes
        )
    ) as ai_feedback,
    subj.subject, t.first_name as teacher_name,
    COALESCE(s_best.best_audio_url, s.audio_url) AS audio_url
FROM speaking_test_results s
LEFT JOIN subjects subj ON s.subject_id = subj.subject_id
LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
    SELECT ta.score AS best_score, ta.max_score AS best_max, 
           ta.answers AS best_answers,
           COALESCE(ta.audio_url, NULLIF(ta.answers->>'audio_url', '')) AS best_audio_url,
           ta.caught_cheating AS best_caught_cheating, 
           ta.visibility_change_times AS best_visibility_change_times
    FROM test_attempts ta
    WHERE ta.student_id = s.student_id
      AND ta.test_id = s.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
) s_best ON TRUE

ORDER BY student_id, test_name, created_at DESC;
