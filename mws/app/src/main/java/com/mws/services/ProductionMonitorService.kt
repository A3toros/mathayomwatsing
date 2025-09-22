package com.mws.services

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.mws.config.ProductionConfig
import com.mws.utils.ProductionLogger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

class ProductionMonitorService(private val context: Context) {
    
    companion object {
        private const val TAG = "ProductionMonitor"
        private const val MONITORING_INTERVAL_MS = 5000L
        private const val MAX_METRICS_HISTORY = 1000
    }
    
    private val logger = ProductionLogger.getInstance()
    private val monitorScope = CoroutineScope(Dispatchers.IO)
    private var monitoringJob: Job? = null
    private var isMonitoring = false
    
    // Performance metrics
    private val performanceMetrics = ConcurrentHashMap<String, MutableList<PerformanceMetric>>()
    private val userActionMetrics = ConcurrentHashMap<String, AtomicLong>()
    private val errorMetrics = ConcurrentHashMap<String, AtomicLong>()
    private val sessionMetrics = ConcurrentHashMap<String, Any>()
    
    // System metrics
    private val memoryUsageHistory = mutableListOf<Long>()
    private val cpuUsageHistory = mutableListOf<Double>()
    private val batteryUsageHistory = mutableListOf<Int>()
    private val networkUsageHistory = mutableListOf<NetworkMetric>()
    
    data class PerformanceMetric(
        val operation: String,
        val durationMs: Long,
        val timestamp: Long,
        val success: Boolean,
        val errorMessage: String? = null
    )
    
    data class NetworkMetric(
        val endpoint: String,
        val method: String,
        val statusCode: Int,
        val durationMs: Long,
        val timestamp: Long,
        val success: Boolean
    )
    
    data class UserActionMetric(
        val action: String,
        val userId: String?,
        val timestamp: Long,
        val metadata: Map<String, Any>? = null
    )
    
    data class ErrorMetric(
        val errorType: String,
        val errorMessage: String,
        val stackTrace: String?,
        val timestamp: Long,
        val userId: String?,
        val severity: ErrorSeverity
    )
    
    enum class ErrorSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    fun startMonitoring() {
        if (isMonitoring) return
        
        logger.info(TAG, "Starting production monitoring")
        isMonitoring = true
        
        monitoringJob = monitorScope.launch {
            while (isMonitoring) {
                try {
                    collectSystemMetrics()
                    analyzePerformanceMetrics()
                    checkAlertThresholds()
                    delay(MONITORING_INTERVAL_MS)
                } catch (e: Exception) {
                    logger.error(TAG, "Error during monitoring", e)
                }
            }
        }
    }
    
    fun stopMonitoring() {
        if (!isMonitoring) return
        
        logger.info(TAG, "Stopping production monitoring")
        isMonitoring = false
        monitoringJob?.cancel()
        monitoringJob = null
    }
    
    fun recordPerformanceMetric(operation: String, durationMs: Long, success: Boolean, errorMessage: String? = null) {
        if (!ProductionConfig.ENABLE_ANALYTICS) return
        
        val metric = PerformanceMetric(
            operation = operation,
            durationMs = durationMs,
            timestamp = System.currentTimeMillis(),
            success = success,
            errorMessage = errorMessage
        )
        
        performanceMetrics.computeIfAbsent(operation) { mutableListOf() }.add(metric)
        
        // Limit history size
        val metrics = performanceMetrics[operation]
        if (metrics != null && metrics.size > MAX_METRICS_HISTORY) {
            metrics.removeAt(0)
        }
        
        logger.performance(TAG, operation, durationMs)
    }
    
    fun recordUserAction(action: String, userId: String? = null, metadata: Map<String, Any>? = null) {
        if (!ProductionConfig.ENABLE_ANALYTICS) return
        
        val metric = UserActionMetric(
            action = action,
            userId = userId,
            timestamp = System.currentTimeMillis(),
            metadata = metadata
        )
        
        userActionMetrics.computeIfAbsent(action) { AtomicLong(0) }.incrementAndGet()
        
        logger.userAction(TAG, action, userId)
    }
    
