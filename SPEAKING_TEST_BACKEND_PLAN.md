# Speaking Test Backend Implementation Plan

## 🎯 **Overview**
Following the word_matching test pattern, implement complete backend support for speaking tests with AssemblyAI integration and automatic scoring.

## 📋 **Backend Functions Required**

### **1. Teacher-Side Functions**

#### **A. `save-speaking-test-with-assignments.js`**
**Purpose**: Create speaking tests and assign to classes
**Pattern**: Follow `save-test-with-assignments.js` structure

**Key Features**:
- Insert into `speaking_tests` table
- Insert questions into `speaking_test_questions` table  
- Create test assignments
- Handle multiple questions per test
- Support scoring configuration (weights, min_words, etc.)

**Request Body**:
```javascript
{
  teacher_id: "string",
  test_name: "string", 
  questions: [
    {
      question_id: "string",
      prompt: "string",
      expected_duration: number,
      difficulty_level: "easy|medium|hard"
    }
  ],
  assignments: [
    {
      grade: number,
      class: number, 
      subject_id: number,
      due_date: "ISO string"
    }
  ],
  // Scoring Configuration
  min_words: 50,
  word_weight: 0.30,
  grammar_weight: 0.40, 
  vocab_weight: 0.30,
  points_per_grammar_error: 2.0,
  points_per_vocab_error: 2.0,
  // Test Settings
  time_limit: 300,
  min_duration: 30,
  max_duration: 600,
  max_attempts: 3,
  passing_score: 50,
  allowed_time: 300
}
```

**Database Operations**:
```sql
-- Insert speaking test
INSERT INTO speaking_tests (teacher_id, subject_id, test_name, ...)

-- Insert questions  
INSERT INTO speaking_test_questions (test_id, question_number, prompt, ...)

-- Insert assignments
INSERT INTO test_assignments (test_type, test_id, teacher_id, ...)
```

#### **B. `get-speaking-tests.js`**
**Purpose**: Retrieve speaking tests for teacher dashboard
**Pattern**: Follow `get-all-tests.js` structure

**Features**:
- Get tests by teacher_id
- Include question count
- Filter by academic period
- Support pagination

#### **C. `get-speaking-test-questions.js`**
**Purpose**: Get speaking test questions for student interface
**Pattern**: Follow `get-test-questions.js` structure

**Features**:
- Get questions by test_id
- Include prompts and settings
- Support multiple questions per test

### **2. Student-Side Functions**

#### **A. `submit-speaking-test.js`**
**Purpose**: Submit speaking test with AssemblyAI processing
**Pattern**: Follow `submit-word-matching-test.js` structure

**Key Features**:
- Audio file upload to Supabase
- AssemblyAI transcription
- Automatic scoring calculation
- Retest support
- Cheating detection

**Request Body**:
```javascript
{
  test_id: "string",
  test_name: "string",
  teacher_id: "string", 
  subject_id: number,
  audio_file_path: "string", // Supabase path
  audio_duration: number,
  transcript: "string", // From AssemblyAI
  word_count: number,
  grammar_errors: number,
  vocab_errors: number,
  // Calculated scores
  word_score: number,
  grammar_score: number, 
  vocab_score: number,
  overall_score: number,
  time_taken: number,
  started_at: "ISO string",
  submitted_at: "ISO string",
  caught_cheating: boolean,
  visibility_change_times: number,
  is_completed: boolean,
  retest_assignment_id: number, // Optional
  parent_test_id: string // Optional
}
```

**AssemblyAI Integration**:
```javascript
// 1. Upload audio to AssemblyAI
const uploadResponse = await axios.post(`${baseUrl}/v2/upload`, audioData, { headers });

// 2. Start transcription
const transcriptResponse = await axios.post(`${baseUrl}/v2/transcript`, {
  audio_url: uploadResponse.data.upload_url,
  speech_model: "universal"
});

// 3. Poll for completion
while (true) {
  const result = await axios.get(`${baseUrl}/v2/transcript/${transcriptId}`, { headers });
  if (result.data.status === "completed") {
    transcript = result.data.text;
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 3000));
}
```

**Automatic Scoring**:
```javascript
// Calculate scores based on formulas
const wordScore = Math.min(actualWords / minWords, 1) * 30;
const grammarScore = Math.max(40 - (grammarErrors * 2), 0);
const vocabScore = Math.max(30 - (vocabErrors * 2), 0);
const totalScore = wordScore + grammarScore + vocabScore;
```

**Database Operations**:
```sql
-- Insert speaking test result
INSERT INTO speaking_test_results (
  test_id, test_name, teacher_id, subject_id, grade, class, number,
  student_id, name, surname, nickname, 
  audio_file_path, audio_duration, transcript, word_count,
  word_score, grammar_score, vocab_score, overall_score,
  time_taken, started_at, submitted_at, caught_cheating,
  visibility_change_times, is_completed, academic_period_id
)

-- Insert audio file record
INSERT INTO speaking_test_audio (result_id, file_path, duration)

-- Handle retest attempts
INSERT INTO test_attempts (student_id, test_id, attempt_number, ...)
```

### **3. Results & Analytics Functions**

#### **A. Update `get-teacher-student-results.js`**
**Purpose**: Include speaking test results in teacher dashboard
**Pattern**: Add UNION ALL section for speaking tests

**New Section**:
```sql
-- Speaking Test Results (best retest coalesced into score/max_score)
SELECT 
  'speaking' as test_type,
  s.id,
  s.test_id,
  s.test_name,
  s.teacher_id,
  s.subject_id,
  s.grade,
  s.class,
  s.number,
  s.student_id,
  s.name,
  s.surname,
  s.nickname,
  COALESCE(s_best.best_score, s.overall_score) AS score,
  COALESCE(s_best.best_max, 100) AS max_score,
  s.percentage,
  s.transcript,
  s.audio_file_path,
  s.time_taken,
  s.started_at,
  s.submitted_at,
  COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
  COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times,
  s.is_completed,
  s.retest_offered,
  s.created_at,
  s.academic_period_id,
  s.subject,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name
FROM speaking_test_results s
LEFT JOIN subjects s ON s.subject_id = s.subject_id
LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
  SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
  FROM test_attempts ta
  WHERE ta.student_id = s.student_id
    AND ta.test_id = s.test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1
) s_best ON TRUE
WHERE s.teacher_id = ${actualTeacherId}
  AND s.grade = ${parseInt(gradeNumber)}
  AND s.class = ${parseInt(classNumber)}
  AND s.academic_period_id = ANY(${academicPeriodIds})
```

#### **B. Update `assign-test.js`**
**Purpose**: Support speaking test assignments to classes
**Pattern**: Add speaking test type to switch statement

**Current Usage**: 
- Frontend uses `assign-test.js` (not `assign-test-to-classes.js`)
- Both files are identical but `assign-test.js` is the active one

**Changes**:
```javascript
case 'speaking':
  testInfo = await sql`SELECT test_name FROM speaking_tests WHERE id = ${test_id}`;
  break;
```

#### **C. Update `create-retest-assignment.js`**
**Purpose**: Support speaking test retests
**Pattern**: Add speaking test type support

**Changes**:
- Add `'speaking'` to supported test types
- Handle speaking test retest creation
- Support speaking test retest targets

#### **D. Update `get-retest-eligible-students.js`**
**Purpose**: Include speaking test students in retest eligibility
**Pattern**: Add speaking test results to eligibility check

### **4. Audio Management Functions**

#### **A. `upload-speaking-audio.js`**
**Purpose**: Handle audio file uploads to Supabase
**Pattern**: Follow `upload-image.js` structure

**Features**:
- Upload to Supabase storage
- Generate unique file paths
- Return public URLs
- Handle file validation

