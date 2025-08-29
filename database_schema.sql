
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE academic_year (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL,
    term INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);


CREATE TABLE teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE admin (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    UNIQUE(teacher_id, subject_id, grade, class)
);

CREATE TABLE multiple_choice_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    num_options INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE true_false_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE input_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL,
    test_id INTEGER NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    subject_id INTEGER REFERENCES subjects(subject_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE multiple_choice_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES multiple_choice_tests(id),
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


CREATE TABLE true_false_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES true_false_tests(id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer BOOLEAN NOT NULL
);


CREATE TABLE input_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES input_tests(id),
    question_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL
);


CREATE TABLE multiple_choice_test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);


CREATE TABLE true_false_test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);


CREATE TABLE input_test_results (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);

-- New Matching Type Test Tables
CREATE TABLE matching_type_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    test_name VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    num_blocks INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matching_type_test_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
    question_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    block_coordinates JSONB NOT NULL,
    has_arrow BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop the existing arrows table
DROP TABLE IF EXISTS matching_type_test_arrows CASCADE;

-- Create the ENHANCED arrows table with responsive coordinate system
CREATE TABLE matching_type_test_arrows (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES matching_type_test_questions(id) ON DELETE CASCADE,
    
    -- ABSOLUTE coordinates (for backward compatibility)
    start_x DECIMAL(10,4) NOT NULL,  -- Changed from INTEGER to DECIMAL for precision
    start_y DECIMAL(10,4) NOT NULL,  -- Changed from INTEGER to DECIMAL for precision
    end_x DECIMAL(10,4) NOT NULL,    -- Changed from INTEGER to DECIMAL for precision
    end_y DECIMAL(10,4) NOT NULL,    -- Changed from INTEGER to DECIMAL for precision
    
    -- RELATIVE coordinates (for responsive positioning) - NEW!
    rel_start_x DECIMAL(10,4), -- Percentage from left edge (0-100)
    rel_start_y DECIMAL(10,4), -- Percentage from top edge (0-100)
    rel_end_x DECIMAL(10,4),   -- Percentage from left edge (0-100)
    rel_end_y DECIMAL(10,4),   -- Percentage from top edge (0-100)
    
    -- IMAGE dimensions (for accurate scaling) - NEW!
    image_width INTEGER,  -- Original image width when test was created
    image_height INTEGER, -- Original image height when test was created
    
    -- Arrow styling (enhanced)
    arrow_style JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX idx_matching_type_test_arrows_question_id ON matching_type_test_arrows(question_id);

CREATE TABLE matching_type_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES matching_type_tests(id),
    test_name VARCHAR(200) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);



INSERT INTO users (grade, class, number, student_id, name, surname, nickname, password) VALUES

