DROP TABLE IF EXISTS test_visibility CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS test_assignments CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS terms CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS grade_1 CASCADE;
DROP TABLE IF EXISTS grade_2 CASCADE;
DROP TABLE IF EXISTS grade_3 CASCADE;
DROP TABLE IF EXISTS grade_4 CASCADE;
DROP TABLE IF EXISTS grade_5 CASCADE;
DROP TABLE IF EXISTS grade_6 CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE users (
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
    number INTEGER,
    submitted BOOLEAN DEFAULT FALSE,
    answers JSONB,
    score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terms (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    term_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    grade_level INTEGER NOT NULL,
    term INTEGER NOT NULL,
    test_number INTEGER NOT NULL,
    test_type VARCHAR(50) DEFAULT 'vocabulary',
    test_url VARCHAR(500),
    max_score INTEGER NOT NULL DEFAULT 10,
    duration_minutes INTEGER DEFAULT 30,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade_level, term, test_number)
);

CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, test_id)
);

CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, test_id)
);

CREATE TABLE test_visibility (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) UNIQUE NOT NULL,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Tong Tong', '51706', 'Tong Tong', '51706', 'Mr.', 'Kittikhun', 'Siriwadtanakojaroen', 1, '1/15', 1),
('Idea', '51707', 'Idea', '51707', 'Mr.', 'Jittiphat', 'Suksamai', 1, '1/15', 2),
('Tun', '51708', 'Tun', '51708', 'Mr.', 'Jiraphon', 'Sawanakasem', 1, '1/15', 3),
('Pupha_51709', '51709', 'Pupha', '51709', 'Mr.', 'Nattawat', 'Prakobpanich', 1, '1/15', 4),
('Sprite', '51710', 'Sprite', '51710', 'Mr.', 'Thanawat', 'Pungsati', 1, '1/15', 5),
('Sea', '51711', 'Sea', '51711', 'Mr.', 'Bawonchai', 'Udomkhongmangmee', 1, '1/15', 6),
('Chirew_51712', '51712', 'Chirew', '51712', 'Mr.', 'Pichaya', 'Chansate', 1, '1/15', 7),
('Rose', '51713', 'Rose', '51713', 'Miss', 'Kamonchat', 'Amornphongmongkol', 1, '1/15', 8),
('Tonhom', '51714', 'Tonhom', '51714', 'Miss', 'Chanyanuch', 'Houyhuan', 1, '1/15', 9),
('Bruda', '51715', 'Bruda', '51715', 'Miss', 'Napat', 'Mongkolwatcharoen', 1, '1/15', 10),
('Luck', '51716', 'Luck', '51716', 'Miss', 'Thanyaluk', 'Ueasiyaphan', 1, '1/15', 11),
('Jewelry', '51717', 'Jewelry', '51717', 'Miss', 'Nicha', 'Jailak', 1, '1/15', 12),
('Nee', '51718', 'Nee', '51718', 'Miss', 'Neeraphan', 'Tangpaopong', 1, '1/15', 13),
('Khaning', '51719', 'Khaning', '51719', 'Miss', 'Phonnapphan', 'Settheepokha', 1, '1/15', 14),
('Éclair', '51720', 'Éclair', '51720', 'Miss', 'Patsorn', 'Jenkatkan', 1, '1/15', 15),
('Baifern', '51721', 'Baifern', '51721', 'Miss', 'Ploypaphat', 'Kittiwittayarom', 1, '1/15', 16),
('Tus', '51722', 'Tus', '51722', 'Miss', 'Wanvisa', 'Ratsamichai', 1, '1/15', 17),
('Winnie', '51723', 'Winnie', '51723', 'Miss', 'Wipaporn', 'Muangsane', 1, '1/15', 18),
('Mei', '51724', 'Mei', '51724', 'Miss', 'Sasiwannaporn', 'Likitbannasak', 1, '1/15', 19),
('Thien', '51725', 'Thien', '51725', 'Miss', 'Sarisa', 'Bhoosudsawaeng', 1, '1/15', 20),
('Meili', '51726', 'Meili', '51726', 'Miss', 'Akanit', 'Kampimabouth', 1, '1/15', 21),
('Khaohom_51727', '51727', 'Khaohom', '51727', 'Miss', 'Uracha', 'Maolee', 1, '1/15', 22),
('Pangko', '51728', 'Pangko', '51728', 'Miss', 'Aticia', 'Kesornsung', 1, '1/15', 23),
('Pukan', '51729', 'Pukan', '51729', 'Mr.', 'Kamonlaphop', 'Prasertchroenphol', 1, '1/16', 1),
('Yoshi', '51730', 'Yoshi', '51730', 'Mr.', 'Jumpon', 'Onlamul', 1, '1/16', 2),
('Title', '51731', 'Title', '51731', 'Mr.', 'Chinnapat', 'Prabthong', 1, '1/16', 3),
('Khaopun', '51732', 'Khaopun', '51732', 'Mr.', 'Naphat', 'Yuadyan', 1, '1/16', 4),
('Austin', '51733', 'Austin', '51733', 'Mr.', 'Thanadol', 'Rakchanachai', 1, '1/16', 5),
('Inkyu', '51734', 'Inkyu', '51734', 'Mr.', 'Thanatbodee', 'Hongwiset', 1, '1/16', 6),
('CC', '51735', 'CC', '51735', 'Mr.', 'Thitiwat', 'Srisaard', 1, '1/16', 7),
('Nene', '51736', 'Nene', '51736', 'Mr.', 'Noppakrun', 'Kruaisawat', 1, '1/16', 8),
('Cino', '51737', 'Cino', '51737', 'Mr.', 'Nawin', 'Pongputtipak', 1, '1/16', 9),
('August_51738', '51738', 'August', '51738', 'Mr.', 'Woradej', 'Boonto', 1, '1/16', 10),
('Ongsa', '51739', 'Ongsa', '51739', 'Mr.', 'Ongsa', 'Assanee', 1, '1/16', 11),
('Kaimook', '51740', 'Kaimook', '51740', 'Miss', 'Chanyanas', 'Surawuthinak', 1, '1/16', 12),
('Elfie', '51741', 'Elfie', '51741', 'Miss', 'Napattika', 'Imyaem', 1, '1/16', 13),
('Senior', '51742', 'Senior', '51742', 'Miss', 'Natthanun', 'Kunkhomit', 1, '1/16', 14),
('Anda', '51743', 'Anda', '51743', 'Miss', 'Thepteeramumin', 'Boontarmteeraputi', 1, '1/16', 15),
('Smile', '51744', 'Smile', '51744', 'Miss', 'Piyakarn', 'Kittisiriphan', 1, '1/15', 16),
('Ploy', '51745', 'Ploy', '51745', 'Miss', 'Pobporn', 'Intarasorn', 1, '1/15', 17),
('Kwan Khao', '51747', 'Kwan Khao', '51747', 'Miss', 'Pitthayapat', 'Srithanakitwetin', 1, '1/16', 18),
('Dream', '51748', 'Dream', '51748', 'Miss', 'Piriyapond', 'Kittimaensuriya', 1, '1/16', 19),
('Pream', '51750', 'Pream', '51750', 'Miss', 'Atiporn', 'Promduang', 1, '1/16', 20);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Captain', '51007', 'Captain', '51007', 'Mr.', 'Kittikhun', 'Rungsuk', 2, '2/15', 1),
('Cartoon', '51008', 'Cartoon', '51008', 'Mr.', 'Kongpop', 'Samanah', 2, '2/15', 2),
('Boss', '51009', 'Boss', '51009', 'Mr.', 'Natin', 'Ngaeprom', 2, '2/15', 3),
('Dej', '51010', 'Dej', '51010', 'Mr.', 'Thammadej', 'Dejharn', 2, '2/15', 4),
('Zen_51011', '51011', 'Zen', '51011', 'Mr.', 'Bhumipat', 'Tiranasawad', 2, '2/15', 5),
('Harit', '51012', 'Harit', '51012', 'Mr.', 'Yotprasu', 'Yongprayoon', 2, '2/15', 6),
('Winson', '51013', 'Winson', '51013', 'Mr.', 'Winson', 'Chakhong', 2, '2/15', 7),
('First', '51014', 'First', '51014', 'Mr.', 'Piriyakorn', 'Soontornkumphonrat', 2, '2/15', 8),
('Auto', '51015', 'Auto', '51015', 'Mr.', 'Surathat', 'Fongnaree', 2, '2/15', 9),
('Tonplam', '51016', 'Tonplam', '51016', 'Mr.', 'Thanadej', 'Pichairat', 2, '2/15', 10),
('Bright_51017', '51017', 'Bright', '51017', 'Mr.', 'Nattawat', 'Boonpitsit', 2, '2/15', 11),
('Loma', '51881', 'Loma', '51881', 'Mr.', 'Thepteeramungkorn', 'Boomthantiraput', 2, '2/15', 12),
('Bua', '51018', 'Bua', '51018', 'Miss', 'Kanyanat', 'Saksakunkailerd', 2, '2/15', 13),
('Nana', '51019', 'Nana', '51019', 'Miss', 'Kakanang', 'Boonlua', 2, '2/15', 14),
('Maprang', '51020', 'Maprang', '51020', 'Miss', 'Nattanicha', 'Ruento', 2, '2/15', 15),
('North', '51021', 'North', '51021', 'Miss', 'Danaya', 'Saiwanna', 2, '2/15', 16),
('Seiya', '51022', 'Seiya', '51022', 'Miss', 'Thannatsaorn', 'Anthipkul', 2, '2/15', 17),
('Eclair', '51023', 'Eclair', '51023', 'Miss', 'Thanuchmon', 'Suwiratwitayakit', 2, '2/15', 18),
('tete', '51024', 'tete', '51024', 'Miss', 'Thunchanok', 'Klongratsakul', 2, '2/15', 19),
('cream', '51025', 'cream', '51025', 'Miss', 'Pinyaphat', 'Supboontanakorn', 2, '2/15', 20),
('Nobell', '51026', 'Nobell', '51026', 'Miss', 'Waran', 'Kanwan', 2, '2/15', 21),
('Viva', '51027', 'Viva', '51027', 'Miss', 'Sukaksorn', 'Kanjanakunti', 2, '2/15', 22),
('Khaohom_51028', '51028', 'Khaohom', '51028', 'Miss', 'Supitchaya', 'Sukjit', 2, '2/15', 23),
('Nam', '51029', 'Nam', '51029', 'Miss', 'Siriyapon', 'Ramunu', 2, '2/15', 24),
('Waenpetch', '51030', 'Waenpetch', '51030', 'Miss', 'Hathaytip', 'Sawangruttaya', 2, '2/15', 25),
('Chirew_51032', '51032', 'Chirew', '51032', 'Mr.', 'Konakk', 'Rojanasupakul', 2, '2/16', 1),
('Kishna', '51033', 'Kishna', '51033', 'Mr.', 'Kishna', 'Joshi', 2, '2/16', 2),
('Justin', '51034', 'Justin', '51034', 'Mr.', 'Justin', 'Damayanti Luxameesathporn', 2, '2/16', 3),
('Pun', '51035', 'Pun', '51035', 'Mr.', 'Jiraphat', 'Chamnoi', 2, '2/16', 4),
('Pat', '51036', 'Pat', '51036', 'Mr.', 'Jirayu', 'Thanawiphakon', 2, '2/16', 5),
('Din', '51037', 'Din', '51037', 'Mr.', 'Chanthawat', 'Bowonaphiwong', 2, '2/16', 6),
('Shiryu', '51038', 'Shiryu', '51038', 'Mr.', 'Napat', 'Uthaisang', 2, '2/16', 7),
('Singto', '51039', 'Singto', '51039', 'Mr.', 'Thianrawit', 'Ammaranon', 2, '2/16', 8),
('Prince', '51040', 'Prince', '51040', 'Mr.', 'Narawut', 'Meechaiudomdech', 2, '2/16', 9),
('Titan', '51041', 'Titan', '51041', 'Mr.', 'Papangkorn', 'Teeratanatanyaboon', 2, '2/16', 10),
('Tim', '51042', 'Tim', '51042', 'Mr.', 'Poptam', 'Sathongkham', 2, '2/16', 11),
('Mark', '51043', 'Mark', '51043', 'Mr.', 'Marwin', 'Phandumrongkul', 2, '2/16', 12),
('Namo', '51044', 'Namo', '51044', 'Mr.', 'Suwijak', 'kijrungsophun', 2, '2/16', 13),
('Fifa', '51045', 'Fifa', '51045', 'Miss', 'Chonlada', 'Bonthong', 2, '2/16', 14),
('Chertam', '51046', 'Chertam', '51046', 'Miss', 'Nathathai', 'Sapparia', 2, '2/16', 15),
('Pam Pam', '51047', 'Pam Pam', '51047', 'Miss', 'Nopchanok', 'Reenavong', 2, '2/16', 16),
('Namcha', '51048', 'Namcha', '51048', 'Miss', 'Parita', 'Taetee', 2, '2/16', 17),
('Pare', '51049', 'Pare', '51049', 'Miss', 'Pimpreeya', 'Paensuwam', 2, '2/16', 18),
('Focus', '51050', 'Focus', '51050', 'Miss', 'Wirunchana', 'Daungwijit', 2, '2/16', 19),
('Jang Jang', '51051', 'Jang Jang', '51051', 'Miss', 'Supisala', 'Chesadatas', 2, '2/16', 20),
('MiMi', '51052', 'MiMi', '51052', 'Miss', 'Aaraya', 'Loamorrwach', 2, '2/16', 21),
('Mee Mee', '51053', 'Mee Mee', '51053', 'Miss', 'Ariyan', '', 2, '2/16', 22),
('Boeing', '51152', 'Boeing', '51152', 'Miss', 'Ploypaphat', 'Aphichatprasert', 2, '2/16', 23),
('Yang Yang', '51153', 'Yang Yang', '51153', 'Miss', 'Yang Yang', '', 2, '2/16', 24);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Michael', '50311', 'Michael', '50311', 'Mr.', 'Fan', 'Shucheng', 3, '3/15', 1),
('Koh', '50312', 'Koh', '50312', 'Mr.', 'Koh', 'Shirato', 3, '3/15', 2),
('Plangton', '50313', 'Plangton', '50313', 'Mr.', 'Chalanthorn', 'Somabootr', 3, '3/15', 3),
('Han', '50314', 'Han', '50314', 'Mr.', 'Napat', 'Phomvongtip', 3, '3/15', 4),
('August_50315', '50315', 'August', '50315', 'Mr.', 'Natthanon', 'Aungkanaworakul', 3, '3/15', 5),
('Sorn', '50316', 'Sorn', '50316', 'Mr.', 'Thanatsorn', 'Wasuntranijwipa', 3, '3/15', 6),
('Oscar', '50317', 'Oscar', '50317', 'Mr.', 'Thannathorn', 'Keaw-on', 3, '3/15', 7),
('Peach', '50318', 'Peach', '50318', 'Mr.', 'Teeraphat', 'Kitsato', 3, '3/15', 8),
('Earth', '50319', 'Earth', '50319', 'Mr.', 'Pitpibul', 'Notayos', 3, '3/15', 9),
('Fiat', '50320', 'Fiat', '50320', 'Mr.', 'Woradet', 'Premphueam', 3, '3/15', 10),
('Foam', '50321', 'Foam', '50321', 'Mr.', 'Wiritphon', 'Niyomthai', 3, '3/15', 11),
('Vishnu', '50322', 'Vishnu', '50322', 'Mr.', 'Vishnu', 'Joshi Changchamrat', 3, '3/15', 12),
('Gus', '51054', 'Gus', '51054', 'Mr.', 'Kannawat', 'Noosap', 3, '3/15', 13),
('Tar', '51055', 'Tar', '51055', 'Mr.', 'Nuttakorn', 'Klongratsakul', 3, '3/15', 14),
('Ken', '51056', 'Ken', '51056', 'Mr.', 'Thitipat', 'Suknantasit', 3, '3/15', 15),
('Fah', '50324', 'Fah', '50324', 'Miss', 'Chanutchanan', 'Rachatamethachot', 3, '3/15', 16),
('Aum', '50325', 'Aum', '50325', 'Miss', 'Natpatsorn', 'Permruangtanapol', 3, '3/15', 17),
('Matoom', '50326', 'Matoom', '50326', 'Miss', 'Tangsima', 'Sateanpong', 3, '3/15', 18),
('Ing_50327', '50327', 'Ing', '50327', 'Miss', 'Nirinyanut', 'Techathanwisit', 3, '3/15', 19),
('Bam_50328', '50328', 'Bam', '50328', 'Miss', 'Punyanuch', 'Taninpong', 3, '3/15', 20),
('Pan', '50329', 'Pan', '50329', 'Miss', 'Phatnarin', 'Suppakijchanchai', 3, '3/15', 21),
('Sunny', '50330', 'Sunny', '50330', 'Miss', 'Wipawat', 'Muangsan', 3, '3/15', 22),
('Night', '50331', 'Night', '50331', 'Miss', 'Santamon', 'Sarakun', 3, '3/15', 23),
('Annatch', '50332', 'Annatch', '50332', 'Miss', 'Annatch', 'Sithchaisurakool', 3, '3/15', 24),
('Phat', '50333', 'Phat', '50333', 'Mr.', 'Zin Myint', 'Mo Lin', 3, '3/16', 1),
('Kun', '50334', 'Kun', '50334', 'Mr.', 'Kantapon', 'Chinudomporn', 3, '3/16', 2),
('Num', '50335', 'Num', '50335', 'Mr.', 'Krirkwit', 'Meeto', 3, '3/16', 3),
('Artid', '50336', 'Artid', '50336', 'Mr.', 'Natakorn', 'Ritthongpitak', 3, '3/16', 4),
('Farm', '50337', 'Farm', '50337', 'Mr.', 'Natthanon', 'Vanichsiripatr', 3, '3/16', 5),
('Zen_50339', '50339', 'Zen', '50339', 'Mr.', 'Tanaphop', 'Bumrungrak', 3, '3/16', 6),
('Tarhai', '50340', 'Tarhai', '50340', 'Mr.', 'Teerat', 'Waratpaweetorn', 3, '3/16', 7),
('Skibidi', '50341', 'Skibidi', '50341', 'Mr.', 'Prart', 'Sirinarm', 3, '3/16', 8),
('Prom', '50342', 'Prom', '50342', 'Mr.', 'Peethong', 'Saenkhomor', 3, '3/16', 9),
('Poom', '50343', 'Poom', '50343', 'Mr.', 'Poom', 'Thongpaen', 3, '3/16', 10),
('Phumphat', '50344', 'Phumphat', '50344', 'Mr.', 'Phumphat', 'Lertwannaporn', 3, '3/16', 11),
('Kit', '50345', 'Kit', '50345', 'Mr.', 'Worakit', 'Krajangsri', 3, '3/16', 12),
('Franc', '50346', 'Franc', '50346', 'Mr.', 'Sukrit', 'Dechphol', 3, '3/16', 13),
('Tripple', '50347', 'Tripple', '50347', 'Miss', 'Chachalee', 'Boonchuachan', 3, '3/16', 14),
('Jiffy', '50348', 'Jiffy', '50348', 'Miss', 'Yanisa', 'Raweepipat', 3, '3/16', 15),
('Ingrak', '50349', 'Ingrak', '50349', 'Miss', 'Titapha', 'Yuthanom', 3, '3/16', 16),
('Aunpan', '50350', 'Aunpan', '50350', 'Miss', 'Nutchanun', 'Suwannahong', 3, '3/16', 17),
('Ozon', '50351', 'Ozon', '50351', 'Miss', 'Thanunchanok', 'Songrum', 3, '3/16', 18),
('Cake', '50352', 'Cake', '50352', 'Miss', 'Pakijra', 'Panjach', 3, '3/16', 19),
('Tonaor', '50353', 'Tonaor', '50353', 'Miss', 'Phinyaphat', 'Chatthanawan', 3, '3/16', 20),
('Hana', '50354', 'Hana', '50354', 'Miss', 'Supichaya', 'Suppasing', 3, '3/16', 21);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Tack', '49767', 'Tack', '49767', 'Mr.', 'Sirasit', 'Panyasit', 4, '4/14', 1),
('Cfo', '51864', 'Cfo', '51864', 'Mr.', 'Peerapat', 'Suktapot', 4, '4/14', 2),
('Gui', '51865', 'Gui', '51865', 'Mr.', 'Wongsathorn', 'Rod-aree', 4, '4/14', 3),
('Tonkla', '51866', 'Tonkla', '51866', 'Mr.', 'Suwisith', 'Tempraserteudee', 4, '4/14', 4),
('Bebe', '49754', 'Bebe', '49754', 'Miss', 'Chutikan', 'Pornvasin', 4, '4/14', 5),
('Prae', '49773', 'Prae', '49773', 'Miss', 'Praewan', 'Taecha-in', 4, '4/14', 6),
('Tar', '51867', 'Tar', '51867', 'Miss', 'Chinapa', 'Chanumklang', 4, '4/14', 7),
('Ching Sin', '51868', 'Ching Sin', '51868', 'Miss', 'Larita', 'Larpverachai', 4, '4/14', 8);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Leezan', '49090', 'Leezan', '49090', 'Mr.', 'Nathapong', 'Meesuk', 5, '5/14', 1),
('Pengkuang', '49093', 'Pengkuang', '49093', 'Mr.', 'Papangkorn', 'Yingohonphatsorn', 5, '5/14', 2),
('Dod', '49104', 'Dod', '49104', 'Mr.', 'Phophtam', 'Swangsang', 5, '5/14', 3),
('Soba', '49109', 'Soba', '49109', 'Mr.', 'Sorrasit', 'Viravendej', 5, '5/14', 4),
('Khao', '49039', 'Khao', '49039', 'Miss', 'Phitchaya', 'Kaikeaw', 5, '5/14', 5),
('Acare', '49096', 'Acare', '49096', 'Miss', 'Nichapath', 'Chunlawithet', 5, '5/14', 6),
('Mirin', '51145', 'Mirin', '51145', 'Miss', 'Sojung', 'Lim', 5, '5/14', 7),
('Lyn', '51146', 'Lyn', '51146', 'Miss', 'Nannapat', 'Kotchasarn', 5, '5/14', 8),
('Kaopoad', '51147', 'Kaopoad', '51147', 'Miss', 'Rarunphat', 'Nantaraweewat', 5, '5/14', 9),
('Pear', '51161', 'Pear', '51161', 'Miss', 'Sarareewan', 'Reenawong', 5, '5/14', 10);

