# Speaking Test Restructure Plan

## Overview
Restructure the speaking test system to allow teachers to configure the number of attempts (1-3) during test creation, store this in the database, and update the UI to show "Stop" button during recording and "Rerecord"/"Send" buttons after stopping.

## Current State

### Database
- `speaking_tests` table has `max_attempts` column (default: 3)
- Currently hardcoded to 3 attempts in `SpeakingTestCreator.jsx` (line 107)
- Backend function `save-speaking-test-with-assignments.js` accepts `max_attempts` but uses default if not provided

### Frontend - Teacher (Test Creation)
- `SpeakingTestCreator.jsx`: No UI for selecting attempts, hardcoded to 3
- `TeacherTests.jsx`: Passes `max_attempts` from `speakingData` to backend

### Frontend - Student (Test Taking)
- `SpeakingTestStudent.jsx`: Reads `max_attempts` from `testData.max_attempts` (line 25)
- `AudioRecorder.jsx`: Shows "Stop & Submit" button during recording
- After recording stops, shows feedback and "Rerecord"/"Submit Final" buttons

### Database Views
- `student_active_tests_view.sql`: May need to include `max_attempts` or `allowed_attempts` field

## Required Changes

### 1. Database Schema Changes

#### 1.1 Add `allowed_attempts` Column to `speaking_tests` Table
**File**: `database/database_schema_migration.sql`

```sql
-- Add allowed_attempts column to speaking_tests table
ALTER TABLE speaking_tests 
ADD COLUMN IF NOT EXISTS allowed_attempts INTEGER DEFAULT 3 
CHECK (allowed_attempts >= 1 AND allowed_attempts <= 3);

-- Update existing records to set allowed_attempts from max_attempts
UPDATE speaking_tests 
SET allowed_attempts = COALESCE(max_attempts, 3) 
WHERE allowed_attempts IS NULL;
```

**Rationale**: 
- `allowed_attempts` is clearer than `max_attempts` (which is also used for retest system)
- Constraint ensures valid range (1-3)
- Default to 3 for backward compatibility

#### 1.2 Database View - NOT NEEDED
**File**: `database/views/student_active_tests_view.sql`

**No changes required**: The view is only used for listing active tests in the student cabinet. Students don't need to see `allowed_attempts` in the list - they only need it when they actually start taking the test, which is loaded via `get-speaking-test-new.js?action=test&test_id=X`.

**Rationale**: 
- The view is for the test list (cabinet view)
- `allowed_attempts` is only needed when taking the test
- Full test data (including `allowed_attempts`) is loaded separately via `get-speaking-test-new.js` when student starts the test
- Keeps the view lean and focused on listing information

### 2. Backend Changes

#### 2.1 Update `save-speaking-test-with-assignments.js`
**File**: `functions/save-speaking-test-with-assignments.js`

**Changes**:
1. Accept `allowed_attempts` from request body (line 66)
2. Use `allowed_attempts` instead of `max_attempts` when inserting (line 136)
3. Validate `allowed_attempts` is between 1-3

```javascript
const { 
  teacher_id, 
  test_name, 
  questions,
  assignments,
  // Speaking test specific fields
  time_limit,
  min_duration,
  max_duration,
  allowed_attempts,  // NEW: Add this
  max_attempts,      // Keep for backward compatibility
  min_words,
  passing_score,
  allowed_time
} = JSON.parse(event.body);

// Validate allowed_attempts
if (allowed_attempts !== undefined && (allowed_attempts < 1 || allowed_attempts > 3)) {
  return {
    statusCode: 400,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      message: 'allowed_attempts must be between 1 and 3'
    })
  };
}

// In INSERT statement:
allowed_attempts: ${allowed_attempts || max_attempts || 3}
```

### 3. Frontend - Teacher (Test Creation)

#### 3.1 Update `SpeakingTestCreator.jsx`
**File**: `src/components/test/SpeakingTestCreator.jsx`

