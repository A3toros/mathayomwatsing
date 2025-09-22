# Word Matching Test Implementation Plan

## 🎉 IMPLEMENTATION STATUS: 100% COMPLETED ✅

**All phases completed successfully!** The word matching test is fully implemented and ready for production use.

### ✅ COMPLETED COMPONENTS:
- **Database Schema**: 3 tables with proper indexes
- **Backend Functions**: 20 functions updated with word_matching support
- **Frontend Components**: 29 existing + 3 new components
- **React Components**: WordMatchingCreator, WordMatchingStudent, WordMatchingPage
- **Integration**: Full integration with existing system
- **Styling**: Tailwind CSS (no custom CSS files)
- **Loading States**: All buttons have proper loading animations
- **Caching**: Complete caching implementation with TTL management
- **Testing**: Complete test creation and submission flow

---

## Overview
Implement a new test type "word_matching" where teachers can choose between two interaction modes:
1. **Drag Mode**: Students drag word containers from a left list to matching word containers on the right list
2. **Arrow Mode**: Students draw arrows connecting words from the left list to matching words on the right list

Both modes use Konva.js for interaction and provide the same scoring mechanism.

## Database Schema ✅ COMPLETED

### 1. Main Test Table ✅ COMPLETED
```sql
CREATE TABLE word_matching_tests (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    test_name VARCHAR(200) NOT NULL,
    num_questions INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL DEFAULT 'drag', -- 'drag' or 'arrow'
    passing_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Word Matching Questions Table ✅ COMPLETED
```sql
CREATE TABLE word_matching_questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    question_id INTEGER NOT NULL,
    left_word TEXT NOT NULL,
    right_word TEXT NOT NULL
);
```

### 3. Results Table ✅ COMPLETED
```sql
CREATE TABLE word_matching_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES word_matching_tests(id),
    test_name VARCHAR(200) NOT NULL,
    teacher_id VARCHAR(50) REFERENCES teachers(teacher_id),
    subject_id INTEGER REFERENCES subjects(subject_id),
    grade INTEGER NOT NULL,
    class INTEGER NOT NULL,
    number INTEGER NOT NULL,
    student_id VARCHAR(10) REFERENCES users(student_id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score::DECIMAL / max_score::DECIMAL) * 100, 2)) STORED,
    answers JSONB NOT NULL,
    time_taken INTEGER,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    caught_cheating BOOLEAN DEFAULT false,
    visibility_change_times INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_period_id INTEGER REFERENCES academic_year(id)
);
```

## Interaction Type Implementation ✅ COMPLETED

### Teacher Creator Choice ✅ COMPLETED
```javascript
// Teacher selects interaction type during test creation
const [interactionType, setInteractionType] = useState('drag');

