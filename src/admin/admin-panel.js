// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  debugFunction,
  clearAllLocalStorage,
  exportLocalStorage,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Panel controls and editing functions
export {
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
  hideAssignmentDeletionForm
}

// Admin - Panel Controls & Editing
// Functions: toggleSection, addClickListeners, addKeyboardAccessibility,  addEditableFieldListeners, 
// makeFieldEditable, saveField, toggleTestsContent, toggleAssignmentsContent, toggleResultsContent

// TODO: Copy functions from script.js

let currentDeletionType = null;
let teachersList = [];
let subjectsList = [];

// Initialize deletion functionality
function initializeTestDeletion() {
  console.log('🔧 initializeTestDeletion called');
  console.log('🔧 DOM ready state:', document.readyState);
  console.log('🔧 Admin panel exists:', !!document.getElementById('admin-panel'));
  console.log('🔧 dataTeacherSelect exists:', !!document.getElementById('dataTeacherSelect'));
  console.log('🔧 assignmentTeacherSelect exists:', !!document.getElementById('assignmentTeacherSelect'));
  
  loadTeachersList();
  loadSubjectsList();
  setupDateValidation();
  setupTeacherSelectionListeners();
}

// Load teachers for dropdowns
async function loadTeachersList() {
  console.log('🔧 loadTeachersList called');
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-all-teachers');
    const data = await response.json();
    console.log('🔧 Teachers response:', data);
    
    if (data.success) {
      teachersList = data.teachers;
      console.log('🔧 Set teachersList to:', teachersList);
      populateTeacherDropdowns();
    } else {
      console.error('Failed to load teachers:', data.message);
    }
  } catch (error) {
    console.error('Error loading teachers:', error);
  }
}

// Load subjects for dropdowns
async function loadSubjectsList() {
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-all-subjects');
    const data = await response.json();
    if (data.success) {
      subjectsList = data.subjects;
      populateSubjectDropdowns();
    } else {
      console.error('Failed to load subjects:', data.message);
    }
  } catch (error) {
    console.error('Error loading subjects:', error);
  }
}

// Populate teacher dropdowns
function populateTeacherDropdowns() {
  console.log('🔧 populateTeacherDropdowns called');
  console.log('🔧 teachersList:', teachersList);
  console.log('🔧 teachersList length:', teachersList.length);
  
  const teacherSelects = ['assignmentTeacherSelect', 'dataTeacherSelect'];
  
  teacherSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    console.log(`🔧 Looking for select: ${selectId}, found:`, select);
    
    if (select) {
      select.innerHTML = '<option value="">Select Teacher</option>';
      teachersList.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.teacher_id;
        option.textContent = teacher.username;
        select.appendChild(option);
      });
      console.log(`🔧 Populated ${selectId} with ${teachersList.length} teachers`);
    } else {
      console.log(`🔧 Select element ${selectId} not found!`);
    }
  });
}

// Populate subject dropdowns
function populateSubjectDropdowns() {
  const subjectSelects = ['assignmentSubjectSelect', 'dataSubjectSelect'];
  
  subjectSelects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">All Subjects</option>';
      subjectsList.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.subject_id;
        option.textContent = subject.subject_name;
        select.appendChild(option);
      });
    }
  });
}

// Setup date validation
function setupDateValidation() {
  // Add any date validation logic here if needed
}

// Setup event listeners for teacher selection changes
function setupTeacherSelectionListeners() {
  const assignmentTeacherSelect = document.getElementById('assignmentTeacherSelect');
  if (assignmentTeacherSelect) {
    assignmentTeacherSelect.addEventListener('change', (e) => {
      loadTeacherGradesClasses(e.target.value, 'assignmentGradesClassesContainer');
    });
  }
  
  const dataTeacherSelect = document.getElementById('dataTeacherSelect');
  if (dataTeacherSelect) {
    dataTeacherSelect.addEventListener('change', (e) => {
      loadTeacherGradesClasses(e.target.value, 'dataGradesClassesContainer');
    });
  }
  
  // Add form submission listeners
  const assignmentForm = document.getElementById('assignmentDeletionFormElement');
  if (assignmentForm) {
    assignmentForm.addEventListener('submit', handleAssignmentDeletion);
  }
  
  const dataForm = document.getElementById('testDataDeletionFormElement');
  if (dataForm) {
    dataForm.addEventListener('submit', handleTestDataDeletion);
  }
}

