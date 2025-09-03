package com.mws.services

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Process
import android.os.SystemClock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.FileReader
import java.io.IOException
import java.util.concurrent.atomic.AtomicLong

/**
 * PerformanceMonitorService - Monitors system performance and provides optimization recommendations
 * Tracks memory usage, CPU usage, battery consumption, and app performance metrics
 */
class PerformanceMonitorService(private val context: Context) {

    private val monitorScope = CoroutineScope(Dispatchers.IO)
    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    
    private val _performanceMetrics = MutableStateFlow(PerformanceMetrics())
    val performanceMetrics: StateFlow<PerformanceMetrics> = _performanceMetrics.asStateFlow()
    
    private val _optimizationRecommendations = MutableStateFlow<List<OptimizationRecommendation>>(emptyList())
    val optimizationRecommendations: StateFlow<List<OptimizationRecommendation>> = _optimizationRecommendations.asStateFlow()
    
    private var isMonitoring = false
    private val operationCounters = mutableMapOf<String, AtomicLong>()
    
    companion object {
        private const val MONITORING_INTERVAL = 5000L // 5 seconds
        private const val MEMORY_WARNING_THRESHOLD = 0.8f // 80% memory usage
        private const val CPU_WARNING_THRESHOLD = 0.7f // 70% CPU usage
        private const val BATTERY_WARNING_THRESHOLD = 0.2f // 20% battery remaining
    }

