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
    grade_level INTEGER NOT NULL,
    term INTEGER NOT NULL,
    test_number INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(1, 'Term 1 Test 1', 'Grade 1 Term 1 Test 1', 1, 1, 1, 10),
(2, 'Term 1 Test 2', 'Grade 1 Term 1 Test 2', 1, 1, 2, 10),
(3, 'Term 1 Test 3', 'Grade 1 Term 1 Test 3', 1, 1, 3, 10),
(4, 'Term 1 Test 4', 'Grade 1 Term 1 Test 4', 1, 1, 4, 10),
(5, 'Term 2 Test 1', 'Grade 1 Term 2 Test 1', 1, 2, 1, 10),
(6, 'Term 2 Test 2', 'Grade 1 Term 2 Test 2', 1, 2, 2, 10),
(7, 'Term 2 Test 3', 'Grade 1 Term 2 Test 3', 1, 2, 3, 10),
(8, 'Term 2 Test 4', 'Grade 1 Term 2 Test 4', 1, 2, 4, 10),
(9, 'Term 2 Test 5', 'Grade 1 Term 2 Test 5', 1, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(11, 'Term 1 Test 1', 'Grade 2 Term 1 Test 1', 2, 1, 1, 10),
(12, 'Term 1 Test 2', 'Grade 2 Term 1 Test 2', 2, 1, 2, 10),
(13, 'Term 1 Test 3', 'Grade 2 Term 1 Test 3', 2, 1, 3, 10),
(14, 'Term 1 Test 4', 'Grade 2 Term 1 Test 4', 2, 1, 4, 10),
(15, 'Term 2 Test 1', 'Grade 2 Term 2 Test 1', 2, 2, 1, 10),
(16, 'Term 2 Test 2', 'Grade 2 Term 2 Test 2', 2, 2, 2, 10),
(17, 'Term 2 Test 3', 'Grade 2 Term 2 Test 3', 2, 2, 3, 10),
(18, 'Term 2 Test 4', 'Grade 2 Term 2 Test 4', 2, 2, 4, 10),
(19, 'Term 2 Test 5', 'Grade 2 Term 2 Test 5', 2, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;


INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(21, 'Term 1 Test 1', 'Grade 3 Term 1 Test 1', 3, 1, 1, 10),
(22, 'Term 1 Test 2', 'Grade 3 Term 1 Test 2', 3, 1, 2, 10),
(23, 'Term 1 Test 3', 'Grade 3 Term 1 Test 3', 3, 1, 3, 10),
(24, 'Term 1 Test 4', 'Grade 3 Term 1 Test 4', 3, 1, 4, 10),
(25, 'Term 2 Test 1', 'Grade 3 Term 2 Test 1', 3, 2, 1, 10),
(26, 'Term 2 Test 2', 'Grade 3 Term 2 Test 2', 3, 2, 2, 10),
(27, 'Term 2 Test 3', 'Grade 3 Term 2 Test 3', 3, 2, 3, 10),
(28, 'Term 2 Test 4', 'Grade 3 Term 2 Test 4', 3, 2, 4, 10),
(29, 'Term 2 Test 5', 'Grade 3 Term 2 Test 5', 3, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;


INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(31, 'Term 1 Test 1', 'Grade 4 Term 1 Test 1', 4, 1, 1, 10),
(32, 'Term 1 Test 2', 'Grade 4 Term 1 Test 2', 4, 1, 2, 10),
(33, 'Term 1 Test 3', 'Grade 4 Term 1 Test 3', 4, 1, 3, 10),
(34, 'Term 1 Test 4', 'Grade 4 Term 1 Test 4', 4, 1, 4, 10),
(35, 'Term 2 Test 1', 'Grade 4 Term 2 Test 1', 4, 2, 1, 10),
(36, 'Term 2 Test 2', 'Grade 4 Term 2 Test 2', 4, 2, 2, 10),
(37, 'Term 2 Test 3', 'Grade 4 Term 2 Test 3', 4, 2, 3, 10),
(38, 'Term 2 Test 4', 'Grade 4 Term 2 Test 4', 4, 2, 4, 10),
(39, 'Term 2 Test 5', 'Grade 4 Term 2 Test 5', 4, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;


INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(41, 'Term 1 Test 1', 'Grade 5 Term 1 Test 1', 5, 1, 1, 10),
(42, 'Term 1 Test 2', 'Grade 5 Term 1 Test 2', 5, 1, 2, 10),
(43, 'Term 1 Test 3', 'Grade 5 Term 1 Test 3', 5, 1, 3, 10),
(44, 'Term 1 Test 4', 'Grade 5 Term 1 Test 4', 5, 1, 4, 10),
(45, 'Term 2 Test 1', 'Grade 5 Term 2 Test 1', 5, 2, 1, 10),
(46, 'Term 2 Test 2', 'Grade 5 Term 2 Test 2', 5, 2, 2, 10),
(47, 'Term 2 Test 3', 'Grade 5 Term 2 Test 3', 5, 2, 3, 10),
(48, 'Term 2 Test 4', 'Grade 5 Term 2 Test 4', 5, 2, 4, 10),
(49, 'Term 2 Test 5', 'Grade 5 Term 2 Test 5', 5, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;


INSERT INTO tests (id, name, description, grade_level, term, test_number, max_score) VALUES
(51, 'Term 1 Test 1', 'Grade 6 Term 1 Test 1', 6, 1, 1, 10),
(52, 'Term 1 Test 2', 'Grade 6 Term 1 Test 2', 6, 1, 2, 10),
(53, 'Term 1 Test 3', 'Grade 6 Term 1 Test 3', 6, 1, 3, 10),
(54, 'Term 1 Test 4', 'Grade 6 Term 1 Test 4', 6, 1, 4, 10),
(55, 'Term 2 Test 1', 'Grade 6 Term 2 Test 1', 6, 2, 1, 10),
(56, 'Term 2 Test 2', 'Grade 6 Term 2 Test 2', 6, 2, 2, 10),
(57, 'Term 2 Test 3', 'Grade 6 Term 2 Test 3', 6, 2, 3, 10),
(58, 'Term 2 Test 4', 'Grade 6 Term 2 Test 4', 6, 2, 4, 10),
(59, 'Term 2 Test 5', 'Grade 6 Term 2 Test 5', 6, 2, 5, 20)
ON CONFLICT (id) DO NOTHING;


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





INSERT INTO grade_6 (username, password, nickname, student_id, title, first_name, last_name, class_name) VALUES
('Munich', '48457', 'Munich', '48457', 'Mr.', 'Eakkanin', 'Sithchaisurakool', '6/14'),
('Bright', '48458', 'Bright', '48458', 'Mr.', 'Chayodom', 'Disayawan', '6/14'),
('Don', '48461', 'Don', '48461', 'Mr.', 'Donlawat', 'Jongjitvimol', '6/14'),
('Dollar', '48483', 'Dollar', '48483', 'Mr.', 'Thanaphat', 'Khongkhunthian', '6/14'),
('Tonmai', '50438', 'Tonmai', '50438', 'Mr.', 'Thanakit', 'Maiprasert', '6/14'),
('Pupha', '50439', 'Pupha', '50439', 'Mr.', 'Pupha', 'Srisawat', '6/14'),
('Oil', '48489', 'Oil', '48489', 'Mr.', 'Nathapong', 'Chitranukroh', '6/14'),
('Gift', '48490', 'Gift', '48490', 'Mr.', 'Phatthanan', 'Maneerat', '6/14'),
('Ink', '48491', 'Ink', '48491', 'Mr.', 'Thanawat', 'Inkwan', '6/14'),
('Tongkaw', '48496', 'Tongkaw', '48496', 'Mr.', 'Sirawit', 'Tongkaw', '6/14'),
('Bam', '48498', 'Bam', '48498', 'Mr.', 'Bamrung', 'Saetang', '6/14'),
('Praew', '48500', 'Praew', '48500', 'Miss', 'Praewpan', 'Suksawat', '6/14'),
('Noodee', '48501', 'Noodee', '48501', 'Miss', 'Nuttida', 'Noodee', '6/14'),
('Sayo', '50323', 'Sayo', '50323', 'Miss', 'Sayamon', 'Thepsiri', '6/14'),
('New', '50440', 'New', '50440', 'Miss', 'Newza', 'Jaidee', '6/14'),
('Ing', '50442', 'Ing', '50442', 'Miss', 'Ingfah', 'Charoensuk', '6/14')
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



-- Insert test results for Grade 6 students using their actual usernames
-- We'll use a subquery to get the correct user_id from the users table
INSERT INTO test_results (user_id, test_id, grade_level, score, max_score, answers, submitted_at, completed)
SELECT u.id, 51, 6, 9, 10, '{"term1_test1_score": 9, "time_taken": 25}'::jsonb, '2024-06-18 14:25:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 8, 10, '{"term1_test2_score": 8, "time_taken": 30}'::jsonb, '2024-06-25 11:15:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 10, 10, '{"term1_test3_score": 10, "time_taken": 28}'::jsonb, '2024-07-02 16:40:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 7, 10, '{"term1_test4_score": 7, "time_taken": 32}'::jsonb, '2024-07-09 13:30:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 9, 10, '{"term2_test1_score": 9, "time_taken": 26}'::jsonb, '2024-08-15 09:45:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 8, 10, '{"term2_test2_score": 8, "time_taken": 29}'::jsonb, '2024-08-22 14:20:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 10, 10, '{"term2_test3_score": 10, "time_taken": 27}'::jsonb, '2024-08-29 11:10:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 9, 10, '{"term2_test4_score": 9, "time_taken": 31}'::jsonb, '2024-09-05 15:35:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 18, 20, '{"term2_test5_score": 18, "time_taken": 45}'::jsonb, '2024-09-12 10:15:00', true
FROM users u WHERE u.username = 'Munich' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 10, 10, '{"term1_test1_score": 10, "time_taken": 22}', '2024-06-18 15:30:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 9, 10, '{"term1_test2_score": 9, "time_taken": 28}', '2024-06-25 12:45:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 8, 10, '{"term1_test3_score": 8, "time_taken": 30}', '2024-07-02 17:20:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 10, 10, '{"term1_test4_score": 10, "time_taken": 25}', '2024-07-09 14:15:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 10, 10, '{"term2_test1_score": 10, "time_taken": 24}', '2024-08-15 10:30:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 9, 10, '{"term2_test2_score": 9, "time_taken": 27}', '2024-08-22 15:45:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 8, 10, '{"term2_test3_score": 8, "time_taken": 32}', '2024-08-29 12:20:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 10, 10, '{"term2_test4_score": 10, "time_taken": 26}', '2024-09-05 16:10:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 19, 20, '{"term2_test5_score": 19, "time_taken": 42}', '2024-09-12 11:25:00', true
FROM users u WHERE u.username = 'Bright' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 7, 10, '{"term1_test1_score": 7, "time_taken": 35}', '2024-06-18 16:15:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 6, 10, '{"term1_test2_score": 6, "time_taken": 38}', '2024-06-25 13:30:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 8, 10, '{"term1_test3_score": 8, "time_taken": 33}', '2024-07-02 18:45:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 7, 10, '{"term1_test4_score": 7, "time_taken": 36}', '2024-07-09 15:20:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 8, 10, '{"term2_test1_score": 8, "time_taken": 34}', '2024-08-15 11:15:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 7, 10, '{"term2_test2_score": 7, "time_taken": 37}', '2024-08-22 16:30:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 9, 10, '{"term2_test3_score": 9, "time_taken": 31}', '2024-08-29 13:45:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 8, 10, '{"term2_test4_score": 8, "time_taken": 35}', '2024-09-05 17:20:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 16, 20, '{"term2_test5_score": 16, "time_taken": 48}', '2024-09-12 12:15:00', true
FROM users u WHERE u.username = 'Don' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 9, 10, '{"term1_test1_score": 9, "time_taken": 26}', '2024-06-18 17:00:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 10, 10, '{"term1_test2_score": 10, "time_taken": 24}', '2024-06-25 14:15:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 9, 10, '{"term1_test3_score": 9, "time_taken": 28}', '2024-07-02 19:30:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 8, 10, '{"term1_test4_score": 8, "time_taken": 30}', '2024-07-09 16:45:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 9, 10, '{"term2_test1_score": 9, "time_taken": 27}', '2024-08-15 12:00:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 10, 10, '{"term2_test2_score": 10, "time_taken": 25}', '2024-08-22 17:15:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 9, 10, '{"term2_test3_score": 9, "time_taken": 29}', '2024-08-29 14:30:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 9, 10, '{"term2_test4_score": 9, "time_taken": 31}', '2024-09-05 18:45:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 17, 20, '{"term2_test5_score": 17, "time_taken": 44}', '2024-09-12 13:00:00', true
FROM users u WHERE u.username = 'Dollar' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 8, 10, '{"term1_test1_score": 8, "time_taken": 28}', '2024-06-19 10:20:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 9, 10, '{"term1_test2_score": 9, "time_taken": 25}', '2024-06-26 14:30:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 7, 10, '{"term1_test3_score": 7, "time_taken": 35}', '2024-07-03 11:45:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 9, 10, '{"term1_test4_score": 9, "time_taken": 29}', '2024-07-10 16:15:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 8, 10, '{"term2_test1_score": 8, "time_taken": 30}', '2024-08-16 09:30:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 9, 10, '{"term2_test2_score": 9, "time_taken": 26}', '2024-08-23 15:20:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 7, 10, '{"term2_test3_score": 7, "time_taken": 33}', '2024-08-30 12:40:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 8, 10, '{"term2_test4_score": 8, "time_taken": 32}', '2024-09-06 17:25:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 15, 20, '{"term2_test5_score": 15, "time_taken": 50}', '2024-09-13 13:45:00', true
FROM users u WHERE u.username = 'Tonmai' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 10, 10, '{"term1_test1_score": 10, "time_taken": 22}', '2024-06-20 13:15:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 10, 10, '{"term1_test2_score": 10, "time_taken": 24}', '2024-06-27 10:25:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 9, 10, '{"term1_test3_score": 9, "time_taken": 27}', '2024-07-04 15:50:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 10, 10, '{"term1_test4_score": 10, "time_taken": 23}', '2024-07-11 12:35:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 10, 10, '{"term2_test1_score": 10, "time_taken": 25}', '2024-08-17 11:20:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 10, 10, '{"term2_test2_score": 10, "time_taken": 24}', '2024-08-24 16:15:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 9, 10, '{"term2_test3_score": 9, "time_taken": 28}', '2024-08-31 13:30:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 10, 10, '{"term2_test4_score": 10, "time_taken": 26}', '2024-09-07 18:40:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 20, 20, '{"term2_test5_score": 20, "time_taken": 40}', '2024-09-14 14:55:00', true
FROM users u WHERE u.username = 'Pupha' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 6, 10, '{"term1_test1_score": 6, "time_taken": 40}', '2024-06-21 09:45:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 7, 10, '{"term1_test2_score": 7, "time_taken": 35}', '2024-06-28 14:20:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 6, 10, '{"term1_test3_score": 6, "time_taken": 38}', '2024-07-05 11:30:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 8, 10, '{"term1_test4_score": 8, "time_taken": 31}', '2024-07-12 17:10:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 7, 10, '{"term2_test1_score": 7, "time_taken": 36}', '2024-08-18 10:15:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 8, 10, '{"term2_test2_score": 8, "time_taken": 32}', '2024-08-25 15:45:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 6, 10, '{"term2_test3_score": 6, "time_taken": 39}', '2024-09-01 12:25:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 7, 10, '{"term2_test4_score": 7, "time_taken": 34}', '2024-09-08 18:20:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 14, 20, '{"term2_test5_score": 14, "time_taken": 55}', '2024-09-15 14:30:00', true
FROM users u WHERE u.username = 'Oil' AND u.grade_level = 6

UNION ALL

SELECT u.id, 51, 6, 9, 10, '{"term1_test1_score": 9, "time_taken": 26}', '2024-06-22 12:30:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 52, 6, 8, 10, '{"term1_test2_score": 8, "time_taken": 29}', '2024-06-29 15:40:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 53, 6, 9, 10, '{"term1_test3_score": 9, "time_taken": 28}', '2024-07-06 10:55:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 54, 6, 8, 10, '{"term1_test4_score": 8, "time_taken": 30}', '2024-07-13 16:25:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 55, 6, 9, 10, '{"term2_test1_score": 9, "time_taken": 27}', '2024-08-19 11:35:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 56, 6, 8, 10, '{"term2_test2_score": 8, "time_taken": 30}', '2024-08-26 14:50:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 57, 6, 9, 10, '{"term2_test3_score": 9, "time_taken": 28}', '2024-09-02 13:15:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 58, 6, 8, 10, '{"term2_test4_score": 8, "time_taken": 31}', '2024-09-09 17:30:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
UNION ALL
SELECT u.id, 59, 6, 16, 20, '{"term2_test5_score": 16, "time_taken": 48}', '2024-09-16 15:45:00', true
FROM users u WHERE u.username = 'Gift' AND u.grade_level = 6
ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS test_visibility (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_visibility (test_id, is_visible) VALUES

('grade1-term1-test1', false),
('grade1-term1-test2', false),
('grade1-term1-test3', false),
('grade1-term1-test4', false),

('grade1-term2-test1', false),
('grade1-term2-test2', false),
('grade1-term2-test3', false),
('grade1-term2-test4', false),
('grade1-term2-test5', false),


('grade2-term1-test1', false),
('grade2-term1-test2', false),
('grade2-term1-test3', false),
('grade2-term1-test4', false),

('grade2-term2-test1', false),
('grade2-term2-test2', false),
('grade2-term2-test3', false),
('grade2-term2-test4', false),
('grade2-term2-test5', false),


('grade3-term1-test1', false),
('grade3-term1-test2', false),
('grade3-term1-test3', false),
('grade3-term1-test4', false),

('grade3-term2-test1', false),
('grade3-term2-test2', false),
('grade3-term2-test3', false),
('grade3-term2-test4', false),
('grade3-term2-test5', false),


('grade4-term1-test1', false),
('grade4-term1-test2', false),
('grade4-term1-test3', false),
('grade4-term1-test4', false),

('grade4-term2-test1', false),
('grade4-term2-test2', false),
('grade4-term2-test3', false),
('grade4-term2-test4', false),
('grade4-term2-test5', false),


('grade5-term1-test1', false),
('grade5-term1-test2', false),
('grade5-term1-test3', false),
('grade5-term1-test4', false),

('grade5-term2-test1', false),
('grade5-term2-test2', false),
('grade5-term2-test3', false),
('grade5-term2-test4', false),
('grade5-term2-test5', false),


('grade6-term1-test1', false),
('grade6-term1-test2', false),
('grade6-term1-test3', false),
('grade6-term1-test4', false),

('grade6-term2-test1', false),
('grade6-term2-test2', false),
('grade6-term2-test3', false),
('grade6-term2-test4', false),
('grade6-term2-test5', false)
ON CONFLICT (test_id) DO NOTHING;