('M1', '1/15', 1, '51706', 'Kittikhun', 'Siriwadtanakojaroen', 'Tong Tong', '51706'),
('M1', '1/15', 2, '51707', 'Jittiphat', 'Suksamai', 'Idea', '51707'),
('M1', '1/15', 3, '51708', 'Jiraphon', 'Sawanakasem', 'Tun', '51708'),
('M1', '1/15', 4, '51709', 'Nattawat', 'Prakobpanich', 'Pupha', '51709'),
('M1', '1/15', 5, '51710', 'Thanawat', 'Pungsati', 'Sprite', '51710'),
('M1', '1/15', 6, '51711', 'Bawonchai', 'Udomkhongmangmee', 'Sea', '51711'),
('M1', '1/15', 7, '51712', 'Pichaya', 'Chansate', 'Chirew', '51712'),
('M1', '1/15', 8, '51713', 'Kamonchat', 'Amornphongmongkol', 'Rose', '51713'),
('M1', '1/15', 9, '51714', 'Chanyanuch', 'Houyhuan', 'Tonhom', '51714'),
('M1', '1/15', 10, '51715', 'Napat', 'Mongkolwatcharoen', 'Bruda', '51715'),
('M1', '1/15', 11, '51716', 'Thanyaluk', 'Ueasiyaphan', 'Luck', '51716'),
('M1', '1/15', 12, '51717', 'Nicha', 'Jailak', 'Jewelry', '51717'),
('M1', '1/15', 13, '51718', 'Neeraphan', 'Tangpaopong', 'Nee', '51718'),
('M1', '1/15', 14, '51719', 'Phonnapphan', 'Settheepokha', 'Khaning', '51719'),
('M1', '1/15', 15, '51720', 'Patsorn', 'Jenkatkan', 'Éclair', '51720'),
('M1', '1/15', 16, '51721', 'Ploypaphat', 'Kittiwittayarom', 'Baifern', '51721'),
('M1', '1/15', 17, '51722', 'Wanvisa', 'Ratsamichai', 'Tus', '51722'),
('M1', '1/15', 18, '51723', 'Wipaporn', 'Muangsan', 'Winnie', '51723'),
('M1', '1/15', 19, '51724', 'Sasiwannaporn', 'Likitbannasak', 'Mei', '51724'),
('M1', '1/15', 20, '51725', 'Sarisa', 'Bhoosudsawaeng', 'Thien', '51725'),
('M1', '1/15', 21, '51726', 'Akanit', 'Kampimabouth', 'Meili', '51726'),
('M1', '1/15', 22, '51727', 'Uracha', 'Maolee', 'Khaohom', '51727'),
('M1', '1/15', 23, '51728', 'Aticia', 'Kesornsung', 'Pangko', '51728'),
('M1', '1/16', 1, '51729', 'Kamonlaphop', 'Prasertchroenphol', 'Pukan', '51729'),
('M1', '1/16', 2, '51730', 'Jumpon', 'Onlamul', 'Yoshi', '51730'),
('M1', '1/16', 3, '51731', 'Chinnapat', 'Prabthong', 'Title', '51731'),
('M1', '1/16', 4, '51732', 'Naphat', 'Yuadyan', 'Khaopun', '51732'),
('M1', '1/16', 5, '51733', 'Thanadol', 'Rakchanachai', 'austin', '51733'),
('M1', '1/16', 6, '51734', 'Thanatbodee', 'Hongwiset', 'Inkyu', '51734'),
('M1', '1/16', 7, '51735', 'Thitiwat', 'Srisaard', 'CC', '51735'),
('M1', '1/16', 8, '51736', 'Noppakrun', 'Kruaisawat', 'Nene', '51736'),
('M1', '1/16', 9, '51737', 'Nawin', 'Pongputtipak', 'Cino', '51737'),
('M1', '1/16', 10, '51738', 'Woradej', 'Boonto', 'August', '51738'),
('M1', '1/16', 11, '51739', 'Ongsa', 'Assanee', 'Ongsa', '51739'),
('M1', '1/16', 12, '51740', 'Chanyanas', 'Surawuthinak', 'Kaimook', '51740'),
('M1', '1/16', 13, '51741', 'Napattika', 'Imyaem', 'Elfie', '51741'),
('M1', '1/16', 14, '51742', 'Natthanun', 'Kunkhomit', 'Senior', '51742'),
('M1', '1/16', 15, '51743', 'Thepteeramumin', 'Boontarmteeraputi', 'Anda', '51743'),
('M1', '1/16', 16, '51744', 'Piyakarn', 'Kittisiriphan', 'Smile', '51744'),
('M1', '1/16', 17, '51745', 'Pobporn', 'Intarasorn', 'Ploy', '51745'),
('M1', '1/16', 18, '51747', 'Pitthayapat', 'Srithanakitwetin', 'Kwan Khao', '51747'),
('M1', '1/16', 19, '51748', 'Piriyapond', 'Kittimaensuriya', 'Dream', '51748'),
('M1', '1/16', 20, '51750', 'Atiporn', 'Promduang', 'Pream', '51750'),


