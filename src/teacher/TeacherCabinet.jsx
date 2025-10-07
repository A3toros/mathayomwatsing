import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useTest } from '@/contexts/TestContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PerfectModal from '@/components/ui/PerfectModal';
import { userService, testService } from '@/services/services-index';
import { API_ENDPOINTS, USER_ROLES, CONFIG } from '@/shared/shared-index';
import { useNotification } from '@/components/ui/Notification';
import TeacherResults from './TeacherResults';
import { getCachedData, setCachedData, CACHE_TTL } from '@/utils/cacheUtils';
import { academicCalendarService } from '@/services/AcademicCalendarService';
import { performanceService } from '@/services/performanceService';
import { TestPerformanceGraph } from '@/components/TestPerformanceGraph';
import { logger } from '@/utils/logger';


const TeacherCabinet = ({ onBackToLogin }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getCurrentTeacherUsername } = useAuth();
  const { teacherData, loadTeacherData } = useUser();
  const { activeTests, loadActiveTests } = useTest();
  const { showNotification, notifications } = useNotification();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('main'); // 'main', 'subjects', 'tests', 'results'
  const [subjects, setSubjects] = useState([]);
  const [activeTestsData, setActiveTestsData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [classResults, setClassResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  // New performance graph state
  const [testPerformanceData, setTestPerformanceData] = useState([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [performanceError, setPerformanceError] = useState(null);
  const [selectedClassForChart, setSelectedClassForChart] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [resultsViewKey, setResultsViewKey] = useState(0);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Subject selection states
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [subjectSelectionStep, setSubjectSelectionStep] = useState('subject'); // 'subject', 'classes', 'review'
  
  // Initialize teacher cabinet on component mount
  useEffect(() => {
    initializeTeacherCabinet();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.relative')) {
        setShowUserMenu(false);
      }
      if (showMobileMenu && !event.target.closest('.relative')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  // Password change functions
  const showChangePasswordTab = useCallback(() => {
    console.log('🔧 showChangePasswordTab called');
    setShowPasswordChange(true);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, []);

  const hideChangePasswordTab = useCallback(() => {
    console.log('🔧 hideChangePasswordTab called');
    setShowPasswordChange(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }, []);

  const handlePasswordChange = useCallback(async () => {
    if (!user) return;
    
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    // Enhanced password validation
    if (newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }
    
    // Check if password contains both letters and numbers
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasLetter || !hasNumber) {
      showNotification('New password must contain both letters and numbers', 'error');
      return;
    }
    
    try {
      const response = await userService.changePassword({
        username: user.username,
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        showNotification('Password changed successfully!', 'success');
        hideChangePasswordTab();
      } else {
        showNotification(response.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showNotification('Failed to change password. Please try again.', 'error');
    }
  }, [user, passwordForm, showNotification]);

  const handlePasswordFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  
  // Enhanced loadTeacherData from legacy code
  const handleLoadTeacherData = useCallback(async () => {
    logger.debug('👨‍🏫 Loading teacher data...');
    try {
      const data = await userService.getTeacherData();
      logger.debug('👨‍🏫 Teacher data loaded:', data);
      setLastUpdated(new Date());
      return data;
    } catch (error) {
      logger.error('👨‍🏫 Error loading teacher data:', error);
      throw error;
    }
  }, []);

  // Enhanced loadSubjects from legacy code - OPTIMIZED to accept teacherData parameter
  const loadSubjects = useCallback(async (teacherData = null) => {
    logger.debug('👨‍🏫 Loading teacher subjects...');
    try {
      // Check cache first (only if no data passed)
      if (!teacherData) {
        const cacheKey = `teacher_subjects_${user?.teacher_id || user?.id || ''}`;
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          logger.debug('👨‍🏫 Using cached teacher subjects');
          setSubjects(cachedData);
          return cachedData;
        }
      }
      
      let data = teacherData;
      let subjects;
      
      if (teacherData) {
        // Use passed data (no API call needed)
        logger.debug('👨‍🏫 Using passed teacher data for subjects');
        subjects = userService.getTeacherSubjects(teacherData.subjects);
      } else {
        // Fallback: make API call if no data passed
        logger.debug('👨‍🏫 No teacher data passed, fetching from API');
        data = await userService.getTeacherData();
        logger.debug('👨‍🏫 Raw teacher data:', data);
        subjects = userService.getTeacherSubjects(data.subjects);
      }
      
      logger.debug('👨‍🏫 Teacher subjects loaded:', subjects);
      setSubjects(subjects);
      
      // Cache the result (only if we made an API call)
      if (!teacherData) {
        const cacheKey = `teacher_subjects_${user?.teacher_id || user?.id || ''}`;
        setCachedData(cacheKey, subjects, CACHE_TTL.teacher_subjects);
      }
      
      // Don't automatically load performance data - wait for user to click on a class
      logger.debug('📊 Available classes for performance chart:', subjects[0]?.classes || []);
      logger.debug('📊 Performance chart will load when user clicks on a class');
      
      return subjects;
    } catch (error) {
      logger.error('👨‍🏫 Error loading teacher subjects:', error);
      throw error;
    }
  }, [user?.teacher_id, user?.id]);
  
  // Enhanced loadTests from legacy code
  const loadTests = useCallback(async () => {
    logger.debug('👨‍🏫 Loading teacher active tests...');
    try {
      const cacheKey = `teacher_tests_${user?.teacher_id || user?.id || ''}`;
      
      // FORCE REFRESH: Clear cache if it contains drawing tests to ensure fresh data
      const cachedData = getCachedData(cacheKey);
      if (cachedData && cachedData.some(test => test.test_type === 'drawing')) {
        logger.debug('🎨 Drawing test detected - forcing cache refresh');
        localStorage.removeItem(cacheKey);
      }
      
      // Check cache again after potential clearing
      const freshCachedData = getCachedData(cacheKey);
      if (freshCachedData) {
        logger.debug('👨‍🏫 Using cached teacher tests');
        setActiveTestsData(freshCachedData);
        return freshCachedData;
      }
      
      // Cache miss - fetch from API
      const tests = await testService.getTeacherTests();
      logger.debug('👨‍🏫 Teacher tests loaded:', tests);
      setActiveTestsData(tests);
      
      // Cache the result
      setCachedData(cacheKey, tests, CACHE_TTL.teacher_tests);
      
      return tests;
    } catch (error) {
      logger.error('👨‍🏫 Error loading teacher tests:', error);
      throw error;
    }
  }, [user?.teacher_id, user?.id]);

  // Enhanced initializeTeacherCabinet from legacy code - OPTIMIZED with parallel loading and error recovery
  const initializeTeacherCabinet = useCallback(async () => {
    logger.debug('👨‍🏫 Initializing Teacher Cabinet...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        logger.debug('👨‍🏫 User not authenticated');
        setError('User not authenticated');
        return;
      }
      
      // Validate teacher role
      if (user.role !== USER_ROLES.TEACHER) {
        logger.error('👨‍🏫 Invalid user role for teacher cabinet:', user.role);
        setError('Access denied. Teacher role required.');
        return;
      }
      
      // OPTIMIZATION 1: Single API call for teacher data
      logger.debug('👨‍🏫 Loading teacher data...');
      const teacherData = await handleLoadTeacherData();
      
      // OPTIMIZATION 2: Parallel loading of remaining data
      logger.debug('👨‍🏫 Loading subjects and tests in parallel...');
      const [subjectsResult, testsResult] = await Promise.allSettled([
        loadSubjects(teacherData),  // Pass data to avoid duplicate call
        loadTests()                // Independent API call
      ]);
      
      // OPTIMIZATION 3: Graceful error handling
      let hasErrors = false;
      if (subjectsResult.status === 'rejected') {
        logger.warn('👨‍🏫 Subjects loading failed:', subjectsResult.reason);
        hasErrors = true;
      }
      if (testsResult.status === 'rejected') {
        logger.warn('👨‍🏫 Tests loading failed:', testsResult.reason);
        hasErrors = true;
      }
      
      if (hasErrors) {
        showNotification('Some data failed to load, but you can continue', 'warning');
      }
      
      logger.debug('👨‍🏫 Teacher Cabinet initialization complete!');
      
    } catch (error) {
      logger.error('👨‍🏫 Error initializing teacher cabinet:', error);
      setError('Failed to initialize teacher cabinet');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, handleLoadTeacherData, loadSubjects, loadTests, showNotification]);
  
  // Enhanced showSubjectSelectionPrompt from legacy code
  const showPrompt = useCallback(() => {
    console.log('👨‍🏫 Showing subject selection prompt...');
    setShowSubjectModal(true);
    loadAvailableSubjects();
    setSubjectSelectionStep('subject');
  }, []);

  // Load available subjects for selection
  const loadAvailableSubjects = useCallback(async () => {
    console.log('👨‍🏫 Loading available subjects...');
    setIsLoadingSubjects(true);
    try {
      const subjects = await userService.getSubjectsForSelection();
      setAvailableSubjects(subjects);
      console.log('👨‍🏫 Available subjects loaded:', subjects);
    } catch (error) {
      console.error('👨‍🏫 Error loading available subjects:', error);
      showNotification('Failed to load subjects', 'error');
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  // Handle subject selection
  const handleSubjectSelect = useCallback((subjectId) => {
    if (!subjectId) {
      setCurrentSubject(null);
      return;
    }
    
    const subject = availableSubjects.find(s => s.subject_id == subjectId);
    if (subject) {
      setCurrentSubject(subject);
      setSelectedClasses([]);
      setSubjectSelectionStep('classes');
    }
  }, [availableSubjects]);

  // Handle class selection
  const handleClassSelect = useCallback((grade, classNum) => {
    const classKey = `${grade}/${classNum}`;
    setSelectedClasses(prev => {
      if (prev.some(c => c.grade === grade && c.class === classNum)) {
        // Remove if already selected
        return prev.filter(c => !(c.grade === grade && c.class === classNum));
      } else {
        // Add if not selected
        return [...prev, { grade, class: classNum }];
      }
    });
  }, []);

  // Save classes for current subject
  const saveClassesForSubject = useCallback(() => {
    if (!currentSubject || selectedClasses.length === 0) {
      showNotification('Please select at least one class', 'warning');
      return;
    }

    const subjectWithClasses = {
      subject_id: parseInt(currentSubject.subject_id),
      subject_name: currentSubject.subject,
      classes: selectedClasses
    };

    setSelectedSubjects(prev => [...prev, subjectWithClasses]);
    setCurrentSubject(null);
    setSelectedClasses([]);
    setSubjectSelectionStep('subject');
    showNotification(`Added ${currentSubject.subject} with ${selectedClasses.length} classes`, 'success');
  }, [currentSubject, selectedClasses]);

  // Remove subject from selected list
  const removeSubject = useCallback((index) => {
    setSelectedSubjects(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Delete teacher subject assignment
  const deleteTeacherSubject = useCallback(async (subjectId, grade, classNumber) => {
    console.log('👨‍🏫 Deleting teacher subject:', { subjectId, grade, classNumber });
    
    try {
      const requestData = {
        subjectId,
        grade,
        class: classNumber
      };
      console.log('👨‍🏫 Sending delete request with data:', requestData);
      
      const response = await userService.deleteTeacherSubject(requestData);
      
      if (response.success) {
        showNotification('Subject assignment deleted successfully!', 'success');
        // Refresh subjects display
        await loadSubjects();
      } else {
        throw new Error(response.error || 'Failed to delete subject assignment');
      }
    } catch (error) {
      console.error('👨‍🏫 Error deleting subject assignment:', error);
      showNotification('Error deleting subject assignment. Please try again.', 'error');
    }
  }, [loadSubjects, showNotification]);

  // Show delete confirmation modal
  const showDeleteConfirmation = useCallback((subjectId, subjectName, grade, classNumber) => {
    setDeleteData({
      subjectId,
      subjectName,
      grade,
      classNumber
    });
    setShowDeleteModal(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (deleteData) {
      await deleteTeacherSubject(deleteData.subjectId, deleteData.grade, deleteData.classNumber);
      setShowDeleteModal(false);
      setDeleteData(null);
    }
  }, [deleteData, deleteTeacherSubject]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteData(null);
  }, []);

  // Save all selected subjects
  const saveAllSubjects = useCallback(async () => {
    if (selectedSubjects.length === 0) {
      showNotification('Please select at least one subject', 'warning');
      return;
    }

    setIsSavingSubjects(true);
    try {
      const result = await userService.saveTeacherSubjects(selectedSubjects);
      if (result.success) {
        showNotification('Subjects saved successfully!', 'success');
        setShowSubjectModal(false);
        setSelectedSubjects([]);
        setSubjectSelectionStep('subject');
        // Refresh teacher data
        await loadSubjects();
      } else {
        throw new Error(result.error || 'Failed to save subjects');
      }
    } catch (error) {
      console.error('👨‍🏫 Error saving teacher subjects:', error);
      showNotification('Failed to save subjects', 'error');
    } finally {
      setIsSavingSubjects(false);
    }
  }, [selectedSubjects, loadSubjects]);
  
  // Enhanced saveTeacherSubjects from legacy code (now uses saveAllSubjects)
  const saveSubjects = useCallback(async (subjectsData) => {
    console.log('👨‍🏫 Saving teacher subjects:', subjectsData);
    try {
      const result = await userService.saveTeacherSubjects(subjectsData);
      if (result.success) {
        showNotification('Subjects saved successfully!', 'success');
        await loadSubjects();
        setShowSubjectModal(false);
      } else {
        throw new Error(result.error || 'Failed to save subjects');
      }
    } catch (error) {
      console.error('👨‍🏫 Error saving teacher subjects:', error);
      showNotification('Failed to save subjects', 'error');
    }
  }, [loadSubjects]);
  
  // Enhanced showActiveTests from legacy code
  const showTests = useCallback(() => {
    console.log('👨‍🏫 Showing active tests...');
    setCurrentView('tests');
  }, []);
  
  // Enhanced viewTeacherTestDetails from legacy code
  const handleShowTestDetails = useCallback((test) => {
    console.log('👨‍🏫 Showing test details:', test);
    setSelectedTest(test);
    setShowTestDetails(true);
  }, []);
  
  // Enhanced removeClassAssignment from legacy code
  const removeAssignment = useCallback(async (testType, testId, assignmentId) => {
    console.log('👨‍🏫 Removing class assignment:', testType, testId, assignmentId);
    try {
      const result = await testService.removeClassAssignment(testType, testId, assignmentId);
      if (result.success) {
        showNotification('Assignment removed successfully!', 'success');
        await loadTests();
      } else {
        throw new Error(result.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('👨‍🏫 Error removing class assignment:', error);
      showNotification('Failed to remove assignment', 'error');
    }
  }, [loadTests]);
  
  // Enhanced markTestCompletedInUI from legacy code
  const markCompleted = useCallback(async (testType, testId) => {
    console.log('👨‍🏫 Marking test as completed:', testType, testId);
    try {
      const result = await testService.markTestCompleted(testType, testId);
      if (result.success) {
        showNotification('Test marked as completed!', 'success');
        
        // Clear the cache to force fresh data
        const cacheKey = `teacher_tests_${user?.teacher_id || user?.id || ''}`;
        localStorage.removeItem(cacheKey);
        console.log('👨‍🏫 Cleared teacher tests cache');
        
        await loadTests();
      } else {
        throw new Error(result.error || 'Failed to mark test as completed');
      }
    } catch (error) {
      console.error('👨‍🏫 Error marking test as completed:', error);
      showNotification('Failed to mark test as completed', 'error');
    }
  }, [loadTests, showNotification, user?.teacher_id, user?.id]);
  
  // Enhanced refreshActiveTestsData from legacy code
  const refreshTests = useCallback(async () => {
    console.log('👨‍🏫 Refreshing active tests data...');
    try {
      await loadTests();
      showNotification('Tests refreshed successfully!', 'success');
    } catch (error) {
      console.error('👨‍🏫 Error refreshing tests:', error);
      showNotification('Failed to refresh tests', 'error');
    }
  }, [loadTests]);
  
  // Show notification helper
  

  // Load performance data for chart - UPDATED FOR SEMESTER-BASED API
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const loadPerformanceData = useCallback(async (classKey) => {
    console.log('📊 Loading performance data for class:', classKey);
    console.log('📊 Current selectedClassForChart:', selectedClassForChart);
    try {
      setIsLoadingModal(true);
      const [grade, className] = classKey.split('/');
      const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
      
      // Get current term from academic calendar service
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const currentAcademicPeriodId = currentTerm?.id;
      
      if (!currentAcademicPeriodId) {
        throw new Error('No current academic period found');
      }
      
      // Smart refresh on cache expiry (1h)
      const cacheKey = `class_summary_${user.teacher_id}_${gradeFormat}_${className}_${currentAcademicPeriodId}`;
      const cached = getCachedData(cacheKey);
      const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
      const cacheTTL = 3600000;
      if (cacheAge > cacheTTL) {
        try {
          await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/refresh-class-summary-semester');
        } catch (e) {
          console.warn('Materialized view refresh failed (continuing):', e.message);
        }
      }
      
      // Use new term-based API
      const response = await window.tokenManager.makeAuthenticatedRequest(
        `/.netlify/functions/get-class-summary-term?teacher_id=${user.teacher_id}&grade=${gradeFormat}&class=${className}&term_id=${currentAcademicPeriodId}`
      );
      console.log('📊 API response status:', response.status);
      const data = await response.json();
      
      console.log('📊 Performance API response:', data);
      console.log('📊 API success:', data.success);
      console.log('📊 API summary:', data.summary);
      
      if (data.success && data.summary) {
        console.log('📊 Processing semester performance data:', data.summary);
        
        // Process semester-based summary data
        const summary = data.summary;
        console.log('📊 Semester summary:', {
          total_students: summary.total_students,
          total_tests: summary.total_tests,
          completed_tests: summary.completed_tests,
          average_class_score: summary.average_class_score,
          pass_rate: summary.pass_rate,
          cheating_incidents: summary.cheating_incidents
        });
        
        // Create term-based performance data structure
        const termData = {
          summary: summary,
          term: currentTerm.term,
          semester: currentTerm.semester,
          academicYear: currentTerm.academic_year,
          termId: currentAcademicPeriodId,
          overallAverage: summary.average_class_score || 0,
          totalTests: summary.total_tests || 0,
          completedTests: summary.completed_tests || 0,
          passRate: summary.pass_rate || 0,
          cheatingIncidents: summary.cheating_incidents || 0,
          lastTestDate: summary.last_test_date,
          termProgress: calculateTermProgress(summary, currentTerm)
        };

        console.log('📊 Term performance data:', termData);

        setPerformanceData(prev => ({
          ...prev,
          [classKey]: termData
        }));
      } else {
        console.log('📊 No performance data available for class:', classKey);
        setPerformanceData(prev => ({
          ...prev,
          [classKey]: { tests: [], overallAverage: 0 }
        }));
      }
    } catch (error) {
      console.error('📊 Error loading performance data:', error);
      console.error('📊 Error details:', error.message);
      setPerformanceData(prev => ({
        ...prev,
        [classKey]: { tests: [], overallAverage: 0 }
      }));
    } finally {
      setIsLoadingModal(false);
    }
  }, [user]);

  // Helper function to calculate term progress
  const calculateTermProgress = useCallback((summary, currentTerm) => {
    if (!summary.last_test_date || !currentTerm) return 0;
    
    // Get term dates from academic calendar
    const termStart = new Date(currentTerm.start_date);
    const termEnd = new Date(currentTerm.end_date);
    const now = new Date();
    
    const totalDays = termEnd - termStart;
    const elapsedDays = Math.min(now - termStart, totalDays);
    
    return Math.round((elapsedDays / totalDays) * 100);
  }, []);

  // Enhanced showClassResults from legacy code
  const showResults = useCallback((grade, className) => {
    console.log('👨‍🏫 Showing class results:', grade, className);
    console.log('👨‍🏫 Class click - grade:', grade, 'className:', className);
    setSelectedGrade(grade);
    setSelectedClass(className);
    setCurrentView('results');
    
    // Also load performance data for this class
    const classKey = `${grade}/${className}`;
    console.log('📊 Loading performance data for clicked class:', classKey);
    setSelectedClassForChart(classKey);
    loadPerformanceData(classKey);
  }, [loadPerformanceData]);

  // Load test performance data for the simple graph
  const loadTestPerformanceData = useCallback(async (classKey = null) => {
    if (!user?.teacher_id) return;
    
    setIsLoadingPerformance(true);
    setPerformanceError(null);
    
    try {
      logger.debug('📊 Loading test performance data for class:', classKey);
      const data = await performanceService.getTestPerformance(user.teacher_id, classKey);
      setTestPerformanceData(data);
      logger.debug('📊 Test performance data loaded:', data.length, 'tests');
    } catch (error) {
      logger.error('📊 Error loading test performance data:', error);
      setPerformanceError(error.message);
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [user?.teacher_id]);

  // Performance data is now loaded only when a class button is clicked
  // No automatic loading on component mount

  // Retest management helpers (minimal UI hooks)
  const [retests, setRetests] = useState([]);
  const [retestTargets, setRetestTargets] = useState([]);
  const loadRetests = useCallback(async () => {
    try {
      const mod = await import('@/services/retestService');
      const list = await mod.retestService.getRetestAssignments(user.teacher_id);
      setRetests(list);
    } catch (e) {
      console.warn('Failed to load retests', e);
    }
  }, [user]);

  const loadRetestTargets = useCallback(async (retestId) => {
    try {
      const mod = await import('@/services/retestService');
      const items = await mod.retestService.getRetestTargets(retestId);
      setRetestTargets(items);
    } catch (e) {
      console.warn('Failed to load retest targets', e);
    }
  }, []);

  // Retest creation modal state
  const [showRetestModal, setShowRetestModal] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.debug('[TeacherCabinet] showRetestModal state changed:', showRetestModal);
  }, [showRetestModal]);
  const [retestForm, setRetestForm] = useState({
    test_type: '',
    original_test_id: '',
    subject_id: '',
    passing_threshold: 50,
    scoring_policy: 'BEST',
    max_attempts: 1,
    window_days: 2,
    student_ids: []
  });

  const openRetestModal = useCallback(async (opts) => {
    console.debug('[TeacherCabinet] openRetestModal called with:', opts);
    const { test_type, original_test_id, subject_id, failedStudentIds = [], grade, class: className } = opts || {};
    
    // Pre-populate from existing test data
    setRetestForm({
      test_type: test_type || 'multiple_choice',
      original_test_id: original_test_id || '',
      subject_id: subject_id || '',
      passing_threshold: 50,
      scoring_policy: 'BEST',
      max_attempts: 1,
      window_days: 2, // Default to 2 days
      student_ids: failedStudentIds
    });
    
    // Set grade and class if provided, otherwise use current selection
    if (grade !== undefined) setSelectedGrade(grade);
    if (className !== undefined) setSelectedClass(className);
    
    console.debug('[TeacherCabinet] Setting showRetestModal to true');
    setShowRetestModal(true);
  }, []);

  const createRetest = useCallback(async () => {
    try {
      const mod = await import('@/services/retestService');
      
      // Calculate window start/end from days
      const now = new Date();
      const windowEnd = new Date(now.getTime() + (retestForm.window_days * 24 * 60 * 60 * 1000));
      
      const payload = {
        ...retestForm,
        teacher_id: user.teacher_id,
        grade: selectedGrade,
        class: selectedClass,
        window_start: now.toISOString(),
        window_end: windowEnd.toISOString()
      };

      console.debug('[Retest][TeacherCabinet] Prepared payload:', JSON.stringify(payload));
      console.debug('[Retest][TeacherCabinet] Selected students count:', (payload.student_ids || []).length, 'IDs:', payload.student_ids);
      
      await mod.retestService.createRetestAssignment(payload);
      showNotification('Retest created', 'success');
      setShowRetestModal(false);
      loadRetests();
      // Force immediate refresh of class results to show blue state
      setResultsViewKey(k => k + 1);
    } catch (e) {
      console.error('Create retest error', e);
      showNotification(e.message || 'Failed to create retest', 'error');
    }
  }, [retestForm, selectedGrade, selectedClass, loadRetests]);

  
  // Enhanced returnToMainCabinet from legacy code
  
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Teacher Cabinet...</p>
        </div>

        {/* Retests quick actions (disabled during loading) */}
        <div className="flex flex-wrap gap-2" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Cabinet Error</h2>
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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Teacher Cabinet Header */}
      <motion.div 
        className="bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              className="flex-1 text-center"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">Teacher Cabinet</h1>
              <p className="text-sky-100 text-sm sm:text-base md:text-lg">
                Welcome, Teacher {getCurrentTeacherUsername() || ''}
              </p>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Desktop Menu */}
              <div className="hidden md:block">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                      Menu
                    </span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          showChangePasswordTab();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onBackToLogin) {
                            onBackToLogin();
                          } else {
                            logout();
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Mobile Hamburger Menu */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center justify-center w-10 h-10 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Mobile Menu */}
                {showMobileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {getCurrentTeacherUsername() || 'Teacher'}
                      </p>
                      <p className="text-xs text-gray-500">Teacher Account</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        showChangePasswordTab();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Change Password</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        if (onBackToLogin) {
                          onBackToLogin();
                        } else {
                          logout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Navigation Tabs */}
      <motion.div 
        className="bg-white border-b shadow-sm"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-8 overflow-x-auto">
            {[
              { key: 'main', label: 'Main Dashboard', shortLabel: 'Dashboard' },
              { key: 'tests', label: 'Test Management', shortLabel: 'Tests' },
              { key: 'results', label: 'Class Results', shortLabel: 'Results' },
              { key: 'subjects', label: 'Subject Management', shortLabel: 'Subjects' }
            ].map((tab, index) => (
              <motion.button
                key={tab.key}
                onClick={() => tab.key === 'tests' ? showTests() : setCurrentView(tab.key)}
                className={`py-2 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                  currentView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {currentView === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderMainDashboard()}
            </motion.div>
          )}
          {currentView === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSubjectManagement()}
            </motion.div>
          )}
          {currentView === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderActiveTests()}
            </motion.div>
          )}
          {currentView === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TeacherResults 
                key={resultsViewKey}
                selectedGrade={selectedGrade}
                selectedClass={selectedClass}
                onBackToCabinet={() => setCurrentView('main')}
                openRetestModal={openRetestModal}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <PerfectModal
          isOpen={showSubjectModal}
          onClose={() => {
            setShowSubjectModal(false);
            setSubjectSelectionStep('subject');
            setSelectedSubjects([]);
            setCurrentSubject(null);
            setSelectedClasses([]);
          }}
          title="Select Subjects and Classes"
          size="large"
        >
          <div className="space-y-6 px-4 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Subject Selection */}
              {subjectSelectionStep === 'subject' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Subject</h3>
                  <p className="text-gray-600 mb-4">Choose the subject you want to teach:</p>
                  
                  {isLoadingSubjects ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Loading subjects...</span>
                    </div>
                  ) : (
                    <select
                      value={currentSubject?.subject_id || ''}
                      onChange={(e) => handleSubjectSelect(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      {availableSubjects.map(subject => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubjectModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setSubjectSelectionStep('classes')}
                    disabled={!currentSubject}
                  >
                    Next: Select Classes
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Class Selection */}
            {subjectSelectionStep === 'classes' && currentSubject && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Step 2: Select Classes for {currentSubject.subject}
                  </h3>
                  <p className="text-gray-600 mb-4">Choose the classes you teach for this subject:</p>
                  
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map(grade => {
                        // Determine classes based on grade
                        let classes;
                        if (grade === 1 || grade === 2 || grade === 3) {
                          classes = [15, 16];
                        } else if (grade === 4 || grade === 5 || grade === 6) {
                          classes = [13, 14];
                        } else {
                          classes = [];
                        }
                        
                        return (
                          <div key={grade} className="space-y-2">
                            <h4 className="font-medium text-gray-700 text-sm">Grade {grade}</h4>
                            <div className="space-y-1">
                              {classes.map(classNum => (
                                <label key={classNum} className="flex items-center space-x-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedClasses.some(c => c.grade === grade.toString() && c.class === classNum.toString())}
                                    onChange={() => handleClassSelect(grade.toString(), classNum.toString())}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-700">Class {classNum}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSubjectSelectionStep('subject')}
                  >
                    Back to Subjects
                  </Button>
                  <div className="space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSubjectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={saveClassesForSubject}
                      disabled={selectedClasses.length === 0}
                    >
                      Add Subject
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review Selected Subjects */}
            {selectedSubjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Selected Subjects</h3>
                  <p className="text-gray-600 mb-4">Review your selected subjects and classes:</p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedSubjects.map((subject, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{subject.subject_name}</h4>
                            <p className="text-sm text-gray-600">
                              Classes: {subject.classes.map(c => `Grade ${c.grade} Class ${c.class}`).join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeSubject(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSubjectSelectionStep('subject')}
                  >
                    Add More Subjects
                  </Button>
                  <div className="space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSubjectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={saveAllSubjects}
                      disabled={isSavingSubjects}
                      className="relative"
                    >
                      {isSavingSubjects ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save All Subjects'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </PerfectModal>
      )}
      
      {/* Retest creation modal (PerfectModal) */}
      {showRetestModal && (
        <PerfectModal
          isOpen={showRetestModal}
          onClose={() => setShowRetestModal(false)}
          title="Create Retest"
          size="medium"
        >
          <div className="space-y-4">
            {/* User choices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retest Window</label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm" 
                  value={retestForm.window_days} 
                  onChange={(e)=>setRetestForm(f=>({...f,window_days:Number(e.target.value)}))}
                >
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm" 
                  value={retestForm.max_attempts} 
                  onChange={(e)=>setRetestForm(f=>({...f,max_attempts:Number(e.target.value)}))}
                >
                  <option value={1}>1 attempt</option>
                  <option value={2}>2 attempts</option>
                  <option value={3}>3 attempts</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Students can retry immediately if they fail</p>
              </div>
            </div>

            {/* Students hidden intentionally - teacher doesn't need specifics here */}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={()=>setShowRetestModal(false)} 
              className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={createRetest} 
              className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Create Retest
            </button>
          </div>
        </PerfectModal>
      )}

      {/* Test Details Modal */}
      {showTestDetails && selectedTest && (
        <PerfectModal
          isOpen={showTestDetails}
          onClose={() => setShowTestDetails(false)}
          title="Test Details"
          size="large"
        >
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Test Name:</span>
              <p className="text-sm text-gray-900">{selectedTest.test_name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Subject:</span>
              <p className="text-sm text-gray-900">{selectedTest.subject}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Test Type:</span>
              <p className="text-sm text-gray-900">{selectedTest.test_type}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created:</span>
              <p className="text-sm text-gray-900">{new Date(selectedTest.created_at).toLocaleDateString()}</p>
            </div>
            
            {/* Classes Information */}
            {selectedTest.assignments && selectedTest.assignments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Classes:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTest.assignments.map((assignment, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                    >
                      {assignment.grade}/{assignment.class}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowTestDetails(false)}
            >
              Close
            </Button>
          </div>
          </PerfectModal>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteData && (
        <PerfectModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          title="Delete Subject Assignment"
          size="small"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Subject Assignment
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete the assignment for{' '}
                <span className="font-semibold text-gray-900">{deleteData.subjectName}</span>{' '}
                in Grade {deleteData.grade}, Class {deleteData.classNumber}?
              </p>
              <p className="text-xs text-red-600">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete Assignment
              </Button>
            </div>
          </div>
        </PerfectModal>
      )}
      
      {/* Notifications */}
      <motion.div 
        className="fixed top-4 right-4 space-y-2 z-50"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`p-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-600 text-white' :
              notification.type === 'error' ? 'bg-red-600 text-white' :
              notification.type === 'warning' ? 'bg-yellow-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              <div className="flex justify-between items-center">
                <span>{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => 
                    prev.filter(n => n.id !== notification.id)
                  )}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Password Change Modal */}
      {showPasswordChange && (
        <PerfectModal
          isOpen={showPasswordChange}
          onClose={hideChangePasswordTab}
          title="Change Password"
          size="small"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={hideChangePasswordTab}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePasswordChange}
                className="flex-1"
              >
                Change Password
              </Button>
            </div>
          </div>
        </PerfectModal>
      )}
    </motion.div>
  );
  
  // Enhanced showMainCabinetWithSubjects from legacy code
  function renderMainDashboard() {
    return (
      <div className="space-y-8">
        {/* Subjects with Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card>
            <Card.Header>
              <Card.Title>My Subjects & Classes</Card.Title>
            </Card.Header>
            <Card.Body>
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects assigned</h3>
                  <p className="text-gray-500 mb-4">You don't have any subjects assigned yet.</p>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView('subjects')}
                  >
                    Manage Subjects
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        <span className="text-sm text-gray-500">
                          {subject.classes?.length || 0} classes
                        </span>
                      </div>
                      {subject.classes && subject.classes.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {subject.classes.map((cls, clsIndex) => (
                            <motion.div
                              key={clsIndex}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 + clsIndex * 0.05, duration: 0.2 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGrade(cls.grade);
                                  setSelectedClass(cls.class);
                                  setCurrentView('results');
                                }}
                                className="font-medium"
                              >
                                {cls.grade}/{cls.class}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <span className="text-sm">No classes assigned to this subject</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        {/* Test Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card>
            <Card.Header>
              <Card.Title>Test Performance Overview</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Test performance over time with average scores</p>
            </Card.Header>
            <Card.Body>
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500">No subjects assigned - no performance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Class Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-gray-200">
                    {(() => {
                      const allClasses = [];
                      subjects.forEach(subject => {
                        if (subject.classes) {
                          subject.classes.forEach(cls => {
                            const classKey = `${cls.grade}/${cls.class}`;
                            if (!allClasses.find(c => c.key === classKey)) {
                              allClasses.push({
                                key: classKey,
                                grade: cls.grade,
                                class: cls.class,
                                subject: subject.name
                              });
                            }
                          });
                        }
                      });
                      return allClasses;
                    })().map((classInfo, index) => (
                      <button
                        key={classInfo.key}
                        onClick={() => {
                          console.log('🎯 Class button clicked:', classInfo.key);
                          setSelectedClassForChart(classInfo.key);
                          loadTestPerformanceData(classInfo.key);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                          selectedClassForChart === classInfo.key
                            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {classInfo.grade}/{classInfo.class}
                      </button>
                    ))}
                  </div>

                  {/* Chart Content - Only show when a class is selected */}
                  {selectedClassForChart ? (
                    <div className="mt-4">
                      <TestPerformanceGraph 
                        data={testPerformanceData}
                        loading={isLoadingPerformance}
                        error={performanceError}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 text-center text-muted py-4">
                      <div className="text-gray-400 text-4xl mb-2">📊</div>
                      <p className="text-gray-500">Select a class above to view test performance data</p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        
      </div>
    );
  }
  
  // Enhanced displayExistingSubjects from legacy code
  function renderSubjectManagement() {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <Card.Title>Subject Management</Card.Title>
                <Button
                  variant="primary"
                  onClick={showPrompt}
                >
                  Add Subject
                </Button>
              </div>
            </Card.Header>
          </Card>
        </motion.div>
        
        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <Card.Body>
                <div className="text-center p-12">
                  <motion.div
                    className="text-6xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                  >
                    📚
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">No subjects assigned yet</h2>
                  <p className="text-gray-600 mb-6">Add your first subject to get started with creating tests and managing classes.</p>
                  <Button
                    variant="primary"
                    onClick={showPrompt}
                    size="lg"
                  >
                    Add Your First Subject
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <Card.Header>
                <Card.Title>Your Subjects</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-2">{subject.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            {subject.classes?.map((cls, clsIndex) => (
                              <motion.div
                                key={clsIndex}
                                className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs rounded-full px-3 py-1"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 + index * 0.1 + clsIndex * 0.05, duration: 0.2 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <span>{cls.grade} - {cls.className}</span>
                                <button
                                  onClick={() => showDeleteConfirmation(subject.id, subject.name, cls.grade, cls.class)}
                                  className="ml-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete this subject assignment"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </motion.div>
                            )) || (
                              <span className="text-gray-500 text-sm">No classes assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }
  
  // Enhanced displayTeacherActiveTests from legacy code
  function renderActiveTests() {
    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <Card.Title>Active Tests</Card.Title>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={refreshTests}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/teacher/tests/create')}
                  >
                    Create New Test
                  </Button>
                </div>
              </div>
            </Card.Header>
          </Card>
        </motion.div>
        
        {activeTestsData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <Card.Body>
                <div className="text-center p-12">
                  <motion.div
                    className="text-6xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                  >
                    📝
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">No active tests found</h2>
                  <p className="text-gray-600 mb-6">Create your first test to get started with assessments.</p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/teacher/tests/create')}
                    size="lg"
                  >
                    Create Your First Test
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4"
          >
            {activeTestsData.map((test, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card>
                  <Card.Body>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 flex items-center space-x-4">
                        {/* Test Name */}
                        <h3 className="text-lg font-semibold text-gray-900 min-w-0 flex-shrink-0">
                          {test.test_name}
                        </h3>
                        
                        {/* Test Type Badge - Hidden on mobile */}
                        <span className="hidden sm:inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                          {test.test_type}
                        </span>
                        
                        {/* Desktop: Show all details */}
                        <div className="hidden sm:flex items-center space-x-4">
                          {/* Assignments Count */}
                          <div className="flex items-center space-x-1 text-sm text-gray-600 flex-shrink-0">
                            <span className="font-medium">Assignments:</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {test.assignments?.length || 0}
                            </span>
                          </div>
                          
                          {/* Assigned Classes */}
                          {test.assignments && test.assignments.length > 0 && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600 flex-shrink-0">
                              <span className="font-medium">Classes:</span>
                              <div className="flex flex-wrap gap-1">
                                {test.assignments.map((assignment, assignmentIndex) => (
                                  <span 
                                    key={assignmentIndex}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {assignment.grade}/{assignment.class}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Created Date */}
                          <div className="text-sm text-gray-500 flex-shrink-0">
                            {new Date(test.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        {/* Mobile: Show details in button */}
                        <div className="sm:hidden">
                          <Button
                            variant="outline"
                            onClick={() => handleShowTestDetails(test)}
                            size="sm"
                            className="text-xs"
                            title={`Type: ${test.test_type} | Assignments: ${test.assignments?.length || 0} | Classes: ${test.assignments?.map(a => `${a.grade}/${a.class}`).join(', ') || 'None'} | ${new Date(test.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })}`}
                          >
                            Details
                          </Button>
                        </div>
                        
                        {/* Desktop: Regular details button */}
                        <div className="hidden sm:block">
                          <Button
                            variant="outline"
                            onClick={() => handleShowTestDetails(test)}
                            size="sm"
                          >
                            Details
                          </Button>
                        </div>
                        
                        <Button
                          variant="success"
                          onClick={() => markCompleted(test.test_type, test.test_id)}
                          size="sm"
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }
};

export default TeacherCabinet;
