-- ========================================
-- DATABASE SCHEMA MIGRATION
-- Complete schema with all updates included
-- Ready for production deployment
-- ========================================

-- ========================================
-- CORE TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_year (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    term INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_teacher_subject_grade_class 
    UNIQUE (teacher_id, subject_id, grade, class)
);

-- ========================================
-- TEST ASSIGNMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS test_assignments (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL,
    test_id INTEGER NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    subject_id INTEGER REFERENCES subjects(subject_id),
    academic_period_id INTEGER REFERENCES academic_year(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- MULTIPLE CHOICE TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS multiple_choice_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    num_options INTEGER NOT NULL,
    passing_score INTEGER,
    allowed_time INTEGER,
    is_shuffled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS multiple_choice_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES multiple_choice_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    option_e TEXT,
    option_f TEXT
);

CREATE TABLE IF NOT EXISTS multiple_choice_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES multiple_choice_tests(id),
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- TRUE/FALSE TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS true_false_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    passing_score INTEGER,
    allowed_time INTEGER,
    is_shuffled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS true_false_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES true_false_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS true_false_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES true_false_tests(id),
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- INPUT TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS input_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    passing_score INTEGER,
    allowed_time INTEGER,
    is_shuffled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS input_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES input_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answers TEXT[]
);

