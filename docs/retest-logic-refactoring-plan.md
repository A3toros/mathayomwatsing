# Retest Logic Refactoring Plan

## Problem Statement

Currently, retest completion logic is duplicated across all 8 test type files in the Android app:
- `MWSExpo/app/tests/true-false/[testId]/index.tsx`
- `MWSExpo/app/tests/input/[testId]/index.tsx`
- `MWSExpo/app/tests/multiple-choice/[testId]/index.tsx`
- `MWSExpo/app/tests/word-matching/[testId]/index.tsx`
- `MWSExpo/app/tests/fill-blanks/[testId]/index.tsx`
- `MWSExpo/app/tests/matching/[testId]/index.tsx`
- `MWSExpo/app/tests/drawing/[testId]/index.tsx`
- `MWSExpo/app/tests/speaking/[testId]/index.tsx` (or `SpeakingTestStudent.tsx`)

Each file contains ~50-100 lines of duplicated logic that:
1. Fetches `max_attempts` from `testData`, AsyncStorage metadata, or calculates from `retest_attempts_left`
2. Calculates `currentAttempt` from `testData.retest_attempt_number` or AsyncStorage metadata
3. Calculates `nextAttemptNumber` (if passed, jump to `maxAttempts`; otherwise increment)
4. Determines `attemptsExhausted` and `shouldComplete`
5. Calls `handleRetestCompletion()` and conditionally `markTestCompleted()`

## Current Architecture

### Database Schema

**`retest_assignments` table:**
- `id` (SERIAL PRIMARY KEY)
- `max_attempts` (INTEGER NOT NULL DEFAULT 1) - **Source of truth for max attempts**
- `passing_threshold` (DECIMAL(5,2) NOT NULL DEFAULT 50.00)
- Other metadata (test_type, test_id, teacher_id, etc.)

**`retest_targets` table:**
- `id` (SERIAL PRIMARY KEY)
- `retest_assignment_id` (INTEGER) - FK to `retest_assignments`
- `student_id` (VARCHAR(10))
- `attempt_number` (INTEGER) - **Current attempt number (0 = not started, 1 = first attempt)**
- `max_attempts` (INTEGER) - **Copied from retest_assignments for faster queries**
- `attempt_count` (INTEGER NOT NULL DEFAULT 0) - Legacy field, use `attempt_number` instead
- `is_completed` (BOOLEAN) - **TRUE when attempts exhausted OR student passed**
- `passed` (BOOLEAN) - **TRUE if student passed (percentage >= passing_threshold)**
- `status` (VARCHAR(12)) - 'PENDING'|'IN_PROGRESS'|'PASSED'|'FAILED'|'EXPIRED'
- `completed_at` (TIMESTAMP)
- `last_attempt_at` (TIMESTAMP)

**`test_attempts` table:**
- Stores individual retest submissions
- `retest_assignment_id` (INTEGER) - Links to retest assignment
- `attempt_number` (INTEGER) - Which attempt this is (1, 2, 3, etc.)
- `is_completed` (BOOLEAN) - Whether this specific attempt is completed

### API Functions

**`functions/submit-*-test.js` (all 8 test types):**
- Receives `retest_assignment_id` from Android app
- Queries `retest_targets` to get:
  - `attempt_number` (current attempt)
  - `max_attempts` (from `retest_targets.max_attempts` or `retest_assignments.max_attempts`)
  - `is_completed` (to reject if already completed)
- Calculates `nextAttemptNumber`:
  - If `passed`: `nextAttemptNumber = max_attempts` (jump to last slot)
  - If `failed`: `nextAttemptNumber = currentAttempt + 1` (increment)
- Updates `retest_targets`:
  - `attempt_number = nextAttemptNumber`
  - `attempt_count = nextAttemptNumber` (legacy, keep for compatibility)
  - `is_completed = (nextAttemptNumber >= max_attempts) || passed`
  - `passed = (percentage >= passing_threshold)`
  - `status = 'PASSED' | 'FAILED' | 'IN_PROGRESS'`
- Inserts into `test_attempts` with `attempt_number = nextAttemptNumber`

**`functions/get-student-active-tests.js`:**
- Returns `retest_max_attempts` from `retest_targets.max_attempts` or `retest_assignments.max_attempts`
- Returns `retest_attempts_left = max_attempts - attempt_number`
- Returns `retest_attempt_number = attempt_number`
- Returns `retest_is_completed = is_completed`