#### **B. `get-speaking-audio.js`**
**Purpose**: Retrieve audio files for playback
**Pattern**: Follow existing file retrieval patterns

**Features**:
- Get audio by result_id
- Support teacher and student access
- Handle permissions

## 🔧 **Implementation Order**

### **Phase 1: Core Test Management**
1. ✅ `save-speaking-test-with-assignments.js`
2. ✅ `get-speaking-tests.js` 
3. ✅ `get-speaking-test-questions.js`

### **Phase 2: Student Submission & Scoring**
4. ✅ `submit-speaking-test.js` (with AssemblyAI)
5. ✅ `upload-speaking-audio.js`

### **Phase 3: Results & Analytics**
6. ✅ Update `get-teacher-student-results.js`
7. ✅ Update `assign-test.js` (add speaking test support)
8. ✅ Update `create-retest-assignment.js`
9. ✅ Update `get-retest-eligible-students.js`

### **Phase 4: Audio Management**
10. ✅ `get-speaking-audio.js`
11. ✅ Audio playback optimization

## 🎯 **Key Technical Considerations**

### **AssemblyAI Integration**
- **API Key Management**: Store in environment variables
- **Rate Limiting**: Handle API limits gracefully
- **Error Handling**: Retry logic for failed transcriptions
- **Cost Optimization**: Batch processing where possible

### **Audio File Management**
- **Supabase Storage**: Organize by test_id and student_id
- **File Formats**: Support webm, mp3, wav
- **Size Limits**: Implement reasonable file size limits
- **Cleanup**: Remove old audio files periodically

### **Scoring System**
- **Backend Calculation**: All scoring done in backend
- **Configurable Weights**: Support custom scoring parameters
- **Validation**: Ensure scores are within 0-100 range
- **Audit Trail**: Log scoring decisions for transparency

### **Performance Optimization**
- **Async Processing**: Handle AssemblyAI calls asynchronously
- **Caching**: Cache transcription results
- **Database Indexes**: Optimize query performance
- **File Compression**: Compress audio files when possible

## 📊 **Database Schema Integration**

### **Tables Used**:
- `speaking_tests` - Test configuration
- `speaking_test_questions` - Test questions/prompts
- `speaking_test_results` - Student results with scores
- `speaking_test_audio` - Audio file metadata
- `test_assignments` - Class assignments
- `test_attempts` - Retest attempts
- `retest_assignments` - Retest configuration
- `retest_targets` - Retest student targets

### **Key Relationships**:
- Tests → Questions (1:many)
- Tests → Results (1:many)
- Results → Audio (1:many)
- Tests → Assignments (1:many)
- Results → Attempts (1:many for retests)

## 🚀 **Success Metrics**

### **Functional Requirements**:
- ✅ Teachers can create speaking tests with multiple questions
- ✅ Students can record and submit audio responses
- ✅ Automatic transcription via AssemblyAI
- ✅ Automatic scoring based on word count, grammar, vocabulary
- ✅ Support for retests and multiple attempts
- ✅ Integration with existing teacher dashboard
- ✅ Audio playback for teacher review

### **Performance Requirements**:
- ✅ Transcription completion within 30 seconds
- ✅ Audio upload within 10 seconds
- ✅ Scoring calculation within 5 seconds
- ✅ Support for concurrent users

### **Quality Requirements**:
- ✅ 95%+ transcription accuracy for clear audio
- ✅ Consistent scoring across similar responses
- ✅ Reliable audio playback
- ✅ Proper error handling and user feedback

## 📝 **Next Steps**

1. **Start with Phase 1**: Implement core test management functions
2. **Test with Sample Data**: Create test speaking tests and questions
3. **Integrate AssemblyAI**: Set up API keys and test transcription
4. **Implement Scoring**: Test automatic scoring with sample data
5. **Add Retest Support**: Extend existing retest system
6. **Performance Testing**: Load test with multiple concurrent users
7. **User Acceptance Testing**: Test with real teachers and students

## 🎨 **Frontend Integration Patterns (From Word Matching Analysis)**

### **Teacher Interface Patterns:**

#### **1. Test Creation Flow:**
- **Navigation**: `/teacher/tests/create` → Create New Test button
- **Test Service**: `testService.getTeacherTests()` for loading tests
- **Cache Management**: Force refresh for new test types
- **Assignment Integration**: Tests include assignments array

#### **2. Test Results Display:**
- **Table Structure**: Dynamic columns for each test
- **Score Display**: `score/max_score` format with color coding
- **Retest Integration**: Click to offer retests for failed students
- **Cheating Detection**: Warning icons (⚠️) for caught cheating
- **Collapsible Columns**: Test name headers with collapse functionality

#### **3. Retest Management:**
- **Modal System**: `PerfectModal` for retest creation
- **Form State**: `retestForm` with test_type, student_ids, etc.
- **Service Integration**: `retestService.createRetestAssignment()`
- **UI Updates**: Force refresh after retest creation

### **Frontend Components Required for Speaking Tests:**

#### **A. Teacher Test Creation Interface**
**Pattern**: Follow existing test creation flow
**Location**: `/teacher/tests/create`
**Features**:
- Speaking test type selection
- Question/prompt management
- Scoring configuration (weights, min_words)
- Class assignment interface

#### **B. Teacher Results Display**
**Pattern**: Follow `TeacherResults.jsx` table structure
**Features**:
- Speaking test columns in results table
- Audio playback buttons for teacher review
- Transcript display
- Score breakdown (word/grammar/vocab scores)
- Retest offering for failed students

#### **C. Speaking Test Specific UI Elements**
**Features**:
- Audio player component for teacher review
- Transcript viewer with grammar/vocab highlights
- Score breakdown display (word/grammar/vocab)
- Recording quality indicators
- AssemblyAI processing status

### **Frontend Service Integration:**

#### **A. Test Service Updates**
**File**: `src/services/testService.js`
**Changes**:
- Add speaking test support to `getTeacherTests()`
- Include speaking test in test type filtering
- Handle speaking test assignments

#### **B. API Endpoint Integration**
**File**: `src/shared/shared-index.jsx`
**New Endpoints**:
```javascript
SAVE_SPEAKING_TEST: '/.netlify/functions/save-speaking-test-with-assignments',
GET_SPEAKING_TESTS: '/.netlify/functions/get-speaking-tests',
GET_SPEAKING_QUESTIONS: '/.netlify/functions/get-speaking-test-questions',
SUBMIT_SPEAKING_TEST: '/.netlify/functions/submit-speaking-test',
UPLOAD_SPEAKING_AUDIO: '/.netlify/functions/upload-speaking-audio'
```

#### **C. Cache Management**
**Pattern**: Follow existing cache patterns
**Features**:
- Force refresh for speaking tests (like drawing tests)
- Cache invalidation on test creation
- Speaking test specific cache keys

### **Student Interface Requirements:**

#### **A. Speaking Test Page Structure**
**Pattern**: Follow `WordMatchingPage.jsx` structure
**Location**: `/student/speaking-test/${testId}`
**Features**:
- Dedicated page for speaking tests (like word_matching)
- Test completion checking with localStorage
- Cache management for test data
- Results display with TestResults component
- Navigation back to student cabinet

#### **B. Speaking Test Component**
**Pattern**: Follow `WordMatchingStudent.jsx` structure
**Features**:
- Audio recording interface
- Real-time recording feedback
- AssemblyAI processing status
- Score preview before submission
- Re-record functionality
- Progress auto-save (every 30 seconds)
- Anti-cheating tracking

#### **C. Student Cabinet Integration**
**Pattern**: Follow existing test handling in `StudentCabinet.jsx`
**Features**:
- Speaking test detection in test list
- Special routing to dedicated page
- Completion status checking
- Retest support integration
- Test type filtering

