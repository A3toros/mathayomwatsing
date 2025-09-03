package com.mws.models

/**
 * Question model class
 */
data class Question(
    val id: String? = null,
    val questionId: String? = null,
    val question: String,
    val questionType: String,
    val options: List<String>? = null,
    val correctAnswer: String? = null,
    val correctAnswers: List<String>? = null,
    val wordBank: List<String>? = null,
    val coordinates: List<String>? = null,
    val explanation: String? = null,
    val points: Int = 1,
    val topic: String = "",
    val difficulty: String = ""
)