('M2', '2/15', 1, '51007', 'Kittikhun', 'Rungsuk', 'Captain', '51007'),
('M2', '2/15', 2, '51008', 'Kongpop', 'Samanah', 'Cartoon', '51008'),
('M2', '2/15', 3, '51009', 'Natin', 'Ngaeprom', 'Boss', '51009'),
('M2', '2/15', 4, '51010', 'Thammadej', 'Dejharn', 'Dej', '51010'),
('M2', '2/15', 5, '51011', 'Bhumipat', 'Tiranasawad', 'Zen', '51011'),
('M2', '2/15', 6, '51012', 'Yotprasu', 'Yongprayoon', 'Harit', '51012'),
('M2', '2/15', 7, '51013', 'Winson', 'Chakhong', 'Winson', '51013'),
('M2', '2/15', 8, '51014', 'Piriyakorn', 'Soontornkumphonrat', 'First', '51014'),
('M2', '2/15', 9, '51015', 'Surathat', 'Fongnaree', 'Auto', '51015'),
('M2', '2/15', 10, '51016', 'Thanadej', 'Pichairat', 'Tonplam', '51016'),
('M2', '2/15', 11, '51017', 'Nattawat', 'Boonpitsit', 'Bright', '51017'),
('M2', '2/15', 12, '51881', 'Thepteeramungkorn', 'Boomthantiraput', 'Loma', '51881'),
('M2', '2/15', 13, '51018', 'Kanyanat', 'Saksakunkailerd', 'Bua', '51018'),
('M2', '2/15', 14, '51019', 'Kakanang', 'Boonlua', 'Nana', '51019'),
('M2', '2/15', 15, '51020', 'Nattanicha', 'Ruento', 'Maprang', '51020'),
('M2', '2/15', 16, '51021', 'Danaya', 'Saiwanna', 'North', '51021'),
('M2', '2/15', 17, '51022', 'Thannatsaorn', 'Anthipkul', 'Seiya', '51022'),
('M2', '2/15', 18, '51023', 'Thanuchmon', 'Suwiratwitayakit', 'E''clair', '51023'),
('M2', '2/15', 19, '51024', 'Thunchanok', 'Klongratsakul', 'tete', '51024'),
('M2', '2/15', 20, '51025', 'Pinyaphat', 'Supboontanakorn', 'cream', '51025'),
('M2', '2/15', 21, '51026', 'Waran', 'Kanwan', 'Nobell', '51026'),
('M2', '2/15', 22, '51027', 'Sukaksorn', 'Kanjanakunti', 'Viva', '51027'),
('M2', '2/15', 23, '51028', 'Supitchaya', 'Sukjit', 'Khaohom', '51028'),
('M2', '2/15', 24, '51029', 'Siriyapon', 'Ramunu', 'Nam', '51029'),
('M2', '2/15', 25, '51030', 'Hathaytip', 'Sawangruttaya', 'Waenpetch', '51030'),
('M2', '2/16', 1, '51032', 'Konakk', 'Rojanasupakul', 'Chirew', '51032'),
('M2', '2/16', 2, '51033', 'Kishna', 'Joshi', 'Kishna', '51033'),
('M2', '2/16', 3, '51034', 'Justin', 'Damayanti Luxameesathporn', 'Justin', '51034'),
('M2', '2/16', 4, '51035', 'Jiraphat', 'Chamnoi', 'Pun', '51035'),
('M2', '2/16', 5, '51036', 'Jirayu', 'Thanawiphakon', 'Pat', '51036'),
('M2', '2/16', 6, '51037', 'Chanthawat', 'Bowonaphiwong', 'Din', '51037'),
('M2', '2/16', 7, '51038', 'Napat', 'Uthaisang', 'Shiryu', '51038'),
('M2', '2/16', 8, '51039', 'Thianrawit', 'Ammaranon', 'Singto', '51039'),
('M2', '2/16', 9, '51040', 'Narawut', 'Meechaiudomdech', 'Prince', '51040'),
('M2', '2/16', 10, '51041', 'Papangkorn', 'Teeratanatanyaboon', 'Titan', '51041'),
('M2', '2/16', 11, '51042', 'Poptam', 'Sathongkham', 'Tim', '51042'),
('M2', '2/16', 12, '51043', 'Marwin', 'Phandumrongkul', 'Mark', '51043'),
('M2', '2/16', 13, '51044', 'Suwijak', 'kijrungsophun', 'Namo', '51044'),
('M2', '2/16', 14, '51045', 'Chonlada', 'Bonthong', 'Fifa', '51045'),
('M2', '2/16', 15, '51046', 'Nathathai', 'Sapparia', 'Chertam', '51046'),
('M2', '2/16', 16, '51047', 'Nopchanok', 'Reenavong', 'Pam Pam', '51047'),
('M2', '2/16', 17, '51048', 'Parita', 'Taetee', 'Namcha', '51048'),
('M2', '2/16', 18, '51049', 'Pimpreeya', 'Paensuwam', 'Pare', '51049'),
('M2', '2/16', 19, '51050', 'Wirunchana', 'Daungwijit', 'Focus', '51050'),
('M2', '2/16', 20, '51051', 'Supisala', 'Chesadatas', 'Jang Jang', '51051'),
('M2', '2/16', 21, '51052', 'Aaraya', 'Loamorrwach', 'MiMi', '51052'),
('M2', '2/16', 22, '51053', 'Ariyan', 'Ariyan', 'Mee Mee', '51053'),
('M2', '2/16', 23, '51152', 'Ploypaphat', 'Aphichatprasert', 'Boeing', '51152'),
('M2', '2/16', 24, '51153', 'Yang Yang', 'Yang Yang', 'Yang Yang', '51153'),


