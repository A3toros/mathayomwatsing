package com.mws.models

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * TestInfo model class for test metadata
 * Matches backend response structure from get-all-tests.js
 */
data class TestInfo(
    @SerializedName("test_id")
    val testId: String,
    @SerializedName("test_name")
    val testName: String,
    @SerializedName("test_type")
    val testType: String,
    @SerializedName("num_questions")
    val numQuestions: Int,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("subject_name")
    val subjectName: String,
    @SerializedName("grade")
    val grade: String,
    @SerializedName("class")
    val className: String,
    // Additional properties for compatibility
    val id: String = testId,
    val name: String = testName,
    val type: String = testType,
    val subject: String = subjectName,
    val questionCount: Int = numQuestions,
    val teacherName: String = "Unknown Teacher", // Not provided by backend
    val timeLimit: Int? = null,
    val startDate: Date? = null,
    val endDate: Date? = null,
    val instructions: String? = null,
    val duration: Int = timeLimit ?: 60, // Default to 60 minutes
    val durationMinutes: Int = duration
)
