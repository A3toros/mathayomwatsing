package com.mws.services

import android.content.Context
import android.graphics.Bitmap
import android.util.LruCache
import com.mws.models.Question
import com.mws.models.Student
import com.mws.models.TestInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap

/**
 * CacheManagerService - Manages intelligent data caching and memory optimization
 * Provides multi-level caching strategies for different data types
 */
class CacheManagerService(private val context: Context) {

    private val cacheScope = CoroutineScope(Dispatchers.IO)
    
    companion object {
        private const val MEMORY_CACHE_SIZE = 20 * 1024 * 1024 // 20MB
        private const val DISK_CACHE_SIZE = 100 * 1024 * 1024 // 100MB
        private const val CACHE_EXPIRY_TIME = 30 * 60 * 1000L // 30 minutes
        private const val MAX_CACHE_ENTRIES = 100
    }

    // Memory cache for different data types
    private val questionCache = LruCache<String, CachedQuestion>(MAX_CACHE_ENTRIES)
    private val studentCache = LruCache<String, CachedStudent>(MAX_CACHE_ENTRIES)
    private val testInfoCache = LruCache<String, CachedTestInfo>(MAX_CACHE_ENTRIES)
    private val imageCache = LruCache<String, CachedImage>(MAX_CACHE_ENTRIES)
    
    // Disk cache for persistent storage
    private val diskCache = ConcurrentHashMap<String, CachedData>()
    
    // Cache statistics
    private var cacheHits = 0
    private var cacheMisses = 0
    private var cacheEvictions = 0

    /**
     * Caches a question with metadata
     * @param question The question to cache
     * @param priority Cache priority (higher = more likely to stay in memory)
     */
    fun cacheQuestion(question: Question, priority: Int = 1) {
        val cachedQuestion = CachedQuestion(
            data = question,
            timestamp = System.currentTimeMillis(),
            priority = priority,
            accessCount = 0
        )
        
        questionCache.put(question.questionId ?: question.id ?: "", cachedQuestion)
        diskCache[question.questionId ?: question.id ?: ""] = CachedData(
            data = question,
            timestamp = System.currentTimeMillis(),
            type = CacheType.QUESTION
        )
    }

    /**
     * Retrieves a cached question
     * @param questionId ID of the question to retrieve
     * @return Cached question or null if not found
     */
    fun getCachedQuestion(questionId: String): Question? {
        // Try memory cache first
        val memoryCached = questionCache.get(questionId)
        if (memoryCached != null && !isExpired(memoryCached.timestamp)) {
            memoryCached.accessCount++
            cacheHits++
            return memoryCached.data
        }

        // Try disk cache
        val diskCached = diskCache[questionId]
        if (diskCached != null && !isExpired(diskCached.timestamp)) {
            // Move to memory cache
            val question = diskCached.data as Question
            cacheQuestion(question, 2) // Higher priority for frequently accessed
            cacheHits++
            return question
        }

        cacheMisses++
        return null
    }

    /**
     * Caches a student with metadata
     * @param student The student to cache
     */
    fun cacheStudent(student: Student) {
        val cachedStudent = CachedStudent(
            data = student,
            timestamp = System.currentTimeMillis(),
            priority = 2, // Students are high priority
            accessCount = 0
        )
        
        studentCache.put(student.id, cachedStudent)
        diskCache[student.id] = CachedData(
            data = student,
            timestamp = System.currentTimeMillis(),
            type = CacheType.STUDENT
        )
    }

    /**
     * Retrieves a cached student
     * @param studentId ID of the student to retrieve
     * @return Cached student or null if not found
     */
    fun getCachedStudent(studentId: String): Student? {
        val memoryCached = studentCache.get(studentId)
        if (memoryCached != null && !isExpired(memoryCached.timestamp)) {
            memoryCached.accessCount++
            cacheHits++
            return memoryCached.data
        }

        val diskCached = diskCache[studentId]
        if (diskCached != null && !isExpired(diskCached.timestamp)) {
            val student = diskCached.data as Student
            cacheStudent(student)
            cacheHits++
            return student
        }

        cacheMisses++
        return null
    }

