-- Retests feature schema
-- Implements targeted retests per RETESTS_IMPLEMENTATION_PLAN.md
-- Note: We use (test_type, test_id) instead of a single FK to a tests table
-- because tests are stored across multiple tables (multiple_choice, true_false, input, drawing, etc.).

BEGIN;

-- Table: retest_assignments
-- Defines a retest window and policy for a subset of students on a specific original test
CREATE TABLE IF NOT EXISTS retest_assignments (
  id SERIAL PRIMARY KEY,
  test_type VARCHAR(20) NOT NULL,                 -- e.g. 'multiple_choice', 'true_false', 'input', 'drawing', 'matching_type', 'word_matching'
  test_id INTEGER NOT NULL,                       -- original test id in its own table
  teacher_id VARCHAR(50) NOT NULL REFERENCES teachers(teacher_id),
  subject_id INTEGER NOT NULL REFERENCES subjects(subject_id),
  grade INTEGER NOT NULL,
  class INTEGER NOT NULL,
  passing_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  scoring_policy VARCHAR(10) NOT NULL DEFAULT 'BEST', -- BEST|LATEST|AVERAGE
  max_attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_scoring_policy CHECK (scoring_policy IN ('BEST','LATEST','AVERAGE')),
  CONSTRAINT chk_window CHECK (window_end > window_start),
  CONSTRAINT chk_grade_pos CHECK (grade > 0),
  CONSTRAINT chk_class_pos CHECK (class > 0)
);

-- Helpful indexes for querying active windows and teacher/subject filters
CREATE INDEX IF NOT EXISTS idx_retest_assignments_teacher ON retest_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_subject ON retest_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_test ON retest_assignments(test_type, test_id);
-- Active window partial index (only rows whose window is currently active)
-- Note: Avoid partial index using NOW() (not IMMUTABLE). Use regular indexes instead.
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_start ON retest_assignments(window_start);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_end ON retest_assignments(window_end);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_range ON retest_assignments(window_start, window_end);


-- Table: retest_targets
-- Per-student targeting for a given retest assignment
CREATE TABLE IF NOT EXISTS retest_targets (
  id SERIAL PRIMARY KEY,
  retest_assignment_id INTEGER NOT NULL REFERENCES retest_assignments(id) ON DELETE CASCADE,
  student_id VARCHAR(10) NOT NULL REFERENCES users(student_id),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING', -- PENDING|IN_PROGRESS|PASSED|FAILED|EXPIRED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_retest_status CHECK (status IN ('PENDING','IN_PROGRESS','PASSED','FAILED','EXPIRED')),
  CONSTRAINT uq_retest_target UNIQUE (retest_assignment_id, student_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_retest_targets_assignment ON retest_targets(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_student ON retest_targets(student_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_status ON retest_targets(status);


-- Optional: augment existing results tables to carry retest metadata directly (uncomment as needed)
-- This improves analytics/join performance but is not strictly required if using test_attempts as the linkage.
--
ALTER TABLE multiple_choice_test_results 
ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
 ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_mc_retest_assignment_student 
--   ON multiple_choice_test_results(retest_assignment_id, student_id);
--
ALTER TABLE true_false_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_tf_retest_assignment_student 
  ON true_false_test_results(retest_assignment_id, student_id);

ALTER TABLE input_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_input_retest_assignment_student 
  ON input_test_results(retest_assignment_id, student_id);

-- Add for matching type, word matching, fill blanks, drawing
ALTER TABLE matching_type_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_match_retest_assignment_student 
  ON matching_type_test_results(retest_assignment_id, student_id);

ALTER TABLE word_matching_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_wordmatch_retest_assignment_student 
  ON word_matching_test_results(retest_assignment_id, student_id);

ALTER TABLE fill_blanks_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_fillblanks_retest_assignment_student 
  ON fill_blanks_test_results(retest_assignment_id, student_id);

ALTER TABLE drawing_test_results 
  ADD COLUMN IF NOT EXISTS retest_assignment_id INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_drawing_retest_assignment_student 
  ON drawing_test_results(retest_assignment_id, student_id);


-- Notes:
-- 1) Submission handlers should update retest_targets.attempt_count/last_attempt_at/status
--    and insert into test_attempts with the computed attempt_number.
-- 2) Semester/class summary views can derive is_retest as (attempt_count > 0 for that test)
--    or by checking presence of retest_assignment_id in result tables if columns are added.

COMMIT;


