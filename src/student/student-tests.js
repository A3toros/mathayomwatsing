
// IMPORTS - Functions this module needs from shared modules
import { 
  showNotification,
  transformAnswersForSubmission,
  calculateTestScore,
  checkAnswerCorrectness,
  showSection
} from '../shared/index.js'

// Helper function to get test information
async function getTestInfo(testType, testId) {
    console.log(`[DEBUG] getTestInfo called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const url = `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`;
        console.log('[DEBUG] Fetching test info from:', url);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(url);
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Test info data received:', data);
        console.log('[DEBUG] Full response structure:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('[DEBUG] Test info retrieved successfully');
            console.log('[DEBUG] Test info object:', data.test_info);
            console.log('[DEBUG] Available properties:', Object.keys(data.test_info || {}));
            return data.test_info;
        } else {
            throw new Error(data.error || 'Failed to get test info');
        }
    } catch (error) {
        console.error('[ERROR] Failed to get test info:', error);
        throw error;
    }
}

// Helper function to get test questions
async function getTestQuestions(testType, testId) {
    console.log(`[DEBUG] getTestQuestions called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const url = `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`;
        console.log('[DEBUG] Fetching test questions from:', url);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(url);
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Test questions data received:', data);
        console.log('[DEBUG] Full response structure:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log(`[DEBUG] Retrieved ${data.questions.length} questions successfully`);
            console.log('[DEBUG] Questions array:', data.questions);
            console.log('[DEBUG] First question structure:', data.questions[0]);
            return data.questions;
        } else {
            throw new Error(data.error || 'Failed to get test questions');
        }
    } catch (error) {
        console.error('[ERROR] Failed to get test questions:', error);
        throw error;
    }
}

// Helper function to get current student ID from JWT
function getCurrentStudentId() {
    console.log('[DEBUG] getCurrentStudentId called');
    
    try {
        // Use JWT token instead of localStorage
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found');
            return null;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        if (decoded && decoded.sub) {
            console.log(`[DEBUG] Found student ID from JWT: ${decoded.sub}`);
            return decoded.sub;
        } else {
            console.warn('[WARN] No student ID found in JWT token');
            return null;
        }
    } catch (error) {
        console.error('[ERROR] Error getting current student ID from JWT:', error);
        return null;
    }
}

// Navigate to test results page
function showTestResults(testType, testId, studentAnswers) {
    console.log(`[DEBUG] showTestResults called with testType: ${testType}, testId: ${testId}, studentAnswers:`, studentAnswers);
    
    // Hide all sections first
    hideTestSections();
    console.log('[DEBUG] All sections hidden');
    
    // Show test results page section
    const testResultsPage = document.getElementById('test-results-page');
    if (testResultsPage) {
        // Show test results page section using the proper showSection system
        window.showSection('test-results-page');
        console.log('[DEBUG] Test results page section displayed via showSection');

        // Load and display the test results
        loadTestResultsForPage(testType, testId, studentAnswers);
    } else {
        console.error('[ERROR] Test results page section not found');
        // Fallback to cabinet
        navigateBackToCabinet();
    }
}

// Load test results for the results page
async function loadTestResultsForPage(testType, testId, studentAnswers) {
    console.log(`[DEBUG] loadTestResultsForPage called with testType: ${testType}, testId: ${testId}, studentAnswers:`, studentAnswers);
    
    // Start loading animation
    const resultsPage = document.getElementById('test-results-page');
    if (resultsPage && window.GSAPAnimations) {
        window.GSAPAnimations.animateLoading(resultsPage);
    }
    
    try {
        // Get test info
        const testInfo = await getTestInfo(testType, testId);
        console.log('[DEBUG] Test info retrieved for results:', testInfo);
        
        // Get test questions
        const questions = await getTestQuestions(testType, testId);
        console.log('[DEBUG] Test questions retrieved for results:', questions);
        
        // Display results
        displayTestResultsOnPage(testInfo, questions, testType, studentAnswers);
        
        // Stop loading animation
        if (resultsPage && window.GSAPAnimations) {
            window.GSAPAnimations.stopLoading(resultsPage);
        }
    } catch (error) {
        // Stop loading animation on error
        if (resultsPage && window.GSAPAnimations) {
            window.GSAPAnimations.stopLoading(resultsPage);
        }
        
        console.error('[ERROR] Failed to load test results for page:', error);
        alert('Failed to load test results: ' + error.message);
    }
}

// Display test results on the results page
function displayTestResultsOnPage(testInfo, questions, testType, studentAnswers) {
    console.log(`[DEBUG] displayTestResultsOnPage called with:`, { testInfo, questions, testType, studentAnswers });
    
    const testResultsSection = document.getElementById('test-results-page');
    if (!testResultsSection) {
        console.error('[ERROR] Test results page section not found');
        return;
    }
    
    // Clear existing content
    testResultsSection.innerHTML = '';
    console.log('[DEBUG] Cleared existing test results page content');
    
    // Create results header
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'results-header';
    resultsHeader.innerHTML = `
        <h2>Test Results: ${testInfo.test_name || testInfo.title || 'Test'}</h2>
    `;
    testResultsSection.appendChild(resultsHeader);
    console.log('[DEBUG] Results header created and added with info:', testInfo);
    
    // Create results summary
    const resultsSummary = document.createElement('div');
    resultsSummary.className = 'results-summary';
    
    // Backend now provides consistent data structure - no grouping needed
    const processedQuestions = questions;
    
    // Calculate score using consistent question structure
    const score = calculateTestScore(processedQuestions, studentAnswers, testType);
    const totalQuestions = testInfo.num_questions; // Use testInfo.num_questions for consistency with backend
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const questionsReview = document.createElement('div');
    questionsReview.className = 'questions-review';
    questionsReview.innerHTML = '<h3>Question Review</h3>';
    
    console.log(`[DEBUG] Test score calculated: ${score}/${totalQuestions} (${percentage}%)`);
    
    resultsSummary.innerHTML = `
        <h3>Your Score: ${score} / ${totalQuestions} (${percentage}%)</h3>
        <div class="score-bar">
            <div class="score-fill" style="width: ${percentage}%"></div>
        </div>
    `;
    testResultsSection.appendChild(resultsSummary);
    console.log('[DEBUG] Results summary created and added');
    
    processedQuestions.forEach((question, logicalIndex) => {
        console.log(`[DEBUG] Creating review for question ${logicalIndex + 1}:`, question);
        
        const questionReview = document.createElement('div');
        questionReview.className = 'question-review';
        
        const studentAnswer = studentAnswers[String(question.question_id)] || 'No answer';
        console.log(`[DEBUG] Looking up answer for question_id: ${question.question_id} (type: ${typeof question.question_id})`);
        console.log(`[DEBUG] studentAnswers keys:`, Object.keys(studentAnswers));
        console.log(`[DEBUG] Found studentAnswer:`, studentAnswer);
        const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
        
        console.log(`[DEBUG] Question ${logicalIndex + 1} - Student answer: ${studentAnswer}, Correct: ${isCorrect}`);
        
        questionReview.innerHTML = `
            <div class="question-review-header ${isCorrect ? 'correct' : 'incorrect'}">
                <h4>Question ${logicalIndex + 1}</h4>
                <span class="result-indicator">${isCorrect ? '✓' : '✗'}</span>
            </div>
            <p class="question-text">${question.question}</p>
            <p class="student-answer"><strong>Your Answer:</strong> ${formatStudentAnswerForDisplay(studentAnswer, testType)}</p>
            ${!isCorrect ? `<p class="correct-answer"><strong>Correct Answer:</strong> ${getCorrectAnswer(question, testType)}</p>` : ''}
        `;
        
        questionsReview.appendChild(questionReview);
    });
    
    testResultsSection.appendChild(questionsReview);
    console.log('[DEBUG] Questions review created and added');
    
    // Add Back to Cabinet button at the bottom
    const backButton = document.createElement('div');
    backButton.className = 'results-actions';
    backButton.innerHTML = `
        <button class="btn btn-secondary" onclick="clearTestDataAndReturnToCabinet()">Back to Cabinet</button>
    `;
    testResultsSection.appendChild(backButton);
    console.log('[DEBUG] Back button created and added:', backButton.outerHTML);
    console.log('[DEBUG] Button element found:', backButton.querySelector('button'));
    
    // Setup event listeners
    setupTestResultsPageEventListeners();
    
    console.log('[DEBUG] Test results page setup completed');
}

