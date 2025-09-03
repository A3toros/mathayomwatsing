package com.mws.testlogic

/**
 * AnswerValidator - Validates answers for all test types
 * Source: isAnswerCorrect() from ../mathayomwatsing/public/script.js
 */
class AnswerValidator {

    companion object {

        /**
         * Main validation method for all question types
         * Source: isAnswerCorrect() from script.js
         */
        fun isAnswerCorrect(
            questionId: String,
            userAnswer: String,
            correctAnswers: Map<String, List<String>>
        ): Boolean {
            val correctAnswerList = correctAnswers[questionId] ?: return false
            
            return correctAnswerList.any { correctAnswer ->
                isAnswerCorrectForType(userAnswer, correctAnswer)
            }
        }

        /**
         * Validates multiple choice answers
         */
        fun isMultipleChoiceAnswerCorrect(userAnswer: String, correctAnswer: String): Boolean {
            return userAnswer.trim().equals(correctAnswer.trim(), ignoreCase = true)
        }

        /**
         * Validates true/false answers
         */
        fun isTrueFalseAnswerCorrect(userAnswer: String, correctAnswer: String): Boolean {
            val normalizedUserAnswer = userAnswer.trim().lowercase()
            val normalizedCorrectAnswer = correctAnswer.trim().lowercase()
            
            return when (normalizedUserAnswer) {
                "true", "t", "1" -> normalizedCorrectAnswer == "true"
                "false", "f", "0" -> normalizedCorrectAnswer == "false"
                else -> false
            }
        }

        /**
         * Validates input answers (text input)
         */
        fun isInputAnswerCorrect(userAnswer: String, correctAnswers: List<String>): Boolean {
            val normalizedUserAnswer = userAnswer.trim().lowercase()
            
            return correctAnswers.any { correctAnswer ->
                val normalizedCorrectAnswer = correctAnswer.trim().lowercase()
                normalizedUserAnswer == normalizedCorrectAnswer
            }
        }

        /**
         * Validates matching type answers
         */
        fun isMatchingAnswerCorrect(userAnswer: String, correctAnswer: String): Boolean {
            val normalizedUserAnswer = userAnswer.trim().lowercase()
            val normalizedCorrectAnswer = correctAnswer.trim().lowercase()
            
            return normalizedUserAnswer == normalizedCorrectAnswer
        }

        /**
         * Validates answer based on question type
         */
        private fun isAnswerCorrectForType(userAnswer: String, correctAnswer: String): Boolean {
            return when {
                // Multiple choice (numeric index)
                userAnswer.matches(Regex("^[0-3]$")) -> {
                    userAnswer == correctAnswer
                }
                // True/False
                userAnswer.lowercase() in listOf("true", "false") -> {
                    userAnswer.lowercase() == correctAnswer.lowercase()
                }
                // Text input (case-insensitive)
                else -> {
                    userAnswer.trim().lowercase() == correctAnswer.trim().lowercase()
                }
            }
        }

        /**
         * Validates answer format for specific question types
         */
        fun validateAnswerFormat(questionType: String, userAnswer: String): Boolean {
            return when (questionType) {
                "multiple-choice" -> userAnswer.matches(Regex("^[0-3]$"))
                "true-false" -> userAnswer.lowercase() in listOf("true", "false")
                "input" -> userAnswer.trim().isNotEmpty()
                "matching_type" -> userAnswer.trim().isNotEmpty()
                else -> false
            }
        }
        
        /**
         * Gets validation error message for specific question types
         */
        fun getValidationErrorMessage(questionType: String): String {
            return when (questionType) {
                "multiple-choice" -> "Please select an option (A, B, C, or D)"
                "true-false" -> "Please select True or False"
                "input" -> "Please enter your answer"
                "matching_type" -> "Please provide your answer"
                else -> "Invalid answer format"
            }
        }

        /**
         * Gets validation error message for invalid answers
         */
        fun getValidationErrorMessage(questionType: String, userAnswer: String): String? {
            return when (questionType) {
                "multiple-choice" -> {
                    if (!userAnswer.matches(Regex("^[0-3]$"))) {
                        "Please select a valid option (A, B, C, or D)"
                    } else null
                }
                "true-false" -> {
                    if (userAnswer.lowercase() !in listOf("true", "false")) {
                        "Please select True or False"
                    } else null
                }
                "input" -> {
                    if (userAnswer.trim().isEmpty()) {
                        "Please enter your answer"
                    } else null
                }
                "matching_type" -> {
                    if (userAnswer.trim().isEmpty()) {
                        "Please enter your answer"
                    } else null
                }
                else -> "Invalid question type"
            }
        }

        /**
         * Normalizes answer for consistent comparison
         */
        fun normalizeAnswer(answer: String): String {
            return answer.trim().lowercase()
        }

        /**
         * Checks if answer is partially correct (for partial credit)
         */
        fun isPartiallyCorrect(
            userAnswer: String,
            correctAnswers: List<String>,
            questionType: String
        ): Boolean {
            return when (questionType) {
                "input" -> {
                    // Check if user answer contains any part of correct answers
                    val normalizedUserAnswer = normalizeAnswer(userAnswer)
                    correctAnswers.any { correctAnswer ->
                        val normalizedCorrectAnswer = normalizeAnswer(correctAnswer)
                        normalizedUserAnswer.contains(normalizedCorrectAnswer) ||
                        normalizedCorrectAnswer.contains(normalizedUserAnswer)
                    }
                }
                else -> false
            }
        }
    }
}
