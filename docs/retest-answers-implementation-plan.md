# Retest Answers Implementation Plan

## Goal
When a blue pill (`retest_offered = true`) exists for multiple choice, true/false, or input tests, show retest answers instead of original answers when viewing student answers in `TeacherResults.jsx`.

## Current Situation Analysis

### What We Have
1. **Views Available:**
   - `teacher_student_results_view` - Shows aggregated results with `best_retest_score` but NOT retest answers
   - `student_test_results_view` - Student-facing view with retest scores
   - `all_test_results_view` - Comprehensive view with retest scores

2. **Data Storage:**
   - Original test answers: Stored in result tables (`multiple_choice_test_results`, `true_false_test_results`, `input_test_results`)
   - Retest answers: Stored in `test_attempts` table with `retest_assignment_id IS NOT NULL`
   - The views show retest SCORES (`best_retest_score`) but not the actual retest ANSWER data

3. **Current Flow:**
   - `handleViewAnswers` in `TeacherResults.jsx` receives `testResult` from `teacher_student_results_view`
   - It fetches questions using `get-test-questions` API
   - It displays answers from `testResult.answers` (which is original test answers)

### What We Need
- Access to retest answers from `test_attempts` table when `retest_offered = true`
- The retest answers are stored as JSONB in `test_attempts.answers` field
- Need to get the BEST retest attempt (highest percentage, or highest attempt_number if percentages are equal)

## Options Analysis

### Option 1: Extend Existing View ✅ RECOMMENDED
**Pros:**
- Reusable across the application
- Consistent with existing pattern (drawing tests already do this)
- No new API endpoint needed
- Data comes with the view automatically
- Follows the same pattern as drawing tests (lines 241-246 in view)

**Cons:**
- Need to modify existing view
- Adds LEFT JOIN LATERAL subquery (but drawing tests already do this)

**Key Insight:**
Looking at the view, **drawing tests already use a CASE statement** to return retest answers when `retest_offered = true` (lines 241-246). They join from `drawing_test_results` because retests are stored in the same table.

For MC/TF/Input tests, retests are stored in `test_attempts` table, so we need to LEFT JOIN with `test_attempts` to get retest answers.

**SQL Concept - Modify Multiple Choice Section:**
```sql
-- Multiple Choice Test Results (MODIFIED)
SELECT 
    'multiple_choice' as test_type,
    mc.id,
    mc.test_id,
    mc.test_name,
    mc.teacher_id,
    mc.subject_id,
    mc.grade,
    mc.class,
    mc.number,
    mc.student_id,
    mc.name,
    mc.surname,
    mc.nickname,
    COALESCE(mc.best_retest_score, mc.score) AS score,
    COALESCE(mc.best_retest_max_score, mc.max_score) AS max_score,
    mc.percentage,
    -- Use retest answers if retest_offered = true and retest exists, otherwise use original
    CASE 
        WHEN mc.retest_offered = true AND ta.answers IS NOT NULL 
        THEN ta.answers 
        ELSE mc.answers 
    END as answers,
    mc.time_taken,
    mc.started_at,
    mc.submitted_at,
    NULL::text as transcript,
    mc.caught_cheating,
    mc.visibility_change_times,
    mc.is_completed,
    mc.retest_offered,
    mc.retest_assignment_id,
    mc.attempt_number,
    mc.best_retest_score,
    mc.best_retest_max_score,
    mc.best_retest_percentage,
    mc.created_at,
    mc.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM multiple_choice_test_results mc
LEFT JOIN subjects s ON mc.subject_id = s.subject_id
-- LEFT JOIN with test_attempts to get retest answers when retest_offered = true
LEFT JOIN LATERAL (
    SELECT answers
    FROM test_attempts
    WHERE student_id = mc.student_id
      AND test_id = mc.test_id
      AND retest_assignment_id IS NOT NULL
    ORDER BY percentage DESC NULLS LAST, attempt_number DESC
    LIMIT 1
) ta ON mc.retest_offered = true
```

