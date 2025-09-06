// IMPORTS - Functions this module needs from shared and student modules
import { 
  getCurrentTeacherId,
  calculateScore,
  transformAnswersForSubmission,
  showSection,
  showNotification,
  initializeEventListeners
} from '../shared/index.js'

// Import student-specific functions
import { loadStudentData } from './student.js'

// Import student-specific CSS
import './student.css'

// No event listener initialization functions needed - they were inline in original code

// Helper function to populate student info directly
function populateStudentInfoDirectly(student) {
  console.log('🎓 populateStudentInfoDirectly called with:', student);
  
  try {
    // Populate student name
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement) {
      const fullName = `${student.name} ${student.surname}`;
      studentNameElement.textContent = fullName;
      console.log('🎓 Set student name to:', fullName);
    } else {
      console.warn('🎓 studentName element not found');
    }
    
    // Populate student grade
    const studentGradeElement = document.getElementById('studentGrade');
    if (studentGradeElement) {
      studentGradeElement.textContent = student.grade;
      console.log('🎓 Set student grade to:', student.grade);
    } else {
      console.warn('🎓 studentGrade element not found');
    }
    
    // Populate student class
    const studentClassElement = document.getElementById('studentClass');
    if (studentClassElement) {
      studentClassElement.textContent = student.class;
      console.log('🎓 Set student class to:', student.class);
    } else {
      console.warn('🎓 studentClass element not found');
    }
    
    console.log('🎓 Student info populated successfully');
  } catch (error) {
    console.error('🎓 Error populating student info:', error);
  }
}

// EXPORTS - Student app initialization
export {
  initializeStudentApp
}

function initializeStudentApp() {
  console.log('🎓 Initializing Student Application...')
  
  // Initialize global events first
  console.log('🎓 Initializing event listeners...');
  initializeEventListeners()
  
  // Set up back to cabinet button event listeners
  console.log('🎓 Setting up back to cabinet button listeners...');
  setupBackToCabinetListeners();
  
  // Set up password change form listener
  console.log('🎓 Setting up password change form listener...');
  const passwordForm = document.getElementById('changePasswordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
    console.log('🎓 Password change form listener added');
  } else {
    console.warn('🎓 Password change form not found');
  }
  
  // Load student data
  console.log('🎓 Loading student data...');
  loadStudentData()
  
  // Make student functions available globally for HTML onclick handlers
  console.log('🎓 Exposing student functions globally...');
  window.toggleStudentMenu = toggleStudentMenu;
  window.showChangePasswordTab = showChangePasswordTab;
  window.hideChangePasswordTab = hideChangePasswordTab;
  window.navigateBackToCabinet = navigateBackToCabinet;
  window.handlePasswordChange = handlePasswordChange;
  
  // Import and expose additional student functions
  Promise.all([
    import('./student-tests.js'),
    import('./student-results.js')
  ]).then(([studentTests, studentResults]) => {
    // Expose student-tests functions
    window.navigateToTest = studentTests.navigateToTest;
    window.hideTestSections = studentTests.hideTestSections;
    window.showTestResults = studentTests.showTestResults;
    window.loadTestResultsForPage = studentTests.loadTestResultsForPage;
    window.displayTestResultsOnPage = studentTests.displayTestResultsOnPage;
    window.setupTestResultsPageEventListeners = studentTests.setupTestResultsPageEventListeners;
    window.checkAnswerCorrectness = studentTests.checkAnswerCorrectness;
    window.getCorrectAnswer = studentTests.getCorrectAnswer;
    window.markTestCompletedInUI = studentTests.markTestCompletedInUI;
    window.clearTestDataAndReturnToCabinet = studentTests.clearTestDataAndReturnToCabinet;
    window.navigateToTestResults = studentTests.navigateToTestResults;
    window.loadStudentActiveTests = studentTests.loadStudentActiveTests;
    
    // Expose student-results functions
    window.loadStudentTestResults = studentResults.loadStudentTestResults;
    
    console.log('🎓 All student functions exposed globally');
    
    // Now that functions are loaded, call them
    console.log('🎓 Loading student active tests and results...');
    if (typeof window.loadStudentActiveTests === 'function') {
      window.loadStudentActiveTests();
    }
    
    if (typeof window.loadStudentTestResults === 'function') {
      window.loadStudentTestResults();
    }
  });
  
  // Populate student info from JWT token
  console.log('🎓 Populating student info from JWT...');
  try {
    const token = window.tokenManager.getAccessToken();
    const decoded = window.tokenManager.decodeToken(token);
    
    if (decoded && decoded.role === 'student') {
      const studentData = {
        student_id: decoded.sub,
        name: decoded.name,
        surname: decoded.surname,
        nickname: decoded.nickname,
        grade: decoded.grade,
        class: decoded.class,
        number: decoded.number
      };
      
      console.log('🎓 Extracted student data from JWT:', studentData);
      
      // Populate student info directly and load data
      console.log('🎓 Populating student info directly...');
      populateStudentInfoDirectly(studentData);
      
      // Student data loading is now handled in the Promise.then() block above
    } else {
      console.error('🎓 Invalid JWT token or not a student');
    }
  } catch (error) {
    console.error('🎓 Failed to extract student data from JWT:', error);
  }

  // Student data loading will be handled by auth module after login
  console.log('🎓 Student Application initialization complete!');
}

