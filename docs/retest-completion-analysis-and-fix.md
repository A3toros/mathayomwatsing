# Retest Completion Analysis: Web App vs Android App

## Executive Summary

This document analyzes how retest completion is handled in the web app vs Android app, identifies bugs causing completion status leakage between students, and proposes fixes.

---

## 1. WEB APP RETEST COMPLETION FLOW

### 1.1 Keys Written During Retest Submission

**Location:** `src/student/StudentTests.jsx` (lines 876-992)

When a retest is submitted successfully:

1. **Attempt Tracking Keys:**
   - `retest_attempt{N}_{studentId}_{testType}_{testId}` = `'true'`
   - Written for each attempt (1 to maxAttempts)
   - If student **passed**, writes `retest_attempt{maxAttempts}_...` (last slot)
   - If student **failed**, writes next available slot (1, 2, 3, etc.)

2. **Completion Key:**
   - `test_completed_{studentId}_{testType}_{testId}` = `'true'`
   - Written when:
     - Student **passed** (percentage >= 50), OR
     - Attempts **exhausted** (usedAttempts >= maxAttempts)

3. **Metadata Key:**
   - `retest_attempts_{studentId}_{testType}_{testId}` = `JSON.stringify({ used: X, max: Y })`
   - Always written after submission
   - Used by UI to check if attempts are exhausted

4. **Retest Session Keys (DELETED after completion):**
   - `retest1_{studentId}_{testType}_{testId}` - **DELETED** when retest completed
   - `retest_assignment_id_{studentId}_{testType}_{testId}` - **DELETED** when retest completed

### 1.2 Keys Deleted During Retest Submission

**Location:** `src/student/StudentTests.jsx` (lines 926-928, 984-985, 1029-1043)

When retest is completed:
- ✅ `retest1_{studentId}_{testType}_{testId}` - **DELETED**
- ✅ `retest_assignment_id_{studentId}_{testType}_{testId}` - **DELETED**

When retest is **NOT** completed (still has attempts):
- ❌ Keys are **KEPT** (student can retry)

### 1.3 How "Start Retest" Changes to "✓ Completed"

**Location:** `src/student/StudentCabinet.jsx` (lines 464, 976, 989)

1. **Button Logic:**
   ```javascript
   // Check if test is completed
   const testKey = `${test.test_type}_${test.test_id}`;
   if (completedTests.has(testKey) && !test?.retest_available) {
     // Show "✓ Completed" for regular tests
   }
   
   // For retests:
   if (test?.retest_is_completed || localRetestCompleted) {
     // Show "✓ Completed" - API says completed OR local metadata says exhausted
   }
   
   if (test?.retest_available && !test?.retest_is_completed && !localRetestCompleted) {
     // Show "Start Retest" - API says available AND local metadata says not exhausted
   }
   ```

2. **`completedTests` Set Population:**
   - Loaded from `localStorage` keys matching `test_completed_{studentId}_*`
   - Updated when retest submission writes completion key
   - **Per-student** (uses `studentId` in key)

3. **Local Retest Completion Check:**
   - Reads `retest_attempts_{studentId}_{testType}_{testId}` metadata
   - Checks if `used >= max` to determine if locally exhausted

### 1.4 Filtering Out Completed Retests

**Location:** `src/student/StudentCabinet.jsx` (lines 321-405)

1. **API Filtering:**
   - `student_active_tests_view` SQL view excludes rows where `retest_targets.is_completed = TRUE`
   - API endpoint `get-student-active-tests.js` skips rows where `row.retest_is_completed === true`

2. **Frontend Filtering:**
   - Tests with `test.retest_is_completed === true` are filtered out
   - Tests with `completedTests.has(testKey) && !test.retest_available` are filtered out

### 1.5 Where Backend Writes `retest_is_completed = true`

**Location:** All `submit-*-test.js` functions (e.g., `submit-input-test.js` lines 272-293)

When a retest is submitted:
```sql
UPDATE retest_targets
SET 
  attempt_number = ${nextAttemptNumber},
  passed = ${passed},
  is_completed = ${shouldComplete},  -- TRUE when attempts exhausted OR passed
  completed_at = CASE
    WHEN ${shouldComplete} AND completed_at IS NULL THEN NOW()
    ELSE completed_at
  END
WHERE retest_assignment_id = ${retest_assignment_id}
  AND student_id = ${studentId}
```