('M3', '3/15', 1, '50311', 'Fan', 'Shucheng', 'Michael', '50311'),
('M3', '3/15', 2, '50312', 'Koh', 'Shirato', 'Koh', '50312'),
('M3', '3/15', 3, '50313', 'Chalanthorn', 'Somabootr', 'Plangton', '50313'),
('M3', '3/15', 4, '50314', 'Napat', 'Phomvongtip', 'Han', '50314'),
('M3', '3/15', 5, '50315', 'Natthanon', 'Aungkanaworakul', 'August', '50315'),
('M3', '3/15', 6, '50316', 'Thanatsorn', 'Wasuntranijwipa', 'Sorn', '50316'),
('M3', '3/15', 7, '50317', 'Thannathorn', 'Keaw-on', 'Oscar', '50317'),
('M3', '3/15', 8, '50318', 'Teeraphat', 'Kitsato', 'Peach', '50318'),
('M3', '3/15', 9, '50319', 'Pitpibul', 'Notayos', 'Earth', '50319'),
('M3', '3/15', 10, '50320', 'Woradet', 'Premphueam', 'Fiat', '50320'),
('M3', '3/15', 11, '50321', 'Wiritphon', 'Niyomthai', 'Foam', '50321'),
('M3', '3/15', 12, '50322', 'Vishnu', 'Joshi Changchamrat', 'Vishnu', '50322'),
('M3', '3/15', 13, '51054', 'Kannawat', 'Noosap', 'Gus', '51054'),
('M3', '3/15', 14, '51055', 'Nuttakorn', 'Klongratsakul', 'Tar', '51055'),
('M3', '3/15', 15, '51056', 'Thitipat', 'Suknantasit', 'Ken', '51056'),
('M3', '3/15', 16, '50324', 'Chanutchanan', 'Rachatamethachot', 'Fah', '50324'),
('M3', '3/15', 17, '50325', 'Natpatsorn', 'Permruangtanapol', 'Aum', '50325'),
('M3', '3/15', 18, '50326', 'Tangsima', 'Sateanpong', 'Matoom', '50326'),
('M3', '3/15', 19, '50327', 'Nirinyanut', 'Techathanwisit', 'Ing', '50327'),
('M3', '3/15', 20, '50328', 'Punyanuch', 'Taninpong', 'Bam', '50328'),
('M3', '3/15', 21, '50329', 'Phatnarin', 'Suppakijchanchai', 'Pan', '50329'),
('M3', '3/15', 22, '50330', 'Wipawat', 'Muangsan', 'Sunny', '50330'),
('M3', '3/15', 23, '50331', 'Santamon', 'Sarakun', 'Night', '50331'),
('M3', '3/15', 24, '50332', 'Annatch', 'Sithchaisurakool', 'Annatch', '50332'),
('M3', '3/16', 1, '50333', 'Zin Myint', 'Mo Lin', 'Phat', '50333'),
('M3', '3/16', 2, '50334', 'Kantapon', 'Chinudomporn', 'Kun', '50334'),
('M3', '3/16', 3, '50335', 'Krirkwit', 'Meeto', 'Num', '50335'),
('M3', '3/16', 4, '50336', 'Natakorn', 'Ritthongpitak', 'Artid', '50336'),
('M3', '3/16', 5, '50337', 'Natthanon', 'Vanichsiripatr', 'Farm', '50337'),
('M3', '3/16', 6, '50339', 'Tanaphop', 'Bumrungrak', 'Zen', '50339'),
('M3', '3/16', 7, '50340', 'Teerat', 'Waratpaweetorn', 'Tarhai', '50340'),
('M3', '3/16', 8, '50341', 'Prart', 'Sirinarm', 'Skibidi', '50341'),
('M3', '3/16', 9, '50342', 'Peethong', 'Saenkhomor', 'Prom', '50342'),
('M3', '3/16', 10, '50343', 'Poom', 'Thongpaen', 'Poom', '50343'),
('M3', '3/16', 11, '50344', 'Phumphat', 'Lertwannaporn', 'Phumphat', '50344'),
('M3', '3/16', 12, '50345', 'Worakit', 'Krajangsri', 'Kit', '50345'),
('M3', '3/16', 13, '50346', 'Sukrit', 'Dechphol', 'Franc', '50346'),
('M3', '3/16', 14, '50347', 'Chachalee', 'Boonchuachan', 'Tripple', '50347'),
('M3', '3/16', 15, '50348', 'Yanisa', 'Raweepipat', 'Jiffy', '50348'),
('M3', '3/16', 16, '50349', 'Titapha', 'Yuthanom', 'Ingrak', '50349'),
('M3', '3/16', 17, '50350', 'Nutchanun', 'Suwannahong', 'Aunpan', '50350'),
('M3', '3/16', 18, '50351', 'Thanunchanok', 'Songrum', 'Ozon', '50351'),
('M3', '3/16', 19, '50352', 'Pakijra', 'Panjach', 'Cake', '50352'),
('M3', '3/16', 20, '50353', 'Phinyaphat', 'Chatthanawan', 'Tonaor', '50353'),
('M3', '3/16', 21, '50354', 'Supichaya', 'Suppasing', 'Hana', '50354'),


