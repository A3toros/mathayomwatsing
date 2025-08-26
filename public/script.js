// School Testing System - Main JavaScript File

// Global function availability check
console.log('🔧 Script loading - checking global functions...');
console.log('🔧 editUserRow available:', typeof editUserRow);
console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
console.log('🔧 deleteUser available:', typeof deleteUser);
console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
console.log('🔧 deleteSubject available:', typeof deleteSubject);

// Global variables
let currentUser = null;
let currentUserType = null;
let teacherSubjects = [];
let currentTestType = null;

// Local storage keys
const STORAGE_KEYS = {
    USER_SESSION: 'user_session',
    TEACHER_SUBJECTS: 'teacher_subjects',
    STUDENT_SUBJECTS: 'student_subjects',
    ADMIN_DATA: 'admin_data',
    FORM_DATA: 'form_data'
};

// DOM elements
const loginSection = document.getElementById('login-section');
const studentCabinet = document.getElementById('student-cabinet');
const teacherCabinet = document.getElementById('teacher-cabinet');
const adminPanel = document.getElementById('admin-panel');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Check function availability
    console.log('🔧 Checking function availability...');
    console.log('🔧 editUserRow available:', typeof editUserRow);
    console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
    console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
    console.log('🔧 deleteUser available:', typeof deleteUser);
    console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
    console.log('🔧 deleteSubject available:', typeof deleteSubject);
    
    // Check and clear expired local storage
    checkAndClearExpiredStorage();
    
    initializeEventListeners();
    
    // Check if user has an existing session
    console.log('Checking for existing session...');
    if (restoreUserSession()) {
        console.log('Session restored:', currentUserType, currentUser);
        // User has valid session, show appropriate section
        if (currentUserType === 'teacher') {
            showSection('teacher-cabinet');
            initializeTeacherCabinet();
        } else if (currentUserType === 'student') {
            showSection('student-cabinet');
            // Populate student information from restored session
            populateStudentInfo(currentUser);
        } else if (currentUserType === 'admin') {
            showSection('admin-panel');
            // Initialize admin panel if needed
        }
    } else {
        console.log('No valid session found, showing login');
        // No valid session, show login
        showSection('login-section');
    }
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

// Local Storage Functions
function saveToLocalStorage(key, data) {
    try {
        console.log('Saving to localStorage:', key, data);
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Successfully saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function saveFormData(formId, formData) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    saveToLocalStorage(key, formData);
}

function restoreFormData(formId) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    return getFromLocalStorage(key);
}

function clearFormData(formId) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error clearing form data:', error);
    }
}

