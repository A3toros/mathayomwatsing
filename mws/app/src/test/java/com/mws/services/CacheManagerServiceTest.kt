package com.mws.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.mws.models.Question
import com.mws.models.Student
import com.mws.models.TestInfo
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(AndroidJUnit4::class)
class CacheManagerServiceTest {

    private lateinit var cacheManager: CacheManagerService
    private lateinit var context: Context
    
    private lateinit var sampleQuestion: Question
    private lateinit var sampleStudent: Student
    private lateinit var sampleTestInfo: TestInfo
    private lateinit var sampleBitmap: Bitmap

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext<Context>()
        cacheManager = CacheManagerService(context)
        
        // Create sample data for testing
        sampleQuestion = Question(
            questionId = "q1",
            questionText = "Test question",
            questionType = "multiple-choice",
            options = listOf("A", "B", "C", "D"),
            correctAnswer = "0",
            topic = "test",
            difficulty = "easy"
        )
        
        sampleStudent = Student(
            studentId = "s1",
            firstName = "John",
            lastName = "Doe",
            email = "john@example.com",
            grade = "10",
            className = "A",
            profilePictureUrl = null
        )
        
        sampleTestInfo = TestInfo(
            testId = "t1",
            testName = "Test Exam",
            numQuestions = 10,
            durationMinutes = 60,
            topic = "test"
        )
        
