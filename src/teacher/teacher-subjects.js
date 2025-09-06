// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Subject and class management functions
export {
  displayExistingSubjects,
  showSubjectSelectionPrompt,
  loadAndDisplayExistingSubjects,
  displayExistingSubjectsInSelection,
  saveTeacherSubjects,
  toggleSubjectDropdown,
  loadSubjectsForDropdown,
  onSubjectSelected,
  loadGradesAndClasses,
  saveClassesForSubject,
  resetSubjectSelection,
  showSubjectAddedMessage,
  showConfirmationModal,
  hideConfirmationModal,
  confirmSaveSubjects,
  cancelSaveSubjects,
  removeSubject,
  showEditSubjectsButton,
  hideEditSubjectsButton,
  generateClassButtons,
  showClassResults
}

// Teacher - Subject & Class Management
// Functions: displayExistingSubjects, showSubjectSelectionPrompt, loadAndDisplayExistingSubjects, displayExistingSubjectsInSelection, 
// showSubjectSelection, saveTeacherSubjects, toggleSubjectDropdown, loadSubjectsForDropdown, onSubjectSelected, loadGradesAndClasses, 
// saveClassesForSubject, resetSubjectSelection, showSubjectAddedMessage, showConfirmationModal, hideConfirmationModal, confirmSaveSubjects, 
// cancelSaveSubjects, removeSubject, showEditSubjectsButton, hideEditSubjectsButton, generateClassButtons, showClassResults

// TODO: Copy functions from script.js

// Set up teacher-specific event listeners
const editSubjectsBtn = document.getElementById('editSubjectsBtn');
if (editSubjectsBtn) {
    editSubjectsBtn.addEventListener('click', showSubjectSelectionPrompt);
}
// Display existing subjects information
function displayExistingSubjects(subjects) {
    console.log('displayExistingSubjects called with subjects:', subjects);
    const subjectsInfo = document.getElementById('subjectsInfo');
    if (subjectsInfo) {
        // Create detailed display of subjects and their classes
        let subjectsHtml = '<div class="existing-subjects-info"><h3>Your Assigned Subjects</h3>';
        
        subjects.forEach(subject => {
            subjectsHtml += `<div class="subject-item">`;
            subjectsHtml += `<h4>${subject.subject}</h4>`;
            
            if (subject.classes && Array.isArray(subject.classes)) {
                const classList = subject.classes.map(classData => 
                    `${classData.grade}/${classData.class}`
                ).join(', ');
                subjectsHtml += `<p><strong>Classes:</strong> ${classList}</p>`;
            }
            
            subjectsHtml += `</div>`;
        });
        
        subjectsHtml += '</div>';
        
        subjectsInfo.innerHTML = subjectsHtml;
        subjectsInfo.style.display = 'block';
        
        console.log('Updated subjects info display');
    }
}

// Show prompt to add subjects
async function showSubjectSelectionPrompt() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showSubjectSelectionPrompt, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 showSubjectSelectionPrompt blocked - currently in test creation mode');
        return;
    }
    
    console.log('=== showSubjectSelectionPrompt called ===');
    
    // Hide main cabinet
    const mainCabinet = document.getElementById('main-cabinet-container');
    if (mainCabinet) {
        mainCabinet.style.display = 'none';
    }
    
    // Hide test creation
    const testCreation = document.getElementById('testCreationSection');
    if (testCreation) {
        testCreation.style.display = 'none';
    }
    
    // Show subject selection
    const subjectSelection = document.getElementById('subject-selection-container');
    if (subjectSelection) {
        subjectSelection.style.display = 'block';
    }
    
    // Show welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
    }
    
    // Hide edit subjects button when in subject selection mode
    hideEditSubjectsButton();
    
    // Load and display existing subjects
    await loadAndDisplayExistingSubjects();
}

