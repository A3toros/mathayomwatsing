# Score Editing in Test Answer Modal - Implementation Plan

## Overview
Add score editing functionality to the Test Answer Modal for Multiple Choice, True/False, Input, Fill Blanks, Matching, and Word Matching tests. This allows teachers to edit scores directly from the answer viewing modal without needing to return to the results table.

## Current State

### Existing Functionality
1. **Answer Modal**: `src/components/test/TestAnswerModal.jsx` displays student answers for:
   - Multiple Choice (`multiple_choice`)
   - True/False (`true_false`)
   - Input (`input`)
   - Fill Blanks (`fill_blanks`)
   - Matching Type (`matching_type`)
   - Word Matching (`word_matching`)

2. **Score Editing Examples**:
   - **Speaking Test**: Inline editing in TeacherResults table (lines 2038-2064)
   - **Drawing Test**: Inline editing in TeacherResults table (lines 1397-1445)
   - Both update scores immediately in the table without page refresh

3. **Score Color Logic**:
   - Red: `percentage < 50`
   - Yellow: `50 <= percentage < 70`
   - Green: `percentage >= 70`
   - Blue: `retest_offered === true`

4. **Retest Popup Logic**:
   - Currently: Click on score pill opens retest popup OR answer modal
   - For MC/TF/Input: Red score → retest popup, Non-red → answer modal
   - For Fill Blanks/Matching/Word Matching: Similar logic expected

## Requirements

### Phase 1: Score Editing for MC/TF/Input Tests

#### 1.1 Add Score Editor at Top of Answer Modal
- **Location**: Top of `TestAnswerModal.jsx`, before the answer table
- **UI Elements**:
  - Display: `Score: [editable] / [maxScore (read-only)]`
  - Input field: Number input for score (similar to speaking test)
  - Max Score: Display only (not editable)
  - Save button: Green button (like speaking test)
  - Cancel button: Gray button (like speaking test)
- **State Management**:
  - `editingScore` - tracks if score is being edited
  - `tempScore` - temporary score value during editing
  - `isSavingScore` - loading state during save

#### 1.2 Create/Update Backend Function
- **File**: `functions/update-test-score.js` (new file, generic for MC/TF/Input)
- **OR** create separate functions:
  - `functions/update-multiple-choice-test-score.js`
  - `functions/update-true-false-test-score.js`
  - `functions/update-input-test-score.js`
- **Database Tables**:
  - `multiple_choice_test_results` - UPDATE `score` WHERE `id = resultId`
  - `true_false_test_results` - UPDATE `score` WHERE `id = resultId`
  - `input_test_results` - UPDATE `score` WHERE `id = resultId`
- **Validation**:
  - Score must be >= 0
  - Score must be <= maxScore
  - resultId must exist

#### 1.3 API Endpoint
- **Add to `src/shared/shared-index.jsx`**:
  ```javascript
  UPDATE_MULTIPLE_CHOICE_TEST_SCORE: '/.netlify/functions/update-multiple-choice-test-score',
  UPDATE_TRUE_FALSE_TEST_SCORE: '/.netlify/functions/update-true-false-test-score',
  UPDATE_INPUT_TEST_SCORE: '/.netlify/functions/update-input-test-score',
  // OR generic:
  UPDATE_TEST_SCORE: '/.netlify/functions/update-test-score',
  ```

#### 1.4 Immediate Table Update
- **Pattern from Speaking Test** (lines 876-922 in TeacherResults.jsx):
  - After successful save, call `loadResultsForSemester(selectedSemester, true)` to force refresh
  - Update local state if needed
  - No page refresh required

#### 1.5 Props Flow
- **TestAnswerModal** receives:
  - `testResult` - contains `result_id`, `score`, `max_score`, `test_type`
  - `onScoreUpdate` - callback to update parent component (TeacherResults)
  - `onClose` - existing callback

- **TeacherResults** passes:
  - `onScoreUpdate={(updatedScore) => { /* update local state */ }}`
  - After update, refresh results table

### Phase 2: Score Editing for Fill Blanks, Matching, Word Matching

#### 2.1 Conditional Logic for Score Click
- **Current Behavior**: Click on score opens answer modal
- **New Behavior**:
  - **Red Score** (< 50%): Open retest popup (existing behavior)
  - **Green/Yellow Score** (>= 50%): Open edit score modal (NEW)
    - Only score editing, no answers shown
    - Simple modal: Score input, Save, Cancel buttons

#### 2.2 New Edit Score Modal Component
- **File**: `src/components/test/EditScoreModal.jsx` (new)
- **Props**:
  - `isOpen` - boolean
  - `onClose` - callback
  - `testResult` - contains resultId, score, maxScore, testType
  - `onSave` - callback with new score
- **UI**:
  - Title: "Edit Score - [Test Name]"
  - Student name: Display
  - Score input: Number input
  - Max Score: Display only
  - Save/Cancel buttons
- **Similar to**: Speaking test score editing UI (lines 2038-2064)

#### 2.3 Backend Functions
- **Files to create**:
  - `functions/update-fill-blanks-test-score.js`
  - `functions/update-matching-type-test-score.js`
  - `functions/update-word-matching-test-score.js`
- **Database Tables**:
  - `fill_blanks_test_results` - UPDATE `score` WHERE `id = resultId`
  - `matching_type_test_results` - UPDATE `score` WHERE `id = resultId`
  - `word_matching_test_results` - UPDATE `score` WHERE `id = resultId`
- **Validation**: Same as Phase 1

