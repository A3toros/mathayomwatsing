package com.mws.models

import com.google.gson.annotations.SerializedName

/**
 * Test submission data - matches backend API expectations
 */
data class TestSubmissionData(
    @SerializedName("test_id")
    val testId: String,
    @SerializedName("test_name")
    val testName: String,
    @SerializedName("test_type")
    val testType: String,
    @SerializedName("studentId")
    val studentId: String,
    val grade: String,
    @SerializedName("class")
    val className: String,
    val number: String,
    val name: String,
    val surname: String,
    val nickname: String,
    val score: Double,
    @SerializedName("maxScore")
    val maxScore: Double,
    val answers: Map<String, String>
)
