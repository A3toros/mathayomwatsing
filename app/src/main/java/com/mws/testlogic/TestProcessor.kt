package com.mws.testlogic

import java.util.*

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
         */
        fun calculateScore(correctAnswers: Int, totalQuestions: Int): Double {
            return if (totalQuestions > 0) {
                (correctAnswers.toDouble() / totalQuestions.toDouble()) * 100.0
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
            answers: Map<String, Any>
        ): Boolean {
            return testId.isNotEmpty() && 
                   localToken.isNotEmpty() && 
                   answers.isNotEmpty()
        }
    }
}
