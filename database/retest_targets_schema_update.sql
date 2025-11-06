-- ========================================
-- RETEST TARGETS SCHEMA UPDATE
-- Database-driven retest completion tracking
-- ========================================

-- Add new columns to retest_targets table
ALTER TABLE retest_targets
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE;

-- Migrate existing data
-- Copy max_attempts from retest_assignments
UPDATE retest_targets rt
SET max_attempts = ra.max_attempts
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND rt.max_attempts IS NULL;

-- Set attempt_number = attempt_count for existing records
UPDATE retest_targets
SET attempt_number = attempt_count
WHERE attempt_number = 0 AND attempt_count > 0;

-- Set is_completed for existing completed retests
-- Completed if: attempts exhausted OR status = 'PASSED'
UPDATE retest_targets rt
SET is_completed = TRUE,
    completed_at = COALESCE(rt.last_attempt_at, rt.updated_at)
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND (
    (rt.attempt_count >= ra.max_attempts) OR
    (rt.status = 'PASSED')
  )
  AND rt.is_completed = FALSE;

-- Set passed flag based on status
UPDATE retest_targets
SET passed = TRUE
WHERE status = 'PASSED'
  AND passed = FALSE;

-- Fix any rows where attempt_number exceeds max_attempts
-- This can happen if max_attempts was changed after attempts were made
UPDATE retest_targets rt
SET attempt_number = ra.max_attempts
FROM retest_assignments ra
WHERE rt.retest_assignment_id = ra.id
  AND rt.attempt_number > ra.max_attempts
  AND ra.max_attempts IS NOT NULL;

-- Also fix attempt_count to match attempt_number
UPDATE retest_targets
SET attempt_count = attempt_number
WHERE attempt_count != attempt_number;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_retest_targets_is_completed 
  ON retest_targets(is_completed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_passed 
  ON retest_targets(passed);
CREATE INDEX IF NOT EXISTS idx_retest_targets_completed_at 
  ON retest_targets(completed_at);
CREATE INDEX IF NOT EXISTS idx_retest_targets_attempt_number 
  ON retest_targets(attempt_number);
CREATE INDEX IF NOT EXISTS idx_retest_targets_max_attempts 
  ON retest_targets(max_attempts);

-- Add constraint to ensure attempt_number <= max_attempts (when both are set)
-- Note: Drop constraint first if it exists, then add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_attempt_number_range' 
    AND conrelid = 'retest_targets'::regclass
  ) THEN
    ALTER TABLE retest_targets DROP CONSTRAINT chk_attempt_number_range;
  END IF;
END $$;

ALTER TABLE retest_targets
  ADD CONSTRAINT chk_attempt_number_range
  CHECK (max_attempts IS NULL OR attempt_number IS NULL OR attempt_number <= max_attempts);

-- Add comment for documentation
COMMENT ON COLUMN retest_targets.max_attempts IS 'Copied from retest_assignments.max_attempts for faster queries';
COMMENT ON COLUMN retest_targets.attempt_number IS 'Current attempt number (0 = not started, 1 = first attempt, etc.)';
COMMENT ON COLUMN retest_targets.is_completed IS 'TRUE when attempts exhausted OR student passed';
COMMENT ON COLUMN retest_targets.completed_at IS 'Timestamp when retest was completed';
COMMENT ON COLUMN retest_targets.passed IS 'TRUE if student passed (percentage >= passing_threshold)';

-- Add indexes on retest_assignment_id for all test results tables (if not already exist)
-- These indexes help with queries that filter by retest_assignment_id
CREATE INDEX IF NOT EXISTS idx_mc_results_retest_assignment_id 
  ON multiple_choice_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_retest_assignment_id 
  ON true_false_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_input_results_retest_assignment_id 
  ON input_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_retest_assignment_id 
  ON matching_type_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_retest_assignment_id 
  ON word_matching_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_retest_assignment_id 
  ON drawing_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_retest_assignment_id 
  ON fill_blanks_test_results(retest_assignment_id);
-- Speaking already has this index (idx_speaking_results_retest_assignment_id)

-- Verification query
SELECT 
  'retest_targets schema update completed' as status,
  COUNT(*) FILTER (WHERE max_attempts IS NOT NULL) as records_with_max_attempts,
  COUNT(*) FILTER (WHERE is_completed = TRUE) as completed_retests,
  COUNT(*) FILTER (WHERE passed = TRUE) as passed_retests
FROM retest_targets;

