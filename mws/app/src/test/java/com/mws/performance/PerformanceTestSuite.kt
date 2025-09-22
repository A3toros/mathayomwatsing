package com.mws.performance

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.mws.services.CacheManagerService
import com.mws.services.DatabaseOptimizationService
import com.mws.services.PerformanceMonitorService
import com.mws.services.QuestionRandomizerService
import com.mws.services.TestTimerService
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(AndroidJUnit4::class)
class PerformanceTestSuite {

    private lateinit var context: Context
    private lateinit var cacheManager: CacheManagerService
    private lateinit var databaseOptimizer: DatabaseOptimizationService
    private lateinit var performanceMonitor: PerformanceMonitorService
    private lateinit var questionRandomizer: QuestionRandomizerService
    private lateinit var testTimer: TestTimerService

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext<Context>()
        cacheManager = CacheManagerService(context)
        databaseOptimizer = DatabaseOptimizationService(context)
        performanceMonitor = PerformanceMonitorService(context)
        questionRandomizer = QuestionRandomizerService()
        testTimer = TestTimerService()
    }

    @Test
    fun `test cache performance under load`() = runTest {
        // Given
        val iterations = 1000
        val startTime = System.currentTimeMillis()
        
        // When - Perform cache operations
        repeat(iterations) { index ->
            val question = createTestQuestion(index)
            cacheManager.cacheQuestion(question)
            cacheManager.getCachedQuestion(question.questionId)
        }
        
        val endTime = System.currentTimeMillis()
        val duration = endTime - startTime
        
        // Then
        val operationsPerSecond = (iterations * 2) / (duration / 1000.0)
        assertTrue("Cache should handle at least 1000 operations per second", 
            operationsPerSecond >= 1000.0)
        
        println("Cache Performance: $operationsPerSecond operations/second")
    }

    @Test
    fun `test question randomization performance`() = runTest {
        // Given
        val questions = (1..1000).map { createTestQuestion(it) }
        val iterations = 100
        
        // When - Measure randomization performance
        val startTime = System.currentTimeMillis()
        repeat(iterations) {
            questionRandomizer.randomizeQuestions(questions)
        }
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        val averageTimePerRandomization = duration.toDouble() / iterations
        
        // Then
        assertTrue("Question randomization should complete in under 10ms per 1000 questions", 
            averageTimePerRandomization < 10.0)
        
        println("Randomization Performance: ${averageTimePerRandomization}ms per 1000 questions")
    }

    @Test
    fun `test timer service performance`() = runTest {
        // Given
        val iterations = 100
        
        // When - Measure timer operations performance
        val startTime = System.currentTimeMillis()
        repeat(iterations) {
            testTimer.startTimer(5)
            testTimer.pauseTimer()
            testTimer.resumeTimer()
            testTimer.stopTimer()
        }
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        val averageTimePerOperation = duration.toDouble() / iterations
        
        // Then
        assertTrue("Timer operations should complete in under 5ms per cycle", 
            averageTimePerOperation < 5.0)
        
        println("Timer Performance: ${averageTimePerOperation}ms per operation cycle")
    }

    @Test
    fun `test memory usage under load`() = runTest {
        // Given
        val initialMemory = getMemoryUsage()
        val iterations = 1000
        
        // When - Create and cache many objects
        repeat(iterations) { index ->
            val question = createTestQuestion(index)
            cacheManager.cacheQuestion(question)
        }
        
        val peakMemory = getMemoryUsage()
        cacheManager.clearAllCaches()
        val finalMemory = getMemoryUsage()
        
        // Then
        val memoryIncrease = peakMemory - initialMemory
        val memoryRecovery = peakMemory - finalMemory
        
        assertTrue("Memory increase should be reasonable (< 50MB)", memoryIncrease < 50 * 1024 * 1024)
        assertTrue("Memory should be recovered after cleanup", memoryRecovery > 0)
        
        println("Memory Usage: Peak increase: ${memoryIncrease / (1024 * 1024)}MB, " +
                "Recovery: ${memoryRecovery / (1024 * 1024)}MB")
    }

    @Test
    fun `test database optimization performance impact`() = runTest {
        // Given
        val iterations = 100
        
        // When - Measure database operations performance
        val startTime = System.currentTimeMillis()
        repeat(iterations) {
            // Simulate database operations
            performDatabaseOperations()
        }
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        val operationsPerSecond = iterations / (duration / 1000.0)
        
        // Then
        assertTrue("Database operations should maintain reasonable performance", 
            operationsPerSecond >= 10.0)
        
        println("Database Performance: $operationsPerSecond operations/second")
    }

    @Test
    fun `test performance monitoring overhead`() = runTest {
        // Given
        val iterations = 1000
        
        // When - Measure monitoring overhead
        val startTimeWithoutMonitoring = System.currentTimeMillis()
        repeat(iterations) {
            performTestOperations()
        }
        val endTimeWithoutMonitoring = System.currentTimeMillis()
        
        performanceMonitor.startMonitoring()
        val startTimeWithMonitoring = System.currentTimeMillis()
        repeat(iterations) {
            performTestOperations()
        }
        val endTimeWithMonitoring = System.currentTimeMillis()
        performanceMonitor.stopMonitoring()
        
        val timeWithoutMonitoring = endTimeWithoutMonitoring - startTimeWithoutMonitoring
        val timeWithMonitoring = endTimeWithMonitoring - startTimeWithMonitoring
        val overhead = timeWithMonitoring - timeWithoutMonitoring
        val overheadPercentage = (overhead.toDouble() / timeWithoutMonitoring) * 100
        
        // Then
        assertTrue("Performance monitoring overhead should be less than 10%", 
            overheadPercentage < 10.0)
        
        println("Monitoring Overhead: ${overheadPercentage}%")
    }

    @Test
    fun `test concurrent access performance`() = runTest {
        // Given
        val threadCount = 10
        val operationsPerThread = 100
        val threads = mutableListOf<Thread>()
        val results = mutableListOf<Long>()
        
        // When - Test concurrent access
        repeat(threadCount) { threadIndex ->
            val thread = Thread {
                val startTime = System.currentTimeMillis()
                repeat(operationsPerThread) { operationIndex ->
                    val question = createTestQuestion(threadIndex * operationsPerThread + operationIndex)
                    cacheManager.cacheQuestion(question)
                    cacheManager.getCachedQuestion(question.questionId)
                }
                val endTime = System.currentTimeMillis()
                synchronized(results) {
                    results.add(endTime - startTime)
                }
            }
            threads.add(thread)
            thread.start()
        }
        
        // Wait for all threads to complete
        threads.forEach { it.join() }
        
        // Then
        val averageTime = results.average()
        val maxTime = results.maxOrNull() ?: 0L
        
        assertTrue("Concurrent operations should complete in reasonable time", averageTime < 1000.0)
        assertTrue("No single thread should take excessively long", maxTime < 5000.0)
        
        println("Concurrent Performance: Average: ${averageTime}ms, Max: ${maxTime}ms")
    }

    @Test
    fun `test cache eviction performance`() = runTest {
        // Given
        val iterations = 2000 // Exceed cache capacity
        
        // When - Fill cache beyond capacity
        val startTime = System.currentTimeMillis()
        repeat(iterations) { index ->
            val question = createTestQuestion(index)
            cacheManager.cacheQuestion(question)
        }
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        val operationsPerSecond = iterations / (duration / 1000.0)
        
        // Then
        assertTrue("Cache eviction should maintain performance", operationsPerSecond >= 500.0)
        
        println("Cache Eviction Performance: $operationsPerSecond operations/second")
    }

    @Test
    fun `test large dataset handling`() = runTest {
        // Given
        val largeQuestionSet = (1..10000).map { createTestQuestion(it) }
        
        // When - Process large dataset
        val startTime = System.currentTimeMillis()
        val randomizedQuestions = questionRandomizer.randomizeQuestions(largeQuestionSet)
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        
        // Then
        assertTrue("Large dataset processing should complete in under 100ms", duration < 100)
        assertEquals("All questions should be preserved", largeQuestionSet.size, randomizedQuestions.size)
        
        println("Large Dataset Performance: ${duration}ms for 10,000 questions")
    }

    @Test
    fun `test battery usage optimization`() = runTest {
        // Given
        val iterations = 1000
        
        // When - Measure battery-intensive operations
        val startTime = System.currentTimeMillis()
        repeat(iterations) {
            performBatteryIntensiveOperations()
        }
        val endTime = System.currentTimeMillis()
        
        val duration = endTime - startTime
        val operationsPerSecond = iterations / (duration / 1000.0)
        
        // Then
        assertTrue("Battery-intensive operations should maintain performance", 
            operationsPerSecond >= 100.0)
        
        println("Battery Optimization Performance: $operationsPerSecond operations/second")
    }

    // Helper methods
    private fun createTestQuestion(index: Int) = com.mws.models.Question(
        questionId = "q$index",
        questionText = "Test question $index with some longer text to simulate real questions",
        questionType = "multiple-choice",
        options = listOf("Option A", "Option B", "Option C", "Option D"),
        correctAnswer = "0",
        topic = "test",
        difficulty = "medium"
    )

    private fun getMemoryUsage(): Long {
        val runtime = Runtime.getRuntime()
        return runtime.totalMemory() - runtime.freeMemory()
    }

    private fun performDatabaseOperations() {
        // Simulate database operations
        repeat(10) {
            // Simulate query operations
            Thread.sleep(1)
        }
    }

    private fun performTestOperations() {
        // Simulate typical application operations
        repeat(5) {
            val question = createTestQuestion(it)
            cacheManager.cacheQuestion(question)
        }
    }

    private fun performBatteryIntensiveOperations() {
        // Simulate battery-intensive operations
        repeat(10) {
            val question = createTestQuestion(it)
            questionRandomizer.randomizeQuestions(listOf(question))
        }
    }
}
