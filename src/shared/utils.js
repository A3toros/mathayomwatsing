// IMPORTS - Functions this module needs from other shared modules
import { showNotification } from './ui.js'

// EXPORTS - All utility functions
export {
  sendRequest,
  isAnswerCorrect,
  calculateScore,
  validateAnswer,
  transformAnswersForSubmission,
  calculateTestScore,
  checkAnswerCorrectness,
  clearAllLocalStorage,
  exportLocalStorage
}

// ORIGINAL PLAN:
// Utilities & Validation Functions
// Functions: sendRequest, isAnswerCorrect, calculateScore, validateAnswer, transformAnswersForSubmission, calculateTestScore

// 🔥 CORRECTED AFTER CROSS-REFERENCE ANALYSIS:
// Core Utilities (ALL ROLES)
// Functions: sendRequest ⭐(100+ calls!), isAnswerCorrect ⬅️ MOVED FROM STUDENT, calculateScore ⭐(2 calls) ⬅️ MOVED FROM STUDENT, 
// validateAnswer ⬅️ MOVED FROM STUDENT, transformAnswersForSubmission ⬅️ MOVED FROM STUDENT, calculateTestScore ⬅️ MOVED FROM STUDENT,
// clearAllLocalStorage ⬅️ MOVED FROM DEBUG (utility, not debug!), exportLocalStorage ⬅️ MOVED FROM DEBUG (utility, not debug!)

// TODO: Copy functions from script.js

// Enhanced Local Storage Functions (MOVED FROM debug.js - these are utility functions, not debug functions!)
function clearAllLocalStorage() {
    if (confirm('Are you sure you want to clear all local storage? This cannot be undone.')) {
      localStorage.clear();
      showNotification('All local storage cleared!', 'success');
    }
}

function exportLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localStorage_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Local storage exported!', 'success');
}

async function sendRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response;
    } catch (error) {
        console.error('❌ Network error:', error);
        throw error;
    }
}

function isAnswerCorrect(questionId, userAnswer, correctAnswers) {
    console.log(`Checking answer for question ${questionId}: ${userAnswer}`);
    const correctAnswer = correctAnswers[questionId];
    return userAnswer === correctAnswer;
}

function calculateScore(answers, correctAnswers) {
    let score = 0;
    for (const questionId in answers) {
        if (isAnswerCorrect(questionId, answers[questionId], correctAnswers)) {
            score++;
        }
    }
    return score;
}

function validateAnswer(questionId, userAnswer, correctAnswers) {
    return isAnswerCorrect(questionId, userAnswer, correctAnswers);
}

function transformAnswersForSubmission(answers, testType) {
    // Transform answers based on test type
    switch (testType) {
        case 'multiple_choice':
            return answers;
        case 'true_false':
            return answers;
        case 'input':
            return answers;
        case 'matching':
            return answers;
        default:
            return answers;
    }
}

function checkAnswerCorrectness(question, studentAnswer, testType) {
    console.log(`[DEBUG] checkAnswerCorrectness called for question:`, question, 'studentAnswer:', studentAnswer, 'testType:', testType);
    
    if (!studentAnswer || studentAnswer === '') {
        console.log('[DEBUG] No student answer provided');
        return false;
    }
    
    let isCorrect = false;
    
    switch (testType) {
        case 'true_false':
            // Convert string answer to boolean for comparison
            const booleanAnswer = studentAnswer === 'true';
            isCorrect = booleanAnswer === question.correct_answer;
            break;
        case 'multiple_choice':
            // Convert integer answer to letter for comparison with database
            const letterAnswer = String.fromCharCode(65 + parseInt(studentAnswer)); // 0→A, 1→B, 2→C
            isCorrect = letterAnswer === question.correct_answer;
            break;
        case 'input':
            // For grouped questions, check against all correct answers
            if (question.correct_answers && Array.isArray(question.correct_answers)) {
                isCorrect = question.correct_answers.some(correctAnswer => 
                    studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
                );
            } else {
                // Fallback for old format - use correct_answer (not correctAnswer)
                isCorrect = studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
            }
            break;
            
        default:
            console.warn(`[WARN] Unknown test type for answer checking: ${testType}`);
            isCorrect = false;
    }
    
    console.log(`[DEBUG] Answer correctness: ${isCorrect}`);
    return isCorrect;
}

function calculateTestScore(questions, answers, testType) {
    console.log(`[DEBUG] calculateTestScore called with ${questions.length} questions, testType: ${testType}`);
    
    let score = 0;
    
    questions.forEach((question, index) => {
        // Use question_id consistently
        const questionId = question.question_id;
        const studentAnswer = answers[questionId];
        const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
        
        if (isCorrect) {
            score++;
        }
        
        console.log(`[DEBUG] Question ${questionId}: answer=${studentAnswer}, correct=${isCorrect}, running score=${score}`);
    });
    
    console.log(`[DEBUG] Final test score: ${score}/${questions.length}`);
    return score;
}