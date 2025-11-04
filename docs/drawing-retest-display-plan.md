# Drawing Test Retest Display Plan

## Overview
In teacher cabinet, when viewing drawing test results:
- If `retest_offered = true` in the original test result, show the retest drawing instead of original
- Otherwise, show the original drawing

## Key Points
- Drawing tests have only **1 attempt** (unlike other tests that can have multiple)
- Retest results are stored in the same `drawing_test_results` table
- Original result: `retest_offered = true`, `retest_assignment_id = null` (or stores assignment ID)
- Retest result: `retest_assignment_id = <assignment_id>`, `attempt_number = 1`

## Data Structure

### Original Drawing Result
```sql
{
  id: <original_result_id>,
  test_id: <test_id>,
  student_id: <student_id>,
  retest_offered: true,
  retest_assignment_id: null,  -- or might store the assignment ID
  answers: <original_drawing_data>
}
```

### Retest Drawing Result
```sql
{
  id: <retest_result_id>,
  test_id: <test_id>,  -- same test_id as original
  student_id: <student_id>,  -- same student
  retest_assignment_id: <assignment_id>,  -- NOT NULL, indicates retest
  attempt_number: 1,  -- always 1 for drawing tests
  answers: <retest_drawing_data>
}
```

## Implementation Plan

### Step 1: Include `retest_assignment_id` in Result Mapping
**File:** `src/teacher/TeacherResults.jsx` (line ~287)

When mapping test results, include `retest_assignment_id` from the original result:
```javascript
studentResults[result.test_name] = {
  // ... existing fields ...
  retest_offered: result.retest_offered,
  retest_assignment_id: result.retest_assignment_id,  // ADD THIS
  // ... rest of fields ...
}
```

### Step 2: Modify `handleViewDrawing` to Check for Retest
**File:** `src/teacher/TeacherResults.jsx` (line ~682)

Logic:
1. Check if `result.retest_offered === true` AND `result.test_type === 'drawing'`
2. If yes, find retest result by querying:
   - Same `student_id`
   - Same `test_id`
   - `retest_assignment_id` matches AND is NOT NULL
   - `attempt_number = 1` (for drawing tests)
3. If retest result found, use its `answers` for drawing
4. Otherwise, use original `answers`

### Step 3: Query Retest Result (if needed)

**Option A: Query in Frontend**
- Add API call to fetch retest result by matching criteria
- Or include retest result in the initial results query

**Option B: Include Retest Data in Initial Query** (Recommended)
- Modify `get-teacher-student-results.js` to include retest drawing result when `retest_offered = true`
- Join with retest results table
- Return both original and retest data in the response

## Preferred Approach: Include Retest Data in Initial Query

### Step 1: Modify Backend Query
**File:** `functions/get-teacher-student-results.js`

When returning results, for drawing tests where `retest_offered = true`:
- Join with `drawing_test_results` to find retest result
- Match: same `student_id`, same `test_id`, `retest_assignment_id` NOT NULL
- Include retest `answers` in response

### Step 2: Modify Result Mapping
**File:** `src/teacher/TeacherResults.jsx`

When mapping results:
- If `retest_offered = true` and retest data exists, use retest `answers`
- Otherwise, use original `answers`

### Step 3: Update `handleViewDrawing`
**File:** `src/teacher/TeacherResults.jsx`

Simply use the `answers` field (which will already contain retest if available):
```javascript
const handleViewDrawing = useCallback((result) => {
  // result.answers already contains retest drawing if retest_offered = true
  setSelectedDrawing(result);
  setIsDrawingModalOpen(true);
}, []);
```

## Alternative: Query Retest on Demand

If we don't modify the backend query, we can:

### Step 1: Add Retest Query Function
**File:** `src/services/resultService.js`

Add function to fetch retest drawing result:
```javascript
getDrawingRetestResult = async (studentId, testId, retestAssignmentId) => {
  // Query for retest result matching criteria
}
```

### Step 2: Modify `handleViewDrawing`
**File:** `src/teacher/TeacherResults.jsx`

```javascript
const handleViewDrawing = useCallback(async (result) => {
  // If retest offered, fetch retest result
  if (result.retest_offered && result.test_type === 'drawing' && result.retest_assignment_id) {
    const retestResult = await resultService.getDrawingRetestResult(
      result.student_id,
      result.test_id,
      result.retest_assignment_id
    );
    if (retestResult && retestResult.answers) {
      // Use retest drawing
      setSelectedDrawing({ ...result, answers: retestResult.answers });
      setIsDrawingModalOpen(true);
      return;
    }
  }
  // Use original drawing
  setSelectedDrawing(result);
  setIsDrawingModalOpen(true);
}, []);
```

## Recommendation

**Use "Include Retest Data in Initial Query" approach** because:
1. More efficient (single query instead of multiple)
2. No extra API calls needed
3. Simpler frontend logic
4. Better user experience (no loading delay)

## Questions to Clarify

1. Does the original result store `retest_assignment_id` when retest is offered?
2. How do we match retest results - by `retest_assignment_id` or by checking if `retest_assignment_id IS NOT NULL`?
3. Should we show both original and retest, or only retest when available?

