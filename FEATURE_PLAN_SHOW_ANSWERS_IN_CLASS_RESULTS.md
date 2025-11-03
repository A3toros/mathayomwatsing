# Feature Plan: Show Student Answers in Class Results Table

## Overview
Add functionality to allow teachers to view student answers when clicking on scores in the class results table. If the score is NOT red (< 50%), show answers in a modal. If red (< 50%), continue showing the retest option as currently implemented.

## Current State Analysis

### Test Types and Answer Storage

#### 1. Multiple Choice Tests
- **Table**: `multiple_choice_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**: 
  ```json
  {
    "1": "A",
    "2": "B",
    "3": "C"
  }
  ```
- **Questions Table**: `multiple_choice_test_questions`
- **Question Fields**: `question_id`, `question`, `correct_answer`, `option_a`, `option_b`, `option_c`, `option_d`, `option_e`, `option_f`

#### 2. True/False Tests
- **Table**: `true_false_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": true,
    "2": false,
    "3": true
  }
  ```
- **Questions Table**: `true_false_test_questions`
- **Question Fields**: `question_id`, `question`, `correct_answer` (BOOLEAN)

#### 3. Input Tests
- **Table**: `input_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": "Paris",
    "2": "London",
    "3": "Tokyo"
  }
  ```
- **Questions Table**: `input_test_questions`
- **Question Fields**: `question_id`, `question`, `correct_answers` (TEXT[])

#### 4. Matching Type Tests
- **Table**: `matching_type_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": {"left": "word1", "right": "word2"},
    "2": {"left": "word3", "right": "word4"}
  }
  ```
- **Questions Table**: `matching_type_test_questions`
- **Question Fields**: `question_id`, `word`, `block_coordinates` (JSONB), `has_arrow`
- **Arrows Table**: `matching_type_test_arrows` (for visual matching)
- **Special**: Requires image_url from `matching_type_tests` table

#### 5. Word Matching Tests
- **Table**: `word_matching_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": {"word": "left_word", "definition": "right_word"},
    "2": {"word": "left_word2", "definition": "right_word2"}
  }
  ```
- **Questions Table**: `word_matching_questions`
- **Question Fields**: `question_id`, `left_word`, `right_word`

#### 6. Drawing Tests
- **Table**: `drawing_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": {
      "paths": [...],
      "textBoxes": [...]
    }
  }
  ```
- **Questions Table**: `drawing_test_questions`
- **Question Fields**: `question_id`, `question_json` (JSONB), `canvas_width`, `canvas_height`, `max_canvas_width`, `max_canvas_height`
- **Images Table**: `drawing_test_images` (stores actual drawings)
- **Special**: Has existing drawing modal (`DrawingModal` component)

#### 7. Fill Blanks Tests
- **Table**: `fill_blanks_test_results`
- **Answer Field**: `answers` (JSONB)
- **Format**:
  ```json
  {
    "1": ["answer1", "answer2", "answer3"]
  }
  ```
- **Questions Table**: `fill_blanks_test_questions`
- **Question Fields**: `question_id`, `question_json` (JSONB), `blank_positions` (JSONB), `blank_options` (JSONB), `correct_answers` (JSONB)

#### 8. Speaking Tests
- **Table**: `speaking_test_results`
- **Answer Field**: N/A (uses `audio_url`, `transcript`, `ai_feedback`)
- **Format**: Special - audio-based
- **Questions Table**: `speaking_test_questions`
- **Question Fields**: `question_number`, `prompt`, `expected_duration`, `difficulty_level`
- **Special**: Has existing speaking test modal (`SpeakingTestReview` component)

### Current Click Handler Logic
**Location**: `src/teacher/TeacherResults.jsx` (lines 1205-1223, 1747-1764)

**Current Behavior**:
- Click on score cell → Check if score is red (< 50%)
- If red AND retest not offered → Open retest modal
- If red AND retest offered → Show notification "Retest is already offered"
- If NOT red → No action

**Special Cases**:
- Drawing tests: Has separate "View Drawing" button (line 1227-1232)
- Speaking tests: Uses `handleViewSpeakingTest` function (line 676)

### Backend API Analysis

#### Existing APIs Available:
1. **`get-teacher-student-results.js`** ✅
   - Returns all results with `answers` field included
   - Already used by `TeacherResults` component
   - Returns data from `teacher_student_results_view`
   - **Answer data is already available in frontend!**

2. **`get-test-questions.js`** ✅
   - Can fetch questions for any test type
   - Endpoint: `/.netlify/functions/get-test-questions?test_type={type}&test_id={id}`
   - Returns questions with correct answers

3. **`get-test-questions.js`** Structure:
   - Handles all 8 test types
   - Returns questions array with correct answers
   - Already used by `testService.getTestQuestions()`

#### Missing/Needed:
- **No new backend API needed!** ✅
- All answer data is already in `teacher_student_results_view`
- All question data can be fetched via existing `get-test-questions.js`

## Implementation Plan

### Phase 1: Frontend Component Structure

#### 1.1 Create Answer View Modal Component
**File**: `src/components/test/TestAnswerModal.jsx`

**Purpose**: Universal modal component to display answers for all test types

**Props**:
```typescript
{
  isOpen: boolean
  onClose: () => void
  testResult: {
    test_type: string
    test_id: number
    test_name: string
    student_id: string
    name: string
    surname: string
    score: number
    max_score: number
    percentage: number
    answers: JSONB (already parsed)
    subject: string
    submitted_at: timestamp
    // ... other fields
  }
  questions: Array (fetched separately)
}
```

**Component Structure**:
- Use `PerfectModal` as base
- Size: 'large' (max-w-4xl)
- Render different content based on `test_type`

#### 1.2 Modal Content for Each Test Type

##### Multiple Choice:
- Table format:
  | Question | Student Answer | Correct Answer | Status |
  |----------|----------------|----------------|--------|
  | Q1: ... | A (option_a) | B (option_b) | ❌ |
  - Show options with highlighting
  - Green for correct, red for incorrect

##### True/False:
- Table format:
  | Question | Student Answer | Correct Answer | Status |
  |----------|----------------|----------------|--------|
  | Q1: ... | True | True | ✅ |
  - Simple boolean display

##### Input:
- Table format:
  | Question | Student Answer | Correct Answer(s) | Status |
  |----------|----------------|-------------------|--------|
  | Q1: ... | Paris123 | Paris, París | ✅ |
  - Show all accepted correct answers
  - Highlight if student answer contains correct (using new substring logic)

##### Matching Type:
- Show image if available (from `matching_type_tests.image_url`)
- Display student matches vs correct matches
- Visual comparison of connections

##### Word Matching:
- Table format showing word pairs:
  | Left Word | Student Match | Correct Match | Status |
  |-----------|---------------|---------------|--------|
  | Word1 | Def2 | Def1 | ❌ |

##### Drawing:
- Use existing `DrawingModal` component
- Already implemented, just need to trigger it

##### Fill Blanks:
- Display text with blanks filled
- Show student answers vs correct answers
- Highlight incorrect blanks

##### Speaking:
- Use existing `SpeakingTestReview` component
- Already implemented, just need to trigger it

### Phase 2: Backend Data Fetching

#### 2.1 Enhance `loadResultsForTerm` or Create New Function

**Option A**: Questions already available in results
- Check if questions are included in `teacher_student_results_view`
- If not, modify view to include questions

**Option B**: Fetch questions on-demand (Recommended)
- When modal opens, fetch questions via `getTestQuestions(test_type, test_id)`
- Cache questions for same test_id
- Use existing `testService.getTestQuestions()`

**Implementation**:
```javascript
// In TeacherResults.jsx
const [loadingQuestions, setLoadingQuestions] = useState(false);
const [testQuestionsCache, setTestQuestionsCache] = useState({});

