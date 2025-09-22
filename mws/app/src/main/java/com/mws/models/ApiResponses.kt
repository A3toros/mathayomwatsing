package com.mws.models

import com.google.gson.annotations.SerializedName

/**
 * Login response
 */
data class LoginResponse(
    val success: Boolean,
    val student: Student? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val error: String? = null
)

/**
 * Student profile response
 */
data class StudentProfileResponse(
    val success: Boolean,
    val student: Student? = null,
    val error: String? = null
)

/**
 * Test submission response
 */
data class TestSubmissionResponse(
    val success: Boolean,
    val submissionId: String? = null,
    val message: String? = null,
    val error: String? = null
)

/**
 * Test questions response
 */
data class TestQuestionsResponse(
    val success: Boolean,
    val questions: List<Question>? = null,
    val testInfo: TestInfo? = null,
    val error: String? = null
)

/**
 * Active tests response
 */
data class ActiveTestsResponse(
    val success: Boolean,
    val tests: List<TestInfo>? = null,
    val error: String? = null
)

/**
 * Student test results response
 */
data class StudentTestResultsResponse(
    val success: Boolean,
    val results: List<TestResult>? = null,
    val error: String? = null
)

/**
 * Test completion response
 */
data class TestCompletionResponse(
    val success: Boolean,
    val isCompleted: Boolean = false,
    val completedAt: String? = null,
    val score: Double? = null,
    val error: String? = null
)

/**
 * Test result model
 */
data class TestResult(
    val testId: String,
    val testName: String,
    val testType: String,
    val score: Double,
    val maxScore: Double,
    val submittedAt: String,
    val grade: String,
    val className: String,
    val subject: String = "",
    val teacherName: String = ""
)

// Error response
data class ErrorResponse(
    val success: Boolean = false,
    val error: String,
    val code: Int? = null,
    val details: Map<String, Any>? = null
)

// Network error wrapper
data class NetworkError(
    val message: String,
    val code: Int? = null,
    val isNetworkError: Boolean = false,
    val isServerError: Boolean = false,
    val isAuthError: Boolean = false
)
