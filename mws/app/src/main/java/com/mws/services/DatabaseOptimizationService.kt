package com.mws.services

import android.content.Context
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.mws.database.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * DatabaseOptimizationService - Optimizes Room database performance
 * Provides database optimization strategies and performance monitoring
 */
class DatabaseOptimizationService(private val context: Context) {

    private val databaseScope = CoroutineScope(Dispatchers.IO)
    
    companion object {
        private const val BATCH_SIZE = 100
        private const val MAX_CACHE_SIZE = 50
        private const val VACUUM_THRESHOLD = 1000 // Operations before suggesting vacuum
    }

    /**
     * Optimizes database performance with various strategies
     * @param database The Room database to optimize
     */
    fun optimizeDatabase(database: AppDatabase) {
        databaseScope.launch {
            try {
                // Enable WAL mode for better concurrent access
                enableWALMode(database)
                
                // Create indexes for frequently queried columns
                createPerformanceIndexes(database)
                
                // Optimize table statistics
                updateTableStatistics(database)
                
                // Clean up old data
                cleanupOldData(database)
                
            } catch (e: Exception) {
                // Log error but don't crash
                e.printStackTrace()
            }
        }
    }

    /**
     * Enables WAL (Write-Ahead Logging) mode for better performance
     * @param database The Room database
     */
    private suspend fun enableWALMode(database: AppDatabase) = withContext(Dispatchers.IO) {
        try {
            database.openHelper.writableDatabase.execSQL("PRAGMA journal_mode=WAL")
            database.openHelper.writableDatabase.execSQL("PRAGMA synchronous=NORMAL")
            database.openHelper.writableDatabase.execSQL("PRAGMA cache_size=10000")
            database.openHelper.writableDatabase.execSQL("PRAGMA temp_store=MEMORY")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Creates performance indexes for frequently queried columns
     * @param database The Room database
     */
    private suspend fun createPerformanceIndexes(database: AppDatabase) = withContext(Dispatchers.IO) {
        try {
            val db = database.openHelper.writableDatabase
            
            // Create indexes for common query patterns
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(questionType)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_students_email ON students(email)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON test_results(studentId)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_test_results_date ON test_results(testDate)")
            
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Updates table statistics for better query planning
     * @param database The Room database
     */
    private suspend fun updateTableStatistics(database: AppDatabase) = withContext(Dispatchers.IO) {
        try {
            val db = database.openHelper.writableDatabase
            db.execSQL("ANALYZE")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Cleans up old data to maintain performance
     * @param database The Room database
     */
    private suspend fun cleanupOldData(database: AppDatabase) = withContext(Dispatchers.IO) {
        try {
            // Clean up old test results (keep last 6 months)
            val sixMonthsAgo = System.currentTimeMillis() - (180L * 24 * 60 * 60 * 1000)
            
            // This would be implemented based on your actual table structure
            // database.testResultDao().deleteOldResults(sixMonthsAgo)
            
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Performs database maintenance operations
     * @param database The Room database
     */
    fun performMaintenance(database: AppDatabase) {
        databaseScope.launch {
            try {
                val db = database.openHelper.writableDatabase
                
                // Rebuild indexes
                db.execSQL("REINDEX")
                
                // Update statistics
                db.execSQL("ANALYZE")
                
                // Vacuum database to reclaim space
                db.execSQL("VACUUM")
                
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Monitors database performance metrics
     * @param database The Room database
     * @return Performance metrics
     */
    suspend fun getPerformanceMetrics(database: AppDatabase): DatabaseMetrics = withContext(Dispatchers.IO) {
        try {
            val db = database.openHelper.writableDatabase
            
            // Get database size
            val dbFile = context.getDatabasePath(database.openHelper.databaseName)
            val dbSize = dbFile?.length() ?: 0L
            
            // Get table sizes
            val tableSizes = getTableSizes(db)
            
            // Get index information
            val indexInfo = getIndexInfo(db)
            
            // Get performance statistics
            val performanceStats = getPerformanceStats(db)
            
            DatabaseMetrics(
                databaseSize = dbSize,
                tableSizes = tableSizes,
                indexInfo = indexInfo,
                performanceStats = performanceStats
            )
            
        } catch (e: Exception) {
            e.printStackTrace()
            DatabaseMetrics()
        }
    }

    /**
     * Gets table sizes for monitoring
     * @param db SQLite database
     * @return Map of table names to sizes
     */
    private fun getTableSizes(db: SupportSQLiteDatabase): Map<String, Long> {
        val tableSizes = mutableMapOf<String, Long>()
        
        try {
            val cursor = db.query("SELECT name FROM sqlite_master WHERE type='table'")
            cursor.use { 
                while (it.moveToNext()) {
                    val tableName = it.getString(0)
                    if (tableName != "android_metadata" && tableName != "sqlite_sequence") {
                        val sizeCursor = db.query("SELECT COUNT(*) FROM `$tableName`")
                        sizeCursor.use { sizeIt ->
                            if (sizeIt.moveToFirst()) {
                                tableSizes[tableName] = sizeIt.getLong(0)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return tableSizes
    }

    /**
     * Gets index information for monitoring
     * @param db SQLite database
     * @return List of index information
     */
    private fun getIndexInfo(db: SupportSQLiteDatabase): List<IndexInfo> {
        val indexes = mutableListOf<IndexInfo>()
        
        try {
            val cursor = db.query("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'")
            cursor.use { 
                while (it.moveToNext()) {
                    indexes.add(
                        IndexInfo(
                            name = it.getString(0),
                            tableName = it.getString(1),
                            sql = it.getString(2)
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return indexes
    }

    /**
     * Gets performance statistics
     * @param db SQLite database
     * @return Performance statistics
     */
    private fun getPerformanceStats(db: SupportSQLiteDatabase): PerformanceStats {
        var cacheSize = 0
        var pageSize = 0
        var pageCount = 0
        
        try {
            val cacheCursor = db.query("PRAGMA cache_size")
            cacheCursor.use { if (it.moveToFirst()) cacheSize = it.getInt(0) }
            
            val pageSizeCursor = db.query("PRAGMA page_size")
            pageSizeCursor.use { if (it.moveToFirst()) pageSize = it.getInt(0) }
            
            val pageCountCursor = db.query("PRAGMA page_count")
            pageCountCursor.use { if (it.moveToFirst()) pageCount = it.getInt(0) }
            
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return PerformanceStats(
            cacheSize = cacheSize,
            pageSize = pageSize,
            pageCount = pageCount,
            totalCacheSize = cacheSize * pageSize
        )
    }

    /**
     * Optimizes query performance with batch operations
     * @param database The Room database
     * @param operation The batch operation to perform
     */
    fun <T> performBatchOperation(
        database: AppDatabase,
        items: List<T>,
        operation: suspend (List<T>) -> Unit
    ) {
        databaseScope.launch {
            try {
                val batches = items.chunked(BATCH_SIZE)
                batches.forEach { batch ->
                    operation(batch)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Data class for database metrics
     */
    data class DatabaseMetrics(
        val databaseSize: Long = 0L,
        val tableSizes: Map<String, Long> = emptyMap(),
        val indexInfo: List<IndexInfo> = emptyList(),
        val performanceStats: PerformanceStats = PerformanceStats()
    )

    /**
     * Data class for index information
     */
    data class IndexInfo(
        val name: String,
        val tableName: String,
        val sql: String?
    )

    /**
     * Data class for performance statistics
     */
    data class PerformanceStats(
        val cacheSize: Int = 0,
        val pageSize: Int = 0,
        val pageCount: Int = 0,
        val totalCacheSize: Int = 0
    )
}
