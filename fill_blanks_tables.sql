-- Fill Blanks Test Tables - Complete Schema
-- This file drops existing tables and creates new ones with the complete schema

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS fill_blanks_test_results CASCADE;
DROP TABLE IF EXISTS fill_blanks_test_questions CASCADE;
DROP TABLE IF EXISTS fill_blanks_tests CASCADE;

-- Create main Fill Blanks Tests table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Fill Blanks Test Questions table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Fill Blanks Test Results table
CREATE TABLE fill_blanks_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    student_id VARCHAR(50) REFERENCES users(student_id),
    student_name VARCHAR(100),
    student_surname VARCHAR(100),
    student_nickname VARCHAR(50),
    student_grade INTEGER,
    student_class VARCHAR(50),
    student_number INTEGER,
    answers JSONB NOT NULL, -- Student's answers
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    time_taken INTEGER, -- Time taken in seconds
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT FALSE,
    visibility_change_times INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_fill_blanks_tests_teacher_id ON fill_blanks_tests(teacher_id);
CREATE INDEX idx_fill_blanks_tests_subject_id ON fill_blanks_tests(subject_id);
CREATE INDEX idx_fill_blanks_tests_created_at ON fill_blanks_tests(created_at);

CREATE INDEX idx_fill_blanks_questions_test_id ON fill_blanks_test_questions(test_id);
CREATE INDEX idx_fill_blanks_questions_question_id ON fill_blanks_test_questions(question_id);

CREATE INDEX idx_fill_blanks_results_test_id ON fill_blanks_test_results(test_id);
CREATE INDEX idx_fill_blanks_results_student_id ON fill_blanks_test_results(student_id);
CREATE INDEX idx_fill_blanks_results_teacher_id ON fill_blanks_test_results(teacher_id);
CREATE INDEX idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX idx_fill_blanks_results_score ON fill_blanks_test_results(score);

-- Add comments for documentation
COMMENT ON TABLE fill_blanks_tests IS 'Main table for Fill Blanks tests with rich text content and multiple choice blanks';
COMMENT ON TABLE fill_blanks_test_questions IS 'Individual blank questions with options and correct answers';
COMMENT ON TABLE fill_blanks_test_results IS 'Student test results and performance data';

COMMENT ON COLUMN fill_blanks_tests.test_text IS 'Full rich text content from Lexical editor with [BLANKX] placeholders';
COMMENT ON COLUMN fill_blanks_tests.separate_type IS 'TRUE = separate mode (questions below), FALSE = inline mode (clickable blanks)';
COMMENT ON COLUMN fill_blanks_tests.allowed_time IS 'Timer in minutes (NULL = no timer)';

COMMENT ON COLUMN fill_blanks_test_questions.question_json IS 'Question text for this specific blank';
COMMENT ON COLUMN fill_blanks_test_questions.blank_positions IS 'Position information for blank in main text';
COMMENT ON COLUMN fill_blanks_test_questions.blank_options IS 'Array of answer options for this blank';
COMMENT ON COLUMN fill_blanks_test_questions.correct_answers IS 'Correct answer(s) for this blank';

COMMENT ON COLUMN fill_blanks_test_results.answers IS 'Student answers mapped by blank ID';
COMMENT ON COLUMN fill_blanks_test_results.caught_cheating IS 'Anti-cheating detection flag';
COMMENT ON COLUMN fill_blanks_test_results.visibility_change_times IS 'Number of tab switches/visibility changes';

-- Insert sample data (optional - for testing)
-- INSERT INTO fill_blanks_tests (teacher_id, subject_id, test_name, test_text, num_questions, num_blanks, separate_type, passing_score, allowed_time) VALUES
-- ('T001', 1, 'Sample Fill Blanks Test', 'The capital of France is [BLANK1] and the capital of Germany is [BLANK2].', 2, 2, TRUE, 100, 10);

-- INSERT INTO fill_blanks_test_questions (test_id, question_id, question_json, blank_positions, blank_options, correct_answers) VALUES
-- (1, 1, '{"question": "What is the capital of France?"}', '{"position": 1}', '["Paris", "London", "Berlin", "Madrid"]', '["A"]'),
-- (1, 2, '{"question": "What is the capital of Germany?"}', '{"position": 2}', '["Berlin", "Munich", "Hamburg", "Cologne"]', '["A"]');

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fill_blanks_tests TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fill_blanks_test_questions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fill_blanks_test_results TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE fill_blanks_tests_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE fill_blanks_test_questions_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE fill_blanks_test_results_id_seq TO your_app_user;