// Interaction type selection UI
<div className="interaction-type-selection mb-6">
  <h3 className="text-lg font-semibold mb-4">Choose Interaction Type</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div 
      className={`interaction-option p-4 border-2 rounded-lg cursor-pointer transition-all ${
        interactionType === 'drag' 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setInteractionType('drag')}
    >
      <div className="flex items-center mb-2">
        <input 
          type="radio" 
          checked={interactionType === 'drag'} 
          onChange={() => setInteractionType('drag')}
          className="mr-3"
        />
        <h4 className="font-medium">Drag & Drop</h4>
      </div>
      <p className="text-sm text-gray-600">
        Students drag words from left list to right list
      </p>
      <div className="mt-2 text-xs text-gray-500">
        • Easier for younger students<br/>
        • Visual feedback on placement<br/>
        • Mobile-friendly
      </div>
    </div>
    
    <div 
      className={`interaction-option p-4 border-2 rounded-lg cursor-pointer transition-all ${
        interactionType === 'arrow' 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setInteractionType('arrow')}
    >
      <div className="flex items-center mb-2">
        <input 
          type="radio" 
          checked={interactionType === 'arrow'} 
          onChange={() => setInteractionType('arrow')}
          className="mr-3"
        />
        <h4 className="font-medium">Draw Arrows</h4>
      </div>
      <p className="text-sm text-gray-600">
        Students draw arrows connecting matching words
      </p>
      <div className="mt-2 text-xs text-gray-500">
        • More challenging<br/>
        • Better for visual learners<br/>
        • Requires precision
      </div>
    </div>
  </div>
</div>
```

### Student Rendering Based on Type ✅ COMPLETED

#### Drag Mode Rendering ✅ COMPLETED
```javascript
// Drag mode: Two columns with draggable words
const renderDragMode = () => (
  <div className="word-matching-container flex gap-8">
    {/* Left Words - Draggable */}
    <div className="left-words flex-1">
      <h3 className="text-lg font-semibold mb-4">Words to Match</h3>
      <div className="space-y-3">
        {displayData.leftWords.map((word, index) => (
          <DraggableWord 
            key={index}
            word={word}
            index={index}
            onDragEnd={handleLeftWordDrag}
            isPlaced={placedWords[index] !== undefined}
          />
        ))}
      </div>
    </div>
    
    {/* Right Words - Drop Targets */}
    <div className="right-words flex-1">
      <h3 className="text-lg font-semibold mb-4">Match To</h3>
      <div className="space-y-3">
        {displayData.rightWords.map((word, index) => (
          <DroppableWord 
            key={index}
            word={word}
            index={index}
            onDrop={handleRightWordDrop}
            placedWord={placedWords[index]}
          />
        ))}
      </div>
    </div>
  </div>
);
```

#### Arrow Mode Rendering ✅ COMPLETED
```javascript
// Arrow mode: Words with arrow drawing canvas
const renderArrowMode = () => (
  <div className="word-matching-container">
    {/* Words Display */}
    <div className="words-display grid grid-cols-2 gap-8 mb-6">
      <div className="left-words">
        <h3 className="text-lg font-semibold mb-4">Words to Match</h3>
        <div className="space-y-3">
          {displayData.leftWords.map((word, index) => (
            <WordContainer 
              key={index}
              word={word}
              index={index}
              side="left"
              onWordClick={handleWordClick}
              isSelected={selectedWord?.side === 'left' && selectedWord?.index === index}
            />
          ))}
        </div>
      </div>
      
      <div className="right-words">
        <h3 className="text-lg font-semibold mb-4">Match To</h3>
        <div className="space-y-3">
          {displayData.rightWords.map((word, index) => (
            <WordContainer 
              key={index}
              word={word}
              index={index}
              side="right"
              onWordClick={handleWordClick}
              isSelected={selectedWord?.side === 'right' && selectedWord?.index === index}
            />
          ))}
        </div>
      </div>
    </div>
    
    {/* Arrow Drawing Canvas */}
    <div className="arrow-canvas-container">
      <KonvaCanvas
        width={800}
        height={400}
        onArrowDraw={handleArrowDraw}
        existingArrows={studentArrows}
        onArrowDelete={handleArrowDelete}
      />
    </div>
  </div>
);
```

### Arrow Drawing Implementation ✅ COMPLETED
```javascript
// Arrow drawing logic using Konva
const handleArrowDraw = useCallback((startPos, endPos) => {
  if (!selectedWord) return;
  
  const arrow = {
    id: Date.now().toString(),
    startWord: selectedWord,
    endWord: { side: selectedWord.side === 'left' ? 'right' : 'left', index: getWordIndexFromPosition(endPos) },
    startPos,
    endPos,
    color: '#3B82F6'
  };
  
  setStudentArrows(prev => [...prev, arrow]);
  setSelectedWord(null);
}, [selectedWord]);

// Arrow scoring logic
const calculateArrowScore = useCallback(() => {
  let correctArrows = 0;
  
  studentArrows.forEach(arrow => {
    const leftIndex = arrow.startWord.side === 'left' ? arrow.startWord.index : arrow.endWord.index;
    const rightIndex = arrow.startWord.side === 'right' ? arrow.startWord.index : arrow.endWord.index;
    
    if (displayData.correctPairs[leftIndex] === rightIndex) {
      correctArrows++;
    }
  });
  
  return { correct: correctArrows, total: displayData.leftWords.length };
}, [studentArrows, displayData.correctPairs]);
```

## Rendering and Randomization Logic ✅ COMPLETED

### Data Structure for Display
```javascript
// Original data from database (maintains correct pairs)
const originalData = [
  { question_id: 1, left_word: 'Apple', right_word: 'Red' },
  { question_id: 2, left_word: 'Banana', right_word: 'Yellow' },
  { question_id: 3, left_word: 'Cherry', right_word: 'Red' }
];

// Processed data for display (randomized order)
const displayData = {
  leftWords: ['Cherry', 'Apple', 'Banana'], // Randomized
  rightWords: ['Red', 'Yellow', 'Red'],     // Randomized
  correctPairs: { 0: 0, 1: 1, 2: 2 },      // Maps display indices to correct pairs
  originalPairs: { 0: 2, 1: 0, 2: 1 }      // Maps original question_id to display indices
};
```

### Randomization Logic
```javascript
const randomizeWordPairs = (originalData) => {
  // Create arrays for left and right words
  const leftWords = originalData.map(item => item.left_word);
  const rightWords = originalData.map(item => item.right_word);
  
  // Shuffle both arrays independently
  const shuffledLeft = [...leftWords].sort(() => Math.random() - 0.5);
  const shuffledRight = [...rightWords].sort(() => Math.random() - 0.5);
  
  // Create mapping from display indices to correct pairs
  const correctPairs = {};
  const originalPairs = {};
  
  originalData.forEach((item, originalIndex) => {
    const leftDisplayIndex = shuffledLeft.indexOf(item.left_word);
    const rightDisplayIndex = shuffledRight.indexOf(item.right_word);
    
    correctPairs[leftDisplayIndex] = rightDisplayIndex;
    originalPairs[originalIndex] = { left: leftDisplayIndex, right: rightDisplayIndex };
  });
  
  return {
    leftWords: shuffledLeft,
    rightWords: shuffledRight,
    correctPairs,
    originalPairs
  };
};
```

### Display Logic
```javascript
// Render left words (draggable)
const leftWords = displayData.leftWords.map((word, index) => (
  <DraggableWord 
    key={index}
    word={word}
    index={index}
    onDragEnd={handleLeftWordDrag}
  />
));

// Render right words (drop targets)
const rightWords = displayData.rightWords.map((word, index) => (
  <DroppableWord 
    key={index}
    word={word}
    index={index}
    onDrop={handleRightWordDrop}
  />
));
```

### Key Benefits of This Approach:

1. **Randomized Display**: Both left and right word lists are shuffled independently, making it harder for students to guess patterns.

2. **Maintained Correct Pairs**: The `correctPairs` mapping ensures we know which display positions should match, regardless of randomization.

3. **Flexible Matching**: Students can match any left word with any right word, giving them freedom to explore.

4. **Accurate Scoring**: We score based on display positions, not original database positions, ensuring correct evaluation.

5. **Consistent Experience**: Each time a student takes the test, the word order will be different, preventing memorization of positions.

6. **Database Integrity**: Original data structure remains unchanged, maintaining referential integrity.

## Loading States Implementation (CRITICAL) ✅ COMPLETED

### Loading State Variables
```javascript
// Teacher Creator Loading States
const [isLoading, setIsLoading] = useState(false);
const [isSavingTest, setIsSavingTest] = useState(false);
const [isUploadingExcel, setIsUploadingExcel] = useState(false);
const [isAssigningTest, setIsAssigningTest] = useState(false);

// Student Test Loading States
const [isSubmitting, setIsSubmitting] = useState(false);
const [isLoadingTest, setIsLoadingTest] = useState(false);
```

### Teacher Creator Loading States

#### 1. Save Test Button
```javascript
<Button
  onClick={saveWordMatchingTest}
  disabled={isSavingTest}
  className="px-8"
>
  {isSavingTest ? (
    <>
      <LoadingSpinner size="sm" color="white" className="mr-2" />
      Saving Test...
    </>
  ) : (
    'Save Test'
  )}
</Button>
```

#### 2. Assign Test Button
```javascript
<Button
  onClick={() => assignTestToClasses('word_matching', testId)}
  disabled={isAssigningTest}
  className="px-8"
>
  {isAssigningTest ? (
    <>
      <LoadingSpinner size="sm" color="white" className="mr-2" />
      Assigning Test...
    </>
  ) : (
    'Assign Test'
  )}
</Button>
```

#### 3. Excel Upload Button (if implemented)
```javascript
<button
  type="button"
  className="excel-upload-btn px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isUploadingExcel}
>
  {isUploadingExcel ? (
    <>
      <LoadingSpinner size="sm" color="white" />
      <span className="font-medium">Processing...</span>
    </>
  ) : (
    <>
      <img src="/pics/excel.png" alt="Excel" className="w-6 h-6 object-contain" />
      <span className="font-medium">Upload Excel</span>
    </>
  )}
</button>
```

### Student Test Loading States

#### 1. Submit Test Button
```javascript
<Button
  onClick={handleSubmitTest}
  disabled={isSubmitting || testProgress < 100}
>
  {isSubmitting ? 'Submitting...' : 'Submit Test'}
</Button>
```

#### 2. Test Loading State
```javascript
if (isLoadingTest) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

#### 3. Word Matching Test Loading
```javascript
// During test initialization
const [isInitializing, setIsInitializing] = useState(false);

if (isInitializing) {
  return (
    <Card className="p-8 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">Loading word matching test...</p>
    </Card>
  );
}
```

### Loading State Management

#### 1. Save Test Function
```javascript
const saveWordMatchingTest = useCallback(async () => {
  setIsSavingTest(true);
  
  try {
    // ... save logic
    showNotification('Word matching test saved successfully!', 'success');
  } catch (error) {
    showNotification('Failed to save test: ' + error.message, 'error');
  } finally {
    setIsSavingTest(false);
  }
}, []);
```

#### 2. Submit Test Function
```javascript
const handleSubmitTest = useCallback(async () => {
  setIsSubmitting(true);
  
  try {
    // ... submission logic
    showNotification('Test submitted successfully!', 'success');
  } catch (error) {
    showNotification('Failed to submit test: ' + error.message, 'error');
  } finally {
    setIsSubmitting(false);
  }
}, []);
```

#### 3. Test Loading Function
```javascript
const loadWordMatchingTest = useCallback(async () => {
  setIsLoadingTest(true);
  
  try {
    // ... loading logic
  } catch (error) {
    showNotification('Failed to load test: ' + error.message, 'error');
  } finally {
    setIsLoadingTest(false);
  }
}, []);
```

## Class Assignment Integration (CRITICAL) ✅ COMPLETED

### Teacher Creator UI
The word matching test creator must include the standard class assignment interface:

```javascript
// Class assignment section (reuse existing component)
<div className="class-assignment-section">
  <h3 className="text-lg font-semibold mb-4">Assign to Classes</h3>
  <ClassAssignmentSelector
    selectedClasses={selectedClasses}
    onClassesChange={setSelectedClasses}
    user={user}
  />
</div>
```

### Assignment Data Structure
```javascript
// Standard assignment format (same as other tests)
const assignments = selectedClasses.map(classInfo => ({
  grade: classInfo.grade,
  class: classInfo.class,
  subject_id: formData.subjectId,
  academic_period_id: formData.academicPeriodId,
  due_date: formData.dueDate || null
}));
```

### Test Creation Flow
1. **Teacher Creates Test**: Uses word matching creator interface
2. **Selects Classes**: Uses standard class assignment selector
3. **Submits Test**: Calls `save-test-with-assignments.js`
4. **Backend Creates**: Test record + questions + assignments
5. **Students See Test**: In their active tests list
6. **Students Take Test**: Standard test-taking flow

## Scoring Logic ✅ COMPLETED

### How Students Answer:
```javascript
// Student drags left word to right word position
// Student answers stored as: { leftDisplayIndex: rightDisplayIndex }
const studentAnswers = {
  0: 2, // Student dragged left[0] "Cherry" to right[2] "Red" ✓
  1: 0, // Student dragged left[1] "Apple" to right[0] "Red" ✗
  2: 1  // Student dragged left[2] "Banana" to right[1] "Yellow" ✓
};
```

### How We Score (Copied from Matching Test):
```javascript
// Correct answers based on display indices (from randomization)
const correctAnswers = {
  0: 0, // Cherry should match Red (display position 0)
  1: 1, // Apple should match Red (display position 1)  
  2: 2  // Banana should match Yellow (display position 2)
};

// Scoring function (adapted from matching test)
const calculateScore = (studentAnswers, correctAnswers, totalPairs) => {
  let correctPlacements = 0;
  
  // Check each left word to see if it's matched to the correct right word
  console.log('🔍 Scoring check - studentAnswers:', studentAnswers);
  console.log('🔍 Scoring check - correctAnswers:', correctAnswers);
  
  Object.entries(studentAnswers).forEach(([leftDisplayIndex, rightDisplayIndex]) => {
    const expectedRightIndex = correctAnswers[leftDisplayIndex];
    console.log(`🔍 Left word ${leftDisplayIndex} matched to right ${rightDisplayIndex}, expected ${expectedRightIndex}`);
    
    if (rightDisplayIndex === expectedRightIndex) {
      correctPlacements++;
      console.log(`✅ Correct! Left ${leftDisplayIndex} correctly matched to right ${rightDisplayIndex}`);
    } else {
      console.log(`❌ Incorrect! Left ${leftDisplayIndex} matched to right ${rightDisplayIndex} but expected ${expectedRightIndex}`);
    }
  });
  
  const score = correctPlacements;
  const maxScore = totalPairs;
  
  console.log(`🎯 Final Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
  
  return { score, maxScore, percentage: Math.round((score/maxScore)*100) };
};

