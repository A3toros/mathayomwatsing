# Mini Games Implementation Plan

## Overview
This document outlines the implementation plan for adding a Mini Games feature to the teacher's cabinet. The feature will allow teachers to create and manage educational mini-games for their classes, starting with the "Spell Duel" game type.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Frontend Components](#frontend-components)
4. [Backend Services](#backend-services)
5. [WebSocket Server](#websocket-server)
6. [Game Implementation Details](#game-implementation-details)
7. [Development Stack](#development-stack)
8. [Implementation Phases](#implementation-phases)

---

## Architecture Overview

### System Components
1. **Frontend (React + Vite)**
   - MiniGame.jsx - Main teacher interface for managing games
   - MiniGameCreator.jsx - Game creation interface
   - SpellDuelGame.jsx - Student-facing game component
   - Game assets from Art folder

2. **Backend (Netlify Functions)**
   - Game CRUD operations
   - Question management
   - AI question generation (GPT-4)
   - Image upload to Cloudinary

3. **WebSocket Server (Separate Render Service)**
   - Real-time game state synchronization
   - Player matching and queue management
   - Game session management
   - Leaderboard updates

---

## Database Schema

### New Tables

#### 1. `mini_games` - Main game configuration
```sql
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
```

#### 2. `mini_game_questions` - Questions/cards for games
```sql
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
```

#### 3. `mini_game_sessions` - Active game sessions
```sql
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
```

**Why Store Sessions in Database When Using WebSockets?**

Even though WebSockets handle real-time connections, storing sessions in the database is essential for several reasons:

1. **Persistence Across Server Restarts**
   - WebSocket connections are in-memory and lost on server restart
   - Database sessions allow students to reconnect after server maintenance/deployments
   - Session code remains valid even if WebSocket server restarts
   - Teacher can restart game session without losing all progress

2. **Multi-Instance Coordination**
   - Render load balancer distributes connections across multiple instances
   - Each instance has separate in-memory state
   - Database provides shared state that all instances can access
   - Students can reconnect to different instance and still find their session

3. **Session History & Analytics**
   - Track when sessions were created, started, and ended
   - Analyze game usage patterns (peak times, duration, etc.)
   - Generate reports for teachers on session activity
   - Audit trail for debugging and support

4. **Teacher Visibility**
   - Teachers can see active sessions even if not connected via WebSocket
   - View session status from web interface (waiting, active, completed)
   - Monitor which games are currently running
   - Manage sessions from database queries

5. **Game Results Association**
   - `mini_game_results` table references `session_id`
   - Links all game results to the specific session
   - Enables leaderboard generation per session
   - Allows filtering results by session

6. **Session Recovery**
   - If WebSocket connection drops, session data persists
   - Students can rejoin using same session code
   - Game state can be partially reconstructed from database
   - Prevents complete data loss on connection issues

7. **Validation & Security**
   - Verify session code exists before allowing WebSocket connection
   - Check if session is still active/valid
   - Prevent joining expired or cancelled sessions
   - Track which teacher created which session

8. **State Synchronization**
   - Database acts as source of truth
   - WebSocket server loads session data on startup
   - Can rebuild in-memory state from database if needed
   - Ensures consistency across instances

**Architecture Pattern:**
```
WebSocket (In-Memory)          Database (Persistent)
├── Active connections         ├── Session records
├── Real-time game state       ├── Session metadata
├── Player positions           ├── Status tracking
└── Match rooms                └── Historical data
```

**Flow Example:**
1. Teacher creates session → Database record created with `status='waiting'`
2. Students connect via WebSocket → Server validates session exists in database
3. Game starts → Database updated to `status='active'`, `started_at` set
4. Game ends → Database updated to `status='completed'`, `ended_at` set
5. Results saved → Linked to `session_id` in database

**Best Practice:**
- Use database for **persistent state** (sessions, results, metadata)
- Use WebSocket for **ephemeral state** (player positions, spell casts, real-time updates)
- Sync critical state changes to database periodically
- Rebuild in-memory state from database on server restart

#### 4. `mini_game_results` - Minimalistic game results
```sql
CREATE TABLE IF NOT EXISTS mini_game_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES mini_game_sessions(id),
    game_id INTEGER REFERENCES mini_games(id),
    student_id VARCHAR(10) REFERENCES users(student_id),
    student_name VARCHAR(100) NOT NULL,
    student_surname VARCHAR(100) NOT NULL,
    student_nickname VARCHAR(100) NOT NULL,
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
```

#### 5. Indexes for Performance
```sql
CREATE INDEX idx_mini_games_teacher ON mini_games(teacher_id);
CREATE INDEX idx_mini_games_class ON mini_games(teacher_id, grade, class);
CREATE INDEX idx_mini_game_questions_game ON mini_game_questions(game_id);
CREATE INDEX idx_mini_game_sessions_code ON mini_game_sessions(session_code);
CREATE INDEX idx_mini_game_sessions_game ON mini_game_sessions(game_id);
CREATE INDEX idx_mini_game_results_session ON mini_game_results(session_id);
CREATE INDEX idx_mini_game_results_student ON mini_game_results(student_id);
CREATE INDEX idx_mini_game_results_game ON mini_game_results(game_id);
```

---

## Frontend Components

### 1. MiniGame.jsx - Teacher Game Management Interface

**Location**: `src/teacher/MiniGame.jsx`

**Features**:
- Display all classes assigned to teacher
- Show all minigame types for selected class
- Toggle active games
- Open game settings popup
- Start game (opens WebSocket connection)

**Component Structure**:
```jsx
- Class List View
  - Classes assigned to teacher (from teacher_subjects)
  - Click to expand → shows game types
  
- Game Types View
  - List of game types (initially only "Spell Duel")
  - Click to toggle active games
  
- Active Games View
  - List of active games for selected game type
  - Click game → opens settings popup
  
- Game Settings Popup
  - Game name, topic, subject, grade, class
  - Start button → initiates WebSocket connection
  - Student join interface
```

**Integration with TeacherCabinet**:
- Add new tab between "Test Management" and "Class Results"
- Tab order: Dashboard, Test Management, **Mini Games**, Class Results, Subject Management

### 2. MiniGameCreator.jsx - Game Creation Interface

**Location**: `src/components/minigame/MiniGameCreator.jsx`

**Features**:
- Subject dropdown (from `subjects` table)
- Grade dropdown (7-12)
- Topic input
- Two tabs: AI and Custom

**Custom Tab**:
- Number of questions input
- Question creator for each question:
  - Question text (textarea with MathEditorButton for Math/Science)
  - Image upload button (Cloudinary, max 500KB)
  - 4 answer options (A, B, C, D)
  - Correct answer selector
  - Add question button
  - Delete question button
- Kahoot-style card preview

**AI Tab**:
- Number of questions input
- Generate button → calls GPT-4 API
- Display generated questions with edit capability
- Regenerate button
- Preview button for Math/Science questions (KaTeX)
- Save button

**Question Format**:
- Questions can be text or image
- Images uploaded to Cloudinary (folder: `mini_games`)
- Validation: max 500KB file size
- For Math/Science: KaTeX syntax support with preview

**AI Question Generation**:
- Use GPT-4 via OpenRouter (similar to speaking test)
- Send JSON task with:
  - Subject
  - Grade level
  - Topic
  - Number of questions
  - Request format: JSON with questions and 4 options each
- Return JSON with questions array
- For Math/Science: Instruct GPT to use KaTeX syntax

### 3. SpellDuelGame.jsx - Student Game Component

**Location**: `src/components/minigame/SpellDuelGame.jsx`

**Game Flow**:
0. **Character Selection Phase** (NEW)
   - Display character selection screen
   - Show all 6 available characters with previews
   - Student selects their character
   - Display student's nickname (from database) for confirmation
   - Store selected character for use throughout game

1. **Card Phase** (3 cards)
   - Display question card (Kahoot style)
   - Student answers
   - Each correct answer: +5 points to base damage
   - Base damage: 5 points

2. **Queue Phase**
   - Students who completed 3 cards enter queue
   - Match with next student in queue
   - Create 1v1 match

3. **Battle Phase**
   - Character HP: 200 (starting HP)
   - Student always on left, opponent always on right
   - Movement: left-right, up-down (constrained to own half of map)
   - Spells: Fire Arrow, Water Spell (can cast as many as wanted)
   - Register hits and reduce HP in real-time
   - Round duration: 10 seconds
   - HP carries over between rounds (damage multiplier recalculated each round, not stored)
   - When student loses all HP (HP reaches 0), character dies and game is over for them
   - **Tournament System**: Game continues with multiple 1v1 matches until only 1 student remains with HP > 0
   - Last student standing wins the entire game session

4. **Results Phase**
   - **Top 3 Grand Reveal**: Animated reveal of 1st, 2nd, 3rd place before showing full leaderboard
   - **Leaderboard Display**:
     - Correct cards answered (out of 3)
     - XP earned from cards (10 XP per correct answer)
     - Damage dealt (total damage dealt to opponents)
     - Damage received (total damage taken)
     - Final place (1, 2, 3, etc.)

**Technical Implementation**:
- Canvas rendering (react-konva)
- WebSocket for real-time synchronization
- Character sprites from Art folder
- Spell animations
- Collision detection
- HP bar updates
- Round timer

---

## Backend Services

### Netlify Functions

#### 1. `create-mini-game.js`
- Create new game
- Validate teacher permissions
- Save game configuration
- Return game ID

#### 2. `get-mini-games.js`
- Get all games for teacher
- Filter by class, grade, subject
- Include active status

#### 3. `update-mini-game.js`
- Update game settings
- Toggle active status
- Update questions

#### 4. `delete-mini-game.js`
- Soft delete or hard delete
- Cascade delete questions

#### 5. `save-mini-game-questions.js`
- Save questions for game
- Handle both custom and AI-generated questions
- Validate question format

#### 6. `mini-game-generate-ai-questions.js`
- Call GPT-4 via OpenRouter
- Format request for question generation
- Return JSON with questions
- Handle Math/Science KaTeX syntax

**Implementation** (`functions/mini-game-generate-ai-questions.js`):

```javascript
const { neon } = require('@neondatabase/serverless')
const { OpenAI } = require('openai')
require('dotenv').config()

const sql = neon(process.env.NEON_DATABASE_URL)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// Initialize OpenAI client for GPT-4
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.URL || 'https://mathayomwatsing.netlify.app',
    'X-Title': 'Mathayom Watsing Testing System'
  }
})

// Validate token helper
function validateToken(event) {
  // Implementation similar to other functions
  // Returns { success: boolean, user: {...}, statusCode: number }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    }
  }

  try {
    // Validate teacher token
    const tokenValidation = validateToken(event)
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      }
    }

    const userInfo = tokenValidation.user
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher access required' })
      }
    }

    // Parse request body
    const body = JSON.parse(event.body)
    const { subject, grade, topic, numQuestions, subjectName } = body

    if (!subject || !grade || !topic || !numQuestions) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: subject, grade, topic, numQuestions'
        })
      }
    }

    // Check if subject is Math or Science (for KaTeX syntax)
    const isMathOrScience = subjectName && (
      subjectName.toLowerCase().includes('math') ||
      subjectName.toLowerCase().includes('mathematics') ||
      subjectName.toLowerCase().includes('science') ||
      subjectName.toLowerCase().includes('physics') ||
      subjectName.toLowerCase().includes('chemistry')
    )

    // Generate questions using GPT-4
    const questions = await generateQuestionsWithGPT4(
      subjectName || subject,
      grade,
      topic,
      numQuestions,
      isMathOrScience
    )

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        questions: questions
      })
    }
  } catch (error) {
    console.error('Error generating AI questions:', error)
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate questions',
        message: error.message
      })
    }
  }
}

async function generateQuestionsWithGPT4(subject, grade, topic, numQuestions, useKaTeX) {
  const maxAttempts = 3
  let lastError = null

  // Build prompt based on subject type
  const mathInstructions = useKaTeX ? `
IMPORTANT FOR MATH/SCIENCE QUESTIONS:
- Use KaTeX syntax for all mathematical expressions
- Inline math: Use $...$ (e.g., $x^2 + 5 = 10$)
- Display math: Use $$...$$ for equations on their own line
- Examples:
  * Fractions: $\\frac{a}{b}$ or $\\frac{numerator}{denominator}$
  * Powers: $x^2$, $y^{3}$
  * Subscripts: $H_2O$, $CO_2$
  * Square roots: $\\sqrt{x}$, $\\sqrt[3]{8}$
  * Greek letters: $\\alpha$, $\\beta$, $\\pi$, $\\theta$
  * Operators: $\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$
- Always wrap mathematical expressions in $...$ or $$...$$
- For question text, use inline math: $expression$
- For complex equations, use display math: $$expression$$
` : ''

  const prompt = `You are an expert educational content creator. Generate ${numQuestions} multiple-choice questions for a ${grade}th grade ${subject} class on the topic: "${topic}".

${mathInstructions}

Requirements:
1. Each question must have exactly 4 answer options (A, B, C, D)
2. Only ONE option should be correct
3. Questions should be appropriate for ${grade}th grade level
4. Questions should test understanding of the topic: "${topic}"
5. Make questions engaging and educational
6. Distractors (wrong answers) should be plausible but clearly incorrect
7. Questions should vary in difficulty within the grade level

${useKaTeX ? 'For Math/Science: Use KaTeX syntax for all mathematical expressions. Wrap math in $...$ for inline or $$...$$ for display.' : ''}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "Question text here${useKaTeX ? ' (use $...$ for math)' : ''}",
      "option_a": "Option A text",
      "option_b": "Option B text",
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_answer": "A"
    }
  ]
}

Important:
- question_id should be sequential starting from 1
- correct_answer must be exactly "A", "B", "C", or "D"
- All fields are required
- Question text should be clear and complete
${useKaTeX ? '- For mathematical expressions, use KaTeX syntax with $ delimiters' : ''}`

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini", // or "openai/gpt-4" for better quality
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7, // Balance between creativity and consistency
        max_tokens: 4000
      })

      const content = response.choices[0].message.content
      const result = JSON.parse(content)

      // Validate response structure
      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error('Invalid response format: missing questions array')
      }

      if (result.questions.length !== numQuestions) {
        console.warn(`Generated ${result.questions.length} questions, expected ${numQuestions}`)
        // Continue with what we got, or throw error if strict
      }

      // Validate each question
      for (let i = 0; i < result.questions.length; i++) {
        const q = result.questions[i]
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
          throw new Error(`Question ${i + 1} is missing required fields`)
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
          throw new Error(`Question ${i + 1} has invalid correct_answer: ${q.correct_answer}`)
        }
        // Ensure question_id is set
        if (!q.question_id) {
          q.question_id = i + 1
        }
      }

      return result.questions
    } catch (err) {
      lastError = err
      const status = err?.status || err?.code
      const isTimeout = err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT'
      const isRetryableStatus = [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status))
      const shouldRetry = attempt < maxAttempts && (isRetryableStatus || isTimeout || status === undefined)

      console.warn(`GPT-4 question generation retry ${attempt}/${maxAttempts}`, {
        status,
        code: err?.code,
        name: err?.name,
        message: err?.message
      })

      if (!shouldRetry) {
        throw err
      }

      // Exponential backoff
      const backoffMs = Math.min(2000, 500 * Math.pow(2, attempt - 1))
      await new Promise(resolve => setTimeout(resolve, backoffMs))
    }
  }

  throw lastError || new Error('Failed to generate questions after all retries')
}
```

**Key Features:**
- Validates teacher permissions
- Detects Math/Science subjects for KaTeX syntax
- Generates questions with GPT-4 via OpenRouter
- Validates response structure and question format
- Retry logic with exponential backoff
- Error handling for API failures
- Returns questions in format ready for database storage

#### 7. `get-mini-game-questions.js`
- Retrieve questions for game
- Format for student display

#### 8. `get-mini-game-results.js`
- Get results for game session
- Format leaderboard data

---

## WebSocket Server

### Separate Repository on GitHub
**Purpose**: Real-time game synchronization

**Technology Stack**:
- Node.js + Express
- `ws` library (WebSocket implementation)
- PostgreSQL (Neon Database)
- Deploy on Render as Web Service

**Repository Structure**:
```
mini-games-websocket-server/
├── src/
│   ├── server.js          # Main Express + WebSocket server
│   ├── gameManager.js      # Game session management
│   ├── queueManager.js    # Matchmaking queue
│   ├── matchManager.js    # 1v1 match handling
│   ├── database.js        # Database connection
│   └── utils/
│       ├── sessionUtils.js
│       └── validation.js
├── package.json
├── .env.example
└── README.md
```

### Server Implementation

#### 1. Main Server Setup (`src/server.js`)

```javascript
const express = require('express')
const { createServer } = require('http')
const WebSocket = require('ws')
const { neon } = require('@neondatabase/serverless')
const gameManager = require('./gameManager')
const queueManager = require('./queueManager')
const matchManager = require('./matchManager')

const app = express()
const server = createServer(app)
const port = process.env.PORT || 10000

// WebSocket server at /ws
const wss = new WebSocket.Server({ server, path: '/ws' })

// Database connection
const sql = neon(process.env.NEON_DATABASE_URL)

// HTTP routes for health checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mini-games-websocket' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Heartbeat function for connection health
function heartbeat() {
  this.isAlive = true
}

// WebSocket connection handler
wss.on('connection', function connection(ws, req) {
  ws.isAlive = true
  ws.on('error', console.error)
  ws.on('pong', heartbeat)

  // Parse query parameters for session code
  const url = new URL(req.url, `http://${req.headers.host}`)
  const sessionCode = url.searchParams.get('session')
  const userId = url.searchParams.get('userId')
  const userRole = url.searchParams.get('role') // 'teacher' or 'student'

  if (!sessionCode || !userId) {
    ws.close(1008, 'Missing session code or user ID')
    return
  }

  // Store connection metadata
  ws.sessionCode = sessionCode
  ws.userId = userId
  ws.userRole = userRole
  ws.matchId = null
  ws.playerId = null

  console.log(`Client connected: ${userId} (${userRole}) to session ${sessionCode}`)

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      await handleMessage(ws, data)
    } catch (error) {
      console.error('Error handling message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  })

  // Handle disconnection
  ws.on('close', async (code, reason) => {
    console.log(`Client disconnected: ${ws.userId} (code: ${code})`)
    await handleDisconnection(ws)
  })

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    sessionCode: sessionCode,
    userId: userId
  }))
})

