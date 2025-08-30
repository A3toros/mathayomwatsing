package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.TestSession
import kotlinx.coroutines.flow.Flow

@Dao
interface TestSessionDao {
    @Query("SELECT * FROM test_sessions WHERE test_id = :testId AND is_active = 1")
    suspend fun getActiveSessionByTestId(testId: String): TestSession?
    
    @Query("SELECT * FROM test_sessions WHERE is_active = 1")
    fun getActiveSessions(): Flow<List<TestSession>>
    
    @Insert
    suspend fun insert(session: TestSession): Long
    
    @Update
    suspend fun update(session: TestSession)
    
    @Query("UPDATE test_sessions SET is_active = 0, is_submitted = 1 WHERE id = :sessionId")
    suspend fun markAsSubmitted(sessionId: Long)
    
    @Query("DELETE FROM test_sessions WHERE id = :sessionId")
    suspend fun delete(sessionId: Long)
    
    @Query("DELETE FROM test_sessions WHERE is_submitted = 1")
    suspend fun deleteCompletedSessions()
}
