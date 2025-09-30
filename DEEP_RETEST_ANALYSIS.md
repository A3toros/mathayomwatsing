# DEEP ANALYSIS: Real Problems in the Retest System

## CRITICAL ISSUES IDENTIFIED

### 1. **FUNDAMENTAL FLAW: Mixed localStorage and Database Logic**

**Problem**: The system tries to use BOTH localStorage attempt tracking AND database attempt tracking, creating conflicts.

**Evidence**:
```javascript
// StudentCabinet.jsx - Line 264-284
// Check localStorage attempt tracking with descriptive keys
const attemptKeys = [];
for (let i = 1; i <= 10; i++) {
  const key = `retest_attempt${i}_${studentId}_${testType}_${testId}`;
  if (localStorage.getItem(key) === 'true') {
    attemptKeys.push(key);
  }
}
const currentAttempts = attemptKeys.length;
const maxAttempts = testData?.retest_attempts_left || testData?.max_attempts || 3;
```

**BUT ALSO**:
```javascript
// functions/get-student-active-tests.js - Line 306-316
const retestRows = await sql`
  SELECT rt.id as retest_target_id, rt.attempt_count, ra.id as retest_assignment_id, ra.max_attempts
  FROM retest_targets rt
  JOIN retest_assignments ra ON ra.id = rt.retest_assignment_id
  WHERE rt.student_id = ${student_id}
    AND ra.test_type = ${assignment.test_type}
    AND ra.test_id = ${assignment.test_id}
    AND NOW() BETWEEN ra.window_start AND ra.window_end
    AND (rt.status = 'PENDING' OR rt.status = 'FAILED')
    AND (ra.max_attempts IS NULL OR rt.attempt_count < ra.max_attempts)
`;
```

**ISSUE**: The system checks localStorage for attempt count, but the database already tracks this in `retest_targets.attempt_count`. This creates a **dual tracking system that can get out of sync**.

### 2. **BROKEN ATTEMPT NUMBER CALCULATION**

**Problem**: The attempt number calculation in backend is flawed.

**Evidence**:
```javascript
// functions/submit-multiple-choice-test.js - Line 217-223
const existingAttempts = await sql`
  SELECT MAX(attempt_number) as max_attempt 
  FROM test_attempts 
  WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
`;
const nextAttemptNumber = (existingAttempts[0]?.max_attempt || 0) + 1;
```

**ISSUE**: This queries `test_attempts` table, but for retests, we should be using the `retest_targets.attempt_count` which is the **authoritative source**. The `test_attempts` table might not have the correct data if there were previous issues.

### 3. **INCONSISTENT RETEST DETECTION LOGIC**

**Problem**: The retest availability check has conflicting conditions.

**Evidence**:
```javascript
// functions/get-student-active-tests.js - Line 314
AND (rt.status = 'PENDING' OR rt.status = 'FAILED')
```

**BUT ALSO**:
```javascript
// functions/get-student-active-tests.js - Line 315
AND (ra.max_attempts IS NULL OR rt.attempt_count < ra.max_attempts)
```

**ISSUE**: The status check allows `'PENDING'` OR `'FAILED'`, but the attempt count check is separate. This means a student could have `status = 'FAILED'` but `attempt_count < max_attempts`, creating confusion about whether they can retest.

### 4. **MISSING RETEST KEY SETTING**

**Problem**: The `retest1_` key is never actually set in localStorage.

**Evidence**:
```javascript
// functions/get-student-active-tests.js - Line 325
retestKey = `retest1_${student_id}_${assignment.test_type}_${assignment.test_id}`;
```

**BUT**: This key is only **returned** from the backend, never **set** in localStorage. The frontend expects this key to exist to identify retests.

### 5. **BROKEN RETEST SUBMISSION FLOW**

**Problem**: The retest submission doesn't properly update the authoritative database records.

**Evidence**:
```javascript
// functions/submit-multiple-choice-test.js - Line 225-242
// Writes to test_attempts with detailed data
result = await sql`
  INSERT INTO test_attempts (
    student_id, test_id, attempt_number, score, max_score, percentage, 
    time_taken, started_at, submitted_at, is_completed,
    answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
    retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
    name, surname, nickname, academic_period_id
  )
  VALUES (...)
`;
```

**MISSING**: No update to `retest_targets.attempt_count` and `retest_targets.status` in the retest submission flow.

### 6. **INCONSISTENT DATABASE SCHEMA**

**Problem**: The `test_attempts` table may not have all the required columns.

