package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.FailedSubmission
import kotlinx.coroutines.flow.Flow

@Dao
interface FailedSubmissionDao {
    @Query("SELECT * FROM failed_submissions ORDER BY last_attempt_time DESC")
    fun getAll(): Flow<List<FailedSubmission>>
    
    @Query("SELECT * FROM failed_submissions WHERE test_session_id = :sessionId")
    suspend fun getBySessionId(sessionId: Long): FailedSubmission?
    
    @Insert
    suspend fun insert(submission: FailedSubmission): Long
    
    @Update
    suspend fun update(submission: FailedSubmission)
    
    @Delete
    suspend fun delete(submission: FailedSubmission)
    
    @Query("DELETE FROM failed_submissions WHERE test_session_id = :sessionId")
    suspend fun deleteBySessionId(sessionId: Long)
}
