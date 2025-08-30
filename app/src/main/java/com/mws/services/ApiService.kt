package com.mws.services

import com.mws.models.*
import retrofit2.http.*

interface ApiService {
    
    // Student authentication (existing - unchanged)
    @POST("/.netlify/functions/student-login")
    suspend fun studentLogin(@Body request: LoginRequest): LoginResponse
    
    // Test retrieval (existing - unchanged)
    @GET("/.netlify/functions/get-student-active-tests")
    suspend fun getActiveTests(@Query("student_id") studentId: String): ActiveTestsResponse
    
    @GET("/.netlify/functions/get-test-questions")
    suspend fun getTestQuestions(@Query("test_id") testId: String, @Query("test_type") testType: String): TestQuestionsResponse
    
    // Test submission (existing - unchanged)
    @POST("/.netlify/functions/submit-multiple-choice-test")
    suspend fun submitMultipleChoiceTest(@Body request: TestSubmissionRequest): SubmissionResponse
    
    @POST("/.netlify/functions/submit-true-false-test")
    suspend fun submitTrueFalseTest(@Body request: TestSubmissionRequest): SubmissionResponse
    
    @POST("/.netlify/functions/submit-input-test")
    suspend fun submitInputTest(@Body request: TestSubmissionRequest): SubmissionResponse
    
    @POST("/.netlify/functions/submit-matching-type-test")
    suspend fun submitMatchingTest(@Body request: TestSubmissionRequest): SubmissionResponse
    
    // New functions for profile and dashboard
    @GET("/.netlify/functions/get-student-profile")
    suspend fun getStudentProfile(@Query("student_id") studentId: String): StudentProfileResponse
    
    @GET("/.netlify/functions/get-student-dashboard-stats")
    suspend fun getDashboardStats(@Query("student_id") studentId: String): DashboardStatsResponse
    
    // Profile picture upload
    @POST("/.netlify/functions/upload-profile-picture")
    suspend fun uploadProfilePicture(@Body request: ProfilePictureRequest): ProfilePictureResponse
    
    // Session management
    @POST("/.netlify/functions/extend-student-session")
    suspend fun extendSession(@Body request: SessionRequest): SessionResponse
    
    @POST("/.netlify/functions/validate-student-session")
    suspend fun validateSession(@Body request: SessionRequest): SessionResponse
    
    // Log suspicious activity (admin monitoring)
    @POST("/.netlify/functions/log-suspicious-activity")
    suspend fun logSuspiciousActivity(@Body request: SuspiciousActivityRequest): LogResponse
}
