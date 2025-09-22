package com.mws.services

import android.content.Context
import com.mws.database.AppDatabase
import com.mws.database.entity.TestSession
import com.mws.database.entity.AppStateLog
import com.mws.models.TestSubmissionData
import com.mws.repository.TestRepository
import com.mws.utils.Logger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*

/**
 * TestSubmissionService - Handles test submission to backend database
 * Integrates with existing projects/mathayomwatsing/db schema
 */
class TestSubmissionService(
    private val context: Context,
    private val testRepository: TestRepository,
    private val database: AppDatabase
) {

    companion object {
        private const val TAG = "TestSubmissionService"
    }

    /**
     * Submit test to backend with security violation tracking
     */
    suspend fun submitTestWithSecurityData(
        testSubmissionData: TestSubmissionData,
        securityViolations: List<AppStateLog>,
        isCheatingSubmission: Boolean = false
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            Logger.info("Submitting test with security data: ${testSubmissionData.testId}")
            
            // Submit test data to backend
            val submissionResult = submitTestToBackend(testSubmissionData, isCheatingSubmission)
            
            // Update local database
            updateLocalDatabase(testSubmissionData.testId, isCheatingSubmission)
            
            submissionResult
            
        } catch (e: Exception) {
            Logger.error("Error in test submission process", e)
            Result.failure(e)
        }
    }

    /**
     * Submit test data to backend API
     */
    private suspend fun submitTestToBackend(
        testSubmissionData: TestSubmissionData,
        isCheatingSubmission: Boolean
    ): Result<String> {
        return try {
            // Mark answers as "cheating" if this is a security violation submission
            val modifiedData = if (isCheatingSubmission) {
                testSubmissionData.copy(
                    answers = testSubmissionData.answers.mapValues { (_, value) ->
                        if (value.isBlank() || value.isEmpty()) "cheating" else value
                    }
                )
            } else {
                testSubmissionData
            }

            // Submit based on test type
            val result = testRepository.submitTest(
                testType = testSubmissionData.testType,
                testId = modifiedData.testId,
                testName = modifiedData.testName,
                score = modifiedData.score,
                maxScore = modifiedData.maxScore,
                answers = modifiedData.answers
            )

            result.fold(
                onSuccess = { response ->
                    Result.success(response.submissionId ?: "unknown")
                },
                onFailure = { exception ->
                    Result.failure(exception)
                }
            )

        } catch (e: Exception) {
            Logger.error("Backend submission failed", e)
            Result.failure(e)
        }
    }

    /**
     * Update local database after submission
     */
    private suspend fun updateLocalDatabase(testId: String, isCheatingSubmission: Boolean) {
        try {
            // Mark test session as submitted
            val testSession = database.testSessionDao().getTestSessionById(testId)
            testSession?.let { session ->
                val updatedSession = session.copy(
                    isSubmitted = true,
                    submissionTime = Date(),
                    isCheatingSubmission = isCheatingSubmission
                )
                database.testSessionDao().updateTestSession(updatedSession)
            }
            
            Logger.info("Local database updated for test: $testId")
            
        } catch (e: Exception) {
            Logger.error("Failed to update local database", e)
        }
    }
}
