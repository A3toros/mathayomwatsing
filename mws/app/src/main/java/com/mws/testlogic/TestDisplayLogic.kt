package com.mws.testlogic

import com.mws.models.Question
import com.mws.models.TestInfo

/**
 * TestDisplayLogic - Converts JavaScript test display logic to Kotlin
 * Source: ../mathayomwatsing/public/script.js - display functions
 * Now integrated with TestFormManager and TestRenderer
 */
class TestDisplayLogic(private val formManager: TestFormManager) {

    private val testRenderer = TestRenderer(formManager)

    companion object {

        /**
         * Displays test on page with questions
         * Source: displayTestOnPage()
         */
        fun displayTestOnPage(
            testInfo: TestInfo, 
            questions: List<Question>, 
            testType: String, 
            testId: String,
            formManager: TestFormManager
        ): TestDisplayData {
            // Special handling for matching type tests - redirect to dedicated page
            if (testType == "matching_type") {
                return TestDisplayData(
                    shouldRedirect = true,
                    redirectUrl = "matching-test-student.html?test_id=$testId",
                    questions = emptyList(),
                    testInfo = testInfo
                )
            }

            // Process questions for display
            val processedQuestions = processQuestionsForDisplay(questions, testType)
            
            return TestDisplayData(
                shouldRedirect = false,
                redirectUrl = null,
                questions = processedQuestions,
                testInfo = testInfo
            )
        }

        /**
         * Renders questions for the test page
         * Source: renderQuestionsForPage()
         */
        fun renderQuestionsForPage(
            questions: List<Question>, 
            testType: String, 
            testId: String,
            formManager: TestFormManager
        ): List<QuestionDisplayData> {
            val renderedQuestions = mutableListOf<QuestionDisplayData>()

            questions.forEachIndexed { index, question ->
                val questionId = question.questionId ?: index.toString()
                
                // Render based on question type
                val renderedHtml = when (testType) {
                    "true-false" -> TestRenderer.renderTrueFalseQuestions(listOf(question), testId, formManager)
                    "multiple-choice" -> TestRenderer.renderMultipleChoiceQuestions(listOf(question), testId, formManager)
                    "input" -> TestRenderer.renderInputQuestions(listOf(question), testId, formManager)
                    else -> generateFallbackHtml(question, index, testId)
                }

                renderedQuestions.add(
                    QuestionDisplayData(
                        questionId = questionId,
                        questionIndex = index,
                        questionText = question.question,
                        renderedHtml = renderedHtml,
                        questionType = testType
                    )
                )
            }

            return renderedQuestions
        }

        /**
         * Processes questions for display
         * Source: processQuestionsForDisplay()
         */
        private fun processQuestionsForDisplay(questions: List<Question>, testType: String): List<Question> {
            return questions.map { question ->
                when (testType) {
                    "multiple-choice" -> processMultipleChoiceQuestion(question)
                    "true-false" -> processTrueFalseQuestion(question)
                    "input" -> processInputQuestion(question)
                    "matching_type" -> processMatchingQuestion(question)
                    else -> question
                }
            }
        }

        /**
         * Processes multiple choice question
         */
        private fun processMultipleChoiceQuestion(question: Question): Question {
            // Parse options from the question if they exist
            val options = question.options ?: emptyList()
            return question.copy(options = options)
        }

        /**
         * Processes true/false question
         */
        private fun processTrueFalseQuestion(question: Question): Question {
            // True/false questions don't need special processing
            return question
        }

        /**
         * Processes input question
         */
        private fun processInputQuestion(question: Question): Question {
            // Input questions might have multiple correct answers
            val correctAnswers = question.correctAnswers ?: listOf(question.correctAnswer ?: "")
            return question.copy(correctAnswers = correctAnswers)
        }

        /**
         * Processes matching question
         */
        private fun processMatchingQuestion(question: Question): Question {
            // Matching questions have word banks and coordinates
            return question
        }

        /**
         * Generates fallback HTML for unknown question types
         * Source: fallback HTML generation in renderQuestionsForPage()
         */
        private fun generateFallbackHtml(question: Question, index: Int, testId: String): String {
            val questionId = question.questionId ?: index.toString()
            return """
                <div class="question-container" data-question-id="$questionId">
                    <h4>Question ${index + 1}</h4>
                    <p class="question-text">${question.question ?: "Question text not available"}</p>
                    <div class="input-question">
                        <input type="text"
                               id="input_$questionId"
                               placeholder="Enter your answer"
                               data-question-id="$questionId">
                    </div>
                </div>
            """.trimIndent()
        }

        /**
         * Sets up event listeners for the test page
         * Source: setupTestPageEventListeners()
         */
        fun setupTestPageEventListeners(testType: String, testId: String, studentId: String): TestEventListeners {
            return TestEventListeners(
                testType = testType,
                testId = testId,
                studentId = studentId,
                hasRadioButtons = testType == "true-false" || testType == "multiple-choice",
                hasInputFields = testType == "input",
                hasMatchingElements = testType == "matching_type"
            )
        }

        /**
         * Gets current test type from page elements
         * Source: getCurrentTestType()
         */
        fun getCurrentTestType(): String? {
            return when {
                documentContainsElement(".true-false-container") -> "true-false"
                documentContainsElement(".multiple-choice-container") -> "multiple-choice"
                documentContainsElement(".input-container") -> "input"
                documentContainsElement(".matching-container") -> "matching_type"
                else -> null
            }
        }

        /**
         * Placeholder for document element checking
         * This will be implemented with actual Android UI components
         */
        private fun documentContainsElement(selector: String): Boolean {
            // TODO: Implement with Android UI component checking
            return false
        }
    }

    /**
     * Data class for test display information
     */
    data class TestDisplayData(
        val shouldRedirect: Boolean,
        val redirectUrl: String?,
        val questions: List<Question>,
        val testInfo: TestInfo
    )

    /**
     * Data class for question display information
     */
    data class QuestionDisplayData(
        val questionId: String,
        val questionIndex: Int,
        val questionText: String?,
        val renderedHtml: String,
        val questionType: String
    )

    /**
     * Data class for test event listeners
     */
    data class TestEventListeners(
        val testType: String,
        val testId: String,
        val studentId: String,
        val hasRadioButtons: Boolean,
        val hasInputFields: Boolean,
        val hasMatchingElements: Boolean
    )
}
