package com.mws.models

// Authentication
data class LoginRequest(
    val student_id: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val student: Student?,
    val message: String?
)

// Test Management
data class ActiveTestsResponse(
    val success: Boolean,
    val tests: List<Test>?,
    val message: String?
)

data class TestQuestionsResponse(
    val success: Boolean,
    val questions: List<Question>?,
    val test_info: TestInfo?,
    val message: String?
)

data class TestInfo(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val grade: String,
    val className: String,
    val numQuestions: Int,
    val timeLimit: Int?
)

// Test Submission
data class TestSubmissionRequest(
    val student_id: String,
    val test_id: String,
    val test_type: String,
    val answers: Map<String, Any>, // This will include local_token
    val submission_time: String
)

data class SubmissionResponse(
    val success: Boolean,
    val message: String?,
    val score: Double?,
    val total_questions: Int?,
    val correct_answers: Int?
)

// Profile Management
data class StudentProfileResponse(
    val success: Boolean,
    val profile: StudentProfile?,
    val message: String?
)

data class StudentProfile(
    val student_id: String,
    val name: String,
    val surname: String,
    val nickname: String,
    val grade: String,
    val className: String,
    val number: Int,
    val profile_picture_url: String?,
    val last_login: String?,
    val login_count: Int
)

data class ProfilePictureRequest(
    val student_id: String,
    val image_data: String, // Base64 encoded
    val image_type: String
)

data class ProfilePictureResponse(
    val success: Boolean,
    val image_url: String?,
    val message: String?
)

// Dashboard Statistics
data class DashboardStatsResponse(
    val success: Boolean,
    val stats: DashboardStats?,
    val message: String?
)

data class DashboardStats(
    val total_tests: Int,
    val average_score: Double,
    val recent_tests: List<RecentTest>,
    val tests_by_type: Map<String, Int>
)

data class RecentTest(
    val test_id: String,
    val test_name: String,
    val test_type: String,
    val subject: String,
    val score: Double,
    val completion_date: String
)

// Session Management
data class SessionRequest(
    val student_id: String,
    val session_token: String
)

data class SessionResponse(
    val success: Boolean,
    val valid: Boolean,
    val message: String?
)

// Suspicious Activity Logging
data class SuspiciousActivityRequest(
    val student_id: String,
    val test_id: String,
    val test_type: String,
    val activity_type: String,
    val warnings_received: Int,
    val time_in_background: Long?,
    val device_info: Map<String, Any>?,
    val severity: String
)

data class LogResponse(
    val success: Boolean,
    val message: String?
)

// Question Models
data class Question(
    val id: String,
    val question_text: String,
    val question_type: String,
    val correct_answer: String?,
    val options: List<String>?, // For multiple choice
    val word_bank: List<String>? // For matching tests
)

// Test Results
data class TestResult(
    val test_id: String,
    val test_type: String,
    val student_id: String,
    val score: Double,
    val total_questions: Int,
    val correct_answers: Int,
    val completion_time: String,
    val local_token: String
)
