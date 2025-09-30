-- Persist best retest SCORE/MAX/PERCENTAGE into results tables (not just an attempt id)
-- Safe and idempotent: adds columns if missing and provides a single function to update them.

BEGIN;

-- Add best_retest_* columns to all results tables
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE multiple_choice_test_results  ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE true_false_test_results       ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE input_test_results            ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE matching_type_test_results    ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE word_matching_test_results    ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE drawing_test_results          ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_score integer;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_max_score integer;
ALTER TABLE fill_blanks_test_results      ADD COLUMN IF NOT EXISTS best_retest_percentage numeric;

-- Helper function: compute best retest attempt and persist values into corresponding results row(s)
CREATE OR REPLACE FUNCTION update_best_retest_values(p_student_id text, p_test_id integer)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_score integer;
  v_max   integer;
  v_pct   numeric;
BEGIN
  SELECT ta.score, ta.max_score, ta.percentage
  INTO v_score, v_max, v_pct
  FROM test_attempts ta
  WHERE ta.student_id = p_student_id
    AND ta.test_id = p_test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1;

  -- If no retest attempts exist, do nothing (preserve existing values)
  IF v_score IS NOT NULL THEN
    UPDATE multiple_choice_test_results  SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE true_false_test_results       SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE input_test_results            SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE matching_type_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE word_matching_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE drawing_test_results          SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE fill_blanks_test_results      SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
  END IF;
END;
$$;

COMMIT;


