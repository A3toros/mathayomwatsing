# Simple Performance Graph Plan

## **🎯 Goal**
Create a single line graph showing test performance over time with dots for each test.

## **📊 What We Need**
- **One Line Graph** - Time horizontally, percentage vertically
- **Test Dots** - Each dot represents a test with its average score
- **Simple Data** - Just test name, date, and average score

## **🗄️ Database Changes**

### **1. One Simple View**
```sql
-- Simple view for test performance data
CREATE VIEW IF NOT EXISTS test_performance_by_test AS
WITH all_test_results AS (
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM multiple_choice_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM true_false_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM input_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM matching_type_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM word_matching_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM drawing_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM fill_blanks_test_results WHERE is_completed = true
    UNION ALL
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM speaking_test_results WHERE is_completed = true
)
SELECT 
    teacher_id,
    test_id,
    test_name,
    AVG(percentage) as average_score,
    COUNT(*) as total_students,
    submitted_at,
    academic_period_id
FROM all_test_results
GROUP BY teacher_id, test_id, test_name, submitted_at, academic_period_id
ORDER BY submitted_at ASC;
```

### **2. Basic Indexes**
```sql
-- Just the essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_period ON multiple_choice_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_period ON true_false_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_period ON input_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_period ON matching_type_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_period ON word_matching_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_period ON drawing_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_period ON fill_blanks_test_results(teacher_id, academic_period_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_period ON speaking_test_results(teacher_id, academic_period_id, submitted_at);
```

## **🎨 Frontend Implementation**

### **1. Graph Component**
```javascript
// src/components/TestPerformanceGraph.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TestPerformanceGraph = ({ data }) => {
  return (
    <div className="test-performance-graph">
      <h3>Test Performance Over Time</h3>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="submitted_at" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Average Score']}
              labelFormatter={(label) => {
                const test = data.find(d => d.submitted_at === label);
                return test ? `${test.test_name} (${new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})` : label;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="average_score"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ r: 8, fill: '#8884d8', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 10, fill: '#ff7300', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

### **2. API Service**
```javascript
// src/services/performanceService.js
import { academicCalendarService } from '@/services/AcademicCalendarService';

export const performanceService = {
  getTestPerformance: async (teacherId) => {
    // Use existing AcademicCalendarService to get current period
    const academicPeriodId = academicCalendarService.getCurrentAcademicPeriodId();
    const response = await fetch(`/api/performance/tests?teacher_id=${teacherId}&academic_period_id=${academicPeriodId}`);
    return response.json();
  }
};
```

### **3. Teacher Cabinet Integration**
```javascript
// src/teacher/TeacherCabinet.jsx
import { TestPerformanceGraph } from '@/components/TestPerformanceGraph';
import { performanceService } from '@/services/performanceService';
import { academicCalendarService } from '@/services/AcademicCalendarService';

export const TeacherCabinet = () => {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTestData = async () => {
      setLoading(true);
      try {
        // Use existing AcademicCalendarService
        const currentPeriodId = academicCalendarService.getCurrentAcademicPeriodId();
        const data = await performanceService.getTestPerformance(user.teacher_id, currentPeriodId);
        setTestData(data);
      } catch (error) {
        console.error('Error loading test data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.teacher_id) {
      loadTestData();
    }
  }, [user?.teacher_id]);

  return (
    <div className="teacher-cabinet">
      {/* Existing content */}
      
      {/* Replace old performance charts with new simple graph */}
      <div className="performance-section">
        <h2>📊 Test Performance</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <TestPerformanceGraph data={testData} />
        )}
      </div>
    </div>
  );
};
```

## **🔧 API Endpoint**

### **Backend Function**
```javascript
// functions/get-test-performance.js
exports.handler = async (event, context) => {
  const { teacher_id, academic_period_id } = event.queryStringParameters;
  
  const query = `
    SELECT 
      test_id,
      test_name,
      average_score,
      total_students,
      submitted_at
    FROM test_performance_by_test
    WHERE teacher_id = $1 AND academic_period_id = $2
    ORDER BY submitted_at ASC
  `;
  
  const result = await db.query(query, [teacher_id, academic_period_id]);
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.rows)
  };
};
```

## **📋 Implementation Steps**

1. **Run SQL file** - Execute `simple_performance_graph.sql` to create view and indexes
2. **Delete old performance chart code** - Remove old complex performance charts but keep UI structure
3. **Create Graph Component** - React component for the line graph
4. **Add API Endpoint** - Simple function to get test data using existing AcademicCalendarService
5. **Replace in Teacher Cabinet** - Replace old performance charts with new simple graph
6. **Test** - Verify graph shows test dots correctly

## **🗑️ Old Performance Code to Delete**

### **From `src/teacher/TeacherCabinet.jsx`:**

**State Variables to Remove:**
```javascript
// DELETE THESE:
const [selectedClassForChart, setSelectedClassForChart] = useState(null);
const [performanceData, setPerformanceData] = useState({});
```

**Functions to Remove:**
```javascript
// DELETE THESE FUNCTIONS:
const loadPerformanceData = useCallback(async (classKey) => { ... });
const renderPerformanceChart = useCallback((classKey) => { ... });
const handleClassClick = useCallback((classKey) => { ... });
```

**UI Sections to Keep but Replace Content:**
```javascript
// KEEP THE UI STRUCTURE (lines ~1741-1801):
{/* Test Performance Chart */}
<Card className="mb-4">
  <Card.Header>
    <Card.Title>Test Performance Overview</Card.Title>
  </Card.Header>
  <Card.Body>
    {/* REPLACE old chart logic with new TestPerformanceGraph component */}
    <TestPerformanceGraph data={testData} />
  </Card.Body>
</Card>
```

**Console Logs to Remove:**
```javascript
// DELETE ALL THESE LOGS:
console.log('📊 Loading performance data for class:', classKey);
console.log('📊 Current selectedClassForChart:', selectedClassForChart);
console.log('📊 Performance API response:', data);
console.log('📊 Processing semester performance data:', data.summary);
console.log('📊 Term performance data:', termData);
console.log('📊 No performance data available for class:', classKey);
console.log('📊 Error loading performance data:', error);
console.log('📊 Loading performance data for clicked class:', classKey);
logger.debug('📊 Available classes for performance chart:', subjects[0]?.classes || []);
logger.debug('📊 Performance chart will load when user clicks on a class');
```

## **✅ What This Gives Us**

- **Simple Line Graph** - One line with dots for each test
- **Time on X-axis** - Test dates chronologically
- **Percentage on Y-axis** - Average scores 0-100%
- **Interactive Dots** - Hover to see test details
- **Teacher-Specific** - Only shows teacher's own tests
- **Current Term Only** - Filtered by academic period

## **🚀 No Overengineering**

- ❌ No complex analytics
- ❌ No multiple views
- ❌ No complex functions
- ❌ No monthly aggregations
- ❌ No student comparisons
- ❌ No performance trends

Just a simple line graph with test dots! 🎯
