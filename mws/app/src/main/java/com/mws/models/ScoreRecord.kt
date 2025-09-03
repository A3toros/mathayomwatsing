package com.mws.models

/**
 * ScoreRecord - Represents a test score record for the student
 */
data class ScoreRecord(
    val testId: String,
    val testName: String,
    val subject: String,
    val score: Double,
    val maxScore: Double,
    val date: String,
    val teacherName: String
)
