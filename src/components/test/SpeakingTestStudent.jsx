import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import AudioRecorder from './AudioRecorder';
import FeedbackDisplay from './FeedbackDisplay';
import TestResults from './TestResults';
import Button from '../ui/Button';
import PerfectModal from '../ui/PerfectModal';

const SpeakingTestStudent = ({ testData, onComplete, onExit, onTestComplete }) => {
  const [currentStep, setCurrentStep] = useState('recording'); // permission, recording, processing, feedback, completed
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [scores, setScores] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [error, setError] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [maxAttempts] = useState(testData.max_attempts || 3);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // iOS detection function
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };
  
  // Progress tracking (like other tests)
  const [testProgress, setTestProgress] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  
  const api = useApi();
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = api;
  const recordingRef = useRef(null);
  
  // Load attempts from localStorage on component mount
  useEffect(() => {
    if (testData?.test_id && user?.student_id) {
      const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
      const savedAttempts = localStorage.getItem(attemptsKey);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        if (attempts > 0 && attempts <= maxAttempts) {
          setAttemptNumber(attempts);
          console.log('🔄 Loaded attempts from localStorage:', attempts);
        }
      }
    }
  }, [testData, user, maxAttempts]);

  // Start test timer when component mounts (like other tests)
  useEffect(() => {
    if (testData && !testStartTime) {
      const startTime = new Date();
      setTestStartTime(startTime);
      console.log('⏱️ Speaking test timer started at:', startTime.toISOString());
    }
  }, [testData, testStartTime]);
  
  // Calculate progress (like other tests)
  useEffect(() => {
    let progress = 0;
    if (currentStep === 'recording') progress = 25;
    else if (currentStep === 'processing') progress = 50;
    else if (currentStep === 'feedback') progress = 75;
    else if (currentStep === 'completed') progress = 100;
    
    setTestProgress(progress);
  }, [currentStep]);


  // Automatically request microphone permission when component mounts
  useEffect(() => {
    const requestPermission = async () => {
      try {
        console.log('🎤 Automatically requesting microphone permission...');
        
        // Check if we're in a secure context (required for iOS)
        if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
          setError('Microphone access requires HTTPS. Please use a secure connection.');
          return;
        }
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
          return;
        }
        
        // For iOS Safari, we need to request permission in a user interaction
        if (isIOS()) {
          // Don't show error message for iOS - let the user try the button
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.log('🎤 Microphone permission granted!');
        setHasMicPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('🎤 Microphone permission denied:', err);
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Microphone access failed. Please check your browser settings and try again.');
        }
      }
    };
    
    requestPermission();
  }, []);

  // Request microphone permission with forced popup
  const requestMicPermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        setError('Microphone access requires HTTPS or localhost. Please use a secure connection.');
        return;
      }
      
      // This should trigger the browser's native permission popup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('🎤 Microphone permission granted!');
      setHasMicPermission(true);
      setCurrentStep('recording');
      
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err) {
      console.error('🎤 Microphone permission denied:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        setError('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      } else {
        setError(`Microphone access failed: ${err.message}`);
      }
    }
  };


  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioBlob && currentStep === 'recording') {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [audioBlob, currentStep]);

  const saveProgress = useCallback(async () => {
    try {
      const progressData = {
        test_id: testData.test_id,
        audio_blob: audioBlob ? await blobToBase64(audioBlob) : null,
        attempt_number: attemptNumber,
        step: currentStep,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`speaking_progress_${testData.test_id}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [testData.test_id, audioBlob, attemptNumber, currentStep]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract just the base64 part, not the data URL
        const result = reader.result;
        const base64 = result.split(',')[1]; // Remove "data:audio/webm;base64," prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Save attempts to localStorage
  const saveAttemptsToStorage = useCallback((attempts) => {
    if (testData?.test_id && user?.student_id) {
      const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
      localStorage.setItem(attemptsKey, attempts.toString());
      console.log('💾 Saved attempts to localStorage:', attempts);
    }
  }, [testData, user]);

  // Save speaking test data to cache (survives page reloads)
  const saveSpeakingTestData = useCallback(async (audioBlob, transcript, scores, recordingTime, currentStep) => {
    if (testData?.test_id && user?.student_id) {
      try {
        const { setCachedData, CACHE_TTL } = await import('../../utils/cacheUtils');
        const cacheKey = `speaking_test_data_${user.student_id}_${testData.test_id}`;
        
        // Convert audio blob to base64 for caching
        const audioBase64 = audioBlob ? await blobToBase64(audioBlob) : null;
        
        const cacheData = {
          audioBlob: audioBase64,
          transcript,
          scores,
          recordingTime,
          currentStep,
          timestamp: Date.now()
        };
        
        setCachedData(cacheKey, cacheData, CACHE_TTL.speaking_test_data);
        console.log('💾 Saved speaking test data to cache:', cacheKey);
      } catch (error) {
        console.error('Failed to save speaking test data to cache:', error);
      }
    }
  }, [testData, user]);

  // Load speaking test data from cache
  const loadSpeakingTestData = useCallback(async () => {
    if (testData?.test_id && user?.student_id) {
      try {
        const { getCachedData } = await import('../../utils/cacheUtils');
        const cacheKey = `speaking_test_data_${user.student_id}_${testData.test_id}`;
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
          console.log('💾 Loaded speaking test data from cache:', cachedData);
          
          // Restore audio blob from base64
          if (cachedData.audioBlob) {
            const audioBlob = new Blob([Uint8Array.from(atob(cachedData.audioBlob), c => c.charCodeAt(0))], { type: 'audio/webm' });
            setAudioBlob(audioBlob);
          }
          
          // Restore other data
          if (cachedData.transcript) setTranscript(cachedData.transcript);
          if (cachedData.scores) setScores(cachedData.scores);
          if (cachedData.recordingTime) setRecordingTime(cachedData.recordingTime);
          if (cachedData.currentStep) setCurrentStep(cachedData.currentStep);
          
          return true; // Data was loaded
        }
      } catch (error) {
        console.error('Failed to load speaking test data from cache:', error);
      }
    }
    return false; // No data was loaded
  }, [testData, user]);

  // Load speaking test data from cache on component mount, but clear if retest
  useEffect(() => {
    if (testData?.test_id && user?.student_id) {
      try {
        const studentId = user.student_id;
        const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
        const inProgressKey = `retest_in_progress_${studentId}_speaking_${testData.test_id}`;
        const isRetest = !!localStorage.getItem(retestAssignKey) || !!localStorage.getItem(inProgressKey);
        if (isRetest) {
          // Clear stored per-test data so previous attempt UI is not shown
          const cacheKey = `speaking_test_data_${studentId}_${testData.test_id}`;
          const antiCheatKey = `anti_cheating_${studentId}_speaking_${testData.test_id}`;
          const progressKey = `speaking_progress_${testData.test_id}`;
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(antiCheatKey);
          localStorage.removeItem(progressKey);
          console.log('🧹 Cleared speaking per-test cache for retest start:', { cacheKey, antiCheatKey, progressKey });
        }
      } catch (_) {}
      loadSpeakingTestData();
    }
  }, [testData, user, loadSpeakingTestData]);

  // Save speaking test data to cache whenever state changes
  useEffect(() => {
    if (testData?.test_id && user?.student_id && (audioBlob || transcript || scores)) {
      saveSpeakingTestData(audioBlob, transcript, scores, recordingTime, currentStep);
    }
  }, [audioBlob, transcript, scores, recordingTime, currentStep, testData, user, saveSpeakingTestData]);

  const handleRecordingComplete = useCallback(async (audioBlobData, recordingDuration) => {
    console.log('🎤 Recording completed, duration:', recordingDuration);
    setAudioBlob(audioBlobData);
    setRecordingTime(recordingDuration);
    setCurrentStep('processing');
    setError(null);

    try {
      // Convert blob to base64 for API
      const audioBase64 = await blobToBase64(audioBlobData);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testData.start_time ? Math.round((endTime - testData.start_time) / 1000) : 0;
      const startedAt = testData.start_time ? new Date(testData.start_time).toISOString() : endTime.toISOString();
      
      // Get retest assignment ID from localStorage (following other tests pattern)
      const studentId = user.student_id;
      const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
      const retestAssignmentId = localStorage.getItem(retestAssignKey);
      
      // Prepare submission data (following other tests pattern)
      const submissionData = {
        test_id: testData.test_id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: studentId,
        question_id: testData.question_id || 1,
        audio_blob: audioBase64,
        audio_duration: audioBlobData.duration || 0,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: false,
        visibility_change_times: 0,
        is_completed: true,
        retest_assignment_id: retestAssignmentId ? Number(retestAssignmentId) : null,
        parent_test_id: testData.test_id
      };
      
      console.log('🎤 Submitting speaking test:', submissionData);
      
      // Process audio immediately with real AI (like other tests do)
      console.log('🎤 Processing audio with AI...');
      
      try {
        // Send audio to backend for AI processing (feedback only)
        const response = await makeAuthenticatedRequest('/.netlify/functions/process-speaking-audio-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testData.test_id,
            question_id: testData.question_id || 1,
            audio_blob: audioBase64
          })
        });
        
        const result = await response.json();
      
      if (result.success) {
        // Set real AI results - map the AI response to the expected format
        console.log('🎤 AI Analysis Result:', result);
        setTranscript(result.transcript);
        
        // Verify word count
        const actualWordCount = result.transcript ? result.transcript.split(/\s+/).filter(word => word.length > 0).length : 0;
        console.log('🎤 Word Count Verification:', {
          aiCount: result.word_count,
          actualCount: actualWordCount,
          transcript: result.transcript
        });
        
        // Use the actual word count instead of AI count for display
        const displayWordCount = actualWordCount;
        
        const mappedScores = {
          overall_score: result.overall_score,
          word_count: displayWordCount, // Use actual word count for display
          // Use AI's actual scores instead of calculating them
          grammar_score: result.grammar_score,
          vocabulary_score: result.vocabulary_score,
          pronunciation_score: result.pronunciation_score,
          fluency_score: result.fluency_score,
          content_score: result.content_score,
          grammar_mistakes: result.grammar_mistakes,
          vocabulary_mistakes: result.vocabulary_mistakes,
          feedback: result.feedback,
          // Add improved transcript for display
          improved_transcript: result.improved_transcript,
          // Add detailed corrections
          grammar_corrections: result.grammar_corrections || [],
          vocabulary_corrections: result.vocabulary_corrections || [],
          language_use_corrections: result.language_use_corrections || [],
          // Include full AI feedback object for persistence on final submit
          ai_feedback: result.ai_feedback || null
        };
        
        console.log('🎤 Mapped Scores:', mappedScores);
        console.log('🎤 Individual scores check:', {
          grammar_score: result.grammar_score,
          vocabulary_score: result.vocabulary_score,
          pronunciation_score: result.pronunciation_score,
          fluency_score: result.fluency_score,
          content_score: result.content_score
        });
        setScores(mappedScores);
        setCurrentStep('feedback');
      } else {
        throw new Error(result.message || 'Failed to process audio with AI');
      }
      
        // Clear progress from localStorage
        localStorage.removeItem(`speaking_progress_${testData.test_id}`);
      } catch (error) {
        console.error('Speaking test submission error:', error);
        
        // Handle authentication errors specifically
        if (error.message.includes('No valid authentication token found')) {
          setError('Your session has expired. Please refresh the page and try again.');
          // Optionally redirect to login or refresh the page
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setError(error.message);
        }
        setCurrentStep('recording');
      }
    } catch (error) {
      console.error('Speaking test submission error:', error);
      setError(error.message);
      setCurrentStep('recording');
    }
  }, [testData, user, makeAuthenticatedRequest, attemptNumber, saveAttemptsToStorage]);

  const handleReRecord = useCallback(() => {
    if (attemptNumber < maxAttempts) {
      setAudioBlob(null);
      setTranscript('');
      setScores(null);
      setError(null);
      
      // Increment attempt when student decides to re-record after seeing results
      const newAttempt = attemptNumber + 1;
      setAttemptNumber(newAttempt);
      saveAttemptsToStorage(newAttempt);
      
      setCurrentStep('recording');
    } else {
      setError('Maximum attempts reached');
    }
  }, [attemptNumber, maxAttempts, saveAttemptsToStorage]);

  const handleSubmitTest = useCallback(async () => {
    if (!transcript || !scores) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testData.start_time ? Math.round((endTime - testData.start_time) / 1000) : 0;
      const startedAt = testData.start_time ? new Date(testData.start_time).toISOString() : endTime.toISOString();
      
      // Get retest assignment ID from localStorage (following other tests pattern)
      const studentId = user.student_id;
      const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
      const retestAssignmentId = localStorage.getItem(retestAssignKey);
      
      // Get current academic period ID from academic calendar service
      const { academicCalendarService } = await import('../../services/AcademicCalendarService');
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const academic_period_id = currentTerm?.id;
      
      if (!academic_period_id) {
        throw new Error('No current academic period found');
      }

      // Prepare final submission data (AI processing already done)
      const finalSubmissionData = {
        test_id: testData.test_id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: studentId,
        academic_period_id: academic_period_id,
        question_id: testData.question_id || 1,
        audio_blob: audioBlob ? await blobToBase64(audioBlob) : null,
        audio_duration: audioBlob?.duration || 0,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: false,
        visibility_change_times: 0,
        is_completed: true,
        retest_assignment_id: retestAssignmentId ? Number(retestAssignmentId) : null,
        parent_test_id: testData.test_id,
        // Include already processed results
        transcript: transcript,
        scores: scores,
        final_submission: true // Flag to indicate this is the final submission
      };
      
      console.log('🎤 Final submission:', finalSubmissionData);
      
      // Submit final results to backend
      console.log('🎤 Making final submission request...');
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-speaking-test-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSubmissionData)
      });
      
      console.log('🎤 Final submission response status:', response.status);
      const result = await response.json();
      console.log('🎤 Final submission result:', result);
      
      if (result.success) {
        // Mark test as completed in localStorage (following other tests pattern)
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Speaking test marked as completed in localStorage:', completionKey);

          // Clear in-progress retest lock key on successful submit
          const inProgressKey = `retest_in_progress_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(inProgressKey);
          console.log('🗑️ Cleared in-progress retest lock:', inProgressKey);
          
        // Clear attempts from localStorage upon successful submission
        const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
        localStorage.removeItem(attemptsKey);
        console.log('🗑️ Cleared attempts from localStorage upon submission');
        
        // Clear speaking test data from cache upon successful submission
        const { clearTestData } = await import('../../utils/cacheUtils');
        clearTestData(user.student_id, 'speaking_test_data', testData.test_id);
        console.log('🗑️ Cleared speaking test data from cache upon submission');
        
        // Clear anti-cheating state (mirror other tests)
        try {
          const antiCheatKey = `anti_cheating_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(antiCheatKey);
          console.log('🗑️ Cleared anti-cheating key:', antiCheatKey);
        } catch (_) {}
        }
        
        // Cache the test results immediately after successful submission (like other tests)
        console.log('🎤 Caching speaking test results after submission...');
        const studentIdCache = user?.student_id || user?.id || 'unknown';
        const cacheKey = `student_results_table_${studentIdCache}`;
        const { setCachedData, getCachedData, CACHE_TTL, clearTestData } = await import('../../utils/cacheUtils');

        // Build the new result row
        const newRow = {
          id: Date.now(),
          test_id: testData.test_id,
          test_type: 'speaking',
          test_name: testData.test_name,
          score: Math.round(scores.overall_score / 10),
          max_score: 10,
          percentage: scores.overall_score,
          caught_cheating: false,
          visibility_change_times: 0,
          is_completed: true,
          submitted_at: new Date().toISOString(),
          subject: 'Listening and Speaking',
          teacher_name: testData.teacher_name || 'Unknown'
        };

        // Merge with existing cached results instead of overwriting
        let merged = { success: true, results: [], count: 0 };
        try {
          const existing = getCachedData(cacheKey);
          if (existing && Array.isArray(existing.results)) {
            merged.results = existing.results.slice();
          }
        } catch (_) {}
        merged.results.unshift(newRow);
        merged.count = merged.results.length;

        setCachedData(cacheKey, merged, CACHE_TTL.student_results_table);
        console.log('🎤 Speaking test results cached (merged) with key:', cacheKey);
        
        // Clear test data from cache (like other tests)
        if (user?.student_id) {
          clearTestData(user.student_id, 'speaking', testData.test_id);
        }
        
        // Mirror other tests: track retest attempts meta and clear retest keys
        try {
          const attemptsMetaKey = `retest_attempts_${user.student_id}_speaking_${testData.test_id}`;
          const prevMetaRaw = localStorage.getItem(attemptsMetaKey);
          let used = 0;
          if (prevMetaRaw) {
            try { used = JSON.parse(prevMetaRaw)?.used || 0; } catch (_) { used = 0; }
          }
          const nextMeta = { used: used + 1, max: maxAttempts };
          localStorage.setItem(attemptsMetaKey, JSON.stringify(nextMeta));
          // Clear retest keys so Start Retest button behaves like other tests
          const retestKey = `retest1_${user.student_id}_speaking_${testData.test_id}`;
          const retestAssignKey = `retest_assignment_id_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(retestKey);
          localStorage.removeItem(retestAssignKey);
          console.log('💾 Updated retest attempts meta and cleared retest keys:', nextMeta);
        } catch (e) {
          console.warn('⚠️ Failed to update retest attempts meta/keys', e);
        }

        // Skip results page for speaking (mirror drawing behavior) and return to cabinet
        try {
          if (onTestComplete) {
            onTestComplete(scores.overall_score);
          }
          if (typeof onExit === 'function') {
            onExit();
          }
        } catch (_) {}
        return;
      } else {
        throw new Error(result.message || 'Failed to submit speaking test');
      }
    } catch (error) {
      console.error('Speaking test submission error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [testData, user, makeAuthenticatedRequest, transcript, scores, audioBlob, attemptNumber, onComplete]);

  const handleFinalSubmit = useCallback(() => {
    setCurrentStep('completed');
    onComplete({
      test_id: testData.test_id,
      transcript,
      scores,
      attempt_number: attemptNumber
    });
  }, [testData.test_id, transcript, scores, attemptNumber, onComplete]);

  const renderCurrentStep = () => {
    switch (currentStep) {
        
      case 'recording':
        return (
          <div className="speaking-test-recording">
            <h2 className="text-2xl font-bold mb-4 text-center">{testData.test_name}</h2>
            <div className="mb-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
              <p className="text-gray-700 mb-4">{testData.prompt}</p>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Requirements:</strong> Minimum {testData.min_words || 50} words, 
                  0-{testData.max_duration || 600} seconds duration
                </p>
              </div>
            </div>
            
            <AudioRecorder
              ref={recordingRef}
              onRecordingComplete={handleRecordingComplete}
              minDuration={0}
              maxDuration={testData.max_duration || 600}
              minWords={testData.min_words || 50}
              maxAttempts={maxAttempts}
              currentAttempt={attemptNumber}
            />
            
            {error && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="transcription-status bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-semibold mb-2">Processing Your Speech</h3>
              <p className="text-lg text-blue-600">Please wait while we process your audio...</p>
            </div>
            <div className="inline-flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        );

      case 'feedback':
        console.log('🎤 Rendering feedback step with Submit Final button');
        return (
          <FeedbackDisplay
            transcript={transcript}
            scores={scores}
            audioBlob={audioBlob}
            recordingTime={recordingTime}
            onReRecord={handleReRecord}
            onFinalSubmit={() => setShowSubmitModal(true)}
            canReRecord={attemptNumber < maxAttempts}
            attemptNumber={attemptNumber}
            maxAttempts={maxAttempts}
            isSubmitting={isSubmitting}
          />
        );

      case 'completed':
        // Use the same TestResults component as other tests
        const testResultsData = {
          showResults: true,
          testInfo: {
            test_name: testData?.test_name || 'Speaking Test',
            id: testData?.test_id,
            test_id: testData?.test_id
          },
          testType: 'speaking',
          score: scores?.overall_score || 0,
          totalQuestions: 1,
          percentage: scores?.overall_score || 0,
          passed: (scores?.overall_score || 0) >= 50,
          questionAnalysis: [{
            questionNumber: 1,
            userAnswer: transcript,
            correctAnswer: 'Speaking test completed',
            isCorrect: true,
            score: scores?.overall_score || 0,
            maxScore: 100,
            feedback: `Word Count: ${scores?.word_count || 0}, Grammar: ${scores?.grammar_score || 0}/40, Vocabulary: ${scores?.vocab_score || 0}/30`
          }],
          timestamp: new Date().toISOString(),
          caught_cheating: false,
          visibility_change_times: 0
        };
        
        return (
          <div className="speaking-test-completed">
            <TestResults
              testResults={testResultsData}
              onBackToCabinet={() => setShowExitModal(true)}
              onRetakeTest={() => {
                setCurrentStep('recording');
                setTranscript('');
                setScores(null);
                setAudioBlob(null);
                setAttemptNumber(1);
              }}
              isLoading={false}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Submit Confirmation Modal */}
      <PerfectModal
        isOpen={showSubmitModal && !isSubmitting}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Speaking Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to submit? 
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowSubmitModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => { setShowSubmitModal(false); handleSubmitTest(); }} variant="primary">Submit</Button>
          </div>
        </div>
      </PerfectModal>

      {/* Exit Confirmation Modal */}
      <PerfectModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Speaking Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">Are you sure you want to go back to cabinet?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowExitModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => { setShowExitModal(false); if (typeof onExit === 'function') onExit(); }} variant="primary">Go Back</Button>
          </div>
        </div>
      </PerfectModal>
      
      {/* Test Content */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default SpeakingTestStudent;
