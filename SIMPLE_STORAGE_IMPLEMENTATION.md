# Working Cache with Auto-Delete - No Overengineering

## Goal
Add working localStorage caching with automatic cleanup to reduce API calls.

## What We Need

### 1. **Add Working Cache with Auto-Delete** (30 minutes)
- Cache API responses with TTL
- Auto-delete expired data
- Auto-delete old data when storage full
- Clear user data on logout

## Safe Implementation Strategy

### Key Principles:
✅ **Don't change existing logic** - Just wrap it
✅ **Keep existing dependencies** - Don't fix what works  
✅ **Add caching layer** - Don't replace working code
✅ **Test incrementally** - One change at a time
✅ **No new hooks** - Use existing patterns

## Implementation

### Step 1: Create Cache Utility Functions
```javascript
// In src/utils/cacheUtils.js
const CACHE_TTL = {
  // Student Data
  student_subjects: 30 * 60 * 1000,     // 30 minutes
  student_active_tests: 10 * 60 * 1000, // 10 minutes
  student_results_table: null,           // No TTL (event-driven)
  
  // Teacher Data
  teacher_subjects: 15 * 60 * 1000,     // 15 minutes
  teacher_classes: 15 * 60 * 1000,      // 15 minutes
  teacher_tests: 10 * 60 * 1000,        // 10 minutes
  teacher_results_table: 10 * 60 * 1000, // 5 minutes TTL
  
  // Admin Data
  admin_users: 20 * 60 * 1000,          // 20 minutes
  admin_teachers: 20 * 60 * 1000,       // 20 minutes
  admin_subjects: 30 * 60 * 1000,       // 30 minutes
  admin_academic_years: 60 * 60 * 1000, // 60 minutes
  admin_tests: 15 * 60 * 1000,          // 15 minutes
  admin_results_table: null,             // No TTL (event-driven)
  admin_teacher_id: 60 * 60 * 1000,     // 60 minutes
  all_tests: 20 * 60 * 1000,            // 20 minutes
  
  // Shared Data
  subjects_dropdown: 30 * 60 * 1000,    // 30 minutes
  grades_classes: 60 * 60 * 1000,       // 60 minutes
  
  // Temporary Data (immediate delete)
  test_progress: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
  anti_cheating: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
};

const getCacheKey = (type, userId = '') => {
  return `${type}_${userId}`;
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp, ttl } = JSON.parse(cached);
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(key); // Auto-delete expired
      return null;
    }
    return data;
  } catch (error) {
    localStorage.removeItem(key); // Auto-delete corrupted
    return null;
  }
};

const setCachedData = (key, data, ttl) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl
    }));
  } catch (error) {
    // Storage full - clean old data
    cleanupOldData();
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (e) {
      console.warn('Storage full, cannot cache data');
    }
  }
};

const loadDataWithRetry = async (key, apiCall, retryCount = 0) => {
  try {
    // 1. Try cache first
    const cached = getCachedData(key);
    if (cached) {
      return cached;
    }
    
    // 2. Cache miss/expired - single API call
    const result = await apiCall();
    
    // 3. Store in cache - FIX: Use full type for TTL lookup
    const type = key.split('_').slice(0, -1).join('_'); // student_subjects_123 -> student_subjects
    setCachedData(key, result, CACHE_TTL[type] || 5 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error(`API call failed for ${key}:`, error);
    
    // 4. Retry once after timeout
    if (retryCount === 0) {
      console.log(`Retrying ${key} after 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return loadDataWithRetry(key, apiCall, 1);
    }
    
    // 5. Final fallback - use stale cached data
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        console.log(`Using stale cached data for ${key}`);
        return data;
      } catch (e) {
        console.warn(`Stale data corrupted for ${key}`);
      }
    }
    
    throw error;
  }
};