function checkAndClearExpiredStorage() {
    try {
        // Check for expired sessions
        const sessionData = getFromLocalStorage(STORAGE_KEYS.USER_SESSION);
        if (sessionData && sessionData.timestamp) {
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionAge >= maxSessionAge) {
                // Session expired, clear all storage
                clearLocalStorage();
                console.log('Expired session cleared from local storage');
            }
        }
        
        // Check for old form data (older than 1 hour)
        const formDataKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEYS.FORM_DATA));
        formDataKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.timestamp) {
                    const dataAge = Date.now() - data.timestamp;
                    const maxFormDataAge = 60 * 60 * 1000; // 1 hour
                    
                    if (dataAge >= maxFormDataAge) {
                        localStorage.removeItem(key);
                        console.log('Expired form data cleared:', key);
                    }
                }
            } catch (error) {
                // If data is corrupted, remove it
                localStorage.removeItem(key);
                console.log('Corrupted form data removed:', key);
            }
        });
    } catch (error) {
        console.error('Error checking expired storage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        console.log('Reading from localStorage:', key);
        const data = localStorage.getItem(key);
        console.log('Raw data from localStorage:', data);
        const parsed = data ? JSON.parse(data) : null;
        console.log('Parsed data:', parsed);
        return parsed;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function clearLocalStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

function saveUserSession(userData, userType) {
    const sessionData = {
        user: userData,
        type: userType,
        timestamp: Date.now()
    };
    console.log('Saving user session:', sessionData);
    saveToLocalStorage(STORAGE_KEYS.USER_SESSION, sessionData);
}

function restoreUserSession() {
    console.log('Attempting to restore user session...');
    const sessionData = getFromLocalStorage(STORAGE_KEYS.USER_SESSION);
    console.log('Retrieved session data:', sessionData);
    
    if (sessionData && sessionData.user && sessionData.type) {
        // Check if session is not expired (24 hours)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        console.log('Session age:', sessionAge, 'ms, max age:', maxSessionAge, 'ms');
        
        if (sessionAge < maxSessionAge) {
            currentUser = sessionData.user;
            currentUserType = sessionData.type;
            console.log('Session restored successfully');
            return true;
        } else {
            console.log('Session expired, clearing storage');
            // Session expired, clear it
            clearLocalStorage();
        }
    } else {
        console.log('No valid session data found');
    }
    return false;
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
            // Restore saved form data
            const savedFormData = restoreFormData('login');
            if (savedFormData) {
                usernameInput.value = savedFormData.username || '';
                passwordInput.value = savedFormData.password || '';
            }
            
            // Save form data as user types
            usernameInput.addEventListener('input', () => {
                saveFormData('login', {
                    username: usernameInput.value,
                    password: passwordInput.value
                });
            });
            
            passwordInput.addEventListener('input', () => {
                saveFormData('login', {
                    username: usernameInput.value,
                    password: passwordInput.value
                });
            });
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
    const sections = ['login-section', 'student-cabinet', 'teacher-cabinet', 'admin-panel', 'passwordChangeSection'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.remove('active');
            console.log('Removed active from:', section);
        }
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Added active to:', sectionId);
        console.log('Target section element:', targetSection);
        console.log('Target section classes:', targetSection.className);
        
        // Debug: Check if sections are actually hidden/shown
        const allSections = document.querySelectorAll('.section');
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

// Unified login handler
async function handleUnifiedLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('Attempting login with:', username, password);

    let loginSuccess = false;

    // First, try admin login (admin usernames are typically short)
    if (username === 'admin') {
        try {
            console.log('Trying admin login...');
            const response = await fetch('/.netlify/functions/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Admin login response:', data);
            
            if (data.success) {
                currentUser = { username };
                currentUserType = 'admin';
                saveUserSession(currentUser, 'admin');
                clearFormData('login'); // Clear saved form data
                showSection('admin-panel');
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Admin login error:', error);
        }
    }

    // Try teacher login (check if it's a known teacher username)
    if (!loginSuccess && (username === 'Alex' || username === 'Charlie')) {
        try {
            console.log('Trying teacher login...');
            const response = await fetch('/.netlify/functions/teacher-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Teacher login response:', data);
            
            if (data.success) {
                currentUser = data.teacher;
                currentUserType = 'teacher';
                console.log('Teacher login successful, currentUser:', currentUser);
                console.log('Teacher ID type:', typeof currentUser.teacher_id);
                console.log('Teacher ID value:', currentUser.teacher_id);
                saveUserSession(currentUser, 'teacher');
                clearFormData('login'); // Clear saved form data
                showSection('teacher-cabinet');
                // Initialize teacher cabinet functionality
                setTimeout(() => {
                    initializeTeacherCabinet();
                    // Check if teacher already has subjects
                    checkTeacherSubjects();
                }, 100);
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Teacher login error:', error);
        }
    }

    // Finally, try student login (student IDs are numeric)
    if (!loginSuccess && /^\d+$/.test(username)) {
        try {
            console.log('Trying student login...');
            const response = await fetch('/.netlify/functions/student-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: username, password })
            });

            const data = await response.json();
            console.log('Student login response:', data);
            
            if (data.success) {
                currentUser = data.student;
                currentUserType = 'student';
                saveUserSession(currentUser, 'student');
                clearFormData('login'); // Clear saved form data
                showSection('student-cabinet');
                // Populate student information
                populateStudentInfo(data.student);
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Student login error:', error);
        }
    }

    // If no login succeeded, show error
    if (!loginSuccess) {
        alert('Login failed. Please check your credentials and try again.');
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
    loadStudentActiveTests(student.student_id);
    
    // Load test results for this student
    console.log('About to call loadStudentTestResults with student_id:', student.student_id);
    loadStudentTestResults(student.student_id);
}

// Load active tests for student
async function loadStudentActiveTests(studentId) {
    console.log('loadStudentActiveTests called with studentId:', studentId);
    
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
        const url = `/.netlify/functions/get-student-active-tests?student_id=${studentId}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Full response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('Successfully loaded tests, calling displayStudentActiveTests');
            displayStudentActiveTests(data.tests, studentId);
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
async function isTestCompleted(testType, testId, studentId) {
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
        const response = await fetch(`/.netlify/functions/check-test-completion?test_type=${testType}&test_id=${testId}&student_id=${studentId}`);
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
}

// Mark a test as completed
function markTestCompleted(testType, testId, studentId) {
    const key = `test_completed_${testType}_${testId}_${studentId}`;
    localStorage.setItem(key, 'true');
    console.log(`✅ Marked test ${testType}_${testId} as completed for student ${studentId}`);
    console.log(`💾 Saved to local storage with key: ${key}`);
}
// Display active tests for student
async function displayStudentActiveTests(tests, studentId) {
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
            const isCompleted = await isTestCompleted(test.test_type, test.test_id, studentId);
            console.log(`Test ${test.test_name} (${test.test_type}_${test.test_id}) completion status:`, isCompleted);
            return { ...test, isCompleted };
        });
        
        const testsWithCompletion = await Promise.all(completionChecks);
    
    // Sort by assigned_at desc (fallback: test_id desc)
    const sorted = [...testsWithCompletion].sort((a, b) => {
        const atA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
        const atB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
        if (atA !== atB) return atB - atA;
        return (b.test_id || 0) - (a.test_id || 0);
    });

    const top = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Compute average score from student's historical results
    let averagePct = null;
    try {
        const sessionRaw = localStorage.getItem('user_session');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const studentId = session && session.user ? session.user.student_id : null;
        if (studentId) {
            const res = await fetch(`/.netlify/functions/get-student-test-results?student_id=${studentId}`);
            const data = await res.json();
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
    } catch (_) {}

    const getAvgMessage = (pct) => {
        if (pct == null) return 'Good speed';
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
                        `<button class="btn btn-primary btn-sm start-test-btn" type="button" onclick="startTest('${test.test_type}', ${test.test_id})">Start</button>`
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
                 <!-- Light blue track -->
                 <circle class="avg-bg" cx="70" cy="70" r="${r}" stroke-width="12" fill="none"></circle>
                 <!-- Violet gradient progress on track -->
                 <circle class="avg-fg" cx="70" cy="70" r="${r}" stroke="url(#avgFillPB)" stroke-width="12" fill="none" stroke-linecap="round"
                     stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${dash.toFixed(2)}"></circle>
                <text x="70" y="76" text-anchor="middle" class="avg-text">${pct == null ? '--' : pct + '%'}</text>
            </svg>
            <div class="avg-message ${msgClass}">${getAvgMessage(pct)}</div>
        </div>
    `;

    container.innerHTML = html;

    // Bind expand/collapse
    const expandBtn = document.getElementById('studentActiveExpand');
    const collapseBtn = document.getElementById('studentActiveCollapse');
    const expandRow = document.getElementById('studentActiveExpandRow');
    const collapseRow = document.getElementById('studentActiveCollapseRow');
    const hiddenList = document.getElementById('studentActiveHidden');
    if (expandBtn && collapseBtn && hiddenList && expandRow && collapseRow) {
        expandBtn.addEventListener('click', () => {
            hiddenList.style.display = 'block';
            expandRow.style.display = 'none';
            collapseRow.style.display = 'block';
        });
        collapseBtn.addEventListener('click', () => {
            hiddenList.style.display = 'none';
            collapseRow.style.display = 'none';
            expandRow.style.display = 'block';
        });
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
async function loadStudentTestResults(studentId) {
    // Prevent multiple simultaneous calls
    if (isLoadingTestResults) {
        console.log('loadStudentTestResults already in progress, skipping duplicate call');
        return;
    }
    
    isLoadingTestResults = true;
    console.log('loadStudentTestResults called with studentId:', studentId);
    
    try {
        const url = `/.netlify/functions/get-student-test-results?student_id=${studentId}`;
        console.log('Fetching test results from URL:', url);
        
        const response = await fetch(url);
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

// Start test function - show test questions and answers
async function startTest(testType, testId) {
    console.log('startTest called with:', { testType, testId });
    
    // Get current user's student ID
    const currentUser = JSON.parse(localStorage.getItem('user_session'));
    if (!currentUser || !currentUser.user) {
        alert('User session not found. Please log in again.');
        return;
    }
    
    // Check if test is already completed
    const isCompleted = await isTestCompleted(testType, testId, currentUser.user.student_id);
    if (isCompleted) {
        alert('This test has already been completed. You cannot retake it.');
        return;
    }
    
    // Hide active tests section
    document.getElementById('studentActiveTests').style.display = 'none';
    
    // Show test view section with full-screen overlay effect
    const testViewSection = document.getElementById('testViewSection');
    testViewSection.style.display = 'block';
    
    // Add full-screen overlay class
    testViewSection.classList.add('test-view-fullscreen');
    
    // Load and display test questions
    loadTestQuestions(testType, testId);
}

// Load test questions and answers
async function loadTestQuestions(testType, testId) {
    try {
        console.log('loadTestQuestions called with:', { testType, testId });
        
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
            // Get current user's student ID
            const currentUser = JSON.parse(localStorage.getItem('user_session'));
            if (!currentUser || !currentUser.user) {
                alert('User session not found. Please log in again.');
                return;
            }
            
            // Double-check completion before displaying test
            const isCompleted = await isTestCompleted(testType, testId, currentUser.user.student_id);
            if (isCompleted) {
                alert('This test has already been completed. You cannot retake it.');
                // Return to active tests view
                document.getElementById('studentActiveTests').style.display = 'block';
                document.getElementById('testViewSection').style.display = 'none';
                document.getElementById('testViewSection').classList.remove('test-view-fullscreen');
                return;
            }
            
            console.log('Success! Calling displayTestQuestions with:', {
                test_info: data.test_info,
                questions_count: data.questions ? data.questions.length : 0,
                test_type: data.test_type
            });
            displayTestQuestions(data.test_info, data.questions, data.test_type, testId);
        } else {
            console.error('API returned error:', data.error);
            alert('Error loading test: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading test questions:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            testType,
            testId
        });
        alert('Error loading test. Please try again. Error: ' + error.message);
    }
}

// Local storage functions for test progress
function saveTestProgress(testType, testId, questionId, answer) {
    const key = `test_progress_${testType}_${testId}`;
    let progress = JSON.parse(localStorage.getItem(key) || '{}');
    progress[questionId] = answer;
    localStorage.setItem(key, JSON.stringify(progress));
    console.log(`Saved progress for question ${questionId}:`, answer);
}

function getTestProgress(testType, testId, questionId) {
    const key = `test_progress_${testType}_${testId}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{}');
    return progress[questionId] || null;
}

function clearTestProgress(testType, testId) {
    const key = `test_progress_${testType}_${testId}`;
    localStorage.removeItem(key);
    console.log(`Cleared progress for test ${testType}_${testId}`);
}

function lockTestInputs(locked = true) {
    // Only lock inputs in the test view section, not in test creation forms
    const testViewSection = document.querySelector('.test-view-section');
    if (!testViewSection) {
        console.log('🔍 No test view section found, skipping input locking');
        return;
    }
    
    const inputs = testViewSection.querySelectorAll('input[type="radio"], input[type="text"], .submit-test-btn');
    inputs.forEach(input => {
        if (locked) {
            input.disabled = true;
            input.style.opacity = '0.6';
            input.style.cursor = 'not-allowed';
        } else {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.cursor = 'auto';
        }
    });
    
    const submitBtn = document.querySelector('.submit-test-btn');
    if (submitBtn) {
        if (locked) {
            submitBtn.textContent = 'Submitting...';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            submitBtn.innerHTML = '<i class="submit-icon">📝</i> Submit Test';
            submitBtn.style.cursor = 'pointer';
        }
    }
}
// Display test questions and answers
function displayTestQuestions(testInfo, questions, testType, testId) {
    // Set test title
    document.getElementById('testViewTitle').textContent = testInfo.test_name;
    
    // Create test info bar with progress
    let infoBar = `
        <div class="test-info-bar">
            <span>Type: ${testType.replace('_', ' ').toUpperCase()}</span>
            <span>Questions: ${testInfo.num_questions}</span>
            ${testInfo.num_options ? `<span>Options: ${testInfo.num_options}</span>` : ''}
            <span>Created: ${new Date(testInfo.created_at).toLocaleDateString()}</span>
        </div>
        <div class="test-progress-section">
            <div class="test-progress-text">0/${testInfo.num_questions} questions answered (0%)</div>
            <div class="test-progress-container">
                <div class="test-progress-bar" style="width: 0%">0/${testInfo.num_questions} questions answered</div>
            </div>
        </div>
    `;
    
    // Create questions content
    let questionsContent = '';
    
    // For input tests with multiple answers, group questions by question_id
    let uniqueQuestions = questions;
    if (testType === 'input') {
        // Group questions by question_id and keep only unique questions
        const questionMap = new Map();
        questions.forEach(question => {
            if (!questionMap.has(question.question_id)) {
                questionMap.set(question.question_id, question);
            }
        });
        uniqueQuestions = Array.from(questionMap.values());
    }
    
    uniqueQuestions.forEach((question, index) => {
        // Get saved answer from local storage using question_id
        const savedAnswer = getTestProgress(testType, testId, question.question_id);
        
        questionsContent += `
            <div class="question-container">
                <h4>
                    <span class="question-number">${index + 1}</span>
                    Question ${index + 1}
                </h4>
                <div class="question-text">${question.question}</div>
                <div class="answer-section">
                    <h5>Your Answer</h5>
        `;
        
        if (testType === 'multiple_choice') {
            // Show interactive options for students to select
            // Limit options based on test creation (num_options)
            const allOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
            const numOptions = testInfo.num_options || allOptions.length;
            const options = allOptions.slice(0, numOptions);
            
            console.log(`🔍 Multiple Choice Test Setup:`);
            console.log(`  - Test has ${numOptions} options, showing: ${options.join(', ')}`);
            console.log(`  - Question ${question.question_id}: "${question.question}"`);
            console.log(`  - Question options data:`, question);
            
            questionsContent += '<ul class="options-list interactive">';
            
            options.forEach(option => {
                const optionValue = question[`option_${option.toLowerCase()}`];
                console.log(`  - Option ${option}: "${optionValue}" (type: ${typeof optionValue})`);
                
                // Always show the option since we're always sending the letter
                const isChecked = savedAnswer === option ? 'checked' : '';
                const displayText = optionValue || option; // Show letter if no text
                
                console.log(`  - Creating radio button: name="question_${question.question_id}", value="${option}", checked: ${isChecked}`);
                questionsContent += `
                    <li class="option-item" data-question="${question.question_id}" data-option="${option}">
                        <input type="radio" name="question_${question.question_id}" value="${option}" id="q${question.question_id}_${option}" data-question-id="${question.question_id}" ${isChecked}>
                        <label for="q${question.question_id}_${option}" class="${isChecked ? 'checked' : ''}">
                            <span class="option-letter">${option}</span>
                            <span class="option-text">${displayText}</span>
                        </label>
                    </li>
                `;
            });
            
            questionsContent += '</ul>';
            console.log(`🔍 Finished creating ${options.length} options for question ${question.question_id}`);
            
        } else if (testType === 'true_false') {
            // Show interactive true/false options
            const trueChecked = savedAnswer === 'true' ? 'checked' : '';
            const falseChecked = savedAnswer === 'false' ? 'checked' : '';
            questionsContent += `
                <div class="true-false-options">
                    <label class="tf-option ${trueChecked ? 'checked' : ''}">
                        <input type="radio" name="question_${question.question_id}" value="true" id="q${question.question_id}_true" data-question-id="${question.question_id}" ${trueChecked}>
                        <span class="tf-text">TRUE</span>
                    </label>
                    <label class="tf-option ${falseChecked ? 'checked' : ''}">
                        <input type="radio" name="question_${question.question_id}" value="false" id="q${question.question_id}_false" data-question-id="${question.question_id}" ${falseChecked}>
                        <span class="tf-text">FALSE</span>
                    </label>
                </div>
            `;
            
        } else if (testType === 'input') {
            // Show text input field with saved value
            questionsContent += `
                <div class="input-answer-field">
                    <input type="text" 
                           class="answer-input" 
                           placeholder="Type your answer here..."
                           data-question-id="${question.question_id}"
                           value="${savedAnswer || ''}"
                           maxlength="200">
                </div>
            `;
        }
        
        questionsContent += `
                </div>
            </div>
        `;
    });
    
    // Add submit button at the end
    questionsContent += `
        <div class="test-submit-section">
            <button class="btn btn-success submit-test-btn" onclick="submitTest('${testType}', ${testId})" disabled>
                <i class="submit-icon">📝</i>
                Submit Test
            </button>
        </div>
    `;
    
    // Update content
    document.getElementById('testViewContent').innerHTML = infoBar + questionsContent;
    
    // Add event listeners for saving progress
    addTestProgressListeners(testType, testId);
    
    // Add visual feedback for radio button selection
    if (testType === 'multiple_choice' || testType === 'true_false') {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                // Remove checked class from all labels in this question group
                const questionName = this.name;
                const allLabels = document.querySelectorAll(`input[name="${questionName}"]`);
                allLabels.forEach(rb => {
                    const label = rb.nextElementSibling;
                    if (label) {
                        label.classList.remove('checked');
                    }
                });
                
                // Add checked class to the selected label
                const selectedLabel = this.nextElementSibling;
                if (selectedLabel) {
                    selectedLabel.classList.add('checked');
                }
                
                console.log(`🔍 Radio button ${this.value} selected for question ${questionName}`);
            });
            
            // Set initial state for pre-checked radios
            if (radio.checked) {
                const label = radio.nextElementSibling;
                if (label) {
                    label.classList.add('checked');
                }
            }
        });
    }
    
    // Add event listener for back button
    const backBtn = document.getElementById('backToTestsBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            const testViewSection = document.getElementById('testViewSection');
            testViewSection.style.display = 'none';
            testViewSection.classList.remove('test-view-fullscreen');
            document.getElementById('studentActiveTests').style.display = 'block';
        };
    }
}
// Check if all questions are answered
function checkAllQuestionsAnswered() {
    const totalQuestions = document.querySelectorAll('.question-container').length;
    let answeredQuestions = 0;
    
    // Count answered questions
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    const textInputs = document.querySelectorAll('input[type="text"]');
    
    // Count radio button answers
    answeredQuestions += radioButtons.length;
    
    // Count text input answers (non-empty)
    textInputs.forEach(input => {
        if (input.value.trim() !== '') {
            answeredQuestions++;
        }
    });
    
    return answeredQuestions === totalQuestions;
}

// Update submit button state based on completion
function updateSubmitButtonState() {
    const submitBtn = document.querySelector('.submit-test-btn');
    if (!submitBtn) return;
    
    // Get the actual total questions from the test info (not DOM elements)
    const testInfoElement = document.querySelector('.test-info-bar span:nth-child(2)');
    let totalQuestions = 0;
    
    if (testInfoElement) {
        const questionsText = testInfoElement.textContent;
        const match = questionsText.match(/Questions: (\d+)/);
        if (match) {
            totalQuestions = parseInt(match[1]);
        }
        console.log('🔍 Test info element found, questions text:', questionsText, 'extracted count:', totalQuestions);
    }
    
    // Fallback to DOM count if test info not found
    if (totalQuestions === 0) {
        totalQuestions = document.querySelectorAll('.question-container').length;
        console.log('🔍 Using DOM count fallback, total questions:', totalQuestions);
    }
    
    console.log('🔍 Final total questions count:', totalQuestions);
    
    const answeredQuestions = getAnsweredQuestionsCount();
    const allAnswered = answeredQuestions === totalQuestions;
    
    console.log(`🔍 Progress Update: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`🔍 All questions answered: ${allAnswered}`);
    
    // Update progress indicator
    updateProgressIndicator(answeredQuestions, totalQuestions);
    
    if (allAnswered) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.title = 'Submit Test';
        
        // Remove warning styling from all questions
        document.querySelectorAll('.question-container').forEach(container => {
            container.classList.remove('unanswered');
        });
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.title = `Please answer all questions before submitting (${answeredQuestions}/${totalQuestions} answered)`;
        
        // Highlight unanswered questions
        highlightUnansweredQuestions();
    }
}

// Get count of answered questions
function getAnsweredQuestionsCount() {
    console.log('🔍 getAnsweredQuestionsCount called');
    
    let answeredCount = 0;
    
    // Count radio button answers - but only count unique questions, not individual options
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    console.log('🔍 Found checked radio buttons:', radioButtons.length);
    
    // Group radio buttons by question name to count unique questions
    const answeredQuestions = new Set();
    radioButtons.forEach(radio => {
        const questionName = radio.name;
        answeredQuestions.add(questionName);
        console.log(`🔍 Radio button for question: ${questionName}, value: ${radio.value}`);
    });
    
    console.log('🔍 Unique questions with radio answers:', answeredQuestions.size);
    answeredCount += answeredQuestions.size;
    
    // Count text input answers (non-empty) - only count unique questions
    const textInputs = document.querySelectorAll('input[type="text"][data-question-id]');
    const answeredTextQuestions = new Set();
    
    textInputs.forEach(input => {
        if (input.value.trim() !== '') {
            const questionId = input.dataset.questionId;
            answeredTextQuestions.add(questionId);
            console.log(`🔍 Text input answered for question: ${questionId}, value: ${input.value}`);
        }
    });
    
    console.log('🔍 Unique questions with text answers:', answeredTextQuestions.size);
    answeredCount += answeredTextQuestions.size;
    
    // Count select answers (for true/false tests) - only count unique questions with selected values
    const selectElements = document.querySelectorAll('select[data-question-id]');
    const answeredSelectQuestions = new Set();
    
    selectElements.forEach(select => {
        if (select.value && select.value !== '') {
            const questionId = select.dataset.questionId;
            answeredSelectQuestions.add(questionId);
            console.log(`🔍 Select answered for question: ${questionId}, value: ${select.value}`);
        }
    });
    
    console.log('🔍 Unique questions with select answers:', answeredSelectQuestions.size);
    answeredCount += answeredSelectQuestions.size;
    
    console.log('🔍 Total answered questions count:', answeredCount);
    return answeredCount;
}

// Update progress indicator
function updateProgressIndicator(answered, total) {
    const progressBar = document.querySelector('.test-progress-bar');
    if (!progressBar) return;
    
    const percentage = Math.round((answered / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${answered}/${total} questions answered`;
    
    // Update progress text
    const progressText = document.querySelector('.test-progress-text');
    if (progressText) {
        progressText.textContent = `${answered}/${total} questions answered (${percentage}%)`;
    }
}
// Highlight unanswered questions
function highlightUnansweredQuestions() {
    const questionContainers = document.querySelectorAll('.question-container');
    
    questionContainers.forEach((container, index) => {
        // For input tests, we need to get the question_id from the input field
        const textInput = container.querySelector('input[data-question-id]');
        let questionId;
        
        if (textInput) {
            questionId = textInput.dataset.questionId;
        } else {
            // For multiple choice/true-false, get the question_id from the radio button name
            const radioButton = container.querySelector('input[type="radio"]');
            if (radioButton) {
                questionId = radioButton.name.replace('question_', '');
            } else {
                questionId = index;
            }
        }
        
        const isAnswered = isQuestionAnswered(questionId);
        
        if (isAnswered) {
            container.classList.remove('unanswered');
        } else {
            container.classList.add('unanswered');
        }
    });
}

// Check if a specific question is answered
function isQuestionAnswered(questionIndex) {
    // Check radio buttons for this question
    const radioName = `question_${questionIndex}`;
    const radioChecked = document.querySelector(`input[name="${radioName}"]:checked`);
    if (radioChecked) return true;
    
    // Check text input for this question - use question_id for input tests
    const textInput = document.querySelector(`input[data-question-id="${questionIndex}"]`);
    if (textInput && textInput.value.trim() !== '') return true;
    
    // Check select element for this question (for true/false tests)
    const selectElement = document.querySelector(`select[data-question-id="${questionIndex}"]`);
    if (selectElement && selectElement.value && selectElement.value !== '') return true;
    
    return false;
}

// Add event listeners for saving test progress
function addTestProgressListeners(testType, testId) {
    // Radio button listeners for multiple choice and true/false
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    console.log(`🔍 Setting up ${radioButtons.length} radio button listeners`);
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log(`🔍 Radio button changed:`, {
                name: this.name,
                value: this.value,
                questionIndex: this.name.replace('question_', ''),
                parsedIndex: parseInt(this.name.replace('question_', ''))
            });
            
            const questionIndex = parseInt(this.name.replace('question_', ''));
            saveTestProgress(testType, testId, questionIndex, this.value);
            updateSubmitButtonState(); // Check completion after each answer
        });
    });
    
    // Text input listeners for input tests
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        let debounceTimer;
        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const questionId = parseInt(this.dataset.questionId);
                saveTestProgress(testType, testId, questionId, this.value);
                updateSubmitButtonState(); // Check completion after each answer
            }, 500); // Save after 500ms of no typing
        });
    });
    
    // Select listeners for true/false tests
    const selectElements = document.querySelectorAll('select[data-question-id]');
    selectElements.forEach(select => {
        select.addEventListener('change', function() {
            const questionId = parseInt(this.dataset.questionId);
            saveTestProgress(testType, testId, questionId, this.value);
            updateSubmitButtonState(); // Check completion after each answer
        });
    });
    
    // Initial state check
    updateSubmitButtonState();
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
    console.log('Populating teacher info:', currentUser);
    
    if (currentUser && currentUser.username) {
        // Populate teacher username in header
        const teacherUsernameElement = document.getElementById('teacherUsername');
        if (teacherUsernameElement) {
            teacherUsernameElement.textContent = currentUser.username;
        }
        
        // Populate teacher username in welcome message
        const welcomeTeacherUsernameElement = document.getElementById('welcomeTeacherUsername');
        if (welcomeTeacherUsernameElement) {
            welcomeTeacherUsernameElement.textContent = currentUser.username;
        }
        
        console.log('Teacher info populated successfully');
    } else {
        console.error('No teacher user data available');
    }
}



// Check if teacher already has subjects in database
async function checkTeacherSubjects() {
    console.log('checkTeacherSubjects called with teacher_id:', currentUser.teacher_id);
    try {
        const response = await fetch(`/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`);
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
        console.log('Loading existing subjects for display...');
        
        const response = await fetch(`/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`);
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
}

// Disable navigation buttons during test creation
function disableNavigationButtons() {
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
    console.log('🔍 🔴 saveTestCreationState called with step:', currentStep);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    const state = {
        isInTestCreation: true,
        currentStep: currentStep,
        timestamp: Date.now()
    };
    localStorage.setItem('test_creation_state', JSON.stringify(state));
    console.log('🔍 Saved test creation state:', state);
    
    // Also save form data for the current step
    console.log('🔍 🔴 About to call saveFormDataForStep with step:', currentStep);
    saveFormDataForStep(currentStep);
}
// Clear test creation state from localStorage
function clearTestCreationState() {
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
}

// Save form data for the current test creation step
function saveFormDataForStep(step) {
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
                        inputQuestions[i] = { question, answers };
                        console.log(`🔍 Saved question ${i}: "${question}" with ${answers.length} answers:`, answers);
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
// School Testing System - Main JavaScript File

// Global function availability check
console.log('🔧 Script loading - checking global functions...');
console.log('🔧 editUserRow available:', typeof editUserRow);
console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
console.log('🔧 deleteUser available:', typeof deleteUser);
console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
console.log('🔧 deleteSubject available:', typeof deleteSubject);

// Global variables
let currentUser = null;
let currentUserType = null;
let teacherSubjects = [];
let currentTestType = null;

// Local storage keys
const STORAGE_KEYS = {
    USER_SESSION: 'user_session',
    TEACHER_SUBJECTS: 'teacher_subjects',
    STUDENT_SUBJECTS: 'student_subjects',
    ADMIN_DATA: 'admin_data',
    FORM_DATA: 'form_data'
};

// DOM elements
const loginSection = document.getElementById('login-section');
const studentCabinet = document.getElementById('student-cabinet');
const teacherCabinet = document.getElementById('teacher-cabinet');
const adminPanel = document.getElementById('admin-panel');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Check function availability
    console.log('🔧 Checking function availability...');
    console.log('🔧 editUserRow available:', typeof editUserRow);
    console.log('🔧 editTeacherRow available:', typeof editTeacherRow);
    console.log('🔧 editSubjectRow available:', typeof editSubjectRow);
    console.log('🔧 deleteUser available:', typeof deleteUser);
    console.log('🔧 deleteTeacher available:', typeof deleteTeacher);
    console.log('🔧 deleteSubject available:', typeof deleteSubject);
    
    // Check and clear expired local storage
    checkAndClearExpiredStorage();
    
    initializeEventListeners();
    
    // Check if user has an existing session
    console.log('Checking for existing session...');
    if (restoreUserSession()) {
        console.log('Session restored:', currentUserType, currentUser);
        // User has valid session, show appropriate section
        if (currentUserType === 'teacher') {
            showSection('teacher-cabinet');
            initializeTeacherCabinet();
        } else if (currentUserType === 'student') {
            showSection('student-cabinet');
            // Populate student information from restored session
            populateStudentInfo(currentUser);
        } else if (currentUserType === 'admin') {
            showSection('admin-panel');
            // Initialize admin panel if needed
        }
    } else {
        console.log('No valid session found, showing login');
        // No valid session, show login
        showSection('login-section');
    }
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

// Local Storage Functions
function saveToLocalStorage(key, data) {
    try {
        console.log('Saving to localStorage:', key, data);
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Successfully saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function saveFormData(formId, formData) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    saveToLocalStorage(key, formData);
}

function restoreFormData(formId) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    return getFromLocalStorage(key);
}

function clearFormData(formId) {
    const key = `${STORAGE_KEYS.FORM_DATA}_${formId}`;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error clearing form data:', error);
    }
}

function checkAndClearExpiredStorage() {
    try {
        // Check for expired sessions
        const sessionData = getFromLocalStorage(STORAGE_KEYS.USER_SESSION);
        if (sessionData && sessionData.timestamp) {
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionAge >= maxSessionAge) {
                // Session expired, clear all storage
                clearLocalStorage();
                console.log('Expired session cleared from local storage');
            }
        }
        
        // Check for old form data (older than 1 hour)
        const formDataKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEYS.FORM_DATA));
        formDataKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.timestamp) {
                    const dataAge = Date.now() - data.timestamp;
                    const maxFormDataAge = 60 * 60 * 1000; // 1 hour
                    
                    if (dataAge >= maxFormDataAge) {
                        localStorage.removeItem(key);
                        console.log('Expired form data cleared:', key);
                    }
                }
            } catch (error) {
                // If data is corrupted, remove it
                localStorage.removeItem(key);
                console.log('Corrupted form data removed:', key);
            }
        });
    } catch (error) {
        console.error('Error checking expired storage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        console.log('Reading from localStorage:', key);
        const data = localStorage.getItem(key);
        console.log('Raw data from localStorage:', data);
        const parsed = data ? JSON.parse(data) : null;
        console.log('Parsed data:', parsed);
        return parsed;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function clearLocalStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

function saveUserSession(userData, userType) {
    const sessionData = {
        user: userData,
        type: userType,
        timestamp: Date.now()
    };
    console.log('Saving user session:', sessionData);
    saveToLocalStorage(STORAGE_KEYS.USER_SESSION, sessionData);
}

function restoreUserSession() {
    console.log('Attempting to restore user session...');
    const sessionData = getFromLocalStorage(STORAGE_KEYS.USER_SESSION);
    console.log('Retrieved session data:', sessionData);
    
    if (sessionData && sessionData.user && sessionData.type) {
        // Check if session is not expired (24 hours)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        console.log('Session age:', sessionAge, 'ms, max age:', maxSessionAge, 'ms');
        
        if (sessionAge < maxSessionAge) {
            currentUser = sessionData.user;
            currentUserType = sessionData.type;
            console.log('Session restored successfully');
            return true;
        } else {
            console.log('Session expired, clearing storage');
            // Session expired, clear it
            clearLocalStorage();
        }
    } else {
        console.log('No valid session data found');
    }
    return false;
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
            // Restore saved form data
            const savedFormData = restoreFormData('login');
            if (savedFormData) {
                usernameInput.value = savedFormData.username || '';
                passwordInput.value = savedFormData.password || '';
            }
            
            // Save form data as user types
            usernameInput.addEventListener('input', () => {
                saveFormData('login', {
                    username: usernameInput.value,
                    password: passwordInput.value
                });
            });
            
            passwordInput.addEventListener('input', () => {
                saveFormData('login', {
                    username: usernameInput.value,
                    password: passwordInput.value
                });
            });
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
    const sections = ['login-section', 'student-cabinet', 'teacher-cabinet', 'admin-panel', 'passwordChangeSection'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.remove('active');
            console.log('Removed active from:', section);
        }
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Added active to:', sectionId);
        console.log('Target section element:', targetSection);
        console.log('Target section classes:', targetSection.className);
        
        // Debug: Check if sections are actually hidden/shown
        const allSections = document.querySelectorAll('.section');
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

// Unified login handler
async function handleUnifiedLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('Attempting login with:', username, password);

    let loginSuccess = false;

    // First, try admin login (admin usernames are typically short)
    if (username === 'admin') {
        try {
            console.log('Trying admin login...');
            const response = await fetch('/.netlify/functions/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Admin login response:', data);
            
            if (data.success) {
                currentUser = { username };
                currentUserType = 'admin';
                saveUserSession(currentUser, 'admin');
                clearFormData('login'); // Clear saved form data
                showSection('admin-panel');
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Admin login error:', error);
        }
    }

    // Try teacher login (check if it's a known teacher username)
    if (!loginSuccess && (username === 'Alex' || username === 'Charlie')) {
        try {
            console.log('Trying teacher login...');
            const response = await fetch('/.netlify/functions/teacher-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Teacher login response:', data);
            
            if (data.success) {
                currentUser = data.teacher;
                currentUserType = 'teacher';
                console.log('Teacher login successful, currentUser:', currentUser);
                console.log('Teacher ID type:', typeof currentUser.teacher_id);
                console.log('Teacher ID value:', currentUser.teacher_id);
                saveUserSession(currentUser, 'teacher');
                clearFormData('login'); // Clear saved form data
                showSection('teacher-cabinet');
                // Initialize teacher cabinet functionality
                setTimeout(() => {
                    initializeTeacherCabinet();
                    // Check if teacher already has subjects
                    checkTeacherSubjects();
                }, 100);
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Teacher login error:', error);
        }
    }

    // Finally, try student login (student IDs are numeric)
    if (!loginSuccess && /^\d+$/.test(username)) {
        try {
            console.log('Trying student login...');
            const response = await fetch('/.netlify/functions/student-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: username, password })
            });

            const data = await response.json();
            console.log('Student login response:', data);
            
            if (data.success) {
                currentUser = data.student;
                currentUserType = 'student';
                saveUserSession(currentUser, 'student');
                clearFormData('login'); // Clear saved form data
                showSection('student-cabinet');
                // Populate student information
                populateStudentInfo(data.student);
                loginSuccess = true;
                return;
            }
        } catch (error) {
            console.error('Student login error:', error);
        }
    }

    // If no login succeeded, show error
    if (!loginSuccess) {
        alert('Login failed. Please check your credentials and try again.');
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
    loadStudentActiveTests(student.student_id);
    
    // Load test results for this student
    console.log('About to call loadStudentTestResults with student_id:', student.student_id);
    loadStudentTestResults(student.student_id);
}

// Load active tests for student
async function loadStudentActiveTests(studentId) {
    console.log('loadStudentActiveTests called with studentId:', studentId);
    
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
        const url = `/.netlify/functions/get-student-active-tests?student_id=${studentId}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Full response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('Successfully loaded tests, calling displayStudentActiveTests');
            displayStudentActiveTests(data.tests, studentId);
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
async function isTestCompleted(testType, testId, studentId) {
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
        const response = await fetch(`/.netlify/functions/check-test-completion?test_type=${testType}&test_id=${testId}&student_id=${studentId}`);
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
}

// Mark a test as completed
function markTestCompleted(testType, testId, studentId) {
    const key = `test_completed_${testType}_${testId}_${studentId}`;
    localStorage.setItem(key, 'true');
    console.log(`✅ Marked test ${testType}_${testId} as completed for student ${studentId}`);
    console.log(`💾 Saved to local storage with key: ${key}`);
}
// Display active tests for student
async function displayStudentActiveTests(tests, studentId) {
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
            const isCompleted = await isTestCompleted(test.test_type, test.test_id, studentId);
            console.log(`Test ${test.test_name} (${test.test_type}_${test.test_id}) completion status:`, isCompleted);
            return { ...test, isCompleted };
        });
        
        const testsWithCompletion = await Promise.all(completionChecks);
    
    // Sort by assigned_at desc (fallback: test_id desc)
    const sorted = [...testsWithCompletion].sort((a, b) => {
        const atA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
        const atB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
        if (atA !== atB) return atB - atA;
        return (b.test_id || 0) - (a.test_id || 0);
    });

    const top = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Compute average score from student's historical results
    let averagePct = null;
    try {
        const sessionRaw = localStorage.getItem('user_session');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const studentId = session && session.user ? session.user.student_id : null;
        if (studentId) {
            const res = await fetch(`/.netlify/functions/get-student-test-results?student_id=${studentId}`);
            const data = await res.json();
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
    } catch (_) {}

    const getAvgMessage = (pct) => {
        if (pct == null) return 'Good speed';
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
                        `<button class="btn btn-primary btn-sm start-test-btn" type="button" onclick="startTest('${test.test_type}', ${test.test_id})">Start</button>`
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
                 <!-- Light blue track -->
                 <circle class="avg-bg" cx="70" cy="70" r="${r}" stroke-width="12" fill="none"></circle>
                 <!-- Violet gradient progress on track -->
                 <circle class="avg-fg" cx="70" cy="70" r="${r}" stroke="url(#avgFillPB)" stroke-width="12" fill="none" stroke-linecap="round"
                     stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${dash.toFixed(2)}"></circle>
                <text x="70" y="76" text-anchor="middle" class="avg-text">${pct == null ? '--' : pct + '%'}</text>
            </svg>
            <div class="avg-message ${msgClass}">${getAvgMessage(pct)}</div>
        </div>
    `;

    container.innerHTML = html;

    // Bind expand/collapse
    const expandBtn = document.getElementById('studentActiveExpand');
    const collapseBtn = document.getElementById('studentActiveCollapse');
    const expandRow = document.getElementById('studentActiveExpandRow');
    const collapseRow = document.getElementById('studentActiveCollapseRow');
    const hiddenList = document.getElementById('studentActiveHidden');
    if (expandBtn && collapseBtn && hiddenList && expandRow && collapseRow) {
        expandBtn.addEventListener('click', () => {
            hiddenList.style.display = 'block';
            expandRow.style.display = 'none';
            collapseRow.style.display = 'block';
        });
        collapseBtn.addEventListener('click', () => {
            hiddenList.style.display = 'none';
            collapseRow.style.display = 'none';
            expandRow.style.display = 'block';
        });
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
async function loadStudentTestResults(studentId) {
    // Prevent multiple simultaneous calls
    if (isLoadingTestResults) {
        console.log('loadStudentTestResults already in progress, skipping duplicate call');
        return;
    }
    
    isLoadingTestResults = true;
    console.log('loadStudentTestResults called with studentId:', studentId);
    
    try {
        const url = `/.netlify/functions/get-student-test-results?student_id=${studentId}`;
        console.log('Fetching test results from URL:', url);
        
        const response = await fetch(url);
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

// Start test function - show test questions and answers
async function startTest(testType, testId) {
    console.log('startTest called with:', { testType, testId });
    
    // Get current user's student ID
    const currentUser = JSON.parse(localStorage.getItem('user_session'));
    if (!currentUser || !currentUser.user) {
        alert('User session not found. Please log in again.');
        return;
    }
    
    // Check if test is already completed
    const isCompleted = await isTestCompleted(testType, testId, currentUser.user.student_id);
    if (isCompleted) {
        alert('This test has already been completed. You cannot retake it.');
        return;
    }
    
    // Hide active tests section
    document.getElementById('studentActiveTests').style.display = 'none';
    
    // Show test view section with full-screen overlay effect
    const testViewSection = document.getElementById('testViewSection');
    testViewSection.style.display = 'block';
    
    // Add full-screen overlay class
    testViewSection.classList.add('test-view-fullscreen');
    
    // Load and display test questions
    loadTestQuestions(testType, testId);
}

// Load test questions and answers
async function loadTestQuestions(testType, testId) {
    try {
        console.log('loadTestQuestions called with:', { testType, testId });
        
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
            // Get current user's student ID
            const currentUser = JSON.parse(localStorage.getItem('user_session'));
            if (!currentUser || !currentUser.user) {
                alert('User session not found. Please log in again.');
                return;
            }
            
            // Double-check completion before displaying test
            const isCompleted = await isTestCompleted(testType, testId, currentUser.user.student_id);
            if (isCompleted) {
                alert('This test has already been completed. You cannot retake it.');
                // Return to active tests view
                document.getElementById('studentActiveTests').style.display = 'block';
                document.getElementById('testViewSection').style.display = 'none';
                document.getElementById('testViewSection').classList.remove('test-view-fullscreen');
                return;
            }
            
            console.log('Success! Calling displayTestQuestions with:', {
                test_info: data.test_info,
                questions_count: data.questions ? data.questions.length : 0,
                test_type: data.test_type
            });
            displayTestQuestions(data.test_info, data.questions, data.test_type, testId);
        } else {
            console.error('API returned error:', data.error);
            alert('Error loading test: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading test questions:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            testType,
            testId
        });
        alert('Error loading test. Please try again. Error: ' + error.message);
    }
}

// Local storage functions for test progress
function saveTestProgress(testType, testId, questionId, answer) {
    const key = `test_progress_${testType}_${testId}`;
    let progress = JSON.parse(localStorage.getItem(key) || '{}');
    progress[questionId] = answer;
    localStorage.setItem(key, JSON.stringify(progress));
    console.log(`Saved progress for question ${questionId}:`, answer);
}

function getTestProgress(testType, testId, questionId) {
    const key = `test_progress_${testType}_${testId}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{}');
    return progress[questionId] || null;
}

function clearTestProgress(testType, testId) {
    const key = `test_progress_${testType}_${testId}`;
    localStorage.removeItem(key);
    console.log(`Cleared progress for test ${testType}_${testId}`);
}

function lockTestInputs(locked = true) {
    // Only lock inputs in the test view section, not in test creation forms
    const testViewSection = document.querySelector('.test-view-section');
    if (!testViewSection) {
        console.log('🔍 No test view section found, skipping input locking');
        return;
    }
    
    const inputs = testViewSection.querySelectorAll('input[type="radio"], input[type="text"], .submit-test-btn');
    inputs.forEach(input => {
        if (locked) {
            input.disabled = true;
            input.style.opacity = '0.6';
            input.style.cursor = 'not-allowed';
        } else {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.cursor = 'auto';
        }
    });
    
    const submitBtn = document.querySelector('.submit-test-btn');
    if (submitBtn) {
        if (locked) {
            submitBtn.textContent = 'Submitting...';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            submitBtn.innerHTML = '<i class="submit-icon">📝</i> Submit Test';
            submitBtn.style.cursor = 'pointer';
        }
    }
}
// Display test questions and answers
function displayTestQuestions(testInfo, questions, testType, testId) {
    // Set test title
    document.getElementById('testViewTitle').textContent = testInfo.test_name;
    
    // Create test info bar with progress
    let infoBar = `
        <div class="test-info-bar">
            <span>Type: ${testType.replace('_', ' ').toUpperCase()}</span>
            <span>Questions: ${testInfo.num_questions}</span>
            ${testInfo.num_options ? `<span>Options: ${testInfo.num_options}</span>` : ''}
            <span>Created: ${new Date(testInfo.created_at).toLocaleDateString()}</span>
        </div>
        <div class="test-progress-section">
            <div class="test-progress-text">0/${testInfo.num_questions} questions answered (0%)</div>
            <div class="test-progress-container">
                <div class="test-progress-bar" style="width: 0%">0/${testInfo.num_questions} questions answered</div>
            </div>
        </div>
    `;
    
    // Create questions content
    let questionsContent = '';
    
    // For input tests with multiple answers, group questions by question_id
    let uniqueQuestions = questions;
    if (testType === 'input') {
        // Group questions by question_id and keep only unique questions
        const questionMap = new Map();
        questions.forEach(question => {
            if (!questionMap.has(question.question_id)) {
                questionMap.set(question.question_id, question);
            }
        });
        uniqueQuestions = Array.from(questionMap.values());
    }
    
    uniqueQuestions.forEach((question, index) => {
        // Get saved answer from local storage using question_id
        const savedAnswer = getTestProgress(testType, testId, question.question_id);
        
        questionsContent += `
            <div class="question-container">
                <h4>
                    <span class="question-number">${index + 1}</span>
                    Question ${index + 1}
                </h4>
                <div class="question-text">${question.question}</div>
                <div class="answer-section">
                    <h5>Your Answer</h5>
        `;
        
        if (testType === 'multiple_choice') {
            // Show interactive options for students to select
            // Limit options based on test creation (num_options)
            const allOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
            const numOptions = testInfo.num_options || allOptions.length;
            const options = allOptions.slice(0, numOptions);
            
            console.log(`🔍 Multiple Choice Test Setup:`);
            console.log(`  - Test has ${numOptions} options, showing: ${options.join(', ')}`);
            console.log(`  - Question ${question.question_id}: "${question.question}"`);
            console.log(`  - Question options data:`, question);
            
            questionsContent += '<ul class="options-list interactive">';
            
            options.forEach(option => {
                const optionValue = question[`option_${option.toLowerCase()}`];
                console.log(`  - Option ${option}: "${optionValue}" (type: ${typeof optionValue})`);
                
                // Always show the option since we're always sending the letter
                const isChecked = savedAnswer === option ? 'checked' : '';
                const displayText = optionValue || option; // Show letter if no text
                
                console.log(`  - Creating radio button: name="question_${question.question_id}", value="${option}", checked: ${isChecked}`);
                questionsContent += `
                    <li class="option-item" data-question="${question.question_id}" data-option="${option}">
                        <input type="radio" name="question_${question.question_id}" value="${option}" id="q${question.question_id}_${option}" data-question-id="${question.question_id}" ${isChecked}>
                        <label for="q${question.question_id}_${option}" class="${isChecked ? 'checked' : ''}">
                            <span class="option-letter">${option}</span>
                            <span class="option-text">${displayText}</span>
                        </label>
                    </li>
                `;
            });
            
            questionsContent += '</ul>';
            console.log(`🔍 Finished creating ${options.length} options for question ${question.question_id}`);
            
        } else if (testType === 'true_false') {
            // Show interactive true/false options
            const trueChecked = savedAnswer === 'true' ? 'checked' : '';
            const falseChecked = savedAnswer === 'false' ? 'checked' : '';
            questionsContent += `
                <div class="true-false-options">
                    <label class="tf-option ${trueChecked ? 'checked' : ''}">
                        <input type="radio" name="question_${question.question_id}" value="true" id="q${question.question_id}_true" data-question-id="${question.question_id}" ${trueChecked}>
                        <span class="tf-text">TRUE</span>
                    </label>
                    <label class="tf-option ${falseChecked ? 'checked' : ''}">
                        <input type="radio" name="question_${question.question_id}" value="false" id="q${question.question_id}_false" data-question-id="${question.question_id}" ${falseChecked}>
                        <span class="tf-text">FALSE</span>
                    </label>
                </div>
            `;
            
        } else if (testType === 'input') {
            // Show text input field with saved value
            questionsContent += `
                <div class="input-answer-field">
                    <input type="text" 
                           class="answer-input" 
                           placeholder="Type your answer here..."
                           data-question-id="${question.question_id}"
                           value="${savedAnswer || ''}"
                           maxlength="200">
                </div>
            `;
        }
        
        questionsContent += `
                </div>
            </div>
        `;
    });
    
    // Add submit button at the end
    questionsContent += `
        <div class="test-submit-section">
            <button class="btn btn-success submit-test-btn" onclick="submitTest('${testType}', ${testId})" disabled>
                <i class="submit-icon">📝</i>
                Submit Test
            </button>
        </div>
    `;
    
    // Update content
    document.getElementById('testViewContent').innerHTML = infoBar + questionsContent;
    
    // Add event listeners for saving progress
    addTestProgressListeners(testType, testId);
    
    // Add visual feedback for radio button selection
    if (testType === 'multiple_choice' || testType === 'true_false') {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                // Remove checked class from all labels in this question group
                const questionName = this.name;
                const allLabels = document.querySelectorAll(`input[name="${questionName}"]`);
                allLabels.forEach(rb => {
                    const label = rb.nextElementSibling;
                    if (label) {
                        label.classList.remove('checked');
                    }
                });
                
                // Add checked class to the selected label
                const selectedLabel = this.nextElementSibling;
                if (selectedLabel) {
                    selectedLabel.classList.add('checked');
                }
                
                console.log(`🔍 Radio button ${this.value} selected for question ${questionName}`);
            });
            
            // Set initial state for pre-checked radios
            if (radio.checked) {
                const label = radio.nextElementSibling;
                if (label) {
                    label.classList.add('checked');
                }
            }
        });
    }
    
    // Add event listener for back button
    const backBtn = document.getElementById('backToTestsBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            const testViewSection = document.getElementById('testViewSection');
            testViewSection.style.display = 'none';
            testViewSection.classList.remove('test-view-fullscreen');
            document.getElementById('studentActiveTests').style.display = 'block';
        };
    }
}
// Check if all questions are answered
function checkAllQuestionsAnswered() {
    const totalQuestions = document.querySelectorAll('.question-container').length;
    let answeredQuestions = 0;
    
    // Count answered questions
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    const textInputs = document.querySelectorAll('input[type="text"]');
    
    // Count radio button answers
    answeredQuestions += radioButtons.length;
    
    // Count text input answers (non-empty)
    textInputs.forEach(input => {
        if (input.value.trim() !== '') {
            answeredQuestions++;
        }
    });
    
    return answeredQuestions === totalQuestions;
}

// Update submit button state based on completion
function updateSubmitButtonState() {
    const submitBtn = document.querySelector('.submit-test-btn');
    if (!submitBtn) return;
    
    // Get the actual total questions from the test info (not DOM elements)
    const testInfoElement = document.querySelector('.test-info-bar span:nth-child(2)');
    let totalQuestions = 0;
    
    if (testInfoElement) {
        const questionsText = testInfoElement.textContent;
        const match = questionsText.match(/Questions: (\d+)/);
        if (match) {
            totalQuestions = parseInt(match[1]);
        }
        console.log('🔍 Test info element found, questions text:', questionsText, 'extracted count:', totalQuestions);
    }
    
    // Fallback to DOM count if test info not found
    if (totalQuestions === 0) {
        totalQuestions = document.querySelectorAll('.question-container').length;
        console.log('🔍 Using DOM count fallback, total questions:', totalQuestions);
    }
    
    console.log('🔍 Final total questions count:', totalQuestions);
    
    const answeredQuestions = getAnsweredQuestionsCount();
    const allAnswered = answeredQuestions === totalQuestions;
    
    console.log(`🔍 Progress Update: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`🔍 All questions answered: ${allAnswered}`);
    
    // Update progress indicator
    updateProgressIndicator(answeredQuestions, totalQuestions);
    
    if (allAnswered) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.title = 'Submit Test';
        
        // Remove warning styling from all questions
        document.querySelectorAll('.question-container').forEach(container => {
            container.classList.remove('unanswered');
        });
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.title = `Please answer all questions before submitting (${answeredQuestions}/${totalQuestions} answered)`;
        
        // Highlight unanswered questions
        highlightUnansweredQuestions();
    }
}

// Get count of answered questions
function getAnsweredQuestionsCount() {
    console.log('🔍 getAnsweredQuestionsCount called');
    
    let answeredCount = 0;
    
    // Count radio button answers - but only count unique questions, not individual options
    const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
    console.log('🔍 Found checked radio buttons:', radioButtons.length);
    
    // Group radio buttons by question name to count unique questions
    const answeredQuestions = new Set();
    radioButtons.forEach(radio => {
        const questionName = radio.name;
        answeredQuestions.add(questionName);
        console.log(`🔍 Radio button for question: ${questionName}, value: ${radio.value}`);
    });
    
    console.log('🔍 Unique questions with radio answers:', answeredQuestions.size);
    answeredCount += answeredQuestions.size;
    
    // Count text input answers (non-empty) - only count unique questions
    const textInputs = document.querySelectorAll('input[type="text"][data-question-id]');
    const answeredTextQuestions = new Set();
    
    textInputs.forEach(input => {
        if (input.value.trim() !== '') {
            const questionId = input.dataset.questionId;
            answeredTextQuestions.add(questionId);
            console.log(`🔍 Text input answered for question: ${questionId}, value: ${input.value}`);
        }
    });
    
    console.log('🔍 Unique questions with text answers:', answeredTextQuestions.size);
    answeredCount += answeredTextQuestions.size;
    
    // Count select answers (for true/false tests) - only count unique questions with selected values
    const selectElements = document.querySelectorAll('select[data-question-id]');
    const answeredSelectQuestions = new Set();
    
    selectElements.forEach(select => {
        if (select.value && select.value !== '') {
            const questionId = select.dataset.questionId;
            answeredSelectQuestions.add(questionId);
            console.log(`🔍 Select answered for question: ${questionId}, value: ${select.value}`);
        }
    });
    
    console.log('🔍 Unique questions with select answers:', answeredSelectQuestions.size);
    answeredCount += answeredSelectQuestions.size;
    
    console.log('🔍 Total answered questions count:', answeredCount);
    return answeredCount;
}

// Update progress indicator
function updateProgressIndicator(answered, total) {
    const progressBar = document.querySelector('.test-progress-bar');
    if (!progressBar) return;
    
    const percentage = Math.round((answered / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${answered}/${total} questions answered`;
    
    // Update progress text
    const progressText = document.querySelector('.test-progress-text');
    if (progressText) {
        progressText.textContent = `${answered}/${total} questions answered (${percentage}%)`;
    }
}
// Highlight unanswered questions
function highlightUnansweredQuestions() {
    const questionContainers = document.querySelectorAll('.question-container');
    
    questionContainers.forEach((container, index) => {
        // For input tests, we need to get the question_id from the input field
        const textInput = container.querySelector('input[data-question-id]');
        let questionId;
        
        if (textInput) {
            questionId = textInput.dataset.questionId;
        } else {
            // For multiple choice/true-false, get the question_id from the radio button name
            const radioButton = container.querySelector('input[type="radio"]');
            if (radioButton) {
                questionId = radioButton.name.replace('question_', '');
            } else {
                questionId = index;
            }
        }
        
        const isAnswered = isQuestionAnswered(questionId);
        
        if (isAnswered) {
            container.classList.remove('unanswered');
        } else {
            container.classList.add('unanswered');
        }
    });
}

// Check if a specific question is answered
function isQuestionAnswered(questionIndex) {
    // Check radio buttons for this question
    const radioName = `question_${questionIndex}`;
    const radioChecked = document.querySelector(`input[name="${radioName}"]:checked`);
    if (radioChecked) return true;
    
    // Check text input for this question - use question_id for input tests
    const textInput = document.querySelector(`input[data-question-id="${questionIndex}"]`);
    if (textInput && textInput.value.trim() !== '') return true;
    
    // Check select element for this question (for true/false tests)
    const selectElement = document.querySelector(`select[data-question-id="${questionIndex}"]`);
    if (selectElement && selectElement.value && selectElement.value !== '') return true;
    
    return false;
}

// Add event listeners for saving test progress
function addTestProgressListeners(testType, testId) {
    // Radio button listeners for multiple choice and true/false
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    console.log(`🔍 Setting up ${radioButtons.length} radio button listeners`);
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log(`🔍 Radio button changed:`, {
                name: this.name,
                value: this.value,
                questionIndex: this.name.replace('question_', ''),
                parsedIndex: parseInt(this.name.replace('question_', ''))
            });
            
            const questionIndex = parseInt(this.name.replace('question_', ''));
            saveTestProgress(testType, testId, questionIndex, this.value);
            updateSubmitButtonState(); // Check completion after each answer
        });
    });
    
    // Text input listeners for input tests
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        let debounceTimer;
        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const questionId = parseInt(this.dataset.questionId);
                saveTestProgress(testType, testId, questionId, this.value);
                updateSubmitButtonState(); // Check completion after each answer
            }, 500); // Save after 500ms of no typing
        });
    });
    
    // Select listeners for true/false tests
    const selectElements = document.querySelectorAll('select[data-question-id]');
    selectElements.forEach(select => {
        select.addEventListener('change', function() {
            const questionId = parseInt(this.dataset.questionId);
            saveTestProgress(testType, testId, questionId, this.value);
            updateSubmitButtonState(); // Check completion after each answer
        });
    });
    
    // Initial state check
    updateSubmitButtonState();
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
    console.log('Populating teacher info:', currentUser);
    
    if (currentUser && currentUser.username) {
        // Populate teacher username in header
        const teacherUsernameElement = document.getElementById('teacherUsername');
        if (teacherUsernameElement) {
            teacherUsernameElement.textContent = currentUser.username;
        }
        
        // Populate teacher username in welcome message
        const welcomeTeacherUsernameElement = document.getElementById('welcomeTeacherUsername');
        if (welcomeTeacherUsernameElement) {
            welcomeTeacherUsernameElement.textContent = currentUser.username;
        }
        
        console.log('Teacher info populated successfully');
    } else {
        console.error('No teacher user data available');
    }
}



