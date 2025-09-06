// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  getCurrentAdminId,
  sendRequest
} from '../shared/index.js'

// EXPORTS - User and teacher management functions
export {
  getAllUsers,
  displayAllUsers,
  displayUsersTable,
  toggleUsersContent,
  showAddUserForm,
  hideAddUserForm,
  editUserRow,
  loadAllTeachers,
  displayAllTeachers,
  displayTeachersTable,
  toggleTeachersContent,
  showAddTeacherForm,
  hideAddTeacherForm,
  editTeacher,
  editTeacherRow
}

// Admin - User & Teacher Management
// Functions: getAllUsers, displayAllUsers, displayUsersTable, toggleUsersContent, showAddUserForm, 
// hideAddUserForm, editUserRow, loadAllTeachers, displayAllTeachers,  displayTeachersTable, toggleTeachersContent, 
// showAddTeacherForm, hideAddTeacherForm, editTeacher, editTeacherRow

// TODO: Copy functions from script.js
// Enhanced User Management Functions
async function getAllUsers() {
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-all-users');
      const data = await response.json();
      
      if (data.success) {
        const container = document.getElementById('allUsersContainer');
        displayUsersTable(data.users, container);
      } else {
        console.error('Failed to get users:', data.message);
        // Fallback to sample data for testing
        showSampleUsers();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to sample data for testing
      showSampleUsers();
    }
  }

  async function displayAllUsers(users) {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in displayAllUsers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    const container = document.getElementById('allUsersContainer');
    if (!container) return;
    
    container.innerHTML = `
        <h3>All Users (Students)</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Number</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Nickname</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.grade}</td>
                        <td>${user.class}</td>
                        <td>${user.number}</td>
                        <td>${user.student_id}</td>
                        <td>${user.name}</td>
                        <td>${user.surname}</td>
                        <td>${user.nickname}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function displayUsersTable(users, container) {
    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Grade</th>
                <th>Class</th>
                <th>Number</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.grade}</td>
            <td>${user.class}</td>
            <td>${user.number}</td>
            <td>${user.student_id}</td>
            <td>${user.name}</td>
            <td>${user.surname}</td>
            <td>${user.nickname}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

function toggleUsersContent() {
    const container = document.getElementById('allUsersContainer');
    const button = document.querySelector('button[onclick="toggleUsersContent()"]');
    
    if (!container) {
      console.error('❌ allUsersContainer not found');
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
      getAllUsers();
      button.textContent = 'Hide Users ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get All Users ▶';
      button.classList.remove('active');
    }
  }

  // Show/Hide Form Functions
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
  }

  function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('newUserForm').reset();
  }
  
  function showAddTeacherForm() {
    document.getElementById('addTeacherForm').style.display = 'block';
  }
  
  function hideAddTeacherForm() {
    document.getElementById('addTeacherForm').style.display = 'none';
    document.getElementById('newTeacherForm').reset();
  }

  // Editable Table Functions
function editUserRow(userId) {
    // This function is called when the Edit button is clicked
    // It will make the entire row editable
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
      // Find all editable fields in this row
      const editableFields = row.querySelectorAll('.editable-field');
      editableFields.forEach(field => {
        makeFieldEditable(field);
      });
    }
  }

  async function loadAllTeachers() {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in loadAllTeachers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('Admin ID found:', adminId);
    console.log('Token manager available:', !!window.tokenManager);
    console.log('Token manager authenticated:', window.tokenManager?.isAuthenticated());
    
    try {
        console.log('Making authenticated request to get-all-teachers...');
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-all-teachers'
        );
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Teachers data received:', data);
        console.log('Teachers array:', data.teachers);
        console.log('Number of teachers:', data.teachers?.length || 0);
        
        if (data.success) {
            displayAllTeachers(data.teachers);
            // Show the container when data is loaded
            const container = document.getElementById('allTeachersContainer');
            if (container) {
                container.style.display = 'block';
                console.log('Container shown after loading teachers');
            }
        } else {
            console.error('Failed to load teachers:', data.error);
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

async function displayAllTeachers(teachers) {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
        console.error('No valid admin session found in displayAllTeachers, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('displayAllTeachers called with teachers:', teachers);
    console.log('Number of teachers to display:', teachers.length);
    
    const container = document.getElementById('allTeachersContainer');
    console.log('Container found:', !!container);
    console.log('Container element:', container);
    if (!container) {
        console.error('allTeachersContainer not found!');
        return;
    }
    
    const html = `
        <h3>All Teachers</h3>
        <table>
            <thead>
                <tr>
                    <th>Teacher ID</th>
                    <th>Username</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${teachers.map(teacher => `
                    <tr>
                        <td>${teacher.teacher_id}</td>
                        <td>${teacher.username}</td>
                        <td>
                            <button onclick="editTeacher('${teacher.teacher_id}')">Edit</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    console.log('Setting container HTML:', html);
    container.innerHTML = html;
    console.log('Container HTML set successfully');
}

// Display teachers table
function displayTeachersTable(teachers, container) {
    if (teachers.length === 0) {
        container.innerHTML = '<p>No teachers found.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Teacher ID</th>
                <th>Username</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teacher.teacher_id}</td>
            <td>${teacher.username}</td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

function toggleTeachersContent() {
    const container = document.getElementById('allTeachersContainer');
    const button = document.querySelector('button[onclick="toggleTeachersContent()"]');
    
    if (!container) {
      console.error('❌ allTeachersContainer not found');
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
      loadAllTeachers();
      button.textContent = 'Hide Teachers ▼';
      button.classList.add('active');
    } else {
      // Hide content
      container.style.display = 'none';
      button.textContent = 'Get All Teachers ▶';
      button.classList.remove('active');
    }
  }

  // Edit teacher function
function editTeacher(teacherId) {
    // Check if user session is still valid using JWT
    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId) {
        console.error('No valid admin session found in editTeacher, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Placeholder for editing teacher
    console.log('Edit teacher:', teacherId);
    alert('Edit teacher functionality - to be implemented');
}

function editTeacherRow(teacherId) {
    // This function is called when the Edit button is clicked for teachers
    const row = document.querySelector(`tr[data-teacher-id="${teacherId}"]`);
    if (row) {
      const editableFields = row.querySelectorAll('.editable-field');
      editableFields.forEach(field => {
        makeFieldEditable(field);
      });
    }
  }