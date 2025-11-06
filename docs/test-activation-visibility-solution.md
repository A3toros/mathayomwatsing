# Test Activation & Visibility Solution

## Overview
Implement a system where:
1. **On Creation**: Tests are invisible to students but visible to teachers
2. **Activate Button**: Teachers can activate tests to make them visible to students
3. **Complete Button**: When marked complete, tests become invisible to both teachers and students

## Current State Analysis

### Database Schema
- `test_assignments.is_active` (BOOLEAN DEFAULT true) - Controls visibility
- Currently: Tests created with `is_active = true` (visible to both)
- Currently: `teacher_active_tests_view` filters `WHERE ta.is_active = true`
- Currently: `student_active_tests_view` filters `WHERE ta.is_active = true` (line 21)

### Test Creation Functions
- `functions/save-test-with-assignments.js` (line 454): Sets `is_active = true`
- `functions/assign-test.js` (line 161): Sets `is_active = true`
- `functions/save-speaking-test-with-assignments.js` (line 182): Sets `is_active = true`
- `functions/assign-test-to-classes.js`: Sets `is_active = true`

### Teacher Cabinet
- `src/teacher/TeacherCabinet.jsx` (line 2163-2177): Has "Complete" button
- Missing: "Activate" button
- Uses `teacher_active_tests_view` which filters by `is_active = true`

### Student Cabinet
- Uses `student_active_tests_view` which filters by `is_active = true` (correct - students should only see active tests)

## Proposed Solution

### 1. Change Default `is_active` to `false` on Test Creation

**Files to Modify:**
- `functions/save-test-with-assignments.js` (line 454)
- `functions/assign-test.js` (line 161)
- `functions/save-speaking-test-with-assignments.js` (line 182)
- `functions/assign-test-to-classes.js` (if exists)

**Change:**
```javascript
// FROM:
is_active, true, NOW(), NOW()

// TO:
is_active, false, NOW(), NOW()
```

**Result:** New tests are created with `is_active = false` (invisible to students)

---

### 2. Modify `teacher_active_tests_view` to Show ALL Tests (Remove `is_active` Filter)

**File:** `database/views/teacher_active_tests_view.sql`

**Current State:** All test type blocks filter by `WHERE ta.is_active = true` (lines 35, 63, 91, 119, 147, 175, 203, 231)

**Change:** Remove `WHERE ta.is_active = true` from all UNION blocks

**Example Change (Multiple Choice block):**
```sql
-- FROM:
FROM multiple_choice_tests mct
INNER JOIN test_assignments ta ON mct.id = ta.test_id AND ta.test_type = 'multiple_choice'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.is_active = true
GROUP BY ...

-- TO:
FROM multiple_choice_tests mct
INNER JOIN test_assignments ta ON mct.id = ta.test_id AND ta.test_type = 'multiple_choice'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY ...
```

**Result:** Teachers see all tests regardless of `is_active` status

---

### 3. Keep `student_active_tests_view` Filtering by `is_active = true`

**File:** `database/views/student_active_tests_view.sql`

**Action:** NO CHANGE - Keep line 21: `WHERE ta.is_active = true`

**Result:** Students only see tests where `is_active = true`

---

### 4. Create New Backend Function: `activate-test.js`

**New File:** `functions/activate-test.js`

**Purpose:** Set `is_active = true` for a test's assignments

**Structure:**
```javascript
const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is teacher
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { test_type, test_id } = JSON.parse(event.body) || {};
    
    if (!test_type || !test_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test type and test ID are required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;
    
    // Update all test assignments for this test to set is_active = true
    const updateResult = await sql`
      UPDATE test_assignments 
      SET is_active = true, updated_at = NOW()
      WHERE test_type = ${test_type} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
      RETURNING id, test_type, test_id, grade, class
    `;

    if (updateResult.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No assignments found for this test or you do not have permission to modify this test' })
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Test activated successfully - students can now see this test',
        test_id: test_id,
        test_type: test_type,
        assignments_activated: updateResult.length,
        assignments: updateResult
      })
    };

  } catch (error) {
    console.error('Error activating test:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
```

---

### 5. Add `activateTest` Method to `testService.js`

**File:** `src/services/testService.js`