#### **D. Test Results Display**
**Pattern**: Follow existing TestResults component
**Features**:
- Score breakdown (word/grammar/vocab scores)
- Transcript display with highlights
- Audio playback for review
- Question analysis for speaking prompts
- Pass/fail status with percentage

#### **E. Audio Management**
**Features**:
- Microphone permission handling
- Recording quality indicators
- Audio playback for review
- File upload to Supabase
- Recording duration tracking
- Audio format validation

### **Student Interface Implementation Details:**

#### **A. Routing & Navigation**
**File**: `src/student/StudentCabinet.jsx`
**Changes**:
```javascript
// Special handling for speaking tests - redirect to dedicated page
if (test.test_type === 'speaking') {
  console.log('🎤 Redirecting to speaking test page for testId:', test.test_id);
  navigate(`/student/speaking-test/${test.test_id}`);
  return;
}
```

#### **B. Speaking Test Page**
**File**: `src/student/SpeakingTestPage.jsx` (new)
**Pattern**: Follow `WordMatchingPage.jsx`
**Features**:
- Test data loading with cache management
- Completion status checking
- Results display integration
- Navigation handling

#### **C. Speaking Test Component**
**File**: `src/components/test/SpeakingTestStudent.jsx` (new)
**Pattern**: Follow `WordMatchingStudent.jsx`
**Features**:
- Audio recording interface
- AssemblyAI integration
- Progress tracking
- Anti-cheating detection
- Test submission handling

#### **D. Cache Management**
**Pattern**: Follow existing cache patterns
**Features**:
- Test data caching with TTL
- Progress auto-save
- Completion status tracking
- Retest key management
- Anti-cheating data storage

#### **E. Test Submission Flow**
**Pattern**: Follow word_matching submission
**Features**:
- Audio file upload to Supabase
- AssemblyAI processing
- Automatic scoring calculation
- Results caching
- Navigation back to cabinet

## 🎯 **Teacher Backend Patterns (From Word Matching Analysis)**

### **Key Backend Patterns Identified:**

#### **1. Test Results Display:**
- **`get-teacher-student-results.js`** - Unified results view with UNION ALL
- **LATERAL joins** - Prioritizes retest scores over original scores
- **COALESCE logic** - Shows best scores from retests
- **Cheating data integration** - Displays retest cheating attempts
- **Academic period filtering** - Links to current academic year

#### **2. Test Submission Handling:**
- **`submit-word-matching-test.js`** - Student submission processing
- **Database transactions** - Ensures data consistency
- **Retest support** - Manages multiple attempts
- **Academic period integration** - Links to current academic year
- **Test attempts tracking** - Records all student attempts

#### **3. Test Creation & Management:**
- **`save-test-with-assignments.js`** - Creates tests and assigns to classes
- **Multiple question support** - Handles arrays of questions
- **Assignment management** - Links tests to specific classes
- **Database transactions** - Ensures data consistency

### **Teacher Backend Requirements for Speaking Tests:**

#### **A. Results Display Integration**
**File**: `functions/get-teacher-student-results.js`
**Pattern**: Add UNION ALL section for speaking tests
**Features**:
- Speaking test results in teacher dashboard
- Audio file path display
- Transcript display
- Score breakdown (word/grammar/vocab)
- Retest score prioritization
- Cheating data integration

#### **B. Test Submission Processing**
**File**: `functions/submit-speaking-test.js` (new)
**Pattern**: Follow `submit-word-matching-test.js` structure
**Features**:
- Audio file processing
- AssemblyAI integration
- Automatic scoring calculation
- Retest support
- Academic period integration
- Test attempts tracking

#### **C. Test Creation & Assignment**
**File**: `functions/save-speaking-test-with-assignments.js` (new)
**Pattern**: Follow `save-test-with-assignments.js` structure
**Features**:
- Speaking test creation
- Question/prompt management
- Class assignment
- Scoring configuration
- Database transactions

#### **D. Test Retrieval Functions**
**Files**: Multiple functions following existing patterns
**Features**:
- `get-speaking-tests.js` - Teacher test list
- `get-speaking-test-questions.js` - Test questions
- `get-speaking-audio.js` - Audio file access
- Cache management integration

### **Teacher Backend Implementation Details:**

#### **A. Results Display SQL Pattern**
**File**: `functions/get-teacher-student-results.js`
**New Section**:
```sql
-- Speaking Test Results (best retest coalesced into score/max_score)
SELECT 
  'speaking' as test_type,
  s.id,
  s.test_id,
  s.test_name,
  s.teacher_id,
  s.subject_id,
  s.grade,
  s.class,
  s.number,
  s.student_id,
  s.name,
  s.surname,
  s.nickname,
  COALESCE(s_best.best_score, s.overall_score) AS score,
  COALESCE(s_best.best_max, 100) AS max_score,
  s.percentage,
  s.transcript,
  s.audio_file_path,
  s.time_taken,
  s.started_at,
  s.submitted_at,
  COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
  COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times,
  s.is_completed,
  s.retest_offered,
  s.created_at,
  s.academic_period_id,
  s.subject,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name
FROM speaking_test_results s
LEFT JOIN subjects s ON s.subject_id = s.subject_id
LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
  SELECT ta.score AS best_score, ta.max_score AS best_max, ta.caught_cheating AS best_caught_cheating, ta.visibility_change_times AS best_visibility_change_times
  FROM test_attempts ta
  WHERE ta.student_id = s.student_id
    AND ta.test_id = s.test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1
) s_best ON TRUE
WHERE s.teacher_id = ${actualTeacherId}
  AND s.grade = ${parseInt(gradeNumber)}
  AND s.class = ${parseInt(classNumber)}
  AND s.academic_period_id = ANY(${academicPeriodIds})
```

#### **B. Test Submission Pattern**
**File**: `functions/submit-speaking-test.js`
**Features**:
- Audio file upload to Supabase
- AssemblyAI transcription
- Automatic scoring calculation
- Database transaction handling
- Retest support integration
- Academic period linking

#### **C. Test Creation Pattern**
**File**: `functions/save-speaking-test-with-assignments.js`
**Features**:
- Speaking test table insertion
- Questions table insertion
- Assignment creation
- Transaction management
- Error handling

#### **D. Assignment Support Pattern**
**File**: `functions/assign-test.js`
**Changes**:
```javascript
case 'speaking':
  testInfo = await sql`SELECT test_name FROM speaking_tests WHERE id = ${test_id}`;
  break;
```

### **Teacher Backend Integration Points:**

#### **A. Database Schema Integration**
- **Speaking test tables** - Follow existing patterns
- **Test attempts tracking** - Full retest support
- **Academic period linking** - Current year integration
- **Cheating detection** - Visibility tracking

#### **B. API Endpoint Integration**
- **Teacher dashboard** - Results display
- **Test creation** - Speaking test support
- **Assignment management** - Class assignments
- **Audio management** - File access

#### **C. Retest System Integration**
- **Retest assignment creation** - Speaking test support
- **Retest target management** - Student tracking
- **Score prioritization** - Best retest scores
- **Cheating data** - Retest cheating display

## 🔧 **Complete API Functions Analysis & Required Changes**

### **📋 All Test-Related API Functions Identified:**

#### **A. Test Submission Functions (Student Side):**
- **`submit-multiple-choice-test.js`** ✅
- **`submit-true-false-test.js`** ✅  
- **`submit-input-test.js`** ✅
- **`submit-matching-type-test.js`** ✅
- **`submit-word-matching-test.js`** ✅
- **`submit-drawing-test.js`** ✅
- **`submit-fill-blanks-test.js`** ✅
- **`submit-speaking-test.js`** ❌ **NEW REQUIRED**