// Check if teacher already has subjects in database
async function checkTeacherSubjects() {
    console.log('checkTeacherSubjects called with teacher_id:', currentUser.teacher_id);
    try {
        const response = await fetch(`/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`);
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
        console.log('Loading existing subjects for display...');
        
        const response = await fetch(`/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`);
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
}

// Disable navigation buttons during test creation
function disableNavigationButtons() {
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
    console.log('🔍 🔴 saveTestCreationState called with step:', currentStep);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    const state = {
        isInTestCreation: true,
        currentStep: currentStep,
        timestamp: Date.now()
    };
    localStorage.setItem('test_creation_state', JSON.stringify(state));
    console.log('🔍 Saved test creation state:', state);
    
    // Also save form data for the current step
    console.log('🔍 🔴 About to call saveFormDataForStep with step:', currentStep);
    saveFormDataForStep(currentStep);
}
// Clear test creation state from localStorage
function clearTestCreationState() {
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
}

// Save form data for the current test creation step
function saveFormDataForStep(step) {
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
                        inputQuestions[i] = { question, answers };
                        console.log(`🔍 Saved question ${i}: "${question}" with ${answers.length} answers:`, answers);
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
    
    if (!testName || !numQuestions || numQuestions < 1 || numQuestions > 100) {
        alert('Please enter a valid test name and number of questions (1-100)');
        return;
    }
    
    // Save form data before proceeding
    saveFormDataForStep('multipleChoiceForm');
    
    console.log('Calling createMultipleChoiceQuestions...');
    createMultipleChoiceQuestions(testName, numQuestions, numOptions, null);
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
        console.log('Teacher ID:', currentUser.teacher_id);
        console.log('Test Name:', testName);
        console.log('Number of Questions:', numQuestions);
        console.log('Number of Options:', numOptions);
        
        const testData = {
            teacher_id: currentUser.teacher_id,
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
        
        const response = await fetch('/.netlify/functions/save-multiple-choice-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response JSON:', result);
        
        if (result.success) {
            alert('Multiple choice test saved successfully!');
            console.log('Test saved with ID:', result.test_id);
            
            // Clear local storage after successful test creation
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
        console.log('Current User:', currentUser);
        
        const testData = {
            teacher_id: currentUser.teacher_id,
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
        
        const response = await fetch('/.netlify/functions/save-true-false-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
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
            
            // Clear local storage after successful test creation
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
    // Save form data before submitting
    saveFormDataForStep('inputForm');
    
    try {
        const testData = {
            teacher_id: currentUser.teacher_id,
            test_name: testName,
            num_questions: numQuestions,
            questions: []
        };
        
        for (let i = 1; i <= numQuestions; i++) {
            const question = document.getElementById(`input_question_${i}`).value;
            
            // Get all answers for this question
            const answersContainer = document.getElementById(`answers_container_${i}`);
            const answerInputs = answersContainer.querySelectorAll('.answer-input');
            const answers = [];
            
            answerInputs.forEach(input => {
                const answer = input.value.trim();
                if (answer) { // Only add non-empty answers
                    answers.push(answer);
                }
            });
            
            // Ensure at least one answer exists
            if (answers.length === 0) {
                alert(`Please provide at least one answer for question ${i}`);
                return;
            }
            
            testData.questions.push({
                question_id: i,
                question: question,
                correct_answers: answers
            });
        }
        
        const response = await fetch('/.netlify/functions/save-input-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Input test saved successfully!');
            
            // Clear local storage after successful test creation
            clearTestLocalStorage();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('input', result.test_id);
        } else {
            alert('Error saving test: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving input test:', error);
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
    console.log('🔍 showTestAssignment called for:', { testType, testId });
    
    // Check if we're returning from a successful assignment
    if (window.testAssignmentCompleted) {
        console.log('🔍 Test assignment already completed, not showing assignment interface again');
        window.testAssignmentCompleted = false; // Reset flag
        return;
    }
    
    console.log('🔍 Proceeding with test assignment interface...');
    
    // Ensure navigation buttons are disabled
    disableNavigationButtons();
    
    // Save current state
    saveTestCreationState('testAssignment');
    
    // Hide all test forms
    document.getElementById('multipleChoiceForm').style.display = 'none';
    document.getElementById('trueFalseForm').style.display = 'none';
    document.getElementById('inputTestForm').style.display = 'none';
    
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
    
    // Load teacher's available grades and classes
    loadTeacherGradesAndClasses(testType, testId);
}

// Load teacher's available grades and classes from teacher_subjects table
async function loadTeacherGradesAndClasses(testType, testId) {
    try {
        console.log('Loading teacher grades and classes for test assignment');
        console.log('Teacher ID:', currentUser.teacher_id);
        
        const url = `/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`;
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
    console.log('Teacher ID:', currentUser.teacher_id);
    
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
            teacher_id: currentUser.teacher_id,
            test_type: test_type_map[testType],
            test_id: testId,
            assignments: selectedGradesClasses
        };
        
        console.log('Request body:', requestBody);
        
        const response = await fetch('/.netlify/functions/assign-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
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
        const url = `/.netlify/functions/get-teacher-active-tests?teacher_id=${currentUser.teacher_id}`;
        const response = await fetch(url);
        
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
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.style.display = 'block';
    }
}

// Hide edit subjects button
function hideEditSubjectsButton() {
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
    
    // Get teacher's assigned grades and classes from database
    const teacherId = getCurrentTeacherId();
    if (!teacherId) {
        console.error('No teacher ID found');
        return;
    }
    
    try {
        const response = await fetch(`/.netlify/functions/get-teacher-assignments?teacher_id=${teacherId}`);
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
    console.log('loadClassResults called with:', { grade, classNum, semester, teacher_id: currentUser.teacher_id });
    
    try {
        const url = `/.netlify/functions/get-class-results?grade=${grade}&class=${classNum}&semester=${semester}&teacher_id=${currentUser.teacher_id}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
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
                // Extract only the tests that belong to this subject
                const subjectTests = [];
                if (subjectResults.length > 0) {
                    // Get all test keys from the first student that has results
                    const studentWithResults = subjectResults.find(student => student.has_results);
                    if (studentWithResults) {
                        Object.keys(studentWithResults).forEach(key => {
                            if (!['student_id', 'name', 'surname', 'nickname', 'number', 'has_results', 'subject'].includes(key)) {
                                // This is a test result, add it to subject tests
                                subjectTests.push({
                                    test_name: key,
                                    test_type: 'unknown',
                                    key: key
                                });
                            }
                        });
                    }
                }
                
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



// Helper function to get current teacher ID from session
function getCurrentTeacherId() {
    const session = localStorage.getItem('user_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            if (sessionData.type === 'teacher' && sessionData.user && sessionData.user.teacher_id) {
                return sessionData.user.teacher_id;
            }
        } catch (e) {
            console.error('Error parsing session data:', e);
        }
    }
    return null;
}

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
        const response = await fetch('/.netlify/functions/get-all-users');
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
        const response = await fetch('/.netlify/functions/get-all-teachers');
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
        const response = await fetch('/.netlify/functions/get-all-subjects');
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
    // Clear local storage
    clearLocalStorage();
    
    // Reset global variables
    currentUser = null;
    currentUserType = null;
    teacherSubjects = [];
    currentTestType = null;
    
    // Show login section
    showSection('login-section');
}

// Student cabinet functionality
async function loadStudentData() {
    try {
        const response = await fetch(`/.netlify/functions/get-student-subjects?student_id=${currentUser.student_id}`);
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
    try {
        const response = await fetch(`/.netlify/functions/get-teacher-subjects?teacher_id=${currentUser.teacher_id}`);
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
        console.log('Sending subjects to save:', selectedSubjects);
        const response = await fetch('/.netlify/functions/save-teacher-subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacher_id: currentUser.teacher_id,
                subjects: selectedSubjects
            })
        });
        
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
    const subjectSelection = document.getElementById('subject-selection-container');
    const mainCabinet = document.getElementById('main-cabinet-container');
    
    if (subjectSelection) subjectSelection.style.display = 'none';
    if (mainCabinet) mainCabinet.style.display = 'block';
    
    displayGradeButtons();
}

function displayGradeButtons() {
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
    
    try {
        const response = await fetch(`/.netlify/functions/get-class-results?grade=${grade}&class=${className}&semester=1&teacher_id=${currentUser.teacher_id}`);
        const data = await response.json();
        
        if (data.success) {
            displayClassResultsAdmin(data.results, grade, className);
        }
    } catch (error) {
        console.error('Error loading class results:', error);
    }
}

function displayClassResultsAdmin(results, grade, className) {
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
    // Load initial admin data
    await loadAllTeachers();
    await loadAllSubjects();
    await loadAcademicYear();
    await loadAllUsers();
}

async function loadAllTeachers() {
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
    try {
        const response = await fetch('/.netlify/functions/get-all-subjects');
        const data = await response.json();
        
        if (data.success) {
            displayAllSubjects(data.subjects);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function displayAllSubjects(subjects) {
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
    try {
        const response = await fetch('/.netlify/functions/get-academic-year');
        const data = await response.json();
        
        if (data.success) {
            displayAcademicYear(data.academic_years);
        }
    } catch (error) {
        console.error('Error loading academic year:', error);
    }
}

function displayAcademicYear(academicYears) {
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
    console.log('🔧 DEBUG: Current user teacher_id:', currentUser.teacher_id);
    
    try {
        const url = `/.netlify/functions/get-teacher-active-tests?teacher_id=${currentUser.teacher_id}`;
        console.log('🔧 DEBUG: Fetching from URL:', url);
        
        const response = await fetch(url);
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
            teacherId: currentUser.teacher_id
        });
    }
}
// Display teacher's active tests
function displayTeacherActiveTests(tests) {
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
                let daysClass = '';
                if (daysRemaining <= 7) daysClass = 'danger';
                else if (daysRemaining <= 14) daysClass = 'warning';
                
                html += `
                    <div class="assignment-item">
                        <div class="assignment-info">
                            <strong>Grade ${assignment.grade}, Class ${assignment.class}</strong>
                            <br>
                            <small>Assigned: ${new Date(assignment.assigned_at).toLocaleDateString()}</small>
                            <span class="days-remaining ${daysClass}">${daysRemaining} days remaining</span>
                        </div>
                        <div class="assignment-actions">
                            <button class="btn btn-danger btn-sm remove-assignment-btn" onclick="event.stopPropagation(); removeClassAssignment('${test.test_type}', ${test.test_id}, ${assignment.assignment_id}, '${test.test_name}', '${assignment.grade}', '${assignment.class}')">
                                Delete Test
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
    console.log('Remove class assignment called with:', { testType, testId, assignmentId, testName, grade, className });
    
    try {
        // Professional confirmation dialog
        if (!confirm(`Remove Assignment Confirmation

Test: ${testName}
Class: Grade ${grade}, Class ${className}

This will remove this test assignment for the specified class only. Students in this class will no longer see or be able to take this test.

Are you sure you want to proceed?

Click "OK" to remove the assignment or "Cancel" to keep it.`)) {
            return;
        }
        
        // Proceed with individual assignment removal
        const response = await fetch('/.netlify/functions/remove-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacher_id: currentUser.teacher_id,
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
            alert(`Assignment removed successfully.

Test: ${testName}
Class: Grade ${grade}, Class ${className}

Students in this class can no longer access this test.`);
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
    // Placeholder for editing teacher
    console.log('Edit teacher:', teacherId);
    alert('Edit teacher functionality - to be implemented');
}

// Menu toggle function - REMOVED DUPLICATE

// Submit test and show results
async function submitTest(testType, testId) {
    console.log('🚀 submitTest function called!');
    console.log('Parameters:', { testType, testId });
    
    try {
        console.log('Setting up loading state...');
        
        // Get current user info first
        const currentUser = JSON.parse(localStorage.getItem('user_session'));
        if (!currentUser || !currentUser.user) {
            throw new Error('User session not found');
        }
        
        // Double-check that test hasn't been completed already
        const isCompleted = await isTestCompleted(testType, testId, currentUser.user.student_id);
        if (isCompleted) {
            alert('This test has already been completed. You cannot submit it again.');
            lockTestInputs(false);
            return;
        }
        
        // Lock all inputs during submission
        console.log('Locking test inputs...');
        lockTestInputs(true);
        
        // Show loading state
        const submitBtn = document.querySelector('.submit-test-btn');
        console.log('Submit button found:', submitBtn);
        
        // Collect student answers
        const studentAnswers = collectStudentAnswers(testType);
        
        // Calculate score by comparing with correct answers
        const response = await fetch(`/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to load test questions for scoring');
        }
        
        const questions = data.questions;
        
        // Function to clean answer text (same rules as backend)
        function cleanAnswerText(text) {
            if (!text || typeof text !== 'string') return '';
            
            return text
                .trim()                           // Remove leading/trailing spaces
                .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
                .toLowerCase()                    // Convert to lowercase
                .replace(/[.,]/g, '')            // Remove dots and commas
                .replace(/-/g, ' ')              // Replace hyphens with spaces
                .replace(/\s+/g, ' ')            // Clean up any double spaces created
                .trim();                          // Final trim
        }
        
        // For input tests with multiple answers, determine unique questions count
        let totalQuestions, uniqueQuestions;
        if (testType === 'input') {
            // Group questions by question_id to get unique questions
            const questionMap = new Map();
            questions.forEach(question => {
                if (!questionMap.has(question.question_id)) {
                    questionMap.set(question.question_id, question);
                }
            });
            uniqueQuestions = Array.from(questionMap.values());
            totalQuestions = uniqueQuestions.length;
        } else {
            totalQuestions = questions.length;
            uniqueQuestions = questions;
        }
        
        let correctAnswers = 0;
        
        console.log('=== SCORING DEBUG ===');
        console.log('Questions array:', questions);
        console.log('Unique questions:', uniqueQuestions);
        console.log('Total questions:', totalQuestions);
        console.log('Student answers:', studentAnswers);
        
        uniqueQuestions.forEach((question, index) => {
            const studentAnswer = studentAnswers[question.question_id];
            
            console.log(`🔍 Scoring question ${question.question_id}:`);
            console.log(`  - Question text: "${question.question}"`);
            console.log(`  - Student answer: "${studentAnswer}"`);
            console.log(`  - Question ID: ${question.question_id}`);
            console.log(`  - Student answers object:`, studentAnswers);
            console.log(`  - Full question object:`, question);
            console.log(`  - Question keys:`, Object.keys(question));
            
            if (testType === 'multiple_choice' || testType === 'true_false') {
                console.log(`  - Student answer type: ${typeof studentAnswer}, value: "${studentAnswer}"`);
                console.log(`  - Correct answer type: ${typeof question.correct_answer}, value: "${question.correct_answer}"`);
                console.log(`  - Direct comparison: ${studentAnswer === question.correct_answer}`);
                console.log(`  - String comparison: ${String(studentAnswer) === String(question.correct_answer)}`);
                
                if (String(studentAnswer) === String(question.correct_answer)) {
                    correctAnswers++;
                    console.log(`  ✅ Multiple choice/True-false correct!`);
                } else {
                    console.log(`  ❌ Multiple choice/True-false incorrect. Expected: "${question.correct_answer}"`);
                }
            } else if (testType === 'input') {
                // For input tests, clean student answer and check against all correct answers
                if (studentAnswer) {
                    const cleanedStudentAnswer = cleanAnswerText(studentAnswer);
                    console.log(`  - Cleaned student answer: "${cleanedStudentAnswer}"`);
                    
                    // Get all correct answers for this question from the database
                    const questionAnswers = questions.filter(q => q.question_id === question.question_id);
                    console.log(`  - Found ${questionAnswers.length} correct answers for this question:`, questionAnswers.map(q => q.correct_answer));
                    
                    let isCorrect = false;
                    for (const q of questionAnswers) {
                        const cleanedCorrectAnswer = cleanAnswerText(q.correct_answer);
                        console.log(`  - Checking against: "${cleanedCorrectAnswer}"`);
                        if (cleanedStudentAnswer === cleanedCorrectAnswer) {
                            isCorrect = true;
                            console.log(`  ✅ Match found!`);
                            break;
                        }
                    }
                    
                    if (isCorrect) {
                        correctAnswers++;
                        console.log(`  ✅ Input test correct! Total correct: ${correctAnswers}`);
                    } else {
                        console.log(`  ❌ Input test incorrect. No matches found.`);
                    }
                } else {
                    console.log(`  ❌ No student answer provided for this question`);
                }
            }
        });
        
        const score = correctAnswers;
        const maxScore = totalQuestions;
        
        // Save test results to database
        console.log('=== DEBUGGING TEST SUBMISSION ===');
        console.log('Student ID:', currentUser.user.student_id);
        console.log('Test Type:', testType);
        console.log('Test ID:', testId);
        console.log('Student Answers:', studentAnswers);
        console.log('Score:', score);
        console.log('Max Score:', maxScore);
        console.log('Request URL:', '/.netlify/functions/submit-test-results');
        
        const requestBody = {
            student_id: currentUser.user.student_id,
            test_type: testType,
            test_id: testId,
            student_answers: studentAnswers,
            score: score,
            max_score: maxScore
        };
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        
        console.log('Making fetch request to submit-test-results...');
        const saveResponse = await fetch('/.netlify/functions/submit-test-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Fetch response received:');
        console.log('Response status:', saveResponse.status);
        console.log('Response ok:', saveResponse.ok);
        console.log('Response headers:', saveResponse.headers);
        
        if (!saveResponse.ok) {
            console.error('HTTP Error:', saveResponse.status, saveResponse.statusText);
            const errorText = await saveResponse.text();
            console.error('Error response body:', errorText);
            throw new Error(`HTTP ${saveResponse.status}: ${saveResponse.statusText}`);
        }
        
        console.log('Parsing response JSON...');
        const saveData = await saveResponse.json();
        console.log('Parsed save data:', saveData);
        
        if (!saveData.success) {
            console.error('Save failed:', saveData);
            throw new Error('Failed to save test results: ' + (saveData.error || saveData.details || 'Unknown error'));
        }
        
        console.log('✅ Test results saved successfully! Result ID:', saveData.result_id);
        
        // Clear test progress from local storage
        clearTestProgress(testType, testId);
        
        // Mark test as completed
        markTestCompleted(testType, testId, currentUser.user.student_id);
        
        // Mark test as completed in the UI without page reload
        markTestCompletedInUI(testType, testId);
        
        // Reload student test results to show the new result
        console.log('🔄 Reloading student test results...');
        if (typeof loadStudentTestResults === 'function') {
            const currentUser = JSON.parse(localStorage.getItem('user_session'));
            if (currentUser && currentUser.user) {
                loadStudentTestResults(currentUser.user.student_id);
            }
        } else {
            console.warn('loadStudentTestResults function not found');
        }
        
        // Show results with student answers
        showTestResults(testType, testId, studentAnswers);
        
    } catch (error) {
        console.error('Error submitting test:', error);
        alert('Error submitting test: ' + error.message);
        
        // Re-enable inputs on error
        lockTestInputs(false);
    }
}

// Collect student answers from the form
function collectStudentAnswers(testType) {
    console.log('🔍 collectStudentAnswers called with testType:', testType);
    const answers = {};
    
    if (testType === 'multiple_choice' || testType === 'true_false') {
        // Get all radio button selections
        const radioGroups = document.querySelectorAll('input[type="radio"]:checked');
        console.log('Found radio groups:', radioGroups.length);
        radioGroups.forEach(radio => {
            const questionId = radio.name.replace('question_', '');
            answers[questionId] = radio.value;
            console.log(`Question ${questionId}: ${radio.value}`);
        });
    } else if (testType === 'input') {
        // Get all text input values from the test-taking interface
        const textInputs = document.querySelectorAll('input[type="text"][data-question-id]');
        console.log('Found text inputs:', textInputs.length);
        textInputs.forEach(input => {
            const questionId = input.dataset.questionId;
            answers[questionId] = input.value.trim();
            console.log(`Question ${questionId}: ${input.value.trim()}`);
        });
    }
    
    console.log('Collected answers:', answers);
    return answers;
}

// Show test results
async function showTestResults(testType, testId, studentAnswers) {
    try {
        // Load test questions again to show results
        const response = await fetch(`/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`);
        const data = await response.json();
        
        if (data.success) {
            displayTestResults(data.test_info, data.questions, data.test_type, studentAnswers);
        } else {
            alert('Error loading test results: ' + data.error);
        }
    } catch (error) {
        console.error('Error loading test results:', error);
        alert('Error loading test results. Please try again.');
    }
}
// Display test results
function displayTestResults(testInfo, questions, testType, studentAnswers) {
    // Update header to show results
    document.getElementById('testViewTitle').textContent = `${testInfo.test_name} - Results`;
    
    // Calculate score
    let correctAnswers = 0;
    
    // For input tests with multiple answers, determine unique questions count
    let totalQuestions, uniqueQuestions;
    if (testType === 'input') {
        // Group questions by question_id to get unique questions
        const questionMap = new Map();
        questions.forEach(question => {
            if (!questionMap.has(question.question_id)) {
                questionMap.set(question.question_id, question);
            }
        });
        uniqueQuestions = Array.from(questionMap.values());
        totalQuestions = uniqueQuestions.length;
    } else {
        totalQuestions = questions.length;
        uniqueQuestions = questions;
    }
    
    uniqueQuestions.forEach((question, index) => {
        const studentAnswer = studentAnswers[question.question_id];
        
        if (testType === 'multiple_choice' || testType === 'true_false') {
            if (String(studentAnswer) === String(question.correct_answer)) {
                correctAnswers++;
            }
        } else if (testType === 'input') {
            // For input tests, check against all correct answers
            if (studentAnswer) {
                // Get all correct answers for this question
                const questionAnswers = questions.filter(q => q.question_id === question.question_id);
                let isCorrect = false;
                
                for (const q of questionAnswers) {
                    if (studentAnswer.toLowerCase() === q.correct_answer.toLowerCase()) {
                        isCorrect = true;
                        break;
                    }
                }
                
                if (isCorrect) {
                    correctAnswers++;
                }
            }
        }
    });
    
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Create results content
    let resultsContent = `
        <div class="test-results-header">
            <div class="results-summary">
                <h2>Test Results</h2>
                <div class="score-display">
                    <span class="score-label">Your Score:</span>
                    <span class="score-value">${correctAnswers}/${totalQuestions}</span>
                    <span class="score-percentage">${scorePercentage}%</span>
                </div>
            </div>
        </div>
    `;
    
    // Add each question with student answer and correct answer
    uniqueQuestions.forEach((question, index) => {
        const studentAnswer = studentAnswers[question.question_id];
        
        // For input tests, determine if answer is correct
        let isCorrect = false;
        let correctAnswerDisplay = '';
        
        if (testType === 'multiple_choice' || testType === 'true_false') {
            isCorrect = String(studentAnswer) === String(question.correct_answer);
            correctAnswerDisplay = question.correct_answer;
        } else if (testType === 'input') {
            // Get all correct answers for this question
            const questionAnswers = questions.filter(q => q.question_id === question.question_id);
            correctAnswerDisplay = questionAnswers.map(q => q.correct_answer).join(', ');
            
            if (studentAnswer) {
                for (const q of questionAnswers) {
                    if (studentAnswer.toLowerCase() === q.correct_answer.toLowerCase()) {
                        isCorrect = true;
                        break;
                    }
                }
            }
        }
        
        resultsContent += `
            <div class="question-result-container ${isCorrect ? 'correct' : 'incorrect'}">
                <h4>
                    <span class="question-number">${index + 1}</span>
                    Question ${index + 1}
                </h4>
                <div class="question-text">${question.question}</div>
                <div class="answer-result-section">
                    <div class="student-answer">
                        <h5>Your Answer:</h5>
                        <span class="answer-text ${isCorrect ? 'correct' : 'incorrect'}">${studentAnswer || 'No answer'}</span>
                    </div>
                    <div class="correct-answer">
                        <h5>Correct Answer${testType === 'input' && questions.filter(q => q.question_id === question.question_id).length > 1 ? 's' : ''}:</h5>
                        <span class="answer-text correct">${correctAnswerDisplay}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Add back to tests button
    resultsContent += `
        <div class="test-results-actions">
            <button class="btn btn-primary back-to-tests-btn" onclick="backToTests()">
                <i class="back-icon">←</i>
                Back to Tests
            </button>
        </div>
    `;
    
    // Update content
    document.getElementById('testViewContent').innerHTML = resultsContent;
}

// Back to tests function
function backToTests() {
    const testViewSection = document.getElementById('testViewSection');
    testViewSection.style.display = 'none';
    testViewSection.classList.remove('test-view-fullscreen');
    document.getElementById('studentActiveTests').style.display = 'block';
}

// Mark test as completed in the UI without page reload
function markTestCompletedInUI(testType, testId) {
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
    console.log('🔧 DEBUG: Clearing all test-related local storage');
    
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
        if (key.includes('test_') || key.includes('form_data_')) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log('🗑️ Cleared:', key);
        }
    });
    
    console.log(`✅ Cleared ${clearedCount} test-related items`);
};

        console.log('🔧 DEBUG: Debugging tools loaded! Available functions:');
        console.log('- debugTestQuestions(testType, testId) - Check test questions data');
        console.log('- debugStudentTests(studentId) - Check student active tests');
        console.log('- debugTestCompletion(testType, testId, studentId) - Check completion status');
        console.log('- debugLocalStorage(testType, testId) - Check local storage for specific test');
        console.log('- debugAllLocalStorage() - Check all local storage');
        console.log('- clearTestLocalStorage() - Clear all test-related local storage');
        
        // Auto-debug the current test if we're in test view
        if (window.location.hash.includes('test') || document.querySelector('.test-view-section')) {
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
  
  // Get current user session
  const userSession = localStorage.getItem('user_session');
  if (!userSession) {
    showNotification('Session expired. Please login again.', 'error');
    return;
  }
  
  const sessionData = JSON.parse(userSession);
  const studentId = sessionData.user.student_id;
  
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
      
      // Update session with new password
      sessionData.user.password = newPassword;
      localStorage.setItem('user_session', JSON.stringify(sessionData));
      
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