// Student-specific functions for HTML onclick handlers
function toggleStudentMenu() {
  console.log('🔧 toggleStudentMenu called');
  const dropdownMenu = document.getElementById('studentDropdownMenu');
  const menuBtn = document.getElementById('studentMenuBtn');
  
  console.log('🔧 dropdownMenu found:', !!dropdownMenu);
  console.log('🔧 menuBtn found:', !!menuBtn);
  
  if (dropdownMenu) {
    dropdownMenu.classList.toggle('show');
    console.log('🔧 Toggled dropdown menu, classes:', dropdownMenu.className);
  } else {
    console.error('❌ Dropdown menu not found');
  }
}

function showChangePasswordTab() {
  // Show password change section
  showSection('passwordChangeSection');
  
  // Hide dropdown menu
  const dropdownMenu = document.getElementById('studentDropdownMenu');
  if (dropdownMenu) {
    dropdownMenu.classList.remove('show');
  }
}

function hideChangePasswordTab() {
  // Return to student cabinet
  showSection('student-cabinet');
  
  // Clear form
  const form = document.getElementById('changePasswordForm');
  if (form) {
    form.reset();
  }
}

/**
 * Handle password change form submission
 */
async function handlePasswordChange(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 3) {
    showNotification('New password must be at least 3 characters long', 'error');
    return;
  }
  
  // Get current user from JWT token
  if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
    showNotification('Session expired. Please login again.', 'error');
    return;
  }
  
  const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
  if (!decoded || !decoded.sub) {
    showNotification('Invalid session. Please login again.', 'error');
    return;
  }
  
  const studentId = decoded.sub;
  
  // Show confirmation dialog
  if (!confirm('Are you sure you want to change your password?')) {
    return;
  }
  
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/change-student-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: studentId,
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Password changed successfully!', 'success');
      
      // Password updated successfully - JWT token remains valid
      
      // Return to cabinet
      hideChangePasswordTab();
    } else {
      showNotification(data.message || 'Failed to change password', 'error');
    }
  } catch (error) {
    console.error('Password change error:', error);
    showNotification('Failed to change password. Please try again.', 'error');
  }
}

// Set up back to cabinet button event listeners
function setupBackToCabinetListeners() {
  // Set up event listeners for all back to cabinet buttons
  const backButtons = [
    'backToCabinetBtn',
    'backToCabinetFromResultsBtn', 
    'backToCabinetBtn2'
  ];
  
  backButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', navigateBackToCabinet);
      console.log(`🎓 Set up event listener for ${buttonId}`);
    } else {
      console.warn(`🎓 Button ${buttonId} not found`);
    }
  });
}

// Navigate back to main cabinet
function navigateBackToCabinet() {
  console.log('[DEBUG] navigateBackToCabinet called');
  
  // Use JWT authentication instead of localStorage
  if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
    console.warn('[WARN] No valid JWT token found, redirecting to login');
    showSection('login-section');
    return;
  }
  
  try {
    const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
    console.log('[DEBUG] Current user from JWT:', decoded);
    
    if (decoded && decoded.role === 'student') {
      // Student - show student cabinet using existing system
      showSection('student-cabinet');
      console.log('[DEBUG] Student cabinet displayed via showSection');
      
      // Refresh the test list to show updated completion status
      setTimeout(() => {
        console.log('[DEBUG] Refreshing test list for student:', decoded.sub);
        if (typeof window.loadStudentActiveTests === 'function') {
          window.loadStudentActiveTests();
        }
        
        // Also refresh the test results/score table
        console.log('[DEBUG] Refreshing test results for student:', decoded.sub);
        if (typeof window.loadStudentTestResults === 'function') {
          window.loadStudentTestResults();
        }
      }, 100); // Small delay to ensure section is fully displayed
    } else if (decoded && decoded.role === 'teacher') {
      // Teacher - show teacher cabinet using existing system
      showSection('teacher-cabinet');
      console.log('[DEBUG] Teacher cabinet displayed via showSection');
    } else if (decoded && decoded.role === 'admin') {
      // Admin - show admin panel using existing system
      showSection('admin-panel');
      console.log('[DEBUG] Admin panel displayed via showSection');
    } else {
      console.warn('[WARN] Unknown user role, redirecting to login');
      showSection('login-section');
    }
  } catch (error) {
    console.error('[ERROR] Error decoding JWT token:', error);
    console.warn('[WARN] JWT token error, redirecting to login');
    showSection('login-section');
  }
}

// Student - Main Entry Point
// Functions: initializeStudentApp

// TODO: Copy functions from script.js
