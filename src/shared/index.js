// SHARED MODULE BARREL EXPORT
// Exports all shared functions for easy importing by role modules

// Export all functions from individual modules
export * from './auth.js'
export * from './ui.js' 
export * from './utils.js'
export * from './debug.js'
export * from './form-state.js'

// Most critical exports (used 10+ times each) - explicit exports for clarity:
export { 
  // Core utilities (HIGHEST PRIORITY)
  sendRequest,           // ~100 calls - CRITICAL!
  
  // Test utilities
  calculateScore,        
  transformAnswersForSubmission,
  
  // Local storage utilities (MOVED from debug.js - they're utility functions!)
  clearAllLocalStorage,  
  exportLocalStorage     
} from './utils.js'

// Authentication functions
export {
  getCurrentTeacherId,   // 56 calls - CRITICAL!
  populateStudentInfo,
  populateTeacherInfo,
  initializeTeacherCabinet,
  initializeApplicationSession,
  resetLoginForm,
  handlePostLoginActions
} from './auth.js'

// UI functions
export {
  showSection,           // 29 calls - CRITICAL!
  showNotification,      // 15 calls - Important
  hideAllSections,
  showStatus,
  disableForm,
  toggleMenu,
  initializeEventListeners
} from './ui.js'

// Debug functions (for Admin + Teacher only)
export {
  debugFunction
} from './debug.js'
