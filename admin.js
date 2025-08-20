document.addEventListener('DOMContentLoaded', () => {
  const adminLoginSection = document.getElementById('admin-login-section');
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

    // Semester tabs
    document.querySelectorAll('.semester-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const semester = tab.dataset.semester;
        switchSemester(semester);
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

  let currentSemester = 1;

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

  function switchSemester(semester) {
    currentSemester = parseInt(semester);
    
    // Update semester tab active state
    document.querySelectorAll('.semester-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-semester="${semester}"]`).classList.add('active');
    
    // Refresh current table with new semester data
    const currentGrade = document.querySelector('.grade-tab.active')?.dataset.grade;
    if (currentGrade) {
      loadGradeData(currentGrade);
    }
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
    
    // Terms (based on selected semester)
    const thTerms = document.createElement('th');
    thTerms.textContent = 'Terms';
    thTerms.colSpan = currentSemester === 1 ? 6 : 7;
    thTerms.className = 'semester-header';
    headerRow1.appendChild(thTerms);
    
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
    
    // Term 1 Total (first 3 tests)
    const thTerm1Total = document.createElement('th');
    thTerm1Total.textContent = 'Total (30)';
    thTerm1Total.className = 'summary-header';
    headerRow2.appendChild(thTerm1Total);
    
    // Term 1 Test 4
    const thTerm1Test4 = document.createElement('th');
    thTerm1Test4.textContent = 'Test 4 (10)';
    thTerm1Test4.className = 'summary-header';
    headerRow2.appendChild(thTerm1Test4);
    
    // Term 2 tests (1, 2, 3, 4, 5)
    for (let i = 1; i <= 5; i++) {
      const th = document.createElement('th');
      th.textContent = i.toString();
      headerRow2.appendChild(th);
    }
    
    // Term 2 Total (first 3 tests)
    const thTerm2Total = document.createElement('th');
    thTerm2Total.textContent = 'Total (30)';
    thTerm2Total.className = 'summary-header';
    headerRow2.appendChild(thTerm2Total);
    
    // Term 2 Test 4
    const thTerm2Test4 = document.createElement('th');
    thTerm2Test4.textContent = 'Test 4 (10)';
    thTerm2Test4.className = 'summary-header';
    headerRow2.appendChild(thTerm2Test4);
    
    // Term 2 Test 5
    const thTerm2Test5 = document.createElement('th');
    thTerm2Test5.textContent = 'Test 5 (20)';
    thTerm2Test5.className = 'summary-header';
    headerRow2.appendChild(thTerm2Test5);
    
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
      let term1First3Total = 0;
      for (let testNum = 1; testNum <= 4; testNum++) {
        const td = document.createElement('td');
        td.className = 'test-score editable-score';
        
        // Find test result for this test number in Term 1
        const result = testResults.find(tr => 
          tr.user_id === student.id && 
          tr.test_id === getTestId(grade, 1, testNum)
        );
        
        if (result) {
          td.textContent = result.score;
          term1Total += result.score;
          if (testNum <= 3) {
            term1First3Total += result.score;
          }
          td.style.color = result.score >= 8 ? 'green' : result.score >= 6 ? 'orange' : 'red';
          td.dataset.testResultId = result.id;
          td.dataset.userId = student.id;
          td.dataset.testId = getTestId(grade, 1, testNum);
          td.dataset.maxScore = 10;
        } else {
          td.textContent = '-';
          td.style.color = '#999';
          td.dataset.userId = student.id;
          td.dataset.testId = getTestId(grade, 1, testNum);
          td.dataset.maxScore = 10;
        }
        
        // Make score editable
        td.addEventListener('click', makeScoreEditable);
        
        row.appendChild(td);
      }
      
      // Term 1 Total (first 3 tests)
      const tdTerm1Total = document.createElement('td');
      tdTerm1Total.className = 'summary-score';
      tdTerm1Total.textContent = term1First3Total;
      tdTerm1Total.style.color = term1First3Total >= 24 ? 'green' : term1First3Total >= 18 ? 'orange' : 'red';
      tdTerm1Total.style.fontWeight = 'bold';
      row.appendChild(tdTerm1Total);
      
      // Term 1 Test 4 (separate column)
      const tdTerm1Test4 = document.createElement('td');
      tdTerm1Test4.className = 'test-score editable-score';
      
      const term1Test4Result = testResults.find(tr => 
        tr.user_id === student.id && 
        tr.test_id === getTestId(grade, 1, 4)
      );
      
      if (term1Test4Result) {
        tdTerm1Test4.textContent = term1Test4Result.score;
        tdTerm1Test4.style.color = term1Test4Result.score >= 8 ? 'green' : term1Test4Result.score >= 6 ? 'orange' : 'red';
        tdTerm1Test4.dataset.testResultId = term1Test4Result.id;
        tdTerm1Test4.dataset.userId = student.id;
        tdTerm1Test4.dataset.testId = getTestId(grade, 1, 4);
        tdTerm1Test4.dataset.maxScore = 10;
        tdTerm1Test4.addEventListener('click', makeScoreEditable);
      } else {
        tdTerm1Test4.textContent = '-';
        tdTerm1Test4.style.color = '#999';
        tdTerm1Test4.dataset.userId = student.id;
        tdTerm1Test4.dataset.testId = getTestId(grade, 1, 4);
        tdTerm1Test4.dataset.maxScore = 10;
        tdTerm1Test4.addEventListener('click', makeScoreEditable);
      }
      
      row.appendChild(tdTerm1Test4);
      
      // Term 2 tests (5 tests: 4 tests × 10 points + 1 test × 20 points)
      let term2Total = 0;
      let term2First3Total = 0;
      for (let testNum = 1; testNum <= 5; testNum++) {
        const td = document.createElement('td');
        td.className = 'test-score editable-score';
        
        // Find test result for this test number in Term 2
        const result = testResults.find(tr => 
          tr.user_id === student.id && 
          tr.test_id === getTestId(grade, 2, testNum)
        );
        
        const maxScore = testNum === 5 ? 20 : 10;
        
        if (result) {
          td.textContent = result.score;
          term2Total += result.score;
          if (testNum <= 3) {
            term2First3Total += result.score;
          }
          // Color coding based on test type (10 or 20 points)
          const percentage = (result.score / maxScore) * 100;
          td.style.color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
          td.dataset.testResultId = result.id;
          td.dataset.userId = student.id;
          td.dataset.testId = getTestId(grade, 2, testNum);
          td.dataset.maxScore = maxScore;
        } else {
          td.textContent = '-';
          td.style.color = '#999';
          td.dataset.userId = student.id;
          td.dataset.testId = getTestId(grade, 2, testNum);
          td.dataset.maxScore = maxScore;
        }
        
        // Make score editable
        td.addEventListener('click', makeScoreEditable);
        
        row.appendChild(td);
      }
      
      // Term 2 Total (first 3 tests)
      const tdTerm2Total = document.createElement('td');
      tdTerm2Total.className = 'summary-score';
      tdTerm2Total.textContent = term2First3Total;
      tdTerm2Total.style.color = term2First3Total >= 24 ? 'green' : term2First3Total >= 18 ? 'orange' : 'red';
      tdTerm2Total.style.fontWeight = 'bold';
      row.appendChild(tdTerm2Total);
      
      // Term 2 Test 4 (separate column)
      const tdTerm2Test4 = document.createElement('td');
      tdTerm2Test4.className = 'test-score editable-score';
      
      const term2Test4Result = testResults.find(tr => 
        tr.user_id === student.id && 
        tr.test_id === getTestId(grade, 2, 4)
      );
      
      if (term2Test4Result) {
        tdTerm2Test4.textContent = term2Test4Result.score;
        tdTerm2Test4.style.color = term2Test4Result.score >= 8 ? 'green' : term2Test4Result.score >= 6 ? 'orange' : 'red';
        tdTerm2Test4.dataset.testResultId = term2Test4Result.id;
        tdTerm2Test4.dataset.userId = student.id;
        tdTerm2Test4.dataset.testId = getTestId(grade, 2, 4);
        tdTerm2Test4.dataset.maxScore = 10;
        tdTerm2Test4.addEventListener('click', makeScoreEditable);
      } else {
        tdTerm2Test4.textContent = '-';
        tdTerm2Test4.style.color = '#999';
        tdTerm2Test4.dataset.userId = student.id;
        tdTerm2Test4.dataset.testId = getTestId(grade, 2, 4);
        tdTerm2Test4.dataset.maxScore = 10;
        tdTerm2Test4.addEventListener('click', makeScoreEditable);
      }
      
      row.appendChild(tdTerm2Test4);
      
      // Term 2 Test 5 (separate column)
      const tdTerm2Test5 = document.createElement('td');
      tdTerm2Test5.className = 'test-score editable-score';
      
      const term2Test5Result = testResults.find(tr => 
        tr.user_id === student.id && 
        tr.test_id === getTestId(grade, 2, 5)
      );
      
      if (term2Test5Result) {
        tdTerm2Test5.textContent = term2Test5Result.score;
        const percentage = (term2Test5Result.score / 20) * 100;
        tdTerm2Test5.style.color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
        tdTerm2Test5.dataset.testResultId = term2Test5Result.id;
        tdTerm2Test5.dataset.userId = student.id;
        tdTerm2Test5.dataset.testId = getTestId(grade, 2, 5);
        tdTerm2Test5.dataset.maxScore = 20;
        tdTerm2Test5.addEventListener('click', makeScoreEditable);
      } else {
        tdTerm2Test5.textContent = '-';
        tdTerm2Test5.style.color = '#999';
        tdTerm2Test5.dataset.userId = student.id;
        tdTerm2Test5.dataset.testId = getTestId(grade, 2, 5);
        tdTerm2Test5.dataset.maxScore = 20;
        tdTerm2Test5.addEventListener('click', makeScoreEditable);
      }
      
      row.appendChild(tdTerm2Test5);
      
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
    // Based on the database schema:
    // Grade 1: 1-9, Grade 2: 11-19, Grade 3: 21-29, Grade 4: 31-39, Grade 5: 41-49, Grade 6: 51-59
    if (grade === 1) {
      return (term - 1) * 5 + testNum;
    } else if (grade === 2) {
      return 10 + (term - 1) * 5 + testNum;
    } else if (grade === 3) {
      return 20 + (term - 1) * 5 + testNum;
    } else if (grade === 4) {
      return 30 + (term - 1) * 5 + testNum;
    } else if (grade === 5) {
      return 40 + (term - 1) * 5 + testNum;
    } else if (grade === 6) {
      return 50 + (term - 1) * 5 + testNum;
    }
    return 0;
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
        // data.visibility is already an object, no need for reduce
        testVisibility = data.visibility;
        
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

  // Check if admin is already logged in from main page
  function checkAdminLogin() {
    const adminToken = localStorage.getItem('adminToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (adminToken && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user.username === 'admin' || user.isAdmin) {
          token = adminToken;
          adminLoginSection.style.display = 'none';
          dashboardSection.style.display = 'block';
          fetchDashboard();
          return;
        }
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
    
    // If not logged in, show the info message
    adminLoginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
  }

  if (saveTestVisibilityBtn) {
    saveTestVisibilityBtn.addEventListener('click', saveTestVisibility);
  }

  // Setup tabs
  setupTabs();

  // Check if admin is already logged in
  checkAdminLogin();

  // Score editing functionality
  function makeScoreEditable(event) {
    const td = event.target;
    const currentScore = td.textContent;
    const maxScore = parseInt(td.dataset.maxScore);
    
    if (currentScore === '-') {
      // Create new test result
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = maxScore;
      input.value = '';
      input.className = 'score-input';
      
      input.addEventListener('blur', () => saveScore(td, input.value, maxScore));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
      
      td.textContent = '';
      td.appendChild(input);
      input.focus();
    } else {
      // Edit existing score
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = maxScore;
      input.value = currentScore;
      input.className = 'score-input';
      
      input.addEventListener('blur', () => saveScore(td, input.value, maxScore));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
      
      td.textContent = '';
      td.appendChild(input);
      input.focus();
    }
  }

  async function saveScore(td, newScore, maxScore) {
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0 || score > maxScore) {
      // Restore original value
      const originalScore = td.dataset.testResultId ? td.textContent : '-';
      td.textContent = originalScore;
      return;
    }

    const userId = td.dataset.userId;
    const testId = td.dataset.testId;
    const testResultId = td.dataset.testResultId;
    
    try {
      let response;
      if (testResultId) {
        // Update existing test result
        response = await fetch('/.netlify/functions/updateTestResult', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            testResultId,
            score,
            maxScore
          })
        });
      } else {
        // Create new test result
        response = await fetch('/.netlify/functions/createTestResult', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            testId,
            score,
            maxScore
          })
        });
      }

      const result = await response.json();
      if (response.ok && result.success) {
        // Update the cell
        td.textContent = score;
        
        // Update color coding
        if (maxScore === 10) {
          td.style.color = score >= 8 ? 'green' : score >= 6 ? 'orange' : 'red';
        } else {
          const percentage = (score / maxScore) * 100;
          td.style.color = percentage >= 80 ? 'green' : percentage >= 60 ? 'orange' : 'red';
        }
        
        // Update dataset if new result was created
        if (result.testResultId) {
          td.dataset.testResultId = result.testResultId;
        }
        
        // Refresh the table to update totals
        await refreshCurrentTable();
      } else {
        alert('Failed to save score: ' + (result.error || 'Unknown error'));
        // Restore original value
        const originalScore = td.dataset.testResultId ? td.textContent : '-';
        td.textContent = originalScore;
      }
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Error saving score. Please try again.');
      // Restore original value
      const originalScore = td.dataset.testResultId ? td.textContent : '-';
      td.textContent = originalScore;
    }
  }

  async function refreshCurrentTable() {
    // Refresh the current grade/class table
    const currentGrade = document.querySelector('.grade-tab.active')?.dataset.grade;
    const currentClass = document.querySelector('.class-tab.active')?.dataset.class;
    
    if (currentGrade && currentClass) {
      await loadGradeData(parseInt(currentGrade), currentClass);
    }
  }
});


