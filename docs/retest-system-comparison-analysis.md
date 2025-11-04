# Retest System Comparison: Web App vs Android App

## Executive Summary

This document provides a comprehensive analysis of how retest functionality is implemented and differs between the web application and the Android (Expo) mobile application. The analysis covers architecture, user experience, data flow, and implementation differences.

---

## 1. Architecture Overview

### 1.1 Web App Architecture

**Backend:**
- **Netlify Functions**: Serverless functions handle retest logic
  - `create-retest-assignment.js`: Creates new retest assignments
  - `get-retest-assignments.js`: Retrieves retest assignments for teachers
  - `get-retest-eligible-students.js`: Gets students eligible for retests
  - `get-retest-targets.js`: Gets targets for a specific retest assignment
  - `cancel-retest-assignment.js`: Cancels retest assignments
- **Database Tables**:
  - `retest_assignments`: Stores retest assignment metadata
  - `retest_targets`: Links students to retest assignments with status tracking
  - `test_attempts`: Stores detailed retest attempt data
  - Results tables: Store best retest scores via `update_best_retest_values()` function

**Frontend Services:**
- `src/services/retestService.js`: Minimal wrapper service
  - Uses `window.tokenManager` for authenticated requests
  - Direct API calls to Netlify functions
  - Returns raw API responses

**UI Components:**
- **Teacher Interface**: `src/teacher/TeacherCabinet.jsx` and `TeacherResults.jsx`
  - Teachers create retests by clicking on failed student scores (<50%)
  - Modal interface for configuring retest parameters
  - Visual indicators: Blue badge for "Retest offered"
  - Retest management table with status tracking
- **Student Interface**: Embedded in test results display
  - Students see retest availability through `get-student-active-tests.js`
  - Retests appear in active tests list when available

### 1.2 Android App Architecture

**Backend Integration:**
- **Shared Backend**: Uses same Netlify functions as web app
- **Service Layer**: `MWSExpo/src/services/retestService.ts`
  - Comprehensive TypeScript service with extensive interface definitions
  - Methods for eligibility checking, requesting retests, getting assignments
  - **NOT YET FULLY IMPLEMENTED**: Many methods reference endpoints that don't exist
  - Uses `apiClient` wrapper instead of direct function calls

**UI Components:**
- **RetestSystem Component**: `MWSExpo/src/components/RetestSystem.tsx`
  - Full-featured retest management interface with tabs
  - Assignments, History, and Statistics tabs
  - Pull-to-refresh functionality
  - **STATUS**: Appears to be scaffolded but may not be fully functional

**Test Integration:**
- Retest awareness embedded in individual test screens
- Uses `AsyncStorage` for local retest state tracking
- Pattern: `retest1_{studentId}_{testType}_{testId}` keys

---

## 2. Data Flow Comparison

### 2.1 Web App Data Flow

```
Teacher Flow:
1. Teacher views student results
2. Clicks on failed score (<50%) → Opens retest modal
3. Selects students, configures retest parameters
4. POST /create-retest-assignment
   → Creates retest_assignments record
   → Creates retest_targets records for selected students
   → Updates student result rows with retest_offered flag
5. UI updates to show blue "Retest offered" indicator

Student Flow:
1. GET /get-student-active-tests?student_id=X
   → Queries retest_targets + retest_assignments
   → Checks window_start/window_end
   → Checks attempt_count vs max_attempts
   → Returns retest_available boolean and metadata
2. Student sees retest in active tests list
3. Student takes retest
4. POST /submit-{test-type}-test with retest_assignment_id
   → Validates retest eligibility
   → Writes to test_attempts (not main results table)
   → Updates retest_targets.attempt_count and status
   → Calls update_best_retest_values() to update results table
5. Results table shows best retest score
```

### 2.2 Android App Data Flow

```
Student Flow:
1. GET /get-student-active-tests (same endpoint as web)
   → Returns retest_available, retest_key, retest_assignment_id
2. Test screens check AsyncStorage for retest keys:
   - Pattern: `retest1_{studentId}_{testType}_{testId}`
   - If exists, allows test to be retaken even if completed
3. Student takes retest
4. POST /submit-{test-type}-test with retest_assignment_id
   → Same backend flow as web app
5. After submission, clears AsyncStorage retest keys
   - Removes both retest key and retest_assignment_id key

Teacher Flow:
NOT IMPLEMENTED - Android app is student-only
```