### Existing Android Helpers

**`MWSExpo/src/utils/retestUtils.ts`:**
- `getRetestAssignmentId()` - Gets `retest_assignment_id` from AsyncStorage
- `processRetestAvailability()` - Processes retest_available flag from API
- `clearRetestKeys()` - Clears `retest1_*` and `retest_assignment_id_*` keys
- `markTestCompleted()` - Sets `test_completed_*` key
- `startRetest()` - Sets retest keys before navigation
- `handleRetestCompletion()` - Writes attempt keys and checks completion (uses AsyncStorage attempt keys)

## Solution: Unified Retest Completion Helper

### New Helper Function

Create `processRetestSubmission()` in `MWSExpo/src/utils/retestUtils.ts`:

```typescript
/**
 * Process retest submission completion logic (matches API logic)
 * This centralizes all retest completion logic that was duplicated across test files.
 * 
 * @param studentId - Student ID
 * @param testType - Test type (e.g., 'true_false', 'input', etc.)
 * @param testId - Test ID
 * @param testData - Test data from API (should include retest_max_attempts, retest_attempt_number, retest_attempts_left)
 * @param percentage - Score percentage (0-100)
 * @param passingThreshold - Passing threshold (default: 60)
 * @returns Promise<{ shouldComplete: boolean, maxAttempts: number, nextAttemptNumber: number }>
 */
export async function processRetestSubmission(
  studentId: string,
  testType: string,
  testId: string | number,
  testData: {
    retest_max_attempts?: number | null;
    retest_attempt_number?: number | null;
    retest_attempts_left?: number | null;
    max_attempts?: number | null;
  } | null | undefined,
  percentage: number,
  passingThreshold: number = 60
): Promise<{
  shouldComplete: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextAttemptNumber: number;
  passed: boolean;
  attemptsExhausted: boolean;
}>
```

### Implementation Steps

1. **Fetch `maxAttempts`** (priority order):
   - AsyncStorage metadata: `retest_attempts_${studentId}_${testType}_${testId}` → `meta.max`
   - `testData?.retest_max_attempts`
   - `testData?.max_attempts`
   - Calculate from `retest_attempts_left`:
     - If `attemptsLeft === 1` and `currentAttempt === 0`: `maxAttempts = 1`
     - Otherwise: `maxAttempts = currentAttempt + attemptsLeft`
   - Fallback: `1` (log error)

2. **Fetch `currentAttempt`** (priority order):
   - AsyncStorage metadata: `retest_attempts_${studentId}_${testType}_${testId}` → `meta.used`
   - `testData?.retest_attempt_number || 0`
   - Calculate from `retest_attempts_left`:
     - If `testData?.retest_max_attempts`: `currentAttempt = retest_max_attempts - attemptsLeft`
     - If `testData?.max_attempts`: `currentAttempt = max_attempts - attemptsLeft`

3. **Calculate `passed`**:
   - `passed = percentage >= passingThreshold`

4. **Calculate `nextAttemptNumber`** (matches API logic):
   - If `passed`: `nextAttemptNumber = maxAttempts` (jump to last slot)
   - Else: `nextAttemptNumber = currentAttempt + 1` (increment)

5. **Calculate `attemptsExhausted`**:
   - `attemptsExhausted = nextAttemptNumber >= maxAttempts`
   - Special case: If `testData?.retest_attempts_left === 1`, always `attemptsExhausted = true`

6. **Calculate `shouldComplete`**:
   - `shouldComplete = attemptsExhausted || passed`

7. **Return result object** with all calculated values

### Usage in Test Files

Replace duplicated logic in all 8 test files with:

```typescript
import { processRetestSubmission, handleRetestCompletion, markTestCompleted, getRetestAssignmentId } from '@/utils/retestUtils';

// In submission success handler:
if (isRetest) {
  // Calculate completion status locally (for immediate UI feedback)
  // This matches API logic but is only for optimistic UI updates
  const retestResult = await processRetestSubmission(
    user.student_id,
    'true_false', // or testType
    testIdStr,
    testData,
    responsePercentage,
    60 // passing threshold
  );
  
  // Handle retest completion (writes attempt keys to AsyncStorage)
  // This tracks attempts locally for handleRetestCompletion() logic
  const isCompleted = await handleRetestCompletion(
    user.student_id,
    'true_false',
    testIdStr,
    retestResult.maxAttempts,
    responsePercentage,
    retestResult.passed
  );
  
  // Mark test as completed locally (optimistic UI feedback)
  // API is source of truth - this is only for immediate UI update
  if (retestResult.shouldComplete) {
    await markTestCompleted(user.student_id, 'true_false', testIdStr);
  }
} else {
  // Regular test - always mark as completed locally
  await markTestCompleted(user.student_id, 'true_false', testIdStr);
}
```

**Important Notes:**
- The local `markTestCompleted()` call is **optimistic UI feedback only**
- The API has already updated `retest_targets.is_completed` in the database
- On dashboard refresh, filtering should use `test.retest_is_completed` from API, not local keys
- Local `test_completed_*` keys are cleared/overridden when API returns different state

## Migration Checklist

### Phase 1: Create Helper Function
- [ ] Create `processRetestSubmission()` in `retestUtils.ts`
- [ ] Add comprehensive logging for debugging
- [ ] Add error handling for edge cases
- [ ] Write unit tests (if applicable)

### Phase 2: Update Test Files
- [ ] Update `true-false/[testId]/index.tsx`
- [ ] Update `input/[testId]/index.tsx`
- [ ] Update `multiple-choice/[testId]/index.tsx`
- [ ] Update `word-matching/[testId]/index.tsx`
- [ ] Update `fill-blanks/[testId]/index.tsx`
- [ ] Update `matching/[testId]/index.tsx`
- [ ] Update `drawing/[testId]/index.tsx`
- [ ] Update `speaking/[testId]/index.tsx` or `SpeakingTestStudent.tsx`

### Phase 3: Update Dashboard Filtering
- [ ] Update `ActiveTestsView.tsx` to filter based on `test.retest_is_completed` from API
- [ ] Remove dependency on local `test_completed_*` keys for filtering
- [ ] Ensure local keys are only used for immediate UI feedback after submission
- [ ] Verify dashboard refresh shows correct state based on API data

### Phase 4: Verification
- [ ] Test retest submission with `max_attempts = 1`
- [ ] Test retest submission with `max_attempts = 3`
- [ ] Test retest completion when student passes
- [ ] Test retest completion when attempts exhausted
- [ ] Verify API logs show correct `attempt_number` updates
- [ ] Verify `retest_targets.attempt_number` is updated correctly in database
- [ ] Verify `retest_targets.is_completed` is set correctly
- [ ] Verify Android app shows "✓ Completed" immediately after submission (optimistic UI)
- [ ] Verify dashboard refresh filters based on API's `retest_is_completed` flag
- [ ] Verify dashboard shows correct state even if local keys are stale

## Key Points

### API is Single Source of Truth

**CRITICAL**: The API (`submit-*-test.js`) is the **single source of truth** for all retest state:
- API updates `retest_targets.attempt_number` in database
- API sets `retest_targets.is_completed = true` when `attempt_number >= max_attempts` OR `passed = true`
- API returns `retest_is_completed`, `retest_attempt_number`, `retest_max_attempts` in `get-student-active-tests.js`
- **Android app should NEVER override or second-guess API decisions**

### Android App's Role

The Android app has **two separate responsibilities**:

1. **Immediate UI Feedback (Post-Submission)**:
   - After successful submission, calculate completion status locally using `processRetestSubmission()`
   - Call `handleRetestCompletion()` to write attempt keys to AsyncStorage
   - Call `markTestCompleted()` if `shouldComplete === true` to set `test_completed_*` key
   - **Purpose**: Show "✓ Completed" button immediately without waiting for API refresh
   - **Note**: This is optimistic UI feedback only - API is still the source of truth

2. **Filtering Completed Retests (Dashboard/Active Tests)**:
   - **MUST rely on API data**: `test.retest_is_completed === true` from `get-student-active-tests.js`
   - **DO NOT rely on local metadata** (`test_completed_*` keys) for filtering
   - Local `test_completed_*` keys are only for immediate UI feedback after submission
   - When API refresh occurs, filter based on `retest_is_completed` flag from API
   - If API says `retest_is_completed === false`, show "Start Retest" button even if local key exists

