# Speaking Test Audio Optimization Plan

## Problem Statement
Speaking test audio files are too large, causing performance issues and increased storage costs. We need to optimize the audio recording, processing, and storage workflow while maintaining compatibility with Assembly AI and Supabase.

## Current Implementation Analysis

### Current Flow
1. **Recording**: AudioRecorder records in browser's preferred format (typically WebM/Opus) - **we have blob**
2. **Conversion**: Converts to WAV using `convertBlobToWav()` (preserves original sample rate, typically 44.1kHz or 48kHz)
3. **AI Processing**: Sends WAV to Assembly AI for transcription
4. **Storage**: Sends WAV to Supabase Storage

### Issues
- High sample rates (44.1kHz/48kHz) create large WAV files when converting from WebM blob
- Large WAV files slow down uploads and increase costs
- Assembly AI accepts various formats but WAV is preferred for compatibility
- Supabase storage costs increase with file size (currently storing WAV instead of optimized WebM)

## Solution Overview

### Target Specifications
- **Recording Sample Rate**: 16 kHz (optimal for speech recognition)
- **AI Processing Format**: WAV at 16 kHz
- **Final Storage Format**: WebM (smaller file size, better compression)
- **Bit Depth**: 16-bit (standard for speech)

### Workflow
1. **Record** WebM/Opus blob (already done - AudioRecorder produces this)
2. **Convert blob to WAV** at 16 kHz for Assembly AI (resample if needed)
3. **Send WAV** to Assembly AI for transcription and feedback
4. **Use original WebM blob** (or optimize if needed) for final submission
5. **Store WebM** in Supabase (much smaller than WAV)

## Implementation Plan

### Phase 1: Audio Recording Configuration

#### 1.1 AudioRecorder Component (No Changes Needed)
**File**: `src/components/test/AudioRecorder.jsx`

**Current State**:
- Already records as WebM/Opus blob (line 109-117)
- Already converts to WAV in `onstop` handler (line 133)
- Produces blob that we can work with

**Notes**:
- The WebM blob from MediaRecorder may have variable sample rates depending on browser
- We'll handle resampling during WAV conversion (Phase 2)
- No changes needed to recording logic itself

### Phase 2: Audio Conversion Utilities

#### 2.1 Existing WAV Conversion Analysis
**File**: `src/utils/audioConversion.js`

**Current `convertBlobToWav()` Function**:
- **Location**: `src/utils/audioConversion.js` line 1-23
- **Current Usage**: Called in `AudioRecorder.jsx` line 133
- **Behavior**:
  1. Takes a blob (typically WebM/Opus from MediaRecorder) and AudioContext
  2. If blob is already WAV, returns it as-is
  3. Otherwise:
     - Decodes blob to AudioBuffer using `decodeAudioData()`
     - Converts AudioBuffer to WAV using `audioBufferToWav()`
     - Returns WAV blob

**Current `audioBufferToWav()` Function**:
- **Location**: `src/utils/audioConversion.js` line 57-114
- **Key Issue**: Line 59 uses `const sampleRate = buffer.sampleRate || 44100;`
  - This **preserves the original sample rate** from the decoded AudioBuffer
  - If browser records at 44.1kHz or 48kHz, WAV will be at that rate
  - No resampling occurs - file size remains large

**Current Flow in AudioRecorder**:
```javascript
// AudioRecorder.jsx line 128-136
mediaRecorder.onstop = async () => {
  let audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
  
  // Converts to WAV but preserves original sample rate (44.1kHz/48kHz)
  audioBlob = await convertBlobToWav(audioBlob, audioContextRef.current);
  
  // Passes WAV blob to onRecordingComplete callback
  onRecordingComplete(audioBlob, recordingTime);
};
```

**Problem**: The existing conversion creates large WAV files because it doesn't resample to 16kHz.

#### 2.2 Update audioConversion.js
**File**: `src/utils/audioConversion.js`

**New Functions Needed**:

1. **`convertBlobToWav16kHz(blob, audioContext)`**
   - Convert WebM/Opus blob (or any audio blob) to WAV format
   - Decode blob to AudioBuffer
   - Resample to 16 kHz if needed (browsers may record at 44.1kHz/48kHz)
   - Ensure mono channel
   - 16-bit depth
   - Return WAV blob for Assembly AI