**Same pattern for True/False and Input tests.**

**Decision:** ✅ **RECOMMENDED** - Consistent with existing pattern, no new API needed, data comes with view automatically.

---

### Option 2: Create a New API Endpoint
**Pros:**
- Simple, focused endpoint
- Only called when needed (when `retest_offered = true`)
- Can query `test_attempts` directly without complex joins
- Easy to maintain and debug

**Cons:**
- One more API endpoint to maintain
- Need to make an additional HTTP request

**API Design:**
- **Endpoint:** `get-best-retest-attempt`
- **Method:** GET
- **Parameters:** `student_id`, `test_id`, `test_type`
- **Returns:** Best retest attempt object with `answers`, `score`, `max_score`, etc.
- **Query:** Direct query to `test_attempts` table

**Decision:** **RECOMMENDED** - Clean, simple, follows existing patterns.

---

### Option 3: Extend Existing API
**Pros:**
- No new endpoint
- Data comes with questions

**Cons:**
- `get-test-questions` shouldn't be coupled with student-specific data
- Violates separation of concerns (questions vs. student answers)
- Makes the API less reusable

**Decision:** Not recommended - mixing concerns.

---

## Recommended Implementation Plan

### Step 1: Modify `teacher_student_results_view` ✅
**File:** `database/views/teacher_student_results_view.sql`

**Changes:**
1. **Multiple Choice section (lines 55-93):**
   - Change `mc.answers` to a CASE statement that uses retest answers from `test_attempts` when `retest_offered = true`
   - Add LEFT JOIN LATERAL subquery to `test_attempts` table

2. **True/False section (lines 97-135):**
   - Same pattern as Multiple Choice

3. **Input section (lines 139-177):**
   - Same pattern as Multiple Choice

**Pattern (same as drawing tests):**
```sql
-- Use retest answers if retest_offered = true and retest exists, otherwise use original
CASE 
    WHEN mc.retest_offered = true AND ta.answers IS NOT NULL 
    THEN ta.answers 
    ELSE mc.answers 
END as answers,
```

**LEFT JOIN LATERAL:**
```sql
LEFT JOIN LATERAL (
    SELECT answers
    FROM test_attempts
    WHERE student_id = mc.student_id
      AND test_id = mc.test_id
      AND retest_assignment_id IS NOT NULL
    ORDER BY percentage DESC NULLS LAST, attempt_number DESC
    LIMIT 1
) ta ON mc.retest_offered = true
```

---

### Step 2: No Frontend Changes Needed! ✅
**File:** `src/teacher/TeacherResults.jsx`

**Why:** The view now automatically returns retest answers when `retest_offered = true`, so `testResult.answers` will already contain retest answers when appropriate.

**No code changes needed!** The existing `handleViewAnswers` function will automatically use retest answers because they come from the view.

---

## Summary

**Decision:** ✅ **Extend existing view** `teacher_student_results_view`

**Reasoning:**
1. **Drawing tests already do this** - Same pattern, just different source table
2. **No API changes needed** - Data comes automatically with view
3. **No frontend changes needed** - View handles the logic
4. **Consistent architecture** - Follows existing pattern
5. **Better performance** - Single query instead of multiple API calls

**Implementation Steps:**
1. ✅ Modify `database/views/teacher_student_results_view.sql`:
   - Add CASE statement for `answers` field in MC/TF/Input sections
   - Add LEFT JOIN LATERAL to `test_attempts` table
2. ✅ Run view migration/update in database
3. ✅ No frontend changes needed!

**Files to Modify:**
- 📝 `database/views/teacher_student_results_view.sql` (MODIFY MC, TF, Input sections)

**Files NOT Needed:**
- ❌ `functions/get-best-retest-attempt.js` (NOT needed)
- ❌ `src/services/testService.js` (NO changes)
- ❌ `src/teacher/TeacherResults.jsx` (NO changes)

