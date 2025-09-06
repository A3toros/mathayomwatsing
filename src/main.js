// Main entry point for Vite
// This file handles role-based dynamic loading for optimal performance

// Import global styles
import './styles/global.css'

// Import shared functions needed for initialization  
import { initializeApplicationSession, initializeEventListeners, showSection } from './shared/index.js'

console.log('🚀 Main entry point loaded');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing application...');
    
    // Initialize shared functionality first
    initializeEventListeners();
    
    // Load role-based module first, then initialize application session
    await loadRoleBasedModule();
    
    // Initialize application session after role-based module is loaded
    initializeApplicationSession();
});

// Dynamic role-based module loading
async function loadRoleBasedModule() {
    // Get user role from localStorage or JWT token
    const userRole = getUserRole();
    
    console.log(`🎯 Loading module for role: ${userRole}`);
    
    try {
        switch (userRole) {
            case 'student':
                console.log('📚 Loading Student Application...');
                try {
                    const { initializeStudentApp } = await import('./student/index.js');
                    console.log('📚 Student module imported successfully');
                    console.log('📚 About to call initializeStudentApp...');
                    initializeStudentApp();
                    console.log('📚 initializeStudentApp completed');
                    showSection('student-cabinet');
                    console.log('📚 Student section shown');
                } catch (error) {
                    console.error('📚 Error loading student module:', error);
                }
                break;
                
            case 'teacher':
                console.log('👩‍🏫 Loading Teacher Application...');
                const { initializeTeacherApp } = await import('./teacher/index.js');
                const { initializeTeacherCabinet } = await import('./shared/auth.js');
                initializeTeacherApp();
                initializeTeacherCabinet();
                showSection('teacher-cabinet');
                break;
                
            case 'admin':
                console.log('👨‍💼 Loading Admin Application...');
                const { initializeAdminApp } = await import('./admin/index.js');
                initializeAdminApp();
                showSection('admin-panel');
                break;
                
            default:
                // No role detected - show login screen
                console.log('🔐 No role detected, showing login screen');
                showSection('login-section');
        }
    } catch (error) {
        console.error('❌ Error loading role module:', error);
        showSection('login-section');
    }
}

// Helper function to determine user role
function getUserRole() {
    // Check localStorage first (set after successful login)
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
        console.log(`Found stored role: ${storedRole}`);
        return storedRole;
    }
    
    // Check JWT token payload
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(`Found role in JWT: ${payload.role}`);
            return payload.role;
        } catch (e) {
            console.warn('Invalid token format, clearing token');
            localStorage.removeItem('accessToken');
        }
    }
    
    console.log('No role found - user needs to login');
    return null; // No role found - will show login
}

// Make role loader available globally for post-login role switching
window.loadRoleBasedModule = loadRoleBasedModule;

console.log('✅ Main.js: Role-based loader initialized');
