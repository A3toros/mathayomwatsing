# COMPLETE RETEST FLOW TRACE

## STEP 1: Teacher Clicks Failing Score
**Location**: `src/teacher/TeacherResults.jsx` line 1395-1404
```javascript
onClick={isRed ? (e) => { 
  e.preventDefault();
  e.stopPropagation();
  openRetestModal({ 
    failedStudentIds: [student.student_id],
    test_type: test.test_type,
    original_test_id: testResult?.test_id || test.test_id,
    subject_id: testResult?.subject_id || test.subject_id
  }); 
} : undefined}
```

## STEP 2: Teacher Opens Retest Modal
**Location**: `src/teacher/TeacherCabinet.jsx` line 683-700
```javascript
const openRetestModal = useCallback(async (opts) => {
  const { test_type, original_test_id, subject_id, failedStudentIds = [] } = opts || {};
  
  setRetestForm({
    test_type: test_type || 'multiple_choice',
    original_test_id: original_test_id || '',
    subject_id: subject_id || '',
    passing_threshold: 50,
    scoring_policy: 'BEST',
    max_attempts: 1,
    window_days: 2,
    student_ids: failedStudentIds
  });
  setShowRetestModal(true);
}, []);
```

## STEP 3: Teacher Creates Retest
**Location**: `src/teacher/TeacherCabinet.jsx` line 702-726
```javascript
const createRetest = useCallback(async () => {
  const payload = {
    ...retestForm,
    grade: selectedGrade,
    class: selectedClass,
    window_start: now.toISOString(),
    window_end: windowEnd.toISOString()
  };
  
  await mod.retestService.createRetestAssignment(payload);
  showNotification('Retest created', 'success');
  setShowRetestModal(false);
  loadRetests();
}, []);
```

## STEP 4: Backend Creates Retest Records
**Location**: `functions/create-retest-assignment.js` line 56-84
```javascript
const insertAssignment = await sql`
  INSERT INTO retest_assignments(
    test_type, test_id, teacher_id, subject_id, grade, class, passing_threshold, scoring_policy, max_attempts, window_start, window_end
  ) VALUES (...)
  RETURNING id
`;
const retestId = insertAssignment[0].id;

for (const sid of student_ids) {
  await sql`
    INSERT INTO retest_targets(retest_assignment_id, student_id)
    VALUES(${retestId}, ${sid})
    ON CONFLICT (retest_assignment_id, student_id) DO NOTHING
  `;
}
```

## STEP 5: Student Sees Retest in Cabinet
**Location**: `functions/get-student-active-tests.js` line 306-325
```javascript
const retestRows = await sql`
  SELECT rt.id as retest_target_id, rt.attempt_count, ra.id as retest_assignment_id, ra.max_attempts, ra.window_start, ra.window_end, rt.status
  FROM retest_targets rt
  JOIN retest_assignments ra ON ra.id = rt.retest_assignment_id
  WHERE rt.student_id = ${student_id}
    AND ra.test_type = ${assignment.test_type}
    AND ra.test_id = ${assignment.test_id}
    AND NOW() BETWEEN ra.window_start AND ra.window_end
    AND (rt.status = 'PENDING' OR rt.status = 'FAILED')
    AND (ra.max_attempts IS NULL OR rt.attempt_count < ra.max_attempts)
`;
retestAvailable = Array.isArray(retestRows) && retestRows.length > 0;
```

## STEP 6: Student Clicks "Start Retest"
**Location**: `src/student/StudentCabinet.jsx` line 410-434
```javascript
const handleTestStart = useCallback(async (test) => {
  const isCompleted = await checkTestCompleted(test.test_type, test.test_id, test?.retest_available, test);
  if (isCompleted && !test?.retest_available) {
    showNotification('This test has already been completed', 'warning');
    return;
  }
  startTest(test);
}, []);
```

## STEP 7: Student Starts Test
**Location**: `src/student/StudentCabinet.jsx` line 364-397
```javascript
const startTest = useCallback((test) => {
  // Check if test is already completed (but allow retests)
  const testKey = `${test.test_type}_${test.test_id}`;
  if (completedTests.has(testKey) && !test?.retest_available) {
    showNotification('This test has already been completed', 'warning');
    return;
  }
  
  // Navigate to the test page
  navigate(`/student/test/${test.test_type}/${test.test_id}`);
}, []);
```

