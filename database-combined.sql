
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


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
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('online','offline')) DEFAULT 'online',
    test_url VARCHAR(500),
    max_score INTEGER DEFAULT 10,
    duration_minutes INTEGER,
    grade_level INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
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
    max_score INTEGER NOT NULL,
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, test_id, grade_level)
);


INSERT INTO admins (username, password)
VALUES ('admin', 'BigusDickus')
ON CONFLICT (username) DO NOTHING;


INSERT INTO semesters (name, academic_year, start_date, end_date, is_active) VALUES
('1st Semester', '2024-2025', '2024-09-01', '2025-01-31', TRUE),
('2nd Semester', '2024-2025', '2025-02-01', '2025-06-30', FALSE)
ON CONFLICT DO NOTHING;


INSERT INTO terms (semester_id, name, term_number, start_date, end_date, is_active) VALUES
(1, 'Term 1', 1, '2024-09-01', '2024-11-30', TRUE),
(1, 'Term 2', 2, '2024-12-01', '2025-01-31', FALSE),
(2, 'Term 1', 1, '2025-02-01', '2025-04-30', FALSE),
(2, 'Term 2', 2, '2025-05-01', '2025-06-30', FALSE)
ON CONFLICT DO NOTHING;


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
('Final Exam', 'Comprehensive semester exam', 2, 'online', '/final-exam', 50, 180, '2025-01-20 09:00:00', '2025-01-20 17:00:00', 6)
ON CONFLICT DO NOTHING;


INSERT INTO grade_6 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Munich', '48457', 'Munich', '48457', 'Mr.', 'Eakkanin', 'Sithchaisurakool', '6/14'),
('Bright', '48458', 'Bright', '48458', 'Mr.', 'Chayodom', 'Disayawan', '6/14'),
('Don', '48461', 'Don', '48461', 'Mr.', 'Don', 'Don', '6/14'),
('Dollar', '48483', 'Dollar', '48483', 'Mr.', 'Dollar', 'Dollar', '6/14'),
('Tonmai', '50438', 'Tonmai', '50438', 'Mr.', 'Tonmai', 'Tonmai', '6/14'),
('Pupha', '50439', 'Pupha', 'Pupha', 'Mr.', 'Pupha', 'Pupha', '6/14'),
('Oil', '48489', 'Oil', '48489', 'Mr.', 'Oil', 'Oil', '6/14'),
('Gift', '48490', 'Gift', '48490', 'Mr.', 'Gift', 'Gift', '6/14'),
('Ink', '48491', 'Ink', '48491', 'Mr.', 'Ink', 'Ink', '6/14'),
('Tongkaw', '48496', 'Tongkaw', '48496', 'Mr.', 'Tongkaw', 'Tongkaw', '6/14'),
('Bam', '48498', 'Bam', '48498', 'Mr.', 'Bam', 'Bam', '6/14'),
('Praew', '48500', 'Praew', '48500', 'Mr.', 'Praew', 'Praew', '6/14'),
('Noodee', '48501', 'Noodee', '48501', 'Mr.', 'Noodee', 'Noodee', '6/14'),
('Sayo', '50323', 'Sayo', '50323', 'Mr.', 'Sayo', 'Sayo', '6/14'),
('New', '50440', 'New', '50440', 'Mr.', 'New', 'New', '6/14'),
('Ing', '50442', 'Ing', '50442', 'Mr.', 'Ing', 'Ing', '6/14')
ON CONFLICT (username) DO NOTHING;