    fun recordError(errorType: String, errorMessage: String, stackTrace: String? = null, userId: String? = null, severity: ErrorSeverity = ErrorSeverity.MEDIUM) {
        if (!ProductionConfig.ENABLE_CRASH_REPORTING) return
        
        val metric = ErrorMetric(
            errorType = errorType,
            errorMessage = errorMessage,
            stackTrace = stackTrace,
            timestamp = System.currentTimeMillis(),
            userId = userId,
            severity = severity
        )
        
        errorMetrics.computeIfAbsent(errorType) { AtomicLong(0) }.incrementAndGet()
        
        logger.error(TAG, "$errorType: $errorMessage")
        
        // Handle critical errors immediately
        if (severity == ErrorSeverity.CRITICAL) {
            handleCriticalError(metric)
        }
    }
    
    fun recordNetworkCall(endpoint: String, method: String, statusCode: Int, durationMs: Long, success: Boolean) {
        if (!ProductionConfig.ENABLE_ANALYTICS) return
        
        val metric = NetworkMetric(
            endpoint = endpoint,
            method = method,
            statusCode = statusCode,
            durationMs = durationMs,
            timestamp = System.currentTimeMillis(),
            success = success
        )
        
        networkUsageHistory.add(metric)
        
        // Limit history size
        if (networkUsageHistory.size > MAX_METRICS_HISTORY) {
            networkUsageHistory.removeAt(0)
        }
        
        logger.network(TAG, endpoint, method, statusCode, durationMs)
    }
    
    fun recordDatabaseOperation(operation: String, table: String, durationMs: Long) {
        if (!ProductionConfig.ENABLE_ANALYTICS) return
        
        logger.database(TAG, operation, table, durationMs)
    }
    
    fun recordCacheOperation(operation: String, key: String, hit: Boolean, durationMs: Long) {
        if (!ProductionConfig.ENABLE_ANALYTICS) return
        
        logger.cache(TAG, operation, key, hit, durationMs)
    }
    
    private fun collectSystemMetrics() {
        try {
            // Memory usage
            val runtime = Runtime.getRuntime()
            val usedMemory = runtime.totalMemory() - runtime.freeMemory()
            memoryUsageHistory.add(usedMemory)
            
            // Limit history size
            if (memoryUsageHistory.size > MAX_METRICS_HISTORY) {
                memoryUsageHistory.removeAt(0)
            }
            
            // Check memory threshold
            val memoryMB = usedMemory / (1024 * 1024)
            if (memoryMB > ProductionConfig.MEMORY_WARNING_THRESHOLD_MB) {
                logger.warning(TAG, "Memory usage high: ${memoryMB}MB")
            }
            
        } catch (e: Exception) {
            logger.error(TAG, "Error collecting system metrics", e)
        }
    }
    
    private fun analyzePerformanceMetrics() {
        try {
            performanceMetrics.forEach { (operation, metrics) ->
                if (metrics.isNotEmpty()) {
                    val recentMetrics = metrics.takeLast(100)
                    val avgDuration = recentMetrics.map { it.durationMs }.average()
                    val successRate = recentMetrics.count { it.success }.toDouble() / recentMetrics.size
                    
                    // Log performance insights
                    if (avgDuration > 1000) { // > 1 second
                        logger.warning(TAG, "Slow operation detected: $operation (avg: ${avgDuration.toLong()}ms)")
                    }
                    
                    if (successRate < 0.95) { // < 95% success rate
                        logger.warning(TAG, "Low success rate detected: $operation (${(successRate * 100).toInt()}%)")
                    }
                }
            }
        } catch (e: Exception) {
            logger.error(TAG, "Error analyzing performance metrics", e)
        }
    }
    
