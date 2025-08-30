package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.AppStateLog
import kotlinx.coroutines.flow.Flow

@Dao
interface AppStateLogDao {
    @Query("SELECT * FROM app_state_logs WHERE test_session_id = :sessionId ORDER BY timestamp DESC")
    fun getLogsForSession(sessionId: Long): Flow<List<AppStateLog>>
    
    @Insert
    suspend fun insert(log: AppStateLog): Long
    
    @Query("DELETE FROM app_state_logs WHERE test_session_id = :sessionId")
    suspend fun deleteLogsForSession(sessionId: Long)
    
    @Query("DELETE FROM app_state_logs WHERE timestamp < :timestamp")
    suspend fun deleteOldLogs(timestamp: Long)
}
