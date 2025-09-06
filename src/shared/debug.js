
// ORIGINAL PLAN:
// Debug & Testing Functions
// Functions: ensureDebugOutput, showDebugFunctions, testDbConnection, testStudentLogin, testTeacherLogin, 
// testAdminLogin, testGetSubjects, testGetTeacherSubjects, testGetClassResults, testGetStudentSubjects, 
// testGetStudentTestResults, debugFunction, testLocalStorage

// 🔥 CORRECTED AFTER CROSS-REFERENCE ANALYSIS:
// Debug & Testing Functions (ADMIN + TEACHER)
// Functions: ensureDebugOutput, showDebugFunctions, testDbConnection, testStudentLogin, testTeacherLogin, testAdminLogin, 
// testGetSubjects, testGetTeacherSubjects, testGetClassResults, testGetStudentSubjects, testGetStudentTestResults, 
// debugFunction ⭐(2 calls) ⬅️ MOVED FROM ADMIN, testLocalStorage
// ⬅️ REMOVED: clearAllLocalStorage, exportLocalStorage (MOVED TO shared/utils.js - they're utility functions, not debug!)

// TODO: Copy functions from script.js

// IMPORTS - Functions this module needs from other shared modules
import { showNotification } from './ui.js'

// EXPORTS - All debug functions
export {
  ensureDebugOutput,
  showDebugFunctions,
  testDbConnection,
  testStudentLogin,
  testTeacherLogin,
  testAdminLogin,
  testGetSubjects,
  testGetTeacherSubjects,
  testGetClassResults,
  testGetStudentSubjects,
  testGetStudentTestResults,
  debugFunction,
  testLocalStorage
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