const fetchTestQuestions = useCallback(async (testType, testId) => {
  const cacheKey = `${testType}_${testId}`;
  
  if (testQuestionsCache[cacheKey]) {
    return testQuestionsCache[cacheKey];
  }
  
  setLoadingQuestions(true);
  try {
    const questions = await testService.getTestQuestions(testType, testId);
    setTestQuestionsCache(prev => ({
      ...prev,
      [cacheKey]: questions
    }));
    return questions;
  } finally {
    setLoadingQuestions(false);
  }
}, [testQuestionsCache]);
```

### Phase 3: Click Handler Modification

#### 3.1 Update Score Cell Click Handler

**Location**: `src/teacher/TeacherResults.jsx`

**Current**: Lines 1205-1223 (main table), 1747-1764 (mobile table)

**New Logic**:
```javascript
onClick={(e) => {
  const pct = computePercentage(testResult);
  const isRed = pct !== null && pct < 50;
  
  if (isRed) {
    // Existing retest logic
    if (testResult?.retest_offered) {
      showNotification('Retest is already offered', 'info');
      return;
    }
    openRetestModal({
      failedStudentIds: [student.student_id],
      test_type: test.test_type,
      original_test_id: testResult?.test_id || test.test_id,
      subject_id: testResult?.subject_id || test.subject_id,
      grade: selectedGrade,
      class: selectedClass
    });
  } else {
    // NEW: Show answers modal for non-red scores
    handleViewAnswers(testResult, test);
  }
}}
```

#### 3.2 Create `handleViewAnswers` Function

```javascript
const handleViewAnswers = useCallback(async (testResult, test) => {
  // Special handling for drawing and speaking tests
  if (testResult.test_type === 'drawing') {
    handleViewDrawing(testResult);
    return;
  }
  
  if (testResult.test_type === 'speaking') {
    handleViewSpeakingTest(testResult);
    return;
  }
  
  // For all other test types, show answers modal
  setSelectedTestResult(testResult);
  
  // Fetch questions if not cached
  const questions = await fetchTestQuestions(
    testResult.test_type || test.test_type,
    testResult.test_id || test.test_id
  );
  
  setSelectedTestQuestions(questions);
  setIsAnswerModalOpen(true);
}, [fetchTestQuestions, handleViewDrawing, handleViewSpeakingTest]);
```

### Phase 4: State Management

#### 4.1 Add New State Variables

```javascript
// Answer modal state
const [selectedTestResult, setSelectedTestResult] = useState(null);
const [selectedTestQuestions, setSelectedTestQuestions] = useState(null);
const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
const [testQuestionsCache, setTestQuestionsCache] = useState({});
```

#### 4.2 Answer Parsing Helper

```javascript
const parseAnswers = useCallback((answers) => {
  if (!answers) return {};
  
  // Handle both JSONB string and object
  if (typeof answers === 'string') {
    try {
      return JSON.parse(answers);
    } catch {
      return {};
    }
  }
  
  return answers || {};
}, []);
```

### Phase 5: Modal Component Implementation

#### 5.1 Create TestAnswerModal Component

**File**: `src/components/test/TestAnswerModal.jsx`

**Key Features**:
1. Parse answers JSONB
2. Match answers with questions by question_id
3. Render appropriate UI per test type
4. Show correct/incorrect status
5. Display student info and test metadata

**Component Structure**:
```jsx
<PerfectModal
  isOpen={isAnswerModalOpen}
  onClose={() => setIsAnswerModalOpen(false)}
  title={`${selectedTestResult?.test_name} - ${selectedTestResult?.name} ${selectedTestResult?.surname}`}
  size="large"