// Set up event listeners for the test results page
function setupTestResultsPageEventListeners() {
    console.log('[DEBUG] setupTestResultsPageEventListeners called');
    
    // Add any specific event listeners for the results page
    console.log('[DEBUG] Test results page event listeners setup completed');
}


// Helper function to convert student answer to display format
function formatStudentAnswerForDisplay(studentAnswer, testType) {
    console.log(`[DEBUG] formatStudentAnswerForDisplay called with studentAnswer: ${studentAnswer}, testType: ${testType}`);
    
    switch (testType) {
        case 'multiple_choice':
            // Convert integer answer to letter for display (0→A, 1→B, 2→C, etc.)
            const letterAnswer = String.fromCharCode(65 + parseInt(studentAnswer));
            console.log(`[DEBUG] Converted ${studentAnswer} to ${letterAnswer}`);
            return letterAnswer;
        case 'true_false':
            // Convert boolean to string for display
            return studentAnswer === 'true' ? 'True' : 'False';
        case 'input':
            // Input answers are already in the correct format
            return studentAnswer;
        default:
            console.warn(`[WARN] Unknown test type for answer formatting: ${testType}`);
            return studentAnswer;
    }
}

// Helper function to get correct answer for display
function getCorrectAnswer(question, testType) {
    console.log(`[DEBUG] getCorrectAnswer called for question:`, question, 'testType:', testType);
    
    let correctAnswer = '';
    
    switch (testType) {
        case 'true_false':
            correctAnswer = question.correct_answer ? 'True' : 'False';
            break;
        case 'multiple_choice':
            // Database stores letters (A,B,C), convert to option key
            const letterIndex = question.correct_answer.charCodeAt(0) - 65; // A→0, B→1, C→2
            const optionKey = `option_${String.fromCharCode(97 + letterIndex)}`; // a, b, c, d
            correctAnswer = question[optionKey] || `Option ${question.correct_answer}`;
            break;
        case 'input':
            // For grouped questions, show all correct answers
            if (question.correct_answers && Array.isArray(question.correct_answers)) {
                correctAnswer = question.correct_answers.join(', ');
            } else {
                // Fallback for old format
                correctAnswer = question.correct_answer || 'Unknown';
            }
            break;

        default:
            correctAnswer = 'Unknown';
    }
    
    console.log(`[DEBUG] Correct answer: ${correctAnswer}`);
    return correctAnswer;
}

// Function to clear test data and return to cabinet
function clearTestDataAndReturnToCabinet() {
    console.log('[DEBUG] clearTestDataAndReturnToCabinet called');
    
    // Prevent multiple calls
    if (window.isClearingTestData) {
        console.log('[DEBUG] clearTestDataAndReturnToCabinet already in progress, skipping');
        return;
    }
    window.isClearingTestData = true;
    
    // Get current test info from global variables set by navigateToTestResults
    const currentTestType = window.currentTestType;
    const currentTestId = window.currentTestId;
    const currentStudentId = getCurrentStudentId();
    
    if (currentTestType && currentTestId && currentStudentId) {
        // Clear test progress
        clearTestProgress(currentTestType, currentTestId);
        
        // Clear test completion status
        const completionKey = `test_completed_${currentTestType}_${currentTestId}_${currentStudentId}`;
        localStorage.removeItem(completionKey);
        
        // Clear progress tracking interval
        clearProgressTrackingInterval(currentTestType, currentTestId);
        
        console.log('[DEBUG] Test data cleared for:', { currentTestType, currentTestId, currentStudentId });
    }
    
    // Navigate back to cabinet
    navigateBackToCabinet();
    
    // Refresh the test results/score table and active tests (including average score circle) after returning to cabinet
    setTimeout(() => {
        if (currentStudentId) {
            console.log('[DEBUG] Refreshing test results and active tests for student:', currentStudentId);
            if (typeof window.loadStudentTestResults === 'function') {
                window.loadStudentTestResults();
            }
            if (typeof window.loadStudentActiveTests === 'function') {
                window.loadStudentActiveTests();
            }
        }
        // Reset the flag after completion
        window.isClearingTestData = false;
    }, 100);
}

// EXPORTS - Student test functions
export {
  loadStudentActiveTests,
  displayStudentActiveTests,
  isTestCompleted,
  markTestCompleted,
  markTestCompletedInUI,
  viewTestDetails,
  showTestDetailsModal,
  getQuestionAnswerDisplay,
  closeTestDetailsModal,
  collectTestAnswers,
  submitTest,
  saveTestProgress,
  getTestProgress,
  clearTestProgress,
  clearProgressTrackingInterval,
  navigateToTest,
  hideTestSections,
  loadTestForPage,
  displayTestOnPage,
  renderQuestionsForPage,
  renderTrueFalseQuestionsForPage,
  renderMultipleChoiceQuestionsForPage,
  renderInputQuestionsForPage,
  setupTestPageEventListeners,
  setupProgressTrackingForPage,
  updateProgressDisplayForPage,
  updateSubmitButtonStateForPage,
  loadSavedProgressForPage,
  submitTestFromPage,
  showTestResults,
  loadTestResultsForPage,
  displayTestResultsOnPage,
  setupTestResultsPageEventListeners,
  checkAnswerCorrectness,
  getCorrectAnswer,
  clearTestDataAndReturnToCabinet,
  navigateToTestResults
}

// Load active tests for student
async function loadStudentActiveTests() {
    console.log('loadStudentActiveTests called - extracting studentId from JWT token');
    
    // Show loading state
    const container = document.getElementById('studentActiveTests');
    if (container) {
        container.innerHTML = `
            <div class="loading-tests">
                <div class="loading-spinner"></div>
                <p>Loading tests...</p>
            </div>
        `;
    }
    
    try {
        console.log('Fetching student active tests using JWT authentication...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-active-tests'
        );
        
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Full response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('Successfully loaded tests, calling displayStudentActiveTests');
            displayStudentActiveTests(data.tests);
        } else {
            console.error('Error loading student active tests:', data.error);
            // Show error state
            if (container) {
                container.innerHTML = '<p class="error-message">Error loading tests. Please try again.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading student active tests:', error);
        // Show error state
        if (container) {
            container.innerHTML = '<p class="error-message">Error loading tests. Please try again.</p>';
        }
    }
}

