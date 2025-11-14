-- ========================================
-- MINI GAMES DATABASE SCHEMA
-- Tables for mini games feature
-- ========================================

-- ========================================
-- 1. MINI GAMES - Main game configuration
-- ========================================

CREATE TABLE IF NOT EXISTS mini_games (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 12),
    class INTEGER NOT NULL,
    topic VARCHAR(200),
    game_type VARCHAR(50) NOT NULL DEFAULT 'spell_duel',
    game_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 2. MINI GAME QUESTIONS - Questions/cards for games
-- ========================================

CREATE TABLE IF NOT EXISTS mini_game_questions (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES mini_games(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL,
    question_text TEXT,
    question_image_url TEXT, -- Cloudinary URL
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. MINI GAME SESSIONS - Active game sessions
-- ========================================

CREATE TABLE IF NOT EXISTS mini_game_sessions (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES mini_games(id),
    session_code VARCHAR(20) UNIQUE NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 4. MINI GAME RESULTS - Minimalistic game results
-- ========================================

CREATE TABLE IF NOT EXISTS mini_game_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES mini_game_sessions(id),
    game_id INTEGER REFERENCES mini_games(id),
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    
    -- Game performance metrics
    correct_cards INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    damage_dealt INTEGER DEFAULT 0,
    damage_received INTEGER DEFAULT 0,
    final_place INTEGER,
    final_hp INTEGER DEFAULT 0,
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_mini_games_teacher ON mini_games(teacher_id);
CREATE INDEX IF NOT EXISTS idx_mini_games_class ON mini_games(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_mini_games_subject ON mini_games(subject_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_questions_game ON mini_game_questions(game_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_code ON mini_game_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_game ON mini_game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_teacher ON mini_game_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_status ON mini_game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mini_game_results_session ON mini_game_results(session_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_results_student ON mini_game_results(student_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_results_game ON mini_game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_results_place ON mini_game_results(final_place);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE mini_games IS 'Main game configuration for mini games';
COMMENT ON TABLE mini_game_questions IS 'Questions/cards for mini games (can be text or image)';
COMMENT ON TABLE mini_game_sessions IS 'Active game sessions with WebSocket connections';
COMMENT ON TABLE mini_game_results IS 'Minimalistic game results for leaderboards and student cabinet';

COMMENT ON COLUMN mini_game_sessions.session_code IS 'Unique code for students to join game session';
COMMENT ON COLUMN mini_game_results.correct_cards IS 'Number of correct answers out of 3 cards';
COMMENT ON COLUMN mini_game_results.xp_earned IS 'XP earned from correct card answers (10 XP per correct)';
COMMENT ON COLUMN mini_game_results.damage_dealt IS 'Total damage dealt to opponents';
COMMENT ON COLUMN mini_game_results.damage_received IS 'Total damage received from opponents';
COMMENT ON COLUMN mini_game_results.final_place IS 'Final ranking in tournament (1 = winner)';

