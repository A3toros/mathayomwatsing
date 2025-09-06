// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  getCurrentTeacherId,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Results and analytics functions
export {
  initializeGradeButtons,
  showClassesForGrade,
  showSemestersForClass,
  determineAndOpenCurrentSemester,
  loadClassResults,
  displayClassResults,
  getScoreClass,
  createResultsTable
}

// Teacher - Results & Analytics
// Functions: initializeGradeButtons, showClassesForGrade, showSemestersForClass, determineAndOpenCurrentSemester, 
// loadClassResults, displayClassResults, getScoreClass, createResultsTable

// TODO: Copy functions from script.js
// Initialize grade buttons functionality - only show grades where teacher has subjects
async function initializeGradeButtons() {
    console.log('Initializing grade buttons...');
    const gradeButtons = document.querySelectorAll('.grade-btn');
    console.log('Found grade buttons:', gradeButtons.length);
    
    if (gradeButtons.length === 0) {
        console.error('No grade buttons found! This means the main cabinet is not visible or the buttons are not rendered.');
        console.log('Current page structure:');
        console.log('main-cabinet-container:', document.getElementById('main-cabinet-container'));
        console.log('grade-buttons:', document.querySelector('.grade-buttons'));
        return;
    }
    
    try {
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-teacher-assignments'
        );
        const data = await response.json();
        
        if (data.success) {
            const assignedGrades = data.assignments;
            console.log('Teacher assigned grades/classes:', assignedGrades);
            
            // Hide/show grade buttons based on assignments
            gradeButtons.forEach(button => {
                const gradeNum = button.dataset.grade; // "1", "2", "3", etc.
                const gradeDisplay = `M${gradeNum}`;   // "M1", "M2", "M3", etc.
                
                const hasAssignments = assignedGrades.some(assignment => 
                    assignment.gradeDisplay === gradeDisplay
                );
                
                console.log(`Checking grade ${gradeNum} (${gradeDisplay}) - hasAssignments:`, hasAssignments);
                
                if (hasAssignments) {
                    button.style.display = 'block';
                    console.log('✅ Showing grade button:', button.textContent, 'with data-grade:', gradeNum);
                    button.addEventListener('click', () => {
                        // Check if we're in test creation mode
                        if (window.isInTestCreation) {
                            console.log('🔍 Grade button click blocked - currently in test creation mode');
                            return;
                        }
                        
                        console.log('Grade button clicked:', button.textContent, 'grade:', button.dataset.grade);
                        showClassesForGrade(button.dataset.grade, assignedGrades);
                    });
                } else {
                    button.style.display = 'none';
                    console.log('❌ Hiding grade button:', button.textContent, '- no assignments');
                }
            });
        } else {
            console.error('Failed to get teacher assignments:', data.message);
        }
    } catch (error) {
        console.error('Error fetching teacher assignments:', error);
    }
}

