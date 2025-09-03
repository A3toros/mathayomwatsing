package com.mws.utils

object ScoreCalculator {
    
    /**
     * Calculate score based on correct answers and total questions
     */
    fun calculateScore(correctAnswers: Int, totalQuestions: Int): Double {
        return if (totalQuestions > 0) {
            (correctAnswers.toDouble() / totalQuestions.toDouble()) * 100.0
        } else {
            0.0
        }
    }
    
    /**
     * Calculate score based on points earned and max points
     */
    fun calculateScoreFromPoints(earnedPoints: Double, maxPoints: Double): Double {
        return if (maxPoints > 0) {
            (earnedPoints / maxPoints) * 100.0
        } else {
            0.0
        }
    }
    
    /**
     * Get grade based on percentage score
     */
    fun getGrade(percentage: Double): String {
        return when {
            percentage >= 80 -> "A"
            percentage >= 70 -> "B"
            percentage >= 60 -> "C"
            percentage >= 50 -> "D"
            else -> "F"
        }
    }
}
