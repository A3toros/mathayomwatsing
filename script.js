document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null;
  let isSubmitting = false;

  // ======== Login form handling ========
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('login-status');
  const loginSection = document.getElementById('login-section');
  const welcomeSection = document.getElementById('welcome-section');
  const questionnaireSection = document.getElementById('questionnaire-section');
  
  // Check if user is already logged in on page load
  function checkExistingSession() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userNickname = localStorage.getItem('userNickname');
    
    if (token && userId && userNickname) {
      // Verify the token contains the correct user ID
      try {
        const decodedToken = atob(token);
        const [tokenUserId] = decodedToken.split(':');
        
        // Only restore session if token user ID matches stored user ID
        if (tokenUserId === userId) {
          // Restore user session
          currentUser = {
            id: userId,
            nickname: userNickname,
            submitted: localStorage.getItem('userSubmitted') === 'true',
            score: localStorage.getItem('userScore') ? parseInt(localStorage.getItem('userScore')) : null,
            answers: localStorage.getItem('userAnswers') ? JSON.parse(localStorage.getItem('userAnswers')) : null
          };
          
          // Show appropriate section
          if (currentUser.submitted) {
            loginSection.style.display = 'none';
            welcomeSection.style.display = 'block';
            showCompletion(currentUser.score, false);
          } else {
            loginSection.style.display = 'none';
            welcomeSection.style.display = 'block';
            restoreFormData();
          }
          
          // Show user dropdown
          addUserDropdown();
        } else {
          // Token mismatch, clear invalid session data
          console.log("Token mismatch, clearing invalid session");
          logout();
        }
      } catch (error) {
        console.error("Error decoding token, clearing session:", error);
        logout();
      }
    }
  }

  // Restore form data from localStorage
  function restoreFormData() {
    const savedAnswers = localStorage.getItem('formAnswers');
    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers);
        Object.keys(answers).forEach(questionId => {
          const field = document.getElementById(questionId);
          if (field) {
            field.value = answers[questionId];
          }
        });
      } catch (e) {
        console.error('Error restoring form data:', e);
      }
    }
  }

  // Save form data to localStorage
  function saveFormData() {
    const answers = {};
    for (let i = 1; i <= 10; i++) {
      const field = document.getElementById(`question${i}`);
      if (field) {
        answers[`question${i}`] = field.value;
      }
    }
    localStorage.setItem('formAnswers', JSON.stringify(answers));
  }

  // Add input event listeners to save form data as user types
  function setupFormDataPersistence() {
    for (let i = 1; i <= 10; i++) {
      const field = document.getElementById(`question${i}`);
      if (field) {
        field.addEventListener('input', saveFormData);
      }
    }
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Clear any existing error messages
    loginStatus.textContent = '';
    loginStatus.className = 'status';

    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      console.log("Login result:", result); // Debug

      if (!result.success) {
        loginStatus.textContent = result.error || "Invalid username or password";
        loginStatus.className = "status error";
        return;
      }

      // Check if user is admin and redirect accordingly
      if (result.user && (result.user.username === 'admin' || result.user.isAdmin)) {
        // Admin login - redirect to admin panel
        localStorage.setItem('adminToken', result.token || 'admin-token');
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        
        loginStatus.textContent = 'Admin login successful! Redirecting to admin panel...';
        loginStatus.className = 'status success';
        
        setTimeout(() => {
          window.location.href = '/admin.html';
        }, 1000);
        return;
      }

      // Regular user login
      // Clear any existing session data before setting new user data
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userNickname');
      localStorage.removeItem('userSubmitted');
      localStorage.removeItem('userScore');
      localStorage.removeItem('userAnswers');
      localStorage.removeItem('formAnswers');

      currentUser = result.user;
      
      // Store user data in localStorage
      localStorage.setItem('userId', currentUser.id);
      localStorage.setItem('userNickname', currentUser.nickname);
      localStorage.setItem('userSubmitted', currentUser.submitted);
      localStorage.setItem('userScore', currentUser.score);
      localStorage.setItem('userAnswers', JSON.stringify(currentUser.answers));
      
      // Generate and store a simple token (you might want to implement proper JWT tokens)
      const token = btoa(`${currentUser.id}:${Date.now()}`);
      localStorage.setItem('token', token);

      // Clear the login form
      loginForm.reset();

      // Hide login, show tests section
      loginSection.style.display = 'none';
      welcomeSection.style.display = 'block';

      // Show user dropdown
      addUserDropdown();

      if (currentUser.submitted === true) {
        await showCompletion(currentUser.score, false);
      } else {
        setupFormDataPersistence();
        restoreFormData();
      }
    } catch (err) {
      console.error(err);
      loginStatus.textContent = "Login failed. Try again.";
      loginStatus.className = "status error";
    }
    console.log("User after login:", currentUser);
    console.log("Type of submitted:", currentUser.submitted, typeof currentUser.submitted);
  });

  // ======== Questionnaire logic ========
  const questionnaireForm = document.getElementById('questionnaire-form');
  const questionnaireStatus = document.getElementById('questionnaire-status');

  const correctAnswers = {
    'question1': ['pitch', 'sales pitch'],
    'question2': ['launch', 'to launch'],
    'question3': ['server'],
    'question4': ['cover letter'],
    'question5': ['compensate', 'to compensate'],
    'question6': ['challenging'],
    'question7': ['appropriate'],
    'question8': ['criticism'],
    'question9': ['request', 'to request'],
    'question10': ['portfolio']
  };

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type || ''}`;
  }

  function disableForm(form, disable = true) {
    Array.from(form.elements).forEach(el => el.disabled = disable);
  }

  function isAnswerCorrect(questionId, userAnswer) {
    const possibleAnswers = correctAnswers[questionId] || [];
    const normalizedUserAnswer = (userAnswer || '').trim().toLowerCase();
    return possibleAnswers.some(ans => normalizedUserAnswer === ans.trim().toLowerCase());
  }

  function calculateScore(answers) {
    let score = 0;
    for (const q in answers) {
      if (isAnswerCorrect(q, answers[q])) score++;
    }
    return score;
  }

  function gatherAnswers() {
    const answers = {};
    const answersList = [];
    for (let i = 1; i <= 10; i++) {
      const field = document.getElementById(`question${i}`);
      const rawAnswer = field ? field.value.trim() : "";
      answers[`question${i}`] = rawAnswer;
      const dbAnswer = rawAnswer === "" ? "FAILED" : rawAnswer;
      answersList.push({ question: `Question ${i}`, answer: dbAnswer });
    }
    return { answers, answersList };
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildResultsSummaryHTML(answers) {
    let html = `<div id="results-summary"><h2>Results Breakdown</h2>`;
    Object.keys(correctAnswers).forEach((qKey, idx) => {
      const userAns = (answers[qKey] ?? "").toString();
      const correctList = correctAnswers[qKey] || [];
      const correctAll = correctList.join(' / ');
      const correct = isAnswerCorrect(qKey, userAns);
      const itemClass = correct ? 'correct' : 'incorrect';
      const displayUser = userAns === '' ? '(no answer)' : userAns;

      html += `
        <div class="answer-row">
          <span class="${itemClass}"><strong>${idx + 1}.</strong> ${escapeHTML(displayUser)}</span>
          ${correct ? '' : `<span class="correct-answer">→ ${escapeHTML(correctAll || '—')}</span>`}
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  function buildCompletionHTML(score, nickname, answers, showFailedNotice = false) {
    const scoreClass = score >= 7 ? 'high-score' : (score >= 4 ? 'medium-score' : 'low-score');
    const breakdown = buildResultsSummaryHTML(answers);
    return `
      <div class="status score-message ${scoreClass}">
        <div class="score-title">Quiz Results</div>
        <div class="score-value">${score} out of 10</div>
        <div class="score-name">${escapeHTML(nickname)}</div>
        ${showFailedNotice ? `<div class="score-failed-message">
          Sorry, you are not allowed to leave the page due to security reasons. Unfortunately you failed the test.
        </div>` : ``}
      </div>
      ${breakdown}
    `;
  }

  async function showCompletion(score, showFailedNotice = false) {
    const nickname = localStorage.getItem('userNickname') || 'User';
    const completionContainer = document.createElement('div');
    completionContainer.className = 'completion-container';

    const { answers } = gatherAnswers();
    completionContainer.innerHTML = buildCompletionHTML(score, nickname, answers, showFailedNotice);

    questionnaireForm.style.opacity = '0';
    setTimeout(() => {
      questionnaireForm.parentNode.replaceChild(completionContainer, questionnaireForm);
      completionContainer.style.opacity = '1';
    }, 300);
  }

  async function submitToServer(showFailedNotice = false) {
    if (isSubmitting) return;
    
    // Check if user has already submitted
    if (currentUser && currentUser.submitted) {
      console.log("User already submitted, skipping submission");
      return;
    }
    
    isSubmitting = true;
    disableForm(questionnaireForm, true);
    showStatus(questionnaireStatus, "Submitting...");

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error("User missing. Please restart.");

      const { answers, answersList } = gatherAnswers();
      const score = calculateScore(answers);

      const response = await fetch('/.netlify/functions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answers: answersList, score })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Submission failed");

      // Update user state to prevent multiple submissions
      if (currentUser) {
        currentUser.submitted = true;
        currentUser.score = score;
        currentUser.answers = answers;
        localStorage.setItem('userSubmitted', 'true');
        localStorage.setItem('userScore', score.toString());
        localStorage.setItem('userAnswers', JSON.stringify(answers));
      }

      await showCompletion(score, showFailedNotice);
    } catch (err) {
        console.error(err);
        showStatus(questionnaireStatus, err.message || "Submission failed", "error");
        disableForm(questionnaireForm, false);
        isSubmitting = false; // Reset the isSubmitting flag
      }
  }

  if (questionnaireForm) {
    questionnaireForm.addEventListener('submit', async e => {
      e.preventDefault();
      await submitToServer(false);
    });
  }

  // Add logout functionality
  window.logout = function() {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userSubmitted');
    localStorage.removeItem('userScore');
    localStorage.removeItem('userAnswers');
    localStorage.removeItem('formAnswers');
    
    // Reset state
    currentUser = null;
    isSubmitting = false;
    
    // Show login form, hide everything else
    loginSection.style.display = 'block';
    welcomeSection.style.display = 'none';
    questionnaireSection.style.display = 'none';
    
    // Hide personal menu
    const dropdownContainer = document.getElementById('user-dropdown');
    if (dropdownContainer) {
      dropdownContainer.style.display = 'none';
    }
    
    // Clear form
    if (questionnaireForm) {
      questionnaireForm.reset();
    }
    
    // Clear status messages
    if (loginStatus) loginStatus.textContent = '';
    if (questionnaireStatus) questionnaireStatus.textContent = '';
  };

  // Add user dropdown menu to tests section
  function addUserDropdown() {
    const dropdownContainer = document.getElementById('user-dropdown');
    if (dropdownContainer && currentUser) {
      dropdownContainer.style.display = 'block';
      
      // Update dropdown button text with user's nickname
      const dropdownBtn = document.getElementById('userDropdownBtn');
      if (dropdownBtn) {
        dropdownBtn.textContent = currentUser.nickname;
      }
    }
  }

  // Toggle dropdown menu
  window.toggleDropdown = function() {
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.classList.toggle('show');
    }
  };

  // Show personal cabinet
  async function showPersonalCabinet() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User not found. Please login again.');
        return;
      }

      // Fetch comprehensive personal cabinet data
      const response = await fetch('/.netlify/functions/getPersonalCabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      
      if (result.success) {
        displayPersonalCabinet(result.personal_cabinet);
      } else {
        alert('Failed to load personal cabinet: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading personal cabinet:', error);
      alert('Failed to load personal cabinet. Please try again.');
    }
  }

  // Display comprehensive personal cabinet
  async function displayPersonalCabinet(data) {
    const cabinetContainer = document.createElement('div');
    cabinetContainer.className = 'personal-cabinet';
    
    let html = `
      <div class="cabinet-header">
        <div class="user-info">
          <h2>Personal Cabinet - ${data.user.nickname}</h2>
          <p class="student-details">Student ID: ${data.user.student_id} | Grade: ${data.user.grade_level} | Class: ${data.user.class_name}</p>
        </div>
        <button class="close-cabinet-btn" onclick="closePersonalCabinet()">×</button>
      </div>
    `;

    // Grade-specific Tests Section (above scores) - Only show if tests are made visible
    const userGrade = data.user.grade_level;
    
    try {
      // Fetch test visibility settings
      const visibilityRes = await fetch('/.netlify/functions/getTestVisibility', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (visibilityRes.ok) {
        const visibilityData = await visibilityRes.json();
        const testVisibility = visibilityData.visibility || {};
        
        // Only show tests section if there are visible tests for this grade
        const visibleTests = [];
        
        if (userGrade === 1 && testVisibility['grade1-listening']) {
          visibleTests.push({
            id: 'grade1-listening',
            name: 'Listening Test M1',
            description: 'Listening comprehension test for 1st grade students',
            url: '/listening_test_m1.html'
          });
        } else if (userGrade === 2) {
          if (testVisibility['grade2-listening']) {
            visibleTests.push({
              id: 'grade2-listening',
              name: 'Listening Test M2',
              description: 'Listening comprehension test for 2nd grade students',
              url: '/listening_test_m2.html'
            });
          }
          if (testVisibility['grade2-vocabulary']) {
            visibleTests.push({
              id: 'grade2-vocabulary',
              name: 'Vocabulary Test M2',
              description: 'Vocabulary test for 2nd grade students',
              url: '/vocabulary_test_m2.html'
            });
          }
        } else if (userGrade === 3) {
          if (testVisibility['grade3-listening']) {
            visibleTests.push({
              id: 'grade3-listening',
              name: 'Listening Test M3',
              description: 'Listening comprehension test for 3rd grade students',
              url: '/listening_test_m3.html'
            });
          }
          if (testVisibility['grade3-vocabulary']) {
            visibleTests.push({
              id: 'grade3-vocabulary',
              name: 'Vocabulary Test M3',
              description: 'Vocabulary test for 3rd grade students',
              url: '/vocabulary_test_m3.html'
            });
          }
        } else if (userGrade === 4 && testVisibility['grade4-vocabulary']) {
          visibleTests.push({
            id: 'grade4-vocabulary',
            name: 'Vocabulary Test M4',
            description: 'Vocabulary test for 4th grade students',
            url: '/vocabulary_test_m4.html'
          });
        } else if (userGrade === 5 && testVisibility['grade5-vocabulary']) {
          visibleTests.push({
            id: 'grade5-vocabulary',
            name: 'Vocabulary Test M5',
            description: 'Vocabulary test for 5th grade students',
            url: '/vocabulary_test_m5.html'
          });
        } else if (userGrade === 6) {
          if (testVisibility['grade6-vocabulary']) {
            visibleTests.push({
              id: 'grade6-vocabulary',
              name: 'Vocabulary Test M6',
              description: 'Vocabulary test for 6th grade students',
              url: '/vocabulary_test_m6.html'
            });
          }
          if (testVisibility['grade6-grammar']) {
            visibleTests.push({
              id: 'grade6-grammar',
              name: 'Grammar Test',
              description: 'Basic grammar concepts',
              url: '/grammar-test'
            });
          }
          if (testVisibility['grade6-reading']) {
            visibleTests.push({
              id: 'grade6-reading',
              name: 'Reading Comprehension',
              description: 'Reading and understanding text',
              url: '/reading-comprehension'
            });
          }
          if (testVisibility['grade6-writing']) {
            visibleTests.push({
              id: 'grade6-writing',
              name: 'Writing Assignment',
              description: 'Essay writing test',
              url: '/writing-assignment'
            });
          }
          if (testVisibility['grade6-final']) {
            visibleTests.push({
              id: 'grade6-final',
              name: 'Final Exam',
              description: 'Comprehensive semester exam',
              url: '/final-exam'
            });
          }
        }
        
        // Only show tests section if there are visible tests
        if (visibleTests.length > 0) {
          html += `
            <div class="grade-tests-section">
              <h3>Available Tests for Grade ${userGrade}</h3>
              <div class="grade-tests-grid">
          `;
          
          visibleTests.forEach(test => {
            html += `
              <div class="test-card available">
                <h4>${test.name}</h4>
                <p>${test.description}</p>
                <a href="${test.url}" class="test-action-btn current">Take Test</a>
              </div>
            `;
          });
          
          html += `
              </div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading test visibility:', error);
    }

    // Current Test Section (prominently displayed)
    if (data.current_test) {
      html += `
        <div class="current-test-section">
          <h3>Current Test</h3>
          <div class="current-test-card">
            <div class="test-info">
              <h4>${data.current_test.name}</h4>
              <p>${data.current_test.description}</p>
              <div class="test-meta">
                <span class="semester-tag">${data.current_test.semester_name}</span>
                <span class="term-tag">${data.current_test.term_name}</span>
                <span class="duration-tag">${data.current_test.duration_minutes} min</span>
              </div>
            </div>
            <div class="test-action">
              <a href="${data.current_test.test_url}" class="take-test-btn">Take Test Now</a>
            </div>
          </div>
        </div>
      `;
    }

    // Semesters and Terms
    html += `<div class="semesters-container">`;
    
    data.semesters.forEach(semester => {
      html += `
        <div class="semester-section ${semester.is_active ? 'active' : ''}">
          <h3 class="semester-title">
            ${semester.name} (${semester.academic_year})
            ${semester.is_active ? '<span class="active-badge">Active</span>' : ''}
          </h3>
      `;

      semester.terms.forEach(term => {
        html += `
          <div class="term-section ${term.is_active ? 'active' : ''}">
            <h4 class="term-title">
              ${term.name}
              ${term.is_active ? '<span class="active-badge">Active</span>' : ''}
            </h4>
            <div class="tests-grid">
        `;

        term.tests.forEach(test => {
          const statusClass = test.status === 'completed' ? 'completed' : 
                             test.status === 'current' ? 'current' : 'upcoming';
          
          const scoreDisplay = test.completed ? 
            `<div class="test-score ${getScoreClass(test.score, test.max_score)}">${test.score}/${test.max_score}</div>` : '';
          
          const actionButton = test.status === 'current' && test.test_url ? 
            `<a href="${test.test_url}" class="test-action-btn current">Take Test</a>` :
            test.status === 'upcoming' && test.test_url ? 
            `<span class="test-action-btn upcoming">Coming Soon</span>` :
            test.status === 'completed' ? 
            `<span class="test-action-btn completed">Completed</span>` : 
            `<span class="test-action-btn offline">Offline Test</span>`;

          html += `
            <div class="test-card ${statusClass}">
              <div class="test-header">
                <h5>${test.name}</h5>
                <span class="test-type ${test.test_type}">${test.test_type}</span>
              </div>
              <p class="test-description">${test.description}</p>
              <div class="test-meta">
                <span class="max-score">Max: ${test.max_score}</span>
                ${test.duration_minutes ? `<span class="duration">${test.duration_minutes} min</span>` : ''}
                <span class="test-date">${formatDate(test.start_date)}</span>
              </div>
              ${scoreDisplay}
              <div class="test-actions">
                ${actionButton}
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `
        </div>
        <button class="back-to-test-btn" onclick="closePersonalCabinet()">Back to Test</button>
      </div>
    `;
    
    cabinetContainer.innerHTML = html;
    
    // Replace questionnaire with personal cabinet
    questionnaireSection.style.opacity = '0';
    setTimeout(() => {
      questionnaireSection.parentNode.replaceChild(cabinetContainer, questionnaireSection);
      cabinetContainer.style.opacity = '1';
    }, 300);
  }

  // Helper function to get score class for styling
  function getScoreClass(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'high-score';
    if (percentage >= 60) return 'medium-score';
    return 'low-score';
  }

  // Helper function to format dates
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Close personal cabinet
  window.closePersonalCabinet = function() {
    const cabinet = document.querySelector('.personal-cabinet');
    if (cabinet) {
      cabinet.style.opacity = '0';
      setTimeout(() => {
        cabinet.parentNode.replaceChild(welcomeSection, cabinet);
        welcomeSection.style.opacity = '1';
      }, 300);
    }
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.user-dropdown-container');
    if (dropdown && !dropdown.contains(event.target)) {
      const dropdownMenu = document.getElementById('user-dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.classList.remove('show');
      }
    }
  });

  // Dynamic styles
  function initStyles() {
    if (!document.getElementById('dynamic-styles')) {
      const style = document.createElement('style');
      style.id = 'dynamic-styles';
      style.textContent = `
        /* same styles you already had */
      `;
      document.head.appendChild(style);
    }
  }

  initStyles();
  checkExistingSession(); // Call checkExistingSession on page load
  // addUserDropdown(); // Only call after successful login

  // ======== Generic Test Pages (no timer, JS centralized here) ========
  function handleVocabularyPage() {
    const vocabForm = document.getElementById('vocabularyTestForm') || document.getElementById('vocabularyForm');
    if (!vocabForm) return;

    vocabForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const answers = {};
      for (let i = 1; i <= 10; i++) {
        const input = document.querySelector(`[name="word${i}"]`) || document.getElementById(`word${i}`);
        answers[`word${i}`] = (input && input.value ? input.value : '').toString().trim();
      }

      console.log('Vocabulary test submitted!', { title: document.title, answers });
      alert('Vocabulary test submitted successfully!');
      window.location.href = '/';
    });
  }

  function handleListeningPage() {
    const listeningForm = document.getElementById('listeningTestForm');
    if (!listeningForm) return;

    listeningForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const answers = {};
      const totalQuestions = 15;
      for (let i = 1; i <= totalQuestions; i++) {
        const value = (new FormData(listeningForm)).get(`q${i}`);
        answers[`question${i}`] = value || '';
      }

      console.log('Listening test submitted!', { title: document.title, answers });
      alert('Listening test submitted successfully!');
      window.location.href = '/';
    });
  }

  handleVocabularyPage();
  handleListeningPage();
});
