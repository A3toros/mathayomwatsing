package com.mws.models

import com.google.gson.annotations.SerializedName

/**
 * ActiveTest - Represents an active test available to the student
 */
data class ActiveTest(
    val id: String,
    val name: String,
    val type: String,
    val subject: String,
    val teacherName: String,
    val dueDate: String?,
    val status: String,
    // Additional fields for compatibility with backend
    @SerializedName("test_id")
    val testId: String,
    @SerializedName("test_name")
    val testName: String,
    @SerializedName("test_type")
    val testType: String,
    @SerializedName("num_questions")
    val numQuestions: Int,
    val grade: String,
    @SerializedName("class_name")
    val className: String,
    @SerializedName("assigned_at")
    val assignedAt: String?
)