>
  <div className="space-y-4">
    {/* Test metadata */}
    <div className="flex justify-between items-center">
      <span>Score: {selectedTestResult?.score}/{selectedTestResult?.max_score}</span>
      <span>Percentage: {selectedTestResult?.percentage}%</span>
    </div>
    
    {/* Test type specific render */}
    {renderAnswersByTestType(selectedTestResult, selectedTestQuestions)}
  </div>
</PerfectModal>
```

#### 5.2 Render Functions for Each Test Type

**Multiple Choice Render**:
- Map through questions
- Get student answer from answers JSONB by question_id
- Compare with correct_answer
- Display options with colors

**True/False Render**:
- Simple table with True/False badges

**Input Render**:
- Show question text
- Show student answer
- Show all correct answers (from correct_answers array)
- Use substring matching to determine correctness

**Matching Type Render**:
- Load image from test
- Show visual connections
- Overlay student matches vs correct matches

**Word Matching Render**:
- Side-by-side comparison table

**Fill Blanks Render**:
- Render text with blanks
- Show student fills vs correct fills
- Highlight differences

### Phase 6: Integration Points

#### 6.1 Modify TeacherResults Component

**File**: `src/teacher/TeacherResults.jsx`

**Changes Needed**:
1. Import `TestAnswerModal` component
2. Add state variables (from Phase 4)
3. Add `fetchTestQuestions` function (from Phase 2)
4. Add `handleViewAnswers` function (from Phase 3)
5. Modify click handlers (from Phase 3)
6. Render `TestAnswerModal` at end of component

#### 6.2 Answer Data Already Available

**Key Discovery**: `teacher_student_results_view` already includes `answers` field!
- No backend changes needed
- Answers are in the results data
- Just need to parse JSONB and match with questions

### Phase 7: Edge Cases and Error Handling

#### 7.1 Handle Missing Data
- If questions fail to load → Show error message
- If answers JSONB is malformed → Show "Unable to parse answers"
- If test_id is missing → Don't open modal

#### 7.2 Handle Special Test States
- Retest scores (use `best_retest_score` if available)
- Incomplete tests (check `is_completed` flag)
- Tests with `caught_cheating` flag → Show warning

#### 7.3 Performance Considerations
- Cache questions per test_id to avoid repeated API calls
- Lazy load questions only when modal opens
- Show loading state while fetching questions

### Phase 8: Testing Checklist

#### 8.1 Test Each Test Type
- [ ] Multiple Choice - View answers modal
- [ ] True/False - View answers modal
- [ ] Input - View answers modal
- [ ] Matching Type - View answers modal
- [ ] Word Matching - View answers modal
- [ ] Drawing - Should use existing drawing modal
- [ ] Fill Blanks - View answers modal
- [ ] Speaking - Should use existing speaking modal

#### 8.2 Test Edge Cases
- [ ] Red score (< 50%) - Still shows retest (not answers)
- [ ] Yellow/Green score (>= 50%) - Shows answers modal
- [ ] Missing answers field
- [ ] Malformed JSONB
- [ ] Failed question fetch
- [ ] Test with no questions
- [ ] Retest scores (best_retest_score)

#### 8.3 Test UI/UX
- [ ] Modal opens/closes correctly
- [ ] Answers display correctly
- [ ] Correct/incorrect highlighting works
- [ ] Mobile responsive
- [ ] Loading states show properly

## Database Schema Summary

### Answer Storage Format (JSONB)
All test results tables store answers in JSONB format with question_id as keys:

```sql
-- Example for multiple_choice_test_results
answers JSONB NOT NULL
-- Content: {"1": "A", "2": "B", "3": "C"}

