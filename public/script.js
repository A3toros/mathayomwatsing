
// School Testing System - Main JavaScript File

// Global function availability check
console.log('🔧 Script loading - checking global functions...');
console.log('🔧 editUserRow available:', typeof editUserRow);
console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
console.log('🔧 deleteUser available:', typeof deleteUser);
console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
console.log('🔧 deleteSubject available:', typeof deleteSubject);


// DOM elements
const loginSection = document.getElementById('login-section');
const studentCabinet = document.getElementById('student-cabinet');
const teacherCabinet = document.getElementById('teacher-cabinet');
const adminPanel = document.getElementById('admin-panel');

/**
 * Debug function to check availability of key functions
 */
function checkFunctionAvailability() {
    console.log('🔧 Checking function availability...');
    console.log('🔧 editUserRow available:', typeof editUserRow);
    console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
    console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
    console.log('🔧 deleteUser available:', typeof deleteUser);
    console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
    console.log('🔧 deleteSubject available:', typeof deleteSubject);
}

/**
 * Handle force logout scenario - prevent automatic session restoration
 */
function handleForceLogout() {
    console.log('⚠️ Automatic session restoration blocked - force logout in progress');
    hideAllSections();
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
        loginSection.classList.add('active');
        loginSection.style.display = 'block';
        loginSection.style.visibility = 'visible';
        loginSection.style.opacity = '1';
    }
}

/**
 * Initialize application session based on JWT token
 * Handles automatic login for users with valid JWT sessions
 */
function initializeApplicationSession() {
    console.log('Checking for existing JWT session...');
    
    if (window.tokenManager && window.tokenManager.isAuthenticated()) {
        console.log('JWT session valid, checking user role...');
        try {
            const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
            if (decoded && decoded.role) {
                console.log('User role from JWT:', decoded.role);
                // User has valid JWT session, show appropriate section
                if (decoded.role === 'teacher') {
                    showSection('teacher-cabinet');
                    initializeTeacherCabinet();
                } else if (decoded.role === 'student') {
                    showSection('student-cabinet');
                    // Populate student information from JWT token
                    populateStudentInfo(decoded);
                } else if (decoded.role === 'admin') {
                    showSection('admin-panel');
                    // Initialize admin panel if needed
                }
            } else {
                console.log('No valid role found in JWT, showing login');
                showSection('login-section');
            }
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            showSection('login-section');
        }
    } else {
        console.log('No valid JWT session found, showing login');
        // No valid session, show login
        showSection('login-section');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Check function availability
    checkFunctionAvailability();
    
    // JWT system handles session management - no need for legacy session restoration
    // checkAndClearExpiredStorage(); - REMOVED
    
    initializeEventListeners();
    
    // Check if we're forcing logout - prevent automatic session restoration
    if (window.forceLogout || window.preventAutoLogin) {
        handleForceLogout();
        return;
    }
    
    // Initialize application session
    initializeApplicationSession();
});

// Utility functions from working template
function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `status ${type || ''}`;
    
    // Ensure the status message is visible (scroll to it if needed)
    if (type === 'error') {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function disableForm(form, disable = true) {
    if (!form) return;
    Array.from(form.elements).forEach(element => {
        element.disabled = disable;
    });
}

async function sendRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Parse response as JSON
        const result = await response.json();
        
        // Handle non-2xx responses
        if (!response.ok) {
            const errorMessage = result.error || result.details || `Server responded with status ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return result;
    } catch (error) {
        // Re-throw network or parsing errors
        throw error;
    }
}

function isAnswerCorrect(questionId, userAnswer, correctAnswers) {
    const possibleAnswers = correctAnswers[questionId] || [];
    
    // If no correct answers are defined, consider it incorrect
    if (possibleAnswers.length === 0) return false;
    
    // Normalize the user answer (trim and lowercase)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    
    // Check if the normalized user answer matches any of the possible correct answers
    return possibleAnswers.some(correctAnswer => 
        normalizedUserAnswer === correctAnswer.trim().toLowerCase()
    );
}

function calculateScore(answers, correctAnswers) {
    let score = 0;
    
    for (const questionId in answers) {
        if (isAnswerCorrect(questionId, answers[questionId], correctAnswers)) {
            score++;
        }
    }
    
    return score;
}

// Legacy localStorage helper functions removed - JWT system handles storage management
// function saveToLocalStorage(key, data) - REMOVED
// function saveFormData(formId, formData) - REMOVED
// function restoreFormData(formId) - REMOVED
// function clearFormData(formId) - REMOVED

// JWT-based helper functions for user information
function getCurrentTeacherId() {
    try {
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for teacher');
            return null;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        if (decoded && decoded.sub) {
            console.log(`[DEBUG] Found teacher ID from JWT: ${decoded.sub}`);
            return decoded.sub;
        } else {
            console.warn('[WARN] No teacher ID found in JWT token');
            return null;
        }
    } catch (error) {
        console.error('[ERROR] Error getting current teacher ID from JWT:', error);
        return null;
    }
}

function getCurrentTeacherUsername() {
    try {
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for teacher');
            return null;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        if (decoded && decoded.username) {
            console.log(`[DEBUG] Found teacher username from JWT: ${decoded.username}`);
            return decoded.username;
        } else {
            console.warn('[WARN] No teacher username found in JWT token');
            return null;
        }
    } catch (error) {
        console.error('[ERROR] Error getting current teacher username from JWT:', error);
        return null;
    }
}

// Legacy checkAndClearExpiredStorage function removed - JWT system handles session expiration
// function checkAndClearExpiredStorage() - REMOVED

// Legacy localStorage helper functions removed - JWT system handles storage management
// function getFromLocalStorage(key) - REMOVED
// function clearLocalStorage() - REMOVED

// Legacy clearUserSessionData function removed - JWT system handles session clearing
// function clearUserSessionData() - REMOVED

// Legacy debugRemainingSessionData function removed - JWT system handles debugging
// function debugRemainingSessionData() - REMOVED

function forceCompleteLogout() {
    console.log('🚨 FORCE COMPLETE LOGOUT INITIATED');
    
    // Set all blocking flags
    window.forceLogout = true;
    window.preventAutoLogin = true;
    window.isClearingSession = true;
    window.forceLogoutComplete = true;
    
    // CRITICAL FIX: Remove 'active' class from ALL sections before clearing storage
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
        console.log(`🚨 Removed active class and hidden section: ${section.id}`);
    });
    
    // Clear ALL storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Reset all global variables (legacy variables removed - JWT system handles session)
    // if (typeof currentUser !== 'undefined') currentUser = null; - REMOVED
    // if (typeof currentUserType !== 'undefined') currentUserType = null; - REMOVED
    // if (typeof teacherSubjects !== 'undefined') teacherSubjects = []; - REMOVED
    // if (typeof currentTestType !== 'undefined') currentTestType = null; - REMOVED
    
    // Force page reload with cache busting
    const timestamp = new Date().getTime();
    window.location.href = window.location.pathname + '?v=' + timestamp + '&logout=true';
}

function resetInterfaceAfterSessionClear() {
    try {
        console.log('🔄 Starting interface reset...');
        
        // Set a flag to prevent any automatic login
        window.forceLogout = true;
        window.preventAutoLogin = true;
        
        // CRITICAL FIX: Remove 'active' class from ALL sections first
        const allSections = document.querySelectorAll('.section');
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
            section.style.visibility = 'hidden';
            section.style.opacity = '0';
            console.log(`🗑️ Removed active class and hidden section: ${section.id}`);
        });
        
        // Hide all user-specific sections
        const sectionsToHide = [
            'student-cabinet',
            'teacher-cabinet', 
            'admin-cabinet',
            'test-creation',
            'test-page',
            'subject-selection-container',
            'main-cabinet-container'
        ];
        
        sectionsToHide.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.remove('active');
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.style.opacity = '0';
                console.log(`🗑️ Hidden section: ${sectionId}`);
            } else {
                console.log(`⚠️ Section not found: ${sectionId}`);
            }
        });
        
        // Also hide any other sections that might be visible
        const additionalSections = document.querySelectorAll('[id$="-cabinet"], [id$="-container"], [id*="cabinet"], [id*="container"]');
        additionalSections.forEach(section => {
            if (section.id && section.id !== 'login-section') {
                section.classList.remove('active');
                section.style.display = 'none';
                section.style.visibility = 'hidden';
                section.style.opacity = '0';
                console.log(`🗑️ Hidden additional section: ${section.id}`);
            }
        });
        
        // Clear any active states or classes
        document.body.classList.remove('student-logged-in', 'teacher-logged-in', 'admin-logged-in');
        document.body.classList.add('force-logout');
        
        // Show login section - CRITICAL: Add active class and show
        const loginSection = document.getElementById('login-section');
        if (loginSection) {
            loginSection.classList.add('active');
            loginSection.style.display = 'block';
            loginSection.style.visibility = 'visible';
            loginSection.style.opacity = '1';
            console.log('✅ Login section activated and visible');
        }
        
        // Debug any remaining session data
        debugRemainingSessionData();
        
        // Clear any remaining form data or cached inputs
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            if (input.type !== 'hidden') {
                input.value = '';
                input.checked = false;
            }
        });
        
        // Force a page refresh to ensure clean state
        console.log('🔄 Interface reset complete, forcing page refresh...');
        setTimeout(() => {
            // Clear all localStorage one more time before refresh
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }, 500);
        
        console.log('✅ Interface reset to login state');
    } catch (error) {
        console.error('Error resetting interface:', error);
        // Fallback: force page refresh
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }
}

// Legacy saveUserSession function removed - JWT system handles session management
// function saveUserSession(userData, userType) - REMOVED

// Legacy restoreUserSession function removed - JWT system handles session restoration
// function restoreUserSession() - REMOVED

// Reset login form to working state
function resetLoginForm() {
    const loginForm = document.getElementById('unifiedLoginForm');
    if (loginForm) {
        // Re-enable all form inputs
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.cursor = 'text';
            input.removeAttribute('readonly');
            input.style.pointerEvents = 'auto';
        });
        
        // Clear any disabled states
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.style.pointerEvents = 'auto';
        }
        
        // Remove any test-related classes or states
        loginForm.classList.remove('test-submitting', 'disabled');
        
        // Ensure the form is visible and interactive
        loginForm.style.pointerEvents = 'auto';
        
        console.log('Login form reset successfully - all inputs re-enabled');
    }
}

// Event listeners initialization
function initializeEventListeners() {
    // Unified login form submission
    const loginForm = document.getElementById('unifiedLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleUnifiedLogin);
        
        // Add auto-save for login form
        const usernameInput = loginForm.querySelector('input[name="username"]');
        const passwordInput = loginForm.querySelector('input[name="password"]');
        
        if (usernameInput && passwordInput) {
            // JWT system handles session management - no need to save/restore form data
            // Form data is cleared after successful login
        }
    }

    // Menu button functionality
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        console.log('Menu button found, adding click listener');
        menuBtn.addEventListener('click', toggleMenu);
    } else {
        console.error('Menu button not found!');
    }

    // Teacher cabinet navigation - only add if elements exist
    const backToLogin = document.getElementById('backToLogin');
    if (backToLogin) {
        backToLogin.addEventListener('click', () => showSection('login-section'));
    }

    const backToLoginTeacher = document.getElementById('backToLoginTeacher');
    if (backToLoginTeacher) {
        backToLoginTeacher.addEventListener('click', () => showSection('login-section'));
    }

    const backToLoginAdmin = document.getElementById('backToLoginAdmin');
    if (backToLoginAdmin) {
        backToLoginAdmin.addEventListener('click', () => showSection('login-section'));
    }

    // Student cabinet navigation
    const studentBackToLogin = document.getElementById('studentBackToLogin');
    if (studentBackToLogin) {
        studentBackToLogin.addEventListener('click', () => showSection('login-section'));
    }

    // Teacher cabinet functionality - only add if elements exist
    // Note: saveSubjectsBtn event listener is set up in initializeTeacherCabinet()

    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.addEventListener('click', showSubjectSelection);
    }

    // Admin panel functionality - only add if elements exist
    const adminBackToLogin = document.getElementById('adminBackToLogin');
    if (adminBackToLogin) {
        adminBackToLogin.addEventListener('click', () => showSection('login-section'));
    }

    const debugFunctionsBtn = document.getElementById('debugFunctionsBtn');
    if (debugFunctionsBtn) {
        debugFunctionsBtn.addEventListener('click', showDebugFunctions);
    }

    const editSubjectsAdminBtn = document.getElementById('editSubjectsAdminBtn');
    if (editSubjectsAdminBtn) {
        editSubjectsAdminBtn.addEventListener('click', showAdminSubjectEditor);
    }

    const checkAcademicYearBtn = document.getElementById('checkAcademicYearBtn');
    if (checkAcademicYearBtn) {
        checkAcademicYearBtn.addEventListener('click', showAcademicYearEditor);
    }
}

// Section management
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // CRITICAL FIX: First remove active class from ALL sections
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
        console.log('Removed active from:', section.id);
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        targetSection.style.visibility = 'visible';
        targetSection.style.opacity = '1';
        console.log('Added active to:', sectionId);
        console.log('Target section element:', targetSection);
        console.log('Target section classes:', targetSection.className);
        
        // Debug: Check if sections are actually hidden/shown
        allSections.forEach(section => {
            console.log(`Section ${section.id}:`, {
                display: window.getComputedStyle(section).display,
                classes: section.className,
                visible: section.classList.contains('active')
            });
        });
        
        // Re-initialize form elements when showing login section
        if (sectionId === 'login-section') {
            console.log('Re-initializing login form...');
            resetLoginForm();
        }
    } else {
        console.error('Target section not found:', sectionId);
    }
}

// Utility function to hide all sections
function hideAllSections() {
    console.log('Hiding all sections...');
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
        console.log(`Hidden section: ${section.id}`);
    });
}

// ===== HELPER FUNCTIONS FOR ASYNC LOGIN PATTERN =====

// Admin Login API
async function adminLogin(credentials) {
    console.log('Trying admin login...');
    const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response;
}

// Teacher Login API
async function teacherLogin(credentials) {
    console.log('Trying teacher login...');
    const response = await fetch('/.netlify/functions/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response;
}

// Student Login API
async function studentLogin(credentials) {
    console.log('Trying student login...');
    const response = await fetch('/.netlify/functions/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: credentials.username, password: credentials.password })
    });
    return response;
}

// Unified Response Handler
async function handleLoginResponse(response, role, data) {
    if (response.ok && data.success) {
        // ✅ DEFENSIVE: Validate JWT system availability
        if (!window.tokenManager || !window.roleBasedLoader) {
            console.error('[ERROR] JWT system not available during login response handling');
            handleLoginFailure();
            return false;
        }
        
        // Initialize JWT system
        if (data.accessToken && data.role) {
            try {
                window.tokenManager.setTokens(data.accessToken, data.role);
                window.roleBasedLoader.setupAccessAfterLogin();
            } catch (error) {
                console.error('[ERROR] Failed to initialize JWT system:', error);
                handleLoginFailure();
                return false;
            }
        }
        
        // Reset form to working state
        resetLoginForm();
        
        // Handle role-specific post-login actions
        await handlePostLoginActions(data, role);
        
        return true; // Success
    }
    return false; // Failure
}

// Post-Login Action Handler
async function handlePostLoginActions(data, role) {
    switch (role) {
        case 'admin':
            console.log('Admin login successful, role:', data.role);
            showSection('admin-panel');
            break;
            
        case 'teacher':
            console.log('Teacher login successful, role:', data.role);
            console.log('Teacher data:', data.teacher);
            showSection('teacher-cabinet');
            
            // ✅ DEFENSIVE: Validate teacher functions exist
            if (typeof initializeTeacherCabinet === 'function' && typeof checkTeacherSubjects === 'function') {
                // Initialize teacher cabinet functionality
                setTimeout(() => {
                    try {
                        initializeTeacherCabinet();
                        checkTeacherSubjects();
                    } catch (error) {
                        console.error('[ERROR] Failed to initialize teacher cabinet:', error);
                    }
                }, 100);
            } else {
                console.error('[ERROR] Teacher functions not available:', {
                    initializeTeacherCabinet: typeof initializeTeacherCabinet,
                    checkTeacherSubjects: typeof checkTeacherSubjects
                });
            }
            break;
            
        case 'student':
            console.log('Student login successful, role:', data.role);
            console.log('Student data:', data.student);
            showSection('student-cabinet');
            
            // ✅ DEFENSIVE: Validate student functions exist
            if (typeof populateStudentInfo === 'function') {
                try {
                    // Populate student information from JWT token
                    populateStudentInfo(data.student);
                } catch (error) {
                    console.error('[ERROR] Failed to populate student info:', error);
                }
            } else {
                console.error('[ERROR] Student function not available:', {
                    populateStudentInfo: typeof populateStudentInfo
                });
            }
            break;
            
        default:
            console.error('Unknown role:', role);
    }
}

// Login Failure Handler
function handleLoginFailure() {
    console.log('All login attempts failed');
    resetLoginForm();
    alert('Login failed. Please check your credentials and try again.');
}

// ===== MAIN LOGIN FUNCTION =====

// Unified login handler
async function handleUnifiedLogin(e) {
    e.preventDefault();
    
    // Check if we're forcing logout - prevent any login attempts
    if (window.forceLogout || window.preventAutoLogin) {
        console.log('⚠️ Login blocked - force logout in progress');
        alert('Please wait for the logout process to complete.');
        return;
    }
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('Attempting login with:', username, password);

    // Get form elements and show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // ✅ DEFENSIVE: Validate form elements exist
    if (!submitBtn || !usernameInput || !passwordInput) {
        console.error('[ERROR] Required form elements not found:', {
            submitBtn: !!submitBtn,
            usernameInput: !!usernameInput,
            passwordInput: !!passwordInput
        });
        alert('Login form error. Please refresh the page and try again.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div> Logging in...';
    usernameInput.disabled = true;
    passwordInput.disabled = true;

    const credentials = { username, password };

    try {
        // Try admin login first
        if (username === 'admin') {
            const response = await adminLogin(credentials);
            const data = await response.json();
            if (await handleLoginResponse(response, 'admin', data)) return;
        }

        // Try teacher login
        if (username === 'Alex' || username === 'Charlie') {
            const response = await teacherLogin(credentials);
            const data = await response.json();
            if (await handleLoginResponse(response, 'teacher', data)) return;
        }

        // Try student login
        if (/^\d+$/.test(username)) {
            const response = await studentLogin(credentials);
            const data = await response.json();
            if (await handleLoginResponse(response, 'student', data)) return;
        }

        // All login attempts failed
        handleLoginFailure();
        
    } catch (error) {
        console.error('Login error:', error);
        handleLoginFailure();
    }
}

// Student cabinet functionality
function populateStudentInfo(student) {
    console.log('Populating student info:', student);
    
    // Populate student name
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement) {
        studentNameElement.textContent = `${student.name} ${student.surname}`;
    }
    
    // Populate student grade
    const studentGradeElement = document.getElementById('studentGrade');
    if (studentGradeElement) {
        studentGradeElement.textContent = student.grade;
    }
    
    // Populate student class
    const studentClassElement = document.getElementById('studentClass');
    if (studentClassElement) {
        studentClassElement.textContent = student.class;
    }
    
    console.log('Student info populated successfully');
    
    // Load active tests for this student
    console.log('About to call loadStudentActiveTests with student_id:', student.student_id);
            loadStudentActiveTests();
    
    // Load test results for this student
    console.log('About to call loadStudentTestResults with student_id:', student.student_id);
            loadStudentTestResults();
}

// Load active tests for student
async function loadStudentActiveTests() {
    console.log('loadStudentActiveTests called - extracting studentId from JWT token');
    
    // Show loading state
    const container = document.getElementById('studentActiveTests');
    if (container) {
        container.innerHTML = `
            <div class="loading-tests">
                <div class="loading-spinner"></div>
                <p>Loading tests...</p>
            </div>
        `;
    }
    
    try {
        console.log('Fetching student active tests using JWT authentication...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-active-tests'
        );
        
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Full response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('Successfully loaded tests, calling displayStudentActiveTests');
            displayStudentActiveTests(data.tests);
        } else {
            console.error('Error loading student active tests:', data.error);
            // Show error state
            if (container) {
                container.innerHTML = '<p class="error-message">Error loading tests. Please try again.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading student active tests:', error);
        // Show error state
        if (container) {
            container.innerHTML = '<p class="error-message">Error loading tests. Please try again.</p>';
        }
    }
}

// Check if a test has been completed by the current student
async function isTestCompleted(testType, testId) {
    try {
        // Extract studentId from JWT token
        const token = window.tokenManager.getAccessToken();
        if (!token) {
            console.warn('[WARN] No access token available for isTestCompleted');
            return false;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        const studentId = decoded.sub;
        
        console.log(`🔍 Checking completion for test ${testType}_${testId} for student ${studentId}`);
        
        // Check local storage first (for immediate feedback)
        const localKey = `test_completed_${testType}_${testId}_${studentId}`;
        const localStatus = localStorage.getItem(localKey);
        if (localStatus === 'true') {
            console.log(`✅ Found completion status in local storage: ${localStatus}`);
            return true;
        }
        
        // Check database for existing results
        try {
            console.log(`🌐 Checking database for completion status...`);
            const response = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/check-test-completion?test_type=${testType}&test_id=${testId}`
            );
            const data = await response.json();
            
            console.log(`📊 Database response:`, data);
            
            if (data.success && data.isCompleted) {
                // Mark as completed in local storage for future checks
                localStorage.setItem(localKey, 'true');
                console.log(`✅ Test marked as completed in local storage`);
                return true;
            }
            
            console.log(`❌ Test not completed according to database`);
            return false;
        } catch (error) {
            console.error('❌ Error checking test completion:', error);
            return false; // Allow test if we can't check
        }
    } catch (error) {
        console.error('[ERROR] Failed to check test completion:', error);
        return false;
    }
}

// Mark a test as completed
async function markTestCompleted(testType, testId) {
    console.log(`[DEBUG] markTestCompleted called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Extract studentId from JWT token
        const token = window.tokenManager.getAccessToken();
        if (!token) {
            console.warn('[WARN] No access token available for markTestCompleted');
            return;
        }
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        const studentId = decoded.sub;
        
        const key = `test_completed_${testType}_${testId}_${studentId}`;
        console.log(`[DEBUG] Setting localStorage key: ${key}`);
        
        localStorage.setItem(key, 'true');
        console.log(`[DEBUG] ✅ Marked test ${testType}_${testId} as completed for student ${studentId}`);
        console.log(`[DEBUG] 💾 Saved to local storage with key: ${key}`);
    } catch (error) {
        console.error('[ERROR] Failed to mark test as completed:', error);
    }
}
// Display active tests for student
async function displayStudentActiveTests(tests) {
    try {
        // Extract studentId from JWT token
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for displayStudentActiveTests');
            return;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        console.log('[DEBUG] Full JWT token decoded:', decoded);
        console.log('[DEBUG] Available fields in JWT:', Object.keys(decoded || {}));
        
        // Check for different possible field names for student ID
        const studentId = decoded?.student_id || decoded?.sub || decoded?.user_id || decoded?.id;
        if (!studentId) {
            console.warn('[WARN] No student_id found in JWT token. Available fields:', Object.keys(decoded || {}));
            return;
        }
        
        console.log('[DEBUG] Using student ID:', studentId);
        
        console.log('displayStudentActiveTests called with tests:', tests);
        
        const container = document.getElementById('studentActiveTests');
        if (!container) {
            console.error('studentActiveTests container not found');
            return;
        }
        
        console.log('Container found, tests length:', tests.length);
        
        if (tests.length === 0) {
            console.log('No tests found, showing "no tests" message');
            container.innerHTML = '<p>No active tests available for your class.</p>';
            return;
        }
        
        // Check completion status for all tests
        const completionChecks = tests.map(async test => {
            const isCompleted = await isTestCompleted(test.test_type, test.test_id);
            console.log(`Test ${test.test_name} (${test.test_type}_${test.test_id}) completion status:`, isCompleted);
            return { ...test, isCompleted };
        });
        
        const testsWithCompletion = await Promise.all(completionChecks);
    
    // Filter out any tests that might be expired (double safety)
    const activeTests = testsWithCompletion.filter(test => {
        const daysSinceAssigned = Math.floor((Date.now() - new Date(test.assigned_at)) / (1000 * 60 * 60 * 24));
        return daysSinceAssigned <= 7;
    });
    
    console.log(`Filtered ${testsWithCompletion.length} total tests to ${activeTests.length} active tests`);
    
    // Check if all tests are expired after filtering
    if (activeTests.length === 0) {
        console.log('All tests are expired, showing "no active tests" message');
        container.innerHTML = '<p>No active tests available for your class. All tests have expired.</p>';
        return;
    }
    
    // Sort by assigned_at desc (fallback: test_id desc)
    const sorted = [...activeTests].sort((a, b) => {
        const atA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
        const atB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
        if (atA !== atB) return atB - atA;
        return (b.test_id || 0) - (a.test_id || 0);
    });

    const top = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Compute average score from student's historical results using JWT authentication
    let averagePct = null;
    try {
        // Use the studentId already extracted from JWT token above
        if (studentId) {
            const response = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/get-student-test-results?student_id=${studentId}`
            );
            const data = await response.json();
            if (data && data.success && Array.isArray(data.results)) {
                const results = data.results;
                if (results.length > 0) {
                    const sum = results.reduce((acc, r) => {
                        if (typeof r.score_percentage === 'number') return acc + r.score_percentage;
                        if (typeof r.score === 'number' && typeof r.max_score === 'number' && r.max_score > 0) {
                            return acc + Math.round((r.score / r.max_score) * 100);
                        }
                        return acc;
                    }, 0);
                    averagePct = Math.round(sum / results.length);
                }
            }
        }
    } catch (error) {
        console.warn('[WARN] Failed to load average score:', error);
    }

    const getAvgMessage = (pct) => {
        if (pct == null) return 'Godspeed!';
        if (pct >= 95) return 'Impeccable';
        if (pct >= 90) return 'Super-duper Awesome';
        if (pct >= 85) return 'Brilliant';
        if (pct >= 80) return 'Spectacular';
        if (pct >= 75) return 'Wonderful';
        if (pct >= 70) return 'Amazing';
        if (pct >= 65) return 'Good one';
        if (pct >= 60) return 'Nice';
        if (pct >= 55) return 'Cool';
        if (pct >= 50) return 'Could be better';
        return 'Try harder';
    };

    const renderItem = (test) => {
        return `
            <div class="student-active-item ${test.isCompleted ? 'completed' : ''}" data-test-id="${test.test_id}" data-test-type="${test.test_type}">
                <div class="student-active-info">
                    <span class="student-test-name">${test.test_name}</span>
                    <span class="dot">·</span>
                    <span class="student-subject">${test.subject_name}</span>
                    <span class="dot">·</span>
                    <span class="student-teacher">${test.teacher_name}</span>
                </div>
                <div class="student-active-actions">
                    ${test.isCompleted ?
                        '<span class="student-completed-text">Completed</span>' :
                        `<button class="btn btn-primary btn-sm start-test-btn" type="button" onclick="navigateToTest('${test.test_type}', ${test.test_id})">Start</button>`
                    }
                </div>
            </div>
        `;
    };

    let html = '<div class="student-active-list">';
    html += top.map(renderItem).join('');
    html += '</div>';

    // If more tests exist, show Expand above the graph
    if (rest.length > 0) {
        html += `
            <div id="studentActiveExpandRow" class="student-active-expand-row">
                <button id="studentActiveExpand" class="link-minimal" type="button">Expand</button>
            </div>
        `;
    }

    if (rest.length > 0) {
        html += `
            <div id="studentActiveHidden" class="student-active-list" style="display:none;">
                ${rest.map(renderItem).join('')}
            </div>
            <div id="studentActiveCollapseRow" class="student-active-expand-row" style="display:none;">
                <button id="studentActiveCollapse" class="link-minimal" type="button">Collapse</button>
            </div>
        `;
    }

    // Average widget should be below all tests (after expanded list)
    const pct = averagePct != null ? Math.min(100, Math.max(0, averagePct)) : null;
    const r = 50; // outer radius
    const c = 2 * Math.PI * r; // circumference for outer ring
    const dash = pct == null ? 0 : c * (1 - pct / 100);
    const msgClass = pct == null ? 'neutral' : (pct <= 50 ? 'low' : (pct <= 70 ? 'mid' : 'high'));
    html += `
        <div class="avg-score-widget">
            <div class="avg-title">Average score</div>
            <svg class="avg-circle" width="140" height="140" viewBox="0 0 140 140" aria-label="Average score">
                <defs>
                    <linearGradient id="avgViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8a2be2"/>
                        <stop offset="100%" stop-color="#a855f7"/>
                    </linearGradient>
                    <linearGradient id="avgFillPB" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8a2be2"/>
                        <stop offset="100%" stop-color="#3b82f6"/>
                    </linearGradient>
                </defs>
                
                <circle cx="70" cy="70" r="50" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                <circle cx="70" cy="70" r="50" fill="none" stroke="url(#avgFillPB)" stroke-width="8" 
                        stroke-dasharray="${c}" stroke-dashoffset="${dash}" 
                        transform="rotate(-90 70 70)"/>
            </svg>
            <div class="avg-text">
                <span class="avg-number">${pct != null ? pct : '?'}</span>
                <span class="avg-percent">%</span>
            </div>
            <div class="avg-message">${getAvgMessage(pct)}</div>
        </div>
    `;

    container.innerHTML = html;

    // Setup expand/collapse functionality
    if (rest.length > 0) {
        const expandBtn = document.getElementById('studentActiveExpand');
        const collapseBtn = document.getElementById('studentActiveCollapse');
        const hiddenList = document.getElementById('studentActiveHidden');
        const expandRow = document.getElementById('studentActiveExpandRow');
        const collapseRow = document.getElementById('studentActiveCollapseRow');

        if (expandBtn && collapseBtn && hiddenList && expandRow && collapseRow) {
            expandBtn.onclick = () => {
                hiddenList.style.display = 'block';
                expandRow.style.display = 'none';
                collapseRow.style.display = 'block';
            };

            collapseBtn.onclick = () => {
                hiddenList.style.display = 'none';
                expandRow.style.display = 'block';
                collapseRow.style.display = 'none';
            };
        }
    }
} catch (error) {
    console.error('[ERROR] Failed to display student active tests:', error);
}
}

// View test details (questions and correct answers)
async function viewTestDetails(testType, testId, testName) {
    console.log('Viewing test details:', { testType, testId, testName });
    
    try {
        // Load test questions
        const questions = await loadTestQuestions(testType, testId);
        
        if (questions && questions.length > 0) {
            // Show test details in a modal or overlay
            showTestDetailsModal(testType, testId, testName, questions);
        } else {
            alert('Could not load test questions. Please try again.');
        }
    } catch (error) {
        console.error('Error loading test details:', error);
        alert('Error loading test details. Please try again.');
    }
}
// Show test details modal
function showTestDetailsModal(testType, testId, testName, questions) {
    // Create modal HTML
    const modalHTML = `
        <div id="testDetailsModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${testName}</h3>
                    <button class="modal-close" onclick="closeTestDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="test-questions">
                        ${questions.map((question, index) => `
                            <div class="question-item">
                                <h4>Question ${index + 1}</h4>
                                <p class="question-text">${question.question}</p>
                                ${getQuestionAnswerDisplay(question, testType)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('testDetailsModal');
    modal.style.display = 'flex';
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeTestDetailsModal();
        }
    });
}

// Get question answer display based on test type
function getQuestionAnswerDisplay(question, testType) {
    console.log('getQuestionAnswerDisplay called with:', { question, testType });
    
    switch (testType) {
        case 'multiple_choice':
            console.log('Multiple choice question data:', {
                option_a: question.option_a,
                option_b: question.option_b,
                option_c: question.option_c,
                option_d: question.option_d,
                option_e: question.option_e,
                option_f: question.option_f,
                correct_answer: question.correct_answer
            });
            return `
                <div class="answer-options">
                    <p><strong>Options:</strong></p>
                    <p>A) ${question.option_a || 'No text'}</p>
                    <p>B) ${question.option_b || 'No text'}</p>
                    ${question.option_c ? `<p>C) ${question.option_c}</p>` : ''}
                    ${question.option_d ? `<p>D) ${question.option_d}</p>` : ''}
                    ${question.option_e ? `<p>E) ${question.option_e}</p>` : ''}
                    ${question.option_f ? `<p>F) ${question.option_f}</p>` : ''}
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer || 'Not specified'}</strong></p>
                </div>
            `;
        case 'true_false':
            console.log('True/false question data:', { correct_answer: question.correct_answer });
            return `
                <div class="answer-options">
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer ? 'True' : 'False'}</strong></p>
                </div>
            `;
        case 'input':
            console.log('Input question data:', { correct_answer: question.correct_answer });
            return `
                <div class="answer-options">
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer || 'Not specified'}</strong></p>
                </div>
            `;
        default:
            console.log('Unknown test type:', testType);
            return '<p>Unknown question type</p>';
    }
}

