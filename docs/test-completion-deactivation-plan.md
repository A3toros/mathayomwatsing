# Test Completion Deactivation Plan

## Overview
When students complete tests (all 8 test types), automatically set the test assignment's `is_active = false` to prevent completed tests from cluttering the student cabinet. When a retest is appointed, set the original test's `is_active = true` again so students can see and start the retest.

## Goals
1. **Clean Cabinet**: Completed tests won't appear in the active tests list, reducing clutter
2. **Retest Visibility**: When a retest is appointed, the original test becomes visible again so students can start it
3. **Consistent Behavior**: All 8 test types follow the same pattern

## Current State
- Test assignments have `is_active` field (default: `true`) - **global** (per grade/class, not per student)
- `student_active_tests_view` filters by `WHERE ta.is_active = true`
- **View structure**: Creates **1 row per student** per test (via `LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class`)
- When tests are completed, `is_active` remains `true` (global assignment stays active)
- When retests are created, original test's `is_active` is not modified
- Result: Completed tests stay visible in the cabinet for all students

## Key Insight
The view already generates **per-student rows** (one row per student-test combination). We can leverage this by:
1. **Using existing results tables** - All test results tables have `is_completed` field
2. LEFT JOINing to results tables in the view
3. Filtering out rows where student has `is_completed = true` AND no retest is available

**Simpler Approach - No New Table Needed!**
- All test results tables already have `is_completed` field:
  - `multiple_choice_test_results.is_completed`
  - `true_false_test_results.is_completed`
  - `input_test_results.is_completed`
  - `matching_type_test_results.is_completed`
  - `word_matching_test_results.is_completed`
  - `fill_blanks_test_results.is_completed`
  - `drawing_test_results.is_completed`
  - `speaking_test_results.is_completed`

**Example:**
- Test assignment (grade 7, class 69) has `is_active = true` (global)
- View creates 30 rows (one per student in grade 7 class 69)
- Student A completes test → `multiple_choice_test_results` has `is_completed = true` for Student A
- View filters: Student A's row is excluded (because `result.is_completed = true` AND no retest available)
- Other 29 students' rows still show (because no result exists for them, or `is_completed = false`)
- Retest created for Student A → `retest_available = true` in view
- View filters: Student A's row now shows again (because retest is available, even if `is_completed = true`)
- Student A completes retest → Result has `is_completed = true` AND retest exhausted
- View filters: Student A's row is excluded again (because `is_completed = true` AND `retest_available = false`)

## Proposed Changes

### 1. Test Completion - Set `is_completed = true` (Already Done)

**Files already setting this:**
- All 8 submit functions already set `is_completed = true` in their respective results tables
- No changes needed here!

**Current behavior:**
- When test is submitted, result row is created with `is_completed = true`
- This is already happening in all submit functions

**What we need:**
- Filter the view to exclude tests where `is_completed = true` AND `retest_available = false`

### 2. Retest Creation - Already Handled by `retest_available` Flag

**File already handling this:**
- `functions/get-student-active-tests.js` already sets `retest_available = true` when retest is available
- No changes needed here!

**Current behavior:**
- When retest is created, `get-student-active-tests.js` checks `retest_targets` and `retest_assignments`
- Sets `retest_available = true` in the response
- This is already happening!

**What we need:**
- Filter the view to show tests even if `is_completed = true` when `retest_available = true`

### 3. Update `get-student-active-tests.js` Function

**File to modify:**
- `functions/get-student-active-tests.js`

**Logic:**
After getting view rows and checking retest availability, filter out completed tests:
```javascript
// After checking retest availability (line ~205), before pushing to activeTests:
// Check if student has completed this test (is_completed = true)
const hasCompletedResult = await checkIfTestCompleted(student_id, row.test_type, row.test_id);

// Skip if completed AND no retest available
if (hasCompletedResult && !retestAvailable) {
  console.log('Skipping completed test:', row.test_type, row.test_id);
  continue; // Skip this test
}

// Include this test
activeTests.push({...});
```

