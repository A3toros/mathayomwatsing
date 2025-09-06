
// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Teacher-specific functions
export {
  loadTeacherData,
  returnToMainCabinet,
  showMainCabinet,
  displayGradeButtons
}

async function teacherLogin(credentials) {
    console.log('Trying teacher login...');
    const response = await fetch('/.netlify/functions/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response;
}







// Teacher cabinet functionality
async function loadTeacherData() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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

async function displayGradeButtons() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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