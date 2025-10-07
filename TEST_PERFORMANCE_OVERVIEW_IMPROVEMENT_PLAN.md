# Test Performance Overview Improvement Plan

## 🎯 Current Problem
The Test Performance Overview is broken and not optimal. We need to build a proper graph from the data instead of using a materialized view.

## 📊 Current Issues Identified

### 1. **Broken Implementation**
- Current implementation is not working correctly
- Performance overview is not displaying properly
- Data visualization is suboptimal

### 2. **Data Structure Problems**
- Using materialized view instead of real-time data
- No proper graph visualization
- Missing interactive elements

### 3. **Performance Issues**
- Slow data loading
- Poor user experience
- No real-time updates

## 🚀 Improvement Plan

### **Phase 1: Data Analysis & Requirements**
1. **Analyze Current Data Structure**
   - Review existing test performance data
   - Identify data sources and relationships
   - Map out data flow from database to UI

2. **Define Requirements**
   - Interactive graph visualization
   - Real-time data updates
   - Performance metrics by class
   - Average scores across all tests

### **Phase 2: Backend Optimization**
1. **Replace Materialized View**
   - Create optimized database queries
   - Implement proper indexing
   - Add data aggregation functions

2. **API Endpoints**
   - Create dedicated performance API
   - Implement caching strategy
   - Add real-time data updates

### **Phase 3: Frontend Implementation**
1. **Graph Library Integration**
   - Choose appropriate charting library (Chart.js, D3.js, or Recharts)
   - Implement responsive design
   - Add interactive features

2. **Component Structure**
   - Create `TestPerformanceGraph` component
   - Implement data fetching hooks
   - Add loading states and error handling

### **Phase 4: Data Visualization**
1. **Graph Types**
   - Bar chart for class comparisons
   - Line chart for trends over time
   - Pie chart for score distributions
   - Heatmap for detailed analysis

2. **Interactive Features**
   - Hover tooltips with detailed info
   - Click to drill down into specific data
   - Filter by date range, class, or test type
   - Export functionality

## 🔧 Technical Implementation

### **Database Schema Optimization**

#### **1. Performance Indexes**
```sql
-- Core performance indexes for fast queries (all test result tables)
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class ON multiple_choice_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_subject ON multiple_choice_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_mc_results_submitted_at ON multiple_choice_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_mc_results_percentage ON multiple_choice_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class ON true_false_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_subject ON true_false_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_tf_results_submitted_at ON true_false_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_percentage ON true_false_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class ON input_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_subject ON input_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_input_results_submitted_at ON input_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_percentage ON input_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class ON matching_type_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_subject ON matching_type_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_matching_results_submitted_at ON matching_type_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_percentage ON matching_type_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class ON word_matching_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_subject ON word_matching_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_submitted_at ON word_matching_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_percentage ON word_matching_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class ON drawing_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_subject ON drawing_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_drawing_results_submitted_at ON drawing_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_percentage ON drawing_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_grade_class ON fill_blanks_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_subject ON fill_blanks_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_submitted_at ON fill_blanks_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_percentage ON fill_blanks_test_results(percentage);

CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_grade_class ON speaking_test_results(teacher_id, grade, class);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_subject ON speaking_test_results(teacher_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_speaking_results_submitted_at ON speaking_test_results(submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_percentage ON speaking_test_results(percentage);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_mc_results_teacher_grade_class_submitted ON multiple_choice_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_teacher_grade_class_submitted ON true_false_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_teacher_grade_class_submitted ON input_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_teacher_grade_class_submitted ON matching_type_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_teacher_grade_class_submitted ON word_matching_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_teacher_grade_class_submitted ON drawing_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_teacher_grade_class_submitted ON fill_blanks_test_results(teacher_id, grade, class, submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_teacher_grade_class_submitted ON speaking_test_results(teacher_id, grade, class, submitted_at);

-- Indexes for student performance analysis
CREATE INDEX IF NOT EXISTS idx_mc_results_student_submitted ON multiple_choice_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_tf_results_student_submitted ON true_false_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_input_results_student_submitted ON input_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_matching_results_student_submitted ON matching_type_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_word_matching_results_student_submitted ON word_matching_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_drawing_results_student_submitted ON drawing_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fill_blanks_results_student_submitted ON fill_blanks_test_results(student_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_speaking_results_student_submitted ON speaking_test_results(student_id, submitted_at);
```

#### **2. Simple Test Performance View**
```sql
-- Simple view for test-by-test performance (single line graph)
CREATE VIEW IF NOT EXISTS test_performance_by_test AS
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM multiple_choice_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- True/False Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM true_false_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Input Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM input_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Matching Type Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM matching_type_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Word Matching Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM word_matching_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Drawing Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM drawing_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Fill Blanks Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM fill_blanks_test_results
    WHERE is_completed = true
    
    UNION ALL
    
    -- Speaking Test Results
    SELECT teacher_id, test_id, test_name, percentage, submitted_at, academic_period_id
    FROM speaking_test_results
    WHERE is_completed = true
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
WHERE teacher_id = ? -- Teacher ID parameter
AND academic_period_id = ? -- Current academic period parameter
GROUP BY teacher_id, test_id, test_name, submitted_at, academic_period_id
ORDER BY submitted_at ASC;

-- That's it! Just one simple view for the single line graph
```