CREATE TABLE IF NOT EXISTS input_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES input_tests(id),
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- MATCHING TYPE TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS matching_type_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    num_blocks INTEGER NOT NULL,
    passing_score INTEGER,
    allowed_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matching_type_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    block_coordinates JSONB NOT NULL,
    has_arrow BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matching_type_test_arrows (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES matching_type_test_questions(id) ON DELETE CASCADE,
    start_x DECIMAL(10,4) NOT NULL,
    start_y DECIMAL(10,4) NOT NULL,
    end_x DECIMAL(10,4) NOT NULL,
    end_y DECIMAL(10,4) NOT NULL,
    rel_start_x DECIMAL(10,4),
    rel_start_y DECIMAL(10,4),
    rel_end_x DECIMAL(10,4),
    rel_end_y DECIMAL(10,4),
    image_width INTEGER,
    image_height INTEGER,
    arrow_style JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matching_type_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- WORD MATCHING TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS word_matching_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL DEFAULT 'drag',
    passing_score INTEGER,
    allowed_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS word_matching_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    left_word TEXT NOT NULL,
    right_word TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS word_matching_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- DRAWING TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS drawing_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL DEFAULT 1 CHECK (num_questions >= 1 AND num_questions <= 3),
    passing_score INTEGER,
    allowed_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drawing_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES drawing_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question_json JSONB NOT NULL,
    canvas_width INTEGER DEFAULT 600,
    canvas_height INTEGER DEFAULT 800,
    max_canvas_width INTEGER DEFAULT 1536,
    max_canvas_height INTEGER DEFAULT 2048,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drawing_test_results (
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

CREATE TABLE IF NOT EXISTS drawing_test_images (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES drawing_test_results(id),
    question_id INTEGER NOT NULL,
    drawing_url TEXT NOT NULL,
    drawing_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- FILL BLANKS TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS fill_blanks_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    test_text TEXT NOT NULL,
    num_questions INTEGER NOT NULL,
    num_blanks INTEGER NOT NULL,
    separate_type BOOLEAN DEFAULT TRUE,
    passing_score INTEGER,
    allowed_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fill_blanks_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES fill_blanks_tests(id) ON DELETE CASCADE,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    question_json JSONB NOT NULL,
    blank_positions JSONB NOT NULL,
    blank_options JSONB NOT NULL,
    correct_answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fill_blanks_test_results (
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
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    attempt_number INTEGER,
    best_retest_attempt_id BIGINT,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- ========================================
-- SPEAKING TESTS
-- ========================================

CREATE TABLE IF NOT EXISTS speaking_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL DEFAULT 1,
    time_limit INTEGER DEFAULT 300,
    min_duration INTEGER DEFAULT 30,
    max_duration INTEGER DEFAULT 600,
    max_attempts INTEGER DEFAULT 3,
    min_words INTEGER DEFAULT 50,
    passing_score INTEGER,
    allowed_time INTEGER,
    is_shuffled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_num_questions CHECK (num_questions > 0),
    CONSTRAINT chk_min_words CHECK (min_words > 0),
    CONSTRAINT chk_duration CHECK (min_duration <= max_duration),
    CONSTRAINT chk_time_limit CHECK (time_limit > 0),
    CONSTRAINT chk_max_attempts CHECK (max_attempts > 0)
);

CREATE TABLE IF NOT EXISTS speaking_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES speaking_tests(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    expected_duration INTEGER,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_question_number CHECK (question_number > 0),
    CONSTRAINT chk_expected_duration CHECK (expected_duration > 0)
);

CREATE TABLE IF NOT EXISTS speaking_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES speaking_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER,
    student_id VARCHAR(50) REFERENCES users(student_id),
    name VARCHAR(100),
    surname VARCHAR(100),
    nickname VARCHAR(100),
    academic_period_id INTEGER REFERENCES academic_year(id),
    question_id INTEGER REFERENCES speaking_test_questions(id),
    audio_url TEXT,
    transcript TEXT,
    word_count INTEGER,
    grammar_mistakes INTEGER DEFAULT 0,
    vocabulary_mistakes INTEGER DEFAULT 0,
    overall_score DECIMAL(5,2),
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (overall_score) STORED,
    score INTEGER,
    max_score INTEGER DEFAULT 10,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    retest_offered BOOLEAN DEFAULT false,
    retest_assignment_id INTEGER,
    best_retest_score INTEGER,
    best_retest_max_score INTEGER,
    best_retest_percentage DECIMAL(5,2),
    ai_feedback JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- RETEST SYSTEM
-- ========================================

CREATE TABLE IF NOT EXISTS retest_assignments (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL,
    test_id INTEGER NOT NULL,
    teacher_id VARCHAR(50) NOT NULL REFERENCES teachers(teacher_id),
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    passing_threshold DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    scoring_policy VARCHAR(10) NOT NULL DEFAULT 'BEST',
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

CREATE TABLE IF NOT EXISTS retest_targets (
    id SERIAL PRIMARY KEY,
    retest_assignment_id INTEGER NOT NULL REFERENCES retest_assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(10) NOT NULL REFERENCES users(student_id),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMP,
    status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_retest_status CHECK (status IN ('PENDING','IN_PROGRESS','PASSED','FAILED','EXPIRED')),
    CONSTRAINT uq_retest_target UNIQUE (retest_assignment_id, student_id)
);

-- ========================================
-- TEST ATTEMPTS
-- ========================================

CREATE TABLE IF NOT EXISTS test_attempts (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) REFERENCES users(student_id),
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    score INTEGER,
    max_score INTEGER,
    percentage DECIMAL(5,2),
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    answers JSONB,
    answers_by_id JSONB,
    question_order JSONB,
    caught_cheating BOOLEAN DEFAULT FALSE,
    visibility_change_times INTEGER DEFAULT 0,
    retest_assignment_id INTEGER,
    test_name VARCHAR(255),
    teacher_id VARCHAR(255),
    subject_id INTEGER,
    grade INTEGER,
    class INTEGER,
    number INTEGER,
    name VARCHAR(255),
    surname VARCHAR(255),
    nickname VARCHAR(255),
    academic_period_id INTEGER,
    audio_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, test_id, attempt_number),
    FOREIGN KEY (retest_assignment_id) REFERENCES retest_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (academic_period_id) REFERENCES academic_year(id) ON DELETE CASCADE
);

-- ========================================
-- TEST ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS test_analytics (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL,
    academic_period_id INTEGER REFERENCES academic_year(id),
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    highest_score INTEGER,
    lowest_score INTEGER,
    completion_rate DECIMAL(5,2),
    average_time_taken INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, academic_period_id)
);

-- ========================================
-- MATERIALIZED VIEWS
-- ========================================

-- Class Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS class_summary_view AS
WITH all_test_results AS (
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM multiple_choice_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM true_false_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM input_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM matching_type_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM word_matching_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM drawing_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM fill_blanks_test_results
    UNION ALL
    SELECT teacher_id, subject_id, grade, class, academic_period_id, test_id, test_name, student_id, score, max_score, percentage, submitted_at, caught_cheating, visibility_change_times, is_completed FROM speaking_test_results
),
semester_mapping AS (
    SELECT ay.id as academic_period_id, ay.academic_year, ay.semester, ay.start_date, ay.end_date
    FROM academic_year ay
    WHERE ay.semester = (SELECT semester FROM academic_year WHERE CURRENT_DATE BETWEEN start_date AND end_date)
),
semester_results AS (
    SELECT atr.*, sm.academic_year, sm.semester, sm.start_date as semester_start, sm.end_date as semester_end
    FROM all_test_results atr
    JOIN semester_mapping sm ON atr.academic_period_id = sm.academic_period_id
),
class_stats AS (
    SELECT 
        teacher_id, subject_id, grade, class, academic_year, semester,
        COUNT(DISTINCT student_id) as total_students,
        COUNT(DISTINCT test_id) as total_tests,
        COUNT(*) as completed_tests,
        ROUND(AVG(percentage), 2) as average_class_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score,
        ROUND((COUNT(CASE WHEN percentage >= 60 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2) as pass_rate,
        COUNT(CASE WHEN caught_cheating = true THEN 1 END) as cheating_incidents,
        COUNT(CASE WHEN visibility_change_times > 5 THEN 1 END) as high_visibility_change_students,
        MAX(submitted_at) as last_test_date,
        CURRENT_TIMESTAMP as last_updated
    FROM semester_results
    GROUP BY teacher_id, subject_id, grade, class, academic_year, semester
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY teacher_id, subject_id, grade, class, academic_year, semester) as id,
    teacher_id, subject_id, grade, class, academic_year, semester,
    total_students, total_tests, completed_tests, average_class_score, highest_score, lowest_score,
    pass_rate, cheating_incidents, high_visibility_change_students, last_test_date, last_updated,
    CURRENT_TIMESTAMP as created_at, CURRENT_TIMESTAMP as updated_at
FROM class_stats;

-- Test Performance View
CREATE OR REPLACE VIEW test_performance_by_test AS
WITH all_test_results AS (
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM multiple_choice_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM true_false_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM input_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM matching_type_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM word_matching_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM drawing_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM fill_blanks_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id, grade, class FROM speaking_test_results WHERE is_completed = true
)
SELECT 
    teacher_id, test_id, test_name, AVG(percentage) as average_score, COUNT(*) as total_students,
    submitted_at, academic_period_id, grade, class
FROM all_test_results
GROUP BY teacher_id, test_id, test_name, submitted_at, academic_period_id, grade, class
ORDER BY submitted_at ASC;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_grade_class ON users(grade, class);

-- Test assignment indexes
CREATE INDEX IF NOT EXISTS idx_test_assignments_teacher_id ON test_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_academic_period ON test_assignments(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_grade_class ON test_assignments(grade, class);
CREATE INDEX IF NOT EXISTS idx_test_assignments_subject_id ON test_assignments(subject_id);

-- Multiple choice indexes
CREATE INDEX IF NOT EXISTS idx_mc_tests_teacher_id ON multiple_choice_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_mc_tests_subject_id ON multiple_choice_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mc_questions_test_id ON multiple_choice_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_student_id ON multiple_choice_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_academic_period ON multiple_choice_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_id ON multiple_choice_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_subject_id ON multiple_choice_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_test_id ON multiple_choice_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_completed_cheating ON multiple_choice_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class_period ON multiple_choice_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_period ON multiple_choice_test_results(teacher_id, academic_period_id, submitted_at);

-- True/False indexes
CREATE INDEX IF NOT EXISTS idx_tf_tests_teacher_id ON true_false_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tf_tests_subject_id ON true_false_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_tf_questions_test_id ON true_false_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_student_id ON true_false_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_academic_period ON true_false_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_id ON true_false_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_subject_id ON true_false_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_test_id ON true_false_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_completed_cheating ON true_false_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class_period ON true_false_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_period ON true_false_test_results(teacher_id, academic_period_id, submitted_at);

-- Input test indexes
CREATE INDEX IF NOT EXISTS idx_input_tests_teacher_id ON input_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_input_tests_subject_id ON input_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_input_questions_test_id ON input_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_input_results_student_id ON input_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_input_results_academic_period ON input_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_id ON input_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_input_results_subject_id ON input_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_input_results_test_id ON input_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_input_results_completed_cheating ON input_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class_period ON input_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_period ON input_test_results(teacher_id, academic_period_id, submitted_at);

-- Matching type indexes
CREATE INDEX IF NOT EXISTS idx_matching_tests_teacher_id ON matching_type_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_matching_tests_subject_id ON matching_type_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_matching_questions_test_id ON matching_type_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_matching_arrows_question_id ON matching_type_test_arrows(question_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_student_id ON matching_type_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_academic_period ON matching_type_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_id ON matching_type_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_subject_id ON matching_type_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_test_id ON matching_type_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_completed_cheating ON matching_type_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class_period ON matching_type_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_period ON matching_type_test_results(teacher_id, academic_period_id, submitted_at);

-- Word matching indexes
CREATE INDEX IF NOT EXISTS idx_word_matching_tests_teacher ON word_matching_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_tests_subject ON word_matching_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_questions_test ON word_matching_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_questions_teacher ON word_matching_questions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_test ON word_matching_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_student ON word_matching_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_class ON word_matching_test_results(grade, class);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_period ON word_matching_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_id ON word_matching_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_subject_id ON word_matching_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_test_id ON word_matching_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_completed_cheating ON word_matching_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class_period ON word_matching_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_period ON word_matching_test_results(teacher_id, academic_period_id, submitted_at);

-- Drawing test indexes
CREATE INDEX IF NOT EXISTS idx_drawing_tests_teacher_id ON drawing_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_drawing_tests_subject_id ON drawing_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_drawing_test_questions_test_id ON drawing_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_drawing_test_results_test_id ON drawing_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_drawing_test_results_student_id ON drawing_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_drawing_test_results_teacher_id ON drawing_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_drawing_test_images_result_id ON drawing_test_images(result_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_subject_id ON drawing_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_test_id ON drawing_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_completed_cheating ON drawing_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class_period ON drawing_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_period ON drawing_test_results(teacher_id, academic_period_id, submitted_at);

-- Fill blanks indexes
CREATE INDEX IF NOT EXISTS idx_fill_blanks_tests_teacher_id ON fill_blanks_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_tests_subject_id ON fill_blanks_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_tests_created_at ON fill_blanks_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_questions_test_id ON fill_blanks_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_questions_question_id ON fill_blanks_test_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_test_id ON fill_blanks_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_student_id ON fill_blanks_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_id ON fill_blanks_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_grade ON fill_blanks_test_results(grade);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_class ON fill_blanks_test_results(class);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_academic_period_id ON fill_blanks_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_score ON fill_blanks_test_results(score);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_completed_cheating ON fill_blanks_test_results(caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_grade_class_period ON fill_blanks_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_period ON fill_blanks_test_results(teacher_id, academic_period_id, submitted_at);

-- Speaking test indexes
CREATE INDEX IF NOT EXISTS idx_speaking_tests_teacher_id ON speaking_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_speaking_tests_subject_id ON speaking_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_speaking_tests_created_at ON speaking_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_speaking_questions_test_id ON speaking_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_speaking_questions_number ON speaking_test_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_speaking_results_test_id ON speaking_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_student_id ON speaking_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_id ON speaking_test_results(teacher_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_grade ON speaking_test_results(grade);
CREATE INDEX IF NOT EXISTS idx_speaking_results_class ON speaking_test_results(class);
CREATE INDEX IF NOT EXISTS idx_speaking_results_academic_period_id ON speaking_test_results(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_submitted_at ON speaking_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_score ON speaking_test_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_speaking_results_completed_cheating ON speaking_test_results(is_completed, caught_cheating, visibility_change_times);
CREATE INDEX IF NOT EXISTS idx_speaking_results_question_id ON speaking_test_results(question_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_retest_assignment_id ON speaking_test_results(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_ai_feedback ON speaking_test_results USING GIN (ai_feedback);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_grade_class_period ON speaking_test_results(teacher_id, grade, class, academic_period_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_period ON speaking_test_results(teacher_id, academic_period_id, submitted_at);

-- Retest system indexes
CREATE INDEX IF NOT EXISTS idx_retest_assignments_teacher ON retest_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_subject ON retest_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_test ON retest_assignments(test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_start ON retest_assignments(window_start);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_end ON retest_assignments(window_end);
CREATE INDEX IF NOT EXISTS idx_retest_assignments_window_range ON retest_assignments(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_retest_targets_assignment ON retest_targets(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_student ON retest_targets(student_id);
CREATE INDEX IF NOT EXISTS idx_retest_targets_status ON retest_targets(status);

-- Test attempts indexes
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_test ON test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_retest_assignment ON test_attempts(retest_assignment_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_subject ON test_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_academic_period ON test_attempts(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_teacher ON test_attempts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_grade_class ON test_attempts(grade, class);
CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer ON test_attempts (student_id, test_id, percentage DESC, attempt_number DESC) INCLUDE (score, max_score, submitted_at) WHERE retest_assignment_id IS NOT NULL;

-- Test analytics indexes
CREATE INDEX IF NOT EXISTS idx_test_analytics_test_period ON test_analytics(test_id, academic_period_id);

-- Materialized view indexes
CREATE INDEX IF NOT EXISTS idx_class_summary_teacher ON class_summary_view(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_subject ON class_summary_view(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_class ON class_summary_view(grade, class);
CREATE INDEX IF NOT EXISTS idx_class_summary_semester ON class_summary_view(academic_year, semester);

-- Teacher subjects indexes
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_unique_lookup ON teacher_subjects (teacher_id, subject_id, grade, class);

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to set retest offered flag across all result tables
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
  UPDATE speaking_test_results         SET retest_offered = p_flag WHERE student_id = p_student_id AND test_id = p_test_id;
END;
$$;

-- Function to update best retest values
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

  IF v_score IS NOT NULL THEN
    UPDATE multiple_choice_test_results  SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE true_false_test_results       SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE input_test_results            SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE matching_type_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE word_matching_test_results    SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE drawing_test_results          SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE fill_blanks_test_results      SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
    UPDATE speaking_test_results         SET best_retest_score = v_score, best_retest_max_score = v_max, best_retest_percentage = v_pct WHERE student_id = p_student_id AND test_id = p_test_id;
  END IF;
END;
$$;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample academic years
INSERT INTO academic_year (academic_year, semester, term, start_date, end_date) VALUES
('2025-2026', 1, 1, '2025-05-01', '2025-07-15'),
('2025-2026', 1, 2, '2025-07-16', '2025-09-30'),
('2025-2026', 2, 1, '2025-10-01', '2026-01-10'),
('2025-2026', 2, 2, '2026-01-11', '2026-04-30'),
('2026-2027', 1, 1, '2026-05-01', '2026-07-15'),
('2026-2027', 1, 2, '2026-07-16', '2026-09-12'),
('2026-2027', 2, 1, '2026-10-01', '2027-01-10'),
('2026-2027', 2, 2, '2027-01-11', '2027-04-30');

-- Insert sample teachers
INSERT INTO teachers (teacher_id, username, password) VALUES
('Aleksandr_Petrov', 'Alex', '465'),
('Charlie_Viernes', 'Charlie', '465');

-- Insert sample admin
INSERT INTO admin (username, password) VALUES
('admin', 'maxpower');

-- Insert sample subjects
INSERT INTO subjects (subject) VALUES
('Listening and Speaking'),
('English for career'),
('Tourism'),
('Reading and Writing'),
('Geography'),
('Grammar'),
('English for Communication'),
('Health'),
('Science Fundamental'),
('Science Supplementary'),
('Biology'),
('Math Fundamental'),
('Math Supplementary');

-- ========================================
-- REFRESH MATERIALIZED VIEWS
-- ========================================

REFRESH MATERIALIZED VIEW class_summary_view;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
    'Database schema migration completed successfully' as status,
    'All tables, indexes, functions, and views created' as message,
    'Ready for production deployment' as deployment_status;
