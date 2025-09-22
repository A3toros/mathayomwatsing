package com.mws.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mws.R
import com.mws.models.Question

/**
 * QuestionAdapter - Adapter for displaying different question types
 * Handles multiple choice, true/false, input, and matching questions
 */
class QuestionAdapter(
    private val onAnswerChanged: (String, String) -> Unit
) : ListAdapter<Question, QuestionAdapter.QuestionViewHolder>(QuestionDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuestionViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_question, parent, false)
        return QuestionViewHolder(view, onAnswerChanged)
    }

    override fun onBindViewHolder(holder: QuestionViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class QuestionViewHolder(
        itemView: View,
        private val onAnswerChanged: (String, String) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {

        private val questionNumber: TextView = itemView.findViewById(R.id.questionNumber)
        // TODO: Fix layout file issues
        // private val questionTypeBadge: TextView = itemView.findViewById(R.id.questionTypeBadge)
        private val questionText: TextView = itemView.findViewById(R.id.questionText)
        // private val multipleChoiceLayout: View = itemView.findViewById(R.id.multipleChoiceLayout)
        // private val trueFalseLayout: View = itemView.findViewById(R.id.trueFalseLayout)
        // private val inputLayout: View = itemView.findViewById(R.id.inputLayout)
        // private val matchingLayout: View = itemView.findViewById(R.id.matchingLayout)

        // Multiple choice elements
        // private val multipleChoiceRadioGroup: RadioGroup = itemView.findViewById(R.id.multipleChoiceRadioGroup)

        // True/False elements
        // private val trueFalseRadioGroup: RadioGroup = itemView.findViewById(R.id.trueFalseRadioGroup)

        // Input elements
        // private val inputEditText: EditText = itemView.findViewById(R.id.inputEditText)

        // Matching elements
        // private val wordBankContainer: View = itemView.findViewById(R.id.wordBankContainer)
        // private val answerInputContainer: View = itemView.findViewById(R.id.answerInputContainer)

        fun bind(question: Question) {
            // Set question number and type
            val position = adapterPosition + 1
            questionNumber.text = position.toString()
            // TODO: Fix layout file issues
            // questionTypeBadge.text = getQuestionTypeDisplayName(question.questionType)
            questionText.text = question.question

            // TODO: Fix layout file issues - temporarily disable question type handling
            // // Hide all layouts first
            // multipleChoiceLayout.visibility = View.GONE
            // trueFalseLayout.visibility = View.GONE
            // inputLayout.visibility = View.GONE
            // matchingLayout.visibility = View.GONE

            // // Show appropriate layout based on question type
            // when (question.questionType) {
            //     "multiple-choice" -> setupMultipleChoice(question)
            //     "true-false" -> setupTrueFalse(question)
            //     "input" -> setupInput(question)
            //     "matching_type" -> setupMatching(question)
            // }
        }

        // TODO: Fix layout file issues
        // private fun setupMultipleChoice(question: Question) {
        //     multipleChoiceLayout.visibility = View.VISIBLE
            
        //     // Clear existing radio buttons
        //     multipleChoiceRadioGroup.removeAllViews()
            
        //     // Add radio buttons for each option
        //     question.options?.forEachIndexed { index, option ->
        //         val radioButton = RadioButton(itemView.context).apply {
        //             id = View.generateViewId()
        //             text = option
        //             tag = index.toString()
        //         }
        //         multipleChoiceRadioGroup.addView(radioButton)
        //     }
            
        //     // Set change listener
        //     multipleChoiceRadioGroup.setOnCheckedChangeListener { _, checkedId ->
        //         val radioButton = multipleChoiceRadioGroup.findViewById<RadioButton>(checkedId)
        //         val answer = radioButton.tag.toString()
        //         onAnswerChanged(question.questionId ?: "", answer)
        //     }
        // }

        // TODO: Fix layout file issues
        // private fun setupTrueFalse(question: Question) {
        //     trueFalseLayout.visibility = View.VISIBLE
            
        //     // Set change listener
        //     trueFalseRadioGroup.setOnCheckedChangeListener { _, checkedId ->
        //         val answer = when (checkedId) {
        //             R.id.trueRadioButton -> "true"
        //             R.id.falseRadioButton -> "false"
        //             else -> ""
        //         }
        //         if (answer.isNotEmpty()) {
        //             onAnswerChanged(question.questionId ?: "", answer)
        //         }
        //     }
        // }

        // TODO: Fix layout file issues
        // private fun setupInput(question: Question) {
        //     inputLayout.visibility = View.VISIBLE
            
        //     // Set text change listener
        //     inputEditText.addTextChangedListener(object : android.text.TextWatcher {
        //         override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
        //         override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        //         override fun afterTextChanged(s: android.text.Editable?) {
        //         val answer = s?.toString() ?: ""
        //         onAnswerChanged(question.questionId ?: "", answer)
        //     }
        //     })
        // }

        // TODO: Fix layout file issues
        // private fun setupMatching(question: Question) {
        //     matchingLayout.visibility = View.VISIBLE
            
        //     // TODO: Implement matching question layout
        //     // This would include word bank display and answer input fields
        // }

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

    private class QuestionDiffCallback : DiffUtil.ItemCallback<Question>() {
        override fun areItemsTheSame(oldItem: Question, newItem: Question): Boolean {
            return oldItem.questionId == newItem.questionId
        }

        override fun areContentsTheSame(oldItem: Question, newItem: Question): Boolean {
            return oldItem == newItem
        }
    }
}
