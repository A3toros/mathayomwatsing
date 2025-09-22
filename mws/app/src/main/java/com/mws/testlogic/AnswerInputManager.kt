package com.mws.testlogic

import android.content.Context
import android.widget.Toast
import com.mws.models.Question

/**
 * AnswerInputManager - Manages answer input, validation, and collection
 * Integrates with AnswerValidator and TestFormManager
 */
class AnswerInputManager(
    private val context: Context,
    private val formManager: TestFormManager
) {

    private val answerValidator = AnswerValidator()
    private val currentAnswers = mutableMapOf<String, String>()
    private var currentTestType: String = ""
    private var currentTestId: String = ""

    /**
     * Sets the current test context
     */
    fun setTestContext(testType: String, testId: String) {
        currentTestType = testType
        currentTestId = testId
        
        // Load existing answers
        val savedAnswers = formManager.getTestProgress(testType, testId)
        currentAnswers.clear()
        currentAnswers.putAll(savedAnswers)
    }

    /**
     * Records an answer for a question
     */
    fun recordAnswer(questionId: String, answer: String): AnswerValidationResult {
        // Validate answer format
        val formatValidation = AnswerValidator.validateAnswerFormat(currentTestType, answer)
        
        if (!formatValidation) {
            val errorMessage = AnswerValidator.getValidationErrorMessage(currentTestType, answer)
            return AnswerValidationResult(
                isValid = false,
                errorMessage = errorMessage,
                answer = answer
            )
        }

        // Store answer
        currentAnswers[questionId] = answer
        
        // Save to persistent storage
        formManager.saveTestProgress(currentTestType, currentTestId, questionId, answer)
        
        return AnswerValidationResult(
            isValid = true,
            errorMessage = null,
            answer = answer
        )
    }

    /**
     * Gets current answer for a question
     */
    fun getCurrentAnswer(questionId: String): String? {
        return currentAnswers[questionId]
    }

    /**
     * Gets all current answers
     */
    fun getAllAnswers(): Map<String, String> {
        return currentAnswers.toMap()
    }

    /**
     * Validates all answers before submission
     */
    fun validateAllAnswers(questions: List<Question>): ValidationSummary {
        val validationResults = mutableListOf<QuestionValidationResult>()
        var totalValid = 0
        var totalInvalid = 0
        
        questions.forEach { question ->
            val questionId = question.questionId ?: ""
            val answer = currentAnswers[questionId]
            
            if (answer != null) {
                val isValid = AnswerValidator.validateAnswerFormat(question.questionType ?: "", answer)
                val errorMessage = if (!isValid) {
                    AnswerValidator.getValidationErrorMessage(question.questionType ?: "", answer)
                } else null
                
                validationResults.add(
                    QuestionValidationResult(
                        questionId = questionId,
                        questionText = question.question ?: "",
                        userAnswer = answer,
                        isValid = isValid,
                        errorMessage = errorMessage
                    )
                )
                
                if (isValid) totalValid++ else totalInvalid++
            } else {
                // No answer provided
                validationResults.add(
                    QuestionValidationResult(
                        questionId = questionId,
                        questionText = question.question ?: "",
                        userAnswer = null,
                        isValid = false,
                        errorMessage = "No answer provided"
                    )
                )
                totalInvalid++
            }
        }
        
        return ValidationSummary(
            totalQuestions = questions.size,
            answeredQuestions = currentAnswers.size,
            validAnswers = totalValid,
            invalidAnswers = totalInvalid,
            validationResults = validationResults,
            canSubmit = totalInvalid == 0 && currentAnswers.size == questions.size
        )
    }

    /**
     * Shows validation errors to user
     */
    fun showValidationErrors(validationSummary: ValidationSummary) {
        if (validationSummary.invalidAnswers > 0) {
            val errorMessages = validationSummary.validationResults
                .filter { !it.isValid }
                .mapNotNull { it.errorMessage }
                .distinct()
                .take(3) // Show max 3 errors
            
            val errorText = errorMessages.joinToString("\n")
            Toast.makeText(context, "Please fix the following errors:\n$errorText", Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Calculates completion percentage
     */
    fun getCompletionPercentage(totalQuestions: Int): Float {
        return if (totalQuestions > 0) {
            (currentAnswers.size.toFloat() / totalQuestions.toFloat()) * 100
        } else 0f
    }

    /**
     * Gets unanswered questions
     */
    fun getUnansweredQuestions(questions: List<Question>): List<Question> {
        return questions.filter { question ->
            val questionId = question.questionId ?: ""
            !currentAnswers.containsKey(questionId)
        }
    }

    /**
     * Marks a question as answered
     */
    fun markQuestionAsAnswered(questionId: String) {
        if (!currentAnswers.containsKey(questionId)) {
            currentAnswers[questionId] = "" // Empty answer to mark as attempted
            formManager.saveTestProgress(currentTestType, currentTestId, questionId, "")
        }
    }

    /**
     * Clears all answers for current test
     */
    fun clearAllAnswers() {
        currentAnswers.clear()
        formManager.clearTestProgress(currentTestType, currentTestId)
    }

    /**
     * Gets answer statistics
     */
    fun getAnswerStatistics(questions: List<Question>): AnswerStatistics {
        val totalQuestions = questions.size
        val answeredQuestions = currentAnswers.size
        val unansweredQuestions = totalQuestions - answeredQuestions
        
        val completionPercentage = getCompletionPercentage(totalQuestions)
        
        return AnswerStatistics(
            totalQuestions = totalQuestions,
            answeredQuestions = answeredQuestions,
            unansweredQuestions = unansweredQuestions,
            completionPercentage = completionPercentage
        )
    }

    /**
     * Data class for answer validation result
     */
    data class AnswerValidationResult(
        val isValid: Boolean,
        val errorMessage: String?,
        val answer: String
    )

    /**
     * Data class for question validation result
     */
    data class QuestionValidationResult(
        val questionId: String,
        val questionText: String,
        val userAnswer: String?,
        val isValid: Boolean,
        val errorMessage: String?
    )

    /**
     * Data class for validation summary
     */
    data class ValidationSummary(
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val validAnswers: Int,
        val invalidAnswers: Int,
        val validationResults: List<QuestionValidationResult>,
        val canSubmit: Boolean
    )

    /**
     * Data class for answer statistics
     */
    data class AnswerStatistics(
        val totalQuestions: Int,
        val answeredQuestions: Int,
        val unansweredQuestions: Int,
        val completionPercentage: Float
    )
}
