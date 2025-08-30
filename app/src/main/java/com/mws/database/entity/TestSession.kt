package com.mws.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import java.util.Date

@Entity(tableName = "test_sessions")
data class TestSession(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    
    @ColumnInfo(name = "test_id")
    val testId: String,
    
    @ColumnInfo(name = "test_type")
    val testType: String,
    
    @ColumnInfo(name = "local_token")
    val localToken: String,
    
    @ColumnInfo(name = "start_time")
    val startTime: Date = Date(),
    
    @ColumnInfo(name = "is_active")
    val isActive: Boolean = true,
    
    @ColumnInfo(name = "is_submitted")
    val isSubmitted: Boolean = false,
    
    @ColumnInfo(name = "submission_time")
    val submissionTime: Date? = null
) {
    constructor(testId: String, testType: String, localToken: String) : this(
        testId = testId,
        testType = testType,
        localToken = localToken
    )
}