**Add after `markTestCompleted` method (around line 704):**

```javascript
async activateTest(testType, testId) {
  try {
    console.log(`[DEBUG] activateTest called with testType: ${testType}, testId: ${testId}`);
    
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/activate-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_type: testType,
        test_id: testId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[DEBUG] Activate test response:', result);

    if (result.success) {
      console.log(`Test ${testType}_${testId} activated successfully`);
      return { success: true, message: result.message };
    } else {
      throw new Error(result.error || 'Failed to activate test');
    }
  } catch (error) {
    console.error('Error activating test:', error);
    throw error;
  }
}
```

---

### 6. Add "Activate" Button to Teacher Cabinet

**File:** `src/teacher/TeacherCabinet.jsx`

**Add state for activating test (around line 90):**
```javascript
const [activatingTestId, setActivatingTestId] = useState(null);
```

**Add `activateTest` function (after `markCompleted`, around line 590):**
```javascript
const activateTest = useCallback(async (testType, testId) => {
  logger.debug('👨‍🏫 Activating test:', testType, testId);
  setActivatingTestId(testId);
  try {
    const result = await testService.activateTest(testType, testId);
    if (result.success) {
      showNotification('Test activated! Students can now see this test.', 'success');
      
      // Clear the cache to force fresh data
      const cacheKey = `teacher_tests_${user?.teacher_id || user?.id || ''}`;
      localStorage.removeItem(cacheKey);
      logger.debug('👨‍🏫 Cleared teacher tests cache');
      
      await loadTests();
    } else {
      throw new Error(result.error || 'Failed to activate test');
    }
  } catch (error) {
    logger.error('👨‍🏫 Error activating test:', error);
    showNotification('Failed to activate test', 'error');
  } finally {
    setActivatingTestId(null);
  }
}, [loadTests, showNotification, user?.teacher_id, user?.id]);
```

**Modify button section (around line 2138-2178):**
```javascript
<div className="flex gap-2 ml-4 flex-shrink-0">
  {/* Activate Button - Show only if test is inactive */}
  {test.assignments && test.assignments.some(a => !a.is_active) && (
    <Button
      variant="primary"
      onClick={() => activateTest(test.test_type, test.test_id)}
      size="sm"
      disabled={activatingTestId === test.test_id}
    >
      {activatingTestId === test.test_id ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Activating...
        </div>
      ) : (
        'Activate'
      )}
    </Button>
  )}
  
  {/* Mobile: Show details in button */}
  <div className="sm:hidden">
    <Button
      variant="outline"
      onClick={() => handleShowTestDetails(test)}
      size="sm"
      className="text-xs"
      title={`Type: ${test.test_type} | Assignments: ${test.assignments?.length || 0} | Classes: ${test.assignments?.map(a => `${a.grade}/${a.class}`).join(', ') || 'None'} | ${new Date(test.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })}`}
    >
      Details
    </Button>
  </div>
  
  {/* Desktop: Regular details button */}
  <div className="hidden sm:block">
    <Button
      variant="outline"
      onClick={() => handleShowTestDetails(test)}
      size="sm"
    >
      Details
    </Button>
  </div>
  
  <Button
    variant="success"
    onClick={() => markCompleted(test.test_type, test.test_id)}
    size="sm"
    disabled={completingTestId === test.test_id}
  >
    {completingTestId === test.test_id ? (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Completing...
      </div>
    ) : (
      'Complete'
    )}
  </Button>
</div>
```

**Note:** The view needs to include `is_active` in the assignments array. Check if `teacher_active_tests_view` returns `is_active` in the assignments JSON.

---

### 7. Update `teacher_active_tests_view` to Include `is_active` in Assignments

**File:** `database/views/teacher_active_tests_view.sql`

**Modify ARRAY_AGG to include `is_active` (all test type blocks):**

```sql
ARRAY_AGG(
    JSON_BUILD_OBJECT(
        'assignment_id', ta.id,
        'grade', ta.grade,
        'class', ta.class,
        'assigned_at', ta.assigned_at,
        'is_active', ta.is_active,  -- ADD THIS LINE
        'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
    )
) FILTER (WHERE ta.id IS NOT NULL) as assignments
```