INSERT INTO users (username, password, nickname, student_id, title, first_name, last_name, grade_level, class_name, number) VALUES
('Munich', '48457', 'Munich', '48457', 'Mr.', 'Eakkanin', 'Sithchaisurakool', 6, '6/14', 1),
('Bright_48458', '48458', 'Bright', '48458', 'Mr.', 'Chayodom', 'Disayawan', 6, '6/14', 2),
('Don', '48461', 'Don', '48461', 'Mr.', 'Donlawat', 'Jongjitvimol', 6, '6/14', 3),
('Dollar', '48483', 'Dollar', '48483', 'Mr.', 'Thanaphat', 'Khongkhunthian', 6, '6/14', 4),
('Tonmai', '50438', 'Tonmai', '50438', 'Mr.', 'Thanakit', 'Maiprasert', 6, '6/14', 5),
('Pupha_50439', '50439', 'Pupha', '50439', 'Mr.', 'Pupha', 'Srisawat', 6, '6/14', 6),
('Oil', '48489', 'Oil', '48489', 'Mr.', 'Nathapong', 'Chitranukroh', 6, '6/14', 7),
('Gift', '48490', 'Gift', '48490', 'Mr.', 'Phatthanan', 'Maneerat', 6, '6/14', 8),
('Ink', '48491', 'Ink', '48491', 'Mr.', 'Thanawat', 'Inkwan', 6, '6/14', 9),
('Tongkaw', '48496', 'Tongkaw', '48496', 'Mr.', 'Sirawit', 'Tongkaw', 6, '6/14', 10),
('Bam_48498', '48498', 'Bam', '48498', 'Mr.', 'Bamrung', 'Saetang', 6, '6/14', 11),
('Praew', '48500', 'Praew', '48500', 'Miss', 'Praewpan', 'Suksawat', 6, '6/14', 12),
('Noodee', '48501', 'Noodee', '48501', 'Miss', 'Nuttida', 'Noodee', 6, '6/14', 13),
('Sayo', '50323', 'Sayo', '50323', 'Miss', 'Sayamon', 'Thepsiri', 6, '6/14', 14),
('New', '50440', 'New', '50440', 'Miss', 'Newza', 'Jaidee', 6, '6/14', 15),
('Ing_50442', '50442', 'Ing', '50442', 'Miss', 'Ingfah', 'Charoensuk', 6, '6/14', 16);