async function showTestDataDeletion() {
  currentDeletionType = 'data';
  document.getElementById('testDataDeletionForm').style.display = 'block';
  document.getElementById('assignmentDeletionForm').style.display = 'none';
  
  // Reset form
  document.getElementById('testDataDeletionFormElement').reset();
  document.getElementById('dataGradesClassesContainer').innerHTML = '';
}

function hideTestDataDeletionForm() {
  document.getElementById('testDataDeletionForm').style.display = 'none';
}

function hideAssignmentDeletionForm() {
  document.getElementById('assignmentDeletionForm').style.display = 'none';
}


// Load grades and classes for selected teacher
async function loadTeacherGradesClasses(teacherId, containerId) {
  if (!teacherId) {
    document.getElementById(containerId).innerHTML = '';
    // Also clear the subject dropdown
    const subjectSelectId = containerId === 'dataGradesClassesContainer' ? 'dataSubjectSelect' : 'assignmentSubjectSelect';
    const subjectSelect = document.getElementById(subjectSelectId);
    if (subjectSelect) {
      subjectSelect.innerHTML = '<option value="">All Subjects</option>';
    }
    return;
  }

  try {
    // Check if current user is admin (role = 'admin')
    const token = window.tokenManager.getAccessToken();
    let url = '/.netlify/functions/get-teacher-grades-classes';
    
    // If user is admin, add teacher_id as query parameter
    if (token) {
      try {
        const decoded = window.tokenManager.decodeToken(token);
        if (decoded.role === 'admin') {
          url += `?teacher_id=${teacherId}`;
        }
      } catch (error) {
        console.warn('Could not decode token for admin check:', error);
      }
    }
    
    const response = await window.tokenManager.makeAuthenticatedRequest(url);
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed to load grades/classes:', data.message);
      return;
    }
    
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (data.data.length === 0) {
      container.innerHTML = '<p>No grades/classes found for this teacher.</p>';
      return;
    }
    
    // Group by grade
    const groupedByGrade = {};
    data.data.forEach(item => {
      if (!groupedByGrade[item.grade]) {
        groupedByGrade[item.grade] = [];
      }
      groupedByGrade[item.grade].push(item.class);
    });
    
    // Create checkboxes
    Object.keys(groupedByGrade).sort().forEach(grade => {
      const gradeDiv = document.createElement('div');
      gradeDiv.className = 'grade-group';
      
      const gradeLabel = document.createElement('h4');
      gradeLabel.textContent = `Grade ${grade}`;
      gradeDiv.appendChild(gradeLabel);
      
      groupedByGrade[grade].sort().forEach(className => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'grade-class-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${grade}-${className}`;
        checkbox.value = `${grade}-${className}`;
        
        const label = document.createElement('label');
        label.htmlFor = `${grade}-${className}`;
        label.textContent = `Class ${className}`;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        gradeDiv.appendChild(checkboxDiv);
      });
      
      container.appendChild(gradeDiv);
    });
    
    // Also populate subject dropdown with teacher's subjects
    populateTeacherSubjectDropdown(teacherId, containerId);
    
  } catch (error) {
    console.error('Error loading grades/classes:', error);
    document.getElementById(containerId).innerHTML = '<p>Error loading grades/classes.</p>';
  }
}