**Result:** Frontend can check `test.assignments.some(a => !a.is_active)` to show/hide Activate button

---

## Summary of Changes

### Database Changes
1. ✅ Change default `is_active = false` in test creation functions (4 files)
2. ✅ Remove `WHERE ta.is_active = true` from `teacher_active_tests_view` (8 UNION blocks)
3. ✅ Add `is_active` to assignments JSON in `teacher_active_tests_view` (8 UNION blocks)
4. ✅ Keep `WHERE ta.is_active = true` in `student_active_tests_view` (no change)

### Backend Changes
1. ✅ Create `functions/activate-test.js` (new file)

### Frontend Changes
1. ✅ Add `activateTest` method to `testService.js`
2. ✅ Add `activateTest` function to `TeacherCabinet.jsx`
3. ✅ Add "Activate" button to `TeacherCabinet.jsx` (conditional on `is_active = false`)
4. ✅ Keep "Complete" button functionality (no change)

## Expected Behavior After Implementation

### Test Creation Flow
1. Teacher creates test → `is_active = false` (invisible to students)
2. Test appears in Teacher Cabinet (because view shows all tests)
3. Test does NOT appear in Student Cabinet (because `is_active = false`)

### Activation Flow
1. Teacher clicks "Activate" button → `is_active = true`
2. Test remains visible in Teacher Cabinet
3. Test NOW appears in Student Cabinet (because `is_active = true`)

### Completion Flow
1. Teacher clicks "Complete" button → `is_active = false`
2. Test disappears from Teacher Cabinet (because view filters by `is_active = true`... wait, we removed that filter)
3. **ISSUE:** With current proposal, completed tests would still show in Teacher Cabinet

### Fix for Completion Visibility

**Option A:** Add `is_active` status indicator in Teacher Cabinet, filter completed tests in UI
**Option B:** Create separate view `teacher_all_tests_view` (shows all) and `teacher_active_tests_view` (shows only active)
**Option C:** Add `is_completed` flag to track completion separately from `is_active`

**Recommended: Option B** - Keep two views:
- `teacher_active_tests_view`: Shows only `is_active = true` (for main cabinet)
- `teacher_all_tests_view`: Shows all tests (for management/archive view)

**OR simpler: Option C** - Add completion tracking:
- Add `completed_at TIMESTAMP` to `test_assignments` table
- Filter completed tests in view: `WHERE ta.completed_at IS NULL`
- "Complete" button sets `completed_at = NOW()` instead of `is_active = false`
- Keep `is_active` for student visibility only

**Simplest Solution:** Keep current "Complete" behavior but modify view to exclude completed tests:
- Add `completed_at TIMESTAMP` column to `test_assignments`
- "Complete" sets `completed_at = NOW()` (don't change `is_active`)
- `teacher_active_tests_view` filters: `WHERE ta.completed_at IS NULL`
- Students still filter by `is_active = true`

This way:
- `is_active` = student visibility (true = visible, false = hidden)
- `completed_at` = teacher visibility (NULL = visible, NOT NULL = hidden)

## Revised Solution (Simpler)

### Additional Changes Needed

1. **Add `completed_at` column to `test_assignments` table:**
```sql
ALTER TABLE test_assignments 
ADD COLUMN completed_at TIMESTAMP;
```

2. **Modify `mark-test-completed.js`:**
```javascript
// FROM:
SET is_active = false, updated_at = NOW()

// TO:
SET completed_at = NOW(), updated_at = NOW()
```

3. **Modify `teacher_active_tests_view`:**
```sql
-- Add filter:
WHERE ta.completed_at IS NULL
```

4. **Keep `is_active` for student visibility only**

This way:
- Creation: `is_active = false`, `completed_at = NULL` → Visible to teachers, hidden from students
- Activate: `is_active = true`, `completed_at = NULL` → Visible to both
- Complete: `is_active = true/false` (unchanged), `completed_at = NOW()` → Hidden from teachers, students see based on `is_active`

## Final Recommendation

Use the **revised solution** with `completed_at` column:
- Cleaner separation of concerns
- `is_active` = student visibility
- `completed_at` = teacher visibility
- No need to change `is_active` on completion
- Simpler logic