#### **B. Test Creation & Management Functions (Teacher Side):**
- **`save-test-with-assignments.js`** ✅
- **`assign-test.js`** ✅ (Active assignment function)
- **`assign-test-to-classes.js`** ✅ (Identical to assign-test.js)
- **`get-all-tests.js`** ✅
- **`get-teacher-active-tests.js`** ✅
- **`get-teacher-assignments.js`** ✅
- **`get-test-assignments.js`** ✅
- **`get-test-questions.js`** ✅
- **`get-test-results.js`** ✅

#### **C. Test Data Retrieval Functions:**
- **`get-matching-type-test.js`** ✅
- **`get-word-matching-test.js`** ✅
- **`get-drawing-test.js`** ✅
- **`get-speaking-test.js`** ❌ **NEW REQUIRED**
- **`get-speaking-test-questions.js`** ❌ **NEW REQUIRED**

#### **D. Student Test Functions:**
- **`get-student-active-tests.js`** ✅
- **`get-student-test-results.js`** ✅
- **`get-student-results-view.js`** ✅
- **`check-test-completion.js`** ✅
- **`mark-test-completed.js`** ✅

#### **E. Teacher Results & Analytics:**
- **`get-teacher-student-results.js`** ✅
- **`get-teacher-grades-classes.js`** ✅
- **`get-class-summary-semester.js`** ✅
- **`refresh-class-summary-semester.js`** ✅

#### **F. Retest Management Functions:**
- **`create-retest-assignment.js`** ✅
- **`get-retest-assignments.js`** ✅
- **`get-retest-eligible-students.js`** ✅
- **`get-retest-targets.js`** ✅
- **`cancel-retest-assignment.js`** ✅

#### **G. Test Management Functions:**
- **`delete-test.js`** ✅
- **`delete-test-assignments.js`** ✅
- **`delete-test-data.js`** ✅
- **`remove-assignment.js`** ✅
- **`update-drawing-test-score.js`** ✅

#### **H. Utility Functions:**
- **`upload-image.js`** ✅
- **`check-overdue-assignments.js`** ✅

### **🎯 Required Changes for Speaking Test Integration:**

#### **A. New Functions to Create:**
1. **`submit-speaking-test.js`** - Student submission with AssemblyAI integration
2. **`get-speaking-test.js`** - Retrieve speaking test data
3. **`get-speaking-test-questions.js`** - Retrieve speaking test questions
4. **`save-speaking-test-with-assignments.js`** - Create speaking tests
5. **`upload-speaking-audio.js`** - Audio file upload to Supabase

#### **B. Functions to Update:**

##### **1. `get-teacher-student-results.js`**
**Changes**: Add speaking test UNION ALL section
```sql
-- Speaking Test Results (best retest coalesced into score/max_score)
SELECT 
  'speaking' as test_type,
  s.id, s.test_id, s.test_name, s.teacher_id, s.subject_id,
  s.grade, s.class, s.number, s.student_id, s.name, s.surname, s.nickname,
  COALESCE(s_best.best_score, s.overall_score) AS score,
  COALESCE(s_best.best_max, 100) AS max_score,
  s.percentage, s.transcript, s.audio_url,
  s.time_taken, s.started_at, s.submitted_at,
  COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
  COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times,
  s.is_completed, s.retest_offered, s.created_at, s.academic_period_id,
  s.subject, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
FROM speaking_test_results s
LEFT JOIN subjects s ON s.subject_id = s.subject_id
LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
  SELECT ta.score AS best_score, ta.max_score AS best_max, 
         ta.caught_cheating AS best_caught_cheating, 
         ta.visibility_change_times AS best_visibility_change_times
  FROM test_attempts ta
  WHERE ta.student_id = s.student_id
    AND ta.test_id = s.test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1
) s_best ON TRUE
WHERE s.teacher_id = ${actualTeacherId}
  AND s.grade = ${parseInt(gradeNumber)}
  AND s.class = ${parseInt(classNumber)}
  AND s.academic_period_id = ANY(${academicPeriodIds})
```

##### **2. `assign-test.js`**
**Changes**: Add speaking test case
```javascript
case 'speaking':
  testInfo = await sql`SELECT test_name FROM speaking_tests WHERE id = ${test_id}`;
  break;
```

##### **3. `create-retest-assignment.js`**
**Changes**: Add speaking test support
```javascript
case 'speaking':
  // Validate speaking test exists
  const speakingTest = await sql`SELECT id FROM speaking_tests WHERE id = ${test_id}`;
  if (speakingTest.length === 0) {
    throw new Error('Speaking test not found');
  }
  break;
```

##### **4. `get-retest-eligible-students.js`**
**Changes**: Add speaking test support
```javascript
case 'speaking':
  // Get students who failed speaking test
  const speakingFailures = await sql`
    SELECT DISTINCT student_id, name, surname, nickname, grade, class, number
    FROM speaking_test_results 
    WHERE test_id = ${test_id} 
      AND percentage < ${passing_threshold}
      AND is_completed = true
  `;
  break;
```

##### **5. `get-all-tests.js`**
**Changes**: Add speaking test support
```javascript
case 'speaking':
  tests = await sql`
    SELECT st.id, st.test_name, st.teacher_id, st.subject_id, 
           st.time_limit, st.min_duration, st.max_duration,
           st.min_words, st.word_weight, st.grammar_weight, st.vocab_weight,
           st.passing_score, st.created_at, st.updated_at,
           s.subject, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
    FROM speaking_tests st
    LEFT JOIN subjects s ON st.subject_id = s.subject_id
    LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
    WHERE st.teacher_id = ${teacherId}
    ORDER BY st.created_at DESC
  `;
  break;
```

##### **6. `get-teacher-active-tests.js`**
**Changes**: Add speaking test support
```javascript
case 'speaking':
  tests = await sql`
    SELECT st.id, st.test_name, st.teacher_id, st.subject_id,
           st.time_limit, st.min_duration, st.max_duration,
           st.min_words, st.passing_score, st.created_at,
           s.subject, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
    FROM speaking_tests st
    LEFT JOIN subjects s ON st.subject_id = s.subject_id
    LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
    WHERE st.teacher_id = ${teacherId}
    ORDER BY st.created_at DESC
  `;
  break;
```

##### **7. `get-student-active-tests.js`**
**Changes**: Add speaking test support
```javascript
case 'speaking':
  tests = await sql`
    SELECT st.id, st.test_name, st.teacher_id, st.subject_id,
           st.time_limit, st.min_duration, st.max_duration,
           st.min_words, st.passing_score, st.created_at,
           s.subject, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
    FROM speaking_tests st
    LEFT JOIN subjects s ON st.subject_id = s.subject_id
    LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
    WHERE st.teacher_id = ${teacherId}
    ORDER BY st.created_at DESC
  `;
  break;
```

### **🛡️ Cheating Protection Integration:**

#### **A. Anti-Cheating Fields (All Submit Functions):**
- **`caught_cheating`** - Boolean flag for cheating detection
- **`visibility_change_times`** - Count of tab switches
- **`started_at`** - Test start timestamp
- **`submitted_at`** - Test submission timestamp
- **`time_taken`** - Total test duration

#### **B. Cheating Detection Logic:**
```javascript
// In all submit functions
const { 
  caught_cheating = false,
  visibility_change_times = 0,
  started_at,
  submitted_at,
  time_taken
} = JSON.parse(event.body);

// Store in both results table and test_attempts
INSERT INTO speaking_test_results (
  caught_cheating, visibility_change_times, started_at, submitted_at, time_taken
) VALUES (
  ${caught_cheating}, ${visibility_change_times}, ${started_at}, ${submitted_at}, ${time_taken}
);

INSERT INTO test_attempts (
  caught_cheating, visibility_change_times, started_at, submitted_at, time_taken
) VALUES (
  ${caught_cheating}, ${visibility_change_times}, ${started_at}, ${submitted_at}, ${time_taken}
);
```