---

## 3. Key Differences

### 3.1 Retest Detection & Display

| Aspect | Web App | Android App |
|--------|---------|-------------|
| **Detection** | Server-driven via `get-student-active-tests.js` | Server + client hybrid (API + AsyncStorage) |
| **Display Location** | Embedded in active tests list | Embedded in individual test screens |
| **State Management** | Server state only | Server state + AsyncStorage cache |
| **UI Integration** | Transparent - retests appear as regular tests | Explicit retest key checking in each test screen |

### 3.2 Retest Availability Checking

**Web App:**
- Centralized in `get-student-active-tests.js`
- Query:
  ```sql
  SELECT rt.*, ra.*
  FROM retest_targets rt
  JOIN retest_assignments ra ON ra.id = rt.retest_assignment_id
  WHERE rt.student_id = ? 
    AND ra.test_type = ?
    AND ra.test_id = ?
    AND NOW() BETWEEN ra.window_start AND ra.window_end
    AND (rt.status = 'PENDING' OR rt.status = 'FAILED')
    AND attempt_count < max_attempts
  ```
- Returns `retest_available`, `retest_assignment_id`, `retest_attempts_left`

**Android App:**
- Uses same API endpoint
- Additionally checks AsyncStorage for `retest1_{studentId}_{testType}_{testId}`
- Pattern indicates local caching/override mechanism
- Each test screen (fill-blanks, multiple-choice, etc.) implements this check independently

### 3.3 Test Submission Handling

**Web App:**
- Test submission components automatically handle retest_assignment_id from test data
- No explicit retest vs. normal test distinction in UI

**Android App:**
- Each test screen explicitly:
  1. Checks AsyncStorage for retest key on load
  2. Stores retest_assignment_id if available
  3. Includes retest_assignment_id in submission payload
  4. Clears retest keys after successful submission

**Example Pattern (from multiple-choice test):**
```typescript
// Load phase
const retestKey = `retest1_${user.student_id}_multiple_choice_${testId}`;
const hasRetest = await AsyncStorage.getItem(retestKey);
if (isCompleted === 'true' && hasRetest !== 'true') {
  // Block access
}

// Submission phase
const retestAssignKey = `retest_assignment_id_${studentId}_multiple_choice_${testId}`;
const retestAssignmentId = await AsyncStorage.getItem(retestAssignKey);
// Include in submission payload

// Cleanup phase
await AsyncStorage.removeItem(retestKey);
await AsyncStorage.removeItem(retestAssignKey);
```

### 3.4 Service Layer Comparison

**Web App Service (`src/services/retestService.js`):**
- Minimal wrapper (62 lines)
- 5 methods: create, getEligible, getAssignments, getTargets, cancel
- Direct function calls via tokenManager
- Returns raw API responses

**Android App Service (`MWSExpo/src/services/retestService.ts`):**
- Comprehensive service (360+ lines)
- 13+ methods with extensive TypeScript interfaces
- Methods include: eligibility, request, assignments, history, statistics, calendar, notifications, leaderboard
- Uses apiClient wrapper
- **CRITICAL ISSUE**: Many methods reference endpoints that don't exist in backend:
  - `/api/retests/eligibility/{testId}` - Not implemented
  - `/api/retests/request` - Not implemented
  - `/api/retests/assignments/{id}` - Not implemented
  - `/api/retests/assignments/{id}/start` - Not implemented
  - `/api/retests/assignments/{id}/submit` - Not implemented
  - `/api/retests/history` - Not implemented
  - `/api/retests/statistics` - Not implemented
  - `/api/retests/recommendations/{testId}` - Not implemented
  - `/api/retests/calendar` - Not implemented
  - `/api/retests/notifications` - Not implemented
  - `/api/retests/leaderboard` - Not implemented

**Impact:**
- Android app has ambitious UI (RetestSystem component) that cannot function without backend implementation
- Current implementation only works through embedded test screen checks
- Significant feature gap between intended functionality and actual capabilities

---