INSERT INTO grade_1 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Tong Tong', '51706', 'Tong Tong', '51706', 'Mr.', 'Kittikhun', 'Siriwadtanakojaroen', '1/15'),
('Idea', '51707', 'Idea', '51707', 'Mr.', 'Jittiphat', 'Suksamai', '1/15'),
('Tun', '51708', 'Tun', '51708', 'Mr.', 'Jiraphon', 'Sawanakasem', '1/15'),
('Pupha', '51709', 'Pupha', '51709', 'Mr.', 'Nattawat', 'Prakobpanich', '1/15'),
('Sprite', '51710', 'Sprite', '51710', 'Mr.', 'Thanawat', 'Pungsati', '1/15'),
('Sea', '51711', 'Sea', '51711', 'Mr.', 'Bawonchai', 'Udomkhongmangmee', '1/15'),
('Chirew', '51712', 'Chirew', '51712', 'Mr.', 'Pichaya', 'Chansate', '1/15'),
('Rose', '51713', 'Rose', '51713', 'Miss', 'Kamonchat', 'Amornphongmongkol', '1/15'),
('Tonhom', '51714', 'Tonhom', '51714', 'Miss', 'Chanyanuch', 'Houyhuan', '1/15'),
('Bruda', '51715', 'Bruda', '51715', 'Miss', 'Napat', 'Mongkolwatcharoen', '1/15'),
('Luck', '51716', 'Luck', '51716', 'Miss', 'Thanyaluk', 'Ueasiyaphan', '1/15'),
('Jewelry', '51717', 'Jewelry', '51717', 'Miss', 'Nicha', 'Jailak', '1/15'),
('Nee', '51718', 'Nee', '51718', 'Miss', 'Neeraphan', 'Tangpaopong', '1/15'),
('Khaning', '51719', 'Khaning', '51719', 'Miss', 'Phonnapphan', 'Settheepokha', '1/15'),
('Éclair', '51720', 'Éclair', '51720', 'Miss', 'Patsorn', 'Jenkatkan', '1/15'),
('Baifern', '51721', 'Baifern', '51721', 'Miss', 'Ploypaphat', 'Kittiwittayarom', '1/15'),
('Tus', '51722', 'Tus', '51722', 'Miss', 'Wanvisa', 'Ratsamichai', '1/15'),
('Winnie', '51723', 'Winnie', '51723', 'Miss', 'Wipaporn', 'Muangsane', '1/15'),
('Mei', '51724', 'Mei', '51724', 'Miss', 'Sasiwannaporn', 'Likitbannasak', '1/15'),
('Thien', '51725', 'Thien', '51725', 'Miss', 'Sarisa', 'Bhoosudsawaeng', '1/15'),
('Meili', '51726', 'Meili', '51726', 'Miss', 'Akanit', 'Kampimabouth', '1/15'),
('Khaohom', '51727', 'Khaohom', '51727', 'Miss', 'Uracha', 'Maolee', '1/15'),
('Pangko', '51728', 'Pangko', '51728', 'Miss', 'Aticia', 'Kesornsung', '1/15'),
('Pukan', '51729', 'Pukan', '51729', 'Mr.', 'Kamonlaphop', 'Prasertchroenphol', '1/16'),
('Yoshi', '51730', 'Yoshi', '51730', 'Mr.', 'Jumpon', 'Onlamul', '1/16'),
('Title', '51731', 'Title', '51731', 'Mr.', 'Chinnapat', 'Prabthong', '1/16'),
('Khaopun', '51732', 'Khaopun', '51732', 'Mr.', 'Naphat', 'Yuadyan', '1/16'),
('Austin', '51733', 'Austin', '51733', 'Mr.', 'Thanadol', 'Rakchanachai', '1/16'),
('Inkyu', '51734', 'Inkyu', '51734', 'Mr.', 'Thanatbodee', 'Hongwiset', '1/16'),
('CC', '51735', 'CC', '51735', 'Mr.', 'Thitiwat', 'Srisaard', '1/16'),
('Nene', '51736', 'Nene', '51736', 'Mr.', 'Noppakrun', 'Kruaisawat', '1/16'),
('Cino', '51737', 'Cino', '51737', 'Mr.', 'Nawin', 'Pongputtipak', '1/16'),
('August', '51738', 'August', '51738', 'Mr.', 'Woradej', 'Boonto', '1/16'),
('Ongsa', '51739', 'Ongsa', '51739', 'Mr.', 'Ongsa', 'Assanee', '1/16'),
('Kaimook', '51740', 'Kaimook', '51740', 'Miss', 'Chanyanas', 'Surawuthinak', '1/16'),
('Elfie', '51741', 'Elfie', '51741', 'Miss', 'Napattika', 'Imyaem', '1/16'),
('Senior', '51742', 'Senior', '51742', 'Miss', 'Natthanun', 'Kunkhomit', '1/16'),
('Anda', '51743', 'Anda', '51743', 'Miss', 'Thepteeramumin', 'Boontarmteeraputi', '1/16'),
('Smile', '51744', 'Smile', '51744', 'Miss', 'Piyakarn', 'Kittisiriphan', '1/16'),
('Ploy', '51745', 'Ploy', '51745', 'Miss', 'Pobporn', 'Intarasorn', '1/16'),
('Kwan Khao', '51747', 'Kwan Khao', '51747', 'Miss', 'Pitthayapat', 'Srithanakitwetin', '1/16'),
('Dream', '51748', 'Dream', '51748', 'Miss', 'Piriyapond', 'Kittimaensuriya', '1/16'),
('Pream', '51750', 'Pream', '51750', 'Miss', 'Atiporn', 'Promduang', '1/16')
ON CONFLICT (username) DO NOTHING;