**Helper function:**
```javascript
async function checkIfTestCompleted(studentId, testType, testId) {
  try {
    const result = await sql`
      SELECT id FROM ${sql.unsafe(`${testType}_test_results`)}
      WHERE student_id = ${studentId}
        AND test_id = ${testId}
        AND is_completed = true
      LIMIT 1
    `;
    return Array.isArray(result) && result.length > 0;
  } catch (e) {
    console.warn('Error checking completion:', e);
    return false;
  }
}
```

**Even simpler: Add completion status to view, filter in function**
- Add LEFT JOIN to results tables in view to expose `is_completed` status
- Filter in function: `if (row.is_completed && !row.retest_available) continue;`

## Implementation Plan

### Phase 1: Update View to Include Completion Status

**File:** `database/views/student_active_tests_view.sql`

Add LEFT JOIN to each results table to check if test is completed:
```sql
-- Add to each UNION ALL section (after LEFT JOIN users):
LEFT JOIN multiple_choice_test_results mcr ON 
  mcr.student_id = u.student_id 
  AND mcr.test_id = mct.id
  AND mcr.is_completed = true
WHERE ta.is_active = true
  AND u.student_id IS NOT NULL
```

This adds a column `mcr.id` which will be:
- `NULL` if test is not completed
- `NOT NULL` if test is completed

**Repeat for all 8 test types:**
- `multiple_choice_test_results` for `multiple_choice`
- `true_false_test_results` for `true_false`
- `input_test_results` for `input`
- `matching_type_test_results` for `matching_type`
- `word_matching_test_results` for `word_matching`
- `fill_blanks_test_results` for `fill_blanks`
- `drawing_test_results` for `drawing`
- `speaking_test_results` for `speaking`

### Phase 2: Update Function to Filter Completed Tests

**File:** `functions/get-student-active-tests.js`

After checking retest availability (around line 205), before pushing to `activeTests`:
```javascript
// Check if test is completed (result.id will be NOT NULL if completed)
const isCompleted = row.result_id !== null && row.result_id !== undefined;

// Skip if completed AND no retest available
if (isCompleted && !retestAvailable) {
  console.log('Filtering out completed test:', row.test_type, row.test_id);
  continue; // Skip this test
}

// Include this test
activeTests.push({...});
```

**Note:** The view will expose `result_id` (or similar) from the LEFT JOIN. We'll use this to check completion status.

## Summary

**Simplest Implementation:**
1. ✅ **Test completion** - Already handled (submit functions set `is_completed = true`)
2. ✅ **Retest availability** - Already handled (function checks `retest_assignments` and sets `retest_available`)
3. 🔧 **Filter in view** - Add LEFT JOIN to results tables to expose completion status
4. 🔧 **Filter in function** - Skip tests where `is_completed = true` AND `retest_available = false`

**No new table needed!** Uses existing `is_completed` field in results tables.

## Migration Strategy

1. **Update view** - Add LEFT JOIN to results tables to expose completion status
2. **Update function** - Filter out completed tests where `retest_available = false`
3. **Test thoroughly** - No data migration needed!

## Testing Checklist

- [ ] Regular test completion sets `is_completed = true` (already working)
- [ ] Completed test disappears from active tests (when `retest_available = false`)
- [ ] Retest creation sets `retest_available = true` (already working)
- [ ] Test reappears in active tests for retest students (when `retest_available = true`)
- [ ] Retest completion sets `is_completed = true` (already working)
- [ ] Test disappears after retest completion (when `retest_available = false`)
- [ ] Works for all 8 test types
- [ ] Multiple students can have different statuses for same test
- [ ] View correctly exposes completion status for all test types

## Edge Cases

1. **Student completes test, then retest is created**: Should reactivate ✓
2. **Student completes retest (exhausts attempts)**: Should deactivate ✓
3. **Student passes retest**: Should deactivate ✓
4. **Multiple students, same test**: Each has independent status ✓
5. **Student completes test, no retest available**: Test stays hidden ✓
6. **Assignment is globally deactivated**: Test won't show regardless of student status ✓

## Benefits

1. **Cleaner UI**: Students only see tests they can actually take
2. **Better UX**: No confusion about which tests are available
3. **Clear State**: `is_active` flag clearly indicates test availability
4. **Retest Visibility**: When retest is available, test reappears automatically
5. **Scalable**: Works for any number of students and tests

