-- Fill Blanks Schema Replacement Script
-- This script DROPS the existing fill_blanks_test_results table and recreates it
-- with the standard schema pattern used by other test result tables
-- WARNING: This will DELETE ALL existing Fill Blanks test results data

-- Drop existing Fill Blanks tables in reverse dependency order
DROP TABLE IF EXISTS fill_blanks_test_results CASCADE;
DROP TABLE IF EXISTS fill_blanks_test_questions CASCADE;
DROP TABLE IF EXISTS fill_blanks_tests CASCADE;

-- Recreate Fill Blanks Tests table (main test table)
CREATE TABLE fill_blanks_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    test_text TEXT NOT NULL, -- Full text content from Lexical editor
    num_questions INTEGER NOT NULL,
    num_blanks INTEGER NOT NULL, -- Number of blanks in the text
    separate_type BOOLEAN DEFAULT TRUE, -- TRUE = separate mode, FALSE = inline mode
    passing_score INTEGER,
    allowed_time INTEGER, -- Timer support
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate Fill Blanks Test Questions table
CREATE TABLE fill_blanks_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL, -- Question number (1, 2, 3, etc.)
    question_json JSONB NOT NULL, -- Question text for this blank
    blank_positions JSONB NOT NULL, -- Position of blank in main text
    blank_options JSONB NOT NULL, -- Array of answer options
    correct_answers JSONB NOT NULL, -- Correct answer(s) for this blank
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate Fill Blanks Test Results table with STANDARD SCHEMA
CREATE TABLE fill_blanks_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL, -- Student's answers
    time_taken INTEGER, -- Time taken in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- Create indexes for better performance (matching other test result tables)
CREATE INDEX idx_fill_blanks_tests_teacher_id ON fill_blanks_tests(teacher_id);
CREATE INDEX idx_fill_blanks_tests_subject_id ON fill_blanks_tests(subject_id);
CREATE INDEX idx_fill_blanks_tests_created_at ON fill_blanks_tests(created_at);

CREATE INDEX idx_fill_blanks_questions_test_id ON fill_blanks_test_questions(test_id);
CREATE INDEX idx_fill_blanks_questions_question_id ON fill_blanks_test_questions(question_id);

CREATE INDEX idx_fill_blanks_results_test_id ON fill_blanks_test_results(test_id);
CREATE INDEX idx_fill_blanks_results_student_id ON fill_blanks_test_results(student_id);
CREATE INDEX idx_fill_blanks_results_teacher_id ON fill_blanks_test_results(teacher_id);
CREATE INDEX idx_fill_blanks_results_grade ON fill_blanks_test_results(grade);
CREATE INDEX idx_fill_blanks_results_class ON fill_blanks_test_results(class);
CREATE INDEX idx_fill_blanks_results_academic_period_id ON fill_blanks_test_results(academic_period_id);
CREATE INDEX idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX idx_fill_blanks_results_score ON fill_blanks_test_results(score);



-- Verify the new schema
SELECT 
    'Fill Blanks schema replacement completed successfully' as status,
    'All tables recreated with standard schema' as message,
    'WARNING: All existing Fill Blanks data has been deleted' as warning;