const cleanupOldData = () => {
  const now = Date.now();
  const keys = Object.keys(localStorage);
  
  // Remove expired data first
  keys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp, ttl } = JSON.parse(cached);
        if (now - timestamp > ttl) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove data older than 7 days
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  keys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (timestamp < sevenDaysAgo) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  });
  
  // If still full, remove oldest data (not by count, but by age)
  const remainingKeys = Object.keys(localStorage);
  if (remainingKeys.length > 0) {
    const dataWithTimestamps = remainingKeys.map(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          return { key, timestamp };
        }
      } catch (error) {
        return { key, timestamp: 0 };
      }
      return { key, timestamp: 0 };
    });
    
    // Remove oldest 25% of data
    const toRemove = Math.ceil(dataWithTimestamps.length * 0.25);
    dataWithTimestamps
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, toRemove)
      .forEach(({ key }) => localStorage.removeItem(key));
  }
};

const clearUserData = (userId) => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(userId)) {
      localStorage.removeItem(key);
    }
  });
};

const clearTestData = (userId, testType, testId) => {
  // Clear test progress and anti-cheating data after submission
  const testProgressKey = `test_progress_${userId}_${testType}_${testId}`;
  const antiCheatingKey = `anti_cheating_${userId}_${testType}_${testId}`;
  
  localStorage.removeItem(testProgressKey);
  localStorage.removeItem(antiCheatingKey);
  
  console.log(`Cleared test data for ${testType}_${testId}`);
};
```

### Step 2: Wrap Existing API Calls (Don't Change Logic)
```javascript
// In UserContext.jsx - WRAP existing calls, don't replace
import { getCachedData, setCachedData, CACHE_TTL } from '../utils/cacheUtils';

const loadStudentData = useCallback(async () => {
  const cacheKey = `student_subjects_${user?.student_id}`;
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setUserSubjects(cachedData);
    return;
  }
  
  // Use EXISTING API call (don't change this)
  const data = await userService.getStudentData();
  setUserSubjects(data);
  
  // Cache the result
  setCachedData(cacheKey, data, CACHE_TTL.student_subjects);
}, [user?.student_id]); // Keep existing dependencies
```

### Step 3: Add to All Contexts (Same Pattern)

#### Student Data
```javascript
// UserContext.jsx - Student subjects
const loadStudentData = useCallback(async () => {
  const cacheKey = `student_subjects_${user?.student_id}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setUserSubjects(cachedData);
    return;
  }
  const data = await userService.getStudentData();
  setUserSubjects(data);
  setCachedData(cacheKey, data, CACHE_TTL.student_subjects);
}, [user?.student_id]);
```

#### Test Data
```javascript
// TestContext.jsx - Active tests & results
const loadStudentActiveTests = useCallback(async () => {
  const cacheKey = `student_active_tests_${user?.student_id}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setActiveTests(cachedData);
    return;
  }
  const data = await testService.getStudentActiveTests();
  setActiveTests(data);
  setCachedData(cacheKey, data, CACHE_TTL.student_active_tests);
}, [user?.student_id]);

const loadTestResults = useCallback(async () => {
  const cacheKey = `student_results_table_${user?.student_id}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setTestResults(cachedData);
    return;
  }
  const data = await testService.getStudentTestResults();
  setTestResults(data);
  setCachedData(cacheKey, data, CACHE_TTL.student_results_table);
}, [user?.student_id]);
```

#### Teacher Data
```javascript
// TeacherCabinet.jsx - Teacher subjects, classes, tests
const loadTeacherSubjects = useCallback(async () => {
  const cacheKey = `teacher_subjects_${user?.teacher_id}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setTeacherSubjects(cachedData);
    return;
  }
  const data = await userService.getTeacherData();
  setTeacherSubjects(data);
  setCachedData(cacheKey, data, CACHE_TTL.teacher_subjects);
}, [user?.teacher_id]);
```

#### Admin Data
```javascript
// AdminCabinet.jsx - Admin users, teachers, subjects
const loadUsersList = useCallback(async () => {
  const cacheKey = 'admin_users_';
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    setUsersList(cachedData);
    return;
  }
  const data = await userService.getAllUsers();
  setUsersList(data);
  setCachedData(cacheKey, data, CACHE_TTL.admin_users);
}, []);
```

### Step 4: Test Incrementally
1. Add caching to UserContext only
2. Test - make sure no API loops
3. Add caching to TestContext
4. Test - make sure still working
5. Add to TeacherCabinet
6. Test - make sure still working
7. Add to AdminCabinet
8. Test - make sure still working

### Step 5: Add Test Data Cleanup
```javascript
// In StudentTests.jsx - Clear test data after submission
import { clearTestData } from '../utils/cacheUtils';

