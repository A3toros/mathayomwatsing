-- Drawing Test Database Schema
-- Add to existing database_schema_new.sql

-- 1. Main Drawing Tests Table
CREATE TABLE drawing_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL DEFAULT 1 CHECK (num_questions >= 1 AND num_questions <= 3),
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drawing Test Questions Table
CREATE TABLE drawing_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES drawing_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question_json JSONB NOT NULL, -- Lexical editor content for this question
    canvas_width INTEGER DEFAULT 600, -- Individual canvas width for this question
    canvas_height INTEGER DEFAULT 800, -- Individual canvas height for this question
    max_canvas_width INTEGER DEFAULT 1536, -- Maximum canvas width for this question
    max_canvas_height INTEGER DEFAULT 2048, -- Maximum canvas height for this question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Drawing Test Results Table
CREATE TABLE drawing_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES drawing_tests(id),
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
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL, -- Drawing URLs, canvas dimensions, and metadata
    time_taken INTEGER, -- in seconds
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- 4. Drawing Test Images Table (for individual question drawings)
CREATE TABLE drawing_test_images (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES drawing_test_results(id),
    question_id INTEGER NOT NULL,
    drawing_url TEXT NOT NULL, -- Cloudinary URL
    drawing_data JSONB, -- Canvas state data (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_drawing_tests_teacher_id ON drawing_tests(teacher_id);
CREATE INDEX idx_drawing_tests_subject_id ON drawing_tests(subject_id);
CREATE INDEX idx_drawing_test_questions_test_id ON drawing_test_questions(test_id);
CREATE INDEX idx_drawing_test_results_test_id ON drawing_test_results(test_id);
CREATE INDEX idx_drawing_test_results_student_id ON drawing_test_results(student_id);
CREATE INDEX idx_drawing_test_results_teacher_id ON drawing_test_results(teacher_id);
CREATE INDEX idx_drawing_test_images_result_id ON drawing_test_images(result_id);