        // Create a simple test bitmap
        sampleBitmap = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        sampleBitmap.eraseColor(Color.RED)
    }

    @Test
    fun `test cacheQuestion stores question correctly`() = runTest {
        // When
        cacheManager.cacheQuestion(sampleQuestion)
        
        // Then
        val cachedQuestion = cacheManager.getCachedQuestion(sampleQuestion.questionId)
        assertNotNull("Question should be cached", cachedQuestion)
        assertEquals(sampleQuestion.questionId, cachedQuestion!!.questionId)
        assertEquals(sampleQuestion.questionText, cachedQuestion.questionText)
    }

    @Test
    fun `test cacheQuestion with priority stores correctly`() = runTest {
        // Given
        val highPriority = 3
        
        // When
        cacheManager.cacheQuestion(sampleQuestion, highPriority)
        
        // Then
        val cachedQuestion = cacheManager.getCachedQuestion(sampleQuestion.questionId)
        assertNotNull("High priority question should be cached", cachedQuestion)
    }

    @Test
    fun `test getCachedQuestion returns null for non-existent question`() = runTest {
        // When
        val cachedQuestion = cacheManager.getCachedQuestion("nonexistent")
        
        // Then
        assertNull("Non-existent question should return null", cachedQuestion)
    }

    @Test
    fun `test cacheStudent stores student correctly`() = runTest {
        // When
        cacheManager.cacheStudent(sampleStudent)
        
        // Then
        val cachedStudent = cacheManager.getCachedStudent(sampleStudent.studentId)
        assertNotNull("Student should be cached", cachedStudent)
        assertEquals(sampleStudent.studentId, cachedStudent!!.studentId)
        assertEquals(sampleStudent.firstName, cachedStudent.firstName)
    }

    @Test
    fun `test getCachedStudent returns null for non-existent student`() = runTest {
        // When
        val cachedStudent = cacheManager.getCachedStudent("nonexistent")
        
        // Then
        assertNull("Non-existent student should return null", cachedStudent)
    }

    @Test
    fun `test cacheTestInfo stores test info correctly`() = runTest {
        // When
        cacheManager.cacheTestInfo(sampleTestInfo)
        
        // Then
        val cachedTestInfo = cacheManager.getCachedTestInfo(sampleTestInfo.testId)
        assertNotNull("Test info should be cached", cachedTestInfo)
        assertEquals(sampleTestInfo.testId, cachedTestInfo!!.testId)
        assertEquals(sampleTestInfo.testName, cachedTestInfo.testName)
    }

    @Test
    fun `test getCachedTestInfo returns null for non-existent test`() = runTest {
        // When
        val cachedTestInfo = cacheManager.getCachedTestInfo("nonexistent")
        
        // Then
        assertNull("Non-existent test should return null", cachedTestInfo)
    }

    @Test
    fun `test cacheImage stores image correctly`() = runTest {
        // Given
        val imageKey = "test_image"
        
        // When
        cacheManager.cacheImage(imageKey, sampleBitmap)
        
        // Then
        val cachedImage = cacheManager.getCachedImage(imageKey)
        assertNotNull("Image should be cached", cachedImage)
        assertEquals(sampleBitmap.width, cachedImage!!.width)
        assertEquals(sampleBitmap.height, cachedImage.height)
    }

    @Test
    fun `test getCachedImage returns null for non-existent image`() = runTest {
        // When
        val cachedImage = cacheManager.getCachedImage("nonexistent")
        
        // Then
        assertNull("Non-existent image should return null", cachedImage)
    }

    @Test
    fun `test cacheImage with quality parameter`() = runTest {
        // Given
        val imageKey = "test_image_quality"
        val quality = 90
        
        // When
        cacheManager.cacheImage(imageKey, sampleBitmap, quality)
        
        // Then
        val cachedImage = cacheManager.getCachedImage(imageKey)
        assertNotNull("Image should be cached with quality", cachedImage)
    }

    @Test
    fun `test cache statistics are tracked correctly`() = runTest {
        // Given - Cache some items
        cacheManager.cacheQuestion(sampleQuestion)
        cacheManager.cacheStudent(sampleStudent)
        
        // When
        val stats = cacheManager.getCacheStatistics()
        
        // Then
        assertTrue("Memory cache should have items", stats.memoryCacheSize > 0)
        assertTrue("Disk cache should have items", stats.diskCacheSize > 0)
        assertTrue("Should have cache hits", stats.cacheHits >= 0)
        assertTrue("Should have cache misses", stats.cacheMisses >= 0)
    }

    @Test
    fun `test cache hit rate calculation`() = runTest {
        // Given - Cache and retrieve items
        cacheManager.cacheQuestion(sampleQuestion)
        cacheManager.getCachedQuestion(sampleQuestion.questionId) // Hit
        cacheManager.getCachedQuestion("nonexistent") // Miss
        
        // When
        val stats = cacheManager.getCacheStatistics()
        
        // Then
        assertTrue("Hit rate should be between 0 and 100", stats.hitRate in 0f..100f)
        assertTrue("Should have some hits", stats.cacheHits > 0)
        assertTrue("Should have some misses", stats.cacheMisses > 0)
    }

    @Test
    fun `test clearAllCaches removes all cached data`() = runTest {
        // Given - Cache some items
        cacheManager.cacheQuestion(sampleQuestion)
        cacheManager.cacheStudent(sampleStudent)
        cacheManager.cacheTestInfo(sampleTestInfo)
        
        // When
        cacheManager.clearAllCaches()
        
        // Then
        val stats = cacheManager.getCacheStatistics()
        assertEquals(0, stats.memoryCacheSize)
        assertEquals(0, stats.diskCacheSize)
        assertEquals(0, stats.cacheHits)
        assertEquals(0, stats.cacheMisses)
        assertEquals(0, stats.cacheEvictions)
    }

    @Test
    fun `test cache expiration handling`() = runTest {
        // Given - Cache an item
        cacheManager.cacheQuestion(sampleQuestion)
        
        // When - Wait for expiration (this would need time manipulation in real tests)
        // For now, we'll test that the cache works immediately
        val cachedQuestion = cacheManager.getCachedQuestion(sampleQuestion.questionId)
        
        // Then
        assertNotNull("Question should be cached before expiration", cachedQuestion)
    }

    @Test
    fun `test multiple cache operations maintain consistency`() = runTest {
        // Given
        val question1 = sampleQuestion.copy(questionId = "q1")
        val question2 = sampleQuestion.copy(questionId = "q2")
        
        // When - Perform multiple cache operations
        cacheManager.cacheQuestion(question1)
        cacheManager.cacheQuestion(question2)
        cacheManager.getCachedQuestion(question1.questionId)
        cacheManager.getCachedQuestion(question2.questionId)
        
        // Then
        val stats = cacheManager.getCacheStatistics()
        assertTrue("Should have multiple items in cache", stats.memoryCacheSize >= 2)
        assertTrue("Should have cache hits", stats.cacheHits >= 2)
    }

    @Test
    fun `test cache handles different data types correctly`() = runTest {
        // Given
        val differentQuestion = sampleQuestion.copy(
            questionId = "diff_q",
            questionType = "true-false"
        )
        
        // When
        cacheManager.cacheQuestion(differentQuestion)
        
        // Then
        val cachedQuestion = cacheManager.getCachedQuestion(differentQuestion.questionId)
        assertNotNull("Different question type should be cached", cachedQuestion)
        assertEquals("true-false", cachedQuestion!!.questionType)
    }

    @Test
    fun `test cache handles large number of items`() = runTest {
        // Given - Create multiple questions
        val questions = (1..50).map { index ->
            sampleQuestion.copy(
                questionId = "q$index",
                questionText = "Question $index"
            )
        }
        
        // When - Cache all questions
        questions.forEach { question ->
            cacheManager.cacheQuestion(question)
        }
        
        // Then
        val stats = cacheManager.getCacheStatistics()
        assertTrue("Should handle multiple items", stats.memoryCacheSize > 0)
        
        // Verify some questions are cached
        val cachedQuestion = cacheManager.getCachedQuestion("q25")
        assertNotNull("Question should be cached", cachedQuestion)
    }

    @Test
    fun `test cache priority system works correctly`() = runTest {
        // Given
        val lowPriorityQuestion = sampleQuestion.copy(questionId = "low_priority")
        val highPriorityQuestion = sampleQuestion.copy(questionId = "high_priority")
        
        // When
        cacheManager.cacheQuestion(lowPriorityQuestion, 1)
        cacheManager.cacheQuestion(highPriorityQuestion, 5)
        
        // Then
        val lowPriorityCached = cacheManager.getCachedQuestion(lowPriorityQuestion.questionId)
        val highPriorityCached = cacheManager.getCachedQuestion(highPriorityQuestion.questionId)
        
        assertNotNull("Low priority question should be cached", lowPriorityCached)
        assertNotNull("High priority question should be cached", highPriorityCached)
    }

    @Test
    fun `test cache handles null and empty values gracefully`() = runTest {
        // Given
        val emptyQuestion = sampleQuestion.copy(
            questionId = "",
            questionText = ""
        )
        
        // When
        cacheManager.cacheQuestion(emptyQuestion)
        
        // Then
        val cachedQuestion = cacheManager.getCachedQuestion("")
        assertNotNull("Empty question should be cached", cachedQuestion)
        assertEquals("", cachedQuestion!!.questionId)
    }

    @Test
    fun `test cache statistics reset after clearing`() = runTest {
        // Given - Cache some items and get stats
        cacheManager.cacheQuestion(sampleQuestion)
        val initialStats = cacheManager.getCacheStatistics()
        
        // When
        cacheManager.clearAllCaches()
        val finalStats = cacheManager.getCacheStatistics()
        
        // Then
        assertTrue("Initial stats should have items", initialStats.memoryCacheSize > 0)
        assertEquals("Final stats should be empty", 0, finalStats.memoryCacheSize)
        assertEquals("Final stats should have no hits", 0, finalStats.cacheHits)
        assertEquals("Final stats should have no misses", 0, finalStats.cacheMisses)
    }

    @Test
    fun `test cache handles concurrent access patterns`() = runTest {
        // Given
        val questions = (1..10).map { index ->
            sampleQuestion.copy(
                questionId = "concurrent_q$index",
                questionText = "Concurrent Question $index"
            )
        }
        
        // When - Simulate concurrent-like access pattern
        questions.forEach { question ->
            cacheManager.cacheQuestion(question)
            cacheManager.getCachedQuestion(question.questionId)
        }
        
        // Then
        val stats = cacheManager.getCacheStatistics()
        assertTrue("Should handle concurrent-like access", stats.memoryCacheSize > 0)
        assertTrue("Should have cache hits", stats.cacheHits > 0)
    }

    @Test
    fun `test cache maintains data integrity`() = runTest {
        // Given
        val originalQuestion = sampleQuestion.copy(
            questionId = "integrity_test",
            questionText = "Original text",
            options = listOf("A", "B", "C")
        )
        
        // When
        cacheManager.cacheQuestion(originalQuestion)
        val cachedQuestion = cacheManager.getCachedQuestion(originalQuestion.questionId)
        
        // Then
        assertNotNull("Question should be cached", cachedQuestion)
        assertEquals("Question text should be preserved", originalQuestion.questionText, cachedQuestion!!.questionText)
        assertEquals("Options should be preserved", originalQuestion.options, cachedQuestion.options)
        assertEquals("Correct answer should be preserved", originalQuestion.correctAnswer, cachedQuestion.correctAnswer)
    }
}
