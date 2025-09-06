// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  getCurrentAdminId,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Content and academic management functions
export {
  loadAllSubjects,
  displayAllSubjects,
  displaySubjectsTable,
  toggleSubjectsContent,
  showAddSubjectForm,
  hideAddSubjectForm,
  editSubjectRow,
  showAdminSubjectEditor,
  loadAcademicYear,
  displayAcademicYear,
  showAddAcademicYearForm,
  hideAddAcademicYearForm,
  handleAddAcademicYear,
  toggleAcademicYearContent,
  showAcademicYearEditor,
  displayClassResultsAdmin
}

// Admin - Subject & Academic Management
// Functions: loadAllSubjects, displayAllSubjects, displaySubjectsTable, toggleSubjectsContent, showAddSubjectForm, hideAddSubjectForm, editSubjectRow, showAdminSubjectEditor, loadAcademicYear, 
// displayAcademicYear, showAddAcademicYearForm, hideAddAcademicYearForm, handleAddAcademicYear, toggleAcademicYearContent, showAcademicYearEditor, displayClassResultsAdmin

// TODO: Copy functions from script.js
async function loadAllSubjects() {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in loadAllSubjects, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-subjects'
        );
        const data = await response.json();
        
        if (data.success) {
            displayAllSubjects(data.subjects);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}
