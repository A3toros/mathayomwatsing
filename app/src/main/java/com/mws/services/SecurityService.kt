package com.mws.services

import android.content.Context
import android.content.pm.ActivityInfo
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import com.mws.database.AppDatabase
import com.mws.database.entity.TestSession
import com.mws.database.entity.AppStateLog
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Date
import java.util.UUID

class SecurityService(
    private val context: Context,
    private val callback: SecurityCallback
) {
    
    companion object {
        private const val MAX_BACKGROUND_TIME = 7000L // 7 seconds
        private const val MAX_WARNINGS = 3
    }
    
    private val database = AppDatabase.getInstance(context)
    private var currentTestSession: TestSession? = null
    private var backgroundTimer: Handler? = null
    private var appMinimizedTime: Long = 0
    private var warningCount: Int = 0
    
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    
    interface SecurityCallback {
        fun onAutoSubmitRequired()
        fun onWarningShown(warningNumber: Int)
    }

    fun startTestProtection(testId: String, testType: String) {
        // Create new test session with unique token
        currentTestSession = createTestSession(testId, testType)
        
        // Start monitoring app state
        startAppStateMonitoring()
        
        // Disable screenshots and lock orientation
        disableScreenshots()
        lockOrientation()
    }

    private fun createTestSession(testId: String, testType: String): TestSession {
        val session = TestSession(
            testId = testId,
            testType = testType,
            localToken = UUID.randomUUID().toString()
        )
        
        // Save to local database
        coroutineScope.launch {
            val sessionId = database.testSessionDao().insert(session)
            currentTestSession = session.copy(id = sessionId)
        }
        
        return session
    }

    fun onActivityPaused() {
        currentTestSession?.let { session ->
            if (session.isActive) {
                appMinimizedTime = System.currentTimeMillis()
                logAppState("minimized", 0)
                
                // Start 7-second timer
                startBackgroundTimer()
            }
        }
    }

    fun onActivityResumed() {
        currentTestSession?.let { session ->
            if (session.isActive) {
                val backgroundDuration = System.currentTimeMillis() - appMinimizedTime
                
                if (backgroundDuration >= MAX_BACKGROUND_TIME) {
                    // App was minimized for more than 7 seconds
                    warningCount++
                    logAppState("returned", backgroundDuration)
                    
                    if (warningCount >= MAX_WARNINGS) {
                        // Auto-submit test after 3 warnings
                        autoSubmitTest()
                    } else {
                        // Show warning
                        showCheatingWarning(warningCount)
                    }
                } else {
                    // App returned before 7 seconds - no action needed
                    logAppState("returned", backgroundDuration)
                }
                
                // Cancel background timer
                cancelBackgroundTimer()
            }
        }
    }

    private fun startBackgroundTimer() {
        backgroundTimer = Handler(Looper.getMainLooper()).apply {
            postDelayed({
                // 7 seconds passed - log warning
                warningCount++
                logAppState("warning_shown", MAX_BACKGROUND_TIME)
                
                if (warningCount >= MAX_WARNINGS) {
                    autoSubmitTest()
                } else {
                    showCheatingWarning(warningCount)
                }
            }, MAX_BACKGROUND_TIME)
        }
    }

    private fun cancelBackgroundTimer() {
        backgroundTimer?.removeCallbacksAndMessages(null)
        backgroundTimer = null
    }

    private fun showCheatingWarning(warningNumber: Int) {
        callback.onWarningShown(warningNumber)
    }

    private fun autoSubmitTest() {
        callback.onAutoSubmitRequired()
        
        // Mark session as submitted
        currentTestSession?.let { session ->
            val updatedSession = session.copy(
                isActive = false,
                isSubmitted = true,
                submissionTime = Date()
            )
            
            coroutineScope.launch {
                database.testSessionDao().update(updatedSession)
            }
        }
        
        resetSecurityMonitoring()
    }

    fun onTestSubmitted() {
        // Test was submitted normally - disable security monitoring
        currentTestSession?.let { session ->
            val updatedSession = session.copy(
                isActive = false,
                isSubmitted = true,
                submissionTime = Date()
            )
            
            coroutineScope.launch {
                database.testSessionDao().update(updatedSession)
            }
        }
        
        resetSecurityMonitoring()
    }

    private fun resetSecurityMonitoring() {
        // Reset all security variables
        warningCount = 0
        currentTestSession = null
        cancelBackgroundTimer()
        
        // Re-enable screenshots and orientation
        enableScreenshots()
        unlockOrientation()
    }

    private fun logAppState(eventType: String, backgroundDuration: Long) {
        currentTestSession?.let { session ->
            val log = AppStateLog(
                testSessionId = session.id,
                eventType = eventType,
                backgroundDuration = backgroundDuration,
                warningCount = warningCount,
                timestamp = Date()
            )
            
            coroutineScope.launch {
                database.appStateLogDao().insert(log)
            }
        }
    }

    private fun disableScreenshots() {
        if (context is android.app.Activity) {
            context.window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            )
        }
    }

    private fun enableScreenshots() {
        if (context is android.app.Activity) {
            context.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    private fun lockOrientation() {
        if (context is android.app.Activity) {
            context.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
    }

    private fun unlockOrientation() {
        if (context is android.app.Activity) {
            context.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    fun getCurrentTestSession(): TestSession? = currentTestSession

    fun isTestActive(): Boolean = currentTestSession?.isActive == true
}
