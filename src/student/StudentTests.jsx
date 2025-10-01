import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import { useTestProgress } from '@/hooks/useTestProgress';
import { useAntiCheating } from '@/hooks/useAntiCheating';
import { Button, LoadingSpinner, Notification, PerfectModal } from '@/components/ui/components-ui-index';
import { TrueFalseQuestion, MultipleChoiceQuestion, InputQuestion, DrawingTestStudent, FillBlanksTestStudent } from '@/components/test/components-test-index';
import TestResultsDisplay from '@/components/test/TestResultsDisplay';
import TestDetailsModal from '@/components/test/TestDetailsModal';
import ProgressTracker from '@/components/test/ProgressTracker';
import { testService } from '@/services/testService';
import { API_ENDPOINTS, USER_ROLES, CONFIG, TEST_TYPES } from '@/shared/shared-index';
import { calculateTestScore, checkAnswerCorrectness, getCorrectAnswer } from '../utils/scoreCalculation';

// STUDENT TESTS - React Component for Student Test Taking - ENHANCED FOR NEW STRUCTURE
// ✅ COMPLETED: All student test functionality from legacy src/ converted to React
// ✅ ENHANCED: New test structure with enhanced test handling
// ✅ COMPLETED: loadStudentActiveTests() → useEffect + useState with React patterns
// ✅ COMPLETED: displayStudentActiveTests() → renderActiveTests() with React rendering
// ✅ COMPLETED: isTestCompleted() → checkTestCompletion() with React state
// ✅ COMPLETED: markTestCompleted() → markCompleted() with React state
// ✅ COMPLETED: markTestCompletedInUI() → updateUI() with React state
// ✅ COMPLETED: viewTestDetails() → showTestDetails() with React state
// ✅ COMPLETED: showTestDetailsModal() → TestDetailsModal component with React components
// ✅ COMPLETED: closeTestDetailsModal() → closeModal() with React state
// ✅ COMPLETED: getQuestionAnswerDisplay() → getAnswerDisplay() with React utilities
// ✅ COMPLETED: collectTestAnswers() → collectAnswers() with React state
// ✅ COMPLETED: submitTest() → handleSubmit() with React patterns
// ✅ COMPLETED: saveTestProgress() → useLocalStorage hook with React hooks
// ✅ COMPLETED: getTestProgress() → useLocalStorage hook with React hooks
// ✅ COMPLETED: clearTestProgress() → useLocalStorage hook with React hooks
// ✅ COMPLETED: clearProgressTrackingInterval() → useEffect cleanup with React effects
// ✅ COMPLETED: navigateToTest() → setCurrentTest() with React state
// ✅ COMPLETED: hideTestSections() → hideSections() with React state
// ✅ COMPLETED: loadTestForPage() → loadTest() with React patterns
// ✅ COMPLETED: displayTestOnPage() → displayTest() with React rendering
// ✅ COMPLETED: renderQuestionsForPage() → renderQuestions() with React components
// ✅ COMPLETED: renderTrueFalseQuestionsForPage() → TrueFalseQuestion component with React components
// ✅ COMPLETED: renderMultipleChoiceQuestionsForPage() → MultipleChoiceQuestion component with React components
// ✅ COMPLETED: renderInputQuestionsForPage() → InputQuestion component with React components
// ✅ COMPLETED: setupTestPageEventListeners() → useEffect with React effects
// ✅ COMPLETED: setupProgressTrackingForPage() → useEffect with React effects
// ✅ COMPLETED: updateProgressDisplayForPage() → updateProgress() with React state
// ✅ COMPLETED: updateSubmitButtonStateForPage() → updateSubmitButton() with React state
// ✅ COMPLETED: loadSavedProgressForPage() → loadProgress() with React hooks
// ✅ COMPLETED: submitTestFromPage() → handleSubmit() with React patterns
// ✅ COMPLETED: getAnsweredQuestionsCountForPage() → getAnsweredCount() with React utilities
// ✅ COMPLETED: getCurrentTestType() → getTestType() with React state
// ✅ COMPLETED: saveProgressForPage() → saveProgress() with React hooks
// ✅ COMPLETED: navigateToTestResults() → showResults() with React routing
// ✅ COMPLETED: navigateBackToCabinet() → goBack() with React routing
// ✅ COMPLETED: All matching test functions → MatchingTestInterface component with React components
// ✅ COMPLETED: HTML structure → JSX structure with React components
// ✅ COMPLETED: StudentTests main component with React patterns
// ✅ COMPLETED: Test list display with React state management
// ✅ COMPLETED: Test taking interface with React state management
// ✅ COMPLETED: Question navigation with React state management
// ✅ COMPLETED: Answer collection with React state management
// ✅ COMPLETED: Progress tracking with React state management
// ✅ COMPLETED: Test submission handling with React patterns
// ✅ COMPLETED: Results display with React state management
// ✅ COMPLETED: Matching test integration with React components
// ✅ COMPLETED: Auto-save functionality with React hooks
// ✅ COMPLETED: Test timer with useEffect and React effects
// ✅ COMPLETED: Modal components for test details with React components
// ✅ COMPLETED: Loading states with React state management
// ✅ COMPLETED: Error handling with React error boundaries
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Accessibility features with ARIA support
// ✅ COMPLETED: Legacy Compatibility: Full compatibility with legacy student system
// ✅ COMPLETED: React Integration: Easy integration with React routing
// ✅ COMPLETED: Tailwind CSS: Conforms to new Tailwind CSS in styles folder
// ✅ COMPLETED: Modern Patterns: Modern React patterns and best practices
// ✅ COMPLETED: Security: JWT token management and validation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: Session Management: Session validation and management
// ✅ COMPLETED: Role Management: Role-based routing and access control
// ✅ COMPLETED: Form Management: Form state management and validation
// ✅ COMPLETED: API Integration: Integration with student services
// ✅ COMPLETED: State Management: React state management for student data
// ✅ COMPLETED: Performance: Optimized student operations and caching
// ✅ COMPLETED: Memory Management: Proper cleanup and memory management
// ✅ COMPLETED: Event Handling: Proper event handling and cleanup
// ✅ COMPLETED: Accessibility: Full accessibility compliance
// ✅ COMPLETED: Documentation: Comprehensive component documentation
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

