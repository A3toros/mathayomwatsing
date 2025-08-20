document.addEventListener('DOMContentLoaded', () => {
  const adminLoginSection = document.getElementById('admin-login-section');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginStatus = document.getElementById('admin-login-status');
  const dashboardSection = document.getElementById('admin-dashboard');
  const saveTestVisibilityBtn = document.getElementById('save-test-visibility');

  let token = localStorage.getItem('adminToken') || '';
  let testVisibility = {};
  let allStudents = [];
  let allTestResults = [];

  // Tab management
  function setupTabs() {
    // Grade tabs
    document.querySelectorAll('.grade-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const grade = tab.dataset.grade;
        switchGrade(grade);
      });
    });

    // Class tabs
    document.querySelectorAll('.class-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const grade = tab.closest('.grade-content').id.replace('grade-', '').replace('-content', '');
        const className = tab.dataset.class;
        switchClass(grade, className);
      });
    });
  }

  function switchGrade(grade) {
    // Hide all grade content
    document.querySelectorAll('.grade-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Show selected grade content
    document.getElementById(`grade-${grade}-content`).classList.add('active');
    
    // Update grade tab active state
    document.querySelectorAll('.grade-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-grade="${grade}"]`).classList.add('active');
    
    // Load data for this grade
    loadGradeData(grade);
  }

  function switchClass(grade, className) {
    // Update class tab active state
    const gradeContent = document.getElementById(`grade-${grade}-content`);
    gradeContent.querySelectorAll('.class-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    gradeContent.querySelector(`[data-class="${className}"]`).classList.add('active');
    
    // Display students for this class
    displayClassStudents(grade, className);
  }

  function setStatus(el, msg, type='') {
    if (!el) return;
    el.textContent = msg;
    el.className = `status ${type}`.trim();
  }

  async function loadGradeData(grade) {
    try {
      // Load students for this grade
      const students = allStudents.filter(s => s.grade_level == grade);
      
      // Load test results for this grade
      const testResults = allTestResults.filter(tr => tr.grade_level == grade);
      
      // Display data for each class in this grade
      if (grade <= 3) {
        // Grades 1-3 have two classes each
        displayClassStudents(grade, '1/15');
        displayClassStudents(grade, '1/16');
      } else if (grade <= 5) {
        // Grades 4-5 have one class each
        const className = grade === 4 ? '4/14' : '5/14';
        displayClassStudents(grade, className);
      } else {
        // Grade 6 has one class
        displayClassStudents(grade, '6/14');
      }
    } catch (e) {
      console.error('Error loading grade data:', e);
    }
  }

  function displayClassStudents(grade, className) {
    const containerId = `grade-${grade}-table-container`;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Filter students by grade and class
    const classStudents = allStudents.filter(s => 
      s.grade_level == grade && s.class_name === className
    );
    
    if (classStudents.length === 0) {
      container.innerHTML = '<div class="no-data">No students found in this class.</div>';
      return;
    }
    
    // Get test results for this class
    const classTestResults = allTestResults.filter(tr => 
      tr.grade_level == grade && 
      classStudents.some(s => s.id === tr.user_id)
    );
    
    // Create table
    const table = createStudentsTable(classStudents, classTestResults, grade);
    container.innerHTML = '';
    container.appendChild(table);
  }

  function createStudentsTable(students, testResults, grade) {
    const table = document.createElement('table');
    table.className = 'students-table';
    
    // Create header with Term 1, Term 2, and Total structure
    const thead = document.createElement('thead');
    
    // Header Row 1: Term 1 (4 tests), Term 2 (5 tests), Total
    const headerRow1 = document.createElement('tr');
    
    // No. column
    const thNo = document.createElement('th');
    thNo.textContent = 'No.';
    thNo.rowSpan = 2;
    headerRow1.appendChild(thNo);
    
    // Student ID column
    const thStudent = document.createElement('th');
    thStudent.textContent = 'Student';
    thStudent.rowSpan = 2;
    headerRow1.appendChild(thStudent);
    
    // Nickname column
    const thNickname = document.createElement('th');
    thNickname.textContent = 'Nickname';
    thNickname.rowSpan = 2;
    headerRow1.appendChild(thNickname);
    
    // Term 1 (4 tests)
    const thTerm1 = document.createElement('th');
    thTerm1.textContent = 'Term 1';
    thTerm1.colSpan = 4;
    thTerm1.className = 'term-header';
    headerRow1.appendChild(thTerm1);
    
    // Term 2 (5 tests)
    const thTerm2 = document.createElement('th');
    thTerm2.textContent = 'Term 2';
    thTerm2.colSpan = 5;
    thTerm2.className = 'term-header';
    headerRow1.appendChild(thTerm2);
    
    // Total column
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Total';
    thTotal.rowSpan = 2;
    thTotal.className = 'total-header';
    headerRow1.appendChild(thTotal);
    
    thead.appendChild(headerRow1);
    
    // Header Row 2: Individual test numbers
    const headerRow2 = document.createElement('tr');
    
    // Term 1 tests (1, 2, 3, 4)
    for (let i = 1; i <= 4; i++) {
      const th = document.createElement('th');
      th.textContent = i.toString();
      headerRow2.appendChild(th);
    }
    
    // Term 2 tests (1, 2, 3, 4, 5)
    for (let i = 1; i <= 5; i++) {
      const th = document.createElement('th');
      th.textContent = i.toString();
      headerRow2.appendChild(th);
    }
    
    thead.appendChild(headerRow2);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    students.forEach((student, index) => {
      const row = document.createElement('tr');
      
      // No.
      const tdNo = document.createElement('td');
      tdNo.textContent = index + 1;
      row.appendChild(tdNo);
      
      // Student ID
      const tdStudent = document.createElement('td');
      tdStudent.textContent = student.student_id;
      row.appendChild(tdStudent);
      
      // Nickname
      const tdNickname = document.createElement('td');
      tdNickname.textContent = student.nickname;
      row.appendChild(tdNickname);
      
      // Term 1 tests (4 tests, 10 points each)
      let term1Total = 0;
      for (let testNum = 1; testNum <= 4; testNum++) {
        const td = document.createElement('td');
        td.className = 'test-score';
        
        // Find test result for this test number in Term 1
        const result = testResults.find(tr => 
          tr.user_id === student.id && 
          tr.test_id === getTestId(grade, 1, testNum)
        );
        
        if (result) {
          td.textContent = result.score;
          term1Total += result.score;
          td.style.color = result.score >= 8 ? 'green' : result.score >= 6 ? 'orange' : 'red';
        } else {
          td.textContent = '-';
          td.style.color = '#999';
        }
        
        row.appendChild(td);
      }
      
      // Term 2 tests (5 tests: 4 tests × 10 points + 1 test × 20 points)
      let term2Total = 0;
      for (let testNum = 1; testNum <= 5; testNum++) {
        const td = document.createElement('td');
        td.className = 'test-score';
        
        // Find test result for this test number in Term 2
        const result = testResults.find(tr => 
          tr.user_id === student.id && 
          tr.test_id === getTestId(grade, 2, testNum)
        );
        
        if (result) {
          td.textContent = result.score;
          term2Total += result.score;
          // Color coding based on test type (10 or 20 points)
          const maxScore = testNum === 5 ? 20 : 10;
          const percentage = (result.score / maxScore) * 100;
          td.style.color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
        } else {
          td.textContent = '-';
          td.style.color = '#999';
        }
        
        row.appendChild(td);
      }
      
      // Total score (out of 100)
      const tdTotal = document.createElement('td');
      tdTotal.className = 'test-score';
      const totalScore = term1Total + term2Total;
      tdTotal.textContent = totalScore;
      
      // Color coding for total score
      if (totalScore >= 80) {
        tdTotal.style.color = 'green';
        tdTotal.style.fontWeight = 'bold';
      } else if (totalScore >= 60) {
        tdTotal.style.color = 'orange';
        tdTotal.style.fontWeight = 'bold';
      } else {
        tdTotal.style.color = 'red';
        tdTotal.style.fontWeight = 'bold';
      }
      
      row.appendChild(tdTotal);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
  }

  function getTestId(grade, term, testNum) {
    // This function maps grade, term, and test number to actual test IDs
    // For now, we'll use a simple mapping system
    const baseId = (grade - 1) * 10 + (term - 1) * 5 + testNum;
    return baseId;
  }

  function getAvailableTests(grade) {
    // Updated to reflect the new term-based structure
    const testMap = {
      1: [
        // Term 1: 4 tests × 10 points each
        { id: 1, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 2, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 3, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 4, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 5, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 6, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 7, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 8, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 9, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ],
      2: [
        // Term 1: 4 tests × 10 points each
        { id: 11, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 12, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 13, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 14, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 15, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 16, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 17, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 18, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 19, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ],
      3: [
        // Term 1: 4 tests × 10 points each
        { id: 21, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 22, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 23, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 24, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 25, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 26, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 27, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 28, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 29, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ],
      4: [
        // Term 1: 4 tests × 10 points each
        { id: 31, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 32, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 33, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 34, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 35, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 36, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 37, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 38, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 39, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ],
      5: [
        // Term 1: 4 tests × 10 points each
        { id: 41, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 42, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 43, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 44, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 45, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 46, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 47, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 48, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 49, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ],
      6: [
        // Term 1: 4 tests × 10 points each
        { id: 51, name: 'Term 1 Test 1', max_score: 10, term: 1 },
        { id: 52, name: 'Term 1 Test 2', max_score: 10, term: 1 },
        { id: 53, name: 'Term 1 Test 3', max_score: 10, term: 1 },
        { id: 54, name: 'Term 1 Test 4', max_score: 10, term: 1 },
        // Term 2: 4 tests × 10 points + 1 test × 20 points
        { id: 55, name: 'Term 2 Test 1', max_score: 10, term: 2 },
        { id: 56, name: 'Term 2 Test 2', max_score: 10, term: 2 },
        { id: 57, name: 'Term 2 Test 3', max_score: 10, term: 2 },
        { id: 58, name: 'Term 2 Test 4', max_score: 10, term: 2 },
        { id: 59, name: 'Term 2 Test 5', max_score: 20, term: 2 }
      ]
    };
    
    return testMap[grade] || [];
  }

  async function fetchDashboard() {
    setStatus(adminLoginStatus, '');
    try {
      // Fetch all students
      const studentsRes = await fetch('/.netlify/functions/getAllStudents', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        allStudents = studentsData.students || [];
      }
      
      // Fetch all test results
      const resultsRes = await fetch('/.netlify/functions/getAllTestResults', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        allTestResults = resultsData.results || [];
      }
      
      // Load test visibility settings
      await loadTestVisibility();
      
      // Load initial grade data
      loadGradeData(1);
      
    } catch (e) {
      setStatus(adminLoginStatus, e.message || 'Failed to load dashboard', 'error');
    }
  }

  async function loadTestVisibility() {
    try {
      const res = await fetch('/.netlify/functions/getTestVisibility');
      const data = await res.json();
      if (res.ok && data.success) {
        testVisibility = data.visibility.reduce((acc, item) => {
          acc[item.test_id] = item.is_visible;
          return acc;
        }, {});
        
        // Update checkboxes based on loaded visibility
        document.querySelectorAll('.test-toggle input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = testVisibility[checkbox.id] || false;
        });
      } else {
        setStatus(document.getElementById('test-visibility-status'), data.error || 'Failed to load test visibility', 'error');
      }
    } catch (e) {
      setStatus(document.getElementById('test-visibility-status'), 'Error loading test visibility: ' + e.message, 'error');
    }
  }

  async function saveTestVisibility() {
    const updates = {};
    document.querySelectorAll('.test-toggle input[type="checkbox"]').forEach(checkbox => {
      updates[checkbox.id] = checkbox.checked;
    });

    try {
      const res = await fetch('/.netlify/functions/updateTestVisibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(document.getElementById('test-visibility-status'), 'Test visibility saved successfully!', 'success');
        await loadTestVisibility();
      } else {
        setStatus(document.getElementById('test-visibility-status'), data.error || 'Failed to save test visibility', 'error');
      }
    } catch (e) {
      setStatus(document.getElementById('test-visibility-status'), 'Error saving test visibility: ' + e.message, 'error');
    }
  }

  // Event listeners
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(adminLoginStatus, 'Logging in...');
    
    try {
      const username = (document.getElementById('admin-username').value || '').trim();
      const password = (document.getElementById('admin-password').value || '').trim();
      
      const res = await fetch('/.netlify/functions/adminLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');
      
      token = data.token;
      localStorage.setItem('adminToken', token);
      adminLoginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      
      await fetchDashboard();
      
    } catch (e) {
      setStatus(adminLoginStatus, e.message || 'Login failed', 'error');
    }
  });

  if (saveTestVisibilityBtn) {
    saveTestVisibilityBtn.addEventListener('click', saveTestVisibility);
  }

  // Setup tabs
  setupTabs();

  // Check if already logged in
  if (token) {
    adminLoginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    fetchDashboard();
  }
});