// Populate subject dropdown with teacher's subjects
async function populateTeacherSubjectDropdown(teacherId, containerId) {
  try {
    // Get subjects for this teacher
    const url = `/.netlify/functions/get-teacher-subjects?teacher_id=${teacherId}`;
    const response = await window.tokenManager.makeAuthenticatedRequest(url);
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed to load teacher subjects:', data.message);
      return;
    }
    
    // Determine which subject dropdown to populate
    const subjectSelectId = containerId === 'dataGradesClassesContainer' ? 'dataSubjectSelect' : 'assignmentSubjectSelect';
    const subjectSelect = document.getElementById(subjectSelectId);
    
    if (!subjectSelect) {
      console.error(`Subject dropdown ${subjectSelectId} not found`);
      return;
    }
    
    // Clear existing options
    subjectSelect.innerHTML = '<option value="">All Subjects</option>';
    
    if (data.subjects && data.subjects.length > 0) {
      // Add subjects to dropdown
      data.subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.subject_id;
        option.textContent = subject.subject;
        subjectSelect.appendChild(option);
      });
      console.log(`🔧 Populated ${subjectSelectId} with ${data.subjects.length} teacher subjects`);
    } else {
      console.log(`🔧 No subjects found for teacher ${teacherId}`);
    }
    
  } catch (error) {
    console.error('Error loading teacher subjects for dropdown:', error);
  }
}

// Handle assignment deletion form submission
async function handleAssignmentDeletion(event) {
  event.preventDefault();
  
  if (!confirm('Are you sure you want to delete test assignments? This action cannot be undone.')) {
    return;
  }
  
  const formData = new FormData(event.target);
  const selectedGradesClasses = getSelectedGradesClasses('assignmentGradesClassesContainer');
  
  if (selectedGradesClasses.length === 0) {
    alert('Please select at least one grade/class combination.');
    return;
  }
  
  const teacherId = formData.get('assignmentTeacherSelect');
  if (!teacherId || teacherId === '') {
    alert('Please select a teacher.');
    return;
  }
  
  const deletionData = {
    startDate: formData.get('assignmentStartDate'),
    endDate: formData.get('assignmentEndDate'),
    teacherId: formData.get('assignmentTeacherSelect'),
    grades: selectedGradesClasses.map(item => item.grade),
    classes: selectedGradesClasses.map(item => item.class),
    subjectId: formData.get('assignmentSubjectSelect') || null
  };
  
  console.log('🔧 Assignment deletion data:', deletionData);
  console.log('🔧 Teacher ID from form:', formData.get('assignmentTeacherSelect'));
  console.log('🔧 Teacher ID type:', typeof formData.get('assignmentTeacherSelect'));
  console.log('🔧 Teacher ID === "":', formData.get('assignmentTeacherSelect') === "");
  
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/delete-test-assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletionData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Successfully deleted ${result.deletedCount} test assignments.`);
      hideAssignmentDeletionForm();
    } else {
      alert(`Error: ${result.message || 'Failed to delete assignments'}`);
    }
  } catch (error) {
    console.error('Error deleting assignments:', error);
    alert('Error deleting assignments. Please try again.');
  }
}

// Handle test data and assignments deletion
async function handleTestDataDeletion(event) {
  event.preventDefault();
  
  if (!confirm('Are you sure you want to delete test questions, results, and assignments? This action cannot be undone.')) {
    return;
  }
  
  const formData = new FormData(event.target);
  const selectedGradesClasses = getSelectedGradesClasses('dataGradesClassesContainer');
  
  if (selectedGradesClasses.length === 0) {
    alert('Please select at least one grade/class combination.');
    return;
  }
  
  const teacherId = formData.get('dataTeacherSelect');
  if (!teacherId || teacherId === '') {
    alert('Please select a teacher.');
    return;
  }
  
  const deletionData = {
    startDate: formData.get('dataStartDate'),
    endDate: formData.get('dataEndDate'),
    teacherId: formData.get('dataTeacherSelect'),
    grades: selectedGradesClasses.map(item => item.grade),
    classes: selectedGradesClasses.map(item => item.class),
    subjectId: formData.get('dataSubjectSelect') || null
  };
  
  console.log('DEBUG - Frontend deletion data:', deletionData);
  console.log('DEBUG - Teacher ID from form:', formData.get('dataTeacherSelect'));
  console.log('DEBUG - Teacher ID type:', typeof formData.get('dataTeacherSelect'));
  console.log('DEBUG - Teacher ID === "":', formData.get('dataTeacherSelect') === "");
  
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/delete-test-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletionData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Successfully deleted ${result.deletedCount} test records and assignments.`);
      hideTestDataDeletionForm();
    } else {
      alert(`Error: ${result.message || 'Failed to delete test data'}`);
    }
  } catch (error) {
    console.error('Error deleting test data:', error);
    alert('Error deleting test data. Please try again.');
  }
}