**Changes**:
1. Add `allowed_attempts` to `formData` state (default: 3)
2. Add dropdown UI in "Scoring Settings" section
3. Update `handleSubmit` to include `allowed_attempts` in test data

```javascript
const [formData, setFormData] = useState({
  min_words: 50,
  allowed_attempts: 3,  // NEW: Add this
  questions: [...]
});

// In JSX, add after "Minimum Word Count" field:
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Number of Attempts *
  </label>
  <select
    value={formData.allowed_attempts}
    onChange={(e) => handleInputChange('allowed_attempts', parseInt(e.target.value))}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value={1}>1 Attempt</option>
    <option value={2}>2 Attempts</option>
    <option value={3}>3 Attempts</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Students will be able to record and re-record their response this many times before submitting.
  </p>
</div>

// In handleSubmit:
const testDataForParent = {
  // ... existing fields
  allowed_attempts: formData.allowed_attempts,  // NEW
  max_attempts: formData.allowed_attempts,      // Keep for backward compatibility
  // ... rest of fields
};
```

#### 3.2 Update `TeacherTests.jsx`
**File**: `src/teacher/TeacherTests.jsx`

**Changes**:
1. Update `handleSpeakingTestSave` to pass `allowed_attempts` to backend (around line 1154)

```javascript
const testData = {
  // ... existing fields
  allowed_attempts: speakingData.allowed_attempts,  // NEW
  max_attempts: speakingData.allowed_attempts,      // Keep for backward compatibility
  // ... rest of fields
};
```

### 4. Frontend - Student (Test Taking)

#### 4.1 Update `SpeakingTestStudent.jsx`
**File**: `src/components/test/SpeakingTestStudent.jsx`

**Changes**:
1. Read `allowed_attempts` from `testData` instead of `max_attempts` (line 25)
2. Keep backward compatibility: `testData.allowed_attempts || testData.max_attempts || 3`
3. **Add error handling for AI submission failures** (NEW)

```javascript
const [maxAttempts] = useState(
  testData.allowed_attempts || testData.max_attempts || 3
);

// NEW: Add state for error handling and retry
const [submissionError, setSubmissionError] = useState(null);
const [failedPayload, setFailedPayload] = useState(null); // Store payload for retry
const [isResending, setIsResending] = useState(false);
```

**Error Handling Implementation**:

```javascript
const handleRecordingComplete = useCallback(async (audioBlobData, recordingDuration) => {
  // ... existing code ...
  
  try {
    // Convert WebM blob to WAV 16kHz for AI processing
    const wavBlob = await convertBlobToWav16kHz(audioBlobData, null);
    const wavBase64 = await blobToBase64(wavBlob);
    
    // Prepare payload
    const payload = {
      test_id: testData.test_id,
      question_id: testData.question_id || 1,
      audio_blob: wavBase64,
      audio_mime_type: 'audio/wav'
    };
    
    // Store payload for potential retry
    setFailedPayload(payload);
    
    try {
      const response = await makeAuthenticatedRequest('/.netlify/functions/process-speaking-audio-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Check if response is valid JSON
      let result;
      try {
        const responseText = await response.text();
        result = JSON.parse(responseText);
      } catch (jsonError) {
        // Handle invalid JSON (Assembly AI server overload)
        throw new Error('AI_SERVER_ERROR');
      }
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'AI processing failed');
      }
      
      // Success - clear error state
      setSubmissionError(null);
      setFailedPayload(null);
      
      // ... continue with success handling ...
      
    } catch (error) {
      // Handle AI submission errors
      console.error('🎤 AI submission error:', error);
      
      // Preserve the recording blob
      setAudioBlob(audioBlobData);
      setAudioMimeType(audioBlobData?.type || 'audio/webm');
      
      // Set user-friendly error message
      let errorMessage = 'Looks like AI servers are overloaded, please try again';
      if (error.message === 'AI_SERVER_ERROR' || error.message.includes('JSON') || error.message.includes('invalid')) {
        errorMessage = 'Looks like AI servers are overloaded, please try again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmissionError(errorMessage);
      setCurrentStep('error'); // NEW: Add error step
      setIsProcessing(false); // Allow retry
    }
  } catch (error) {
    console.error('🎤 Recording processing error:', error);
    setError(error.message || 'Failed to process recording');
    setCurrentStep('recording');
    setIsProcessing(false);
  }
}, [/* dependencies */]);

// NEW: Handle resending to AI (not submitting to DB)
const handleResend = useCallback(async () => {
  if (!failedPayload || !audioBlob) {
    return;
  }
  
  setIsResending(true);
  setSubmissionError(null);
  setCurrentStep('processing');
  
  try {
    const response = await makeAuthenticatedRequest('/.netlify/functions/process-speaking-audio-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failedPayload) // Use same payload
    });
    
    let result;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (jsonError) {
      throw new Error('AI_SERVER_ERROR');
    }
    
    if (!result.success) {
      throw new Error(result.message || result.error || 'AI processing failed');
    }
    
    // Success - clear error state
    setSubmissionError(null);
    setFailedPayload(null);
    setIsResending(false);
    
    // Continue with success handling...
    
  } catch (error) {
    console.error('🎤 Resend error:', error);
    let errorMessage = 'Looks like AI servers are overloaded, please try again';
    if (error.message === 'AI_SERVER_ERROR' || error.message.includes('JSON')) {
      errorMessage = 'Looks like AI servers are overloaded, please try again';
    }
    setSubmissionError(errorMessage);
    setCurrentStep('error');
    setIsResending(false);
  }
}, [failedPayload, audioBlob, makeAuthenticatedRequest]);
```

**Error UI Rendering** (add to render section):

```javascript
{currentStep === 'error' && submissionError && (
  <div className={`p-6 rounded-lg ${
    isCyberpunk 
      ? 'bg-red-900/50 border border-red-500' 
      : isKpop 
      ? 'bg-red-500/10 border border-red-500/50' 
      : 'bg-red-50 border border-red-200'
  }`}
  style={isCyberpunk ? { ...themeStyles.glowRed } : isKpop ? { ...themeStyles.shadow } : {}}>
    <div className="flex items-start space-x-3">
      <span className="text-2xl">⚠️</span>
      <div className="flex-1">
        <h3 className={`text-lg font-semibold mb-2 ${
          isCyberpunk ? 'text-red-400' : isKpop ? 'text-red-400' : 'text-red-800'
        }`}>
          {isCyberpunk ? 'ERROR: AI PROCESSING FAILED' : 'AI Processing Error'}
        </h3>
        <p className={`mb-4 ${
          isCyberpunk ? 'text-red-300 font-mono' : isKpop ? 'text-red-300' : 'text-red-700'
        }`}>
          {submissionError}
        </p>
        <p className={`text-sm mb-4 ${
          isCyberpunk ? 'text-cyan-400 font-mono' : isKpop ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Your recording has been saved. Click "Resend" to try again.
        </p>
        <button
          onClick={handleResend}
          disabled={isResending}
          className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
            isCyberpunk 
              ? 'bg-green-600 text-black font-mono' 
              : isKpop 
              ? 'bg-green-500 text-white' 
              : 'bg-green-600 text-white'
          } ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={isCyberpunk ? { ...themeStyles.glowGreen } : isKpop ? { ...themeStyles.shadow } : {}}
        >
          <span>{isResending ? '⏳' : '🔄'}</span>
          <span>{isResending ? (isCyberpunk ? 'RESENDING...' : 'Resending...') : (isCyberpunk ? 'RESEND' : 'Resend')}</span>
        </button>
      </div>
    </div>
  </div>
)}
```

**Key Requirements**:
- ✅ Preserve recording blob on error (don't lose it)
- ✅ Store failed payload for retry
- ✅ User-friendly error message for server overload
- ✅ "Resend" button to retry with same payload (sends to AI, not DB)
- ✅ Theme-aware error UI (light, cyberpunk, kpop)
- ✅ Mobile-optimized error display
- ✅ Handle JSON parse errors specifically
- ✅ Show loading state during resend
- ✅ Note: "Resend" = send to AI again; "Submit" = final submission to database

#### 4.2 Update `AudioRecorder.jsx`
**File**: `src/components/test/AudioRecorder.jsx`

**Current Behavior**:
- Shows "Record" button initially
- Shows "Pause"/"Resume" and "Stop & Submit" buttons during recording
- After stopping, recording is automatically submitted

**Required Changes**:

1. **Button Flow**:
   - **During recording**: Show "Stop" button (not "Stop & Submit")
   - **After stopping**: Show "Rerecord" and "Send" buttons
   - **"Send" button**: Triggers submission (calls `onRecordingComplete`)

2. **Mobile Optimization**:
   - All buttons must be touch-friendly (min 48px height)
   - Full-width on mobile, auto-width on desktop
   - Proper spacing between buttons
   - Large, clear text/icons

3. **Theme Support**:
   - **Light theme**: Standard button styling
   - **Cyberpunk theme**: Neon colors, glow effects, monospace font
   - **K-pop theme**: Vibrant colors, shadows, rounded corners
   - Use existing theme utilities: `useTheme()`, `getThemeStyles()`, `CYBERPUNK_COLORS`, `KPOP_COLORS`

**Implementation**:
```javascript
// Add new state
const [isStopped, setIsStopped] = useState(false);
const [stoppedBlob, setStoppedBlob] = useState(null);

