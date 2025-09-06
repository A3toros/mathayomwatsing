// ORIGINAL PLAN:
// Admin - Authentication & Navigation
// Functions: adminLogin, loadAdminData

// 🔥 CORRECTED AFTER CROSS-REFERENCE ANALYSIS:
// Admin - Navigation Only
// Functions: loadAdminData
// ⬅️ REMOVED: getAdminTeacherId (no longer needed - admin uses getCurrentAdminId)

// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  getCurrentAdmin,
  isAdmin,
  getCurrentAdminId,
  sendRequest
} from '../shared/index.js'

import { 
  loadAllSubjects,
  loadAcademicYear,
  toggleAcademicYearContent 
} from './admin-content.js'

import { 
  loadAllTeachers,
  getAllUsers 
} from './admin-users.js'

// EXPORTS - Admin-specific functions
export {
  loadAdminData
}

// TODO: Copy functions from script.js

// Set up admin-specific event listeners
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
    checkAcademicYearBtn.addEventListener('click', toggleAcademicYearContent);
}
async function adminLogin(credentials) {
    console.log('Trying admin login...');
    const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response;
}
async function loadAdminData() {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in loadAdminData, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Load initial admin data
    await loadAllTeachers();
    await loadAllSubjects();
    await loadAcademicYear();
    await getAllUsers();
}

// getAdminTeacherId function removed - no longer needed with new admin architecture