#### **3. Simple API Query**
```sql
-- Function to get class performance overview
DELIMITER //
CREATE FUNCTION IF NOT EXISTS get_class_performance_overview(teacher_id_param VARCHAR(50), class_id_param INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_OBJECT(
        'class_id', c.id,
        'class_name', c.class_name,
        'grade_level', c.grade_level,
        'total_students', COUNT(DISTINCT s.id),
        'average_score', AVG(tr.score),
        'total_tests', COUNT(tr.id),
        'performance_trend', JSON_OBJECT(
            'current_month', AVG(CASE WHEN DATE_FORMAT(tr.test_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN tr.score END),
            'previous_month', AVG(CASE WHEN DATE_FORMAT(tr.test_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m') THEN tr.score END)
        ),
        'test_types', JSON_ARRAYAGG(
            JSON_OBJECT(
                'test_type', t.test_type,
                'average_score', AVG(tr.score),
                'test_count', COUNT(tr.id)
            )
        )
    ) INTO result
    FROM classes c
    LEFT JOIN test_results tr ON c.id = tr.class_id
    LEFT JOIN tests t ON tr.test_id = t.id
    LEFT JOIN students s ON c.id = s.class_id
    WHERE c.teacher_id = teacher_id_param 
    AND (class_id_param IS NULL OR c.id = class_id_param)
    AND tr.test_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY c.id, c.class_name, c.grade_level;
    
    RETURN result;
END //
DELIMITER ;

-- Function to get performance trends
DELIMITER //
CREATE FUNCTION IF NOT EXISTS get_performance_trends(teacher_id_param VARCHAR(50), months_back INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'month', month_year,
            'average_score', monthly_average,
            'test_count', tests_count,
            'classes', JSON_ARRAYAGG(
                JSON_OBJECT(
                    'class_name', class_name,
                    'class_average', class_average
                )
            )
        )
    ) INTO result
    FROM (
        SELECT 
            DATE_FORMAT(tr.test_date, '%Y-%m') as month_year,
            AVG(tr.score) as monthly_average,
            COUNT(tr.id) as tests_count,
            c.class_name,
            AVG(tr.score) as class_average
        FROM test_results tr
        JOIN classes c ON tr.class_id = c.id
        WHERE c.teacher_id = teacher_id_param
        AND tr.test_date >= DATE_SUB(NOW(), INTERVAL months_back MONTH)
        GROUP BY DATE_FORMAT(tr.test_date, '%Y-%m'), c.id, c.class_name
        ORDER BY month_year DESC
    ) trend_data
    GROUP BY month_year, monthly_average, tests_count
    ORDER BY month_year DESC;
    
    RETURN result;
END //
DELIMITER ;
```

#### **4. Performance Monitoring Queries**
```sql
-- Query to get real-time performance overview
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM multiple_choice_test_results
    UNION ALL
    -- True/False Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM true_false_test_results
    UNION ALL
    -- Input Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM input_test_results
    UNION ALL
    -- Matching Type Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM matching_type_test_results
    UNION ALL
    -- Word Matching Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM word_matching_test_results
    UNION ALL
    -- Drawing Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM drawing_test_results
    UNION ALL
    -- Fill Blanks Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM fill_blanks_test_results
    UNION ALL
    -- Speaking Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM speaking_test_results
)
SELECT 
    atr.teacher_id,
    atr.subject_id,
    atr.grade,
    atr.class,
    COUNT(DISTINCT atr.student_id) as active_students,
    AVG(atr.percentage) as current_average,
    COUNT(atr.id) as tests_this_month,
    MAX(atr.submitted_at) as latest_test,
    JSON_OBJECT(
        'excellent', COUNT(CASE WHEN atr.percentage >= 90 THEN 1 END),
        'good', COUNT(CASE WHEN atr.percentage >= 80 AND atr.percentage < 90 THEN 1 END),
        'satisfactory', COUNT(CASE WHEN atr.percentage >= 70 AND atr.percentage < 80 THEN 1 END),
        'needs_improvement', COUNT(CASE WHEN atr.percentage < 70 THEN 1 END)
    ) as score_distribution
FROM all_test_results atr
WHERE atr.teacher_id = ? 
AND atr.submitted_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY atr.teacher_id, atr.subject_id, atr.grade, atr.class
ORDER BY current_average DESC;

-- Query for performance comparison across classes
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM multiple_choice_test_results
    UNION ALL
    -- True/False Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM true_false_test_results
    UNION ALL
    -- Input Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM input_test_results
    UNION ALL
    -- Matching Type Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM matching_type_test_results
    UNION ALL
    -- Word Matching Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM word_matching_test_results
    UNION ALL
    -- Drawing Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM drawing_test_results
    UNION ALL
    -- Fill Blanks Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM fill_blanks_test_results
    UNION ALL
    -- Speaking Test Results
    SELECT teacher_id, subject_id, grade, class, test_id, test_name, student_id, score, percentage, submitted_at
    FROM speaking_test_results
)
SELECT 
    atr.teacher_id,
    atr.subject_id,
    atr.grade,
    atr.class,
    AVG(atr.percentage) as average_score,
    COUNT(atr.id) as test_count,
    ROUND((AVG(atr.percentage) - LAG(AVG(atr.percentage)) OVER (PARTITION BY atr.subject_id ORDER BY atr.grade, atr.class)) / LAG(AVG(atr.percentage)) OVER (PARTITION BY atr.subject_id ORDER BY atr.grade, atr.class) * 100, 2) as improvement_percentage
FROM all_test_results atr
WHERE atr.teacher_id = ?
AND atr.submitted_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
GROUP BY atr.teacher_id, atr.subject_id, atr.grade, atr.class
ORDER BY atr.subject_id, average_score DESC;

-- Query for student performance insights
WITH all_test_results AS (
    -- Multiple Choice Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM multiple_choice_test_results
    UNION ALL
    -- True/False Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM true_false_test_results
    UNION ALL
    -- Input Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM input_test_results
    UNION ALL
    -- Matching Type Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM matching_type_test_results
    UNION ALL
    -- Word Matching Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM word_matching_test_results
    UNION ALL
    -- Drawing Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM drawing_test_results
    UNION ALL
    -- Fill Blanks Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM fill_blanks_test_results
    UNION ALL
    -- Speaking Test Results
    SELECT teacher_id, subject_id, grade, class, student_id, score, percentage, submitted_at
    FROM speaking_test_results
)
SELECT 
    atr.student_id,
    atr.teacher_id,
    atr.subject_id,
    atr.grade,
    atr.class,
    AVG(atr.percentage) as student_average,
    COUNT(atr.id) as tests_taken,
    ROUND(AVG(atr.percentage) - (SELECT AVG(atr2.percentage) FROM all_test_results atr2 WHERE atr2.teacher_id = atr.teacher_id AND atr2.subject_id = atr.subject_id AND atr2.grade = atr.grade AND atr2.class = atr.class), 2) as vs_class_average,
    CASE 
        WHEN AVG(atr.percentage) >= 90 THEN 'Excellent'
        WHEN AVG(atr.percentage) >= 80 THEN 'Good'
        WHEN AVG(atr.percentage) >= 70 THEN 'Satisfactory'
        ELSE 'Needs Improvement'
    END as performance_level
FROM all_test_results atr
WHERE atr.teacher_id = ?
AND atr.submitted_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
GROUP BY atr.student_id, atr.teacher_id, atr.subject_id, atr.grade, atr.class
HAVING tests_taken >= 3
ORDER BY student_average DESC;
```

