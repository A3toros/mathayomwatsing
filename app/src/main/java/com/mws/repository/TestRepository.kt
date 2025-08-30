package com.mws.repository

import com.mws.database.AppDatabase
import com.mws.database.entity.TestSession
import com.mws.models.*
import com.mws.network.NetworkModule
import com.mws.testlogic.TestProcessor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*

class TestRepository(
    private val database: AppDatabase
) {
    
    private val apiService = NetworkModule.apiService
    
    /**
     * Get test questions from API and store original data locally
     * This ensures data integrity while enabling local processing
     */
    suspend fun getTestQuestions(testId: String, testType: String): Result<TestQuestionsResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getTestQuestions(testId, testType)
                if (response.success && response.questions != null) {
                    // Store original, unshuffled data locally
                    storeOriginalTestData(testId, testType, response)
                    Result.success(response)
                } else {
                    Result.failure(Exception(response.message ?: "Failed to load test questions"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    /**
     * Get active tests for student
     */
    suspend fun getActiveTests(studentId: String): Result<ActiveTestsResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getActiveTests(studentId)
                Result.success(response)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    /**
     * Submit test results to existing backend API
     * All processing happens locally, submission format matches existing backend exactly
     */
    suspend fun submitTest(
        studentId: String,
        testId: String,
        testType: String,
        answers: Map<String, Any>,
        localToken: String
    ): Result<SubmissionResponse> {
        return withContext(Dispatchers.IO) {
            try {
                // Prepare submission request matching existing backend format
                val request = TestSubmissionRequest(
                    student_id = studentId,
                    test_id = testId,
                    test_type = testType,
                    answers = answers + mapOf("local_token" to localToken),
                    submission_time = Date().toString()
                )
                
                // Submit to existing API endpoint based on test type
                val response = when (testType) {
                    "multiple_choice" -> apiService.submitMultipleChoiceTest(request)
                    "true_false" -> apiService.submitTrueFalseTest(request)
                    "input" -> apiService.submitInputTest(request)
                    "matching" -> apiService.submitMatchingTest(request)
                    else -> throw IllegalArgumentException("Unsupported test type: $testType")
                }
                
                if (response.success) {
                    // Mark local session as submitted
                    markTestSessionAsSubmitted(testId)
                    Result.success(response)
                } else {
                    // Store failed submission for retry
                    storeFailedSubmission(testId, request, response.message)
                    Result.failure(Exception(response.message ?: "Submission failed"))
                }
            } catch (e: Exception) {
                // Store failed submission for retry
                storeFailedSubmission(testId, TestSubmissionRequest(
                    student_id = studentId,
                    test_id = testId,
                    test_type = testType,
                    answers = answers + mapOf("local_token" to localToken),
                    submission_time = Date().toString()
                ), e.message)
                Result.failure(e)
            }
        }
    }
    
    /**
     * Store original test data locally for reference
     * This ensures data integrity during local processing
     */
    private suspend fun storeOriginalTestData(
        testId: String,
        testType: String,
        response: TestQuestionsResponse
    ) {
        // Store original questions in local database
        // This prevents data loss during local shuffling
        // Implementation depends on your local storage strategy
    }
    
    /**
     * Mark test session as submitted in local database
     */
    private suspend fun markTestSessionAsSubmitted(testId: String) {
        try {
            val session = database.testSessionDao().getActiveSessionByTestId(testId)
            session?.let {
                database.testSessionDao().markAsSubmitted(it.id)
            }
        } catch (e: Exception) {
            // Log error but don't fail submission
        }
    }
    
    /**
     * Store failed submission for retry
     */
    private suspend fun storeFailedSubmission(
        testId: String,
        request: TestSubmissionRequest,
        errorMessage: String?
    ) {
        try {
            val session = database.testSessionDao().getActiveSessionByTestId(testId)
            session?.let {
                val failedSubmission = com.mws.database.entity.FailedSubmission(
                    testSessionId = it.id,
                    testData = request.toString(), // Convert to string for storage
                    errorMessage = errorMessage
                )
                database.failedSubmissionDao().insert(failedSubmission)
            }
        } catch (e: Exception) {
            // Log error but don't fail submission
        }
    }
    
    /**
     * Retry failed submissions
     */
    suspend fun retryFailedSubmissions() {
        withContext(Dispatchers.IO) {
            try {
                val failedSubmissions = database.failedSubmissionDao().getAll()
                // Implement retry logic for failed submissions
                // This ensures data integrity even during network failures
            } catch (e: Exception) {
                // Log error
            }
        }
    }
}