#### 2.4 Update Click Handler in TeacherResults
- **Location**: Score pill click handlers (lines 1364-1669, 1909-2184)
- **Logic**:
  ```javascript
  const handleScoreClick = (testResult, test) => {
    const pct = computePercentage(testResult);
    const isRed = pct !== null && pct < 50;
    
    if (testType === 'fill_blanks' || testType === 'matching_type' || testType === 'word_matching') {
      if (isRed) {
        // Open retest popup (existing)
        handleOfferRetest(testResult);
      } else {
        // Open edit score modal (NEW)
        setEditingScoreModal({ isOpen: true, testResult });
      }
    } else {
      // MC/TF/Input: Open answer modal (existing)
      handleViewAnswers(testResult, test);
    }
  };
  ```

## Implementation Steps

### Step 1: Create Backend Functions (Generic Approach)
1. Create `functions/update-test-score.js`:
   - Accept `resultId`, `score`, `testType` in request body
   - Route to appropriate table based on `testType`
   - Update score in database
   - Return updated score and percentage

2. Add API endpoint to `src/shared/shared-index.jsx`

### Step 2: Update TestAnswerModal Component
1. Add state for score editing:
   ```javascript
   const [editingScore, setEditingScore] = useState(false);
   const [tempScore, setTempScore] = useState('');
   const [isSavingScore, setIsSavingScore] = useState(false);
   ```

2. Add score editor UI at top of modal:
   - Before the answer table
   - Show current score/maxScore
   - Edit button or double-click to edit
   - Save/Cancel buttons when editing

3. Add save handler:
   ```javascript
   const handleSaveScore = async () => {
     setIsSavingScore(true);
     try {
       const response = await fetch(API_ENDPOINTS.UPDATE_TEST_SCORE, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           resultId: testResult.result_id,
           score: parseInt(tempScore),
           testType: testResult.test_type
         })
       });
       
       if (response.ok) {
         // Update local testResult
         // Call onScoreUpdate callback
         // Close editing mode
       }
     } finally {
       setIsSavingScore(false);
     }
   };
   ```

4. Add props:
   - `onScoreUpdate?: (updatedScore: number) => void`

### Step 3: Create EditScoreModal Component
1. Create `src/components/test/EditScoreModal.jsx`:
   - Similar structure to PerfectModal
   - Score input field
   - Save/Cancel buttons
   - Handle save and update parent

2. Use in TeacherResults for Fill Blanks/Matching/Word Matching

### Step 4: Update TeacherResults Component
1. Add state for edit score modal:
   ```javascript
   const [editScoreModal, setEditScoreModal] = useState({ isOpen: false, testResult: null });
   ```

2. Update score click handlers:
   - Check if testType is fill_blanks/matching_type/word_matching
   - Check score color (red vs green/yellow)
   - Route to appropriate modal

3. Add refresh logic after score update:
   ```javascript
   const handleScoreUpdated = () => {
     loadResultsForSemester(selectedSemester, true);
   };
   ```

### Step 5: Testing
1. Test score editing for each test type:
   - MC, TF, Input: Edit from answer modal
   - Fill Blanks, Matching, Word Matching: Edit from score click (green/yellow)
   - Verify immediate table update
   - Verify score validation (0 to maxScore)

2. Test retest popup still works for red scores

## Files to Modify

### New Files
1. `functions/update-test-score.js` (or separate files per test type)
2. `functions/update-fill-blanks-test-score.js`
3. `functions/update-matching-type-test-score.js`
4. `functions/update-word-matching-test-score.js`
5. `src/components/test/EditScoreModal.jsx`

### Modified Files
1. `src/components/test/TestAnswerModal.jsx`
   - Add score editor UI
   - Add score editing state and handlers
   - Add onScoreUpdate prop

2. `src/teacher/TeacherResults.jsx`
   - Add EditScoreModal state
   - Update score click handlers
   - Add score update callback

3. `src/shared/shared-index.jsx`
   - Add new API endpoints

## Database Schema Reference

### Tables to Update
- `multiple_choice_test_results`: `score` column
- `true_false_test_results`: `score` column
- `input_test_results`: `score` column
- `fill_blanks_test_results`: `score` column
- `matching_type_test_results`: `score` column
- `word_matching_test_results`: `score` column

### SQL Update Pattern
```sql
UPDATE <table_name>_test_results
SET score = ${score}
WHERE id = ${resultId}
```

## UI/UX Notes

1. **Score Editor in Answer Modal**:
   - Position: Top of modal, before answer table
   - Style: Similar to speaking test inline editor
   - Max Score: Grayed out, read-only

2. **Edit Score Modal**:
   - Simple, focused UI
   - Only score input, no answers
   - Clear Save/Cancel actions

3. **Immediate Feedback**:
   - Show loading state during save
   - Update table immediately after save
   - Show success notification

## Edge Cases to Handle

1. **Concurrent Edits**: Handle case where score is edited while modal is open
2. **Invalid Scores**: Validate score range (0 to maxScore)
3. **Network Errors**: Show error message, don't update local state
4. **Retest Logic**: Ensure retest status still works correctly after score edit
5. **Percentage Calculation**: Recalculate percentage after score update

## Success Criteria

1. ✅ Teachers can edit scores from answer modal for MC/TF/Input tests
2. ✅ Scores update immediately in results table (no page refresh)
3. ✅ Green/yellow scores for Fill Blanks/Matching/Word Matching open edit modal
4. ✅ Red scores still open retest popup
5. ✅ Max score is not editable (read-only)
6. ✅ Score validation works correctly
7. ✅ All test types have appropriate backend functions

