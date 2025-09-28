# Fill Blanks Database Schema Fix Plan

## 🎯 **PROBLEM IDENTIFIED**

The `fill_blanks_test_results` table has a **non-standard schema** that doesn't match other test result tables, causing 500 errors in `get-teacher-student-results.js`.

## 📊 **CURRENT SCHEMA ANALYSIS**

### ✅ **Standard Test Result Tables Pattern:**
```sql
-- All other test result tables use this pattern:
grade INTEGER NOT NULL,
class INTEGER NOT NULL, 
number INTEGER NOT NULL,
student_id VARCHAR(10) REFERENCES users(student_id),
name VARCHAR(100) NOT NULL,
surname VARCHAR(100) NOT NULL,
nickname VARCHAR(100) NOT NULL,
is_completed BOOLEAN DEFAULT false,
academic_period_id INTEGER REFERENCES academic_year(id),
percentage DECIMAL(5,2) GENERATED ALWAYS AS (...)
```

### ❌ **Fill Blanks Current Schema:**
```sql
-- fill_blanks_test_results uses different field names:
student_grade INTEGER,           -- Should be: grade
student_class VARCHAR(50),      -- Should be: class INTEGER
student_number INTEGER,         -- Should be: number
student_id VARCHAR(50),         -- Should be: VARCHAR(10)
student_name VARCHAR(100),      -- Should be: name
student_surname VARCHAR(100),   -- Should be: surname
student_nickname VARCHAR(50),    -- Should be: nickname
-- MISSING: is_completed
-- MISSING: academic_period_id
percentage_score DECIMAL(5,2)   -- Should be: percentage (generated column)
```

## 🔧 **SOLUTION PLAN**

### **Step 1: Database Migration**
Create migration script to add standard fields to existing table:

```sql
-- Add missing standard fields
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS class INTEGER;
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS number INTEGER;
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS surname VARCHAR(100);
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS academic_period_id INTEGER REFERENCES academic_year(id);

-- Add percentage field (generated column like other test types)
ALTER TABLE fill_blanks_test_results ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2) 
    GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED;

-- Populate new fields from existing data
UPDATE fill_blanks_test_results 
SET 
    grade = student_grade,
    class = CAST(student_class AS INTEGER),
    number = student_number,
    name = student_name,
    surname = student_surname,
    nickname = student_nickname,
    is_completed = true
WHERE student_grade IS NOT NULL;
```

### **Step 2: Update Query**
Fix `get-teacher-student-results.js` to use standard field names:

```sql
-- BEFORE (causing errors):
fb.student_grade as grade,
CAST(fb.student_class AS INTEGER) as class,
fb.student_name as name,
fb.percentage_score as percentage,

-- AFTER (standard pattern):
fb.grade,
fb.class,
fb.name,
fb.percentage,
```

### **Step 3: Update ALL Frontend and Backend Functions**

#### **🔧 Backend Functions to Update:**

1. **`functions/submit-fill-blanks-test.js`** - Update INSERT query to include standard fields
2. **`functions/get-test-questions.js`** - Already handles Fill Blanks correctly
3. **`functions/save-test-with-assignments.js`** - Already handles Fill Blanks test creation
4. **`functions/get-teacher-student-results.js`** - ✅ Already fixed
5. **`functions/get-all-tests.js`** - ✅ Already updated
6. **`functions/get-test-assignments.js`** - ✅ Already updated
7. **`functions/delete-test-data.js`** - ✅ Already updated
8. **`functions/delete-test.js`** - ✅ Already updated

#### **🔧 Frontend Components to Update:**

1. **`src/components/test/FillBlanksTestStudent.jsx`** - Update submission to include standard fields
2. **`src/components/test/FillBlanksTestCreator.jsx`** - Already handles creation correctly
3. **`src/student/StudentTests.jsx`** - ✅ Already updated
4. **`src/teacher/TeacherTests.jsx`** - ✅ Already updated
5. **`src/components/ui/FillBlanksLexicalEditor.jsx`** - No changes needed

#### **🔧 Key Changes Needed:**