INSERT INTO grade_2 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Captain', '51007', 'Captain', '51007', 'Mr.', 'Kittikhun', 'Rungsuk', '2/15'),
('Cartoon', '51008', 'Cartoon', '51008', 'Mr.', 'Kongpop', 'Samanah', '2/15'),
('Boss', '51009', 'Boss', '51009', 'Mr.', 'Natin', 'Ngaeprom', '2/15'),
('Dej', '51010', 'Dej', '51010', 'Mr.', 'Thammadej', 'Dejharn', '2/15'),
('Zen', '51011', 'Zen', '51011', 'Mr.', 'Bhumipat', 'Tiranasawad', '2/15'),
('Harit', '51012', 'Harit', '51012', 'Mr.', 'Yotprasu', 'Yongprayoon', '2/15'),
('Winson', '51013', 'Winson', '51013', 'Mr.', 'Winson', 'Chakhong', '2/15'),
('First', '51014', 'First', '51014', 'Mr.', 'Piriyakorn', 'Soontornkumphonrat', '2/15'),
('Auto', '51015', 'Auto', '51015', 'Mr.', 'Surathat', 'Fongnaree', '2/15'),
('Tonplam', '51016', 'Tonplam', '51016', 'Mr.', 'Thanadej', 'Pichairat', '2/15'),
('Bright', '51017', 'Bright', '51017', 'Mr.', 'Nattawat', 'Boonpitsit', '2/15'),
('Loma', '51881', 'Loma', '51881', 'Mr.', 'Thepteeramungkorn', 'Boomthantiraput', '2/15'),
('Bua', '51018', 'Bua', '51018', 'Miss', 'Kanyanat', 'Saksakunkailerd', '2/15'),
('Nana', '51019', 'Nana', '51019', 'Miss', 'Kakanang', 'Boonlua', '2/15'),
('Maprang', '51020', 'Maprang', '51020', 'Miss', 'Nattanicha', 'Ruento', '2/15'),
('North', '51021', 'North', '51021', 'Miss', 'Danaya', 'Saiwanna', '2/15'),
('Seiya', '51022', 'Seiya', '51022', 'Miss', 'Thannatsaorn', 'Anthipkul', '2/15'),
('Eclair', '51023', 'Eclair', '51023', 'Miss', 'Thanuchmon', 'Suwiratwitayakit', '2/15'),
('tete', '51024', 'tete', '51024', 'Miss', 'Thunchanok', 'Klongratsakul', '2/15'),
('cream', '51025', 'cream', '51025', 'Miss', 'Pinyaphat', 'Supboontanakorn', '2/15'),
('Nobell', '51026', 'Nobell', '51026', 'Miss', 'Waran', 'Kanwan', '2/15'),
('Viva', '51027', 'Viva', '51027', 'Miss', 'Sukaksorn', 'Kanjanakunti', '2/15'),
('Khaohom', '51028', 'Khaohom', '51028', 'Miss', 'Supitchaya', 'Sukjit', '2/15'),
('Nam', '51029', 'Nam', '51029', 'Miss', 'Siriyapon', 'Ramunu', '2/15'),
('Waenpetch', '51030', 'Waenpetch', '51030', 'Miss', 'Hathaytip', 'Sawangruttaya', '2/15'),
('Chirew', '51032', 'Chirew', '51032', 'Mr.', 'Konakk', 'Rojanasupakul', '2/16'),
('Kishna', '51033', 'Kishna', '51033', 'Mr.', 'Kishna', 'Joshi', '2/16'),
('Justin', '51034', 'Justin', '51034', 'Mr.', 'Justin', 'Damayanti Luxameesathporn', '2/16'),
('Pun', '51035', 'Pun', '51035', 'Mr.', 'Jiraphat', 'Chamnoi', '2/16'),
('Pat', '51036', 'Pat', '51036', 'Mr.', 'Jirayu', 'Thanawiphakon', '2/16'),
('Din', '51037', 'Din', '51037', 'Mr.', 'Chanthawat', 'Bowonaphiwong', '2/16'),
('Shiryu', '51038', 'Shiryu', '51038', 'Mr.', 'Napat', 'Uthaisang', '2/16'),
('Singto', '51039', 'Singto', '51039', 'Mr.', 'Thianrawit', 'Ammaranon', '2/16'),
('Prince', '51040', 'Prince', '51040', 'Mr.', 'Narawut', 'Meechaiudomdech', '2/16'),
('Titan', '51041', 'Titan', '51041', 'Mr.', 'Papangkorn', 'Teeratanatanyaboon', '2/16'),
('Tim', '51042', 'Tim', '51042', 'Mr.', 'Poptam', 'Sathongkham', '2/16'),
('Mark', '51043', 'Mark', '51043', 'Mr.', 'Marwin', 'Phandumrongkul', '2/16'),
('Namo', '51044', 'Namo', '51044', 'Mr.', 'Suwijak', 'kijrungsophun', '2/16'),
('Fifa', '51045', 'Fifa', '51045', 'Miss', 'Chonlada', 'Bonthong', '2/16'),
('Chertam', '51046', 'Chertam', '51046', 'Miss', 'Nathathai', 'Sapparia', '2/16'),
('Pam Pam', '51047', 'Pam Pam', '51047', 'Miss', 'Nopchanok', 'Reenavong', '2/16'),
('Namcha', '51048', 'Namcha', '51048', 'Miss', 'Parita', 'Taetee', '2/16'),
('Pare', '51049', 'Pare', '51049', 'Miss', 'Pimpreeya', 'Paensuwam', '2/16'),
('Focus', '51050', 'Focus', '51050', 'Miss', 'Wirunchana', 'Daungwijit', '2/16'),
('Jang Jang', '51051', 'Jang Jang', '51051', 'Miss', 'Supisala', 'Chesadatas', '2/16'),
('MiMi', '51052', 'MiMi', '51052', 'Miss', 'Aaraya', 'Loamorrwach', '2/16'),
('Mee Mee', '51053', 'Mee Mee', '51053', 'Miss', 'Ariyan', '', '2/16'),
('Boeing', '51152', 'Boeing', '51152', 'Miss', 'Ploypaphat', 'Aphichatprasert', '2/16'),
('Yang Yang', '51153', 'Yang Yang', '51153', 'Miss', 'Yang Yang', '', '2/16')
ON CONFLICT (username) DO NOTHING;


