package com.mws.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import java.util.Date

@Entity(tableName = "failed_submissions")
data class FailedSubmission(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    
    @ColumnInfo(name = "test_session_id")
    val testSessionId: Long,
    
    @ColumnInfo(name = "test_data")
    val testData: String,
    
    @ColumnInfo(name = "submission_attempts")
    val submissionAttempts: Int = 1,
    
    @ColumnInfo(name = "last_attempt_time")
    val lastAttemptTime: Date = Date(),
    
    @ColumnInfo(name = "error_message")
    val errorMessage: String? = null
)