// Get selected grades and classes from checkboxes
function getSelectedGradesClasses(containerId) {
  const container = document.getElementById(containerId);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  
  return Array.from(checkboxes).map(checkbox => {
    const [grade, className] = checkbox.value.split('-');
    return { grade, class: className };
  });
}


// Check which teachers have subjects assigned (debug function)
async function checkTeacherSubjects() {
  try {
    console.log('Checking which teachers have subjects assigned...');
    
    // Get all teachers
    const teachersResponse = await window.tokenManager.makeAuthenticatedRequest(
      '/.netlify/functions/get-all-teachers'
    );
    const teachersData = await teachersResponse.json();
    
    if (!teachersData.success) {
      console.error('Failed to load teachers:', teachersData.message);
      return;
    }
    
    console.log('Found teachers:', teachersData.teachers);
    
    // Check each teacher's subjects
    for (const teacher of teachersData.teachers) {
      try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
          `/.netlify/functions/get-teacher-grades-classes?teacher_id=${teacher.teacher_id}`
        );
        const data = await response.json();
        
        console.log(`Teacher ${teacher.username} (${teacher.teacher_id}):`, {
          hasSubjects: data.data.length > 0,
          subjectCount: data.data.length,
          subjects: data.data
        });
      } catch (error) {
        console.error(`Error checking teacher ${teacher.username}:`, error);
      }
    }
  } catch (error) {
    console.error('Error checking teacher subjects:', error);
  }
}
function toggleSection(sectionId) {
    console.log(`🔧 toggleSection called with sectionId: ${sectionId}`);
    
    // Prevent rapid successive calls (debounce)
    const now = Date.now();
    if (toggleDebounce[sectionId] && (now - toggleDebounce[sectionId] < 300)) {
      console.log(`🔧 Ignoring rapid successive call for ${sectionId}`);
      return;
    }
    toggleDebounce[sectionId] = now;
    
    const section = document.getElementById(sectionId);
    if (!section) {
      console.error(`❌ Section with id '${sectionId}' not found!`);
      return;
    }
    
    const header = section.previousElementSibling;
    if (!header || !header.classList.contains('section-header')) {
      console.error(`❌ Header not found for section '${sectionId}'!`);
      return;
    }
    
    const content = section;
    
    const wasCollapsed = content.classList.contains('collapsed');
    console.log(`🔧 Current state - collapsed: ${wasCollapsed}`);
    console.log(`🔧 Current classes: ${content.className}`);
    
    // Toggle the collapsed state - click to expand, click again to collapse
    if (wasCollapsed) {
      // Currently collapsed, so expand it
      content.classList.remove('collapsed');
      header.classList.remove('collapsed');
      console.log(`✅ Section ${sectionId} expanded`);
      console.log(`🔧 Classes after expand: ${content.className}`);
    } else {
      // Currently expanded, so collapse it
      content.classList.add('collapsed');
      header.classList.add('collapsed');
      console.log(`✅ Section ${sectionId} collapsed`);
      console.log(`🔧 Classes after collapse: ${content.className}`);
    }
    
    const isNowCollapsed = content.classList.contains('collapsed');
    console.log(`🔧 New state - collapsed: ${isNowCollapsed}`);
    
    // Force a reflow to ensure CSS changes take effect
    content.offsetHeight;
    
    // Verify the visual state
    const computedStyle = window.getComputedStyle(content);
    console.log(`🔧 Computed max-height: ${computedStyle.maxHeight}`);
    console.log(`🔧 Computed opacity: ${computedStyle.opacity}`);
  }

  // Add click event listeners as backup