    private fun checkAlertThresholds() {
        try {
            // Check error rates
            errorMetrics.forEach { (errorType, count) ->
                val recentCount = count.get()
                if (recentCount > 10) { // More than 10 errors
                    logger.warning(TAG, "High error rate detected: $errorType ($recentCount errors)")
                }
            }
            
            // Check user action patterns
            userActionMetrics.forEach { (action, count) ->
                val recentCount = count.get()
                if (recentCount > 1000) { // More than 1000 actions
                    logger.info(TAG, "High user engagement: $action ($recentCount actions)")
                }
            }
            
        } catch (e: Exception) {
            logger.error(TAG, "Error checking alert thresholds", e)
        }
    }
    
    private fun handleCriticalError(error: ErrorMetric) {
        try {
            logger.critical(TAG, "Critical error detected: ${error.errorType}")
            
            // In production, this would trigger immediate alerts
            // For now, we'll just log it
            logger.error(TAG, "Critical error details: ${error.errorMessage}")
            
            // Could also send to crash reporting service, alert team, etc.
            
        } catch (e: Exception) {
            logger.error(TAG, "Error handling critical error", e)
        }
    }
    
    fun getPerformanceReport(): Map<String, Any> {
        return try {
            val report = mutableMapOf<String, Any>()
            
            // Performance summary
            val performanceSummary = mutableMapOf<String, Any>()
            performanceMetrics.forEach { (operation, metrics) ->
                if (metrics.isNotEmpty()) {
                    val recentMetrics = metrics.takeLast(100)
                    performanceSummary[operation] = mapOf(
                        "avgDuration" to recentMetrics.map { it.durationMs }.average(),
                        "successRate" to recentMetrics.count { it.success }.toDouble() / recentMetrics.size,
                        "totalCalls" to metrics.size
                    )
                }
            }
            report["performance"] = performanceSummary
            
            // Error summary
            val errorSummary = mutableMapOf<String, Long>()
            errorMetrics.forEach { (errorType, count) ->
                errorSummary[errorType] = count.get()
            }
            report["errors"] = errorSummary
            
            // User action summary
            val actionSummary = mutableMapOf<String, Long>()
            userActionMetrics.forEach { (action, count) ->
                actionSummary[action] = count.get()
            }
            report["userActions"] = actionSummary
            
            // System metrics
            if (memoryUsageHistory.isNotEmpty()) {
                report["memoryUsage"] = mapOf(
                    "current" to memoryUsageHistory.last(),
                    "average" to memoryUsageHistory.average(),
                    "max" to memoryUsageHistory.maxOrNull()
                )
            }
            
            report
            
        } catch (e: Exception) {
            logger.error(TAG, "Error generating performance report", e)
            emptyMap()
        }
    }
    
    fun clearMetrics() {
        try {
            performanceMetrics.clear()
            userActionMetrics.clear()
            errorMetrics.clear()
            memoryUsageHistory.clear()
            cpuUsageHistory.clear()
            batteryUsageHistory.clear()
            networkUsageHistory.clear()
            
            logger.info(TAG, "All metrics cleared")
        } catch (e: Exception) {
            logger.error(TAG, "Error clearing metrics", e)
        }
    }
    
    fun exportMetrics(): String {
        return try {
            val report = getPerformanceReport()
            buildString {
                appendLine("MWS Production Metrics Report")
                appendLine("Generated: ${java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())}")
                appendLine("=".repeat(50))
                
                report.forEach { (category, data) ->
                    appendLine("\n$category:")
                    when (data) {
                        is Map<*, *> -> {
                            data.forEach { (key, value) ->
                                appendLine("  $key: $value")
                            }
                        }
                        else -> appendLine("  $data")
                    }
                }
            }
        } catch (e: Exception) {
            logger.error(TAG, "Error exporting metrics", e)
            "Error exporting metrics: ${e.message}"
        }
    }
}