// Show classes for selected grade - only show classes where teacher has subjects
async function showClassesForGrade(grade, assignments = null) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showClassesForGrade, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    // Check if we're in test creation mode
    if (window.isInTestCreation) {
        console.log('🔍 showClassesForGrade blocked - currently in test creation mode');
        return;
    }
    
    console.log('showClassesForGrade called with grade:', grade);
    
    // Convert grade to number for comparison
    const gradeNum = parseInt(grade);
    console.log('Converted grade to number:', gradeNum);
    
    const classButtons = document.getElementById('classButtons');
    const semesterButtons = document.getElementById('semesterButtons');
    
    console.log('classButtons element:', classButtons);
    console.log('semesterButtons element:', semesterButtons);
    
    if (!classButtons) {
        console.error('classButtons element not found!');
        return;
    }
    
    // Clear previous content
    classButtons.innerHTML = '';
    semesterButtons.innerHTML = '';
    const resultsTables = document.getElementById('resultsTables');
    if (resultsTables) {
        resultsTables.innerHTML = '';
    }
    
    // Show class buttons
    classButtons.style.display = 'block';
    console.log('Class buttons display set to block');
    
    // If we have assignments data, use it to filter classes
    let classes = [];
    if (assignments) {
        // Filter assignments for this specific grade
        const gradeAssignments = assignments.filter(assignment => 
            assignment.gradeDisplay === `M${gradeNum}`
        );
        
        // Extract unique class numbers for this grade
        classes = [...new Set(gradeAssignments.map(assignment => assignment.class))];
        console.log(`Found ${classes.length} assigned classes for grade ${gradeNum}:`, classes);
    } else {
        // Fallback to hardcoded classes if no assignments data
        if (gradeNum === 1 || gradeNum === 2) {
            classes = ['15', '16'];
        } else if (gradeNum === 3) {
            classes = ['15', '16'];
        } else if (gradeNum === 4) {
            classes = ['13', '14'];
        } else if (gradeNum === 5 || gradeNum === 6) {
            classes = ['13', '14'];
        }
        console.log(`Using fallback classes for grade ${gradeNum}:`, classes);
    }
    
    // Sort classes numerically to ensure proper order (lesser class on left)
    classes.sort((a, b) => parseInt(a) - parseInt(b));
    console.log(`Sorted classes for grade ${gradeNum}:`, classes);
    
    if (classes.length === 0) {
        console.log(`No classes found for grade ${gradeNum}`);
        classButtons.innerHTML = '<p class="no-classes">No classes assigned for this grade</p>';
        return;
    }
    
    console.log('Creating class buttons for grade', gradeNum, 'with classes:', classes);
    
    classes.forEach(classNum => {
        const classBtn = document.createElement('button');
        classBtn.className = 'class-btn small-btn';
        classBtn.textContent = `${gradeNum}/${classNum}`;
        classBtn.dataset.grade = `M${gradeNum}`; // Use proper grade format (M1, M2, M3)
        classBtn.dataset.class = `${gradeNum}/${classNum}`; // Use proper class format (1/15, 1/16)
        classBtn.addEventListener('click', () => {
            console.log('Class button clicked:', `${gradeNum}/${classNum}`);
            
            // Check if this button is already active
            if (classBtn.classList.contains('active')) {
                // Button is already active, deselect it
                classBtn.classList.remove('active');
                // Hide semester buttons and results
                document.getElementById('semesterButtons').style.display = 'none';
                document.getElementById('resultsTables').innerHTML = '';
                console.log('Class button deselected');
                return;
            }
            
            // Remove active class from all class buttons
            document.querySelectorAll('.class-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            classBtn.classList.add('active');
            
            showSemestersForClass(`M${gradeNum}`, `${gradeNum}/${classNum}`);
        });
        classButtons.appendChild(classBtn);
        console.log('Created class button:', `${gradeNum}/${classNum}`);
    });
    
    console.log('Total class buttons created:', classButtons.children.length);
}

// Show semesters for selected class
async function showSemestersForClass(grade, classNum) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in showSemestersForClass, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('showSemestersForClass called with:', { grade, classNum });
    
    const semesterButtons = document.getElementById('semesterButtons');
    
    // Clear previous content
    semesterButtons.innerHTML = '';
    document.getElementById('resultsTables').innerHTML = '';
    
    // Show semester buttons
    semesterButtons.style.display = 'block';
    
    // Create semester buttons
    for (let semester = 1; semester <= 2; semester++) {
        const semesterBtn = document.createElement('button');
        semesterBtn.className = 'semester-btn small-btn';
        semesterBtn.textContent = `Semester ${semester}`;
        semesterBtn.dataset.semester = semester;
        semesterBtn.dataset.grade = grade;
        semesterBtn.dataset.class = classNum;
        semesterBtn.addEventListener('click', () => {
            // Check if we're in test creation mode
            if (window.isInTestCreation) {
                console.log('🔍 Semester button click blocked - currently in test creation mode');
                return;
            }
            
            console.log('Semester button clicked:', { semester, grade, classNum });
            
            // Check if this button is already active
            if (semesterBtn.classList.contains('active')) {
                // Button is already active, deselect it
                semesterBtn.classList.remove('active');
                // Clear results
                document.getElementById('resultsTables').innerHTML = '';
                console.log('Semester button deselected');
                return;
            }
            
            // Remove active class from all semester buttons
            document.querySelectorAll('.semester-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            semesterBtn.classList.add('active');
            
            console.log('About to call loadClassResults with:', { grade, classNum, semester });
            loadClassResults(grade, classNum, semester);
        });
        semesterButtons.appendChild(semesterBtn);
    }
    
    // Automatically determine and open current semester
    determineAndOpenCurrentSemester(grade, classNum);
}

