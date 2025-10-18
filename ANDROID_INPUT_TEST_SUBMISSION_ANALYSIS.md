# Android Input Test Submission Analysis

## Student ID Resolution in Android Input Test

### 1. Initial Student ID Loading
```javascript
useEffect(() => {
  // hydrate studentId and check test completion
  (async () => {
    try {
      const userRaw = await AsyncStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const sid = user?.student_id || user?.id || '';
      setStudentId(String(sid));
      
      // Check if test is already completed (web app pattern)
      if (sid && testId && type) {
        const completionKey = `test_completed_${sid}_${type}_${testId}`;
        const isCompleted = await AsyncStorage.getItem(completionKey);
        const retestKey = `retest1_${sid}_${type}_${testId}`;
        const hasRetest = await AsyncStorage.getItem(retestKey);
        
        if (isCompleted === 'true' && hasRetest !== 'true') {
          Alert.alert('Test Completed', 'This test has already been completed', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }
      }
    } catch {}
  })();
}, []);
```

### 2. Student ID Usage in Submission
```javascript
// In the onSubmitTest function:
const userData = await AsyncStorage.getItem('user');
const user = userData ? JSON.parse(userData) : null;

const payload = {
  test_id: testId!,
  test_name: questions[0]?.test_name || `Test ${testId}`,
  test_type: String(type || ''),
  teacher_id: questions[0]?.teacher_id || null,
  subject_id: questions[0]?.subject_id || null,
  student_id: user?.student_id || user?.id,  // ← KEY: Gets from AsyncStorage
  academic_period_id: 3, // TODO: Get from academic calendar
  answers: answers,
  score: null, // Will be calculated by backend
  maxScore: questions.length,
  time_taken: seconds,
  started_at: new Date(Date.now() - (seconds * 1000)).toISOString(),
  submitted_at: new Date().toISOString(),
  caught_cheating: false,
  visibility_change_times: 0,
  answers_by_id: null,
  question_order: questions.map(q => q.question_id),
  retest_assignment_id: null,
  parent_test_id: testId
};
```

### 3. Post-Submission Actions
```javascript
// Success - mark as completed and show results
if (studentId) {
  const completionKey = `test_completed_${studentId}_${type}_${testId}`;
  await AsyncStorage.setItem(completionKey, 'true');
  
  // Clear retest key if it exists
  const retestKey = `retest1_${studentId}_${type}_${testId}`;
  await AsyncStorage.removeItem(retestKey);
  
  // Clear progress key
  const progressKey = `test_progress_${studentId}_${type}_${testId}`;
  await AsyncStorage.removeItem(progressKey);
}
```

## Key Differences from Web App

### 1. Student ID Source
- **Web App**: `user.student_id` from `useAuth()` hook (Redux state)
- **Android**: `user?.student_id || user?.id` from AsyncStorage

### 2. Academic Period
- **Web App**: Dynamic import of `AcademicCalendarService` and get current term
- **Android**: Hardcoded to `3` with TODO comment

### 3. Retest Assignment ID
- **Web App**: Checks localStorage for retest assignment ID
- **Android**: Always `null` (not implemented)

### 4. Submission Method
- **Web App**: Direct API call to specific endpoint (`submit-matching-type-test`)
- **Android**: Uses `getSubmissionMethod()` to get the correct submission function

### 5. Error Handling
- **Web App**: Simple try/catch with notification
- **Android**: Complex error handling with retry options and fallback to local results

## The Problem with Matching Test

The matching test is failing because:

1. **Student ID Resolution**: The matching test tries to get `user?.student_id` from Redux, but the user object is `null`
2. **Missing AsyncStorage Fallback**: Unlike the input test, the matching test doesn't have the AsyncStorage fallback
3. **Different Submission Logic**: The matching test uses a different submission pattern than the input test

## Solution

The matching test should follow the same pattern as the input test:

1. Get student ID from AsyncStorage as fallback
2. Use the same submission method pattern
3. Handle the same post-submission actions
4. Use the same error handling approach