#### **5. Database Maintenance (Manual Admin Task)**

**⚠️ IMPORTANT: Data cleanup is now a MANUAL admin task performed after each semester.**

```sql
-- MANUAL CLEANUP SCRIPT (Run after each semester by admin)
-- WARNING: This will permanently delete old test data
-- Only run this after backing up important data

-

-- Update statistics for better query performance
ANALYZE TABLE multiple_choice_test_results;
ANALYZE TABLE true_false_test_results;
ANALYZE TABLE input_test_results;
ANALYZE TABLE matching_type_test_results;
ANALYZE TABLE word_matching_test_results;
ANALYZE TABLE drawing_test_results;
ANALYZE TABLE fill_blanks_test_results;
ANALYZE TABLE speaking_test_results;
ANALYZE TABLE users;
ANALYZE TABLE teachers;
ANALYZE TABLE subjects;
```

**📋 Admin Cleanup Checklist:**
- [ ] **Backup Database** - Create full backup before cleanup
- [ ] **Verify Academic Year** - Confirm semester has ended
- [ ] **Check Data Age** - Verify data is 2+ years old
- [ ] **Run Cleanup Script** - Execute deletion statements
- [ ] **Update Statistics** - Run ANALYZE TABLE commands
- [ ] **Verify Performance** - Check query performance after cleanup
- [ ] **Document Cleanup** - Record cleanup date and data removed

-- Create partition for large tables (if needed)
-- Note: Partitioning would need to be applied to each individual test result table
-- Example for multiple_choice_test_results:
-- ALTER TABLE multiple_choice_test_results 
-- PARTITION BY RANGE (YEAR(submitted_at)) (
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );
-- Repeat for all test result tables if needed
```

### **API Endpoints**
```javascript
// GET /api/performance/overview
// Returns: Performance data for graph visualization

// GET /api/performance/class/{classId}
// Returns: Detailed performance for specific class

// GET /api/performance/trends
// Returns: Performance trends over time
```

### **🚨 EXPENSIVE QUERY OPTIMIZATION - DAILY CACHING**

**Problem**: Performance overview queries are expensive and should not run on every login.

**Solution**: Cache results in localStorage for 24 hours, only refresh once per day.

### **📅 ACADEMIC YEAR FILTERING - CURRENT TERM ONLY**

**Problem**: Teachers should only see their own tests and only data from the current academic term.

**Solution**: Filter all queries by current academic period and teacher ID.

#### **Academic Year Service:**

```javascript
// src/services/AcademicYearService.js
import academicYearData from '/public/academic_year.json';

export const academicYearService = {
  // Get current academic period based on current date
  getCurrentAcademicPeriod: () => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find the current academic period
    const currentPeriod = academicYearData.find(period => {
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      return today >= startDate && today <= endDate;
    });
    
    if (!currentPeriod) {
      console.warn('No current academic period found for date:', currentDate);
      // Fallback to the most recent period
      return academicYearData[academicYearData.length - 1];
    }
    
    return currentPeriod;
  },

  // Get all periods for the current academic year
  getCurrentAcademicYearPeriods: () => {
    const currentPeriod = academicYearService.getCurrentAcademicPeriod();
    return academicYearData.filter(period => 
      period.academic_year === currentPeriod.academic_year
    );
  },

  // Check if a date is within the current academic period
  isWithinCurrentPeriod: (date) => {
    const currentPeriod = academicYearService.getCurrentAcademicPeriod();
    const checkDate = new Date(date);
    const startDate = new Date(currentPeriod.start_date);
    const endDate = new Date(currentPeriod.end_date);
    
    return checkDate >= startDate && checkDate <= endDate;
  },

  // Get academic period info for display
  getCurrentPeriodInfo: () => {
    const currentPeriod = academicYearService.getCurrentAcademicPeriod();
    return {
      academic_year: currentPeriod.academic_year,
      semester: currentPeriod.semester,
      term: currentPeriod.term,
      start_date: currentPeriod.start_date,
      end_date: currentPeriod.end_date,
      period_id: currentPeriod.id
    };
  }
};
```

#### **Updated Performance Service with Academic Year Filtering:**

```javascript
// src/services/performanceService.js (UPDATED)
import { API_ENDPOINTS } from '@/shared/shared-index';
import { academicYearService } from './AcademicYearService';