// Load and display existing subjects in the subject selection interface
async function loadAndDisplayExistingSubjects() {
    try {
        // Check if user session is still valid using JWT
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in loadAndDisplayExistingSubjects, redirecting to login');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Loading existing subjects for display...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-subjects'
        );
        const data = await response.json();
        
        if (data.success && data.subjects && data.subjects.length > 0) {
            console.log('Existing subjects found:', data.subjects);
            displayExistingSubjectsInSelection(data.subjects);
        } else {
            console.log('No existing subjects found');
            // Clear any existing display
            const subjectsList = document.getElementById('subjectsList');
            if (subjectsList) {
                subjectsList.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading existing subjects:', error);
    }
}

// Display existing subjects in the subject selection interface
async function displayExistingSubjectsInSelection(subjects) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in displayExistingSubjectsInSelection, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Displaying existing subjects in selection interface:', subjects);
    
    const subjectsList = document.getElementById('subjectsList');
    if (!subjectsList) {
        console.error('subjectsList element not found');
        return;
    }
    
    // Clear existing content
    subjectsList.innerHTML = '';
    
    // Process each subject and its classes
    subjects.forEach(subject => {
        console.log('Processing existing subject:', subject);
        
        if (subject.classes && Array.isArray(subject.classes)) {
            subject.classes.forEach(classData => {
                console.log('Processing class data:', classData);
                
                const subjectDiv = document.createElement('div');
                subjectDiv.className = 'selected-subject';
                subjectDiv.dataset.subjectId = subject.subject_id;
                subjectDiv.dataset.subjectName = subject.subject;
                
                subjectDiv.innerHTML = `
                    <h4>${subject.subject}</h4>
                    <p>Classes: ${classData.grade}/${classData.class}</p>
                    <button class="remove-subject-btn" onclick="removeSubject(this)">Remove</button>
                `;
                
                subjectsList.appendChild(subjectDiv);
            });
        }
    });
    
    // Show the selected subjects section
    const selectedSubjects = document.getElementById('selectedSubjects');
    if (selectedSubjects) {
        selectedSubjects.style.display = 'block';
    }
    
    console.log('Finished displaying existing subjects');
}

// Duplicate function removed - showSubjectSelectionPrompt is already defined above

async function saveTeacherSubjects() {
    console.log('=== saveTeacherSubjects called ===');
    
    const selectedSubjects = [];
    
    // Get subjects from the subjectsList (the ones we added when saving classes)
    const subjectsList = document.getElementById('subjectsList');
    if (subjectsList) {
        const selectedSubjectDivs = subjectsList.querySelectorAll('.selected-subject');
        console.log('Found selected subject divs:', selectedSubjectDivs.length);
        
        selectedSubjectDivs.forEach(subjectDiv => {
            const subjectId = subjectDiv.dataset.subjectId;
            const subjectName = subjectDiv.dataset.subjectName;
            const classesText = subjectDiv.querySelector('p').textContent;
            
            console.log('Processing subject div:', { subjectId, subjectName, classesText });
            
            // Extract class information from the text "Classes: 1/15, 1/16"
            const classesMatch = classesText.match(/Classes: (.+)/);
            if (classesMatch) {
                const classList = classesMatch[1].split(', ').map(className => {
                    // Parse class format like "1/15" to get grade and class
                    const [grade, classNum] = className.split('/');
                    return {
                        grade: grade,
                        class: classNum
                    };
                });
                
                console.log('Extracted classes:', classList);
                
                selectedSubjects.push({
                    subject_id: parseInt(subjectId),
                    subject_name: subjectName,
                    classes: classList
                });
            }
        });
    }
    
    console.log('Final selected subjects to save:', selectedSubjects);
    
    if (selectedSubjects.length === 0) {
        showNotification('Please select at least one subject and class combination.', 'warning');
        return;
    }
    
    try {
        // Check if user session is still valid using JWT
        const teacherId = await getCurrentTeacherId();
        if (!teacherId) {
            console.error('No valid teacher session found in saveTeacherSubjects, redirecting to login');
            showNotification('Missing teacher session. Please sign in again.', 'error');
            // Redirect to login
            showSection('login-section');
            return;
        }
        
        console.log('Sending subjects to save:', selectedSubjects);
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/save-teacher-subjects',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjects: selectedSubjects
                })
            }
        );
        
        const data = await response.json();
        if (data.success) {
            showNotification('Subjects saved successfully!', 'success');
            
            // Remove the success message that was showing
            const successMessage = document.getElementById('subjectSuccessMessage');
            if (successMessage) {
                successMessage.remove();
            }
            
            // Hide subject selection and show success message
            document.getElementById('subject-selection-container').style.display = 'none';
            document.getElementById('subjectsSaved').style.display = 'block';
            
            // Show main cabinet container and test creation
            document.getElementById('main-cabinet-container').style.display = 'block';
            document.getElementById('testCreationSection').style.display = 'block';
            
            // Initialize grade button functionality
            initializeGradeButtons();
            
            // Show edit subjects button
            showEditSubjectsButton();
        } else {
            showNotification('Error saving subjects: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error saving subjects:', error);
        showNotification('Error saving subjects. Please try again.', 'error');
    }
}