INSERT INTO grade_3 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Michael', '50311', 'Michael', '50311', 'Mr.', 'Fan', 'Shucheng', '3/15'),
('Koh', '50312', 'Koh', '50312', 'Mr.', 'Koh', 'Shirato', '3/15'),
('Plangton', '50313', 'Plangton', '50313', 'Mr.', 'Chalanthorn', 'Somabootr', '3/15'),
('Han', '50314', 'Han', '50314', 'Mr.', 'Napat', 'Phomvongtip', '3/15'),
('August', '50315', 'August', '50315', 'Mr.', 'Natthanon', 'Aungkanaworakul', '3/15'),
('Sorn', '50316', 'Sorn', '50316', 'Mr.', 'Thanatsorn', 'Wasuntranijwipa', '3/15'),
('Oscar', '50317', 'Oscar', '50317', 'Mr.', 'Thannathorn', 'Keaw-on', '3/15'),
('Peach', '50318', 'Peach', '50318', 'Mr.', 'Teeraphat', 'Kitsato', '3/15'),
('Earth', '50319', 'Earth', '50319', 'Mr.', 'Pitpibul', 'Notayos', '3/15'),
('Fiat', '50320', 'Fiat', '50320', 'Mr.', 'Woradet', 'Premphueam', '3/15'),
('Foam', '50321', 'Foam', '50321', 'Mr.', 'Wiritphon', 'Niyomthai', '3/15'),
('Vishnu', '50322', 'Vishnu', '50322', 'Mr.', 'Vishnu', 'Joshi Changchamrat', '3/15'),
('Gus', '51054', 'Gus', '51054', 'Mr.', 'Kannawat', 'Noosap', '3/15'),
('Tar', '51055', 'Tar', '51055', 'Mr.', 'Nuttakorn', 'Klongratsakul', '3/15'),
('Ken', '51056', 'Ken', '51056', 'Mr.', 'Thitipat', 'Suknantasit', '3/15'),
('Fah', '50324', 'Fah', '50324', 'Miss', 'Chanutchanan', 'Rachatamethachot', '3/15'),
('Aum', '50325', 'Aum', '50325', 'Miss', 'Natpatsorn', 'Permruangtanapol', '3/15'),
('Matoom', '50326', 'Matoom', '50326', 'Miss', 'Tangsima', 'Sateanpong', '3/15'),
('Ing', '50327', 'Ing', '50327', 'Miss', 'Nirinyanut', 'Techathanwisit', '3/15'),
('Bam', '50328', 'Bam', '50328', 'Miss', 'Punyanuch', 'Taninpong', '3/15'),
('Pan', '50329', 'Pan', '50329', 'Miss', 'Phatnarin', 'Suppakijchanchai', '3/15'),
('Sunny', '50330', 'Sunny', '50330', 'Miss', 'Wipawat', 'Muangsan', '3/15'),
('Night', '50331', 'Night', '50331', 'Miss', 'Santamon', 'Sarakun', '3/15'),
('Annatch', '50332', 'Annatch', '50332', 'Miss', 'Annatch', 'Sithchaisurakool', '3/15'),
('Phat', '50333', 'Phat', '50333', 'Mr.', 'Zin Myint', 'Mo Lin', '3/16'),
('Kun', '50334', 'Kun', '50334', 'Mr.', 'Kantapon', 'Chinudomporn', '3/16'),
('Num', '50335', 'Num', '50335', 'Mr.', 'Krirkwit', 'Meeto', '3/16'),
('Artid', '50336', 'Artid', '50336', 'Mr.', 'Natakorn', 'Ritthongpitak', '3/16'),
('Farm', '50337', 'Farm', '50337', 'Mr.', 'Natthanon', 'Vanichsiripatr', '3/16'),
('Zen', '50339', 'Zen', '50339', 'Mr.', 'Tanaphop', 'Bumrungrak', '3/16'),
('Tarhai', '50340', 'Tarhai', '50340', 'Mr.', 'Teerat', 'Waratpaweetorn', '3/16'),
('Skibidi', '50341', 'Skibidi', '50341', 'Mr.', 'Prart', 'Sirinarm', '3/16'),
('Prom', '50342', 'Prom', '50342', 'Mr.', 'Peethong', 'Saenkhomor', '3/16'),
('Poom', '50343', 'Poom', '50343', 'Mr.', 'Poom', 'Thongpaen', '3/16'),
('Phumphat', '50344', 'Phumphat', '50344', 'Mr.', 'Phumphat', 'Lertwannaporn', '3/16'),
('Kit', '50345', 'Kit', '50345', 'Mr.', 'Worakit', 'Krajangsri', '3/16'),
('Franc', '50346', 'Franc', '50346', 'Mr.', 'Sukrit', 'Dechphol', '3/16'),
('Tripple', '50347', 'Tripple', '50347', 'Miss', 'Chachalee', 'Boonchuachan', '3/16'),
('Jiffy', '50348', 'Jiffy', '50348', 'Miss', 'Yanisa', 'Raweepipat', '3/16'),
('Ingrak', '50349', 'Ingrak', '50349', 'Miss', 'Titapha', 'Yuthanom', '3/16'),
('Aunpan', '50350', 'Aunpan', '50350', 'Miss', 'Nutchanun', 'Suwannahong', '3/16'),
('Ozon', '50351', 'Ozon', '50351', 'Miss', 'Thanunchanok', 'Songrum', '3/16'),
('Cake', '50352', 'Cake', '50352', 'Miss', 'Pakijra', 'Panjach', '3/16'),
('Tonaor', '50353', 'Tonaor', '50353', 'Miss', 'Phinyaphat', 'Chatthanawan', '3/16'),
('Hana', '50354', 'Hana', '50354', 'Miss', 'Supichaya', 'Suppasing', '3/16')
ON CONFLICT (username) DO NOTHING;