### Logic Must Match API

The `processRetestSubmission()` helper must use the **exact same logic** as the API:
- `nextAttemptNumber = maxAttempts` if passed (early pass)
- `nextAttemptNumber = currentAttempt + 1` if failed (increment)
- `shouldComplete = (nextAttemptNumber >= maxAttempts) || passed`

This ensures local calculation matches API's database update, providing accurate immediate feedback.

### Data Flow

**Submission Flow:**
1. User submits retest → Android app sends `retest_assignment_id` to API
2. API updates `retest_targets.attempt_number` and `is_completed` in database
3. API returns success response
4. Android app calculates completion locally (for immediate UI)
5. Android app calls `markTestCompleted()` to set local key (optimistic UI)
6. Android app navigates back to dashboard

**Dashboard Refresh Flow:**
1. Android app calls `get-student-active-tests.js`
2. API returns tests with `retest_is_completed` flag from database
3. Android app **filters based on API flag**: `if (test.retest_is_completed) return false;`
4. Android app shows "✓ Completed" if `retest_is_completed === true`
5. Android app shows "Start Retest" if `retest_is_completed === false` (even if local key exists)

### max_attempts Source Priority

**API (Database):**
- Primary: `retest_targets.max_attempts` (copied from `retest_assignments.max_attempts`)
- Fallback: `retest_assignments.max_attempts`
- Returned in `get-student-active-tests.js` as `retest_max_attempts`

**Android (Local Calculation):**
- Primary: `testData.retest_max_attempts` from API response
- Fallback: AsyncStorage metadata (`retest_attempts_${studentId}_${testType}_${testId}` → `meta.max`)
- Fallback: Calculate from `retest_attempts_left` if available
- **Note**: Local calculation is only for immediate UI feedback - API value is authoritative

### attempt_number Tracking

**API (Database):**
- `retest_targets.attempt_number` - Current attempt number (0 = not started, 1 = first attempt)
- Updated by API on each submission
- Returned in `get-student-active-tests.js` as `retest_attempt_number`

**Android (Local Tracking):**
- AsyncStorage keys: `retest_attempt1_*`, `retest_attempt2_*`, etc. (written by `handleRetestCompletion()`)
- AsyncStorage metadata: `retest_attempts_${studentId}_${testType}_${testId}` → `{ used: X, max: Y }`
- **Purpose**: Track attempts locally for `handleRetestCompletion()` logic
- **Note**: API's `retest_targets.attempt_number` is authoritative - local keys are for UI logic only

### Completion Detection

**API (Database):**
- `retest_targets.is_completed = true` when:
  - `attempt_number >= max_attempts` (attempts exhausted), OR
  - `passed = true` (student passed)
- Returned in `get-student-active-tests.js` as `retest_is_completed`

**Android (Local):**
- Calculate `shouldComplete` locally using `processRetestSubmission()` (matches API logic)
- Call `markTestCompleted()` if `shouldComplete === true` (sets `test_completed_*` key)
- **Purpose**: Immediate UI feedback ("✓ Completed" button appears instantly)
- **Filtering**: Use API's `retest_is_completed` flag, NOT local `test_completed_*` key

## Files to Modify

1. **New file**: `MWSExpo/src/utils/retestUtils.ts` (add `processRetestSubmission()`)
2. **Update**: All 8 test type files in `MWSExpo/app/tests/*/[testId]/index.tsx`
3. **Update**: `MWSExpo/src/components/test/SpeakingTestStudent.tsx` (if applicable)

## Testing Strategy

1. **Unit test the helper** (if test framework available):
   - Test `maxAttempts` fetching from various sources
   - Test `nextAttemptNumber` calculation (passed vs failed)
   - Test `shouldComplete` calculation

2. **Integration test**:
   - Submit retest with `max_attempts = 1`, verify completion
   - Submit retest with `max_attempts = 3`, verify not completed after first attempt
   - Submit retest with passing score, verify early completion
   - Verify API logs show correct database updates

3. **Manual testing**:
   - Test all 8 test types
   - Verify UI shows "✓ Completed" correctly
   - Verify retest is filtered out from active tests list
   - Verify database `retest_targets.attempt_number` is correct