function toggleSubjectDropdown() {
    const subjectDropdown = document.getElementById('subjectDropdown');
    const classSelection = document.getElementById('classSelection');
    
    if (subjectDropdown.style.display === 'none') {
        subjectDropdown.style.display = 'block';
        classSelection.style.display = 'none';
    } else {
        subjectDropdown.style.display = 'none';
        classSelection.style.display = 'none';
    }
}

async function loadSubjectsForDropdown() {
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-subjects');
        const data = await response.json();
        
        if (data.success) {
            const subjectSelect = document.getElementById('subjectSelect');
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">Select a subject</option>';
                data.subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.subject_id;
                    option.textContent = subject.subject;
                    subjectSelect.appendChild(option);
                });
            }
            
            // Add change event listener to subject select
            subjectSelect.addEventListener('change', onSubjectSelected);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function onSubjectSelected() {
    const subjectSelect = document.getElementById('subjectSelect');
    const selectedSubjectName = document.getElementById('selectedSubjectName');
    const classSelection = document.getElementById('classSelection');
    
    if (subjectSelect.value) {
        const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
        selectedSubjectName.textContent = selectedOption.textContent;
        classSelection.style.display = 'block';
        loadGradesAndClasses();
    } else {
        classSelection.style.display = 'none';
    }
}

function loadGradesAndClasses() {
    const gradesContainer = document.querySelector('.grades-container');
    if (!gradesContainer) return;
    
    gradesContainer.innerHTML = '';
    
    // Create grade sections for M1-M6 with correct class numbers
    for (let grade = 1; grade <= 6; grade++) {
        const gradeSection = document.createElement('div');
        gradeSection.className = 'grade-section';
        
        const gradeTitle = document.createElement('h4');
        gradeTitle.textContent = `Grade ${grade}`;
        gradeSection.appendChild(gradeTitle);
        
        const classCheckboxes = document.createElement('div');
        classCheckboxes.className = 'class-checkboxes';
        
        // Add class options based on grade with correct class numbers
        let classes;
        if (grade === 1 || grade === 2) {
            classes = ['15', '16'];
        } else if (grade === 3) {
            classes = ['15', '16'];
        } else if (grade === 4) {
            classes = ['13', '14'];
        } else if (grade === 5 || grade === 6) {
            classes = ['13', '14'];
        } else {
            classes = [];
        }
        
        classes.forEach(classNum => {
            const label = document.createElement('label');
            label.className = 'class-checkbox';
            label.htmlFor = `grade${grade}class${classNum}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `grade${grade}class${classNum}`;
            checkbox.value = `${grade}/${classNum}`;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${grade}/${classNum}`));
            classCheckboxes.appendChild(label);
        });
        
        gradeSection.appendChild(classCheckboxes);
        gradesContainer.appendChild(gradeSection);
    }
}

function saveClassesForSubject() {
    const subjectSelect = document.getElementById('subjectSelect');
    const selectedClasses = [];
    
    // Get all checked class checkboxes
    document.querySelectorAll('.class-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
        selectedClasses.push(checkbox.value);
    });
    
    if (selectedClasses.length === 0) {
        showNotification('Please select at least one class', 'warning');
        return;
    }
    
    // Add to selected subjects list
    const selectedSubjects = document.getElementById('selectedSubjects');
    const subjectsList = document.getElementById('subjectsList');
    
    if (selectedSubjects && subjectsList) {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'selected-subject';
        subjectDiv.dataset.subjectId = subjectSelect.value; // Store the subject ID
        subjectDiv.dataset.subjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent; // Store the subject name
        subjectDiv.innerHTML = `
            <h4>${subjectSelect.options[subjectSelect.selectedIndex].textContent}</h4>
            <p>Classes: ${selectedClasses.join(', ')}</p>
            <button class="btn btn-danger btn-sm remove-subject-btn" onclick="removeSubject(this)">Remove</button>
        `;
        subjectsList.appendChild(subjectDiv);
        
        selectedSubjects.style.display = 'block';
        
        // Reset subject selection for next subject
        resetSubjectSelection();
        
        // Show message that subject was added
        showSubjectAddedMessage(subjectSelect.options[subjectSelect.selectedIndex].textContent);
    }
}