**Conditions for `is_completed = TRUE`:**
- `attemptsExhausted = (nextAttemptNumber >= maxAttemptsForCompletion)`
- `shouldComplete = attemptsExhausted || passed`
- **Per-student** (WHERE clause includes `student_id`)

---

## 2. ANDROID APP RETEST COMPLETION FLOW

### 2.1 Keys Written During Retest Submission

**Location:** `MWSExpo/src/utils/retestUtils.ts` - `handleRetestCompletion()` (lines 169-255)

When a retest is submitted successfully:

1. **Attempt Tracking Keys:**
   - `retest_attempt{N}_{studentId}_{testType}_{testId}` = `'true'`
   - Same pattern as web app

2. **Completion Key:**
   - `test_completed_{studentId}_{testType}_{testId}` = `'true'`
   - Written when `attemptsLeft <= 0 || passedNow`

3. **Metadata Key:**
   - `retest_attempts_{studentId}_{testType}_{testId}` = `JSON.stringify({ used: X, max: Y })`
   - Always written after submission

4. **Retest Session Keys:**
   - `retest1_{studentId}_{testType}_{testId}` - **NOT DELETED** in `handleRetestCompletion`
   - `retest_assignment_id_{studentId}_{testType}_{testId}` - **NOT DELETED** in `handleRetestCompletion`

### 2.2 Keys Deleted During Retest Submission

**Location:** `MWSExpo/src/utils/retestUtils.ts` - `clearRetestKeys()` (lines 65-79)

**BUG:** `clearRetestKeys()` is called by `markTestCompleted()` but **NOT** by `handleRetestCompletion()`.

**Current Behavior:**
- `handleRetestCompletion()` does **NOT** delete `retest1_*` or `retest_assignment_id_*` keys
- These keys persist even after retest completion
- **This is different from web app behavior**

### 2.3 How "Start Retest" Changes to "✓ Completed"

**Location:** `MWSExpo/src/components/dashboard/ActiveTestsView.tsx` (lines 146-260)

1. **Button Logic:**
   ```typescript
   // Check retest completion from API
   if (test?.retest_is_completed) {
     return <ThemedButton disabled title="✓ Completed" />;
   }
   
   // Show completed status for regular tests
   if (isCompleted && !test?.retest_available) {
     return <ThemedButton disabled title="✓ Completed" />;
   }
   
   // If retest is available and not completed (from API), show Start Retest
   if (test?.retest_available && !test?.retest_is_completed) {
     const attemptsLeft = test.retest_attempts_left || 0;
     if (attemptsLeft > 0) {
       return <ThemedButton title="Start Retest" />;
     }
   }
   ```

2. **`completedTests` Set Population:**
   - **Location:** `MWSExpo/app/(tabs)/index.tsx` (lines 178-215)
   - Loaded from AsyncStorage keys matching `test_completed_{studentId}_*`
   - **BUG:** Keys from **previous student** are not cleared on logout/login

3. **Local Retest Completion Check:**
   - **NOT USED** in button logic
   - Metadata is loaded but not checked for completion status
   - Relies entirely on API `retest_is_completed` flag

### 2.4 Filtering Out Completed Retests

**Location:** `MWSExpo/src/components/dashboard/ActiveTestsView.tsx` (lines 117-122)

**Current Code:**
```typescript
.filter(test => {
  // ⚠️ REMOVED: Filtering is now handled by student_active_tests_view at SQL level
  // View already excludes completed retests, so we don't need to filter here
  // Just return all tests from API
  return true;
})
```

**BUG:** No frontend filtering - relies entirely on API. If API returns a completed retest (due to cache or race condition), it will be displayed.

---

## 3. IDENTIFIED BUGS

### Bug #1: Completion Status Leakage Between Students

**Root Cause:**
- `test_completed_{studentId}_*` keys are **NOT cleared** on logout
- When Student B logs in, they inherit Student A's completion keys
- `completedTests` set includes keys from previous student

**Evidence:**
- `MWSExpo/app/(tabs)/index.tsx` (lines 178-215) loads all keys matching `test_completed_{studentId}_*`
- If Student A's ID was `70001` and Student B's ID is `70002`, keys are different
- **BUT:** If keys are loaded with wrong `studentId` pattern, or if `studentId` extraction fails, old keys persist