// Close test details modal
function closeTestDetailsModal() {
    const modal = document.getElementById('testDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Global loading state to prevent multiple simultaneous calls
let isLoadingTestResults = false;

// Load test results for student
async function loadStudentTestResults() {
    // Prevent multiple simultaneous calls
    if (isLoadingTestResults) {
        console.log('loadStudentTestResults already in progress, skipping duplicate call');
        return;
    }
    
    isLoadingTestResults = true;
    console.log('loadStudentTestResults called - extracting studentId from JWT token');
    
    try {
        console.log('Fetching test results using JWT authentication...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-test-results'
        );
        
        console.log('Test results response received:', response);
        console.log('Test results response status:', response.status);
        
        const data = await response.json();
        console.log('Test results data:', data);
        
        if (data.success) {
            console.log('Successfully loaded test results, calling displayStudentTestResults');
            console.log('Raw results array length:', data.results.length);
            
            // Log each result for debugging
            data.results.forEach((result, index) => {
                console.log(`Result ${index + 1}:`, {
                    test_type: result.test_type,
                    test_id: result.test_id,
                    id: result.id,
                    student_id: result.student_id,
                    test_name: result.test_name,
                    subject: result.subject,
                    score: result.score,
                    max_score: result.max_score,
                    // Log all available fields
                    all_fields: Object.keys(result),
                    full_result: result
                });
            });
            
            displayStudentTestResults(data.results);
        } else {
            console.error('Error loading student test results:', data.error);
        }
    } catch (error) {
        console.error('Error loading student test results:', error);
    } finally {
        isLoadingTestResults = false;
    }
}

// Display test results for student
function displayStudentTestResults(results) {
    console.log('displayStudentTestResults called with results:', results);
    console.log('Results array type:', Array.isArray(results));
    console.log('Results array length:', results.length);
    
    const container = document.getElementById('studentTestResults');
    if (!container) {
        console.error('studentTestResults container not found');
        return;
    }
    
    console.log('Test results container found, results length:', results.length);
    console.log('Container current content length:', container.innerHTML.length);
    
    // Clear the container first to prevent duplication
    container.innerHTML = '';
    console.log('Container cleared, new content length:', container.innerHTML.length);
    
    if (results.length === 0) {
        console.log('No test results found, showing "no results" message');
        container.innerHTML = '<p>No test results available yet.</p>';
        return;
    }
    
    // Deduplicate results based on unique combination of test_type, test_id, and student_id
    const uniqueResults = [];
    const seenKeys = new Set();
    
    console.log('Starting deduplication process...');
    results.forEach((result, index) => {
        // Create a unique key for each test result
        // Use test_id if available, otherwise fall back to id or test_name
        const testId = result.test_id || result.id || result.test_name;
        const studentId = result.student_id || 'unknown';
        
        const uniqueKey = `${result.test_type}_${testId}_${studentId}`;
        
        console.log(`Processing result ${index + 1}:`, {
            uniqueKey,
            test_type: result.test_type,
            test_id: result.test_id,
            id: result.id,
            student_id: result.student_id,
            test_name: result.test_name,
            score: result.score,
            max_score: result.max_score
        });
        
        if (!seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            uniqueResults.push(result);
            console.log(`✅ Added unique result: ${uniqueKey}`);
        } else {
            console.log(`❌ Duplicate result found and removed: ${uniqueKey}`, result);
        }
    });
    
    console.log('After deduplication, unique results count:', uniqueResults.length);
    console.log('Unique keys found:', Array.from(seenKeys));
    
    // Group results by subject, semester, and term
    const groupedResults = {};
    
    uniqueResults.forEach(result => {
        const subject = result.subject || 'Unknown Subject';
        const semester = result.semester || 'Unknown';
        const term = result.term || 'Unknown';
        
        const key = `${subject}_${semester}_${term}`;
        
        if (!groupedResults[key]) {
            groupedResults[key] = {
                subject: subject,
                semester: semester,
                term: term,
                results: []
            };
        }
        
        groupedResults[key].results.push(result);
    });
    
    // Convert to array and sort
    const sortedGroups = Object.values(groupedResults).sort((a, b) => {
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.term - b.term;
    });
    
    let html = '<div class="test-results-tables">';
    
    sortedGroups.forEach(group => {
        html += `
            <div class="results-group">
                <div class="table-container">
                    <table class="test-results-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Teacher</th>
                                <th>Test Name</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        group.results.forEach(result => {
            const teacherName = result.teacher_name || 'Unknown';
            const scoreClass = result.score_percentage >= 80 ? 'success' : 
                              result.score_percentage >= 60 ? 'warning' : 'danger';
            
            html += `
                <tr class="result-row ${scoreClass}">
                    <td data-label="Subject">${group.subject}</td>
                    <td data-label="Teacher">${teacherName}</td>
                    <td data-label="Test Name">${result.test_name}</td>
                    <td class="score-cell" data-label="Score">${result.score}/${result.max_score}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    console.log('Final HTML content length:', container.innerHTML.length);
    console.log('Display function completed successfully');
}

// ===== OLD TEST FUNCTIONS REMOVED - REPLACED WITH NEW PAGE-BASED SYSTEM =====

// Local storage functions for test progress (with JWT validation)
function saveTestProgress(testType, testId, questionId, answer) {
    // Validate JWT before saving progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot save progress: No valid JWT token');
        return;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    let progress = JSON.parse(localStorage.getItem(key) || '{}');
    progress[questionId] = answer;
    localStorage.setItem(key, JSON.stringify(progress));
    console.log(`Saved progress for question ${questionId}:`, answer);
}

function getTestProgress(testType, testId, questionId) {
    // Validate JWT before getting progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot get progress: No valid JWT token');
        return null;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{}');
    return progress[questionId] || null;
}

function clearTestProgress(testType, testId) {
    console.log(`[DEBUG] clearTestProgress called with testType: ${testType}, testId: ${testId}`);
    
    // Validate JWT before clearing progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot clear progress: No valid JWT token');
        return;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    console.log(`[DEBUG] Removing localStorage key: ${key}`);
    
    const hadProgress = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    
    if (hadProgress) {
        console.log(`[DEBUG] Progress cleared for test ${testType}_${testId}`);
    } else {
        console.log(`[DEBUG] No progress found to clear for test ${testType}_${testId}`);
    }
}
// ===== OLD displayTestQuestions FUNCTION REMOVED =====

// ===== OLD renderTrueFalseQuestions FUNCTION REMOVED =====

// ===== OLD renderMultipleChoiceQuestions FUNCTION REMOVED =====

// ===== OLD renderInputQuestions FUNCTION REMOVED =====

// ===== OLD renderMatchingTypeQuestions FUNCTION REMOVED =====

// ===== OLD loadSavedProgress FUNCTION REMOVED =====

// Submit test function
async function submitTest(testType, testId) {
    console.log('Submitting test:', { testType, testId });
    
    try {
        // Collect answers
        const answers = collectTestAnswers(testType, testId);
        
        if (Object.keys(answers).length === 0) {
            alert('Please answer at least one question before submitting.');
            return;
        }

        // Remove localStorage dependency - backend will extract user info from JWT
        // No need to get user session data
        
        // Get test information to get test_name
        let testInfo;
        try {
            const testResponse = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`
            );
            const testData = await testResponse.json();
            if (testData.success) {
                testInfo = testData.test_info;
            } else {
                throw new Error('Failed to get test information');
            }
        } catch (error) {
            console.error('Error getting test info:', error);
            // Use fallback test name if we can't get it
            testInfo = { test_name: `Test ${testId}` };
        }

       // Calculate score properly using the existing function
        const questions = await getTestQuestions(testType, testId);
        const score = calculateTestScore(questions, answers, testType);
        const maxScore = testInfo.num_questions; // Use logical question count

        // Prepare common data for all test types
        // Remove user information - backend will extract from JWT token
        const commonData = {
            test_id: testId,
            test_name: testInfo.test_name,
            score: score,
            maxScore: maxScore,
            answers: answers
        };
        
        // Submit based on test type
        let response;
        switch (testType) {
            case 'true_false':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-true-false-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'multiple_choice':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-multiple-choice-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'input':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-input-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'matching_type':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-matching-type-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            default:
                throw new Error('Unsupported test type');
        }
        
        const data = await response.json();
        
       // In submitTest function, after marking test as completed:
        if (data.success) {
            // Mark test as completed
            markTestCompleted(testType, testId);
            
            // Clear progress
            clearTestProgress(testType, testId);
            
    // STOP the progress tracking interval
    clearProgressTrackingInterval(testType, testId);
            
            
    
            return { success: true, message: 'Test submitted successfully!' };
        } else {
            throw new Error(data.error || 'Failed to submit test');
        }
    } catch (error) {
        console.error('Error submitting test:', error);
        return { success: false, message: error.message };
    }
}
function clearProgressTrackingInterval(testType, testId) {
    const intervalKey = `progress_interval_${testType}_${testId}`;
    if (window[intervalKey]) {
        clearInterval(window[intervalKey]);
        window[intervalKey] = null;
        console.log(`[DEBUG] Progress tracking interval cleared for ${testType}_${testId}`);
    }
}
// Collect answers from the test form
function collectTestAnswers(testType, testId) {
    console.log(`[DEBUG] collectTestAnswers called with testType: ${testType}, testId: ${testId}`);
    const answers = {};
    
    if (testType === 'matching_type') {
        console.log('[DEBUG] Collecting answers for matching type test - REDIRECTED TO DEDICATED PAGE');
        // Matching type tests now redirect to matching-test-student.html
        // This function should not be called for matching type tests in the main app
        console.warn('[WARN] collectTestAnswers called for matching_type - this should not happen');
        return {};
    } else {
        console.log('[DEBUG] Collecting answers for standard test types');
        // For other test types, collect form inputs
        const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
        console.log(`[DEBUG] Found ${radioButtons.length} checked radio buttons`);
        
        radioButtons.forEach(radio => {
            const questionId = radio.name.replace('question_', '');
            answers[questionId] = radio.value;
            console.log(`[DEBUG] Collected radio answer: question ${questionId} = ${radio.value}`);
        });
        
        const textInputs = document.querySelectorAll('input[type="text"]');
        console.log(`[DEBUG] Found ${textInputs.length} text inputs`);
        
        textInputs.forEach(input => {
            if (input.value.trim()) {
                const questionId = input.dataset.questionId;
                answers[questionId] = input.value.trim();
                console.log(`[DEBUG] Collected text answer: question ${questionId} = ${input.value.trim()}`);
            }
        });
    }
    
    console.log('[DEBUG] Final collected answers:', answers);
    return answers;
}


















// Teacher cabinet functionality
function initializeTeacherCabinet() {
    // Populate teacher username
    populateTeacherInfo();
    
    // Set up choose subject button
    const chooseSubjectBtn = document.getElementById('chooseSubjectBtn');
    if (chooseSubjectBtn) {
        chooseSubjectBtn.addEventListener('click', toggleSubjectDropdown);
    }

    // Set up save classes button
    const saveClassesBtn = document.getElementById('saveClassesBtn');
    if (saveClassesBtn) {
        saveClassesBtn.addEventListener('click', saveClassesForSubject);
    }

    // Set up save subjects button
    const saveSubjectsBtn = document.getElementById('saveSubjectsBtn');
    if (saveSubjectsBtn) {
        console.log('Setting up saveSubjectsBtn event listener to showConfirmationModal');
        saveSubjectsBtn.addEventListener('click', showConfirmationModal);
    } else {
        console.error('saveSubjectsBtn not found!');
    }

    // Set up confirmation modal buttons
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    if (confirmYes) {
        console.log('Setting up confirmYes button event listener');
        confirmYes.addEventListener('click', confirmSaveSubjects);
    } else {
        console.error('confirmYes button not found!');
    }
    if (confirmNo) {
        console.log('Setting up confirmNo button event listener');
        confirmNo.addEventListener('click', cancelSaveSubjects);
    } else {
        console.error('confirmNo button not found!');
    }
    
    // Set up edit subjects button
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.addEventListener('click', () => {
            // Check if we're in test creation mode
            if (window.isInTestCreation) {
                console.log('🔍 Edit subjects button click blocked - currently in test creation mode');
                return;
            }
            showSubjectSelectionPrompt();
        });
    }

    // Load subjects for dropdown
    loadSubjectsForDropdown();
    
                    // Check if teacher already has subjects in database
                checkTeacherSubjects();
    
    // Initialize test creation functionality
    initializeTestCreation();
    
    // Initialize active tests functionality
    initializeActiveTests();
}

// Teacher info population function
function populateTeacherInfo() {
    console.log('Populating teacher info from JWT token');
    
    const teacherUsername = getCurrentTeacherUsername();
    if (teacherUsername) {
        // Populate teacher username in header
        const teacherUsernameElement = document.getElementById('teacherUsername');
        if (teacherUsernameElement) {
            teacherUsernameElement.textContent = teacherUsername;
        }
        
        // Populate teacher username in welcome message
        const welcomeTeacherUsernameElement = document.getElementById('welcomeTeacherUsername');
        if (welcomeTeacherUsernameElement) {
            welcomeTeacherUsernameElement.textContent = teacherUsername;
        }
        
        console.log('Teacher info populated successfully');
    } else {
        console.error('No teacher user data available');
    }
}



// Check if teacher already has subjects in database
async function checkTeacherSubjects() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in checkTeacherSubjects, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('checkTeacherSubjects called with teacher_id:', teacherId);
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-subjects'
        );
        const data = await response.json();
        console.log('Teacher subjects response:', data);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (data.success && data.subjects && data.subjects.length > 0) {
            console.log('Teacher has subjects, showing main cabinet');
            console.log('Subjects data:', data.subjects);
            // Teacher has subjects, show main cabinet
            showMainCabinetWithSubjects(data.subjects);
        } else {
            console.log('No subjects found, showing subject selection');
            console.log('Data structure:', data);
            // No subjects found, show subject selection
            showSubjectSelectionPrompt();
        }
    } catch (error) {
        console.error('Error checking teacher subjects:', error);
        // On error, show subject selection as fallback
        showSubjectSelectionPrompt();
    }
}

// Show main cabinet when teacher already has subjects
function showMainCabinetWithSubjects(subjects) {
    console.log('showMainCabinetWithSubjects called with subjects:', subjects);
    
    // Hide subject selection
    const subjectSelection = document.getElementById('subject-selection-container');
    if (subjectSelection) {
        subjectSelection.style.display = 'none';
        console.log('Hidden subject selection container');
    }
    
    // Show main cabinet
    const mainCabinet = document.getElementById('main-cabinet-container');
    if (mainCabinet) {
        mainCabinet.style.display = 'block';
        console.log('Showed main cabinet container');
    } else {
        console.error('Main cabinet container not found!');
    }
    
    // Show test creation
    const testCreation = document.getElementById('testCreationSection');
    if (testCreation) {
        testCreation.style.display = 'block';
        console.log('Showed test creation section');
    }
    
    // Initialize grade buttons
    console.log('Initializing grade buttons...');
    initializeGradeButtons();
    
    // Display existing subjects info
    displayExistingSubjects(subjects);
    
    // Show edit subjects button
    showEditSubjectsButton();
    
    // Check if we need to restore test creation state
    console.log('🔍 Checking for test creation state to restore...');
    const stateRestored = restoreTestCreationState();
    if (!stateRestored) {
        console.log('🔍 No test creation state to restore, enabling navigation buttons');
        enableNavigationButtons();
    }
}

// Display existing subjects information
function displayExistingSubjects(subjects) {
    console.log('displayExistingSubjects called with subjects:', subjects);
    const subjectsInfo = document.getElementById('subjectsInfo');
    if (subjectsInfo) {
        // Create detailed display of subjects and their classes
        let subjectsHtml = '<div class="existing-subjects-info"><h3>Your Assigned Subjects</h3>';
        
        subjects.forEach(subject => {
            subjectsHtml += `<div class="subject-item">`;
            subjectsHtml += `<h4>${subject.subject}</h4>`;
            
            if (subject.classes && Array.isArray(subject.classes)) {
                const classList = subject.classes.map(classData => 
                    `${classData.grade}/${classData.class}`
                ).join(', ');
                subjectsHtml += `<p><strong>Classes:</strong> ${classList}</p>`;
            }
            
            subjectsHtml += `</div>`;
        });
        
        subjectsHtml += '</div>';
        
        subjectsInfo.innerHTML = subjectsHtml;
        subjectsInfo.style.display = 'block';
        
        console.log('Updated subjects info display');
    }
}

// Show prompt to add subjects
async function showSubjectSelectionPrompt() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showSubjectSelectionPrompt, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 showSubjectSelectionPrompt blocked - currently in test creation mode');
        return;
    }
    
    console.log('=== showSubjectSelectionPrompt called ===');
    
    // Hide main cabinet
    const mainCabinet = document.getElementById('main-cabinet-container');
    if (mainCabinet) {
        mainCabinet.style.display = 'none';
    }
    
    // Hide test creation
    const testCreation = document.getElementById('testCreationSection');
    if (testCreation) {
        testCreation.style.display = 'none';
    }
    
    // Show subject selection
    const subjectSelection = document.getElementById('subject-selection-container');
    if (subjectSelection) {
        subjectSelection.style.display = 'block';
    }
    
    // Show welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
    }
    
    // Hide edit subjects button when in subject selection mode
    hideEditSubjectsButton();
    
    // Load and display existing subjects
    await loadAndDisplayExistingSubjects();
}

// Load and display existing subjects in the subject selection interface
async function loadAndDisplayExistingSubjects() {
    try {
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in loadAndDisplayExistingSubjects, redirecting to login');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Loading existing subjects for display...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-subjects'
        );
        const data = await response.json();
        
        if (data.success && data.subjects && data.subjects.length > 0) {
            console.log('Existing subjects found:', data.subjects);
            displayExistingSubjectsInSelection(data.subjects);
        } else {
            console.log('No existing subjects found');
            // Clear any existing display
            const subjectsList = document.getElementById('subjectsList');
            if (subjectsList) {
                subjectsList.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading existing subjects:', error);
    }
}

// Display existing subjects in the subject selection interface
function displayExistingSubjectsInSelection(subjects) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayExistingSubjectsInSelection, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Displaying existing subjects in selection interface:', subjects);
    
    const subjectsList = document.getElementById('subjectsList');
    if (!subjectsList) {
        console.error('subjectsList element not found');
        return;
    }
    
    // Clear existing content
    subjectsList.innerHTML = '';
    
    // Process each subject and its classes
    subjects.forEach(subject => {
        console.log('Processing existing subject:', subject);
        
        if (subject.classes && Array.isArray(subject.classes)) {
            subject.classes.forEach(classData => {
                console.log('Processing class data:', classData);
                
                const subjectDiv = document.createElement('div');
                subjectDiv.className = 'selected-subject';
                subjectDiv.dataset.subjectId = subject.subject_id;
                subjectDiv.dataset.subjectName = subject.subject;
                
                subjectDiv.innerHTML = `
                    <h4>${subject.subject}</h4>
                    <p>Classes: ${classData.grade}/${classData.class}</p>
                    <button class="remove-subject-btn" onclick="removeSubject(this)">Remove</button>
                `;
                
                subjectsList.appendChild(subjectDiv);
            });
        }
    });
    
    // Show the selected subjects section
    const selectedSubjects = document.getElementById('selectedSubjects');
    if (selectedSubjects) {
        selectedSubjects.style.display = 'block';
    }
    
    console.log('Finished displaying existing subjects');
}
// Initialize test creation functionality
function initializeTestCreation() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in initializeTestCreation, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const createTestBtn = document.getElementById('createTestBtn');
    if (createTestBtn) {
        createTestBtn.addEventListener('click', showTestTypeSelection);
    }
    
    // Cancel buttons for test creation
    const cancelTestCreation = document.getElementById('cancelTestCreation');
    const cancelTestCreationMC = document.getElementById('cancelTestCreationMC');
    const cancelTestCreationTF = document.getElementById('cancelTestCreationTF');
    const cancelTestCreationInput = document.getElementById('cancelTestCreationInput');
    
    if (cancelTestCreation) {
        cancelTestCreation.addEventListener('click', resetTestCreation);
    }
    if (cancelTestCreationMC) {
        cancelTestCreationMC.addEventListener('click', resetTestCreation);
    }
    if (cancelTestCreationTF) {
        cancelTestCreationTF.addEventListener('click', resetTestCreation);
    }
    if (cancelTestCreationInput) {
        cancelTestCreationInput.addEventListener('click', resetTestCreation);
    }
    
    // Test type selection buttons
    const multipleChoiceBtn = document.getElementById('multipleChoiceBtn');
    const trueFalseBtn = document.getElementById('trueFalseBtn');
    const inputTestBtn = document.getElementById('inputTestBtn');
    
    if (multipleChoiceBtn) {
        multipleChoiceBtn.addEventListener('click', () => showTestForm('multipleChoice'));
    }
    if (trueFalseBtn) {
        trueFalseBtn.addEventListener('click', () => showTestForm('trueFalse'));
    }
    if (inputTestBtn) {
        inputTestBtn.addEventListener('click', () => showTestForm('input'));
    }
    
    // Matching test button
    const matchingTestBtn = document.getElementById('matchingTestBtn');
    if (matchingTestBtn) {
        matchingTestBtn.addEventListener('click', () => showTestForm('matching'));
    }
    
    // Form submit buttons
    const mcSubmitBtn = document.getElementById('mcSubmitBtn');
    const tfSubmitBtn = document.getElementById('tfSubmitBtn');
    const inputSubmitBtn = document.getElementById('inputSubmitBtn');
    
    if (mcSubmitBtn) {
        mcSubmitBtn.addEventListener('click', handleMultipleChoiceSubmit);
    }
    if (tfSubmitBtn) {
        tfSubmitBtn.addEventListener('click', handleTrueFalseSubmit);
    }
    if (inputSubmitBtn) {
        inputSubmitBtn.addEventListener('click', handleInputTestSubmit);
    }
    
    // Set up auto-save for form fields
    setupFormAutoSave();
}

// Set up auto-save for form fields to save data as user types
function setupFormAutoSave() {
    console.log('🔍 Setting up auto-save listeners for initial form fields...');
    
    // Auto-save for multiple choice form - ONLY initial fields
    const mcTestName = document.getElementById('mcTestName');
    const mcNumQuestions = document.getElementById('mcNumQuestions');
    const mcNumOptions = document.getElementById('mcNumOptions');
    
    if (mcTestName) {
        mcTestName.addEventListener('input', () => {
            // Only save if we have meaningful data
            const testName = mcTestName.value.trim();
            if (testName) {
                console.log('🔍 Auto-saving multiple choice test name:', testName);
                saveFormDataForStep('multipleChoiceForm');
            }
        });
    }
    if (mcNumQuestions) {
        mcNumQuestions.addEventListener('input', () => {
            // Only save if we have meaningful data
            const numQuestions = mcNumQuestions.value.trim();
            if (numQuestions && !isNaN(parseInt(numQuestions))) {
                console.log('🔍 Auto-saving multiple choice num questions:', numQuestions);
                saveFormDataForStep('multipleChoiceForm');
            }
        });
    }
    if (mcNumOptions) {
        mcNumOptions.addEventListener('input', () => {
            // Only save if we have meaningful data
            const numOptions = mcNumOptions.value.trim();
            if (numOptions && !isNaN(parseInt(numOptions))) {
                console.log('🔍 Auto-saving multiple choice num options:', numOptions);
                saveFormDataForStep('multipleChoiceForm');
            }
        });
    }
    
    // Auto-save for true/false form - ONLY initial fields
    const tfTestName = document.getElementById('tfTestName');
    const tfNumQuestions = document.getElementById('tfNumQuestions');
    
    if (tfTestName) {
        tfTestName.addEventListener('input', () => {
            // Only save if we have meaningful data
            const testName = tfTestName.value.trim();
            if (testName) {
                console.log('🔍 Auto-saving true/false test name:', testName);
                saveFormDataForStep('trueFalseForm');
            }
        });
    }
    if (tfNumQuestions) {
        tfNumQuestions.addEventListener('input', () => {
            // Only save if we have meaningful data
            const numQuestions = tfNumQuestions.value.trim();
            if (numQuestions && !isNaN(parseInt(numQuestions))) {
                console.log('🔍 Auto-saving true/false num questions:', numQuestions);
                saveFormDataForStep('trueFalseForm');
            }
        });
    }
    
    // Auto-save for input form - ONLY initial fields
    const inputTestName = document.getElementById('inputTestName');
    const inputNumQuestions = document.getElementById('inputNumQuestions');
    
    if (inputTestName) {
        inputTestName.addEventListener('input', () => {
            // Only save if we have meaningful data
            const testName = inputTestName.value.trim();
            if (testName) {
                console.log('🔍 Auto-saving input test name:', testName);
                saveFormDataForStep('inputForm');
            }
        });
    }
    if (inputNumQuestions) {
        inputNumQuestions.addEventListener('input', () => {
            // Only save if we have meaningful data
            const numQuestions = inputNumQuestions.value.trim();
            if (numQuestions && !isNaN(parseInt(numQuestions))) {
                console.log('🔍 Auto-saving input num questions:', numQuestions);
                saveFormDataForStep('inputForm');
            }
        });
    }
    
    // Auto-save for matching form - ONLY initial fields
    const matchingTestName = document.getElementById('matchingTestName');
    const matchingNumBlocks = null;
    
    if (matchingTestName) {
        matchingTestName.addEventListener('input', () => {
            // Only save if we have meaningful data
            const testName = matchingTestName.value.trim();
            if (testName) {
                console.log('🔍 Auto-saving matching test name:', testName);
                saveFormDataForStep('matchingForm');
            }
        });
    }
    // removed matching num blocks field
    
    console.log('🔍 Auto-save listeners set up for initial form fields only');
}

// Show test type selection
function showTestTypeSelection() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTestTypeSelection, redirecting to login');
        alert('Missing teacher session. Please sign in again.');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 showTestTypeSelection called - starting new test creation');
    
    // Reset the test assignment completed flag
    window.testAssignmentCompleted = false;
    console.log('🔍 Reset testAssignmentCompleted flag to false');
    
    // Set test creation state
    window.isInTestCreation = true;
    console.log('🔍 Set isInTestCreation flag to true');
    
    // Disable grade buttons and active tests button
    disableNavigationButtons();
    
    // Hide other sections
    document.getElementById('multipleChoiceForm').style.display = 'none';
    document.getElementById('trueFalseForm').style.display = 'none';
    document.getElementById('inputTestForm').style.display = 'none';
    document.getElementById('matchingTestForm').style.display = 'none';
    document.getElementById('testAssignmentSection').style.display = 'none';
    document.getElementById('activeTestsSection').style.display = 'none';
    
    // Remove active class from active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.classList.remove('active');
    }
    
    // Show test type selection
    document.getElementById('testTypeSelection').style.display = 'block';
    // Note: Create Test button is now disabled instead of hidden (handled by disableNavigationButtons)
    
    // Save current state to localStorage
    saveTestCreationState('testTypeSelection');
}
// Reset test creation
function resetTestCreation() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in resetTestCreation, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 resetTestCreation called - resetting test creation state');
    
    // Reset the test assignment completed flag
    window.testAssignmentCompleted = false;
    console.log('🔍 Reset testAssignmentCompleted flag to false');
    
    // Reset test creation state
    window.isInTestCreation = false;
    console.log('🔍 Reset isInTestCreation flag to false');
    
    // Re-enable navigation buttons
    enableNavigationButtons();
    
    document.getElementById('testTypeSelection').style.display = 'none';
    // Note: Create Test button is now enabled by enableNavigationButtons instead of here
    document.getElementById('multipleChoiceForm').style.display = 'none';
    document.getElementById('trueFalseForm').style.display = 'none';
    document.getElementById('inputTestForm').style.display = 'none';
    document.getElementById('matchingTestForm').style.display = 'none';
    document.getElementById('testAssignmentSection').style.display = 'none';
    document.getElementById('activeTestsSection').style.display = 'none';
    
    // Remove active class from active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.classList.remove('active');
    }
    
    // Clear test creation state from localStorage
    clearTestCreationState();
    
    // Clear all form fields to give teacher a clean slate
    clearAllTestFormFields();
    
    // NEW: Also reset Excel upload state explicitly (redundant but safe)
    resetExcelUploadState();
}

// Disable navigation buttons during test creation
function disableNavigationButtons() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in disableNavigationButtons, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 Disabling navigation buttons...');
    
    // Disable all grade buttons
    const gradeButtons = document.querySelectorAll('.grade-btn');
    gradeButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        console.log(`🔍 Disabled grade button: ${btn.textContent}`);
    });
    
    // Disable active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.disabled = true;
        activeTestsBtn.style.opacity = '0.5';
        activeTestsBtn.style.cursor = 'not-allowed';
        console.log('🔍 Disabled active tests button');
    }
    
    // Disable Create Test button (make it inactive, not hidden)
    const createTestBtn = document.getElementById('createTestBtn');
    if (createTestBtn) {
        createTestBtn.disabled = true;
        createTestBtn.style.opacity = '0.5';
        createTestBtn.style.cursor = 'not-allowed';
        console.log('🔍 Disabled Create Test button');
    }
    
    // Disable class and semester buttons if they exist
    const classButtons = document.querySelectorAll('.class-btn');
    classButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
    
    const semesterButtons = document.querySelectorAll('.semester-btn');
    semesterButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
}

// Enable navigation buttons after test creation
function enableNavigationButtons() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in enableNavigationButtons, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 Enabling navigation buttons...');
    
    // Enable all grade buttons
    const gradeButtons = document.querySelectorAll('.grade-btn');
    gradeButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        console.log(`🔍 Enabled grade button: ${btn.textContent}`);
    });
    
    // Enable active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.disabled = false;
        activeTestsBtn.style.opacity = '1';
        activeTestsBtn.style.cursor = 'pointer';
        console.log('🔍 Enabled active tests button');
    }
    
    // Enable Create Test button
    const createTestBtn = document.getElementById('createTestBtn');
    if (createTestBtn) {
        createTestBtn.disabled = false;
        createTestBtn.style.opacity = '1';
        createTestBtn.style.cursor = 'pointer';
        console.log('🔍 Enabled Create Test button');
    }
    
    // Enable class and semester buttons if they exist
    const classButtons = document.querySelectorAll('.class-btn');
    classButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
    
    const semesterButtons = document.querySelectorAll('.semester-btn');
    semesterButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

// Save test creation state to localStorage
function saveTestCreationState(currentStep) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in saveTestCreationState, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 🔴 saveTestCreationState called with step:', currentStep);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    // NEW: Include Excel upload state in saved state
    const excelState = {
        multipleChoice: {
            buttonVisible: document.querySelector('.excel-upload-btn[data-test-type="multiple-choice"]')?.style.display !== 'none',
            hintVisible: document.querySelector('.excel-hint[data-test-type="multiple-choice"]')?.style.display !== 'none'
        },
        trueFalse: {
            buttonVisible: document.querySelector('.excel-upload-btn[data-test-type="true-false"]')?.style.display !== 'none',
            hintVisible: document.querySelector('.excel-hint[data-test-type="true-false"]')?.style.display !== 'none'
        },
        input: {
            buttonVisible: document.querySelector('.excel-upload-btn[data-test-type="input"]')?.style.display !== 'none',
            hintVisible: document.querySelector('.excel-hint[data-test-type="input"]')?.style.display !== 'none'
        }
    };
    
    const state = {
        isInTestCreation: true,
        currentStep: currentStep,
        timestamp: Date.now(),
        excelState // NEW: Save Excel state
    };
    localStorage.setItem('test_creation_state', JSON.stringify(state));
    console.log('🔍 Saved test creation state:', state);
    
    // Also save form data for the current step
    console.log('🔍 🔴 About to call saveFormDataForStep with step:', currentStep);
    saveFormDataForStep(currentStep);
}
// Clear test creation state from localStorage
function clearTestCreationState() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in clearTestCreationState, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Clear test creation state
    localStorage.removeItem('test_creation_state');
    localStorage.removeItem('test_creation_form_data');
    
    // Clear any other test-related data that might exist
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('test') || key.includes('form') || key.includes('question'))) {
            keysToRemove.push(key);
        }
    }
    
    // Remove the identified keys
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🔍 Cleared additional test data:', key);
    });
    
    console.log('🔍 Cleared test creation state and form data from localStorage');
    console.log('🔍 Total keys cleared:', keysToRemove.length + 2); // +2 for test_creation_state and test_creation_form_data
}

// Clear all test form fields to give teacher a clean slate
function clearAllTestFormFields() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in clearAllTestFields, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 Clearing all test form fields...');
    
    // Clear multiple choice form fields
    const mcTestName = document.getElementById('mcTestName');
    const mcNumQuestions = document.getElementById('mcNumQuestions');
    const mcNumOptions = document.getElementById('mcNumOptions');
    const mcQuestionsContainer = document.getElementById('mcQuestionsContainer');
    
    if (mcTestName) mcTestName.value = '';
    if (mcNumQuestions) mcNumQuestions.value = '';
    if (mcNumOptions) mcNumOptions.value = '';
    if (mcQuestionsContainer) mcQuestionsContainer.innerHTML = '';
    
    // Clear true/false form fields
    const tfTestName = document.getElementById('tfTestName');
    const tfNumQuestions = document.getElementById('tfNumQuestions');
    const tfQuestionsContainer = document.getElementById('tfQuestionsContainer');
    
    if (tfTestName) tfTestName.value = '';
    if (tfNumQuestions) tfNumQuestions.value = '';
    if (tfQuestionsContainer) tfQuestionsContainer.innerHTML = '';
    
    // Clear input form fields
    const inputTestName = document.getElementById('inputTestName');
    const inputNumQuestions = document.getElementById('inputNumQuestions');
    const inputQuestionsContainer = document.getElementById('inputQuestionsContainer');
    
    if (inputTestName) inputTestName.value = '';
    if (inputNumQuestions) inputNumQuestions.value = '';
    if (inputQuestionsContainer) inputQuestionsContainer.innerHTML = '';
    
    // Clear matching test form fields
    const matchingTestName = document.getElementById('matchingTestName');
    const matchingNumBlocks = null;
    const imageEditorContainer = document.getElementById('imageEditorContainer');
    const wordsEditorContainer = document.getElementById('wordsEditorContainer');
    
    if (matchingTestName) matchingTestName.value = '';
    // removed: default num blocks
    if (imageEditorContainer) imageEditorContainer.innerHTML = '';
    if (wordsEditorContainer) wordsEditorContainer.innerHTML = '';
    
    console.log('🔍 All test form fields cleared');
    
    // NEW: Reset Excel upload state
    resetExcelUploadState();
}

// Reset Excel upload state for all test types
function resetExcelUploadState() {
    const testTypes = ['multiple-choice', 'true-false', 'input'];
    
    testTypes.forEach(testType => {
        // Hide Excel upload button
        const excelBtn = document.querySelector(`.excel-upload-btn[data-test-type="${testType}"]`);
        if (excelBtn) {
            excelBtn.style.display = 'none';
            console.log('🔍 Excel button hidden for:', testType);
        }
        
        // Hide Excel hint
        const excelHint = document.querySelector(`.excel-hint[data-test-type="${testType}"]`);
        if (excelHint) {
            excelHint.style.display = 'none';
            console.log('🔍 Excel hint hidden for:', testType);
        }
        
        // Clear file input value
        const fileInput = document.querySelector(`.excel-file-input[data-test-type="${testType}"]`);
        if (fileInput) {
            fileInput.value = '';
            console.log(' File input cleared for:', testType);
        }
    });
    
    console.log(' Excel upload state reset complete');
}

// Restore Excel upload state from saved state
function restoreExcelUploadState(excelState) {
    if (!excelState) return;
    
    console.log('🔍 Restoring Excel upload state:', excelState);
    
    if (excelState.multipleChoice?.buttonVisible) {
        showExcelUploadButton('multiple-choice');
        showExcelHint('multiple-choice');
    }
    if (excelState.trueFalse?.buttonVisible) {
        showExcelUploadButton('true-false');
        showExcelHint('true-false');
    }
    if (excelState.input?.buttonVisible) {
        showExcelUploadButton('input');
        showExcelHint('input');
    }
}

// Save form data for the current test creation step
function saveFormDataForStep(step) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in saveFormDataForStep, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 🔴 saveFormDataForStep called with step:', step);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    const formData = {};
    
    switch (step) {
        case 'testTypeSelection':
            // No form data to save for this step
            break;
            
        case 'multipleChoiceForm':
            formData.testName = document.getElementById('mcTestName')?.value || '';
            formData.numQuestions = document.getElementById('mcNumQuestions')?.value || '';
            formData.numOptions = document.getElementById('mcNumOptions')?.value || '';
            
            // Only save questions data if the questions form actually exists
            const questionsContainer = document.getElementById('mcQuestionsContainer');
            if (questionsContainer && questionsContainer.children.length > 0) {
                console.log('🔍 Questions form exists, saving questions data...');
                const mcQuestions = {};
                const mcNumQuestions = parseInt(formData.numQuestions) || 0;
                const mcNumOptions = parseInt(formData.numOptions) || 0;
                
                if (mcNumQuestions > 0) {
                    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, mcNumOptions);
                    
                    for (let i = 1; i <= mcNumQuestions; i++) {
                        const question = document.getElementById(`mc_question_${i}`)?.value || '';
                        const correctAnswer = document.getElementById(`mc_correct_${i}`)?.value || '';
                        const options = {};
                        
                        optionLetters.forEach(optionLetter => {
                            const optionValue = document.getElementById(`mc_option_${i}_${optionLetter}`)?.value || '';
                            options[optionLetter] = optionValue;
                        });
                        
                        mcQuestions[i] = { 
                            question, 
                            options, 
                            correctAnswer 
                        };
                    }
                }
                formData.questions = mcQuestions;
            } else {
                console.log('🔍 Questions form does not exist yet, not saving questions data');
                formData.questions = {}; // Empty questions object
            }
            break;
            
        case 'trueFalseForm':
            const tfTestNameElement = document.getElementById('tfTestName');
            const tfNumQuestionsElement = document.getElementById('tfNumQuestions');
            
            formData.testName = tfTestNameElement?.value || '';
            formData.numQuestions = tfNumQuestionsElement?.value || '';
            
            console.log('🔍 🔴 Reading true/false form values:');
            console.log('🔍 🔴 tfTestName element:', tfTestNameElement);
            console.log('🔍 🔴 tfTestName value:', tfTestNameElement?.value);
            console.log('🔍 🔴 tfNumQuestions element:', tfNumQuestionsElement);
            console.log('🔍 🔴 tfNumQuestions value:', tfNumQuestionsElement?.value);
            console.log('🔍 🔴 Form data before questions:', formData);
            
            // Only save questions data if the questions form actually exists
            const tfQuestionsContainer = document.getElementById('tfQuestionsContainer');
            if (tfQuestionsContainer && tfQuestionsContainer.children.length > 0) {
                console.log('🔍 True/false questions form exists, saving questions data...');
                const tfQuestions = {};
                const tfNumQuestions = parseInt(formData.numQuestions) || 0;
                
                if (tfNumQuestions > 0) {
                    for (let i = 1; i <= tfNumQuestions; i++) {
                        const question = document.getElementById(`tf_question_${i}`)?.value || '';
                        const correctAnswer = document.getElementById(`tf_correct_${i}`)?.value || '';
                        tfQuestions[i] = { question, correctAnswer };
                    }
                }
                formData.questions = tfQuestions;
            } else {
                console.log('🔍 True/false questions form does not exist yet, not saving questions data');
                formData.questions = {}; // Empty questions object
            }
            break;
            
        case 'inputForm':
            formData.testName = document.getElementById('inputTestName')?.value || '';
            formData.numQuestions = document.getElementById('inputNumQuestions')?.value || '';
            console.log(`🔍 Saving input form data - testName: "${formData.testName}", numQuestions: ${formData.numQuestions}`);
            
            // Only save questions data if the questions form actually exists
            const inputQuestionsContainer = document.getElementById('inputQuestionsContainer');
            if (inputQuestionsContainer && inputQuestionsContainer.children.length > 0) {
                console.log('🔍 Input questions form exists, saving questions data...');
                const inputQuestions = {};
                const inputNumQuestions = parseInt(formData.numQuestions) || 0;
                
                if (inputNumQuestions > 0) {
                    console.log(`🔍 Processing ${inputNumQuestions} questions for auto-save`);
                    for (let i = 1; i <= inputNumQuestions; i++) {
                        const questionElement = document.getElementById(`input_question_${i}`);
                        const question = questionElement?.value || '';
                        console.log(`🔍 Question ${i} element found:`, !!questionElement, `value: "${question}"`);
                        
                        const answers = [];
                        const answerContainer = document.getElementById(`answers_container_${i}`);
                        if (answerContainer) {
                            const answerInputs = answerContainer.querySelectorAll('.answer-input');
                            console.log(`🔍 Found ${answerInputs.length} answer inputs for question ${i}`);
                            answerInputs.forEach((input, index) => {
                                const answerValue = input.value.trim();
                                if (answerValue) {
                                    answers.push(answerValue);
                                    console.log(`🔍 Answer ${index + 1} for question ${i}: "${answerValue}"`);
                                }
                            });
                        } else {
                            console.log(`🔍 Answer container for question ${i} not found`);
                        }
                        inputQuestions[i] = { question, correct_answers: answers };
                        console.log(`🔍 Saved question ${i}: "${question}" with ${answers.length} correct_answers:`, answers);
                    }
                } else {
                    console.log(`🔍 No questions to process (inputNumQuestions: ${inputNumQuestions})`);
                }
                formData.questions = inputQuestions;
            } else {
                console.log('🔍 Input questions form does not exist yet, not saving questions data');
                formData.questions = {}; // Empty questions object
            }
            break;
            
        case 'testAssignment':
            // No form data to save for this step
            break;
            
        case 'matchingForm':
            formData.testName = document.getElementById('matchingTestName')?.value || '';
            formData.numBlocks = '';
            
            // Save matching test data if widget exists
            const imageEditorContainer = document.getElementById('imageEditorContainer');
            if (imageEditorContainer && imageEditorContainer.querySelector('.matching-test-widget')) {
                // The widget handles its own data storage
                console.log('🔍 Matching test widget exists, data will be handled by widget');
            }
            break;
    }
    
    localStorage.setItem('test_creation_form_data', JSON.stringify(formData));
    console.log('🔍 Saved form data for step:', step, formData);
}
// Restore form data for the current test creation step
function restoreFormDataForStep(step) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in restoreFormDataForStep, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 🟢 restoreFormDataForStep called with step:', step);
    console.log('🔍 🟢 Call stack:', new Error().stack);
    
    const formDataStr = localStorage.getItem('test_creation_form_data');
    if (!formDataStr) {
        console.log('🔍 🟢 No form data found in localStorage');
        return;
    }
    
    try {
        const formData = JSON.parse(formDataStr);
        console.log('🔍 🟢 Restoring form data for step:', step, formData);
        
        switch (step) {
            case 'multipleChoiceForm':
                console.log('🔍 🟢 Restoring multiple choice form fields...');
                console.log('🔍 🟢 Setting mcTestName to:', formData.testName);
                console.log('🔍 🟢 Setting mcNumQuestions to:', formData.numQuestions);
                console.log('🔍 🟢 Setting mcNumOptions to:', formData.numOptions);
                
                // Check if the form is visible
                const multipleChoiceForm = document.getElementById('multipleChoiceForm');
                console.log('🔍 🟢 multipleChoiceForm element found:', !!multipleChoiceForm);
                if (multipleChoiceForm) {
                    console.log('🔍 🟢 multipleChoiceForm display style:', multipleChoiceForm.style.display);
                    console.log('🔍 🟢 multipleChoiceForm visibility:', multipleChoiceForm.style.visibility);
                }
                
                if (formData.testName) {
                    const mcTestNameElement = document.getElementById('mcTestName');
                    console.log('🔍 🟢 mcTestName element found:', !!mcTestNameElement);
                    if (mcTestNameElement) {
                        mcTestNameElement.value = formData.testName;
                        console.log('🔍 🟢 mcTestName value set to:', mcTestNameElement.value);
                        // Verify the value was actually set
                        setTimeout(() => {
                            console.log('🔍 🟢 mcTestName value after setting:', mcTestNameElement.value);
                        }, 100);
                    } else {
                        console.log('🔍 ❌ mcTestName element NOT found!');
                    }
                }
                if (formData.numQuestions) {
                    const mcNumQuestionsElement = document.getElementById('mcNumQuestions');
                    console.log('🔍 🟢 mcNumQuestions element found:', !!mcNumQuestionsElement);
                    if (mcNumQuestionsElement) {
                        mcNumQuestionsElement.value = formData.numQuestions;
                        console.log('🔍 🟢 mcNumQuestions value set to:', mcNumQuestionsElement.value);
                        // Verify the value was actually set
                        setTimeout(() => {
                            console.log('🔍 🟢 mcNumQuestions value after setting:', mcNumQuestionsElement.value);
                        }, 100);
                    } else {
                        console.log('🔍 ❌ mcNumQuestions element NOT found!');
                    }
                }
                if (formData.numOptions) {
                    const mcNumOptionsElement = document.getElementById('mcNumOptions');
                    console.log('🔍 🟢 mcNumOptions element found:', !!mcNumOptionsElement);
                    if (mcNumOptionsElement) {
                        mcNumOptionsElement.value = formData.numOptions;
                        console.log('🔍 🟢 mcNumOptions value set to:', mcNumOptionsElement.value);
                        // Verify the value was actually set
                        setTimeout(() => {
                            console.log('🔍 🟢 mcNumOptions value after setting:', mcNumOptionsElement.value);
                        }, 100);
                    } else {
                        console.log('🔍 ❌ mcNumOptions element NOT found!');
                    }
                }
                
                // Check if we have basic form data to restore (test name, num questions, num options)
                if (formData.testName && formData.numQuestions && formData.numOptions) {
                    console.log('🔍 Found basic form data, creating questions section...');
                    
                    // Show the questions container
                    document.getElementById('mcQuestionsContainer').style.display = 'block';
                    console.log('🔍 🟢 Set mcQuestionsContainer display to block');
                    
                    // Create the questions form structure
                    const numQuestions = parseInt(formData.numQuestions);
                    const numOptions = parseInt(formData.numOptions);
                    
                    console.log('🔍 🟢 Creating questions form for', numQuestions, 'questions with', numOptions, 'options');
                    
                    // Create the questions container
                    const questionsContainer = document.getElementById('mcQuestionsContainer');
                    questionsContainer.innerHTML = '';
                    
                    for (let i = 1; i <= numQuestions; i++) {
                        const questionDiv = document.createElement('div');
                        questionDiv.className = 'question-container';
                        questionDiv.innerHTML = `
                            <h5>Question ${i}</h5>
                            <input type="text" placeholder="Enter question ${i}" id="mc_question_${i}" data-question-id="${i}">
                            <div class="options-container">
                                ${Array.from({length: numOptions}, (_, j) => {
                                    const optionLetter = String.fromCharCode(65 + j); // A, B, C, etc.
                                    return `
                                        <div class="option-group">
                                            <label>${optionLetter}:</label>
                                            <input type="text" placeholder="Option ${optionLetter}" id="mc_option_${i}_${optionLetter}" data-question-id="${i}">
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <select id="mc_correct_${i}" data-question-id="${i}">
                                <option value="">Select correct answer</option>
                                ${Array.from({length: numOptions}, (_, j) => {
                                    const optionLetter = String.fromCharCode(65 + j);
                                    return `<option value="${optionLetter}">${optionLetter}</option>`;
                                }).join('')}
                            </select>
                        `;
                        questionsContainer.appendChild(questionDiv);
                    }
                    
                    console.log('🔍 🟢 Questions form structure created');
                    
                    // If we have existing question data, restore it
                    if (formData.questions && Object.keys(formData.questions).length > 0) {
                        console.log('🔍 Found existing questions data, restoring...');
                        console.log('🔍 Questions data structure:', formData.questions);
                        console.log('🔍 Questions keys:', Object.keys(formData.questions));
                        
                        // Now restore the question data directly since elements were just created
                        console.log('🔍 Elements created, restoring data directly...');
                        restoreMultipleChoiceData(formData);
                    } else {
                        console.log('🔍 No existing questions data, showing empty questions form');
                    }
                    
                    // Add the Save Test button after creating the form structure
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'btn btn-success';
                    saveBtn.textContent = 'Save Test';
                    saveBtn.onclick = () => saveMultipleChoiceTest(formData.testName, formData.numQuestions, formData.numOptions);
                    questionsContainer.appendChild(saveBtn);
                } else {
                    // No basic form data - questions form stays hidden until "Create Questions" is clicked
                    console.log('🔍 No basic form data found, questions form will appear when Create Questions is clicked');
                }
                
                // Final verification - check if the form fields were actually populated
                console.log('🔍 🟢 Final verification of multiple choice form fields:');
                const finalMcTestName = document.getElementById('mcTestName');
                const finalMcNumQuestions = document.getElementById('mcNumQuestions');
                const finalMcNumOptions = document.getElementById('mcNumOptions');
                
                console.log('🔍 🟢 Final mcTestName value:', finalMcTestName?.value);
                console.log('🔍 🟢 Final mcNumQuestions value:', finalMcNumQuestions?.value);
                console.log('🔍 🟢 Final mcNumOptions value:', finalMcNumOptions?.value);
                
                break;
                
            case 'trueFalseForm':
                console.log('🔍 🟢 Restoring true/false form fields...');
                console.log('🔍 🟢 Setting tfTestName to:', formData.testName);
                console.log('🔍 🟢 Setting tfNumQuestions to:', formData.numQuestions);
                
                if (formData.testName) {
                    const tfTestNameElement = document.getElementById('tfTestName');
                    console.log('🔍 🟢 tfTestName element found:', !!tfTestNameElement);
                    if (tfTestNameElement) {
                        tfTestNameElement.value = formData.testName;
                        console.log('🔍 🟢 tfTestName value set to:', tfTestNameElement.value);
                    }
                }
                if (formData.numQuestions) {
                    const tfNumQuestionsElement = document.getElementById('tfNumQuestions');
                    console.log('🔍 🟢 tfNumQuestions element found:', !!tfNumQuestionsElement);
                    if (tfNumQuestionsElement) {
                        tfNumQuestionsElement.value = formData.numQuestions;
                        console.log('🔍 🟢 tfNumQuestions value set to:', tfNumQuestionsElement.value);
                    }
                }
                
                // Check if we have basic form data to restore (test name, num questions)
                if (formData.testName && formData.numQuestions) {
                    console.log('🔍 Found basic form data, creating questions section...');
                    
                    // Show the questions container
                    document.getElementById('tfQuestionsContainer').style.display = 'block';
                    console.log('🔍 🟢 Set tfQuestionsContainer display to block');
                    
                    // Create the questions form structure
                    const numQuestions = parseInt(formData.numQuestions);
                    
                    console.log('🔍 🟢 Creating questions form for', numQuestions, 'questions');
                    
                    // Create the questions container
                    const questionsContainer = document.getElementById('tfQuestionsContainer');
                    questionsContainer.innerHTML = '';
                    
                    for (let i = 1; i <= numQuestions; i++) {
                        const questionDiv = document.createElement('div');
                        questionDiv.className = 'question-container';
                        questionDiv.innerHTML = `
                            <h5>Question ${i}</h5>
                            <input type="text" placeholder="Enter question ${i}" id="tf_question_${i}" data-question-id="${i}">
                            <select id="tf_correct_${i}" data-question-id="${i}">
                                <option value="">Select correct answer</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        `;
                        questionsContainer.appendChild(questionDiv);
                    }
                    
                    console.log('🔍 🟢 Questions form structure created');
                    
                    // If we have existing question data, restore it
                    if (formData.questions && Object.keys(formData.questions).length > 0) {
                        console.log('🔍 Found existing questions data, restoring...');
                        console.log('🔍 Questions data structure:', formData.questions);
                        console.log('🔍 Questions keys:', Object.keys(formData.questions));
                        
                        // Now restore the question data directly since elements were just created
                        console.log('🔍 Elements created, restoring data directly...');
                        restoreTrueFalseData(formData);
                    } else {
                        console.log('🔍 No existing questions data, showing empty questions form');
                    }
                    
                    // Add the Save Test button after creating the form structure
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'btn btn-success';
                    saveBtn.textContent = 'Save Test';
                    saveBtn.onclick = () => saveTrueFalseTest(formData.testName, formData.numQuestions);
                    questionsContainer.appendChild(saveBtn);
                } else {
                    // No basic form data - questions form stays hidden until "Create Questions" is clicked
                    console.log('🔍 No basic form data found, questions form will appear when Create Questions is clicked');
                }
                break;
                
            case 'inputForm':
                console.log('🔍 🟢 Restoring input form fields...');
                console.log('🔍 🟢 Setting inputTestName to:', formData.testName);
                console.log('🔍 🟢 Setting inputNumQuestions to:', formData.numQuestions);
                
                if (formData.testName) {
                    const inputTestNameElement = document.getElementById('inputTestName');
                    console.log('🔍 🟢 inputTestName element found:', !!inputTestNameElement);
                    if (inputTestNameElement) {
                        inputTestNameElement.value = formData.testName;
                        console.log('🔍 🟢 inputTestName value set to:', inputTestNameElement.value);
                    }
                }
                if (formData.numQuestions) {
                    const inputNumQuestionsElement = document.getElementById('inputNumQuestions');
                    console.log('🔍 🟢 inputNumQuestions element found:', !!inputNumQuestionsElement);
                    if (inputNumQuestionsElement) {
                        inputNumQuestionsElement.value = formData.numQuestions;
                        console.log('🔍 🟢 inputNumQuestions value set to:', inputNumQuestionsElement.value);
                    }
                }
                
                // Check if we have basic form data to restore (test name, num questions)
                if (formData.testName && formData.numQuestions) {
                    console.log('🔍 Found basic form data, creating questions section...');
                    
                    // Show the questions container
                    document.getElementById('inputQuestionsContainer').style.display = 'block';
                    console.log('🔍 🟢 Set inputQuestionsContainer display to block');
                    
                    // Create the questions form structure
                    const numQuestions = parseInt(formData.numQuestions);
                    
                    console.log('🔍 🟢 Creating questions form for', numQuestions, 'questions');
                    
                    // Create the questions container
                    const questionsContainer = document.getElementById('inputQuestionsContainer');
                    questionsContainer.innerHTML = '';
                    
                    for (let i = 1; i <= numQuestions; i++) {
                        const questionDiv = document.createElement('div');
                        questionDiv.className = 'question-container';
                        questionDiv.innerHTML = `
                            <h5>Question ${i}</h5>
                            <input type="text" placeholder="Enter question ${i}" id="input_question_${i}">
                            <div class="answers-container" id="answers_container_${i}">
                                <div class="answer-input-group">
                                    <input type="text" placeholder="Correct answer for question ${i}" class="answer-input" data-question-id="${i}" data-answer-index="0">
                                    <button type="button" class="btn btn-sm btn-outline-primary add-answer-btn">+ Add Answer</button>
                                </div>
                            </div>
                        `;
                        questionsContainer.appendChild(questionDiv);
                    }
                    
                    console.log('🔍 🟢 Questions form structure created');
                    
                    // If we have existing question data, restore it
                    if (formData.questions && Object.keys(formData.questions).length > 0) {
                        console.log('🔍 Found existing questions data, restoring...');
                        console.log('🔍 Questions data structure:', formData.questions);
                        console.log('🔍 Questions keys:', Object.keys(formData.questions));
                        
                        // Now restore the question data directly since elements were just created
                        console.log('🔍 Elements created, restoring data directly...');
                        restoreInputData(formData);
                    } else {
                        console.log('🔍 No existing questions data, showing empty questions form');
                    }
                    
                    // Add the Save Test button after creating the form structure
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'btn btn-success';
                    saveBtn.textContent = 'Save Test';
                    saveBtn.onclick = () => saveInputTest(formData.testName, formData.numQuestions);
                    questionsContainer.appendChild(saveBtn);
                } else {
                    // No basic form data - questions form stays hidden until "Create Questions" is clicked
                    console.log('🔍 No basic form data found, questions form will appear when Create Questions is clicked');
                }
                break;
                
            case 'matchingForm':
                console.log('🔍 🟢 Restoring matching form fields...');
                const matchingTestNameElement = document.getElementById('matchingTestName');
                const matchingNumBlocksElement = null;
                
                if (matchingTestNameElement && formData.testName) {
                    matchingTestNameElement.value = formData.testName;
                }
                // removed matching num blocks restore
                break;
        }
    } catch (error) {
        console.error('🔍 Error restoring form data:', error);
    }
}

// Restore test creation state from localStorage
function restoreTestCreationState() {
    const stateData = localStorage.getItem('test_creation_state');
    if (!stateData) {
        console.log('🔍 No test creation state found in localStorage');
        return false;
    }
    
    try {
        const state = JSON.parse(stateData);
        console.log('🔍 Found test creation state:', state);
        
        // Check if state is recent (within last 30 minutes)
        const stateAge = Date.now() - state.timestamp;
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (stateAge > maxAge) {
            console.log('🔍 Test creation state is too old, clearing it');
            clearTestCreationState();
            return false;
        }
        
        // Restore the state
        window.isInTestCreation = true;
        console.log('🔍 Restored isInTestCreation flag to true');
        
        // Disable navigation buttons
        disableNavigationButtons();
        
        // Ensure the test creation section is visible before restoring
        const testCreationSection = document.getElementById('testCreationSection');
        if (testCreationSection) {
            testCreationSection.style.display = 'block';
            console.log('🔍 Made test creation section visible for restoration');
        }
        
        // NEW: Restore Excel upload state
        if (state.excelState) {
            restoreExcelUploadState(state.excelState);
        }
        
        // Show the appropriate step
        switch (state.currentStep) {
            case 'testTypeSelection':
                console.log('🔍 Restoring test type selection step');
                showTestTypeSelection();
                break;
            case 'multipleChoiceForm':
                console.log('🔍 Restoring multiple choice form step');
                showTestForm('multipleChoice');
                break;
            case 'trueFalseForm':
                console.log('🔍 Restoring true/false form step');
                showTestForm('trueFalse');
                break;
            case 'inputForm':
                console.log('🔍 Restoring input form step');
                showTestForm('input');
                break;
            case 'matchingForm':
                console.log('🔍 Restoring matching form step');
                showTestForm('matching');
                break;
            case 'testAssignment':
                console.log('🔍 Restoring test assignment step');
                // Note: We can't restore assignment step without test data, so go back to type selection
                showTestTypeSelection();
                break;
            default:
                console.log('🔍 Unknown step, defaulting to test type selection');
                showTestTypeSelection();
        }
        
        return true;
        
    } catch (error) {
        console.error('🔍 Error restoring test creation state:', error);
        clearTestCreationState();
        return false;
    }
}
// Show test form based on type
function showTestForm(testType) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTestForm, redirecting to login');
        alert('Missing teacher session. Please sign in again.');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('🔍 showTestForm called with testType:', testType);
    
    // Ensure navigation buttons are disabled
    disableNavigationButtons();
    
    // Hide test type selection
    document.getElementById('testTypeSelection').style.display = 'none';
    
    // Hide active tests section
    document.getElementById('activeTestsSection').style.display = 'none';
    
    // Remove active class from active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.classList.remove('active');
    }
    
    // Show the appropriate test form
    if (testType === 'multipleChoice') {
        document.getElementById('multipleChoiceForm').style.display = 'block';
        
        // For multiple choice form, we need to check if there's existing form data to restore
        const formDataStr = localStorage.getItem('test_creation_form_data');
        if (formDataStr) {
            try {
                const formData = JSON.parse(formDataStr);
                console.log('🔍 Found existing multiple choice form data:', formData);
                if (formData.testName && formData.numQuestions && formData.numOptions) {
                    console.log('🔍 Found existing multiple choice form data, checking questions...');
                    console.log('🔍 Questions object:', formData.questions);
                    console.log('🔍 Questions keys:', Object.keys(formData.questions));
                    console.log('🔍 Questions object length:', Object.keys(formData.questions).length);
                    
                    // We have basic form data, so restoreFormDataForStep will handle the restoration
                    // Don't call createMultipleChoiceQuestions here - it will overwrite our restored form
                    // But we need to ensure the form is shown and data is restored
                    document.getElementById('multipleChoiceForm').style.display = 'block';
                    
                    // IMPORTANT: Restore the data BEFORE returning
                    console.log('🔍 Restoring existing multiple choice form data...');
                    restoreFormDataForStep('multipleChoiceForm');
                    
                    console.log('🔍 EXITING EARLY - preventing saveTestCreationState call');
                    return; // Exit early to prevent the saveTestCreationState call below
                }
            } catch (error) {
                console.error('🔍 Error parsing existing multiple choice form data:', error);
            }
        }
        
        // Only save state if we're not restoring existing data
        saveTestCreationState('multipleChoiceForm');
    } else if (testType === 'trueFalse') {
        document.getElementById('trueFalseForm').style.display = 'block';
        
        // For true/false form, we need to check if there's existing form data to restore
        const formDataStr = localStorage.getItem('test_creation_form_data');
        if (formDataStr) {
            try {
                const formData = JSON.parse(formDataStr);
                console.log('🔍 Found existing true/false form data:', formData);
                if (formData.testName && formData.numQuestions) {
                    console.log('🔍 Found existing true/false form data, checking questions...');
                    console.log('🔍 Questions object:', formData.questions);
                    console.log('🔍 Questions keys:', Object.keys(formData.questions));
                    console.log('🔍 Questions object length:', Object.keys(formData.questions).length);
                    
                    // We have basic form data, so restoreFormDataForStep will handle the restoration
                    // Don't call createTrueFalseQuestions here - it will overwrite our restored form
                    // But we need to ensure the form is shown and data is restored
                    document.getElementById('trueFalseForm').style.display = 'block';
                    
                    // IMPORTANT: Restore the data BEFORE returning
                    console.log('🔍 Restoring existing true/false form data...');
                    restoreFormDataForStep('trueFalseForm');
                    
                    console.log('🔍 EXITING EARLY - preventing saveTestCreationState call');
                    return; // Exit early to prevent the saveTestCreationState call below
                }
            } catch (error) {
                console.error('🔍 Error parsing existing true/false form data:', error);
            }
        }
        
        // Only save state if we're not restoring existing data
        saveTestCreationState('trueFalseForm');
    } else if (testType === 'input') {
        document.getElementById('inputTestForm').style.display = 'block';
        
        // For input form, we need to check if there's existing form data to restore
        const formDataStr = localStorage.getItem('test_creation_form_data');
        if (formDataStr) {
            try {
                const formData = JSON.parse(formDataStr);
                console.log('🔍 Found existing form data:', formData);
                if (formData.testName && formData.numQuestions) {
                    console.log('🔍 Found existing input form data, checking questions...');
                    console.log('🔍 Questions object:', formData.questions);
                    console.log('🔍 Questions keys:', Object.keys(formData.questions));
                    console.log('🔍 Questions object length:', Object.keys(formData.questions).length);
                    
                    // We have basic form data, so restoreFormDataForStep will handle the restoration
                    // Don't call createInputQuestions here - it will overwrite our restored form
                    // But we need to ensure the form is shown and data is restored
                    document.getElementById('inputTestForm').style.display = 'block';
                    
                    // IMPORTANT: Restore the data BEFORE returning
                    console.log('🔍 Restoring existing input form data...');
                    restoreFormDataForStep('inputForm');
                    
                    console.log('🔍 EXITING EARLY - preventing saveTestCreationState call');
                    return; // Exit early to prevent the saveTestCreationState call below
                }
            } catch (error) {
                console.error('🔍 Error parsing existing form data:', error);
            }
        }
        
        // Only save state if we're not restoring existing data
        saveTestCreationState('inputForm');
    } else if (testType === 'matching') {
        document.getElementById('matchingTestForm').style.display = 'block';
        
        // Initialize the matching test widget
        const imageEditorContainer = document.getElementById('imageEditorContainer');
        if (imageEditorContainer && !imageEditorContainer.querySelector('.matching-test-widget')) {
            // Load the matching test bundle if not already loaded
            if (typeof window.MatchingTestWidget === 'undefined') {
                const script = document.createElement('script');
                script.src = 'matching-test-bundle.js';
                script.onload = () => {
                    if (window.initMatchingTestWidget) {
                        window.initMatchingTestWidget('imageEditorContainer').then(widget => {
                            if (widget) {
                                console.log('Matching test widget initialized successfully');
                            } else {
                                console.error('Failed to initialize matching test widget');
                            }
                        }).catch(error => {
                            console.error('Error initializing matching test widget:', error);
                        });
                    }
                };
                document.head.appendChild(script);
            } else {
                if (window.initMatchingTestWidget) {
                    window.initMatchingTestWidget('imageEditorContainer').then(widget => {
                        if (widget) {
                            console.log('Matching test widget initialized successfully');
                        } else {
                            console.error('Failed to initialize matching test widget');
                        }
                    }).catch(error => {
                        console.error('Error initializing matching test widget:', error);
                    });
                }
            }
        }
        
        saveTestCreationState('matching');
    }
}

// Handle multiple choice test submission
function handleMultipleChoiceSubmit() {
    console.log('=== handleMultipleChoiceSubmit called ===');
    const testName = document.getElementById('mcTestName').value;
    const numQuestions = parseInt(document.getElementById('mcNumQuestions').value);
    const numOptions = parseInt(document.getElementById('mcNumOptions').value);
    
    console.log('Test Name:', testName);
    console.log('Number of Questions:', numQuestions);
    console.log('Number of Options:', numOptions);
    
    if (!testName || !numQuestions || !numOptions || numQuestions < 1 || numQuestions > 100 || numOptions < 2 || numOptions > 6) {
        alert('Please enter valid test name, number of questions (1-100), and number of options (2-6)');
        return;
    }
    
    // Save form data before proceeding
    saveFormDataForStep('multipleChoiceForm');
    
    console.log('Calling createMultipleChoiceQuestions...');
    createMultipleChoiceQuestions(testName, numQuestions, numOptions, null);
    
    // NEW CODE - Show Excel button and hint after questions are generated
    showExcelUploadButton('multiple-choice');
    showExcelHint('multiple-choice');
}

// Handle true/false test submission
function handleTrueFalseSubmit() {
    const testName = document.getElementById('tfTestName').value;
    const numQuestions = parseInt(document.getElementById('tfNumQuestions').value);
    
    if (!testName || !numQuestions || numQuestions < 1 || numQuestions > 100) {
        alert('Please enter a valid test name and number of questions (1-100)');
        return;
    }
    
    // Save form data before proceeding
    saveFormDataForStep('trueFalseForm');
    
    createTrueFalseQuestions(testName, numQuestions, null);
    
    // NEW CODE - Show Excel button and hint after questions are generated
    showExcelUploadButton('true-false');
    showExcelHint('true-false');
}

// Handle input test submission
function handleInputTestSubmit() {
    const testName = document.getElementById('inputTestName').value;
    const numQuestions = parseInt(document.getElementById('inputNumQuestions').value);
    
    if (!testName || !numQuestions || numQuestions < 1 || numQuestions > 100) {
        alert('Please enter a valid test name and number of questions (1-100)');
        return;
    }
    
    // Save form data before proceeding
    saveFormDataForStep('inputForm');
    
    createInputQuestions(testName, numQuestions, null);
    
    // NEW CODE - Show Excel button and hint after questions are generated
    showExcelUploadButton('input');
    showExcelHint('input');
}

// Create multiple choice questions form
function createMultipleChoiceQuestions(testName, numQuestions, numOptions, existingData = null) {
    console.log('🔍 createMultipleChoiceQuestions called with:', { testName, numQuestions, numOptions, existingData });
    
    const container = document.getElementById('mcQuestionsContainer');
    container.innerHTML = '';
    
    const options = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numOptions);
    
    for (let i = 1; i <= numQuestions; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${i}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter your question here`;
        questionInput.id = `mc_question_${i}`;
        questionInput.required = true;
        questionDiv.appendChild(questionInput);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'option-inputs';
        
        options.forEach((option, index) => {
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.placeholder = `${option}`;
            optionInput.id = `mc_option_${i}_${option}`;
            optionInput.required = true;
            optionsDiv.appendChild(optionInput);
        });
        
        questionDiv.appendChild(optionsDiv);
        
        const correctAnswerSelect = document.createElement('div');
        correctAnswerSelect.className = 'correct-answer-select';
        const correctAnswerLabel = document.createElement('label');
        correctAnswerLabel.textContent = 'Correct Answer:';
        correctAnswerSelect.appendChild(correctAnswerLabel);
        
        const select = document.createElement('select');
        select.id = `mc_correct_${i}`;
        select.required = true;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        correctAnswerSelect.appendChild(select);
        questionDiv.appendChild(correctAnswerSelect);
        
        container.appendChild(questionDiv);
    }
    
    // Add auto-save listeners to all question and answer fields
    setupMultipleChoiceFormAutoSave();
    
    // Note: Form data restoration is now handled by restoreFormDataForStep directly
    // No need to call it here to avoid infinite loops
    
    // Trigger an initial save to capture the current state
    setTimeout(() => {
        console.log('🔍 Triggering initial form data save after form creation');
        saveFormDataForStep('multipleChoiceForm');
    }, 200);
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveMultipleChoiceTest(testName, numQuestions, numOptions);
    container.appendChild(saveBtn);
    

    
    // If we have existing data, restore it after the form is created
    if (existingData && existingData.questions) {
        console.log('🔍 Form created, now restoring existing data...');
        setTimeout(() => {
            restoreFormDataForStep('multipleChoiceForm');
        }, 100);
    }
}
// Save multiple choice test
async function saveMultipleChoiceTest(testName, numQuestions, numOptions) {
    try {
        console.log('=== saveMultipleChoiceTest called ===');
        
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveMultipleChoiceTest, redirecting to login');
            alert('Missing teacher session. Please sign in again.');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Teacher ID:', teacherId);
        console.log('Test Name:', testName);
        console.log('Number of Questions:', numQuestions);
        console.log('Number of Options:', numOptions);
        
        const testData = {
            teacher_id: teacherId,
            test_name: testName,
            num_questions: numQuestions,
            num_options: numOptions,
            questions: []
        };
        
        for (let i = 1; i <= numQuestions; i++) {
            const question = document.getElementById(`mc_question_${i}`).value.trim();
            const correctAnswer = document.getElementById(`mc_correct_${i}`).value;
            const options = {};
            
            // Validate that question is not empty
            if (!question) {
                alert(`Question ${i} cannot be empty. Please fill in all questions.`);
                return;
            }
            
            // Validate that correct answer is selected
            if (!correctAnswer) {
                alert(`Please select a correct answer for question ${i}.`);
                return;
            }
            
            console.log(`Question ${i}:`, question);
            console.log(`Correct Answer ${i}:`, correctAnswer);
            
            ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numOptions).forEach(option => {
                const optionValue = document.getElementById(`mc_option_${i}_${option}`).value.trim();
                options[`option_${option.toLowerCase()}`] = optionValue;
            });
            
            // For multiple choice tests, allow empty options - students will see just letters A, B, C, etc.
            ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numOptions).forEach(option => {
                const optionValue = document.getElementById(`mc_option_${i}_${option}`).value.trim();
                // Always send the option letter (A, B, C, etc.) regardless of text content
                // Students will see the letter + any text content, or just the letter if empty
                options[`option_${option.toLowerCase()}`] = optionValue || option;
            });
            
            // Only validate that the correct answer has content if it's selected
            if (correctAnswer) {
                const correctAnswerKey = `option_${correctAnswer.toLowerCase()}`;
                if (!options[correctAnswerKey] || options[correctAnswerKey].trim() === '') {
                    alert(`Question ${i}: The correct answer "${correctAnswer}" must have text content. Please fill in the option text for "${correctAnswer}".`);
                    return;
                }
            }
            
            console.log(`Options for question ${i}:`, options);
            
            testData.questions.push({
                question_id: i,
                question: question,
                correct_answer: correctAnswer,
                options: options
            });
        }
        
        console.log('Final testData to be sent:', testData);
        
        // Final validation: ensure all questions meet requirements
        for (let i = 0; i < testData.questions.length; i++) {
            const question = testData.questions[i];
            
            // Only validate that the correct answer has content
            if (question.correct_answer) {
                const correctAnswerKey = `option_${question.correct_answer.toLowerCase()}`;
                if (!question.options[correctAnswerKey] || question.options[correctAnswerKey].trim() === '') {
                    alert(`Question ${i + 1}: The correct answer "${question.correct_answer}" must have text content. Please fill in the option text for "${question.correct_answer}".`);
                    return;
                }
            }
        }
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/save-multiple-choice-test',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            }
        );
        
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response JSON:', result);
        
        if (result.success) {
            alert('Multiple choice test saved successfully!');
            console.log('Test saved with ID:', result.test_id);
            
            // Clear ONLY test form data, NOT user session data
            clearTestLocalStorage();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('multipleChoice', result.test_id);
        } else {
            alert('Error saving test: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving multiple choice test:', error);
        alert('Error saving test. Please try again.');
    }
}

// Save true/false test
async function saveTrueFalseTest(testName, numQuestions) {
    try {
        // Ensure numQuestions is a number
        const numQuestionsInt = parseInt(numQuestions);
        
        console.log('=== saveTrueFalseTest called ===');
        console.log('Test Name:', testName);
        console.log('Number of Questions (original):', numQuestions, 'type:', typeof numQuestions);
        console.log('Number of Questions (converted):', numQuestionsInt, 'type:', typeof numQuestionsInt);
        
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveTrueFalseTest, redirecting to login');
            alert('Missing teacher session. Please sign in again.');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        const testData = {
            teacher_id: teacherId,
            test_name: testName,
            num_questions: numQuestionsInt,
            questions: []
        };
        
        for (let i = 1; i <= numQuestionsInt; i++) {
            const question = document.getElementById(`tf_question_${i}`).value;
            const correctAnswer = document.getElementById(`tf_correct_${i}`).value;
            
            console.log(`Question ${i}:`, question);
            console.log(`Correct Answer ${i}:`, correctAnswer);
            
            testData.questions.push({
                question_id: i,
                question: question,
                correct_answer: correctAnswer === 'true'
            });
        }
        
        console.log('Final testData to be sent:', testData);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/save-true-false-test',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            }
        );
        
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Response JSON:', result);
        
        if (result.success) {
            alert('True/False test saved successfully!');
            
            // Clear ONLY test form data, NOT user session data
            clearTestLocalStorage();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('trueFalse', result.test_id);
        } else {
            alert('Error saving test: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving true/false test:', error);
        alert('Error saving test: ' + error.message);
    }
}

// Save input test
async function saveInputTest(testName, numQuestions) {
    console.log('🔍 saveInputTest called with:', { testName, numQuestions });
    
    // Save form data before submitting
    saveFormDataForStep('inputForm');
    
    try {
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveInputTest, redirecting to login');
            alert('Missing teacher session. Please sign in again.');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        const testData = {
            teacher_id: teacherId,
            test_name: testName,
            num_questions: numQuestions,
            questions: []
        };
        
        console.log('🔍 Initial testData:', testData);
        console.log('🔍 Current user teacher_id:', teacherId);
        
        for (let i = 1; i <= numQuestions; i++) {
            console.log(`🔍 Processing question ${i}...`);
            
            const questionElement = document.getElementById(`input_question_${i}`);
            console.log(`🔍 Question element for ${i}:`, questionElement);
            
            if (!questionElement) {
                console.error(`🔍 ERROR: Question element input_question_${i} not found!`);
                continue;
            }
            
            const question = questionElement.value;
            console.log(`🔍 Question ${i} text:`, question);
            
            // Get all answers for this question
            const answersContainer = document.getElementById(`answers_container_${i}`);
            console.log(`🔍 Answers container for question ${i}:`, answersContainer);
            
            if (!answersContainer) {
                console.error(`🔍 ERROR: Answers container answers_container_${i} not found!`);
                continue;
            }
            
            const answerInputs = answersContainer.querySelectorAll('.answer-input');
            console.log(`🔍 Answer inputs found for question ${i}:`, answerInputs.length);
            
            const answers = [];
            answerInputs.forEach((input, index) => {
                const answer = input.value.trim();
                console.log(`🔍 Answer ${index + 1} for question ${i}:`, answer);
                if (answer) { // Only add non-empty answers
                    answers.push(answer);
                }
            });
            
            console.log(`🔍 All answers for question ${i}:`, answers);
            
            // Ensure at least one answer exists
            if (answers.length === 0) {
                console.error(`🔍 ERROR: No answers found for question ${i}`);
                alert(`Please provide at least one answer for question ${i}`);
                return;
            }
            
            const questionData = {
                question_id: i,
                question: question,
                correct_answers: answers
            };
            
            console.log(`🔍 Question data for question ${i}:`, questionData);
            testData.questions.push(questionData);
        }
        
        console.log('🔍 Final testData to be sent:', testData);
        console.log('🔍 Number of questions collected:', testData.questions.length);
        
        if (testData.questions.length === 0) {
            console.error('🔍 ERROR: No questions collected!');
            alert('No questions were collected. Please check the form.');
            return;
        }
        
        console.log('🔍 Sending request to save-input-test function...');
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/save-input-test',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            }
        );
        
        console.log('🔍 Response received:', response);
        console.log('🔍 Response status:', response.status);
        
        const result = await response.json();
        console.log('🔍 Response result:', result);
        
        if (result.success) {
            console.log('🔍 Test saved successfully with ID:', result.test_id);
            alert('Input test saved successfully!');
            
            // Clear ONLY test form data, NOT user session data
            clearTestLocalStorage();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('input', result.test_id);
        } else {
            console.error('🔍 Error from backend:', result.message);
            alert('Error saving test: ' + result.message);
        }
    } catch (error) {
        console.error('🔍 Error in saveInputTest:', error);
        alert('Error saving test. Please try again.');
    }
}





// Create true/false questions form
function createTrueFalseQuestions(testName, numQuestions, existingData = null) {
    console.log('🔍 createTrueFalseQuestions called with:', { testName, numQuestions, existingData });
    
    const container = document.getElementById('tfQuestionsContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= numQuestions; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${i}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter question ${i}`;
        questionInput.id = `tf_question_${i}`;
        
        // Add auto-save listener to the question field
        questionInput.addEventListener('input', () => {
            console.log(`🔍 Auto-saving question ${i} input`);
            saveFormDataForStep('trueFalseForm');
        });
        
        questionDiv.appendChild(questionInput);
        
        const correctAnswerSelect = document.createElement('div');
        correctAnswerSelect.className = 'correct-answer-select';
        const select = document.createElement('select');
        select.id = `tf_correct_${i}`;
        
        // Add auto-save listener to the correct answer select
        select.addEventListener('change', () => {
            console.log(`🔍 Auto-saving correct answer ${i} selection`);
            saveFormDataForStep('trueFalseForm');
        });
        
        const trueOption = document.createElement('option');
        trueOption.value = 'true';
        trueOption.textContent = 'True';
        select.appendChild(trueOption);
        
        const falseOption = document.createElement('option');
        falseOption.value = 'false';
        falseOption.textContent = 'False';
        select.appendChild(falseOption);
        
        correctAnswerSelect.appendChild(select);
        questionDiv.appendChild(correctAnswerSelect);
        
        container.appendChild(questionDiv);
    }
    
    // Add auto-save listeners to all question and answer fields
    setupTrueFalseFormAutoSave();
    
    // Note: Form data restoration is now handled by restoreFormDataForStep directly
    // No need to call it here to avoid infinite loops
    
    // Trigger an initial save to capture the current state
    setTimeout(() => {
        console.log('🔍 Triggering initial form data save after form creation');
        saveFormDataForStep('trueFalseForm');
    }, 200);
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveTrueFalseTest(testName, numQuestions);
    container.appendChild(saveBtn);
    

    
    // If we have existing data, restore it after the form is created
    if (existingData && existingData.questions) {
        console.log('🔍 Form created, now restoring existing data...');
        setTimeout(() => {
            restoreFormDataForStep('trueFalseForm');
        }, 100);
    }
}

// Create input questions form
function createInputQuestions(testName, numQuestions, existingData = null) {
    console.log('🔍 createInputQuestions called with:', { testName, numQuestions, existingData });
    
    const container = document.getElementById('inputQuestionsContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= numQuestions; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${i}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter question ${i}`;
        questionInput.id = `input_question_${i}`;
        
        // Add auto-save listener to the question field
        questionInput.addEventListener('input', () => {
            console.log(`🔍 Auto-saving question ${i} input`);
            saveFormDataForStep('inputForm');
        });
        
        questionDiv.appendChild(questionInput);
        
        // Create answers container for this question
        const answersContainer = document.createElement('div');
        answersContainer.className = 'answers-container';
        answersContainer.id = `answers_container_${i}`;
        
        // First answer input
        const firstAnswerDiv = document.createElement('div');
        firstAnswerDiv.className = 'answer-input-group';
        
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.placeholder = `Correct answer for question ${i}`;
        answerInput.className = 'answer-input';
        answerInput.dataset.questionId = i;
        answerInput.dataset.answerIndex = 0;
        
        // Add auto-save listener to the first answer field
        answerInput.addEventListener('input', () => {
            console.log(`🔍 Auto-saving first answer for question ${i}`);
            saveFormDataForStep('inputForm');
        });
        
        firstAnswerDiv.appendChild(answerInput);
        
        // Add answer button
        const addAnswerBtn = document.createElement('button');
        addAnswerBtn.type = 'button';
        addAnswerBtn.className = 'btn btn-sm btn-outline-primary add-answer-btn';
        addAnswerBtn.textContent = '+ Add Answer';
        addAnswerBtn.onclick = () => addAnswerField(i);
        firstAnswerDiv.appendChild(addAnswerBtn);
        
        answersContainer.appendChild(firstAnswerDiv);
        questionDiv.appendChild(answersContainer);
        
        container.appendChild(questionDiv);
    }
    
    // Add auto-save listeners to all question and answer fields
    setupInputFormAutoSave();
    
    // Note: Form data restoration is now handled by restoreFormDataForStep directly
    // No need to call it here to avoid infinite loops
    
    // Trigger an initial save to capture the current state
    setTimeout(() => {
        console.log('🔍 Triggering initial form data save after form creation');
        saveFormDataForStep('inputForm');
    }, 200);
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveInputTest(testName, numQuestions);
    container.appendChild(saveBtn);
    

    
    // If we have existing data, restore it after the form is created
    if (existingData && existingData.questions) {
        console.log('🔍 Form created, now restoring existing data...');
        setTimeout(() => {
            restoreFormDataForStep('inputForm');
        }, 100);
    }
}

// Set up auto-save for multiple choice form question and answer fields
function setupMultipleChoiceFormAutoSave() {
    const numQuestions = parseInt(document.getElementById('mcNumQuestions')?.value) || 0;
    const numOptions = parseInt(document.getElementById('mcNumOptions')?.value) || 0;
    console.log(`🔍 Setting up auto-save for ${numQuestions} multiple choice questions with ${numOptions} options`);
    
    for (let i = 1; i <= numQuestions; i++) {
        // Add auto-save to question field
        const questionInput = document.getElementById(`mc_question_${i}`);
        if (questionInput) {
            console.log(`🔍 Adding auto-save listener to multiple choice question ${i}`);
            questionInput.addEventListener('input', () => {
                console.log(`🔍 Auto-saving multiple choice question ${i} input: "${questionInput.value}"`);
                // Add a small delay to ensure the value is captured
                setTimeout(() => saveFormDataForStep('multipleChoiceForm'), 100);
            });
        } else {
            console.log(`🔍 Multiple choice question input ${i} not found`);
        }
        
        // Add auto-save to option fields
        const options = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numOptions);
        options.forEach(option => {
            const optionInput = document.getElementById(`mc_option_${i}_${option}`);
            if (optionInput) {
                console.log(`🔍 Adding auto-save listener to multiple choice option ${i}${option}`);
                optionInput.addEventListener('input', () => {
                    console.log(`🔍 Auto-saving multiple choice option ${i}${option} input: "${optionInput.value}"`);
                    // Add a small delay to ensure the value is captured
                    setTimeout(() => saveFormDataForStep('multipleChoiceForm'), 100);
                });
            } else {
                console.log(`🔍 Multiple choice option input ${i}${option} not found`);
            }
        });
        
        // Add auto-save to correct answer select
        const correctAnswerSelect = document.getElementById(`mc_correct_${i}`);
        if (correctAnswerSelect) {
            console.log(`🔍 Adding auto-save listener to multiple choice correct answer ${i}`);
            correctAnswerSelect.addEventListener('change', () => {
                console.log(`🔍 Auto-saving multiple choice correct answer ${i} selection: "${correctAnswerSelect.value}"`);
                // Add a small delay to ensure the value is captured
                setTimeout(() => saveFormDataForStep('multipleChoiceForm'), 100);
            });
        } else {
            console.log(`🔍 Multiple choice correct answer select ${i} not found`);
        }
    }
}
// Set up auto-save for true/false form question and answer fields
function setupTrueFalseFormAutoSave() {
    const numQuestions = parseInt(document.getElementById('tfNumQuestions')?.value) || 0;
    console.log(`🔍 Setting up auto-save for ${numQuestions} true/false questions`);
    
    for (let i = 1; i <= numQuestions; i++) {
        // Add auto-save to question field
        const questionInput = document.getElementById(`tf_question_${i}`);
        if (questionInput) {
            console.log(`🔍 Adding auto-save listener to true/false question ${i}`);
            questionInput.addEventListener('input', () => {
                console.log(`🔍 Auto-saving true/false question ${i} input: "${questionInput.value}"`);
                // Add a small delay to ensure the value is captured
                setTimeout(() => saveFormDataForStep('trueFalseForm'), 100);
            });
        } else {
            console.log(`🔍 True/false question input ${i} not found`);
        }
        
        // Add auto-save to correct answer select
        const correctAnswerSelect = document.getElementById(`tf_correct_${i}`);
        if (correctAnswerSelect) {
            console.log(`🔍 Adding auto-save listener to true/false correct answer ${i}`);
            correctAnswerSelect.addEventListener('change', () => {
                console.log(`🔍 Auto-saving true/false correct answer ${i} selection: "${correctAnswerSelect.value}"`);
                // Add a small delay to ensure the value is captured
                setTimeout(() => saveFormDataForStep('trueFalseForm'), 100);
            });
        } else {
            console.log(`🔍 True/false correct answer select ${i} not found`);
        }
    }
}

// Set up auto-save for input form question and answer fields
function setupInputFormAutoSave() {
    const numQuestions = parseInt(document.getElementById('inputNumQuestions')?.value) || 0;
    console.log(`🔍 Setting up auto-save for ${numQuestions} questions`);
    
    for (let i = 1; i <= numQuestions; i++) {
        // Add auto-save to question field
        const questionInput = document.getElementById(`input_question_${i}`);
        if (questionInput) {
            console.log(`🔍 Adding auto-save listener to question ${i}`);
            questionInput.addEventListener('input', () => {
                console.log(`🔍 Auto-saving question ${i} input: "${questionInput.value}"`);
                // Add a small delay to ensure the value is captured
                setTimeout(() => saveFormDataForStep('inputForm'), 100);
            });
        } else {
            console.log(`🔍 Question input ${i} not found`);
        }
        
        // Add auto-save to answer fields
        const answerContainer = document.getElementById(`answers_container_${i}`);
        if (answerContainer) {
            const answerInputs = answerContainer.querySelectorAll('.answer-input');
            console.log(`🔍 Found ${answerInputs.length} answer inputs for question ${i}`);
            answerInputs.forEach((input, index) => {
                input.addEventListener('input', () => {
                    console.log(`🔍 Auto-saving answer ${index + 1} for question ${i}: "${input.value}"`);
                    // Add a small delay to ensure the value is captured
                    setTimeout(() => saveFormDataForStep('inputForm'), 100);
                });
            });
        } else {
            console.log(`🔍 Answer container ${i} not found`);
        }
    }
}

// Add additional answer field for a question
function addAnswerField(questionId) {
    const answersContainer = document.getElementById(`answers_container_${questionId}`);
    const currentAnswerCount = answersContainer.children.length;
    
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-input-group';
    
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = `Alternative answer ${currentAnswerCount + 1} for question ${questionId}`;
    answerInput.className = 'answer-input';
    answerInput.dataset.questionId = questionId;
    answerInput.dataset.answerIndex = currentAnswerCount;
    answerDiv.appendChild(answerInput);
    
    // Add auto-save listener to the new answer field
    answerInput.addEventListener('input', () => saveFormDataForStep('inputForm'));
    
    // Remove answer button (only for additional answers)
    const removeAnswerBtn = document.createElement('button');
    removeAnswerBtn.type = 'button';
    removeAnswerBtn.className = 'btn btn-sm btn-outline-danger remove-answer-btn';
    removeAnswerBtn.textContent = '× Remove';
    removeAnswerBtn.onclick = () => removeAnswerField(answerDiv);
    answerDiv.appendChild(removeAnswerBtn);
    
    answersContainer.appendChild(answerDiv);
}

// Remove answer field
function removeAnswerField(answerDiv) {
    answerDiv.remove();
}

// Show test assignment interface after test creation
function showTestAssignment(testType, testId) {
    // Check if we're returning from a successful assignment
    if (window.testAssignmentCompleted) {
        window.testAssignmentCompleted = false; // Reset flag
        return;
    }
    
    // Check if user session is still valid before proceeding using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTestAssignment, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Ensure navigation buttons are disabled
    disableNavigationButtons();
    
    // Save current state
    saveTestCreationState('testAssignment');
    
    // Hide all test forms
    document.getElementById('multipleChoiceForm').style.display = 'none';
    document.getElementById('trueFalseForm').style.display = 'none';
    document.getElementById('inputTestForm').style.display = 'none';
    document.getElementById('matchingTestForm').style.display = 'none';
    
    // Hide active tests section
    document.getElementById('activeTestsSection').style.display = 'none';
    
    // Remove active class from active tests button
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.classList.remove('active');
    }
    
    // Show test assignment section
    const assignmentSection = document.getElementById('testAssignmentSection');
    assignmentSection.style.display = 'block';
    
    // NEW: Reset Excel upload state when moving to assignment
    resetExcelUploadState();
    
    // Load teacher's available grades and classes
    loadTeacherGradesAndClasses(testType, testId);
}

