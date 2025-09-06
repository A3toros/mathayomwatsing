// IMPORTS - Functions this module needs from shared modules
import { 
  showSection,
  showNotification,
  sendRequest
} from '../shared/index.js'

// EXPORTS - Student results functions
export {
  loadStudentTestResults,
  displayStudentTestResults
}

// Student - Results & History
// Functions: loadStudentTestResults, displayStudentTestResults

// TODO: Copy functions from script.js

// State variable to prevent multiple simultaneous calls
let isLoadingTestResults = false;

// Load test results for student
async function loadStudentTestResults() {
    // Prevent multiple simultaneous calls
    if (isLoadingTestResults) {
        console.log('loadStudentTestResults already in progress, skipping duplicate call');
        return;
    }
    
    isLoadingTestResults = true;
    console.log('loadStudentTestResults called - extracting studentId from JWT token');
    
    try {
        console.log('Fetching test results using JWT authentication...');
        
        const response = await window.tokenManager.makeAuthenticatedRequest(
            '/.netlify/functions/get-student-test-results'
        );
        
        console.log('Test results response received:', response);
        console.log('Test results response status:', response.status);
        
        const data = await response.json();
        console.log('Test results data:', data);
        
        if (data.success) {
            console.log('Successfully loaded test results, calling displayStudentTestResults');
            console.log('Raw results array length:', data.results.length);
            
            // Log each result for debugging
            data.results.forEach((result, index) => {
                console.log(`Result ${index + 1}:`, {
                    test_type: result.test_type,
                    test_id: result.test_id,
                    id: result.id,
                    student_id: result.student_id,
                    test_name: result.test_name,
                    subject: result.subject,
                    score: result.score,
                    max_score: result.max_score,
                    // Log all available fields
                    all_fields: Object.keys(result),
                    full_result: result
                });
            });
            
            displayStudentTestResults(data.results);
        } else {
            console.error('Error loading student test results:', data.error);
        }
    } catch (error) {
        console.error('Error loading student test results:', error);
    } finally {
        isLoadingTestResults = false;
    }
}

// Display test results for student
function displayStudentTestResults(results) {
    console.log('displayStudentTestResults called with results:', results);
    console.log('Results array type:', Array.isArray(results));
    console.log('Results array length:', results.length);
    
    const container = document.getElementById('studentTestResults');
    if (!container) {
        console.error('studentTestResults container not found');
        return;
    }
    
    console.log('Test results container found, results length:', results.length);
    console.log('Container current content length:', container.innerHTML.length);
    
    // Clear the container first to prevent duplication
    container.innerHTML = '';
    console.log('Container cleared, new content length:', container.innerHTML.length);
    
    if (results.length === 0) {
        console.log('No test results found, showing "no results" message');
        container.innerHTML = '<p>No test results available yet.</p>';
        return;
    }
    
    // Deduplicate results based on unique combination of test_type, test_id, and student_id
    const uniqueResults = [];
    const seenKeys = new Set();
    
    console.log('Starting deduplication process...');
    results.forEach((result, index) => {
        // Create a unique key for each test result
        // Use test_id if available, otherwise fall back to id or test_name
        const testId = result.test_id || result.id || result.test_name;
        const studentId = result.student_id || 'unknown';
        
        const uniqueKey = `${result.test_type}_${testId}_${studentId}`;
        
        console.log(`Processing result ${index + 1}:`, {
            uniqueKey,
            test_type: result.test_type,
            test_id: result.test_id,
            id: result.id,
            student_id: result.student_id,
            test_name: result.test_name,
            score: result.score,
            max_score: result.max_score
        });
        
        if (!seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            uniqueResults.push(result);
            console.log(`✅ Added unique result: ${uniqueKey}`);
        } else {
            console.log(`❌ Duplicate result found and removed: ${uniqueKey}`, result);
        }
    });
    
    console.log('After deduplication, unique results count:', uniqueResults.length);
    console.log('Unique keys found:', Array.from(seenKeys));
    
    // Group results by subject, semester, and term
    const groupedResults = {};
    
    uniqueResults.forEach(result => {
        const subject = result.subject || 'Unknown Subject';
        const semester = result.semester || 'Unknown';
        const term = result.term || 'Unknown';
        
        const key = `${subject}_${semester}_${term}`;
        
        if (!groupedResults[key]) {
            groupedResults[key] = {
                subject: subject,
                semester: semester,
                term: term,
                results: []
            };
        }
        
        groupedResults[key].results.push(result);
    });
    
    // Convert to array and sort
    const sortedGroups = Object.values(groupedResults).sort((a, b) => {
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.term - b.term;
    });
    
    let html = '<div class="test-results-tables">';
    
    sortedGroups.forEach(group => {
        html += `
            <div class="results-group">
                <div class="table-container">
                    <table class="test-results-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Teacher</th>
                                <th>Test Name</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        group.results.forEach(result => {
            const teacherName = result.teacher_name || 'Unknown';
            const scoreClass = result.score_percentage >= 80 ? 'success' : 
                              result.score_percentage >= 60 ? 'warning' : 'danger';
            
            html += `
                <tr class="result-row ${scoreClass}">
                    <td data-label="Subject">${group.subject}</td>
                    <td data-label="Teacher">${teacherName}</td>
                    <td data-label="Test Name">${result.test_name}</td>
                    <td class="score-cell" data-label="Score">${result.score}/${result.max_score}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    console.log('Final HTML content length:', container.innerHTML.length);
    console.log('Display function completed successfully');
}