('M4', '4/13', 1, '49751', 'Sirawit', 'Antipkul', 'Data', '49751'),
('M4', '4/13', 2, '49761', 'Koedpol', 'Angsuwiroon', 'Ti', '49761'),
('M4', '4/13', 3, '49764', 'Nuttanapat', 'Lohakitsongkram', 'Yok', '49764'),
('M4', '4/13', 4, '49766', 'Mattcha', 'Sirirojwong', 'Gato', '49766'),
('M4', '4/13', 5, '51862', 'Nonprawit', 'Kampusa', 'Non', '51862'),
('M4', '4/13', 6, '49753', 'Channuntorn', 'Ringrod', 'Praew', '49753'),
('M4', '4/13', 7, '49758', 'Pansa', 'Hamontri', 'Aim', '49758'),
('M4', '4/13', 8, '49759', 'Phatsalliya', 'Pakkama', 'Zen', '49759'),
('M4', '4/13', 9, '49768', 'Kodchakon', 'Bookkaluck', 'Mint', '49768'),
('M4', '4/13', 10, '49769', 'Jindaporn', 'Tikpmporn', 'Plai', '49769'),
('M4', '4/13', 11, '49772', 'Papapinn', 'Thitirotjanawat', 'Ling Ling', '49772'),
('M4', '4/13', 12, '51863', 'Natthakan', 'Panitchareon', 'Amy', '51863'),
('M4', '4/14', 1, '49767', 'Sirasit', 'Panyasit', 'Tack', '49767'),
('M4', '4/14', 2, '51864', 'Mr Peerapat', 'Suktapot', 'Cfo', '51864'),
('M4', '4/14', 3, '51865', 'Wongsathorn', 'Rod-aree', 'Gui', '51865'),
('M4', '4/14', 4, '51866', 'Suwisith', 'Tempraserteudee', 'Tonkla', '51866'),
('M4', '4/14', 5, '49754', 'Chutikan', 'Pornvasin', 'Bebe', '49754'),
('M4', '4/14', 6, '49773', 'Praewan', 'Taecha-in', 'Prae', '49773'),
('M4', '4/14', 7, '51867', 'Chinapa', 'Chanumklang', 'Tar', '51867'),
('M4', '4/14', 8, '51868', 'Larita', 'Larpverachai', 'Ching Sin', '51868'),


