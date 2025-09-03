package com.mws.services

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.view.WindowManager
import com.mws.database.entity.AppStateLog
import com.mws.database.entity.TestSession
import com.mws.testlogic.TestProcessor
import com.mws.utils.Logger
import java.util.*

/**
 * SecurityService - Anti-cheating and security monitoring
 * Integrates with TestProcessor for local test security
 */
class SecurityService(private val context: Context) {

    private var currentTestSession: TestSession? = null
    private var appStateLogs = mutableListOf<AppStateLog>()
    private var warningCount = 0
    private val MAX_WARNINGS = 3
    private val WARNING_TIMEOUT = 7000L // 7 seconds
    
    // Security violation callbacks
    private var onSecurityViolationListener: ((String, Int) -> Unit)? = null
    private var onFinalWarningListener: (() -> Unit)? = null

    companion object {
        private const val TAG = "SecurityService"
        private const val SCREEN_CAPTURE_PREVENTION = true
        private const val ORIENTATION_LOCK = true
        private const val APP_STATE_MONITORING = true
    }

    /**
     * Starts test protection when a test begins
     * Integrates with TestProcessor for local security
     */
    fun startTestProtection(testId: String, testType: String): TestSession {
        // Create test session with local token
        currentTestSession = createTestSession(testId, testType)
        
        // Apply security measures
        disableScreenshots()
        lockOrientation()
        startAppStateMonitoring()
        
        return currentTestSession!!
    }

    /**
     * Creates a test session with local token
     * Uses TestProcessor for token generation
     */
    private fun createTestSession(testId: String, testType: String): TestSession {
        val localToken = TestProcessor.generateLocalToken()
        return TestSession(
            testId = testId,
            testType = testType,
            localToken = localToken
        )
    }

    /**
     * Stops test protection when test ends
     */
    fun stopTestProtection() {
        currentTestSession?.let { session ->
            session.copy(isActive = false, isSubmitted = true, submissionTime = Date())
        }
        
        // Remove security measures
        enableScreenshots()
        unlockOrientation()
        stopAppStateMonitoring()
        
        currentTestSession = null
        warningCount = 0
    }

    /**
     * Disables screenshot capability
     */
    private fun disableScreenshots() {
        if (SCREEN_CAPTURE_PREVENTION) {
            // This will be implemented in the Activity
            // FLAG_SECURE will be set in the test activity
        }
    }

    /**
     * Enables screenshot capability
     */
    private fun enableScreenshots() {
        // Remove FLAG_SECURE from the activity
    }

    /**
     * Locks screen orientation
     */
    private fun lockOrientation() {
        if (ORIENTATION_LOCK) {
            // This will be implemented in the Activity
            // setRequestedOrientation() will be called
        }
    }

    /**
     * Unlocks screen orientation
     */
    private fun unlockOrientation() {
        // Allow orientation changes
    }

    /**
     * Starts monitoring app state changes
     */
    private fun startAppStateMonitoring() {
        if (APP_STATE_MONITORING) {
            // This will be implemented through Activity lifecycle callbacks
            // onPause(), onResume(), onStop(), onDestroy()
        }
    }

    /**
     * Stops monitoring app state changes
     */
    private fun stopAppStateMonitoring() {
        // Stop monitoring
    }

    /**
     * Records app state change (called from Activity lifecycle)
     */
    fun recordAppStateChange(eventType: String, backgroundDuration: Long = 0) {
        currentTestSession?.let { session ->
            val log = AppStateLog(
                testSessionId = session.id,
                eventType = eventType,
                timestamp = Date(),
                backgroundDuration = backgroundDuration,
                warningCount = warningCount
            )
            appStateLogs.add(log)
            
            // Check for suspicious activity
            checkForSuspiciousActivity(eventType, backgroundDuration)
        }
    }

    /**
     * Checks for suspicious activity and issues warnings
     */
    private fun checkForSuspiciousActivity(eventType: String, backgroundDuration: Long) {
        when (eventType) {
            "app_minimized" -> {
                if (backgroundDuration > WARNING_TIMEOUT) {
                    warningCount++
                    issueWarning("App minimized for too long")
                    
                    if (warningCount >= MAX_WARNINGS) {
                        handleMaxWarningsReached()
                    }
                }
            }
            "app_backgrounded" -> {
                if (backgroundDuration > WARNING_TIMEOUT) {
                    warningCount++
                    issueWarning("App backgrounded for too long")
                    
                    if (warningCount >= MAX_WARNINGS) {
                        handleMaxWarningsReached()
                    }
                }
            }
            "screen_off" -> {
                warningCount++
                issueWarning("Screen turned off during test")
                
                if (warningCount >= MAX_WARNINGS) {
                    handleMaxWarningsReached()
                }
            }
        }
    }

            /**
         * Issues a warning to the user
         */
        private fun issueWarning(message: String) {
            Logger.warning("Security warning issued: $message (Warning $warningCount/$MAX_WARNINGS)")
            
            // Notify UI through callback
            onSecurityViolationListener?.invoke(message, warningCount)
        }

            /**
         * Handles when maximum warnings are reached
         */
        private fun handleMaxWarningsReached() {
            Logger.error("Maximum security warnings reached - test will be auto-submitted")
            
            // Auto-submit test with "cheating" marked answers
            currentTestSession?.let { session ->
                // Mark incomplete answers as "cheating"
                // Submit test automatically
                // Log the incident
                Logger.error("Security violation: Test session ${session.id} marked for auto-submission")
            }
            
            // Notify UI through callback
            onFinalWarningListener?.invoke()
            
            // Stop test protection
            stopTestProtection()
        }

    /**
     * Gets current test session
     */
    fun getCurrentTestSession(): TestSession? = currentTestSession

    /**
     * Gets app state logs
     */
    fun getAppStateLogs(): List<AppStateLog> = appStateLogs

    /**
     * Gets current warning count
     */
    fun getWarningCount(): Int = warningCount

            /**
         * Resets warning count
         */
        fun resetWarningCount() {
            warningCount = 0
        }

        /**
         * Set callback for security violations
         */
        fun setOnSecurityViolationListener(listener: (String, Int) -> Unit) {
            onSecurityViolationListener = listener
        }

        /**
         * Set callback for final warning
         */
        fun setOnFinalWarningListener(listener: () -> Unit) {
            onFinalWarningListener = listener
        }

    /**
     * Validates test session integrity
     */
    fun validateTestSession(): Boolean {
        return currentTestSession?.let { session ->
            session.isActive && 
            session.localToken.isNotEmpty() &&
            warningCount < MAX_WARNINGS
        } ?: false
    }
}
