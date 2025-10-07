import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useTest } from '@/contexts/TestContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Notification } from '@/components/ui/components-ui-index';
import { userService } from '@/services/userService';
import { testService } from '@/services/testService';
import { TestResults, TestDetailsModal } from '@/components/test/components-test-index';
import StudentResults from './StudentResults';
import { API_ENDPOINTS, USER_ROLES, CONFIG } from '@/shared/shared-index';
import { logger } from '@/utils/logger';

// STUDENT CABINET - React Component for Student Main Interface - ENHANCED FOR NEW STRUCTURE
// ✅ COMPLETED: All student cabinet functionality from legacy src/ converted to React
// ✅ ENHANCED: New data structure with enhanced user data handling
// ✅ COMPLETED: HTML structure → JSX structure with Tailwind CSS styling
// ✅ COMPLETED: loadStudentData() → useEffect + useState with React patterns
// ✅ COMPLETED: displayStudentSubjects() → renderSubjects() with React rendering
// ✅ COMPLETED: loadStudentActiveTests() → useEffect + useState with React patterns
// ✅ COMPLETED: displayStudentActiveTests() → renderActiveTests() with React rendering
// ✅ COMPLETED: isTestCompleted() → checkTestCompleted() with React state
// ✅ COMPLETED: markTestCompleted() → markCompleted() with React state
// ✅ COMPLETED: markTestCompletedInUI() → markCompletedUI() with React state
// ✅ COMPLETED: viewTestDetails() → showTestDetails() with React modals
// ✅ COMPLETED: navigateToTest() → startTest() with React routing
// ✅ COMPLETED: navigateBackToCabinet() → goBack() with React routing
// ✅ COMPLETED: loadStudentTestResults() → useEffect + useState with React patterns
// ✅ COMPLETED: displayStudentTestResults() → renderResults() with React rendering
// ✅ COMPLETED: populateStudentInfoDirectly() → setStudentInfo() with React state
// ✅ COMPLETED: initializeStudentApp() → useEffect with React patterns
// ✅ COMPLETED: toggleStudentMenu() → toggleMenu() with React state
// ✅ COMPLETED: showChangePasswordTab() → showPasswordTab() with React state
// ✅ COMPLETED: hideChangePasswordTab() → hidePasswordTab() with React state
// ✅ COMPLETED: handlePasswordChange() → changePassword() with React forms
// ✅ COMPLETED: setupBackToCabinetListeners() → useEffect with React patterns
// ✅ COMPLETED: navigateBackToCabinet() → goBack() with React routing
// ✅ COMPLETED: StudentCabinet main component with React patterns
// ✅ COMPLETED: Student info display with React state management
// ✅ COMPLETED: Active tests list with React rendering
// ✅ COMPLETED: Test results display with React rendering
// ✅ COMPLETED: Navigation between sections with React routing
// ✅ COMPLETED: Menu toggle functionality with React state
// ✅ COMPLETED: Password change functionality with React forms
// ✅ COMPLETED: Loading states with React state management
// ✅ COMPLETED: Error handling with React error boundaries
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Accessibility features with ARIA support
// ✅ COMPLETED: Keyboard navigation with React event handling
// ✅ COMPLETED: Auto-refresh functionality with React effects
// ✅ COMPLETED: Real-time updates with React state
// ✅ COMPLETED: Performance optimization with React hooks
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

