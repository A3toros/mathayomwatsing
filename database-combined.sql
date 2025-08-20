-- Combined from: setup-database.sql, database-update.sql, database-schema.sql, database-schema-separate-tables.sql, database-schema-multiple-classes.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    number INTEGER NOT NULL,
    submitted BOOLEAN DEFAULT FALSE,
    answers JSONB,
    score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SELECT username, nickname, number, submitted FROM users ORDER BY number;

ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

UPDATE users SET 
    title = 'Mr.',
    first_name = 'Eakkanin',
    last_name = 'Sithchaisurakool',
    class_name = '6/14'
WHERE username = 'Munich';

UPDATE users SET 
    title = 'Mr.',
    first_name = 'Chayodom',
    last_name = 'Disayawan',
    class_name = '6/14'
WHERE username = 'Bright';



UPDATE users SET 
    first_name = 'Thepteeramungkorn',
    last_name = 'Boomthantiraput',
    student_id = '51881'
WHERE username = 'thepteeramungkorn' OR nickname = 'Loma';

SELECT class_name, COUNT(*) as student_count FROM users GROUP BY class_name ORDER BY class_name;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    grade_level INTEGER NOT NULL,
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS terms (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    term_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    test_type ENUM('online', 'offline') DEFAULT 'online',
    test_url VARCHAR(500),
    max_score INTEGER DEFAULT 10,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id)
);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER,
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, test_id)
);

INSERT INTO semesters (name, academic_year, start_date, end_date, is_active) VALUES
('1st Semester', '2024-2025', '2024-09-01', '2025-01-31', TRUE),
('2nd Semester', '2024-2025', '2025-02-01', '2025-06-30', FALSE);

INSERT INTO terms (semester_id, name, term_number, start_date, end_date, is_active) VALUES
(1, 'Term 1', 1, '2024-09-01', '2024-11-30', TRUE),
(1, 'Term 2', 2, '2024-12-01', '2025-01-31', FALSE),
(2, 'Term 1', 1, '2025-02-01', '2025-04-30', FALSE),
(2, 'Term 2', 2, '2025-05-01', '2025-06-30', FALSE);

INSERT INTO tests (name, description, term_id, test_type, test_url, max_score, duration_minutes, start_date, end_date) VALUES
('Vocabulary Test M6', 'Vocabulary test for 6th grade students', 1, 'online', '/vocabulary-test-m6', 10, 60, '2024-10-15 09:00:00', '2024-10-15 17:00:00'),
('Grammar Test', 'Basic grammar concepts', 1, 'online', '/grammar-test', 15, 45, '2024-11-01 09:00:00', '2024-11-01 17:00:00'),
('Reading Comprehension', 'Reading and understanding text', 1, 'offline', NULL, 20, 90, '2024-11-15 09:00:00', '2024-11-15 17:00:00'),
('Writing Assignment', 'Essay writing test', 2, 'offline', NULL, 25, 120, '2024-12-15 09:00:00', '2024-12-15 17:00:00'),
('Final Exam', 'Comprehensive semester exam', 2, 'online', '/final-exam', 50, 180, '2025-01-20 09:00:00', '2025-01-20 17:00:00');



INSERT INTO test_assignments (user_id, test_id)
SELECT u.id, t.id FROM users u CROSS JOIN tests t;

INSERT INTO test_results (user_id, test_id, score, completed) VALUES
(1, 3, 18, TRUE),
(2, 3, 16, TRUE),
(3, 3, 19, TRUE),
(1, 4, 22, TRUE),
(2, 4, 20, TRUE);

SELECT class_name, COUNT(*) as student_count FROM users GROUP BY class_name ORDER BY class_name;

CREATE TABLE IF NOT EXISTS grade_1 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_2 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_3 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_4 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_5 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_6 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS terms (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    term_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    test_type ENUM('online', 'offline') DEFAULT 'online',
    test_url VARCHAR(500),
    max_score INTEGER DEFAULT 10,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    grade_level INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id, grade_level)
);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL,
    score INTEGER,
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, test_id, grade_level)
);

INSERT INTO semesters (name, academic_year, start_date, end_date, is_active) VALUES
('1st Semester', '2024-2025', '2024-09-01', '2025-01-31', TRUE),
('2nd Semester', '2024-2025', '2025-02-01', '2025-06-30', FALSE);

INSERT INTO terms (semester_id, name, term_number, start_date, end_date, is_active) VALUES
(1, 'Term 1', 1, '2024-09-01', '2024-11-30', TRUE),
(1, 'Term 2', 2, '2024-12-01', '2025-01-31', FALSE),
(2, 'Term 1', 1, '2025-02-01', '2025-04-30', FALSE),
(2, 'Term 2', 2, '2025-05-01', '2025-06-30', FALSE);

