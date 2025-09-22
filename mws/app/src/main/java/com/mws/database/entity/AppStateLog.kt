package com.mws.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo
import java.util.Date

@Entity(tableName = "app_state_logs")
data class AppStateLog(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    @ColumnInfo(name = "test_session_id") val testSessionId: Long,
    @ColumnInfo(name = "event_type") val eventType: String,
    @ColumnInfo(name = "timestamp") val timestamp: Date = Date(),
    @ColumnInfo(name = "background_duration") val backgroundDuration: Long = 0,
    @ColumnInfo(name = "warning_count") val warningCount: Int = 0,
    @ColumnInfo(name = "is_synced") val isSynced: Boolean = false
)