INSERT INTO tests (name, description, grade_level, term, test_number, max_score) VALUES
('Grade 1 Term 1 Test 1', 'Vocabulary Test - Basic Words', 1, 1, 1, 10),
('Grade 1 Term 1 Test 2', 'Vocabulary Test - Animals', 1, 1, 2, 10),
('Grade 1 Term 1 Test 3', 'Vocabulary Test - Colors', 1, 1, 3, 10),
('Grade 1 Term 1 Test 4', 'Vocabulary Test - Numbers', 1, 1, 4, 10),
('Grade 1 Term 2 Test 1', 'Vocabulary Test - Family', 1, 2, 1, 10),
('Grade 1 Term 2 Test 2', 'Vocabulary Test - Food', 1, 2, 2, 10),
('Grade 1 Term 2 Test 3', 'Vocabulary Test - Body Parts', 1, 2, 3, 10),
('Grade 1 Term 2 Test 4', 'Vocabulary Test - School Items', 1, 2, 4, 10),
('Grade 1 Term 2 Test 5', 'Final Comprehensive Test', 1, 2, 5, 20),
('Grade 2 Term 1 Test 1', 'Vocabulary Test - Basic Verbs', 2, 1, 1, 10),
('Grade 2 Term 1 Test 2', 'Vocabulary Test - Adjectives', 2, 1, 2, 10),
('Grade 2 Term 1 Test 3', 'Vocabulary Test - Prepositions', 2, 1, 3, 10),
('Grade 2 Term 1 Test 4', 'Vocabulary Test - Time Words', 2, 1, 4, 10),
('Grade 2 Term 2 Test 1', 'Vocabulary Test - Weather', 2, 2, 1, 10),
('Grade 2 Term 2 Test 2', 'Vocabulary Test - Clothes', 2, 2, 2, 10),
('Grade 2 Term 2 Test 3', 'Vocabulary Test - Transport', 2, 2, 3, 10),
('Grade 2 Term 2 Test 4', 'Vocabulary Test - Places', 2, 2, 4, 10),
('Grade 2 Term 2 Test 5', 'Final Comprehensive Test', 2, 2, 5, 20),
('Grade 3 Term 1 Test 1', 'Vocabulary Test - Emotions', 3, 1, 1, 10),
('Grade 3 Term 1 Test 2', 'Vocabulary Test - Jobs', 3, 1, 2, 10),
('Grade 3 Term 1 Test 3', 'Vocabulary Test - Hobbies', 3, 1, 3, 10),
('Grade 3 Term 1 Test 4', 'Vocabulary Test - Nature', 3, 1, 4, 10),
('Grade 3 Term 2 Test 1', 'Vocabulary Test - Sports', 3, 2, 1, 10),
('Grade 3 Term 2 Test 2', 'Vocabulary Test - Music', 3, 2, 2, 10),
('Grade 3 Term 2 Test 3', 'Vocabulary Test - Technology', 3, 2, 3, 10),
('Grade 3 Term 2 Test 4', 'Vocabulary Test - Health', 3, 2, 4, 10),
('Grade 3 Term 2 Test 5', 'Final Comprehensive Test', 3, 2, 5, 20),
('Grade 4 Term 1 Test 1', 'Vocabulary Test - Advanced Verbs', 4, 1, 1, 10),
('Grade 4 Term 1 Test 2', 'Vocabulary Test - Complex Adjectives', 4, 1, 2, 10),
('Grade 4 Term 1 Test 3', 'Vocabulary Test - Compound Words', 4, 1, 3, 10),
('Grade 4 Term 1 Test 4', 'Vocabulary Test - Synonyms', 4, 1, 4, 10),
('Grade 4 Term 2 Test 1', 'Vocabulary Test - Antonyms', 4, 2, 1, 10),
('Grade 4 Term 2 Test 2', 'Vocabulary Test - Phrasal Verbs', 4, 2, 2, 10),
('Grade 4 Term 2 Test 3', 'Vocabulary Test - Idioms', 4, 2, 3, 10),
('Grade 4 Term 2 Test 4', 'Vocabulary Test - Context Clues', 4, 2, 4, 10),
('Grade 4 Term 2 Test 5', 'Final Comprehensive Test', 4, 2, 5, 20),
('Grade 5 Term 1 Test 1', 'Vocabulary Test - Academic Words', 5, 1, 1, 10),
('Grade 5 Term 1 Test 2', 'Vocabulary Test - Scientific Terms', 5, 1, 2, 10),
('Grade 5 Term 1 Test 3', 'Vocabulary Test - Literary Terms', 5, 1, 3, 10),
('Grade 5 Term 1 Test 4', 'Vocabulary Test - Formal Language', 5, 1, 4, 10),
('Grade 5 Term 2 Test 1', 'Vocabulary Test - Critical Thinking', 5, 2, 1, 10),
('Grade 5 Term 2 Test 2', 'Vocabulary Test - Analysis Terms', 5, 2, 2, 10),
('Grade 5 Term 2 Test 3', 'Vocabulary Test - Abstract Concepts', 5, 2, 3, 10),
('Grade 5 Term 2 Test 4', 'Vocabulary Test - Advanced Grammar', 5, 2, 4, 10),
('Grade 5 Term 2 Test 5', 'Final Comprehensive Test', 5, 2, 5, 20),
('Grade 6 Term 1 Test 1', 'Vocabulary Test - Professional Terms', 6, 1, 1, 10),
('Grade 6 Term 1 Test 2', 'Vocabulary Test - Business English', 6, 1, 2, 10),
('Grade 6 Term 1 Test 3', 'Vocabulary Test - Complex Grammar', 6, 1, 3, 10),
('Grade 6 Term 1 Test 4', 'Vocabulary Test - Writing Skills', 6, 1, 4, 10),
('Grade 6 Term 2 Test 1', 'Vocabulary Test - Reading Comprehension', 6, 2, 1, 10),
('Grade 6 Term 2 Test 2', 'Vocabulary Test - Critical Analysis', 6, 2, 2, 10),
('Grade 6 Term 2 Test 3', 'Vocabulary Test - Advanced Writing', 6, 2, 3, 10),
('Grade 6 Term 2 Test 4', 'Vocabulary Test - Presentation Skills', 6, 2, 4, 10),
('Grade 6 Term 2 Test 5', 'Final Comprehensive Test', 6, 2, 5, 20);

INSERT INTO test_assignments (user_id, test_id)
SELECT u.id, t.id
FROM users u
JOIN tests t ON u.grade_level = t.grade_level;

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
('grade6-term1-test1', true),
('grade6-term1-test2', true),
('grade6-term1-test3', true),
('grade6-term1-test4', true),
('grade6-term2-test1', true),
('grade6-term2-test2', true),
('grade6-term2-test3', true),
('grade6-term2-test4', true),
('grade6-term2-test5', true);

INSERT INTO test_results (user_id, test_id, grade_level, score, max_score, answers, submitted_at, completed)
SELECT 
    u.id, 
    t.id, 
    u.grade_level, 
    CASE 
        WHEN t.test_number <= 4 THEN (6 + (RANDOM() * 4)::int)
        ELSE (14 + (RANDOM() * 6)::int)
    END,
    t.max_score,
    ('{"test_score": ' || 
        CASE 
            WHEN t.test_number <= 4 THEN (6 + (RANDOM() * 4)::int)
            ELSE (14 + (RANDOM() * 6)::int)
        END || 
        ', "time_taken": ' || (20 + (RANDOM() * 30)::int) || '}')::jsonb,
    (CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')),
    true
FROM users u
JOIN tests t ON u.grade_level = t.grade_level;
