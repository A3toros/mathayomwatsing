# Speaking Test Random Question Selection Plan

## Overview
When a speaking test has multiple questions, instead of showing all questions sequentially, we'll randomly select and display only one question to the student. This approach simplifies the user experience while still utilizing the question pool.

## Current Problem
- Speaking tests with multiple questions currently only show the first question (`questions[0]`)
- Students don't see all available questions
- No randomization of question selection

## Proposed Solution
1. **Random Question Selection**: When a test has multiple questions, randomly select one question to display
2. **Single Question Experience**: Maintain the current single-question UI/UX
3. **Question Pool Utilization**: Ensure all questions in the pool have equal chance of being selected

## Implementation Plan

### Phase 1: Random Question Selection Logic
- [ ] **File**: `src/student/SpeakingTestPage.jsx`
- [ ] **Changes**:
  - Add random question selection logic in `loadTestData()`
  - Select one random question from the questions array
  - Store the selected question in state
  - Update the current question logic to use the randomly selected question

### Phase 2: Update Question Display
- [ ] **File**: `src/student/SpeakingTestPage.jsx`
- [ ] **Changes**:
  - Remove the `currentQuestionIndex` state (not needed for single random question)
  - Update `currentQuestion` to use the randomly selected question
  - Ensure the selected question is passed to `SpeakingTestStudent`

### Phase 3: Maintain Current UI/UX
- [ ] **Files**: `src/components/test/SpeakingTestStudent.jsx`
- [ ] **Changes**:
  - No changes needed to the student interface
  - Maintain current recording, feedback, and submission flow
  - Keep the single-question experience intact

### Phase 4: Question Pool Validation
- [ ] **File**: `src/student/SpeakingTestPage.jsx`
- [ ] **Changes**:
  - Add validation to ensure questions array is not empty
  - Handle edge cases (0 questions, 1 question)
  - Add console logging for debugging question selection

### Phase 5: Teacher Notification System
- [ ] **File**: `src/components/test/SpeakingTestCreator.jsx`
- [ ] **Changes**:
  - Add informational notice about random question selection
  - Show notification when teacher adds multiple questions
  - Explain that only one question will be randomly shown to students
  - Add visual indicator (info icon + message)

## Technical Implementation

### Random Question Selection Algorithm
```javascript
// In loadTestData() function
const questionsResponse = await api.getSpeakingTestQuestions(testId);
if (questionsResponse.success) {
  let questions = questionsResponse.questions;
  
  // Shuffle questions if test has shuffling enabled
  if (testResponse.test?.is_shuffled) {
    console.log('🔀 Shuffling speaking test questions');
    questions = [...questions].sort(() => Math.random() - 0.5);
  }
  
  // Select one random question from the pool
  if (questions.length > 1) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    console.log(`🎲 Selected random question ${randomIndex + 1} of ${questions.length}:`, selectedQuestion.prompt);
    setQuestions([selectedQuestion]); // Store only the selected question
  } else {
    setQuestions(questions); // Use all questions if only one
  }
}
```

### Benefits of This Approach
1. **Simplified UX**: Students see only one question, maintaining the current experience
2. **Question Pool Utilization**: All questions have equal chance of being selected
3. **No UI Changes**: Maintains current single-question interface
4. **Randomization**: Ensures different students get different questions
5. **Backward Compatible**: Works with existing single-question tests

### Edge Cases Handled
- **0 questions**: Show error message
- **1 question**: Use that question (no randomization needed)
- **Multiple questions**: Randomly select one
- **Shuffling enabled**: Apply shuffling before random selection

## Files to Modify
1. `src/student/SpeakingTestPage.jsx` - Add random question selection logic
2. No changes needed to `SpeakingTestStudent.jsx` (maintains current interface)

## Testing Scenarios
1. **Single Question Test**: Should work as before
2. **Multiple Question Test**: Should randomly select one question
3. **Shuffling Enabled**: Should apply shuffling before random selection
4. **Empty Questions**: Should show appropriate error

## Implementation Status
- [ ] Phase 1: Random Question Selection Logic
- [ ] Phase 2: Update Question Display  
- [ ] Phase 3: Maintain Current UI/UX
- [ ] Phase 4: Question Pool Validation
- [ ] Phase 5: Teacher Notification System

## Notes
- This approach maintains the current single-question experience
- No changes needed to the recording, feedback, or submission flow
- Question selection happens once when the test loads
- Random selection ensures fair distribution across question pool
