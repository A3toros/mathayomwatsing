# Regular Test Completion Display (Web App)

This document explains how the web app determines and displays regular tests as Completed in the Student Cabinet.

## 1) Initialize completed tests from localStorage

On mount, we scan localStorage for keys in the format:
- `test_completed_{studentId}_{testType}_{testId}` set to "true"

Matching entries are added to the in-memory `completedTests` Set.

```268:296:src/student/StudentCabinet.jsx
// Check localStorage for test completion keys (new format only)
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith(`test_completed_${studentId}_`)) {
    const value = localStorage.getItem(key);
    if (value === 'true') {
      // Extract test type and ID from key (format: test_completed_studentId_type_id)
      const parts = key.replace(`test_completed_${studentId}_`, '').split('_');
      if (parts.length >= 2) {
        const testType = parts[0];
        const testId = parts.slice(1).join('_');
        const testKey = `${testType}_${testId}`;
        completed.add(testKey);
        logger.debug('🎓 Found completed test in localStorage:', testKey);
      }
    }
  }
}
setCompletedTests(completed);
setIsCompletionStatusLoaded(true);
```

## 2) Merge server results into completed tests

When new results arrive (`testResults` changes), we mark those tests as completed both in-memory and in localStorage.

```300:322:src/student/StudentCabinet.jsx
if (resultsArray && resultsArray.length > 0) {
  const studentId = user?.student_id || user?.id || '';
  const newCompleted = new Set();
  resultsArray.forEach(result => {
    // Use the same format as localStorage keys (with student ID)
    const key = `${result.test_type}_${result.test_id}`;
    newCompleted.add(key);
    // Also mark in localStorage (with student ID)
    localStorage.setItem(`test_completed_${studentId}_${result.test_type}_${result.test_id}`, 'true');
  });
  // Merge with existing completed tests instead of overwriting
  setCompletedTests(prev => {
    const merged = new Set([...prev, ...newCompleted]);
    return merged;
  });
}
```

## 3) Button rendering for Active Tests

When rendering each active test, we compute a key and read from `completedTests`.
- If `isCompleted` is true and the test is not a retest, we show the disabled Completed chip.

```872:889:src/student/StudentCabinet.jsx
{(() => {
  const testKey = `${test.test_type}_${test.test_id}`;
  const isCompleted = completedTests.has(testKey);

  // Show loading state while completion status is being determined
  if (!isCompletionStatusLoaded) {
    return (
      <Button variant="secondary" size="sm" disabled className="bg-gray-100 text-gray-500 border-gray-200">
        Loading...
      </Button>
    );
  }
```

```929:939:src/student/StudentCabinet.jsx
if (isCompleted) {
  return (
    <Button
      variant="secondary"
      size="xs"
      disabled
      className="bg-green-100 text-green-800 border-green-200"
    >
      ✓ Completed
    </Button)
  );
}
```

---

## Retests: How they differ

Retests have extra state and different display rules compared to regular tests.

### A) Retest state set on start
When a retest starts, we set specific localStorage keys and clear completion flags to avoid prematurely showing Completed.

```452:507:src/student/StudentCabinet.jsx
if (test?.retest_available) {
  const studentId = user?.student_id || user?.id || '';
  const retestKey = `retest1_${studentId}_${test.test_type}_${test.test_id}`;
  localStorage.setItem(retestKey, 'true');
  // Clear completion flags so UI doesn't show Completed badge
  const completedKeyNew = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
  localStorage.removeItem(completedKeyNew);
  const legacyCompletedKey = `${test.test_type}_${test.test_id}`;
  localStorage.removeItem(legacyCompletedKey);
  // In-progress lock and cache cleanups...
  const inProgressKey = `retest_in_progress_${studentId}_${test.test_type}_${test.test_id}`;
  localStorage.setItem(inProgressKey, '1');
  // Attempts meta key (kept):
  const attemptsMetaKey = `retest_attempts_${studentId}_${test.test_type}_${test.test_id}`;
}
```

### B) Retest button rendering
- If the item is already completed and `retest_available` is true, we check attempts meta; if attempts are exhausted we show Completed, else show Start Retest.
- If not completed and `retest_available` is true, we show Start Retest.

