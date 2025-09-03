package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.AppStateLog
import kotlinx.coroutines.flow.Flow

@Dao
interface AppStateLogDao {
    
    @Query("SELECT * FROM app_state_logs WHERE test_session_id = :sessionId ORDER BY timestamp DESC")
    fun getLogsForSession(sessionId: Long): Flow<List<AppStateLog>>
    
    @Query("SELECT * FROM app_state_logs WHERE event_type = :eventType ORDER BY timestamp DESC")
    fun getLogsByEventType(eventType: String): Flow<List<AppStateLog>>
    
    @Query("SELECT * FROM app_state_logs WHERE timestamp >= :startTime ORDER BY timestamp DESC")
    fun getLogsSince(startTime: java.util.Date): Flow<List<AppStateLog>>
    
    @Insert
    suspend fun insertLog(log: AppStateLog): Long
    
    @Update
    suspend fun updateLog(log: AppStateLog)
    
    @Delete
    suspend fun deleteLog(log: AppStateLog)
    
    @Query("DELETE FROM app_state_logs WHERE test_session_id = :sessionId")
    suspend fun deleteLogsForSession(sessionId: Long)
    
    @Query("DELETE FROM app_state_logs WHERE timestamp < :cutoffTime")
    suspend fun deleteOldLogs(cutoffTime: java.util.Date)
    
    /**
     * Get logs by test session ID
     */
    @Query("SELECT * FROM app_state_logs WHERE test_session_id = :testSessionId ORDER BY timestamp DESC")
    suspend fun getLogsByTestSession(testSessionId: Long): List<AppStateLog>
    
    /**
     * Get unsynced logs
     */
    @Query("SELECT * FROM app_state_logs WHERE is_synced = 0 ORDER BY timestamp ASC")
    suspend fun getUnsyncedLogs(): List<AppStateLog>
    
    /**
     * Get all logs
     */
    @Query("SELECT * FROM app_state_logs ORDER BY timestamp DESC")
    suspend fun getAllLogs(): List<AppStateLog>
}
