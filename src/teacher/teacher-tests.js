// Teacher - Test Creation & Assignment
// Functions: initializeTestCreation, setupFormAutoSave, showTestTypeSelection, resetTestCreation, 
// disableNavigationButtons, enableNavigationButtons, saveTestCreationState, clearTestCreationState, clearAllTestFormFields, 
// resetExcelUploadState, restoreExcelUploadState, saveFormDataForStep, restoreFormDataForStep, restoreTestCreationState, showTestForm, 
// handleMultipleChoiceSubmit, handleTrueFalseSubmit, handleInputTestSubmit, createMultipleChoiceQuestions, saveMultipleChoiceTest, saveTrueFalseTest, 
// saveInputTest, createTrueFalseQuestions, createInputQuestions, setupMultipleChoiceFormAutoSave, setupTrueFalseFormAutoSave, setupInputFormAutoSave, 
// addAnswerField, removeAnswerField, showTestAssignment, loadTeacherGradesAndClasses, displayTestAssignmentOptions, assignTestToClasses, 
// showTestCreationSuccessMessage, refreshActiveTestsData, initializeActiveTests, showActiveTests, loadTeacherActiveTests, displayTeacherActiveTests, 
// viewTeacherTestDetails, showTeacherTestDetailsModal, loadTeacherTestQuestions, closeTeacherTestDetailsModal, removeClassAssignment, markTestCompletedInUI

// IMPORTS - Functions this module needs from shared modules
import {
  showSection,
  showNotification,
  getCurrentTeacherId
} from '../shared/index.js'

// Import form state functions
import { restoreMultipleChoiceData, restoreTrueFalseData, restoreInputData } from '../shared/form-state.js'

// Global loading state for test saving
let isSavingTest = false;

// Map test types to database values
const test_type_map = {
    'multipleChoice': 'multiple_choice',
    'trueFalse': 'true_false',
    'input': 'input',
    'matching_type': 'matching_type'
};

// Return to main cabinet after test assignment
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

// TODO: Copy functions from script.js
// Initialize test creation functionality
async function initializeTestCreation() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
    const cancelTestCreationMatching = document.getElementById('cancelTestCreationMatching');
    
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
    if (cancelTestCreationMatching) {
        cancelTestCreationMatching.addEventListener('click', resetTestCreation);
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
async function showTestTypeSelection() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTestTypeSelection, redirecting to login');
        showNotification('Missing teacher session. Please sign in again.', 'error');
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
async function resetTestCreation() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function disableNavigationButtons() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function enableNavigationButtons() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function saveTestCreationState(currentStep) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function clearTestCreationState() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function clearAllTestFormFields() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function saveFormDataForStep(step) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function restoreFormDataForStep(step) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
async function showTestForm(testType) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showTestForm, redirecting to login');
        showNotification('Missing teacher session. Please sign in again.', 'error');
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
        showNotification('Please enter valid test name, number of questions (1-100), and number of options (2-6)', 'warning');
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
        showNotification('Please enter a valid test name and number of questions (1-100)', 'warning');
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
        showNotification('Please enter a valid test name and number of questions (1-100)', 'warning');
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
    // Prevent multiple simultaneous saves
    if (isSavingTest) {
        console.log('saveMultipleChoiceTest already in progress, skipping duplicate call');
        return;
    }
    
    isSavingTest = true;
    
    // Disable save button and show loading
    const saveButton = document.querySelector('#multipleChoiceForm button.btn-success');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<div class="loading-spinner"></div> Saving...';
    }
    
    try {
        console.log('=== saveMultipleChoiceTest called ===');
        
        // Check if user session is still valid using JWT
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveMultipleChoiceTest, redirecting to login');
            showNotification('Missing teacher session. Please sign in again.', 'error');
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
                showNotification(`Question ${i} cannot be empty. Please fill in all questions.`, 'warning');
                return;
            }
            
            // Validate that correct answer is selected
            if (!correctAnswer) {
                showNotification(`Please select a correct answer for question ${i}.`, 'warning');
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
            showNotification('Multiple choice test saved successfully!', 'success');
            console.log('Test saved with ID:', result.test_id);
            
            // Clear ONLY test form data, NOT user session data
            clearTestCreationState();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('multipleChoice', result.test_id);
        } else {
            showNotification('Error saving test: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving multiple choice test:', error);
        showNotification('Error saving test. Please try again.', 'error');
    } finally {
        // Reset loading state
        isSavingTest = false;
        
        // Re-enable save button
        const saveButton = document.querySelector('#multipleChoiceForm button.btn-success');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Test';
        }
    }
}