### **🔄 Retest System Integration:**

#### **A. Retest Support in Submit Functions:**
```javascript
// In submit-speaking-test.js
const { 
  retest_assignment_id,
  parent_test_id
} = JSON.parse(event.body);

// Retest validation
if (retest_assignment_id) {
  const target = await sql`
    SELECT tgt.attempt_count, ra.max_attempts, ra.window_start, ra.window_end
    FROM retest_targets tgt
    JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
    WHERE tgt.retest_assignment_id = ${retest_assignment_id} 
      AND tgt.student_id = ${userInfo.student_id}
  `;
  
  if (target.length === 0) {
    throw new Error('Retest not found or not assigned to this student');
  }
  
  const row = target[0];
  const nowTs = new Date();
  if (!(new Date(row.window_start) <= nowTs && nowTs <= new Date(row.window_end))) {
    throw new Error('Retest window is not active');
  }
  
  if (row.attempt_count >= row.max_attempts) {
    throw new Error('Maximum retest attempts reached');
  }
  
  attemptNumber = Number(row.attempt_count || 0) + 1;
}
```

#### **B. Retest Score Prioritization:**
```sql
-- In get-teacher-student-results.js
LEFT JOIN LATERAL (
  SELECT ta.score AS best_score, ta.max_score AS best_max, 
         ta.caught_cheating AS best_caught_cheating, 
         ta.visibility_change_times AS best_visibility_change_times
  FROM test_attempts ta
  WHERE ta.student_id = s.student_id
    AND ta.test_id = s.test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1
) s_best ON TRUE

-- Use COALESCE to prioritize retest scores
COALESCE(s_best.best_score, s.overall_score) AS score,
COALESCE(s_best.best_max, 100) AS max_score,
COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times
```

### **📊 Academic Period Integration:**

#### **A. Current Academic Period:**
```javascript
// In all functions
const academicPeriod = await sql`
  SELECT id FROM academic_year 
  WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE 
  ORDER BY created_at DESC LIMIT 1
`;

const academicPeriodId = academicPeriod.length > 0 ? academicPeriod[0].id : null;
```

#### **B. Academic Period Filtering:**
```sql
-- In get-teacher-student-results.js
WHERE s.teacher_id = ${actualTeacherId}
  AND s.grade = ${parseInt(gradeNumber)}
  AND s.class = ${parseInt(classNumber)}
  AND s.academic_period_id = ANY(${academicPeriodIds})
```

## 🧮 **Speaking Test Scoring Logic (Based on Word Matching Pattern)**

### **📊 Scoring Formula Implementation:**

#### **A. Word Matching Test Scoring Pattern:**
```javascript
// From submit-word-matching-test.js
const percentageVal = Math.round((Number(score) / Number(maxScore)) * 10000) / 100;
```

#### **B. Speaking Test AI Provider Configuration:**
```javascript
// In submit-speaking-test.js - AI provider configuration constants
const SPEAKING_AI_CONFIG = {
  // AI Providers
  STT_PROVIDER: 'assemblyai',           // Speech-to-text provider
  GRAMMAR_CHECKER: 'assemblyai',        // Grammar checking provider
  VOCAB_ANALYZER: 'assemblyai',         // Vocabulary analysis provider
  
  // Language Settings
  DEFAULT_LANGUAGE: 'en-US',            // Default language for analysis
  SUPPORTED_LANGUAGES: ['en-US', 'en-GB'], // Supported language codes
  
  // AssemblyAI Settings
  ASSEMBLYAI_MODEL: 'universal',         // AssemblyAI speech model
  ASSEMBLYAI_FEATURES: ['sentiment', 'entities', 'highlights'], // Additional features
  
  // LanguageTool Settings (Public API)
  LANGUAGETOOL_URL: 'https://api.languagetool.org/v2/check',  // Public API endpoint
  LANGUAGETOOL_LANGUAGE: 'en-US',        // LanguageTool language code
  LANGUAGETOOL_LEVEL: 'default'          // LanguageTool analysis level
};
```

#### **C. Speaking Test Scoring Configuration:**
```javascript
// In submit-speaking-test.js - Scoring configuration constants
const SPEAKING_SCORE_CONFIG = {
  // Scoring Weights (must sum to 1.0)
  WORD_WEIGHT: 0.30,        // 30% - Word count score
  GRAMMAR_WEIGHT: 0.40,     // 40% - Grammar score  
  VOCAB_WEIGHT: 0.30,       // 30% - Vocabulary score
  
  // Points Deduction
  POINTS_PER_GRAMMAR_ERROR: 2.0,  // Points deducted per grammar mistake
  POINTS_PER_VOCAB_ERROR: 2.0,    // Points deducted per vocabulary mistake
  
  // Validation
  MIN_WORDS_DEFAULT: 50,    // Default minimum word count
  MAX_SCORE: 100,           // Maximum possible score
  MIN_SCORE: 0              // Minimum possible score
};
```

#### **D. Speaking Test Scoring Logic with LanguageTool:**
```javascript
// In submit-speaking-test.js - Calculate scores using our formula with LanguageTool
const calculateSpeakingScore = async (transcript, testConfig, assemblyAIResult) => {
  const { min_words } = testConfig;
  const { WORD_WEIGHT, GRAMMAR_WEIGHT, VOCAB_WEIGHT, POINTS_PER_GRAMMAR_ERROR, POINTS_PER_VOCAB_ERROR } = SPEAKING_SCORE_CONFIG;
  
  // 1. Word Count Score (30%): min(actual_words / min_words, 1) * 30
  const actualWords = transcript.split(/\s+/).filter(word => word.length > 0).length;
  const wordScore = Math.min(actualWords / min_words, 1) * (WORD_WEIGHT * 100);
  
  // 2. Grammar Score (40%): max(40 - (grammar_mistakes * 2), 0)
  const grammarAnalysis = await analyzeGrammarWithLanguageTool(transcript, assemblyAIResult.language);
  const grammarScore = Math.max((GRAMMAR_WEIGHT * 100) - (grammarAnalysis.totalMistakes * POINTS_PER_GRAMMAR_ERROR), 0);
  
  // 3. Vocabulary Score (30%): max(30 - (vocab_mistakes * 2), 0)
  const vocabAnalysis = await analyzeVocabularyWithLanguageTool(transcript, assemblyAIResult.highlights, assemblyAIResult.language);
  const vocabScore = Math.max((VOCAB_WEIGHT * 100) - (vocabAnalysis.vocabMistakes * POINTS_PER_VOCAB_ERROR), 0);
  
  // 4. Total Score: word_score + grammar_score + vocab_score
  const overallScore = wordScore + grammarScore + vocabScore;
  
  return {
    word_score: Math.round(wordScore * 100) / 100,
    grammar_score: Math.round(grammarScore * 100) / 100,
    vocab_score: Math.round(vocabScore * 100) / 100,
    overall_score: Math.round(overallScore * 100) / 100,
    word_count: actualWords,
    grammar_mistakes: grammarAnalysis.totalMistakes,
    vocabulary_mistakes: vocabAnalysis.vocabMistakes,
    stt_confidence: assemblyAIResult.confidence,
    language: assemblyAIResult.language,
    highlights: assemblyAIResult.highlights,
    sentiment: assemblyAIResult.sentiment,
    entities: assemblyAIResult.entities,
    // Enhanced analysis results
    grammar_categories: grammarAnalysis.categories,
    grammar_matches: grammarAnalysis.matches,
    vocabulary_issues: vocabAnalysis.vocabularyIssues,
    lexical_density: vocabAnalysis.lexicalDensity,
    simple_word_ratio: vocabAnalysis.simpleWordRatio,
    language_tool_matches: vocabAnalysis.languageToolMatches
  };
};
```