// Load teacher's available grades and classes from teacher_subjects table
async function loadTeacherGradesAndClasses(testType, testId) {
    try {
        console.log('Loading teacher grades and classes for test assignment');
        
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found, redirecting to login');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Teacher ID:', teacherId);
        
        const url = `/.netlify/functions/get-teacher-subjects?teacher_id=${teacherId}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success && data.subjects && data.subjects.length > 0) {
            console.log('Teacher subjects loaded:', data.subjects);
            displayTestAssignmentOptions(data.subjects, testType, testId);
        } else {
            console.log('No teacher subjects found');
            console.log('Data structure:', data);
            document.getElementById('assignmentGradesContainer').innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h5>No Subjects Assigned</h5>
                    <p>You need to assign subjects to grades and classes before you can create tests.</p>
                    <button class="btn btn-primary" onclick="showSubjectSelectionPrompt()">Assign Subjects Now</button>
                    <button class="btn btn-secondary" onclick="resetTestCreation()" style="margin-left: 10px;">Cancel Test Creation</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading teacher grades and classes:', error);
        document.getElementById('assignmentGradesContainer').innerHTML = 
            '<p>Error loading available grades and classes.</p>';
    }
}

// Display test assignment options
function displayTestAssignmentOptions(subjects, testType, testId) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayTestAssignmentOptions, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('displayTestAssignmentOptions called with:', { subjects, testType, testId });
    
    const container = document.getElementById('assignmentGradesContainer');
    container.innerHTML = '';
    
    const title = document.createElement('h5');
    title.textContent = 'Select Grades and Classes to Assign This Test:';
    container.appendChild(title);
    
    console.log('Processing subjects:', subjects);
    
    // Debug: Log the first subject to see its structure
    if (subjects.length > 0) {
        console.log('First subject structure:', subjects[0]);
        console.log('First subject keys:', Object.keys(subjects[0]));
        console.log('First subject subject:', subjects[0].subject);
        console.log('First subject classes array:', subjects[0].classes);
        if (subjects[0].classes && subjects[0].classes.length > 0) {
            console.log('First class data:', subjects[0].classes[0]);
            console.log('First class grade:', subjects[0].classes[0].grade);
            console.log('First class class:', subjects[0].classes[0].class);
        }
    }
    
    // Create separate checkboxes for each subject-class combination
    // This ensures classes are NOT combined when teacher has multiple subjects
    
    subjects.forEach(subject => {
        console.log('Processing subject:', subject);
        console.log('Subject classes:', subject.classes);
        
        // Handle the nested classes structure
        if (subject.classes && Array.isArray(subject.classes)) {
            subject.classes.forEach(classData => {
                console.log('Processing class data:', classData);
                console.log('Class grade:', classData.grade, 'type:', typeof classData.grade);
                console.log('Class class:', classData.class, 'type:', typeof classData.class);
                
                // Create unique key for each subject-class combination
                const key = `${classData.grade}-${classData.class}-${subject.subject_id || subject.subject}`;
                console.log('Created unique key:', key);
                
                const div = document.createElement('div');
                div.className = 'grade-class-option';
                div.style.margin = '10px 0';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `gc_${key}`;
                checkbox.dataset.grade = classData.grade;
                checkbox.dataset.class = classData.class;
                checkbox.dataset.subject = subject.subject;
                checkbox.dataset.subjectId = subject.subject_id;
                
                const label = document.createElement('label');
                label.htmlFor = `gc_${key}`;
                label.textContent = `${classData.grade} ${classData.class} (${subject.subject})`;
                label.style.marginLeft = '10px';
                
                div.appendChild(checkbox);
                div.appendChild(label);
                container.appendChild(div);
            });
        } else {
            // Fallback for old format
            console.log('Using fallback format for subject:', subject);
            const key = `${subject.grade}-${subject.class}-${subject.subject_id || subject.subject}`;
            console.log('Created fallback unique key:', key);
            
            const div = document.createElement('div');
            div.className = 'grade-class-option';
            div.style.margin = '10px 0';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `gc_${key}`;
            checkbox.dataset.grade = subject.grade;
            checkbox.dataset.class = subject.class;
            checkbox.dataset.subject = subject.subject;
            checkbox.dataset.subjectId = subject.subject_id;
            
            const label = document.createElement('label');
            label.htmlFor = `gc_${key}`;
            label.textContent = `${subject.grade} ${subject.class} (${subject.subject})`;
            label.style.marginLeft = '10px';
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        }
    });
    
    console.log('Created separate checkboxes for each subject-class combination');
    
    // Add assign button
    const assignButton = document.createElement('button');
    assignButton.className = 'btn btn-primary';
    assignButton.textContent = 'Assign Test to Selected Classes';
    assignButton.style.marginTop = '20px';
    assignButton.onclick = () => assignTestToClasses(testType, testId);
    
    container.appendChild(assignButton);
    
    console.log('Finished creating assignment options');
}
// Assign test to selected classes
async function assignTestToClasses(testType, testId) {
    console.log('=== assignTestToClasses called ===');
    console.log('Test Type:', testType);
    console.log('Test ID:', testId);
    
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in assignTestToClasses, redirecting to login');
        alert('Missing teacher session. Please sign in again.');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Teacher ID:', teacherId);
    
    const selectedGradesClasses = [];
    
    // Get all checked grade/class/subject combinations
    document.querySelectorAll('#assignmentGradesContainer input[type="checkbox"]:checked').forEach(checkbox => {
        console.log('Found checked checkbox:', checkbox.dataset);
        selectedGradesClasses.push({
            grade: checkbox.dataset.grade,
            class: checkbox.dataset.class,
            subject: checkbox.dataset.subject,
            subject_id: checkbox.dataset.subjectId
        });
    });
    
    console.log('Selected grades/classes:', selectedGradesClasses);
    
    if (selectedGradesClasses.length === 0) {
        alert('Please select at least one grade and class combination.');
        return;
    }
    
    try {
        console.log('Sending assignment request...');
        
        const requestBody = {
            teacher_id: teacherId,
            test_type: test_type_map[testType],
            test_id: testId,
            assignments: selectedGradesClasses
        };
        
        console.log('Request body:', requestBody);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/assign-test',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );
        
        console.log('Assignment response received:', response);
        console.log('Assignment response status:', response.status);
        
        const data = await response.json();
        console.log('Assignment response data:', data);
        
        if (data.success) {
            alert(`Test assigned successfully to ${data.assignments_count} class(es)!`);
            console.log('Test assignment successful!');
            console.log('🔍 About to call returnToMainCabinet()...');
            // Return to main cabinet view after successful assignment
            await returnToMainCabinet();
            console.log('🔍 returnToMainCabinet() completed');
        } else {
            alert('Error assigning test: ' + data.error);
        }
    } catch (error) {
        console.error('Error assigning test:', error);
        alert('Error assigning test. Please try again.');
    }
}

// Return to main teacher cabinet view after test assignment
async function returnToMainCabinet() {
    console.log('returnToMainCabinet called - restoring main cabinet view');
    
    try {
        // Hide all test creation and assignment sections
        document.getElementById('testTypeSelection').style.display = 'none';
        document.getElementById('multipleChoiceForm').style.display = 'none';
        document.getElementById('trueFalseForm').style.display = 'none';
        document.getElementById('inputTestForm').style.display = 'none';
        document.getElementById('testAssignmentSection').style.display = 'none';
        document.getElementById('activeTestsSection').style.display = 'none';
        
        // Remove active class from active tests button
        const activeTestsBtn = document.getElementById('activeTestsBtn');
        if (activeTestsBtn) {
            activeTestsBtn.classList.remove('active');
        }
        
        // Show main cabinet container
        const mainCabinet = document.getElementById('main-cabinet-container');
        if (mainCabinet) {
            mainCabinet.style.display = 'block';
            console.log('Showed main cabinet container');
        }
        
        // Show test creation section (so Create Test button is visible)
        const testCreation = document.getElementById('testCreationSection');
        if (testCreation) {
            testCreation.style.display = 'block';
            console.log('🔍 Showed test creation section');
        }
        
        // Ensure all test forms are hidden to prevent interference
        const testForms = ['multipleChoiceForm', 'trueFalseForm', 'inputTestForm', 'testTypeSelection'];
        testForms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form && form.style.display !== 'none') {
                form.style.display = 'none';
                console.log(`🔍 Hidden test form: ${formId}`);
            }
        });
        
        // Refresh active tests data in background (so new test appears when they click Active Tests)
        await refreshActiveTestsData();
        
        // Show success message in the main cabinet
        showTestCreationSuccessMessage();
        
        // Set flag to prevent test assignment from being shown again
        window.testAssignmentCompleted = true;
        console.log('🔍 Set testAssignmentCompleted flag to true');
        
        // Reset test creation state and enable navigation buttons
        window.isInTestCreation = false;
        console.log('🔍 Reset isInTestCreation flag to false');
        enableNavigationButtons();
        
        // Clear test creation state from localStorage
        clearTestCreationState();
        
        console.log('Successfully returned to main cabinet view');
        
    } catch (error) {
        console.error('Error returning to main cabinet:', error);
        // Fallback: try to show main cabinet anyway
        const mainCabinet = document.getElementById('main-cabinet-container');
        if (mainCabinet) {
            mainCabinet.style.display = 'block';
        }
        const testCreation = document.getElementById('testCreationSection');
        if (testCreation) {
            testCreation.style.display = 'block';
        }
    }
}

// Show success message after test creation
function showTestCreationSuccessMessage() {
    console.log('showTestCreationSuccessMessage called');
    
    // Find or create success message container
    let successContainer = document.getElementById('testCreationSuccessMessage');
    if (!successContainer) {
        successContainer = document.createElement('div');
        successContainer.id = 'testCreationSuccessMessage';
        successContainer.className = 'success-message';
        successContainer.style.cssText = `
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 12px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
            animation: fadeIn 0.5s ease-in;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Insert after the test creation section
        const testCreation = document.getElementById('testCreationSection');
        if (testCreation && testCreation.parentNode) {
            testCreation.parentNode.insertBefore(successContainer, testCreation.nextSibling);
        }
    }
    
    // Set success message
    successContainer.innerHTML = `
        ✅ Test created and assigned successfully! 
        <br><small>You can now create another test or view your active tests.</small>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (successContainer && successContainer.parentNode) {
            successContainer.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                if (successContainer && successContainer.parentNode) {
                    successContainer.parentNode.removeChild(successContainer);
                }
            }, 500);
        }
    }, 5000);
    
    // Add fadeOut animation
    if (!document.querySelector('#fadeOutStyle')) {
        const fadeOutStyle = document.createElement('style');
        fadeOutStyle.id = 'fadeOutStyle';
        fadeOutStyle.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(fadeOutStyle);
    }
}

// Refresh active tests data in background without displaying
async function refreshActiveTestsData() {
    console.log('refreshActiveTestsData called - updating active tests data');
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-active-tests'
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('Active tests data refreshed successfully, found', data.tests.length, 'tests');
                // Store the refreshed data for when they click Active Tests
                window.lastActiveTestsData = data.tests;
            }
        }
    } catch (error) {
        console.error('Error refreshing active tests data:', error);
    }
}

// Map test types to database values
const test_type_map = {
    'multipleChoice': 'multiple_choice',
    'trueFalse': 'true_false',
    'input': 'input',
    'matching_type': 'matching_type'
};

function toggleSubjectDropdown() {
    const subjectDropdown = document.getElementById('subjectDropdown');
    const classSelection = document.getElementById('classSelection');
    
    if (subjectDropdown.style.display === 'none') {
        subjectDropdown.style.display = 'block';
        classSelection.style.display = 'none';
    } else {
        subjectDropdown.style.display = 'none';
        classSelection.style.display = 'none';
    }
}

async function loadSubjectsForDropdown() {
    try {
        const response = await fetch('/.netlify/functions/get-subjects');
        const data = await response.json();
        
        if (data.success) {
            const subjectSelect = document.getElementById('subjectSelect');
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">Select a subject</option>';
                data.subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.subject_id;
                    option.textContent = subject.subject;
                    subjectSelect.appendChild(option);
                });
            }
            
            // Add change event listener to subject select
            subjectSelect.addEventListener('change', onSubjectSelected);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function onSubjectSelected() {
    const subjectSelect = document.getElementById('subjectSelect');
    const selectedSubjectName = document.getElementById('selectedSubjectName');
    const classSelection = document.getElementById('classSelection');
    
    if (subjectSelect.value) {
        const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
        selectedSubjectName.textContent = selectedOption.textContent;
        classSelection.style.display = 'block';
        loadGradesAndClasses();
    } else {
        classSelection.style.display = 'none';
    }
}

function loadGradesAndClasses() {
    const gradesContainer = document.querySelector('.grades-container');
    if (!gradesContainer) return;
    
    gradesContainer.innerHTML = '';
    
    // Create grade sections for M1-M6 with correct class numbers
    for (let grade = 1; grade <= 6; grade++) {
        const gradeSection = document.createElement('div');
        gradeSection.className = 'grade-section';
        
        const gradeTitle = document.createElement('h4');
        gradeTitle.textContent = `Grade ${grade}`;
        gradeSection.appendChild(gradeTitle);
        
        const classCheckboxes = document.createElement('div');
        classCheckboxes.className = 'class-checkboxes';
        
        // Add class options based on grade with correct class numbers
        let classes;
        if (grade === 1 || grade === 2) {
            classes = ['15', '16'];
        } else if (grade === 3) {
            classes = ['15', '16'];
        } else if (grade === 4) {
            classes = ['13', '14'];
        } else if (grade === 5 || grade === 6) {
            classes = ['13', '14'];
        } else {
            classes = [];
        }
        
        classes.forEach(classNum => {
            const label = document.createElement('label');
            label.className = 'class-checkbox';
            label.htmlFor = `grade${grade}class${classNum}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `grade${grade}class${classNum}`;
            checkbox.value = `${grade}/${classNum}`;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${grade}/${classNum}`));
            classCheckboxes.appendChild(label);
        });
        
        gradeSection.appendChild(classCheckboxes);
        gradesContainer.appendChild(gradeSection);
    }
}

function saveClassesForSubject() {
    const subjectSelect = document.getElementById('subjectSelect');
    const selectedClasses = [];
    
    // Get all checked class checkboxes
    document.querySelectorAll('.class-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
        selectedClasses.push(checkbox.value);
    });
    
    if (selectedClasses.length === 0) {
        alert('Please select at least one class');
        return;
    }
    
    // Add to selected subjects list
    const selectedSubjects = document.getElementById('selectedSubjects');
    const subjectsList = document.getElementById('subjectsList');
    
    if (selectedSubjects && subjectsList) {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'selected-subject';
        subjectDiv.dataset.subjectId = subjectSelect.value; // Store the subject ID
        subjectDiv.dataset.subjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent; // Store the subject name
        subjectDiv.innerHTML = `
            <h4>${subjectSelect.options[subjectSelect.selectedIndex].textContent}</h4>
            <p>Classes: ${selectedClasses.join(', ')}</p>
            <button class="btn btn-danger btn-sm remove-subject-btn" onclick="removeSubject(this)">Remove</button>
        `;
        subjectsList.appendChild(subjectDiv);
        
        selectedSubjects.style.display = 'block';
        
        // Reset subject selection for next subject
        resetSubjectSelection();
        
        // Show message that subject was added
        showSubjectAddedMessage(subjectSelect.options[subjectSelect.selectedIndex].textContent);
    }
}

// Reset subject selection for adding more subjects
function resetSubjectSelection() {
    // Reset subject dropdown
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.value = '';
    
    // Hide class selection
    document.getElementById('classSelection').style.display = 'none';
    
    // Clear all checkboxes
    document.querySelectorAll('.class-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear grades container
    const gradesContainer = document.querySelector('.grades-container');
    if (gradesContainer) {
        gradesContainer.innerHTML = '';
    }
    
    // Show subject dropdown again
    document.getElementById('subjectDropdown').style.display = 'none';
}

// Show message that subject was added
function showSubjectAddedMessage(subjectName) {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'subjectSuccessMessage';
    messageDiv.className = 'subject-added-message';
    messageDiv.innerHTML = `
        <p><strong>${subjectName}</strong> has been added successfully!</p>
        <p>You can now add another subject or click "Save Subjects" to finish.</p>
    `;
    
    // Insert message above the selected subjects list
    const selectedSubjects = document.getElementById('selectedSubjects');
    selectedSubjects.parentNode.insertBefore(messageDiv, selectedSubjects);
    
    // Message will stay visible until Save Subjects is pressed
}

function showConfirmationModal() {
    console.log('=== showConfirmationModal called ===');
    const modal = document.getElementById('confirmationModal');
    console.log('Modal element found:', modal);
    
    if (modal) {
        console.log('Setting modal display to flex');
        modal.style.display = 'flex';
        console.log('Modal display after setting:', modal.style.display);
        
        // Verify the modal is visible
        setTimeout(() => {
            console.log('Modal display after timeout:', modal.style.display);
            console.log('Modal computed style:', window.getComputedStyle(modal).display);
        }, 100);
    } else {
        console.error('Confirmation modal not found!');
    }
}

function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmSaveSubjects() {
    console.log('=== confirmSaveSubjects called ===');
    console.log('User clicked YES - proceeding to save subjects');
    
    hideConfirmationModal();
    
    // Actually save the subjects to the database
    console.log('Calling saveTeacherSubjects...');
    saveTeacherSubjects();
}

function cancelSaveSubjects() {
    console.log('=== cancelSaveSubjects called ===');
    console.log('User clicked NO - cancelling subject save');
    
    hideConfirmationModal();
    
    // Don't save, just keep the subject selection open for editing
    // The teacher can continue adding/removing subjects
    console.log('Subject saving cancelled, teacher can continue editing');
}

function removeSubject(button) {
    const subjectDiv = button.closest('.selected-subject');
    if (subjectDiv) {
        subjectDiv.remove();
        
        // If no subjects left, hide the selected subjects section
        const subjectsList = document.getElementById('subjectsList');
        if (subjectsList && subjectsList.children.length === 0) {
            document.getElementById('selectedSubjects').style.display = 'none';
        }
    }
}

// Show edit subjects button
function showEditSubjectsButton() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showEditSubjectsButton, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.style.display = 'block';
    }
}

// Hide edit subjects button
function hideEditSubjectsButton() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in hideEditSubjectsButton, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.style.display = 'none';
    }
}
// Initialize grade buttons functionality - only show grades where teacher has subjects
async function initializeGradeButtons() {
    console.log('Initializing grade buttons...');
    const gradeButtons = document.querySelectorAll('.grade-btn');
    console.log('Found grade buttons:', gradeButtons.length);
    
    if (gradeButtons.length === 0) {
        console.error('No grade buttons found! This means the main cabinet is not visible or the buttons are not rendered.');
        console.log('Current page structure:');
        console.log('main-cabinet-container:', document.getElementById('main-cabinet-container'));
        console.log('grade-buttons:', document.querySelector('.grade-buttons'));
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-assignments'
        );
        const data = await response.json();
        
        if (data.success) {
            const assignedGrades = data.assignments;
            console.log('Teacher assigned grades/classes:', assignedGrades);
            
            // Hide/show grade buttons based on assignments
            gradeButtons.forEach(button => {
                const gradeNum = button.dataset.grade; // "1", "2", "3", etc.
                const gradeDisplay = `M${gradeNum}`;   // "M1", "M2", "M3", etc.
                
                const hasAssignments = assignedGrades.some(assignment => 
                    assignment.gradeDisplay === gradeDisplay
                );
                
                console.log(`Checking grade ${gradeNum} (${gradeDisplay}) - hasAssignments:`, hasAssignments);
                
                if (hasAssignments) {
                    button.style.display = 'block';
                    console.log('✅ Showing grade button:', button.textContent, 'with data-grade:', gradeNum);
                    button.addEventListener('click', () => {
                        // Check if we're in test creation mode
                        if (window.isInTestCreation) {
                            console.log('🔍 Grade button click blocked - currently in test creation mode');
                            return;
                        }
                        
                        console.log('Grade button clicked:', button.textContent, 'grade:', button.dataset.grade);
                        showClassesForGrade(button.dataset.grade, assignedGrades);
                    });
                } else {
                    button.style.display = 'none';
                    console.log('❌ Hiding grade button:', button.textContent, '- no assignments');
                }
            });
        } else {
            console.error('Failed to get teacher assignments:', data.message);
        }
    } catch (error) {
        console.error('Error fetching teacher assignments:', error);
    }
}

// Show classes for selected grade - only show classes where teacher has subjects
function showClassesForGrade(grade, assignments = null) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showClassesForGrade, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 showClassesForGrade blocked - currently in test creation mode');
        return;
    }
    
    console.log('showClassesForGrade called with grade:', grade);
    
    // Convert grade to number for comparison
    const gradeNum = parseInt(grade);
    console.log('Converted grade to number:', gradeNum);
    
    const classButtons = document.getElementById('classButtons');
    const semesterButtons = document.getElementById('semesterButtons');
    
    console.log('classButtons element:', classButtons);
    console.log('semesterButtons element:', semesterButtons);
    
    if (!classButtons) {
        console.error('classButtons element not found!');
        return;
    }
    
    // Clear previous content
    classButtons.innerHTML = '';
    semesterButtons.innerHTML = '';
    const resultsTables = document.getElementById('resultsTables');
    if (resultsTables) {
        resultsTables.innerHTML = '';
    }
    
    // Show class buttons
    classButtons.style.display = 'block';
    console.log('Class buttons display set to block');
    
    // If we have assignments data, use it to filter classes
    let classes = [];
    if (assignments) {
        // Filter assignments for this specific grade
        const gradeAssignments = assignments.filter(assignment => 
            assignment.gradeDisplay === `M${gradeNum}`
        );
        
        // Extract unique class numbers for this grade
        classes = [...new Set(gradeAssignments.map(assignment => assignment.class))];
        console.log(`Found ${classes.length} assigned classes for grade ${gradeNum}:`, classes);
    } else {
        // Fallback to hardcoded classes if no assignments data
        if (gradeNum === 1 || gradeNum === 2) {
            classes = ['15', '16'];
        } else if (gradeNum === 3) {
            classes = ['15', '16'];
        } else if (gradeNum === 4) {
            classes = ['13', '14'];
        } else if (gradeNum === 5 || gradeNum === 6) {
            classes = ['13', '14'];
        }
        console.log(`Using fallback classes for grade ${gradeNum}:`, classes);
    }
    
    // Sort classes numerically to ensure proper order (lesser class on left)
    classes.sort((a, b) => parseInt(a) - parseInt(b));
    console.log(`Sorted classes for grade ${gradeNum}:`, classes);
    
    if (classes.length === 0) {
        console.log(`No classes found for grade ${gradeNum}`);
        classButtons.innerHTML = '<p class="no-classes">No classes assigned for this grade</p>';
        return;
    }
    
    console.log('Creating class buttons for grade', gradeNum, 'with classes:', classes);
    
    classes.forEach(classNum => {
        const classBtn = document.createElement('button');
        classBtn.className = 'class-btn small-btn';
        classBtn.textContent = `${gradeNum}/${classNum}`;
        classBtn.dataset.grade = `M${gradeNum}`; // Use proper grade format (M1, M2, M3)
        classBtn.dataset.class = `${gradeNum}/${classNum}`; // Use proper class format (1/15, 1/16)
        classBtn.addEventListener('click', () => {
            console.log('Class button clicked:', `${gradeNum}/${classNum}`);
            
            // Check if this button is already active
            if (classBtn.classList.contains('active')) {
                // Button is already active, deselect it
                classBtn.classList.remove('active');
                // Hide semester buttons and results
                document.getElementById('semesterButtons').style.display = 'none';
                document.getElementById('resultsTables').innerHTML = '';
                console.log('Class button deselected');
                return;
            }
            
            // Remove active class from all class buttons
            document.querySelectorAll('.class-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            classBtn.classList.add('active');
            
            showSemestersForClass(`M${gradeNum}`, `${gradeNum}/${classNum}`);
        });
        classButtons.appendChild(classBtn);
        console.log('Created class button:', `${gradeNum}/${classNum}`);
    });
    
    console.log('Total class buttons created:', classButtons.children.length);
}

// Show semesters for selected class
function showSemestersForClass(grade, classNum) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showSemestersForClass, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('showSemestersForClass called with:', { grade, classNum });
    
    const semesterButtons = document.getElementById('semesterButtons');
    
    // Clear previous content
    semesterButtons.innerHTML = '';
    document.getElementById('resultsTables').innerHTML = '';
    
    // Show semester buttons
    semesterButtons.style.display = 'block';
    
    // Create semester buttons
    for (let semester = 1; semester <= 2; semester++) {
        const semesterBtn = document.createElement('button');
        semesterBtn.className = 'semester-btn small-btn';
        semesterBtn.textContent = `Semester ${semester}`;
        semesterBtn.dataset.semester = semester;
        semesterBtn.dataset.grade = grade;
        semesterBtn.dataset.class = classNum;
        semesterBtn.addEventListener('click', () => {
            // Check if we're in test creation mode
            if (window.isInTestCreation) {
                console.log('🔍 Semester button click blocked - currently in test creation mode');
                return;
            }
            
            console.log('Semester button clicked:', { semester, grade, classNum });
            
            // Check if this button is already active
            if (semesterBtn.classList.contains('active')) {
                // Button is already active, deselect it
                semesterBtn.classList.remove('active');
                // Clear results
                document.getElementById('resultsTables').innerHTML = '';
                console.log('Semester button deselected');
                return;
            }
            
            // Remove active class from all semester buttons
            document.querySelectorAll('.semester-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            semesterBtn.classList.add('active');
            
            console.log('About to call loadClassResults with:', { grade, classNum, semester });
            loadClassResults(grade, classNum, semester);
        });
        semesterButtons.appendChild(semesterBtn);
    }
    
    // Automatically determine and open current semester
    determineAndOpenCurrentSemester(grade, classNum);
}
// Determine and automatically open the current semester based on academic year
async function determineAndOpenCurrentSemester(grade, classNum) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in determineAndOpenCurrentSemester, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('determineAndOpenCurrentSemester called with:', { grade, classNum });
    
    try {
        // Get current academic year information
        const response = await fetch('/.netlify/functions/get-academic-year');
        const data = await response.json();
        
        if (data.success && data.academic_years && data.academic_years.length > 0) {
            // Get current date
            const currentDate = new Date();
            console.log('Current date:', currentDate);
            
            // Find the current academic period
            let currentSemester = 1; // Default to semester 1
            let currentPeriod = null;
            
            for (const period of data.academic_years) {
                const startDate = new Date(period.start_date);
                const endDate = new Date(period.end_date);
                
                console.log('Checking period:', {
                    id: period.id,
                    academic_year: period.academic_year,
                    semester: period.semester,
                    start_date: startDate,
                    end_date: endDate,
                    current_date: currentDate
                });
                
                // Check if current date falls within this period
                if (currentDate >= startDate && currentDate <= endDate) {
                    currentPeriod = period;
                    currentSemester = period.semester;
                    console.log('Found current period:', currentPeriod);
                    break;
                }
            }
            
            if (currentPeriod) {
                console.log('Current academic period found:', currentPeriod);
                console.log('Current semester:', currentSemester);
                
                // Find and activate the corresponding semester button
                const semesterButtons = document.querySelectorAll('.semester-btn');
                let targetButton = null;
                
                for (const button of semesterButtons) {
                    if (parseInt(button.dataset.semester) === currentSemester) {
                        targetButton = button;
                        break;
                    }
                }
                
                if (targetButton) {
                    console.log('Found target semester button:', targetButton);
                    
                    // Remove active class from all semester buttons
                    document.querySelectorAll('.semester-btn').forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to current semester button
                    targetButton.classList.add('active');
                    
                    // Automatically load results for current semester
                    console.log('Automatically loading results for current semester:', currentSemester);
                    await loadClassResults(grade, classNum, currentSemester);
                    
                } else {
                    console.log('Target semester button not found for semester:', currentSemester);
                }
            } else {
                console.log('No current academic period found, using default semester 1');
                // If no current period found, default to semester 1
                const semesterButtons = document.querySelectorAll('.semester-btn');
                if (semesterButtons.length > 0) {
                    const firstButton = semesterButtons[0];
                    firstButton.classList.add('active');
                    await loadClassResults(grade, classNum, 1);
                }
            }
        } else {
            console.log('Failed to get academic year data, using default semester 1');
            // Fallback to semester 1 if API fails
            const semesterButtons = document.querySelectorAll('.semester-btn');
            if (semesterButtons.length > 0) {
                const firstButton = semesterButtons[0];
                firstButton.classList.add('active');
                await loadClassResults(grade, classNum, 1);
            }
        }
    } catch (error) {
        console.error('Error determining current semester:', error);
        // Fallback to semester 1 if there's an error
        const semesterButtons = document.querySelectorAll('.semester-btn');
        if (semesterButtons.length > 0) {
            const firstButton = semesterButtons[0];
            firstButton.classList.add('active');
            await loadClassResults(grade, classNum, 1);
        }
    }
}

// Load class results for selected semester
async function loadClassResults(grade, classNum, semester) {
    console.log('loadClassResults called with:', { grade, classNum, semester });
    
    try {
        const url = `/.netlify/functions/get-class-results?grade=${grade}&class=${classNum}&semester=${semester}`;
        console.log('Fetching from URL:', url);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('Calling displayClassResults with results:', data.results);
            displayClassResults(data.results, grade, classNum, semester);
        } else {
            console.log('API returned success: false, showing no results message');
            document.getElementById('resultsTables').innerHTML = '<p>No results available for this class and semester.</p>';
        }
    } catch (error) {
        console.error('Error loading class results:', error);
        document.getElementById('resultsTables').innerHTML = '<p>Error loading results.</p>';
    }
}

// Display class results
function displayClassResults(results, grade, classNum, semester) {
    console.log('displayClassResults called with:', { results, grade, classNum, semester });
    
    const resultsContainer = document.getElementById('resultsTables');
    console.log('resultsContainer element:', resultsContainer);
    
    if (!resultsContainer) {
        console.error('resultsTables not found!');
        return;
    }
    
    // Clear container and add header
    resultsContainer.innerHTML = '';
    
    const header = document.createElement('h3');
    header.textContent = `${grade} ${classNum} - Test Results (Semester ${semester})`;
    console.log('Created header with text:', header.textContent);
    resultsContainer.appendChild(header);
    
    // Check if results is empty object or has no data
    if (!results || typeof results !== 'object' || Object.keys(results).length === 0) {
        resultsContainer.innerHTML += '<p>No test results available for this class and semester.</p>';
        console.log('Added no results message - no data available');
        return;
    }
    
    console.log('Results structure:', results);
    console.log('Results keys:', Object.keys(results));
    
    // Create separate tables for each subject
    if (results.subjects && Array.isArray(results.subjects) && results.subjects.length > 0) {
        console.log(`Creating tables for ${results.subjects.length} subjects:`, results.subjects);
        
        results.subjects.forEach(subject => {
            console.log(`Processing subject: ${subject.subject}`);
            
            // Create subject header
            const subjectHeader = document.createElement('h4');
            subjectHeader.className = 'subject-header';
            subjectHeader.textContent = `Subject: ${subject.subject}`;
            resultsContainer.appendChild(subjectHeader);
            
            // Get results for this specific subject
            const subjectResults = results[subject.subject] || [];
            console.log(`Found ${subjectResults.length} results for subject ${subject.subject}:`, subjectResults);
            
            if (subjectResults.length > 0) {
                // Extract ALL tests that belong to this subject (across all students)
                const subjectTests = [];
                const allTestKeys = new Set(); // Use Set to avoid duplicates

                // Collect test keys from ALL students with results
                subjectResults.forEach(student => {
                    if (student.has_results) {
                        Object.keys(student).forEach(key => {
                            if (!['student_id', 'name', 'surname', 'nickname', 'number', 'has_results', 'subject'].includes(key)) {
                                allTestKeys.add(key); // Add to Set to avoid duplicates
                            }
                        });
                    }
                });

                // Convert Set back to array with proper structure
                allTestKeys.forEach(testKey => {
                    subjectTests.push({
                        test_name: testKey,
                        test_type: 'unknown',
                        key: testKey
                    });
                });

                console.log(`[DEBUG] Enhanced test discovery for subject ${subject.subject}:`, subjectTests);
                console.log(`[DEBUG] Subject tests count:`, subjectTests.length);
                
                console.log(`Subject ${subject.subject} has ${subjectTests.length} tests:`, subjectTests);
                
                const table = createResultsTable(subject.subject, subjectResults, subjectTests);
                resultsContainer.appendChild(table);
            } else {
                const noResultsMsg = document.createElement('p');
                noResultsMsg.textContent = `No test results available for ${subject.subject}`;
                noResultsMsg.className = 'no-results-message';
                resultsContainer.appendChild(noResultsMsg);
            }
            
            // Add spacing between subjects
            if (subject !== results.subjects[results.subjects.length - 1]) {
                const spacer = document.createElement('div');
                spacer.className = 'subject-spacer';
                spacer.style.height = '2rem';
                resultsContainer.appendChild(spacer);
            }
        });
    } else if (results.class && Array.isArray(results.class)) {
        // Fallback: single table for all subjects combined
        const classResults = results.class;
        console.log(`Creating fallback table for class with ${classResults.length} students:`, classResults);
        
        if (classResults.length > 0) {
            const subjectName = classResults[0].subject || 'All Subjects';
            console.log(`Creating table for: ${subjectName}`);
            
            const table = createResultsTable(subjectName, classResults, results.unique_tests || []);
            resultsContainer.appendChild(table);
        }
    } else {
        console.log('No class results found in expected format');
    }
    
    console.log('Finished creating all tables');
}



// Legacy getCurrentTeacherId function removed - using JWT-based version above

// Helper function to determine score class for styling
function getScoreClass(score, maxScore) {
    if (score === null || maxScore === null) return '';
    
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
}

// Create results table
function createResultsTable(subject, students, uniqueTests = []) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'results-table';
    
    const tableTitle = document.createElement('h3');
    tableTitle.textContent = subject;
    tableContainer.appendChild(tableTitle);
    
    // Add subjects info if it's "All Subjects"
    if (subject === 'All Subjects') {
        const subjectsInfo = document.createElement('p');
        subjectsInfo.className = 'subjects-info';
        subjectsInfo.textContent = 'Combined results from all assigned subjects';
        subjectsInfo.style.cssText = 'color: #6c757d; font-size: 0.9rem; margin: 0.5rem 0; font-style: italic;';
        tableContainer.appendChild(subjectsInfo);
    }
    
    const table = document.createElement('table');
    
    // Create dynamic table headers
    let headerRow = `
        <thead>
            <tr>
                <th>Number</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
    `;
    
    // Add test columns
    if (uniqueTests && uniqueTests.length > 0) {
        uniqueTests.forEach(test => {
            headerRow += `<th>${test.test_name}</th>`;
        });
    } else {
        // No tests available
        headerRow += `<th>No Tests Available</th>`;
    }
    
    headerRow += `
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    table.innerHTML = headerRow;
    
    const tbody = table.querySelector('tbody');
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Base student info
        let rowHtml = `
            <td data-label="Number">${student.number}</td>
            <td data-label="Student ID">${student.student_id}</td>
            <td data-label="Name">${student.name}</td>
            <td data-label="Surname">${student.surname}</td>
            <td data-label="Nickname">${student.nickname}</td>
        `;
        
        // Add test result columns
        if (uniqueTests && uniqueTests.length > 0) {
            uniqueTests.forEach(test => {
                const testResult = student[test.key];
                if (testResult) {
                    // Student has result for this test
                    const [score, maxScore] = testResult.split('/');
                    const scoreClass = getScoreClass(parseInt(score), parseInt(maxScore));
                    row.className = `result-row ${scoreClass}`;
                    rowHtml += `<td class="score-cell" data-label="${test.test_name}">${testResult}</td>`;
                } else {
                    // Student has no result for this test
                    if (!row.className) row.className = 'result-row no-results';
                    rowHtml += `<td class="score-cell" data-label="${test.test_name}">-</td>`;
                }
            });
        } else {
            // No tests available
            rowHtml += `<td class="score-cell" data-label="No Tests Available">-</td>`;
        }
        
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    });
    
    tableContainer.appendChild(table);
    return tableContainer;
}