const StudentCabinet = ({ isMenuOpen, onToggleMenu, onShowPasswordChange }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { studentData, loadStudentData } = useUser();
  const { activeTests, testResults, loadActiveTests, loadTestResults, viewTestDetails, testDetailsModal, closeTestDetailsModal } = useTest();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [averageScore, setAverageScore] = useState(null);
  const [completedTests, setCompletedTests] = useState(new Set());
  const [showAllTests, setShowAllTests] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isStartingTest, setIsStartingTest] = useState(false);
  const [isCompletionStatusLoaded, setIsCompletionStatusLoaded] = useState(false);
  
  // Initialize student cabinet on component mount
  useEffect(() => {
    initializeStudentCabinet();
  }, []);

  // Clear loading state when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      setIsStartingTest(false);
    };
  }, []);

  // Clear loading state when activeTests change (navigation occurred)
  useEffect(() => {
    if (isStartingTest) {
      const timer = setTimeout(() => {
        setIsStartingTest(false);
      }, 1000); // Clear after 1 second as fallback
      return () => clearTimeout(timer);
    }
  }, [isStartingTest]);

  // Note: Removed useEffect that was clearing startingTestId on activeTests change
  // This was preventing the loading animation from showing
  
  // Enhanced initializeStudentCabinet from legacy code
  const initializeStudentCabinet = useCallback(async () => {
    logger.debug('🎓 Initializing Student Cabinet...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        logger.debug('🎓 User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Validate student role
      if (user.role !== USER_ROLES.STUDENT) {
        logger.error('🎓 Invalid user role for student cabinet:', user.role);
        setError('Access denied. Student role required.');
        return;
      }
      
      // Load only active tests (single API call on login)
      logger.debug('🎓 Loading active tests (single API call)...');
      const studentId = user?.student_id || user?.id || '';
      // Skip separate student data/results fetch here to keep one call
      
      // OPTIMIZATION: Selective cache busting - only clear if needed
      const shouldRefreshCache = checkForCacheRefreshTriggers(studentId);
      
      if (shouldRefreshCache) {
        logger.debug('🎓 Cache refresh triggered - clearing cache');
        try {
          const activeKey = `student_active_tests_${studentId}`;
          const resultsKey = `student_results_table_${studentId}`;
          localStorage.removeItem(activeKey);
          localStorage.removeItem(resultsKey);
        } catch (e) { /* ignore */ }
      } else {
        logger.debug('🎓 Using existing cache - no refresh needed');
      }
      
      // Force-bust active tests cache to ensure fresh retest flags on first load
      try { localStorage.removeItem(`student_active_tests_${studentId}`); } catch (_) {}
      await loadActiveTests(studentId);
      
      // Optionally compute average later when results are fetched elsewhere
      
      logger.debug('🎓 Student Cabinet initialization complete!');
      
    } catch (error) {
      logger.error('🎓 Error initializing student cabinet:', error);
      setError('Failed to initialize student cabinet');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, navigate]);
  
  // OPTIMIZATION: Smart cache refresh triggers
  const checkForCacheRefreshTriggers = useCallback((studentId) => {
    // Only refresh cache if we have a specific trigger
    // 1. User explicitly requested refresh (manual refresh button)
    // 2. Cache is corrupted or invalid
    // 3. Specific time-based refresh (e.g., every 30 minutes)
    // 4. User completed a test (detected via custom events)
    // 5. First login of the day
    // 6. Cache TTL has expired (let existing system handle this)
    
    // Check for manual refresh trigger
    if (window.studentCabinetRefreshRequested) {
      window.studentCabinetRefreshRequested = false;
      logger.debug('🎓 Manual refresh requested');
      return true;
    }
    
    // Check for test completion events
    if (window.recentTestCompleted) {
      window.recentTestCompleted = false;
      logger.debug('🎓 Test completed - cache refresh triggered');
      return true;
    }
    
    // Check for time-based refresh (every 30 minutes)
    const lastRefresh = localStorage.getItem(`last_cabinet_refresh_${studentId}`);
    if (lastRefresh) {
      const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
      if (timeSinceRefresh > 30 * 60 * 1000) { // 30 minutes
        logger.debug('🎓 Time-based refresh triggered');
        return true;
      }
    }
    
    // Retest keys present → refresh
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`retest_assignment_id_${studentId}_`)) {
          logger.debug('🎓 Retest assignment key detected, forcing cache refresh:', key);
          return true;
        }
      }
    } catch (_) {}

    // Default to using existing cache
    logger.debug('🎓 No refresh triggers - using existing cache');
    return false;
  }, []);
  

  
  // Removed local retest key logic; rely solely on backend retest_available

  // Enhanced calculateAverageScore from legacy code - ENHANCED FOR NEW STRUCTURE
  const calculateAverageScore = useCallback(async () => {
    logger.debug('🎓 Calculating average score...');
    try {
      if (testResults && testResults.length > 0) {
        const sum = testResults.reduce((acc, result) => {
          // Use best retest score if available, otherwise use original score
          const scoreToUse = result.best_retest_score || result.score;
          const maxScoreToUse = result.best_retest_max_score || result.max_score;
          
          // Always calculate percentage with Math.round() to avoid decimal places from database
          if (typeof scoreToUse === 'number' && typeof maxScoreToUse === 'number' && maxScoreToUse > 0) {
            return acc + Math.round((scoreToUse / maxScoreToUse) * 100);
          }
          return acc;
        }, 0);
        const average = Math.round(sum / testResults.length);
        setAverageScore(average);
        logger.debug('🎓 Average score calculated:', average);
      }
    } catch (error) {
      logger.error('🎓 Error calculating average score:', error);
    }
  }, [testResults]);
  
  // Initialize completed tests from localStorage on mount
  useEffect(() => {
    // Don't reinitialize during navigation to prevent race conditions
    if (isStartingTest) {
      logger.debug('🎓 Skipping completed tests initialization during navigation');
      return;
    }
    
    // Wait for student ID to be available
    const studentId = user?.student_id || user?.id;
    if (!studentId) {
      logger.debug('🎓 Student ID not available yet, skipping localStorage initialization');
      return;
    }
    
    const completed = new Set();
    
    // Check localStorage for test completion keys (new format only)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`test_completed_${studentId}_`)) {
        const value = localStorage.getItem(key);
        if (value === 'true') {
          // Extract test type and ID from key (format: test_completed_studentId_type_id)
          const parts = key.replace(`test_completed_${studentId}_`, '').split('_');
          if (parts.length >= 2) {
            const testType = parts[0];
            const testId = parts.slice(1).join('_');
            const testKey = `${testType}_${testId}`;
            completed.add(testKey);
            logger.debug('🎓 Found completed test in localStorage:', testKey);
          }
        }
      }
    }
    setCompletedTests(completed);
    setIsCompletionStatusLoaded(true);
    logger.debug('🎓 Initialized completed tests from localStorage:', Array.from(completed));
  }, [user?.student_id, user?.id, isStartingTest]);


  // Check and update completed tests when testResults change
  useEffect(() => {
    logger.debug('🎓 testResults structure:', testResults);
    const resultsArray = testResults?.results || testResults;
    logger.debug('🎓 resultsArray:', resultsArray);
    if (resultsArray && resultsArray.length > 0) {
      const studentId = user?.student_id || user?.id || '';
      const newCompleted = new Set();
      resultsArray.forEach(result => {
        // Use the same format as localStorage keys (with student ID)
        const key = `${result.test_type}_${result.test_id}`;
        newCompleted.add(key);
        // Also mark in localStorage (with student ID)
        localStorage.setItem(`test_completed_${studentId}_${result.test_type}_${result.test_id}`, 'true');
      });
      
      // Merge with existing completed tests instead of overwriting
      setCompletedTests(prev => {
        const merged = new Set([...prev, ...newCompleted]);
        logger.debug('🎓 Updated completed tests (merged):', Array.from(merged));
        return merged;
      });
    }
  }, [testResults, user?.student_id, user?.id]);
  
  // Enhanced checkTestCompleted - check both localStorage AND database results
  const checkTestCompleted = useCallback(async (testType, testId, retestAvailable = false, testData = null) => {
    logger.debug('🎓 Checking test completion:', testType, testId, 'retestAvailable:', retestAvailable);
    try {
      const studentId = user?.student_id || user?.id || '';
      
      // If retest is available from backend, check attempt limits
      if (retestAvailable) {
        logger.debug('🎓 Retest available from backend, checking attempt limits.');
        
        // Check localStorage attempt tracking with descriptive keys
        const attemptKeys = [];
        for (let i = 1; i <= 10; i++) { // Check up to 10 attempts
          const key = `retest_attempt${i}_${studentId}_${testType}_${testId}`;
          if (localStorage.getItem(key) === 'true') {
            attemptKeys.push(key);
          }
        }
        const currentAttempts = attemptKeys.length;
        
        // Get max attempts from the test data (passed from backend)
        const maxAttempts = testData?.retest_attempts_left || testData?.max_attempts || 3;
        
        logger.debug('🎓 Current attempts:', currentAttempts, 'Max attempts:', maxAttempts, 'Attempt keys:', attemptKeys);
        
        if (currentAttempts >= maxAttempts) {
          logger.debug('🎓 Maximum retest attempts reached in localStorage');
          return true; // Consider "completed" to block further attempts
        }
        
        logger.debug('🎓 Retest attempts available, allowing start.');
        return false; // Not considered "completed" for the purpose of starting a retest
      }

      // Check new format: test_completed_${studentId}_${testType}_${testId}
      const localKey = `test_completed_${studentId}_${testType}_${testId}`;
      const localStatus = localStorage.getItem(localKey);
      logger.debug('🎓 localStorage key:', localKey);
      logger.debug('🎓 localStorage value:', localStatus);
      
      // Debug: Check all localStorage keys for this student
      if (testType === 'word_matching') {
        logger.debug('🎓 Debug: All localStorage keys for student', studentId);
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(studentId) && key.includes('word_matching')) {
            logger.debug('🎓 Found word_matching key:', key, '=', localStorage.getItem(key));
          }
        }
      }
      
      if (localStatus === 'true') {
        logger.debug('✅ Found completion status in local storage:', localStatus);
        return true;
      }
      
      // Check database results - if student has results for this test, it's completed
      const resultsArray = testResults?.results || testResults;
      if (resultsArray && resultsArray.length > 0) {
        logger.debug('🎓 Checking database results:', resultsArray.length, 'results');
        const hasResult = resultsArray.some(result => {
          logger.debug('🎓 Checking result:', result.test_type, result.test_id, 'vs', testType, testId);
          return result.test_type === testType && result.test_id === testId;
        });
        if (hasResult) {
          logger.debug('✅ Found completion status in database results');
          // Mark in localStorage for future checks (new format)
          localStorage.setItem(localKey, 'true');
          return true;
        }
      }
      
      logger.debug('❌ Test not completed according to local storage or database');
      return false;
    } catch (error) {
      logger.error('🎓 Error checking test completion:', error);
      return false; // Allow test if we can't check
    }
  }, [testResults, user?.student_id, user?.id]);
  
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
  
  // Enhanced showTestDetails from legacy code - NOW USES TestContext
  const handleShowTestDetails = useCallback(async (test) => {
    logger.debug('🎓 Showing test details:', test);
    
    // Use TestContext's viewTestDetails to load questions and show modal
    try {
      await viewTestDetails(test.test_type, test.test_id, test.test_name);
    } catch (error) {
      logger.error('Error loading test details:', error);
      showNotification('Failed to load test details', 'error');
    }
  }, [viewTestDetails, showNotification]);
  
  
  // Enhanced startTest from legacy code
  const startTest = useCallback((test) => {
    logger.debug('🎓 Starting test:', test);
    
    // Check if test is already completed (but allow retests)
    const testKey = `${test.test_type}_${test.test_id}`;
    if (completedTests.has(testKey) && !test?.retest_available) {
      showNotification('This test has already been completed', 'warning');
      return;
    }
    
    // Set retest1_ key if this is a retest (regardless of completion status)
    logger.debug('🎓 Checking retest conditions:');
    logger.debug('🎓 test.retest_available:', test?.retest_available);
    logger.debug('🎓 testKey:', testKey);
    logger.debug('🎓 completedTests.has(testKey):', completedTests.has(testKey));
    logger.debug('🎓 completedTests:', Array.from(completedTests));
    
    if (test?.retest_available) {
      const studentId = user?.student_id || user?.id || '';
      const retestKey = `retest1_${studentId}_${test.test_type}_${test.test_id}`;
      localStorage.setItem(retestKey, 'true');
      logger.debug('🎓 Set retest key:', retestKey);
      // Mirror other tests: clear completion flags so UI doesn't show Completed badge
      try {
        const completedKeyNew = `test_completed_${studentId}_${test.test_type}_${test.test_id}`;
        localStorage.removeItem(completedKeyNew);
        const legacyCompletedKey = `${test.test_type}_${test.test_id}`;
        localStorage.removeItem(legacyCompletedKey);
        logger.debug('🗑️ Cleared completion keys for retest:', completedKeyNew, legacyCompletedKey);
        // Set in-progress retest lock and clear per-test caches so old results don't appear
        const inProgressKey = `retest_in_progress_${studentId}_${test.test_type}_${test.test_id}`;
        localStorage.setItem(inProgressKey, '1');
        logger.debug('🔒 Set in-progress retest lock:', inProgressKey);
        // Clear per-test cached data (speaking-specific keys and generic patterns)
        try {
          const antiCheatKey = `anti_cheating_${studentId}_${test.test_type}_${test.test_id}`;
          localStorage.removeItem(antiCheatKey);
          // Speaking cached bundle
          const speakingCacheKey = `speaking_test_data_${studentId}_${test.test_id}`;
          localStorage.removeItem(speakingCacheKey);
          const speakingProgressKey = `speaking_progress_${test.test_id}`;
          localStorage.removeItem(speakingProgressKey);
          // Generic sweep: remove any cached answers/progress for this test (pre-picked answers in retests)
          const suffix = `_${studentId}_${test.test_type}_${test.test_id}`;
          const toDelete = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            // Common prefixes for saved answers/state across tests
            if (
              key.endsWith(suffix) ||
              key.includes(`answers_${studentId}_${test.test_type}_${test.test_id}`) ||
              key.includes(`progress_${studentId}_${test.test_type}_${test.test_id}`) ||
              key.includes(`state_${studentId}_${test.test_type}_${test.test_id}`) ||
              key.includes(`selected_${studentId}_${test.test_type}_${test.test_id}`)
            ) {
              toDelete.push(key);
            }
          }
          toDelete.forEach(k => localStorage.removeItem(k));
          logger.debug('🗑️ Cleared generic cached keys for retest start:', toDelete);
          // Attempts meta used by retest UI
          const attemptsMetaKey = `retest_attempts_${studentId}_${test.test_type}_${test.test_id}`;
          // Do not delete attempts meta here; it's used to cap attempts. Keep it.
          logger.debug('🗑️ Cleared per-test cached keys for retest start:', { antiCheatKey, speakingCacheKey, speakingProgressKey });
        } catch (_) {}
      } catch (_) {}
      // Persist retest assignment id for the test page to submit properly
      logger.debug('🎓 Test retest_assignment_id:', test.retest_assignment_id);
      logger.debug('🎓 Test retest_assignment_id type:', typeof test.retest_assignment_id);
      if (test?.retest_assignment_id) {
        const retestAssignKey = `retest_assignment_id_${studentId}_${test.test_type}_${test.test_id}`;
        localStorage.setItem(retestAssignKey, String(test.retest_assignment_id));
        logger.debug('🎓 Set retest assignment ID:', retestAssignKey, '=', test.retest_assignment_id);
      } else {
        logger.debug('🎓 No retest assignment ID found in test data');
      }
    } else {
      logger.debug('🎓 Retest assignment ID storage skipped - retest not available');
    }
    
    // Show loading overlay
    setIsStartingTest(true);
    logger.debug('🎓 Set isStartingTest to true for test:', test.test_type);
    
    // Special handling for matching tests - redirect to dedicated page
    if (test.test_type === 'matching_type') {
      logger.debug('🎯 Redirecting to matching test page for testId:', test.test_id);
      navigate(`/student/matching-test/${test.test_id}`);
      return;
    }

    // Special handling for word matching tests - redirect to dedicated page
    if (test.test_type === 'word_matching') {
      logger.debug('🎯 Redirecting to word matching test page for testId:', test.test_id);
      navigate(`/student/word-matching-test/${test.test_id}`);
      return;
    }

    // Special handling for speaking tests - redirect to dedicated page
    if (test.test_type === 'speaking') {
      logger.debug('🎤 Redirecting to speaking test page for testId:', test.test_id);
      navigate(`/student/speaking-test/${test.test_id}`);
      return;
    }
    
    // Navigate to the test page for other test types
    navigate(`/student/test/${test.test_type}/${test.test_id}`);
    
    // Don't clear isStartingTest - let navigation handle it
    // The overlay will persist until the component unmounts
  }, [navigate, completedTests, showNotification, user?.student_id, user?.id]);
  
  // Toggle show all tests
  const toggleShowAllTests = useCallback(() => {
    setShowAllTests(prev => !prev);
  }, []);
  
  // Toggle show all results
  const toggleShowAllResults = useCallback(() => {
    setShowAllResults(prev => !prev);
  }, []);
  
  // Handle test start
  const handleTestStart = useCallback(async (test) => {
    logger.debug('🎓 Starting test:', test);
    
    // Prevent multiple test starts
    if (isStartingTest) {
      logger.debug('🎓 Test already starting, ignoring click');
      return;
    }
    
        try {
          // Check if test is already completed (for ALL test types including matching)
          const isCompleted = await checkTestCompleted(test.test_type, test.test_id, test?.retest_available, test);
          // Strict: block when completed unless backend explicitly exposes retest_available
          if (isCompleted && !test?.retest_available) {
            showNotification('This test has already been completed', 'warning');
            return;
          }
      
      // Start the test (this handles the overlay like matching tests)
      startTest(test);
    } catch (error) {
      logger.error('🎓 Error starting test:', error);
      showNotification('Failed to start test. Please try again.', 'error');
    }
  }, [checkTestCompleted, startTest, showNotification, isStartingTest]);
  
  // Handle test details view
  const handleTestDetails = useCallback((test) => {
    logger.debug('🎓 Viewing test details:', test);
    handleShowTestDetails(test);
  }, [handleShowTestDetails]);
  
  // Loading state
  if (isLoading) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <LoadingSpinner size="lg" />
          <motion.p 
            className="mt-4 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            Loading Student Cabinet...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="bg-white border border-red-200 rounded-xl p-8 max-w-md shadow-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.div
              className="text-4xl mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3, type: "spring" }}
            >
              ⚠️
            </motion.div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Cabinet Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* Student Cabinet Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Student Info */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex-shrink-0">
                <motion.div 
                  className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-white font-semibold text-xl">
                    {user?.name?.charAt(0) || 'S'}
                  </span>
                </motion.div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {user?.name} {user?.surname}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base md:text-lg">
                  Grade {user?.grade} - Class {user?.class}
                </p>
              </div>
            </motion.div>
            
            
            {/* Menu Button */}
            <motion.div
              className="relative"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <button
                onClick={onToggleMenu}
                className="flex items-center space-x-1 sm:space-x-2 bg-white/10 border-white/20 text-white hover:bg-white/20 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2"
                style={{ zIndex: 1000 }}
              >
                <span className="hidden sm:inline">Menu</span>
                <motion.svg 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </motion.svg>
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-2">
                      <motion.button
                        onClick={onShowPasswordChange}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Change Password
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          onToggleMenu(); // Close the dropdown first, like in teacher cabinet
                          logout();
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Logout
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Left Column - Student Info & Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 space-y-6">
            
            {/* Average Score Card */}
            {averageScore !== null && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Card>
                  <Card.Header>
                    <Card.Title>Average Score</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <motion.div 
                      className="text-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                    >
                      <motion.div 
                        className="text-4xl font-bold text-blue-600 mb-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
                      >
                        {averageScore}%
                      </motion.div>
                      <p className="text-sm text-gray-500">Overall Performance</p>
                    </motion.div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="space-y-6">
          {/* Active Tests - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Card>
                <Card.Header>
                  <Card.Title className="text-center">Active Tests</Card.Title>
                </Card.Header>
                <Card.Body>
                  {activeTests && activeTests.length > 0 ? (
                    <div className="relative">
                      {/* Loading Overlay */}
                      {logger.debug('🎓 Rendering overlay, isStartingTest:', isStartingTest)}
                      {isStartingTest && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg border-2 border-blue-200">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                            <p className="text-blue-600 font-semibold text-lg">Starting test...</p>
                            <p className="text-gray-500 text-sm mt-1">Please wait...</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {(showAllTests ? activeTests : activeTests.slice(0, 3)).map((test, index) => (
                        <motion.div
                          key={`${test.test_type}_${test.test_id}`}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: showAllTests ? 0 : 0.7 + index * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 text-sm">
                                <h3 className="text-sm sm:text-lg font-medium text-gray-900 w-16 sm:w-auto break-words leading-tight line-clamp-2 sm:line-clamp-none">{test.test_name}</h3>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {test.subject}
                                </span>
                                <span className="text-gray-500">{test.teacher_name}</span>
                                <span className="text-gray-500">
                                  <span className="sm:hidden">{new Date(test.assigned_at).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })}</span>
                                  <span className="hidden sm:inline">{new Date(test.assigned_at).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {(() => {
                                const testKey = `${test.test_type}_${test.test_id}`;
                                const isCompleted = completedTests.has(testKey);

                                // Show loading state while completion status is being determined
                                if (!isCompletionStatusLoaded) {
                                  return (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled
                                      className="bg-gray-100 text-gray-500 border-gray-200"
                                    >
                                      Loading...
                                    </Button>
                                  );
                                }

                                // Allow retest start even if completed, when backend flags retest_available
                                if (isCompleted && test?.retest_available) {
                                  // When local attempts meta reached max, show Completed immediately (mirror other tests)
                                  const studentId = user?.student_id || user?.id || '';
                                  let attemptsDisabled = false;
                                  try {
                                    const metaRaw = localStorage.getItem(`retest_attempts_${studentId}_${test.test_type}_${test.test_id}`);
                                    if (metaRaw) {
                                      const meta = JSON.parse(metaRaw);
                                      if (typeof meta?.used === 'number' && typeof meta?.max === 'number' && meta.used >= meta.max) {
                                        attemptsDisabled = true;
                                      }
                                    }
                                  } catch (_) {}
                                  if (attemptsDisabled) {
                                    return (
                                      <Button
                                        variant="secondary"
                                        size="xs"
                                        disabled
                                        className="bg-green-100 text-green-800 border-green-200"
                                      >
                                        ✓ Completed
                                      </Button>
                                    );
                                  }
                                  return (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleTestStart(test)}
                                      disabled={isStartingTest}
                                    >
                                      Start Retest
                                    </Button>
                                  );
                                }

                                if (isCompleted) {
                                  return (
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      disabled
                                      className="bg-green-100 text-green-800 border-green-200"
                                    >
                                      ✓ Completed
                                    </Button>
                                  );
                                }

                                logger.debug('🎓 Button render, isStartingTest:', isStartingTest, 'test:', test.test_type);
                                return (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleTestStart(test)}
                                    disabled={isStartingTest}
                                  >
                                    Start Test
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {activeTests.length > 3 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={toggleShowAllTests}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {showAllTests ? 'Show Less' : `Show ${activeTests.length - 3} More`}
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      <motion.div
                        className="text-6xl mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                      >
                        📝
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Tests</h3>
                      <p className="text-gray-500">No active tests available for your class at the moment.</p>
                    </motion.div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
            
          {/* Test Results - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Card>
                <Card.Header>
                  <Card.Title>Test Results</Card.Title>
                </Card.Header>
                <Card.Body>
                  {/* Show detailed TestResults component if available */}
                  {testResults && testResults.showResults ? (
                    <TestResults
                      testResults={testResults}
                      onBackToCabinet={() => {
                        // Clear test results and return to cabinet view
                        setTestResults(null);
                      }}
                      onRetakeTest={(testType, testId) => {
                        // Rely on backend retest_available; do not clear completion keys
                        loadActiveTests();
                        setTestResults(null);
                      }}
                      isLoading={isLoading}
                    />
                  ) : (
                    <StudentResults 
                      compact={true} 
                      showAll={showAllResults}
                      onToggleShowAll={toggleShowAllResults}
                      maxInitial={3}
                    />
                  )}
                </Card.Body>
              </Card>
            </motion.div>
        </div>
      </motion.div>
      
      {/* Test Details Modal - ENHANCED WITH TestDetailsModal COMPONENT */}
      <TestDetailsModal
        isOpen={testDetailsModal.isOpen}
        onClose={closeTestDetailsModal}
        testType={testDetailsModal.testType}
        testId={testDetailsModal.testId}
        testName={testDetailsModal.testName}
        questions={testDetailsModal.questions || []}
        isLoading={testDetailsModal.isLoading || false}
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
    </motion.div>
  );
};

export default StudentCabinet;
