package com.mws.database.dao

import androidx.room.*
import com.mws.database.entity.FailedSubmission
import kotlinx.coroutines.flow.Flow

@Dao
interface FailedSubmissionDao {
    
    @Query("SELECT * FROM failed_submissions WHERE is_resolved = 0 ORDER BY timestamp DESC")
    fun getUnresolvedFailedSubmissions(): Flow<List<FailedSubmission>>
    
    @Query("SELECT * FROM failed_submissions WHERE test_session_id = :sessionId")
    suspend fun getFailedSubmissionForSession(sessionId: Long): FailedSubmission?
    
    @Query("SELECT * FROM failed_submissions WHERE retry_count < 3 ORDER BY timestamp ASC")
    fun getRetryableFailedSubmissions(): Flow<List<FailedSubmission>>
    
    @Insert
    suspend fun insertFailedSubmission(failedSubmission: FailedSubmission): Long
    
    @Update
    suspend fun updateFailedSubmission(failedSubmission: FailedSubmission)
    
    @Delete
    suspend fun deleteFailedSubmission(failedSubmission: FailedSubmission)
    
    @Query("UPDATE failed_submissions SET retry_count = retry_count + 1 WHERE id = :submissionId")
    suspend fun incrementRetryCount(submissionId: Long)
    
    @Query("UPDATE failed_submissions SET is_resolved = 1 WHERE id = :submissionId")
    suspend fun markAsResolved(submissionId: Long)
    
    @Query("DELETE FROM failed_submissions WHERE is_resolved = 1 AND timestamp < :cutoffTime")
    suspend fun deleteResolvedOldSubmissions(cutoffTime: java.util.Date)
    
    /**
     * Get unresolved submissions
     */
    @Query("SELECT * FROM failed_submissions WHERE is_resolved = 0 ORDER BY timestamp ASC")
    suspend fun getUnresolvedSubmissions(): List<FailedSubmission>
    
    /**
     * Get all failed submissions
     */
    @Query("SELECT * FROM failed_submissions ORDER BY timestamp DESC")
    suspend fun getAllFailedSubmissions(): List<FailedSubmission>
}