2. **`resampleAudioBuffer(audioBuffer, targetSampleRate)`**
   - Resample AudioBuffer to target sample rate (16 kHz)
   - Use OfflineAudioContext for efficient resampling
   - Handle channel conversion (stereo to mono if needed)

**Note**: We don't need `convertBlobToWebM()` since we already have a WebM blob from recording. We'll use the original blob for final storage.

**Implementation Details**:
```javascript
export async function convertBlobToWav16kHz(blob, audioContext) {
  // Similar to existing convertBlobToWav() but with resampling:
  // 1. Decode blob to AudioBuffer (same as existing)
  // 2. Resample AudioBuffer to 16 kHz using resampleAudioBuffer()
  // 3. Convert to mono if stereo using convertToMono()
  // 4. Encode as 16-bit WAV using existing audioBufferToWav() function
  // 5. Return Blob with type 'audio/wav'
  // 
  // Key difference from convertBlobToWav():
  // - Existing: Uses buffer.sampleRate directly (preserves original rate)
  // - New: Resamples to 16kHz before encoding
}
```

**Reuse Existing Functions**:
- `getAudioContext()` - already exists, can reuse
- `decodeAudioData()` - already exists, can reuse  
- `audioBufferToWav()` - already exists, can reuse (but will receive 16kHz buffer)
- `writeString()` - already exists, can reuse

**New Helper Functions Needed**:
- `resampleAudioBuffer()` - resample AudioBuffer to target sample rate
- `convertToMono()` - convert multi-channel to mono

#### 2.3 Resampling Strategy
- **Option A**: Use Web Audio API ScriptProcessorNode (deprecated but widely supported)
- **Option B**: Use OfflineAudioContext for resampling
- **Option C**: Use external library (e.g., `resampler-js`)
- **Recommended**: OfflineAudioContext (modern, efficient)

**Resampling Implementation**:
```javascript
async function resampleAudioBuffer(audioBuffer, targetSampleRate) {
  const originalSampleRate = audioBuffer.sampleRate;
  
  // If already at target rate, return as-is
  if (originalSampleRate === targetSampleRate) {
    return audioBuffer;
  }
  
  const numberOfChannels = audioBuffer.numberOfChannels;
  const ratio = targetSampleRate / originalSampleRate;
  const newLength = Math.round(audioBuffer.length * ratio);
  
  // Use OfflineAudioContext for efficient resampling
  const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContext) {
    console.warn('OfflineAudioContext not supported, cannot resample');
    return audioBuffer; // Fallback: return original
  }
  
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    newLength,
    targetSampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  try {
    return await offlineContext.startRendering();
  } catch (error) {
    console.warn('Resampling failed, returning original buffer', error);
    return audioBuffer; // Fallback: return original
  }
}

async function convertToMono(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }
  
  // Use OfflineAudioContext with ChannelMerger to mix stereo to mono
  // or ChannelSplitter to extract first channel for multi-channel
  // Implementation similar to resampleAudioBuffer but for channel conversion
}
```

**Key Points**:
- Reuse existing `audioBufferToWav()` function - it will automatically use the 16kHz sample rate from the resampled buffer
- The existing function reads `buffer.sampleRate` (line 59), so resampling before calling it will work correctly
- No need to modify `audioBufferToWav()` - it's already flexible

### Phase 3: Update SpeakingTestStudent Component

#### 3.1 Modify handleRecordingComplete
**File**: `src/components/test/SpeakingTestStudent.jsx`

**Changes**:
- Convert to WAV 16 kHz for AI processing
- Keep original blob for final conversion
- Send WAV to Assembly AI
- Convert to WebM for final submission

**Flow**:
```javascript
const handleRecordingComplete = async (audioBlobData, recordingDuration) => {
  // audioBlobData is already a WebM/Opus blob from AudioRecorder
  
  // 1. Convert WebM blob to WAV 16 kHz for AI processing
  const wavBlob = await convertBlobToWav16kHz(audioBlobData, audioContextRef.current);
  const wavBase64 = await blobToBase64(wavBlob);
  
  // 2. Send WAV to AI for feedback
  const response = await makeAuthenticatedRequest('/.netlify/functions/process-speaking-audio-ai', {
    method: 'POST',
    body: JSON.stringify({
      test_id: testData.test_id,
      question_id: testData.question_id || 1,
      audio_blob: wavBase64,
      audio_mime_type: 'audio/wav'
    })
  });
  
  // 3. Store original WebM blob for final submission (no conversion needed)
  setAudioBlob(audioBlobData);
  setAudioMimeType(audioBlobData.type || 'audio/webm'); // Keep original format
};
```

