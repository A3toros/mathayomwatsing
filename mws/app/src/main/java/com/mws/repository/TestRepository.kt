package com.mws.repository

import com.mws.models.*
import com.mws.services.ApiService
import com.mws.services.SessionManager
import com.mws.services.StudentLoginData
import com.mws.utils.Logger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response

/**
 * TestRepository - Data layer between API service and ViewModels
 * Handles data fetching, caching, and offline support
 * Simplified version for basic functionality
 */
class TestRepository(
    private val apiService: ApiService? = null,
    private val sessionManager: SessionManager? = null
) {

    companion object {
        private const val TAG = "TestRepository"
    }

    // Simplified constructor for basic functionality
    constructor() : this(null, null)

    // ===== STUDENT LOGIN =====
    
    /**
     * Student login - actual API implementation
     */
    suspend fun studentLogin(studentId: String, password: String): Result<LoginResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Logger.info("=== LOGIN DEBUG START ===")
                Logger.info("Input parameters: studentId=$studentId, password=$password")
                Logger.info("=== LOGIN DEBUG END ===")
                
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val loginData = StudentLoginData(studentId, password)
                    val response = apiService.studentLogin(loginData)
                    
                    if (response.isSuccessful) {
                        val loginResponse = response.body()
                        if (loginResponse?.success == true) {
                            Logger.info("Login successful for student: $studentId")
                            Result.success(loginResponse)
                        } else {
                            Logger.error("Login failed: ${loginResponse?.error}")
                            Result.failure(Exception(loginResponse?.error ?: "Login failed"))
                        }
                    } else {
                        Logger.error("Login API call failed: ${response.code()}")
                        Result.failure(Exception("Login failed: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Login failed", e)
                Result.failure(e)
            }
        }
    }

    // ===== TEST QUESTIONS =====
    
    /**
     * Get test questions and information
     */
    suspend fun getTestQuestions(testType: String, testId: String): Result<Pair<TestInfo, List<Question>>> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val response = apiService.getTestQuestions(testType, testId)
                    
                    if (response.isSuccessful) {
                        val questionsResponse = response.body()
                        if (questionsResponse?.success == true && questionsResponse.questions != null && questionsResponse.testInfo != null) {
                            Logger.info("Test questions loaded successfully: ${questionsResponse.questions.size} questions")
                            Result.success(Pair(questionsResponse.testInfo, questionsResponse.questions))
                        } else {
                            Logger.error("Failed to get test questions: ${questionsResponse?.error}")
                            Result.failure(Exception(questionsResponse?.error ?: "Failed to get test questions"))
                        }
                    } else {
                        Logger.error("Test questions API call failed: ${response.code()}")
                        Result.failure(Exception("Failed to get test questions: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to get test questions", e)
                Result.failure(e)
            }
        }
    }

    // ===== TEST SUBMISSION =====
    
    /**
     * Submit test based on test type
     */
    suspend fun submitTest(
        testType: String,
        testId: String,
        testName: String,
        score: Double,
        maxScore: Double,
        answers: Map<String, String>
    ): Result<TestSubmissionResponse> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val submissionData = TestSubmissionData(
                        testId = testId,
                        testName = testName,
                        testType = testType,
                        studentId = "", // Will be filled by the service
                        grade = "",
                        className = "",
                        number = "",
                        name = "",
                        surname = "",
                        nickname = "",
                        score = score,
                        maxScore = maxScore,
                        answers = answers
                    )
                    
                    val response = when (testType) {
                        "true_false" -> apiService.submitTrueFalseTest(submissionData)
                        "multiple_choice" -> apiService.submitMultipleChoiceTest(submissionData)
                        "input" -> apiService.submitInputTest(submissionData)
                        "matching_type" -> apiService.submitMatchingTypeTest(submissionData)
                        else -> {
                            Logger.error("Unsupported test type: $testType")
                            return@withContext Result.failure(Exception("Unsupported test type: $testType"))
                        }
                    }
                    
                    if (response.isSuccessful) {
                        val submissionResponse = response.body()
                        if (submissionResponse?.success == true) {
                            Logger.info("Test submitted successfully: $testId")
                            Result.success(submissionResponse)
                        } else {
                            Logger.error("Test submission failed: ${submissionResponse?.error}")
                            Result.failure(Exception(submissionResponse?.error ?: "Test submission failed"))
                        }
                    } else {
                        Logger.error("Test submission API call failed: ${response.code()}")
                        Result.failure(Exception("Test submission failed: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to submit test", e)
                Result.failure(e)
            }
        }
    }

    // ===== STUDENT PROFILE =====
    
    /**
     * Get student profile
     */
    suspend fun getStudentProfile(studentId: String): Result<Student> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val response = apiService.getStudentProfile(studentId)
                    
                    if (response.isSuccessful) {
                        val profileResponse = response.body()
                        if (profileResponse?.success == true && profileResponse.student != null) {
                            Logger.info("Student profile loaded successfully: $studentId")
                            Result.success(profileResponse.student)
                        } else {
                            Logger.error("Failed to get student profile: ${profileResponse?.error}")
                            Result.failure(Exception(profileResponse?.error ?: "Failed to get student profile"))
                        }
                    } else {
                        Logger.error("Student profile API call failed: ${response.code()}")
                        Result.failure(Exception("Failed to get student profile: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to get student profile", e)
                Result.failure(e)
            }
        }
    }

    // ===== STUDENT TEST RESULTS =====
    
    /**
     * Get student test results from API
     */
    suspend fun getStudentTestResults(studentId: String): Result<List<TestResult>> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val response = apiService.getStudentTestResults(studentId)
                    
                    if (response.isSuccessful) {
                        val resultsResponse = response.body()
                        if (resultsResponse?.success == true && resultsResponse.results != null) {
                            Logger.info("Student test results loaded successfully: ${resultsResponse.results.size} results")
                            Result.success(resultsResponse.results)
                        } else {
                            Logger.error("Failed to get student test results: ${resultsResponse?.error}")
                            Result.failure(Exception(resultsResponse?.error ?: "Failed to get student test results"))
                        }
                    } else {
                        Logger.error("Student test results API call failed: ${response.code()}")
                        Result.failure(Exception("Failed to get student test results: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to get student test results", e)
                Result.failure(e)
            }
        }
    }

    // ===== ACTIVE TESTS =====
    
    /**
     * Get active tests assigned to the current student
     */
    suspend fun getAllTests(): Result<List<ActiveTest>> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val studentId = getCurrentStudentId()
                    if (studentId == null) {
                        Logger.error("No student ID available")
                        Result.failure(Exception("Student not logged in"))
                    } else {
                        val response = apiService.getStudentActiveTests(studentId)
                        
                        if (response.isSuccessful) {
                            val testsResponse = response.body()
                            if (testsResponse?.success == true && testsResponse.tests != null) {
                                Logger.info("Student active tests loaded successfully: ${testsResponse.tests.size} tests")
                                // Convert TestInfo to ActiveTest
                                val activeTests = testsResponse.tests.map { testInfo ->
                                    ActiveTest(
                                        id = testInfo.testId,
                                        name = testInfo.testName,
                                        type = testInfo.testType,
                                        teacherName = "", // Not available in TestInfo
                                        dueDate = null, // Not available in TestInfo
                                        status = "active", // Default status
                                        testId = testInfo.testId,
                                        testName = testInfo.testName,
                                        testType = testInfo.testType,
                                        numQuestions = testInfo.numQuestions,
                                        subject = testInfo.subjectName,
                                        grade = testInfo.grade,
                                        className = testInfo.className,
                                        assignedAt = testInfo.createdAt
                                    )
                                }
                                Result.success(activeTests)
                            } else {
                                Logger.error("Failed to load student active tests: ${testsResponse?.error}")
                                Result.failure(Exception(testsResponse?.error ?: "Failed to load active tests"))
                            }
                        } else {
                            Logger.error("Student active tests API call failed: ${response.code()}")
                            Result.failure(Exception("Failed to load active tests: ${response.code()}"))
                        }
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to load student active tests", e)
                Result.failure(e)
            }
        }
    }

    // ===== TEST COMPLETION =====
    
    /**
     * Check test completion status
     */
    suspend fun checkTestCompletion(
        testType: String,
        testId: String,
        studentId: String
    ): Result<TestCompletionResponse> {
        return withContext(Dispatchers.IO) {
            try {
                if (apiService == null) {
                    Logger.error("ApiService not initialized")
                    Result.failure(Exception("API service not available"))
                } else {
                    val response = apiService.checkTestCompletion(testType, testId, studentId)
                    
                    if (response.isSuccessful) {
                        val completionResponse = response.body()
                        if (completionResponse?.success == true) {
                            Logger.info("Test completion status checked successfully: $testId")
                            Result.success(completionResponse)
                        } else {
                            Logger.error("Failed to check test completion: ${completionResponse?.error}")
                            Result.failure(Exception(completionResponse?.error ?: "Failed to check test completion"))
                        }
                    } else {
                        Logger.error("Test completion API call failed: ${response.code()}")
                        Result.failure(Exception("Failed to check test completion: ${response.code()}"))
                    }
                }
            } catch (e: Exception) {
                Logger.error("Failed to check test completion", e)
                Result.failure(e)
            }
        }
    }

    // ===== UTILITY METHODS =====
    
    /**
     * Check if user is authenticated
     */
    fun isAuthenticated(): Boolean {
        return sessionManager?.isLoggedIn() ?: false
    }

    /**
     * Get current student ID
     */
    fun getCurrentStudentId(): String? {
        return sessionManager?.getStudentId()
    }

    /**
     * Logout current user
     */
    fun logout() {
        sessionManager?.clearSession()
    }
}