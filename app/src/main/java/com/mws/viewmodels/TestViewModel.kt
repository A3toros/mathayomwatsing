package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.database.AppDatabase
import com.mws.models.*
import com.mws.repository.TestRepository
import com.mws.services.SecurityService
import com.mws.testlogic.TestProcessor
import kotlinx.coroutines.launch
import java.util.*

class TestViewModel(
    private val repository: TestRepository,
    private val securityService: SecurityService
) : ViewModel() {
    
    // UI State
    private val _testQuestions = MutableLiveData<List<Question>>()
    val testQuestions: LiveData<List<Question>> = _testQuestions
    
    private val _testInfo = MutableLiveData<TestInfo>()
    val testInfo: LiveData<TestInfo> = _testInfo
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    private val _testCompleted = MutableLiveData<Boolean>()
    val testCompleted: LiveData<Boolean> = _testCompleted
    
    // Test State
    private var currentTestId: String? = null
    private var currentTestType: String? = null
    private var originalQuestions: List<Question> = emptyList()
    private var studentAnswers: MutableMap<String, Any> = mutableMapOf()
    private var localToken: String = ""
    
    /**
     * Load test questions from API and process locally
     * This maintains backend compatibility while enabling local processing
     */
    fun loadTest(testId: String, testType: String) {
        currentTestId = testId
        currentTestType = testType
        localToken = TestProcessor.generateLocalToken()
        
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            repository.getTestQuestions(testId, testType)
                .onSuccess { response ->
                    if (response.questions != null && response.test_info != null) {
                        // Store original data for reference
                        originalQuestions = response.questions
                        _testInfo.value = response.test_info
                        
                        // Process questions locally
                        processQuestionsLocally(response.questions, response.test_info.type)
                        
                        // Start security monitoring
                        securityService.startTestProtection(testId, testType)
                    } else {
                        _error.value = "No questions found for this test"
                    }
                }
                .onFailure { exception ->
                    _error.value = exception.message ?: "Failed to load test"
                }
            
            _isLoading.value = false
        }
    }
    
    /**
     * Process questions locally after retrieving from API
     * This is the core of local processing while maintaining data integrity
     */
    private fun processQuestionsLocally(questions: List<Question>, testType: String) {
        when (testType) {
            "multiple_choice" -> processMultipleChoiceQuestions(questions)
            "true_false" -> processTrueFalseQuestions(questions)
            "input" -> processInputQuestions(questions)
            "matching" -> processMatchingQuestions(questions)
            else -> _testQuestions.value = questions // No processing needed
        }
    }
    
    /**
     * Process multiple choice questions locally
     * Shuffle questions and answer options while maintaining relationships
     */
    private fun processMultipleChoiceQuestions(questions: List<Question>) {
        val processedQuestions = questions.map { question ->
            question.copy(
                options = question.options?.let { TestProcessor.shuffleWordBank(it) }
            )
        }
        
        // Shuffle question order
        val shuffledQuestions = TestProcessor.shuffleQuestions(processedQuestions)
        _testQuestions.value = shuffledQuestions
    }
    
    /**
     * Process true/false questions locally
     * Shuffle question order only
     */
    private fun processTrueFalseQuestions(questions: List<Question>) {
        val shuffledQuestions = TestProcessor.shuffleQuestions(questions)
        _testQuestions.value = shuffledQuestions
    }
    
    /**
     * Process input questions locally
     * Shuffle question order only
     */
    private fun processInputQuestions(questions: List<Question>) {
        val shuffledQuestions = TestProcessor.shuffleQuestions(questions)
        _testQuestions.value = shuffledQuestions
    }
    
    /**
     * Process matching questions locally
     * Shuffle word bank while maintaining question relationships
     */
    private fun processMatchingQuestions(questions: List<Question>) {
        val processedQuestions = questions.map { question ->
            question.copy(
                word_bank = question.word_bank?.let { TestProcessor.shuffleWordBank(it) }
            )
        }
        
        // Shuffle question order
        val shuffledQuestions = TestProcessor.shuffleQuestions(processedQuestions)
        _testQuestions.value = shuffledQuestions
    }
    
    /**
     * Record student answer
     */
    fun recordAnswer(questionId: String, answer: Any) {
        studentAnswers[questionId] = answer
    }
    
    /**
     * Submit test results
     * All processing happens locally, submission format matches existing backend exactly
     */
    fun submitTest() {
        if (currentTestId == null || currentTestType == null) {
            _error.value = "Test not loaded"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            
            // Calculate score locally
            val score = calculateLocalScore()
            
            // Prepare answers for submission (matching existing backend format)
            val submissionAnswers = prepareSubmissionAnswers()
            
            // Submit to existing backend API
            repository.submitTest(
                studentId = getCurrentStudentId(), // Get from session
                testId = currentTestId!!,
                testType = currentTestType!!,
                answers = submissionAnswers,
                localToken = localToken
            ).onSuccess { response ->
                _testCompleted.value = true
                securityService.onTestSubmitted()
            }.onFailure { exception ->
                _error.value = exception.message ?: "Failed to submit test"
            }
            
            _isLoading.value = false
        }
    }
    
    /**
     * Calculate test score locally
     * This ensures immediate feedback and offline functionality
     */
    private fun calculateLocalScore(): Double {
        var correctAnswers = 0
        val totalQuestions = originalQuestions.size
        
        originalQuestions.forEach { question ->
            val studentAnswer = studentAnswers[question.id]
            if (isAnswerCorrect(question, studentAnswer)) {
                correctAnswers++
            }
        }
        
        return TestProcessor.calculateScore(correctAnswers, totalQuestions)
    }
    
    /**
     * Check if student answer is correct
     * This uses local logic while maintaining scoring accuracy
     */
    private fun isAnswerCorrect(question: Question, studentAnswer: Any?): Boolean {
        if (studentAnswer == null) return false
        
        return when (question.question_type) {
            "multiple_choice" -> studentAnswer == question.correct_answer
            "true_false" -> studentAnswer.toString().toBoolean() == question.correct_answer?.toBoolean()
            "input" -> studentAnswer.toString().trim().equals(question.correct_answer?.trim(), ignoreCase = true)
            "matching" -> {
                // For matching tests, check if the mapping is correct
                // This requires more complex logic based on your matching test structure
                studentAnswer == question.correct_answer
            }
            else -> false
        }
    }
    
    /**
     * Prepare answers for submission to existing backend
     * Format must match exactly what the existing backend expects
     */
    private fun prepareSubmissionAnswers(): Map<String, Any> {
        val answers = mutableMapOf<String, Any>()
        
        // Add student answers
        studentAnswers.forEach { (questionId, answer) ->
            answers[questionId] = answer
        }
        
        // Add metadata that existing backend might expect
        answers["submission_timestamp"] = Date().time
        answers["total_questions"] = originalQuestions.size
        
        return answers
    }
    
    /**
     * Get current student ID from session
     * This should be implemented based on your session management
     */
    private fun getCurrentStudentId(): String {
        // TODO: Implement session management
        return "temp_student_id"
    }
    
    /**
     * Reset test state
     */
    fun resetTest() {
        currentTestId = null
        currentTestType = null
        originalQuestions = emptyList()
        studentAnswers.clear()
        localToken = ""
        _testQuestions.value = null
        _testInfo.value = null
        _testCompleted.value = false
        _error.value = null
    }
}