**Fix Required:**
1. Clear all `test_completed_*`, `retest_attempts_*`, `retest_attempt*_*`, `retest1_*`, `retest_assignment_id_*` keys on logout
2. Clear keys on login (before loading new student's data)
3. Ensure `studentId` extraction is correct before loading keys

### Bug #2: `retest1_*` Keys Not Deleted After Completion

**Root Cause:**
- `handleRetestCompletion()` does not call `clearRetestKeys()`
- Web app deletes these keys (lines 927-928, 984-985)
- Android app keeps them, causing confusion

**Fix Required:**
- Call `clearRetestKeys()` in `handleRetestCompletion()` when `shouldComplete === true`

### Bug #3: No Frontend Filtering of Completed Retests

**Root Cause:**
- `ActiveTestsView` removed filtering logic (line 117-122)
- Relies entirely on API, but API may return stale data due to caching

**Fix Required:**
- Add frontend filter: `if (test.retest_is_completed) return false;`
- Also check local metadata: `if (attemptsLeft <= 0) return false;`

### Bug #4: `completedTests` Set Includes Wrong Student's Keys

**Root Cause:**
- When loading `completedTests`, if `studentId` is wrong or missing, keys from previous student are loaded
- No validation that keys belong to current student

**Fix Required:**
- Validate `studentId` before loading keys
- Clear all completion-related keys on logout/login
- Only load keys that match current `studentId` exactly

---

## 4. PROPOSED FIXES

### Fix #1: Clear All Student-Specific Keys on Logout/Login

**File:** `MWSExpo/src/contexts/AuthContext.tsx` (or wherever logout is handled)

**Add function:**
```typescript
export async function clearStudentKeys(studentId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const patterns = [
      `test_completed_${studentId}_`,
      `retest_attempts_${studentId}_`,
      `retest_attempt`,
      `retest1_${studentId}_`,
      `retest_assignment_id_${studentId}_`,
    ];
    
    const toRemove = keys.filter(key => {
      return patterns.some(pattern => key.includes(pattern));
    });
    
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
      console.log('🧹 Cleared student keys on logout:', toRemove.length, 'keys');
    }
  } catch (e) {
    console.error('Error clearing student keys:', e);
  }
}
```

**Call on logout:**
```typescript
const logout = async () => {
  const currentStudentId = await AsyncStorage.getItem('auth_token')
    .then(token => {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.student_id;
      }
      return null;
    });
  
  if (currentStudentId) {
    await clearStudentKeys(currentStudentId);
  }
  
  // ... rest of logout logic
};
```

**Call on login (before loading data):**
```typescript
const login = async (credentials) => {
  // ... login logic
  
  // Clear any stale keys before loading new student's data
  const newStudentId = user.student_id;
  await clearStudentKeys(newStudentId); // Clear old keys if any
  
  // ... load new student's data
};
```

### Fix #2: Delete `retest1_*` Keys in `handleRetestCompletion()`

**File:** `MWSExpo/src/utils/retestUtils.ts`

**Modify `handleRetestCompletion()`:**
```typescript
export async function handleRetestCompletion(
  studentId: string,
  testType: string,
  testId: string | number,
  maxAttempts: number,
  percentage: number,
  passed: boolean
): Promise<void> {
  // ... existing code ...
  
  if (shouldComplete) {
    // Mark retest as completed
    const completionKey = `test_completed_${studentId}_${testType}_${testIdStr}`;
    await AsyncStorage.setItem(completionKey, 'true');
    
    // Set metadata
    const attemptsMetaKey = `retest_attempts_${studentId}_${testType}_${testIdStr}`;
    await AsyncStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
    
    // ✅ FIX: Clear retest session keys (same as web app)
    await clearRetestKeys(studentId, testType, testIdStr);
  } else {
    // Still have attempts left - set metadata but don't mark as completed
    const attemptsMetaKey = `retest_attempts_${studentId}_${testType}_${testIdStr}`;
    await AsyncStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
  }
}
```

### Fix #3: Add Frontend Filtering in `ActiveTestsView`

**File:** `MWSExpo/src/components/dashboard/ActiveTestsView.tsx`

**Modify filter:**
```typescript
.filter(test => {
  // Filter out completed retests (from API)
  if (test.retest_is_completed) {
    return false;
  }
  
  // Filter out completed regular tests (no retest available)
  const testKey = `${test.test_type}_${test.test_id}`;
  if (completedTests.has(testKey) && !test?.retest_available) {
    return false;
  }
  
  // Filter out retests with exhausted attempts (local metadata check)
  if (test.retest_available && !test.retest_is_completed) {
    const attemptsMetaKey = `retest_attempts_${studentId}_${test.test_type}_${test.test_id}`;
    const attemptsMeta = retestAttempts[attemptsMetaKey];
    if (attemptsMeta && attemptsMeta.used >= attemptsMeta.max) {
      return false; // Locally exhausted, filter out
    }
  }
  
  return true;
})
```

### Fix #4: Validate `studentId` Before Loading Keys

**File:** `MWSExpo/app/(tabs)/index.tsx`

**Modify key loading (lines 178-215):**
```typescript
// Load completed tests from AsyncStorage (web app pattern)
const completed = new Set<string>();
try {
  // ✅ FIX: Validate studentId before loading keys
  if (!studentId || studentId.trim() === '') {
    console.warn('🎓 Cannot load completion keys - studentId is missing');
    setCompletedTests(completed);
    setIsCompletionStatusLoaded(true);
    return;
  }
  
  const keys = await AsyncStorage.getAllKeys();
  const completionKeys = keys.filter(key => {
    // ✅ FIX: Exact match pattern with studentId
    const pattern = `test_completed_${studentId}_`;
    return key.startsWith(pattern);
  });
  
  console.log('🎓 Dashboard: Looking for completion keys with pattern:', `test_completed_${studentId}_`);
  console.log('🎓 Dashboard: Found completion keys:', completionKeys);
  
  for (const key of completionKeys) {
    const value = await AsyncStorage.getItem(key);
    if (value === 'true') {
      // Extract test type and ID from key (format: test_completed_studentId_type_id)
      const parts = key.replace(`test_completed_${studentId}_`, '').split('_');
      if (parts.length >= 2) {
        const testType = parts[0];
        const testId = parts.slice(1).join('_');
        const testKey = `${testType}_${testId}`;
        completed.add(testKey);
        console.log('🎓 Found completed test in AsyncStorage:', testKey);
      }
    }
  }
} catch (completionError) {
  console.warn('Error loading completion status:', completionError);
}
setCompletedTests(completed);
setIsCompletionStatusLoaded(true);
```

---

## 5. TESTING CHECKLIST

After implementing fixes:

1. **Student A completes retest:**
   - ✅ Retest shows "✓ Completed" for Student A
   - ✅ Retest is filtered out from active list for Student A
   - ✅ `retest1_*` and `retest_assignment_id_*` keys are deleted

2. **Student A logs out:**
   - ✅ All `test_completed_*`, `retest_attempts_*`, `retest_attempt*_*`, `retest1_*`, `retest_assignment_id_*` keys are deleted

3. **Student B logs in on same device:**
   - ✅ Student B sees retest as "Start Retest" (not completed)
   - ✅ No completion keys from Student A are present
   - ✅ `completedTests` set is empty or only contains Student B's keys

4. **Student B completes retest:**
   - ✅ Retest shows "✓ Completed" for Student B only
   - ✅ Student A's completion status is not affected

5. **Refresh dashboard:**
   - ✅ Completed retests remain filtered out
   - ✅ No race conditions causing completed retests to reappear

---

## 6. SUMMARY

**Web App Behavior:**
- ✅ Deletes `retest1_*` keys after completion
- ✅ Filters completed retests in frontend
- ✅ Uses per-student keys (no leakage)

**Android App Bugs:**
- ❌ Does not delete `retest1_*` keys after completion
- ❌ Does not filter completed retests in frontend
- ❌ Does not clear keys on logout/login (leakage between students)

**Fixes Required:**
1. Clear all student-specific keys on logout/login
2. Delete `retest1_*` keys in `handleRetestCompletion()` when completed
3. Add frontend filtering in `ActiveTestsView`
4. Validate `studentId` before loading keys