function addClickListeners() {
    console.log('🔧 Adding click listeners to section headers...');
    
    const headers = document.querySelectorAll('.section-header');
    console.log(`🔧 Found ${headers.length} section headers`);
    
    headers.forEach((header, index) => {
      const headerText = header.textContent.trim();
      console.log(`🔧 Processing header ${index + 1}:`, headerText);
      
      // Skip if already has our event listener
      if (header.dataset.listenerAdded === 'true') {
        console.log(`🔧 Skipping header ${headerText} - listener already added`);
        return;
      }
      
      // Remove existing onclick to avoid conflicts
      const oldOnclick = header.getAttribute('onclick');
      if (oldOnclick) {
        console.log(`🔧 Removed old onclick: ${oldOnclick}`);
      }
      header.removeAttribute('onclick');
      
      // Add event listener with multiple event types for debugging
      const clickHandler = function(e) {
        console.log(`🔧 CLICK EVENT FIRED for header: ${headerText}`);
        console.log(`🔧 Event target:`, e.target);
        console.log(`🔧 Current target:`, e.currentTarget);
        
        e.preventDefault();
        e.stopPropagation();
        console.log(`🔧 Click event triggered for header: ${headerText}`);
        
        const sectionId = this.nextElementSibling.id;
        console.log(`🔧 Section ID: ${sectionId}`);
        
        // Add visual feedback
        this.style.background = 'rgba(255, 255, 255, 0.2)';
        setTimeout(() => {
          this.style.background = '';
        }, 200);
        
        toggleSection(sectionId);
      };
      
      // Try multiple event types
      header.addEventListener('click', clickHandler);
      header.addEventListener('mousedown', function(e) {
        console.log(`🔧 MOUSEDOWN detected on header: ${headerText}`);
      });
      header.addEventListener('mouseup', function(e) {
        console.log(`🔧 MOUSEUP detected on header: ${headerText}`);
      });
      
      // Mark as having listener added
      header.dataset.listenerAdded = 'true';
      
      // Add visual feedback and ensure clickability
      header.style.cursor = 'pointer';
      header.style.position = 'relative';
      header.style.zIndex = '1000'; // Higher z-index to ensure it's on top
      header.style.pointerEvents = 'auto'; // Ensure pointer events work
      
      console.log(`✅ Added click listener to header: ${headerText}`);
    });
  }

  // Add keyboard accessibility
function addKeyboardAccessibility() {
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const sectionId = this.nextElementSibling.id;
          toggleSection(sectionId);
        }
      });
      
      // Add tabindex for keyboard navigation
      header.setAttribute('tabindex', '0');
    });
  }

  // Test function to verify toggleSection is accessible