// Modify stopRecording function
const stopRecording = () => {
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
    setIsStopped(true);  // NEW: Set stopped state
    // Don't call onRecordingComplete here - wait for "Send" button
  }
};

// Add new function to handle "Send" button
const handleSend = () => {
  if (stoppedBlob) {
    onRecordingComplete(stoppedBlob, recordingDuration);
    setIsStopped(false);
    setStoppedBlob(null);
  }
};

// Add new function to handle "Rerecord" button
const handleRerecord = () => {
  setAudioChunks([]);
  setStoppedBlob(null);
  setIsStopped(false);
  setIsRecording(false);
  setIsPaused(false);
  // Reset recording state
};

// In mediaRecorder.onstop:
mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
  setStoppedBlob(audioBlob);  // Store blob but don't submit yet
  setAudioChunks([]);
};

// Update button rendering with themes and mobile optimization:
{isRecording && !isStopped && (
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    {/* Pause/Resume buttons (existing) */}
    {!isPaused ? (
      <button
        onClick={pauseRecording}
        className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
          isCyberpunk 
            ? 'bg-yellow-600 text-black font-mono' 
            : isKpop 
            ? 'bg-yellow-500 text-white' 
            : 'bg-yellow-600 text-white'
        }`}
        style={isCyberpunk ? { ...themeStyles.glowYellow } : isKpop ? { ...themeStyles.shadow } : {}}
      >
        <span>⏸️</span>
        <span>Pause</span>
      </button>
    ) : (
      <button
        onClick={resumeRecording}
        className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
          isCyberpunk 
            ? 'bg-green-600 text-black font-mono' 
            : isKpop 
            ? 'bg-green-500 text-white' 
            : 'bg-green-600 text-white'
        }`}
        style={isCyberpunk ? { ...themeStyles.glowGreen } : isKpop ? { ...themeStyles.shadow } : {}}
      >
        <span>▶️</span>
        <span>Resume</span>
      </button>
    )}
    
    {/* Stop button */}
    <button
      onClick={stopRecording}
      className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
        isCyberpunk 
          ? 'bg-red-600 text-black font-mono' 
          : isKpop 
          ? 'bg-red-500 text-white' 
          : 'bg-red-600 text-white'
      }`}
      style={isCyberpunk ? { ...themeStyles.glowRed } : isKpop ? { ...themeStyles.shadow } : {}}
    >
      <span>⏹️</span>
      <span>Stop</span>
    </button>
  </div>
)}

{isStopped && stoppedBlob && (
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    {/* Rerecord button */}
    <button
      onClick={handleRerecord}
      className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
        isCyberpunk 
          ? 'bg-yellow-600 text-black font-mono' 
          : isKpop 
          ? 'bg-yellow-500 text-white' 
          : 'bg-yellow-600 text-white'
      }`}
      style={isCyberpunk ? { ...themeStyles.glowYellow } : isKpop ? { ...themeStyles.shadow } : {}}
    >
      <span>🔄</span>
      <span>{isCyberpunk ? 'RE-RECORD' : 'Rerecord'}</span>
    </button>
    
    {/* Send button */}
    <button
      onClick={handleSend}
      className={`w-full sm:w-auto px-6 py-4 rounded-full min-h-[48px] text-lg font-semibold flex items-center justify-center space-x-2 ${
        isCyberpunk 
          ? 'bg-green-600 text-black font-mono' 
          : isKpop 
          ? 'bg-green-500 text-white' 
          : 'bg-green-600 text-white'
      }`}
      style={isCyberpunk ? { ...themeStyles.glowGreen } : isKpop ? { ...themeStyles.shadow } : {}}
    >
      <span>📤</span>
      <span>{isCyberpunk ? 'SEND' : 'Send'}</span>
    </button>
  </div>
)}
```

**Key Requirements**:
- ✅ Mobile-first: Full-width buttons on mobile (`w-full sm:w-auto`)
- ✅ Touch-friendly: Minimum 48px height (`min-h-[48px]`)
- ✅ Theme-aware: Use `isCyberpunk`, `isKpop`, `themeStyles`
- ✅ Responsive: Flex column on mobile, row on desktop
- ✅ Clear labels: Icons + text for clarity
- ✅ Consistent styling: Follow existing button patterns in the component

**Note**: This is a significant UI change. Need to coordinate with `SpeakingTestStudent.jsx` to ensure the flow works correctly. Check existing button patterns in `AudioRecorder.jsx` for theme implementation details.

### 5. API/Backend - Reading Test Data

#### 5.1 Update `get-speaking-test-new.js`
**File**: `functions/get-speaking-test-new.js`

**Changes**:
- Add `st.allowed_attempts` to SELECT statements (currently only has `st.max_attempts` on line 217)
- Include `allowed_attempts` in the test object returned to frontend
- Keep `max_attempts` for backward compatibility

**Location**: Around line 217 in the `action === 'test'` case

```javascript
// Current (line 217):
st.max_attempts, st.min_words, st.passing_score, st.allowed_time,

