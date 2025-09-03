package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.TestSession
import kotlinx.coroutines.flow.Flow

@Dao
interface TestSessionDao {
    
    @Query("SELECT * FROM test_sessions WHERE is_active = 1")
    fun getActiveTestSessions(): Flow<List<TestSession>>
    
    @Query("SELECT * FROM test_sessions WHERE test_id = :testId")
    suspend fun getTestSessionById(testId: String): TestSession?
    
    @Query("SELECT * FROM test_sessions WHERE local_token = :localToken")
    suspend fun getTestSessionByToken(localToken: String): TestSession?
    
    @Query("SELECT * FROM test_sessions WHERE is_submitted = 1 ORDER BY submission_time DESC")
    fun getSubmittedTestSessions(): Flow<List<TestSession>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTestSession(testSession: TestSession): Long
    
    @Update
    suspend fun updateTestSession(testSession: TestSession)
    
    @Delete
    suspend fun deleteTestSession(testSession: TestSession)
    
    @Query("DELETE FROM test_sessions WHERE test_id = :testId")
    suspend fun deleteTestSessionById(testId: String)
    
    @Query("UPDATE test_sessions SET is_active = 0, is_submitted = 1, submission_time = :submissionTime WHERE id = :sessionId")
    suspend fun markSessionAsSubmitted(sessionId: Long, submissionTime: java.util.Date)
    
    /**
     * Get all test sessions
     */
    @Query("SELECT * FROM test_sessions ORDER BY timestamp DESC")
    suspend fun getAllTestSessions(): List<TestSession>
    
    /**
     * Get unsynced sessions
     */
    @Query("SELECT * FROM test_sessions WHERE is_synced = 0 ORDER BY timestamp ASC")
    suspend fun getUnsyncedSessions(): List<TestSession>
}