function showAdminSubjectEditor() {
    console.log('Showing admin subject editor...');
    // TODO: Implement admin subject editor
}

function showAcademicYearEditor() {
    console.log('Showing academic year editor...');
    // TODO: Implement admin subject editor
}

// Admin debugging functions
function debugFunction(functionName) {
    console.log(`Debugging function: ${functionName}`);
    
    switch(functionName) {
        case 'testDbConnection':
            testDbConnection();
            break;
        case 'getAllUsers':
            getAllUsers();
            break;
        case 'getAllTeachers':
            getAllTeachers();
            break;
        case 'getAllSubjects':
            getAllSubjects();
            break;
        default:
            console.log(`Unknown function: ${functionName}`);
    }
}



// Get all users
async function getAllUsers() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-users'
        );
        const data = await response.json();
        
        const container = document.getElementById('allUsersContainer');
        if (data.success) {
            displayUsersTable(data.users, container);
        } else {
            container.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error getting users:', error);
        const container = document.getElementById('allUsersContainer');
        container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Get all teachers
async function getAllTeachers() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-teachers'
        );
        const data = await response.json();
        
        const container = document.getElementById('allTeachersContainer');
        if (data.success) {
            displayTeachersTable(data.teachers, container);
        } else {
            container.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error getting teachers:', error);
        const container = document.getElementById('allTeachersContainer');
        container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Get all subjects
async function getAllSubjects() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-subjects'
        );
        const data = await response.json();
        
        const container = document.getElementById('allSubjectsContainer');
        if (data.success) {
            displaySubjectsTable(data.subjects, container);
        } else {
            container.innerHTML = `<p>Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error getting subjects:', error);
        const container = document.getElementById('allSubjectsContainer');
        container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Display users table
function displayUsersTable(users, container) {
    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Grade</th>
                <th>Class</th>
                <th>Number</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.grade}</td>
            <td>${user.class}</td>
            <td>${user.number}</td>
            <td>${user.student_id}</td>
            <td>${user.name}</td>
            <td>${user.surname}</td>
            <td>${user.nickname}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

// Display teachers table
function displayTeachersTable(teachers, container) {
    if (teachers.length === 0) {
        container.innerHTML = '<p>No teachers found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Teacher ID</th>
                <th>Username</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.teacher_id}</td>
            <td>${teacher.username}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

// Display subjects table
function displaySubjectsTable(subjects, container) {
    if (subjects.length === 0) {
        container.innerHTML = '<p>No subjects found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Subject ID</th>
                <th>Subject</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject.subject_id}</td>
            <td>${subject.subject}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}
function toggleMenu() {
    console.log('toggleMenu function called');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        console.log('Dropdown menu found, toggling show class');
        dropdownMenu.classList.toggle('show');
        console.log('Menu toggled, dropdown visible:', dropdownMenu.classList.contains('show'));
        console.log('Dropdown menu classes:', dropdownMenu.className);
        console.log('Dropdown menu display style:', window.getComputedStyle(dropdownMenu).display);
        
        // Add click outside listener when menu is opened
        if (dropdownMenu.classList.contains('show')) {
            // Use setTimeout to avoid immediate closure
            setTimeout(() => {
                document.addEventListener('click', closeMenuOnOutsideClick);
            }, 0);
        } else {
            // Remove listener when menu is closed
            document.removeEventListener('click', closeMenuOnOutsideClick);
        }
    } else {
        console.error('Dropdown menu not found!');
    }
}

// Close menu when clicking outside
function closeMenuOnOutsideClick(event) {
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // Check if click is outside both the menu button and dropdown menu
    if (menuBtn && dropdownMenu && 
        !menuBtn.contains(event.target) && 
        !dropdownMenu.contains(event.target)) {
        
        console.log('Click outside menu detected, closing menu');
        dropdownMenu.classList.remove('show');
        document.removeEventListener('click', closeMenuOnOutsideClick);
    }
}

function logout() {
    console.log('🚪 Logout initiated...');
    
    // Call backend logout to clear httpOnly cookie
    if (window.tokenManager) {
        window.tokenManager.logout();
    }
    
    // Clear role-based loader
    if (window.roleBasedLoader) {
        window.roleBasedLoader.reloadRoleAccess();
    }
    
    // Clear user session data specifically
    clearUserSessionData();
    
    // Clear test progress to prevent cross-student data leakage
    clearTestLocalStorage();
    
    // Reset global variables (legacy variables removed - JWT system handles session)
    // currentUser = null; - REMOVED
    // currentUserType = null; - REMOVED
    // teacherSubjects = []; - REMOVED
    // currentTestType = null; - REMOVED
    
    // CRITICAL FIX: Use the improved interface reset instead of just showSection
    resetInterfaceAfterSessionClear();
    
    console.log('✅ Logout completed - user session cleared, test data cleared, and interface reset');
}

// Student cabinet functionality
async function loadStudentData() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-subjects'
        );
        
        const data = await response.json();
        
        if (data.success) {
            displayStudentSubjects(data.subjects);
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

function displayStudentSubjects(subjects) {
    const subjectsContainer = document.getElementById('studentSubjects');
    if (!subjectsContainer) return;
    
    subjectsContainer.innerHTML = '';

    subjects.forEach(subject => {
        const subjectTab = document.createElement('div');
        subjectTab.className = 'subject-tab';
        subjectTab.innerHTML = `
            <h3>${subject.subject}</h3>
            <div class="test-results">
                <h4>Test Results</h4>
                <div class="loading">Loading...</div>
            </div>
        `;
        subjectsContainer.appendChild(subjectTab);
        
        // Load test results for this subject - using new function instead
        // loadStudentTestResults(subject.subject_id, subjectTab.querySelector('.test-results'));
    });
}

// Old function removed - using new loadStudentTestResults(studentId) instead

// Teacher cabinet functionality
async function loadTeacherData() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadTeacherData, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-subjects'
        );
        
        const data = await response.json();
        
        if (data.success) {
            teacherSubjects = data.subjects;
            if (teacherSubjects.length === 0) {
                showSubjectSelection();
            } else {
                showMainCabinet();
            }
        }
    } catch (error) {
        console.error('Error loading teacher data:', error);
    }
}

function showSubjectSelection() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showSubjectSelection, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const subjectSelection = document.getElementById('subject-selection-container');
    const mainCabinet = document.getElementById('main-cabinet-container');
    
    if (subjectSelection) subjectSelection.style.display = 'block';
    if (mainCabinet) mainCabinet.style.display = 'none';
    
    // Don't load all subjects - just show the subject selection interface
    // The teacher will use the "Choose Subject" button to select subjects one by one
}

// This function is not needed for the normal subject selection flow
// async function loadSubjects() {
//     try {
//         const response = await fetch('/.netlify/functions/get-subjects');
//         const data = await response.json();
//         
//         if (data.success) {
//             displaySubjectSelection(data.subjects);
//         }
//     } catch (error) {
//         console.error('Error loading subjects:', error);
//     }
// }

// This function is not needed for the normal subject selection flow
// function displaySubjectSelection(subjects) {
//     const subjectsContainer = document.getElementById('subjectsContainer');
//     if (!subjectsContainer) return;
//     
//     subjectsContainer.innerHTML = '';

//     subjects.forEach(subject => {
//         const subjectDiv = document.createElement('div');
//         subjectDiv.className = 'subject-item';
//         subjectDiv.innerHTML = `
//             <h4>${subject.subject}</h4>
//             <div class="grade-selection">
//                 <label>Grades/Classes:</label>
//                 <div class="grade-buttons">
//                     <div class="grade-buttons">
//                         ${generateGradeButtons()}
//                     </div>
//                 </div>
//             </div>
//         `;
//         subjectsContainer.appendChild(subjectDiv);
//     });
// }
// This function is not needed for the normal subject selection flow
// function generateGradeButtons() {
//     const grades = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
//     let buttons = '';
//     
//     grades.forEach(grade => {
//         const classes = grade === 'M1' || grade === '2' ? ['1/15', '1/16'] : 
//                        grade === 'M3' || grade === 'M4' ? ['3/15', '3/16'] : 
//                        grade === 'M5' || grade === 'M6' ? ['5/15', '5/16'] : [];
//         
//         classes.forEach(className => {
//             buttons += `<button class="grade-btn" data-grade="${grade}" data-class="${className}">${grade} ${className}</button>`;
//         });
//     }
//     
//     return buttons;
// }

async function saveTeacherSubjects() {
    console.log('=== saveTeacherSubjects called ===');
    
    const selectedSubjects = [];
    
    // Get subjects from the subjectsList (the ones we added when saving classes)
    const subjectsList = document.getElementById('subjectsList');
    if (subjectsList) {
        const selectedSubjectDivs = subjectsList.querySelectorAll('.selected-subject');
        console.log('Found selected subject divs:', selectedSubjectDivs.length);
        
        selectedSubjectDivs.forEach(subjectDiv => {
            const subjectId = subjectDiv.dataset.subjectId;
            const subjectName = subjectDiv.dataset.subjectName;
            const classesText = subjectDiv.querySelector('p').textContent;
            
            console.log('Processing subject div:', { subjectId, subjectName, classesText });
            
            // Extract class information from the text "Classes: 1/15, 1/16"
            const classesMatch = classesText.match(/Classes: (.+)/);
            if (classesMatch) {
                const classList = classesMatch[1].split(', ').map(className => {
                    // Parse class format like "1/15" to get grade and class
                    const [grade, classNum] = className.split('/');
                    return {
                        grade: grade,
                        class: classNum
                    };
                });
                
                console.log('Extracted classes:', classList);
                
                selectedSubjects.push({
                    subject_id: parseInt(subjectId),
                    subject_name: subjectName,
                    classes: classList
                });
            }
        });
    }
    
    console.log('Final selected subjects to save:', selectedSubjects);
    
    if (selectedSubjects.length === 0) {
        alert('Please select at least one subject and class combination.');
        return;
    }
    
    try {
        // Check if user session is still valid using JWT
        const teacherId = getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveTeacherSubjects, redirecting to login');
            alert('Missing teacher session. Please sign in again.');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Sending subjects to save:', selectedSubjects);
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/save-teacher-subjects',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjects: selectedSubjects
                })
            }
        );
        
        const data = await response.json();
        if (data.success) {
            alert('Subjects saved successfully!');
            
            // Remove the success message that was showing
            const successMessage = document.getElementById('subjectSuccessMessage');
            if (successMessage) {
                successMessage.remove();
            }
            
            // Hide subject selection and show success message
            document.getElementById('subject-selection-container').style.display = 'none';
            document.getElementById('subjectsSaved').style.display = 'block';
            
            // Show main cabinet container and test creation
            document.getElementById('main-cabinet-container').style.display = 'block';
            document.getElementById('testCreationSection').style.display = 'block';
            
            // Initialize grade button functionality
            initializeGradeButtons();
            
            // Show edit subjects button
            showEditSubjectsButton();
        } else {
            alert('Error saving subjects: ' + data.error);
        }
    } catch (error) {
        console.error('Error saving subjects:', error);
        alert('Error saving subjects. Please try again.');
    }
}

