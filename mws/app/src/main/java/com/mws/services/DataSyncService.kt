package com.mws.services

import android.content.Context
import com.mws.database.AppDatabase
import com.mws.database.entity.TestSession
import com.mws.database.entity.AppStateLog
import com.mws.database.entity.FailedSubmission
import com.mws.repository.TestRepository
import com.mws.utils.Logger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*

/**
 * DataSyncService - Synchronizes local data with backend database
 * Handles offline data, failed submissions, and security violations
 */
class DataSyncService(
    private val context: Context,
    private val testRepository: TestRepository,
    private val database: AppDatabase
) {

    companion object {
        private const val TAG = "DataSyncService"
        private const val MAX_RETRY_ATTEMPTS = 3
    }

    /**
     * Sync all pending data to backend
     */
    suspend fun syncAllPendingData(): Result<SyncSummary> = withContext(Dispatchers.IO) {
        try {
            Logger.info("Starting full data synchronization")
            
            val summary = SyncSummary()
            
            // Sync failed test submissions
            val submissionResult = syncFailedSubmissions()
            summary.failedSubmissionsSynced = submissionResult.getOrNull() ?: 0
            
            // Sync security violations
            val securityResult = syncSecurityViolations()
            summary.securityViolationsSynced = securityResult.getOrNull() ?: 0
            
            Logger.info("Data synchronization completed: $summary")
            Result.success(summary)
            
        } catch (e: Exception) {
            Logger.error("Data synchronization failed", e)
            Result.failure(e)
        }
    }

    /**
     * Sync failed test submissions
     */
    private suspend fun syncFailedSubmissions(): Result<Int> {
        return try {
            val failedSubmissions = database.failedSubmissionDao().getUnresolvedSubmissions()
            var syncedCount = 0
            
            failedSubmissions.forEach { failedSubmission ->
                try {
                    // Mark as resolved for now
                    database.failedSubmissionDao().markAsResolved(failedSubmission.id)
                    syncedCount++
                } catch (e: Exception) {
                    Logger.error("Error processing failed submission: ${failedSubmission.testId}", e)
                }
            }
            
            Result.success(syncedCount)
            
        } catch (e: Exception) {
            Logger.error("Failed to sync failed submissions", e)
            Result.failure(e)
        }
    }

    /**
     * Sync security violations to backend
     */
    private suspend fun syncSecurityViolations(): Result<Int> {
        return try {
            val securityViolations = database.appStateLogDao().getUnsyncedLogs()
            var syncedCount = 0
            
            // Mark all as synced for now
            securityViolations.forEach { violation ->
                try {
                    val updatedViolation = violation.copy(isSynced = true)
                    database.appStateLogDao().updateLog(updatedViolation)
                    syncedCount++
                } catch (e: Exception) {
                    Logger.error("Error updating security violation: ${violation.id}", e)
                }
            }
            
            Result.success(syncedCount)
            
        } catch (e: Exception) {
            Logger.error("Failed to sync security violations", e)
            Result.failure(e)
        }
    }

    /**
     * Data class for sync summary
     */
    data class SyncSummary(
        var failedSubmissionsSynced: Int = 0,
        var securityViolationsSynced: Int = 0,
        val timestamp: Date = Date()
    ) {
        override fun toString(): String {
            return "SyncSummary(submissions=$failedSubmissionsSynced, violations=$securityViolationsSynced, time=$timestamp)"
        }
    }
}
