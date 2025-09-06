
// IMPORTS - Functions this module needs from other shared modules
import { sendRequest } from './utils.js'
import { resetLoginForm, handleUnifiedLogin } from './auth.js'

// EXPORTS - All UI and navigation functions
export {
  showSection,
  hideAllSections,
  showNotification,
  initializeEventListeners,
  toggleMenu,
  closeMenuOnOutsideClick,
  showStatus,
  disableForm
}

// Section management
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // CRITICAL FIX: First remove active class from ALL sections
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
        console.log('Removed active from:', section.id);
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        targetSection.style.visibility = 'visible';
        targetSection.style.opacity = '1';
        console.log('Added active to:', sectionId);
        console.log('Target section element:', targetSection);
        console.log('Target section classes:', targetSection.className);
        
        // Debug: Check if sections are actually hidden/shown
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

// Utility function to hide all sections
function hideAllSections() {
    console.log('Hiding all sections...');
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
        console.log(`Hidden section: ${section.id}`);
    });
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
            // JWT system handles session management - no need to save/restore form data
            // Form data is cleared after successful login
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

    // Note: Role-specific event listeners moved to their respective modules:
    // - editSubjectsBtn → teacher/teacher-subjects.js
    // - debugFunctionsBtn, editSubjectsAdminBtn, checkAcademicYearBtn → admin/admin.js
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

function disableForm(form, disable = true) {
    if (!form) return;
    Array.from(form.elements).forEach(element => {
        element.disabled = disable;
    });
}