export const performanceService = {
  // Get performance overview data (filtered by current academic period)
  getPerformanceOverview: async (teacherId) => {
    try {
      const currentPeriod = academicYearService.getCurrentAcademicPeriod();
      
      const response = await fetch(
        `${API_ENDPOINTS.PERFORMANCE_OVERVIEW}?teacher_id=${teacherId}&academic_period_id=${currentPeriod.id}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        academic_period: currentPeriod,
        filtered_by: 'current_term_only'
      };
    } catch (error) {
      console.error('Error fetching performance overview:', error);
      throw error;
    }
  },

  // Get class-specific performance data (filtered by current academic period)
  getClassPerformance: async (teacherId, classId) => {
    try {
      const currentPeriod = academicYearService.getCurrentAcademicPeriod();
      
      const response = await fetch(
        `${API_ENDPOINTS.PERFORMANCE_CLASS}/${classId}?teacher_id=${teacherId}&academic_period_id=${currentPeriod.id}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        academic_period: currentPeriod,
        filtered_by: 'current_term_only'
      };
    } catch (error) {
      console.error('Error fetching class performance:', error);
      throw error;
    }
  },

  // Get performance trends (filtered by current academic period)
  getPerformanceTrends: async (teacherId, months = 6) => {
    try {
      const currentPeriod = academicYearService.getCurrentAcademicPeriod();
      
      const response = await fetch(
        `${API_ENDPOINTS.PERFORMANCE_TRENDS}?teacher_id=${teacherId}&academic_period_id=${currentPeriod.id}&months=${months}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        academic_period: currentPeriod,
        filtered_by: 'current_term_only'
      };
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw error;
    }
  }
};
```

#### **Updated SQL Queries with Academic Year Filtering:**

```sql
-- Updated performance overview query with academic year filtering
WITH all_test_results AS (
    -- Multiple Choice Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM multiple_choice_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- True/False Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM true_false_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Input Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM input_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Matching Type Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM matching_type_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Word Matching Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM word_matching_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Drawing Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM drawing_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Fill Blanks Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM fill_blanks_test_results
    WHERE academic_period_id = ? -- Current academic period ID
    
    UNION ALL
    
    -- Speaking Test Results (filtered by current academic period)
    SELECT 
        teacher_id, subject_id, grade, class, test_id, test_name, student_id, 
        score, max_score, percentage, submitted_at, caught_cheating, 
        visibility_change_times, is_completed
    FROM speaking_test_results
    WHERE academic_period_id = ? -- Current academic period ID
)
SELECT 
    atr.teacher_id,
    atr.subject_id,
    atr.grade,
    atr.class,
    COUNT(atr.id) as total_tests,
    AVG(atr.percentage) as average_score,
    MIN(atr.percentage) as min_score,
    MAX(atr.percentage) as max_score,
    STDDEV(atr.percentage) as score_stddev,
    COUNT(DISTINCT atr.student_id) as unique_students,
    MAX(atr.submitted_at) as latest_test_date,
    MIN(atr.submitted_at) as earliest_test_date
FROM all_test_results atr
WHERE atr.teacher_id = ? -- Teacher ID filter
AND atr.submitted_at >= NOW() - INTERVAL '1 year'
AND atr.is_completed = true
GROUP BY atr.teacher_id, atr.subject_id, atr.grade, atr.class;
```

#### **Updated Performance Cache with Academic Year:**

```javascript
// src/utils/performanceCache.js (UPDATED)
const PERFORMANCE_CACHE_KEY = 'teacher_performance_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const performanceCache = {
  // Generate cache key with teacher ID and academic period
  getCacheKey: (teacherId, academicPeriodId) => {
    return `${PERFORMANCE_CACHE_KEY}_${teacherId}_${academicPeriodId}`;
  },

  // Check if cache is valid (less than 24 hours old)
  isCacheValid: (teacherId, academicPeriodId) => {
    try {
      const cacheKey = performanceCache.getCacheKey(teacherId, academicPeriodId);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - timestamp;
      
      return cacheAge < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking performance cache:', error);
      return false;
    }
  },

  // Get cached performance data
  getCachedData: (teacherId, academicPeriodId) => {
    try {
      if (!performanceCache.isCacheValid(teacherId, academicPeriodId)) {
        return null;
      }
      
      const cacheKey = performanceCache.getCacheKey(teacherId, academicPeriodId);
      const cached = localStorage.getItem(cacheKey);
      const { data } = JSON.parse(cached);
      return data;
    } catch (error) {
      console.error('Error getting cached performance data:', error);
      return null;
    }
  },

  // Store performance data with timestamp
  setCachedData: (teacherId, academicPeriodId, data) => {
    try {
      const cacheKey = performanceCache.getCacheKey(teacherId, academicPeriodId);
      const cacheData = {
        data,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        teacher_id: teacherId,
        academic_period_id: academicPeriodId
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`📊 Performance data cached for teacher ${teacherId}, period ${academicPeriodId}`);
    } catch (error) {
      console.error('Error caching performance data:', error);
    }
  },

  // Clean up old cache entries
  cleanupOldCache: () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all cache keys
      const keys = Object.keys(localStorage);
      const performanceKeys = keys.filter(key => key.startsWith(PERFORMANCE_CACHE_KEY));
      
      performanceKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          const { date: cacheDate } = JSON.parse(cached);
          
          // If cache is from a different day, remove it
          if (cacheDate !== today) {
            localStorage.removeItem(key);
            console.log(`🗑️ Old performance cache cleaned up: ${key}`);
          }
        } catch (error) {
          // Remove invalid cache entries
          localStorage.removeItem(key);
          console.log(`🗑️ Invalid cache entry removed: ${key}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
    }
  },

  // Force refresh (clear cache and fetch new data)
  forceRefresh: (teacherId, academicPeriodId) => {
    const cacheKey = performanceCache.getCacheKey(teacherId, academicPeriodId);
    localStorage.removeItem(cacheKey);
    console.log(`🔄 Performance cache cleared for teacher ${teacherId}, period ${academicPeriodId}`);
  }
};
```

#### **Updated Hook with Academic Year Filtering:**

```javascript
// src/hooks/usePerformanceData.js (UPDATED)
import { useState, useEffect, useCallback } from 'react';
import { performanceCache } from '@/utils/performanceCache';
import { performanceService } from '@/services/performanceService';
import { academicYearService } from '@/services/AcademicYearService';

export const usePerformanceData = (teacherId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [academicPeriod, setAcademicPeriod] = useState(null);

  const fetchPerformanceData = useCallback(async (forceRefresh = false) => {
    if (!teacherId) return;
    
    // Get current academic period
    const currentPeriod = academicYearService.getCurrentAcademicPeriod();
    setAcademicPeriod(currentPeriod);
    
    // Clean up old cache first
    performanceCache.cleanupOldCache();
    
    // Check if we have valid cached data for this teacher and period
    if (!forceRefresh && performanceCache.isCacheValid(teacherId, currentPeriod.id)) {
      const cachedData = performanceCache.getCachedData(teacherId, currentPeriod.id);
      if (cachedData) {
        setData(cachedData);
        setIsCached(true);
        console.log(`📊 Using cached performance data for teacher ${teacherId}, period ${currentPeriod.id}`);
        return;
      }
    }

    // Fetch fresh data
    setLoading(true);
    setError(null);
    setIsCached(false);

    try {
      console.log(`📊 Fetching fresh performance data for teacher ${teacherId}, period ${currentPeriod.id}...`);
      const freshData = await performanceService.getPerformanceOverview(teacherId);
      
      // Cache the fresh data
      performanceCache.setCachedData(teacherId, currentPeriod.id, freshData);
      
      setData(freshData);
      console.log(`📊 Performance data loaded and cached for teacher ${teacherId}, period ${currentPeriod.id}`);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (teacherId) {
      fetchPerformanceData();
    }
  }, [teacherId, fetchPerformanceData]);

  const refreshData = useCallback(() => {
    fetchPerformanceData(true);
  }, [fetchPerformanceData]);

  return {
    data,
    loading,
    error,
    isCached,
    academicPeriod,
    refreshData
  };
};
```

#### **Benefits of Academic Year Filtering:**

- ✅ **Data Isolation**: Teachers only see their own test data
- ✅ **Current Term Only**: Only shows data from current academic period
- ✅ **Performance**: Faster queries with academic period filtering
- ✅ **Security**: Prevents cross-teacher data access
- ✅ **Accuracy**: Ensures data relevance to current term
- ✅ **Cache Efficiency**: Separate cache per teacher and academic period

### **📊 PERFORMANCE GRAPH IMPLEMENTATION**

**Problem**: Need to build interactive line graphs showing performance trends over time.

**Solution**: Create time-series line graphs with time horizontally and percentage vertically, similar to sales reports.

#### **Graph Requirements:**

```javascript
// Graph Configuration
const graphConfig = {
  // X-Axis: Time (horizontal)
  xAxis: {
    type: 'time',
    title: 'Time Period',
    format: 'MMM YYYY', // Jan 2024, Feb 2024, etc.
    dataKey: 'month', // From performance data
    tickCount: 12 // Show 12 months
  },
  
  // Y-Axis: Percentage (vertical)
  yAxis: {
    type: 'number',
    title: 'Average Score (%)',
    domain: [0, 100], // 0% to 100%
    tickCount: 5, // 0%, 25%, 50%, 75%, 100%
    format: (value) => `${value}%`
  },
  
  // Line Graph Settings
  chart: {
    type: 'line',
    strokeWidth: 3,
    dotSize: 6,
    animation: true,
    responsive: true
  }
};
```

#### **Data Structure for Graphs:**

```javascript
// Performance trend data structure - SINGLE LINE with test dots
const performanceData = {
  // Single line showing test-by-test performance
  testPerformance: [
    { 
      testDate: '2024-01-15', 
      testName: 'Grammar Test 1',
      averageScore: 75.5, 
      totalStudents: 25,
      testType: 'multiple_choice'
    },
    { 
      testDate: '2024-01-22', 
      testName: 'Reading Test 1',
      averageScore: 78.2, 
      totalStudents: 25,
      testType: 'true_false'
    },
    { 
      testDate: '2024-02-05', 
      testName: 'Grammar Test 2',
      averageScore: 82.1, 
      totalStudents: 25,
      testType: 'multiple_choice'
    },
    { 
      testDate: '2024-02-12', 
      testName: 'Writing Test 1',
      averageScore: 79.8, 
      totalStudents: 25,
      testType: 'input'
    },
    { 
      testDate: '2024-02-19', 
      testName: 'Speaking Test 1',
      averageScore: 85.3, 
      totalStudents: 25,
      testType: 'speaking'
    }
  ]
};
```

#### **Graph Components:**

```javascript
// src/components/PerformanceGraph.jsx - SINGLE LINE with test dots
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceGraph = ({ data }) => {
  return (
    <div className="performance-graph-container">
      <h3 className="graph-title">Test Performance Over Time</h3>
      <div className="graph-wrapper" style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="testDate" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              type="category"
              scale="point"
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Average Score']}
              labelFormatter={(label) => {
                const test = data.find(d => d.testDate === label);
                return test ? `${test.testName} (${new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})` : label;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="averageScore"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ 
                r: 8, 
                fill: '#8884d8',
                stroke: '#fff',
                strokeWidth: 2
              }}
              activeDot={{ 
                r: 10, 
                fill: '#ff7300',
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

#### **Test Performance Graph (Single Line with Dots):**

```javascript
// src/components/TestPerformanceGraph.jsx - Single line showing test progression
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TestPerformanceGraph = ({ data }) => {
  return (
    <div className="test-performance-graph">
      <h3 className="graph-title">Test Performance Over Time</h3>
      <div className="graph-wrapper" style={{ width: '100%', height: '500px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="testDate"
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              type="category"
              scale="point"
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Average Score']}
              labelFormatter={(label) => {
                const test = data.find(d => d.testDate === label);
                return test ? `${test.testName} (${new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})` : label;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="averageScore"
              stroke="#8884d8"
              strokeWidth={4}
              dot={{ 
                r: 10, 
                fill: '#8884d8',
                stroke: '#fff',
                strokeWidth: 3
              }}
              activeDot={{ 
                r: 12, 
                fill: '#ff7300',
                stroke: '#fff',
                strokeWidth: 3
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

#### **Graph Data Processing:**

```javascript
// src/utils/graphDataProcessor.js - Process test-by-test data
export const processTestPerformanceData = (rawData) => {
  // Group by test and calculate average score for each test
  const testGroups = rawData.reduce((acc, item) => {
    const testKey = `${item.test_id}_${item.test_name}`;
    if (!acc[testKey]) {
      acc[testKey] = {
        testId: item.test_id,
        testName: item.test_name,
        testDate: item.submitted_at,
        testType: item.test_type || 'unknown',
        scores: [],
        totalStudents: 0
      };
    }
    acc[testKey].scores.push(parseFloat(item.percentage));
    acc[testKey].totalStudents++;
    return acc;
  }, {});

  // Calculate average score for each test and sort by date
  return Object.values(testGroups)
    .map(test => ({
      testId: test.testId,
      testName: test.testName,
      testDate: test.testDate,
      testType: test.testType,
      averageScore: test.scores.reduce((a, b) => a + b, 0) / test.scores.length,
      totalStudents: test.totalStudents,
      scores: test.scores
    }))
    .sort((a, b) => new Date(a.testDate) - new Date(b.testDate)); // Sort by test date
};
```

#### **Graph Integration in Teacher Cabinet:**

```javascript
// src/teacher/TeacherCabinet.jsx (Updated)
import { TestPerformanceGraph } from '@/components/TestPerformanceGraph';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { processTestPerformanceData } from '@/utils/graphDataProcessor';

export const TeacherCabinet = () => {
  const { data: performanceData, loading, error } = usePerformanceData(user?.teacher_id);
  
  // Process raw data into test-by-test format
  const testPerformanceData = performanceData?.rawTestData 
    ? processTestPerformanceData(performanceData.rawTestData)
    : [];
  
  return (
    <div className="teacher-cabinet">
      {/* Existing cabinet content */}
      
      {/* Performance Overview Section */}
      <div className="performance-overview">
        <h2>📊 Test Performance Overview</h2>
        
        {/* Single Line Test Performance Graph */}
        <div className="graph-section">
          <h3>Test Performance Over Time</h3>
          <p className="graph-description">
            Each dot represents a test. The line shows how class performance changes from test to test.
          </p>
          <TestPerformanceGraph data={testPerformanceData} />
        </div>
        
        {/* Test Statistics */}
        <div className="test-stats">
          <h3>Test Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Tests:</span>
              <span className="stat-value">{testPerformanceData.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score:</span>
              <span className="stat-value">
                {testPerformanceData.length > 0 
                  ? `${(testPerformanceData.reduce((sum, test) => sum + test.averageScore, 0) / testPerformanceData.length).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Test:</span>
              <span className="stat-value">
                {testPerformanceData.length > 0 
                  ? testPerformanceData.reduce((best, test) => test.averageScore > best.averageScore ? test : best).testName
                  : 'N/A'
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Latest Test:</span>
              <span className="stat-value">
                {testPerformanceData.length > 0 
                  ? testPerformanceData[testPerformanceData.length - 1].testName
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### **Graph Styling:**

```css
/* src/styles/PerformanceGraph.css */
.performance-graph-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.graph-title {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: 600;
}

.graph-wrapper {
  background: #fafafa;
  border-radius: 4px;
  padding: 10px;
}

.subject-comparison-graph {
  margin-top: 30px;
}

.student-graph {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #f9f9f9;
}

/* Responsive design */
@media (max-width: 768px) {
  .graph-wrapper {
    height: 300px !important;
  }
  
  .performance-graph-container {
    padding: 15px;
  }
}
```

#### **Graph Features:**

- ✅ **Single Line**: One line showing test progression over time
- ✅ **Test Dots**: Each dot represents a specific test
- ✅ **Time Progression**: X-axis shows test dates chronologically
- ✅ **Percentage Scale**: Y-axis shows 0% to 100% average scores
- ✅ **Interactive Dots**: Hover over dots to see test details
- ✅ **Line Movement**: Line goes up/down based on test performance
- ✅ **Test Details**: Tooltips show test name, date, and average score
- ✅ **Responsive**: Adapts to different screen sizes
- ✅ **Sales Report Style**: Professional appearance like business reports
- ✅ **Real-time Data**: Updates with fresh test data
- ✅ **Export Ready**: Can be exported as images or PDFs

#### **Graph Layout Example:**
```
┌─────────────────────────────────────────────────────────┐
│                Test Performance Over Time              │
├─────────────────────────────────────────────────────────┤
│ 100% ┤                                                │
│  90% ┤                    ●                           │
│  80% ┤              ●───●                             │
│  70% ┤        ●───●                                   │
│  60% ┤  ●───●                                         │
│  50% ┤●                                               │
│  40% ┤                                                │
│  30% ┤                                                │
│  20% ┤                                                │
│  10% ┤                                                │
│   0% ┤                                                │
│      └─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┘ │
│        Jan 15  Jan 22  Feb 5  Feb 12 Feb 19 Feb 26   │
│        Test 1  Test 2  Test 3  Test 4  Test 5  Test 6 │
└─────────────────────────────────────────────────────────┘

Each ● represents a test with its average score
Line connects tests chronologically
```

#### **Implementation Code:**

```javascript
// src/utils/performanceCache.js
const PERFORMANCE_CACHE_KEY = 'teacher_performance_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const performanceCache = {
  // Check if cache is valid (less than 24 hours old)
  isCacheValid: () => {
    try {
      const cached = localStorage.getItem(PERFORMANCE_CACHE_KEY);
      if (!cached) return false;
      
      const { timestamp } = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - timestamp;
      
      return cacheAge < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking performance cache:', error);
      return false;
    }
  },

  // Get cached performance data
  getCachedData: () => {
    try {
      if (!performanceCache.isCacheValid()) {
        return null;
      }
      
      const cached = localStorage.getItem(PERFORMANCE_CACHE_KEY);
      const { data } = JSON.parse(cached);
      return data;
    } catch (error) {
      console.error('Error getting cached performance data:', error);
      return null;
    }
  },

  // Store performance data with timestamp
  setCachedData: (data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };
      
      localStorage.setItem(PERFORMANCE_CACHE_KEY, JSON.stringify(cacheData));
      console.log('📊 Performance data cached for 24 hours');
    } catch (error) {
      console.error('Error caching performance data:', error);
    }
  },

  // Clean up old cache entries
  cleanupOldCache: () => {
    try {
      const cached = localStorage.getItem(PERFORMANCE_CACHE_KEY);
      if (!cached) return;
      
      const { date: cacheDate } = JSON.parse(cached);
      const today = new Date().toISOString().split('T')[0];
      
      // If cache is from a different day, remove it
      if (cacheDate !== today) {
        localStorage.removeItem(PERFORMANCE_CACHE_KEY);
        console.log('🗑️ Old performance cache cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up old cache:', error);
    }
  },

  // Force refresh (clear cache and fetch new data)
  forceRefresh: () => {
    localStorage.removeItem(PERFORMANCE_CACHE_KEY);
    console.log('🔄 Performance cache cleared - will fetch fresh data');
  }
};
```

```javascript
// src/hooks/usePerformanceData.js
import { useState, useEffect, useCallback } from 'react';
import { performanceCache } from '@/utils/performanceCache';
import { performanceService } from '@/services/performanceService';

export const usePerformanceData = (teacherId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchPerformanceData = useCallback(async (forceRefresh = false) => {
    // Clean up old cache first
    performanceCache.cleanupOldCache();
    
    // Check if we have valid cached data
    if (!forceRefresh && performanceCache.isCacheValid()) {
      const cachedData = performanceCache.getCachedData();
      if (cachedData) {
        setData(cachedData);
        setIsCached(true);
        console.log('📊 Using cached performance data');
        return;
      }
    }

    // Fetch fresh data
    setLoading(true);
    setError(null);
    setIsCached(false);

    try {
      console.log('📊 Fetching fresh performance data...');
      const freshData = await performanceService.getPerformanceOverview(teacherId);
      
      // Cache the fresh data
      performanceCache.setCachedData(freshData);
      
      setData(freshData);
      console.log('📊 Performance data loaded and cached');
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (teacherId) {
      fetchPerformanceData();
    }
  }, [teacherId, fetchPerformanceData]);

  const refreshData = useCallback(() => {
    fetchPerformanceData(true);
  }, [fetchPerformanceData]);

  return {
    data,
    loading,
    error,
    isCached,
    refreshData
  };
};
```

```javascript
// src/services/performanceService.js
import { API_ENDPOINTS } from '@/shared/shared-index';

export const performanceService = {
  // Get performance overview data
  getPerformanceOverview: async (teacherId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PERFORMANCE_OVERVIEW}?teacher_id=${teacherId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching performance overview:', error);
      throw error;
    }
  },

  // Get class-specific performance data
  getClassPerformance: async (teacherId, classId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PERFORMANCE_CLASS}/${classId}?teacher_id=${teacherId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching class performance:', error);
      throw error;
    }
  },

  // Get performance trends
  getPerformanceTrends: async (teacherId, months = 6) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PERFORMANCE_TRENDS}?teacher_id=${teacherId}&months=${months}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw error;
    }
  }
};
```

#### **Usage in TeacherCabinet.jsx:**

```javascript
// Add to TeacherCabinet.jsx
import { usePerformanceData } from '@/hooks/usePerformanceData';

// In the component:
const { data: performanceData, loading: performanceLoading, isCached, refreshData } = usePerformanceData(user?.teacher_id);

// Add refresh button for manual refresh
const handleRefreshPerformance = () => {
  refreshData();
  showNotification('Performance data refreshed', 'success');
};
```

#### **Reminder for Implementation:**

```javascript
// TODO: IMPLEMENT AFTER TESTING
// 1. Add performanceCache.js to src/utils/
// 2. Add usePerformanceData.js to src/hooks/
// 3. Add performanceService.js to src/services/
// 4. Update TeacherCabinet.jsx to use the hook
// 5. Add API endpoints in functions/
// 6. Test daily cache expiration
// 7. Test manual refresh functionality
// 8. Add loading states and error handling
// 9. Add cache status indicator in UI
// 10. Test with different browsers and devices
```

**Benefits:**
- ✅ **Performance**: Expensive queries run only once per day
- ✅ **User Experience**: Fast loading with cached data
- ✅ **Bandwidth**: Reduces API calls significantly
- ✅ **Reliability**: Graceful fallback to fresh data if cache fails
- ✅ **Flexibility**: Manual refresh option available

### **Frontend Components**
```javascript
// TestPerformanceGraph.jsx
const TestPerformanceGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Graph implementation with Chart.js or similar
  return (
    <div className="performance-graph">
      {/* Interactive graph implementation */}
    </div>
  );
};
```

## 📈 Success Metrics

### **Performance Improvements**
- **Loading Time**: Reduce from 5-10s to 1-2s
- **Data Accuracy**: Real-time updates instead of stale materialized view
- **User Experience**: Interactive, responsive graphs

### **Functionality Enhancements**
- **Interactive Graphs**: Hover, click, filter capabilities
- **Real-time Updates**: Live data without page refresh
- **Export Options**: PDF, CSV export functionality
- **Mobile Responsive**: Works on all device sizes

## 🛠️ Implementation Steps

### **Step 1: Data Analysis** (1-2 days)
- [ ] Analyze current performance data structure
- [ ] Identify data sources and relationships
- [ ] Map out required data transformations

### **Step 2: Backend Optimization** (2-3 days)
- [ ] Create optimized database queries
- [ ] Implement new API endpoints
- [ ] Add caching and performance optimizations

### **Step 3: Frontend Implementation** (3-4 days)
- [ ] Choose and integrate charting library
- [ ] Create TestPerformanceGraph component
- [ ] Implement data fetching and state management

### **Step 4: Testing & Optimization** (1-2 days)
- [ ] Test with real data
- [ ] Optimize performance
- [ ] Add error handling and edge cases

## 🎯 Expected Outcomes

### **Immediate Benefits**
- **Faster Loading**: Real-time data instead of materialized view
- **Better UX**: Interactive, responsive graphs
- **Accurate Data**: Live updates, no stale information

### **Long-term Benefits**
- **Scalability**: Can handle more data and users
- **Maintainability**: Clean, modular code structure
- **Extensibility**: Easy to add new graph types and features

## 📋 Files to Create/Modify

### **New Files**
1. `src/components/TestPerformanceGraph.jsx` - Main graph component
2. `src/hooks/usePerformanceData.js` - Data fetching hook
3. `src/utils/graphUtils.js` - Graph utility functions
4. `src/services/performanceService.js` - API service for performance data

### **Modified Files**
1. `src/teacher/TeacherCabinet.jsx` - Integrate new graph component
2. `functions/get-performance-data.js` - New Netlify function
3. Database schema updates for optimization

## 🚨 Critical Success Factors

1. **Data Accuracy**: Ensure real-time, accurate data
2. **Performance**: Fast loading and responsive interactions
3. **User Experience**: Intuitive, interactive graphs
4. **Mobile Support**: Works on all devices
5. **Error Handling**: Graceful degradation on failures

## 📊 Timeline Estimate

- **Total Duration**: 7-11 days
- **Phase 1**: 1-2 days (Analysis)
- **Phase 2**: 2-3 days (Backend)
- **Phase 3**: 3-4 days (Frontend)
- **Phase 4**: 1-2 days (Testing)

This plan will transform the broken Test Performance Overview into a powerful, interactive data visualization tool that provides real-time insights into student performance across all classes and tests.