#### **C. AssemblyAI Integration for Speech-to-Text:**
```javascript
// In submit-speaking-test.js - AssemblyAI Speech-to-Text Integration
import axios from "axios";
import fs from "fs-extra";

const baseUrl = "https://api.assemblyai.com";
const headers = {
  authorization: process.env.ASSEMBLYAI_API_KEY,
};

// Upload audio file to AssemblyAI
const uploadAudioToAssemblyAI = async (audioBlob) => {
  try {
    // Convert blob to buffer for upload
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    
    const uploadResponse = await axios.post(`${baseUrl}/v2/upload`, audioBuffer, {
      headers,
    });
    
    return uploadResponse.data.upload_url;
  } catch (error) {
    console.error('Audio upload to AssemblyAI failed:', error);
    throw new Error(`Audio upload failed: ${error.message}`);
  }
};

// Transcribe audio using AssemblyAI
const transcribeAudioWithAssemblyAI = async (audioUrl) => {
  try {
    const data = {
      audio_url: audioUrl,
      speech_model: "universal", // Use universal model for better accuracy
      language_detection: true,
      auto_highlights: true,
      sentiment_analysis: true,
      entity_detection: true
    };

    const url = `${baseUrl}/v2/transcript`;
    const response = await axios.post(url, data, { headers: headers });
    const transcriptId = response.data.id;
    
    // Poll for completion
    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
    
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, {
        headers: headers,
      });
      const transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === "completed") {
        return {
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          language: transcriptionResult.language_code,
          highlights: transcriptionResult.auto_highlights_result,
          sentiment: transcriptionResult.sentiment_analysis_results,
          entities: transcriptionResult.entities
        };
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        // Wait 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

// Complete AssemblyAI processing pipeline
const processAudioWithAssemblyAI = async (audioBlob) => {
  try {
    // Step 1: Upload audio to AssemblyAI
    const audioUrl = await uploadAudioToAssemblyAI(audioBlob);
    
    // Step 2: Transcribe audio
    const transcriptionResult = await transcribeAudioWithAssemblyAI(audioUrl);
    
    return transcriptionResult;
  } catch (error) {
    console.error('AssemblyAI processing error:', error);
    throw error;
  }
};
```

#### **D. LanguageTool Integration for Grammar & Vocabulary Analysis:**
```javascript
// LanguageTool API Integration (Based on language_tool-main Python implementation)
// Reference: language_tool-main/src/correction.py shows the exact API usage pattern
const checkGrammarWithLanguageTool = async (transcript, language = 'en-US') => {
  try {
    const formData = new URLSearchParams();
    formData.append('text', transcript);
    formData.append('language', language);
    formData.append('level', 'picky'); // Use picky level for more thorough checking
    formData.append('enabledOnly', 'false');
    
    const response = await fetch(SPEAKING_AI_CONFIG.LANGUAGETOOL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SpeakingTestApp/1.0'
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('LanguageTool API error:', error);
    return { matches: [] }; // Return empty matches if API fails
  }
};

// Grammar Analysis using LanguageTool
const analyzeGrammarWithLanguageTool = async (transcript, language = 'en-US') => {
  try {
    const languageToolResult = await checkGrammarWithLanguageTool(transcript, language);
    
    // Count grammar mistakes from LanguageTool
    const grammarMistakes = languageToolResult.matches?.length || 0;
    
    // Categorize mistakes by type
    const mistakeCategories = {
      grammar: 0,
      spelling: 0,
      style: 0,
      punctuation: 0,
      other: 0
    };
    
    languageToolResult.matches?.forEach(match => {
      const category = match.rule?.category?.id || 'other';
      switch (category) {
        case 'GRAMMAR':
          mistakeCategories.grammar++;
          break;
        case 'SPELLING':
          mistakeCategories.spelling++;
          break;
        case 'STYLE':
          mistakeCategories.style++;
          break;
        case 'PUNCTUATION':
          mistakeCategories.punctuation++;
          break;
        default:
          mistakeCategories.other++;
      }
    });
    
    return {
      totalMistakes: grammarMistakes,
      categories: mistakeCategories,
      matches: languageToolResult.matches || [],
      language: languageToolResult.language?.code || language
    };
  } catch (error) {
    console.error('Grammar analysis with LanguageTool error:', error);
    return {
      totalMistakes: 0,
      categories: { grammar: 0, spelling: 0, style: 0, punctuation: 0, other: 0 },
      matches: [],
      language: language
    };
  }
};

// Vocabulary Analysis using LanguageTool + AssemblyAI
const analyzeVocabularyWithLanguageTool = async (transcript, assemblyAIHighlights, language = 'en-US') => {
  try {
    const words = transcript.split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const lexicalDensity = uniqueWords.size / words.length;
    
    // Get LanguageTool results for vocabulary analysis
    const languageToolResult = await checkGrammarWithLanguageTool(transcript, language);
    
    // Analyze vocabulary complexity
    let vocabMistakes = 0;
    let vocabularyIssues = [];
    
    // Low lexical density indicates repetitive vocabulary
    if (lexicalDensity < 0.5) {
      vocabMistakes += 2;
      vocabularyIssues.push('Low lexical diversity');
    }
    if (lexicalDensity < 0.3) {
      vocabMistakes += 3;
      vocabularyIssues.push('Very low lexical diversity');
    }
    
    // Check for overuse of simple words
    const simpleWords = ['the', 'a', 'an', 'and', 'or', 'but', 'so', 'very', 'really', 'good', 'bad', 'nice', 'big', 'small'];
    const simpleWordCount = words.filter(word => simpleWords.includes(word.toLowerCase())).length;
    const simpleWordRatio = simpleWordCount / words.length;
    
    if (simpleWordRatio > 0.3) {
      vocabMistakes += 1;
      vocabularyIssues.push('Overuse of simple vocabulary');
    }
    if (simpleWordRatio > 0.5) {
      vocabMistakes += 2;
      vocabularyIssues.push('Excessive use of simple vocabulary');
    }
    
    // Check for vocabulary-related LanguageTool matches
    const vocabMatches = languageToolResult.matches?.filter(match => 
      match.rule?.category?.id === 'STYLE' || 
      match.rule?.description?.toLowerCase().includes('vocabulary') ||
      match.rule?.description?.toLowerCase().includes('word choice')
    ) || [];
    
    vocabMistakes += vocabMatches.length;
    vocabularyIssues.push(...vocabMatches.map(match => match.message));
    
    return {
      vocabMistakes,
      lexicalDensity,
      simpleWordRatio,
      vocabularyIssues,
      languageToolMatches: vocabMatches
    };
  } catch (error) {
    console.error('Vocabulary analysis with LanguageTool error:', error);
    return {
      vocabMistakes: 0,
      lexicalDensity: 0,
      simpleWordRatio: 0,
      vocabularyIssues: [],
      languageToolMatches: []
    };
  }
};
```