// Example scoring
const result = calculateScore(studentAnswers, correctAnswers, 3);
// result = { score: 2, maxScore: 3, percentage: 67 } // 2 out of 3 correct
```

### Submission Data Structure (Copied from Matching Test):
```javascript
const submissionData = {
  test_id: testData.id,
  test_name: testData.test_name,
  teacher_id: testData.teacher_id || null,
  subject_id: testData.subject_id || null,
  student_id: user.student_id,
  answers: studentAnswers, // { leftDisplayIndex: rightDisplayIndex }
  score: score,
  maxScore: maxScore,
  time_taken: timeTaken, // in seconds
  started_at: startedAt,
  submitted_at: endTime.toISOString(),
  // Add anti-cheating data
  caught_cheating: cheatingData.caught_cheating,
  visibility_change_times: cheatingData.visibility_change_times
};
```

### Complete Scoring Implementation (Supports Both Interaction Types):
```javascript
const handleSubmitTest = useCallback(async () => {
  if (!displayData) return;
  
  setIsSubmitting(true);
  
  try {
    // Calculate score based on interaction type
    const totalPairs = displayData.leftWords.length;
    let correctMatches = 0;
    let studentAnswers = {};
    
    if (testData.interaction_type === 'drag') {
      // Drag mode scoring
      Object.entries(placedWords).forEach(([leftDisplayIndex, rightDisplayIndex]) => {
        const expectedRightIndex = displayData.correctPairs[leftDisplayIndex];
        if (rightDisplayIndex === expectedRightIndex) {
          correctMatches++;
        }
        studentAnswers[leftDisplayIndex] = rightDisplayIndex;
      });
    } else {
      // Arrow mode scoring
      studentArrows.forEach(arrow => {
        const leftIndex = arrow.startWord.side === 'left' ? arrow.startWord.index : arrow.endWord.index;
        const rightIndex = arrow.startWord.side === 'right' ? arrow.startWord.index : arrow.endWord.index;
        
        if (displayData.correctPairs[leftIndex] === rightIndex) {
          correctMatches++;
        }
        studentAnswers[leftIndex] = rightIndex;
      });
    }
    
    const score = correctMatches;
    const maxScore = totalPairs;
    
    console.log(`🎯 Final Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
    
    // Calculate timing
    const endTime = new Date();
    const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0;
    const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
    
    // Get anti-cheating data
    const cheatingData = getCheatingData();
    
    // Prepare submission data
    const submissionData = {
      test_id: testData.id,
      test_name: testData.test_name,
      teacher_id: testData.teacher_id || null,
      subject_id: testData.subject_id || null,
      student_id: user.student_id,
      interaction_type: testData.interaction_type,
      answers: studentAnswers,
      score: score,
      maxScore: maxScore,
      time_taken: timeTaken,
      started_at: startedAt,
      submitted_at: endTime.toISOString(),
      caught_cheating: cheatingData.caught_cheating,
      visibility_change_times: cheatingData.visibility_change_times
    };
    
    // Submit test results
    const response = await makeAuthenticatedRequest('/.netlify/functions/submit-word-matching-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Test submitted successfully!', 'success');
      
      // Clear data and cache
      stopTracking();
      clearData();
      
      if (user?.student_id) {
        const { clearTestData } = await import('@/utils/cacheUtils');
        clearTestData(user.student_id, 'word_matching', testData.id);
        
        const completionKey = `test_completed_${user.student_id}_word_matching_${testData.id}`;
        localStorage.setItem(completionKey, 'true');
        
        const { setCachedData, CACHE_TTL } = await import('@/utils/cacheUtils');
        const cacheKey = `student_results_table_${user.student_id}`;
        setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
      }
      
      setTimeout(() => {
        window.location.href = '/student';
      }, 2000);
    } else {
      showNotification('Failed to submit test. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error submitting test:', error);
    showNotification('Failed to submit test. Please try again.', 'error');
  } finally {
    setIsSubmitting(false);
  }
}, [displayData, placedWords, studentArrows, testData, user, testStartTime, getCheatingData, stopTracking, clearData, showNotification]);
```

### Database Storage:
```sql
-- Store student answers as JSONB
INSERT INTO word_matching_test_results (
  test_id, test_name, teacher_id, subject_id, grade, class, number,
  student_id, name, surname, nickname, score, max_score, answers,
  time_taken, started_at, submitted_at, caught_cheating, 
  visibility_change_times, is_completed, academic_period_id
) VALUES (
  ${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, 
  ${grade}, ${class}, ${number}, ${student_id}, ${name}, ${surname}, ${nickname},
  ${score}, ${max_score}, 
  '{"0": 2, "1": 0, "2": 1}'::jsonb, -- Student answers as JSON
  ${time_taken}, ${started_at}, ${submitted_at}, ${caught_cheating},
  ${visibility_change_times}, ${is_completed}, ${academic_period_id}
);
```

## Caching Implementation (Copied from Matching Test) ✅ COMPLETED

### Cache Utilities Import
```javascript
import { clearTestData } from '@/utils/cacheUtils';
```

### Cache TTL Configuration ✅ COMPLETED
```javascript
// In cacheUtils.js - already exists
const CACHE_TTL = {
  student_results_table: 10 * 60 * 1000, // 10 minutes TTL
  test_progress: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
  anti_cheating: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
  word_matching_test: 10 * 60 * 1000,   // 10 minutes TTL
};
```

### Cache Operations ✅ COMPLETED

#### 1. Clear Test Data After Submission ✅ COMPLETED
```javascript
// Clear test progress and anti-cheating data after submission
if (user?.student_id) {
  clearTestData(user.student_id, 'word_matching', testData.id);
  console.log('🎓 Test data cleared from cache');
}
```

#### 2. Cache Test Results After Submission ✅ COMPLETED
```javascript
// Cache the test results immediately after successful submission
if (user?.student_id) {
  const cacheKey = `student_results_table_${user.student_id}`;
  const existingResults = getCachedData(cacheKey) || [];
  const newResultEntry = {
    test_id: testData.id,
    test_type: 'word_matching',
    test_name: testData.test_name,
    score: score,
    max_score: maxScore,
    percentage: Math.round((score / maxScore) * 100),
    submitted_at: endTime.toISOString(),
    is_completed: true,
    teacher_name: testData.teacher_name || 'N/A',
    subject: testData.subject || 'N/A',
    academic_period_id: null,
  };
  
  // Remove old result for this test if it exists, then add new one
  const updatedResults = existingResults.filter(r => !(r.test_id === testData.id && r.test_type === 'word_matching'));
  updatedResults.push(newResultEntry);
  setCachedData(cacheKey, updatedResults, CACHE_TTL.student_results_table);
  console.log('🎓 Test results cached with key:', cacheKey);
}
```

#### 3. Cache Test Questions During Load ✅ COMPLETED
```javascript
// In WordMatchingPage.jsx
const cacheKey = `word_matching_test_${testId}`;
const cachedData = getCachedData(cacheKey);

if (cachedData) {
  console.log('🎯 Word matching test loaded from cache:', cachedData);
  setTestData(cachedData);
  setIsLoading(false);
  return;
}

// After successful API call
setCachedData(cacheKey, result.data, CACHE_TTL.word_matching_test);
console.log('🎯 Word matching test loaded from API and cached:', result.data);
```

#### 4. Auto-Save Test Progress ✅ COMPLETED
```javascript
// Auto-save progress every 30 seconds
useEffect(() => {
  if (displayData && testStartTime && user?.student_id) {
    const interval = setInterval(() => {
      const progressData = {
        answers: studentAnswers,
        arrows: studentArrows,
        startTime: testStartTime.toISOString()
      };
      const progressKey = `test_progress_${user.student_id}_word_matching_${testData.id}`;
      setCachedData(progressKey, progressData, CACHE_TTL.test_progress);
      console.log('🎯 Progress auto-saved');
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }
}, [displayData, studentAnswers, studentArrows, testStartTime, user?.student_id, testData?.id]);
```

### Cache Keys Used ✅ COMPLETED
- `test_progress_${userId}_word_matching_${testId}` - Test progress during taking (2 min TTL)
- `anti_cheating_${userId}_word_matching_${testId}` - Anti-cheating data during test (2 min TTL)
- `student_results_table_${userId}` - Student results table (shared with other tests) (10 min TTL)
- `word_matching_test_${testId}` - Test questions data (10 min TTL)
- `test_completed_${userId}_word_matching_${testId}` - Test completion status (localStorage)

### Cache Cleanup Strategy ✅ COMPLETED
1. **After Submission**: ✅ Clear test progress and anti-cheating data using `clearTestData()`
2. **Immediate Caching**: ✅ Cache results for instant display in `student_results_table`
3. **TTL Management**: ✅ Automatic expiration based on cache type (2-10 minutes)
4. **Storage Cleanup**: ✅ Automatic cleanup of old/expired data via TTL
5. **Progress Restoration**: ✅ Restore test progress on page reload
6. **Auto-Save**: ✅ Save progress every 30 seconds during test taking

## Standard Test Creation Procedure (CRITICAL) ✅ COMPLETED

### Test Creation Flow
1. **Create Test Record**: Insert into `word_matching_tests` table
2. **Create Questions**: Insert word pairs into `word_matching_questions` table
3. **Assign to Classes**: Insert assignments into `test_assignments` table
4. **Return Success**: Return test ID and assignment details

### Class Assignment Structure
```javascript
// Standard assignment data structure
const assignments = [
  {
    grade: 1,
    class: 15,
    subject_id: 1,
    academic_period_id: 1,
    due_date: '2025-02-01T23:59:59Z'
  },
  {
    grade: 1,
    class: 16,
    subject_id: 1,
    academic_period_id: 1,
    due_date: '2025-02-01T23:59:59Z'
  }
];
```

### Test Assignment Table
```sql
-- test_assignments table (already exists)
INSERT INTO test_assignments (
  test_type, test_id, teacher_id, grade, class, 
  subject_id, academic_period_id, due_date, is_active
) VALUES (
  'word_matching', ${testId}, ${teacherId}, ${grade}, ${class},
  ${subjectId}, ${academicPeriodId}, ${dueDate}, true
);
```

## Backend Functions (Copy & Modify) ✅ COMPLETED

### 1. Submit Function ✅ COMPLETED
**File**: `functions/submit-word-matching-test.js`
- Copy from `submit-matching-type-test.js`
- Modify table names: `word_matching_test_results`
- Keep same scoring logic and result structure

### 2. Get Questions Function ✅ COMPLETED
**File**: `functions/get-word-matching-test.js`
- Copy from `get-matching-type-test.js`
- Query `word_matching_questions` table
- Structure: `{ leftWords: [], rightWords: [], correctPairs: {} }`

### 3. Save Test Function ✅ COMPLETED
**File**: `functions/save-test-with-assignments.js`
- Add `word_matching` case to existing switch statement
- Use same pattern as `matching_type` case
- **CRITICAL**: Must include class assignments in test creation
- Follow standard procedure: create test → assign to classes → save assignments

### 4. Test Management Integration

#### Constants File
**File**: `src/utils/constants.js`
- Add `WORD_MATCHING` to `TEST_TYPES` array
- Add `word_matching` to test type validation

#### Test Type Selector
**File**: `src/components/test/TestTypeSelector.jsx`
- Add new option for 'Word Matching' in the dropdown
- **Display Name**: "Word matching"
- **Icon**: `/pics/matching-words.png`
- **Description**: "Students match word pairs by dragging words from left list to right list"

#### Implementation Details:
```javascript
case 'word_matching':
  // 1. Create test record
  const testResult = await pool.query(`
    INSERT INTO word_matching_tests (teacher_id, subject_id, test_name, num_questions, passing_score)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [teacherId, subjectId, testName, numQuestions, passingScore]);
  
  const testId = testResult.rows[0].id;
  
  // 2. Insert word pairs as questions
  for (const question of questions) {
    await pool.query(`
      INSERT INTO word_matching_questions (test_id, teacher_id, subject_id, question_id, left_word, right_word)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testId, teacherId, subjectId, question.question_id, question.left_word, question.right_word]);
  }
  
  // 3. Assign to classes (CRITICAL STEP)
  for (const assignment of assignments) {
    await pool.query(`
      INSERT INTO test_assignments (test_type, test_id, teacher_id, grade, class, subject_id, academic_period_id, due_date, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, ['word_matching', testId, teacherId, assignment.grade, assignment.class, 
        assignment.subject_id, assignment.academic_period_id, assignment.due_date, true]);
  }
  
  return { success: true, testId, assignments: assignments.length };
```

## API Functions Requiring Word Matching Support ✅ COMPLETED

### Core Test Functions ✅ COMPLETED
1. **`functions/save-test-with-assignments.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Create `word_matching_tests` record
   - Insert word pairs into `word_matching_questions` table

2. **`functions/get-test-questions.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Query `word_matching_questions` table
   - Return structured word pairs data

3. **`functions/submit-word-matching-test.js`** ✅ COMPLETED (NEW)
   - Copy from `submit-matching-type-test.js`
   - Insert into `word_matching_test_results` table

4. **`functions/get-word-matching-test.js`** ✅ COMPLETED (NEW)
   - Copy from `get-matching-type-test.js`
   - Query `word_matching_questions` table
   - Return structured word pairs data with randomization

### Test Management Functions ✅ COMPLETED
4. **`functions/get-all-tests.js`** ✅ COMPLETED
   - Add word matching tests query
   - Include in test breakdown statistics
   - Add to combined results array

5. **`functions/delete-test.js`** ✅ COMPLETED
   - Add `word_matching` case to all switch statements
   - Delete from `word_matching_tests`, `word_matching_questions`, `word_matching_test_results`
   - Handle test ownership verification

6. **`functions/delete-test-assignments.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Delete assignments for word matching tests

7. **`functions/delete-test-data.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Delete all word matching test data

### Assignment Functions ✅ COMPLETED
8. **`functions/assign-test.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Verify test exists in `word_matching_tests` table

9. **`functions/assign-test-to-classes.js`** ✅ COMPLETED
   - Add `word_matching` case to switch statement
   - Verify test exists in `word_matching_tests` table

10. **`functions/remove-assignment.js`** ✅ COMPLETED
    - Add `word_matching` case to switch statement
    - Verify test ownership for word matching tests

### Student Functions ✅ COMPLETED
11. **`functions/get-student-active-tests.js`** ✅ COMPLETED
    - Add `word_matching` case to test loading logic
    - Query `word_matching_tests` table
    - Include in test type breakdown

12. **`functions/get-student-test-results.js`** ✅ COMPLETED
    - Add `word_matching` case to results query
    - Query `word_matching_test_results` table
    - Include in combined results

13. **`functions/check-test-completion.js`** ✅ COMPLETED
    - Add `word_matching` case to completion check
    - Query `word_matching_test_results` table

### Teacher Functions ✅ COMPLETED
14. **`functions/get-teacher-active-tests.js`** ✅ COMPLETED
    - Add `word_matching` case to test loading logic
    - Query `word_matching_tests` table
    - Include in test type breakdown

15. **`functions/get-teacher-student-results.js`** ✅ COMPLETED
    - Add `word_matching` case to results query
    - Query `word_matching_test_results` table
    - Include in combined results

16. **`functions/get-test-assignments.js`** ✅ COMPLETED
    - Add `word_matching` case to assignment queries
    - Include word matching tests in assignment data

### Results Functions ✅ COMPLETED
17. **`functions/get-test-results.js`** ✅ COMPLETED
    - Add `word_matching` case to results query
    - Query `word_matching_test_results` table

18. **`functions/submit-test-results.js`** ✅ COMPLETED
    - Add `word_matching` case to results submission
    - Insert into `word_matching_test_results` table

### Test Table Functions ✅ COMPLETED
19. **`functions/test-input-test-table.js`** ✅ COMPLETED
    - Add word matching test table verification
    - Check `word_matching_tests` and `word_matching_questions` tables

20. **`functions/test-true-false-table.js`** ✅ COMPLETED
    - Add word matching test table verification
    - Check `word_matching_test_results` table

### Additional Functions Found (No Changes Needed)
21. **`functions/mark-test-completed.js`** ❌ NO CHANGES NEEDED
    - Only updates `test_assignments` table by `test_type` and `test_id`
    - No specific test type logic - works generically

22. **`functions/get-student-results-view.js`** ❌ NO CHANGES NEEDED
    - Uses database view `student_results_view`
    - No test type specific logic

23. **`functions/get-class-summary.js`** ❌ NO CHANGES NEEDED
    - No test type specific logic

24. **`functions/get-teacher-assignments.js`** ❌ NO CHANGES NEEDED
    - No test type specific logic

25. **`functions/get-teacher-grades-classes.js`** ❌ NO CHANGES NEEDED
    - No test type specific logic

26. **`functions/get-teacher-subjects.js`** ❌ NO CHANGES NEEDED
    - No test type specific logic

## Summary ✅ 100% COMPLETED

### Backend Functions ✅ COMPLETED
- **20 Functions** ✅ COMPLETED - word matching support added
- **6 Functions** ✅ COMPLETED - don't need changes (generic or no test type logic)
- **Total Backend Functions Scanned**: 26

### Frontend Components ✅ COMPLETED
- **29 Components** ✅ COMPLETED - word matching support added
- **3 New Components** ✅ COMPLETED - created
- **Total Frontend Components Scanned**: 32

### Complete System Impact ✅ COMPLETED
- **Backend**: ✅ COMPLETED - 20 functions updated
- **Frontend**: ✅ COMPLETED - 29 existing components + 3 new components = 32 total
- **Database**: ✅ COMPLETED - 3 new tables created
- **Total Files Affected**: ✅ COMPLETED - 55+ files

## Frontend Service Layer ✅ COMPLETED

### 1. Test Service Extensions ✅ COMPLETED
**File**: `src/services/testService.js`
```javascript
// Add to existing testService object
async saveWordMatchingTest(testData) {
  // Copy from saveMatchingTest, modify for word pairs
  // Use test_type: 'word_matching'
},

async getWordMatchingTest(testId) {
  // Copy from getMatchingTypeTest, modify for word pairs
},

async submitWordMatchingTest(testId, answers, timeTaken, antiCheatingData) {
  // Copy from submitMatchingTypeTest, modify for word pairs
}
```

## Frontend Components Requiring Word Matching Support ✅ COMPLETED

### Core Test Components ✅ COMPLETED
1. **`src/shared/shared-index.jsx`** ✅ COMPLETED
   - Add `WORD_MATCHING: 'word_matching'` to `TEST_TYPES` object
   - Export `WordMatchingCreator` and `WordMatchingStudent` components

2. **`src/services/testService.js`** ✅ COMPLETED
   - Add `saveWordMatchingTest()`, `getWordMatchingTest()`, `submitWordMatchingTest()` functions
   - Follow same pattern as existing matching test functions

3. **`src/contexts/TestContext.jsx`** ✅ COMPLETED
   - Add `word_matching` case to `submitTest` function
   - Add `word_matching` case to `loadTestResults` function
   - Handle word matching test submission and results

### Student Components ✅ COMPLETED
4. **`src/student/StudentCabinet.jsx`** ✅ COMPLETED
   - Add `word_matching` case to `startTest` function
   - Add special handling for word matching test navigation
   - Update test completion checking logic

5. **`src/student/StudentTests.jsx`** ✅ COMPLETED
   - Add `word_matching` case to `startTest` function
   - Add `word_matching` case to `renderQuestion` function
   - Add `word_matching` case to scoring functions
   - Add `word_matching` case to answer formatting functions

6. **`src/student/StudentResults.jsx`** ✅ COMPLETED
   - Add `word_matching` case to results display logic
   - Handle word matching test results formatting

7. **`src/student/WordMatchingPage.jsx`** ✅ COMPLETED (NEW)
   - Copy existing file to `WordMatchingPage.jsx`
   - Modify to use `WordMatchingStudent` component
   - Update routing and completion logic

8. **`src/student/student-index.jsx`** ✅ COMPLETED
   - Add route for word matching tests: `/student/word-matching-test/:testId`
   - Add `WordMatchingPage` component import

### Teacher Components ✅ COMPLETED
9. **`src/teacher/TeacherTests.jsx`** ✅ COMPLETED
   - Add `word_matching` to `TEST_TYPE_MAP` object
   - Add `word_matching` to `testTypes` array
   - Add `WordMatchingCreator` component integration
   - Add word matching test creation logic

10. **`src/teacher/TeacherCabinet.jsx`** ✅ COMPLETED
    - Add `word_matching` case to test loading logic
    - Handle word matching test display in active tests

11. **`src/teacher/TeacherResults.jsx`** ✅ COMPLETED
    - Add `word_matching` case to results display logic
    - Handle word matching test results in class results

### Admin Components ✅ COMPLETED
12. **`src/admin/AdminCabinet.jsx`** ✅ COMPLETED
    - Add `word_matching` case to test management logic
    - Handle word matching test deletion and management

13. **`src/admin/AdminPanel.jsx`** ✅ COMPLETED
    - Add `word_matching` case to test statistics
    - Include word matching tests in admin dashboard

### Form Components ✅ COMPLETED
14. **`src/components/forms/TestForm.jsx`** ✅ COMPLETED
    - Add `word_matching` to test type selection
    - Add `WordMatchingCreator` component integration
    - Handle word matching test form rendering

15. **`src/components/forms/QuestionForm.jsx`** ✅ COMPLETED
    - Add `word_matching` case to form handling logic
    - Handle word matching test question creation

### Test Components ✅ COMPLETED
16. **`src/components/test/TestResults.jsx`** ✅ COMPLETED
    - Add `word_matching` case to results display logic
    - Handle word matching test results formatting

17. **`src/components/test/TestResultsDisplay.jsx`** ✅ COMPLETED
    - Add `word_matching` case to results display logic
    - Handle word matching test results formatting

18. **`src/components/test/TestDetailsModal.jsx`** ✅ COMPLETED
    - Add `word_matching` case to test details display
    - Handle word matching test information display

### Utility Components ✅ COMPLETED
19. **`src/utils/scoreCalculation.js`** ✅ COMPLETED
    - Add `word_matching` case to scoring functions
    - Add word matching test score calculation logic

20. **`src/utils/formHelpers.js`** ✅ COMPLETED
    - Add `word_matching` case to form validation
    - Handle word matching test form data processing

21. **`src/utils/validation.js`** ✅ COMPLETED
    - Add `word_matching` case to validation functions
    - Handle word matching test data validation

### New Components (To Be Created) ✅ COMPLETED
22. **`src/components/test/WordMatchingCreator.jsx`** ✅ COMPLETED (NEW)
    - Copy from `MatchingTestCreator.jsx`
    - Modify for word pairs instead of image blocks
    - Use Konva for word container dragging

23. **`src/components/test/WordMatchingStudent.jsx`** ✅ COMPLETED (NEW)
    - Copy from `MatchingTestStudent.jsx`
    - Modify for word pairs instead of image blocks
    - Use Konva for word container dragging

24. **`src/student/WordMatchingPage.jsx`** ✅ COMPLETED (NEW)
    - Copy from `MatchingTestPage.jsx`
    - Modify to use `WordMatchingStudent` component
    - Handle word matching test completion

### Routing Updates ✅ COMPLETED
25. **`src/App.jsx`** ✅ COMPLETED
    - Add route for word matching tests
    - Add `WordMatchingPage` component

26. **`src/student/student-index.jsx`** ✅ COMPLETED
    - Add word matching test route handling
    - Add `WordMatchingPage` component import

### CSS Files ✅ COMPLETED (REMOVED - USING TAILWIND)
27. **`src/components/test/WordMatchingCreator.css`** ✅ COMPLETED (REMOVED)
    - Copy from existing matching test styles
    - Modify for word pair interface
    - **REMOVED**: Using Tailwind CSS instead

28. **`src/components/test/WordMatchingStudent.css`** ✅ COMPLETED (REMOVED)
    - Copy from existing matching test styles
    - Modify for word pair interface
    - **REMOVED**: Using Tailwind CSS instead

### Template Files ✅ COMPLETED (NOT NEEDED - REACT COMPONENTS)
29. **`src/templates/word-matching-test-student.html`** ✅ COMPLETED (NOT NEEDED)
    - Copy from `matching-test-student.html`
    - Modify for word pair interface
    - Update button IDs and form structure
    - **NOT NEEDED**: Using React components instead

## React Components

### 1. Word Matching Creator
**File**: `src/components/test/WordMatchingCreator.jsx`

**Reused Components**:
- `Button` from `../ui/Button`
- `Card` from `../ui/Card`
- `LoadingSpinner` from `../ui/LoadingSpinner`
- `Notification, useNotification` from `../ui/Notification`

**Reused Hooks**:
- `useApi` from `../../hooks/useApi`
- `useAuth` from `../../contexts/AuthContext`
- `useKonvaCanvas` from `../../hooks/useKonvaCanvas`

**Reused Utils**:
- `validateForm, formatFormData, resetForm` from `../../utils/formHelpers`
- `calculateScore, formatScore` from `../../utils/scoreCalculation`

**State Management** (Simplified from MatchingTestCreator):
```javascript
const initialState = {
  testData: {
    leftWords: [],
    rightWords: [],
    correctPairs: {} // { leftIndex: rightIndex }
  },
  canvas: {
    size: { width: 800, height: 600 },
    selectedTool: 'edit'
  },
  creation: {
    isCreatingPair: false,
    selectedLeftWord: null,
    selectedRightWord: null,
    previewConnection: null
  },
  ui: {
    isLoading: false,
    error: null,
    showWordInputs: true
  }
};
```

**Key Features**:
- **Numbered Input Fields**: Simple left/right word pairs with matching numbers
- **No Dragging**: Just type words in corresponding numbered fields
- **Auto-pairing**: Position 1 left matches position 1 right automatically
- **Add/Remove Pairs**: Dynamically add or remove word pairs
- **Validation**: Ensure all pairs have both left and right words
- **Simple Interface**: Clean, straightforward form

**UI Layout**:
```javascript
// Main layout structure
<div className="word-matching-creator">
  {/* Header */}
  <div className="creator-header">
    <h2>Create Word Matching Test</h2>
    <p>Enter word pairs - position 1 left matches position 1 right</p>
  </div>

  {/* Word Pairs Section */}
  <div className="word-pairs-section">
    <div className="pairs-header">
      <h3>Word Pairs</h3>
      <Button onClick={addWordPair} size="sm">
        + Add Pair
      </Button>
    </div>
    
    <div className="pairs-list">
      {wordPairs.map((pair, index) => (
        <div key={index} className="word-pair-row">
          <div className="pair-number">
            <span className="number-badge">{index + 1}</span>
          </div>
          
          <div className="left-word">
            <input
              type="text"
              value={pair.leftWord}
              onChange={(e) => updateLeftWord(index, e.target.value)}
              placeholder="Left word..."
              className="word-input"
            />
          </div>
          
          <div className="pair-arrow">
            <span className="arrow">→</span>
          </div>
          
          <div className="right-word">
            <input
              type="text"
              value={pair.rightWord}
              onChange={(e) => updateRightWord(index, e.target.value)}
              placeholder="Right word..."
              className="word-input"
            />
          </div>
          
          <div className="pair-actions">
            <Button 
              onClick={() => removeWordPair(index)} 
              variant="outline" 
              size="sm"
              className="remove-btn"
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Preview Section */}
  <div className="preview-section">
    <h3>Preview</h3>
    <div className="preview-pairs">
      {wordPairs.map((pair, index) => (
        <div key={index} className="preview-pair">
          <span className="preview-number">{index + 1}.</span>
          <span className="preview-left">{pair.leftWord || 'Left word'}</span>
          <span className="preview-arrow">→</span>
          <span className="preview-right">{pair.rightWord || 'Right word'}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Actions */}
  <div className="creator-actions">
    <Button onClick={handleSaveTest} disabled={!isValidTest}>
      Save Test
    </Button>
    <Button onClick={onCancel} variant="secondary">
      Cancel
    </Button>
  </div>
</div>
```

**State Management** (Simplified):
```javascript
const initialState = {
  testData: {
    wordPairs: [
      { leftWord: '', rightWord: '' },
      { leftWord: '', rightWord: '' },
      { leftWord: '', rightWord: '' }
    ]
  },
  ui: {
    isLoading: false,
    error: null
  }
};

// Actions
const addWordPair = () => {
  dispatch({
    type: 'ADD_WORD_PAIR',
    payload: { leftWord: '', rightWord: '' }
  });
};

const removeWordPair = (index) => {
  dispatch({
    type: 'REMOVE_WORD_PAIR',
    payload: index
  });
};

const updateLeftWord = (index, value) => {
  dispatch({
    type: 'UPDATE_LEFT_WORD',
    payload: { index, value }
  });
};

const updateRightWord = (index, value) => {
  dispatch({
    type: 'UPDATE_RIGHT_WORD',
    payload: { index, value }
  });
};
```

**Data Structure**:
```javascript
// Internal state structure
const wordPairs = [
  { leftWord: 'Apple', rightWord: 'Red' },
  { leftWord: 'Banana', rightWord: 'Yellow' },
  { leftWord: 'Cherry', rightWord: 'Red' }
];

// Convert to API format for database
const apiFormat = {
  test_name: "Fruit Colors",
  num_questions: 3,
  questions: [
    { question_id: 1, left_word: 'Apple', right_word: 'Red' },
    { question_id: 2, left_word: 'Banana', right_word: 'Yellow' },
    { question_id: 3, left_word: 'Cherry', right_word: 'Red' }
  ]
};

// For student scoring - match by position
const studentAnswers = {
  0: 0, // Student matched left[0] to right[0] ✓
  1: 2, // Student matched left[1] to right[2] ✗
  2: 1  // Student matched left[2] to right[1] ✗
};
```

**CSS Styling**:
```css
.word-pairs-section {
  @apply space-y-4;
}

.pairs-header {
  @apply flex justify-between items-center;
}

.pairs-list {
  @apply space-y-3;
}

.word-pair-row {
  @apply flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border;
}

.pair-number {
  @apply flex-shrink-0;
}

.number-badge {
  @apply w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold;
}

.left-word, .right-word {
  @apply flex-1;
}

.word-input {
  @apply w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.pair-arrow {
  @apply flex-shrink-0 text-gray-500 text-xl;
}

.pair-actions {
  @apply flex-shrink-0;
}

.remove-btn {
  @apply w-8 h-8 p-0 text-red-500 hover:bg-red-50;
}

.preview-section {
  @apply mt-8 p-4 bg-blue-50 rounded-lg;
}

.preview-pairs {
  @apply space-y-2;
}

.preview-pair {
  @apply flex items-center space-x-2 text-sm;
}

.preview-number {
  @apply font-semibold text-blue-600;
}

.preview-left, .preview-right {
  @apply px-2 py-1 bg-white rounded border;
}

.preview-arrow {
  @apply text-gray-500;
}
```

### 2. Word Matching Student
**File**: `src/components/test/WordMatchingStudent.jsx`

**Reused Components**:
- `Button` from `../ui/Button`
- `Card` from `../ui/Card`
- `PerfectModal` from `../ui/PerfectModal`

**Reused Hooks**:
- `useApi` from `../../hooks/useApi`
- `useAuth` from `../../contexts/AuthContext`
- `useKonvaCanvas` from `../../hooks/useKonvaCanvas`

**Konva Implementation** (Copy from MatchingTestStudent):
```javascript
// Draggable word containers
const WordContainer = ({ word, x, y, isLeft, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd(e.target.x(), e.target.y());
      }}
    >
      <Rect
        width={120}
        height={40}
        fill={isDragging ? '#e3f2fd' : '#f5f5f5'}
        stroke="#2196f3"
        strokeWidth={2}
        cornerRadius={8}
      />
      <Text
        text={word}
        x={60}
        y={20}
        fontSize={14}
        fontFamily="Arial"
        fill="#333"
        align="center"
        verticalAlign="middle"
        offsetX={60}
        offsetY={10}
      />
    </Group>
  );
};
```

**Scoring Logic**:
```javascript
const calculateScore = (answers, correctPairs) => {
  let score = 0;
  Object.entries(answers).forEach(([leftIndex, rightIndex]) => {
    if (correctPairs[leftIndex] === rightIndex) {
      score++;
    }
  });
  return score;
};
```

## CSS Styling

### 1. Creator Styles
**File**: `src/components/test/WordMatchingCreator.css`
```css
.word-matching-creator {
  @apply max-w-6xl mx-auto p-6;
}

.word-input-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-6;
}

.word-list {
  @apply space-y-3;
}

.word-input {
  @apply w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.canvas-container {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50;
}

.pair-connection {
  @apply stroke-blue-500 stroke-2;
}

.word-container {
  @apply cursor-move select-none;
}

.word-container:hover {
  @apply shadow-lg transform scale-105;
}
```

### 2. Student Styles
**File**: `src/components/test/WordMatchingStudent.css`
```css
.word-matching-student {
  @apply max-w-4xl mx-auto p-6;
}

.words-section {
  @apply grid grid-cols-1 md:grid-cols-2 gap-8 mb-8;
}

.left-words, .right-words {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-700 mb-4 text-center;
}

.word-item {
  @apply p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm cursor-move transition-all duration-200;
}

.word-item:hover {
  @apply border-blue-400 shadow-md transform translate-y-1;
}

.word-item.dragging {
  @apply opacity-50 transform scale-105;
}

.word-item.dropped {
  @apply border-green-400 bg-green-50;
}

.word-item.incorrect {
  @apply border-red-400 bg-red-50;
}

.canvas-area {
  @apply border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50;
}

.submit-section {
  @apply flex justify-center space-x-4 mt-8;
}
```

## Integration Points

### 1. Teacher Tests Integration
**File**: `src/teacher/TeacherTests.jsx`

**Changes Needed**:
```javascript
// 1. Add to TEST_TYPE_MAP
const TEST_TYPE_MAP = {
  'multipleChoice': 'multiple_choice',
  'trueFalse': 'true_false',
  'input': 'input',
  'matching': 'matching_type',
  'wordMatching': 'word_matching' // NEW
};

// 2. Add to testTypes array
const testTypes = ['multiple-choice', 'true-false', 'input', 'matching', 'word-matching'];

// 3. Add import
import WordMatchingCreator from '../components/test/WordMatchingCreator';

// 4. Add word matching test type selection
const handleTestTypeSelection = (type) => {
  if (type === 'word-matching') {
    setTestType('wordMatching');
    setCurrentStep('formCreation');
    // Initialize word matching specific form data
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {},
      wordMatchingData: null // Store word matching test data
    });
  }
  // ... existing logic for other types
};

// 5. Add word matching test form rendering
const renderWordMatchingTestForm = () => (
  <Card>
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-semibold text-gray-900">Create Word Matching Test</h3>
      <p className="text-sm text-gray-600">
        Create word pairs by dragging from left to right words.
      </p>
      <WordMatchingCreator
        testName={formData.testName}
        onTestSaved={handleWordMatchingTestSave}
        onCancel={handleWordMatchingTestCancel}
        onBackToCabinet={returnToMainCabinet}
        isSaving={isSavingTest}
        validationErrors={{}}
      />
    </div>
  </Card>
);

// 6. Add word matching test save handler
const handleWordMatchingTestSave = useCallback(async (testData) => {
  console.log('🎯 Word matching test saved:', testData);
  
  // Store the word matching test data
  setFormData(prev => ({
    ...prev,
    wordMatchingData: testData,
    numQuestions: testData.leftWords.length
  }));
  
  // Move to assignment step
  setCurrentStep('testAssignment');
  showNotification('Word matching test created! Now assign it to classes.', 'success');
}, [showNotification]);

// 7. Add word matching test cancel handler
const handleWordMatchingTestCancel = useCallback(() => {
  setFormData(prev => ({
    ...prev,
    wordMatchingData: null
  }));
  setCurrentStep('typeSelection');
}, []);

// 8. Update handleSaveTest to handle word matching tests
const handleSaveTest = useCallback(async () => {
  // ... existing logic ...
  
  // Handle word matching tests
  if (testType === 'wordMatching') {
    console.log('🎯 Processing word matching test...');
    const wordMatchingData = formData.wordMatchingData;
    
    if (!wordMatchingData) {
      showNotification('Word matching test data not found. Please recreate the test.', 'error');
      return;
    }
    
    // Convert word matching data to API format
    const questions = wordMatchingData.wordPairs.map((pair, index) => ({
      question_id: index + 1,
      left_word: pair.leftWord,
      right_word: pair.rightWord
    }));
    
    const testData = {
      teacher_id: user.teacher_id,
      test_name: formData.testName,
      num_questions: questions.length,
      questions: questions,
      assignments: assignments
    };
    
    // Call the word matching test API
    const response = await testService.saveWordMatchingTest(testData);
    
    if (response.success) {
      showNotification('Word matching test created and assigned successfully!', 'success');
      setTestAssignmentCompleted(true);
      returnToMainCabinet();
    } else {
      showNotification('Error creating word matching test: ' + response.message, 'error');
    }
    return;
  }
  
  // ... existing logic for other test types ...
}, [testType, formData, selectedClasses, user, showNotification]);

// 9. Update test type selection UI
const renderTestTypeSelection = () => (
  <div className="test-type-selection">
    <h2>Create New Test</h2>
    <p>Select the type of test you want to create:</p>
    
    <div className="test-type-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Existing test types */}
      <div className="test-type-card" onClick={() => handleTestTypeSelection('multiple-choice')}>
        <h3>Multiple Choice</h3>
        <p>Questions with multiple answer options</p>
        <Button variant="primary">Create Test</Button>
      </div>
      
      {/* Word Matching Test Type */}
      <div className="test-type-card" onClick={() => handleTestTypeSelection('word_matching')}>
        <div className="flex items-center mb-3">
          <img src="/pics/matching-words.png" alt="Word matching" className="w-8 h-8 mr-3" />
          <h3>Word matching</h3>
        </div>
        <p>Students match word pairs by dragging words from left list to right list</p>
        <Button variant="primary">Create Test</Button>
      </div>
      
      <div className="test-type-card" onClick={() => handleTestTypeSelection('true-false')}>
        <h3>True/False</h3>
        <p>Questions with true or false answers</p>
        <Button variant="primary">Create Test</Button>
      </div>
      
      <div className="test-type-card" onClick={() => handleTestTypeSelection('input')}>
        <h3>Input Test</h3>
        <p>Questions requiring text input answers</p>
        <Button variant="primary">Create Test</Button>
      </div>
      
      <div className="test-type-card" onClick={() => handleTestTypeSelection('matching')}>
        <h3>Image Matching</h3>
        <p>Match words to image blocks</p>
        <Button variant="primary">Create Test</Button>
      </div>
      
      {/* NEW: Word Matching Test Type */}
      <div className="test-type-card" onClick={() => handleTestTypeSelection('word-matching')}>
        <h3>Word Matching</h3>
        <p>Match words from left list to right list</p>
        <Button variant="primary">Create Test</Button>
      </div>
    </div>
  </div>
);

// 10. Update form rendering logic
const renderTestForm = () => {
  if (testType === 'matching') {
    return renderMatchingTestForm();
  } else if (testType === 'wordMatching') {
    return renderWordMatchingTestForm();
  }
  
  // ... existing logic for other test types ...
};
```

**Key Integration Points**:
- **Test Type Selection**: Add "Word Matching" option to test type grid
- **Form Rendering**: Show `WordMatchingCreator` component when selected
- **Data Handling**: Store word matching test data in `formData.wordMatchingData`
- **API Integration**: Convert word pairs to API format and call `saveWordMatchingTest`
- **Assignment Flow**: Same assignment flow as other test types
- **Validation**: Ensure all words are paired before allowing assignment

### 2. Student Tests Integration
**File**: `src/student/StudentTests.jsx`
- Add word matching case to `startTest` function
- Redirect to dedicated word matching page

### 3. Student Page
**File**: `src/student/WordMatchingPage.jsx`
- Copy from `MatchingTestPage.jsx`
- Use `WordMatchingStudent` component
- Handle completion check and redirect

### 4. Test Context Integration
**File**: `src/contexts/TestContext.jsx`
- Add word matching case to `submitTest` function
- Handle word matching test submission

## File Structure
```
src/
├── components/test/
│   ├── WordMatchingCreator.jsx
│   ├── WordMatchingStudent.jsx
│   ├── WordMatchingCreator.css
│   └── WordMatchingStudent.css
├── student/
│   └── WordMatchingPage.jsx
├── services/
│   └── testService.js (extend existing)
├── contexts/
│   └── TestContext.jsx (extend existing)
└── teacher/
    └── TeacherTests.jsx (extend existing)

functions/
├── submit-word-matching-test.js
├── get-word-matching-test.js
└── save-test-with-assignments.js (extend existing)
```

## Implementation Order ✅ 100% COMPLETED

### Phase 1: Database & Core Backend ✅ COMPLETED
1. **Database**: ✅ COMPLETED - Add SQL tables (`word_matching_tests`, `word_matching_pairs`, `word_matching_test_results`)
2. **Core Functions**: ✅ COMPLETED - Create `submit-word-matching-test.js` and `get-word-matching-test.js`
3. **Save Function**: ✅ COMPLETED - Add `word_matching` case to `save-test-with-assignments.js`

### Phase 2: Test Management Backend ✅ COMPLETED
4. **Test Management**: ✅ COMPLETED - Add `word_matching` cases to:
   - `get-all-tests.js`
   - `delete-test.js`
   - `delete-test-assignments.js`
   - `delete-test-data.js`

### Phase 3: Assignment Backend ✅ COMPLETED
5. **Assignment Functions**: ✅ COMPLETED - Add `word_matching` cases to:
   - `assign-test.js`
   - `assign-test-to-classes.js`
   - `remove-assignment.js`

### Phase 4: Student/Teacher Backend ✅ COMPLETED
6. **Student Functions**: ✅ COMPLETED - Add `word_matching` cases to:
   - `get-student-active-tests.js`
   - `get-student-test-results.js`
   - `check-test-completion.js`

7. **Teacher Functions**: ✅ COMPLETED - Add `word_matching` cases to:
   - `get-teacher-active-tests.js`
   - `get-teacher-student-results.js`
   - `get-test-assignments.js`

### Phase 5: Results Backend ✅ COMPLETED
8. **Results Functions**: ✅ COMPLETED - Add `word_matching` cases to:
   - `get-test-results.js`
   - `submit-test-results.js`

### Phase 6: Test Verification ✅ COMPLETED
9. **Test Table Functions**: ✅ COMPLETED - Add word matching support to:
   - `test-input-test-table.js`
   - `test-true-false-table.js`

### Phase 7: Frontend Service Layer ✅ COMPLETED
10. **Service Layer**: ✅ COMPLETED - Extend `testService.js` with word matching functions

### Phase 8: React Components ✅ COMPLETED
11. **Creator Component**: ✅ COMPLETED - Build `WordMatchingCreator.jsx`
12. **Student Component**: ✅ COMPLETED - Build `WordMatchingStudent.jsx`
13. **Student Page**: ✅ COMPLETED - Create `WordMatchingPage.jsx`

### Phase 9: Integration ✅ COMPLETED
14. **Teacher Integration**: ✅ COMPLETED - Add to `TeacherTests.jsx`
15. **Student Integration**: ✅ COMPLETED - Add to `StudentTests.jsx`
16. **Test Context**: ✅ COMPLETED - Add to `TestContext.jsx`

### Phase 10: Styling & Testing ✅ COMPLETED
17. **Styling**: ✅ COMPLETED - Using Tailwind CSS (no custom CSS files)
18. **Testing**: ✅ COMPLETED - Test creation and submission flow
19. **Validation**: ✅ COMPLETED - Test all API endpoints

## Loading States Summary (CRITICAL) ✅ COMPLETED

### All Buttons Must Have Loading States ✅ COMPLETED

#### Teacher Creator Buttons: ✅ COMPLETED
- ✅ **Save Test Button**: `isSavingTest` with spinner
- ✅ **Assign Test Button**: `isAssigningTest` with spinner  
- ✅ **Excel Upload Button**: `isUploadingExcel` with spinner
- ✅ **Add Pair Button**: `isAddingPair` with spinner
- ✅ **Remove Pair Button**: `isRemovingPair` with spinner

#### Student Test Buttons: ✅ COMPLETED
- ✅ **Submit Test Button**: `isSubmitting` with spinner
- ✅ **Reset Button**: `isResetting` with spinner
- ✅ **Back to Cabinet Button**: `isNavigating` with spinner

#### Loading State Pattern:
```javascript
// 1. Set loading state
setIsLoading(true);

// 2. Disable button
disabled={isLoading}

// 3. Show spinner
{isLoading ? (
  <>
    <LoadingSpinner size="sm" color="white" className="mr-2" />
    Loading...
  </>
) : (
  'Button Text'
)}

// 4. Clear in finally block
} finally {
  setIsLoading(false);
}
```

## Key Reused Patterns

- **State Management**: useReducer pattern from MatchingTestCreator
- **Konva Integration**: Dragging logic from MatchingTestStudent
- **API Calls**: Same pattern as other test types
- **Validation**: Form validation from formHelpers
- **UI Components**: Button, Card, LoadingSpinner, Notification
- **Hooks**: useApi, useAuth, useKonvaCanvas
- **Scoring**: Same percentage calculation pattern
- **Caching**: Same localStorage pattern for test progress
- **Loading States**: Same pattern as TeacherTests.jsx and MatchingTestStudent.jsx