// Message handler
async function handleMessage(ws, data) {
  const { type, payload } = data

  switch (type) {
    case 'join-session':
      await gameManager.joinSession(ws, payload)
      break

    case 'card-answered':
      await gameManager.handleCardAnswer(ws, payload)
      break

    case 'enter-queue':
      await queueManager.enterQueue(ws, payload)
      break

    case 'player-move':
      await matchManager.handlePlayerMove(ws, payload)
      break

    case 'spell-cast':
      await matchManager.handleSpellCast(ws, payload)
      break

    case 'round-ready':
      await matchManager.handleRoundReady(ws, payload)
      break

    case 'character-selected':
      await gameManager.handleCharacterSelection(ws, payload)
      break

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }))
  }
}

// Disconnection handler
async function handleDisconnection(ws) {
  // Remove from queue if in queue
  if (ws.userId) {
    await queueManager.removeFromQueue(ws.userId)
  }

  // Handle match disconnection
  if (ws.matchId) {
    await matchManager.handlePlayerDisconnect(ws.matchId, ws.playerId)
  }

  // Remove from game session
  if (ws.sessionCode) {
    await gameManager.handleDisconnect(ws.sessionCode, ws.userId)
  }
}

// Ping all connected clients every 30 seconds
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    // Close connections that failed to "pong" the previous ping
    if (ws.isAlive === false) {
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping()
  })
}, 30000)

