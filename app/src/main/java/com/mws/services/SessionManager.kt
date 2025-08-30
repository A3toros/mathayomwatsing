package com.mws.services

import android.content.Context
import android.content.SharedPreferences
import com.mws.models.Student
import com.mws.network.NetworkModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.*

class SessionManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences("mws_session", Context.MODE_PRIVATE)
    private val apiService = NetworkModule.apiService
    private val coroutineScope = CoroutineScope(Dispatchers.IO)
    
    companion object {
        private const val KEY_STUDENT_ID = "student_id"
        private const val KEY_STUDENT_NAME = "student_name"
        private const val KEY_SESSION_TOKEN = "session_token"
        private const val KEY_LOGIN_TIME = "login_time"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val SESSION_TIMEOUT = 24 * 60 * 60 * 1000L // 24 hours
    }
    
    /**
     * Save student session after successful login
     */
    fun saveSession(student: Student, sessionToken: String) {
        val editor = prefs.edit()
        editor.putString(KEY_STUDENT_ID, student.studentId)
        editor.putString(KEY_STUDENT_NAME, "${student.name} ${student.surname}")
        editor.putString(KEY_SESSION_TOKEN, sessionToken)
        editor.putLong(KEY_LOGIN_TIME, System.currentTimeMillis())
        editor.putBoolean(KEY_IS_LOGGED_IN, true)
        editor.apply()
    }
    
    /**
     * Check if user is currently logged in
     */
    fun isLoggedIn(): Boolean {
        val isLoggedIn = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
        if (!isLoggedIn) return false
        
        // Check session timeout
        val loginTime = prefs.getLong(KEY_LOGIN_TIME, 0)
        val currentTime = System.currentTimeMillis()
        
        if (currentTime - loginTime > SESSION_TIMEOUT) {
            // Session expired, clear it
            clearSession()
            return false
        }
        
        return true
    }
    
    /**
     * Get current student ID
     */
    fun getCurrentStudentId(): String? {
        return if (isLoggedIn()) prefs.getString(KEY_STUDENT_ID, null) else null
    }
    
    /**
     * Get current student name
     */
    fun getCurrentStudentName(): String? {
        return if (isLoggedIn()) prefs.getString(KEY_STUDENT_NAME, null) else null
    }
    
    /**
     * Get current session token
     */
    fun getCurrentSessionToken(): String? {
        return if (isLoggedIn()) prefs.getString(KEY_SESSION_TOKEN, null) else null
    }
    
    /**
     * Validate session with backend
     */
    fun validateSession(onValid: () -> Unit, onInvalid: () -> Unit) {
        val studentId = getCurrentStudentId()
        val sessionToken = getCurrentSessionToken()
        
        if (studentId == null || sessionToken == null) {
            onInvalid()
            return
        }
        
        coroutineScope.launch {
            try {
                val response = apiService.validateSession(
                    com.mws.models.SessionRequest(studentId, sessionToken)
                )
                
                if (response.success && response.valid == true) {
                    onValid()
                } else {
                    onInvalid()
                }
            } catch (e: Exception) {
                // Network error, assume session is invalid
                onInvalid()
            }
        }
    }
    
    /**
     * Extend session with backend
     */
    fun extendSession(onSuccess: () -> Unit, onFailure: () -> Unit) {
        val studentId = getCurrentStudentId()
        val sessionToken = getCurrentSessionToken()
        
        if (studentId == null || sessionToken == null) {
            onFailure()
            return
        }
        
        coroutineScope.launch {
            try {
                val response = apiService.extendSession(
                    com.mws.models.SessionRequest(studentId, sessionToken)
                )
                
                if (response.success) {
                    // Update login time
                    val editor = prefs.edit()
                    editor.putLong(KEY_LOGIN_TIME, System.currentTimeMillis())
                    editor.apply()
                    onSuccess()
                } else {
                    onFailure()
                }
            } catch (e: Exception) {
                onFailure()
            }
        }
    }
    
    /**
     * Clear current session
     */
    fun clearSession() {
        val editor = prefs.edit()
        editor.clear()
        editor.apply()
    }
    
    /**
     * Get session age in milliseconds
     */
    fun getSessionAge(): Long {
        val loginTime = prefs.getLong(KEY_LOGIN_TIME, 0)
        return System.currentTimeMillis() - loginTime
    }
    
    /**
     * Check if session is about to expire (within 1 hour)
     */
    fun isSessionExpiringSoon(): Boolean {
        val sessionAge = getSessionAge()
        val oneHour = 60 * 60 * 1000L
        return sessionAge > (SESSION_TIMEOUT - oneHour)
    }
}
