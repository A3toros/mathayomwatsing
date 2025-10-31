# Android Dashboard Leaderboard - Data Structure & Queries Summary

## 📱 Android App Data Structure

### TypeScript Interface (Type Definition)
**File:** `MWSExpo/src/types/index.ts`

```typescript
export interface LeaderboardEntry {
  number: number;        // Student number from users table
  nickname: string;      // Student nickname
  xp: number;           // Total XP earned (sum of XP from all tests)
  max_xp: number;       // Total max XP possible (count of tests * 10)
  ratio: number;        // XP/max_xp ratio (0.0 to 1.0)
  rank_title: string;   // Rank title based on ratio
  is_current_student: boolean;  // true if this is the logged-in student
}
```

### React Native State Structure
**File:** `MWSExpo/src/components/dashboard/DashboardView.tsx`

```typescript
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
```

**Data Structure in Component:**
- `leaderboard`: Array of `LeaderboardEntry` objects
- Each entry represents one student in the class
- Sorted by `ratio` DESC, then `number` ASC
- Displayed as a FlatList in the dashboard

---

## 🔌 API Endpoint & Query

### Backend Function
**New file:** `functions/get-class-leaderboard.js`

### HTTP Request
```
GET /.netlify/functions/get-class-leaderboard
Authorization: Bearer <JWT_TOKEN>

No query parameters needed - grade, class, and student_id are extracted from JWT token
```

### API Response Format
```json
{
  "success": true,
  "leaderboard": [
    {
      "number": 1,
      "nickname": "Alex",
      "xp": 85,
      "max_xp": 100,
      "ratio": 0.85,
      "rank_title": "Grand Sorcerer",
      "is_current_student": true
    },
    {
      "number": 2,
      "nickname": "Sarah",
      "xp": 90,
      "max_xp": 100,
      "ratio": 0.9,
      "rank_title": "Archimage",
      "is_current_student": false
    }
  ]
}
```

---

## 🗄️ Database Query to View

### Source View
**View Name:** `teacher_student_results_view`

### Query Structure
**Single optimized query with CTE (Common Table Expression):**

```sql
WITH student_stats AS (
  SELECT 
    v.student_id,
    v.number,
    v.nickname,
    -- Calculate XP: FLOOR((score/max_score * 100) / 10) per test, then sum
    SUM(CASE 
      WHEN v.max_score > 0 AND (v.score::DECIMAL / v.max_score::DECIMAL * 100) >= 10
      THEN FLOOR((v.score::DECIMAL / v.max_score::DECIMAL * 100) / 10)
      ELSE 0
    END) as xp,
    -- Max XP: count of tests * 10
    COUNT(*) * 10 as max_xp
  FROM teacher_student_results_view v
  WHERE v.grade = ${grade}
    AND v.class = ${class}
    AND v.is_completed = true
  GROUP BY v.student_id, v.number, v.nickname
)
SELECT 
  u.number,
  u.nickname,
  COALESCE(ss.xp, 0) as xp,
  COALESCE(ss.max_xp, 0) as max_xp,
  -- Calculate ratio: xp / max_xp
  CASE 
    WHEN COALESCE(ss.max_xp, 0) > 0 
    THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
    ELSE 0
  END as ratio,
  -- Rank title based on ratio
  CASE
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.95 THEN 'Lord of Magic'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.9 THEN 'Archimage'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.8 THEN 'Grand Sorcerer'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.7 THEN 'High Cleric'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.6 THEN 'Adept Mage'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.5 THEN 'Apprentice Mage'
    WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.4 THEN 'Initiate'
    ELSE 'Muggle'
  END as rank_title,
  CASE WHEN u.student_id = ${student_id} THEN true ELSE false END as is_current_student
FROM users u
LEFT JOIN student_stats ss ON u.student_id = ss.student_id
WHERE u.grade = ${grade} 
  AND u.class = ${class}
  AND u.is_active = true
ORDER BY 
  CASE 
    WHEN COALESCE(ss.max_xp, 0) > 0 
    THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
    ELSE 0
  END DESC,
  u.number ASC
```

### View Columns Used
From `teacher_student_results_view`:
- `score` - Test score (INTEGER)
- `max_score` - Maximum possible score (INTEGER)
- `student_id` - Student ID (VARCHAR)
- `grade` - Student grade (INTEGER)
- `class` - Student class (INTEGER)
- `number` - Student number (INTEGER)
- `nickname` - Student nickname (VARCHAR)
- `is_completed` - Whether test is completed (BOOLEAN)

### Additional Table Used
- `users` table - For getting all students in class (even if no tests completed)
  - Columns: `student_id`, `number`, `nickname`, `grade`, `class`, `is_active`

---

## 📊 Data Flow Summary

1. **Android App** → Calls API: `GET /.netlify/functions/get-class-leaderboard?grade=1&class=15`
2. **Backend Function** → Queries `teacher_student_results_view` with the SQL query above
3. **Database** → Returns aggregated XP data per student
4. **Backend Function** → Returns JSON response with leaderboard array
5. **Android App** → Receives `LeaderboardEntry[]` and displays in dashboard

---

## 🎯 Key Points

- **No local database/table in Android** - Data comes from API response only
- **No data persistence needed** - Fresh data on each API call
- **Single API call** - One query to get entire class leaderboard
- **Minimal computation** - XP calculated in SQL query (not in app)
- **Real-time data** - Always reflects current test results

---

## 📋 Leaderboard Display Columns

In the Android dashboard, each row shows:

| Column | Header | Source | Display Format | Example |
|--------|--------|--------|----------------|---------|
| **Number** | `#` | `number` | `1`, `2`, etc. (no `#` prefix) | `1` |
| **Nickname** | `Nick` | `nickname` | Plain text | `Alex` |
| **Total XP** | `XP` | `xp` | Just total XP number | `95` |
| **Rank Title** | `Rank` | `rank_title` | "Lord of Magic", "Archimage", etc. | `Lord of Magic` |
| **Highlight** | - | `is_current_student` | Background color/border highlight | Blue/Cyan highlight |

**Display Format with Headers:**
```
#    | Nick    | XP  | Rank
-----|---------|-----|----------
1    | Alex    | 95  | Lord of Magic
2    | Sarah   | 90  | Archimage  ← Highlighted
3    | Mike    | 75  | High Cleric
```

**Column Order:**
1. **#** - Student number
2. **Nick** - Nickname
3. **XP** - Total XP (just the number)
4. **Rank** - Rank title

Rows are sorted by:
1. `ratio` DESC (highest ratio first)
2. `number` ASC (student number as tiebreaker)

## 🎨 Theme Support

The leaderboard supports three themes (light, dark, cyberpunk) using `useTheme()` hook:

### Light Theme
- Current student: Blue highlights (`bg-blue-100`, `text-blue-600`)
- Other students: Default gray text
- Container: White background with gray border

### Dark Theme
- Current student: Blue-400 highlights (`bg-blue-900/30`, `text-blue-400`)
- Other students: Default gray text
- Container: Gray-800 background with gray border

### Cyberpunk Theme
- Current student: Cyan highlights (`bg-cyan-500/20`, `text-cyan-400`)
- Other students: Cyan-300/cyan-200 text
- Container: Gray-900 background with cyan border (`border-cyan-400/30`)
- Title: Uppercase with tracking-wider (`CLASS LEADERBOARD`)

