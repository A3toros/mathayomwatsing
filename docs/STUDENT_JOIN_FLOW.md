# Student Join Flow for Mini Games

## Overview

Students must be **logged in** before joining a game session. This ensures we have their data (nickname, student_id, grade, class, number) for the results database.

## Join Methods

### 1. QR Code (Recommended)
- Teacher displays QR code after starting a game session
- Student scans QR code with their phone/device
- If not logged in → Redirected to login page
- After login → Automatically redirected to game
- If already logged in → Goes directly to game

### 2. Direct Link
- Teacher shares the game link: `https://your-site.com/student/duel/SESSION_CODE`
- Student clicks link
- If not logged in → Redirected to login page
- After login → Automatically redirected to game
- If already logged in → Goes directly to game

### 3. Session Code Entry
- Student enters session code in Student Cabinet
- If not logged in → Redirected to login page
- After login → Can enter code again or use saved session

## Authentication Flow

```
Student clicks QR/Link/Code
    ↓
Is student logged in?
    ├─ NO → Redirect to /login?redirect=/student/duel/SESSION_CODE
    │         ↓
    │    Student logs in
    │         ↓
    │    Redirect to game
    │
    └─ YES → Go directly to game
              ↓
         DuelGame component loads
              ↓
         WebSocket connects with student_id
              ↓
         Server fetches nickname from database
              ↓
         Game starts
```

## Implementation Details

### 1. DuelGamePage.jsx
- Checks authentication before loading game
- Redirects to login if not authenticated
- Stores session code in sessionStorage for post-login redirect

### 2. Login Page
- Checks for `redirect` query parameter
- After successful login, redirects to the game URL
- Also checks `sessionStorage.pendingGameSession`

### 3. WebSocket Connection
- Requires `student_id` from authenticated user
- Server fetches nickname from database if not provided
- All student data (name, surname, nickname, grade, class, number) available for results

## Data Collection

When a student joins:
1. **student_id** - From authenticated user
2. **student_name** - From authenticated user
3. **student_surname** - From authenticated user
4. **student_nickname** - Fetched from database (or uses name as fallback)
5. **grade** - From authenticated user
6. **class** - From authenticated user
7. **number** - From authenticated user

All this data is used when saving results to `mini_game_results` table.

## Teacher Interface

### QR Code Display
- Shows QR code with game link
- Displays session code
- Shows copy link button
- Reminds students they must be logged in

### Session Code Display
- Large, easy-to-read code
- Copy code button
- Copy link button
- Show QR code button

## Security

- Students cannot join without authentication
- Session codes are validated on the server
- Only active sessions can be joined
- Student data is verified from database

## User Experience

### For Students:
1. Scan QR code or click link
2. If not logged in → Login page appears
3. Enter student ID and password
4. Automatically redirected to game
5. Game loads with their character selection

### For Teachers:
1. Start game session
2. Display QR code on screen/projector
3. Students scan and join
4. Monitor active players in session