// Updated:
st.allowed_attempts, st.max_attempts, st.min_words, st.passing_score, st.allowed_time,
```

**Rationale**: Students need `allowed_attempts` when loading test data

### 6. Testing Checklist

**Database & Backend**:
- [ ] Database migration runs successfully
- [ ] Existing tests with `max_attempts` still work (backward compatibility)
- [ ] Teacher can create test with 1, 2, or 3 attempts
- [ ] `allowed_attempts` is saved correctly in database
- [ ] `get-speaking-test-new.js` returns `allowed_attempts` when fetching test data

**Frontend - Teacher**:
- [ ] Dropdown shows 1, 2, 3 options
- [ ] Selected value is passed to backend correctly

**Frontend - Student**:
- [ ] Student sees correct number of attempts when loading test (via `get-speaking-test-new.js`)
- [ ] Student can start recording
- [ ] **During recording**: "Stop" button is visible and functional
- [ ] **After stopping**: "Rerecord" and "Send" buttons are visible
- [ ] "Rerecord" button allows new recording (resets state)
- [ ] "Send" button submits the recording (calls `onRecordingComplete`)
- [ ] Attempt tracking still works correctly

**Error Handling**:
- [ ] Recording is preserved when AI submission fails
- [ ] Error message shows "Looks like AI servers are overloaded, please try again" for JSON/invalid response errors
- [ ] "Resend" button is visible and functional on error
- [ ] "Resend" sends the same payload that failed (to AI processing endpoint)
- [ ] Error UI is theme-aware (light, cyberpunk, kpop)
- [ ] Error UI is mobile-optimized
- [ ] Loading state shows during resend ("Resending...")
- [ ] Success after resend clears error state
- [ ] Multiple resends work correctly
- [ ] Distinction clear: "Resend" = AI processing, "Submit" = final DB submission

**Mobile Optimization**:
- [ ] Buttons are full-width on mobile devices
- [ ] Buttons have minimum 48px height (touch-friendly)
- [ ] Buttons stack vertically on mobile, horizontally on desktop
- [ ] Text and icons are clearly visible on mobile
- [ ] Spacing between buttons is adequate

**Theme Support**:
- [ ] **Light theme**: Buttons use standard styling
- [ ] **Cyberpunk theme**: Buttons have neon colors, glow effects, monospace font
- [ ] **K-pop theme**: Buttons have vibrant colors, shadows, rounded corners
- [ ] All themes maintain consistent button behavior
- [ ] Theme switching works correctly during test

## Implementation Order

1. **Database Changes** (First - foundation)
   - Add `allowed_attempts` column
   - Update view if needed
   - Test migration

2. **Backend Changes** (Second - data layer)
   - Update `save-speaking-test-with-assignments.js`
   - Update any GET functions to return `allowed_attempts`

3. **Frontend - Teacher** (Third - creation)
   - Update `SpeakingTestCreator.jsx`
   - Update `TeacherTests.jsx`

4. **Frontend - Student** (Fourth - consumption)
   - Update `SpeakingTestStudent.jsx` to read `allowed_attempts`
   - Update `AudioRecorder.jsx` for new button flow

5. **Testing** (Fifth - validation)
   - Test full flow: Create → Assign → Take → Submit
   - Test with 1, 2, and 3 attempts
   - Test backward compatibility

## Migration Strategy

### Backward Compatibility
- Keep `max_attempts` in code for now (deprecate later)
- Use `allowed_attempts || max_attempts || 3` pattern
- Existing tests will work with default value of 3

### Data Migration
- All existing `speaking_tests` records will get `allowed_attempts = 3` (from `max_attempts`)
- No data loss
- No breaking changes

## Files to Modify

1. `database/database_schema_migration.sql` - Add `allowed_attempts` column
2. ~~`database/views/student_active_tests_view.sql`~~ - **NOT NEEDED** (view is only for listing, not test details)
3. `functions/save-speaking-test-with-assignments.js` - Accept and save `allowed_attempts`
4. `functions/get-speaking-test-new.js` - Return `allowed_attempts` when fetching test data (this is where students get it)
5. `src/components/test/SpeakingTestCreator.jsx` - Add dropdown UI for attempts selection
6. `src/teacher/TeacherTests.jsx` - Pass `allowed_attempts` to backend
7. `src/components/test/SpeakingTestStudent.jsx` - Read `allowed_attempts` from test data + **Add error handling for AI submission failures**
8. `src/components/test/AudioRecorder.jsx` - Update button flow (Stop → Rerecord/Send)

## Notes

- The term "allowed_attempts" is clearer than "max_attempts" which conflicts with retest system
- UI change (Stop → Rerecord/Send) improves UX by giving students control
- Backward compatibility ensures existing tests continue to work
- Constraint (1-3) matches current system behavior
- **Error handling**: When Assembly AI servers are overloaded (invalid JSON response), the recording is preserved and students can retry without losing their work. This prevents frustration and data loss during server issues.