## 4. Teacher Interface Comparison

### 4.1 Web App Teacher Interface

**Features:**
- ✅ **Retest Creation**: Click failed scores to offer retests
- ✅ **Retest Modal**: Configure:
  - Selected students
  - Passing threshold
  - Scoring policy (BEST, LATEST, AVERAGE)
  - Max attempts
  - Window duration (days)
- ✅ **Visual Indicators**: Blue badges show "Retest offered"
- ✅ **Retest Management**: View all retests with status counts
- ✅ **Target Tracking**: View individual student retest progress
- ✅ **Cancellation**: Cancel retest assignments

**Implementation:**
- `src/teacher/TeacherCabinet.jsx`: Main retest management
- `src/teacher/TeacherResults.jsx`: Inline retest offering
- Uses `retestService.getRetestEligibleStudents()` to pre-populate modal
- Real-time UI updates after retest creation

### 4.2 Android App Teacher Interface

**Status:** ❌ **NOT IMPLEMENTED**

- Android app is student-only
- No teacher authentication flow
- No teacher UI components for retests

---

## 5. Student Experience Comparison

### 5.1 Web App Student Experience

**Flow:**
1. Student views dashboard/results
2. If retest available, appears in active tests list automatically
3. No special UI differentiation - retest appears as regular test
4. Student clicks test → Takes retest
5. After submission, sees updated score (best retest if applicable)

**UI Characteristics:**
- Seamless integration
- No explicit "retest" labeling
- Transparent to student

### 5.2 Android App Student Experience

**Flow:**
1. Student opens app → Dashboard shows active tests
2. Student selects test
3. Test screen checks:
   - Is test already completed? (AsyncStorage check)
   - Does retest key exist? (AsyncStorage check)
   - If completed but retest available → Allow access
4. Student takes retest
5. After submission → Clears retest keys

**UI Characteristics:**
- Same seamless integration as web
- No explicit retest UI elements
- Relies on backend data + local caching

---

## 6. Implementation Gaps & Issues

### 6.1 Critical Gaps in Android App

1. **Incomplete Backend Integration:**
   - `RetestSystem.tsx` component cannot function
   - Most `retestService.ts` methods fail silently
   - Only embedded test screen checks work

2. **AsyncStorage Pattern Inconsistency:**
   - Each test type implements retest checking independently
   - Slight variations in key naming patterns
   - No centralized retest state management

3. **Missing Teacher Interface:**
   - Android app has no teacher functionality
   - Retests can only be created via web app

4. **CRITICAL: Missing Retest Key Setting:**
   - **Issue**: When `retest_available` comes from API, Android app doesn't set retest key in AsyncStorage
   - **Web App Behavior**: When `test.retest_available === true`:
     - Sets: `localStorage.setItem(retestKey, 'true')`
     - Clears: `localStorage.removeItem(completionKey)` 
   - **Android App Behavior**: Only checks for retest key, never sets it
   - **Impact**: Student sees "test already completed" even when retest is available
   - **Location**: `MWSExpo/app/(tabs)/index.tsx` - fetchData() doesn't process `retest_available` flag

### 6.2 Potential Issues

1. **AsyncStorage Race Conditions:**
   - Retest keys stored/cleared individually per test
   - No transaction guarantees
   - Could lead to inconsistent state

2. **Offline Handling:**
   - Web app: Relies on server state
   - Android app: Uses AsyncStorage cache, but:
     - Cache may be stale
     - No sync mechanism documented
     - Offline behavior undefined

3. **Retest Key Lifecycle:**
   - Keys cleared after submission
   - But what if submission fails?
   - What if student navigates away?
   - No retry/recovery mechanism visible

---

## 7. Database Schema & Backend Logic

### 7.1 Shared Backend

Both apps use the same backend functions and database schema:

**Tables:**
- `retest_assignments`: Assignment metadata
  - Fields: test_type, test_id, teacher_id, subject_id, grade, class
  - Constraints: passing_threshold, scoring_policy, max_attempts, window_start/end
- `retest_targets`: Student-assignment links
  - Fields: retest_assignment_id, student_id, attempt_count, status
  - Status values: PENDING, IN_PROGRESS, PASSED, FAILED, EXPIRED
