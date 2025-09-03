package com.mws.viewmodels

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mws.models.*
import com.mws.repository.TestRepository
import com.mws.services.SessionManager
import com.mws.utils.Logger
import kotlinx.coroutines.launch

/**
 * TestViewModel - Manages test-related data and operations
 * Integrates with TestRepository for API calls and data management
 */
class TestViewModel(
    private val testRepository: TestRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    companion object {
        private const val TAG = "TestViewModel"
    }

    // ===== LIVE DATA =====

    private val _testQuestions = MutableLiveData<List<Question>>()
    val testQuestions: LiveData<List<Question>> = _testQuestions

    private val _testInfo = MutableLiveData<TestInfo>()
    val testInfo: LiveData<TestInfo> = _testInfo

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage

    private val _testSubmissionResult = MutableLiveData<TestSubmissionResponse>()
    val testSubmissionResult: LiveData<TestSubmissionResponse> = _testSubmissionResult

    // ===== TEST DATA MANAGEMENT =====

    /**
     * Load test questions and information
     */
    fun loadTestQuestions(testType: String, testId: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = null

                val result = testRepository.getTestQuestions(testType, testId)
                
                result.fold(
                    onSuccess = { (testInfo, questions) ->
                        _testInfo.value = testInfo
                        _testQuestions.value = questions
                        Logger.info("Loaded ${questions.size} questions for test $testId")
                    },
                    onFailure = { exception ->
                        _errorMessage.value = "Failed to load test: ${exception.message}"
                        Logger.error("Failed to load test questions", exception)
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Unexpected error: ${e.message}"
                Logger.error("Unexpected error loading test questions", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Submit test with answers
     */
    fun submitTest(
        testType: String,
        testId: String,
        testName: String,
        score: Double,
        maxScore: Double,
        answers: Map<String, String>
    ) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = null

                val result = testRepository.submitTest(
                    testType = testType,
                    testId = testId,
                    testName = testName,
                    score = score,
                    maxScore = maxScore,
                    answers = answers
                )

                result.fold(
                    onSuccess = { submissionResponse ->
                        _testSubmissionResult.value = submissionResponse
                        Logger.info("Test submitted successfully: ${submissionResponse.message}")
                    },
                    onFailure = { exception ->
                        _errorMessage.value = "Failed to submit test: ${exception.message}"
                        Logger.error("Failed to submit test", exception)
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Unexpected error: ${e.message}"
                Logger.error("Unexpected error submitting test", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Check test completion status
     */
    fun checkTestCompletion(testType: String, testId: String) {
        val studentId = testRepository.getCurrentStudentId()
        if (studentId == null) {
            _errorMessage.value = "Student ID not available"
            return
        }

        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = null

                val result = testRepository.checkTestCompletion(testType, testId, studentId)

                result.fold(
                    onSuccess = { completionResponse ->
                        if (completionResponse.isCompleted) {
                            Logger.info("Test $testId already completed")
                        }
                    },
                    onFailure = { exception ->
                        Logger.error("Failed to check test completion", exception)
                    }
                )
            } catch (e: Exception) {
                Logger.error("Unexpected error checking test completion", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Clear error message
     */
    fun clearErrorMessage() {
        _errorMessage.value = null
    }

    /**
     * Clear test submission result
     */
    fun clearTestSubmissionResult() {
        _testSubmissionResult.value = null
    }

    /**
     * Check if user is authenticated
     */
    fun isAuthenticated(): Boolean {
        return testRepository.isAuthenticated()
    }

    /**
     * Get current student ID
     */
    fun getCurrentStudentId(): String? {
        return testRepository.getCurrentStudentId()
    }

    /**
     * Logout current user
     */
    fun logout() {
        testRepository.logout()
    }

    /**
     * Get current test questions
     */
    fun getCurrentTestQuestions(): List<Question>? {
        return _testQuestions.value
    }

    /**
     * Get current test info
     */
    fun getCurrentTestInfo(): TestInfo? {
        return _testInfo.value
    }
}
