package com.mws.testlogic

import java.util.*

/**
 * TestProcessor - Enhanced with JS function conversions and local test processing
 * Source: ../mathayomwatsing/public/script.js - core test functions
 */
class TestProcessor {

    companion object {

        /**
         * Shuffle questions for Multiple Choice, True/False, and Input tests
         * This happens locally on the device to prevent cheating
         */
        fun <T> shuffleQuestions(questions: List<T>): List<T> {
            val shuffled = questions.toMutableList()
            Collections.shuffle(shuffled)
            return shuffled
        }

        /**
         * Shuffle word bank for Matching type tests
         * This happens locally on the device to prevent cheating
         */
        fun shuffleWordBank(wordBank: List<String>): List<String> {
            val shuffled = wordBank.toMutableList()
            Collections.shuffle(shuffled)
            return shuffled
        }

        /**
         * Generate a unique local token for test submission
         * This prevents duplicate submissions and ensures data integrity
         */
        fun generateLocalToken(): String {
            return UUID.randomUUID().toString()
        }

        /**
         * Calculate test score locally
         * This ensures immediate feedback and offline functionality
         * Source: calculateScore() from script.js
         */
        fun calculateScore(answers: Map<String, String>, correctAnswers: Map<String, List<String>>): Double {
            var score = 0
            val totalQuestions = answers.size

            for ((questionId, userAnswer) in answers) {
                if (AnswerValidator.isAnswerCorrect(questionId, userAnswer, correctAnswers)) {
                    score++
                }
            }

            return if (totalQuestions > 0) {
                (score.toDouble() / totalQuestions.toDouble()) * 100.0
            } else {
                0.0
            }
        }

        /**
         * Calculate score for specific test types
         */
        fun calculateScoreForTestType(
            answers: Map<String, String>, 
            correctAnswers: Map<String, String>, 
            testType: String
        ): Double {
            var score = 0
            val totalQuestions = answers.size

            for ((questionId, userAnswer) in answers) {
                val correctAnswer = correctAnswers[questionId] ?: ""
                val isCorrect = when (testType) {
                    "multiple-choice" -> AnswerValidator.isMultipleChoiceAnswerCorrect(userAnswer, correctAnswer)
                    "true-false" -> AnswerValidator.isTrueFalseAnswerCorrect(userAnswer, correctAnswer)
                    "input" -> AnswerValidator.isInputAnswerCorrect(userAnswer, listOf(correctAnswer))
                    "matching_type" -> AnswerValidator.isMatchingAnswerCorrect(userAnswer, correctAnswer)
                    else -> false
                }
                if (isCorrect) score++
            }

            return if (totalQuestions > 0) {
                (score.toDouble() / totalQuestions.toDouble()) * 100.0
            } else {
                0.0
            }
        }

        /**
         * Validate test submission data
         * Ensures data integrity before sending to backend
         */
        fun validateSubmission(
            testId: String,
            localToken: String,
            answers: Map<String, String>
        ): Boolean {
            return testId.isNotEmpty() &&
                   localToken.isNotEmpty() &&
                   answers.isNotEmpty()
        }

        /**
         * Process test answers and calculate score
         * Source: processTestAnswers() from script.js
         */
        fun processTestAnswers(
            answers: Map<String, String>,
            correctAnswers: Map<String, List<String>>,
            testType: String
        ): TestResult {
            val score = calculateScore(answers, correctAnswers)
            val totalQuestions = answers.size
            val correctCount = answers.count { (questionId, userAnswer) ->
                AnswerValidator.isAnswerCorrect(questionId, userAnswer, correctAnswers)
            }

            return TestResult(
                score = score,
                totalQuestions = totalQuestions,
                correctAnswers = correctCount,
                incorrectAnswers = totalQuestions - correctCount,
                testType = testType,
                answers = answers
            )
        }

        /**
         * Collect answers from test form
         * Source: collectTestAnswers() from script.js
         */
        fun collectTestAnswers(testType: String, testId: String): Map<String, String> {
            val answers = mutableMapOf<String, String>()

            when (testType) {
                "multiple-choice", "true-false" -> {
                    // Collect radio button answers
                    // This will be implemented with Android UI components
                }
                "input" -> {
                    // Collect text input answers
                    // This will be implemented with Android UI components
                }
                "matching_type" -> {
                    // Collect matching answers
                    // This will be implemented with Android UI components
                }
            }

            return answers
        }

        /**
         * Validate individual answer
         * Source: isAnswerCorrect() from script.js
         */
        fun validateAnswer(
            questionId: String,
            userAnswer: String,
            correctAnswers: Map<String, List<String>>
        ): Boolean {
            return AnswerValidator.isAnswerCorrect(questionId, userAnswer, correctAnswers)
        }
    }

    /**
     * Data class for test results
     */
    data class TestResult(
        val score: Double,
        val totalQuestions: Int,
        val correctAnswers: Int,
        val incorrectAnswers: Int,
        val testType: String,
        val answers: Map<String, String>
    )
}