function showMainCabinet() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showMainCabinet, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const subjectSelection = document.getElementById('subject-selection-container');
    const mainCabinet = document.getElementById('main-cabinet-container');
    
    if (subjectSelection) subjectSelection.style.display = 'none';
    if (mainCabinet) mainCabinet.style.display = 'block';
    
    displayGradeButtons();
}

function displayGradeButtons() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayGradeButtons, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const gradesContainer = document.getElementById('gradesContainer');
    if (!gradesContainer) return;
    
    gradesContainer.innerHTML = '';
    
    const grades = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
    
    grades.forEach(grade => {
        const gradeDiv = document.createElement('div');
        gradeDiv.className = 'grade-section';
        gradeDiv.innerHTML = `
            <h3>Grade ${grade}</h3>
            <div class="class-buttons">
                ${generateClassButtons(grade)}
            </div>
        `;
        gradesContainer.appendChild(gradeDiv);
    });
}

function generateClassButtons(grade) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in generateClassButtons, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return '';
    }
    
    let classes;
    if (grade === 'M1' || grade === 'M2') {
        classes = ['1/15', '1/16'];
    } else if (grade === 'M3') {
        classes = ['3/15', '3/16'];
    } else if (grade === 'M4') {
        classes = ['4/13', '4/14'];
    } else if (grade === 'M5' || grade === 'M6') {
        classes = ['5/13', '5/14'];
    } else {
        classes = [];
    }
    
    return classes.map(className => 
        `<button class="class-btn small-btn" onclick="showClassResults('${grade}', '${className}')">${grade} ${className}</button>`
    ).join('');
}

async function showClassResults(grade, className) {
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 Class button click blocked - currently in test creation mode');
        return;
    }
    
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showClassResults, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            `/.netlify/functions/get-class-results?grade=${grade}&class=${className}&semester=1`
        );
        const data = await response.json();
        
        if (data.success) {
            displayClassResultsAdmin(data.results, grade, className);
        }
    } catch (error) {
        console.error('Error loading class results:', error);
    }
}