- `test_attempts`: Detailed retest attempt data
  - Stores retest_assignment_id
  - Separate from main results tables
- **Results tables**: Best retest scores via `update_best_retest_values()` function
  - `best_retest_score`, `best_retest_max_score`, `best_retest_percentage`
  - `retest_offered` flag

**Backend Functions:**
- Validation: Window time checks, attempt limits, student eligibility
- Scoring: Updates best retest values automatically
- Status tracking: Updates retest_targets.status based on scores

### 7.2 Backend Logic Differences

**None** - Both apps use identical backend functions.

---

## 8. Recommendations

### 8.1 Immediate Fixes Needed

1. **CRITICAL: Set Retest Keys When retest_available is True:**
   - **Fix Location**: `MWSExpo/app/(tabs)/index.tsx` - in `fetchData()` after loading active tests
   - **Action**: When processing `testsData`, check each test's `retest_available` flag
   - **Implementation**:
     ```typescript
     testsData.forEach(test => {
       if (test.retest_available) {
         const retestKey = `retest1_${studentId}_${test.test_type}_${test.test_id}`;
         await AsyncStorage.setItem(retestKey, 'true');
         // Clear completion key (like web app does)
         const completionKey = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
         await AsyncStorage.removeItem(completionKey);
       }
     });
     ```
   - **Also needed in**: `MWSExpo/app/(tabs)/tests.tsx` - same pattern

2. **Android App Service Layer:**
   - Remove or stub out non-functional `retestService.ts` methods
   - Document which methods actually work
   - Add error handling for missing endpoints

3. **RetestSystem Component:**
   - Either implement missing backend endpoints
   - Or remove/disable the component
   - Or refactor to use working endpoints only

4. **AsyncStorage Consistency:**
   - Create centralized retest state manager
   - Standardize key naming
   - Add sync mechanism with server

### 8.2 Architecture Improvements

1. **Unified Retest State Management:**
   - Extract retest checking logic to shared hook/service
   - Reduce duplication across test screens
   - Centralize AsyncStorage operations

2. **Backend API Expansion:**
   - If RetestSystem UI is desired, implement missing endpoints:
     - Eligibility checking
     - Retest history
     - Statistics
     - Calendar view
   - Or simplify Android app to match web app's simpler approach

3. **Offline Support:**
   - Document offline behavior
   - Add retry logic for failed submissions
   - Add sync mechanism for stale AsyncStorage data

### 8.3 Feature Parity Goals

**Short Term:**
- ✅ Student retest taking works on both platforms
- ✅ Backend retest creation works (web only)
- ❌ Android retest management UI needs work

**Long Term:**
- Consider teacher interface for Android app
- Consider unified retest state management library
- Consider real-time retest status updates

---

## 9. Conclusion

The retest system demonstrates **functional parity at the core** (student taking retests) but **significant differences in implementation approach**:

- **Web App**: Simpler, server-driven approach with centralized retest detection
- **Android App**: More complex, hybrid approach with AsyncStorage caching, but incomplete service layer

**Current Status:**
- ✅ Core retest functionality works on both platforms
- ✅ Students can take retests via both web and Android apps
- ✅ Backend logic is unified and robust
- ❌ Android app has incomplete/unused retest management UI
- ❌ Android app service layer over-promises functionality

**Recommended Path Forward:**
1. Simplify Android app retest service to match actual backend capabilities
2. Extract shared retest checking logic to reduce duplication
3. Document actual vs. intended retest features
4. Decide whether to expand backend API or simplify Android UI

---

## Appendix: Code References

### Web App
- Backend: `functions/create-retest-assignment.js`, `functions/get-retest-assignments.js`
- Service: `src/services/retestService.js`
- UI: `src/teacher/TeacherCabinet.jsx`, `src/teacher/TeacherResults.jsx`
- Active Tests: `functions/get-student-active-tests.js`

### Android App
- Service: `MWSExpo/src/services/retestService.ts`
- Component: `MWSExpo/src/components/RetestSystem.tsx`
- Test Screens: `MWSExpo/app/tests/*/[testId]/index.tsx`
- Dashboard: `MWSExpo/app/(tabs)/index.tsx`