INSERT INTO tests (name, description, term_id, test_type, test_url, max_score, duration_minutes, start_date, end_date, grade_level) VALUES
('Listening Test M1', 'Listening comprehension test for 1st grade students', 1, 'online', '/listening_test_m1', 15, 45, '2024-10-15 09:00:00', '2024-10-15 17:00:00', 1),
('Vocabulary Test M2', 'Vocabulary test for 2nd grade students', 1, 'online', '/vocabulary_test_m2', 10, 30, '2024-10-20 09:00:00', '2024-10-20 17:00:00', 2),
('Listening Test M2', 'Listening comprehension test for 2nd grade students', 1, 'online', '/listening_test_m2', 15, 45, '2024-10-25 09:00:00', '2024-10-25 17:00:00', 2),
('Vocabulary Test M3', 'Vocabulary test for 3rd grade students', 1, 'online', '/vocabulary_test_m3', 10, 30, '2024-10-30 09:00:00', '2024-10-30 17:00:00', 3),
('Listening Test M3', 'Listening comprehension test for 3rd grade students', 1, 'online', '/listening_test_m3', 15, 45, '2024-11-05 09:00:00', '2024-11-05 17:00:00', 3),
('Vocabulary Test M4', 'Vocabulary test for 4th grade students', 1, 'online', '/vocabulary_test_m4', 10, 30, '2024-11-10 09:00:00', '2024-11-10 17:00:00', 4),
('Vocabulary Test M5', 'Vocabulary test for 5th grade students', 1, 'online', '/vocabulary_test_m5', 10, 30, '2024-11-15 09:00:00', '2024-11-15 17:00:00', 5),
('Vocabulary Test M6', 'Vocabulary test for 6th grade students', 1, 'online', '/vocabulary_test_m6', 10, 30, '2024-10-15 09:00:00', '2024-10-15 17:00:00', 6),
('Grammar Test', 'Basic grammar concepts', 1, 'online', '/grammar-test', 15, 45, '2024-11-01 09:00:00', '2024-11-01 17:00:00', 6),
('Reading Comprehension', 'Reading and understanding text', 1, 'offline', NULL, 20, 90, '2024-11-15 09:00:00', '2024-11-15 17:00:00', 6),
('Writing Assignment', 'Essay writing test', 2, 'offline', NULL, 25, 120, '2024-12-15 09:00:00', '2024-12-15 17:00:00', 6),
('Final Exam', 'Comprehensive semester exam', 2, 'online', '/final-exam', 50, 180, '2025-01-20 09:00:00', '2025-01-20 17:00:00', 6);

INSERT INTO grade_6 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Munich', '48457', 'Munich', '48457', 'Mr.', 'Eakkanin', 'Sithchaisurakool', '6/14'),
('Bright', '48458', 'Bright', '48458', 'Mr.', 'Chayodom', 'Disayawan', '6/14'),
('Don', '48461', 'Don', '48461', 'Mr.', 'Don', 'Don', '6/14'),
('Dollar', '48483', 'Dollar', '48483', 'Mr.', 'Dollar', 'Dollar', '6/14'),
('Tonmai', '50438', 'Tonmai', '50438', 'Mr.', 'Tonmai', 'Tonmai', '6/14'),
('Pupha', '50439', 'Pupha', '50439', 'Mr.', 'Pupha', 'Pupha', '6/14'),
('Oil', '48489', 'Oil', '48489', 'Mr.', 'Oil', 'Oil', '6/14'),
('Gift', '48490', 'Gift', '48490', 'Mr.', 'Gift', 'Gift', '6/14'),
('Ink', '48491', 'Ink', '48491', 'Mr.', 'Ink', 'Ink', '6/14'),
('Tongkaw', '48496', 'Tongkaw', '48496', 'Mr.', 'Tongkaw', 'Tongkaw', '6/14'),
('Bam', '48498', 'Bam', '48498', 'Mr.', 'Bam', 'Bam', '6/14'),
('Praew', '48500', 'Praew', '48500', 'Mr.', 'Praew', 'Praew', '6/14'),
('Noodee', '48501', 'Noodee', '48501', 'Mr.', 'Noodee', 'Noodee', '6/14'),
('Sayo', '50323', 'Sayo', '50323', 'Mr.', 'Sayo', 'Sayo', '6/14'),
('New', '50440', 'New', '50440', 'Mr.', 'New', 'New', '6/14'),
('Ing', '50442', 'Ing', '50442', 'Mr.', 'Ing', 'Ing', '6/14');

INSERT INTO grade_1 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Student 1', 'M1_001', 'Student 1', 'M1_001', 'Mr.', 'First', 'Student', '1/15'),
('Student 2', 'M1_002', 'Student 2', 'M1_002', 'Miss', 'Second', 'Student', '1/15');

INSERT INTO grade_2 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('student_m2_1', 'M2_001', 'Student 1', 'M2_001', 'Mr.', 'First', 'Student', '2/15'),
('student_m2_2', 'M2_002', 'Student 2', 'M2_002', 'Miss', 'Second', 'Student', '2/15');