```891:927:src/student/StudentCabinet.jsx
// Allow retest start even if completed, when backend flags retest_available
if (isCompleted && test?.retest_available) {
  const studentId = user?.student_id || user?.id || '';
  let attemptsDisabled = false;
  const metaRaw = localStorage.getItem(`retest_attempts_${studentId}_${test.test_type}_${test.test_id}`);
  if (metaRaw) {
    const meta = JSON.parse(metaRaw);
    if (typeof meta?.used === 'number' && typeof meta?.max === 'number' && meta.used >= meta.max) {
      attemptsDisabled = true;
    }
  }
  if (attemptsDisabled) {
    return (/* ✓ Completed chip */);
  }
  return (/* Start Retest button */);
}
```

If the test is completed and not a retest, we always show Completed.

```929:939:src/student/StudentCabinet.jsx
if (isCompleted) {
  return (/* ✓ Completed chip */);
}
```

### C) What marks a retest as Completed
- Regular results merging marks any finished test as completed (see section 2).
- For retests, the UI avoids showing Completed immediately by clearing completion keys on retest start (A) and only rendering Completed when attempts are exhausted (or when business rules deem it completed).

This ensures:
- Regular tests: Completed appears immediately after submission.
- Retests: Start Retest remains until attempts run out (or other business rules), then flips to Completed.

## Why retests look Completed only after refresh (but regular tests are instant)

Root causes in current flow:

- On retest start we explicitly clear completion flags, so the UI cannot show Completed immediately even if a result will be posted moments later.

```440:463:src/student/StudentCabinet.jsx
if (completedTests.has(testKey) && !test?.retest_available) {
  showNotification('This test has already been completed', 'warning');
  return;
}

// Set retest1_ key if this is a retest (regardless of completion status)
...
// Mirror other tests: clear completion flags so UI doesn't show Completed badge
try {
  const completedKeyNew = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
  localStorage.removeItem(completedKeyNew);
  const legacyCompletedKey = `${test.test_type}_${test.test_id}`;
  localStorage.removeItem(legacyCompletedKey);
  ...
}
```

- For regular tests, we mark completion immediately when results arrive, updating both localStorage and the in-memory `completedTests` set. That makes the Completed chip appear instantly without a reload.

```300:322:src/student/StudentCabinet.jsx
if (resultsArray && resultsArray.length > 0) {
  const studentId = user?.student_id || user?.id || '';
  const newCompleted = new Set();
  resultsArray.forEach(result => {
    const key = `${result.test_type}_${result.test_id}`;
    newCompleted.add(key);
    localStorage.setItem(`test_completed_${studentId}_${result.test_type}_${result.test_id}`, 'true');
  });
  setCompletedTests(prev => new Set([...prev, ...newCompleted]));
}
```

- For retests, even after results arrive, the button logic still favors showing “Start Retest” while attempts remain, only switching to “✓ Completed” when attempts meta indicates no remaining attempts (or when other business rules mark it so). That makes it appear as if Completion happens after a refresh (which re-evaluates localStorage/meta) rather than instantly.

```891:927:src/student/StudentCabinet.jsx
// Allow retest start even if completed, when backend flags retest_available
if (isCompleted && test?.retest_available) {
  const studentId = user?.student_id || user?.id || '';
  let attemptsDisabled = false;
  const metaRaw = localStorage.getItem(`retest_attempts_${studentId}_${test.test_type}_${test.test_id}`);
  if (metaRaw) {
    const meta = JSON.parse(metaRaw);
    if (typeof meta?.used === 'number' && typeof meta?.max === 'number' && meta.used >= meta.max) {
      attemptsDisabled = true;
    }
  }
  if (attemptsDisabled) { /* show ✓ Completed */ } else { /* show Start Retest */ }
}
```

- On page/app refresh (or navigating back through flows that re-run initialization), the cabinet re-scans localStorage and re-derives `completedTests`, while any attempts meta may now reflect the exhausted state—thus the button flips to “✓ Completed.”

```268:296:src/student/StudentCabinet.jsx
// Initialize completed tests from localStorage on mount
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith(`test_completed_${studentId}_`)) {
    ... // add to completedTests
  }
}
setCompletedTests(completed);
```

In short: regular tests set completion immediately from results; retests intentionally clear completion at start and only render Completed after attempts are gone (or pass rules), which often coincides with a subsequent refresh/re-evaluation.

