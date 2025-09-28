# Teacher Performance Overview - Materialized View Integration Plan

## Overview
Integrate the new `class_summary_view` materialized view into the Teacher Performance Overview to show real test data with proper caching.

## Current State
- ✅ Materialized view created (`class_summary_view_optimization.sql`)
- ✅ Teacher Performance Overview exists but uses detailed results API
- ✅ Cache system exists (`cacheUtils.js`)

## Implementation Plan

### 1. Update TeacherCabinet.jsx Performance Data Loading

**Current:** Uses `get-teacher-student-results` API (expensive)
**New:** Use `get-class-summary` API (fast, cached)

```javascript
// Replace loadPerformanceData in TeacherCabinet.jsx
const loadPerformanceData = useCallback(async (classKey) => {
  const [grade, className] = classKey.split('/');
  const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
  
  // Use class summary API instead of detailed results
  const response = await window.tokenManager.makeAuthenticatedRequest(
    `/.netlify/functions/get-class-summary?teacher_id=${user.teacher_id}&grade=${gradeFormat}&class=${className}&academic_period_id=8`
  );
  
  const data = await response.json();
  
  if (data.success && data.summary) {
    // Use summary data for overall metrics
    setPerformanceData(prev => ({
      ...prev,
      [classKey]: {
        summary: data.summary,
        // Still need detailed results for per-test breakdown
        tests: [], // Will be populated separately
        overallAverage: data.summary.average_class_score || 0
      }
    }));
  }
}, [user]);
```

### 2. Materialized View Only Strategy

**Use only `class_summary_view`** - Track performance over time by semester

```javascript
const loadPerformanceData = useCallback(async (classKey) => {
  const [grade, className] = classKey.split('/');
  const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
  const currentSemester = CONFIG.CURRENT_SEMESTER; // e.g., 1 or 2
  const currentAcademicYear = CONFIG.CURRENT_ACADEMIC_YEAR; // e.g., '2025-2026'
  
  // Use only class summary API (fast, pre-computed)
  const response = await window.tokenManager.makeAuthenticatedRequest(
    `/.netlify/functions/get-class-summary?teacher_id=${user.teacher_id}&grade=${gradeFormat}&class=${className}&semester=${currentSemester}&academic_year=${currentAcademicYear}`
  );
  
  const data = await response.json();
  
  if (data.success && data.summary) {
    // Use summary data for current semester only
    setPerformanceData(prev => ({
      ...prev,
      [classKey]: {
        summary: data.summary,
        semester: currentSemester,
        academicYear: currentAcademicYear,
        overallAverage: data.summary.average_class_score || 0,
        totalTests: data.summary.total_tests || 0,
        completedTests: data.summary.completed_tests || 0,
        passRate: data.summary.pass_rate || 0,
        cheatingIncidents: data.summary.cheating_incidents || 0,
        lastTestDate: data.summary.last_test_date,
        semesterProgress: calculateSemesterProgress(data.summary)
      }
    }));
  }
}, [user]);

// Helper function to calculate semester progress
const calculateSemesterProgress = (summary) => {
  if (!summary.last_test_date) return 0;
  
  const semesterStart = new Date('2024-08-01'); // Adjust based on your semester start
  const semesterEnd = new Date('2024-12-31');   // Adjust based on your semester end
  const lastTest = new Date(summary.last_test_date);
  const now = new Date();
  
  const totalDays = semesterEnd - semesterStart;
  const elapsedDays = Math.min(now - semesterStart, totalDays);
  
  return Math.round((elapsedDays / totalDays) * 100);
};
```

### 3. Smart Cache Integration

**Cache Strategy:** Check cache age, refresh materialized view if expired, then fetch fresh data

**Cache Keys:**
- `class_summary_${teacherId}_${grade}_${className}_${academicPeriodId}` (TTL: 1 hour)
- Include academic period in cache key for semester-specific data

**Smart Refresh Logic:**
```javascript
// Check if cache is expired before fetching
const cached = getCachedData(cacheKey);
const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
const cacheTTL = 3600000; // 1 hour

if (cacheAge > cacheTTL) {
  // Delete old cache first
  deleteCachedData(cacheKey);
  console.log('🗑️ Deleted expired cache:', cacheKey);
  
  // Refresh materialized view first, then fetch fresh data
  await refreshMaterializedView();
}
```

### 4. Update Chart Rendering

**Simplified:** Show only summary metrics (no detailed chart dots)

