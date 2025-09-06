// IMPORTS - Functions this module needs from other shared modules
// (No imports needed for form-state functions)

// EXPORTS - All form state management functions
export {
  waitForElements,
  checkMultipleChoiceElements,
  checkTrueFalseElements,
  checkInputElements,
  restoreMultipleChoiceData,
  restoreTrueFalseData,
  restoreInputData
}

// Form State Management Functions
// Functions: waitForElements, checkMultipleChoiceElements, checkTrueFalseElements, checkInputElements, 
// restoreMultipleChoiceData, restoreTrueFalseData, restoreInputData

// TODO: Copy functions from script.js
function waitForElements(formType, formData, callback) {
    console.log(`🔍 waitForElements called for ${formType} form`);
    
    const maxAttempts = 50; // Maximum attempts (5 seconds with 100ms intervals)
    let attempts = 0;
    
    const checkElements = () => {
        attempts++;
        console.log(`🔍 Checking elements (attempt ${attempts}/${maxAttempts})`);
        
        let allElementsReady = false;
        
        switch (formType) {
            case 'multipleChoice':
                allElementsReady = checkMultipleChoiceElements(formData);
                break;
            case 'trueFalse':
                allElementsReady = checkTrueFalseElements(formData);
                break;
            case 'input':
                allElementsReady = checkInputElements(formData);
                break;
        }
        
        if (allElementsReady) {
            console.log(`✅ All ${formType} elements are ready!`);
            callback();
        } else if (attempts >= maxAttempts) {
            console.error(`❌ Timeout waiting for ${formType} elements after ${maxAttempts} attempts`);
            // Still try to restore data even if timeout
            callback();
        } else {
            // Try again in 100ms
            setTimeout(checkElements, 100);
        }
    };
    
    // Start checking
    checkElements();
}

function checkMultipleChoiceElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    const numOptions = parseInt(formData.numOptions);
    
    // Check if container exists
    const container = document.getElementById('mcQuestionsContainer');
    if (!container) {
        console.log('❌ mcQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`mc_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if all option elements exist
        for (let j = 0; j < numOptions; j++) {
            const optionLetter = String.fromCharCode(65 + j); // A, B, C, etc.
            const optionEl = document.getElementById(`mc_option_${i}_${optionLetter}`);
            if (!optionEl) {
                console.log(`❌ Option element ${i}_${optionLetter} not found`);
                return false;
            }
        }
        
        // Check if correct answer select exists
        const correctEl = document.getElementById(`mc_correct_${i}`);
        if (!correctEl) {
            console.log(`❌ Correct answer element ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} multiple choice questions with ${numOptions} options are ready`);
    return true;
}

function checkTrueFalseElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    
    // Check if container exists
    const container = document.getElementById('tfQuestionsContainer');
    if (!container) {
        console.log('❌ tfQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`tf_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if correct answer select exists
        const correctEl = document.getElementById(`tf_correct_${i}`);
        if (!correctEl) {
            console.log(`❌ Correct answer element ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} true/false questions are ready`);
    return true;
}

/**
 * Check if all input form elements are ready
 */
function checkInputElements(formData) {
    const numQuestions = parseInt(formData.numQuestions);
    
    // Check if container exists
    const container = document.getElementById('inputQuestionsContainer');
    if (!container) {
        console.log('❌ inputQuestionsContainer not found');
        return false;
    }
    
    // Check if all question elements exist
    for (let i = 1; i <= numQuestions; i++) {
        const questionEl = document.getElementById(`input_question_${i}`);
        if (!questionEl) {
            console.log(`❌ Question element ${i} not found`);
            return false;
        }
        
        // Check if answers container exists
        const answersContainer = document.getElementById(`answers_container_${i}`);
        if (!answersContainer) {
            console.log(`❌ Answers container ${i} not found`);
            return false;
        }
    }
    
    console.log(`✅ All ${numQuestions} input questions are ready`);
    return true;
}

/**
 * Restore multiple choice form data
 */
function restoreMultipleChoiceData(formData) {
    console.log('🔍 restoreMultipleChoiceData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`mc_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore options
        if (qData.options) {
            Object.keys(qData.options).forEach(optionKey => {
                const optionEl = document.getElementById(`mc_option_${questionNum}_${optionKey}`);
                if (optionEl) {
                    optionEl.value = qData.options[optionKey];
                    console.log(`✅ Set option ${questionNum}_${optionKey} to:`, qData.options[optionKey]);
                }
            });
        }
        
        // Restore correct answer
        const correctEl = document.getElementById(`mc_correct_${questionNum}`);
        if (correctEl && qData.correctAnswer) {
            correctEl.value = qData.correctAnswer;
            console.log(`✅ Set correct answer for question ${questionNum} to:`, qData.correctAnswer);
        }
    });
    
    console.log('✅ Finished restoring multiple choice data');
}

/**
 * Restore true/false form data
 */
function restoreTrueFalseData(formData) {
    console.log('🔍 restoreTrueFalseData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`tf_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore correct answer (select)
        const correctEl = document.getElementById(`tf_correct_${questionNum}`);
        if (correctEl && qData.correctAnswer) {
            correctEl.value = qData.correctAnswer;
            console.log(`✅ Set correct answer for question ${questionNum} to:`, qData.correctAnswer);
        }
    });
    
    console.log('✅ Finished restoring true/false data');
}

/**
 * Restore input form data
 */
function restoreInputData(formData) {
    console.log('🔍 restoreInputData called with:', formData);
    
    Object.keys(formData.questions).forEach(questionNum => {
        const qData = formData.questions[questionNum];
        console.log(`🔍 Restoring question ${questionNum}:`, qData);
        
        const questionEl = document.getElementById(`input_question_${questionNum}`);
        if (questionEl) {
            questionEl.value = qData.question;
            console.log(`✅ Set question ${questionNum} to:`, qData.question);
        }
        
        // Restore answers
        if (qData.answers && qData.answers.length > 0) {
            const answersContainer = document.getElementById(`answers_container_${questionNum}`);
            if (answersContainer) {
                // Remove the default single answer input
                answersContainer.innerHTML = '';
                
                // Create answer inputs for each stored answer
                qData.answers.forEach((answer, answerIndex) => {
                    const answerGroup = document.createElement('div');
                    answerGroup.className = 'answer-input-group';
                    answerGroup.innerHTML = `
                        <input type="text" placeholder="Correct answer ${answerIndex + 1}" class="answer-input" data-question-id="${questionNum}" data-answer-index="${answerIndex}" value="${answer}">
                        <button type="button" class="btn btn-sm btn-outline-danger remove-answer-btn">- Remove</button>
                    `;
                    answersContainer.appendChild(answerGroup);
                });
                
                // Add the "Add Answer" button at the end
                const addButton = document.createElement('div');
                addButton.className = 'answer-input-group';
                addButton.innerHTML = `
                    <button type="button" class="btn btn-sm btn-outline-primary add-answer-btn">+ Add Answer</button>
                `;
                answersContainer.appendChild(addButton);
                
                console.log(`✅ Restored ${qData.answers.length} answers for question ${questionNum}`);
            }
        }
    });
    
    console.log('✅ Finished restoring input data');
}