package com.mws.testlogic

import android.content.Context
import android.widget.Toast
import com.mws.models.Question
import com.mws.models.TestInfo
import com.mws.utils.ScoreCalculator

/**
 * TestSubmissionManager - Manages test submission process and confirmation
 * Handles validation, submission confirmation, and result processing
 */
class TestSubmissionManager(
    private val context: Context,
    private val answerInputManager: AnswerInputManager,
    private val testProcessor: TestProcessor
) {

    private var currentTestInfo: TestInfo? = null
    private var currentQuestions: List<Question> = emptyList()
    private var submissionAttempted = false

    /**
     * Sets the current test context
     */
    fun setTestContext(testInfo: TestInfo, questions: List<Question>) {
        currentTestInfo = testInfo
        currentQuestions = questions
        submissionAttempted = false
    }

    /**
     * Prepares test submission data
     */
    fun prepareSubmission(): SubmissionData {
        val answers = answerInputManager.getAllAnswers()
        val validationSummary = answerInputManager.validateAllAnswers(currentQuestions)
        val statistics = answerInputManager.getAnswerStatistics(currentQuestions)
        
        return SubmissionData(
            testInfo = currentTestInfo,
            questions = currentQuestions,
            answers = answers,
            validationSummary = validationSummary,
            statistics = statistics,
            canSubmit = validationSummary.canSubmit,
            submissionTimestamp = System.currentTimeMillis()
        )
    }
    
    /**
     * Prepares TestSubmissionData for backend API
     */
    fun prepareTestSubmissionData(): com.mws.models.TestSubmissionData? {
        val testInfo = currentTestInfo ?: return null
        val answers = answerInputManager.getAllAnswers()
        
        // Calculate score
        val score = ScoreCalculator.calculateScoreFromPoints(answers.size.toDouble(), currentQuestions.size.toDouble())
        val maxScore = currentQuestions.size.toDouble()
        
        // Get student info from session (this would need to be injected)
        // For now, return null to indicate this needs to be handled by the calling activity
        return null
    }

    /**
     * Validates submission before processing
     */
    fun validateSubmission(submissionData: SubmissionData): ValidationResult {
        if (submissionData.testInfo == null) {
            return ValidationResult(
                isValid = false,
                errorMessage = "Test information not available"
            )
        }

        if (submissionData.questions.isEmpty()) {
            return ValidationResult(
                isValid = false,
                errorMessage = "No questions available for submission"
            )
        }

        if (submissionData.answers.isEmpty()) {
            return ValidationResult(
                isValid = false,
                errorMessage = "No answers provided"
            )
        }

        // Check if all questions are answered
        val unansweredCount = submissionData.statistics.unansweredQuestions
        if (unansweredCount > 0) {
            return ValidationResult(
                isValid = false,
                errorMessage = "$unansweredCount questions are unanswered",
                isIncomplete = true,
                unansweredCount = unansweredCount
            )
        }

        // Check for invalid answers
        if (submissionData.validationSummary.invalidAnswers > 0) {
            return ValidationResult(
                isValid = false,
                errorMessage = "${submissionData.validationSummary.invalidAnswers} answers are invalid",
                hasInvalidAnswers = true,
                invalidAnswerCount = submissionData.validationSummary.invalidAnswers
            )
        }

        return ValidationResult(isValid = true)
    }

    /**
     * Processes test submission
     */
    fun processSubmission(submissionData: SubmissionData): SubmissionResult {
        if (submissionAttempted) {
            return SubmissionResult(
                success = false,
                errorMessage = "Submission already attempted"
            )
        }

        // Validate submission
        val validationResult = validateSubmission(submissionData)
        if (!validationResult.isValid) {
            return SubmissionResult(
                success = false,
                errorMessage = validationResult.errorMessage
            )
        }

        try {
            // Calculate score locally
            val correctAnswers = extractCorrectAnswers(submissionData.questions)
            val score = ScoreCalculator.calculateScoreFromPoints(submissionData.answers.size.toDouble(), correctAnswers.size.toDouble())
            
            // Create test result
            val testResult = TestResult(
                testId = submissionData.testInfo?.id ?: "",
                testType = submissionData.testInfo?.type ?: "",
                score = score,
                totalQuestions = submissionData.questions.size,
                answeredQuestions = submissionData.statistics.answeredQuestions,
                submissionTime = submissionData.submissionTimestamp,
                answers = submissionData.answers
            )

            // Mark submission as attempted
            submissionAttempted = true

            return SubmissionResult(
                success = true,
                testResult = testResult,
                message = "Test submitted successfully"
            )

        } catch (e: Exception) {
            return SubmissionResult(
                success = false,
                errorMessage = "Error processing submission: ${e.message}"
            )
        }
    }

    /**
     * Extracts correct answers from questions
     */
    private fun extractCorrectAnswers(questions: List<Question>): Map<String, List<String>> {
        val correctAnswers = mutableMapOf<String, List<String>>()
        
        questions.forEach { question ->
            val questionId = question.questionId ?: ""
            when (question.questionType) {
                "multiple-choice" -> {
                    question.correctAnswer?.let { correct ->
                        correctAnswers[questionId] = listOf(correct)
                    }
                }
                "true-false" -> {
                    question.correctAnswer?.let { correct ->
                        correctAnswers[questionId] = listOf(correct)
                    }
                }
                "input" -> {
                    question.correctAnswers?.let { corrects ->
                        correctAnswers[questionId] = corrects
                    }
                }
                "matching_type" -> {
                    question.coordinates?.let { coords ->
                        correctAnswers[questionId] = coords
                    }
                }
            }
        }
        
        return correctAnswers
    }

    /**
     * Gets submission summary for user review
     */
    fun getSubmissionSummary(): SubmissionSummary {
        val submissionData = prepareSubmission()
        val validationResult = validateSubmission(submissionData)
        
        return SubmissionSummary(
            testName = submissionData.testInfo?.name ?: "Unknown Test",
            totalQuestions = submissionData.questions.size,
            answeredQuestions = submissionData.statistics.answeredQuestions,
            unansweredQuestions = submissionData.statistics.unansweredQuestions,
            completionPercentage = submissionData.statistics.completionPercentage,
            canSubmit = submissionData.canSubmit,
            validationResult = validationResult,
            estimatedScore = if (validationResult.isValid) {
                calculateEstimatedScore(submissionData)
            } else null
        )
    }

    /**
     * Calculates estimated score based on current answers
     */
    private fun calculateEstimatedScore(submissionData: SubmissionData): Double {
        val correctAnswers = extractCorrectAnswers(submissionData.questions)
        return ScoreCalculator.calculateScoreFromPoints(submissionData.answers.size.toDouble(), correctAnswers.size.toDouble())
    }

    /**
     * Shows submission confirmation dialog
     */
    fun showSubmissionConfirmation(
        submissionSummary: SubmissionSummary,
        onConfirm: () -> Unit,
        onCancel: () -> Unit
    ) {
        val message = buildSubmissionConfirmationMessage(submissionSummary)
        
        // Show confirmation dialog (this will be handled by the UI)
        // For now, just show a toast
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        
        // Call confirm callback
        onConfirm()
    }

    /**
     * Builds submission confirmation message
     */
    private fun buildSubmissionConfirmationMessage(summary: SubmissionSummary): String {
        val baseMessage = "Submit test '${summary.testName}'?"
        
        if (summary.unansweredQuestions > 0) {
            return "$baseMessage\n\n⚠️ You have ${summary.unansweredQuestions} unanswered questions."
        }
        
        if (summary.completionPercentage < 100) {
            return "$baseMessage\n\n⚠️ Test is ${String.format("%.1f", summary.completionPercentage)}% complete."
        }
        
        return "$baseMessage\n\n✅ Test is complete and ready for submission."
    }

    /**
     * Resets submission state
     */
    fun resetSubmission() {
        submissionAttempted = false
    }

    /**
     * Checks if submission is allowed
     */
    fun isSubmissionAllowed(): Boolean {
        val submissionData = prepareSubmission()
        val validationResult = validateSubmission(submissionData)
        return validationResult.isValid && !submissionAttempted
    }

    /**
     * Data class for submission data
     */
    data class SubmissionData(
        val testInfo: TestInfo?,
        val questions: List<Question>,
        val answers: Map<String, String>,
        val validationSummary: AnswerInputManager.ValidationSummary,
        val statistics: AnswerInputManager.AnswerStatistics,
        val canSubmit: Boolean,
        val submissionTimestamp: Long
    )

    /**
     * Data class for validation result
     */
    data class ValidationResult(
        val isValid: Boolean,
        val errorMessage: String? = null,
        val isIncomplete: Boolean = false,
        val unansweredCount: Int = 0,
        val hasInvalidAnswers: Boolean = false,
        val invalidAnswerCount: Int = 0
    )

    /**
     * Data class for submission result
     */
    data class SubmissionResult(
        val success: Boolean,
        val testResult: TestResult? = null,
        val message: String? = null,
        val errorMessage: String? = null
    )

    /**
     * Data class for test result
     */
    data class TestResult(
        val testId: String,
        val testType: String,
        val score: Double,
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val submissionTime: Long,
        val answers: Map<String, String>
    )

    /**
     * Data class for submission summary
     */
    data class SubmissionSummary(
        val testName: String,
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val unansweredQuestions: Int,
        val completionPercentage: Float,
        val canSubmit: Boolean,
        val validationResult: ValidationResult,
        val estimatedScore: Double?
    )
}
