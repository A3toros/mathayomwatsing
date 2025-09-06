// IMPORTS - Functions this module needs from shared and admin modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  debugFunction,
  clearAllLocalStorage,
  exportLocalStorage,
  initializeEventListeners
} from '../shared/index.js'

// Import admin-specific CSS
import './admin.css'

// Import admin-specific functions
import { 
  toggleSubjectsContent,
  showAddSubjectForm,
  hideAddSubjectForm,
  showAddAcademicYearForm,
  hideAddAcademicYearForm
} from './admin-content.js'

import { 
  toggleUsersContent,
  showAddUserForm,
  hideAddUserForm,
  showAddTeacherForm,
  hideAddTeacherForm,
  toggleTeachersContent
} from './admin-users.js'

import { 
  toggleSection,
  addClickListeners,
  addKeyboardAccessibility,
  testToggleSection,
  testAllToggles,
  manualToggleTest,
  addEditableFieldListeners,
  makeFieldEditable,
  saveField,
  toggleTestsContent,
  toggleAssignmentsContent,
  toggleResultsContent,
  showTestDataDeletion,
  hideTestDataDeletionForm,
  loadTeacherGradesClasses,
  checkTeacherSubjects,
  initializeTestDeletion,
  handleAssignmentDeletion,
  handleTestDataDeletion,
  getSelectedGradesClasses,
  hideAssignmentDeletionForm,
  deleteTest
} from './admin-panel.js'

import { testLocalStorage } from '../shared/debug.js'

import { loadAdminData } from './admin.js'

// NOTE: Event listener initialization functions were inline in original code

// EXPORTS - Admin app initialization
export {
  initializeAdminApp
}

function initializeAdminApp() {
  console.log('👨‍💼 Initializing Admin Application...')
  
  // Initialize global events first
  initializeEventListeners()
  
  // Note: Admin-specific event listeners were inline in original code
  
  // Load admin data
  loadAdminData()
  
  // Initialize test deletion functionality
  initializeTestDeletion()
  
  // Make admin functions available globally for HTML onclick handlers
  window.toggleSubjectsContent = toggleSubjectsContent;
  window.showAddSubjectForm = showAddSubjectForm;
  window.hideAddSubjectForm = hideAddSubjectForm;
  window.showAddAcademicYearForm = showAddAcademicYearForm;
  window.hideAddAcademicYearForm = hideAddAcademicYearForm;
  window.toggleUsersContent = toggleUsersContent;
  window.showAddUserForm = showAddUserForm;
  window.hideAddUserForm = hideAddUserForm;
  window.showAddTeacherForm = showAddTeacherForm;
  window.hideAddTeacherForm = hideAddTeacherForm;
  window.toggleTeachersContent = toggleTeachersContent;
  window.toggleTestsContent = toggleTestsContent;
  window.toggleAssignmentsContent = toggleAssignmentsContent;
  window.toggleResultsContent = toggleResultsContent;
  window.showTestDataDeletion = showTestDataDeletion;
  window.hideTestDataDeletionForm = hideTestDataDeletionForm;
  window.loadTeacherGradesClasses = loadTeacherGradesClasses;
  window.checkTeacherSubjects = checkTeacherSubjects;
  window.initializeTestDeletion = initializeTestDeletion;
  window.handleAssignmentDeletion = handleAssignmentDeletion;
  window.handleTestDataDeletion = handleTestDataDeletion;
  window.getSelectedGradesClasses = getSelectedGradesClasses;
  window.hideAssignmentDeletionForm = hideAssignmentDeletionForm;
  window.toggleSection = toggleSection;
  window.addClickListeners = addClickListeners;
  window.addKeyboardAccessibility = addKeyboardAccessibility;
  window.testToggleSection = testToggleSection;
  window.testAllToggles = testAllToggles;
  window.manualToggleTest = manualToggleTest;
  window.addEditableFieldListeners = addEditableFieldListeners;
  window.makeFieldEditable = makeFieldEditable;
  window.saveField = saveField;
  window.testLocalStorage = testLocalStorage;
  window.clearAllLocalStorage = clearAllLocalStorage;
  window.exportLocalStorage = exportLocalStorage;
  window.deleteTest = deleteTest;
}

// Admin - Main Entry Point
// Functions: initializeAdminApp

// TODO: Copy functions from script.js