async function displayAllSubjects(subjects) {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in displayAllSubjects, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('allSubjectsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>All Subjects</h3>
        <table>
            <thead>
                <tr>
                    <th>Subject ID</th>
                    <th>Subject Name</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map(subject => `
                    <tr>
                        <td>${subject.subject_id}</td>
                        <td>${subject.subject}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Display subjects table
function displaySubjectsTable(subjects, container) {
    if (subjects.length === 0) {
        container.innerHTML = '<p>No subjects found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Subject ID</th>
                <th>Subject</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject.subject_id}</td>
            <td>${subject.subject}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

function toggleSubjectsContent() {
    const container = document.getElementById('allSubjectsContainer');
    const button = document.querySelector('button[onclick="toggleSubjectsContent()"]');
    
    if (!container) {
      console.error('❌ allSubjectsContainer not found');
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
      getAllSubjects();
      button.textContent = 'Hide Subjects ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get All Subjects ▶';
      button.classList.remove('active');
    }
  }

  function showAddSubjectForm() {
    document.getElementById('addSubjectForm').style.display = 'block';
  }

  function hideAddSubjectForm() {
    document.getElementById('addSubjectForm').style.display = 'none';
    document.getElementById('newSubjectForm').reset();
  }

  function editSubjectRow(subjectId) {
    console.log('🔧 editSubjectRow called with subjectId:', subjectId);
    // This function is called when the Edit button is clicked for subjects
    const row = document.querySelector(`tr[data-subject-id="${subjectId}"]`);
    if (row) {
      const editableFields = row.querySelectorAll('.editable-field');
      editableFields.forEach(field => {
        makeFieldEditable(field);
      });
    } else {
      console.error('❌ Row not found for subjectId:', subjectId);
    }
  }

  function showAdminSubjectEditor() {
    console.log('Showing admin subject editor...');
    // TODO: Implement admin subject editor
}

async function loadAcademicYear() {
    // Check if user session is still valid using JWT
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error('No valid session found in loadAcademicYear, redirecting to login');
        showSection('login-section');
        return;
    }
    
    // Admin users can check academic year without teacher_id
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    console.log('Loading academic year for user role:', userInfo.role);
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-academic-year'
        );
        const data = await response.json();
        
        if (data.success) {
            displayAcademicYear(data.academic_years);
        }
    } catch (error) {
        console.error('Error loading academic year:', error);
    }
}

async function displayAcademicYear(academicYears) {
    // Admin users can display academic year without teacher_id check
    
    const container = document.getElementById('academicYearTable');
    if (!container) return;
    
    container.innerHTML = `
        <h3>Academic Years</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Term</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                </tr>
            </thead>
            <tbody>
                ${academicYears.map(ay => `
                    <tr>
                        <td>${ay.id}</td>
                        <td>${ay.academic_year}</td>
                        <td>${ay.semester}</td>
                        <td>${ay.term}</td>
                        <td>${ay.start_date}</td>
                        <td>${ay.end_date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Academic Year Form Functions
function showAddAcademicYearForm() {
    const form = document.getElementById('addAcademicYearForm');
    if (form) {
        form.style.display = 'block';
        // Set default dates (current academic year)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // January = 0
        
        // Auto-select academic year based on current date
        const academicYearSelect = document.getElementById('newAcademicYear');
        if (currentMonth >= 7) { // July onwards = new academic year
            academicYearSelect.value = `${currentYear}-${currentYear + 1}`;
        } else { // January-June = previous academic year
            academicYearSelect.value = `${currentYear - 1}-${currentYear}`;
        }
    }
}

function hideAddAcademicYearForm() {
    const form = document.getElementById('addAcademicYearForm');
    if (form) {
        form.style.display = 'none';
        // Reset form
        document.getElementById('newAcademicYearForm').reset();
    }
}

// Add Academic Year Form Handler
async function handleAddAcademicYear(event) {
    event.preventDefault();
    
    const academicYear = document.getElementById('newAcademicYear').value.trim();
    const semester = document.getElementById('newSemester').value;
    const term = document.getElementById('newTerm').value;
    const startDate = document.getElementById('newStartDate').value;
    const endDate = document.getElementById('newEndDate').value;
    
    // Validate inputs
    if (!academicYear || !semester || !term || !startDate || !endDate) {
        alert('Please fill in all fields');
        return;
    }
    
    // Validate academic year format (optional)
    const academicYearPattern = /^\d{4}-\d{4}$/;
    if (!academicYearPattern.test(academicYear)) {
        alert('Academic Year should be in format: YYYY-YYYY (e.g., 2024-2025)');
        return;
    }
    
    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/edit-academic-year',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add',
                    academic_year: academicYear,
                    semester: parseInt(semester),
                    term: parseInt(term),
                    start_date: startDate,
                    end_date: endDate
                })
            }
        );
        
        const data = await response.json();
        
        if (data.success || response.ok) {
            alert('Academic year added successfully!');
            hideAddAcademicYearForm();
            // Refresh the academic year table
            loadAcademicYear();
        } else {
            alert(`Failed to add academic year: ${data.error || data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error adding academic year:', error);
        alert('Failed to add academic year. Please try again.');
    }
}

function toggleAcademicYearContent() {
    const container = document.getElementById('academicYearTable');
    const button = document.getElementById('checkAcademicYearBtn');
    
    if (!container) {
      console.error('❌ academicYearTable not found');
      return;
    }
    
    if (!button) {
      console.error('❌ checkAcademicYearBtn not found');
      return;
    }
    
    const computedDisplay = window.getComputedStyle(container).display;
    const isHidden = container.style.display === 'none' || computedDisplay === 'none';
    
    if (isHidden) {
      // Show content
      container.style.display = 'block';
      loadAcademicYear();
      button.textContent = 'Hide Academic Year ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Check Academic Year ▶';
      button.classList.remove('active');
    }
  }

  function showAcademicYearEditor() {
    console.log('Showing academic year editor...');
    // TODO: Implement admin subject editor
}

async function displayClassResultsAdmin(results, grade, className) {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in displayClassResultsAdmin, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('displayClassResultsAdmin called with:', { results, grade, className });
    
    const resultsContainer = document.getElementById('resultsTables');
    console.log('resultsContainer element:', resultsContainer);
    
    if (!resultsContainer) {
        console.error('resultsTables not found!');
        return;
    }
    
    resultsContainer.innerHTML = '';
    console.log('Cleared resultsContainer');
    
    const header = document.createElement('h3');
    header.textContent = `${grade}/${className} - Test Results`;
    console.log('Created header with text:', header.textContent);
    
    resultsContainer.appendChild(header);
    console.log('Appended header to container');
    
    if (results.length === 0) {
        resultsContainer.innerHTML += '<p>No test results available for this class.</p>';
        console.log('Added no results message');
        return;
    }
    
    console.log('Creating table for', results.length, 'results');
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
                <th>Average Score</th>
                <th>Max Score</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.student_id}</td>
            <td>${result.name}</td>
            <td>${result.surname}</td>
            <td>${result.nickname}</td>
            <td>${result.avg_score}</td>
            <td>${result.max_score}</td>
        `;
        tbody.appendChild(row);
    });
    
    resultsContainer.appendChild(table);
    console.log('Appended header to container');
}

// Admin subject management function (copied from old script.js)
async function getAllSubjects() {
  try {
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-all-subjects');
    const data = await response.json();
    
    if (data.success) {
      const container = document.getElementById('allSubjectsContainer');
      displaySubjectsTable(data.subjects, container);
    } else {
      console.error('Failed to get subjects:', data.message);
      // Fallback to sample data for testing
      showSampleSubjects();
    }
  } catch (error) {
    console.error('Error fetching subjects:', error);
    // Fallback to sample data for testing
    showSampleSubjects();
  }
}
