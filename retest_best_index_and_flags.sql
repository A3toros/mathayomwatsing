-- Retest best-attempt index and retest_offered flags for all result tables
-- Safe to run multiple times (IF NOT EXISTS used where applicable)

BEGIN;

-- Best-attempt index only (keep everything else unchanged)
CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer
ON test_attempts (
  student_id,
  test_id,
  percentage DESC,
  attempt_number DESC
)
INCLUDE (score, max_score, submitted_at)
WHERE retest_assignment_id IS NOT NULL;

-- Optional: per-result-row linkage to the best retest attempt (pointer only)
-- Adds a nullable column to each results table to store the chosen best retest attempt id
-- No triggers here; you can set this from the API when computing best attempt

ALTER TABLE multiple_choice_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_mc_best_retest_attempt ON multiple_choice_test_results(best_retest_attempt_id);

ALTER TABLE true_false_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_tf_best_retest_attempt ON true_false_test_results(best_retest_attempt_id);

ALTER TABLE input_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_input_best_retest_attempt ON input_test_results(best_retest_attempt_id);

ALTER TABLE matching_type_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_mt_best_retest_attempt ON matching_type_test_results(best_retest_attempt_id);

ALTER TABLE word_matching_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_wm_best_retest_attempt ON word_matching_test_results(best_retest_attempt_id);

ALTER TABLE drawing_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_drawing_best_retest_attempt ON drawing_test_results(best_retest_attempt_id);

ALTER TABLE fill_blanks_test_results
  ADD COLUMN IF NOT EXISTS best_retest_attempt_id bigint;
CREATE INDEX IF NOT EXISTS idx_fb_best_retest_attempt ON fill_blanks_test_results(best_retest_attempt_id);

-- Minimal in-table flag: teacher-offered retest marker (default false)
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS retest_offered boolean NOT NULL DEFAULT false;

-- Utility: mark or clear the teacher-offered retest flag across all result tables
CREATE OR REPLACE FUNCTION set_retest_offered(p_student_id text, p_test_id integer, p_flag boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE multiple_choice_test_results  SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE true_false_test_results       SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE input_test_results            SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE matching_type_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE word_matching_test_results    SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE drawing_test_results          SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE fill_blanks_test_results      SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
END;
$$;

COMMIT;