('M5', '5/13', 1, '49003', 'Jaroenjit', 'Anatamsombat', 'Tek', '49003'),
('M5', '5/13', 2, '49089', 'Chayaphon', 'Kanchitavorakul', 'Nampai', '49089'),
('M5', '5/13', 3, '49092', 'Thananaj', 'Sawanakasem', 'Leng', '49092'),
('M5', '5/13', 4, '49094', 'Rawipat', 'Pibalsing', 'Ryu', '49094'),
('M5', '5/13', 5, '49095', 'Sitthas', 'Tiwatodsaporn', 'Muchty', '49095'),
('M5', '5/13', 6, '49103', 'Goonpisit', 'Chaipayom', 'Jeng', '49103'),
('M5', '5/13', 7, '49105', 'Napat', 'Janngam', 'Prite', '49105'),
('M5', '5/13', 8, '51139', 'Chayagone', 'Limwongsakul', 'Int', '51139'),
('M5', '5/13', 9, '51140', 'Noppadol', 'Suaykhakhao', 'Mark', '51140'),
('M5', '5/13', 10, '51141', 'Narapat', 'Teeratanatanyboon', 'Teego', '51141'),
('M5', '5/13', 11, '51142', 'Arnon', 'Danfmukda', 'Gun', '51142'),
('M5', '5/13', 12, '51154', 'A Zin', 'Lin Myat', 'An An', '51154'),
('M5', '5/13', 13, '48473', 'Pimpattra', 'Archanukulrat', 'Mind', '48473'),
('M5', '5/13', 14, '49110', 'Panicha', 'Sirachatpatiphan', 'Pluemjai', '49110'),
('M5', '5/13', 15, '49116', 'Supasuta', 'Chesadatas', 'Jeenjeen', '49116'),
('M5', '5/13', 16, '51143', 'Pichnaree', 'Pungsiricharoen', 'Junoir', '51143'),
('M5', '5/14', 1, '49090', 'Mr. Nathapong', 'Meesuk', 'Leezan', '49090'),
('M5', '5/14', 2, '49093', 'Mr. Papangkorn', 'Yingohonphatsorn', 'Pengkuang', '49093'),
('M5', '5/14', 3, '49104', 'Phophtam', 'Swangsang', 'Dod', '49104'),
('M5', '5/14', 4, '49109', 'Mr. Sorrasit', 'Viravendej', 'Soba', '49109'),
('M5', '5/14', 5, '49039', 'Phitchaya', 'Kaikeaw', 'Khao', '49039'),
('M5', '5/14', 6, '49096', 'Nichapath', 'Chunlawithet', 'Acare', '49096'),
('M5', '5/14', 7, '51145', 'Sojung', 'Lim', 'Mirin', '51145'),
('M5', '5/14', 8, '51146', 'Nannapat', 'Kotchasarn', 'Lyn', '51146'),
('M5', '5/14', 9, '51147', 'Rarunphat', 'Nantaraweewat', 'Kaopoad', '51147'),
('M5', '5/14', 10, '51161', 'Sarareewan', 'Reenawong', 'Pear', '51161'),


