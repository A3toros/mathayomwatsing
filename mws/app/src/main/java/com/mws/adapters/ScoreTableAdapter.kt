package com.mws.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.mws.R
import com.mws.models.ScoreRecord

/**
 * ScoreTableAdapter - Adapter for displaying score records in RecyclerView
 */
class ScoreTableAdapter : ListAdapter<ScoreRecord, ScoreTableAdapter.ScoreViewHolder>(ScoreDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScoreViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_score_table, parent, false)
        return ScoreViewHolder(view)
    }

    override fun onBindViewHolder(holder: ScoreViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ScoreViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

        private val scoreTestName: TextView = itemView.findViewById(R.id.scoreTestName)
        private val scoreValue: TextView = itemView.findViewById(R.id.scoreValue)
        private val scoreTestDetails: TextView = itemView.findViewById(R.id.scoreTestDetails)
        private val scorePerformanceIndicator: View = itemView.findViewById(R.id.scorePerformanceIndicator)

        fun bind(scoreRecord: ScoreRecord) {
            // Set test name
            scoreTestName.text = scoreRecord.testName
            
            // Set score value
            val scorePercentage = (scoreRecord.score / scoreRecord.maxScore * 100).toInt()
            scoreValue.text = "$scorePercentage%"
            
            // Set test details
            scoreTestDetails.text = "Subject: ${scoreRecord.subject} | Date: ${scoreRecord.date}"
            
            // Set performance indicator color based on score
            val scorePercentageFloat = scoreRecord.score / scoreRecord.maxScore
            val performanceColor = when {
                scorePercentageFloat >= 0.9 -> itemView.context.getColor(R.color.success)
                scorePercentageFloat >= 0.8 -> itemView.context.getColor(R.color.info)
                scorePercentageFloat >= 0.7 -> itemView.context.getColor(R.color.warning)
                else -> itemView.context.getColor(R.color.error)
            }
            scorePerformanceIndicator.setBackgroundColor(performanceColor)
        }
    }

    private class ScoreDiffCallback : DiffUtil.ItemCallback<ScoreRecord>() {
        override fun areItemsTheSame(oldItem: ScoreRecord, newItem: ScoreRecord): Boolean {
            return oldItem.testId == newItem.testId
        }

        override fun areContentsTheSame(oldItem: ScoreRecord, newItem: ScoreRecord): Boolean {
            return oldItem == newItem
        }
    }
}
