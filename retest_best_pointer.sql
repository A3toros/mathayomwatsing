-- Compute-and-persist best retest attempt pointer into results tables
-- Safe to run multiple times; uses CREATE OR REPLACE

BEGIN;

-- Helper index (idempotent). If it's already created elsewhere, this will be a no-op.
CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer
ON test_attempts (
  student_id,
  test_id,
  percentage DESC,
  attempt_number DESC
)
INCLUDE (id, score, max_score, submitted_at)
WHERE retest_assignment_id IS NOT NULL;

-- Function: update_best_retest_pointer
-- Picks the best retest attempt for the (student_id, test_id) and writes its id
-- into best_retest_attempt_id across the results tables.
CREATE OR REPLACE FUNCTION update_best_retest_pointer(p_student_id text, p_test_id integer)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_best_id bigint;
BEGIN
  SELECT ta.id
  INTO v_best_id
  FROM test_attempts ta
  WHERE ta.student_id = p_student_id
    AND ta.test_id = p_test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1;

  -- Update pointers in all result tables (only matching row will change)
  UPDATE multiple_choice_test_results  SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE true_false_test_results       SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE input_test_results            SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE matching_type_test_results    SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE word_matching_test_results    SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE drawing_test_results          SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
  UPDATE fill_blanks_test_results      SET best_retest_attempt_id = v_best_id WHERE student_id = p_student_id AND test_id = p_test_id;
END;
$$;

-- Optional helper: call after inserting a retest attempt to refresh pointer
-- Example: SELECT update_best_retest_pointer('51712', 18);

COMMIT;