// Cleanup on server shutdown
wss.on('close', function close() {
  clearInterval(interval)
})

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  // Notify all clients
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'server-shutdown',
        message: 'Server is shutting down. Please reconnect.'
      }))
      ws.close()
    }
  })

  // Close server
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
})

server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`)
})
```

#### 2. Game Manager (`src/gameManager.js`)

```javascript
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.NEON_DATABASE_URL)

// Store active sessions in memory (can be moved to Redis for multi-instance)
const activeSessions = new Map()

class GameManager {
  // Teacher creates a session
  async createSession(gameId, teacherId) {
    // Generate unique session code
    const sessionCode = this.generateSessionCode()
    
    // Create session in database
    const result = await sql`
      INSERT INTO mini_game_sessions (game_id, teacher_id, session_code, status)
      VALUES (${gameId}, ${teacherId}, ${sessionCode}, 'waiting')
      RETURNING id, session_code, created_at
    `
    
    const session = result[0]
    activeSessions.set(sessionCode, {
      id: session.id,
      gameId,
      teacherId,
      status: 'waiting',
      players: new Map(),
      questions: [],
      createdAt: session.created_at
    })
    
    return sessionCode
  }

  // Student joins session
  async joinSession(ws, payload) {
    const { sessionCode, studentId, studentName, studentNickname } = payload
    
    const session = activeSessions.get(sessionCode)
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }))
      return
    }

    // Get student nickname from database if not provided
    let nickname = studentNickname
    if (!nickname) {
      const student = await sql`
        SELECT nickname FROM users WHERE student_id = ${studentId}
      `
      nickname = student[0]?.nickname || studentName
    }

    // Add player to session
    session.players.set(studentId, {
      ws,
      studentId,
      studentName,
      studentNickname: nickname, // Store nickname from database
      selectedCharacter: null, // Will be set during character selection
      cardsAnswered: 0,
      correctAnswers: 0,
      damage: 5, // Base damage
      hp: 200,
      inQueue: false,
      matchId: null
    })

    // Load questions if not loaded
    if (session.questions.length === 0) {
      const questions = await sql`
        SELECT id, question_id, question_text, question_image_url,
               option_a, option_b, option_c, option_d, correct_answer
        FROM mini_game_questions
        WHERE game_id = ${session.gameId}
        ORDER BY question_id
      `
      session.questions = questions
    }

    // Send character selection screen to student (before card phase)
    ws.send(JSON.stringify({
      type: 'character-selection',
      characters: [
        { id: 'archer', name: 'Archer', gender: 'men', preview: '/art/characters/men/Archer/Idle.png' },
        { id: 'swordsman', name: 'Swordsman', gender: 'men', preview: '/art/characters/men/Swordsman/Idle.png' },
        { id: 'wizard', name: 'Wizard', gender: 'men', preview: '/art/characters/men/Wizard/Idle.png' },
        { id: 'enchantress', name: 'Enchantress', gender: 'women', preview: '/art/characters/women/Enchantress/Idle.png' },
        { id: 'knight', name: 'Knight', gender: 'women', preview: '/art/characters/women/Knight/Idle.png' },
        { id: 'musketeer', name: 'Musketeer', gender: 'women', preview: '/art/characters/women/Musketeer/Idle.png' }
      ],
      studentNickname: nickname
    }))

    // Notify teacher of new player
    this.broadcastToTeacher(sessionCode, {
      type: 'player-joined',
      studentId,
      studentName,
      studentNickname: nickname,
      playerCount: session.players.size
    })
  }

  // Handle character selection
  async handleCharacterSelection(ws, payload) {
    const { sessionCode, studentId, characterId } = payload
    const session = activeSessions.get(sessionCode)
    if (!session) return

    const player = session.players.get(studentId)
    if (!player) return

    // Store selected character
    player.selectedCharacter = characterId

    // Confirm selection and proceed to card phase
    ws.send(JSON.stringify({
      type: 'character-selected',
      characterId,
      studentNickname: player.studentNickname
    }))

    // Start card phase with first 3 questions
    ws.send(JSON.stringify({
      type: 'start-card-phase',
      questions: session.questions.slice(0, 3) // First 3 questions
    }))
  }

  // Handle card answer
  async handleCardAnswer(ws, payload) {
    const { sessionCode, questionId, answer, studentId } = payload
    const session = activeSessions.get(sessionCode)
    if (!session) return

    const player = session.players.get(studentId)
    if (!player) return

    // Find question
    const question = session.questions.find(q => q.question_id === questionId)
    if (!question) return

    const isCorrect = question.correct_answer === answer
    player.cardsAnswered++

    if (isCorrect) {
      player.correctAnswers++
      player.damage += 5 // Add 5 points per correct answer
    }

    // Send result to student
    ws.send(JSON.stringify({
      type: 'card-result',
      questionId,
      isCorrect,
      currentDamage: player.damage,
      cardsRemaining: 3 - player.cardsAnswered
    }))

    // If all 3 cards answered, notify ready for queue
    if (player.cardsAnswered === 3) {
      ws.send(JSON.stringify({
        type: 'cards-complete',
        correctAnswers: player.correctAnswers,
        finalDamage: player.damage
      }))
    }
  }

  // Broadcast to teacher
  broadcastToTeacher(sessionCode, message) {
    const session = activeSessions.get(sessionCode)
    if (!session) return

    // Find teacher's WebSocket (would need to track this)
    // For now, broadcast to all connections in session
    session.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message))
      }
    })
  }

  // Handle disconnection
  async handleDisconnect(sessionCode, userId) {
    const session = activeSessions.get(sessionCode)
    if (!session) return

    session.players.delete(userId)

    // If no players left, mark session as inactive
    if (session.players.size === 0) {
      await sql`
        UPDATE mini_game_sessions
        SET status = 'cancelled'
        WHERE session_code = ${sessionCode}
      `
      activeSessions.delete(sessionCode)
    }
  }

  // Generate unique session code
  generateSessionCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }
}

module.exports = new GameManager()
```

#### 3. Queue Manager (`src/queueManager.js`)

```javascript
const matchManager = require('./matchManager')

// Store queue in memory (per session)
const queues = new Map()

class QueueManager {
  // Student enters matchmaking queue
  async enterQueue(ws, payload) {
    const { sessionCode, studentId } = payload
    
    if (!queues.has(sessionCode)) {
      queues.set(sessionCode, [])
    }

    const queue = queues.get(sessionCode)
    
    // Check if already in queue
    if (queue.find(p => p.studentId === studentId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Already in queue'
      }))
      return
    }

    // Add to queue
    queue.push({
      studentId,
      ws,
      sessionCode,
      enteredAt: Date.now()
    })

    ws.send(JSON.stringify({
      type: 'queue-joined',
      position: queue.length
    }))

    // Try to match if 2+ players
    if (queue.length >= 2) {
      await this.tryMatch(sessionCode)
    }
  }

  // Try to match players
  async tryMatch(sessionCode) {
    const queue = queues.get(sessionCode)
    if (!queue || queue.length < 2) return

    // Get first two players
    const player1 = queue.shift()
    const player2 = queue.shift()

    // Create match
    const matchId = await matchManager.createMatch(
      sessionCode,
      player1,
      player2
    )

    // Notify both players
    player1.ws.send(JSON.stringify({
      type: 'match-found',
      matchId,
      opponentId: player2.studentId,
      isPlayer1: true
    }))

    player2.ws.send(JSON.stringify({
      type: 'match-found',
      matchId,
      opponentId: player1.studentId,
      isPlayer2: true
    }))
  }

  // Remove from queue
  async removeFromQueue(studentId) {
    for (const [sessionCode, queue] of queues.entries()) {
      const index = queue.findIndex(p => p.studentId === studentId)
      if (index !== -1) {
        queue.splice(index, 1)
        
        // Notify player
        const player = queue[index]
        if (player && player.ws.readyState === WebSocket.OPEN) {
          player.ws.send(JSON.stringify({
            type: 'queue-left'
          }))
        }
        break
      }
    }
  }
}

module.exports = new QueueManager()
```

#### 4. Match Manager (`src/matchManager.js`)