// Display active tests for student
async function displayStudentActiveTests(tests) {
    try {
        // Extract studentId from JWT token
        if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
            console.warn('[WARN] No valid JWT token found for displayStudentActiveTests');
            return;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        console.log('[DEBUG] Full JWT token decoded:', decoded);
        console.log('[DEBUG] Available fields in JWT:', Object.keys(decoded || {}));
        
        // Check for different possible field names for student ID
        const studentId = decoded?.student_id || decoded?.sub || decoded?.user_id || decoded?.id;
        if (!studentId) {
            console.warn('[WARN] No student_id found in JWT token. Available fields:', Object.keys(decoded || {}));
            return;
        }
        
        console.log('[DEBUG] Using student ID:', studentId);
        
        console.log('displayStudentActiveTests called with tests:', tests);
        
        const container = document.getElementById('studentActiveTests');
        if (!container) {
            console.error('studentActiveTests container not found');
            return;
        }
        
        console.log('Container found, tests length:', tests.length);
        
        if (tests.length === 0) {
            console.log('No tests found, showing "no tests" message');
            container.innerHTML = '<p>No active tests available for your class.</p>';
            return;
        }
        
        // Check completion status for all tests
        const completionChecks = tests.map(async test => {
            const isCompleted = await isTestCompleted(test.test_type, test.test_id);
            console.log(`Test ${test.test_name} (${test.test_type}_${test.test_id}) completion status:`, isCompleted);
            return { ...test, isCompleted };
        });
        
        const testsWithCompletion = await Promise.all(completionChecks);
    
    // Filter out any tests that might be expired (double safety)
    const activeTests = testsWithCompletion.filter(test => {
        const daysSinceAssigned = Math.floor((Date.now() - new Date(test.assigned_at)) / (1000 * 60 * 60 * 24));
        return daysSinceAssigned <= 7;
    });
    
    console.log(`Filtered ${testsWithCompletion.length} total tests to ${activeTests.length} active tests`);
    
    // Check if all tests are expired after filtering
    if (activeTests.length === 0) {
        console.log('All tests are expired, showing "no active tests" message');
        container.innerHTML = '<p>No active tests available for your class. All tests have expired.</p>';
        
        // Still load test results and average score even when there are no active tests
        console.log('Loading test results despite no active tests...');
        if (typeof window.loadStudentTestResults === 'function') {
            window.loadStudentTestResults();
        }
        return;
    }
    
    // Sort by assigned_at desc (fallback: test_id desc)
    const sorted = [...activeTests].sort((a, b) => {
        const atA = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
        const atB = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
        if (atA !== atB) return atB - atA;
        return (b.test_id || 0) - (a.test_id || 0);
    });

    const top = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    // Compute average score from student's historical results using JWT authentication
    let averagePct = null;
    try {
        // Use the studentId already extracted from JWT token above
        if (studentId) {
            const response = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/get-student-test-results?student_id=${studentId}`
            );
            const data = await response.json();
            if (data && data.success && Array.isArray(data.results)) {
                const results = data.results;
                if (results.length > 0) {
                    const sum = results.reduce((acc, r) => {
                        if (typeof r.score_percentage === 'number') return acc + r.score_percentage;
                        if (typeof r.score === 'number' && typeof r.max_score === 'number' && r.max_score > 0) {
                            return acc + Math.round((r.score / r.max_score) * 100);
                        }
                        return acc;
                    }, 0);
                    averagePct = Math.round(sum / results.length);
                }
            }
        }
    } catch (error) {
        console.warn('[WARN] Failed to load average score:', error);
    }

    const getAvgMessage = (pct) => {
        if (pct == null) return 'Godspeed!';
        if (pct >= 95) return 'Impeccable';
        if (pct >= 90) return 'Super-duper Awesome';
        if (pct >= 85) return 'Brilliant';
        if (pct >= 80) return 'Spectacular';
        if (pct >= 75) return 'Wonderful';
        if (pct >= 70) return 'Amazing';
        if (pct >= 65) return 'Good one';
        if (pct >= 60) return 'Nice';
        if (pct >= 55) return 'Cool';
        if (pct >= 50) return 'Could be better';
        return 'Try harder';
    };

    const renderItem = (test) => {
        // Use string concatenation instead of template literals for better mobile compatibility
        const completedClass = test.isCompleted ? 'completed' : '';
        const questionCount = test.num_questions || 0;
        const actionButton = test.isCompleted ?
            '<span class="student-completed-text">Completed</span>' :
            '<button class="btn btn-primary btn-sm start-test-btn" type="button" onclick="navigateToTest(\'' + test.test_type + '\', ' + test.test_id + ')">Start</button>';
        
        return '<div class="student-active-item ' + completedClass + '" data-test-id="' + test.test_id + '" data-test-type="' + test.test_type + '">' +
            '<div class="student-active-info">' +
                '<span class="student-test-name">' + test.test_name + '</span>' +
                '<span class="dot">·</span>' +
                '<span class="student-subject">' + test.subject_name + '</span>' +
                '<span class="dot">·</span>' +
                '<span class="student-teacher">' + test.teacher_name + '</span>' +
                '<span class="dot">·</span>' +
                '<span class="student-question-count">' + questionCount + ' questions</span>' +
            '</div>' +
            '<div class="student-active-actions">' +
                actionButton +
            '</div>' +
        '</div>';
    };

    let html = '<div class="student-active-list">';
    html += top.map(renderItem).join('');
    html += '</div>';

    // If more tests exist, show Expand above the graph
    if (rest.length > 0) {
        html += `
            <div id="studentActiveExpandRow" class="student-active-expand-row">
                <button id="studentActiveExpand" class="link-minimal" type="button">Expand</button>
            </div>
        `;
    }

    if (rest.length > 0) {
        html += `
            <div id="studentActiveHidden" class="student-active-list" style="display:none;">
                ${rest.map(renderItem).join('')}
            </div>
            <div id="studentActiveCollapseRow" class="student-active-expand-row" style="display:none;">
                <button id="studentActiveCollapse" class="link-minimal" type="button">Collapse</button>
            </div>
        `;
    }

    // Always add average score widget at the end, regardless of whether there are active tests
    const pct = averagePct != null ? Math.min(100, Math.max(0, averagePct)) : 0;
    const r = 50; // outer radius
    const c = 2 * Math.PI * r; // circumference for outer ring
    const dash = c * (1 - pct / 100);
    const msgClass = averagePct == null ? 'neutral' : (pct <= 50 ? 'low' : (pct <= 70 ? 'mid' : 'high'));
    
    // Use string concatenation instead of template literals for better mobile compatibility
    const avgWidgetHtml = '<div class="avg-score-widget">' +
        '<div class="avg-title">Average score</div>' +
        '<svg class="avg-circle" width="140" height="140" viewBox="0 0 140 140" aria-label="Average score">' +
            '<defs>' +
                '<linearGradient id="avgViolet" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" stop-color="#8a2be2"/>' +
                    '<stop offset="100%" stop-color="#a855f7"/>' +
                '</linearGradient>' +
                '<linearGradient id="avgFillPB" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" stop-color="#8a2be2"/>' +
                    '<stop offset="100%" stop-color="#3b82f6"/>' +
                '</linearGradient>' +
            '</defs>' +
            '<circle cx="70" cy="70" r="50" fill="none" stroke="#e5e7eb" stroke-width="8"/>' +
            '<circle cx="70" cy="70" r="50" fill="none" stroke="url(#avgFillPB)" stroke-width="8" ' +
                'stroke-dasharray="' + c + '" stroke-dashoffset="' + dash + '" ' +
                'transform="rotate(-90 70 70)"/>' +
        '</svg>' +
        '<div class="avg-text">' +
            '<span class="avg-number">' + pct + '</span>' +
            '<span class="avg-percent">%</span>' +
        '</div>' +
        '<div class="avg-message">' + getAvgMessage(averagePct) + '</div>' +
    '</div>';
    
    // Add average score widget to HTML before setting innerHTML
    html += avgWidgetHtml;
    
    container.innerHTML = html;

    // Setup expand/collapse functionality
    if (rest.length > 0) {
        console.log('Setting up expand/collapse functionality for', rest.length, 'hidden tests');
        const expandBtn = document.getElementById('studentActiveExpand');
        const collapseBtn = document.getElementById('studentActiveCollapse');
        const hiddenList = document.getElementById('studentActiveHidden');
        const expandRow = document.getElementById('studentActiveExpandRow');
        const collapseRow = document.getElementById('studentActiveCollapseRow');

        console.log('Expand button found:', !!expandBtn);
        console.log('Collapse button found:', !!collapseBtn);
        console.log('Hidden list found:', !!hiddenList);
        console.log('Expand row found:', !!expandRow);
        console.log('Collapse row found:', !!collapseRow);

        if (expandBtn && collapseBtn && hiddenList && expandRow && collapseRow) {
            console.log('All elements found, setting up event listeners');
            console.log('Expand button element:', expandBtn);
            console.log('Collapse button element:', collapseBtn);
            console.log('Hidden list element:', hiddenList);
            console.log('Expand row element:', expandRow);
            console.log('Collapse row element:', collapseRow);
            
            expandBtn.onclick = () => {
                console.log('Expand button clicked - starting expand action');
                console.log('Hidden list before:', hiddenList.style.display);
                console.log('Expand row before:', expandRow.style.display);
                console.log('Collapse row before:', collapseRow.style.display);
                
                hiddenList.style.display = 'block';
                expandRow.style.display = 'none';
                collapseRow.style.display = 'block';
                
                console.log('Hidden list after:', hiddenList.style.display);
                console.log('Expand row after:', expandRow.style.display);
                console.log('Collapse row after:', collapseRow.style.display);
                console.log('Expand action completed');
            };

            collapseBtn.onclick = () => {
                console.log('Collapse button clicked - starting collapse action');
                console.log('Hidden list before:', hiddenList.style.display);
                console.log('Expand row before:', expandRow.style.display);
                console.log('Collapse row before:', collapseRow.style.display);
                
                hiddenList.style.display = 'none';
                expandRow.style.display = 'block';
                collapseRow.style.display = 'none';
                
                console.log('Hidden list after:', hiddenList.style.display);
                console.log('Expand row after:', expandRow.style.display);
                console.log('Collapse row after:', collapseRow.style.display);
                console.log('Collapse action completed');
            };
            console.log('Event listeners set up successfully');
        } else {
            console.error('Some elements not found for expand/collapse functionality');
        }
    }
    
} catch (error) {
    console.error('[ERROR] Failed to display student active tests:', error);
}
}

// Check if a test has been completed by the current student
async function isTestCompleted(testType, testId) {
    try {
        // Extract studentId from JWT token
        const token = window.tokenManager.getAccessToken();
        if (!token) {
            console.warn('[WARN] No access token available for isTestCompleted');
            return false;
        }
        
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        const studentId = decoded.sub;
        
        console.log(`🔍 Checking completion for test ${testType}_${testId} for student ${studentId}`);
        
        // Check local storage first (for immediate feedback)
        const localKey = `test_completed_${testType}_${testId}_${studentId}`;
        const localStatus = localStorage.getItem(localKey);
        if (localStatus === 'true') {
            console.log(`✅ Found completion status in local storage: ${localStatus}`);
            return true;
        }
        
        // Check database for existing results
        try {
            console.log(`🌐 Checking database for completion status...`);
            const response = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/check-test-completion?test_type=${testType}&test_id=${testId}`
            );
            const data = await response.json();
            
            console.log(`📊 Database response:`, data);
            
            if (data.success && data.isCompleted) {
                // Mark as completed in local storage for future checks
                localStorage.setItem(localKey, 'true');
                console.log(`✅ Test marked as completed in local storage`);
                return true;
            }
            
            console.log(`❌ Test not completed according to database`);
            return false;
        } catch (error) {
            console.error('❌ Error checking test completion:', error);
            return false; // Allow test if we can't check
        }
    } catch (error) {
        console.error('[ERROR] Failed to check test completion:', error);
        return false;
    }
}

