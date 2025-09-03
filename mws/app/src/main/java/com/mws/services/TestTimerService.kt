package com.mws.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.mws.R
import com.mws.activities.TestActivity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * TestTimerService - Manages test timing and notifications
 * Provides countdown timer, pause/resume functionality, and time warnings
 */
class TestTimerService : Service() {

    private val binder = TestTimerBinder()
    private var countDownTimer: CountDownTimer? = null
    private var isPaused = false
    private var remainingTimeMillis = 0L
    private var totalTimeMillis = 0L

    private val _timeState = MutableStateFlow(TimeState())
    val timeState: StateFlow<TimeState> = _timeState.asStateFlow()

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "test_timer_channel"
        private const val WARNING_THRESHOLD = 5 * 60 * 1000L // 5 minutes
        private const val CRITICAL_THRESHOLD = 2 * 60 * 1000L // 2 minutes
    }

    inner class TestTimerBinder : Binder() {
        fun getService(): TestTimerService = this@TestTimerService
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        stopTimer()
        stopForeground(true)
    }

    /**
     * Starts the test timer
     * @param durationMinutes Duration of the test in minutes
     */
    fun startTimer(durationMinutes: Int) {
        totalTimeMillis = durationMinutes * 60 * 1000L
        remainingTimeMillis = totalTimeMillis
        isPaused = false

        startForeground(NOTIFICATION_ID, createNotification())
        startCountDownTimer()
    }

    /**
     * Pauses the timer
     */
    fun pauseTimer() {
        if (!isPaused && countDownTimer != null) {
            isPaused = true
            countDownTimer?.cancel()
            updateTimeState()
        }
    }

    /**
     * Resumes the timer
     */
    fun resumeTimer() {
        if (isPaused && remainingTimeMillis > 0) {
            isPaused = false
            startCountDownTimer()
        }
    }

    /**
     * Stops the timer
     */
    fun stopTimer() {
        countDownTimer?.cancel()
        countDownTimer = null
        isPaused = false
        remainingTimeMillis = 0
        updateTimeState()
        stopForeground(true)
    }

    /**
     * Gets remaining time in minutes and seconds
     */
    fun getRemainingTime(): Pair<Int, Int> {
        val totalSeconds = (remainingTimeMillis / 1000).toInt()
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return Pair(minutes, seconds)
    }

    /**
     * Gets progress percentage
     */
    fun getProgressPercentage(): Float {
        if (totalTimeMillis <= 0) return 0f
        val elapsed = totalTimeMillis - remainingTimeMillis
        return (elapsed.toFloat() / totalTimeMillis.toFloat()) * 100f
    }

    /**
     * Checks if time is running low
     */
    fun isTimeRunningLow(): Boolean {
        return remainingTimeMillis <= WARNING_THRESHOLD
    }

    /**
     * Checks if time is critical
     */
    fun isTimeCritical(): Boolean {
        return remainingTimeMillis <= CRITICAL_THRESHOLD
    }

    private fun startCountDownTimer() {
        countDownTimer = object : CountDownTimer(remainingTimeMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                remainingTimeMillis = millisUntilFinished
                updateTimeState()
                updateNotification()
                
                // Check for time warnings
                when {
                    millisUntilFinished <= CRITICAL_THRESHOLD -> {
                        sendTimeWarningNotification("Critical: Less than 2 minutes remaining!")
                    }
                    millisUntilFinished <= WARNING_THRESHOLD -> {
                        sendTimeWarningNotification("Warning: Less than 5 minutes remaining!")
                    }
                }
            }

            override fun onFinish() {
                remainingTimeMillis = 0
                isPaused = false
                updateTimeState()
                sendTimeUpNotification()
                stopForeground(true)
            }
        }.start()
    }

    private fun updateTimeState() {
        val (minutes, seconds) = getRemainingTime()
        val progress = getProgressPercentage()
        
        _timeState.value = TimeState(
            remainingMinutes = minutes,
            remainingSeconds = seconds,
            progressPercentage = progress,
            isPaused = isPaused,
            isTimeRunningLow = isTimeRunningLow(),
            isTimeCritical = isTimeCritical()
        )
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Test Timer",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows test timer progress"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): android.app.Notification {
        val (minutes, seconds) = getRemainingTime()
        val timeText = String.format("%02d:%02d", minutes, seconds)
        
        val intent = Intent(this, TestActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Test in Progress")
            .setContentText("Time remaining: $timeText")
            .setSmallIcon(R.drawable.ic_assignment)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun sendTimeWarningNotification(message: String) {
        // Create a separate notification for time warnings
        val warningNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Time Warning")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_warning)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID + 1, warningNotification)
    }

    private fun sendTimeUpNotification() {
        val timeUpNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Time's Up!")
            .setContentText("Your test time has expired")
            .setSmallIcon(R.drawable.ic_assignment)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID + 2, timeUpNotification)
    }

    /**
     * Data class representing the current time state
     */
    data class TimeState(
        val remainingMinutes: Int = 0,
        val remainingSeconds: Int = 0,
        val progressPercentage: Float = 0f,
        val isPaused: Boolean = false,
        val isTimeRunningLow: Boolean = false,
        val isTimeCritical: Boolean = false
    )
}