function testToggleSection() {
    console.log('🧪 Testing toggleSection function...');
    console.log('🧪 toggleSection function exists:', typeof toggleSection);
    console.log('🧪 Available sections:', document.querySelectorAll('.section-content').length);
    
    // Test with first section
    const firstSection = document.querySelector('.section-content');
    if (firstSection) {
      console.log('🧪 First section id:', firstSection.id);
      console.log('🧪 First section classes:', firstSection.className);
      
      // Test direct function call
      console.log('🧪 Testing direct toggleSection call...');
      try {
        toggleSection(firstSection.id);
        console.log('✅ Direct call successful!');
        
        // Test the reverse toggle
        setTimeout(() => {
          console.log('🧪 Testing reverse toggle...');
          toggleSection(firstSection.id);
          console.log('✅ Reverse toggle successful!');
        }, 1000);
        
      } catch (error) {
        console.error('❌ Direct call failed:', error);
      }
    }
  }

  function addEditableFieldListeners() {
    document.querySelectorAll('.editable-field').forEach(field => {
      field.addEventListener('dblclick', function() {
        makeFieldEditable(this);
      });
    });
  }

  function makeFieldEditable(fieldElement) {
    const currentValue = fieldElement.textContent;
    const fieldName = fieldElement.dataset.field;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'editable-input';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn-save';
    saveBtn.onclick = () => saveField(fieldElement, input, saveBtn, cancelBtn);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-cancel';
    cancelBtn.onclick = () => cancelEdit(fieldElement, currentValue, input, saveBtn, cancelBtn);
    
    fieldElement.innerHTML = '';
    fieldElement.appendChild(input);
    fieldElement.appendChild(saveBtn);
    fieldElement.appendChild(cancelBtn);
    
    input.focus();
  }

  function saveField(fieldElement, input, saveBtn, cancelBtn) {
    const newValue = input.value;
    const fieldName = fieldElement.dataset.field;
    const row = fieldElement.closest('tr');
    
    if (row.dataset.userId) {
      updateUserField(row.dataset.userId, fieldName, newValue, fieldElement);
    } else if (row.dataset.teacherId) {
      updateTeacherField(row.dataset.teacherId, fieldName, newValue, fieldElement);
    }
    
    // Clean up
    saveBtn.remove();
    cancelBtn.remove();
    input.remove();
    fieldElement.textContent = newValue;
  }

  function toggleTestsContent() {
    const container = document.getElementById('testsContainer');
    const button = document.querySelector('button[onclick="toggleTestsContent()"]');
    
    if (!container) {
      console.error('❌ testsContainer not found');
      return;
    }
    
    if (!button) {
      console.error('❌ Button not found');
      return;
    }
    
    const computedDisplay = window.getComputedStyle(container).display;
    const isHidden = container.style.display === 'none' || computedDisplay === 'none';
    
    if (isHidden) {
      // Show content
      container.style.display = 'block';
      getAllTests();
      button.textContent = 'Hide Tests ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get All Tests ▶';
      button.classList.remove('active');
    }
  }

  function toggleAssignmentsContent() {
    const container = document.getElementById('assignmentsContainer');
    const button = document.querySelector('button[onclick="toggleAssignmentsContent()"]');
    
    if (!container) {
      console.error('❌ assignmentsContainer not found');
      return;
    }
    
    if (!button) {
      console.error('❌ Button not found');
      return;
    }
    
    const computedDisplay = window.getComputedStyle(container).display;
    const isHidden = container.style.display === 'none' || computedDisplay === 'none';
    
    if (isHidden) {
      // Show content
      container.style.display = 'block';
      getTestAssignments();
      button.textContent = 'Hide Assignments ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get Test Assignments ▶';
      button.classList.remove('active');
    }
  }

  function toggleResultsContent() {
    console.log('🔧 toggleResultsContent called');
    const container = document.getElementById('resultsContainer');
    const button = document.querySelector('button[onclick="toggleResultsContent()"]');
    
    console.log('🔧 Container found:', container);
    console.log('🔧 Button found:', button);
    
    if (!container) {
      console.error('❌ resultsContainer not found');
      return;
    }
    
    if (!button) {
      console.error('❌ Button not found');
      return;
    }
    
    if (container.style.display === 'none' || container.style.display === '') {
      // Show content
      container.style.display = 'block';
      getTestResults();
      button.textContent = 'Hide Results ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get Test Results ▶';
      button.classList.remove('active');
    }
  }

// Missing functions copied from old script
function testAllToggles() {
  console.log('🔧 Testing all toggle functions...');
  
  const sectionsToTest = ['usersSection', 'teachersSection', 'subjectsSection'];
  
  sectionsToTest.forEach(sectionId => {
    console.log(`🔧 Testing toggle for: ${sectionId}`);
    toggleSection(sectionId);
  });
}

function manualToggleTest() {
  console.log('🔧 Manual toggle test called');
  
  // Test with a specific section
  const sectionId = 'usersSection';
  const section = document.getElementById(sectionId);
  
  if (section) {
    console.log(`🔧 Manually toggling section: ${sectionId}`);
    toggleSection(sectionId);
  } else {
    console.error(`❌ Section ${sectionId} not found for manual test`);
  }
}