**Evidence**: The INSERT statement tries to insert into columns that may not exist:
- `answers JSONB`
- `answers_by_id JSONB` 
- `question_order JSONB`
- `caught_cheating BOOLEAN`
- `visibility_change_times INTEGER`
- `retest_assignment_id INTEGER`
- `test_name TEXT`
- `teacher_id TEXT`
- `subject_id INTEGER`
- `grade INTEGER`
- `class INTEGER`
- `number INTEGER`
- `name TEXT`
- `surname TEXT`
- `nickname TEXT`
- `academic_period_id INTEGER`

### 7. **FRONTEND RETEST DETECTION FAILURE**

**Problem**: The frontend retest detection relies on localStorage keys that are never set.

**Evidence**:
```javascript
// StudentTests.jsx - Line 605-606
const retestKey = `retest1_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
const isRetest = localStorage.getItem(retestKey) === 'true';
```

**ISSUE**: The `retest1_` key is never set anywhere in the codebase. The frontend can't detect if it's a retest.

### 8. **ATTEMPT TRACKING LOGIC FLAWS**

**Problem**: The attempt tracking logic is overly complex and error-prone.

**Evidence**:
```javascript
// StudentTests.jsx - Line 608-617
if (isRetest) {
  // Find the next attempt number
  let nextAttemptNumber = 1;
  for (let i = 1; i <= 10; i++) {
    const key = `retest_attempt${i}_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
    if (localStorage.getItem(key) !== 'true') {
      nextAttemptNumber = i;
      break;
    }
  }
```

**ISSUE**: This logic assumes localStorage is the source of truth, but the database should be authoritative. The frontend shouldn't be calculating attempt numbers.

## ROOT CAUSE ANALYSIS

### The Core Problem: **Dual Authority System**

The system has **two sources of truth**:
1. **Database**: `retest_targets.attempt_count` and `retest_targets.status`
2. **localStorage**: `retest_attempt${i}_` keys

This creates a **distributed state problem** where the two systems can get out of sync.

### The Real Issues:

1. **No Single Source of Truth**: Database and localStorage track the same data
2. **Missing Database Updates**: Retest submissions don't update `retest_targets`
3. **Broken Key Management**: `retest1_` key is never set
4. **Schema Mismatch**: `test_attempts` table missing required columns
5. **Complex Logic**: Frontend tries to calculate attempt numbers instead of trusting backend

## WHAT SHOULD HAPPEN (Correct Flow)

### 1. Teacher Creates Retest
```sql
-- Creates retest_assignments and retest_targets records
-- Sets status = 'PENDING', attempt_count = 0
```

### 2. Student Sees Retest
```javascript
// Backend: get-student-active-tests.js
// Check retest_targets for availability
// Return retest_available: true if status = 'PENDING' and attempt_count < max_attempts
```

### 3. Student Starts Retest
```javascript
// Frontend: Set retest1_ key in localStorage
localStorage.setItem(`retest1_${studentId}_${testType}_${testId}`, 'true');
```

### 4. Student Submits Retest
```javascript
// Backend: submit-*-test.js
// 1. Write to test_attempts with attempt_number = retest_targets.attempt_count + 1
// 2. Update retest_targets.attempt_count += 1
// 3. Update retest_targets.status = 'IN_PROGRESS' or 'PASSED'/'FAILED'
```

### 5. Check Completion
```javascript
// Frontend: Check retest_targets.status and attempt_count from backend
// Don't use localStorage for attempt counting
```

## REQUIRED FIXES

### 1. **Fix Database Schema**
```sql
-- Apply test_attempts_enhancement.sql
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS answers JSONB;
-- ... etc
```

### 2. **Fix Retest Detection**
```javascript
// functions/get-student-active-tests.js
// Use retest_targets as single source of truth
// Don't rely on localStorage for attempt counting
```

### 3. **Fix Retest Submission**
```javascript
// functions/submit-*-test.js
// 1. Get attempt_count from retest_targets
// 2. Write to test_attempts with correct attempt_number
// 3. Update retest_targets.attempt_count and status
```

### 4. **Fix Frontend Logic**
```javascript
// StudentCabinet.jsx
// Use backend retest_available flag only
// Don't check localStorage attempt counts
```

### 5. **Fix Key Management**
```javascript
// StudentTests.jsx
// Set retest1_ key when starting retest
// Use backend data for attempt tracking
```

## CONCLUSION

The retest system is **fundamentally broken** due to:
1. **Dual authority system** (database + localStorage)
2. **Missing database updates** in retest submissions
3. **Broken key management** (keys never set)
4. **Schema mismatches** (missing columns)
5. **Overly complex logic** (frontend calculating attempt numbers)

The system needs a **complete rewrite** of the retest flow to use the database as the single source of truth and eliminate the localStorage attempt tracking system.
