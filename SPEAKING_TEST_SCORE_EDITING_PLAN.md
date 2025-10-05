# Speaking Test Score Editing Implementation Plan

## Overview
Implement score editing functionality for speaking tests in the teacher results interface, similar to how drawing tests handle score editing. This will allow teachers to manually adjust scores in the speaking test scoring popup.

## Current State Analysis

### Drawing Test Score Editing (Reference Implementation)
- **Location**: `src/teacher/TeacherResults.jsx` (lines 140-150, 870-915, 1006-1040)
- **API Endpoint**: `functions/update-drawing-test-score.js`
- **Features**:
  - Individual score editing with input fields
  - Column-level editing for bulk score updates
  - Real-time validation and save functionality
  - State management with refs for persistence
  - Success/error notifications

### Speaking Test Current State
- **Scoring Popup**: `src/components/test/SpeakingTestReview.jsx` (lines 225-246)
- **Current Features**:
  - Displays current score and percentage
  - Placeholder text: "Score editing functionality can be implemented here"
  - No actual editing functionality

## Implementation Plan

### Phase 1: Backend API Development
- [ ] **File**: `functions/update-speaking-test-score.js`
- [ ] **Purpose**: Create API endpoint for updating speaking test scores
- [ ] **Features**:
  - Accept `resultId`, `score`, `maxScore` parameters
  - Update `speaking_test_results` table
  - Handle retest assignments (similar to drawing tests)
  - Update `test_attempts` table for retests
  - Update `retest_targets` status based on threshold
  - Return success/error response

### Phase 2: Frontend State Management
- [ ] **File**: `src/teacher/TeacherResults.jsx`
- [ ] **Changes**:
  - Add speaking test score editing state variables
  - Add speaking test score editing handlers
  - Add speaking test score validation logic
  - Add speaking test score save functionality

### Phase 3: UI Implementation
- [ ] **File**: `src/components/test/SpeakingTestReview.jsx`
- [ ] **Changes**:
  - Replace static score display with editable inputs
  - Add edit/save/cancel buttons
  - Add loading states during save operations
  - Add validation feedback
  - Add success/error notifications

### Phase 4: API Integration
- [ ] **File**: `src/shared/shared-index.jsx`
- [ ] **Changes**:
  - Add `UPDATE_SPEAKING_TEST_SCORE` endpoint constant
  - Update API endpoints configuration

### Phase 5: Column-Level Editing (Optional)
- [ ] **File**: `src/teacher/TeacherResults.jsx`
- [ ] **Changes**:
  - Extend column editing to support speaking tests
  - Add speaking test to bulk editing functionality
  - Add speaking test validation in column editing

## Technical Implementation Details

### Backend API Structure
```javascript
// functions/update-speaking-test-score.js
exports.handler = async (event, context) => {
  // Validate request method and body
  // Extract resultId, score (maxScore remains unchanged)
  // Get current result from speaking_test_results
  // Update only score (keep existing max_score)
  // Recalculate percentage based on existing max_score
  // Handle retest assignments
  // Update test_attempts for retests
  // Update retest_targets status
  // Return success response
};
```

### Frontend State Management
```javascript
// src/teacher/TeacherResults.jsx
const [editingSpeakingScore, setEditingSpeakingScore] = useState(null);
const [tempSpeakingScore, setTempSpeakingScore] = useState('');
const [isSavingSpeakingScore, setIsSavingSpeakingScore] = useState(false);
// Note: No tempSpeakingMaxScore needed - max score remains unchanged
```

### UI Components
```jsx
// src/components/test/SpeakingTestReview.jsx
{activeTab === 'scoring' && (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900">Score Details</h3>
    
    {isEditingScore ? (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Score</label>
            <input
              type="number"
              min="0"
              max={studentResults.max_score}
              value={tempSpeakingScore}
              onChange={(e) => setTempSpeakingScore(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Score</label>
            <p className="mt-1 text-sm text-gray-900">{studentResults.max_score} (Fixed)</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSaveSpeakingScore}
            disabled={isSavingSpeakingScore}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSavingSpeakingScore ? 'Saving...' : 'Save Score'}
          </button>
          <button
            onClick={handleCancelSpeakingScoreEdit}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Score</label>
            <p className="mt-1 text-sm text-gray-900">
              {studentResults.score} / {studentResults.max_score}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Percentage</label>
            <p className="mt-1 text-sm text-gray-900">{studentResults.percentage}%</p>
          </div>
        </div>
        <button
          onClick={handleStartSpeakingScoreEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Edit Score
        </button>
      </div>
    )}
  </div>
)}
```

## Database Schema Considerations

### Tables to Update
1. **`speaking_test_results`** - Main score storage
2. **`test_attempts`** - For retest tracking
3. **`retest_targets`** - For retest status updates

### Key Fields
- `score` - Current score value
- `max_score` - Maximum possible score
- `percentage` - Calculated percentage
- `retest_assignment_id` - For retest handling
- `attempt_number` - For retest tracking

## Validation Rules

### Score Validation
- Score cannot be negative
- Score cannot exceed existing max_score
- Max score remains unchanged (read-only)
- Percentage calculation: `(score / max_score) * 100`

### Business Logic
- Handle retest assignments properly
- Update retest status based on threshold
- Maintain audit trail in test_attempts
- Preserve original test data integrity

## Error Handling

### Backend Errors
- Invalid resultId
- Database connection issues
- Validation failures
- Retest assignment errors

### Frontend Errors
- Network request failures
- Validation errors
- Save operation failures
- User input validation

## Testing Scenarios

### Basic Functionality
1. Edit score for regular speaking test (max score remains fixed)
2. Edit score for retest assignment (max score remains fixed)
3. Validate score boundaries (0 to existing max_score)
4. Test save/cancel operations

### Edge Cases
1. Invalid score values
2. Network failures
3. Concurrent editing
4. Retest threshold updates

### Integration Testing
1. Score updates reflect in results table
2. Retest status updates correctly
3. Percentage calculations are accurate
4. UI state management works properly

## Implementation Priority

### Phase 1 (High Priority)
- [ ] Create `update-speaking-test-score.js` API
- [ ] Add basic score editing to SpeakingTestReview
- [ ] Add API endpoint constant
- [ ] Test basic functionality

### Phase 2 (Medium Priority)
- [ ] Add validation and error handling
- [ ] Add loading states and notifications
- [ ] Test retest assignment handling
- [ ] Add comprehensive error handling

### Phase 3 (Low Priority)
- [ ] Add column-level editing support
- [ ] Add bulk score editing
- [ ] Add advanced validation rules
- [ ] Add audit trail features

## Files to Create/Modify

### New Files
- `functions/update-speaking-test-score.js`

### Modified Files
- `src/components/test/SpeakingTestReview.jsx`
- `src/teacher/TeacherResults.jsx`
- `src/shared/shared-index.jsx`

## Success Criteria
- [ ] Teachers can edit speaking test scores in the popup (max score remains fixed)
- [ ] Score changes are saved to database
- [ ] Retest assignments are handled correctly
- [ ] UI provides clear feedback during operations
- [ ] Error handling works properly
- [ ] Integration with existing results table works
- [ ] Performance is acceptable for typical usage
- [ ] Max score is clearly marked as read-only/fixed

## Notes
- Follow the same patterns as drawing test score editing
- Ensure consistency with existing UI/UX
- Maintain backward compatibility
- Consider future enhancements (bulk editing, advanced validation)
- Test thoroughly with different score scenarios