#### 3.2 Modify handleSubmitTest
**File**: `src/components/test/SpeakingTestStudent.jsx`

**Changes**:
- Convert to WebM before final submission
- Send WebM to Supabase

**Flow**:
```javascript
const handleSubmitTest = async () => {
  // audioBlob is already WebM/Opus from recording - use it directly
  const webmBase64 = await blobToBase64(audioBlob);
  
  // Submit with original WebM blob (much smaller than WAV)
  const finalSubmissionData = {
    // ... other fields
    audio_blob: webmBase64,
    audio_mime_type: audioMimeType || 'audio/webm' // Use stored mime type
  };
  
  // Send to backend
  await makeAuthenticatedRequest('/.netlify/functions/submit-speaking-test-final', {
    method: 'POST',
    body: JSON.stringify(finalSubmissionData)
  });
};
```

### Phase 4: Backend Function Updates

#### 4.1 Update process-speaking-audio-ai.js
**File**: `functions/process-speaking-audio-ai.js`

**Changes**:
- Accept WAV format (already does)
- Add validation for 16 kHz sample rate (optional, for logging)
- Ensure proper handling of WAV format

**Notes**:
- Assembly AI accepts WAV at various sample rates
- 16 kHz is optimal for speech recognition
- No changes needed if already accepting WAV

#### 4.2 Update submit-speaking-test-final.js
**File**: `functions/submit-speaking-test-final.js`

**Changes**:
- Accept WebM format for final storage
- Update `getStorageInfoForMime()` to handle WebM properly
- Ensure correct content type for Supabase upload

**Implementation**:
```javascript
function getStorageInfoForMime(mimeType) {
  const normalized = (mimeType || '').toLowerCase();
  
  if (normalized === 'audio/webm' || normalized === 'audio/webm;codecs=opus') {
    return { extension: 'webm', contentType: 'audio/webm' };
  }
  
  // ... other formats
}
```

### Phase 5: WebM Storage (No Encoding Needed)

**Status**: No WebM encoding needed - we already have WebM blob from recording

**Notes**:
- AudioRecorder already produces WebM/Opus blob (line 109-117, 129-130)
- We'll use the original blob directly for Supabase storage
- WebM/Opus is already highly compressed and optimized
- No additional conversion required - just use the blob we already have

### Phase 6: Testing & Validation

#### 6.1 Test Cases
1. **WebM Recording**
   - Verify WebM/Opus blob is created correctly
   - Test on Chrome, Firefox, Safari, Edge
   - Test on mobile devices
   - Verify blob size is reasonable

2. **WAV Conversion (16 kHz)**
   - Verify WebM blob converts to WAV correctly
   - Verify resampling to 16 kHz works
   - Verify file size reduction (compared to 44.1kHz WAV)
   - Test with Assembly AI (should work with 16 kHz WAV)

3. **WebM Storage**
   - Verify original WebM blob is used
   - Verify file size is smaller than WAV
   - Test Supabase upload with WebM format

4. **End-to-End Flow**
   - Record WebM → Convert to WAV 16kHz → AI → Use original WebM → Supabase
   - Verify all steps work correctly
   - Verify file sizes are reduced (WAV for AI, WebM for storage)

#### 6.2 File Size Comparison
- **Current**: ~500KB - 2MB per recording (44.1kHz WAV stored in Supabase)
- **Target**: 
  - WAV 16kHz for AI: ~200KB - 800KB (50-70% reduction, only sent to Assembly AI)
  - WebM for storage: ~50KB - 200KB (90% reduction, original blob from recording)

#### 6.3 Performance Metrics
- Upload time reduction
- Storage cost reduction
- Processing time (should remain similar)

## Implementation Checklist

