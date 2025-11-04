# Test Completion Deactivation Plan

## Overview
When students complete tests (all 8 test types), automatically set the test assignment's `is_active = false` to prevent completed tests from cluttering the student cabinet. When a retest is appointed, set the original test's `is_active = true` again so students can see and start the retest.

## Goals
1. **Clean Cabinet**: Completed tests won't appear in the active tests list, reducing clutter
2. **Retest Visibility**: When a retest is appointed, the original test becomes visible again so students can start it
3. **Consistent Behavior**: All 8 test types follow the same pattern

## Current State
- Test assignments have `is_active` field (default: `true`)
- `student_active_tests_view` filters by `WHERE ta.is_active = true`
- When tests are completed, `is_active` remains `true`
- When retests are created, original test's `is_active` is not modified
- Result: Completed tests stay visible in the cabinet

## Proposed Changes

### 1. Test Completion - Set `is_active = false`

**Files to modify:**
- `functions/submit-multiple-choice-test.js`
- `functions/submit-true-false-test.js`
- `functions/submit-input-test.js`
- `functions/submit-matching-type-test.js`
- `functions/submit-word-matching-test.js`
- `functions/submit-fill-blanks-test.js`
- `functions/submit-drawing-test.js`
- `functions/submit-speaking-test-final.js`

**Logic:**
```sql
-- After successful test submission, set assignment to inactive
UPDATE test_assignments
SET is_active = false, updated_at = NOW()
WHERE test_type = ${test_type}
  AND test_id = ${test_id}
  AND grade = ${grade}
  AND class = ${class}
  AND student_id = ${student_id}  -- Only deactivate for this specific student
```

**Note:** We need to deactivate per student, not globally. Since `test_assignments` is per grade/class, we may need a different approach:
- Option A: Create a `student_test_assignments` table to track per-student active status
- Option B: Use a separate `student_test_completions` table with `is_active` flag
- Option C: Modify `test_assignments` to support per-student deactivation

**Recommended Approach (Option C):**
- Add `deactivated_students` JSONB column to `test_assignments` to track which students have completed it
- Or create `student_test_status` table: `(student_id, test_type, test_id, assignment_id, is_active)`

**Simpler Approach (Option B - Recommended for MVP):**
- Create `student_test_completions` table:
  ```sql
  CREATE TABLE student_test_completions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL REFERENCES users(student_id),
    test_type VARCHAR(20) NOT NULL,
    test_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL REFERENCES test_assignments(id),
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, test_type, test_id, assignment_id)
  );
  ```

**Even Simpler Approach (Use existing `test_completed_` keys):**
- Since we already use `test_completed_${studentId}_${testType}_${testId}` in localStorage
- We can add a database flag in `student_test_results` or create a simple completion table
- Filter `student_active_tests_view` to exclude tests where student has completed AND no retest available

### 2. Retest Creation - Set `is_active = true`

**File to modify:**
- `functions/create-retest-assignment.js`

**Logic:**
```sql
-- When creating retest, reactivate the original test assignment for these students
UPDATE test_assignments
SET is_active = true, updated_at = NOW()
WHERE test_type = ${test_type}
  AND test_id = ${test_id}
  AND grade = ${grade}
  AND class = ${class}
  AND id IN (
    -- Get the assignment IDs for students who are getting retests
    SELECT DISTINCT ta.id
    FROM test_assignments ta
    WHERE ta.test_type = ${test_type}
      AND ta.test_id = ${test_id}
      AND ta.grade = ${grade}
      AND ta.class = ${class}
  );
```

**But wait:** This would reactivate for ALL students in that grade/class, not just the retest students.

**Better approach:**
- Create `student_test_status` table with per-student `is_active` flag
- Or use completion table with `is_active` flag that we can toggle

### 3. Update `student_active_tests_view`

**File to modify:**
- `database/views/student_active_tests_view.sql`

**Logic:**
```sql
-- Add LEFT JOIN to exclude completed tests (unless retest is available)
LEFT JOIN student_test_completions stc ON 
  stc.student_id = u.student_id 
  AND stc.test_type = 'multiple_choice'  -- repeat for each test type
  AND stc.test_id = mct.id
  AND stc.assignment_id = la.id
  AND stc.is_active = false
WHERE ta.is_active = true
  AND (stc.id IS NULL OR stc.is_active = true)  -- Exclude if completed and not reactivated
```

## Implementation Plan