// Determine and automatically open the current semester based on academic year
async function determineAndOpenCurrentSemester(grade, classNum) {
    // Check if user session is still valid using JWT
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
        console.error('No valid teacher session found in determineAndOpenCurrentSemester, redirecting to login');
        // Redirect to login
        showSection('login-section');
        return;
    }
    
    console.log('determineAndOpenCurrentSemester called with:', { grade, classNum });
    
    try {
        // Get current academic year information
        const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/get-academic-year');
        const data = await response.json();
        
        if (data.success && data.academic_years && data.academic_years.length > 0) {
            // Get current date
            const currentDate = new Date();
            console.log('Current date:', currentDate);
            
            // Find the current academic period
            let currentSemester = 1; // Default to semester 1
            let currentPeriod = null;
            
            for (const period of data.academic_years) {
                const startDate = new Date(period.start_date);
                const endDate = new Date(period.end_date);
                
                console.log('Checking period:', {
                    id: period.id,
                    academic_year: period.academic_year,
                    semester: period.semester,
                    start_date: startDate,
                    end_date: endDate,
                    current_date: currentDate
                });
                
                // Check if current date falls within this period
                if (currentDate >= startDate && currentDate <= endDate) {
                    currentPeriod = period;
                    currentSemester = period.semester;
                    console.log('Found current period:', currentPeriod);
                    break;
                }
            }
            
            if (currentPeriod) {
                console.log('Current academic period found:', currentPeriod);
                console.log('Current semester:', currentSemester);
                
                // Find and activate the corresponding semester button
                const semesterButtons = document.querySelectorAll('.semester-btn');
                let targetButton = null;
                
                for (const button of semesterButtons) {
                    if (parseInt(button.dataset.semester) === currentSemester) {
                        targetButton = button;
                        break;
                    }
                }
                
                if (targetButton) {
                    console.log('Found target semester button:', targetButton);
                    
                    // Remove active class from all semester buttons
                    document.querySelectorAll('.semester-btn').forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to current semester button
                    targetButton.classList.add('active');
                    
                    // Automatically load results for current semester
                    console.log('Automatically loading results for current semester:', currentSemester);
                    await loadClassResults(grade, classNum, currentSemester);
                    
                } else {
                    console.log('Target semester button not found for semester:', currentSemester);
                }
            } else {
                console.log('No current academic period found, using default semester 1');
                // If no current period found, default to semester 1
                const semesterButtons = document.querySelectorAll('.semester-btn');
                if (semesterButtons.length > 0) {
                    const firstButton = semesterButtons[0];
                    firstButton.classList.add('active');
                    await loadClassResults(grade, classNum, 1);
                }
            }
        } else {
            console.log('Failed to get academic year data, using default semester 1');
            // Fallback to semester 1 if API fails
            const semesterButtons = document.querySelectorAll('.semester-btn');
            if (semesterButtons.length > 0) {
                const firstButton = semesterButtons[0];
                firstButton.classList.add('active');
                await loadClassResults(grade, classNum, 1);
            }
        }
    } catch (error) {
        console.error('Error determining current semester:', error);
        // Fallback to semester 1 if there's an error
        const semesterButtons = document.querySelectorAll('.semester-btn');
        if (semesterButtons.length > 0) {
            const firstButton = semesterButtons[0];
            firstButton.classList.add('active');
            await loadClassResults(grade, classNum, 1);
        }
    }
}