```javascript
const { neon } = require('@neondatabase/serverless')
const sql = neon(process.env.NEON_DATABASE_URL)

// Store active matches
const activeMatches = new Map()

class MatchManager {
  // Create a 1v1 match
  async createMatch(sessionCode, player1, player2) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const match = {
      id: matchId,
      sessionCode,
      player1: {
        id: player1.studentId,
        ws: player1.ws,
        hp: 200,
        damage: 5, // Will be set from card results
        position: { x: 100, y: 300 }, // Left side
        ready: false
      },
      player2: {
        id: player2.studentId,
        ws: player2.ws,
        hp: 200,
        damage: 5,
        position: { x: 700, y: 300 }, // Right side
        ready: false
      },
      currentRound: 0,
      roundTimer: null,
      status: 'waiting' // waiting, active, completed
    }

    activeMatches.set(matchId, match)

    // Store match ID in WebSocket
    player1.ws.matchId = matchId
    player1.ws.playerId = 'player1'
    player2.ws.matchId = matchId
    player2.ws.playerId = 'player2'

    return matchId
  }

  // Handle player movement
  async handlePlayerMove(ws, payload) {
    const { matchId, direction, position } = payload
    const match = activeMatches.get(matchId)
    if (!match || match.status !== 'active') return

    const player = match[ws.playerId]
    if (!player) return

    // Update position (validate bounds - own half only)
    player.position = this.validatePosition(position, ws.playerId)

    // Broadcast to opponent
    const opponent = ws.playerId === 'player1' ? match.player2 : match.player1
    if (opponent.ws.readyState === WebSocket.OPEN) {
      opponent.ws.send(JSON.stringify({
        type: 'opponent-move',
        position: player.position
      }))
    }
  }

  // Handle spell cast
  async handleSpellCast(ws, payload) {
    const { matchId, spellType, direction } = payload
    const match = activeMatches.get(matchId)
    if (!match || match.status !== 'active') return

    const player = match[ws.playerId]
    if (!player) return

    // Calculate spell damage
    const damage = this.calculateSpellDamage(spellType, player.damage)

    // Create spell projectile
    const spell = {
      id: `spell_${Date.now()}`,
      type: spellType,
      startPosition: { ...player.position },
      direction,
      damage,
      speed: spellType === 'fire_arrow' ? 10 : 5,
      owner: ws.playerId
    }

    // Broadcast spell to both players
    match.player1.ws.send(JSON.stringify({
      type: 'spell-cast',
      spell
    }))
    match.player2.ws.send(JSON.stringify({
      type: 'spell-cast',
      spell
    }))
  }

  // Handle spell hit
  async handleSpellHit(matchId, spellId, hitPlayerId) {
    const match = activeMatches.get(matchId)
    if (!match) return

    // Find spell (would need to track active spells)
    // For simplicity, calculate damage directly
    const caster = match[hitPlayerId === 'player1' ? 'player2' : 'player1']
    const hitPlayer = match[hitPlayerId]

    // Apply damage
    hitPlayer.hp = Math.max(0, hitPlayer.hp - caster.damage)

    // Broadcast damage
    match.player1.ws.send(JSON.stringify({
      type: 'damage-dealt',
      target: hitPlayerId,
      damage: caster.damage,
      remainingHp: hitPlayer.hp
    }))
    match.player2.ws.send(JSON.stringify({
      type: 'damage-dealt',
      target: hitPlayerId,
      damage: caster.damage,
      remainingHp: hitPlayer.hp
    }))

    // Check for game end
    if (hitPlayer.hp <= 0) {
      await this.endMatch(matchId, caster.id)
    }
  }

  // Start round
  startRound(matchId) {
    const match = activeMatches.get(matchId)
    if (!match) return

    match.status = 'active'
    match.currentRound++
    match.roundTimer = setTimeout(() => {
      this.endRound(matchId)
    }, 10000) // 10 seconds

    // Notify both players
    match.player1.ws.send(JSON.stringify({
      type: 'round-start',
      round: match.currentRound,
      duration: 10000
    }))
    match.player2.ws.send(JSON.stringify({
      type: 'round-start',
      round: match.currentRound,
      duration: 10000
    }))
  }

  // End round
  endRound(matchId) {
    const match = activeMatches.get(matchId)
    if (!match) return

    if (match.roundTimer) {
      clearTimeout(match.roundTimer)
    }

    // Recalculate damage for next round (not stored, recalculated)
    // HP carries over

    match.player1.ws.send(JSON.stringify({
      type: 'round-end',
      player1Hp: match.player1.hp,
      player2Hp: match.player2.hp
    }))
    match.player2.ws.send(JSON.stringify({
      type: 'round-end',
      player1Hp: match.player1.hp,
      player2Hp: match.player2.hp
    }))

    // Start next round after 3 second break
    setTimeout(() => {
      this.startRound(matchId)
    }, 3000)
  }

  // End match
  async endMatch(matchId, winnerId) {
    const match = activeMatches.get(matchId)
    if (!match) return

    match.status = 'completed'
    if (match.roundTimer) {
      clearTimeout(match.roundTimer)
    }

    const winner = match[winnerId === match.player1.id ? 'player1' : 'player2']
    const loser = match[winnerId === match.player1.id ? 'player2' : 'player1']

    // Save results to database
    await sql`
      INSERT INTO mini_game_results (
        session_id, game_id, student_id, student_name, student_surname,
        correct_cards, xp_earned, damage_dealt, damage_received,
        final_place, final_hp
      ) VALUES (
        (SELECT id FROM mini_game_sessions WHERE session_code = ${match.sessionCode}),
        (SELECT game_id FROM mini_game_sessions WHERE session_code = ${match.sessionCode}),
        ${winner.id}, ${winner.studentName}, '',
        ${winner.correctAnswers || 0}, ${winner.correctAnswers * 10 || 0},
        ${winner.damageDealt || 0}, ${loser.damageReceived || 0},
        1, ${winner.hp}
      ), (
        (SELECT id FROM mini_game_sessions WHERE session_code = ${match.sessionCode}),
        (SELECT game_id FROM mini_game_sessions WHERE session_code = ${match.sessionCode}),
        ${loser.id}, ${loser.studentName}, '',
        ${loser.correctAnswers || 0}, ${loser.correctAnswers * 10 || 0},
        ${loser.damageDealt || 0}, ${winner.damageReceived || 0},
        2, ${loser.hp}
      )
    `

    // Notify both players
    match.player1.ws.send(JSON.stringify({
      type: 'match-end',
      winner: winnerId,
      results: {
        player1: {
          hp: match.player1.hp,
          place: winnerId === match.player1.id ? 1 : 2
        },
        player2: {
          hp: match.player2.hp,
          place: winnerId === match.player2.id ? 1 : 2
        }
      }
    }))
    match.player2.ws.send(JSON.stringify({
      type: 'match-end',
      winner: winnerId,
      results: {
        player1: {
          hp: match.player1.hp,
          place: winnerId === match.player1.id ? 1 : 2
        },
        player2: {
          hp: match.player2.hp,
          place: winnerId === match.player2.id ? 1 : 2
        }
      }
    }))

    // Cleanup
    activeMatches.delete(matchId)
  }

  // Handle player disconnect during match
  async handlePlayerDisconnect(matchId, playerId) {
    const match = activeMatches.get(matchId)
    if (!match) return

    // End match, opponent wins
    const opponentId = playerId === 'player1' ? match.player2.id : match.player1.id
    await this.endMatch(matchId, opponentId)
  }

  // Validate position (keep in own half)
  validatePosition(position, playerId) {
    const maxX = playerId === 'player1' ? 400 : 800
    const minX = playerId === 'player1' ? 0 : 400
    const maxY = 600
    const minY = 0

    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y))
    }
  }

  // Calculate spell damage
  calculateSpellDamage(spellType, baseDamage) {
    if (spellType === 'fire_arrow') {
      return baseDamage
    } else if (spellType === 'water_spell') {
      return Math.floor(baseDamage * 1.5)
    }
    return baseDamage
  }
}

module.exports = new MatchManager()
```

### Client-Side WebSocket Connection

#### React Hook for WebSocket (`src/hooks/useMiniGameWebSocket.js`)

