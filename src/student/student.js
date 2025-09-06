


// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Student-specific functions
export {
  loadStudentData,
  displayStudentSubjects
}

// Student cabinet functionality
async function loadStudentData() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-subjects'
        );
        
        const data = await response.json();
        
        if (data.success) {
            displayStudentSubjects(data.subjects);
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}



function displayStudentSubjects(subjects) {
    const subjectsContainer = document.getElementById('studentSubjects');
    if (!subjectsContainer) return;
    
    subjectsContainer.innerHTML = '';

    subjects.forEach(subject => {
        const subjectTab = document.createElement('div');
        subjectTab.className = 'subject-tab';
        subjectTab.innerHTML = `
            <h3>${subject.subject}</h3>
            <div class="test-results">
                <h4>Test Results</h4>
                <div class="loading">Loading...</div>
            </div>
        `;
        subjectsContainer.appendChild(subjectTab);
        
    });
}