// Load class results for selected semester
async function loadClassResults(grade, classNum, semester) {
    console.log('loadClassResults called with:', { grade, classNum, semester });
    
    try {
        const url = `/.netlify/functions/get-class-results?grade=${grade}&class=${classNum}&semester=${semester}`;
        console.log('Fetching from URL:', url);
        
        const response = await window.tokenManager.makeAuthenticatedRequest(url);
        console.log('Response received:', response);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('Calling displayClassResults with results:', data.results);
            displayClassResults(data.results, grade, classNum, semester);
        } else {
            console.log('API returned success: false, showing no results message');
            document.getElementById('resultsTables').innerHTML = '<p>No results available for this class and semester.</p>';
        }
    } catch (error) {
        console.error('Error loading class results:', error);
        document.getElementById('resultsTables').innerHTML = '<p>Error loading results.</p>';
    }
}

// Display class results
function displayClassResults(results, grade, classNum, semester) {
    console.log('displayClassResults called with:', { results, grade, classNum, semester });
    
    const resultsContainer = document.getElementById('resultsTables');
    console.log('resultsContainer element:', resultsContainer);
    
    if (!resultsContainer) {
        console.error('resultsTables not found!');
        return;
    }
    
    // Clear container and add header
    resultsContainer.innerHTML = '';
    
    const header = document.createElement('h3');
    header.textContent = `${grade} ${classNum} - Test Results (Semester ${semester})`;
    console.log('Created header with text:', header.textContent);
    resultsContainer.appendChild(header);
    
    // Check if results is empty object or has no data
    if (!results || typeof results !== 'object' || Object.keys(results).length === 0) {
        resultsContainer.innerHTML += '<p>No test results available for this class and semester.</p>';
        console.log('Added no results message - no data available');
        return;
    }
    
    console.log('Results structure:', results);
    console.log('Results keys:', Object.keys(results));
    
    // Create separate tables for each subject
    if (results.subjects && Array.isArray(results.subjects) && results.subjects.length > 0) {
        console.log(`Creating tables for ${results.subjects.length} subjects:`, results.subjects);
        
        results.subjects.forEach(subject => {
            console.log(`Processing subject: ${subject.subject}`);
            
            // Create subject header
            const subjectHeader = document.createElement('h4');
            subjectHeader.className = 'subject-header';
            subjectHeader.textContent = `Subject: ${subject.subject}`;
            resultsContainer.appendChild(subjectHeader);
            
            // Get results for this specific subject
            const subjectResults = results[subject.subject] || [];
            console.log(`Found ${subjectResults.length} results for subject ${subject.subject}:`, subjectResults);
            
            if (subjectResults.length > 0) {
                // Extract ALL tests that belong to this subject (across all students)
                const subjectTests = [];
                const allTestKeys = new Set(); // Use Set to avoid duplicates

                // Collect test keys from ALL students with results
                subjectResults.forEach(student => {
                    if (student.has_results) {
                        Object.keys(student).forEach(key => {
                            if (!['student_id', 'name', 'surname', 'nickname', 'number', 'has_results', 'subject'].includes(key)) {
                                allTestKeys.add(key); // Add to Set to avoid duplicates
                            }
                        });
                    }
                });

                // Convert Set back to array with proper structure
                allTestKeys.forEach(testKey => {
                    subjectTests.push({
                        test_name: testKey,
                        test_type: 'unknown',
                        key: testKey
                    });
                });

                console.log(`[DEBUG] Enhanced test discovery for subject ${subject.subject}:`, subjectTests);
                console.log(`[DEBUG] Subject tests count:`, subjectTests.length);
                
                console.log(`Subject ${subject.subject} has ${subjectTests.length} tests:`, subjectTests);
                
                const table = createResultsTable(subject.subject, subjectResults, subjectTests);
                resultsContainer.appendChild(table);
            } else {
                const noResultsMsg = document.createElement('p');
                noResultsMsg.textContent = `No test results available for ${subject.subject}`;
                noResultsMsg.className = 'no-results-message';
                resultsContainer.appendChild(noResultsMsg);
            }
            
            // Add spacing between subjects
            if (subject !== results.subjects[results.subjects.length - 1]) {
                const spacer = document.createElement('div');
                spacer.className = 'subject-spacer';
                spacer.style.height = '2rem';
                resultsContainer.appendChild(spacer);
            }
        });
    } else if (results.class && Array.isArray(results.class)) {
        // Fallback: single table for all subjects combined
        const classResults = results.class;
        console.log(`Creating fallback table for class with ${classResults.length} students:`, classResults);
        
        if (classResults.length > 0) {
            const subjectName = classResults[0].subject || 'All Subjects';
            console.log(`Creating table for: ${subjectName}`);
            
            const table = createResultsTable(subjectName, classResults, results.unique_tests || []);
            resultsContainer.appendChild(table);
        }
    } else {
        console.log('No class results found in expected format');
    }
    
    console.log('Finished creating all tables');
}