// Save true/false test
async function saveTrueFalseTest(testName, numQuestions) {
    // Prevent multiple simultaneous saves
    if (isSavingTest) {
        console.log('saveTrueFalseTest already in progress, skipping duplicate call');
        return;
    }
    
    isSavingTest = true;
    
    // Disable save button and show loading
    const saveButton = document.querySelector('#trueFalseForm button.btn-success');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<div class="loading-spinner"></div> Saving...';
    }
    
    try {
        // Ensure numQuestions is a number
        const numQuestionsInt = parseInt(numQuestions);
        
        console.log('=== saveTrueFalseTest called ===');
        console.log('Test Name:', testName);
        console.log('Number of Questions (original):', numQuestions, 'type:', typeof numQuestions);
        console.log('Number of Questions (converted):', numQuestionsInt, 'type:', typeof numQuestionsInt);
        
        // Check if user session is still valid using JWT
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveTrueFalseTest, redirecting to login');
            showNotification('Missing teacher session. Please sign in again.', 'error');
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
            showNotification('True/False test saved successfully!', 'success');
            
            // Clear ONLY test form data, NOT user session data
            clearTestCreationState();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('trueFalse', result.test_id);
        } else {
            showNotification('Error saving test: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving true/false test:', error);
        showNotification('Error saving test: ' + error.message, 'error');
    } finally {
        // Reset loading state
        isSavingTest = false;
        
        // Re-enable save button
        const saveButton = document.querySelector('#trueFalseForm button.btn-success');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Test';
        }
    }
}

// Save input test
async function saveInputTest(testName, numQuestions) {
    // Prevent multiple simultaneous saves
    if (isSavingTest) {
        console.log('saveInputTest already in progress, skipping duplicate call');
        return;
    }
    
    isSavingTest = true;
    
    // Disable save button and show loading
    const saveButton = document.querySelector('#inputTestForm button.btn-success');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<div class="loading-spinner"></div> Saving...';
    }
    
    console.log('🔍 saveInputTest called with:', { testName, numQuestions });
    
    // Save form data before submitting
    saveFormDataForStep('inputForm');
    
    try {
        // Check if user session is still valid using JWT
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveInputTest, redirecting to login');
            showNotification('Missing teacher session. Please sign in again.', 'error');
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
                showNotification(`Please provide at least one answer for question ${i}`, 'warning');
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
            showNotification('No questions were collected. Please check the form.', 'warning');
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
            showNotification('Input test saved successfully!', 'success');
            
            // Clear ONLY test form data, NOT user session data
            clearTestCreationState();
            
            // Show test assignment interface with test type and ID
            showTestAssignment('input', result.test_id);
        } else {
            console.error('🔍 Error from backend:', result.message);
            showNotification('Error saving test: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('🔍 Error in saveInputTest:', error);
        showNotification('Error saving test. Please try again.', 'error');
    } finally {
        // Reset loading state
        isSavingTest = false;
        
        // Re-enable save button
        const saveButton = document.querySelector('#inputTestForm button.btn-success');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Test';
        }
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
async function showTestAssignment(testType, testId) {
    // Check if we're returning from a successful assignment
    if (window.testAssignmentCompleted) {
        window.testAssignmentCompleted = false; // Reset flag
        return;
    }
    
    // Check if user session is still valid before proceeding using JWT
    const teacherId = await getCurrentTeacherId();
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
    
    // Show loading message in the assignment container (don't overwrite the entire section)
    const assignmentContainer = document.getElementById('assignmentGradesContainer');
    if (assignmentContainer) {
        assignmentContainer.innerHTML = `
            <div class="loading-tests">
                <div class="loading-spinner"></div>
                <p>Loading assignment interface...</p>
            </div>
        `;
    }
    
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
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found, redirecting to login');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Teacher ID:', teacherId);
        
        const url = `/.netlify/functions/get-teacher-subjects?teacher_id=${teacherId}`;
        console.log('Fetching from URL:', url);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(url);
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
            const container = document.getElementById('assignmentGradesContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <h5>No Subjects Assigned</h5>
                        <p>You need to assign subjects to grades and classes before you can create tests.</p>
                        <button class="btn btn-primary" onclick="showSubjectSelectionPrompt()">Assign Subjects Now</button>
                        <button class="btn btn-secondary" onclick="resetTestCreation()" style="margin-left: 10px;">Cancel Test Creation</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading teacher grades and classes:', error);
        const container = document.getElementById('assignmentGradesContainer');
        if (container) {
            container.innerHTML = '<p>Error loading available grades and classes.</p>';
        }
    }
}

