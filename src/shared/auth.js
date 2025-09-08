
// IMPORTS - Functions this module needs from other shared modules
import { showSection, showNotification } from './ui.js'
import { sendRequest } from './utils.js'

/**
 * Initialize application session on page load
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
                // User has valid JWT session - role-based module loading will handle the rest
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

// EXPORTS - All authentication functions
export {
  checkFunctionAvailability,
  handleForceLogout, 
  initializeApplicationSession,
  studentLogin,
  teacherLogin,
  adminLogin,
  handleLoginResponse,
  handlePostLoginActions,
  handleLoginFailure,  
  handleUnifiedLogin,
  populateStudentInfo,
  populateTeacherInfo,
  initializeTeacherCabinet,
  checkTeacherSubjects,
  getCurrentTeacherId,
  getCurrentTeacherUsername,
  getCurrentAdmin,
  isAdmin,
  getCurrentAdminId,
  forceCompleteLogout,
  resetInterfaceAfterSessionClear,
  resetLoginForm,
  logout
}

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
    
    // Clear test progress to prevent cross-student data leakage
    window.clearTestLocalStorage();
     
    // CRITICAL FIX: Use the improved interface reset instead of just showSection
    resetInterfaceAfterSessionClear();
    
    console.log('✅ Logout completed - user session cleared, test data cleared, and interface reset');
}

// Student cabinet functionality
function populateStudentInfo(student) {
    console.log('=== populateStudentInfo called ===');
    console.log('Student object:', student);
    console.log('Student object keys:', Object.keys(student || {}));
    console.log('Student name:', student?.name);
    console.log('Student surname:', student?.surname);
    console.log('Student grade:', student?.grade);
    console.log('Student class:', student?.class);
    
    // Populate student name
    const studentNameElement = document.getElementById('studentName');
    console.log('studentNameElement found:', !!studentNameElement);
    if (studentNameElement) {
        const fullName = `${student?.name || ''} ${student?.surname || ''}`.trim();
        studentNameElement.textContent = fullName;
        console.log('Set student name to:', fullName);
    } else {
        console.error('studentNameElement not found!');
    }
    
    // Populate student grade
    const studentGradeElement = document.getElementById('studentGrade');
    console.log('studentGradeElement found:', !!studentGradeElement);
    if (studentGradeElement) {
        studentGradeElement.textContent = student?.grade || '';
        console.log('Set student grade to:', student?.grade);
    } else {
        console.error('studentGradeElement not found!');
    }
    
    // Populate student class
    const studentClassElement = document.getElementById('studentClass');
    console.log('studentClassElement found:', !!studentClassElement);
    if (studentClassElement) {
        studentClassElement.textContent = student?.class || '';
        console.log('Set student class to:', student?.class);
    } else {
        console.error('studentClassElement not found!');
    }
    
    console.log('Student info populated successfully');
    console.log('Student login successful - student module will handle data loading');
}

async function getCurrentTeacherId() {
    try {
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for teacher');
            return null;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        if (decoded && decoded.sub) {
            // Only handle teacher users
            if (decoded.role === 'teacher') {
                console.log(`[DEBUG] Found teacher ID from JWT: ${decoded.sub}`);
                return decoded.sub;
            } else {
                console.warn(`[WARN] Unsupported role for teacher function: ${decoded.role}`);
                return null;
            }
        } else {
            console.warn('[WARN] No teacher ID found in JWT token');
            return null;
        }
    } catch (error) {
        console.error('[ERROR] Error getting current teacher ID from JWT:', error);
        return null;
    }
}

// Admin-specific functions
function getCurrentAdmin() {
    const token = window.tokenManager.getToken();
    if (!token) return null;
    
    const decoded = window.tokenManager.decodeToken(token);
    if (!decoded || decoded.role !== 'admin') {
        throw new Error('getCurrentAdmin() called by non-admin user');
    }
    
    return {
        id: decoded.sub,
        username: decoded.username,
        role: decoded.role
    };
}

function isAdmin() {
    const token = window.tokenManager.getToken();
    if (!token) return false;
    const decoded = window.tokenManager.decodeToken(token);
    return decoded && decoded.role === 'admin';
}

function getCurrentAdminId() {
    try {
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for admin');
            return null;
        }
        
        const token = window.tokenManager.getAccessToken();
        if (!token) return null;
        
        const decoded = window.tokenManager.decodeToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return null;
        }
        
        return decoded.sub;
    } catch (error) {
        console.error('[ERROR] Error getting current admin ID:', error);
        return null;
    }
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

// Duplicate function removed - populateStudentInfo is already defined above

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

// Teacher cabinet functionality
function initializeTeacherCabinet() {
    // Populate teacher username
    populateTeacherInfo();
    
    // Note: Teacher-specific event listeners are now set up in teacher/index.js

    // Note: Teacher-specific confirmation modal buttons are set up in teacher/index.js
    
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

    // Note: loadSubjectsForDropdown is called in teacher module
    
                    // Check if teacher already has subjects in database
                checkTeacherSubjects();
    
    // Note: initializeTestCreation is called in teacher module
    
    // Note: initializeActiveTests is called in teacher module
}

// Duplicate function removed - initializeTeacherCabinet is already defined above

// Check if teacher already has subjects in database
async function checkTeacherSubjects() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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

// Note: showMainCabinetWithSubjects is now in teacher module

// JWT-based helper functions for user information

async function handlePostLoginActions(data, role) {
    switch (role) {
        case 'admin':
            console.log('Admin login successful, role:', data.role);
            showSection('admin-panel');
            
            // Load admin module after login
            console.log('Loading admin module after login...');
            if (typeof window.loadRoleBasedModule === 'function') {
                try {
                    await window.loadRoleBasedModule();
                    console.log('Admin module loaded successfully');
                } catch (error) {
                    console.error('[ERROR] Failed to load admin module:', error);
                }
            } else {
                console.error('[ERROR] loadRoleBasedModule not available');
            }
            break;
            
        case 'teacher':
            console.log('Teacher login successful, role:', data.role);
            console.log('Teacher data:', data.teacher);
            showSection('teacher-cabinet');
            
            // Load teacher module after login
            console.log('Loading teacher module after login...');
            if (typeof window.loadRoleBasedModule === 'function') {
                try {
                    await window.loadRoleBasedModule();
                    console.log('Teacher module loaded successfully');
                } catch (error) {
                    console.error('[ERROR] Failed to load teacher module:', error);
                }
            } else {
                console.error('[ERROR] loadRoleBasedModule not available');
            }
            
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
            console.log('Full response data:', JSON.stringify(data, null, 2));
            showSection('student-cabinet');
            
            // Load student module after login
            console.log('Loading student module after login...');
            if (typeof window.loadRoleBasedModule === 'function') {
                try {
                    await window.loadRoleBasedModule();
                    console.log('Student module loaded successfully');
                } catch (error) {
                    console.error('[ERROR] Failed to load student module:', error);
                }
            } else {
                console.error('[ERROR] loadRoleBasedModule not available');
            }
            
            // ✅ DEFENSIVE: Validate student functions exist
            console.log('Checking populateStudentInfo function availability:', typeof populateStudentInfo);
            if (typeof populateStudentInfo === 'function') {
                try {
                    // Populate student information from JWT token
                    console.log('About to call populateStudentInfo with data.student:', data.student);
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

function handleLoginFailure() {
    console.log('All login attempts failed');
    resetLoginForm();
    showNotification('Login failed. Please check your credentials and try again.', 'error');
}

async function handleUnifiedLogin(e) {
    e.preventDefault();
    
    // Check if we're forcing logout - prevent any login attempts
    if (window.forceLogout || window.preventAutoLogin) {
        console.log('⚠️ Login blocked - force logout in progress');
        showNotification('Please wait for the logout process to complete.', 'warning');
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
        showNotification('Login form error. Please refresh the page and try again.', 'error');
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

       // Try teacher login - allow any teacher in database
        const teacherResponse = await teacherLogin(credentials);
        const teacherData = await teacherResponse.json();
        if (await handleLoginResponse(teacherResponse, 'teacher', teacherData)) return;

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

// Make logout function available globally for HTML onclick handlers
window.logout = logout;
