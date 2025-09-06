// IMPORTS - Functions this module needs from shared and teacher modules
import { 
  getCurrentTeacherId,
  showSection,
  showNotification,
  populateTeacherInfo,
  initializeTeacherCabinet,
  initializeEventListeners
} from '../shared/index.js'

// Import teacher-specific CSS
import './teacher.css'

import { 
  toggleSubjectDropdown,
  saveClassesForSubject,
  saveTeacherSubjects,
  showSubjectSelectionPrompt,
  showConfirmationModal,
  confirmSaveSubjects,
  cancelSaveSubjects,
  loadSubjectsForDropdown,
  displayExistingSubjects,
  showEditSubjectsButton
} from './teacher-subjects.js'

// Import from teacher-tests.js
import { initializeTestCreation, enableNavigationButtons, restoreTestCreationState, initializeActiveTests, handleMultipleChoiceSubmit, handleTrueFalseSubmit, handleInputTestSubmit, initializeExcelUploadForAllTestTypes, showExcelUploadButton, showExcelHint, handleExcelFileUpload, createMultipleChoiceQuestions, createTrueFalseQuestions, createInputQuestions, saveMultipleChoiceTest, saveTrueFalseTest, saveInputTest, showTestAssignment } from './teacher-tests.js'

// Import from teacher-results.js
import { initializeGradeButtons } from './teacher-results.js'
// NOTE: Event listener initialization functions were inline in original code

// EXPORTS - Teacher app initialization
export {
  initializeTeacherApp
}

function initializeTeacherApp() {
  console.log('👩‍🏫 Initializing Teacher Application...')
  
  // Initialize global events first
  initializeEventListeners()
  
  // Set up teacher-specific event listeners
  setupTeacherEventListeners()
  
  // Initialize teacher cabinet
  initializeTeacherCabinet()
}

function setupTeacherEventListeners() {
  // Initialize Excel upload functionality
  initializeExcelUploadForAllTestTypes();
  
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

  // Load subjects for dropdown
  loadSubjectsForDropdown();

  // Initialize test creation functionality
  initializeTestCreation();

  // Initialize active tests functionality
  initializeActiveTests();

  console.log('✅ Teacher-specific event listeners set up');
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

// Make functions available globally for auth.js and HTML onclick handlers
window.showMainCabinetWithSubjects = showMainCabinetWithSubjects;
window.showSubjectSelectionPrompt = showSubjectSelectionPrompt;
window.handleMultipleChoiceSubmit = handleMultipleChoiceSubmit;
window.handleTrueFalseSubmit = handleTrueFalseSubmit;
window.handleInputTestSubmit = handleInputTestSubmit;
window.showExcelUploadButton = showExcelUploadButton;
window.showExcelHint = showExcelHint;
window.createMultipleChoiceQuestions = createMultipleChoiceQuestions;
window.createTrueFalseQuestions = createTrueFalseQuestions;
window.createInputQuestions = createInputQuestions;
window.saveMultipleChoiceTest = saveMultipleChoiceTest;
window.saveTrueFalseTest = saveTrueFalseTest;
window.saveInputTest = saveInputTest;
window.getCurrentTeacherId = getCurrentTeacherId;
window.showSection = showSection;
window.showTestAssignment = showTestAssignment;

// Teacher - Main Entry Point
// Functions: initializeTeacherApp

// TODO: Copy functions from script.js