('M6', '6/13', 1, '48407', 'Pongkrit', 'Suksomkit', 'Blank', '48407'),
('M6', '6/13', 2, '48462', 'Peerawit', 'Sirithongkaset', 'Blank', '48462'),
('M6', '6/13', 3, '48463', 'Phubadin', 'Pokkasub', 'Blank', '48463'),
('M6', '6/13', 4, '48464', 'Raiwin', 'Waratpraveethorn', 'Blank', '48464'),
('M6', '6/13', 5, '48481', 'Jirayu', 'Boonpaisandilok', 'Blank', '48481'),
('M6', '6/13', 6, '48482', 'Nattaphat', 'Kiatwisarlchai', 'Blank', '48482'),
('M6', '6/13', 7, '48484', 'Thanawit', 'Wongpiphun', 'Blank', '48484'),
('M6', '6/13', 8, '48485', 'Thatchapon', 'Plallek', 'Blank', '48485'),
('M6', '6/13', 9, '48488', 'Phumiphat', 'Chankamchon', 'Blank', '48488'),
('M6', '6/13', 10, '50435', 'Thanpisit', 'Chongwilaikasem', 'Blank', '50435'),
('M6', '6/13', 11, '48465', 'Karnpitcha', 'Jamchuntra', 'Blank', '48465'),
('M6', '6/13', 12, '48466', 'Karnsiree', 'Rungsansert', 'Blank', '48466'),
('M6', '6/13', 13, '48467', 'Grace', 'Tingsomchaisilp', 'Blank', '48467'),
('M6', '6/13', 14, '48469', 'Nichawan', 'Nithithongsakul', 'Blank', '48469'),
('M6', '6/13', 15, '48475', 'Sirikanya', 'Padkaew', 'Blank', '48475'),
('M6', '6/13', 16, '48492', 'Yadapat', 'Phupayakhutpong', 'Blank', '48492'),
('M6', '6/13', 17, '48497', 'Franchesca Sophia', 'Andrada', 'Blank', '48497'),
('M6', '6/13', 18, '48460', 'Natawan', 'Charnnarongkul', 'Blank', '48460'),
('M6', '6/14', 1, '48457', 'Eakkanin', 'Sithchaisurakool', 'Munich', '48457'),
('M6', '6/14', 2, '48458', 'Chayodom', 'Disayawan', 'Bright', '48458'),
('M6', '6/14', 3, '48461', 'Thannadon', 'Chimree', 'Don', '48461'),
('M6', '6/14', 4, '48483', 'Dollar', 'Pemredang', 'Dollar', '48483'),
('M6', '6/14', 5, '50438', 'Korrakod', 'Bookkaluck', 'Tonmai', '50438'),
('M6', '6/14', 6, '50439', 'Teeradech', 'Pattamasopa', 'Pupha', '50439'),
('M6', '6/14', 7, '48489', 'Kodchakorn', 'Chongkwanyuen', 'Oil', '48489'),
('M6', '6/14', 8, '48490', 'Janapat', 'Khamsanthia', 'Gift', '48490'),
('M6', '6/14', 9, '48491', 'Thanyamas', 'Eamwarakul', 'Ink', '48491'),
('M6', '6/14', 10, '48496', 'Pornnatcha', 'Neramit', 'Tongkaw', '48496'),
('M6', '6/14', 11, '48498', 'Peerada', 'Chubunjong', 'Bam', '48498'),
('M6', '6/14', 12, '48500', 'Wilasinee', 'Thonglue', 'Praew', '48500'),
('M6', '6/14', 13, '48501', 'Suphattiya', 'Wungkeangtham', 'Noodee', '48501'),
('M6', '6/14', 14, '50323', 'Yang', 'Qixuan', 'Sayo', '50323'),
('M6', '6/14', 15, '50440', 'Kunpriya', 'Butnamrak', 'New', '50440'),
('M6', '6/14', 16, '50442', 'Arada', 'Wang', 'Ing', '50442');