// Mark a test as completed
async function markTestCompleted(testType, testId) {
    console.log(`[DEBUG] markTestCompleted called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Extract studentId from JWT token
        const token = window.tokenManager.getAccessToken();
        if (!token) {
            console.warn('[WARN] No access token available for markTestCompleted');
            return;
        }
        const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
        const studentId = decoded.sub;
        
        const key = `test_completed_${testType}_${testId}_${studentId}`;
        console.log(`[DEBUG] Setting localStorage key: ${key}`);
        
        localStorage.setItem(key, 'true');
        console.log(`[DEBUG] ✅ Marked test ${testType}_${testId} as completed for student ${studentId}`);
        console.log(`[DEBUG] 💾 Saved to local storage with key: ${key}`);
        
        // Update UI immediately to show test as completed
        markTestCompletedInUI(testType, testId);
    } catch (error) {
        console.error('[ERROR] Failed to mark test as completed:', error);
    }
}

// Mark test as completed in the UI without page reload
function markTestCompletedInUI(testType, testId) {
    console.log(`🎯 Marking test ${testType}_${testId} as completed in UI...`);
    
    // Find the test item in the active tests section
    const testItem = document.querySelector(`[data-test-id="${testId}"][data-test-type="${testType}"]`);
    
    if (testItem) {
        // Add completed class
        testItem.classList.add('completed');
        
        // Find the actions container and replace the start button with completed text
        const actionsContainer = testItem.querySelector('.student-active-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = '<span class="student-completed-text">Completed</span>';
        }
        
        console.log(`✅ Test ${testType}_${testId} marked as completed in UI`);
    } else {
        console.warn(`⚠️ Test item not found for ${testType}_${testId}`);
    }
}

// View test details (questions and correct answers)
async function viewTestDetails(testType, testId, testName) {
    console.log('Viewing test details:', { testType, testId, testName });
    
    try {
        // Load test questions
        const questions = await getTestQuestions(testType, testId);
        
        if (questions && questions.length > 0) {
            // Show test details in a modal or overlay
            showTestDetailsModal(testType, testId, testName, questions);
        } else {
            showNotification('Could not load test questions. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error loading test details:', error);
        showNotification('Error loading test details. Please try again.', 'error');
    }
}

// Show test details modal
function showTestDetailsModal(testType, testId, testName, questions) {
    // Create modal HTML
    const modalHTML = `
        <div id="testDetailsModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${testName}</h3>
                    <button class="modal-close" onclick="closeTestDetailsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="test-questions">
                        ${questions.map((question, index) => `
                            <div class="question-item">
                                <h4>Question ${index + 1}</h4>
                                <p class="question-text">${question.question}</p>
                                ${getQuestionAnswerDisplay(question, testType)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = document.getElementById('testDetailsModal');
    modal.style.display = 'flex';
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeTestDetailsModal();
        }
    });
}

// Get question answer display based on test type
function getQuestionAnswerDisplay(question, testType) {
    console.log('getQuestionAnswerDisplay called with:', { question, testType });
    
    switch (testType) {
        case 'multiple_choice':
            console.log('Multiple choice question data:', {
                option_a: question.option_a,
                option_b: question.option_b,
                option_c: question.option_c,
                option_d: question.option_d,
                option_e: question.option_e,
                option_f: question.option_f,
                correct_answer: question.correct_answer
            });
            return `
                <div class="answer-options">
                    <p><strong>Options:</strong></p>
                    <p>A) ${question.option_a || 'No text'}</p>
                    <p>B) ${question.option_b || 'No text'}</p>
                    ${question.option_c ? `<p>C) ${question.option_c}</p>` : ''}
                    ${question.option_d ? `<p>D) ${question.option_d}</p>` : ''}
                    ${question.option_e ? `<p>E) ${question.option_e}</p>` : ''}
                    ${question.option_f ? `<p>F) ${question.option_f}</p>` : ''}
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer || 'Not specified'}</strong></p>
                </div>
            `;
        case 'true_false':
            console.log('True/false question data:', { correct_answer: question.correct_answer });
            return `
                <div class="answer-options">
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer ? 'True' : 'False'}</strong></p>
                </div>
            `;
        case 'input':
            console.log('Input question data:', { correct_answer: question.correct_answer });
            return `
                <div class="answer-options">
                    <p class="correct-answer"><strong>Correct Answer: ${question.correct_answer || 'Not specified'}</strong></p>
                </div>
            `;
        default:
            console.log('Unknown test type:', testType);
            return '<p>Unknown question type</p>';
    }
}

// Close test details modal
function closeTestDetailsModal() {
    const modal = document.getElementById('testDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Collect answers from the test form
function collectTestAnswers(testType, testId) {
    console.log(`[DEBUG] collectTestAnswers called with testType: ${testType}, testId: ${testId}`);
    const answers = {};
    
    if (testType === 'matching_type') {
        console.log('[DEBUG] Collecting answers for matching type test - REDIRECTED TO DEDICATED PAGE');
        // Matching type tests now redirect to matching-test-student.html
        // This function should not be called for matching type tests in the main app
        console.warn('[WARN] collectTestAnswers called for matching_type - this should not happen');
        return {};
    } else {
        console.log('[DEBUG] Collecting answers for standard test types');
        // For other test types, collect form inputs
        const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
        console.log(`[DEBUG] Found ${radioButtons.length} checked radio buttons`);
        
        radioButtons.forEach(radio => {
            const questionId = radio.name.replace('question_', '');
            answers[questionId] = radio.value;
            console.log(`[DEBUG] Collected radio answer: question ${questionId} = ${radio.value}`);
        });
        
        const textInputs = document.querySelectorAll('input[type="text"]');
        console.log(`[DEBUG] Found ${textInputs.length} text inputs`);
        
        textInputs.forEach(input => {
            if (input.value.trim()) {
                const questionId = input.dataset.questionId;
                answers[questionId] = input.value.trim();
                console.log(`[DEBUG] Collected text answer: question ${questionId} = ${input.value.trim()}`);
            }
        });
    }
    
    console.log('[DEBUG] Final collected answers:', answers);
    return answers;
}

// Submit test function
async function submitTest(testType, testId) {
    console.log('Submitting test:', { testType, testId });
    
    try {
        // Collect answers
        const answers = collectTestAnswers(testType, testId);
        
        if (Object.keys(answers).length === 0) {
            showNotification('Please answer at least one question before submitting.', 'warning');
            return;
        }

        // Remove localStorage dependency - backend will extract user info from JWT
        // No need to get user session data
        
        // Get test information to get test_name
        let testInfo;
        try {
            const testResponse = await window.tokenManager.makeAuthenticatedRequest(
                `/.netlify/functions/get-test-questions?test_type=${testType}&test_id=${testId}`
            );
            const testData = await testResponse.json();
            if (testData.success) {
                testInfo = testData.test_info;
            } else {
                throw new Error('Failed to get test information');
            }
        } catch (error) {
            console.error('Error getting test info:', error);
            // Use fallback test name if we can't get it - include num_questions
            const questions = await getTestQuestions(testType, testId);
            testInfo = { test_name: `Test ${testId}`, num_questions: questions.length };
        }

       // Calculate score properly using the existing function
        const questions = await getTestQuestions(testType, testId);
        const score = calculateTestScore(questions, answers, testType);
        const maxScore = testInfo.num_questions; // Use logical question count

        // Transform answers to the format expected by backend
        const transformedAnswers = transformAnswersForSubmission(answers, testType);
        
        // Prepare common data for all test types
        // Remove user information - backend will extract from JWT token
        const commonData = {
            test_id: testId,
            test_name: testInfo.test_name,
            score: score,
            maxScore: maxScore,
            answers: transformedAnswers
        };
        
        // Submit based on test type
        let response;
        switch (testType) {
            case 'true_false':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-true-false-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'multiple_choice':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-multiple-choice-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'input':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-input-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            case 'matching_type':
                response = await window.tokenManager.makeAuthenticatedRequest(
                    '/.netlify/functions/submit-matching-type-test',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(commonData)
                    }
                );
                break;
            default:
                throw new Error('Unsupported test type');
        }
        
        const data = await response.json();
        
       // In submitTest function, after marking test as completed:
        if (data.success) {
            // Mark test as completed
            markTestCompleted(testType, testId);
            
            // Clear progress
            clearTestProgress(testType, testId);
            
    // STOP the progress tracking interval
    clearProgressTrackingInterval(testType, testId);
            
            
    
            return { success: true, message: 'Test submitted successfully!' };
        } else {
            throw new Error(data.error || 'Failed to submit test');
        }
    } catch (error) {
        console.error('Error submitting test:', error);
        return { success: false, message: error.message };
    }
}

// Local storage functions for test progress (with JWT validation)
function saveTestProgress(testType, testId, questionId, answer) {
    // Validate JWT before saving progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot save progress: No valid JWT token');
        return;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    let progress = JSON.parse(localStorage.getItem(key) || '{}');
    progress[questionId] = answer;
    localStorage.setItem(key, JSON.stringify(progress));
    console.log(`Saved progress for question ${questionId}:`, answer);
}

function getTestProgress(testType, testId, questionId) {
    // Validate JWT before getting progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot get progress: No valid JWT token');
        return null;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    const progress = JSON.parse(localStorage.getItem(key) || '{}');
    return progress[questionId] || null;
}

function clearTestProgress(testType, testId) {
    console.log(`[DEBUG] clearTestProgress called with testType: ${testType}, testId: ${testId}`);
    
    // Validate JWT before clearing progress
    if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot clear progress: No valid JWT token');
        return;
    }
    
    const key = `test_progress_${testType}_${testId}`;
    console.log(`[DEBUG] Removing localStorage key: ${key}`);
    
    const hadProgress = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    
    if (hadProgress) {
        console.log(`[DEBUG] Progress cleared for test ${testType}_${testId}`);
    } else {
        console.log(`[DEBUG] No progress found to clear for test ${testType}_${testId}`);
    }
}

function clearProgressTrackingInterval(testType, testId) {
    const intervalKey = `progress_interval_${testType}_${testId}`;
    if (window[intervalKey]) {
        clearInterval(window[intervalKey]);
        window[intervalKey] = null;
        console.log(`[DEBUG] Progress tracking interval cleared for ${testType}_${testId}`);
    }
}

// Hide student sections and show test page
function hideTestSections() {
    console.log('[DEBUG] hideTestSections called');
    
    // Hide student cabinet
    const studentCabinet = document.getElementById('student-cabinet');
    if (studentCabinet) {
        studentCabinet.style.display = 'none';
        console.log('[DEBUG] Student cabinet hidden');
    }
    
    // Hide any other student-specific sections
    const activeTestsSection = document.getElementById('activeTestsSection');
    if (activeTestsSection) {
        activeTestsSection.style.display = 'none';
        console.log('[DEBUG] Active tests section hidden');
    }
}

// Navigate to test page
function navigateToTest(testType, testId) {
    // Prevent duplicate calls
    if (window.isNavigatingToTest) {
        console.log('[DEBUG] navigateToTest already in progress, ignoring duplicate call');
        return;
    }
    
    window.isNavigatingToTest = true;
    console.log(`[DEBUG] navigateToTest called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Hide all sections first
        hideTestSections();
        console.log('[DEBUG] All sections hidden');
        
        // Show test page section
        const testPage = document.getElementById('test-page');
        if (testPage) {
            // Force all display properties
            testPage.style.display = 'block';
            testPage.style.visibility = 'visible';
            testPage.style.opacity = '1';
            testPage.style.position = 'fixed';
            testPage.style.top = '0';
            testPage.style.left = '0';
            testPage.style.width = '100%';
            testPage.style.height = '100%';
            testPage.style.zIndex = '1000';
            testPage.classList.add('active');
            
            console.log('[DEBUG] Test page section displayed with properties:', {
                display: testPage.style.display,
                visibility: testPage.style.visibility,
                opacity: testPage.style.opacity,
                position: testPage.style.position,
                zIndex: testPage.style.zIndex,
                classes: testPage.className
            });
            
            // Load and display the test
            loadTestForPage(testType, testId);
        } else {
            console.error('[ERROR] Test page section not found');
            window.isNavigatingToTest = false;
            return;
        }
        
    } catch (error) {
        console.error('[ERROR] Error in navigateToTest:', error);
    } finally {
        // Reset the flag after a short delay to allow the test to load
        setTimeout(() => {
            window.isNavigatingToTest = false;
        }, 1000);
    }
}