INSERT INTO grade_4 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Tack', '49767', 'Tack', '49767', 'Mr.', 'Sirasit', 'Panyasit', '4/14'),
('Cfo', '51864', 'Cfo', '51864', 'Mr.', 'Peerapat', 'Suktapot', '4/14'),
('Gui', '51865', 'Gui', '51865', 'Mr.', 'Wongsathorn', 'Rod-aree', '4/14'),
('Tonkla', '51866', 'Tonkla', '51866', 'Mr.', 'Suwisith', 'Tempraserteudee', '4/14'),
('Bebe', '49754', 'Bebe', '49754', 'Miss', 'Chutikan', 'Pornvasin', '4/14'),
('Prae', '49773', 'Prae', '49773', 'Miss', 'Praewan', 'Taecha-in', '4/14'),
('Tar', '51867', 'Tar', '51867', 'Miss', 'Chinapa', 'Chanumklang', '4/14'),
('Ching Sin', '51868', 'Ching Sin', '51868', 'Miss', 'Larita', 'Larpverachai', '4/14')
ON CONFLICT (username) DO NOTHING;


INSERT INTO grade_5 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Leezan', '49090', 'Leezan', '49090', 'Mr.', 'Nathapong', 'Meesuk', '5/14'),
('Pengkuang', '49093', 'Pengkuang', '49093', 'Mr.', 'Papangkorn', 'Yingohonphatsorn', '5/14'),
('Dod', '49104', 'Dod', '49104', 'Mr.', 'Phophtam', 'Swangsang', '5/14'),
('Soba', '49109', 'Soba', '49109', 'Mr.', 'Sorrasit', 'Viravendej', '5/14'),
('Khao', '49039', 'Khao', '49039', 'Miss', 'Phitchaya', 'Kaikeaw', '5/14'),
('Acare', '49096', 'Acare', '49096', 'Miss', 'Nichapath', 'Chunlawithet', '5/14'),
('Mirin', '51145', 'Mirin', '51145', 'Miss', 'Sojung', 'Lim', '5/14'),
('Lyn', '51146', 'Lyn', '51146', 'Miss', 'Nannapat', 'Kotchasarn', '5/14'),
('Kaopoad', '51147', 'Kaopoad', '51147', 'Miss', 'Rarunphat', 'Nantaraweewat', '5/14'),
('Pear', '51161', 'Pear', '51161', 'Miss', 'Sarareewan', 'Reenawong', '5/14')
ON CONFLICT (username) DO NOTHING;


INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 1, class_name FROM grade_1
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 2, class_name FROM grade_2
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 3, class_name FROM grade_3
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 4, class_name FROM grade_4
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 5, class_name FROM grade_5
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name)
SELECT username, password, nickname, student_id, title, first_name, last_name, 6, class_name FROM grade_6
ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    student_id = EXCLUDED.student_id,
    title = EXCLUDED.title,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    grade_level = EXCLUDED.grade_level,
    class_name = EXCLUDED.class_name;

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

SELECT COUNT(*) as total_users FROM users;
SELECT username, student_id, grade_level, class_name FROM users LIMIT 10;

-- Insert test results with random data for grade 6 students
INSERT INTO test_results (user_id, test_id, grade_level, score, answers, submitted_at, completed) VALUES
-- Munich's results (Grade 6)
(1, 8, 6, 92, '{"vocabulary_score": 92, "time_taken": 42}', '2024-06-18 14:25:00', true),
(1, 9, 6, 85, '{"grammar_score": 85, "time_taken": 38}', '2024-07-02 11:15:00', true),
(1, 10, 6, 89, '{"reading_score": 89, "time_taken": 72}', '2024-07-22 16:40:00', true),
(1, 11, 6, 78, '{"writing_score": 78, "time_taken": 108}', '2024-08-12 13:30:00', true),
(1, 12, 6, 91, '{"final_score": 91, "time_taken": 88}', '2024-09-03 09:45:00', true),

-- Bright's results (Grade 6)
(2, 8, 6, 88, '{"vocabulary_score": 88, "time_taken": 47}', '2024-06-20 10:30:00', true),
(2, 9, 6, 93, '{"grammar_score": 93, "time_taken": 35}', '2024-07-05 15:20:00', true),
(2, 10, 6, 76, '{"reading_score": 76, "time_taken": 81}', '2024-07-25 12:15:00', true),
(2, 11, 6, 87, '{"writing_score": 87, "time_taken": 104}', '2024-08-15 14:50:00', true),
(2, 12, 6, 84, '{"final_score": 84, "time_taken": 95}', '2024-09-06 11:20:00', true),