INSERT INTO grade_3 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('student_m3_1', 'M3_001', 'Student 1', 'M3_001', 'Mr.', 'First', 'Student', '3/15'),
('student_m3_2', 'M3_002', 'Student 2', 'M3_002', 'Miss', 'Second', 'Student', '3/15');

INSERT INTO grade_4 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('student_m4_1', 'M4_001', 'Student 1', 'M4_001', 'Mr.', 'First', 'Student', '4/14'),
('student_m4_2', 'M4_002', 'Student 2', 'M4_002', 'Miss', 'Second', 'Student', '4/14');

INSERT INTO grade_5 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('student_m5_1', 'M5_001', 'Student 1', 'M5_001', 'Mr.', 'First', 'Student', '5/14'),
('student_m5_2', 'M5_002', 'Student 2', 'M5_002', 'Miss', 'Second', 'Student', '5/14');

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 1 FROM grade_1 g CROSS JOIN tests t WHERE t.grade_level = 1;

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 2 FROM grade_2 g CROSS JOIN tests t WHERE t.grade_level = 2;

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 3 FROM grade_3 g CROSS JOIN tests t WHERE t.grade_level = 3;

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 4 FROM grade_4 g CROSS JOIN tests t WHERE t.grade_level = 4;

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 5 FROM grade_5 g CROSS JOIN tests t WHERE t.grade_level = 5;

INSERT INTO test_assignments (user_id, test_id, grade_level)
SELECT g.id, t.id, 6 FROM grade_6 g CROSS JOIN tests t WHERE t.grade_level = 6;

INSERT INTO test_results (user_id, test_id, grade_level, score, completed) VALUES
(1, 8, 6, 18, TRUE),
(2, 8, 6, 16, TRUE),
(3, 8, 6, 19, TRUE),
(1, 9, 6, 22, TRUE),
(2, 9, 6, 20, TRUE);

SELECT 'Grade 1 (M1)' as grade, COUNT(*) as student_count FROM grade_1
UNION ALL
SELECT 'Grade 2 (M2)' as grade, COUNT(*) as student_count FROM grade_2
UNION ALL
SELECT 'Grade 3 (M3)' as grade, COUNT(*) as student_count FROM grade_3
UNION ALL
SELECT 'Grade 4 (M4)' as grade, COUNT(*) as student_count FROM grade_4
UNION ALL
SELECT 'Grade 5 (M5)' as grade, COUNT(*) as student_count FROM grade_5
UNION ALL
SELECT 'Grade 6 (M6)' as grade, COUNT(*) as student_count FROM grade_6
ORDER BY grade;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(10),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    grade_level INTEGER NOT NULL,
    class_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS terms (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    term_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
    test_type ENUM('online', 'offline') DEFAULT 'online',
    test_url VARCHAR(500),
    max_score INTEGER DEFAULT 10,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id)
);

CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    score INTEGER,
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, test_id)
);

INSERT INTO semesters (name, academic_year, start_date, end_date, is_active) VALUES
('1st Semester', '2024-2025', '2024-09-01', '2025-01-31', TRUE),
('2nd Semester', '2024-2025', '2025-02-01', '2025-06-30', FALSE);

INSERT INTO terms (semester_id, name, term_number, start_date, end_date, is_active) VALUES
(1, 'Term 1', 1, '2024-09-01', '2024-11-30', TRUE),
(1, 'Term 2', 2, '2024-12-01', '2025-01-31', FALSE),
(2, 'Term 1', 1, '2025-02-01', '2025-04-30', FALSE),
(2, 'Term 2', 2, '2025-05-01', '2025-06-30', FALSE);

