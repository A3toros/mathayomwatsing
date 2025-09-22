package com.mws.utils

import android.util.Log
import com.mws.config.ProductionConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.*

class ProductionLogger private constructor() {
    
    companion object {
        private const val TAG = "MWS_Logger"
        private const val MAX_LOG_FILE_SIZE_MB = 10L
        private const val MAX_LOG_FILES = 5
        
        @Volatile
        private var INSTANCE: ProductionLogger? = null
        
        fun getInstance(): ProductionLogger {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProductionLogger().also { INSTANCE = it }
            }
        }
    }
    
    private val logScope = CoroutineScope(Dispatchers.IO)
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault())
    private var logFile: File? = null
    private var isInitialized = false
    
    fun initialize(logDirectory: File) {
        if (isInitialized) return
        
        try {
            if (!logDirectory.exists()) {
                logDirectory.mkdirs()
            }
            
            logFile = File(logDirectory, "mws_${getCurrentDate()}.log")
            cleanupOldLogs(logDirectory)
            isInitialized = true
            
            if (ProductionConfig.ENABLE_LOGGING) {
                info(TAG, "Production Logger initialized successfully")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Production Logger", e)
        }
    }
    
    fun verbose(tag: String, message: String) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.v(tag, message)
            writeToFile("V", tag, message)
        }
    }
    
    fun debug(tag: String, message: String) {
        if (ProductionConfig.ENABLE_LOGGING && ProductionConfig.ENABLE_DEBUG_FEATURES) {
            Log.d(tag, message)
            writeToFile("D", tag, message)
        }
    }
    
    fun info(tag: String, message: String) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.i(tag, message)
            writeToFile("I", tag, message)
        }
    }
    
    fun warning(tag: String, message: String) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.w(tag, message)
            writeToFile("W", tag, message)
        }
    }
    
    fun error(tag: String, message: String, throwable: Throwable? = null) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.e(tag, message, throwable)
            writeToFile("E", tag, message, throwable)
            
            if (ProductionConfig.ENABLE_CRASH_REPORTING) {
                reportError(tag, message, throwable)
            }
        }
    }
    
    fun performance(tag: String, operation: String, durationMs: Long) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.d(tag, "Performance: $operation took ${durationMs}ms")
            writeToFile("P", tag, "Performance: $operation took ${durationMs}ms")
        }
    }
    
    fun userAction(tag: String, action: String, userId: String?) {
        if (ProductionConfig.ENABLE_LOGGING) {
            val userInfo = userId ?: "anonymous"
            Log.d(tag, "User Action: $action by $userInfo")
            writeToFile("U", tag, "User Action: $action by $userInfo")
        }
    }
    
    fun network(tag: String, endpoint: String, method: String, statusCode: Int, durationMs: Long) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.d(tag, "Network: $method $endpoint - $statusCode (${durationMs}ms)")
            writeToFile("N", tag, "Network: $method $endpoint - $statusCode (${durationMs}ms)")
        }
    }
    
    fun database(tag: String, operation: String, table: String, durationMs: Long) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.d(tag, "Database: $operation on $table took ${durationMs}ms")
            writeToFile("DB", tag, "Database: $operation on $table took ${durationMs}ms")
        }
    }
    
    fun cache(tag: String, operation: String, key: String, hit: Boolean, durationMs: Long) {
        if (ProductionConfig.ENABLE_LOGGING) {
            val hitStatus = if (hit) "HIT" else "MISS"
            Log.d(tag, "Cache: $operation $key - $hitStatus (${durationMs}ms)")
            writeToFile("C", tag, "Cache: $operation $key - $hitStatus (${durationMs}ms)")
        }
    }
    
    fun critical(tag: String, message: String) {
        if (ProductionConfig.ENABLE_LOGGING) {
            Log.wtf(tag, "CRITICAL: $message")
            writeToFile("CRIT", tag, "CRITICAL: $message")
        }
    }
    
    private fun writeToFile(level: String, tag: String, message: String, throwable: Throwable? = null) {
        if (!isInitialized || logFile == null) return
        
        logScope.launch {
            try {
                val timestamp = dateFormat.format(Date())
                val logEntry = buildString {
                    append("$timestamp [$level] $tag: $message")
                    throwable?.let {
                        append("\n${Log.getStackTraceString(it)}")
                    }
                    append("\n")
                }
                
                val writer = FileWriter(logFile!!, true)
                writer.append(logEntry)
                writer.close()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to write to log file", e)
            }
        }
    }
    
    private fun getCurrentDate(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }
    
    private fun cleanupOldLogs(logDirectory: File) {
        try {
            val logFiles = logDirectory.listFiles { file ->
                file.name.startsWith("mws_") && file.name.endsWith(".log")
            } ?: return
            
            if (logFiles.size > MAX_LOG_FILES) {
                val sortedFiles = logFiles.sortedBy { it.lastModified() }
                val filesToDelete = sortedFiles.take(sortedFiles.size - MAX_LOG_FILES)
                
                filesToDelete.forEach { file ->
                    if (file.delete()) {
                        Log.d(TAG, "Deleted old log file: ${file.name}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cleanup old log files", e)
        }
    }
    
    private fun reportError(tag: String, message: String, throwable: Throwable?) {
        logScope.launch {
            try {
                val errorReport = buildString {
                    append("Error Report:\n")
                    append("Tag: $tag\n")
                    append("Message: $message\n")
                    append("Timestamp: ${dateFormat.format(Date())}\n")
                    append("Device: ${android.os.Build.MODEL}\n")
                    append("Android Version: ${android.os.Build.VERSION.RELEASE}\n")
                    throwable?.let {
                        append("\nStack Trace:\n${Log.getStackTraceString(it)}")
                    }
                }
                
                Log.d(TAG, "Error reported to crash reporting service:\n$errorReport")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to report error", e)
            }
        }
    }
}