#### **E. Complete Processing Pipeline with AssemblyAI + LanguageTool:**
```javascript
// In submit-speaking-test.js - Complete processing with AssemblyAI + LanguageTool
const processSpeakingTestSubmission = async (audioBlob, testConfig, userInfo, testData) => {
  try {
    // Step 1: Process audio with AssemblyAI
    const assemblyAIResult = await processAudioWithAssemblyAI(audioBlob);
    const transcript = assemblyAIResult.text;
    
    // Step 2: Calculate scores using LanguageTool + AssemblyAI results
    const scores = await calculateSpeakingScore(transcript, testConfig, assemblyAIResult);
    
    // Step 3: Upload audio to Supabase
    const audioUpload = await uploadAudioToSupabase(audioBlob, userInfo.student_id, testData.test_id);
    
    // Step 4: Insert results into database with enhanced analysis
    const result = await sql`
      INSERT INTO speaking_test_results (
        test_id, test_name, teacher_id, subject_id, grade, class, number,
        student_id, name, surname, nickname,
        question_id, audio_url, transcript, word_count,
        grammar_mistakes, vocabulary_mistakes, stt_confidence,
        word_score, grammar_score, vocab_score, overall_score,
        time_taken, started_at, submitted_at, caught_cheating,
        visibility_change_times, is_completed, academic_period_id, created_at
      )
      VALUES (
        ${testData.test_id}, ${testData.test_name}, ${testData.teacher_id}, ${testData.subject_id}, 
        ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
        ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
        ${testData.question_id}, ${audioUpload.publicUrl}, ${transcript}, ${scores.word_count},
        ${scores.grammar_mistakes}, ${scores.vocabulary_mistakes}, ${scores.stt_confidence},
        ${scores.word_score}, ${scores.grammar_score}, ${scores.vocab_score}, ${scores.overall_score},
        ${testData.time_taken || null}, ${testData.started_at || null}, ${testData.submitted_at || new Date().toISOString()}, 
        ${testData.caught_cheating || false}, ${testData.visibility_change_times || 0}, ${testData.is_completed || true}, 
        ${testData.academicPeriodId}, NOW()
      )
      RETURNING id, percentage, is_completed
    `;
    
    return {
      resultId: result[0].id,
      percentage: result[0].percentage,
      isCompleted: result[0].is_completed,
      scores: scores,
      transcript: transcript,
      audioUrl: audioUpload.publicUrl,
      assemblyAIResult: assemblyAIResult,
      // Enhanced analysis data for detailed feedback
      analysis: {
        grammar_categories: scores.grammar_categories,
        grammar_matches: scores.grammar_matches,
        vocabulary_issues: scores.vocabulary_issues,
        lexical_density: scores.lexical_density,
        simple_word_ratio: scores.simple_word_ratio,
        language_tool_matches: scores.language_tool_matches
      }
    };
  } catch (error) {
    console.error('Speaking test processing error:', error);
    throw error;
  }
};
```

#### **E. Test Attempts with Calculated Scores:**
```javascript
// In submit-speaking-test.js - Insert into test_attempts with calculated scores
const percentageVal = Math.round((scores.overall_score / 100) * 10000) / 100;

await sql`
  INSERT INTO test_attempts (
    student_id, test_id, attempt_number, score, max_score, percentage,
    time_taken, started_at, submitted_at, is_completed,
    answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
    retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
    name, surname, nickname, academic_period_id
  )
  VALUES (
    ${userInfo.student_id}, ${effectiveParentTestId}, ${attemptNumberToWrite}, 
    ${scores.overall_score}, 100, ${percentageVal},
    ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, 
    ${is_completed || true},
    ${JSON.stringify({transcript, word_count: scores.word_count, grammar_mistakes: scores.grammar_mistakes, vocab_mistakes: scores.vocabulary_mistakes})}, 
    ${JSON.stringify({})}, ${JSON.stringify([])}, ${caught_cheating || false}, ${visibility_change_times || 0},
    ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
    ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname}, ${academicPeriodId}
  )
`;
```

#### **F. Retest Score Prioritization (Same as Word Matching):**
```javascript
// In get-teacher-student-results.js - Use COALESCE for retest scores
COALESCE(s_best.best_score, s.overall_score) AS score,
COALESCE(s_best.best_max, 100) AS max_score,
COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times
```

#### **G. Early Pass Behavior (Same as Word Matching):**
```javascript
// In submit-speaking-test.js - Early pass for retests
if (percentageVal >= 50) {
  await sql`
    UPDATE retest_targets tgt
    SET attempt_count = ra.max_attempts,
        last_attempt_at = NOW(),
        status = 'PASSED'
    FROM retest_assignments ra
    WHERE tgt.retest_assignment_id = ra.id
      AND tgt.retest_assignment_id = ${retest_assignment_id} 
      AND student_id = ${userInfo.student_id}
  `;
} else {
  await sql`
    UPDATE retest_targets 
    SET attempt_count = GREATEST(attempt_count + 1, ${attemptNumberToWrite}),
        last_attempt_at = NOW(),
        status = 'FAILED'
    WHERE retest_assignment_id = ${retest_assignment_id} 
      AND student_id = ${userInfo.student_id}
  `;
}
```

### **🎯 Scoring Configuration from Database:**
```javascript
// In submit-speaking-test.js - Get test configuration
const testConfig = await sql`
  SELECT min_words, word_weight, grammar_weight, vocab_weight, 
         points_per_grammar_error, points_per_vocab_error
  FROM speaking_tests 
  WHERE id = ${test_id}
`;

const config = testConfig[0];
const scores = await calculateSpeakingScore(transcript, config);
```

### **📊 Score Breakdown Display:**
```javascript
// Return detailed score breakdown to frontend
return {
  statusCode: 200,
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    success: true,
    message: 'Speaking test submitted successfully',
    result_id: resultId,
    score: scores.overall_score,
    max_score: 100,
    percentage: Math.round(scores.overall_score),
    score_breakdown: {
      word_score: scores.word_score,
      grammar_score: scores.grammar_score,
      vocab_score: scores.vocab_score,
      word_count: scores.word_count,
      grammar_mistakes: scores.grammar_mistakes,
      vocabulary_mistakes: scores.vocabulary_mistakes
    }
  })
};
```

## 🗄️ **Supabase Audio Bucket Configuration**

### **📁 Audio Storage Setup:**

#### **A. Supabase Bucket Creation:**
```sql
-- Create audio bucket in Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaking-audio',
  'speaking-audio',
  false, -- Private bucket for security
  50000000, -- 50MB file size limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg']
);
```

#### **B. Supabase Storage Policies:**

##### **1. Allow File Deletion (DELETE Policy):**
```sql
-- Policy for deleting audio files
CREATE POLICY "Allow file deletion for speaking tests" ON storage.objects
FOR DELETE USING (
  bucket_id = 'speaking-audio' AND
  auth.role() = 'authenticated' AND
  (
    -- Teachers can delete files they created
    (storage.foldername(name))[1] = 'teacher-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
  ) OR
  (
    -- Students can delete their own files
    (storage.foldername(name))[1] = 'student-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
  ) OR
  (
    -- Admins can delete any file
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  )
);
```

##### **2. Allow File Downloads (SELECT Policy):**
```sql
-- Policy for downloading audio files
CREATE POLICY "Allow file downloads for speaking tests" ON storage.objects
FOR SELECT USING (
  bucket_id = 'speaking-audio' AND
  auth.role() = 'authenticated' AND
  (
    -- Students can download their own files
    (storage.foldername(name))[1] = 'student-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
  ) OR
  (
    -- Teachers can download files from their classes
    (storage.foldername(name))[1] = 'student-uploads' AND
    EXISTS (
      SELECT 1 FROM speaking_test_results str
      JOIN students s ON str.student_id = s.student_id
      JOIN teachers t ON str.teacher_id = t.teacher_id
      WHERE str.audio_url LIKE '%' || name || '%'
        AND t.teacher_id = (
          SELECT teacher_id FROM teachers 
          WHERE user_id = auth.uid()
        )
    )
  ) OR
  (
    -- Admins can download any file
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  )
);
```