INSERT INTO tests (name, description, term_id, test_type, test_url, max_score, duration_minutes, start_date, end_date) VALUES
('Vocabulary Test M6', 'Vocabulary test for 6th grade students', 1, 'online', '/vocabulary-test-m6', 10, 60, '2024-10-15 09:00:00', '2024-10-15 17:00:00'),
('Grammar Test', 'Basic grammar concepts', 1, 'online', '/grammar-test', 15, 45, '2024-11-01 09:00:00', '2024-11-01 17:00:00'),
('Reading Comprehension', 'Reading and understanding text', 1, 'offline', NULL, 20, 90, '2024-11-15 09:00:00', '2024-11-15 17:00:00'),
('Writing Assignment', 'Essay writing test', 2, 'offline', NULL, 25, 120, '2024-12-15 09:00:00', '2024-12-15 17:00:00'),
('Final Exam', 'Comprehensive semester exam', 2, 'online', '/final-exam', 50, 180, '2025-01-20 09:00:00', '2025-01-20 17:00:00');

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name) VALUES
('Tong Tong', '51706', 'Tong Tong', '51706', 'Mr.', 'Kittikhun', 'Siriwadtanakojaroen', 6, '1/15'),
('Idea', '51707', 'Idea', '51707', 'Mr.', 'Jittiphat', 'Suksamai', 6, '1/15'),
('Tun', '51708', 'Tun', '51708', 'Mr.', 'Jiraphon', 'Sawanakasem', 6, '1/15'),
('Pupha', '51709', 'Pupha', '51709', 'Mr.', 'Nattawat', 'Prakobpanich', 6, '1/15'),
('Sprite', '51710', 'Sprite', '51710', 'Mr.', 'Thanawat', 'Pungsati', 6, '1/15'),
('Sea', '51711', 'Sea', '51711', 'Mr.', 'Bawonchai', 'Udomkhongmangmee', 6, '1/15'),
('Chirew', '51712', 'Chirew', '51712', 'Mr.', 'Pichaya', 'Chansate', 6, '1/15'),
('Rose', '51713', 'Rose', '51713', 'Miss', 'Kamonchat', 'Amornphongmongkol', 6, '1/15'),
('Tonhom', '51714', 'Tonhom', '51714', 'Miss', 'Chanyanuch', 'Houyhuan', 6, '1/15'),
('Bruda', '51715', 'Bruda', '51715', 'Miss', 'Napat', 'Mongkolwatcharoen', 6, '1/15'),
('Luck', '51716', 'Luck', '51716', 'Miss', 'Thanyaluk', 'Ueasiyaphan', 6, '1/15'),
('Jewelry', '51717', 'Jewelry', '51717', 'Miss', 'Nicha', 'Jailak', 6, '1/15'),
('Nee', '51718', 'Nee', '51718', 'Miss', 'Neeraphan', 'Tangpaopong', 6, '1/15'),
('Khaning', '51719', 'Khaning', '51719', 'Miss', 'Phonnapphan', 'Settheepokha', 6, '1/15'),
('Éclair', '51720', 'Éclair', '51720', 'Miss', 'Patsorn', 'Jenkatkan', 6, '1/15'),
('Baifern', '51721', 'Baifern', '51721', 'Miss', 'Ploypaphat', 'Kittiwittayarom', 6, '1/15'),
('Tus', '51722', 'Tus', '51722', 'Miss', 'Wanvisa', 'Ratsamichai', 6, '1/15'),
('Winnie', '51723', 'Winnie', '51723', 'Miss', 'Wipaporn', 'Muangsane', 6, '1/15'),
('Mei', '51724', 'Mei', '51724', 'Miss', 'Sasiwannaporn', 'Likitbannasak', 6, '1/15'),
('Thien', '51725', 'Thien', '51725', 'Miss', 'Sarisa', 'Bhoosudsawaeng', 6, '1/15'),
('Meili', '51726', 'Meili', '51726', 'Miss', 'Akanit', 'Kampimabouth', 6, '1/15'),
('Khaohom', '51727', 'Khaohom', '51727', 'Miss', 'Uracha', 'Maolee', 6, '1/15'),
('Pangko', '51728', 'Pangko', '51728', 'Miss', 'Aticia', 'Kesornsung', 6, '1/15'),
('Pukan', '51729', 'Pukan', '51729', 'Mr.', 'Kamonlaphop', 'Prasertchroenphol', 6, '1/16'),
('Yoshi', '51730', 'Yoshi', '51730', 'Mr.', 'Jumpon', 'Onlamul', 6, '1/16'),
('Title', '51731', 'Title', '51731', 'Mr.', 'Chinnapat', 'Prabthong', 6, '1/16'),
('Khaopun', '51732', 'Khaopun', '51732', 'Mr.', 'Naphat', 'Yuadyan', 6, '1/16'),
('Austin', '51733', 'Austin', '51733', 'Mr.', 'Thanadol', 'Rakchanachai', 6, '1/16'),
('Inkyu', '51734', 'Inkyu', '51734', 'Mr.', 'Thanatbodee', 'Hongwiset', 6, '1/16'),
('CC', '51735', 'CC', '51735', 'Mr.', 'Thitiwat', 'Srisaard', 6, '1/16'),
('Nene', '51736', 'Nene', '51736', 'Mr.', 'Noppakrun', 'Kruaisawat', 6, '1/16'),
('Cino', '51737', 'Cino', '51737', 'Mr.', 'Nawin', 'Pongputtipak', 6, '1/16'),
('August', '51738', 'August', '51738', 'Mr.', 'Woradej', 'Boonto', 6, '1/16'),
('Ongsa', '51739', 'Ongsa', '51739', 'Mr.', 'Ongsa', 'Assanee', 6, '1/16'),
('Kaimook', '51740', 'Kaimook', '51740', 'Miss', 'Chanyanas', 'Surawuthinak', 6, '1/16'),
('Elfie', '51741', 'Elfie', '51741', 'Miss', 'Napattika', 'Imyaem', 6, '1/16'),
('Senior', '51742', 'Senior', '51742', 'Miss', 'Natthanun', 'Kunkhomit', 6, '1/16'),
('Anda', '51743', 'Anda', '51743', 'Miss', 'Thepteeramumin', 'Boontarmteeraputi', 6, '1/16'),
('Smile', '51744', 'Smile', '51744', 'Miss', 'Piyakarn', 'Kittisiriphan', 6, '1/16'),
('Ploy', '51745', 'Ploy', '51745', 'Miss', 'Pobporn', 'Intarasorn', 6, '1/16'),
('Kwan Khao', '51747', 'Kwan Khao', '51747', 'Miss', 'Pitthayapat', 'Srithanakitwetin', 6, '1/16'),
('Dream', '51748', 'Dream', '51748', 'Miss', 'Piriyapond', 'Kittimaensuriya', 6, '1/16'),
('Pream', '51750', 'Pream', '51750', 'Miss', 'Atiporn', 'Promduang', 6, '1/16'),
('Captain', '51007', 'Captain', '51007', 'Mr.', 'Kittikhun', 'Rungsuk', 6, '2/15'),
('Cartoon', '51008', 'Cartoon', '51008', 'Mr.', 'Kongpop', 'Samanah', 6, '2/15'),
('Boss', '51009', 'Boss', '51009', 'Mr.', 'Natin', 'Ngaeprom', 6, '2/15'),
('Dej', '51010', 'Dej', '51010', 'Mr.', 'Thammadej', 'Dejharn', 6, '2/15'),
('Zen', '51011', 'Zen', '51011', 'Mr.', 'Bhumipat', 'Tiranasawad', 6, '2/15'),
('Harit', '51012', 'Harit', '51012', 'Mr.', 'Yotprasu', 'Yongprayoon', 6, '2/15'),
('Winson', '51013', 'Winson', '51013', 'Mr.', 'Winson', 'Chakhong', 6, '2/15'),
('First', '51014', 'First', '51014', 'Mr.', 'Piriyakorn', 'Soontornkumphonrat', 6, '2/15'),
('Auto', '51015', 'Auto', '51015', 'Mr.', 'Surathat', 'Fongnaree', 6, '2/15'),
('Tonplam', '51016', 'Tonplam', '51016', 'Mr.', 'Thanadej', 'Pichairat', 6, '2/15'),
('Bright', '51017', 'Bright', '51017', 'Mr.', 'Nattawat', 'Boonpitsit', 6, '2/15'),
('Loma', '51881', 'Loma', '51881', 'Mr.', 'Thepteeramungkorn', 'Boomthantiraput', 6, '2/15'),
('Bua', '51018', 'Bua', '51018', 'Miss', 'Kanyanat', 'Saksakunkailerd', 6, '2/15'),
('Nana', '51019', 'Nana', '51019', 'Miss', 'Kakanang', 'Boonlua', 6, '2/15'),
('Maprang', '51020', 'Maprang', '51020', 'Miss', 'Nattanicha', 'Ruento', 6, '2/15'),
('North', '51021', 'North', '51021', 'Miss', 'Danaya', 'Saiwanna', 6, '2/15'),
('Seiya', '51022', 'Seiya', '51022', 'Miss', 'Thannatsaorn', 'Anthipkul', 6, '2/15'),
('E''clair', '51023', 'E''clair', '51023', 'Miss', 'Thanuchmon', 'Suwiratwitayakit', 6, '2/15'),
('tete', '51024', 'tete', '51024', 'Miss', 'Thunchanok', 'Klongratsakul', 6, '2/15'),
('cream', '51025', 'cream', '51025', 'Miss', 'Pinyaphat', 'Supboontanakorn', 6, '2/15'),
('Nobell', '51026', 'Nobell', '51026', 'Miss', 'Waran', 'Kanwan', 6, '2/15'),
('Viva', '51027', 'Viva', '51027', 'Miss', 'Sukaksorn', 'Kanjanakunti', 6, '2/15'),
('Khaohom', '51028', 'Khaohom', '51028', 'Miss', 'Supitchaya', 'Sukjit', 6, '2/15'),
('Nam', '51029', 'Nam', '51029', 'Miss', 'Siriyapon', 'Ramunu', 6, '2/15'),
('Waenpetch', '51030', 'Waenpetch', '51030', 'Miss', 'Hathaytip', 'Sawangruttaya', 6, '2/15'),
('Chirew', '51032', 'Chirew', '51032', 'Mr.', 'Konakk', 'Rojanasupakul', 6, '2/16'),
('Kishna', '51033', 'Kishna', '51033', 'Mr.', 'Kishna', 'Joshi', 6, '2/16'),
('Justin', '51034', 'Justin', '51034', 'Mr.', 'Justin', 'Damayanti Luxameesathporn', 6, '2/16'),
('Pun', '51035', 'Pun', '51035', 'Mr.', 'Jiraphat', 'Chamnoi', 6, '2/16'),
('Pat', '51036', 'Pat', '51036', 'Mr.', 'Jirayu', 'Thanawiphakon', 6, '2/16'),
('Din', '51037', 'Din', '51037', 'Mr.', 'Chanthawat', 'Bowonaphiwong', 6, '2/16'),
('Shiryu', '51038', 'Shiryu', '51038', 'Mr.', 'Napat', 'Uthaisang', 6, '2/16'),
('Singto', '51039', 'Singto', '51039', 'Mr.', 'Thianrawit', 'Ammaranon', 6, '2/16'),
('Prince', '51040', 'Prince', '51040', 'Mr.', 'Narawut', 'Meechaiudomdech', 6, '2/16'),
('Titan', '51041', 'Titan', '51041', 'Mr.', 'Papangkorn', 'Teeratanatanyaboon', 6, '2/16'),
('Tim', '51042', 'Tim', '51042', 'Mr.', 'Poptam', 'Sathongkham', 6, '2/16'),
('Mark', '51043', 'Mark', '51043', 'Mr.', 'Marwin', 'Phandumrongkul', 6, '2/16'),
('Namo', '51044', 'Namo', '51044', 'Mr.', 'Suwijak', 'kijrungsophun', 6, '2/16'),
('Fifa', '51045', 'Fifa', '51045', 'Miss', 'Chonlada', 'Bonthong', 6, '2/16'),
('Chertam', '51046', 'Chertam', '51046', 'Miss', 'Nathathai', 'Sapparia', 6, '2/16'),
('Pam Pam', '51047', 'Pam Pam', '51047', 'Miss', 'Nopchanok', 'Reenavong', 6, '2/16'),
('Namcha', '51048', 'Namcha', '51048', 'Miss', 'Parita', 'Taetee', 6, '2/16'),
('Pare', '51049', 'Pare', '51049', 'Miss', 'Pimpreeya', 'Paensuwam', 6, '2/16'),
('Focus', '51050', 'Focus', '51050', 'Miss', 'Wirunchana', 'Daungwijit', 6, '2/16'),
('Jang Jang', '51051', 'Jang Jang', '51051', 'Miss', 'Supisala', 'Chesadatas', 6, '2/16'),
('MiMi', '51052', 'MiMi', '51052', 'Miss', 'Aaraya', 'Loamorrwach', 6, '2/16'),
('Mee Mee', '51053', 'Mee Mee', '51053', 'Miss', 'Ariyan', '', 6, '2/16'),
('Boeing', '51152', 'Boeing', '51152', 'Miss', 'Ploypaphat', 'Aphichatprasert', 6, '2/16'),
('Yang Yang', '51153', 'Yang Yang', '51153', 'Miss', 'Yang Yang', '', 6, '2/16'),
('Michael', '50311', 'Michael', '50311', 'Mr.', 'Fan', 'Shucheng', 6, '3/15'),
('Koh', '50312', 'Koh', '50312', 'Mr.', 'Koh', 'Shirato', 6, '3/15'),
('Plangton', '50313', 'Plangton', '50313', 'Mr.', 'Chalanthorn', 'Somabootr', 6, '3/15'),
('Han', '50314', 'Han', '50314', 'Mr.', 'Napat', 'Phomvongtip', 6, '3/15'),
('August', '50315', 'August', '50315', 'Mr.', 'Natthanon', 'Aungkanaworakul', 6, '3/15'),
('Sorn', '50316', 'Sorn', '50316', 'Mr.', 'Thanatsorn', 'Wasuntranijwipa', 6, '3/15'),
('Oscar', '50317', 'Oscar', '50317', 'Mr.', 'Thannathorn', 'Keaw-on', 6, '3/15'),
('Peach', '50318', 'Peach', '50318', 'Mr.', 'Teeraphat', 'Kitsato', 6, '3/15'),
('Earth', '50319', 'Earth', '50319', 'Mr.', 'Pitpibul', 'Notayos', 6, '3/15'),
('Fiat', '50320', 'Fiat', '50320', 'Mr.', 'Woradet', 'Premphueam', 6, '3/15'),
('Foam', '50321', 'Foam', '50321', 'Mr.', 'Wiritphon', 'Niyomthai', 6, '3/15'),
('Vishnu', '50322', 'Vishnu', '50322', 'Mr.', 'Vishnu', 'Joshi Changchamrat', 6, '3/15'),
('Gus', '51054', 'Gus', '51054', 'Mr.', 'Kannawat', 'Noosap', 6, '3/15'),
('Tar', '51055', 'Tar', '51055', 'Mr.', 'Nuttakorn', 'Klongratsakul', 6, '3/15'),
('Ken', '51056', 'Ken', '51056', 'Mr.', 'Thitipat', 'Suknantasit', 6, '3/15'),
('Fah', '50324', 'Fah', '50324', 'Miss', 'Chanutchanan', 'Rachatamethachot', 6, '3/15'),
('Aum', '50325', 'Aum', '50325', 'Miss', 'Natpatsorn', 'Permruangtanapol', 6, '3/15'),
('Matoom', '50326', 'Matoom', '50326', 'Miss', 'Tangsima', 'Sateanpong', 6, '3/15'),
('Ing', '50327', 'Ing', '50327', 'Miss', 'Nirinyanut', 'Techathanwisit', 6, '3/15'),
('Bam', '50328', 'Bam', '50328', 'Miss', 'Punyanuch', 'Taninpong', 6, '3/15'),
('Pan', '50329', 'Pan', '50329', 'Miss', 'Phatnarin', 'Suppakijchanchai', 6, '3/15'),
('Sunny', '50330', 'Sunny', '50330', 'Miss', 'Wipawat', 'Muangsan', 6, '3/15'),
('Night', '50331', 'Night', '50331', 'Miss', 'Santamon', 'Sarakun', 6, '3/15'),
('Annatch', '50332', 'Annatch', '50332', 'Miss', 'Annatch', 'Sithchaisurakool', 6, '3/15'),
('Phat', '50333', 'Phat', '50333', 'Mr.', 'Zin Myint', 'Mo Lin', 6, '3/16'),
('Kun', '50334', 'Kun', '50334', 'Mr.', 'Kantapon', 'Chinudomporn', 6, '3/16'),
('Num', '50335', 'Num', '50335', 'Mr.', 'Krirkwit', 'Meeto', 6, '3/16'),
('Artid', '50336', 'Artid', '50336', 'Mr.', 'Natakorn', 'Ritthongpitak', 6, '3/16'),
('Farm', '50337', 'Farm', '50337', 'Mr.', 'Natthanon', 'Vanichsiripatr', 6, '3/16'),
('Zen', '50339', 'Zen', '50339', 'Mr.', 'Tanaphop', 'Bumrungrak', 6, '3/16'),
('Tarhai', '50340', 'Tarhai', '50340', 'Mr.', 'Teerat', 'Waratpaweetorn', 6, '3/16'),
('Skibidi', '50341', 'Skibidi', '50341', 'Mr.', 'Prart', 'Sirinarm', 6, '3/16'),
('Prom', '50342', 'Prom', '50342', 'Mr.', 'Peethong', 'Saenkhomor', 6, '3/16'),
('Poom', '50343', 'Poom', '50343', 'Mr.', 'Poom', 'Thongpaen', 6, '3/16'),
('Phumphat', '50344', 'Phumphat', '50344', 'Mr.', 'Phumphat', 'Lertwannaporn', 6, '3/16'),
('Kit', '50345', 'Kit', '50345', 'Mr.', 'Worakit', 'Krajangsri', 6, '3/16'),
('Franc', '50346', 'Franc', '50346', 'Mr.', 'Sukrit', 'Dechphol', 6, '3/16'),
('Tripple', '50347', 'Tripple', '50347', 'Miss', 'Chachalee', 'Boonchuachan', 6, '3/16'),
('Jiffy', '50348', 'Jiffy', '50348', 'Miss', 'Yanisa', 'Raweepipat', 6, '3/16'),
('Ingrak', '50349', 'Ingrak', '50349', 'Miss', 'Titapha', 'Yuthanom', 6, '3/16'),
('Aunpan', '50350', 'Aunpan', '50350', 'Miss', 'Nutchanun', 'Suwannahong', 6, '3/16'),
('Ozon', '50351', 'Ozon', '50351', 'Miss', 'Thanunchanok', 'Songrum', 6, '3/16'),
('Cake', '50352', 'Cake', '50352', 'Miss', 'Pakijra', 'Panjach', 6, '3/16'),
('Tonaor', '50353', 'Tonaor', '50353', 'Miss', 'Phinyaphat', 'Chatthanawan', 6, '3/16'),
('Hana', '50354', 'Hana', '50354', 'Miss', 'Supichaya', 'Suppasing', 6, '3/16'),
('Tack', '49767', 'Tack', '49767', 'Mr.', 'Sirasit', 'Panyasit', 6, '4/14'),
('Cfo', '51864', 'Cfo', '51864', 'Mr.', 'Peerapat', 'Suktapot', 6, '4/14'),
('Gui', '51865', 'Gui', '51865', 'Mr.', 'Wongsathorn', 'Rod-aree', 6, '4/14'),
('Tonkla', '51866', 'Tonkla', '51866', 'Mr.', 'Suwisith', 'Tempraserteudee', 6, '4/14'),
('Bebe', '49754', 'Bebe', '49754', 'Miss', 'Chutikan', 'Pornvasin', 6, '4/14'),
('Prae', '49773', 'Prae', '49773', 'Miss', 'Praewan', 'Taecha-in', 6, '4/14'),
('Tar', '51867', 'Tar', '51867', 'Miss', 'Chinapa', 'Chanumklang', 6, '4/14'),
('Ching Sin', '51868', 'Ching Sin', '51868', 'Miss', 'Larita', 'Larpverachai', 6, '4/14'),
('Leezan', '49090', 'Leezan', '49090', 'Mr.', 'Nathapong', 'Meesuk', 6, '5/14'),
('Pengkuang', '49093', 'Pengkuang', '49093', 'Mr.', 'Papangkorn', 'Yingohonphatsorn', 6, '5/14'),
('Dod', '49104', 'Dod', '49104', 'Mr.', 'Phophtam', 'Swangsang', 6, '5/14'),
('Soba', '49109', 'Soba', '49109', 'Mr.', 'Sorrasit', 'Viravendej', 6, '5/14'),
('Khao', '49039', 'Khao', '49039', 'Miss', 'Phitchaya', 'Kaikeaw', 6, '5/14'),
('Acare', '49096', 'Acare', '49096', 'Miss', 'Nichapath', 'Chunlawithet', 6, '5/14'),
('Mirin', '51145', 'Mirin', '51145', 'Miss', 'Sojung', 'Lim', 6, '5/14'),
('Lyn', '51146', 'Lyn', '51146', 'Miss', 'Nannapat', 'Kotchasarn', 6, '5/14'),
('Kaopoad', '51147', 'Kaopoad', '51147', 'Miss', 'Rarunphat', 'Nantaraweewat', 6, '5/14'),
('Pear', '51161', 'Pear', '51161', 'Miss', 'Sarareewan', 'Reenawong', 6, '5/14');

