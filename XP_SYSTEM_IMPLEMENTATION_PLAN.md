# XP System and Class Leaderboard Implementation Plan

## Overview
This document outlines the plan to implement an XP (Experience Points) system for students and a class leaderboard feature in the Android app dashboard.

---

## 1. Database Schema Changes

**✅ NO SCHEMA CHANGES NEEDED**

We will use the existing `teacher_student_results_view` directly with an optimized query. No additional views needed.

**View to use:**
- `teacher_student_results_view` - Contains all required fields: score, max_score, student_id, grade, class, number, nickname, is_completed

**Approach:**
- Query `teacher_student_results_view` directly in the API function
- Single optimized query with minimal computation
- Calculate XP on-the-fly from score/max_score ratio

---

## 2. XP Calculation Logic

### 2.1 XP Scoring Rules
- **10% score = 1 XP point**
- **20% score = 2 XP points**
- **30% score = 3 XP points**
- **40% score = 4 XP points**
- **50% score = 5 XP points**
- **60% score = 6 XP points**
- **70% score = 7 XP points**
- **80% score = 8 XP points**
- **90% score = 9 XP points**
- **100% score = 10 XP points**

**Formula:** `xp_earned = Math.floor((percentage_score / 10))`
- Where `percentage_score = (score / max_score) * 100`
- Minimum 1 XP for scores 10% and above
- 0 XP for scores below 10%

### 2.2 Test Counting (Simplified)
- **No retest tracking** - All completed tests count toward XP
- Simple calculation: `score/max_score` → percentage → XP points
- Minimum computation for fast API response time

---

## 3. Backend Implementation

### 3.1 No Changes Needed to Submit Test Functions

**✅ XP calculation is done dynamically from views - no need to update submit functions!**

The existing test submission functions already save `score`, `max_score`, and `retest_assignment_id` to result tables. These are already captured in the views (`student_test_results_view`, `all_test_results_view`, etc.).

**Why this approach is better:**
- ✅ No database writes needed - XP is calculated on-demand
- ✅ Always accurate - reflects current test results
- ✅ No risk of data inconsistency
- ✅ Simpler implementation - just query the views
- ✅ Works retroactively - all historical test data is available

### 3.2 Create Leaderboard API Endpoint (OPTIMIZED - Using Views)
**New file:** `functions/get-class-leaderboard.js`

**Purpose:** Fetch leaderboard data for a specific class showing students ranked by XP/max_xp ratio, calculated dynamically from test results.

**HTTP Method:** GET

**Authentication:** JWT Bearer token (student role required)

**Parameters:** None (extracted from JWT token)
- `grade` - Extracted from JWT token (decoded.grade)
- `class` - Extracted from JWT token (decoded.class)
- `student_id` - Extracted from JWT token (decoded.sub) for highlighting