```javascript
const renderPerformanceChart = useCallback((classKey) => {
  const classData = performanceData[classKey] || {};
  const summary = classData.summary;
  
  if (!summary) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-2">📊</div>
        <p className="text-gray-500">No performance data available for this class</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">
            {summary.average_class_score?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-blue-600">Class Average</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">
            {summary.total_tests || 0}
          </div>
          <div className="text-sm text-green-600">Total Tests</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-600">
            {summary.pass_rate?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-purple-600">Pass Rate</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-600">
            {summary.cheating_incidents || 0}
          </div>
          <div className="text-sm text-red-600">Cheating Incidents</div>
        </div>
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.completed_tests || 0}
          </div>
          <div className="text-sm text-yellow-600">Completed Tests</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-600">
            {summary.highest_score || 0}
          </div>
          <div className="text-sm text-indigo-600">Highest Score</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-pink-600">
            {summary.total_students || 0}
          </div>
          <div className="text-sm text-pink-600">Total Students</div>
        </div>
      </div>
      
      {/* Semester Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Semester Progress</span>
          <span className="text-sm text-gray-500">
            {summary.last_test_date ? new Date(summary.last_test_date).toLocaleDateString() : 'No tests yet'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${classData.semesterProgress || 0}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {classData.semesterProgress || 0}% of semester completed
        </div>
      </div>
    </div>
  );
}, [performanceData]);
```

### 5. Materialized View Refresh Strategy

**Option A: Manual Refresh**
```javascript
// Add refresh button in teacher cabinet
const refreshPerformanceData = useCallback(async () => {
  // Call refresh endpoint
  await window.tokenManager.makeAuthenticatedRequest(
    '/.netlify/functions/refresh-class-summary'
  );
  
  // Reload data
  await loadPerformanceData(selectedClassForChart);
}, []);
```

**Option B: Auto-refresh on Test Submission**
```javascript
// In test submission functions, add:
// await refreshMaterializedView();
```

**Option C: Smart Refresh on Cache Expiry**
```javascript
// Refresh materialized view when cache is old and user clicks class
const loadPerformanceData = useCallback(async (classKey) => {
  const [grade, className] = classKey.split('/');
  const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
  const cacheKey = `class_summary_${user.teacher_id}_${gradeFormat}_${className}_8`;
  
  // Check cache age
  const cached = getCachedData(cacheKey);
  const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
  const cacheTTL = 3600000; // 1 hour
  
  // If cache is old, refresh materialized view first
  if (cacheAge > cacheTTL) {
    console.log('📊 Cache expired, refreshing materialized view...');
    
    // Delete old cache first
    deleteCachedData(cacheKey);
    console.log('🗑️ Deleted expired cache:', cacheKey);
    
    try {
      await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/refresh-class-summary'
      );
      console.log('📊 Materialized view refreshed successfully');
    } catch (error) {
      console.warn('📊 Failed to refresh materialized view:', error);
      // Continue with stale data if refresh fails
    }
  }
  
  // Fetch data (will be fresh from materialized view if we just refreshed)
  const response = await window.tokenManager.makeAuthenticatedRequest(
    `/.netlify/functions/get-class-summary?teacher_id=${user.teacher_id}&grade=${gradeFormat}&class=${className}&academic_period_id=8`
  );
  
  const data = await response.json();
  
  if (data.success && data.summary) {
    // Cache the fresh data
    setCachedData(cacheKey, {
      summary: data.summary,
      timestamp: Date.now()
    }, cacheTTL);
    
    setPerformanceData(prev => ({
      ...prev,
      [classKey]: {
        summary: data.summary,
        overallAverage: data.summary.average_class_score || 0,
        totalTests: data.summary.total_tests || 0,
        completedTests: data.summary.completed_tests || 0,
        passRate: data.summary.pass_rate || 0,
        cheatingIncidents: data.summary.cheating_incidents || 0
      }
    }));
  }
}, [user]);
```

### 6. API Endpoint Updates

**New Endpoint:** `refresh-class-summary.js`
```javascript
exports.handler = async (event, context) => {
  const sql = neon(process.env.NEON_DATABASE_URL);
  
  try {
    await sql`REFRESH MATERIALIZED VIEW class_summary_view`;
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 7. Performance Benefits

**Before:**
- 6 table UNIONs on every query
- Complex aggregations
- Slow response times
- Detailed results API overhead

**After:**
- Pre-computed materialized view only
- Fast lookups with indexes
- Cached results
- Single API call
- 90% faster performance

### 8. Implementation Steps

1. **Run the SQL** (`class_summary_view_optimization.sql`)
2. **Create refresh endpoint** (`refresh-class-summary.js`)
3. **Update TeacherCabinet.jsx** to use smart cache + refresh logic
4. **Add cache integration** with TTL checking
5. **Update chart rendering** to show summary metrics only
6. **Remove detailed results API calls** from performance overview
7. **Test smart refresh** behavior
8. **Monitor cache hit rates** and refresh frequency

### 9. Monitoring

**Metrics to track:**
- API response times (before/after)
- Cache hit rates
- Materialized view refresh frequency
- Cache expiry triggers
- Cache cleanup frequency
- User experience improvements

**Expected improvements:**
- 90% faster performance overview loading
- Minimal database load (single materialized view query)
- Better user experience
- Real-time summary metrics
- No complex chart rendering overhead
- Semester-specific performance tracking
- Academic period isolation for accurate metrics
