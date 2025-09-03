package com.mws.testlogic

import com.mws.models.Question
import com.mws.models.TestInfo

/**
 * TestRenderer - Converts JavaScript test rendering logic to Kotlin
 * Source: ../mathayomwatsing/public/script.js - render functions
 * Now integrated with TestFormManager for progress tracking
 */
class TestRenderer(private val formManager: TestFormManager) {

    companion object {

        /**
         * Renders true/false questions for display
         * Source: renderTrueFalseQuestionsForPage()
         */
        fun renderTrueFalseQuestions(questions: List<Question>, testId: String, formManager: TestFormManager): String {
            var html = ""

            questions.forEachIndexed { index, question ->
                val questionId = question.questionId ?: index.toString()
                val savedAnswer = formManager.getTestProgress("true_false", testId)[questionId]

                html += """
                    <div class="question-container ${if (savedAnswer != null) "answered" else ""}" data-question-id="$questionId">
                        <h4>Question ${index + 1}</h4>
                        <p class="question-text">${question.question}</p>
                        <div class="answer-options">
                            <label class="radio-option">
                                <input type="radio" name="question_$questionId" value="true"
                                       ${if (savedAnswer == "true") "checked" else ""} data-question-id="$questionId">
                                <span class="radio-custom"></span>
                                True
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="question_$questionId" value="false"
                                       ${if (savedAnswer == "false") "checked" else ""} data-question-id="$questionId">
                                <span class="radio-custom"></span>
                                False
                            </label>
                        </div>
                    </div>
                """.trimIndent()
            }

            return html
        }

        /**
         * Renders multiple choice questions for display
         * Source: renderMultipleChoiceQuestionsForPage()
         */
        fun renderMultipleChoiceQuestions(questions: List<Question>, testId: String, formManager: TestFormManager): String {
            var html = ""

            questions.forEachIndexed { index, question ->
                val questionId = question.questionId ?: index.toString()
                val savedAnswer = formManager.getTestProgress("multiple_choice", testId)[questionId]

                html += """
                    <div class="question-container ${if (savedAnswer != null) "answered" else ""}" data-question-id="$questionId">
                        <h4>Question ${index + 1}</h4>
                        <p class="question-text">${question.question}</p>
                        <div class="answer-options">
                """.trimIndent()

                // Parse options from the question
                val options = question.options ?: emptyList()
                options.forEachIndexed { optionIndex, option ->
                    html += """
                        <label class="radio-option">
                            <input type="radio" name="question_$questionId" value="$optionIndex"
                                   ${if (savedAnswer == optionIndex.toString()) "checked" else ""} data-question-id="$questionId">
                            <span class="radio-custom"></span>
                            $option
                        </label>
                    """.trimIndent()
                }

                html += """
                        </div>
                    </div>
                """.trimIndent()
            }

            return html
        }

        /**
         * Renders input questions for display
         * Source: renderInputQuestionsForPage()
         */
        fun renderInputQuestions(questions: List<Question>, testId: String, formManager: TestFormManager): String {
            var html = ""

            questions.forEachIndexed { index, question ->
                val questionId = question.questionId ?: index.toString()
                val savedAnswer = formManager.getTestProgress("input", testId)[questionId]

                val questionHtml = """
                    <div class="question-container ${if (savedAnswer != null) "answered" else ""}" data-question-id="$questionId">
                        <h4>Question ${index + 1}</h4>
                        <p class="question-text">${question.question}</p>

                        <div class="input-question">
                            <input type="text"
                                   id="input_$questionId"
                                   placeholder="Enter your answer"
                                   value="${savedAnswer ?: ""}"
                                   data-question-id="$questionId">
                        </div>
                    </div>
                """.trimIndent()

                html += questionHtml
            }

            return html
        }

        /**
         * Renders matching type questions for display
         * Source: renderMatchingTypeQuestionsForPage() (adapted for Android)
         */
        fun renderMatchingQuestions(questions: List<Question>, testId: String, formManager: TestFormManager): String {
            var html = ""

            questions.forEachIndexed { index, question ->
                val questionId = question.questionId ?: index.toString()
                val savedAnswer = formManager.getTestProgress("matching_type", testId)[questionId]

                html += """
                    <div class="question-container ${if (savedAnswer != null) "answered" else ""}" data-question-id="$questionId">
                        <h4>Question ${index + 1}</h4>
                        <p class="question-text">${question.question}</p>
                        
                        <div class="matching-container">
                            <div class="word-bank">
                                <h5>Word Bank:</h5>
                                <div class="words">
                                    ${(question.wordBank ?: emptyList()).joinToString(" ") { "<span class='word'>$it</span>" }}
                                </div>
                            </div>
                            
                            <div class="answer-input">
                                <input type="text"
                                       id="matching_$questionId"
                                       placeholder="Enter your answer"
                                       value="${savedAnswer ?: ""}"
                                       data-question-id="$questionId">
                            </div>
                        </div>
                    </div>
                """.trimIndent()
            }

            return html
        }
    }
}