-- Don's results (Grade 6)
(3, 8, 6, 95, '{"vocabulary_score": 95, "time_taken": 33}', '2024-06-19 13:45:00', true),
(3, 9, 6, 79, '{"grammar_score": 79, "time_taken": 44}', '2024-07-03 09:10:00', true),
(3, 10, 6, 91, '{"reading_score": 91, "time_taken": 68}', '2024-07-24 17:25:00', true),
(3, 11, 6, 82, '{"writing_score": 82, "time_taken": 115}', '2024-08-16 10:40:00', true),
(3, 12, 6, 89, '{"final_score": 89, "time_taken": 92}', '2024-09-04 16:15:00', true),

-- Dollar's results (Grade 6)
(4, 8, 6, 81, '{"vocabulary_score": 81, "time_taken": 51}', '2024-06-21 08:55:00', true),
(4, 9, 6, 88, '{"grammar_score": 88, "time_taken": 37}', '2024-07-06 14:30:00', true),
(4, 10, 6, 83, '{"reading_score": 83, "time_taken": 75}', '2024-07-26 11:20:00', true),
(4, 11, 6, 90, '{"writing_score": 90, "time_taken": 99}', '2024-08-17 15:10:00', true),
(4, 12, 6, 86, '{"final_score": 86, "time_taken": 89}', '2024-09-05 12:35:00', true),

-- Tonmai's results (Grade 6)
(5, 8, 6, 87, '{"vocabulary_score": 87, "time_taken": 45}', '2024-06-22 16:20:00', true),
(5, 9, 6, 91, '{"grammar_score": 91, "time_taken": 32}', '2024-07-07 10:45:00', true),
(5, 10, 6, 77, '{"reading_score": 77, "time_taken": 79}', '2024-07-27 13:55:00', true),
(5, 11, 6, 85, '{"writing_score": 85, "time_taken": 111}', '2024-08-18 09:25:00', true),
(5, 12, 6, 93, '{"final_score": 93, "time_taken": 87}', '2024-09-07 14:40:00', true),

-- Pupha's results (Grade 6)
(6, 8, 6, 94, '{"vocabulary_score": 94, "time_taken": 36}', '2024-06-23 12:10:00', true),
(6, 9, 6, 86, '{"grammar_score": 86, "time_taken": 40}', '2024-07-08 16:15:00', true),
(6, 10, 6, 88, '{"reading_score": 88, "time_taken": 71}', '2024-07-28 08:30:00', true),
(6, 11, 6, 79, '{"writing_score": 79, "time_taken": 118}', '2024-08-19 17:45:00', true),
(6, 12, 6, 90, '{"final_score": 90, "time_taken": 91}', '2024-09-08 10:20:00', true),

-- Oil's results (Grade 6)
(7, 8, 6, 89, '{"vocabulary_score": 89, "time_taken": 41}', '2024-06-24 15:40:00', true),
(7, 9, 6, 94, '{"grammar_score": 94, "time_taken": 31}', '2024-07-09 11:25:00', true),
(7, 10, 6, 85, '{"reading_score": 85, "time_taken": 76}', '2024-07-29 14:50:00', true),
(7, 11, 6, 93, '{"writing_score": 93, "time_taken": 96}', '2024-08-20 12:15:00', true),
(7, 12, 6, 97, '{"final_score": 97, "time_taken": 78}', '2024-09-09 13:30:00', true),

-- Gift's results (Grade 6)
(8, 8, 6, 83, '{"vocabulary_score": 83, "time_taken": 49}', '2024-06-25 09:15:00', true),
(8, 9, 6, 90, '{"grammar_score": 90, "time_taken": 34}', '2024-07-10 15:35:00', true),
(8, 10, 6, 92, '{"reading_score": 92, "time_taken": 67}', '2024-07-30 10:45:00', true),
(8, 11, 6, 86, '{"writing_score": 86, "time_taken": 107}', '2024-08-21 16:20:00', true),
(8, 12, 6, 88, '{"final_score": 88, "time_taken": 94}', '2024-09-10 11:55:00', true)
ON CONFLICT DO NOTHING;

-- Create test visibility table for admin controls
CREATE TABLE IF NOT EXISTS test_visibility (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default test visibility settings (all tests initially hidden)
INSERT INTO test_visibility (test_id, is_visible) VALUES
('grade1-listening', false),
('grade2-listening', false),
('grade2-vocabulary', false),
('grade3-listening', false),
('grade3-vocabulary', false),
('grade4-vocabulary', false),
('grade5-vocabulary', false),
('grade6-vocabulary', false),
('grade6-grammar', false),
('grade6-reading', false),
('grade6-writing', false),
('grade6-final', false)
ON CONFLICT (test_id) DO NOTHING;