// Helper function to determine score class for styling
function getScoreClass(score, maxScore) {
    if (score === null || maxScore === null) return '';
    
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
}

// Create results table
function createResultsTable(subject, students, uniqueTests = []) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'results-table';
    
    const tableTitle = document.createElement('h3');
    tableTitle.textContent = subject;
    tableContainer.appendChild(tableTitle);
    
    // Add subjects info if it's "All Subjects"
    if (subject === 'All Subjects') {
        const subjectsInfo = document.createElement('p');
        subjectsInfo.className = 'subjects-info';
        subjectsInfo.textContent = 'Combined results from all assigned subjects';
        subjectsInfo.style.cssText = 'color: #6c757d; font-size: 0.9rem; margin: 0.5rem 0; font-style: italic;';
        tableContainer.appendChild(subjectsInfo);
    }
    
    const table = document.createElement('table');
    
    // Create dynamic table headers
    let headerRow = `
        <thead>
            <tr>
                <th>Number</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
    `;
    
    // Add test columns
    if (uniqueTests && uniqueTests.length > 0) {
        uniqueTests.forEach(test => {
            headerRow += `<th>${test.test_name}</th>`;
        });
    } else {
        // No tests available
        headerRow += `<th>No Tests Available</th>`;
    }
    
    headerRow += `
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    table.innerHTML = headerRow;
    
    const tbody = table.querySelector('tbody');
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Base student info
        let rowHtml = `
            <td data-label="Number">${student.number}</td>
            <td data-label="Student ID">${student.student_id}</td>
            <td data-label="Name">${student.name}</td>
            <td data-label="Surname">${student.surname}</td>
            <td data-label="Nickname">${student.nickname}</td>
        `;
        
        // Add test result columns
        if (uniqueTests && uniqueTests.length > 0) {
            uniqueTests.forEach(test => {
                const testResult = student[test.key];
                if (testResult) {
                    // Student has result for this test
                    const [score, maxScore] = testResult.split('/');
                    const scoreClass = getScoreClass(parseInt(score), parseInt(maxScore));
                    row.className = `result-row ${scoreClass}`;
                    rowHtml += `<td class="score-cell" data-label="${test.test_name}">${testResult}</td>`;
                } else {
                    // Student has no result for this test
                    if (!row.className) row.className = 'result-row no-results';
                    rowHtml += `<td class="score-cell" data-label="${test.test_name}">-</td>`;
                }
            });
        } else {
            // No tests available
            rowHtml += `<td class="score-cell" data-label="No Tests Available">-</td>`;
        }
        
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    });
    
    tableContainer.appendChild(table);
    return tableContainer;
}