function displayClassResultsAdmin(results, grade, className) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayClassResultsAdmin, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('displayClassResultsAdmin called with:', { results, grade, className });
    
    const resultsContainer = document.getElementById('resultsTables');
    console.log('resultsContainer element:', resultsContainer);
    
    if (!resultsContainer) {
        console.error('resultsTables not found!');
        return;
    }
    
    resultsContainer.innerHTML = '';
    console.log('Cleared resultsContainer');
    
    const header = document.createElement('h3');
    header.textContent = `${grade}/${className} - Test Results`;
    console.log('Created header with text:', header.textContent);
    
    resultsContainer.appendChild(header);
    console.log('Appended header to container');
    
    if (results.length === 0) {
        resultsContainer.innerHTML += '<p>No test results available for this class.</p>';
        console.log('Added no results message');
        return;
    }
    
    console.log('Creating table for', results.length, 'results');
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
                <th>Average Score</th>
                <th>Max Score</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.student_id}</td>
            <td>${result.name}</td>
            <td>${result.surname}</td>
            <td>${result.nickname}</td>
            <td>${result.avg_score}</td>
            <td>${result.max_score}</td>
        `;
        tbody.appendChild(row);
    });
    
    resultsContainer.appendChild(table);
    console.log('Appended header to container');
}

// Admin panel functionality
async function loadAdminData() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadAdminData, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Load initial admin data
    await loadAllTeachers();
    await loadAllSubjects();
    await loadAcademicYear();
    await loadAllUsers();
}

async function loadAllTeachers() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadAllTeachers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/get-all-teachers');
        const data = await response.json();
        
        if (data.success) {
            displayAllTeachers(data.teachers);
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

function displayAllTeachers(teachers) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayAllTeachers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('allTeachersContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>All Teachers</h3>
        <table>
            <thead>
                <tr>
                    <th>Teacher ID</th>
                    <th>Username</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${teachers.map(teacher => `
                    <tr>
                        <td>${teacher.teacher_id}</td>
                        <td>${teacher.username}</td>
                        <td>
                            <button onclick="editTeacher('${teacher.teacher_id}')">Edit</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAllSubjects() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadAllSubjects, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-subjects'
        );
        const data = await response.json();
        
        if (data.success) {
            displayAllSubjects(data.subjects);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function displayAllSubjects(subjects) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayAllSubjects, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('allSubjectsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>All Subjects</h3>
        <table>
            <thead>
                <tr>
                    <th>Subject ID</th>
                    <th>Subject Name</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map(subject => `
                    <tr>
                        <td>${subject.subject_id}</td>
                        <td>${subject.subject}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAcademicYear() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadAcademicYear, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-academic-year'
        );
        const data = await response.json();
        
        if (data.success) {
            displayAcademicYear(data.academic_years);
        }
    } catch (error) {
        console.error('Error loading academic year:', error);
    }
}

function displayAcademicYear(academicYears) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayAcademicYear, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('academicYearContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>Academic Years</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Term</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                </tr>
            </thead>
            <tbody>
                ${academicYears.map(ay => `
                    <tr>
                        <td>${ay.id}</td>
                        <td>${ay.academic_year}</td>
                        <td>${ay.semester}</td>
                        <td>${ay.term}</td>
                        <td>${ay.start_date}</td>
                        <td>${ay.end_date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAllUsers() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadAllUsers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/get-all-users');
        const data = await response.json();
        
        if (data.success) {
            displayAllUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayAllUsers(users) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayAllUsers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('allUsersContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>All Users (Students)</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Number</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Nickname</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.grade}</td>
                        <td>${user.class}</td>
                        <td>${user.number}</td>
                        <td>${user.student_id}</td>
                        <td>${user.name}</td>
                        <td>${user.surname}</td>
                        <td>${user.nickname}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Helper function to ensure debug output exists
function ensureDebugOutput() {
    let debugOutput = document.getElementById('debugOutput');
    if (!debugOutput) {
        const container = document.getElementById('debugFunctionsContainer');
        if (container) {
            container.innerHTML = `
                <h3>Debug Functions</h3>
                <div class="debug-buttons">
                    <button onclick="testDbConnection()">Test DB Connection</button>
                    <button onclick="testStudentLogin()">Test Student Login</button>
                    <button onclick="testTeacherLogin()">Test Teacher Login</button>
                    <button onclick="testAdminLogin()">Test Admin Login</button>
                    <button onclick="testGetSubjects()">Test Get Subjects</button>
                    <button onclick="testGetTeacherSubjects()">Test Get Teacher Subjects</button>
                    <button onclick="testGetClassResults()">Test Get Class Results</button>
                    <button onclick="testGetStudentSubjects()">Test Get Student Subjects</button>
                    <button onclick="testGetStudentTestResults()">Test Get Student Test Results</button>
                </div>
                <div id="debugOutput"></div>
            `;
            debugOutput = document.getElementById('debugOutput');
        }
    }
    return debugOutput;
}

function showDebugFunctions() {
    const container = document.getElementById('debugFunctionsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>Debug Functions</h3>
        <div class="debug-buttons">
            <button onclick="testDbConnection()">Test DB Connection</button>
            <button onclick="testStudentLogin()">Test Student Login</button>
            <button onclick="testTeacherLogin()">Test Teacher Login</button>
            <button onclick="testAdminLogin()">Test Admin Login</button>
            <button onclick="testGetSubjects()">Test Get Subjects</button>
            <button onclick="testGetTeacherSubjects()">Test Get Teacher Subjects</button>
            <button onclick="testGetClassResults()">Test Get Class Results</button>
            <button onclick="testGetStudentSubjects()">Test Get Student Subjects</button>
            <button onclick="testGetStudentTestResults()">Test Get Student Test Results</button>
        </div>
        <div id="debugOutput"></div>
    `;
}

// Debug function implementations
async function testDbConnection() {
    try {
        const debugOutput = ensureDebugOutput();
        const response = await fetch('/.netlify/functions/test-db-connection');
        const data = await response.json();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        const debugOutput = ensureDebugOutput();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
    }
}

async function testStudentLogin() {
    try {
        const debugOutput = ensureDebugOutput();
        const response = await fetch('/.netlify/functions/student-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: '51706', password: '1' })
        });
        const data = await response.json();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        const debugOutput = ensureDebugOutput();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
    }
}

async function testTeacherLogin() {
    try {
        const debugOutput = ensureDebugOutput();
        const response = await fetch('/.netlify/functions/teacher-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Aleksandr_Petrov', password: '465' })
        });
        const data = await response.json();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        const debugOutput = ensureDebugOutput();
        if (debugOutput) {
            debugOutput.innerHTML = `<pre>Error: ${error.message}</pre>`;
        }
    }
}

async function testAdminLogin() {
    try {
        const response = await fetch('/.netlify/functions/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'maxpower' })
        });
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

async function testGetSubjects() {
    try {
        const response = await fetch('/.netlify/functions/get-subjects');
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

async function testGetTeacherSubjects() {
    try {
        const response = await fetch('/.netlify/functions/get-teacher-subjects?teacher_id=Aleksandr_Petrov');
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

async function testGetClassResults() {
    try {
        const response = await fetch('/.netlify/functions/get-class-results?grade=M1&class=1/15&semester=1&teacher_id=Aleksandr_Petrov');
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

async function testGetStudentSubjects() {
    try {
        const response = await fetch('/.netlify/functions/get-student-subjects?student_id=51706');
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

async function testGetStudentTestResults() {
    try {
        const response = await fetch('/.netlify/functions/get-student-test-results?student_id=51706&subject_id=1');
        const data = await response.json();
        document.getElementById('debugOutput').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('debugOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

// Missing admin functions
function showAdminSubjectEditor() {
    // Placeholder for admin subject editor
    console.log('Admin subject editor - to be implemented');
}

function showAcademicYearEditor() {
    // Placeholder for academic year editor
    console.log('Academic year editor - to be implemented');
}

// Debug function for admin panel
function debugFunction(functionName) {
    switch(functionName) {
        case 'testDbConnection':
            testDbConnection();
            break;
        case 'getAllUsers':
            loadAllUsers();
            break;
        case 'getAllTeachers':
            loadAllTeachers();
            break;
        case 'getAllSubjects':
            loadAllSubjects();
            break;
        case 'getAllTests':
            getAllTests();
            break;
        case 'getTestAssignments':
            getTestAssignments();
            break;
        case 'getTestResults':
            getTestResults();
            break;
        default:
            console.log('Unknown debug function:', functionName);
    }
}
// Test localStorage functionality
function testLocalStorage() {
    console.log('=== Testing Local Storage ===');
    
    // Test if localStorage is available
    if (typeof(Storage) !== "undefined") {
        console.log('localStorage is supported');
        
        // Test writing
        try {
            localStorage.setItem('test_key', 'test_value');
            console.log('Write test: SUCCESS');
        } catch (e) {
            console.error('Write test: FAILED', e);
        }
        
        // Test reading
        try {
            const value = localStorage.getItem('test_key');
            console.log('Read test: SUCCESS, value:', value);
        } catch (e) {
            console.error('Read test: FAILED', e);
        }
        
        // Test clearing
        try {
            localStorage.removeItem('test_key');
            console.log('Clear test: SUCCESS');
        } catch (e) {
            console.error('Clear test: FAILED', e);
        }
        
        // Show current localStorage contents
        console.log('Current localStorage contents:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}: ${value}`);
        }
        
    } else {
        console.error('localStorage is NOT supported');
    }
}

// Run database schema function
async function runDatabaseSchema() {
    try {
        console.log('Running database schema...');
        
        const response = await fetch('/.netlify/functions/run-schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Database schema executed successfully! ${result.statements_executed} statements processed.`);
            console.log('Schema execution result:', result);
        } else {
            alert('Error running schema: ' + result.error);
            console.error('Schema execution error:', result);
        }
    } catch (error) {
        console.error('Error running schema:', error);
        alert('Error running schema: ' + error.message);
    }
}

// Initialize active tests functionality
function initializeActiveTests() {
    const activeTestsBtn = document.getElementById('activeTestsBtn');
    if (activeTestsBtn) {
        activeTestsBtn.addEventListener('click', showActiveTests);
    }
}

// Show active tests for teacher
async function showActiveTests() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showActiveTests, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        // Check if we're in test creation mode
        if (window.isInTestCreation) {
            console.log('🔍 Active tests button click blocked - currently in test creation mode');
            return;
        }
        
        const activeTestsBtn = document.getElementById('activeTestsBtn');
        const activeTestsSection = document.getElementById('activeTestsSection');
        
        // Check if active tests section is already visible
        if (activeTestsSection.style.display === 'block') {
            // Hide active tests section
            activeTestsSection.style.display = 'none';
            // Remove active class from button
            activeTestsBtn.classList.remove('active');
            return;
        }
        
        // Hide other sections
        document.getElementById('testTypeSelection').style.display = 'none';
        document.getElementById('multipleChoiceForm').style.display = 'none';
        document.getElementById('trueFalseForm').style.display = 'none';
        document.getElementById('inputTestForm').style.display = 'none';
        document.getElementById('matchingTestForm').style.display = 'none';
        document.getElementById('testAssignmentSection').style.display = 'none';
        
        // Show active tests section
        activeTestsSection.style.display = 'block';
        
        // Add active class to button
        activeTestsBtn.classList.add('active');
        
        // Load and display active tests (use cached data if available)
        if (window.lastActiveTestsData) {
            console.log('Using cached active tests data for immediate display');
            displayTeacherActiveTests(window.lastActiveTestsData);
            // Still refresh in background to ensure data is current
            loadTeacherActiveTests();
        } else {
            // Load and display active tests
            await loadTeacherActiveTests();
        }
        
    } catch (error) {
        console.error('Error showing active tests:', error);
    }
}

// Load teacher's active tests
async function loadTeacherActiveTests() {
    console.log('🔧 DEBUG: loadTeacherActiveTests called');
    
    try {
        console.log('🔧 DEBUG: Fetching teacher active tests using JWT authentication...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-active-tests'
        );
        console.log('🔧 DEBUG: Response received:', response);
        console.log('🔧 DEBUG: Response status:', response.status);
        console.log('🔧 DEBUG: Response ok:', response.ok);
        
        if (!response.ok) {
            console.error('🔧 DEBUG: HTTP error! status:', response.status);
            const errorText = await response.text();
            console.error('🔧 DEBUG: Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔧 DEBUG: Response data:', data);
        
        if (data.success) {
            console.log('🔧 DEBUG: Success! Calling displayTeacherActiveTests with', data.tests.length, 'tests');
            displayTeacherActiveTests(data.tests);
        } else {
            console.error('🔧 DEBUG: Error in response data:', data.error);
        }
    } catch (error) {
        console.error('🔧 DEBUG: Error loading active tests:', error);
        console.error('🔧 DEBUG: Error details:', {
            message: error.message,
            stack: error.stack,
            teacherId: teacherId
        });
    }
}
// Display teacher's active tests
function displayTeacherActiveTests(tests) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayTeacherActiveTests, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('activeTestsContainer');
    if (!container) return;
    
    if (tests.length === 0) {
        container.innerHTML = '<p>No active tests found.</p>';
        return;
    }
    
    let html = '';
    
    tests.forEach(test => {
        html += `
            <div class="test-item teacher-test-item" data-test-id="${test.test_id}" data-test-type="${test.test_type}">
                <div class="test-header">
                    <h4 class="test-title" onclick="viewTeacherTestDetails('${test.test_type}', ${test.test_id}, '${test.test_name}')">${test.test_name}</h4>
                </div>
                <div class="test-meta-compact">
                    <span class="meta-item">${test.test_type.replace('_', ' ').toUpperCase()}</span>
                    <span class="meta-item">${test.num_questions} questions</span>
                    <span class="meta-item">Created: ${new Date(test.created_at).toLocaleDateString()}</span>
                    <span class="meta-item">${test.assignment_count} assignments</span>
                </div>
        `;
        
        if (test.assignments && test.assignments.length > 0) {
            html += '<div class="assignments">';
            html += '<h6>Class Assignments:</h6>';
            
            test.assignments.forEach(assignment => {
                const daysRemaining = Math.max(0, Math.floor(assignment.days_remaining));
                let statusClass = '';
                let statusText = '';
                
                if (daysRemaining <= 1) {
                    statusClass = 'expired';
                    statusText = 'EXPIRED!';
                } else if (daysRemaining <= 2) {
                    statusClass = 'expiring-soon';
                    statusText = `Expires in ${daysRemaining} days!`;
                } else {
                    statusClass = 'active';
                    statusText = `${daysRemaining} days remaining`;
                }
                
                html += `
                    <div class="assignment-item ${statusClass}">
                        <div class="assignment-info">
                            <strong>Grade ${assignment.grade}, Class ${assignment.class}</strong>
                            <br>
                            <small>Assigned: ${new Date(assignment.assigned_at).toLocaleDateString()}</small>
                            <span class="status-indicator ${statusClass}">${statusText}</span>
                        </div>
                        <div class="assignment-actions">
                            <button class="btn btn-warning btn-sm hide-test-btn" onclick="event.stopPropagation(); removeClassAssignment('${test.test_type}', ${test.test_id}, ${assignment.assignment_id}, '${test.test_name}', '${assignment.grade}', '${assignment.class}')">
                                Hide Test
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// View teacher test details (questions and correct answers)
async function viewTeacherTestDetails(testType, testId, testName) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in viewTeacherTestDetails, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Viewing teacher test details:', { testType, testId, testName });
    
    try {
        // Load test questions directly without completion check
        const questions = await loadTeacherTestQuestions(testType, testId);
        
        if (questions && questions.length > 0) {
            // Show test details in a modal or overlay
            showTeacherTestDetailsModal(testType, testId, testName, questions);
        } else {
            alert('Could not load test questions. Please try again.');
        }
    } catch (error) {
        console.error('Error loading teacher test details:', error);
        alert('Error loading test details. Please try again.');
    }
}

// Show teacher test details modal
function showTeacherTestDetailsModal(testType, testId, testName, questions) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTeacherTestDetailsModal, redirecting to login');
        // Redirect to login
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('showTeacherTestDetailsModal called with:', { testType, testId, testName, questions });
    
    // Create modal HTML
    const modalHTML = `
        <div id="teacherTestDetailsModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${testName}</h3>
                    <button class="modal-close" onclick="closeTeacherTestDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="test-questions">
                        ${questions.map((question, index) => `
                            <div class="question-item">
                                <h4>Question ${index + 1}</h4>
                                <p class="question-text">${question.question}</p>
                                ${getQuestionAnswerDisplay(question, testType)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('Modal HTML created:', modalHTML);
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('teacherTestDetailsModal');
            if (modal) {
            console.log('Modal element found, setting display to flex');
            modal.style.display = 'flex';
            
            // Force modal to be visible and on top
            modal.style.zIndex = '10000';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // Add click outside to close functionality
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeTeacherTestDetailsModal();
                }
            });
            
            console.log('Modal should now be visible with z-index:', modal.style.zIndex);
            
            // Double-check modal is visible
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(modal);
                console.log('Modal computed styles:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    zIndex: computedStyle.zIndex
                });
            }, 100);
        } else {
            console.error('Modal element not found after insertion!');
        }
}

// Load test questions for teacher (without completion check)
async function loadTeacherTestQuestions(testType, testId) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in loadTeacherTestQuestions, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('loadTeacherTestQuestions called with:', { testType, testId });
    
    try {
        const url = `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('Success! Returning questions:', data.questions);
            return data.questions;
        } else {
            console.error('Error in response data:', data.error);
            throw new Error(data.error || 'Failed to load test questions');
        }
    } catch (error) {
        console.error('Error loading teacher test questions:', error);
        throw error;
    }
}

// Close teacher test details modal
function closeTeacherTestDetailsModal() {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in closeTeacherTestDetailsModal, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('closeTeacherTestDetailsModal called');
    const modal = document.getElementById('teacherTestDetailsModal');
    if (modal) {
        console.log('Modal found, removing it');
        modal.remove();
        console.log('Modal removed successfully');
    } else {
        console.log('Modal not found to close');
    }
}



// Remove individual class assignment
async function removeClassAssignment(testType, testId, assignmentId, testName, grade, className) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in removeClassAssignment, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Remove class assignment called with:', { testType, testId, assignmentId, testName, grade, className });
    
    try {
        // Professional confirmation dialog
        if (!confirm(`Hide Test Confirmation

Test: ${testName}
Class: Grade ${grade}, Class ${className}

This will hide this test from students in this class. The test will no longer be visible to students, but all data will be preserved.

Are you sure you want to proceed?

Click "OK" to hide the test or "Cancel" to keep it visible.`)) {
            return;
        }
        
        // Proceed with individual assignment removal
        const response = await fetch('/.netlify/functions/remove-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacher_id: teacherId,
                assignment_id: assignmentId,
                test_type: testType,
                test_id: testId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Disable the button immediately to prevent redundant clicks
            const button = event.target;
            if (button) {
                button.disabled = true;
                button.textContent = 'Test Hidden';
                button.classList.add('btn-secondary');
                button.classList.remove('btn-warning', 'hide-test-btn');
            }
            
            alert(`Test hidden successfully.

Test: ${testName}
Class: Grade ${grade}, Class ${className}

Students in this class can no longer see this test. All data has been preserved.`);
            // Refresh the active tests display
            await loadTeacherActiveTests();
        } else {
            alert('Error removing assignment: ' + (result.error || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error removing assignment:', error);
        alert('Error removing assignment. Please try again. Error: ' + error.message);
    }
}

// Edit teacher function
function editTeacher(teacherId) {
    // Check if user session is still valid using JWT
    const currentTeacherId = getCurrentTeacherId();
    if (!currentTeacherId) {
        console.error('No valid teacher session found in editTeacher, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Placeholder for editing teacher
    console.log('Edit teacher:', teacherId);
    alert('Edit teacher functionality - to be implemented');
}

// Menu toggle function - REMOVED DUPLICATE














// Mark test as completed in the UI without page reload
function markTestCompletedInUI(testType, testId) {
    // Check if user session is still valid using JWT
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in markTestCompletedInUI, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log(`🎯 Marking test ${testType}_${testId} as completed in UI...`);
    
    // Find the test item in the active tests section
    const testItem = document.querySelector(`[data-test-id="${testId}"][data-test-type="${testType}"]`);
    
    if (testItem) {
        // Add completed class
        testItem.classList.add('completed');
        
        // Add completed badge
        const completedBadge = document.createElement('div');
        completedBadge.className = 'completed-badge';
        completedBadge.textContent = 'Completed';
        testItem.appendChild(completedBadge);
        
        // Add completed status text
        const completedStatus = document.createElement('div');
        completedStatus.className = 'completed-status';
        completedStatus.textContent = 'Test completed successfully';
        testItem.appendChild(completedStatus);
        
        // Hide action buttons
        const startBtn = testItem.querySelector('.start-test-btn');
        const viewDetailsBtn = testItem.querySelector('.view-details-btn');
        const testActions = testItem.querySelector('.test-actions');
        
        if (startBtn) startBtn.style.display = 'none';
        if (viewDetailsBtn) viewDetailsBtn.style.display = 'none';
        if (testActions) testActions.style.display = 'none';
        
        console.log(`✅ Test ${testType}_${testId} marked as completed in UI`);
    } else {
        console.warn(`⚠️ Test item not found for ${testType}_${testId}`);
    }
}

// ===== DEBUGGING TOOLS =====
// These functions can be called from the browser console for debugging

/**
 * Debug tool: Check all test questions for a specific test
 * Usage: debugTestQuestions('true_false', 11) or debugTestQuestions('multiple_choice', 1)
 */
window.debugTestQuestions = async function(testType, testId) {
    console.log(`🔧 DEBUG: Checking ${testType} test ID ${testId}`);
    
    try {
        const response = await fetch(`/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Test info:', data.test_info);
            console.log('📝 Questions:', data.questions);
            console.log('🔢 Questions count:', data.questions.length);
            
            // Analyze each question
            data.questions.forEach((question, index) => {
                console.log(`\n--- Question ${index + 1} ---`);
                console.log('Question ID:', question.question_id);
                console.log('Question text:', question.question);
                console.log('Correct answer:', question.correct_answer);
                console.log('Correct answer type:', typeof question.correct_answer);
                console.log('All question keys:', Object.keys(question));
                console.log('Full question object:', question);
            });
            
            // Check for common issues
            console.log('\n🔍 COMMON ISSUES CHECK:');
            
            // Check if correct_answer field exists
            const hasCorrectAnswer = data.questions.every(q => 'correct_answer' in q);
            console.log('✅ All questions have correct_answer field:', hasCorrectAnswer);
            
            // Check data types
            const answerTypes = [...new Set(data.questions.map(q => typeof q.correct_answer))];
            console.log('📊 Correct answer data types:', answerTypes);
            
            // Check for null/undefined values
            const hasNullAnswers = data.questions.some(q => q.correct_answer === null || q.correct_answer === undefined);
            console.log('❌ Has null/undefined answers:', hasNullAnswers);
            
            // Check question_id consistency
            const questionIds = data.questions.map(q => q.question_id);
            const uniqueIds = [...new Set(questionIds)];
            console.log('🆔 Question IDs:', questionIds);
            console.log('🆔 Unique question IDs:', uniqueIds);
            console.log('🔄 Question ID consistency:', questionIds.length === uniqueIds.length);
            
        } else {
            console.error('❌ Failed to get test questions:', data);
        }
    } catch (error) {
        console.error('❌ Error debugging test questions:', error);
    }
};

/**
 * Debug tool: Check all active tests for a student
 * Usage: debugStudentTests('51035')
 */
window.debugStudentTests = async function(studentId) {
    console.log(`🔧 DEBUG: Checking active tests for student ${studentId}`);
    
    try {
        const response = await fetch(`/.netlify/functions/get-student-active-tests?student_id=${studentId}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Student tests:', data.tests);
            console.log('🔢 Tests count:', data.tests.length);
            
            // Check each test
            data.tests.forEach((test, index) => {
                console.log(`\n--- Test ${index + 1} ---`);
                console.log('Test ID:', test.test_id);
                console.log('Test type:', test.test_type);
                console.log('Test name:', test.test_name);
                console.log('Questions count:', test.num_questions);
                console.log('All test keys:', Object.keys(test));
            });
            
        } else {
            console.error('❌ Failed to get student tests:', data);
        }
    } catch (error) {
        console.error('❌ Error debugging student tests:', error);
    }
};
/**
 * Debug tool: Check test completion status
 * Usage: debugTestCompletion('true_false', 11, '51035')
 */
window.debugTestCompletion = async function(testType, testId, studentId) {
    console.log(`🔧 DEBUG: Checking completion for ${testType} test ${testId} for student ${studentId}`);
    
    try {
        const response = await fetch(`/.netlify/functions/check-test-completion?test_type=${testType}&test_id=${testId}&student_id=${studentId}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Completion status:', data);
            console.log('Is completed:', data.isCompleted);
            console.log('Test type:', data.test_type);
            console.log('Test ID:', data.test_id);
            console.log('Student ID:', data.student_id);
        } else {
            console.error('❌ Failed to check completion:', data);
        }
    } catch (error) {
            console.error('❌ Error checking completion:', error);
    }
};

/**
 * Debug tool: Check local storage for test progress
 * Usage: debugLocalStorage('true_false', 11)
 */
window.debugLocalStorage = function(testType, testId) {
    console.log(`🔧 DEBUG: Checking local storage for ${testType} test ${testId}`);
    
    // Check test progress
    const progressKey = `test_progress_${testType}_${testId}`;
    const progress = localStorage.getItem(progressKey);
    console.log('📝 Progress key:', progressKey);
    console.log('📝 Progress data:', progress);
    if (progress) {
        console.log('📝 Parsed progress:', JSON.parse(progress));
    }
    
    // Check completion status
    const completionKey = `test_completed_${testType}_${testId}`;
    const completion = localStorage.getItem(completionKey);
    console.log('✅ Completion key:', completionKey);
    console.log('✅ Completion data:', completion);
    
    // Check user session
    const userSession = localStorage.getItem('user_session');
    console.log('👤 User session:', userSession);
    if (userSession) {
        console.log('👤 Parsed session:', JSON.parse(userSession));
    }
};

/**
 * Debug tool: Check all local storage keys
 * Usage: debugAllLocalStorage()
 */
window.debugAllLocalStorage = function() {
    console.log('🔧 DEBUG: All local storage keys');
    
    const keys = Object.keys(localStorage);
    console.log('🔑 Total keys:', keys.length);
    
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`\n--- ${key} ---`);
        console.log('Value:', value);
        if (value && (value.startsWith('{') || value.startsWith('['))) {
            try {
                console.log('Parsed:', JSON.parse(value));
            } catch (e) {
                console.log('Could not parse as JSON');
            }
        }
    });
};

/**
 * Debug tool: Clear all test-related local storage
 * Usage: clearTestLocalStorage()
 */
window.clearTestLocalStorage = function() {
    console.log('🔧 DEBUG: Clearing test-related local storage (preserving critical keys)');
    
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
        // ONLY clear problematic keys, preserve critical ones
        if (key.startsWith('test_progress_') || key.startsWith('form_data_')) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log('🗑️ Cleared:', key);
        } else if (key.includes('test_') || key.includes('form_data_')) {
            console.log('🛡️ Preserved critical key:', key);
        }
    });
    
    console.log(`✅ Cleared ${clearedCount} test-related items (preserved critical functionality)`);
};

        console.log('🔧 DEBUG: Debugging tools loaded! Available functions:');
        console.log('- debugTestQuestions(testType, testId) - Check test questions data');
        console.log('- debugStudentTests(studentId) - Check student active tests');
        console.log('- debugTestCompletion(testType, testId, studentId) - Check completion status');
        console.log('- debugLocalStorage(testType, testId) - Check local storage for specific test');
        console.log('- debugAllLocalStorage() - Check all local storage');
        console.log('- clearTestLocalStorage() - Clear all test-related local storage');
        
        // Auto-debug the current test if we're in test view
        if (window.location.hash.includes('test')) {
            console.log('🔧 Auto-debugging current test...');
            // Try to extract test info from the current page
            const testType = document.querySelector('[data-test-type]')?.dataset.testType;
            const testId = document.querySelector('[data-test-id]')?.dataset.testId;
            if (testType && testId) {
                console.log(`🔧 Found test: ${testType} ID ${testId}`);
                setTimeout(() => debugTestQuestions(testType, testId), 1000);
            }
        }


// ===== HELPER FUNCTIONS FOR FORM RESTORATION =====

/**
 * Wait for all required form elements to be ready before restoring data
 * @param {string} formType - 'multipleChoice', 'trueFalse', or 'input'
 * @param {object} formData - The form data to restore
 * @param {function} callback - Function to call when elements are ready
 */
function waitForElements(formType, formData, callback) {
    console.log(`🔍 waitForElements called for ${formType} form`);
    
    const maxAttempts = 50; // Maximum attempts (5 seconds with 100ms intervals)
    let attempts = 0;
    
    const checkElements = () => {
        attempts++;
        console.log(`🔍 Checking elements (attempt ${attempts}/${maxAttempts})`);
        
        let allElementsReady = false;
        
        switch (formType) {
            case 'multipleChoice':
                allElementsReady = checkMultipleChoiceElements(formData);
                break;
            case 'trueFalse':
                allElementsReady = checkTrueFalseElements(formData);
                break;
            case 'input':
                allElementsReady = checkInputElements(formData);
                break;
        }
        
        if (allElementsReady) {
            console.log(`✅ All ${formType} elements are ready!`);
            callback();
        } else if (attempts >= maxAttempts) {
            console.error(`❌ Timeout waiting for ${formType} elements after ${maxAttempts} attempts`);
            // Still try to restore data even if timeout
            callback();
        } else {
            // Try again in 100ms
            setTimeout(checkElements, 100);
        }
    };
    
    // Start checking
    checkElements();
}

/**
 * Check if all multiple choice form elements are ready
 */
function checkMultipleChoiceElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    const numOptions = parseInt(formData.numOptions);
    
    // Check if container exists
    const container = document.getElementById('mcQuestionsContainer');
    if (!container) {
        console.log('❌ mcQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`mc_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if all option elements exist
        for (let j = 0; j < numOptions; j++) {
            const optionLetter = String.fromCharCode(65 + j); // A, B, C, etc.
            const optionEl = document.getElementById(`mc_option_${i}_${optionLetter}`);
            if (!optionEl) {
                console.log(`❌ Option element ${i}_${optionLetter} not found`);
                return false;
            }
        }
        
        // Check if correct answer select exists
        const correctEl = document.getElementById(`mc_correct_${i}`);
        if (!correctEl) {
            console.log(`❌ Correct answer element ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} multiple choice questions with ${numOptions} options are ready`);
    return true;
}

/**
 * Check if all true/false form elements are ready
 */
function checkTrueFalseElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    
    // Check if container exists
    const container = document.getElementById('tfQuestionsContainer');
    if (!container) {
        console.log('❌ tfQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`tf_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if correct answer select exists
        const correctEl = document.getElementById(`tf_correct_${i}`);
        if (!correctEl) {
            console.log(`❌ Correct answer element ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} true/false questions are ready`);
    return true;
}

/**
 * Check if all input form elements are ready
 */
function checkInputElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    
    // Check if container exists
    const container = document.getElementById('inputQuestionsContainer');
    if (!container) {
        console.log('❌ inputQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`input_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if answers container exists
        const answersContainer = document.getElementById(`answers_container_${i}`);
        if (!answersContainer) {
            console.log(`❌ Answers container ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} input questions are ready`);
    return true;
}

/**
 * Restore multiple choice form data
 */
function restoreMultipleChoiceData(formData) {
    console.log('🔍 restoreMultipleChoiceData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`mc_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore options
        if (qData.options) {
            Object.keys(qData.options).forEach(optionKey => {
                const optionEl = document.getElementById(`mc_option_${questionNum}_${optionKey}`);
                if (optionEl) {
                    optionEl.value = qData.options[optionKey];
                    console.log(`✅ Set option ${questionNum}_${optionKey} to:`, qData.options[optionKey]);
                }
            });
        }
        
        // Restore correct answer
        const correctEl = document.getElementById(`mc_correct_${questionNum}`);
        if (correctEl && qData.correctAnswer) {
            correctEl.value = qData.correctAnswer;
            console.log(`✅ Set correct answer for question ${questionNum} to:`, qData.correctAnswer);
        }
    });
    
    console.log('✅ Finished restoring multiple choice data');
}

/**
 * Restore true/false form data
 */
function restoreTrueFalseData(formData) {
    console.log('🔍 restoreTrueFalseData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`tf_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore correct answer (select)
        const correctEl = document.getElementById(`tf_correct_${questionNum}`);
        if (correctEl && qData.correctAnswer) {
            correctEl.value = qData.correctAnswer;
            console.log(`✅ Set correct answer for question ${questionNum} to:`, qData.correctAnswer);
        }
    });
    
    console.log('✅ Finished restoring true/false data');
}

/**
 * Restore input form data
 */
function restoreInputData(formData) {
    console.log('🔍 restoreInputData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`input_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore answers
        if (qData.answers && qData.answers.length > 0) {
            const answersContainer = document.getElementById(`answers_container_${questionNum}`);
            if (answersContainer) {
                // Remove the default single answer input
                answersContainer.innerHTML = '';
                
                // Create answer inputs for each stored answer
                qData.answers.forEach((answer, answerIndex) => {
                    const answerGroup = document.createElement('div');
                    answerGroup.className = 'answer-input-group';
                    answerGroup.innerHTML = `
                        <input type="text" placeholder="Correct answer ${answerIndex + 1}" class="answer-input" data-question-id="${questionNum}" data-answer-index="${answerIndex}" value="${answer}">
                        <button type="button" class="btn btn-sm btn-outline-danger remove-answer-btn">- Remove</button>
                    `;
                    answersContainer.appendChild(answerGroup);
                });
                
                // Add the "Add Answer" button at the end
                const addButton = document.createElement('div');
                addButton.className = 'answer-input-group';
                addButton.innerHTML = `
                    <button type="button" class="btn btn-sm btn-outline-primary add-answer-btn">+ Add Answer</button>
                `;
                answersContainer.appendChild(addButton);
                
                console.log(`✅ Restored ${qData.answers.length} answers for question ${questionNum}`);
            }
        }
    });
    
    console.log('✅ Finished restoring input data');
}

// ===== ADMIN CABINET FUNCTIONS =====

// Admin Cabinet Functions
function toggleSection(sectionId) {
  console.log(`🔧 toggleSection called with sectionId: ${sectionId}`);
  
  const section = document.getElementById(sectionId);
  if (!section) {
    console.error(`❌ Section with id '${sectionId}' not found!`);
    return;
  }
  
  const header = section.previousElementSibling;
  if (!header || !header.classList.contains('section-header')) {
    console.error(`❌ Header not found for section '${sectionId}'!`);
    return;
  }
  
  const content = section;
  
  const wasCollapsed = content.classList.contains('collapsed');
  console.log(`🔧 Current state - collapsed: ${wasCollapsed}`);
  console.log(`🔧 Current classes: ${content.className}`);
  
  // Toggle the collapsed state - click to expand, click again to collapse
  if (wasCollapsed) {
    // Currently collapsed, so expand it
    content.classList.remove('collapsed');
    header.classList.remove('collapsed');
    console.log(`✅ Section ${sectionId} expanded`);
    console.log(`🔧 Classes after expand: ${content.className}`);
  } else {
    // Currently expanded, so collapse it
    content.classList.add('collapsed');
    header.classList.add('collapsed');
    console.log(`✅ Section ${sectionId} collapsed`);
    console.log(`🔧 Classes after collapse: ${content.className}`);
  }
  
  const isNowCollapsed = content.classList.contains('collapsed');
  console.log(`🔧 New state - collapsed: ${isNowCollapsed}`);
  
  // Force a reflow to ensure CSS changes take effect
  content.offsetHeight;
  
  // Verify the visual state
  const computedStyle = window.getComputedStyle(content);
  console.log(`🔧 Computed max-height: ${computedStyle.maxHeight}`);
  console.log(`🔧 Computed opacity: ${computedStyle.opacity}`);
}

// Add keyboard accessibility
function addKeyboardAccessibility() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const sectionId = this.nextElementSibling.id;
        toggleSection(sectionId);
      }
    });
    
    // Add tabindex for keyboard navigation
    header.setAttribute('tabindex', '0');
  });
}

// Test function to verify toggleSection is accessible
function testToggleSection() {
  console.log('🧪 Testing toggleSection function...');
  console.log('🧪 toggleSection function exists:', typeof toggleSection);
  console.log('🧪 Available sections:', document.querySelectorAll('.section-content').length);
  
  // Test with first section
  const firstSection = document.querySelector('.section-content');
  if (firstSection) {
    console.log('🧪 First section id:', firstSection.id);
    console.log('🧪 First section classes:', firstSection.className);
    
    // Test direct function call
    console.log('🧪 Testing direct toggleSection call...');
    try {
      toggleSection(firstSection.id);
      console.log('✅ Direct call successful!');
      
      // Test the reverse toggle
      setTimeout(() => {
        console.log('🧪 Testing reverse toggle...');
        toggleSection(firstSection.id);
        console.log('✅ Reverse toggle successful!');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Direct call failed:', error);
    }
  }
}

// Test all section toggles
function testAllToggles() {
  console.log('🧪 Testing all section toggles...');
  
  const sections = document.querySelectorAll('.section-content');
  sections.forEach((section, index) => {
    console.log(`🧪 Testing section ${index + 1}: ${section.id}`);
    
    // Collapse all sections first
    section.classList.add('collapsed');
    section.previousElementSibling.classList.add('collapsed');
    
    setTimeout(() => {
      // Then expand them
      section.classList.remove('collapsed');
      section.previousElementSibling.classList.remove('collapsed');
      console.log(`✅ Section ${section.id} expanded`);
    }, index * 200);
  });
}
// Manual toggle test for debugging
function manualToggleTest() {
  console.log('🧪 Manual toggle test...');
  
  const firstSection = document.querySelector('.section-content');
  if (firstSection) {
    const sectionId = firstSection.id;
    console.log(`🧪 Testing manual toggle for: ${sectionId}`);
    
    // Check current state
    const isCollapsed = firstSection.classList.contains('collapsed');
    console.log(`🧪 Current state - collapsed: ${isCollapsed}`);
    
    // Toggle manually
    if (isCollapsed) {
      firstSection.classList.remove('collapsed');
      firstSection.previousElementSibling.classList.remove('collapsed');
      console.log(`✅ Manually expanded: ${sectionId}`);
    } else {
      firstSection.classList.add('collapsed');
      firstSection.previousElementSibling.classList.add('collapsed');
      console.log(`✅ Manually collapsed: ${sectionId}`);
    }
    
    // Verify new state
    const newState = firstSection.classList.contains('collapsed');
    console.log(`🧪 New state - collapsed: ${newState}`);
    console.log(`🧪 Current classes: ${firstSection.className}`);
  }
}

// Make functions globally available
window.testAllToggles = testAllToggles;
window.testToggleSection = testToggleSection;
window.toggleSection = toggleSection;
window.manualToggleTest = manualToggleTest;
window.toggleUsersContent = toggleUsersContent;
window.toggleTeachersContent = toggleTeachersContent;
window.toggleSubjectsContent = toggleSubjectsContent;
window.toggleTestsContent = toggleTestsContent;
window.toggleAssignmentsContent = toggleAssignmentsContent;
window.toggleResultsContent = toggleResultsContent;
window.getAllTests = getAllTests;
window.getTestAssignments = getTestAssignments;
window.getTestResults = getTestResults;

// Add click event listeners as backup
function addClickListeners() {
  console.log('🔧 Adding click listeners to section headers...');
  
  const headers = document.querySelectorAll('.section-header');
  console.log(`🔧 Found ${headers.length} section headers`);
  
  headers.forEach((header, index) => {
    const headerText = header.textContent.trim();
    console.log(`🔧 Processing header ${index + 1}:`, headerText);
    
    // Remove existing onclick to avoid conflicts
    const oldOnclick = header.getAttribute('onclick');
    if (oldOnclick) {
      console.log(`🔧 Removed old onclick: ${oldOnclick}`);
    }
    header.removeAttribute('onclick');
    
    // Add event listener
    header.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔧 Click event triggered for header: ${headerText}`);
      
      const sectionId = this.nextElementSibling.id;
      console.log(`🔧 Section ID: ${sectionId}`);
      
      // Add visual feedback
      this.style.background = 'rgba(255, 255, 255, 0.2)';
      setTimeout(() => {
        this.style.background = '';
      }, 200);
      
      toggleSection(sectionId);
    });
    
    // Add visual feedback
    header.style.cursor = 'pointer';
    header.style.position = 'relative';
    header.style.zIndex = '100';
    
    console.log(`✅ Added click listener to header: ${headerText}`);
  });
}

// Initialize keyboard accessibility when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add keyboard accessibility after a short delay to ensure all elements are loaded
  setTimeout(addKeyboardAccessibility, 100);
  
  // Test and add click listeners for admin panel
  setTimeout(() => {
    if (document.getElementById('admin-panel')) {
      console.log('🔧 Admin panel detected, setting up section toggles...');
      testToggleSection();
      addClickListeners();
    }
  }, 200);
});

// Show/Hide Form Functions
function showAddUserForm() {
  document.getElementById('addUserForm').style.display = 'block';
}

function hideAddUserForm() {
  document.getElementById('addUserForm').style.display = 'none';
  document.getElementById('newUserForm').reset();
}

function showAddTeacherForm() {
  document.getElementById('addTeacherForm').style.display = 'block';
}

function hideAddTeacherForm() {
  document.getElementById('addTeacherForm').style.display = 'none';
  document.getElementById('newTeacherForm').reset();
}

function showAddSubjectForm() {
  document.getElementById('addSubjectForm').style.display = 'block';
}

function hideAddSubjectForm() {
  document.getElementById('addSubjectForm').style.display = 'none';
  document.getElementById('newSubjectForm').reset();
}

// Toggle content visibility functions
function toggleUsersContent() {
  const container = document.getElementById('allUsersContainer');
  const button = document.querySelector('button[onclick="toggleUsersContent()"]');
  
  if (!container) {
    console.error('❌ allUsersContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getAllUsers();
    button.textContent = 'Hide Users ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get All Users ▶';
    button.classList.remove('active');
  }
}

function toggleTeachersContent() {
  const container = document.getElementById('allTeachersContainer');
  const button = document.querySelector('button[onclick="toggleTeachersContent()"]');
  
  if (!container) {
    console.error('❌ allTeachersContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getAllTeachers();
    button.textContent = 'Hide Teachers ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get All Teachers ▶';
    button.classList.remove('active');
  }
}

function toggleSubjectsContent() {
  const container = document.getElementById('allSubjectsContainer');
  const button = document.querySelector('button[onclick="toggleSubjectsContent()"]');
  
  if (!container) {
    console.error('❌ allSubjectsContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getAllSubjects();
    button.textContent = 'Hide Subjects ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get All Subjects ▶';
    button.classList.remove('active');
  }
}

function toggleTestsContent() {
  console.log('🔧 toggleTestsContent called');
  const container = document.getElementById('testsContainer');
  const button = document.querySelector('button[onclick="toggleTestsContent()"]');
  
  console.log('🔧 Container found:', container);
  console.log('🔧 Button found:', button);
  
  if (!container) {
    console.error('❌ testsContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getAllTests();
    button.textContent = 'Hide Tests ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get All Tests ▶';
    button.classList.remove('active');
  }
}

function toggleAssignmentsContent() {
  console.log('🔧 toggleAssignmentsContent called');
  const container = document.getElementById('assignmentsContainer');
  const button = document.querySelector('button[onclick="toggleAssignmentsContent()"]');
  
  console.log('🔧 Container found:', container);
  console.log('🔧 Button found:', button);
  
  if (!container) {
    console.error('❌ assignmentsContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getTestAssignments();
    button.textContent = 'Hide Assignments ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get Test Assignments ▶';
    button.classList.remove('active');
  }
}
function toggleResultsContent() {
  console.log('🔧 toggleResultsContent called');
  const container = document.getElementById('resultsContainer');
  const button = document.querySelector('button[onclick="toggleResultsContent()"]');
  
  console.log('🔧 Container found:', container);
  console.log('🔧 Button found:', button);
  
  if (!container) {
    console.error('❌ resultsContainer not found');
    return;
  }
  
  if (!button) {
    console.error('❌ Button not found');
    return;
  }
  
  if (container.style.display === 'none' || container.style.display === '') {
    // Show content
    getTestResults();
    button.textContent = 'Hide Results ▼';
    button.classList.add('active');
  } else {
    // Hide content
    container.style.display = 'none';
    button.textContent = 'Get Test Results ▶';
    button.classList.remove('active');
  }
}

// Enhanced User Management Functions
async function getAllUsers() {
  try {
    const response = await fetch('/.netlify/functions/get-all-users');
    const data = await response.json();
    
    if (data.success) {
      displayUsersTable(data.users);
    } else {
      console.error('Failed to get users:', data.message);
      // Fallback to sample data for testing
      showSampleUsers();
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback to sample data for testing
    showSampleUsers();
  }
}

// Temporary function to show sample data while backend is being developed
function showSampleUsers() {
  const sampleUsers = [
    {
      id: 1,
      grade: 'M1',
      class: '1/15',
      number: 1,
      student_id: '51706',
      name: 'Kittikhun',
      surname: 'Siriwadtanakojaroen',
      nickname: 'Tong Tong',
      password: '51706'
    },
    {
      id: 2,
      grade: 'M1',
      class: '1/15',
      number: 2,
      student_id: '51707',
      name: 'Jittiphat',
      surname: 'Suksamai',
      nickname: 'Idea',
      password: '51707'
    },
    {
      id: 3,
      grade: 'M1',
      class: '1/15',
      number: 3,
      student_id: '51708',
      name: 'Jiraphon',
      surname: 'Sawanakasem',
      nickname: 'Tun',
      password: '51708'
    }
  ];
  
  displayUsersTable(sampleUsers);
  console.log('Showing sample users data');
}

function displayUsersTable(users) {
  const container = document.getElementById('allUsersContainer');
  
  if (!users || users.length === 0) {
    container.innerHTML = '<p>No users found.</p>';
    return;
  }
  
  // Debug: Log the first user to see what fields are available
  console.log('First user data:', users[0]);
  console.log('User fields:', Object.keys(users[0]));
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Grade</th>
          <th>Class</th>
          <th>Number</th>
          <th>Student ID</th>
          <th>Name</th>
          <th>Surname</th>
          <th>Nickname</th>
          <th>Password</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  users.forEach(user => {
    // Debug: Log the user object to see what fields are available
    console.log('🔧 User object:', user);
    console.log('🔧 User password field:', user.password);
    console.log('🔧 User pwd field:', user.pwd);
    console.log('🔧 All user fields:', Object.keys(user));
    
    // Handle undefined password field - show "Not Set" if undefined
    const passwordDisplay = user.password || user.pwd || 'Not Set';
    
    html += `
      <tr data-user-id="${user.id}">
        <td>${user.id}</td>
        <td><span class="editable-field" data-field="grade">${user.grade || ''}</span></td>
        <td><span class="editable-field" data-field="class">${user.class || ''}</span></td>
        <td><span class="editable-field" data-field="number">${user.number || ''}</span></td>
        <td><span class="editable-field" data-field="student_id">${user.student_id || ''}</span></td>
        <td><span class="editable-field" data-field="name">${user.name || ''}</span></td>
        <td><span class="editable-field" data-field="surname">${user.surname || ''}</span></td>
        <td><span class="editable-field" data-field="nickname">${user.nickname || ''}</span></td>
        <td><span class="editable-field" data-field="password">${passwordDisplay}</span></td>
        <td class="action-buttons">
          <button class="btn-edit" onclick="editUserRow(${user.id})">Edit</button>
          <button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  
  // Make sure container is visible
  container.style.display = 'block';
  
  // Add event listeners for editable fields
  addEditableFieldListeners();
}

// Enhanced Teacher Management Functions
async function getAllTeachers() {
  try {
    const response = await fetch('/.netlify/functions/get-all-teachers');
    const data = await response.json();
    
    if (data.success) {
      displayTeachersTable(data.teachers);
    } else {
      console.error('Failed to get teachers:', data.message);
      // Fallback to sample data for testing
      showSampleTeachers();
    }
  } catch (error) {
    console.error('Error fetching teachers:', error);
    // Fallback to sample data for testing
    showSampleTeachers();
  }
}

// Temporary function to show sample data while backend is being developed
function showSampleTeachers() {
  const sampleTeachers = [
    {
      teacher_id: 'Aleksandr_Petrov',
      username: 'Alex',
      password: '465'
    },
    {
      teacher_id: 'Charlie_Viernes',
      username: 'Charlie',
      password: '465'
    }
  ];
  
  displayTeachersTable(sampleTeachers);
  console.log('Showing sample teachers data');
}

function displayTeachersTable(teachers) {
  const container = document.getElementById('allTeachersContainer');
  
  if (!teachers || teachers.length === 0) {
    container.innerHTML = '<p>No teachers found.</p>';
    return;
  }
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>Teacher ID</th>
          <th>Username</th>
          <th>Password</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  teachers.forEach(teacher => {
    html += `
      <tr data-teacher-id="${teacher.teacher_id}">
        <td><span class="editable-field" data-field="teacher_id">${teacher.teacher_id}</span></td>
        <td><span class="editable-field" data-field="username">${teacher.username}</span></td>
        <td><span class="editable-field" data-field="password">${teacher.password}</span></td>
        <td class="action-buttons">
          <button class="btn-edit" onclick="editTeacherRow('${teacher.teacher_id}')">Edit</button>
          <button class="btn-delete" onclick="deleteTeacher('${teacher.teacher_id}')">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  
  // Make sure container is visible
  container.style.display = 'block';
  
  // Add event listeners for editable fields
  addEditableFieldListeners();
}

// Editable Table Functions
function editUserRow(userId) {
  // This function is called when the Edit button is clicked
  // It will make the entire row editable
  const row = document.querySelector(`tr[data-user-id="${userId}"]`);
  if (row) {
    // Find all editable fields in this row
    const editableFields = row.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
      makeFieldEditable(field);
    });
  }
}

function editTeacherRow(teacherId) {
  // This function is called when the Edit button is clicked for teachers
  const row = document.querySelector(`tr[data-teacher-id="${teacherId}"]`);
  if (row) {
    const editableFields = row.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
      makeFieldEditable(field);
    });
  }
}

function editSubjectRow(subjectId) {
  console.log('🔧 editSubjectRow called with subjectId:', subjectId);
  // This function is called when the Edit button is clicked for subjects
  const row = document.querySelector(`tr[data-subject-id="${subjectId}"]`);
  if (row) {
    const editableFields = row.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
      makeFieldEditable(field);
    });
  } else {
    console.error('❌ Row not found for subjectId:', subjectId);
  }
}

function addEditableFieldListeners() {
  document.querySelectorAll('.editable-field').forEach(field => {
    field.addEventListener('dblclick', function() {
      makeFieldEditable(this);
    });
  });
}

function makeFieldEditable(fieldElement) {
  const currentValue = fieldElement.textContent;
  const fieldName = fieldElement.dataset.field;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentValue;
  input.className = 'editable-input';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'btn-save';
  saveBtn.onclick = () => saveField(fieldElement, input, saveBtn, cancelBtn);
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'btn-cancel';
  cancelBtn.onclick = () => cancelEdit(fieldElement, currentValue, input, saveBtn, cancelBtn);
  
  fieldElement.innerHTML = '';
  fieldElement.appendChild(input);
  fieldElement.appendChild(saveBtn);
  fieldElement.appendChild(cancelBtn);
  
  input.focus();
}

function saveField(fieldElement, input, saveBtn, cancelBtn) {
  const newValue = input.value;
  const fieldName = fieldElement.dataset.field;
  const row = fieldElement.closest('tr');
  
  if (row.dataset.userId) {
    updateUserField(row.dataset.userId, fieldName, newValue, fieldElement);
  } else if (row.dataset.teacherId) {
    updateTeacherField(row.dataset.teacherId, fieldName, newValue, fieldElement);
  }
  
  // Clean up
  saveBtn.remove();
  cancelBtn.remove();
  input.remove();
  fieldElement.textContent = newValue;
}

function cancelEdit(fieldElement, originalValue, input, saveBtn, cancelBtn) {
  saveBtn.remove();
  cancelBtn.remove();
  input.remove();
  fieldElement.textContent = originalValue;
}

// Update Functions
async function updateUserField(userId, fieldName, newValue, fieldElement) {
  try {
    const response = await fetch('/.netlify/functions/update-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        field: fieldName,
        value: newValue
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('User updated successfully!', 'success');
    } else {
      showNotification('Failed to update user: ' + data.message, 'error');
      // Revert the change
      fieldElement.textContent = fieldElement.dataset.originalValue || newValue;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    showNotification('Error updating user', 'error');
  }
}

async function updateTeacherField(teacherId, fieldName, newValue, fieldElement) {
  try {
    const response = await fetch('/.netlify/functions/update-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        field: fieldName,
        value: newValue
      })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Teacher updated successfully!', 'success');
    } else {
      showNotification('Failed to update teacher: ' + data.message, 'error');
      // Revert the change
      fieldElement.textContent = fieldElement.dataset.originalValue || newValue;
    }
  } catch (error) {
    console.error('Error updating teacher:', error);
    showNotification('Error updating teacher', 'error');
  }
}

// Delete Functions
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetch('/.netlify/functions/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('User deleted successfully!', 'success');
      getAllUsers(); // Refresh the table
    } else {
      showNotification('Failed to delete user: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Error deleting user', 'error');
  }
}

async function deleteTeacher(teacherId) {
  if (!confirm('Are you sure you want to delete this teacher?')) {
    return;
  }
  
  try {
    const response = await fetch('/.netlify/functions/delete-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teacher_id: teacherId })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Teacher deleted successfully!', 'success');
      getAllTeachers(); // Refresh the table
    } else {
      showNotification('Failed to delete teacher: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting teacher:', error);
    showNotification('Error deleting teacher', 'error');
  }
}

async function deleteSubject(subjectId) {
  if (!confirm('Are you sure you want to delete this subject?')) {
    return;
  }
  
  try {
    const response = await fetch('/.netlify/functions/delete-subject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject_id: subjectId })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Subject deleted successfully!', 'success');
      getAllSubjects(); // Refresh the table
    } else {
      showNotification('Failed to delete subject: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error deleting subject:', error);
    showNotification('Error deleting subject', 'error');
  }
}

// Add New User/Teacher/Subject Functions
document.addEventListener('DOMContentLoaded', function() {
  // Add form submit listeners
  const newUserForm = document.getElementById('newUserForm');
  if (newUserForm) {
    newUserForm.addEventListener('submit', handleAddUser);
  }
  
  const newTeacherForm = document.getElementById('newTeacherForm');
  if (newTeacherForm) {
    newTeacherForm.addEventListener('submit', handleAddTeacher);
  }
  
  const newSubjectForm = document.getElementById('newSubjectForm');
  if (newSubjectForm) {
    newSubjectForm.addEventListener('submit', handleAddSubject);
  }

  // Add deletion form submit listeners
  const assignmentForm = document.getElementById('assignmentDeletionFormElement');
  if (assignmentForm) {
    assignmentForm.addEventListener('submit', handleAssignmentDeletion);
  }
  
  const dataForm = document.getElementById('testDataDeletionFormElement');
  if (dataForm) {
    dataForm.addEventListener('submit', handleTestDataDeletion);
  }
  
  // Add teacher selection change handlers
  const assignmentTeacherSelect = document.getElementById('assignmentTeacherSelect');
  if (assignmentTeacherSelect) {
    assignmentTeacherSelect.addEventListener('change', (e) => {
      loadTeacherGradesClasses(e.target.value, 'assignmentGradesClassesContainer');
    });
  }
  
  const dataTeacherSelect = document.getElementById('dataTeacherSelect');
  if (dataTeacherSelect) {
    dataTeacherSelect.addEventListener('change', (e) => {
      loadTeacherGradesClasses(e.target.value, 'dataGradesClassesContainer');
    });
  }
  
  // Initialize deletion functionality
  initializeTestDeletion();
});
async function handleAddUser(event) {
  event.preventDefault();
  
  const formData = {
    grade: document.getElementById('newUserGrade').value,
    class: document.getElementById('newUserClass').value,
    number: parseInt(document.getElementById('newUserNumber').value),
    student_id: document.getElementById('newUserStudentId').value,
    name: document.getElementById('newUserName').value,
    surname: document.getElementById('newUserSurname').value,
    nickname: document.getElementById('newUserNickname').value,
    password: document.getElementById('newUserPassword').value
  };
  
  try {
    const response = await fetch('/.netlify/functions/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('User added successfully!', 'success');
      hideAddUserForm();
      getAllUsers(); // Refresh the table
    } else {
      showNotification('Failed to add user: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error adding user:', error);
    showNotification('Error adding user', 'error');
  }
}

async function handleAddTeacher(event) {
  event.preventDefault();
  
  const formData = {
    teacher_id: document.getElementById('newTeacherId').value,
    username: document.getElementById('newTeacherUsername').value,
    password: document.getElementById('newTeacherPassword').value
  };
  
  try {
    const response = await fetch('/.netlify/functions/add-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Teacher added successfully!', 'success');
      hideAddTeacherForm();
      getAllTeachers(); // Refresh the table
    } else {
      showNotification('Failed to add teacher: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error adding teacher:', error);
    showNotification('Error adding teacher', 'error');
  }
}

// Subject Management Functions
async function getAllSubjects() {
  try {
    const response = await fetch('/.netlify/functions/get-all-subjects');
    const data = await response.json();
    
    if (data.success) {
      displaySubjectsTable(data.subjects);
    } else {
      console.error('Failed to get subjects:', data.message);
      // Fallback to sample data for testing
      showSampleSubjects();
    }
  } catch (error) {
    console.error('Error fetching subjects:', error);
    // Fallback to sample data for testing
    showSampleSubjects();
  }
}

function displaySubjectsTable(subjects) {
  const container = document.getElementById('allSubjectsContainer');
  
  if (!subjects || subjects.length === 0) {
    container.innerHTML = '<p>No subjects found.</p>';
    return;
  }
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Subject Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  subjects.forEach(subject => {
    html += `
      <tr data-subject-id="${subject.subject_id}">
        <td>${subject.subject_id}</td>
        <td><span class="editable-field" data-field="subject">${subject.subject || ''}</span></td>
        <td class="action-buttons">
          <button class="btn-edit" onclick="editSubjectRow(${subject.subject_id})">Edit</button>
          <button class="btn-delete" onclick="deleteSubject(${subject.subject_id})">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  
  // Make sure container is visible
  container.style.display = 'block';
  
  // Add event listeners for editable fields
  addEditableFieldListeners();
}

// Temporary function to show sample data while backend is being developed
function showSampleSubjects() {
  const sampleSubjects = [
    { subject_id: 1, subject: 'Listening and Speaking' },
    { subject_id: 2, subject: 'English for career' },
    { subject_id: 3, subject: 'Tourism' },
    { subject_id: 4, subject: 'Reading and Writing' },
    { subject_id: 5, subject: 'Geography' },
    { subject_id: 6, subject: 'Grammar' },
    { subject_id: 7, subject: 'Health' },
    { subject_id: 8, subject: 'Science' },
    { subject_id: 9, subject: 'Biology' }
  ];
  
  displaySubjectsTable(sampleSubjects);
  console.log('Showing sample subjects data');
}

async function handleAddSubject(event) {
  event.preventDefault();
  
  const formData = {
    subject: document.getElementById('newSubjectName').value
  };
  
  try {
    const response = await fetch('/.netlify/functions/add-subject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Subject added successfully!', 'success');
      hideAddSubjectForm();
      getAllSubjects(); // Refresh the table
    } else {
      showNotification('Failed to add subject: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error adding subject:', error);
    showNotification('Error adding subject', 'error');
  }
}

// Test Management Functions
async function getAllTests() {
  try {
    console.log('🔧 Getting all tests...');
    const response = await fetch('/.netlify/functions/get-all-tests');
    const data = await response.json();
    
    if (data.success) {
      displayTestsTable(data.tests);
    } else {
      console.error('Failed to get tests:', data.message);
      showNotification('Failed to get tests: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching tests:', error);
    showNotification('Error fetching tests', 'error');
  }
}

async function getTestAssignments() {
  try {
    console.log('🔧 Getting test assignments...');
    const response = await fetch('/.netlify/functions/get-test-assignments');
    const data = await response.json();
    
    if (data.success) {
      displayTestAssignmentsTable(data.assignments);
    } else {
      console.error('Failed to get test assignments:', data.message);
      showNotification('Failed to get test assignments: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching test assignments:', error);
    showNotification('Error fetching test assignments', 'error');
  }
}

async function getTestResults() {
  try {
    console.log('🔧 Getting test results...');
    const response = await fetch('/.netlify/functions/get-test-results');
    const data = await response.json();
    
    if (data.success) {
      displayTestResultsTable(data.results);
    } else {
      console.error('Failed to get test results:', data.message);
      showNotification('Failed to get test results: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching test results:', error);
    showNotification('Error fetching test results', 'error');
  }
}
// Display functions for test data
function displayTestsTable(tests) {
  const container = document.getElementById('testsContainer');
  if (!container) {
    console.error('❌ testsContainer not found');
    return;
  }
  
  console.log('🔍 Displaying tests data:', tests);
  
  if (!tests || tests.length === 0) {
    container.innerHTML = `
      <div class="no-data-message">
        <h4>No Tests Found</h4>
        <p>There are currently no tests in the database.</p>
        <p><strong>To create tests:</strong></p>
        <ol>
          <li>Login as a teacher</li>
          <li>Go to Test Creation section</li>
          <li>Create multiple choice, true/false, or input tests</li>
          <li>Assign tests to specific grades and classes</li>
        </ol>
        <p><em>Note: Test results may exist even if the original test records have been removed.</em></p>
      </div>
    `;
    return;
  }
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Test Type</th>
          <th>Test Name</th>
          <th>Subject</th>
          <th>Questions</th>
          <th>Grade/Class</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  tests.forEach(test => {
    const gradeClass = test.grade && test.class ? `M${test.grade} ${test.grade}/${test.class}` : 'Not Assigned';
    const subjectDisplay = test.subject_name || test.subject || 'Not Assigned';
    const createdDate = test.created_at ? new Date(test.created_at).toLocaleDateString() : 'Unknown';
    
    html += `
      <tr>
        <td>${test.test_id}</td>
        <td><span class="test-type-badge ${test.test_type}">${test.test_type.replace('_', ' ')}</span></td>
        <td>${test.test_name || ''}</td>
        <td><strong>${subjectDisplay}</strong></td>
        <td>${test.num_questions || 0}</td>
        <td>${gradeClass}</td>
        <td>${createdDate}</td>
        <td class="action-buttons">
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  container.style.display = 'block';
}

function displayTestAssignmentsTable(assignments) {
  const container = document.getElementById('assignmentsContainer');
  if (!container) {
    console.error('❌ assignmentsContainer not found');
    return;
  }
  
  console.log('🔍 Displaying assignments data:', assignments);
  
  if (!assignments || assignments.length === 0) {
    container.innerHTML = `
      <div class="no-data-message">
        <h4>No Test Assignments Found</h4>
        <p>There are currently no test assignments in the database.</p>
        <p><strong>To assign tests:</strong></p>
        <ol>
          <li>Login as a teacher</li>
          <li>Create tests in the Test Creation section</li>
          <li>Assign tests to specific grades and classes</li>
          <li>Tests will then appear here with subject and grade/class information</li>
        </ol>
        <p><em>Note: Tests must be assigned to classes before students can take them.</em></p>
      </div>
    `;
    return;
  }
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>Assignment ID</th>
          <th>Test Type</th>
          <th>Test Name</th>
          <th>Subject</th>
          <th>Grade/Class</th>
          <th>Assigned Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  assignments.forEach(assignment => {
    const testTypeBadge = `<span class="test-type-badge ${assignment.test_type}">${assignment.test_type.replace('_', ' ')}</span>`;
    const gradeClass = `M${assignment.grade} ${assignment.grade}/${assignment.class}`;
    const subjectDisplay = assignment.subject_name || assignment.subject || 'Not Assigned';
    
    html += `
      <tr>
        <td>${assignment.assignment_id}</td>
        <td>${testTypeBadge}</td>
        <td><strong>${assignment.test_name || assignment.test_name_alt || 'Unknown Test'}</strong></td>
        <td>${subjectDisplay}</td>
        <td>${gradeClass}</td>
        <td>${new Date(assignment.assigned_at).toLocaleDateString()}</td>
        <td class="action-buttons">
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  container.style.display = 'block';
}

function displayTestResultsTable(results) {
  const container = document.getElementById('resultsContainer');
  if (!container) {
    console.error('❌ resultsContainer not found');
    return;
  }
  
  if (!results || results.length === 0) {
    container.innerHTML = '<p>No test results found.</p>';
    return;
  }
  
  let html = `
    <table class="editable-table compact-table">
      <thead>
        <tr>
          <th>Result ID</th>
          <th>Student</th>
          <th>Test</th>
          <th>Score</th>
          <th>Submitted Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  results.forEach(result => {
    const studentName = `${result.student_name || ''} ${result.student_surname || ''}`.trim() || 'Unknown Student';
    const submittedDate = result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : 'Unknown';
    
    html += `
      <tr>
        <td>${result.id || 'N/A'}</td>
        <td>${studentName}</td>
        <td><strong>${result.test_name || 'Unknown Test'}</strong></td>
        <td><span class="score-badge">${result.score || 0}/${result.max_score || 0}</span></td>
        <td>${submittedDate}</td>
        <td class="action-buttons">
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
  container.style.display = 'block';
}

// Utility Functions
function showNotification(message, type = 'info') {
  console.log('🔧 showNotification called with:', message, type);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Enhanced Local Storage Functions
function clearAllLocalStorage() {
  if (confirm('Are you sure you want to clear all local storage? This cannot be undone.')) {
    localStorage.clear();
    showNotification('All local storage cleared!', 'success');
  }
}

function exportLocalStorage() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'localStorage_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Local storage exported!', 'success');
}

// CSS animations are now defined in styles.css

// Final function availability check
console.log('🔧 Final function availability check...');
console.log('🔧 editUserRow available:', typeof editUserRow);
console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
console.log('🔧 deleteUser available:', typeof deleteUser);
console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
console.log('🔧 deleteSubject available:', typeof deleteSubject);

// ===== STUDENT MENU AND PASSWORD CHANGE FUNCTIONS =====

/**
 * Toggle student dropdown menu
 */
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

/**
 * Show password change tab
 */
function showChangePasswordTab() {
  // Show password change section
  showSection('passwordChangeSection');
  
  // Hide dropdown menu
  const dropdownMenu = document.getElementById('studentDropdownMenu');
  if (dropdownMenu) {
    dropdownMenu.classList.remove('show');
  }
}

/**
 * Hide password change tab and return to cabinet
 */
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
    const response = await fetch('/.netlify/functions/change-student-password', {
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

// Add event listener for password change form
document.addEventListener('DOMContentLoaded', function() {
  const passwordForm = document.getElementById('changePasswordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const studentMenu = document.querySelector('.student-menu');
    const dropdownMenu = document.getElementById('studentDropdownMenu');
    
    if (studentMenu && !studentMenu.contains(event.target)) {
      if (dropdownMenu) {
        dropdownMenu.classList.remove('show');
      }
    }
  });
  
  // Debug: Check if student menu elements exist
  console.log('🔧 Checking student menu elements...');
  const studentMenu = document.querySelector('.student-menu');
  const menuBtn = document.getElementById('studentMenuBtn');
  const dropdownMenu = document.getElementById('studentDropdownMenu');
  
  console.log('🔧 studentMenu found:', !!studentMenu);
  console.log('🔧 menuBtn found:', !!menuBtn);
  console.log('🔧 dropdownMenu found:', !!dropdownMenu);
  
  if (studentMenu) {
    console.log('🔧 studentMenu classes:', studentMenu.className);
    console.log('🔧 studentMenu styles:', window.getComputedStyle(studentMenu));
  }
});















// Helper function to get current test ID
function getCurrentTestId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('test_id') || localStorage.getItem('current_test_id');
}

// ===== NEW PAGE-BASED TEST NAVIGATION SYSTEM =====

// Navigate to test page
function navigateToTest(testType, testId) {
    // Prevent duplicate calls
    if (window.isNavigatingToTest) {
        console.log('[DEBUG] navigateToTest already in progress, ignoring duplicate call');
        return;
    }
    
    window.isNavigatingToTest = true;
    console.log(`[DEBUG] navigateToTest called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Hide all sections first
        hideTestSections();
        console.log('[DEBUG] All sections hidden');
        
        // Show test page section
        const testPage = document.getElementById('test-page');
        if (testPage) {
            // Force all display properties
            testPage.style.display = 'block';
            testPage.style.visibility = 'visible';
            testPage.style.opacity = '1';
            testPage.style.position = 'fixed';
            testPage.style.top = '0';
            testPage.style.left = '0';
            testPage.style.width = '100%';
            testPage.style.height = '100%';
            testPage.style.zIndex = '1000';
            testPage.classList.add('active');
            
            console.log('[DEBUG] Test page section displayed with properties:', {
                display: testPage.style.display,
                visibility: testPage.style.visibility,
                opacity: testPage.style.opacity,
                position: testPage.style.position,
                zIndex: testPage.style.zIndex,
                classes: testPage.className
            });
            
            // Load and display the test
            loadTestForPage(testType, testId);
        } else {
            console.error('[ERROR] Test page section not found');
            window.isNavigatingToTest = false;
            return;
        }
        
    } catch (error) {
        console.error('[ERROR] Error in navigateToTest:', error);
    } finally {
        // Reset the flag after a short delay to allow the test to load
        setTimeout(() => {
            window.isNavigatingToTest = false;
        }, 1000);
    }
}

// Navigate to test results page
function navigateToTestResults(testType, testId, studentAnswers) {
    console.log(`[DEBUG] navigateToTestResults called with testType: ${testType}, testId: ${testId}, studentAnswers:`, studentAnswers);
    
    // Hide all sections first
    hideTestSections();
    console.log('[DEBUG] All sections hidden');
    
    // Show test results page section
    const testResultsPage = document.getElementById('test-results-page');
// Show test results page section using the proper showSection system
    showSection('test-results-page');
    console.log('[DEBUG] Test results page section displayed via showSection');

    // Load and display the test results
    loadTestResultsForPage(testType, testId, studentAnswers);
}

// Navigate back to main cabinet
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
                loadStudentActiveTests();
                
                // Also refresh the test results/score table
                console.log('[DEBUG] Refreshing test results for student:', decoded.sub);
                loadStudentTestResults();
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

// Hide all sections
function hideTestSections() {
    console.log('[DEBUG] hideTestSections called');
    
    const sections = [

        'test-page',
        'test-results-page'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
            console.log(`[DEBUG] Hidden section: ${sectionId}`);
        } else {
            console.warn(`[WARN] Section not found: ${sectionId}`);
        }
    });
}

// Load test content for the test page
async function loadTestForPage(testType, testId) {
    console.log(`[DEBUG] loadTestForPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Get test info
        const testInfo = await getTestInfo(testType, testId);
        console.log('[DEBUG] Test info retrieved:', testInfo);
        
        // Get test questions
        const questions = await getTestQuestions(testType, testId);
        console.log('[DEBUG] Test questions retrieved:', questions);
        
        // Display the test
        displayTestOnPage(testInfo, questions, testType, testId);
        
        // Debug: Check if test page is still visible after loading
        const testPage = document.getElementById('test-page');
        if (testPage) {
            console.log('[DEBUG] After test load - Test page visibility:', {
                display: testPage.style.display,
                visibility: testPage.style.visibility,
                opacity: testPage.style.opacity,
                classes: testPage.className,
                isVisible: testPage.style.display !== 'none' && testPage.style.visibility !== 'hidden' && testPage.style.opacity !== '0'
            });
        }
        
        // Debug: Check the questions data structure
        console.log('[DEBUG] Questions data structure:', {
            rawQuestionsLength: questions.length,
            questionsType: testType,
            testId: testId
        });
    } catch (error) {
        // Check if this is an intentional redirection error
        if (error.message === 'Redirection initiated - should not continue') {
            console.log('[DEBUG] Redirection completed successfully - this is expected behavior');
            return; // Exit gracefully without showing error
        }
        
        console.error('[ERROR] Failed to load test for page:', error);
        alert('Failed to load test: ' + error.message);
    }
}

// Display test on the test page
function displayTestOnPage(testInfo, questions, testType, testId) {
    console.log(`[DEBUG] displayTestOnPage called with:`, { testInfo, questions, testType, testId });
    
    // Special handling for matching type tests - redirect to dedicated page
    if (testType === 'matching_type') {
        console.log('[DEBUG] Matching type test detected, redirecting to dedicated page');
        const studentId = getCurrentStudentId();
        console.log('[DEBUG] Student ID for redirection:', studentId);
        
        if (!studentId) {
            console.error('[ERROR] No student ID found, cannot redirect');
            alert('Error: Student ID not found. Please log in again.');
            return;
        }
        
        const redirectUrl = `matching-test-student.html?test_id=${testId}&student_id=${studentId}`;
        console.log('[DEBUG] Redirect URL:', redirectUrl);
        console.log('[DEBUG] About to redirect...');
        
        // Force immediate redirection
        try {
            console.log('[DEBUG] Attempting redirection with replace()...');
            window.location.replace(redirectUrl);
            console.log('[DEBUG] Redirection initiated with replace()');
        } catch (error) {
            console.error('[ERROR] Redirection failed:', error);
            // Fallback to href
            console.log('[DEBUG] Fallback to href redirection...');
            window.location.href = redirectUrl;
            console.log('[DEBUG] Fallback redirection with href');
        }
        
        // Prevent any further execution
        console.log('[DEBUG] Redirection complete, preventing further execution');
        throw new Error('Redirection initiated - should not continue');
    }
    
    const testPageSection = document.getElementById('test-page');
    if (!testPageSection) {
        console.error('[ERROR] Test page section not found');
        return;
    }
    
    // For input tests, group questions by question_id to handle multiple correct answers
    let processedQuestions = questions;
    if (testType === 'input') {
        console.log('[DEBUG] Processing input test questions - grouping by question_id');
        console.log('[DEBUG] Original questions structure:', questions);
        
        // Backend now provides consistent data structure - no grouping needed
        processedQuestions = questions;
        console.log(`[DEBUG] Backend provided ${questions.length} questions with consistent structure:`, processedQuestions);
    }
    
    // Clear existing content
    testPageSection.innerHTML = '';
    console.log('[DEBUG] Cleared existing test page content');
    
    // Create test header
    const testHeader = document.createElement('div');
    testHeader.className = 'test-header';
    testHeader.innerHTML = `
        <h2>${testInfo.test_name || testInfo.title || 'Test'}</h2>
        <button class="btn btn-secondary" onclick="navigateBackToCabinet()">Back to&#10;Cabinet</button>
    `;
    testPageSection.appendChild(testHeader);
    console.log('[DEBUG] Test header created and added with info:', testInfo);
    
    // Create progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'test-progress';
    progressIndicator.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <span class="progress-text">0 / ${processedQuestions.length} questions answered</span>
    `;
    testPageSection.appendChild(progressIndicator);
    console.log('[DEBUG] Progress indicator created and added');
    
    // Create questions container
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';
    testPageSection.appendChild(questionsContainer);
    console.log('[DEBUG] Questions container created');
    
    // Render questions
    console.log('[DEBUG] About to render questions...');
    renderQuestionsForPage(processedQuestions, testType, testId);
    console.log('[DEBUG] Questions rendering completed');
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-test-btn';
    submitButton.textContent = 'Submit Test';
    submitButton.disabled = true;
            submitButton.onclick = () => submitTestFromPage(testType, testId);
    testPageSection.appendChild(submitButton);
    console.log('[DEBUG] Submit button created and added');
    
    // Setup event listeners and progress tracking
            setupTestPageEventListeners(testType, testId);
    setupProgressTrackingForPage(testType, testId);
    
    // Load saved progress
    loadSavedProgressForPage(testType, testId);
    
    console.log('[DEBUG] Test page setup completed');
}

// Render questions for the test page
function renderQuestionsForPage(questions, testType, testId) {
    console.log(`[DEBUG] renderQuestionsForPage called with ${questions.length} questions, testType: ${testType}, testId: ${testId}`);
    
    const questionsContainer = document.querySelector('.questions-container');
    if (!questionsContainer) {
        console.error('[ERROR] Questions container not found');
        return;
    }
    
    questions.forEach((question, index) => {
        console.log(`[DEBUG] Rendering question ${index + 1}:`, question);
        console.log(`[DEBUG] Question ${index + 1} properties:`, Object.keys(question));
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-container';
        questionElement.dataset.questionIndex = index;
        questionElement.dataset.questionId = question.id || question.question_id;
        
        // Render based on question type
        let renderedHtml = '';
        switch (testType) {
            case 'true-false':
                renderedHtml = renderTrueFalseQuestionsForPage(question, testId);
                console.log(`[DEBUG] True/false HTML for question ${index + 1}:`, renderedHtml);
                break;
            case 'multiple-choice':
                renderedHtml = renderMultipleChoiceQuestionsForPage(question, testId);
                console.log(`[DEBUG] Multiple choice HTML for question ${index + 1}:`, renderedHtml);
                break;
            case 'input':
                // Use the proper rendering function for input questions
                renderedHtml = renderInputQuestionsForPage(question, testId);
                console.log(`[DEBUG] Input HTML for question ${index + 1}:`, renderedHtml);
                break;

            default:
                console.warn(`[WARN] Unknown test type: ${testType}`);
                renderedHtml = `<p>Unknown question type: ${testType}</p>`;
        }
        
        // Fallback if rendering failed
        if (!renderedHtml || renderedHtml.trim() === '') {
            console.warn(`[WARN] Rendering failed for question ${index + 1}, using fallback HTML`);
            renderedHtml = `
                <div class="question-container" data-question-id="${question.question_id || index}">
                    <h4>Question ${index + 1}</h4>
                    <p class="question-text">${question.question || 'Question text not available'}</p>
                    <div class="input-question">
                        <input type="text" 
                               id="input_${question.question_id || index}" 
                               placeholder="Enter your answer" 
                               data-question-id="${question.question_id || index}">
                    </div>
                </div>
            `;
        }
        
        questionElement.innerHTML = renderedHtml;
        
        questionsContainer.appendChild(questionElement);
        console.log(`[DEBUG] Question ${index + 1} added to container`);
        console.log(`[DEBUG] Question ${index + 1} HTML:`, questionElement.innerHTML);
    });
    
    console.log(`[DEBUG] All ${questions.length} questions rendered`);
    console.log(`[DEBUG] Questions container now has ${questionsContainer.children.length} children`);
    console.log(`[DEBUG] Questions container HTML:`, questionsContainer.innerHTML);
}

// Render true/false questions for page
function renderTrueFalseQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderTrueFalseQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('true_false', testId, questionId);
    
    return `
        <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
            <h4>Question ${question.question_id}</h4>
            <p class="question-text">${question.question}</p>
            <div class="answer-options">
                <label class="radio-option">
                    <input type="radio" name="question_${questionId}" value="true" 
                           ${savedAnswer === 'true' ? 'checked' : ''} data-question-id="${questionId}">
                    <span class="radio-custom"></span>
                    True
                </label>
                <label class="radio-option">
                    <input type="radio" name="question_${questionId}" value="false" 
                           ${savedAnswer === 'false' ? 'checked' : ''} data-question-id="${questionId}">
                    <span class="radio-custom"></span>
                    False
                </label>
            </div>
        </div>
    `;
}

// Render multiple choice questions for page
function renderMultipleChoiceQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderMultipleChoiceQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('multiple_choice', testId, questionId);
    
    return `
        <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
            <h4>Question ${question.question_id}</h4>
            <p class="question-text">${question.question}</p>
            <div class="answer-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="radio-option">
                        <input type="radio" name="question_${questionId}" value="${optionIndex}" 
                               ${savedAnswer === String(optionIndex) ? 'checked' : ''} data-question-id="${questionId}">
                        <span class="radio-custom"></span>
                        ${String.fromCharCode(65 + optionIndex)}) ${option}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

// Render input questions for page
function renderInputQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderInputQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('input', testId, questionId);
    
                return `
                <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
                    <h4>Question ${question.question_id}</h4>
                    <p class="question-text">${question.question}</p>

                    <div class="input-question">
                        <input type="text" 
                               id="input_${questionId}" 
                               placeholder="Enter your answer" 
                               value="${savedAnswer || ''}"
                               data-question-id="${questionId}">
                    </div>
                </div>
            `;
}

// Render matching type questions for page


// Set up event listeners for the test page
function setupTestPageEventListeners(testType, testId) {
    console.log(`[DEBUG] setupTestPageEventListeners called with testType: ${testType}, testId: ${testId}`);
    
    // Add event listeners for different question types
    if (testType === 'true-false' || testType === 'multiple-choice') {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        console.log(`[DEBUG] Found ${radioButtons.length} radio buttons for event listeners`);
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log(`[DEBUG] Radio button changed for question ${radio.dataset.questionId}, value: ${radio.value}`);
                updateProgressDisplayForPage(testType, testId);
                updateSubmitButtonStateForPage();
            });
        });
    } else if (testType === 'input') {
        const inputFields = document.querySelectorAll('input[type="text"]');
        console.log(`[DEBUG] Found ${inputFields.length} input fields for event listeners`);
        
        inputFields.forEach(input => {
            input.addEventListener('input', () => {
                console.log(`[DEBUG] Input field changed for question ${input.dataset.questionId}, value: ${input.value}`);
                updateProgressDisplayForPage(testType, testId);
                updateSubmitButtonStateForPage();
            });
        });
    } else if (testType === 'matching_type') {
        // Matching type tests now redirect to dedicated page
        console.log('[DEBUG] Matching type test - redirected to dedicated page');
    }
    
    console.log('[DEBUG] Test page event listeners setup completed');
}

// Set up progress tracking for the test page
function setupProgressTrackingForPage(testType, testId) {
    console.log(`[DEBUG] setupProgressTrackingForPage called with testType: ${testType}, testId: ${testId}`);
    
    // Set up interval to save progress
    const progressInterval = setInterval(() => {
        console.log('[DEBUG] Auto-saving progress...');
        saveProgressForPage(testType, testId);
    }, 30000); // Save every 30 seconds
    
    // Store interval ID for cleanup
    window.currentProgressInterval = progressInterval;
    
    console.log('[DEBUG] Progress tracking interval set up (30 seconds)');
}

// Update progress display for the test page
function updateProgressDisplayForPage(testType, testId) {
    console.log(`[DEBUG] updateProgressDisplayForPage called with testType: ${testType}, testId: ${testId}`);
    
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressBar || !progressText) {
        console.warn('[WARN] Progress elements not found');
        return;
    }
    
    // Count only the outer question containers (not nested ones)
    const questionContainers = document.querySelectorAll('.question-container[data-question-index]');
    const totalQuestions = questionContainers.length;
    const answeredQuestions = getAnsweredQuestionsCountForPage(testType);
    
    console.log(`[DEBUG] Progress: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`[DEBUG] Question containers found:`, {
        count: questionContainers.length,
        selectors: Array.from(questionContainers).map((container, index) => ({
            index,
            questionIndex: container.getAttribute('data-question-index'),
            className: container.className,
            innerHTML: container.innerHTML.substring(0, 100) + '...'
        }))
    });
    
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${answeredQuestions} / ${totalQuestions} questions answered`;
    
    console.log(`[DEBUG] Progress bar updated: ${percentage}%`);
}

// Update submit button state for the test page
function updateSubmitButtonStateForPage() {
    console.log('[DEBUG] updateSubmitButtonStateForPage called');
    
    const submitButton = document.querySelector('.submit-test-btn');
    if (!submitButton) {
        console.warn('[WARN] Submit button not found');
        return;
    }
    
    // Count only the outer question containers (not nested ones)
    const questionContainers = document.querySelectorAll('.question-container[data-question-index]');
    const totalQuestions = questionContainers.length;
    const answeredQuestions = getAnsweredQuestionsCountForPage(getCurrentTestType());
    
    console.log(`[DEBUG] Submit button state check: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`[DEBUG] Submit button check - Question containers found:`, {
        count: questionContainers.length,
        selectors: Array.from(questionContainers).map((container, index) => ({
            index,
            questionIndex: container.getAttribute('data-question-index'),
            className: container.className
        }))
    });
    
    if (answeredQuestions === totalQuestions && totalQuestions > 0) {
        submitButton.disabled = false;
        console.log('[DEBUG] Submit button enabled - all questions answered');
    } else {
        submitButton.disabled = true;
        console.log('[DEBUG] Submit button disabled - not all questions answered');
    }
}

// Load saved progress for the test page
function loadSavedProgressForPage(testType, testId) {
    console.log(`[DEBUG] loadSavedProgressForPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const key = `test_progress_${testType}_${testId}`;
        const progress = JSON.parse(localStorage.getItem(key) || '{}');
        
        console.log('[DEBUG] Loaded progress from localStorage:', progress);
        
        if (Object.keys(progress).length === 0) {
            console.log('[DEBUG] No saved progress found');
            return;
        }
        
        // Update question containers with saved answers
        Object.keys(progress).forEach(questionId => {
            const answer = progress[questionId];
            console.log(`[DEBUG] Restoring answer for question ${questionId}: ${answer}`);
            
            if (testType === 'true-false' || testType === 'multiple-choice') {
                const radio = document.querySelector(`input[name="question_${questionId}"][value="${answer}"]`);
                if (radio) {
                    radio.checked = true;
                    console.log(`[DEBUG] Radio button checked for question ${questionId}`);
                }
            } else if (testType === 'input') {
                const input = document.querySelector(`input[data-question-id="${questionId}"]`);
                if (input) {
                    input.value = answer;
                    console.log(`[DEBUG] Input field populated for question ${questionId}`);
                }
            }
        });
        
        // Update progress display
        updateProgressDisplayForPage(testType, testId);
        updateSubmitButtonStateForPage();
        
        console.log('[DEBUG] Saved progress restored successfully');
    } catch (error) {
        console.error('[ERROR] Failed to load saved progress:', error);
    }
}

// Submit test from the test page
async function submitTestFromPage(testType, testId) {
    console.log(`[DEBUG] submitTestFromPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Check if all questions are answered
        // Count only the outer question containers (not nested ones)
        const questionContainers = document.querySelectorAll('.question-container[data-question-index]');
        const totalQuestions = questionContainers.length;
        const answeredQuestions = getAnsweredQuestionsCountForPage(testType);
        
        console.log(`[DEBUG] Submission check: ${answeredQuestions}/${totalQuestions} questions answered`);
        console.log(`[DEBUG] Submit check - Question containers found:`, {
            count: questionContainers.length,
            selectors: Array.from(questionContainers).map((container, index) => ({
                index,
                questionIndex: container.getAttribute('data-question-index'),
                className: container.className
            }))
        });
        
        if (answeredQuestions < totalQuestions) {
            console.warn('[WARN] Not all questions answered, submission blocked');
            alert('Please answer all questions before submitting.');
            return;
        }
        
        // Disable submit button to prevent double submission
        const submitButton = document.querySelector('.submit-test-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            console.log('[DEBUG] Submit button disabled and text changed to "Submitting..."');
        }
        
        // Submit test
        const result = await submitTest(testType, testId);
        console.log('[DEBUG] Test submission result:', result);
        
        if (result.success) {
            console.log('[DEBUG] Test submitted successfully, navigating to results');
            
            // Clear progress
            clearTestProgress(testType, testId);
            
            // Collect answers for results display
            const answers = collectTestAnswers(testType, testId);
            console.log('[DEBUG] Collected answers for results display:', answers);
            
            // Navigate to results page
            navigateToTestResults(testType, testId, answers);
        } else {
            console.error('[ERROR] Test submission failed:', result.message);
            alert('Failed to submit test: ' + result.message);
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Test';
                console.log('[DEBUG] Submit button re-enabled after failure');
            }
        }
    } catch (error) {
        console.error('[ERROR] Error in submitTestFromPage:', error);
        alert('Error submitting test: ' + error.message);
        
        // Re-enable submit button
        const submitButton = document.querySelector('.submit-test-btn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Test';
        }
    }
}

// Load test results for the results page
async function loadTestResultsForPage(testType, testId, studentAnswers) {
    console.log(`[DEBUG] loadTestResultsForPage called with testType: ${testType}, testId: ${testId}, studentAnswers:`, studentAnswers);
    
    try {
        // Get test info
        const testInfo = await getTestInfo(testType, testId);
        console.log('[DEBUG] Test info retrieved for results:', testInfo);
        
        // Get test questions
        const questions = await getTestQuestions(testType, testId);
        console.log('[DEBUG] Test questions retrieved for results:', questions);
        
        // Display results
        displayTestResultsOnPage(testInfo, questions, testType, studentAnswers);
    } catch (error) {
        console.error('[ERROR] Failed to load test results for page:', error);
        alert('Failed to load test results: ' + error.message);
    }
}

// Display test results on the results page
function displayTestResultsOnPage(testInfo, questions, testType, studentAnswers) {
    console.log(`[DEBUG] displayTestResultsOnPage called with:`, { testInfo, questions, testType, studentAnswers });
    
    const testResultsSection = document.getElementById('test-results-page');
    if (!testResultsSection) {
        console.error('[ERROR] Test results page section not found');
        return;
    }
    
    // Clear existing content
    testResultsSection.innerHTML = '';
    console.log('[DEBUG] Cleared existing test results page content');
    
    // Create results header
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'results-header';
    resultsHeader.innerHTML = `
        <h2>Test Results: ${testInfo.test_name || testInfo.title || 'Test'}</h2>
    `;
    testResultsSection.appendChild(resultsHeader);
    console.log('[DEBUG] Results header created and added with info:', testInfo);
    
    // Create results summary
    const resultsSummary = document.createElement('div');
    resultsSummary.className = 'results-summary';
    
    // Backend now provides consistent data structure - no grouping needed
    const processedQuestions = questions;
    
    // Calculate score using consistent question structure
    const score = calculateTestScore(processedQuestions, studentAnswers, testType);
    const totalQuestions = processedQuestions.length; // Use actual question count for consistency
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const questionsReview = document.createElement('div');
    questionsReview.className = 'questions-review';
    questionsReview.innerHTML = '<h3>Question Review</h3>';
    
    console.log(`[DEBUG] Test score calculated: ${score}/${totalQuestions} (${percentage}%)`);
    
    resultsSummary.innerHTML = `
        <h3>Your Score: ${score} / ${totalQuestions} (${percentage}%)</h3>
        <div class="score-bar">
            <div class="score-fill" style="width: ${percentage}%"></div>
        </div>
    `;
    testResultsSection.appendChild(resultsSummary);
    console.log('[DEBUG] Results summary created and added');
    

    
    processedQuestions.forEach((question, logicalIndex) => {
        console.log(`[DEBUG] Creating review for question ${logicalIndex + 1}:`, question);
        
        const questionReview = document.createElement('div');
        questionReview.className = 'question-review';
        
        const studentAnswer = studentAnswers[question.question_id] || 'No answer';
        const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
        
        console.log(`[DEBUG] Question ${logicalIndex + 1} - Student answer: ${studentAnswer}, Correct: ${isCorrect}`);
        
        questionReview.innerHTML = `
            <div class="question-review-header ${isCorrect ? 'correct' : 'incorrect'}">
                <h4>Question ${logicalIndex + 1}</h4>
                <span class="result-indicator">${isCorrect ? '✓' : '✗'}</span>
            </div>
            <p class="question-text">${question.question}</p>
            <p class="student-answer"><strong>Your Answer:</strong> ${studentAnswer}</p>
            ${!isCorrect ? `<p class="correct-answer"><strong>Correct Answer:</strong> ${getCorrectAnswer(question, testType)}</p>` : ''}
        `;
        
        questionsReview.appendChild(questionReview);
    });
    
    testResultsSection.appendChild(questionsReview);
    console.log('[DEBUG] Questions review created and added');
    
    // Add Back to Cabinet button at the bottom
    const backButton = document.createElement('div');
    backButton.className = 'results-actions';
    backButton.innerHTML = `
        <button class="btn btn-secondary" onclick="clearTestDataAndReturnToCabinet()">Back to Cabinet</button>
    `;
    testResultsSection.appendChild(backButton);
    console.log('[DEBUG] Back button created and added:', backButton.outerHTML);
    console.log('[DEBUG] Button element found:', backButton.querySelector('button'));
    
    // Setup event listeners
    setupTestResultsPageEventListeners();
    
    console.log('[DEBUG] Test results page setup completed');
}

// Set up event listeners for the test results page
function setupTestResultsPageEventListeners() {
    console.log('[DEBUG] setupTestResultsPageEventListeners called');
    
    // Add any specific event listeners for the results page
    console.log('[DEBUG] Test results page event listeners setup completed');
}

// Helper functions for the new page-based system
async function getTestInfo(testType, testId) {
    console.log(`[DEBUG] getTestInfo called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const url = `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`;
        console.log('[DEBUG] Fetching test info from:', url);
        
        const response = await fetch(url);
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Test info data received:', data);
        console.log('[DEBUG] Full response structure:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('[DEBUG] Test info retrieved successfully');
            console.log('[DEBUG] Test info object:', data.test_info);
            console.log('[DEBUG] Available properties:', Object.keys(data.test_info || {}));
            return data.test_info;
        } else {
            throw new Error(data.error || 'Failed to get test info');
        }
    } catch (error) {
        console.error('[ERROR] Failed to get test info:', error);
        throw error;
    }
}

async function getTestQuestions(testType, testId) {
    console.log(`[DEBUG] getTestQuestions called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const url = `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`;
        console.log('[DEBUG] Fetching test questions from:', url);
        
        const response = await fetch(url);
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Test questions data received:', data);
        console.log('[DEBUG] Full response structure:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log(`[DEBUG] Retrieved ${data.questions.length} questions successfully`);
            console.log('[DEBUG] Questions array:', data.questions);
            console.log('[DEBUG] First question structure:', data.questions[0]);
            return data.questions;
        } else {
            throw new Error(data.error || 'Failed to get test questions');
        }
    } catch (error) {
        console.error('[ERROR] Failed to get test questions:', error);
        throw error;
    }
}

function getAnsweredQuestionsCountForPage(testType) {
    console.log(`[DEBUG] getAnsweredQuestionsCountForPage called with testType: ${testType}`);
    
    let answeredCount = 0;
    
    if (testType === 'true-false' || testType === 'multiple-choice') {
        const answeredRadios = document.querySelectorAll('input[type="radio"]:checked');
        answeredCount = answeredRadios.length;
        console.log(`[DEBUG] Found ${answeredCount} answered radio button questions`);
    } else if (testType === 'input') {
        // Count unique answered questions by question ID
        const answeredQuestionIds = new Set();
        const inputFields = document.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            if (input.value.trim() !== '') {
                const questionId = input.dataset.questionId;
                if (questionId) {
                    answeredQuestionIds.add(questionId);
                }
            }
        });
        answeredCount = answeredQuestionIds.size;
        console.log(`[DEBUG] Found ${answeredCount} answered input questions (unique question IDs: ${Array.from(answeredQuestionIds)})`);
    } else if (testType === 'matching_type') {
        // This should never be reached - matching type tests redirect to dedicated page
        console.error('[ERROR] getAnsweredQuestionsCountForPage called for matching_type - this should not happen!');
        throw new Error('Matching type tests are handled by dedicated page, not main application');
    }
    
    console.log(`[DEBUG] Total answered questions: ${answeredCount}`);
    return answeredCount;
}

function getCurrentTestType() {
    console.log('[DEBUG] getCurrentTestType called');
    
    // Try to determine test type from current page
    const testPage = document.getElementById('test-page');
    if (testPage && testPage.style.display !== 'none') {
        // Look for clues in the DOM to determine test type
        if (document.querySelector('input[type="radio"]')) {
            console.log('[DEBUG] Detected test type: radio-based (true-false or multiple-choice)');
            return document.querySelector('input[type="radio"]').name.startsWith('question_') ? 'true-false' : 'multiple-choice';
        } else if (document.querySelector('input[type="text"]')) {
            console.log('[DEBUG] Detected test type: input');
            return 'input';
        } else if (document.querySelector('.matching-container')) {
            // This should never be reached - matching type tests redirect to dedicated page
            console.error('[ERROR] getCurrentTestType detected matching_type - this should not happen!');
            throw new Error('Matching type tests are handled by dedicated page, not main application');
        }
    }
    
    console.warn('[WARN] Could not determine current test type');
    return null;
}

function getCurrentStudentId() {
    console.log('[DEBUG] getCurrentStudentId called');
    
    try {
        // Use JWT token instead of localStorage
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found');
            return null;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        if (decoded && decoded.sub) {
            console.log(`[DEBUG] Found student ID from JWT: ${decoded.sub}`);
            return decoded.sub;
        } else {
            console.warn('[WARN] No student ID found in JWT token');
            return null;
        }
    } catch (error) {
        console.error('[ERROR] Error getting current student ID from JWT:', error);
        return null;
    }
}

function saveProgressForPage(testType, testId) {
    console.log(`[DEBUG] saveProgressForPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const answers = collectTestAnswers(testType, testId);
        console.log('[DEBUG] Collected answers for progress save:', answers);
        
        const key = `test_progress_${testType}_${testId}`;
        localStorage.setItem(key, JSON.stringify(answers));
        
        console.log('[DEBUG] Progress saved to localStorage');
    } catch (error) {
        console.error('[ERROR] Failed to save progress:', error);
    }
}

















function calculateTestScore(questions, answers, testType) {
    console.log(`[DEBUG] calculateTestScore called with ${questions.length} questions, testType: ${testType}`);
    
    let score = 0;
    
    questions.forEach((question, index) => {
        // Use question_id consistently
        const questionId = question.question_id;
        const studentAnswer = answers[questionId];
        const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
        
        if (isCorrect) {
            score++;
        }
        
        console.log(`[DEBUG] Question ${questionId}: answer=${studentAnswer}, correct=${isCorrect}, running score=${score}`);
    });
    
    console.log(`[DEBUG] Final test score: ${score}/${questions.length}`);
    return score;
}



function checkAnswerCorrectness(question, studentAnswer, testType) {
    console.log(`[DEBUG] checkAnswerCorrectness called for question:`, question, 'studentAnswer:', studentAnswer, 'testType:', testType);
    
    if (!studentAnswer || studentAnswer === '') {
        console.log('[DEBUG] No student answer provided');
        return false;
    }
    
    let isCorrect = false;
    
    switch (testType) {
        case 'true-false':
            // Use correct_answer (not correctAnswer)
            isCorrect = studentAnswer === question.correct_answer;
            break;
        case 'multiple-choice':
            // Use correct_answer (not correctAnswer)
            isCorrect = parseInt(studentAnswer) === question.correct_answer;
            break;
        case 'input':
            // For grouped questions, check against all correct answers
            if (question.correct_answers && Array.isArray(question.correct_answers)) {
                isCorrect = question.correct_answers.some(correctAnswer => 
                    studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
                );
            } else {
                // Fallback for old format - use correct_answer (not correctAnswer)
                isCorrect = studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
            }
            break;
            
        default:
            console.warn(`[WARN] Unknown test type for answer checking: ${testType}`);
            isCorrect = false;
    }
    
    console.log(`[DEBUG] Answer correctness: ${isCorrect}`);
    return isCorrect;
}
function getCorrectAnswer(question, testType) {
    console.log(`[DEBUG] getCorrectAnswer called for question:`, question, 'testType:', testType);
    
    let correctAnswer = '';
    
    switch (testType) {
        case 'true-false':
            correctAnswer = question.correct_answer ? 'True' : 'False'; // Fix: use correct_answer
            break;
        case 'multiple-choice':
            // Fix: construct option key from correct_answer (integer)
            const optionKey = `option_${String.fromCharCode(97 + question.correct_answer)}`; // a, b, c, d
            correctAnswer = question[optionKey] || `Option ${question.correct_answer + 1}`;
            break;
        case 'input':
            // For grouped questions, show all correct answers
            if (question.correct_answers && Array.isArray(question.correct_answers)) {
                correctAnswer = question.correct_answers.join(', ');
            } else {
                // Fallback for old format
                correctAnswer = question.correct_answer || 'Unknown'; // Fix: use correct_answer
            }
            break;

        default:
            correctAnswer = 'Unknown';
    }
    
    console.log(`[DEBUG] Correct answer: ${correctAnswer}`);
    return correctAnswer;
}

// Function to clear test data and return to cabinet
function clearTestDataAndReturnToCabinet() {
    console.log('[DEBUG] clearTestDataAndReturnToCabinet called');
    
    // Get current test info
    const currentTestType = getCurrentTestType();
    const currentTestId = getCurrentTestId();
    const currentStudentId = getCurrentStudentId();
    
    if (currentTestType && currentTestId && currentStudentId) {
        // Clear test progress
        clearTestProgress(currentTestType, currentTestId);
        
        // Clear test completion status
        const completionKey = `test_completed_${currentTestType}_${currentTestId}_${currentStudentId}`;
        localStorage.removeItem(completionKey);
        
        // Clear progress tracking interval
        clearProgressTrackingInterval(currentTestType, currentTestId);
        
        console.log('[DEBUG] Test data cleared for:', { currentTestType, currentTestId, currentStudentId });
    }
    
    // Navigate back to cabinet
    navigateBackToCabinet();
    
    // Refresh the test results/score table after returning to cabinet
    setTimeout(() => {
        if (currentStudentId) {
            console.log('[DEBUG] Refreshing test results for student:', currentStudentId);
            loadStudentTestResults();
        }
    }, 200); // Slightly longer delay to ensure navigation is complete
}

// ===== END NEW PAGE-BASED TEST NAVIGATION SYSTEM =====

// ===== TEST DELETION MANAGEMENT FUNCTIONS =====

// Global variables for deletion forms
let currentDeletionType = null;
let teachersList = [];
let subjectsList = [];

// Initialize deletion functionality
function initializeTestDeletion() {
  loadTeachersList();
  loadSubjectsList();
  setupDateValidation();
}

// Load teachers for dropdowns
async function loadTeachersList() {
  try {
    const response = await fetch('/.netlify/functions/get-all-teachers');
    const data = await response.json();
    if (data.success) {
      teachersList = data.teachers;
      populateTeacherDropdowns();
    } else {
      console.error('Failed to load teachers:', data.message);
    }
  } catch (error) {
    console.error('Error loading teachers:', error);
  }
}

// Load subjects for dropdowns
async function loadSubjectsList() {
  try {
    const response = await fetch('/.netlify/functions/get-all-subjects');
    const data = await response.json();
    if (data.success) {
      subjectsList = data.subjects;
      populateSubjectDropdowns();
    } else {
      console.error('Failed to load subjects:', data.message);
    }
  } catch (error) {
    console.error('Error loading subjects:', error);
  }
}

// Populate teacher dropdowns
function populateTeacherDropdowns() {
  const teacherSelects = ['assignmentTeacherSelect', 'dataTeacherSelect'];
  
  teacherSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Select Teacher</option>';
      teachersList.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.teacher_id;
        option.textContent = teacher.username;
        select.appendChild(option);
      });
    }
  });
}

// Populate subject dropdowns
function populateSubjectDropdowns() {
  const subjectSelects = ['assignmentSubjectSelect', 'dataSubjectSelect'];
  
  subjectSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">All Subjects</option>';
      subjectsList.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.subject_id;
        option.textContent = subject.subject;
        select.appendChild(option);
      });
    }
  });
}

// Show assignment deletion form
function showTestAssignmentDeletion() {
  currentDeletionType = 'assignment';
  document.getElementById('assignmentDeletionForm').style.display = 'block';
  document.getElementById('testDataDeletionForm').style.display = 'none';
  
  // Reset form
  document.getElementById('assignmentDeletionFormElement').reset();
  document.getElementById('assignmentGradesClassesContainer').innerHTML = '';
}

// Show test data deletion form
function showTestDataDeletion() {
  currentDeletionType = 'data';
  document.getElementById('testDataDeletionForm').style.display = 'block';
  document.getElementById('assignmentDeletionForm').style.display = 'none';
  
  // Reset form
  document.getElementById('testDataDeletionFormElement').reset();
  document.getElementById('dataGradesClassesContainer').innerHTML = '';
}

// Hide forms
function hideAssignmentDeletionForm() {
  document.getElementById('assignmentDeletionForm').style.display = 'none';
}

function hideTestDataDeletionForm() {
  document.getElementById('testDataDeletionForm').style.display = 'none';
}

// Load grades and classes for selected teacher
async function loadTeacherGradesClasses(teacherId, containerId) {
  if (!teacherId) {
    document.getElementById(containerId).innerHTML = '';
    return;
  }

  try {
    const response = await window.tokenManager.makeAuthenticatedRequest(
      '/.netlify/functions/get-teacher-grades-classes'
    );
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed to load grades/classes:', data.message);
      return;
    }
    
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (data.data.length === 0) {
      container.innerHTML = '<p>No grades/classes found for this teacher.</p>';
      return;
    }
    
    // Group by grade
    const groupedByGrade = {};
    data.data.forEach(item => {
      if (!groupedByGrade[item.grade]) {
        groupedByGrade[item.grade] = [];
      }
      groupedByGrade[item.grade].push(item.class);
    });
    
    // Create checkboxes
    Object.keys(groupedByGrade).sort().forEach(grade => {
      const gradeDiv = document.createElement('div');
      gradeDiv.className = 'grade-group';
      
      const gradeLabel = document.createElement('h4');
      gradeLabel.textContent = `Grade ${grade}`;
      gradeDiv.appendChild(gradeLabel);
      
      groupedByGrade[grade].sort().forEach(className => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'grade-class-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${grade}-${className}`;
        checkbox.value = `${grade}-${className}`;
        
        const label = document.createElement('label');
        label.htmlFor = `${grade}-${className}`;
        label.textContent = `Class ${className}`;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        gradeDiv.appendChild(checkboxDiv);
      });
      
      container.appendChild(gradeDiv);
    });
    
  } catch (error) {
    console.error('Error loading grades/classes:', error);
    document.getElementById(containerId).innerHTML = '<p>Error loading grades/classes.</p>';
  }
}

// Setup date validation
function setupDateValidation() {
  const startDateInputs = ['assignmentStartDate', 'dataStartDate'];
  const endDateInputs = ['assignmentEndDate', 'dataEndDate'];
  
  startDateInputs.forEach((startId, index) => {
    const startInput = document.getElementById(startId);
    const endInput = document.getElementById(endDateInputs[index]);
    
    startInput.addEventListener('change', () => {
      endInput.min = startInput.value;
      validateDateRange(startInput, endInput);
    });
    
    endInput.addEventListener('change', () => {
      validateDateRange(startInput, endInput);
    });
  });
}

// Validate date range
function validateDateRange(startInput, endInput) {
  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);
  
  if (startDate && endDate && startDate > endDate) {
    endInput.setCustomValidity('End date must be after start date');
  } else {
    endInput.setCustomValidity('');
  }
}

// Handle assignment deletion form submission
async function handleAssignmentDeletion(event) {
  event.preventDefault();
  
  if (!confirm('Are you sure you want to delete test assignments? This action cannot be undone.')) {
    return;
  }
  
  const formData = new FormData(event.target);
  const selectedGradesClasses = getSelectedGradesClasses('assignmentGradesClassesContainer');
  
  if (selectedGradesClasses.length === 0) {
    alert('Please select at least one grade/class combination.');
    return;
  }
  
  const deletionData = {
    startDate: formData.get('assignmentStartDate'),
    endDate: formData.get('assignmentEndDate'),
    teacherId: formData.get('assignmentTeacherSelect'),
    grades: selectedGradesClasses.map(item => item.grade),
    classes: selectedGradesClasses.map(item => item.class),
    subjectId: formData.get('assignmentSubjectSelect') || null
  };
  
  try {
    const response = await fetch('/.netlify/functions/delete-test-assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletionData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Successfully deleted ${result.deletedCount} test assignments.`);
      hideAssignmentDeletionForm();
    } else {
      alert(`Error: ${result.message || 'Failed to delete assignments'}`);
    }
  } catch (error) {
    console.error('Error deleting assignments:', error);
    alert('Error deleting assignments. Please try again.');
  }
}

        // Handle test data and assignments deletion
        async function handleTestDataDeletion(event) {
  event.preventDefault();
  
            if (!confirm('Are you sure you want to delete test questions, results, and assignments? This action cannot be undone.')) {
    return;
  }
  
  const formData = new FormData(event.target);
  const selectedGradesClasses = getSelectedGradesClasses('dataGradesClassesContainer');
  
  if (selectedGradesClasses.length === 0) {
    alert('Please select at least one grade/class combination.');
    return;
  }
  
  const deletionData = {
    startDate: formData.get('dataStartDate'),
    endDate: formData.get('dataEndDate'),
    teacherId: formData.get('dataTeacherSelect'),
    grades: selectedGradesClasses.map(item => item.grade),
    classes: selectedGradesClasses.map(item => item.class),
    subjectId: formData.get('dataSubjectSelect') || null
  };
  
  try {
    const response = await fetch('/.netlify/functions/delete-test-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletionData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
                  alert(`Successfully deleted ${result.deletedCount} test records and assignments.`);
      hideTestDataDeletionForm();
    } else {
      alert(`Error: ${result.message || 'Failed to delete test data'}`);
    }
  } catch (error) {
    console.error('Error deleting test data:', error);
    alert('Error deleting test data. Please try again.');
  }
}

// Get selected grades and classes from checkboxes
function getSelectedGradesClasses(containerId) {
  const container = document.getElementById(containerId);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  
  return Array.from(checkboxes).map(checkbox => {
    const [grade, className] = checkbox.value.split('-');
    return { grade, class: className };
  });
}

// ===== END TEST DELETION MANAGEMENT FUNCTIONS =====

// ===== EXCEL UPLOAD SYSTEM =====

// Initialize Excel upload functionality for all test types
function initializeExcelUploadForAllTestTypes() {
    // Get all Excel upload buttons
    const excelButtons = document.querySelectorAll('.excel-upload-btn');
    
    // Set up event listeners for each test type
    excelButtons.forEach(button => {
        const testType = button.dataset.testType;
        const fileInput = document.querySelector(`.excel-file-input[data-test-type="${testType}"]`);
        
        if (fileInput) {
            button.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (event) => handleExcelFileUpload(event, testType));
        }
    });
}

