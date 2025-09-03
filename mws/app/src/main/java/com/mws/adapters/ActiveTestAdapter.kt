package com.mws.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.mws.R
import com.mws.models.ActiveTest

/**
 * ActiveTestAdapter - Adapter for displaying active tests in RecyclerView
 */
class ActiveTestAdapter(
    private val onTestClick: (ActiveTest) -> Unit
) : ListAdapter<ActiveTest, ActiveTestAdapter.ActiveTestViewHolder>(ActiveTestDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ActiveTestViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_active_test, parent, false)
        return ActiveTestViewHolder(view, onTestClick)
    }

    override fun onBindViewHolder(holder: ActiveTestViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ActiveTestViewHolder(
        itemView: View,
        private val onTestClick: (ActiveTest) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {

        private val testTypeBadge: TextView = itemView.findViewById(R.id.testTypeBadge)
        private val testName: TextView = itemView.findViewById(R.id.testName)
        private val testStatus: TextView = itemView.findViewById(R.id.testStatus)
        private val testSubject: TextView = itemView.findViewById(R.id.testSubject)
        private val testDueDate: TextView = itemView.findViewById(R.id.testDueDate)
        private val startTestButton: MaterialButton = itemView.findViewById(R.id.startTestButton)

        fun bind(activeTest: ActiveTest) {
            // Set test type badge
            testTypeBadge.text = getTestTypeDisplayName(activeTest.type)
            
            // Set test name
            testName.text = activeTest.name
            
            // Set test status
            testStatus.text = activeTest.status.capitalize()
            
            // Set subject and teacher
            testSubject.text = "Subject: ${activeTest.subject} | Teacher: ${activeTest.teacherName}"
            
            // Set due date
            testDueDate.text = "Due: ${activeTest.dueDate}"
            
            // Set button text based on status
            startTestButton.text = if (activeTest.status == "active") "Start Test" else "Continue Test"
            
            // Set button click listener
            startTestButton.setOnClickListener {
                onTestClick(activeTest)
            }
        }

        private fun getTestTypeDisplayName(type: String): String {
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

    private class ActiveTestDiffCallback : DiffUtil.ItemCallback<ActiveTest>() {
        override fun areItemsTheSame(oldItem: ActiveTest, newItem: ActiveTest): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ActiveTest, newItem: ActiveTest): Boolean {
            return oldItem == newItem
        }
    }
}