### Phase 1: Database Schema
1. Create `student_test_completions` table:
   ```sql
   CREATE TABLE student_test_completions (
     id SERIAL PRIMARY KEY,
     student_id VARCHAR(10) NOT NULL REFERENCES users(student_id),
     test_type VARCHAR(20) NOT NULL,
     test_id INTEGER NOT NULL,
     assignment_id INTEGER NOT NULL REFERENCES test_assignments(id),
     is_active BOOLEAN DEFAULT true,
     completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(student_id, test_type, test_id, assignment_id)
   );
   
   CREATE INDEX idx_stc_student_test ON student_test_completions(student_id, test_type, test_id);
   CREATE INDEX idx_stc_active ON student_test_completions(student_id, is_active);
   ```

### Phase 2: Test Completion - Deactivate
1. **All 8 submit functions**: After successful submission, insert/update `student_test_completions`:
   ```sql
   INSERT INTO student_test_completions (student_id, test_type, test_id, assignment_id, is_active)
   VALUES (${student_id}, ${test_type}, ${test_id}, ${assignment_id}, false)
   ON CONFLICT (student_id, test_type, test_id, assignment_id)
   DO UPDATE SET is_active = false, updated_at = NOW();
   ```

### Phase 3: Retest Creation - Reactivate
1. **`create-retest-assignment.js`**: After creating retest assignment, reactivate for target students:
   ```sql
   -- For each student getting a retest
   INSERT INTO student_test_completions (student_id, test_type, test_id, assignment_id, is_active)
   VALUES (${student_id}, ${test_type}, ${test_id}, ${assignment_id}, true)
   ON CONFLICT (student_id, test_type, test_id, assignment_id)
   DO UPDATE SET is_active = true, updated_at = NOW();
   ```

### Phase 4: Update View
1. **`student_active_tests_view.sql`**: Filter out completed (inactive) tests:
   ```sql
   -- Add to each UNION ALL section:
   LEFT JOIN student_test_completions stc ON 
     stc.student_id = u.student_id 
     AND stc.test_type = 'multiple_choice'  -- Change per test type
     AND stc.test_id = mct.id
     AND stc.assignment_id = la.id
   WHERE ta.is_active = true
     AND (stc.id IS NULL OR stc.is_active = true)
   ```

### Phase 5: Retest Completion - Deactivate Again
1. **All 8 submit functions**: When retest is completed (attempts exhausted OR passed), set `is_active = false` again:
   ```sql
   UPDATE student_test_completions
   SET is_active = false, updated_at = NOW()
   WHERE student_id = ${student_id}
     AND test_type = ${test_type}
     AND test_id = ${test_id}
     AND assignment_id = ${assignment_id};
   ```

## Alternative Simpler Approach (Recommended)

Instead of creating a new table, we can:
1. **Use existing completion detection**: Check if student has results for this test
2. **Filter in view**: Exclude tests where student has results AND no retest is available
3. **Reactivate on retest**: When retest is created, student can see the test again (via retest_available flag)

**But this doesn't handle the case where:** Student completed test, no retest available, test should be hidden.

**Best approach:**
- Keep `test_assignments.is_active` as global (for entire grade/class)
- Add `student_test_completions` table for per-student completion tracking
- View filters: `WHERE ta.is_active = true AND (stc.id IS NULL OR stc.is_active = true)`

## Migration Strategy

1. **Create table** with migration script
2. **Backfill existing completions** from `test_results` tables:
   ```sql
   INSERT INTO student_test_completions (student_id, test_type, test_id, assignment_id, is_active)
   SELECT DISTINCT 
     student_id, 
     'multiple_choice' as test_type,
     test_id,
     (SELECT id FROM test_assignments WHERE test_type = 'multiple_choice' AND test_id = mcr.test_id LIMIT 1) as assignment_id,
     false as is_active
   FROM multiple_choice_results mcr
   WHERE EXISTS (SELECT 1 FROM test_assignments ta WHERE ta.test_type = 'multiple_choice' AND ta.test_id = mcr.test_id);
   -- Repeat for all 8 test types
   ```
3. **Deploy submit function updates** (all 8 types)
4. **Deploy retest creation update**
5. **Deploy view update**
6. **Test thoroughly**

## Testing Checklist

- [ ] Regular test completion sets `is_active = false`
- [ ] Completed test disappears from active tests
- [ ] Retest creation sets `is_active = true` for target students
- [ ] Test reappears in active tests for retest students
- [ ] Retest completion sets `is_active = false` again
- [ ] Test disappears after retest completion
- [ ] Works for all 8 test types
- [ ] Multiple students can have different statuses for same test
- [ ] Backfill script runs correctly

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