// Show Excel upload button and hint after submit
function showExcelUploadButton(testType) {
    const excelBtn = document.querySelector(`.excel-upload-btn[data-test-type="${testType}"]`);
    if (excelBtn) {
        excelBtn.style.display = 'inline-block';
    }
}

function showExcelHint(testType) {
    const hint = document.querySelector(`.excel-hint[data-test-type="${testType}"]`);
    if (hint) {
        hint.style.display = 'flex';
    }
}

// Excel file upload handler
function handleExcelFileUpload(event, testType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Basic file validation
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Please select a file smaller than 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            processExcelDataForTestType(jsonData, testType);
        } catch (error) {
            showNotification('Error reading Excel file: ' + error.message, 'error');
            // Clear file input to allow re-upload
            event.target.value = '';
        }
    };
    
    reader.onerror = function() {
        showNotification('Failed to read file', 'error');
        // Clear file input to allow re-upload
        event.target.value = '';
    };
    
    reader.readAsArrayBuffer(file);
}

// Header detection function
function detectHeaders(excelData, testType) {
    if (excelData.length === 0) {
        return { hasHeaders: false, headerRow: null, dataRows: excelData };
    }
    
    const firstRow = excelData[0];
    
    // Check if first row looks like headers
    const headerPattern = getHeaderPattern(testType);
    const headerMatch = checkHeaderMatch(firstRow, headerPattern);
    
    if (headerMatch.isLikelyHeader) {
        // First row looks like headers - ask user
        const message = `The first row of your Excel file looks like it contains headers:\n\n` +
                       `"${firstRow.join(' | ')}"\n\n` +
                       `Does the first row contain column headers?\n\n` +
                       `Click "OK" if YES (headers will be removed)\n` +
                       `Click "Cancel" if NO (first row will be treated as data)`;
        
        const hasHeaders = confirm(message);
        
        if (hasHeaders) {
            return { 
                hasHeaders: true, 
                headerRow: firstRow,
                dataRows: excelData.slice(1) // Remove first row
            };
        }
    }
    
    // No headers or user chose to keep first row as data
    return { 
        hasHeaders: false, 
        headerRow: null,
        dataRows: excelData
    };
}

