package com.mws.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mws.R
import com.mws.models.Question

/**
 * QuestionResultAdapter - Displays question results with correct/incorrect indicators
 * Shows user answers, correct answers, and performance for each question
 */
class QuestionResultAdapter(
    private val questions: List<Question>,
    private val userAnswers: Map<String, String>
) : ListAdapter<Question, QuestionResultAdapter.QuestionResultViewHolder>(QuestionResultDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuestionResultViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_question_result, parent, false)
        return QuestionResultViewHolder(view)
    }

    override fun onBindViewHolder(holder: QuestionResultViewHolder, position: Int) {
        val question = questions[position]
        val userAnswer = userAnswers[question.questionId]
        holder.bind(question, userAnswer)
    }

    override fun getItemCount(): Int = questions.size

    class QuestionResultViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val questionNumber: TextView = itemView.findViewById(R.id.questionNumber)
        private val questionText: TextView = itemView.findViewById(R.id.questionText)
        private val questionType: TextView = itemView.findViewById(R.id.questionType)
        private val userAnswerLabel: TextView = itemView.findViewById(R.id.userAnswerLabel)
        private val userAnswer: TextView = itemView.findViewById(R.id.userAnswer)
        private val correctAnswerLabel: TextView = itemView.findViewById(R.id.correctAnswerLabel)
        private val correctAnswer: TextView = itemView.findViewById(R.id.correctAnswer)
        private val resultIndicator: View = itemView.findViewById(R.id.resultIndicator)

        fun bind(question: Question, userAnswerString: String?) {
            val position = adapterPosition + 1
            
            // Set question number and text
            questionNumber.text = position.toString()
            questionText.text = question.question
            questionType.text = getQuestionTypeDisplayName(question.questionType)

            // Set user answer
            userAnswerLabel.text = "Your Answer:"
            userAnswer.text = formatUserAnswer(question, userAnswerString)

            // Set correct answer
            correctAnswerLabel.text = "Correct Answer:"
            correctAnswer.text = formatCorrectAnswer(question)

            // Set result indicator
            val isCorrect = isAnswerCorrect(question, userAnswerString)
            setResultIndicator(isCorrect)

            // Set text colors based on correctness
            setTextColors(isCorrect)
        }

        private fun formatUserAnswer(question: Question, userAnswer: String?): String {
            if (userAnswer.isNullOrEmpty()) {
                return "Not answered"
            }

            return when (question.questionType) {
                "multiple-choice" -> {
                    val index = userAnswer.toIntOrNull() ?: -1
                    if (index >= 0 && index < (question.options?.size ?: 0)) {
                        question.options!![index]
                    } else {
                        "Invalid option"
                    }
                }
                "true-false" -> userAnswer.capitalize()
                "input" -> userAnswer
                "matching_type" -> userAnswer
                else -> userAnswer
            }
        }

        private fun formatCorrectAnswer(question: Question): String {
            return when (question.questionType) {
                "multiple-choice" -> {
                    val index = question.correctAnswer?.toIntOrNull() ?: -1
                    if (index >= 0 && index < (question.options?.size ?: 0)) {
                        question.options!![index]
                    } else {
                        "Invalid option"
                    }
                }
                "true-false" -> question.correctAnswer?.capitalize() ?: "N/A"
                "input" -> question.correctAnswers?.joinToString(", ") ?: question.correctAnswer ?: "N/A"
                "matching_type" -> question.coordinates?.joinToString(", ") ?: "N/A"
                else -> question.correctAnswer ?: "N/A"
            }
        }

        private fun isAnswerCorrect(question: Question, userAnswer: String?): Boolean {
            if (userAnswer.isNullOrEmpty()) return false

            return when (question.questionType) {
                "multiple-choice" -> {
                    userAnswer == question.correctAnswer
                }
                "true-false" -> {
                    userAnswer.lowercase() == question.correctAnswer?.lowercase()
                }
                "input" -> {
                    question.correctAnswers?.any { 
                        it.equals(userAnswer, ignoreCase = true) 
                    } ?: false
                }
                "matching_type" -> {
                    // TODO: Implement matching answer validation
                    false
                }
                else -> false
            }
        }

        private fun setResultIndicator(isCorrect: Boolean) {
            val colorRes = if (isCorrect) R.color.success else R.color.error
            resultIndicator.setBackgroundColor(
                ContextCompat.getColor(itemView.context, colorRes)
            )
        }

        private fun setTextColors(isCorrect: Boolean) {
            val colorRes = if (isCorrect) R.color.success else R.color.error
            val color = ContextCompat.getColor(itemView.context, colorRes)
            
            userAnswer.setTextColor(color)
            userAnswerLabel.setTextColor(color)
        }

        private fun getQuestionTypeDisplayName(type: String): String {
            return when (type) {
                "multiple-choice" -> "Multiple Choice"
                "true-false" -> "True/False"
                "input" -> "Input"
                "matching_type" -> "Matching"
                else -> type.capitalize()
            }
        }

        private fun String.capitalize(): String {
            return if (isNotEmpty()) {
                this[0].uppercase() + substring(1)
            } else this
        }
    }

    private class QuestionResultDiffCallback : DiffUtil.ItemCallback<Question>() {
        override fun areItemsTheSame(oldItem: Question, newItem: Question): Boolean {
            return oldItem.questionId == newItem.questionId
        }

        override fun areContentsTheSame(oldItem: Question, newItem: Question): Boolean {
            return oldItem == newItem
        }
    }
}