##### **3. Allow File Uploads (INSERT Policy):**
```sql
-- Policy for uploading audio files
CREATE POLICY "Allow file uploads for speaking tests" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'speaking-audio' AND
  auth.role() = 'authenticated' AND
  (
    -- Students can upload to their own folder
    (storage.foldername(name))[1] = 'student-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
  ) OR
  (
    -- Teachers can upload to teacher folder
    (storage.foldername(name))[1] = 'teacher-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
  ) OR
  (
    -- Admins can upload anywhere
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  )
);
```

#### **C. File Path Structure:**
```
speaking-audio/
├── student-uploads/
│   └── {student_id}/
│       └── {test_id}/
│           └── {timestamp}-{filename}.webm
├── teacher-uploads/
│   └── {teacher_id}/
│       └── {test_id}/
│           └── {timestamp}-{filename}.webm
└── admin-uploads/
    └── {admin_id}/
        └── {test_id}/
            └── {timestamp}-{filename}.webm
```

#### **D. Audio Upload Function:**
```javascript
// In upload-speaking-audio.js
const uploadAudioToSupabase = async (audioBlob, studentId, testId) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const timestamp = Date.now();
  const fileName = `${timestamp}-speaking-test.webm`;
  const filePath = `student-uploads/${studentId}/${testId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('speaking-audio')
    .upload(filePath, audioBlob, {
      contentType: 'audio/webm',
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('speaking-audio')
    .getPublicUrl(filePath);
    
  return {
    filePath: data.path,
    publicUrl: urlData.publicUrl,
    fileName: fileName
  };
};
```

#### **E. Audio Download Function:**
```javascript
// In get-speaking-audio.js
const downloadAudioFromSupabase = async (filePath) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const { data, error } = await supabase.storage
    .from('speaking-audio')
    .download(filePath);
    
  if (error) {
    throw new Error(`Audio download failed: ${error.message}`);
  }
  
  return data;
};
```

#### **F. Audio Deletion Function:**
```javascript
// In delete-speaking-audio.js
const deleteAudioFromSupabase = async (filePath) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const { error } = await supabase.storage
    .from('speaking-audio')
    .remove([filePath]);
    
  if (error) {
    throw new Error(`Audio deletion failed: ${error.message}`);
  }
  
  return true;
};
```

#### **G. Package Dependencies:**
```json
// In functions/package.json - Add required dependencies
{
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "axios": "^1.6.0",
    "fs-extra": "^11.1.1",
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

#### **H. Environment Variables:**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AssemblyAI Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# LanguageTool Configuration (Public API for grammar analysis)
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_USERNAME=your_languagetool_username  # Optional for premium features
LANGUAGETOOL_API_KEY=your_languagetool_api_key     # Optional for premium features
```








#### **J. Python LanguageTool Reference Implementation:**
```markdown
## 📚 **Using language_tool-main as Reference:**

### **🔍 Key Insights from Python Implementation:**
- **API Endpoint**: `https://api.languagetool.org/v2/check`
- **Method**: POST with form data
- **Parameters**: `text`, `language=auto` (or specific language)
- **Response**: JSON with `matches` array containing error details

### **📋 Error Structure (from Python code):**
```json
{
  "matches": [
    {
      "length": 8,
      "offset": 7,
      "replacements": [{"value": "many dogs"}],
      "rule": {
        "category": {"id": "GRAMMAR", "name": "Grammar"},
        "description": "Possible agreement error",
        "id": "MANY_NN"
      },
      "message": "Possible agreement error. The noun 'dog' seems to be countable"
    }
  ]
}
```

### **🛠️ Implementation Pattern:**
1. **Send POST request** with text and language
2. **Parse JSON response** for matches array
3. **Extract error details** (offset, length, replacements)
4. **Categorize errors** by rule.category.id
5. **Count total mistakes** for scoring

### **⚡ Rate Limits (from Python README):**
- **20 requests per IP per minute**
- **75KB text per IP per minute** 
- **20KB text per request**
- **30 misspelled words max suggestions**

### **🐳 Docker Option:**
The Python implementation includes Docker support if we want to run it as a microservice:
```bash
docker build . -t language_tool --network=host
docker run language_tool:latest --sentence 'I have many dog.'
```
```

#### **K. Database Integration:**
```javascript
// In submit-speaking-test.js - Store audio file reference
const audioUpload = await uploadAudioToSupabase(audioBlob, userInfo.student_id, test_id);

const result = await sql`
  INSERT INTO speaking_test_results (
    test_id, test_name, teacher_id, subject_id, grade, class, number,
    student_id, name, surname, nickname,
    question_id, audio_url, transcript, word_count,
    grammar_mistakes, vocabulary_mistakes, stt_confidence,
    word_score, grammar_score, vocab_score, overall_score,
    time_taken, started_at, submitted_at, caught_cheating,
    visibility_change_times, is_completed, academic_period_id, created_at
  )
  VALUES (
    ${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, 
    ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
    ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
    ${question_id}, ${audioUpload.publicUrl}, ${transcript}, ${scores.word_count},
    ${scores.grammar_mistakes}, ${scores.vocabulary_mistakes}, ${stt_confidence},
    ${scores.word_score}, ${scores.grammar_score}, ${scores.vocab_score}, ${scores.overall_score},
    ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, 
    ${caught_cheating || false}, ${visibility_change_times || 0}, ${is_completed || true}, 
    ${academicPeriodId}, NOW()
  )
  RETURNING id, percentage, is_completed
`;
```

#### **I. Audio Management in Results:**
```javascript
// In get-teacher-student-results.js - Include audio file access
SELECT 
  'speaking' as test_type,
  s.id, s.test_id, s.test_name, s.teacher_id, s.subject_id,
  s.grade, s.class, s.number, s.student_id, s.name, s.surname, s.nickname,
  COALESCE(s_best.best_score, s.overall_score) AS score,
  COALESCE(s_best.best_max, 100) AS max_score,
  s.percentage, s.transcript, s.audio_url,
  s.time_taken, s.started_at, s.submitted_at,
  COALESCE(s_best.best_caught_cheating, s.caught_cheating) AS caught_cheating,
  COALESCE(s_best.best_visibility_change_times, s.visibility_change_times) AS visibility_change_times,
  s.is_completed, s.retest_offered, s.created_at, s.academic_period_id,
  s.subject, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
FROM speaking_test_results s
LEFT JOIN subjects s ON s.subject_id = s.subject_id
LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
LEFT JOIN LATERAL (
  SELECT ta.score AS best_score, ta.max_score AS best_max, 
         ta.caught_cheating AS best_caught_cheating, 
         ta.visibility_change_times AS best_visibility_change_times
  FROM test_attempts ta
  WHERE ta.student_id = s.student_id
    AND ta.test_id = s.test_id
    AND ta.retest_assignment_id IS NOT NULL
  ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
  LIMIT 1
) s_best ON TRUE
WHERE s.teacher_id = ${actualTeacherId}
  AND s.grade = ${parseInt(gradeNumber)}
  AND s.class = ${parseInt(classNumber)}
  AND s.academic_period_id = ANY(${academicPeriodIds})
```

### **🔒 Security Features:**

#### **A. Access Control:**
- **Student Access** - Can only access their own files
- **Teacher Access** - Can access files from their classes
- **Admin Access** - Can access all files
- **Private Bucket** - Files not publicly accessible

#### **B. File Validation:**
- **MIME Type Check** - Only audio files allowed
- **File Size Limit** - 50MB maximum
- **Path Validation** - Structured folder hierarchy
- **Authentication Required** - All operations require auth

#### **C. Cleanup Policies:**
- **Automatic Cleanup** - Old files can be automatically deleted
- **Retention Period** - Configurable file retention
- **Storage Monitoring** - Track storage usage

This plan provides a comprehensive roadmap for implementing speaking test backend functionality following the established patterns in the codebase.
