package com.mws.testlogic

import com.mws.models.Question

/**
 * AnswerValidator - Handles answer validation for all test types
 * Converted from isAnswerCorrect() function in script.js
 */
object AnswerValidator {

    /**
     * Validates if a user's answer is correct for a given question
     * Converted from isAnswerCorrect() in script.js
     * 
     * @param questionId The ID of the question
     * @param userAnswer The user's answer
     * @param correctAnswers Map of question IDs to their correct answers
     * @return true if the answer is correct, false otherwise
     */
    fun isAnswerCorrect(
        questionId: String,
        userAnswer: String,
        correctAnswers: Map<String, List<String>>
    ): Boolean {
        val possibleAnswers = correctAnswers[questionId] ?: emptyList()
        
        // If no correct answers are defined, consider it incorrect
        if (possibleAnswers.isEmpty()) return false
        
        // Normalize the user answer (trim and lowercase)
        val normalizedUserAnswer = userAnswer.trim().lowercase()
        
        // Check if the normalized user answer matches any of the possible correct answers
        return possibleAnswers.any { correctAnswer ->
            normalizedUserAnswer == correctAnswer.trim().lowercase()
        }
    }

    /**
     * Validates if a user's answer is correct for a given question object
     * 
     * @param question The question object
     * @param userAnswer The user's answer
     * @return true if the answer is correct, false otherwise
     */
    fun isAnswerCorrect(question: Question, userAnswer: String): Boolean {
        val correctAnswer = question.correctAnswer ?: return false
        
        return when (question.questionType) {
            "multiple-choice", "multiple_choice" -> {
                // For multiple choice, correctAnswer is the index (0, 1, 2, 3)
                userAnswer.trim() == correctAnswer.trim()
            }
            "true-false", "true_false" -> {
                // For true/false, correctAnswer is "true" or "false"
                userAnswer.trim().lowercase() == correctAnswer.trim().lowercase()
            }
            "input" -> {
                // For input, correctAnswer is the exact text
                userAnswer.trim().lowercase() == correctAnswer.trim().lowercase()
            }
            "matching-type", "matching_type" -> {
                // For matching, correctAnswer is the exact text
                userAnswer.trim().lowercase() == correctAnswer.trim().lowercase()
            }
            else -> {
                // Default to exact match
                userAnswer.trim().lowercase() == correctAnswer.trim().lowercase()
            }
        }
    }

    /**
     * Validates answer format based on test type
     * 
     * @param testType The type of test
     * @param answer The answer to validate
     * @return true if the answer format is valid, false otherwise
     */
    fun validateAnswerFormat(testType: String, answer: String): Boolean {
        return when (testType) {
            "multiple-choice", "multiple_choice" -> {
                // Should be a number (0, 1, 2, 3, etc.)
                answer.trim().matches(Regex("^\\d+$"))
            }
            "true-false", "true_false" -> {
                // Should be "true" or "false"
                val normalizedAnswer = answer.trim().lowercase()
                normalizedAnswer == "true" || normalizedAnswer == "false"
            }
            "input" -> {
                // Should not be empty and should be reasonable length
                val trimmedAnswer = answer.trim()
                trimmedAnswer.isNotEmpty() && trimmedAnswer.length <= 500
            }
            "matching-type", "matching_type" -> {
                // Should not be empty and should be reasonable length
                val trimmedAnswer = answer.trim()
                trimmedAnswer.isNotEmpty() && trimmedAnswer.length <= 200
            }
            else -> {
                // Default validation - not empty
                answer.trim().isNotEmpty()
            }
        }
    }

    /**
     * Gets validation error message for invalid answers
     * 
     * @param testType The type of test
     * @param answer The invalid answer
     * @return Error message explaining what's wrong
     */
    fun getValidationErrorMessage(testType: String, answer: String): String {
        return when (testType) {
            "multiple-choice", "multiple_choice" -> {
                "Please select a valid option (A, B, C, D, etc.)"
            }
            "true-false", "true_false" -> {
                "Please select either True or False"
            }
            "input" -> {
                when {
                    answer.trim().isEmpty() -> "Please enter an answer"
                    answer.trim().length > 500 -> "Answer is too long (maximum 500 characters)"
                    else -> "Please enter a valid answer"
                }
            }
            "matching-type", "matching_type" -> {
                when {
                    answer.trim().isEmpty() -> "Please enter an answer"
                    answer.trim().length > 200 -> "Answer is too long (maximum 200 characters)"
                    else -> "Please enter a valid answer"
                }
            }
            else -> {
                "Please provide a valid answer"
            }
        }
    }

    /**
     * Calculates score for a set of answers
     * Converted from calculateScore() in script.js
     * 
     * @param answers Map of question IDs to user answers
     * @param correctAnswers Map of question IDs to correct answers
     * @return The number of correct answers
     */
    fun calculateScore(
        answers: Map<String, String>,
        correctAnswers: Map<String, List<String>>
    ): Int {
        var score = 0
        
        for ((questionId, userAnswer) in answers) {
            if (isAnswerCorrect(questionId, userAnswer, correctAnswers)) {
                score++
            }
        }
        
        return score
    }

    /**
     * Calculates score for a set of answers using Question objects
     * 
     * @param answers Map of question IDs to user answers
     * @param questions List of questions with correct answers
     * @return The number of correct answers
     */
    fun calculateScore(answers: Map<String, String>, questions: List<Question>): Int {
        var score = 0
        
        for (question in questions) {
            val questionId = question.questionId ?: question.id ?: ""
            val userAnswer = answers[questionId]
            
            if (userAnswer != null && isAnswerCorrect(question, userAnswer)) {
                score++
            }
        }
        
        return score
    }

    /**
     * Gets detailed results for each question
     * 
     * @param answers Map of question IDs to user answers
     * @param questions List of questions with correct answers
     * @return List of QuestionResult objects
     */
    fun getDetailedResults(answers: Map<String, String>, questions: List<Question>): List<QuestionResult> {
        return questions.map { question ->
            val questionId = question.questionId ?: question.id ?: ""
            val userAnswer = answers[questionId] ?: ""
            val isCorrect = isAnswerCorrect(question, userAnswer)
            
            QuestionResult(
                questionId = questionId,
                questionText = question.question,
                userAnswer = userAnswer,
                correctAnswer = question.correctAnswer ?: "",
                isCorrect = isCorrect
            )
        }
    }

    /**
     * Data class for question results
     */
    data class QuestionResult(
        val questionId: String,
        val questionText: String,
        val userAnswer: String,
        val correctAnswer: String,
        val isCorrect: Boolean
    )
}