// Load test content for the test page
async function loadTestForPage(testType, testId) {
    console.log(`[DEBUG] loadTestForPage called with testType: ${testType}, testId: ${testId}`);
    
    // Start loading animation
    const testPage = document.getElementById('test-page');
    if (testPage && window.GSAPAnimations) {
        window.GSAPAnimations.animateLoading(testPage);
    }
    
    try {
        // Get test info
        const testInfo = await getTestInfo(testType, testId);
        console.log('[DEBUG] Test info retrieved:', testInfo);
        
        // Get test questions
        const questions = await getTestQuestions(testType, testId);
        console.log('[DEBUG] Test questions retrieved:', questions);
        
        // Display the test
        displayTestOnPage(testInfo, questions, testType, testId);
        
        // Stop loading animation
        if (testPage && window.GSAPAnimations) {
            window.GSAPAnimations.stopLoading(testPage);
        }
        
        // Debug: Check if test page is still visible after loading
        if (testPage) {
            console.log('[DEBUG] After test load - Test page visibility:', {
                display: testPage.style.display,
                visibility: testPage.style.visibility,
                opacity: testPage.style.opacity,
                classes: testPage.className,
                isVisible: testPage.style.display !== 'none' && testPage.style.visibility !== 'hidden' && testPage.style.opacity !== '0'
            });
        }
        
        // Debug: Check the questions data structure
        console.log('[DEBUG] Questions data structure:', {
            rawQuestionsLength: questions.length,
            questionsType: testType,
            testId: testId
        });
    } catch (error) {
        // Stop loading animation on error
        if (testPage && window.GSAPAnimations) {
            window.GSAPAnimations.stopLoading(testPage);
        }
        
        // Check if this is an intentional redirection error
        if (error.message === 'Redirection initiated - should not continue') {
            console.log('[DEBUG] Redirection completed successfully - this is expected behavior');
            return; // Exit gracefully without showing error
        }
        
        console.error('[ERROR] Failed to load test for page:', error);
        alert('Failed to load test: ' + error.message);
    }
}