### Frontend Changes
- [ ] Update `audioConversion.js` with new conversion functions
  - [ ] `convertBlobToWav16kHz()` - convert WebM blob to WAV 16kHz (reuses existing functions)
  - [ ] `resampleAudioBuffer()` - resample AudioBuffer to 16 kHz (new helper)
  - [ ] `convertToMono()` - convert multi-channel to mono (new helper)
  - [ ] Keep existing `convertBlobToWav()` unchanged (may be used elsewhere)
- [ ] Update `SpeakingTestStudent.jsx` to use new conversion flow
  - [ ] Import `convertBlobToWav16kHz` instead of `convertBlobToWav` for AI processing
  - [ ] Convert WebM blob to WAV 16kHz for AI processing
  - [ ] Use original WebM blob for final submission (no conversion needed)
- [ ] Update `AudioRecorder.jsx` (optional - may want to keep existing behavior for compatibility)
  - [ ] Consider: Keep existing `convertBlobToWav()` call, or change to `convertBlobToWav16kHz()`?
  - [ ] Decision: Since SpeakingTestStudent handles conversion, AudioRecorder can stay as-is
- [ ] Add error handling for conversion failures
- [ ] Add fallback for browsers that don't support resampling (return original blob)

### Backend Changes
- [ ] Verify `process-speaking-audio-ai.js` handles WAV correctly
- [ ] Update `submit-speaking-test-final.js` to handle WebM
- [ ] Update `getStorageInfoForMime()` for WebM
- [ ] Add logging for file sizes and formats

### Testing
- [ ] Test recording at 16 kHz on multiple browsers
- [ ] Test WAV conversion and AI processing
- [ ] Test WebM conversion and Supabase upload
- [ ] Test end-to-end flow
- [ ] Measure file size reductions
- [ ] Test error handling and fallbacks

## Browser Compatibility Notes

### Sample Rate Support
- **Chrome/Edge**: Supports 16 kHz, may need resampling
- **Firefox**: Supports 16 kHz, may need resampling
- **Safari**: May default to 48 kHz, will need resampling
- **Mobile**: Varies by device and browser

### WebM Support
- **Chrome/Edge**: Full WebM/Opus support
- **Firefox**: Full WebM/Opus support
- **Safari**: Limited WebM support (may need fallback to MP4)
- **Mobile**: Generally good support

### Fallback Strategy
1. Try to record at 16 kHz
2. If not supported, record at native rate and resample
3. For WebM, fallback to MP4 if needed (Safari)

## Risk Mitigation

### Risks
1. **Browser limitations**: Some browsers may not support 16 kHz recording
   - **Mitigation**: Implement resampling fallback
   
2. **WebM encoding issues**: MediaRecorder may fail on some browsers
   - **Mitigation**: Fallback to original format or MP4
   
3. **Audio quality degradation**: Lower sample rate may affect quality
   - **Mitigation**: 16 kHz is standard for speech, quality should be acceptable
   
4. **Conversion errors**: Audio conversion may fail
   - **Mitigation**: Comprehensive error handling and fallbacks

## Success Criteria
- [ ] File sizes reduced by at least 50% for WAV
- [ ] File sizes reduced by at least 80% for final WebM storage
- [ ] AI processing still works correctly with 16 kHz WAV
- [ ] Supabase storage accepts WebM format
- [ ] No degradation in audio quality for speech recognition
- [ ] All browsers tested and working

## Timeline Estimate
- **Phase 1**: 0 days (no changes needed - already have WebM blob)
- **Phase 2**: 2-3 days (conversion utilities for WAV 16kHz)
- **Phase 3**: 1-2 days (component updates)
- **Phase 4**: 1 day (backend updates)
- **Phase 5**: 0 days (no WebM encoding needed - use original blob)
- **Phase 6**: 2-3 days (testing and validation)
- **Total**: 6-9 days

## Dependencies
- Web Audio API (already used)
- MediaRecorder API (already used)
- No new external libraries required (preferred)
- Optional: `resampler-js` if native resampling fails

## Notes
- 16 kHz is optimal for speech recognition (human speech range: 300-3400 Hz)
- WebM/Opus provides excellent compression for speech
- Assembly AI accepts WAV at various sample rates, 16 kHz is recommended
- Supabase Storage accepts various formats, WebM is efficient for storage