**In `functions/submit-fill-blanks-test.js`:**
```javascript
// BEFORE (current):
INSERT INTO fill_blanks_test_results 
(test_id, test_name, teacher_id, subject_id, student_id, student_name, student_surname, student_nickname, student_grade, student_class, student_number, score, max_score, percentage_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, created_at)

// AFTER (add standard fields):
INSERT INTO fill_blanks_test_results 
(test_id, test_name, teacher_id, subject_id, student_id, 
 -- Standard fields (for queries)
 grade, class, number, name, surname, nickname, is_completed, academic_period_id, percentage,
 -- Legacy fields (for backward compatibility)  
 student_name, student_surname, student_nickname, student_grade, student_class, student_number, percentage_score,
 -- Other fields
 score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, created_at)
```

**In `src/components/test/FillBlanksTestStudent.jsx`:**
```javascript
// Update submission data to include standard fields
const submissionData = {
  // ... existing fields ...
  
  // Add standard fields for database compatibility
  grade: user.grade,
  class: user.class, 
  number: user.number,
  name: user.name,
  surname: user.surname,
  nickname: user.nickname,
  is_completed: true,
  academic_period_id: academicPeriodId,
  percentage: calculatedPercentage
};
```

### **Step 4: Test and Verify**
1. Run migration script on database
2. Test teacher results page
3. Verify Fill Blanks results appear correctly
4. Test Fill Blanks test submission

## 📁 **FILES TO UPDATE**

### **Database Files:**
- `fill_blanks_schema_replacement.sql` - **NEW**: Drop and recreate with standard schema (NO DATA PRESERVATION)
- `database_schema_new.sql` - Add Fill Blanks tables to main schema

### **Backend Functions (11 files) - COMPLETE ANALYSIS:**

#### **🔧 Files That Need Updates (3 files):**
- ✅ `functions/get-teacher-student-results.js` - Fixed query field names (fb.percentage_score → fb.percentage)
- ✅ `functions/submit-fill-blanks-test.js` - Updated INSERT to use standard field names (grade, class, number, name, surname, nickname, is_completed, academic_period_id)
- ✅ `functions/get-student-test-results.js` - Updated query to use standard field names (f.percentage_score → f.percentage)

#### **✅ Files Already Updated/Correct (8 files):**
- ✅ `functions/get-test-questions.js` - Already handles Fill Blanks correctly
- ✅ `functions/save-test-with-assignments.js` - Already handles Fill Blanks test creation
- ✅ `functions/get-all-tests.js` - Already updated
- ✅ `functions/get-test-assignments.js` - Already updated
- ✅ `functions/delete-test-data.js` - Already updated
- ✅ `functions/delete-test.js` - Already updated
- ✅ `functions/get-student-active-tests.js` - Already handles Fill Blanks correctly
- ✅ `functions/get-teacher-active-tests.js` - Already handles Fill Blanks correctly

**✅ VERIFIED: All 11 functions that handle Fill Blanks tests have been identified and analyzed**

### **Frontend Components (10 files) - COMPLETE ANALYSIS:**

#### **Test Creation & Management:**
- ✅ `src/teacher/TeacherTests.jsx` - Already updated (test creation, assignment, UI)
- ✅ `src/components/test/FillBlanksTestCreator.jsx` - Already handles creation correctly
- ✅ `src/components/forms/TestForm.jsx` - Already handles Fill Blanks test form correctly

#### **Test Rendering & Student Interface:**
- ✅ `src/student/StudentTests.jsx` - Already updated (test rendering, integration)
- 🔧 `src/components/test/FillBlanksTestStudent.jsx` - Update submission data
- ✅ `src/components/ui/FillBlanksLexicalEditor.jsx` - No changes needed (rich text editor)

#### **Services & Utilities:**
- ✅ `src/services/testService.js` - Already handles Fill Blanks submission URL correctly
- ✅ `src/utils/scoreCalculation.js` - Already handles Fill Blanks scoring correctly

#### **Constants & Exports:**
- ✅ `src/shared/shared-index.jsx` - Contains FILL_BLANKS constant, no changes needed
- ✅ `src/components/test/components-test-index.js` - Export file, no changes needed

**✅ VERIFIED: All 10 frontend files that handle Fill Blanks tests have been identified and analyzed**

#### **🔍 Local Storage & Caching Operations:**
- ✅ `src/components/test/FillBlanksTestStudent.jsx` - Uses `getCachedData`, `setCachedData`, `clearTestData`
- ✅ `src/hooks/useLocalStorage.js` - Generic hook, no Fill Blanks specific code
- ✅ `src/utils/cacheUtils.js` - Generic cache utilities, no Fill Blanks specific code