-- Example for input_test_results  
answers JSONB NOT NULL
-- Content: {"1": "Paris", "2": "London"}

-- Example for matching_type_test_results
answers JSONB NOT NULL
-- Content: {"1": {"left": "word1", "right": "word2"}}

-- Example for fill_blanks_test_results
answers JSONB NOT NULL
-- Content: {"1": ["answer1", "answer2"]}
```

### Question Tables Structure
Each test type has corresponding questions table:
1. `multiple_choice_test_questions` - question_id, question, correct_answer, option_a-f
2. `true_false_test_questions` - question_id, question, correct_answer (BOOLEAN)
3. `input_test_questions` - question_id, question, correct_answers (TEXT[])
4. `matching_type_test_questions` - question_id, word, block_coordinates, has_arrow
5. `word_matching_questions` - question_id, left_word, right_word
6. `drawing_test_questions` - question_id, question_json, canvas dimensions
7. `fill_blanks_test_questions` - question_id, question_json, blank_positions, blank_options, correct_answers
8. `speaking_test_questions` - question_number, prompt, expected_duration

## Backend API Endpoints Available

### 1. Get Test Questions
**Endpoint**: `/.netlify/functions/get-test-questions`
**Method**: GET
**Params**: 
- `test_type`: one of ['multiple_choice', 'true_false', 'input', 'matching_type', 'word_matching', 'drawing', 'fill_blanks', 'speaking']
- `test_id`: integer test ID

**Returns**: Array of questions with correct answers

### 2. Get Teacher Student Results (Already Used)
**Endpoint**: `/.netlify/functions/get-teacher-student-results`
**Already returns**: Results with `answers` JSONB field included

**No new backend API needed!** ✅

## Implementation Steps Summary

1. ✅ **Analyze current structure** - Complete
2. **Create TestAnswerModal component** - New component
3. **Add state management** - Add to TeacherResults.jsx
4. **Add question fetching** - Use existing API
5. **Modify click handlers** - Update onClick logic
6. **Implement render functions** - For each test type
7. **Test all scenarios** - Comprehensive testing
8. **Handle edge cases** - Error handling
9. **Deploy and verify** - Final validation

## Files to Create/Modify

### New Files:
1. `src/components/test/TestAnswerModal.jsx` - Main modal component

### Files to Modify:
1. `src/teacher/TeacherResults.jsx` - Add handlers and state
2. `src/services/testService.js` - May need to verify getTestQuestions exists (already exists ✅)

## Notes

- **No database changes needed** ✅
- **No new backend APIs needed** ✅
- **Answers already available** in `teacher_student_results_view`
- **Questions can be fetched** via existing `get-test-questions.js`
- **Drawing and Speaking** already have modals - reuse them
- **PerfectModal** component already exists and is used throughout codebase

## Success Criteria

✅ Teacher clicks on green/yellow score (>= 50%) → Answers modal opens
✅ Teacher clicks on red score (< 50%) → Retest modal opens (current behavior)
✅ Answers display correctly for all 8 test types
✅ Correct/incorrect status clearly visible
✅ Modal is responsive and user-friendly
✅ Questions load correctly from API
✅ Edge cases handled gracefully