// Reset subject selection for adding more subjects
function resetSubjectSelection() {
    // Reset subject dropdown
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.value = '';
    
    // Hide class selection
    document.getElementById('classSelection').style.display = 'none';
    
    // Clear all checkboxes
    document.querySelectorAll('.class-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear grades container
    const gradesContainer = document.querySelector('.grades-container');
    if (gradesContainer) {
        gradesContainer.innerHTML = '';
    }
    
    // Show subject dropdown again
    document.getElementById('subjectDropdown').style.display = 'none';
}

// Show message that subject was added
function showSubjectAddedMessage(subjectName) {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'subjectSuccessMessage';
    messageDiv.className = 'subject-added-message';
    messageDiv.innerHTML = `
        <p><strong>${subjectName}</strong> has been added successfully!</p>
        <p>You can now add another subject or click "Save Subjects" to finish.</p>
    `;
    
    // Insert message above the selected subjects list
    const selectedSubjects = document.getElementById('selectedSubjects');
    selectedSubjects.parentNode.insertBefore(messageDiv, selectedSubjects);
    
    // Message will stay visible until Save Subjects is pressed
}

function showConfirmationModal() {
    console.log('=== showConfirmationModal called ===');
    const modal = document.getElementById('confirmationModal');
    console.log('Modal element found:', modal);
    
    if (modal) {
        console.log('Setting modal display to flex');
        modal.style.display = 'flex';
        console.log('Modal display after setting:', modal.style.display);
        
        // Verify the modal is visible
        setTimeout(() => {
            console.log('Modal display after timeout:', modal.style.display);
            console.log('Modal computed style:', window.getComputedStyle(modal).display);
        }, 100);
    } else {
        console.error('Confirmation modal not found!');
    }
}
function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmSaveSubjects() {
    console.log('=== confirmSaveSubjects called ===');
    console.log('User clicked YES - proceeding to save subjects');
    
    hideConfirmationModal();
    
    // Actually save the subjects to the database
    console.log('Calling saveTeacherSubjects...');
    saveTeacherSubjects();
}

function cancelSaveSubjects() {
    console.log('=== cancelSaveSubjects called ===');
    console.log('User clicked NO - cancelling subject save');
    
    hideConfirmationModal();
    
    // Don't save, just keep the subject selection open for editing
    // The teacher can continue adding/removing subjects
    console.log('Subject saving cancelled, teacher can continue editing');
}

function removeSubject(button) {
    const subjectDiv = button.closest('.selected-subject');
    if (subjectDiv) {
        subjectDiv.remove();
        
        // If no subjects left, hide the selected subjects section
        const subjectsList = document.getElementById('subjectsList');
        if (subjectsList && subjectsList.children.length === 0) {
            document.getElementById('selectedSubjects').style.display = 'none';
        }
    }
}

// Show edit subjects button
async function showEditSubjectsButton() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showEditSubjectsButton, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.style.display = 'block';
    }
}

// Hide edit subjects button
async function hideEditSubjectsButton() {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in hideEditSubjectsButton, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const editSubjectsBtn = document.getElementById('editSubjectsBtn');
    if (editSubjectsBtn) {
        editSubjectsBtn.style.display = 'none';
    }
}

async function generateClassButtons(grade) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in generateClassButtons, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return '';
    }
    
    let classes;
    if (grade === 'M1' || grade === 'M2') {
        classes = ['1/15', '1/16'];
    } else if (grade === 'M3') {
        classes = ['3/15', '3/16'];
    } else if (grade === 'M4') {
        classes = ['4/13', '4/14'];
    } else if (grade === 'M5' || grade === 'M6') {
        classes = ['5/13', '5/14'];
    } else {
        classes = [];
    }
    
    return classes.map(className => 
        `<button class="class-btn small-btn" onclick="showClassResults('${grade}', '${className}')">${grade} ${className}</button>`
    ).join('');
}

async function showClassResults(grade, className) {
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 Class button click blocked - currently in test creation mode');
        return;
    }
    
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showClassResults, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            `/.netlify/functions/get-class-results?grade=${grade}&class=${className}&semester=1`
        );
        const data = await response.json();
        
        if (data.success) {
            displayClassResultsAdmin(data.results, grade, className);
        }
    } catch (error) {
        console.error('Error loading class results:', error);
    }
}