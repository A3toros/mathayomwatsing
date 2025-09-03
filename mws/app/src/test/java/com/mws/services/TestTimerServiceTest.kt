package com.mws.services

import android.app.NotificationManager
import android.content.Context
import android.os.CountDownTimer
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.MockitoAnnotations

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(AndroidJUnit4::class)
class TestTimerServiceTest {

    @Mock
    private lateinit var mockContext: Context
    
    @Mock
    private lateinit var mockNotificationManager: NotificationManager
    
    private lateinit var testTimerService: TestTimerService
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        MockitoAnnotations.openMocks(this)
        testDispatcher.setMain(testDispatcher)
        
        // Use ApplicationProvider for real context in tests
        val context = ApplicationProvider.getApplicationContext<Context>()
        testTimerService = TestTimerService()
        testTimerService.attachBaseContext(context)
    }

    @After
    fun tearDown() {
        testTimerService.stopTimer()
    }

    @Test
    fun `test startTimer initializes timer correctly`() = runTest {
        // Given
        val durationMinutes = 5
        
        // When
        testTimerService.startTimer(durationMinutes)
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(5, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertFalse(timeState.isPaused)
        assertEquals(0f, timeState.progressPercentage, 0.01f)
    }

    @Test
    fun `test pauseTimer pauses the timer`() = runTest {
        // Given
        testTimerService.startTimer(2)
        
        // When
        testTimerService.pauseTimer()
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertTrue(timeState.isPaused)
    }

    @Test
    fun `test resumeTimer resumes paused timer`() = runTest {
        // Given
        testTimerService.startTimer(2)
        testTimerService.pauseTimer()
        
        // When
        testTimerService.resumeTimer()
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertFalse(timeState.isPaused)
    }

    @Test
    fun `test stopTimer stops and resets timer`() = runTest {
        // Given
        testTimerService.startTimer(5)
        
        // When
        testTimerService.stopTimer()
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(0, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertEquals(0f, timeState.progressPercentage, 0.01f)
        assertFalse(timeState.isPaused)
    }

    @Test
    fun `test getRemainingTime returns correct format`() = runTest {
        // Given
        testTimerService.startTimer(2)
        
        // When
        val (minutes, seconds) = testTimerService.getRemainingTime()
        
        // Then
        assertEquals(2, minutes)
        assertEquals(0, seconds)
    }

    @Test
    fun `test getProgressPercentage calculates correctly`() = runTest {
        // Given
        testTimerService.startTimer(10)
        
        // When
        val progress = testTimerService.getProgressPercentage()
        
        // Then
        assertEquals(0f, progress, 0.01f)
    }

    @Test
    fun `test isTimeRunningLow returns true when time is low`() = runTest {
        // Given
        testTimerService.startTimer(1) // 1 minute
        
        // When
        val isLow = testTimerService.isTimeRunningLow()
        
        // Then
        assertTrue(isLow)
    }

    @Test
    fun `test isTimeCritical returns true when time is critical`() = runTest {
        // Given
        testTimerService.startTimer(1) // 1 minute
        
        // When
        val isCritical = testTimerService.isTimeCritical()
        
        // Then
        assertTrue(isCritical)
    }

    @Test
    fun `test timer countdown decreases time correctly`() = runTest {
        // Given
        testTimerService.startTimer(1) // 1 minute
        
        // When
        advanceTimeBy(1000) // Advance 1 second
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(0, timeState.remainingMinutes)
        assertEquals(59, timeState.remainingSeconds)
    }

    @Test
    fun `test timer progress increases over time`() = runTest {
        // Given
        testTimerService.startTimer(2) // 2 minutes
        
        // When
        advanceTimeBy(60000) // Advance 1 minute
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertTrue(timeState.progressPercentage > 0f)
    }

    @Test
    fun `test timer finishes when time expires`() = runTest {
        // Given
        testTimerService.startTimer(1) // 1 minute
        
        // When
        advanceTimeBy(60000) // Advance 1 minute
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(0, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertEquals(100f, timeState.progressPercentage, 0.01f)
    }

    @Test
    fun `test pauseTimer does nothing when already paused`() = runTest {
        // Given
        testTimerService.startTimer(5)
        testTimerService.pauseTimer()
        
        // When
        testTimerService.pauseTimer() // Try to pause again
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertTrue(timeState.isPaused)
    }

    @Test
    fun `test resumeTimer does nothing when not paused`() = runTest {
        // Given
        testTimerService.startTimer(5)
        
        // When
        testTimerService.resumeTimer() // Try to resume when not paused
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertFalse(timeState.isPaused)
    }

    @Test
    fun `test resumeTimer does nothing when timer is stopped`() = runTest {
        // Given
        testTimerService.startTimer(5)
        testTimerService.stopTimer()
        
        // When
        testTimerService.resumeTimer() // Try to resume stopped timer
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(0, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
    }

    @Test
    fun `test timer state updates correctly on pause and resume`() = runTest {
        // Given
        testTimerService.startTimer(5)
        
        // When - Pause
        testTimerService.pauseTimer()
        val pausedState = testTimerService.timeState.first()
        
        // Then
        assertTrue(pausedState.isPaused)
        
        // When - Resume
        testTimerService.resumeTimer()
        val resumedState = testTimerService.timeState.first()
        
        // Then
        assertFalse(resumedState.isPaused)
    }

    @Test
    fun `test timer handles edge case of zero duration`() = runTest {
        // Given
        val durationMinutes = 0
        
        // When
        testTimerService.startTimer(durationMinutes)
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(0, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertEquals(100f, timeState.progressPercentage, 0.01f)
    }

    @Test
    fun `test timer handles very long duration`() = runTest {
        // Given
        val durationMinutes = 1440 // 24 hours
        
        // When
        testTimerService.startTimer(durationMinutes)
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(1440, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertEquals(0f, timeState.progressPercentage, 0.01f)
    }

    @Test
    fun `test multiple start calls reset timer correctly`() = runTest {
        // Given
        testTimerService.startTimer(5)
        advanceTimeBy(30000) // Advance 30 seconds
        
        // When
        testTimerService.startTimer(3) // Start new 3-minute timer
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertEquals(3, timeState.remainingMinutes)
        assertEquals(0, timeState.remainingSeconds)
        assertEquals(0f, timeState.progressPercentage, 0.01f)
    }

    @Test
    fun `test timer state consistency across operations`() = runTest {
        // Given
        testTimerService.startTimer(5)
        
        // When - Perform multiple operations
        testTimerService.pauseTimer()
        testTimerService.resumeTimer()
        testTimerService.pauseTimer()
        testTimerService.resumeTimer()
        
        // Then
        val timeState = testTimerService.timeState.first()
        assertFalse(timeState.isPaused)
        assertTrue(timeState.remainingMinutes > 0 || timeState.remainingSeconds > 0)
    }
}