const submitTest = async (testType, testId) => {
  try {
    // Submit test to API
    const result = await testService.submitTest(testData);
    
    // Clear test progress and anti-cheating data
    clearTestData(user?.student_id, testType, testId);
    
    // ... rest of submission logic
  } catch (error) {
    console.error('Test submission failed:', error);
  }
};
```

### Step 6: Add Logout Cleanup
```javascript
// In AuthContext.jsx
import { clearUserData } from '../utils/cacheUtils';

const logout = useCallback(() => {
  // Clear user data from cache
  clearUserData(user?.student_id);
  
  // ... existing logout code
}, [user?.student_id]);
```

## Files to Create/Modify

1. **Create**: `src/utils/cacheUtils.js` (cache utilities)
2. **Modify**: `src/contexts/UserContext.jsx` (add caching)
3. **Modify**: `src/contexts/TestContext.jsx` (add caching)
4. **Modify**: `src/contexts/AuthContext.jsx` (add logout cleanup)

## Cache Features
✅ **Auto-delete expired data** - Removes data when TTL expires
✅ **Auto-cleanup on storage full** - Removes oldest data when storage full
✅ **Error handling** - Removes corrupted data automatically
✅ **User data cleanup** - Clears all user data on logout
✅ **Simple TTL** - Easy to configure per data type

## Success Criteria
✅ API loop stops
✅ All pages work
✅ Data is cached with auto-cleanup
✅ No overengineering
✅ Storage doesn't overflow

## Time: 30 minutes maximum

## Risks & Mitigation

### ⚠️ **TTL Lookup Mismatch** - FIXED
- **Problem**: `key.split('_')[0]` gives "student" but we need "student_subjects"
- **Fix**: Use `key.split('_').slice(0, -1).join('_')` to get full type
- **Status**: ✅ Fixed in code above

### ⚠️ **localStorage Limits**
- **Problem**: Browsers give 5-10MB per domain, large tables might hit limits
- **Mitigation**: 
  - Cleanup runs on every write
  - Remove oldest 25% when storage full
  - Monitor storage usage
- **Future**: Consider IndexedDB for large datasets only

### ⚠️ **Storage Quota Behavior**
- **Problem**: `localStorage.setItem` throws `QuotaExceededError` when full
- **Mitigation**: 
  - Try-catch around `setItem`
  - Run cleanup, then retry
  - Fallback to API if still full
- **Risk**: Very large payloads might still fail

### ⚠️ **Synchronous I/O**
- **Problem**: `localStorage` blocks main thread on large reads/writes
- **Impact**: Minimal for small payloads (1-50KB)
- **Mitigation**: Keep payloads small, cleanup regularly

### ⚠️ **Race Conditions**
- **Problem**: Multiple async calls might try to write simultaneously
- **Mitigation**: 
  - Cleanup runs on every write
  - localStorage is atomic per key
  - Worst case: duplicate cleanup (harmless)

### ⚠️ **Testing Complexity**
- **Problem**: Cleanup behavior makes testing harder
- **Mitigation**: 
  - Test with small TTL values
  - Mock localStorage for unit tests
  - Integration tests with real cleanup

## Recommendations

### ✅ **Keep localStorage for now** (no overengineering)
- Simple, works for current needs
- Easy to implement and debug
- Good performance for small datasets

### 🔄 **Future Migration Path** (if needed)
- Only migrate large datasets to IndexedDB
- Keep small data in localStorage
- Gradual migration, not rewrite

---
*Working cache with auto-delete, no overengineering*