INSERT INTO academic_year (academic_year, semester, term, start_date, end_date) VALUES
('2025-2026', 1, 1, '2025-05-01', '2025-07-15'),
('2025-2026', 1, 2, '2025-07-16', '2025-09-12'),
('2025-2026', 2, 1, '2025-10-01', '2026-01-10'),
('2025-2026', 2, 2, '2026-01-11', '2026-04-30'),
('2026-2027', 1, 1, '2026-05-01', '2026-07-15'),
('2026-2027', 1, 2, '2026-07-16', '2026-09-12'),
('2026-2027', 2, 1, '2026-10-01', '2027-01-10'),
('2026-2027', 2, 2, '2027-01-11', '2027-04-30');


INSERT INTO teachers (teacher_id, username, password) VALUES
('Aleksandr_Petrov', 'Alex', '465'),
('Charlie_Viernes', 'Charlie', '465');


INSERT INTO admin (username, password) VALUES
('admin', 'maxpower');


INSERT INTO subjects (subject) VALUES
('Listening and Speaking'),
('English for career'),
('Tourism'),
('Reading and Writing'),
('Geography'),
('Grammar'),
('Health'),
('Science'),
('Biology');


CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_grade_class ON users(grade, class);
CREATE INDEX idx_test_results_student_id ON multiple_choice_test_results(student_id);
CREATE INDEX idx_test_results_student_id ON true_false_test_results(student_id);
CREATE INDEX idx_test_results_student_id ON input_test_results(student_id);
CREATE INDEX idx_test_results_academic_period ON multiple_choice_test_results(academic_period_id);
CREATE INDEX idx_test_results_academic_period ON true_false_test_results(academic_period_id);
CREATE INDEX idx_test_results_academic_period ON input_test_results(academic_period_id);

-- Indexes for matching type test tables
CREATE INDEX idx_matching_tests_teacher_id ON matching_type_tests(teacher_id);
CREATE INDEX idx_matching_questions_test_id ON matching_type_test_questions(test_id);
CREATE INDEX idx_matching_arrows_question_id ON matching_type_test_arrows(question_id);
CREATE INDEX idx_matching_results_student_id ON matching_type_test_results(student_id);
CREATE INDEX idx_matching_results_academic_period ON matching_type_test_results(academic_period_id);


ALTER TABLE multiple_choice_test_results 
ADD COLUMN test_id INTEGER REFERENCES multiple_choice_tests(id);


ALTER TABLE true_false_test_results 
ADD COLUMN test_id INTEGER REFERENCES true_false_tests(id);


ALTER TABLE input_test_results 
ADD COLUMN test_id INTEGER REFERENCES input_tests(id);

ALTER TABLE test_assignments 
ADD COLUMN subject_id INTEGER REFERENCES subjects(subject_id);

-- Add password column to users table and populate with student_id values
ALTER TABLE users ADD COLUMN password VARCHAR(100) NOT NULL DEFAULT '';
UPDATE users SET password = student_id WHERE password = '';
ALTER TABLE users ALTER COLUMN password DROP DEFAULT;