```javascript
import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://your-app.onrender.com/ws'

export function useMiniGameWebSocket(sessionCode, userId, userRole) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10
  const baseBackoffDelay = 1000
  const pingIntervalRef = useRef(null)
  const pongTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (!sessionCode || !userId) return

    const wsUrl = `${WS_URL}?session=${sessionCode}&userId=${userId}&role=${userRole}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setError(null)
      reconnectAttemptsRef.current = 0
      startPinging(ws)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Handle incoming messages (will be handled by component)
      if (data.type === 'pong') {
        clearTimeout(pongTimeoutRef.current)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Connection error')
    }

    ws.onclose = (code, reason) => {
      console.log(`WebSocket closed: ${code} ${reason}`)
      setIsConnected(false)
      cleanup()
      handleReconnect()
    }

    wsRef.current = ws
  }, [sessionCode, userId, userRole])

  const startPinging = (ws) => {
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))

        pongTimeoutRef.current = setTimeout(() => {
          console.log('No pong received, terminating connection')
          ws.terminate()
        }, 10000)
      }
    }, 30000)
  }

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached')
      return
    }

    reconnectAttemptsRef.current++
    const delay = Math.min(
      baseBackoffDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      60000
    )

    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
    setTimeout(connect, delay)
  }

  const cleanup = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
    }
  }

  const sendMessage = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    } else {
      console.error('WebSocket not connected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      cleanup()
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected,
    error,
    sendMessage,
    ws: wsRef.current
  }
}
```

### Key Features

1. **Connection Management**
   - Teacher creates session → generates session code
   - Students join with session code via query parameters
   - Track connected players per session
   - Heartbeat/ping-pong for connection health

2. **Queue System**
   - Students complete 3 cards → enter queue
   - FIFO matching (first 2 students matched)
   - Create isolated match room
   - Handle queue removal on disconnect

3. **Game State Synchronization**
   - Player positions (validated to own half)
   - HP updates in real-time
   - Spell casts broadcasted to both players
   - Round timers (10 seconds)
   - Match results saved to database

4. **Events**:
   - `join-session` - Student joins game session
   - `card-answered` - Student answers card
   - `enter-queue` - Student enters matchmaking queue
   - `match-found` - Two students matched
   - `player-move` - Player movement update
   - `spell-cast` - Player casts spell
   - `spell-hit` - Spell hits opponent
   - `damage-dealt` - Damage calculation
   - `round-start` - Round begins
   - `round-end` - Round timer expired
   - `match-end` - Match completed
   - `server-shutdown` - Server shutting down

5. **Database Integration**
   - Store session data in `mini_game_sessions`
   - Update game results in real-time
   - Save final results on match end
   - Session state can be saved to shared storage for multi-instance

6. **Graceful Shutdown**
   - Handle SIGTERM signal
   - Notify all clients
   - Close connections gracefully
   - 30-second shutdown window (extendable to 300s)

7. **Multi-Instance Support**
   - Load balancer assigns connections randomly
   - Session state should be stored in shared storage (Redis/Key-Value) for multi-instance
   - Clients reconnect to any available instance

### Package Configuration

#### `package.json`
```json
{
  "name": "mini-games-websocket-server",
  "version": "1.0.0",
  "description": "WebSocket server for mini games real-time synchronization",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "@neondatabase/serverless": "^0.9.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### `.env.example`
```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Database
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Optional: For multi-instance support
REDIS_URL=redis://localhost:6379
```

### Render Deployment Configuration

#### `render.yaml` (Optional)
```yaml
services:
  - type: web
    name: mini-games-websocket
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: NEON_DATABASE_URL
        sync: false
    healthCheckPath: /health
```

#### Manual Deployment Steps
1. **Create new repository on GitHub**
   - Repository name: `mini-games-websocket-server`
   - Initialize with README
   - Add all source files

2. **Create Render Web Service**
   - Connect GitHub repository
   - Service type: Web Service
   - Environment: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Port: 10000 (default)

3. **Configure Environment Variables**
   - `NEON_DATABASE_URL` - Your Neon database connection string
   - `NODE_ENV=production`
   - `PORT=10000` (Render sets this automatically)

4. **Deploy**
   - Render will automatically deploy on push to main branch
   - WebSocket endpoint: `wss://your-service.onrender.com/ws`

### Testing WebSocket Connection

#### Using websocat (Command Line)
```bash
# Install websocat
brew install websocat  # macOS
# or download from: https://github.com/vi/websocat

# Connect to WebSocket
websocat wss://your-service.onrender.com/ws?session=ABC123&userId=student1&role=student

# Send test message
{"type": "join-session", "payload": {"sessionCode": "ABC123", "studentId": "student1", "studentName": "Test Student"}}
```

#### Using Browser Console
```javascript
const ws = new WebSocket('wss://your-service.onrender.com/ws?session=ABC123&userId=student1&role=student')

ws.onopen = () => {
  console.log('Connected!')
  ws.send(JSON.stringify({
    type: 'join-session',
    payload: {
      sessionCode: 'ABC123',
      studentId: 'student1',
      studentName: 'Test Student'
    }
  }))
}

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data))
}
```

### Important Notes

1. **Always use `wss://` (secure WebSocket) for production**
   - Render requires TLS for public internet connections
   - Using `ws://` will result in 301 redirect errors

2. **Connection Health**
   - Server pings clients every 30 seconds
   - Clients should ping server every 30 seconds
   - Stale connections are terminated after 10 seconds without pong

3. **Reconnection Strategy**
   - Exponential backoff: 1s, 2s, 4s, 8s, ... (max 60s)
   - Maximum 10 reconnection attempts
   - Client automatically reconnects on disconnect

4. **Instance Shutdown**
   - Render sends SIGTERM signal
   - 30-second grace period (extendable to 300s)
   - All clients notified before shutdown
   - Clients should reconnect automatically

5. **Scaling Considerations**
   - For multiple instances, use shared state storage (Redis)
   - Session state should be stored in database or Redis
   - Load balancer distributes connections randomly
   - Consider sticky sessions if needed (not recommended for WebSockets)

---

## Game Implementation Details

### Spell Duel Game Mechanics

#### Card Phase
- **3 Questions**: Multiple choice (A, B, C, D)
- **Scoring**: Each correct answer adds 5 points to base damage
- **Base Damage**: 5 points
- **Total Possible Damage**: 5 (base) + 15 (3 correct) = 20 points per round

#### Character Stats
- **Starting HP**: 200
- **Movement**: 
  - Left/Right: Arrow keys or WASD
  - Up/Down: Arrow keys or WASD
  - Constrained to own half of map
- **Spells**:
  - **Fire Arrow**: Fast projectile, moderate damage
  - **Water Spell**: Slower projectile, higher damage

#### Round System
- **Duration**: 10 seconds per round
- **HP Persistence**: HP carries over between rounds
- **Damage Calculation**: 
  - Base damage (5) + (correct answers × 5)
  - Recalculated each round (not stored)
- **Win Condition**: Last student with HP > 0

#### Matchmaking & Tournament System
- **Queue System**: FIFO (First In, First Out)
- **Matching**: Match 2 students when both ready (completed 3 cards)
- **1v1 Matches**: Create isolated match room for each pair
- **Elimination**: When student HP reaches 0, they are eliminated from tournament
- **Continuing Tournament**: 
  - Eliminated students removed from queue
  - Remaining students continue to be matched
  - Process repeats until only 1 student remains with HP > 0
- **Session-wide**: All matches within one game session contribute to final leaderboard
- **Handle Disconnections**: 
  - If student disconnects during match, opponent wins
  - Disconnected student removed from tournament

#### Visual Assets

**Important**: Only PNG files are used in the web application. AI (Adobe Illustrator) and EPS (Encapsulated PostScript) files are source files and cannot be used directly in web browsers. All game assets must use PNG format only.

**File Format Usage**:
- ✅ **PNG files**: Used for all game assets (characters, spells, backgrounds, UI)
- ✅ **PNG Sprite Sheets**: Preferred for characters (exported from spritelist PSD files)
- ❌ **AI files**: Source files only, not used in application
- ❌ **EPS files**: Source files only, not used in application
- ❌ **PSD files**: Source files only, but can be exported as PNG sprite sheets

**Art Folder Structure** (`Art/` directory):

1. **Characters** (`Art/Characters/`) - **6 Total Characters**

   **Sprite Sheets (Recommended - Already Available as PNG)**:
   - Each character has sprite sheets already exported as PNG files
   - **Available sprite sheet files** (use these directly):
     - `Archer_spritelist.png` - Contains all Archer animation frames
     - `Swordsman_spritelist.png` - Contains all Swordsman animation frames
     - `Wizard_spritelist.png` - Contains all Wizard animation frames
     - `Enchantress_spritelist.png` - Contains all Enchantress animation frames
     - `Knight_spritelist.png` - Contains all Knight animation frames
     - `Musketeer_spritelist.png` - Contains all Musketeer animation frames (if available)
   
   **Sprite Sheet Location**: Check if sprite sheets are in:
   - `Art/Characters/men/` or `Art/Characters/women/` folders
   - Or in a dedicated `spritesheets/` subfolder
   - Or use individual PNG files if sprite sheets are not found
   
   **Sprite Sheet Benefits**:
   - Single image load per character (faster loading)
   - Reduced HTTP requests (1 request vs 10+ for individual PNGs)
   - Better performance with react-konva
   - Use `Image` component with `crop` prop to extract individual frames
   - Define frame coordinates for each animation state
   
   **Individual PNG Files (Alternative/Fallback)**:
   - Individual PNG files are also available in each character folder
   - Can be used if sprite sheet frame mapping is complex
   - Less efficient (more HTTP requests) but simpler to implement
   - Use when sprite sheet coordinates are unknown or need quick prototyping

   **Men** (`Art/Characters/men/`):
   - **Archer** (`Art/Characters/men/Archer/`):
     - **Idle Animation**: `Idle.png` → `Idle_2.png` (loop, 0.5s per frame)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting (Fire Arrow/Water Spell)**: `Shot_1.png` → `Shot_2.png` (0.2s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)
     - **Arrow Sprite**: `Arrow.png` (for visual reference, not used in game)
   
   - **Swordsman** (`Art/Characters/men/Swordsman/`):
     - **Idle Animation**: `Idle.png` → `Idle_2.png` (loop, 0.5s per frame)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting**: `Attack_1.png` → `Attack_2.png` → `Attack_3.png` (0.15s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)
   
   - **Wizard** (`Art/Characters/men/Wizard/`):
     - **Idle Animation**: `Idle.png` → `Idle_2.png` (loop, 0.5s per frame)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting**: `Attack_1.png` → `Attack_2.png` → `Attack_3.png` (0.15s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)

   **Women** (`Art/Characters/women/`):
   - **Enchantress** (`Art/Characters/women/Enchantress/`):
     - **Idle Animation**: `Idle.png` (static, or loop if multiple frames available)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting**: `Attack_1.png` → `Attack_2.png` → `Attack_3.png` → `Attack_4.png` (0.12s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)
   
   - **Knight** (`Art/Characters/women/Knight/`):
     - **Idle Animation**: `Idle.png` (static, or loop if multiple frames available)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting**: `Attack_1.png` → `Attack_2.png` → `Attack_3.png` → `Attack_4.png` (0.12s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)
   
   - **Musketeer** (`Art/Characters/women/Musketeer/`):
     - **Idle Animation**: `Idle.png` (static, or loop if multiple frames available)
     - **Movement Left-Right**: `Walk.png` (continuous loop while moving horizontally)
     - **Movement Up-Down**: `Walk.png` (continuous loop while moving vertically)
     - **Fast Movement**: `Run.png` (when moving quickly, optional)
     - **Jump Animation**: `Jump.png` (when moving up, optional enhancement)
     - **Spell Casting**: `Attack_1.png` → `Attack_2.png` → `Attack_3.png` → `Attack_4.png` (0.12s per frame, then return to Idle)
     - **Taking Damage**: `Hurt.png` (flash for 0.3s, then return to current state)
     - **Death**: `Dead.png` (play once when HP reaches 0, stay on this frame)

   **Character Animation States** (per tech task):
   - **Idle**: Default state when not moving
   - **Moving Left**: `Walk.png` (flip horizontally if needed, or use as-is)
   - **Moving Right**: `Walk.png` (normal orientation)
   - **Moving Up**: `Walk.png` (or `Jump.png` for upward movement)
   - **Moving Down**: `Walk.png` (normal orientation)
   - **Spell Cast**: Play attack animation sequence, then return to idle
   - **Taking Damage**: Flash `Hurt.png` briefly
   - **Dead**: Switch to `Dead.png` and stay

   **Character Selection**:
   - Before game starts, show character selection screen
   - Display all 6 characters with preview images (`Idle.png`)
   - Student selects their character
   - Selected character is used throughout the game
   - Opponent gets a different randomly assigned character
   - Display student's **nickname** (from database) above their character in-game

2. **Spells** (`Art/Spells/`)

   **Fire Arrow** (`Art/Spells/Fire Arrow/PNG/`):
   - **Animation Sequence**: 
     - `Fire Arrow_Frame_01.png` → `Fire Arrow_Frame_02.png` → `Fire Arrow_Frame_03.png` → 
     - `Fire Arrow_Frame_04.png` → `Fire Arrow_Frame_05.png` → `Fire Arrow_Frame_06.png` → 
     - `Fire Arrow_Frame_07.png` → `Fire Arrow_Frame_08.png`
   - **Animation Speed**: 0.05s per frame (total 0.4s for full cycle)
   - **Loop**: Yes, continuous loop while projectile is active
   - **Movement**: Fast projectile speed (10 pixels per frame)
   - **Direction**: Travels from caster position toward target (left to right or right to left)
   - **Usage**: 
     - Play animation sequence continuously while projectile is in flight
     - Stop and remove when projectile hits target or goes off-screen
     - Damage applied when projectile collides with opponent
   
   **Water Spell** (`Art/Spells/Water Spell/PNG/`):
   - **Animation Sequence**: 
     - `Water Spell_Frame_01.png` → `Water Spell_Frame_02.png` → `Water Spell_Frame_03.png` → 
     - `Water Spell_Frame_04.png` → `Water Spell_Frame_05.png` → `Water Spell_Frame_06.png` → 
     - `Water Spell_Frame_07.png` → `Water Spell_Frame_08.png`
   - **Animation Speed**: 0.08s per frame (total 0.64s for full cycle, slower than Fire Arrow)
   - **Loop**: Yes, continuous loop while projectile is active
   - **Movement**: Slower projectile speed (5 pixels per frame)
   - **Direction**: Travels from caster position toward target (left to right or right to left)
   - **Usage**: 
     - Play animation sequence continuously while projectile is in flight
     - Stop and remove when projectile hits target or goes off-screen
     - Damage applied when projectile collides with opponent (higher damage than Fire Arrow)
   
   **Spell Icons** (`Art/Spells/Icons/PNG/`):
   - `Icons_Fire Arrow.png` - UI button icon for Fire Arrow spell
   - `Icons_Water Spell.png` - UI button icon for Water Spell spell
   - **Usage**: 
     - Display on spell selection buttons in game UI
     - Show cooldown state (if implemented)
     - Highlight when spell is ready to cast
   
   **Spell Casting Flow** (per tech task):
   1. Player presses spell button (Fire Arrow or Water Spell)
   2. Character plays attack animation (Attack_1 through Attack_3/4)
   3. Spell projectile spawns at character position
   4. Projectile animation plays (8 frames, looping)
   5. Projectile moves toward opponent
   6. On collision: Damage applied, projectile removed
   7. Character returns to idle/walk state

3. **Backgrounds** (`Art/Background/PNG/`)

   **Available Backgrounds**:
   - `game_background_1/game_background_1.png` - Background option 1
   - `game_background_2/game_background_2.png` - Background option 2
   - `game_background_3/game_background_3.png` - Background option 3
   - `game_background_4/game_background_4.png` - Background option 4
   
   **Background Layers** (optional, for parallax effect):
   - Each background folder contains `layers/` subfolder with:
     - `back_decor.png` - Background decoration layer
     - `back_land.png` - Background landscape layer
     - `battleground.png` - Main battleground layer
     - `front_decor.png` - Front decoration layer
     - `ground_decor.png` - Ground decoration layer
   
   **Usage**: 
   - Use one background for the game arena (800x600 or scaled)
   - Can randomly select or let teacher choose
   - For simple implementation, use main background PNG
   - For advanced effects, use layered approach with parallax

4. **UI Elements** (`Art/UI Pack adventure/PNG/`)
   - **Default** (`Art/UI Pack adventure/PNG/Default/`): 128 PNG files
   - **Double** (`Art/UI Pack adventure/PNG/Double/`): 128 PNG files (2x size)
   - **Spritesheet** (`Art/UI Pack adventure/Spritesheet/`):
     - `spritesheet-default.png` - Combined spritesheet
     - `spritesheet-default.xml` - XML mapping file
     - `spritesheet-double.png` - Double size spritesheet
     - `spritesheet-double.xml` - XML mapping file

   **Popup/Modal Elements**:
   - **Character Selection Popup**:
     - `panel_brown.png` or `panel_brown_dark.png` - Main popup background
     - `panel_border_brown.png` or `panel_border_brown_detail.png` - Border frame
     - `button_brown.png` - Select button
     - `button_red_close.png` - Close button (if needed)
     - `round_brown.png` or `round_grey.png` - Character selection circles
   
   - **Game Settings Popup** (Teacher):
     - `panel_grey.png` or `panel_grey_dark.png` - Main popup background
     - `panel_border_grey.png` or `panel_border_grey_detail.png` - Border frame
     - `button_grey.png` - Action buttons (Start, Cancel)
     - `button_grey_close.png` - Close button
     - `checkbox_grey_checked.png` / `checkbox_grey_empty.png` - Settings checkboxes
   
   - **Question Card (Kahoot Style)**:
     - `panel_brown.png` or `panel_brown_arrows.png` - Card background
     - `round_brown.png` - Answer option circles
     - `button_brown.png` - Answer selection buttons
     - `progress_blue.png` or `progress_green.png` - Progress indicator
   
   - **Leaderboard Popup**:
     - `panel_grey_bolts.png` or `panel_grey_bolts_detail_a.png` - Main background
     - `panel_border_grey_detail.png` - Decorative border
     - `banner_hanging.png` or `banner_modern.png` - Title banner
     - `hexagon_grey_green.png` - 1st place indicator
     - `hexagon_grey_red.png` - 2nd/3rd place indicators
     - `progress_green.png` - HP/Score bars
     - `scrollbar_grey.png` - Scrollbar for long lists
   
   - **Top 3 Grand Reveal**:
     - `banner_classic_curtain.png` - Reveal curtain effect
     - `round_grey_detailed_green.png` - 1st place podium
     - `round_grey_detailed_red.png` - 2nd/3rd place podiums
     - `hexagon_grey_green.png` - Winner highlight
     - `minimap_icon_star_yellow.png` or `minimap_icon_jewel_yellow.png` - Trophy icons
   
   - **In-Game UI Elements**:
     - `progress_red.png` or `progress_red_border.png` - HP bar (red for low HP)
     - `progress_green.png` or `progress_green_border.png` - HP bar (green for high HP)
     - `progress_blue.png` - Spell cooldown/round timer
     - `button_red.png` - Fire Arrow spell button
     - `button_blue.png` (from panel_grey_blue.png) - Water Spell button
     - `panel_grey.png` - Game HUD background
     - `round_grey.png` - Character portrait frames
   
   - **General UI**:
     - `panel_grid_paper.png` - Background texture for modals
     - `pattern_diagonal_grey_small.png` - Decorative patterns
     - `scrollbar_transparent.png` - Scrollbars for lists
     - `checkbox_brown_checked.png` / `checkbox_brown_empty.png` - Selection checkboxes

**Asset Loading Strategy**:

**Character Sprite Sheets (Preferred Method)**:
1. **Use existing PNG sprite sheets**:
   - Sprite sheets are already available as PNG files
   - Locate sprite sheet files: `*_spritelist.png` in character folders
   - Copy to `public/art/characters/spritesheets/` or `src/assets/art/characters/spritesheets/`
   - If sprite sheets are not found, use individual PNG files as fallback

2. **Create frame mapping configuration** (JSON file for each character):
   ```json
   {
     "archer": {
       "spriteSheet": "/art/characters/spritesheets/Archer_spritelist.png",
       "frameWidth": 64,
       "frameHeight": 64,
       "animations": {
         "idle": [0, 1],  // Frame indices
         "walk": [2, 3, 4, 5],
         "run": [6, 7, 8, 9],
         "attack": [10, 11, 12],
         "hurt": [13],
         "dead": [14]
       }
     }
   }
   ```

3. **Use react-konva with sprite sheets**:
   ```jsx
   import { Image } from 'react-konva';
   
   // Load sprite sheet once
   const spriteSheet = new window.Image();
   spriteSheet.src = '/art/characters/spritesheets/Archer_spritelist.png';
   
   // Use crop to show specific frame
   <Image
     image={spriteSheet}
     x={characterX}
     y={characterY}
     width={64}
     height={64}
     crop={{
       x: frameIndex * 64,  // Calculate from frame index
       y: 0,
       width: 64,
       height: 64
     }}
   />
   ```

4. **Benefits**:
   - Single HTTP request per character (vs 10+ for individual PNGs)
   - Faster loading and better performance
   - Easier animation management
   - Reduced memory usage

**Individual PNG Files (Fallback Method)**:
- If sprite sheets are not available, use individual PNG files
- Load from `Art/Characters/{gender}/{character}/` folders
- Preload all frames for selected character on character selection screen
- Less efficient but works as backup option

**Spell Animations**:
- Use individual PNG files (8 frames per spell)
- Load from `Art/Spells/{SpellName}/PNG/` folders
- Cycle through frames using react-konva animation loop
- Preload all spell frames on game start

**Backgrounds & UI**:
- Copy Art folder to `public/art/` for direct URL access
- Or import to `src/assets/art/` for webpack bundling
- Use react-konva `Image` component to load PNGs
- Cache loaded images to avoid reloading

**Character Selection Flow**:
1. Student joins game session
2. Show character selection screen with all 6 characters
3. Display character previews (Idle.png) with character names
4. Student clicks to select their character
5. Store selected character in game state
6. Display student's **nickname** (from `users.nickname` in database) above character
7. Proceed to card phase with selected character

---

## Development Stack

### Frontend (Existing)
- **React 18.2.0** - UI framework
- **Framer Motion 12.23.12** - Animations
- **Tailwind CSS 3.4.17** - Styling
- **react-konva 18.2.14** - Canvas rendering
- **KaTeX 0.16.25** - Math rendering
- **axios 1.12.2** - HTTP requests

### Backend (Existing)
- **Netlify Functions** - Serverless functions
- **Neon Database** - PostgreSQL
- **Cloudinary** - Image hosting
- **OpenRouter API** - GPT-4 access

### WebSocket Server (New)
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** or **ws** - WebSocket library
- **PostgreSQL** - Database (Neon)
- **Render** - Hosting platform

### Game Rendering Options
1. **react-konva** (Recommended - already in project)
   - 2D canvas rendering
   - Sprite management
   - Animation support
   - Collision detection

2. **PixiJS** (Alternative)
   - WebGL rendering
   - Better performance for complex graphics
   - More advanced particle effects

3. **Three.js** (For 3D - not needed for Spell Duel)
   - 3D rendering
   - Overkill for 2D game

**Recommendation**: Start with react-konva, migrate to PixiJS if performance issues arise.

---

## Implementation Phases

### Phase 1: Database & Backend Foundation
**Duration**: 3-5 days

1. Create database tables
   - `mini_games`
   - `mini_game_questions`
   - `mini_game_sessions`
   - `mini_game_results`
   - Add indexes

2. Create Netlify functions
   - `create-mini-game.js`
   - `get-mini-games.js`
   - `update-mini-game.js`
   - `delete-mini-game.js`
   - `save-mini-game-questions.js`
   - `get-mini-game-questions.js`

3. Test database operations
   - CRUD operations
   - Data validation
   - Error handling

### Phase 2: Game Creator Interface
**Duration**: 5-7 days

1. Create MiniGameCreator.jsx
   - Subject/Grade/Topic form
   - Custom tab implementation
   - Question creator UI
   - Image upload integration
   - Cloudinary validation (500KB)

2. AI question generation
   - `mini-game-generate-ai-questions.js` function
   - GPT-4 integration
   - JSON request/response handling
   - KaTeX syntax for Math/Science
   - Preview functionality

3. Question management
   - Add/delete questions
   - Edit questions
   - Preview cards (Kahoot style)
   - Save to database

### Phase 3: Teacher Game Management
**Duration**: 3-4 days

1. Create MiniGame.jsx
   - Class list view
   - Game types view
   - Active games view
   - Game settings popup

2. Integrate with TeacherCabinet
   - Add "Mini Games" tab
   - Position between "Test Management" and "Class Results"
   - Navigation and routing

3. Game CRUD operations
   - Create game
   - View games
   - Toggle active status
   - Delete game

### Phase 4: WebSocket Server Setup
**Duration**: 5-7 days

1. Create new GitHub repository
   - Initialize Node.js project
   - Set up Express server
   - Configure Socket.io
   - Database connection (Neon)

2. Implement WebSocket handlers
   - Connection management
   - Session creation
   - Student join/leave
   - Queue system
   - Matchmaking

3. Deploy to Render
   - Configure environment variables
   - Set up WebSocket endpoint
   - Test connection from frontend

### Phase 5: Spell Duel Game Implementation
**Duration**: 10-14 days

1. Card Phase
   - Question display (Kahoot style)
   - Answer selection
   - Score calculation
   - Queue entry

2. Battle Phase
   - Canvas setup (react-konva)
   - Character rendering
   - Movement controls
   - Spell system
   - Collision detection
   - HP management
   - Round timer

3. WebSocket Integration
   - Real-time position sync
   - Spell cast synchronization
   - Damage calculation
   - Round management
   - Game end detection

4. Results & Leaderboard
   - Top 3 reveal animation
   - Leaderboard display
   - Save results to database

### Phase 6: Testing & Polish
**Duration**: 5-7 days

1. Unit testing
   - Game logic
   - Damage calculations
   - Queue system

2. Integration testing
   - WebSocket connections
   - Database operations
   - Image uploads

3. UI/UX polish
   - Animations (Framer Motion)
   - Loading states
   - Error handling
   - Responsive design

4. Performance optimization
   - Canvas rendering optimization
   - WebSocket message batching
   - Database query optimization

---

## File Structure

```
src/
├── teacher/
│   ├── MiniGame.jsx (NEW)
│   └── TeacherCabinet.jsx (MODIFY - add tab)
│
├── components/
│   ├── minigame/ (NEW)
│   │   ├── MiniGameCreator.jsx
│   │   ├── SpellDuelGame.jsx
│   │   ├── GameCard.jsx (Kahoot-style card)
│   │   ├── CharacterSprite.jsx
│   │   ├── SpellAnimation.jsx
│   │   └── Leaderboard.jsx
│   │
│   └── ui/ (existing)
│       └── components-ui-index.js
│
├── services/
│   └── miniGameService.js (NEW)
│
functions/
├── create-mini-game.js (NEW)
├── get-mini-games.js (NEW)
├── update-mini-game.js (NEW)
├── delete-mini-game.js (NEW)
├── save-mini-game-questions.js (NEW)
├── get-mini-game-questions.js (NEW)
├── mini-game-generate-ai-questions.js (NEW)
└── get-mini-game-results.js (NEW)

database/
└── mini_games_schema.sql (NEW)

docs/
└── mini-games-implementation-plan.md (THIS FILE)
```

---

## Key Integration Points

### 1. TeacherCabinet Integration
- Add "Mini Games" tab in navigation (line ~1097 in TeacherCabinet.jsx)
- Import MiniGame component
- Add route handling

### 2. Cloudinary Integration
- Use existing `upload-image.js` function
- Folder: `mini_games`
- Validation: 500KB max (use `validateImageFile` from `imageUtils.js`)

### 3. GPT-4 Integration
- Use OpenRouter API (similar to `process-speaking-audio-ai.js`)
- Model: `openai/gpt-4o-mini` or `openai/gpt-4`
- JSON request/response format
- KaTeX syntax for Math/Science

### 4. Subject Dropdown
- Use `userService.getSubjectsDropdown()` (existing)
- Same pattern as test creators

### 5. KaTeX Preview
- Use `MathEditorButton` component (existing)
- Show preview button next to questions/options
- Use `renderMathInText` utility

---

## Environment Variables

### Frontend (.env)
```
VITE_WEBSOCKET_URL=wss://your-render-service.onrender.com
```

### Backend (Netlify)
```
NEON_DATABASE_URL=...
CLOUDINARY_URL=...
OPENROUTER_API_KEY=...
```

### WebSocket Server (.env)
```
NEON_DATABASE_URL=...
PORT=3000
NODE_ENV=production
```

---

## Testing Checklist

### Database
- [ ] Tables created successfully
- [ ] Indexes working
- [ ] Foreign key constraints
- [ ] Data validation

### Game Creator
- [ ] Subject dropdown loads
- [ ] Grade selection works
- [ ] Custom questions save correctly
- [ ] Image upload works (500KB limit)
- [ ] AI questions generate correctly
- [ ] KaTeX preview works for Math/Science
- [ ] Questions display in Kahoot style

### Teacher Interface
- [ ] Classes display correctly
- [ ] Game types list works
- [ ] Active games toggle
- [ ] Settings popup opens
- [ ] Start button initiates WebSocket

### WebSocket Server
- [ ] Connection established
- [ ] Session creation works
- [ ] Students can join
- [ ] Queue system matches players
- [ ] Game state syncs correctly

### Spell Duel Game
- [ ] Cards display correctly
- [ ] Answers register
- [ ] Damage calculation correct
- [ ] Characters move correctly
- [ ] Spells cast and hit
- [ ] HP updates in real-time
- [ ] Rounds transition correctly
- [ ] Game ends when HP = 0
- [ ] Leaderboard displays correctly
- [ ] Results save to database

---

## Comprehensive TODO List

### Phase 1: Database & Backend Foundation (3-5 days)
- [ ] Create database schema: `mini_games`, `mini_game_questions`, `mini_game_sessions`, `mini_game_results` tables with indexes
- [ ] Create and run database migration SQL file (`mini_games_schema.sql`)
- [ ] Create Netlify function: `create-mini-game.js` - Create new game, validate teacher permissions, save game configuration
- [ ] Create Netlify function: `get-mini-games.js` - Get all games for teacher, filter by class/grade/subject, include active status
- [ ] Create Netlify function: `update-mini-game.js` - Update game settings, toggle active status, update questions
- [ ] Create Netlify function: `delete-mini-game.js` - Soft/hard delete game, cascade delete questions
- [ ] Create Netlify function: `save-mini-game-questions.js` - Save questions for game, handle custom and AI-generated questions, validate format
- [ ] Create Netlify function: `get-mini-game-questions.js` - Retrieve questions for game, format for student display
- [ ] Create Netlify function: `mini-game-generate-ai-questions.js` - GPT-4 integration via OpenRouter, JSON request/response, KaTeX for Math/Science
- [ ] Create Netlify function: `get-mini-game-results.js` - Get results for game session, format leaderboard data
- [ ] Test database operations - CRUD for games, questions, sessions, results, validate foreign keys, test indexes performance

### Phase 2: Game Creator Interface (5-7 days)
- [ ] Create `MiniGameCreator.jsx` component - Subject dropdown, grade 7-12, topic input, AI/Custom tabs
- [ ] Implement Custom tab in MiniGameCreator - Number of questions input, question creator with options, image upload (Cloudinary, 500KB), add/delete buttons, 4 answers per question
- [ ] Implement AI tab in MiniGameCreator - Number of questions input, GPT-4 generation, display for editing, regenerate button, preview for Math/Science (KaTeX), save button
- [ ] Implement Kahoot-style card preview in MiniGameCreator for question display
- [ ] Integrate Cloudinary image upload with 500KB validation
- [ ] Implement MathEditorButton and KaTeX preview for Math/Science questions
- [ ] Test game creator - Subject dropdown, grade selection, custom questions, AI generation, image upload, KaTeX preview, save functionality

### Phase 3: Teacher Game Management (3-4 days)
- [ ] Create `MiniGame.jsx` component - Display all classes assigned to teacher, show game types, toggle active games, game settings popup
- [ ] Integrate MiniGame.jsx into TeacherCabinet - Add "Mini Games" tab between "Test Management" and "Class Results"
- [ ] Implement game settings popup with start button that opens WebSocket connection
- [ ] Implement student join interface in game settings popup
- [ ] Test teacher interface - Class display, game types, active games toggle, settings popup, start button, WebSocket initiation

### Phase 4: WebSocket Server Setup (5-7 days)
- [ ] Create new GitHub repository for WebSocket server (`mini-games-websocket-server`)
- [ ] Set up WebSocket server: Express + ws library, main `server.js` with connection handling, heartbeat/ping-pong, graceful shutdown
- [ ] Implement `gameManager.js` - Session creation, student join, card answer handling, character selection, session management
- [ ] Implement `queueManager.js` - Matchmaking queue system, FIFO matching, player matching logic
- [ ] Implement `matchManager.js` - 1v1 match creation, player movement, spell casting, damage calculation, round management, match end
- [ ] Deploy WebSocket server to Render - Configure environment variables, set up WebSocket endpoint, test connection
- [ ] Create `useMiniGameWebSocket.js` React hook - Connection management, reconnection logic with exponential backoff, ping/pong handling
- [ ] Test WebSocket server - Connection establishment, session creation, student join, queue matching, game state sync, reconnection

### Phase 5: Spell Duel Game Implementation (10-14 days)
- [ ] Set up character sprite sheets - Locate and copy PNG sprite sheets to `public/art/`, create frame mapping JSON configurations for all 6 characters
- [ ] Set up spell animations - Copy Fire Arrow and Water Spell PNG frames (8 frames each) to `public/art/`, set up animation sequences
- [ ] Set up background images - Copy 4 background PNGs to `public/art/`, implement background selection/randomization
- [ ] Set up UI elements - Copy UI Pack PNGs to `public/art/`, identify and map popup elements (character selection, settings, leaderboard, cards)
- [ ] Implement character selection screen in SpellDuelGame - Display all 6 characters with previews, student selection, nickname display
- [ ] Implement card phase in SpellDuelGame - Display 3 question cards (Kahoot style), answer selection, damage calculation (base 5 + 5 per correct)
- [ ] Implement queue phase in SpellDuelGame - Enter queue after 3 cards, matchmaking with next student, create 1v1 match
- [ ] Implement canvas rendering with react-konva - Character sprites, spell projectiles, background, UI elements, collision detection
- [ ] Implement character animations - Idle loop, walk/run for movement, attack sequences, hurt flash, death state, sprite sheet frame extraction
- [ ] Implement spell animations - Fire Arrow (fast, 8 frames, 0.05s per frame), Water Spell (slow, 8 frames, 0.08s per frame), projectile movement
- [ ] Implement movement controls - Arrow keys/WASD for left-right and up-down movement, constrain to own half of map, real-time position sync via WebSocket
- [ ] Implement battle phase in SpellDuelGame - Character movement (left-right, up-down, constrained to own half), HP management (200 starting), round system (10 seconds)
- [ ] Implement spell system in SpellDuelGame - Fire Arrow and Water Spell casting, projectile animations (8 frames), collision detection, damage application
- [ ] Implement collision detection - Spell projectiles vs characters, boundary checking for movement, hit registration and damage application
- [ ] Implement HP management - Starting HP 200, real-time HP updates, HP bar UI, HP carries over between rounds, death at HP=0
- [ ] Implement round system - 10 second rounds, round timer display, HP persistence between rounds, damage recalculation each round
- [ ] Implement tournament system - Multiple 1v1 matches, elimination when HP=0, continue until 1 student left, session-wide leaderboard
- [ ] Implement results phase - Top 3 grand reveal animation, leaderboard display (correct cards, XP, damage dealt/received, place), save to database
- [ ] Create Leaderboard component - Display correct cards, XP earned, damage dealt/received, final place, sort by place
- [ ] Implement Top 3 grand reveal animation - Animated reveal of 1st, 2nd, 3rd place using UI assets (banner, podiums, icons) before showing full leaderboard
- [ ] Test Spell Duel game - Character selection, cards display, answers register, damage calculation, movement, spells, HP updates, rounds, tournament, leaderboard

### Phase 6: Testing & Polish (5-7 days)
- [ ] Integration testing - End-to-end flow from game creation to completion, multiple students, tournament system, results saving
- [ ] Performance optimization - Canvas rendering optimization, WebSocket message batching, database query optimization, asset preloading
- [ ] UI/UX polish - Framer Motion animations, loading states, error handling, responsive design, visual feedback for all interactions
- [ ] Mobile responsiveness testing and adjustments
- [ ] Error boundary implementation for game components
- [ ] Final testing and bug fixes

---

## Future Enhancements

1. **Additional Game Types**
   - Math Race
   - Vocabulary Battle
   - Science Quiz Showdown

2. **Advanced Features**
   - Power-ups
   - Special abilities
   - Team battles
   - Tournament mode

3. **Analytics**
   - Student performance tracking
   - Class statistics
   - Game popularity metrics

4. **Student Cabinet Integration**
   - Game history
   - Personal leaderboard
   - Achievement system

---

## Notes

- **Art folder location**: Assets are in `Art/` folder at project root
  - Copy to `public/art/` for direct access via URLs
  - Or import to `src/assets/art/` for bundling
  - Use exact paths: `Art/Characters/`, `Art/Spells/`, `Art/Background/`, `Art/UI Pack adventure/`
- WebSocket server should be separate repository for independent deployment
- Consider rate limiting for WebSocket connections
- Implement reconnection logic for dropped connections
- Add error boundaries for game components
- Consider mobile responsiveness for game interface

---

## Resources

- [react-konva Documentation](https://konvajs.org/docs/react/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Render WebSocket Guide](https://render.com/docs/websockets)
- [KaTeX Syntax Reference](https://katex.org/docs/supported.html)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: Development Team