// Display test assignment options
async function displayTestAssignmentOptions(subjects, testType, testId) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayTestAssignmentOptions, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('displayTestAssignmentOptions called with:', { subjects, testType, testId });
    
    const container = document.getElementById('assignmentGradesContainer');
    if (!container) {
        console.error('assignmentGradesContainer element not found');
        return;
    }
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
    assignButton.onclick = () => {
        if (assignButton.disabled) return; // Prevent multiple clicks
        assignButton.disabled = true;
        assignButton.textContent = 'Assigning...';
        window.GSAPAnimations.animateLoading(assignButton);
        assignTestToClasses(testType, testId);
    };
    
    container.appendChild(assignButton);
    
    console.log('Finished creating assignment options');
}

// Assign test to selected classes
async function assignTestToClasses(testType, testId) {
    console.log('=== assignTestToClasses called ===');
    console.log('Test Type:', testType);
    console.log('Test ID:', testId);
    
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in assignTestToClasses, redirecting to login');
        showNotification('Missing teacher session. Please sign in again.', 'error');
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
        showNotification('Please select at least one grade and class combination.', 'warning');
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
            showNotification(`Test assigned successfully to ${data.assignments_count} class(es)!`, 'success');
            console.log('Test assignment successful!');
            console.log('🔍 About to call returnToMainCabinet()...');
            // Return to main cabinet view after successful assignment
            await returnToMainCabinet();
            console.log('🔍 returnToMainCabinet() completed');
        } else {
            showNotification('Error assigning test: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error assigning test:', error);
        showNotification('Error assigning test. Please try again.', 'error');
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
    const teacherId = await getCurrentTeacherId();
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
async function displayTeacherActiveTests(tests) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
    const teacherId = await getCurrentTeacherId();
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
            showNotification('Could not load test questions. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error loading teacher test details:', error);
        showNotification('Error loading test details. Please try again.', 'error');
    }
}

// Show teacher test details modal
async function showTeacherTestDetailsModal(testType, testId, testName, questions) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
    const teacherId = await getCurrentTeacherId();
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
async function closeTeacherTestDetailsModal() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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
    const teacherId = await getCurrentTeacherId();
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
        const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/remove-assignment', {
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

// Mark test as completed in the UI without page reload
async function markTestCompletedInUI(testType, testId) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
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

// Excel upload functions
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

