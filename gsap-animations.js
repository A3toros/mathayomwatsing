// GSAP Animations for Modern UI Effects
// This file contains smooth animations and transitions using GSAP

// Initialize GSAP animations when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeGSAPAnimations();
});

// Main function to initialize all GSAP animations
function initializeGSAPAnimations() {
    console.log('🎨 Initializing GSAP animations...');
    
    // Set default GSAP settings for non-active sections only
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (!section.classList.contains('active')) {
            gsap.set(section, { 
                opacity: 0, 
                y: 30,
                scale: 0.95
            });
        } else {
            // Ensure active sections are visible
            gsap.set(section, { 
                opacity: 1, 
                y: 0,
                scale: 1
            });
        }
    });
    
    // Animate sections when they become active
    observeSectionChanges();
    
    // Initialize entrance animations
    initializeEntranceAnimations();
    
    // Initialize button animations
    initializeButtonAnimations();
    
    // Initialize form animations
    initializeFormAnimations();
    
    // Initialize card animations
    initializeCardAnimations();
    
    // Ensure login section is properly visible if it's active
    const loginSection = document.querySelector('#login-section.active');
    if (loginSection) {
        gsap.set(loginSection, { 
            opacity: 1, 
            y: 0, 
            scale: 1 
        });
        // Ensure all buttons in login section are visible
        const buttons = loginSection.querySelectorAll('.btn');
        buttons.forEach(button => {
            gsap.set(button, { opacity: 1 });
        });
    }
    
    console.log('✅ GSAP animations initialized');
}

// Observe section changes and animate them
function observeSectionChanges() {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        // Create observer for each section
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (section.classList.contains('active')) {
                        animateSectionIn(section);
                    } else {
                        animateSectionOut(section);
                    }
                }
            });
        });
        
        observer.observe(section, { attributes: true });
    });
}

// Animate section entrance
function animateSectionIn(section) {
    gsap.timeline()
        .set(section, { display: 'block' })
        .to(section, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
                // Ensure all buttons in the section are visible
                const buttons = section.querySelectorAll('.btn');
                buttons.forEach(button => {
                    gsap.set(button, { opacity: 1 });
                });
            }
        });
}

// Animate section exit
function animateSectionOut(section) {
    gsap.to(section, {
        opacity: 0,
        y: 30,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
            gsap.set(section, { display: 'none' });
        }
    });
}

// Initialize entrance animations for elements
function initializeEntranceAnimations() {
    // Animate logo with bounce effect
    gsap.from('.logo', {
        opacity: 0,
        y: -30,
        scale: 0.8,
        duration: 1,
        ease: "back.out(1.7)",
        delay: 0.1
    });
    
    // Animate login form elements
    gsap.from('.login-form', {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.4
    });
    
    // Animate form groups with stagger
    gsap.from('.form-group', {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.6
    });
    
    // Animate buttons with stagger
    gsap.from('.btn', {
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.8
    });
}

// Initialize button hover animations
function initializeButtonAnimations() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        // Hover animation
        button.addEventListener('mouseenter', () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.2,
                ease: "power2.out"
            });
        });
        
        // Mouse leave animation
        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        });
        
        // Click animation
        button.addEventListener('mousedown', () => {
            gsap.to(button, {
                scale: 0.95,
                duration: 0.1,
                ease: "power2.in"
            });
        });
        
        button.addEventListener('mouseup', () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.1,
                ease: "power2.out"
            });
        });
    });
}

// Initialize form input animations
function initializeFormAnimations() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Focus animation
        input.addEventListener('focus', () => {
            gsap.to(input, {
                scale: 1.02,
                y: -2,
                duration: 0.2,
                ease: "power2.out"
            });
        });
        
        // Blur animation
        input.addEventListener('blur', () => {
            gsap.to(input, {
                scale: 1,
                y: 0,
                duration: 0.2,
                ease: "power2.out"
            });
        });
    });
}

// Initialize card animations
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.card, .test-item, .subject-item');
    
    cards.forEach((card, index) => {
        // Initial state
        gsap.set(card, { 
            opacity: 0, 
            y: 30,
            scale: 0.9
        });
        
        // Entrance animation with stagger
        gsap.to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: "power2.out"
        });
        
        // Hover animations
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -5,
                scale: 1.02,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    });
}

// Animate table rows entrance
function animateTableRows(table) {
    const rows = table.querySelectorAll('tr');
    
    gsap.from(rows, {
        opacity: 0,
        x: -50,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
    });
}

// Animate modal entrance
function animateModalIn(modal) {
    gsap.timeline()
        .set(modal, { display: 'flex' })
        .from(modal, {
            opacity: 0,
            scale: 0.8,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
}

// Animate modal exit
function animateModalOut(modal, onComplete) {
    gsap.to(modal, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
            gsap.set(modal, { display: 'none' });
            if (onComplete) onComplete();
        }
    });
}

// Animate success/error messages
function animateMessage(message, type = 'success') {
    gsap.timeline()
        .set(message, { 
            display: 'block',
            opacity: 0,
            y: -20,
            scale: 0.9
        })
        .to(message, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.7)"
        })
        .to(message, {
            opacity: 0,
            y: -20,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.in",
            delay: 3
        });
}

// Animate loading states
function animateLoading(element) {
    gsap.to(element, {
        opacity: 0.6,
        scale: 0.98,
        duration: 0.3,
        ease: "power2.out"
    });
}

function stopLoading(element) {
    gsap.to(element, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
    });
}

// Animate page transitions
function animatePageTransition(fromSection, toSection) {
    gsap.timeline()
        .to(fromSection, {
            opacity: 0,
            y: -30,
            scale: 0.95,
            duration: 0.4,
            ease: "power2.in"
        })
        .set(fromSection, { display: 'none' })
        .set(toSection, { display: 'block' })
        .to(toSection, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out"
        });
}

// Export functions for use in other scripts
window.GSAPAnimations = {
    animateSectionIn,
    animateSectionOut,
    animateTableRows,
    animateModalIn,
    animateModalOut,
    animateMessage,
    animateLoading,
    stopLoading,
    animatePageTransition
};