// Admin test management functions (copied from old script.js)
async function getAllTests() {
  try {
    console.log('🔧 Getting all tests...');
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-all-tests');
    const data = await response.json();
    
    if (data.success) {
      displayTestsTable(data.tests);
    } else {
      console.error('Failed to get tests:', data.message);
      showNotification('Failed to get tests: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching tests:', error);
    showNotification('Error fetching tests', 'error');
  }
}

async function getTestAssignments() {
  try {
    console.log('🔧 Getting test assignments...');
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-test-assignments');
    const data = await response.json();
    
    if (data.success) {
      displayTestAssignmentsTable(data.assignments);
    } else {
      console.error('Failed to get test assignments:', data.message);
      showNotification('Failed to get test assignments: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching test assignments:', error);
    showNotification('Error fetching test assignments', 'error');
  }
}

async function getTestResults() {
  try {
    console.log('🔧 Getting test results...');
    console.log('Token manager available:', !!window.tokenManager);
    console.log('Token manager authenticated:', window.tokenManager?.isAuthenticated());
    
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-test-results');
    console.log('Test results response:', response);
    console.log('Test results response status:', response.status);
    
    const data = await response.json();
    console.log('Test results data:', data);
    
    if (data.success) {
      console.log('Test results loaded successfully, displaying table...');
      displayTestResultsTable(data.results);
    } else {
      console.error('Failed to get test results:', data.message);
      showNotification('Failed to get test results: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error fetching test results:', error);
    showNotification('Error fetching test results', 'error');
  }
}

// Display functions for test data
function displayTestsTable(tests) {
  const container = document.getElementById('testsContainer');
  if (!container) {
    console.error('Tests container not found');
    return;
  }
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Questions</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tests.map(test => `
          <tr>
            <td>${test.id}</td>
            <td>${test.test_name}</td>
            <td>${test.test_type.replace('_', ' ')}</td>
            <td>${test.num_questions || test.num_blocks || 0}</td>
            <td>${new Date(test.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="editTest(${test.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function displayTestAssignmentsTable(assignments) {
  const container = document.getElementById('assignmentsContainer');
  if (!container) {
    console.error('Assignments container not found');
    return;
  }
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Assignment ID</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Grade</th>
          <th>Class</th>
          <th>Assigned</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${assignments.map(assignment => `
          <tr>
            <td>${assignment.assignment_id}</td>
            <td>${assignment.test_name}</td>
            <td>${assignment.test_type.replace('_', ' ')}</td>
            <td>M${assignment.grade}</td>
            <td>${assignment.grade}/${assignment.class}</td>
            <td>${new Date(assignment.assigned_at).toLocaleDateString()}</td>
            <td>
              <span class="text-muted">Use bulk deletion below</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function displayTestResultsTable(results) {
  console.log('displayTestResultsTable called with results:', results);
  console.log('Results type:', typeof results);
  console.log('Results length:', results?.length);
  
  const container = document.getElementById('resultsContainer');
  if (!container) {
    console.error('Results container not found');
    return;
  }
  
  console.log('Results container found:', container);
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Result ID</th>
          <th>Student Info</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Score</th>
          <th>Max Score</th>
          <th>Percentage</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const percentage = result.score_percentage || Math.round((result.score / result.max_score) * 100);
          const scoreClass = percentage >= 90 ? 'score-excellent' : 
                           percentage >= 80 ? 'score-good' : 
                           percentage >= 60 ? 'score-average' : 'score-poor';
          
          return `
          <tr>
            <td>${result.id}</td>
            <td>${result.student_name || 'Unknown'} ${result.student_surname || ''} (${result.student_id}) - #${result.student_number || 'N/A'} - ${result.student_nickname || 'No nickname'}</td>
            <td>${result.test_name}</td>
            <td>${result.test_type.replace('_', ' ')}</td>
            <td>${result.score}</td>
            <td>${result.max_score}</td>
            <td>${percentage}%</td>
            <td>${new Date(result.submitted_at).toLocaleDateString()}</td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
}
