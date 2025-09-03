package com.mws.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import java.util.Date

@Entity(tableName = "failed_submissions")
data class FailedSubmission(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    @ColumnInfo(name = "test_session_id") val testSessionId: Long,
    @ColumnInfo(name = "test_id") val testId: String,
    @ColumnInfo(name = "test_type") val testType: String,
    @ColumnInfo(name = "submission_data") val submissionData: String,
    @ColumnInfo(name = "error_message") val errorMessage: String,
    @ColumnInfo(name = "retry_count") val retryCount: Int = 0,
    @ColumnInfo(name = "timestamp") val timestamp: Date = Date(),
    @ColumnInfo(name = "is_resolved") val isResolved: Boolean = false
)
