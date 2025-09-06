package com.mws.services

import com.mws.models.*
import com.mws.services.StudentLoginData
import retrofit2.Response
import retrofit2.http.*
import com.google.gson.annotations.SerializedName

/**
 * ApiService - Main API service for MWS backend integration
 * Integrates with existing Netlify functions from projects/mathayomwatsing/
 */
interface ApiService {

    // ===== STUDENT ENDPOINTS =====

    /**
     * Get student test results
     * Endpoint: /.netlify/functions/get-student-test-results
     */
    @GET("get-student-test-results")
    suspend fun getStudentTestResults(
        @Query("student_id") studentId: String
    ): Response<StudentTestResultsResponse>

    /**
     * Get all available tests for students
     * Endpoint: /.netlify/functions/get-all-tests
     */
    @GET("get-all-tests")
    suspend fun getAllTests(): Response<ActiveTestsResponse>

    /**
     * Get active tests assigned to a specific student
     * Endpoint: /.netlify/functions/get-student-active-tests
     */
    @GET("get-student-active-tests")
    suspend fun getStudentActiveTests(
        @Query("student_id") studentId: String
    ): Response<ActiveTestsResponse>

    /**
     * Get test questions and information
     * Endpoint: /.netlify/functions/get-test-questions
     */
    @GET("get-test-questions")
    suspend fun getTestQuestions(
        @Query("test_type") testType: String,
        @Query("test_id") testId: String
    ): Response<TestQuestionsResponse>

    // ===== TEST SUBMISSION ENDPOINTS =====

    /**
     * Submit true/false test
     * Endpoint: /.netlify/functions/submit-true-false-test
     */
    @POST("submit-true-false-test")
    suspend fun submitTrueFalseTest(
        @Body submissionData: TestSubmissionData
    ): Response<TestSubmissionResponse>

    /**
     * Submit multiple choice test
     * Endpoint: /.netlify/functions/submit-multiple-choice-test
     */
    @POST("submit-multiple-choice-test")
    suspend fun submitMultipleChoiceTest(
        @Body submissionData: TestSubmissionData
    ): Response<TestSubmissionResponse>

    /**
     * Submit input test
     * Endpoint: /.netlify/functions/submit-input-test
     */
    @POST("submit-input-test")
    suspend fun submitInputTest(
        @Body submissionData: TestSubmissionData
    ): Response<TestSubmissionResponse>

    /**
     * Submit matching type test
     * Endpoint: /.netlify/functions/submit-matching-type-test
     */
    @POST("submit-matching-type-test")
    suspend fun submitMatchingTypeTest(
        @Body submissionData: TestSubmissionData
    ): Response<TestSubmissionResponse>

    // ===== AUTHENTICATION ENDPOINTS =====

    /**
     * Student login
     * Endpoint: /.netlify/functions/student-login
     */
    @POST("student-login")
    suspend fun studentLogin(
        @Body loginData: StudentLoginData
    ): Response<LoginResponse>

    /**
     * Get student profile
     * Endpoint: /.netlify/functions/get-student-profile
     */
    @GET("get-student-profile")
    suspend fun getStudentProfile(
        @Query("student_id") studentId: String
    ): Response<StudentProfileResponse>

    // ===== UTILITY ENDPOINTS =====

    /**
     * Check test completion status
     * Endpoint: /.netlify/functions/check-test-completion
     */
    @GET("check-test-completion")
    suspend fun checkTestCompletion(
        @Query("test_type") testType: String,
        @Query("test_id") testId: String,
        @Query("student_id") studentId: String
    ): Response<TestCompletionResponse>
}

// Response classes are imported from com.mws.models.*
