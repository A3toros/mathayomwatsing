# Retest Mini-Refresh Helper Plan (Web App)

Goal: For RETESTS only, add a single helper that, when the user presses “Back to Cabinet” in Test Results, briefly shows a loading spinner, evaluates remaining attempts and pass status for the given test, then navigates back to the Student Cabinet with the correct button state:
- Start Retest (more attempts remain and student hasn’t passed)
- ✓ Completed (attempts ran out OR student passed even if attempts remain)

## Scope
- Applies to all 8 test types: multiple_choice, true_false, input, fill_blanks, matching_type, word_matching, speaking, drawing.
- Web app only (Student Cabinet flow).

## High-Level Flow
1) User presses Back to Cabinet on Test Results.
2) Show a modal loading spinner (non-blocking UI overlay).
3) Call a unified helper: `handleRetestReturn({ testType, testId, studentId })`.
4) Inside helper, compute:
   - attemptsLeft (from localStorage meta OR test object OR fallbacks)
   - passed (from results in memory OR last-results cache; fallback to percentage >= 60)
5) Decide outcome:
   - If attemptsLeft > 0 AND not passed → show Start Retest
   - Else → mark Completed (write localStorage `test_completed_{studentId}_{type}_{id}` = true)
6) Update in-memory `completedTests` set to avoid page reload.
7) Dismiss spinner and navigate back to Student Cabinet.

## Helper Function Design
Signature:
```ts
async function handleRetestReturn(params: {
  testType: string;
  testId: string | number;
  studentId: string;
  // Optional shims to avoid imports in the helper file
  getResults?: () => any[];              // returns latest results array (or [])
  getAttemptsMeta?: (k: string) => any;  // read attempts JSON meta from localStorage
  setCompletedKey?: (k: string) => void; // write completion localStorage key
  updateCompletedSet?: (key: string) => void; // push into in-memory Set
  showSpinner?: (on: boolean) => void;   // toggles spinner
  navigateToCabinet?: () => void;        // navigation callback
}): Promise<void>
```

Steps inside:
1) `showSpinner(true)`
2) Build keys:
   - attempts meta: `retest_attempts_${studentId}_${testType}_${testId}`
   - completed: `test_completed_${studentId}_${testType}_${testId}`
3) Read attempts meta:
   - If meta exists: attemptsLeft = max - used (guard for negatives)
   - Else: attemptsLeft = null (unknown)
4) Determine pass status:
   - Fetch latest results via `getResults()` and find match on type/id
   - `passed = r.passed ?? (best_retest_percentage || percentage || percentage_score) >= 60`
5) Decision:
   - If (attemptsLeft !== null && attemptsLeft > 0 && !passed) → Start Retest
   - Else → Completed: `setCompletedKey(completedKey)` and `updateCompletedSet("${testType}_${testId}")`
6) `showSpinner(false)` then `navigateToCabinet()`

## UI Integration Points
- Test Results component (`src/components/test/TestResults.jsx`):
  - Replace current Back-to-Cabinet handler for retests to call `handleRetestReturn`.
  - Provide shims (callbacks) for spinner, results access, localStorage wrappers, state update, and navigation.
- Student Cabinet (`src/student/StudentCabinet.jsx`):
  - Ensure we expose a function to update `completedTests` Set in place (no API call).
  - Ensure the button renderer already respects `completedTests` for ✓ Completed vs Start Retest.

## Data Sources
- attempts meta: `localStorage[retest_attempts_{studentId}_{type}_{id}]` → JSON `{ used, max }`
- completion marker: `localStorage[test_completed_{studentId}_{type}_{id}] = 'true'`
- latest results: in-memory `testResults` (array or `{ results: [...] }`)

## Edge Cases
- Missing results entry: default `passed = false` (unless prior best percentage exists)
- Unknown attempts meta: treat as attemptsLeft = null; if unknown, prefer “Completed” only when `passed` is true
- Network independence: no API call; entirely local state + localStorage
- Speaking/Drawing/Matching/Word Matching: pass detection still uses percentage threshold from results (unchanged)

## Spinner Behavior
- Minimal overlay spinner shown only during the helper’s execution (typically < 200ms)
- Must be cancellable if navigation occurs instantly

## Minimal Changes Required
1) Add helper function file `src/utils/retestReturnHelper.js` (or co-locate with StudentCabinet utilities)
2) Wire `onBackToCabinet` in Test Results to call the helper when the current test is a RETEST
3) Expose a single function from Student Cabinet to update `completedTests` Set synchronously

## Acceptance Criteria
- After finishing a retest and pressing Back:
  - Spinner appears briefly
  - Cabinet shows:
    - “Start Retest” if attempts remain and student didn’t pass
    - “✓ Completed” otherwise
  - No page reload or extra API call