// Display test on the test page
function displayTestOnPage(testInfo, questions, testType, testId) {
    console.log(`[DEBUG] displayTestOnPage called with:`, { testInfo, questions, testType, testId });
    
    // Special handling for matching type tests - redirect to dedicated page
    if (testType === 'matching_type') {
        console.log('[DEBUG] Matching type test detected, redirecting to dedicated page');
        const studentId = getCurrentStudentId();
        console.log('[DEBUG] Student ID for redirection:', studentId);
        
        if (!studentId) {
            console.error('[ERROR] No student ID found, cannot redirect');
            alert('Error: Student ID not found. Please log in again.');
            return;
        }
        
        const redirectUrl = `matching-test-student.html?test_id=${testId}&student_id=${studentId}`;
        console.log('[DEBUG] Redirect URL:', redirectUrl);
        console.log('[DEBUG] About to redirect...');
        
        // Force immediate redirection
        try {
            console.log('[DEBUG] Attempting redirection with replace()...');
            window.location.replace(redirectUrl);
            console.log('[DEBUG] Redirection initiated with replace()');
        } catch (error) {
            console.error('[ERROR] Redirection failed:', error);
            // Fallback to href
            console.log('[DEBUG] Fallback to href redirection...');
            window.location.href = redirectUrl;
            console.log('[DEBUG] Fallback redirection with href');
        }
        
        // Prevent any further execution
        console.log('[DEBUG] Redirection complete, preventing further execution');
        throw new Error('Redirection initiated - should not continue');
    }
    
    const testPageSection = document.getElementById('test-page');
    if (!testPageSection) {
        console.error('[ERROR] Test page section not found');
        return;
    }
    
    // For input tests, group questions by question_id to handle multiple correct answers
    let processedQuestions = questions;
    if (testType === 'input') {
        console.log('[DEBUG] Processing input test questions - grouping by question_id');
        console.log('[DEBUG] Original questions structure:', questions);
        
        // Backend now provides consistent data structure - no grouping needed
        processedQuestions = questions;
        console.log(`[DEBUG] Backend provided ${questions.length} questions with consistent structure:`, processedQuestions);
    }
    
    // Clear existing content
    testPageSection.innerHTML = '';
    console.log('[DEBUG] Cleared existing test page content');
    
    // Create test header
    const testHeader = document.createElement('div');
    testHeader.className = 'test-header';
    testHeader.innerHTML = `
        <h2>${testInfo.test_name || testInfo.title || 'Test'}</h2>
        <button class="btn btn-secondary" onclick="navigateBackToCabinet()">Back to&#10;Cabinet</button>
    `;
    testPageSection.appendChild(testHeader);
    console.log('[DEBUG] Test header created and added with info:', testInfo);
    
    // Create progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'test-progress';
    progressIndicator.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <span class="progress-text">0 / ${testInfo.num_questions} questions</span>
    `;
    testPageSection.appendChild(progressIndicator);
    console.log('[DEBUG] Progress indicator created and added');
    
    // Create questions container
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';
    testPageSection.appendChild(questionsContainer);
    console.log('[DEBUG] Questions container created');
    
    // Render questions
    console.log('[DEBUG] About to render questions...');
    renderQuestionsForPage(processedQuestions, testType, testId);
    console.log('[DEBUG] Questions rendering completed');
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary submit-test-btn';
    submitButton.textContent = 'Submit Test';
    submitButton.disabled = true;
    submitButton.onclick = () => submitTestFromPage(testType, testId);
    testPageSection.appendChild(submitButton);
    console.log('[DEBUG] Submit button created and added');
    
    // Setup event listeners and progress tracking
    setupTestPageEventListeners(testType, testId);
    setupProgressTrackingForPage(testType, testId);
    
    // Load saved progress
    loadSavedProgressForPage(testType, testId);
    
    console.log('[DEBUG] Test page setup completed');
}

// Render questions for the test page
function renderQuestionsForPage(questions, testType, testId) {
    console.log(`[DEBUG] renderQuestionsForPage called with ${questions.length} questions, testType: ${testType}, testId: ${testId}`);
    
    const questionsContainer = document.querySelector('.questions-container');
    if (!questionsContainer) {
        console.error('[ERROR] Questions container not found');
        return;
    }
    
    questions.forEach((question, index) => {
        console.log(`[DEBUG] Rendering question ${index + 1}:`, question);
        console.log(`[DEBUG] Question ${index + 1} properties:`, Object.keys(question));
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-container';
        questionElement.dataset.questionIndex = index;
        questionElement.dataset.questionId = question.id || question.question_id;
        
        // Render based on question type
        let renderedHtml = '';
        switch (testType) {
            case 'true-false':
            case 'true_false':  // Handle both formats
                renderedHtml = renderTrueFalseQuestionsForPage(question, testId);
                console.log(`[DEBUG] True/false HTML for question ${index + 1}:`, renderedHtml);
                break;
            case 'multiple-choice':
            case 'multiple_choice':  // Handle both formats
                renderedHtml = renderMultipleChoiceQuestionsForPage(question, testId);
                console.log(`[DEBUG] Multiple choice HTML for question ${index + 1}:`, renderedHtml);
                break;
            case 'input':
                // Use the proper rendering function for input questions
                renderedHtml = renderInputQuestionsForPage(question, testId);
                console.log(`[DEBUG] Input HTML for question ${index + 1}:`, renderedHtml);
                break;
            case 'matching_type':
                // Handle matching type tests
                renderedHtml = `<p>Matching type test - redirecting to dedicated page</p>`;
                break;

            default:
                console.warn(`[WARN] Unknown test type: ${testType}`);
                renderedHtml = `<p>Unknown question type: ${testType}</p>`;
        }
        
        // Fallback if rendering failed
        if (!renderedHtml || renderedHtml.trim() === '') {
            console.warn(`[WARN] Rendering failed for question ${index + 1}, using fallback HTML`);
            renderedHtml = `
                <div class="question-container" data-question-id="${question.question_id || index}">
                    <h4>Question ${index + 1}</h4>
                    <p class="question-text">${question.question || 'Question text not available'}</p>
                    <div class="input-question">
                        <input type="text" 
                               id="input_${question.question_id || index}" 
                               placeholder="Enter your answer" 
                               data-question-id="${question.question_id || index}">
                    </div>
                </div>
            `;
        }
        
        questionElement.innerHTML = renderedHtml;
        
        questionsContainer.appendChild(questionElement);
        console.log(`[DEBUG] Question ${index + 1} added to container`);
        console.log(`[DEBUG] Question ${index + 1} HTML:`, questionElement.innerHTML);
    });
    
    console.log(`[DEBUG] All ${questions.length} questions rendered`);
    console.log(`[DEBUG] Questions container now has ${questionsContainer.children.length} children`);
    console.log(`[DEBUG] Questions container HTML:`, questionsContainer.innerHTML);
}

// Render true/false questions for page
function renderTrueFalseQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderTrueFalseQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('true_false', testId, questionId);
    
    return `
        <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
            <h4>Question ${question.question_id}</h4>
            <p class="question-text">${question.question}</p>
            <div class="answer-options">
                <label class="radio-option">
                    <input type="radio" name="question_${questionId}" value="true" 
                           ${savedAnswer === 'true' ? 'checked' : ''} data-question-id="${questionId}">
                    <span class="radio-custom"></span>
                    True
                </label>
                <label class="radio-option">
                    <input type="radio" name="question_${questionId}" value="false" 
                           ${savedAnswer === 'false' ? 'checked' : ''} data-question-id="${questionId}">
                    <span class="radio-custom"></span>
                    False
                </label>
            </div>
        </div>
    `;
}

// Render multiple choice questions for page
function renderMultipleChoiceQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderMultipleChoiceQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('multiple_choice', testId, questionId);
    
    return `
        <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
            <h4>Question ${question.question_id}</h4>
            <p class="question-text">${question.question}</p>
            <div class="answer-options">
                ${question.options.map((option, optionIndex) => `
                    <label class="radio-option">
                        <input type="radio" name="question_${questionId}" value="${optionIndex}" 
                               ${savedAnswer === String(optionIndex) ? 'checked' : ''} data-question-id="${questionId}">
                        <span class="radio-custom"></span>
                        ${String.fromCharCode(65 + optionIndex)}) ${option}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

// Render input questions for page
function renderInputQuestionsForPage(question, testId) {
    console.log(`[DEBUG] renderInputQuestionsForPage called with question:`, question, 'testId:', testId);
    
    const questionId = question.question_id;
    const savedAnswer = getTestProgress('input', testId, questionId);
    
    return `
        <div class="question-container ${savedAnswer ? 'answered' : ''}" data-question-id="${questionId}">
            <h4>Question ${question.question_id}</h4>
            <p class="question-text">${question.question}</p>
            <div class="input-question">
                <input type="text" 
                       id="input_${questionId}" 
                       placeholder="Enter your answer" 
                       value="${savedAnswer || ''}"
                       data-question-id="${questionId}">
            </div>
        </div>
    `;
}

// Set up event listeners for the test page
function setupTestPageEventListeners(testType, testId) {
    console.log(`[DEBUG] setupTestPageEventListeners called with testType: ${testType}, testId: ${testId}`);
    
    // Add event listeners for different question types
    if (testType === 'true_false' || testType === 'multiple_choice') {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        console.log(`[DEBUG] Found ${radioButtons.length} radio buttons for event listeners`);
        
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log(`[DEBUG] Radio button changed for question ${radio.dataset.questionId}, value: ${radio.value}`);
                updateProgressDisplayForPage(testType, testId);
                updateSubmitButtonStateForPage();
            });
        });
    } else if (testType === 'input') {
        const inputFields = document.querySelectorAll('input[type="text"]');
        console.log(`[DEBUG] Found ${inputFields.length} input fields for event listeners`);
        
        inputFields.forEach(input => {
            input.addEventListener('input', () => {
                console.log(`[DEBUG] Input field changed for question ${input.dataset.questionId}, value: ${input.value}`);
                updateProgressDisplayForPage(testType, testId);
                updateSubmitButtonStateForPage();
            });
        });
    } else if (testType === 'matching_type') {
        // Matching type tests now redirect to dedicated page
        console.log('[DEBUG] Matching type test - redirected to dedicated page');
    }
    
    console.log('[DEBUG] Test page event listeners setup completed');
}

// Set up progress tracking for the test page
function setupProgressTrackingForPage(testType, testId) {
    console.log(`[DEBUG] setupProgressTrackingForPage called with testType: ${testType}, testId: ${testId}`);
    
    // Set up interval to save progress
    const progressInterval = setInterval(() => {
        console.log('[DEBUG] Auto-saving progress...');
        saveProgressForPage(testType, testId);
    }, 30000); // Save every 30 seconds
    
    // Store interval ID for cleanup
    window.currentProgressInterval = progressInterval;
    
    console.log('[DEBUG] Progress tracking interval set up (30 seconds)');
}

// Update progress display for the test page
function updateProgressDisplayForPage(testType, testId) {
    console.log(`[DEBUG] updateProgressDisplayForPage called with testType: ${testType}, testId: ${testId}`);
    
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressBar || !progressText) {
        console.warn('[WARN] Progress elements not found');
        return;
    }
    
    // Get the total questions from the progress text (which was set correctly during page creation)
    const progressTextContent = progressText.textContent;
    const totalQuestionsMatch = progressTextContent.match(/\d+\s*\/\s*(\d+)/);
    const totalQuestions = totalQuestionsMatch ? parseInt(totalQuestionsMatch[1]) : 0;
    
    const answeredQuestions = getAnsweredQuestionsCountForPage(testType);
    
    console.log(`[DEBUG] Progress: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`[DEBUG] Total questions extracted from progress text: ${totalQuestions}`);
    
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${answeredQuestions} / ${totalQuestions} questions`;
    
    console.log(`[DEBUG] Progress bar updated: ${percentage}%`);
}

// Update submit button state for the test page
function updateSubmitButtonStateForPage() {
    console.log('[DEBUG] updateSubmitButtonStateForPage called');
    
    const submitButton = document.querySelector('.submit-test-btn');
    if (!submitButton) {
        console.warn('[WARN] Submit button not found');
        return;
    }
    
    // Get the total questions from the progress text (which was set correctly during page creation)
    const progressText = document.querySelector('.progress-text');
    const totalQuestions = progressText ? (() => {
        const progressTextContent = progressText.textContent;
        const totalQuestionsMatch = progressTextContent.match(/\d+\s*\/\s*(\d+)/);
        return totalQuestionsMatch ? parseInt(totalQuestionsMatch[1]) : 0;
    })() : 0;
    
    const answeredQuestions = getAnsweredQuestionsCountForPage(getCurrentTestType());
    
    console.log(`[DEBUG] Submit button state check: ${answeredQuestions}/${totalQuestions} questions answered`);
    console.log(`[DEBUG] Total questions extracted from progress text: ${totalQuestions}`);
    
    if (answeredQuestions === totalQuestions && totalQuestions > 0) {
        submitButton.disabled = false;
        console.log('[DEBUG] Submit button enabled - all questions answered');
    } else {
        submitButton.disabled = true;
        console.log('[DEBUG] Submit button disabled - not all questions answered');
    }
}

// Load saved progress for the test page
function loadSavedProgressForPage(testType, testId) {
    console.log(`[DEBUG] loadSavedProgressForPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const key = `test_progress_${testType}_${testId}`;
        const progress = JSON.parse(localStorage.getItem(key) || '{}');
        
        console.log('[DEBUG] Loaded progress from localStorage:', progress);
        
        if (Object.keys(progress).length === 0) {
            console.log('[DEBUG] No saved progress found');
            return;
        }
        
        // Update question containers with saved answers
        Object.keys(progress).forEach(questionId => {
            const answer = progress[questionId];
            console.log(`[DEBUG] Restoring answer for question ${questionId}: ${answer}`);
            
            if (testType === 'true_false' || testType === 'multiple_choice') {
                const radio = document.querySelector(`input[name="question_${questionId}"][value="${answer}"]`);
                if (radio) {
                    radio.checked = true;
                    console.log(`[DEBUG] Radio button checked for question ${questionId}`);
                }
            } else if (testType === 'input') {
                const input = document.querySelector(`input[data-question-id="${questionId}"]`);
                if (input) {
                    input.value = answer;
                    console.log(`[DEBUG] Input field populated for question ${questionId}`);
                }
            }
        });
        
        // Update progress display
        updateProgressDisplayForPage(testType, testId);
        updateSubmitButtonStateForPage();
        
        console.log('[DEBUG] Saved progress restored successfully');
    } catch (error) {
        console.error('[ERROR] Failed to load saved progress:', error);
    }
}