    /**
     * Starts performance monitoring
     */
    fun startMonitoring() {
        if (isMonitoring) return
        
        isMonitoring = true
        monitorScope.launch {
            while (isMonitoring) {
                try {
                    val metrics = collectPerformanceMetrics()
                    _performanceMetrics.value = metrics
                    
                    val recommendations = generateOptimizationRecommendations(metrics)
                    _optimizationRecommendations.value = recommendations
                    
                    delay(MONITORING_INTERVAL)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    /**
     * Stops performance monitoring
     */
    fun stopMonitoring() {
        isMonitoring = false
    }

    /**
     * Records the start time of an operation
     * @param operationName Name of the operation
     * @return Operation ID for tracking
     */
    fun startOperation(operationName: String): String {
        val operationId = "${operationName}_${SystemClock.elapsedRealtime()}"
        operationCounters[operationId] = AtomicLong(SystemClock.elapsedRealtime())
        return operationId
    }

    /**
     * Records the end time of an operation and calculates duration
     * @param operationId Operation ID returned from startOperation
     * @return Duration in milliseconds, or -1 if operation not found
     */
    fun endOperation(operationId: String): Long {
        val startTime = operationCounters.remove(operationId)?.get() ?: return -1
        return SystemClock.elapsedRealtime() - startTime
    }

    /**
     * Collects comprehensive performance metrics
     * @return Performance metrics object
     */
    private suspend fun collectPerformanceMetrics(): PerformanceMetrics {
        return PerformanceMetrics(
            memoryUsage = getMemoryUsage(),
            cpuUsage = getCpuUsage(),
            batteryLevel = getBatteryLevel(),
            diskUsage = getDiskUsage(),
            networkStats = getNetworkStats(),
            appPerformance = getAppPerformanceMetrics()
        )
    }

    /**
     * Gets memory usage information
     * @return Memory usage metrics
     */
    private fun getMemoryUsage(): MemoryUsage {
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        
        val availableMemory = memoryInfo.availMem
        val totalMemory = memoryInfo.totalMem
        val usedMemory = totalMemory - availableMemory
        val memoryUsagePercentage = (usedMemory.toFloat() / totalMemory.toFloat()) * 100f
        
        return MemoryUsage(
            totalMemory = totalMemory,
            availableMemory = availableMemory,
            usedMemory = usedMemory,
            usagePercentage = memoryUsagePercentage,
            isLowMemory = memoryInfo.lowMemory,
            threshold = memoryInfo.threshold
        )
    }

    /**
     * Gets CPU usage information
     * @return CPU usage metrics
     */
    private fun getCpuUsage(): CpuUsage {
        var cpuUsage = 0f
        
        try {
            val reader = BufferedReader(FileReader("/proc/stat"))
            val line = reader.readLine()
            reader.close()
            
            if (line != null) {
                val values = line.split("\\s+".toRegex())
                if (values.size >= 5) {
                    val idle = values[4].toLong()
                    val total = values.drop(1).take(4).sumOf { it.toLong() }
                    cpuUsage = ((total - idle).toFloat() / total.toFloat()) * 100f
                }
            }
        } catch (e: IOException) {
            e.printStackTrace()
        }
        
        return CpuUsage(
            usagePercentage = cpuUsage,
            coreCount = Runtime.getRuntime().availableProcessors(),
            isHighUsage = cpuUsage > CPU_WARNING_THRESHOLD * 100
        )
    }

    /**
     * Gets battery level information
     * @return Battery level metrics
     */
    private fun getBatteryLevel(): BatteryLevel {
        // This is a simplified implementation
        // In a real app, you'd use BatteryManager to get actual battery information
        return BatteryLevel(
            level = 100, // Placeholder
            isCharging = false, // Placeholder
            isLowBattery = false, // Placeholder
            temperature = 25.0f // Placeholder
        )
    }

    /**
     * Gets disk usage information
     * @return Disk usage metrics
     */
    private fun getDiskUsage(): DiskUsage {
        val statFs = android.os.StatFs(context.filesDir.path)
        val blockSize = statFs.blockSizeLong
        val totalBlocks = statFs.blockCountLong
        val availableBlocks = statFs.availableBlocksLong
        
        val totalSpace = totalBlocks * blockSize
        val availableSpace = availableBlocks * blockSize
        val usedSpace = totalSpace - availableSpace
        val usagePercentage = (usedSpace.toFloat() / totalSpace.toFloat()) * 100f
        
        return DiskUsage(
            totalSpace = totalSpace,
            availableSpace = availableSpace,
            usedSpace = usedSpace,
            usagePercentage = usagePercentage
        )
    }

    /**
     * Gets network statistics
     * @return Network statistics
     */
    private fun getNetworkStats(): NetworkStats {
        // This is a simplified implementation
        // In a real app, you'd use NetworkStatsManager to get actual network statistics
        return NetworkStats(
            bytesReceived = 0L,
            bytesTransmitted = 0L,
            packetsReceived = 0L,
            packetsTransmitted = 0L
        )
    }

    /**
     * Gets app-specific performance metrics
     * @return App performance metrics
     */
    private fun getAppPerformanceMetrics(): AppPerformance {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory()
        val totalMemory = runtime.totalMemory()
        val freeMemory = runtime.freeMemory()
        val usedMemory = totalMemory - freeMemory
        
        return AppPerformance(
            maxMemory = maxMemory,
            totalMemory = totalMemory,
            freeMemory = freeMemory,
            usedMemory = usedMemory,
            memoryUsagePercentage = (usedMemory.toFloat() / maxMemory.toFloat()) * 100f,
            threadCount = Thread.activeCount(),
            uptime = SystemClock.elapsedRealtime()
        )
    }

    /**
     * Generates optimization recommendations based on current metrics
     * @param metrics Current performance metrics
     * @return List of optimization recommendations
     */
    private fun generateOptimizationRecommendations(metrics: PerformanceMetrics): List<OptimizationRecommendation> {
        val recommendations = mutableListOf<OptimizationRecommendation>()
        
        // Memory optimization recommendations
        if (metrics.memoryUsage.usagePercentage > MEMORY_WARNING_THRESHOLD * 100) {
            recommendations.add(
                OptimizationRecommendation(
                    type = OptimizationType.MEMORY,
                    priority = OptimizationPriority.HIGH,
                    title = "High Memory Usage",
                    description = "Memory usage is at ${metrics.memoryUsage.usagePercentage.toInt()}%. Consider clearing caches and unused resources.",
                    action = "Clear app caches and restart if necessary"
                )
            )
        }
        
        // CPU optimization recommendations
        if (metrics.cpuUsage.usagePercentage > CPU_WARNING_THRESHOLD * 100) {
            recommendations.add(
                OptimizationRecommendation(
                    type = OptimizationType.CPU,
                    priority = OptimizationPriority.MEDIUM,
                    title = "High CPU Usage",
                    description = "CPU usage is at ${metrics.cpuUsage.usagePercentage.toInt()}%. Consider optimizing background operations.",
                    action = "Reduce background tasks and optimize algorithms"
                )
            )
        }
        
        // Disk optimization recommendations
        if (metrics.diskUsage.usagePercentage > 90) {
            recommendations.add(
                OptimizationRecommendation(
                    type = OptimizationType.DISK,
                    priority = OptimizationPriority.MEDIUM,
                    title = "High Disk Usage",
                    description = "Disk usage is at ${metrics.diskUsage.usagePercentage.toInt()}%. Consider cleaning up old files.",
                    action = "Remove old test results and temporary files"
                )
            )
        }
        
        // General optimization recommendations
        if (metrics.appPerformance.memoryUsagePercentage > 80) {
            recommendations.add(
                OptimizationRecommendation(
                    type = OptimizationType.GENERAL,
                    priority = OptimizationPriority.LOW,
                    title = "App Memory Optimization",
                    description = "App memory usage is high. Consider implementing better memory management.",
                    action = "Review memory allocation patterns and implement object pooling"
                )
            )
        }
        
        return recommendations
    }

    /**
     * Gets performance summary for reporting
     * @return Performance summary
     */
    fun getPerformanceSummary(): PerformanceSummary {
        val metrics = _performanceMetrics.value
        val recommendations = _optimizationRecommendations.value
        
        return PerformanceSummary(
            overallScore = calculateOverallScore(metrics),
            criticalIssues = recommendations.count { it.priority == OptimizationPriority.HIGH },
            warnings = recommendations.count { it.priority == OptimizationPriority.MEDIUM },
            suggestions = recommendations.count { it.priority == OptimizationPriority.LOW },
            lastUpdated = System.currentTimeMillis()
        )
    }

    /**
     * Calculates overall performance score
     * @param metrics Performance metrics
     * @return Performance score (0-100)
     */
    private fun calculateOverallScore(metrics: PerformanceMetrics): Int {
        var score = 100
        
        // Deduct points for high memory usage
        if (metrics.memoryUsage.usagePercentage > 80) score -= 20
        else if (metrics.memoryUsage.usagePercentage > 60) score -= 10
        
        // Deduct points for high CPU usage
        if (metrics.cpuUsage.usagePercentage > 80) score -= 20
        else if (metrics.cpuUsage.usagePercentage > 60) score -= 10
        
        // Deduct points for high disk usage
        if (metrics.diskUsage.usagePercentage > 90) score -= 15
        else if (metrics.diskUsage.usagePercentage > 80) score -= 5
        
        // Deduct points for low battery
        if (metrics.batteryLevel.isLowBattery) score -= 10
        
        return score.coerceIn(0, 100)
    }

    /**
     * Data class for performance metrics
     */
    data class PerformanceMetrics(
        val memoryUsage: MemoryUsage = MemoryUsage(),
        val cpuUsage: CpuUsage = CpuUsage(),
        val batteryLevel: BatteryLevel = BatteryLevel(),
        val diskUsage: DiskUsage = DiskUsage(),
        val networkStats: NetworkStats = NetworkStats(),
        val appPerformance: AppPerformance = AppPerformance()
    )

    /**
     * Data class for memory usage
     */
    data class MemoryUsage(
        val totalMemory: Long = 0L,
        val availableMemory: Long = 0L,
        val usedMemory: Long = 0L,
        val usagePercentage: Float = 0f,
        val isLowMemory: Boolean = false,
        val threshold: Long = 0L
    )

    /**
     * Data class for CPU usage
     */
    data class CpuUsage(
        val usagePercentage: Float = 0f,
        val coreCount: Int = 0,
        val isHighUsage: Boolean = false
    )

    /**
     * Data class for battery level
     */
    data class BatteryLevel(
        val level: Int = 0,
        val isCharging: Boolean = false,
        val isLowBattery: Boolean = false,
        val temperature: Float = 0f
    )

    /**
     * Data class for disk usage
     */
    data class DiskUsage(
        val totalSpace: Long = 0L,
        val availableSpace: Long = 0L,
        val usedSpace: Long = 0L,
        val usagePercentage: Float = 0f
    )

    /**
     * Data class for network statistics
     */
    data class NetworkStats(
        val bytesReceived: Long = 0L,
        val bytesTransmitted: Long = 0L,
        val packetsReceived: Long = 0L,
        val packetsTransmitted: Long = 0L
    )

    /**
     * Data class for app performance
     */
    data class AppPerformance(
        val maxMemory: Long = 0L,
        val totalMemory: Long = 0L,
        val freeMemory: Long = 0L,
        val usedMemory: Long = 0L,
        val memoryUsagePercentage: Float = 0f,
        val threadCount: Int = 0,
        val uptime: Long = 0L
    )

    /**
     * Data class for optimization recommendations
     */
    data class OptimizationRecommendation(
        val type: OptimizationType,
        val priority: OptimizationPriority,
        val title: String,
        val description: String,
        val action: String
    )

    /**
     * Data class for performance summary
     */
    data class PerformanceSummary(
        val overallScore: Int,
        val criticalIssues: Int,
        val warnings: Int,
        val suggestions: Int,
        val lastUpdated: Long
    )

    /**
     * Enum for optimization types
     */
    enum class OptimizationType {
        MEMORY, CPU, DISK, NETWORK, BATTERY, GENERAL
    }

    /**
     * Enum for optimization priorities
     */
    enum class OptimizationPriority {
        HIGH, MEDIUM, LOW
    }
}