    /**
     * Caches test information
     * @param testInfo The test info to cache
     */
    fun cacheTestInfo(testInfo: TestInfo) {
        val cachedTestInfo = CachedTestInfo(
            data = testInfo,
            timestamp = System.currentTimeMillis(),
            priority = 1,
            accessCount = 0
        )
        
        testInfoCache.put(testInfo.id, cachedTestInfo)
        diskCache[testInfo.id] = CachedData(
            data = testInfo,
            timestamp = System.currentTimeMillis(),
            type = CacheType.TEST_INFO
        )
    }

    /**
     * Retrieves cached test info
     * @param testId ID of the test to retrieve
     * @return Cached test info or null if not found
     */
    fun getCachedTestInfo(testId: String): TestInfo? {
        val memoryCached = testInfoCache.get(testId)
        if (memoryCached != null && !isExpired(memoryCached.timestamp)) {
            memoryCached.accessCount++
            cacheHits++
            return memoryCached.data
        }

        val diskCached = diskCache[testId]
        if (diskCached != null && !isExpired(diskCached.timestamp)) {
            val testInfo = diskCached.data as TestInfo
            cacheTestInfo(testInfo)
            cacheHits++
            return testInfo
        }

        cacheMisses++
        return null
    }

    /**
     * Caches an image with compression
     * @param key Cache key for the image
     * @param bitmap The bitmap to cache
     * @param quality JPEG quality (1-100)
     */
    fun cacheImage(key: String, bitmap: Bitmap, quality: Int = 80) {
        cacheScope.launch {
            try {
                val compressedBitmap = compressBitmap(bitmap, quality)
                val cachedImage = CachedImage(
                    data = compressedBitmap,
                    timestamp = System.currentTimeMillis(),
                    priority = 1,
                    accessCount = 0,
                    size = compressedBitmap.byteCount
                )
                
                imageCache.put(key, cachedImage)
                
                // Store in disk cache as well
                diskCache[key] = CachedData(
                    data = compressedBitmap,
                    timestamp = System.currentTimeMillis(),
                    type = CacheType.IMAGE
                )
                
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Retrieves a cached image
     * @param key Cache key for the image
     * @return Cached bitmap or null if not found
     */
    fun getCachedImage(key: String): Bitmap? {
        val memoryCached = imageCache.get(key)
        if (memoryCached != null && !isExpired(memoryCached.timestamp)) {
            memoryCached.accessCount++
            cacheHits++
            return memoryCached.data
        }

        val diskCached = diskCache[key]
        if (diskCached != null && !isExpired(diskCached.timestamp)) {
            val bitmap = diskCached.data as Bitmap
            cacheImage(key, bitmap)
            cacheHits++
            return bitmap
        }

        cacheMisses++
        return null
    }

    /**
     * Preloads frequently accessed data
     * @param dataType Type of data to preload
     * @param keys List of keys to preload
     */
    fun preloadData(dataType: CacheType, keys: List<String>) {
        cacheScope.launch {
            try {
                when (dataType) {
                    CacheType.QUESTION -> {
                        // Preload questions from database or network
                        // This would be implemented based on your data source
                    }
                    CacheType.STUDENT -> {
                        // Preload student data
                    }
                    CacheType.TEST_INFO -> {
                        // Preload test information
                    }
                    CacheType.IMAGE -> {
                        // Preload images
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Cleans up expired cache entries
     */
    fun cleanupExpiredCache() {
        cacheScope.launch {
            try {
                val currentTime = System.currentTimeMillis()
                
                // Clean memory caches
                cleanupExpiredMemoryCache(questionCache, currentTime)
                cleanupExpiredMemoryCache(studentCache, currentTime)
                cleanupExpiredMemoryCache(testInfoCache, currentTime)
                cleanupExpiredMemoryCache(imageCache, currentTime)
                
                // Clean disk cache
                val expiredKeys = diskCache.entries.filter { 
                    isExpired(it.value.timestamp) 
                }.map { it.key }
                
                expiredKeys.forEach { key ->
                    diskCache.remove(key)
                }
                
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    /**
     * Gets cache statistics
     * @return Cache statistics
     */
    fun getCacheStatistics(): CacheStatistics {
        val totalMemorySize = questionCache.size() + studentCache.size() + 
                             testInfoCache.size() + imageCache.size()
        val totalDiskSize = diskCache.size
        
        return CacheStatistics(
            memoryCacheSize = totalMemorySize,
            diskCacheSize = totalDiskSize,
            cacheHits = cacheHits,
            cacheMisses = cacheMisses,
            cacheEvictions = cacheEvictions,
            hitRate = if (cacheHits + cacheMisses > 0) {
                (cacheHits.toFloat() / (cacheHits + cacheMisses)) * 100f
            } else 0f
        )
    }

    /**
     * Clears all caches
     */
    fun clearAllCaches() {
        questionCache.evictAll()
        studentCache.evictAll()
        testInfoCache.evictAll()
        imageCache.evictAll()
        diskCache.clear()
        
        cacheHits = 0
        cacheMisses = 0
        cacheEvictions = 0
    }

    /**
     * Checks if a cache entry is expired
     * @param timestamp Cache entry timestamp
     * @return True if expired
     */
    private fun isExpired(timestamp: Long): Boolean {
        return System.currentTimeMillis() - timestamp > CACHE_EXPIRY_TIME
    }

    /**
     * Compresses a bitmap for storage
     * @param bitmap Original bitmap
     * @param quality JPEG quality
     * @return Compressed bitmap
     */
    private suspend fun compressBitmap(bitmap: Bitmap, quality: Int): Bitmap = withContext(Dispatchers.IO) {
        // This is a simplified compression - in a real app you'd use more sophisticated compression
        bitmap
    }

    /**
     * Cleans up expired entries from memory cache
     * @param cache The cache to clean
     * @param currentTime Current timestamp
     */
    private fun <T> cleanupExpiredMemoryCache(cache: LruCache<String, T>, currentTime: Long) {
        val snapshot = cache.snapshot()
        val expiredKeys = snapshot.entries.filter { 
            val cached = it.value
            when (cached) {
                is CachedQuestion -> isExpired(cached.timestamp)
                is CachedStudent -> isExpired(cached.timestamp)
                is CachedTestInfo -> isExpired(cached.timestamp)
                is CachedImage -> isExpired(cached.timestamp)
                else -> false
            }
        }.map { it.key }
        
        expiredKeys.forEach { key ->
            cache.remove(key)
            cacheEvictions++
        }
    }

    /**
     * Enum for cache types
     */
    enum class CacheType {
        QUESTION, STUDENT, TEST_INFO, IMAGE
    }

    /**
     * Base class for cached data
     */
    data class CachedData(
        val data: Any,
        val timestamp: Long,
        val type: CacheType
    )

    /**
     * Cached question data
     */
    data class CachedQuestion(
        val data: Question,
        val timestamp: Long,
        val priority: Int,
        var accessCount: Int
    )

    /**
     * Cached student data
     */
    data class CachedStudent(
        val data: Student,
        val timestamp: Long,
        val priority: Int,
        var accessCount: Int
    )

    /**
     * Cached test info data
     */
    data class CachedTestInfo(
        val data: TestInfo,
        val timestamp: Long,
        val priority: Int,
        var accessCount: Int
    )

    /**
     * Cached image data
     */
    data class CachedImage(
        val data: Bitmap,
        val timestamp: Long,
        val priority: Int,
        var accessCount: Int,
        val size: Int
    )

    /**
     * Cache statistics
     */
    data class CacheStatistics(
        val memoryCacheSize: Int,
        val diskCacheSize: Int,
        val cacheHits: Int,
        val cacheMisses: Int,
        val cacheEvictions: Int,
        val hitRate: Float
    )
}