function getHeaderPattern(testType) {
    switch (testType) {
        case 'multiple-choice':
            return {
                keywords: ['question', 'answer', 'correct', 'option', 'a', 'b', 'c', 'd', 'e', 'f'],
                expectedColumns: 4
            };
        case 'true-false':
            return {
                keywords: ['question', 'answer', 'correct', 'true', 'false'],
                expectedColumns: 2
            };
        case 'input':
            return {
                keywords: ['question', 'answer', 'response'],
                expectedColumns: 2
            };
        default:
            return { keywords: [], expectedColumns: 0 };
    }
}

function checkHeaderMatch(firstRow, headerPattern) {
    const rowText = firstRow.map(cell => {
        if (cell === null || cell === undefined) return '';
        return cell.toString().toLowerCase();
    }).join(' ');
    const keywordMatches = headerPattern.keywords.filter(keyword => 
        rowText.includes(keyword.toLowerCase())
    );
    
    const hasKeywords = keywordMatches.length >= 2;
    const hasExpectedColumns = firstRow.length >= headerPattern.expectedColumns;
    
    return {
        isLikelyHeader: hasKeywords && hasExpectedColumns
    };
}

// Data pattern recognition function
function recognizeExcelData(excelData, testType) {
    if (excelData.length === 0) {
        alert('No data rows found. Please check your Excel file.');
        return { recognized: false, data: [] };
    }
    
    // Check if data matches our expected format
    console.log(`🔍 Checking data pattern for test type: ${testType}`);
    console.log(`🔍 Excel data to validate:`, excelData);
    const recognitionResult = checkDataPattern(excelData, testType);
    console.log(`🔍 Recognition result:`, recognitionResult);
    
    if (!recognitionResult.matches) {
        // Data doesn't match our pattern - prompt user to review
        const message = `Your Excel file doesn't match the expected format.\n\n` +
                       `Required format:\n${getRequiredFormatForTestType(testType)}\n\n` +
                       `Please review your Excel file and make sure it follows this format exactly.\n\n` +
                       `Then try uploading again.`;
        
        console.log(`❌ Data pattern validation failed:`, message);
        alert(message);
        return { recognized: false, data: [] };
    }
    
    console.log(`✅ Data pattern validation passed for test type: ${testType}`);
    
    // Data matches our pattern - return it unchanged
    return { recognized: true, data: excelData };
}

function checkDataPattern(excelData, testType) {
    if (testType === 'multiple-choice') {
        // Check if each row has: Question + Correct Answer + Options
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            
            // Need at least 4 columns: Question + Correct Answer + Option A + Option B
            if (row.length < 4) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has ${row.length} columns but needs at least 4` 
                };
            }
            
            // Check if question exists
            if (!row[0] || row[0].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no question in column 1` 
                };
            }
            
            // Check if correct answer is valid
            const correctAnswer = row[1];
            if (!correctAnswer || !['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswer.toString().toUpperCase())) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has invalid correct answer "${correctAnswer}". Must be A, B, C, D, E, or F` 
                };
            }
            
            // Check if required options exist
            if (!row[2] || row[2].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no text for Option A (column 3)` 
                };
            }
            
            if (!row[3] || row[3].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no text for Option B (column 4)` 
                };
            }
        }
        
    } else if (testType === 'true-false') {
        // Check if each row has: Question + True/False
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            
            // Need at least 2 columns: Question + Answer
            if (row.length < 2) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has ${row.length} columns but needs 2` 
                };
            }
            
            // Check if question exists
            if (!row[0] || row[0].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no question in column 1` 
                };
            }
            
                    // Check if answer is valid using string normalization
        const answer = row[1];
        console.log(`🔍 Checking true/false answer: "${answer}" (type: ${typeof answer})`);

        // Normalize the answer to handle Excel's inconsistent data representation
        const normalizedAnswer = answer.toString().toLowerCase().trim();
        const isValidAnswer = normalizedAnswer === 'true' || normalizedAnswer === 'false';
        
        console.log(`🔍 Normalized answer: "${normalizedAnswer}"`);
        console.log(`🔍 Validation result: ${isValidAnswer}`);

        if (!isValidAnswer) {
            console.log(`❌ True/false validation failed for row ${i + 1}: "${answer}" (normalized: "${normalizedAnswer}")`);
            return { 
                matches: false, 
                issue: `Row ${i + 1} has invalid answer "${answer}". Must be TRUE or FALSE` 
            };
        }

        console.log(`✅ True/false validation passed for row ${i + 1}: "${answer}" (normalized: "${normalizedAnswer}")`);
        }
        
    } else if (testType === 'input') {
        // Check if each row has: Question + at least 1 Answer
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            
            // Need at least 2 columns: Question + Answer
            if (row.length < 2) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has ${row.length} columns but needs 2` 
                };
            }
            
            // Check if question exists
            if (!row[0] || row[0].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no question in column 1` 
                };
            }
            
            // Check if first answer exists
            if (!row[1] || row[1].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no answer in column 2` 
                };
            }
        }
    }
    
    // All rows passed the pattern check
    return { matches: true };
}

// Main Excel processing function
function processExcelDataForTestType(excelData, testType) {
    // First, check for headers
    const headerInfo = detectHeaders(excelData, testType);
    
    // Use the appropriate data rows (with or without headers)
    const dataRows = headerInfo.dataRows;
    
    if (dataRows.length === 0) {
        showNotification('No data rows found after header processing. Please check your Excel file.', 'error');
        // Clear file input to allow re-upload
        clearFileInputForTestType(testType);
        return;
    }
    
    // Now recognize the data pattern (without headers)
    console.log(`🔍 Processing Excel data for test type: ${testType}`);
    console.log(`🔍 Data rows after header processing:`, dataRows);
    const recognition = recognizeExcelData(dataRows, testType);
    console.log(`🔍 Recognition result:`, recognition);
    
    if (!recognition.recognized) {
        // Data wasn't recognized - user needs to fix their file
        console.log(`❌ Excel data recognition failed for test type: ${testType}`);
        // Clear file input to allow re-upload
        clearFileInputForTestType(testType);
        return;
    }
    
    console.log(`✅ Excel data recognition successful for test type: ${testType}`);
    
    // Data was recognized - check question count
    const excelQuestionCount = dataRows.length;
    const userQuestionCount = getQuestionCountForTestType(testType);
    
    if (excelQuestionCount !== userQuestionCount) {
        // Counts don't match - prompt user to fix
        const message = `Your Excel file has ${excelQuestionCount} data rows, but you specified ${userQuestionCount} questions.\n\n` +
                       `Please either:\n` +
                       `1. Change your question count to ${excelQuestionCount}, or\n` +
                       `2. Fix your Excel file to have exactly ${userQuestionCount} data rows\n\n` +
                       `Then try uploading again.`;
        
        showNotification(message, 'error');
        // Clear file input to allow re-upload
        clearFileInputForTestType(testType);
        return;
    }
    
    // Everything matches - use the data exactly as it is (without headers)
    populateFromExcelForTestType(dataRows, testType);
    
    // Show success message with header info
    let successMessage = `Excel data loaded successfully! ${excelQuestionCount} questions processed.`;
    if (headerInfo.hasHeaders) {
        successMessage += `\n\nNote: First row was detected as headers and removed.`;
    }
    
    showNotification(successMessage, 'success');
}

// Helper function to clear file input for a specific test type
function clearFileInputForTestType(testType) {
    const fileInput = document.querySelector(`.excel-file-input[data-test-type="${testType}"]`);
    if (fileInput) {
        fileInput.value = '';
        console.log(' File input cleared for:', testType);
    }
}

// Re-attach form event listeners that may have been lost during form recreation
function reattachFormEventListeners(testType) {
    console.log('🔍 Re-attaching form event listeners for:', testType);
    
    // Re-attach any event listeners that may have been lost
    // during form recreation by Excel population
    // This ensures form functionality is preserved
    
    switch (testType) {
        case 'multiple-choice':
            // Re-setup auto-save for newly created fields
            setupMultipleChoiceFormAutoSave();
            break;
        case 'true-false':
            // Re-setup auto-save for newly created fields
            setupTrueFalseFormAutoSave();
            break;
        case 'input':
            // Re-setup auto-save for newly created fields
            setupInputFormAutoSave();
            break;
    }
}

// Helper functions
function getQuestionCountForTestType(testType) {
    switch (testType) {
        case 'multiple-choice':
            return parseInt(document.getElementById('mcNumQuestions').value);
        case 'true-false':
            return parseInt(document.getElementById('tfNumQuestions').value);
        case 'input':
            return parseInt(document.getElementById('inputNumQuestions').value);
        default:
            return 0;
    }
}

function getRequiredFormatForTestType(testType) {
    switch (testType) {
        case 'multiple-choice':
            return `Multiple Choice Format:
Column 1: Question
Column 2: Correct Answer (A, B, C, D, E, or F)
Column 3: Option A text
Column 4: Option B text
Column 5: Option C text (if needed)
Column 6: Option D text (if needed)

Example with headers:
Question | Correct Answer | Option A | Option B | Option C | Option D
What is 2+2? | A | 4 | 5 | 6 | 7
What color is the sky? | B | Red | Blue | Green | Yellow

Example without headers:
What is 2+2? | A | 4 | 5 | 6 | 7
What color is the sky? | B | Red | Blue | Green | Yellow

Note: Headers are optional. If you include them, the first row will be automatically detected and removed.`;
            
        case 'true-false':
            return `True/False Format:
Column 1: Question
Column 2: Correct Answer (true or false)

Example with headers:
Question | Answer
The Earth is round | true
The sun is blue | false

Example without headers:
The Earth is round | true
The sun is blue | false

Note: Headers are optional. If you include them, the first row will be automatically detected and removed.`;
            
        case 'input':
            return `Input Test Format:
Column 1: Question
Column 2: Answer 1
Column 3: Answer 2 (optional)
Column 4: Answer 3 (optional)

Example with headers:
Question | Answer 1 | Answer 2 | Answer 3
What is the capital of France? | Paris | Paris, France | The capital of France is Paris

Example without headers:
What is the capital of France? | Paris | Paris, France | The capital of France is Paris

Note: Headers are optional. If you include them, the first row will be automatically detected and removed.`;
            
        default:
            return 'Unknown test type';
    }
}

// Data population functions
function populateFromExcelForTestType(excelData, testType) {
    switch (testType) {
        case 'multiple-choice':
            populateMultipleChoiceFromExcel(excelData);
            break;
        case 'true-false':
            populateTrueFalseFromExcel(excelData);
            break;
        case 'input':
            populateInputFromExcel(excelData);
            break;
    }
}



function populateMultipleChoiceFromExcel(excelData) {
    const container = document.getElementById('mcQuestionsContainer');
    container.innerHTML = '';
    
    // Get the number of options the user wants
    const userNumOptions = parseInt(document.getElementById('mcNumOptions').value);
    
    excelData.forEach((row, index) => {
        // Create question container using EXACT same structure as createMultipleChoiceQuestions
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${index + 1}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter your question here`;
        questionInput.id = `mc_question_${index + 1}`;
        questionInput.required = true;
        questionInput.value = row[0] || ''; // Set Excel question
        questionDiv.appendChild(questionInput);
        
        // Create options based on user's choice (A, B, C, D, E, F)
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'option-inputs';
        
        // Get the options array based on user's choice
        const allOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
        const userOptions = allOptions.slice(0, userNumOptions);
        
        userOptions.forEach((option, optIndex) => {
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.placeholder = `${option}`;
            optionInput.id = `mc_option_${index + 1}_${option}`;
            optionInput.required = true;
            
            // Get option text from Excel
            // Column 2 is correct answer, so options start from column 3
            const excelOptionText = row[optIndex + 2]; // +2 because column 1 is question, column 2 is correct answer
            optionInput.value = excelOptionText || '';
            
            optionsDiv.appendChild(optionInput);
        });
        
        questionDiv.appendChild(optionsDiv);
        
        // Create correct answer select
        const correctAnswerSelect = document.createElement('div');
        correctAnswerSelect.className = 'correct-answer-select';
        const correctAnswerLabel = document.createElement('label');
        correctAnswerLabel.textContent = 'Correct Answer:';
        correctAnswerSelect.appendChild(correctAnswerLabel);
        
        const select = document.createElement('select');
        select.id = `mc_correct_${index + 1}`;
        select.required = true;
        
        // Only show options that the user wants
        userOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option === row[1]) { // Column 2 is correct answer
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
        
        correctAnswerSelect.appendChild(select);
        questionDiv.appendChild(correctAnswerSelect);
        
        container.appendChild(questionDiv);
    });
    
    // Add save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveMultipleChoiceTest(
        document.getElementById('mcTestName').value, 
        excelData.length,
        userNumOptions
    );
    container.appendChild(saveBtn);
    
    // Setup auto-save
    setupMultipleChoiceFormAutoSave();
    
    // NEW: Re-attach any necessary event listeners
    reattachFormEventListeners('multiple-choice');
}

function populateTrueFalseFromExcel(excelData) {
    const container = document.getElementById('tfQuestionsContainer');
    container.innerHTML = '';
    
    excelData.forEach((row, index) => {
        // Create question container using EXACT same structure as createTrueFalseQuestions
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${index + 1}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter question ${index + 1}`;
        questionInput.id = `tf_question_${index + 1}`;
        questionInput.value = row[0] || ''; // Set Excel question
        
        // Add auto-save listener to match existing pattern
        questionInput.addEventListener('input', () => {
            console.log(`🔍 Auto-saving question ${index + 1} input`);
            saveFormDataForStep('trueFalseForm');
        });
        
        questionDiv.appendChild(questionInput);
        
        // Create correct answer select
        const correctAnswerSelect = document.createElement('div');
        correctAnswerSelect.className = 'correct-answer-select';
        const select = document.createElement('select');
        select.id = `tf_correct_${index + 1}`;
        
        // Add auto-save listener to match existing pattern
        select.addEventListener('change', () => {
            console.log(`🔍 Auto-saving correct answer ${index + 1} selection`);
            saveFormDataForStep('trueFalseForm');
        });
        
        const trueOption = document.createElement('option');
        trueOption.value = 'true';
        trueOption.textContent = 'True';
        select.appendChild(trueOption);
        
        const falseOption = document.createElement('option');
        falseOption.value = 'false';
        falseOption.textContent = 'False';
        select.appendChild(falseOption);
        
        // Use string normalization for consistent handling
        const excelAnswer = row[1];
        const normalizedAnswer = excelAnswer.toString().toLowerCase().trim();
        console.log(`🔍 Excel answer for row ${index + 1}: ${excelAnswer} (normalized: "${normalizedAnswer}")`);

        if (normalizedAnswer === 'true') {
            select.value = 'true';
            console.log(`🔍 Set form value to 'true' for Excel value: ${excelAnswer}`);
        } else if (normalizedAnswer === 'false') {
            select.value = 'false';
            console.log(`🔍 Set form value to 'false' for Excel value: ${excelAnswer}`);
        } else {
            console.log(`⚠️ Unexpected Excel value: ${excelAnswer}, leaving form unselected`);
        }
        
        correctAnswerSelect.appendChild(select);
        questionDiv.appendChild(correctAnswerSelect);
        
        container.appendChild(questionDiv);
    });
    
    // Add save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveTrueFalseTest(
        document.getElementById('tfTestName').value, 
        excelData.length
    );
    container.appendChild(saveBtn);
    
    // Setup auto-save
    setupTrueFalseFormAutoSave();
    
    // NEW: Re-attach any necessary event listeners
    reattachFormEventListeners('true-false');
}

function populateInputFromExcel(excelData) {
    const container = document.getElementById('inputQuestionsContainer');
    container.innerHTML = '';
    
    excelData.forEach((row, index) => {
        // Create question container using EXACT same structure as createInputQuestions
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-container';
        
        const questionTitle = document.createElement('h5');
        questionTitle.textContent = `Question ${index + 1}`;
        questionDiv.appendChild(questionTitle);
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.placeholder = `Enter question ${index + 1}`;
        questionInput.id = `input_question_${index + 1}`;
        questionInput.value = row[0] || ''; // Set Excel question
        
        // Add auto-save listener to match existing pattern
        questionInput.addEventListener('input', () => {
            console.log(`🔍 Auto-saving question ${index + 1} input`);
            saveFormDataForStep('inputForm');
        });
        
        questionDiv.appendChild(questionInput);
        
        // Create answers container using EXACT same structure
        const answersContainer = document.createElement('div');
        answersContainer.className = 'answers-container';
        answersContainer.id = `answers_container_${index + 1}`;
        
        // Create answer fields based on THIS specific row's data (no unnecessary empty fields)
        const thisRowAnswerCount = row.length - 1; // -1 because first column is question
        for (let answerIndex = 0; answerIndex < thisRowAnswerCount; answerIndex++) {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-input-group';
            
            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            
            if (answerIndex === 0) {
                answerInput.placeholder = `Correct answer for question ${index + 1}`;
            } else {
                answerInput.placeholder = `Alternative answer ${answerIndex + 1} for question ${index + 1}`;
            }
            
            answerInput.className = 'answer-input';
            answerInput.dataset.questionId = index + 1;
            answerInput.dataset.answerIndex = answerIndex;
            
            // Set value from Excel data if it exists, otherwise empty
            answerInput.value = row[answerIndex + 1] || '';
            
            // Add auto-save listener to match existing pattern
            answerInput.addEventListener('input', () => {
                console.log(`🔍 Auto-saving answer ${answerIndex + 1} for question ${index + 1}`);
                saveFormDataForStep('inputForm');
            });
            
            answerDiv.appendChild(answerInput);
            
            // For additional answers (not the first), add remove button
            if (answerIndex > 0) {
                const removeAnswerBtn = document.createElement('button');
                removeAnswerBtn.type = 'button';
                removeAnswerBtn.className = 'btn btn-sm btn-outline-danger remove-answer-btn';
                removeAnswerBtn.textContent = '× Remove';
                removeAnswerBtn.onclick = () => removeAnswerField(answerDiv);
                answerDiv.appendChild(removeAnswerBtn);
            }
            
            answersContainer.appendChild(answerDiv);
        }
        
        // Add answer button for manual addition of more answers
        const addAnswerBtn = document.createElement('button');
        addAnswerBtn.type = 'button';
        addAnswerBtn.className = 'btn btn-sm btn-outline-primary add-answer-btn';
        addAnswerBtn.textContent = '+ Add Answer';
        addAnswerBtn.onclick = () => addAnswerField(index + 1); // Use existing function
        
        // Find the last answer div to append the button to
        const lastAnswerDiv = answersContainer.lastElementChild;
        if (lastAnswerDiv) {
            lastAnswerDiv.appendChild(addAnswerBtn);
        }
        
        questionDiv.appendChild(answersContainer);
        container.appendChild(questionDiv);
    });
    
    // Add save button using existing pattern
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveInputTest(
        document.getElementById('inputTestName').value, 
        excelData.length
    );
    container.appendChild(saveBtn);
    
    // Setup auto-save for Excel-generated fields
    setupInputFormAutoSave();
    
    // NEW: Re-attach any necessary event listeners
    reattachFormEventListeners('input');
}


