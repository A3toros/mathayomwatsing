import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TestProvider, useTest } from '@/contexts/TestContext';
import { UserProvider } from '@/contexts/UserContext';
import { Button } from '@/components/ui/components-ui-index';
import { LoadingSpinner, Notification } from '@/components/ui/components-ui-index';
import { userService } from '@/services/userService';
import { API_ENDPOINTS, USER_ROLES, CONFIG } from '@/shared/shared-index';
import StudentCabinet from './StudentCabinet';
import StudentTests from './StudentTests';
import StudentResults from './StudentResults';
import MatchingTestPage from './MatchingTestPage';
import WordMatchingPage from './WordMatchingPage';



// Test Page Component
const TestPage = () => {
  const { testType, testId } = useParams();
  const navigate = useNavigate();
  const { activeTests } = useTest();
  
  const handleBackToCabinet = () => {
    navigate('/student');
  };
  
  // Find the full test data including retest metadata
  const fullTestData = activeTests.find(test => 
    test.test_type === testType && test.test_id === parseInt(testId)
  );
  
  return (
    <StudentTests 
      onBackToCabinet={handleBackToCabinet}
      currentTest={fullTestData || { test_type: testType, test_id: parseInt(testId) }}
    />
  );
};

// Student App Component
const StudentApp = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // App state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Enhanced initializeStudentApp from legacy code
  const initializeStudentApp = useCallback(async () => {
    console.log('🎓 Initializing Student Application...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        console.log('🎓 User not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Validate student role
      if (user.role !== USER_ROLES.STUDENT) {
        console.error('🎓 Invalid user role for student app:', user.role);
        setError('Access denied. Student role required.');
        return;
      }
      
      // Initialize global events
      console.log('🎓 Initializing event listeners...');
      setupStudentEventListeners();
      
      // Set up back to cabinet button event listeners
      console.log('🎓 Setting up back to cabinet button listeners...');
      setupBackToCabinetListeners();
      
      // Set up password change form listener
      console.log('🎓 Setting up password change form listener...');
      setupPasswordChangeForm();
      
      // Load student data
      console.log('🎓 Loading student data...');
      await loadStudentData();
      
      // Make student functions available globally for HTML onclick handlers
      console.log('🎓 Exposing student functions globally...');
      exposeStudentFunctions();
      
      // Populate student info from user data
      console.log('🎓 Populating student info from user data...');
      populateStudentInfoDirectly(user);
      
      setIsInitialized(true);
      console.log('🎓 Student Application initialization complete!');
      
    } catch (error) {
      console.error('🎓 Error initializing student app:', error);
      setError('Failed to initialize student application');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, navigate]);
  
  // Initialize student app on component mount
  useEffect(() => {
    // Only initialize if authentication is not loading
    if (!authLoading) {
      initializeStudentApp();
    }
  }, [authLoading, isAuthenticated, user, initializeStudentApp]);
  
  // Enhanced setupStudentEventListeners from legacy code
  const setupStudentEventListeners = useCallback(() => {
    console.log('🎓 Setting up student event listeners...');
    
    // Global event listeners for student app
    const handleGlobalClick = (event) => {
      // Close menu when clicking outside
      if (isMenuOpen && !event.target.closest('.student-menu')) {
        setIsMenuOpen(false);
      }
    };
    
    const handleGlobalKeyDown = (event) => {
      // Close menu on Escape key
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    // Cleanup function
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isMenuOpen]);
  
  // Enhanced setupBackToCabinetListeners from legacy code
  const setupBackToCabinetListeners = useCallback(() => {
    console.log('🎓 Setting up back to cabinet listeners...');
    // React navigation handles this automatically
  }, []);
  
  // Enhanced setupPasswordChangeForm from legacy code
  const setupPasswordChangeForm = useCallback(() => {
    console.log('🎓 Setting up password change form...');
    // React form handling manages this automatically
  }, []);
  
  // Enhanced loadStudentData from legacy code
  const loadStudentData = useCallback(async () => {
    console.log('🎓 Loading student data...');
    try {
      // Student data loading is handled by UserContext
      console.log('🎓 Student data loaded successfully');
    } catch (error) {
      console.error('🎓 Error loading student data:', error);
      throw error;
    }
  }, []);
  
  // Enhanced exposeStudentFunctions from legacy code
  const exposeStudentFunctions = useCallback(() => {
    console.log('🎓 Exposing student functions globally...');
    
    // Expose student functions globally for HTML compatibility
    window.toggleStudentMenu = toggleStudentMenu;
    window.showChangePasswordTab = showChangePasswordTab;
    window.hideChangePasswordTab = hideChangePasswordTab;
    window.navigateBackToCabinet = navigateBackToCabinet;
    window.handlePasswordChange = handlePasswordChange;
    window.populateStudentInfoDirectly = populateStudentInfoDirectly;
    
    console.log('🎓 All student functions exposed globally');
  }, []);
  
  // Enhanced toggleStudentMenu from legacy code
  const toggleStudentMenu = useCallback(() => {
    console.log('🔧 toggleStudentMenu called');
    setIsMenuOpen(prev => {
      const newState = !prev;
      console.log('🔧 Menu state changed from', prev, 'to', newState);
      return newState;
    });
    console.log('🔧 Toggled dropdown menu');
  }, []);
  
  // Enhanced showChangePasswordTab from legacy code
  const showChangePasswordTab = useCallback(() => {
    console.log('🔧 showChangePasswordTab called');
    setShowPasswordChange(true);
    setIsMenuOpen(false);
  }, []);
  
  // Enhanced hideChangePasswordTab from legacy code
  const hideChangePasswordTab = useCallback(() => {
    console.log('🔧 hideChangePasswordTab called');
    setShowPasswordChange(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }, []);
  
  // Enhanced handlePasswordChange from legacy code
  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    console.log('🔧 handlePasswordChange called');
    
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    // Validation
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
    
    // Get current user from auth context
    if (!user || !user.student_id) {
      showNotification('Session expired. Please login again.', 'error');
      return;
    }
    
    const studentId = user.student_id;
    
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to change your password?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await userService.changePassword({
        studentId: studentId,
        currentPassword: currentPassword,
        newPassword: newPassword
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
    } finally {
      setIsLoading(false);
    }
  }, [passwordForm, user]);
  
  // Enhanced navigateBackToCabinet from legacy code
  const navigateBackToCabinet = useCallback(() => {
    console.log('[DEBUG] navigateBackToCabinet called');
    
    // Use React navigation
    if (!isAuthenticated || !user) {
      console.warn('[WARN] No valid user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role === USER_ROLES.STUDENT) {
      console.log('[DEBUG] Navigating to student cabinet');
      navigate('/student');
    } else {
      console.warn('[WARN] Unknown user role, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Enhanced populateStudentInfoDirectly from legacy code
  const populateStudentInfoDirectly = useCallback((studentData) => {
    console.log('🎓 populateStudentInfoDirectly called with:', studentData);
    
    try {
      // Student info is managed by React state in UserContext
      console.log('🎓 Student info populated successfully');
    } catch (error) {
      console.error('🎓 Error populating student info:', error);
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
  
  // Handle password form changes
  const handlePasswordFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Initializing Student Application...</p>
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
            <h2 className="text-lg font-semibold text-red-800 mb-2">Initialization Error</h2>
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
  
  // Not initialized state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Setting up Student Application...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50">
      <Routes>
        {/* Student Cabinet Route */}
        <Route path="/" element={
          <div className="student-app">
            {/* Student Cabinet Component */}
            <StudentCabinet 
              isMenuOpen={isMenuOpen}
              onToggleMenu={toggleStudentMenu}
              onShowPasswordChange={showChangePasswordTab}
            />
            
            {/* Password Change Modal */}
            {showPasswordChange && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Change Password
                  </h2>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label 
                        htmlFor="currentPassword" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* New Password */}
                    <div>
                      <label 
                        htmlFor="newPassword" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFormChange}
                        required
                        minLength={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Confirm Password */}
                    <div>
                      <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFormChange}
                        required
                        minLength={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Form Actions */}
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
                        type="submit"
                        variant="primary"
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        } />
        
        {/* Test Route */}
        <Route path="/test/:testType/:testId" element={<TestPage />} />
        
        {/* Matching Test Route */}
        <Route path="matching-test/:testId" element={<MatchingTestPage />} />
        
        {/* Word Matching Test Route */}
        <Route path="word-matching-test/:testId" element={<WordMatchingPage />} />
        
        {/* Results Route */}
        <Route path="/results" element={<StudentResults />} />
      </Routes>
      
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
};

// Student App with Context Providers
const StudentAppWithProviders = () => {
  return (
    <AuthProvider>
      <TestProvider>
        <UserProvider>
          <StudentApp />
        </UserProvider>
      </TestProvider>
    </AuthProvider>
  );
};

// Export main component
export default StudentAppWithProviders;