## STEP 8: Student Takes Test
**Location**: `src/student/StudentTests.jsx` line 375-389
```javascript
// Check if test is already completed before starting (but allow retests)
const studentIdStart = user?.student_id || user?.id || '';
const completedKey = `test_completed_${studentIdStart}_${test.test_type}_${test.test_id}`;
const isCompleted = localStorage.getItem(completedKey) === 'true';

if (isCompleted && !test?.retest_available) {
  console.log('🎓 Test already completed, redirecting to main cabinet');
  showNotification('This test has already been completed', 'info');
  navigate('/student');
  return;
}

if (isCompleted && test?.retest_available) {
  console.log('🎓 Test completed but retest available, allowing retest');
}
```

## STEP 9: Student Submits Test
**Location**: `src/student/StudentTests.jsx` line 576-598
```javascript
const result = await testService.submitTest(
  currentTest.test_type,
  currentTest.test_id,
  studentAnswers,
  {
    // ... timing data ...
    retest_assignment_id: currentTest?.retest_assignment_id || null,
    parent_test_id: currentTest?.retest_assignment_id ? currentTest.test_id : null
  },
  user
);
```

## STEP 10: Backend Processes Retest Submission
**Location**: `functions/submit-multiple-choice-test.js` line 211-242
```javascript
if (retest_assignment_id) {
  // For retests, find the next available attempt number
  const existingAttempts = await sql`
    SELECT MAX(attempt_number) as max_attempt 
    FROM test_attempts 
    WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
  `;
  const nextAttemptNumber = (existingAttempts[0]?.max_attempt || 0) + 1;
  
  result = await sql`
    INSERT INTO test_attempts (
      student_id, test_id, attempt_number, score, max_score, percentage, 
      time_taken, started_at, submitted_at, is_completed,
      answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
      retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
      name, surname, nickname, academic_period_id
    )
    VALUES (...)
    RETURNING id
  `;
}
```

## STEP 11: Client Tracks Attempt
**Location**: `src/student/StudentTests.jsx` line 602-642
```javascript
if (result.success) {
  const studentId = user?.student_id || user?.id || '';
  const retestKey = `retest1_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
  const isRetest = localStorage.getItem(retestKey) === 'true';
  
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
    
    // Mark this specific attempt as completed
    const attemptKey = `retest_attempt${nextAttemptNumber}_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
    localStorage.setItem(attemptKey, 'true');
    
    // Check if max attempts reached
    const totalAttempts = attemptKeys.length;
    const maxAttempts = currentTest?.retest_attempts_left || currentTest?.max_attempts || 3;
    
    if (totalAttempts >= maxAttempts) {
      localStorage.removeItem(retestKey);
    }
  }
}
```

## THE REAL PROBLEM FOUND

After tracing the complete flow, I found the **actual issue**:

### **CRITICAL FLAW: The `retest1_` key is NEVER SET**

**Evidence**: 
- In Step 11, the code checks: `const isRetest = localStorage.getItem(retestKey) === 'true';`
- But the `retest1_` key is **never set anywhere** in the entire flow
- This means `isRetest` is always `false`
- Therefore, the retest attempt tracking logic **never executes**

### **THE MISSING PIECE**

**Where it should be set**: In Step 7 when student starts the test, but it's missing.

**The fix**: In `src/student/StudentCabinet.jsx` in the `startTest` function:
```javascript
const startTest = useCallback((test) => {
  // ... existing code ...
  
  // MISSING: Set retest1_ key if this is a retest
  if (test?.retest_available) {
    const studentId = user?.student_id || user?.id || '';
    const retestKey = `retest1_${studentId}_${test.test_type}_${test.test_id}`;
    localStorage.setItem(retestKey, 'true');
    console.log('🎓 Set retest key:', retestKey);
  }
  
  navigate(`/student/test/${test.test_type}/${test.test_id}`);
}, []);
```

### **SECONDARY ISSUE: Missing Database Updates**

The backend writes to `test_attempts` but doesn't update `retest_targets.attempt_count` and `retest_targets.status`.

## CONCLUSION

The retest system is **architecturally sound** but has **one critical missing piece**: the `retest1_` key is never set, so the retest attempt tracking never works. This is a **simple one-line fix** in the `startTest` function.