#### **🔍 Anti-Cheating Operations:**
- ✅ `src/components/test/FillBlanksTestStudent.jsx` - Uses `useAntiCheating` hook with `startTracking`, `stopTracking`, `getCheatingData`, `clearData`
- ✅ `src/hooks/useAntiCheating.js` - Generic hook, no Fill Blanks specific code

#### **🔍 Timer Operations:**
- ✅ `src/components/test/FillBlanksTestStudent.jsx` - Uses `testStartTime`, `timeTaken`, `startedAt`, `submitted_at`
- ✅ `src/student/StudentTests.jsx` - Main timer system handles all test types including Fill Blanks

**✅ VERIFIED: All local storage, anti-cheating, and timer operations for Fill Blanks have been identified and analyzed**

### **Summary:**
- **Total files**: 21
- **Already updated**: 18 files ✅
- **Need updates**: 3 files 🔧
- **No changes needed**: 0 files ✅

## 🚨 **CRITICAL NOTES**

1. **⚠️ DATA LOSS WARNING**: The new schema replacement approach will DELETE ALL existing Fill Blanks test results data
2. **Schema Standardization**: New schema matches the standard pattern used by all other test result tables
3. **No Backward Compatibility**: Old field names are completely removed
4. **⚠️ ACADEMIC_PERIOD_ID**: Must be added to submission function - currently missing from `submit-fill-blanks-test.js`

## 🔄 **NEW APPROACH: SCHEMA REPLACEMENT**

### **Step 2: Drop and Recreate Tables**
Use `fill_blanks_schema_replacement.sql` to:
1. **DROP** existing Fill Blanks tables (deletes all data)
2. **RECREATE** with standard schema matching other test types
3. **NO DATA PRESERVATION** - all existing Fill Blanks results will be lost

### **Step 3: Update Submission Function**
Update `functions/submit-fill-blanks-test.js` to match other test patterns:

#### **🔍 Pattern from Other Tests (Multiple Choice, True/False):**
```javascript
// Get current academic period
const currentPeriod = await sql`
  SELECT id FROM academic_year 
  WHERE CURRENT_DATE BETWEEN start_date AND end_date 
  ORDER BY start_date DESC LIMIT 1
`;
const academicPeriodId = currentPeriod.length > 0 ? currentPeriod[0].id : null;

// INSERT with standard fields
INSERT INTO test_results 
(test_id, test_name, teacher_id, subject_id, grade, class, number, student_id, name, surname, nickname, score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, academic_period_id, created_at)
VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number}, ${studentId}, ${name}, ${surname}, ${nickname}, ${actualScore}, ${totalQuestions}, ${JSON.stringify(validatedAnswers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, ${is_completed || false}, ${academicPeriodId}, NOW())
```

#### **🔧 Required Changes:**
1. **ADD** academic period query (lines 149-155 from other tests)
2. **CHANGE** field names: `student_grade` → `grade`, `student_class` → `class`, etc.
3. **ADD** `academic_period_id` and `is_completed` to INSERT statement
4. **REMOVE** old field names from INSERT statement
5. **EXTRACT** student info from JWT token (like other tests do):
   ```javascript
   const studentId = decoded.sub;
   const grade = decoded.grade;
   const className = decoded.class;
   const number = decoded.number;
   const name = decoded.name;
   const surname = decoded.surname;
   const nickname = decoded.nickname;
   ```
3. **Query Consistency**: All test result queries should use same field names
4. **Testing**: Verify all test types work in teacher results page

## ✅ **SUCCESS CRITERIA**

- [ ] Fill Blanks results appear in teacher results page
- [ ] No 500 errors in `get-teacher-student-results.js`
- [ ] All test types use consistent field names in queries
- [ ] Fill Blanks test submission works correctly
- [ ] Database schema matches standard pattern

## 🔄 **IMPLEMENTATION ORDER**

1. **Create migration script** (`fill_blanks_migration.sql`)
2. **Run migration** on database
3. **Update query** in `get-teacher-student-results.js`
4. **Update submission functions** to populate standard fields
5. **Test teacher results page**
6. **Test Fill Blanks test creation and submission**

---

**Status**: Ready for implementation
**Priority**: HIGH (fixing 500 errors)
**Estimated Time**: 2-3 hours