**Response format:**
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
    ...
  ]
}
```

**SIMPLIFIED SQL Query (Minimum Compute - Just score/max_score):**
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

**Complete Function Code Structure:**
Following the pattern from `get-student-active-tests.js` and using `validateToken` helper:

```javascript
const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  // CORS headers with Authorization support
  const allowedOrigins = [
    'https://mathayomwatsing.netlify.app',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:19000'
  ];
  
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
    const tokenValidation = validateToken(event);
    
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: tokenValidation.error
        })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Validate role - must be student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Access denied. Student role required.'
        })
      };
    }

    // Extract grade, class, and student_id from JWT token
    const grade = userInfo.grade;
    const className = userInfo.class;
    const student_id = userInfo.student_id;

    // Convert class format if needed (e.g., "1/15" -> 15)
    let classNumber = className;
    if (typeof className === 'string' && className.includes('/')) {
      classNumber = parseInt(className.split('/')[1]);
    } else {
      classNumber = parseInt(className) || className;
    }

    // Convert grade format if needed (e.g., "M1" -> 1)
    let gradeNumber = grade;
    if (typeof grade === 'string' && grade.startsWith('M')) {
      gradeNumber = parseInt(grade.replace('M', ''));
    } else {
      gradeNumber = parseInt(grade) || grade;
    }

    if (!gradeNumber || !classNumber || !student_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing grade, class, or student_id in token'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Query leaderboard using optimized SQL
    const leaderboard = await sql`
      WITH student_stats AS (
        SELECT 
          v.student_id,
          v.number,
          v.nickname,
          SUM(CASE 
            WHEN v.max_score > 0 AND (v.score::DECIMAL / v.max_score::DECIMAL * 100) >= 10
            THEN FLOOR((v.score::DECIMAL / v.max_score::DECIMAL * 100) / 10)
            ELSE 0
          END) as xp,
          COUNT(*) * 10 as max_xp
        FROM teacher_student_results_view v
        WHERE v.grade = ${gradeNumber}
          AND v.class = ${classNumber}
          AND v.is_completed = true
        GROUP BY v.student_id, v.number, v.nickname
      )
      SELECT 
        u.number,
        u.nickname,
        COALESCE(ss.xp, 0) as xp,
        COALESCE(ss.max_xp, 0) as max_xp,
        CASE 
          WHEN COALESCE(ss.max_xp, 0) > 0 
          THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
          ELSE 0
        END as ratio,
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
      WHERE u.grade = ${gradeNumber} 
        AND u.class = ${classNumber}
        AND u.is_active = true
      ORDER BY 
        CASE 
          WHEN COALESCE(ss.max_xp, 0) > 0 
          THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
          ELSE 0
        END DESC,
        u.number ASC
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      },
      body: JSON.stringify({
        success: true,
        leaderboard: leaderboard
      })
    };
  } catch (error) {
    console.error('Error fetching class leaderboard:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};
```

**Performance Optimizations (Minimum Compute):**
1. **Uses validateToken helper** - Consistent with other functions
2. **Extracts data from JWT** - No query parameters needed
3. **Single CTE query** - One aggregation pass, no retest filtering
4. **Simple calculation** - Just `score/max_score` → XP per test → sum
5. **Direct aggregation** - Groups by student, calculates in one step
6. **No database writes** - Pure read-only operation
7. **Fast execution** - Minimal computation, leverages existing indexes
8. **Caching headers** - 60s cache for performance

---

## 4. Frontend Implementation (Android App)

### 4.1 Update Dashboard View Component
**File:** `MWSExpo/src/components/dashboard/DashboardView.tsx`

#### Changes required:

1. **Add state for leaderboard data:**
```typescript
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
```

2. **Add API service method** (in `MWSExpo/src/services/apiClient.ts` or create new service):
```typescript
async getClassLeaderboard(grade: string, class: string): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get('/api/leaderboard/class', {
    params: { grade, class }
  });
  return response.data.leaderboard;
}
```

3. **Fetch leaderboard data:**
Add useEffect to fetch leaderboard when component mounts or when user data changes.

4. **Add leaderboard UI component with theme support:**
Insert below the average score display (around line 209 in DashboardView.tsx, after subject performance cards):

**Theme Support:** Uses existing `themeMode` (light, dark, cyberpunk) and `themeClasses` from `useTheme()` hook

```typescript
{/* Class Leaderboard Section */}
{leaderboard.length > 0 && (
  <View className="px-4 mb-6">
    <Text className={`text-lg font-bold mb-3 ${
      themeMode === 'cyberpunk'
        ? 'text-cyan-400 tracking-wider'
        : themeClasses.text
    }`}>
      {themeMode === 'cyberpunk' ? 'CLASS LEADERBOARD' : 'Class Leaderboard'}
    </Text>
    <View className={`rounded-xl p-4 ${
      themeMode === 'cyberpunk'
        ? 'bg-gray-900 border border-cyan-400/30'
        : themeMode === 'dark'
        ? 'bg-gray-800 border border-gray-600'
        : 'bg-white border border-gray-200'
    }`}>
      {/* Table Headers */}
      <View className={`flex-row items-center justify-between py-2 px-3 mb-2 border-b ${
        themeMode === 'cyberpunk'
          ? 'border-cyan-400/30'
          : themeMode === 'dark'
          ? 'border-gray-600'
          : 'border-gray-200'
      }`}>
        <Text className={`text-xs font-bold uppercase tracking-wider ${
          themeMode === 'cyberpunk'
            ? 'text-cyan-400'
            : themeClasses.textSecondary
        }`}>
          #
        </Text>
        <Text className={`text-xs font-bold uppercase tracking-wider flex-1 ml-3 ${
          themeMode === 'cyberpunk'
            ? 'text-cyan-400'
            : themeClasses.textSecondary
        }`}>
          Nick
        </Text>
        <Text className={`text-xs font-bold uppercase tracking-wider ${
          themeMode === 'cyberpunk'
            ? 'text-cyan-400'
            : themeClasses.textSecondary
        }`}>
          XP
        </Text>
        <Text className={`text-xs font-bold uppercase tracking-wider ml-3 ${
          themeMode === 'cyberpunk'
            ? 'text-cyan-400'
            : themeClasses.textSecondary
        }`}>
          Rank
        </Text>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.number.toString()}
        renderItem={({ item }) => (
          <View className={`flex-row items-center justify-between py-2 px-3 mb-2 rounded-lg ${
            item.is_current_student
              ? themeMode === 'cyberpunk'
                ? 'bg-cyan-500/20 border border-cyan-400'
                : themeMode === 'dark'
                ? 'bg-blue-900/30 border border-blue-400'
                : 'bg-blue-100 border border-blue-300'
              : themeMode === 'cyberpunk'
              ? 'hover:bg-gray-800/50'
              : ''
          }`}>
            <View className="flex-row items-center flex-1">
              <Text className={`text-lg font-semibold mr-3 ${
                item.is_current_student
                  ? themeMode === 'cyberpunk' 
                    ? 'text-cyan-400' 
                    : themeMode === 'dark'
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : themeMode === 'cyberpunk'
                  ? 'text-cyan-300'
                  : themeClasses.text
              }`}>
                {item.number}
              </Text>
              <Text className={`text-base flex-1 ${
                item.is_current_student
                  ? themeMode === 'cyberpunk' 
                    ? 'text-cyan-300' 
                    : themeMode === 'dark'
                    ? 'text-blue-300'
                    : 'text-blue-700'
                  : themeMode === 'cyberpunk'
                  ? 'text-cyan-200'
                  : themeClasses.text
              }`}>
                {item.nickname}
              </Text>
            </View>
            <Text className={`text-sm font-semibold mr-3 ${
              item.is_current_student
                ? themeMode === 'cyberpunk' 
                  ? 'text-cyan-400' 
                  : themeMode === 'dark'
                  ? 'text-blue-400'
                  : 'text-blue-600'
                : themeMode === 'cyberpunk'
                ? 'text-cyan-300'
                : themeClasses.textSecondary
            }`}>
              {item.xp}
            </Text>
            <Text className={`text-sm font-semibold ${
              item.is_current_student
                ? themeMode === 'cyberpunk' 
                  ? 'text-cyan-400' 
                  : themeMode === 'dark'
                  ? 'text-blue-400'
                  : 'text-blue-600'
                : themeMode === 'cyberpunk'
                ? 'text-cyan-300'
                : themeClasses.textSecondary
            }`}>
              {item.rank_title}
            </Text>
          </View>
        )}
      />
    </View>
  </View>
)}
```

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

**Theme Colors:**
- **Light:** Blue highlights for current student, gray text for others
- **Dark:** Blue-400 highlights for current student, gray text for others  
- **Cyberpunk:** Cyan-400 highlights for current student, cyan-300/cyan-200 text for others

### 4.2 Add Type Definitions
**File:** `MWSExpo/src/types/index.ts`

Add new interface:
```typescript
export interface LeaderboardEntry {
  number: number;
  nickname: string;
  xp: number;
  max_xp: number;
  ratio: number;
  rank_title: string;
  is_current_student: boolean;
}
```

### 4.3 Create Leaderboard Service
**New file:** `MWSExpo/src/services/leaderboardService.ts`

```typescript
import { apiClient } from './apiClient';
import { LeaderboardEntry } from '../types';

export const leaderboardService = {
  async getClassLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      // No params needed - grade/class/student_id extracted from JWT token in backend
      const response = await apiClient.get('/.netlify/functions/get-class-leaderboard');
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch class leaderboard:', error);
      return [];
    }
  }
};
```

**Note:** The API endpoint extracts `grade`, `class`, and `student_id` from the JWT token automatically, so no parameters need to be passed from the Android app.

---

## 5. Rank Title System

### 5.1 Rank Calculation
Based on `XP / max_xp` ratio:

- **0.95 - 1.0** → "Lord of Magic"
- **0.9 - 0.95** → "Archimage"
- **0.8 - 0.9** → "Grand Sorcerer"
- **0.7 - 0.8** → "High Cleric"
- **0.6 - 0.7** → "Adept Mage"
- **0.5 - 0.6** → "Apprentice Mage"
- **0.4 - 0.5** → "Initiate"
- **0.0 - 0.4** → "Muggle"

**Implementation:** This logic should be in the SQL query (see section 3.2) and optionally in TypeScript for client-side calculations.

---

## 6. Implementation Checklist

### Database
- [ ] ✅ **NO SCHEMA CHANGES NEEDED** - Using existing view directly
- [ ] Verify `teacher_student_results_view` exists and contains required fields:
  - `score`, `max_score`, `student_id`, `grade`, `class`, `number`, `nickname`, `is_completed`

### Backend Functions
- [ ] ✅ **NO CHANGES TO SUBMIT FUNCTIONS** - XP calculated dynamically
- [ ] Create `get-class-leaderboard.js` function (new endpoint)
- [ ] Test leaderboard API endpoint with various class/grade combinations
- [ ] Test XP calculation with various score percentages
- [ ] Test leaderboard with students who have no tests

### Frontend (Android App)
- [ ] Add `LeaderboardEntry` type definition
- [ ] Create leaderboard service
- [ ] Update `DashboardView.tsx` to fetch and display leaderboard
- [ ] Add leaderboard UI component below average score
- [ ] Style leaderboard with current student highlighting
- [ ] Test leaderboard display and data fetching

### Testing
- [ ] Test XP calculation with various score percentages
- [ ] Test that retests do not award XP
- [ ] Test leaderboard API endpoint
- [ ] Test leaderboard display in Android app
- [ ] Test highlighting of current student
- [ ] Test rank title calculations

---

## 7. Notes and Considerations

### 7.1 XP Accumulation (OPTIMIZED - Dynamic Calculation)
- XP is calculated **dynamically** from test results in views
- **No database storage needed** - computed on-the-fly from `score / max_score` ratio
- Each test contributes:
  - **XP earned:** `FLOOR((score / max_score * 100) / 10)` (1-10 based on percentage)
  - **Max XP per test:** Always 10 (each test = 10 max_xp possible)
- **Max XP total:** `COUNT(completed_tests) * 10` (count of non-retest tests × 10)

**Why this approach is optimal:**
1. **No database writes** - Pure read operation from views
2. **Always accurate** - Reflects current test results
3. **Works retroactively** - All historical test data included
4. **No data consistency issues** - Single source of truth (test results)
5. **Fast queries** - Views are optimized with indexes
6. **Simple implementation** - Just query and aggregate

**Formula:**
- **XP per test:** `FLOOR((percentage_score) / 10)` where `percentage_score = (score / max_score) * 100`
- **Total XP:** `SUM(xp_earned)` across all completed tests
- **Total Max XP:** `COUNT(completed_tests) * 10`
- **Ratio:** `total_xp / total_max_xp` (for leaderboard ranking)

### 7.2 Simplified Approach
- **No retest filtering** - All completed tests count
- Simple aggregation: sum of `score/max_score` calculations
- Fast query execution with minimal computation

### 7.4 Leaderboard Display
- Show only students from the same class
- Use `number` field from users table (not student_id)
- Show nickname
- Show rank title based on XP/max_xp ratio
- Highlight current student's row
- Sort by ratio descending, then by number ascending

---

## 8. Files Summary

### Files to Create:
1. `functions/get-class-leaderboard.js` - Leaderboard API endpoint
2. `MWSExpo/src/services/leaderboardService.ts` - Frontend leaderboard service (optional)

### Files to Modify:

9. `MWSExpo/src/components/dashboard/DashboardView.tsx` - Add leaderboard UI
10. `MWSExpo/src/types/index.ts` - Add LeaderboardEntry type

---

## 9. Implementation Order

1. **Phase 1: Database Schema**
   - Add XP columns to users table
   - Test migration

2. **Phase 2: Backend XP Calculation**
   - Update all 7 submit test functions
   - Test XP calculation with various scores
   - Verify retest exclusion works

3. **Phase 3: Leaderboard API**
   - Create get-class-leaderboard.js function
   - Test API endpoint

4. **Phase 4: Frontend Integration**
   - Add type definitions
   - Create leaderboard service
   - Update DashboardView component
   - Test UI display and highlighting

---

## 10. Open Questions / Decisions Needed

1. **XP Initialization:** Should existing users have their XP initialized to 0, or should we calculate XP retroactively from existing test results?
   - **Decision:** Initialize to 0 for new implementation; retroactive calculation can be done separately if needed

2. **Leaderboard Refresh:** Should leaderboard auto-refresh when tests are completed, or only on manual refresh?
   - **Recommendation:** Manual refresh initially; can add auto-refresh later if needed

3. **Empty Leaderboard:** How should we handle classes with no test completions yet?
   - **Recommendation:** Show empty state message "No test results yet" or hide leaderboard section until at least one test is completed

**Note:** Max XP calculation is resolved - `max_xp` increments by 10 for each test taken, making it cumulative across all tests.

---

**Document Version:** 1.0  
**Created:** [Date]  
**Last Updated:** [Date]

