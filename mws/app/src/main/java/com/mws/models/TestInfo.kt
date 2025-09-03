package com.mws.models

import java.util.Date

/**
 * TestInfo model class for test metadata
 */
data class TestInfo(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val grade: String,
    val className: String,
    val teacherName: String,
    val questionCount: Int,
    val timeLimit: Int? = null,
    val startDate: Date? = null,
    val endDate: Date? = null,
    val instructions: String? = null,
    // Additional properties for compatibility
    val duration: Int = timeLimit ?: 60, // Default to 60 minutes
    val numQuestions: Int = questionCount // Alias for compatibility
) {
    // Computed property for duration in minutes
    val durationMinutes: Int
        get() = duration
}
