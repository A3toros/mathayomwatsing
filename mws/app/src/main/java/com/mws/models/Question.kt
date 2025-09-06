package com.mws.models

import com.google.gson.annotations.SerializedName

/**
 * Question model class
 * Matches backend response structure from get-test-questions.js
 */
data class Question(
    @SerializedName("question_id")
    val questionId: String? = null,
    @SerializedName("question")
    val question: String? = null,
    @SerializedName("correct_answer")
    val correctAnswer: String? = null,
    @SerializedName("correct_answers")
    val correctAnswers: List<String>? = null,
    @SerializedName("options")
    val options: List<String>? = null,
    // For matching type tests
    @SerializedName("image_url")
    val imageUrl: String? = null,
    @SerializedName("words")
    val words: List<String>? = null,
    @SerializedName("blocks")
    val blocks: List<Block>? = null,
    @SerializedName("arrows")
    val arrows: List<Arrow>? = null,
    // Additional properties for compatibility
    val id: String? = questionId,
    val questionType: String = "unknown",
    val wordBank: List<String>? = null,
    val coordinates: List<String>? = null,
    val explanation: String? = null,
    val points: Int = 1,
    val topic: String = "",
    val difficulty: String = ""
)

/**
 * Block model for matching type tests
 */
data class Block(
    @SerializedName("block_id")
    val blockId: String,
    @SerializedName("word")
    val word: String,
    @SerializedName("x")
    val x: Double,
    @SerializedName("y")
    val y: Double
)

/**
 * Arrow model for matching type tests
 */
data class Arrow(
    @SerializedName("id")
    val id: Int,
    @SerializedName("question_id")
    val questionId: String,
    @SerializedName("block_id")
    val blockId: String,
    @SerializedName("start_x")
    val startX: Double,
    @SerializedName("start_y")
    val startY: Double,
    @SerializedName("end_x")
    val endX: Double,
    @SerializedName("end_y")
    val endY: Double,
    @SerializedName("style")
    val style: ArrowStyle? = null
)

/**
 * Arrow style for matching type tests
 */
data class ArrowStyle(
    @SerializedName("color")
    val color: String = "#dc3545",
    @SerializedName("thickness")
    val thickness: Int = 3
)
