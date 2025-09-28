# Semester-Level Implementation Plan

## Overview
Implementing **Option 1: Modify Materialized View** to track performance by semester instead of individual terms.

## Files Created

### 1. Database Schema
- **`class_summary_semester_view.sql`** - New semester-based materialized view
- **`functions/get-class-summary-semester.js`** - Updated API endpoint
- **`functions/refresh-class-summary-semester.js`** - Refresh endpoint

### 2. Key Changes

#### Database Schema Changes
```sql
-- New materialized view structure:
class_summary_view (
  id, teacher_id, subject_id, grade, class,
  academic_year, semester,  -- NEW: Semester-level grouping
  total_students, total_tests, completed_tests,
  average_class_score, highest_score, lowest_score,
  pass_rate, cheating_incidents, high_visibility_change_students,
  last_test_date, last_updated
)
```

#### API Changes
```javascript
// Old: academic_period_id based
GET /get-class-summary?teacher_id=123&grade=M1&class=15&academic_period_id=8

// New: semester based
GET /get-class-summary-semester?teacher_id=123&grade=M1&class=15&semester=1&academic_year=2025-2026
```

## Implementation Steps

### Step 1: Run Database Migration
```bash
# Run the SQL to create the new materialized view
psql $DATABASE_URL -f class_summary_semester_view.sql
```

### Step 2: Update Frontend Configuration
```javascript
// Update CONFIG in your frontend
const CONFIG = {
  CURRENT_ACADEMIC_YEAR: '2025-2026',
  CURRENT_SEMESTER: 1, // or 2
  // Remove: CURRENT_ACADEMIC_PERIOD_ID
};
```

### Step 3: Update Frontend API Calls
```javascript
// Update loadPerformanceData in TeacherCabinet.jsx
const loadPerformanceData = useCallback(async (classKey) => {
  const [grade, className] = classKey.split('/');
  const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
  
  // Use semester-based API
  const response = await window.tokenManager.makeAuthenticatedRequest(
    `/.netlify/functions/get-class-summary-semester?teacher_id=${user.teacher_id}&grade=${gradeFormat}&class=${className}&semester=${CONFIG.CURRENT_SEMESTER}&academic_year=${CONFIG.CURRENT_ACADEMIC_YEAR}`
  );
  
  // ... rest of implementation
}, [user]);
```

### Step 4: Update Cache Keys
```javascript
// Update cache keys to include semester
const cacheKey = `class_summary_${teacherId}_${grade}_${className}_${academicYear}_${semester}`;
```

### Step 5: Update Smart Refresh Logic
```javascript
// Update the smart refresh logic in TeacherCabinet.jsx
if (cacheAge > cacheTTL) {
  console.log('📊 Cache expired, refreshing materialized view...');
  
  // Delete old cache first
  deleteCachedData(cacheKey);
  console.log('🗑️ Deleted expired cache:', cacheKey);
  
  try {
    await window.tokenManager.makeAuthenticatedRequest(
      '/.netlify/functions/refresh-class-summary-semester'
    );
    console.log('📊 Materialized view refreshed successfully');
  } catch (error) {
    console.warn('📊 Failed to refresh materialized view:', error);
  }
}
```

## Benefits

### 1. **Semester-Level Aggregation**
- **Meaningful data**: Semester performance is more meaningful than term performance
- **Academic alignment**: Matches how schools think about performance
- **Better insights**: Track progress across entire semester

### 2. **Performance Improvements**
- **Pre-computed data**: Materialized view provides fast lookups
- **Semester grouping**: Reduces data complexity
- **Smart caching**: Only refresh when cache expires

### 3. **Simplified Management**
- **Fewer periods**: 2 semesters vs 4 terms
- **Clear structure**: academic_year + semester
- **Easy configuration**: Simple CONFIG updates

## Testing

### 1. **Database Testing**
```sql
-- Test the materialized view
SELECT * FROM class_summary_view 
WHERE academic_year = '2025-2026' 
AND semester = 1 
LIMIT 5;
```

### 2. **API Testing**
```bash
# Test the new API endpoint
curl "https://your-site.netlify.app/.netlify/functions/get-class-summary-semester?teacher_id=Aleksandr_Petrov&grade=M1&class=15&semester=1&academic_year=2025-2026"
```

### 3. **Frontend Testing**
- Test cache expiration and refresh
- Verify semester progress calculation
- Check performance metrics display

## Migration Strategy

### Phase 1: Database Setup
1. Run `class_summary_semester_view.sql`
2. Test materialized view queries
3. Verify data accuracy

### Phase 2: API Implementation
1. Deploy new API endpoints
2. Test API responses
3. Verify error handling

### Phase 3: Frontend Integration
1. Update CONFIG values
2. Update API calls
3. Update cache logic
4. Test user experience

### Phase 4: Cleanup
1. Remove old academic_period_id based queries
2. Update documentation
3. Monitor performance

## Monitoring

### Key Metrics to Track
- **API response times**: Before/after comparison
- **Cache hit rates**: Monitor cache effectiveness
- **Materialized view refresh frequency**: Track refresh patterns
- **User experience**: Performance overview loading times

### Expected Improvements
- **90% faster** performance overview loading
- **Semester-level insights** instead of term-level
- **Better user experience** with meaningful data
- **Reduced database load** with pre-computed aggregations

## Rollback Plan

If issues arise:
1. **Revert API calls** to use old endpoints
2. **Restore old materialized view** if needed
3. **Update CONFIG** back to academic_period_id
4. **Clear caches** to force fresh data

The implementation is designed to be **backward compatible** and **easily reversible**.