INSERT INTO test_assignments (user_id, test_id)
SELECT u.id, t.id FROM users u CROSS JOIN tests t;

INSERT INTO test_results (user_id, test_id, score, completed) VALUES
(1, 3, 18, TRUE),
(2, 3, 16, TRUE),
(3, 3, 19, TRUE),
(1, 4, 22, TRUE),
(2, 4, 20, TRUE);

SELECT class_name, COUNT(*) as student_count FROM users GROUP BY class_name ORDER BY class_name;


ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_level INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_name VARCHAR(20);

UPDATE users SET username = nickname WHERE nickname IS NOT NULL;
UPDATE users SET password = student_id WHERE student_id IS NOT NULL;

UPDATE grade_1 SET username = nickname, password = student_id;
UPDATE grade_2 SET username = nickname, password = student_id;
UPDATE grade_3 SET username = nickname, password = student_id;
UPDATE grade_4 SET username = nickname, password = student_id;
UPDATE grade_5 SET username = nickname, password = student_id;
UPDATE grade_6 SET username = nickname, password = student_id;


INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name) VALUES
('Munich', '48457', 'Munich', '48457', 'Mr.', 'Eakkanin', 'Sithchaisurakool', 6, '6/14'),
('Bright', '48458', 'Bright', '48458', 'M.', 'Chayodom', 'Disayawan', 6, '6/14'),
('Don', '48461', 'Don', '48461', 'Mr.', 'Thannadon', 'Chimree', 6, '6/14'),
('Dollar', '48483', 'Dollar', '48483', 'Mr.', 'Dollar', 'Pemredang', 6, '6/14'),
('Tonmai', '50438', 'Tonmai', '50438', 'Mr.', 'Korrakod', 'Bookkaluck', 6, '6/14'),
('Pupha', '50439', 'Pupha', '50439', 'Mr.', 'Teeradech', 'Pattamasopa', 6, '6/14'),
('Oil', '48489', 'Oil', '48489', 'Miss', 'Kodchakorn', 'Chongkwanyuen', 6, '6/14'),
('Gift', '48490', 'Gift', '48490', 'Miss', 'Janapat', 'Khamsanthia', 6, '6/14'),
('Ink', '48491', 'Ink', '48491', 'Miss', 'Thanyamas', 'Eamwarakul', 6, '6/14'),
('Tongkaw', '48496', 'Tongkaw', '48496', 'Miss', 'Pornnatcha', 'Neramit', 6, '6/14'),
('Bam', '48498', 'Bam', '48498', 'Miss', 'Peerada', 'Chubunjong', 6, '6/14'),
('Praew', '48500', 'Praew', '48500', 'Miss', 'Wilasinee', 'Thonglue', 6, '6/14'),
('Noodee', '48501', 'Noodee', '48501', 'Miss', 'Suphattiya', 'Wungkeangtham', 6, '6/14'),
('Sayo', '50323', 'Sayo', '50323', 'Miss', 'Yang', 'Qixuan', 6, '6/14'),
('New', '50440', 'New', '50440', 'Miss', 'Kunpriya', 'Butnamrak', 6, '6/14'),
('Ing', '50442', 'Ing', '50442', 'Miss', 'Arada', 'Wang', 6, '6/14')
ON CONFLICT (username) DO NOTHING;