// Handle Excel file upload
function handleExcelFileUpload(event, testType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Basic file validation
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        event.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Please select a file smaller than 5MB.');
        event.target.value = '';
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

// ===== EXCEL PROCESSING FUNCTIONS =====

// Process Excel data for specific test type
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

// Data recognition functions
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
            
            // Check if correct answer exists and is valid
            const correctAnswer = row[1];
            if (!correctAnswer || !['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswer.toString().toUpperCase())) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has invalid correct answer "${correctAnswer}". Must be A, B, C, D, E, or F` 
                };
            }
            
            // Check if at least 2 options exist
            if (!row[2] || row[2].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no Option A text in column 3` 
                };
            }
            if (!row[3] || row[3].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no Option B text in column 4` 
                };
            }
        }
        return { matches: true };
        
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
        }
        return { matches: true };
        
    } else if (testType === 'input') {
        // Check if each row has: Question + at least 1 Answer
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            
            // Need at least 2 columns: Question + Answer
            if (row.length < 2) {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has ${row.length} columns but needs at least 2` 
                };
            }
            
            // Check if question exists
            if (!row[0] || row[0].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no question in column 1` 
                };
            }
            
            // Check if at least 1 answer exists
            if (!row[1] || row[1].toString().trim() === '') {
                return { 
                    matches: false, 
                    issue: `Row ${i + 1} has no answer in column 2` 
                };
            }
        }
        return { matches: true };
    }
    
    return { matches: false, issue: 'Unknown test type' };
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
    if (firstRow.length < headerPattern.expectedColumns) {
        return { isLikelyHeader: false };
    }
    
    const firstRowText = firstRow.join(' ').toLowerCase();
    const keywordMatches = headerPattern.keywords.filter(keyword => 
        firstRowText.includes(keyword.toLowerCase())
    ).length;
    
    // If more than half the keywords match, it's likely a header
    const isLikelyHeader = keywordMatches >= headerPattern.keywords.length / 2;
    
    return { isLikelyHeader };
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
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm btn-outline-danger remove-answer-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.onclick = () => removeAnswerField(answerInput);
                answerDiv.appendChild(removeBtn);
            }
            
            answersContainer.appendChild(answerDiv);
        }
        
        questionDiv.appendChild(answersContainer);
        
        // Add "Add Answer" button for this question
        const addAnswerBtn = document.createElement('button');
        addAnswerBtn.type = 'button';
        addAnswerBtn.className = 'btn btn-sm btn-outline-primary add-answer-btn';
        addAnswerBtn.textContent = 'Add Answer';
        addAnswerBtn.onclick = () => addAnswerField(answersContainer, index + 1);
        questionDiv.appendChild(addAnswerBtn);
        
        container.appendChild(questionDiv);
    });
    
    // Add save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save Test';
    saveBtn.onclick = () => saveInputTest(
        document.getElementById('inputTestName').value, 
        excelData.length
    );
    container.appendChild(saveBtn);
    
    // Setup auto-save
    setupInputFormAutoSave();
    
    // NEW: Re-attach any necessary event listeners
    reattachFormEventListeners('input');
}

// EXPORTS - All teacher test creation and management functions
export {
  initializeTestCreation,
  setupFormAutoSave,
  showTestTypeSelection,
  resetTestCreation,
  disableNavigationButtons,
  enableNavigationButtons,
  saveTestCreationState,
  clearTestCreationState,
  clearAllTestFormFields,
  resetExcelUploadState,
  restoreExcelUploadState,
  saveFormDataForStep,
  restoreFormDataForStep,
  restoreTestCreationState,
  showTestForm,
  returnToMainCabinet,
  handleMultipleChoiceSubmit,
  handleTrueFalseSubmit,
  handleInputTestSubmit,
  initializeExcelUploadForAllTestTypes,
  showExcelUploadButton,
  showExcelHint,
  handleExcelFileUpload,
  createMultipleChoiceQuestions,
  saveMultipleChoiceTest,
  saveTrueFalseTest,
  saveInputTest,
  createTrueFalseQuestions,
  createInputQuestions,
  setupMultipleChoiceFormAutoSave,
  setupTrueFalseFormAutoSave,
  setupInputFormAutoSave,
  addAnswerField,
  removeAnswerField,
  showTestAssignment,
  loadTeacherGradesAndClasses,
  displayTestAssignmentOptions,
  assignTestToClasses,
  showTestCreationSuccessMessage,
  refreshActiveTestsData,
  initializeActiveTests,
  showActiveTests,
  loadTeacherActiveTests,
  displayTeacherActiveTests,
  viewTeacherTestDetails,
  showTeacherTestDetailsModal,
  loadTeacherTestQuestions,
  closeTeacherTestDetailsModal,
  removeClassAssignment,
  markTestCompletedInUI,
  processExcelDataForTestType,
  clearFileInputForTestType,
  reattachFormEventListeners,
  getQuestionCountForTestType,
  getRequiredFormatForTestType,
  recognizeExcelData,
  checkDataPattern,
  detectHeaders,
  getHeaderPattern,
  checkHeaderMatch,
  populateFromExcelForTestType,
  populateMultipleChoiceFromExcel,
  populateTrueFalseFromExcel,
  populateInputFromExcel
}