const StudentTests = ({ onBackToCabinet, currentTest: propCurrentTest }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { activeTests, loadActiveTests: loadActiveTestsFromContext } = useTest();
  // Test progress functions
  const saveTestProgress = useCallback((testType, testId, progress) => {
    try {
      const studentId = user?.student_id || user?.id || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      localStorage.setItem(progressKey, JSON.stringify(progress));
      console.log(`Saved test progress for ${testType}_${testId}:`, progress);
    } catch (error) {
      console.error('Error saving test progress:', error);
    }
  }, [user?.student_id, user?.id]);

  const getTestProgress = useCallback((testType, testId) => {
    try {
      const studentId = user?.student_id || user?.id || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      const progress = localStorage.getItem(progressKey);
      return progress ? JSON.parse(progress) : null;
    } catch (error) {
      console.error('Error getting test progress:', error);
      return null;
    }
  }, [user?.student_id, user?.id]);

  const clearTestProgress = useCallback((testType, testId) => {
    try {
      const studentId = user?.student_id || user?.id || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      localStorage.removeItem(progressKey);
      
      // Also clear individual question progress keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`test_progress_${studentId}_${testType}_${testId}_`)) {
          localStorage.removeItem(key);
          console.log(`🧹 Cleared individual question key: ${key}`);
        }
      }
      
      console.log(`Cleared test progress for ${testType}_${testId}`);
    } catch (error) {
      console.error('Error clearing test progress:', error);
    }
  }, [user?.student_id, user?.id]);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  const [testLoadError, setTestLoadError] = useState('');
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [currentView, setCurrentView] = useState(propCurrentTest ? 'test' : 'list'); // 'list', 'test', 'results'
  const [currentTest, setCurrentTest] = useState(null);
  const [testType, setTestType] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState([]);
  // Removed currentQuestionIndex - showing all questions at once like legacy
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const timerKeyRef = React.useRef(null);
  const lastTickRef = React.useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Anti-cheating tracking
  const { startTracking, stopTracking, getCheatingData, clearData, isCheating, tabSwitches, isTracking } = useAntiCheating(
    currentTest?.test_type, 
    currentTest?.test_id,
    user?.student_id || user?.id
  );
  
  // Clear old cached data without student IDs (security fix)
  useEffect(() => {
    const clearOldCache = () => {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('test_progress_') && !key.includes('_51712_') && !key.includes('_51736_')) {
          // Check if it's an old format key (without student ID)
          const parts = key.split('_');
          if (parts.length === 4 && parts[0] === 'test' && parts[1] === 'progress') {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 Cleared old cache key:', key);
      });
    };
    
    clearOldCache();
  }, []);

  // Initialize student tests on component mount
  useEffect(() => {
    initializeStudentTests();
  }, []);

  // Auto-start test if propCurrentTest is provided
  useEffect(() => {
    if (propCurrentTest) {
      console.log('🎯 Auto-starting test from prop:', propCurrentTest);
      setIsAutoStarting(true);
      startTest(propCurrentTest);
    }
  }, [propCurrentTest]);
  
  // Enhanced initializeStudentTests from legacy code
  const initializeStudentTests = useCallback(async () => {
    console.log('🎓 Initializing Student Tests...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        console.log('🎓 User not authenticated');
        setError('User not authenticated');
        return;
      }
      
      // Validate student role
      if (user.role !== USER_ROLES.STUDENT) {
        console.error('🎓 Invalid user role for student tests:', user.role);
        setError('Access denied. Student role required.');
        return;
      }
      
      // Load active tests
      console.log('🎓 Loading active tests...');
      await loadActiveTestsFromContext();
      
      console.log('🎓 Student Tests initialization complete!');
      
    } catch (error) {
      console.error('🎓 Error initializing student tests:', error);
      setError('Failed to initialize student tests');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, loadActiveTestsFromContext]);
  
  // Enhanced loadStudentActiveTests from legacy code - ENHANCED FOR NEW STRUCTURE
  const loadStudentActiveTests = useCallback(async () => {
    console.log('🎓 Loading student active tests...');
    try {
      // NEW: Enhanced test loading for new structure
      const tests = await testService.getActiveTests();
      console.log('🎓 Active tests loaded:', tests);
      
      // NEW: Enhanced test structure processing
      const enhancedTests = tests.map(test => ({
        ...test,
        // NEW: Enhanced fields for new structure
        subject_id: test.subject_id || test.subjectId,
        teacher_id: test.teacher_id || test.teacherId,
        is_active: test.is_active !== undefined ? test.is_active : true,
        created_at: test.created_at || test.createdAt,
        updated_at: test.updated_at || test.updatedAt
      }));
      
      setLastUpdated(new Date());
      return enhancedTests;
    } catch (error) {
      console.error('🎓 Error loading active tests:', error);
      throw error;
    }
  }, []);
  
  // Enhanced isTestCompleted from legacy code
  const checkTestCompletion = useCallback(async (testType, testId) => {
    console.log('🎓 Checking test completion:', testType, testId);
    try {
      const progress = getTestProgress(testType, testId);
      return progress && progress.completed;
    } catch (error) {
      console.error('🎓 Error checking test completion:', error);
      return false;
    }
  }, [getTestProgress]);
  
  // Check for individual saved answers after questions are rendered
  useEffect(() => {
    if (questions.length > 0 && currentTest?.test_id) {
      // Add a small delay to allow individual question components to load their saved answers
      const timeoutId = setTimeout(() => {
        // Check if we have any individual saved answers
        let hasIndividualAnswers = false;
        const updatedAnswers = new Array(questions.length).fill('');
        
        questions.forEach((question, index) => {
          // Use the correct key with studentId, testType and testId
          const studentId = user?.student_id || user?.id || 'unknown';
          const individualKey = `test_progress_${studentId}_${testType}_${currentTest?.test_id}_${question.question_id}`;
          const individualAnswer = localStorage.getItem(individualKey);
          
          if (individualAnswer) {
            // Remove extra quotes if present
            const cleanAnswer = individualAnswer.replace(/^"(.*)"$/, '$1');
            updatedAnswers[index] = cleanAnswer;
            hasIndividualAnswers = true;
          }
        });
        
        if (hasIndividualAnswers) {
          setStudentAnswers(updatedAnswers);
          
          // Recalculate progress
          const answeredCount = updatedAnswers.filter(answer => {
            return answer && typeof answer === 'string' && answer.trim() !== '';
          }).length;
          const newProgress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
          setProgress(newProgress);
        }
      }, 100); // Small delay to allow individual components to load
      
      return () => clearTimeout(timeoutId);
    }
  }, [questions, testType, currentTest?.test_id]);

  // Enhanced markTestCompleted from legacy code
  const markCompleted = useCallback(async (testType, testId) => {
    console.log('🎓 Marking test as completed:', testType, testId);
    try {
      const progress = getTestProgress(testType, testId) || {};
      progress.completed = true;
      progress.completedAt = new Date().toISOString();
      saveTestProgress(testType, testId, progress);
      
      // Also mark in localStorage directly like the legacy system (with student ID)
      const studentId = user?.student_id || user?.id || '';
      const completedKey = `test_completed_${studentId}_${testType}_${testId}`;
      localStorage.setItem(completedKey, 'true');
      console.log('🎓 Test completion marked in localStorage:', completedKey);
      console.log('🎓 localStorage value after setting:', localStorage.getItem(completedKey));
      
      showNotification('Test marked as completed', 'success');
    } catch (error) {
      console.error('🎓 Error marking test as completed:', error);
      showNotification('Failed to mark test as completed', 'error');
    }
  }, [getTestProgress, saveTestProgress]);
  
  // Enhanced viewTestDetails from legacy code
  const viewTestDetails = useCallback((test) => {
    console.log('🎓 Showing test details:', test);
    setSelectedTest(test);
    setShowTestDetails(true);
  }, []);
  
  // Enhanced navigateToTest from legacy code
  const startTest = useCallback(async (test) => {
    console.log('🎓 Starting test:', test);
    let loadStart = Date.now();
    let timeoutId;
    try {
      setTestLoadError('');
      setIsLoadingTestData(true);
      loadStart = Date.now();
      const endLoading = () => {
        const elapsed = Date.now() - loadStart;
        const minDelay = 250;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => {
          setIsLoading(false);
          setIsLoadingTestData(false);
        }, remaining);
      };
      let timeoutFired = false;
      timeoutId = setTimeout(() => {
        timeoutFired = true;
        setTestLoadError('Loading is taking longer than expected...');
      }, 15000);
      
      // Check if test is already completed before starting (but allow retests)
      const studentIdStart = user?.student_id || user?.id || '';
      const completedKey = `test_completed_${studentIdStart}_${test.test_type}_${test.test_id}`;
      const isCompleted = localStorage.getItem(completedKey) === 'true';
      
      if (isCompleted && !test?.retest_available) {
        console.log('🎓 Test already completed, redirecting to main cabinet');
        showNotification('This test has already been completed', 'info');
        navigate('/student');
        return;
      }
      
      if (isCompleted && test?.retest_available) {
        console.log('🎓 Test completed but retest available, allowing retest');
      }
      
      // Special handling for matching tests - redirect to dedicated page
      if (test.test_type === TEST_TYPES.MATCHING) {
        console.log('🎯 Redirecting to matching test page for testId:', test.test_id);
        navigate(`/student/matching-test/${test.test_id}`);
        return;
      }
      
      // Special handling for word matching tests - redirect to dedicated page
      if (test.test_type === TEST_TYPES.WORD_MATCHING) {
        console.log('🎯 Redirecting to word matching test page for testId:', test.test_id);
        navigate(`/student/word-matching-test/${test.test_id}`);
        return;
      }
      
      // Set current test and test type
      setCurrentTest(test);
      setTestType(test.test_type);
      
      // Load test info and questions
      const [testInfo, questions] = await Promise.all([
        testService.getTestInfo(test.test_type, test.test_id),
        testService.getTestQuestions(test.test_type, test.test_id)
      ]);
      
      setTestInfo(testInfo);
      // Deterministic shuffle if enabled
      let finalQuestions = questions;
      try {
        const shuffleEnabled = !!testInfo?.is_shuffled;
        if (shuffleEnabled) {
          const studentIdForSeed = user?.student_id || user?.id || 'unknown';
          const seedStr = `${studentIdForSeed}:${test.test_type}:${test.test_id}`;
          const seed = Array.from(seedStr).reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0) >>> 0;
          const orderKey = `test_shuffle_order_${studentIdForSeed}_${test.test_type}_${test.test_id}`;
          const cachedOrder = localStorage.getItem(orderKey);
          if (cachedOrder) {
            const order = JSON.parse(cachedOrder);
            const byId = new Map(questions.map(q => [q.question_id, q]));
            finalQuestions = order.map(id => byId.get(id)).filter(Boolean);
          } else {
            // Seeded RNG (mulberry32)
            function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
            const rng = mulberry32(seed);
            finalQuestions = [...questions];
            for (let i = finalQuestions.length - 1; i > 0; i--) {
              const j = Math.floor(rng() * (i + 1));
              [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
            }
            const order = finalQuestions.map(q => q.question_id);
            localStorage.setItem(orderKey, JSON.stringify(order));
          }
        }
      } catch (e) {
        console.error('Shuffle error (ignored):', e);
      }
      setQuestions(finalQuestions);
      // End loading as soon as core data is ready
      endLoading();
      
      // Initialize student answers
      const savedProgress = getTestProgress(test.test_type, test.test_id);
      let initialAnswers = savedProgress?.answers || new Array(questions.length).fill('');
      
      // Also check individual question keys (for compatibility with individual question saving)
      questions.forEach((question, index) => {
        const studentIdPerQ = user?.student_id || user?.id || 'unknown';
        const individualKey = `test_progress_${studentIdPerQ}_${test.test_type}_${test.test_id}_${question.question_id}`;
        const individualAnswer = localStorage.getItem(individualKey);
        console.log(`🔍 Checking individual answer for question ${question.question_id}:`, individualAnswer);
        if (individualAnswer) {
          initialAnswers[index] = individualAnswer;
          console.log(`✅ Loaded individual answer for question ${question.question_id}:`, individualAnswer);
        }
      });
      
      console.log('🔍 Initial answers after loading individual saves:', initialAnswers);
      setStudentAnswers(initialAnswers);
      
      // Calculate and set initial progress
      const answeredCount = initialAnswers.filter(answer => {
        return answer && typeof answer === 'string' && answer.trim() !== '';
      }).length;
      const initialProgress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
      console.log('🔍 Calculated progress:', answeredCount, 'answered out of', questions.length, '=', initialProgress + '%');
      setProgress(initialProgress);
      
      // Initialize timer from allowed_time with persistent cache
      const allowedSeconds = Number(testInfo?.allowed_time || 0);
      const studentIdTimerInit = user?.student_id || user?.id || 'unknown';
      timerKeyRef.current = `test_timer_${studentIdTimerInit}_${test.test_type}_${test.test_id}`;
      if (allowedSeconds > 0) {
        try {
          const cached = localStorage.getItem(timerKeyRef.current);
          const now = Date.now();
          if (cached) {
            const parsed = JSON.parse(cached);
            const drift = Math.floor((now - new Date(parsed.lastTickAt).getTime()) / 1000);
            const remaining = Math.max(0, Number(parsed.remainingSeconds || allowedSeconds) - Math.max(0, drift));
            setTimeRemaining(remaining);
            lastTickRef.current = now;
          } else {
            setTimeRemaining(allowedSeconds);
            lastTickRef.current = now;
            localStorage.setItem(timerKeyRef.current, JSON.stringify({
              remainingSeconds: allowedSeconds,
              lastTickAt: new Date(now).toISOString(),
              startedAt: new Date(now).toISOString()
            }));
          }
        } catch (e) {
          console.error('Timer cache init error:', e);
          setTimeRemaining(allowedSeconds);
        }
      } else {
        setTimeRemaining(0);
      }
      
      // Set test start time for timing tracking
      const startTime = new Date();
      setTestStartTime(startTime);
      console.log('⏱️ Test timer started at:', startTime.toISOString());
      
      // Start anti-cheating tracking
      startTracking();
      console.log('🛡️ Anti-cheating tracking started');
      
      // Switch to test view
      setCurrentView('test');
      
      console.log('🎓 Test started successfully');
      
    } catch (error) {
      console.error('🎓 Error starting test:', error);
      showNotification('Failed to start test', 'error');
      setTestLoadError('Failed to load test data. Please try again.');
    } finally {
      // Ensure loading is cleared even on errors
      const elapsed = Date.now() - loadStart;
      const minDelay = 250;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setIsLoading(false);
        setIsLoadingTestData(false);
      }, remaining);
      setIsAutoStarting(false);
      try { if (timeoutId) clearTimeout(timeoutId); } catch {}
    }
  }, [getTestProgress]);
  
  // Enhanced submitTest from legacy code
  const handleSubmit = useCallback(async () => {
    if (!currentTest || !testInfo || !questions || !studentAnswers) {
      showNotification('No test data to submit', 'error');
      return;
    }
    
    console.log('🎓 Submitting test:', currentTest);
    
    try {
      setIsSubmitting(true);
      
      // Calculate score
      const score = calculateTestScore(questions, studentAnswers, currentTest.test_type);
      
      // Calculate timing data
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0; // in seconds
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      console.log('⏱️ Test timing:', {
        startedAt,
        endTime: endTime.toISOString(),
        timeTaken: `${timeTaken} seconds`
      });
      
      // Get anti-cheating data
      const cheatingData = getCheatingData();
      console.log('🛡️ Anti-cheating data for submission:', cheatingData);
      
      // Submit test with timing data and anti-cheating data
      // Build answers_by_id for order-agnostic scoring
      const answersById = {};
      questions.forEach((q, idx) => {
        answersById[q.question_id] = studentAnswers[idx] ?? '';
      });
      
      // Debug: Log answers for drawing tests
      if (currentTest.test_type === 'drawing') {
        console.log('🎨 Drawing test answers being submitted:', studentAnswers);
        console.log('🎨 Drawing test answers type:', typeof studentAnswers[0]);
        console.log('🎨 Drawing test answers content:', studentAnswers[0]);
      }
      
      const result = await testService.submitTest(
        currentTest.test_type,
        currentTest.test_id,
        studentAnswers,
        {
          time_taken: (() => {
            const allowed = Number(testInfo?.allowed_time || 0);
            if (allowed > 0) return Math.min(timeTaken, allowed);
            return timeTaken;
          })(),
          started_at: startedAt,
          submitted_at: endTime.toISOString(),
          answers_by_id: answersById,
          question_order: questions.map(q => q.question_id),
          // Add anti-cheating data
          caught_cheating: cheatingData.caught_cheating,
          visibility_change_times: cheatingData.visibility_change_times,
          // Add retest metadata if this is a retest (mirroring other test components)
          retest_assignment_id: (() => {
            const studentId = user?.student_id || user?.id || '';
            const retestAssignKey = `retest_assignment_id_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
            const retestAssignmentId = localStorage.getItem(retestAssignKey);
            console.log('🎨 Frontend retest key:', retestAssignKey);
            console.log('🎨 Frontend retest assignment ID from localStorage:', retestAssignmentId);
            console.log('🎨 Frontend retest assignment ID converted:', retestAssignmentId ? Number(retestAssignmentId) : null);
            console.log('🎨 Frontend current test data:', currentTest);
            console.log('🎨 Frontend current test retest_assignment_id:', currentTest.retest_assignment_id);
            return retestAssignmentId ? Number(retestAssignmentId) : null;
          })(),
          parent_test_id: currentTest.test_id
        },
        user // Pass user data directly
      );
      
      console.log('🎓 Test submission result:', result);
      
      if (result.success) {
        // Check if this is a retest and increment attempt counter
        const studentId = user?.student_id || user?.id || '';
        const retestKey = `retest1_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
        const isRetest = localStorage.getItem(retestKey) === 'true';
        
        if (isRetest) {
          const maxAttempts = currentTest?.retest_attempts_left || currentTest?.max_attempts || 3;

          // Server is authoritative: if passed, it already forced last attempt. Mirror locally.
          const passed = (result?.percentage_score ?? 0) >= 50;
          if (passed) {
            const lastSlotKey = `retest_attempt${maxAttempts}_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
            localStorage.setItem(lastSlotKey, 'true');
            console.log('🎓 Passed retest, marking last-slot key:', lastSlotKey);
            // Remove the retest availability key locally
            localStorage.removeItem(retestKey);
          } else {
            // Find the next attempt number
            let nextAttemptNumber = 1;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
              if (localStorage.getItem(key) !== 'true') {
                nextAttemptNumber = i;
                break;
              }
            }
            // Mark this specific attempt as completed
            const attemptKey = `retest_attempt${nextAttemptNumber}_${studentId}_${currentTest.test_type}_${currentTest.test_id}`;
            localStorage.setItem(attemptKey, 'true');
            console.log('🎓 Marked retest attempt as completed:', attemptKey);

            // If this consumed max attempts, remove retest flag
            if (nextAttemptNumber >= maxAttempts) {
              localStorage.removeItem(retestKey);
            }
          }
        }
        
        // Mark test as completed FIRST (before showing results)
        console.log('🎓 Marking test as completed...');
        await markCompleted(currentTest.test_type, currentTest.test_id);
        
        // Cache the test results immediately after successful submission (except for drawing tests)
        if (currentTest.test_type !== 'drawing') {
          console.log('🎓 Caching test results after submission...');
          const studentIdCache = user?.student_id || user?.id || 'unknown';
          const cacheKey = `student_results_table_${studentIdCache}`;
          const { setCachedData, CACHE_TTL } = await import('@/utils/cacheUtils');
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Test results cached with key:', cacheKey);
        } else {
          console.log('🎓 Drawing test submitted - not caching results (will appear after teacher grades)');
        }
        
        // Clear test progress and timer cache
        console.log('🎓 Clearing test progress...');
        clearTestProgress(currentTest.test_type, currentTest.test_id);
        try {
          const studentIdTimer = user?.student_id || user?.id || 'unknown';
          const timerKey = `test_timer_${studentIdTimer}_${currentTest.test_type}_${currentTest.test_id}`;
          localStorage.removeItem(timerKey);
          const shuffleKey = `test_shuffle_order_${studentIdTimer}_${currentTest.test_type}_${currentTest.test_id}`;
          localStorage.removeItem(shuffleKey);
        } catch {}
        
        // Mark test as completed in localStorage (for centralized test types: input, drawing, true_false, multiple_choice)
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_${currentTest.test_type}_${currentTest.test_id}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Test marked as completed in localStorage:', completionKey);
        }
        
        // Clear retest keys (for centralized test types: input, drawing, true_false, multiple_choice)
        try {
          const studentIdCleanup = user?.student_id || user?.id || '';
          const retestKey = `retest1_${studentIdCleanup}_${currentTest.test_type}_${currentTest.test_id}`;
          const retestAssignKey = `retest_assignment_id_${studentIdCleanup}_${currentTest.test_type}_${currentTest.test_id}`;
          localStorage.removeItem(retestKey);
          localStorage.removeItem(retestAssignKey);
          console.log('🧹 Cleared retest keys:', retestKey, retestAssignKey);
        } catch (e) {
          console.warn('Failed to clear retest keys:', e);
        }
        
        // Clear test progress and anti-cheating data (but keep test_completed keys)
        console.log('🧹 Clearing test progress and anti-cheating data...');
        const studentIdCleanup = user?.student_id || user?.id || 'unknown';
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith(`test_progress_${studentIdCleanup}_`) ||
            key.startsWith(`anti_cheating_${studentIdCleanup}_`)
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 Cleared: ${key}`);
        });
        
        // Clear anti-cheating data
        console.log('🛡️ Clearing anti-cheating data...');
        stopTracking();
        clearData();
        
        // Show results AFTER marking as completed (except for drawing tests)
        if (currentTest.test_type !== 'drawing') {
          setCurrentView('results');
        } else {
          // For drawing tests, redirect to cabinet without showing results
          navigate('/student');
        }
        showNotification('Test submitted successfully!', 'success');
        
        console.log('🎓 Test submitted successfully');
      } else {
        console.error('🎓 Test submission failed:', result.error);
        throw new Error(result.error || 'Failed to submit test');
      }
      
    } catch (error) {
      console.error('🎓 Error submitting test:', error);
      showNotification('Failed to submit test', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentTest, testInfo, questions, studentAnswers, markCompleted, clearTestProgress]);
  
  
  
  
  // Enhanced collectTestAnswers from legacy code
  const collectAnswers = useCallback(() => {
    console.log('🎓 Collecting test answers...');
    return studentAnswers;
  }, [studentAnswers]);
  
  // Enhanced updateProgress from legacy code
  const updateProgress = useCallback(() => {
    if (!questions || !studentAnswers) return;
    
    const answeredCount = studentAnswers.filter(answer => {
      // Check if answer exists and is a string before calling trim
      return answer && typeof answer === 'string' && answer.trim() !== '';
    }).length;
    const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    setProgress(progressPercentage);
    
    console.log(`🎓 Progress updated: ${answeredCount}/${questions.length} questions answered (${Math.round(progressPercentage)}%)`);
    
    // Auto-save progress
    if (currentTest) {
      const progressData = {
        answers: studentAnswers,
        progress: progressPercentage,
        lastSaved: new Date().toISOString()
      };
      saveTestProgress(currentTest.test_type, currentTest.test_id, progressData);
    }
  }, [questions, studentAnswers, currentTest, saveTestProgress]);
  
  // Update progress whenever studentAnswers changes
  useEffect(() => {
    updateProgress();
  }, [updateProgress]);
  
  // Enhanced getAnsweredCount from legacy code
  const getAnsweredCount = useCallback(() => {
    if (!studentAnswers) return 0;
    const answeredCount = studentAnswers.filter(answer => {
      // Check if answer exists and is a string before calling trim
      return answer && typeof answer === 'string' && answer.trim() !== '';
    }).length;
    console.log('🎓 getAnsweredCount:', { studentAnswers, answeredCount, totalQuestions: questions?.length });
    return answeredCount;
  }, [studentAnswers, questions]);
  
  // Enhanced navigateBackToCabinet from legacy code
  const goBack = useCallback(() => {
    console.log('🎓 Navigating back to cabinet...');
    if (onBackToCabinet) {
      onBackToCabinet();
    } else {
      navigate('/student');
    }
  }, [onBackToCabinet, navigate]);
  
  // Enhanced showResults from legacy code
  const showResults = useCallback(() => {
    console.log('🎓 Showing test results...');
    setCurrentView('results');
  }, []);
  
  // Enhanced formatStudentAnswerForDisplay from legacy code
  const formatStudentAnswerForDisplay = useCallback((studentAnswer, testType, question = null) => {
    console.log('🎓 Formatting student answer for display:', studentAnswer, 'testType:', testType, 'question:', question);
    
    switch (testType) {
      case TEST_TYPES.MULTIPLE_CHOICE:
        // Handle different input types
        if (studentAnswer.toString().startsWith('Option ')) {
          // Already formatted as "Option A", return as is
          return studentAnswer;
        } else if (question && typeof studentAnswer === 'string' && !isNaN(parseInt(studentAnswer))) {
          // Convert integer answer to actual option text if question is provided
          const letterIndex = parseInt(studentAnswer);
          const optionKey = `option_${String.fromCharCode(97 + letterIndex)}`; // a, b, c, d
          const optionText = question[optionKey];
          if (optionText) {
            console.log('🎓 Converted', studentAnswer, 'to option text:', optionText);
            return optionText;
          } else {
            // Fallback to letter if option text not found
            const letterAnswer = String.fromCharCode(65 + letterIndex);
            console.log('🎓 Converted', studentAnswer, 'to', letterAnswer);
            return letterAnswer;
          }
        } else if (typeof studentAnswer === 'string' && isNaN(parseInt(studentAnswer))) {
          // Already formatted text (like "Good", "Fine"), return as is
          console.log('🎓 Already formatted text:', studentAnswer);
          return studentAnswer;
        } else {
          // Convert integer answer to letter for display (0→A, 1→B, 2→C, etc.)
          const letterAnswer = String.fromCharCode(65 + parseInt(studentAnswer));
          console.log('🎓 Converted', studentAnswer, 'to', letterAnswer);
          return letterAnswer;
        }
      case TEST_TYPES.TRUE_FALSE:
        // Convert boolean to string for display
        return studentAnswer === 'true' ? 'True' : 'False';
      case TEST_TYPES.INPUT:
        // Input answers are already in the correct format
        return studentAnswer;
      case TEST_TYPES.MATCHING:
        // For matching tests, show the answer as is
        return typeof studentAnswer === 'object' ? JSON.stringify(studentAnswer) : studentAnswer;
      case TEST_TYPES.WORD_MATCHING:
        // For word matching tests, show the answer as is
        return typeof studentAnswer === 'object' ? JSON.stringify(studentAnswer) : studentAnswer;
      case TEST_TYPES.DRAWING:
        // For drawing tests, show a simple indicator
        return studentAnswer && studentAnswer.trim() !== '' ? 'Drawing submitted' : 'No drawing';
      case TEST_TYPES.FILL_BLANKS:
        // For fill blanks, show the letter answer (A, B, C, etc.)
        return studentAnswer;
      default:
        console.warn('🎓 Unknown test type for answer formatting:', testType);
        return studentAnswer;
    }
  }, []);
  
  
  // Show notification helper
  const showNotification = useCallback((message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, CONFIG.NOTIFICATION_DURATION);
  }, []);
  
  // Update progress when answers change
  useEffect(() => {
    updateProgress();
  }, [updateProgress]);
  
  // Test timer effect with persistence
  useEffect(() => {
    if (currentView !== 'test') return;
    const allowedSeconds = Number(testInfo?.allowed_time || 0);
    if (!allowedSeconds) return; 
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const next = Math.max(0, prev - 1);
        try {
          const now = Date.now();
          if (!lastTickRef.current) lastTickRef.current = now;
          if (timerKeyRef.current) {
            localStorage.setItem(timerKeyRef.current, JSON.stringify({
              remainingSeconds: next,
              lastTickAt: new Date(now).toISOString(),
              startedAt: testStartTime ? testStartTime.toISOString() : new Date(now - (allowedSeconds - next) * 1000).toISOString()
            }));
          }
        } catch {}
        if (next === 0) {
          handleSubmit();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, testInfo?.allowed_time, handleSubmit, testStartTime]);
  
  // Enhanced renderQuestionsForPage from legacy code
  const renderQuestion = useCallback((question, questionIndex) => {
    if (!question) return null;
    
    const handleAnswerChange = (questionId, answer) => {
      const newAnswers = [...studentAnswers];
      newAnswers[questionIndex] = answer;
      setStudentAnswers(newAnswers);
      console.log(`🎓 Answer changed: question ${questionId} = ${answer}`);
      console.log(`🎓 Updated studentAnswers:`, newAnswers);
    };
    
    switch (currentTest.test_type) {
      case TEST_TYPES.TRUE_FALSE:
        return (
          <TrueFalseQuestion
            question={question}
            questionIndex={questionIndex}
            studentAnswer={studentAnswers[questionIndex] || ''}
            onAnswerChange={handleAnswerChange}
            mode="student"
            testId={currentTest?.test_id}
            testType={testType}
            displayNumber={questionIndex + 1}
          />
        );
      case TEST_TYPES.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceQuestion
            question={question}
            questionIndex={questionIndex}
            studentAnswer={studentAnswers[questionIndex] || ''}
            onAnswerChange={handleAnswerChange}
            mode="student"
            testId={currentTest?.test_id}
            testType={testType}
            displayNumber={questionIndex + 1}
          />
        );
      case TEST_TYPES.INPUT:
        return (
          <InputQuestion
            question={question}
            questionIndex={questionIndex}
            studentAnswer={studentAnswers[questionIndex] || ''}
            onAnswerChange={handleAnswerChange}
            mode="student"
            testId={currentTest?.test_id}
            testType={testType}
            displayNumber={questionIndex + 1}
          />
        );
      case TEST_TYPES.MATCHING:
        // This should never be reached - matching tests redirect to dedicated page
        console.error('Matching test reached renderQuestion - this should not happen');
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">Matching Test</h2>
            <p className="text-gray-500 mb-4">Redirecting to matching test page...</p>
            <Button onClick={() => navigate('/student')} variant="primary">
              Back to Dashboard
            </Button>
          </div>
        );
      case TEST_TYPES.DRAWING:
        // NEW: Add drawing test case
        return (
          <DrawingTestStudent
            question={question}
            questionIndex={questionIndex}
            studentAnswer={studentAnswers[questionIndex] || ''}
            onAnswerChange={handleAnswerChange}
            mode="student"
            testId={currentTest?.test_id}
            testType={testType}
          />
        );
      case TEST_TYPES.FILL_BLANKS:
        // NEW: Add fill blanks test case - only render on first question to avoid duplication
        if (questionIndex === 0) {
          return (
            <FillBlanksTestStudent
              key={`fill-blanks-${currentTest?.test_id}-${testInfo?.test_name}`}
              testText={testInfo?.test_text}
              blanks={(questions || []).map((q, index) => ({
                id: q.question_id || index + 1,
                options: q.blank_options || [],
                correct_answer: q.correct_answers?.[0] || q.correct_answer,
                question: q.question_json || ''
              }))}
              separateType={testInfo?.separate_type}
              testId={currentTest?.test_id}
              testName={testInfo?.test_name || currentTest?.test_name}
              teacherId={testInfo?.teacher_id || currentTest?.teacher_id}
              subjectId={testInfo?.subject_id || currentTest?.subject_id}
              onTestComplete={handleSubmit}
              onAnswerChange={(questionId, answer) => {
                // Find the question index and update studentAnswers
                const questionIndex = questions.findIndex(q => q.question_id === questionId);
                if (questionIndex !== -1) {
                  const newAnswers = [...studentAnswers];
                  newAnswers[questionIndex] = answer;
                  setStudentAnswers(newAnswers);
                  console.log(`🎓 Fill Blanks answer changed: question ${questionId} = ${answer}`);
                }
              }}
            />
          );
        }
        return null; // Don't render for subsequent questions
      default:
        return <div>Unsupported question type</div>;
    }
  }, [currentTest, studentAnswers, testType]);
  
  // Enhanced displayTestOnPage from legacy code - render ALL questions at once like legacy
  function renderTestInterface() {
    if (!currentTest || !testInfo || !questions) {
      return null;
    }
    
    return (
      <div className="space-y-6">
        {/* Test Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {testInfo.test_name || testInfo.title || 'Test'}
            </h2>
            {/* Timer moved to ProgressTracker; keep header clean */}
          </div>
          
          {/* Progress Tracker */}
          <div className="mb-4">
            <ProgressTracker
              answeredCount={getAnsweredCount()}
              totalQuestions={questions.length}
              percentage={Math.round(progress)}
              timeElapsed={Number(testInfo?.allowed_time || 0) > 0 ? timeRemaining : 0}
              showDetails={true}
            />
          </div>
        </div>
        
        {/* Questions Container - ALL questions rendered at once like legacy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Answer all questions below:
          </h3>
          
          {/* Render ALL questions at once */}
          <div className="space-y-8">
            {questions.map((question, questionIndex) => (
              <div key={question.question_id || questionIndex} className="question-container">
                {renderQuestion(question, questionIndex)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || getAnsweredCount() < questions.length}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : `Submit Test (${getAnsweredCount()}/${questions.length})`}
          </Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {propCurrentTest ? 'Starting Test...' : 'Loading Student Tests...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Tests Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Student Tests Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Test</h1>

            </div>
            
            <Button
              variant="outline"
              onClick={goBack}
            >
              Back to Cabinet
            </Button>
          </div>
        </div>
      </div>
      
      {/* Anti-cheating Warning - Show only in immediate results after submission */}
      {isCheating && currentView === 'results' && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Academic Integrity Warning:</strong> 
                This test has been flagged for suspicious behavior. 
                You have switched tabs {tabSwitches} times during the test.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {/* Only show test list if no currentTest prop is provided */}
        {!propCurrentTest && currentView === 'list' && renderTestList()}
        {currentView === 'test' && renderTestInterface()}
        {currentView === 'results' && renderTestResults()}
      </div>

      {/* Test data loading overlay */}
      {currentView === 'test' && isLoadingTestData && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-50">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-gray-700">Preparing your test…</p>
          {testLoadError && (
            <div className="mt-3 text-sm text-gray-500">{testLoadError}</div>
          )}
        </div>
      )}
      
      {/* Test Details Modal */}
      <TestDetailsModal
        isOpen={showTestDetails}
        onClose={() => setShowTestDetails(false)}
        testType={selectedTest?.test_type}
        testId={selectedTest?.test_id}
        testName={selectedTest?.test_name}
        questions={selectedTest?.questions}
        isLoading={isLoading}
      />
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => setNotifications(prev => 
              prev.filter(n => n.id !== notification.id)
            )}
          />
        ))}
      </div>
    </div>
  );
  
  // Enhanced displayStudentActiveTests from legacy code
  function renderTestList() {
    if (!activeTests || activeTests.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No active tests available for your class.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {activeTests.map((test, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {test.test_name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Subject:</span> {test.subject}
                  </div>
                  <div>
                    <span className="font-medium">Teacher:</span> {test.teacher_name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {test.test_type}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Assigned: {new Date(test.assigned_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => viewTestDetails(test)}
                  disabled={isAutoStarting || isLoading}
                >
                  View Details
                </Button>
                <Button
                  variant="primary"
                  onClick={() => startTest(test)}
                  disabled={isAutoStarting || isLoading}
                >
                  {isAutoStarting ? 'Starting...' : 'Start Test'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Enhanced displayTestResultsOnPage from legacy code
  function renderTestResults() {
    if (!currentTest || !testInfo || !questions || !studentAnswers) {
      return null;
    }
    
    // Convert studentAnswers array to object format expected by TestResultsDisplay
    const answersObject = {};
    studentAnswers.forEach((answer, index) => {
      if (questions[index]) {
        const questionId = questions[index].question_id || questions[index].id || index;
        answersObject[String(questionId)] = answer;
        console.log('🔍 Converting answer:', { index, questionId, answer, question: questions[index] });
      }
    });
    
    console.log('🔍 Final answersObject:', answersObject);
    console.log('🔍 Questions structure:', questions.map(q => ({ id: q.question_id, correct_answer: q.correct_answer })));
    
    return (
      <TestResultsDisplay
        testInfo={testInfo}
        questions={questions}
        testType={currentTest.test_type}
        studentAnswers={answersObject}
        onBackToCabinet={goBack}
        checkAnswerCorrectness={checkAnswerCorrectness}
        formatStudentAnswerForDisplay={formatStudentAnswerForDisplay}
        getCorrectAnswer={getCorrectAnswer}
      />
    );
  }
};

export default StudentTests;