// Submit test from the test page
async function submitTestFromPage(testType, testId) {
    console.log(`[DEBUG] submitTestFromPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        // Check if all questions are answered
        // Get the total questions from the progress text (which was set correctly during page creation)
        const progressText = document.querySelector('.progress-text');
        const totalQuestions = progressText ? (() => {
            const progressTextContent = progressText.textContent;
            const totalQuestionsMatch = progressTextContent.match(/\d+\s*\/\s*(\d+)/);
            return totalQuestionsMatch ? parseInt(totalQuestionsMatch[1]) : 0;
        })() : 0;
        
        const answeredQuestions = getAnsweredQuestionsCountForPage(testType);
        
        console.log(`[DEBUG] Submission check: ${answeredQuestions}/${totalQuestions} questions answered`);
        console.log(`[DEBUG] Total questions extracted from progress text: ${totalQuestions}`);
        
        if (answeredQuestions < totalQuestions) {
            console.warn('[WARN] Not all questions answered, submission blocked');
            alert('Please answer all questions before submitting.');
            return;
        }
        
        // Disable submit button to prevent double submission
        const submitButton = document.querySelector('.submit-test-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            console.log('[DEBUG] Submit button disabled and text changed to "Submitting..."');
        }
        
        // Submit test
        const result = await submitTest(testType, testId);
        console.log('[DEBUG] Test submission result:', result);
        
        if (result.success) {
            console.log('[DEBUG] Test submitted successfully, navigating to results');
            
            // Clear progress
            clearTestProgress(testType, testId);
            
            // Clear progress interval
            if (window.currentProgressInterval) {
                clearInterval(window.currentProgressInterval);
                window.currentProgressInterval = null;
            }
            
            console.log('[DEBUG] Test submitted successfully, navigating to results');
            
            // Clear progress
            clearTestProgress(testType, testId);
            
            // Collect answers for results display
            const answers = collectTestAnswers(testType, testId);
            console.log('[DEBUG] Collected answers for results display:', answers);
            
            // Navigate to results page
            navigateToTestResults(testType, testId, answers);
        } else {
            console.error('[ERROR] Test submission failed:', result.error);
            alert('Failed to submit test: ' + (result.error || 'Unknown error'));
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Test';
            }
        }
    } catch (error) {
        console.error('[ERROR] Error in submitTestFromPage:', error);
        alert('Error submitting test: ' + error.message);
        
        // Re-enable submit button
        const submitButton = document.querySelector('.submit-test-btn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Test';
        }
    }
}

// Helper function to get answered questions count for the test page
function getAnsweredQuestionsCountForPage(testType) {
    console.log(`[DEBUG] getAnsweredQuestionsCountForPage called with testType: ${testType}`);
    
    let answeredCount = 0;
    
    if (testType === 'true_false' || testType === 'multiple_choice') {
        const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
        answeredCount = radioButtons.length;
        console.log(`[DEBUG] Found ${answeredCount} checked radio buttons`);
    } else if (testType === 'input') {
        const inputFields = document.querySelectorAll('input[type="text"]');
        inputFields.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                answeredCount++;
            }
        });
        console.log(`[DEBUG] Found ${answeredCount} filled input fields`);
    }
    
    return answeredCount;
}

// Helper function to get current test type
function getCurrentTestType() {
    console.log('[DEBUG] getCurrentTestType called');
    
    // Try to determine test type from current page
    const testPage = document.getElementById('test-page');
    if (testPage && testPage.style.display !== 'none') {
        // Look for clues in the DOM to determine test type
        if (document.querySelector('input[type="radio"]')) {
            console.log('[DEBUG] Detected test type: radio-based (true_false or multiple_choice)');
            return document.querySelector('input[type="radio"]').name.startsWith('question_') ? 'true_false' : 'multiple_choice';
        } else if (document.querySelector('input[type="text"]')) {
            console.log('[DEBUG] Detected test type: input');
            return 'input';
        } else if (document.querySelector('.matching-container')) {
            // This should never be reached - matching type tests redirect to dedicated page
            console.error('[ERROR] getCurrentTestType detected matching_type - this should not happen!');
            throw new Error('Matching type tests are handled by dedicated page, not main application');
        }
    }
    
    console.warn('[WARN] Could not determine current test type');
    return 'unknown';
}

// Helper function to save progress for the test page
function saveProgressForPage(testType, testId) {
    console.log(`[DEBUG] saveProgressForPage called with testType: ${testType}, testId: ${testId}`);
    
    try {
        const progress = {};
        
        if (testType === 'true_false' || testType === 'multiple_choice') {
            const radioButtons = document.querySelectorAll('input[type="radio"]:checked');
            radioButtons.forEach(radio => {
                const questionId = radio.dataset.questionId;
                if (questionId) {
                    progress[questionId] = radio.value;
                }
            });
        } else if (testType === 'input') {
            const inputFields = document.querySelectorAll('input[type="text"]');
            inputFields.forEach(input => {
                const questionId = input.dataset.questionId;
                if (questionId && input.value.trim() !== '') {
                    progress[questionId] = input.value;
                }
            });
        }
        
        const key = `test_progress_${testType}_${testId}`;
        localStorage.setItem(key, JSON.stringify(progress));
        console.log(`[DEBUG] Progress saved:`, progress);
    } catch (error) {
        console.error('[ERROR] Failed to save progress:', error);
    }
}

// Navigate to test results page
function navigateToTestResults(testType, testId, studentAnswers) {
    console.log(`[DEBUG] navigateToTestResults called with testType: ${testType}, testId: ${testId}, studentAnswers:`, studentAnswers);
    
    // Store current test info globally for use by clearTestDataAndReturnToCabinet
    window.currentTestType = testType;
    window.currentTestId = testId;
    
    // Hide all sections first
    hideTestSections();
    console.log('[DEBUG] All sections hidden');
    
    // Show test results page section
    const testResultsPage = document.getElementById('test-results-page');
    // Show test results page section using the proper showSection system
    showSection('test-results-page');
    console.log('[DEBUG] Test results page section displayed via showSection');

    // Load and display the test results
    loadTestResultsForPage(testType, testId, studentAnswers);
}

// Helper function to navigate back to cabinet
function navigateBackToCabinet() {
    console.log('[DEBUG] navigateBackToCabinet called');
    
    // Use the proper showSection system instead of direct DOM manipulation
    showSection('student-cabinet');
    console.log('[DEBUG] Student cabinet shown via showSection');
    
    // Reset navigation flag
    window.isNavigatingToTest = false;
    console.log('[DEBUG] Navigation flag reset');
}